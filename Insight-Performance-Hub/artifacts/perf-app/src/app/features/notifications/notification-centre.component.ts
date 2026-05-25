import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { catchError, finalize, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { AppNotification } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-notification-centre',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Notification Centre" subtitle="Recent alerts and reminders" icon="notifications" tone="purple"></app-page-header>
      <div class="plat-card">
        <app-loading-spinner *ngIf="loading()"></app-loading-spinner>
        <ng-container *ngIf="!loading()">
          <app-empty-state *ngIf="items().length === 0" icon="notifications" title="All caught up!" message="You have no notifications."></app-empty-state>
          <div class="list" *ngIf="items().length > 0">
            <div *ngFor="let n of items()" class="row" [class.row--read]="n.isRead">
              <div class="ico" [class]="'ico--' + n.type">
                <mat-icon>{{ iconFor(n.type) }}</mat-icon>
              </div>
              <div class="body">
                <div class="head">
                  <h4 [class.read]="n.isRead">{{ n.title }}</h4>
                  <span class="time">{{ relTime(n.createdAt) }}</span>
                </div>
                <p>{{ n.message }}</p>
                <button *ngIf="!n.isRead" mat-button color="primary" (click)="markRead(n)">Mark as read</button>
              </div>
            </div>
          </div>
        </ng-container>
      </div>
    </section>
  `,
  styles: [`
    .list { display: flex; flex-direction: column; }
    .row { display: flex; gap: 14px; padding: 18px 22px; border-bottom: 1px solid #f1f5f9; background: #eff6ff14; }
    .row--read { background: #fff; opacity: .7; }
    .row:last-child { border-bottom: 0; }
    .ico { width: 40px; height: 40px; border-radius: 50%; background: #fff; border: 1px solid #e2e8f0; display: grid; place-items: center; flex-shrink: 0; }
    .row--read .ico { background: #f1f5f9; border-color: transparent; }
    .ico--reminder mat-icon { color: #2563eb; }
    .ico--escalation mat-icon { color: #dc2626; }
    .ico--warning mat-icon { color: #ea580c; }
    .ico--success mat-icon { color: #16a34a; }
    .ico--info mat-icon { color: #475569; }
    .body { flex: 1; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    h4 { margin: 0; font-size: 14px; font-weight: 700; color: #0f172a; }
    h4.read { color: #475569; }
    .time { font-size: 12px; color: #94a3b8; white-space: nowrap; }
    p { margin: 4px 0 6px; color: #475569; font-size: 13px; line-height: 1.5; }
  `],
})
export class NotificationCentreComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  loading = signal(true);
  items = signal<AppNotification[]>([]);

  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.api.get<AppNotification[] | { data: AppNotification[] }>('/notifications').pipe(
      tap((res) => { const list = Array.isArray(res) ? res : (res?.data ?? []); this.items.set(list); }),
      catchError(() => { this.items.set([]); return of(null); }),
      finalize(() => this.loading.set(false)),
    ).subscribe();
  }
  markRead(n: AppNotification) {
    this.api.post(`/notifications/${n.id}/read`, {}).pipe(
      tap(() => this.load()),
      catchError((e) => { this.toast.error('Could not mark as read', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }
  iconFor(type: string): string {
    switch (type) {
      case 'reminder': return 'schedule';
      case 'escalation': return 'priority_high';
      case 'warning': return 'warning';
      case 'success': return 'check_circle';
      default: return 'info';
    }
  }
  relTime(iso: string): string {
    const t = new Date(iso).getTime();
    const diff = Math.max(0, Date.now() - t);
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
  }
}
