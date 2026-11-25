import { Router } from "express";
import { db } from "@workspace/db";
import { deptScorecardsTable, deptScorecardKpisTable, scorecardKpisTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../Middleware/auth";
import { logAudit } from "../Middleware/audit";
import {
  CreateDeptScorecardBody,
  UpdateDeptScorecardBody,
  TransitionDeptScorecardBody,
  CreateDeptScorecardKpiBody,
  UpdateDeptKpiBody,
} from "@workspace/api-zod";

const router = Router();

/**
 * Derive a short uppercase prefix from a department name, e.g.
 * "Budget & Support Services" -> "BSS". Used when the scorecard's own KPIs
 * don't already carry a consistent prefix.
 */
function derivePrefixFromName(name: string): string {
  const stop = new Set(["and", "of", "the", "for"]);
  const words = name.split(/[^A-Za-z]+/).filter((w) => w && !stop.has(w.toLowerCase()));
  if (words.length === 0) return "DEPT";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 4).toUpperCase();
}

/**
 * Renumber a departmental scorecard's OWN (non-inherited) KPIs to
 * "<PREFIX>-1..N" (by sortOrder, then id) so numbers stay sequential after
 * adds/deletes. Inherited KPIs keep the organisational KPI number untouched.
 * The prefix is the most common one already used by the scorecard's own KPIs
 * (e.g. "BSD" from "BSD-01"), falling back to the department name's initials.
 */
async function renumberDeptKpis(deptScorecardId: number): Promise<void> {
  const [sc] = await db.select().from(deptScorecardsTable).where(eq(deptScorecardsTable.id, deptScorecardId));
  if (!sc) return;
  const kpis = await db.select({
    id: deptScorecardKpisTable.id,
    kpiNumber: deptScorecardKpisTable.kpiNumber,
    isInherited: deptScorecardKpisTable.isInherited,
    sortOrder: deptScorecardKpisTable.sortOrder,
  })
    .from(deptScorecardKpisTable)
    .where(eq(deptScorecardKpisTable.deptScorecardId, deptScorecardId))
    .orderBy(deptScorecardKpisTable.sortOrder, deptScorecardKpisTable.id);
  const own = kpis.filter((k) => !k.isInherited);
  if (own.length === 0) return;

  const counts = new Map<string, number>();
  for (const k of own) {
    const m = /^([A-Za-z]+)[-_ ]?\d+$/.exec(k.kpiNumber.trim());
    if (m) {
      const p = m[1].toUpperCase();
      counts.set(p, (counts.get(p) ?? 0) + 1);
    }
  }
  let prefix = "";
  for (const [p, c] of counts) {
    if (!prefix || c > (counts.get(prefix) ?? 0)) prefix = p;
  }
  if (!prefix) prefix = derivePrefixFromName(sc.departmentName);

  await db.transaction(async (tx) => {
    for (let i = 0; i < own.length; i++) {
      const wanted = `${prefix}-${i + 1}`;
      if (own[i].kpiNumber !== wanted) {
        await tx.update(deptScorecardKpisTable)
          .set({ kpiNumber: wanted, updatedAt: new Date() })
          .where(eq(deptScorecardKpisTable.id, own[i].id));
      }
    }
  });
}

const DEPT_SC_TRANSITIONS: Record<string, Record<string, string>> = {
  Draft: { submit: "Submitted" },
  Submitted: { approve: "Approved", return: "Draft" },
  Approved: { lock: "Locked" },
};

router.get("/dept-scorecards", async (req: AuthenticatedRequest, res) => {
  const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
  const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
  let rows = await db.select().from(deptScorecardsTable);
  if (cycleId) rows = rows.filter(r => r.cycleId === cycleId);
  if (departmentId) rows = rows.filter(r => r.departmentId === departmentId);
  res.json(rows);
});

router.post("/dept-scorecards", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const parsed = CreateDeptScorecardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.insert(deptScorecardsTable).values({
    ...parsed.data,
    createdById: req.user!.id,
  }).returning();
  await logAudit(req, "create", "dept_scorecard", row.id, null, row as unknown as Record<string, unknown>, row.cycleId);
  res.status(201).json(row);
});

