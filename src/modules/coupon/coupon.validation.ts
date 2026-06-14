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

const applyCouponSchema = z.object({
  body: z.object({
    couponCode: z.string({
      required_error: "Coupon code is required",
    }).min(1, { message: "Coupon code cannot be empty" }),
    bookId: z.string().optional(),
    ebookId: z.string().optional(),
    quantity: z.number().int().min(1).optional(),
    items: z.array(
      z.object({
        bookId: z.string().optional(),
        ebookId: z.string().optional(),
        quantity: z.number().int().min(1).default(1),
      }).refine(data => data.bookId || data.ebookId, {
        message: "Each item must include either bookId or ebookId"
      }).refine(data => !(data.bookId && data.ebookId), {
        message: "Each item can include only one of bookId or ebookId"
      })
    ).optional(),
  }).refine(data => !(data.bookId && data.ebookId), {
    message: "Provide only one of bookId or ebookId"
  }),
});

export const CouponValidation = {
  createCouponSchema,
  applyCouponSchema,
};
