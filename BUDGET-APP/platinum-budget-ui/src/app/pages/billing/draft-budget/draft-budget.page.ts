import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../services/api.service';
import { DraftRevenueBudget, BillingIntegrationStatus, BudgetVersionSummary } from '../../../models/budget.models';

@Component({
  selector: 'app-draft-budget-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Draft Revenue Budget</h1>
          <p class="page-subtitle">Consolidated revenue view and mSCOA string generation (BILB4, BILB16, BILB29, BILB31)</p>
        </div>
        <button class="btn-primary" (click)="showGenerateDialog = true">
          <mat-icon>code</mat-icon> Generate Budget Strings
        </button>
      </div>

      <div class="integration-bar" *ngIf="integrationStatus">
        <div class="int-item">
          <mat-icon [ngClass]="integrationStatus.status === 'Integrated' ? 'text-green' : 'text-amber'">
            {{integrationStatus.status === 'Integrated' ? 'check_circle' : 'pending'}}
          </mat-icon>
          <span>Integration: <strong>{{integrationStatus.status}}</strong></span>
        </div>
        <div class="int-item">
          <span>Projections: <strong>{{integrationStatus.projectionsApproved}}</strong> approved, {{integrationStatus.projectionsPending}} pending</span>
        </div>
        <div class="int-item">
          <span>Rebates: <strong>{{integrationStatus.rebatesApproved}}</strong> approved, {{integrationStatus.rebatesPending}} pending</span>
        </div>
        <div class="int-item">
          <span>Budget Strings: <strong>{{integrationStatus.budgetStringsGenerated}}</strong></span>
        </div>
      </div>

      <div class="kpi-row" *ngIf="draftBudget">
        <div class="kpi-card">
          <div class="kpi-icon-wrap icon-blue"><mat-icon>trending_up</mat-icon></div>
          <div class="kpi-content">
            <div class="kpi-label">Gross Revenue</div>
            <div class="kpi-value">{{formatCurrency(draftBudget.totalGrossRevenue)}}</div>
            <div class="kpi-sub">Total billing revenue</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap icon-red"><mat-icon>discount</mat-icon></div>
          <div class="kpi-content">
            <div class="kpi-label">Total Rebates</div>
            <div class="kpi-value">{{formatCurrency(draftBudget.totalRebates)}}</div>
            <div class="kpi-sub">Indigent + other</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap icon-green"><mat-icon>account_balance</mat-icon></div>
          <div class="kpi-content">
            <div class="kpi-label">Net Revenue</div>
            <div class="kpi-value">{{formatCurrency(draftBudget.totalNetRevenue)}}</div>
            <div class="kpi-sub">After deductions</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap icon-teal"><mat-icon>code</mat-icon></div>
          <div class="kpi-content">
            <div class="kpi-label">Strings Generated</div>
            <div class="kpi-value">{{draftBudget.budgetStringsGenerated}}</div>
            <div class="kpi-sub">mSCOA budget strings</div>
          </div>
        </div>
      </div>

      <div class="card-container" *ngIf="draftBudget">
        <div class="card-title-bar">
          <h2><mat-icon>table_chart</mat-icon> Revenue by Service & mSCOA Segment</h2>
        </div>
        <div class="card-body">
          <table class="data-table">
            <thead>
              <tr>
                <th>Service Category</th>
                <th>Type</th>
                <th>mSCOA Item</th>
                <th>Fund</th>
                <th>Function</th>
                <th class="text-right">Gross Revenue</th>
                <th class="text-right">Rebates</th>
                <th class="text-right">Net Revenue</th>
                <th class="text-right">Year 1</th>
                <th class="text-right">Year 2</th>
                <th class="text-right">Year 3</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let line of draftBudget.lines">
                <td class="fw-600">{{line.serviceCategoryName}}</td>
                <td><span class="svc-badge" [ngClass]="'svc-' + line.serviceType.toLowerCase()">{{line.serviceType}}</span></td>
                <td><span class="scoa-tag" *ngIf="line.scoaItemCode">{{line.scoaItemCode}}</span></td>
                <td><span class="scoa-tag" *ngIf="line.scoaFundCode">{{line.scoaFundCode}}</span></td>
                <td><span class="scoa-tag" *ngIf="line.scoaFunctionCode">{{line.scoaFunctionCode}}</span></td>
                <td class="text-right mono">{{formatCurrency(line.grossRevenue)}}</td>
                <td class="text-right mono text-red">-{{formatCurrency(line.rebates)}}</td>
                <td class="text-right mono fw-600">{{formatCurrency(line.netRevenue)}}</td>
                <td class="text-right mono">{{formatCurrency(line.year1Amount)}}</td>
                <td class="text-right mono">{{formatCurrency(line.year2Amount)}}</td>
                <td class="text-right mono">{{formatCurrency(line.year3Amount)}}</td>
                <td>
                  <span class="variance-flag" *ngIf="getVariance(line) > 15" [ngClass]="'var-high'">+{{getVariance(line) | number:'1.0-0'}}%</span>
                  <span class="variance-flag" *ngIf="getVariance(line) <= 15 && getVariance(line) > 5" [ngClass]="'var-med'">+{{getVariance(line) | number:'1.0-0'}}%</span>
                  <span class="variance-flag" *ngIf="getVariance(line) <= 5" [ngClass]="'var-low'">+{{getVariance(line) | number:'1.0-0'}}%</span>
                </td>
              </tr>
              <tr class="total-row">
                <td class="fw-600" colspan="5">TOTAL</td>
                <td class="text-right mono fw-600">{{formatCurrency(draftBudget.totalGrossRevenue)}}</td>
                <td class="text-right mono text-red fw-600">-{{formatCurrency(draftBudget.totalRebates)}}</td>
                <td class="text-right mono fw-600">{{formatCurrency(draftBudget.totalNetRevenue)}}</td>
                <td class="text-right mono fw-600">{{formatCurrency(draftBudget.year1Total)}}</td>
                <td class="text-right mono fw-600">{{formatCurrency(draftBudget.year2Total)}}</td>
                <td class="text-right mono fw-600">{{formatCurrency(draftBudget.year3Total)}}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card-container" *ngIf="billingStrings.length">
        <div class="card-title-bar">
          <h2><mat-icon>code</mat-icon> Generated mSCOA Budget Strings</h2>
          <span class="record-count">{{billingStrings.length}} strings</span>
        </div>
        <div class="card-body">
          <table class="data-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Description</th>
                <th>Fund</th>
                <th>Function</th>
                <th>Region</th>
                <th class="text-right">Year 1</th>
                <th class="text-right">Year 2</th>
                <th class="text-right">Year 3</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of billingStrings">
                <td class="mono fw-600">{{s.scoaItemCode}}</td>
                <td>{{s.description}}</td>
                <td class="mono">{{s.scoaFundCode}}</td>
                <td class="mono">{{s.scoaFunctionCode}}</td>
                <td class="mono">{{s.scoaRegionCode}}</td>
                <td class="text-right mono">{{formatCurrency(s.year1Amount)}}</td>
                <td class="text-right mono">{{formatCurrency(s.year2Amount)}}</td>
                <td class="text-right mono">{{formatCurrency(s.year3Amount)}}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="empty-page" *ngIf="!draftBudget">
        <mat-icon>summarize</mat-icon>
        <h2>No Revenue Projections Available</h2>
        <p>Calculate revenue projections and rebates first, then generate the draft revenue budget.</p>
      </div>

      <div class="dialog-overlay" *ngIf="showGenerateDialog" (click)="showGenerateDialog = false">
        <div class="dialog-panel" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2>Generate mSCOA Budget Strings</h2>
            <button class="btn-icon" (click)="showGenerateDialog = false"><mat-icon>close</mat-icon></button>
          </div>
          <div class="dialog-body">
            <p class="dialog-desc">This will generate mSCOA 7-segment budget strings from approved revenue projections and insert them into the selected budget version.</p>
            <div class="form-grid">
              <div class="form-group">
                <label>Budget Version</label>
                <select [(ngModel)]="generateForm.budgetVersionId">
                  <option *ngFor="let v of budgetVersions" [ngValue]="v.id">{{v.versionName}} ({{v.status}})</option>
                </select>
              </div>
              <div class="form-group">
                <label>Financial Year ID</label>
                <input type="number" [(ngModel)]="generateForm.financialYearId">
              </div>
            </div>
            <div class="gen-result" *ngIf="generateResult">
              <mat-icon class="text-green">check_circle</mat-icon>
              <div>
                <p><strong>{{generateResult.stringsGenerated}}</strong> strings generated, <strong>{{generateResult.stringsUpdated}}</strong> updated</p>
                <p *ngFor="let w of generateResult.warnings" class="warning-text">{{w}}</p>
              </div>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn-secondary" (click)="showGenerateDialog = false">Close</button>
            <button class="btn-primary" (click)="generateStrings()" [disabled]="generating">{{generating ? 'Generating...' : 'Generate Strings'}}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 1440px; margin: 0 auto; }
    .page-header { margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title { font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: #94a3b8; margin: 0; }
    .btn-primary { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background: #0f2b46; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { background: #1a3a5c; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-secondary { padding: 10px 20px; background: white; color: #64748b; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; }
    .btn-icon { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; border-radius: 6px; display: flex; align-items: center; }
    .btn-icon:hover { background: #f1f5f9; }
    .btn-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .integration-bar { display: flex; gap: 20px; padding: 12px 20px; background: white; border: 1px solid #e8ecf1; border-radius: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
    .int-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #475569; }
    .int-item mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .text-green { color: #2e7d32; }
    .text-amber { color: #e65100; }
    .text-red { color: #c62828; }

    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    @media (max-width: 900px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
    .kpi-card { background: white; border: 1px solid #e8ecf1; border-radius: 12px; padding: 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 1px 3px rgba(15,43,70,0.04); }
    .kpi-icon-wrap { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .kpi-icon-wrap.icon-blue { background: #e3f2fd; color: #1565c0; }
    .kpi-icon-wrap.icon-green { background: #e8f5e9; color: #2e7d32; }
    .kpi-icon-wrap.icon-red { background: #ffebee; color: #c62828; }
    .kpi-icon-wrap.icon-teal { background: #e0f2f1; color: #00695c; }
    .kpi-icon-wrap mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .kpi-content { min-width: 0; }
    .kpi-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-value { font-size: 20px; font-weight: 700; color: #1e293b; font-family: 'SF Mono', ui-monospace, monospace; }
    .kpi-sub { font-size: 11px; color: #94a3b8; }

    .card-container { background: white; border: 1px solid #e8ecf1; border-radius: 12px; box-shadow: 0 1px 3px rgba(15,43,70,0.04); margin-bottom: 16px; overflow: hidden; }
    .card-title-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e8ecf1; }
    .card-title-bar h2 { font-size: 15px; font-weight: 600; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 8px; }
    .card-title-bar h2 mat-icon { font-size: 20px; width: 20px; height: 20px; color: #42a5f5; }
    .card-body { padding: 20px; overflow-x: auto; }
    .record-count { font-size: 12px; color: #94a3b8; background: #f1f5f9; padding: 4px 10px; border-radius: 12px; }

    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th { padding: 10px 12px; text-align: left; font-weight: 600; color: #64748b; border-bottom: 2px solid #e8ecf1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .data-table tr:hover { background: #f8fafc; }
    .total-row { background: #f8fafc; border-top: 2px solid #e8ecf1; }
    .text-right { text-align: right !important; }
    .fw-600 { font-weight: 600; }
    .mono { font-family: 'SF Mono', ui-monospace, monospace; font-size: 12px; }

    .svc-badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .svc-water { background: #e3f2fd; color: #1565c0; }
    .svc-electricity { background: #fff8e1; color: #e65100; }
    .svc-sanitation { background: #e0f2f1; color: #00695c; }
    .svc-refuse { background: #fce4ec; color: #c62828; }
    .svc-propertyrates { background: #f3e5f5; color: #6a1b9a; }
    .scoa-tag { background: #e3f2fd; color: #1565c0; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; font-family: monospace; }

    .variance-flag { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; font-family: monospace; }
    .var-high { background: #ffebee; color: #c62828; }
    .var-med { background: #fff3e0; color: #e65100; }
    .var-low { background: #e8f5e9; color: #2e7d32; }

    .empty-page { text-align: center; padding: 80px 24px; color: #94a3b8; }
    .empty-page mat-icon { font-size: 48px; width: 48px; height: 48px; color: #cbd5e1; }
    .empty-page h2 { font-size: 18px; color: #64748b; margin: 12px 0 8px; }
    .empty-page p { font-size: 14px; margin: 0; }

    .dialog-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .dialog-panel { background: white; border-radius: 16px; width: 550px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
    .dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e8ecf1; }
    .dialog-header h2 { margin: 0; font-size: 18px; font-weight: 600; color: #1e293b; }
    .dialog-body { padding: 24px; }
    .dialog-desc { font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 16px; }
    .dialog-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #e8ecf1; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-group input, .form-group select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #1e293b; outline: none; }
    .gen-result { display: flex; gap: 12px; margin-top: 16px; padding: 14px; background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 10px; }
    .gen-result p { margin: 0; font-size: 13px; color: #1e293b; }
    .warning-text { color: #e65100 !important; font-size: 12px !important; }
  `]
})
export class DraftBudgetPage implements OnInit {
  draftBudget: DraftRevenueBudget | null = null;
  integrationStatus: BillingIntegrationStatus | null = null;
  billingStrings: any[] = [];
  budgetVersions: BudgetVersionSummary[] = [];
  showGenerateDialog = false;
  generating = false;
  generateResult: any = null;
  generateForm: any = { budgetVersionId: 1, financialYearId: 1 };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.api.getDraftRevenueBudget().subscribe(data => { this.draftBudget = data; this.cdr.markForCheck(); });
    this.api.getBillingIntegrationStatus().subscribe(data => { this.integrationStatus = data; this.cdr.markForCheck(); });
    this.api.getBillingBudgetStrings().subscribe(data => { this.billingStrings = data; this.cdr.markForCheck(); });
    this.api.getBudgetVersions().subscribe(data => { this.budgetVersions = data; if (data.length) this.generateForm.budgetVersionId = data[0].id; this.cdr.markForCheck(); });
  }

  generateStrings() {
    this.generating = true;
    this.generateResult = null;
    this.api.generateBillingBudgetStrings(this.generateForm).subscribe({
      next: (result) => { this.generating = false; this.generateResult = result; this.loadData(); },
      error: () => { this.generating = false; this.cdr.markForCheck(); }
    });
  }

  getVariance(line: any): number {
    if (!line.year1Amount || !line.year2Amount) return 0;
    return ((line.year2Amount - line.year1Amount) / line.year1Amount) * 100;
  }

  formatCurrency(v: number): string {
    if (!v) return 'R 0';
    const abs = Math.abs(v); const sign = v < 0 ? '-' : '';
    if (abs >= 1e9) return sign + 'R ' + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return sign + 'R ' + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return sign + 'R ' + (abs / 1e3).toFixed(0) + 'K';
    return sign + 'R ' + abs.toFixed(0);
  }
}
