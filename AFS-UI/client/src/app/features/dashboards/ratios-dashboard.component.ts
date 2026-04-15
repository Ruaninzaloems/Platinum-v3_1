import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { PeriodFilterService } from '../../core/services/period-filter.service';
import { ArtApiService } from '../../core/services/art-api.service';
import { GaugeChartComponent } from '../../shared/components/gauge-chart.component';
import { TrafficLightComponent } from '../../shared/components/traffic-light.component';
import { SparklineComponent } from '../../shared/components/sparkline.component';
import { KpiTileComponent } from '../../shared/components/kpi-tile.component';

interface RatioResult {
  id: number;
  name: string;
  category: string;
  formula: string;
  value: number | null;
  displayValue: string;
  norm: string;
  status: 'green' | 'amber' | 'red' | 'grey';
  description: string;
}

interface RatioCategory {
  name: string;
  ratios: RatioResult[];
  green: number;
  amber: number;
  red: number;
}

interface RatiosResponse {
  financialYearId: string;
  overallScore: number;
  totalRatios: number;
  green: number;
  amber: number;
  red: number;
  grey: number;
  ratios: RatioResult[];
  categories: RatioCategory[];
  emsEnriched?: boolean;
}

@Component({
  selector: 'app-ratios-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule, MatSelectModule, MatFormFieldModule,
    GaugeChartComponent, TrafficLightComponent, SparklineComponent, KpiTileComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ratios-dashboard.component.html',
  styleUrl: './ratios-dashboard.component.css'
})
export class RatiosDashboardComponent implements OnInit {
  loading = true;
  error = '';
  data: RatiosResponse | null = null;
  emsEnriched = false;

  selectedPeriod = 'full_year';
  periodOptions = PeriodFilterService.PERIOD_OPTIONS;

  private periodFilter = inject(PeriodFilterService);
  private initialLoadDone = false;

  constructor(private api: ApiService, private artApi: ArtApiService, private cdr: ChangeDetectorRef) {
    effect(() => {
      const _f = this.periodFilter.selectedFyId();
      if (this.initialLoadDone) {
        this.loadData();
      }
    });
  }

  ngOnInit() {
    this.initialLoadDone = true;
    this.loadData();
  }

  onPeriodChange() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = '';
    this.emsEnriched = false;
    this.cdr.markForCheck();

    const url = PeriodFilterService.appendPeriodToUrl('/reports/dashboard', this.selectedPeriod);
    this.api.get<any>(url).subscribe({
      next: (dashboard) => {
        const fyId = dashboard?.financialYear?.id;
        if (!fyId) {
          this.loading = false;
          this.error = 'No active financial year found. Please ensure a financial year is configured.';
          this.cdr.markForCheck();
          return;
        }
        this.api.get<RatiosResponse>(`/reports/ratios/${fyId}`).subscribe({
          next: (ratios) => {
            this.data = ratios;
            this.emsEnriched = ratios.emsEnriched === true;
            this.loading = false;
            this.cdr.markForCheck();
            if (!this.emsEnriched) {
              this.checkEmsAvailability();
            }
          },
          error: (err) => {
            this.loading = false;
            this.error = err?.error?.message || 'Failed to load financial ratios';
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load dashboard data';
        this.cdr.markForCheck();
      }
    });
  }

  private checkEmsAvailability() {
    this.artApi.getStatus().pipe(
      catchError(() => of({ connected: false }))
    ).subscribe((status: any) => {
      if (status.connected && this.data) {
        this.emsEnriched = (this.data as any).emsEnriched === true || (this.data as any).emsDataAvailable === true;
        this.cdr.markForCheck();
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'green': return '#4caf50';
      case 'amber': return '#f59e0b';
      case 'red': return '#ef5350';
      default: return '#94a3b8';
    }
  }

  getPlaceholderTrend(value: number): number[] {
    const base = value || 50;
    return [
      base * 0.85,
      base * 0.9,
      base * 0.88,
      base * 0.95,
      base * 0.92,
      base
    ];
  }
}
