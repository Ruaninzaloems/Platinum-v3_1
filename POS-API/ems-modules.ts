import { getEmsPool, getTenantPool, sql } from "./ems-db";

/**
 * Module-access data layer (shared ems_v3 database).
 * ──────────────────────────────────────────────────
 * Backs the apps/shell side-nav authorization. Schema + seed live in
 * sql/module-access.sql; ensureModuleSchema() applies the equivalent lazily on
 * first use so dev works without running the script by hand.
 *
 * Model:
 *   - modules            catalogue (ModuleCode is the stable shell key)
 *   - roles              Administrator (IsAdmin) / Base User (IsBase) / per-module
 *   - role_modules       role -> modules
 *   - user_roles         user -> role, per tenant (DbName)
 *   - user_module_access existing direct per-user grants, per tenant (DbName)
 *
 * Effective module codes for a user:
 *   superUser OR an assigned IsAdmin role  -> ALL modules
 *   otherwise -> Base role modules ∪ assigned-role modules ∪ direct grants,
 *                with 'dashboard' always included.
 */

export interface ModuleRow {
  moduleId: number;
  code: string;
  desc: string;
}

export interface RoleRow {
  roleId: number;
  roleName: string;
  isAdmin: boolean;
  isBase: boolean;
  moduleCodes: string[];
}

export interface TenantUser {
  userId: number;
  userName: string;
  name: string;
  email: string;
  enabled: boolean;
  superUser: boolean;
}

const T_USER = "User_UserDetail"; // tenant DB — for the admin user list

/**
 * Idempotent create + seed. Each statement is its own batch (the mssql driver
 * does not understand the SSMS `GO` separator, and ALTER-then-use needs
 * separate batches for deferred name resolution). Run-once per process.
 */
let schemaReady: Promise<void> | null = null;
export function ensureModuleSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = applySchema().catch((err) => {
      schemaReady = null; // allow a later retry
      throw err;
    });
  }
  return schemaReady;
}

async function applySchema(): Promise<void> {
  const pool = await getEmsPool();
  const stmts: string[] = [
    `IF OBJECT_ID('dbo.modules','U') IS NULL
       CREATE TABLE dbo.modules (ModuleID INT IDENTITY(1,1) NOT NULL PRIMARY KEY, ModuleDesc NVARCHAR(100) NOT NULL);`,
    `IF COL_LENGTH('dbo.modules','ModuleCode') IS NULL ALTER TABLE dbo.modules ADD ModuleCode VARCHAR(50) NULL;`,
    `MERGE dbo.modules AS tgt
       USING (VALUES
         ('dashboard','Home / Dashboard'),('assets','Asset Management'),('scm','Supply Chain Management'),
         ('pos','Point of Sale'),('payroll','Payroll'),('idp','Integrated Development Plan'),
         ('insights','Performance Management'),('budget','Budget'),('afs','Annual Financial Statements'),
         ('overtime','Overtime Management'),('sharepoint','SharePoint'),('admin','Administration'),
         ('settings','Settings')
       ) AS src (ModuleCode, ModuleDesc)
       ON tgt.ModuleCode = src.ModuleCode
       WHEN MATCHED THEN UPDATE SET tgt.ModuleDesc = src.ModuleDesc
       WHEN NOT MATCHED THEN INSERT (ModuleCode, ModuleDesc) VALUES (src.ModuleCode, src.ModuleDesc);`,
    `IF OBJECT_ID('dbo.roles','U') IS NULL
     BEGIN
       CREATE TABLE dbo.roles (
         RoleID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
         RoleName NVARCHAR(100) NOT NULL,
         IsAdmin BIT NOT NULL CONSTRAINT DF_roles_IsAdmin DEFAULT (0),
         IsBase  BIT NOT NULL CONSTRAINT DF_roles_IsBase  DEFAULT (0),
         CreatedAt DATETIME NULL CONSTRAINT DF_roles_CreatedAt DEFAULT (GETUTCDATE()),
         UpdatedAt DATETIME NULL);
       CREATE UNIQUE INDEX UX_roles_RoleName ON dbo.roles (RoleName);
     END;`,
    `MERGE dbo.roles AS tgt
       USING (VALUES
         ('Administrator',1,0),('Base User',0,1),('Assets',0,0),('SCM',0,0),('POS',0,0),
         ('Payroll',0,0),('IDP',0,0),('Performance',0,0),('Budget',0,0),('AFS',0,0),
         ('Overtime',0,0),('SharePoint',0,0)
       ) AS src (RoleName, IsAdmin, IsBase)
       ON tgt.RoleName = src.RoleName
       WHEN NOT MATCHED THEN INSERT (RoleName, IsAdmin, IsBase) VALUES (src.RoleName, src.IsAdmin, src.IsBase);`,
    `IF OBJECT_ID('dbo.role_modules','U') IS NULL
       CREATE TABLE dbo.role_modules (RoleID INT NOT NULL, ModuleID INT NOT NULL,
         CONSTRAINT PK_role_modules PRIMARY KEY (RoleID, ModuleID));`,
    `INSERT INTO dbo.role_modules (RoleID, ModuleID)
       SELECT r.RoleID, m.ModuleID FROM dbo.roles r
       JOIN dbo.modules m ON m.ModuleCode IN ('dashboard')
       WHERE r.RoleName = 'Base User'
         AND NOT EXISTS (SELECT 1 FROM dbo.role_modules rm WHERE rm.RoleID=r.RoleID AND rm.ModuleID=m.ModuleID);`,
    `INSERT INTO dbo.role_modules (RoleID, ModuleID)
       SELECT r.RoleID, m.ModuleID FROM (VALUES
         ('Assets','assets'),('SCM','scm'),('POS','pos'),('Payroll','payroll'),('IDP','idp'),
         ('Performance','insights'),('Budget','budget'),('AFS','afs'),('Overtime','overtime'),
         ('SharePoint','sharepoint')
       ) AS map (RoleName, ModuleCode)
       JOIN dbo.roles r ON r.RoleName = map.RoleName
       JOIN dbo.modules m ON m.ModuleCode = map.ModuleCode
       WHERE NOT EXISTS (SELECT 1 FROM dbo.role_modules rm WHERE rm.RoleID=r.RoleID AND rm.ModuleID=m.ModuleID);`,
    `IF OBJECT_ID('dbo.user_roles','U') IS NULL
     BEGIN
       CREATE TABLE dbo.user_roles (
         ID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
         UserID INT NOT NULL, RoleID INT NOT NULL, DbName VARCHAR(100) NULL,
         CreatedAt DATETIME NULL CONSTRAINT DF_user_roles_CreatedAt DEFAULT (GETUTCDATE()),
         UpdatedAt DATETIME NULL);
       CREATE INDEX IX_user_roles_User ON dbo.user_roles (UserID, DbName);
     END;`,
    `IF OBJECT_ID('dbo.user_module_access','U') IS NULL
     BEGIN
       CREATE TABLE dbo.user_module_access (
         ID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
         UserID INT NOT NULL, ModuleID INT NOT NULL,
         CreatedAt DATETIME NULL, UpdatedAt DATETIME NULL, DbName VARCHAR(100) NULL);
       CREATE INDEX IX_user_module_access_User ON dbo.user_module_access (UserID, DbName);
     END;`,
  ];
  for (const s of stmts) {
    await pool.request().batch(s);
  }
  console.log("[EmsModules] Module-access schema ensured.");
}

