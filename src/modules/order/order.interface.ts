import { Types } from 'mongoose';

export interface IOrderItem {
  book: Types.ObjectId;
  price: number; 
  quantity: number;
}

export interface IOrder {
  userId: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'cancelled';
  stripeSessionId?: string;
  transactionId?: string;
  appliedCoupon?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}