import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import app from "../app";
import { db } from "@workspace/db";
import {
  usersTable, performanceCyclesTable, scorecardsTable, scorecardKpisTable,
  kpiQuarterTargetsTable, kpiQuarterActualsTable, kpiGroupsTable,
  deptScorecardsTable, deptScorecardKpisTable, departmentsTable,
} from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";

let server: Server;
let baseUrl: string;
let username: string;
let userId: number;
let cycleId: number;
let groupId: number;
let deptScId: number;
let orgDeptId: number;
let postUserId: number;
const kpiIds: number[] = [];
const deptKpiIds: number[] = [];
const scorecardIds: number[] = [];

interface Row {
  kpiNumber: string; department: string | null; nationalKpa: string | null;
  indicator: string; quarter: number; target: string | null; actual: string;
  score: number | null; status: string;
}

before(async () => {
  username = `test_orgind_${Date.now()}`;
  const [user] = await db.insert(usersTable).values({
    username, displayName: "Org Indicator Test", email: `${username}@test.local`, role: "admin",
  }).returning();
  userId = user.id;

  const [cycle] = await db.insert(performanceCyclesTable).values({
    financialYearLabel: `TEST-ORGIND-${Date.now()}`,
    startDate: "2025-07-01", endDate: "2026-06-30", status: "Active",
  }).returning();
  cycleId = cycle.id;

  const [group] = await db.insert(kpiGroupsTable).values({
    name: "Basic Service Delivery", code: "BSD", cycleId,
  }).returning();
  groupId = group.id;

  const [sc] = await db.insert(scorecardsTable).values({
    name: "Org SDBIP", cycleId, scorecardType: "organisational", createdById: userId,
  }).returning();
  scorecardIds.push(sc.id);

  // Department attribution comes from the TOP-LAYER KPI's responsible post.
  const [orgDept] = await db.insert(departmentsTable).values({
    name: "Infrastructure Development", cycleId,
  }).returning();
  orgDeptId = orgDept.id;
  const [postUser] = await db.insert(usersTable).values({
    username: `${username}_rp`, displayName: "Infra Post", email: `${username}_rp@test.local`,
    role: "responsible_post", departmentId: orgDeptId,
  }).returning();
  postUserId = postUser.id;

  const kpis = await db.insert(scorecardKpisTable).values([
    { scorecardId: sc.id, kpiNumber: "1", description: "Electricity access", annualTarget: "80", weighting: 1, status: "Approved", kpiGroupId: groupId, responsiblePostId: postUserId },
    { scorecardId: sc.id, kpiNumber: "2", description: "Tuckshops procured", annualTarget: "8", weighting: 1, status: "Approved" },
  ]).returning();
  for (const k of kpis) kpiIds.push(k.id);

  await db.insert(kpiQuarterTargetsTable).values([
    { kpiId: kpis[0].id, quarter: 1, targetValue: "20" },
    { kpiId: kpis[1].id, quarter: 1, targetValue: "2" },
    // Q2 targets with no captured actuals -> Cascaded / Not Captured rows.
    { kpiId: kpis[0].id, quarter: 2, targetValue: "40" },
    { kpiId: kpis[1].id, quarter: 2, targetValue: "4" },
  ]);

  await db.insert(kpiQuarterActualsTable).values([
    { kpiId: kpis[0].id, quarter: 1, actualValue: "20", isAchieved: true, submittedById: userId, status: "Approved", reviewLevel: "internal_audit", reviewStatus: "Approved" },
    { kpiId: kpis[1].id, quarter: 1, actualValue: "1", isAchieved: false, submittedById: userId, status: "In Review", reviewLevel: "director", reviewStatus: "Pending" },
  ]);

  // Departmental cascade link marks KPI 1 as "Cascaded" (status only —
  // department attribution must NOT come from here).
  const [deptSc] = await db.insert(deptScorecardsTable).values({
    name: "Infra dept SDBIP", cycleId, departmentId: 999001, departmentName: "WRONG Dept SDBIP Name", createdById: userId,
  }).returning();
  deptScId = deptSc.id;
  const [dk] = await db.insert(deptScorecardKpisTable).values({
    deptScorecardId: deptSc.id, parentKpiId: kpis[0].id, kpiNumber: "1", description: "Electricity access", annualTarget: "80", weighting: 1, isInherited: true,
  }).returning();
  deptKpiIds.push(dk.id);

  server = app.listen(0);
  const addr = server.address();
  baseUrl = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}/api`;
});

after(async () => {
  server?.close();
  if (deptKpiIds.length) await db.delete(deptScorecardKpisTable).where(inArray(deptScorecardKpisTable.id, deptKpiIds));
  if (deptScId) await db.delete(deptScorecardsTable).where(eq(deptScorecardsTable.id, deptScId));
  if (kpiIds.length) {
    await db.delete(kpiQuarterActualsTable).where(inArray(kpiQuarterActualsTable.kpiId, kpiIds));
    await db.delete(kpiQuarterTargetsTable).where(inArray(kpiQuarterTargetsTable.kpiId, kpiIds));
    await db.delete(scorecardKpisTable).where(inArray(scorecardKpisTable.id, kpiIds));
  }
  if (scorecardIds.length) await db.delete(scorecardsTable).where(inArray(scorecardsTable.id, scorecardIds));
  await db.delete(kpiGroupsTable).where(eq(kpiGroupsTable.id, groupId));
  if (postUserId) await db.delete(usersTable).where(eq(usersTable.id, postUserId));
  if (orgDeptId) await db.delete(departmentsTable).where(eq(departmentsTable.id, orgDeptId));
  await db.delete(performanceCyclesTable).where(eq(performanceCyclesTable.id, cycleId));
  await db.delete(usersTable).where(eq(usersTable.id, userId));
});

test("org-indicator-status returns detail rows with dept, NKPA, score and status labels", async () => {
  const res = await fetch(`${baseUrl}/dashboards/org-indicator-status?cycleId=${cycleId}`, { headers: { "X-User": username } });
  assert.equal(res.status, 200);
  const data = await res.json() as { rows: Row[]; summary: Array<{ status: string; count: number }>; total: number };

  assert.equal(data.total, 4);
  assert.equal(data.rows.length, 4);

  const r1 = data.rows.find(r => r.kpiNumber === "1" && r.quarter === 1);
  assert.ok(r1);
  assert.equal(r1.department, "Infrastructure Development");
  assert.equal(r1.nationalKpa, "Basic Service Delivery");
  assert.equal(r1.quarter, 1);
  assert.equal(r1.target, "20");
  assert.equal(r1.actual, "20");
  assert.equal(r1.score, 100);
  assert.equal(r1.status, "Approved by Internal Audit");

  const r2 = data.rows.find(r => r.kpiNumber === "2" && r.quarter === 1);
  assert.ok(r2);
  assert.equal(r2.department, null);
  assert.equal(r2.nationalKpa, null);
  assert.equal(r2.score, 50);
  assert.equal(r2.status, "Pending Manager Review");

  // Uncaptured Q2 targets: dept-linked KPI shows Cascaded, the other Not Captured.
  const q2a = data.rows.find(r => r.kpiNumber === "1" && r.quarter === 2);
  assert.equal(q2a?.status, "Cascaded");
  assert.equal(q2a?.target, "40");
  assert.equal(q2a?.score, null);
  const q2b = data.rows.find(r => r.kpiNumber === "2" && r.quarter === 2);
  assert.equal(q2b?.status, "Not Captured");

  for (const [status, count] of [
    ["Approved by Internal Audit", 1], ["Pending Manager Review", 1],
    ["Cascaded", 1], ["Not Captured", 1],
  ] as const) {
    assert.equal(data.summary.find(s => s.status === status)?.count, count, status);
  }
});
