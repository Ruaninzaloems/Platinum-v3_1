import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import app from "../app";
import { db } from "@workspace/db";
import {
  usersTable, performanceCyclesTable, scorecardsTable, scorecardKpisTable,
  kpiQuarterTargetsTable, kpiQuarterActualsTable,
  deptScorecardsTable, deptScorecardKpisTable, departmentsTable,
} from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * Guards the Revised-SDBIP effective-set behaviour across the dashboard
 * endpoints. Seeds a cycle where:
 * - the top-layer SDBIP has KPIs "1" and "2"
 * - a Revised SDBIP supersedes KPI "2" and adds KPI "3"
 * - actuals for KPI "2" are split across the ORIGINAL and REVISED KPI ids
 * - a departmental KPI inherits from the SUPERSEDED original KPI "2"
 *
 * Effective KPI set must be: top "1", revised "2", revised "3" (3 KPIs).
 * If any endpoint bypasses the shared resolver, totals double-count (4 KPIs)
 * or actuals captured against the other version vanish — these tests fail.
 */

let server: Server;
let baseUrl: string;
let username: string;
let userId: number;
let cycleId: number;
let topScorecardId: number;
let revisedScorecardId: number;
let deptScorecardId: number;
let deptKpiId: number;
const departmentId = 987001;
let orgDeptId: number;
let orgDeptName: string;
let postUserId: number;
const kpiIds: number[] = [];
let orig1: number, orig2: number, rev2: number, rev3: number;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, { headers: { "X-User": username } });
  assert.equal(res.status, 200, `GET ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

before(async () => {
  username = `test_revsdbip_${Date.now()}`;
  const [user] = await db.insert(usersTable).values({
    username, displayName: "Revised SDBIP Test", email: `${username}@test.local`, role: "admin",
  }).returning();
  userId = user.id;

  const [cycle] = await db.insert(performanceCyclesTable).values({
    financialYearLabel: `TEST-REV-${Date.now()}`,
    startDate: "2025-07-01", endDate: "2026-06-30", status: "Active",
  }).returning();
  cycleId = cycle.id;

  // Department for top-layer post attribution: the ORIGINAL KPI "2" carries
  // the responsible post; its Approved revision does not and must inherit it.
  orgDeptName = `Rev Post Dept ${Date.now()}`;
  const [orgDept] = await db.insert(departmentsTable).values({ name: orgDeptName, cycleId }).returning();
  orgDeptId = orgDept.id;
  const [postUser] = await db.insert(usersTable).values({
    username: `${username}_rp`, displayName: "Rev Post", email: `${username}_rp@test.local`,
    role: "responsible_post", departmentId: orgDeptId,
  }).returning();
  postUserId = postUser.id;

  const [top] = await db.insert(scorecardsTable).values({
    name: "Top-layer SDBIP", cycleId, createdById: userId,
  }).returning();
  topScorecardId = top.id;

  const [revised] = await db.insert(scorecardsTable).values({
    name: "Revised SDBIP", cycleId, createdById: userId, scorecardType: "revised",
    // Only an Approved (locked-down) Revised SDBIP supersedes the Original.
    status: "Approved",
  }).returning();
  revisedScorecardId = revised.id;

  const kpi = (scorecardId: number, kpiNumber: string, description: string) => ({
    scorecardId, kpiNumber, description,
    annualTarget: "100", weighting: 1, status: "Approved",
  });
  const topKpis = await db.insert(scorecardKpisTable).values([
    kpi(topScorecardId, "1", "Top KPI 1 (not superseded)"),
    { ...kpi(topScorecardId, "2", "Top KPI 2 (superseded by revision)"), responsiblePostId: postUserId },
  ]).returning();
  const revKpis = await db.insert(scorecardKpisTable).values([
    kpi(revisedScorecardId, "2", "Revised KPI 2 (supersedes top KPI 2)"),
    kpi(revisedScorecardId, "3", "Revised KPI 3 (added in revision)"),
  ]).returning();
  orig1 = topKpis[0].id;
  orig2 = topKpis[1].id;
  rev2 = revKpis[0].id;
  rev3 = revKpis[1].id;
  kpiIds.push(orig1, orig2, rev2, rev3);

  // Targets live on the EFFECTIVE KPI (revised targets supersede).
  const t = (kpiId: number, quarter: number, targetValue: string) => ({ kpiId, quarter, targetValue });
  await db.insert(kpiQuarterTargetsTable).values([
    t(orig1, 1, "10"),
    t(rev2, 1, "10"),
    t(rev2, 2, "10"),
    t(rev3, 1, "10"),
  ]);

  // Actuals for KPI "2" are deliberately split across the original and the
  // revised KPI ids. For Q1 both versions have a capture — the later insert
  // (against the revised id) must win, counting exactly once.
  const a = (kpiId: number, quarter: number, actualValue: string, isAchieved: boolean | null) =>
    ({ kpiId, quarter, actualValue, isAchieved, isOnHold: false, submittedById: userId });
  await db.insert(kpiQuarterActualsTable).values([a(orig2, 1, "3", false)]);
  await db.insert(kpiQuarterActualsTable).values([
    a(orig1, 1, "10", true),   // effective KPI 1: achieved
    a(rev2, 1, "12", true),    // supersedes the orig2 Q1 capture above
    a(orig2, 2, "0", false),   // Q2 captured against the ORIGINAL id — must alias to rev2
    a(rev3, 1, "11", true),    // KPI added in revision: achieved
  ]);

  // Departmental KPI inheriting from the SUPERSEDED original KPI "2".
  const [deptSc] = await db.insert(deptScorecardsTable).values({
    name: "Dept Scorecard (Revised SDBIP test)", cycleId,
    departmentId, departmentName: "Revised Test Dept", createdById: userId,
  }).returning();
  deptScorecardId = deptSc.id;
  const [deptKpi] = await db.insert(deptScorecardKpisTable).values({
    deptScorecardId, parentKpiId: orig2, kpiNumber: "D1",
    description: "Inherited from superseded KPI 2", annualTarget: "100",
    weighting: 1, isInherited: true,
  }).returning();
  deptKpiId = deptKpi.id;

  server = app.listen(0);
  const addr = server.address();
  baseUrl = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}/api`;
});

