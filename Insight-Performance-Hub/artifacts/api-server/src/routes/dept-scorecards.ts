import { Router } from "express";
import { db } from "@workspace/db";
import { deptScorecardsTable, deptScorecardKpisTable, scorecardKpisTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../middleware/auth";
import { logAudit } from "../middleware/audit";
import {
  CreateDeptScorecardBody,
  UpdateDeptScorecardBody,
  TransitionDeptScorecardBody,
  CreateDeptScorecardKpiBody,
  UpdateDeptKpiBody,
} from "@workspace/api-zod";

const router = Router();

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
    const totalWeight = kpis.reduce((s, k) => s + k.weighting, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      res.status(400).json({ error: `KPI weightings must total 100%. Current: ${totalWeight.toFixed(2)}%` });
      return;
    }
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
  const parsed = CreateDeptScorecardKpiBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.insert(deptScorecardKpisTable).values({
    ...parsed.data,
    deptScorecardId,
  }).returning();
  await logAudit(req, "create", "dept_scorecard_kpi", row.id, null, row as unknown as Record<string, unknown>);
  res.status(201).json(row);
});

router.patch("/dept-kpis/:id", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(deptScorecardKpisTable).where(eq(deptScorecardKpisTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const parsed = UpdateDeptKpiBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.update(deptScorecardKpisTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(deptScorecardKpisTable.id, id)).returning();
  await logAudit(req, "update", "dept_scorecard_kpi", id, existing as unknown as Record<string, unknown>, row as unknown as Record<string, unknown>);
  res.json(row);
});

router.delete("/dept-kpis/:id", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(deptScorecardKpisTable).where(eq(deptScorecardKpisTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.isInherited) { res.status(400).json({ error: "Cannot delete inherited KPIs" }); return; }
  await db.delete(deptScorecardKpisTable).where(eq(deptScorecardKpisTable.id, id));
  await logAudit(req, "delete", "dept_scorecard_kpi", id, existing as unknown as Record<string, unknown>);
  res.status(204).send();
});

export default router;
