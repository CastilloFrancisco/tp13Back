import express from "express";
import routes from "./routes/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use("/api", routes);
  app.use(errorMiddleware);

  return app;
}

export default createApp;
