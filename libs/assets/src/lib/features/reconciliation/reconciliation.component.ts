import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/api.service';

interface ReconRow {
  typeName: string;
  transactionTypeId: number;
  isOffset: boolean;
  assetTotal: number;
  glTotal: number;
  variance: number;
  balanced: boolean;
  assetCount: number;
  glCount: number;
}

interface DisposalLine {
  lineName: string;
  lineKey: string;
  glSide: string;
  assetValue: number;
  glValue: number;
  variance: number;
  balanced: boolean;
}

@Component({
  selector: 'app-reconciliation',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './reconciliation.component.html',
  styleUrls: ['./reconciliation.component.css']
})
export class ReconciliationComponent implements OnInit {
  loading = signal(false);
  reconRows = signal<ReconRow[]>([]);
  disposalLines = signal<DisposalLine[]>([]);
  disposalSummary = signal<any>(null);
  disposalExpanded = signal(false);

  toggleDisposal() {
    this.disposalExpanded.set(!this.disposalExpanded());
  }
  detailRows = signal<any[]>([]);
  detailLoading = signal(false);
  selectedSide = signal<'asset' | 'gl' | ''>('');
  selectedTypeId = signal(0);
  selectedTypeName = signal('');
  selectedIsReversal = signal(false);

  appliedFilters = { finYear: '', fromPeriod: 1, toPeriod: 1 };
  filters = { finYear: '2025/2026', fromPeriod: 1, toPeriod: 9 };

  financialYears = ['2022/2023', '2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028'];
  periodOptions = [
    { value: 1, label: 'P1 — July' }, { value: 2, label: 'P2 — August' },
    { value: 3, label: 'P3 — September' }, { value: 4, label: 'P4 — October' },
    { value: 5, label: 'P5 — November' }, { value: 6, label: 'P6 — December' },
    { value: 7, label: 'P7 — January' }, { value: 8, label: 'P8 — February' },
    { value: 9, label: 'P9 — March' }, { value: 10, label: 'P10 — April' },
    { value: 11, label: 'P11 — May' }, { value: 12, label: 'P12 — June' }
  ];

  totalAsset = computed(function(this: ReconciliationComponent) {
    var rows = this.reconRows();
    var total = 0;
    for (var i = 0; i < rows.length; i++) { total += rows[i].assetTotal; }
    return total;
  }.bind(this));

  totalGl = computed(function(this: ReconciliationComponent) {
    var rows = this.reconRows();
    var total = 0;
    for (var i = 0; i < rows.length; i++) { total += rows[i].glTotal; }
    return total;
  }.bind(this));

  totalVariance = computed(function(this: ReconciliationComponent) {
    return Math.round(((this.totalAsset() as number) - (this.totalGl() as number)) * 100) / 100;
  }.bind(this));

  allBalanced = computed(function(this: ReconciliationComponent) {
    var rows = this.reconRows();
    for (var i = 0; i < rows.length; i++) {
      if (!rows[i].balanced) return false;
    }
    var dLines = this.disposalLines();
    for (var j = 0; j < dLines.length; j++) {
      if (!dLines[j].balanced) return false;
    }
    return rows.length > 0 || dLines.length > 0;
  }.bind(this));

  unreconciledCount = computed(function(this: ReconciliationComponent) {
    var rows = this.reconRows();
    var count = 0;
    for (var i = 0; i < rows.length; i++) {
      if (!rows[i].balanced) count++;
    }
    var dLines = this.disposalLines();
    for (var j = 0; j < dLines.length; j++) {
      if (!dLines[j].balanced) count++;
    }
    return count;
  }.bind(this));

