import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { ExpenditureCategory, CostItem } from '../../../core/models/budget.models';

@Component({
  selector: 'app-expenditure-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatDialogModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Expenditure Categories & Cost Items</h1>
          <p class="page-subtitle">Manage operational expenditure categories and cost item structures (CRB9, CRB14, CRB23, CRB24, CRB27)</p>
        </div>
        <button class="btn-primary" (click)="showCostItemDialog = true; resetForm()">
          <mat-icon>add</mat-icon> New Cost Item
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

      <div class="card-container" *ngFor="let cat of categories">
        <div class="card-title-bar" (click)="toggleExpand(cat.id)">
          <div class="svc-header">
            <span class="svc-type-badge" [ngClass]="'cat-' + cat.type.toLowerCase().replace(' ', '')">{{cat.type}}</span>
            <h2>{{cat.name}}</h2>
            <span class="svc-code">{{cat.code}}</span>
            <span class="dept-badge" *ngIf="cat.department">{{cat.department}}</span>
          </div>
          <div class="svc-meta">
            <span class="tariff-count">{{cat.costItemCount}} cost items</span>
            <mat-icon>{{expandedCat === cat.id ? 'expand_less' : 'expand_more'}}</mat-icon>
          </div>
        </div>
        <div class="card-body" *ngIf="expandedCat === cat.id">
          <div class="tariff-table-wrap" *ngIf="getItemsForCategory(cat.id).length; else noItems">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Cost Item</th>
                  <th>Type</th>
                  <th class="text-right">Basic Cost</th>
                  <th class="text-right">Unit Rate</th>
                  <th>VAT</th>
                  <th>Supplier</th>
                  <th>Contract</th>
                  <th>Variability</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let ci of getItemsForCategory(cat.id)">
                  <td class="fw-600">{{ci.name}}</td>
                  <td><span class="type-pill">{{ci.itemType}}</span></td>
                  <td class="text-right mono">R {{ci.basicCost | number:'1.2-2'}}</td>
                  <td class="text-right mono">R {{ci.unitRate | number:'1.4-4'}}</td>
                  <td><span class="vat-badge" [ngClass]="'vat-' + ci.vatIndicator.toLowerCase().replace(' ', '')">{{ci.vatIndicator}}</span></td>
                  <td>{{ci.supplierName || '—'}}</td>
                  <td><span class="contract-ref" *ngIf="ci.contractReference">{{ci.contractReference}}</span><span *ngIf="!ci.contractReference" class="text-muted">—</span></td>
                  <td>
                    <span *ngIf="ci.isVariabilityFlagged" class="variability-flag">
                      <mat-icon>warning</mat-icon> {{ci.variabilityType}}
                    </span>
                    <span *ngIf="!ci.isVariabilityFlagged" class="text-muted">—</span>
                  </td>
                  <td><span class="status-badge" [ngClass]="ci.isApproved ? 'status-approved' : 'status-draft'">{{ci.isApproved ? 'Approved' : 'Draft'}}</span></td>
                  <td>
                    <button class="btn-icon" (click)="editItem(ci)" title="Edit"><mat-icon>edit</mat-icon></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #noItems>
            <div class="empty-state">
              <mat-icon>info_outline</mat-icon>
              <p>No cost items defined for this category</p>
            </div>
          </ng-template>
        </div>
      </div>

      <div class="dialog-overlay" *ngIf="showCostItemDialog" (click)="showCostItemDialog = false">
        <div class="dialog-panel" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2>{{editingItem ? 'Edit' : 'New'}} Cost Item</h2>
            <button class="btn-icon" (click)="showCostItemDialog = false"><mat-icon>close</mat-icon></button>
          </div>
          <div class="dialog-body">
            <div class="form-grid">
              <div class="form-group">
                <label>Expenditure Category</label>
                <select [(ngModel)]="itemForm.expenditureCategoryId" [disabled]="!!editingItem">
                  <option *ngFor="let c of categories" [ngValue]="c.id">{{c.name}}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Cost Item Name</label>
                <input [(ngModel)]="itemForm.name" placeholder="e.g. Salaries & Wages">
              </div>
              <div class="form-group">
                <label>Item Type</label>
                <select [(ngModel)]="itemForm.itemType">
                  <option value="Recurring">Recurring</option>
                  <option value="Contracted">Contracted</option>
                  <option value="Estimated">Estimated</option>
                  <option value="OneOff">One-Off</option>
                </select>
              </div>
              <div class="form-group">
                <label>VAT Indicator</label>
                <select [(ngModel)]="itemForm.vatIndicator">
                  <option value="StandardRated">Standard Rated (15%)</option>
                  <option value="ZeroRated">Zero Rated</option>
                  <option value="Exempt">Exempt</option>
                  <option value="OutOfScope">Out of Scope</option>
                </select>
              </div>
              <div class="form-group">
                <label>Basic Cost (R)</label>
                <input type="number" [(ngModel)]="itemForm.basicCost" step="0.01">
              </div>
              <div class="form-group">
                <label>Unit Rate (R)</label>
                <input type="number" [(ngModel)]="itemForm.unitRate" step="0.0001">
              </div>
              <div class="form-group">
                <label>Supplier Name</label>
                <input [(ngModel)]="itemForm.supplierName" placeholder="Optional">
              </div>
              <div class="form-group">
                <label>Contract Reference</label>
                <input [(ngModel)]="itemForm.contractReference" placeholder="Optional">
              </div>
              <div class="form-group">
                <label>Effective From</label>
                <input type="date" [(ngModel)]="itemForm.effectiveFrom">
              </div>
              <div class="form-group">
                <label>Effective To</label>
                <input type="date" [(ngModel)]="itemForm.effectiveTo" placeholder="Optional">
              </div>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn-secondary" (click)="showCostItemDialog = false">Cancel</button>
            <button class="btn-primary" (click)="saveItem()" [disabled]="saving">
              {{saving ? 'Saving...' : (editingItem ? 'Update' : 'Create')}}
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
    .btn-primary { display: flex; align-items: center; gap: 6px; padding: 10px 20px; background: #0f2b46; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn-primary:hover { background: #1a3a5c; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-secondary { padding: 10px 20px; background: white; color: #64748b; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn-icon { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; border-radius: 6px; display: flex; align-items: center; }
    .btn-icon:hover { background: #f1f5f9; color: #1e293b; }
    .btn-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
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
    .card-title-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; cursor: pointer; transition: background 0.15s; }
    .card-title-bar:hover { background: #f8fafc; }
    .card-title-bar h2 { font-size: 15px; font-weight: 600; color: #1e293b; margin: 0; }
    .card-body { padding: 0 20px 20px; }
    .svc-header { display: flex; align-items: center; gap: 10px; }
    .svc-type-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .cat-employeecosts { background: #e3f2fd; color: #1565c0; }
    .cat-bulkpurchases { background: #fff8e1; color: #e65100; }
    .cat-contractedservices { background: #e0f2f1; color: #00695c; }
    .cat-generalexpenses { background: #f3e5f5; color: #6a1b9a; }
    .cat-repairsandmaintenance { background: #fce4ec; color: #c62828; }
    .cat-otherexpenditure { background: #f1f5f9; color: #64748b; }
    .svc-code { font-size: 12px; color: #94a3b8; font-family: monospace; }
    .svc-meta { display: flex; align-items: center; gap: 10px; }
    .tariff-count { font-size: 12px; color: #64748b; font-weight: 500; }
    .dept-badge { font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th { padding: 10px 12px; text-align: left; font-weight: 600; color: #64748b; border-bottom: 2px solid #e8ecf1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .data-table tr:hover { background: #f8fafc; }
    .text-right { text-align: right !important; }
    .text-muted { color: #94a3b8; }
    .fw-600 { font-weight: 600; }
    .mono { font-family: 'SF Mono', ui-monospace, monospace; font-size: 12px; }
    .type-pill { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; background: #f1f5f9; color: #475569; }
    .vat-badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .vat-standardrated { background: #e3f2fd; color: #1565c0; }
    .vat-zerorated { background: #e8f5e9; color: #2e7d32; }
    .vat-exempt { background: #fff8e1; color: #e65100; }
    .vat-outofscope { background: #f1f5f9; color: #64748b; }
    .contract-ref { font-family: monospace; font-size: 11px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
    .variability-flag { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #e65100; background: #fff8e1; padding: 2px 8px; border-radius: 4px; }
    .variability-flag mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .status-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .status-approved { background: #e8f5e9; color: #1b5e20; }
    .status-draft { background: #f1f5f9; color: #64748b; }
    .empty-state { text-align: center; padding: 30px; color: #94a3b8; }
    .empty-state mat-icon { font-size: 32px; width: 32px; height: 32px; color: #cbd5e1; }
    .empty-state p { margin: 8px 0 0; font-size: 13px; }
    .dialog-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .dialog-panel { background: white; border-radius: 16px; width: 650px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
    .dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e8ecf1; }
    .dialog-header h2 { margin: 0; font-size: 18px; font-weight: 600; color: #1e293b; }
    .dialog-body { padding: 24px; }
    .dialog-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #e8ecf1; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-group input, .form-group select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #1e293b; outline: none; transition: border-color 0.2s; }
    .form-group input:focus, .form-group select:focus { border-color: #0f2b46; }
  `]
})
export class ExpenditurePage implements OnInit {
  categories: ExpenditureCategory[] = [];
  costItems: CostItem[] = [];
  kpiCards: any[] = [];
  expandedCat: number | null = null;
  showCostItemDialog = false;
  editingItem: CostItem | null = null;
  saving = false;
  itemForm: any = {};

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.api.getExpenditureCategories().subscribe(data => {
      this.categories = data;
      if (data.length) this.expandedCat = data[0].id;
      this.buildKpis();
      this.cdr.markForCheck();
    });
    this.api.getCostItems().subscribe(data => {
      this.costItems = data;
      this.buildKpis();
      this.cdr.markForCheck();
    });
  }

  buildKpis() {
    const avgCost = this.costItems.length ? this.costItems.reduce((s, ci) => s + ci.basicCost, 0) / this.costItems.length : 0;
    const totalAnnual = this.costItems.reduce((s, ci) => s + (ci.basicCost + ci.unitRate) * 12, 0);
    this.kpiCards = [
      { icon: 'category', label: 'Expenditure Categories', value: this.categories.length.toString(), subtitle: 'Active categories', colorClass: 'icon-blue' },
      { icon: 'receipt_long', label: 'Cost Items', value: this.costItems.filter(ci => ci.isApproved).length.toString(), subtitle: 'Approved items', colorClass: 'icon-green' },
      { icon: 'attach_money', label: 'Total Annual Cost', value: 'R ' + (totalAnnual / 1000000).toFixed(1) + 'M', subtitle: 'Projected expenditure', colorClass: 'icon-amber' },
      { icon: 'warning', label: 'Variability Flagged', value: this.costItems.filter(ci => ci.isVariabilityFlagged).length.toString(), subtitle: 'Items flagged', colorClass: 'icon-teal' },
    ];
  }

  toggleExpand(id: number) { this.expandedCat = this.expandedCat === id ? null : id; }

  getItemsForCategory(catId: number): CostItem[] {
    return this.costItems.filter(ci => ci.expenditureCategoryId === catId);
  }

  resetForm() {
    this.editingItem = null;
    this.itemForm = { expenditureCategoryId: this.categories[0]?.id, itemType: 'Recurring', vatIndicator: 'StandardRated', basicCost: 0, unitRate: 0, effectiveFrom: new Date().toISOString().split('T')[0] };
  }

  editItem(ci: CostItem) {
    this.editingItem = ci;
    this.itemForm = { expenditureCategoryId: ci.expenditureCategoryId, name: ci.name, itemType: ci.itemType, vatIndicator: ci.vatIndicator, basicCost: ci.basicCost, unitRate: ci.unitRate, supplierName: ci.supplierName, contractReference: ci.contractReference, effectiveFrom: ci.effectiveFrom?.split('T')[0], effectiveTo: ci.effectiveTo?.split('T')[0], isVariabilityFlagged: ci.isVariabilityFlagged, variabilityType: ci.variabilityType };
    this.showCostItemDialog = true;
  }

  saveItem() {
    this.saving = true;
    if (this.editingItem) {
      this.api.updateCostItem(this.editingItem.id, this.itemForm).subscribe({
        next: () => { this.saving = false; this.showCostItemDialog = false; this.editingItem = null; this.loadData(); },
        error: () => { this.saving = false; this.cdr.markForCheck(); }
      });
    } else {
      const form = { ...this.itemForm, financialYearId: 1, effectiveFrom: this.itemForm.effectiveFrom || new Date().toISOString() };
      this.api.createCostItem(form).subscribe({
        next: () => { this.saving = false; this.showCostItemDialog = false; this.itemForm = {}; this.loadData(); },
        error: () => { this.saving = false; this.cdr.markForCheck(); }
      });
    }
  }
}
