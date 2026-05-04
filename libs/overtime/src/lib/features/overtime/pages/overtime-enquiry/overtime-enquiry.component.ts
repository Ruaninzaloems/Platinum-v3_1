import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { filter, map, distinctUntilChanged } from 'rxjs';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { OvertimeTransactionsService } from '../../../../core/services/overtime-transactions.service';
import { UserContextService } from '../../../../core/services/user-context.service';
import {
  OvertimeTransactionDto,
  WorkflowStatus
} from '../../../../core/models/overtime-workflow.model';

interface ChainStep {
  label: string;
  icon: string;
  state: 'done' | 'pending' | 'rejected' | 'returned';
  tooltip: string;
}

@Component({
  selector: 'app-overtime-enquiry',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatPaginatorModule,
    MatProgressSpinnerModule, MatTooltipModule,
    MatDatepickerModule, MatNativeDateModule
  ],
  template: `
    <div class="page-content overtime-page">
      <header class="page-header">
        <div class="page-header-text">
          <h1 class="page-title">Overtime Enquiry</h1>
          <p class="page-subtitle">View all overtime transactions and their position in the approval chain</p>
        </div>
        <div class="page-header-actions">
          <button class="btn" type="button" (click)="load()">
            <mat-icon>refresh</mat-icon>
            <span>Refresh</span>
          </button>
        </div>
      </header>

      <!-- Tabs -->
      <div class="tab-bar">
        <button class="tab-btn" [class.tab-active]="activeTab() === 'current'" (click)="switchTab('current')">
          Current
        </button>
        <button class="tab-btn" [class.tab-active]="activeTab() === 'processed'" (click)="switchTab('processed')">
          Processed
        </button>
      </div>

      <!-- Filter bar — hide status dropdown on Processed tab (always filtered) -->
      <div class="filter-bar">
        @if (activeTab() === 'current') {
          <select class="filter-select" (change)="setFilterStatus($event)">
            <option value="">All Statuses</option>
            @for (opt of statusOptions(); track opt.value) {
              <option [value]="opt.value">{{ opt.label }}</option>
            }
          </select>
        }

        <select class="filter-select" (change)="setFilterSalaryHead($event)">
          <option value="">All OT Types</option>
          @for (name of salaryHeadOptions(); track name) {
            <option [value]="name">{{ name }}</option>
          }
        </select>

        <select class="filter-select" (change)="setFilterDepartment($event)">
          <option value="">All Departments</option>
          @for (d of departmentOptions(); track d.id) {
            <option [value]="d.id">{{ d.name }}</option>
          }
        </select>

        <div class="date-field-wrap">
          <input class="filter-input date-field" readonly
                 [matDatepicker]="fromPicker"
                 [(ngModel)]="fromDateValue"
                 placeholder="dd/mm/yyyy" />
          <mat-datepicker-toggle class="date-toggle" [for]="fromPicker"></mat-datepicker-toggle>
          <mat-datepicker #fromPicker></mat-datepicker>
        </div>
        <div class="date-field-wrap">
          <input class="filter-input date-field" readonly
                 [matDatepicker]="toPicker"
                 [(ngModel)]="toDateValue"
                 placeholder="dd/mm/yyyy" />
          <mat-datepicker-toggle class="date-toggle" [for]="toPicker"></mat-datepicker-toggle>
          <mat-datepicker #toPicker></mat-datepicker>
        </div>

        <input class="filter-search"
               type="text"
               placeholder="Search employee..."
               (input)="setFilterSearch($event)" />
      </div>

      <!-- Summary bar -->
      @if (!loading() && totalCount()) {
        <div class="summary-bar">
          <span class="summary-count">{{ displayedCount() }} transaction{{ displayedCount() !== 1 ? 's' : '' }} total</span>
          @if (statusSummary().length) {
            <span class="summary-sep">·</span>
            <span class="summary-page-label">This page:</span>
            @for (s of statusSummary(); track s.label) {
              <span class="summary-chip" [ngClass]="s.cls">{{ s.label }}: {{ s.count }}</span>
            }
          }
        </div>
      }

      <div class="data-grid">
        @if (loading()) {
          <div class="empty-state">
            <mat-spinner diameter="32"></mat-spinner>
            <span class="empty-title">Loading transactions…</span>
          </div>
        } @else if (!pagedRows().length) {
          <div class="empty-state">
            <mat-icon>search_off</mat-icon>
            <span class="empty-title">No transactions found.</span>
            <span class="empty-desc">
              @if (activeTab() === 'processed') {
                No transactions have been sent to payroll yet.
              } @else {
                Try adjusting the filters above.
              }
            </span>
          </div>
        } @else {
          <div class="grid-scroll">
            <table class="grid-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th class="chain-col">Approval Chain</th>
                  <th>OT Type</th>
                  <th class="num-col">Hours</th>
                  <th class="num-col">Amount</th>
                  <th>Date</th>
                  @if (activeTab() === 'current') {
                    <th>Status</th>
                  }
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (r of pagedRows(); track r.id) {
                  <tr (click)="view(r)">
                    <td>
                      <div class="cell-strong">{{ r.employeeName }}</div>
                      <div class="cell-sub">{{ r.employeeId }}</div>
                      <div class="cell-sub">{{ r.departmentName }}</div>
                    </td>
                    <td class="chain-col">
                      <div class="chain-strip">
                        @for (step of chainSteps(r); track step.label; let last = $last) {
                          <div class="chain-step"
                               [ngClass]="'step-' + step.state"
                               [matTooltip]="step.tooltip"
                               matTooltipPosition="above">
                            <div class="step-bubble">
                              <mat-icon class="step-icon">{{ step.icon }}</mat-icon>
                            </div>
                            <span class="step-label">{{ step.label }}</span>
                          </div>
                          @if (!last) {
                            <div class="chain-connector" [class.connector-done]="step.state === 'done'"></div>
                          }
                        }
                      </div>
                    </td>
                    <td>
                      <div class="cell-strong">{{ r.salaryHeadName || '—' }}</div>
                    </td>
                    <td class="num-col">{{ r.hours | number:'1.2-2' }}</td>
                    <td class="num-col">R&nbsp;{{ r.amount | number:'1.2-2' }}</td>
                    <td class="date-col">{{ r.overtimeDate | date:'dd/MM/yyyy' }}</td>
                    @if (activeTab() === 'current') {
                      <td>
                        <span class="status-badge" [ngClass]="statusClass(r.status)">
                          {{ r.statusLabel }}
                        </span>
                      </td>
                    }
                    <td class="actions-col" (click)="$event.stopPropagation()">
                      <button class="action-btn info"
                              type="button"
                              aria-label="View overtime"
                              matTooltip="View details"
                              (click)="view(r)">
                        <mat-icon>visibility</mat-icon>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <mat-paginator
            [length]="displayedCount()"
            [pageIndex]="pageIndex()"
            [pageSize]="pageSize()"
            [pageSizeOptions]="[25, 50, 100]"
            (page)="onPage($event)">
          </mat-paginator>
        }
      </div>
    </div>
  `,
  styles: [`
    /* ── Tabs ── */
    .tab-bar {
      display: flex;
      gap: 4px;
      padding: 12px 0 0;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 4px;
    }
    .tab-btn {
      padding: 8px 20px;
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      cursor: pointer;
      border-radius: 0;
      transition: color 0.15s, border-color 0.15s;
    }
    .tab-btn:hover { color: #334155; }
    .tab-btn.tab-active {
      color: #1e40af;
      border-bottom-color: #1e40af;
    }

    /* ── Filter bar ── */
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px 0 8px;
    }
    .filter-select,
    .filter-input,
    .filter-search {
      height: 36px;
      padding: 0 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #fff;
      font-size: 13px;
      color: #374151;
      outline: none;
      cursor: pointer;
    }
    .filter-select:focus,
    .filter-input:focus,
    .filter-search:focus {
      border-color: #94a3b8;
      box-shadow: 0 0 0 2px #f1f5f9;
    }
    .filter-input { cursor: pointer; }
    .filter-search { flex: 1; min-width: 160px; cursor: text; }
    .date-field-wrap { position: relative; display: flex; align-items: center; }
    .date-field { padding-right: 34px !important; cursor: pointer; }
    .date-toggle { position: absolute; right: 1px; top: 50%; transform: translateY(-50%); }
    .date-toggle button { width: 30px !important; height: 30px !important; padding: 0 !important; }

    /* ── Summary bar ── */
    .summary-bar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      padding: 6px 0 10px;
      font-size: 12px;
    }
    .summary-count      { font-weight: 600; color: #374151; }
    .summary-sep        { color: #94a3b8; }
    .summary-page-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .04em; }
    .summary-chip {
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 11px;
    }
    .chip-pending  { background: #dbeafe; color: #1d4ed8; }
    .chip-approved { background: #d1fae5; color: #047857; }
    .chip-rejected { background: #fee2e2; color: #b91c1c; }
    .chip-returned { background: #fef3c7; color: #b45309; }

    /* ── Table ── */
    .grid-scroll { overflow-x: auto; }
    .grid-table tbody tr { cursor: pointer; }
    .num-col    { text-align: right; white-space: nowrap; }
    .date-col   { white-space: nowrap; }
    .actions-col { width: 48px; text-align: center; }
    .chain-col  { min-width: 280px; }

    /* ── Chain strip ── */
    .chain-strip {
      display: flex;
      align-items: center;
      gap: 0;
      padding: 4px 0;
    }
    .chain-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      cursor: default;
    }
    .step-bubble {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid transparent;
      transition: transform 0.1s;
    }
    .step-bubble:hover { transform: scale(1.1); }
    .step-icon {
      font-size: 14px !important;
      width: 14px !important;
      height: 14px !important;
    }
    .step-label {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.2px;
      white-space: nowrap;
      text-transform: uppercase;
    }

    /* Step state colours */
    .step-done .step-bubble     { background: #d1fae5; border-color: #6ee7b7; color: #047857; }
    .step-done .step-label      { color: #047857; }
    .step-pending .step-bubble  { background: #f1f5f9; border-color: #e2e8f0; color: #94a3b8; }
    .step-pending .step-label   { color: #94a3b8; }
    .step-rejected .step-bubble { background: #fee2e2; border-color: #fca5a5; color: #b91c1c; }
    .step-rejected .step-label  { color: #b91c1c; }
    .step-returned .step-bubble { background: #fef3c7; border-color: #fde68a; color: #b45309; }
    .step-returned .step-label  { color: #b45309; }

    /* Connector lines */
    .chain-connector {
      flex: 1;
      min-width: 10px;
      height: 2px;
      background: #e2e8f0;
      margin-bottom: 13px;
    }
    .chain-connector.connector-done { background: #6ee7b7; }

    /* ── Action button ── */
    .action-btn.info { background:#dbeafe; color:#2563eb; border-color:#bfdbfe; }
    .action-btn.info:hover:not(:disabled) { background:#bfdbfe; color:#1d4ed8; border-color:#93c5fd; }

    /* ── Status badge ── */
    .status-badge.status-pending  { background:#dbeafe; color:#2563eb; }
    .status-badge.status-approved { background:#d1fae5; color:#059669; }
    .status-badge.status-rejected { background:#fee2e2; color:#dc2626; }
    .status-badge.status-returned { background:#fef3c7; color:#d97706; }
  `]
})
export class OvertimeEnquiryComponent {
  private txService = inject(OvertimeTransactionsService);
  private user      = inject(UserContextService);
  private router    = inject(Router);

