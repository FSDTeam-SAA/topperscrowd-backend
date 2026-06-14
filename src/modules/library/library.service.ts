import { Order } from "../order/order.model";
import ListenerProgress from "../listenerProgress/listenerProgress.model";
import Book from "../book/book.model";
import { Ebook } from "../ebook/ebook.model";
import { Favorite } from "../favorite/favorite.model";
import { paginationHelper } from "../../utils/pafinationHelper";
import { transformBookResponse } from "../book/book.utils";
import { transformEbookResponse } from "../ebook/ebook.service";
import mongoose from "mongoose";

const getLibraryStats = async (userId: string) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    purchasedBooks,
    newPurchasedBooks,
    purchasedEbooks,
    newPurchasedEbooks,
    listeningTime,
    listeningTimeThisWeek,
    totalFavorites,
    addedFavorites
  ] = await Promise.all([
    Order.find({ userId: new mongoose.Types.ObjectId(userId), paymentStatus: 'paid' }).distinct('items.book'),
    Order.find({ 
      userId: new mongoose.Types.ObjectId(userId), 
      paymentStatus: 'paid',
      createdAt: { $gte: sevenDaysAgo }
    }).distinct('items.book'),
    Order.find({ userId: new mongoose.Types.ObjectId(userId), paymentStatus: 'paid' }).distinct('items.ebook'),
    Order.find({ 
      userId: new mongoose.Types.ObjectId(userId), 
      paymentStatus: 'paid',
      createdAt: { $gte: sevenDaysAgo }
    }).distinct('items.ebook'),
    ListenerProgress.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, total: { $sum: '$progress' } } }
    ]),
    ListenerProgress.aggregate([
      { $match: { 
        user: new mongoose.Types.ObjectId(userId), 
        updatedAt: { $gte: sevenDaysAgo } 
      } },
      { $group: { _id: null, total: { $sum: '$progress' } } }
    ]),
    Favorite.countDocuments({ user: new mongoose.Types.ObjectId(userId) }),
    Favorite.countDocuments({ 
      user: new mongoose.Types.ObjectId(userId),
      createdAt: { $gte: sevenDaysAgo }
    })
  ]);

  return {
    totalAudiobooks: purchasedBooks.length,
    newAudiobooks: newPurchasedBooks.length,
    totalEbooks: purchasedEbooks.filter(Boolean).length,
    newEbooks: newPurchasedEbooks.filter(Boolean).length,
    totalListeningTime: listeningTime[0]?.total || 0,
    listeningTimeThisWeek: listeningTimeThisWeek[0]?.total || 0,
    favorites: totalFavorites,
    addedFavorites: addedFavorites,
  };
};

const getContinueListening = async (userId: string, user: any) => {
  const result = await ListenerProgress.findOne({ user: new mongoose.Types.ObjectId(userId) })
    .sort({ lastListenedAt: -1 })
    .populate('book')
    .lean();

  if (!result || !result.book) return result;

  // Fetch purchased book IDs for transformation
  let purchasedBookIds: string[] = [];
  if (user.role !== 'admin') {
    const purchased = await Order.find({
      userId: userId,
      paymentStatus: 'paid'
    }).distinct('items.book');
    purchasedBookIds = (purchased as any).map((id: any) => id.toString());
  }

  result.book = transformBookResponse(result.book, user, purchasedBookIds);
  return result;
};

const getRecentPurchases = async (userId: string, user: any) => {
    // Get unique book IDs from the latest paid orders, limit to 6
    const orders = await Order.find({ userId: new mongoose.Types.ObjectId(userId), paymentStatus: 'paid' }).limit(6)
      .sort({ createdAt: -1 })
      .select('items.book')
      .lean();
    
    const uniqueBookIds = new Set<string>();
    for (const order of orders) {
      for (const item of order.items) {
        uniqueBookIds.add(String(item.book));
        if (uniqueBookIds.size >= 6) break;
      }
      if (uniqueBookIds.size >= 6) break;
    }

    const books = await Book.find({ _id: { $in: Array.from(uniqueBookIds) } }).lean();
    
    // Fetch purchased book IDs (user bought these, so they should show audio, but transform handles logic)
    let purchasedBookIds: string[] = [];
    if (user.role !== 'admin') {
      const purchased = await Order.find({
        userId: userId,
        paymentStatus: 'paid'
      }).distinct('items.book');
      purchasedBookIds = (purchased as any).map((id: any) => id.toString());
    }

    return transformBookResponse(books, user, purchasedBookIds);
};

const getMyBooks = async (userId: string, user: any, page: string, limit: string) => {
  const { skip, limit: perPage, page: currentPage } = paginationHelper(page, limit);

  const purchasedBookIds = await Order.find({ 
    userId: new mongoose.Types.ObjectId(userId), 
    paymentStatus: 'paid' 
  }).distinct('items.book');

  const [books, total] = await Promise.all([
    Book.find({ _id: { $in: purchasedBookIds } })
      .skip(skip)
      .limit(perPage)
      .sort({ createdAt: -1 })
      .populate('genre', 'title')
      .lean(),
    Book.countDocuments({ _id: { $in: purchasedBookIds } })
  ]);

  const transformedBooks = transformBookResponse(books, user, (purchasedBookIds as any).map((id: any) => id.toString()));

  return {
    data: transformedBooks,
    meta: {
      total,
      page: currentPage,
      limit: perPage,
      totalPage: Math.ceil(total / perPage),
    },
  };
};

const getMyEbooks = async (userId: string, user: any, page: string, limit: string) => {
  const { skip, limit: perPage, page: currentPage } = paginationHelper(page, limit);

  const purchasedEbookIds = await Order.find({ 
    userId: new mongoose.Types.ObjectId(userId), 
    paymentStatus: 'paid' 
  }).distinct('items.ebook');

  const cleanPurchasedEbookIds = (purchasedEbookIds as any).filter(Boolean);

  const [ebooks, total] = await Promise.all([
    Ebook.find({ _id: { $in: cleanPurchasedEbookIds } })
      .skip(skip)
      .limit(perPage)
      .sort({ createdAt: -1 })
      .populate('category', 'name slug')
      .lean(),
    Ebook.countDocuments({ _id: { $in: cleanPurchasedEbookIds } })
  ]);

  const transformedEbooks = transformEbookResponse(
    ebooks,
    user,
    cleanPurchasedEbookIds.map((id: any) => id.toString())
  );

  return {
    data: transformedEbooks,
    meta: {
      total,
      page: currentPage,
      limit: perPage,
      totalPage: Math.ceil(total / perPage),
    },
  };
};

const libraryService = {
  getLibraryStats,
  getContinueListening,
  getRecentPurchases,
  getMyBooks,
  getMyEbooks,
};

export default libraryService;
