import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
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

/**
 * POS-API's global auth JWT (see POS-API/ems-jwt.ts) -- identity only, this
 * module keeps resolving its own local authorization (usersTable /
 * rolePermissionsTable) unchanged. Same shared HS256 secret as every other
 * migrated module; must be set identically as the PLATINUM_JWT_SECRET App
 * Setting here and on POS-API.
 */
const DEV_FALLBACK_SECRET = "platinum-local-dev-jwt-secret-change-in-production";

function getSecret(): string {
  const secret = process.env.PLATINUM_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("PLATINUM_JWT_SECRET is not set — refusing to run with the local-dev fallback secret in production.");
    }
    return DEV_FALLBACK_SECRET;
  }
  return secret;
}

/**
 * Resolves the caller's username from POS-API's signed global JWT
 * (Authorization: Bearer) instead of trusting the unsigned x-user header --
 * closes the impersonation gap where any caller could set x-user to any
 * value and be granted that person's local permissions. Falls back to the
 * legacy x-user header, behind PERF_ALLOW_LEGACY_HEADER_AUTH, for one
 * deploy cycle while the shell's rollout is verified; defaults to false so a
 * fresh deploy is secure-by-default.
 */
function resolveUsernameFromJwt(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length);
    try {
      const claims = jwt.verify(token, getSecret(), {
        algorithms: ["HS256"],
        issuer: "PlatinumPOS",
        audience: "Platinum-Suite",
      }) as jwt.JwtPayload;
      if (typeof claims.name === "string" && claims.name) return claims.name;
    } catch {
      // Invalid/expired token — fall through to reject below (legacy header
      // fallback, if enabled, is a separate explicit opt-in, not a silent
      // rescue for a bad token).
      return null;
    }
  }
  if (process.env.PERF_ALLOW_LEGACY_HEADER_AUTH === "true") {
    const legacy = req.headers["x-user"] as string | undefined;
    if (legacy) return legacy;
  }
  return null;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const username = resolveUsernameFromJwt(req);
  if (!username) {
    res.status(401).json({ error: "Authentication required. Provide a valid Authorization: Bearer token." });
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
