import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { KpiTileComponent } from '../../shared/components/kpi-tile.component';

interface HeatmapSection {
  id: string;
  name: string;
  evidenceCount: number;
  status: string;
}

interface EvidenceHeatmapData {
  totalSections: number;
  coveredSections: number;
  gapSections: number;
  coveragePercent: number;
  totalEvidence: number;
  sections: HeatmapSection[];
}

@Component({
  selector: 'app-evidence-heatmap-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule, KpiTileComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './evidence-heatmap-dashboard.component.html',
  styleUrl: './evidence-heatmap-dashboard.component.css'
})
export class EvidenceHeatmapDashboardComponent implements OnInit {
  loading = true;
  error = '';
  data: EvidenceHeatmapData | null = null;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.api.get<EvidenceHeatmapData>('/reports/evidence-heatmap').subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load evidence heatmap';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getCardClass(section: HeatmapSection): string {
    if (section.status === 'covered' || section.evidenceCount >= 3) return 'covered';
    if (section.status === 'partial' || section.evidenceCount > 0) return 'partial';
    return 'gap';
  }
}
