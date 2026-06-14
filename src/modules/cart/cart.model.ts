import { Schema, model } from 'mongoose';
import { ICart } from './cart.interface';



const cartSchema = new Schema<ICart>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [
        {
            productType: { type: String, enum: ['book', 'ebook'], required: true, default: 'book' },
            book: { type: Schema.Types.ObjectId, ref: 'Book' },
            ebook: { type: Schema.Types.ObjectId, ref: 'Ebook' },
            quantity: { type: Number, required: true, min: 1, default: 1 },

        },
    ],
    totalPrice: { type: Number, required: true, default: 0 },
}, { timestamps: true });


export const Cart = model<ICart>('Cart', cartSchema);
