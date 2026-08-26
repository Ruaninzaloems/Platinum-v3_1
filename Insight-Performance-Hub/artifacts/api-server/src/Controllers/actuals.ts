import { Router } from "express";
import { db } from "@workspace/db";
import {
  kpiQuarterActualsTable, scorecardKpisTable, kpiEvidenceDocumentsTable,
  kpiVariancesTable, remedialActionPlansTable, submissionDeadlinesTable,
  kpiQuarterTargetsTable, unitsOfMeasureTable, kpiReviewSubmissionsTable,
  notificationsTable, scorecardsTable, performanceCyclesTable, usersTable,
  departmentsTable, divisionsTable, rolePermissionsTable
} from "@workspace/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../Middleware/auth";
import { logAudit } from "../Middleware/audit";
import {
  CreateKpiActualBody, UpdateKpiActualBody,
  VerifyEvidenceBody, CreateRemedialActionBody,
  UpdateRemedialActionBody, UploadKpiEvidenceBody
} from "@workspace/api-zod";
import {
  validateActualFormat, isNonAchievement, scoreAndAssess,
  assessmentToIsAchieved, loadAssessmentContext, resolveEffectiveKpiId
} from "../Helpers/assessment";
import { resolveEffectiveKpiSet } from "../Helpers/effective-kpis";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const router = Router();

/**
 * §2 capture preconditions: the applicable SDBIP must be Approved and the
 * performance cycle Open/Active. Returns an error message, or null if eligible.
 * Enforced on create, edit, and submit so no capture path bypasses it.
 */
async function captureEligibilityError(kpi: { scorecardId: number }): Promise<string | null> {
  const [sc] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, kpi.scorecardId));
  if (!sc) return null;
  if (sc.status !== "Approved") {
    const label = sc.scorecardType === "departmental" ? "Departmental SDBIP"
      : sc.scorecardType === "revised" ? "Revised SDBIP" : "Original SDBIP";
    return `${label} must be approved before quarterly actual performance can be captured`;
  }
  const [cyc] = await db.select().from(performanceCyclesTable).where(eq(performanceCyclesTable.id, sc.cycleId));
  if (cyc && cyc.status !== "Open" && cyc.status !== "Active") {
    return "The performance cycle is not open: quarterly actual capture is unavailable";
  }
  return null;
}

/**
 * §6 Version selection: the system determines the correct planning version.
 * Returns the effective KPI set for capture — Revised targets supersede
 * Original by KPI number once the Revised SDBIP is Approved, plus KPIs from
 * approved Departmental SDBIPs (which carry their own departmental targets).
 */
router.get("/cycles/:cycleId/capture-kpis", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.params.cycleId);
  const { scorecards, cycleKpis, kpis } = await resolveEffectiveKpiSet(cycleId);
  const scById = new Map(scorecards.map((s) => [s.id, s]));
  const approvedOrg = kpis.filter((k) => scById.get(k.scorecardId)?.status === "Approved");
  const departmental = cycleKpis.filter((k) => {
    const sc = scById.get(k.scorecardId);
    return sc?.scorecardType === "departmental" && sc.status === "Approved";
  });
  const all = [...approvedOrg, ...departmental];
  const kpiIds = all.map((k) => k.id);
  const [targets, actuals, users, depts] = await Promise.all([
    kpiIds.length ? db.select().from(kpiQuarterTargetsTable).where(inArray(kpiQuarterTargetsTable.kpiId, kpiIds)) : Promise.resolve([]),
    kpiIds.length ? db.select().from(kpiQuarterActualsTable).where(and(inArray(kpiQuarterActualsTable.kpiId, kpiIds), eq(kpiQuarterActualsTable.periodType, "quarterly"))) : Promise.resolve([]),
    db.select().from(usersTable),
    db.select().from(departmentsTable),
  ]);
  const userById = new Map(users.map((u) => [u.id, u]));
  const deptById = new Map(depts.map((d) => [d.id, d]));
  const rows = all.map((k) => {
    const sc = scById.get(k.scorecardId);
    const official = k.responsiblePostId ? userById.get(k.responsiblePostId) : undefined;
    const deptId = sc?.departmentId ?? official?.departmentId ?? null;
    return {
      ...k,
      scorecardName: sc?.name ?? null,
      scorecardType: sc?.scorecardType ?? null,
      responsiblePostName: official?.displayName ?? null,
      responsiblePostJobTitle: official?.jobTitle ?? null,
      departmentId: deptId,
      departmentName: deptId ? deptById.get(deptId)?.name ?? null : null,
      quarterTargets: targets.filter((t) => t.kpiId === k.id).map((t) => ({ quarter: t.quarter, targetValue: t.targetValue })),
      quarterActuals: actuals.filter((a) => a.kpiId === k.id).map((a) => ({ quarter: a.quarter, actualValue: a.actualValue, status: a.status, reviewLevel: a.reviewLevel, reviewComments: a.reviewComments, assessment: a.assessment, scorePct: a.scorePct })),
    };
  });
  res.json(rows);
});

