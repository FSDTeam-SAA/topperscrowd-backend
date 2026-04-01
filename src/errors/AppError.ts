class AppError extends Error {
  public statusCode: number;
  public status: "client Error" | "server Error";
  public isOperationalError: boolean;
  public data?: any;

  constructor(message: string, statusCode: number, data?: any, stack?: string) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    this.status =
      statusCode >= 400 && statusCode < 500 ? "client Error" : "server Error";
    this.isOperationalError =
      statusCode >= 400 && statusCode < 500 ? false : true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;
