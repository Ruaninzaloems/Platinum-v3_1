import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../core/services/api.service';
import { ConsumerCategory, ProjectedBill, TariffScenarioSummary } from '../../../core/models/budget.models';

@Component({
  selector: 'app-consumers-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Consumer Categories</h1>
          <p class="page-subtitle">Manage consumer classifications and projected bills (BILB14, BILB15, BILB33)</p>
        </div>
        <button class="btn-primary" (click)="showCreateDialog = true"><mat-icon>add</mat-icon> New Category</button>
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
        <div class="card-title-bar"><h2><mat-icon>groups</mat-icon> Consumer Categories</h2></div>
        <div class="card-body" *ngIf="categories.length; else noData">
          <table class="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Type</th>
                <th class="text-right">Consumers</th>
                <th class="text-right">Avg Consumption</th>
                <th>Property Range</th>
                <th>Area</th>
                <th>Flag</th>
                <th>Services</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of categories" [class.flagged-row]="c.isFlagged">
                <td class="fw-600">{{c.name}}</td>
                <td><span class="type-badge" [ngClass]="'type-' + c.type.toLowerCase()">{{c.type}}</span></td>
                <td class="text-right mono">{{c.consumerCount | number}}</td>
                <td class="text-right mono">{{c.avgMonthlyConsumption | number:'1.0-0'}}</td>
                <td class="mono small-text">
                  <span *ngIf="c.propertyValueMin">R {{c.propertyValueMin | number:'1.0-0'}} - R {{c.propertyValueMax | number:'1.0-0'}}</span>
                  <span *ngIf="!c.propertyValueMin" class="text-muted">N/A</span>
                </td>
                <td class="small-text">{{c.geographicArea || 'N/A'}}</td>
                <td>
                  <mat-icon *ngIf="c.isFlagged" class="flag-icon" title="Flagged for review">flag</mat-icon>
                </td>
                <td>{{c.services?.length || 0}}</td>
                <td>
                  <div class="action-btns">
                    <button class="btn-icon" (click)="viewBill(c)" title="Projected Bill"><mat-icon>receipt</mat-icon></button>
                    <button class="btn-icon" (click)="editCategory(c)" title="Edit"><mat-icon>edit</mat-icon></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #noData><div class="empty-state"><mat-icon>info_outline</mat-icon><p>No consumer categories</p></div></ng-template>
      </div>

      <div class="card-container" *ngIf="selectedBill">
        <div class="card-title-bar">
          <h2><mat-icon>receipt_long</mat-icon> Projected Bill: {{selectedBill.consumerCategoryName}}</h2>
          <button class="btn-icon" (click)="selectedBill = null"><mat-icon>close</mat-icon></button>
        </div>
        <div class="card-body">
          <div class="bill-summary">
            <div class="bill-kpi">
              <span class="bill-label">Current Bill</span>
              <span class="bill-val mono">{{formatCurrency(selectedBill.totalCurrentBill)}}</span>
            </div>
            <div class="bill-kpi">
              <span class="bill-label">Projected Bill</span>
              <span class="bill-val mono">{{formatCurrency(selectedBill.totalProjectedBill)}}</span>
            </div>
            <div class="bill-kpi">
              <span class="bill-label">Rebates</span>
              <span class="bill-val mono text-green">-{{formatCurrency(selectedBill.totalRebate)}}</span>
            </div>
            <div class="bill-kpi highlight">
              <span class="bill-label">Net Bill</span>
              <span class="bill-val mono">{{formatCurrency(selectedBill.netBill)}}</span>
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th class="text-right">Current Rate</th>
                <th class="text-right">Projected Rate</th>
                <th class="text-right">Consumption</th>
                <th class="text-right">Current Amount</th>
                <th class="text-right">Projected Amount</th>
                <th class="text-right">Rebate</th>
                <th class="text-right">Net Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let line of selectedBill.billLines">
                <td class="fw-600">{{line.serviceCategoryName}}</td>
                <td class="text-right mono">R {{line.currentRate | number:'1.4-4'}}</td>
                <td class="text-right mono">R {{line.projectedRate | number:'1.4-4'}}</td>
                <td class="text-right mono">{{line.consumption | number:'1.0-0'}}</td>
                <td class="text-right mono">{{formatCurrency(line.currentAmount)}}</td>
                <td class="text-right mono">{{formatCurrency(line.projectedAmount)}}</td>
                <td class="text-right mono text-green">-{{formatCurrency(line.rebateAmount)}}</td>
                <td class="text-right mono fw-600">{{formatCurrency(line.netAmount)}}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card-container" *ngIf="categories.length > 0">
        <div class="card-title-bar"><h2><mat-icon>analytics</mat-icon> Tariff Impact Analysis</h2></div>
        <div class="card-body">
          <div class="impact-grid">
            <div class="impact-card" *ngFor="let c of categories">
              <div class="impact-header">
                <span class="type-badge" [ngClass]="'type-' + c.type.toLowerCase()">{{c.type}}</span>
                <span class="fw-600">{{c.name}}</span>
              </div>
              <div class="impact-stats">
                <span>{{c.consumerCount | number}} consumers</span>
                <span>{{c.services?.length || 0}} services</span>
              </div>
              <button class="btn-sm" (click)="viewBill(c)">View Projected Bill</button>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-overlay" *ngIf="showCreateDialog" (click)="showCreateDialog = false">
        <div class="dialog-panel" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2>{{editingCategory ? 'Edit' : 'New'}} Consumer Category</h2>
            <button class="btn-icon" (click)="showCreateDialog = false"><mat-icon>close</mat-icon></button>
          </div>
          <div class="dialog-body">
            <div class="form-grid">
              <div class="form-group"><label>Name</label><input [(ngModel)]="catForm.name" placeholder="Category name"></div>
              <div class="form-group">
                <label>Type</label>
                <select [(ngModel)]="catForm.type">
                  <option value="Household">Household</option>
                  <option value="Business">Business</option>
                  <option value="Industrial">Industrial</option>
                  <option value="NGO">NGO</option>
                </select>
              </div>
              <div class="form-group"><label>Consumer Count</label><input type="number" [(ngModel)]="catForm.consumerCount"></div>
              <div class="form-group"><label>Avg Monthly Consumption</label><input type="number" [(ngModel)]="catForm.avgMonthlyConsumption"></div>
              <div class="form-group"><label>Property Min (R)</label><input type="number" [(ngModel)]="catForm.propertyValueMin"></div>
              <div class="form-group"><label>Property Max (R)</label><input type="number" [(ngModel)]="catForm.propertyValueMax"></div>
              <div class="form-group full-width"><label>Geographic Area</label><input [(ngModel)]="catForm.geographicArea" placeholder="e.g. Municipality-Wide"></div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="catForm.isFlagged"> Flag for Review
                </label>
              </div>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn-secondary" (click)="showCreateDialog = false">Cancel</button>
            <button class="btn-primary" (click)="saveCategory()" [disabled]="saving">{{saving ? 'Saving...' : 'Save'}}</button>
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
    .btn-secondary { padding: 10px 20px; background: white; color: #64748b; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; }
    .btn-icon { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; border-radius: 6px; display: flex; align-items: center; }
    .btn-icon:hover { background: #f1f5f9; color: #1e293b; }
    .btn-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-sm { padding: 6px 12px; background: #0f2b46; color: white; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; }
    .btn-sm:hover { background: #1a3a5c; }

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
    .text-right { text-align: right !important; }
    .text-muted { color: #94a3b8; }
    .text-green { color: #2e7d32; }
    .fw-600 { font-weight: 600; }
    .mono { font-family: 'SF Mono', ui-monospace, monospace; font-size: 12px; }
    .small-text { font-size: 11px; }
    .type-badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .type-household { background: #e8f5e9; color: #2e7d32; }
    .type-business { background: #e3f2fd; color: #1565c0; }
    .type-industrial { background: #fff3e0; color: #e65100; }
    .type-ngo { background: #f3e5f5; color: #6a1b9a; }
    .flag-icon { color: #e65100; font-size: 18px; width: 18px; height: 18px; }
    .flagged-row { border-left: 3px solid #e65100; }
    .action-btns { display: flex; gap: 4px; }

    .bill-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .bill-kpi { background: #f8fafc; border: 1px solid #e8ecf1; border-radius: 10px; padding: 14px; text-align: center; }
    .bill-kpi.highlight { background: #0f2b46; border-color: #0f2b46; }
    .bill-kpi.highlight .bill-label { color: #94b8d4; }
    .bill-kpi.highlight .bill-val { color: white; }
    .bill-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 4px; }
    .bill-val { font-size: 18px; font-weight: 700; color: #1e293b; }

    .impact-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
    .impact-card { background: #f8fafc; border: 1px solid #e8ecf1; border-radius: 10px; padding: 16px; }
    .impact-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .impact-stats { font-size: 12px; color: #64748b; margin-bottom: 10px; display: flex; gap: 12px; }

    .empty-state { text-align: center; padding: 30px; color: #94a3b8; }
    .empty-state mat-icon { font-size: 32px; width: 32px; height: 32px; color: #cbd5e1; }
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
    .form-group input, .form-group select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #1e293b; outline: none; }
    .form-group input:focus, .form-group select:focus { border-color: #0f2b46; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
  `]
})
export class ConsumersPage implements OnInit {
  categories: ConsumerCategory[] = [];
  selectedBill: ProjectedBill | null = null;
  kpiCards: any[] = [];
  showCreateDialog = false;
  editingCategory: ConsumerCategory | null = null;
  saving = false;
  catForm: any = { type: 'Household', consumerCount: 0, avgMonthlyConsumption: 0, isFlagged: false };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.api.getConsumerCategories().subscribe(data => {
      this.categories = data;
      const total = data.reduce((s, c) => s + c.consumerCount, 0);
      const flagged = data.filter(c => c.isFlagged).length;
      this.kpiCards = [
        { icon: 'groups', label: 'Categories', value: data.length.toString(), subtitle: 'Consumer groups', colorClass: 'icon-blue' },
        { icon: 'people', label: 'Total Consumers', value: this.formatNum(total), subtitle: 'All categories', colorClass: 'icon-green' },
        { icon: 'flag', label: 'Flagged', value: flagged.toString(), subtitle: 'For review', colorClass: 'icon-amber' },
        { icon: 'home_work', label: 'Avg Consumption', value: data.length ? (data.reduce((s, c) => s + c.avgMonthlyConsumption, 0) / data.length).toFixed(0) : '0', subtitle: 'Monthly average', colorClass: 'icon-teal' },
      ];
      this.cdr.markForCheck();
    });
  }

  viewBill(c: ConsumerCategory) {
    this.api.getProjectedBills(c.id).subscribe(data => {
      this.selectedBill = data;
      this.cdr.markForCheck();
    });
  }

  editCategory(c: ConsumerCategory) {
    this.editingCategory = c;
    this.catForm = { name: c.name, type: c.type, consumerCount: c.consumerCount, avgMonthlyConsumption: c.avgMonthlyConsumption, propertyValueMin: c.propertyValueMin, propertyValueMax: c.propertyValueMax, geographicArea: c.geographicArea, isFlagged: c.isFlagged };
    this.showCreateDialog = true;
  }

  saveCategory() {
    this.saving = true;
    const obs = this.editingCategory
      ? this.api.updateConsumerCategory(this.editingCategory.id, this.catForm)
      : this.api.createConsumerCategory(this.catForm);
    obs.subscribe({
      next: () => { this.saving = false; this.showCreateDialog = false; this.editingCategory = null; this.loadData(); },
      error: () => { this.saving = false; this.cdr.markForCheck(); }
    });
  }

  formatCurrency(v: number): string {
    if (!v) return 'R 0';
    const abs = Math.abs(v); const sign = v < 0 ? '-' : '';
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
