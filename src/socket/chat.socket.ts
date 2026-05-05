import { Server, Socket } from "socket.io";
import mongoose from "mongoose";
import logger from "../logger";
import { verifyToken } from "../utils/tokenGenerate";
import config from "../config";
import ChatMessage from "../modules/chatroom/chatroom.model";

const onlineUsers = new Map<string, string>();
let chatIO: Server | null = null;

// io instance export — service থেকে use করার জন্য
export const getChatIO = () => chatIO;

// online user check — service থেকে use করার জন্য
export const getOnlineUsers = () => onlineUsers;

const initChatSocket = (io: Server) => {
  chatIO = io;

  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Authentication required"));

      const decoded = verifyToken(token as string, config.JWT_SECRET as string);
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user;
    const userId: string = user.userId;
    const userEmail: string = user.email;
    const userRole: string = user.role;

    logger.info(`Chat connected: ${userEmail} (${userRole})`);

    onlineUsers.set(userId, socket.id);

    if (userRole === "admin" || userRole === "author") {
      io.emit("authorOnline", { isOnline: true, name: userEmail });
    }

    // ─── Send Message ─────────────────────────────────────
    socket.on(
      "sendMessage",
      async (data: {
        content: string;
        replyTo?: {
          messageId: string;
          senderName: string;
          contentPreview: string;
        };
      }) => {
        try {
          if (!data.content?.trim()) return;

          const messageData: any = {
            senderId: new mongoose.Types.ObjectId(userId),
            senderName: userEmail,
            senderRole: userRole,
            content: data.content.trim().slice(0, 2000),
          };

          if (
            data.replyTo?.messageId &&
            mongoose.isValidObjectId(data.replyTo.messageId)
          ) {
            messageData.replyTo = {
              messageId: new mongoose.Types.ObjectId(data.replyTo.messageId),
              senderName: data.replyTo.senderName,
              contentPreview: data.replyTo.contentPreview?.slice(0, 60),
            };
          }

          const saved = await ChatMessage.create(messageData);

          // Service function use করো broadcast এর জন্য
          broadcastNewMessage(saved);
        } catch (err) {
          logger.error({ err }, "sendMessage error");
          socket.emit("error", { message: "Failed to send message" });
        }
      },
    );

    // ─── Pin Message ──────────────────────────────────────
    socket.on("pinMessage", async (data: { messageId: string }) => {
      try {
        if (userRole !== "admin" && userRole !== "author") {
          socket.emit("error", {
            message: "Not authorized to pin messages",
          });
          return;
        }

        if (!mongoose.isValidObjectId(data.messageId)) return;

        const message = await ChatMessage.findById(data.messageId);
        if (!message) return;
        if (message.isDeleted) return;

        message.isPinned = !message.isPinned;
        message.pinnedBy = message.isPinned
          ? new mongoose.Types.ObjectId(userId)
          : undefined;
        await message.save();

        broadcastPinMessage(message._id.toString(), message.isPinned);
      } catch (err) {
        logger.error({ err }, "pinMessage error");
      }
    });

    // ─── Delete Message ───────────────────────────────────
    socket.on("deleteMessage", async (data: { messageId: string }) => {
      try {
        if (userRole !== "admin" && userRole !== "author") {
          socket.emit("error", { message: "Not authorized" });
          return;
        }

        if (!mongoose.isValidObjectId(data.messageId)) return;

        await ChatMessage.findByIdAndUpdate(data.messageId, {
          isDeleted: true,
        });

        broadcastDeleteMessage(data.messageId);
      } catch (err) {
        logger.error({ err }, "deleteMessage error");
      }
    });

    // ─── Disconnect ───────────────────────────────────────
    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      logger.info(`Chat disconnected: ${userEmail}`);

      if (userRole === "admin" || userRole === "author") {
        io.emit("authorOnline", { isOnline: false, name: userEmail });
      }
    });
  });
};

// ─── Broadcast helper functions ───────────────────────────

export const broadcastNewMessage = async (saved: any) => {
  if (!chatIO) return;

  chatIO.emit("newMessage", saved);

  if (saved.replyTo?.messageId) {
    const originalMessage = await ChatMessage.findById(saved.replyTo.messageId);
    if (originalMessage) {
      const originalSenderId = originalMessage.senderId.toString();
      const targetSocketId = onlineUsers.get(originalSenderId);

      if (targetSocketId && originalSenderId !== saved.senderId.toString()) {
        chatIO.to(targetSocketId).emit("replyReceived", {
          message: "Someone replied to your message",
          reply: saved,
        });
      }
    }
  }
};

export const broadcastPinMessage = (messageId: string, isPinned: boolean) => {
  if (!chatIO) return;
  chatIO.emit("messagePinned", { messageId, isPinned });
};

export const broadcastDeleteMessage = (messageId: string) => {
  if (!chatIO) return;
  chatIO.emit("messageDeleted", { messageId });
};

export const broadcastReaction = (messageId: string, reactions: any[]) => {
  if (!chatIO) return;
  chatIO.emit("messageReacted", { messageId, reactions });
};

export default initChatSocket;
