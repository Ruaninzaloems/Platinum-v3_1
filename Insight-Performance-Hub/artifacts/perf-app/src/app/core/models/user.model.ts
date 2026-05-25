export interface User {
  id: number;
  username: string;
  displayName: string;
  email: string;
  role: string;
  departmentId: number | null;
  isActive: boolean;
  permissions: string[];
}

export const ROLE_NAV_ACCESS: Record<string, string[]> = {
  system_admin: ['*'],
  perf_admin: ['Configuration', 'Weightings', 'Deadlines', 'Notifications', 'Audit Trail'],
  muni_manager: ['Org Planning', 'Departmental', 'Reports', 'AI Insights', 'Audit Trail'],
  hod: ['Departmental', 'Individual', 'Actuals & Evidence', 'Reports'],
  dept_coordinator: ['Departmental', 'Actuals & Evidence'],
  responsible_post: ['Individual', 'Actuals & Evidence'],
  custodian: ['Individual', 'Actuals & Evidence'],
  reviewer: ['Moderation', 'Reports'],
  hr_admin: ['Individual', 'Admin', 'Configuration'],
  audit_viewer: ['Audit Trail'],
  council_readonly: [],
};

export const PATH_SECTION_MAP: Array<[string, string]> = [
  ['/config', 'Configuration'],
  ['/weightings', 'Weightings'],
  ['/deadlines', 'Deadlines'],
  ['/notifications', 'Notifications'],
  ['/audit-trail', 'Audit Trail'],
  ['/org-planning', 'Org Planning'],
  ['/sdbip', 'Org Planning'],
  ['/revised-sdbip', 'Org Planning'],
  ['/departmental', 'Departmental'],
  ['/individual', 'Individual'],
  ['/actuals', 'Actuals & Evidence'],
  ['/moderation', 'Moderation'],
  ['/dashboards', 'Dashboard'],
  ['/reports', 'Reports'],
  ['/ai-insights', 'AI Insights'],
  ['/integrations', 'Configuration'],
  ['/admin', 'Admin'],
];
