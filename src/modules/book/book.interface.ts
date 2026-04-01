import mongoose, { Model } from "mongoose";

export interface IBook {
  title: string;
  description: string;
  author: string;
  genre: mongoose.Types.ObjectId;
  price: number;
  language: string;
  reviews: mongoose.Types.ObjectId[];
  averageRating: number;
  totalReviews: number;
  saleCount: number;
  publisher: string;
  publicationYear: number;
  image: {
    public_id: string;
    secure_url: string;
  };
  audio?: {
    public_id: string;
    secure_url: string;
  };
  status: "active" | "inactive";
}

export type BookModel = Model<IBook>;
