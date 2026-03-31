import mongoose from "mongoose";
import AppError from "../../errors/AppError";
import { deleteFromCloudinary, uploadToCloudinary } from "../../utils/cloudinary";
import { paginationHelper } from "../../utils/pafinationHelper";
import { IBook } from "./book.interface";
import Book from "./book.model";
import config from "../../config";

//create a new book
const createBook = async (req: any) => {
  const payload: IBook = req.body;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const result = await Book.create(payload);
  if (!result) throw new AppError("Failed to create book", 400);

  //if image is provided, upload it to cloudinary
  if (files?.image?.[0]) {
    const imageAsset = await uploadToCloudinary(files.image[0].path, "books");
    if (!imageAsset) throw new AppError("Failed to upload image", 400);

    result.image = {
      public_id: imageAsset.public_id,
      secure_url: imageAsset.secure_url,
    };
  }

  //if audio is provided, upload it to cloudinary
  if (files?.audio?.[0]) {
    const audioAsset = await uploadToCloudinary(files.audio[0].path, "books");
    if (!audioAsset) throw new AppError("Failed to upload audio", 400);

    result.audio = {
      public_id: audioAsset.public_id,
      secure_url: audioAsset.secure_url,
    };
  }

  await result.save();

  return result;
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

  // Query with pagination and performance optimization
  const [data, total] = await Promise.all([
    Book.find(filter)
      .skip(skip)
      .limit(Number(perPage))
      .sort({ createdAt: sortOrder }),
    Book.countDocuments(filter),
  ]);

  return {
    data,
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
  const result = await Book.findById(id);
  return result;
};

//get book by bookcategory
const getBooksByCategory = async (req: any) => {
  const { bookcategoryId: category } = req.params;
  if (!category) throw new AppError("Book category is required in params", 400);
  const { page = 1, limit = 10 } = req.query;
  const { skip } = paginationHelper(page, limit);

  const total = await Book.countDocuments({ genre: category });
  const data = await Book.find({ genre: category }).skip(skip).limit(limit);
  const meta = {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPage: Math.ceil(total / Number(limit)),
  };

  return { data, meta };
};

//update a book by id
const updateBook = async (req: any) => {
  const { bookId: id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new AppError("Invalid book id", 400);
  const payload: IBook = req.body;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const result = await Book.findByIdAndUpdate(id, payload, { new: true });
  if (!result) throw new AppError("Book not found", 404);


  // Handle image update and audio update
  if (files?.image?.[0]) {
    // Delete old image from Cloudinary if exists
    if (result.image?.public_id) {
      await deleteFromCloudinary(result.image.public_id, "image");
    }

    const imageAsset = await uploadToCloudinary(files.image[0].path, "books");
    if (!imageAsset) throw new AppError("Failed to upload new image", 400);

    result.image = {
      public_id: imageAsset.public_id,
      secure_url: imageAsset.secure_url,
    };
  }

  if (files?.audio?.[0]) {
    // Delete old audio from Cloudinary if exists
    if (result.audio?.public_id) {
      await deleteFromCloudinary(result.audio.public_id, "video");
    }

    const audioAsset = await uploadToCloudinary(files.audio[0].path, "books");
    if (!audioAsset) throw new AppError("Failed to upload new audio", 400);

    result.audio = {
      public_id: audioAsset.public_id,
      secure_url: audioAsset.secure_url,
    };
  }

  await result.save();

  return result;
};

//delete a book by id
const deleteBook = async (req: any) => {
  const { bookId: id } = req.params;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const book = await Book.findById(id).session(session);
    if (!book) throw new AppError("Book not found", 404);

    await Book.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    session.endSession();

    // Run external cleanup AFTER DB success
    if (book.image?.public_id) {
      const result = await deleteFromCloudinary(book.image.public_id, "image");
      if (config.nodeEnv == "development" && result) console.log("Image deleted from Cloudinary in deleteBook", book.image.public_id);

    }

    if (book.audio?.public_id) {
      const result = await deleteFromCloudinary(book.audio.public_id, "video");
      if (config.nodeEnv == "development" && result) console.log("Audio deleted from Cloudinary in deleteBook", book.audio.public_id);
    }

    return book;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
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