router.patch("/dept-scorecards/:id", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(deptScorecardsTable).where(eq(deptScorecardsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const parsed = UpdateDeptScorecardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.update(deptScorecardsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(deptScorecardsTable.id, id)).returning();
  await logAudit(req, "update", "dept_scorecard", id, existing as unknown as Record<string, unknown>, row as unknown as Record<string, unknown>, existing.cycleId);
  res.json(row);
});

router.post("/dept-scorecards/:id/transition", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(deptScorecardsTable).where(eq(deptScorecardsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const parsed = TransitionDeptScorecardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const allowed = DEPT_SC_TRANSITIONS[existing.status];
  if (!allowed || !allowed[parsed.data.action]) {
    res.status(400).json({ error: `Cannot ${parsed.data.action} from ${existing.status}` });
    return;
  }

  if (parsed.data.action === "submit") {
    const kpis = await db.select().from(deptScorecardKpisTable).where(eq(deptScorecardKpisTable.deptScorecardId, id));
    if (kpis.length === 0) { res.status(400).json({ error: "Cannot submit scorecard with no KPIs" }); return; }
    // Note: KPI weighting validation intentionally removed here — weighting is
    // managed at IPMS (individual) level, not on OPMS scorecards.
  }

  const newStatus = allowed[parsed.data.action];
  const updates: Record<string, unknown> = { status: newStatus, updatedAt: new Date() };
  if (parsed.data.action === "approve") {
    updates.approvedById = req.user!.id;
    updates.approvedAt = new Date();
    updates.approvalComments = parsed.data.comments || null;
  }
  const [row] = await db.update(deptScorecardsTable).set(updates).where(eq(deptScorecardsTable.id, id)).returning();
  await logAudit(req, `transition:${parsed.data.action}`, "dept_scorecard", id, { status: existing.status }, { status: newStatus }, existing.cycleId);
  res.json(row);
});

router.post("/dept-scorecards/:id/inherit-kpis", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [deptSc] = await db.select().from(deptScorecardsTable).where(eq(deptScorecardsTable.id, id));
  if (!deptSc) { res.status(404).json({ error: "Not found" }); return; }
  if (!deptSc.parentScorecardId) { res.status(400).json({ error: "No parent scorecard linked" }); return; }

  const orgKpis = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.scorecardId, deptSc.parentScorecardId));
  const results = [];
  for (const kpi of orgKpis) {
    const [row] = await db.insert(deptScorecardKpisTable).values({
      deptScorecardId: id,
      parentKpiId: kpi.id,
      kpiNumber: kpi.kpiNumber,
      description: kpi.description,
      strategicObjective: kpi.strategicObjective,
      baseline: kpi.baseline,
      annualTarget: kpi.annualTarget,
      annualBudgetTarget: kpi.annualBudgetTarget,
      weighting: kpi.weighting,
      unitOfMeasureId: kpi.unitOfMeasureId,
      isCumulative: kpi.isCumulative,
      isInherited: true,
      sortOrder: kpi.sortOrder,
    }).returning();
    results.push(row);
  }
  await logAudit(req, "inherit-kpis", "dept_scorecard", id, null, { count: results.length } as unknown as Record<string, unknown>, deptSc.cycleId);
  res.json(results);
});

router.get("/dept-scorecards/:deptScorecardId/kpis", async (req: AuthenticatedRequest, res) => {
  const deptScorecardId = Number(req.params.deptScorecardId);
  const rows = await db.select().from(deptScorecardKpisTable).where(eq(deptScorecardKpisTable.deptScorecardId, deptScorecardId));
  res.json(rows);
});

router.post("/dept-scorecards/:deptScorecardId/kpis", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const deptScorecardId = Number(req.params.deptScorecardId);
  const [deptSc] = await db.select().from(deptScorecardsTable).where(eq(deptScorecardsTable.id, deptScorecardId));
  if (!deptSc) { res.status(404).json({ error: "Scorecard not found" }); return; }
  const parsed = CreateDeptScorecardKpiBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  // New (own) KPIs always go to the end; their number is assigned by the
  // renumbering pass below (e.g. "BSD-3"), regardless of what was submitted.
  const existing = await db.select({ sortOrder: deptScorecardKpisTable.sortOrder })
    .from(deptScorecardKpisTable)
    .where(eq(deptScorecardKpisTable.deptScorecardId, deptScorecardId));
  const nextIndex = existing.length === 0 ? 0 : Math.max(existing.length, ...existing.map((k) => k.sortOrder + 1));
  let [row] = await db.insert(deptScorecardKpisTable).values({
    ...parsed.data,
    kpiNumber: parsed.data.kpiNumber || "?",
    deptScorecardId,
    sortOrder: nextIndex,
  }).returning();
  await renumberDeptKpis(deptScorecardId);
  const [fresh] = await db.select().from(deptScorecardKpisTable).where(eq(deptScorecardKpisTable.id, row.id));
  if (fresh) row = fresh;
  await logAudit(req, "create", "dept_scorecard_kpi", row.id, null, row as unknown as Record<string, unknown>);
  res.status(201).json(row);
});

router.patch("/dept-kpis/:id", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(deptScorecardKpisTable).where(eq(deptScorecardKpisTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const parsed = UpdateDeptKpiBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (updates.customFields == null) delete updates.customFields;
  // KPI numbers are managed automatically (inherited: org number; own: PREFIX-N).
  delete updates.kpiNumber;
  const [row] = await db.update(deptScorecardKpisTable).set(updates).where(eq(deptScorecardKpisTable.id, id)).returning();
  await logAudit(req, "update", "dept_scorecard_kpi", id, existing as unknown as Record<string, unknown>, row as unknown as Record<string, unknown>);
  res.json(row);
});

router.delete("/dept-kpis/:id", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(deptScorecardKpisTable).where(eq(deptScorecardKpisTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.isInherited) { res.status(400).json({ error: "Cannot delete inherited KPIs" }); return; }
  await db.delete(deptScorecardKpisTable).where(eq(deptScorecardKpisTable.id, id));
  await renumberDeptKpis(existing.deptScorecardId);
  await logAudit(req, "delete", "dept_scorecard_kpi", id, existing as unknown as Record<string, unknown>);
  res.status(204).send();
});

export default router;
