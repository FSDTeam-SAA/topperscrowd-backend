import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { OrderService } from "./order.service";
import {
  paypalRequest,
  verifyPayPalWebhookSignature,
} from "../../utils/paypal";
import config from "../../config";
import { Order } from "./order.model";
import logger from "../../logger";

const createPayPalOrder = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await OrderService.createPayPalOrder(userId, req.body);

// ✅ verifyPayment → capturePayment
const capturePayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { paypalOrderId } = req.body;
  const result = await OrderService.capturePayment(userId, paypalOrderId);
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

  // ✅ PayPal থেকে order status verify করো — APPROVED কিনা
  const paypalOrder = await paypalRequest<{ status: string }>(
    "GET",
    `/v2/checkout/orders/${token}`,
  );

  // ✅ APPROVED না হলে capture করব না
  if (paypalOrder.status !== "APPROVED") {
    logger.warn(
      `[PayPalReturn] Order not approved. Status: ${paypalOrder.status}, token: ${token}`,
    );
    res.redirect(`${config.clientUrl}/payment/cancel`);
    return;
  }

  const capture = await paypalRequest<{
    status: string;
    purchase_units: {
      payments: {
        captures: { id: string }[];
      };
    }[];
  }>("POST", `/v2/checkout/orders/${token}/capture`, {});

  if (capture.status === "COMPLETED") {
    const captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    await OrderService.finalizeOrder(order, captureId);
    res.redirect(`${config.clientUrl}/payment-success?orderId=${order._id}`);
  } else {
    res.redirect(`${config.clientUrl}/payment/cancel`);
  }
});
const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await OrderService.getMyOrders(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Orders retrieved successfully",
    data: result,
  });
});

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await OrderService.getAllOrders(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:
      data.length > 0 ? "Orders retrieved successfully" : "No orders found",
    data,
    meta,
  });
});

const getSingleOrder = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const result = await OrderService.getSingleOrder(orderId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order retrieved successfully",
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
    message: "Order retrieved successfully",
    data: result,
  });
});

export const OrderController = {
  createPayPalOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  getAllOrders,
  getSingleOrder,
  handlePayPalReturn,
};
