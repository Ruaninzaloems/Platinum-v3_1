import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ApprovalsService,
  ApprovalCounts,
  PendingApprovalItem,
  ApprovalEntityType,
  ApprovalAction,
} from '../../core/services/approvals.service';
import { CurrencyZarPipe } from '../../shared/pipes/currency-zar.pipe';
import { DateSaPipe } from '../../shared/pipes/date-sa.pipe';
import { EntityTypeBadgePipe } from '../../shared/pipes/entity-type-badge.pipe';
import { UiService } from '../../core/services/ui.service';

type FilterValue = 'ALL' | ApprovalEntityType;

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyZarPipe, DateSaPipe, EntityTypeBadgePipe],
  templateUrl: './approvals.component.html',
  styleUrl: './approvals.component.css',
})
export class ApprovalsComponent implements OnInit {
  loading = true;
  items: PendingApprovalItem[] = [];
  counts: ApprovalCounts = { total: 0, CLAIM: 0, WAGE: 0, OVERTIME: 0, INSTALLMENT: 0, LEAVE_REQUEST: 0, LEAVE_ADJUSTMENT: 0 };

  activeFilter: FilterValue = 'ALL';
  search = '';
  dateFrom = '';
  dateTo = '';
  selectedIds = new Set<string>();
  actionInProgress = false;

  showCommentDialog = false;
  pendingAction: { item: PendingApprovalItem; action: 'reject' | 'return' } | null = null;
  pendingComment = '';

  constructor(
    public approvals: ApprovalsService,
    private router: Router,
    private ui: UiService,
    private cdr: ChangeDetectorRef
  ) {}

  private notify(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
    this.ui.toast(
      type,
      type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Notice' : 'Info',
      message
    );
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.approvals.list().subscribe({
      next: ({ items, counts }) => {
        this.items = items;
        this.counts = counts;
        this.selectedIds.clear();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.notify('error', 'Failed to load approvals');
        this.cdr.detectChanges();
      },
    });
  }

  setFilter(filter: FilterValue): void {
    this.activeFilter = filter;
    this.selectedIds.clear();
  }

  clearDateFilter(): void {
    this.dateFrom = '';
    this.dateTo = '';
  }

  get filteredItems(): PendingApprovalItem[] {
    let arr = this.items;
    if (this.activeFilter !== 'ALL') {
      arr = arr.filter(i => i.entity_type === this.activeFilter);
    }
    if (this.search.trim()) {
      const s = this.search.trim().toLowerCase();
      arr = arr.filter(i =>
        (i.first_name + ' ' + i.surname).toLowerCase().includes(s)
        || (i.employee_code || '').toLowerCase().includes(s)
        || (i.description || '').toLowerCase().includes(s)
        || (i.reference_no || '').toLowerCase().includes(s)
      );
    }
    if (this.dateFrom) {
      const from = new Date(this.dateFrom).getTime();
      arr = arr.filter(i => i.transaction_date && new Date(i.transaction_date).getTime() >= from);
    }
    if (this.dateTo) {
      const to = new Date(this.dateTo).getTime() + 86400000 - 1;
      arr = arr.filter(i => i.transaction_date && new Date(i.transaction_date).getTime() <= to);
    }
    return arr;
  }

  rowKey(item: PendingApprovalItem): string {
    return `${item.entity_type}:${item.entity_id}`;
  }

  toggleSelect(item: PendingApprovalItem): void {
    const key = this.rowKey(item);
    if (this.selectedIds.has(key)) this.selectedIds.delete(key);
    else this.selectedIds.add(key);
  }

  isSelected(item: PendingApprovalItem): boolean {
    return this.selectedIds.has(this.rowKey(item));
  }

  get allSelected(): boolean {
    const list = this.filteredItems;
    return list.length > 0 && list.every(i => this.selectedIds.has(this.rowKey(i)));
  }

  toggleSelectAll(): void {
    const list = this.filteredItems;
    if (this.allSelected) {
      list.forEach(i => this.selectedIds.delete(this.rowKey(i)));
    } else {
      list.forEach(i => this.selectedIds.add(this.rowKey(i)));
    }
  }

