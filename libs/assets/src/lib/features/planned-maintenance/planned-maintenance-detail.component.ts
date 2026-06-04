import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-planned-maintenance-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './planned-maintenance-detail.component.html',
  styleUrls: ['./planned-maintenance-detail.component.css']
})
export class PlannedMaintenanceDetailComponent implements OnInit {
  planId = 0;
  loading = signal(true);
  plan = signal<any>(null);
  activeTab = signal<'details' | 'assets' | 'schedule' | 'workorders'>('details');

  maintTypes = signal<any[]>([]);
  frequencies = signal<any[]>([]);
  planProjects = signal<any[]>([]);
  debitScoaItems = signal<any[]>([]);

  form: any = {};
  saving = signal(false);

  schedule = signal<any[]>([]);
  scheduleLoading = signal(false);
  generateCount = 12;
  generating = signal(false);
  editingSchedule = signal<any>(null);
  scheduleForm: any = {};

  planAssets = signal<any[]>([]);
  assetsLoading = signal(false);
  showAddAssetPanel = signal(false);
  addAssetSearchTerm = '';
  addAssetShowDropdown = false;
  addAssetResults = signal<any[]>([]);
  addAssetSelected = signal<any>(null);
  addingAsset = signal(false);
  private addAssetSearchDebounce: any = null;

  workOrders = signal<any[]>([]);
  workOrdersLoading = signal(false);

