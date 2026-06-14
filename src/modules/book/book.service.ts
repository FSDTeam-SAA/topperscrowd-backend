import mongoose from "mongoose";
import AppError from "../../errors/AppError";
import {
  CloudinaryUploadedAsset,
  deleteFromCloudinary,
} from "../../utils/cloudinary";
import { paginationHelper } from "../../utils/pafinationHelper";
import { IBook } from "./book.interface";
import Book from "./book.model";
import { Order } from "../order/order.model";
import { transformBookResponse } from "./book.utils";
import BookCategory from "../bookCategory/bookCategory.model";
import logger from "../../logger";

type UploadedAsset = Pick<CloudinaryUploadedAsset, "public_id" | "resource_type">;

const cleanupUploadedAssets = async (assets: UploadedAsset[]) => {
  await Promise.allSettled(
    assets.map((asset) =>
      deleteFromCloudinary(asset.public_id, asset.resource_type).catch((error) => {
        logger.error(
          { error, publicId: asset.public_id },
          "Failed to clean uploaded Cloudinary asset after rollback"
        );
      })
    )
  );
};

//create a new book
const createBook = async (req: any) => {
  const payload: IBook = req.body;
  const streamedUploads = req.streamedUploads as {
    image?: CloudinaryUploadedAsset;
    audio?: CloudinaryUploadedAsset;
  };
  const uploadedAssets: UploadedAsset[] = req.uploadedCloudinaryAssets || [];

  try {
    if (!streamedUploads?.audio) {
      throw new AppError("Audio file is required", 400);
    }

    const genreExists = await BookCategory.exists({ _id: payload.genre });
    if (!genreExists) {
      throw new AppError("This genre does not exist", 400);
    }

    if (streamedUploads.image) {
      payload.image = {
        public_id: streamedUploads.image.public_id,
        secure_url: streamedUploads.image.secure_url,
      };
    }

    payload.audio = {
      public_id: streamedUploads.audio.public_id,
      secure_url: streamedUploads.audio.secure_url,
    };

    const result = await Book.create(payload);
    if (!result) throw new AppError("Failed to create book", 400);

    return result;
  } catch (error) {
    await cleanupUploadedAssets(uploadedAssets);
    throw error;
  }
};

//get all books
const getAllBooks = async (req: any) => {
  const {
    page = 1,
    limit = 10,
    search,
    status = "all", // active, inactive, all
    from, // date range start
    to, // date range end
    bookcategoryId,
    sort = "ascending", // default ascending
  } = req.query;

  const { skip, limit: perPage } = paginationHelper(page, limit);

  // Build filter object
  const filter: any = {};

  // Search (title/author/description)
  if (search) {
    const searchRegex = new RegExp(search as string, "i");
    filter.$or = [
      { title: searchRegex },
      { author: searchRegex },
      { description: searchRegex },
    ];
  }

  // Status filter
  if (status && status !== "all") {
    if (status !== "active" && status !== "inactive") {
      throw new AppError(
        "Invalid status. Must be 'active', 'inactive', or 'all'",
        400
      );
    }
    filter.status = status;
  }

  // Category filter
  if (bookcategoryId) {
    filter.genre = bookcategoryId;
  }

  // Date range filter
  if (from || to) {
    const isValidDate = (date: any) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    };

    if (from && !isValidDate(from)) {
      throw new AppError(
        "Invalid 'from' date. Format must be YYYY-MM-DD or ISO (e.g., 2024-01-01)",
        400
      );
    }

    if (to && !isValidDate(to)) {
      throw new AppError(
        "Invalid 'to' date. Format must be YYYY-MM-DD or ISO (e.g., 2024-01-01)",
        400
      );
    }

    if (from && to && new Date(from as string) > new Date(to as string)) {
      throw new AppError("'from' date cannot be greater than 'to' date", 400);
    }

    filter.createdAt = {};

    if (from) {
      const fromDate = new Date(from as string);
      fromDate.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = fromDate;
    }

    if (to) {
      const toDate = new Date(to as string);
      toDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = toDate;
    }
  }

  // Sort validation
  if (sort && sort !== "ascending" && sort !== "descending") {
    throw new AppError(
      "Invalid sort value. Must be 'ascending' or 'descending'",
      400
    );
  }

  const sortOrder = sort === "descending" ? -1 : 1;

  // 1. Fetch purchased book IDs for current user
  let purchasedBookIds: string[] = [];
  if (req.user && req.user.role !== 'admin') {
    const purchased = await Order.find({
      userId: req.user.id,
      paymentStatus: 'paid'
    }).distinct('items.book');
    purchasedBookIds = (purchased as any).map((id: any) => id.toString());
  }

  // 2. Query with pagination and performance optimization
  const [data, total] = await Promise.all([
    Book.find(filter)
      .skip(skip)
      .limit(Number(perPage))
      .sort({ createdAt: sortOrder })
      .populate("genre", "title description")
      .lean(), // Use lean for transformation
    Book.countDocuments(filter),
  ]);

  // 3. Transform response based on purchase status
  const transformedData = transformBookResponse(data, req.user, purchasedBookIds);

  return {
    data: transformedData,
    meta: {
      total,
      page: Number(page),
      limit: Number(perPage),
      totalPage: Math.ceil(total / Number(perPage)),
    },
  };
};

