import { pgTable, serial, text, integer, date, boolean } from "drizzle-orm/pg-core";
import { performanceCyclesTable } from "./performance-cycles";

export const submissionDeadlinesTable = pgTable("submission_deadlines", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").notNull().references(() => performanceCyclesTable.id),
  quarter: integer("quarter").notNull(),
  deadlineDate: date("deadline_date").notNull(),
  reminderDaysBefore: integer("reminder_days_before").notNull().default(7),
  isActive: boolean("is_active").notNull().default(true),
});

export const reportFieldsTable = pgTable("report_fields", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").notNull().references(() => performanceCyclesTable.id),
  reportType: text("report_type").notNull(),
  fieldName: text("field_name").notNull(),
  fieldLabel: text("field_label").notNull(),
  fieldType: text("field_type").notNull(),
  isRequired: boolean("is_required").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type SubmissionDeadline = typeof submissionDeadlinesTable.$inferSelect;
export type ReportField = typeof reportFieldsTable.$inferSelect;
