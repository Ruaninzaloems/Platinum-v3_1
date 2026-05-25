import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { catchError, finalize, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { AuditLog, AuditLogResponse } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, MatIconModule, MatFormFieldModule, MatInputModule, PageHeaderComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="System Audit Trail" subtitle="Immutable log of all critical system actions." icon="gpp_maybe" tone="slate">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [ngModel]="search()" (ngModelChange)="search.set($event)" placeholder="Search logs..." />
        </mat-form-field>
      </app-page-header>
      <div class="plat-card">
        <app-loading-spinner *ngIf="loading()"></app-loading-spinner>
        <table *ngIf="!loading()" class="plat-table">
          <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>Changes</th></tr></thead>
          <tbody>
            <tr *ngIf="filtered().length === 0"><td colspan="5" class="empty">No audit logs found.</td></tr>
            <tr *ngFor="let l of filtered()">
              <td class="mono muted">{{ l.timestamp | date:'dd MMM yyyy HH:mm:ss' }}</td>
              <td><strong>{{ l.userName }}</strong></td>
              <td><span class="action-tag" [class]="'action-tag--' + actionClass(l.action)">{{ l.action }}</span></td>
              <td><strong>{{ l.entityType }}</strong> <span class="muted">#{{ l.entityId }}</span></td>
              <td>
                <ng-container *ngIf="l.oldValue && l.newValue; else noDiff">
                  <span class="diff diff--old">{{ l.oldValue }}</span>
                  <mat-icon class="arrow">arrow_forward</mat-icon>
                  <span class="diff diff--new">{{ l.newValue }}</span>
                </ng-container>
                <ng-template #noDiff><span class="muted">Raw data captured</span></ng-template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .search { width: 280px; }
    .action-tag { display: inline-flex; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
    .action-tag--create { background: #dcfce7; color: #166534; }
    .action-tag--update { background: #dbeafe; color: #1e40af; }
    .action-tag--delete { background: #fee2e2; color: #991b1b; }
    .action-tag--default { background: #f1f5f9; color: #475569; }
    .diff { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: middle; }
    .diff--old { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .diff--new { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .arrow { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; color: #94a3b8; margin: 0 6px; }
  `],
})
export class AuditTrailComponent implements OnInit {
  private readonly api = inject(ApiService);
  loading = signal(true);
  logs = signal<AuditLog[]>([]);
  search = signal('');

  ngOnInit() {
    this.api.get<AuditLogResponse | AuditLog[]>('/audit-logs').pipe(
      tap((res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        this.logs.set(list);
      }),
      catchError(() => { this.logs.set([]); return of(null); }),
      finalize(() => this.loading.set(false)),
    ).subscribe();
  }
  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.logs();
    return this.logs().filter((l) =>
      (l.userName || '').toLowerCase().includes(q) ||
      (l.entityType || '').toLowerCase().includes(q) ||
      (l.action || '').toLowerCase().includes(q),
    );
  });
  actionClass(a: string): string {
    const u = (a || '').toUpperCase();
    if (u === 'CREATE') return 'create';
    if (u === 'UPDATE') return 'update';
    if (u === 'DELETE') return 'delete';
    return 'default';
  }
}
