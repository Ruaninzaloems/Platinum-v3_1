import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { CurrencyZarPipe } from '../../../shared/pipes/currency-zar.pipe';
import { DateSaPipe } from '../../../shared/pipes/date-sa.pipe';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, CurrencyZarPipe, DateSaPipe, PaginationComponent, DateInputComponent],
  templateUrl: './payroll.component.html',
  styleUrl: './payroll.component.css'
})
export class PayrollComponent implements OnInit, OnDestroy {
  activeTab = 'runs';
  tabs = [
    { id: 'runs', label: 'Payroll Runs', icon: 'dollarSign' },
    { id: 'salaryincreases', label: 'Salary Increases', icon: 'trendingUp' },
    { id: 'variance', label: 'Variance', icon: 'barChart' },
    { id: 'gl', label: 'GL & Sub-Ledger', icon: 'book' },
    { id: 'grap25', label: 'GRAP 25', icon: 'shield' },
    { id: 'payments', label: 'Payments', icon: 'briefcase' },
    { id: 'councillor', label: 'Councillor Register', icon: 'users' },
    { id: 'tax', label: 'Tax Tables', icon: 'fileText' },
    { id: 'thirdparty', label: 'Third Party Payments', icon: 'users' },
    { id: 'salaryheads', label: 'Salary Heads', icon: 'clipboard' }
  ];

  runs: any[] = [];
  cycles: any[] = [];
  periods: any[] = [];
  loading = true;

