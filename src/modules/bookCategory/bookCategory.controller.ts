import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import bookCategoryService from "./bookCategory.service";

const createBookCategory = catchAsync(async (req, res) => {
  const result = await bookCategoryService.createBookCategory(req);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "BookCategory created successfully",
    data: result,
  });
});

export const bookCategoryController = {
  createBookCategory,
};
