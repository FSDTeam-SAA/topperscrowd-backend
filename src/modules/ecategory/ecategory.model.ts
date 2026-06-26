import { Schema, model } from "mongoose";
import { IEcategory } from "./ecategory.interface";


const categorySchema = new Schema<IEcategory>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    image: {
      public_id: String,
      url: String,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

export const Category = model<IEcategory>("Ecategory", categorySchema);
