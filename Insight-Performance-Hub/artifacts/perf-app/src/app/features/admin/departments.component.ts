import { ChangeDetectionStrategy, Component, Inject, OnInit, inject, signal } from '@angular/core';
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
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

interface DepartmentRow {
  id: number;
  name: string;
  cycleId: number;
  financialYearLabel: string;
  divisions: { id: number; name: string }[];
}

interface UploadResult {
  rows: number;
  departmentsCreated: number;
  divisionsCreated: number;
  skipped: number;
}

interface RenameDialogData {
  title: string;
  label: string;
  value: string;
}

interface CycleOption {
  id: number;
  financialYearLabel: string;
}

@Component({
  selector: 'app-add-department-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Add Department</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Department name</mat-label>
        <input matInput [(ngModel)]="name" (keydown.enter)="save()" cdkFocusInitial />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Financial year</mat-label>
        <mat-select [(ngModel)]="cycleId">
          <mat-option *ngFor="let c of data.cycles" [value]="c.id">{{ c.financialYearLabel }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Divisions (optional, one per line)</mat-label>
        <textarea matInput rows="4" [(ngModel)]="divisionsText" placeholder="e.g.&#10;Budget Planning and Financial Reporting&#10;Expenditure and Payroll"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!name.trim() || !cycleId" (click)="save()">Add</button>
    </mat-dialog-actions>
  `,
  styles: [`.full { width: 100%; min-width: 320px; }`],
})
export class AddDepartmentDialogComponent {
  name = '';
  cycleId: number | null = null;
  divisionsText = '';
  constructor(
    private readonly ref: MatDialogRef<AddDepartmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: { cycles: CycleOption[] },
  ) {
    if (data.cycles.length) this.cycleId = data.cycles[data.cycles.length - 1].id;
  }
  save(): void {
    const name = this.name.trim();
    if (!name || !this.cycleId) return;
    const divisions = this.divisionsText.split('\n').map((s) => s.trim()).filter(Boolean);
    this.ref.close({ name, cycleId: this.cycleId, divisions });
  }
}

@Component({
  selector: 'app-rename-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full">
        <mat-label>{{ data.label }}</mat-label>
        <input matInput [(ngModel)]="value" (keydown.enter)="save()" cdkFocusInitial />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!value.trim()" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`.full { width: 100%; min-width: 320px; }`],
})
export class RenameDialogComponent {
  value: string;
  constructor(
    private readonly ref: MatDialogRef<RenameDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: RenameDialogData,
  ) {
    this.value = data.value;
  }
  save(): void {
    const v = this.value.trim();
    if (v) this.ref.close(v);
  }
}

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, PageHeaderComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <app-page-header icon="domain" title="Departments" subtitle="Manage departments and divisions per financial year">
        <button mat-stroked-button (click)="addDepartment()">
          <mat-icon>add</mat-icon> Add Department
        </button>
        <button mat-stroked-button (click)="downloadTakeOnSheet()" [disabled]="downloading()">
          <mat-icon>download</mat-icon> Take-on Sheet
        </button>
        <button mat-flat-button color="primary" (click)="fileInput.click()" [disabled]="uploading()">
          <mat-icon>upload_file</mat-icon> {{ uploading() ? 'Uploading…' : 'Upload' }}
        </button>
        <input #fileInput type="file" accept=".csv" hidden (change)="onFileSelected($event)" />
      </app-page-header>

      <div class="hint card">
        <mat-icon>info</mat-icon>
        <span>
          Download the take-on sheet, complete the <strong>Department</strong>, <strong>Division</strong> and
          <strong>Financial year</strong> columns (one division per row), then upload it to load your organisational structure.
        </span>
      </div>

      <div *ngIf="loading()" class="center"><mat-spinner diameter="36"></mat-spinner></div>

      <ng-container *ngIf="!loading()">
        <app-empty-state *ngIf="!departments().length" icon="domain" title="No departments yet"
          message="Download the take-on sheet, fill in your departments and divisions, and upload it to get started.">
        </app-empty-state>

        <div class="grid" *ngIf="departments().length">
          <div class="card dept" *ngFor="let d of departments(); trackBy: trackDept">
            <div class="dept__head">
              <div class="dept__icon"><mat-icon>domain</mat-icon></div>
              <div class="dept__title">
                <h3>{{ d.name }}</h3>
                <span class="muted">{{ d.financialYearLabel }} · {{ d.divisions.length }} division{{ d.divisions.length === 1 ? '' : 's' }}</span>
              </div>
              <button mat-icon-button class="row-action" (click)="renameDepartment(d)" aria-label="Edit department name">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button class="dept__delete" (click)="remove(d)" aria-label="Delete department">
                <mat-icon>delete_outline</mat-icon>
              </button>
            </div>
            <ul class="divisions" *ngIf="d.divisions.length; else noDivs">
              <li *ngFor="let v of d.divisions">
                <mat-icon>subdirectory_arrow_right</mat-icon>
                <span class="div-name">{{ v.name }}</span>
                <button mat-icon-button class="row-action row-action--sm" (click)="renameDivision(d, v)" aria-label="Edit division name">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button class="row-action row-action--sm row-action--danger" (click)="removeDivision(d, v)" aria-label="Delete division">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </li>
            </ul>
            <ng-template #noDivs><p class="muted xs italic pad">No divisions captured</p></ng-template>
            <button mat-button class="add-div" (click)="addDivision(d)">
              <mat-icon>add</mat-icon> Add Division
            </button>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 16px; }
    .card { background: var(--plat-surface); border: 1px solid var(--plat-border); border-radius: 14px; box-shadow: var(--plat-shadow-sm); }
    .hint { display: flex; align-items: center; gap: 10px; padding: 12px 16px; font-size: 13px; color: #475569; }
    .hint mat-icon { color: #2563eb; font-size: 20px; width: 20px; height: 20px; }
    .center { display: flex; justify-content: center; padding: 40px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
    .dept { padding: 16px; }
    .dept__head { display: flex; align-items: flex-start; gap: 12px; }
    .dept__icon { width: 38px; height: 38px; border-radius: 10px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .dept__icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .dept__title { flex: 1; min-width: 0; }
    .dept__title h3 { margin: 0; font-size: 15px; font-weight: 600; color: #0f172a; }
    .dept__delete { color: #94a3b8; }
    .dept__delete:hover { color: #dc2626; }
    .muted { color: #64748b; font-size: 12px; }
    .xs { font-size: 12px; } .italic { font-style: italic; } .pad { padding: 8px 0 0 50px; margin: 0; }
    .divisions { list-style: none; margin: 10px 0 0; padding: 0 0 0 12px; display: flex; flex-direction: column; gap: 6px; }
    .divisions li { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #334155; }
    .divisions mat-icon { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; }
    .div-name { flex: 1; min-width: 0; }
    .row-action { color: #94a3b8; }
    .row-action:hover { color: #2563eb; }
    .row-action--sm { width: 28px; height: 28px; line-height: 28px; }
    .row-action--danger:hover { color: #dc2626; }
    .row-action--sm mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .divisions li:not(:hover) .row-action--sm { opacity: 0; }
    .add-div { margin-top: 10px; font-size: 12px; color: #2563eb; }
    .add-div mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `],
})
export class DepartmentsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  renameDepartment(d: DepartmentRow): void {
    this.dialog.open(RenameDialogComponent, {
      panelClass: 'plat-dialog', autoFocus: true,
      data: { title: 'Edit Department', label: 'Department name', value: d.name } satisfies RenameDialogData,
    }).afterClosed().subscribe((name: string | undefined) => {
      if (!name || name === d.name) return;
      this.api.patch(`/departments/${d.id}`, { name }).pipe(
        tap(() => { this.toast.success('Department updated'); this.load(); }),
        catchError((e) => { this.toast.error('Update failed', e?.error?.error ?? e?.message); return of(null); }),
      ).subscribe();
    });
  }

  renameDivision(d: DepartmentRow, v: { id: number; name: string }): void {
    this.dialog.open(RenameDialogComponent, {
      panelClass: 'plat-dialog', autoFocus: true,
      data: { title: `Edit Division — ${d.name}`, label: 'Division name', value: v.name } satisfies RenameDialogData,
    }).afterClosed().subscribe((name: string | undefined) => {
      if (!name || name === v.name) return;
      this.api.patch(`/divisions/${v.id}`, { name }).pipe(
        tap(() => { this.toast.success('Division updated'); this.load(); }),
        catchError((e) => { this.toast.error('Update failed', e?.error?.error ?? e?.message); return of(null); }),
      ).subscribe();
    });
  }

  addDepartment(): void {
    this.api.get<CycleOption[]>('/cycles').pipe(
      tap((cycles) => {
        this.dialog.open(AddDepartmentDialogComponent, {
          panelClass: 'plat-dialog', autoFocus: true, data: { cycles },
        }).afterClosed().subscribe((res: { name: string; cycleId: number; divisions?: string[] } | undefined) => {
          if (!res) return;
          this.api.post('/departments', res).pipe(
            tap(() => { this.toast.success('Department added'); this.load(); }),
            catchError((e) => { this.toast.error('Add failed', e?.error?.error ?? e?.message); return of(null); }),
          ).subscribe();
        });
      }),
      catchError((e) => { this.toast.error('Failed to load financial years', e?.error?.error ?? e?.message); return of(null); }),
    ).subscribe();
  }

  addDivision(d: DepartmentRow): void {
    this.dialog.open(RenameDialogComponent, {
      panelClass: 'plat-dialog', autoFocus: true,
      data: { title: `Add Division — ${d.name}`, label: 'Division name', value: '' } satisfies RenameDialogData,
    }).afterClosed().subscribe((name: string | undefined) => {
      if (!name) return;
      this.api.post(`/departments/${d.id}/divisions`, { name }).pipe(
        tap(() => { this.toast.success('Division added'); this.load(); }),
        catchError((e) => { this.toast.error('Add failed', e?.error?.error ?? e?.message); return of(null); }),
      ).subscribe();
    });
  }

  removeDivision(d: DepartmentRow, v: { id: number; name: string }): void {
    if (!confirm(`Delete division "${v.name}" from ${d.name}?`)) return;
    this.api.delete(`/divisions/${v.id}`).pipe(
      tap(() => { this.toast.success('Division deleted'); this.load(); }),
      catchError((e) => { this.toast.error('Delete failed', e?.error?.error ?? e?.message); return of(null); }),
    ).subscribe();
  }

  readonly departments = signal<DepartmentRow[]>([]);
  readonly loading = signal(true);
  readonly downloading = signal(false);
  readonly uploading = signal(false);

  ngOnInit(): void { this.load(); }

  trackDept = (_: number, d: DepartmentRow) => d.id;

  load(): void {
    this.loading.set(true);
    this.api.get<DepartmentRow[]>('/departments').pipe(
      tap((rows) => { this.departments.set(rows); this.loading.set(false); }),
      catchError((e) => {
        this.loading.set(false);
        this.toast.error('Failed to load departments', e?.error?.error ?? e?.message);
        return of(null);
      }),
    ).subscribe();
  }

  downloadTakeOnSheet(): void {
    this.downloading.set(true);
    this.api.getBlob('/departments/take-on-sheet').pipe(
      tap((blob) => {
        this.downloading.set(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'department-take-on-sheet.csv';
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
      this.api.post<UploadResult>('/departments/upload', { fileBase64: base64, fileName: file.name }).pipe(
        tap((res) => {
          this.uploading.set(false);
          this.toast.success(
            'Take-on sheet imported',
            `${res.departmentsCreated} department(s) and ${res.divisionsCreated} division(s) added` +
            (res.skipped ? `, ${res.skipped} duplicate(s) skipped` : ''),
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

  remove(d: DepartmentRow): void {
    if (!confirm(`Delete department "${d.name}" and its divisions?`)) return;
    this.api.delete(`/departments/${d.id}`).pipe(
      tap(() => { this.toast.success('Department deleted'); this.load(); }),
      catchError((e) => {
        this.toast.error('Delete failed', e?.error?.error ?? e?.message);
        return of(null);
      }),
    ).subscribe();
  }
}
