import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../services/api.service';
import { CfoDashboard } from '../../models/budget.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  template: `
    <div class="dashboard-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">CFO Dashboard</h1>
          <p class="page-subtitle">Municipal Budget Management Overview</p>
        </div>
        <button class="btn-refresh" (click)="refreshAll()">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </div>

      <div class="kpi-row">
        <div class="kpi-card" *ngFor="let kpi of kpiCards">
          <div class="kpi-icon-wrap" [ngClass]="kpi.colorClass">
            <mat-icon>{{kpi.icon}}</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">{{kpi.label}}</div>
            <div class="kpi-value" [ngClass]="{'kpi-negative': kpi.isNegative}">{{kpi.value}}</div>
            <div class="kpi-count">{{kpi.subtitle}}</div>
          </div>
        </div>
      </div>

      <div class="grid-two-col">
        <div class="card-container">
          <div class="card-title-bar">
            <h2><mat-icon>layers</mat-icon> Budget Version Status</h2>
          </div>
          <div class="card-body">
            <div class="version-grid" *ngIf="dashboard?.versionStatuses?.length; else noVersions">
              <div class="version-card" *ngFor="let v of dashboard!.versionStatuses">
                <div class="version-card-header">
                  <span class="version-name">{{ v.name }}</span>
                  <span class="status-badge"
                    [ngClass]="{
                      'status-draft': v.status === 'Draft',
                      'status-pending': v.status === 'PendingApproval',
                      'status-approved': v.status === 'Approved',
                      'status-locked': v.status === 'Locked'
                    }">{{ v.status }}</span>
                </div>
                <div class="version-card-meta">
                  <span class="type-badge"
                    [ngClass]="{
                      'type-tabb': v.type === 'TABB',
                      'type-orgb': v.type === 'ORGB',
                      'type-adjb': v.type === 'ADJB'
                    }">{{ v.type }}</span>
                  <span class="version-strings">{{ v.stringCount }} strings</span>
                </div>
                <div class="version-card-date">{{ v.createdOn | date:'mediumDate' }}</div>
              </div>
            </div>
            <ng-template #noVersions>
              <div class="empty-state">
                <mat-icon>info_outline</mat-icon>
                <p>No budget versions available</p>
              </div>
            </ng-template>
          </div>
        </div>

        <div class="card-container">
          <div class="card-title-bar">
            <h2><mat-icon>bar_chart</mat-icon> Budget by Function</h2>
          </div>
          <div class="card-body">
            <div class="function-list" *ngIf="dashboard?.byFunction?.length; else noFunctions">
              <div class="function-row" *ngFor="let f of dashboard!.byFunction">
                <div class="function-label">{{ f.function }}</div>
                <div class="function-bar-container">
                  <div class="function-bar" [style.width.%]="getFunctionPercent(f.year1)"></div>
                </div>
                <div class="function-amount">{{ formatCurrency(f.year1) }}</div>
              </div>
            </div>
            <ng-template #noFunctions>
              <div class="empty-state">
                <mat-icon>info_outline</mat-icon>
                <p>No function data available</p>
              </div>
            </ng-template>
          </div>
        </div>
      </div>

      <div class="grid-two-col">
        <div class="card-container">
          <div class="card-title-bar">
            <h2><mat-icon>account_balance</mat-icon> Department Breakdown</h2>
          </div>
          <div class="card-body">
            <div *ngIf="dashboard?.byDepartment?.length; else noDepts">
              <div class="dept-row" *ngFor="let d of dashboard!.byDepartment">
                <div class="dept-name">{{d.department}}</div>
                <div class="dept-values">
                  <div class="dept-metric">
                    <span class="dept-label">Revenue</span>
                    <span class="dept-amount revenue-color">{{formatCurrency(d.revenue)}}</span>
                  </div>
                  <div class="dept-metric">
                    <span class="dept-label">Expenditure</span>
                    <span class="dept-amount expense-color">{{formatCurrency(d.expenditure)}}</span>
                  </div>
                  <div class="dept-metric">
                    <span class="dept-label">Capital</span>
                    <span class="dept-amount capital-color">{{formatCurrency(d.capital)}}</span>
                  </div>
                </div>
              </div>
            </div>
            <ng-template #noDepts>
              <div class="empty-state">
                <mat-icon>info_outline</mat-icon>
                <p>No department data available</p>
              </div>
            </ng-template>
          </div>
        </div>

        <div class="card-container">
          <div class="card-title-bar">
            <h2><mat-icon>show_chart</mat-icon> Monthly Trend — Budget vs Actual</h2>
          </div>
          <div class="card-body">
            <div class="trend-chart" *ngIf="dashboard?.monthlyTrend?.length; else noTrend">
              <div class="trend-legend">
                <span class="legend-item"><span class="legend-dot budget-dot"></span> Budget</span>
                <span class="legend-item"><span class="legend-dot actual-dot"></span> Actual</span>
              </div>
              <div class="trend-bars">
                <div class="trend-col" *ngFor="let t of dashboard!.monthlyTrend">
                  <div class="trend-bar-group">
                    <div class="trend-bar budget-bar" [style.height.%]="getTrendPercent(t.budget)"></div>
                    <div class="trend-bar actual-bar" [style.height.%]="getTrendPercent(t.actual)"></div>
                  </div>
                  <div class="trend-month">{{ t.month }}</div>
                </div>
              </div>
            </div>
            <ng-template #noTrend>
              <div class="empty-state">
                <mat-icon>info_outline</mat-icon>
                <p>No monthly trend data available</p>
              </div>
            </ng-template>
          </div>
        </div>
      </div>

      <!-- AI Insights Panel -->
      <div class="ai-panel" *ngIf="aiAnalytics">
        <div class="ai-panel-header">
          <div class="ai-title-section">
            <div class="ai-badge">
              <mat-icon>auto_awesome</mat-icon>
              <span>AI Analytics</span>
            </div>
            <h2>Budget Intelligence & Insights</h2>
          </div>
          <div class="health-score-wrap">
            <div class="health-score" [ngClass]="getHealthClass()">
              <span class="score-value">{{aiAnalytics.fiscalHealthScore | number:'1.0-0'}}</span>
              <span class="score-label">Health Score</span>
            </div>
            <span class="rating-badge" [ngClass]="getRatingClass()">{{aiAnalytics.overallRating}}</span>
          </div>
        </div>

        <div class="ai-summary" *ngIf="aiAnalytics.overallSummary">
          <mat-icon>summarize</mat-icon>
          <p>{{aiAnalytics.overallSummary}}</p>
        </div>

        <div class="ai-narrative" *ngIf="aiAnalytics.aiNarrative">
          <div class="narrative-header">
            <mat-icon>smart_toy</mat-icon>
            <span>AI-Generated CFO Briefing</span>
          </div>
          <p>{{aiAnalytics.aiNarrative}}</p>
        </div>

        <div class="insights-grid">
          <div class="insight-card" *ngFor="let insight of aiAnalytics.insights" [ngClass]="'severity-' + insight.severity">
            <div class="insight-header">
              <mat-icon>{{insight.icon}}</mat-icon>
              <span class="insight-title">{{insight.title}}</span>
              <span class="severity-pill" [ngClass]="'pill-' + insight.severity">{{insight.severity}}</span>
            </div>
            <p class="insight-desc">{{insight.description}}</p>
            <p class="insight-rec" *ngIf="insight.recommendation">
              <mat-icon>lightbulb</mat-icon> {{insight.recommendation}}
            </p>
          </div>
        </div>

        <div class="risks-opportunities" *ngIf="aiAnalytics.risks?.length || aiAnalytics.opportunities?.length">
          <div class="ro-section" *ngIf="aiAnalytics.risks?.length">
            <h3><mat-icon>warning</mat-icon> Risk Assessment</h3>
            <div class="risk-item" *ngFor="let risk of aiAnalytics.risks">
              <div class="risk-header">
                <span class="risk-title">{{risk.title}}</span>
                <span class="risk-severity" [ngClass]="'risk-' + risk.severity.toLowerCase()">{{risk.severity}}</span>
              </div>
              <p class="risk-desc">{{risk.description}}</p>
              <p class="risk-impact"><strong>Impact:</strong> {{risk.impact}}</p>
            </div>
          </div>
          <div class="ro-section" *ngIf="aiAnalytics.opportunities?.length">
            <h3><mat-icon>emoji_objects</mat-icon> Opportunities</h3>
            <div class="opportunity-item" *ngFor="let opp of aiAnalytics.opportunities">
              <div class="opp-header">
                <span class="opp-title">{{opp.title}}</span>
                <span class="opp-saving">{{formatCurrency(opp.potentialSaving)}}</span>
              </div>
              <p class="opp-desc">{{opp.description}}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="ai-loading" *ngIf="!aiAnalytics && !aiError">
        <mat-icon class="spin-icon">auto_awesome</mat-icon>
        <p>Analyzing budget data...</p>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { padding: 24px; max-width: 1440px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title { font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: #94a3b8; margin: 0; }
    .btn-refresh { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: 1px solid #e2e8f0; background: white; border-radius: 8px; font-size: 13px; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .btn-refresh:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }
    .btn-refresh mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .kpi-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
    @media (max-width: 1200px) { .kpi-row { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 700px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }

    .kpi-card { background: white; border: 1px solid #e8ecf1; border-radius: 12px; box-shadow: 0 1px 3px rgba(15,43,70,0.04); padding: 16px; display: flex; align-items: flex-start; gap: 12px; transition: transform 0.2s, box-shadow 0.2s; overflow: hidden; }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(15,43,70,0.08); }
    .kpi-icon-wrap { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kpi-icon-wrap.icon-blue { background: #e3f2fd; color: #1565c0; }
    .kpi-icon-wrap.icon-green { background: #e8f5e9; color: #2e7d32; }
    .kpi-icon-wrap.icon-red { background: #ffebee; color: #c62828; }
    .kpi-icon-wrap.icon-amber { background: #fff8e1; color: #e65100; }
    .kpi-icon-wrap.icon-teal { background: #e0f2f1; color: #00695c; }
    .kpi-icon-wrap mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .kpi-content { min-width: 0; }
    .kpi-label { font-size: 11px; color: #64748b; margin-bottom: 2px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
    .kpi-value { font-size: 17px; font-weight: 700; color: #1e293b; line-height: 1.2; margin-bottom: 2px; font-family: 'SF Mono', 'JetBrains Mono', ui-monospace, monospace; white-space: nowrap; }
    .kpi-negative { color: #c62828; }
    .kpi-count { font-size: 11px; color: #94a3b8; white-space: nowrap; }

    /* AI Panel — light theme */
    .ai-panel { background: white; border: 1px solid #e8ecf1; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(15,43,70,0.04); }
    .ai-panel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 16px; }
    .ai-title-section h2 { margin: 8px 0 0; font-size: 18px; font-weight: 600; color: #1e293b; }
    .ai-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: #fdf6e3; border: 1px solid #e8d5a0; border-radius: 20px; font-size: 12px; font-weight: 600; color: #a07c1c; }
    .ai-badge mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .health-score-wrap { display: flex; align-items: center; gap: 12px; }
    .health-score { width: 64px; height: 64px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 3px solid; background: #fafafa; }
    .health-score.health-good { border-color: #4caf50; }
    .health-score.health-fair { border-color: #ff9800; }
    .health-score.health-poor { border-color: #f44336; }
    .score-value { font-size: 22px; font-weight: 700; line-height: 1; color: #1e293b; }
    .score-label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; }
    .rating-badge { padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .rating-good { background: #e8f5e9; color: #2e7d32; }
    .rating-fair { background: #fff3e0; color: #e65100; }
    .rating-poor { background: #ffebee; color: #c62828; }

    .ai-summary { display: flex; gap: 12px; padding: 14px 16px; background: #f8fafc; border: 1px solid #e8ecf1; border-radius: 10px; margin-bottom: 16px; }
    .ai-summary mat-icon { color: #a07c1c; flex-shrink: 0; margin-top: 2px; }
    .ai-summary p { margin: 0; font-size: 13px; line-height: 1.6; color: #475569; }

    .ai-narrative { padding: 14px 16px; background: #fdf6e3; border: 1px solid #e8d5a0; border-radius: 10px; margin-bottom: 16px; }
    .narrative-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: #a07c1c; }
    .narrative-header mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .ai-narrative p { margin: 0; font-size: 13px; line-height: 1.7; color: #475569; }

    .insights-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .insight-card { padding: 14px 16px; border-radius: 10px; background: #f8fafc; border: 1px solid #e8ecf1; }
    .insight-card.severity-success { border-left: 3px solid #4caf50; }
    .insight-card.severity-warning { border-left: 3px solid #ff9800; }
    .insight-card.severity-error { border-left: 3px solid #f44336; }
    .insight-card.severity-info { border-left: 3px solid #42a5f5; }
    .insight-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .insight-header mat-icon { font-size: 20px; width: 20px; height: 20px; color: #475569; }
    .insight-title { font-size: 14px; font-weight: 600; flex: 1; color: #1e293b; }
    .severity-pill { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .pill-success { background: #e8f5e9; color: #2e7d32; }
    .pill-warning { background: #fff3e0; color: #e65100; }
    .pill-error { background: #ffebee; color: #c62828; }
    .pill-info { background: #e3f2fd; color: #1565c0; }
    .insight-desc { font-size: 13px; line-height: 1.5; color: #475569; margin: 0 0 8px; }
    .insight-rec { font-size: 12px; line-height: 1.5; color: #94a3b8; margin: 0; display: flex; align-items: flex-start; gap: 4px; }
    .insight-rec mat-icon { font-size: 14px; width: 14px; height: 14px; color: #a07c1c; flex-shrink: 0; margin-top: 2px; }

    .risks-opportunities { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 900px) { .risks-opportunities { grid-template-columns: 1fr; } }
    .ro-section h3 { font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 12px; display: flex; align-items: center; gap: 6px; }
    .ro-section h3 mat-icon { font-size: 18px; width: 18px; height: 18px; color: #a07c1c; }
    .risk-item, .opportunity-item { padding: 12px; background: #f8fafc; border: 1px solid #e8ecf1; border-radius: 8px; margin-bottom: 8px; }
    .risk-header, .opp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .risk-title, .opp-title { font-size: 13px; font-weight: 600; color: #1e293b; }
    .risk-severity { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
    .risk-high { background: #ffebee; color: #c62828; }
    .risk-medium { background: #fff3e0; color: #e65100; }
    .risk-low { background: #e3f2fd; color: #1565c0; }
    .opp-saving { font-size: 13px; font-weight: 700; color: #2e7d32; font-family: 'SF Mono', 'JetBrains Mono', ui-monospace, monospace; }
    .risk-desc, .opp-desc { font-size: 12px; line-height: 1.4; color: #64748b; margin: 0 0 4px; }
    .risk-impact { font-size: 11px; color: #94a3b8; margin: 0; }

    .ai-loading { text-align: center; padding: 40px; background: white; border: 1px solid #e8ecf1; border-radius: 12px; margin-bottom: 24px; }
    .ai-loading mat-icon { font-size: 32px; width: 32px; height: 32px; color: #a07c1c; margin-bottom: 8px; }
    .ai-loading p { margin: 0; font-size: 14px; color: #94a3b8; }
    .spin-icon { animation: spin 2s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .grid-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    @media (max-width: 900px) { .grid-two-col { grid-template-columns: 1fr; } }

    .card-container { background: white; border: 1px solid #e8ecf1; border-radius: 12px; box-shadow: 0 1px 3px rgba(15,43,70,0.04); overflow: hidden; }
    .card-title-bar { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid #e8ecf1; }
    .card-title-bar h2 { font-size: 16px; font-weight: 600; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 8px; }
    .card-title-bar h2 mat-icon { font-size: 20px; width: 20px; height: 20px; color: #42a5f5; }
    .card-body { padding: 20px 22px; }

    .version-grid { display: grid; gap: 12px; }
    .version-card { border: 1px solid #e8ecf1; border-radius: 10px; padding: 14px 16px; transition: transform 0.2s; }
    .version-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(15,43,70,0.08); }
    .version-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .version-name { font-size: 14px; font-weight: 600; color: #1e293b; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    .status-draft { background: #f1f5f9; color: #64748b; }
    .status-pending { background: #fff3e0; color: #ef6c00; }
    .status-approved { background: #e8f5e9; color: #1b5e20; }
    .status-locked { background: #e3f2fd; color: #1565c0; }
    .version-card-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .type-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .type-tabb { background: #e3f2fd; color: #1565c0; }
    .type-orgb { background: #e0f2f1; color: #00695c; }
    .type-adjb { background: #fff8e1; color: #e65100; }
    .version-strings { font-size: 12px; color: #64748b; }
    .version-card-date { font-size: 12px; color: #94a3b8; }

    .function-list { display: flex; flex-direction: column; gap: 14px; }
    .function-row { display: flex; align-items: center; gap: 12px; }
    .function-label { width: 140px; flex-shrink: 0; font-size: 13px; font-weight: 500; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .function-bar-container { flex: 1; height: 22px; background: #f1f5f9; border-radius: 6px; overflow: hidden; }
    .function-bar { height: 100%; background: linear-gradient(90deg, #0f2b46, #1a5276); border-radius: 6px; min-width: 4px; transition: width 0.4s ease; }
    .function-amount { width: 120px; flex-shrink: 0; text-align: right; font-size: 13px; font-weight: 600; font-family: 'SF Mono', 'JetBrains Mono', ui-monospace, monospace; color: #1e293b; }

    .dept-row { padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
    .dept-row:last-child { border-bottom: none; }
    .dept-name { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
    .dept-values { display: flex; gap: 16px; flex-wrap: wrap; }
    .dept-metric { display: flex; flex-direction: column; min-width: 100px; }
    .dept-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 2px; }
    .dept-amount { font-size: 14px; font-weight: 600; font-family: 'SF Mono', 'JetBrains Mono', ui-monospace, monospace; }
    .revenue-color { color: #2e7d32; }
    .expense-color { color: #c62828; }
    .capital-color { color: #1565c0; }

    .trend-chart { overflow-x: auto; }
    .trend-legend { display: flex; gap: 20px; margin-bottom: 16px; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #64748b; font-weight: 500; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
    .budget-dot { background: #0f2b46; }
    .actual-dot { background: #c9a84c; }
    .trend-bars { display: flex; gap: 6px; align-items: flex-end; min-height: 200px; }
    .trend-col { flex: 1; min-width: 40px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .trend-bar-group { display: flex; gap: 3px; align-items: flex-end; height: 160px; width: 100%; justify-content: center; }
    .trend-bar { width: 14px; border-radius: 3px 3px 0 0; transition: height 0.4s ease; min-height: 4px; }
    .budget-bar { background: #0f2b46; }
    .actual-bar { background: #c9a84c; }
    .trend-month { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }

    .empty-state { text-align: center; padding: 40px 16px; color: #64748b; }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; color: #cbd5e1; margin-bottom: 8px; }
    .empty-state p { margin: 0; font-size: 14px; }
  `]
})
export class DashboardPage implements OnInit {
  dashboard: CfoDashboard | null = null;
  aiAnalytics: any = null;
  aiError = false;
  kpiCards: any[] = [];
  private maxFunctionAmount = 0;
  private maxTrendAmount = 0;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadAiInsights();
  }

  loadDashboard() {
    this.api.getCfoDashboard().subscribe({
      next: data => {
        this.dashboard = data;
        this.buildKpiCards(data);
        if (data.byFunction?.length) {
          this.maxFunctionAmount = Math.max(...data.byFunction.map((f: any) => f.year1));
        }
        if (data.monthlyTrend?.length) {
          this.maxTrendAmount = Math.max(
            ...data.monthlyTrend.map((t: any) => Math.max(t.budget, t.actual))
          );
        }
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Dashboard API error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  loadAiInsights() {
    this.api.getAiInsights().subscribe({
      next: data => {
        this.aiAnalytics = data;
        this.cdr.markForCheck();
      },
      error: () => {
        this.aiError = true;
        this.cdr.markForCheck();
      }
    });
  }

  refreshAll() {
    this.dashboard = null;
    this.aiAnalytics = null;
    this.aiError = false;
    this.kpiCards = [];
    this.cdr.markForCheck();
    this.loadDashboard();
    this.loadAiInsights();
  }

  buildKpiCards(data: CfoDashboard) {
    this.kpiCards = [
      { icon: 'account_balance_wallet', label: 'Total Budget', value: this.formatCompact(data.totalBudgetYear1), subtitle: 'Year 1 Allocation', colorClass: 'icon-blue', isNegative: false },
      { icon: 'trending_up', label: 'Revenue', value: this.formatCompact(data.totalRevenueYear1), subtitle: 'Total Revenue Year 1', colorClass: 'icon-green', isNegative: false },
      { icon: 'trending_down', label: 'Expenditure', value: this.formatCompact(data.totalExpenditureYear1), subtitle: 'Total Expenditure Year 1', colorClass: 'icon-red', isNegative: false },
      { icon: 'domain', label: 'Capital Budget', value: this.formatCompact(data.totalCapitalYear1), subtitle: 'Capital Allocation', colorClass: 'icon-teal', isNegative: false },
      { icon: 'pending_actions', label: 'Pending', value: String(data.pendingApprovals || 0), subtitle: 'Awaiting Review', colorClass: 'icon-amber', isNegative: false },
    ];
  }

  formatCompact(value: number): string {
    if (value == null) return 'R 0';
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 1_000_000_000) return `${sign}R ${(abs / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${sign}R ${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${sign}R ${(abs / 1_000).toFixed(0)}K`;
    return `${sign}R ${abs.toFixed(0)}`;
  }

  formatCurrency(value: number): string {
    if (value == null) return 'R 0';
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 1_000_000) return `${sign}R ${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${sign}R ${(abs / 1_000).toFixed(0)}K`;
    return `${sign}R ${abs.toFixed(0)}`;
  }

  getFunctionPercent(amount: number): number {
    if (!this.maxFunctionAmount || !amount) return 0;
    return (amount / this.maxFunctionAmount) * 100;
  }

  getTrendPercent(amount: number): number {
    if (!this.maxTrendAmount || !amount) return 0;
    return (amount / this.maxTrendAmount) * 100;
  }

  getHealthClass(): string {
    if (!this.aiAnalytics) return '';
    const score = this.aiAnalytics.fiscalHealthScore;
    return score >= 70 ? 'health-good' : score >= 50 ? 'health-fair' : 'health-poor';
  }

  getRatingClass(): string {
    if (!this.aiAnalytics) return '';
    const rating = this.aiAnalytics.overallRating;
    return rating === 'Good' ? 'rating-good' : rating === 'Fair' ? 'rating-fair' : 'rating-poor';
  }
}
