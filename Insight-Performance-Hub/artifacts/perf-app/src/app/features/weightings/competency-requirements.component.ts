import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
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
import { CompetencyRequirement, Cycle } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-competency-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.entity ? 'Edit' : 'Create' }} Competency</h2>
    <form (ngSubmit)="save()" #f="ngForm">
      <mat-dialog-content class="content">
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="model.name" name="n" required /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Weight (%)</mat-label><input matInput type="number" step="0.1" [(ngModel)]="model.weight" name="w" required /></mat-form-field>
        </div>
        <mat-form-field appearance="outline"><mat-label>Description</mat-label><textarea matInput rows="3" [(ngModel)]="model.description" name="d"></textarea></mat-form-field>
        <div class="grid">
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="model.isActive" name="a">
              <mat-option [value]="true">Active</mat-option>
              <mat-option [value]="false">Inactive</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Sort Order</mat-label><input matInput type="number" [(ngModel)]="model.sortOrder" name="s" /></mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="saving() || f.invalid">{{ saving() ? 'Saving…' : 'Save' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 480px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } mat-form-field { width: 100%; }`],
})
export class CompetencyDialogComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  saving = signal(false);
  model: { name: string; description: string; weight: number; isActive: boolean; sortOrder: number };
  constructor(
    public ref: MatDialogRef<CompetencyDialogComponent, CompetencyRequirement | null>,
    @Inject(MAT_DIALOG_DATA) public data: { entity: CompetencyRequirement | null; cycleId: number },
  ) {
    const e = data.entity;
    this.model = { name: e?.name ?? '', description: e?.description ?? '', weight: e?.weight ?? 0, isActive: e?.isActive ?? true, sortOrder: e?.sortOrder ?? 0 };
  }
  save() {
    this.saving.set(true);
    const payload = { ...this.model, weight: Number(this.model.weight), sortOrder: Number(this.model.sortOrder) || 0, cycleId: this.data.cycleId };
    const id = this.data.entity?.id;
    const obs = id ? this.api.patch<CompetencyRequirement>(`/competency-requirements/${id}`, payload) : this.api.post<CompetencyRequirement>('/competency-requirements', payload);
    obs.pipe(
      tap((r) => { this.toast.success('Saved'); this.ref.close(r); }),
      catchError((e) => { this.toast.error('Save failed', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }
}

@Component({
  selector: 'app-competency-requirements',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PageHeaderComponent, StatusBadgeComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Competency Requirements" subtitle="Core competencies and their weighting for performance assessments." icon="psychology" tone="purple">
        <button mat-flat-button color="primary" (click)="open(null)" [disabled]="!activeCycle()"><mat-icon>add</mat-icon> Add Competency</button>
      </app-page-header>
      <app-loading-spinner *ngIf="loading()"></app-loading-spinner>
      <ng-container *ngIf="!loading()">
        <div class="weight-summary">
          <span [class.bad]="!isHundred(total())">Total Weight: {{ total().toFixed(1) }}%</span>
          <mat-icon *ngIf="!isHundred(total())" color="warn" inline>warning</mat-icon>
        </div>
        <div class="plat-card">
          <table class="plat-table">
            <thead><tr><th>Competency</th><th>Description</th><th>Weight</th><th>Status</th><th class="actions">Actions</th></tr></thead>
            <tbody>
              <tr *ngIf="rows().length === 0"><td colspan="5" class="empty">No competencies defined.</td></tr>
              <tr *ngFor="let r of rows()">
                <td><strong>{{ r.name }}</strong></td>
                <td class="muted truncate">{{ r.description || '—' }}</td>
                <td><div class="bar"><div class="bar__fill" [style.width.%]="clamp(r.weight)"></div></div><span class="pct">{{ r.weight }}%</span></td>
                <td><app-status-badge [status]="r.isActive ? 'Active' : 'Inactive'"></app-status-badge></td>
                <td class="actions"><button mat-button color="primary" (click)="open(r)"><mat-icon>edit</mat-icon> Edit</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </ng-container>
    </section>
  `,
  styles: [`
    .weight-summary { margin: 8px 0 16px; font-size: 13px; font-weight: 700; color: #16a34a; display:flex; align-items:center; gap:6px; }
    .weight-summary .bad, .weight-summary span.bad { color: #ef4444; }
    .bar { display: inline-block; width: 84px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; vertical-align: middle; margin-right: 10px; }
    .bar__fill { height: 100%; background: #8b5cf6; }
    .pct { font-weight: 600; color: #475569; vertical-align: middle; }
    .truncate { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  `],
})
export class CompetencyRequirementsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  cycles = signal<Cycle[]>([]);
  rows = signal<CompetencyRequirement[]>([]);
  loading = signal(true);
  activeCycle = computed<Cycle | null>(() => this.cycles().find((c) => c.status === 'Open') ?? this.cycles()[0] ?? null);
  total = computed(() => this.rows().reduce((s, r) => s + Number(r.weight), 0));

  ngOnInit() { this.load(); }
  isHundred(t: number) { return Math.abs(t - 100) < 0.01; }
  clamp(v: number) { return Math.max(0, Math.min(100, Number(v) || 0)); }

  load() {
    this.loading.set(true);
    this.api.get<Cycle[]>('/cycles').pipe(
      catchError(() => of([] as Cycle[])),
      tap((cs) => this.cycles.set(Array.isArray(cs) ? cs : [])),
    ).subscribe(() => {
      const cycle = this.activeCycle();
      if (!cycle) { this.rows.set([]); this.loading.set(false); return; }
      this.api.get<CompetencyRequirement[]>('/competency-requirements', { cycleId: cycle.id }).pipe(
        catchError(() => of([] as CompetencyRequirement[])),
        tap((r) => this.rows.set(Array.isArray(r) ? r : [])),
        finalize(() => this.loading.set(false)),
      ).subscribe();
    });
  }
  open(entity: CompetencyRequirement | null) {
    const cycle = this.activeCycle();
    if (!cycle) return;
    this.dialog.open(CompetencyDialogComponent, { data: { entity, cycleId: cycle.id }, panelClass: 'plat-dialog', autoFocus: false })
      .afterClosed().subscribe((r) => { if (r) this.load(); });
  }
}
