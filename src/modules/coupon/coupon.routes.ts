import express from 'express';
import { CouponController } from './coupon.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constant';
import { validateRequest } from '../../middleware/validateRequest';
import { CouponValidation } from './coupon.validation';

const router = express.Router();

router.post(
  '/create-coupon',
  // #swagger.tags = ['Coupons']
  // #swagger.summary = 'Create a new coupon (Admin only)'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["email", "codeName", "expiryDate", "usesLimit", "discountType", "discountAmount"],
          properties: {
            email: { type: "string", example: "user@example.com" },
            codeName: { type: "string", example: "SAVE20" },
            expiryDate: { type: "string", example: "2024-12-31" },
            usesLimit: { type: "integer", example: 100 },
            discountType: { type: "string", enum: ["flat", "percentage"], example: "percentage" },
            discountAmount: { type: "number", example: 20 }
          }
        }
      }
    }
  } */
  auth(USER_ROLE.ADMIN),
  validateRequest(CouponValidation.createCouponSchema),
  CouponController.createCoupon
);

router.get(
  '/my-coupons',
  // #swagger.tags = ['Coupons']
  // #swagger.summary = 'Get my coupons'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.USER),
  CouponController.getMyCoupons
);

router.get(
  '/all-coupons',
  // #swagger.tags = ['Coupons']
  // #swagger.summary = 'Get all coupons'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.parameters['page'] = {
        in: 'query',
        description: 'Page number for pagination',
        type: 'integer',
        example: 1
  } */
  /* #swagger.parameters['limit'] = {
        in: 'query',
        description: 'Number of coupons per page',
        type: 'integer',
        example: 10
  } */
  auth(USER_ROLE.ADMIN),
  CouponController.getAllCoupons
);

router.post(
  '/apply',
  // #swagger.tags = ['Coupons']
  // #swagger.summary = 'Apply a coupon code and calculate the discount'
  // #swagger.description = 'Calculates coupon discount for direct bookId, direct ebookId, mixed items, or the current cart when only couponCode is sent.'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["couponCode"],
          properties: {
            couponCode: { type: "string", example: "SAVE20" },
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
  validateRequest(CouponValidation.applyCouponSchema),
  CouponController.applyCoupon
);

router.delete(
  '/:couponId',
  // #swagger.tags = ['Coupons']
  // #swagger.summary = 'Delete a coupon by ID (Admin only)'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.parameters['couponId'] = {
        in: 'path',
        description: 'ID of the coupon to delete',
        required: true,
        type: 'string',
        example: '64f1a2b3c4d5e6f7a8b9c0d1'
  } */
  auth(USER_ROLE.ADMIN),
  CouponController.deleteCoupon
);

export const CouponRouter = router;
