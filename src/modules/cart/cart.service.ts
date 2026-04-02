import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { Cart } from './cart.model';
import { ICart } from './cart.interface';
import Book from '../book/book.model';

const addToCartIntoDB = async (userId: string, itemsToAdd: {bookId: string, quantity: number}[]) => {
  // 1. Verify all books exist
  const bookIds = itemsToAdd.map(item => item.bookId);
  const books = await Book.find({ _id: { $in: bookIds } });
  
  if (books.length !== new Set(bookIds).size) {
    throw new AppError('One or more audiobooks/books not found', httpStatus.NOT_FOUND);
  }

  // 1.5 Aggregate items in case there are duplicates in the payload
  const aggregatedItems = new Map<string, number>();
  for (const item of itemsToAdd) {
    aggregatedItems.set(item.bookId, (aggregatedItems.get(item.bookId) || 0) + item.quantity);
  }

  // 2. Find the user's cart
  let cart = await Cart.findOne({ user: userId });

  if (cart) {
    // 3. Update existing or add new items
    for (const [bId, qty] of aggregatedItems.entries()) {
      const existingItemIndex = cart.items.findIndex(
        (item) => item.book.toString() === bId
      );

      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += qty;
      } else {
        cart.items.push({ book: bId as any, quantity: qty });
      }
    }

    // 4. Re-calculate Total Price & Remove ghost books
    const populatedCart = await cart.populate('items.book');

    let newTotal = 0;
    populatedCart.items = populatedCart.items.filter((item: any) => {
      if (!item.book) return false;
      newTotal += (item.book.price * item.quantity);
      return true;
    });

    cart.totalPrice = Number(newTotal.toFixed(2));
    await cart.save();
    return populatedCart;
  } else {
    // Create new cart if it doesn't exist
    const cartItems = Array.from(aggregatedItems.entries()).map(([bId, qty]) => ({ book: bId as any, quantity: qty }));
    
    let initialTotal = 0;
    cartItems.forEach(item => {
      const book = books.find(b => b._id.toString() === item.book);
      if (book) initialTotal += book.price * item.quantity;
    });

    cart = await Cart.create({
      user: userId,
      items: cartItems,
      totalPrice: Number(initialTotal.toFixed(2)),
    });
    
    return await cart.populate('items.book');
  }
};

// 1. Get User Cart (Dynamic Recalculation & Self-Healing)
const getCartFromDB = async (userId: string): Promise<ICart | null> => {
  let cart = await Cart.findOne({ user: userId }).populate('items.book');
  if (!cart) return null;

  let isModified = false;
  let newTotal = 0;

  // Filter out any newly deleted ghost books & dynamically recalculate live prices
  cart.items = cart.items.filter((item: any) => {
    if (!item.book) {
      isModified = true;
      return false;
    }
    newTotal += item.book.price * item.quantity;
    return true;
  });

  // Ensure precision
  newTotal = Number(newTotal.toFixed(2));

  // If live prices drifted from the cached Database total, auto-heal the DB
  if (cart.totalPrice !== newTotal || isModified) {
    cart.totalPrice = newTotal;
    await cart.save();
  }

  return cart;
};

// 2. Update Item Quantity
const updateCartItemQuantity = async (
  userId: string,
  bookId: string,
  quantity: number
): Promise<ICart | null> => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError('Cart not found', httpStatus.NOT_FOUND);
  }

  const itemIndex = cart.items.findIndex((item) => item.book.toString() === bookId);

  if (itemIndex === -1) {
    throw new AppError('Book not found in cart', httpStatus.NOT_FOUND);
  }

  // Update the quantity, or remove if 0
  if (quantity === 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
  }

  // Recalculate Total Price and remove ghost books
  const populatedCart = await cart.populate('items.book');
  let newTotal = 0;
  
  populatedCart.items = populatedCart.items.filter((item: any) => {
    if (!item.book) return false;
    newTotal += item.book.price * item.quantity;
    return true;
  });

  cart.totalPrice = Number(newTotal.toFixed(2));
  await cart.save();
  return populatedCart;
};

// Clear Cart
const clearCartFromDB = async (userId: string): Promise<ICart | null> => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError('Cart not found', httpStatus.NOT_FOUND);
  }

  cart.items = [];
  cart.totalPrice = 0;
  await cart.save();
  return cart;
};

const removeItemFromCartFromDB = async (userId: string, bookId: string) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError('Cart not found', httpStatus.NOT_FOUND);
  }

  // Use MongoDB $pull to remove the item matching the bookId
  const result = await Cart.findOneAndUpdate(
    { user: userId },
    { $pull: { items: { book: bookId } } },
    { new: true }
  ).populate('items.book');

  if (!result) return null;

  // Recalculate total price after removal
  let newTotal = 0;
  result.items.forEach((item: any) => {
    if (item.book) {
      newTotal += item.book.price * item.quantity;
    }
  });

  result.totalPrice = Number(newTotal.toFixed(2));
  await result.save();
  
  return result;
};

export const CartService = {
  addToCartIntoDB,
  getCartFromDB,
  updateCartItemQuantity,
  clearCartFromDB,
  removeItemFromCartFromDB

};