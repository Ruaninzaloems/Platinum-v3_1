import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import type { Section129Run, ReviewDecision, AuthorizationRow } from '../../../models/debt.models';

function getCurrentFinYear(): string {
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year - 1}/${year}`;
}

function getFinYearList(count: number): string[] {
  const now = new Date();
  const baseYear = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  return Array.from({ length: count }, (_, i) => `${baseYear - 1 - i}/${baseYear - i}`);
}

@Component({
  selector: 'app-section129-authorization',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './section129-authorization.component.html',
  styleUrl: './section129-authorization.component.css'
})
export class Section129AuthorizationComponent implements OnInit {
  loading = signal(true);
  submitting = signal(false);
  rows: AuthorizationRow[] = [];

  expandedRunId = signal<number | null>(null);
  accountsRunId = signal<number | null>(null);
  accountsLoading = signal(false);
  runAccounts = signal<any[]>([]);

  finYear: string = getCurrentFinYear();
  finYears: string[] = getFinYearList(5);

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRuns();
  }

  async loadRuns(): Promise<void> {
    this.loading.set(true);
    try {
      const allRuns: Section129Run[] = await firstValueFrom(
        this.api.get('/api/platinum/billing-debt/section129-runs', { finYear: this.finYear })
      );
      const pending = (allRuns || []).filter((r) => r.status === 'Trial Complete');
      this.rows = pending.map((run) => ({ run, review: '' as ReviewDecision, notes: '' }));
      this.enrichRowAmounts();
    } catch (err: any) {
      this.toast.show(err?.error?.message || err?.message || 'Could not fetch Section 129 runs for authorization.', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  private enrichRowAmounts(): void {
    const toEnrich = this.rows.filter(r => (r.run.totalAmount ?? 0) === 0);
    for (const row of toEnrich) {
      this.api.get('/api/platinum/billing-debt/section129-run-summary', { runId: String(row.run.runId) })
        .subscribe({ next: (summary: any) => {
          if (!summary || typeof summary.totalAmount !== 'number') return;
          this.rows = this.rows.map(r =>
            r.run.runId === row.run.runId ? { ...r, run: { ...r.run, totalAmount: summary.totalAmount } } : r
          );
        }, error: () => {} });
    }
  }

  onYearChange(): void {
    this.rows = [];
    this.expandedRunId.set(null);
    this.accountsRunId.set(null);
    this.loadRuns();
  }

  toggleDetails(runId: number): void {
    this.expandedRunId.set(this.expandedRunId() === runId ? null : runId);
  }

  async viewAccounts(runId: number): Promise<void> {
    if (this.accountsRunId() === runId) {
      this.accountsRunId.set(null);
      this.runAccounts.set([]);
      return;
    }
    this.accountsRunId.set(runId);
    this.accountsLoading.set(true);
    this.runAccounts.set([]);
    try {
      const data = await firstValueFrom(
        this.api.get<any>('/api/platinum/billing-debt/section129-run-accounts', { runId: String(runId) })
      );
      if (this.accountsRunId() !== runId) return;
      const accounts = Array.isArray(data) ? data : (data?.accounts || []);
      this.runAccounts.set(accounts);
      if (accounts.length === 0) {
        this.toast.show('No accounts found for this run.', 'info');
      }
    } catch (err: any) {
      if (this.accountsRunId() !== runId) return;
      this.toast.show(err?.error?.message || err?.message || 'Failed to load accounts', 'error');
    } finally {
      if (this.accountsRunId() === runId) this.accountsLoading.set(false);
    }
  }

  getFilterSummary(run: Section129Run): string[] {
    const filters: string[] = [];
    if (run.billingCycle) filters.push(`Billing Cycle: ${run.billingCycle}`);
    if (run.distributionType) filters.push(`Distribution: ${run.distributionType}`);
    if (run.amountGreaterThan != null && run.amountGreaterThan > 0) filters.push(`Amount > R ${run.amountGreaterThan.toLocaleString('en-ZA')}`);
    if (run.ageingId != null) filters.push(`Ageing ID: ${run.ageingId}`);
    if (run.lapseDays != null && run.lapseDays > 0) filters.push(`Lapse Days: ${run.lapseDays}`);
    if (run.adminFee != null && run.adminFee > 0) filters.push(`Admin Fee: R ${run.adminFee.toFixed(2)}`);
    filters.push(`Indigent: ${run.includeIndigent ? 'Included' : 'Excluded'}`);
    if (run.includePensioners != null) filters.push(`Pensioners: ${run.includePensioners ? 'Included' : 'Excluded'}`);
    if (run.excludeDepositBalances) filters.push('Deposit Balances: Excluded');
    if (run.runType) filters.push(`Run Type: ${run.runType}`);
    if (run.runParameters) {
      try {
        const params = JSON.parse(run.runParameters);
        for (const [k, v] of Object.entries(params)) {
          if (v != null && v !== '' && v !== false) filters.push(`${k}: ${v}`);
        }
      } catch {
        filters.push(`Parameters: ${run.runParameters}`);
      }
    }
    return filters;
  }

  updateReview(index: number, value: string): void {
    this.rows[index] = { ...this.rows[index], review: value as ReviewDecision };
  }

  updateNotes(index: number, value: string): void {
    this.rows[index] = { ...this.rows[index], notes: value.slice(0, 250) };
  }

  get decisionsCount(): number {
    return this.rows.filter(r => r.review !== '').length;
  }

  formatDate(d: string | undefined): string {
    if (!d) return '—';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
    } catch {
      return d;
    }
  }

  formatAmount(amount: number | undefined): string {
    if (amount == null) return '—';
    return `R\u00a0${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  }

  getRowClass(review: ReviewDecision): string {
    if (review === 'Approve') return 'row-approve';
    if (review === 'Decline') return 'row-decline';
    return '';
  }

  async handleSubmit(): Promise<void> {
    const actionableRows = this.rows.filter(r => r.review !== '');
    if (actionableRows.length === 0) {
      this.toast.show('Please select Approve or Decline for at least one run before submitting.', 'error');
      return;
    }
    const missingNotes = actionableRows.filter(r => r.review === 'Decline' && !r.notes.trim());
    if (missingNotes.length > 0) {
      this.toast.show('Please provide notes for all declined runs.', 'error');
      return;
    }

    this.submitting.set(true);
    let successCount = 0;
    let errorCount = 0;

    for (const row of actionableRows) {
      try {
        await firstValueFrom(this.api.post('/api/platinum/billing-debt/section129-authorize', {
          runId: row.run.runId,
          notes: row.notes,
          review: row.review,
        }));
        successCount++;
      } catch {
        errorCount++;
      }
    }

    this.submitting.set(false);

    if (successCount > 0) {
      this.toast.show(`${successCount} run(s) processed successfully.${errorCount > 0 ? ` ${errorCount} failed.` : ''}`, 'success');
      await this.loadRuns();
    } else {
      this.toast.show('All authorization requests failed. Please try again.', 'error');
    }
  }

  handleCancel(): void {
    this.router.navigate(['/']);
  }
}
