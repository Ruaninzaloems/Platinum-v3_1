import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const sdbipFieldConfigsTable = pgTable("sdbip_field_configs", {
  id: serial("id").primaryKey(),
  sdbipType: text("sdbip_type").notNull(),
  fieldKind: text("field_kind").notNull().default("primary"),
  fieldKey: text("field_key").notNull(),
  fieldLabel: text("field_label").notNull(),
  fieldType: text("field_type").notNull().default("text"),
  isIncluded: boolean("is_included").notNull().default(true),
  isRequired: boolean("is_required").notNull().default(false),
  isLocked: boolean("is_locked").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SdbipFieldConfig = typeof sdbipFieldConfigsTable.$inferSelect;
