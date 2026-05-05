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
  auth(USER_ROLE.ADMIN),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  validateRequest(BookValidation.createBookSchema),
  bookController.createBook
);

router.get("/get-all-books", bookController.getAllBooks);

router.get("/get-book/:bookId", bookController.getSingleBook);

router.get(
  "/get-books-by-category/:bookcategoryId",
  bookController.getBooksByCategory
);

router.patch(
  "/update-book/:bookId",
  auth(USER_ROLE.ADMIN),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  validateRequest(BookValidation.updateBookSchema),
  bookController.updateBook
);

router.delete("/delete-book/:bookId", auth(USER_ROLE.ADMIN), bookController.deleteBook);

const bookRouter = router;
export default bookRouter;
