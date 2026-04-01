import cron from 'node-cron';
import { Order } from './order.model';
import { OrderService } from './order.service';
import Stripe from 'stripe';
import config from '../../config';
import logger from '../../logger';

const stripe = new Stripe(config.stripe.secretKey!, {
  // @ts-ignore
  apiVersion: '2023-10-16',
});

// Run every 10 seconds
export const initOrderCron = () => {
  // Added an extra asterisk at the start for the seconds field
  cron.schedule('*/10 * * * * *', async () => {
    logger.info('Running pending orders cleanup cron job');
    try {
      const now = new Date();
      // Keep your logic the same
      const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // 1. Find pending orders
      const pendingOrders = await Order.find({
        paymentStatus: 'pending',
        createdAt: {
          $lte: twentyMinutesAgo,
          $gte: twentyFourHoursAgo,
        },
        stripeSessionId: { $exists: true, $ne: null },
      });

      if (pendingOrders.length === 0) return;

      logger.info(`Found ${pendingOrders.length} pending orders to check`);

      for (const order of pendingOrders) {
        try {
          if (!order.stripeSessionId) continue;

          const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);

          // 2. Elite Handling: Atomic Finalization
          if (session.payment_status === 'paid') {
            await OrderService.finalizeOrder(order, session);
            logger.info(`Cron: Successfully finalized paid order ${order._id}`);
          } else if (session.status === 'expired') {
            order.paymentStatus = 'cancelled';
            await order.save();
            logger.info(`Cron: Cancelled expired order ${order._id}`);
          }
        } catch (err: any) {
          logger.error(`Cron error processing order ${order._id}:`, err);
        }
      }
    } catch (error: any) {
      logger.error('Error in order cron job:', error);
    }
  });
};