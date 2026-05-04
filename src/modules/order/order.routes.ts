import express, { Request, Response, NextFunction } from "express";
import { OrderController } from "./order.controller";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";
import { validateRequest } from "../../middleware/validateRequest";
import { OrderValidation } from "./order.validation";

const router = express.Router();

// ✅ Webhook route — raw body চাই, JSON parse হওয়ার আগে
// এটা অবশ্যই অন্য routes এর আগে রাখতে হবে
router.post(
  "/webhook/paypal",

  (req: Request, _res: Response, next: NextFunction) => {
    // rawBody string হিসেবে save করা হচ্ছে controller এ use করার জন্য
    (req as any).rawBody = req.body.toString("utf8");
    next();
  },
  OrderController.handleWebhook,
);

router.post(
  "/checkout",
  auth(USER_ROLE.USER),
  validateRequest(OrderValidation.createCheckoutSessionSchema),
  OrderController.createCheckoutSession,
);

// ✅ verify-payment → capture-payment
router.post(
  "/capture-payment",
  auth(USER_ROLE.USER),
  validateRequest(OrderValidation.capturePaymentSchema),
  OrderController.capturePayment,
);

router.get("/my-orders", auth(USER_ROLE.USER), OrderController.getMyOrders);
router.get(
  "/get-all-orders",
  auth(USER_ROLE.ADMIN),
  OrderController.getAllOrders,
);
router.get(
  "/get-order/:orderId",
  auth(USER_ROLE.ADMIN),
  OrderController.getSingleOrder,
);
router.get("/paypal-return", OrderController.handlePayPalReturn);
router.get("/:orderId", auth(USER_ROLE.USER), OrderController.getOrderById);

export const OrderRouter = router;
