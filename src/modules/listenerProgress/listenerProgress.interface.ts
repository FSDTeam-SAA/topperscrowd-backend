import { Types } from "mongoose";

export interface IListenerProgress {
  user: Types.ObjectId;
  book: Types.ObjectId;
  progress: number; // in seconds – the timestamp where the user left off
  totalDuration?: number; // in seconds – optional, useful for % completion
  lastListenedAt: Date;
}
