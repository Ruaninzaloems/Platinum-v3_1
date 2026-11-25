import type { Express } from "express";
import type { Server } from "http";
import { requireAuth } from "./middleware";
import { getPlatinumDbName } from "../platinum-auth";
import { isEmsConfigured } from "../ems-db";
import {
  getAllModules,
  getRolesCatalogue,
  getEffectiveModuleCodes,
  getUserRoles,
  setUserRoles,
  getTenantUsers,
  getUserRoleAssignments,
} from "../ems-modules";

/**
 * Module-access endpoints backing the apps/shell side-nav authorization and the
 * Settings → Access Management admin screen. All access-control data lives in
 * the shared ems_v3 DB (see ems-modules.ts); the tenant DbName comes from the
 * session's site config.
 */
export function registerModulesRoutes(app: Express, _httpServer: Server): void {
  const guardConfigured = (res: any): boolean => {
    if (!isEmsConfigured()) {
      res.status(503).json({ message: "EMS database is not configured on the server." });
      return false;
    }
    return true;
  };

  // Module catalogue.
  app.get("/api/modules", async (_req, res) => {
    if (!guardConfigured(res)) return;
    try {
      res.json(await getAllModules());
    } catch (e: any) {
      res.status(502).json({ message: "Failed to load modules", detail: e.message });
    }
  });

  // Roles catalogue (+ the module codes each unlocks).
  app.get("/api/roles", async (_req, res) => {
    if (!guardConfigured(res)) return;
    try {
      res.json(await getRolesCatalogue());
    } catch (e: any) {
      res.status(502).json({ message: "Failed to load roles", detail: e.message });
    }
  });

  // Effective module codes for the signed-in user (used by the shell on load).
  app.get("/api/auth/my-modules", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    if (!guardConfigured(res)) return;
    try {
      const userId = Number(session.userData?.user_ID);
      const superUser = !!session.userData?.superUser;
      const dbName = getPlatinumDbName(session);
      const modules = await getEffectiveModuleCodes(userId, dbName, superUser);
      res.json({ modules });
    } catch (e: any) {
      res.status(502).json({ message: "Failed to resolve module access", detail: e.message });
    }
  });

  // Tenant users, for the Access Management admin table.
  app.get("/api/users", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    if (!guardConfigured(res)) return;
    try {
      const dbName = getPlatinumDbName(session);
      const [users, assignments] = await Promise.all([
        getTenantUsers(dbName),
        getUserRoleAssignments(dbName),
      ]);
      res.json(users.map((u) => ({ ...u, roleIds: assignments.get(u.userId) ?? [] })));
    } catch (e: any) {
      res.status(502).json({ message: "Failed to load users", detail: e.message });
    }
  });

  // A user's assigned role IDs.
  app.get("/api/user-roles/:userId", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    if (!guardConfigured(res)) return;
    try {
      const userId = Number(req.params.userId);
      if (!Number.isFinite(userId)) return res.status(400).json({ message: "Invalid userId" });
      const roleIds = await getUserRoles(userId, getPlatinumDbName(session));
      res.json({ userId, roleIds });
    } catch (e: any) {
      res.status(502).json({ message: "Failed to load user roles", detail: e.message });
    }
  });

  // Replace a user's role assignment.
  app.put("/api/user-roles/:userId", async (req, res) => {
    const session = requireAuth(req, res);
    if (!session) return;
    if (!guardConfigured(res)) return;
    try {
      const userId = Number(req.params.userId);
      if (!Number.isFinite(userId)) return res.status(400).json({ message: "Invalid userId" });
      const roleIds: number[] = Array.isArray(req.body?.roleIds)
        ? req.body.roleIds.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n))
        : [];
      await setUserRoles(userId, getPlatinumDbName(session), roleIds);
      res.json({ success: true, userId, roleIds });
    } catch (e: any) {
      res.status(502).json({ message: "Failed to save user roles", detail: e.message });
    }
  });
}
