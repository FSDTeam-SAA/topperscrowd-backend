import mongoose from "mongoose";
import { z } from "zod";

const cloudinaryAssetSchema = z.object({
  public_id: z.string().min(1),
  secure_url: z.string().url(),
  resource_type: z.enum(["image", "video", "raw"]),
});

// Validation schema for creating a book
const createBookSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    author: z.string().min(1, "Author is required"),
    genre: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid genre ObjectId",
    }),
    price: z.coerce.number().min(1, "Price is required"),
    language: z.string().min(1, "Language is required"),
    publisher: z.string().min(1, "Publisher is required"),
    publicationYear: z.coerce.number().min(1, "Publication Year is required"),
  }),
  streamedUploads: z.object({
    image: cloudinaryAssetSchema.optional(),
    audio: cloudinaryAssetSchema,
  }),
});

//validation schema for updating a book
const updateBookSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    author: z.string().min(1).optional(),
    genre: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid genre ObjectId",
    }).optional(),
    price: z.coerce.number().min(1).optional(),
    language: z.string().min(1).optional(),
    publisher: z.string().min(1).optional(),
  }),
  streamedUploads: z.object({
    image: cloudinaryAssetSchema.optional(),
    audio: cloudinaryAssetSchema.optional(),
  }).optional()
})

export const BookValidation = {
  createBookSchema,
  updateBookSchema,
};
