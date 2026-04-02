import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { Order } from './order.model';
import Book from '../book/book.model';
import { Cart } from '../cart/cart.model';
import { Coupon } from '../coupon/coupon.model';
import Stripe from 'stripe';
import config from '../../config';
import mongoose from 'mongoose';

const stripe = new Stripe(config.stripe.secretKey as string, {
  // @ts-ignore
  apiVersion: '2023-10-16',
});

const buildCheckoutItems = async (userId: string, bookId?: string, quantity: number = 1) => {
  const itemsToCheckout: { book: mongoose.Types.ObjectId; price: number; quantity: number }[] = [];
  let totalAmount = 0;
  const bookIdsToCheck: string[] = [];

  if (bookId) {
    const book = await Book.findById(bookId);
    if (!book) throw new AppError('Book not found', httpStatus.NOT_FOUND);
    if (book.status !== 'active') throw new AppError('This book is currently unavailable for purchase', httpStatus.BAD_REQUEST);

    itemsToCheckout.push({
      book: new mongoose.Types.ObjectId(bookId),
      price: book.price,
      quantity,
    });
    totalAmount = book.price * quantity;
    bookIdsToCheck.push(bookId);
  } else {
    const cart = await Cart.findOne({ user: userId }).populate('items.book');
    if (!cart || cart.items.length === 0) {
      throw new AppError('Cart is empty', httpStatus.BAD_REQUEST);
    }

    for (const item of cart.items) {
      const bookData = item.book as any; // populated book
      if (!bookData || bookData.status !== 'active') {
        throw new AppError(`'${bookData?.title || 'One or more items'}' is no longer available`, httpStatus.BAD_REQUEST);
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

const applyCouponDiscount = async (userId: string, couponCode?: string) => {
  if (!couponCode) return { appliedCouponId: undefined, stripeCouponId: undefined };

  const coupon = await Coupon.findOne({ codeName: couponCode, assignedTo: userId });
  if (!coupon) {
    throw new AppError('Invalid coupon code', httpStatus.BAD_REQUEST);
  }
  if (coupon.expiryDate < new Date()) {
    throw new AppError('Coupon has expired', httpStatus.BAD_REQUEST);
  }
  if (coupon.usedCount >= coupon.usesLimit) {
    throw new AppError('Coupon usage limit reached', httpStatus.BAD_REQUEST);
  }

  let stripeCouponId;
  if (coupon.discountType === 'percentage') {
    const stripeCoupon = await stripe.coupons.create({
      percent_off: coupon.discountAmount,
      duration: 'once',
    });
    stripeCouponId = stripeCoupon.id;
  } else {
    const stripeCoupon = await stripe.coupons.create({
      amount_off: Math.round(coupon.discountAmount * 100),
      currency: 'usd',
      duration: 'once',
    });
    stripeCouponId = stripeCoupon.id;
  }
  return { appliedCouponId: coupon._id, stripeCouponId };
};

const createCheckoutSession = async (
  userId: string,
  payload: { bookId?: string; quantity?: number; couponCode?: string }
) => {
  const { bookId, quantity = 1, couponCode } = payload;

  // 1. Snapshot Prices & Cart Integrity
  const { itemsToCheckout, totalAmount, bookIdsToCheck } = await buildCheckoutItems(userId, bookId, quantity);

  // Apply Coupon
  const { appliedCouponId, stripeCouponId } = await applyCouponDiscount(userId, couponCode);

  // 1a. Duplicate Ownership Check
  const existingOrder = await Order.findOne({
    userId,
    'items.book': { $in: bookIdsToCheck },
    paymentStatus: 'paid',
  });

  if (existingOrder) {
    throw new AppError('You have already purchased one or more of these books', httpStatus.BAD_REQUEST);
  }

  // 2. Draft Phase (Persistent Intent)
  const order = await Order.create({
    userId,
    items: itemsToCheckout,
    totalAmount,
    paymentStatus: 'pending',
    appliedCoupon: appliedCouponId,
  });

  // 3. Stripe Session Initiation
  const lineItems = await Promise.all(itemsToCheckout.map(async (item) => {
    const book = await Book.findById(item.book);
    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: book?.title || 'Audiobook Purchase',
          description: book?.author ? `By ${book.author}` : undefined,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    };
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : undefined,
    mode: 'payment',
    //expires_at: Math.floor(Date.now() / 1000) + (config.cron.orderExpiryMinutes * 60), // Match internal cleanup window
    success_url: `${config.clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.clientUrl}/payment/cancel`,
    client_reference_id: order._id.toString(),
    metadata: {
      userId: userId.toString(),
      orderId: order._id.toString(),
    },
  });

  // Update order with session ID
  order.stripeSessionId = session.id;
  await order.save();

  return {
    checkoutUrl: session.url,
    orderId: order._id,
    stripeSessionId: session.id,
    totalAmount: order.totalAmount,
  };
};

const verifyPayment = async (userId: string, sessionId: string) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  // 7. Security Handshake (Metadata Matching)
  if (session.metadata?.userId !== userId.toString()) {
    throw new AppError('Unauthorized verification attempt', httpStatus.UNAUTHORIZED);
  }

  const orderId = session.metadata?.orderId;

  if (!orderId) {
    throw new AppError('Order ID not found in session metadata', httpStatus.BAD_REQUEST);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', httpStatus.NOT_FOUND);
  }

  // 4a. Atomic Check (already paid)
  if (order.paymentStatus === 'paid') {
    return { status: 'success', message: 'Payment was already verified' };
  }

  // 4b. Verify Stripe Status
  if (session.payment_status === 'paid') {
    await finalizeOrder(order, session);
    return { status: 'success', message: 'Payment successful' };
  } else {
    throw new AppError('Payment not completed', httpStatus.BAD_REQUEST);
  }
};

/**
 * Shared finalization logic for both synchronous verification and async cron job
 */
const finalizeOrder = async (order: any, session: Stripe.Checkout.Session) => {
  // 1. Atomic Idempotency Check
  // We only proceed if the status is currently 'pending'. This prevents race conditions between Cron and Manual verify.
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: 'pending' },
    {
      $set: {
        paymentStatus: 'paid',
        transactionId: session.payment_intent as string
      }
    },
    { new: true }
  );

  if (!updatedOrder) {
    // Order was already processed by another process (e.g., cron or concurrent request)
    return;
  }

  // 6. Handling the Ghost Cart (Data Integrity) explicitly without orderType switch
  const purchasedBookIds = new Set(order.items.map((item: any) => item.book.toString()));

  // We fetch and update the cart manually instead of empty to preserve ghost items natively everywhere
  const cart = await Cart.findOne({ user: order.userId }).populate('items.book');
  if (cart) {
    cart.items = cart.items.filter((item: any) => item.book && !purchasedBookIds.has(item.book._id.toString()));

    // Recalc Total
    let total = 0;
    cart.items.forEach((item: any) => {
      if (item.book) {
        total += item.book.price * item.quantity;
      }
    });
    cart.totalPrice = total;
    await cart.save();
  }

  // 7. Increment Book saleCount
  for (const item of order.items) {
    await Book.findByIdAndUpdate(item.book, { $inc: { saleCount: item.quantity } });
  }
  // 8. Increment Coupon usage if applied
  if (order.appliedCoupon) {
    await Coupon.findByIdAndUpdate(order.appliedCoupon, { $inc: { usedCount: 1 } });
  }
};

const getMyOrders = async (userId: string) => {
  return await Order.find({ userId }).populate('items.book').sort({ createdAt: -1 });
};

const getOrderById = async (userId: string, orderId: string) => {
  const order = await Order.findOne({ _id: orderId, userId }).populate('items.book');
  if (!order) throw new AppError('Order not found', httpStatus.NOT_FOUND);
  return order;
};

export const OrderService = {
  createCheckoutSession,
  verifyPayment,
  finalizeOrder, // exported for cron job
  getMyOrders,
  getOrderById,
};