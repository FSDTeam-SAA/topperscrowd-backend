import mongoose from "mongoose";
import { z } from "zod";

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
  files: z.object({
    image: z.array(z.any()).optional(),
    audio: z.array(z.any()).min(1, "Audio is required"),
  }),
});

export const BookValidation = {
  createBookSchema,
};
