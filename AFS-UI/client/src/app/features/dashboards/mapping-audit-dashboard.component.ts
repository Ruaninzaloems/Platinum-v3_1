import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/services/api.service';
import { KpiTileComponent } from '../../shared/components/kpi-tile.component';

interface MappingRule {
  id: string;
  glAccountCode: string;
  glAccountName: string;
  lineItemId: string;
  lineItemLabel: string;
  mappingType: string;
  status: string;
  mscoaItemCode: string;
  isAutoSuggested: boolean;
  confirmedBy: string | null;
}

interface MappingAuditData {
  totalRules: number;
  coveragePercent: number;
  confirmedMappings: number;
  pendingConfirmation: number;
  unmappedAccounts: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  rules: MappingRule[];
}

@Component({
  selector: 'app-mapping-audit-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule, MatProgressBarModule, KpiTileComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mapping-audit-dashboard.component.html',
  styleUrl: './mapping-audit-dashboard.component.css'
})
export class MappingAuditDashboardComponent implements OnInit {
  loading = true;
  error = '';
  data: MappingAuditData | null = null;
  typeEntries: [string, number][] = [];
  statusEntries: [string, number][] = [];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.api.get<MappingAuditData>('/reports/mapping-audit').subscribe({
      next: (res) => {
        this.data = res;
        this.typeEntries = Object.entries(res.byType || {});
        this.statusEntries = Object.entries(res.byStatus || {});
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load mapping audit';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  formatLabel(value: string): string {
    if (!value) return '—';
    return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
