import express from 'express';
import { OrderController } from './order.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constant';
import { validateRequest } from '../../middleware/validateRequest';
import { OrderValidation } from './order.validation';

const router = express.Router();

router.post(
  '/checkout',
  auth(USER_ROLE.USER),
  validateRequest(OrderValidation.createCheckoutSessionSchema),
  OrderController.createCheckoutSession
);

router.post(
  '/verify-payment',
  auth(USER_ROLE.USER),
  validateRequest(OrderValidation.verifyPaymentSchema),
  OrderController.verifyPayment
);

router.get(
  '/my-orders',
  auth(USER_ROLE.USER),
  OrderController.getMyOrders
);

router.get(
  '/:orderId',
  auth(USER_ROLE.USER),
  OrderController.getOrderById
);

export const OrderRouter = router;