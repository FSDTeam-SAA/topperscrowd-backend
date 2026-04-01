import { z } from 'zod';

const createCheckoutSessionSchema = z.object({
  body: z.object({
    bookId: z.string().optional(),
    quantity: z.number().int().min(1).optional(),
    couponCode: z.string().optional(),
  }),
});

const verifyPaymentSchema = z.object({
  body: z.object({
    sessionId: z.string({
      required_error: 'Stripe sessionId is required',
    }),
  }),
});

export const OrderValidation = {
  createCheckoutSessionSchema,
  verifyPaymentSchema,
};
