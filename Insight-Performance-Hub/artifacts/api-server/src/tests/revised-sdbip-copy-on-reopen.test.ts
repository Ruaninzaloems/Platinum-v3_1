import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import app from "../app";
import { db } from "@workspace/db";
import {
  usersTable, performanceCyclesTable, scorecardsTable, scorecardKpisTable,
  kpiQuarterTargetsTable, sdbipRevisionLogsTable,
} from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * Guards the copy-on-reopen behaviour of "Reopen for Revision":
 * - POST /scorecards/:id/revise creates a SEPARATE 'revised' Draft scorecard
 *   (parentScorecardId link) with deep-copied KPIs and quarter targets frozen
 *   as approved baselines — the original stays Approved and untouched.
 * - The endpoint is idempotent (second call returns the existing revision).
 * - The original becomes read-only: scorecard 'reopen' transition, KPI
 *   'reopen' transition and target edits are all rejected once a revision
 *   exists.
 * - Baselined target changes on the revision no longer require a per-target
 *   reason (optional note only); the overall revision reason is required when
 *   the revised SDBIP itself is submitted.
 * - New KPIs on the revision get the next KPI number without renumbering.
 */

let server: Server;
let baseUrl: string;
let username: string;
let userId: number;
let cycleId: number;
let originalId: number;
let revisionId: number;
let origKpi1: number, origKpi2: number;
const cleanupScorecardIds: number[] = [];

const SNAPSHOT = [
  { fieldKind: "primary", fieldKey: "kpiNumber", fieldLabel: "KPI No", isIncluded: true, isRequired: true, sortOrder: 0, fieldType: "text" },
  { fieldKind: "primary", fieldKey: "description", fieldLabel: "Indicator", isIncluded: true, isRequired: true, sortOrder: 1, fieldType: "textarea" },
];

