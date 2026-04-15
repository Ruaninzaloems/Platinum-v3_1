import { Router } from "express";
import { db } from "@workspace/db";
import { scorecardsTable, scorecardKpisTable, kpiQuarterTargetsTable, sdbipRevisionLogsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../middleware/auth";
import { logAudit } from "../middleware/audit";
import {
  CreateScorecardBody,
  UpdateScorecardBody,
  TransitionScorecardBody,
  CreateScorecardKpiBody,
  UpdateScorecardKpiBody,
  UpsertQuarterTargetsBody,
} from "@workspace/api-zod";

const router = Router();

const SCORECARD_TRANSITIONS: Record<string, string[]> = {
  Draft: ["submit"],
  Submitted: ["review", "return"],
  Reviewed: ["approve", "return"],
  Approved: ["reopen"],
};

const SCORECARD_ACTION_TO_STATUS: Record<string, string> = {
  submit: "Submitted",
  review: "Reviewed",
  return: "Draft",
  approve: "Approved",
  reopen: "Draft",
};

const KPI_TRANSITIONS: Record<string, string[]> = {
  Draft: ["submit"],
  Submitted: ["review", "return"],
  Reviewed: ["approve", "return"],
  Approved: ["reopen"],
};

const KPI_ACTION_TO_STATUS: Record<string, string> = {
  submit: "Submitted",
  review: "Reviewed",
  return: "Draft",
  approve: "Approved",
  reopen: "Draft",
};

router.get("/scorecards", async (req: AuthenticatedRequest, res) => {
  const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
  const rows = cycleId
    ? await db.select().from(scorecardsTable).where(eq(scorecardsTable.cycleId, cycleId))
    : await db.select().from(scorecardsTable);
  res.json(rows);
});

router.get("/scorecards/:id", async (req: AuthenticatedRequest, res) => {
  const [row] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, Number(req.params.id)));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.post("/scorecards", requirePermission("scorecard.create", "*"), async (req: AuthenticatedRequest, res) => {
  const parsed = CreateScorecardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.insert(scorecardsTable).values({
    ...parsed.data,
    createdById: req.user!.id,
  }).returning();
  await logAudit(req, "create", "scorecard", row.id, null, row as unknown as Record<string, unknown>, parsed.data.cycleId);
  res.status(201).json(row);
});

router.patch("/scorecards/:id", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.status === "Approved") { res.status(400).json({ error: "Approved scorecards are read-only" }); return; }
  const parsed = UpdateScorecardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.update(scorecardsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(scorecardsTable.id, id)).returning();
  await logAudit(req, "update", "scorecard", id, existing as unknown as Record<string, unknown>, row as unknown as Record<string, unknown>, existing.cycleId);
  res.json(row);
});

router.post("/scorecards/:id/transition", requirePermission("scorecard.approve", "scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const parsed = TransitionScorecardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const allowed = SCORECARD_TRANSITIONS[existing.status] || [];
  if (!allowed.includes(parsed.data.action)) {
    res.status(400).json({ error: `Cannot '${parsed.data.action}' from status '${existing.status}'. Allowed: ${allowed.join(", ")}` });
    return;
  }
  if (parsed.data.action === "submit") {
    const kpis = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.scorecardId, id));
    if (kpis.length === 0) {
      res.status(400).json({ error: "Cannot submit a scorecard with no KPIs" });
      return;
    }
    const totalWeighting = kpis.reduce((sum, k) => sum + (k.weighting ?? 0), 0);
    if (Math.abs(totalWeighting - 100) > 0.01) {
      res.status(400).json({ error: `KPI weightings must total 100%. Current total: ${totalWeighting.toFixed(1)}%` });
      return;
    }
  }
  const newStatus = SCORECARD_ACTION_TO_STATUS[parsed.data.action];
  const updates: Record<string, unknown> = { status: newStatus, updatedAt: new Date() };
  if (parsed.data.action === "approve") {
    updates.approvedById = req.user!.id;
    updates.approvedAt = new Date();
    updates.approvalComments = parsed.data.comments || null;

    const kpis = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.scorecardId, id));
    const unapprovedKpis = kpis.filter(k => k.status !== "Approved");
    if (unapprovedKpis.length > 0) {
      res.status(400).json({ error: `All KPIs must be approved before approving scorecard. ${unapprovedKpis.length} KPI(s) not yet approved.` });
      return;
    }
    for (const kpi of kpis) {
      const targets = await db.select().from(kpiQuarterTargetsTable).where(eq(kpiQuarterTargetsTable.kpiId, kpi.id));
      for (const t of targets) {
        await db.update(kpiQuarterTargetsTable).set({
          isApprovedBaseline: true,
          baselineTargetValue: t.targetValue,
          baselineBudgetValue: t.budgetValue,
        }).where(eq(kpiQuarterTargetsTable.id, t.id));
      }
    }
  }
  const [row] = await db.update(scorecardsTable).set(updates).where(eq(scorecardsTable.id, id)).returning();
  await logAudit(req, `transition:${parsed.data.action}`, "scorecard", id, { status: existing.status }, { status: newStatus }, existing.cycleId);
  res.json(row);
});

