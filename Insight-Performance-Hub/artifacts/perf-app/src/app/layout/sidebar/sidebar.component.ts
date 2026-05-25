import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@core/services/auth.service';

interface NavLink { title: string; href: string; icon: string; }
interface NavGroup { title: string; icon: string; items: NavLink[]; section?: string; }
type NavEntry = (NavLink & { items?: undefined }) | NavGroup;

const NAV: NavEntry[] = [
  { title: 'Dashboard', href: '/', icon: 'dashboard' },
  {
    title: 'Original SDBIP', icon: 'apartment', section: 'Org Planning', items: [
      { title: 'Capture SDBIP', href: '/org-planning/scorecards', icon: 'task_alt' },
      { title: 'Review SDBIP', href: '/org-planning/review-sdbip', icon: 'find_in_page' },
      { title: 'Approve SDBIP', href: '/org-planning/approve-sdbip', icon: 'verified' },
      { title: 'Targets & Activities', href: '/org-planning/quarterly-targets', icon: 'event' },
      { title: 'SDBIP Overview', href: '/sdbip/overview', icon: 'track_changes' },
    ],
  },
  {
    title: 'Revised SDBIP', icon: 'autorenew', section: 'Org Planning', items: [
      { title: 'Revise SDBIP', href: '/revised-sdbip/capture', icon: 'task_alt' },
      { title: 'Review Revised SDBIP', href: '/revised-sdbip/review', icon: 'find_in_page' },
      { title: 'Approve Revised SDBIP', href: '/revised-sdbip/approve', icon: 'verified' },
    ],
  },
  {
    title: 'Departmental', icon: 'groups', items: [
      { title: 'Dept Scorecards', href: '/departmental/scorecards', icon: 'task_alt' },
      { title: 'KPI Assignments', href: '/departmental/kpi-assignments', icon: 'track_changes' },
    ],
  },
  {
    title: 'Individual', icon: 'person', items: [
      { title: 'My Performance', href: '/individual/my-performance', icon: 'trending_up' },
      { title: 'Agreements', href: '/individual/agreements', icon: 'description' },
      { title: 'Reviewer Config', href: '/individual/reviewers', icon: 'manage_accounts' },
      { title: 'Competencies', href: '/individual/competencies', icon: 'menu_book' },
      { title: 'Assessments', href: '/individual/assessments', icon: 'task_alt' },
    ],
  },
  {
    title: 'Actuals & Evidence', icon: 'fact_check', items: [
      { title: 'Submit Actuals', href: '/actuals/submit', icon: 'description' },
      { title: 'Review - Line Manager', href: '/actuals/review-line-manager', icon: 'manage_accounts' },
      { title: 'Review - Director', href: '/actuals/review-director', icon: 'manage_accounts' },
      { title: 'Review - PMS Manager', href: '/actuals/review-pms-manager', icon: 'manage_accounts' },
      { title: 'Review - PMS Director', href: '/actuals/review-pms-director', icon: 'manage_accounts' },
      { title: 'Review - Internal Audit', href: '/actuals/review-internal-audit', icon: 'verified' },
      { title: 'Corrective Actions', href: '/actuals/corrective-actions', icon: 'report' },
    ],
  },
  {
    title: 'Moderation', icon: 'balance', items: [
      { title: 'Review Queue', href: '/moderation/queue', icon: 'list_alt' },
      { title: 'Moderation Panel', href: '/moderation/panel', icon: 'balance' },
    ],
  },
  {
    title: 'Reports', icon: 'menu_book', items: [
      { title: 'Report Centre', href: '/reports/centre', icon: 'description' },
      { title: 'Standard Reports', href: '/reports/standard', icon: 'description' },
      { title: 'Custom Reports', href: '/reports/custom', icon: 'bar_chart' },
    ],
  },
  { title: 'AI Insights', href: '/ai-insights', icon: 'psychology' },
  { title: 'Integrations', href: '/integrations', icon: 'hub' },
  { title: 'Audit Trail', href: '/audit-trail', icon: 'gpp_maybe' },
  {
    title: 'Configuration', icon: 'settings', items: [
      { title: 'Performance Cycles', href: '/config/cycles', icon: 'event' },
      { title: 'KPI Groups', href: '/config/kpi-groups', icon: 'layers' },
      { title: 'Units of Measure', href: '/config/units', icon: 'bar_chart' },
      { title: 'Data Types', href: '/config/data-types', icon: 'description' },
      { title: 'Progress Statuses', href: '/config/statuses', icon: 'flag' },
      { title: 'Scorecard Types', href: '/config/scorecard-types', icon: 'list_alt' },
      { title: 'NKPA Weightings', href: '/weightings/nkpa', icon: 'bar_chart' },
      { title: 'Competencies', href: '/weightings/competencies', icon: 'groups' },
      { title: 'Submission Deadlines', href: '/deadlines/submissions', icon: 'event' },
      { title: 'Report Fields', href: '/deadlines/report-fields', icon: 'description' },
      { title: 'Notification Centre', href: '/notifications', icon: 'notifications' },
      { title: 'Notification Settings', href: '/notifications/config', icon: 'settings' },
      { title: 'Indicator Technical Descriptions', href: '/config/indicator-descriptions', icon: 'find_in_page' },
    ],
  },
  {
    title: 'Admin', icon: 'shield', items: [
      { title: 'User Management', href: '/admin/users', icon: 'groups' },
      { title: 'Role Permissions', href: '/admin/roles', icon: 'shield' },
      { title: 'Workflow Config', href: '/admin/workflows', icon: 'tune' },
    ],
  },
];

