import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { UiService } from '../../../../core/services/ui.service';
import { CurrencyZarPipe } from '../../../../shared/pipes/currency-zar.pipe';

@Component({
  selector: 'app-payroll-run',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyZarPipe],
  templateUrl: './payroll-run.component.html',
  styleUrls: ['./payroll-run.component.css']
})
export class PayrollRunComponent implements OnInit, OnDestroy {
  runType = 'NORMAL';
  cycles: any[] = [];
  selectedCycleId = '';
  fromDate = '';
  toDate = '';
  activePeriod: any = null;

  currentStep = 0;
  stepLabels = ['Trial Run', 'Approval', 'Final Run'];

  currentRun: any = null;
  loading = false;
  cyclesLoading = false;

  showProgress = false;
  progressData: any = { percent: 0, processed: 0, total: 0, status: '', currentEmployee: '', errors: 0 };
  private progressInterval: any = null;
  progressStartTime: number = 0;

  showCompletionPopup = false;
  completionEmployeeCount = 0;
  completionErrorCount = 0;
  completionElapsedTime = '';

  showTrialResults = false;

  resultsTab: 'results' | 'ledger' = 'results';

  results: any[] = [];
  resultsMeta: any = { page: 1, limit: 50, total: 0, totalPages: 0 };
  resultsLoading = false;
  errorMessage = '';
  runErrors: any[] = [];
  showErrorsPanel = false;

  filters: any = { reason: '', id: '', emp_no: '', code: '', name: '', surname: '' };

  glLedgerRows: any[] = [];
  glLedgerMeta: any = { page: 1, limit: 50, total: 0, totalPages: 0 };
  glLedgerLoading = false;
  postingToLedger = false;
  glFilters: any = { employee_code: '', head_code: '', transaction_type: '' };
  private glLedgerRunId: number | null = null;

