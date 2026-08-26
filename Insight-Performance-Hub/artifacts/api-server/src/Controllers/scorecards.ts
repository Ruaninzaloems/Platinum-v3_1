import { Router } from "express";
import { db } from "@workspace/db";
import { scorecardsTable, scorecardKpisTable, kpiQuarterTargetsTable, kpiMonthActivitiesTable, sdbipRevisionLogsTable, sdbipFieldConfigsTable, notificationsTable } from "@workspace/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../Middleware/auth";
import { logAudit } from "../Middleware/audit";
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
  if (existing.status !== "Draft") { res.status(400).json({ error: "Only Draft scorecards can be edited" }); return; }
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
    // Revised SDBIPs require ONE overall revision reason at submission
    // (per-KPI reasons are optional notes). It is recorded in the revision log.
    if (existing.scorecardType === "revised" && !parsed.data.comments?.trim()) {
      res.status(400).json({ error: "A revision reason is required when submitting a revised SDBIP" });
      return;
    }
    // Note: KPI weighting validation intentionally removed here — weighting is
    // managed at IPMS (individual) level, not on OPMS scorecards.
  }
  const newStatus = SCORECARD_ACTION_TO_STATUS[parsed.data.action];
  const updates: Record<string, unknown> = { status: newStatus, updatedAt: new Date() };
  if (parsed.data.action === "return") {
    updates.returnComments = parsed.data.comments || null;
    // Returning the scorecard reopens editing: KPIs still in review cascade
    // back to Draft (Approved KPIs keep their status).
    await db.update(scorecardKpisTable)
      .set({ status: "Draft", updatedAt: new Date() })
      .where(and(
        eq(scorecardKpisTable.scorecardId, id),
        inArray(scorecardKpisTable.status, ["Submitted", "Reviewed"]),
      ));
  }
  if (parsed.data.action === "submit") {
    updates.returnComments = null;
    // KPI-level submit was removed from the UI: submitting the scorecard
    // cascades all Draft KPIs to Submitted so review/approve can proceed.
    await db.update(scorecardKpisTable)
      .set({ status: "Submitted", returnComments: null, updatedAt: new Date() })
      .where(and(eq(scorecardKpisTable.scorecardId, id), eq(scorecardKpisTable.status, "Draft")));
  }
  if (parsed.data.action === "reopen") {
    // Approved originals are IMMUTABLE. In-place reopen was replaced by
    // copy-on-reopen: POST /scorecards/:id/revise creates a separate
    // 'revised' Draft copy and the original stays Approved and read-only.
    if (existing.scorecardType !== "revised") {
      const [revision] = await db.select({ id: scorecardsTable.id }).from(scorecardsTable)
        .where(and(eq(scorecardsTable.parentScorecardId, id), eq(scorecardsTable.scorecardType, "revised")));
      res.status(400).json({
        error: revision
          ? "This SDBIP already has a revision. The original is locked; continue on the revised SDBIP instead."
          : "Approved SDBIPs can no longer be reopened in place. Use 'Reopen for Revision' to create a revised copy; the original stays approved.",
      });
      return;
    }
    // Reopening an approved REVISION unlocks the revision itself for further
    // edits: clear its approval metadata and cascade its KPIs back to Draft.
    // The field-config snapshot (carried from the original at copy-on-reopen)
    // and the frozen approved baselines are kept — they anchor the revision's
    // table layout and the Revised/Unchanged comparison against the original.
    updates.approvedById = null;
    updates.approvedAt = null;
    updates.approvalComments = null;
    updates.returnComments = parsed.data.comments || null;
    await db.update(scorecardKpisTable)
      .set({ status: "Draft", updatedAt: new Date() })
      .where(eq(scorecardKpisTable.scorecardId, id));
  }
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
    // Freeze the scorecard wizard configuration at approval time so later
    // wizard changes never alter an approved (locked) SDBIP's layout.
    // Revised scorecards carry the original SDBIP's snapshot from creation
    // (copy-on-reopen) — keep it so the revision's table always matches the
    // original compile table.
    if (Array.isArray(existing.fieldConfigSnapshot) && existing.fieldConfigSnapshot.length > 0) {
      updates.fieldConfigSnapshot = existing.fieldConfigSnapshot;
    } else {
      const sdbipType = existing.scorecardType === "revised" ? "revised" : "original";
      const configRows = await db.select().from(sdbipFieldConfigsTable)
        .where(eq(sdbipFieldConfigsTable.sdbipType, sdbipType));
      updates.fieldConfigSnapshot = configRows;
    }

    // Freeze approved quarterly targets as baselines. On a REVISED scorecard
    // the copied baselines carry the ORIGINAL SDBIP's approved values — they
    // must never be overwritten by the revised values, or the
    // Revised/Unchanged comparison and reason enforcement lose their anchor.
    // Only targets without a baseline yet (e.g. on KPIs added during the
    // revision) get baselined at approval.
    for (const kpi of kpis) {
      const targets = await db.select().from(kpiQuarterTargetsTable).where(eq(kpiQuarterTargetsTable.kpiId, kpi.id));
      for (const t of targets) {
        if (existing.scorecardType === "revised" && t.isApprovedBaseline) continue;
        await db.update(kpiQuarterTargetsTable).set({
          isApprovedBaseline: true,
          baselineTargetValue: t.targetValue,
          baselineBudgetValue: t.budgetValue,
        }).where(eq(kpiQuarterTargetsTable.id, t.id));
      }
    }
  }
  const row = await db.transaction(async (tx) => {
    const [updated] = await tx.update(scorecardsTable).set(updates).where(eq(scorecardsTable.id, id)).returning();
    if (parsed.data.action === "submit" && existing.scorecardType === "revised") {
      // Record the overall revision reason in the revision log (same
      // transaction so status change and log entry succeed or fail together).
      await tx.insert(sdbipRevisionLogsTable).values({
        scorecardId: id,
        revisionType: "revision_submitted",
        newValue: "Revised SDBIP submitted for review",
        revisionReason: parsed.data.comments!.trim(),
        userId: req.user!.id,
        userName: req.user!.displayName,
      });
    }
    return updated;
  });
  if (parsed.data.action === "return" && existing.createdById && existing.createdById !== req.user!.id) {
    await db.insert(notificationsTable).values({
      userId: existing.createdById,
      title: "SDBIP returned for corrections",
      message: `"${existing.name}" was returned by the reviewer${parsed.data.comments ? `: ${parsed.data.comments}` : ""}. You can now edit and resubmit it.`,
      type: "warning",
      link: "/org-planning/scorecards",
    });
  }
  await logAudit(req, `transition:${parsed.data.action}`, "scorecard", id, { status: existing.status }, { status: newStatus }, existing.cycleId);
  res.json(row);
});