after(async () => {
  server?.close();
  if (deptKpiId) await db.delete(deptScorecardKpisTable).where(eq(deptScorecardKpisTable.id, deptKpiId));
  if (deptScorecardId) await db.delete(deptScorecardsTable).where(eq(deptScorecardsTable.id, deptScorecardId));
  if (kpiIds.length) {
    await db.delete(kpiQuarterActualsTable).where(inArray(kpiQuarterActualsTable.kpiId, kpiIds));
    await db.delete(kpiQuarterTargetsTable).where(inArray(kpiQuarterTargetsTable.kpiId, kpiIds));
    await db.delete(scorecardKpisTable).where(inArray(scorecardKpisTable.id, kpiIds));
  }
  if (revisedScorecardId) await db.delete(scorecardsTable).where(eq(scorecardsTable.id, revisedScorecardId));
  if (topScorecardId) await db.delete(scorecardsTable).where(eq(scorecardsTable.id, topScorecardId));
  if (postUserId) await db.delete(usersTable).where(eq(usersTable.id, postUserId));
  if (orgDeptId) await db.delete(departmentsTable).where(eq(departmentsTable.id, orgDeptId));
  if (cycleId) await db.delete(performanceCyclesTable).where(eq(performanceCyclesTable.id, cycleId));
  if (userId) await db.delete(usersTable).where(eq(usersTable.id, userId));
});

test("executive: effective set counts 3 KPIs, latest actual per version wins", async () => {
  type Exec = {
    totalKpis: number; achieved: number; notAchieved: number; atRisk: number; onHold: number;
    departmentScores: Array<{ departmentId: number; score: number; kpiCount: number }>;
  };
  const body = await get<Exec>(`/dashboards/executive?cycleId=${cycleId}`);
  // 3 effective KPIs, not 4: revised "2" supersedes top "2".
  assert.equal(body.totalKpis, 3);
  // KPI 1 achieved, KPI 3 achieved; KPI 2's latest actual is the Q2 "not
  // achieved" captured against the ORIGINAL id, aliased to the revised KPI.
  assert.equal(body.achieved, 2);
  assert.equal(body.notAchieved, 1);
  assert.equal(body.atRisk, 0);
  assert.equal(body.onHold, 0);

  // Department linked to the superseded original: its inherited KPI must
  // resolve to the revised version and see BOTH quarters' actuals (Q1
  // achieved + Q2 not achieved -> 50%).
  const dept = body.departmentScores.find(d => d.departmentId === departmentId);
  assert.ok(dept, "department row missing");
  assert.equal(dept.kpiCount, 1);
  assert.equal(dept.score, 50);
});

