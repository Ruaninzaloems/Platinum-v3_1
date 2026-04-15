import { pgTable, serial, text, boolean, integer } from "drizzle-orm/pg-core";
import { performanceCyclesTable } from "./performance-cycles";

export const kpiGroupsTable = pgTable("kpi_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  parentId: integer("parent_id"),
  cycleId: integer("cycle_id").notNull().references(() => performanceCyclesTable.id),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const unitsOfMeasureTable = pgTable("units_of_measure", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  abbreviation: text("abbreviation").notNull(),
  cycleId: integer("cycle_id").notNull().references(() => performanceCyclesTable.id),
  isActive: boolean("is_active").notNull().default(true),
});

export const kpiDataTypesTable = pgTable("kpi_data_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const progressStatusesTable = pgTable("progress_statuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  color: text("color").notNull().default("#3b82f6"),
  cycleId: integer("cycle_id").notNull().references(() => performanceCyclesTable.id),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const scorecardTypesTable = pgTable("scorecard_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  description: text("description").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
});

export type KpiGroup = typeof kpiGroupsTable.$inferSelect;
export type UnitOfMeasure = typeof unitsOfMeasureTable.$inferSelect;
export type KpiDataType = typeof kpiDataTypesTable.$inferSelect;
export type ProgressStatus = typeof progressStatusesTable.$inferSelect;
export type ScorecardType = typeof scorecardTypesTable.$inferSelect;
