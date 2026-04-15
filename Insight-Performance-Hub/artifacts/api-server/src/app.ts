import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import router from "./routes";
import { authMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use("/api", (req: Request, _res: Response, next: NextFunction) => {
    if (!req.headers["x-user"]) {
      req.headers["x-user"] = "admin";
    }
    next();
  }, authMiddleware, router);
} else {
  app.use("/api", authMiddleware, router);
}

app.use(errorHandler);

export default app;
