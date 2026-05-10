import { Router } from "express";
import { ReviewValidation } from "./review.validation";
import { validateRequest } from "../../middleware/validateRequest";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";
import { reviewController } from "./review.controller";

const router = Router();

router.post(
  "/create-review",
  // #swagger.tags = ['Reviews']
  // #swagger.summary = 'Create a book review'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["bookId", "rating", "comment"],
          properties: {
            bookId: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            rating: { type: "number", example: 5 },
            comment: { type: "string", example: "Great book!" }
          }
        }
      }
    }
  } */
  auth(USER_ROLE.USER),
  validateRequest(ReviewValidation.createReviewSchema),
  reviewController.createReview
);

router.get(
  "/:bookId",
  // #swagger.tags = ['Reviews']
  // #swagger.summary = 'Get reviews for a book'
  // #swagger.security = []
  reviewController.getReviewsByBook
);

router.patch(
  "/:reviewId",
  // #swagger.tags = ['Reviews']
  // #swagger.summary = 'Update a review'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            rating: { type: "number", example: 4 },
            comment: { type: "string", example: "Updated comment" }
          }
        }
      }
    }
  } */
  auth(USER_ROLE.USER),
  validateRequest(ReviewValidation.updateReviewSchema),
  reviewController.updateReview
);

router.delete(
  "/:reviewId",
  // #swagger.tags = ['Reviews']
  // #swagger.summary = 'Delete a review'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.USER),
  reviewController.deleteReview
);

const reviewRouter = router;
export default reviewRouter;
