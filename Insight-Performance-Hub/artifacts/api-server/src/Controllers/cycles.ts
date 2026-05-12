import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  performanceCyclesTable,
  scorecardsTable,
  scorecardKpisTable,
  kpiQuarterTargetsTable,
  kpiMonthActivitiesTable,
  kpiQuarterActualsTable,
  kpiEvidenceDocumentsTable,
  kpiVariancesTable,
  remedialActionPlansTable,
  constraintRegisterTable,
  sdbipItemsTable,
  sdbipRevisionsTable,
  deptScorecardsTable,
  deptScorecardKpisTable,
  kpiReviewSubmissionsTable,
  kpiModerationOutcomesTable,
  periodLocksTable,
  reportRunsTable,
} from "@workspace/db/schema";
import { eq, and, lte, gte, ne, inArray } from "drizzle-orm";
import { CreateCycleBody, UpdateCycleBody, UpdateCycleParams } from "@workspace/api-zod";
import { requirePermission } from "../Middleware/auth";
import type { AuthenticatedRequest } from "../Middleware/auth";
import { logAudit } from "../Middleware/audit";

const router: IRouter = Router();

function formatCycle(c: typeof performanceCyclesTable.$inferSelect) {
  return {
    id: c.id,
    financialYearLabel: c.financialYearLabel,
    startDate: c.startDate,
    endDate: c.endDate,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function toDateStr(d: Date | string): string {
  return d instanceof Date ? d.toISOString().split("T")[0] : d;
}

async function checkDateOverlap(startDate: string, endDate: string, excludeId?: number): Promise<string | null> {
  const conditions = [
    lte(performanceCyclesTable.startDate, endDate),
    gte(performanceCyclesTable.endDate, startDate),
  ];
  if (excludeId) {
    conditions.push(ne(performanceCyclesTable.id, excludeId));
  }
  const overlapping = await db.select().from(performanceCyclesTable).where(and(...conditions));
  if (overlapping.length > 0) {
    return `Date range overlaps with existing cycle: ${overlapping[0].financialYearLabel}`;
  }
  return null;
}

router.get("/cycles", async (_req, res, next) => {
  try {
    const cycles = await db.select().from(performanceCyclesTable);
    res.json(cycles.map(formatCycle));
  } catch (err) { next(err); }
});

router.post("/cycles", requirePermission("cycles.create", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = CreateCycleBody.parse(req.body);
    const startStr = toDateStr(body.startDate);
    const endStr = toDateStr(body.endDate);
    const overlap = await checkDateOverlap(startStr, endStr);
    if (overlap) {
      res.status(400).json({ error: overlap });
      return;
    }
    const [cycle] = await db.insert(performanceCyclesTable).values({
      financialYearLabel: body.financialYearLabel,
      startDate: startStr,
      endDate: endStr,
      status: body.status || "Draft",
    }).returning();
    await logAudit(req, "create", "performance_cycle", cycle.id, null, formatCycle(cycle));
    res.status(201).json(formatCycle(cycle));
  } catch (err) { next(err); }
});

router.get("/cycles/:id", async (req, res, next) => {
  try {
    const { id } = UpdateCycleParams.parse(req.params);
    const [cycle] = await db.select().from(performanceCyclesTable).where(eq(performanceCyclesTable.id, id));
    if (!cycle) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatCycle(cycle));
  } catch (err) { next(err); }
});

router.patch("/cycles/:id", requirePermission("cycles.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = UpdateCycleParams.parse(req.params);
    const body = UpdateCycleBody.parse(req.body);
    const [existing] = await db.select().from(performanceCyclesTable).where(eq(performanceCyclesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.status === "Closed" || existing.status === "Archived") {
      const onlyStatusChange = Object.keys(body).length === 1 && body.status !== undefined;
      const archivingClosed = existing.status === "Closed" && body.status === "Archived" && onlyStatusChange;
      if (!archivingClosed) {
        res.status(400).json({ error: "Closed/archived cycles are read-only. Only archiving a closed cycle is permitted." });
        return;
      }
    }
    const newStart = body.startDate ? toDateStr(body.startDate) : existing.startDate;
    const newEnd = body.endDate ? toDateStr(body.endDate) : existing.endDate;
    if (body.startDate || body.endDate) {
      const overlap = await checkDateOverlap(newStart, newEnd, id);
      if (overlap) { res.status(400).json({ error: overlap }); return; }
    }
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.financialYearLabel !== undefined) updates.financialYearLabel = body.financialYearLabel;
    if (body.startDate !== undefined) updates.startDate = toDateStr(body.startDate);
    if (body.endDate !== undefined) updates.endDate = toDateStr(body.endDate);
    if (body.status !== undefined) updates.status = body.status;
    const [cycle] = await db.update(performanceCyclesTable).set(updates).where(eq(performanceCyclesTable.id, id)).returning();
    await logAudit(req, "update", "performance_cycle", cycle.id, formatCycle(existing), formatCycle(cycle));
    res.json(formatCycle(cycle));
  } catch (err) { next(err); }
});

