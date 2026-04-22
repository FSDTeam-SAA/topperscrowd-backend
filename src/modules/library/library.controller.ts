import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import libraryService from "./library.service";

const getLibraryStats = catchAsync(async (req, res) => {
  const result = await libraryService.getLibraryStats(req.user.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Library stats retrieved successfully",
    data: result,
  });
});

const getContinueListening = catchAsync(async (req, res) => {
  const result = await libraryService.getContinueListening(req.user.id, req.user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Continue listening data retrieved successfully",
    data: result,
  });
});

const getRecentPurchases = catchAsync(async (req, res) => {
  const result = await libraryService.getRecentPurchases(req.user.id, req.user);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Recent purchases retrieved successfully",
    data: result,
  });
});

const getMyBooks = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  const { data, meta } = await libraryService.getMyBooks(req.user.id, req.user, page as string, limit as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "My books retrieved successfully",
    data: data,
    meta: meta,
  });
});

export const libraryController = {
  getLibraryStats,
  getContinueListening,
  getRecentPurchases,
  getMyBooks,
};