//get a single book by id 
const getSingleBook = async (req: any) => {
  const { bookId: id } = req.params;
  const result = await Book.findById(id).populate("genre", "title description").lean();
  
  if (!result) return null;

  // Check purchase status for single book
  let purchasedBookIds: string[] = [];
  if (req.user && req.user.role !== 'admin') {
    const isPurchased = await Order.exists({
      userId: req.user.id,
      'items.book': id,
      paymentStatus: 'paid'
    });
    if (isPurchased) purchasedBookIds = [id];
  }

  return transformBookResponse(result, req.user, purchasedBookIds);
};

//get book by bookcategory
const getBooksByCategory = async (req: any) => {
  const { bookcategoryId: category } = req.params;
  if (!category) throw new AppError("Book category is required in params", 400);
  const { page = 1, limit = 10 } = req.query;
  const { skip } = paginationHelper(page, limit);

  // Check purchase status
  let purchasedBookIds: string[] = [];
  if (req.user && req.user.role !== 'admin') {
    const purchased = await Order.find({
      userId: req.user.id,
      paymentStatus: 'paid'
    }).distinct('items.book');
    purchasedBookIds = (purchased as any).map((id: any) => id.toString());
  }

  const total = await Book.countDocuments({ genre: category });
  const data = await Book.find({ genre: category }).skip(skip).limit(limit).lean();
  
  const transformedData = transformBookResponse(data, req.user, purchasedBookIds);

  const meta = {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPage: Math.ceil(total / Number(limit)),
  };

  return { data: transformedData, meta };
};

//update a book by id
const updateBook = async (req: any) => {
  const { bookId: id } = req.params;
  const payload: Partial<IBook> = req.body;
  const streamedUploads = req.streamedUploads as {
    image?: CloudinaryUploadedAsset;
    audio?: CloudinaryUploadedAsset;
  };
  const uploadedAssets: UploadedAsset[] = req.uploadedCloudinaryAssets || [];
  const replacedAssets: UploadedAsset[] = [];

  try {
    if (!mongoose.isValidObjectId(id)) throw new AppError("Invalid book id", 400);

    const existingBook = await Book.findById(id);
    if (!existingBook) throw new AppError("Book not found", 404);

    if (payload.genre) {
      const genreExists = await BookCategory.exists({ _id: payload.genre });
      if (!genreExists) {
        throw new AppError("This genre does not exist", 400);
      }
    }

    if (streamedUploads?.image) {
      payload.image = {
        public_id: streamedUploads.image.public_id,
        secure_url: streamedUploads.image.secure_url,
      };

      if (existingBook.image?.public_id) {
        replacedAssets.push({
          public_id: existingBook.image.public_id,
          resource_type: "image",
        });
      }
    }

    if (streamedUploads?.audio) {
      payload.audio = {
        public_id: streamedUploads.audio.public_id,
        secure_url: streamedUploads.audio.secure_url,
      };

      if (existingBook.audio?.public_id) {
        replacedAssets.push({
          public_id: existingBook.audio.public_id,
          resource_type: "video",
        });
      }
    }

    const result = await Book.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!result) throw new AppError("Book not found", 404);

    cleanupUploadedAssets(replacedAssets);

    return result;
  } catch (error) {
    await cleanupUploadedAssets(uploadedAssets);
    throw error;
  }
};

//delete a book by id
const deleteBook = async (req: any) => {
  const { bookId: id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new AppError("Invalid book id", 400);

  const result = await Book.findByIdAndDelete(id);
  if (!result) throw new AppError("Book not found", 404);

  const assetsToDelete: UploadedAsset[] = [];
  if (result.image?.public_id) {
    assetsToDelete.push({ public_id: result.image.public_id, resource_type: "image" });
  }
  if (result.audio?.public_id) {
    assetsToDelete.push({ public_id: result.audio.public_id, resource_type: "video" });
  }

  cleanupUploadedAssets(assetsToDelete);

  return result._id;
};
const bookService = {
  createBook,
  getAllBooks,
  getSingleBook,
  getBooksByCategory,
  updateBook,
  deleteBook,
};

export default bookService;
