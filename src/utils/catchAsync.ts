import { NextFunction, Request, RequestHandler, Response } from "express";
import { fileCleanup } from "./fileCleanup";

const catchAsync = (fn: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Automatic cleanup for local files on error
      fileCleanup(req);

      next(error);
    });
  };
};

export default catchAsync;
