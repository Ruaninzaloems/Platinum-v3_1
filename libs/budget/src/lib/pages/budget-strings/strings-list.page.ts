import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/services/api.service';
import { FinancialYear } from '../../core/models/budget.models';

const STRING_TYPE_MAP: Record<string, { label: string; type: string }> = {
  'tabled-budget':      { label: 'Tabled Budget',          type: 'PRTA_TABLED' },
  'original-budget':    { label: 'Original Budget',         type: 'PROR_ORIGINAL' },
  'tabled-idp':         { label: 'Tabled IDP (PRTA)',       type: 'PRTA_IDP' },
  'original-idp':       { label: 'Original IDP (PROR)',     type: 'PROR_IDP' },
  'adjustment-budget':  { label: 'Adjustment Budget',       type: 'PRAD_BUDGET' },
  'adjustment-idp':     { label: 'Adjustment IDP (PRAD)',   type: 'PRAD_IDP' },
  'virement':           { label: 'Virement',                type: 'VIREMENT' },
};

@Component({
  selector: 'app-strings-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule],
  template: `
    <div class="page-container">

      <div class="page-header">
        <h1>National Treasury - NT SCOA String ({{ typeLabel }})</h1>
      </div>

      <hr class="divider" />

      <div class="scoa-form">
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Financial Year</mat-label>
          <mat-select [(ngModel)]="selectedFyId">
            <mat-option *ngFor="let fy of financialYears" [value]="fy.id">{{ fy.yearCode }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <hr class="divider" />

      <div class="scoa-actions">
        <button class="btn-export" (click)="exportText()" [disabled]="exporting || !selectedFyId">
          <span *ngIf="exporting === 'text'" class="spinner"></span>
          Export Text
        </button>
        <button class="btn-export" (click)="exportCsv()" [disabled]="exporting || !selectedFyId">
          <span *ngIf="exporting === 'csv'" class="spinner"></span>
          Export CSV
        </button>
        <button class="btn-export" (click)="exportExcel()" [disabled]="exporting || !selectedFyId">
          <span *ngIf="exporting === 'excel'" class="spinner"></span>
          Export Excel
        </button>
        <button class="btn-cancel" (click)="cancel()">Cancel</button>
      </div>

    </div>
  `,
  styles: [`
    $navy: #0f2b46;

    .page-container { padding: 24px; }

    .page-header {
      margin-bottom: 24px;
      h1 { font-size: 24px; font-weight: 600; color: $navy; margin: 0; }
    }

    .divider {
      border: none;
      border-top: 1px solid #e8ecf1;
      margin: 0 0 24px;
    }

    .scoa-form {
      margin-bottom: 28px;
      max-width: 320px;
    }

    mat-form-field {
      width: 100%;
    }

    .scoa-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
    }

    .btn-export {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      background: #0f2b46;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s, opacity 0.2s;

      &:hover:not(:disabled) {
        background: #1a3a5c;
      }

      &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
    }

    .btn-cancel {
      display: inline-flex;
      align-items: center;
      padding: 8px 18px;
      background: #475569;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #334155;
      }
    }

    .spinner {
      width: 12px;
      height: 12px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class StringsListPage implements OnInit {
  financialYears: FinancialYear[] = [];
  selectedFyId: number | null = null;
  exporting: string | null = null;
  typeLabel = '';
  stringType = '';

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const segments = this.router.url.split('/');
    const slug = segments[segments.length - 1].split('?')[0];
    const config = STRING_TYPE_MAP[slug] ?? { label: slug, type: slug.toUpperCase() };
    this.typeLabel = config.label;
    this.stringType = config.type;

    this.api.getFinancialYears().subscribe({
      next: fys => {
        this.financialYears = fys;
        const active = fys.find(f => f.isActive);
        if (active) this.selectedFyId = active.id;
        this.cdr.detectChanges();
      }
    });
  }

  exportText() {
    this.runExport('text', 'txt');
  }

  exportCsv() {
    this.runExport('csv', 'csv');
  }

  exportExcel() {
    this.runExport('excel', 'xlsx');
  }

  private runExport(format: string, ext: string) {
    if (!this.selectedFyId) return;
    this.exporting = format;
    this.cdr.markForCheck();
    this.api.getMscoaStrings(this.selectedFyId, this.stringType, format).subscribe({
      next: (blob: Blob) => {
        const fy = this.financialYears.find(f => f.id === this.selectedFyId);
        const fyCode = fy?.yearCode?.replace('/', '-') ?? this.selectedFyId;
        const filename = `SCOA_${this.stringType}_${fyCode}.${ext}`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        this.exporting = null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.exporting = null;
        this.cdr.markForCheck();
      }
    });
  }

  cancel() {
    this.router.navigate(['/dashboard']);
  }
}
