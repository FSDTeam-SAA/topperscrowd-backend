import { ZodSchema, ZodError } from "zod";
import { RequestHandler, NextFunction, Request, Response } from "express";
import CustomError from "../errors/customError";

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
          new CustomError(400, "At least one field should be updated", [
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
        });
      }

      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        const errors = err.issues.map((issue) => ({
          field: issue.path[issue.path.length - 1] ?? "unknown",
          message: issue.message,
        }));
        return next(new CustomError(400, "Validation failed", errors));
      }
      next(err);
    }
  };
};
