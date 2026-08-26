import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(MatDialog);

  async confirm(data: ConfirmDialogData): Promise<boolean> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data,
      width: '420px',
      panelClass: 'plat-dialog',
    });
    const result = await firstValueFrom(ref.afterClosed());
    return !!result;
  }

  /**
   * Confirm with a textarea. Resolves to the entered text on confirm,
   * or `null` when the user cancels.
   */
  async prompt(data: ConfirmDialogData): Promise<string | null> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { inputRequired: true, ...data },
      width: '460px',
      panelClass: 'plat-dialog',
    });
    const result = await firstValueFrom(ref.afterClosed());
    return typeof result === 'string' ? result : null;
  }
}
