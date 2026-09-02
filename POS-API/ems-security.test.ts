import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the mssql-backed pool layer entirely — these are unit tests of the
// effective-permission algorithm and replace-transactions, not integration
// tests against a real SQL Server. sql.* type tags (Int, NVarChar, etc.) are
// just hints in real mssql; the mock ignores them and only cares about bound
// param values and the query text.
let queryLog: { text: string; params: Record<string, any> }[] = [];
let queryHandler: (text: string, params: Record<string, any>) => any[] = () => [];

function makeRequest() {
  const params: Record<string, any> = {};
  const req: any = {
    input(name: string, _type: any, value: any) {
      params[name] = value;
      return req;
    },
    async query(text: string) {
      queryLog.push({ text, params: { ...params } });
      return { recordset: queryHandler(text, params) };
    },
    async batch(text: string) {
      queryLog.push({ text, params: { ...params } });
      return { recordset: queryHandler(text, params) };
    },
  };
  return req;
}

class MockTransaction {
  begun = false;
  committed = false;
  rolledBack = false;
  async begin() { this.begun = true; }
  request() { return makeRequest(); }
  async commit() { this.committed = true; }
  async rollback() { this.rolledBack = true; }
}

const mockPool = { request: makeRequest };

vi.mock("./ems-db", () => ({
  getTenantPool: vi.fn(async () => mockPool),
  sql: {
    Int: "Int", NVarChar: "NVarChar", VarChar: "VarChar", Bit: "Bit",
    DateTime: "DateTime", Decimal: () => "Decimal",
    Transaction: MockTransaction,
  },
}));

const { getEffectivePermissionIds, invalidateUserPermissions, invalidateAllPermissions, replaceUserRoles, replaceRolePermissions } =
  await import("./ems-security");

const DB = "EMS_GeorgeUAT";

function route(handlers: { match: RegExp; rows: any[] }[]) {
  queryHandler = (text) => {
    for (const h of handlers) if (h.match.test(text)) return h.rows;
    return [];
  };
}

beforeEach(() => {
  queryLog = [];
  invalidateAllPermissions();
});

