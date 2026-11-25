import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as XLSX from 'xlsx';

export interface ValidationErrorRow {
  row: number;
  errors: string[];
}

@Component({
  selector: 'app-bulk-validation-errors-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title style="display:flex;align-items:center;gap:8px;color:#991b1b;">
      <mat-icon>error</mat-icon>
      Validation Failed — {{ data.errorCount }} error(s) across {{ data.validationErrors.length }} row(s)
    </h2>
    <mat-dialog-content style="min-width:640px;max-height:60vh;overflow:auto;padding:0 24px 8px;">
      <table class="err-table">
        <thead>
          <tr>
            <th style="width:70px;">Row</th>
            <th>Error(s)</th>
          </tr>
        </thead>
        <tbody>
          @for (ve of data.validationErrors; track ve.row) {
            <tr>
              <td>{{ ve.row === 0 ? 'General' : ve.row }}</td>
              <td>
                @for (e of ve.errors; track e) {
                  <div>{{ e }}</div>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </mat-dialog-content>
    <mat-dialog-actions align="end" style="padding:12px 24px 16px;">
      <button mat-stroked-button (click)="exportToExcel()" style="margin-right:8px;">
        <mat-icon>download</mat-icon> Export to Excel
      </button>
      <button mat-flat-button color="primary" (click)="close()">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .err-table { width:100%; border-collapse:collapse; font-size:13px; }
    .err-table th { background:#f8fafc; padding:8px 12px; text-align:left; font-weight:600; color:#334155; border-bottom:2px solid #e2e8f0; position:sticky; top:0; z-index:1; }
    .err-table td { padding:8px 12px; border-bottom:1px solid #f1f5f9; color:#475569; vertical-align:top; }
    .err-table tr:hover td { background:#fef2f2; }
  `]
})
export class BulkValidationErrorsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<BulkValidationErrorsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { errorCount: number; validationErrors: ValidationErrorRow[] }
  ) {}

  close() {
    this.dialogRef.close();
  }

  exportToExcel() {
    const rows: { Row: number | string; Error: string }[] = [];
    for (const ve of this.data.validationErrors) {
      for (const e of ve.errors) {
        rows.push({ Row: ve.row === 0 ? 'General' : ve.row, Error: e });
      }
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 8 }, { wch: 120 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Validation Errors');
    XLSX.writeFile(wb, 'bulk-validation-errors.xlsx');
  }
}
