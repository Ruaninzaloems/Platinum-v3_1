import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { PeriodFilterService } from '../../core/services/period-filter.service';
import { Compilation, AfsTemplate, FinancialYear } from '../../core/models/interfaces';

@Component({
  selector: 'app-create-compilation-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './compilations.component.html',
  styleUrl: './compilations.component.css'
})
export class CreateCompilationDialogComponent implements OnInit {
  private api = inject(ApiService);
  private dialogRef = inject(MatDialogRef<CreateCompilationDialogComponent>);

  templates: AfsTemplate[] = [];
  financialYears: FinancialYear[] = [];
  periodMonths: Array<{ value: string; label: string }> = [];
  data = { name: '', templateId: '', financialYearId: '', periodFrom: '', periodTo: '' };

  saving = false;
  created = false;
  errorMessage = '';
  private createdCompilation: Compilation | null = null;

  ngOnInit() {
    this.api.get<AfsTemplate[]>('/templates').subscribe(t => this.templates = t);
    this.api.get<FinancialYear[]>('/admin/financial-years').subscribe(fy => this.financialYears = fy);
  }

  onFinancialYearChange(): void {
    const fy = this.financialYears.find(f => f.id === this.data.financialYearId);
    if (!fy) { this.periodMonths = []; return; }
    this.periodMonths = this.buildPeriodMonths(fy.startDate, fy.endDate);
    if (this.periodMonths.length > 0) {
      this.data.periodFrom = this.periodMonths[0].value;
      this.data.periodTo = this.periodMonths[this.periodMonths.length - 1].value;
    }
  }

  isFormValid(): boolean {
    return !!(this.data.name && this.data.templateId && this.data.financialYearId && this.data.periodFrom && this.data.periodTo);
  }

