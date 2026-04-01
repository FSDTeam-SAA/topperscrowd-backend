import express from 'express';
import { CouponController } from './coupon.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constant';
import { validateRequest } from '../../middleware/validateRequest';
import { CouponValidation } from './coupon.validation';

const router = express.Router();

// Admin creates the coupon
router.post(
  '/create-coupon',
  auth(USER_ROLE.ADMIN),
  validateRequest(CouponValidation.createCouponSchema),
  CouponController.createCoupon
);

// User gets active coupons
router.get(
  '/my-coupons',
  auth(USER_ROLE.USER),
  CouponController.getMyCoupons
);

export const CouponRouter = router;
