import { Router } from "express";
import userRouter from "../modules/user/user.router";
import authRouter from "../modules/auth/auth.router";
import bookCategoryRouter from "../modules/bookCategory/bookCategory.router";
import bookRouter from "../modules/book/book.router";
import { OrderRouter } from "../modules/order/order.routes";
import { CouponRouter } from "../modules/coupon/coupon.routes";
import { CartRouter } from "../modules/cart/cart.routes";
import reviewRouter from "../modules/review/review.router";
import { AdminDashboardRoutes } from "../modules/adminDashboard/adminDashboard.routes";

const router = Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRouter,
  },
  {
    path: "/auth",
    route: authRouter,
  },
  {
    path: "/bookcategory",
    route: bookCategoryRouter,
  },
  {
    path: "/book",
    route: bookRouter,
  },
  {
    path: "/review",
    route: reviewRouter,
  },
  {
    path: "/cart",
    route: CartRouter,
  },
  {
    path: "/order",
    route: OrderRouter,
  },
  {
    path: "/coupon",
    route: CouponRouter,
  },
  {
    path: "/admin-dashboard",
    route: AdminDashboardRoutes,
  }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
