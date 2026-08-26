import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import app from "../app";
import { db } from "@workspace/db";
import {
  usersTable, performanceCyclesTable, scorecardsTable, scorecardKpisTable,
  kpiQuarterActualsTable, deptScorecardsTable, deptScorecardKpisTable,
} from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * Guards the global period filter (?period=q1..q4|mid_year|annual) on the
 * directorate-heatmap and municipal-health endpoints. Seeds one KPI with a
 * Q1 achieved actual and a Q3 not-achieved actual:
 * - q1 must see only the Q1 capture (achieved), q3 only the Q3 one.
 * - mid_year restricts to quarters 1–2; annual/absent covers all four.
 */

let server: Server;
let baseUrl: string;
let username: string;
let userId: number;
let cycleId: number;
let scorecardId: number;
let deptScorecardId: number;
let deptKpiId: number;
let kpiId: number;
const departmentId = 987002;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, { headers: { "X-User": username } });
  assert.equal(res.status, 200, `GET ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

before(async () => {
  username = `test_period_${Date.now()}`;
  const [user] = await db.insert(usersTable).values({
    username, displayName: "Period Filter Test", email: `${username}@test.local`, role: "admin",
  }).returning();
  userId = user.id;

  const [cycle] = await db.insert(performanceCyclesTable).values({
    financialYearLabel: `TEST-PERIOD-${Date.now()}`,
    startDate: "2025-07-01", endDate: "2026-06-30", status: "Active",
  }).returning();
  cycleId = cycle.id;

  const [sc] = await db.insert(scorecardsTable).values({
    name: "Period Test SDBIP", cycleId, createdById: userId,
  }).returning();
  scorecardId = sc.id;

  const [kpi] = await db.insert(scorecardKpisTable).values({
    scorecardId, kpiNumber: "1", description: "Period test KPI",
    annualTarget: "100", weighting: 1, status: "Approved",
  }).returning();
  kpiId = kpi.id;

  await db.insert(kpiQuarterActualsTable).values([
    { kpiId, quarter: 1, actualValue: "10", isAchieved: true, isOnHold: false, submittedById: userId },
    { kpiId, quarter: 3, actualValue: "0", isAchieved: false, isOnHold: false, submittedById: userId },
  ]);

  const [deptSc] = await db.insert(deptScorecardsTable).values({
    name: "Dept Scorecard (period test)", cycleId,
    departmentId, departmentName: "Period Test Dept", createdById: userId,
  }).returning();
  deptScorecardId = deptSc.id;
  const [deptKpi] = await db.insert(deptScorecardKpisTable).values({
    deptScorecardId, parentKpiId: kpiId, kpiNumber: "D1",
    description: "Inherited", annualTarget: "100", weighting: 1, isInherited: true,
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
  if (kpiId) {
    await db.delete(kpiQuarterActualsTable).where(inArray(kpiQuarterActualsTable.kpiId, [kpiId]));
    await db.delete(scorecardKpisTable).where(eq(scorecardKpisTable.id, kpiId));
  }
  if (scorecardId) await db.delete(scorecardsTable).where(eq(scorecardsTable.id, scorecardId));
  if (cycleId) await db.delete(performanceCyclesTable).where(eq(performanceCyclesTable.id, cycleId));
  if (userId) await db.delete(usersTable).where(eq(usersTable.id, userId));
});

type Heatmap = {
  directorates: Array<{
    departmentId: number;
    quarters: Array<{ quarter: number; status: string; performance: number | null }>;
  }>;
};

function heatRow(body: Heatmap) {
  const row = body.directorates.find(d => d.departmentId === departmentId);
  assert.ok(row, "directorate row missing");
  return row;
}

test("directorate-heatmap: period restricts quarter columns and data", async () => {
  const annual = heatRow(await get<Heatmap>(`/dashboards/directorate-heatmap?cycleId=${cycleId}`));
  assert.deepEqual(annual.quarters.map(q => q.quarter), [1, 2, 3, 4]);
  assert.equal(annual.quarters[0].performance, 100); // Q1 achieved
  assert.equal(annual.quarters[2].performance, 0);   // Q3 not achieved

  const q1 = heatRow(await get<Heatmap>(`/dashboards/directorate-heatmap?cycleId=${cycleId}&period=q1`));
  assert.deepEqual(q1.quarters.map(q => q.quarter), [1]);
  assert.equal(q1.quarters[0].performance, 100);

  const mid = heatRow(await get<Heatmap>(`/dashboards/directorate-heatmap?cycleId=${cycleId}&period=mid_year`));
  assert.deepEqual(mid.quarters.map(q => q.quarter), [1, 2]);
});

type Health = { performance: number; hasData: boolean };

test("municipal-health: performance follows the selected period's actuals", async () => {
  // Annual: latest actual in range is Q3 (not achieved).
  const annual = await get<Health>(`/dashboards/municipal-health?cycleId=${cycleId}`);
  assert.equal(annual.performance, 0);

  // Q1 / mid-year: only the Q1 achieved capture is in range.
  const q1 = await get<Health>(`/dashboards/municipal-health?cycleId=${cycleId}&period=q1`);
  assert.equal(q1.performance, 100);
  const mid = await get<Health>(`/dashboards/municipal-health?cycleId=${cycleId}&period=mid_year`);
  assert.equal(mid.performance, 100);

  // Q3: only the not-achieved capture.
  const q3 = await get<Health>(`/dashboards/municipal-health?cycleId=${cycleId}&period=q3`);
  assert.equal(q3.performance, 0);
});
