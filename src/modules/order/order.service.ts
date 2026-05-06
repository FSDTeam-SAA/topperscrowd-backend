import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { Order } from './order.model';
import Book from '../book/book.model';
import { Cart } from '../cart/cart.model';
import { Coupon } from '../coupon/coupon.model';
import config from '../../config';
import mongoose from 'mongoose';
import axios from 'axios';

const generateAccessToken = async () => {
  const { clientId, clientSecret, mode } = config.paypal;
  if (!clientId || !clientSecret) {
    throw new AppError('PayPal credentials are not configured properly', httpStatus.INTERNAL_SERVER_ERROR);
  }
  const baseURL = mode === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  
  // Debug: check if credentials have any trailing spaces
  console.log(`Debug: PayPal Mode=${mode}, ID Length=${clientId?.length}, Secret Length=${clientSecret?.length}`);
  
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  try {
    const response = await axios.post(`${baseURL}/v1/oauth2/token`, 'grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return { accessToken: response.data.access_token, baseURL };
  } catch (error: any) {
    console.error('PayPal Token Error:', error.response?.data || error.message);
    throw new AppError('Failed to generate PayPal access token', httpStatus.INTERNAL_SERVER_ERROR);
  }
};

const buildCheckoutItems = async (userId: string, bookId?: string, quantity: number = 1, explicitItems?: { bookId: string; quantity: number }[]) => {
  const itemsToCheckout: { book: mongoose.Types.ObjectId; price: number; quantity: number }[] = [];
  let totalAmount = 0;
  const bookIdsToCheck: string[] = [];

  if (explicitItems && explicitItems.length > 0) {
    for (const item of explicitItems) {
      const book = await Book.findById(item.bookId);
      if (!book) throw new AppError(`Book with ID ${item.bookId} not found`, httpStatus.NOT_FOUND);
      if (book.status !== 'active') throw new AppError(`Book '${book.title}' is currently unavailable`, httpStatus.BAD_REQUEST);

      itemsToCheckout.push({
        book: new mongoose.Types.ObjectId(item.bookId),
        price: book.price,
        quantity: item.quantity,
      });
      totalAmount += book.price * item.quantity;
      bookIdsToCheck.push(item.bookId);
    }
  } else if (bookId) {
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

const applyCouponDiscount = async (userId: string, totalAmount: number, couponCode?: string) => {
  if (!couponCode) return { appliedCouponId: undefined, finalTotal: totalAmount, discountAmount: 0 };

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

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (totalAmount * coupon.discountAmount) / 100;
  } else {
    discountAmount = coupon.discountAmount;
  }

  const finalTotal = Math.max(0, totalAmount - discountAmount);
  return { appliedCouponId: coupon._id, finalTotal, discountAmount };
};

const createPayPalOrder = async (
  userId: string,
  payload: { bookId?: string; quantity?: number; items?: { bookId: string; quantity: number }[]; couponCode?: string }
) => {
  const { bookId, quantity = 1, items, couponCode } = payload;

  // 1. Snapshot Prices & Cart Integrity
  const { itemsToCheckout, totalAmount, bookIdsToCheck } = await buildCheckoutItems(userId, bookId, quantity, items);

  // Apply Coupon
  const { appliedCouponId, finalTotal } = await applyCouponDiscount(userId, totalAmount, couponCode);

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
    totalAmount: finalTotal,
    paymentStatus: 'pending',
    appliedCoupon: appliedCouponId,
  });

  // 3. PayPal Order Initiation
  const { accessToken, baseURL } = await generateAccessToken();
  const paypalPayload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: order._id.toString(),
        amount: {
          currency_code: 'USD',
          value: finalTotal.toFixed(2),
        },
      },
    ],
    application_context: {
      landing_page: 'BILLING',
      user_action: 'PAY_NOW',
      return_url: `${config.clientUrl}/payment/success?order_id=${order._id}`,
      cancel_url: `${config.clientUrl}/payment/cancel`,
    },
  };

  try {
    const response = await axios.post(`${baseURL}/v2/checkout/orders`, paypalPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Update order with PayPal Order ID
    order.paypalOrderId = response.data.id;
    await order.save();

    const approveLink = response.data.links.find((link: any) => link.rel === 'approve');

    return {
      checkoutUrl: approveLink ? approveLink.href : null,
      orderId: order._id,
      paypalOrderId: response.data.id,
      totalAmount: order.totalAmount,
    };
  } catch (error: any) {
    // Clean up draft order if PayPal fails
    await Order.findByIdAndDelete(order._id);
    throw new AppError(`Failed to create PayPal order: ${error.response?.data?.message || error.message}`, httpStatus.INTERNAL_SERVER_ERROR);
  }
};

const verifyPayment = async (userId: string, paypalOrderId: string) => {
  const { accessToken, baseURL } = await generateAccessToken();

  let paypalOrderData;
  try {
    // Retrieve the order to check status
    const getOrderResponse = await axios.get(`${baseURL}/v2/checkout/orders/${paypalOrderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    paypalOrderData = getOrderResponse.data;
  } catch (error) {
    throw new AppError('Failed to retrieve PayPal order', httpStatus.BAD_REQUEST);
  }

  const orderId = paypalOrderData.purchase_units[0].reference_id;
  
  if (!orderId) {
    throw new AppError('Order ID not found in PayPal order', httpStatus.BAD_REQUEST);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', httpStatus.NOT_FOUND);
  }

  // Security Verification
  if (order.userId.toString() !== userId.toString()) {
    throw new AppError('Unauthorized verification attempt', httpStatus.UNAUTHORIZED);
  }

  // 4a. Atomic Check (already paid)
  if (order.paymentStatus === 'paid') {
    return { status: 'success', message: 'Payment was already verified' };
  }

  // 4b. Verify PayPal Status and Capture if needed
  if (paypalOrderData.status === 'APPROVED') {
    try {
      const captureResponse = await axios.post(`${baseURL}/v2/checkout/orders/${paypalOrderId}/capture`, {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (captureResponse.data.status === 'COMPLETED') {
        const transactionId = captureResponse.data.purchase_units[0].payments.captures[0].id;
        await finalizeOrder(order, transactionId);
        return { status: 'success', message: 'Payment successful' };
      } else {
        throw new AppError('Payment capture failed', httpStatus.BAD_REQUEST);
      }
    } catch (error) {
       throw new AppError('Failed to capture PayPal payment', httpStatus.INTERNAL_SERVER_ERROR);
    }
  } else if (paypalOrderData.status === 'COMPLETED') {
    // Already captured
    const transactionId = paypalOrderData.purchase_units[0].payments.captures[0].id;
    await finalizeOrder(order, transactionId);
    return { status: 'success', message: 'Payment successful' };
  } else {
    throw new AppError('Payment not completed', httpStatus.BAD_REQUEST);
  }
};

/**
 * Shared finalization logic for both synchronous verification and async cron job
 */
const finalizeOrder = async (order: any, transactionId: string) => {
  // 1. Atomic Idempotency Check
  // We only proceed if the status is currently 'pending'. This prevents race conditions between Cron and Manual verify.
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: 'pending' },
    {
      $set: {
        paymentStatus: 'paid',
        transactionId: transactionId
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
  createPayPalOrder,
  verifyPayment,
  finalizeOrder, // exported for cron job
  getMyOrders,
  getOrderById,
};