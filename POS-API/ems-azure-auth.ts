import crypto from "crypto";
import { getEmsPool, getTenantPool, sql } from "./ems-db";

/**
 * Azure-AD (MSAL) user provisioning against the EMS database.
 * ───────────────────────────────────────────────────────────
 * Port of the old app's `/auth/createTokenAzure` provisioning logic:
 *
 *   1. Look the user up by Azure object id (msal_id) in `user_azure_link`.
 *   2. Link found      → return the linked `User_UserDetail` row.
 *      - orphaned link → re-match by email / create, then repoint the link.
 *   3. No link         → match an EMS user by email:
 *        exactly one   → link that user to the Azure id,
 *        none          → create a new EMS user and link it,
 *        more than one → error (ambiguous).
 *
 * No password is ever checked — trust comes from the MSAL token the front end
 * already validated. A new user gets a random (unusable) password hash.
 *
 * Table / column names are centralised here so they can be adjusted if the EMS
 * schema differs from the old app. SQL Server identifiers are case-insensitive,
 * so only spelling matters (not casing).
 */
const T_LINK = "user_azure_link"; // (msal_id, user_db, user_id) — lives in ems_v3
const T_USER = "User_UserDetail"; // EMS user table — lives in the tenant DB

export interface EmsUser {
  userId: number;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  enabled: boolean;
  superUser: boolean;
  cashFloat: number;
}

export interface AzureClaims {
  azureUid: string; // idTokenClaims.oid (Guid)
  email: string; // preferred_username
  username: string; // display name, e.g. "Jane Doe"
  userDb: string; // tenant db label stored in user_azure_link.user_db
}

/** Reads a column case-insensitively, trying each candidate name in order. */
function pick(row: any, ...names: string[]): any {
  for (const n of names) {
    if (row[n] !== undefined) return row[n];
    const key = Object.keys(row).find((k) => k.toLowerCase() === n.toLowerCase());
    if (key) return row[key];
  }
  return undefined;
}

function mapUser(row: any): EmsUser {
  return {
    userId: Number(pick(row, "UserId", "user_id", "userID")),
    userName: pick(row, "UserName") ?? "",
    firstName: pick(row, "FirstName") ?? "",
    lastName: pick(row, "LastName") ?? "",
    email: pick(row, "eMail", "email", "Email") ?? "",
    enabled: !!pick(row, "Enabled"),
    superUser: !!pick(row, "SuperUser"),
    cashFloat: Number(pick(row, "CashFloat") ?? 0),
  };
}

