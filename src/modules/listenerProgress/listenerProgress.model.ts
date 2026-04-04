import { model, Schema } from "mongoose";
import { IListenerProgress } from "./listenerProgress.interface";

const listenerProgressSchema = new Schema<IListenerProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    progress: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalDuration: {
      type: Number,
      min: 0,
    },
    lastListenedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one progress record per user per book
listenerProgressSchema.index({ user: 1, book: 1 }, { unique: true });

const ListenerProgress = model<IListenerProgress>(
  "ListenerProgress",
  listenerProgressSchema
);

export default ListenerProgress;
