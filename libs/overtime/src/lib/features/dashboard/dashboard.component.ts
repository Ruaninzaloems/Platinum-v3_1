import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardSummaryDto, PayrollCyclesResponseDto } from '../../core/models/dashboard.model';
import { UserContextService } from '../../core/services/user-context.service';

interface NotificationCard {
  icon: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  count: number;
  singularLabel: string;
  pluralLabel: string;
  actionLabel: string;
  route: string;
  urgent: boolean;
}

const POLL_INTERVAL_MS = 60_000;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="dashboard-root">
      <div class="dashboard-header">
        <div class="header-top">
          <div>
            <h1 class="dashboard-title">Welcome back, {{ firstName() }}</h1>
            <p class="dashboard-subtitle">Here's what needs your attention in the Overtime module.</p>
          </div>
          @if (!loading() && !error()) {
            <div class="freshness">
              @if (refreshing()) {
                <span class="freshness-spinner" title="Refreshing…">
                  <mat-icon class="spin-icon">sync</mat-icon>
                </span>
              } @else if (lastUpdated()) {
                <span class="freshness-time" title="Counts update automatically every 60 seconds">
                  Updated {{ lastUpdatedLabel() }}
                </span>
              }
            </div>
          }
        </div>
      </div>

      <!-- Stats at a glance -->
      <div class="stats-row">
        <div class="stat-tile stat-indigo">
          <mat-icon class="stat-icon">receipt_long</mat-icon>
          <div class="stat-body">
            <span class="stat-value">{{ summary()?.totalTransactionsThisTaxYear ?? '—' }}</span>
            <span class="stat-label">Transactions this tax year</span>
          </div>
        </div>
        <div class="stat-tile stat-teal">
          <mat-icon class="stat-icon">schedule</mat-icon>
          <div class="stat-body">
            <span class="stat-value">{{ formatHours(summary()?.totalHoursThisTaxYear) }}</span>
            <span class="stat-label">Hours this tax year</span>
          </div>
        </div>
        <div class="stat-tile stat-green">
          <mat-icon class="stat-icon">task_alt</mat-icon>
          <div class="stat-body">
            <span class="stat-value">{{ summary()?.totalProcessedThisTaxYear ?? '—' }}</span>
            <span class="stat-label">Processed this tax year</span>
          </div>
        </div>
        <div class="stat-tile stat-amber">
          <mat-icon class="stat-icon">pending_actions</mat-icon>
          <div class="stat-body">
            <span class="stat-value">{{ summary()?.totalInProgress ?? '—' }}</span>
            <span class="stat-label">In progress</span>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="cards-grid">
          @for (s of skeletons; track s) {
            <div class="card skeleton-card">
              <div class="sk-icon"></div>
              <div class="sk-lines">
                <div class="sk-line sk-line-short"></div>
                <div class="sk-line sk-line-long"></div>
              </div>
            </div>
          }
        </div>
      } @else if (error()) {
        <div class="state-box state-error">
          <mat-icon>error_outline</mat-icon>
          <p>Could not load your dashboard. Please refresh the page.</p>
        </div>
      } @else if (noPermissions()) {
        <div class="state-box state-locked">
          <mat-icon>lock_outline</mat-icon>
          <h2>No module access</h2>
          <p>You do not have access to any overtime functions. Please contact your system administrator.</p>
        </div>
      } @else if (activeCards().length === 0) {
        <div class="state-box state-clear">
          <mat-icon>check_circle_outline</mat-icon>
          <h2>You're all caught up!</h2>
          <p>No overtime transactions need your attention right now.</p>
        </div>
      } @else {
        <div class="cards-grid">
          @for (card of activeCards(); track card.singularLabel) {
            <a class="card action-card"
               [class.card-urgent]="card.urgent"
               [routerLink]="card.route"
               [style.--border-color]="card.borderColor"
               [style.--bg-color]="card.bgColor">
              <div class="card-icon-wrap" [style.background]="card.bgColor">
                <mat-icon [style.color]="card.iconColor">{{ card.icon }}</mat-icon>
              </div>
              <div class="card-body">
                <span class="card-count">{{ card.count }}</span>
                <span class="card-label">
                  {{ card.count === 1 ? card.singularLabel : card.pluralLabel }}
                </span>
                <span class="card-action">{{ card.actionLabel }} →</span>
              </div>
            </a>
          }
        </div>
      }

      <!-- Current Payroll Cycles -->
      @if (!loading() && !error() && cycles()) {
        <div class="cycles-card">
          <div class="cycles-header">
            <h2 class="cycles-title">Current Payroll Cycles</h2>
            @if (cycles()!.taxYear) {
              <span class="cycles-taxyear">System Tax Year : {{ cycles()!.taxYear }}</span>
            }
          </div>

          @if (cycles()!.cycles.length === 0) {
            <p class="cycles-empty">All payroll cycles are processed for this tax year.</p>
          } @else {
            <div class="cycles-table-wrap">
              <table class="cycles-table">
                <thead>
                  <tr>
                    <th>PAYROLL CYCLE</th>
                    <th>CYCLE TYPE</th>
                    <th>PERIOD</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of cycles()!.cycles; track row.payroll + row.cycleType) {
                    <tr>
                      <td>{{ row.payroll }}</td>
                      <td>{{ row.cycleType }}</td>
                      <td>{{ row.period }}</td>
                      <td>
                        <span class="status-badge" [class]="statusClass(row.status)">
                          {{ row.status.toUpperCase() }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-root {
      padding: 32px;
    }

    /* Stats at a glance */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-tile {
      display: flex;
      align-items: center;
      gap: 14px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
    }
    .stat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      flex-shrink: 0;
    }
    .stat-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      line-height: 1;
      color: #1e293b;
    }
    .stat-label {
      font-size: 11px;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .stat-indigo .stat-icon { color: #6366f1; }
    .stat-teal   .stat-icon { color: #0d9488; }
    .stat-green  .stat-icon { color: #16a34a; }
    .stat-amber  .stat-icon { color: #d97706; }

    .dashboard-header {
      margin-bottom: 32px;
    }
    .header-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }
    .dashboard-title {
      font-size: 22px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 6px;
    }
    .dashboard-subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }

    /* Freshness indicator */
    .freshness {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      padding-top: 4px;
    }
    .freshness-time {
      font-size: 11px;
      color: #94a3b8;
      white-space: nowrap;
    }
    .freshness-spinner {
      display: flex;
      align-items: center;
      color: #94a3b8;
    }
    .spin-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    /* Cards grid */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
    }

    .card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-left: 4px solid var(--border-color, #e2e8f0);
      border-radius: 10px;
      padding: 20px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      text-decoration: none;
      color: inherit;
      transition: box-shadow 0.15s, transform 0.15s;
    }
    .action-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      transform: translateY(-2px);
      cursor: pointer;
    }
    .card-urgent {
      background: #fffbeb;
    }

    .card-icon-wrap {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card-icon-wrap mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .card-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .card-count {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      line-height: 1;
    }
    .card-label {
      font-size: 13px;
      font-weight: 500;
      color: #475569;
      line-height: 1.3;
    }
    .card-action {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 6px;
    }
    .action-card:hover .card-action {
      color: #3b82f6;
    }

    /* Skeleton */
    .skeleton-card {
      pointer-events: none;
      animation: pulse 1.4s ease-in-out infinite;
    }
    .sk-icon {
      flex-shrink: 0;
      width: 44px; height: 44px;
      border-radius: 10px;
      background: #e2e8f0;
    }
    .sk-lines {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 6px;
    }
    .sk-line {
      height: 12px;
      border-radius: 6px;
      background: #e2e8f0;
    }
    .sk-line-short { width: 40%; }
    .sk-line-long  { width: 75%; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.5; }
    }

    /* State boxes */
    .state-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 64px 32px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      text-align: center;
      max-width: 440px;
    }
    .state-box mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }
    .state-box h2 {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
    .state-box p {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }
    .state-clear mat-icon { color: #22c55e; }
    .state-locked mat-icon { color: #94a3b8; }
    .state-error mat-icon  { color: #ef4444; }

    /* Payroll Cycles card */
    .cycles-card {
      margin-top: 32px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px 28px;
    }
    .cycles-header {
      margin-bottom: 16px;
    }
    .cycles-title {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 4px;
    }
    .cycles-taxyear {
      font-size: 13px;
      color: #3b82f6;
      font-weight: 500;
    }
    .cycles-empty {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }
    .cycles-table-wrap {
      overflow-x: auto;
    }
    .cycles-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .cycles-table th {
      text-align: left;
      font-size: 10px;
      font-weight: 600;
      color: #94a3b8;
      letter-spacing: 0.06em;
      padding: 0 12px 8px 0;
      border-bottom: 1px solid #f1f5f9;
      white-space: nowrap;
    }
    .cycles-table td {
      padding: 7px 12px 7px 0;
      color: #334155;
      border-bottom: 1px solid #f8fafc;
    }
    .cycles-table tbody tr:last-child td {
      border-bottom: none;
    }
    .cycles-table tbody tr:hover td {
      background: #f8fafc;
    }

    /* Status badges */
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
    }
    .badge-open       { background: #dcfce7; color: #16a34a; }
    .badge-approved   { background: #dbeafe; color: #1d4ed8; }
    .badge-lockeddown { background: #fff7ed; color: #c2410c; }
    .badge-processed  { background: #f1f5f9; color: #64748b; }

    @media (max-width: 900px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .dashboard-root { padding: 20px 16px; }
      .header-top { flex-direction: column; }
      .cycles-card { padding: 16px; }
      .stats-row { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private dashboardSvc = inject(DashboardService);
  private userCtx      = inject(UserContextService);

  readonly loading    = signal(true);
  readonly error      = signal(false);
  readonly refreshing = signal(false);
  readonly summary    = signal<DashboardSummaryDto | null>(null);
  readonly cycles     = signal<PayrollCyclesResponseDto | null>(null);
  readonly lastUpdated = signal<Date | null>(null);

  readonly skeletons = [1, 2, 3];

  readonly firstName = computed(() => {
    const name = this.userCtx.displayName();
    if (!name || name === 'Loading...') return '';
    return name.split(/\s+/)[0];
  });

  readonly noPermissions = computed(() => {
    const me = this.userCtx.me();
    if (!me) return false;
    return !me.canAccessConfig && !me.canAccessCapture && !me.canAccessPayroll && !me.canAccessEnquiry;
  });

  readonly lastUpdatedLabel = computed(() => {
    const d = this.lastUpdated();
    if (!d) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  readonly activeCards = computed<NotificationCard[]>(() => {
    const s = this.summary();
    const me = this.userCtx.me();
    if (!s || !me) return [];

    const all: NotificationCard[] = [
      {
        icon: 'thumb_up',
        iconColor: '#3b82f6',
        bgColor: '#eff6ff',
        borderColor: '#3b82f6',
        count: s.awaitingMyRecommendation,
        singularLabel: 'transaction awaiting your recommendation',
        pluralLabel: 'transactions awaiting your recommendation',
        actionLabel: 'Go to Capture',
        route: '/overtime/capture',
        urgent: false
      },
      {
        icon: 'verified',
        iconColor: '#8b5cf6',
        bgColor: '#f5f3ff',
        borderColor: '#8b5cf6',
        count: s.awaitingMyApproval,
        singularLabel: 'transaction awaiting your approval',
        pluralLabel: 'transactions awaiting your approval',
        actionLabel: 'Go to Capture',
        route: '/overtime/capture',
        urgent: false
      },
      {
        icon: 'payments',
        iconColor: '#10b981',
        bgColor: '#ecfdf5',
        borderColor: '#10b981',
        count: s.awaitingPayrollCapture,
        singularLabel: 'transaction ready for payroll capture',
        pluralLabel: 'transactions ready for payroll capture',
        actionLabel: 'Go to Payroll Processing',
        route: '/overtime/payroll-processing',
        urgent: false
      },
      {
        icon: 'fact_check',
        iconColor: '#0ea5e9',
        bgColor: '#f0f9ff',
        borderColor: '#0ea5e9',
        count: s.awaitingPayrollApproval,
        singularLabel: 'transaction awaiting payroll approval',
        pluralLabel: 'transactions awaiting payroll approval',
        actionLabel: 'Go to Payroll Processing',
        route: '/overtime/payroll-processing',
        urgent: false
      },
      ...(me.canAccessCapture ? [{
        icon: 'hourglass_top',
        iconColor: '#64748b',
        bgColor: '#f8fafc',
        borderColor: '#cbd5e1',
        count: s.capturedByMeInProgress,
        singularLabel: 'transaction you submitted is in progress',
        pluralLabel: 'transactions you submitted are in progress',
        actionLabel: 'View in Capture',
        route: '/overtime/capture',
        urgent: false
      } as NotificationCard] : []),
      ...(me.canAccessCapture ? [{
        icon: 'undo',
        iconColor: '#ef4444',
        bgColor: '#fef2f2',
        borderColor: '#ef4444',
        count: s.returnedToMe,
        singularLabel: 'transaction has been returned for correction',
        pluralLabel: 'transactions have been returned for correction',
        actionLabel: 'Fix now',
        route: '/overtime/capture',
        urgent: true
      } as NotificationCard] : [])
    ];

    return all.filter(c => c.count > 0);
  });

  formatHours(h: number | null | undefined): string {
    if (h == null) return '—';
    return Number.isInteger(h) ? h.toString() : h.toFixed(1);
  }

  statusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'open':       return 'status-badge badge-open';
      case 'approved':   return 'status-badge badge-approved';
      case 'lockeddown': return 'status-badge badge-lockeddown';
      case 'processed':  return 'status-badge badge-processed';
      default:           return 'status-badge badge-open';
    }
  }

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private readonly onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      this.fetchAll(true);
      this.startPolling();
    } else {
      this.stopPolling();
    }
  };

  ngOnInit(): void {
    this.fetchAll(false);
    this.startPolling();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  ngOnDestroy(): void {
    this.stopPolling();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private fetchAll(background: boolean): void {
    if (background) this.refreshing.set(true);

    this.dashboardSvc.getSummary().subscribe({
      next: s => {
        this.summary.set(s);
        this.lastUpdated.set(new Date());
        if (!background) this.loading.set(false);
        this.refreshing.set(false);
      },
      error: () => {
        if (!background) {
          this.error.set(true);
          this.loading.set(false);
        }
        this.refreshing.set(false);
      }
    });

    this.dashboardSvc.getPayrollCycles().subscribe({
      next: c => this.cycles.set(c),
      error: () => { /* cycles panel stays hidden on error — non-critical */ }
    });
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.fetchAll(true);
      }
    }, POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
