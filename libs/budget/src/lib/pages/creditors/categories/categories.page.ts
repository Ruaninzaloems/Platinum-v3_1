import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../core/services/api.service';
import { CreditorCategoryDetail, CreditorPaymentArrangement, AgeAnalysis } from '../../../core/models/budget.models';

@Component({
  selector: 'app-creditor-categories-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Creditor Categories & Payment Rates</h1>
          <p class="page-subtitle">Manage creditor payment terms, age analysis, and payment arrangements (CRB4, CRB10, CRB15, CRB16, CRB25)</p>
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

      <div class="section-label">CREDITOR CATEGORIES</div>
      <div class="card-container" *ngFor="let cat of creditorCategories">
        <div class="card-title-bar" (click)="expandedCat = expandedCat === cat.id ? null : cat.id">
          <div class="svc-header">
            <span class="svc-type-badge" [ngClass]="'cred-' + cat.type.toLowerCase()">{{cat.type}}</span>
            <h2>{{cat.name}}</h2>
            <span class="term-badge">{{cat.paymentTermDays}} days</span>
            <span class="interest-badge" *ngIf="cat.chargesInterest">
              <mat-icon>percent</mat-icon> {{cat.interestRate}}% interest
            </span>
          </div>
          <div class="svc-meta">
            <span class="tariff-count">{{cat.items.length}} items</span>
            <mat-icon>{{expandedCat === cat.id ? 'expand_less' : 'expand_more'}}</mat-icon>
          </div>
        </div>
        <div class="card-body" *ngIf="expandedCat === cat.id">
          <table class="data-table" *ngIf="cat.items.length">
            <thead>
              <tr>
                <th>Expenditure Category</th>
                <th class="text-right">30-Day Rate</th>
                <th class="text-right">60-Day Rate</th>
                <th class="text-right">90-Day Rate</th>
                <th class="text-right">90+ Day Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of cat.items">
                <td class="fw-600">{{item.expenditureCategoryName}}</td>
                <td class="text-right mono">{{item.paymentRate30Days | number:'1.0-0'}}%</td>
                <td class="text-right mono">{{item.paymentRate60Days | number:'1.0-0'}}%</td>
                <td class="text-right mono">{{item.paymentRate90Days | number:'1.0-0'}}%</td>
                <td class="text-right mono">{{item.paymentRateOver90Days | number:'1.0-0'}}%</td>
              </tr>
            </tbody>
          </table>
          <div class="empty-state" *ngIf="!cat.items.length">
            <p>No payment rate items configured</p>
          </div>
        </div>
      </div>

      <div class="section-label">AGE ANALYSIS</div>
      <div class="card-container">
        <div class="card-body" style="padding: 20px">
          <table class="data-table" *ngIf="ageAnalysis.length">
            <thead>
              <tr>
                <th>Category</th>
                <th class="text-right">Current</th>
                <th class="text-right">30 Days</th>
                <th class="text-right">60 Days</th>
                <th class="text-right">90+ Days</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of ageAnalysis">
                <td class="fw-600">{{a.category}}</td>
                <td class="text-right mono">R {{a.current | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{a.thirtyDay | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{a.sixtyDay | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{a.ninetyPlusDay | number:'1.0-0'}}</td>
                <td class="text-right mono fw-600">R {{a.total | number:'1.0-0'}}</td>
              </tr>
            </tbody>
          </table>
          <div class="empty-state" *ngIf="!ageAnalysis.length">
            <mat-icon>analytics</mat-icon>
            <p>Generate liabilities to view age analysis</p>
          </div>
        </div>
      </div>

      <div class="section-label">PAYMENT ARRANGEMENTS</div>
      <div class="card-container">
        <div class="card-body" style="padding: 20px">
          <table class="data-table" *ngIf="arrangements.length">
            <thead>
              <tr>
                <th>Creditor</th>
                <th>Reference</th>
                <th class="text-right">Total Outstanding</th>
                <th class="text-right">Instalment</th>
                <th class="text-right">Remaining</th>
                <th class="text-right">Interest</th>
                <th>Status</th>
                <th>Start Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let pa of arrangements">
                <td class="fw-600">{{pa.creditorName}}</td>
                <td><span class="contract-ref">{{pa.referenceNumber}}</span></td>
                <td class="text-right mono">R {{pa.totalOutstanding | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{pa.instalmentAmount | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{pa.remainingBalance | number:'1.0-0'}}</td>
                <td class="text-right mono">{{pa.interestRate ? (pa.interestRate | number:'1.1-1') + '%' : '—'}}</td>
                <td><span class="status-badge" [ngClass]="'status-' + pa.arrangementStatus.toLowerCase()">{{pa.arrangementStatus}}</span></td>
                <td>{{pa.startDate | date:'dd MMM yyyy'}}</td>
              </tr>
            </tbody>
          </table>
          <div class="empty-state" *ngIf="!arrangements.length">
            <mat-icon>receipt_long</mat-icon>
            <p>No payment arrangements</p>
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
    .card-title-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; cursor: pointer; }
    .card-title-bar:hover { background: #f8fafc; }
    .card-title-bar h2 { font-size: 15px; font-weight: 600; color: #1e293b; margin: 0; }
    .card-body { padding: 0 20px 20px; }
    .svc-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .svc-meta { display: flex; align-items: center; gap: 10px; }
    .tariff-count { font-size: 12px; color: #64748b; font-weight: 500; }
    .svc-type-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .cred-current { background: #e8f5e9; color: #2e7d32; }
    .cred-thirtyday { background: #e3f2fd; color: #1565c0; }
    .cred-sixtyday { background: #fff8e1; color: #e65100; }
    .cred-ninetyplusday { background: #fce4ec; color: #c62828; }
    .term-badge { font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }
    .interest-badge { display: flex; align-items: center; gap: 2px; font-size: 11px; color: #e65100; background: #fff8e1; padding: 2px 8px; border-radius: 4px; }
    .interest-badge mat-icon { font-size: 12px; width: 12px; height: 12px; }
    .contract-ref { font-family: monospace; font-size: 11px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th { padding: 10px 12px; text-align: left; font-weight: 600; color: #64748b; border-bottom: 2px solid #e8ecf1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .data-table tr:hover { background: #f8fafc; }
    .text-right { text-align: right !important; }
    .fw-600 { font-weight: 600; }
    .mono { font-family: 'SF Mono', ui-monospace, monospace; font-size: 12px; }
    .status-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .status-active { background: #e8f5e9; color: #1b5e20; }
    .status-completed { background: #e3f2fd; color: #1565c0; }
    .status-overdue { background: #fce4ec; color: #c62828; }
    .status-restructured { background: #fff8e1; color: #e65100; }
    .empty-state { text-align: center; padding: 30px; color: #94a3b8; }
    .empty-state mat-icon { font-size: 32px; width: 32px; height: 32px; color: #cbd5e1; }
    .empty-state p { margin: 8px 0 0; font-size: 13px; }
  `]
})
export class CreditorCategoriesPage implements OnInit {
  creditorCategories: CreditorCategoryDetail[] = [];
  arrangements: CreditorPaymentArrangement[] = [];
  ageAnalysis: AgeAnalysis[] = [];
  kpiCards: any[] = [];
  expandedCat: number | null = null;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.api.getCreditorCategories().subscribe(data => {
      this.creditorCategories = data;
      if (data.length) this.expandedCat = data[0].id;
      this.buildKpis();
      this.cdr.markForCheck();
    });
    this.api.getPaymentArrangements().subscribe(data => { this.arrangements = data; this.buildKpis(); this.cdr.markForCheck(); });
    this.api.getAgeAnalysis().subscribe(data => { this.ageAnalysis = data; this.cdr.markForCheck(); });
  }

  buildKpis() {
    const totalOutstanding = this.arrangements.reduce((s, a) => s + a.remainingBalance, 0);
    const interestCharged = this.creditorCategories.filter(c => c.chargesInterest).length;
    this.kpiCards = [
      { icon: 'account_balance', label: 'Creditor Categories', value: this.creditorCategories.length.toString(), subtitle: 'Payment groupings', colorClass: 'icon-blue' },
      { icon: 'receipt_long', label: 'Payment Arrangements', value: this.arrangements.length.toString(), subtitle: 'Active arrangements', colorClass: 'icon-green' },
      { icon: 'attach_money', label: 'Outstanding Balance', value: 'R ' + (totalOutstanding / 1000000).toFixed(1) + 'M', subtitle: 'Remaining balance', colorClass: 'icon-amber' },
      { icon: 'percent', label: 'Interest-Charging', value: interestCharged.toString(), subtitle: 'Categories with interest', colorClass: 'icon-teal' },
    ];
  }
}
