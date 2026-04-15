import { pgTable, serial, text, integer, doublePrecision, boolean } from "drizzle-orm/pg-core";
import { performanceCyclesTable } from "./performance-cycles";

export const nkpaWeightingsTable = pgTable("nkpa_weightings", {
  id: serial("id").primaryKey(),
  nkpaName: text("nkpa_name").notNull(),
  weight: doublePrecision("weight").notNull(),
  scope: text("scope").notNull(),
  cycleId: integer("cycle_id").notNull().references(() => performanceCyclesTable.id),
  departmentId: integer("department_id"),
});

export const competencyRequirementsTable = pgTable("competency_requirements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  weight: doublePrecision("weight").notNull(),
  cycleId: integer("cycle_id").notNull().references(() => performanceCyclesTable.id),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type NkpaWeighting = typeof nkpaWeightingsTable.$inferSelect;
export type CompetencyRequirement = typeof competencyRequirementsTable.$inferSelect;
