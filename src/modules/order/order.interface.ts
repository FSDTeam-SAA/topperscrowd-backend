import { Types } from 'mongoose';

export type TOrderProductType = 'book' | 'ebook';

export interface IOrderItem {
  productType: TOrderProductType;
  book?: Types.ObjectId;
  ebook?: Types.ObjectId;
  price: number; 
  quantity: number;
}

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
