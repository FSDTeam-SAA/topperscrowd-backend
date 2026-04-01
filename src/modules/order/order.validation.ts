import { z } from 'zod';

const createCheckoutSessionSchema = z.object({
  body: z.object({
    orderType: z.enum(['buy-now', 'checkout-all'], {
      required_error: 'orderType is required and must be buy-now or checkout-all',
    }),
    bookId: z.string().optional(),
    quantity: z.number().int().min(1).optional(),
    couponCode: z.string().optional(),
  }).refine((data) => {
    if (data.orderType === 'buy-now') {
      return !!data.bookId;
    }
    return true;
  }, {
    message: 'bookId is required when orderType is buy-now',
    path: ['bookId'],
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
