import { ZodSchema, ZodError } from "zod";
import { RequestHandler, NextFunction, Request, Response } from "express";
import AppError from "../errors/AppError";
import { fileCleanup } from "../utils/fileCleanup";

export const validateRequest = (schema: ZodSchema): RequestHandler => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const hasBody = req.body && Object.keys(req.body).length > 0;

      const hasFile =
        !!req.file ||
        (Array.isArray(req.files) && req.files.length > 0) ||
        (req.files &&
          typeof req.files === "object" &&
          Object.keys(req.files).length > 0);

      // If BOTH body and image are missing
      if (!hasBody && !hasFile) {
        return next(
          new AppError("At least one field should be updated", 400, [
            {
              field: "request",
              message: "Provide at least one field or image to update",
            },
          ]),
        );
      }

      // Validate body ONLY if it exists
      if (hasBody) {
        await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
          cookies: req.cookies,
          file: req.file,
          files: req.files,
        });
      }

      next();
    } catch (err: any) {
      // Automatic cleanup for local files on validation error
      fileCleanup(req);

      if (err instanceof ZodError) {
        const errors = err.issues.map((issue) => ({
          field: issue.path[issue.path.length - 1] ?? "unknown",
          message: issue.message,
        }));
        return next(new AppError("Validation failed", 400, errors));
      }
      next(err);
    }
  };
};
