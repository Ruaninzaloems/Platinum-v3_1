import { pgTable, serial, text, integer, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { performanceCyclesTable } from "./performance-cycles";
import { scorecardKpisTable } from "./scorecards";
import { usersTable } from "./users";

export const sdbipItemsTable = pgTable("sdbip_items", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").notNull().references(() => performanceCyclesTable.id),
  kpiId: integer("kpi_id").references(() => scorecardKpisTable.id),
  departmentId: integer("department_id"),
  description: text("description").notNull(),
  q1Target: text("q1_target"),
  q2Target: text("q2_target"),
  q3Target: text("q3_target"),
  q4Target: text("q4_target"),
  q1Budget: doublePrecision("q1_budget"),
  q2Budget: doublePrecision("q2_budget"),
  q3Budget: doublePrecision("q3_budget"),
  q4Budget: doublePrecision("q4_budget"),
  annualBudget: doublePrecision("annual_budget"),
  responsiblePostId: integer("responsible_post_id").references(() => usersTable.id),
  status: text("status").notNull().default("Draft"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sdbipRevisionsTable = pgTable("sdbip_revisions", {
  id: serial("id").primaryKey(),
  sdbipItemId: integer("sdbip_item_id").notNull().references(() => sdbipItemsTable.id),
  revisionNumber: integer("revision_number").notNull().default(1),
  reason: text("reason").notNull(),
  previousQ1Target: text("previous_q1_target"),
  previousQ2Target: text("previous_q2_target"),
  previousQ3Target: text("previous_q3_target"),
  previousQ4Target: text("previous_q4_target"),
  previousQ1Budget: doublePrecision("previous_q1_budget"),
  previousQ2Budget: doublePrecision("previous_q2_budget"),
  previousQ3Budget: doublePrecision("previous_q3_budget"),
  previousQ4Budget: doublePrecision("previous_q4_budget"),
  newQ1Target: text("new_q1_target"),
  newQ2Target: text("new_q2_target"),
  newQ3Target: text("new_q3_target"),
  newQ4Target: text("new_q4_target"),
  newQ1Budget: doublePrecision("new_q1_budget"),
  newQ2Budget: doublePrecision("new_q2_budget"),
  newQ3Budget: doublePrecision("new_q3_budget"),
  newQ4Budget: doublePrecision("new_q4_budget"),
  revisedById: integer("revised_by_id").notNull().references(() => usersTable.id),
  approvedById: integer("approved_by_id").references(() => usersTable.id),
  status: text("status").notNull().default("Pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export type SdbipItem = typeof sdbipItemsTable.$inferSelect;
export type SdbipRevision = typeof sdbipRevisionsTable.$inferSelect;
