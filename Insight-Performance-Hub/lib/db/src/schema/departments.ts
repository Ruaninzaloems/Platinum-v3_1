import { pgTable, serial, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { performanceCyclesTable } from "./performance-cycles";

export const departmentsTable = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cycleId: integer("cycle_id").notNull().references(() => performanceCyclesTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("departments_cycle_name_uq").on(t.cycleId, sql`lower(${t.name})`),
]);

export const divisionsTable = pgTable("divisions", {
  id: serial("id").primaryKey(),
  departmentId: integer("department_id").notNull().references(() => departmentsTable.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("divisions_department_name_uq").on(t.departmentId, sql`lower(${t.name})`),
]);

export type Department = typeof departmentsTable.$inferSelect;
export type Division = typeof divisionsTable.$inferSelect;
