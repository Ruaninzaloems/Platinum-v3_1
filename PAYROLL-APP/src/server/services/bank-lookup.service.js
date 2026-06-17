const DEFAULT_BASE = 'https://nicki-unrecuperated-counteractively.ngrok-free.dev';
const BASE = (process.env.BANK_LOOKUP_BASE_URL || DEFAULT_BASE).replace(/\/$/, '');
const TTL_MS = 10 * 60 * 1000;

const cache = new Map();

async function fetchJson(path) {
  const url = `${BASE}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(url, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    if (!resp.ok) {
      const err = new Error(`Upstream ${resp.status} for ${path}`);
      err.statusCode = 502;
      err.code = 'UPSTREAM_ERROR';
      throw err;
    }
    const text = await resp.text();
    try {
      return JSON.parse(text);
    } catch {
      const err = new Error(`Upstream returned non-JSON for ${path}`);
      err.statusCode = 502;
      err.code = 'UPSTREAM_BAD_JSON';
      throw err;
    }
  } finally {
    clearTimeout(timer);
  }
}

async function getCached(key, path) {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.value;
  const value = await fetchJson(path);
  cache.set(key, { value, expires: now + TTL_MS });
  return value;
}

async function getBanks() {
  return getCached('banks', '/banks');
}
async function getBranchCodes() {
  return getCached('branch-codes', '/bank-branch-codes');
}
async function getAccountTypes() {
  return getCached('account-types', '/bank-account-types');
}

async function findBank(id) {
  if (id == null) return null;
  const list = await getBanks().catch(() => []);
  return (list || []).find(b => Number(b.bankId) === Number(id)) || null;
}
async function findBranch(id) {
  if (id == null) return null;
  const list = await getBranchCodes().catch(() => []);
  return (list || []).find(b => Number(b.bankBranchCodeId) === Number(id)) || null;
}
async function findAccountType(id) {
  if (id == null) return null;
  const list = await getAccountTypes().catch(() => []);
  return (list || []).find(t => Number(t.bankAccountTypeId) === Number(id)) || null;
}

function invalidate() {
  cache.clear();
}

module.exports = {
  getBanks,
  getBranchCodes,
  getAccountTypes,
  findBank,
  findBranch,
  findAccountType,
  invalidate,
  _base: BASE,
};
