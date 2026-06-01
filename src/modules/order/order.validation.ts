import { z } from 'zod';

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

const verifyPaymentSchema = z.object({
  body: z.object({
    paypalOrderId: z.string({
      required_error: 'PayPal orderId is required',
    }),
  }),
});

const updateOrderSchema = z.object({
  body: z.object({
    paymentStatus: z.enum(['pending', 'paid', 'cancelled']).optional(),
    totalAmount: z.number().optional(),
    paypalOrderId: z.string().optional(),
    transactionId: z.string().optional(),
  }),
});

export const OrderValidation = {
  createCheckoutSessionSchema,
  verifyPaymentSchema,
  updateOrderSchema,
};
