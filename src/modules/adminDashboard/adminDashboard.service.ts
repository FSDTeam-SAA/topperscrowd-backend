import { User } from '../user/user.model';
import { Order } from '../order/order.model';
import Review from '../review/review.model';
import Book from '../book/book.model';
import { paginationHelper } from '../../utils/pafinationHelper';

const getRecentOrdersAndStats = async (query: Record<string, unknown>) => {
  const { page = 1, limit = 10 } = query;
  const { skip, limit: perPage } = paginationHelper(page as string, limit as string);

  const [totalUsers, totalOrders, totalReviews, revenueResult, recentOrders] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Order.countDocuments({ paymentStatus: 'paid' }),
    Review.countDocuments({ isDeleted: false }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]),
    Order.find({ paymentStatus: 'paid' })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage)
  ]);

  const totalRevenue = revenueResult.length > 0 ? Number(revenueResult[0].totalRevenue.toFixed(2)) : 0;

  return {
    stats: {
      totalUsers,
      totalOrders,
      totalReviews,
      totalRevenue,
    },
    recentOrders,
    meta: {
      page: Number(page),
      limit: perPage,
      totalOrders
    }
  };
};

const getUsersManagement = async (query: Record<string, unknown>) => {
  const { page = 1, limit = 10, search } = query;
  const { skip, limit: perPage } = paginationHelper(page as string, limit as string);

  const filter: any = { role: 'user' };
  if (search) {
    const searchRegex = new RegExp(search as string, 'i');
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex }
    ];
  }

  const [users, totalUsers] = await Promise.all([
    User.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'userId',
          as: 'orders'
        }
      },
      {
        $addFields: {
          totalOrders: {
            $size: {
              $filter: {
                input: '$orders',
                as: 'order',
                cond: { $eq: ['$$order.paymentStatus', 'paid'] }
              }
            }
          }
        }
      },
      { $project: { password: 0, otp: 0, otpExpires: 0, resetPasswordOtp: 0, resetPasswordOtpExpires: 0, orders: 0 } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: perPage }
    ]),
    User.countDocuments(filter)
  ]);

  return {
    data: users,
    meta: {
      total: totalUsers,
      page: Number(page),
      limit: perPage,
      totalPage: Math.ceil(totalUsers / perPage),
    }
  };
};

const getAudioManagement = async (query: Record<string, unknown>) => {
  const { page = 1, limit = 10, search } = query;
  const { skip, limit: perPage } = paginationHelper(page as string, limit as string);

  const filter: any = {};
  if (search) {
    const searchRegex = new RegExp(search as string, 'i');
    filter.$or = [
      { title: searchRegex },
      { author: searchRegex }
    ];
  }

  const [books, total] = await Promise.all([
    Book.find(filter)
      .populate('genre', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage),
    Book.countDocuments(filter)
  ]);

  return {
    data: books,
    meta: {
      total,
      page: Number(page),
      limit: perPage,
      totalPage: Math.ceil(total / perPage),
    }
  };
};

const getReviewsManagement = async (query: Record<string, unknown>) => {
  const { page = 1, limit = 10 } = query;
  const { skip, limit: perPage } = paginationHelper(page as string, limit as string);

  const [reviews, total] = await Promise.all([
    Review.find({ isDeleted: false })
      .populate('userId', 'firstName lastName email')
      .populate('bookId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage),
    Review.countDocuments({ isDeleted: false })
  ]);

  return {
    data: reviews,
    meta: {
      total,
      page: Number(page),
      limit: perPage,
      totalPage: Math.ceil(total / perPage),
    }
  };
};

export const AdminDashboardService = {
  getRecentOrdersAndStats,
  getUsersManagement,
  getAudioManagement,
  getReviewsManagement
};
