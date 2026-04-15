import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-workflow-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatProgressBarModule, MatSnackBarModule, MatTabsModule],
  templateUrl: './workflow-inbox.component.html',
  styleUrl: './workflow-inbox.component.css'
})
export class WorkflowInboxComponent implements OnInit {
  allWorkflows = signal<any[]>([]);
  filteredWorkflows = signal<any[]>([]);
  stats = signal<any>(null);
  loading = signal(true);
  activeTab = signal(0);
  activeActionId = signal<string | null>(null);
  activeAction = signal<string>('');
  expandedId = signal<string | null>(null);
  actionComments = '';

  pendingSchedules = signal<any[]>([]);
  pendingRevaluations = signal<any[]>([]);
  pendingImpairments = signal<any[]>([]);
  pendingReversals = signal<any[]>([]);
  pendingDisposals = signal<any[]>([]);
  pendingRefurbishments = signal<any[]>([]);
  approvingId = signal<number>(0);
  approveError = signal<string>('');

  depDetailScheduleId = signal<number>(0);
  depScheduleItems = signal<any[]>([]);
  depScheduleItemsLoading = signal(false);
  depItemDetails = signal<Record<number, any[]>>({});
  depItemDetailsLoading = signal<Record<number, boolean>>({});
  depItemExpanded = signal<Record<number, boolean>>({});

  glValidating = signal(false);
  depPosting = signal(false);
  depPostStep = signal<number>(0);
  depRebuildProgress = signal<{done: number, total: number}>({done: 0, total: 0});
  private depRebuildPollInterval: any = null;
  glValidationErrors = signal<any[]>([]);
  glValidationVisible = signal(false);
  glValidationTxnType = signal('');
  rejectingScheduleId = signal<number>(0);
  rejectConfirmScheduleId = signal<number>(0);

  settingsData = signal<any>(null);
  approvalMethod = signal<string>('Manual');

  txVerifyOpen = signal(false);
  txVerifyScheduleId = signal(0);
  txVerifyFinYear = signal('');
  txVerifyPeriod = signal(0);
  txVerifyReval = signal(false);
  txVerifyImp = signal(false);
  txVerifyReversal = signal(false);
  txVerifyDisposal = signal(false);
  txVerifySubmitting = signal(false);
  txVerifyError = signal('');
  monthlyApprovalMap = signal<Record<string, boolean>>({});

  depSectionExpanded = signal(false);
  revalSectionExpanded = signal(false);
  impairSectionExpanded = signal(false);
  reversalSectionExpanded = signal(false);
  disposalSectionExpanded = signal(false);
  refurbSectionExpanded = signal(false);
  assetApprovalSectionExpanded = signal(false);

  pendingAssetApprovals = signal<any[]>([]);
  assetApprovalDetailId = signal<number>(0);
  assetApprovalDetail = signal<any>(null);
  assetApprovalDetailLoading = signal(false);
  assetApprovalDetailTab = signal<string>('changes');
  assetApprovalRejectId = signal<number>(0);
  assetApprovalRejectReason = '';
  assetApprovalApprovingId = signal<number>(0);
  assetApprovalError = signal<string>('');

  periodMonths = [
    { value: 1, label: 'July' }, { value: 2, label: 'August' }, { value: 3, label: 'September' },
    { value: 4, label: 'October' }, { value: 5, label: 'November' }, { value: 6, label: 'December' },
    { value: 7, label: 'January' }, { value: 8, label: 'February' }, { value: 9, label: 'March' },
    { value: 10, label: 'April' }, { value: 11, label: 'May' }, { value: 12, label: 'June' },
  ];

  private stepsCache = new Map<number, any[]>();

  assetApprovalPendingCount = signal<number>(0);