router.delete("/cycles/:id", requirePermission("cycles.delete", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = UpdateCycleParams.parse(req.params);
    const [cycle] = await db.select().from(performanceCyclesTable).where(eq(performanceCyclesTable.id, id));
    if (!cycle) { res.status(404).json({ error: "Not found" }); return; }
    if (cycle.status !== "Draft") {
      res.status(400).json({ error: "Only Draft cycles can be deleted." });
      return;
    }

    const scorecardRows = await db.select({ id: scorecardsTable.id }).from(scorecardsTable).where(eq(scorecardsTable.cycleId, id));
    const scorecardIds = scorecardRows.map(r => r.id);

    const kpiRows = scorecardIds.length
      ? await db.select({ id: scorecardKpisTable.id }).from(scorecardKpisTable).where(inArray(scorecardKpisTable.scorecardId, scorecardIds))
      : [];
    const kpiIds = kpiRows.map(r => r.id);

    const actualRows = kpiIds.length
      ? await db.select({ id: kpiQuarterActualsTable.id }).from(kpiQuarterActualsTable).where(inArray(kpiQuarterActualsTable.kpiId, kpiIds))
      : [];
    const actualIds = actualRows.map(r => r.id);

    const deptScorecardRows = await db.select({ id: deptScorecardsTable.id }).from(deptScorecardsTable).where(eq(deptScorecardsTable.cycleId, id));
    const deptScorecardIds = deptScorecardRows.map(r => r.id);

    const sdbipItemRows = await db.select({ id: sdbipItemsTable.id }).from(sdbipItemsTable).where(eq(sdbipItemsTable.cycleId, id));
    const sdbipItemIds = sdbipItemRows.map(r => r.id);

    if (actualIds.length) {
      await db.delete(kpiReviewSubmissionsTable).where(inArray(kpiReviewSubmissionsTable.actualId, actualIds));
      await db.delete(kpiModerationOutcomesTable).where(inArray(kpiModerationOutcomesTable.actualId, actualIds));
    }
    if (kpiIds.length) {
      await db.delete(kpiQuarterActualsTable).where(inArray(kpiQuarterActualsTable.kpiId, kpiIds));
      await db.delete(remedialActionPlansTable).where(inArray(remedialActionPlansTable.kpiId, kpiIds));
      await db.delete(kpiEvidenceDocumentsTable).where(inArray(kpiEvidenceDocumentsTable.kpiId, kpiIds));
      await db.delete(kpiVariancesTable).where(inArray(kpiVariancesTable.kpiId, kpiIds));
      await db.delete(constraintRegisterTable).where(inArray(constraintRegisterTable.kpiId, kpiIds));
      await db.delete(kpiQuarterTargetsTable).where(inArray(kpiQuarterTargetsTable.kpiId, kpiIds));
      await db.delete(kpiMonthActivitiesTable).where(inArray(kpiMonthActivitiesTable.kpiId, kpiIds));
    }
    if (deptScorecardIds.length) {
      await db.delete(deptScorecardKpisTable).where(inArray(deptScorecardKpisTable.deptScorecardId, deptScorecardIds));
    }
    if (scorecardIds.length) {
      await db.delete(scorecardKpisTable).where(inArray(scorecardKpisTable.scorecardId, scorecardIds));
      await db.delete(scorecardsTable).where(inArray(scorecardsTable.id, scorecardIds));
    }
    if (deptScorecardIds.length) {
      await db.delete(deptScorecardsTable).where(eq(deptScorecardsTable.cycleId, id));
    }
    if (sdbipItemIds.length) {
      await db.delete(sdbipRevisionsTable).where(inArray(sdbipRevisionsTable.sdbipItemId, sdbipItemIds));
      await db.delete(sdbipItemsTable).where(eq(sdbipItemsTable.cycleId, id));
    }
    await db.delete(periodLocksTable).where(eq(periodLocksTable.cycleId, id));
    await db.delete(reportRunsTable).where(eq(reportRunsTable.cycleId, id));
    await db.delete(performanceCyclesTable).where(eq(performanceCyclesTable.id, id));

    await logAudit(req, "delete", "performance_cycle", id, formatCycle(cycle), null);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
