import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import * as XLSX from 'xlsx';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { forkJoin, filter, map, distinctUntilChanged, of, catchError, Subscription } from 'rxjs';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { OvertimeTransactionsService } from '../../../../core/services/overtime-transactions.service';
import { WorkflowService } from '../../../../core/services/workflow.service';
import { UserContextService } from '../../../../core/services/user-context.service';
import {
  OvertimeTransactionDto,
  WorkflowStatus
} from '../../../../core/models/overtime-workflow.model';

// ── Inline comment dialog (Return / Reject) ───────────────────────────────────
interface CommentDialogData {
  title: string;
  label: string;
  confirmLabel: string;
  confirmColor: 'primary' | 'warn';
  /** When true the confirm button is disabled until the user types a comment. */
  required?: boolean;
}

@Component({
  selector: 'app-comment-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content style="padding-top:8px">
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>{{ data.label }}</mat-label>
        <textarea matInput [(ngModel)]="comment" rows="3"
                  [placeholder]="data.required ? 'Required — a reason must be provided' : 'Optional — leave blank to skip'"></textarea>
        @if (data.required && !comment.trim()) {
          <mat-hint style="color:var(--mat-warn-color,#b00020)">A reason is required to continue.</mat-hint>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end" style="gap:8px;padding:8px 24px 16px">
      <button mat-stroked-button [mat-dialog-close]="null">Cancel</button>
      <button mat-flat-button [color]="data.confirmColor"
              [disabled]="data.required && !comment.trim()"
              [mat-dialog-close]="comment">
        {{ data.confirmLabel }}
      </button>
    </mat-dialog-actions>
  `
})
export class CommentDialogComponent {
  ref  = inject(MatDialogRef<CommentDialogComponent>);
  data = inject<CommentDialogData>(MAT_DIALOG_DATA);
  comment = '';
}

// ── Module-level pure helpers (used only inside computed signals, never in templates) ──
function captureStatusClass(status: number): string {
  switch (status) {
    case WorkflowStatus.Processed: return 'status-approved';
    case WorkflowStatus.Returned:  return 'status-returned';
    case WorkflowStatus.Rejected:  return 'status-rejected';
    default:                       return 'status-pending';
  }
}
function captureLevelLabel(status: WorkflowStatus): string {
  switch (status) {
    case WorkflowStatus.Requested:               return 'LV1';
    case WorkflowStatus.Recommended:             return 'LV2';
    case WorkflowStatus.ApprovedForPayment:      return 'LV3';
    case WorkflowStatus.AwaitingPayrollApproval: return 'LV4';
    default: return '';
  }
}

function identitySet(...identities: Array<string | null | undefined>): Set<string> {
  return new Set(
    identities
      .filter((id): id is string => !!id)
      .map(id => id.toLowerCase())
  );
}

@Component({
  selector: 'app-overtime-capture',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatIconModule, MatPaginatorModule,
    MatProgressSpinnerModule, MatTooltipModule,
    MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule,
  ],
  template: `
    <div class="page-content overtime-page">
      <header class="page-header">
        <div class="page-header-text">
          <h1 class="page-title">Overtime</h1>
          <p class="page-subtitle">Capture and manage employee overtime transactions</p>
        </div>
        <div class="page-header-actions">
          <button class="btn" type="button" (click)="exportToExcel()"
                  [matTooltip]="exportLoading() ? 'Preparing export…' : ('Export all ' + serverTotal() + ' filtered row(s) to Excel')">
            <mat-icon>download</mat-icon>
            <span>Export</span>
          </button>
          <a class="btn btn-primary" routerLink="new">
            <mat-icon>add</mat-icon>
            <span>Add Overtime</span>
          </a>
        </div>
      </header>

      <!-- View tabs -->
      <div class="view-tabs">
        <button class="view-tab" [class.active]="activeTab() === 'current'" type="button"
                (click)="switchTab('current')">My Queue</button>
        <button class="view-tab" [class.active]="activeTab() === 'processed'" type="button"
                (click)="switchTab('processed')">My History</button>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <select class="filter-select"
                (change)="setFilterStatus($event)">
          <option value="">All Statuses</option>
          @for (opt of statusOptions(); track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>

        <select class="filter-select"
                (change)="setFilterSalaryHead($event)">
          <option value="">All OT Types</option>
          @for (name of salaryHeadOptions(); track name) {
            <option [value]="name">{{ name }}</option>
          }
        </select>

        <select class="filter-select"
                (change)="setFilterDepartment($event)">
          <option value="">All Departments</option>
          @for (d of departmentOptions(); track d.id) {
            <option [value]="d.id">{{ d.name }}</option>
          }
        </select>

        <select class="filter-select"
                (change)="setFilterDivision($event)">
          <option value="">All Divisions</option>
          @for (d of divisionOptions(); track d) {
            <option [value]="d">{{ d }}</option>
          }
        </select>

        <input class="filter-search"
               type="text"
               placeholder="Search employee..."
               (input)="setFilterSearch($event)" />
      </div>

      <div class="data-grid">
        @if (loading()) {
          <div class="empty-state">
            <mat-spinner diameter="32"></mat-spinner>
            <span class="empty-title">Loading transactions…</span>
          </div>
        } @else if (!filteredRows().length) {
          <div class="empty-state">
            <mat-icon>inbox</mat-icon>
            <span class="empty-title">No transactions found.</span>
            <span class="empty-desc">
              @if (serverTotal()) {
                Try adjusting the filters above.
              } @else {
                When overtime is captured it will appear here.
              }
            </span>
          </div>
        } @else {
          @if (selectedIds().size > 0) {
            <div class="bulk-toolbar">
              <span class="bulk-count">{{ selectedIds().size }} selected</span>
              @if (bulkCanActCount() > 0) {
                <button class="btn btn-bulk-success" type="button" (click)="bulkApprove()">
                  <mat-icon>check_circle</mat-icon>
                  <span>Approve All ({{ bulkCanActCount() }})</span>
                </button>
                <button class="btn btn-bulk-warning" type="button" (click)="bulkReturn()">
                  <mat-icon>undo</mat-icon>
                  <span>Return All ({{ bulkCanActCount() }})</span>
                </button>
              }
              @if (bulkCanRejectCount() > 0) {
                <button class="btn btn-bulk-danger" type="button" (click)="bulkReject()">
                  <mat-icon>cancel</mat-icon>
                  <span>Reject All ({{ bulkCanRejectCount() }})</span>
                </button>
              }
              <button class="btn btn-bulk-clear" type="button" (click)="clearSelection()">
                <mat-icon>close</mat-icon>
                <span>Clear</span>
              </button>
            </div>
          }
          <div class="grid-scroll">
            <table class="grid-table">
              <thead>
                <tr>
                  <th class="cb-col">
                    <input type="checkbox"
                           [checked]="allOnPageSelected()"
                           (change)="toggleSelectAll($event)" />
                  </th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Division</th>
                  <th>Salary Head Name</th>
                  <th class="num-col">Hours</th>
                  @if (showAmount()) {
                    <th class="num-col">Amount</th>
                  }
                  <th>Date</th>
                  <th>Status</th>
                  <th class="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (r of pagedRows(); track r.id) {
                  <tr (click)="view(r)">
                    <td class="cb-col" (click)="$event.stopPropagation()">
                      <input type="checkbox"
                             [checked]="selectedIds().has(r.id.toString())"
                             (change)="toggleRow(r, $event)" />
                    </td>
                    <td>
                      <div class="cell-strong">{{ r.employeeName }}</div>
                      <div class="cell-sub">{{ r.employeeId }}</div>
                    </td>
                    <td>
                      <div class="cell-strong">{{ r.departmentName || '—' }}</div>
                    </td>
                    <td>
                      <div class="cell-strong">{{ r.divisionName || r.legacyDivisionName || '—' }}</div>
                    </td>
                    <td>
                      <div class="cell-strong">{{ r.salaryHeadName || '—' }}</div>
                    </td>
                    <td class="num-col">{{ r.hours | number:'1.2-2' }}</td>
                    @if (showAmount()) {
                      <td class="num-col">R&nbsp;{{ r.amount | number:'1.2-2' }}</td>
                    }
                    <td class="date-col">{{ r.overtimeDate | date:'dd/MM/yyyy' }}</td>
                    <td>
                      <div class="status-cell">
                        <span class="status-badge" [ngClass]="r._sc">
                          {{ r.statusLabel }}
                        </span>
                        @if (r._ll) {
                          <span class="level-badge">{{ r._ll }}</span>
                        }
                      </div>
                    </td>
                    <td class="actions-col" (click)="$event.stopPropagation()">
                      <div class="action-bar">
                        <button class="action-btn info"
                                type="button"
                                [attr.aria-label]="r._canEdit ? 'Edit overtime' : 'View overtime'"
                                [matTooltip]="r._canEdit ? 'Edit overtime' : 'View overtime'"
                                (click)="view(r)">
                          <mat-icon>{{ r._canEdit ? 'edit' : 'visibility' }}</mat-icon>
                        </button>
                        <button class="action-btn secondary"
                                type="button"
                                aria-label="Capture another overtime for this employee"
                                matTooltip="Capture another overtime for this employee"
                                (click)="captureForEmployee(r)">
                          <mat-icon>add</mat-icon>
                        </button>
                        @if ((r.status === 0 || r.status === 5) && r.capturedBy) {
                          <button class="action-btn primary"
                                  type="button"
                                  aria-label="Submit for recommendation"
                                  matTooltip="Submit for recommendation"
                                  (click)="submit(r)">
                            <mat-icon>send</mat-icon>
                          </button>
                        }
                        @if (r._canAct) {
                          <button class="action-btn success"
                                  type="button"
                                  aria-label="Approve or advance"
                                  matTooltip="Approve / advance"
                                  (click)="approve(r)">
                            <mat-icon>check_circle</mat-icon>
                          </button>
                          <button class="action-btn warning"
                                  type="button"
                                  aria-label="Return for correction"
                                  matTooltip="Return for correction"
                                  (click)="returnTx(r)">
                            <mat-icon>undo</mat-icon>
                          </button>
                        }
                        @if (r._canAct || r._canCapturerReject) {
                          <button class="action-btn danger"
                                  type="button"
                                  aria-label="Reject"
                                  matTooltip="Reject"
                                  (click)="reject(r)">
                            <mat-icon>cancel</mat-icon>
                          </button>
                        }
                        @if (r._isOverride) {
                          <span class="override-badge"
                                matTooltip="You can act on this transaction because you hold the master-approver override position">
                            <mat-icon class="override-badge-icon">shield</mat-icon>
                            Master Approver
                          </span>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <mat-paginator
            [length]="serverTotal()"
            [pageIndex]="pageIndex()"
            [pageSize]="pageSize()"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPage($event)">
          </mat-paginator>
        }
      </div>
    </div>

  `,
  styles: [`
    /* ── View tabs ── */
    .view-tabs {
      display: flex;
      gap: 4px;
      padding: 0 20px 0;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 0;
    }
    .view-tab {
      padding: 8px 20px;
      border: none;
      border-bottom: 3px solid transparent;
      background: transparent;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #666;
      transition: color 0.15s, border-color 0.15s;
    }
    .view-tab:hover  { color: #1976d2; }
    .view-tab.active { color: #1976d2; border-bottom-color: #1976d2; }

    /* ── Filter bar ── */
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px 0 8px;
    }
    .filter-select,
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
    .filter-search:focus {
      border-color: #94a3b8;
      box-shadow: 0 0 0 2px #f1f5f9;
    }
    .filter-select:disabled {
      background: #f8fafc;
      color: #94a3b8;
      cursor: default;
    }
    .filter-search {
      flex: 1;
      min-width: 160px;
      cursor: text;
    }

    /* ── Table ── */
    .grid-scroll { overflow-x: auto; }
    .grid-table tbody tr { cursor: pointer; }
    .num-col  { text-align: right; white-space: nowrap; }
    .date-col { white-space: nowrap; }
    .cb-col   { width: 36px; text-align: center; }
    .cb-col input[type="checkbox"] { cursor: pointer; accent-color: #2563eb; }

    /* ── Status cell ── */
    .status-cell { display: flex; align-items: center; gap: 6px; }
    .level-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      background: #e2e8f0;
      color: #475569;
      white-space: nowrap;
    }

    /* ── Action-btn colour overrides (scoped) ── */
    .action-btn.info    { background:#dbeafe; color:#2563eb; border-color:#bfdbfe; }
    .action-btn.info:hover:not(:disabled)    { background:#bfdbfe; color:#1d4ed8; border-color:#93c5fd; }
    .action-btn.success { background:#d1fae5; color:#059669; border-color:#a7f3d0; }
    .action-btn.success:hover:not(:disabled) { background:#a7f3d0; color:#047857; border-color:#6ee7b7; }
    .action-btn.warning { background:#fef3c7; color:#d97706; border-color:#fde68a; }
    .action-btn.warning:hover:not(:disabled) { background:#fde68a; color:#b45309; border-color:#fcd34d; }
    .action-btn.danger  { background:#fee2e2; color:#dc2626; border-color:#fecaca; }
    .action-btn.danger:hover:not(:disabled)  { background:#fecaca; color:#b91c1c; border-color:#fca5a5; }
    .action-btn.primary { background:#e0e7ff; color:#4f46e5; border-color:#c7d2fe; }
    .action-btn.primary:hover:not(:disabled) { background:#c7d2fe; color:#4338ca; border-color:#a5b4fc; }
    .action-btn.secondary { background:#f1f5f9; color:#475569; border-color:#e2e8f0; }
    .action-btn.secondary:hover:not(:disabled) { background:#e2e8f0; color:#1e293b; border-color:#cbd5e1; }

    /* ── Status badge overrides (scoped) ── */
    .status-badge.status-pending  { background:#dbeafe; color:#2563eb; }
    .status-badge.status-approved { background:#d1fae5; color:#059669; }
    .status-badge.status-rejected { background:#fee2e2; color:#dc2626; }
    .status-badge.status-returned { background:#fef3c7; color:#d97706; }

    /* ── Bulk action toolbar ── */
    .bulk-toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px 12px;
      margin-bottom: 8px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
    }
    .bulk-count {
      font-size: 13px;
      font-weight: 600;
      color: #1e40af;
      margin-right: 4px;
    }
    .btn-bulk-success,
    .btn-bulk-warning,
    .btn-bulk-danger,
    .btn-bulk-clear {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 12px;
      font-size: 13px;
      font-weight: 500;
      border-radius: 6px;
      border: 1px solid transparent;
      cursor: pointer;
    }
    .btn-bulk-success          { background:#d1fae5; color:#059669; border-color:#a7f3d0; }
    .btn-bulk-success:hover    { background:#a7f3d0; color:#047857; }
    .btn-bulk-warning          { background:#fef3c7; color:#d97706; border-color:#fde68a; }
    .btn-bulk-warning:hover    { background:#fde68a; color:#b45309; }
    .btn-bulk-danger           { background:#fee2e2; color:#dc2626; border-color:#fecaca; }
    .btn-bulk-danger:hover     { background:#fecaca; color:#b91c1c; }
    .btn-bulk-clear            { background:#f1f5f9; color:#64748b; border-color:#e2e8f0; }
    .btn-bulk-clear:hover      { background:#e2e8f0; color:#475569; }
    .btn-bulk-success mat-icon,
    .btn-bulk-warning mat-icon,
    .btn-bulk-danger mat-icon,
    .btn-bulk-clear mat-icon   { font-size:16px; width:16px; height:16px; }

    /* ── Override / Master Approver badge ── */
    .override-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 2px 7px 2px 4px;
      border-radius: 4px;
      background: #f3e8ff;
      color: #7c3aed;
      border: 1px solid #ddd6fe;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
      vertical-align: middle;
      cursor: default;
    }
    .override-badge-icon {
      font-size: 13px;
      width: 13px;
      height: 13px;
      line-height: 13px;
    }

    @media (max-width: 720px) {
      .page-header { align-items: stretch; }
      .page-header-actions { width: 100%; justify-content: flex-end; }
    }
  `]
})
export class OvertimeCaptureComponent {
  private txService = inject(OvertimeTransactionsService);
  private wf        = inject(WorkflowService);
  private user      = inject(UserContextService);
  private snack     = inject(MatSnackBar);
  private router    = inject(Router);
  private dialog    = inject(MatDialog);

  /** Only approvers (direct, excess, and payroll-side) may see the calculated rand amount; recommenders and plain capturers may not. */
  showAmount = computed(() => {
    const me = this.user.me();
    return !!(me?.isApprover || me?.isExcessApprover);
  });

  // ── View tab: 'current' shows in-flight queue, 'processed' shows own history ──
  activeTab = signal<'current' | 'processed'>('current');

  // ── Raw data — holds only the rows for the current server page ──
  allRows      = signal<OvertimeTransactionDto[]>([]);
  /** Total matching rows on the server (drives the paginator). */
  serverTotal  = signal(0);

  // ── Pre-compute per-row values once on data load, not on every CD tick ──
  private augmentedRows = computed(() => {
    const me         = this.user.me();
    const assigneeIds = identitySet(
      me?.userId,
      me?.employeeId,
      ...(me?.actingForUserIds ?? [])
    );
    const captureIds = identitySet(
      me?.userId,
      me?.employeeId
    );
    const isCapturedByMe = (capturedBy?: string | null) =>
      !!capturedBy && captureIds.has(capturedBy.toLowerCase());
    const isAssignedToMe = (assignee?: string | null) =>
      !!assignee && assigneeIds.has(assignee.toLowerCase());
    const isOverrideUser = this.user.me()?.isOverrideUser ?? false;
    return this.allRows().map(r => ({
      ...r,
      _sc: captureStatusClass(r.status),
      _ll: captureLevelLabel(r.status),
      _canEdit: r.status === WorkflowStatus.Requested
             || r.status === WorkflowStatus.Returned
             || (r.status === WorkflowStatus.Recommended && isCapturedByMe(r.capturedBy)),
      // isOverrideUser: master-approver can act on any non-terminal, non-submit row
      _canAct:  (isAssignedToMe(r.currentAssigneeUserId)
             || isOverrideUser)
             && r.status !== WorkflowStatus.Processed
             && r.status !== WorkflowStatus.Rejected
             && r.status !== WorkflowStatus.Returned,
      // True when override is the SOLE reason canAct is true (not the normal assignee)
      _isOverride: isOverrideUser
             && !isAssignedToMe(r.currentAssigneeUserId)
             && r.status !== WorkflowStatus.Processed
             && r.status !== WorkflowStatus.Rejected
             && r.status !== WorkflowStatus.Returned,
      _canCapturerReject: isCapturedByMe(r.capturedBy)
             && (r.status === WorkflowStatus.Requested
              || r.status === WorkflowStatus.Recommended
              || r.status === WorkflowStatus.Returned),
    }));
  });
  loading  = signal(false);
  pageIndex = signal(0);
  pageSize  = signal(25);

  // ── Filters ──
  filterStatus     = signal<number | ''>('');
  filterSalaryHead = signal('');
  filterDepartment = signal('');
  filterDivision   = signal('');
  filterSearch     = signal('');

  // ── Selection ──
  selectedIds = signal<Set<string>>(new Set());

  // ── Derived: filtered rows — all filters are server-side; no client-side filter needed ──
  filteredRows = computed(() => this.augmentedRows());

  // ── Derived: paginated page — server already paged ──
  pagedRows = computed(() => this.filteredRows());

  /**
   * Stable options snapshot: loaded once from a small unfiltered sample so the
   * filter dropdowns show all available values independent of the current page.
   */
  optionRows = signal<OvertimeTransactionDto[]>([]);

  // ── Derived: filter dropdown options (from stable optionRows, not current page) ──
  statusOptions = computed(() => {
    const seen = new Map<number, string>();
    for (const r of this.optionRows()) seen.set(r.status, r.statusLabel);
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

  divisionOptions = computed(() => {
    const seen = new Set<string>();
    for (const r of this.optionRows()) {
      const d = r.divisionName || r.legacyDivisionName;
      if (d) seen.add(d);
    }
    return [...seen].sort();
  });

  // ── Select-all for current page ──
  allOnPageSelected = computed(() => {
    const page = this.pagedRows();
    if (!page.length) return false;
    const sel = this.selectedIds();
    return page.every(r => sel.has(r.id.toString()));
  });

  // ── Bulk action derived counts (over ALL filtered rows, not just current page) ──
  bulkCanActCount = computed(() => {
    const sel = this.selectedIds();
    return this.augmentedRows().filter(r => sel.has(r.id.toString()) && r._canAct).length;
  });

  bulkCanRejectCount = computed(() => {
    const sel = this.selectedIds();
    return this.augmentedRows().filter(r => sel.has(r.id.toString()) && (r._canAct || r._canCapturerReject)).length;
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

  /**
   * Loads a small unfiltered sample to populate dropdown option lists so they
   * show all available values independent of the current filtered page.
   */
  private loadOptions(): void {
    const me   = this.user.me();
    const myId = me?.userId ?? '';
    // Fetch both queues to capture all distinct status, salary-head, dept, and
    // division values a capturer might encounter in their data.
    this.txService.listCurrent({ page: 1, pageSize: 200 }).subscribe({
      next: result => {
        const current = result?.items ?? [];
        this.txService.listProcessed({ page: 1, pageSize: 200, capturedById: myId }).subscribe({
          next: r2 => {
            const processed = r2?.items ?? [];
            const seen = new Map<string, OvertimeTransactionDto>();
            for (const r of [...current, ...processed]) seen.set(r.id.toString(), r);
            this.optionRows.set([...seen.values()]);
          }
        });
      }
    });
  }

  /** Track the in-flight load subscription so rapid filter changes cancel the previous request. */
  private loadSub?: Subscription;

  // ── Load ──
  load(): void {
    this.loadSub?.unsubscribe();
    this.loading.set(true);
    this.selectedIds.set(new Set());

    const me     = this.user.me();
    const myId   = me?.userId ?? '';
    const tab    = this.activeTab();
    const page   = this.pageIndex() + 1;   // Material paginator is 0-based; API is 1-based
    const size   = this.pageSize();
    const status = this.filterStatus() !== '' ? (this.filterStatus() as number) : undefined;
    const filters = {
      page,
      pageSize:       size,
      employeeSearch: this.filterSearch().trim() || undefined,
      status,
      salaryHeadName: this.filterSalaryHead() || undefined,
      departmentId:   this.filterDepartment() || undefined,
      divisionName:   this.filterDivision()   || undefined,
    };

    const obs$ = tab === 'current'
      ? this.txService.listCurrent(filters)
      : this.txService.listProcessed({ ...filters, capturedById: myId });

    this.loadSub = obs$.subscribe({
      next: result => {
        this.allRows.set(result?.items ?? []);
        this.serverTotal.set(result?.total ?? 0);
        this.loading.set(false);
      },
      error: e => {
        this.loading.set(false);
        this.snack.open(`Failed to load: ${e?.error?.message ?? e?.message}`, 'OK', { duration: 4000 });
      }
    });
  }

  /** Switch between the in-flight queue and the capturer's own history tab. */
  switchTab(tab: 'current' | 'processed'): void {
    this.activeTab.set(tab);
    this.filterStatus.set('');
    this.filterSalaryHead.set('');
    this.filterDepartment.set('');
    this.filterDivision.set('');
    this.filterSearch.set('');
    this.pageIndex.set(0);
    this.load();
  }

  // ── Filter setters ──
  setFilterStatus(e: Event): void {
    const v = (e.target as HTMLSelectElement).value;
    this.filterStatus.set(v === '' ? '' : +v as WorkflowStatus);
    this.pageIndex.set(0);
    this.load();
  }

  setFilterSalaryHead(e: Event): void {
    this.filterSalaryHead.set((e.target as HTMLSelectElement).value);
    this.pageIndex.set(0);
    this.load();
  }

  setFilterDepartment(e: Event): void {
    this.filterDepartment.set((e.target as HTMLSelectElement).value);
    this.pageIndex.set(0);
    this.load();
  }

  setFilterDivision(e: Event): void {
    this.filterDivision.set((e.target as HTMLSelectElement).value);
    this.pageIndex.set(0);
    this.load();
  }

  setFilterSearch(e: Event): void {
    this.filterSearch.set((e.target as HTMLInputElement).value);
    this.pageIndex.set(0);
    this.load();
  }

  // ── Pagination ──
  onPage(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  // ── Selection ──
  isSelected(r: OvertimeTransactionDto): boolean {
    return this.selectedIds().has(r.id.toString());
  }

  toggleRow(r: OvertimeTransactionDto, e: Event): void {
    const checked = (e.target as HTMLInputElement).checked;
    const next = new Set(this.selectedIds());
    checked ? next.add(r.id.toString()) : next.delete(r.id.toString());
    this.selectedIds.set(next);
  }

  toggleSelectAll(e: Event): void {
    const checked = (e.target as HTMLInputElement).checked;
    const next = new Set(this.selectedIds());
    for (const r of this.pagedRows()) {
      checked ? next.add(r.id.toString()) : next.delete(r.id.toString());
    }
    this.selectedIds.set(next);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  // ── Row helpers ──

  /** True only when the current user is the workflow assignee for this row
   *  and the transaction is not in a terminal or returned state.
   *  Controls Approve / Return buttons (assignee-only actions). */
  canAct(r: OvertimeTransactionDto): boolean {
    const me = this.user.me();
    const assigneeIds = identitySet(
      me?.userId,
      me?.employeeId,
      ...(me?.actingForUserIds ?? [])
    );
    return !!r.currentAssigneeUserId
        && assigneeIds.has(r.currentAssigneeUserId.toLowerCase())
        && r.status !== WorkflowStatus.Processed
        && r.status !== WorkflowStatus.Rejected
        && r.status !== WorkflowStatus.Returned;
  }

  /** True when the current user is the original capturer and the transaction
   *  has not yet been acted on by anyone above them (Requested, Recommended,
   *  or Returned). */
  canCapturerReject(r: OvertimeTransactionDto): boolean {
    const me = this.user.me();
    const captureIds = identitySet(me?.userId, me?.employeeId);
    return !!r.capturedBy
        && captureIds.has(r.capturedBy.toLowerCase())
        && (r.status === WorkflowStatus.Requested
            || r.status === WorkflowStatus.Recommended
            || r.status === WorkflowStatus.Returned);
  }

  /** True when the capturer can still make edits to the transaction.
   *  Includes Recommended so the capturer can recall and correct a
   *  submitted-but-not-yet-actioned transaction. */
  canEdit(r: OvertimeTransactionDto): boolean {
    const me = this.user.me();
    const captureIds = identitySet(me?.userId, me?.employeeId);
    return r.status === WorkflowStatus.Requested
        || r.status === WorkflowStatus.Returned
        || (r.status === WorkflowStatus.Recommended
            && !!r.capturedBy
            && captureIds.has(r.capturedBy.toLowerCase()));
  }


  view(r: OvertimeTransactionDto): void {
    this.router.navigate(['/overtime/capture', r.id]);
  }

  captureForEmployee(r: OvertimeTransactionDto): void {
    this.router.navigate(['/overtime/capture/new'], {
      queryParams: { employeeId: r.employeeId }
    });
  }

  // ── Bulk workflow actions ──

  /** Wraps a call so the forkJoin batch always settles; null = failed. */
  private bulkSettle<T>(obs: ReturnType<typeof this.wf.approve>) {
    return obs.pipe(catchError(() => of(null)));
  }

  private bulkSnack(verb: string, results: (unknown | null)[]): void {
    const ok   = results.filter(r => r !== null).length;
    const fail = results.filter(r => r === null).length;
    const msg  = fail > 0
      ? `${ok} ${verb}${ok !== 1 ? '' : ''}, ${fail} failed — retry individually.`
      : `${ok} ${verb}.`;
    this.snack.open(msg, 'OK', { duration: fail > 0 ? 5000 : 3000 });
  }

  bulkApprove(): void {
    const sel = this.selectedIds();
    const targets = this.augmentedRows().filter(r => sel.has(r.id.toString()) && r._canAct);
    if (!targets.length) return;
    forkJoin(targets.map(r => this.bulkSettle(this.wf.approve(r.id)))).subscribe(results => {
      this.bulkSnack('approved', results);
      this.clearSelection();
      this.load();
    });
  }

  bulkReturn(): void {
    const sel = this.selectedIds();
    const targets = this.augmentedRows().filter(r => sel.has(r.id.toString()) && r._canAct);
    if (!targets.length) return;
    forkJoin(targets.map(r => this.bulkSettle(this.wf.return(r.id, { comments: '' })))).subscribe(results => {
      this.bulkSnack('returned', results);
      this.clearSelection();
      this.load();
    });
  }

  bulkReject(): void {
    const sel = this.selectedIds();
    const targets = this.augmentedRows().filter(r => sel.has(r.id.toString()) && (r._canAct || r._canCapturerReject));
    if (!targets.length) return;
    this.dialog.open(CommentDialogComponent, {
      data: {
        title: `Reject ${targets.length} Transaction${targets.length > 1 ? 's' : ''}`,
        label: 'Reason for rejection',
        confirmLabel: 'Reject All',
        confirmColor: 'warn',
        required: true
      } as CommentDialogData,
      width: '420px',
      disableClose: false
    }).afterClosed().pipe(filter(c => c !== null && c !== undefined)).subscribe((comment: string) => {
      forkJoin(targets.map(r => this.bulkSettle(this.wf.reject(r.id, { comments: comment })))).subscribe(results => {
        this.bulkSnack('rejected', results);
        this.clearSelection();
        this.load();
      });
    });
  }

  // ── Export ──
  exportLoading = signal(false);

  /**
   * Exports all rows matching the current filters using a dedicated server-side
   * export endpoint that returns every matching row in a single response —
   * no client-side pagination, no concurrency storms, no offset cap.
   */
  exportToExcel(): void {
    if (this.exportLoading()) return;
    this.exportLoading.set(true);

    const me     = this.user.me();
    const myId   = me?.userId ?? '';
    const tab    = this.activeTab();
    const status = this.filterStatus() !== '' ? (this.filterStatus() as number) : undefined;
    const filters = {
      employeeSearch: this.filterSearch().trim() || undefined,
      status,
      salaryHeadName: this.filterSalaryHead() || undefined,
      departmentId:   this.filterDepartment() || undefined,
      divisionName:   this.filterDivision()   || undefined,
    };

    const obs$ = tab === 'current'
      ? this.txService.exportCurrent(filters)
      : this.txService.exportProcessed({ ...filters, capturedById: myId });

    obs$.subscribe({
      next: rows => {
        this.exportLoading.set(false);
        const data = (rows ?? []).map(r => ({
          'Employee':      r.employeeName,
          'Employee ID':   r.employeeId,
          'Department':    r.departmentName,
          'Division':      r.divisionName || r.legacyDivisionName || '',
          'Salary Head':   r.salaryHeadName,
          'Hours':         r.hours,
          'Date':          r.overtimeDate ? r.overtimeDate.slice(0, 10) : '',
          'Status':        r.statusLabel,
          'Recommender':   r.recommenderEmployeeName || '',
          'Approver':      r.approverEmployeeName || '',
          'Captured By':   r.capturedByEmployeeName || r.capturedByName || '',
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        ws['!cols'] = [
          { wch: 28 }, { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 18 },
          { wch: 8  }, { wch: 12 }, { wch: 28 }, { wch: 28 }, { wch: 28 }, { wch: 28 },
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Overtime');
        XLSX.writeFile(wb, `Overtime_${new Date().toISOString().slice(0, 10)}.xlsx`);
      },
      error: e => {
        this.exportLoading.set(false);
        this.snack.open(`Export failed: ${e?.error?.message ?? e?.message}`, 'OK', { duration: 4000 });
      }
    });
  }

  // ── Workflow actions ──
  submit(r: OvertimeTransactionDto): void {
    this.wf.submit(r.id).subscribe({
      next: () => { this.snack.open('Submitted for recommendation.', 'OK', { duration: 2500 }); this.load(); },
      error: e => this.snack.open(`Submit failed: ${e?.error?.message ?? e?.message}`, 'OK', { duration: 4000 })
    });
  }

  approve(r: OvertimeTransactionDto): void {
    this.wf.approve(r.id).subscribe({
      next: () => { this.snack.open('Approved.', 'OK', { duration: 2500 }); this.load(); },
      error: e => this.snack.open(`Approve failed: ${e?.error?.message ?? e?.message}`, 'OK', { duration: 4000 })
    });
  }

  returnTx(r: OvertimeTransactionDto): void {
    this.dialog.open(CommentDialogComponent, {
      data: { title: 'Return Transaction', label: 'Reason for returning', confirmLabel: 'Return', confirmColor: 'warn' } as CommentDialogData,
      width: '420px', disableClose: false
    }).afterClosed().pipe(filter(c => c !== null && c !== undefined)).subscribe((comment: string) => {
      this.wf.return(r.id, { comments: comment }).subscribe({
        next: () => { this.snack.open('Returned.', 'OK', { duration: 2500 }); this.load(); },
        error: e => this.snack.open(`Return failed: ${e?.error?.message ?? e?.message}`, 'OK', { duration: 4000 })
      });
    });
  }

  reject(r: OvertimeTransactionDto): void {
    this.dialog.open(CommentDialogComponent, {
      data: { title: 'Reject Transaction', label: 'Reason for rejection', confirmLabel: 'Reject', confirmColor: 'warn', required: true } as CommentDialogData,
      width: '420px', disableClose: false
    }).afterClosed().pipe(filter(c => c !== null && c !== undefined)).subscribe((comment: string) => {
      this.wf.reject(r.id, { comments: comment }).subscribe({
        next: () => { this.snack.open('Rejected.', 'OK', { duration: 2500 }); this.load(); },
        error: e => this.snack.open(`Reject failed: ${e?.error?.message ?? e?.message}`, 'OK', { duration: 4000 })
      });
    });
  }
}
