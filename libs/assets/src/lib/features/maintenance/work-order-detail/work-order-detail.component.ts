import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/api.service';
import { EmployeeSelectComponent } from '../../../shared/employee-select/employee-select.component';

@Component({
  selector: 'app-work-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, EmployeeSelectComponent],
  templateUrl: './work-order-detail.component.html',
  styleUrls: ['./work-order-detail.component.css']
})
export class WorkOrderDetailComponent implements OnInit {
  woId = 0;
  loading = signal(true);
  saving = signal(false);
  wo = signal<any>(null);
  activeTab = signal<string>('details');

  woTypes = signal<any[]>([]);
  planProjects = signal<any[]>([]);
  debitScoaItems = signal<any[]>([]);
  creditScoaItems = signal<any[]>([]);
  employeeNameCache = new Map<number, string>();
  private empFetchPending = new Set<number>();
  vendors = signal<any[]>([]);
  assetResults = signal<any[]>([]);
  assetSearching = signal(false);
  planAssets = signal<any[]>([]);
  showPlanAssetPicker = signal(false);

  form: any = {};
  assetSearch = '';
  assetSearchTimer: any = null;
  showAssetResults = signal(false);

  details = signal<any[]>([]);
  detailsLoading = signal(false);
  showDetailForm = signal(false);
  addingItemType = '';
  editingDetail = signal<any>(null);
  detailForm: any = this.emptyDetail('Labour');

  assignments = signal<any[]>([]);
  assignmentsLoading = signal(false);
  showAssignmentForm = signal(false);
  editingAssignment = signal<any>(null);
  assignmentForm: any = this.emptyAssignment();
  assignmentSaving = signal(false);

  approvals = signal<any[]>([]);
  approvalsLoading = signal(false);
  showApproveDialog = signal(false);
  showRejectDialog = signal(false);
  approvalForm: any = { approvalLevel: 1, comments: '' };
  approvalSaving = signal(false);

  auditTrail = signal<any[]>([]);
  auditLoading = signal(false);

  showCompletePanel = signal(false);
  completionForm: any = {
    completionNotes: '',
    actualCost: null,
    completionDate: '',
    rootCause: '',
    recommendations: '',
    followUpRequired: false,
    followUpDescription: ''
  };
  completingSaving = signal(false);

  showCancelDialog = signal(false);
  cancelForm: any = { cancelledReason: '' };
  cancellingSaving = signal(false);

  lifecycleWorking = signal(false);

