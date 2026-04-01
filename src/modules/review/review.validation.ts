import mongoose from "mongoose";
import { z } from "zod";

const createReviewSchema = z.object({
  body: z.object({
    bookId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid bookId ObjectId",
    }),
    rating: z.number().min(1).max(5),
    comment: z.string().min(1, "Comment is required"),
  }),
});

const updateReviewSchema = z.object({
  body: z.object({
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().min(1).optional(),
  }),
});

export const ReviewValidation = {
  createReviewSchema,
  updateReviewSchema,
};