router.get("/kpi-actuals", async (req: AuthenticatedRequest, res) => {
  const { status, reviewLevel, cycleId, periodType } = req.query;
  const conditions = [];
  conditions.push(eq(kpiQuarterActualsTable.periodType, (periodType as string) || "quarterly"));
  if (status) conditions.push(eq(kpiQuarterActualsTable.status, status as string));
  if (reviewLevel) {
    const levels = String(reviewLevel).split(",").map((l) => l.trim()).filter(Boolean);
    if (levels.length === 1) {
      conditions.push(eq(kpiQuarterActualsTable.reviewLevel, levels[0]));
    } else if (levels.length > 1) {
      conditions.push(inArray(kpiQuarterActualsTable.reviewLevel, levels));
    }
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = where
    ? await db.select().from(kpiQuarterActualsTable).where(where)
    : await db.select().from(kpiQuarterActualsTable);
  const kpiIds = [...new Set(rows.map((r) => r.kpiId))];
  const docs = kpiIds.length
    ? await db.select({
        kpiId: kpiEvidenceDocumentsTable.kpiId,
        quarter: kpiEvidenceDocumentsTable.quarter,
        periodType: kpiEvidenceDocumentsTable.periodType,
      }).from(kpiEvidenceDocumentsTable).where(inArray(kpiEvidenceDocumentsTable.kpiId, kpiIds))
    : [];
  const poeCounts = new Map<string, number>();
  for (const d of docs) {
    const key = `${d.periodType ?? "quarterly"}:${d.kpiId}:${d.quarter}`;
    poeCounts.set(key, (poeCounts.get(key) ?? 0) + 1);
  }
  res.json(rows.map((r) => ({
    ...r,
    poeCount: poeCounts.get(`${r.periodType ?? "quarterly"}:${r.kpiId}:${r.quarter}`) ?? 0,
  })));
});

router.get("/scorecard-kpis/:kpiId/actuals", async (req: AuthenticatedRequest, res) => {
  const kpiId = Number(req.params.kpiId);
  const periodType = (req.query.periodType as string) || "quarterly";
  const rows = await db.select().from(kpiQuarterActualsTable).where(
    and(eq(kpiQuarterActualsTable.kpiId, kpiId), eq(kpiQuarterActualsTable.periodType, periodType))
  );
  res.json(rows);
});

router.get("/scorecard-kpis/:kpiId/capture-context", async (req: AuthenticatedRequest, res) => {
  const kpiId = Number(req.params.kpiId);
  const effectiveKpiId = await resolveEffectiveKpiId(kpiId);
  const [kpi] = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.id, effectiveKpiId));
  if (!kpi) { res.status(404).json({ error: "KPI not found" }); return; }
  let uomName: string | null = null;
  if (kpi.unitOfMeasureId) {
    const [uom] = await db.select().from(unitsOfMeasureTable).where(eq(unitsOfMeasureTable.id, kpi.unitOfMeasureId));
    uomName = uom?.name ?? null;
  }
  const targets = await db.select().from(kpiQuarterTargetsTable).where(eq(kpiQuarterTargetsTable.kpiId, effectiveKpiId));

  const [scorecard] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, kpi.scorecardId));
  let financialYearLabel: string | null = null;
  let cycleStatus: string | null = null;
  if (scorecard) {
    const [cycle] = await db.select().from(performanceCyclesTable).where(eq(performanceCyclesTable.id, scorecard.cycleId));
    financialYearLabel = cycle?.financialYearLabel ?? null;
    cycleStatus = cycle?.status ?? null;
  }
  let responsibleOfficialName: string | null = null;
  let responsibleJobTitle: string | null = null;
  let departmentName: string | null = null;
  let divisionName: string | null = null;
  if (kpi.responsiblePostId) {
    const [official] = await db.select().from(usersTable).where(eq(usersTable.id, kpi.responsiblePostId));
    responsibleOfficialName = official?.displayName ?? null;
    responsibleJobTitle = official?.jobTitle ?? null;
    const deptId = scorecard?.departmentId ?? official?.departmentId ?? null;
    if (deptId) {
      const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, deptId));
      departmentName = dept?.name ?? null;
    }
    if (official?.divisionId) {
      const [div] = await db.select().from(divisionsTable).where(eq(divisionsTable.id, official.divisionId));
      divisionName = div?.name ?? null;
    }
  } else if (scorecard?.departmentId) {
    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, scorecard.departmentId));
    departmentName = dept?.name ?? null;
  }
  const custom = (kpi.customFields ?? {}) as Record<string, unknown>;
  const technicalIndicator =
    (custom["technicalIndicatorDescription"] as string | undefined) ??
    (custom["technical_indicator_description"] as string | undefined) ?? null;
  const risk =
    (custom["cf_risk"] as string | undefined) ??
    (custom["risk"] as string | undefined) ?? null;
  const nkpa = (custom["cf_nkpa"] as string | undefined) ?? null;
  const quarterPoe: Record<number, string | null> = {};
  for (const q of [1, 2, 3, 4]) {
    const v = custom[`cf_quarter_${q}_poe`];
    quarterPoe[q] = typeof v === "string" && v.trim() ? v : null;
  }

  res.json({
    effectiveKpiId,
    kpiNumber: kpi.kpiNumber,
    kpiDescription: kpi.description,
    uomName,
    annualTarget: kpi.annualTarget,
    baseline: kpi.baseline,
    strategicObjective: kpi.strategicObjective,
    programme: kpi.programme,
    idpReference: kpi.idpReference,
    evidenceSource: kpi.evidenceSource,
    evidencePortfolio: kpi.evidencePortfolio,
    technicalIndicator,
    risk,
    nkpa,
    quarterPoe,
    weighting: kpi.weighting,
    annualBudgetTarget: kpi.annualBudgetTarget,
    budgetDescription: kpi.budgetDescription,
    fundingSource: kpi.fundingSource,
    isCumulative: kpi.isCumulative,
    responsibleOfficialName,
    responsibleJobTitle,
    departmentName,
    divisionName,
    scorecardName: scorecard?.name ?? null,
    scorecardType: scorecard?.scorecardType ?? null,
    scorecardStatus: scorecard?.status ?? null,
    kpiStatus: kpi.status,
    financialYearLabel,
    cycleStatus,
    targets: targets.map(t => ({ quarter: t.quarter, targetValue: t.targetValue, targetStatus: t.targetStatus })),
  });
});

