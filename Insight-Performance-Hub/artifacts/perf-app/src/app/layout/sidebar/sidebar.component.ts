import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@core/services/auth.service';

interface NavLink { title: string; href: string; icon: string; section?: string; }
interface NavGroup { title: string; icon: string; items: NavLink[]; section?: string; }
interface NavHeading { title: string; heading: true; section?: string; }
type NavEntry = (NavLink & { items?: undefined; heading?: undefined }) | (NavGroup & { heading?: undefined }) | (NavHeading & { items?: undefined; href?: undefined });

const NAV: NavEntry[] = [
  { title: 'Dashboard', href: '/', icon: 'dashboard' },
  {
    title: 'SDBIP', icon: 'apartment', section: 'Org Planning', items: [
      { title: 'Compile', href: '/org-planning/scorecards', icon: 'task_alt' },
      { title: 'Review', href: '/org-planning/review-sdbip', icon: 'find_in_page' },
    ],
  },
  {
    title: 'Revised SDBIP', icon: 'autorenew', section: 'Org Planning', items: [
      { title: 'Compile', href: '/revised-sdbip/capture', icon: 'task_alt' },
      { title: 'Review', href: '/revised-sdbip/review', icon: 'find_in_page' },
    ],
  },
  {
    title: 'Departmental SDBIP', icon: 'groups', section: 'Departmental', items: [
      { title: 'Compile', href: '/departmental/scorecards', icon: 'task_alt' },
      { title: 'Review', href: '/departmental/review', icon: 'find_in_page' },
    ],
  },
  {
    title: 'Quarterly Actuals', icon: 'fact_check', section: 'Actuals & Evidence', items: [
      { title: 'Capture', href: '/actuals/submit', icon: 'description' },
      { title: 'Manager Review', href: '/actuals/review-line-manager', icon: 'manage_accounts' },
      { title: 'PMS Review', href: '/actuals/review-pms-manager', icon: 'manage_accounts' },
      { title: 'Internal Audit', href: '/actuals/review-internal-audit', icon: 'verified' },
    ],
  },
  {
    title: 'Mid-Year', icon: 'event_note', section: 'Actuals & Evidence', items: [
      { title: 'Capture', href: '/mid-year/capture', icon: 'description' },
      { title: 'Manager Review', href: '/mid-year/manager-review', icon: 'manage_accounts' },
      { title: 'PMS Review', href: '/mid-year/pms-review', icon: 'manage_accounts' },
      { title: 'Internal Audit', href: '/mid-year/internal-audit', icon: 'verified' },
    ],
  },
  {
    title: 'Annual', icon: 'calendar_month', section: 'Actuals & Evidence', items: [
      { title: 'Capture', href: '/annual/capture', icon: 'description' },
      { title: 'Manager Review', href: '/annual/manager-review', icon: 'manage_accounts' },
      { title: 'PMS Review', href: '/annual/pms-review', icon: 'manage_accounts' },
      { title: 'Internal Audit', href: '/annual/internal-audit', icon: 'verified' },
    ],
  },
  { title: 'Reports', href: '/reports/centre', icon: 'menu_book' },
  { title: 'Bulk Upload', href: '/bulk-upload', icon: 'upload_file', section: 'Configuration' },
  { title: 'Administration', heading: true, section: 'Configuration' },
  { title: 'Departments', href: '/admin/departments', icon: 'domain', section: 'Configuration' },
  { title: 'Employees', href: '/admin/users', icon: 'group', section: 'Configuration' },
  { title: 'Configuration', href: '/config', icon: 'settings', section: 'Configuration' },
];

const DEFAULT_OPEN = new Set(['SDBIP', 'Revised SDBIP', 'Departmental SDBIP', 'Quarterly Actuals', 'Mid-Year', 'Annual']);

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
        <div class="nav-heading" *ngIf="entry.heading">{{ entry.title }}</div>
        <ng-container *ngIf="!entry.items && !entry.heading">
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
            <a class="nav-sub" *ngFor="let item of entry.items" [routerLink]="item.href" routerLinkActive="is-active">{{ item.title }}</a>
          </div>
        </ng-container>
      </ng-container>
    </nav>

    <div class="version">Version 1.0.0</div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; padding: 0; background: var(--plat-navy); }
    .brand { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid #1e293b; }
    .brand__mark { width: 28px; height: 28px; border-radius: 6px; background: #39C0C0; color: #fff; display: grid; place-items: center; }
    .brand__mark mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .brand__title { font-size: 12px; font-weight: 700; color: #f8fafc; letter-spacing: .02em; line-height: 1; }
    .brand__sub { font-size: 9px; color: #94a3b8; letter-spacing: .1em; margin-top: 2px; }
    .nav { flex: 1; overflow-y: auto; padding: 8px; }
    .nav-heading { padding: 12px 10px 4px; font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #64748b; }
    .nav-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 6px; color: #cbd5e1; font-size: 13px; font-weight: 500; margin-bottom: 1px; border-left: 2px solid transparent; }
    .nav-item:hover { background: #1e293b; color: #39C0C0; text-decoration: none; }
    .nav-item.is-active { background: #0f172a; color: #39C0C0; border-left-color: #39C0C0; font-weight: 600; }
    .nav-item mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .nav-group__head { width: 100%; display: flex; align-items: center; gap: 8px; background: transparent; border: 0; cursor: pointer; padding: 6px 10px; border-radius: 6px; color: #cbd5e1; font-size: 13px; font-weight: 500; margin-bottom: 1px; }
    .nav-group__head:hover { background: #1e293b; color: #f8fafc; }
    .nav-group__head mat-icon { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; }
    .grow { flex: 1; text-align: left; }
    .chev { font-size: 16px; width: 16px; height: 16px; color: #64748b; transition: transform .15s; }
    .chev--open { transform: rotate(180deg); }
    .nav-group__body { padding: 2px 0 4px 26px; display: flex; flex-direction: column; gap: 1px; }
    .nav-sub { display: block; padding: 5px 10px; border-radius: 4px; font-size: 12px; color: #94a3b8; border-left: 2px solid transparent; }
    .nav-sub:hover { background: #1e293b; color: #39C0C0; text-decoration: none; }
    .nav-sub.is-active { background: #0f172a; color: #39C0C0; border-left-color: #39C0C0; font-weight: 600; }
    .version { padding: 8px 12px; border-top: 1px solid #1e293b; font-size: 10px; color: #64748b; text-align: center; }
  `],
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly openGroups = signal<Set<string>>(new Set(DEFAULT_OPEN));

  readonly visibleNav = computed(() => NAV.filter((e) => this.auth.canAccessSection(e.section ?? e.title)));

  isOpen(title: string): boolean { return this.openGroups().has(title); }
  toggle(title: string): void {
    const next = new Set(this.openGroups());
    if (next.has(title)) next.delete(title); else next.add(title);
    this.openGroups.set(next);
  }
}