  showRaiseWoForm = signal(false);
  raiseWoEntry = signal<any>(null);
  raiseWoForm: any = {};
  woSubmitting = signal(false);
  woDebitScoaItems = signal<any[]>([]);
  serviceGroups = signal<any[]>([]);
  woPlanProjects = signal<any[]>([]);

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.planId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPlan();
    this.loadLookups();
  }

  loadPlan() {
    this.loading.set(true);
    this.api.getPlannedMaintPlan(this.planId).subscribe({
      next: function(this: PlannedMaintenanceDetailComponent, res: any) {
        this.plan.set(res.plan || res);
        this.schedule.set(Array.isArray(res.schedule) ? res.schedule : []);
        var p = res.plan || res;
        this.form = { ...p };
        if (this.form.startDate) {
          this.form.startDate = new Date(this.form.startDate).toISOString().split('T')[0];
        }
        var self = this;
        if (p.debitProjectId) {
          this.api.getPlanProjectItems(Number(p.debitProjectId)).subscribe({
            next: function(items: any) {
              self.debitScoaItems.set(Array.isArray(items) ? items : []);
            }
          });
        }
        this.loading.set(false);
        this.loadWorkOrders();
      }.bind(this),
      error: function(this: PlannedMaintenanceDetailComponent) {
        this.loading.set(false);
        this.snackBar.open('Failed to load plan', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  loadLookups() {
    this.api.getMaintTypes().subscribe({
      next: function(this: PlannedMaintenanceDetailComponent, res: any) { this.maintTypes.set(Array.isArray(res) ? res : []); }.bind(this)
    });
    this.api.getMaintFrequencies().subscribe({
      next: function(this: PlannedMaintenanceDetailComponent, res: any) { this.frequencies.set(Array.isArray(res) ? res : []); }.bind(this)
    });
    this.api.getPlanProjects().subscribe({
      next: function(this: PlannedMaintenanceDetailComponent, res: any) {
        var list = Array.isArray(res) ? res : [];
        this.planProjects.set(list);
        this.woPlanProjects.set(list);
      }.bind(this)
    });
    this.api.getMaintenanceServiceGroups().subscribe({
      next: function(this: PlannedMaintenanceDetailComponent, res: any) { this.serviceGroups.set(Array.isArray(res) ? res : []); }.bind(this)
    });
  }

  setTab(tab: 'details' | 'assets' | 'schedule' | 'workorders') {
    this.activeTab.set(tab);
    if (tab === 'assets') this.loadPlanAssets();
    if (tab === 'schedule') this.loadSchedule();
    if (tab === 'workorders') this.loadWorkOrders();
  }

  loadPlanAssets() {
    this.assetsLoading.set(true);
    var self = this;
    this.api.getPlannedMaintPlanAssets(this.planId).subscribe({
      next: function(res: any) {
        self.planAssets.set(Array.isArray(res) ? res : []);
        self.assetsLoading.set(false);
      },
      error: function() { self.assetsLoading.set(false); }
    });
  }

  openAddAssetPanel() {
    this.addAssetSearchTerm = '';
    this.addAssetResults.set([]);
    this.addAssetSelected.set(null);
    this.showAddAssetPanel.set(true);
  }

  closeAddAssetPanel() {
    this.showAddAssetPanel.set(false);
    this.addAssetSearchTerm = '';
    this.addAssetResults.set([]);
    this.addAssetSelected.set(null);
  }

  onAddAssetSearch(event: Event) {
    var val = (event.target as HTMLInputElement).value;
    this.addAssetSearchTerm = val;
    this.addAssetShowDropdown = true;
    if (this.addAssetSearchDebounce) clearTimeout(this.addAssetSearchDebounce);
    if (!val || val.length < 1) { this.addAssetResults.set([]); return; }
    var self = this;
    this.addAssetSearchDebounce = setTimeout(function() {
      self.api.getPlannedMaintPreviewAssets({ search: val, pageSize: 20 }).subscribe({
        next: function(resp: any) {
          var items = resp?.data || resp || [];
          self.addAssetResults.set(Array.isArray(items) ? items : []);
        },
        error: function() { self.addAssetResults.set([]); }
      });
    }, 250);
  }

  closeAddAssetDropdown() {
    var self = this;
    setTimeout(function() { self.addAssetShowDropdown = false; }, 150);
  }

  selectAddAsset(asset: any) {
    this.addAssetSelected.set(asset);
    this.addAssetSearchTerm = (asset.barcode || asset.assetRegisterItemId) + (asset.description ? ' – ' + asset.description : '');
    this.addAssetShowDropdown = false;
    this.addAssetResults.set([]);
  }

  clearAddAsset() {
    this.addAssetSelected.set(null);
    this.addAssetSearchTerm = '';
    this.addAssetResults.set([]);
  }

  confirmAddAsset() {
    var asset = this.addAssetSelected();
    if (!asset) return;
    this.addingAsset.set(true);
    var self = this;
    this.api.addPlannedMaintPlanAsset(this.planId, asset.assetRegisterItemId).subscribe({
      next: function() {
        self.addingAsset.set(false);
        self.closeAddAssetPanel();
        self.loadPlanAssets();
        self.snackBar.open('Asset added to plan', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      },
      error: function(err: any) {
        self.addingAsset.set(false);
        var msg = err?.error?.error || 'Failed to add asset';
        self.snackBar.open(msg, 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  removeAssetFromPlan(asset: any) {
    if (!confirm('Remove this asset from the plan?')) return;
    var self = this;
    this.api.removePlannedMaintPlanAsset(this.planId, asset.assetRegisterItemId).subscribe({
      next: function() {
        self.loadPlanAssets();
        self.snackBar.open('Asset removed', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      },
      error: function() {
        self.snackBar.open('Failed to remove asset', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  savePlan() {
    if (!this.form.planName) {
      this.snackBar.open('Plan name is required', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    this.saving.set(true);
    this.api.updatePlannedMaintPlan(this.planId, this.form).subscribe({
      next: function(this: PlannedMaintenanceDetailComponent, res: any) {
        this.plan.set(res);
        this.form = { ...res };
        if (this.form.startDate) {
          this.form.startDate = new Date(this.form.startDate).toISOString().split('T')[0];
        }
        this.saving.set(false);
        this.snackBar.open('Plan saved successfully', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this),
      error: function(this: PlannedMaintenanceDetailComponent) {
        this.saving.set(false);
        this.snackBar.open('Failed to save plan', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  deletePlan() {
    if (!confirm('Delete this maintenance plan and all its schedule entries? This cannot be undone.')) return;
    this.api.deletePlannedMaintPlan(this.planId).subscribe({
      next: function(this: PlannedMaintenanceDetailComponent) {
        this.snackBar.open('Plan deleted', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        this.router.navigate(['/maintenance/planned']);
      }.bind(this),
      error: function(this: PlannedMaintenanceDetailComponent) {
        this.snackBar.open('Failed to delete plan', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  onProjectChange() {
    this.form.planProjectItemId = null;
    this.debitScoaItems.set([]);
    if (!this.form.debitProjectId) return;
    var self = this;
    this.api.getPlanProjectItems(Number(this.form.debitProjectId)).subscribe({
      next: function(res: any) { self.debitScoaItems.set(Array.isArray(res) ? res : []); }
    });
  }

  loadSchedule() {
    this.scheduleLoading.set(true);
    this.api.getPlannedMaintSchedule(this.planId).subscribe({
      next: function(this: PlannedMaintenanceDetailComponent, res: any) {
        this.schedule.set(Array.isArray(res) ? res : []);
        this.scheduleLoading.set(false);
      }.bind(this),
      error: function(this: PlannedMaintenanceDetailComponent) { this.scheduleLoading.set(false); }.bind(this)
    });
  }

  generateSchedule() {
    if (this.generating()) return;
    this.generating.set(true);
    this.api.generatePlannedMaintSchedule(this.planId, this.generateCount).subscribe({
      next: function(this: PlannedMaintenanceDetailComponent) {
        this.generating.set(false);
        this.loadSchedule();
        this.snackBar.open('Schedule generated', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this),
      error: function(this: PlannedMaintenanceDetailComponent, err: any) {
        this.generating.set(false);
        var msg = err?.error?.error || 'Failed to generate schedule';
        this.snackBar.open(msg, 'OK', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  startEditSchedule(entry: any) {
    this.scheduleForm = {
      status: entry.status,
      actualDate: entry.actualDate ? new Date(entry.actualDate).toISOString().split('T')[0] : '',
      actualCost: entry.actualCost != null ? entry.actualCost : '',
      notes: entry.notes || ''
    };
    this.editingSchedule.set(entry);
  }

  cancelEditSchedule() {
    this.editingSchedule.set(null);
    this.scheduleForm = {};
  }

  saveSchedule(entry: any) {
    this.api.updatePlannedMaintSchedule(entry.scheduleId, this.scheduleForm).subscribe({
      next: function(this: PlannedMaintenanceDetailComponent) {
        this.editingSchedule.set(null);
        this.loadSchedule();
        this.snackBar.open('Schedule entry updated', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this),
      error: function(this: PlannedMaintenanceDetailComponent) {
        this.snackBar.open('Failed to update schedule entry', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  openRaiseWoForm(entry: any) {
    var p = this.plan();
    var schedDate = entry.scheduledDate ? new Date(entry.scheduledDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    this.raiseWoForm = {
      workOrderDesc: (p?.planName || '') + ' – ' + this.formatDate(entry.scheduledDate),
      workOrderDate: schedDate,
      amount: p?.estimatedCost || null,
      maintainerId: null,
      assetRegisterItemId: null,
      debitProjectId: p?.debitProjectId || null,
      debitPlanProjectItemId: p?.planProjectItemId || null
    };
    this.woDebitScoaItems.set([]);
    if (this.raiseWoForm.debitProjectId) {
      var self = this;
      this.api.getPlanProjectItems(Number(this.raiseWoForm.debitProjectId)).subscribe({
        next: function(res: any) { self.woDebitScoaItems.set(Array.isArray(res) ? res : []); }
      });
    }
    if (this.planAssets().length === 0) {
      this.loadPlanAssets();
    }
    this.raiseWoEntry.set(entry);
    this.showRaiseWoForm.set(true);
  }

  cancelRaiseWoForm() {
    this.showRaiseWoForm.set(false);
    this.raiseWoEntry.set(null);
    this.raiseWoForm = {};
    this.woDebitScoaItems.set([]);
  }

  onWoProjectChange() {
    this.raiseWoForm.debitPlanProjectItemId = null;
    this.woDebitScoaItems.set([]);
    if (!this.raiseWoForm.debitProjectId) return;
    var self = this;
    this.api.getPlanProjectItems(Number(this.raiseWoForm.debitProjectId)).subscribe({
      next: function(res: any) { self.woDebitScoaItems.set(Array.isArray(res) ? res : []); }
    });
  }

  submitRaiseWo() {
    if (!this.raiseWoForm.workOrderDesc) {
      this.snackBar.open('Work order description is required', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    if (!this.raiseWoForm.assetRegisterItemId) {
      this.snackBar.open('Please select an asset from the plan', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    var entry = this.raiseWoEntry();
    if (!entry) return;
    this.woSubmitting.set(true);
    var body = {
      workOrderDesc: this.raiseWoForm.workOrderDesc,
      workOrderDate: this.raiseWoForm.workOrderDate,
      amount: this.raiseWoForm.amount,
      maintainerId: this.raiseWoForm.maintainerId,
      assetRegisterItemId: this.raiseWoForm.assetRegisterItemId,
      debitProjectId: this.raiseWoForm.debitProjectId,
      debitPlanProjectItemId: this.raiseWoForm.debitPlanProjectItemId
    };
    this.api.raiseWorkOrderFromSchedule(entry.scheduleId, body).subscribe({
      next: function(this: PlannedMaintenanceDetailComponent, res: any) {
        this.woSubmitting.set(false);
        this.showRaiseWoForm.set(false);
        this.raiseWoEntry.set(null);
        this.raiseWoForm = {};
        this.woDebitScoaItems.set([]);
        this.loadSchedule();
        this.loadWorkOrders();
        var woId = res.workOrderId || res.id;
        this.snackBar.open('Work Order #' + (woId || '') + ' created', 'View', { duration: 6000, horizontalPosition: 'end', verticalPosition: 'top' })
          .onAction().subscribe(function(this: PlannedMaintenanceDetailComponent) {
            if (woId) { this.router.navigate(['/maintenance/work-orders', woId]); }
          }.bind(this));
      }.bind(this),
      error: function(this: PlannedMaintenanceDetailComponent, err: any) {
        this.woSubmitting.set(false);
        var msg = err?.error?.error || 'Failed to raise work order';
        this.snackBar.open(msg, 'OK', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  loadWorkOrders() {
    this.workOrdersLoading.set(true);
    this.api.getMaintenanceWorkOrdersByPlan(this.planId).subscribe({
      next: function(this: PlannedMaintenanceDetailComponent, res: any) {
        this.workOrders.set(Array.isArray(res) ? res : []);
        this.workOrdersLoading.set(false);
      }.bind(this),
      error: function(this: PlannedMaintenanceDetailComponent) { this.workOrdersLoading.set(false); }.bind(this)
    });
  }

  getScheduleStatusClass(status: string): string {
    var s = (status || '').toLowerCase();
    if (s === 'completed') return 'status-completed';
    if (s === 'overdue') return 'status-overdue';
    if (s === 'in progress') return 'status-inprogress';
    if (s === 'skipped') return 'status-skipped';
    return 'status-scheduled';
  }

  isEditingSchedule(entry: any): boolean {
    var e = this.editingSchedule();
    return e !== null && e.scheduleId === entry.scheduleId;
  }

  goBack() { this.router.navigate(['/maintenance/planned']); }

  navigateToWorkOrder(woId: number) {
    this.router.navigate(['/maintenance/work-orders', woId]);
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-ZA');
  }

  formatCost(v: any): string {
    if (v == null || v === '') return '—';
    return 'R ' + Number(v).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getWoStatusLabel(statusId: number): string {
    var labels: Record<number, string> = {
      1: 'Draft', 2: 'Submitted', 3: 'Approved', 4: 'Scheduled',
      5: 'In Progress', 6: 'Completed', 7: 'Closed', 8: 'Cancelled'
    };
    return labels[statusId] || ('Status ' + statusId);
  }

  getWoTypeLabel(wo: any): string {
    if (wo.workOrderTypeDesc) return wo.workOrderTypeDesc;
    var labels: Record<number, string> = {
      1: 'Preventative', 2: 'Corrective', 3: 'Emergency', 4: 'Inspection', 5: 'Renewal'
    };
    return labels[wo.workOrderTypeId] || ('Type ' + wo.workOrderTypeId);
  }

  scheduleStatuses = ['Scheduled', 'In Progress', 'Completed', 'Skipped', 'Overdue'];
}
