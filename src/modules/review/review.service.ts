import mongoose from "mongoose";
import AppError from "../../errors/AppError";
import Book from "../book/book.model";
import { paginationHelper } from "../../utils/pafinationHelper";
import Review from "./review.model";
import { Order } from "../order/order.model";
import httpStatus from "http-status";



//create a new review
const createReview = async (req: any) => {
  const { bookId, rating, comment } = req.body;

  const userId = req.user.id;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Check if book exists
    const book = await Book.findById(bookId).session(session);
    if (!book) throw new AppError("Book not found", 404);

    // Check if user has purchased the book
    const hasPurchased = await Order.findOne({
      userId,
      "items.book": bookId,
      paymentStatus: "paid",
    }).session(session);

    if (!hasPurchased) {
      throw new AppError("You must purchase this book before you can review it", httpStatus.FORBIDDEN);
    }

    // chaeck if user has already reviewed the book
    const existingReview = await Review.findOne({ bookId, userId, isDeleted: false }).session(session);
    if (existingReview) throw new AppError("You have already reviewed this book", 400);

    // Create review
    const [result] = await Review.create([{ bookId, userId, rating, comment }], { session });

    // Add review ID to book's reviews array
    await Book.findByIdAndUpdate(bookId, {
      $addToSet: { reviews: result._id },
    }).session(session);

    // Update book rating stats
    await updateBookRating(new mongoose.Types.ObjectId(bookId), session);

    await session.commitTransaction();
    session.endSession();

    return result;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};


/**
 * Recalculate average rating for a book.
 */
const updateBookRating = async (bookId: mongoose.Types.ObjectId, session?: mongoose.ClientSession) => {
  const stats = await Review.aggregate([
    { $match: { bookId, isDeleted: false } },
    {
      $group: {
        _id: "$bookId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]).session(session as any);

  if (stats.length > 0) {
    await Book.findByIdAndUpdate(bookId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    }).session(session as any);
  } else {
    await Book.findByIdAndUpdate(bookId, {
      averageRating: 0,
      totalReviews: 0,
    }).session(session as any);
  }
};


const getReviewsByBook = async (req: any) => {
  const { bookId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const { skip } = paginationHelper(page, limit);

  const filter = { bookId, isDeleted: false };
  const [data, total] = await Promise.all([
    Review.find(filter)
      .populate("userId", "firstName lastName image")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),
    Review.countDocuments(filter),
  ]);

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPage: Math.ceil(total / Number(limit)),
    },
  };
};

const updateReview = async (req: any) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    console.log(req.user);

    // Find review and ensure it belongs to the user
    const isOwner = await Review.findOne({ _id: reviewId, userId, isDeleted: false }).session(session);
    if (!isOwner) throw new AppError("You can't update this review", 404);

    const review = await Review.findOne({ _id: reviewId, userId, isDeleted: false }).session(session);
    if (!review) throw new AppError("You can't update other user's review", 404);

    if (rating) review.rating = rating;
    if (comment) review.comment = comment;

    await review.save({ session });

    // Update book rating stats
    await updateBookRating(review.bookId, session);

    await session.commitTransaction();
    session.endSession();

    return review;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const deleteReview = async (req: any) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    console.log(req.user);

    const review = await Review.findOneAndDelete({ _id: reviewId, userId }).session(session);
    if (!review) throw new AppError("Review not found or you can't delete this review", 404);

    

    // Remove review ID from book's reviews array
    await Book.findByIdAndUpdate(review.bookId, {
      $pull: { reviews: reviewId },
    }).session(session);

    // Update book rating stats
    await updateBookRating(review.bookId, session);

    await session.commitTransaction();
    session.endSession();

    return null;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const reviewService = {
  createReview,
  getReviewsByBook,
  updateReview,
  deleteReview,
};
