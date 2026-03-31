import { z } from "zod";

const createBookCategorySchema = z.object({
  body: z.object({
    title: z.string({
      required_error: "Title is required",
    }),
    description: z.string({
      required_error: "Description is required",
    }),
  }),
});


const updateBookCategorySchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
  }),
});

export const BookCategoryValidation = {
  createBookCategorySchema,
  updateBookCategorySchema,
};
