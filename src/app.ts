import cookieParser from "cookie-parser";
import express, { Application } from "express";
import globalErrorHandler from "./middleware/globalErrorHandler";
import notFound from "./middleware/notFound";

import { applySecurity } from "./middleware/security";
import router from "./router";
import morgan from "morgan";
import config from "./config";
import path from "path";
import { apiReference } from "@scalar/express-api-reference";

const app: Application = express();
app.set("trust proxy", 1);

app.use(express.static("public"));
if (config.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(cookieParser());

applySecurity(app);

app.use("/api/v1", router);

app.use("/swagger.json", express.static(path.join(process.cwd(), "swagger_output.json")));

app.use(
  "/docs",
  apiReference({
    theme: "default",
    layout: "classic",
    url: "/swagger.json",
  })
);
app.get("/", (_req, res) => {
  res.send("Hey there! Welcome to our API.");
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
