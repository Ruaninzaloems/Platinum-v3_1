import { Component, OnInit, signal, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-planned-maintenance-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './planned-maintenance-list.component.html',
  styleUrls: ['./planned-maintenance-list.component.css']
})
export class PlannedMaintenanceListComponent implements OnInit {
  activeTab = signal<'plans' | 'compliance' | 'deferred' | 'budget'>('plans');

  items = signal<any[]>([]);
  loading = signal(true);
  maintTypes = signal<any[]>([]);
  frequencies = signal<any[]>([]);
  assetClasses = signal<any[]>([]);

  filterType = '';
  filterActive = 'true';
  filterSearch = '';
  filterAssetClass = '';
  filterDepartment = '';
  filterFinYear = '';

  departments = signal<any[]>([]);
  budgetGroupMode = signal<'type' | 'assetClass'>('type');

  kpi = signal<any>(null);
  kpiLoading = signal(false);

  complianceRows = signal<any[]>([]);
  complianceLoading = signal(false);

  deferredRows = signal<any[]>([]);
  deferredLoading = signal(false);
  deferredSortCol = signal<'daysOverdue' | 'scheduledDate' | 'estimatedCost' | 'planName'>('daysOverdue');
  deferredSortDesc = signal(true);

  budgetPlans = signal<any[]>([]);
  budgetByType = signal<any[]>([]);
  budgetByAssetClass = signal<any[]>([]);
  budgetLoading = signal(false);

  filteredItems: Signal<any[]> = computed(function(this: PlannedMaintenanceListComponent): any[] {
    var list: any[] = this.items();
    if (this.filterSearch) {
      var q = this.filterSearch.toLowerCase();
      list = list.filter(function(i: any) {
        return (i.planName || '').toLowerCase().includes(q) ||
               (i.assetDescription || '').toLowerCase().includes(q) ||
               (i.assetBarcode || '').toLowerCase().includes(q);
      });
    }
    return list;
  }.bind(this));

  totalCount = computed(function(this: PlannedMaintenanceListComponent) { return this.filteredItems().length; }.bind(this));
  activeCount = computed(function(this: PlannedMaintenanceListComponent) { return this.filteredItems().filter(function(i: any) { return i.isActive; }).length; }.bind(this));
  overdueCount = computed(function(this: PlannedMaintenanceListComponent) {
    var today = new Date().toISOString().split('T')[0];
    return this.filteredItems().filter(function(i: any) { return i.nextScheduledDate && i.nextScheduledDate < today; }).length;
  }.bind(this));

  sortedDeferred: Signal<any[]> = computed(function(this: PlannedMaintenanceListComponent): any[] {
    var col = this.deferredSortCol();
    var desc = this.deferredSortDesc();
    var list: any[] = this.deferredRows().slice();
    list.sort(function(a: any, b: any) {
      var av = a[col] ?? 0;
      var bv = b[col] ?? 0;
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return desc ? 1 : -1;
      if (av > bv) return desc ? -1 : 1;
      return 0;
    });
    return list;
  }.bind(this));

  budgetTotals: Signal<{ estimated: number; actual: number; variance: number }> = computed(function(this: PlannedMaintenanceListComponent): { estimated: number; actual: number; variance: number } {
    var rows = this.budgetPlans();
    var estimated = rows.reduce(function(sum: number, r: any) { return sum + (r.estimatedCost || 0); }, 0);
    var actual = rows.reduce(function(sum: number, r: any) { return sum + (r.actualCost || 0); }, 0);
    return { estimated, actual, variance: actual - estimated };
  }.bind(this));

  constructor(private api: ApiService, private snackBar: MatSnackBar, private router: Router) {}

