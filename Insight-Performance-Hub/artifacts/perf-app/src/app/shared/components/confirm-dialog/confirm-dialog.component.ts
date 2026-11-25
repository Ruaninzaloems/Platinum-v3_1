import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** When set, shows a textarea below the message and returns its value. */
  inputLabel?: string;
  inputPlaceholder?: string;
  /** Require a non-empty input before confirming (only used with inputLabel). */
  inputRequired?: boolean;
}

/** Result: `false`/`undefined` = cancelled. Without input: `true`. With input: the entered string. */
export type ConfirmDialogResult = boolean | string | undefined;

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p class="cd-message">{{ data.message }}</p>
      @if (data.inputLabel) {
        <label class="cd-input-label">
          {{ data.inputLabel }}@if (data.inputRequired) {<span class="cd-req"> *</span>}
        </label>
        <textarea
          class="cd-textarea"
          rows="3"
          [placeholder]="data.inputPlaceholder || ''"
          [ngModel]="inputValue()"
          (ngModelChange)="inputValue.set($event)"
        ></textarea>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ data.cancelLabel || 'Cancel' }}</button>
      <button mat-flat-button [color]="data.destructive ? 'warn' : 'primary'"
              [disabled]="confirmDisabled()" (click)="confirm()">
        {{ data.confirmLabel || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .cd-message { margin: 0 0 12px; white-space: pre-line; }
    .cd-input-label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #334155; }
    .cd-req { color: #dc2626; }
    .cd-textarea {
      width: 100%; box-sizing: border-box; resize: vertical;
      border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px;
      font: inherit; font-size: 14px; color: #0f172a; background: #fff;
    }
    .cd-textarea:focus { outline: 2px solid #2563eb33; border-color: #2563eb; }
  `],
})
export class ConfirmDialogComponent {
  readonly inputValue = signal('');

  constructor(
    public ref: MatDialogRef<ConfirmDialogComponent, ConfirmDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
  ) {}

  confirmDisabled(): boolean {
    return !!data_input_required(this.data) && !this.inputValue().trim();
  }

  confirm() {
    if (this.data.inputLabel) {
      this.ref.close(this.inputValue().trim());
    } else {
      this.ref.close(true);
    }
  }
}

function data_input_required(d: ConfirmDialogData): boolean {
  return !!(d.inputLabel && d.inputRequired);
}
