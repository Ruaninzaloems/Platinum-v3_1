import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/services/api.service';
import { ValidationDashboard, ValidationRun, BudgetVersionSummary } from '../../core/models/budget.models';

@Component({
  selector: 'app-validation-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatProgressBarModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Validation Engine</h1>
        <p class="subtitle">mSCOA compliance validation and budget integrity checks</p>
      </div>
      <div class="header-actions">
        <mat-form-field appearance="outline" class="version-select">
          <mat-label>Budget Version</mat-label>
          <mat-select [(ngModel)]="selectedVersionId">
            <mat-option *ngFor="let v of versions" [value]="v.id">{{v.versionName}}</mat-option>
          </mat-select>
        </mat-form-field>
        <button class="btn-primary" (click)="runValidation()" [disabled]="!selectedVersionId || isRunning">
          <mat-icon>play_arrow</mat-icon> Run Validation
        </button>
      </div>
    </div>

    <div class="kpi-row" *ngIf="dashboard">
      <div class="kpi-card pass">
        <div class="kpi-icon-wrap"><mat-icon>check_circle</mat-icon></div>
        <div class="kpi-value">{{dashboard.passCount}}</div>
        <div class="kpi-label">Passed</div>
        <mat-progress-bar mode="determinate" [value]="dashboard.passPercentage" color="primary"></mat-progress-bar>
      </div>
      <div class="kpi-card warn">
        <div class="kpi-icon-wrap"><mat-icon>warning</mat-icon></div>
        <div class="kpi-value">{{dashboard.warningCount}}</div>
        <div class="kpi-label">Warnings</div>
        <mat-progress-bar mode="determinate" [value]="warnPercent" color="accent"></mat-progress-bar>
      </div>
      <div class="kpi-card error">
        <div class="kpi-icon-wrap"><mat-icon>error</mat-icon></div>
        <div class="kpi-value">{{dashboard.errorCount}}</div>
        <div class="kpi-label">Errors</div>
        <mat-progress-bar mode="determinate" [value]="errorPercent" color="warn"></mat-progress-bar>
      </div>
      <div class="kpi-card total">
        <div class="kpi-icon-wrap"><mat-icon>assessment</mat-icon></div>
        <div class="kpi-value">{{dashboard.passPercentage | number:'1.1-1'}}%</div>
        <div class="kpi-label">Compliance Rate</div>
        <mat-progress-bar mode="determinate" [value]="dashboard.passPercentage" [color]="dashboard.passPercentage >= 90 ? 'primary' : 'warn'"></mat-progress-bar>
      </div>
    </div>

    <div class="content-grid">
      <div class="card-container" *ngIf="dashboard && dashboard.topFailures.length > 0">
        <div class="card-title-bar">
          <h2><mat-icon>bug_report</mat-icon> Top Rule Failures</h2>
        </div>
        <div class="failure-list">
          <div class="failure-item" *ngFor="let f of dashboard.topFailures">
            <div class="failure-info">
              <div class="failure-code">{{f.ruleCode}}</div>
              <div class="failure-desc">{{f.description}}</div>
            </div>
            <div class="failure-meta">
              <span class="failure-count" [ngClass]="f.severity === 'Error' ? 'count-error' : 'count-warn'">{{f.count}}</span>
              <span class="severity-badge" [ngClass]="'sev-' + f.severity.toLowerCase()">{{f.severity}}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card-container" *ngIf="lastRun">
        <div class="card-title-bar">
          <h2><mat-icon>list_alt</mat-icon> Latest Validation Run</h2>
          <span class="run-id">{{lastRun.runId}}</span>
        </div>
        <div class="results-summary">
          <div class="result-stat">
            <span class="stat-value">{{lastRun.totalStrings}}</span>
            <span class="stat-label">Strings Checked</span>
          </div>
          <div class="result-stat pass">
            <span class="stat-value">{{lastRun.passed}}</span>
            <span class="stat-label">Passed</span>
          </div>
          <div class="result-stat warn">
            <span class="stat-value">{{lastRun.warnings}}</span>
            <span class="stat-label">Warnings</span>
          </div>
          <div class="result-stat error">
            <span class="stat-value">{{lastRun.errors}}</span>
            <span class="stat-label">Errors</span>
          </div>
        </div>
        <div class="results-list" *ngIf="lastRun.results.length > 0">
          <div class="result-item" *ngFor="let r of lastRun.results" [ngClass]="'result-' + r.status.toLowerCase()">
            <mat-icon class="result-icon">{{r.status === 'Error' ? 'error' : r.status === 'Warning' ? 'warning' : 'check_circle'}}</mat-icon>
            <div class="result-content">
              <div class="result-rule">{{r.ruleCode}}</div>
              <div class="result-msg">{{r.message}}</div>
              <div class="result-segment" *ngIf="r.segmentString"><span class="mscoa-tag">{{r.segmentString}}</span></div>
              <div class="result-fix" *ngIf="r.suggestedFix"><mat-icon class="fix-icon">lightbulb</mat-icon> {{r.suggestedFix}}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card-container" *ngIf="!dashboard && !lastRun && !isRunning">
      <div class="empty-state">
        <mat-icon class="empty-icon">verified</mat-icon>
        <h3>No Validation Data</h3>
        <p>Select a budget version and run validation to check mSCOA compliance.</p>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .page-header h1 { font-size: 28px; font-weight: 700; color: #1e293b; margin: 0; }
    .subtitle { font-size: 14px; color: #64748b; margin: 4px 0 0; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .version-select { width: 220px; }
    ::ng-deep .version-select .mat-mdc-form-field-subscript-wrapper { display: none; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 8px 20px; background: #0f2b46; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; height: 40px; }
    .btn-primary:hover { background: #1a3a5c; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .kpi-card { padding: 20px; background: white; border: 1px solid #e8ecf1; border-radius: 12px; text-align: center; }
    .kpi-card.pass { border-top: 3px solid #4caf50; }
    .kpi-card.warn { border-top: 3px solid #f59e0b; }
    .kpi-card.error { border-top: 3px solid #ef5350; }
    .kpi-card.total { border-top: 3px solid #42a5f5; }
    .kpi-icon-wrap { margin-bottom: 8px; }
    .kpi-card.pass .kpi-icon-wrap { color: #4caf50; }
    .kpi-card.warn .kpi-icon-wrap { color: #f59e0b; }
    .kpi-card.error .kpi-icon-wrap { color: #ef5350; }
    .kpi-card.total .kpi-icon-wrap { color: #42a5f5; }
    .kpi-value { font-size: 28px; font-weight: 700; color: #1e293b; }
    .kpi-label { font-size: 12px; color: #64748b; margin: 4px 0 12px; }
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .failure-list { padding: 0; }
    .failure-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #f1f5f9; }
    .failure-item:last-child { border-bottom: none; }
    .failure-code { font-family: 'SF Mono', ui-monospace, monospace; font-size: 12px; font-weight: 600; color: #1e293b; }
    .failure-desc { font-size: 13px; color: #64748b; margin-top: 2px; }
    .failure-meta { display: flex; align-items: center; gap: 10px; }
    .failure-count { font-size: 16px; font-weight: 700; }
    .count-error { color: #ef5350; }
    .count-warn { color: #f59e0b; }
    .severity-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; }
    .sev-error { background: #ffebee; color: #c62828; }
    .sev-warning { background: #fff8e1; color: #e65100; }
    .run-id { font-family: 'SF Mono', ui-monospace, monospace; font-size: 11px; color: #94a3b8; }
    .results-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 16px 20px; border-bottom: 1px solid #e8ecf1; }
    .result-stat { text-align: center; }
    .stat-value { display: block; font-size: 22px; font-weight: 700; color: #1e293b; }
    .result-stat.pass .stat-value { color: #4caf50; }
    .result-stat.warn .stat-value { color: #f59e0b; }
    .result-stat.error .stat-value { color: #ef5350; }
    .stat-label { font-size: 11px; color: #64748b; }
    .results-list { max-height: 400px; overflow-y: auto; }
    .result-item { display: flex; gap: 12px; padding: 12px 20px; border-bottom: 1px solid #f1f5f9; }
    .result-item.result-error { border-left: 3px solid #ef5350; }
    .result-item.result-warning { border-left: 3px solid #f59e0b; }
    .result-item.result-pass { border-left: 3px solid #4caf50; }
    .result-icon { font-size: 20px; width: 20px; height: 20px; margin-top: 2px; }
    .result-error .result-icon { color: #ef5350; }
    .result-warning .result-icon { color: #f59e0b; }
    .result-pass .result-icon { color: #4caf50; }
    .result-rule { font-family: 'SF Mono', ui-monospace, monospace; font-size: 11px; font-weight: 600; color: #1e293b; }
    .result-msg { font-size: 13px; color: #334155; margin: 2px 0; }
    .result-segment { margin-top: 4px; }
    .result-fix { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #1565c0; margin-top: 4px; }
    .fix-icon { font-size: 14px; width: 14px; height: 14px; }
    .empty-state { text-align: center; padding: 48px 16px; }
    .empty-icon { font-size: 56px; width: 56px; height: 56px; color: #cbd5e1; }
    .empty-state h3 { color: #334155; margin: 12px 0 4px; }
    .empty-state p { color: #64748b; font-size: 14px; }
    @media (max-width: 900px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } .content-grid { grid-template-columns: 1fr; } }
  `]
})
export class ValidationDashboardPage implements OnInit {
  dashboard: ValidationDashboard | null = null;
  lastRun: ValidationRun | null = null;
  versions: BudgetVersionSummary[] = [];
  selectedVersionId: number | null = null;
  isRunning = false;

  get warnPercent() { return this.dashboard ? (this.dashboard.warningCount / Math.max(this.dashboard.totalStringsValidated, 1)) * 100 : 0; }
  get errorPercent() { return this.dashboard ? (this.dashboard.errorCount / Math.max(this.dashboard.totalStringsValidated, 1)) * 100 : 0; }

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getBudgetVersions().subscribe(v => {
      this.versions = v;
      if (v.length > 0) {
        this.selectedVersionId = v[0].id;
        this.loadDashboard();
      }
    });
  }

  loadDashboard() {
    if (this.selectedVersionId) {
      this.api.getValidationDashboard(this.selectedVersionId).subscribe(d => this.dashboard = d);
    }
  }

  runValidation() {
    if (!this.selectedVersionId) return;
    this.isRunning = true;
    this.api.validateBudgetStrings(this.selectedVersionId).subscribe({
      next: (run) => {
        this.lastRun = run;
        this.isRunning = false;
        this.loadDashboard();
      },
      error: () => this.isRunning = false
    });
  }
}
