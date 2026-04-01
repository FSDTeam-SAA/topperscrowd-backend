import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constant';
import { AdminDashboardController } from './adminDashboard.controller';

const router = express.Router();

router.get(
  '/recent-orders-stats',
  auth(USER_ROLE.ADMIN),
  AdminDashboardController.getRecentOrdersAndStats
);

router.get(
  '/users-management',
  auth(USER_ROLE.ADMIN),
  AdminDashboardController.getUsersManagement
);

router.get(
  '/audio-management',
  auth(USER_ROLE.ADMIN),
  AdminDashboardController.getAudioManagement
);

router.get(
  '/reviews-management',
  auth(USER_ROLE.ADMIN),
  AdminDashboardController.getReviewsManagement
);

export const AdminDashboardRoutes = router;
