import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../core/services/api.service';
import { ExpenditureProjection, ExpenditureProjectionSummary } from '../../../core/models/budget.models';

@Component({
  selector: 'app-creditor-projections-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Expenditure Projections</h1>
          <p class="page-subtitle">Monthly and annual expenditure projections with mSCOA mapping (CRB7, CRB8, CRB22, CRB28, CRB37)</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="calculateProjections()">
            <mat-icon>calculate</mat-icon> Calculate Projections
          </button>
          <button class="btn-secondary" (click)="submitAll()">
            <mat-icon>send</mat-icon> Submit All
          </button>
          <button class="btn-primary" (click)="approveAll()">
            <mat-icon>check_circle</mat-icon> Approve All
          </button>
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card" *ngFor="let kpi of kpiCards">
          <div class="kpi-icon-wrap" [ngClass]="kpi.colorClass">
            <mat-icon>{{kpi.icon}}</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">{{kpi.label}}</div>
            <div class="kpi-value">{{kpi.value}}</div>
            <div class="kpi-sub">{{kpi.subtitle}}</div>
          </div>
        </div>
      </div>

      <div class="section-label">SUMMARY BY CATEGORY</div>
      <div class="card-container" *ngIf="summary">
        <div class="card-body" style="padding: 20px">
          <table class="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Type</th>
                <th class="text-right">Gross Expenditure</th>
                <th class="text-right">VAT</th>
                <th class="text-right">Net Expenditure</th>
                <th class="text-right">Year 1</th>
                <th class="text-right">Year 2</th>
                <th class="text-right">Year 3</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of summary.byCategory">
                <td class="fw-600">{{c.expenditureCategoryName}}</td>
                <td><span class="type-pill">{{c.expenditureCategoryType}}</span></td>
                <td class="text-right mono">R {{c.grossExpenditure | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{c.vatAmount | number:'1.0-0'}}</td>
                <td class="text-right mono fw-600">R {{c.netExpenditure | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{c.year1Amount | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{c.year2Amount | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{c.year3Amount | number:'1.0-0'}}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td class="fw-600" colspan="2">TOTAL</td>
                <td class="text-right mono fw-600">R {{summary.totalGrossExpenditure | number:'1.0-0'}}</td>
                <td class="text-right mono fw-600">R {{summary.totalVatAmount | number:'1.0-0'}}</td>
                <td class="text-right mono fw-600">R {{summary.totalNetExpenditure | number:'1.0-0'}}</td>
                <td class="text-right mono fw-600">R {{summary.year1Total | number:'1.0-0'}}</td>
                <td class="text-right mono fw-600">R {{summary.year2Total | number:'1.0-0'}}</td>
                <td class="text-right mono fw-600">R {{summary.year3Total | number:'1.0-0'}}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div class="section-label">DETAILED PROJECTIONS</div>
      <div class="card-container">
        <div class="card-body" style="padding: 20px">
          <table class="data-table" *ngIf="projections.length">
            <thead>
              <tr>
                <th>Category</th>
                <th>Cost Item</th>
                <th class="text-right">Unit Rate</th>
                <th class="text-right">Basic Cost</th>
                <th class="text-right">Gross</th>
                <th class="text-right">VAT</th>
                <th>mSCOA</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of projections">
                <td class="fw-600">{{p.expenditureCategoryName}}</td>
                <td>{{p.costItemName || '—'}}</td>
                <td class="text-right mono">R {{p.unitRate | number:'1.4-4'}}</td>
                <td class="text-right mono">R {{p.basicCost | number:'1.2-2'}}</td>
                <td class="text-right mono">R {{p.grossExpenditure | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{p.vatAmount | number:'1.0-0'}}</td>
                <td>
                  <span class="mscoa-tag" *ngIf="p.scoaItemCode">{{p.scoaItemCode}}</span>
                  <span class="mscoa-tag" *ngIf="p.scoaFundCode">{{p.scoaFundCode}}</span>
                  <span class="mscoa-tag" *ngIf="p.scoaFunctionCode">{{p.scoaFunctionCode}}</span>
                </td>
                <td><span class="status-badge" [ngClass]="'status-' + p.status.toLowerCase()">{{p.status}}</span></td>
                <td>
                  <button class="btn-icon" (click)="submitProjection(p.id)" *ngIf="p.status === 'Draft'" title="Submit"><mat-icon>send</mat-icon></button>
                  <button class="btn-icon" (click)="approveProjection(p.id)" *ngIf="p.status === 'Submitted'" title="Approve"><mat-icon>check</mat-icon></button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="empty-state" *ngIf="!projections.length">
            <mat-icon>analytics</mat-icon>
            <p>No projections calculated. Click "Calculate Projections" to generate.</p>
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
    .header-actions { display: flex; gap: 8px; }
    .btn-primary { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background: #0f2b46; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { background: #1a3a5c; }
    .btn-primary mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-secondary { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background: white; color: #64748b; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn-secondary:hover { background: #f8fafc; }
    .btn-secondary mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-icon { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; border-radius: 6px; display: flex; align-items: center; }
    .btn-icon:hover { background: #f1f5f9; color: #1e293b; }
    .btn-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .section-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0 8px; }
    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    @media (max-width: 900px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
    .kpi-card { background: white; border: 1px solid #e8ecf1; border-radius: 12px; padding: 16px; display: flex; align-items: flex-start; gap: 12px; box-shadow: 0 1px 3px rgba(15,43,70,0.04); }
    .kpi-icon-wrap { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kpi-icon-wrap.icon-blue { background: #e3f2fd; color: #1565c0; }
    .kpi-icon-wrap.icon-green { background: #e8f5e9; color: #2e7d32; }
    .kpi-icon-wrap.icon-amber { background: #fff8e1; color: #e65100; }
    .kpi-icon-wrap.icon-teal { background: #e0f2f1; color: #00695c; }
    .kpi-icon-wrap mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .kpi-content { min-width: 0; }
    .kpi-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-value { font-size: 20px; font-weight: 700; color: #1e293b; font-family: 'SF Mono', ui-monospace, monospace; }
    .kpi-sub { font-size: 11px; color: #94a3b8; }
    .card-container { background: white; border: 1px solid #e8ecf1; border-radius: 12px; box-shadow: 0 1px 3px rgba(15,43,70,0.04); margin-bottom: 12px; overflow: hidden; }
    .card-body { padding: 0 20px 20px; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th { padding: 10px 12px; text-align: left; font-weight: 600; color: #64748b; border-bottom: 2px solid #e8ecf1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .data-table tr:hover { background: #f8fafc; }
    .total-row { background: #f8fafc; border-top: 2px solid #e8ecf1; }
    .total-row td { border-bottom: none; font-weight: 700; }
    .text-right { text-align: right !important; }
    .fw-600 { font-weight: 600; }
    .mono { font-family: 'SF Mono', ui-monospace, monospace; font-size: 12px; }
    .type-pill { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; background: #f1f5f9; color: #475569; }
    .mscoa-tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: #e3f2fd; color: #1565c0; margin-right: 4px; font-family: monospace; }
    .status-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .status-approved { background: #e8f5e9; color: #1b5e20; }
    .status-draft { background: #f1f5f9; color: #64748b; }
    .status-submitted { background: #fff3e0; color: #e65100; }
    .empty-state { text-align: center; padding: 30px; color: #94a3b8; }
    .empty-state mat-icon { font-size: 32px; width: 32px; height: 32px; color: #cbd5e1; }
    .empty-state p { margin: 8px 0 0; font-size: 13px; }
  `]
})
export class CreditorProjectionsPage implements OnInit {
  projections: ExpenditureProjection[] = [];
  summary: ExpenditureProjectionSummary | null = null;
  kpiCards: any[] = [];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.api.getExpenditureProjections().subscribe(data => { this.projections = data; this.buildKpis(); this.cdr.markForCheck(); });
    this.api.getExpenditureProjectionSummary().subscribe(data => { this.summary = data; this.buildKpis(); this.cdr.markForCheck(); });
  }

  buildKpis() {
    const approved = this.projections.filter(p => p.status === 'Approved').length;
    this.kpiCards = [
      { icon: 'analytics', label: 'Total Projections', value: this.projections.length.toString(), subtitle: 'Cost item projections', colorClass: 'icon-blue' },
      { icon: 'attach_money', label: 'Gross Expenditure', value: 'R ' + ((this.summary?.totalGrossExpenditure || 0) / 1000000).toFixed(1) + 'M', subtitle: 'Year 1 total', colorClass: 'icon-amber' },
      { icon: 'receipt', label: 'VAT Amount', value: 'R ' + ((this.summary?.totalVatAmount || 0) / 1000000).toFixed(1) + 'M', subtitle: 'Total VAT liability', colorClass: 'icon-green' },
      { icon: 'verified', label: 'Approved', value: approved + '/' + this.projections.length, subtitle: 'Approval status', colorClass: 'icon-teal' },
    ];
  }

  calculateProjections() {
    this.api.calculateExpenditureProjections({ financialYearId: 1, growthRateY2: 5.2, growthRateY3: 4.8 }).subscribe(() => this.loadData());
  }

  submitProjection(id: number) {
    this.api.submitExpenditureProjection(id).subscribe(() => this.loadData());
  }

  approveProjection(id: number) {
    this.api.approveExpenditureProjection(id).subscribe(() => this.loadData());
  }

  submitAll() {
    this.api.submitAllExpenditureProjections(1).subscribe(() => this.loadData());
  }

  approveAll() {
    this.api.approveAllExpenditureProjections(1).subscribe(() => this.loadData());
  }
}
