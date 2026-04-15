import { Injectable, signal, computed } from '@angular/core';

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  dismissed: boolean;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

@Injectable({ providedIn: 'root' })
export class AppStateService {
  private loadingCount = signal(0);
  private notificationsSignal = signal<AppNotification[]>([]);
  private breadcrumbsSignal = signal<BreadcrumbItem[]>([]);
  private pageTitleSignal = signal('');
  private sidebarCollapsedSignal = signal(false);

  isLoading = computed(() => this.loadingCount() > 0);
  notifications = this.notificationsSignal.asReadonly();
  breadcrumbs = this.breadcrumbsSignal.asReadonly();
  pageTitle = this.pageTitleSignal.asReadonly();
  sidebarCollapsed = this.sidebarCollapsedSignal.asReadonly();

  activeNotifications = computed(() => this.notificationsSignal().filter(n => !n.dismissed));

  startLoading(): void {
    this.loadingCount.update(c => c + 1);
  }

  stopLoading(): void {
    this.loadingCount.update(c => Math.max(0, c - 1));
  }

  setPageTitle(title: string): void {
    this.pageTitleSignal.set(title);
  }

  setBreadcrumbs(items: BreadcrumbItem[]): void {
    this.breadcrumbsSignal.set(items);
  }

  toggleSidebar(): void {
    this.sidebarCollapsedSignal.update(v => !v);
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsedSignal.set(collapsed);
  }

  notify(type: AppNotification['type'], message: string): void {
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: new Date(),
      dismissed: false
    };
    this.notificationsSignal.update(list => [notification, ...list].slice(0, 50));

    if (type !== 'error') {
      setTimeout(() => this.dismiss(notification.id), 5000);
    }
  }

  dismiss(id: string): void {
    this.notificationsSignal.update(list =>
      list.map(n => n.id === id ? { ...n, dismissed: true } : n)
    );
  }

  clearAll(): void {
    this.notificationsSignal.set([]);
  }
}
