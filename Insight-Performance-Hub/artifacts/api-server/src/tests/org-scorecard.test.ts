import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import app from "../app";
import { db } from "@workspace/db";
import {
  usersTable, performanceCyclesTable, scorecardsTable, scorecardKpisTable,
  kpiQuarterTargetsTable, kpiQuarterActualsTable, departmentsTable,
} from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";

let server: Server;
let baseUrl: string;
let username: string;
let userId: number;
let cycleId: number;
let scorecardId: number;
let departmentId: number;
let responsibleUserId: number;
let departmentName: string;
const kpiIds: number[] = [];

type Counts = {
  targetsSet: number; achieved: number; partiallyAchieved: number; notAchieved: number;
  overAchieved: number; onHold: number; notApplicable: number; unableToAssess: number;
};
type OrgScorecardResponse = {
  byNkpa: Array<Counts & { name: string }>;
  nkpaTotal: Counts;
  byDepartment: Array<Counts & { name: string }>;
  departmentTotal: Counts;
};

async function get(path: string): Promise<OrgScorecardResponse> {
  const res = await fetch(`${baseUrl}${path}`, { headers: { "X-User": username } });
  assert.equal(res.status, 200, `GET ${path} -> ${res.status}`);
  return res.json() as Promise<OrgScorecardResponse>;
}

function kpiInsert(n: number) {
  return {
    scorecardId,
    kpiNumber: String(n),
    description: `Test KPI ${n}`,
    annualTarget: "100",
    weighting: 1,
    status: "Approved",
  };
}

