import { z } from "zod";
import { EEbookFormat } from "./ebook.interface";

/**
 * Zod Schema for Creating an Ebook (multipart/form-data)
 *
 * Note: coverImage and file fields are handled by Multer (not in body).
 * Boolean fields arrive as strings from form-data and are coerced.
 */
const createEbookValidationSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: "Title is required" })
      .trim()
      .min(1, "Title cannot be empty"),

    slug: z
      .string({ required_error: "Slug is required" })
      .trim()
      .toLowerCase()
      .min(1, "Slug cannot be empty"),

    description: z
      .string({ required_error: "Description is required" })
      .min(1, "Description cannot be empty"),

    author: z
      .string({ required_error: "Author name is required" })
      .trim()
      .min(1, "Author name cannot be empty"),

    formatType: z.nativeEnum(EEbookFormat, {
      required_error: "Format type must be either PDF or EPUB",
    }),

    category: z
      .string({ required_error: "Category ID reference is required" })
      .regex(/^[0-9a-fA-F]{24}$/, {
        message: "Invalid MongoDB Category ObjectId",
      }),

    isPremium: z
      .union([z.boolean(), z.string()])
      .transform((val) => val === "true" || val === true)
      .optional(),
  }),
  files: z.object({
    coverImage: z.array(z.any()).min(1, "Cover image file is required"),
    file: z.array(z.any()).min(1, "Ebook document file (PDF/EPUB) is required"),
  }),
});

/**
 * Zod Schema for Updating an Ebook (multipart/form-data)
 *
 * All fields are optional. Files are validated via Multer, not body.
 */
const updateEbookValidationSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).optional(),
    slug: z.string().trim().toLowerCase().min(1).optional(),
    description: z.string().min(1).optional(),
    author: z.string().trim().min(1).optional(),
    formatType: z.nativeEnum(EEbookFormat).optional(),
    category: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, {
        message: "Invalid MongoDB Category ObjectId",
      })
      .optional(),
    isPremium: z
      .union([z.boolean(), z.string()])
      .transform((val) => val === "true" || val === true)
      .optional(),
  }),
  files: z
    .object({
      coverImage: z.array(z.any()).optional(),
      file: z.array(z.any()).optional(),
    })
    .optional(),
});

export const ebookValidation = {
  createEbookValidationSchema,
  updateEbookValidationSchema,
};