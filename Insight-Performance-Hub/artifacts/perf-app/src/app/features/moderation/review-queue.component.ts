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
import { Review, ReviewAction } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-review-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Submit Review</h2>
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
            <mat-label>Action</mat-label>
            <mat-select [(ngModel)]="model.action" name="ac">
              <mat-option value="approve">Approve</mat-option>
              <mat-option value="return">Return</mat-option>
              <mat-option value="comment">Comment</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline"><mat-label>Comments</mat-label><textarea matInput rows="2" [(ngModel)]="model.comments" name="c"></textarea></mat-form-field>
        <mat-form-field appearance="outline" *ngIf="model.action === 'return'">
          <mat-label>Return Reason (Required)</mat-label>
          <textarea matInput rows="2" [(ngModel)]="model.returnReason" name="r" required></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Assessment Rating</mat-label><input matInput type="number" step="0.1" [(ngModel)]="model.assessmentRating" name="ar" /></mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="saving() || f.invalid">{{ saving() ? 'Saving…' : 'Submit Review' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 480px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } mat-form-field { width: 100%; }`],
})
export class ReviewDialogComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  saving = signal(false);
  model: { actualId: number; kpiId: number; quarter: number; action: ReviewAction; comments: string; returnReason: string; assessmentRating: number | null };
  constructor(public ref: MatDialogRef<ReviewDialogComponent, Review | null>, @Inject(MAT_DIALOG_DATA) public data: { quarter: number }) {
    this.model = { actualId: 0, kpiId: 0, quarter: data.quarter, action: 'approve', comments: '', returnReason: '', assessmentRating: null };
  }
  save() {
    if (this.model.action === 'return' && !this.model.returnReason) {
      this.toast.error('Return reason is mandatory');
      return;
    }
    this.saving.set(true);
    const payload: Record<string, unknown> = {
      actualId: Number(this.model.actualId),
      kpiId: Number(this.model.kpiId),
      quarter: this.model.quarter,
      action: this.model.action,
    };
    if (this.model.comments) payload['comments'] = this.model.comments;
    if (this.model.returnReason) payload['returnReason'] = this.model.returnReason;
    if (this.model.assessmentRating !== null && this.model.assessmentRating !== undefined) payload['assessmentRating'] = Number(this.model.assessmentRating);
    this.api.post<Review>('/reviews', payload).pipe(
      tap((r) => { this.toast.success('Review submitted'); this.ref.close(r); }),
      catchError((e) => { this.toast.error('Submit failed', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }
}

@Component({
  selector: 'app-review-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Review Queue" subtitle="Review and assess KPI submissions." icon="rule" tone="indigo">
        <mat-form-field appearance="outline" class="qpick">
          <mat-label>Quarter</mat-label>
          <mat-select [ngModel]="quarter()" (ngModelChange)="onQuarter($event)">
            <mat-option *ngFor="let q of [1,2,3,4]" [value]="q">Q{{ q }}</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="open()"><mat-icon>add</mat-icon> New Review</button>
      </app-page-header>

      <div *ngIf="!rows().length" class="empty">No reviews for this quarter yet.</div>
      <div class="list">
        <div class="plat-card row" *ngFor="let r of rows()">
          <div>
            <div class="head">
              <mat-icon *ngIf="r.action === 'approve'" class="green">check_circle</mat-icon>
              <mat-icon *ngIf="r.action === 'return'" class="red">undo</mat-icon>
              <mat-icon *ngIf="r.action === 'comment'" class="blue">comment</mat-icon>
              <strong>KPI #{{ r.kpiId }} — Actual #{{ r.actualId }}</strong>
              <span class="badge" [class]="'a-' + r.action">{{ r.action }}</span>
            </div>
            <p class="muted" *ngIf="r.comments">{{ r.comments }}</p>
            <p class="red" *ngIf="r.returnReason">Return reason: {{ r.returnReason }}</p>
            <p class="small muted" *ngIf="r.assessmentRating != null">Rating: {{ r.assessmentRating }}</p>
          </div>
          <span class="muted small">{{ r.createdAt ? (r.createdAt | date:'mediumDate') : '' }}</span>
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
    .head mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .green { color: #16a34a; } .red { color: #dc2626; } .blue { color: #2563eb; }
    .badge { padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
    .a-approve { background:#dcfce7; color:#15803d; }
    .a-return { background:#fee2e2; color:#b91c1c; }
    .a-comment { background:#dbeafe; color:#1d4ed8; }
    .small { font-size: 11px; }
  `],
})
export class ReviewQueueComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  quarter = signal(1);
  rows = signal<Review[]>([]);

  ngOnInit() { this.load(); }
  onQuarter(q: number) { this.quarter.set(q); this.load(); }
  load() {
    this.api.get<Review[]>('/reviews', { quarter: this.quarter() })
      .pipe(catchError(() => of([] as Review[])))
      .subscribe((r) => this.rows.set(Array.isArray(r) ? r : []));
  }
  open() {
    this.dialog.open(ReviewDialogComponent, { data: { quarter: this.quarter() }, panelClass: 'plat-dialog', autoFocus: false })
      .afterClosed().subscribe((r) => { if (r) this.load(); });
  }
}
