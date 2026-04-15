import { Router } from "express";
import { db } from "@workspace/db";
import { kpiMonthActivitiesTable, scorecardKpisTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../middleware/auth";
import { logAudit } from "../middleware/audit";
import { CreateMonthActivityBody, UpdateMonthActivityBody } from "@workspace/api-zod";

const router = Router();

router.get("/scorecard-kpis/:kpiId/month-activities", async (req: AuthenticatedRequest, res) => {
  const kpiId = Number(req.params.kpiId);
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
  const condition = quarter
    ? and(eq(kpiMonthActivitiesTable.kpiId, kpiId), eq(kpiMonthActivitiesTable.quarter, quarter))
    : eq(kpiMonthActivitiesTable.kpiId, kpiId);
  const rows = await db.select().from(kpiMonthActivitiesTable).where(condition);
  res.json(rows);
});

router.post("/scorecard-kpis/:kpiId/month-activities", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const kpiId = Number(req.params.kpiId);
  const [kpi] = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.id, kpiId));
  if (!kpi) { res.status(404).json({ error: "KPI not found" }); return; }
  const parsed = CreateMonthActivityBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.insert(kpiMonthActivitiesTable).values({
    ...parsed.data,
    kpiId,
  }).returning();
  await logAudit(req, "create", "kpi_month_activity", row.id, null, row as unknown as Record<string, unknown>);
  res.status(201).json(row);
});

router.patch("/month-activities/:id", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(kpiMonthActivitiesTable).where(eq(kpiMonthActivitiesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const parsed = UpdateMonthActivityBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.status === "Completed") {
    updates.completedAt = new Date();
  }
  const [row] = await db.update(kpiMonthActivitiesTable).set(updates).where(eq(kpiMonthActivitiesTable.id, id)).returning();
  await logAudit(req, "update", "kpi_month_activity", id, existing as unknown as Record<string, unknown>, row as unknown as Record<string, unknown>);
  res.json(row);
});

router.delete("/month-activities/:id", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(kpiMonthActivitiesTable).where(eq(kpiMonthActivitiesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  await db.delete(kpiMonthActivitiesTable).where(eq(kpiMonthActivitiesTable.id, id));
  await logAudit(req, "delete", "kpi_month_activity", id, existing as unknown as Record<string, unknown>);
  res.status(204).send();
});

export default router;
