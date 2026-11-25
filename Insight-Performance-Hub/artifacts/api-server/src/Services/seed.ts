import { db } from "@workspace/db";
import { usersTable, rolesTable, rolePermissionsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { seedDemoData } from "./seed-data";

export async function seedDatabase() {
  const roles = [
    { code: "system_admin", name: "System Administrator", description: "Full system access" },
    { code: "perf_admin", name: "Performance Administrator", description: "Manage performance configuration" },
    { code: "muni_manager", name: "Municipal Manager", description: "Overall municipal performance oversight" },
    { code: "hod", name: "Head of Department", description: "Department-level management" },
    { code: "dept_coordinator", name: "Departmental Coordinator", description: "Department coordination" },
    { code: "responsible_post", name: "Responsible Post", description: "KPI responsible person" },
    { code: "custodian", name: "Custodian", description: "KPI custodian" },
    { code: "reviewer", name: "Reviewer", description: "Review and moderate" },
    { code: "hr_admin", name: "HR Administrator", description: "HR administration" },
    { code: "audit_viewer", name: "Audit Viewer", description: "Read-only audit access" },
    { code: "council_readonly", name: "Council Read-only", description: "Council read-only access" },
  ];

  for (const role of roles) {
    const [exists] = await db.select().from(rolesTable).where(eq(rolesTable.code, role.code));
    if (!exists) {
      await db.insert(rolesTable).values(role);
    }
  }

  const permissions = [
    { roleCode: "system_admin", permission: "*" },
    { roleCode: "perf_admin", permission: "cycles.create" },
    { roleCode: "perf_admin", permission: "cycles.update" },
    { roleCode: "perf_admin", permission: "cycles.delete" },
    { roleCode: "perf_admin", permission: "config.create" },
    { roleCode: "perf_admin", permission: "config.update" },
    { roleCode: "perf_admin", permission: "config.delete" },
    { roleCode: "perf_admin", permission: "config.manage" },
    { roleCode: "perf_admin", permission: "weightings.create" },
    { roleCode: "perf_admin", permission: "weightings.update" },
    { roleCode: "perf_admin", permission: "weightings.delete" },
    { roleCode: "perf_admin", permission: "deadlines.create" },
    { roleCode: "perf_admin", permission: "deadlines.update" },
    { roleCode: "perf_admin", permission: "agreement.edit" },
    { roleCode: "perf_admin", permission: "reviewer.manage" },
    { roleCode: "perf_admin", permission: "assessment.edit" },
    { roleCode: "perf_admin", permission: "moderation.manage" },
    { roleCode: "perf_admin", permission: "integration.manage" },
    { roleCode: "hod", permission: "agreement.edit" },
    { roleCode: "hod", permission: "reviewer.manage" },
    { roleCode: "hod", permission: "assessment.edit" },
    { roleCode: "hod", permission: "moderation.manage" },
    { roleCode: "dept_coordinator", permission: "agreement.edit" },
    { roleCode: "dept_coordinator", permission: "assessment.edit" },
    { roleCode: "reviewer", permission: "assessment.edit" },
    { roleCode: "responsible_post", permission: "agreement.edit" },
    { roleCode: "hr_admin", permission: "agreement.edit" },
    { roleCode: "hr_admin", permission: "reviewer.manage" },
    { roleCode: "hr_admin", permission: "integration.manage" },
    { roleCode: "muni_manager", permission: "agreement.edit" },
    { roleCode: "muni_manager", permission: "reviewer.manage" },
    { roleCode: "muni_manager", permission: "assessment.edit" },
    { roleCode: "muni_manager", permission: "moderation.manage" },
    { roleCode: "muni_manager", permission: "config.manage" },
    { roleCode: "audit_viewer", permission: "audit.view" },
    { roleCode: "council_readonly", permission: "dashboard.view" },
  ];

  for (const perm of permissions) {
    const [exists] = await db.select().from(rolePermissionsTable)
      .where(and(eq(rolePermissionsTable.roleCode, perm.roleCode), eq(rolePermissionsTable.permission, perm.permission)));
    if (!exists) {
      await db.insert(rolePermissionsTable).values(perm);
    }
  }

  const [existingAdmin] = await db.select().from(usersTable).where(eq(usersTable.username, "admin"));
  if (!existingAdmin) {
    await db.insert(usersTable).values({
      username: "admin",
      displayName: "System Administrator",
      email: "admin@municipality.gov.za",
      role: "system_admin",
      departmentId: null,
      isActive: true,
    });
  }

  console.log("Seed: database seeded with roles, permissions, and admin user");

  await seedDemoData();
}
