import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import app from "../app";
import { db } from "@workspace/db";
import {
  usersTable, performanceCyclesTable, scorecardsTable, scorecardKpisTable,
  kpiQuarterActualsTable,
} from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";

let server: Server;
let baseUrl: string;
let username: string;
let userId: number;
let cycleId: number;
const kpiIds: number[] = [];
const scorecardIds: number[] = [];

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, { headers: { "X-User": username } });
  assert.equal(res.status, 200, `GET ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

before(async () => {
  username = `test_sctype_${Date.now()}`;
  const [user] = await db.insert(usersTable).values({
    username, displayName: "Scorecard Type Test", email: `${username}@test.local`, role: "admin",
  }).returning();
  userId = user.id;

  const [cycle] = await db.insert(performanceCyclesTable).values({
    financialYearLabel: `TEST-SCTYPE-${Date.now()}`,
    startDate: "2025-07-01", endDate: "2026-06-30", status: "Active",
  }).returning();
  cycleId = cycle.id;

  // Original SDBIP with 2 KPIs.
  const [orgSc] = await db.insert(scorecardsTable).values({
    name: "Org SDBIP", cycleId, scorecardType: "organisational", createdById: userId,
  }).returning();
  scorecardIds.push(orgSc.id);
  const orgKpis = await db.insert(scorecardKpisTable).values([
    { scorecardId: orgSc.id, kpiNumber: "1", description: "Org KPI 1", annualTarget: "10", weighting: 1, status: "Approved" },
    { scorecardId: orgSc.id, kpiNumber: "2", description: "Org KPI 2", annualTarget: "10", weighting: 1, status: "Approved" },
  ]).returning();
  for (const k of orgKpis) kpiIds.push(k.id);

  // Departmental-type scorecard in the same cycle: must be excluded from
  // organisational dashboards (Performance Trend etc.).
  const [deptSc] = await db.insert(scorecardsTable).values({
    name: "Dept scorecard", cycleId, scorecardType: "departmental", createdById: userId,
  }).returning();
  scorecardIds.push(deptSc.id);
  const [deptKpi] = await db.insert(scorecardKpisTable).values({
    scorecardId: deptSc.id, kpiNumber: "DPT-1", description: "Dept KPI", annualTarget: "10", weighting: 1, status: "Approved",
  }).returning();
  kpiIds.push(deptKpi.id);

  // An actual against the departmental KPI must not count either.
  await db.insert(kpiQuarterActualsTable).values({
    kpiId: deptKpi.id, quarter: 1, actualValue: "10", isAchieved: true, submittedById: userId,
  });

  // A Revised SDBIP that is not yet Approved must NOT supersede the Original:
  // its KPIs (duplicate number "1" plus a new "99") stay out of dashboards.
  const [draftRevised] = await db.insert(scorecardsTable).values({
    name: "Draft revised", cycleId, scorecardType: "revised", status: "Draft", createdById: userId,
  }).returning();
  scorecardIds.push(draftRevised.id);
  const draftKpis = await db.insert(scorecardKpisTable).values([
    { scorecardId: draftRevised.id, kpiNumber: "1", description: "Org KPI 1 (rev draft)", annualTarget: "10", weighting: 1, status: "Draft" },
    { scorecardId: draftRevised.id, kpiNumber: "99", description: "New KPI (rev draft)", annualTarget: "10", weighting: 1, status: "Draft" },
  ]).returning();
  for (const k of draftKpis) kpiIds.push(k.id);

  server = app.listen(0);
  const addr = server.address();
  baseUrl = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}/api`;
});

after(async () => {
  server?.close();
  if (kpiIds.length) {
    await db.delete(kpiQuarterActualsTable).where(inArray(kpiQuarterActualsTable.kpiId, kpiIds));
    await db.delete(scorecardKpisTable).where(inArray(scorecardKpisTable.id, kpiIds));
  }
  if (scorecardIds.length) await db.delete(scorecardsTable).where(inArray(scorecardsTable.id, scorecardIds));
  await db.delete(performanceCyclesTable).where(eq(performanceCyclesTable.id, cycleId));
  await db.delete(usersTable).where(eq(usersTable.id, userId));
});

test("trendline only counts Original/Revised SDBIP KPIs and their actuals", async () => {
  const data = await get<{ totalKpis: number; quarters: Array<{ quarter: number; total: number; achieved: number }> }>(
    `/dashboards/trendline?cycleId=${cycleId}`,
  );
  assert.equal(data.totalKpis, 2, "departmental-type KPIs must be excluded");
  const q1 = data.quarters.find(q => q.quarter === 1);
  assert.ok(q1);
  assert.equal(q1.total, 0, "actuals captured against departmental KPIs must not count");
  assert.equal(q1.achieved, 0);
});

test("overview only counts Original/Revised SDBIP KPIs", async () => {
  const data = await get<{ orgSummary: { totalKpis: number } }>(`/dashboards/overview?cycleId=${cycleId}`);
  assert.equal(data.orgSummary.totalKpis, 2);
});
