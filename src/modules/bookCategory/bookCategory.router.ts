import { Router } from "express";
import { bookCategoryController } from "./bookCategory.controller";
import { BookCategoryValidation } from "./bookCategory.validation";
import { validateRequest } from "../../middleware/validateRequest";
import { upload } from "../../middleware/multer.middleware";
// import validateRequest from "../../middleware/validateRequest";
// import { BookCategoryValidation } from "./bookCategory.validation";

const router = Router();

router.post(
  "/create-bookcategory",
  upload.single("image"),
  validateRequest(BookCategoryValidation.createBookCategorySchema),
  bookCategoryController.createBookCategory
);

const bookCategoryRouter = router;
export default bookCategoryRouter;
