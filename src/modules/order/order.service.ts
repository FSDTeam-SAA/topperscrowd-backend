import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { Order } from "./order.model";
import Book from "../book/book.model";
import { Cart } from "../cart/cart.model";
import { Coupon } from "../coupon/coupon.model";
import mongoose from "mongoose";
import { paginationHelper } from "../../utils/pafinationHelper";
import { paypalRequest } from "../../utils/paypal";
import config from "../../config";

// ─── Helpers (unchanged from Stripe version) ────────────────────────────────

const buildCheckoutItems = async (
  userId: string,
  bookId?: string,
  quantity: number = 1,
) => {
  const itemsToCheckout: {
    book: mongoose.Types.ObjectId;
    price: number;
    quantity: number;
  }[] = [];
  let totalAmount = 0;
  const bookIdsToCheck: string[] = [];

  if (bookId) {
    const book = await Book.findById(bookId);
    if (!book) throw new AppError("Book not found", httpStatus.NOT_FOUND);
    if (book.status !== "active")
      throw new AppError(
        "This book is currently unavailable for purchase",
        httpStatus.BAD_REQUEST,
      );

    itemsToCheckout.push({
      book: new mongoose.Types.ObjectId(bookId),
      price: book.price,
      quantity,
    });
    totalAmount = book.price * quantity;
    bookIdsToCheck.push(bookId);
  } else {
    const cart = await Cart.findOne({ user: userId }).populate("items.book");
    if (!cart || cart.items.length === 0)
      throw new AppError("Cart is empty", httpStatus.BAD_REQUEST);

    for (const item of cart.items) {
      const bookData = item.book as any;
      if (!bookData || bookData.status !== "active") {
        throw new AppError(
          `'${bookData?.title || "One or more items"}' is no longer available`,
          httpStatus.BAD_REQUEST,
        );
      }
      itemsToCheckout.push({
        book: new mongoose.Types.ObjectId(String(bookData._id)),
        price: bookData.price,
        quantity: item.quantity,
      });
      totalAmount += bookData.price * item.quantity;
      bookIdsToCheck.push(bookData._id.toString());
    }
  }

  return { itemsToCheckout, totalAmount, bookIdsToCheck };
};

const applyCouponDiscount = async (
  userId: string,
  couponCode?: string,
): Promise<{
  appliedCouponId?: mongoose.Types.ObjectId;
  discountAmount: number;
}> => {
  if (!couponCode) return { appliedCouponId: undefined, discountAmount: 0 };

  const coupon = await Coupon.findOne({
    codeName: couponCode,
    assignedTo: userId,
  });
  if (!coupon)
    throw new AppError("Invalid coupon code", httpStatus.BAD_REQUEST);
  if (coupon.expiryDate < new Date())
    throw new AppError("Coupon has expired", httpStatus.BAD_REQUEST);
  if (coupon.usedCount >= coupon.usesLimit)
    throw new AppError("Coupon usage limit reached", httpStatus.BAD_REQUEST);

  return {
    appliedCouponId: coupon._id as mongoose.Types.ObjectId,
    discountAmount: coupon.discountAmount,
  };
};

// ─── Core Services ───────────────────────────────────────────────────────────

