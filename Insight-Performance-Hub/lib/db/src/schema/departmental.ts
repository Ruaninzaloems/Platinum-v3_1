import { pgTable, serial, text, integer, doublePrecision, boolean, timestamp } from "drizzle-orm/pg-core";
import { performanceCyclesTable } from "./performance-cycles";
import { usersTable } from "./users";
import { scorecardsTable, scorecardKpisTable } from "./scorecards";
import { kpiQuarterActualsTable } from "./actuals";

export const deptScorecardsTable = pgTable("dept_scorecards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cycleId: integer("cycle_id").notNull().references(() => performanceCyclesTable.id),
  departmentId: integer("department_id").notNull(),
  departmentName: text("department_name").notNull(),
  parentScorecardId: integer("parent_scorecard_id").references(() => scorecardsTable.id),
  ownerId: integer("owner_id").references(() => usersTable.id),
  status: text("status").notNull().default("Draft"),
  approvedById: integer("approved_by_id").references(() => usersTable.id),
  approvedAt: timestamp("approved_at"),
  approvalComments: text("approval_comments"),
  createdById: integer("created_by_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const deptScorecardKpisTable = pgTable("dept_scorecard_kpis", {
  id: serial("id").primaryKey(),
  deptScorecardId: integer("dept_scorecard_id").notNull().references(() => deptScorecardsTable.id),
  parentKpiId: integer("parent_kpi_id").references(() => scorecardKpisTable.id),
  kpiNumber: text("kpi_number").notNull(),
  description: text("description").notNull(),
  strategicObjective: text("strategic_objective"),
  nkpaLink: text("nkpa_link"),
  responsiblePostId: integer("responsible_post_id").references(() => usersTable.id),
  baseline: text("baseline"),
  annualTarget: text("annual_target").notNull(),
  annualBudgetTarget: doublePrecision("annual_budget_target"),
  weighting: doublePrecision("weighting").notNull().default(0),
  unitOfMeasureId: integer("unit_of_measure_id"),
  isCumulative: boolean("is_cumulative").notNull().default(false),
  isInherited: boolean("is_inherited").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const kpiReviewSubmissionsTable = pgTable("kpi_review_submissions", {
  id: serial("id").primaryKey(),
  actualId: integer("actual_id").notNull().references(() => kpiQuarterActualsTable.id),
  kpiId: integer("kpi_id").notNull().references(() => scorecardKpisTable.id),
  quarter: integer("quarter").notNull(),
  reviewerUserId: integer("reviewer_user_id").notNull().references(() => usersTable.id),
  action: text("action").notNull(),
  comments: text("comments"),
  returnReason: text("return_reason"),
  assessmentRating: doublePrecision("assessment_rating"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const kpiModerationOutcomesTable = pgTable("kpi_moderation_outcomes", {
  id: serial("id").primaryKey(),
  actualId: integer("actual_id").notNull().references(() => kpiQuarterActualsTable.id),
  kpiId: integer("kpi_id").notNull().references(() => scorecardKpisTable.id),
  quarter: integer("quarter").notNull(),
  moderatorUserId: integer("moderator_user_id").notNull().references(() => usersTable.id),
  outcome: text("outcome").notNull(),
  scoreAdjustmentReason: text("score_adjustment_reason"),
  adjustedScore: doublePrecision("adjusted_score"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const periodLocksTable = pgTable("period_locks", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").notNull().references(() => performanceCyclesTable.id),
  quarter: integer("quarter"),
  periodType: text("period_type").notNull(),
  isLocked: boolean("is_locked").notNull().default(false),
  lockedById: integer("locked_by_id").references(() => usersTable.id),
  lockedAt: timestamp("locked_at"),
  lockComments: text("lock_comments"),
  reopenedById: integer("reopened_by_id").references(() => usersTable.id),
  reopenedAt: timestamp("reopened_at"),
  reopenReason: text("reopen_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const reportRunsTable = pgTable("report_runs", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").notNull().references(() => performanceCyclesTable.id),
  reportType: text("report_type").notNull(),
  quarter: integer("quarter"),
  departmentId: integer("department_id"),
  scorecardType: text("scorecard_type"),
  title: text("title").notNull(),
  status: text("status").notNull().default("Pending"),
  generatedById: integer("generated_by_id").notNull().references(() => usersTable.id),
  generatedAt: timestamp("generated_at"),
  filePath: text("file_path"),
  fileFormat: text("file_format"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DeptScorecard = typeof deptScorecardsTable.$inferSelect;
export type DeptScorecardKpi = typeof deptScorecardKpisTable.$inferSelect;
export type KpiReviewSubmission = typeof kpiReviewSubmissionsTable.$inferSelect;
export type KpiModerationOutcome = typeof kpiModerationOutcomesTable.$inferSelect;
export type PeriodLock = typeof periodLocksTable.$inferSelect;
export type ReportRun = typeof reportRunsTable.$inferSelect;