  ngOnInit() {
    this.loadData();
    this.loadKpi();
    var self = this;
    this.api.getMaintTypes().subscribe({
      next: function(res: any) { self.maintTypes.set(Array.isArray(res) ? res : []); }
    });
    this.api.getMaintFrequencies().subscribe({
      next: function(res: any) { self.frequencies.set(Array.isArray(res) ? res : []); }
    });
    this.api.getAssetClassesList().subscribe({
      next: function(res: any) { self.assetClasses.set(Array.isArray(res) ? res : (res?.data || [])); }
    });
    this.api.getDepartments().subscribe({
      next: function(res: any) { self.departments.set(Array.isArray(res) ? res : []); }
    });
  }

  openCreateWizard() {
    this.router.navigate(['/assets/maintenance/planned/create']);
  }

  get currentFinYear(): number {
    var d = new Date();
    return d.getMonth() >= 6 ? d.getFullYear() + 1 : d.getFullYear();
  }

  get finYearOptions(): { label: string; value: number }[] {
    var cy = this.currentFinYear;
    var opts = [];
    for (var i = cy + 1; i >= cy - 4; i--) {
      opts.push({ label: (i - 1) + '/' + i, value: i });
    }
    return opts;
  }

  private getFilterParams(): { maintTypeId?: number; assetClassId?: number; departmentId?: number; finYear?: number } {
    var params: any = {};
    if (this.filterType)       params.maintTypeId  = Number(this.filterType);
    if (this.filterAssetClass) params.assetClassId = Number(this.filterAssetClass);
    if (this.filterDepartment) params.departmentId = Number(this.filterDepartment);
    if (this.filterFinYear)    params.finYear      = Number(this.filterFinYear);
    return params;
  }

