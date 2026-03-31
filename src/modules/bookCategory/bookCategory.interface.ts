import { Model } from "mongoose";

export interface IBookCategory {
  title: string;
  description: string;
  image?: {
    public_id: string;
    secure_url: string;
  };
  isActive?: boolean;
  isDeleted?: boolean;
}

export type BookCategoryModel = Model<IBookCategory>;
