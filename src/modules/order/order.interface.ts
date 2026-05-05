import { Types } from "mongoose";

export interface IOrderItem {
  book: Types.ObjectId;
  price: number;
  quantity: number;
}


// Sob kicu thik ache broooooooooo

export interface IOrder {
  userId: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'cancelled';
  paypalOrderId?: string;
  transactionId?: string;
  appliedCoupon?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
