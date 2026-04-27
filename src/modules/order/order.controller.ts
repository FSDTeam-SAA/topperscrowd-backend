import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { OrderService } from "./order.service";
import { verifyPayPalWebhookSignature } from "../../utils/paypal";
import config from "../../config";
import { Order } from "./order.model";
import logger from "../../logger";

const createCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const result = await OrderService.createCheckoutSession(userId, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "PayPal order created successfully",
      data: result,
    });
  },
);

// ✅ verifyPayment → capturePayment
const capturePayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { paypalOrderId } = req.body;
  const result = await OrderService.capturePayment(userId, paypalOrderId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const rawBody = (req as any).rawBody as string;

  if (config.nodeEnv !== "development") {
    const isValid = await verifyPayPalWebhookSignature(
      req.headers as Record<string, string>,
      rawBody,
      config.paypal.webhookId,
    );
    if (!isValid) {
      res
        .status(400)
        .json({ success: false, message: "Invalid webhook signature" });
      return;
    }
  }

  // ✅ PayPal কে আগেই 200 দাও — তারপর processing করো
  // এতে PayPal timeout এ retry করবে না
  res.status(200).json({ received: true });

  const event = JSON.parse(rawBody);
  logger.info(`[PayPal Webhook] Event: ${event.event_type}`);

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const resource = event.resource;
    const paypalOrderId = resource?.supplementary_data?.related_ids?.order_id;
    const captureId = resource?.id;

    if (paypalOrderId) {
      const order = await Order.findOne({ paypalOrderId });
      if (order && order.paymentStatus === "pending") {
        await OrderService.finalizeOrder(order, captureId);
        logger.info(`[PayPal Webhook] Finalized: ${order._id}`);
      }
    }
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
  createCheckoutSession,
  capturePayment,
  handleWebhook,
  getMyOrders,
  getOrderById,
  getAllOrders,
  getSingleOrder,
};