router.get("/kpi-actuals/:id/reviews", async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const rows = await db.select().from(kpiReviewSubmissionsTable).where(eq(kpiReviewSubmissionsTable.actualId, id));
  res.json(rows);
});

router.post("/scorecard-kpis/:kpiId/actuals", requirePermission("actuals.submit", "*"), async (req: AuthenticatedRequest, res) => {
  const kpiId = Number(req.params.kpiId);
  const [kpi] = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.id, kpiId));
  if (!kpi) { res.status(404).json({ error: "KPI not found" }); return; }

  // §2 Preconditions: cycle must be open and the applicable SDBIP approved
  const eligibilityError = await captureEligibilityError(kpi);
  if (eligibilityError) { res.status(400).json({ error: eligibilityError }); return; }
  if (kpi.status !== "Approved") { res.status(400).json({ error: "Cannot submit actuals against unapproved KPIs" }); return; }

  const parsed = CreateKpiActualBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  const ctx = await loadAssessmentContext(kpiId, parsed.data.quarter);
  const formatError = validateActualFormat(parsed.data.actualValue, ctx.uomName);
  if (formatError) { res.status(400).json({ error: formatError }); return; }
  const scored = await scoreAndAssess(
    parsed.data.actualValue, ctx, parsed.data.isOnHold ?? false,
    parsed.data.qualitativeScorePct, parsed.data.commentary,
  );
  const assessment = scored.assessment;
  if (isNonAchievement(assessment)) {
    if (!parsed.data.commentary?.trim()) { res.status(400).json({ error: "Comment is required when the target is not achieved" }); return; }
    if (!parsed.data.challengeNarrative?.trim()) { res.status(400).json({ error: "Challenges are required when the target is not achieved" }); return; }
    if (!parsed.data.correctiveAction?.trim()) { res.status(400).json({ error: "Corrective action is required when the target is not achieved" }); return; }
  }

  let isLate = false;
  const deadlines = parsed.data.periodType && parsed.data.periodType !== "quarterly"
    ? []
    : await db.select().from(submissionDeadlinesTable);
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
    periodType: parsed.data.periodType ?? "quarterly",
    quarter: parsed.data.quarter,
    actualValue: parsed.data.actualValue,
    commentary: parsed.data.commentary,
    isAchieved: assessmentToIsAchieved(assessment),
    assessment,
    scorePct: scored.scorePct,
    ratingLevel: scored.ratingLevel,
    ratingLabel: scored.ratingLabel,
    aiRationale: scored.aiRationale,
    qualitativeScorePct: parsed.data.qualitativeScorePct ?? null,
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
  if (existing.status !== "Draft" && existing.status !== "Returned") {
    res.status(400).json({ error: "Actual is locked: only Draft or Returned actuals may be edited" });
    return;
  }
  const [ownerKpi] = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.id, existing.kpiId));
  if (ownerKpi) {
    const eligibilityError = await captureEligibilityError(ownerKpi);
    if (eligibilityError) { res.status(400).json({ error: eligibilityError }); return; }
  }
  const parsed = UpdateKpiActualBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  const nextValue = parsed.data.actualValue ?? existing.actualValue;
  const nextOnHold = parsed.data.isOnHold ?? existing.isOnHold;
  const ctx = await loadAssessmentContext(existing.kpiId, existing.quarter);
  const formatError = validateActualFormat(nextValue, ctx.uomName);
  if (formatError) { res.status(400).json({ error: formatError }); return; }
  const nextQualScore = parsed.data.qualitativeScorePct !== undefined
    ? parsed.data.qualitativeScorePct
    : existing.qualitativeScorePct;
  const nextCommentary = parsed.data.commentary ?? existing.commentary;
  const scored = await scoreAndAssess(nextValue, ctx, nextOnHold, nextQualScore, nextCommentary);
  const assessment = scored.assessment;
  const nextChallenges = parsed.data.challengeNarrative ?? existing.challengeNarrative;
  const nextCorrective = parsed.data.correctiveAction ?? existing.correctiveAction;
  if (isNonAchievement(assessment)) {
    if (!nextCommentary?.trim()) { res.status(400).json({ error: "Comment is required when the target is not achieved" }); return; }
    if (!nextChallenges?.trim()) { res.status(400).json({ error: "Challenges are required when the target is not achieved" }); return; }
    if (!nextCorrective?.trim()) { res.status(400).json({ error: "Corrective action is required when the target is not achieved" }); return; }
  }

  const [row] = await db.update(kpiQuarterActualsTable).set({
    ...parsed.data,
    isAchieved: assessmentToIsAchieved(assessment),
    assessment,
    scorePct: scored.scorePct,
    ratingLevel: scored.ratingLevel,
    ratingLabel: scored.ratingLabel,
    aiRationale: scored.aiRationale,
    qualitativeScorePct: nextQualScore ?? null,
    updatedAt: new Date(),
  }).where(eq(kpiQuarterActualsTable.id, id)).returning();
  await logAudit(req, "update", "kpi_quarter_actual", id, existing as unknown as Record<string, unknown>, row as unknown as Record<string, unknown>);
  res.json(row);
});

