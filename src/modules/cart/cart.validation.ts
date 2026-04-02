import { z } from 'zod';

const addToCartZodSchema = z.object({
    body: z.object({
        bookId: z.string().optional(),
        quantity: z.number().int().min(1).optional().default(1),
        items: z.array(
            z.object({
                bookId: z.string({ required_error: 'Book ID is required' }),
                quantity: z.number().int().min(1).optional().default(1)
            })
        ).optional()
    }).refine(data => data.bookId || (data.items && data.items.length > 0), {
        message: "Provide either bookId or an items array"
    }),
});

const updateQuantityZodSchema = z.object({
    body: z.object({
        bookId: z.string({ required_error: 'Book ID is required' }),
        quantity: z.number().int().min(0, "Quantity must be 0 or greater"),
    }),
});

export const CartValidation = {
    addToCartZodSchema,
    updateQuantityZodSchema,
};