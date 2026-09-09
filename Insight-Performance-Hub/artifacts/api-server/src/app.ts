import express, { type Express } from "express";
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

// NOTE: previously defaulted any caller with no x-user header to "admin"
// here, before authMiddleware ever ran -- meaning an unauthenticated caller
// was silently granted admin. Removed: authMiddleware now requires and
// verifies a real POS-API-issued Authorization: Bearer token (see
// Middleware/auth.ts), so a missing/invalid credential is rejected, not
// defaulted.
app.use("/api", authMiddleware, router);

app.use(errorHandler);

export default app;
