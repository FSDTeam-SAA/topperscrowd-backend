import { z } from 'zod';

const createCheckoutSessionSchema = z.object({
  body: z.object({
    bookId: z.string().optional(),
    ebookId: z.string().optional(),
    quantity: z.number().int().min(1).optional(),
    items: z.array(z.object({
      bookId: z.string().optional(),
      ebookId: z.string().optional(),
      quantity: z.number().int().min(1).default(1)
    }).refine(data => data.bookId || data.ebookId, {
      message: "Each item must include either bookId or ebookId"
    }).refine(data => !(data.bookId && data.ebookId), {
      message: "Each item can include only one of bookId or ebookId"
    })).optional(),
    couponCode: z.string().optional(),
  }).refine(data => !(data.bookId && data.ebookId), {
    message: "Provide only one of bookId or ebookId"
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
