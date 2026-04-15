import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../core/services/api.service';
import { BudgetVersionSummary, BudgetOverview, MtrefSummary } from '../../core/models/budget.models';

@Component({
  selector: 'app-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatTabsModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Reports & Schedules</h1>
        <p class="subtitle">NT-aligned budget reports, MTREF summaries, and Schedule A exports</p>
      </div>
    </div>

    <div class="filters-bar">
      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Budget Version</mat-label>
        <mat-select [(ngModel)]="selectedVersionId" (selectionChange)="loadReports()">
          <mat-option *ngFor="let v of versions" [value]="v.id">{{v.versionName}}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <mat-tab-group class="report-tabs" animationDuration="200ms">
      <mat-tab label="Budget Overview">
        <div class="tab-content" *ngIf="overview">
          <div class="overview-header">
            <div class="overview-card">
              <div class="ov-label">Total Revenue</div>
              <div class="ov-value revenue">{{formatCurrency(overview.totalRevenue)}}</div>
            </div>
            <div class="overview-card">
              <div class="ov-label">Total Expenditure</div>
              <div class="ov-value expenditure">{{formatCurrency(overview.totalExpenditure)}}</div>
            </div>
            <div class="overview-card">
              <div class="ov-label">Capital Budget</div>
              <div class="ov-value capital">{{formatCurrency(overview.totalCapital)}}</div>
            </div>
            <div class="overview-card">
              <div class="ov-label">Net Surplus/Deficit</div>
              <div class="ov-value" [class.positive]="overview.netSurplusDeficit >= 0" [class.negative]="overview.netSurplusDeficit < 0">
                {{formatCurrency(overview.netSurplusDeficit)}}
              </div>
            </div>
          </div>

          <div class="card-container">
            <div class="card-title-bar">
              <h2><mat-icon>pie_chart</mat-icon> By Item Classification</h2>
            </div>
            <div class="table-wrap">
              <table class="data-table" *ngIf="overview.byItem.length > 0">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Description</th>
                    <th class="text-right">Year 1</th>
                    <th class="text-right">Year 2</th>
                    <th class="text-right">Year 3</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of overview.byItem">
                    <td><span class="mscoa-tag">{{item.code}}</span></td>
                    <td>{{item.description}}</td>
                    <td class="text-right value-cell">{{formatCurrency(item.year1)}}</td>
                    <td class="text-right value-cell">{{formatCurrency(item.year2)}}</td>
                    <td class="text-right value-cell">{{formatCurrency(item.year3)}}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card-container">
            <div class="card-title-bar">
              <h2><mat-icon>account_balance</mat-icon> By Fund Classification</h2>
            </div>
            <div class="table-wrap">
              <table class="data-table" *ngIf="overview.byFund.length > 0">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Description</th>
                    <th class="text-right">Year 1</th>
                    <th class="text-right">Year 2</th>
                    <th class="text-right">Year 3</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let f of overview.byFund">
                    <td><span class="mscoa-tag">{{f.code}}</span></td>
                    <td>{{f.description}}</td>
                    <td class="text-right value-cell">{{formatCurrency(f.year1)}}</td>
                    <td class="text-right value-cell">{{formatCurrency(f.year2)}}</td>
                    <td class="text-right value-cell">{{formatCurrency(f.year3)}}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="empty-state" *ngIf="!overview">
          <mat-icon class="empty-icon">assessment</mat-icon>
          <p>Select a budget version to view the overview.</p>
        </div>
      </mat-tab>

      <mat-tab label="MTREF Summary">
        <div class="tab-content">
          <div class="card-container" *ngIf="mtref.length > 0">
            <div class="card-title-bar">
              <h2><mat-icon>table_chart</mat-icon> Medium Term Revenue & Expenditure Framework</h2>
              <button class="btn-outline" (click)="exportMtref()"><mat-icon>download</mat-icon> Export CSV</button>
            </div>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Sub-Category</th>
                    <th class="text-right">Year 1</th>
                    <th class="text-right">Year 2</th>
                    <th class="text-right">Year 3</th>
                    <th class="text-right">Y1 Var %</th>
                    <th class="text-right">Y2 Var %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of mtref" [class.category-row]="!row.subCategory">
                    <td class="cat-cell">{{row.category}}</td>
                    <td>{{row.subCategory || '\u2014'}}</td>
                    <td class="text-right value-cell">{{formatCurrency(row.year1)}}</td>
                    <td class="text-right value-cell">{{formatCurrency(row.year2)}}</td>
                    <td class="text-right value-cell">{{formatCurrency(row.year3)}}</td>
                    <td class="text-right" [class.positive]="row.year1Variance >= 0" [class.negative]="row.year1Variance < 0">
                      {{row.year1Variance | number:'1.1-1'}}%
                    </td>
                    <td class="text-right" [class.positive]="row.year2Variance >= 0" [class.negative]="row.year2Variance < 0">
                      {{row.year2Variance | number:'1.1-1'}}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="empty-state" *ngIf="mtref.length === 0">
            <mat-icon class="empty-icon">table_chart</mat-icon>
            <p>Select a budget version to view MTREF summary.</p>
          </div>
        </div>
      </mat-tab>

      <mat-tab label="Schedule A">
        <div class="tab-content">
          <div class="card-container">
            <div class="card-title-bar">
              <h2><mat-icon>description</mat-icon> NT Schedule A \u2014 Statement of Financial Performance</h2>
              <button class="btn-outline" (click)="printScheduleA()"><mat-icon>print</mat-icon> Print</button>
            </div>
            <div class="schedule-content">
              <div class="schedule-header">
                <h3>Demo Municipality</h3>
                <p>Statement of Financial Performance for the year ending 30 June 2026</p>
                <p class="schedule-note">Budget Year +1 and Year +2 (Medium Term Revenue and Expenditure Framework)</p>
              </div>
              <div *ngIf="scheduleA" class="schedule-table-wrap">
                <table class="schedule-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th class="text-right">Budget Year 2025/26</th>
                      <th class="text-right">Budget Year +1</th>
                      <th class="text-right">Budget Year +2</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="section-header"><td colspan="4">Revenue by Source</td></tr>
                    <ng-container *ngFor="let line of scheduleA.lines">
                      <tr *ngIf="line.category === 'Revenue'">
                        <td class="indent">{{line.description}}</td>
                        <td class="text-right value-cell">{{formatCurrency(line.year1)}}</td>
                        <td class="text-right value-cell">{{formatCurrency(line.year2)}}</td>
                        <td class="text-right value-cell">{{formatCurrency(line.year3)}}</td>
                      </tr>
                    </ng-container>
                    <tr class="total-row">
                      <td>Total Revenue</td>
                      <td class="text-right value-cell">{{formatCurrency(scheduleA.totalRevenue)}}</td>
                      <td class="text-right value-cell">{{formatCurrency(scheduleA.totalRevenueYear2)}}</td>
                      <td class="text-right value-cell">{{formatCurrency(scheduleA.totalRevenueYear3)}}</td>
                    </tr>
                    <tr class="section-header"><td colspan="4">Expenditure by Type</td></tr>
                    <ng-container *ngFor="let line of scheduleA.lines">
                      <tr *ngIf="line.category === 'Expenditure'">
                        <td class="indent">{{line.description}}</td>
                        <td class="text-right value-cell">{{formatCurrency(line.year1)}}</td>
                        <td class="text-right value-cell">{{formatCurrency(line.year2)}}</td>
                        <td class="text-right value-cell">{{formatCurrency(line.year3)}}</td>
                      </tr>
                    </ng-container>
                    <tr class="total-row">
                      <td>Total Expenditure</td>
                      <td class="text-right value-cell">{{formatCurrency(scheduleA.totalExpenditure)}}</td>
                      <td class="text-right value-cell">{{formatCurrency(scheduleA.totalExpenditureYear2)}}</td>
                      <td class="text-right value-cell">{{formatCurrency(scheduleA.totalExpenditureYear3)}}</td>
                    </tr>
                    <tr class="grand-total-row">
                      <td>Net Surplus / (Deficit)</td>
                      <td class="text-right value-cell" [class.positive]="scheduleA.netSurplusDeficit >= 0" [class.negative]="scheduleA.netSurplusDeficit < 0">
                        {{formatCurrency(scheduleA.netSurplusDeficit)}}
                      </td>
                      <td class="text-right value-cell" [class.positive]="scheduleA.netSurplusDeficitYear2 >= 0" [class.negative]="scheduleA.netSurplusDeficitYear2 < 0">
                        {{formatCurrency(scheduleA.netSurplusDeficitYear2)}}
                      </td>
                      <td class="text-right value-cell" [class.positive]="scheduleA.netSurplusDeficitYear3 >= 0" [class.negative]="scheduleA.netSurplusDeficitYear3 < 0">
                        {{formatCurrency(scheduleA.netSurplusDeficitYear3)}}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="schedule-notice" *ngIf="!scheduleA">
                <p>Select a budget version above to generate Schedule A.</p>
              </div>
            </div>
          </div>
        </div>
      </mat-tab>

      <mat-tab label="Budget vs Actual">
        <div class="tab-content">
          <div class="card-container" *ngIf="budgetVsActual.length > 0">
            <div class="card-title-bar">
              <h2><mat-icon>compare_arrows</mat-icon> Budget vs Actual Comparison</h2>
              <button class="btn-outline" (click)="exportBva()"><mat-icon>download</mat-icon> Export CSV</button>
            </div>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Segment</th>
                    <th class="text-right">Budget</th>
                    <th class="text-right">Actual</th>
                    <th class="text-right">Variance</th>
                    <th class="text-right">Var %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of budgetVsActual">
                    <td><span class="chip" [ngClass]="row.category === 'Revenue' ? 'chip-green' : 'chip-red'">{{row.category}}</span></td>
                    <td>{{row.segmentString}}</td>
                    <td class="text-right value-cell">{{formatCurrency(row.budgetAmount)}}</td>
                    <td class="text-right value-cell">{{formatCurrency(row.actualAmount)}}</td>
                    <td class="text-right value-cell" [class.positive]="row.variance >= 0" [class.negative]="row.variance < 0">{{formatCurrency(row.variance)}}</td>
                    <td class="text-right" [class.positive]="row.variancePercentage >= 0" [class.negative]="row.variancePercentage < 0">
                      {{row.variancePercentage | number:'1.1-1'}}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="empty-state" *ngIf="budgetVsActual.length === 0">
            <mat-icon class="empty-icon">compare_arrows</mat-icon>
            <p>Select a budget version to view Budget vs Actual.</p>
          </div>
        </div>
      </mat-tab>

      <mat-tab label="Virement Register">
        <div class="tab-content">
          <div class="card-container" *ngIf="virementRegister.length > 0">
            <div class="card-title-bar">
              <h2><mat-icon>swap_horiz</mat-icon> Virement Register</h2>
            </div>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Version</th>
                    <th>From</th>
                    <th>To</th>
                    <th class="text-right">Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let v of virementRegister">
                    <td class="ref-cell">{{v.virementNumber}}</td>
                    <td>{{v.budgetVersionName}}</td>
                    <td><span class="mscoa-tag">{{v.fromSegment}}</span></td>
                    <td><span class="mscoa-tag">{{v.toSegment}}</span></td>
                    <td class="text-right value-cell">{{formatCurrency(v.amount)}}</td>
                    <td><span class="status-badge" [ngClass]="'status-' + v.status.toLowerCase()">{{v.status}}</span></td>
                    <td class="date-cell">{{v.createdOn | date:'mediumDate'}}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="empty-state" *ngIf="virementRegister.length === 0">
            <mat-icon class="empty-icon">swap_horiz</mat-icon>
            <p>No virements recorded for this version.</p>
          </div>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { font-size: 28px; font-weight: 700; color: #1e293b; margin: 0; }
    .subtitle { font-size: 14px; color: #64748b; margin: 4px 0 0; }
    .filters-bar { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: white; border: 1px solid #e8ecf1; border-radius: 12px; margin-bottom: 24px; }
    .filter-field { width: 280px; }
    ::ng-deep .filters-bar .mat-mdc-form-field-subscript-wrapper { display: none; }
    ::ng-deep .report-tabs .mat-mdc-tab-header { background: white; border: 1px solid #e8ecf1; border-radius: 12px 12px 0 0; }
    .tab-content { padding: 24px 0; }
    .overview-header { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .overview-card { padding: 20px; background: white; border: 1px solid #e8ecf1; border-radius: 12px; text-align: center; }
    .ov-label { font-size: 12px; color: #64748b; margin-bottom: 6px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.3px; }
    .ov-value { font-size: 22px; font-weight: 700; font-family: 'SF Mono', ui-monospace, monospace; }
    .ov-value.revenue { color: #2e7d32; }
    .ov-value.expenditure { color: #ef5350; }
    .ov-value.capital { color: #6a1b9a; }
    .positive { color: #2e7d32; }
    .negative { color: #ef5350; }
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; border-bottom: 1px solid #e8ecf1; background: #f8fafc; }
    .data-table td { padding: 12px 16px; font-size: 13px; color: #1e293b; border-bottom: 1px solid #f1f5f9; }
    .data-table tr:hover td { background: #f8fafc; }
    .text-right { text-align: right !important; }
    .category-row { background: #f8fafc; font-weight: 600; }
    .cat-cell { font-weight: 600; }
    .btn-outline { display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; background: white; color: #334155; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12px; cursor: pointer; }
    .btn-outline:hover { background: #f8fafc; }
    .schedule-content { padding: 24px; }
    .schedule-header { text-align: center; margin-bottom: 24px; }
    .schedule-header h3 { font-size: 18px; font-weight: 700; color: #0f2b46; margin: 0 0 4px; }
    .schedule-header p { font-size: 14px; color: #334155; margin: 2px 0; }
    .schedule-note { font-size: 12px; color: #64748b; font-style: italic; }
    .schedule-notice { text-align: center; padding: 32px; color: #64748b; }
    .schedule-table { width: 100%; border-collapse: collapse; }
    .schedule-table th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #0f2b46; }
    .schedule-table td { padding: 10px 16px; font-size: 13px; border-bottom: 1px solid #e8ecf1; }
    .section-header td { font-weight: 700; color: #0f2b46; background: #f1f5f9; font-size: 13px; }
    .total-row td { font-weight: 700; border-top: 2px solid #0f2b46; }
    .grand-total-row td { font-weight: 700; border-top: 3px double #0f2b46; border-bottom: 3px double #0f2b46; font-size: 15px; }
    .indent { padding-left: 32px !important; }
    .empty-state { text-align: center; padding: 48px 16px; color: #64748b; }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; color: #cbd5e1; }
    @media (max-width: 900px) { .overview-header { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class ReportsPage implements OnInit {
  versions: BudgetVersionSummary[] = [];
  selectedVersionId: number | null = null;
  overview: BudgetOverview | null = null;
  mtref: MtrefSummary[] = [];
  scheduleA: any = null;
  budgetVsActual: any[] = [];
  virementRegister: any[] = [];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.api.getBudgetVersions().subscribe(v => {
      this.versions = v;
      if (v.length > 0) {
        this.selectedVersionId = v[0].id;
        this.loadReports();
      }
      this.cdr.markForCheck();
    });
  }

  loadReports() {
    if (!this.selectedVersionId) return;
    this.api.getBudgetOverview(this.selectedVersionId).subscribe({
      next: o => { this.overview = o; this.cdr.markForCheck(); },
      error: () => { this.overview = null; this.cdr.markForCheck(); }
    });
    this.api.getMtrefSummary(this.selectedVersionId).subscribe({
      next: m => { this.mtref = m; this.cdr.markForCheck(); },
      error: () => { this.mtref = []; this.cdr.markForCheck(); }
    });
    this.api.getScheduleA(this.selectedVersionId).subscribe({
      next: s => { this.scheduleA = s; this.cdr.markForCheck(); },
      error: () => { this.scheduleA = null; this.cdr.markForCheck(); }
    });
    this.api.getBudgetVsActual(this.selectedVersionId).subscribe({
      next: b => { this.budgetVsActual = b; this.cdr.markForCheck(); },
      error: () => { this.budgetVsActual = []; this.cdr.markForCheck(); }
    });
    this.api.getVirementRegister(this.selectedVersionId).subscribe({
      next: v => { this.virementRegister = v; this.cdr.markForCheck(); },
      error: () => { this.virementRegister = []; this.cdr.markForCheck(); }
    });
  }

  formatCurrency(v: number): string {
    if (v === null || v === undefined) return 'R 0';
    const prefix = v < 0 ? '-R ' : 'R ';
    return prefix + Math.abs(v).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  exportMtref() {
    const csv = ['Category,Sub-Category,Year 1,Year 2,Year 3,Y1 Var %,Y2 Var %'];
    this.mtref.forEach(r => {
      csv.push(`"${r.category}","${r.subCategory}",${r.year1},${r.year2},${r.year3},${r.year1Variance},${r.year2Variance}`);
    });
    this.downloadCsv(csv.join('\n'), 'mtref_summary.csv');
  }

  exportBva() {
    const csv = ['Category,Segment,Budget,Actual,Variance,Variance %'];
    this.budgetVsActual.forEach(r => {
      csv.push(`"${r.category}","${r.segmentString}",${r.budgetAmount},${r.actualAmount},${r.variance},${r.variancePercentage}`);
    });
    this.downloadCsv(csv.join('\n'), 'budget_vs_actual.csv');
  }

  printScheduleA() {
    window.print();
  }

  private downloadCsv(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
