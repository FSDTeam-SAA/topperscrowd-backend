import { model, Schema } from "mongoose";
import { IChatMessage } from "./chatroom.interface";

const reactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true },
  },
  { _id: false },
);

const chatMessageSchema = new Schema<IChatMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      // required: true,
    },
    senderRole: {
      type: String,
      enum: ["user", "admin", "author"],
      required: true,
    },
    content: {
      type: String,
      // required: true,
      trim: true,
      maxlength: 2000,
    },
    replyTo: {
      messageId: { type: Schema.Types.ObjectId, ref: "ChatMessage" },
      senderName: { type: String },
      contentPreview: { type: String },
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reactions: {
      type: [reactionSchema],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const ChatMessage = model<IChatMessage>("ChatMessage", chatMessageSchema);
export default ChatMessage;
