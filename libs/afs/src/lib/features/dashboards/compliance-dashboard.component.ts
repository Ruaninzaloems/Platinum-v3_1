import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { KpiTileComponent } from '../../shared/components/kpi-tile.component';
import { GaugeChartComponent } from '../../shared/components/gauge-chart.component';
import { ProgressRingComponent } from '../../shared/components/progress-ring.component';

interface ComplianceData {
  overallScore: number;
  evidenceCoverage: number;
  exceptionResolution: number;
  rfiSlaCompliance: number;
  grapExceptions: Array<{
    id: number;
    reference: string;
    description: string;
    status: string;
    grapStandard: string;
    severity: string;
  }>;
  totalExceptions: number;
  resolvedExceptions: number;
  evidenceItems: Array<{
    section: string;
    required: number;
    uploaded: number;
    coverage: number;
  }>;
  totalEvidenceRequired: number;
  totalEvidenceUploaded: number;
  rfiItems: Array<{
    id: number;
    reference: string;
    status: string;
    withinSla: boolean;
    daysOpen: number;
  }>;
  totalRfis: number;
  rfisWithinSla: number;
}

@Component({
  selector: 'app-compliance-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatProgressBarModule, MatTooltipModule,
    KpiTileComponent, GaugeChartComponent, ProgressRingComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './compliance-dashboard.component.html',
  styleUrl: './compliance-dashboard.component.css'
})
export class ComplianceDashboardComponent implements OnInit {
  loading = true;
  error = '';
  data: ComplianceData | null = null;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    forkJoin({
      exceptions: this.api.get<any>('/reports/exception-register'),
      heatmap: this.api.get<any>('/reports/evidence-heatmap'),
      rfis: this.api.get<any>('/reports/rfi-register')
    }).subscribe({
      next: ({ exceptions, heatmap, rfis }) => {
        this.data = this.buildComplianceData(exceptions, heatmap, rfis);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load compliance data';
        this.cdr.markForCheck();
      }
    });
  }

  private buildComplianceData(exceptions: any, heatmap: any, rfis: any): ComplianceData {
    const exList = Array.isArray(exceptions) ? exceptions : exceptions?.items || exceptions?.data || [];
    const totalExceptions = exList.length;
    const resolvedExceptions = exList.filter((e: any) => e.status === 'resolved' || e.status === 'closed').length;
    const exceptionResolution = totalExceptions > 0 ? Math.round((resolvedExceptions / totalExceptions) * 100) : 100;

    const sections = Array.isArray(heatmap) ? heatmap : heatmap?.sections || heatmap?.data || [];
    const evidenceItems = sections.map((s: any) => ({
      section: s.section || s.name || s.grapStandard || 'Unknown',
      required: s.required || s.totalRequired || 0,
      uploaded: s.uploaded || s.totalUploaded || s.available || 0,
      coverage: s.coverage || (s.required > 0 ? Math.round(((s.uploaded || s.available || 0) / s.required) * 100) : 0)
    }));
    const totalEvidenceRequired = evidenceItems.reduce((s: number, i: any) => s + i.required, 0) || 1;
    const totalEvidenceUploaded = evidenceItems.reduce((s: number, i: any) => s + i.uploaded, 0);
    const evidenceCoverage = Math.round((totalEvidenceUploaded / totalEvidenceRequired) * 100);

    const rfiList = Array.isArray(rfis) ? rfis : rfis?.items || rfis?.data || [];
    const totalRfis = rfiList.length;
    const rfisWithinSla = rfiList.filter((r: any) => r.withinSla !== false && r.slaBreached !== true).length;
    const rfiSlaCompliance = totalRfis > 0 ? Math.round((rfisWithinSla / totalRfis) * 100) : 100;

    const overallScore = Math.round((evidenceCoverage + exceptionResolution + rfiSlaCompliance) / 3);

    return {
      overallScore,
      evidenceCoverage: Math.min(evidenceCoverage, 100),
      exceptionResolution,
      rfiSlaCompliance,
      grapExceptions: exList.slice(0, 10).map((e: any, i: number) => ({
        id: e.id || i,
        reference: e.reference || `EX-${i + 1}`,
        description: e.description || e.title || '',
        status: e.status || 'open',
        grapStandard: e.grapStandard || e.standard || '',
        severity: e.severity || 'minor'
      })),
      totalExceptions,
      resolvedExceptions,
      evidenceItems: evidenceItems.slice(0, 8),
      totalEvidenceRequired,
      totalEvidenceUploaded,
      rfiItems: rfiList.slice(0, 10).map((r: any, i: number) => ({
        id: r.id || i,
        reference: r.reference || `RFI-${i + 1}`,
        status: r.status || 'open',
        withinSla: r.withinSla !== false && r.slaBreached !== true,
        daysOpen: r.daysOpen || r.ageDays || 0
      })),
      totalRfis,
      rfisWithinSla
    };
  }
}
