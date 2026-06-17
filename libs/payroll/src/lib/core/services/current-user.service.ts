import { Injectable, signal } from '@angular/core';

export interface DevUser {
  userId: number;
  userName: string;
  displayName: string;
  roles: string[];
  employeeId?: number;
}

export const DEV_USERS: DevUser[] = [
  { userId: 1, userName: 'admin', displayName: 'System Admin', roles: ['admin', 'hr_manager', 'payroll_admin', 'supervisor', 'employee'], employeeId: 3508 },
  { userId: 2, userName: 'hr_mgr', displayName: 'HR Manager', roles: ['hr_manager', 'employee'], employeeId: 3509 },
  { userId: 3, userName: 'payroll', displayName: 'Payroll Admin', roles: ['payroll_admin', 'employee'], employeeId: 3510 },
  { userId: 4, userName: 'supervisor', displayName: 'Supervisor', roles: ['supervisor', 'employee'], employeeId: 3511 },
  { userId: 5, userName: 'employee', displayName: 'Employee', roles: ['employee'], employeeId: 3512 },
];

const STORAGE_KEY = 'mscoa_dev_user';

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  readonly currentUser = signal<DevUser>(this.loadUser());

  private loadUser(): DevUser {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DevUser;
        const match = DEV_USERS.find(u => u.userId === parsed.userId);
        if (match) return match;
      }
    } catch {}
    return DEV_USERS[0];
  }

  getCurrentUser(): DevUser {
    return this.currentUser();
  }

  setCurrentUser(user: DevUser): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  getInitials(): string {
    const parts = this.currentUser().displayName.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  }
}