  totalPendingApprovals = computed(() => {
    return this.pendingSchedules().length + this.pendingRevaluations().length +
      this.pendingImpairments().length + this.pendingReversals().length +
      this.pendingDisposals().length + this.pendingRefurbishments().length +
      (this.assetApprovalSectionExpanded() ? this.pendingAssetApprovals().length : this.assetApprovalPendingCount());
  });

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.loadData();
    this.loadPendingItems();
    this.loadAssetApprovalCount();
    this.api.getSettings().subscribe({
      next: function(this: WorkflowInboxComponent, s: any) {
        this.settingsData.set(s);
        this.approvalMethod.set(s?.approval_method || 'Manual');
      }.bind(this)
    });
  }

  loadAssetApprovalCount() {
    this.api.getPendingCount().subscribe({
      next: function(this: WorkflowInboxComponent, data: any) {
        this.assetApprovalPendingCount.set(data?.assetApprovals || 0);
      }.bind(this),
      error: function() {}
    });
  }

  loadData() {
    this.loading.set(true);
    this.api.getAllWorkflows().subscribe({
      next: (wfs) => {
        this.stepsCache.clear();
        this.allWorkflows.set(wfs || []);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => { this.allWorkflows.set([]); this.filteredWorkflows.set([]); this.loading.set(false); }
    });
    this.api.getWorkflowStats().subscribe({
      next: (s) => this.stats.set(s),
      error: () => {}
    });
  }

  loadPendingItems() {
    this.api.getImpairments({ finYear: '' }).subscribe({
      next: function(this: WorkflowInboxComponent, items: any[]) {
        var pendingImp: any[] = [];
        var pendingRev: any[] = [];
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var isApproved = item.approved || item.Approved;
          var isRejected = item.isRejected || item.IsRejected;
          if (!isApproved && !isRejected) {
            var reversal = item.isReversal || item.IsReversal || 0;
            if (reversal === 1 || reversal === true) {
              pendingRev.push(item);
            } else {
              pendingImp.push(item);
            }
          }
        }
        this.pendingImpairments.set(pendingImp);
        this.pendingReversals.set(pendingRev);
      }.bind(this),
      error: function() {}
    });
    this.api.getRevaluations({}).subscribe({
      next: function(this: WorkflowInboxComponent, items: any[]) {
        var pending: any[] = [];
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var approved = item.Approved != null ? item.Approved : item.approved;
          if (approved === null || approved === undefined || approved === false) {
            var hasPostDateTime = item.PostDateTime || item.postDateTime;
            if (!hasPostDateTime) {
              pending.push(item);
            }
          }
        }
        this.pendingRevaluations.set(pending);
      }.bind(this),
      error: function() {}
    });
    this.api.getDisposals({}).subscribe({
      next: function(this: WorkflowInboxComponent, items: any[]) {
        var pending: any[] = [];
        for (var i = 0; i < items.length; i++) {
          var s = (items[i].status || '').toLowerCase();
          if (s === 'pending' || s === 'submitted') pending.push(items[i]);
        }
        this.pendingDisposals.set(pending);
      }.bind(this),
      error: function() {}
    });
    this.api.getDepreciationSchedules().subscribe({
      next: function(this: WorkflowInboxComponent, items: any[]) {
        var pending: any[] = [];
        for (var i = 0; i < items.length; i++) {
          var pa = items[i].pendingApproval !== undefined ? Number(items[i].pendingApproval) :
                   (items[i].PendingApproval !== undefined ? Number(items[i].PendingApproval) : 1);
          var sid = items[i].statusID || items[i].runStatus_ID || 0;
          if (pa > 0 && sid !== 13 && sid !== 3) pending.push(items[i]);
        }
        this.pendingSchedules.set(pending);
      }.bind(this),
      error: function() {}
    });
    this.api.getRefurbishments({}).subscribe({
      next: function(this: WorkflowInboxComponent, items: any[]) {
        var pending: any[] = [];
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var isApproved = item.isApproved != null ? item.isApproved : item.IsApproved;
          if (isApproved === null || isApproved === undefined || isApproved === false) {
            pending.push(item);
          }
        }
        this.pendingRefurbishments.set(pending);
      }.bind(this),
      error: function() {}
    });
    this.loadMonthlyApprovals();
  }

  onTabChange(event: any) {
    this.activeTab.set(event.index);
    this.applyFilter();
  }

  applyFilter() {
    var all = this.allWorkflows();
    var tab = this.activeTab();
    var filtered: any[] = [];
    if (tab === 1) {
      for (var i = 0; i < all.length; i++) {
        if (all[i].status === 'pending' || all[i].status === 'in_progress') filtered.push(all[i]);
      }
    } else if (tab === 3) {
      for (var i = 0; i < all.length; i++) {
        if (all[i].status === 'approved' || all[i].status === 'completed') filtered.push(all[i]);
      }
    } else if (tab === 4) {
      for (var i = 0; i < all.length; i++) {
        if (all[i].status === 'rejected') filtered.push(all[i]);
      }
    } else {
      filtered = all;
    }
    this.filteredWorkflows.set(filtered);
  }

  getSteps(wf: any): any[] {
    var cacheKey = wf.id || 0;
    if (this.stepsCache.has(cacheKey)) return this.stepsCache.get(cacheKey)!;
    var steps: any[];
    if (wf.steps && Array.isArray(wf.steps)) {
      steps = wf.steps;
    } else if (typeof wf.steps === 'string') {
      try { steps = JSON.parse(wf.steps); } catch { steps = []; }
    } else {
      steps = [
        { step_number: 1, action: 'Initiate', role: 'Requester' },
        { step_number: 2, action: 'Review', role: 'Manager' },
        { step_number: 3, action: 'Approve', role: 'Approver' }
      ];
    }
    this.stepsCache.set(cacheKey, steps);
    return steps;
  }

  getStepNum(step: any): number {
    return step.step || step.step_number || 0;
  }

  isStepComplete(wf: any, step: any): boolean {
    return (wf.current_step || 1) > this.getStepNum(step);
  }

  isStepRejected(wf: any, step: any): boolean {
    return wf.status === 'rejected' && (wf.current_step || 1) === this.getStepNum(step);
  }

  getStepBg(wf: any, step: any): string {
    if (this.isStepComplete(wf, step)) return '#10b981';
    if (this.isStepRejected(wf, step)) return '#ef4444';
    if ((wf.current_step || 1) === this.getStepNum(step)) return '#3b82f6';
    return 'white';
  }

  getStepColor(wf: any, step: any): string {
    if (this.isStepComplete(wf, step) || this.isStepRejected(wf, step) || (wf.current_step || 1) === this.getStepNum(step)) return 'white';
    return '#94a3b8';
  }

  getStepBorder(wf: any, step: any): string {
    if (this.isStepComplete(wf, step) || this.isStepRejected(wf, step) || (wf.current_step || 1) === this.getStepNum(step)) return 'none';
    return '2px solid #e2e8f0';
  }

  getEntityIcon(type: string): string {
    var map: Record<string, string> = {
      disposal: 'delete_sweep',
      revaluation: 'auto_graph',
      impairment: 'warning',
      transfer: 'swap_horiz',
      acquisition: 'add_shopping_cart',
      depreciation_run: 'trending_down',
      depreciation: 'trending_down',
      maintenance: 'build',
      wip_conversion: 'transform',
      fleet_trip: 'directions_car'
    };
    return map[type] || 'task';
  }

  getEntityColor(type: string): string {
    var map: Record<string, string> = {
      disposal: '#f59e0b',
      revaluation: '#3b82f6',
      impairment: '#ef4444',
      transfer: '#06b6d4',
      acquisition: '#10b981',
      depreciation_run: '#8b5cf6',
      depreciation: '#8b5cf6',
      maintenance: '#64748b',
      wip_conversion: '#ec4899',
      fleet_trip: '#f97316'
    };
    return map[type] || '#64748b';
  }

  formatEntityType(type: string): string {
    if (!type) return 'Workflow';
    var parts = type.split('_');
    var result = '';
    for (var i = 0; i < parts.length; i++) {
      if (i > 0) result = result + ' ';
      result = result + parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
    }
    return result;
  }

  getApprovalColor(action: string): string {
    if (action === 'approve') return '#10b981';
    if (action === 'reject') return '#ef4444';
    return '#f59e0b';
  }

  getApprovalLabel(action: string): string {
    if (action === 'approve') return 'Approved';
    if (action === 'reject') return 'Rejected';
    return 'Returned';
  }

  formatDate(val: string | null): string {
    if (!val) return 'N/A';
    try {
      var d = new Date(val);
      return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return val; }
  }

  toggleExpanded(wf: any) {
    if (this.expandedId() === wf.id) {
      this.expandedId.set(null);
    } else {
      this.expandedId.set(wf.id);
      if (!wf.approvals) {
        this.api.getWorkflowInstance(wf.id).subscribe({
          next: function(detail: any) {
            wf.approvals = detail.approvals || [];
          },
          error: function() { wf.approvals = []; }
        });
      }
    }
  }

  openAction(id: string, action: string) {
    this.activeActionId.set(id);
    this.activeAction.set(action);
    this.actionComments = '';
  }

  cancelAction() {
    this.activeActionId.set(null);
    this.activeAction.set('');
    this.actionComments = '';
  }

  getAgeDays(wf: any): number {
    if (!wf.initiated_at) return 0;
    var initiated = new Date(wf.initiated_at).getTime();
    var now = Date.now();
    return Math.floor((now - initiated) / (1000 * 60 * 60 * 24));
  }

  getSlaLabel(wf: any): string {
    var days = this.getAgeDays(wf);
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return days + ' days pending';
  }

  getSlaColor(wf: any): string {
    var days = this.getAgeDays(wf);
    if (days <= 2) return '#ecfdf5';
    if (days <= 5) return '#fff7ed';
    return '#fef2f2';
  }

  getSlaTextColor(wf: any): string {
    var days = this.getAgeDays(wf);
    if (days <= 2) return '#065f46';
    if (days <= 5) return '#9a3412';
    return '#991b1b';
  }

  submitAction(id: string, action: string) {
    if (action === 'reject' && !this.actionComments.trim()) {
      this.snackBar.open('Comments are required when rejecting', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    this.api.workflowAction(id, action, this.actionComments).subscribe({
      next: function(this: WorkflowInboxComponent) {
        var msg = action === 'approve' ? 'Workflow approved successfully' : action === 'reject' ? 'Workflow rejected' : 'Workflow returned for revision';
        this.snackBar.open(msg, 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        this.cancelAction();
        this.loadData();
      }.bind(this),
      error: function(this: WorkflowInboxComponent, err: any) {
        this.snackBar.open(err.error?.error || 'Action failed', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  formatCurrency(n: number | null | undefined): string {
    if (n === null || n === undefined) return 'R 0.00';
    return 'R ' + Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getCurrentFinYear(): string {
    var s = this.settingsData();
    if (s?.financial_year) return String(s.financial_year);
    var startMonth = s?.financial_year_start_month || 7;
    var now = new Date();
    var year = now.getFullYear();
    if (now.getMonth() + 1 < startMonth) {
      year = year - 1;
    }
    return year + '/' + (year + 1);
  }

  toggleDepSection() { this.depSectionExpanded.set(!this.depSectionExpanded()); }
  toggleRevalSection() { this.revalSectionExpanded.set(!this.revalSectionExpanded()); }
  toggleImpairSection() { this.impairSectionExpanded.set(!this.impairSectionExpanded()); }
  toggleReversalSection() { this.reversalSectionExpanded.set(!this.reversalSectionExpanded()); }
  toggleDisposalSection() { this.disposalSectionExpanded.set(!this.disposalSectionExpanded()); }
  toggleRefurbSection() { this.refurbSectionExpanded.set(!this.refurbSectionExpanded()); }
  toggleAssetApprovalSection() {
    var expanding = !this.assetApprovalSectionExpanded();
    this.assetApprovalSectionExpanded.set(expanding);
    if (expanding) { this.loadAssetApprovals(); }
  }

  loadAssetApprovals() {
    this.assetApprovalError.set('');
    this.api.getAssetApprovals({ status: 'Pending' }).subscribe({
      next: function(this: WorkflowInboxComponent, items: any[]) {
        var list = items || [];
        this.pendingAssetApprovals.set(list);
        this.assetApprovalPendingCount.set(list.length);
      }.bind(this),
      error: function(this: WorkflowInboxComponent, err: any) {
        this.assetApprovalError.set('Failed to load approvals: ' + (err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  setAssetApprovalDetailTab(tab: string) { this.assetApprovalDetailTab.set(tab); }

  getField(data: any, key: string): any {
    if (!data) return null;
    if (data[key] !== null && data[key] !== undefined) return data[key];
    var lower = key.charAt(0).toLowerCase() + key.slice(1);
    if (data[lower] !== null && data[lower] !== undefined) return data[lower];
    return null;
  }

  getDesc(field: string): string | null {
    var detail = this.assetApprovalDetail();
    if (!detail || !detail.descriptions) return null;
    return detail.descriptions[field] || null;
  }

  fieldDisplay(field: string, data: any): string {
    var desc = this.getDesc(field);
    if (desc) return desc;
    var raw = this.getField(data, field);
    return raw != null ? String(raw) : '';
  }

  openAssetApprovalDetail(id: number) {
    if (this.assetApprovalDetailId() === id && this.assetApprovalDetail()) {
      this.assetApprovalDetailId.set(0);
      this.assetApprovalDetail.set(null);
      return;
    }
    this.assetApprovalDetailId.set(id);
    this.assetApprovalDetail.set(null);
    this.assetApprovalDetailTab.set('changes');
    this.assetApprovalDetailLoading.set(true);
    this.api.getAssetApprovalById(id).subscribe({
      next: function(this: WorkflowInboxComponent, data: any) {
        this.assetApprovalDetail.set(data);
        this.assetApprovalDetailLoading.set(false);
      }.bind(this),
      error: function(this: WorkflowInboxComponent) {
        this.assetApprovalDetailLoading.set(false);
        this.snackBar.open('Could not load approval detail', 'OK', { duration: 3000 });
      }.bind(this)
    });
  }

  closeAssetApprovalDetail() {
    this.assetApprovalDetailId.set(0);
    this.assetApprovalDetail.set(null);
  }

  approveAssetApproval(approvalId: number) {
    this.assetApprovalApprovingId.set(approvalId);
    this.assetApprovalError.set('');
    this.api.approveAssetApproval(approvalId).subscribe({
      next: function(this: WorkflowInboxComponent, res: any) {
        this.assetApprovalApprovingId.set(0);
        this.closeAssetApprovalDetail();
        this.loadAssetApprovals();
        var msg = 'Approved successfully.';
        if (res && res.assetId) { msg = 'Approved — Asset ID ' + res.assetId + ' created in register.'; }
        this.snackBar.open(msg, 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this),
      error: function(this: WorkflowInboxComponent, err: any) {
        this.assetApprovalApprovingId.set(0);
        this.assetApprovalError.set('Approval failed: ' + (err?.error?.error || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  beginRejectAssetApproval(approvalId: number) {
    this.assetApprovalRejectId.set(approvalId);
    this.assetApprovalRejectReason = '';
  }

  cancelRejectAssetApproval() {
    this.assetApprovalRejectId.set(0);
    this.assetApprovalRejectReason = '';
  }

  confirmRejectAssetApproval() {
    var id = this.assetApprovalRejectId();
    if (!id) { return; }
    this.assetApprovalRejectId.set(0);
    this.assetApprovalApprovingId.set(id);
    this.assetApprovalError.set('');
    this.api.rejectAssetApproval(id, this.assetApprovalRejectReason).subscribe({
      next: function(this: WorkflowInboxComponent) {
        this.assetApprovalApprovingId.set(0);
        this.assetApprovalRejectReason = '';
        this.closeAssetApprovalDetail();
        this.loadAssetApprovals();
        this.snackBar.open('Approval rejected', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this),
      error: function(this: WorkflowInboxComponent, err: any) {
        this.assetApprovalApprovingId.set(0);
        this.assetApprovalError.set('Rejection failed: ' + (err?.error?.error || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  loadMonthlyApprovals() {
    this.api.getMonthlyApprovals().subscribe({
      next: function(this: WorkflowInboxComponent, rows: any[]) {
        var map: Record<string, boolean> = {};
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i];
          var key = (r.financial_Year || r.Financial_Year || '') + '|' + (r.financial_Period || r.Financial_Period || 0);
          map[key] = true;
        }
        this.monthlyApprovalMap.set(map);
      }.bind(this),
      error: function() {}
    });
  }

  getSchedulePeriod(sch: any): number {
    if (sch.financialPeriod) return Number(sch.financialPeriod);
    var scheduledDate = sch.scheduledDate ? new Date(sch.scheduledDate) : (sch.runDate ? new Date(sch.runDate) : new Date());
    var month = scheduledDate.getMonth() + 1;
    return month >= 7 ? month - 6 : month + 6;
  }

  isApprovalVerified(sch: any): boolean {
    var finYear = sch.finYear || '';
    var period = this.getSchedulePeriod(sch);
    var key = finYear + '|' + period;
    return this.monthlyApprovalMap()[key] === true;
  }

  approveVerifiedDepSchedule(sch: any) {
    this.approveDepSchedule(sch.depreciationSchedule_ID);
  }

  openTxVerifyModal(sch: any) {
    var finYear = sch.finYear || this.getCurrentFinYear();
    var period = this.getSchedulePeriod(sch);
    this.txVerifyScheduleId.set(sch.depreciationSchedule_ID);
    this.txVerifyFinYear.set(finYear);
    this.txVerifyPeriod.set(period);
    this.txVerifyReval.set(false);
    this.txVerifyImp.set(false);
    this.txVerifyReversal.set(false);
    this.txVerifyDisposal.set(false);
    this.txVerifyError.set('');
    this.txVerifyOpen.set(true);
  }

  setTxVerifyReval(e: Event) { this.txVerifyReval.set((e.target as HTMLInputElement).checked); }
  setTxVerifyImp(e: Event) { this.txVerifyImp.set((e.target as HTMLInputElement).checked); }
  setTxVerifyReversal(e: Event) { this.txVerifyReversal.set((e.target as HTMLInputElement).checked); }
  setTxVerifyDisposal(e: Event) { this.txVerifyDisposal.set((e.target as HTMLInputElement).checked); }

  txVerifyAllChecked() {
    return this.txVerifyReval() && this.txVerifyImp() && this.txVerifyReversal() && this.txVerifyDisposal();
  }

  closeTxVerify() {
    this.txVerifyOpen.set(false);
    this.txVerifyError.set('');
  }

  submitTxVerify() {
    this.txVerifySubmitting.set(true);
    this.txVerifyError.set('');
    var scheduleId = this.txVerifyScheduleId();
    this.api.createMonthlyApproval({
      financialYear: this.txVerifyFinYear(),
      financialPeriod: this.txVerifyPeriod(),
      userId: 1,
      verifiedRevaluation: true,
      verifiedImpairment: true,
      verifiedImpairmentReversal: true,
      verifiedDisposal: true
    }).subscribe({
      next: function(this: WorkflowInboxComponent) {
        this.txVerifySubmitting.set(false);
        this.txVerifyOpen.set(false);
        this.approveDepSchedule(scheduleId);
      }.bind(this),
      error: function(this: WorkflowInboxComponent, err: any) {
        this.txVerifySubmitting.set(false);
        this.txVerifyError.set('Could not record verification: ' + (err?.error?.error || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  approveDepSchedule(scheduleId: number) {
    this.approvingId.set(scheduleId);
    this.depPosting.set(true);
    this.depPostStep.set(1);
    this.approveError.set('');
    this.glValidationErrors.set([]);
    this.glValidationVisible.set(false);
    this.depRebuildProgress.set({done: 0, total: 0});
    var schedFy = '';
    var scheds = this.pendingSchedules();
    for (var si = 0; si < scheds.length; si++) {
      if (scheds[si].depreciationSchedule_ID === scheduleId) {
        schedFy = scheds[si].finYear || '';
        break;
      }
    }
    if (!schedFy) schedFy = this.getCurrentFinYear();
    var self = this;
    this.api.validateDepreciationScheduleGl({ scheduleId: scheduleId }).subscribe({
      next: function(this: WorkflowInboxComponent, valResult: any) {
        if (!valResult.valid) {
          this.approvingId.set(0);
          this.depPosting.set(false);
          this.depPostStep.set(0);
          this.glValidationTxnType.set('Depreciation');
          this.glValidationErrors.set(valResult.results || []);
          this.glValidationVisible.set(true);
          return;
        }
        this.depPostStep.set(2);
        var self2 = this;
        setTimeout(function() { if (self2.depPostStep() === 2) self2.depPostStep.set(3); }, 1500);
        self2.api.approveDepreciationBatch({
          scheduleId: scheduleId,
          finYear: schedFy,
          approvedBy: 'Administrator'
        }).subscribe({
          next: function(this: WorkflowInboxComponent, result: any) {
            if (this.depPostStep() < 3) this.depPostStep.set(3);
            var self3 = this;
            var assetIds = result.assetIdsToRebuild || [];
            var finYear = result.finYear || schedFy;
            var rebuildPeriod = result.rebuildPeriod || 1;
            var progressKey = result.progressKey || String(scheduleId);
            var total = assetIds.length;
            self3.depRebuildProgress.set({done: 0, total: total});
            setTimeout(function() {
              self3.depPostStep.set(4);
              if (self3.depRebuildPollInterval) { clearInterval(self3.depRebuildPollInterval); }
              self3.depRebuildPollInterval = setInterval(function() {
                self3.api.getDepRebuildProgress(progressKey).subscribe({
                  next: function(p: any) {
                    self3.depRebuildProgress.set({done: p.done || 0, total: p.total || total});
                    if (p.complete === true) {
                      if (self3.depRebuildPollInterval) { clearInterval(self3.depRebuildPollInterval); self3.depRebuildPollInterval = null; }
                      self3.depRebuildProgress.set({done: total, total: total});
                      self3.approvingId.set(0);
                      self3.loadPendingItems();
                      self3.loadData();
                      if (self3.depPostStep() < 4) self3.depPostStep.set(4);
                      setTimeout(function() {
                        self3.depPostStep.set(5);
                        setTimeout(function() {
                          self3.depPosting.set(false);
                          self3.depPostStep.set(0);
                          self3.depRebuildProgress.set({done: 0, total: 0});
                        }, 2500);
                      }, 800);
                    }
                  },
                  error: function() {}
                });
              }, 600);
              self3.api.rebuildDepSummaries({
                assetIds: assetIds,
                finYear: finYear,
                rebuildPeriod: rebuildPeriod,
                progressKey: progressKey
              }).subscribe({
                next: function() {},
                error: function(err: any) {
                  if (self3.depRebuildPollInterval) { clearInterval(self3.depRebuildPollInterval); self3.depRebuildPollInterval = null; }
                  self3.approvingId.set(0);
                  self3.depPosting.set(false);
                  self3.depPostStep.set(0);
                  self3.approveError.set('Summary rebuild failed: ' + (err?.error?.error || err?.message || 'Unknown error'));
                }
              });
            }, 600);
          }.bind(this),
          error: function(this: WorkflowInboxComponent, err: any) {
            this.approvingId.set(0);
            this.depPosting.set(false);
            this.depPostStep.set(0);
            this.approveError.set('Approval failed: ' + (err?.error?.error || err?.message || 'Unknown error'));
          }.bind(this)
        });
      }.bind(this),
      error: function(this: WorkflowInboxComponent, err: any) {
        this.approvingId.set(0);
        this.depPosting.set(false);
        this.depPostStep.set(0);
        this.approveError.set('GL validation could not be completed — approval blocked. ' + (err?.error?.error || err?.message || 'Please try again.'));
      }.bind(this)
    });
  }

  rejectDepreciation(scheduleId: number) {
    this.rejectConfirmScheduleId.set(scheduleId);
  }

  cancelRejectDepreciation() {
    this.rejectConfirmScheduleId.set(0);
  }

  confirmRejectDepreciation() {
    var scheduleId = this.rejectConfirmScheduleId();
    if (!scheduleId) return;
    this.rejectConfirmScheduleId.set(0);
    this.rejectingScheduleId.set(scheduleId);
    this.api.rejectDepreciationSchedule(scheduleId).subscribe({
      next: function(this: WorkflowInboxComponent) {
        this.rejectingScheduleId.set(0);
        this.loadPendingItems();
        this.loadData();
      }.bind(this),
      error: function(this: WorkflowInboxComponent, err: any) {
        this.rejectingScheduleId.set(0);
        this.approveError.set('Rejection failed: ' + (err?.error?.error || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  approveRevaluation(reval: any) {
    var id = reval.Asset_RevaluationsID || reval.asset_RevaluationsID;
    this.approvingId.set(id);
    this.approveError.set('');
    this.api.approveRevaluation(id, 1).subscribe({
      next: function(this: WorkflowInboxComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
        this.loadData();
      }.bind(this),
      error: function(this: WorkflowInboxComponent, err: any) {
        this.approvingId.set(0);
        this.approveError.set('Revaluation approval failed: ' + (err?.error?.error || err?.error?.details || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  triggerRecalculation(assetId: number, finYear: string, afterDate: string, txnType: string) {
    this.api.recalculateAfterRejection({ assetId, finYear, afterDate: new Date(afterDate), rejectedTransactionType: txnType }).subscribe({
      next: function(this: WorkflowInboxComponent, res: any) {
        if (res && (res.impairmentsUpdated > 0 || res.disposalsUpdated > 0)) {
          this.snackBar.open('Subsequent transactions recalculated (' + (res.impairmentsUpdated + res.disposalsUpdated) + ' updated)', 'OK', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
          this.loadPendingItems();
        }
      }.bind(this),
      error: function() {}
    });
  }

  rejectRevaluation(reval: any) {
    var id = reval.Asset_RevaluationsID || reval.asset_RevaluationsID;
    this.approvingId.set(id);
    this.api.rejectRevaluation(id).subscribe({
      next: function(this: WorkflowInboxComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
        this.loadData();
        if (this.approvalMethod() === 'Automated') {
          var assetId = reval.AssetRegisterID || reval.assetRegisterID || 0;
          var finYear = reval.finYear || reval.FinYear || '';
          var date = reval.RevaluationDate || reval.revaluationDate || '';
          if (assetId && date) { this.triggerRecalculation(assetId, finYear, date, 'revaluation'); }
        }
      }.bind(this),
      error: function(this: WorkflowInboxComponent) {
        this.approvingId.set(0);
      }.bind(this)
    });
  }

  approveImpairment(item: any) {
    var id = item.assetImpairment_ID || item.AssetImpairment_ID || item.id;
    this.approvingId.set(id);
    this.approveError.set('');
    this.api.approveImpairment(id, 1).subscribe({
      next: function(this: WorkflowInboxComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
        this.loadData();
      }.bind(this),
      error: function(this: WorkflowInboxComponent, err: any) {
        this.approvingId.set(0);
        this.approveError.set('Impairment approval failed: ' + (err?.error?.error || err?.error?.details || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  rejectImpairment(item: any) {
    var id = item.assetImpairment_ID || item.AssetImpairment_ID || item.id;
    this.approvingId.set(id);
    this.api.rejectImpairment(id).subscribe({
      next: function(this: WorkflowInboxComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
        this.loadData();
        if (this.approvalMethod() === 'Automated') {
          var assetId = item.assetRegisterItem_ID || item.AssetRegisterItem_ID || 0;
          var finYear = item.finYear || item.FinYear || '';
          var date = item.impairmentDate || item.ImpairmentDate || '';
          if (assetId && date) { this.triggerRecalculation(assetId, finYear, date, 'impairment'); }
        }
      }.bind(this),
      error: function(this: WorkflowInboxComponent) {
        this.approvingId.set(0);
      }.bind(this)
    });
  }

  approveDisposal(item: any) {
    var id = item.assetDisposal_ID || item.AssetDisposal_ID || item.id;
    this.approvingId.set(id);
    this.approveError.set('');
    this.api.approveDisposal(id, 1).subscribe({
      next: function(this: WorkflowInboxComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
        this.loadData();
      }.bind(this),
      error: function(this: WorkflowInboxComponent, err: any) {
        this.approvingId.set(0);
        this.approveError.set('Disposal approval failed: ' + (err?.error?.error || err?.error?.details || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  rejectDisposal(item: any) {
    var id = item.assetDisposal_ID || item.AssetDisposal_ID || item.id;
    this.approvingId.set(id);
    this.api.rejectDisposal(id).subscribe({
      next: function(this: WorkflowInboxComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
        this.loadData();
        if (this.approvalMethod() === 'Automated') {
          var assetId = item.assetRegisterItem_ID || item.AssetRegisterItem_ID || 0;
          var finYear = item.finYear || item.FinYear || '';
          var date = item.disposalDate || item.DisposalDate || '';
          if (assetId && date) { this.triggerRecalculation(assetId, finYear, date, 'disposal'); }
        }
      }.bind(this),
      error: function(this: WorkflowInboxComponent) {
        this.approvingId.set(0);
      }.bind(this)
    });
  }

  approveRefurbishment(item: any) {
    var id = item.asset_RefurbID || item.Asset_RefurbID || item.id;
    this.approvingId.set(id);
    this.approveError.set('');
    this.api.approveRefurbishment(id, 1).subscribe({
      next: function(this: WorkflowInboxComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
        this.loadData();
        this.snackBar.open('Refurbishment approved successfully', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this),
      error: function(this: WorkflowInboxComponent, err: any) {
        this.approvingId.set(0);
        this.approveError.set('Refurbishment approval failed: ' + (err?.error?.error || err?.error?.details || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  rejectRefurbishment(item: any) {
    var id = item.asset_RefurbID || item.Asset_RefurbID || item.id;
    this.approvingId.set(id);
    this.api.rejectRefurbishment(id).subscribe({
      next: function(this: WorkflowInboxComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
        this.loadData();
        this.snackBar.open('Refurbishment rejected', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this),
      error: function(this: WorkflowInboxComponent) {
        this.approvingId.set(0);
      }.bind(this)
    });
  }

  approveImpairmentReversal(item: any) {
    var id = item.assetImpairment_ID || item.AssetImpairment_ID || item.id;
    this.approvingId.set(id);
    this.approveError.set('');
    this.api.approveImpairmentReversal(id, 1).subscribe({
      next: function(this: WorkflowInboxComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
        this.loadData();
      }.bind(this),
      error: function(this: WorkflowInboxComponent, err: any) {
        this.approvingId.set(0);
        this.approveError.set('Reversal approval failed: ' + (err?.error?.error || err?.error?.details || err?.message || 'Unknown error'));
      }.bind(this)
    });
  }

  rejectImpairmentReversal(item: any) {
    var id = item.assetImpairment_ID || item.AssetImpairment_ID || item.id;
    this.approvingId.set(id);
    this.api.rejectImpairmentReversal(id).subscribe({
      next: function(this: WorkflowInboxComponent) {
        this.approvingId.set(0);
        this.loadPendingItems();
        this.loadData();
        if (this.approvalMethod() === 'Automated') {
          var assetId = item.assetRegisterItem_ID || item.AssetRegisterItem_ID || 0;
          var finYear = item.finYear || item.FinYear || '';
          var date = item.impairmentDate || item.ImpairmentDate || '';
          if (assetId && date) { this.triggerRecalculation(assetId, finYear, date, 'reversal'); }
        }
      }.bind(this),
      error: function(this: WorkflowInboxComponent) {
        this.approvingId.set(0);
      }.bind(this)
    });
  }

  toggleScheduleDetails(scheduleId: number) {
    if (this.depDetailScheduleId() === scheduleId && this.depScheduleItems().length > 0) {
      this.depDetailScheduleId.set(0);
      this.depScheduleItems.set([]);
      this.depItemDetails.set({});
      this.depItemExpanded.set({});
      return;
    }
    this.loadScheduleItems(scheduleId);
  }

  loadScheduleItems(scheduleId: number) {
    this.depScheduleItemsLoading.set(true);
    this.depDetailScheduleId.set(scheduleId);
    this.depScheduleItems.set([]);
    this.depItemDetails.set({});
    this.depItemExpanded.set({});
    this.api.getDepreciationScheduleById(scheduleId).subscribe({
      next: function(this: WorkflowInboxComponent, resp: any) {
        var items = resp.items || [];
        var pending: any[] = [];
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var statusId = item['StatusID'] !== undefined ? item['StatusID'] :
                         (item['statusID'] !== undefined ? item['statusID'] : -1);
          var totalAssets = item['TotalAssets'] !== undefined ? item['TotalAssets'] : item['totalAssets'];
          var hasData = totalAssets !== null && totalAssets !== undefined && Number(totalAssets) > 0;
          if (hasData && statusId !== 13) {
            pending.push(item);
          }
        }
        this.depScheduleItems.set(pending.length > 0 ? pending : items);
        this.depScheduleItemsLoading.set(false);
      }.bind(this),
      error: function(this: WorkflowInboxComponent) {
        this.depScheduleItemsLoading.set(false);
      }.bind(this)
    });
  }

  getItemId(si: any): number {
    return si['DepreciationScheduleItem_ID'] || si['depreciationScheduleItem_ID'] ||
           si['Asset_DepreciationSchedule_Item_ID'] || si['asset_DepreciationSchedule_Item_ID'] || 0;
  }

  getScheduleItemVal(item: any, key: string): any {
    if (item[key] !== undefined) return item[key];
    var lower = key.charAt(0).toLowerCase() + key.slice(1);
    if (item[lower] !== undefined) return item[lower];
    return null;
  }

  getScheduleItemFinPeriod(item: any): string {
    var fp = this.getScheduleItemVal(item, 'FinancialPeriod') || this.getScheduleItemVal(item, 'Month_ID');
    var fy = this.getScheduleItemVal(item, 'FinYear') || '';
    if (!fp && !fy) return '—';
    var periodLabel = '';
    if (fp) {
      for (var i = 0; i < this.periodMonths.length; i++) {
        if (this.periodMonths[i].value === Number(fp)) {
          periodLabel = this.periodMonths[i].label;
          break;
        }
      }
    }
    if (fy && periodLabel) return fy + ' P' + fp + ' (' + periodLabel + ')';
    if (fy) return fy;
    return 'P' + fp;
  }

  toggleScheduleItemDetail(scheduleId: number, itemId: number) {
    var expanded = this.depItemExpanded();
    var newExpanded: Record<number, boolean> = {};
    for (var k in expanded) {
      newExpanded[k] = expanded[k];
    }
    if (newExpanded[itemId]) {
      newExpanded[itemId] = false;
      this.depItemExpanded.set(newExpanded);
      return;
    }
    newExpanded[itemId] = true;
    this.depItemExpanded.set(newExpanded);
    var existing = this.depItemDetails();
    if (existing[itemId] && existing[itemId].length > 0) {
      return;
    }
    var loadingMap: Record<number, boolean> = {};
    var currentLoading = this.depItemDetailsLoading();
    for (var lk in currentLoading) {
      loadingMap[lk] = currentLoading[lk];
    }
    loadingMap[itemId] = true;
    this.depItemDetailsLoading.set(loadingMap);

    this.api.getDepreciationScheduleDetails(scheduleId, undefined, itemId).subscribe({
      next: function(this: WorkflowInboxComponent, items: any[]) {
        var detailMap: Record<number, any[]> = {};
        var curr = this.depItemDetails();
        for (var dk in curr) {
          detailMap[dk] = curr[dk];
        }
        detailMap[itemId] = items || [];
        this.depItemDetails.set(detailMap);
        var lm: Record<number, boolean> = {};
        var cl = this.depItemDetailsLoading();
        for (var lkey in cl) {
          lm[lkey] = cl[lkey];
        }
        lm[itemId] = false;
        this.depItemDetailsLoading.set(lm);
      }.bind(this),
      error: function(this: WorkflowInboxComponent) {
        var lm: Record<number, boolean> = {};
        var cl = this.depItemDetailsLoading();
        for (var lkey in cl) {
          lm[lkey] = cl[lkey];
        }
        lm[itemId] = false;
        this.depItemDetailsLoading.set(lm);
      }.bind(this)
    });
  }

  isItemExpanded(itemId: number): boolean {
    return !!this.depItemExpanded()[itemId];
  }

  isItemLoading(itemId: number): boolean {
    return !!this.depItemDetailsLoading()[itemId];
  }

  getItemDetails(itemId: number): any[] {
    return this.depItemDetails()[itemId] || [];
  }

  getDetailVal(item: any, key: string): any {
    return item[key] !== undefined ? item[key] : item[key.charAt(0).toLowerCase() + key.slice(1)];
  }

  exportScheduleDetail(scheduleId: number, itemId?: number) {
    var url = this.api.exportDepreciationScheduleDetails(scheduleId, itemId);
    window.open(url, '_blank');
  }

  dismissGlValidation() {
    this.glValidationVisible.set(false);
    this.glValidationErrors.set([]);
  }

  getMissingFieldsText(fields: string[]): string {
    if (!fields) return '';
    var text = '';
    for (var i = 0; i < fields.length; i++) {
      if (i > 0) text = text + ', ';
      text = text + fields[i];
    }
    return text;
  }

  detailItem = signal<any>(null);
  detailItemType = signal<string>('');
  detailLoading = signal(false);

  openDetail(item: any, type: string) {
    var id: number = 0;
    if (type === 'impairment' || type === 'reversal') {
      id = item.assetImpairment_ID || item.AssetImpairment_ID || 0;
    } else if (type === 'disposal') {
      id = item.assetDisposal_ID || item.AssetDisposal_ID || 0;
    } else if (type === 'revaluation') {
      id = item.Asset_RevaluationsID || item.asset_RevaluationsID || 0;
    }
    if (!id) return;
    this.detailItem.set(null);
    this.detailItemType.set(type);
    this.detailLoading.set(true);
    var obs: any;
    if (type === 'impairment' || type === 'reversal') {
      obs = this.api.getImpairmentDetail(id);
    } else if (type === 'disposal') {
      obs = this.api.getDisposalDetail(id);
    } else {
      obs = this.api.getRevaluationDetail(id);
    }
    obs.subscribe({
      next: function(this: WorkflowInboxComponent, data: any) {
        this.detailItem.set(data);
        this.detailLoading.set(false);
      }.bind(this),
      error: function(this: WorkflowInboxComponent) {
        this.detailLoading.set(false);
        this.snackBar.open('Could not load transaction detail', 'OK', { duration: 3000 });
      }.bind(this)
    });
  }

  closeDetail() {
    this.detailItem.set(null);
    this.detailItemType.set('');
  }

  detailField(path: string): any {
    var d = this.detailItem();
    if (!d) return null;
    var parts = path.split('.');
    var val: any = d;
    for (var i = 0; i < parts.length; i++) {
      if (val == null) return null;
      var key = parts[i];
      if (val[key] !== undefined) { val = val[key]; continue; }
      var lower = key.charAt(0).toLowerCase() + key.slice(1);
      val = val[lower];
    }
    return val;
  }

  detailCurrency(path: string): string {
    return this.formatCurrency(this.detailField(path));
  }
}
