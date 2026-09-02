import type { Express } from "express";
import type { Server } from "http";
import { requireAuth } from "./middleware";
import { getPlatinumDbName, type UserSession } from "../platinum-auth";
import * as security from "../ems-security";

/**
 * Global (cross-module) Users/Roles/Permissions admin endpoints.
 * ────────────────────────────────────────────────────────────────
 * Backed by the real legacy EMS security tables in the tenant DB (see
 * ems-security.ts) — NOT the same schema as /api/users, /api/roles,
 * /api/user-roles/:id in modules.routes.ts, which control an unrelated,
 * coarser "which module tiles does this user see" concept in ems_v3. Routes
 * here live under /api/security to avoid colliding with those.
 */
export function registerSecurityRoutes(app: Express, _httpServer: Server): void {
  const guardConfigured = async (dbName: string, res: any): Promise<boolean> => {
    try {
      await import("../ems-db").then((m) => m.getTenantPool(dbName));
      return true;
    } catch (e: any) {
      res.status(503).json({ message: "EMS tenant database is not reachable.", detail: e.message });
      return false;
    }
  };

  const handleError = (res: any, e: any) => {
    if (e?.statusCode) return res.status(e.statusCode).json({ message: e.message });
    res.status(502).json({ message: "Request failed", detail: e?.message });
  };

  /**
   * Enforces the "Manage Users and Roles" permission on mutating routes.
   * SuperUsers always pass. Everyone else needs the real Sys_Permission row
   * (see ems-security.ts) — if it doesn't exist yet in this tenant, nobody but
   * a superuser can pass (fail closed, never fail open).
   */
  const requireManageUsersPermission = async (req: any, res: any): Promise<UserSession | null> => {
    const session = requireAuth(req, res);
    if (!session) return null;
    const dbName = getPlatinumDbName(session);
    if (!(await guardConfigured(dbName, res))) return null;

    const userId = Number(session.userData?.user_ID);
    try {
      const { isSuperUser } = await security.getEffectivePermissionIds(dbName, userId);
      if (isSuperUser) return session;

      const manageId = await security.getManageUsersAndRolesPermissionId(dbName);
      if (manageId == null) {
        res.status(403).json({
          message: `Insufficient permissions: '${security.MANAGE_USERS_AND_ROLES_PERMISSION_NAME}' is not configured for this tenant yet.`,
        });
        return null;
      }
      const allowed = await security.userHasPermission(dbName, userId, manageId);
      if (!allowed) {
        res.status(403).json({ message: `Insufficient permissions: '${security.MANAGE_USERS_AND_ROLES_PERMISSION_NAME}' required.` });
        return null;
      }
      return session;
    } catch (e: any) {
      handleError(res, e);
      return null;
    }
  };

  // ── users ──────────────────────────────────────────────────────────────

  app.get("/api/security/users", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const dbName = getPlatinumDbName(session);
    if (!(await guardConfigured(dbName, res))) return;
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 10;
      const enabled = req.query.enabled !== undefined ? req.query.enabled === "true" : undefined;
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      res.json(await security.getUsersPaged(dbName, { search, enabled, page, pageSize }));
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.get("/api/security/users/me/permissions", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const dbName = getPlatinumDbName(session);
    if (!(await guardConfigured(dbName, res))) return;
    try {
      const userId = Number(session.userData?.user_ID);
      const { isSuperUser, permissionIds } = await security.getEffectivePermissionIds(dbName, userId);
      res.json({ isSuperUser, permissionIds: [...permissionIds] });
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.get("/api/security/users/:id", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const dbName = getPlatinumDbName(session);
    if (!(await guardConfigured(dbName, res))) return;
    try {
      const userId = Number(req.params.id);
      if (!Number.isFinite(userId)) return res.status(400).json({ message: "Invalid user id" });
      const user = await security.getUserById(dbName, userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.post("/api/security/users", async (req, res) => {
    const session = await requireManageUsersPermission(req, res);
    if (!session) return;
    try {
      const dbName = getPlatinumDbName(session);
      const b = req.body ?? {};
      const user = await security.createUser(dbName, {
        userName: String(b.userName ?? ""),
        firstName: String(b.firstName ?? ""),
        lastName: String(b.lastName ?? ""),
        email: String(b.email ?? ""),
        password: String(b.password ?? ""),
        enabled: !!b.enabled,
      });
      res.status(201).json(user);
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.put("/api/security/users/:id", async (req, res) => {
    const session = await requireManageUsersPermission(req, res);
    if (!session) return;
    try {
      const dbName = getPlatinumDbName(session);
      const userId = Number(req.params.id);
      if (!Number.isFinite(userId)) return res.status(400).json({ message: "Invalid user id" });
      const b = req.body ?? {};
      const user = await security.updateUser(dbName, userId, {
        firstName: String(b.firstName ?? ""),
        lastName: String(b.lastName ?? ""),
        email: String(b.email ?? ""),
      });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.patch("/api/security/users/:id/enabled", async (req, res) => {
    const session = await requireManageUsersPermission(req, res);
    if (!session) return;
    try {
      const dbName = getPlatinumDbName(session);
      const userId = Number(req.params.id);
      if (!Number.isFinite(userId)) return res.status(400).json({ message: "Invalid user id" });
      const ok = await security.setUserEnabled(dbName, userId, !!req.body?.enabled);
      if (!ok) return res.status(404).json({ message: "User not found" });
      res.json({ success: true });
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.get("/api/security/users/:id/roles", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const dbName = getPlatinumDbName(session);
    if (!(await guardConfigured(dbName, res))) return;
    try {
      const userId = Number(req.params.id);
      if (!Number.isFinite(userId)) return res.status(400).json({ message: "Invalid user id" });
      res.json(await security.getUserRoleAssignments(dbName, userId));
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.put("/api/security/users/:id/roles", async (req, res) => {
    const session = await requireManageUsersPermission(req, res);
    if (!session) return;
    try {
      const dbName = getPlatinumDbName(session);
      const userId = Number(req.params.id);
      if (!Number.isFinite(userId)) return res.status(400).json({ message: "Invalid user id" });
      const roles = Array.isArray(req.body?.roles) ? req.body.roles : [];
      const actorUserId = Number(session.userData?.user_ID) || null;
      await security.replaceUserRoles(dbName, userId, roles, actorUserId);
      res.json({ success: true });
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.get("/api/security/users/:id/delegated-roles", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const dbName = getPlatinumDbName(session);
    if (!(await guardConfigured(dbName, res))) return;
    try {
      const userId = Number(req.params.id);
      if (!Number.isFinite(userId)) return res.status(400).json({ message: "Invalid user id" });
      res.json(await security.getDelegatedRoles(dbName, userId));
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.get("/api/security/users/:id/permissions", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const dbName = getPlatinumDbName(session);
    if (!(await guardConfigured(dbName, res))) return;
    try {
      const userId = Number(req.params.id);
      if (!Number.isFinite(userId)) return res.status(400).json({ message: "Invalid user id" });
      const { isSuperUser, permissionIds } = await security.getEffectivePermissionIds(dbName, userId);
      res.json({ isSuperUser, permissionIds: [...permissionIds] });
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.put("/api/security/users/:id/divisions", async (req, res) => {
    const session = await requireManageUsersPermission(req, res);
    if (!session) return;
    try {
      const dbName = getPlatinumDbName(session);
      const userId = Number(req.params.id);
      if (!Number.isFinite(userId)) return res.status(400).json({ message: "Invalid user id" });
      const divisionIds: number[] = Array.isArray(req.body?.divisionIds)
        ? req.body.divisionIds.map((n: any) => Number(n)).filter(Number.isFinite)
        : [];
      await security.setUserDivisions(dbName, userId, divisionIds);
      res.json({ success: true });
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.get("/api/security/users/:id/transaction-limits", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const dbName = getPlatinumDbName(session);
    if (!(await guardConfigured(dbName, res))) return;
    try {
      const userId = Number(req.params.id);
      if (!Number.isFinite(userId)) return res.status(400).json({ message: "Invalid user id" });
      res.json(await security.getTransactionLimits(dbName, userId));
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.put("/api/security/users/:id/transaction-limits", async (req, res) => {
    const session = await requireManageUsersPermission(req, res);
    if (!session) return;
    try {
      const dbName = getPlatinumDbName(session);
      const userId = Number(req.params.id);
      if (!Number.isFinite(userId)) return res.status(400).json({ message: "Invalid user id" });
      const limits = Array.isArray(req.body?.limits) ? req.body.limits : [];
      const actorUserId = Number(session.userData?.user_ID) || null;
      await security.setTransactionLimits(dbName, userId, limits, actorUserId);
      res.json({ success: true });
    } catch (e: any) {
      handleError(res, e);
    }
  });

  // ── roles ──────────────────────────────────────────────────────────────

  app.get("/api/security/roles", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const dbName = getPlatinumDbName(session);
    if (!(await guardConfigured(dbName, res))) return;
    try {
      const enabledOnly = req.query.enabledOnly === "true";
      res.json(await security.getRoles(dbName, enabledOnly));
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.get("/api/security/roles/:id", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const dbName = getPlatinumDbName(session);
    if (!(await guardConfigured(dbName, res))) return;
    try {
      const roleId = Number(req.params.id);
      if (!Number.isFinite(roleId)) return res.status(400).json({ message: "Invalid role id" });
      const role = await security.getRoleById(dbName, roleId);
      if (!role) return res.status(404).json({ message: "Role not found" });
      res.json(role);
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.post("/api/security/roles", async (req, res) => {
    const session = await requireManageUsersPermission(req, res);
    if (!session) return;
    try {
      const dbName = getPlatinumDbName(session);
      const role = await security.createRole(dbName, String(req.body?.roleDesc ?? ""));
      res.status(201).json(role);
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.put("/api/security/roles/:id", async (req, res) => {
    const session = await requireManageUsersPermission(req, res);
    if (!session) return;
    try {
      const dbName = getPlatinumDbName(session);
      const roleId = Number(req.params.id);
      if (!Number.isFinite(roleId)) return res.status(400).json({ message: "Invalid role id" });
      const role = await security.updateRole(dbName, roleId, String(req.body?.roleDesc ?? ""));
      if (!role) return res.status(404).json({ message: "Role not found" });
      res.json(role);
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.patch("/api/security/roles/:id/enabled", async (req, res) => {
    const session = await requireManageUsersPermission(req, res);
    if (!session) return;
    try {
      const dbName = getPlatinumDbName(session);
      const roleId = Number(req.params.id);
      if (!Number.isFinite(roleId)) return res.status(400).json({ message: "Invalid role id" });
      const ok = await security.setRoleEnabled(dbName, roleId, !!req.body?.enabled);
      if (!ok) return res.status(404).json({ message: "Role not found" });
      res.json({ success: true });
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.get("/api/security/roles/:id/permissions", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const dbName = getPlatinumDbName(session);
    if (!(await guardConfigured(dbName, res))) return;
    try {
      const roleId = Number(req.params.id);
      if (!Number.isFinite(roleId)) return res.status(400).json({ message: "Invalid role id" });
      const permissionIds = await security.getRolePermissionIds(dbName, roleId);
      res.json({ permissionIds });
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.put("/api/security/roles/:id/permissions", async (req, res) => {
    const session = await requireManageUsersPermission(req, res);
    if (!session) return;
    try {
      const dbName = getPlatinumDbName(session);
      const roleId = Number(req.params.id);
      if (!Number.isFinite(roleId)) return res.status(400).json({ message: "Invalid role id" });
      const permissionIds: number[] = Array.isArray(req.body?.permissionIds)
        ? req.body.permissionIds.map((n: any) => Number(n)).filter(Number.isFinite)
        : [];
      await security.replaceRolePermissions(dbName, roleId, permissionIds);
      res.json({ success: true });
    } catch (e: any) {
      handleError(res, e);
    }
  });

  app.get("/api/security/roles/:id/users", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const dbName = getPlatinumDbName(session);
    if (!(await guardConfigured(dbName, res))) return;
    try {
      const roleId = Number(req.params.id);
      if (!Number.isFinite(roleId)) return res.status(400).json({ message: "Invalid role id" });
      res.json(await security.getUsersInRole(dbName, roleId));
    } catch (e: any) {
      handleError(res, e);
    }
  });

  // ── permissions ────────────────────────────────────────────────────────

  app.get("/api/security/permissions", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    const dbName = getPlatinumDbName(session);
    if (!(await guardConfigured(dbName, res))) return;
    try {
      const moduleId = req.query.moduleId !== undefined ? Number(req.query.moduleId) : undefined;
      res.json(await security.getPermissions(dbName, moduleId));
    } catch (e: any) {
      handleError(res, e);
    }
  });

  // ── segregation of duties ──────────────────────────────────────────────
  // No real backing table exists anywhere for this yet (SCM's own attempt at
  // this is a stub with a hardcoded frontend fallback - the exact fabrication
  // this deliberately avoids repeating). Report that honestly instead of
  // inventing rules.
  app.get("/api/security/segregation-rules", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    res.status(501).json({
      message: "Segregation of duties rules are not yet configured for this tenant.",
      rules: [],
    });
  });
}
