import express from 'express';
import { OrderController } from './order.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constant';
import { validateRequest } from '../../middleware/validateRequest';
import { OrderValidation } from './order.validation';

const router = express.Router();

router.post(
  '/webhook',
  // #swagger.tags = ['Orders']
  // #swagger.summary = 'PayPal webhook handler'
  // #swagger.security = []
  OrderController.handlePayPalWebhook
);

router.post(
  '/checkout',
  // #swagger.tags = ['Orders']
  // #swagger.summary = 'Create a PayPal checkout order'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            bookId: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            quantity: { type: "integer", example: 1 },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  bookId: { type: "string" },
                  quantity: { type: "integer", example: 1 }
                }
              }
            },
            couponCode: { type: "string", example: "SAVE20" }
          }
        }
      }
    }
  } */
  auth(USER_ROLE.USER),
  validateRequest(OrderValidation.createCheckoutSessionSchema),
  OrderController.createPayPalOrder
);

router.post(
  '/verify-payment',
  // #swagger.tags = ['Orders']
  // #swagger.summary = 'Verify a PayPal payment'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["paypalOrderId"],
          properties: {
            paypalOrderId: { type: "string", example: "5O190127TN364715T" }
          }
        }
      }
    }
  } */
  auth(USER_ROLE.USER),
  validateRequest(OrderValidation.verifyPaymentSchema),
  OrderController.verifyPayment
);

router.get(
  '/my-orders',
  // #swagger.tags = ['Orders']
  // #swagger.summary = 'Get my order history'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.USER),
  OrderController.getMyOrders
);

router.get(
  '/:orderId',
  // #swagger.tags = ['Orders']
  // #swagger.summary = 'Get order by ID'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.USER),
  OrderController.getOrderById
);

export const OrderRouter = router;