import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { DashboardService } from '@core/services/dashboard.service';
import { DashboardStats } from '@core/models/scorecard.model';
import { ExecutiveTabComponent } from './tabs/executive-tab.component';
import { DepartmentTabComponent } from './tabs/department-tab.component';
import { OverviewTabComponent } from './tabs/overview-tab.component';
import { NkpaTabComponent } from './tabs/nkpa-tab.component';
import { AiTabComponent } from './tabs/ai-tab.component';

interface KpiCard {
  label: string;
  value: number;
  delta: string;
  icon: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ExecutiveTabComponent, DepartmentTabComponent, OverviewTabComponent, NkpaTabComponent, AiTabComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <div class="crumb">Home</div>
      <h1 class="page__title">Dashboard</h1>
      <p class="page__sub">Organisational performance at a glance</p>

      <div class="tabs">
        <button class="tabs__tab" [class.is-active]="activeTab() === 'summary'"
                (click)="activeTab.set('summary')">
          <span class="material-symbols-rounded">bar_chart</span> Summary
        </button>
        <button class="tabs__tab" [class.is-active]="activeTab() === 'executive'"
                (click)="activeTab.set('executive')">
          <span class="material-symbols-rounded">trending_up</span> Executive
        </button>
        <button class="tabs__tab" [class.is-active]="activeTab() === 'department'"
                (click)="activeTab.set('department')">
          <span class="material-symbols-rounded">apartment</span> Department
        </button>
        <button class="tabs__tab" [class.is-active]="activeTab() === 'overview'"
                (click)="activeTab.set('overview')">
          <span class="material-symbols-rounded">insights</span> Overview
        </button>
        <button class="tabs__tab" [class.is-active]="activeTab() === 'ai'"
                (click)="activeTab.set('ai')">
          <span class="material-symbols-rounded">auto_awesome</span> AI Analytics
        </button>
        <button class="tabs__tab" [class.is-active]="activeTab() === 'nkpa'"
                (click)="activeTab.set('nkpa')">
          <span class="material-symbols-rounded">donut_small</span> NKPA Performance
        </button>
      </div>

      <ng-container *ngIf="activeTab() === 'summary'">
      <div class="cycle plat-card" *ngIf="stats() as s">
        <span class="cycle__label">Active Cycle:</span>
        <span class="plat-pill plat-pill--success">{{ s.cycleStatus }}</span>
        <span class="cycle__code">{{ s.cycleCode }}</span>
      </div>

      <div class="kpis">
        <div class="kpi plat-card" *ngFor="let c of cards()">
          <div class="kpi__head">
            <div class="kpi__label">{{ c.label }}</div>
            <div class="kpi__icon kpi__icon--{{ c.tone }}">
              <span class="material-symbols-rounded">{{ c.icon }}</span>
            </div>
          </div>
          <div class="kpi__value">{{ c.value }}</div>
          <div class="kpi__foot">
            <span class="material-symbols-rounded trend">trending_up</span>
            <span class="kpi__delta">{{ c.delta }}</span>
            <span class="kpi__from">from last quarter</span>
          </div>
        </div>
      </div>

      <div class="grid">
        <div class="plat-card chart">
          <h3 class="chart__title">
            <span class="material-symbols-rounded">bar_chart</span>
            Performance Trend
          </h3>
          <p class="chart__sub">Quarter over quarter KPI achievement</p>
          <div class="bars">
            <div class="bar" *ngFor="let b of trend">
              <div class="bar__stack">
                <span class="bar__seg bar__seg--miss" [style.height.%]="b.miss"></span>
                <span class="bar__seg bar__seg--partial" [style.height.%]="b.partial"></span>
                <span class="bar__seg bar__seg--met" [style.height.%]="b.met"></span>
              </div>
              <div class="bar__label">{{ b.label }}</div>
            </div>
          </div>
        </div>

        <div class="plat-card chart">
          <h3 class="chart__title">
            <span class="material-symbols-rounded">donut_large</span>
            KPI Distribution
          </h3>
          <p class="chart__sub">Overall status breakdown</p>
          <div class="donut">
            <svg viewBox="0 0 42 42" class="donut__svg">
              <circle cx="21" cy="21" r="15.915" fill="transparent"
                      stroke="#e5e7eb" stroke-width="6" />
              <circle cx="21" cy="21" r="15.915" fill="transparent"
                      stroke="#16a34a" stroke-width="6"
                      [attr.stroke-dasharray]="metPct() + ' ' + (100 - metPct())"
                      stroke-dashoffset="25" />
              <circle cx="21" cy="21" r="15.915" fill="transparent"
                      stroke="#d97706" stroke-width="6"
                      [attr.stroke-dasharray]="atRiskPct() + ' ' + (100 - atRiskPct())"
                      [attr.stroke-dashoffset]="25 - metPct()" />
            </svg>
            <div class="donut__legend">
              <div><span class="dot dot--met"></span> Met ({{ stats()?.achieved ?? 0 }})</div>
              <div><span class="dot dot--partial"></span> At risk ({{ stats()?.atRisk ?? 0 }})</div>
              <div><span class="dot dot--miss"></span> Pending ({{ stats()?.pendingEvidence ?? 0 }})</div>
            </div>
          </div>
        </div>
      </div>
      </ng-container>

