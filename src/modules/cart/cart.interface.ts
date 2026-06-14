import { Types } from 'mongoose';

export type TCartProductType = 'book' | 'ebook';

export interface ICartItem {
    productType: TCartProductType;
    book?: Types.ObjectId;
    ebook?: Types.ObjectId;
    quantity: number;
}

export interface ICart {
    user: Types.ObjectId;
    items: ICartItem[];
    totalPrice: number;
}
