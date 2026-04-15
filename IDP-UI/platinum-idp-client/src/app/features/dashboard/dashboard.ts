import { Component, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CycleStateService } from '../../core/services/cycle-state.service';
import { DashboardData, PriorityFramework, ProjectRanking } from '../../core/models/idp.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DecimalPipe, DatePipe],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="page" *ngIf="data() as d">
      <div class="page-header">
        <div>
          <h1 data-testid="text-page-title">IDP Dashboard</h1>
          <p class="page-subtitle">{{ d.cycle.municipalityName }} &middot; {{ d.cycle.startYear }}/{{ d.cycle.startYear + 1 }} &ndash; {{ d.cycle.endYear - 1 }}/{{ d.cycle.endYear }}</p>
        </div>
        <div class="header-actions">
          <span class="status-pill" [attr.data-status]="statusKey(d.cycle.status)" data-testid="text-idp-status">{{ d.cycle.status }}</span>
          <span class="lock-indicator" *ngIf="d.cycle.isLocked"><span class="material-icon" style="font-size:16px;color:#ef5350;">lock</span> Locked</span>
        </div>
      </div>

      <div class="kpi-row" data-testid="kpi-row">
        <div class="kpi-card" data-testid="kpi-projects">
          <div class="kpi-icon-wrap icon-blue"><span class="material-icon">folder_open</span></div>
          <div class="kpi-content">
            <div class="kpi-label">Total Projects</div>
            <div class="kpi-value">{{ d.totalProjects }}</div>
            <div class="kpi-sub">{{ d.capitalProjects }} Capital &middot; {{ d.operationalProjects }} Operational</div>
          </div>
        </div>
        <div class="kpi-card" data-testid="kpi-objectives">
          <div class="kpi-icon-wrap icon-green"><span class="material-icon">flag</span></div>
          <div class="kpi-content">
            <div class="kpi-label">Strategic Objectives</div>
            <div class="kpi-value">{{ d.totalObjectives }}</div>
            <div class="kpi-sub">NDP Aligned</div>
          </div>
        </div>
        <div class="kpi-card" data-testid="kpi-milestones">
          <div class="kpi-icon-wrap icon-amber"><span class="material-icon">task_alt</span></div>
          <div class="kpi-content">
            <div class="kpi-label">Milestones</div>
            <div class="kpi-value">{{ d.completedMilestones }}/{{ d.totalMilestones }}</div>
            <div class="kpi-sub" [class.text-danger]="d.overdueMilestones > 0">{{ d.overdueMilestones }} Overdue</div>
          </div>
        </div>
        <div class="kpi-card" data-testid="kpi-comments">
          <div class="kpi-icon-wrap icon-purple"><span class="material-icon">forum</span></div>
          <div class="kpi-content">
            <div class="kpi-label">Public Comments</div>
            <div class="kpi-value">{{ d.totalComments }}</div>
            <div class="kpi-sub">{{ d.respondedComments }} Responded &middot; {{ d.pendingComments }} Pending</div>
          </div>
        </div>
        <div class="kpi-card" data-testid="kpi-budget">
          <div class="kpi-icon-wrap icon-teal"><span class="material-icon">payments</span></div>
          <div class="kpi-content">
            <div class="kpi-label">Total Budget</div>
            <div class="kpi-value">R{{ (d.totalBudget / 1000000) | number:'1.1-1' }}M</div>
            <div class="kpi-sub">Across all projects</div>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card" data-testid="card-process-plan">
          <div class="card-header">
            <h2><span class="material-icon card-icon">timeline</span> Process Plan Progress</h2>
          </div>
          <div class="card-body">
            <div class="phase-list">
              <div class="phase-row" *ngFor="let p of d.phases" [class.completed]="p.progress===100" [class.active]="p.progress > 0 && p.progress < 100" [attr.data-testid]="'phase-' + p.orderIndex + ''">
                <div class="phase-dot">
                  <span class="material-icon" *ngIf="p.progress===100" style="font-size:14px;">check</span>
                  <span *ngIf="p.progress<100">{{ p.orderIndex }}</span>
                </div>
                <div class="phase-detail">
                  <div class="phase-top"><span class="phase-name">{{ p.name }}</span><span class="phase-pct">{{ p.progress }}%</span></div>
                  <div class="progress-track"><div class="progress-fill" [style.width.%]="p.progress"></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card" data-testid="card-participation">
          <div class="card-header">
            <h2><span class="material-icon card-icon" style="color:#7e57c2;">forum</span> Public Participation</h2>
          </div>
          <div class="card-body">
            <div class="stat-rows">
              <div class="stat-row"><span>Received</span><span class="stat-val">{{ d.totalComments - d.respondedComments - d.closedComments }}</span></div>
              <div class="stat-row"><span>Responded</span><span class="stat-val text-success">{{ d.respondedComments }}</span></div>
              <div class="stat-row"><span>Closed</span><span class="stat-val">{{ d.closedComments }}</span></div>
              <div class="stat-row"><span>Escalated</span><span class="stat-val text-danger">{{ d.escalatedComments }}</span></div>
            </div>
            <div class="rate-section">
              <div class="rate-label">Response Rate</div>
              <div class="progress-track lg"><div class="progress-fill green" [style.width.%]="d.totalComments ? (d.respondedComments / d.totalComments * 100) : 0"></div></div>
              <div class="rate-value">{{ d.totalComments ? (d.respondedComments / d.totalComments * 100 | number:'1.0-0') : 0 }}%</div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card" data-testid="card-quick-actions">
          <div class="card-header"><h2><span class="material-icon card-icon" style="color:#26a69a;">bolt</span> Quick Actions</h2></div>
          <div class="card-body">
            <a routerLink="/draft-idp" class="action-row" data-testid="link-draft-idp">
              <span class="material-icon" style="color:#3b82f6;">description</span>
              <div><strong>Generate Draft IDP</strong><small>Compile structured IDP document</small></div>
              <span class="material-icon arrow">chevron_right</span>
            </a>
            <a routerLink="/approvals" class="action-row" data-testid="link-approvals">
              <span class="material-icon" style="color:#f59e0b;">approval</span>
              <div><strong>Review Approvals</strong><small>Sequential approval workflow</small></div>
              <span class="material-icon arrow">chevron_right</span>
            </a>
            <a routerLink="/gomuni" class="action-row" data-testid="link-gomuni">
              <span class="material-icon" style="color:#10b981;">cloud_upload</span>
              <div><strong>GoMuni Submission</strong><small>Upload adopted IDP pack</small></div>
              <span class="material-icon arrow">chevron_right</span>
            </a>
            <a routerLink="/prioritisation" class="action-row" data-testid="link-prioritisation">
              <span class="material-icon" style="color:#7e57c2;">format_list_numbered</span>
              <div><strong>Score Projects</strong><small>Prioritise using weighted criteria</small></div>
              <span class="material-icon arrow">chevron_right</span>
            </a>
          </div>
        </div>

        <div class="card" data-testid="card-framework" *ngIf="activeFramework()">
          <div class="card-header"><h2><span class="material-icon card-icon" style="color:#7e57c2;">tune</span> Prioritisation Framework</h2></div>
          <div class="card-body">
            <div class="stat-rows">
              <div class="stat-row"><span>Framework</span><span class="stat-val">{{ activeFramework()!.name }}</span></div>
              <div class="stat-row"><span>Version</span><span class="stat-val">v{{ activeFramework()!.version }}</span></div>
              <div class="stat-row"><span>Status</span><span class="stat-val"><span class="status-pill" data-status="active">{{ activeFramework()!.status }}</span></span></div>
              <div class="stat-row"><span>Criteria</span><span class="stat-val">{{ activeFramework()!.criteria?.length || 0 }} active</span></div>
              <div class="stat-row"><span>AI Mode</span><span class="stat-val">{{ activeFramework()!.aiMode }}</span></div>
              <div class="stat-row"><span>Scale</span><span class="stat-val">{{ activeFramework()!.scaleMin }}–{{ activeFramework()!.scaleMax }}</span></div>
            </div>
            <div class="top-ranked" *ngIf="topRanked().length > 0">
              <div class="rate-label" style="margin-top:12px;">Top Ranked Projects</div>
              <div class="rank-item" *ngFor="let r of topRanked(); let i = index" [attr.data-testid]="'top-ranked-' + i">
                <span class="rank-num">#{{ r.rank }}</span>
                <span class="rank-name">{{ r.projectName }}</span>
                <span class="rank-score">{{ r.compositeScore | number:'1.2-2' }}</span>
              </div>
            </div>
            <a routerLink="/priority-config" class="action-row" style="margin-top:12px;" data-testid="link-priority-config">
              <span class="material-icon" style="color:#7e57c2;">settings</span>
              <div><strong>Configure Framework</strong><small>Manage criteria & weights</small></div>
              <span class="material-icon arrow">chevron_right</span>
            </a>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card" data-testid="card-audit">
          <div class="card-header"><h2><span class="material-icon card-icon" style="color:#f59e0b;">history</span> Recent Activity</h2></div>
          <div class="card-body">
            <div class="audit-list">
              <div class="audit-item" *ngFor="let log of d.recentAuditLogs" [attr.data-testid]="'audit-' + log.id + ''">
                <div class="audit-dot"></div>
                <div class="audit-body">
                  <span class="audit-action">{{ log.action }}</span>
                  <span class="audit-detail">{{ log.newValue || log.oldValue }}</span>
                  <span class="audit-time">{{ log.performedDate | date:'dd MMM yyyy HH:mm' }} &middot; {{ log.performedBy }}</span>
                </div>
              </div>
              <div class="empty" *ngIf="!d.recentAuditLogs?.length">No recent activity</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="loading" *ngIf="loading()">
      <span class="material-icon spin">refresh</span> Loading dashboard...
    </div>
  `,
  styles: [`
    .header-actions { display: flex; align-items: center; gap: 10px; }
    .lock-indicator { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #ef5350; font-weight: 600; }
    app-dashboard .kpi-row { display: grid; grid-template-columns: repeat(5,1fr); gap: 16px; margin-bottom: 24px; }
    @media(max-width:1100px){ app-dashboard .kpi-row { grid-template-columns: repeat(3,1fr); } }
    @media(max-width:700px){ app-dashboard .kpi-row { grid-template-columns: repeat(2,1fr); } }
    .kpi-card { background: white; border: 1px solid var(--platinum-border); border-radius: var(--platinum-card-radius); padding: 18px; display: flex; gap: 14px; transition: transform .15s, box-shadow .15s; box-shadow: var(--platinum-card-shadow); }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: var(--platinum-card-shadow-hover); }
    .kpi-icon-wrap { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kpi-icon-wrap .material-icon { font-size: 22px; }
    .icon-blue { background: var(--platinum-info-light); color: var(--platinum-info); }
    .icon-green { background: var(--platinum-success-light); color: var(--platinum-success); }
    .icon-amber { background: var(--platinum-warning-light); color: var(--platinum-warning); }
    .icon-purple { background: var(--platinum-purple-light); color: var(--platinum-purple); }
    .icon-teal { background: var(--platinum-teal-light); color: var(--platinum-teal); }
    .kpi-label { font-size: 12px; color: var(--platinum-text-secondary); font-weight: 500; }
    .kpi-value { font-size: 22px; font-weight: 700; color: var(--platinum-text); margin: 2px 0; }
    .kpi-sub { font-size: 11px; color: var(--platinum-text-muted); }
    .phase-list { display: flex; flex-direction: column; gap: 10px; }
    .phase-row { display: flex; align-items: center; gap: 12px; }
    .phase-dot { width: 26px; height: 26px; border-radius: 50%; background: #e2e8f0; color: #94a3b8; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .phase-row.completed .phase-dot { background: #10b981; color: white; }
    .phase-row.active .phase-dot { background: #3b82f6; color: white; box-shadow: 0 0 0 3px rgba(59,130,246,.2); }
    .phase-detail { flex: 1; }
    .phase-top { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .phase-name { font-size: 13px; font-weight: 500; }
    .phase-pct { font-size: 12px; font-weight: 600; color: var(--platinum-text-secondary); }
    .stat-rows { margin-bottom: 16px; }
    .stat-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid var(--platinum-border-light); font-size: 13px; color: var(--platinum-text-secondary); }
    .stat-val { font-weight: 600; color: var(--platinum-text); }
    .rate-section { margin-top: 12px; }
    .rate-label { font-size: 11px; color: var(--platinum-text-muted); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
    .rate-value { font-size: 14px; font-weight: 700; margin-top: 4px; }
    .action-row { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 10px; border: 1px solid var(--platinum-border); margin-bottom: 8px; cursor: pointer; transition: all .15s; text-decoration: none; color: inherit; }
    .action-row:hover { background: var(--platinum-surface-warm); border-color: #3b82f6; }
    .action-row div { flex: 1; }
    .action-row strong { font-size: 13px; display: block; }
    .action-row small { font-size: 11px; color: var(--platinum-text-muted); display: block; }
    .arrow { color: #cbd5e1; font-size: 20px; }
    .audit-list { max-height: 240px; overflow-y: auto; }
    .audit-item { display: flex; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--platinum-surface); }
    .audit-dot { width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; margin-top: 6px; flex-shrink: 0; }
    .audit-action { font-size: 12px; font-weight: 600; display: block; }
    .audit-detail { font-size: 11px; color: var(--platinum-text-secondary); display: block; }
    .audit-time { font-size: 10px; color: var(--platinum-text-muted); display: block; }
    .rank-item { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px solid var(--platinum-border-light); font-size: 13px; }
    .rank-num { font-weight: 700; color: var(--platinum-primary); width: 28px; }
    .rank-name { flex: 1; color: var(--platinum-text); }
    .rank-score { font-weight: 600; color: var(--platinum-accent); }
  `]
})
export class DashboardComponent implements OnInit {
  data = signal<DashboardData | null>(null);
  loading = signal(true);
  activeFramework = signal<PriorityFramework | null>(null);
  topRanked = signal<ProjectRanking[]>([]);

  constructor(private api: ApiService, private cycleState: CycleStateService) {}

  ngOnInit() {
    this.cycleState.ensureActiveCycle().then(cycle => {
      if (cycle) {
        this.api.getDashboard(cycle.id).subscribe({
          next: d => { this.data.set(d); this.loading.set(false); },
          error: () => this.loading.set(false)
        });

        this.api.getFrameworks().subscribe({
          next: frameworks => {
            const active = frameworks.find(f => f.status === 'Active');
            if (active) {
              this.activeFramework.set(active);
              this.api.getRankings(active.id).subscribe({
                next: rankings => this.topRanked.set(rankings.slice(0, 5)),
                error: () => {}
              });
            }
          },
          error: () => {}
        });
      } else {
        this.loading.set(false);
      }
    });
  }

  statusKey(s: string): string { return s.toLowerCase().replace(/\s+/g, '-'); }
}