test("overview: totals and quarter tallies dedupe across versions", async () => {
  type Overview = {
    orgSummary: { totalKpis: number; achievedPct: number };
    quarterComparison: Array<{ quarter: number; achieved: number; notAchieved: number }>;
  };
  const body = await get<Overview>(`/dashboards/overview?cycleId=${cycleId}`);
  assert.equal(body.orgSummary.totalKpis, 3);
  // Q1: exactly 3 achieved actuals — the orig2 Q1 capture was superseded by
  // the rev2 capture, so it must NOT appear as a 4th actual or a notAchieved.
  const q1 = body.quarterComparison.find(q => q.quarter === 1)!;
  assert.deepEqual({ achieved: q1.achieved, notAchieved: q1.notAchieved }, { achieved: 3, notAchieved: 0 });
  // Q2: the single actual captured against the ORIGINAL id still counts.
  const q2 = body.quarterComparison.find(q => q.quarter === 2)!;
  assert.deepEqual({ achieved: q2.achieved, notAchieved: q2.notAchieved }, { achieved: 0, notAchieved: 1 });
});

test("trendline: quarter totals count each effective KPI once", async () => {
  type Trendline = {
    totalKpis: number;
    quarters: Array<{ quarter: number; achieved: number; notAchieved: number; total: number }>;
  };
  const body = await get<Trendline>(`/dashboards/trendline?cycleId=${cycleId}`);
  assert.equal(body.totalKpis, 3);
  const q1 = body.quarters.find(q => q.quarter === 1)!;
  assert.deepEqual(
    { achieved: q1.achieved, notAchieved: q1.notAchieved, total: q1.total },
    { achieved: 3, notAchieved: 0, total: 3 },
  );
  const q2 = body.quarters.find(q => q.quarter === 2)!;
  assert.deepEqual(
    { achieved: q2.achieved, notAchieved: q2.notAchieved, total: q2.total },
    { achieved: 0, notAchieved: 1, total: 1 },
  );
});

test("kpi-status-summary: distribution over the effective set only", async () => {
  type Summary = { totalKpis: number; distribution: Array<{ status: string; count: number }> };
  const body = await get<Summary>(`/dashboards/kpi-status-summary?cycleId=${cycleId}`);
  assert.equal(body.totalKpis, 3);
  const count = (s: string) => body.distribution.find(d => d.status === s)?.count;
  assert.equal(count("Achieved"), 2);
  assert.equal(count("Not Achieved"), 1);
  assert.equal(count("At Risk"), 0);
  assert.equal(count("On Hold"), 0);
  assert.equal(count("No Data"), 0);
});

test("department dashboard: inherited KPI pointing at a superseded original aliases to the revised KPI", async () => {
  type Dept = {
    overallScore: number;
    kpiHeatmap: Array<{ kpiId: number; q1Status: string; q2Status: string }>;
    quarterTrend: Array<{ quarter: number; score: number }>;
  };
  const body = await get<Dept>(`/dashboards/department/${departmentId}?cycleId=${cycleId}`);
  // Both quarters' actuals (across original+revised ids) count: 1 of 2 achieved.
  assert.equal(body.overallScore, 50);
  const row = body.kpiHeatmap.find(r => r.kpiId === deptKpiId);
  assert.ok(row, "heatmap row missing");
  assert.equal(row.q1Status, "Achieved");      // superseding rev2 Q1 capture
  assert.equal(row.q2Status, "Not Achieved");  // orig-id Q2 capture, aliased
  assert.equal(body.quarterTrend.find(q => q.quarter === 1)!.score, 100);
  assert.equal(body.quarterTrend.find(q => q.quarter === 2)!.score, 0);
});

test("org-scorecard byDepartment: revised KPI without a post inherits the superseded original's department", async () => {
  type Row = { name: string; targetsSet: number };
  type Body = { byDepartment: Row[]; departmentTotal: { targetsSet: number }; nkpaTotal: { targetsSet: number } };
  const body = await get<Body>(`/dashboards/org-scorecard?cycleId=${cycleId}`);
  // rev2 (the effective KPI "2") has NO responsible post of its own; its two
  // targets must be attributed to the ORIGINAL KPI 2's department via the
  // alias fallback — never to departmental SDBIP data.
  const dept = body.byDepartment.find(r => r.name === orgDeptName);
  assert.ok(dept, "aliased department row missing");
  assert.equal(dept.targetsSet, 2); // rev2 Q1 + Q2 targets
  // KPIs 1 and 3 have no posts anywhere in their version chain.
  const unassigned = body.byDepartment.find(r => r.name === "Unassigned");
  assert.ok(unassigned, "Unassigned row missing");
  assert.equal(unassigned.targetsSet, 2); // orig1 Q1 + rev3 Q1
  assert.equal(body.departmentTotal.targetsSet, body.nkpaTotal.targetsSet);
});
