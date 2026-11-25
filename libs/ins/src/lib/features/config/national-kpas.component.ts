import { ChangeDetectionStrategy, Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { forkJoin, Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, finalize, of, tap } from 'rxjs';
import { ApiService } from '@ins-core/services/api.service';
import { ToastService } from '@ins-core/services/toast.service';
import { NationalKpa } from '@ins-core/models/domain.model';
import { PageHeaderComponent } from '@ins-shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@ins-shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-national-kpa-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.entity ? 'Edit' : 'Create' }} National KPA</h2>
    <form (ngSubmit)="save()" #f="ngForm">
      <mat-dialog-content class="content">
        <mat-form-field appearance="outline"><mat-label>Code</mat-label><input matInput [(ngModel)]="model.code" name="code" required /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="model.name" name="name" required /></mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="saving() || f.invalid">{{ saving() ? 'Saving…' : 'Save' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 460px; } mat-form-field { width: 100%; }`],
})
export class NationalKpaDialogComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  saving = signal(false);
  model: { code: string; name: string };
  constructor(public ref: MatDialogRef<NationalKpaDialogComponent, NationalKpa | null>, @Inject(MAT_DIALOG_DATA) public data: { entity: NationalKpa | null }) {
    this.model = {
      code: data.entity?.code ?? '',
      name: data.entity?.name ?? '',
    };
  }
  save() {
    this.saving.set(true);
    const id = this.data.entity?.id;
    const obs = id ? this.api.patch<NationalKpa>(`/national-kpas/${id}`, this.model) : this.api.post<NationalKpa>(`/national-kpas`, this.model);
    obs.pipe(
      tap((r) => { this.toast.success('Saved'); this.ref.close(r); }),
      catchError((e) => { this.toast.error('Save failed', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }
}

@Component({
  selector: 'app-national-kpas',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, DragDropModule, PageHeaderComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="National Key Performance Areas" subtitle="Capture the national KPAs used across organisational and departmental scorecards." icon="flag" tone="indigo">
        <button mat-flat-button color="primary" (click)="open(null)"><mat-icon>add</mat-icon> Add NKPA</button>
      </app-page-header>
      <div class="plat-card">
        <app-loading-spinner *ngIf="loading()"></app-loading-spinner>
        <table *ngIf="!loading()" class="plat-table">
          <thead><tr><th class="drag-col"></th><th>Code</th><th>Name</th><th class="actions">Actions</th></tr></thead>
          <tbody cdkDropList (cdkDropListDropped)="drop($event)">
            <tr *ngIf="rows().length === 0"><td colspan="4" class="empty">No national KPAs captured yet.</td></tr>
            <tr *ngFor="let r of rows()" cdkDrag cdkDragLockAxis="y" [cdkDragDisabled]="reordering()">
              <td class="drag-col"><mat-icon class="drag-handle" cdkDragHandle>drag_indicator</mat-icon></td>
              <td class="mono">{{ r.code }}</td>
              <td><strong>{{ r.name }}</strong></td>
              <td class="actions">
                <button mat-button color="primary" (click)="open(r)"><mat-icon>edit</mat-icon> Edit</button>
                <button mat-button color="warn" (click)="remove(r)"><mat-icon>delete</mat-icon> Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .plat-page { max-width: 1000px; gap: 14px; }
    .plat-table { font-size: 13px; }
    .plat-table th { padding: 9px 16px; }
    .plat-table td { padding: 8px 16px; }
    .plat-table .empty { padding: 20px; }
    .drag-col { width: 36px; padding-right: 0 !important; }
    .drag-handle { cursor: grab; color: #94a3b8; font-size: 20px; width: 20px; height: 20px; vertical-align: middle; }
    tr.cdk-drag-preview { display: table; background: #fff; box-shadow: 0 6px 18px rgba(15, 23, 42, .18); border-radius: 8px; }
    tr.cdk-drag-placeholder { opacity: .35; }
    .cdk-drop-list-dragging tr.cdk-drag:not(.cdk-drag-placeholder) { transition: transform 200ms ease; }
    :host ::ng-deep app-page-header .page-header { padding: 12px 16px; border-radius: 12px; }
    :host ::ng-deep app-page-header .page-header__icon { width: 36px; height: 36px; }
    :host ::ng-deep app-page-header .page-header__icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    :host ::ng-deep app-page-header h1 { font-size: 17px; }
    :host ::ng-deep app-page-header p { font-size: 13px; margin-top: 2px; }
  `],
})
export class NationalKpasComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  loading = signal(true); rows = signal<NationalKpa[]>([]); reordering = signal(false);
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.api.get<NationalKpa[]>('/national-kpas').pipe(
      tap((d) => this.rows.set(Array.isArray(d) ? d : [])),
      catchError(() => { this.rows.set([]); return of(null); }),
      finalize(() => this.loading.set(false)),
    ).subscribe();
  }
  open(entity: NationalKpa | null) {
    this.dialog.open(NationalKpaDialogComponent, { data: { entity }, panelClass: 'plat-dialog', autoFocus: false })
      .afterClosed().subscribe((r) => { if (r) this.load(); });
  }
  drop(event: CdkDragDrop<NationalKpa[]>) {
    if (event.previousIndex === event.currentIndex) return;
    const previous = this.rows();
    const updated = [...previous];
    moveItemInArray(updated, event.previousIndex, event.currentIndex);
    this.rows.set(updated);
    this.reordering.set(true);
    const patches: Observable<NationalKpa>[] = updated
      .map((r, i) => ({ r, i }))
      .filter(({ r, i }) => r.sortOrder !== i)
      .map(({ r, i }) => this.api.patch<NationalKpa>(`/national-kpas/${r.id}`, { sortOrder: i }));
    forkJoin(patches).pipe(
      tap(() => this.toast.success('Order updated')),
      catchError((e) => {
        this.rows.set(previous);
        this.toast.error('Reorder failed', e?.error?.message ?? e?.message);
        return of(null);
      }),
      finalize(() => { this.reordering.set(false); this.load(); }),
    ).subscribe();
  }
  remove(entity: NationalKpa) {
    if (!confirm(`Delete "${entity.name}"? This cannot be undone.`)) return;
    this.api.delete<void>(`/national-kpas/${entity.id}`).pipe(
      tap(() => { this.toast.success('Deleted'); this.load(); }),
      catchError((e) => { this.toast.error('Delete failed', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }
}
