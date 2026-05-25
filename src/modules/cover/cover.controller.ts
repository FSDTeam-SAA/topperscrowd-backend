import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { coverService } from "./cover.service";

/**
 * Handle Cover Creation
 */
const createCover = catchAsync(async (req: Request, res: Response) => {
  const result = await coverService.createCoverIntoDB(req);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Cover entry created successfully",
    data: result,
  });
});

/**
 * Fetch All Covers (with pagination & search)
 */
const getAllCovers = catchAsync(async (req: Request, res: Response) => {
  const result = await coverService.getAllCoverFromDB(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "All covers retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

/**
 * Fetch a Single Cover
 */
const getSingleCover = catchAsync(async (req: Request, res: Response) => {
  const { coverId } = req.params;
  const result = await coverService.getSingleCoverFromDB(coverId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Cover entry retrieved successfully",
    data: result,
  });
});

/**
 * Update Cover Configuration
 */
const updateCover = catchAsync(async (req: Request, res: Response) => {
  const { coverId } = req.params;
  const result = await coverService.updateCoverFromDb(coverId, req);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Cover entry updated successfully",
    data: result,
  });
});

/**
 * Delete Cover and Trigger Cloudinary Cleanup
 */
const deleteCover = catchAsync(async (req: Request, res: Response) => {
  const { coverId } = req.params;
  const result = await coverService.deleteCoverFromDB(coverId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Cover entry deleted successfully",
    data: result,
  });
});

export const coverController = {
  createCover,
  getAllCovers,
  getSingleCover,
  updateCover,
  deleteCover,
};