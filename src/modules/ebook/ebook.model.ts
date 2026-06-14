import { Schema, model } from "mongoose";
import { IEbook, EEbookFormat } from "./ebook.interface";

const ebookSchema = new Schema<IEbook>(
  {
    title: { 
      type: String, 
      required: true, 
      trim: true 
    },
    slug: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    author: { 
      type: String, 
      required: true, 
      trim: true 
    },
    coverImage: {
      public_id: { type: String, required: true },
      url: { type: String, required: true },
    },
    file: {
      public_id: { type: String, required: true },
      url: { type: String, required: true },
      fileSize: { type: String },
    },
    formatType: {
      type: String,
      enum: Object.values(EEbookFormat),
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Ecategory", // Matches your exact model registration name
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isPremium: { 
      type: Boolean, 
      default: false 
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    saleCount: {
      type: Number,
      default: 0,
    },
    downloadCount: { 
      type: Number, 
      default: 0 
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// High-Performance Optimization: Compound index for quick frontend layout segregation
ebookSchema.index({ category: 1, formatType: 1 });
ebookSchema.index({ slug: 1 });

export const Ebook = model<IEbook>("Ebook", ebookSchema);
