import { db } from "@workspace/db";
import {
  performanceCyclesTable,
  usersTable,
  notificationsTable,
  notificationConfigsTable,
} from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { computeMfmaMilestones, type MfmaMilestone } from "../Helpers/mfma-calendar";
import { sendEmail } from "./email";

export const MFMA_DEADLINE_EVENT_TYPE = "mfma.deadline";
export const DEFAULT_LEAD_DAYS = 14;
/** Stop nagging about deadlines that lapsed more than this many days ago. */
export const LAPSED_WINDOW_DAYS = 60;

export type PendingMfmaNotification = {
  dedupeKey: string;
  type: "reminder" | "warning";
  title: string;
  message: string;
  link: string;
};

/**
 * Pure logic: given the milestones for a cycle, today's date and the lead time,
 * return the notifications that should exist (one per milestone/stage).
 * Deduplication against already-sent notifications happens at insert time
 * via the (user_id, dedupe_key) unique index.
 */
export function computeDueMfmaNotifications(
  cycleId: number,
  financialYearLabel: string,
  milestones: MfmaMilestone[],
  todayUtcMs: number,
  leadDays: number,
): PendingMfmaNotification[] {
  const pending: PendingMfmaNotification[] = [];
  for (const m of milestones) {
    const daysRemaining = Math.round((new Date(`${m.dueDate}T00:00:00Z`).getTime() - todayUtcMs) / 86400000);
    const due = new Date(`${m.dueDate}T00:00:00Z`).toLocaleDateString("en-ZA", {
      day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
    });
    if (daysRemaining >= 0 && daysRemaining <= leadDays) {
      pending.push({
        dedupeKey: `mfma:${cycleId}:${m.key}:upcoming`,
        type: "reminder",
        title: `MFMA deadline approaching: ${m.title}`,
        message: daysRemaining === 0
          ? `${m.title} (${financialYearLabel}) is due today, ${due}. ${m.description}.`
          : `${m.title} (${financialYearLabel}) is due in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}, on ${due}. ${m.description}.`,
        link: "/?tab=milestones",
      });
    } else if (daysRemaining < 0 && daysRemaining >= -LAPSED_WINDOW_DAYS) {
      const overdue = Math.abs(daysRemaining);
      pending.push({
        dedupeKey: `mfma:${cycleId}:${m.key}:lapsed`,
        type: "warning",
        title: `MFMA deadline lapsed: ${m.title}`,
        message: `${m.title} (${financialYearLabel}) was due on ${due} and lapsed ${overdue} day${overdue === 1 ? "" : "s"} ago. ${m.description}.`,
        link: "/?tab=milestones",
      });
    }
  }
  return pending;
}

/** Lead time and email opt-in come from active `mfma.deadline` notification configs for the cycle. */
async function reminderSettingsForCycle(cycleId: number): Promise<{ leadDays: number; emailEnabled: boolean }> {
  const configs = await db.select().from(notificationConfigsTable).where(and(
    eq(notificationConfigsTable.cycleId, cycleId),
    eq(notificationConfigsTable.eventType, MFMA_DEADLINE_EVENT_TYPE),
    eq(notificationConfigsTable.isActive, true),
  ));
  const inApp = configs.find(c => c.isInApp);
  return {
    leadDays: inApp ? inApp.daysBefore : DEFAULT_LEAD_DAYS,
    emailEnabled: configs.some(c => c.isEmail),
  };
}

/** Absolute URL for the Milestones dashboard tab, for use in email bodies. */
function milestonesUrl(): string {
  const domain = process.env.APP_BASE_URL
    || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "")
    || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "");
  return `${domain}/?tab=milestones`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Sweep all non-closed performance cycles and create in-app notifications for
 * every active user when a statutory MFMA milestone is within the lead time or
 * has recently lapsed. Safe to run repeatedly (idempotent via dedupe keys).
 */
export async function sweepMfmaReminders(): Promise<number> {
  const now = new Date();
  const todayUtcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const cycles = (await db.select().from(performanceCyclesTable))
    .filter(c => c.status !== "Closed" && c.status !== "Archived");
  if (cycles.length === 0) return 0;

  const users = (await db.select().from(usersTable)).filter(u => u.isActive);
  if (users.length === 0) return 0;

  let created = 0;
  for (const cycle of cycles) {
    const { leadDays, emailEnabled } = await reminderSettingsForCycle(cycle.id);
    const milestones = computeMfmaMilestones(cycle.startDate, cycle.endDate);
    const pending = computeDueMfmaNotifications(cycle.id, cycle.financialYearLabel, milestones, todayUtcMs, leadDays);
    if (pending.length === 0) continue;

    const rows = users.flatMap(u => pending.map(p => ({
      userId: u.id,
      title: p.title,
      message: p.message,
      type: p.type,
      link: p.link,
      dedupeKey: p.dedupeKey,
    })));
    const inserted = await db.insert(notificationsTable)
      .values(rows)
      .onConflictDoNothing({ target: [notificationsTable.userId, notificationsTable.dedupeKey] })
      .returning({
        id: notificationsTable.id,
        userId: notificationsTable.userId,
        dedupeKey: notificationsTable.dedupeKey,
      });
    created += inserted.length;

    // Email only the notifications that were newly created this sweep, so
    // re-runs never re-send. Failures are logged inside sendEmail and never
    // interrupt the sweep.
    if (emailEnabled && inserted.length > 0) {
      const usersById = new Map(users.map(u => [u.id, u]));
      const pendingByKey = new Map(pending.map(p => [p.dedupeKey, p]));
      const url = milestonesUrl();
      for (const row of inserted) {
        const user = usersById.get(row.userId);
        const p = row.dedupeKey ? pendingByKey.get(row.dedupeKey) : undefined;
        if (!user?.email || !p) continue;
        await sendEmail({
          to: user.email,
          subject: p.title,
          text: `${p.message}\n\nView the Milestones dashboard: ${url}`,
          html: `<p>${escapeHtml(p.message)}</p><p><a href="${url}">View the Milestones dashboard</a></p>`,
        });
      }
    }
  }
  return created;
}

const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

/** Run a sweep now and keep re-checking periodically. Errors are logged, never fatal. */
export function startMfmaReminderScheduler(): void {
  const run = () => {
    sweepMfmaReminders()
      .then(n => { if (n > 0) console.log(`MFMA reminder sweep created ${n} notification(s)`); })
      .catch(err => console.error("MFMA reminder sweep failed:", err));
  };
  run();
  const timer = setInterval(run, SWEEP_INTERVAL_MS);
  timer.unref?.();
}
