import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-maintenance-request-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './maintenance-request-list.component.html',
  styleUrls: ['./maintenance-request-list.component.css']
})
export class MaintenanceRequestListComponent implements OnInit {
  items = signal<any[]>([]);
  loading = signal(true);
  serviceGroups = signal<any[]>([]);
  leadTimes = signal<any[]>([]);
  assetTypes = signal<any[]>([]);
  filteredCategories = signal<any[]>([]);
  filteredSubCategories = signal<any[]>([]);

  filterServiceGroup = '';
  filterApproved = '';
  filterDateFrom = '';
  filterDateTo = '';

  showNewForm = false;
  newRequest: any = this.emptyRequest();

  totalCount = computed(function(this: MaintenanceRequestListComponent) { return this.items().length; }.bind(this));
  pendingCount = computed(function(this: MaintenanceRequestListComponent) { return this.items().filter(function(i: any) { return !i.isApproved; }).length; }.bind(this));
  inProgressCount = computed(function(this: MaintenanceRequestListComponent) { return this.items().filter(function(i: any) { return i.isApproved && i.proposedClosingTime && new Date(i.proposedClosingTime) >= new Date(); }).length; }.bind(this));
  approvedCount = computed(function(this: MaintenanceRequestListComponent) { return this.items().filter(function(i: any) { return i.isApproved; }).length; }.bind(this));

  constructor(private api: ApiService, private snackBar: MatSnackBar, private router: Router) {}

  ngOnInit() {
    this.loadData();
    this.api.getMaintenanceServiceGroups().subscribe({
      next: function(this: MaintenanceRequestListComponent, res: any) { this.serviceGroups.set(Array.isArray(res) ? res : []); }.bind(this)
    });
    this.api.getMaintenanceLeadTimes().subscribe({
      next: function(this: MaintenanceRequestListComponent, res: any) { this.leadTimes.set(Array.isArray(res) ? res : []); }.bind(this)
    });
    this.api.getAssetTypes().subscribe({
      next: function(this: MaintenanceRequestListComponent, res: any) { this.assetTypes.set(Array.isArray(res) ? res : []); }.bind(this)
    });
  }

  onAssetTypeChange() {
    var self = this;
    var typeId = Number(this.newRequest.assetTypeId);
    this.newRequest.assetCategoryId = '';
    this.newRequest.assetSubCategoryId = null;
    this.filteredSubCategories.set([]);
    if (!typeId) {
      this.filteredCategories.set([]);
      return;
    }
    this.api.getAssetCategoriesList({ typeId: typeId }).subscribe({
      next: function(cats: any[]) { self.filteredCategories.set(cats || []); },
      error: function() {}
    });
  }

  onAssetCategoryChange() {
    var self = this;
    var catId = Number(this.newRequest.assetCategoryId);
    this.newRequest.assetSubCategoryId = null;
    if (!catId) {
      self.filteredSubCategories.set([]);
      return;
    }
    this.api.getAssetSubCategoriesList({ categoryId: catId }).subscribe({
      next: function(subs: any[]) { self.filteredSubCategories.set(subs || []); },
      error: function() {}
    });
  }

  loadData() {
    this.loading.set(true);
    const params: any = {};
    if (this.filterServiceGroup) params.serviceGroupId = this.filterServiceGroup;
    if (this.filterApproved !== '') params.isApproved = this.filterApproved;
    if (this.filterDateFrom) params.dateFrom = this.filterDateFrom;
    if (this.filterDateTo) params.dateTo = this.filterDateTo;
    this.api.getMaintenanceRequests(params).subscribe({
      next: function(this: MaintenanceRequestListComponent, res: any) {
        this.items.set(Array.isArray(res) ? res : []);
        this.loading.set(false);
      }.bind(this),
      error: function(this: MaintenanceRequestListComponent) { this.loading.set(false); }.bind(this)
    });
  }

  applyFilters() { this.loadData(); }

