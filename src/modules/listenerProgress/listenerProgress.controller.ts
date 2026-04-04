import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ListenerProgressService } from "./listenerProgress.service";

// POST / – update (or create) progress for a book
const updateProgress = catchAsync(async (req, res) => {
  const result = await ListenerProgressService.updateProgress(req);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Listening progress updated successfully",
    data: result,
  });
});

// GET /my-progress – all progress records for current user (paginated)
const getMyProgress = catchAsync(async (req, res) => {
  const { data, meta } = await ListenerProgressService.getMyProgress(req);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message:
      data.length > 0
        ? "Listening progress retrieved successfully"
        : "No listening progress found",
    data,
    meta,
  });
});

// GET /:bookId – progress for a specific book
const getProgressByBook = catchAsync(async (req, res) => {
  const result = await ListenerProgressService.getProgressByBook(req);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result
      ? "Listening progress retrieved successfully"
      : "No progress found for this book",
    data: result,
  });
});

export const ListenerProgressController = {
  updateProgress,
  getMyProgress,
  getProgressByBook,
};