  activeTab  = signal<'current' | 'processed'>('current');

  allRows    = signal<OvertimeTransactionDto[]>([]);
  totalCount = signal(0);
  loading    = signal(false);
  pageIndex  = signal(0);
  pageSize   = signal(25);

  filterStatus     = signal<number | ''>('');
  filterSalaryHead = signal('');
  filterDepartment = signal('');
  filterSearch     = signal('');
  filterFromDate   = signal('');
  filterToDate     = signal('');

  private optionRows = signal<OvertimeTransactionDto[]>([]);

  // On Current tab: client-side exclude Processed rows so the grid is clean.
  // On Processed tab: the API already returns only Processed rows.
  pagedRows = computed(() => {
    const rows = this.allRows();
    if (this.activeTab() === 'current') {
      return rows.filter(r => r.status !== WorkflowStatus.Processed);
    }
    return rows;
  });

  // The count shown in the summary bar and paginator
  displayedCount = computed(() =>
    this.activeTab() === 'current'
      ? this.pagedRows().length   // client-filtered
      : this.totalCount()          // server total (all Processed)
  );

  statusOptions = computed(() => {
    const seen = new Map<number, string>();
    for (const r of this.optionRows())
      if (r.status !== WorkflowStatus.Processed) seen.set(r.status, r.statusLabel);
    return [...seen.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.value - b.value);
  });

