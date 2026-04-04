import chatroomRouter from "../modules/chatroom/chatroom.router";
import bookCategoryRouter from "../modules/bookCategory/bookCategory.router";
import { Router } from "express";
import userRouter from "../modules/user/user.router";
import authRouter from "../modules/auth/auth.router";

import bookRouter from "../modules/book/book.router";
import { OrderRouter } from "../modules/order/order.routes";
import { CouponRouter } from "../modules/coupon/coupon.routes";
import { CartRouter } from "../modules/cart/cart.routes";
import reviewRouter from "../modules/review/review.router";
import { AdminDashboardRoutes } from "../modules/adminDashboard/adminDashboard.routes";
import listenerProgressRouter from "../modules/listenerProgress/listenerProgress.router";

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
    path: "/chatroom",
    route: chatroomRouter,
  },
  { path: "/order", route: OrderRouter },
  {
    path: "/coupon",
    route: CouponRouter,
  },
  {
    path: "/admin-dashboard",
    route: AdminDashboardRoutes,
  },
  {
    path: "/listener-progress",
    route: listenerProgressRouter,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
