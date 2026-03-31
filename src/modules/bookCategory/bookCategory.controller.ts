import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import bookCategoryService from "./bookCategory.service";


//create a new book category
const createBookCategory = catchAsync(async (req, res) => {
  const result = await bookCategoryService.createBookCategory(req);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "BookCategory created successfully",
    data: result,
  });
});

//get all book categories
const getAllBookCategories = catchAsync(async (req, res) => {
  const { data, meta } = await bookCategoryService.getAllBookCategories(req);
  const message = data.length > 0 ? "BookCategories retrieved successfully" : "No book categories found";
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "BookCategories retrieved successfully",
    data: data,
    meta: meta
  });
});

//get a single book category by id
const getBookCategoryById = catchAsync(async (req, res) => {
  const result = await bookCategoryService.getBookCategoryById(req);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "BookCategory retrieved successfully",
    data: result,
  });
});

//update a book category by id
const updateBookCategoryById = catchAsync(async (req, res) => {
  const result = await bookCategoryService.updateBookCategoryById(req);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "BookCategory updated successfully",
    data: result,
  });
});

//delete a book category by id
const deleteBookCategoryById = catchAsync(async (req, res) => {
  await bookCategoryService.deleteBookCategoryById(req);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "BookCategory deleted successfully",
  });
});

export const bookCategoryController = {
  createBookCategory,
  getAllBookCategories,
  getBookCategoryById,
  updateBookCategoryById,
  deleteBookCategoryById,
};
