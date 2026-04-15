import { pgTable, serial, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const performanceCyclesTable = pgTable("performance_cycles", {
  id: serial("id").primaryKey(),
  financialYearLabel: text("financial_year_label").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").notNull().default("Draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCycleSchema = createInsertSchema(performanceCyclesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCycle = z.infer<typeof insertCycleSchema>;
export type PerformanceCycle = typeof performanceCyclesTable.$inferSelect;
