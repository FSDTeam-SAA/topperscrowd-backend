import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import fs from "fs";
import config from "../config";
import AppError from "../errors/AppError";

const LARGE_UPLOAD_THRESHOLD_BYTES = 100 * 1024 * 1024;
const CLOUDINARY_CHUNK_SIZE_BYTES = 20 * 1024 * 1024;

// configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

// upload file
export const uploadToCloudinary = async (filePath: string, folder: string) => {
  try {
    const fileSize = fs.statSync(filePath).size;
    const uploadOptions = {
      folder,
      resource_type: "auto" as const,
    };

    const result =
      fileSize > LARGE_UPLOAD_THRESHOLD_BYTES
        ? await (cloudinary.uploader.upload_large(filePath, {
            ...uploadOptions,
            chunk_size: CLOUDINARY_CHUNK_SIZE_BYTES,
          }) as Promise<UploadApiResponse>)
        : await cloudinary.uploader.upload(filePath, uploadOptions);

    // delete local file after upload
    await fs.promises.unlink(filePath);

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      resource_type: result.resource_type as "image" | "video" | "raw",
    };
  } catch {
    await fs.promises.unlink(filePath).catch(() => undefined);
    throw new AppError("Failed to upload file to Cloudinary", 400);
  }
};

// delete file
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: "image" | "video" | "raw"
) => {
  const resourceTypes: ("image" | "video" | "raw")[] = [
    resourceType,
    ...(["image", "video", "raw"] as const).filter((type) => type !== resourceType),
  ];

  for (const type of resourceTypes) {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: type,
      });

      if (result?.result === "ok") {
        return true;
      }
    } catch {
      // Try the next resource type. Cloudinary may classify PDFs/audio differently
      // depending on upload options and account settings.
    }
  }

  throw new Error("Failed to delete file from Cloudinary");
};
