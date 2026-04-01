import { Router } from "express";
import { reviewController } from "./review.controller";
import { ReviewValidation } from "./review.validation";
import { validateRequest } from "../../middleware/validateRequest";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";

const router = Router();

router.post(
  "/create-review",
  auth(USER_ROLE.USER),
  validateRequest(ReviewValidation.createReviewSchema),
  reviewController.createReview
);

router.get("/:bookId", reviewController.getReviewsByBook);

router.patch(
  "/:reviewId",
  auth(USER_ROLE.USER),
  validateRequest(ReviewValidation.updateReviewSchema),
  reviewController.updateReview
);

router.delete("/:reviewId", auth(USER_ROLE.USER), reviewController.deleteReview);

const reviewRouter = router;
export default reviewRouter;
