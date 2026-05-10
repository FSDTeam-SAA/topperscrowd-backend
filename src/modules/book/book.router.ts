import { Router } from "express";
import { bookController } from "./book.controller";
import { BookValidation } from "./book.validation";
import { validateRequest } from "../../middleware/validateRequest";
import { upload } from "../../middleware/multer.middleware";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";

const router = Router();

router.post(
  "/create-book",
  // #swagger.tags = ['Books']
  // #swagger.summary = 'Create a new audiobook (Admin only)'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "multipart/form-data": {
        schema: {
          type: "object",
          required: ["title", "description", "author", "genre", "price", "language", "publisher", "publicationYear", "audio"],
          properties: {
            title: { type: "string", example: "The Great Gatsby" },
            description: { type: "string", example: "A classic novel" },
            author: { type: "string", example: "F. Scott Fitzgerald" },
            genre: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            price: { type: "number", example: 9.99 },
            language: { type: "string", example: "English" },
            publisher: { type: "string", example: "Kathorian Publishing" },
            publicationYear: { type: "number", example: 2024 },
            image: { type: "string", format: "binary" },
            audio: { type: "string", format: "binary" }
          }
        }
      }
    }
  } */
  auth(USER_ROLE.ADMIN),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  validateRequest(BookValidation.createBookSchema),
  bookController.createBook
);

router.get(
  "/get-all-books",
  // #swagger.tags = ['Books']
  // #swagger.summary = 'Get all books'
  // #swagger.security = []
  bookController.getAllBooks
);

router.get(
  "/get-book/:bookId",
  // #swagger.tags = ['Books']
  // #swagger.summary = 'Get a single book by ID'
  // #swagger.security = []
  bookController.getSingleBook
);

router.get(
  "/get-books-by-category/:bookcategoryId",
  // #swagger.tags = ['Books']
  // #swagger.summary = 'Get books by category ID'
  // #swagger.security = []
  bookController.getBooksByCategory
);

router.patch(
  "/update-book/:bookId",
  // #swagger.tags = ['Books']
  // #swagger.summary = 'Update a book (Admin only)'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "multipart/form-data": {
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            author: { type: "string" },
            genre: { type: "string" },
            price: { type: "number" },
            language: { type: "string" },
            publisher: { type: "string" },
            image: { type: "string", format: "binary" },
            audio: { type: "string", format: "binary" }
          }
        }
      }
    }
  } */
  auth(USER_ROLE.ADMIN),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  validateRequest(BookValidation.updateBookSchema),
  bookController.updateBook
);

router.delete(
  "/delete-book/:bookId",
  // #swagger.tags = ['Books']
  // #swagger.summary = 'Delete a book (Admin only)'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.ADMIN),
  bookController.deleteBook
);

const bookRouter = router;
export default bookRouter;