  clearFilters() {
    this.filterServiceGroup = '';
    this.filterApproved = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.loadData();
  }

  openRequest(item: any) {
    this.router.navigate(['/assets/maintenance/requests', item.requestId]);
  }

  emptyRequest() {
    return {
      assetServiceGroupId: '',
      assetTypeId: '',
      assetCategoryId: '',
      assetSubCategoryId: null,
      requestDate: new Date().toISOString().split('T')[0],
      leadTimeId: '',
      maintenanceDescription: '',
      planProjectItemId: 0
    };
  }

  openNewForm() {
    this.newRequest = this.emptyRequest();
    this.filteredCategories.set([]);
    this.filteredSubCategories.set([]);
    this.showNewForm = true;
  }

  closeNewForm() {
    this.showNewForm = false;
    this.newRequest = this.emptyRequest();
    this.filteredCategories.set([]);
    this.filteredSubCategories.set([]);
  }

  onLeadTimeChange() {
    if (this.newRequest.leadTimeId && this.newRequest.requestDate) {
      var ltId = Number(this.newRequest.leadTimeId);
      var lt = this.leadTimes().find(function(l: any) { return l.leadTimeId === ltId; });
      if (lt) {
        var rd = new Date(this.newRequest.requestDate);
        rd.setDate(rd.getDate() + lt.leadTimeDays);
        this.newRequest.proposedClosingTime = rd.toISOString().split('T')[0];
      }
    }
  }

  getProposedClosing(): string {
    if (this.newRequest.leadTimeId && this.newRequest.requestDate) {
      var ltId = Number(this.newRequest.leadTimeId);
      var lt = this.leadTimes().find(function(l: any) { return l.leadTimeId === ltId; });
      if (lt) {
        var rd = new Date(this.newRequest.requestDate);
        rd.setDate(rd.getDate() + lt.leadTimeDays);
        return rd.toISOString().split('T')[0];
      }
    }
    return '';
  }

