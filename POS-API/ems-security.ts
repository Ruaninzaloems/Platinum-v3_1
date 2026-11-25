import { getTenantPool, sql } from "./ems-db";

/**
 * Global (cross-module) Users/Roles/Permissions data layer.
 * ──────────────────────────────────────────────────────────
 * Reuses the real legacy EMS security tables in the tenant database (the same
 * ones SCM's standalone backend already queries against EMS_GeorgeUAT) instead
 * of inventing a second permissions system. Unlike SCM's own implementation
 * (which hardcodes ModuleID = 9), the permission resolver here takes an
 * optional moduleId filter so it can answer "what can this user do" across
 * every module, not just one.
 *
 * Table/column names are taken from two sources:
 *   - The five main tables (User_UserDetail, Sys_RoleName, User_UserRoles,
 *     Sys_Permission, Sys_RolePermission) were given explicitly, column-by-
 *     column, in the feature spec.
 *   - The supporting tables (Sys_PermissionSpecial, User_PermissionSpecial,
 *     User_UserDivisions, Const_Division, Const_Department,
 *     User_TransactionAuthorize, User_UserRoleModifyLog, User_Module) are
 *     taken from SCM-API's EF Core models (Models/Domain/Security.cs), which
 *     already query these exact tables successfully in production against
 *     this same database.
 *
 * This does NOT touch /api/users, /api/roles or /api/user-roles/:id in
 * ems-modules.ts/modules.routes.ts — those back a completely different,
 * coarser "which module tiles does this user see" system in the ems_v3
 * database and must stay untouched.
 */

const T_USER = "User_UserDetail";
const T_ROLE = "Sys_RoleName";
const T_PERM = "Sys_Permission";
const T_ROLE_PERM = "Sys_RolePermission";
const T_USER_ROLE = "User_UserRoles";
const T_SPECIAL_PERM = "Sys_PermissionSpecial";
const T_USER_SPECIAL = "User_PermissionSpecial";
const T_USER_DIV = "User_UserDivisions";
const T_DIVISION = "Const_Division";
const T_TXN_LIMIT = "User_TransactionAuthorize";
const T_ROLE_LOG = "User_UserRoleModifyLog";
const T_MODULE = "User_Module";

/** The one permission that gates every mutating endpoint in this file's routes. */
/**
 * Verified against the real EMS_GeorgeUAT database: Permission_ID 6006,
 * "Manage Users", ModuleID 6 ("Settings") already exists and is enabled —
 * this is a real, pre-existing permission, not one invented/seeded for this
 * feature. Reusing it rather than adding a new row.
 */
export const MANAGE_USERS_AND_ROLES_PERMISSION_NAME = "Manage Users";

// ── schema-drift tolerant row reader (same pattern as ems-modules.ts/ems-azure-auth.ts) ──
function pick(row: any, ...names: string[]): any {
  for (const n of names) {
    if (row[n] !== undefined) return row[n];
    const key = Object.keys(row).find((k) => k.toLowerCase() === n.toLowerCase());
    if (key) return row[key];
  }
  return undefined;
}

function toBool(v: any): boolean {
  return v === true || v === 1 || v === "1";
}

// ── shapes ───────────────────────────────────────────────────────────────────
export interface SecurityUser {
  userId: number;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  enabled: boolean;
  superUser: boolean;
  lastLoginDate: string | null;
}

export interface SecurityRole {
  roleId: number;
  roleDesc: string;
  enabled: boolean;
  permissionCount: number;
}

export interface SecurityPermission {
  permissionId: number;
  moduleId: number;
  moduleHeader: string;
  levelDesc: string;
  permissionName: string;
  permissionDesc: string;
  displayOrder: number;
}

export interface RoleAssignment {
  roleId: number;
  roleDesc: string;
  delegatedByUserId: number | null;
  delegationStart: string | null;
  delegationExpiry: string | null;
}

export interface PagedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

