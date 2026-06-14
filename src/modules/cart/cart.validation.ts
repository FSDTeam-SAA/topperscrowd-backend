import { z } from 'zod';

const addToCartZodSchema = z.object({
    body: z.object({
        bookId: z.string().optional(),
        ebookId: z.string().optional(),
        quantity: z.number().int().min(1).optional().default(1),
        items: z.array(
            z.object({
                bookId: z.string().optional(),
                ebookId: z.string().optional(),
                quantity: z.number().int().min(1).optional().default(1)
            }).refine(data => data.bookId || data.ebookId, {
                message: "Each item must include either bookId or ebookId"
            }).refine(data => !(data.bookId && data.ebookId), {
                message: "Each item can include only one of bookId or ebookId"
            })
        ).optional()
    }).refine(data => data.bookId || data.ebookId || (data.items && data.items.length > 0), {
        message: "Provide either bookId, ebookId, or an items array"
    }).refine(data => !(data.bookId && data.ebookId), {
        message: "Provide only one of bookId or ebookId"
    }),
});

const updateQuantityZodSchema = z.object({
    body: z.object({
        bookId: z.string().optional(),
        ebookId: z.string().optional(),
        productType: z.enum(['book', 'ebook']).optional(),
        productId: z.string().optional(),
        quantity: z.number().int().min(0, "Quantity must be 0 or greater"),
    }).refine(data => data.bookId || data.ebookId || data.productId, {
        message: "Provide either bookId, ebookId, or productId"
    }).refine(data => !(data.bookId && data.ebookId), {
        message: "Provide only one of bookId or ebookId"
    }),
});

export const CartValidation = {
    addToCartZodSchema,
    updateQuantityZodSchema,
};
