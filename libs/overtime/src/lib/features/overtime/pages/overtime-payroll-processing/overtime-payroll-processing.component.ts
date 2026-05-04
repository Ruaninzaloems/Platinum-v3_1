import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS, MatDateFormats } from '@angular/material/core';
import { firstValueFrom } from 'rxjs';

const DATE_FORMATS: MatDateFormats = {
  parse:   { dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' } },
  display: {
    dateInput:            { day: '2-digit', month: '2-digit', year: 'numeric' },
    monthYearLabel:       { month: 'short', year: 'numeric' },
    dateA11yLabel:        { day: 'numeric', month: 'long', year: 'numeric' },
    monthYearA11yLabel:   { month: 'long', year: 'numeric' },
  },
};

import { environment } from '../../../../environment';
import { ApiResponse } from '../../../../core/models/api-response.model';
import {
  PayrollProcessingRowDto,
  PayrollProcessingSummaryDto,
  SendToPayrollRequest
} from '../../../../core/models/overtime-workflow.model';

interface ConstDepartmentDto { departmentId: number; departmentDesc: string; departmentCode?: string | null; }
interface ConstDivisionDto   { divisionId: number; divisionDesc: string; departmentId?: number | null; }
interface ConstCycleDto      { cycleId: number; cycleDesc: string; }
interface PayrollCyclePeriodDto {
  periodId: number;
  displayName: string;
  cycleId?: number | null;
  taxYear?: string | null;
  financialYear?: string | null;
}

@Component({
  selector: 'app-overtime-payroll-processing',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule, MatDatepickerModule],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE,   useValue: 'en-GB' },
    { provide: MAT_DATE_FORMATS,  useValue: DATE_FORMATS },
  ],
  template: `
    <div class="page-content overtime-page">

      <!-- ── PAGE HEADER ─────────────────────────────────────────────── -->
      <header class="page-header">
        <div class="page-header-text">
          <h1 class="page-title">Payroll Processing</h1>
          <p class="page-subtitle">Review approved overtime and release selected transactions to payroll</p>
        </div>
        <div class="page-header-actions">
          <button class="btn" type="button" (click)="cancel()">
            <mat-icon>arrow_back</mat-icon>
            <span>Cancel</span>
          </button>
        </div>
      </header>

      <!-- ── FILTER BAR ───────────────────────────────────────────────── -->
      <div class="filter-bar">
        <div class="filter-group">
          <label class="filter-label">From <span class="required-star">*</span></label>
          <div class="date-field-wrap">
            <input class="filter-input date-field" readonly
                   [matDatepicker]="fromPicker"
                   [(ngModel)]="filterFromDate"
                   placeholder="dd/mm/yyyy" />
            <mat-datepicker-toggle class="date-toggle" [for]="fromPicker"></mat-datepicker-toggle>
            <mat-datepicker #fromPicker></mat-datepicker>
          </div>
        </div>
        <div class="filter-group">
          <label class="filter-label">To <span class="required-star">*</span></label>
          <div class="date-field-wrap">
            <input class="filter-input date-field" readonly
                   [matDatepicker]="toPicker"
                   [(ngModel)]="filterToDate"
                   placeholder="dd/mm/yyyy" />
            <mat-datepicker-toggle class="date-toggle" [for]="toPicker"></mat-datepicker-toggle>
            <mat-datepicker #toPicker></mat-datepicker>
          </div>
        </div>
        <div class="filter-group">
          <label class="filter-label">Cycle <span class="required-star">*</span></label>
          <select class="filter-select" [(ngModel)]="selectedCycleId" (ngModelChange)="onCycleChange()">
            <option [ngValue]="null">Select cycle…</option>
            @for (c of cycles(); track c.cycleId) {
              <option [ngValue]="c.cycleId">{{ c.cycleDesc }}</option>
            }
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Period <span class="required-star">*</span></label>
          <select class="filter-select" [(ngModel)]="selectedPeriodId"
                  [disabled]="!selectedCycleId || periodsLoading()">
            <option [ngValue]="null">
              @if (periodsLoading()) { Loading… }
              @else if (!selectedCycleId) { Select cycle first… }
              @else if (periods().length === 0) { No open periods }
              @else { Select period… }
            </option>
            @for (p of periods(); track p.periodId) {
              <option [ngValue]="p.periodId">{{ p.displayName }}</option>
            }
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Department</label>
          <select class="filter-select" [(ngModel)]="filterDepartmentId" (ngModelChange)="onDeptChange()">
            <option [ngValue]="null">All Departments</option>
            @for (d of departments(); track d.departmentId) {
              <option [ngValue]="d.departmentId">{{ d.departmentDesc }}</option>
            }
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Division</label>
          <select class="filter-select" [(ngModel)]="filterDivisionId">
            <option [ngValue]="null">All Divisions</option>
            @for (d of filteredDivisions(); track d.divisionId) {
              <option [ngValue]="d.divisionId">{{ d.divisionDesc }}</option>
            }
          </select>
        </div>
        <button class="btn btn-primary" type="button" (click)="runSearch()"
                [disabled]="loading() || !canSearch()"
                [matTooltip]="canSearch() ? '' : 'Date From, Date To, Cycle and Period are required'">
          <mat-icon>search</mat-icon>
          <span>Search</span>
        </button>
        <button class="btn" type="button" (click)="clearFilters()">
          <mat-icon>clear</mat-icon>
          <span>Clear</span>
        </button>
      </div>

      <!-- ── LOADING ──────────────────────────────────────────────────── -->
      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="32"></mat-spinner>
          <span>Searching…</span>
        </div>
      }

      <!-- ── PRE-SEARCH PROMPT ─────────────────────────────────────────── -->
      @if (!searched() && !loading()) {
        <div class="empty-state">
          <mat-icon>filter_alt</mat-icon>
          <p>Select a date range and cycle, then click <strong>Search</strong> to load transactions.</p>
        </div>
      }

      <!-- ── RESULTS TABLE ─────────────────────────────────────────────── -->
      @if (rows().length > 0 || searched()) {
        <!-- Selection summary + Send panel -->
        <div class="action-bar">
          <div class="action-bar-info">
            @if (selectedIds().size > 0) {
              <span class="selection-chip">
                {{ selectedIds().size }} selected
                &nbsp;·&nbsp;
                {{ selectionHours() | number:'1.2-2' }} hrs
                &nbsp;·&nbsp;
                R {{ selectionAmount() | number:'1.2-2' }}
              </span>
            } @else {
              <span class="selection-hint">Select rows to release to payroll</span>
            }
          </div>

          <div class="send-controls">
            <button class="btn btn-export"
                    type="button"
                    [disabled]="rows().length === 0"
                    (click)="exportCsv()"
                    matTooltip="Export selected rows (or all rows if none selected) to CSV">
              <mat-icon>download</mat-icon>
              <span>Export CSV</span>
              @if (selectedIds().size > 0) {
                <span class="export-count">({{ selectedIds().size }})</span>
              }
            </button>
            <select class="filter-select" [(ngModel)]="selectedPeriodId" [disabled]="!selectedCycleId">
              <option [ngValue]="null">Select period…</option>
              @for (p of periods(); track p.periodId) {
                <option [ngValue]="p.periodId">{{ p.displayName }}</option>
              }
            </select>
            <button class="btn btn-primary"
                    type="button"
                    [disabled]="selectedIds().size === 0 || !selectedPeriodId || sending()"
                    (click)="sendToPayroll()">
              @if (sending()) {
                <mat-spinner diameter="16" class="btn-spinner"></mat-spinner>
                <span>Sending…</span>
              } @else {
                <mat-icon>send</mat-icon>
                <span>Send to Payroll</span>
              }
            </button>
          </div>
        </div>

        <!-- Table -->
        @if (rows().length === 0) {
          <div class="empty-state">
            <mat-icon>check_circle_outline</mat-icon>
            <p>No transactions pending payroll release match your filters.</p>
          </div>
        } @else {
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="col-check">
                    <input type="checkbox"
                           [checked]="allSelected()"
                           [indeterminate]="someSelected()"
                           (change)="toggleAll($event)"
                           title="Select all" />
                  </th>
                  <th>Employee</th>
                  <th>Position</th>
                  <th>Date</th>
                  <th class="col-num">Hours</th>
                  <th class="col-num">Amount</th>
                  <th>Division</th>
                  <th>Recommender</th>
                  <th>Approver</th>
                  <th>Status</th>
                  <th class="col-badge">Excess</th>
                </tr>
              </thead>
              <tbody>
                @for (row of rows(); track row.id) {
                  <tr [class.selected]="selectedIds().has(row.id)"
                      (click)="toggleRow(row.id)">
                    <td class="col-check" (click)="$event.stopPropagation()">
                      <input type="checkbox"
                             [checked]="selectedIds().has(row.id)"
                             (change)="toggleRow(row.id)" />
                    </td>
                    <td>
                      <div class="emp-name">{{ row.employeeName }}</div>
                      <div class="emp-id">{{ row.employeeId }}</div>
                    </td>
                    <td>{{ row.positionDescription || row.positionId || '—' }}</td>
                    <td>{{ row.overtimeDate | date:'dd MMM yyyy' }}</td>
                    <td class="col-num">{{ row.hours | number:'1.2-2' }}</td>
                    <td class="col-num">R {{ row.amount | number:'1.2-2' }}</td>
                    <td>{{ row.legacyDivisionName || '—' }}</td>
                    <td>{{ row.recommenderEmployeeName || '—' }}</td>
                    <td>{{ row.approverEmployeeName || '—' }}</td>
                    <td>
                      <span class="badge badge-green">{{ row.statusLabel }}</span>
                    </td>
                    <td class="col-badge">
                      @if (row.isExcess) {
                        <span class="badge badge-orange" matTooltip="Excess overtime">EXC</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Summary footer -->
          <div class="summary-footer">
            <span class="summary-item">
              <mat-icon>grid_on</mat-icon>
              {{ summary()?.totalRows ?? 0 }} rows
            </span>
            <span class="summary-item">
              <mat-icon>schedule</mat-icon>
              {{ summary()?.totalHours ?? 0 | number:'1.2-2' }} hrs total
            </span>
            <span class="summary-item">
              <mat-icon>payments</mat-icon>
              R {{ summary()?.totalAmount ?? 0 | number:'1.2-2' }} total
            </span>
          </div>
        }
      }

    </div>
  `,
  styles: [`
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
    }
    .page-title   { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
    .page-subtitle { font-size: 13px; color: #64748b; margin: 0; }
    .page-header-actions { display: flex; gap: 8px; align-items: center; }

    .filter-bar {
      display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end;
      background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 14px 16px; margin-bottom: 16px;
    }
    .filter-group { display: flex; flex-direction: column; gap: 4px; }
    .filter-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; }
    .required-star { color: #e53935; margin-left: 2px; }
    .date-field-wrap { position: relative; display: flex; align-items: center; }
    .date-field { padding-right: 34px !important; cursor: pointer; }
    .date-toggle { position: absolute; right: 1px; top: 50%; transform: translateY(-50%); }
    .date-toggle button { width: 30px !important; height: 30px !important; padding: 0 !important; }
    .filter-input, .filter-select {
      height: 36px; padding: 0 10px;
      border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: 13px; color: #1e293b;
      background: #f8fafc; outline: none;
    }
    .filter-input:focus, .filter-select:focus { border-color: #3b82f6; background: #fff; }

    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      height: 36px; padding: 0 14px;
      background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: 13px; font-weight: 600; color: #475569;
      cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .btn:hover:not(:disabled) { background: #f1f5f9; color: #1e293b; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .btn-primary {
      background: #3b82f6; border-color: #3b82f6; color: #fff;
    }
    .btn-primary:hover:not(:disabled) { background: #2563eb; border-color: #2563eb; color: #fff; }
    .btn-export {
      background: #fff; border-color: #d1d5db; color: #374151;
    }
    .btn-export:hover:not(:disabled) { background: #f9fafb; border-color: #6b7280; color: #111827; }
    .export-count { font-size: 11px; font-weight: 700; color: #1d4ed8; margin-left: 2px; }
    .btn-spinner { margin-right: 4px; }

    .loading-state {
      display: flex; align-items: center; gap: 12px;
      padding: 20px; color: #64748b; font-size: 14px;
    }

    .action-bar {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 12px;
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 12px 16px; margin-bottom: 12px;
    }
    .action-bar-info { display: flex; align-items: center; gap: 8px; }
    .selection-chip {
      display: inline-flex; align-items: center;
      padding: 4px 12px; border-radius: 20px;
      background: #eff6ff; color: #1d4ed8;
      font-size: 13px; font-weight: 600;
      border: 1px solid #bfdbfe;
    }
    .selection-hint { font-size: 13px; color: #94a3b8; }
    .send-controls  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

    .table-wrapper { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 10px; }
    .data-table {
      width: 100%; border-collapse: collapse;
      font-size: 13px; color: #1e293b;
    }
    .data-table thead tr {
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
    }
    .data-table th {
      padding: 10px 12px; text-align: left;
      font-size: 11px; font-weight: 700; color: #64748b;
      text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap;
    }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    .data-table tbody tr {
      cursor: pointer; transition: background 0.1s;
    }
    .data-table tbody tr:hover { background: #f8fafc; }
    .data-table tbody tr.selected { background: #eff6ff; }
    .data-table tbody tr.selected:hover { background: #dbeafe; }
    .col-check { width: 40px; padding: 10px 8px 10px 14px; }
    .col-num   { text-align: right; }
    .col-badge { text-align: center; width: 60px; }

    .emp-name { font-weight: 600; color: #1e293b; }
    .emp-id   { font-size: 11px; color: #94a3b8; }

    .badge {
      display: inline-flex; align-items: center;
      padding: 1px 6px; border-radius: 8px;
      font-size: 9px; font-weight: 700;
      letter-spacing: 0.4px;
    }
    .badge-orange { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .badge-green  { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; font-size: 10px; }

    .summary-footer {
      display: flex; gap: 24px; align-items: center;
      padding: 12px 16px;
      background: #f8fafc; border: 1px solid #e2e8f0;
      border-top: none; border-radius: 0 0 10px 10px;
    }
    .summary-item {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 600; color: #475569;
    }
    .summary-item mat-icon { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 48px 20px; color: #94a3b8; gap: 8px;
    }
    .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.5; }
    .empty-state p { margin: 0; font-size: 14px; }
  `]
})
export class OvertimePayrollProcessingComponent implements OnInit {
  private http   = inject(HttpClient);
  private snack  = inject(MatSnackBar);
  private router = inject(Router);
  private base   = environment.apiBaseUrl;