      <app-executive-tab *ngIf="activeTab() === 'executive'"></app-executive-tab>
      <app-department-tab *ngIf="activeTab() === 'department'"></app-department-tab>
      <app-overview-tab *ngIf="activeTab() === 'overview'"></app-overview-tab>
      <app-ai-tab *ngIf="activeTab() === 'ai'"></app-ai-tab>
      <app-nkpa-tab *ngIf="activeTab() === 'nkpa'"></app-nkpa-tab>
    </section>
  `,
  styles: [`
    .page { max-width: 1280px; }
    .crumb { font-size: 13px; color: var(--plat-muted); }
    .page__title { font-size: 28px; font-weight: 700; margin: 4px 0 4px; }
    .page__sub { color: var(--plat-muted); margin: 0 0 18px; }

    .tabs { display: flex; gap: 24px; border-bottom: 1px solid var(--plat-border); margin-bottom: 18px; overflow-x: auto; }
    .tabs__tab {
      display: inline-flex; align-items: center; gap: 6px;
      background: transparent; border: 0; padding: 10px 2px;
      color: var(--plat-muted); font-weight: 500; cursor: pointer;
      border-bottom: 2px solid transparent;
      white-space: nowrap;
    }
    .tabs__tab.is-active { color: var(--plat-blue); border-bottom-color: var(--plat-blue); }
    .tabs__tab .material-symbols-rounded { font-size: 18px; }

    .cycle {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 10px 16px; margin-bottom: 18px;
    }
    .cycle__label { color: var(--plat-muted); font-weight: 500; }
    .cycle__code { font-weight: 600; }

    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
    .kpi__head { display: flex; justify-content: space-between; align-items: flex-start; }
    .kpi__label { font-size: 12px; font-weight: 600; color: var(--plat-muted); letter-spacing: .04em; text-transform: uppercase; }
    .kpi__icon { width: 40px; height: 40px; border-radius: 10px; display: grid; place-items: center; }
    .kpi__icon--info    { background: var(--plat-blue-100);  color: var(--plat-blue); }
    .kpi__icon--success { background: var(--plat-success-bg); color: #166534; }
    .kpi__icon--warning { background: var(--plat-warning-bg); color: #92400e; }
    .kpi__icon--danger  { background: var(--plat-danger-bg);  color: #991b1b; }
    .kpi__value { font-size: 36px; font-weight: 700; margin: 14px 0 8px; }
    .kpi__foot { display: flex; align-items: center; gap: 6px; font-size: 13px; }
    .kpi__delta { color: var(--plat-success); font-weight: 600; }
    .kpi__from { color: var(--plat-muted); }
    .trend { color: var(--plat-success); font-size: 18px; }

    .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
    .chart__title { display: flex; align-items: center; gap: 8px; margin: 0 0 4px; font-size: 16px; }
    .chart__sub { color: var(--plat-muted); margin: 0 0 18px; }

    .bars { display: flex; align-items: flex-end; justify-content: space-around; height: 240px; gap: 24px; padding: 0 12px; }
    .bar { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; height: 100%; }
    .bar__stack { width: 56px; height: 100%; display: flex; flex-direction: column-reverse; gap: 0; }
    .bar__seg { width: 100%; }
    .bar__seg--met     { background: #6ee7b7; }
    .bar__seg--partial { background: #fcd34d; }
    .bar__seg--miss    { background: #fca5a5; }
    .bar__label { font-size: 12px; color: var(--plat-muted); }

    .donut { display: flex; align-items: center; gap: 18px; }
    .donut__svg { width: 160px; height: 160px; transform: rotate(-90deg); }
    .donut__legend { display: flex; flex-direction: column; gap: 8px; font-size: 13px; }
    .dot { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 8px; vertical-align: middle; }
    .dot--met     { background: #16a34a; }
    .dot--partial { background: #d97706; }
    .dot--miss    { background: #e5e7eb; }
  `],
})
export class DashboardComponent {
  private readonly dashboard = inject(DashboardService);

  readonly activeTab = signal<'summary' | 'executive' | 'department' | 'overview' | 'ai' | 'nkpa'>('summary');

  readonly stats = toSignal<DashboardStats | null>(
    this.dashboard.getDashboardStats().pipe(catchError(() => of(null))),
    { initialValue: null },
  );

  readonly cards = computed<KpiCard[]>(() => {
    const s = this.stats();
    // No fake fallback numbers: if the API call fails we render zeros
    // so the integration failure is visible instead of being hidden.
    return [
      { label: 'Total KPIs',       value: s?.totalKpis ?? 0,        delta: '+5%', icon: 'track_changes', tone: 'info' },
      { label: 'Achieved',         value: s?.achieved ?? 0,         delta: '+5%', icon: 'check_circle',  tone: 'success' },
      { label: 'At Risk',          value: s?.atRisk ?? 0,           delta: '+5%', icon: 'warning',       tone: 'warning' },
      { label: 'Pending Evidence', value: s?.pendingEvidence ?? 0,  delta: '+5%', icon: 'schedule',      tone: 'danger' },
    ];
  });

  readonly metPct = computed(() => {
    const s = this.stats();
    const t = (s?.totalKpis ?? 1) || 1;
    return Math.round(((s?.achieved ?? 0) / t) * 100);
  });

  readonly atRiskPct = computed(() => {
    const s = this.stats();
    const t = (s?.totalKpis ?? 1) || 1;
    return Math.round(((s?.atRisk ?? 0) / t) * 100);
  });

  readonly trend = [
    { label: 'Q1 2024', met: 50, partial: 30, miss: 20 },
    { label: 'Q2 2024', met: 60, partial: 25, miss: 15 },
    { label: 'Q3 2024', met: 55, partial: 30, miss: 15 },
    { label: 'Q4 2024', met: 70, partial: 20, miss: 10 },
    { label: 'Q1 2025', met: 75, partial: 18, miss: 7 },
  ];
}
