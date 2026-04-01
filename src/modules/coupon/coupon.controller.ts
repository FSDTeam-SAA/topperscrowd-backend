import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CouponService } from './coupon.service';

const createCoupon = catchAsync(async (req: Request, res: Response) => {
  // Expected to be called by ADMIN
  const result = await CouponService.createCoupon(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Coupon created and emailed successfully',
    data: result,
  });
});

const getMyCoupons = catchAsync(async (req: Request, res: Response) => {
  // Called by USER
  const userId = req.user.id;
  const result = await CouponService.getMyCoupons(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Active coupons retrieved successfully',
    data: result,
  });
});

export const CouponController = {
  createCoupon,
  getMyCoupons,
};
