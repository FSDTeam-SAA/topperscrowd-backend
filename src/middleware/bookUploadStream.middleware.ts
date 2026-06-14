import { NextFunction, Request, RequestHandler, Response } from "express";
import Busboy from "busboy";
import path from "path";
import { Readable } from "stream";
import AppError from "../errors/AppError";
import {
  CloudinaryUploadedAsset,
  deleteFromCloudinary,
  uploadImageStreamToCloudinary,
  uploadLargeMediaStreamToCloudinary,
} from "../utils/cloudinary";
import logger from "../logger";

const MAX_UPLOAD_SIZE_BYTES = 1024 * 1024 * 1024;

type BookUploadField = "image" | "audio";

type StreamedBookUploads = Partial<Record<BookUploadField, CloudinaryUploadedAsset>>;

type UploadingRequest = Request & {
  streamedUploads?: StreamedBookUploads;
  uploadedCloudinaryAssets?: CloudinaryUploadedAsset[];
};

const allowedFileTypes: Record<BookUploadField, RegExp> = {
  image: /jpeg|jpg|png|avif|webp/,
  audio: /mp3|wav|m4a|mpeg|mp4|aac|ogg/,
};

const isAllowedFile = (
  fieldName: string,
  fileName: string,
  mimeType: string,
): fieldName is BookUploadField => {
  if (fieldName !== "image" && fieldName !== "audio") return false;

  const fileTypes = allowedFileTypes[fieldName];
  const extension = path.extname(fileName).toLowerCase().replace(".", "");

  return fileTypes.test(mimeType) && fileTypes.test(extension);
};

const cleanupCloudinaryAssets = async (assets: CloudinaryUploadedAsset[]) => {
  await Promise.allSettled(
    assets.map((asset) =>
      deleteFromCloudinary(asset.public_id, asset.resource_type).catch((error) => {
        logger.error(
          { error, publicId: asset.public_id },
          "Failed to clean streamed Cloudinary asset after upload error",
        );
      }),
    ),
  );
};

export const streamBookUpload: RequestHandler = (
  req: UploadingRequest,
  _res: Response,
  next: NextFunction,
) => {
  if (!req.is("multipart/form-data")) {
    next();
    return;
  }

  const uploadedAssets: CloudinaryUploadedAsset[] = [];
  const streamedUploads: StreamedBookUploads = {};
  const uploadTasks: Promise<void>[] = [];
  const fieldCounts: Partial<Record<BookUploadField, number>> = {};

  let finished = false;
  let finalError: Error | null = null;

  const busboy = Busboy({
    headers: req.headers,
    limits: {
      fileSize: MAX_UPLOAD_SIZE_BYTES,
      files: 2,
      fields: 40,
    },
  });

  const finishWithError = async (error: Error) => {
    if (finished) return;
    finished = true;
    await cleanupCloudinaryAssets(uploadedAssets);
    next(error);
  };

  const abort = (error: Error) => {
    if (finalError) return;
    finalError = error;
    req.unpipe(busboy);
    req.resume();
    busboy.destroy(error);
  };

  busboy.on("field", (name: string, value: string) => {
    req.body = {
      ...req.body,
      [name]: value,
    };
  });

  busboy.on(
    "file",
    (
      fieldName: string,
      file: Readable,
      info: { filename?: string; mimeType?: string },
    ) => {
      const fileName = info.filename || "";
      const mimeType = info.mimeType || "";

      if (!isAllowedFile(fieldName, fileName, mimeType)) {
        file.resume();
        abort(new AppError(`Invalid file type for field ${fieldName}`, 400));
        return;
      }

      fieldCounts[fieldName] = (fieldCounts[fieldName] || 0) + 1;
      if (fieldCounts[fieldName] > 1) {
        file.resume();
        abort(new AppError(`Only one ${fieldName} file is allowed`, 400));
        return;
      }

      const uploadPromise =
        fieldName === "image"
          ? uploadImageStreamToCloudinary(file, "books")
          : uploadLargeMediaStreamToCloudinary(file, "books");

      file.on("limit", () => {
        const error = new AppError(
          `${fieldName} file exceeds the 1 GB upload limit`,
          413,
        );
        file.destroy(error);
        abort(error);
      });

      uploadTasks.push(
        uploadPromise
          .then((asset) => {
            uploadedAssets.push(asset);
            streamedUploads[fieldName] = asset;
          })
          .catch((error: Error) => {
            abort(error);
          }),
      );
    },
  );

  busboy.on("filesLimit", () => {
    abort(new AppError("Only image and audio files are allowed", 400));
  });

  busboy.on("fieldsLimit", () => {
    abort(new AppError("Too many form fields", 400));
  });

  busboy.on("error", (error: Error) => {
    finishWithError(finalError || error);
  });

  busboy.on("finish", async () => {
    if (finished) return;

    if (finalError) {
      await finishWithError(finalError);
      return;
    }

    try {
      await Promise.all(uploadTasks);

      if (finalError) {
        await finishWithError(finalError);
        return;
      }

      req.streamedUploads = streamedUploads;
      req.uploadedCloudinaryAssets = uploadedAssets;
      finished = true;
      next();
    } catch (error) {
      await finishWithError(
        error instanceof Error
          ? error
          : new AppError("Failed to process upload", 400),
      );
    }
  });

  req.on("aborted", () => {
    abort(new AppError("Upload request was aborted", 400));
  });

  req.pipe(busboy);
};
