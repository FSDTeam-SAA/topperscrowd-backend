import { z } from "zod";

const createCouponSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Invalid email address" }),
    codeName: z.string().min(3, { message: "Coupon code must be at least 3 characters" }),
    expiryDate: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "Invalid expiry date format",
    }),
    usesLimit: z.number().int().positive({ message: "usesLimit must be a positive integer" }),
    discountType: z.enum(["flat", "percentage"]),
    discountAmount: z.number().positive({ message: "discountAmount must be a positive number" }),
  }).refine(data => {
      // If percentage, limit to 0-100
      if (data.discountType === 'percentage' && data.discountAmount > 100) {
          return false;
      }
      return true;
  }, {
      message: "Percentage discount cannot exceed 100",
      path: ["discountAmount"]
  })
});

export const CouponValidation = {
  createCouponSchema,
};
