import cron from 'node-cron';
import { Order } from './order.model';
import { OrderService } from './order.service';
import Stripe from 'stripe';
import config from '../../config';
import logger from '../../logger';
import { createCronTask, ITaskResult } from '../../utils/cronRunner';

const stripe = new Stripe(config.stripe.secretKey!, {
  // @ts-ignore
  apiVersion: '2023-10-16',
});

/**
 * Advanced Order Cleanup Task
 * 1. Concurrency guarded: Stops overlaps if DB or Stripe is slow.
 * 2. Detailing: Reports skipped, processed, and failed counts.
 * 3. Configurable: Uses central config for expiry windows.
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
    stripeSessionId: { $exists: true, $ne: null },
  });

  result.totalScanned = pendingOrders.length;
  if (pendingOrders.length === 0) return result;

  for (const order of pendingOrders) {
    try {
      if (!order.stripeSessionId) {
        result.skipped++;
        continue;
      }

      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);

      if (session.payment_status === 'paid') {
        await OrderService.finalizeOrder(order, session);
        result.processed++;
      } else if (session.status === 'expired' || (session.status === 'open' && session.payment_status === 'unpaid' && new Date(session.expires_at * 1000) < now)) {
        order.paymentStatus = 'cancelled';
        await order.save();
        result.processed++;
      } else {
        result.skipped++;
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