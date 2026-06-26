import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { OrderService } from './order.service';
import { Order } from './order.model';

const createPayPalOrder = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await OrderService.createPayPalOrder(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'PayPal order created successfully',
    data: result,
  });
});

const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { paypalOrderId } = req.body;
  const result = await OrderService.verifyPayment(userId, paypalOrderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

// Sob kicu thik ache broooooooooo

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await OrderService.getMyOrders(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Orders retrieved successfully',
    data: result,
  });
});

const getMyPaymentHistory = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { data, meta } = await OrderService.getMyPaymentHistory(userId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment history retrieved successfully',
    data,
    meta,
  });
});

const getAllOrdersForAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderService.getAllOrdersForAdmin(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All orders retrieved successfully for admin',
    data: result,
  });
});

const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { orderId } = req.params;
  const result = await OrderService.getOrderById(userId, orderId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order retrieved successfully',
    data: result,
  });
});

// Sob kicu thik ache broooooooooo

const handlePayPalWebhook = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const isValid = await OrderService.verifyWebhookSignature(req);

  if (!isValid) {
    res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Invalid webhook signature' });
    return;
  }

  const event = req.body;
  console.log(`Received PayPal Webhook: ${event.event_type}`);

  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const capture = event.resource;
    const transactionId = capture.id;
    const orderId = capture.custom_id || capture.reference_id;
    
    if (orderId) {
       const order = await Order.findById(orderId);
       if (order && order.paymentStatus === 'pending') {
         await OrderService.finalizeOrder(order, transactionId);
         console.log(`Order ${orderId} finalized via webhook`);
       }
    }
  }

  res.status(httpStatus.OK).json({ success: true });
});

const updateOrder = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const result = await OrderService.updateOrder(orderId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order updated successfully by admin',
    data: result,
  });
});

const deleteOrder = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const result = await OrderService.deleteOrder(orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order deleted successfully by admin',
    data: result,
  });
});

export const OrderController = {
  createPayPalOrder,
  verifyPayment,
  handlePayPalWebhook,
  getMyOrders,
  getMyPaymentHistory,
  getAllOrdersForAdmin,
  getOrderById,
  updateOrder,
  deleteOrder,
};
