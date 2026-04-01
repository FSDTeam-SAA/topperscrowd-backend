import { Types } from "mongoose";

export interface ICoupon {
  codeName: string;
  assignedTo: Types.ObjectId;
  expiryDate: Date;
  usesLimit: number;
  usedCount: number;
  discountType: 'flat' | 'percentage';
  discountAmount: number;
}
