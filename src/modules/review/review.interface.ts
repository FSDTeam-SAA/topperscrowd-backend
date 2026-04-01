import mongoose from "mongoose";

export interface IReview {
  bookId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number; // 1 to 5
  comment: string;
  isDeleted: boolean;
}