/**
 * Copy-on-reopen: create a separate 'revised' Draft scorecard from an approved
 * organisational SDBIP instead of mutating the original in place. The original
 * stays Approved/read-only; the revision gets deep-copied KPIs (fields, custom
 * fields, KPI numbers, sort order) and quarterly targets frozen as approved
 * baselines. Idempotent: if a revision already exists it is returned as-is.
 */
router.post("/scorecards/:id/revise", requirePermission("scorecard.approve", "scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [original] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, id));
  if (!original) { res.status(404).json({ error: "Not found" }); return; }
  if (original.scorecardType !== "organisational") {
    res.status(400).json({ error: "Only organisational SDBIPs can be revised" });
    return;
  }
  if (original.status !== "Approved") {
    res.status(400).json({ error: "Only approved SDBIPs can be reopened for revision" });
    return;
  }

  const [existingRevision] = await db.select().from(scorecardsTable)
    .where(and(eq(scorecardsTable.parentScorecardId, id), eq(scorecardsTable.scorecardType, "revised")));
  if (existingRevision) { res.json(existingRevision); return; }

  const result = await db.transaction(async (tx) => {
    // Serialize concurrent revise calls on the same original.
    await lockScorecard(tx, id);
    const [raced] = await tx.select().from(scorecardsTable)
      .where(and(eq(scorecardsTable.parentScorecardId, id), eq(scorecardsTable.scorecardType, "revised")));
    if (raced) return { scorecard: raced, created: false };

    // The revision's table layout must match the Original compile table: use the
    // original's frozen snapshot, falling back to the current 'original' wizard config.
    let snapshot = Array.isArray(original.fieldConfigSnapshot) && original.fieldConfigSnapshot.length > 0
      ? original.fieldConfigSnapshot
      : null;
    if (!snapshot) {
      snapshot = (await tx.select().from(sdbipFieldConfigsTable)
        .where(eq(sdbipFieldConfigsTable.sdbipType, "original"))) as unknown as Record<string, unknown>[];
    }

    const [revision] = await tx.insert(scorecardsTable).values({
      name: `${original.name} (Revised)`,
      cycleId: original.cycleId,
      scorecardType: "revised",
      parentScorecardId: id,
      departmentId: original.departmentId,
      status: "Draft",
      fieldConfigSnapshot: snapshot,
      createdById: req.user!.id,
    }).returning();

    const kpis = await tx.select().from(scorecardKpisTable)
      .where(eq(scorecardKpisTable.scorecardId, id))
      .orderBy(scorecardKpisTable.sortOrder, scorecardKpisTable.id);
    for (const kpi of kpis) {
      const [copied] = await tx.insert(scorecardKpisTable).values({
        scorecardId: revision.id,
        kpiNumber: kpi.kpiNumber,
        description: kpi.description,
        idpReference: kpi.idpReference,
        strategicObjective: kpi.strategicObjective,
        programme: kpi.programme,
        responsiblePostId: kpi.responsiblePostId,
        custodianPostId: kpi.custodianPostId,
        baseline: kpi.baseline,
        annualTarget: kpi.annualTarget,
        annualBudgetTarget: kpi.annualBudgetTarget,
        evidenceSource: kpi.evidenceSource,
        evidencePortfolio: kpi.evidencePortfolio,
        weighting: kpi.weighting,
        fundingSource: kpi.fundingSource,
        budgetDescription: kpi.budgetDescription,
        unitOfMeasureId: kpi.unitOfMeasureId,
        dataTypeId: kpi.dataTypeId,
        kpiGroupId: kpi.kpiGroupId,
        status: "Draft",
        isCumulative: kpi.isCumulative,
        customFields: kpi.customFields,
        sortOrder: kpi.sortOrder,
      }).returning();
      const targets = await tx.select().from(kpiQuarterTargetsTable).where(eq(kpiQuarterTargetsTable.kpiId, kpi.id));
      for (const t of targets) {
        await tx.insert(kpiQuarterTargetsTable).values({
          kpiId: copied.id,
          quarter: t.quarter,
          targetValue: t.targetValue,
          targetStatus: t.targetStatus,
          budgetValue: t.budgetValue,
          evidenceExpected: t.evidenceExpected,
          // Freeze the approved values as the revision baseline for comparison
          // and revision-reason enforcement.
          isApprovedBaseline: true,
          baselineTargetValue: t.baselineTargetValue ?? t.targetValue,
          baselineBudgetValue: t.baselineBudgetValue ?? t.budgetValue,
        });
      }
    }

    await tx.insert(sdbipRevisionLogsTable).values({
      scorecardId: revision.id,
      revisionType: "scorecard_reopened",
      newValue: `Revision created from approved SDBIP "${original.name}" (${kpis.length} KPI${kpis.length === 1 ? "" : "s"} copied)`,
      userId: req.user!.id,
      userName: req.user!.displayName,
    });
    return { scorecard: revision, created: true };
  });

  if (result.created) {
    await logAudit(req, "revise", "scorecard", id, { status: original.status },
      { revisionScorecardId: result.scorecard.id } as unknown as Record<string, unknown>, original.cycleId);
    res.status(201).json(result.scorecard);
  } else {
    res.json(result.scorecard);
  }
});

