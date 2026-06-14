import axios from 'axios';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import config from '../../config';
import AppError from '../../errors/AppError';
import Book from '../book/book.model';
import { Cart } from '../cart/cart.model';
import { CartService } from '../cart/cart.service';
import { Coupon } from '../coupon/coupon.model';
import { Ebook } from '../ebook/ebook.model';
import { IOrderItem, TOrderProductType } from './order.interface';
import { Order } from './order.model';

export type TCheckoutPayloadItem = {
  bookId?: string;
  ebookId?: string;
  quantity?: number;
};

type TNormalizedCheckoutItem = {
  productType: TOrderProductType;
  productId: string;
  quantity: number;
};

type TOwnershipCheck = {
  bookIdsToCheck: string[];
  ebookIdsToCheck: string[];
};

const generateAccessToken = async () => {
  const { clientId, clientSecret, mode } = config.paypal;
  if (!clientId || !clientSecret) {
    throw new AppError('PayPal credentials are not configured properly', httpStatus.INTERNAL_SERVER_ERROR);
  }
  const baseURL = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

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

const normalizeCheckoutItems = (items: TCheckoutPayloadItem[]): TNormalizedCheckoutItem[] => {
  const aggregatedItems = new Map<string, TNormalizedCheckoutItem>();

  for (const item of items) {
    if (item.bookId && item.ebookId) {
      throw new AppError('Each checkout item can include only one of bookId or ebookId', httpStatus.BAD_REQUEST);
    }

    const quantity = item.quantity ?? 1;
    const productType: TOrderProductType = item.ebookId ? 'ebook' : 'book';
    const productId = item.ebookId || item.bookId;

    if (!productId) {
      throw new AppError('Each checkout item must include either bookId or ebookId', httpStatus.BAD_REQUEST);
    }

    const key = `${productType}:${productId}`;
    const existing = aggregatedItems.get(key);
    if (existing) {
      existing.quantity += quantity;
    } else {
      aggregatedItems.set(key, { productType, productId, quantity });
    }
  }

  return Array.from(aggregatedItems.values());
};

const getOrderItemProductType = (item: any): TOrderProductType => {
  if (item.productType === 'ebook' || item.ebook) return 'ebook';
  return 'book';
};

export const buildCheckoutItems = async (
  userId: string,
  payload: { bookId?: string; ebookId?: string; quantity?: number; items?: TCheckoutPayloadItem[] } = {}
) => {
  const itemsToCheckout: IOrderItem[] = [];
  let totalAmount = 0;
  const ownershipCheck: TOwnershipCheck = {
    bookIdsToCheck: [],
    ebookIdsToCheck: [],
  };

  if (payload.items && payload.items.length > 0) {
    const normalizedItems = normalizeCheckoutItems(payload.items);

    for (const item of normalizedItems) {
      if (item.productType === 'ebook') {
        const ebook = await Ebook.findById(item.productId);
        if (!ebook) throw new AppError(`Ebook with ID ${item.productId} not found`, httpStatus.NOT_FOUND);
        if (ebook.status !== 'active') throw new AppError(`Ebook '${ebook.title}' is currently unavailable`, httpStatus.BAD_REQUEST);

        itemsToCheckout.push({
          productType: 'ebook',
          ebook: new mongoose.Types.ObjectId(item.productId),
          price: ebook.price,
          quantity: item.quantity,
        });
        totalAmount += ebook.price * item.quantity;
        ownershipCheck.ebookIdsToCheck.push(item.productId);
      } else {
        const book = await Book.findById(item.productId);
        if (!book) throw new AppError(`Book with ID ${item.productId} not found`, httpStatus.NOT_FOUND);
        if (book.status !== 'active') throw new AppError(`Book '${book.title}' is currently unavailable`, httpStatus.BAD_REQUEST);

        itemsToCheckout.push({
          productType: 'book',
          book: new mongoose.Types.ObjectId(item.productId),
          price: book.price,
          quantity: item.quantity,
        });
        totalAmount += book.price * item.quantity;
        ownershipCheck.bookIdsToCheck.push(item.productId);
      }
    }
  } else if (payload.bookId || payload.ebookId) {
    if (payload.bookId && payload.ebookId) {
      throw new AppError('Provide only one of bookId or ebookId', httpStatus.BAD_REQUEST);
    }

    const productType: TOrderProductType = payload.ebookId ? 'ebook' : 'book';
    const productId = payload.ebookId || payload.bookId;
    const quantity = payload.quantity ?? 1;

    if (!productId) {
      throw new AppError('Provide either bookId or ebookId', httpStatus.BAD_REQUEST);
    }

    if (productType === 'ebook') {
      const ebook = await Ebook.findById(productId);
      if (!ebook) throw new AppError('Ebook not found', httpStatus.NOT_FOUND);
      if (ebook.status !== 'active') throw new AppError('This ebook is currently unavailable for purchase', httpStatus.BAD_REQUEST);

      itemsToCheckout.push({
        productType: 'ebook',
        ebook: new mongoose.Types.ObjectId(productId),
        price: ebook.price,
        quantity,
      });
      totalAmount = ebook.price * quantity;
      ownershipCheck.ebookIdsToCheck.push(productId);
    } else {
      const book = await Book.findById(productId);
      if (!book) throw new AppError('Book not found', httpStatus.NOT_FOUND);
      if (book.status !== 'active') throw new AppError('This book is currently unavailable for purchase', httpStatus.BAD_REQUEST);

      itemsToCheckout.push({
        productType: 'book',
        book: new mongoose.Types.ObjectId(productId),
        price: book.price,
        quantity,
      });
      totalAmount = book.price * quantity;
      ownershipCheck.bookIdsToCheck.push(productId);
    }
  } else {
    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) {
      throw new AppError('Cart is empty', httpStatus.BAD_REQUEST);
    }

    const populatedCart = await CartService.populateCartProducts(cart);

    for (const item of populatedCart.items) {
      const productType = CartService.getCartItemProductType(item);
      const productData = CartService.getCartItemProduct(item);

      if (!productData || productData.status !== 'active') {
        throw new AppError(`'${productData?.title || 'One or more items'}' is no longer available`, httpStatus.BAD_REQUEST);
      }

      if (productType === 'ebook') {
        itemsToCheckout.push({
          productType: 'ebook',
          ebook: new mongoose.Types.ObjectId(String(productData._id)),
          price: productData.price,
          quantity: item.quantity,
        });
        ownershipCheck.ebookIdsToCheck.push(productData._id.toString());
      } else {
        itemsToCheckout.push({
          productType: 'book',
          book: new mongoose.Types.ObjectId(String(productData._id)),
          price: productData.price,
          quantity: item.quantity,
        });
        ownershipCheck.bookIdsToCheck.push(productData._id.toString());
      }

      totalAmount += productData.price * item.quantity;
    }
  }

  return {
    itemsToCheckout,
    totalAmount: Number(totalAmount.toFixed(2)),
    ...ownershipCheck,
  };
};