const REVIEW_LEVELS = ["line_manager", "pms_manager", "internal_audit"] as const;

const LEGACY_LEVEL_MAP: Record<string, string> = { director: "line_manager", pms_director: "pms_manager" };

function normalizeReviewLevel(level: string | null): string | null {
  if (!level) return null;
  return LEGACY_LEVEL_MAP[level] ?? level;
}

function getNextReviewLevel(current: string | null): string | null {
  const normalized = normalizeReviewLevel(current);
  if (!normalized) return REVIEW_LEVELS[0];
  const idx = REVIEW_LEVELS.indexOf(normalized as typeof REVIEW_LEVELS[number]);
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
  if (!action || !["submit", "approve", "return", "reject"].includes(action)) {
    res.status(400).json({ error: "action must be submit, approve, return, or reject" });
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

  if (action === "approve") {
    // §6 Validation rules: manager cannot approve an incomplete submission
    const problems: string[] = [];
    if (!existing.commentary?.trim()) {
      problems.push("Actual comment is missing");
    }
    const nonAchieved = existing.assessment === "Not Achieved" || existing.assessment === "Partially Achieved";
    if (nonAchieved) {
      if (!existing.challengeNarrative?.trim()) problems.push("Challenge narrative is missing for a non-achieved KPI");
      if (!existing.correctiveAction?.trim()) problems.push("Corrective action is missing for a non-achieved KPI");
    }
    // N/A ("Not Applicable") or on-hold quarters have nothing to evidence — no POE required.
    const flagValue = (existing.actualValue ?? "").trim().toUpperCase();
    const flaggedOut = existing.assessment === "Not Applicable"
      || existing.isOnHold
      || flagValue === "N/A"
      || flagValue === "ON HOLD";
    if (!flaggedOut) {
      const evidenceDocs = await db.select({ id: kpiEvidenceDocumentsTable.id }).from(kpiEvidenceDocumentsTable).where(and(
        eq(kpiEvidenceDocumentsTable.kpiId, existing.kpiId),
        eq(kpiEvidenceDocumentsTable.quarter, existing.quarter),
        eq(kpiEvidenceDocumentsTable.periodType, existing.periodType ?? "quarterly"),
      ));
      if (evidenceDocs.length === 0) problems.push("No evidence documents are attached");
    }
    if (problems.length > 0) {
      res.status(400).json({ error: `Cannot approve: ${problems.join("; ")}` });
      return;
    }
  }

  if (action === "submit") {
    if (existing.status !== "Draft" && existing.status !== "Returned") {
      res.status(400).json({ error: "Can only submit from Draft or Returned status" });
      return;
    }
    const [ownerKpi] = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.id, existing.kpiId));
    if (ownerKpi) {
      const eligibilityError = await captureEligibilityError(ownerKpi);
      if (eligibilityError) { res.status(400).json({ error: eligibilityError }); return; }
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
  } else if (action === "reject") {
    if (existing.status !== "In Review") {
      res.status(400).json({ error: "Can only reject actuals that are In Review" });
      return;
    }
    if (!comments) {
      res.status(400).json({ error: "Comments required when rejecting" });
      return;
    }
    updates.status = "Rejected";
    updates.reviewStatus = "Rejected";
    updates.reviewedById = req.user!.id;
    updates.reviewedAt = new Date();
    updates.reviewComments = comments;
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

  // §7/§10: permanent review history record for review decisions
  if (action !== "submit") {
    try {
      await db.insert(kpiReviewSubmissionsTable).values({
        actualId: id,
        kpiId: existing.kpiId,
        quarter: existing.quarter,
        reviewerUserId: req.user!.id,
        action,
        comments: comments || null,
        returnReason: action === "return" || action === "reject" ? comments || null : null,
      });
    } catch (err) {
      console.error("Failed to record review submission", err);
    }
  }

  // §11: notify the submitter, next-stage reviewers (approve), and HOD (reject)
  if (action !== "submit") {
    const [kpi] = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.id, existing.kpiId));
    const kpiRef = kpi ? `KPI ${kpi.kpiNumber}` : `KPI #${existing.kpiId}`;
    const period = (existing.periodType ?? "quarterly") === "quarterly" ? `Q${existing.quarter}` : existing.periodType;
    const eventKey = `actual:${id}:${action}:${Date.now()}`;
    const pending: { userId: number; title: string; message: string; type: string }[] = [];

    if (action === "approve") {
      const advanced = row.status !== "Approved";
      pending.push({
        userId: existing.submittedById,
        title: advanced ? "Submission progressed" : "Actual fully approved",
        message: advanced
          ? `${kpiRef} (${period}) actual passed ${existing.reviewLevel ?? "review"} and moved to the next review stage.`
          : `${kpiRef} (${period}) actual has completed all review stages and is approved.`,
        type: "success",
      });
      if (advanced && row.reviewLevel) {
        // Notify users authorized to review at the next stage
        const nextPerm = REVIEW_LEVEL_PERMISSIONS[row.reviewLevel];
        const roleRows = await db.select().from(rolePermissionsTable).where(
          inArray(rolePermissionsTable.permission, [nextPerm, "actuals.review.*", "*"])
        );
        const roles = [...new Set(roleRows.map((r) => r.roleCode))];
        if (roles.length) {
          const reviewers = await db.select().from(usersTable).where(and(
            inArray(usersTable.role, roles), eq(usersTable.isActive, true)
          ));
          for (const u of reviewers) {
            pending.push({
              userId: u.id,
              title: "Actual awaiting your review",
              message: `${kpiRef} (${period}) actual is now pending review at the ${row.reviewLevel} stage.`,
              type: "info",
            });
          }
        }
      }
    } else if (action === "return") {
      pending.push({
        userId: existing.submittedById,
        title: "Actual returned for correction",
        message: `${kpiRef} (${period}) actual was returned by the reviewer: ${comments}`,
        type: "warning",
      });
      // Also notify the KPI's responsible official (the usual capturer), if different
      if (kpi?.responsiblePostId) {
        pending.push({
          userId: kpi.responsiblePostId,
          title: "Actual returned for correction",
          message: `${kpiRef} (${period}) actual was returned by the reviewer: ${comments}`,
          type: "warning",
        });
      }
    } else {
      pending.push({
        userId: existing.submittedById,
        title: "Actual rejected",
        message: `${kpiRef} (${period}) actual was rejected: ${comments}`,
        type: "error",
      });
      if (kpi?.responsiblePostId) {
        pending.push({
          userId: kpi.responsiblePostId,
          title: "Actual rejected",
          message: `${kpiRef} (${period}) actual was rejected: ${comments}`,
          type: "error",
        });
      }
      // Also notify the submitter's Head of Department (supervisor)
      const [submitter] = await db.select().from(usersTable).where(eq(usersTable.id, existing.submittedById));
      const [supervisor] = submitter?.supervisorId
        ? await db.select().from(usersTable).where(eq(usersTable.id, submitter.supervisorId))
        : [];
      if (submitter?.supervisorId && supervisor?.isActive) {
        pending.push({
          userId: submitter.supervisorId,
          title: "Actual rejected",
          message: `${kpiRef} (${period}) actual submitted by ${submitter.displayName} was rejected: ${comments}`,
          type: "error",
        });
      }
    }

    const seen = new Set<number>();
    const rows = pending.filter((p) => {
      if (seen.has(p.userId)) return false;
      seen.add(p.userId);
      return true;
    });
    if (rows.length) {
      try {
        await db.insert(notificationsTable).values(rows.map((p) => ({
          ...p,
          link: "/?tab=actuals",
          dedupeKey: eventKey,
        }))).onConflictDoNothing({ target: [notificationsTable.userId, notificationsTable.dedupeKey] });
      } catch (err) {
        console.error("Failed to create review notifications", err);
      }
    }
  }

  res.json(row);
});

