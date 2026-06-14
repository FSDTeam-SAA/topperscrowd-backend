import express from 'express';
import { CartController } from './cart.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constant';
import { validateRequest } from '../../middleware/validateRequest';
import { CartValidation } from './cart.validation';

const router = express.Router();

router.post(
  '/add-to-cart',
  // #swagger.tags = ['Cart']
  // #swagger.summary = 'Add audiobook or ebook item(s) to cart'
  // #swagger.description = 'Supports legacy bookId payloads, ebookId payloads, and mixed items arrays. Re-adding the same item increases quantity.'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            bookId: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            ebookId: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d2" },
            quantity: { type: "integer", example: 1 },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  bookId: { type: "string" },
                  ebookId: { type: "string" },
                  quantity: { type: "integer", example: 1 }
                }
              }
            }
          }
        }
      }
    }
  } */
  auth(USER_ROLE.USER),
  validateRequest(CartValidation.addToCartZodSchema),
  CartController.addToCart
);

router.get(
  '/get-cart',
  // #swagger.tags = ['Cart']
  // #swagger.summary = 'Get my cart'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.USER,USER_ROLE.ADMIN),
  CartController.getMyCart
);

router.patch(
  '/update-quantity',
  // #swagger.tags = ['Cart']
  // #swagger.summary = 'Update item quantity in cart'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["quantity"],
          properties: {
            bookId: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            ebookId: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d2" },
            productType: { type: "string", enum: ["book", "ebook"], example: "ebook" },
            productId: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d2" },
            quantity: { type: "integer", example: 2 }
          }
        }
      }
    }
  } */
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  validateRequest(CartValidation.updateQuantityZodSchema),
  CartController.updateQuantity
);

router.delete(
  '/clear-cart',
  // #swagger.tags = ['Cart']
  // #swagger.summary = 'Clear entire cart'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.USER),
  CartController.clearCart
);

router.delete(
  '/remove-item/:productType/:productId',
  // #swagger.tags = ['Cart']
  // #swagger.summary = 'Remove a book or ebook item from cart'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.parameters['productType'] = {
    in: 'path',
    required: true,
    type: 'string',
    enum: ['book', 'ebook'],
    description: 'Product type to remove'
  } */
  /* #swagger.parameters['productId'] = {
    in: 'path',
    required: true,
    type: 'string',
    description: 'Book or ebook ObjectId'
  } */
  auth(USER_ROLE.USER),
  CartController.removeItem
);

router.delete(
  '/remove-item/:bookId',
  // #swagger.tags = ['Cart']
  // #swagger.summary = 'Remove a specific audiobook item from cart (legacy)'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.USER),
  CartController.removeItem
);

export const CartRouter = router;
