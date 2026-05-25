import { z } from "zod";

/**
 * Zod Schema for Creating a Cover
 */
const createCoverValidationSchema = z.object({
  body: z.object({
    title: z.string({
      required_error: "Title is required",
    }).trim().min(1, "Title cannot be empty"),
    
    description: z.string({
      required_error: "Description is required",
    }).min(1, "Description cannot be empty"),
    
    edition: z.string({
      required_error: "Edition is required",
    }).trim().min(1, "Edition cannot be empty"),
  }),
});

/**
 * Zod Schema for Updating a Cover
 * Everything is optional, but if a field is provided, it must pass validation.
 */
const updateCoverValidationSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, "Title cannot be empty").optional(),
    description: z.string().min(1, "Description cannot be empty").optional(),
    edition: z.string().trim().min(1, "Edition cannot be empty").optional(),
  }),
});

export const coverValidation = {
  createCoverValidationSchema,
  updateCoverValidationSchema,
};