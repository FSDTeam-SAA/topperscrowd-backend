import mongoose from "mongoose";
import { z } from "zod";

const updateProgressSchema = z.object({
  body: z.object({
    bookId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid bookId",
    }),
    progress: z
      .number({ required_error: "Progress (in seconds) is required" })
      .min(0, "Progress cannot be negative"),
    totalDuration: z.number().min(0).optional(),
  }),
});

export const ListenerProgressValidation = {
  updateProgressSchema,
};
