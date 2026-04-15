import { pgTable, serial, text, integer, doublePrecision, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { performanceCyclesTable } from "./performance-cycles";
import { usersTable } from "./users";

export const scorecardsTable = pgTable("scorecards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cycleId: integer("cycle_id").notNull().references(() => performanceCyclesTable.id),
  scorecardType: text("scorecard_type").notNull().default("organisational"),
  departmentId: integer("department_id"),
  status: text("status").notNull().default("Draft"),
  approvedById: integer("approved_by_id").references(() => usersTable.id),
  approvedAt: timestamp("approved_at"),
  approvalComments: text("approval_comments"),
  createdById: integer("created_by_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const scorecardKpisTable = pgTable("scorecard_kpis", {
  id: serial("id").primaryKey(),
  scorecardId: integer("scorecard_id").notNull().references(() => scorecardsTable.id),
  kpiNumber: text("kpi_number").notNull(),
  description: text("description").notNull(),
  idpReference: text("idp_reference"),
  strategicObjective: text("strategic_objective"),
  programme: text("programme"),
  responsiblePostId: integer("responsible_post_id").references(() => usersTable.id),
  custodianPostId: integer("custodian_post_id").references(() => usersTable.id),
  baseline: text("baseline"),
  annualTarget: text("annual_target").notNull(),
  annualBudgetTarget: doublePrecision("annual_budget_target"),
  evidenceSource: text("evidence_source"),
  evidencePortfolio: text("evidence_portfolio"),
  weighting: doublePrecision("weighting").notNull().default(0),
  fundingSource: text("funding_source"),
  budgetDescription: text("budget_description"),
  unitOfMeasureId: integer("unit_of_measure_id"),
  dataTypeId: integer("data_type_id"),
  kpiGroupId: integer("kpi_group_id"),
  status: text("status").notNull().default("Draft"),
  isCumulative: boolean("is_cumulative").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const kpiQuarterTargetsTable = pgTable("kpi_quarter_targets", {
  id: serial("id").primaryKey(),
  kpiId: integer("kpi_id").notNull().references(() => scorecardKpisTable.id),
  quarter: integer("quarter").notNull(),
  targetValue: text("target_value").notNull(),
  budgetValue: doublePrecision("budget_value"),
  evidenceExpected: text("evidence_expected"),
  isApprovedBaseline: boolean("is_approved_baseline").notNull().default(false),
  baselineTargetValue: text("baseline_target_value"),
  baselineBudgetValue: doublePrecision("baseline_budget_value"),
  revisionReason: text("revision_reason"),
  revisedAt: timestamp("revised_at"),
  revisedById: integer("revised_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const kpiMonthActivitiesTable = pgTable("kpi_month_activities", {
  id: serial("id").primaryKey(),
  kpiId: integer("kpi_id").notNull().references(() => scorecardKpisTable.id),
  quarter: integer("quarter").notNull(),
  month: integer("month").notNull(),
  description: text("description").notNull(),
  dueDate: date("due_date").notNull(),
  ownerId: integer("owner_id").references(() => usersTable.id),
  status: text("status").notNull().default("Pending"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sdbipRevisionLogsTable = pgTable("sdbip_revision_logs", {
  id: serial("id").primaryKey(),
  scorecardId: integer("scorecard_id").notNull().references(() => scorecardsTable.id),
  kpiId: integer("kpi_id").references(() => scorecardKpisTable.id),
  revisionType: text("revision_type").notNull(),
  fieldName: text("field_name"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  revisionReason: text("revision_reason"),
  quarter: integer("quarter"),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  userName: text("user_name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Scorecard = typeof scorecardsTable.$inferSelect;
export type ScorecardKpi = typeof scorecardKpisTable.$inferSelect;
export type KpiQuarterTarget = typeof kpiQuarterTargetsTable.$inferSelect;
export type KpiMonthActivity = typeof kpiMonthActivitiesTable.$inferSelect;
export type SdbipRevisionLog = typeof sdbipRevisionLogsTable.$inferSelect;
