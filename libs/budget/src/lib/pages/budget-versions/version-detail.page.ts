import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';
import { BudgetVersionDetail, Approval } from '../../core/models/budget.models';

@Component({
  selector: 'app-version-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatDialogModule],
  template: `
    <div class="page-container" *ngIf="version">
      <div class="page-header">
        <div class="header-left">
          <a routerLink="/budget-versions" class="back-link"><mat-icon>arrow_back</mat-icon> Back to Versions</a>
          <h1>{{ version.versionName }}</h1>
          <div class="header-badges">
            <span class="type-badge" [ngClass]="'type-' + version.versionType.toLowerCase()">{{ version.versionType }}</span>
            <span class="status-badge" [ngClass]="'status-' + version.status.toLowerCase()">{{ version.status }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" *ngIf="version.status === 'Draft'" (click)="submitVersion()">
            <mat-icon>send</mat-icon> Submit
          </button>
          <button mat-raised-button color="accent" *ngIf="version.status === 'Pending'" (click)="approveVersion()">
            <mat-icon>check_circle</mat-icon> Approve
          </button>
          <button mat-raised-button *ngIf="version.status === 'Approved'" (click)="lockVersion()">
            <mat-icon>lock</mat-icon> Lock
          </button>
          <button mat-stroked-button (click)="cloneVersion()">
            <mat-icon>content_copy</mat-icon> Clone
          </button>
        </div>
      </div>

      <div class="workflow-stepper">
        <div class="step" [class.active]="isStepActive('Draft')" [class.completed]="isStepCompleted('Draft')">
          <div class="step-circle"><mat-icon>{{ isStepCompleted('Draft') ? 'check' : 'edit' }}</mat-icon></div>
          <span>Draft</span>
        </div>
        <div class="step-line" [class.completed]="isStepCompleted('Draft')"></div>
        <div class="step" [class.active]="isStepActive('Pending')" [class.completed]="isStepCompleted('Pending')">
          <div class="step-circle"><mat-icon>{{ isStepCompleted('Pending') ? 'check' : 'hourglass_empty' }}</mat-icon></div>
          <span>Pending</span>
        </div>
        <div class="step-line" [class.completed]="isStepCompleted('Pending')"></div>
        <div class="step" [class.active]="isStepActive('Approved')" [class.completed]="isStepCompleted('Approved')">
          <div class="step-circle"><mat-icon>{{ isStepCompleted('Approved') ? 'check' : 'thumb_up' }}</mat-icon></div>
          <span>Approved</span>
        </div>
        <div class="step-line" [class.completed]="isStepCompleted('Approved')"></div>
        <div class="step" [class.active]="isStepActive('Locked')" [class.completed]="isStepCompleted('Locked')">
          <div class="step-circle"><mat-icon>{{ isStepCompleted('Locked') ? 'check' : 'lock' }}</mat-icon></div>
          <span>Locked</span>
        </div>
      </div>

      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-label">Revenue</div>
          <div class="card-value revenue">{{ formatRand(version.totalRevenue) }}</div>
        </div>
        <div class="summary-card">
          <div class="card-label">Expenditure</div>
          <div class="card-value expenditure">{{ formatRand(version.totalExpenditure) }}</div>
        </div>
        <div class="summary-card">
          <div class="card-label">Capital</div>
          <div class="card-value capital">{{ formatRand(version.totalCapital) }}</div>
        </div>
        <div class="summary-card">
          <div class="card-label">Net Surplus / Deficit</div>
          <div class="card-value" [class.surplus]="netSurplus >= 0" [class.deficit]="netSurplus < 0">{{ formatRand(netSurplus) }}</div>
        </div>
      </div>

      <div class="content-grid">
        <div class="table-card">
          <h3>Budget Strings Summary by Item</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="amount">Year 1</th>
                <th class="amount">Year 2</th>
                <th class="amount">Year 3</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of stringSummary">
                <td>{{ s.description || s.code }}</td>
                <td class="amount">{{ formatRand(s.year1) }}</td>
                <td class="amount">{{ formatRand(s.year2) }}</td>
                <td class="amount">{{ formatRand(s.year3) }}</td>
              </tr>
              <tr *ngIf="stringSummary.length === 0">
                <td colspan="4" class="empty">No budget strings found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="timeline-card">
          <h3>Approval Timeline</h3>
          <div class="timeline" *ngIf="version.approvals && version.approvals.length > 0">
            <div class="timeline-item" *ngFor="let a of version.approvals">
              <div class="timeline-dot" [ngClass]="'dot-' + a.decision.toLowerCase()"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-decision" [ngClass]="'decision-' + a.decision.toLowerCase()">{{ a.decision }}</span>
                  <span class="timeline-date">{{ a.timestamp | date:'dd MMM yyyy HH:mm' }}</span>
                </div>
                <div class="timeline-user">{{ a.userName }}</div>
                <div class="timeline-comment" *ngIf="a.comment">{{ a.comment }}</div>
              </div>
            </div>
          </div>
          <div class="empty" *ngIf="!version.approvals || version.approvals.length === 0">No approval history yet</div>
        </div>
      </div>
    </div>

    <div class="page-container" *ngIf="!version">
      <div class="loading">Loading version details...</div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .header-left { display: flex; flex-direction: column; gap: 8px; }
    .back-link { display: flex; align-items: center; gap: 4px; color: #64748b; text-decoration: none; font-size: 13px; }
    .back-link:hover { color: #1565c0; }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; }
    h1 { font-size: 22px; font-weight: 600; color: #1e293b; margin: 0; }
    .header-badges { display: flex; gap: 8px; }
    .header-actions { display: flex; gap: 8px; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .status-draft { background: #f1f5f9; color: #64748b; }
    .status-pending { background: #fff7ed; color: #ea580c; }
    .status-approved { background: #ecfdf5; color: #059669; }
    .status-locked { background: #eff6ff; color: #2563eb; }
    .type-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .type-tabb { background: #e3f2fd; color: #1565c0; }
    .type-orgb { background: #f3e5f5; color: #7b1fa2; }
    .type-adjb { background: #fff3e0; color: #e65100; }
    .workflow-stepper { display: flex; align-items: center; justify-content: center; padding: 24px; background: #fff; border: 1px solid #e8ecf1; border-radius: 12px; margin-bottom: 24px; }
    .step { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .step-circle { width: 36px; height: 36px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
    .step.active .step-circle { background: #1565c0; color: #fff; }
    .step.completed .step-circle { background: #059669; color: #fff; }
    .step span { font-size: 12px; color: #64748b; font-weight: 500; }
    .step.active span { color: #1565c0; font-weight: 600; }
    .step.completed span { color: #059669; }
    .step-line { flex: 1; height: 2px; background: #e8ecf1; margin: 0 12px; margin-bottom: 22px; }
    .step-line.completed { background: #059669; }
    .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .summary-card { background: #fff; border: 1px solid #e8ecf1; border-radius: 12px; padding: 20px; }
    .card-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 8px; }
    .card-value { font-size: 22px; font-weight: 700; color: #1e293b; font-family: 'Roboto Mono', monospace; }
    .card-value.revenue { color: #059669; }
    .card-value.expenditure { color: #dc2626; }
    .card-value.capital { color: #2563eb; }
    .card-value.surplus { color: #059669; }
    .card-value.deficit { color: #dc2626; }
    .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
    .table-card, .timeline-card { background: #fff; border: 1px solid #e8ecf1; border-radius: 12px; padding: 20px; }
    h3 { font-size: 15px; font-weight: 600; color: #1e293b; margin: 0 0 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; padding: 10px 12px; text-align: left; border-bottom: 1px solid #e8ecf1; }
    td { font-size: 13px; color: #1e293b; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    tr:hover td { background: #f8fafc; }
    .amount { text-align: right; font-family: 'Roboto Mono', monospace; }
    .empty { text-align: center; color: #94a3b8; padding: 32px 16px !important; }
    .loading { text-align: center; color: #94a3b8; padding: 80px; font-size: 15px; }
    .timeline { display: flex; flex-direction: column; gap: 0; }
    .timeline-item { display: flex; gap: 12px; padding: 12px 0; position: relative; }
    .timeline-item:not(:last-child)::before { content: ''; position: absolute; left: 7px; top: 28px; bottom: -4px; width: 2px; background: #e8ecf1; }
    .timeline-dot { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; margin-top: 2px; }
    .dot-approved, .dot-approve { background: #059669; }
    .dot-rejected, .dot-reject { background: #dc2626; }
    .dot-submitted, .dot-submit { background: #2563eb; }
    .dot-pending { background: #ea580c; }
    .timeline-content { flex: 1; }
    .timeline-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .timeline-decision { font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .decision-approved, .decision-approve { color: #059669; }
    .decision-rejected, .decision-reject { color: #dc2626; }
    .decision-submitted, .decision-submit { color: #2563eb; }
    .decision-pending { color: #ea580c; }
    .timeline-date { font-size: 11px; color: #94a3b8; }
    .timeline-user { font-size: 13px; color: #1e293b; font-weight: 500; }
    .timeline-comment { font-size: 12px; color: #64748b; margin-top: 4px; font-style: italic; }
  `]
})
export class VersionDetailPage implements OnInit {
  version: BudgetVersionDetail | null = null;
  stringSummary: any[] = [];
  netSurplus = 0;

