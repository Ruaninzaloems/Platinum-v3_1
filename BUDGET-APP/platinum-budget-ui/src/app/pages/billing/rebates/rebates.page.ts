import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../services/api.service';
import { RebateType, RebateProjection, ServiceCategory } from '../../../models/budget.models';

@Component({
  selector: 'app-rebates-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Rebate Management</h1>
          <p class="page-subtitle">Manage rebate types and projections (BILB23, BILB24, BILB30, BILB32, BILB38)</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="showCalcDialog = true">
            <mat-icon>calculate</mat-icon> Calculate Rebates
          </button>
          <button class="btn-primary" (click)="showCreateDialog = true">
            <mat-icon>add</mat-icon> New Rebate Type
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

      <div class="card-container">
        <div class="card-title-bar"><h2><mat-icon>discount</mat-icon> Rebate Types</h2></div>
        <div class="card-body" *ngIf="rebateTypes.length; else noTypes">
          <table class="data-table">
            <thead>
              <tr>
                <th>Rebate Name</th>
                <th>Category</th>
                <th>Service</th>
                <th class="text-right">Rebate %</th>
                <th class="text-right">Fixed Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of rebateTypes">
                <td class="fw-600">{{r.name}}</td>
                <td><span class="cat-badge" [ngClass]="'cat-' + r.category.toLowerCase()">{{r.category}}</span></td>
                <td>{{r.serviceCategoryName || 'All Services'}}</td>
                <td class="text-right mono">{{r.rebatePercent | number:'1.1-1'}}%</td>
                <td class="text-right mono">{{r.fixedAmount ? 'R ' + (r.fixedAmount | number:'1.2-2') : '-'}}</td>
                <td><span class="status-badge" [ngClass]="r.isActive ? 'status-approved' : 'status-draft'">{{r.isActive ? 'Active' : 'Inactive'}}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #noTypes><div class="empty-state"><mat-icon>info_outline</mat-icon><p>No rebate types defined</p></div></ng-template>
      </div>

      <div class="card-container">
        <div class="card-title-bar">
          <h2><mat-icon>analytics</mat-icon> Rebate Projections</h2>
          <span class="record-count">{{rebateProjections.length}} projections</span>
        </div>
        <div class="card-body" *ngIf="rebateProjections.length; else noProjections">
          <table class="data-table">
            <thead>
              <tr>
                <th>Rebate Type</th>
                <th>Category</th>
                <th>Service</th>
                <th class="text-right">Eligible</th>
                <th class="text-right">Uptake %</th>
                <th class="text-right">Year 1</th>
                <th class="text-right">Year 2</th>
                <th class="text-right">Year 3</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let rp of rebateProjections">
                <td class="fw-600">{{rp.rebateTypeName}}</td>
                <td><span class="cat-badge" [ngClass]="'cat-' + rp.rebateCategory.toLowerCase()">{{rp.rebateCategory}}</span></td>
                <td>{{rp.serviceCategoryName || 'All'}}</td>
                <td class="text-right mono">{{rp.eligibleCount | number}}</td>
                <td class="text-right mono">{{rp.projectedUptakePercent | number:'1.0-0'}}%</td>
                <td class="text-right mono">{{formatCurrency(rp.year1Amount)}}</td>
                <td class="text-right mono">{{formatCurrency(rp.year2Amount)}}</td>
                <td class="text-right mono">{{formatCurrency(rp.year3Amount)}}</td>
                <td><span class="status-badge" [ngClass]="'status-' + rp.status.toLowerCase()">{{rp.status}}</span></td>
                <td>
                  <div class="action-btns">
                    <button class="btn-icon" *ngIf="rp.status === 'Draft'" (click)="submitProjection(rp.id)" title="Submit"><mat-icon>send</mat-icon></button>
                    <button class="btn-icon" *ngIf="rp.status === 'Submitted'" (click)="approveProjection(rp.id)" title="Approve"><mat-icon>check_circle</mat-icon></button>
                  </div>
                </td>
              </tr>
              <tr class="total-row">
                <td class="fw-600" colspan="5">TOTAL</td>
                <td class="text-right mono fw-600">{{formatCurrency(totalY1)}}</td>
                <td class="text-right mono fw-600">{{formatCurrency(totalY2)}}</td>
                <td class="text-right mono fw-600">{{formatCurrency(totalY3)}}</td>
                <td colspan="2"></td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #noProjections><div class="empty-state"><mat-icon>info_outline</mat-icon><p>No rebate projections. Click "Calculate Rebates" to generate.</p></div></ng-template>
      </div>

      <div class="dialog-overlay" *ngIf="showCreateDialog" (click)="showCreateDialog = false">
        <div class="dialog-panel" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2>New Rebate Type</h2>
            <button class="btn-icon" (click)="showCreateDialog = false"><mat-icon>close</mat-icon></button>
          </div>
          <div class="dialog-body">
            <div class="form-grid">
              <div class="form-group full-width"><label>Name</label><input [(ngModel)]="createForm.name" placeholder="e.g. Indigent Subsidy - Water"></div>
              <div class="form-group">
                <label>Category</label>
                <select [(ngModel)]="createForm.category">
                  <option value="Indigent">Indigent</option>
                  <option value="SeniorCitizen">Senior Citizen</option>
                  <option value="EarlyPayment">Early Payment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label>Service (optional)</label>
                <select [(ngModel)]="createForm.serviceCategoryId">
                  <option [ngValue]="null">All Services</option>
                  <option *ngFor="let s of serviceCategories" [ngValue]="s.id">{{s.name}}</option>
                </select>
              </div>
              <div class="form-group"><label>Rebate %</label><input type="number" [(ngModel)]="createForm.rebatePercent" step="0.1"></div>
              <div class="form-group"><label>Fixed Amount (R)</label><input type="number" [(ngModel)]="createForm.fixedAmount" step="0.01" placeholder="Optional"></div>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn-secondary" (click)="showCreateDialog = false">Cancel</button>
            <button class="btn-primary" (click)="createRebateType()" [disabled]="saving">{{saving ? 'Creating...' : 'Create'}}</button>
          </div>
        </div>
      </div>

      <div class="dialog-overlay" *ngIf="showCalcDialog" (click)="showCalcDialog = false">
        <div class="dialog-panel" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2>Calculate Rebate Projections</h2>
            <button class="btn-icon" (click)="showCalcDialog = false"><mat-icon>close</mat-icon></button>
          </div>
          <div class="dialog-body">
            <div class="form-grid">
              <div class="form-group"><label>Financial Year ID</label><input type="number" [(ngModel)]="calcForm.financialYearId" value="1"></div>
              <div class="form-group"><label>Y2 Growth %</label><input type="number" [(ngModel)]="calcForm.growthRateY2" step="0.1"></div>
              <div class="form-group"><label>Y3 Growth %</label><input type="number" [(ngModel)]="calcForm.growthRateY3" step="0.1"></div>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn-secondary" (click)="showCalcDialog = false">Cancel</button>
            <button class="btn-primary" (click)="calculateRebates()" [disabled]="calculating">{{calculating ? 'Calculating...' : 'Calculate'}}</button>
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
    .header-actions { display: flex; gap: 10px; }
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
    .kpi-icon-wrap.icon-amber { background: #fff8e1; color: #e65100; }
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
    .data-table th { padding: 10px 12px; text-align: left; font-weight: 600; color: #64748b; border-bottom: 2px solid #e8ecf1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .data-table tr:hover { background: #f8fafc; }
    .total-row { background: #f8fafc; border-top: 2px solid #e8ecf1; }
    .text-right { text-align: right !important; }
    .fw-600 { font-weight: 600; }
    .mono { font-family: 'SF Mono', ui-monospace, monospace; font-size: 12px; }
    .cat-badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .cat-indigent { background: #fff3e0; color: #e65100; }
    .cat-seniorcitizen { background: #e3f2fd; color: #1565c0; }
    .cat-earlypayment { background: #e8f5e9; color: #2e7d32; }
    .cat-other { background: #f1f5f9; color: #64748b; }
    .status-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .status-draft { background: #f1f5f9; color: #64748b; }
    .status-submitted { background: #fff3e0; color: #e65100; }
    .status-approved { background: #e8f5e9; color: #1b5e20; }
    .action-btns { display: flex; gap: 4px; }

    .empty-state { text-align: center; padding: 30px; color: #94a3b8; }
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
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-group input, .form-group select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #1e293b; outline: none; }
    .form-group input:focus, .form-group select:focus { border-color: #0f2b46; }
  `]
})
export class RebatesPage implements OnInit {
  rebateTypes: RebateType[] = [];
  rebateProjections: RebateProjection[] = [];
  serviceCategories: ServiceCategory[] = [];
  kpiCards: any[] = [];
  totalY1 = 0; totalY2 = 0; totalY3 = 0;
  showCreateDialog = false;
  showCalcDialog = false;
  saving = false;
  calculating = false;
  createForm: any = { category: 'Indigent', rebatePercent: 100, serviceCategoryId: null };
  calcForm: any = { financialYearId: 1, growthRateY2: 5.5, growthRateY3: 5.5 };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadData(); this.api.getServiceCategories().subscribe(d => { this.serviceCategories = d; this.cdr.markForCheck(); }); }

  loadData() {
    this.api.getRebateTypes().subscribe(data => { this.rebateTypes = data; this.buildKpis(); this.cdr.markForCheck(); });
    this.api.getRebateProjections().subscribe(data => {
      this.rebateProjections = data;
      this.totalY1 = data.reduce((s, r) => s + r.year1Amount, 0);
      this.totalY2 = data.reduce((s, r) => s + r.year2Amount, 0);
      this.totalY3 = data.reduce((s, r) => s + r.year3Amount, 0);
      this.buildKpis();
      this.cdr.markForCheck();
    });
  }

  buildKpis() {
    const indigent = this.rebateProjections.filter(r => r.rebateCategory === 'Indigent');
    this.kpiCards = [
      { icon: 'discount', label: 'Rebate Types', value: this.rebateTypes.length.toString(), subtitle: 'Active types', colorClass: 'icon-blue' },
      { icon: 'people', label: 'Total Eligible', value: this.formatNum(this.rebateProjections.reduce((s, r) => s + r.eligibleCount, 0)), subtitle: 'All categories', colorClass: 'icon-green' },
      { icon: 'volunteer_activism', label: 'Indigent Rebates', value: this.formatCurrency(indigent.reduce((s, r) => s + r.year1Amount, 0)), subtitle: 'Year 1 total', colorClass: 'icon-amber' },
      { icon: 'account_balance', label: 'Total Rebates Y1', value: this.formatCurrency(this.totalY1), subtitle: 'All categories', colorClass: 'icon-red' },
    ];
  }

  createRebateType() {
    this.saving = true;
    this.api.createRebateType(this.createForm).subscribe({
      next: () => { this.saving = false; this.showCreateDialog = false; this.createForm = { category: 'Indigent', rebatePercent: 100, serviceCategoryId: null }; this.loadData(); },
      error: () => { this.saving = false; this.cdr.markForCheck(); }
    });
  }

  calculateRebates() {
    this.calculating = true;
    this.api.calculateRebateProjections(this.calcForm).subscribe({
      next: () => { this.calculating = false; this.showCalcDialog = false; this.loadData(); },
      error: () => { this.calculating = false; this.cdr.markForCheck(); }
    });
  }

  submitProjection(id: number) { this.api.submitRebateProjection(id).subscribe(() => this.loadData()); }
  approveProjection(id: number) { this.api.approveRebateProjection(id).subscribe(() => this.loadData()); }

  formatCurrency(v: number): string {
    if (!v) return 'R 0';
    const abs = Math.abs(v); const sign = v < 0 ? '-' : '';
    if (abs >= 1e9) return sign + 'R ' + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return sign + 'R ' + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return sign + 'R ' + (abs / 1e3).toFixed(0) + 'K';
    return sign + 'R ' + abs.toFixed(0);
  }

  formatNum(v: number): string {
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
    return v.toString();
  }
}
