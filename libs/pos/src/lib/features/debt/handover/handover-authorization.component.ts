import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

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

interface HandoverRow {
  handover: any;
  review: '' | 'Approve' | 'Decline';
  notes: string;
}

interface TerminationRow {
  handover: any;
  decision: '' | 'Approve' | 'Decline';
  notes: string;
}

@Component({
  selector: 'app-handover-authorization',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './handover-authorization.component.html',
  styleUrl: './handover-authorization.component.css'
})
export class HandoverAuthorizationComponent implements OnInit {
  loading = signal(true);
  submitting = signal(false);
  submittingTerminations = signal(false);
  rows: HandoverRow[] = [];
  terminationRows: TerminationRow[] = [];

  activeTab: 'handover' | 'termination' = 'handover';

  expandedId = signal<number | null>(null);
  accountsId = signal<number | null>(null);
  accountsLoading = signal(false);
  handoverAccounts = signal<any[]>([]);

  finYear: string = '';
  finYears: string[] = getFinYearList(5);

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const u = this.auth.user();
    this.finYear = u?.finYear || getCurrentFinYear();
    this.loadHandovers();
  }

  async loadHandovers(): Promise<void> {
    this.loading.set(true);
    try {
      const all: any[] = await firstValueFrom(
        this.api.get('/api/platinum/billing-debt/handover-list', { finYear: this.finYear })
      );
      const list = all || [];
      const pending = list.filter((h: any) => {
        const s = (h.status || '').toLowerCase();
        return s === 'pending' || s === 'pending authorization' || s === 'submitted' || s === 'awaiting authorization';
      });
      this.rows = pending.map((handover: any) => ({ handover, review: '' as '' | 'Approve' | 'Decline', notes: '' }));

      const pendingTermination = list.filter((h: any) => {
        const s = (h.status || '').toLowerCase();
        return s.includes('termination') && s.includes('pending');
      });
      this.terminationRows = pendingTermination.map((handover: any) => ({ handover, decision: '' as '' | 'Approve' | 'Decline', notes: '' }));
    } catch (err: any) {
      this.toast.show(err?.error?.message || err?.message || 'Could not fetch handover records.', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  onYearChange(): void {
    this.rows = [];
    this.terminationRows = [];
    this.expandedId.set(null);
    this.accountsId.set(null);
    this.loadHandovers();
  }

  toggleDetails(id: number): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  async viewAccounts(handoverId: number): Promise<void> {
    if (this.accountsId() === handoverId) {
      this.accountsId.set(null);
      this.handoverAccounts.set([]);
      return;
    }
    this.accountsId.set(handoverId);
    this.accountsLoading.set(true);
    this.handoverAccounts.set([]);
    try {
      const data = await firstValueFrom(
        this.api.get<any>('/api/platinum/billing-debt/handover-account-detail', { handoverId: String(handoverId) })
      );
      if (this.accountsId() !== handoverId) return;
      const accounts = Array.isArray(data) ? data : (data?.accounts || [data].filter(Boolean));
      this.handoverAccounts.set(accounts);
      if (accounts.length === 0) {
        this.toast.show('No account details found for this handover.', 'info');
      }
    } catch (err: any) {
      if (this.accountsId() !== handoverId) return;
      this.toast.show(err?.error?.message || err?.message || 'Failed to load handover accounts', 'error');
    } finally {
      if (this.accountsId() === handoverId) this.accountsLoading.set(false);
    }
  }

  getHandoverDetailChips(h: any): string[] {
    const chips: string[] = [];
    if (h.handoverOption) chips.push(`Option: ${h.handoverOption}`);
    if (h.billingCycle) chips.push(`Billing Cycle: ${h.billingCycle}`);
    if (h.attorneyName || h.attorney) chips.push(`Attorney: ${h.attorneyName || h.attorney}`);
    if (h.section129RunId) chips.push(`S129 Run: #${h.section129RunId}`);
    if (h.totalAccounts || h.accountCount) chips.push(`Accounts: ${h.totalAccounts || h.accountCount}`);
    if (h.totalAmount || h.amount) chips.push(`Amount: R ${(h.totalAmount || h.amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    if (h.handoverDate || h.dateCreated) chips.push(`Date: ${this.formatDate(h.handoverDate || h.dateCreated)}`);
    if (h.actionedBy || h.capturedBy) chips.push(`Submitted By: ${h.actionedBy || h.capturedBy}`);
    return chips;
  }

  updateReview(index: number, value: string): void {
    this.rows[index] = { ...this.rows[index], review: value as '' | 'Approve' | 'Decline' };
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
      return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
    } catch {
      return d;
    }
  }

  formatAmount(amount: number | undefined): string {
    if (amount == null) return '—';
    return `R\u00a0${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  }

  getRowClass(review: string): string {
    if (review === 'Approve') return 'row-approve';
    if (review === 'Decline') return 'row-decline';
    return '';
  }

  getStatusBadgeClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('pending') || s.includes('submitted') || s.includes('awaiting')) return 'badge-amber';
    return 'badge-secondary';
  }

  async handleSubmit(): Promise<void> {
    const actionableRows = this.rows.filter(r => r.review !== '');
    if (actionableRows.length === 0) {
      this.toast.show('Please select Approve or Decline for at least one handover before submitting.', 'error');
      return;
    }
    const missingNotes = actionableRows.filter(r => r.review === 'Decline' && !r.notes.trim());
    if (missingNotes.length > 0) {
      this.toast.show('Please provide notes for all declined handovers.', 'error');
      return;
    }

    this.submitting.set(true);
    let successCount = 0;
    let errorCount = 0;

    for (const row of actionableRows) {
      try {
        await firstValueFrom(this.api.post('/api/platinum/billing-debt/handover-authorize', {
          handoverId: row.handover.handoverId || row.handover.id,
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
      this.toast.show(`${successCount} handover(s) processed successfully.${errorCount > 0 ? ` ${errorCount} failed.` : ''}`, 'success');
      await this.loadHandovers();
    } else {
      this.toast.show('All authorization requests failed. Please try again.', 'error');
    }
  }

  updateTerminationDecision(index: number, value: string): void {
    this.terminationRows[index] = { ...this.terminationRows[index], decision: value as '' | 'Approve' | 'Decline' };
  }

  updateTerminationNotes(index: number, value: string): void {
    this.terminationRows[index] = { ...this.terminationRows[index], notes: value.slice(0, 250) };
  }

  get terminationDecisionsCount(): number {
    return this.terminationRows.filter(r => r.decision !== '').length;
  }

  async handleSubmitTerminations(): Promise<void> {
    const actionable = this.terminationRows.filter(r => r.decision !== '');
    if (actionable.length === 0) {
      this.toast.show('Please select Approve or Decline for at least one termination.', 'error');
      return;
    }
    const missingNotes = actionable.filter(r => r.decision === 'Decline' && !r.notes.trim());
    if (missingNotes.length > 0) {
      this.toast.show('Please provide notes for all declined terminations.', 'error');
      return;
    }

    this.submittingTerminations.set(true);
    let successCount = 0;
    let errorCount = 0;

    const approved = actionable.filter(r => r.decision === 'Approve');
    const declined = actionable.filter(r => r.decision === 'Decline');

    if (approved.length > 0) {
      try {
        await firstValueFrom(this.api.post('/api/platinum/billing-debt/handover-authorize-termination', {
          handoverIds: approved.map(r => r.handover.handoverId || r.handover.id),
        }));
        successCount += approved.length;
      } catch {
        errorCount += approved.length;
      }
    }

    for (const row of declined) {
      try {
        await firstValueFrom(this.api.post('/api/platinum/billing-debt/handover-decline-termination', {
          handoverIds: [row.handover.handoverId || row.handover.id],
          terminationReason: row.notes || 'Termination declined by supervisor',
        }));
        successCount++;
      } catch {
        errorCount++;
      }
    }

    this.submittingTerminations.set(false);
    if (successCount > 0) {
      this.toast.show(`${successCount} termination(s) processed.${errorCount > 0 ? ` ${errorCount} failed.` : ''}`, 'success');
      await this.loadHandovers();
    } else {
      this.toast.show('All termination decisions failed. Please try again.', 'error');
    }
  }

  handleCancel(): void {
    this.router.navigate(['/']);
  }
}