export const applyCouponDiscount = async (userId: string, totalAmount: number, couponCode?: string) => {
  if (!couponCode) return { appliedCouponId: undefined, finalTotal: totalAmount, discountAmount: 0 };

  const coupon = await Coupon.findOne({ codeName: couponCode.toUpperCase(), assignedTo: userId });
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

  discountAmount = Math.min(discountAmount, totalAmount);
  discountAmount = Number(discountAmount.toFixed(2));

  const finalTotal = Number((totalAmount - discountAmount).toFixed(2));
  return { appliedCouponId: coupon._id, finalTotal, discountAmount };
};

const assertNotAlreadyPurchased = async (
  userId: string,
  bookIdsToCheck: string[],
  ebookIdsToCheck: string[]
) => {
  const duplicateConditions = [];

  if (bookIdsToCheck.length) {
    duplicateConditions.push({ 'items.book': { $in: bookIdsToCheck } });
  }

  if (ebookIdsToCheck.length) {
    duplicateConditions.push({ 'items.ebook': { $in: ebookIdsToCheck } });
  }

  if (!duplicateConditions.length) return;

  const existingOrder = await Order.findOne({
    userId,
    paymentStatus: 'paid',
    $or: duplicateConditions,
  });

  if (existingOrder) {
    throw new AppError('You have already purchased one or more of these items', httpStatus.BAD_REQUEST);
  }
};

