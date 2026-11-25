import { ChangeDetectionStrategy, Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, finalize, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { ScorecardType } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-scorecard-type-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.entity ? 'Edit' : 'Create' }} Scorecard Type</h2>
    <form (ngSubmit)="save()" #f="ngForm">
      <mat-dialog-content class="content">
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Code</mat-label><input matInput [(ngModel)]="model.code" name="code" required /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="model.name" name="name" required /></mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="model.isActive" name="status">
            <mat-option [value]="true">Active</mat-option><mat-option [value]="false">Inactive</mat-option>
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="saving() || f.invalid">{{ saving() ? 'Saving…' : 'Save' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 420px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } mat-form-field { width: 100%; }`],
})
export class ScorecardTypeDialogComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  saving = signal(false);
  model: { code: string; name: string; description: string; isActive: boolean };
  constructor(public ref: MatDialogRef<ScorecardTypeDialogComponent, ScorecardType | null>, @Inject(MAT_DIALOG_DATA) public data: { entity: ScorecardType | null }) {
    this.model = { code: data.entity?.code ?? '', name: data.entity?.name ?? '', description: data.entity?.description ?? '', isActive: data.entity?.isActive ?? true };
  }
  save() {
    this.saving.set(true);
    const id = this.data.entity?.id;
    const obs = id ? this.api.patch<ScorecardType>(`/scorecard-types/${id}`, this.model) : this.api.post<ScorecardType>(`/scorecard-types`, this.model);
    obs.pipe(
      tap((r) => { this.toast.success('Saved'); this.ref.close(r); }),
      catchError((e) => { this.toast.error('Save failed', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }
}

@Component({
  selector: 'app-scorecard-types',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PageHeaderComponent, StatusBadgeComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Scorecard Types" subtitle="Define the categories of scorecards used across the organisation." icon="list_alt" tone="indigo">
        <button mat-flat-button color="primary" (click)="open(null)"><mat-icon>add</mat-icon> Add Type</button>
      </app-page-header>
      <div class="plat-card">
        <app-loading-spinner *ngIf="loading()"></app-loading-spinner>
        <table *ngIf="!loading()" class="plat-table">
          <thead><tr><th>Code</th><th>Name</th><th>Status</th><th class="actions">Actions</th></tr></thead>
          <tbody>
            <tr *ngIf="rows().length === 0"><td colspan="4" class="empty">No scorecard types defined.</td></tr>
            <tr *ngFor="let r of rows()">
              <td class="mono">{{ r.code }}</td>
              <td><strong>{{ r.name }}</strong></td>
              <td><app-status-badge [status]="r.isActive ? 'Active' : 'Inactive'"></app-status-badge></td>
              <td class="actions"><button mat-button color="primary" (click)="open(r)"><mat-icon>edit</mat-icon> Edit</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .plat-page { max-width: 860px; gap: 14px; }
    .plat-table { font-size: 13px; }
    .plat-table th { padding: 9px 16px; }
    .plat-table td { padding: 8px 16px; }
    .plat-table .empty { padding: 20px; }
    :host ::ng-deep app-page-header .page-header { padding: 12px 16px; border-radius: 12px; }
    :host ::ng-deep app-page-header .page-header__icon { width: 36px; height: 36px; }
    :host ::ng-deep app-page-header .page-header__icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    :host ::ng-deep app-page-header h1 { font-size: 17px; }
    :host ::ng-deep app-page-header p { font-size: 13px; margin-top: 2px; }
  `],
})
export class ScorecardTypesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  loading = signal(true); rows = signal<ScorecardType[]>([]);
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.api.get<ScorecardType[]>('/scorecard-types').pipe(
      tap((d) => this.rows.set(Array.isArray(d) ? d : [])),
      catchError(() => { this.rows.set([]); return of(null); }),
      finalize(() => this.loading.set(false)),
    ).subscribe();
  }
  open(entity: ScorecardType | null) {
    this.dialog.open(ScorecardTypeDialogComponent, { data: { entity }, panelClass: 'plat-dialog', autoFocus: false })
      .afterClosed().subscribe((r) => { if (r) this.load(); });
  }
}