router.get("/scorecard-kpis/:kpiId/evidence", async (req: AuthenticatedRequest, res) => {
  const kpiId = Number(req.params.kpiId);
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
  const periodType = (req.query.periodType as string) || "quarterly";
  const conditions = [eq(kpiEvidenceDocumentsTable.kpiId, kpiId), eq(kpiEvidenceDocumentsTable.periodType, periodType)];
  if (quarter) conditions.push(eq(kpiEvidenceDocumentsTable.quarter, quarter));
  const rows = await db.select().from(kpiEvidenceDocumentsTable).where(and(...conditions));
  res.json(rows);
});

router.post("/scorecard-kpis/:kpiId/evidence", requirePermission("evidence.upload", "*"), async (req: AuthenticatedRequest, res) => {
  const kpiId = Number(req.params.kpiId);
  const parsed = UploadKpiEvidenceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.insert(kpiEvidenceDocumentsTable).values({
    kpiId,
    periodType: parsed.data.periodType ?? "quarterly",
    quarter: parsed.data.quarter,
    fileName: parsed.data.fileName,
    fileSize: parsed.data.fileSize,
    mimeType: parsed.data.mimeType,
    filePath: parsed.data.filePath
      ? new ObjectStorageService().normalizeObjectEntityPath(parsed.data.filePath)
      : `/uploads/${kpiId}/${parsed.data.fileName}`,
    documentType: parsed.data.documentType,
    description: parsed.data.description,
    uploadedById: req.user!.id,
  }).returning();
  await logAudit(req, "upload", "kpi_evidence_document", row.id, null, row as unknown as Record<string, unknown>);
  res.status(201).json(row);
});

