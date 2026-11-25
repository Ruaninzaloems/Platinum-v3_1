import { test } from "node:test";
import assert from "node:assert/strict";
import { computeMfmaMilestones } from "../Helpers/mfma-calendar";
import { computeDueMfmaNotifications, LAPSED_WINDOW_DAYS } from "../Services/mfma-reminders";

const FY_START = "2025-07-01";
const FY_END = "2026-06-30";
const milestones = computeMfmaMilestones(FY_START, FY_END);
const utc = (iso: string) => new Date(`${iso}T00:00:00Z`).getTime();

test("milestone within lead time produces a reminder", () => {
  // Q1 submission due 2025-10-30; 10 days before with a 14-day lead
  const pending = computeDueMfmaNotifications(1, "2025/2026", milestones, utc("2025-10-20"), 14);
  const q1 = pending.find(p => p.dedupeKey === "mfma:1:q1-data-submission:upcoming");
  assert.ok(q1);
  assert.equal(q1.type, "reminder");
  assert.match(q1.message, /due in 10 days/);
  assert.equal(q1.link, "/?tab=milestones");
});

test("milestone outside lead time produces nothing", () => {
  const pending = computeDueMfmaNotifications(1, "2025/2026", milestones, utc("2025-09-01"), 14);
  assert.equal(pending.find(p => p.dedupeKey.includes("q1-data-submission")), undefined);
});

test("due today produces a reminder with 'due today' wording", () => {
  const pending = computeDueMfmaNotifications(1, "2025/2026", milestones, utc("2025-10-30"), 14);
  const q1 = pending.find(p => p.dedupeKey === "mfma:1:q1-data-submission:upcoming");
  assert.ok(q1);
  assert.match(q1.message, /due today/);
});

test("lapsed milestone produces a warning with a distinct dedupe key", () => {
  const pending = computeDueMfmaNotifications(1, "2025/2026", milestones, utc("2025-11-05"), 14);
  const lapsed = pending.find(p => p.dedupeKey === "mfma:1:q1-data-submission:lapsed");
  assert.ok(lapsed);
  assert.equal(lapsed.type, "warning");
  assert.match(lapsed.message, /lapsed 6 days ago/);
});

test("milestones lapsed longer than the window are ignored", () => {
  const today = utc("2025-10-30") + (LAPSED_WINDOW_DAYS + 1) * 86400000;
  const pending = computeDueMfmaNotifications(1, "2025/2026", milestones, today, 14);
  assert.equal(pending.find(p => p.dedupeKey === "mfma:1:q1-data-submission:lapsed"), undefined);
});

test("configurable lead time is respected", () => {
  // 20 days before due date: outside 14-day lead, inside 30-day lead
  const short = computeDueMfmaNotifications(1, "2025/2026", milestones, utc("2025-10-10"), 14);
  assert.equal(short.find(p => p.dedupeKey.includes("q1-data-submission")), undefined);
  const long = computeDueMfmaNotifications(1, "2025/2026", milestones, utc("2025-10-10"), 30);
  assert.ok(long.find(p => p.dedupeKey === "mfma:1:q1-data-submission:upcoming"));
});
