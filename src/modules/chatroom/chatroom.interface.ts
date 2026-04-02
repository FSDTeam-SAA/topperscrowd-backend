import { Model, Types } from "mongoose";

export interface IReplyTo {
  messageId: Types.ObjectId;
  senderName: string;
  contentPreview: string; // first 60 chars
}

export interface IChatMessage {
  senderId: Types.ObjectId;
  senderName: string;
  senderRole: "user" | "admin" | "author";
  content: string;
  replyTo?: IReplyTo;
  isPinned: boolean;
  pinnedBy?: Types.ObjectId;
  reactions: IReaction[];
  isDeleted: boolean;
}

export interface IReaction {
  userId: Types.ObjectId;
  emoji: string; // "👍" | "❤️" | "🙌"
}

export interface IChatMessageUpdate {
  content?: string;
  isPinned?: boolean;
  isDeleted?: boolean;
}

export type ChatMessageModel = Model<IChatMessage>;