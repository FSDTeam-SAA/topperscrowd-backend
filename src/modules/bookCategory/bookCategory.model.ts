import { model, Schema } from "mongoose";
import { IBookCategory } from "./bookCategory.interface";

const bookCategorySchema = new Schema<IBookCategory>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      public_id: String,
      secure_url: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const BookCategory = model<IBookCategory>("BookCategory", bookCategorySchema);

export default BookCategory;
