import { Router } from "express";
import { db } from "@workspace/db";
import {
  kpiQuarterActualsTable, scorecardKpisTable, kpiEvidenceDocumentsTable,
  kpiVariancesTable, remedialActionPlansTable, submissionDeadlinesTable
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../middleware/auth";
import { logAudit } from "../middleware/audit";
import {
  CreateKpiActualBody, UpdateKpiActualBody,
  VerifyEvidenceBody, CreateRemedialActionBody,
  UpdateRemedialActionBody, UploadKpiEvidenceBody
} from "@workspace/api-zod";

const router = Router();

router.get("/kpi-actuals", async (req: AuthenticatedRequest, res) => {
  const { status, reviewLevel, cycleId } = req.query;
  const conditions = [];
  if (status) conditions.push(eq(kpiQuarterActualsTable.status, status as string));
  if (reviewLevel) conditions.push(eq(kpiQuarterActualsTable.reviewLevel, reviewLevel as string));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = where
    ? await db.select().from(kpiQuarterActualsTable).where(where)
    : await db.select().from(kpiQuarterActualsTable);
  res.json(rows);
});

router.get("/scorecard-kpis/:kpiId/actuals", async (req: AuthenticatedRequest, res) => {
  const kpiId = Number(req.params.kpiId);
  const rows = await db.select().from(kpiQuarterActualsTable).where(eq(kpiQuarterActualsTable.kpiId, kpiId));
  res.json(rows);
});

router.post("/scorecard-kpis/:kpiId/actuals", requirePermission("actuals.submit", "*"), async (req: AuthenticatedRequest, res) => {
  const kpiId = Number(req.params.kpiId);
  const [kpi] = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.id, kpiId));
  if (!kpi) { res.status(404).json({ error: "KPI not found" }); return; }
  if (kpi.status !== "Approved") { res.status(400).json({ error: "Cannot submit actuals against unapproved KPIs" }); return; }

  const parsed = CreateKpiActualBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  let isLate = false;
  const deadlines = await db.select().from(submissionDeadlinesTable);
  const qDeadline = deadlines.find(d => d.quarter === parsed.data.quarter);
  if (qDeadline?.deadlineDate) {
    const dueDate = new Date(qDeadline.deadlineDate);
    if (new Date() > dueDate) {
      isLate = true;
      if (!parsed.data.lateOverrideReason) {
        res.status(400).json({ error: "Submission deadline has passed. Provide lateOverrideReason to override." });
        return;
      }
    }
  }

  const [row] = await db.insert(kpiQuarterActualsTable).values({
    kpiId,
    quarter: parsed.data.quarter,
    actualValue: parsed.data.actualValue,
    commentary: parsed.data.commentary,
    isAchieved: parsed.data.isAchieved,
    progressStatusId: parsed.data.progressStatusId,
    isOnHold: parsed.data.isOnHold ?? false,
    onHoldReason: parsed.data.onHoldReason,
    challengeNarrative: parsed.data.challengeNarrative,
    correctiveAction: parsed.data.correctiveAction,
    underperformanceReason: parsed.data.underperformanceReason,
    overperformanceReason: parsed.data.overperformanceReason,
    budgetImplication: parsed.data.budgetImplication,
    analysisNotes: parsed.data.analysisNotes,
    submittedById: req.user!.id,
    isLateSubmission: isLate,
    lateOverrideReason: parsed.data.lateOverrideReason,
    status: "Draft",
  }).returning();
  await logAudit(req, "create", "kpi_quarter_actual", row.id, null, row as unknown as Record<string, unknown>);
  res.status(201).json(row);
});

router.patch("/kpi-actuals/:id", requirePermission("actuals.submit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(kpiQuarterActualsTable).where(eq(kpiQuarterActualsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const parsed = UpdateKpiActualBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.update(kpiQuarterActualsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(kpiQuarterActualsTable.id, id)).returning();
  await logAudit(req, "update", "kpi_quarter_actual", id, existing as unknown as Record<string, unknown>, row as unknown as Record<string, unknown>);
  res.json(row);
});