const createPayPalOrder = async (
  userId: string,
  payload: { bookId?: string; ebookId?: string; quantity?: number; items?: TCheckoutPayloadItem[]; couponCode?: string }
) => {
  const { couponCode, ...checkoutPayload } = payload;

  const { itemsToCheckout, totalAmount, bookIdsToCheck, ebookIdsToCheck } = await buildCheckoutItems(userId, checkoutPayload);
  const { appliedCouponId, finalTotal } = await applyCouponDiscount(userId, totalAmount, couponCode);

  await assertNotAlreadyPurchased(userId, bookIdsToCheck, ebookIdsToCheck);

  const order = await Order.create({
    userId,
    items: itemsToCheckout,
    totalAmount: finalTotal,
    paymentStatus: 'pending',
    appliedCoupon: appliedCouponId,
  });

  if (finalTotal === 0) {
    await finalizeOrder(order, `FREE_ORDER_${order._id.toString()}`);
    return {
      checkoutUrl: null,
      orderId: order._id,
      paypalOrderId: null,
      totalAmount: finalTotal,
      paymentRequired: false,
      message: 'Order completed without PayPal because the final total is 0',
    };
  }

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
        custom_id: order._id.toString(),
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

    order.paypalOrderId = response.data.id;
    await order.save();

    const approveLink = response.data.links.find((link: any) => link.rel === 'approve');

    return {
      checkoutUrl: approveLink ? approveLink.href : null,
      orderId: order._id,
      paypalOrderId: response.data.id,
      totalAmount: order.totalAmount,
      paymentRequired: true,
    };
  } catch (error: any) {
    await Order.findByIdAndDelete(order._id);
    throw new AppError(`Failed to create PayPal order: ${error.response?.data?.message || error.message}`, httpStatus.INTERNAL_SERVER_ERROR);
  }
};