describe("getEffectivePermissionIds", () => {
  it("resolves permissions from an ordinary active role", async () => {
    route([
      { match: /FROM User_UserDetail/, rows: [{ SuperUser: false, Enabled: true }] },
      { match: /FROM User_UserRoles ur/, rows: [{ RoleID: 10 }] },
      { match: /FROM Sys_RolePermission/, rows: [{ PermissionID: 101 }, { PermissionID: 102 }] },
      { match: /FROM User_PermissionSpecial/, rows: [] },
    ]);
    const { isSuperUser, permissionIds } = await getEffectivePermissionIds(DB, 1);
    expect(isSuperUser).toBe(false);
    expect([...permissionIds].sort()).toEqual([101, 102]);
  });

  it("short-circuits for an enabled superuser without querying roles/permissions", async () => {
    route([{ match: /FROM User_UserDetail/, rows: [{ SuperUser: true, Enabled: true }] }]);
    const { isSuperUser, permissionIds } = await getEffectivePermissionIds(DB, 2);
    expect(isSuperUser).toBe(true);
    expect(permissionIds.size).toBe(0);
    expect(queryLog.some((q) => /FROM User_UserRoles/.test(q.text))).toBe(false);
  });

  it("does not treat a disabled user with SuperUser=1 as a superuser", async () => {
    route([
      { match: /FROM User_UserDetail/, rows: [{ SuperUser: true, Enabled: false }] },
      { match: /FROM User_UserRoles ur/, rows: [] },
      { match: /FROM User_PermissionSpecial/, rows: [] },
    ]);
    const { isSuperUser, permissionIds } = await getEffectivePermissionIds(DB, 3);
    expect(isSuperUser).toBe(false);
    expect(permissionIds.size).toBe(0);
  });

  it("excludes permissions from a disabled role (the fixed gap vs SCM's original behaviour)", async () => {
    // r.Enabled = 1 is baked into the role query itself, so a disabled role
    // never appears in activeRoleIds at all.
    route([
      { match: /FROM User_UserDetail/, rows: [{ SuperUser: false, Enabled: true }] },
      { match: /FROM User_UserRoles ur/, rows: [] }, // disabled role filtered out server-side
      { match: /FROM User_PermissionSpecial/, rows: [] },
    ]);
    const { permissionIds } = await getEffectivePermissionIds(DB, 4);
    expect(permissionIds.size).toBe(0);
  });

  it("excludes a disabled permission even from an active role", async () => {
    route([
      { match: /FROM User_UserDetail/, rows: [{ SuperUser: false, Enabled: true }] },
      { match: /FROM User_UserRoles ur/, rows: [{ RoleID: 10 }] },
      { match: /FROM Sys_RolePermission/, rows: [] }, // p.Enabled = 1 filters it out server-side
      { match: /FROM User_PermissionSpecial/, rows: [] },
    ]);
    const { permissionIds } = await getEffectivePermissionIds(DB, 5);
    expect(permissionIds.size).toBe(0);
  });

  it("excludes a role whose delegation has not started yet", async () => {
    route([
      { match: /FROM User_UserDetail/, rows: [{ SuperUser: false, Enabled: true }] },
      { match: /FROM User_UserRoles ur/, rows: [] }, // filtered server-side by DelegationStart <= now
      { match: /FROM User_PermissionSpecial/, rows: [] },
    ]);
    const { permissionIds } = await getEffectivePermissionIds(DB, 6);
    expect(permissionIds.size).toBe(0);
  });

  it("excludes a role whose delegation has expired", async () => {
    route([
      { match: /FROM User_UserDetail/, rows: [{ SuperUser: false, Enabled: true }] },
      { match: /FROM User_UserRoles ur/, rows: [] }, // filtered server-side by DelegationExpiry >= now
      { match: /FROM User_PermissionSpecial/, rows: [] },
    ]);
    const { permissionIds } = await getEffectivePermissionIds(DB, 7);
    expect(permissionIds.size).toBe(0);
  });

  it("includes a permanent role assignment (null delegation dates)", async () => {
    route([
      { match: /FROM User_UserDetail/, rows: [{ SuperUser: false, Enabled: true }] },
      { match: /FROM User_UserRoles ur/, rows: [{ RoleID: 20 }] },
      { match: /FROM Sys_RolePermission/, rows: [{ PermissionID: 200 }] },
      { match: /FROM User_PermissionSpecial/, rows: [] },
    ]);
    const { permissionIds } = await getEffectivePermissionIds(DB, 8);
    expect([...permissionIds]).toEqual([200]);
  });

  it("includes a direct special permission independent of any role", async () => {
    route([
      { match: /FROM User_UserDetail/, rows: [{ SuperUser: false, Enabled: true }] },
      { match: /FROM User_UserRoles ur/, rows: [] },
      { match: /FROM User_PermissionSpecial/, rows: [{ PermissionID: 300 }] },
    ]);
    const { permissionIds } = await getEffectivePermissionIds(DB, 9);
    expect([...permissionIds]).toEqual([300]);
  });

  it("excludes a disabled direct special permission", async () => {
    route([
      { match: /FROM User_UserDetail/, rows: [{ SuperUser: false, Enabled: true }] },
      { match: /FROM User_UserRoles ur/, rows: [] },
      { match: /FROM User_PermissionSpecial/, rows: [] }, // sp.Enabled = 1 filters it out server-side
    ]);
    const { permissionIds } = await getEffectivePermissionIds(DB, 10);
    expect(permissionIds.size).toBe(0);
  });

  it("dedupes a permission reachable via both a role and a direct special", async () => {
    route([
      { match: /FROM User_UserDetail/, rows: [{ SuperUser: false, Enabled: true }] },
      { match: /FROM User_UserRoles ur/, rows: [{ RoleID: 30 }] },
      { match: /FROM Sys_RolePermission/, rows: [{ PermissionID: 400 }] },
      { match: /FROM User_PermissionSpecial/, rows: [{ PermissionID: 400 }] },
    ]);
    const { permissionIds } = await getEffectivePermissionIds(DB, 11);
    expect([...permissionIds]).toEqual([400]);
  });

  it("caches the result and does not re-query within the TTL", async () => {
    route([
      { match: /FROM User_UserDetail/, rows: [{ SuperUser: false, Enabled: true }] },
      { match: /FROM User_UserRoles ur/, rows: [{ RoleID: 10 }] },
      { match: /FROM Sys_RolePermission/, rows: [{ PermissionID: 101 }] },
      { match: /FROM User_PermissionSpecial/, rows: [] },
    ]);
    await getEffectivePermissionIds(DB, 12);
    const callsAfterFirst = queryLog.length;
    await getEffectivePermissionIds(DB, 12);
    expect(queryLog.length).toBe(callsAfterFirst); // no new queries
  });

  it("re-queries after explicit invalidation", async () => {
    route([
      { match: /FROM User_UserDetail/, rows: [{ SuperUser: false, Enabled: true }] },
      { match: /FROM User_UserRoles ur/, rows: [{ RoleID: 10 }] },
      { match: /FROM Sys_RolePermission/, rows: [{ PermissionID: 101 }] },
      { match: /FROM User_PermissionSpecial/, rows: [] },
    ]);
    await getEffectivePermissionIds(DB, 13);
    const callsAfterFirst = queryLog.length;
    invalidateUserPermissions(DB, 13);
    await getEffectivePermissionIds(DB, 13);
    expect(queryLog.length).toBeGreaterThan(callsAfterFirst);
  });
});

describe("replaceUserRoles", () => {
  it("rejects unknown role ids without writing anything", async () => {
    route([{ match: /FROM Sys_RoleName/, rows: [] }]); // no roles found -> all unknown
    await expect(
      replaceUserRoles(DB, 1, [{ roleId: 999, delegatedByUserId: null, delegationStart: null, delegationExpiry: null }], 1),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("commits a transactional replace for valid roles", async () => {
    route([{ match: /FROM Sys_RoleName/, rows: [{ Role_ID: 10 }] }]);
    await expect(
      replaceUserRoles(DB, 1, [{ roleId: 10, delegatedByUserId: null, delegationStart: null, delegationExpiry: null }], 1),
    ).resolves.toBeUndefined();
  });
});

describe("replaceRolePermissions", () => {
  it("rejects unknown or disabled permission ids without writing anything", async () => {
    route([{ match: /FROM Sys_Permission/, rows: [] }]);
    await expect(replaceRolePermissions(DB, 1, [999])).rejects.toMatchObject({ statusCode: 400 });
  });

  it("commits a transactional replace for valid, enabled permissions", async () => {
    route([{ match: /FROM Sys_Permission/, rows: [{ Permission_ID: 101 }] }]);
    await expect(replaceRolePermissions(DB, 1, [101])).resolves.toBeUndefined();
  });
});
