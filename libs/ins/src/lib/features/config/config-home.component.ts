import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '@ins-shared/components/page-header/page-header.component';

interface ConfigLink { title: string; description: string; href: string; icon: string; }
interface ConfigSection { id: string; title: string; subtitle: string; icon: string; links: ConfigLink[]; }

const SECTIONS: ConfigSection[] = [
  {
    id: 'opms',
    title: 'OPMS',
    subtitle: 'Organisational Performance Management System',
    icon: 'trending_up',
    links: [
      { title: 'National KPAs', description: 'Capture the national key performance areas.', href: '/config/national-kpas', icon: 'flag' },
      { title: 'Units of Measure', description: 'Units used when capturing KPI targets and actuals.', href: '/config/units', icon: 'bar_chart' },
      { title: 'Scorecard Types', description: 'Categories of scorecards used across the organisation.', href: '/config/scorecard-types', icon: 'list_alt' },
      { title: 'Scorecard Wizard', description: 'Define scorecards and configure which fields appear on each SDBIP capture form.', href: '/config/scorecards', icon: 'list_alt' },
      { title: 'Indicator Technical Descriptions', description: 'Technical descriptions for indicators.', href: '/config/indicator-descriptions', icon: 'find_in_page' },
      { title: 'KPI Scoring & Rating Thresholds', description: 'OPMS scoring formula and the 5-point rating scale bands.', href: '/config/kpi-scoring', icon: 'calculate' },
      { title: 'SDBIP Compliance Reference', description: 'Read-only MFMA legislative requirements, aligned with the dashboard milestone calendar.', href: '/config/sdbip-compliance', icon: 'description' },
    ],
  },
  {
    id: 'ipms',
    title: 'IPMS',
    subtitle: 'Individual Performance Management System',
    icon: 'person',
    links: [
      { title: 'Competencies', description: 'Competency weightings for individual assessments.', href: '/weightings/competencies', icon: 'groups' },
    ],
  },
  {
    id: 'system',
    title: 'System',
    subtitle: 'System-wide settings',
    icon: 'settings',
    links: [
      { title: 'Financial Year', description: 'Manage financial years used across the system.', href: '/config/cycles', icon: 'calendar_month' },
      { title: 'Performance Cycles', description: 'Financial-year performance cycles.', href: '/config/cycles', icon: 'event' },
      { title: 'Notification Centre', description: 'View and manage notifications.', href: '/notifications', icon: 'notifications' },
      { title: 'Notification Settings', description: 'Configure notification rules and channels.', href: '/notifications/config', icon: 'settings' },
    ],
  },
];

@Component({
  selector: 'app-config-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="System Configuration" subtitle="Manage performance thresholds, scoring parameters, and compliance references — split by module." icon="settings" tone="indigo"></app-page-header>

      <div class="tabs" role="tablist" aria-label="Configuration module">
        <button
          *ngFor="let s of sections"
          type="button"
          role="tab"
          class="tab"
          [class.tab--active]="s.id === activeId()"
          [attr.aria-selected]="s.id === activeId()"
          (click)="select(s.id)"
        >
          <mat-icon>{{ s.icon }}</mat-icon>
          <span>{{ s.title }}</span>
        </button>
      </div>

      <div class="section" *ngIf="activeSection() as s">
        <p class="section-sub">{{ s.subtitle }}</p>
        <div class="grid">
          <a *ngFor="let l of s.links" class="plat-card tile" [routerLink]="l.href">
            <mat-icon class="tile-icon">{{ l.icon }}</mat-icon>
            <div class="tile-body">
              <div class="tile-title">{{ l.title }}</div>
              <div class="tile-desc">{{ l.description }}</div>
            </div>
            <mat-icon class="tile-chev">chevron_right</mat-icon>
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .tabs { display: inline-flex; align-items: center; gap: 4px; margin-top: 16px; padding: 4px; background: #f1f5f9; border: 1px solid var(--plat-border); border-radius: 10px; }
    .tab { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: 0; border-radius: 8px; background: transparent; cursor: pointer; font-size: 13px; font-weight: 600; color: #64748b; transition: background .15s, color .15s, box-shadow .15s; }
    .tab mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .tab:hover { color: #0f172a; }
    .tab--active { background: #fff; color: #0f172a; box-shadow: 0 1px 3px rgba(15, 23, 42, .12); }
    .section { margin-top: 18px; }
    .section-sub { margin: 0 0 12px; font-size: 12px; color: #64748b; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
    .tile { display: flex; align-items: center; gap: 12px; padding: 14px 16px; text-decoration: none; transition: box-shadow .15s, border-color .15s; }
    .tile:hover { text-decoration: none; box-shadow: 0 2px 8px rgba(15, 23, 42, .08); }
    .tile-icon { color: #4f46e5; flex-shrink: 0; }
    .tile-body { flex: 1; min-width: 0; }
    .tile-title { font-weight: 600; font-size: 14px; color: #0f172a; }
    .tile-desc { font-size: 12px; color: #64748b; margin-top: 2px; }
    .tile-chev { color: #cbd5e1; flex-shrink: 0; }
  `],
})
export class ConfigHomeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly sections = SECTIONS;

  private readonly tabParam = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('tab'))),
    { initialValue: null as string | null },
  );

  readonly activeId = computed(() => {
    const t = this.tabParam();
    return SECTIONS.some((s) => s.id === t) ? (t as string) : 'opms';
  });

  readonly activeSection = computed(() => SECTIONS.find((s) => s.id === this.activeId()) ?? SECTIONS[0]);

  select(id: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: id === 'opms' ? null : id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
