import { Injectable } from '@angular/core';
import { BehaviorSubject, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Notification } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$ = this.notifications$.pipe();

  constructor(private api: ApiService) {}

  loadNotifications(): void {
    this.api.get<Notification[]>('/notifications', { limit: 20 }).subscribe({
      next: (data) => this.notificationsSubject.next(data || []),
      error: () => {}
    });
  }

  markAsRead(id: number): void {
    this.api.put(`/notifications/${id}/read`, {}).subscribe(() => this.loadNotifications());
  }

  markAllRead(): void {
    this.api.put('/notifications/read-all', {}).subscribe(() => this.loadNotifications());
  }

  startPolling(): void {
    interval(60000).pipe(
      switchMap(() => this.api.get<Notification[]>('/notifications', { limit: 20 }))
    ).subscribe({
      next: (data) => this.notificationsSubject.next(data || []),
      error: () => {}
    });
  }
}
