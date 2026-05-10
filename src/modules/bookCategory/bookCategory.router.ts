import { Router } from "express";
import { bookCategoryController } from "./bookCategory.controller";
import { BookCategoryValidation } from "./bookCategory.validation";
import { validateRequest } from "../../middleware/validateRequest";
import { upload } from "../../middleware/multer.middleware";
import { USER_ROLE } from "../user/user.constant";
import auth from "../../middleware/auth";

const router = Router();

router.post(
  "/create-bookcategory",
  // #swagger.tags = ['Book Categories']
  // #swagger.summary = 'Create a new book category (Admin only)'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "multipart/form-data": {
        schema: {
          type: "object",
          required: ["title", "description"],
          properties: {
            title: { type: "string", example: "Fiction" },
            description: { type: "string", example: "Fiction audiobooks" },
            image: { type: "string", format: "binary" }
          }
        }
      }
    }
  } */
  auth(USER_ROLE.ADMIN),
  upload.single("image"),
  validateRequest(BookCategoryValidation.createBookCategorySchema),
  bookCategoryController.createBookCategory
);

router.get(
  "/get-all-bookcategories",
  // #swagger.tags = ['Book Categories']
  // #swagger.summary = 'Get all book categories'
  // #swagger.security = []
  bookCategoryController.getAllBookCategories
);

router.get(
  "/get-bookcategory/:bookcategoryId",
  // #swagger.tags = ['Book Categories']
  // #swagger.summary = 'Get a single book category'
  // #swagger.security = []
  bookCategoryController.getBookCategoryById
);

router.patch(
  "/update-bookcategory/:bookcategoryId",
  // #swagger.tags = ['Book Categories']
  // #swagger.summary = 'Update a book category (Admin only)'
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
            isActive: { type: "boolean" },
            isDeleted: { type: "boolean" },
            image: { type: "string", format: "binary" }
          }
        }
      }
    }
  } */
  auth(USER_ROLE.ADMIN),
  upload.single("image"),
  validateRequest(BookCategoryValidation.updateBookCategorySchema),
  bookCategoryController.updateBookCategoryById
);

router.delete(
  "/delete-bookcategory/:bookcategoryId",
  // #swagger.tags = ['Book Categories']
  // #swagger.summary = 'Delete a book category (Admin only)'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.ADMIN),
  bookCategoryController.deleteBookCategoryById
);

const bookCategoryRouter = router;
export default bookCategoryRouter;
