import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../core/services/api.service';
import { RevenueProjection, RevenueProjectionSummary, TariffScenarioSummary } from '../../../core/models/budget.models';

@Component({
  selector: 'app-revenue-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Revenue Projections</h1>
          <p class="page-subtitle">Calculate and manage billing revenue projections (BILB9, BILB25-28, BILB34-35)</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="submitAll()" [disabled]="!projections.length">
            <mat-icon>send</mat-icon> Submit All
          </button>
          <button class="btn-secondary" (click)="approveAll()" [disabled]="!projections.length">
            <mat-icon>check_circle</mat-icon> Approve All
          </button>
          <button class="btn-primary" (click)="showCalcDialog = true">
            <mat-icon>calculate</mat-icon> Calculate Projections
          </button>
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card" *ngFor="let kpi of kpiCards">
          <div class="kpi-icon-wrap" [ngClass]="kpi.colorClass"><mat-icon>{{kpi.icon}}</mat-icon></div>
          <div class="kpi-content">
            <div class="kpi-label">{{kpi.label}}</div>
            <div class="kpi-value">{{kpi.value}}</div>
            <div class="kpi-sub">{{kpi.subtitle}}</div>
          </div>
        </div>
      </div>

      <div class="card-container" *ngIf="summary">
        <div class="card-title-bar"><h2><mat-icon>pie_chart</mat-icon> Revenue by Service</h2></div>
        <div class="card-body">
          <table class="data-table">
            <thead>
              <tr>
                <th>Service Category</th>
                <th>Type</th>
                <th class="text-right">Gross Revenue</th>
                <th class="text-right">Rebates</th>
                <th class="text-right">Net Revenue</th>
                <th class="text-right">Year 1</th>
                <th class="text-right">Year 2</th>
                <th class="text-right">Year 3</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of summary.byService">
                <td class="fw-600">{{s.serviceCategoryName}}</td>
                <td><span class="svc-badge" [ngClass]="'svc-' + s.serviceType.toLowerCase()">{{s.serviceType}}</span></td>
                <td class="text-right mono">{{formatCurrency(s.grossRevenue)}}</td>
                <td class="text-right mono text-red">-{{formatCurrency(s.rebateAmount)}}</td>
                <td class="text-right mono fw-600">{{formatCurrency(s.netRevenue)}}</td>
                <td class="text-right mono">{{formatCurrency(s.year1Amount)}}</td>
                <td class="text-right mono">{{formatCurrency(s.year2Amount)}}</td>
                <td class="text-right mono">{{formatCurrency(s.year3Amount)}}</td>
              </tr>
              <tr class="total-row" *ngIf="summary">
                <td class="fw-600" colspan="2">TOTAL</td>
                <td class="text-right mono fw-600">{{formatCurrency(summary.totalGrossRevenue)}}</td>
                <td class="text-right mono text-red fw-600">-{{formatCurrency(summary.totalRebateAmount)}}</td>
                <td class="text-right mono fw-600">{{formatCurrency(summary.totalNetRevenue)}}</td>
                <td class="text-right mono fw-600">{{formatCurrency(summary.year1Total)}}</td>
                <td class="text-right mono fw-600">{{formatCurrency(summary.year2Total)}}</td>
                <td class="text-right mono fw-600">{{formatCurrency(summary.year3Total)}}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card-container">
        <div class="card-title-bar">
          <h2><mat-icon>view_list</mat-icon> Detailed Projections</h2>
          <span class="record-count">{{projections.length}} records</span>
        </div>
        <div class="card-body" *ngIf="projections.length; else noData">
          <table class="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Consumer Category</th>
                <th class="text-right">Consumers</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Gross Revenue</th>
                <th class="text-right">Rebate</th>
                <th class="text-right">Net Revenue</th>
                <th>mSCOA</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of projections" (click)="toggleExpand(p.id)">
                <td class="fw-600">{{p.serviceCategoryName}}</td>
                <td>{{p.consumerCategoryName || 'All'}}</td>
                <td class="text-right mono">{{p.consumerCount | number}}</td>
                <td class="text-right mono">R {{p.tariffRate | number:'1.4-4'}}</td>
                <td class="text-right mono">{{formatCurrency(p.grossRevenue)}}</td>
                <td class="text-right mono text-red">-{{formatCurrency(p.rebateAmount)}}</td>
                <td class="text-right mono fw-600">{{formatCurrency(p.netRevenue)}}</td>
                <td>
                  <div class="scoa-tags">
                    <span class="scoa-tag" *ngIf="p.scoaItemCode">{{p.scoaItemCode}}</span>
                    <span class="scoa-tag" *ngIf="p.scoaFundCode">{{p.scoaFundCode}}</span>
                    <span class="scoa-tag" *ngIf="p.scoaFunctionCode">{{p.scoaFunctionCode}}</span>
                  </div>
                </td>
                <td><span class="status-badge" [ngClass]="'status-' + p.status.toLowerCase()">{{p.status}}</span></td>
                <td>
                  <div class="action-btns">
                    <button class="btn-icon" *ngIf="p.status === 'Draft'" (click)="submitProjection(p.id); $event.stopPropagation()" title="Submit"><mat-icon>send</mat-icon></button>
                    <button class="btn-icon" *ngIf="p.status === 'Submitted'" (click)="approveProjection(p.id); $event.stopPropagation()" title="Approve"><mat-icon>check_circle</mat-icon></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="monthly-expand" *ngIf="expandedId">
            <h3>Monthly Cash Flow - Year 1</h3>
            <div class="monthly-grid">
              <div class="month-cell" *ngFor="let m of getMonthlyData()">
                <div class="month-label">{{m.label}}</div>
                <div class="month-bar-wrap">
                  <div class="month-bar" [style.height.%]="m.pct"></div>
                </div>
                <div class="month-amount mono">{{formatCurrency(m.amount)}}</div>
              </div>
            </div>
          </div>
        </div>
        <ng-template #noData><div class="empty-state"><mat-icon>info_outline</mat-icon><p>No revenue projections. Click "Calculate Projections" to generate.</p></div></ng-template>
      </div>

      <div class="dialog-overlay" *ngIf="showCalcDialog" (click)="showCalcDialog = false">
        <div class="dialog-panel" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2>Calculate Revenue Projections</h2>
            <button class="btn-icon" (click)="showCalcDialog = false"><mat-icon>close</mat-icon></button>
          </div>
          <div class="dialog-body">
            <div class="form-grid">
              <div class="form-group"><label>Financial Year ID</label><input type="number" [(ngModel)]="calcForm.financialYearId" value="1"></div>
              <div class="form-group">
                <label>Tariff Scenario (optional)</label>
                <select [(ngModel)]="calcForm.tariffScenarioId">
                  <option [ngValue]="null">Use Base Tariffs</option>
                  <option *ngFor="let s of scenarios" [ngValue]="s.id">{{s.name}} ({{s.baseIncreasePercentage}}%)</option>
                </select>
              </div>
              <div class="form-group"><label>Y2 Growth Rate %</label><input type="number" [(ngModel)]="calcForm.growthRateY2" step="0.1"></div>
              <div class="form-group"><label>Y3 Growth Rate %</label><input type="number" [(ngModel)]="calcForm.growthRateY3" step="0.1"></div>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn-secondary" (click)="showCalcDialog = false">Cancel</button>
            <button class="btn-primary" (click)="calculateProjections()" [disabled]="calculating">{{calculating ? 'Calculating...' : 'Calculate'}}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 1440px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: #94a3b8; margin: 0; }
    .header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn-primary { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background: #0f2b46; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { background: #1a3a5c; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-secondary { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background: white; color: #64748b; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn-secondary:hover { background: #f8fafc; }
    .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-icon { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; border-radius: 6px; display: flex; align-items: center; }
    .btn-icon:hover { background: #f1f5f9; color: #1e293b; }
    .btn-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }

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
    .data-table tr:hover { background: #f8fafc; cursor: pointer; }
    .total-row { background: #f8fafc; border-top: 2px solid #e8ecf1; }
    .total-row td { border-bottom: none; }
    .text-right { text-align: right !important; }
    .text-red { color: #c62828; }
    .fw-600 { font-weight: 600; }
    .mono { font-family: 'SF Mono', ui-monospace, monospace; font-size: 12px; }

    .svc-badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .svc-water { background: #e3f2fd; color: #1565c0; }
    .svc-electricity { background: #fff8e1; color: #e65100; }
    .svc-sanitation { background: #e0f2f1; color: #00695c; }
    .svc-refuse { background: #fce4ec; color: #c62828; }
    .svc-propertyrates { background: #f3e5f5; color: #6a1b9a; }
    .scoa-tags { display: flex; gap: 4px; flex-wrap: wrap; }
    .scoa-tag { background: #e3f2fd; color: #1565c0; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; font-family: monospace; }
    .status-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .status-draft { background: #f1f5f9; color: #64748b; }
    .status-submitted { background: #fff3e0; color: #e65100; }
    .status-approved { background: #e8f5e9; color: #1b5e20; }
    .action-btns { display: flex; gap: 4px; }

    .monthly-expand { margin-top: 20px; padding: 16px; background: #f8fafc; border: 1px solid #e8ecf1; border-radius: 10px; }
    .monthly-expand h3 { font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 12px; }
    .monthly-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 6px; }
    .month-cell { text-align: center; }
    .month-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }
    .month-bar-wrap { height: 80px; display: flex; align-items: flex-end; justify-content: center; }
    .month-bar { width: 20px; background: linear-gradient(180deg, #0f2b46, #1a5276); border-radius: 3px 3px 0 0; min-height: 4px; transition: height 0.3s; }
    .month-amount { font-size: 9px; margin-top: 4px; }

    .empty-state { text-align: center; padding: 40px; color: #94a3b8; }
    .empty-state mat-icon { font-size: 32px; width: 32px; height: 32px; color: #cbd5e1; }
    .empty-state p { margin: 8px 0 0; font-size: 13px; }
    .dialog-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .dialog-panel { background: white; border-radius: 16px; width: 550px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
    .dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e8ecf1; }
    .dialog-header h2 { margin: 0; font-size: 18px; font-weight: 600; color: #1e293b; }
    .dialog-body { padding: 24px; }
    .dialog-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #e8ecf1; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-group input, .form-group select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #1e293b; outline: none; }
    .form-group input:focus, .form-group select:focus { border-color: #0f2b46; }
  `]
})
export class RevenuePage implements OnInit {
  projections: RevenueProjection[] = [];
  summary: RevenueProjectionSummary | null = null;
  scenarios: TariffScenarioSummary[] = [];
  kpiCards: any[] = [];
  showCalcDialog = false;
  calculating = false;
  expandedId: number | null = null;
  calcForm: any = { financialYearId: 1, tariffScenarioId: null, growthRateY2: 5.5, growthRateY3: 5.5 };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadData(); this.api.getTariffScenarios().subscribe(d => { this.scenarios = d; this.cdr.markForCheck(); }); }

  loadData() {
    this.api.getRevenueProjections().subscribe(data => {
      this.projections = data;
      this.cdr.markForCheck();
    });
    this.api.getRevenueProjectionSummary().subscribe(data => {
      this.summary = data;
      this.buildKpis(data);
      this.cdr.markForCheck();
    });
  }

  buildKpis(s: RevenueProjectionSummary) {
    this.kpiCards = [
      { icon: 'trending_up', label: 'Gross Revenue', value: this.formatCurrency(s.totalGrossRevenue), subtitle: 'Before rebates', colorClass: 'icon-blue' },
      { icon: 'discount', label: 'Total Rebates', value: this.formatCurrency(s.totalRebateAmount), subtitle: 'Indigent + other', colorClass: 'icon-red' },
      { icon: 'account_balance', label: 'Net Revenue', value: this.formatCurrency(s.totalNetRevenue), subtitle: 'After deductions', colorClass: 'icon-green' },
      { icon: 'calendar_today', label: 'MTREF Y3', value: this.formatCurrency(s.year3Total), subtitle: 'Year 3 projection', colorClass: 'icon-teal' },
    ];
  }

  calculateProjections() {
    this.calculating = true;
    this.api.calculateRevenueProjections(this.calcForm).subscribe({
      next: () => { this.calculating = false; this.showCalcDialog = false; this.loadData(); },
      error: () => { this.calculating = false; this.cdr.markForCheck(); }
    });
  }

  submitProjection(id: number) { this.api.submitRevenueProjection(id).subscribe(() => this.loadData()); }
  approveProjection(id: number) { this.api.approveRevenueProjection(id).subscribe(() => this.loadData()); }
  submitAll() { this.api.submitAllRevenueProjections(1).subscribe(() => this.loadData()); }
  approveAll() { this.api.approveAllRevenueProjections(1).subscribe(() => this.loadData()); }

  toggleExpand(id: number) { this.expandedId = this.expandedId === id ? null : id; }

  getMonthlyData(): any[] {
    const p = this.projections.find(x => x.id === this.expandedId);
    if (!p) return [];
    const months = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun'];
    const vals = [p.month01,p.month02,p.month03,p.month04,p.month05,p.month06,p.month07,p.month08,p.month09,p.month10,p.month11,p.month12];
    const max = Math.max(...vals, 1);
    return months.map((label, i) => ({ label, amount: vals[i], pct: (vals[i] / max) * 100 }));
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
