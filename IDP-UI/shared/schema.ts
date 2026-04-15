import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const cycleStatusEnum = pgEnum("cycle_status", [
  "draft", "in_review", "approved_for_distribution", "adopted", "revised"
]);

export const commentStatusEnum = pgEnum("comment_status", [
  "received", "under_review", "responded", "closed", "escalated"
]);

export const projectClassEnum = pgEnum("project_classification", [
  "capital", "operational"
]);

export const priorityEnum = pgEnum("priority_level", [
  "low", "medium", "high", "critical"
]);

export const milestoneStatusEnum = pgEnum("milestone_status", [
  "not_started", "in_progress", "completed", "overdue"
]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull().default(""),
  role: text("role").notNull().default("viewer"),
});

export const idpCycles = pgTable("idp_cycles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  startYear: integer("start_year").notNull(),
  endYear: integer("end_year").notNull(),
  status: cycleStatusEnum("status").notNull().default("draft"),
  revisionNumber: integer("revision_number").notNull().default(1),
  municipalityName: text("municipality_name").notNull().default(""),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: text("created_by"),
  createdDate: timestamp("created_date").notNull().defaultNow(),
  modifiedDate: timestamp("modified_date").notNull().defaultNow(),
});

export const idpProcessPhases = pgTable("idp_process_phases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cycleId: varchar("cycle_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  startDate: text("start_date"),
  endDate: text("end_date"),
  progress: integer("progress").notNull().default(0),
  createdDate: timestamp("created_date").notNull().defaultNow(),
});

export const idpMilestones = pgTable("idp_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phaseId: varchar("phase_id").notNull(),
  cycleId: varchar("cycle_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: text("assigned_to"),
  dueDate: text("due_date"),
  status: milestoneStatusEnum("status").notNull().default("not_started"),
  progress: integer("progress").notNull().default(0),
  isMandatory: boolean("is_mandatory").notNull().default(false),
  evidenceUrl: text("evidence_url"),
  createdDate: timestamp("created_date").notNull().defaultNow(),
});

export const idpStrategicObjectives = pgTable("idp_strategic_objectives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cycleId: varchar("cycle_id").notNull(),
  code: text("code").notNull(),
  description: text("description").notNull(),
  alignmentTags: text("alignment_tags"),
  ndpAlignment: text("ndp_alignment"),
  provincialAlignment: text("provincial_alignment"),
  createdDate: timestamp("created_date").notNull().defaultNow(),
});

export const idpProjects = pgTable("idp_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cycleId: varchar("cycle_id").notNull(),
  objectiveId: varchar("objective_id"),
  name: text("name").notNull(),
  description: text("description"),
  classification: projectClassEnum("classification").notNull().default("operational"),
  department: text("department").notNull(),
  ward: text("ward"),
  region: text("region"),
  priority: priorityEnum("priority").notNull().default("medium"),
  budgetAmount: decimal("budget_amount", { precision: 15, scale: 2 }),
  fundingSource: text("funding_source"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  status: text("status").notNull().default("planned"),
  createdDate: timestamp("created_date").notNull().defaultNow(),
});

export const idpProjectIndicators = pgTable("idp_project_indicators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  name: text("name").notNull(),
  baseline: text("baseline"),
  targetY1: text("target_y1"),
  targetY2: text("target_y2"),
  targetY3: text("target_y3"),
  targetY4: text("target_y4"),
  targetY5: text("target_y5"),
  responsibleOfficial: text("responsible_official"),
  createdDate: timestamp("created_date").notNull().defaultNow(),
});

export const idpPublicComments = pgTable("idp_public_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cycleId: varchar("cycle_id").notNull(),
  sourceChannel: text("source_channel").notNull(),
  ward: text("ward"),
  region: text("region"),
  category: text("category"),
  commentText: text("comment_text").notNull(),
  linkedProjectId: varchar("linked_project_id"),
  linkedObjectiveId: varchar("linked_objective_id"),
  submitterName: text("submitter_name"),
  submissionDate: text("submission_date"),
  status: commentStatusEnum("status").notNull().default("received"),
  createdDate: timestamp("created_date").notNull().defaultNow(),
});

export const idpCommentResponses = pgTable("idp_comment_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id").notNull(),
  responseText: text("response_text").notNull(),
  responsibleOfficial: text("responsible_official"),
  responseDate: text("response_date"),
  createdDate: timestamp("created_date").notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  action: text("action").notNull(),
  performedBy: text("performed_by"),
  details: text("details"),
  createdDate: timestamp("created_date").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
});

export const insertCycleSchema = createInsertSchema(idpCycles).omit({
  id: true,
  createdDate: true,
  modifiedDate: true,
});

export const insertProcessPhaseSchema = createInsertSchema(idpProcessPhases).omit({
  id: true,
  createdDate: true,
});

export const insertMilestoneSchema = createInsertSchema(idpMilestones).omit({
  id: true,
  createdDate: true,
});

export const insertObjectiveSchema = createInsertSchema(idpStrategicObjectives).omit({
  id: true,
  createdDate: true,
});

export const insertProjectSchema = createInsertSchema(idpProjects).omit({
  id: true,
  createdDate: true,
});

export const insertIndicatorSchema = createInsertSchema(idpProjectIndicators).omit({
  id: true,
  createdDate: true,
});

export const insertCommentSchema = createInsertSchema(idpPublicComments).omit({
  id: true,
  createdDate: true,
});

export const insertCommentResponseSchema = createInsertSchema(idpCommentResponses).omit({
  id: true,
  createdDate: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type IdpCycle = typeof idpCycles.$inferSelect;
export type InsertCycle = z.infer<typeof insertCycleSchema>;
export type IdpProcessPhase = typeof idpProcessPhases.$inferSelect;
export type InsertProcessPhase = z.infer<typeof insertProcessPhaseSchema>;
export type IdpMilestone = typeof idpMilestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type IdpStrategicObjective = typeof idpStrategicObjectives.$inferSelect;
export type InsertObjective = z.infer<typeof insertObjectiveSchema>;
export type IdpProject = typeof idpProjects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type IdpProjectIndicator = typeof idpProjectIndicators.$inferSelect;
export type InsertIndicator = z.infer<typeof insertIndicatorSchema>;
export type IdpPublicComment = typeof idpPublicComments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type IdpCommentResponse = typeof idpCommentResponses.$inferSelect;
export type InsertCommentResponse = z.infer<typeof insertCommentResponseSchema>;
export type AuditLogEntry = typeof auditLog.$inferSelect;
