import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, finalize, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { Cycle, ReportRun, ReportType } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'quarterly', label: 'Quarterly Report' },
  { value: 'mid-year', label: 'Mid-Year Report' },
  { value: 'annual', label: 'Annual Report' },
  { value: 'institutional-evaluation', label: 'Institutional Evaluation' },
];

@Component({
  selector: 'app-report-generate-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Generate Report</h2>
    <form (ngSubmit)="save()" #f="ngForm">
      <mat-dialog-content class="content">
        <mat-form-field appearance="outline">
          <mat-label>Report Type</mat-label>
          <mat-select [(ngModel)]="model.reportType" name="t">
            <mat-option *ngFor="let t of types" [value]="t.value">{{ t.label }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Title</mat-label><input matInput [(ngModel)]="model.title" name="ti" required placeholder="e.g. Q1 2025/26 Performance Report" /></mat-form-field>
        <mat-form-field appearance="outline" *ngIf="model.reportType === 'quarterly'">
          <mat-label>Quarter</mat-label>
          <mat-select [(ngModel)]="model.quarter" name="q">
            <mat-option *ngFor="let q of [1,2,3,4]" [value]="q">Q{{ q }}</mat-option>
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="saving() || !model.title">{{ saving() ? 'Generating…' : 'Generate' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 460px; } mat-form-field { width: 100%; }`],
})
export class ReportGenerateDialogComponent {
  types = REPORT_TYPES;
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  saving = signal(false);
  model: { reportType: ReportType; title: string; quarter: number };
  constructor(public ref: MatDialogRef<ReportGenerateDialogComponent, ReportRun | null>, @Inject(MAT_DIALOG_DATA) public data: { cycleId: number }) {
    this.model = { reportType: 'quarterly', title: '', quarter: 1 };
  }
  save() {
    this.saving.set(true);
    const payload: Record<string, unknown> = { cycleId: this.data.cycleId, reportType: this.model.reportType, title: this.model.title };
    if (this.model.reportType === 'quarterly') payload['quarter'] = this.model.quarter;
    this.api.post<ReportRun>('/reports/generate', payload).pipe(
      tap((r) => { this.toast.success('Report generated'); this.ref.close(r); }),
      catchError((e) => { this.toast.error('Generation failed', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }
}

@Component({
  selector: 'app-report-centre',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Report Centre" subtitle="Generate and retrieve performance reports." icon="description" tone="orange">
        <mat-form-field appearance="outline" class="cycle-pick">
          <mat-label>Cycle</mat-label>
          <mat-select [ngModel]="cycleId()" (ngModelChange)="onCycle($event)">
            <mat-option *ngFor="let c of cycles()" [value]="c.id">{{ c.financialYearLabel }}</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="openGenerate()" [disabled]="!cycleId()"><mat-icon>add</mat-icon> Generate Report</button>
      </app-page-header>

      <div class="legend">
        <strong>Report colour coding</strong>
        <span><span class="sw met"></span> Target Met</span>
        <span><span class="sw partial"></span> Partially Met (70–99%)</span>
        <span><span class="sw missed"></span> Target Missed (&lt;70%)</span>
      </div>

      <div class="runs">
        <div *ngIf="!runs().length" class="empty">No reports generated yet. Select a cycle and generate your first report.</div>
        <div class="plat-card run" *ngFor="let r of runs()">
          <div class="run__main">
            <mat-icon class="run__icon">description</mat-icon>
            <div>
              <p class="run__title">{{ r.title }}</p>
              <p class="run__meta"><span class="cap">{{ r.reportType }}</span><span *ngIf="r.quarter"> • Q{{ r.quarter }}</span> • {{ r.generatedAt ? (r.generatedAt | date:'mediumDate') : 'Pending' }}</p>
            </div>
          </div>
          <div class="run__actions">
            <span class="badge" [class]="'b-' + (r.status || '').toLowerCase()">{{ r.status }}</span>
            <ng-container *ngIf="r.status === 'Generated'">
              <button mat-stroked-button class="ex-xlsx" (click)="exportRun(r, 'xlsx')" [disabled]="exporting() === r.id">
                <mat-icon>{{ exporting() === r.id && exportFormat() === 'xlsx' ? 'hourglass_top' : 'table_chart' }}</mat-icon> XLSX
              </button>
              <button mat-stroked-button class="ex-pdf" (click)="exportRun(r, 'pdf')" [disabled]="exporting() === r.id">
                <mat-icon>{{ exporting() === r.id && exportFormat() === 'pdf' ? 'hourglass_top' : 'picture_as_pdf' }}</mat-icon> PDF
              </button>
              <button mat-stroked-button class="ex-csv" (click)="exportRun(r, 'csv')" [disabled]="exporting() === r.id">
                <mat-icon>{{ exporting() === r.id && exportFormat() === 'csv' ? 'hourglass_top' : 'description' }}</mat-icon> CSV
              </button>
            </ng-container>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .cycle-pick { width: 220px; margin-right: 8px; }
    .legend { display:flex; gap: 16px; align-items: center; padding: 12px 16px; background: #f8fafc; border: 1px solid var(--plat-border); border-radius: 12px; margin: 12px 0 16px; font-size: 12px; }
    .sw { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; vertical-align: middle; }
    .sw.met { background:#c6efce; border:1px solid #86efac; }
    .sw.partial { background:#ffeb9c; border:1px solid #fcd34d; }
    .sw.missed { background:#ffc7ce; border:1px solid #fca5a5; }
    .runs { display: flex; flex-direction: column; gap: 12px; }
    .run { display:flex; justify-content: space-between; align-items: center; padding: 14px 18px; }
    .run__main { display:flex; gap: 12px; align-items: center; }
    .run__icon { width: 36px; height: 36px; padding: 6px; border-radius: 8px; background: #eff6ff; color:#2563eb; }
    .run__title { margin:0; font-weight: 600; font-size: 14px; }
    .run__meta { margin: 2px 0 0; font-size: 12px; color: #64748b; }
    .run__actions { display: flex; gap: 8px; align-items: center; }
    .badge { padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; background:#e2e8f0; color:#475569; }
    .b-generated { background:#dcfce7; color:#15803d; }
    .b-pending { background:#f1f5f9; color:#475569; }
    .b-failed { background:#fee2e2; color:#b91c1c; }
    .ex-xlsx { color:#15803d; }
    .ex-pdf { color:#b91c1c; }
    .ex-csv { color:#2563eb; }
    .cap { text-transform: capitalize; }
    .empty { padding: 48px; text-align: center; color: #94a3b8; }
  `],
})
export class ReportCentreComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  cycles = signal<Cycle[]>([]);
  cycleId = signal<number | null>(null);
  runs = signal<ReportRun[]>([]);
  exporting = signal<number | null>(null);
  exportFormat = signal<string | null>(null);
  activeCycle = computed(() => this.cycles().find((c) => c.id === this.cycleId()) ?? null);

  ngOnInit() {
    this.api.get<Cycle[]>('/cycles').pipe(catchError(() => of([] as Cycle[]))).subscribe((cs) => {
      const arr = Array.isArray(cs) ? cs : [];
      this.cycles.set(arr);
      const def = arr.find((c) => c.status === 'Open') ?? arr[0];
      if (def) { this.cycleId.set(def.id); this.loadRuns(); }
    });
  }
  onCycle(id: number) { this.cycleId.set(id); this.loadRuns(); }
  loadRuns() {
    if (!this.cycleId()) return;
    this.api.get<ReportRun[]>('/reports/runs', { cycleId: this.cycleId()! })
      .pipe(catchError(() => of([] as ReportRun[])))
      .subscribe((r) => this.runs.set(Array.isArray(r) ? r : []));
  }
  openGenerate() {
    if (!this.cycleId()) return;
    this.dialog.open(ReportGenerateDialogComponent, { data: { cycleId: this.cycleId()! }, panelClass: 'plat-dialog', autoFocus: false })
      .afterClosed().subscribe((r) => { if (r) this.loadRuns(); });
  }
  exportRun(r: ReportRun, format: 'xlsx' | 'pdf' | 'csv') {
    this.exporting.set(r.id);
    this.exportFormat.set(format);
    this.api.getBlob(`/reports/runs/${r.id}/export`, { format }).pipe(
      tap((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${r.title.replace(/[^a-zA-Z0-9_ -]/g, '_')}.${format}`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.toast.success(`Report downloaded as ${format.toUpperCase()}`);
      }),
      catchError((e) => { this.toast.error('Download failed', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => { this.exporting.set(null); this.exportFormat.set(null); }),
    ).subscribe();
  }
}
