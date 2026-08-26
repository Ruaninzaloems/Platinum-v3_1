import { test } from "node:test";
import assert from "node:assert/strict";
import { computeMfmaMilestones } from "../Helpers/mfma-calendar";

const byKey = (items: ReturnType<typeof computeMfmaMilestones>) =>
  new Map(items.map(m => [m.key, m.dueDate]));

test("FY 2025/2026 (Jul–Jun) statutory dates", () => {
  const dates = byKey(computeMfmaMilestones("2025-07-01", "2026-06-30"));
  assert.equal(dates.get("q1-data-submission"), "2025-10-30");
  assert.equal(dates.get("q2-data-submission"), "2026-01-30");
  assert.equal(dates.get("q3-data-submission"), "2026-04-30");
  assert.equal(dates.get("q4-data-submission"), "2026-07-30");
  assert.equal(dates.get("mid-year-assessment"), "2026-01-25");
  assert.equal(dates.get("afs-to-agsa"), "2026-08-31");
  assert.equal(dates.get("s46-performance-report"), "2026-09-30");
  assert.equal(dates.get("draft-annual-report"), "2026-10-31");
  assert.equal(dates.get("annual-report-tabling"), "2027-01-31");
});

test("items are sorted by due date", () => {
  const items = computeMfmaMilestones("2025-07-01", "2026-06-30");
  const sorted = [...items].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  assert.deepEqual(items.map(i => i.key), sorted.map(i => i.key));
});

test("calendar-year FY (Jan–Dec) with month-end rollover into February", () => {
  const dates = byKey(computeMfmaMilestones("2024-01-01", "2024-12-31"));
  // 31 Dec 2024 + 2 months clamps into February (non-leap 2025 → 28 Feb)
  assert.equal(dates.get("afs-to-agsa"), "2025-02-28");
  assert.equal(dates.get("s46-performance-report"), "2025-03-31");
  assert.equal(dates.get("annual-report-tabling"), "2025-07-31");
  // Mid-year: 30 Jun 2024 + 25 days = 25 Jul 2024
  assert.equal(dates.get("mid-year-assessment"), "2024-07-25");
});

test("leap-year February deadline lands on 29 Feb", () => {
  const dates = byKey(computeMfmaMilestones("2023-01-01", "2023-12-31"));
  // 31 Dec 2023 + 2 months → February 2024 (leap year) → 29 Feb
  assert.equal(dates.get("afs-to-agsa"), "2024-02-29");
});
