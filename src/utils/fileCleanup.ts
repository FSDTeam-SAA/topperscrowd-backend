import fs from "fs";
import { Request } from "express";

/**
 * Utility to delete local files uploaded by Multer if an error occurs.
 * Handles both req.file (single) and req.files (multiple/fields).
 */
export const fileCleanup = (req: Request) => {
  try {
    // Handle single file (req.file)
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Handle multiple files (req.files)
    if (req.files) {
      if (Array.isArray(req.files)) {
        // Multi-file array
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      } else {
        // Fields-based object
        Object.values(req.files).forEach((fileArray) => {
          fileArray.forEach((file) => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        });
      }
    }
  } catch (error) {
    console.error("Error during local file cleanup:", error);
  }
};
