import { pgTable, serial, text, integer, doublePrecision, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { performanceCyclesTable } from "./performance-cycles";
import { usersTable } from "./users";
import { deptScorecardsTable, deptScorecardKpisTable } from "./departmental";

export const individualAgreementsTable = pgTable("individual_performance_agreements", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").notNull().references(() => performanceCyclesTable.id),
  employeeId: integer("employee_id").notNull().references(() => usersTable.id),
  employeeName: text("employee_name").notNull(),
  postTitle: text("post_title").notNull(),
  departmentId: integer("department_id").notNull(),
  departmentName: text("department_name").notNull(),
  deptScorecardId: integer("dept_scorecard_id").references(() => deptScorecardsTable.id),
  primaryReviewerId: integer("primary_reviewer_id").references(() => usersTable.id),
  secondaryReviewerId: integer("secondary_reviewer_id").references(() => usersTable.id),
  status: text("status").notNull().default("Draft"),
  kpiWeightPct: doublePrecision("kpi_weight_pct").notNull().default(70),
  competencyWeightPct: doublePrecision("competency_weight_pct").notNull().default(30),
  finalScore: doublePrecision("final_score"),
  approvedById: integer("approved_by_id").references(() => usersTable.id),
  approvedAt: timestamp("approved_at"),
  approvalComments: text("approval_comments"),
  lockedAt: timestamp("locked_at"),
  createdById: integer("created_by_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const employeeKpasTable = pgTable("employee_kpas", {
  id: serial("id").primaryKey(),
  agreementId: integer("agreement_id").notNull().references(() => individualAgreementsTable.id),
  title: text("title").notNull(),
  description: text("description"),
  weighting: doublePrecision("weighting").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const employeeKpisTable = pgTable("employee_kpis", {
  id: serial("id").primaryKey(),
  kpaId: integer("kpa_id").notNull().references(() => employeeKpasTable.id),
  agreementId: integer("agreement_id").notNull().references(() => individualAgreementsTable.id),
  deptKpiId: integer("dept_kpi_id").references(() => deptScorecardKpisTable.id),
  kpiNumber: text("kpi_number").notNull(),
  description: text("description").notNull(),
  unitOfMeasure: text("unit_of_measure"),
  baseline: text("baseline"),
  annualTarget: text("annual_target").notNull(),
  weighting: doublePrecision("weighting").notNull().default(0),
  q1Target: text("q1_target"),
  q2Target: text("q2_target"),
  q3Target: text("q3_target"),
  q4Target: text("q4_target"),
  q1Actual: text("q1_actual"),
  q2Actual: text("q2_actual"),
  q3Actual: text("q3_actual"),
  q4Actual: text("q4_actual"),
  q1Score: doublePrecision("q1_score"),
  q2Score: doublePrecision("q2_score"),
  q3Score: doublePrecision("q3_score"),
  q4Score: doublePrecision("q4_score"),
  annualScore: doublePrecision("annual_score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviewerAssignmentsTable = pgTable("reviewer_assignments", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").notNull().references(() => performanceCyclesTable.id),
  employeeId: integer("employee_id").notNull().references(() => usersTable.id),
  primaryReviewerId: integer("primary_reviewer_id").notNull().references(() => usersTable.id),
  secondaryReviewerId: integer("secondary_reviewer_id").references(() => usersTable.id),
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  changedById: integer("changed_by_id").notNull().references(() => usersTable.id),
  changeReason: text("change_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const competencyTemplatesTable = pgTable("competency_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  postLevel: text("post_level"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const competencyTemplateItemsTable = pgTable("competency_template_items", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => competencyTemplatesTable.id),
  competencyName: text("competency_name").notNull(),
  description: text("description"),
  weighting: doublePrecision("weighting").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const employeeCompetencyScoresTable = pgTable("employee_competency_scores", {
  id: serial("id").primaryKey(),
  agreementId: integer("agreement_id").notNull().references(() => individualAgreementsTable.id),
  competencyItemId: integer("competency_item_id").notNull().references(() => competencyTemplateItemsTable.id),
  competencyName: text("competency_name").notNull(),
  weighting: doublePrecision("weighting").notNull().default(0),
  selfScore: doublePrecision("self_score"),
  reviewerScore: doublePrecision("reviewer_score"),
  moderatedScore: doublePrecision("moderated_score"),
  developmentNeed: text("development_need"),
  scoredById: integer("scored_by_id").references(() => usersTable.id),
  scoredAt: timestamp("scored_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const individualAssessmentRecordsTable = pgTable("individual_assessment_records", {
  id: serial("id").primaryKey(),
  agreementId: integer("agreement_id").notNull().references(() => individualAgreementsTable.id),
  assessmentType: text("assessment_type").notNull(),
  quarter: integer("quarter"),
  reviewerId: integer("reviewer_id").notNull().references(() => usersTable.id),
  kpiScore: doublePrecision("kpi_score"),
  competencyScore: doublePrecision("competency_score"),
  overallScore: doublePrecision("overall_score"),
  comments: text("comments"),
  developmentNeeds: text("development_needs"),
  performanceGaps: text("performance_gaps"),
  status: text("status").notNull().default("Draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const moderationRecordsIndividualTable = pgTable("moderation_records_individual", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => individualAssessmentRecordsTable.id),
  agreementId: integer("agreement_id").notNull().references(() => individualAgreementsTable.id),
  moderatorId: integer("moderator_id").notNull().references(() => usersTable.id),
  outcome: text("outcome").notNull(),
  originalScore: doublePrecision("original_score"),
  adjustedScore: doublePrecision("adjusted_score"),
  adjustmentReason: text("adjustment_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const aiInsightLogTable = pgTable("ai_insight_log", {
  id: serial("id").primaryKey(),
  insightType: text("insight_type").notNull(),
  cycleId: integer("cycle_id").references(() => performanceCyclesTable.id),
  departmentId: integer("department_id"),
  kpiId: integer("kpi_id"),
  requestPayload: jsonb("request_payload"),
  responsePayload: jsonb("response_payload"),
  summary: text("summary"),
  riskLevel: text("risk_level"),
  isAdvisory: boolean("is_advisory").notNull().default(true),
  generatedById: integer("generated_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const integrationSyncLogTable = pgTable("integration_sync_log", {
  id: serial("id").primaryKey(),
  integrationType: text("integration_type").notNull(),
  direction: text("direction").notNull().default("pull"),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  status: text("status").notNull().default("Pending"),
  recordCount: integer("record_count"),
  errorMessage: text("error_message"),
  syncedById: integer("synced_by_id").references(() => usersTable.id),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
});

export const workflowStepConfigsTable = pgTable("workflow_step_configs", {
  id: serial("id").primaryKey(),
  scorecardTypeId: integer("scorecard_type_id"),
  stepName: text("step_name").notNull(),
  stepOrder: integer("step_order").notNull(),
  requiredRole: text("required_role").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  version: integer("version").notNull().default(1),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type IndividualAgreement = typeof individualAgreementsTable.$inferSelect;
export type EmployeeKpa = typeof employeeKpasTable.$inferSelect;
export type EmployeeKpi = typeof employeeKpisTable.$inferSelect;
export type ReviewerAssignment = typeof reviewerAssignmentsTable.$inferSelect;
export type CompetencyTemplate = typeof competencyTemplatesTable.$inferSelect;
export type CompetencyTemplateItem = typeof competencyTemplateItemsTable.$inferSelect;
export type EmployeeCompetencyScore = typeof employeeCompetencyScoresTable.$inferSelect;
export type IndividualAssessmentRecord = typeof individualAssessmentRecordsTable.$inferSelect;
export type ModerationRecordIndividual = typeof moderationRecordsIndividualTable.$inferSelect;
export type AiInsightLog = typeof aiInsightLogTable.$inferSelect;
export type IntegrationSyncLog = typeof integrationSyncLogTable.$inferSelect;
export type WorkflowStepConfig = typeof workflowStepConfigsTable.$inferSelect;
