import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { kpiRatingThresholdsTable } from "@workspace/db/schema";
import { SaveKpiRatingThresholdsBody } from "@workspace/api-zod";
import { requirePermission } from "../Middleware/auth";
import type { AuthenticatedRequest } from "../Middleware/auth";
import { logAudit } from "../Middleware/audit";

const router: IRouter = Router();

const DEFAULTS = [
  { level: 5, label: "Outstanding", descriptor: "Far exceeds expectations", minPct: 151, maxPct: null as number | null },
  { level: 4, label: "Exceeds Expectations", descriptor: "Above target", minPct: 111, maxPct: 150 },
  { level: 3, label: "Fully Effective", descriptor: "On target", minPct: 100, maxPct: 110 },
  { level: 2, label: "Partially Effective", descriptor: "Below target", minPct: 50, maxPct: 99 },
  { level: 1, label: "Not Effective", descriptor: "Far below target", minPct: null as number | null, maxPct: 49 },
];

function sortDesc<T extends { level: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => b.level - a.level);
}

async function ensureSeeded() {
  const existing = await db.select().from(kpiRatingThresholdsTable);
  if (existing.length > 0) return existing;
  return db.insert(kpiRatingThresholdsTable).values(DEFAULTS).returning();
}

router.get("/kpi-rating-thresholds", async (_req, res, next) => {
  try {
    const rows = await ensureSeeded();
    res.json(sortDesc(rows));
  } catch (err) { next(err); }
});

router.put("/kpi-rating-thresholds", requirePermission("config.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = SaveKpiRatingThresholdsBody.parse(req.body);
    const seen = new Set<number>();
    for (const t of body.thresholds) {
      if (seen.has(t.level)) {
        res.status(400).json({ error: `Duplicate rating level ${t.level}` });
        return;
      }
      seen.add(t.level);
      const min = t.minPct ?? null;
      const max = t.maxPct ?? null;
      if (min !== null && max !== null && min > max) {
        res.status(400).json({ error: `Level ${t.level}: Min (%) cannot exceed Max (%)` });
        return;
      }
    }
    const rows = await db.transaction(async (tx) => {
      const before = await tx.select().from(kpiRatingThresholdsTable);
      await tx.delete(kpiRatingThresholdsTable);
      const inserted = await tx.insert(kpiRatingThresholdsTable).values(
        body.thresholds.map((t) => ({
          level: t.level,
          label: t.label,
          descriptor: t.descriptor ?? "",
          minPct: t.minPct ?? null,
          maxPct: t.maxPct ?? null,
        })),
      ).returning();
      return { before, inserted };
    });
    await logAudit(req, "update", "kpi_rating_threshold", 0,
      { thresholds: rows.before } as unknown as Record<string, unknown>,
      { thresholds: rows.inserted } as unknown as Record<string, unknown>);
    res.json(sortDesc(rows.inserted));
  } catch (err) { next(err); }
});

router.post("/kpi-rating-thresholds/reset", requirePermission("config.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const rows = await db.transaction(async (tx) => {
      const before = await tx.select().from(kpiRatingThresholdsTable);
      await tx.delete(kpiRatingThresholdsTable);
      const inserted = await tx.insert(kpiRatingThresholdsTable).values(DEFAULTS).returning();
      return { before, inserted };
    });
    await logAudit(req, "update", "kpi_rating_threshold", 0,
      { thresholds: rows.before } as unknown as Record<string, unknown>,
      { thresholds: rows.inserted } as unknown as Record<string, unknown>);
    res.json(sortDesc(rows.inserted));
  } catch (err) { next(err); }
});

export default router;
