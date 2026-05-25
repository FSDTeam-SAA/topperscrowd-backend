import { Schema, model } from 'mongoose';
import { ICover } from './cover.interface';

const coverSchema = new Schema<ICover>(
  {
    title: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      required: true 
    },
    image: {
      public_id: { 
        type: String, 
        required: true 
      },
      url: { 
        type: String, 
        required: true 
      },
    },
    edition: { 
      type: String, 
      required: true,
      trim: true
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Cover = model<ICover>('Cover', coverSchema);