import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DashboardNavStore {
  readonly requestedTab = signal<string | null>(null);
  readonly pendingDeptId = signal<number | null>(null);
  readonly pendingQuarter = signal<number | null>(null);

  openDepartment(deptId: number, quarter?: number): void {
    this.pendingDeptId.set(deptId);
    this.pendingQuarter.set(quarter ?? null);
    this.requestedTab.set('dept-status');
  }

  consumeTabRequest(): string | null {
    const tab = this.requestedTab();
    if (tab) this.requestedTab.set(null);
    return tab;
  }

  consumePendingDeptId(): number | null {
    const id = this.pendingDeptId();
    if (id !== null) this.pendingDeptId.set(null);
    return id;
  }

  consumePendingQuarter(): number | null {
    const q = this.pendingQuarter();
    if (q !== null) this.pendingQuarter.set(null);
    return q;
  }
}