  private statusOrder = ['Draft', 'Pending', 'Approved', 'Locked'];

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getBudgetVersion(id).subscribe(v => {
      this.version = v;
      this.netSurplus = (v.totalRevenue || 0) - (v.totalExpenditure || 0);
    });
    this.api.getBudgetStringSummary(id).subscribe(s => this.stringSummary = s);
  }

  formatRand(amount: number): string {
    return 'R ' + (amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  isStepActive(step: string): boolean {
    return this.version?.status === step;
  }

  isStepCompleted(step: string): boolean {
    if (!this.version) return false;
    const currentIdx = this.statusOrder.indexOf(this.version.status);
    const stepIdx = this.statusOrder.indexOf(step);
    return stepIdx < currentIdx;
  }

  submitVersion() {
    if (!this.version) return;
    this.api.submitBudgetVersion(this.version.id, { userId: 'current-user', comment: '' }).subscribe(() => this.reload());
  }

  approveVersion() {
    if (!this.version) return;
    this.api.approveBudgetVersion(this.version.id, { userId: 'current-user', comment: '' }).subscribe(() => this.reload());
  }

  lockVersion() {
    if (!this.version) return;
    this.api.lockBudgetVersion(this.version.id, { userId: 'current-user', comment: '' }).subscribe(() => this.reload());
  }

  cloneVersion() {
    if (!this.version) return;
    this.api.cloneBudgetVersion(this.version.id, { userId: 'current-user', newVersionName: this.version.versionName + ' (Clone)' }).subscribe(() => {});
  }

  private reload() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getBudgetVersion(id).subscribe(v => {
      this.version = v;
      this.netSurplus = (v.totalRevenue || 0) - (v.totalExpenditure || 0);
    });
    this.api.getBudgetStringSummary(id).subscribe(s => this.stringSummary = s);
  }
}
