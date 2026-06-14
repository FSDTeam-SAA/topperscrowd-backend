import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ebookService } from "./ebook.service";
import AppError from "../../errors/AppError";
import logger from "../../logger";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary";

type UploadedAsset = {
  public_id: string;
  resource_type: "image" | "video" | "raw";
};

const cleanupCloudinaryAssets = async (assets: UploadedAsset[]) => {
  await Promise.allSettled(
    assets.map((asset) =>
      deleteFromCloudinary(asset.public_id, asset.resource_type).catch((error) => {
        logger.error(
          { error, publicId: asset.public_id },
          "Failed to clean Cloudinary asset"
        );
      })
    )
  );
};

const createEbook = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!files || !files.coverImage || !files.file) {
    throw new AppError("Both cover image and ebook document files are required", StatusCodes.BAD_REQUEST);
  }

  const baseEbookData = {
    ...req.body,
    price: Number(req.body.price ?? 0),
    isPremium: req.body.isPremium === "true" || req.body.isPremium === true,
  };
  const uploadedAssets: UploadedAsset[] = [];

  await ebookService.validateEbookCreate(baseEbookData);

  try {
    const coverImageResult = await uploadToCloudinary(files.coverImage[0].path, "ebooks/covers");
    uploadedAssets.push(coverImageResult);

    const fileResult = await uploadToCloudinary(files.file[0].path, "ebooks/resources");
    uploadedAssets.push(fileResult);

    const ebookData = {
      ...baseEbookData,
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
  } catch (error) {
    await cleanupCloudinaryAssets(uploadedAssets);
    throw error;
  }
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
  if (req.body.price !== undefined) {
    updatedData.price = Number(req.body.price);
  }

  const existingEbook = await ebookService.validateEbookUpdate(ebookId, updatedData);
  const uploadedAssets: UploadedAsset[] = [];
  const replacedAssets: UploadedAsset[] = [];

  try {
    if (files?.coverImage?.[0]) {
      const coverUpload = await uploadToCloudinary(files.coverImage[0].path, "ebooks/covers");
      uploadedAssets.push(coverUpload);

      updatedData.coverImage = { public_id: coverUpload.public_id, url: coverUpload.secure_url };

      if (existingEbook.coverImage?.public_id) {
        replacedAssets.push({
          public_id: existingEbook.coverImage.public_id,
          resource_type: "image",
        });
      }
    }

    if (files?.file?.[0]) {
      const fileUpload = await uploadToCloudinary(files.file[0].path, "ebooks/resources");
      uploadedAssets.push(fileUpload);

      updatedData.file = {
        public_id: fileUpload.public_id,
        url: fileUpload.secure_url,
        fileSize: `${(files.file[0].size / (1024 * 1024)).toFixed(2)} MB`,
      };

      if (existingEbook.file?.public_id) {
        replacedAssets.push({
          public_id: existingEbook.file.public_id,
          resource_type: "raw",
        });
      }
    }

    const result = await ebookService.updateEbookInDB(ebookId, updatedData);
    cleanupCloudinaryAssets(replacedAssets);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Ebook updated successfully",
      data: result,
    });
  } catch (error) {
    await cleanupCloudinaryAssets(uploadedAssets);
    throw error;
  }
});

const deleteEbook = catchAsync(async (req: Request, res: Response) => {
  const { ebookId } = req.params;
  const result = await ebookService.deleteEbookFromDB(ebookId);

  if (result) {
    // Clean up cover image from Cloudinary
    if (result.coverImage?.public_id) {
      cleanupCloudinaryAssets([
        { public_id: result.coverImage.public_id, resource_type: "image" },
      ]);
    }
    // Clean up ebook document file from Cloudinary
    if (result.file?.public_id) {
      cleanupCloudinaryAssets([
        { public_id: result.file.public_id, resource_type: "raw" },
      ]);
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
  const result = await ebookService.trackEbookDownloadInDB(ebookId, req.user);

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
