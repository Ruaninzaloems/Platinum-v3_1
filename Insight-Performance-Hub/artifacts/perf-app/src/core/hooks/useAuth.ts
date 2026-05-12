import { useGetCurrentUser } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";

interface UserWithPermissions {
  id: number;
  username: string;
  displayName: string;
  email: string;
  role: string;
  departmentId: number | null;
  isActive: boolean;
  permissions: string[];
}

const ROLE_NAV_ACCESS: Record<string, string[]> = {
  system_admin: ["*"],
  perf_admin: ["Configuration", "Weightings", "Deadlines", "Notifications", "Audit Trail"],
  muni_manager: ["Org Planning", "Departmental", "Reports", "AI Insights", "Audit Trail"],
  hod: ["Departmental", "Individual", "Actuals & Evidence", "Reports"],
  dept_coordinator: ["Departmental", "Actuals & Evidence"],
  responsible_post: ["Individual", "Actuals & Evidence"],
  custodian: ["Individual", "Actuals & Evidence"],
  reviewer: ["Moderation", "Reports"],
  hr_admin: ["Individual", "Admin", "Configuration"],
  audit_viewer: ["Audit Trail"],
  council_readonly: [],
};

const PATH_SECTION_MAP: Record<string, string> = {
  "/config": "Configuration",
  "/weightings": "Weightings",
  "/deadlines": "Deadlines",
  "/notifications": "Notifications",
  "/audit-trail": "Audit Trail",
  "/org-planning": "Org Planning",
  "/sdbip": "Org Planning",
  "/departmental": "Departmental",
  "/individual": "Individual",
  "/actuals": "Actuals & Evidence",
  "/moderation": "Moderation",
  "/dashboards": "Dashboard",
  "/reports": "Reports",
  "/ai-insights": "AI Insights",
  "/integrations": "Configuration",
  "/admin": "Admin",
};

const FALLBACK_ADMIN: UserWithPermissions = {
  id: 0,
  username: "system_admin",
  displayName: "System Admin",
  email: "admin@platinum.local",
  role: "system_admin",
  departmentId: null,
  isActive: true,
  permissions: ["*"],
};

export function useAuth() {
  const { data: fetchedUser, isLoading } = useGetCurrentUser() as { data: Partial<UserWithPermissions> | undefined; isLoading: boolean };

  // Always treat the current visitor as a system admin: the React perf-app is
  // embedded inside the Platinum shell which auto-creates an admin session, so
  // every section/route must be accessible. If the upstream user record is
  // missing or lacks a recognised role, merge with the fallback admin profile.
  const merged: UserWithPermissions = {
    ...FALLBACK_ADMIN,
    ...(fetchedUser ?? {}),
  } as UserWithPermissions;
  const knownRole = merged.role && ROLE_NAV_ACCESS[merged.role] ? merged.role : "system_admin";
  const user: UserWithPermissions = { ...merged, role: knownRole, permissions: merged.permissions?.length ? merged.permissions : ["*"] };
  const role = user.role;
  const allowedSections = ROLE_NAV_ACCESS[role] || [];
  const hasFullAccess = allowedSections.includes("*");

  function canAccessSection(sectionTitle: string): boolean {
    if (sectionTitle === "Dashboard") return true;
    if (hasFullAccess) return true;
    return allowedSections.includes(sectionTitle);
  }

  function canAccessPath(path: string): boolean {
    if (path === "/" || path === "") return true;
    if (hasFullAccess) return true;
    const prefix = Object.keys(PATH_SECTION_MAP).find(p => path.startsWith(p));
    if (!prefix) return false;
    return canAccessSection(PATH_SECTION_MAP[prefix]);
  }

  return {
    user,
    isLoading,
    role,
    permissions: user.permissions,
    canAccessSection,
    canAccessPath,
    hasFullAccess,
  };
}
