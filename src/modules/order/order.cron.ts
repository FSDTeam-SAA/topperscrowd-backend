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
 * Verifies pending Stripe Checkout orders.
 * Paid sessions are finalized as soon as the cron sees them; the expiry window is
 * only used to decide when an unpaid open session can be cancelled locally.
 */
const cleanupPendingOrders = createCronTask('OrderCleanup', async (): Promise<ITaskResult> => {
  const result: ITaskResult = { totalScanned: 0, processed: 0, skipped: 0, failed: 0 };
  
  const now = new Date();
  const expiryWindow = config.cron.orderExpiryMinutes * 60 * 1000;
  const maxAgeWindow = config.cron.maxOrderAgeHours * 60 * 60 * 1000;

  const maxAgeDate = new Date(now.getTime() - maxAgeWindow);

  // Scan all recent pending Stripe sessions so paid orders do not wait for the
  // expiry window before being finalized.
  const pendingOrders = await Order.find({
    paymentStatus: 'pending',
    createdAt: {
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
      } else if (
        session.status === 'expired' ||
        (
          session.status === 'open' &&
          session.payment_status === 'unpaid' &&
          order.createdAt &&
          now.getTime() - order.createdAt.getTime() >= expiryWindow
        )
      ) {
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
