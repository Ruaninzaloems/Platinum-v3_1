import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, rolesTable, rolePermissionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "../Middleware/auth";
import type { AuthenticatedRequest } from "../Middleware/auth";

const router: IRouter = Router();

router.get("/auth/me", (req: AuthenticatedRequest, res) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
    isActive: user.isActive,
    permissions: user.permissions,
  });
});

router.get("/auth/users", requirePermission("admin.users", "*"), async (_req, res, next) => {
  try {
    const users = await db.select().from(usersTable);
    res.json(users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      email: u.email,
      role: u.role,
      departmentId: u.departmentId,
      isActive: u.isActive,
    })));
  } catch (err) { next(err); }
});

router.get("/auth/roles", requirePermission("admin.roles", "*"), async (_req, res, next) => {
  try {
    const roles = await db.select().from(rolesTable);
    const perms = await db.select().from(rolePermissionsTable);
    res.json(roles.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      description: r.description,
      permissions: perms.filter(p => p.roleCode === r.code).map(p => p.permission),
    })));
  } catch (err) { next(err); }
});

export default router;
