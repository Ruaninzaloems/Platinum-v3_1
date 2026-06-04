import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-work-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './work-order-list.component.html',
  styleUrls: ['./work-order-list.component.css']
})
export class WorkOrderListComponent implements OnInit {
  loading = signal(true);
  workOrders = signal<any[]>([]);
  woStatuses = signal<any[]>([]);
  woTypes = signal<any[]>([]);

  filterStatus = '';
  filterType = '';
  filterPriority = '';
  filterSearch = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterAsset = '';

  showCreateForm = signal(false);
  creating = signal(false);
  createForm: any = { workOrderTypeId: '', priority: 'Medium', workOrderDesc: '', assetRegisterItemId: null };

  constructor(
    private api: ApiService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadLookups();
    this.loadWorkOrders();
  }

  loadLookups() {
    var self = this;
    self.api.getWorkOrderStatuses().subscribe({ next: function(d: any) { self.woStatuses.set(d); }, error: function() {} });
    self.api.getWorkOrderTypes().subscribe({ next: function(d: any) { self.woTypes.set(d); }, error: function() {} });
  }

  loadWorkOrders() {
    var self = this;
    self.loading.set(true);
    var params: any = {};
    if (self.filterStatus) params['statusId'] = self.filterStatus;
    if (self.filterType) params['typeId'] = self.filterType;
    if (self.filterPriority) params['priority'] = self.filterPriority;
    if (self.filterDateFrom) params['dateFrom'] = self.filterDateFrom;
    if (self.filterDateTo) params['dateTo'] = self.filterDateTo;
    self.api.getAllWorkOrders(params).subscribe({
      next: function(d: any) { self.workOrders.set(d || []); self.loading.set(false); },
      error: function() { self.workOrders.set([]); self.loading.set(false); }
    });
  }

  applyFilters() {
    this.loadWorkOrders();
  }

  clearFilters() {
    this.filterStatus = '';
    this.filterType = '';
    this.filterPriority = '';
    this.filterSearch = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterAsset = '';
    this.loadWorkOrders();
  }

  get filtered() {
    var rows = this.workOrders();
    var s = this.filterSearch.toLowerCase();
    var assetFilter = this.filterAsset.toLowerCase().trim();
    if (s) {
      rows = rows.filter(function(w: any) {
        return (w.workOrderNumber || '').toLowerCase().includes(s) ||
          (w.workOrderDesc || '').toLowerCase().includes(s);
      });
    }
    if (assetFilter) {
      rows = rows.filter(function(w: any) {
        return String(w.assetId || '').toLowerCase().includes(assetFilter) ||
          (w.assetDescription || '').toLowerCase().includes(assetFilter) ||
          (w.assetBarcode || '').toLowerCase().includes(assetFilter);
      });
    }
    return rows;
  }

  openDetail(id: number) {
    this.router.navigate(['/maintenance/work-orders', id]);
  }

  openCreate() {
    this.createForm = { workOrderTypeId: '', priority: 'Medium', workOrderDesc: '', assetRegisterItemId: null };
    this.showCreateForm.set(true);
  }

  cancelCreate() {
    this.showCreateForm.set(false);
  }

  submitCreate() {
    var self = this;
    if (!self.createForm.workOrderDesc || !self.createForm.workOrderTypeId || !self.createForm.priority) {
      self.snackBar.open('Description, Type and Priority are required.', 'OK', { duration: 3000 });
      return;
    }
    self.creating.set(true);
    self.api.createMaintenanceWorkOrder({
      workOrderDesc: self.createForm.workOrderDesc,
      workOrderTypeId: Number(self.createForm.workOrderTypeId),
      priority: self.createForm.priority,
      assetRegisterItemId: self.createForm.assetRegisterItemId || null
    }).subscribe({
      next: function(wo: any) {
        self.creating.set(false);
        self.showCreateForm.set(false);
        self.router.navigate(['/maintenance/work-orders', wo.maintenanceWorksOrderId]);
      },
      error: function(e: any) {
        self.creating.set(false);
        var msg = e?.error?.error || 'Failed to create work order.';
        self.snackBar.open(msg, 'OK', { duration: 4000 });
      }
    });
  }

  getPriorityClass(priority: string) {
    var p = (priority || '').toLowerCase();
    if (p === 'critical') return 'priority-critical';
    if (p === 'high') return 'priority-high';
    if (p === 'medium') return 'priority-medium';
    return 'priority-low';
  }

  getStatusClass(statusId: number) {
    switch (statusId) {
      case 1: return 'status-draft';
      case 2: return 'status-submitted';
      case 3: return 'status-approved';
      case 4: return 'status-scheduled';
      case 5: return 'status-inprogress';
      case 6: return 'status-completed';
      case 7: return 'status-closed';
      case 8: return 'status-cancelled';
      default: return '';
    }
  }

  formatDate(d: string) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: '2-digit' });
  }

  goBack() {
    this.router.navigate(['/maintenance']);
  }
}
