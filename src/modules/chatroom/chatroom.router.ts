import { Router } from "express";
import auth from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { chatroomController } from "./chatroom.controller";
import { ChatroomValidation } from "./chatroom.validation";

const router = Router();

// Public — history দেখতে login লাগবে
router.get(
  "/messages",
  auth("user", "admin", "author"),
  chatroomController.getAllMessages,
);

// Pinned messages — সবাই দেখতে পারবে (login ছাড়াও)
router.get("/messages/pinned", chatroomController.getPinnedMessages);

// "See My Replies" — শুধু logged in user
router.get(
  "/messages/my-replies",
  auth("user", "admin", "author"),
  chatroomController.getRepliesToMe,
);

// Send message via REST (socket না থাকলে fallback)
router.post(
  "/messages",
  auth("user", "admin", "author"),
  validateRequest(ChatroomValidation.sendMessageSchema),
  chatroomController.sendMessage,
);

// React to message
router.post(
  "/messages/:messageId/react",
  auth("user", "admin", "author"),
  validateRequest(ChatroomValidation.reactToMessageSchema),
  chatroomController.reactToMessage,
);

// Admin only
router.patch(
  "/messages/:messageId/pin",
  auth("admin", "author"),
  chatroomController.togglePinMessage,
);
router.delete(
  "/messages/:messageId",
  auth("admin", "author"),
  chatroomController.deleteMessage,
);

const chatroomRouter = router;
export default chatroomRouter;
