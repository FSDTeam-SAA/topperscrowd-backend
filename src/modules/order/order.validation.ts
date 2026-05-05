import { z } from "zod";

const createCheckoutSessionSchema = z.object({
  body: z.object({
    bookId: z.string().optional(),
    quantity: z.number().int().min(1).optional(),
    items: z.array(z.object({
      bookId: z.string(),
      quantity: z.number().int().min(1).default(1)
    })).optional(),
    couponCode: z.string().optional(),
  }),
});

// ✅ sessionId → paypalOrderId
const capturePaymentSchema = z.object({
  body: z.object({
    paypalOrderId: z.string({
      required_error: 'PayPal orderId is required',
    }),
  }),
});

export const OrderValidation = {
  createCheckoutSessionSchema,
  capturePaymentSchema,
};
