import { pgTable, serial, text, integer, doublePrecision, boolean, timestamp } from "drizzle-orm/pg-core";
import { scorecardKpisTable } from "./scorecards";
import { usersTable } from "./users";

export const kpiQuarterActualsTable = pgTable("kpi_quarter_actuals", {
  id: serial("id").primaryKey(),
  kpiId: integer("kpi_id").notNull().references(() => scorecardKpisTable.id),
  quarter: integer("quarter").notNull(),
  actualValue: text("actual_value").notNull(),
  commentary: text("commentary"),
  isAchieved: boolean("is_achieved"),
  progressStatusId: integer("progress_status_id"),
  isOnHold: boolean("is_on_hold").notNull().default(false),
  onHoldReason: text("on_hold_reason"),
  challengeNarrative: text("challenge_narrative"),
  correctiveAction: text("corrective_action"),
  underperformanceReason: text("underperformance_reason"),
  overperformanceReason: text("overperformance_reason"),
  budgetImplication: text("budget_implication"),
  analysisNotes: text("analysis_notes"),
  submittedById: integer("submitted_by_id").notNull().references(() => usersTable.id),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  isLateSubmission: boolean("is_late_submission").notNull().default(false),
  lateOverrideReason: text("late_override_reason"),
  status: text("status").notNull().default("Draft"),
  reviewLevel: text("review_level"),
  reviewStatus: text("review_status"),
  reviewComments: text("review_comments"),
  reviewedById: integer("reviewed_by_id").references(() => usersTable.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const kpiEvidenceDocumentsTable = pgTable("kpi_evidence_documents", {
  id: serial("id").primaryKey(),
  kpiId: integer("kpi_id").notNull().references(() => scorecardKpisTable.id),
  quarter: integer("quarter").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  filePath: text("file_path").notNull(),
  documentType: text("document_type"),
  description: text("description"),
  uploadedById: integer("uploaded_by_id").notNull().references(() => usersTable.id),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  verificationStatus: text("verification_status").notNull().default("Pending"),
  verifiedById: integer("verified_by_id").references(() => usersTable.id),
  verifiedAt: timestamp("verified_at"),
  rejectionReason: text("rejection_reason"),
});

export const kpiVariancesTable = pgTable("kpi_variances", {
  id: serial("id").primaryKey(),
  kpiId: integer("kpi_id").notNull().references(() => scorecardKpisTable.id),
  quarter: integer("quarter").notNull(),
  variancePercentage: doublePrecision("variance_percentage"),
  varianceReason: text("variance_reason").notNull(),
  isUnderperformance: boolean("is_underperformance").notNull().default(true),
  budgetImpact: text("budget_impact"),
  createdById: integer("created_by_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const remedialActionPlansTable = pgTable("remedial_action_plans", {
  id: serial("id").primaryKey(),
  kpiId: integer("kpi_id").notNull().references(() => scorecardKpisTable.id),
  quarter: integer("quarter").notNull(),
  actionDescription: text("action_description").notNull(),
  actionOwnerIds: text("action_owner_id"),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull().default("Open"),
  evidenceDocumentId: integer("evidence_document_id").references(() => kpiEvidenceDocumentsTable.id),
  completedAt: timestamp("completed_at"),
  createdById: integer("created_by_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const constraintRegisterTable = pgTable("constraint_register", {
  id: serial("id").primaryKey(),
  kpiId: integer("kpi_id").references(() => scorecardKpisTable.id),
  departmentId: integer("department_id"),
  category: text("category").notNull(),
  description: text("description").notNull(),
  impact: text("impact"),
  mitigationAction: text("mitigation_action"),
  status: text("status").notNull().default("Open"),
  createdById: integer("created_by_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type KpiQuarterActual = typeof kpiQuarterActualsTable.$inferSelect;
export type KpiEvidenceDocument = typeof kpiEvidenceDocumentsTable.$inferSelect;
export type KpiVariance = typeof kpiVariancesTable.$inferSelect;
export type RemedialActionPlan = typeof remedialActionPlansTable.$inferSelect;
export type ConstraintRegister = typeof constraintRegisterTable.$inferSelect;
