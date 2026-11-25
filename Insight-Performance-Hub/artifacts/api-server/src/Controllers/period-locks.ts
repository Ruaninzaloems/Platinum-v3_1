import { Router } from "express";
import { db } from "@workspace/db";
import { periodLocksTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../Middleware/auth";
import { logAudit } from "../Middleware/audit";
import { LockPeriodBody, UnlockPeriodBody } from "@workspace/api-zod";

const router = Router();

router.get("/period-locks", async (req: AuthenticatedRequest, res) => {
  const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
  let rows = await db.select().from(periodLocksTable);
  if (cycleId) rows = rows.filter(r => r.cycleId === cycleId);
  res.json(rows);
});

router.post("/period-locks/lock", requirePermission("period.lock", "*"), async (req: AuthenticatedRequest, res) => {
  const parsed = LockPeriodBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  const [row] = await db.insert(periodLocksTable).values({
    cycleId: parsed.data.cycleId,
    quarter: parsed.data.quarter ?? null,
    periodType: parsed.data.periodType,
    isLocked: true,
    lockedById: req.user!.id,
    lockedAt: new Date(),
    lockComments: parsed.data.lockComments || null,
  }).returning();

  await logAudit(req, "lock", "period_lock", row.id, null, row as unknown as Record<string, unknown>, parsed.data.cycleId);
  res.json(row);
});

router.post("/period-locks/:id/unlock", requirePermission("period.lock", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(periodLocksTable).where(eq(periodLocksTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (!existing.isLocked) { res.status(400).json({ error: "Period is not locked" }); return; }

  const parsed = UnlockPeriodBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  const [row] = await db.update(periodLocksTable).set({
    isLocked: false,
    reopenedById: req.user!.id,
    reopenedAt: new Date(),
    reopenReason: parsed.data.reopenReason,
    updatedAt: new Date(),
  }).where(eq(periodLocksTable.id, id)).returning();

  await logAudit(req, "unlock", "period_lock", id, { isLocked: true } as unknown as Record<string, unknown>, { isLocked: false, reopenReason: parsed.data.reopenReason } as unknown as Record<string, unknown>, existing.cycleId);
  res.json(row);
});

export default router;
