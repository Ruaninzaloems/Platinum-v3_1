import { Router } from "express";
import { db } from "@workspace/db";
import { kpiModerationOutcomesTable, kpiQuarterActualsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../Middleware/auth";
import { logAudit } from "../Middleware/audit";
import { CreateModerationBody } from "@workspace/api-zod";

const router = Router();

router.get("/moderation", async (req: AuthenticatedRequest, res) => {
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
  const kpiId = req.query.kpiId ? Number(req.query.kpiId) : undefined;
  let rows = await db.select().from(kpiModerationOutcomesTable);
  if (quarter) rows = rows.filter(r => r.quarter === quarter);
  if (kpiId) rows = rows.filter(r => r.kpiId === kpiId);
  res.json(rows);
});

router.post("/moderation", requirePermission("moderation.submit", "*"), async (req: AuthenticatedRequest, res) => {
  const parsed = CreateModerationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  const [actual] = await db.select().from(kpiQuarterActualsTable).where(eq(kpiQuarterActualsTable.id, parsed.data.actualId));
  if (!actual) { res.status(404).json({ error: "Actual submission not found" }); return; }

  const [row] = await db.insert(kpiModerationOutcomesTable).values({
    actualId: parsed.data.actualId,
    kpiId: parsed.data.kpiId,
    quarter: parsed.data.quarter,
    moderatorUserId: req.user!.id,
    outcome: parsed.data.outcome,
    scoreAdjustmentReason: parsed.data.scoreAdjustmentReason || null,
    adjustedScore: parsed.data.adjustedScore ?? null,
    notes: parsed.data.notes || null,
  }).returning();

  await db.update(kpiQuarterActualsTable).set({ status: "Moderated", updatedAt: new Date() }).where(eq(kpiQuarterActualsTable.id, actual.id));

  await logAudit(req, "moderation:record", "kpi_moderation", row.id, null, row as unknown as Record<string, unknown>);
  res.status(201).json(row);
});

export default router;
