import { z } from "zod";

const createCheckoutSessionSchema = z.object({
  body: z.object({
    bookId: z.string().optional(),
    quantity: z.number().int().positive().optional(),
    couponCode: z.string().optional(),
  }),
});

// ✅ sessionId → paypalOrderId
const capturePaymentSchema = z.object({
  body: z.object({
    paypalOrderId: z.string({ required_error: "PayPal Order ID is required" }),
  }),
});

export const OrderValidation = {
  createCheckoutSessionSchema,
  capturePaymentSchema,
};