const createCheckoutSession = async (
  userId: string,
  payload: { bookId?: string; quantity?: number; couponCode?: string },
) => {
  const { bookId, quantity = 1, couponCode } = payload;

  const { itemsToCheckout, totalAmount, bookIdsToCheck } =
    await buildCheckoutItems(userId, bookId, quantity);

  const { appliedCouponId, discountAmount } = await applyCouponDiscount(
    userId,
    couponCode,
  );

  // Duplicate ownership check
  const existingOrder = await Order.findOne({
    userId,
    "items.book": { $in: bookIdsToCheck },
    paymentStatus: "paid",
  });
  if (existingOrder) {
    throw new AppError(
      "You have already purchased one or more of these books",
      httpStatus.BAD_REQUEST,
    );
  }

  // ✅ Final amount after coupon (PayPal এ coupon object নেই, amount এ কাটতে হয়)
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  // Draft order create
  const order = await Order.create({
    userId,
    items: itemsToCheckout,
    totalAmount: finalAmount,
    paymentStatus: "pending",
    appliedCoupon: appliedCouponId,
  });

  // ✅ PayPal order create
  const paypalOrder = await paypalRequest<{
    id: string;
    links: { href: string; rel: string }[];
  }>("POST", "/v2/checkout/orders", {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: order._id.toString(),
        custom_id: userId,
        amount: {
          currency_code: "USD",
          value: finalAmount.toFixed(2),
        },
        description: `ToppersCrowd — ${itemsToCheckout.length} book(s)`,
      },
    ],
    application_context: {
      return_url: `${config.clientUrl}/payment-success`,
      cancel_url: `${config.clientUrl}/payment/cancel`,
      brand_name: "ToppersCrowd",
      user_action: "PAY_NOW",
    },
  });

  // ✅ paypalOrderId save করা হচ্ছে (Stripe এ stripeSessionId ছিল)
  order.paypalOrderId = paypalOrder.id;
  await order.save();

  const approveLink = paypalOrder.links.find((l) => l.rel === "approve");

  return {
    approveUrl: approveLink?.href, // Client এখানে redirect করবে
    orderId: order._id,
    paypalOrderId: paypalOrder.id,
    totalAmount: finalAmount,
  };
};

// ✅ Client approve করার পরে এই endpoint call হবে
const capturePayment = async (userId: string, paypalOrderId: string) => {
  const order = await Order.findOne({ paypalOrderId, userId });
  if (!order) throw new AppError("Order not found", httpStatus.NOT_FOUND);

  if (order.paymentStatus === "paid") {
    return { status: "success", message: "Payment was already captured" };
  }

  // ✅ PayPal capture API call
  const capture = await paypalRequest<{
    status: string;
    purchase_units: {
      payments: {
        captures: { id: string; status: string }[];
      };
    }[];
  }>("POST", `/v2/checkout/orders/${paypalOrderId}/capture`, {});

  if (capture.status === "COMPLETED") {
    const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    await finalizeOrder(order, captureId);
    return { status: "success", message: "Payment captured successfully" };
  }

  throw new AppError(
    `PayPal capture status: ${capture.status}`,
    httpStatus.BAD_REQUEST,
  );
};

/**
 * Shared finalization logic — used by:
 * 1. capturePayment (normal flow)
 * 2. Webhook handler (PAYMENT.CAPTURE.COMPLETED)
 * 3. Cron job (safety net)
 */
const finalizeOrder = async (order: any, captureId?: string) => {
  // ✅ Atomic idempotency check (Stripe version এর মতোই)
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: "pending" },
    {
      $set: {
        paymentStatus: "paid",
        ...(captureId ? { transactionId: captureId } : {}),
      },
    },
    { new: true },
  );

  if (!updatedOrder) return; // Already processed

  // Cart cleanup
  const purchasedBookIds = new Set(
    order.items.map((item: any) => item.book.toString()),
  );
  const cart = await Cart.findOne({ user: order.userId }).populate(
    "items.book",
  );
  if (cart) {
    cart.items = cart.items.filter(
      (item: any) =>
        item.book && !purchasedBookIds.has(item.book._id.toString()),
    );
    let total = 0;
    cart.items.forEach((item: any) => {
      if (item.book) total += item.book.price * item.quantity;
    });
    cart.totalPrice = total;
    await cart.save();
  }

  // saleCount increment
  for (const item of order.items) {
    await Book.findByIdAndUpdate(item.book, {
      $inc: { saleCount: item.quantity },
    });
  }

  // Coupon usage increment
  if (order.appliedCoupon) {
    await Coupon.findByIdAndUpdate(order.appliedCoupon, {
      $inc: { usedCount: 1 },
    });
  }
};

