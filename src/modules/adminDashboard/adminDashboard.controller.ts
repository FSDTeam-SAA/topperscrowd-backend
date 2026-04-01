import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AdminDashboardService } from './adminDashboard.service';

const getRecentOrdersAndStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminDashboardService.getRecentOrdersAndStats(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Recent orders and stats retrieved successfully',
    data: result,
  });
});

const getUsersManagement = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminDashboardService.getUsersManagement(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users management data retrieved successfully',
    data: result,
  });
});

const getAudioManagement = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminDashboardService.getAudioManagement(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Audio management data retrieved successfully',
    data: result,
  });
});

const getReviewsManagement = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminDashboardService.getReviewsManagement(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reviews management data retrieved successfully',
    data: result,
  });
});

export const AdminDashboardController = {
  getRecentOrdersAndStats,
  getUsersManagement,
  getAudioManagement,
  getReviewsManagement
};
