import cron from 'node-cron';
import { Order } from './order.model';
import { OrderService } from './order.service';
import config from '../../config';
import logger from '../../logger';
import { createCronTask, ITaskResult } from '../../utils/cronRunner';
import axios from 'axios';

/**
 * Advanced Order Cleanup Task for PayPal
 */
const cleanupPendingOrders = createCronTask('OrderCleanup', async (): Promise<ITaskResult> => {
  const result: ITaskResult = { totalScanned: 0, processed: 0, skipped: 0, failed: 0 };
  
  const now = new Date();
  const expiryWindow = config.cron.orderExpiryMinutes * 60 * 1000;
  const maxAgeWindow = config.cron.maxOrderAgeHours * 60 * 60 * 1000;

  const thresholdDate = new Date(now.getTime() - expiryWindow);
  const maxAgeDate = new Date(now.getTime() - maxAgeWindow);

  // 1. Find pending orders within the valid cleanup window
  const pendingOrders = await Order.find({
    paymentStatus: 'pending',
    createdAt: {
      $lte: thresholdDate,
      $gte: maxAgeDate,
    },
    paypalOrderId: { $exists: true, $ne: null },
  });

  result.totalScanned = pendingOrders.length;
  if (pendingOrders.length === 0) return result;

  // Generate PayPal Access Token
  let accessToken, baseURL;
  try {
    const { clientId, clientSecret, mode } = config.paypal;
    baseURL = mode === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const tokenResponse = await axios.post(`${baseURL}/v1/oauth2/token`, 'grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    accessToken = tokenResponse.data.access_token;
  } catch (err: any) {
    logger.error(`[OrderCleanup] Failed to generate PayPal access token:`, err.message);
    return result; // Abort if we can't authenticate
  }

  for (const order of pendingOrders) {
    try {
      if (!order.paypalOrderId) {
        result.skipped++;
        continue;
      }

      const getOrderResponse = await axios.get(`${baseURL}/v2/checkout/orders/${order.paypalOrderId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const paypalOrder = getOrderResponse.data;

      if (paypalOrder.status === 'COMPLETED') {
        const transactionId = paypalOrder.purchase_units[0].payments.captures[0].id;
        await OrderService.finalizeOrder(order, transactionId);
        result.processed++;
      } else if (paypalOrder.status === 'APPROVED') {
        // Attempt to capture it if it's approved but not completed
        try {
          const captureResponse = await axios.post(`${baseURL}/v2/checkout/orders/${order.paypalOrderId}/capture`, {}, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (captureResponse.data.status === 'COMPLETED') {
            const transactionId = captureResponse.data.purchase_units[0].payments.captures[0].id;
            await OrderService.finalizeOrder(order, transactionId);
            result.processed++;
          } else {
             result.skipped++;
          }
        } catch (captureErr) {
           result.failed++;
        }
      } else if (['VOIDED', 'EXPIRED', 'PAYER_ACTION_REQUIRED'].includes(paypalOrder.status)) {
        order.paymentStatus = 'cancelled';
        await order.save();
        result.processed++;
      } else {
        // If it's still CREATED, wait until it expires based on our maxAge logic (or we could cancel it if it's too old)
        if (new Date(paypalOrder.create_time).getTime() < thresholdDate.getTime()) {
           order.paymentStatus = 'cancelled';
           await order.save();
           result.processed++;
        } else {
           result.skipped++;
        }
      }
    } catch (err: any) {
      result.failed++;
      logger.error(`[OrderCleanup] Failed to process order ${order._id}:`, err.message);
    }
  }

  return result;
});

export const initOrderCron = () => {
  cron.schedule(config.cron.checkInterval, cleanupPendingOrders);
};