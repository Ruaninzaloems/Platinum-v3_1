import { Injectable, inject, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AppNotification } from '@core/models/domain.model';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly api = inject(ApiService);
  readonly unreadCount = signal(0);

  refresh() {
    this.api.get<AppNotification[] | { data: AppNotification[] }>('/notifications').pipe(
      tap((res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        this.unreadCount.set(list.filter((n) => !n.isRead).length);
      }),
      catchError(() => of(null)),
    ).subscribe();
  }
}