function mapUserRow(row: any): SecurityUser {
  const lastLogin = pick(row, "LastLoginDate");
  return {
    userId: Number(pick(row, "User_ID", "UserId", "UserID")),
    userName: pick(row, "UserName") ?? "",
    firstName: pick(row, "FirstName") ?? "",
    lastName: pick(row, "LastName") ?? "",
    email: pick(row, "eMail", "Email") ?? "",
    enabled: toBool(pick(row, "Enabled")),
    superUser: toBool(pick(row, "SuperUser")),
    lastLoginDate: lastLogin ? new Date(lastLogin).toISOString() : null,
  };
}

// ── users ────────────────────────────────────────────────────────────────────

export async function getUsersPaged(
  dbName: string,
  opts: { search?: string; enabled?: boolean; page: number; pageSize: number },
): Promise<PagedResult<SecurityUser>> {
  const pool = await getTenantPool(dbName);
  const page = Math.max(1, opts.page);
  const pageSize = Math.max(1, Math.min(200, opts.pageSize));
  const offset = (page - 1) * pageSize;

  const where: string[] = [];
  const req = pool.request();
  if (opts.search) {
    where.push(
      "(UserName LIKE @search OR FirstName LIKE @search OR LastName LIKE @search OR eMail LIKE @search)",
    );
    req.input("search", sql.NVarChar, `%${opts.search}%`);
  }
  if (opts.enabled !== undefined) {
    where.push("Enabled = @enabled");
    req.input("enabled", sql.Bit, opts.enabled);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countRes = await req.query(`SELECT COUNT(*) AS total FROM ${T_USER} ${whereSql}`);
  const totalCount = Number(countRes.recordset[0]?.total ?? 0);

  const dataReq = pool.request();
  if (opts.search) dataReq.input("search", sql.NVarChar, `%${opts.search}%`);
  if (opts.enabled !== undefined) dataReq.input("enabled", sql.Bit, opts.enabled);
  dataReq.input("offset", sql.Int, offset).input("pageSize", sql.Int, pageSize);
  const dataRes = await dataReq.query(
    `SELECT * FROM ${T_USER} ${whereSql}
     ORDER BY UserName
     OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
  );

  return {
    data: dataRes.recordset.map(mapUserRow),
    page,
    pageSize,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export async function getUserById(dbName: string, userId: number): Promise<SecurityUser | null> {
  const pool = await getTenantPool(dbName);
  const res = await pool.request().input("id", sql.Int, userId).query(`SELECT * FROM ${T_USER} WHERE User_ID = @id`);
  const row = res.recordset[0];
  return row ? mapUserRow(row) : null;
}

export async function createUser(
  dbName: string,
  input: { userName: string; firstName: string; lastName: string; email: string; password: string; enabled: boolean },
): Promise<SecurityUser> {
  const pool = await getTenantPool(dbName);
  const existing = await pool
    .request()
    .input("userName", sql.NVarChar, input.userName)
    .query(`SELECT User_ID FROM ${T_USER} WHERE UserName = @userName`);
  if (existing.recordset.length) {
    const err: any = new Error("A user with this username already exists.");
    err.statusCode = 409;
    throw err;
  }
  const res = await pool
    .request()
    .input("userName", sql.NVarChar, input.userName)
    .input("firstName", sql.NVarChar, input.firstName)
    .input("lastName", sql.NVarChar, input.lastName)
    .input("email", sql.NVarChar, input.email)
    .input("password", sql.NVarChar, input.password)
    .input("enabled", sql.Bit, input.enabled)
    .query(
      `INSERT INTO ${T_USER} (UserName, FirstName, LastName, eMail, Password, Enabled, SuperUser)
       OUTPUT INSERTED.User_ID
       VALUES (@userName, @firstName, @lastName, @email, @password, @enabled, 0)`,
    );
  const userId = Number(res.recordset[0].User_ID);
  return (await getUserById(dbName, userId))!;
}

export async function updateUser(
  dbName: string,
  userId: number,
  input: { firstName: string; lastName: string; email: string },
): Promise<SecurityUser | null> {
  const pool = await getTenantPool(dbName);
  const res = await pool
    .request()
    .input("id", sql.Int, userId)
    .input("firstName", sql.NVarChar, input.firstName)
    .input("lastName", sql.NVarChar, input.lastName)
    .input("email", sql.NVarChar, input.email)
    .query(
      `UPDATE ${T_USER} SET FirstName = @firstName, LastName = @lastName, eMail = @email
       WHERE User_ID = @id`,
    );
  if (!res.rowsAffected[0]) return null;
  return getUserById(dbName, userId);
}

export async function setUserEnabled(dbName: string, userId: number, enabled: boolean): Promise<boolean> {
  const pool = await getTenantPool(dbName);
  const res = await pool
    .request()
    .input("id", sql.Int, userId)
    .input("enabled", sql.Bit, enabled)
    .query(`UPDATE ${T_USER} SET Enabled = @enabled WHERE User_ID = @id`);
  if (res.rowsAffected[0]) invalidateUserPermissions(dbName, userId);
  return !!res.rowsAffected[0];
}

// ── role assignment ──────────────────────────────────────────────────────────

export async function getUserRoleAssignments(dbName: string, userId: number): Promise<RoleAssignment[]> {
  const pool = await getTenantPool(dbName);
  const res = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(
      `SELECT ur.RoleID, r.RoleDesc, ur.DelegatedByUserID, ur.DelegationStart, ur.DelegationExpiry
       FROM ${T_USER_ROLE} ur
       JOIN ${T_ROLE} r ON r.Role_ID = ur.RoleID
       WHERE ur.UserID = @userId`,
    );
  return res.recordset.map((r) => ({
    roleId: Number(r.RoleID),
    roleDesc: r.RoleDesc,
    delegatedByUserId: r.DelegatedByUserID != null ? Number(r.DelegatedByUserID) : null,
    delegationStart: r.DelegationStart ? new Date(r.DelegationStart).toISOString() : null,
    delegationExpiry: r.DelegationExpiry ? new Date(r.DelegationExpiry).toISOString() : null,
  }));
}

export async function getDelegatedRoles(dbName: string, userId: number): Promise<RoleAssignment[]> {
  const all = await getUserRoleAssignments(dbName, userId);
  return all.filter((r) => r.delegationStart != null || r.delegationExpiry != null);
}

export interface RoleAssignmentInput {
  roleId: number;
  delegatedByUserId: number | null;
  delegationStart: string | null;
  delegationExpiry: string | null;
}

/** Replace a user's role assignments transactionally. Validates every role exists first. */
export async function replaceUserRoles(
  dbName: string,
  userId: number,
  roles: RoleAssignmentInput[],
  actorUserId: number | null,
): Promise<void> {
  const pool = await getTenantPool(dbName);

  const uniqueRoleIds = [...new Set(roles.map((r) => r.roleId))];
  if (uniqueRoleIds.length) {
    const params = uniqueRoleIds.map((_, i) => `@r${i}`).join(",");
    const checkReq = pool.request();
    uniqueRoleIds.forEach((id, i) => checkReq.input(`r${i}`, sql.Int, id));
    const found = await checkReq.query(`SELECT Role_ID FROM ${T_ROLE} WHERE Role_ID IN (${params})`);
    const foundIds = new Set(found.recordset.map((r) => Number(r.Role_ID)));
    const missing = uniqueRoleIds.filter((id) => !foundIds.has(id));
    if (missing.length) {
      const err: any = new Error(`Unknown role id(s): ${missing.join(", ")}`);
      err.statusCode = 400;
      throw err;
    }
  }

  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    await tx.request().input("userId", sql.Int, userId).query(`DELETE FROM ${T_USER_ROLE} WHERE UserID = @userId`);

    for (const role of roles) {
      await tx
        .request()
        .input("userId", sql.Int, userId)
        .input("roleId", sql.Int, role.roleId)
        .input("delegatedBy", sql.Int, role.delegatedByUserId)
        .input("start", sql.DateTime, role.delegationStart ? new Date(role.delegationStart) : null)
        .input("expiry", sql.DateTime, role.delegationExpiry ? new Date(role.delegationExpiry) : null)
        .query(
          `INSERT INTO ${T_USER_ROLE} (UserID, RoleID, DelegatedByUserID, DelegationStart, DelegationExpiry)
           VALUES (@userId, @roleId, @delegatedBy, @start, @expiry)`,
        );
    }

    // User_UserRoleModifyLog's real schema (verified against EMS_GeorgeUAT) has no
    // RoleID/DateModified/ModifiedByUserID columns - it's a per-user "roles were
    // changed" marker (UserRoleModifyID, UserID, ModifyFlag bit, Created_On,
    // Created_By), not a per-role audit trail. One row per replace, not per role.
    await tx
      .request()
      .input("userId", sql.Int, userId)
      .input("createdBy", sql.Int, actorUserId)
      .query(
        `INSERT INTO ${T_ROLE_LOG} (UserID, ModifyFlag, Created_On, Created_By)
         VALUES (@userId, 1, GETUTCDATE(), @createdBy)`,
      );

    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }

  invalidateUserPermissions(dbName, userId);
}

// ── divisions / transaction limits ──────────────────────────────────────────

export async function getUserDivisions(dbName: string, userId: number): Promise<{ divisionId: number; divisionDesc: string }[]> {
  const pool = await getTenantPool(dbName);
  const res = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(
      `SELECT ud.DivisionID, d.DivisionDesc
       FROM ${T_USER_DIV} ud
       JOIN ${T_DIVISION} d ON d.Division_ID = ud.DivisionID
       WHERE ud.UserID = @userId`,
    );
  return res.recordset.map((r) => ({ divisionId: Number(r.DivisionID), divisionDesc: r.DivisionDesc }));
}

export async function setUserDivisions(dbName: string, userId: number, divisionIds: number[]): Promise<void> {
  const pool = await getTenantPool(dbName);
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    await tx.request().input("userId", sql.Int, userId).query(`DELETE FROM ${T_USER_DIV} WHERE UserID = @userId`);
    for (const divisionId of [...new Set(divisionIds)]) {
      await tx
        .request()
        .input("userId", sql.Int, userId)
        .input("divisionId", sql.Int, divisionId)
        .query(`INSERT INTO ${T_USER_DIV} (UserID, DivisionID, DateCaptured) VALUES (@userId, @divisionId, GETUTCDATE())`);
    }
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

export interface TransactionLimit {
  transactionAuthorizeId: number;
  transactionTypeId: number | null;
  scmTransactionTypeId: number | null;
  divisionId: number | null;
  minValue: number;
  maxValue: number;
}

export async function getTransactionLimits(dbName: string, userId: number): Promise<TransactionLimit[]> {
  const pool = await getTenantPool(dbName);
  const res = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`SELECT * FROM ${T_TXN_LIMIT} WHERE UserID = @userId`);
  return res.recordset.map((r) => ({
    transactionAuthorizeId: Number(pick(r, "TransactionAuthorize_ID")),
    transactionTypeId: r.TransactionTypeID != null ? Number(r.TransactionTypeID) : null,
    scmTransactionTypeId: r.SCMTransactionTypeID != null ? Number(r.SCMTransactionTypeID) : null,
    divisionId: r.DivisionID != null ? Number(r.DivisionID) : null,
    minValue: Number(r.MinValue),
    maxValue: Number(r.MaxValue),
  }));
}

export async function setTransactionLimits(
  dbName: string,
  userId: number,
  limits: { transactionTypeId: number | null; scmTransactionTypeId: number | null; divisionId: number | null; minValue: number; maxValue: number }[],
  actorUserId: number | null,
): Promise<void> {
  const pool = await getTenantPool(dbName);
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    await tx.request().input("userId", sql.Int, userId).query(`DELETE FROM ${T_TXN_LIMIT} WHERE UserID = @userId`);
    for (const l of limits) {
      await tx
        .request()
        .input("userId", sql.Int, userId)
        .input("transactionTypeId", sql.Int, l.transactionTypeId)
        .input("scmTransactionTypeId", sql.Int, l.scmTransactionTypeId)
        .input("divisionId", sql.Int, l.divisionId)
        .input("minValue", sql.Decimal(18, 2), l.minValue)
        .input("maxValue", sql.Decimal(18, 2), l.maxValue)
        .input("capturerId", sql.Int, actorUserId)
        .query(
          `INSERT INTO ${T_TXN_LIMIT}
             (UserID, TransactionTypeID, SCMTransactionTypeID, DivisionID, MinValue, MaxValue, CapturerID, DateCaptured)
           VALUES
             (@userId, @transactionTypeId, @scmTransactionTypeId, @divisionId, @minValue, @maxValue, @capturerId, GETUTCDATE())`,
        );
    }
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

// ── roles catalogue ──────────────────────────────────────────────────────────

export async function getRoles(dbName: string, enabledOnly: boolean): Promise<SecurityRole[]> {
  const pool = await getTenantPool(dbName);
  const whereSql = enabledOnly ? "WHERE r.Enabled = 1" : "";
  const res = await pool.request().query(
    `SELECT r.Role_ID, r.RoleDesc, r.Enabled, COUNT(rp.PermissionID) AS PermissionCount
     FROM ${T_ROLE} r
     LEFT JOIN ${T_ROLE_PERM} rp ON rp.RoleID = r.Role_ID
     ${whereSql}
     GROUP BY r.Role_ID, r.RoleDesc, r.Enabled
     ORDER BY r.RoleDesc`,
  );
  return res.recordset.map((r) => ({
    roleId: Number(r.Role_ID),
    roleDesc: r.RoleDesc,
    enabled: toBool(r.Enabled),
    permissionCount: Number(r.PermissionCount),
  }));
}

export async function getRoleById(dbName: string, roleId: number): Promise<SecurityRole | null> {
  const pool = await getTenantPool(dbName);
  const res = await pool.request().input("id", sql.Int, roleId).query(
    `SELECT r.Role_ID, r.RoleDesc, r.Enabled, COUNT(rp.PermissionID) AS PermissionCount
     FROM ${T_ROLE} r
     LEFT JOIN ${T_ROLE_PERM} rp ON rp.RoleID = r.Role_ID
     WHERE r.Role_ID = @id
     GROUP BY r.Role_ID, r.RoleDesc, r.Enabled`,
  );
  const row = res.recordset[0];
  if (!row) return null;
  return {
    roleId: Number(row.Role_ID),
    roleDesc: row.RoleDesc,
    enabled: toBool(row.Enabled),
    permissionCount: Number(row.PermissionCount),
  };
}

export async function createRole(dbName: string, roleDesc: string): Promise<SecurityRole> {
  const pool = await getTenantPool(dbName);
  const existing = await pool
    .request()
    .input("roleDesc", sql.NVarChar, roleDesc)
    .query(`SELECT Role_ID FROM ${T_ROLE} WHERE RoleDesc = @roleDesc`);
  if (existing.recordset.length) {
    const err: any = new Error("A role with this name already exists.");
    err.statusCode = 409;
    throw err;
  }
  const res = await pool
    .request()
    .input("roleDesc", sql.NVarChar, roleDesc)
    .query(
      `INSERT INTO ${T_ROLE} (RoleDesc, Enabled, DateCaptured)
       OUTPUT INSERTED.Role_ID
       VALUES (@roleDesc, 1, GETUTCDATE())`,
    );
  return (await getRoleById(dbName, Number(res.recordset[0].Role_ID)))!;
}

export async function updateRole(dbName: string, roleId: number, roleDesc: string): Promise<SecurityRole | null> {
  const pool = await getTenantPool(dbName);
  const res = await pool
    .request()
    .input("id", sql.Int, roleId)
    .input("roleDesc", sql.NVarChar, roleDesc)
    .input("now", sql.DateTime, new Date())
    .query(`UPDATE ${T_ROLE} SET RoleDesc = @roleDesc, DateModified = @now WHERE Role_ID = @id`);
  if (!res.rowsAffected[0]) return null;
  return getRoleById(dbName, roleId);
}

export async function setRoleEnabled(dbName: string, roleId: number, enabled: boolean): Promise<boolean> {
  const pool = await getTenantPool(dbName);
  const res = await pool
    .request()
    .input("id", sql.Int, roleId)
    .input("enabled", sql.Bit, enabled)
    .query(`UPDATE ${T_ROLE} SET Enabled = @enabled WHERE Role_ID = @id`);
  if (res.rowsAffected[0]) invalidateAllPermissions();
  return !!res.rowsAffected[0];
}

export async function getRolePermissionIds(dbName: string, roleId: number): Promise<number[]> {
  const pool = await getTenantPool(dbName);
  const res = await pool
    .request()
    .input("roleId", sql.Int, roleId)
    .query(`SELECT PermissionID FROM ${T_ROLE_PERM} WHERE RoleID = @roleId`);
  return res.recordset.map((r) => Number(r.PermissionID));
}

/** Replace a role's permissions transactionally. Only existing, enabled permissions are accepted. */
export async function replaceRolePermissions(dbName: string, roleId: number, permissionIds: number[]): Promise<void> {
  const pool = await getTenantPool(dbName);

  const uniqueIds = [...new Set(permissionIds)];
  let validIds: number[] = [];
  if (uniqueIds.length) {
    const params = uniqueIds.map((_, i) => `@p${i}`).join(",");
    const checkReq = pool.request();
    uniqueIds.forEach((id, i) => checkReq.input(`p${i}`, sql.Int, id));
    const found = await checkReq.query(
      `SELECT Permission_ID FROM ${T_PERM} WHERE Enabled = 1 AND Permission_ID IN (${params})`,
    );
    validIds = found.recordset.map((r) => Number(r.Permission_ID));
    const invalid = uniqueIds.filter((id) => !validIds.includes(id));
    if (invalid.length) {
      const err: any = new Error(`Unknown or disabled permission id(s): ${invalid.join(", ")}`);
      err.statusCode = 400;
      throw err;
    }
  }

  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    await tx.request().input("roleId", sql.Int, roleId).query(`DELETE FROM ${T_ROLE_PERM} WHERE RoleID = @roleId`);
    for (const permissionId of validIds) {
      await tx
        .request()
        .input("roleId", sql.Int, roleId)
        .input("permissionId", sql.Int, permissionId)
        .query(`INSERT INTO ${T_ROLE_PERM} (RoleID, PermissionID) VALUES (@roleId, @permissionId)`);
    }
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }

  // One role can be held by many users; finding exactly which ones costs an extra
  // query for a save-path that isn't hot, so invalidate the whole cache rather than
  // risk stale permissions for someone else holding this role.
  invalidateAllPermissions();
}

export async function getUsersInRole(dbName: string, roleId: number): Promise<SecurityUser[]> {
  const pool = await getTenantPool(dbName);
  const res = await pool
    .request()
    .input("roleId", sql.Int, roleId)
    .query(
      `SELECT u.* FROM ${T_USER} u
       JOIN ${T_USER_ROLE} ur ON ur.UserID = u.User_ID
       WHERE ur.RoleID = @roleId`,
    );
  return res.recordset.map(mapUserRow);
}

// ── permissions catalogue ────────────────────────────────────────────────────

/**
 * NOTE on ModuleHeader: despite the name, Sys_Permission.ModuleHeader is a
 * `bit` flag column in the real schema (verified against EMS_GeorgeUAT), not
 * the display-name string the spec's example response implied. The real
 * module display name ("SCM", "Budget", etc.) lives in
 * User_Module.ModuleDesc, joined via Sys_Permission.ModuleID. Every consumer
 * of this API (including the role-permission grouping dialog) needs a real
 * display name to group by, so `moduleHeader` in the response is populated
 * from ModuleDesc — not the raw bit column.
 */
export async function getPermissions(dbName: string, moduleId?: number): Promise<SecurityPermission[]> {
  const pool = await getTenantPool(dbName);
  const req = pool.request();
  let whereSql = "";
  if (moduleId != null) {
    whereSql = "WHERE p.ModuleID = @moduleId";
    req.input("moduleId", sql.Int, moduleId);
  }
  const res = await req.query(
    `SELECT p.Permission_ID, p.ModuleID, m.ModuleDesc, p.LevelDesc, p.PermissionName, p.PermissionDesc, p.DisplayOrder
     FROM ${T_PERM} p
     LEFT JOIN ${T_MODULE} m ON m.Module_ID = p.ModuleID
     ${whereSql}
     ORDER BY p.ModuleID, p.DisplayOrder`,
  );
  return res.recordset.map((r) => ({
    permissionId: Number(r.Permission_ID),
    moduleId: Number(r.ModuleID),
    moduleHeader: r.ModuleDesc ?? `Module ${r.ModuleID}`,
    levelDesc: r.LevelDesc,
    permissionName: r.PermissionName,
    permissionDesc: r.PermissionDesc,
    displayOrder: Number(r.DisplayOrder),
  }));
}

// ── effective permission resolution (the core algorithm) ────────────────────

interface CacheEntry {
  isSuperUser: boolean;
  permissionIds: Set<number>;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const permissionCache = new Map<string, CacheEntry>();

function cacheKey(dbName: string, userId: number, moduleId?: number): string {
  return `${dbName}:${userId}:${moduleId ?? "all"}`;
}

export function invalidateUserPermissions(dbName: string, userId: number): void {
  const prefix = `${dbName}:${userId}:`;
  for (const key of permissionCache.keys()) {
    if (key.startsWith(prefix)) permissionCache.delete(key);
  }
}

export function invalidateAllPermissions(): void {
  permissionCache.clear();
}

/**
 * Effective permission IDs for a user, optionally scoped to one module.
 * Mirrors SCM's SecurityRepository.GetUserPermissionsAsync, generalized to
 * span every module by default, and fixes a gap present in SCM's own version:
 * a disabled role (Sys_RoleName.Enabled=0) no longer grants its permissions.
 */
export async function getEffectivePermissionIds(
  dbName: string,
  userId: number,
  moduleId?: number,
): Promise<{ isSuperUser: boolean; permissionIds: Set<number> }> {
  const key = cacheKey(dbName, userId, moduleId);
  const cached = permissionCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return { isSuperUser: cached.isSuperUser, permissionIds: cached.permissionIds };
  }

  const pool = await getTenantPool(dbName);

  const userRes = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`SELECT SuperUser, Enabled FROM ${T_USER} WHERE User_ID = @userId`);
  const userRow = userRes.recordset[0];
  const isSuperUser = !!userRow && toBool(userRow.SuperUser) && toBool(userRow.Enabled);

  if (isSuperUser) {
    const entry: CacheEntry = { isSuperUser: true, permissionIds: new Set(), expiresAt: Date.now() + CACHE_TTL_MS };
    permissionCache.set(key, entry);
    return { isSuperUser: true, permissionIds: entry.permissionIds };
  }

  const now = new Date();
  const roleRes = await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("now", sql.DateTime, now)
    .query(
      `SELECT ur.RoleID
       FROM ${T_USER_ROLE} ur
       JOIN ${T_ROLE} r ON r.Role_ID = ur.RoleID
       WHERE ur.UserID = @userId
         AND r.Enabled = 1
         AND (ur.DelegationExpiry IS NULL OR ur.DelegationExpiry >= @now)
         AND (ur.DelegationStart  IS NULL OR ur.DelegationStart  <= @now)`,
    );
  const activeRoleIds = [...new Set(roleRes.recordset.map((r) => Number(r.RoleID)))];

  let rolePermIds: number[] = [];
  if (activeRoleIds.length) {
    const params = activeRoleIds.map((_, i) => `@role${i}`).join(",");
    const moduleFilter = moduleId != null ? "AND p.ModuleID = @moduleId" : "";
    const req = pool.request();
    activeRoleIds.forEach((id, i) => req.input(`role${i}`, sql.Int, id));
    if (moduleId != null) req.input("moduleId", sql.Int, moduleId);
    const res = await req.query(
      `SELECT DISTINCT rp.PermissionID
       FROM ${T_ROLE_PERM} rp
       JOIN ${T_PERM} p ON p.Permission_ID = rp.PermissionID
       WHERE rp.RoleID IN (${params}) AND p.Enabled = 1 ${moduleFilter}`,
    );
    rolePermIds = res.recordset.map((r) => Number(r.PermissionID));
  }

  const specialRes = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(
      `SELECT sp.SpecialPermission_ID AS PermissionID
       FROM ${T_USER_SPECIAL} us
       JOIN ${T_SPECIAL_PERM} sp ON sp.SpecialPermission_ID = us.SpecialPermissionID
       WHERE us.UserID = @userId AND sp.Enabled = 1`,
    );
  const specialPermIds = specialRes.recordset.map((r) => Number(r.PermissionID));

  const permissionIds = new Set<number>([...rolePermIds, ...specialPermIds]);
  const entry: CacheEntry = { isSuperUser: false, permissionIds, expiresAt: Date.now() + CACHE_TTL_MS };
  permissionCache.set(key, entry);
  return { isSuperUser: false, permissionIds };
}

export async function userHasPermission(dbName: string, userId: number, permissionId: number): Promise<boolean> {
  const { isSuperUser, permissionIds } = await getEffectivePermissionIds(dbName, userId);
  return isSuperUser || permissionIds.has(permissionId);
}

// ── "Manage Users and Roles" lookup (small cache, permission rows rarely change) ──

let manageUsersPermissionIdCache: { dbName: string; id: number | null; expiresAt: number } | null = null;

/**
 * Resolves the real Permission_ID for MANAGE_USERS_AND_ROLES_PERMISSION_NAME by
 * name (not a hardcoded numeric id, since ids are per-tenant-inserted rows).
 * Returns null if no such permission exists yet in this tenant — callers must
 * treat that as "nobody but a superuser can pass" rather than failing open.
 */
export async function getManageUsersAndRolesPermissionId(dbName: string): Promise<number | null> {
  if (
    manageUsersPermissionIdCache &&
    manageUsersPermissionIdCache.dbName === dbName &&
    manageUsersPermissionIdCache.expiresAt > Date.now()
  ) {
    return manageUsersPermissionIdCache.id;
  }
  const pool = await getTenantPool(dbName);
  const res = await pool
    .request()
    .input("name", sql.NVarChar, MANAGE_USERS_AND_ROLES_PERMISSION_NAME)
    .query(`SELECT TOP 1 Permission_ID FROM ${T_PERM} WHERE LTRIM(RTRIM(PermissionName)) = LTRIM(RTRIM(@name)) AND Enabled = 1`);
  const id = res.recordset[0] ? Number(res.recordset[0].Permission_ID) : null;
  manageUsersPermissionIdCache = { dbName, id, expiresAt: Date.now() + CACHE_TTL_MS };
  return id;
}
