import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { catchError, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
  AiDashboard, AiInsightLog, AlignmentCheckResponse, AtRiskKpisResponse, Cycle,
  EvidenceGapsResponse, NarrativeSummary,
} from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-ai-insights',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatTabsModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="AI Advisory Dashboard" subtitle="AI-powered performance analytics and advisory insights." icon="psychology" tone="purple">
        <mat-form-field appearance="outline" class="cycle-pick">
          <mat-label>Cycle</mat-label>
          <mat-select [ngModel]="cycleId()" (ngModelChange)="onCycle($event)">
            <mat-option [value]="null">Select cycle</mat-option>
            <mat-option *ngFor="let c of cycles()" [value]="c.id">{{ c.financialYearLabel }}</mat-option>
          </mat-select>
        </mat-form-field>
      </app-page-header>

      <div *ngIf="!cycleId()" class="plat-card empty-cycle">
        <mat-icon>psychology</mat-icon>
        <p>Select a performance cycle to generate AI insights.</p>
      </div>

      <ng-container *ngIf="cycleId()">
        <div class="kpi-grid">
          <div class="plat-card kpi red"><span>High Risk KPIs</span><strong>{{ dashboard()?.riskSummary?.high ?? 0 }}</strong></div>
          <div class="plat-card kpi yellow"><span>Medium Risk KPIs</span><strong>{{ dashboard()?.riskSummary?.medium ?? 0 }}</strong></div>
          <div class="plat-card kpi green"><span>On Track</span><strong>{{ dashboard()?.riskSummary?.low ?? 0 }}</strong></div>
          <div class="plat-card kpi violet"><span>Alignment Score</span><strong>{{ alignment()?.overallScore ?? '—' }}%</strong></div>
        </div>

        <div class="plat-card recs" *ngIf="(dashboard()?.topRecommendations?.length ?? 0) > 0">
          <p class="recs__head">Top Recommendations</p>
          <ul><li *ngFor="let r of dashboard()?.topRecommendations">{{ r }}</li></ul>
        </div>

        <mat-tab-group class="tabs">
          <mat-tab label="At-Risk KPIs">
            <div class="tab-body">
              <p class="muted-box" *ngIf="atRisk()?.summary">{{ atRisk()?.summary }}</p>
              <p class="empty" *ngIf="!atRisk()?.atRiskKpis?.length">No at-risk KPIs detected</p>
              <div class="card-list">
                <div class="row" *ngFor="let k of atRisk()?.atRiskKpis ?? []">
                  <div class="row__head"><strong>{{ k.kpiDescription }}</strong><span class="badge" [class]="'risk-' + (k.riskLevel || 'low')">{{ k.riskLevel }}</span></div>
                  <p class="muted">{{ k.department }} — Score: {{ k.currentScore ?? 'N/A' }}</p>
                  <p>{{ k.reason }}</p>
                  <p class="rec">{{ k.recommendation }}</p>
                </div>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Narrative">
            <div class="tab-body">
              <p class="muted-box" *ngIf="narrative()?.narrative">{{ narrative()?.narrative }}</p>
              <ng-container *ngIf="(narrative()?.highlights?.length ?? 0) > 0">
                <p class="section-head green">Highlights</p>
                <p *ngFor="let h of narrative()?.highlights">✓ {{ h }}</p>
              </ng-container>
              <ng-container *ngIf="(narrative()?.concerns?.length ?? 0) > 0">
                <p class="section-head red">Concerns</p>
                <p *ngFor="let c of narrative()?.concerns">⚠ {{ c }}</p>
              </ng-container>
              <ng-container *ngIf="(narrative()?.recommendations?.length ?? 0) > 0">
                <p class="section-head blue">Recommendations</p>
                <p *ngFor="let r of narrative()?.recommendations">→ {{ r }}</p>
              </ng-container>
            </div>
          </mat-tab>

          <mat-tab label="Evidence Gaps">
            <div class="tab-body">
              <p class="muted-box" *ngIf="gaps()?.summary">{{ gaps()?.summary }}</p>
              <p class="empty" *ngIf="!gaps()?.gaps?.length">No evidence gaps detected</p>
              <table class="plat-table" *ngIf="gaps()?.gaps?.length">
                <thead><tr><th>KPI</th><th>Department</th><th>Quarter</th><th>Gap</th><th>Severity</th><th>Suggestion</th></tr></thead>
                <tbody>
                  <tr *ngFor="let g of gaps()?.gaps">
                    <td>{{ g.kpiDescription }}</td>
                    <td>{{ g.department }}</td>
                    <td>Q{{ g.quarter }}</td>
                    <td><span class="chip">{{ g.gapType }}</span></td>
                    <td><span class="badge" [class]="'risk-' + (g.severity || 'low')">{{ g.severity }}</span></td>
                    <td class="muted">{{ g.suggestion }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </mat-tab>

          <mat-tab label="Alignment">
            <div class="tab-body">
              <p class="muted-box" *ngIf="alignment()?.summary">{{ alignment()?.summary }}</p>
              <p class="empty" *ngIf="!alignment()?.alignmentIssues?.length">No alignment issues detected</p>
              <div class="card-list">
                <div class="row" *ngFor="let i of alignment()?.alignmentIssues ?? []">
                  <div class="row__head"><strong>{{ i.sourceModule }} → {{ i.targetModule }}</strong><span class="badge" [class]="'risk-' + (i.severity || 'low')">{{ i.severity }}</span></div>
                  <p>{{ i.issue }}</p>
                  <p class="rec">{{ i.recommendation }}</p>
                </div>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Insight Log">
            <div class="tab-body">
              <p class="empty" *ngIf="!logs().length">No insights generated yet</p>
              <table class="plat-table" *ngIf="logs().length">
                <thead><tr><th>Type</th><th>Summary</th><th>Risk</th><th>Generated</th></tr></thead>
                <tbody>
                  <tr *ngFor="let l of logs()">
                    <td><span class="chip">{{ l.insightType }}</span></td>
                    <td class="muted">{{ l.summary || '—' }}</td>
                    <td><span *ngIf="l.riskLevel" class="badge" [class]="'risk-' + l.riskLevel">{{ l.riskLevel }}</span><span *ngIf="!l.riskLevel">—</span></td>
                    <td class="muted">{{ l.createdAt }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </mat-tab>
        </mat-tab-group>
      </ng-container>
    </section>
  `,
  styles: [`
    .cycle-pick { width: 220px; }
    .empty-cycle { padding: 64px; text-align: center; color: #94a3b8; }
    .empty-cycle mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; color: #cbd5e1; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .kpi { padding: 14px 18px; border-left: 4px solid; }
    .kpi span { color: #64748b; font-size: 12px; }
    .kpi strong { display: block; font-size: 28px; margin-top: 4px; }
    .kpi.red { border-color: #ef4444; } .kpi.red strong { color: #dc2626; }
    .kpi.yellow { border-color: #eab308; } .kpi.yellow strong { color: #ca8a04; }
    .kpi.green { border-color: #22c55e; } .kpi.green strong { color: #16a34a; }
    .kpi.violet { border-color: #8b5cf6; } .kpi.violet strong { color: #7c3aed; }
    .recs { background: #faf5ff; border: 1px solid #e9d5ff; padding: 14px 18px; margin-bottom: 16px; }
    .recs__head { color: #7e22ce; font-weight: 600; margin: 0 0 6px; font-size: 13px; }
    .recs ul { margin: 0; padding-left: 18px; color: #6b21a8; font-size: 13px; }
    .tabs { background: var(--plat-surface); border-radius: 16px; box-shadow: var(--plat-shadow-sm); }
    .tab-body { padding: 18px; }
    .muted-box { background: #f8fafc; padding: 12px; border-radius: 8px; color: #475569; font-size: 13px; }
    .empty { text-align: center; color: #94a3b8; padding: 24px; }
    .card-list { display: flex; flex-direction: column; gap: 12px; }
    .row { border: 1px solid var(--plat-border); border-radius: 12px; padding: 12px 16px; }
    .row__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .row p { margin: 4px 0; font-size: 13px; color: #475569; }
    .row .rec { color: #2563eb; font-weight: 500; }
    .section-head { font-weight: 600; font-size: 13px; margin: 12px 0 4px; }
    .section-head.green { color: #15803d; } .section-head.red { color: #b91c1c; } .section-head.blue { color: #1d4ed8; }
    .badge { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
    .risk-high { background:#fee2e2; color:#b91c1c; }
    .risk-medium { background:#fef9c3; color:#a16207; }
    .risk-low { background:#dcfce7; color:#15803d; }
    .chip { display: inline-block; padding: 1px 8px; border: 1px solid var(--plat-border); border-radius: 999px; font-size: 11px; }
  `],
})
export class AiInsightsComponent implements OnInit {
  private readonly api = inject(ApiService);
  cycles = signal<Cycle[]>([]);
  cycleId = signal<number | null>(null);
  dashboard = signal<AiDashboard | null>(null);
  atRisk = signal<AtRiskKpisResponse | null>(null);
  narrative = signal<NarrativeSummary | null>(null);
  gaps = signal<EvidenceGapsResponse | null>(null);
  alignment = signal<AlignmentCheckResponse | null>(null);
  logs = signal<AiInsightLog[]>([]);
  // expose computed to keep tree-shaking honest
  readonly _dummy = computed(() => this.cycleId());

  ngOnInit() {
    this.api.get<Cycle[]>('/cycles').pipe(catchError(() => of([] as Cycle[]))).subscribe((cs) => {
      const arr = Array.isArray(cs) ? cs : [];
      this.cycles.set(arr);
      const def = arr.find((c) => c.status === 'Open') ?? arr[0];
      if (def) { this.cycleId.set(def.id); this.loadAll(); }
    });
  }
  onCycle(id: number | null) { this.cycleId.set(id); if (id) this.loadAll(); }
  loadAll() {
    const id = this.cycleId(); if (!id) return;
    const params = { cycleId: id };
    this.api.get<AiDashboard>('/ai-insights/dashboard', params).pipe(catchError(() => of(null))).subscribe((d) => this.dashboard.set(d));
    this.api.get<AtRiskKpisResponse>('/ai-insights/at-risk-kpis', params).pipe(catchError(() => of(null))).subscribe((r) => this.atRisk.set(r));
    this.api.get<NarrativeSummary>('/ai-insights/narrative-summary', params).pipe(catchError(() => of(null))).subscribe((n) => this.narrative.set(n));
    this.api.get<EvidenceGapsResponse>('/ai-insights/evidence-gaps', params).pipe(catchError(() => of(null))).subscribe((g) => this.gaps.set(g));
    this.api.get<AlignmentCheckResponse>('/ai-insights/alignment-check', params).pipe(catchError(() => of(null))).subscribe((a) => this.alignment.set(a));
    this.api.get<AiInsightLog[]>('/ai-insights/log', params).pipe(catchError(() => of([] as AiInsightLog[]))).pipe(tap((l) => this.logs.set(Array.isArray(l) ? l : []))).subscribe();
  }
}
