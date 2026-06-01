import { z } from "zod";

const userValidationSchema = z.object({
  body: z.object({
    firstName: z.string({
      required_error: "First name is required",
    }),
    lastName: z.string({
      required_error: "Last name is required",
    }),
    email: z.string({
      required_error: "Email is required",
    }),
    password: z.string({
      required_error: "Password is required",
    }),
  }),
});

const updateUserByAdminSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    street: z.string().optional(),
    location: z.string().optional(),
    postalCode: z.string().optional(),
    dateOfBirth: z.string().optional(),
    role: z.enum(["user", "admin"]).optional(),
    isVerified: z.boolean().optional(),
  }),
});

export const userValidation = {
  userValidationSchema,
  updateUserByAdminSchema,
};