  hasData = computed(function(this: ReconciliationComponent) {
    return this.reconRows().length > 0 || this.disposalLines().length > 0;
  }.bind(this));

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getSettings().subscribe({
      next: function(this: ReconciliationComponent, s: any) {
        if (s && s.financial_year) this.filters.finYear = s.financial_year;
        var cp = Number(s?.current_period) || 9;
        this.filters.fromPeriod = 1;
        this.filters.toPeriod = cp;
        this.applyFilters();
      }.bind(this),
      error: function(this: ReconciliationComponent) {
        this.applyFilters();
      }.bind(this)
    });
  }

  applyFilters() {
    this.appliedFilters = {
      finYear: this.filters.finYear,
      fromPeriod: this.filters.fromPeriod,
      toPeriod: this.filters.toPeriod
    };
    this.loading.set(true);
    this.clearDetail();
    this.api.getReconciliation({
      finYear: this.filters.finYear,
      fromPeriod: this.filters.fromPeriod,
      toPeriod: this.filters.toPeriod
    }).subscribe({
      next: function(this: ReconciliationComponent, res: any) {
        var serverRows = res.rows || [];
        var mapped: ReconRow[] = [];
        for (var i = 0; i < serverRows.length; i++) {
          var r = serverRows[i];
          mapped.push({
            typeName: r.typeName,
            transactionTypeId: Number(r.transactionTypeId) || 0,
            isOffset: !!r.isOffset,
            assetTotal: Number(r.assetTotal) || 0,
            glTotal: Number(r.glTotal) || 0,
            variance: Number(r.variance) || 0,
            balanced: !!r.balanced,
            assetCount: Number(r.assetCount) || 0,
            glCount: Number(r.glCount) || 0
          });
        }
        this.reconRows.set(mapped);

        var rawDisposalLines = res.disposalLines || [];
        var mappedDisposal: DisposalLine[] = [];
        for (var j = 0; j < rawDisposalLines.length; j++) {
          var dl = rawDisposalLines[j];
          mappedDisposal.push({
            lineName: dl.lineName || '',
            lineKey: dl.lineKey || '',
            glSide: dl.glSide || 'DR',
            assetValue: Number(dl.assetValue) || 0,
            glValue: Number(dl.glValue) || 0,
            variance: Number(dl.variance) || 0,
            balanced: !!dl.balanced
          });
        }
        this.disposalLines.set(mappedDisposal);
        this.disposalSummary.set(res.disposalSummary || null);
        this.loading.set(false);
      }.bind(this),
      error: function(this: ReconciliationComponent) {
        this.loading.set(false);
      }.bind(this)
    });
  }

  disposalDebitTotal(): number {
    var lines = this.disposalLines();
    var total = 0;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].glSide === 'DR') total += lines[i].assetValue;
    }
    return total;
  }

  disposalCreditTotal(): number {
    var lines = this.disposalLines();
    var total = 0;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].glSide === 'CR') total += lines[i].assetValue;
    }
    return total;
  }

  disposalGlDebitTotal(): number {
    var lines = this.disposalLines();
    var total = 0;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].glSide === 'DR') total += lines[i].glValue;
    }
    return total;
  }

  disposalGlCreditTotal(): number {
    var lines = this.disposalLines();
    var total = 0;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].glSide === 'CR') total += lines[i].glValue;
    }
    return total;
  }

  isDisposalBalanced(): boolean {
    var lines = this.disposalLines();
    if (lines.length === 0) return false;
    for (var i = 0; i < lines.length; i++) {
      if (!lines[i].balanced) return false;
    }
    return true;
  }

  selectAssetSide(row: ReconRow) {
    if (row.assetCount === 0) return;
    this.selectedSide.set('asset');
    this.selectedTypeId.set(row.transactionTypeId);
    this.selectedTypeName.set(row.typeName);
    this.selectedIsReversal.set(row.transactionTypeId === 241);
    this.detailLoading.set(true);
    this.detailRows.set([]);
    this.api.getReconciliationAssetTxns({
      transactionTypeId: row.transactionTypeId,
      finYear: this.appliedFilters.finYear,
      fromPeriod: this.appliedFilters.fromPeriod,
      toPeriod: this.appliedFilters.toPeriod,
      isOffset: row.isOffset
    }).subscribe({
      next: function(this: ReconciliationComponent, res: any) {
        this.detailRows.set(res || []);
        this.detailLoading.set(false);
      }.bind(this),
      error: function(this: ReconciliationComponent) {
        this.detailLoading.set(false);
      }.bind(this)
    });
  }

  selectGlSide(row: ReconRow) {
    if (row.glCount === 0) return;
    this.selectedSide.set('gl');
    this.selectedTypeId.set(row.transactionTypeId);
    this.selectedTypeName.set(row.typeName);
    this.detailLoading.set(true);
    this.detailRows.set([]);
    this.api.getReconciliationGlTxns({
      transactionTypeId: row.transactionTypeId,
      finYear: this.appliedFilters.finYear,
      fromPeriod: this.appliedFilters.fromPeriod,
      toPeriod: this.appliedFilters.toPeriod,
      isOffset: row.isOffset
    }).subscribe({
      next: function(this: ReconciliationComponent, res: any) {
        this.detailRows.set(res || []);
        this.detailLoading.set(false);
      }.bind(this),
      error: function(this: ReconciliationComponent) {
        this.detailLoading.set(false);
      }.bind(this)
    });
  }

  clearDetail() {
    this.selectedSide.set('');
    this.selectedTypeId.set(0);
    this.selectedTypeName.set('');
    this.selectedIsReversal.set(false);
    this.detailRows.set([]);
  }

  formatRand(n: number): string {
    if (n === null || n === undefined) return 'R 0.00';
    var abs = Math.abs(n);
    var formatted = abs.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (n < 0) return '(R ' + formatted + ')';
    return 'R ' + formatted;
  }

  formatVal(v: any): string {
    if (v === null || v === undefined) return '';
    var n = Number(v);
    if (n === 0) return '';
    return n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(d: any): string {
    if (!d) return '';
    var dt = new Date(d);
    return dt.toLocaleDateString('en-ZA');
  }

  getVarianceColor(variance: number): string {
    if (Math.abs(variance) < 0.01) return '#16a34a';
    return '#dc2626';
  }
}
