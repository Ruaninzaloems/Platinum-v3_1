import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export type ToastVariant = 'default' | 'success' | 'destructive';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snack = inject(MatSnackBar);

  show(title: string, opts: { description?: string; variant?: ToastVariant } = {}): void {
    const msg = opts.description ? `${title} — ${opts.description}` : title;
    const panelClass = ['plat-toast', `plat-toast--${opts.variant ?? 'default'}`];
    this.snack.open(msg, 'Dismiss', {
      duration: opts.variant === 'destructive' ? 6000 : 3500,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass,
    });
  }

  success(title: string, description?: string): void {
    this.show(title, { description, variant: 'success' });
  }

  error(title: string, description?: string): void {
    this.show(title, { description, variant: 'destructive' });
  }
}
