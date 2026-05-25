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
import { Moderation, ModerationOutcome } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-moderation-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Record Moderation Outcome</h2>
    <form (ngSubmit)="save()" #f="ngForm">
      <mat-dialog-content class="content">
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Actual ID</mat-label><input matInput type="number" [(ngModel)]="model.actualId" name="a" required /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>KPI ID</mat-label><input matInput type="number" [(ngModel)]="model.kpiId" name="k" required /></mat-form-field>
        </div>
        <div class="grid">
          <mat-form-field appearance="outline">
            <mat-label>Quarter</mat-label>
            <mat-select [(ngModel)]="model.quarter" name="q">
              <mat-option *ngFor="let q of [1,2,3,4]" [value]="q">Q{{ q }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Outcome</mat-label>
            <mat-select [(ngModel)]="model.outcome" name="o">
              <mat-option value="Confirmed">Confirmed</mat-option>
              <mat-option value="Adjusted">Adjusted</mat-option>
              <mat-option value="Rejected">Rejected</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <ng-container *ngIf="model.outcome === 'Adjusted'">
          <mat-form-field appearance="outline"><mat-label>Score Adjustment Reason</mat-label><textarea matInput rows="2" [(ngModel)]="model.scoreAdjustmentReason" name="sa"></textarea></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Adjusted Score</mat-label><input matInput type="number" step="0.1" [(ngModel)]="model.adjustedScore" name="as" /></mat-form-field>
        </ng-container>
        <mat-form-field appearance="outline"><mat-label>Notes</mat-label><textarea matInput rows="2" [(ngModel)]="model.notes" name="n"></textarea></mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="saving() || f.invalid">{{ saving() ? 'Saving…' : 'Submit' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 480px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } mat-form-field { width: 100%; }`],
})
export class ModerationDialogComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  saving = signal(false);
  model: { actualId: number; kpiId: number; quarter: number; outcome: ModerationOutcome; scoreAdjustmentReason: string; adjustedScore: number | null; notes: string };
  constructor(public ref: MatDialogRef<ModerationDialogComponent, Moderation | null>, @Inject(MAT_DIALOG_DATA) public data: { quarter: number }) {
    this.model = { actualId: 0, kpiId: 0, quarter: data.quarter, outcome: 'Confirmed', scoreAdjustmentReason: '', adjustedScore: null, notes: '' };
  }
  save() {
    this.saving.set(true);
    const payload: Record<string, unknown> = {
      actualId: Number(this.model.actualId),
      kpiId: Number(this.model.kpiId),
      quarter: this.model.quarter,
      outcome: this.model.outcome,
    };
    if (this.model.outcome === 'Adjusted') {
      if (this.model.scoreAdjustmentReason) payload['scoreAdjustmentReason'] = this.model.scoreAdjustmentReason;
      if (this.model.adjustedScore !== null && this.model.adjustedScore !== undefined) payload['adjustedScore'] = Number(this.model.adjustedScore);
    }
    if (this.model.notes) payload['notes'] = this.model.notes;
    this.api.post<Moderation>('/moderation', payload).pipe(
      tap((r) => { this.toast.success('Moderation recorded'); this.ref.close(r); }),
      catchError((e) => { this.toast.error('Submit failed', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }
}

@Component({
  selector: 'app-moderation-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Moderation Panel" subtitle="Record moderation outcomes and score adjustments." icon="balance" tone="orange">
        <mat-form-field appearance="outline" class="qpick">
          <mat-label>Quarter</mat-label>
          <mat-select [ngModel]="quarter()" (ngModelChange)="onQuarter($event)">
            <mat-option *ngFor="let q of [1,2,3,4]" [value]="q">Q{{ q }}</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="open()"><mat-icon>balance</mat-icon> New Moderation</button>
      </app-page-header>

      <div *ngIf="!rows().length" class="empty">No moderation outcomes for this quarter.</div>
      <div class="list">
        <div class="plat-card row" *ngFor="let m of rows()">
          <div>
            <div class="head">
              <mat-icon>balance</mat-icon>
              <strong>KPI #{{ m.kpiId }} — Actual #{{ m.actualId }}</strong>
              <span class="badge" [class]="'b-' + (m.outcome || '').toLowerCase()">{{ m.outcome }}</span>
            </div>
            <p class="amber" *ngIf="m.scoreAdjustmentReason">Adjustment: {{ m.scoreAdjustmentReason }}</p>
            <p class="muted" *ngIf="m.adjustedScore != null">Adjusted Score: {{ m.adjustedScore }}</p>
            <p class="muted" *ngIf="m.notes">{{ m.notes }}</p>
          </div>
          <span class="muted small">{{ m.createdAt ? (m.createdAt | date:'mediumDate') : '' }}</span>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .qpick { width: 120px; margin-right: 8px; }
    .empty { padding: 48px; text-align: center; color: #94a3b8; }
    .list { display: flex; flex-direction: column; gap: 12px; }
    .row { padding: 14px 18px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .head { display: flex; align-items: center; gap: 8px; }
    .head mat-icon { font-size: 18px; width: 18px; height: 18px; color: #94a3b8; }
    .amber { color:#b45309; font-size: 13px; margin: 4px 0 0; }
    .small { font-size: 11px; }
    .badge { padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .b-confirmed { background:#dcfce7; color:#15803d; }
    .b-adjusted { background:#fef3c7; color:#a16207; }
    .b-rejected { background:#fee2e2; color:#b91c1c; }
  `],
})
export class ModerationPanelComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  quarter = signal(1);
  rows = signal<Moderation[]>([]);

  ngOnInit() { this.load(); }
  onQuarter(q: number) { this.quarter.set(q); this.load(); }
  load() {
    this.api.get<Moderation[]>('/moderation', { quarter: this.quarter() })
      .pipe(catchError(() => of([] as Moderation[])))
      .subscribe((r) => this.rows.set(Array.isArray(r) ? r : []));
  }
  open() {
    this.dialog.open(ModerationDialogComponent, { data: { quarter: this.quarter() }, panelClass: 'plat-dialog', autoFocus: false })
      .afterClosed().subscribe((r) => { if (r) this.load(); });
  }
}
