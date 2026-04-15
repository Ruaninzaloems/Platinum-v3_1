import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  userName: text("user_name").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  cycleId: integer("cycle_id"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export type AuditLogEntry = typeof auditLogsTable.$inferSelect;
