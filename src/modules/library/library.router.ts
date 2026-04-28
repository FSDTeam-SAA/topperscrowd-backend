import { Router } from "express";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";
import { libraryController } from "./library.controller";

const router = Router();

router.get("/stats", auth(USER_ROLE.USER, USER_ROLE.ADMIN), libraryController.getLibraryStats);
router.get("/continue-listening", auth(USER_ROLE.USER, USER_ROLE.ADMIN), libraryController.getContinueListening);
router.get("/recent-purchases", auth(USER_ROLE.USER, USER_ROLE.ADMIN), libraryController.getRecentPurchases);
router.get("/my-books", auth(USER_ROLE.USER, USER_ROLE.ADMIN), libraryController.getMyBooks);

const libraryRouter = router;
export default libraryRouter;
