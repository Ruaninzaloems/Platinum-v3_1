import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../core/services/api.service';
import { DraftExpenditureBudget, CreditorsIntegrationStatus } from '../../../core/models/budget.models';

@Component({
  selector: 'app-creditor-draft-budget-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Draft Expenditure Budget</h1>
          <p class="page-subtitle">Consolidated creditors draft budget with mSCOA integration (CRB5, CRB6, CRB17, CRB26, CRB30, CRB40, CRB41)</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="generateBudgetStrings()">
            <mat-icon>code</mat-icon> Generate Budget Strings
          </button>
          <button class="btn-primary" (click)="submitAll()">
            <mat-icon>send</mat-icon> Submit for Approval
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

      <div class="section-label">INTEGRATION STATUS</div>
      <div class="card-container" *ngIf="integrationStatus">
        <div class="card-body" style="padding: 20px">
          <div class="integration-grid">
            <div class="integration-item">
              <mat-icon [ngClass]="integrationStatus.status === 'Integrated' ? 'text-green' : 'text-amber'">{{integrationStatus.status === 'Integrated' ? 'check_circle' : 'pending'}}</mat-icon>
              <div>
                <div class="integration-label">Status</div>
                <div class="integration-value">{{integrationStatus.status}}</div>
              </div>
            </div>
            <div class="integration-item">
              <mat-icon class="text-blue">analytics</mat-icon>
              <div>
                <div class="integration-label">Projections</div>
                <div class="integration-value">{{integrationStatus.projectionsApproved}} approved / {{integrationStatus.projectionsPending}} pending</div>
              </div>
            </div>
            <div class="integration-item">
              <mat-icon class="text-blue">account_balance</mat-icon>
              <div>
                <div class="integration-label">Liabilities</div>
                <div class="integration-value">{{integrationStatus.liabilitiesApproved}} approved / {{integrationStatus.liabilitiesPending}} pending</div>
              </div>
            </div>
            <div class="integration-item">
              <mat-icon class="text-blue">code</mat-icon>
              <div>
                <div class="integration-label">Budget Strings</div>
                <div class="integration-value">{{integrationStatus.budgetStringsGenerated}} generated</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section-label">DRAFT EXPENDITURE BUDGET</div>
      <div class="card-container" *ngIf="draftBudget">
        <div class="card-body" style="padding: 20px">
          <div class="budget-totals">
            <div class="total-item">
              <span class="total-label">Gross Expenditure</span>
              <span class="total-value">R {{draftBudget.totalGrossExpenditure | number:'1.0-0'}}</span>
            </div>
            <div class="total-item">
              <span class="total-label">VAT</span>
              <span class="total-value">R {{draftBudget.totalVat | number:'1.0-0'}}</span>
            </div>
            <div class="total-item highlight-total">
              <span class="total-label">Net Expenditure</span>
              <span class="total-value">R {{draftBudget.totalNetExpenditure | number:'1.0-0'}}</span>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Type</th>
                <th>mSCOA Item</th>
                <th>mSCOA Fund</th>
                <th>mSCOA Function</th>
                <th class="text-right">Gross</th>
                <th class="text-right">VAT</th>
                <th class="text-right">Net</th>
                <th class="text-right">Year 1</th>
                <th class="text-right">Year 2</th>
                <th class="text-right">Year 3</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of draftBudget.lines">
                <td class="fw-600">{{l.expenditureCategoryName}}</td>
                <td><span class="type-pill">{{l.expenditureCategoryType}}</span></td>
                <td><span class="mscoa-tag" *ngIf="l.scoaItemCode">{{l.scoaItemCode}} <span class="mscoa-desc" *ngIf="l.scoaItemDescription">{{l.scoaItemDescription}}</span></span></td>
                <td><span class="mscoa-tag" *ngIf="l.scoaFundCode">{{l.scoaFundCode}}</span></td>
                <td><span class="mscoa-tag" *ngIf="l.scoaFunctionCode">{{l.scoaFunctionCode}}</span></td>
                <td class="text-right mono">R {{l.grossExpenditure | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{l.vat | number:'1.0-0'}}</td>
                <td class="text-right mono fw-600">R {{l.netExpenditure | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{l.year1Amount | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{l.year2Amount | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{l.year3Amount | number:'1.0-0'}}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td class="fw-600" colspan="5">TOTAL</td>
                <td class="text-right mono fw-600">R {{draftBudget.totalGrossExpenditure | number:'1.0-0'}}</td>
                <td class="text-right mono fw-600">R {{draftBudget.totalVat | number:'1.0-0'}}</td>
                <td class="text-right mono fw-600">R {{draftBudget.totalNetExpenditure | number:'1.0-0'}}</td>
                <td class="text-right mono fw-600">R {{draftBudget.year1Total | number:'1.0-0'}}</td>
                <td class="text-right mono fw-600">R {{draftBudget.year2Total | number:'1.0-0'}}</td>
                <td class="text-right mono fw-600">R {{draftBudget.year3Total | number:'1.0-0'}}</td>
              </tr>
            </tfoot>
          </table>
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
    .integration-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    @media (max-width: 900px) { .integration-grid { grid-template-columns: repeat(2, 1fr); } }
    .integration-item { display: flex; align-items: center; gap: 10px; padding: 12px; background: #f8fafc; border-radius: 8px; }
    .integration-item mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .text-green { color: #16a34a; }
    .text-amber { color: #d97706; }
    .text-blue { color: #1565c0; }
    .integration-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .integration-value { font-size: 13px; font-weight: 600; color: #1e293b; }
    .budget-totals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
    .total-item { display: flex; flex-direction: column; gap: 4px; padding: 16px; background: #f8fafc; border-radius: 8px; }
    .total-item.highlight-total { background: #0f2b46; }
    .highlight-total .total-label { color: rgba(255,255,255,0.7); }
    .highlight-total .total-value { color: #c9a84c; }
    .total-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .total-value { font-size: 22px; font-weight: 700; color: #1e293b; font-family: monospace; }
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
    .mscoa-tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: #e3f2fd; color: #1565c0; font-family: monospace; }
    .mscoa-desc { font-weight: 400; margin-left: 4px; }
  `]
})
export class CreditorDraftBudgetPage implements OnInit {
  draftBudget: DraftExpenditureBudget | null = null;
  integrationStatus: CreditorsIntegrationStatus | null = null;
  kpiCards: any[] = [];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.api.getDraftExpenditureBudget().subscribe(data => { this.draftBudget = data; this.buildKpis(); this.cdr.markForCheck(); });
    this.api.getCreditorsIntegrationStatus().subscribe(data => { this.integrationStatus = data; this.buildKpis(); this.cdr.markForCheck(); });
  }

  buildKpis() {
    this.kpiCards = [
      { icon: 'summarize', label: 'Gross Expenditure', value: 'R ' + ((this.draftBudget?.totalGrossExpenditure || 0) / 1000000).toFixed(1) + 'M', subtitle: 'Total gross', colorClass: 'icon-blue' },
      { icon: 'receipt', label: 'VAT Total', value: 'R ' + ((this.draftBudget?.totalVat || 0) / 1000000).toFixed(1) + 'M', subtitle: 'Total VAT', colorClass: 'icon-amber' },
      { icon: 'attach_money', label: 'Net Expenditure', value: 'R ' + ((this.draftBudget?.totalNetExpenditure || 0) / 1000000).toFixed(1) + 'M', subtitle: 'Including VAT', colorClass: 'icon-green' },
      { icon: 'code', label: 'Budget Strings', value: (this.draftBudget?.budgetStringsGenerated || 0).toString(), subtitle: 'mSCOA strings', colorClass: 'icon-teal' },
    ];
  }

  generateBudgetStrings() {
    this.api.generateCreditorsBudgetStrings({ budgetVersionId: 1, financialYearId: 1 }).subscribe(() => this.loadData());
  }

  submitAll() {
    this.api.submitAllExpenditureProjections(1).subscribe(() => this.loadData());
  }
}
