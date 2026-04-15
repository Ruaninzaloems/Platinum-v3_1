import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable, rolePermissionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    displayName: string;
    email: string;
    role: string;
    departmentId: number | null;
    isActive: boolean;
    permissions: string[];
  };
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const username = req.headers["x-user"] as string | undefined;
  if (!username) {
    res.status(401).json({ error: "Authentication required. Provide X-User header." });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user) {
    res.status(401).json({ error: `User '${username}' not found` });
    return;
  }
  if (!user.isActive) {
    res.status(403).json({ error: "User account is deactivated" });
    return;
  }
  const perms = await db.select().from(rolePermissionsTable).where(eq(rolePermissionsTable.roleCode, user.role));
  req.user = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
    isActive: user.isActive,
    permissions: perms.map(p => p.permission),
  };
  next();
}

export function requirePermission(...permissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !user.isActive) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (user.permissions.includes("*")) {
      next();
      return;
    }
    const hasPermission = permissions.some(p => user.permissions.includes(p));
    if (!hasPermission) {
      res.status(403).json({ error: "Forbidden", required: permissions });
      return;
    }
    next();
  };
}