router.get("/scorecards/:scorecardId/kpis", async (req: AuthenticatedRequest, res) => {
  const scorecardId = Number(req.params.scorecardId);
  const rows = await db.select().from(scorecardKpisTable)
    .where(eq(scorecardKpisTable.scorecardId, scorecardId))
    .orderBy(scorecardKpisTable.sortOrder, scorecardKpisTable.id);
  res.json(rows);
});

/** Reorder KPIs within a scorecard (drag & drop). Only Draft scorecards can be reordered. */
router.put("/scorecards/:scorecardId/kpis/reorder", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const scorecardId = Number(req.params.scorecardId);
  const [sc] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, scorecardId));
  if (!sc) { res.status(404).json({ error: "Scorecard not found" }); return; }
  if (sc.status !== "Draft") { res.status(400).json({ error: "Only Draft SDBIPs can be reordered" }); return; }
  if (sc.scorecardType !== "organisational") { res.status(400).json({ error: "Only organisational SDBIPs can be reordered" }); return; }

  const kpiIds = req.body?.kpiIds;
  if (!Array.isArray(kpiIds) || kpiIds.length === 0 || !kpiIds.every((id) => Number.isInteger(id))) {
    res.status(400).json({ error: "kpiIds must be a non-empty array of integers" });
    return;
  }
  const valid = await db.transaction(async (tx) => {
    // Serialize concurrent adds/deletes/reorders on this scorecard.
    await lockScorecard(tx, scorecardId);
    const existing = await tx.select({ id: scorecardKpisTable.id }).from(scorecardKpisTable)
      .where(eq(scorecardKpisTable.scorecardId, scorecardId));
    const existingIds = new Set(existing.map((r) => r.id));
    const submittedIds = new Set<number>(kpiIds);
    if (
      submittedIds.size !== kpiIds.length ||
      submittedIds.size !== existingIds.size ||
      !kpiIds.every((id: number) => existingIds.has(id))
    ) {
      return false;
    }
    // Two-phase renumber: park all rows on temporary non-numeric numbers first so
    // the partial unique index on (scorecard_id, kpi_number) never sees a
    // transient duplicate while numbers are being swapped around.
    for (let i = 0; i < kpiIds.length; i++) {
      await tx.update(scorecardKpisTable)
        .set({ kpiNumber: `#reorder-${i + 1}` })
        .where(eq(scorecardKpisTable.id, kpiIds[i]));
    }
    for (let i = 0; i < kpiIds.length; i++) {
      await tx.update(scorecardKpisTable)
        .set({ sortOrder: i, kpiNumber: String(i + 1), updatedAt: new Date() })
        .where(eq(scorecardKpisTable.id, kpiIds[i]));
    }
    return true;
  });
  if (!valid) {
    res.status(400).json({ error: "kpiIds must contain exactly the KPIs of this scorecard, without duplicates" });
    return;
  }
  await logAudit(req, "reorder", "scorecard", scorecardId, undefined, { kpiIds });
  const rows = await db.select().from(scorecardKpisTable)
    .where(eq(scorecardKpisTable.scorecardId, scorecardId))
    .orderBy(scorecardKpisTable.sortOrder, scorecardKpisTable.id);
  res.json(rows);
});

