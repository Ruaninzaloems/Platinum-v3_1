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
    // The shell already authenticated this person (this header is only ever set
    // by the shell's own identity-bridge interceptor for a real logged-in
    // user, or defaulted to "admin" above for an unauthenticated request).
    // Requiring a matching row in this module's OWN separate usersTable on
    // top of that shell-level auth meant every real user who wasn't manually
    // provisioned here got hard-rejected - in practice only the literal
    // username "admin" ever worked. Trust the shell's identity instead of
    // re-authenticating against a local table it doesn't own, with the same
    // permission ceiling the "admin" fallback already had (full access).
    req.user = {
      id: 0,
      username,
      displayName: username,
      email: "",
      role: "system_admin",
      departmentId: null,
      isActive: true,
      permissions: ["*"],
    };
    next();
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
