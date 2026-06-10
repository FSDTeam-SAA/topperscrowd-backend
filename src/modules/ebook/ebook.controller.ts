import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ebookService } from "./ebook.service";
import AppError from "../../errors/AppError";
import logger from "../../logger";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary";

const createEbook = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!files || !files.coverImage || !files.file) {
    throw new AppError("Both cover image and ebook document files are required", StatusCodes.BAD_REQUEST);
  }

  // 1. Upload cover image and ebook file to Cloudinary
  const coverImageResult = await uploadToCloudinary(files.coverImage[0].path, "ebooks/covers");
  const fileResult = await uploadToCloudinary(files.file[0].path, "ebooks/resources");

  // 2. Parse form-data body variables into clean primitives
  const ebookData = {
    ...req.body,
    isPremium: req.body.isPremium === "true" || req.body.isPremium === true,
    coverImage: {
      public_id: coverImageResult.public_id,
      url: coverImageResult.secure_url,
    },
    file: {
      public_id: fileResult.public_id,
      url: fileResult.secure_url,
      fileSize: `${(files.file[0].size / (1024 * 1024)).toFixed(2)} MB`,
    },
  };

  const result = await ebookService.createEbookIntoDB(ebookData);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Ebook created successfully",
    data: result,
  });
});

const getAllEbooks = catchAsync(async (req: Request, res: Response) => {
  const result = await ebookService.getAllEbooksFromDB(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ebooks retrieved successfully",
    data: result,
  });
});

const getSingleEbook = catchAsync(async (req: Request, res: Response) => {
  const { ebookId } = req.params;
  const result = await ebookService.getSingleEbookFromDB(ebookId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ebook retrieved successfully",
    data: result,
  });
});

const updateEbook = catchAsync(async (req: Request, res: Response) => {
  const { ebookId } = req.params;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  const updatedData: Record<string, any> = { ...req.body };

  if (req.body.isPremium !== undefined) {
    updatedData.isPremium = req.body.isPremium === "true" || req.body.isPremium === true;
  }

  // Fetch existing ebook to review current assets for replacement cleanup
  const existingEbook = await ebookService.getSingleEbookFromDB(ebookId);

  // If a new cover image is provided, upload it and clean up the old one
  if (files?.coverImage?.[0]) {
    const coverUpload = await uploadToCloudinary(files.coverImage[0].path, "ebooks/covers");
    updatedData.coverImage = { public_id: coverUpload.public_id, url: coverUpload.secure_url };

    // Background deletion of replaced asset
    deleteFromCloudinary(existingEbook.coverImage.public_id, "image").catch(err => logger.error(err));
  }

  // If a new ebook document file is provided
  if (files?.file?.[0]) {
    const fileUpload = await uploadToCloudinary(files.file[0].path, "ebooks/resources");
    updatedData.file = {
      public_id: fileUpload.public_id,
      url: fileUpload.secure_url,
      fileSize: `${(files.file[0].size / (1024 * 1024)).toFixed(2)} MB`,
    };

    deleteFromCloudinary(existingEbook.file.public_id, "raw").catch(err => logger.error(err));
  }

  const result = await ebookService.updateEbookInDB(ebookId, updatedData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ebook updated successfully",
    data: result,
  });
});

const deleteEbook = catchAsync(async (req: Request, res: Response) => {
  const { ebookId } = req.params;
  const result = await ebookService.deleteEbookFromDB(ebookId);

  if (result) {
    // Clean up cover image from Cloudinary
    if (result.coverImage?.public_id) {
      deleteFromCloudinary(result.coverImage.public_id, "image").catch((err) =>
        logger.error(`Failed to clean coverImage ${result.coverImage.public_id}:`, err)
      );
    }
    // Clean up ebook document file from Cloudinary
    if (result.file?.public_id) {
      deleteFromCloudinary(result.file.public_id, "raw").catch((err) =>
        logger.error(`Failed to clean file ${result.file.public_id}:`, err)
      );
    }
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ebook deleted successfully",
    data: result,
  });
});

const trackDownload = catchAsync(async (req: Request, res: Response) => {
  const { ebookId } = req.params;
  const result = await ebookService.trackEbookDownloadInDB(ebookId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Download metric incremented successfully",
    data: result,
  });
});

export const ebookController = {
  createEbook,
  getAllEbooks,
  getSingleEbook,
  updateEbook,
  deleteEbook,
  trackDownload,
};