  salaryHeadOptions = computed(() => {
    const seen = new Set<string>();
    for (const r of this.optionRows()) if (r.salaryHeadName) seen.add(r.salaryHeadName);
    return [...seen].sort();
  });

  departmentOptions = computed(() => {
    const seen = new Map<string, string>();
    for (const r of this.optionRows()) if (r.departmentId) seen.set(r.departmentId, r.departmentName);
    return [...seen.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  statusSummary = computed(() => {
    const rows = this.pagedRows();
    if (this.activeTab() === 'processed') return [];
    const counts = {
      pending:  rows.filter(r => r.status !== WorkflowStatus.Rejected && r.status !== WorkflowStatus.Returned).length,
      rejected: rows.filter(r => r.status === WorkflowStatus.Rejected).length,
      returned: rows.filter(r => r.status === WorkflowStatus.Returned).length,
    };
    return [
      { label: 'In Progress', count: counts.pending,  cls: 'summary-chip chip-pending'  },
      { label: 'Rejected',    count: counts.rejected, cls: 'summary-chip chip-rejected' },
      { label: 'Returned',    count: counts.returned, cls: 'summary-chip chip-returned' },
    ].filter(s => s.count > 0);
  });

  constructor() {
    toObservable(this.user.me)
      .pipe(
        filter(u => !!u),
        map(u => u!.userId),
        distinctUntilChanged(),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.loadOptions();
        this.load();
      });
  }

  private loadOptions(): void {
    this.txService.listEnquiry({ page: 1, pageSize: 500 }).subscribe({
      next: result => this.optionRows.set(result?.items ?? []),
    });
  }

  switchTab(tab: 'current' | 'processed'): void {
    this.activeTab.set(tab);
    this.filterStatus.set('');
    this.pageIndex.set(0);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const tab        = this.activeTab();
    const dept       = this.filterDepartment();
    const search     = this.filterSearch().trim();
    const salaryHead = this.filterSalaryHead();
    const from       = this.filterFromDate();
    const to         = this.filterToDate();

    // For Processed tab always filter to Processed; for Current tab use the dropdown filter.
    const effectiveStatus: number | undefined =
      tab === 'processed'
        ? WorkflowStatus.Processed
        : (this.filterStatus() !== '' ? (this.filterStatus() as number) : undefined);

    this.txService.listEnquiry({
      page:           this.pageIndex() + 1,
      pageSize:       this.pageSize(),
      status:         effectiveStatus,
      departmentId:   dept       || undefined,
      employeeSearch: search     || undefined,
      salaryHeadName: salaryHead || undefined,
      fromDate:       from       || undefined,
      toDate:         to         || undefined,
    }).subscribe({
      next: result => {
        this.allRows.set(result?.items ?? []);
        this.totalCount.set(result?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private resetPageAndLoad(): void {
    this.pageIndex.set(0);
    this.load();
  }

  setFilterStatus(e: Event): void {
    const v = (e.target as HTMLSelectElement).value;
    this.filterStatus.set(v === '' ? '' : +v as WorkflowStatus);
    this.resetPageAndLoad();
  }
  setFilterSalaryHead(e: Event): void {
    this.filterSalaryHead.set((e.target as HTMLSelectElement).value);
    this.resetPageAndLoad();
  }
  setFilterDepartment(e: Event): void {
    this.filterDepartment.set((e.target as HTMLSelectElement).value);
    this.resetPageAndLoad();
  }
  setFilterSearch(e: Event): void {
    this.filterSearch.set((e.target as HTMLInputElement).value);
    this.resetPageAndLoad();
  }
  get fromDateValue(): Date | null {
    const iso = this.filterFromDate();
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  set fromDateValue(val: Date | null) {
    this.filterFromDate.set(val ? dateToIso(val) : '');
    this.resetPageAndLoad();
  }

  get toDateValue(): Date | null {
    const iso = this.filterToDate();
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  set toDateValue(val: Date | null) {
    this.filterToDate.set(val ? dateToIso(val) : '');
    this.resetPageAndLoad();
  }

  onPage(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  view(r: OvertimeTransactionDto): void {
    this.router.navigate(['/overtime/capture', r.id]);
  }

  statusClass(status: number): string {
    switch (status) {
      case WorkflowStatus.Processed: return 'status-approved';
      case WorkflowStatus.Returned:  return 'status-returned';
      case WorkflowStatus.Rejected:  return 'status-rejected';
      default:                       return 'status-pending';
    }
  }

  chainSteps(r: OvertimeTransactionDto): ChainStep[] {
    const s          = r.status;
    const isRejected = s === WorkflowStatus.Rejected;
    const isReturned = s === WorkflowStatus.Returned;
    const isExcess   = !!r.isExcess;

    const capturer    = r.capturedByName ?? r.capturedByEmployeeName ?? r.capturedBy ?? 'Unknown';
    const recommender = r.recommenderEmployeeName ?? '—';
    const approver    = r.approverEmployeeName ?? '—';
    const excess      = r.excessApproverEmployeeName ?? '—';

    const st = (done: boolean): ChainStep['state'] => {
      if (isRejected) return 'rejected';
      if (done)       return 'done';
      return 'pending';
    };

    const approveDone = s >= WorkflowStatus.AwaitingPayrollApproval;
    const excessDone  = s >= WorkflowStatus.AwaitingPayrollApproval;

    const steps: ChainStep[] = [
      {
        label:   'Captured',
        icon:    isReturned ? 'undo' : 'person',
        state:   isReturned ? 'returned' : isRejected ? 'rejected' : 'done',
        tooltip: isReturned ? `Returned to capturer: ${capturer}` : `Captured by: ${capturer}`
      },
      {
        label:   'Recommend',
        icon:    'thumb_up',
        state:   isReturned ? 'pending' : st(s >= WorkflowStatus.ApprovedForPayment),
        tooltip: s >= WorkflowStatus.ApprovedForPayment
               ? `Recommended by: ${recommender}` : 'Pending recommendation'
      },
      {
        label:   'Approve',
        icon:    'verified',
        state:   isReturned ? 'pending' : st(approveDone),
        tooltip: approveDone ? `Approved by: ${approver}` : 'Pending approval'
      },
    ];

    if (isExcess) {
      steps.push({
        label:   'Excess',
        icon:    'star',
        state:   isReturned ? 'pending' : st(excessDone),
        tooltip: excessDone ? `Excess approved by: ${excess}` : 'Pending excess approval'
      });
    }

    steps.push({
      label:   'Processed',
      icon:    isRejected ? 'cancel' : 'check_circle',
      state:   isRejected ? 'rejected'
             : isReturned ? 'pending'
             : st(s === WorkflowStatus.Processed),
      tooltip: isRejected ? 'Rejected'
             : s === WorkflowStatus.Processed ? 'Processed'
             : 'Pending processing'
    });

    return steps;
  }
}

function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
