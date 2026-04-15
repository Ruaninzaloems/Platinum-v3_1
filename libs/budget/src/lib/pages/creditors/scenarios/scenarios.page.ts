import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../services/api.service';
import { ExpenditureScenarioSummary, ExpenditureScenario, ForecastAssumption, SensitivityAnalysis } from '../../../models/budget.models';

@Component({
  selector: 'app-creditor-scenarios-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Expenditure Scenarios (What-If Analysis)</h1>
          <p class="page-subtitle">Model inflation-adjusted expenditure scenarios and sensitivity analysis (CRB1, CRB11, CRB12, CRB13, CRB39)</p>
        </div>
        <button class="btn-primary" (click)="showCreateDialog = true">
          <mat-icon>add</mat-icon> New Scenario
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

      <div class="section-label">SCENARIOS</div>
      <div class="card-container" *ngFor="let s of scenarios">
        <div class="card-title-bar" (click)="selectScenario(s)">
          <div class="svc-header">
            <span class="status-badge" [ngClass]="'status-' + s.status.toLowerCase()">{{s.status}}</span>
            <h2>{{s.name}}</h2>
            <span class="inflation-badge">{{s.baseInflationPercent}}% inflation</span>
          </div>
          <div class="svc-meta">
            <span class="tariff-count">{{s.lineCount}} categories</span>
            <mat-icon>{{selectedScenario?.id === s.id ? 'expand_less' : 'expand_more'}}</mat-icon>
          </div>
        </div>
        <div class="card-body" *ngIf="selectedScenario?.id === s.id && scenarioDetail">
          <div class="scenario-summary">
            <div class="summary-item">
              <span class="summary-label">Current Expenditure</span>
              <span class="summary-value">R {{s.totalCurrentExpenditure | number:'1.0-0'}}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Projected Expenditure</span>
              <span class="summary-value highlight">R {{s.totalProjectedExpenditure | number:'1.0-0'}}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Total Variance</span>
              <span class="summary-value" [ngClass]="s.totalVariance > 0 ? 'text-red' : 'text-green'">R {{s.totalVariance | number:'1.0-0'}}</span>
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Type</th>
                <th class="text-right">Current</th>
                <th class="text-right">Projected</th>
                <th class="text-right">Variance</th>
                <th class="text-right">Variance %</th>
                <th>Shift</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of scenarioDetail.lines">
                <td class="fw-600">{{l.expenditureCategoryName}}</td>
                <td><span class="type-pill">{{l.expenditureCategoryType}}</span></td>
                <td class="text-right mono">R {{l.currentExpenditure | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{l.projectedExpenditure | number:'1.0-0'}}</td>
                <td class="text-right mono" [ngClass]="l.varianceAmount > 0 ? 'text-red' : 'text-green'">R {{l.varianceAmount | number:'1.0-0'}}</td>
                <td class="text-right mono">{{l.variancePercent | number:'1.1-1'}}%</td>
                <td><span *ngIf="l.isMaterialShift" class="material-shift"><mat-icon>trending_up</mat-icon> Material</span></td>
              </tr>
            </tbody>
          </table>
          <div class="scenario-actions">
            <button class="btn-secondary" (click)="submitScenario(s.id)" *ngIf="scenarioDetail.status === 'Draft'">Submit for Approval</button>
            <button class="btn-primary" (click)="approveScenario(s.id)" *ngIf="scenarioDetail.status === 'Submitted'">Approve</button>
          </div>
        </div>
      </div>

      <div class="section-label">FORECAST ASSUMPTIONS</div>
      <div class="card-container">
        <div class="card-body" style="padding: 20px">
          <table class="data-table" *ngIf="assumptions.length">
            <thead>
              <tr>
                <th>Assumption</th>
                <th>Type</th>
                <th>Category</th>
                <th class="text-right">Year 1</th>
                <th class="text-right">Year 2</th>
                <th class="text-right">Year 3</th>
                <th>Justification</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of assumptions">
                <td class="fw-600">{{a.name}}</td>
                <td><span class="type-pill">{{a.assumptionType}}</span></td>
                <td>{{a.category || '—'}}</td>
                <td class="text-right mono">{{a.year1Value | number:'1.1-1'}}%</td>
                <td class="text-right mono">{{a.year2Value | number:'1.1-1'}}%</td>
                <td class="text-right mono">{{a.year3Value | number:'1.1-1'}}%</td>
                <td class="text-muted" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{a.justification || '—'}}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="section-label">SENSITIVITY ANALYSIS</div>
      <div class="card-container">
        <div class="card-body" style="padding: 20px">
          <table class="data-table" *ngIf="sensitivity.length">
            <thead>
              <tr>
                <th>Parameter</th>
                <th class="text-right">Base Value</th>
                <th class="text-right">Low (-20%)</th>
                <th class="text-right">High (+20%)</th>
                <th class="text-right">Base Expenditure</th>
                <th class="text-right">Low Expenditure</th>
                <th class="text-right">High Expenditure</th>
                <th class="text-right">Sensitivity</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sa of sensitivity">
                <td class="fw-600">{{sa.parameterName}}</td>
                <td class="text-right mono">{{sa.baseValue | number:'1.1-1'}}%</td>
                <td class="text-right mono">{{sa.lowValue | number:'1.1-1'}}%</td>
                <td class="text-right mono">{{sa.highValue | number:'1.1-1'}}%</td>
                <td class="text-right mono">R {{sa.baseExpenditure | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{sa.lowExpenditure | number:'1.0-0'}}</td>
                <td class="text-right mono">R {{sa.highExpenditure | number:'1.0-0'}}</td>
                <td class="text-right"><span class="sensitivity-badge">{{sa.sensitivity | number:'1.1-1'}}%</span></td>
              </tr>
            </tbody>
          </table>
          <div class="empty-state" *ngIf="!sensitivity.length">
            <mat-icon>analytics</mat-icon>
            <p>No sensitivity analysis available. Generate expenditure projections first.</p>
          </div>
        </div>
      </div>

      <div class="dialog-overlay" *ngIf="showCreateDialog" (click)="showCreateDialog = false">
        <div class="dialog-panel" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2>New Expenditure Scenario</h2>
            <button class="btn-icon" (click)="showCreateDialog = false"><mat-icon>close</mat-icon></button>
          </div>
          <div class="dialog-body">
            <div class="form-grid">
              <div class="form-group full-width">
                <label>Scenario Name</label>
                <input [(ngModel)]="scenarioForm.name" placeholder="e.g. CPI + 2% Demand Growth">
              </div>
              <div class="form-group full-width">
                <label>Description</label>
                <textarea [(ngModel)]="scenarioForm.description" rows="2"></textarea>
              </div>
              <div class="form-group">
                <label>Base Inflation %</label>
                <input type="number" [(ngModel)]="scenarioForm.baseInflationPercent" step="0.1">
              </div>
              <div class="form-group">
                <label>Demand Adjustment %</label>
                <input type="number" [(ngModel)]="scenarioForm.demandAdjustmentPercent" step="0.1">
              </div>
              <div class="form-group full-width">
                <label>Justification</label>
                <textarea [(ngModel)]="scenarioForm.justification" rows="2"></textarea>
              </div>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn-secondary" (click)="showCreateDialog = false">Cancel</button>
            <button class="btn-primary" (click)="createScenario()" [disabled]="saving">
              {{saving ? 'Creating...' : 'Create Scenario'}}
            </button>
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
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-secondary { padding: 10px 20px; background: white; color: #64748b; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn-icon { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; border-radius: 6px; display: flex; align-items: center; }
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
    .card-title-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; cursor: pointer; }
    .card-title-bar:hover { background: #f8fafc; }
    .card-title-bar h2 { font-size: 15px; font-weight: 600; color: #1e293b; margin: 0; }
    .card-body { padding: 0 20px 20px; }
    .svc-header { display: flex; align-items: center; gap: 10px; }
    .svc-meta { display: flex; align-items: center; gap: 10px; }
    .tariff-count { font-size: 12px; color: #64748b; font-weight: 500; }
    .inflation-badge { font-size: 11px; color: #e65100; background: #fff8e1; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .scenario-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; padding: 16px; background: #f8fafc; border-radius: 8px; }
    .summary-item { display: flex; flex-direction: column; gap: 4px; }
    .summary-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .summary-value { font-size: 18px; font-weight: 700; color: #1e293b; font-family: monospace; }
    .summary-value.highlight { color: #0f2b46; }
    .text-red { color: #dc2626 !important; }
    .text-green { color: #16a34a !important; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th { padding: 10px 12px; text-align: left; font-weight: 600; color: #64748b; border-bottom: 2px solid #e8ecf1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .data-table tr:hover { background: #f8fafc; }
    .text-right { text-align: right !important; }
    .text-muted { color: #94a3b8; }
    .fw-600 { font-weight: 600; }
    .mono { font-family: 'SF Mono', ui-monospace, monospace; font-size: 12px; }
    .type-pill { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; background: #f1f5f9; color: #475569; }
    .status-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .status-approved { background: #e8f5e9; color: #1b5e20; }
    .status-draft { background: #f1f5f9; color: #64748b; }
    .status-submitted { background: #fff3e0; color: #e65100; }
    .material-shift { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #dc2626; background: #fef2f2; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .material-shift mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .sensitivity-badge { background: #e3f2fd; color: #1565c0; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; font-family: monospace; }
    .scenario-actions { display: flex; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e8ecf1; }
    .empty-state { text-align: center; padding: 30px; color: #94a3b8; }
    .empty-state mat-icon { font-size: 32px; width: 32px; height: 32px; color: #cbd5e1; }
    .empty-state p { margin: 8px 0 0; font-size: 13px; }
    .dialog-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .dialog-panel { background: white; border-radius: 16px; width: 600px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
    .dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e8ecf1; }
    .dialog-header h2 { margin: 0; font-size: 18px; font-weight: 600; color: #1e293b; }
    .dialog-body { padding: 24px; }
    .dialog-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #e8ecf1; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-group input, .form-group select, .form-group textarea { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #1e293b; outline: none; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #0f2b46; }
  `]
})
export class CreditorscenariosPage implements OnInit {
  scenarios: ExpenditureScenarioSummary[] = [];
  selectedScenario: ExpenditureScenarioSummary | null = null;
  scenarioDetail: ExpenditureScenario | null = null;
  assumptions: ForecastAssumption[] = [];
  sensitivity: SensitivityAnalysis[] = [];
  kpiCards: any[] = [];
  showCreateDialog = false;
  saving = false;
  scenarioForm: any = { baseInflationPercent: 5.2, demandAdjustmentPercent: 0 };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.api.getExpenditureScenarios().subscribe(data => { this.scenarios = data; this.buildKpis(); this.cdr.markForCheck(); });
    this.api.getForecastAssumptions().subscribe(data => { this.assumptions = data; this.cdr.markForCheck(); });
    this.api.getSensitivityAnalysis().subscribe(data => { this.sensitivity = data; this.cdr.markForCheck(); });
  }

  buildKpis() {
    const totalVar = this.scenarios.reduce((s, sc) => s + sc.totalVariance, 0);
    this.kpiCards = [
      { icon: 'compare_arrows', label: 'Scenarios', value: this.scenarios.length.toString(), subtitle: 'What-if models', colorClass: 'icon-blue' },
      { icon: 'trending_up', label: 'Avg Inflation', value: (this.scenarios.length ? this.scenarios.reduce((s, sc) => s + sc.baseInflationPercent, 0) / this.scenarios.length : 0).toFixed(1) + '%', subtitle: 'Base increase', colorClass: 'icon-amber' },
      { icon: 'analytics', label: 'Assumptions', value: this.assumptions.length.toString(), subtitle: 'Active forecasts', colorClass: 'icon-green' },
      { icon: 'show_chart', label: 'Total Variance', value: 'R ' + (totalVar / 1000000).toFixed(1) + 'M', subtitle: 'Across scenarios', colorClass: 'icon-teal' },
    ];
  }

  selectScenario(s: ExpenditureScenarioSummary) {
    if (this.selectedScenario?.id === s.id) { this.selectedScenario = null; this.scenarioDetail = null; return; }
    this.selectedScenario = s;
    this.api.getExpenditureScenario(s.id).subscribe(d => { this.scenarioDetail = d; this.cdr.markForCheck(); });
  }

  createScenario() {
    this.saving = true;
    this.api.createExpenditureScenario({ ...this.scenarioForm, financialYearId: 1 }).subscribe({
      next: () => { this.saving = false; this.showCreateDialog = false; this.loadData(); },
      error: () => { this.saving = false; this.cdr.markForCheck(); }
    });
  }

  submitScenario(id: number) {
    this.api.submitExpenditureScenario(id).subscribe(() => this.loadData());
  }

  approveScenario(id: number) {
    this.api.approveExpenditureScenario(id).subscribe(() => this.loadData());
  }
}