  /** Row click: navigate to the existing per-entity transaction page so the
   * full source-of-truth detail UI for that record is shown. The page
   * accepts a `?focus=<id>` query param to scroll/highlight the record. */
  openRow(item: PendingApprovalItem): void {
    const route = this.approvals.routeFor(item.entity_type);
    this.router.navigate([route], { queryParams: { focus: item.entity_id } });
  }

  statusLabel(item: PendingApprovalItem): string {
    return item.workflow_status === 'IN_PROGRESS' ? 'In Progress' : 'Pending';
  }

  statusClass(item: PendingApprovalItem): string {
    return item.workflow_status === 'IN_PROGRESS' ? 'status-pill status-in-progress' : 'status-pill status-pending';
  }

  approve(item: PendingApprovalItem, ev?: Event): void {
    if (ev) ev.stopPropagation();
    if (this.actionInProgress) return;
    this.actionInProgress = true;
    this.approvals.action(item.entity_type, item.entity_id, 'approve').subscribe({
      next: (res) => {
        this.actionInProgress = false;
        const ok = res?.success !== false;
        this.notify(
          ok ? 'success' : 'error',
          ok ? `${this.approvals.labelFor(item.entity_type)} approved` : (res?.message || 'Approval failed')
        );
        this.load();
      },
      error: (err) => {
        this.actionInProgress = false;
        this.notify('error', err?.error?.message || 'Approval failed');
      },
    });
  }

  promptReject(item: PendingApprovalItem, ev?: Event): void {
    if (ev) ev.stopPropagation();
    this.pendingAction = { item, action: 'reject' };
    this.pendingComment = '';
    this.showCommentDialog = true;
  }

  promptReturn(item: PendingApprovalItem, ev?: Event): void {
    if (ev) ev.stopPropagation();
    this.pendingAction = { item, action: 'return' };
    this.pendingComment = '';
    this.showCommentDialog = true;
  }

  submitCommentDialog(): void {
    if (!this.pendingAction) return;
    const comment = this.pendingComment.trim();
    if (!comment) {
      this.notify('error', 'A comment is required');
      return;
    }
    const { item, action } = this.pendingAction;
    this.actionInProgress = true;
    this.approvals.action(item.entity_type, item.entity_id, action as ApprovalAction, comment).subscribe({
      next: (res) => {
        this.actionInProgress = false;
        const ok = res?.success !== false;
        this.notify(
          ok ? 'success' : 'error',
          ok
            ? `${this.approvals.labelFor(item.entity_type)} ${action === 'reject' ? 'rejected' : 'returned'}`
            : (res?.message || 'Action failed')
        );
        this.closeCommentDialog();
        this.load();
      },
      error: (err) => {
        this.actionInProgress = false;
        this.notify('error', err?.error?.message || 'Action failed');
      },
    });
  }

  closeCommentDialog(): void {
    this.showCommentDialog = false;
    this.pendingAction = null;
    this.pendingComment = '';
  }

  bulkApprove(): void {
    const items = this.filteredItems.filter(i => this.isSelected(i));
    if (items.length === 0) return;
    if (this.actionInProgress) return;
    this.actionInProgress = true;
    let done = 0, failed = 0;
    const finish = () => {
      if (done + failed === items.length) {
        this.actionInProgress = false;
        this.notify(failed ? 'warning' : 'success', `${done} approved${failed ? ', ' + failed + ' failed' : ''}`);
        this.load();
      }
    };
    items.forEach(item => {
      this.approvals.action(item.entity_type, item.entity_id, 'approve').subscribe({
        next: (res) => { (res?.success !== false ? done++ : failed++); finish(); },
        error: () => { failed++; finish(); },
      });
    });
  }

  isOverdue(item: PendingApprovalItem): boolean {
    if (!item.sla_deadline) return false;
    return new Date(item.sla_deadline).getTime() < Date.now();
  }
}
