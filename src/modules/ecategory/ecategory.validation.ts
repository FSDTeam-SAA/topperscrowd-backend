import { z } from "zod";

const optionalBoolean = z.preprocess((value) => {
  if (value === undefined || value === "") return undefined;
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return value;
}, z.boolean().optional());

const createEcategoryValidationSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: "Category name is required",
    }).trim().min(1, "Category name cannot be empty"),
    
    slug: z.string({
      required_error: "Slug is required",
    }).trim().toLowerCase().min(1, "Slug cannot be empty"),
    
    description: z.string().trim().optional(),
    isActive: optionalBoolean,
  }),
});

const updateEcategoryValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).optional(),
    slug: z.string().trim().toLowerCase().min(1).optional(),
    description: z.string().trim().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const ecategoryValidation = {
  createEcategoryValidationSchema,
  updateEcategoryValidationSchema,
};
