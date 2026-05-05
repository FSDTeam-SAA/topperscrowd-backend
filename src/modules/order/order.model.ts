import { Schema, model } from "mongoose";
import { IOrder, IOrderItem } from "./order.interface";

const orderItemSchema = new Schema<IOrderItem>(
  {
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    paypalOrderId: { type: String },
    transactionId: { type: String },
    appliedCoupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1, "items.book": 1, paymentStatus: 1 });
orderSchema.index({ paymentStatus: 1, createdAt: 1 });
// ✅ Webhook lookup এর জন্য index
orderSchema.index({ paypalOrderId: 1 });

export const Order = model<IOrder>("Order", orderSchema);
