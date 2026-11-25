import { pgTable, serial, text, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { performanceCyclesTable } from "./performance-cycles";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  link: text("link"),
  dedupeKey: text("dedupe_key"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  // Prevents the reminder sweep from creating the same system notification twice for a user
  uniqueIndex("notifications_user_dedupe_uq").on(t.userId, t.dedupeKey),
]);

export const notificationConfigsTable = pgTable("notification_configs", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").notNull().references(() => performanceCyclesTable.id),
  eventType: text("event_type").notNull(),
  daysBefore: integer("days_before").notNull().default(7),
  isEmail: boolean("is_email").notNull().default(false),
  isInApp: boolean("is_in_app").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
});

export type Notification = typeof notificationsTable.$inferSelect;
export type NotificationConfig = typeof notificationConfigsTable.$inferSelect;