async function req(method: string, path: string, body?: unknown): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: { "X-User": username, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

before(async () => {
  username = `test_copyreopen_${Date.now()}`;
  const [user] = await db.insert(usersTable).values({
    username, displayName: "Copy-on-reopen Test", email: `${username}@test.local`, role: "system_admin",
  }).returning();
  userId = user.id;

  const [cycle] = await db.insert(performanceCyclesTable).values({
    financialYearLabel: `TEST-COPYREOPEN-${Date.now()}`,
    startDate: "2025-07-01", endDate: "2026-06-30", status: "Active",
  }).returning();
  cycleId = cycle.id;

  const [original] = await db.insert(scorecardsTable).values({
    name: "Original SDBIP", cycleId, createdById: userId,
    scorecardType: "organisational", status: "Approved",
    fieldConfigSnapshot: SNAPSHOT as unknown as Record<string, unknown>[],
  }).returning();
  originalId = original.id;
  cleanupScorecardIds.push(originalId);

  const kpis = await db.insert(scorecardKpisTable).values([
    { scorecardId: originalId, kpiNumber: "1", description: "Original KPI 1", annualTarget: "100", weighting: 50, status: "Approved", sortOrder: 0 },
    { scorecardId: originalId, kpiNumber: "2", description: "Original KPI 2", annualTarget: "40", weighting: 50, status: "Approved", sortOrder: 1 },
  ]).returning();
  origKpi1 = kpis[0].id;
  origKpi2 = kpis[1].id;

  await db.insert(kpiQuarterTargetsTable).values([
    { kpiId: origKpi1, quarter: 1, targetValue: "25" },
    { kpiId: origKpi1, quarter: 2, targetValue: "50" },
    { kpiId: origKpi2, quarter: 1, targetValue: "10" },
  ]);

  server = app.listen(0);
  const addr = server.address();
  baseUrl = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}/api`;
});

after(async () => {
  server?.close();
  if (cleanupScorecardIds.length) {
    const kpis = await db.select({ id: scorecardKpisTable.id }).from(scorecardKpisTable)
      .where(inArray(scorecardKpisTable.scorecardId, cleanupScorecardIds));
    const kpiIds = kpis.map(k => k.id);
    if (kpiIds.length) await db.delete(kpiQuarterTargetsTable).where(inArray(kpiQuarterTargetsTable.kpiId, kpiIds));
    await db.delete(sdbipRevisionLogsTable).where(inArray(sdbipRevisionLogsTable.scorecardId, cleanupScorecardIds));
    await db.delete(scorecardKpisTable).where(inArray(scorecardKpisTable.scorecardId, cleanupScorecardIds));
    // Delete the revision (child) before the original (FK parent link).
    for (const id of [...cleanupScorecardIds].reverse()) {
      await db.delete(scorecardsTable).where(eq(scorecardsTable.id, id));
    }
  }
  if (cycleId) await db.delete(performanceCyclesTable).where(eq(performanceCyclesTable.id, cycleId));
  if (userId) await db.delete(usersTable).where(eq(usersTable.id, userId));
});

test("revise creates a separate Draft revision with baselined deep copies", async () => {
  const res = await req("POST", `/scorecards/${originalId}/revise`);
  assert.equal(res.status, 201);
  const revision = await res.json() as Record<string, unknown>;
  revisionId = revision.id as number;
  cleanupScorecardIds.push(revisionId);

  assert.equal(revision.scorecardType, "revised");
  assert.equal(revision.parentScorecardId, originalId);
  assert.equal(revision.status, "Draft");
  assert.equal(revision.name, "Original SDBIP (Revised)");
  const snapshot = revision.fieldConfigSnapshot as Array<{ fieldKey: string }>;
  assert.equal(snapshot.length, SNAPSHOT.length, "revision must carry the original's field config snapshot");

  // Deep-copied KPIs: same numbers, Draft status, original untouched.
  const copied = await db.select().from(scorecardKpisTable)
    .where(eq(scorecardKpisTable.scorecardId, revisionId))
    .orderBy(scorecardKpisTable.sortOrder);
  assert.equal(copied.length, 2);
  assert.deepEqual(copied.map(k => k.kpiNumber), ["1", "2"]);
  assert.ok(copied.every(k => k.status === "Draft"));

  // Copied targets frozen as approved baselines.
  const copiedTargets = await db.select().from(kpiQuarterTargetsTable)
    .where(inArray(kpiQuarterTargetsTable.kpiId, copied.map(k => k.id)));
  assert.equal(copiedTargets.length, 3);
  assert.ok(copiedTargets.every(t => t.isApprovedBaseline === true));
  assert.ok(copiedTargets.every(t => t.baselineTargetValue === t.targetValue));

  // Original stays Approved, its KPIs stay Approved.
  const [orig] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, originalId));
  assert.equal(orig.status, "Approved");
  const origKpis = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.scorecardId, originalId));
  assert.ok(origKpis.every(k => k.status === "Approved"));

  // Audit trail seeded with the reopen event.
  const logs = await db.select().from(sdbipRevisionLogsTable).where(eq(sdbipRevisionLogsTable.scorecardId, revisionId));
  assert.ok(logs.some(l => l.revisionType === "scorecard_reopened"));
});

test("revise is idempotent — second call returns the existing revision", async () => {
  const res = await req("POST", `/scorecards/${originalId}/revise`);
  assert.equal(res.status, 200);
  const body = await res.json() as { id: number };
  assert.equal(body.id, revisionId);

  const revisions = await db.select().from(scorecardsTable)
    .where(eq(scorecardsTable.parentScorecardId, originalId));
  assert.equal(revisions.length, 1, "no duplicate revision may be created");
});

test("original becomes read-only once a revision exists", async () => {
  // Scorecard 'reopen' transition is blocked.
  const t1 = await req("POST", `/scorecards/${originalId}/transition`, { action: "reopen" });
  assert.equal(t1.status, 400);

  // KPI 'reopen' transition is blocked.
  const t2 = await req("POST", `/scorecard-kpis/${origKpi1}/transition`, { action: "reopen" });
  assert.equal(t2.status, 400);

  // Target edits on the original are blocked entirely.
  const t3 = await req("PUT", `/scorecard-kpis/${origKpi1}/quarter-targets`, {
    targets: [{ quarter: 1, targetValue: "999" }],
  });
  assert.equal(t3.status, 400);
  const [row] = await db.select().from(kpiQuarterTargetsTable)
    .where(eq(kpiQuarterTargetsTable.kpiId, origKpi1));
  assert.notEqual(row.targetValue, "999", "original targets must stay untouched");
});

test("baselined target change works without a per-target reason; optional note is stored", async () => {
  const [revKpi1] = await db.select().from(scorecardKpisTable)
    .where(eq(scorecardKpisTable.scorecardId, revisionId))
    .orderBy(scorecardKpisTable.sortOrder);

  // Changing a baselined value WITHOUT a reason is now allowed (the overall
  // reason is enforced at revised-SDBIP submission instead).
  const noReason = await req("PUT", `/scorecard-kpis/${revKpi1.id}/quarter-targets`, {
    targets: [{ quarter: 1, targetValue: "28" }],
  });
  assert.equal(noReason.status, 200);

  // Re-saving the SAME value also fine.
  const unchanged = await req("PUT", `/scorecard-kpis/${revKpi1.id}/quarter-targets`, {
    targets: [{ quarter: 1, targetValue: "28" }],
  });
  assert.equal(unchanged.status, 200);

  // Restore then change WITH a reason to check the note is stored.
  await req("PUT", `/scorecard-kpis/${revKpi1.id}/quarter-targets`, {
    targets: [{ quarter: 1, targetValue: "25" }],
  });

  // Changing it WITH a reason succeeds and records the reason.
  const withReason = await req("PUT", `/scorecard-kpis/${revKpi1.id}/quarter-targets`, {
    targets: [{ quarter: 1, targetValue: "30", revisionReason: "Budget adjustment" }],
  });
  assert.equal(withReason.status, 200);
  const targets = await db.select().from(kpiQuarterTargetsTable)
    .where(eq(kpiQuarterTargetsTable.kpiId, revKpi1.id));
  const q1 = targets.find(t => t.quarter === 1);
  assert.equal(q1?.targetValue, "30");
  assert.equal(q1?.revisionReason, "Budget adjustment");
  assert.equal(q1?.baselineTargetValue, "25", "baseline must stay frozen at the approved value");
});

test("new KPI on the revision gets the next number, no renumbering", async () => {
  const res = await req("POST", `/scorecards/${revisionId}/kpis`, {
    kpiNumber: "ignored", description: "Added during revision", annualTarget: "5", weighting: 10,
  });
  assert.equal(res.status, 201);
  const created = await res.json() as { kpiNumber: string; id: number };
  assert.equal(created.kpiNumber, "3");

  const all = await db.select().from(scorecardKpisTable)
    .where(eq(scorecardKpisTable.scorecardId, revisionId))
    .orderBy(scorecardKpisTable.sortOrder);
  assert.deepEqual(all.map(k => k.kpiNumber), ["1", "2", "3"], "copied KPIs keep their numbers");

  // The added KPI has no baselined targets — it reads as "New" on the UI.
  const addedTargets = await db.select().from(kpiQuarterTargetsTable)
    .where(eq(kpiQuarterTargetsTable.kpiId, created.id));
  assert.ok(addedTargets.every(t => !t.isApprovedBaseline));
});

test("in-place reopen is rejected even before a revision exists — original never mutates", async () => {
  // Fresh approved organisational SDBIP with NO revision.
  const [sc] = await db.insert(scorecardsTable).values({
    name: "Untouched SDBIP", cycleId, createdById: userId,
    scorecardType: "organisational", status: "Approved",
    approvedById: userId, approvedAt: new Date(),
    fieldConfigSnapshot: SNAPSHOT as unknown as Record<string, unknown>[],
  }).returning();
  cleanupScorecardIds.push(sc.id);
  const [kpi] = await db.insert(scorecardKpisTable).values({
    scorecardId: sc.id, kpiNumber: "1", description: "Locked KPI",
    annualTarget: "10", weighting: 100, status: "Approved",
  }).returning();
  await db.insert(kpiQuarterTargetsTable).values({
    kpiId: kpi.id, quarter: 1, targetValue: "10",
    isApprovedBaseline: true, baselineTargetValue: "10",
  });

  // Scorecard-level reopen -> 400, nothing mutates.
  const t1 = await req("POST", `/scorecards/${sc.id}/transition`, { action: "reopen", comments: "try unlock" });
  assert.equal(t1.status, 400);
  const [after] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, sc.id));
  assert.equal(after.status, "Approved");
  assert.equal(after.approvedById, userId, "approval metadata must survive");
  assert.ok(Array.isArray(after.fieldConfigSnapshot) && after.fieldConfigSnapshot.length > 0, "snapshot must survive");

  // KPI-level reopen -> 400, KPI stays Approved, baseline stays frozen.
  const t2 = await req("POST", `/scorecard-kpis/${kpi.id}/transition`, { action: "reopen" });
  assert.equal(t2.status, 400);
  const [kpiAfter] = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.id, kpi.id));
  assert.equal(kpiAfter.status, "Approved");
  const [tgt] = await db.select().from(kpiQuarterTargetsTable).where(eq(kpiQuarterTargetsTable.kpiId, kpi.id));
  assert.equal(tgt.isApprovedBaseline, true);
  assert.equal(tgt.baselineTargetValue, "10");
});

test("submitting a revised SDBIP requires ONE overall revision reason", async () => {
  // Without a reason -> 400.
  const noReason = await req("POST", `/scorecards/${revisionId}/transition`, { action: "submit" });
  assert.equal(noReason.status, 400);
  const noReasonBody = await noReason.json() as { error: string };
  assert.match(noReasonBody.error, /revision reason/i);

  // With a reason -> 200 and the reason is recorded in the revision log.
  const ok = await req("POST", `/scorecards/${revisionId}/transition`, {
    action: "submit", comments: "Mid-year budget adjustment approved by Council",
  });
  assert.equal(ok.status, 200);
  const logs = await db.select().from(sdbipRevisionLogsTable)
    .where(eq(sdbipRevisionLogsTable.scorecardId, revisionId));
  const submitted = logs.filter(l => l.revisionType === "revision_submitted");
  assert.ok(submitted.some(l => l.revisionReason === "Mid-year budget adjustment approved by Council"),
    "overall revision reason must be recorded in the revision log at submission");
});

test("approving and reopening a REVISION keeps the copied original baselines", async () => {
  // Approve the revision THROUGH the API so the approve path's baseline
  // handling runs (all KPIs must be Approved first — set directly, KPI
  // review flow is not under test here).
  const revKpis = await db.select().from(scorecardKpisTable)
    .where(eq(scorecardKpisTable.scorecardId, revisionId));
  await db.update(scorecardKpisTable).set({ status: "Approved" })
    .where(eq(scorecardKpisTable.scorecardId, revisionId));
  await db.update(scorecardsTable).set({ status: "Reviewed" })
    .where(eq(scorecardsTable.id, revisionId));
  const approve = await req("POST", `/scorecards/${revisionId}/transition`, { action: "approve" });
  assert.equal(approve.status, 200);

  // KPI 1's Q1 was revised 25 -> 30 earlier. Approval must NOT overwrite the
  // copied baseline (25) with the revised value (30) — it anchors the
  // Revised/Unchanged comparison against the original SDBIP.
  const revKpi1 = revKpis.find(k => k.kpiNumber === "1")!;
  const [q1AfterApprove] = (await db.select().from(kpiQuarterTargetsTable)
    .where(eq(kpiQuarterTargetsTable.kpiId, revKpi1.id))).filter(t => t.quarter === 1);
  assert.equal(q1AfterApprove.targetValue, "30");
  assert.equal(q1AfterApprove.baselineTargetValue, "25", "approve must not overwrite copied baselines");
  assert.equal(q1AfterApprove.isApprovedBaseline, true);

  // The KPI added during the revision (no baseline) gets baselined at approval.
  const addedKpi = (await db.select().from(scorecardKpisTable)
    .where(eq(scorecardKpisTable.scorecardId, revisionId))).find(k => k.kpiNumber === "3")!;
  const addedTargets = await db.select().from(kpiQuarterTargetsTable)
    .where(eq(kpiQuarterTargetsTable.kpiId, addedKpi.id));
  assert.ok(addedTargets.every(t => t.isApprovedBaseline && t.baselineTargetValue === t.targetValue));

  const t = await req("POST", `/scorecards/${revisionId}/transition`, { action: "reopen", comments: "further changes" });
  assert.equal(t.status, 200);
  const [rev] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, revisionId));
  assert.equal(rev.status, "Draft");
  assert.equal(rev.approvedById, null);
  assert.ok(Array.isArray(rev.fieldConfigSnapshot) && rev.fieldConfigSnapshot.length > 0,
    "revision keeps the original's field-config snapshot");
  const kpisAfter = await db.select().from(scorecardKpisTable)
    .where(eq(scorecardKpisTable.scorecardId, revisionId));
  assert.ok(kpisAfter.every(k => k.status === "Draft"));
  const targets = await db.select().from(kpiQuarterTargetsTable)
    .where(inArray(kpiQuarterTargetsTable.kpiId, revKpis.map(k => k.id)));
  assert.ok(targets.filter(x => x.baselineTargetValue !== null).every(x => x.isApprovedBaseline === true),
    "copied baselines stay frozen so Revised/Unchanged comparison survives reopen");
});

test("revise rejects non-approved and non-organisational scorecards", async () => {
  const [draft] = await db.insert(scorecardsTable).values({
    name: "Draft SDBIP", cycleId, createdById: userId,
    scorecardType: "organisational", status: "Draft",
  }).returning();
  cleanupScorecardIds.push(draft.id);
  const r1 = await req("POST", `/scorecards/${draft.id}/revise`);
  assert.equal(r1.status, 400);

  const r2 = await req("POST", `/scorecards/${revisionId}/revise`);
  assert.equal(r2.status, 400, "a revision itself cannot be revised");
});