  readonly STATUS_STEPS = ['Draft', 'Submitted', 'Approved', 'In Progress', 'Completed', 'Closed'];
  readonly STATUS_ID_TO_NAME: Record<number, string> = {
    1: 'Draft', 2: 'Submitted', 3: 'Approved', 4: 'Scheduled', 5: 'In Progress', 6: 'Completed', 7: 'Closed', 8: 'Cancelled'
  };
  readonly STEP_ORDER = [1, 2, 3, 5, 6, 7];

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.woId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadWo();
    this.loadLookups();
  }

  loadWo() {
    var self = this;
    self.loading.set(true);
    self.api.getWorkOrderById(self.woId).subscribe({
      next: function(d: any) {
        self.wo.set(d);
        self.form = self.mapForm(d);
        self.loading.set(false);
        if (d.debitProjectId) {
          self.api.getPlanProjectItems(d.debitProjectId).subscribe({
            next: function(items: any) { self.debitScoaItems.set(items || []); },
            error: function() {}
          });
        }
        if (d.creditProjectId) {
          self.api.getPlanProjectItems(d.creditProjectId).subscribe({
            next: function(items: any) { self.creditScoaItems.set(items || []); },
            error: function() {}
          });
        }
        if (d.linkedPlanId) {
          self.api.getPlannedMaintPlanAssets(d.linkedPlanId).subscribe({
            next: function(items: any) { self.planAssets.set(Array.isArray(items) ? items : []); },
            error: function() {}
          });
        }
      },
      error: function() { self.loading.set(false); }
    });
  }

  mapForm(d: any) {
    return {
      assetRegisterItemId: d.assetRegisterItemId || null,
      workOrderDesc: d.workOrderDesc || '',
      workOrderTypeId: d.workOrderTypeId || '',
      priority: d.priority || 'Medium',
      plannedStartDate: this.dateStr(d.plannedStartDate),
      plannedEndDate: this.dateStr(d.plannedEndDate),
      actualStartDate: this.dateStr(d.actualStartDate),
      actualEndDate: this.dateStr(d.actualEndDate),
      riskLevel: d.riskLevel || '',
      safetyRequirements: d.safetyRequirements || '',
      environmentalImpact: d.environmentalImpact || '',
      fundingSegment: d.fundingSegment || '',
      costCentre: d.costCentre || '',
      debitProjectId: d.debitProjectId || null,
      debitPlanProjectItemId: d.debitPlanProjectItemId || null,
      creditProjectId: d.creditProjectId || null,
      creditPlanProjectItemId: d.creditPlanProjectItemId || null,
      completionNotes: d.completionNotes || '',
      rootCause: d.rootCause || '',
      recommendations: d.recommendations || '',
      actualCost: d.actualCost || null,
      cancelledReason: d.cancelledReason || ''
    };
  }

  loadLookups() {
    var self = this;
    self.api.getWorkOrderTypes().subscribe({ next: function(d: any) { self.woTypes.set(d); }, error: function() {} });
    self.api.getPlanProjects().subscribe({ next: function(d: any) { self.planProjects.set(d); }, error: function() {} });
    self.api.getVendors().subscribe({ next: function(d: any) { self.vendors.set(d || []); }, error: function() {} });
  }


  get nextApprovalLevel() {
    var done = this.approvals().filter(function(a: any) { return (a.approvalStatus || '').toLowerCase() === 'approved'; });
    return Math.min(done.length + 1, 3);
  }

  setTab(tab: string) {
    this.activeTab.set(tab);
    if (tab === 'lines' && this.details().length === 0) this.loadDetails();
    if (tab === 'assignments' && this.assignments().length === 0) this.loadAssignments();
    if (tab === 'approvals' && this.approvals().length === 0) this.loadApprovals();
    if (tab === 'audit' && this.auditTrail().length === 0) this.loadAuditTrail();
  }

  loadDetails() {
    var self = this;
    self.detailsLoading.set(true);
    self.api.getMaintenanceWorkOrderDetails(self.woId).subscribe({
      next: function(d: any) { self.details.set(d || []); self.detailsLoading.set(false); },
      error: function() { self.detailsLoading.set(false); }
    });
  }

  loadAssignments() {
    var self = this;
    self.assignmentsLoading.set(true);
    self.api.getWorkOrderAssignments(self.woId).subscribe({
      next: function(d: any) { self.assignments.set(d || []); self.assignmentsLoading.set(false); },
      error: function() { self.assignmentsLoading.set(false); }
    });
  }

  loadApprovals() {
    var self = this;
    self.approvalsLoading.set(true);
    self.api.getWorkOrderApprovals(self.woId).subscribe({
      next: function(d: any) {
        var sorted = (d || []).slice().sort(function(a: any, b: any) {
          return new Date(a.approvalDate || 0).getTime() - new Date(b.approvalDate || 0).getTime();
        });
        self.approvals.set(sorted);
        self.approvalsLoading.set(false);
      },
      error: function() { self.approvalsLoading.set(false); }
    });
  }

  loadAuditTrail() {
    var self = this;
    self.auditLoading.set(true);
    self.api.getWorkOrderAuditTrail(self.woId).subscribe({
      next: function(d: any) {
        var sorted = (d || []).slice().sort(function(a: any, b: any) {
          return new Date(b.changedAt || 0).getTime() - new Date(a.changedAt || 0).getTime();
        });
        self.auditTrail.set(sorted);
        self.auditLoading.set(false);
      },
      error: function() { self.auditLoading.set(false); }
    });
  }

  saveDetails() {
    var self = this;
    self.saving.set(true);
    var payload = { ...self.form };
    self.api.updateMaintenanceWorkOrder(self.woId, payload).subscribe({
      next: function() {
        self.saving.set(false);
        self.snackBar.open('Work order updated.', 'OK', { duration: 2000 });
        self.loadWo();
      },
      error: function(e: any) {
        self.saving.set(false);
        self.snackBar.open(e?.error?.error || 'Save failed.', 'OK', { duration: 3000 });
      }
    });
  }

  onDebitProjectChange() {
    var self = this;
    self.form.debitPlanProjectItemId = null;
    self.debitScoaItems.set([]);
    if (!self.form.debitProjectId) return;
    self.api.getPlanProjectItems(self.form.debitProjectId).subscribe({
      next: function(d: any) { self.debitScoaItems.set(d); },
      error: function() {}
    });
  }

  onCreditProjectChange() {
    var self = this;
    self.form.creditPlanProjectItemId = null;
    self.creditScoaItems.set([]);
    if (!self.form.creditProjectId) return;
    self.api.getPlanProjectItems(self.form.creditProjectId).subscribe({
      next: function(d: any) { self.creditScoaItems.set(d); },
      error: function() {}
    });
  }

  onAssetSearchChange() {
    var self = this;
    var term = (self.assetSearch || '').trim();
    if (!term) { self.assetResults.set([]); self.showAssetResults.set(false); return; }
    if (self.assetSearchTimer) clearTimeout(self.assetSearchTimer);
    self.assetSearching.set(true);
    self.showAssetResults.set(true);
    self.assetSearchTimer = setTimeout(function() {
      self.api.getAssets({ search: term, pageSize: 20 }).subscribe({
        next: function(resp: any) {
          var items = resp && resp.data ? resp.data : (Array.isArray(resp) ? resp : []);
          self.assetResults.set(items);
          self.assetSearching.set(false);
        },
        error: function() { self.assetResults.set([]); self.assetSearching.set(false); }
      });
    }, 300);
  }

  selectAsset(a: any) {
    var self = this;
    self.form.assetRegisterItemId = a.assetRegisterId || a.assetRegisterItemId || a.assetId;
    var display = {
      assetRegisterItemId: self.form.assetRegisterItemId,
      assetDescription: a.description || a.assetDescription || '',
      assetBarcode: a.barcode || a.assetBarcode || ''
    };
    self.wo.set(Object.assign({}, self.wo(), display));
    self.assetSearch = '';
    self.assetResults.set([]);
    self.showAssetResults.set(false);
    self.showPlanAssetPicker.set(false);
  }

  onPlanAssetSelect(event: Event) {
    var id = Number((event.target as HTMLSelectElement).value);
    if (!id) return;
    var asset = this.planAssets().find(function(a: any) { return a.assetRegisterItemId === id; });
    if (!asset) return;
    this.selectAsset({ assetRegisterItemId: id, description: asset.description, barcode: asset.barcode });
  }

  clearAsset() {
    this.form.assetRegisterItemId = null;
    this.wo.set(Object.assign({}, this.wo(), { assetRegisterItemId: null, assetDescription: null, assetBarcode: null }));
  }

  emptyDetail(itemType: string) {
    return { itemType: itemType, description: '', quantityOrdered: 1, unitCost: null, value: null };
  }

  openAddDetail(itemType: string) {
    this.editingDetail.set(null);
    this.addingItemType = itemType;
    this.detailForm = this.emptyDetail(itemType);
    this.showDetailForm.set(true);
  }

  editDetail(d: any) {
    this.editingDetail.set(d);
    this.addingItemType = d.itemType || 'Labour';
    this.detailForm = {
      itemType: d.itemType || 'Labour',
      description: d.description || '',
      quantityOrdered: d.quantityOrdered || 1,
      unitCost: d.unitCost || null,
      value: d.value || null
    };
    this.showDetailForm.set(true);
  }

  cancelDetailForm() {
    this.showDetailForm.set(false);
    this.editingDetail.set(null);
  }

  saveDetail() {
    var self = this;
    var payload = {
      maintenanceWorksOrderId: self.woId,
      itemType: self.detailForm.itemType,
      description: self.detailForm.description,
      quantityOrdered: Number(self.detailForm.quantityOrdered) || 1,
      unitCost: self.detailForm.unitCost != null ? Number(self.detailForm.unitCost) : null,
      value: self.detailForm.value != null ? Number(self.detailForm.value) : null
    };
    var editing = self.editingDetail();
    var obs = editing
      ? self.api.updateMaintenanceWorkOrderDetail(editing.maintenanceWorksOrderDetailsId, payload)
      : self.api.createMaintenanceWorkOrderDetail(payload);
    obs.subscribe({
      next: function() {
        self.showDetailForm.set(false);
        self.editingDetail.set(null);
        self.loadDetails();
      },
      error: function(e: any) { self.snackBar.open(e?.error?.error || 'Save failed.', 'OK', { duration: 3000 }); }
    });
  }

  deleteDetail(d: any) {
    if (!confirm('Remove this line item?')) return;
    var self = this;
    self.api.deleteMaintenanceWorkOrderDetail(d.maintenanceWorksOrderDetailsId).subscribe({
      next: function() { self.loadDetails(); },
      error: function(e: any) { self.snackBar.open(e?.error?.error || 'Delete failed.', 'OK', { duration: 3000 }); }
    });
  }

  detailTotal(d: any) {
    var q = Number(d.quantityOrdered) || 0;
    var u = Number(d.unitCost) || 0;
    return q && u ? q * u : (Number(d.totalCost) || Number(d.value) || 0);
  }

  get detailsGrandTotal() {
    return this.details().reduce((s: number, d: any) => s + this.detailTotal(d), 0);
  }

  get detailsLabourTotal() {
    return this.details().filter(function(d: any) { return d.itemType === 'Labour'; })
      .reduce((s: number, d: any) => s + this.detailTotal(d), 0);
  }

  get detailsMaterialTotal() {
    return this.details().filter(function(d: any) { return d.itemType === 'Material'; })
      .reduce((s: number, d: any) => s + this.detailTotal(d), 0);
  }

  get detailsContractorTotal() {
    return this.details().filter(function(d: any) { return d.itemType === 'Contractor'; })
      .reduce((s: number, d: any) => s + this.detailTotal(d), 0);
  }

  emptyAssignment() {
    return { assignmentType: 'Employee', employeeId: null, vendorId: null, vendorName: '', role: '', hoursAssigned: null, hoursWorked: null };
  }

  openAddAssignment() {
    this.editingAssignment.set(null);
    this.assignmentForm = this.emptyAssignment();
    this.showAssignmentForm.set(true);
  }

  editAssignment(a: any) {
    this.editingAssignment.set(a);
    this.assignmentForm = {
      assignmentType: a.employeeId ? 'Employee' : 'Vendor',
      employeeId: a.employeeId || null,
      vendorId: a.vendorId || null,
      vendorName: a.vendorName || '',
      role: a.role || '',
      hoursAssigned: a.hoursAssigned || null,
      hoursWorked: a.hoursWorked || null
    };
    this.showAssignmentForm.set(true);
  }

  cancelAssignmentForm() {
    this.showAssignmentForm.set(false);
    this.editingAssignment.set(null);
  }

  onVendorSelect() {
    var vid = Number(this.assignmentForm.vendorId) || null;
    if (!vid) return;
    var found = this.vendors().find(function(v: any) { return Number(v.vendorId) === vid; });
    if (found) this.assignmentForm.vendorName = found.vendorName;
  }

  employeeDisplayName(empId: number) {
    if (!empId) return '—';
    const numId = Number(empId);
    if (this.employeeNameCache.has(numId)) { return this.employeeNameCache.get(numId)!; }
    if (!this.empFetchPending.has(numId)) {
      this.empFetchPending.add(numId);
      const self = this;
      this.api.getEmployeeById(numId).subscribe({
        next: function(e: any) {
          if (e) {
            var name = (e.firstName || '') + ' ' + (e.surname || e.Surname || '');
            if (e.empCode || e.EmpCode) name += ' (' + (e.empCode || e.EmpCode) + ')';
            self.employeeNameCache.set(numId, name.trim());
          }
          self.empFetchPending.delete(numId);
        },
        error: function() { self.empFetchPending.delete(numId); }
      });
    }
    return 'Emp #' + numId;
  }

  saveAssignment() {
    var self = this;
    var f = self.assignmentForm;
    if (f.assignmentType === 'Employee' && !f.employeeId) {
      self.snackBar.open('Please select an employee.', 'OK', { duration: 3000 });
      return;
    }
    if (f.assignmentType === 'Vendor' && !f.vendorName) {
      self.snackBar.open('Vendor name is required.', 'OK', { duration: 3000 });
      return;
    }
    var payload = {
      employeeId: f.assignmentType === 'Employee' ? (Number(f.employeeId) || null) : null,
      vendorId: f.assignmentType === 'Vendor' ? (Number(f.vendorId) || null) : null,
      vendorName: f.vendorName || '',
      role: f.role,
      hoursAssigned: f.hoursAssigned != null ? Number(f.hoursAssigned) : null,
      hoursWorked: f.hoursWorked != null ? Number(f.hoursWorked) : null
    };
    self.assignmentSaving.set(true);
    var editing = self.editingAssignment();
    var obs = editing
      ? self.api.updateWorkOrderAssignment(self.woId, editing.assignmentId, payload)
      : self.api.addWorkOrderAssignment(self.woId, payload);
    obs.subscribe({
      next: function() {
        self.assignmentSaving.set(false);
        self.showAssignmentForm.set(false);
        self.editingAssignment.set(null);
        self.loadAssignments();
      },
      error: function(e: any) {
        self.assignmentSaving.set(false);
        self.snackBar.open(e?.error?.error || 'Save failed.', 'OK', { duration: 3000 });
      }
    });
  }

  deleteAssignment(a: any) {
    if (!confirm('Remove this assignment?')) return;
    var self = this;
    self.api.deleteWorkOrderAssignment(self.woId, a.assignmentId).subscribe({
      next: function() { self.loadAssignments(); },
      error: function(e: any) { self.snackBar.open(e?.error?.error || 'Delete failed.', 'OK', { duration: 3000 }); }
    });
  }

  openApproveDialog() {
    var level = this.nextApprovalLevel;
    this.approvalForm = { approvalLevel: level, comments: '' };
    this.showApproveDialog.set(true);
  }

  submitApproval() {
    var self = this;
    self.approvalSaving.set(true);
    self.api.approveWorkOrder(self.woId, self.approvalForm).subscribe({
      next: function() {
        self.approvalSaving.set(false);
        self.showApproveDialog.set(false);
        self.snackBar.open('Work order approved.', 'OK', { duration: 2000 });
        self.loadWo();
        self.approvals.set([]);
      },
      error: function(e: any) {
        self.approvalSaving.set(false);
        self.snackBar.open(e?.error?.error || 'Approval failed.', 'OK', { duration: 3000 });
      }
    });
  }

  openRejectDialog() {
    var level = this.nextApprovalLevel;
    this.approvalForm = { approvalLevel: level, comments: '' };
    this.showRejectDialog.set(true);
  }

  submitRejection() {
    var self = this;
    self.approvalSaving.set(true);
    self.api.rejectWorkOrder(self.woId, self.approvalForm).subscribe({
      next: function() {
        self.approvalSaving.set(false);
        self.showRejectDialog.set(false);
        self.snackBar.open('Work order rejected.', 'OK', { duration: 2000 });
        self.loadWo();
        self.approvals.set([]);
      },
      error: function(e: any) {
        self.approvalSaving.set(false);
        self.snackBar.open(e?.error?.error || 'Rejection failed.', 'OK', { duration: 3000 });
      }
    });
  }

  doSubmit() {
    if (!confirm('Submit this work order for approval?')) return;
    var self = this;
    self.lifecycleWorking.set(true);
    self.api.submitWorkOrder(self.woId).subscribe({
      next: function() { self.lifecycleWorking.set(false); self.snackBar.open('Submitted.', 'OK', { duration: 2000 }); self.loadWo(); },
      error: function(e: any) { self.lifecycleWorking.set(false); self.snackBar.open(e?.error?.error || 'Failed.', 'OK', { duration: 3000 }); }
    });
  }

  doStart() {
    if (!confirm('Start work on this work order?')) return;
    var self = this;
    self.lifecycleWorking.set(true);
    self.api.startWorkOrder(self.woId).subscribe({
      next: function() { self.lifecycleWorking.set(false); self.snackBar.open('Work order started.', 'OK', { duration: 2000 }); self.loadWo(); },
      error: function(e: any) { self.lifecycleWorking.set(false); self.snackBar.open(e?.error?.error || 'Failed.', 'OK', { duration: 3000 }); }
    });
  }

  openCompletePanel() {
    this.completionForm = {
      completionNotes: '',
      actualCost: null,
      completionDate: new Date().toISOString().split('T')[0],
      rootCause: '',
      recommendations: '',
      followUpRequired: false,
      followUpDescription: ''
    };
    this.showCompletePanel.set(true);
  }

  submitCompletion() {
    var self = this;
    if (!self.completionForm.completionNotes) {
      self.snackBar.open('Completion notes are required.', 'OK', { duration: 3000 });
      return;
    }
    if (self.completionForm.actualCost == null || self.completionForm.actualCost === '') {
      self.snackBar.open('Actual cost is required.', 'OK', { duration: 3000 });
      return;
    }
    if (!self.completionForm.completionDate) {
      self.snackBar.open('Completion date is required.', 'OK', { duration: 3000 });
      return;
    }
    if (self.completionForm.followUpRequired && !self.completionForm.followUpDescription) {
      self.snackBar.open('Follow-up description is required when follow-up is checked.', 'OK', { duration: 3000 });
      return;
    }
    self.completingSaving.set(true);
    var payload: any = {
      completionNotes: self.completionForm.completionNotes,
      actualCost: Number(self.completionForm.actualCost),
      completionDate: self.completionForm.completionDate,
      rootCause: self.completionForm.rootCause,
      recommendations: self.completionForm.recommendations,
      followUpRequired: self.completionForm.followUpRequired,
      followUpDescription: self.completionForm.followUpDescription
    };
    self.api.completeWorkOrder(self.woId, payload).subscribe({
      next: function() {
        self.completingSaving.set(false);
        self.showCompletePanel.set(false);
        self.snackBar.open('Work order completed.', 'OK', { duration: 2000 });
        self.loadWo();
      },
      error: function(e: any) {
        self.completingSaving.set(false);
        self.snackBar.open(e?.error?.error || 'Failed.', 'OK', { duration: 3000 });
      }
    });
  }

  doClose() {
    if (!confirm('Close this work order?')) return;
    var self = this;
    self.lifecycleWorking.set(true);
    self.api.closeWorkOrder(self.woId).subscribe({
      next: function() { self.lifecycleWorking.set(false); self.snackBar.open('Closed.', 'OK', { duration: 2000 }); self.loadWo(); },
      error: function(e: any) { self.lifecycleWorking.set(false); self.snackBar.open(e?.error?.error || 'Failed.', 'OK', { duration: 3000 }); }
    });
  }

  openCancelDialog() {
    this.cancelForm = { cancelledReason: '' };
    this.showCancelDialog.set(true);
  }

  submitCancel() {
    var self = this;
    if (!self.cancelForm.cancelledReason) {
      self.snackBar.open('A cancellation reason is required.', 'OK', { duration: 3000 });
      return;
    }
    self.cancellingSaving.set(true);
    self.api.cancelWorkOrder(self.woId, self.cancelForm).subscribe({
      next: function() {
        self.cancellingSaving.set(false);
        self.showCancelDialog.set(false);
        self.snackBar.open('Cancelled.', 'OK', { duration: 2000 });
        self.loadWo();
      },
      error: function(e: any) {
        self.cancellingSaving.set(false);
        self.snackBar.open(e?.error?.error || 'Failed.', 'OK', { duration: 3000 });
      }
    });
  }

  getStepStatus(stepId: number) {
    var current = this.wo()?.workOrderStatusId || 1;
    var cancelled = current === 8;
    if (cancelled) return 'cancelled';
    var stepIdx = this.STEP_ORDER.indexOf(stepId);
    var curIdx = this.STEP_ORDER.indexOf(current);
    if (curIdx === -1) return 'pending';
    if (stepIdx < curIdx) return 'done';
    if (stepIdx === curIdx) return 'active';
    return 'pending';
  }

  getPriorityClass(p: string) {
    switch ((p || '').toLowerCase()) {
      case 'critical': return 'priority-critical';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-low';
    }
  }

  getStatusClass(id: number) {
    switch (id) {
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

  getApprovalClass(status: string) {
    if (!status) return '';
    return status.toLowerCase() === 'approved' ? 'approval-approved' : 'approval-rejected';
  }

  dateStr(v: string) {
    if (!v) return '';
    return v.substring(0, 10);
  }

  formatDate(v: string) {
    if (!v) return '-';
    return new Date(v).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: '2-digit' });
  }

  formatDateTime(v: string) {
    if (!v) return '-';
    return new Date(v).toLocaleString('en-ZA', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  goBack() {
    this.router.navigate(['/assets/maintenance/work-orders']);
  }
}