  filters = { status: '', cycle_id: '' };
  pagination = { page: 1, limit: 20, total: 0 };

  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'LOCKED', label: 'Locked' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'FAILED', label: 'Failed' }
  ];

  pipelineCounts = { trial: 0, reviewed: 0, locked: 0, approved: 0 };

  showRunModal = false;
  newRun: any = { cycle_id: '', period_id: '', run_type: 'TRIAL', payment_date: '' };
  newRunPeriods: any[] = [];
  loadingPeriods = false;

  showDetailModal = false;
  detailRun: any = null;
  detailResults: any[] = [];
  detailErrors: any[] = [];
  detailEmployees: any[] = [];
  detailLineItems: any[] = [];
  detailScoaEntries: any[] = [];
  detailActiveTab = 'detail-summary';
  detailLoading = false;
  detailSummaryCards: any[] = [];
  detailStatusSteps: any[] = [];
  detailTotalPaye = 0;
  detailTotalUifEe = 0;
  detailTotalSdl = 0;
  detailTotalEti = 0;

  showProgressModal = false;
  progressData: any = { percent: 0, processed: 0, total: 0, status: '', currentEmployee: '', errors: 0, eta_seconds: 0, elapsed_ms: 0 };
  progressRunId = 0;
  progressTitle = '';
  progressSubtitle = '';
  private progressInterval: any = null;

  taxData: any = null;
  taxLoading = false;

  salaryIncreases: any[] = [];
  siLoading = false;
  siStatusFilter = '';

  varianceRuns: any[] = [];
  varianceRunId = '';
  varianceCompareType = '';
  varianceLoading = false;
  varianceData: any = null;

  glRuns: any[] = [];
  glRunId = '';
  glView = 'gl';
  glLoading = false;
  glData: any = null;
  slData: any = null;
  reconData: any = null;

  grap25LeaveDate = '';
  grap25BonusDate = '';
  grap25LeavePostJournal = false;
  grap25BonusPostJournal = false;
  grap25LeaveResult: any = null;
  grap25BonusResult: any = null;
  grap25LeaveLoading = false;
  grap25BonusLoading = false;

  paymentRuns: any[] = [];
  paySelectedRunId = '';
  payBatches: any[] = [];
  payLoading = false;
  payStats: any[] = [];

  councillors: any[] = [];
  councillorLoading = false;

  thirdPartyPayments: any[] = [];
  thirdPartyLoading = false;
  tppTotalPending = 0;
  tppTotalApproved = 0;
  tppTotalPaid = 0;

  salaryHeads: any[] = [];
  salaryHeadsLoading = false;
  showSalaryHeadModal = false;
  editingSalaryHead: any = null;
  salaryHeadForm: any = {};

  glJournalsLoading = false;
  glJournalsData: any = null;

  showVoidModal = false;
  voidRunId = 0;
  voidReason = '';

  Math = Math;

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    const now = new Date();
    this.grap25LeaveDate = now.toISOString().split('T')[0];
    this.grap25BonusDate = now.toISOString().split('T')[0];
    this.loadCycles();
  }

  ngOnDestroy(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  loadCycles(): void {
    this.api.get<any[]>('/payroll/cycles').subscribe({
      next: (data) => {
        this.cycles = data || [];
        this.loadRuns();
       this.cdr.detectChanges(); },
      error: () => { this.cycles = []; this.loadRuns(); }
    });
  }

  loadRuns(): void {
    this.loading = true;
    const params: any = { page: this.pagination.page, limit: this.pagination.limit };
    if (this.filters.status) params.status = this.filters.status;
    if (this.filters.cycle_id) params.cycle_id = this.filters.cycle_id;

    this.api.getRaw<any[]>('/payroll/runs', params).subscribe({
      next: (res: any) => {
        this.runs = res.data || [];
        this.pagination.total = res.meta?.total || res.pagination?.total || 0;
        this.updatePipeline();
        this.loading = false; this.cdr.detectChanges();
      },
      error: () => { this.runs = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  updatePipeline(): void {
    const counts = { PENDING: 0, PROCESSING: 0, COMPLETED: 0, LOCKED: 0, APPROVED: 0 };
    const trialCompleted = this.runs.filter(r => ['TRIAL', 'ADHOC_TRIAL'].includes(r.run_type) && r.status === 'COMPLETED').length;
    this.runs.forEach(r => { if (counts[r.status as keyof typeof counts] !== undefined) counts[r.status as keyof typeof counts]++; });
    this.pipelineCounts = {
      trial: counts.PENDING + counts.PROCESSING + trialCompleted,
      reviewed: counts.COMPLETED - trialCompleted,
      locked: counts.LOCKED,
      approved: counts.APPROVED
    };
  }

  onFilterChange(): void {
    this.pagination.page = 1;
    this.loadRuns();
  }

  goToPage(page: number): void {
    this.pagination.page = page;
    this.loadRuns();
  }

  switchTab(tabId: string): void {
    this.activeTab = tabId;
    if (tabId === 'tax' && !this.taxData) this.loadTaxTables();
    if (tabId === 'salaryincreases') this.loadSalaryIncreases();
    if (tabId === 'variance') this.loadVarianceRuns();
    if (tabId === 'gl') this.loadGLRuns();
    if (tabId === 'payments') this.loadPaymentRuns();
    if (tabId === 'councillor') this.loadCouncillors();
    if (tabId === 'thirdparty') this.loadThirdPartyPayments();
    if (tabId === 'salaryheads') this.loadSalaryHeadsList();
  }

  isTrial(run: any): boolean {
    return ['TRIAL', 'ADHOC_TRIAL'].includes(run.run_type);
  }

  formatCurrency(val: any): string {
    const n = parseFloat(val) || 0;
    return 'R' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  openCreateRunModal(): void {
    this.newRun = { cycle_id: '', period_id: '', run_type: 'TRIAL', payment_date: '' };
    this.newRunPeriods = [];
    this.showRunModal = true;
  }

  onCycleChange(): void {
    if (!this.newRun.cycle_id) {
      this.newRunPeriods = [];
      return;
    }
    this.loadingPeriods = true;
    this.api.get<any[]>('/payroll/periods', { cycle_id: this.newRun.cycle_id, status: 'OPEN', available_for_run: true }).subscribe({
      next: (data) => { this.newRunPeriods = data || []; this.loadingPeriods = false;  this.cdr.detectChanges(); },
      error: () => { this.newRunPeriods = []; this.loadingPeriods = false; }
    });
  }

  submitRun(): void {
    if (!this.newRun.cycle_id || !this.newRun.period_id) {
      this.ui.toast('warning', 'Validation', 'Select a cycle and period');
      return;
    }
    this.api.post<any>('/payroll/runs', {
      cycle_id: parseInt(this.newRun.cycle_id),
      period_id: parseInt(this.newRun.period_id),
      run_type: this.newRun.run_type,
      payment_date: this.newRun.payment_date || null
    }).subscribe({
      next: (data) => {
        this.ui.toast('success', 'Payroll Run Created', `Run #${data?.id || ''} created as ${this.newRun.run_type}`);
        this.showRunModal = false;
        this.loadRuns();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to create payroll run')
    });
  }

  async executeRun(id: number): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Execute Payroll Run',
      message: `This will calculate payroll for all active employees in Run #${id}. Continue?`,
      danger: false
    });
    if (!confirmed) return;
    this.openProgressModal(id, false);
    this.api.post(`/payroll/runs/${id}/execute`, { async: true }).subscribe({
      next: () => {},
      error: (err) => {
        this.stopPolling();
        this.progressData.status = 'FAILED';
        this.ui.toast('error', 'Execution Failed', 'Failed to start payroll execution');
      }
    });
  }

  openProgressModal(id: number, isResumed: boolean): void {
    this.stopPolling();
    this.progressRunId = id;
    this.progressData = { percent: 0, processed: 0, total: 0, status: 'PROCESSING', currentEmployee: '', errors: 0, eta_seconds: 0, elapsed_ms: 0 };
    this.progressTitle = isResumed ? `Payroll run #${id} in progress...` : `Initialising payroll run #${id}...`;
    this.progressSubtitle = isResumed ? 'Reconnecting to running payroll' : 'Preparing employee data';
    this.showProgressModal = true;
    this.startPolling(id);
  }

  private startPolling(id: number): void {
    this.progressInterval = setInterval(() => {
      this.api.get<any>(`/payroll/runs/${id}/progress`).subscribe({
        next: (d: any) => {
          if (!d) return;
          this.progressData = d;
          if (d.total > 0) {
            this.progressTitle = `Processing payroll run #${id}`;
            this.progressSubtitle = `Calculating ${d.total.toLocaleString()} employees`;
          }
          if (d.status === 'COMPLETED' || d.status === 'FAILED') {
            this.stopPolling();
            if (d.status === 'COMPLETED') {
              this.progressTitle = `Payroll run #${id} completed`;
              this.progressSubtitle = `${d.total.toLocaleString()} employees processed successfully`;
              this.ui.toast('success', 'Payroll Executed', `Processed ${d.total.toLocaleString()} employees`);
            } else {
              this.progressTitle = `Payroll run #${id} failed`;
              this.progressSubtitle = 'Payroll run encountered errors';
              this.ui.toast('error', 'Execution Failed', 'Payroll run encountered errors');
            }
          }
        },
        error: () => {}
      });
    }, 1500);
  }

  private stopPolling(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  closeProgressModal(): void {
    this.showProgressModal = false;
    this.stopPolling();
    this.loadRuns();
  }

  getProgressEta(): string {
    const s = this.progressData.eta_seconds;
    if (!s || s <= 0) return '';
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return mins > 0 ? `ETA: ${mins}m ${secs}s` : `ETA: ${secs}s`;
  }

  getProgressElapsed(): string {
    if (!this.progressData.elapsed_ms) return '';
    return `Completed in ${Math.round(this.progressData.elapsed_ms / 1000)}s`;
  }

  async promoteRun(id: number): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Promote to Final Run',
      message: `This will promote Trial Run #${id} to a FINAL run and lock it for approval. Continue?`,
      danger: false
    });
    if (!confirmed) return;
    this.api.post(`/payroll/runs/${id}/promote`, {}).subscribe({
      next: () => { this.ui.toast('success', 'Promoted to Final', `Run #${id} is now a FINAL run`); this.loadRuns(); },
      error: () => this.ui.toast('error', 'Promote Failed', 'Failed to promote run')
    });
  }

  async lockRun(id: number): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Lock Payroll Run',
      message: `Locking Run #${id} will prevent further changes. Continue?`,
      danger: true
    });
    if (!confirmed) return;
    this.api.post(`/payroll/runs/${id}/lock`, {}).subscribe({
      next: () => { this.ui.toast('success', 'Run Locked', `Payroll Run #${id} has been locked`); this.loadRuns(); },
      error: () => this.ui.toast('error', 'Lock Failed', 'Failed to lock run')
    });
  }

  async unlockRun(id: number): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Unlock Payroll Run',
      message: `Unlocking Run #${id} will revert it to a TRIAL run. Continue?`,
      danger: true
    });
    if (!confirmed) return;
    this.api.post(`/payroll/runs/${id}/unlock`, {}).subscribe({
      next: () => { this.ui.toast('success', 'Run Unlocked', `Run #${id} reverted to trial`); this.loadRuns(); },
      error: () => this.ui.toast('error', 'Unlock Failed', 'Failed to unlock run')
    });
  }

  async approveRun(id: number): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Approve Payroll Run',
      message: `Approving Run #${id} authorises this payroll for payment. This is permanent. Continue?`,
      danger: true
    });
    if (!confirmed) return;
    this.api.post(`/payroll/runs/${id}/approve`, {}).subscribe({
      next: () => { this.ui.toast('success', 'Run Approved', `Payroll Run #${id} has been approved`); this.loadRuns(); },
      error: () => this.ui.toast('error', 'Approval Failed', 'Failed to approve run')
    });
  }

  openVoidModal(id: number): void {
    this.voidRunId = id;
    this.voidReason = '';
    this.showVoidModal = true;
  }

  submitVoid(): void {
    if (!this.voidReason.trim()) {
      this.ui.toast('error', 'Validation Error', 'Reason is required');
      return;
    }
    this.api.post(`/payroll/runs/${this.voidRunId}/void`, { reason: this.voidReason }).subscribe({
      next: () => {
        this.ui.toast('success', 'Run Voided', `Payroll Run #${this.voidRunId} has been voided`);
        this.showVoidModal = false;
        this.loadRuns();
      },
      error: () => this.ui.toast('error', 'Void Failed', 'Failed to void run')
    });
  }

  showRunDetail(id: number): void {
    this.showDetailModal = true;
    this.detailLoading = true;
    this.detailActiveTab = 'detail-summary';
    this.detailRun = null;
    this.detailResults = [];
    this.detailErrors = [];
    this.detailEmployees = [];
    this.detailLineItems = [];
    this.detailScoaEntries = [];

    const runReq = this.api.get<any>(`/payroll/runs/${id}`);
    const resultsReq = this.api.get<any>(`/payroll/runs/${id}/results`, { limit: 200 });
    const errorsReq = this.api.get<any>(`/payroll/runs/${id}/errors`);

    runReq.subscribe({
      next: (run) => {
        this.detailRun = run;
        resultsReq.subscribe({
          next: (results) => {
            this.detailResults = results || [];
            this.processDetailResults();
            errorsReq.subscribe({
              next: (errors) => { this.detailErrors = errors || []; this.detailLoading = false;  this.cdr.detectChanges(); },
              error: () => { this.detailErrors = []; this.detailLoading = false; }
            });
          },
          error: () => { this.detailResults = []; this.processDetailResults(); this.detailLoading = false; }
        });
      },
      error: () => { this.detailLoading = false; this.ui.toast('error', 'Error', 'Failed to load run details'); }
    });
  }

  processDetailResults(): void {
    this.detailTotalPaye = 0;
    this.detailTotalUifEe = 0;
    this.detailTotalSdl = 0;
    this.detailTotalEti = 0;

    const empMap: any = {};
    const scoaMap: any = {};

    this.detailResults.forEach((r: any) => {
      if (r.salary_head_code === 'PAYE') this.detailTotalPaye += parseFloat(r.amount) || 0;
      else if (r.salary_head_code === 'UIF_EE') this.detailTotalUifEe += parseFloat(r.amount) || 0;
      else if (r.salary_head_code === 'SDL') this.detailTotalSdl += parseFloat(r.amount) || 0;
      if (r.salary_head_code === 'ETI' || (r.salary_head_name && r.salary_head_name.includes('ETI')))
        this.detailTotalEti += parseFloat(r.amount) || 0;

      if (!empMap[r.employee_id]) {
        empMap[r.employee_id] = {
          id: r.employee_id, code: r.employee_code, name: `${r.first_name} ${r.surname}`,
          earnings: 0, deductions: 0, company: 0, eti: 0,
          hasArrears: false, hasOvertime: false, hasInstalment: false
        };
      }
      const emp = empMap[r.employee_id];
      if (r.transaction_type === 'EARNING') emp.earnings += parseFloat(r.amount) || 0;
      else if (r.transaction_type === 'DEDUCTION') emp.deductions += parseFloat(r.amount) || 0;
      else if (r.transaction_type === 'COMPANY_CONTRIBUTION') emp.company += parseFloat(r.amount) || 0;
      if (r.salary_head_code === 'ETI' || (r.salary_head_name && r.salary_head_name.includes('ETI')))
        emp.eti += parseFloat(r.amount) || 0;
      if (r.salary_head_code === 'ARREARS' || (r.salary_head_name && r.salary_head_name.includes('Arrear'))) emp.hasArrears = true;
      if (r.salary_head_code === 'OT' || (r.salary_head_name && r.salary_head_name.includes('Overtime'))) emp.hasOvertime = true;
      if (r.salary_head_name && (r.salary_head_name.includes('Instalment') || r.salary_head_name.includes('Garnish'))) emp.hasInstalment = true;

      if (r.scoa_item_id) {
        if (!scoaMap[r.scoa_item_id]) scoaMap[r.scoa_item_id] = { scoa_item_id: r.scoa_item_id, total: 0, count: 0, type: r.transaction_type };
        scoaMap[r.scoa_item_id].total += parseFloat(r.amount) || 0;
        scoaMap[r.scoa_item_id].count++;
      }
    });

    this.detailEmployees = Object.values(empMap);
    this.detailLineItems = this.detailResults;
    this.detailScoaEntries = Object.values(scoaMap);

    if (this.detailRun) {
      const statusSteps = ['PENDING', 'PROCESSING', 'COMPLETED', 'LOCKED', 'APPROVED'];
      const currentIdx = statusSteps.indexOf(this.detailRun.status);
      this.detailStatusSteps = statusSteps.map((s, i) => ({
        label: s,
        status: i < currentIdx ? 'completed' : i === currentIdx ? 'active' : 'pending'
      }));
    }
  }

  loadDetailGLJournals(): void {
    if (!this.detailRun) return;
    this.glJournalsLoading = true;
    this.api.get<any>(`/payroll/runs/${this.detailRun.id}/gl-journals`).subscribe({
      next: (data) => {
        this.glJournalsData = data;
        this.glJournalsLoading = false;
       this.cdr.detectChanges(); },
      error: () => { this.glJournalsData = { data: [] }; this.glJournalsLoading = false; }
    });
  }

  loadTaxTables(): void {
    this.taxLoading = true;
    this.api.get<any>('/payroll/tax-tables').subscribe({
      next: (data) => { this.taxData = data; this.taxLoading = false;  this.cdr.detectChanges(); },
      error: () => { this.taxData = null; this.taxLoading = false; }
    });
  }

  loadSalaryIncreases(): void {
    this.siLoading = true;
    const params: any = {};
    if (this.siStatusFilter) params.status = this.siStatusFilter;
    this.api.get<any[]>('/payroll/salary-increases', params).subscribe({
      next: (data) => { this.salaryIncreases = data || []; this.siLoading = false;  this.cdr.detectChanges(); },
      error: () => { this.salaryIncreases = []; this.siLoading = false; }
    });
  }

  onSiFilterChange(): void {
    this.loadSalaryIncreases();
  }

  approveSalaryIncrease(id: number): void {
    this.api.post(`/payroll/salary-increases/${id}/approve`, {}).subscribe({
      next: () => { this.ui.toast('success', 'Approved', 'Salary increase approved'); this.loadSalaryIncreases(); },
      error: (err) => this.ui.toast('error', 'Error', 'Failed to approve')
    });
  }

  applySalaryIncrease(id: number): void {
    this.api.post(`/payroll/salary-increases/${id}/apply`, {}).subscribe({
      next: () => { this.ui.toast('success', 'Applied', 'Salary increase applied'); this.loadSalaryIncreases(); },
      error: (err) => this.ui.toast('error', 'Error', 'Failed to apply')
    });
  }

  async applyAllIncreases(): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Apply All Approved Increases',
      message: 'This will apply all approved salary increases to employee records. Continue?',
      danger: false
    });
    if (!confirmed) return;
    this.api.post('/payroll/salary-increases/apply-all', {}).subscribe({
      next: () => { this.ui.toast('success', 'Increases Applied', 'All approved salary increases applied'); this.loadSalaryIncreases(); },
      error: (err) => this.ui.toast('error', 'Error', 'Failed to apply')
    });
  }

  getSiPercentChange(si: any): string {
    const old = parseFloat(si.old_salary) || 0;
    const nw = parseFloat(si.new_salary) || 0;
    return old > 0 ? (((nw - old) / old) * 100).toFixed(1) : '0.0';
  }

  loadVarianceRuns(): void {
    this.api.get<any[]>('/payroll/runs', { limit: 100 }).subscribe({
      next: (data) => {
        this.varianceRuns = (data || []).filter((r: any) => ['COMPLETED', 'LOCKED', 'APPROVED'].includes(r.status));
       this.cdr.detectChanges(); },
      error: () => { this.varianceRuns = []; }
    });
  }

  loadVarianceData(): void {
    if (!this.varianceRunId) return;
    this.varianceLoading = true;
    const params: any = {};
    if (this.varianceCompareType) params.compare_type = this.varianceCompareType;
    this.api.get<any>(`/payroll/runs/${this.varianceRunId}/variance`, params).subscribe({
      next: (data) => { this.varianceData = data; this.varianceLoading = false;  this.cdr.detectChanges(); },
      error: () => { this.varianceData = null; this.varianceLoading = false; }
    });
  }

  fmtVarianceDiff(val: any): string {
    const n = parseFloat(val) || 0;
    if (Math.abs(n) < 0.01) return 'R 0.00';
    const prefix = n > 0 ? '+' : '';
    return prefix + this.formatCurrency(n);
  }

  fmtVariancePct(val: any): string {
    const n = parseFloat(val) || 0;
    if (Math.abs(n) < 0.01) return '0.00%';
    const prefix = n > 0 ? '+' : '';
    return prefix + n.toFixed(2) + '%';
  }

  isVarianceSignificant(val: any): boolean {
    return Math.abs(parseFloat(val) || 0) > 100;
  }

  loadGLRuns(): void {
    this.api.get<any[]>('/payroll/runs', { limit: 50 }).subscribe({
      next: (data) => {
        this.glRuns = (data || []).filter((r: any) => ['COMPLETED', 'LOCKED', 'APPROVED'].includes(r.status) && !['TRIAL', 'ADHOC_TRIAL'].includes(r.run_type));
        if (this.glRuns.length > 0 && !this.glRunId) {
          this.glRunId = this.glRuns[0].id;
          this.loadGLData();
         this.cdr.detectChanges(); }
      },
      error: () => { this.glRuns = []; }
    });
  }

  onGlRunChange(): void {
    this.loadGLData();
  }

  setGlView(view: string): void {
    this.glView = view;
    this.loadGLData();
  }

  loadGLData(): void {
    if (!this.glRunId) return;
    this.glLoading = true;
    this.glData = null;
    this.slData = null;
    this.reconData = null;

    if (this.glView === 'subledger') {
      this.api.get<any>(`/payroll/runs/${this.glRunId}/sub-ledger`, { page: 1, limit: 50 }).subscribe({
        next: (data) => { this.slData = data; this.glLoading = false;  this.cdr.detectChanges(); },
        error: () => { this.slData = null; this.glLoading = false; }
      });
    } else if (this.glView === 'reconcile') {
      this.api.get<any>(`/payroll/runs/${this.glRunId}/reconcile`).subscribe({
        next: (data) => { this.reconData = data?.reconciliation || data; this.glLoading = false;  this.cdr.detectChanges(); },
        error: () => { this.reconData = null; this.glLoading = false; }
      });
    } else {
      this.api.get<any>(`/payroll/runs/${this.glRunId}/gl-journals`).subscribe({
        next: (data) => { this.glData = data; this.glLoading = false;  this.cdr.detectChanges(); },
        error: () => { this.glData = null; this.glLoading = false; }
      });
    }
  }

  calculateLeaveLiability(): void {
    this.grap25LeaveLoading = true;
    this.grap25LeaveResult = null;
    this.api.post<any>('/payroll/leave-liability', { as_at_date: this.grap25LeaveDate, post_journal: this.grap25LeavePostJournal }).subscribe({
      next: (data) => {
        this.grap25LeaveResult = data;
        this.grap25LeaveLoading = false;
        this.ui.toast('success', 'Leave Liability', 'Calculation completed');
      },
      error: (err) => { this.grap25LeaveResult = { error: true }; this.grap25LeaveLoading = false; }
    });
  }

  calculateBonusAccrual(): void {
    this.grap25BonusLoading = true;
    this.grap25BonusResult = null;
    this.api.post<any>('/payroll/bonus-accrual', { as_at_date: this.grap25BonusDate, post_journal: this.grap25BonusPostJournal }).subscribe({
      next: (data) => {
        this.grap25BonusResult = data;
        this.grap25BonusLoading = false;
        this.ui.toast('success', 'Bonus Accrual', 'Calculation completed');
      },
      error: (err) => { this.grap25BonusResult = { error: true }; this.grap25BonusLoading = false; }
    });
  }

  loadPaymentRuns(): void {
    this.payLoading = true;
    this.api.get<any[]>('/payroll/runs', { limit: 50 }).subscribe({
      next: (data) => {
        this.paymentRuns = (data || []).filter((r: any) => r.status === 'APPROVED');
        if (this.paymentRuns.length > 0 && !this.paySelectedRunId) {
          this.paySelectedRunId = this.paymentRuns[0].id;
          this.loadPaymentBatches();
         this.cdr.detectChanges(); } else {
          this.payLoading = false;
        }
      },
      error: () => { this.paymentRuns = []; this.payLoading = false; }
    });
  }

  onPayRunChange(): void {
    this.loadPaymentBatches();
  }

  loadPaymentBatches(): void {
    if (!this.paySelectedRunId) return;
    this.payLoading = true;
    this.api.get<any[]>(`/payroll/runs/${this.paySelectedRunId}/payment-batches`).subscribe({
      next: (data) => {
        this.payBatches = data || [];
        this.updatePayStats();
        this.payLoading = false;
       this.cdr.detectChanges(); },
      error: () => { this.payBatches = []; this.payLoading = false; }
    });
  }

  updatePayStats(): void {
    const counts: any = {};
    const amounts: any = {};
    this.payBatches.forEach(b => {
      counts[b.status] = (counts[b.status] || 0) + 1;
      amounts[b.status] = (amounts[b.status] || 0) + parseFloat(b.total_amount);
    });
    this.payStats = [
      { label: `Pending Review (${counts['PENDING_REVIEW'] || 0})`, value: this.formatCurrency(amounts['PENDING_REVIEW'] || 0), color: '#F59E0B' },
      { label: `Reviewed (${counts['REVIEWED'] || 0})`, value: this.formatCurrency(amounts['REVIEWED'] || 0), color: '#3B82F6' },
      { label: `Authorized (${counts['AUTHORIZED'] || 0})`, value: this.formatCurrency(amounts['AUTHORIZED'] || 0), color: '#8B5CF6' },
      { label: `Paid (${counts['PAID'] || 0})`, value: this.formatCurrency(amounts['PAID'] || 0), color: '#10B981' }
    ];
  }

  payBatchAction(action: string, batchId: number): void {
    let endpoint = '';
    let method = 'put';
    if (action === 'review') endpoint = `/payroll/payment-batches/${batchId}/review`;
    else if (action === 'authorize') endpoint = `/payroll/payment-batches/${batchId}/authorize`;
    else if (action === 'mark-paid') endpoint = `/payroll/payment-batches/${batchId}/mark-paid`;

    if (!endpoint) return;
    this.api.put(endpoint, {}).subscribe({
      next: () => { this.ui.toast('success', 'Success', `Batch ${action} completed`); this.loadPaymentBatches(); },
      error: () => this.ui.toast('error', 'Error', `Failed to ${action} batch`)
    });
  }

  downloadEft(batchId: number): void {
    window.open(`/api/v1/payroll/payment-batches/${batchId}/eft-file`, '_blank');
  }

  loadCouncillors(): void {
    this.councillorLoading = true;
    this.api.get<any[]>('/payroll/councillor-register').subscribe({
      next: (data) => { this.councillors = data || []; this.councillorLoading = false;  this.cdr.detectChanges(); },
      error: () => { this.councillors = []; this.councillorLoading = false; }
    });
  }

  isOverLimit(c: any): boolean {
    return c.upper_limit > 0 && parseFloat(c.annual_salary) > parseFloat(c.upper_limit);
  }

  getCouncillorPct(c: any): string {
    if (!c.upper_limit || c.upper_limit <= 0) return '-';
    return ((parseFloat(c.annual_salary) || 0) / parseFloat(c.upper_limit) * 100).toFixed(1);
  }

  loadThirdPartyPayments(): void {
    this.thirdPartyLoading = true;
    this.api.get<any[]>('/payroll/third-party-payments').subscribe({
      next: (data) => {
        this.thirdPartyPayments = data || [];
        this.tppTotalPending = this.thirdPartyPayments.filter(p => p.status === 'PENDING').reduce((s, p) => s + (parseFloat(p.total_amount) || 0), 0);
        this.tppTotalApproved = this.thirdPartyPayments.filter(p => p.status === 'APPROVED').reduce((s, p) => s + (parseFloat(p.total_amount) || 0), 0);
        this.tppTotalPaid = this.thirdPartyPayments.filter(p => p.status === 'PAID').reduce((s, p) => s + (parseFloat(p.total_amount) || 0), 0);
        this.thirdPartyLoading = false;
       this.cdr.detectChanges(); },
      error: () => { this.thirdPartyPayments = []; this.thirdPartyLoading = false; }
    });
  }

  updateTppStatus(id: number, status: string): void {
    this.api.put(`/payroll/third-party-payments/${id}/status`, { status }).subscribe({
      next: () => { this.ui.toast('success', 'Updated', `Payment status updated to ${status}`); this.loadThirdPartyPayments(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to update status')
    });
  }

  async deleteTpp(id: number, name: string): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Delete Payment',
      message: `Delete third party payment for ${name}?`,
      danger: true
    });
    if (!confirmed) return;
    this.api.delete(`/payroll/third-party-payments/${id}`).subscribe({
      next: () => { this.ui.toast('success', 'Deleted', 'Payment deleted'); this.loadThirdPartyPayments(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to delete')
    });
  }

  loadSalaryHeadsList(): void {
    this.salaryHeadsLoading = true;
    this.api.get<any[]>('/payroll/salary-heads').subscribe({
      next: (data) => { this.salaryHeads = data || []; this.salaryHeadsLoading = false;  this.cdr.detectChanges(); },
      error: () => { this.salaryHeads = []; this.salaryHeadsLoading = false; }
    });
  }

  glPostRun(id: number): void {
    this.ui.toast('info', 'Processing', 'Posting to General Ledger...');
    this.api.post(`/payroll/runs/${id}/gl-post`, {}).subscribe({
      next: (res: any) => {
        this.ui.toast('success', 'GL Posted', res?.message || `Run #${id} posted to GL`);
        this.loadRuns();
      },
      error: () => this.ui.toast('error', 'GL Post Failed', 'Failed to post to GL')
    });
  }

  getGlJournalTotalDebits(): number {
    if (!this.glJournalsData?.data) return 0;
    return this.glJournalsData.data.reduce((s: number, j: any) => s + (parseFloat(j.debit_amount) || 0), 0);
  }

  getGlJournalTotalCredits(): number {
    if (!this.glJournalsData?.data) return 0;
    return this.glJournalsData.data.reduce((s: number, j: any) => s + (parseFloat(j.credit_amount) || 0), 0);
  }

  getGlJournalBalanced(): boolean {
    return Math.abs(this.getGlJournalTotalDebits() - this.getGlJournalTotalCredits()) < 0.01;
  }

  showMockPayslip(): void {
    this.ui.toast('info', 'Mock Payslip', 'Mock payslip calculator - coming soon');
  }

  openPayslipView(): void {
    this.router.navigate(['/payroll/payslip-view']);
  }
}