  Math = Math;

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadCycles();
  }

  ngOnDestroy(): void {
    this.stopProgressPolling();
  }

  loadCycles(): void {
    this.cyclesLoading = true;
    this.api.get<any[]>('/payroll/cycles').subscribe({
      next: (data: any) => {
        this.cycles = (data || []).filter((c: any) => c.enabled !== false);
        this.cyclesLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cyclesLoading = false; this.cdr.detectChanges(); }
    });
  }

  private resetGlState(): void {
    this.glLedgerRows = [];
    this.glLedgerMeta = { page: 1, limit: 50, total: 0, totalPages: 0 };
    this.glLedgerLoading = false;
    this.glFilters = { employee_code: '', head_code: '', transaction_type: '' };
    this.glLedgerRunId = null;
    this.resultsTab = 'results';
  }

  onCycleChange(): void {
    if (!this.selectedCycleId) {
      this.fromDate = '';
      this.toDate = '';
      this.activePeriod = null;
      this.currentRun = null;
      this.results = [];
      this.showTrialResults = false;
      this.currentStep = 0;
      this.resetGlState();
      return;
    }
    this.loading = true;
    this.api.get<any>('/payroll/periods/open', { cycle_id: this.selectedCycleId }).subscribe({
      next: (data: any) => {
        this.activePeriod = data;
        if (this.activePeriod) {
          this.fromDate = this.activePeriod.start_date?.split('T')[0] || '';
          this.toDate = this.activePeriod.end_date?.split('T')[0] || '';
          this.findExistingRun();
        } else {
          this.fromDate = '';
          this.toDate = '';
          this.currentRun = null;
          this.results = [];
          this.showTrialResults = false;
          this.currentStep = 0;
          this.loading = false;
        }
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  findExistingRun(): void {
    if (!this.selectedCycleId || !this.activePeriod) { this.loading = false; return; }
    this.api.get<any>('/payroll/runs/find', {
      cycle_id: this.selectedCycleId,
      period_id: this.activePeriod.id
    }).subscribe({
      next: (data: any) => {
        this.currentRun = data;
        if (this.currentRun) {
          this.updateStepFromRun();
          if (this.currentRun.status === 'PROCESSING') {
            this.showProgress = true;
            this.startProgressPolling();
          } else if (['COMPLETED', 'LOCKED', 'APPROVED'].includes(this.currentRun.status)) {
            this.showTrialResults = true;
            this.loadResults();
            this.loadRunErrors();
          }
        } else {
          this.currentStep = 0;
          this.results = [];
          this.showTrialResults = false;
          this.resetGlState();
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  updateStepFromRun(): void {
    if (!this.currentRun) { this.currentStep = 0; return; }
    const status = this.currentRun.status;
    const runType = this.currentRun.run_type;
    const isFinal = ['FINAL', 'ADHOC_FINAL'].includes(runType);
    if (status === 'APPROVED' || (status === 'LOCKED' && isFinal)) {
      this.currentStep = 2;
    } else if (status === 'LOCKED' && !isFinal) {
      this.currentStep = 1;
    } else {
      this.currentStep = 0;
    }
  }

  get canRun(): boolean {
    return !!this.selectedCycleId && !!this.activePeriod &&
      (!this.currentRun || ['PENDING', 'COMPLETED', 'FAILED'].includes(this.currentRun.status)) &&
      this.currentStep === 0;
  }

  get canLockdown(): boolean {
    return !!this.currentRun && this.currentRun.status === 'COMPLETED' && this.currentStep === 0 && this.showTrialResults && this.runErrors.length === 0;
  }

  get canUnlock(): boolean {
    return !!this.currentRun && this.currentRun.status === 'LOCKED' && this.currentStep === 1;
  }

  get canFinalRun(): boolean {
    return !!this.currentRun && this.currentRun.status === 'LOCKED' && this.currentStep === 1;
  }

  runTrial(): void {
    if (!this.canRun) return;
    this.resetGlState();

    const execute = (runId: number) => {
      this.showProgress = true;
      this.showTrialResults = false;
      this.results = [];
      this.runErrors = [];
      this.showErrorsPanel = false;
      this.progressStartTime = Date.now();
      this.progressData = { percent: 0, processed: 0, total: 0, status: 'PROCESSING', currentEmployee: '', errors: 0 };
      this.api.post<any>(`/payroll/runs/${runId}/execute`, { async: true }).subscribe({
        next: () => {
          this.startProgressPolling();
        },
        error: (err: any) => {
          this.showProgress = false;
          this.ui.toast('error', 'Error', 'Failed to start execution: ' + (err.error?.error?.message || 'Unknown error'));
        }
      });
    };

    if (this.currentRun) {
      execute(this.currentRun.id);
    } else {
      this.api.post<any>('/payroll/runs', {
        cycle_id: parseInt(this.selectedCycleId, 10),
        period_id: this.activePeriod.id,
        run_type: 'TRIAL'
      }).subscribe({
        next: (data: any) => {
          this.currentRun = data;
          execute(this.currentRun.id);
        },
        error: (err: any) => {
          this.ui.toast('error', 'Error', 'Failed to create run: ' + (err.error?.error?.message || 'Unknown error'));
        }
      });
    }
  }

  startProgressPolling(): void {
    this.stopProgressPolling();
    if (!this.currentRun) return;
    this.progressInterval = setInterval(() => {
      this.api.get<any>(`/payroll/runs/${this.currentRun.id}/progress`).subscribe({
        next: (data: any) => {
          this.progressData = data;
          if (['COMPLETED', 'LOCKED', 'FAILED'].includes(data.status)) {
            this.stopProgressPolling();
            setTimeout(() => {
              this.showProgress = false;
              if (data.status === 'COMPLETED') {
                this.completionEmployeeCount = data.processed || 0;
                this.completionErrorCount = data.errors || 0;
                this.completionElapsedTime = this.elapsedTime;
                this.showCompletionPopup = true;
                this.showTrialResults = true;
                this.loadResults();
                this.loadRunErrors();
                this.findExistingRun();
              } else if (data.status === 'FAILED') {
                this.findExistingRun();
                this.errorMessage = data.error_message || 'Payroll run failed. Check errors for details.';
              }
              this.cdr.detectChanges();
            }, 1500);
          }
          this.cdr.detectChanges();
        }
      });
    }, 1000);
  }

  stopProgressPolling(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  loadResults(page?: number): void {
    if (!this.currentRun) return;
    this.resultsLoading = true;
    const params: any = {
      page: page || this.resultsMeta.page,
      limit: this.resultsMeta.limit
    };
    if (this.filters.reason) params.reason = this.filters.reason;
    if (this.filters.id) params.id = this.filters.id;
    if (this.filters.emp_no) params.emp_no = this.filters.emp_no;
    if (this.filters.code) params.code = this.filters.code;
    if (this.filters.name) params.name = this.filters.name;
    if (this.filters.surname) params.surname = this.filters.surname;

    this.api.getRaw<any>(`/payroll/runs/${this.currentRun.id}/results-summary`, params).subscribe({
      next: (res: any) => {
        this.results = res.data || [];
        this.resultsMeta = res.meta || this.resultsMeta;
        this.resultsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.resultsLoading = false; }
    });
  }

  loadRunErrors(): void {
    if (!this.currentRun) return;
    this.api.get<any>(`/payroll/runs/${this.currentRun.id}/errors`).subscribe({
      next: (res: any) => {
        this.runErrors = res.data || res || [];
        this.showErrorsPanel = this.runErrors.length > 0;
        this.cdr.detectChanges();
      },
      error: () => {
        this.runErrors = [];
        this.showErrorsPanel = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFilterChange(): void {
    this.resultsMeta.page = 1;
    this.loadResults(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.resultsMeta.totalPages) return;
    this.resultsMeta.page = page;
    this.loadResults(page);
  }

  dismissCompletionPopup(): void {
    this.showCompletionPopup = false;
    this.cdr.detectChanges();
  }

  lockdownTrial(): void {
    if (!this.canLockdown) return;
    this.loading = true;
    this.api.post<any>(`/payroll/runs/${this.currentRun.id}/lock`, {}).subscribe({
      next: (data: any) => {
        this.currentRun = data;
        this.updateStepFromRun();
        this.showTrialResults = false;
        this.results = [];
        this.loading = false;
        this.ui.toast('success', 'Success', 'Trial run locked down successfully');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loading = false;
        this.ui.toast('error', 'Error', 'Failed to lock: ' + (err.error?.error?.message || 'Unknown error'));
      }
    });
  }

  unlockTrial(): void {
    if (!this.canUnlock) return;
    this.loading = true;
    this.api.post<any>(`/payroll/runs/${this.currentRun.id}/unlock`, {}).subscribe({
      next: (data: any) => {
        this.currentRun = data;
        this.updateStepFromRun();
        this.showTrialResults = false;
        this.results = [];
        this.loading = false;
        this.ui.toast('success', 'Success', 'Trial unlocked successfully');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.loading = false;
        this.ui.toast('error', 'Error', 'Failed to unlock: ' + (err.error?.error?.message || 'Unknown error'));
      }
    });
  }

  finalRun(): void {
    if (!this.canFinalRun) return;
    this.loading = true;
    this.api.post<any>(`/payroll/runs/${this.currentRun.id}/promote`, { re_execute: true }).subscribe({
      next: (data: any) => {
        this.currentRun = data;
        this.showProgress = true;
        this.progressStartTime = Date.now();
        this.progressData = { percent: 0, processed: 0, total: 0, status: 'PROCESSING', currentEmployee: '', errors: 0 };
        this.api.post<any>(`/payroll/runs/${this.currentRun.id}/execute`, { async: true }).subscribe({
          next: () => {
            this.startProgressPolling();
          },
          error: () => {
            this.showProgress = false;
            this.currentStep = 2;
            this.loading = false;
            this.ui.toast('warning', 'Warning', 'Run promoted to FINAL but re-execution failed');
            this.cdr.detectChanges();
          }
        });
      },
      error: (err: any) => {
        this.loading = false;
        this.ui.toast('error', 'Error', 'Failed to promote to final: ' + (err.error?.error?.message || 'Unknown error'));
      }
    });
  }

  downloadExcel(): void {
    if (!this.currentRun) return;
    if (this.resultsTab === 'ledger') {
      window.open(`/api/v1/payroll/runs/${this.currentRun.id}/gl-ledger/export`, '_blank');
    } else {
      window.open(`/api/v1/payroll/runs/${this.currentRun.id}/results-summary/export`, '_blank');
    }
  }

  postToLedger(): void {
    if (!this.currentRun) return;
    this.postingToLedger = true;
    this.cdr.detectChanges();
    this.api.post<any>(`/payroll/runs/${this.currentRun.id}/post-to-ledger`, {}).subscribe({
      next: (res) => {
        this.postingToLedger = false;
        const outboxId = res?.outboxId ?? 'N/A';
        this.ui.toast('success', 'Success', `GL OUTBOX tables updated successfully. Outbox ID: ${outboxId}`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.postingToLedger = false;
        const msg = err.error?.error?.message || err.error?.error?.details || 'Unknown error';
        this.ui.toast('error', 'Error', `Failed to post to ledger: ${msg}`);
        this.cdr.detectChanges();
      }
    });
  }

  getCycleName(): string {
    const cycle = this.cycles.find((c: any) => String(c.id) === String(this.selectedCycleId));
    return cycle ? cycle.name : '';
  }

  formatCurrency(val: any): string {
    const n = parseFloat(val) || 0;
    return 'R ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  get elapsedTime(): string {
    if (!this.progressStartTime) return '0s';
    const seconds = Math.floor((Date.now() - this.progressStartTime) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }

  getPageArray(): number[] {
    const total = this.resultsMeta.totalPages || 0;
    const current = this.resultsMeta.page || 1;
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  switchTab(tab: 'results' | 'ledger'): void {
    this.resultsTab = tab;
    if (tab === 'ledger' && this.currentRun) {
      const runChanged = this.glLedgerRunId !== this.currentRun.id;
      if (runChanged || (this.glLedgerRows.length === 0 && !this.glLedgerLoading)) {
        if (runChanged) {
          this.glLedgerRows = [];
          this.glLedgerMeta = { page: 1, limit: this.glLedgerMeta.limit, total: 0, totalPages: 0 };
          this.glFilters = { employee_code: '', head_code: '', transaction_type: '' };
        }
        this.loadGlLedger();
      }
    }
    this.cdr.detectChanges();
  }

  loadGlLedger(page?: number): void {
    if (!this.currentRun) return;
    this.glLedgerLoading = true;
    const params: any = {
      page: page || this.glLedgerMeta.page,
      limit: this.glLedgerMeta.limit
    };
    if (this.glFilters.employee_code) params.employee_code = this.glFilters.employee_code;
    if (this.glFilters.head_code) params.head_code = this.glFilters.head_code;
    if (this.glFilters.transaction_type) params.transaction_type = this.glFilters.transaction_type;

    const runId = this.currentRun.id;
    this.api.getRaw<any>(`/payroll/runs/${runId}/gl-ledger`, params).subscribe({
      next: (res: any) => {
        this.glLedgerRows = res.data || [];
        this.glLedgerMeta = res.meta || this.glLedgerMeta;
        this.glLedgerRunId = runId;
        this.glLedgerLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.glLedgerLoading = false; this.cdr.detectChanges(); }
    });
  }

  onGlFilterChange(): void {
    this.glLedgerMeta.page = 1;
    this.loadGlLedger(1);
  }

  goToGlPage(page: number): void {
    if (page < 1 || page > this.glLedgerMeta.totalPages) return;
    this.glLedgerMeta.page = page;
    this.loadGlLedger(page);
  }

  getGlPageArray(): number[] {
    const total = this.glLedgerMeta.totalPages || 0;
    const current = this.glLedgerMeta.page || 1;
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
