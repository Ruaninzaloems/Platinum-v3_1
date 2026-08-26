import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import router from "./Controllers";
import { authMiddleware } from "./Middleware/auth";
import { errorHandler } from "./Middleware/errorHandler";

const app: Express = express();

app.use(
  cors({
    allowedHeaders: ["Content-Type", "Authorization", "x-user"],
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", (req: Request, _res: Response, next: NextFunction) => {
  if (!req.headers["x-user"]) {
    req.headers["x-user"] = "admin";
  }
  next();
}, authMiddleware, router);

app.use(errorHandler);

export default app;
