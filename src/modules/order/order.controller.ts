import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { OrderService } from './order.service';

const createCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await OrderService.createCheckoutSession(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Checkout session created successfully',
    data: result,
  });
});

const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { sessionId } = req.body;
  const result = await OrderService.verifyPayment(userId, sessionId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

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

const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { orderId } = req.params;
  const result = await OrderService.getOrderById(userId, orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order retrieved successfully',
    data: result,
  });
});

export const OrderController = {
  createCheckoutSession,
  verifyPayment,
  getMyOrders,
  getOrderById,
};