router.get("/scorecards/:scorecardId/kpis", async (req: AuthenticatedRequest, res) => {
  const scorecardId = Number(req.params.scorecardId);
  const rows = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.scorecardId, scorecardId));
  res.json(rows);
});

router.post("/scorecards/:scorecardId/kpis", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const scorecardId = Number(req.params.scorecardId);
  const [scorecard] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, scorecardId));
  if (!scorecard) { res.status(404).json({ error: "Scorecard not found" }); return; }
  if (scorecard.status === "Approved") { res.status(400).json({ error: "Cannot add KPIs to approved scorecard" }); return; }
  const parsed = CreateScorecardKpiBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.insert(scorecardKpisTable).values({
    ...parsed.data,
    scorecardId,
  }).returning();
  await logAudit(req, "create", "scorecard_kpi", row.id, null, row as unknown as Record<string, unknown>, scorecard.cycleId);
  res.status(201).json(row);
});

router.get("/scorecard-kpis/:id", async (req: AuthenticatedRequest, res) => {
  const [row] = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.id, Number(req.params.id)));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.patch("/scorecard-kpis/:id", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.status === "Approved") { res.status(400).json({ error: "Approved KPIs are read-only" }); return; }
  const parsed = UpdateScorecardKpiBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.update(scorecardKpisTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(scorecardKpisTable.id, id)).returning();
  await logAudit(req, "update", "scorecard_kpi", id, existing as unknown as Record<string, unknown>, row as unknown as Record<string, unknown>);
  res.json(row);
});

router.delete("/scorecard-kpis/:id", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.status !== "Draft") { res.status(400).json({ error: "Only draft KPIs can be deleted" }); return; }
  await db.delete(scorecardKpisTable).where(eq(scorecardKpisTable.id, id));
  await logAudit(req, "delete", "scorecard_kpi", id, existing as unknown as Record<string, unknown>);
  res.status(204).send();
});

router.post("/scorecard-kpis/:id/transition", requirePermission("scorecard.approve", "scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const parsed = TransitionScorecardBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const allowed = KPI_TRANSITIONS[existing.status] || [];
  if (!allowed.includes(parsed.data.action)) {
    res.status(400).json({ error: `Cannot '${parsed.data.action}' from status '${existing.status}'. Allowed: ${allowed.join(", ")}` });
    return;
  }
  const newStatus = KPI_ACTION_TO_STATUS[parsed.data.action];
  const [row] = await db.update(scorecardKpisTable).set({ status: newStatus, updatedAt: new Date() }).where(eq(scorecardKpisTable.id, id)).returning();
  await logAudit(req, `transition:${parsed.data.action}`, "scorecard_kpi", id, { status: existing.status }, { status: newStatus });
  res.json(row);
});

router.get("/scorecard-kpis/:kpiId/quarter-targets", async (req: AuthenticatedRequest, res) => {
  const kpiId = Number(req.params.kpiId);
  const rows = await db.select().from(kpiQuarterTargetsTable).where(eq(kpiQuarterTargetsTable.kpiId, kpiId));
  res.json(rows);
});