const verifyPayment = async (userId: string, paypalOrderId: string) => {
  const { accessToken, baseURL } = await generateAccessToken();

  let paypalOrderData;
  try {
    const getOrderResponse = await axios.get(`${baseURL}/v2/checkout/orders/${paypalOrderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    paypalOrderData = getOrderResponse.data;
  } catch (error) {
    throw new AppError('Failed to retrieve PayPal order', httpStatus.BAD_REQUEST);
  }

  const orderId = paypalOrderData.purchase_units?.[0]?.reference_id;

  if (!orderId) {
    throw new AppError('Order ID not found in PayPal order', httpStatus.BAD_REQUEST);
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', httpStatus.NOT_FOUND);
  }

  if (order.userId.toString() !== userId.toString()) {
    throw new AppError('Unauthorized verification attempt', httpStatus.UNAUTHORIZED);
  }

  if (order.paypalOrderId && order.paypalOrderId !== paypalOrderId) {
    throw new AppError('PayPal order does not match this checkout', httpStatus.BAD_REQUEST);
  }

  if (order.paymentStatus === 'paid') {
    return { status: 'success', message: 'Payment was already verified' };
  }

  const paypalAmount = Number(paypalOrderData.purchase_units?.[0]?.amount?.value);
  if (Number.isFinite(paypalAmount) && Number(paypalAmount.toFixed(2)) !== Number(order.totalAmount.toFixed(2))) {
    throw new AppError('PayPal amount does not match local order total', httpStatus.BAD_REQUEST);
  }

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
      }

      throw new AppError('Payment capture failed', httpStatus.BAD_REQUEST);
    } catch (error) {
      throw new AppError('Failed to capture PayPal payment', httpStatus.INTERNAL_SERVER_ERROR);
    }
  } else if (paypalOrderData.status === 'COMPLETED') {
    const transactionId = paypalOrderData.purchase_units[0].payments.captures[0].id;
    await finalizeOrder(order, transactionId);
    return { status: 'success', message: 'Payment successful' };
  }

  throw new AppError('Payment not completed', httpStatus.BAD_REQUEST);
};

const finalizeOrder = async (order: any, transactionId: string) => {
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: 'pending' },
    {
      $set: {
        paymentStatus: 'paid',
        transactionId,
      },
    },
    { new: true }
  );

  if (!updatedOrder) return;

  const purchasedBookIds = new Set<string>();
  const purchasedEbookIds = new Set<string>();

  for (const item of updatedOrder.items as any[]) {
    const productType = getOrderItemProductType(item);
    if (productType === 'ebook' && item.ebook) {
      purchasedEbookIds.add(item.ebook.toString());
    } else if (item.book) {
      purchasedBookIds.add(item.book.toString());
    }
  }

  const cart = await Cart.findOne({ user: updatedOrder.userId });
  if (cart) {
    const populatedCart = await CartService.populateCartProducts(cart);
    populatedCart.items = populatedCart.items.filter((item: any) => {
      const productType = CartService.getCartItemProductType(item);
      const productId = CartService.getCartItemProductId(item);

      if (!productId) return false;
      if (productType === 'ebook') return !purchasedEbookIds.has(productId);
      return !purchasedBookIds.has(productId);
    });
    await CartService.recalculateCart(populatedCart);
  }

  for (const item of updatedOrder.items as any[]) {
    const productType = getOrderItemProductType(item);
    if (productType === 'ebook' && item.ebook) {
      await Ebook.findByIdAndUpdate(item.ebook, { $inc: { saleCount: item.quantity } });
    } else if (item.book) {
      await Book.findByIdAndUpdate(item.book, { $inc: { saleCount: item.quantity } });
    }
  }

  if (updatedOrder.appliedCoupon) {
    await Coupon.findByIdAndUpdate(updatedOrder.appliedCoupon, { $inc: { usedCount: 1 } });
  }
};

const getMyOrders = async (userId: string) => {
  return await Order.find({ userId })
    .populate('items.book')
    .populate('items.ebook')
    .sort({ createdAt: -1 });
};

const getOrderById = async (userId: string, orderId: string) => {
  const order = await Order.findOne({ _id: orderId, userId })
    .populate('items.book')
    .populate('items.ebook');
  if (!order) throw new AppError('Order not found', httpStatus.NOT_FOUND);
  return order;
};

const verifyWebhookSignature = async (req: any) => {
  const { accessToken, baseURL } = await generateAccessToken();
  const webhookId = config.paypal.webhookId;

  if (!webhookId) {
    throw new AppError('PAYPAL_WEBHOOK_ID is not configured', httpStatus.INTERNAL_SERVER_ERROR);
  }

  const verificationPayload = {
    transmission_id: req.headers['paypal-transmission-id'],
    transmission_time: req.headers['paypal-transmission-time'],
    cert_url: req.headers['paypal-cert-url'],
    auth_algo: req.headers['paypal-auth-algo'],
    transmission_sig: req.headers['paypal-transmission-sig'],
    webhook_id: webhookId,
    webhook_event: req.body,
  };

  try {
    const response = await axios.post(`${baseURL}/v1/notifications/verify-webhook-signature`, verificationPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.verification_status === 'SUCCESS';
  } catch (error: any) {
    console.error('PayPal Webhook Verification Error:', error.response?.data || error.message);
    return false;
  }
};

const updateOrder = async (orderId: string, payload: any) => {
  const order = await Order.findByIdAndUpdate(orderId, payload, { new: true, runValidators: true });
  if (!order) {
    throw new AppError('Order not found', httpStatus.NOT_FOUND);
  }
  return order;
};

const deleteOrder = async (orderId: string) => {
  const order = await Order.findByIdAndDelete(orderId);
  if (!order) {
    throw new AppError('Order not found', httpStatus.NOT_FOUND);
  }
  return order;
};

export const OrderService = {
  createPayPalOrder,
  verifyPayment,
  finalizeOrder,
  verifyWebhookSignature,
  getMyOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};
