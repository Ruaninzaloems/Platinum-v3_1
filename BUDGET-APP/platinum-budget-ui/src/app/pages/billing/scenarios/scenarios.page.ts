import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../services/api.service';
import { TariffScenarioSummary, TariffScenario, ScenarioComparison, ServiceCategory } from '../../../models/budget.models';

@Component({
  selector: 'app-scenarios-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Tariff Scenario Modelling</h1>
          <p class="page-subtitle">Create and compare tariff increase scenarios (BILB1, BILB3, BILB10)</p>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" (click)="showCompare = true" [disabled]="scenarios.length < 2">
            <mat-icon>compare_arrows</mat-icon> Compare
          </button>
          <button class="btn-primary" (click)="showCreateDialog = true">
            <mat-icon>add</mat-icon> New Scenario
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

      <div class="card-container">
        <div class="card-title-bar">
          <h2><mat-icon>assessment</mat-icon> Tariff Scenarios</h2>
        </div>
        <div class="card-body" *ngIf="scenarios.length; else noScenarios">
          <table class="data-table">
            <thead>
              <tr>
                <th>Scenario Name</th>
                <th>Increase %</th>
                <th class="text-right">Current Revenue</th>
                <th class="text-right">Projected Revenue</th>
                <th class="text-right">Variance</th>
                <th>Lines</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of scenarios" [class.selected-row]="selectedScenario?.id === s.id">
                <td class="fw-600">{{s.name}}</td>
                <td><span class="pct-badge">{{s.baseIncreasePercentage | number:'1.1-1'}}%</span></td>
                <td class="text-right mono">{{formatCurrency(s.totalCurrentRevenue)}}</td>
                <td class="text-right mono">{{formatCurrency(s.totalProjectedRevenue)}}</td>
                <td class="text-right mono" [ngClass]="s.totalVariance >= 0 ? 'text-green' : 'text-red'">{{formatCurrency(s.totalVariance)}}</td>
                <td>{{s.lineCount}}</td>
                <td><span class="status-badge" [ngClass]="'status-' + s.status.toLowerCase()">{{s.status}}</span></td>
                <td>
                  <div class="action-btns">
                    <button class="btn-icon" (click)="viewScenario(s.id)" title="View Details"><mat-icon>visibility</mat-icon></button>
                    <button class="btn-icon" *ngIf="s.status === 'Draft'" (click)="submitScenario(s.id)" title="Submit"><mat-icon>send</mat-icon></button>
                    <button class="btn-icon" *ngIf="s.status === 'Submitted'" (click)="approveScenario(s.id)" title="Approve"><mat-icon>check_circle</mat-icon></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #noScenarios>
          <div class="empty-state"><mat-icon>info_outline</mat-icon><p>No scenarios created yet</p></div>
        </ng-template>
      </div>

      <div class="card-container" *ngIf="selectedScenario">
        <div class="card-title-bar">
          <h2><mat-icon>tune</mat-icon> {{selectedScenario.name}} - Detail</h2>
          <span class="status-badge" [ngClass]="'status-' + selectedScenario.status.toLowerCase()">{{selectedScenario.status}}</span>
        </div>
        <div class="card-body">
          <div class="scenario-meta">
            <span><strong>Base Increase:</strong> {{selectedScenario.baseIncreasePercentage}}%</span>
            <span><strong>Financial Year:</strong> {{selectedScenario.financialYear}}</span>
            <span *ngIf="selectedScenario.justification"><strong>Justification:</strong> {{selectedScenario.justification}}</span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th class="text-right">Current Rate</th>
                <th class="text-right">Projected Rate</th>
                <th class="text-right">Current Basic</th>
                <th class="text-right">Projected Basic</th>
                <th class="text-right">Current Revenue</th>
                <th class="text-right">Projected Revenue</th>
                <th class="text-right">Variance %</th>
                <th>Flag</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let line of selectedScenario.lines" [class.material-shift]="line.isMaterialShift">
                <td class="fw-600">{{line.serviceCategoryName}}</td>
                <td class="text-right mono">R {{line.currentUnitRate | number:'1.4-4'}}</td>
                <td class="text-right mono">R {{line.projectedUnitRate | number:'1.4-4'}}</td>
                <td class="text-right mono">R {{line.currentBasicCharge | number:'1.2-2'}}</td>
                <td class="text-right mono">R {{line.projectedBasicCharge | number:'1.2-2'}}</td>
                <td class="text-right mono">{{formatCurrency(line.currentRevenue)}}</td>
                <td class="text-right mono">{{formatCurrency(line.projectedRevenue)}}</td>
                <td class="text-right" [ngClass]="line.variancePercent > 15 ? 'text-red' : line.variancePercent > 10 ? 'text-amber' : 'text-green'">{{line.variancePercent | number:'1.1-1'}}%</td>
                <td>
                  <mat-icon *ngIf="line.isMaterialShift" class="flag-icon" title="Material shift >15%">warning</mat-icon>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card-container" *ngIf="comparison">
        <div class="card-title-bar">
          <h2><mat-icon>compare</mat-icon> Scenario Comparison</h2>
          <button class="btn-icon" (click)="comparison = null"><mat-icon>close</mat-icon></button>
        </div>
        <div class="card-body">
          <div class="comparison-summary">
            <div class="comp-card" *ngFor="let c of comparison.scenarios">
              <div class="comp-name">{{c.name}}</div>
              <div class="comp-pct">{{c.baseIncreasePercentage | number:'1.1-1'}}%</div>
              <div class="comp-revenue mono">{{formatCurrency(c.totalProjectedRevenue)}}</div>
              <div class="comp-variance" [ngClass]="c.totalVariancePercent >= 0 ? 'text-green' : 'text-red'">{{c.totalVariancePercent | number:'1.1-1'}}%</div>
            </div>
          </div>
          <table class="data-table" *ngIf="comparison.serviceComparisons?.length">
            <thead>
              <tr>
                <th>Service</th>
                <th class="text-right">Current Revenue</th>
                <th *ngFor="let s of comparison.scenarios" class="text-right">{{s.name}}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of comparison.serviceComparisons">
                <td class="fw-600">{{row.serviceCategoryName}}</td>
                <td class="text-right mono">{{formatCurrency(row.currentRevenue)}}</td>
                <td *ngFor="let sr of row.scenarioRevenues" class="text-right mono">
                  {{formatCurrency(sr.projectedRevenue)}}
                  <span class="variance-inline" [ngClass]="sr.variancePercent >= 0 ? 'text-green' : 'text-red'">({{sr.variancePercent | number:'1.1-1'}}%)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="dialog-overlay" *ngIf="showCreateDialog" (click)="showCreateDialog = false">
        <div class="dialog-panel" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2>Create Tariff Scenario</h2>
            <button class="btn-icon" (click)="showCreateDialog = false"><mat-icon>close</mat-icon></button>
          </div>
          <div class="dialog-body">
            <div class="form-grid">
              <div class="form-group full-width">
                <label>Scenario Name</label>
                <input [(ngModel)]="createForm.name" placeholder="e.g. CPI + 1% Scenario">
              </div>
              <div class="form-group full-width">
                <label>Description</label>
                <textarea [(ngModel)]="createForm.description" rows="2" placeholder="Scenario description"></textarea>
              </div>
              <div class="form-group">
                <label>Base Increase %</label>
                <input type="number" [(ngModel)]="createForm.baseIncreasePercentage" step="0.1" placeholder="e.g. 5.5">
              </div>
              <div class="form-group">
                <label>Financial Year ID</label>
                <input type="number" [(ngModel)]="createForm.financialYearId" value="1">
              </div>
              <div class="form-group full-width">
                <label>Justification</label>
                <textarea [(ngModel)]="createForm.justification" rows="3" placeholder="Motivation for this tariff increase"></textarea>
              </div>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn-secondary" (click)="showCreateDialog = false">Cancel</button>
            <button class="btn-primary" (click)="createScenario()" [disabled]="saving">{{saving ? 'Creating...' : 'Create Scenario'}}</button>
          </div>
        </div>
      </div>

      <div class="dialog-overlay" *ngIf="showCompare" (click)="showCompare = false">
        <div class="dialog-panel" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2>Select Scenarios to Compare</h2>
            <button class="btn-icon" (click)="showCompare = false"><mat-icon>close</mat-icon></button>
          </div>
          <div class="dialog-body">
            <div class="compare-list">
              <label *ngFor="let s of scenarios" class="compare-item">
                <input type="checkbox" [checked]="compareIds.includes(s.id)" (change)="toggleCompare(s.id)">
                <span>{{s.name}} ({{s.baseIncreasePercentage}}%)</span>
              </label>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn-secondary" (click)="showCompare = false">Cancel</button>
            <button class="btn-primary" (click)="runComparison()" [disabled]="compareIds.length < 2">Compare ({{compareIds.length}} selected)</button>
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
    .kpi-icon-wrap.icon-amber { background: #fff8e1; color: #e65100; }
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

    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th { padding: 10px 12px; text-align: left; font-weight: 600; color: #64748b; border-bottom: 2px solid #e8ecf1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .data-table tr:hover { background: #f8fafc; }
    .selected-row { background: #e3f2fd !important; }
    .text-right { text-align: right !important; }
    .fw-600 { font-weight: 600; }
    .mono { font-family: 'SF Mono', ui-monospace, monospace; font-size: 12px; }
    .text-green { color: #2e7d32; }
    .text-red { color: #c62828; }
    .text-amber { color: #e65100; }
    .pct-badge { background: #e3f2fd; color: #1565c0; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; font-family: monospace; }
    .status-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .status-draft { background: #f1f5f9; color: #64748b; }
    .status-submitted { background: #fff3e0; color: #e65100; }
    .status-approved { background: #e8f5e9; color: #1b5e20; }
    .flag-icon { color: #e65100; font-size: 18px; width: 18px; height: 18px; }
    .material-shift { background: #fff8e1 !important; }
    .action-btns { display: flex; gap: 4px; }
    .variance-inline { font-size: 10px; display: block; }

    .scenario-meta { display: flex; gap: 20px; margin-bottom: 16px; flex-wrap: wrap; font-size: 13px; color: #475569; }

    .comparison-summary { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .comp-card { background: #f8fafc; border: 1px solid #e8ecf1; border-radius: 10px; padding: 16px; text-align: center; }
    .comp-name { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
    .comp-pct { font-size: 12px; color: #1565c0; font-weight: 600; margin-bottom: 8px; }
    .comp-revenue { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .comp-variance { font-size: 13px; font-weight: 600; }

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

    .compare-list { display: flex; flex-direction: column; gap: 10px; }
    .compare-item { display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid #e8ecf1; border-radius: 8px; cursor: pointer; font-size: 14px; }
    .compare-item:hover { background: #f8fafc; }
    .compare-item input { width: 16px; height: 16px; }
  `]
})
export class ScenariosPage implements OnInit {
  scenarios: TariffScenarioSummary[] = [];
  selectedScenario: TariffScenario | null = null;
  comparison: ScenarioComparison | null = null;
  kpiCards: any[] = [];
  showCreateDialog = false;
  showCompare = false;
  saving = false;
  compareIds: number[] = [];
  createForm: any = { financialYearId: 1, baseIncreasePercentage: 5.5 };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadScenarios(); }

  loadScenarios() {
    this.api.getTariffScenarios().subscribe(data => {
      this.scenarios = data;
      this.buildKpis();
      this.cdr.markForCheck();
    });
  }

  buildKpis() {
    const best = this.scenarios.length ? Math.max(...this.scenarios.map(s => s.totalProjectedRevenue)) : 0;
    const worst = this.scenarios.length ? Math.min(...this.scenarios.map(s => s.totalProjectedRevenue)) : 0;
    const current = this.scenarios.length ? this.scenarios[0]?.totalCurrentRevenue || 0 : 0;
    this.kpiCards = [
      { icon: 'assessment', label: 'Active Scenarios', value: this.scenarios.length.toString(), subtitle: 'Total scenarios', colorClass: 'icon-blue' },
      { icon: 'trending_up', label: 'Best Revenue', value: this.formatCurrency(best), subtitle: 'Highest projection', colorClass: 'icon-green' },
      { icon: 'trending_down', label: 'Worst Revenue', value: this.formatCurrency(worst), subtitle: 'Lowest projection', colorClass: 'icon-amber' },
      { icon: 'account_balance', label: 'Current Base', value: this.formatCurrency(current), subtitle: 'Baseline revenue', colorClass: 'icon-teal' },
    ];
  }

  viewScenario(id: number) {
    this.api.getTariffScenario(id).subscribe(data => {
      this.selectedScenario = data;
      this.cdr.markForCheck();
    });
  }

  createScenario() {
    this.saving = true;
    this.api.createTariffScenario(this.createForm).subscribe({
      next: () => { this.saving = false; this.showCreateDialog = false; this.createForm = { financialYearId: 1, baseIncreasePercentage: 5.5 }; this.loadScenarios(); },
      error: () => { this.saving = false; this.cdr.markForCheck(); }
    });
  }

  submitScenario(id: number) {
    this.api.submitScenario(id).subscribe(() => this.loadScenarios());
  }

  approveScenario(id: number) {
    this.api.approveScenario(id).subscribe(() => this.loadScenarios());
  }

  toggleCompare(id: number) {
    const idx = this.compareIds.indexOf(id);
    if (idx >= 0) this.compareIds.splice(idx, 1);
    else if (this.compareIds.length < 3) this.compareIds.push(id);
  }

  runComparison() {
    this.showCompare = false;
    this.api.compareScenarios(this.compareIds).subscribe(data => {
      this.comparison = data;
      this.cdr.markForCheck();
    });
  }

  formatCurrency(value: number): string {
    if (!value) return 'R 0';
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 1_000_000_000) return sign + 'R ' + (abs / 1_000_000_000).toFixed(1) + 'B';
    if (abs >= 1_000_000) return sign + 'R ' + (abs / 1_000_000).toFixed(1) + 'M';
    if (abs >= 1_000) return sign + 'R ' + (abs / 1_000).toFixed(0) + 'K';
    return sign + 'R ' + abs.toFixed(0);
  }
}
