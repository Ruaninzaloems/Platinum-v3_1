import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export interface ModalConfig {
  title: string;
  component?: any;
  data?: any;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ConfirmConfig {
  title: string;
  message: string;
  danger?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UiService {
  private toastIdCounter = 0;
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  private confirmSubject = new Subject<{ config: ConfirmConfig; resolve: (value: boolean) => void }>();
  confirm$ = this.confirmSubject.asObservable();

  private sidebarCollapsedSubject = new BehaviorSubject<boolean>(false);
  sidebarCollapsed$ = this.sidebarCollapsedSubject.asObservable();

  toast(type: ToastMessage['type'], title: string, message: string): void {
    const id = ++this.toastIdCounter;
    const toast: ToastMessage = { id, type, title, message };
    const current = this.toastsSubject.value;
    this.toastsSubject.next([...current, toast]);
    setTimeout(() => this.dismissToast(id), 4000);
  }

  dismissToast(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }

  confirm(config: ConfirmConfig): Promise<boolean> {
    return new Promise(resolve => {
      this.confirmSubject.next({ config, resolve });
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsedSubject.next(!this.sidebarCollapsedSubject.value);
  }
}
