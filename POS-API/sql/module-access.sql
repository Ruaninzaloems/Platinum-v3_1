/* ============================================================================
   Module Access Control — schema + seed  (SQL Server, shared ems_v3 database)
   ----------------------------------------------------------------------------
   Backs the apps/shell side-nav authorization:
     - modules            catalogue of shell modules (global)
     - roles              Administrator / Base User / one role per module (global)
     - role_modules       role -> modules mapping (global)
     - user_roles         user -> role assignment, per tenant (DbName)
     - user_module_access existing direct per-user grants, per tenant (DbName)

   Idempotent: safe to run repeatedly. POS-API also runs the equivalent
   create+seed lazily on first use via ensureModuleSchema() in ems-modules.ts.
   ========================================================================== */

SET NOCOUNT ON;

/* ── modules ──────────────────────────────────────────────────────────────
   Table may pre-exist (ModuleID, ModuleDesc). Add ModuleCode (stable shell key). */
IF OBJECT_ID('dbo.modules', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.modules (
        ModuleID   INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        ModuleDesc NVARCHAR(100) NOT NULL
    );
END;

IF COL_LENGTH('dbo.modules', 'ModuleCode') IS NULL
    ALTER TABLE dbo.modules ADD ModuleCode VARCHAR(50) NULL;
GO

/* Seed / upsert the shell modules. ModuleCode is the key the front end matches. */
MERGE dbo.modules AS tgt
USING (VALUES
    ('dashboard',  'Home / Dashboard'),
    ('assets',     'Asset Management'),
    ('scm',        'Supply Chain Management'),
    ('pos',        'Point of Sale'),
    ('payroll',    'Payroll'),
    ('idp',        'Integrated Development Plan'),
    ('insights',   'Performance Management'),
    ('budget',     'Budget'),
    ('afs',        'Annual Financial Statements'),
    ('overtime',   'Overtime Management'),
    ('sharepoint', 'SharePoint'),
    ('admin',      'Administration'),
    ('settings',   'Settings')
) AS src (ModuleCode, ModuleDesc)
    ON tgt.ModuleCode = src.ModuleCode
WHEN MATCHED THEN
    UPDATE SET tgt.ModuleDesc = src.ModuleDesc
WHEN NOT MATCHED THEN
    INSERT (ModuleCode, ModuleDesc) VALUES (src.ModuleCode, src.ModuleDesc);
GO

/* ── roles ────────────────────────────────────────────────────────────────── */
IF OBJECT_ID('dbo.roles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.roles (
        RoleID    INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        RoleName  NVARCHAR(100) NOT NULL,
        IsAdmin   BIT NOT NULL CONSTRAINT DF_roles_IsAdmin DEFAULT (0),
        IsBase    BIT NOT NULL CONSTRAINT DF_roles_IsBase  DEFAULT (0),
        CreatedAt DATETIME NULL CONSTRAINT DF_roles_CreatedAt DEFAULT (GETUTCDATE()),
        UpdatedAt DATETIME NULL
    );
    CREATE UNIQUE INDEX UX_roles_RoleName ON dbo.roles (RoleName);
END;
GO

/* Administrator + Base User + one role per non-system module. */
MERGE dbo.roles AS tgt
USING (VALUES
    ('Administrator', 1, 0),
    ('Base User',     0, 1),
    ('Assets',        0, 0),
    ('SCM',           0, 0),
    ('POS',           0, 0),
    ('Payroll',       0, 0),
    ('IDP',           0, 0),
    ('Performance',   0, 0),
    ('Budget',        0, 0),
    ('AFS',           0, 0),
    ('Overtime',      0, 0),
    ('SharePoint',    0, 0)
) AS src (RoleName, IsAdmin, IsBase)
    ON tgt.RoleName = src.RoleName
WHEN NOT MATCHED THEN
    INSERT (RoleName, IsAdmin, IsBase) VALUES (src.RoleName, src.IsAdmin, src.IsBase);
GO

/* ── role_modules ───────────────────────────────────────────────────────────
   Maps a role to the modules it unlocks. Admin is handled by roles.IsAdmin
   (short-circuit to ALL) and needs no rows here. */
IF OBJECT_ID('dbo.role_modules', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.role_modules (
        RoleID   INT NOT NULL,
        ModuleID INT NOT NULL,
        CONSTRAINT PK_role_modules PRIMARY KEY (RoleID, ModuleID)
    );
END;
GO

/* Base User -> limited default set (Dashboard only; adjust as needed). */
INSERT INTO dbo.role_modules (RoleID, ModuleID)
SELECT r.RoleID, m.ModuleID
FROM dbo.roles r
JOIN dbo.modules m ON m.ModuleCode IN ('dashboard')
WHERE r.RoleName = 'Base User'
  AND NOT EXISTS (SELECT 1 FROM dbo.role_modules rm WHERE rm.RoleID = r.RoleID AND rm.ModuleID = m.ModuleID);
GO

/* Each per-module role -> its single module. */
INSERT INTO dbo.role_modules (RoleID, ModuleID)
SELECT r.RoleID, m.ModuleID
FROM (VALUES
    ('Assets',      'assets'),
    ('SCM',         'scm'),
    ('POS',         'pos'),
    ('Payroll',     'payroll'),
    ('IDP',         'idp'),
    ('Performance', 'insights'),
    ('Budget',      'budget'),
    ('AFS',         'afs'),
    ('Overtime',    'overtime'),
    ('SharePoint',  'sharepoint')
) AS map (RoleName, ModuleCode)
JOIN dbo.roles   r ON r.RoleName   = map.RoleName
JOIN dbo.modules m ON m.ModuleCode = map.ModuleCode
WHERE NOT EXISTS (SELECT 1 FROM dbo.role_modules rm WHERE rm.RoleID = r.RoleID AND rm.ModuleID = m.ModuleID);
GO

/* ── user_roles ─────────────────────────────────────────────────────────────
   Per-tenant user -> role assignment (DbName = tenant label, e.g. George). */
IF OBJECT_ID('dbo.user_roles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_roles (
        ID        INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        UserID    INT NOT NULL,
        RoleID    INT NOT NULL,
        DbName    VARCHAR(100) NULL,
        CreatedAt DATETIME NULL CONSTRAINT DF_user_roles_CreatedAt DEFAULT (GETUTCDATE()),
        UpdatedAt DATETIME NULL
    );
    CREATE INDEX IX_user_roles_User ON dbo.user_roles (UserID, DbName);
END;
GO

/* ── user_module_access ─────────────────────────────────────────────────────
   Existing table (direct per-user grants). Created here only if missing so a
   fresh environment is self-contained; unioned into the effective set. */
IF OBJECT_ID('dbo.user_module_access', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_module_access (
        ID        INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        UserID    INT NOT NULL,
        ModuleID  INT NOT NULL,
        CreatedAt DATETIME NULL,
        UpdatedAt DATETIME NULL,
        DbName    VARCHAR(100) NULL
    );
    CREATE INDEX IX_user_module_access_User ON dbo.user_module_access (UserID, DbName);
END;
GO
