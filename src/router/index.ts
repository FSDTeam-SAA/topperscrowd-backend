import chatroomRouter from "../modules/chatroom/chatroom.router";
import favoriteRouter from "../modules/favorite/favorite.router";
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
import libraryRouter from "../modules/library/library.router";

const router = Router();

router.use("/user", userRouter);
router.use("/auth", authRouter);
router.use("/bookcategory", bookCategoryRouter);
router.use("/book", bookRouter);
router.use("/review", reviewRouter);
router.use("/cart", CartRouter);
router.use("/chatroom", chatroomRouter);
router.use("/order", OrderRouter);
router.use("/coupon", CouponRouter);
router.use("/admin-dashboard", AdminDashboardRoutes);
router.use("/listener-progress", listenerProgressRouter);
router.use("/library", libraryRouter);
router.use("/favorite", favoriteRouter);

export default router;
