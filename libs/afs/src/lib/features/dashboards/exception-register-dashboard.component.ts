import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { KpiTileComponent } from '../../shared/components/kpi-tile.component';

interface ExceptionItem {
  id: string;
  statement: string;
  note: string;
  description: string;
  severity: string;
  materiality: string;
  status: string;
}

interface ExceptionRegisterData {
  totalExceptions: number;
  materialCount: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  exceptions: ExceptionItem[];
}

@Component({
  selector: 'app-exception-register-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule, KpiTileComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './exception-register-dashboard.component.html',
  styleUrl: './exception-register-dashboard.component.css'
})
export class ExceptionRegisterDashboardComponent implements OnInit {
  loading = true;
  error = '';
  data: ExceptionRegisterData | null = null;
  statusKeys = ['open', 'resolved', 'accepted'];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.api.get<ExceptionRegisterData>('/reports/exception-register').subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load exception register';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getExceptionsByStatus(status: string): ExceptionItem[] {
    if (!this.data) return [];
    return this.data.exceptions.filter(e => e.status === status);
  }

  formatLabel(value: string): string {
    if (!value) return '—';
    return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
