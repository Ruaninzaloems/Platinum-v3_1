export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'orange';

export interface StatusBadgeConfig {
  cssClass: string;
  variant: StatusBadgeVariant;
}

export function getStatusBadgeConfigById(appStatusId: number): StatusBadgeConfig {
  switch (appStatusId) {
    case 140:
      return { cssClass: 'badge-success', variant: 'success' };
    case 134:
    case 135:
    case 136:
      return { cssClass: 'badge-warning', variant: 'warning' };
    case 145:
    case 138:
      return { cssClass: 'badge-danger', variant: 'danger' };
    case 137:
    case 139:
      return { cssClass: 'badge-info', variant: 'info' };
    case 142:
    case 141:
      return { cssClass: 'badge-grey', variant: 'default' };
    case 146:
      return { cssClass: 'badge-orange', variant: 'orange' };
    case 143:
    case 144:
      return { cssClass: 'badge-warning', variant: 'warning' };
    default:
      return { cssClass: 'badge-default', variant: 'default' };
  }
}

export function getStatusBadgeConfig(statusName: string): StatusBadgeConfig {
  switch (statusName?.toLowerCase()) {
    case 'active':
      return { cssClass: 'badge-success', variant: 'success' };
    case 'application':
    case 're-application':
    case 'awaiting verification':
      return { cssClass: 'badge-warning', variant: 'warning' };
    case 'termination':
    case 'verification disqualify':
      return { cssClass: 'badge-danger', variant: 'danger' };
    case 'verification authorisation':
    case 'awaiting authorisation':
      return { cssClass: 'badge-info', variant: 'info' };
    case 're-application expiry':
      return { cssClass: 'badge-orange', variant: 'orange' };
    case 'application declined':
    case 'application cancelled':
      return { cssClass: 'badge-grey', variant: 'default' };
    case 'disqualified authorisation':
    case 'termination authorisation':
      return { cssClass: 'badge-warning', variant: 'warning' };
    default:
      return { cssClass: 'badge-default', variant: 'default' };
  }
}

export function getStatusBadgeClass(statusNameOrId: string | number): string {
  if (typeof statusNameOrId === 'number') {
    return getStatusBadgeConfigById(statusNameOrId).cssClass;
  }
  return getStatusBadgeConfig(statusNameOrId).cssClass;
}

export function getExpiryBadgeClass(days: number): string {
  if (days < 7) return 'badge-danger';
  if (days < 30) return 'badge-warning';
  return 'badge-success';
}
