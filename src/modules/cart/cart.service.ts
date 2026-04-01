import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { Cart } from './cart.model';
import { ICart } from './cart.interface';
import Book from '../book/book.model';

const addToCartIntoDB = async (userId: string, bookId: string, quantity: number) => {
  // 1. Verify the book exists
  const book = await Book.findById(bookId);
  if (!book) {
    throw new AppError('Audiobook not found', httpStatus.NOT_FOUND);
  }

  // 2. Find the user's cart
  let cart = await Cart.findOne({ user: userId });

  if (cart) {
    // 3. Check if the book is already in the cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.book.toString() === bookId
    );

    if (existingItemIndex > -1) {
      // Update quantity if already exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to existing cart
      cart.items.push({ book: bookId as any, quantity });
    }

    // 4. Re-calculate Total Price (Always trust the DB price, not the request)
    // We populate the books to get current prices
    const populatedCart = await cart.populate('items.book');

    cart.totalPrice = populatedCart.items.reduce((total, item: any) => {
      if (!item.book) return total;
      return total + (item.book.price * item.quantity);
    }, 0);

    // Ensure precision
    cart.totalPrice = Number(cart.totalPrice.toFixed(2));

    await cart.save();
  } else {
    // Create new cart if it doesn't exist
    cart = await Cart.create({
      user: userId,
      items: [{ book: bookId, quantity }],
      totalPrice: book.price * quantity,
    });
  }

  return cart;
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

  // Update the quantity
  cart.items[itemIndex].quantity = quantity;

  // Recalculate Total Price
  const populatedCart = await cart.populate('items.book');
  let total = 0;
  populatedCart.items.forEach((item: any) => {
    if (item.book) {
      total += item.book.price * item.quantity;
    }
  });

  cart.totalPrice = Number(total.toFixed(2));
  await cart.save();
  return cart;
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

export const CartService = {
  addToCartIntoDB,
  getCartFromDB,
  updateCartItemQuantity,
  clearCartFromDB

};