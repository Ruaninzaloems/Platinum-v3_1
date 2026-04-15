import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../core/services/api.service';
import { CreditorLiabilitySummary, CreditorLiabilityItem } from '../../../core/models/budget.models';

@Component({
  selector: 'app-creditor-liabilities-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Creditor Liabilities & Payments</h1>
          <p class="page-subtitle">Generated creditor liability data strings with contra bank accounts (CRB2, CRB3, CRB20, CRB21, CRB31)</p>
        </div>
        <button class="btn-primary" (click)="generateLiabilities()">
          <mat-icon>autorenew</mat-icon> Generate Liabilities
        </button>
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

      <div class="section-label">LIABILITY DATA STRINGS</div>
      <div class="card-container">
        <div class="card-body" style="padding: 20px">
          <table class="data-table" *ngIf="liabilities.length">
            <thead>
              <tr>
                <th>Expenditure Category</th>
                <th>Creditor Category</th>
                <th>Type</th>
                <th class="text-right">Opening Bal</th>
                <th class="text-right">Projected Exp</th>
                <th class="text-right">Projected Pay</th>
                <th class="text-right">Closing Bal</th>
                <th class="text-right">Payment Rate</th>
                <th>Contra Bank</th>
                <th>mSCOA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of liabilities">
                <td class="fw-600">{{l.expenditureCategoryName}}</td>
                <td>{{l.creditorCategoryName || '—'}}</td>
                <td><span class="type-pill">{{l.liabilityType}}</span></td>
                <td class="text-right mono">R {{l.openingBalance | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{l.projectedExpenditure | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{l.projectedPayments | number:'1.0-0'}}</td>
                <td class="text-right mono fw-600">R {{l.closingBalance | number:'1.0-0'}}</td>
                <td class="text-right mono">{{l.paymentRate | number:'1.0-0'}}%</td>
                <td><span class="contra-bank">{{l.contraBankAccount}}</span></td>
                <td>
                  <span class="mscoa-tag" *ngIf="l.scoaItemCode">{{l.scoaItemCode}}</span>
                  <span class="mscoa-tag" *ngIf="l.scoaFundCode">{{l.scoaFundCode}}</span>
                  <span class="mscoa-tag" *ngIf="l.scoaFunctionCode">{{l.scoaFunctionCode}}</span>
                </td>
                <td><span class="status-badge" [ngClass]="'status-' + l.status.toLowerCase()">{{l.status}}</span></td>
              </tr>
            </tbody>
          </table>
          <div class="empty-state" *ngIf="!liabilities.length">
            <mat-icon>account_balance</mat-icon>
            <p>No liability data strings generated. Click "Generate Liabilities" to create.</p>
          </div>
        </div>
      </div>

      <div class="section-label" *ngIf="summaryData">MTREF SUMMARY</div>
      <div class="card-container" *ngIf="summaryData">
        <div class="card-body" style="padding: 20px">
          <div class="mtref-grid">
            <div class="mtref-item">
              <span class="mtref-label">Total Opening Balance</span>
              <span class="mtref-value">R {{summaryData.totalOpeningBalance | number:'1.0-0'}}</span>
            </div>
            <div class="mtref-item">
              <span class="mtref-label">Total Projected Expenditure</span>
              <span class="mtref-value">R {{summaryData.totalProjectedExpenditure | number:'1.0-0'}}</span>
            </div>
            <div class="mtref-item">
              <span class="mtref-label">Total Projected Payments</span>
              <span class="mtref-value">R {{summaryData.totalProjectedPayments | number:'1.0-0'}}</span>
            </div>
            <div class="mtref-item">
              <span class="mtref-label">Total Closing Balance</span>
              <span class="mtref-value highlight">R {{summaryData.totalClosingBalance | number:'1.0-0'}}</span>
            </div>
            <div class="mtref-item">
              <span class="mtref-label">Year 1 Liability</span>
              <span class="mtref-value">R {{summaryData.year1Total | number:'1.0-0'}}</span>
            </div>
            <div class="mtref-item">
              <span class="mtref-label">Year 2 Liability</span>
              <span class="mtref-value">R {{summaryData.year2Total | number:'1.0-0'}}</span>
            </div>
            <div class="mtref-item">
              <span class="mtref-label">Year 3 Liability</span>
              <span class="mtref-value">R {{summaryData.year3Total | number:'1.0-0'}}</span>
            </div>
            <div class="mtref-item">
              <span class="mtref-label">Liability Strings</span>
              <span class="mtref-value">{{summaryData.liabilityCount}}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 24px; max-width: 1440px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title { font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: #94a3b8; margin: 0; }
    .btn-primary { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background: #0f2b46; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { background: #1a3a5c; }
    .btn-primary mat-icon { font-size: 18px; width: 18px; height: 18px; }
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
    .text-right { text-align: right !important; }
    .fw-600 { font-weight: 600; }
    .mono { font-family: 'SF Mono', ui-monospace, monospace; font-size: 12px; }
    .type-pill { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; background: #f1f5f9; color: #475569; }
    .mscoa-tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: #e3f2fd; color: #1565c0; margin-right: 4px; font-family: monospace; }
    .contra-bank { font-family: monospace; font-size: 11px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
    .status-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .status-approved { background: #e8f5e9; color: #1b5e20; }
    .status-draft { background: #f1f5f9; color: #64748b; }
    .status-submitted { background: #fff3e0; color: #e65100; }
    .empty-state { text-align: center; padding: 30px; color: #94a3b8; }
    .empty-state mat-icon { font-size: 32px; width: 32px; height: 32px; color: #cbd5e1; }
    .empty-state p { margin: 8px 0 0; font-size: 13px; }
    .mtref-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    @media (max-width: 900px) { .mtref-grid { grid-template-columns: repeat(2, 1fr); } }
    .mtref-item { display: flex; flex-direction: column; gap: 4px; padding: 12px; background: #f8fafc; border-radius: 8px; }
    .mtref-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .mtref-value { font-size: 18px; font-weight: 700; color: #1e293b; font-family: monospace; }
    .mtref-value.highlight { color: #0f2b46; }
  `]
})
export class CreditorLiabilitiesPage implements OnInit {
  summaryData: CreditorLiabilitySummary | null = null;
  liabilities: CreditorLiabilityItem[] = [];
  kpiCards: any[] = [];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.api.getCreditorLiabilities().subscribe(data => {
      this.summaryData = data;
      this.liabilities = data.liabilities;
      this.buildKpis();
      this.cdr.markForCheck();
    });
  }

  buildKpis() {
    this.kpiCards = [
      { icon: 'account_balance', label: 'Liability Strings', value: (this.summaryData?.liabilityCount || 0).toString(), subtitle: 'Generated strings', colorClass: 'icon-blue' },
      { icon: 'account_balance_wallet', label: 'Opening Balance', value: 'R ' + ((this.summaryData?.totalOpeningBalance || 0) / 1000000).toFixed(1) + 'M', subtitle: 'Total opening', colorClass: 'icon-green' },
      { icon: 'trending_down', label: 'Closing Balance', value: 'R ' + ((this.summaryData?.totalClosingBalance || 0) / 1000000).toFixed(1) + 'M', subtitle: 'Projected closing', colorClass: 'icon-amber' },
      { icon: 'payments', label: 'Projected Payments', value: 'R ' + ((this.summaryData?.totalProjectedPayments || 0) / 1000000).toFixed(1) + 'M', subtitle: 'Total payments', colorClass: 'icon-teal' },
    ];
  }

  generateLiabilities() {
    this.api.generateCreditorLiabilities(1).subscribe(() => this.loadData());
  }
}