router.post("/evidence/upload-url", requirePermission("evidence.upload", "*"), async (req: AuthenticatedRequest, res) => {
  try {
    const storage = new ObjectStorageService();
    const uploadURL = await storage.getObjectEntityUploadURL();
    const objectPath = storage.normalizeObjectEntityPath(uploadURL);
    res.json({ uploadURL, objectPath });
  } catch (e) {
    console.error("Failed to create evidence upload URL", e);
    res.status(500).json({ error: "Failed to create upload URL" });
  }
});

/**
 * Evidence files are internal municipal documents reviewed across roles
 * (capturers, reviewers, moderators, auditors, oversight). Download is
 * allowed for the uploader, and otherwise requires a role that carries a
 * review/oversight permission. Users whose role grants no permissions are
 * refused.
 */
const EVIDENCE_VIEW_PERMISSIONS = [
  "evidence.upload", "evidence.verify", "assessment.edit", "moderation.manage",
  "audit.view", "dashboard.view", "agreement.edit", "config.manage",
];

router.get("/evidence/:id/download", async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [doc] = await db.select().from(kpiEvidenceDocumentsTable).where(eq(kpiEvidenceDocumentsTable.id, id));
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  const user = req.user!;
  const canView = doc.uploadedById === user.id
    || user.permissions.includes("*")
    || EVIDENCE_VIEW_PERMISSIONS.some(p => user.permissions.includes(p));
  if (!canView) { res.status(403).json({ error: "Forbidden" }); return; }
  if (!doc.filePath?.startsWith("/objects/")) {
    res.status(404).json({ error: "No file is stored for this evidence record" });
    return;
  }
  try {
    const storage = new ObjectStorageService();
    const file = await storage.getObjectEntityFile(doc.filePath);
    const [metadata] = await file.getMetadata();
    res.setHeader("Content-Type", doc.mimeType || (metadata.contentType as string) || "application/octet-stream");
    if (metadata.size) res.setHeader("Content-Length", String(metadata.size));
    res.setHeader("Content-Disposition", `attachment; filename="${(doc.fileName || "evidence").replace(/"/g, "")}"`);
    file.createReadStream()
      .on("error", (err) => {
        console.error("Evidence download stream error", err);
        if (!res.headersSent) res.status(500).json({ error: "Failed to download file" });
        else res.end();
      })
      .pipe(res);
  } catch (e) {
    if (e instanceof ObjectNotFoundError) { res.status(404).json({ error: "File not found in storage" }); return; }
    console.error("Evidence download failed", e);
    res.status(500).json({ error: "Failed to download file" });
  }
});

router.delete("/evidence/:id", requirePermission("evidence.upload", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [doc] = await db.select().from(kpiEvidenceDocumentsTable).where(eq(kpiEvidenceDocumentsTable.id, id));
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }
  if (doc.verificationStatus === "Verified") {
    res.status(400).json({ error: "Verified evidence cannot be deleted" });
    return;
  }
  if (doc.filePath?.startsWith("/objects/")) {
    try {
      const storage = new ObjectStorageService();
      const file = await storage.getObjectEntityFile(doc.filePath);
      await file.delete();
    } catch (e) {
      if (!(e instanceof ObjectNotFoundError)) {
        console.error("Failed to delete evidence file from storage", e);
        res.status(500).json({ error: "Failed to delete file from storage" });
        return;
      }
    }
  }
  await db.delete(kpiEvidenceDocumentsTable).where(eq(kpiEvidenceDocumentsTable.id, id));
  await logAudit(req, "delete", "kpi_evidence_document", id, doc as unknown as Record<string, unknown>, null);
  res.status(204).end();
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
