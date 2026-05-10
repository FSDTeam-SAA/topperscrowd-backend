import { Router } from "express";
import auth from "../../middleware/auth";
import { validateRequest } from "../../middleware/validateRequest";
import { chatroomController } from "./chatroom.controller";
import { ChatroomValidation } from "./chatroom.validation";

const router = Router();

// Public — history দেখতে login লাগবে
router.get(
  "/messages",
  // #swagger.tags = ['Chatroom']
  // #swagger.summary = 'Get chatroom messages'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth("user", "admin", "author"),
  chatroomController.getAllMessages,
);

// Pinned messages — সবাই দেখতে পারবে (login ছাড়াও)
router.get(
  "/messages/pinned",
  // #swagger.tags = ['Chatroom']
  // #swagger.summary = 'Get pinned messages'
  // #swagger.security = []
  chatroomController.getPinnedMessages
);

// "See My Replies" — শুধু logged in user
router.get(
  "/messages/my-replies",
  // #swagger.tags = ['Chatroom']
  // #swagger.summary = 'Get replies directed to me'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth("user", "admin", "author"),
  chatroomController.getRepliesToMe,
);

// Send message via REST (socket না থাকলে fallback)
router.post(
  "/messages",
  // #swagger.tags = ['Chatroom']
  // #swagger.summary = 'Send a message'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["content"],
          properties: {
            content: { type: "string", example: "Hello everyone!" },
            replyTo: {
              type: "object",
              properties: {
                messageId: { type: "string" }
              }
            }
          }
        }
      }
    }
  } */
  auth("user", "admin", "author"),
  validateRequest(ChatroomValidation.sendMessageSchema),
  chatroomController.sendMessage,
);

// React to message
router.post(
  "/messages/:messageId/react",
  // #swagger.tags = ['Chatroom']
  // #swagger.summary = 'React to a message'
  // #swagger.security = [{ "bearerAuth": [] }]
  /* #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["emoji"],
          properties: {
            emoji: { type: "string", example: "👍" }
          }
        }
      }
    }
  } */
  auth("user", "admin", "author"),
  validateRequest(ChatroomValidation.reactToMessageSchema),
  chatroomController.reactToMessage,
);

// Admin only
router.patch(
  "/messages/:messageId/pin",
  // #swagger.tags = ['Chatroom']
  // #swagger.summary = 'Pin or unpin a message'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth("admin", "author"),
  chatroomController.togglePinMessage,
);
router.delete(
  "/messages/:messageId",
  // #swagger.tags = ['Chatroom']
  // #swagger.summary = 'Delete a message'
  // #swagger.security = [{ "bearerAuth": [] }]
  auth("admin", "author"),
  chatroomController.deleteMessage,
);

const chatroomRouter = router;
export default chatroomRouter;
