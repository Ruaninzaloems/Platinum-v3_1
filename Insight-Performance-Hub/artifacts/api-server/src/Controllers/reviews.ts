import { Router } from "express";
import { db } from "@workspace/db";
import { kpiReviewSubmissionsTable, kpiQuarterActualsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../Middleware/auth";
import { logAudit } from "../Middleware/audit";
import { CreateReviewBody } from "@workspace/api-zod";

const router = Router();

router.get("/reviews", async (req: AuthenticatedRequest, res) => {
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
  const kpiId = req.query.kpiId ? Number(req.query.kpiId) : undefined;
  let rows = await db.select().from(kpiReviewSubmissionsTable);
  if (quarter) rows = rows.filter(r => r.quarter === quarter);
  if (kpiId) rows = rows.filter(r => r.kpiId === kpiId);
  res.json(rows);
});

router.post("/reviews", requirePermission("review.submit", "*"), async (req: AuthenticatedRequest, res) => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  if (parsed.data.action === "return" && !parsed.data.returnReason) {
    res.status(400).json({ error: "Return reason is mandatory when returning a submission" });
    return;
  }

  const [actual] = await db.select().from(kpiQuarterActualsTable).where(eq(kpiQuarterActualsTable.id, parsed.data.actualId));
  if (!actual) { res.status(404).json({ error: "Actual submission not found" }); return; }

  const [row] = await db.insert(kpiReviewSubmissionsTable).values({
    actualId: parsed.data.actualId,
    kpiId: parsed.data.kpiId,
    quarter: parsed.data.quarter,
    reviewerUserId: req.user!.id,
    action: parsed.data.action,
    comments: parsed.data.comments || null,
    returnReason: parsed.data.returnReason || null,
    assessmentRating: parsed.data.assessmentRating ?? null,
  }).returning();

  const newActualStatus = parsed.data.action === "approve" ? "Reviewed" : parsed.data.action === "return" ? "Returned" : actual.status;
  if (newActualStatus !== actual.status) {
    await db.update(kpiQuarterActualsTable).set({ status: newActualStatus, updatedAt: new Date() }).where(eq(kpiQuarterActualsTable.id, actual.id));
  }

  await logAudit(req, `review:${parsed.data.action}`, "kpi_review", row.id, null, row as unknown as Record<string, unknown>);
  res.status(201).json(row);
});

export default router;
