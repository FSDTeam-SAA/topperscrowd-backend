import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CartService } from './cart.service';

const addToCart = catchAsync(async (req: Request, res: Response) => {
  // Assume user ID comes from your Auth Middleware (JWT)
  const userId = req.user.id;
  const { bookId, ebookId, quantity, items } = req.body;

  let itemsToAdd = [];
  if (items && items.length > 0) {
    itemsToAdd = items;
  } else if (ebookId) {
    itemsToAdd = [{ ebookId, quantity: quantity || 1 }];
  } else if (bookId) {
    itemsToAdd = [{ bookId, quantity: quantity || 1 }];
  }

  const result = await CartService.addToCartIntoDB(userId, itemsToAdd);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Item added to cart successfully',
    data: result,
  });
});

const getMyCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await CartService.getCartFromDB(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cart retrieved successfully',
    data: result,
  });
});

const updateQuantity = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await CartService.updateCartItemQuantity(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cart updated successfully',
    data: result,
  });
});

// clear cart
const clearCart = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await CartService.clearCartFromDB(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cart cleared successfully',
    data: result,
  });
});

const removeItem = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { bookId, ebookId, productType, productId } = req.params;

  const result = await CartService.removeItemFromCartFromDB(userId, {
    bookId,
    ebookId,
    productType: productType as any,
    productId,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Item removed from cart successfully',
    data: result,
  });
});

export const CartController = {
  addToCart,
  getMyCart,
  updateQuantity,
  clearCart,
  removeItem

};