// ─── Admin / User Query Services (unchanged) ────────────────────────────────

const getMyOrders = async (userId: string) => {
  return await Order.find({ userId })
    .populate("items.book")
    .sort({ createdAt: -1 });
};

const getOrderById = async (userId: string, orderId: string) => {
  const order = await Order.findOne({ _id: orderId, userId }).populate(
    "items.book",
  );
  if (!order) throw new AppError("Order not found", httpStatus.NOT_FOUND);
  return order;
};

const orderBookPopulate = {
  path: "items.book",
  select:
    "_id title description author genre price language publisher publicationYear",
  populate: { path: "genre", select: "title" },
};

const getAllOrders = async (req: any) => {
  const {
    page = 1,
    limit = 10,
    search,
    paymentStatus = "all",
    from,
    to,
    userId,
    sort = "descending",
  } = req.query;

  const { skip, limit: perPage } = paginationHelper(page, limit);
  const filter: any = {};

  if (search) {
    const searchRegex = new RegExp(search as string, "i");
    filter.$or = [
      { paypalOrderId: searchRegex }, // ✅ stripeSessionId → paypalOrderId
      { transactionId: searchRegex },
    ];
  }

  if (paymentStatus && paymentStatus !== "all") {
    const allowedStatuses = ["pending", "paid", "cancelled"];
    if (!allowedStatuses.includes(paymentStatus as string))
      throw new AppError(
        "Invalid paymentStatus. Must be 'pending', 'paid', 'cancelled', or 'all'",
        httpStatus.BAD_REQUEST,
      );
    filter.paymentStatus = paymentStatus;
  }

  if (userId) {
    if (!mongoose.isValidObjectId(userId))
      throw new AppError("Invalid user id", httpStatus.BAD_REQUEST);
    filter.userId = userId;
  }

  if (from || to) {
    const isValidDate = (date: any) => !isNaN(new Date(date).getTime());
    if (from && !isValidDate(from))
      throw new AppError("Invalid 'from' date", httpStatus.BAD_REQUEST);
    if (to && !isValidDate(to))
      throw new AppError("Invalid 'to' date", httpStatus.BAD_REQUEST);
    if (from && to && new Date(from as string) > new Date(to as string))
      throw new AppError(
        "'from' date cannot be greater than 'to' date",
        httpStatus.BAD_REQUEST,
      );

    filter.createdAt = {};
    if (from) {
      const d = new Date(from as string);
      d.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = d;
    }
    if (to) {
      const d = new Date(to as string);
      d.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = d;
    }
  }

  if (sort && sort !== "ascending" && sort !== "descending")
    throw new AppError("Invalid sort value", httpStatus.BAD_REQUEST);

  const sortOrder = sort === "ascending" ? 1 : -1;

  const [data, total] = await Promise.all([
    Order.find(filter)
      .skip(skip)
      .limit(Number(perPage))
      .sort({ createdAt: sortOrder })
      .populate("userId", "name email image role")
      .populate(orderBookPopulate)
      .populate("appliedCoupon")
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(perPage),
      totalPage: Math.ceil(total / Number(perPage)),
    },
  };
};

const getSingleOrder = async (orderId: string) => {
  if (!mongoose.isValidObjectId(orderId))
    throw new AppError("Invalid order id", httpStatus.BAD_REQUEST);
  const order = await Order.findById(orderId)
    .populate("userId", "name email image role")
    .populate(orderBookPopulate)
    .populate("appliedCoupon")
    .lean();
  if (!order) throw new AppError("Order not found", httpStatus.NOT_FOUND);
  return order;
};

export const OrderService = {
  createCheckoutSession,
  capturePayment, // ✅ verifyPayment এর জায়গায়
  finalizeOrder, // cron + webhook reuse করে
  getMyOrders,
  getOrderById,
  getAllOrders,
  getSingleOrder,
};
