import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../core/services/api.service';
import { KpiTileComponent } from '../../shared/components/kpi-tile.component';

interface PackData {
  executiveSummary: string;
  keyFindingsCount: number;
  adjustmentsSummary: string;
  adjustmentsCount: number;
  rfiSummary: string;
  rfiCount: number;
  evidenceSummary: string;
  evidenceCount: number;
}

interface GovernancePacksData {
  compilationLabel: string;
  compilationId: string;
  auditCommitteePack: PackData;
  councilPack: PackData;
  totalFindings: number;
  totalAdjustments: number;
  totalRfis: number;
  totalEvidence: number;
}

@Component({
  selector: 'app-governance-packs-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule, MatDividerModule,
    KpiTileComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './governance-packs-dashboard.component.html',
  styleUrl: './governance-packs-dashboard.component.css'
})
export class GovernancePacksDashboardComponent implements OnInit {
  loading = true;
  error = '';
  data: GovernancePacksData | null = null;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.api.get<any>('/reports/dashboard').subscribe({
      next: (dashboard) => {
        const compilations = dashboard?.compilations || [];
        if (compilations.length === 0) {
          this.loading = false;
          this.error = 'No compilations found. Create a compilation first.';
          this.cdr.markForCheck();
          return;
        }
        const compilationId = compilations[0]?.id;
        this.api.get<any>(`/reports/governance-packs/${compilationId}`).subscribe({
          next: (packs) => {
            this.data = this.transformPacks(packs, compilations[0]);
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.loading = false;
            this.error = err?.error?.message || 'Failed to load governance packs';
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

  private transformPacks(packs: any, compilation: any): GovernancePacksData {
    const acPack = packs?.auditCommitteePack || packs?.auditPack || {};
    const cPack = packs?.councilPack || {};

    const buildPack = (p: any): PackData => ({
      executiveSummary: p.executiveSummary || p.summary || 'No executive summary available.',
      keyFindingsCount: p.keyFindingsCount || p.findings?.length || 0,
      adjustmentsSummary: p.adjustmentsSummary || `${p.adjustmentsCount || 0} adjustments processed`,
      adjustmentsCount: p.adjustmentsCount || 0,
      rfiSummary: p.rfiSummary || `${p.rfiCount || 0} RFIs addressed`,
      rfiCount: p.rfiCount || 0,
      evidenceSummary: p.evidenceSummary || `${p.evidenceCount || 0} evidence items attached`,
      evidenceCount: p.evidenceCount || 0
    });

    const ac = buildPack(acPack);
    const cc = buildPack(cPack);

    return {
      compilationLabel: compilation?.name || compilation?.label || 'Current Compilation',
      compilationId: compilation?.id || '',
      auditCommitteePack: ac,
      councilPack: cc,
      totalFindings: (ac.keyFindingsCount + cc.keyFindingsCount) || packs?.totalFindings || 0,
      totalAdjustments: (ac.adjustmentsCount + cc.adjustmentsCount) || packs?.totalAdjustments || 0,
      totalRfis: (ac.rfiCount + cc.rfiCount) || packs?.totalRfis || 0,
      totalEvidence: (ac.evidenceCount + cc.evidenceCount) || packs?.totalEvidence || 0
    };
  }
}
