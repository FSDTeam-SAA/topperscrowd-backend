import { Schema, model } from "mongoose";
import { ICoupon } from "./coupon.interface";

const couponSchema = new Schema<ICoupon>(
  {
    codeName: { type: String, required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiryDate: { type: Date, required: true },
    usesLimit: { type: Number, required: true },
    usedCount: { type: Number, default: 0 },
    discountType: { type: String, enum: ['flat', 'percentage'], required: true },
    discountAmount: { type: Number, required: true }
  },
  {
    timestamps: true,
  }
);

// Enforce unique coupon codes
couponSchema.index({ codeName: 1 }, { unique: true });

export const Coupon = model<ICoupon>("Coupon", couponSchema);
