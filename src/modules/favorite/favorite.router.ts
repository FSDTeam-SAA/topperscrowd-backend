import { Router } from "express";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";
import { favoriteController } from "./favorite.controller";

const router = Router();

router.post(
  "/toggle",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  favoriteController.toggleFavorite
);

router.get(
  "/",
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  favoriteController.getMyFavorites
);

export default router;
