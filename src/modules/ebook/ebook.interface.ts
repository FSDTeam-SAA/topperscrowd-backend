import { Types } from "mongoose";

export enum EEbookFormat {
  PDF = "PDF",
  EPUB = "EPUB",
}

export interface ICloudinaryAsset {
  public_id: string;
  url: string;
}

export interface IEbookFile extends ICloudinaryAsset {
  fileSize?: string; // e.g., "4.5 MB" (Optional but helpful for frontend UI)
}

export interface IEbook {
  title: string;
  slug: string;
  description: string;
  author: string;
  coverImage: ICloudinaryAsset;
  file: IEbookFile;
  formatType: EEbookFormat; // Differentiates PDF vs EPUB
  category: Types.ObjectId; // References Ecategory
  isPremium: boolean;
  downloadCount: number;
}