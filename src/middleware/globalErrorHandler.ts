import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import config from "../config";
import { TErrorSource } from "../interface/globalInterface";
import handleZodError from "../errors/handleZodError";
import handleValidationError from "../errors/handleValidationError";
import handleCastError from "../errors/handleCastError";
import handleDuplicateError from "../errors/handleDuplicateError";
import AppError from "../errors/AppError";

const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  // setting default status code and message
  let statusCode = 500;
  let message = "Something went wrong";

  let errorSource: TErrorSource = [
    {
      path: "",
      message: "Something went wrong",
    },
  ];

  // checking it's zod error and mongoose validation error ->
  if (error instanceof ZodError) {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSource = simplifiedError?.errorSource;
  } //TODO : Mongoose validation error ->
  else if (error?.name === "ValidationError") {
    const simplifiedError = handleValidationError(error);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSource = simplifiedError?.errorSource;
  } //TODO : when we get any data from database with error handling ->
  else if (error?.name === "CastError") {
    const simplifiedError = handleCastError(error);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSource = simplifiedError?.errorSource;
  } //TODO : Checking duplicate name error ->
  else if (error?.code === 11000) {
    const simplifiedError = handleDuplicateError(error);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSource = simplifiedError?.errorSource;
  } //TODO : AppError custom error handling ->
  else if (error instanceof AppError) {
    statusCode = error?.statusCode;
    message = error?.message;
    errorSource = [
      {
        path: "",
        message: error?.message,
      },
    ];

    // Include data field if it exists
    if (error.data) {
      errorSource = error.data as any;
    }
  } //TODO : unknown error handling ->
  else if (error instanceof Error) {
    message = error?.message;
    errorSource = [
      {
        path: "",
        message: error?.message,
      },
    ];
  }

  // stack serialization
  let formattedStack = null;
  if (config.nodeEnv === "development" && error.stack) {
    const lines = error.stack.split("\n");
    const firstLine = lines[0]; // The original error message
    const remaining = lines.slice(1);

    // Grouping src folder files at the top
    const srcLines = remaining.filter((l: string) => l.includes("\\src\\") || l.includes("/src/"));
    const otherLines = remaining.filter((l: string) => !l.includes("\\src\\") && !l.includes("/src/"));

    formattedStack = [firstLine, ...srcLines, ...otherLines];
  }

  // ultimate return
  res.status(statusCode).json({
    message: error?.message || message,
    success: false,
    isOperationalError: (error as any)?.isOperationalError || false,
    statusCode,
    errorSource,
    stack: formattedStack,
  });
};

export default globalErrorHandler;
