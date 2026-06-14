import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import Book from '../book/book.model';
import { Ebook } from '../ebook/ebook.model';
import { Cart } from './cart.model';
import { ICart, TCartProductType } from './cart.interface';

export type TCartPayloadItem = {
  bookId?: string;
  ebookId?: string;
  quantity?: number;
};

type TNormalizedCartItem = {
  productType: TCartProductType;
  productId: string;
  quantity: number;
};

const getCartItemProductType = (item: any): TCartProductType => {
  if (item.productType === 'ebook' || item.ebook) return 'ebook';
  return 'book';
};

const getCartItemProduct = (item: any) => {
  return getCartItemProductType(item) === 'ebook' ? item.ebook : item.book;
};

const getCartItemProductId = (item: any): string | null => {
  const product = getCartItemProduct(item);
  if (!product) return null;
  return product._id ? product._id.toString() : product.toString();
};

const normalizeCartPayloadItems = (items: TCartPayloadItem[]): TNormalizedCartItem[] => {
  const aggregatedItems = new Map<string, TNormalizedCartItem>();

  for (const item of items) {
    if (item.bookId && item.ebookId) {
      throw new AppError('Each cart item can include only one of bookId or ebookId', httpStatus.BAD_REQUEST);
    }

    const quantity = item.quantity ?? 1;
    const productType: TCartProductType = item.ebookId ? 'ebook' : 'book';
    const productId = item.ebookId || item.bookId;

    if (!productId) {
      throw new AppError('Each cart item must include either bookId or ebookId', httpStatus.BAD_REQUEST);
    }

    const key = `${productType}:${productId}`;
    const existing = aggregatedItems.get(key);
    if (existing) {
      existing.quantity += quantity;
    } else {
      aggregatedItems.set(key, { productType, productId, quantity });
    }
  }

  return Array.from(aggregatedItems.values());
};

const verifyProductsExist = async (items: TNormalizedCartItem[]) => {
  const bookIds = items.filter((item) => item.productType === 'book').map((item) => item.productId);
  const ebookIds = items.filter((item) => item.productType === 'ebook').map((item) => item.productId);

  const [books, ebooks] = await Promise.all([
    bookIds.length ? Book.find({ _id: { $in: bookIds } }) : [],
    ebookIds.length ? Ebook.find({ _id: { $in: ebookIds } }) : [],
  ]);

  if (books.length !== new Set(bookIds).size) {
    throw new AppError('One or more audiobooks/books not found', httpStatus.NOT_FOUND);
  }

  if (ebooks.length !== new Set(ebookIds).size) {
    throw new AppError('One or more ebooks/epubs not found', httpStatus.NOT_FOUND);
  }

  return { books, ebooks };
};

export const populateCartProducts = async (cart: any) => {
  return await cart.populate([
    { path: 'items.book' },
    { path: 'items.ebook' },
  ]);
};

export const recalculateCart = async (cart: any) => {
  const populatedCart = await populateCartProducts(cart);
  let newTotal = 0;

  populatedCart.items = populatedCart.items.filter((item: any) => {
    const productType = getCartItemProductType(item);
    const product = getCartItemProduct(item);

    if (!product) return false;

    item.productType = productType;
    if (productType === 'book') {
      item.ebook = undefined;
      newTotal += product.price * item.quantity;
    } else {
      item.book = undefined;
      newTotal += product.price * item.quantity;
    }

    return true;
  });

  cart.totalPrice = Number(newTotal.toFixed(2));
  await cart.save();
  return populatedCart;
};

const addToCartIntoDB = async (userId: string, itemsToAdd: TCartPayloadItem[]) => {
  const normalizedItems = normalizeCartPayloadItems(itemsToAdd);
  await verifyProductsExist(normalizedItems);

  let cart = await Cart.findOne({ user: userId });

  if (cart) {
    for (const item of normalizedItems) {
      const existingItemIndex = cart.items.findIndex((cartItem: any) => {
        const itemType = getCartItemProductType(cartItem);
        const itemId = getCartItemProductId(cartItem);
        return itemType === item.productType && itemId === item.productId;
      });

      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += item.quantity;
      } else if (item.productType === 'ebook') {
        cart.items.push({ productType: 'ebook', ebook: item.productId as any, quantity: item.quantity });
      } else {
        cart.items.push({ productType: 'book', book: item.productId as any, quantity: item.quantity });
      }
    }

    return await recalculateCart(cart);
  }

  cart = await Cart.create({
    user: userId,
    items: normalizedItems.map((item) => ({
      productType: item.productType,
      book: item.productType === 'book' ? item.productId : undefined,
      ebook: item.productType === 'ebook' ? item.productId : undefined,
      quantity: item.quantity,
    })),
    totalPrice: 0,
  });

  return await recalculateCart(cart);
};

const getCartFromDB = async (userId: string): Promise<ICart | null> => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return null;

  return await recalculateCart(cart);
};

const updateCartItemQuantity = async (
  userId: string,
  payload: { bookId?: string; ebookId?: string; productType?: TCartProductType; productId?: string; quantity: number }
): Promise<ICart | null> => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError('Cart not found', httpStatus.NOT_FOUND);
  }

  const productType: TCartProductType = payload.ebookId || payload.productType === 'ebook' ? 'ebook' : 'book';
  const productId = payload.ebookId || payload.bookId || payload.productId;

  if (payload.bookId && payload.ebookId) {
    throw new AppError('Provide only one of bookId or ebookId', httpStatus.BAD_REQUEST);
  }

  if (!productId) {
    throw new AppError('Provide either bookId, ebookId, or productId', httpStatus.BAD_REQUEST);
  }

  const itemIndex = cart.items.findIndex((item: any) => {
    const itemType = getCartItemProductType(item);
    const itemId = getCartItemProductId(item);
    return itemType === productType && itemId === productId;
  });

  if (itemIndex === -1) {
    throw new AppError('Item not found in cart', httpStatus.NOT_FOUND);
  }

  if (payload.quantity === 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = payload.quantity;
  }

  return await recalculateCart(cart);
};

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

const removeItemFromCartFromDB = async (
  userId: string,
  payload: { bookId?: string; ebookId?: string; productType?: TCartProductType; productId?: string }
) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError('Cart not found', httpStatus.NOT_FOUND);
  }

  const productType: TCartProductType = payload.ebookId || payload.productType === 'ebook' ? 'ebook' : 'book';
  const productId = payload.ebookId || payload.bookId || payload.productId;

  if (payload.bookId && payload.ebookId) {
    throw new AppError('Provide only one of bookId or ebookId', httpStatus.BAD_REQUEST);
  }

  if (!productId) {
    throw new AppError('Provide either bookId, ebookId, or productId', httpStatus.BAD_REQUEST);
  }

  cart.items = cart.items.filter((item: any) => {
    const itemType = getCartItemProductType(item);
    const itemId = getCartItemProductId(item);
    return !(itemType === productType && itemId === productId);
  });

  return await recalculateCart(cart);
};

export const CartService = {
  addToCartIntoDB,
  getCartFromDB,
  updateCartItemQuantity,
  clearCartFromDB,
  removeItemFromCartFromDB,
  getCartItemProductType,
  getCartItemProduct,
  getCartItemProductId,
  populateCartProducts,
  recalculateCart,
};
