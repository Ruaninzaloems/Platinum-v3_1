import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import app from "../app";
import { db } from "@workspace/db";
import {
  usersTable, performanceCyclesTable, scorecardsTable, scorecardKpisTable,
  kpiQuarterTargetsTable, kpiQuarterActualsTable, reportRunsTable,
} from "@workspace/db/schema";
import { eq, inArray } from "drizzle-orm";

let server: Server;
let baseUrl: string;
let username: string;
let userId: number;
let cycleId: number;
let topScId: number;
let revScId: number;
const kpiIds: number[] = [];
const runIds: number[] = [];

async function exportCsvRows(runId: number): Promise<string[][]> {
  const res = await fetch(`${baseUrl}/reports/runs/${runId}/export?format=csv`, {
    headers: { "X-User": username },
  });
  assert.equal(res.status, 200, `export -> ${res.status}`);
  const text = await res.text();
  const lines = text.split("\n");
  const headerIdx = lines.findIndex(l => l.startsWith("KPI Number"));
  assert.ok(headerIdx >= 0, "header row found");
  return lines.slice(headerIdx + 1).filter(l => l.trim() !== "").map(l => l.split(","));
}

before(async () => {
  username = `test_repeff_${Date.now()}`;
  const [user] = await db.insert(usersTable).values({
    username, displayName: "Report Effective Test", email: `${username}@test.local`, role: "admin",
  }).returning();
  userId = user.id;

  const [cycle] = await db.insert(performanceCyclesTable).values({
    financialYearLabel: `TESTR-${Date.now()}`,
    startDate: "2025-07-01", endDate: "2026-06-30", status: "Active",
  }).returning();
  cycleId = cycle.id;

  const [top] = await db.insert(scorecardsTable).values({
    name: "Top SDBIP", cycleId, createdById: userId,
  }).returning();
  topScId = top.id;
  // A Revised SDBIP only supersedes the Original once Approved.
  const [rev] = await db.insert(scorecardsTable).values({
    name: "Revised SDBIP", cycleId, createdById: userId, scorecardType: "revised", status: "Approved",
  }).returning();
  revScId = rev.id;

  const mk = (scorecardId: number, n: string, desc: string) => ({
    scorecardId, kpiNumber: n, description: desc,
    annualTarget: "100", weighting: 1, status: "Approved",
  });
  // Top layer: KPIs 1, 2, 3. Revised: supersedes 2, adds 4.
  const kpis = await db.insert(scorecardKpisTable).values([
    mk(topScId, "1", "Top KPI 1"),
    mk(topScId, "2", "Top KPI 2"),
    mk(topScId, "3", "Top KPI 3"),
    mk(revScId, "2", "Revised KPI 2"),
    mk(revScId, "4", "Added KPI 4"),
  ]).returning();
  for (const k of kpis) kpiIds.push(k.id);
  const [k1, k2top, , k2rev] = kpiIds;

  await db.insert(kpiQuarterTargetsTable).values([
    { kpiId: k1, quarter: 1, targetValue: "10" },
    { kpiId: k2rev, quarter: 1, targetValue: "20" },
  ]);
  // Actual captured against the ORIGINAL KPI 2 — must surface under the revised KPI.
  await db.insert(kpiQuarterActualsTable).values([
    { kpiId: k2top, quarter: 1, actualValue: "20", isAchieved: true, submittedById: userId },
  ]);

  server = app.listen(0);
  const addr = server.address();
  baseUrl = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}/api`;
});

after(async () => {
  server?.close();
  if (runIds.length) await db.delete(reportRunsTable).where(inArray(reportRunsTable.id, runIds));
  if (kpiIds.length) {
    await db.delete(kpiQuarterActualsTable).where(inArray(kpiQuarterActualsTable.kpiId, kpiIds));
    await db.delete(kpiQuarterTargetsTable).where(inArray(kpiQuarterTargetsTable.kpiId, kpiIds));
    await db.delete(scorecardKpisTable).where(inArray(scorecardKpisTable.id, kpiIds));
  }
  await db.delete(scorecardsTable).where(eq(scorecardsTable.cycleId, cycleId));
  await db.delete(performanceCyclesTable).where(eq(performanceCyclesTable.id, cycleId));
  await db.delete(usersTable).where(eq(usersTable.id, userId));
});

async function makeRun(overrides: Partial<typeof reportRunsTable.$inferInsert> = {}) {
  const [run] = await db.insert(reportRunsTable).values({
    cycleId, reportType: "quarterly", quarter: 1, title: "Effective Set Test",
    status: "Generated", generatedById: userId, generatedAt: new Date(),
    fileFormat: "json", ...overrides,
  }).returning();
  runIds.push(run.id);
  return run;
}

test("export uses effective KPI set: no double counting with a Revised SDBIP", async () => {
  const run = await makeRun();
  const rows = await exportCsvRows(run.id);
  // Effective set: 1, 3 (top, not superseded), 2 (revised), 4 (added) = 4 rows.
  assert.equal(rows.length, 4, `expected 4 rows, got ${rows.length}`);
  const numbers = rows.map(r => r[0]).sort();
  assert.deepEqual(numbers, ["1", "2", "3", "4"]);
  // KPI 2 must be the revised version, with target from revised KPI and the
  // actual captured against the original aliased through.
  const row2 = rows.find(r => r[0] === "2")!;
  assert.ok(row2[1].includes("Revised KPI 2"), `row2 desc: ${row2[1]}`);
  assert.equal(row2[4], "20"); // Q1 target from revised KPI
  assert.equal(row2[5], "20"); // Q1 actual aliased from original KPI
  assert.ok(row2[6].includes("Target Met"), `achievement: ${row2[6]}`);
});

test("export totals match the executive dashboard totals", async () => {
  const run = await makeRun();
  const rows = await exportCsvRows(run.id);
  const res = await fetch(`${baseUrl}/dashboards/executive?cycleId=${cycleId}`, {
    headers: { "X-User": username },
  });
  assert.equal(res.status, 200);
  const dash = await res.json() as { totalKpis: number };
  assert.equal(rows.length, dash.totalKpis);
});

test("explicit scorecardType filter still reports that exact version", async () => {
  const typedRun = await makeRun({ scorecardType: "organisational" });
  const typedRows = await exportCsvRows(typedRun.id);
  assert.deepEqual(typedRows.map(r => r[0]).sort(), ["1", "2", "3"]);
  const typedRow2 = typedRows.find(r => r[0] === "2")!;
  assert.ok(typedRow2[1].includes("Top KPI 2"), `desc: ${typedRow2[1]}`);
  const revRun = await makeRun({ scorecardType: "revised" });
  const revRows = await exportCsvRows(revRun.id);
  assert.deepEqual(revRows.map(r => r[0]).sort(), ["2", "4"]);
});