/** Full module catalogue. */
export async function getAllModules(): Promise<ModuleRow[]> {
  await ensureModuleSchema();
  const pool = await getEmsPool();
  const res = await pool
    .request()
    .query(`SELECT ModuleID, ModuleCode, ModuleDesc FROM dbo.modules WHERE ModuleCode IS NOT NULL ORDER BY ModuleID`);
  return res.recordset.map((r) => ({ moduleId: Number(r.ModuleID), code: r.ModuleCode, desc: r.ModuleDesc }));
}

async function getAllModuleCodes(): Promise<string[]> {
  return (await getAllModules()).map((m) => m.code);
}

/** Roles + the module codes each unlocks. */
export async function getRolesCatalogue(): Promise<RoleRow[]> {
  await ensureModuleSchema();
  const pool = await getEmsPool();
  const [rolesRes, mapRes] = await Promise.all([
    pool.request().query(`SELECT RoleID, RoleName, IsAdmin, IsBase FROM dbo.roles ORDER BY IsAdmin DESC, IsBase DESC, RoleName`),
    pool.request().query(
      `SELECT rm.RoleID, m.ModuleCode
         FROM dbo.role_modules rm JOIN dbo.modules m ON m.ModuleID = rm.ModuleID
         WHERE m.ModuleCode IS NOT NULL`,
    ),
  ]);
  const byRole = new Map<number, string[]>();
  for (const r of mapRes.recordset) {
    const id = Number(r.RoleID);
    let arr = byRole.get(id);
    if (!arr) { arr = []; byRole.set(id, arr); }
    arr.push(r.ModuleCode);
  }
  return rolesRes.recordset.map((r) => ({
    roleId: Number(r.RoleID),
    roleName: r.RoleName,
    isAdmin: !!r.IsAdmin,
    isBase: !!r.IsBase,
    moduleCodes: byRole.get(Number(r.RoleID)) ?? [],
  }));
}

/**
 * Effective module codes for a user. superUser or an assigned IsAdmin role
 * grants every module; otherwise Base ∪ assigned-role ∪ direct grants.
 */
