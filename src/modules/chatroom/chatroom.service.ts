import mongoose, { Types } from "mongoose";
import AppError from "../../errors/AppError";
import { paginationHelper } from "../../utils/pafinationHelper";
import {
  broadcastNewMessage,
  broadcastPinMessage,
  broadcastDeleteMessage,
  broadcastReaction,
} from "../../socket/chat.socket";
import ChatMessage from "./chatroom.model";

// Send a new message
const sendMessage = async (req: any) => {
  const { content, replyTo } = req.body;
  const { id, email, role } = req.user;

  const messageData: any = {
    senderId: new Types.ObjectId(id),
    senderName: email,
    senderRole: role,
    content,
  };

  if (replyTo) {
    const message = await ChatMessage.findById(replyTo.messageId);
    if (!message) throw new AppError("Invalid reply message id", 400);
    messageData.replyTo = {
      messageId: new Types.ObjectId(replyTo.messageId),
      senderName: message.senderName,
      contentPreview: message.content.slice(0, 60),
    };
  }

  const saved = await ChatMessage.create(messageData);
  if (!saved) throw new AppError("Failed to send message", 400);

  // Socket broadcast
  await broadcastNewMessage(saved);

  return saved;
};

// Get all messages with pagination
const getAllMessages = async (req: any) => {
  const { page = 1, limit = 30 } = req.query;
  const { skip, limit: perPage } = paginationHelper(page, limit);

  const filter = { isDeleted: false };

  const [data, total] = await Promise.all([
    ChatMessage.find(filter).sort({ createdAt: 1 }).skip(skip).limit(perPage),
    ChatMessage.countDocuments(filter),
  ]);

  return {
    data,
    meta: {
      page: Number(page),
      limit: Number(perPage),
      total,
      totalPage: Math.ceil(total / perPage),
    },
  };
};

// Get pinned messages
const getPinnedMessages = async () => {
  return await ChatMessage.find({
    isPinned: true,
    isDeleted: false,
  }).sort({ createdAt: -1 });
};

// Get replies to current user's messages
const getRepliesToMe = async (req: any) => {
  const { id } = req.user;
  const { page = 1, limit = 20 } = req.query;
  const { skip, limit: perPage } = paginationHelper(page, limit);

  const myMessages = await ChatMessage.find(
    { senderId: new Types.ObjectId(id), isDeleted: false },
    { _id: 1 },
  );
  const myMessageIds = myMessages.map((m) => m._id);

  const filter = {
    "replyTo.messageId": { $in: myMessageIds },
    isDeleted: false,
  };

  const [data, total] = await Promise.all([
    ChatMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage),
    ChatMessage.countDocuments(filter),
  ]);

  return {
    data,
    meta: {
      page: Number(page),
      limit: Number(perPage),
      total,
      totalPage: Math.ceil(total / perPage),
    },
  };
};

// Pin / Unpin — admin only
const togglePinMessage = async (req: any) => {
  const { messageId } = req.params;
  const { id } = req.user;

  if (!mongoose.isValidObjectId(messageId))
    throw new AppError("Invalid message id", 400);

  const message = await ChatMessage.findById(messageId);
  if (!message) throw new AppError("Message not found", 404);
  if (message.isDeleted)
    throw new AppError("Cannot pin a deleted message", 400);

  message.isPinned = !message.isPinned;
  message.pinnedBy = message.isPinned ? new Types.ObjectId(id) : undefined;
  await message.save();

  // Socket broadcast
  broadcastPinMessage(message._id.toString(), message.isPinned);

  return message;
};

// React to message
const reactToMessage = async (req: any) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const { id: userId } = req.user;

  if (!mongoose.isValidObjectId(messageId))
    throw new AppError("Invalid message id", 400);

  const message = await ChatMessage.findById(messageId);
  if (!message) throw new AppError("Message not found", 404);
  if (message.isDeleted)
    throw new AppError("Cannot react to a deleted message", 400);

  const existingIndex = message.reactions.findIndex(
    (r) => r.userId.toString() === userId && r.emoji === emoji,
  );

  if (existingIndex > -1) {
    message.reactions.splice(existingIndex, 1);
  } else {
    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId,
    );
    message.reactions.push({
      userId: new Types.ObjectId(userId),
      emoji,
    });
  }

  await message.save();

  // Socket broadcast
  broadcastReaction(message._id.toString(), message.reactions);

  return message;
};

// Delete — admin only (soft delete)
const deleteMessage = async (req: any) => {
  const { messageId } = req.params;

  if (!mongoose.isValidObjectId(messageId))
    throw new AppError("Invalid message id", 400);

  const result = await ChatMessage.findByIdAndUpdate(
    messageId,
    { isDeleted: true },
    { new: true },
  );

  if (!result) throw new AppError("Message not found", 404);

  // Socket broadcast
  broadcastDeleteMessage(messageId);

  return result;
};

const chatroomService = {
  sendMessage,
  getAllMessages,
  getPinnedMessages,
  getRepliesToMe,
  togglePinMessage,
  reactToMessage,
  deleteMessage,
};

export default chatroomService;