router.put("/scorecard-kpis/:kpiId/quarter-targets", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const kpiId = Number(req.params.kpiId);
  const [kpi] = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.id, kpiId));
  if (!kpi) { res.status(404).json({ error: "KPI not found" }); return; }

  const parsed = UpsertQuarterTargetsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  if (kpi.isCumulative && parsed.data.targets.length > 1) {
    const sorted = [...parsed.data.targets].sort((a, b) => a.quarter - b.quarter);
    for (let i = 1; i < sorted.length; i++) {
      const prev = parseFloat(sorted[i - 1].targetValue);
      const curr = parseFloat(sorted[i].targetValue);
      if (!isNaN(prev) && !isNaN(curr) && curr < prev) {
        res.status(400).json({
          error: `Cumulative KPI: Q${sorted[i].quarter} target (${curr}) cannot be less than Q${sorted[i - 1].quarter} target (${prev})`
        });
        return;
      }
    }
  }

  const existingTargets = await db.select().from(kpiQuarterTargetsTable).where(eq(kpiQuarterTargetsTable.kpiId, kpiId));
  const existingByQuarter = new Map(existingTargets.map(t => [t.quarter, t]));

  const results = [];
  for (const target of parsed.data.targets) {
    const existing = existingByQuarter.get(target.quarter);
    if (existing) {
      if (existing.isApprovedBaseline && !target.revisionReason) {
        res.status(400).json({ error: `Revision reason required for approved Q${target.quarter} target` });
        return;
      }
      const updates: Record<string, unknown> = {
        targetValue: target.targetValue,
        budgetValue: target.budgetValue,
        evidenceExpected: target.evidenceExpected,
        updatedAt: new Date(),
      };
      if (existing.isApprovedBaseline) {
        updates.revisionReason = target.revisionReason;
        updates.revisedAt = new Date();
        updates.revisedById = req.user!.id;
      }
      const [row] = await db.update(kpiQuarterTargetsTable).set(updates).where(eq(kpiQuarterTargetsTable.id, existing.id)).returning();
      results.push(row);
    } else {
      const [row] = await db.insert(kpiQuarterTargetsTable).values({
        kpiId,
        quarter: target.quarter,
        targetValue: target.targetValue,
        budgetValue: target.budgetValue,
        evidenceExpected: target.evidenceExpected,
      }).returning();
      results.push(row);
    }
  }
  await logAudit(req, "upsert", "kpi_quarter_targets", kpiId, null, { targets: results } as unknown as Record<string, unknown>);
  res.json(results);
});

const VALID_REVISION_TYPES = [
  "scorecard_reopened", "kpi_added", "kpi_deleted", "target_revised",
  "annual_target_revised", "kpi_updated", "revision_submitted",
  "revision_reviewed", "revision_approved",
] as const;

router.get("/scorecards/:scorecardId/revision-logs", requirePermission("scorecard.view", "*"), async (req: AuthenticatedRequest, res) => {
  const scorecardId = Number(req.params.scorecardId);
  const [scorecard] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, scorecardId));
  if (!scorecard) { res.status(404).json({ error: "Scorecard not found" }); return; }
  const rows = await db.select().from(sdbipRevisionLogsTable)
    .where(eq(sdbipRevisionLogsTable.scorecardId, scorecardId))
    .orderBy(desc(sdbipRevisionLogsTable.createdAt));
  res.json(rows);
});

router.post("/scorecards/:scorecardId/revision-logs", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const scorecardId = Number(req.params.scorecardId);
  const [scorecard] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, scorecardId));
  if (!scorecard) { res.status(404).json({ error: "Scorecard not found" }); return; }

  const entries = req.body.entries;
  if (!Array.isArray(entries) || entries.length === 0) {
    res.status(400).json({ error: "entries array required" });
    return;
  }

  for (const entry of entries) {
    if (!entry.revisionType || !VALID_REVISION_TYPES.includes(entry.revisionType)) {
      res.status(400).json({ error: `Invalid revisionType: ${entry.revisionType}` });
      return;
    }
    if (entry.quarter !== undefined && entry.quarter !== null && (entry.quarter < 1 || entry.quarter > 4)) {
      res.status(400).json({ error: `quarter must be 1-4, got ${entry.quarter}` });
      return;
    }
    if (entry.kpiId) {
      const [kpi] = await db.select().from(scorecardKpisTable)
        .where(and(eq(scorecardKpisTable.id, entry.kpiId), eq(scorecardKpisTable.scorecardId, scorecardId)));
      if (!kpi) {
        res.status(400).json({ error: `KPI ${entry.kpiId} does not belong to scorecard ${scorecardId}` });
        return;
      }
    }
  }

  const results = await db.transaction(async (tx) => {
    const rows = [];
    for (const entry of entries) {
      const [row] = await tx.insert(sdbipRevisionLogsTable).values({
        scorecardId,
        kpiId: entry.kpiId || null,
        revisionType: entry.revisionType,
        fieldName: entry.fieldName || null,
        oldValue: entry.oldValue || null,
        newValue: entry.newValue || null,
        revisionReason: entry.revisionReason || null,
        quarter: entry.quarter || null,
        userId: req.user!.id,
        userName: req.user!.displayName,
      }).returning();
      rows.push(row);
    }
    return rows;
  });

  res.status(201).json(results);
});

export default router;