export async function getEffectiveModuleCodes(
  userId: number,
  dbName: string,
  superUser: boolean,
): Promise<string[]> {
  await ensureModuleSchema();
  const pool = await getEmsPool();

  if (superUser) return getAllModuleCodes();

  const adminRes = await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("dbName", sql.VarChar, dbName)
    .query(
      `SELECT TOP 1 1 AS isAdmin
         FROM dbo.user_roles ur JOIN dbo.roles r ON r.RoleID = ur.RoleID
         WHERE ur.UserID = @userId AND (ur.DbName = @dbName OR ur.DbName IS NULL) AND r.IsAdmin = 1`,
    );
  if (adminRes.recordset.length) return getAllModuleCodes();

  const res = await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("dbName", sql.VarChar, dbName)
    .query(
      `SELECT DISTINCT m.ModuleCode
         FROM dbo.modules m
         WHERE m.ModuleCode IS NOT NULL AND (
           m.ModuleCode = 'dashboard'
           OR m.ModuleID IN (
             SELECT rm.ModuleID FROM dbo.role_modules rm
               JOIN dbo.roles r ON r.RoleID = rm.RoleID WHERE r.IsBase = 1
             UNION
             SELECT rm.ModuleID FROM dbo.user_roles ur
               JOIN dbo.role_modules rm ON rm.RoleID = ur.RoleID
               WHERE ur.UserID = @userId AND (ur.DbName = @dbName OR ur.DbName IS NULL)
             UNION
             SELECT uma.ModuleID FROM dbo.user_module_access uma
               WHERE uma.UserID = @userId AND (uma.DbName = @dbName OR uma.DbName IS NULL)
           ))`,
    );
  return res.recordset.map((r) => r.ModuleCode);
}

/** Role IDs assigned to a user in a tenant. */
export async function getUserRoles(userId: number, dbName: string): Promise<number[]> {
  await ensureModuleSchema();
  const pool = await getEmsPool();
  const res = await pool
    .request()
    .input("userId", sql.Int, userId)
    .input("dbName", sql.VarChar, dbName)
    .query(`SELECT RoleID FROM dbo.user_roles WHERE UserID = @userId AND (DbName = @dbName OR DbName IS NULL)`);
  return res.recordset.map((r) => Number(r.RoleID));
}

/** Replace a user's role assignment (delete + insert in a transaction). */
export async function setUserRoles(userId: number, dbName: string, roleIds: number[]): Promise<void> {
  await ensureModuleSchema();
  const pool = await getEmsPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    await tx
      .request()
      .input("userId", sql.Int, userId)
      .input("dbName", sql.VarChar, dbName)
      .query(`DELETE FROM dbo.user_roles WHERE UserID = @userId AND (DbName = @dbName OR DbName IS NULL)`);
    for (const roleId of [...new Set(roleIds)]) {
      await tx
        .request()
        .input("userId", sql.Int, userId)
        .input("roleId", sql.Int, roleId)
        .input("dbName", sql.VarChar, dbName)
        .query(`INSERT INTO dbo.user_roles (UserID, RoleID, DbName, CreatedAt) VALUES (@userId, @roleId, @dbName, GETUTCDATE())`);
    }
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

/** All (UserID → roleIds) assignments for a tenant — merged into the user list. */
export async function getUserRoleAssignments(dbName: string): Promise<Map<number, number[]>> {
  await ensureModuleSchema();
  const pool = await getEmsPool();
  const res = await pool
    .request()
    .input("dbName", sql.VarChar, dbName)
    .query(`SELECT UserID, RoleID FROM dbo.user_roles WHERE (DbName = @dbName OR DbName IS NULL)`);
  const map = new Map<number, number[]>();
  for (const r of res.recordset) {
    const uid = Number(r.UserID);
    let arr = map.get(uid);
    if (!arr) { arr = []; map.set(uid, arr); }
    arr.push(Number(r.RoleID));
  }
  return map;
}

// ── admin user list (tenant DB) ─────────────────────────────────────────────
function pick(row: any, ...names: string[]): any {
  for (const n of names) {
    if (row[n] !== undefined) return row[n];
    const key = Object.keys(row).find((k) => k.toLowerCase() === n.toLowerCase());
    if (key) return row[key];
  }
  return undefined;
}

/** Users from the tenant's User_UserDetail table, for the Access Management UI. */
export async function getTenantUsers(dbName: string): Promise<TenantUser[]> {
  const pool = await getTenantPool(dbName);
  const res = await pool.request().query(`SELECT * FROM ${T_USER}`);
  return res.recordset.map((row) => {
    const first = pick(row, "FirstName") ?? "";
    const last = pick(row, "LastName") ?? "";
    return {
      userId: Number(pick(row, "User_ID", "UserId", "UserID", "user_id")),
      userName: pick(row, "UserName") ?? "",
      name: [first, last].filter(Boolean).join(" ").trim() || (pick(row, "UserName") ?? ""),
      email: pick(row, "eMail", "email", "Email") ?? "",
      enabled: !!pick(row, "Enabled"),
      superUser: !!pick(row, "SuperUser"),
    };
  });
}
