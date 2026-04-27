import cron from "node-cron";
import { Order } from "./order.model";
import { OrderService } from "./order.service";
import { paypalRequest } from "../../utils/paypal";
import config from "../../config";
import logger from "../../logger";
import { createCronTask, ITaskResult } from "../../utils/cronRunner";

const cleanupPendingOrders = createCronTask(
  "OrderCleanup",
  async (): Promise<ITaskResult> => {
    const result: ITaskResult = {
      totalScanned: 0,
      processed: 0,
      skipped: 0,
      failed: 0,
    };

    const now = new Date();
    const expiryWindow = config.cron.orderExpiryMinutes * 60 * 1000;
    const maxAgeWindow = config.cron.maxOrderAgeHours * 60 * 60 * 1000;
    const maxAgeDate = new Date(now.getTime() - maxAgeWindow);

    // ✅ stripeSessionId → paypalOrderId
    const pendingOrders = await Order.find({
      paymentStatus: "pending",
      createdAt: { $gte: maxAgeDate },
      paypalOrderId: { $exists: true, $ne: null },
    });

    result.totalScanned = pendingOrders.length;
    if (pendingOrders.length === 0) return result;

    for (const order of pendingOrders) {
      try {
        if (!order.paypalOrderId) {
          result.skipped++;
          continue;
        }

        // ✅ PayPal order status check
        const paypalOrder = await paypalRequest<{
          status: string;
          purchase_units: {
            payments?: {
              captures?: { id: string; status: string }[];
            };
          }[];
        }>("GET", `/v2/checkout/orders/${order.paypalOrderId}`);

        const captureId =
          paypalOrder.purchase_units?.[0]?.payments?.captures?.[0]?.id;

        if (paypalOrder.status === "COMPLETED") {
          // ✅ Stripe paid → PayPal COMPLETED
          await OrderService.finalizeOrder(order, captureId);
          result.processed++;
        } else if (
          paypalOrder.status === "VOIDED" ||
          (paypalOrder.status === "CREATED" &&
            order.createdAt &&
            now.getTime() - order.createdAt.getTime() >= expiryWindow)
        ) {
          // ✅ Stripe expired/unpaid → PayPal VOIDED বা expiry পেরিয়ে গেলে cancel
          order.paymentStatus = "cancelled";
          await order.save();
          result.processed++;
        } else {
          result.skipped++;
        }
      } catch (err: any) {
        if (err.status === 404) {
          // ✅ PayPal-এ অর্ডার পাওয়া না গেলে (৪0৪), সেটিকে cancelled মার্ক করো
          logger.warn(
            `[OrderCleanup] Order ${order._id} (PayPal ID: ${order.paypalOrderId}) not found in PayPal. Marking as cancelled.`,
          );
          order.paymentStatus = "cancelled";
          await order.save();
          result.processed++;
        } else {
          result.failed++;
          logger.error(
            `[OrderCleanup] Failed to process order ${order._id}: ${err.message}`,
          );
        }
      }
    }

    return result;
  },
);

export const initOrderCron = () => {
  cron.schedule(config.cron.checkInterval, cleanupPendingOrders);
};