/**
 * Sync wizard quarter custom fields (cf_quarter_N_target / cf_quarter_N_poe) into kpi_quarter_targets
 * so reports/dashboards stay consistent. Only quarters whose keys are explicitly present in the
 * payload are touched, and approved-baseline rows are never modified here — revisions to approved
 * targets must go through the quarter-targets endpoint which enforces revision metadata.
 */
async function syncQuarterTargetsFromCustomFields(kpiId: number, customFields: Record<string, unknown> | null | undefined): Promise<void> {
  if (!customFields) return;
  const hasAnyQuarterKey = Object.keys(customFields).some((k) => /^cf_quarter_[1-4]_(target|poe)$/.test(k));
  if (!hasAnyQuarterKey) return;
  const existing = await db.select().from(kpiQuarterTargetsTable).where(eq(kpiQuarterTargetsTable.kpiId, kpiId));
  const byQuarter = new Map(existing.map((t) => [t.quarter, t]));
  for (let q = 1; q <= 4; q++) {
    const targetKey = `cf_quarter_${q}_target`;
    const poeKey = `cf_quarter_${q}_poe`;
    const hasTargetKey = Object.prototype.hasOwnProperty.call(customFields, targetKey);
    const hasPoeKey = Object.prototype.hasOwnProperty.call(customFields, poeKey);
    if (!hasTargetKey && !hasPoeKey) continue;
    const row = byQuarter.get(q);
    if (row?.isApprovedBaseline) continue;
    // Don't let custom-field sync clobber or delete N/A / On Hold quarters.
    if (row && (row.targetStatus ?? "active") !== "active") continue;
    const rawTarget = customFields[targetKey];
    const rawPoe = customFields[poeKey];
    const targetValue = hasTargetKey
      ? (rawTarget === null || rawTarget === undefined ? "" : String(rawTarget).trim())
      : (row?.targetValue ?? "");
    const evidenceExpected = hasPoeKey
      ? (rawPoe === null || rawPoe === undefined ? null : String(rawPoe).trim() || null)
      : (row?.evidenceExpected ?? null);
    if (!targetValue) {
      if (row && hasTargetKey) {
        await db.delete(kpiQuarterTargetsTable).where(eq(kpiQuarterTargetsTable.id, row.id));
      }
      continue;
    }
    if (row) {
      if (row.targetValue !== targetValue || (row.evidenceExpected ?? null) !== evidenceExpected) {
        await db.update(kpiQuarterTargetsTable)
          .set({ targetValue, evidenceExpected, updatedAt: new Date() })
          .where(eq(kpiQuarterTargetsTable.id, row.id));
      }
    } else {
      await db.insert(kpiQuarterTargetsTable).values({ kpiId, quarter: q, targetValue, evidenceExpected });
    }
  }
}

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Take a row lock on the scorecard (SELECT ... FOR UPDATE) so concurrent
 * add/delete/reorder operations on the same scorecard are serialized and can
 * never interleave their read-then-renumber steps.
 */
