import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { reviewService } from "./review.service";

const createReview = catchAsync(async (req, res) => {
  const result = await reviewService.createReview(req);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

const getReviewsByBook = catchAsync(async (req, res) => {
  const { data, meta } = await reviewService.getReviewsByBook(req);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Reviews retrieved successfully",
    data,
    meta,
  });
});

const updateReview = catchAsync(async (req, res) => {
  const result = await reviewService.updateReview(req);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Review updated successfully",
    data: result,
  });
});

const deleteReview = catchAsync(async (req, res) => {
  await reviewService.deleteReview(req);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Review deleted successfully",
    data: null,
  });
});

export const reviewController = {
  createReview,
  getReviewsByBook,
  updateReview,
  deleteReview,
};
