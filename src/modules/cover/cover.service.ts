import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { ICover } from "./cover.interface";
import { Cover } from "./cover.model";
import { deleteFromCloudinary, uploadToCloudinary } from "../../utils/cloudinary";
import { paginationHelper } from "../../utils/pafinationHelper";

/**
 * Create a new Cover entry in the Database (with Cloudinary upload)
 */
const createCoverIntoDB = async (req: any): Promise<ICover> => {
  const payload = req.body;
  const file = req.file;

  if (!file) {
    throw new AppError("Cover image file is required", StatusCodes.BAD_REQUEST);
  }

  // Upload image to Cloudinary
  const uploadResult = await uploadToCloudinary(file.path, "covers");
  if (!uploadResult) {
    throw new AppError("Failed to upload cover image to Cloudinary", StatusCodes.BAD_REQUEST);
  }

  const coverData = {
    ...payload,
    image: {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    },
  };

  const result = await Cover.create(coverData);
  return result;
};

/**
 * Retrieve all Cover entries from the Database with pagination and search
 */
const getAllCoverFromDB = async (query: any) => {
  const {
    page = 1,
    limit = 10,
    search,
  } = query;

  const { skip, limit: perPage } = paginationHelper(page, limit);

  const filter: any = {};

  if (search) {
    const searchRegex = new RegExp(search as string, "i");
    filter.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { edition: searchRegex },
    ];
  }

  const [data, total] = await Promise.all([
    Cover.find(filter)
      .skip(skip)
      .limit(Number(perPage))
      .sort({ createdAt: -1 }),
    Cover.countDocuments(filter),
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

/**
 * Retrieve a single Cover entry
 */
const getSingleCoverFromDB = async (coverId: string): Promise<ICover | null> => {
  const cover = await Cover.findById(coverId);
  if (!cover) {
    throw new AppError("Cover entry not found", StatusCodes.NOT_FOUND);
  }
  return cover;
};

/**
 * Update a specific Cover entry
 */
const updateCoverFromDb = async (
  coverId: string,
  req: any
): Promise<ICover | null> => {
  const isCoverExist = await Cover.findById(coverId);
  if (!isCoverExist) {
    throw new AppError("Cover entry not found", StatusCodes.NOT_FOUND);
  }

  const payload = req.body;
  const file = req.file;
  const updateData: any = { ...payload };

  if (file) {
    // Upload new image to Cloudinary
    const uploadResult = await uploadToCloudinary(file.path, "covers");
    if (!uploadResult) {
      throw new AppError("Failed to upload new cover image to Cloudinary", StatusCodes.BAD_REQUEST);
    }

    updateData.image = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    };
  }

  const result = await Cover.findByIdAndUpdate(coverId, updateData, {
    new: true,
    runValidators: true,
  });

  // If a new image was successfully uploaded, delete the old image from Cloudinary
  if (file && isCoverExist.image?.public_id) {
    await deleteFromCloudinary(isCoverExist.image.public_id, "image").catch((err) => {
      console.error("Failed to delete old image from Cloudinary:", err);
    });
  }

  return result;
};

/**
 * Delete a Cover entry from the Database and Cloudinary
 */
const deleteCoverFromDB = async (coverId: string): Promise<ICover | null> => {
  const isCoverExist = await Cover.findById(coverId);
  if (!isCoverExist) {
    throw new AppError("Cover entry not found", StatusCodes.NOT_FOUND);
  }

  const result = await Cover.findByIdAndDelete(coverId);

  if (result?.image?.public_id) {
    await deleteFromCloudinary(result.image.public_id, "image").catch((err) => {
      console.error("Failed to delete image from Cloudinary upon cover deletion:", err);
    });
  }

  return result;
};

export const coverService = {
  createCoverIntoDB,
  getAllCoverFromDB,
  getSingleCoverFromDB,
  updateCoverFromDb,
  deleteCoverFromDB,
};