async function lockScorecard(tx: DbOrTx, scorecardId: number): Promise<void> {
  await tx.select({ id: scorecardsTable.id }).from(scorecardsTable)
    .where(eq(scorecardsTable.id, scorecardId))
    .for("update");
}

/**
 * Renumber an organisational scorecard's KPIs 1..N (by sortOrder, then id) so the
 * NUMBER column stays sequential after adds/deletes. Non-organisational scorecards
 * keep their free-form numbers (e.g. "BSD-01") untouched.
 * Must be called inside a transaction that holds the scorecard row lock.
 *
 * Uses a two-phase update: rows that change are first parked on a non-numeric
 * temporary number so the partial unique index on (scorecard_id, kpi_number)
 * (which only covers numeric numbers) never sees a transient duplicate.
 */
async function renumberOrganisationalKpis(tx: DbOrTx, scorecardId: number): Promise<void> {
  const kpis = await tx.select({ id: scorecardKpisTable.id, sortOrder: scorecardKpisTable.sortOrder, kpiNumber: scorecardKpisTable.kpiNumber })
    .from(scorecardKpisTable)
    .where(eq(scorecardKpisTable.scorecardId, scorecardId))
    .orderBy(scorecardKpisTable.sortOrder, scorecardKpisTable.id);
  const changing = kpis
    .map((k, i) => ({ id: k.id, index: i }))
    .filter(({ index }) => kpis[index].sortOrder !== index || kpis[index].kpiNumber !== String(index + 1));
  if (changing.length === 0) return;
  // Phase 1: park changing rows on temporary non-numeric numbers.
  for (const { id, index } of changing) {
    await tx.update(scorecardKpisTable)
      .set({ kpiNumber: `#renumber-${index + 1}` })
      .where(eq(scorecardKpisTable.id, id));
  }
  // Phase 2: assign final sequential numbers.
  for (const { id, index } of changing) {
    await tx.update(scorecardKpisTable)
      .set({ sortOrder: index, kpiNumber: String(index + 1), updatedAt: new Date() })
      .where(eq(scorecardKpisTable.id, id));
  }
}

