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
  // #swagger.tags = ['Listener Progress']
  // #swagger.summary = 'Update or create listening progress'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["bookId", "progress"],
          properties: {
            bookId: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            progress: { type: "number", example: 120 },
            totalDuration: { type: "number", example: 3600 }
          }
        }
      }
    }
  } */
  auth(USER_ROLE.USER),
  validateRequest(ListenerProgressValidation.updateProgressSchema),
  ListenerProgressController.updateProgress
);

// Get all progress records for the current user
router.get(
  "/my-progress",
  // #swagger.tags = ['Listener Progress']
  // #swagger.summary = 'Get my total progress records'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.USER),
  ListenerProgressController.getMyProgress
);

// Get progress for a specific book
router.get(
  "/:bookId",
  // #swagger.tags = ['Listener Progress']
  // #swagger.summary = 'Get progress for a specific book'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth(USER_ROLE.USER),
  ListenerProgressController.getProgressByBook
);

const listenerProgressRouter = router;
export default listenerProgressRouter;
