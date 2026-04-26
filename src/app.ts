import cookieParser from "cookie-parser";
import express, { Application, Request, Response, NextFunction } from "express";
import globalErrorHandler from "./middleware/globalErrorHandler";
import notFound from "./middleware/notFound";
import { applySecurity } from "./middleware/security";
import router from "./router";
import morgan from "morgan";
import config from "./config";

const app: Application = express();

app.use(express.static("public"));
if (config.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ✅ Webhook route এ raw body দরকার — express.json() এর আগে রাখতে হবে
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === "/api/v1/order/webhook/paypal") {
    express.raw({ type: "application/json" })(req, res, (err) => {
      if (err) return next(err);
      (req as any).rawBody = req.body.toString("utf8");
      next();
    });
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

applySecurity(app);

app.use("/api/v1", router);

app.get("/", (_req, res) => {
  res.send("Hey there! Welcome to our API.");
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
