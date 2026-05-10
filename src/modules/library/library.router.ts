import { Router } from "express";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";
import { libraryController } from "./library.controller";

const router = Router();

router.get(
  "/stats",
  // #swagger.tags = ['Library']
  // #swagger.summary = 'Get library statistics'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  libraryController.getLibraryStats
);

router.get(
  "/continue-listening",
  // #swagger.tags = ['Library']
  // #swagger.summary = 'Get books to continue listening'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  libraryController.getContinueListening
);

router.get(
  "/recent-purchases",
  // #swagger.tags = ['Library']
  // #swagger.summary = 'Get recently purchased books'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  libraryController.getRecentPurchases
);

router.get(
  "/my-books",
  // #swagger.tags = ['Library']
  // #swagger.summary = 'Get all my books'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.USER, USER_ROLE.ADMIN),
  libraryController.getMyBooks
);

const libraryRouter = router;
export default libraryRouter;
