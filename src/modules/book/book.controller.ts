import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import bookService from "./book.service";

//create a new book
const createBook = catchAsync(async (req, res) => {
  const result = await bookService.createBook(req);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Book created successfully",
    data: result,
  });
});

//get all books
const getAllBooks = catchAsync(async (req, res) => {
  const { data, meta } = await bookService.getAllBooks(req);
  const message = data.length > 0 ? "Books retrieved successfully" : "No books found";
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: message,
    data: data,
    meta: meta,
  });
});

//get a single book by id
const getSingleBook = catchAsync(async (req, res) => {
  const result = await bookService.getSingleBook(req);
  const message = result ? "Book retrieved successfully" : "Book not found";
  sendResponse(res, {
    statusCode: result ? StatusCodes.OK : StatusCodes.NOT_FOUND,
    success: !!result,
    message: message,
    data: result,
  });
});

//get books by category
const getBooksByCategory = catchAsync(async (req, res) => {
  const { data, meta } = await bookService.getBooksByCategory(req);
  const message = data.length > 0 ? "Books retrieved successfully" : "No books found";
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: message,
    data: data,
    meta: meta,
  });
});

//update a book by id
const updateBook = catchAsync(async (req, res) => {
  const result = await bookService.updateBook(req);
  const message = result ? "Book updated successfully" : "Book not found";
  sendResponse(res, {
    statusCode: result ? StatusCodes.OK : StatusCodes.NOT_FOUND,
    success: !!result,
    message: message,
    data: result,
  });
});

//delete a book by id
const deleteBook = catchAsync(async (req, res) => {
  const result = await bookService.deleteBook(req);
  const message = result ? "Book deleted successfully" : "Book not found";
  sendResponse(res, {
    statusCode: result ? StatusCodes.OK : StatusCodes.NOT_FOUND,
    success: !!result,
    message: message,
    data: result,
  });
});

export const bookController = {
  createBook,
  getAllBooks,
  getSingleBook,
  getBooksByCategory,
  updateBook,
  deleteBook,
};