  private buildPeriodMonths(startDate: string, endDate: string): Array<{ value: string; label: string }> {
    const months: Array<{ value: string; label: string }> = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      const value = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[current.getMonth()]} ${current.getFullYear()}`;
      months.push({ value, label });
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  }

  save() {
    if (this.saving || this.created) return;
    this.saving = true;
    this.errorMessage = '';
    this.dialogRef.disableClose = true;
    this.api.post<Compilation>('/compilations', this.data).subscribe({
      next: (c) => {
        this.saving = false;
        this.created = true;
        this.createdCompilation = c;
        this.dialogRef.disableClose = false;
      },
      error: (err) => {
        this.saving = false;
        this.dialogRef.disableClose = false;
        this.errorMessage = err?.error?.message || err?.message || 'Failed to create compilation. Please try again.';
      }
    });
  }

  close() {
    this.dialogRef.close(this.createdCompilation);
  }
}

@Component({
  selector: 'app-compilations',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTableModule, MatProgressBarModule, MatProgressSpinnerModule, MatDialogModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .system-default-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      margin-left: 6px;
      background: #dbeafe;
      color: #1e40af;
      border-radius: 4px;
      vertical-align: middle;
    }
    .inactive-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      color: #616161;
      font-size: 14px;
      margin-bottom: 16px;
    }
    .inactive-banner mat-icon {
      color: #9e9e9e;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .kpi-inactive {
      border-left: 3px solid #9e9e9e !important;
      background: #fafafa;
    }
    .kpi-inactive .kpi-label { color: #757575; }
    .kpi-inactive .kpi-value { color: #616161; }
    .kpi-clickable {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .kpi-clickable:hover {
      background: #f0f0f5;
      transform: translateY(-1px);
    }
    .kpi-selected {
      border-left: 3px solid #3f51b5 !important;
      background: #e8eaf6 !important;
    }
    .kpi-selected .kpi-label { color: #3f51b5; }
    .kpi-selected .kpi-value { color: #283593; }
    .filter-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      background: #e8eaf6;
      border: 1px solid #c5cae9;
      border-radius: 8px;
      color: #3f51b5;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 16px;
    }
    .filter-banner mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Compilations</h1>
          <div class="subtitle">Annual Financial Statement compilations</div>
        </div>
        <div class="page-actions">
          @if (activeFilter === 'inactive') {
            <button mat-stroked-button (click)="setFilter('all')" matTooltip="Return to active compilations list">
              <mat-icon>arrow_back</mat-icon> Back to Active
            </button>
          } @else {
            <span [matTooltip]="generalInfoLoading ? 'Checking General Information...' : (!generalInfoMinFieldsMet ? 'Complete required General Information fields before creating a compilation' : 'Create a new AFS compilation from a template')">
              <button mat-flat-button class="btn-primary" (click)="openCreate()"
                [disabled]="generalInfoLoading || !generalInfoMinFieldsMet">
                <mat-icon>add</mat-icon> New Compilation
              </button>
            </span>
          }
        </div>
      </div>

      @if (!generalInfoMinFieldsMet && !generalInfoLoading) {
        <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;margin-bottom:16px;background:#fff3e0;border:1px solid #ffcc80;border-radius:8px">
          <mat-icon style="color:#e65100">info</mat-icon>
          <div style="flex:1">
            <strong style="color:#e65100">General Information Required</strong>
            <span style="color:#bf360c;margin-left:8px">Complete required General Information fields before creating a compilation.</span>
          </div>
          <button mat-stroked-button (click)="goToGeneralInfo()">
            <mat-icon>arrow_forward</mat-icon> Go to General Information
          </button>
        </div>
      }

      @if (loading) {
        <div style="display:flex;justify-content:center;padding:48px">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {

      @if (activeFilter === 'inactive') {
        <div class="inactive-banner">
          <mat-icon>archive</mat-icon>
          <span>Showing inactive compilations. These are hidden from the main dashboard.</span>
        </div>
      } @else if (activeFilter !== 'all') {
        <div class="filter-banner">
          <mat-icon>filter_list</mat-icon>
          <span>Filtered by: {{ formatStatus(activeFilter) }}</span>
          <button mat-icon-button (click)="setFilter('all')" matTooltip="Clear filter">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      }

      <div class="summary-strip">
        <div class="kpi-card kpi-clickable" [class.kpi-selected]="activeFilter === 'all'" (click)="setFilter('all')" matTooltip="Click to show all active compilations">
          <div class="kpi-label">Total</div>
          <div class="kpi-value">{{ allCompilations.length }}</div>
        </div>
        <div class="kpi-card kpi-clickable" [class.kpi-selected]="activeFilter === 'draft'" (click)="setFilter('draft')" matTooltip="Click to filter by draft status">
          <div class="kpi-label">Draft</div>
          <div class="kpi-value">{{ countByStatus('draft') }}</div>
        </div>
        <div class="kpi-card kpi-clickable" [class.kpi-selected]="activeFilter === 'in_review'" (click)="setFilter('in_review')" matTooltip="Click to filter by in review status">
          <div class="kpi-label">In Review</div>
          <div class="kpi-value">{{ countByStatus('in_review') }}</div>
        </div>
        <div class="kpi-card kpi-clickable" [class.kpi-selected]="activeFilter === 'approved'" (click)="setFilter('approved')" matTooltip="Click to filter by approved status">
          <div class="kpi-label">Approved</div>
          <div class="kpi-value">{{ countByStatus('approved') }}</div>
        </div>
        <div class="kpi-card kpi-clickable kpi-inactive" [class.kpi-selected]="activeFilter === 'inactive'" (click)="setFilter('inactive')" matTooltip="Click to view inactive compilations">
          <div class="kpi-label">Inactive</div>
          <div class="kpi-value">{{ inactiveCount }}</div>
        </div>
      </div>

      <div class="detail-card">
        <table mat-table [dataSource]="compilations" class="data-table" style="width:100%">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef matTooltip="Compilation name identifier">Name</th>
            <td mat-cell *matCellDef="let row">{{ row.name }}</td>
          </ng-container>
          <ng-container matColumnDef="template">
            <th mat-header-cell *matHeaderCellDef matTooltip="AFS template used for this compilation">Template</th>
            <td mat-cell *matCellDef="let row">
              <span>{{ row.template?.name || '—' }}</span>
              @if (row.template?.isSystemDefault) {
                <span class="system-default-badge">System Default</span>
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="financialYear">
            <th mat-header-cell *matHeaderCellDef matTooltip="Financial year period for this compilation">Financial Year</th>
            <td mat-cell *matCellDef="let row">{{ row.financialYear?.label || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="periodFrom">
            <th mat-header-cell *matHeaderCellDef matTooltip="First period month included in this compilation">Period From</th>
            <td mat-cell *matCellDef="let row">{{ formatPeriod(row.periodFrom) }}</td>
          </ng-container>
          <ng-container matColumnDef="periodTo">
            <th mat-header-cell *matHeaderCellDef matTooltip="Last period month included in this compilation">Period To</th>
            <td mat-cell *matCellDef="let row">{{ formatPeriod(row.periodTo) }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef matTooltip="Current workflow status of the compilation">Status</th>
            <td mat-cell *matCellDef="let row">
              <span class="status-badge" [ngClass]="row.status" matTooltip="Status: {{ formatStatus(row.status) }}">{{ formatStatus(row.status) }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="completeness">
            <th mat-header-cell *matHeaderCellDef matTooltip="Percentage of line items with populated data">Completeness %</th>
            <td mat-cell *matCellDef="let row" style="min-width:140px">
              <div style="display:flex;align-items:center;gap:8px" matTooltip="Completeness: {{ row.completenessPercentage || 0 }}% of line items populated">
                <mat-progress-bar mode="determinate" [value]="row.completenessPercentage" style="flex:1"></mat-progress-bar>
                <span style="font-size:12px;font-weight:600;white-space:nowrap">{{ row.completenessPercentage || 0 }}%</span>
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="lastCalculated">
            <th mat-header-cell *matHeaderCellDef matTooltip="When the compilation was last calculated from trial balance data">Last Calculated</th>
            <td mat-cell *matCellDef="let row">{{ row.lastCalculatedAt ? (row.lastCalculatedAt | date:'medium') : 'Never' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef matTooltip="Available actions for each compilation">Actions</th>
            <td mat-cell *matCellDef="let row">
              @if (activeFilter !== 'inactive') {
                <button mat-icon-button (click)="viewCompilation(row); $event.stopPropagation()" matTooltip="View compilation details and financial statements">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button (click)="openInStudio(row); $event.stopPropagation()" matTooltip="Open in Mapping Studio">
                  <mat-icon>tune</mat-icon>
                </button>
                <button mat-icon-button (click)="deactivateCompilation(row); $event.stopPropagation()" matTooltip="Make this compilation inactive">
                  <mat-icon>archive</mat-icon>
                </button>
              } @else {
                <button mat-icon-button (click)="reactivateCompilation(row); $event.stopPropagation()" matTooltip="Reactivate this compilation">
                  <mat-icon>unarchive</mat-icon>
                </button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" (click)="activeFilter !== 'inactive' && viewCompilation(row)" [style.cursor]="activeFilter === 'inactive' ? 'default' : 'pointer'"></tr>
        </table>

        @if (compilations.length === 0) {
          <div class="empty-state" matTooltip="Get started by creating your first AFS compilation">
            <mat-icon>folder_open</mat-icon>
            @if (activeFilter === 'inactive') {
              <h3>No inactive compilations</h3>
              <p>All compilations are currently active</p>
            } @else if (activeFilter !== 'all') {
              <h3>No {{ formatStatus(activeFilter) }} compilations</h3>
              <p>There are no compilations with this status</p>
            } @else {
              <h3>No compilations yet</h3>
              <p>Create your first compilation to get started</p>
            }
          </div>
        }
      </div>
      }
    </div>
  `
})
export class CompilationsComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private periodFilter = inject(PeriodFilterService);

  allCompilations: Compilation[] = [];
  compilations: Compilation[] = [];
  loading = true;
  activeFilter: 'all' | 'draft' | 'in_review' | 'approved' | 'inactive' = 'all';
  inactiveCount = 0;
  displayedColumns = ['name', 'template', 'financialYear', 'periodFrom', 'periodTo', 'status', 'completeness', 'lastCalculated', 'actions'];

  generalInfo: any = null;
  generalInfoLoading = false;
  get generalInfoMinFieldsMet(): boolean {
    if (!this.generalInfo) return false;
    const g = this.generalInfo;
    return !!(g.municipalityName && g.demarcationCode && g.accountingOfficer && g.cfo && g.reportingPeriodStart && g.reportingPeriodEnd);
  }

  constructor() {
    effect(() => {
      const fyId = this.periodFilter.selectedFyId();
      if (fyId) {
        this.loadGeneralInfo(fyId);
      }
    });
  }

  ngOnInit() {
    this.loadCompilations();
    this.loadInactiveCount();
    const fyId = this.periodFilter.selectedFyId();
    if (fyId) {
      this.loadGeneralInfo(fyId);
    }
  }

  private loadGeneralInfo(fyId: string): void {
    this.generalInfoLoading = true;
    this.cdr.markForCheck();
    this.api.get<any>(`/general-information/${fyId}`).subscribe({
      next: (data) => {
        this.generalInfo = data;
        this.generalInfoLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.generalInfo = null;
        this.generalInfoLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  goToGeneralInfo(): void {
    this.router.navigate(['/general-information']);
  }

  loadCompilations() {
    this.loading = true;
    this.cdr.markForCheck();
    const params = this.activeFilter === 'inactive' ? '?isActive=false' : '';
    this.api.get<Compilation[]>(`/compilations${params}`).subscribe({
      next: (data) => {
        if (this.activeFilter === 'inactive') {
          this.allCompilations = data;
          this.compilations = data;
        } else {
          this.allCompilations = data;
          this.applyStatusFilter();
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private applyStatusFilter() {
    if (this.activeFilter === 'all' || this.activeFilter === 'inactive') {
      this.compilations = this.allCompilations;
    } else {
      this.compilations = this.allCompilations.filter(c => c.status === this.activeFilter);
    }
  }

  setFilter(filter: 'all' | 'draft' | 'in_review' | 'approved' | 'inactive') {
    const wasInactive = this.activeFilter === 'inactive';
    const goingInactive = filter === 'inactive';
    this.activeFilter = filter;

    if (wasInactive !== goingInactive) {
      this.loadCompilations();
    } else {
      this.applyStatusFilter();
      this.cdr.markForCheck();
    }
  }

  loadInactiveCount() {
    this.api.get<number>('/compilations/inactive-count').subscribe({
      next: (count) => {
        this.inactiveCount = count;
        this.cdr.markForCheck();
      }
    });
  }

  deactivateCompilation(row: Compilation) {
    if (!confirm(`Are you sure you want to make "${row.name}" inactive? It will be removed from the main dashboard.`)) return;
    this.api.put(`/compilations/${row.id}/toggle-active`, {}).subscribe({
      next: () => {
        this.loadCompilations();
        this.loadInactiveCount();
      }
    });
  }

  reactivateCompilation(row: Compilation) {
    if (!confirm(`Are you sure you want to reactivate "${row.name}"?`)) return;
    this.api.put(`/compilations/${row.id}/toggle-active`, {}).subscribe({
      next: () => {
        this.loadCompilations();
        this.loadInactiveCount();
      }
    });
  }

  countByStatus(status: string): number {
    return this.allCompilations.filter(c => c.status === status).length;
  }

  formatStatus(status: string): string {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';
  }

  formatPeriod(period: string | undefined): string {
    if (!period) return '—';
    const [year, month] = period.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const idx = parseInt(month, 10) - 1;
    return idx >= 0 && idx < 12 ? `${monthNames[idx]} ${year}` : period;
  }

  viewCompilation(row: Compilation) {
    this.router.navigate(['/compilations', row.id]);
  }

  openInStudio(row: Compilation) {
    this.router.navigate(['/mappings'], { queryParams: { compilationId: row.id } });
  }

  openCreate() {
    const ref = this.dialog.open(CreateCompilationDialogComponent, { width: '500px' });
    ref.afterClosed().subscribe(result => {
      if (result) { this.loadCompilations(); this.loadInactiveCount(); }
    });
  }
}