router.post("/scorecards/:scorecardId/kpis", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const scorecardId = Number(req.params.scorecardId);
  const [scorecard] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, scorecardId));
  if (!scorecard) { res.status(404).json({ error: "Scorecard not found" }); return; }
  if (scorecard.status === "Approved") { res.status(400).json({ error: "Cannot add KPIs to approved scorecard" }); return; }
  if (scorecard.status !== "Draft") {
    res.status(400).json({ error: "KPIs cannot be added while the SDBIP is under review" });
    return;
  }
  const parsed = CreateScorecardKpiBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const values: typeof scorecardKpisTable.$inferInsert = { ...parsed.data, scorecardId };
  let row: typeof scorecardKpisTable.$inferSelect;
  if (scorecard.scorecardType === "organisational") {
    row = await db.transaction(async (tx) => {
      // Serialize concurrent adds/deletes/reorders on this scorecard.
      await lockScorecard(tx, scorecardId);
      // New KPIs always go to the end of the list with the next sequential number.
      const existing = await tx.select({ sortOrder: scorecardKpisTable.sortOrder }).from(scorecardKpisTable)
        .where(eq(scorecardKpisTable.scorecardId, scorecardId));
      const nextIndex = existing.length === 0 ? 0 : Math.max(existing.length, ...existing.map((k) => k.sortOrder + 1));
      values.sortOrder = nextIndex;
      // Insert with a temporary non-numeric number so the partial unique index on
      // (scorecard_id, kpi_number) can't reject the insert if existing rows have
      // gaps; renumbering below assigns the final sequential number.
      values.kpiNumber = "#new";
      let [inserted] = await tx.insert(scorecardKpisTable).values(values).returning();
      // Normalise in case existing rows had gaps/duplicates before this insert.
      await renumberOrganisationalKpis(tx, scorecardId);
      const [fresh] = await tx.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.id, inserted.id));
      if (fresh) inserted = fresh;
      return inserted;
    });
  } else if (scorecard.scorecardType === "revised") {
    row = await db.transaction(async (tx) => {
      // Serialize concurrent adds on this scorecard.
      await lockScorecard(tx, scorecardId);
      // New KPIs on a revision get the next number after the highest existing
      // numeric KPI number — copied KPIs keep their original numbers and are
      // never renumbered, so comparisons against the original stay stable.
      const existing = await tx.select({ kpiNumber: scorecardKpisTable.kpiNumber, sortOrder: scorecardKpisTable.sortOrder })
        .from(scorecardKpisTable)
        .where(eq(scorecardKpisTable.scorecardId, scorecardId));
      const maxNum = existing.reduce((m, k) => {
        const n = /^[0-9]+$/.test(k.kpiNumber) ? Number(k.kpiNumber) : 0;
        return Math.max(m, n);
      }, 0);
      values.kpiNumber = String(maxNum + 1);
      values.sortOrder = existing.length === 0 ? 0 : Math.max(...existing.map((k) => k.sortOrder)) + 1;
      const [inserted] = await tx.insert(scorecardKpisTable).values(values).returning();
      return inserted;
    });
  } else {
    [row] = await db.insert(scorecardKpisTable).values(values).returning();
  }
  await syncQuarterTargetsFromCustomFields(row.id, row.customFields as Record<string, unknown> | null);
  await logAudit(req, "create", "scorecard_kpi", row.id, null, row as unknown as Record<string, unknown>, scorecard.cycleId);
  res.status(201).json(row);
});

router.get("/scorecards/:scorecardId/quarter-targets", requirePermission("scorecard.view", "*"), async (req: AuthenticatedRequest, res) => {
  const scorecardId = Number(req.params.scorecardId);
  const kpis = await db.select({ id: scorecardKpisTable.id }).from(scorecardKpisTable).where(eq(scorecardKpisTable.scorecardId, scorecardId));
  const ids = kpis.map(k => k.id);
  if (ids.length === 0) { res.json([]); return; }
  const rows = await db.select().from(kpiQuarterTargetsTable).where(inArray(kpiQuarterTargetsTable.kpiId, ids));
  res.json(rows);
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
  if (existing.status !== "Draft") {
    res.status(400).json({ error: "KPI is locked while under review. It can only be edited if the reviewer returns it." });
    return;
  }
  const parsed = UpdateScorecardKpiBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (updates.customFields == null) delete updates.customFields;
  const [row] = await db.update(scorecardKpisTable).set(updates).where(eq(scorecardKpisTable.id, id)).returning();
  if (parsed.data.customFields != null) {
    await syncQuarterTargetsFromCustomFields(id, row.customFields as Record<string, unknown> | null);
  }
  await logAudit(req, "update", "scorecard_kpi", id, existing as unknown as Record<string, unknown>, row as unknown as Record<string, unknown>);
  res.json(row);
});

