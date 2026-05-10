import { Router } from "express";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";
import { favoriteController } from "./favorite.controller";

const router = Router();

router.post(
  "/toggle",
  // #swagger.tags = ['Favorites']
  // #swagger.summary = 'Toggle favorite status for a book'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["bookId"],
          properties: {
            bookId: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" }
          }
        }
      }
    }
  } */
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  favoriteController.toggleFavorite
);

router.get(
  "/",
  // #swagger.tags = ['Favorites']
  // #swagger.summary = 'Get my favorite books'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  favoriteController.getMyFavorites
);

export default router;
