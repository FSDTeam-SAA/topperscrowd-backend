import { Router } from "express";
import { bookCategoryController } from "./bookCategory.controller";
import { BookCategoryValidation } from "./bookCategory.validation";
import { validateRequest } from "../../middleware/validateRequest";
import { upload } from "../../middleware/multer.middleware";
import { USER_ROLE } from "../user/user.constant";
import auth from "../../middleware/auth";
// import validateRequest from "../../middleware/validateRequest";
// import { BookCategoryValidation } from "./bookCategory.validation";

const router = Router();

router.post(
  "/create-bookcategory",
  auth(USER_ROLE.ADMIN),
  upload.single("image"),
  validateRequest(BookCategoryValidation.createBookCategorySchema),
  bookCategoryController.createBookCategory
);

router.get("/get-all-bookcategories", auth(), bookCategoryController.getAllBookCategories);

router.get("/get-bookcategory/:bookcategoryId", auth(), bookCategoryController.getBookCategoryById);

router.patch(
  "/update-bookcategory/:bookcategoryId",
  auth(USER_ROLE.ADMIN),
  upload.single("image"),
  validateRequest(BookCategoryValidation.updateBookCategorySchema),
  bookCategoryController.updateBookCategoryById
);

router.delete("/delete-bookcategory/:bookcategoryId", auth(USER_ROLE.ADMIN), bookCategoryController.deleteBookCategoryById);

const bookCategoryRouter = router;
export default bookCategoryRouter;