router.delete("/scorecard-kpis/:id", requirePermission("scorecard.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const [parent] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, existing.scorecardId));
  if (existing.status !== "Draft" && parent?.status !== "Draft") {
    res.status(400).json({ error: "KPIs can only be deleted while the SDBIP is in Draft" });
    return;
  }
  try {
    await db.transaction(async (tx) => {
      if (parent?.scorecardType === "organisational") {
        // Serialize concurrent adds/deletes/reorders on this scorecard.
        await lockScorecard(tx, existing.scorecardId);
      }
      await tx.delete(kpiQuarterTargetsTable).where(eq(kpiQuarterTargetsTable.kpiId, id));
      await tx.delete(kpiMonthActivitiesTable).where(eq(kpiMonthActivitiesTable.kpiId, id));
      await tx.update(sdbipRevisionLogsTable).set({ kpiId: null }).where(eq(sdbipRevisionLogsTable.kpiId, id));
      await tx.delete(scorecardKpisTable).where(eq(scorecardKpisTable.id, id));
      if (parent?.scorecardType === "organisational") {
        await renumberOrganisationalKpis(tx, existing.scorecardId);
      }
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "23503") {
      res.status(409).json({ error: "This KPI has linked records (actuals or departmental KPIs) and cannot be deleted" });
      return;
    }
    throw e;
  }
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
  if (parsed.data.action === "reopen") {
    // KPIs on an approved organisational SDBIP are permanently locked —
    // in-place reopen was replaced by copy-on-reopen. All edits happen on the
    // revision's copied KPIs (POST /scorecards/:id/revise).
    const [parent] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, existing.scorecardId));
    if (parent && parent.scorecardType === "organisational" && parent.status === "Approved") {
      res.status(400).json({ error: "This SDBIP is approved and locked. Use 'Reopen for Revision' to edit KPIs on a revised copy." });
      return;
    }
  }
  const newStatus = KPI_ACTION_TO_STATUS[parsed.data.action];
  const kpiUpdates: Record<string, unknown> = { status: newStatus, updatedAt: new Date() };
  if (parsed.data.action === "return") kpiUpdates.returnComments = parsed.data.comments || null;
  if (parsed.data.action === "submit") kpiUpdates.returnComments = null;
  const [row] = await db.update(scorecardKpisTable).set(kpiUpdates).where(eq(scorecardKpisTable.id, id)).returning();
  if (parsed.data.action === "return") {
    const [parent] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, existing.scorecardId));
    if (parent?.createdById && parent.createdById !== req.user!.id) {
      await db.insert(notificationsTable).values({
        userId: parent.createdById,
        title: "KPI returned for corrections",
        message: `KPI ${existing.kpiNumber || `#${existing.id}`} on "${parent.name}" was returned by the reviewer${parsed.data.comments ? `: ${parsed.data.comments}` : ""}. You can now edit and resubmit it.`,
        type: "warning",
        link: "/org-planning/scorecards",
      });
    }
  }
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
  if (kpi.status === "Submitted" || kpi.status === "Reviewed") {
    res.status(400).json({ error: "Targets are locked while the KPI is under review. They can only be edited if the reviewer returns it." });
    return;
  }
  // Targets on an approved organisational SDBIP that already has a revision are
  // permanently frozen — target changes belong on the revision's copied KPIs.
  const [parentSc] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, kpi.scorecardId));
  if (parentSc && parentSc.scorecardType === "organisational" && parentSc.status === "Approved") {
    const [revision] = await db.select({ id: scorecardsTable.id }).from(scorecardsTable)
      .where(and(eq(scorecardsTable.parentScorecardId, parentSc.id), eq(scorecardsTable.scorecardType, "revised")));
    if (revision) {
      res.status(400).json({ error: "This SDBIP has a revision. The original's targets are locked; edit the revised SDBIP instead." });
      return;
    }
  }

  const parsed = UpsertQuarterTargetsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  if (kpi.isCumulative && parsed.data.targets.length > 1) {
    // N/A and On-Hold quarters are excluded from the cumulative progression check.
    const sorted = parsed.data.targets
      .filter((t) => (t.targetStatus ?? "active") === "active")
      .sort((a, b) => a.quarter - b.quarter);
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
      // Per-target revision reasons are OPTIONAL notes. The required overall
      // revision reason is captured when the complete revised SDBIP is
      // submitted for review (scorecard 'submit' transition).
      const valueChanged = existing.targetValue !== target.targetValue;
      const updates: Record<string, unknown> = {
        targetValue: target.targetValue,
        targetStatus: target.targetStatus ?? "active",
        budgetValue: target.budgetValue,
        evidenceExpected: target.evidenceExpected,
        updatedAt: new Date(),
      };
      if (existing.isApprovedBaseline && valueChanged) {
        updates.revisionReason = target.revisionReason ?? null;
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
        targetStatus: target.targetStatus ?? "active",
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
