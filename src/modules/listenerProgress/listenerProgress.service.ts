import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { Order } from "../order/order.model";
import { paginationHelper } from "../../utils/pafinationHelper";
import ListenerProgress from "./listenerProgress.model";
import { transformBookResponse } from "../book/book.utils";

/**
 * Update (or create) the listener's progress for a specific book.
 * Requires the user to have a paid order for that book.
 */
const updateProgress = async (req: any) => {
  const userId = req.user.id;
  const { bookId, progress, totalDuration } = req.body;

  // Purchase gate – only buyers may track progress
  const purchased = await Order.exists({
    userId,
    "items.book": bookId,
    paymentStatus: "paid",
  });

  if (!purchased) {
    throw new AppError(
      "You must purchase this book before tracking your listening progress",
      httpStatus.FORBIDDEN
    );
  }

  const updateData: Record<string, any> = {
    progress,
    lastListenedAt: new Date(),
  };

  if (totalDuration !== undefined) {
    updateData.totalDuration = totalDuration;
  }

  const result = await ListenerProgress.findOneAndUpdate(
    { user: userId, book: bookId },
    { $set: updateData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate("book", "title author image audio").lean();

  if (result && result.book) {
    result.book = transformBookResponse(result.book, req.user, [bookId]);
  }

  return result;
};

/**
 * Get the progress of the authenticated user for a single book.
 */
const getProgressByBook = async (req: any) => {
  const userId = req.user.id;
  const { bookId } = req.params;

  // lean() bypasses the Book toJSON transform → buyer gets the real audio URL
  const record = await ListenerProgress.findOne({
    user: userId,
    book: bookId,
  })
    .populate("book", "title author image audio")
    .lean();

  if (record && record.book) {
    record.book = transformBookResponse(record.book, req.user, [bookId]);
  }

  return record;
};

/**
 * Get all progress records for the authenticated user with pagination.
 */
const getMyProgress = async (req: any) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;

  const { skip, limit: perPage } = paginationHelper(page, limit);

  const filter = { user: userId };

  const [data, total] = await Promise.all([
    ListenerProgress.find(filter)
      .populate("book", "title author image audio averageRating")
      .lean()
      .skip(skip)
      .limit(perPage)
      .sort({ lastListenedAt: -1 }),
    ListenerProgress.countDocuments(filter),
  ]);

  const dataWithTransformedBooks = data.map((item: any) => {
    if (item.book) {
      item.book = transformBookResponse(item.book, req.user, [item.book._id.toString()]);
    }
    return item;
  });

  return {
    data: dataWithTransformedBooks,
    meta: {
      total,
      page: Number(page),
      limit: perPage,
      totalPage: Math.ceil(total / perPage),
    },
  };
};

export const ListenerProgressService = {
  updateProgress,
  getProgressByBook,
  getMyProgress,
};
