import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { KpiTileComponent } from '../../shared/components/kpi-tile.component';

interface AdjustmentEntry {
  id: string;
  reference: string;
  description: string;
  type: string;
  status: string;
  totalDebit: number;
  totalCredit: number;
}

interface AdjustmentsRegisterData {
  total: number;
  posted: number;
  unposted: number;
  netEffectOnSurplus: number;
  netEffectOnNetAssets: number;
  totalDebitPosted: number;
  totalCreditPosted: number;
  totalDebitUnposted: number;
  totalCreditUnposted: number;
  entries: AdjustmentEntry[];
}

@Component({
  selector: 'app-adjustments-register-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule, KpiTileComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './adjustments-register-dashboard.component.html',
  styleUrl: './adjustments-register-dashboard.component.css'
})
export class AdjustmentsRegisterDashboardComponent implements OnInit {
  loading = true;
  error = '';
  data: AdjustmentsRegisterData | null = null;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.api.get<AdjustmentsRegisterData>('/reports/adjustments-register').subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load adjustments register';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  formatCurrency(value: number): string {
    if (value === null || value === undefined) return 'R 0.00';
    const abs = Math.abs(value);
    const formatted = abs.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return value < 0 ? `(R ${formatted})` : `R ${formatted}`;
  }

  formatLabel(value: string): string {
    if (!value) return '—';
    return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
