const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { query: dbQuery } = require('../config/database');

const EXTERNAL_API_BASE = 'https://nicki-unrecuperated-counteractively.ngrok-free.dev';

const projectNameCache = new Map();
const regionNameCache = new Map();
const RESOLVE_CACHE_TTL = 5 * 60 * 1000;

function getCurrentFinYear() {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}/${year + 1}`;
}

async function resolveProjectName(projectId) {
  if (!projectId) return null;
  const key = String(projectId);
  const cached = projectNameCache.get(key);
  if (cached && Date.now() - cached.ts < RESOLVE_CACHE_TTL) return cached.data;
  try {
    const url = `${EXTERNAL_API_BASE}/planning/references/projects/${encodeURIComponent(key)}`;
    const resp = await fetch(url, { headers: { 'ngrok-skip-browser-warning': 'true' }, signal: AbortSignal.timeout(5000) });
    if (!resp.ok) { projectNameCache.set(key, { data: null, ts: Date.now() }); return null; }
    const d = await resp.json();
    const result = { id: d.projectId, name: d.projectName || d.projectDesc || String(d.projectId) };
    projectNameCache.set(key, { data: result, ts: Date.now() });
    return result;
  } catch { projectNameCache.set(key, { data: null, ts: Date.now() }); return null; }
}

async function resolveRegionName(regionId) {
  if (!regionId) return null;
  const key = String(regionId);
  const cached = regionNameCache.get(key);
  if (cached && Date.now() - cached.ts < RESOLVE_CACHE_TTL) return cached.data;
  try {
    const finYear = getCurrentFinYear();
    const url = `${EXTERNAL_API_BASE}/planning/references/scoa-region-structure/${encodeURIComponent(key)}?finyear=${encodeURIComponent(finYear)}`;
    const resp = await fetch(url, { headers: { 'ngrok-skip-browser-warning': 'true' }, signal: AbortSignal.timeout(5000) });
    if (!resp.ok) { regionNameCache.set(key, { data: null, ts: Date.now() }); return null; }
    const d = await resp.json();
    const result = { id: d.scoaId, name: d.scoaShortDesc || d.scoaDesc || String(d.scoaId) };
    regionNameCache.set(key, { data: result, ts: Date.now() });
    return result;
  } catch { regionNameCache.set(key, { data: null, ts: Date.now() }); return null; }
}

const SCOA_TABLES = {
  items: 'scoa_items',
  funds: 'scoa_funds',
  functions: 'scoa_functions',
  projects: 'scoa_projects',
  regions: 'scoa_regions',
  costings: 'scoa_costings',
  msc: 'scoa_msc'
};

router.get('/external/projects', authenticate, async (req, res, next) => {
  try {
    const { finYear, capitalOperationValue } = req.query;
    if (!finYear) {
      return res.status(400).json({ success: false, error: { message: 'finYear is required' } });
    }
    const capVal = capitalOperationValue || '3';
    const url = `${EXTERNAL_API_BASE}/planning/references/projects-by-capital-operation?capitalOperationValue=${encodeURIComponent(capVal)}&finYear=${encodeURIComponent(finYear)}`;
    const response = await fetch(url, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: { message: 'Failed to fetch projects from external API' } });
    }
    const data = await response.json();
    res.json({ success: true, data: data });
  } catch (err) { next(err); }
});

router.get('/external/control-scoa-items', authenticate, async (req, res, next) => {
  try {
    const { projectId, finYear } = req.query;
    if (!projectId || !finYear) {
      return res.status(400).json({ success: false, error: { message: 'projectId and finYear are required' } });
    }
    const url = `${EXTERNAL_API_BASE}/planning/references/projects/${encodeURIComponent(projectId)}/control-scoa-items?finYear=${encodeURIComponent(finYear)}`;
    const response = await fetch(url, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: { message: 'Failed to fetch control SCOA items from external API' } });
    }
    const raw = await response.json();
    const seen = new Set();
    const deduped = (Array.isArray(raw) ? raw : []).filter(item => {
      if (seen.has(item.scoaId)) return false;
      seen.add(item.scoaId);
      return true;
    });
    res.json({ success: true, data: deduped });
  } catch (err) { next(err); }
});

router.get('/external/plan-project-items', authenticate, async (req, res, next) => {
  try {
    const { scoaId, finYear } = req.query;
    if (!scoaId || !finYear) {
      return res.status(400).json({ success: false, error: { message: 'scoaId and finYear are required' } });
    }
    const url = `${EXTERNAL_API_BASE}/planning/references/scoa-items/${encodeURIComponent(scoaId)}/project-items?Finyear=${encodeURIComponent(finYear)}`;
    const response = await fetch(url, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: { message: 'Failed to fetch plan project items from external API' } });
    }
    const data = await response.json();
    res.json({ success: true, data: Array.isArray(data) ? data : [] });
  } catch (err) { next(err); }
});

router.get('/external/scoa-function-structure/:scoaId', authenticate, async (req, res, next) => {
  try {
    const { scoaId } = req.params;
    const { finYear } = req.query;
    if (!finYear) {
      return res.status(400).json({ success: false, error: { message: 'finYear is required' } });
    }
    const url = `${EXTERNAL_API_BASE}/planning/references/scoa-function-structure/${encodeURIComponent(scoaId)}?finYear=${encodeURIComponent(finYear)}`;
    const response = await fetch(url, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: { message: 'Failed to fetch SCOA function structure from external API' } });
    }
    const data = await response.json();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/external/scoa-function-tree', authenticate, async (req, res, next) => {
  try {
    const { parentId, finYear } = req.query;
    if (parentId === undefined || !finYear) {
      return res.status(400).json({ success: false, error: { message: 'parentId and finYear are required' } });
    }
    const url = `${EXTERNAL_API_BASE}/planning/references/scoa-function-structure?parentId=${encodeURIComponent(parentId)}&finYear=${encodeURIComponent(finYear)}`;
    const response = await fetch(url, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: { message: 'Failed to fetch SCOA function tree from external API' } });
    }
    const data = await response.json();
    res.json({ success: true, data: Array.isArray(data) ? data : [] });
  } catch (err) { next(err); }
});

router.get('/external/scoa-function-tree/resolve', authenticate, async (req, res, next) => {
  try {
    const { scoaId, finYear } = req.query;
    if (!scoaId || !finYear) {
      return res.status(400).json({ success: false, error: { message: 'scoaId and finYear are required' } });
    }

    async function fetchItem(id) {
      const url = `${EXTERNAL_API_BASE}/planning/references/scoa-function-structure/${encodeURIComponent(id)}?finYear=${encodeURIComponent(finYear)}`;
      const resp = await fetch(url, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(5000)
      });
      if (!resp.ok) return null;
      return await resp.json();
    }

    const item = await fetchItem(scoaId);
    if (!item) {
      return res.json({ success: true, data: null });
    }

    const breadcrumbs = [];
    let currentParentId = item.scoaParentId;
    const MAX_DEPTH = 10;
    let depth = 0;
    while (currentParentId && currentParentId !== 0 && depth < MAX_DEPTH) {
      depth++;
      const parent = await fetchItem(currentParentId);
      if (!parent) break;
      breadcrumbs.unshift({ scoaId: parent.scoaId, parentId: parent.scoaParentId, label: parent.scoaShortDesc });
      currentParentId = parent.scoaParentId;
    }

    res.json({ success: true, data: { item, breadcrumbs } });
  } catch (err) { next(err); }
});

router.get('/external/scoa-structure', authenticate, async (req, res, next) => {
  try {
    const { parentId, finYear } = req.query;
    if (parentId === undefined || !finYear) {
      return res.status(400).json({ success: false, error: { message: 'parentId and finYear are required' } });
    }
    const url = `${EXTERNAL_API_BASE}/planning/references/scoa-structure?parentId=${encodeURIComponent(parentId)}&finYear=${encodeURIComponent(finYear)}`;
    const response = await fetch(url, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: { message: 'Failed to fetch SCOA structure from external API' } });
    }
    const data = await response.json();
    res.json({ success: true, data: Array.isArray(data) ? data : [] });
  } catch (err) { next(err); }
});

router.get('/external/scoa-structure/resolve', authenticate, async (req, res, next) => {
  try {
    const { scoaId, finYear } = req.query;
    if (!scoaId || !finYear) {
      return res.status(400).json({ success: false, error: { message: 'scoaId and finYear are required' } });
    }
    const targetId = Number(scoaId);
    const TIMEOUT_MS = 12000;
    const startTime = Date.now();

    async function fetchChildren(parentId) {
      const url = `${EXTERNAL_API_BASE}/planning/references/scoa-structure?parentId=${encodeURIComponent(parentId)}&finYear=${encodeURIComponent(finYear)}`;
      const resp = await fetch(url, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(5000)
      });
      if (!resp.ok) return [];
      const data = await resp.json();
      return Array.isArray(data) ? data : [];
    }

    const queue = [{ parentId: 0, trail: [] }];
    while (queue.length > 0) {
      if (Date.now() - startTime > TIMEOUT_MS) {
        return res.json({ success: true, data: null });
      }
      const { parentId, trail } = queue.shift();
      let items;
      try {
        items = await fetchChildren(parentId);
      } catch (e) {
        continue;
      }
      const match = items.find(i => i.scoaId === targetId);
      if (match) {
        return res.json({ success: true, data: { item: match, breadcrumbs: trail } });
      }
      for (const item of items) {
        if (item.postingLevel !== 'Yes') {
          queue.push({
            parentId: item.scoaId,
            trail: [...trail, { scoaId: item.scoaId, parentId: item.scoaParentId, label: item.scoaShortDesc }]
          });
        }
      }
    }
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

router.get('/external/resolve-project/:projectId', authenticate, async (req, res, next) => {
  try {
    const result = await resolveProjectName(req.params.projectId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/external/resolve-region/:regionId', authenticate, async (req, res, next) => {
  try {
    const result = await resolveRegionName(req.params.regionId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/external/resolve-batch', authenticate, async (req, res, next) => {
  try {
    const { projectIds = [], regionIds = [] } = req.body || {};
    const uniqueProjects = [...new Set((projectIds || []).map(String).filter(Boolean))];
    const uniqueRegions = [...new Set((regionIds || []).map(String).filter(Boolean))];
    const [projects, regions] = await Promise.all([
      Promise.all(uniqueProjects.map(async id => ({ id, ...(await resolveProjectName(id)) }))),
      Promise.all(uniqueRegions.map(async id => ({ id, ...(await resolveRegionName(id)) })))
    ]);
    const projectMap = {};
    projects.forEach(p => { if (p.name) projectMap[p.id] = p.name; });
    const regionMap = {};
    regions.forEach(r => { if (r.name) regionMap[r.id] = r.name; });
    res.json({ success: true, data: { projects: projectMap, regions: regionMap } });
  } catch (err) { next(err); }
});

router.get('/scoa/:segment', authenticate, async (req, res, next) => {
  try {
    const table = SCOA_TABLES[req.params.segment];
    if (!table) {
      return res.status(400).json({ success: false, error: { message: `Invalid SCOA segment: ${req.params.segment}` } });
    }
    const postingOnly = req.query.posting_only === 'true';
    let sql = `SELECT id, code, description, parent_code, level, posting_level FROM ${table}`;
    if (postingOnly) sql += ' WHERE posting_level = true';
    sql += ' ORDER BY code';
    const result = await dbQuery(sql);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/salary-heads', authenticate, async (req, res, next) => {
  try {
    const { transaction_type } = req.query;
    let sql = `
      SELECT sh.id, sh.code, sh.name, sh.transaction_type,
        sh.start_date, sh.end_date, sh.enabled,
        gl.fin_year,
        gl.scoa_project_id,
        gl.suspense_scoa_item_id,
        gl.suspense_scoa_item_credit_id,
        gl.scoa_item_id_permanent_staff,
        gl.scoa_item_id_permanent_staff_meta,
        gl.earning_not_applicable_post_retirement,
        gl.scoa_item_id_post_retirement,
        gl.scoa_item_id_post_retirement_meta,
        gl.override_project,
        gl.plan_project_item_id,
        gl.journal_entry_only,
        gl.scoa_item_id,
        gl.scoa_item_id_meta,
        gl.vendor_id,
        gl.vendor_scoa_project_id,
        gl.vendor_scoa_id,
        gl.start_date AS gl_start_date,
        gl.end_date AS gl_end_date,
        stt.description AS type_description
      FROM salary_heads sh
      LEFT JOIN payroll_gl_items gl ON gl.salary_head_id = sh.id
      LEFT JOIN const_salary_transaction_types stt ON stt.code = sh.transaction_type
    `;
    const params = [];
    if (transaction_type) {
      params.push(transaction_type);
      sql += ` WHERE sh.transaction_type = $1`;
    }
    sql += ' ORDER BY sh.id';
    const result = await dbQuery(sql, params);
    const rows = result.rows.map(r => {
      const row = {
        ...r,
        start_date: r.gl_start_date || r.start_date,
        end_date: r.gl_end_date || r.end_date
      };
      delete row.gl_start_date;
      delete row.gl_end_date;
      return row;
    });
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.put('/salary-heads/:id/gl-mapping', authenticate, auditLog('UPDATE', 'payroll_gl_items'), async (req, res, next) => {
  try {
    const salaryHeadId = req.params.id;
    const existing = await dbQuery('SELECT * FROM salary_heads WHERE id = $1', [salaryHeadId]);
    if (!existing.rows.length) {
      return res.status(404).json({ success: false, error: { message: 'Salary transaction not found' } });
    }

    const existingGl = await dbQuery('SELECT id FROM payroll_gl_items WHERE salary_head_id = $1', [salaryHeadId]);
    const historyAction = existingGl.rows.length > 0 ? 'UPDATE' : 'INSERT';

    const {
      fin_year, start_date, end_date,
      journal_entry_only,
      scoa_project_id, suspense_scoa_item_id, suspense_scoa_item_credit_id,
      scoa_item_id_permanent_staff, scoa_item_id_permanent_staff_meta,
      earning_not_applicable_post_retirement,
      scoa_item_id_post_retirement, scoa_item_id_post_retirement_meta,
      override_project, plan_project_item_id,
      scoa_item_id, scoa_item_id_meta,
      vendor_id, vendor_scoa_project_id, vendor_scoa_id
    } = req.body;

    const isJournalEntry = journal_entry_only || false;

    const values = [
      salaryHeadId,
      fin_year || null,
      start_date || '1900-01-01',
      end_date || '9999-12-31',
      isJournalEntry,
      scoa_project_id || null,
      suspense_scoa_item_id || null,
      suspense_scoa_item_credit_id || null,
      scoa_item_id_permanent_staff || null,
      scoa_item_id_permanent_staff_meta ? JSON.stringify(scoa_item_id_permanent_staff_meta) : null,
      earning_not_applicable_post_retirement || false,
      scoa_item_id_post_retirement || null,
      scoa_item_id_post_retirement_meta ? JSON.stringify(scoa_item_id_post_retirement_meta) : null,
      override_project || false,
      plan_project_item_id || null,
      (isJournalEntry ? scoa_item_id || null : null),
      (isJournalEntry && scoa_item_id_meta ? JSON.stringify(scoa_item_id_meta) : null),
      (isJournalEntry ? null : vendor_id || null),
      (isJournalEntry ? null : vendor_scoa_project_id || null),
      (isJournalEntry ? null : vendor_scoa_id || null),
      req.user?.id || null
    ];

    const result = await dbQuery(`
      INSERT INTO payroll_gl_items (
        salary_head_id, fin_year, start_date, end_date,
        journal_entry_only,
        scoa_project_id, suspense_scoa_item_id, suspense_scoa_item_credit_id,
        scoa_item_id_permanent_staff, scoa_item_id_permanent_staff_meta,
        earning_not_applicable_post_retirement,
        scoa_item_id_post_retirement, scoa_item_id_post_retirement_meta,
        override_project, plan_project_item_id,
        scoa_item_id, scoa_item_id_meta,
        vendor_id, vendor_scoa_project_id, vendor_scoa_id,
        created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $21
      )
      ON CONFLICT (salary_head_id) DO UPDATE SET
        fin_year = $2, start_date = $3, end_date = $4,
        journal_entry_only = $5,
        scoa_project_id = $6, suspense_scoa_item_id = $7, suspense_scoa_item_credit_id = $8,
        scoa_item_id_permanent_staff = $9, scoa_item_id_permanent_staff_meta = $10,
        earning_not_applicable_post_retirement = $11,
        scoa_item_id_post_retirement = $12, scoa_item_id_post_retirement_meta = $13,
        override_project = $14, plan_project_item_id = $15,
        scoa_item_id = $16, scoa_item_id_meta = $17,
        vendor_id = $18, vendor_scoa_project_id = $19, vendor_scoa_id = $20,
        updated_at = NOW(), updated_by = $21
      RETURNING *
    `, values);

    const row = result.rows[0];

    await dbQuery(`
      INSERT INTO payroll_gl_history (
        gl_item_id, salary_head_id, action,
        fin_year, start_date, end_date,
        journal_entry_only,
        scoa_project_id, suspense_scoa_item_id, suspense_scoa_item_credit_id,
        scoa_item_id_permanent_staff, scoa_item_id_permanent_staff_meta,
        earning_not_applicable_post_retirement,
        scoa_item_id_post_retirement, scoa_item_id_post_retirement_meta,
        override_project, plan_project_item_id,
        scoa_item_id, scoa_item_id_meta,
        vendor_id, vendor_scoa_project_id, vendor_scoa_id,
        changed_by
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23
      )
    `, [
      row.id, salaryHeadId, historyAction,
      row.fin_year, row.start_date, row.end_date,
      row.journal_entry_only,
      row.scoa_project_id, row.suspense_scoa_item_id, row.suspense_scoa_item_credit_id,
      row.scoa_item_id_permanent_staff,
      row.scoa_item_id_permanent_staff_meta ? JSON.stringify(row.scoa_item_id_permanent_staff_meta) : null,
      row.earning_not_applicable_post_retirement,
      row.scoa_item_id_post_retirement,
      row.scoa_item_id_post_retirement_meta ? JSON.stringify(row.scoa_item_id_post_retirement_meta) : null,
      row.override_project, row.plan_project_item_id,
      row.scoa_item_id,
      row.scoa_item_id_meta ? JSON.stringify(row.scoa_item_id_meta) : null,
      row.vendor_id, row.vendor_scoa_project_id, row.vendor_scoa_id,
      req.user?.id || null
    ]);

    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

module.exports = router;