const DEFAULT_OPEN = new Set(['Configuration', 'Original SDBIP', 'Revised SDBIP', 'Actuals & Evidence', 'Departmental', 'Moderation', 'Reports', 'Individual', 'Admin']);

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="brand">
      <div class="brand__mark"><mat-icon>monitoring</mat-icon></div>
      <div>
        <div class="brand__title">PLATINUM</div>
        <div class="brand__sub">PERFORMANCE</div>
      </div>
    </div>

    <nav class="nav">
      <ng-container *ngFor="let entry of visibleNav(); let i = index">
        <ng-container *ngIf="!entry.items">
          <a class="nav-item" [routerLink]="entry.href" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: entry.href === '/' }">
            <mat-icon>{{ entry.icon }}</mat-icon><span>{{ entry.title }}</span>
          </a>
        </ng-container>
        <ng-container *ngIf="entry.items">
          <button class="nav-group__head" type="button" (click)="toggle(entry.title)">
            <mat-icon>{{ entry.icon }}</mat-icon>
            <span class="grow">{{ entry.title }}</span>
            <mat-icon class="chev" [class.chev--open]="isOpen(entry.title)">expand_more</mat-icon>
          </button>
          <div class="nav-group__body" *ngIf="isOpen(entry.title)">
            <a *ngFor="let item of entry.items" class="nav-sub" [routerLink]="item.href" routerLinkActive="is-active">{{ item.title }}</a>
          </div>
        </ng-container>
      </ng-container>
    </nav>

    <div class="version">Version 1.0.0</div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; padding: 0; }
    .brand { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--plat-border); }
    .brand__mark { width: 32px; height: 32px; border-radius: 8px; background: #166534; color: #fff; display: grid; place-items: center; }
    .brand__mark mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .brand__title { font-size: 13px; font-weight: 700; color: #0f172a; letter-spacing: .04em; line-height: 1; }
    .brand__sub { font-size: 10px; color: #64748b; letter-spacing: .12em; margin-top: 2px; }
    .nav { flex: 1; overflow-y: auto; padding: 12px 10px; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 9px 12px; border-radius: 8px; color: #475569; font-size: 14px; font-weight: 500; margin-bottom: 2px; border-left: 2px solid transparent; }
    .nav-item:hover { background: #f1f5f9; text-decoration: none; }
    .nav-item.is-active { background: #eff6ff; color: #1d4ed8; border-left-color: #2563eb; font-weight: 600; }
    .nav-item mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .nav-group__head { width: 100%; display: flex; align-items: center; gap: 12px; background: transparent; border: 0; cursor: pointer; padding: 9px 12px; border-radius: 8px; color: #475569; font-size: 14px; font-weight: 500; }
    .nav-group__head:hover { background: #f1f5f9; }
    .nav-group__head mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .grow { flex: 1; text-align: left; }
    .chev { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; transition: transform .15s; }
    .chev--open { transform: rotate(180deg); }
    .nav-group__body { padding: 4px 0 6px 32px; display: flex; flex-direction: column; gap: 2px; }
    .nav-sub { display: block; padding: 7px 12px; border-radius: 6px; font-size: 13px; color: #64748b; border-left: 2px solid transparent; }
    .nav-sub:hover { background: #f1f5f9; color: #0f172a; text-decoration: none; }
    .nav-sub.is-active { background: #eff6ff; color: #1d4ed8; border-left-color: #2563eb; font-weight: 600; }
    .version { padding: 12px 16px; border-top: 1px solid var(--plat-border); font-size: 11px; color: #94a3b8; text-align: center; background: #f8fafc; }
  `],
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly openGroups = signal<Set<string>>(new Set(DEFAULT_OPEN));

  readonly visibleNav = computed(() => NAV.filter((e) => this.auth.canAccessSection(e.title)));

  isOpen(title: string): boolean { return this.openGroups().has(title); }
  toggle(title: string): void {
    const next = new Set(this.openGroups());
    if (next.has(title)) next.delete(title); else next.add(title);
    this.openGroups.set(next);
  }
}
