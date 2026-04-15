import { Router } from "express";
import { db } from "@workspace/db";
import {
  reviewerAssignmentsTable,
  employeeCompetencyScoresTable,
  individualAssessmentRecordsTable,
  moderationRecordsIndividualTable,
  individualAgreementsTable,
  performanceCyclesTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../middleware/auth";
import { logAudit } from "../middleware/audit";
import {
  CreateReviewerAssignmentBody,
  ScoreCompetencyBody,
  CreateIndividualAssessmentBody,
  CreateIndividualModerationBody,
} from "@workspace/api-zod";

const router = Router();

const KPI_WEIGHT = 0.7;
const COMPETENCY_WEIGHT = 0.3;

function hasGlobalViewAccess(user: AuthenticatedRequest["user"]): boolean {
  if (!user) return false;
  if (user.role === "system_admin" || user.role === "perf_admin" || user.role === "muni_manager") return true;
  return false;
}

function canViewAgreement(user: AuthenticatedRequest["user"], agreement: { employeeId: number; departmentId: number | null }): boolean {
  if (!user) return false;
  if (hasGlobalViewAccess(user)) return true;
  if ((user.role === "hod" || user.role === "dept_coordinator") && user.departmentId !== null && agreement.departmentId === user.departmentId) return true;
  return agreement.employeeId === user.id;
}

async function assertCycleNotClosed(cycleId: number) {
  const [cycle] = await db.select().from(performanceCyclesTable).where(eq(performanceCyclesTable.id, cycleId));
  if (!cycle) return { ok: false as const, error: "Cycle not found" };
  if (cycle.status === "Closed") return { ok: false as const, error: "Cycle is closed — assessments are immutable" };
  return { ok: true as const };
}

router.get("/reviewer-assignments", async (req: AuthenticatedRequest, res) => {
  const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
  const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;
  let rows = await db.select().from(reviewerAssignmentsTable);
  if (cycleId) rows = rows.filter(r => r.cycleId === cycleId);
  if (employeeId) rows = rows.filter(r => r.employeeId === employeeId);
  if (!hasGlobalViewAccess(req.user)) {
    rows = rows.filter(r => r.employeeId === req.user!.id || r.primaryReviewerId === req.user!.id || r.secondaryReviewerId === req.user!.id);
  }
  res.json(rows);
});

router.post("/reviewer-assignments", requirePermission("reviewer.manage", "*"), async (req: AuthenticatedRequest, res) => {
  const parsed = CreateReviewerAssignmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const existing = await db.select().from(reviewerAssignmentsTable)
    .where(eq(reviewerAssignmentsTable.employeeId, parsed.data.employeeId));
  const activeOnes = existing.filter(r => r.isActive && r.cycleId === parsed.data.cycleId);
  if (activeOnes.length > 0) {
    await db.update(reviewerAssignmentsTable)
      .set({ isActive: false })
      .where(eq(reviewerAssignmentsTable.id, activeOnes[0].id));
  }
  const [row] = await db.insert(reviewerAssignmentsTable).values({
    ...parsed.data,
    changedById: req.user!.id,
    version: activeOnes.length > 0 ? (activeOnes[0].version + 1) : 1,
  }).returning();
  await logAudit(req, "create", "reviewer_assignment", row.id, activeOnes[0] ? activeOnes[0] as unknown as Record<string, unknown> : null, row as unknown as Record<string, unknown>, parsed.data.cycleId);
  res.status(201).json(row);
});

router.get("/agreements/:agreementId/competency-scores", async (req: AuthenticatedRequest, res) => {
  const agreementId = Number(req.params.agreementId);
  const [agreement] = await db.select().from(individualAgreementsTable).where(eq(individualAgreementsTable.id, agreementId));
  if (!agreement) { res.status(404).json({ error: "Agreement not found" }); return; }
  if (!canViewAgreement(req.user, agreement)) { res.status(403).json({ error: "Access denied" }); return; }
  const rows = await db.select().from(employeeCompetencyScoresTable).where(eq(employeeCompetencyScoresTable.agreementId, agreementId));
  res.json(rows);
});

router.post("/agreements/:agreementId/competency-scores", requirePermission("assessment.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const agreementId = Number(req.params.agreementId);
  const [agreement] = await db.select().from(individualAgreementsTable).where(eq(individualAgreementsTable.id, agreementId));
  if (!agreement) { res.status(404).json({ error: "Agreement not found" }); return; }
  if (!hasGlobalViewAccess(req.user)) {
    const assignments = await db.select().from(reviewerAssignmentsTable).where(eq(reviewerAssignmentsTable.employeeId, agreement.employeeId));
    const isAssignedReviewer = assignments.some(a => a.isActive && a.cycleId === agreement.cycleId && (a.primaryReviewerId === req.user!.id || a.secondaryReviewerId === req.user!.id));
    if (!isAssignedReviewer && agreement.employeeId !== req.user!.id) {
      res.status(403).json({ error: "You are not assigned as a reviewer for this agreement" });
      return;
    }
  }
  const cycleCheck = await assertCycleNotClosed(agreement.cycleId);
  if (!cycleCheck.ok) { res.status(409).json({ error: cycleCheck.error }); return; }
  const parsed = ScoreCompetencyBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.insert(employeeCompetencyScoresTable).values({
    ...parsed.data,
    agreementId,
    scoredById: req.user!.id,
    scoredAt: new Date(),
  }).returning();
  res.status(201).json(row);
});

router.get("/individual-assessments", async (req: AuthenticatedRequest, res) => {
  const agreementId = req.query.agreementId ? Number(req.query.agreementId) : undefined;
  const reviewerId = req.query.reviewerId ? Number(req.query.reviewerId) : undefined;
  let rows = await db.select().from(individualAssessmentRecordsTable);
  if (agreementId) rows = rows.filter(r => r.agreementId === agreementId);
  if (reviewerId) rows = rows.filter(r => r.reviewerId === reviewerId);
  if (req.user && !hasGlobalViewAccess(req.user)) {
    const userAgreements = await db.select().from(individualAgreementsTable);
    const myAgreementIds = new Set(userAgreements.filter(a => a.employeeId === req.user!.id).map(a => a.id));
    rows = rows.filter(r => myAgreementIds.has(r.agreementId) || r.reviewerId === req.user!.id);
  }
  res.json(rows);
});

router.post("/individual-assessments", requirePermission("assessment.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const parsed = CreateIndividualAssessmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [agreement] = await db.select().from(individualAgreementsTable).where(eq(individualAgreementsTable.id, parsed.data.agreementId));
  if (!agreement) { res.status(404).json({ error: "Agreement not found" }); return; }
  if (agreement.status === "Locked") { res.status(409).json({ error: "Agreement is locked — no new assessments allowed" }); return; }
  if (!hasGlobalViewAccess(req.user)) {
    const assignments = await db.select().from(reviewerAssignmentsTable).where(eq(reviewerAssignmentsTable.employeeId, agreement.employeeId));
    const isAssignedReviewer = assignments.some(a => a.isActive && a.cycleId === agreement.cycleId && (a.primaryReviewerId === req.user!.id || a.secondaryReviewerId === req.user!.id));
    if (!isAssignedReviewer && agreement.employeeId !== req.user!.id) {
      res.status(403).json({ error: "You are not assigned as a reviewer for this agreement" });
      return;
    }
  }
  const cycleCheck = await assertCycleNotClosed(agreement.cycleId);
  if (!cycleCheck.ok) { res.status(409).json({ error: cycleCheck.error }); return; }
  const kpiScore = parsed.data.kpiScore ?? 0;
  const competencyScore = parsed.data.competencyScore ?? 0;
  const overallScore = kpiScore * KPI_WEIGHT + competencyScore * COMPETENCY_WEIGHT;
  const [row] = await db.insert(individualAssessmentRecordsTable).values({
    ...parsed.data,
    overallScore,
    reviewerId: req.user!.id,
  }).returning();
  await logAudit(req, "create", "individual_assessment", row.id, null, row as unknown as Record<string, unknown>, agreement.cycleId);
  res.status(201).json(row);
});

router.get("/individual-moderations", async (req: AuthenticatedRequest, res) => {
  const agreementId = req.query.agreementId ? Number(req.query.agreementId) : undefined;
  let rows = await db.select().from(moderationRecordsIndividualTable);
  if (agreementId) rows = rows.filter(r => r.agreementId === agreementId);
  if (req.user && !hasGlobalViewAccess(req.user)) {
    const userAgreements = await db.select().from(individualAgreementsTable);
    const viewableIds = new Set(userAgreements.filter(a => canViewAgreement(req.user, a)).map(a => a.id));
    rows = rows.filter(r => viewableIds.has(r.agreementId) || r.moderatorId === req.user!.id);
  }
  res.json(rows);
});

router.post("/individual-moderations", requirePermission("moderation.manage", "*"), async (req: AuthenticatedRequest, res) => {
  const parsed = CreateIndividualModerationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [agreement] = await db.select().from(individualAgreementsTable).where(eq(individualAgreementsTable.id, parsed.data.agreementId));
  if (!agreement) { res.status(404).json({ error: "Agreement not found" }); return; }
  if (!canViewAgreement(req.user, agreement)) { res.status(403).json({ error: "Access denied" }); return; }
  const cycleCheck = await assertCycleNotClosed(agreement.cycleId);
  if (!cycleCheck.ok) { res.status(409).json({ error: cycleCheck.error }); return; }
  const [row] = await db.insert(moderationRecordsIndividualTable).values({
    ...parsed.data,
    moderatorId: req.user!.id,
  }).returning();
  await logAudit(req, "create", "individual_moderation", row.id, null, row as unknown as Record<string, unknown>, agreement.cycleId);
  res.status(201).json(row);
});

export default router;
