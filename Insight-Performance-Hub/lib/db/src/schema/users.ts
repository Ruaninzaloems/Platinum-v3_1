import { pgTable, serial, text, boolean, integer, timestamp, date, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("responsible_post"),
  departmentId: integer("department_id"),
  employeeNumber: text("employee_number"),
  firstName: text("first_name"),
  surname: text("surname"),
  idNumber: text("id_number"),
  cellphone: text("cellphone"),
  jobTitle: text("job_title"),
  level: text("level"),
  supervisorId: integer("supervisor_id"),
  divisionId: integer("division_id"),
  performanceCategory: text("performance_category"),
  startDate: date("start_date"),
  terminationDate: date("termination_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("users_employee_number_lower_uq").on(sql`lower(${t.employeeNumber})`).where(sql`${t.employeeNumber} IS NOT NULL`),
]);

export const rolesTable = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description").notNull().default(""),
});

export const rolePermissionsTable = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleCode: text("role_code").notNull().references(() => rolesTable.code),
  permission: text("permission").notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type Role = typeof rolesTable.$inferSelect;
export type RolePermission = typeof rolePermissionsTable.$inferSelect;
