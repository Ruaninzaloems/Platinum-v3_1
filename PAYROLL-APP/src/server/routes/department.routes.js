const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

const EXTERNAL_BASE = 'https://nicki-unrecuperated-counteractively.ngrok-free.dev';
const CACHE_TTL = 5 * 60 * 1000;

let deptCache = { data: null, ts: 0 };
let divCache = { data: null, ts: 0 };

async function fetchExternal(path) {
  const res = await fetch(`${EXTERNAL_BASE}${path}`, {
    headers: { 'ngrok-skip-browser-warning': 'true' }
  });
  if (!res.ok) throw new Error(`External API error: ${res.status}`);
  return res.json();
}

async function getDepartments() {
  if (deptCache.data && Date.now() - deptCache.ts < CACHE_TTL) return deptCache.data;
  const raw = await fetchExternal('/departments');
  const mapped = (Array.isArray(raw) ? raw : []).map(d => ({
    id: d.departmentId,
    name: d.name,
    code: d.code,
    enabled: d.enabled !== false,
    start_date: d.startDate || null,
    end_date: d.endDate || null
  }));
  mapped.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  deptCache = { data: mapped, ts: Date.now() };
  return mapped;
}

async function getDivisions() {
  if (divCache.data && Date.now() - divCache.ts < CACHE_TTL) return divCache.data;
  const raw = await fetchExternal('/divisions');
  const mapped = (Array.isArray(raw) ? raw : []).map(d => ({
    id: d.divisionId,
    name: d.name,
    code: d.code,
    department_id: d.departmentId,
    parent_id: d.parentDivisionId || null,
    scoa_function_id: d.scoaFunctionId || null,
    scoa_region_id: d.scoaRegionId || null,
    project_id: d.projectId || null,
    fin_year: d.finYear || null,
    enabled: true
  }));
  mapped.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  divCache = { data: mapped, ts: Date.now() };
  return mapped;
}

async function getDeptName(id) {
  if (!id) return null;
  const depts = await getDepartments();
  const d = depts.find(x => x.id === Number(id));
  return d ? d.name : null;
}

async function getDivName(id) {
  if (!id) return null;
  const divs = await getDivisions();
  const d = divs.find(x => x.id === Number(id));
  return d ? d.name : null;
}

async function enrichDeptDiv(rows) {
  if (!rows || rows.length === 0) return rows;
  const [depts, divs] = await Promise.all([getDepartments(), getDivisions()]);
  const deptMap = new Map(depts.map(d => [d.id, d.name]));
  const divMap = new Map(divs.map(d => [d.id, d.name]));
  const divDeptMap = new Map(divs.map(d => [d.id, d.department_id]));
  for (const row of rows) {
    if (row.division_id && !row.division_name) {
      row.division_name = divMap.get(Number(row.division_id)) || null;
    }
    if (row.department_id && !row.department_name) {
      row.department_name = deptMap.get(Number(row.department_id)) || null;
    }
    if (!row.department_name && row.division_id) {
      const deptId = divDeptMap.get(Number(row.division_id));
      if (deptId) row.department_name = deptMap.get(Number(deptId)) || null;
    }
  }
  return rows;
}

async function enrichSingle(row) {
  if (!row) return row;
  await enrichDeptDiv([row]);
  return row;
}

router.get('/', authenticate, async (req, res, next) => {
  try {
    const departments = await getDepartments();
    res.json({ success: true, data: departments });
  } catch (err) {
    next(err);
  }
});

router.get('/lookups/all', authenticate, async (req, res, next) => {
  try {
    const [departments, divisions] = await Promise.all([getDepartments(), getDivisions()]);
    res.json({ success: true, data: { departments, divisions } });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const departments = await getDepartments();
    const dept = departments.find(d => d.id === Number(req.params.id));
    if (!dept) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Department not found' } });
    const allDivisions = await getDivisions();
    const divisions = allDivisions.filter(d => d.department_id === dept.id);
    res.json({ success: true, data: { ...dept, divisions } });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/divisions', authenticate, async (req, res, next) => {
  try {
    const allDivisions = await getDivisions();
    const divisions = allDivisions.filter(d => d.department_id === Number(req.params.id));
    res.json({ success: true, data: divisions });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.getDepartments = getDepartments;
module.exports.getDivisions = getDivisions;
module.exports.getDeptName = getDeptName;
module.exports.getDivName = getDivName;
module.exports.enrichDeptDiv = enrichDeptDiv;
module.exports.enrichSingle = enrichSingle;
