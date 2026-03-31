import mongoose from "mongoose";
import AppError from "../../errors/AppError";
import { deleteFromCloudinary, uploadToCloudinary } from "../../utils/cloudinary";
import { paginationHelper } from "../../utils/pafinationHelper";
import { IBookCategory, IBookCategoryUpdate } from "./bookCategory.interface";
import BookCategory from "./bookCategory.model";

//create a new book category
const createBookCategory = async (req: any) => {

  const payload: IBookCategory = req.body;
  const image = req.file;

  const result = await BookCategory.create(payload);
  if (!result) throw new AppError("Failed to create book category", 400);

  //if image is provided, upload it to cloudinary
  if (image) {
    const imageAsset = await uploadToCloudinary(image.path, "bookCategory");
    if (!imageAsset) throw new AppError("Failed to upload image", 400);

    result.image = {
      public_id: imageAsset.public_id,
      secure_url: imageAsset.secure_url,
    };

    await result.save();
  }


  return result;
};

//get all book categories
const getAllBookCategories = async (req: any) => {
  const {
    page = 1,
    limit = 10,
    search,
    status = "all", // active, inactive, all
    from,   // date range start
    to,     // date range end
  } = req.query;

  const { skip, limit: perPage } = paginationHelper(page, limit);

  // Build filter object
  const filter: any = {};

  // Search (name/title)
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // Status filter
  if (status && status !== "all") {
    // validate status can be "active" or "inactive"  
    if (status !== "active" && status !== "inactive" && status !== "all") {
      throw new AppError("Invalid status. Must be 'active', 'inactive', or 'all'", 400);
    }
    filter.isActive = status == "active" ? true : false;
  }

  // Date range filter
  if (from || to) {
    const isValidDate = (date: string) => {
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

    // Optional: prevent wrong range
    if (from && to && new Date(from) > new Date(to)) {
      throw new AppError("'from' date cannot be greater than 'to' date", 400);
    }

    filter.createdAt = {};

    if (from) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = fromDate;
    }

    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999); // include full day
      filter.createdAt.$lte = toDate;
    }
  }

  // Query with pagination
  const [data, total] = await Promise.all([
    BookCategory.find(filter)
      .skip(skip)
      .limit(perPage)
      .sort({ createdAt: -1 }), // latest first
    BookCategory.countDocuments(filter),
  ]);

  return {
    data,
    meta: {
      page: Number(page),
      limit: Number(perPage),
      total,
      totalPage: Math.ceil(total / perPage),
    },
  };
};

//get a single book category by id
const getBookCategoryById = async (req: any) => {
  const { bookcategoryId } = req.params;

  if (!mongoose.isValidObjectId(bookcategoryId)) throw new AppError("Invalid book category id", 400);

  const result = await BookCategory.findById(bookcategoryId);
  if (!result) throw new AppError("Book category not found", 404);

  return result;
};

//update a book category by id
const updateBookCategoryById = async (req: any) => {
  const { bookcategoryId } = req.params;
  const payload: IBookCategoryUpdate = req.body;
  const image = req.file;

  const result = await BookCategory.findByIdAndUpdate(bookcategoryId, payload, { new: true });
  if (!result) throw new AppError("Book category not found", 404);

  //if image is provided, upload it to cloudinary
  if (image) {
    //delete old image from cloudinary if exists
    if (result.image?.public_id) await deleteFromCloudinary(result.image.public_id, "image");


    //upload new image to cloudinary
    const imageAsset = await uploadToCloudinary(image.path, "bookCategory");
    if (!imageAsset) throw new AppError("Failed to upload image", 400);

    result.image = {
      public_id: imageAsset.public_id,
      secure_url: imageAsset.secure_url,
    };

    await result.save();
  }

  return result;
};

//delete a book category by id
const deleteBookCategoryById = async (req: any) => {
  const { bookcategoryId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(bookcategoryId)) throw new AppError("Invalid book category ID", 400);


  const result = await BookCategory.findByIdAndDelete(bookcategoryId);
  if (!result) throw new AppError("Book category not found", 404);

  if (result.image?.public_id) await deleteFromCloudinary(result.image.public_id, "image");
};

const bookCategoryService = {
  createBookCategory,
  getAllBookCategories,
  getBookCategoryById,
  updateBookCategoryById,
  deleteBookCategoryById,
};

export default bookCategoryService;