  // ── filters ──────────────────────────────────────────────────────────
  filterFromDate: Date | null = null;
  filterToDate:   Date | null = null;
  filterDepartmentId: number | null = null;
  filterDivisionId:   number | null = null;

  // ── send-to-payroll controls ──────────────────────────────────────────
  selectedCycleId:  number | null = null;
  selectedPeriodId: number | null = null;

  // ── state ─────────────────────────────────────────────────────────────
  loading  = signal(false);
  sending  = signal(false);
  searched = signal(false);

  summary     = signal<PayrollProcessingSummaryDto | null>(null);
  rows        = computed(() => this.summary()?.rows ?? []);
  selectedIds = signal<Set<string>>(new Set());

  departments       = signal<ConstDepartmentDto[]>([]);
  allDivisions      = signal<ConstDivisionDto[]>([]);
  filteredDivisions = computed(() => {
    if (!this.filterDepartmentId) return this.allDivisions();
    return this.allDivisions().filter(d => d.departmentId === this.filterDepartmentId);
  });
  cycles         = signal<ConstCycleDto[]>([]);
  periods        = signal<PayrollCyclePeriodDto[]>([]);
  periodsLoading = signal(false);

  // ── selection helpers ─────────────────────────────────────────────────
  allSelected  = computed(() => this.rows().length > 0 && this.rows().every(r => this.selectedIds().has(r.id)));
  someSelected = computed(() => !this.allSelected() && this.rows().some(r => this.selectedIds().has(r.id)));