const REVIEW_LEVELS = ["line_manager", "director", "pms_manager", "pms_director", "internal_audit"] as const;

function getNextReviewLevel(current: string | null): string | null {
  if (!current) return REVIEW_LEVELS[0];
  const idx = REVIEW_LEVELS.indexOf(current as typeof REVIEW_LEVELS[number]);
  if (idx < 0 || idx >= REVIEW_LEVELS.length - 1) return null;
  return REVIEW_LEVELS[idx + 1];
}

const REVIEW_LEVEL_PERMISSIONS: Record<string, string> = {
  line_manager: "actuals.review.line_manager",
  director: "actuals.review.director",
  pms_manager: "actuals.review.pms_manager",
  pms_director: "actuals.review.pms_director",
  internal_audit: "actuals.review.internal_audit",
};

router.post("/kpi-actuals/:id/transition", async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(kpiQuarterActualsTable).where(eq(kpiQuarterActualsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Actual not found" }); return; }

  const { action, comments, reviewLevel: requestedLevel } = req.body;
  if (!action || !["submit", "approve", "return"].includes(action)) {
    res.status(400).json({ error: "action must be submit, approve, or return" });
    return;
  }

  const userPerms = req.user?.permissions || [];
  const isAdmin = req.user?.role === "admin" || req.user?.role === "system_admin";

  if (action === "submit") {
    if (!isAdmin && !userPerms.some((p: string) => p.startsWith("actuals.submit"))) {
      res.status(403).json({ error: "Forbidden: missing actuals.submit permission" });
      return;
    }
  } else {
    const currentLevel = existing.reviewLevel;
    if (currentLevel) {
      const requiredPerm = REVIEW_LEVEL_PERMISSIONS[currentLevel];
      if (!isAdmin && requiredPerm && !userPerms.includes(requiredPerm) && !userPerms.includes("actuals.review.*")) {
        res.status(403).json({ error: `Forbidden: you are not authorized to review at the ${currentLevel} level` });
        return;
      }
    }
    if (requestedLevel && requestedLevel !== currentLevel) {
      res.status(400).json({ error: `Review level mismatch: actual is at ${currentLevel}, not ${requestedLevel}` });
      return;
    }
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (action === "submit") {
    if (existing.status !== "Draft" && existing.status !== "Returned") {
      res.status(400).json({ error: "Can only submit from Draft or Returned status" });
      return;
    }
    updates.status = "In Review";
    updates.reviewLevel = REVIEW_LEVELS[0];
    updates.reviewStatus = "Pending";
    updates.reviewComments = null;
  } else if (action === "approve") {
    if (existing.status !== "In Review") {
      res.status(400).json({ error: "Can only approve actuals that are In Review" });
      return;
    }
    const nextLevel = getNextReviewLevel(existing.reviewLevel);
    if (nextLevel) {
      updates.reviewLevel = nextLevel;
      updates.reviewStatus = "Pending";
    } else {
      updates.status = "Approved";
      updates.reviewStatus = "Approved";
    }
    updates.reviewedById = req.user!.id;
    updates.reviewedAt = new Date();
    updates.reviewComments = comments || null;
  } else if (action === "return") {
    if (existing.status !== "In Review") {
      res.status(400).json({ error: "Can only return actuals that are In Review" });
      return;
    }
    if (!comments) {
      res.status(400).json({ error: "Comments required when returning" });
      return;
    }
    updates.status = "Returned";
    updates.reviewStatus = "Returned";
    updates.reviewedById = req.user!.id;
    updates.reviewedAt = new Date();
    updates.reviewComments = comments;
  }

  const [row] = await db.update(kpiQuarterActualsTable).set(updates).where(eq(kpiQuarterActualsTable.id, id)).returning();
  await logAudit(req, `actual:${action}`, "kpi_quarter_actual", id,
    { status: existing.status, reviewLevel: existing.reviewLevel } as unknown as Record<string, unknown>,
    { status: row.status, reviewLevel: row.reviewLevel } as unknown as Record<string, unknown>
  );
  res.json(row);
});

router.get("/scorecard-kpis/:kpiId/evidence", async (req: AuthenticatedRequest, res) => {
  const kpiId = Number(req.params.kpiId);
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
  const condition = quarter
    ? and(eq(kpiEvidenceDocumentsTable.kpiId, kpiId), eq(kpiEvidenceDocumentsTable.quarter, quarter))
    : eq(kpiEvidenceDocumentsTable.kpiId, kpiId);
  const rows = await db.select().from(kpiEvidenceDocumentsTable).where(condition);
  res.json(rows);
});

router.post("/scorecard-kpis/:kpiId/evidence", requirePermission("evidence.upload", "*"), async (req: AuthenticatedRequest, res) => {
  const kpiId = Number(req.params.kpiId);
  const parsed = UploadKpiEvidenceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.insert(kpiEvidenceDocumentsTable).values({
    kpiId,
    quarter: parsed.data.quarter,
    fileName: parsed.data.fileName,
    fileSize: parsed.data.fileSize,
    mimeType: parsed.data.mimeType,
    filePath: `/uploads/${kpiId}/${parsed.data.fileName}`,
    documentType: parsed.data.documentType,
    description: parsed.data.description,
    uploadedById: req.user!.id,
  }).returning();
  await logAudit(req, "upload", "kpi_evidence_document", row.id, null, row as unknown as Record<string, unknown>);
  res.status(201).json(row);
});

router.post("/evidence/:id/verify", requirePermission("evidence.verify", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(kpiEvidenceDocumentsTable).where(eq(kpiEvidenceDocumentsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const parsed = VerifyEvidenceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const updates: Record<string, unknown> = {
    verificationStatus: parsed.data.status,
    verifiedById: req.user!.id,
    verifiedAt: new Date(),
  };
  if (parsed.data.status === "Rejected") {
    updates.rejectionReason = parsed.data.rejectionReason || null;
  }
  const [row] = await db.update(kpiEvidenceDocumentsTable).set(updates).where(eq(kpiEvidenceDocumentsTable.id, id)).returning();
  await logAudit(req, `evidence:${parsed.data.status.toLowerCase()}`, "kpi_evidence_document", id, { verificationStatus: existing.verificationStatus }, { verificationStatus: parsed.data.status });
  res.json(row);
});

router.get("/remedial-actions", async (req: AuthenticatedRequest, res) => {
  const kpiId = req.query.kpiId ? Number(req.query.kpiId) : undefined;
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
  const status = req.query.status as string | undefined;
  let condition;
  if (kpiId && quarter) {
    condition = and(eq(remedialActionPlansTable.kpiId, kpiId), eq(remedialActionPlansTable.quarter, quarter));
  } else if (kpiId) {
    condition = eq(remedialActionPlansTable.kpiId, kpiId);
  } else if (status) {
    condition = eq(remedialActionPlansTable.status, status);
  }
  const rows = condition
    ? await db.select().from(remedialActionPlansTable).where(condition)
    : await db.select().from(remedialActionPlansTable);
  res.json(rows);
});

router.post("/remedial-actions", requirePermission("corrective.create", "*"), async (req: AuthenticatedRequest, res) => {
  const parsed = CreateRemedialActionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.insert(remedialActionPlansTable).values({
    ...parsed.data,
    createdById: req.user!.id,
  }).returning();
  await logAudit(req, "create", "remedial_action_plan", row.id, null, row as unknown as Record<string, unknown>);
  res.status(201).json(row);
});

router.patch("/remedial-actions/:id", requirePermission("corrective.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(remedialActionPlansTable).where(eq(remedialActionPlansTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const parsed = UpdateRemedialActionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.status === "Completed") {
    updates.completedAt = new Date();
  }
  const [row] = await db.update(remedialActionPlansTable).set(updates).where(eq(remedialActionPlansTable.id, id)).returning();
  await logAudit(req, "update", "remedial_action_plan", id, existing as unknown as Record<string, unknown>, row as unknown as Record<string, unknown>);
  res.json(row);
});

export default router;
