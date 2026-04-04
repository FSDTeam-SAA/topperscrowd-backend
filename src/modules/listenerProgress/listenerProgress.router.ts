import { Router } from "express";
import auth from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { USER_ROLE } from "../user/user.constant";
import { ListenerProgressController } from "./listenerProgress.controller";
import { ListenerProgressValidation } from "./listenerProgress.validation";

const router = Router();

// Update (or create) progress – authenticated users only
router.post(
  "/",
  auth(USER_ROLE.USER),
  validateRequest(ListenerProgressValidation.updateProgressSchema),
  ListenerProgressController.updateProgress
);

// Get all progress records for the current user
router.get(
  "/my-progress",
  auth(USER_ROLE.USER),
  ListenerProgressController.getMyProgress
);

// Get progress for a specific book
router.get(
  "/:bookId",
  auth(USER_ROLE.USER),
  ListenerProgressController.getProgressByBook
);

const listenerProgressRouter = router;
export default listenerProgressRouter;
