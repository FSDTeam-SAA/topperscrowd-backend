import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constant';
import { AdminDashboardController } from './adminDashboard.controller';

const router = express.Router();

router.get(
  '/recent-orders-stats',
  // #swagger.tags = ['Admin Dashboard']
  // #swagger.summary = 'Get recent orders and stats (Admin only)'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.ADMIN),
  AdminDashboardController.getRecentOrdersAndStats
);

router.get(
  '/users-management',
  // #swagger.tags = ['Admin Dashboard']
  // #swagger.summary = 'Get users management data (Admin only)'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.ADMIN),
  AdminDashboardController.getUsersManagement
);

router.get(
  '/audio-management',
  // #swagger.tags = ['Admin Dashboard']
  // #swagger.summary = 'Get audio management data (Admin only)'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.ADMIN),
  AdminDashboardController.getAudioManagement
);

router.get(
  '/reviews-management',
  // #swagger.tags = ['Admin Dashboard']
  // #swagger.summary = 'Get reviews management data (Admin only)'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.ADMIN),
  AdminDashboardController.getReviewsManagement
);

export const AdminDashboardRoutes = router;
