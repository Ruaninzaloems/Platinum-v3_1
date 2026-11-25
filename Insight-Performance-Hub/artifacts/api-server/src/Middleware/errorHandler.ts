import { Request, Response, NextFunction } from "express";

interface ZodIssue {
  path: (string | number)[];
  message: string;
}

function isZodError(err: unknown): err is Error & { issues: ZodIssue[] } {
  return err instanceof Error && "issues" in err && Array.isArray((err as Record<string, unknown>).issues);
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (isZodError(err)) {
    res.status(400).json({
      error: "Validation error",
      details: err.issues.map(i => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }

  if (err instanceof Error) {
    console.error("Unhandled error:", err.message, err.stack);
    res.status(500).json({ error: "Internal server error", message: err.message });
    return;
  }

  console.error("Unknown error:", err);
  res.status(500).json({ error: "Internal server error" });
}