  submitRequest() {
    if (!this.newRequest.assetServiceGroupId || !this.newRequest.assetTypeId ||
        !this.newRequest.assetCategoryId || !this.newRequest.leadTimeId ||
        !this.newRequest.maintenanceDescription) {
      this.snackBar.open('Please fill in all required fields', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    this.api.createMaintenanceRequest(this.newRequest).subscribe({
      next: function(this: MaintenanceRequestListComponent) {
        this.closeNewForm();
        this.loadData();
        this.snackBar.open('Maintenance request created successfully', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this),
      error: function(this: MaintenanceRequestListComponent) {
        this.snackBar.open('Failed to create maintenance request', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  pendingDelete = signal<any>(null);

  confirmDelete(item: any) { this.pendingDelete.set(item); }

  doDelete() {
    const item = this.pendingDelete();
    if (!item) return;
    this.api.deleteMaintenanceRequest(item.requestId).subscribe({
      next: function(this: MaintenanceRequestListComponent) {
        this.pendingDelete.set(null);
        this.loadData();
        this.snackBar.open('Maintenance request deleted', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  cancelDelete() { this.pendingDelete.set(null); }

  formatDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-ZA');
  }

  printRequest(item: any) {
    var self = this;
    this.snackBar.open('Loading data for print...', '', { duration: 2000, horizontalPosition: 'end', verticalPosition: 'top' });
    this.api.getMaintenanceRequest(item.requestId).subscribe({
      next: function(req: any) {
        self.api.getMaintenanceWorkOrders(item.requestId).subscribe({
          next: function(wos: any) {
            var woList = Array.isArray(wos) ? wos : [];
            if (woList.length === 0) {
              self.snackBar.open('No work orders to print.', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
              return;
            }
            var pending = woList.length;
            var detailsMap: Record<number, any[]> = {};
            for (var i = 0; i < woList.length; i++) {
              (function(wo: any) {
                self.api.getMaintenanceWorkOrderDetails(wo.maintenanceWorksOrderId).subscribe({
                  next: function(res: any) {
                    detailsMap[wo.maintenanceWorksOrderId] = Array.isArray(res) ? res : [];
                    pending--;
                    if (pending === 0) { self.openPrintWindow(req, woList, detailsMap); }
                  },
                  error: function() {
                    detailsMap[wo.maintenanceWorksOrderId] = [];
                    pending--;
                    if (pending === 0) { self.openPrintWindow(req, woList, detailsMap); }
                  }
                });
              })(woList[i]);
            }
          }
        });
      }
    });
  }

  private openPrintWindow(req: any, wos: any[], detailsMap: Record<number, any[]>) {
    var fmt = function(d: string) { return d ? new Date(d).toLocaleDateString('en-ZA') : '-'; };
    var fmtAmt = function(v: any) { return v != null ? 'R ' + parseFloat(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '-'; };

    var headerBlock = '<div class="req-header">' +
      '<div class="req-title">Maintenance Request MR-' + req.requestId + '</div>' +
      '<div class="req-grid">' +
        '<div class="rg-item"><span class="rg-label">Service Group</span><span class="rg-val">' + (req.serviceGroupDesc || '-') + '</span></div>' +
        '<div class="rg-item"><span class="rg-label">Asset Type</span><span class="rg-val">' + (req.assetTypeDesc || '-') + '</span></div>' +
        '<div class="rg-item"><span class="rg-label">Asset Category</span><span class="rg-val">' + (req.assetCategoryDesc || '-') + '</span></div>' +
        '<div class="rg-item"><span class="rg-label">Sub-Category</span><span class="rg-val">' + (req.subCategoryDesc || '-') + '</span></div>' +
        '<div class="rg-item"><span class="rg-label">Request Date</span><span class="rg-val">' + fmt(req.requestDate) + '</span></div>' +
        '<div class="rg-item"><span class="rg-label">Lead Time</span><span class="rg-val">' + (req.leadTimeDesc || '-') + '</span></div>' +
        '<div class="rg-item"><span class="rg-label">Proposed Closing</span><span class="rg-val">' + fmt(req.proposedClosingTime) + '</span></div>' +
        '<div class="rg-item"><span class="rg-label">Status</span><span class="rg-val rg-approved">Approved</span></div>' +
        '<div class="rg-item"><span class="rg-label">Asset</span><span class="rg-val">' + (req.assetId ? req.assetId + (req.assetDescription ? ' — ' + req.assetDescription : '') : '-') + '</span></div>' +
        '<div class="rg-item"><span class="rg-label">Date Captured</span><span class="rg-val">' + fmt(req.dateCaptured) + '</span></div>' +
      '</div>' +
      '<div class="rg-desc"><span class="rg-label">Description</span><span class="rg-val">' + (req.maintenanceDescription || '-') + '</span></div>' +
    '</div>';

    var pages = '';
    for (var i = 0; i < wos.length; i++) {
      var wo = wos[i];
      var details = detailsMap[wo.maintenanceWorksOrderId] || [];
      var lineRows = '';
      if (details.length === 0) {
        lineRows = '<tr><td colspan="7" style="text-align:center;color:#94a3b8;font-style:italic">No line items</td></tr>';
      } else {
        for (var j = 0; j < details.length; j++) {
          var d = details[j];
          lineRows += '<tr>' +
            '<td>' + (d.technicianNumber || '-') + '</td>' +
            '<td>' + (d.lineItemNumber || '-') + '</td>' +
            '<td>' + (d.itemType || '-') + '</td>' +
            '<td>' + (d.commodityDesc || '-') + '</td>' +
            '<td>' + (d.quantityOrdered != null ? d.quantityOrdered : '-') + '</td>' +
            '<td>' + (d.quantityReceived != null ? d.quantityReceived : '-') + '</td>' +
            '<td>' + (d.value != null ? fmtAmt(d.value) : '-') + '</td>' +
          '</tr>';
        }
      }
      if (i > 0) pages += '<div style="page-break-before:always"></div>';
      pages += headerBlock +
        '<div class="wo-block">' +
          '<div class="wo-title">Work Order WO-' + wo.maintenanceWorksOrderId + ' — ' + (wo.workOrderDesc || '') + '</div>' +
          '<div class="wo-grid">' +
            '<div class="rg-item"><span class="rg-label">Date</span><span class="rg-val">' + fmt(wo.workOrderDate) + '</span></div>' +
            '<div class="rg-item"><span class="rg-label">Requisition #</span><span class="rg-val">' + (wo.requisitionNumber || '-') + '</span></div>' +
            '<div class="rg-item"><span class="rg-label">Amount</span><span class="rg-val">' + fmtAmt(wo.amount) + '</span></div>' +
            '<div class="rg-item"><span class="rg-label">Debit Project</span><span class="rg-val">' + (wo.debitProjectName || '-') + '</span></div>' +
            '<div class="rg-item"><span class="rg-label">Debit SCOA</span><span class="rg-val">' + (wo.debitScoaDesc || '-') + '</span></div>' +
            '<div class="rg-item"><span class="rg-label">Credit Project</span><span class="rg-val">' + (wo.creditProjectName || '-') + '</span></div>' +
            '<div class="rg-item"><span class="rg-label">Credit SCOA</span><span class="rg-val">' + (wo.creditScoaDesc || '-') + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="lines-block">' +
          '<div class="lines-title">Line Items</div>' +
          '<table class="lines-table">' +
            '<thead><tr><th>Technician #</th><th>Line Item #</th><th>Type</th><th>Commodity</th><th>Qty Ordered</th><th>Qty Received</th><th>Value</th></tr></thead>' +
            '<tbody>' + lineRows + '</tbody>' +
          '</table>' +
        '</div>';
    }

    var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>MR-' + req.requestId + ' Print</title>' +
      '<style>' +
        'body{font-family:Arial,sans-serif;font-size:12px;color:#1e293b;margin:0;padding:20px}' +
        '.req-header{border:1.5px solid #1e40af;border-radius:6px;padding:14px 16px;margin-bottom:16px;background:#f0f7ff}' +
        '.req-title{font-size:16px;font-weight:700;color:#1e40af;margin-bottom:10px}' +
        '.req-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px 16px;margin-bottom:8px}' +
        '.rg-item{display:flex;flex-direction:column;gap:2px}' +
        '.rg-label{font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px}' +
        '.rg-val{font-size:12px;font-weight:500;color:#1e293b}' +
        '.rg-approved{color:#166534;font-weight:700}' +
        '.rg-desc{display:flex;flex-direction:column;gap:2px;margin-top:8px;padding-top:8px;border-top:1px solid #bfdbfe}' +
        '.wo-block{border:1px solid #cbd5e1;border-radius:6px;padding:12px 16px;margin-bottom:12px;background:#fafbfc}' +
        '.wo-title{font-size:13px;font-weight:700;color:#334155;margin-bottom:8px}' +
        '.wo-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px 16px}' +
        '.lines-block{margin-bottom:12px}' +
        '.lines-title{font-size:12px;font-weight:700;color:#475569;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #e2e8f0}' +
        '.lines-table{width:100%;border-collapse:collapse;font-size:11px}' +
        '.lines-table th{background:#f1f5f9;padding:6px 8px;text-align:left;font-weight:700;color:#475569;border:1px solid #e2e8f0;font-size:10px;text-transform:uppercase}' +
        '.lines-table td{padding:5px 8px;border:1px solid #e2e8f0;color:#334155}' +
        '.lines-table tr:nth-child(even) td{background:#f8fafc}' +
        '@media print{body{padding:10px}@page{margin:15mm}}' +
      '</style></head><body>' + pages + '</body></html>';

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