// One-time schema dump on first use — helps verify the EMS column names against
// a live DB (we cannot connect at build time).
let schemaLogged = false;
async function logSchemaOnce(pool: sql.ConnectionPool): Promise<void> {
  if (schemaLogged) return;
  schemaLogged = true;
  try {
    const res = await pool.request().query(
      `SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_NAME IN ('${T_LINK}', '${T_USER}') ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    );
    const byTable: Record<string, string[]> = {};
    for (const r of res.recordset) {
      (byTable[r.TABLE_NAME] ??= []).push(r.COLUMN_NAME);
    }
    console.log("[EmsAzure] Schema:", JSON.stringify(byTable));
  } catch (e: any) {
    console.warn("[EmsAzure] Schema introspection failed:", e.message);
  }
}

async function getAzureLinkUserId(
  pool: sql.ConnectionPool,
  azureUid: string,
  userDb: string,
): Promise<number | null> {
  const res = await pool
    .request()
    .input("msalId", sql.UniqueIdentifier, azureUid)
    .input("userDb", sql.NVarChar, userDb)
    .query(
      `SELECT TOP 1 user_id FROM ${T_LINK} WHERE msal_id = @msalId AND user_db = @userDb`,
    );
  const row = res.recordset[0];
  return row ? Number(row.user_id) : null;
}

async function getUserById(
  pool: sql.ConnectionPool,
  userId: number,
): Promise<EmsUser | null> {
  const res = await pool
    .request()
    .input("id", sql.Int, userId)
    .query(`SELECT * FROM ${T_USER} WHERE UserId = @id`);
  return res.recordset[0] ? mapUser(res.recordset[0]) : null;
}

async function getEmailMatches(
  pool: sql.ConnectionPool,
  email: string,
): Promise<EmsUser[]> {
  const res = await pool
    .request()
    .input("email", sql.NVarChar, email)
    .query(`SELECT * FROM ${T_USER} WHERE eMail = @email`);
  return res.recordset.map(mapUser);
}

async function addAzureLink(
  pool: sql.ConnectionPool,
  azureUid: string,
  userDb: string,
  userId: number,
): Promise<void> {
  await pool
    .request()
    .input("msalId", sql.UniqueIdentifier, azureUid)
    .input("userDb", sql.NVarChar, userDb)
    .input("userId", sql.Int, userId)
    .query(
      `INSERT INTO ${T_LINK} (msal_id, user_db, user_id) VALUES (@msalId, @userDb, @userId)`,
    );
}

async function repointAzureLink(
  pool: sql.ConnectionPool,
  azureUid: string,
  userDb: string,
  userId: number,
): Promise<void> {
  await pool
    .request()
    .input("msalId", sql.UniqueIdentifier, azureUid)
    .input("userDb", sql.NVarChar, userDb)
    .input("userId", sql.Int, userId)
    .query(
      `UPDATE ${T_LINK} SET user_id = @userId WHERE msal_id = @msalId AND user_db = @userDb`,
    );
}

async function createAzureUser(
  pool: sql.ConnectionPool,
  claims: AzureClaims,
): Promise<EmsUser> {
  const parts = (claims.username || "").split(" ").filter(Boolean);
  const firstName = parts[0] || "Azure";
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : firstName;
  const initial = lastName.length > 0 ? lastName[0].toUpperCase() : "U";
  const userName = `V2${firstName}${initial}${1000 + Math.floor(Math.random() * 9000)}`;
  // Random, unusable password hash — Azure users never log in with a password.
  const password = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const endDate = new Date(now);
  endDate.setFullYear(endDate.getFullYear() + 2);

  const res = await pool
    .request()
    .input("userName", sql.NVarChar, userName)
    .input("password", sql.NVarChar, password)
    .input("firstName", sql.NVarChar, firstName)
    .input("lastName", sql.NVarChar, lastName)
    .input("email", sql.NVarChar, claims.email)
    .input("now", sql.DateTime, now)
    .input("endDate", sql.DateTime, endDate)
    .query(
      `INSERT INTO ${T_USER}
         (UserName, [Password], FirstName, LastName, eMail, Enabled, DateCaptured,
          SuperUser, PasswordNeverExpire, CapturerID, PasswordLastChangedDate,
          TemporaryPassword, EndDate, CashFloat)
       OUTPUT INSERTED.UserId
       VALUES
         (@userName, @password, @firstName, @lastName, @email, 1, @now,
          0, 1, 777, @now,
          0, @endDate, 0)`,
    );

  const userId = Number(res.recordset[0].UserId ?? res.recordset[0].userId);
  console.log(
    `[EmsAzure] Created EMS user ${userName} (UserId: ${userId}) for ${claims.email}`,
  );
  return {
    userId,
    userName,
    firstName,
    lastName,
    email: claims.email,
    enabled: true,
    superUser: false,
    cashFloat: 0,
  };
}

async function resolveByEmailOrCreate(
  pool: sql.ConnectionPool,
  claims: AzureClaims,
): Promise<EmsUser> {
  const matches = await getEmailMatches(pool, claims.email);
  if (matches.length === 1) return matches[0];
  if (matches.length === 0) return createAzureUser(pool, claims);
  throw new Error(
    "Multiple users with the same email exist. Please contact support.",
  );
}

/**
 * Resolve (find-or-create + link) the EMS user for a set of MSAL claims.
 * Throws on ambiguous email; the caller maps that to a client-facing error.
 */
export async function resolveAzureUser(claims: AzureClaims): Promise<EmsUser> {
  // `user_azure_link` lives in ems_v3; `User_UserDetail` lives in the tenant DB
  // named by claims.userDb (e.g. George / Site02).
  const v2Pool = await getEmsPool();
  const tenantPool = await getTenantPool(claims.userDb);
  await logSchemaOnce(tenantPool);

  const linkedId = await getAzureLinkUserId(v2Pool, claims.azureUid, claims.userDb);
  if (linkedId != null) {
    const linked = await getUserById(tenantPool, linkedId);
    if (linked) return linked; // happy path

    // Orphaned link (points at a deleted user) → re-resolve and repoint.
    const reMatched = await resolveByEmailOrCreate(tenantPool, claims);
    await repointAzureLink(v2Pool, claims.azureUid, claims.userDb, reMatched.userId);
    console.log(
      `[EmsAzure] Repointed orphaned Azure link ${claims.azureUid} → UserId ${reMatched.userId}`,
    );
    return reMatched;
  }

  // No link yet → resolve by email or create in the tenant DB, then link in ems_v3.
  const user = await resolveByEmailOrCreate(tenantPool, claims);
  await addAzureLink(v2Pool, claims.azureUid, claims.userDb, user.userId);
  console.log(
    `[EmsAzure] Linked Azure id ${claims.azureUid} → UserId ${user.userId} (${user.email}) in ${claims.userDb}`,
  );
  return user;
}

/**
 * South-African municipal financial year (July–June) as "YYYY/YYYY".
 * EMS `User_UserDetail` has no finYear column, so it is derived here for the
 * session payload (POS cashier flows expect it).
 */
export function computeFinYear(date = new Date()): string {
  const y = date.getFullYear();
  return date.getMonth() + 1 >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
}