  loadData() {
    this.loading.set(true);
    var params: any = {};
    if (this.filterActive !== '') params.isActive = this.filterActive === 'true';
    if (this.filterType)          params.maintTypeId  = Number(this.filterType);
    if (this.filterAssetClass)    params.assetClassId = Number(this.filterAssetClass);
    if (this.filterDepartment)    params.departmentId = Number(this.filterDepartment);
    if (this.filterFinYear)       params.finYear      = Number(this.filterFinYear);
    var self = this;
    this.api.getPlannedMaintPlans(params).subscribe({
      next: function(res: any) { self.items.set(Array.isArray(res) ? res : []); self.loading.set(false); },
      error: function() {
        self.loading.set(false);
        self.snackBar.open('Failed to load plans', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  loadKpi() {
    this.kpiLoading.set(true);
    var fp = this.getFilterParams();
    var self = this;
    this.api.getPlannedMaintKpiSummary(fp.maintTypeId, fp.assetClassId, fp.departmentId, fp.finYear).subscribe({
      next: function(res: any) { self.kpi.set(res); self.kpiLoading.set(false); },
      error: function() { self.kpiLoading.set(false); }
    });
  }

  loadCompliance() {
    this.complianceLoading.set(true);
    var fp = this.getFilterParams();
    var self = this;
    this.api.getPlannedMaintCompliance(fp.maintTypeId, fp.assetClassId, fp.departmentId, fp.finYear).subscribe({
      next: function(res: any) { self.complianceRows.set(Array.isArray(res) ? res : []); self.complianceLoading.set(false); },
      error: function() { self.complianceLoading.set(false); }
    });
  }

  loadDeferred() {
    this.deferredLoading.set(true);
    var fp = this.getFilterParams();
    var self = this;
    this.api.getPlannedMaintDeferredMaintenance(fp.maintTypeId, fp.assetClassId, fp.departmentId, fp.finYear).subscribe({
      next: function(res: any) { self.deferredRows.set(Array.isArray(res) ? res : []); self.deferredLoading.set(false); },
      error: function() { self.deferredLoading.set(false); }
    });
  }

  loadBudget() {
    this.budgetLoading.set(true);
    var fp = this.getFilterParams();
    var self = this;
    this.api.getPlannedMaintBudgetVsActual(fp.maintTypeId, fp.assetClassId, fp.departmentId, fp.finYear).subscribe({
      next: function(res: any) {
        self.budgetPlans.set(Array.isArray(res?.plans) ? res.plans : []);
        self.budgetByType.set(Array.isArray(res?.byType) ? res.byType : []);
        self.budgetByAssetClass.set(Array.isArray(res?.byAssetClass) ? res.byAssetClass : []);
        self.budgetLoading.set(false);
      },
      error: function() { self.budgetLoading.set(false); }
    });
  }

  setTab(tab: 'plans' | 'compliance' | 'deferred' | 'budget') {
    this.activeTab.set(tab);
    if (tab === 'compliance' && this.complianceRows().length === 0) this.loadCompliance();
    if (tab === 'deferred'   && this.deferredRows().length === 0)   this.loadDeferred();
    if (tab === 'budget'     && this.budgetPlans().length === 0)     this.loadBudget();
  }

  onFilterChange() {
    this.complianceRows.set([]);
    this.deferredRows.set([]);
    this.budgetPlans.set([]); this.budgetByType.set([]); this.budgetByAssetClass.set([]);
    this.loadData();
    this.loadKpi();
    var tab = this.activeTab();
    if (tab === 'compliance') this.loadCompliance();
    if (tab === 'deferred')   this.loadDeferred();
    if (tab === 'budget')     this.loadBudget();
  }

  sortDeferred(col: 'daysOverdue' | 'scheduledDate' | 'estimatedCost' | 'planName') {
    if (this.deferredSortCol() === col) {
      this.deferredSortDesc.set(!this.deferredSortDesc());
    } else {
      this.deferredSortCol.set(col);
      this.deferredSortDesc.set(col === 'daysOverdue' || col === 'estimatedCost');
    }
  }

  sortIcon(col: string): string {
    if (this.deferredSortCol() !== col) return 'unfold_more';
    return this.deferredSortDesc() ? 'arrow_downward' : 'arrow_upward';
  }

  goToDetail(plan: any) {
    this.router.navigate(['/assets/maintenance/planned', plan.planId]);
  }

  getStatusBadge(plan: any): string {
    if (!plan.isActive) return 'inactive';
    var today = new Date().toISOString().split('T')[0];
    if (plan.nextScheduledDate && plan.nextScheduledDate < today) return 'overdue';
    if (plan.nextScheduledDate) return 'scheduled';
    return 'no-schedule';
  }

  getStatusLabel(plan: any): string {
    var s = this.getStatusBadge(plan);
    if (s === 'inactive') return 'Inactive';
    if (s === 'overdue') return 'Overdue';
    if (s === 'scheduled') return 'Scheduled';
    return 'No Schedule';
  }

  formatDate(d: string | null | undefined): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-ZA');
  }

  formatCost(v: any): string {
    if (v == null || v === '') return '—';
    return 'R ' + Number(v).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private esc(s: any): string {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  ragClass(rag: string): string {
    if (rag === 'green') return 'rag-green';
    if (rag === 'amber') return 'rag-amber';
    return 'rag-red';
  }

  ragLabel(rag: string): string {
    if (rag === 'green') return 'Compliant';
    if (rag === 'amber') return 'At Risk';
    return 'Non-Compliant';
  }

  varianceClass(variance: number): string {
    return variance <= 0 ? 'var-under' : 'var-over';
  }

  printCompliance() {
    var rows = this.complianceRows();
    if (!rows.length) { this.snackBar.open('No data to print', 'OK', { duration: 3000 }); return; }
    var self = this;
    var fmt = function(d: any) { return d ? new Date(d).toLocaleDateString('en-ZA') : '—'; };
    var tableRows = rows.map(function(r: any) {
      var ragColor = r.ragStatus === 'green' ? '#166534' : r.ragStatus === 'amber' ? '#92400e' : '#991b1b';
      var ragBg = r.ragStatus === 'green' ? '#dcfce7' : r.ragStatus === 'amber' ? '#fef3c7' : '#fee2e2';
      var ragText = r.ragStatus === 'green' ? 'Compliant' : r.ragStatus === 'amber' ? 'At Risk' : 'Non-Compliant';
      return '<tr><td>' + self.esc(r.assetId ? String(r.assetId) : '—') + '</td><td>' + self.esc(r.assetBarcode || '—') + '</td><td>' + self.esc(r.assetDescription || '—') + '</td>' +
        '<td>' + self.esc(r.assetClassDesc || '—') + '</td><td>' + self.esc(r.planName || 'No plan') + '</td>' +
        '<td>' + self.esc(r.maintenanceTypeDesc) + '</td><td>' + self.esc(r.frequencyDesc) + '</td>' +
        '<td>' + fmt(r.lastCompletionDate) + '</td><td>' + fmt(r.nextDueDate) + '</td>' +
        '<td style="text-align:center">' + Number(r.overdueCount) + '</td>' +
        '<td><span style="background:' + ragBg + ';color:' + ragColor + ';padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">' + ragText + '</span></td></tr>';
    }).join('');
    var html = self.buildPrintHtml('Planned Maintenance — Compliance Report',
      '<table style="width:100%;border-collapse:collapse;font-size:11px">' +
      '<thead><tr style="background:#f1f5f9">' +
      ['Asset ID','Barcode','Asset','Asset Class','Plan','Type','Frequency','Last Completed','Next Due','Overdue Count','Status'].map(function(h: string) {
        return '<th style="padding:6px 8px;text-align:left;border:1px solid #e2e8f0;font-size:10px;text-transform:uppercase">' + h + '</th>';
      }).join('') + '</tr></thead><tbody>' + tableRows + '</tbody></table>');
    self.openPrint(html);
  }

  printDeferred() {
    var rows = this.sortedDeferred();
    if (!rows.length) { this.snackBar.open('No data to print', 'OK', { duration: 3000 }); return; }
    var self = this;
    var fmt = function(d: any) { return d ? new Date(d).toLocaleDateString('en-ZA') : '—'; };
    var fmtC = function(v: any) { return v == null ? '—' : 'R ' + Number(v).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var tableRows = rows.map(function(r: any) {
      return '<tr><td style="color:' + (r.daysOverdue > 30 ? '#991b1b' : '#92400e') + ';font-weight:700">' + Number(r.daysOverdue) + '</td>' +
        '<td>' + self.esc(r.planName) + '</td><td>' + self.esc(r.assetBarcode || '—') + '</td><td>' + self.esc(r.assetDescription || '—') + '</td>' +
        '<td>' + self.esc(r.maintenanceTypeDesc) + '</td><td>' + self.esc(r.frequencyDesc) + '</td>' +
        '<td>' + fmt(r.scheduledDate) + '</td><td>' + fmtC(r.estimatedCost) + '</td>' +
        '<td>' + self.esc(r.notes || '—') + '</td></tr>';
    }).join('');
    var html = self.buildPrintHtml('Planned Maintenance — Deferred Maintenance Report (' + rows.length + ' entries)',
      '<table style="width:100%;border-collapse:collapse;font-size:11px">' +
      '<thead><tr style="background:#f1f5f9">' +
      ['Days Overdue','Plan Name','Barcode','Asset','Type','Frequency','Scheduled Date','Est. Cost','Notes'].map(function(h: string) {
        return '<th style="padding:6px 8px;text-align:left;border:1px solid #e2e8f0;font-size:10px;text-transform:uppercase">' + h + '</th>';
      }).join('') + '</tr></thead><tbody>' + tableRows + '</tbody></table>');
    self.openPrint(html);
  }

  printBudget() {
    var plans = this.budgetPlans();
    if (!plans.length) { this.snackBar.open('No data to print', 'OK', { duration: 3000 }); return; }
    var self = this;
    var fmtC = function(v: any) { return v == null ? '—' : 'R ' + Number(v).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var byType = this.budgetByType();
    var summaryRows = byType.map(function(g: any) {
      var varColor = g.variance > 0 ? '#991b1b' : '#166534';
      return '<tr><td><strong>' + self.esc(g.groupKey) + '</strong></td>' +
        '<td>' + g.planCount + '</td>' +
        '<td>' + fmtC(g.estimatedCost) + '</td><td>' + fmtC(g.actualCost) + '</td>' +
        '<td style="color:' + varColor + ';font-weight:700">' + fmtC(g.variance) + '</td>' +
        '<td>' + g.completedEntries + '/' + g.totalEntries + '</td></tr>';
    }).join('');
    var detailRows = plans.map(function(r: any) {
      var varColor = r.variance > 0 ? '#991b1b' : '#166534';
      return '<tr><td>' + self.esc(r.maintenanceTypeDesc) + '</td><td>' + self.esc(r.planName) + '</td>' +
        '<td>' + self.esc(r.assetDescription || '—') + '</td>' +
        '<td>' + fmtC(r.estimatedCost) + '</td><td>' + fmtC(r.actualCost) + '</td>' +
        '<td style="color:' + varColor + ';font-weight:700">' + fmtC(r.variance) + '</td>' +
        '<td style="color:' + varColor + ';font-weight:700">' + (r.estimatedCost ? (r.variancePct > 0 ? '+' : '') + r.variancePct + '%' : '—') + '</td>' +
        '<td>' + r.completedEntries + '/' + r.totalEntries + '</td></tr>';
    }).join('');
    var totals = this.budgetTotals();
    var html = self.buildPrintHtml('Planned Maintenance — Budget vs Actual Report',
      '<h3 style="font-size:13px;margin:0 0 8px;color:#475569">Summary by Type</h3>' +
      '<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:24px">' +
      '<thead><tr style="background:#f1f5f9">' +
      ['Type','Plans','Estimated','Actual','Variance','Completed/Total'].map(function(h: string) {
        return '<th style="padding:6px 8px;text-align:left;border:1px solid #e2e8f0;font-size:10px;text-transform:uppercase">' + h + '</th>';
      }).join('') + '</tr></thead><tbody>' + summaryRows + '</tbody>' +
      '<tfoot><tr style="font-weight:700;background:#f8fafc"><td>TOTAL</td><td>' + plans.length + '</td>' +
      '<td>' + fmtC(totals.estimated) + '</td><td>' + fmtC(totals.actual) + '</td>' +
      '<td style="color:' + (totals.variance > 0 ? '#991b1b' : '#166534') + '">' + fmtC(totals.variance) + '</td><td></td></tr></tfoot>' +
      '</table>' +
      '<h3 style="font-size:13px;margin:0 0 8px;color:#475569">Detail by Plan</h3>' +
      '<table style="width:100%;border-collapse:collapse;font-size:11px">' +
      '<thead><tr style="background:#f1f5f9">' +
      ['Type','Plan Name','Asset','Estimated','Actual','Variance','Var %','Completed/Total'].map(function(h: string) {
        return '<th style="padding:6px 8px;text-align:left;border:1px solid #e2e8f0;font-size:10px;text-transform:uppercase">' + h + '</th>';
      }).join('') + '</tr></thead><tbody>' + detailRows + '</tbody></table>');
    self.openPrint(html);
  }

  private buildPrintHtml(title: string, body: string): string {
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + title + '</title>' +
      '<style>body{font-family:Arial,sans-serif;font-size:12px;color:#1e293b;margin:0;padding:20px}' +
      'h2{font-size:16px;margin:0 0 4px}p.subtitle{font-size:11px;color:#64748b;margin:0 0 16px}' +
      'td{padding:5px 8px;border:1px solid #e2e8f0;color:#334155;vertical-align:top}' +
      'tr:nth-child(even) td{background:#f8fafc}' +
      '@media print{body{padding:10px}@page{margin:15mm}}</style>' +
      '</head><body><h2>' + title + '</h2>' +
      '<p class="subtitle">Mnquma Local Municipality (EC122) — Printed ' + new Date().toLocaleDateString('en-ZA') + '</p>' +
      body + '</body></html>';
  }

  private openPrint(html: string) {
    var win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      var w = win;
      setTimeout(function() { w.print(); }, 500);
    }
  }
}