before(async () => {
  username = `test_orgsc_${Date.now()}`;
  const [user] = await db.insert(usersTable).values({
    username, displayName: "Org Scorecard Test", email: `${username}@test.local`, role: "admin",
  }).returning();
  userId = user.id;

  const [cycle] = await db.insert(performanceCyclesTable).values({
    financialYearLabel: `TEST-${Date.now()}`,
    startDate: "2025-07-01", endDate: "2026-06-30", status: "Active",
  }).returning();
  cycleId = cycle.id;

  const [sc] = await db.insert(scorecardsTable).values({
    name: "Org Scorecard Test", cycleId, createdById: userId,
  }).returning();
  scorecardId = sc.id;

  // Department attribution comes from the top-layer KPI's responsible post.
  departmentName = `Test Dept ${Date.now()}`;
  const [dept] = await db.insert(departmentsTable).values({ name: departmentName, cycleId }).returning();
  departmentId = dept.id;
  const [respUser] = await db.insert(usersTable).values({
    username: `${username}_rp`, displayName: "Responsible Post", email: `${username}_rp@test.local`,
    role: "responsible_post", departmentId,
  }).returning();
  responsibleUserId = respUser.id;

  // 11 KPIs, each exercising a classification branch in quarter 1.
  const kpis = await db.insert(scorecardKpisTable)
    .values(Array.from({ length: 11 }, (_, i) =>
      // KPI "1" belongs to the test department via its responsible post;
      // the rest have no post and must roll up under "Unassigned".
      ({ ...kpiInsert(i + 1), ...(i === 0 ? { responsiblePostId: responsibleUserId } : {}) })))
    .returning();
  for (const k of kpis) kpiIds.push(k.id);
  const [
    kAchieved, kOver, kPartial, kNotAch, kTargetHold, kActualHold,
    kNa, kNullAssess, kNoActual, kAchievedText, kNotAchText,
  ] = kpiIds;

  const t = (kpiId: number, quarter: number, targetValue: string, targetStatus = "active") =>
    ({ kpiId, quarter, targetValue, targetStatus });
  await db.insert(kpiQuarterTargetsTable).values([
    t(kAchieved, 1, "10"),
    t(kOver, 1, "10"),
    t(kPartial, 1, "10"),
    t(kNotAch, 1, "10"),
    t(kTargetHold, 1, "10", "on_hold"),
    t(kActualHold, 1, "10"),
    t(kNa, 1, "10", "na"),
    t(kNullAssess, 1, "10"),
    t(kNoActual, 1, "10"),
    t(kAchievedText, 1, "Policy adopted"),
    t(kNotAchText, 1, "Policy adopted"),
    // Quarter 2 target for the quarter-filter checks.
    t(kAchieved, 2, "5"),
  ]);

  const a = (kpiId: number, quarter: number, actualValue: string,
    isAchieved: boolean | null, isOnHold = false) =>
    ({ kpiId, quarter, actualValue, isAchieved, isOnHold, submittedById: userId });
  await db.insert(kpiQuarterActualsTable).values([
    a(kAchieved, 1, "10", true),              // achieved (equal, not over)
    a(kOver, 1, "15", true),                  // over achieved (numeric >)
    a(kPartial, 1, "4", false),               // partially achieved (0 < actual < target)
    // Superseded then latest actual: only the newest capture must count.
    a(kNotAch, 1, "12", true),
    a(kNotAch, 1, "0", false),                // not achieved (latest wins)
    a(kTargetHold, 1, "3", true),             // ignored: target itself on hold
    a(kActualHold, 1, "2", null, true),       // on hold via actual flag
    a(kNullAssess, 1, "7", null),             // unable to assess (null assessment)
    a(kAchievedText, 1, "Policy adopted", true),   // achieved (non-numeric, no over-achieve)
    a(kNotAchText, 1, "Draft only", false),        // not achieved (non-numeric)
    a(kAchieved, 2, "0", false),              // Q2: not achieved (zero actual)
  ]);

  server = app.listen(0);
  const addr = server.address();
  baseUrl = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}/api`;
});

after(async () => {
  server?.close();
  if (kpiIds.length) {
    await db.delete(kpiQuarterActualsTable).where(inArray(kpiQuarterActualsTable.kpiId, kpiIds));
    await db.delete(kpiQuarterTargetsTable).where(inArray(kpiQuarterTargetsTable.kpiId, kpiIds));
    await db.delete(scorecardKpisTable).where(inArray(scorecardKpisTable.id, kpiIds));
  }
  if (scorecardId) await db.delete(scorecardsTable).where(eq(scorecardsTable.id, scorecardId));
  if (responsibleUserId) await db.delete(usersTable).where(eq(usersTable.id, responsibleUserId));
  if (departmentId) await db.delete(departmentsTable).where(eq(departmentsTable.id, departmentId));
  if (cycleId) await db.delete(performanceCyclesTable).where(eq(performanceCyclesTable.id, cycleId));
  if (userId) await db.delete(usersTable).where(eq(usersTable.id, userId));
});

test("quarter 1 counts classify every status branch correctly", async () => {
  const body = await get(`/dashboards/org-scorecard?cycleId=${cycleId}&quarter=1`);
  assert.deepEqual(body.nkpaTotal, {
    targetsSet: 11,
    achieved: 2,          // numeric equal + non-numeric achieved
    overAchieved: 1,      // numeric actual > target
    partiallyAchieved: 1, // 0 < actual < target
    notAchieved: 2,       // latest-actual zero + non-numeric not achieved
    onHold: 2,            // target on_hold + actual isOnHold
    notApplicable: 1,     // target flagged na
    unableToAssess: 1,    // null assessment
  });
  // KPI with a target but no actual contributes to targetsSet only:
  const classified = body.nkpaTotal.achieved + body.nkpaTotal.overAchieved
    + body.nkpaTotal.partiallyAchieved + body.nkpaTotal.notAchieved
    + body.nkpaTotal.onHold + body.nkpaTotal.notApplicable + body.nkpaTotal.unableToAssess;
  assert.equal(body.nkpaTotal.targetsSet - classified, 1);
});

test("targets without any captured actual count only toward targets set", async () => {
  const body = await get(`/dashboards/org-scorecard?cycleId=${cycleId}&quarter=2`);
  // Q2 has exactly one target with one (not achieved) actual.
  assert.deepEqual(body.nkpaTotal, {
    targetsSet: 1, achieved: 0, overAchieved: 0, partiallyAchieved: 0,
    notAchieved: 1, onHold: 0, notApplicable: 0, unableToAssess: 0,
  });
});

test("quarter filter: unfiltered response aggregates all quarters", async () => {
  const body = await get(`/dashboards/org-scorecard?cycleId=${cycleId}`);
  assert.equal(body.nkpaTotal.targetsSet, 12); // 11 in Q1 + 1 in Q2
  assert.equal(body.nkpaTotal.notAchieved, 3); // 2 in Q1 + 1 in Q2
  assert.equal(body.nkpaTotal.achieved, 2);
  assert.equal(body.nkpaTotal.overAchieved, 1);
});

test("KPIs without a group roll up under Ungrouped in the NKPA breakdown", async () => {
  const body = await get(`/dashboards/org-scorecard?cycleId=${cycleId}&quarter=1`);
  const ungrouped = body.byNkpa.find((r: { name: string }) => r.name === "Ungrouped");
  assert.ok(ungrouped, "Ungrouped row missing");
  const { name, ...counts } = ungrouped;
  assert.deepEqual(counts, body.nkpaTotal);
});

test("byDepartment attributes targets via the top-layer KPI's responsible post", async () => {
  const body = await get(`/dashboards/org-scorecard?cycleId=${cycleId}`);
  // KPI 1 (responsible post in the test department) has Q1 + Q2 targets:
  // Q1 achieved, Q2 not achieved.
  const dept = body.byDepartment.find((r: { name: string }) => r.name === departmentName);
  assert.ok(dept, "department row missing — byDepartment must come from the top-layer SDBIP, not departmental scorecards");
  assert.equal(dept.targetsSet, 2);
  assert.equal(dept.achieved, 1);
  assert.equal(dept.notAchieved, 1);
  // Remaining 10 KPIs have no responsible post: they roll up under Unassigned.
  const unassigned = body.byDepartment.find((r: { name: string }) => r.name === "Unassigned");
  assert.ok(unassigned, "Unassigned row missing");
  assert.equal(unassigned.targetsSet, 10);
  // Department totals cover every target set, same as the NKPA totals.
  assert.deepEqual(body.departmentTotal, body.nkpaTotal);
});

test("cycleId is required", async () => {
  const res = await fetch(`${baseUrl}/dashboards/org-scorecard`, { headers: { "X-User": username } });
  assert.equal(res.status, 400);
});
