import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DashboardNavStore } from './dashboard-nav.store';
import { CycleStore, PERIOD_OPTIONS, PeriodStore } from './tabs/cycle-picker';

import { OverviewTabComponent } from './tabs/overview-tab.component';
import { TrendTabComponent } from './tabs/trend-tab.component';
import { TablesTabComponent } from './tabs/tables-tab.component';
import { OrgStatusTabComponent } from './tabs/org-status-tab.component';
import { DepartmentTabComponent } from './tabs/department-tab.component';
import { MilestonesTabComponent } from './tabs/milestones-tab.component';
import { AiTabComponent } from './tabs/ai-tab.component';

type DashboardTab = 'overview' | 'trend' | 'tables' | 'org-status' | 'dept-status' | 'milestones' | 'insights';

const TAB_VALUES: readonly DashboardTab[] = ['overview', 'trend', 'tables', 'org-status', 'dept-status', 'milestones', 'insights'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    OverviewTabComponent, TrendTabComponent, TablesTabComponent,
    OrgStatusTabComponent, DepartmentTabComponent, MilestonesTabComponent, AiTabComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <div class="crumb">Home</div>
      <div class="head">
        <div>
          <h1 class="page__title">Dashboard</h1>
          <p class="page__sub">Organisational performance at a glance</p>
        </div>
        <div class="head__controls">
          <label class="period">
            <span class="period__label">Period</span>
            <select class="period__select" [ngModel]="periods.period()" (ngModelChange)="periods.setPeriod($event)">
              <option *ngFor="let p of periodOptions" [ngValue]="p.value">{{ p.label }}</option>
            </select>
          </label>
          <label class="period">
            <span class="period__label">Fin Year</span>
            <select class="period__select" [ngModel]="cycles.cycleId()" (ngModelChange)="cycles.setCycle($event)">
              <option *ngFor="let c of cycles.cycles()" [ngValue]="c.id">{{ c.financialYearLabel }}</option>
            </select>
          </label>
        </div>
      </div>

      <div class="tabs">
        <button class="tabs__tab" [class.is-active]="activeTab() === 'overview'"
                (click)="activeTab.set('overview')">
          <span class="material-symbols-rounded">bar_chart</span> Overview
        </button>
        <button class="tabs__tab" [class.is-active]="activeTab() === 'trend'"
                (click)="activeTab.set('trend')">
          <span class="material-symbols-rounded">trending_up</span> Performance Trend
        </button>
        <button class="tabs__tab" [class.is-active]="activeTab() === 'tables'"
                (click)="activeTab.set('tables')">
          <span class="material-symbols-rounded">table_chart</span> Performance Tables
        </button>
        <button class="tabs__tab" [class.is-active]="activeTab() === 'org-status'"
                (click)="activeTab.set('org-status')">
          <span class="material-symbols-rounded">assignment</span> Indicator Status (Organisational)
        </button>
        <button class="tabs__tab" [class.is-active]="activeTab() === 'dept-status'"
                (click)="activeTab.set('dept-status')">
          <span class="material-symbols-rounded">assignment_ind</span> Indicator Status (Departmental)
        </button>
        <button class="tabs__tab" [class.is-active]="activeTab() === 'milestones'"
                (click)="activeTab.set('milestones')">
          <span class="material-symbols-rounded">flag</span> Milestones
        </button>
        <button class="tabs__tab" [class.is-active]="activeTab() === 'insights'"
                (click)="activeTab.set('insights')">
          <span class="material-symbols-rounded">monitoring</span> Insights
        </button>
      </div>

      <app-overview-tab *ngIf="activeTab() === 'overview'"></app-overview-tab>
      <app-trend-tab *ngIf="activeTab() === 'trend'"></app-trend-tab>
      <app-tables-tab *ngIf="activeTab() === 'tables'"></app-tables-tab>
      <app-org-status-tab *ngIf="activeTab() === 'org-status'"></app-org-status-tab>
      <app-department-tab *ngIf="activeTab() === 'dept-status'"></app-department-tab>
      <app-milestones-tab *ngIf="activeTab() === 'milestones'"></app-milestones-tab>
      <app-ai-tab *ngIf="activeTab() === 'insights'"></app-ai-tab>
    </section>
  `,
  styles: [`
    .page { max-width: 1280px; }
    .crumb { font-size: 13px; color: var(--plat-muted); }
    .page__title { font-size: 28px; font-weight: 700; margin: 4px 0 4px; }
    .page__sub { color: var(--plat-muted); margin: 0 0 18px; }
    .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .head__controls { display: inline-flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .period { display: inline-flex; align-items: center; gap: 8px; margin-top: 6px; }
    .period__label { font-size: 12px; font-weight: 600; color: var(--plat-muted); text-transform: uppercase; letter-spacing: .04em; }
    .period__select {
      padding: 8px 12px; border: 1px solid var(--plat-border); border-radius: 8px;
      background: #fff; font-size: 13px; font-weight: 600; color: #1e293b; cursor: pointer;
    }

    .tabs { display: flex; gap: 20px; border-bottom: 1px solid var(--plat-border); margin-bottom: 18px; overflow-x: auto; }
    .tabs__tab {
      display: inline-flex; align-items: center; gap: 6px;
      background: transparent; border: 0; padding: 10px 2px;
      color: var(--plat-muted); font-weight: 500; cursor: pointer;
      border-bottom: 2px solid transparent;
      white-space: nowrap;
    }
    .tabs__tab.is-active { color: var(--plat-blue); border-bottom-color: var(--plat-blue); }
    .tabs__tab .material-symbols-rounded { font-size: 18px; }
  `],
})
export class DashboardComponent {
  private readonly nav = inject(DashboardNavStore);
  private readonly route = inject(ActivatedRoute);
  readonly periods = inject(PeriodStore);
  readonly cycles = inject(CycleStore);
  readonly periodOptions = PERIOD_OPTIONS;
  readonly activeTab = signal<DashboardTab>('overview');

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const tab = params.get('tab');
      if (tab && (TAB_VALUES as readonly string[]).includes(tab)) {
        this.activeTab.set(tab as DashboardTab);
      }
    });
    effect(() => {
      const tab = this.nav.requestedTab();
      if (tab) {
        this.activeTab.set(tab as DashboardTab);
        this.nav.consumeTabRequest();
      }
    });
  }
}