  selectionHours  = computed(() =>
    this.rows().filter(r => this.selectedIds().has(r.id)).reduce((s, r) => s + r.hours, 0));
  selectionAmount = computed(() =>
    this.rows().filter(r => this.selectedIds().has(r.id)).reduce((s, r) => s + r.amount, 0));

  // ── lifecycle ─────────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadDepartments(),
      this.loadDivisions(),
      this.loadCycles()
    ]);
    // Grid is not loaded automatically — user must supply From, To, and Cycle first.
  }

  // ── navigation ────────────────────────────────────────────────────────
  cancel(): void {
    this.router.navigate(['/overtime/capture']);
  }

  // ── filter actions ────────────────────────────────────────────────────
  onDeptChange(): void {
    this.filterDivisionId = null;
  }

  /** All four required filter fields must be set before Search is allowed. */
  canSearch(): boolean {
    return !!this.filterFromDate && !!this.filterToDate
        && !!this.selectedCycleId && !!this.selectedPeriodId;
  }

  /** Converts a Date to yyyy-mm-dd without UTC shift. */
  private dateToIso(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  clearFilters(): void {
    this.filterFromDate     = null;
    this.filterToDate       = null;
    this.filterDepartmentId = null;
    this.filterDivisionId   = null;
    this.selectedCycleId    = null;
    this.selectedPeriodId   = null;
    this.periods.set([]);
    this.summary.set(null);
    this.searched.set(false);
    this.selectedIds.set(new Set());
  }

  // ── row selection ─────────────────────────────────────────────────────
  toggleRow(id: string): void {
    const next = new Set(this.selectedIds());
    if (next.has(id)) next.delete(id); else next.add(id);
    this.selectedIds.set(next);
  }

  toggleAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedIds.set(checked ? new Set(this.rows().map(r => r.id)) : new Set());
  }

  // ── cycle / period ────────────────────────────────────────────────────
  async onCycleChange(): Promise<void> {
    this.selectedPeriodId = null;
    this.periods.set([]);
    if (this.selectedCycleId == null) return;
    this.periodsLoading.set(true);
    try {
      const r = await firstValueFrom(
        this.http.get<ApiResponse<PayrollCyclePeriodDto[]>>(
          `${this.base}/payroll-lookups/cycle-periods-open?cycleId=${this.selectedCycleId}`));
      if (r?.isSuccess && r.data) {
        this.periods.set(r.data);
        // Auto-select if only one period available.
        if (r.data.length === 1) this.selectedPeriodId = r.data[0].periodId;
      }
    } catch {
      this.snack.open('Failed to load periods.', 'OK', { duration: 3000 });
    } finally {
      this.periodsLoading.set(false);
    }
  }

  // ── API calls ─────────────────────────────────────────────────────────
  async runSearch(): Promise<void> {
    this.loading.set(true);
    this.selectedIds.set(new Set());
    try {
      const params: string[] = [];
      if (this.filterFromDate)     params.push(`fromDate=${this.dateToIso(this.filterFromDate)}`);
      if (this.filterToDate)       params.push(`toDate=${this.dateToIso(this.filterToDate)}`);
      if (this.selectedCycleId)    params.push(`cycleId=${this.selectedCycleId}`);
      if (this.filterDepartmentId) params.push(`departmentId=${this.filterDepartmentId}`);
      if (this.filterDivisionId)   params.push(`divisionId=${this.filterDivisionId}`);
      const qs = params.length > 0 ? '?' + params.join('&') : '';
      const r = await firstValueFrom(
        this.http.get<ApiResponse<PayrollProcessingSummaryDto>>(
          `${this.base}/payroll-processing/search${qs}`));
      if (r?.isSuccess && r.data) {
        this.summary.set(r.data);
      } else {
        this.snack.open(r?.errors?.[0] ?? 'Search failed.', 'OK', { duration: 4000 });
      }
    } catch (e: any) {
      this.snack.open(e?.error?.errors?.[0] ?? 'Failed to load transactions.', 'OK', { duration: 4000 });
    } finally {
      this.loading.set(false);
      this.searched.set(true);
    }
  }

  async sendToPayroll(): Promise<void> {
    if (this.selectedIds().size === 0 || !this.selectedPeriodId) return;
    this.sending.set(true);
    const body: SendToPayrollRequest = {
      selectedIds: Array.from(this.selectedIds()),
      periodId: this.selectedPeriodId
    };
    try {
      const r = await firstValueFrom(
        this.http.post<ApiResponse<number>>(`${this.base}/payroll-processing/send-to-payroll`, body));
      if (r?.isSuccess) {
        this.snack.open(`${r.data} transaction(s) sent to payroll successfully.`, 'OK', { duration: 3000 });
        this.selectedIds.set(new Set());
        this.selectedPeriodId = null;
        await this.runSearch();
      } else {
        this.snack.open(r?.errors?.[0] ?? 'Send to payroll failed.', 'OK', { duration: 5000 });
      }
    } catch (e: any) {
      this.snack.open(e?.error?.errors?.[0] ?? 'Send to payroll failed.', 'OK', { duration: 5000 });
    } finally {
      this.sending.set(false);
    }
  }

  // ── CSV export ────────────────────────────────────────────────────────
  exportCsv(): void {
    const exportRows = this.selectedIds().size > 0
      ? this.rows().filter(r => this.selectedIds().has(r.id))
      : this.rows();

    if (exportRows.length === 0) return;

    const escape = (val: string | number | null | undefined): string => {
      let s = val == null ? '' : String(val);
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const headers = [
      'Employee', 'Employee ID', 'Position',
      'Date', 'Start', 'End',
      'OT Type', 'Hours', 'Amount',
      'Department', 'Division',
      'Recommender', 'Approver',
      'Status', 'Excess'
    ];

    const lines: string[] = [headers.join(',')];

    for (const r of exportRows) {
      const date = r.overtimeDate
        ? new Date(r.overtimeDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
        : '';
      lines.push([
        escape(r.employeeName),
        escape(r.employeeId),
        escape(r.positionDescription || r.positionId || ''),
        escape(date),
        escape(r.startTime || ''),
        escape(r.endTime || ''),
        escape(r.salaryHeadName),
        escape(r.hours),
        escape(r.amount),
        escape(r.legacyDepartmentName || ''),
        escape(r.legacyDivisionName || ''),
        escape(r.recommenderEmployeeName || ''),
        escape(r.approverEmployeeName || ''),
        escape(r.statusLabel),
        escape(r.isExcess ? 'Yes' : '')
      ].join(','));
    }

    const csv = lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `payroll-overtime-export-${timestamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    const count = exportRows.length;
    const scope = this.selectedIds().size > 0 ? 'selected' : 'all';
    this.snack.open(`Exported ${count} ${scope} row(s) to CSV.`, 'OK', { duration: 3000 });
  }

  // ── lookup loaders ────────────────────────────────────────────────────
  private async loadDepartments(): Promise<void> {
    try {
      const r = await firstValueFrom(
        this.http.get<ApiResponse<ConstDepartmentDto[]>>(`${this.base}/payroll-lookups/departments`));
      if (r?.isSuccess && r.data) this.departments.set(r.data);
    } catch { /* non-critical */ }
  }

  private async loadDivisions(): Promise<void> {
    try {
      const r = await firstValueFrom(
        this.http.get<ApiResponse<ConstDivisionDto[]>>(`${this.base}/payroll-lookups/divisions`));
      if (r?.isSuccess && r.data) this.allDivisions.set(r.data);
    } catch { /* non-critical */ }
  }

  private async loadCycles(): Promise<void> {
    try {
      const r = await firstValueFrom(
        this.http.get<ApiResponse<ConstCycleDto[]>>(`${this.base}/payroll-lookups/cycles`));
      if (r?.isSuccess && r.data) this.cycles.set(r.data);
    } catch { /* non-critical */ }
  }
}
