import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../../services/api.service';
import { ServiceCategory, Tariff } from '../../../models/budget.models';

@Component({
  selector: 'app-tariffs-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatDialogModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Service Categories & Tariffs</h1>
          <p class="page-subtitle">Manage municipal service tariff structures (BILB1, BILB2)</p>
        </div>
        <button class="btn-primary" (click)="showTariffDialog = true">
          <mat-icon>add</mat-icon> New Tariff
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

      <div class="card-container" *ngFor="let svc of serviceCategories">
        <div class="card-title-bar" (click)="toggleExpand(svc.id)">
          <div class="svc-header">
            <span class="svc-type-badge" [ngClass]="'svc-' + svc.type.toLowerCase()">{{svc.type}}</span>
            <h2>{{svc.name}}</h2>
            <span class="svc-code">{{svc.code}}</span>
            <span class="svc-unit">{{svc.measurementUnit}}</span>
          </div>
          <div class="svc-meta">
            <span class="tariff-count">{{svc.tariffCount}} tariffs</span>
            <mat-icon>{{expandedSvc === svc.id ? 'expand_less' : 'expand_more'}}</mat-icon>
          </div>
        </div>
        <div class="card-body" *ngIf="expandedSvc === svc.id">
          <div class="tariff-table-wrap" *ngIf="getTariffsForService(svc.id).length; else noTariffs">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tariff Name</th>
                  <th>Property Category</th>
                  <th>Type</th>
                  <th class="text-right">Basic Charge</th>
                  <th class="text-right">Unit Rate</th>
                  <th>Block Range</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let t of getTariffsForService(svc.id)">
                  <td class="fw-600">{{t.name}}</td>
                  <td><span class="prop-badge" [ngClass]="'prop-' + t.propertyCategory.toLowerCase()">{{t.propertyCategory}}</span></td>
                  <td><span class="type-pill">{{t.tariffType}}</span></td>
                  <td class="text-right mono">R {{t.basicCharge | number:'1.2-2'}}</td>
                  <td class="text-right mono">R {{t.unitRate | number:'1.4-4'}}</td>
                  <td>
                    <span *ngIf="t.blockStart != null">{{t.blockStart}} - {{t.blockEnd ?? '∞'}} {{svc.measurementUnit}}</span>
                    <span *ngIf="t.blockStart == null" class="text-muted">N/A</span>
                  </td>
                  <td><span class="status-badge" [ngClass]="t.isApproved ? 'status-approved' : 'status-draft'">{{t.isApproved ? 'Approved' : 'Draft'}}</span></td>
                  <td>
                    <button class="btn-icon" (click)="editTariff(t)" title="Edit">
                      <mat-icon>edit</mat-icon>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #noTariffs>
            <div class="empty-state">
              <mat-icon>info_outline</mat-icon>
              <p>No tariffs defined for this service</p>
            </div>
          </ng-template>
        </div>
      </div>

      <div class="dialog-overlay" *ngIf="showTariffDialog" (click)="showTariffDialog = false">
        <div class="dialog-panel" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h2>{{editingTariff ? 'Edit' : 'New'}} Tariff</h2>
            <button class="btn-icon" (click)="showTariffDialog = false"><mat-icon>close</mat-icon></button>
          </div>
          <div class="dialog-body">
            <div class="form-grid">
              <div class="form-group">
                <label>Service Category</label>
                <select [(ngModel)]="tariffForm.serviceCategoryId" [disabled]="!!editingTariff">
                  <option *ngFor="let s of serviceCategories" [ngValue]="s.id">{{s.name}}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Tariff Name</label>
                <input [(ngModel)]="tariffForm.name" placeholder="e.g. Water - Residential">
              </div>
              <div class="form-group">
                <label>Property Category</label>
                <select [(ngModel)]="tariffForm.propertyCategory">
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Agricultural">Agricultural</option>
                  <option value="NGO">NGO</option>
                </select>
              </div>
              <div class="form-group">
                <label>Tariff Type</label>
                <select [(ngModel)]="tariffForm.tariffType">
                  <option value="Fixed">Fixed</option>
                  <option value="Tiered">Tiered</option>
                  <option value="Inclining">Inclining Block</option>
                </select>
              </div>
              <div class="form-group">
                <label>Basic Charge (R)</label>
                <input type="number" [(ngModel)]="tariffForm.basicCharge" step="0.01">
              </div>
              <div class="form-group">
                <label>Unit Rate (R)</label>
                <input type="number" [(ngModel)]="tariffForm.unitRate" step="0.0001">
              </div>
              <div class="form-group">
                <label>Block Start</label>
                <input type="number" [(ngModel)]="tariffForm.blockStart" step="0.01" placeholder="Optional">
              </div>
              <div class="form-group">
                <label>Block End</label>
                <input type="number" [(ngModel)]="tariffForm.blockEnd" step="0.01" placeholder="Optional">
              </div>
              <div class="form-group">
                <label>Effective From</label>
                <input type="date" [(ngModel)]="tariffForm.effectiveFrom">
              </div>
              <div class="form-group">
                <label>Effective To</label>
                <input type="date" [(ngModel)]="tariffForm.effectiveTo" placeholder="Optional">
              </div>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn-secondary" (click)="showTariffDialog = false">Cancel</button>
            <button class="btn-primary" (click)="saveTariff()" [disabled]="saving">
              {{saving ? 'Saving...' : (editingTariff ? 'Update' : 'Create')}}
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
    .btn-secondary:hover { background: #f8fafc; }
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
    .svc-water { background: #e3f2fd; color: #1565c0; }
    .svc-electricity { background: #fff8e1; color: #e65100; }
    .svc-sanitation { background: #e0f2f1; color: #00695c; }
    .svc-refuse { background: #fce4ec; color: #c62828; }
    .svc-propertyrates { background: #f3e5f5; color: #6a1b9a; }
    .svc-other { background: #f1f5f9; color: #64748b; }
    .svc-code { font-size: 12px; color: #94a3b8; font-family: monospace; }
    .svc-unit { font-size: 11px; color: #94a3b8; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }
    .svc-meta { display: flex; align-items: center; gap: 10px; }
    .tariff-count { font-size: 12px; color: #64748b; font-weight: 500; }

    .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .data-table th { padding: 10px 12px; text-align: left; font-weight: 600; color: #64748b; border-bottom: 2px solid #e8ecf1; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .data-table tr:hover { background: #f8fafc; }
    .text-right { text-align: right !important; }
    .text-muted { color: #94a3b8; }
    .fw-600 { font-weight: 600; }
    .mono { font-family: 'SF Mono', ui-monospace, monospace; font-size: 12px; }

    .prop-badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .prop-residential { background: #e8f5e9; color: #2e7d32; }
    .prop-commercial { background: #e3f2fd; color: #1565c0; }
    .prop-industrial { background: #fff3e0; color: #e65100; }
    .prop-agricultural { background: #f1f8e9; color: #558b2f; }
    .prop-ngo { background: #f3e5f5; color: #6a1b9a; }
    .type-pill { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; background: #f1f5f9; color: #475569; }
    .status-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .status-approved { background: #e8f5e9; color: #1b5e20; }
    .status-draft { background: #f1f5f9; color: #64748b; }
    .status-submitted { background: #fff3e0; color: #e65100; }

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
    .form-group label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-group input, .form-group select, .form-group textarea { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #1e293b; outline: none; transition: border-color 0.2s; }
    .form-group input:focus, .form-group select:focus { border-color: #0f2b46; }
  `]
})
export class TariffsPage implements OnInit {
  serviceCategories: ServiceCategory[] = [];
  tariffs: Tariff[] = [];
  kpiCards: any[] = [];
  expandedSvc: number | null = null;
  showTariffDialog = false;
  editingTariff: Tariff | null = null;
  saving = false;
  tariffForm: any = {};

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.api.getServiceCategories().subscribe(data => {
      this.serviceCategories = data;
      if (data.length) this.expandedSvc = data[0].id;
      this.buildKpis();
      this.cdr.markForCheck();
    });
    this.api.getTariffs().subscribe(data => {
      this.tariffs = data;
      this.buildKpis();
      this.cdr.markForCheck();
    });
  }

  buildKpis() {
    const avgRate = this.tariffs.length ? this.tariffs.reduce((s, t) => s + t.unitRate, 0) / this.tariffs.length : 0;
    this.kpiCards = [
      { icon: 'category', label: 'Service Categories', value: this.serviceCategories.length.toString(), subtitle: 'Active services', colorClass: 'icon-blue' },
      { icon: 'receipt_long', label: 'Active Tariffs', value: this.tariffs.filter(t => t.isApproved).length.toString(), subtitle: 'Approved tariffs', colorClass: 'icon-green' },
      { icon: 'attach_money', label: 'Avg Unit Rate', value: 'R ' + avgRate.toFixed(4), subtitle: 'Across all tariffs', colorClass: 'icon-amber' },
      { icon: 'verified', label: 'Approved', value: this.tariffs.filter(t => t.isApproved).length + '/' + this.tariffs.length, subtitle: 'Tariff approval rate', colorClass: 'icon-teal' },
    ];
  }

  toggleExpand(id: number) {
    this.expandedSvc = this.expandedSvc === id ? null : id;
  }

  getTariffsForService(serviceCategoryId: number): Tariff[] {
    return this.tariffs.filter(t => t.serviceCategoryId === serviceCategoryId);
  }

  editTariff(t: Tariff) {
    this.editingTariff = t;
    this.tariffForm = {
      serviceCategoryId: t.serviceCategoryId,
      name: t.name,
      propertyCategory: t.propertyCategory,
      tariffType: t.tariffType,
      basicCharge: t.basicCharge,
      unitRate: t.unitRate,
      blockStart: t.blockStart,
      blockEnd: t.blockEnd,
      effectiveFrom: t.effectiveFrom?.split('T')[0],
      effectiveTo: t.effectiveTo?.split('T')[0],
      financialYearId: t.financialYearId,
    };
    this.showTariffDialog = true;
  }

  saveTariff() {
    this.saving = true;
    if (this.editingTariff) {
      this.api.updateTariff(this.editingTariff.id, this.tariffForm).subscribe({
        next: () => { this.saving = false; this.showTariffDialog = false; this.editingTariff = null; this.loadData(); },
        error: () => { this.saving = false; this.cdr.markForCheck(); }
      });
    } else {
      const form = { ...this.tariffForm, financialYearId: 1, effectiveFrom: this.tariffForm.effectiveFrom || new Date().toISOString() };
      this.api.createTariff(form).subscribe({
        next: () => { this.saving = false; this.showTariffDialog = false; this.tariffForm = {}; this.loadData(); },
        error: () => { this.saving = false; this.cdr.markForCheck(); }
      });
    }
  }
}
