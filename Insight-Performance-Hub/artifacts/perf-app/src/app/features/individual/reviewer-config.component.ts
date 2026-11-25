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
import { Cycle, ReviewerAssignment } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-reviewer-assign-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Assign Reviewer</h2>
    <form (ngSubmit)="save()" #f="ngForm">
      <mat-dialog-content class="content">
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Employee ID</mat-label><input matInput type="number" [(ngModel)]="model.employeeId" name="e" required /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Primary Reviewer ID</mat-label><input matInput type="number" [(ngModel)]="model.primaryReviewerId" name="p" required /></mat-form-field>
        </div>
        <mat-form-field appearance="outline"><mat-label>Secondary Reviewer ID (optional)</mat-label><input matInput type="number" [(ngModel)]="model.secondaryReviewerId" name="s" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Change Reason</mat-label><input matInput [(ngModel)]="model.changeReason" name="r" /></mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="saving() || f.invalid">{{ saving() ? 'Saving…' : 'Assign' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 480px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } mat-form-field { width: 100%; }`],
})
export class ReviewerAssignDialogComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  saving = signal(false);
  model = { employeeId: 0, primaryReviewerId: 0, secondaryReviewerId: 0, changeReason: '' };
  constructor(public ref: MatDialogRef<ReviewerAssignDialogComponent, ReviewerAssignment | null>, @Inject(MAT_DIALOG_DATA) public data: { cycleId: number }) {}
  save() {
    this.saving.set(true);
    const payload: Record<string, unknown> = {
      cycleId: this.data.cycleId,
      employeeId: Number(this.model.employeeId),
      primaryReviewerId: Number(this.model.primaryReviewerId),
    };
    if (this.model.secondaryReviewerId) payload['secondaryReviewerId'] = Number(this.model.secondaryReviewerId);
    if (this.model.changeReason) payload['changeReason'] = this.model.changeReason;
    this.api.post<ReviewerAssignment>('/reviewer-assignments', payload).pipe(
      tap((r) => { this.toast.success('Reviewer assigned'); this.ref.close(r); }),
      catchError((e) => { this.toast.error('Assign failed', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }
}

@Component({
  selector: 'app-reviewer-config',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Reviewer Assignments" subtitle="Assign primary and secondary reviewers to employees." icon="how_to_reg" tone="indigo">
        <mat-form-field appearance="outline" class="cycle-pick">
          <mat-label>Cycle</mat-label>
          <mat-select [ngModel]="cycleId()" (ngModelChange)="onCycle($event)">
            <mat-option [value]="null">All Cycles</mat-option>
            <mat-option *ngFor="let c of cycles()" [value]="c.id">{{ c.financialYearLabel }}</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="open()" [disabled]="!cycleId()"><mat-icon>add</mat-icon> Assign Reviewer</button>
      </app-page-header>

      <div class="plat-card">
        <h3 class="title"><mat-icon>verified_user</mat-icon> Active Assignments</h3>
        <table class="plat-table">
          <thead><tr><th>Employee</th><th>Primary Reviewer</th><th>Secondary Reviewer</th><th class="num">Version</th></tr></thead>
          <tbody>
            <tr *ngIf="!active().length"><td colspan="4" class="empty">No active assignments.</td></tr>
            <tr *ngFor="let a of active()">
              <td>Employee #{{ a.employeeId }}</td>
              <td>User #{{ a.primaryReviewerId }}</td>
              <td>{{ a.secondaryReviewerId ? 'User #' + a.secondaryReviewerId : '—' }}</td>
              <td class="num"><span class="chip">v{{ a.version }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="plat-card" *ngIf="historic().length">
        <h3 class="title"><mat-icon>history</mat-icon> Historical Assignments</h3>
        <table class="plat-table">
          <thead><tr><th>Employee</th><th>Primary Reviewer</th><th>Reason</th><th class="num">Version</th></tr></thead>
          <tbody>
            <tr class="muted" *ngFor="let a of historic()">
              <td>Employee #{{ a.employeeId }}</td>
              <td>User #{{ a.primaryReviewerId }}</td>
              <td>{{ a.changeReason || '—' }}</td>
              <td class="num">v{{ a.version }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .cycle-pick { width: 220px; margin-right: 8px; }
    .plat-card { padding: 16px; margin-bottom: 16px; }
    .title { display:flex; gap: 8px; align-items: center; margin: 0 0 12px; font-size: 15px; }
    .num { text-align: right; }
    .chip { display: inline-block; padding: 1px 8px; border: 1px solid var(--plat-border); border-radius: 999px; font-size: 11px; }
  `],
})
export class ReviewerConfigComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  cycles = signal<Cycle[]>([]);
  cycleId = signal<number | null>(null);
  rows = signal<ReviewerAssignment[]>([]);
  active = computed(() => this.rows().filter((a) => a.isActive));
  historic = computed(() => this.rows().filter((a) => !a.isActive));

  ngOnInit() {
    this.api.get<Cycle[]>('/cycles').pipe(catchError(() => of([] as Cycle[]))).subscribe((cs) => this.cycles.set(Array.isArray(cs) ? cs : []));
    this.load();
  }
  onCycle(id: number | null) { this.cycleId.set(id); this.load(); }
  load() {
    this.api.get<ReviewerAssignment[]>('/reviewer-assignments', { cycleId: this.cycleId() ?? undefined })
      .pipe(catchError(() => of([] as ReviewerAssignment[])))
      .subscribe((r) => this.rows.set(Array.isArray(r) ? r : []));
  }
  open() {
    const id = this.cycleId(); if (!id) return;
    this.dialog.open(ReviewerAssignDialogComponent, { data: { cycleId: id }, panelClass: 'plat-dialog', autoFocus: false })
      .afterClosed().subscribe((r) => { if (r) this.load(); });
  }
}
