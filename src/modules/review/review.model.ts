import { model, Schema } from "mongoose";
import { IReview } from "./review.interface";
import AppError from "../../errors/AppError";

const reviewSchema = new Schema<IReview>(
  {
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple reviews from the same user for the same book
reviewSchema.index({ bookId: 1, userId: 1 }, { unique: true });

const Review = model<IReview>("Review", reviewSchema);

export default Review;
