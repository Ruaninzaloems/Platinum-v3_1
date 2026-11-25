import jwt from "jsonwebtoken";

/**
 * POS-API as the platform's single global identity source.
 *
 * Every module today either runs its own separate login (SCM), trusts an
 * unsigned identity header (Overtime's X-Username, Performance's x-user), or
 * has no authentication at all. This issues one signed JWT at POS-API login
 * that any module backend can verify the signature of, closing the
 * impersonation gap those unsigned headers left open.
 *
 * Scope for this phase: IDENTITY only, not permissions. Overtime's
 * production database is confirmed genuinely disconnected from
 * EMS_GeorgeUAT, so a permission claim resolved here would be meaningless to
 * it; Performance also keeps resolving authorization from its own local
 * tables. Modules that want the real EMS-backed permission set can still
 * call getEffectivePermissionIds() (ems-security.ts) directly server-to-server
 * later — this token deliberately does not carry an `ems_perms` claim yet.
 *
 * HS256 with one shared secret (not RS256): every consumer is a first-party
 * backend this team controls, so there's no case for asymmetric keys, and it
 * matches the HS256 scheme SCM-API already validates today.
 */

const ISSUER = "PlatinumPOS";
const AUDIENCE = "Platinum-Suite";
const EXPIRES_IN = "8h"; // matches SCM's Jwt:ExpiryInMinutes default of 480

// Local-dev-only fallback, clearly not a real secret. Matches the
// JWT_SECRET already present in the repo root .env (used by PAYROLL-APP) and
// every other migrated module's own dev fallback — they must all agree, or a
// token minted here won't verify against a module using a different literal.
// The real production value is set as the PLATINUM_JWT_SECRET App Setting,
// identically across every App Service that validates this token, and is
// never generated or committed here.
const DEV_FALLBACK_SECRET = "platinum-local-dev-jwt-secret-change-in-production";

function getSecret(): string {
  const secret = process.env.PLATINUM_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "PLATINUM_JWT_SECRET is not set. Refusing to issue a global auth token with the local-dev fallback secret in production."
      );
    }
    return DEV_FALLBACK_SECRET;
  }
  return secret;
}

export interface GlobalTokenClaims {
  sub: string;
  name: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  super_user: boolean;
  db_provider?: string;
  fin_year?: string;
  modules?: string[];
}

/**
 * Mint the global identity JWT for a just-authenticated POS-API user.
 * `userData` is the same shape POS-API already stores as
 * session.userData (see platinum-auth.ts's UserSession) — this does not
 * change or replace that session, it's an additive claims artifact for
 * other modules' backends to verify.
 */
export function issueGlobalToken(userData: any, dbName?: string): string {
  const claims: GlobalTokenClaims = {
    sub: String(userData.user_ID),
    name: userData.userName,
    email: userData.eMail,
    given_name: userData.firstName,
    family_name: userData.lastName,
    super_user: !!userData.superUser,
    db_provider: dbName,
    fin_year: userData.finYear,
    modules: Array.isArray(userData.modules) ? userData.modules : undefined,
  };

  return jwt.sign(claims, getSecret(), {
    algorithm: "HS256",
    expiresIn: EXPIRES_IN,
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

/**
 * Verify a global token issued by issueGlobalToken(). Not currently called
 * from POS-API itself (its own routes keep trusting the express-session
 * cookie as before) — exported for reuse/testing and for any future
 * server-to-server call POS-API makes to a module that expects this token
 * back.
 */
export function verifyGlobalToken(token: string): GlobalTokenClaims {
  return jwt.verify(token, getSecret(), {
    algorithms: ["HS256"],
    issuer: ISSUER,
    audience: AUDIENCE,
  }) as unknown as GlobalTokenClaims;
}
