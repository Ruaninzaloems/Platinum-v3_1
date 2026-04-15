import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-employment-changes',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent],
  templateUrl: './employment-changes.component.html',
  styleUrl: './employment-changes.component.css'
})
export class EmploymentChangesComponent implements OnInit {
  reasons: any[] = [];
  filteredReasons: any[] = [];
  changeTypes: any[] = [];
  loading = true;
  searchTerm = '';

  view: 'list' | 'detail' = 'list';
  mode: 'create' | 'view' | 'edit' = 'view';
  activeTab = 'details';
  reason: any = {};
  currentIndex = -1;

  history: any[] = [];
  historyLoading = false;

  currentPage = 1;
  pageSize = 15;

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadChangeTypes();
    this.loadReasons();
  }

  loadChangeTypes(): void {
    this.api.get<any>('/employment-changes/types').subscribe({
      next: (d) => { this.changeTypes = d || []; this.cdr.detectChanges(); },
      error: () => { this.changeTypes = []; }
    });
  }

  loadReasons(): void {
    this.loading = true;
    this.api.get<any>('/employment-changes/reasons').subscribe({
      next: (d) => {
        this.reasons = d || [];
        this.filterReasons();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.reasons = []; this.filteredReasons = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  filterReasons(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredReasons = [...this.reasons];
    } else {
      this.filteredReasons = this.reasons.filter(r =>
        (r.reason_description || '').toLowerCase().includes(term) ||
        (r.type_description || '').toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  get activeCount(): number {
    return this.reasons.filter(r => r.enabled).length;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredReasons.length / this.pageSize) || 1;
  }

  get pagedReasons(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredReasons.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.detectChanges();
    }
  }

  getChangeTypeLabel(id: number): string {
    const t = this.changeTypes.find(ct => ct.id === id);
    return t ? t.description : '—';
  }

  openCreate(): void {
    this.reason = {
      employment_change_type_id: null,
      reason_description: '',
      enabled: true
    };
    this.mode = 'create';
    this.activeTab = 'details';
    this.view = 'detail';
    this.history = [];
    this.cdr.detectChanges();
  }

  openDetail(item: any, _filteredIndex: number): void {
    this.reason = { ...item };
    this.currentIndex = this.reasons.findIndex(r => r.id === item.id);
    this.mode = 'view';
    this.activeTab = 'details';
    this.view = 'detail';
    this.history = [];
    this.cdr.detectChanges();
  }

  goBack(): void {
    this.view = 'list';
    this.loadReasons();
    this.cdr.detectChanges();
  }

  enterEdit(): void {
    this.mode = 'edit';
    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    if (this.mode === 'create') {
      this.goBack();
    } else {
      const r = this.reasons[this.currentIndex];
      if (r) this.reason = { ...r };
      this.mode = 'view';
      this.cdr.detectChanges();
    }
  }

  get isEditable(): boolean {
    return this.mode === 'edit' || this.mode === 'create';
  }

  get pageTitle(): string {
    if (this.mode === 'create') return 'New Employment Change Reason';
    return this.reason.reason_description || 'Employment Change Reason';
  }

  navigatePrev(): void {
    if (this.currentIndex <= 0) return;
    this.currentIndex--;
    this.reason = { ...this.reasons[this.currentIndex] };
    this.mode = 'view';
    this.activeTab = 'details';
    this.history = [];
    this.cdr.detectChanges();
  }

  navigateNext(): void {
    if (this.currentIndex >= this.reasons.length - 1) return;
    this.currentIndex++;
    this.reason = { ...this.reasons[this.currentIndex] };
    this.mode = 'view';
    this.activeTab = 'details';
    this.history = [];
    this.cdr.detectChanges();
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'history' && this.reason.id && this.history.length === 0) {
      this.loadHistory();
    }
    this.cdr.detectChanges();
  }

  loadHistory(): void {
    if (!this.reason.id) return;
    this.historyLoading = true;
    this.api.get<any>(`/employment-changes/reasons/${this.reason.id}/history`).subscribe({
      next: (d) => {
        this.history = d || [];
        this.historyLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.history = []; this.historyLoading = false; this.cdr.detectChanges(); }
    });
  }

  historyDescription(item: any): string {
    const snap = item.snapshot;
    if (!snap) return '—';
    return `${snap.reason_description || '—'}`;
  }

  save(): void {
    if (!this.reason.employment_change_type_id) {
      this.ui.toast('error', 'Validation', 'Employment Change Type is required');
      return;
    }
    if (!this.reason.reason_description?.trim()) {
      this.ui.toast('error', 'Validation', 'Employment Change Reason is required');
      return;
    }

    const payload = {
      employment_change_type_id: this.reason.employment_change_type_id,
      reason_description: this.reason.reason_description.trim(),
      enabled: this.reason.enabled !== false
    };

    const obs = this.reason.id
      ? this.api.put(`/employment-changes/reasons/${this.reason.id}`, payload)
      : this.api.post('/employment-changes/reasons', payload);

    const isEdit = !!this.reason.id;
    obs.subscribe({
      next: (d: any) => {
        this.ui.toast('success', 'Saved', isEdit ? 'Reason updated' : 'Reason created');
        if (isEdit) {
          this.reason = d;
          this.loadReasons();
          this.mode = 'view';
        } else {
          this.goBack();
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.ui.toast('error', 'Error', err?.error?.error?.message || err?.error?.error || 'Failed to save');
      }
    });
  }

  deleteFromList(reason: any, event?: Event): void {
    if (event) event.stopPropagation();
    if (!confirm(`Delete reason "${reason.reason_description}"?`)) return;
    this.api.delete(`/employment-changes/reasons/${reason.id}`).subscribe({
      next: () => {
        this.ui.toast('success', 'Deleted', 'Reason deleted');
        this.loadReasons();
      },
      error: (err: any) => {
        this.ui.toast('error', 'Error', err?.error?.error?.message || err?.error?.error || 'Cannot delete');
      }
    });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-ZA', { year: 'numeric', month: '2-digit', day: '2-digit' }) +
      ' ' + dt.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  }
}
