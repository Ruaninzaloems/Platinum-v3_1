import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, of, tap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

export const EMPLOYEE_LEVELS = ['Staff', 'Manager', 'Director', 'MM'] as const;

export const PERFORMANCE_CATEGORIES = [
  'Section 56/57 Managers (Regulation 805)',
  'Employees (Regulation 890)',
] as const;

export interface EmployeeRow {
  id: number;
  username: string;
  displayName: string;
  firstName: string | null;
  surname: string | null;
  idNumber: string | null;
  cellphone: string | null;
  email: string;
  role: string;
  departmentId: number | null;
  departmentName: string | null;
  divisionId: number | null;
  divisionName: string | null;
  employeeNumber: string | null;
  jobTitle: string | null;
  level: string | null;
  supervisorId: number | null;
  supervisorName: string | null;
  performanceCategory: string | null;
  startDate: string | null;
  terminationDate: string | null;
  isActive: boolean;
}

interface DivisionOption { id: number; name: string; }
interface DepartmentOption { id: number; name: string; divisions?: DivisionOption[]; }

interface EmployeeDialogData {
  employee: EmployeeRow | null;
  departments: DepartmentOption[];
  employees: EmployeeRow[];
}

@Component({
  selector: 'app-employee-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.employee ? 'Edit Employee' : 'Add Employee' }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Employee No</mat-label>
        <input matInput [(ngModel)]="employeeNumber" cdkFocusInitial />
      </mat-form-field>
      <div class="row2">
        <mat-form-field appearance="outline">
          <mat-label>First name</mat-label>
          <input matInput [(ngModel)]="firstName" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Surname</mat-label>
          <input matInput [(ngModel)]="surname" />
        </mat-form-field>
      </div>
      <mat-form-field appearance="outline" class="full">
        <mat-label>ID Number</mat-label>
        <input matInput [(ngModel)]="idNumber" />
      </mat-form-field>
      <div class="row2">
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" [(ngModel)]="email" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Cell</mat-label>
          <input matInput [(ngModel)]="cellphone" />
        </mat-form-field>
      </div>
      <div class="row2">
        <mat-form-field appearance="outline">
          <mat-label>Job title</mat-label>
          <input matInput [(ngModel)]="jobTitle" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Level</mat-label>
          <mat-select [(ngModel)]="level">
            <mat-option [value]="null">—</mat-option>
            <mat-option *ngFor="let l of levels" [value]="l">{{ l }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      <div class="row2">
        <mat-form-field appearance="outline">
          <mat-label>Department</mat-label>
          <mat-select [(ngModel)]="departmentId" (selectionChange)="onDepartmentChange()">
            <mat-option [value]="null">—</mat-option>
            <mat-option *ngFor="let d of data.departments" [value]="d.id">{{ d.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Division</mat-label>
          <mat-select [(ngModel)]="divisionId" [disabled]="!divisionOptions().length">
            <mat-option [value]="null">—</mat-option>
            <mat-option *ngFor="let v of divisionOptions()" [value]="v.id">{{ v.name }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Performance category</mat-label>
        <mat-select [(ngModel)]="performanceCategory">
          <mat-option [value]="null">—</mat-option>
          <mat-option *ngFor="let c of categories" [value]="c">{{ c }}</mat-option>
        </mat-select>
      </mat-form-field>
      <div class="row2">
        <mat-form-field appearance="outline">
          <mat-label>Start date</mat-label>
          <input matInput type="date" [(ngModel)]="startDate" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Termination date</mat-label>
          <input matInput type="date" [(ngModel)]="terminationDate" />
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!firstName.trim() || !surname.trim() || !email.trim()" (click)="save()">
        {{ data.employee ? 'Save' : 'Add' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full { width: 100%; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; min-width: 480px; }
  `],
})
export class EmployeeDialogComponent {
  readonly levels = EMPLOYEE_LEVELS;
  readonly categories = PERFORMANCE_CATEGORIES;
  firstName = '';
  surname = '';
  idNumber = '';
  cellphone = '';
  employeeNumber = '';
  jobTitle = '';
  level: string | null = null;
  performanceCategory: string | null = null;
  departmentId: number | null = null;
  divisionId: number | null = null;
  supervisorId: number | null = null;
  startDate = '';
  terminationDate = '';
  email = '';
  readonly divisionOptions = signal<DivisionOption[]>([]);

  constructor(
    private readonly ref: MatDialogRef<EmployeeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: EmployeeDialogData,
  ) {
    const e = data.employee;
    if (e) {
      this.firstName = e.firstName ?? '';
      this.surname = e.surname ?? '';
      if (!this.firstName && !this.surname && e.displayName) {
        const parts = e.displayName.split(' ');
        this.firstName = parts[0] ?? '';
        this.surname = parts.slice(1).join(' ');
      }
      this.idNumber = e.idNumber ?? '';
      this.cellphone = e.cellphone ?? '';
      this.employeeNumber = e.employeeNumber ?? '';
      this.jobTitle = e.jobTitle ?? '';
      this.level = e.level;
      this.performanceCategory = e.performanceCategory;
      this.departmentId = e.departmentId;
      this.divisionId = e.divisionId;
      this.supervisorId = e.supervisorId;
      this.startDate = e.startDate ?? '';
      this.terminationDate = e.terminationDate ?? '';
      this.email = e.email;
    }
    this.refreshDivisions();
  }

  onDepartmentChange(): void {
    this.divisionId = null;
    this.refreshDivisions();
  }

  private refreshDivisions(): void {
    const dept = this.data.departments.find((d) => d.id === this.departmentId);
    this.divisionOptions.set(dept?.divisions ?? []);
  }

  save(): void {
    if (!this.firstName.trim() || !this.surname.trim() || !this.email.trim()) return;
    this.ref.close({
      firstName: this.firstName.trim(),
      surname: this.surname.trim(),
      idNumber: this.idNumber.trim() || null,
      cellphone: this.cellphone.trim() || null,
      employeeNumber: this.employeeNumber.trim() || null,
      jobTitle: this.jobTitle.trim() || null,
      level: this.level,
      performanceCategory: this.performanceCategory,
      departmentId: this.departmentId,
      divisionId: this.divisionId,
      supervisorId: this.supervisorId,
      startDate: this.startDate || null,
      terminationDate: this.terminationDate || null,
      email: this.email.trim(),
    });
  }
}

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatFormFieldModule, MatSelectModule, PageHeaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <app-page-header icon="group" title="Employees" [subtitle]="employees().length + ' employee' + (employees().length === 1 ? '' : 's')">
        <button mat-stroked-button (click)="downloadTakeOnSheet()" [disabled]="downloading()">
          <mat-icon>download</mat-icon> Take-on Sheet
        </button>
        <button mat-stroked-button (click)="fileInput.click()" [disabled]="uploading()">
          <mat-icon>upload_file</mat-icon> {{ uploading() ? 'Uploading…' : 'Upload' }}
        </button>
        <input #fileInput type="file" accept=".csv,.xlsx" hidden (change)="onFileSelected($event)" />
        <button mat-flat-button color="primary" (click)="openDialog(null)">
          <mat-icon>add</mat-icon> Add Employee
        </button>
      </app-page-header>

      <div class="hint card">
        <mat-icon>info</mat-icon>
        <span>
          Download the take-on sheet, complete one row per employee (departments and divisions must already be loaded),
          then upload it to load your staff establishment. Existing employees are matched by email or employee number and updated.
        </span>
      </div>

      <div class="filter-bar">
        <mat-form-field appearance="outline" class="level-filter" subscriptSizing="dynamic">
          <mat-select [(ngModel)]="levelFilter" (selectionChange)="onFilterChange()">
            <mat-option [value]="''">All Levels</mat-option>
            <mat-option *ngFor="let l of levels" [value]="l">{{ l }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div *ngIf="loading()" class="center"><mat-spinner diameter="36"></mat-spinner></div>

      <ng-container *ngIf="!loading()">
        <app-empty-state *ngIf="!filtered().length" icon="group" title="No employees found"
          message="Add an employee or change the level filter.">
        </app-empty-state>

        <div class="card table-wrap" *ngIf="filtered().length">
          <table>
            <thead>
              <tr>
                <th>Employee No</th>
                <th>First Name</th>
                <th>Surname</th>
                <th>ID Number</th>
                <th>Email</th>
                <th>Cell</th>
                <th>Job Title</th>
                <th>Level</th>
                <th>Department</th>
                <th>Division</th>
                <th>Performance Category</th>
                <th>Start Date</th>
                <th>Termination Date</th>
                <th class="actions-col"></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of filtered(); trackBy: trackEmp">
                <td class="mono">{{ e.employeeNumber || '—' }}</td>
                <td class="name">{{ e.firstName || '—' }}</td>
                <td class="name">{{ e.surname || '—' }}</td>
                <td class="mono">{{ e.idNumber || '—' }}</td>
                <td class="email">{{ e.email }}</td>
                <td class="mono">{{ e.cellphone || '—' }}</td>
                <td>{{ e.jobTitle || '—' }}</td>
                <td>
                  <span class="chip" *ngIf="e.level" [ngClass]="'chip--' + e.level.toLowerCase()">{{ e.level }}</span>
                  <span class="muted" *ngIf="!e.level">—</span>
                </td>
                <td>{{ e.departmentName || '—' }}</td>
                <td>{{ e.divisionName || '—' }}</td>
                <td class="cat">{{ e.performanceCategory || '—' }}</td>
                <td class="nowrap">{{ e.startDate ? (e.startDate | date:'dd-MMM-yy') : '—' }}</td>
                <td class="nowrap">{{ e.terminationDate ? (e.terminationDate | date:'dd-MMM-yy') : '—' }}</td>
                <td class="actions-col">
                  <button mat-icon-button class="row-action" (click)="openDialog(e)" aria-label="Edit employee">
                    <mat-icon>edit_note</mat-icon>
                  </button>
                  <button mat-icon-button class="row-action row-action--danger" (click)="deleteEmployee(e)" aria-label="Delete employee">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 16px; }
    .hint { display: flex; align-items: center; gap: 10px; padding: 12px 16px; color: #475569; font-size: 13px; }
    .hint mat-icon { color: #2563eb; flex-shrink: 0; }
    .card { background: var(--plat-surface); border: 1px solid var(--plat-border); border-radius: 14px; box-shadow: var(--plat-shadow-sm); }
    .center { display: flex; justify-content: center; padding: 40px; }
    .filter-bar { display: flex; }
    .level-filter { width: 160px; }
    .level-filter ::ng-deep .mat-mdc-text-field-wrapper { background: #fff; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 12px 14px; color: #64748b; font-weight: 600; font-size: 12px; border-bottom: 1px solid var(--plat-border); white-space: nowrap; }
    td { padding: 12px 14px; border-bottom: 1px solid var(--plat-border); color: #475569; vertical-align: middle; }
    tr:last-child td { border-bottom: 0; }
    tbody tr:hover { background: #f8fafc; }
    .name { color: #0f172a; font-weight: 600; white-space: nowrap; }
    .mono { font-family: ui-monospace, monospace; font-size: 12px; color: #64748b; white-space: nowrap; }
    .email { color: #2563eb; }
    .muted { color: #94a3b8; }
    .cat { min-width: 180px; }
    .nowrap { white-space: nowrap; }
    .chip { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .chip--staff { background: #fce7f3; color: #be185d; }
    .chip--manager { background: #dbeafe; color: #1d4ed8; }
    .chip--director { background: #e0e7ff; color: #4338ca; }
    .chip--mm { background: #f3e8ff; color: #7e22ce; }
    .actions-col { width: 96px; text-align: right; white-space: nowrap; }
    .row-action { color: #94a3b8; }
    .row-action:hover { color: #2563eb; }
    .row-action--danger:hover { color: #dc2626; }
  `],
})
export class EmployeesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly dialog = inject(MatDialog);

  readonly levels = EMPLOYEE_LEVELS;
  readonly employees = signal<EmployeeRow[]>([]);
  readonly loading = signal(true);
  readonly downloading = signal(false);
  readonly uploading = signal(false);
  levelFilter = '';
  private readonly filterSig = signal('');

  readonly filtered = computed(() => {
    const f = this.filterSig().toLowerCase();
    const rows = this.employees();
    return f ? rows.filter((e) => (e.level ?? '').toLowerCase() === f) : rows;
  });

  ngOnInit(): void { this.load(); }

  trackEmp = (_: number, e: EmployeeRow) => e.id;

  onFilterChange(): void { this.filterSig.set(this.levelFilter); }

  load(): void {
    this.loading.set(true);
    this.api.get<EmployeeRow[]>('/auth/users').pipe(
      tap((rows) => { this.employees.set(rows); this.loading.set(false); }),
      catchError((e) => {
        this.loading.set(false);
        this.toast.error('Failed to load employees', e?.error?.error ?? e?.message);
        return of(null);
      }),
    ).subscribe();
  }

  async deleteEmployee(e: EmployeeRow): Promise<void> {
    const ok = await this.confirm.confirm({
      title: 'Delete employee',
      message: `Delete ${e.displayName}${e.employeeNumber ? ' (Employee No ' + e.employeeNumber + ')' : ''}? This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    this.api.delete(`/auth/users/${e.id}`).pipe(
      tap(() => { this.toast.success('Employee deleted', e.displayName); this.load(); }),
      catchError((err) => {
        this.toast.error('Delete failed', err?.error?.error ?? err?.message);
        return of(null);
      }),
    ).subscribe();
  }

  downloadTakeOnSheet(): void {
    this.downloading.set(true);
    this.api.getBlob('/auth/users/take-on-sheet').pipe(
      tap((blob) => {
        this.downloading.set(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'employee-take-on-sheet.csv';
        a.click();
        URL.revokeObjectURL(url);
      }),
      catchError((e) => {
        this.downloading.set(false);
        this.toast.error('Download failed', e?.error?.error ?? e?.message);
        return of(null);
      }),
    ).subscribe();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.substring(dataUrl.indexOf(',') + 1);
      this.uploading.set(true);
      this.api.post<{ rows: number; created: number; updated: number }>('/auth/users/upload', { fileBase64: base64, fileName: file.name }).pipe(
        tap((res) => {
          this.uploading.set(false);
          this.toast.success(
            'Take-on sheet imported',
            `${res.created} employee(s) added` + (res.updated ? `, ${res.updated} updated` : ''),
          );
          this.load();
        }),
        catchError((e) => {
          this.uploading.set(false);
          const details: string[] = e?.error?.details ?? [];
          this.toast.error(
            'Import failed',
            [e?.error?.error ?? e?.message, ...details.slice(0, 5)].filter(Boolean).join(' — '),
          );
          return of(null);
        }),
      ).subscribe();
    };
    reader.readAsDataURL(file);
  }

  openDialog(employee: EmployeeRow | null): void {
    this.api.get<DepartmentOption[]>('/departments').pipe(
      tap((departments) => {
        this.dialog.open(EmployeeDialogComponent, {
          panelClass: 'plat-dialog', autoFocus: true, maxHeight: '90vh',
          data: { employee, departments, employees: this.employees() } satisfies EmployeeDialogData,
        }).afterClosed().subscribe((payload: Record<string, unknown> | undefined) => {
          if (!payload) return;
          const req$ = employee
            ? this.api.patch(`/auth/users/${employee.id}`, payload)
            : this.api.post('/auth/users', payload);
          req$.pipe(
            tap(() => { this.toast.success(employee ? 'Employee updated' : 'Employee added'); this.load(); }),
            catchError((e) => { this.toast.error('Save failed', e?.error?.error ?? e?.message); return of(null); }),
          ).subscribe();
        });
      }),
      catchError((e) => { this.toast.error('Failed to load departments', e?.error?.error ?? e?.message); return of(null); }),
    ).subscribe();
  }
}
