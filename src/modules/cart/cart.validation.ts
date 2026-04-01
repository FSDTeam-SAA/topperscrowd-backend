import { z } from 'zod';

const addToCartZodSchema = z.object({
    body: z.object({
        bookId: z.string({
            required_error: 'Book ID is required',
        }),
        quantity: z.number().optional().default(1),
    }),
});

export const CartValidation = {
    addToCartZodSchema,
};