import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { CycleStore } from './cycle-picker';

interface RiskSummary { high?: number; medium?: number; low?: number; }
interface AiDashboard { riskSummary?: RiskSummary; topRecommendations?: string[]; }
interface AtRiskKpi { kpiDescription: string; riskLevel?: string; department?: string; currentScore?: number | string; reason?: string; recommendation?: string; }
interface AtRiskResp { summary?: string; atRiskKpis?: AtRiskKpi[]; }
interface Narrative { narrative?: string; highlights?: string[]; concerns?: string[]; recommendations?: string[]; }
interface Gap { kpiDescription: string; department?: string; quarter?: number; gapType?: string; severity?: string; suggestion?: string; }
interface GapsResp { summary?: string; gaps?: Gap[]; }
interface AlignIssue { sourceModule?: string; targetModule?: string; issue?: string; severity?: string; recommendation?: string; }
interface AlignResp { summary?: string; overallScore?: number; alignmentIssues?: AlignIssue[]; }
interface LogRow { id: number; insightType?: string; summary?: string; riskLevel?: string; createdAt?: string; }

type SubTab = 'risk' | 'narrative' | 'evidence' | 'alignment' | 'log';

@Component({
  selector: 'app-ai-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <div>
        <h2><span class="material-symbols-rounded purple">psychology</span> AI Advisory Dashboard</h2>
        <p>AI-powered performance analytics and advisory insights</p>
      </div>
      <select [ngModel]="cycles.cycleId()" (ngModelChange)="cycles.setCycle($event)">
        <option [ngValue]="null">Select Cycle</option>
        <option *ngFor="let c of cycles.cycles()" [ngValue]="c.id">{{ c.financialYearLabel }}</option>
      </select>
    </div>

    <ng-container *ngIf="cycles.cycleId(); else pick">
      <div class="kpis">
        <div class="plat-card kpi b-red"><div class="muted">High Risk KPIs</div><div class="big red">{{ dashboard()?.riskSummary?.high ?? 0 }}</div></div>
        <div class="plat-card kpi b-amber"><div class="muted">Medium Risk KPIs</div><div class="big amber">{{ dashboard()?.riskSummary?.medium ?? 0 }}</div></div>
        <div class="plat-card kpi b-green"><div class="muted">On Track</div><div class="big green">{{ dashboard()?.riskSummary?.low ?? 0 }}</div></div>
        <div class="plat-card kpi b-purple"><div class="muted">Alignment Score</div><div class="big purple">{{ alignment()?.overallScore ?? '—' }}%</div></div>
      </div>

      <div class="plat-card recs" *ngIf="(dashboard()?.topRecommendations?.length ?? 0) > 0">
        <div class="recs__t">Top Recommendations</div>
        <ul>
          <li *ngFor="let r of dashboard()?.topRecommendations">{{ r }}</li>
        </ul>
      </div>

      <div class="subtabs">
        <button *ngFor="let t of subTabs" class="subtab" [class.is-active]="sub() === t.id" (click)="sub.set(t.id)">
          <span class="material-symbols-rounded">{{ t.icon }}</span> {{ t.label }}
        </button>
      </div>

      <div class="plat-card subpanel" *ngIf="sub() === 'risk'">
        <h3>At-Risk KPI Analysis</h3>
        <p class="note" *ngIf="atRisk()?.summary as s">{{ s }}</p>
        <p class="empty" *ngIf="(atRisk()?.atRiskKpis?.length ?? 0) === 0">No at-risk KPIs detected</p>
        <div class="cardlist">
          <div class="cl" *ngFor="let k of atRisk()?.atRiskKpis">
            <div class="cl__h"><b>{{ k.kpiDescription }}</b><span class="badge" [ngClass]="rcls(k.riskLevel)">{{ k.riskLevel }}</span></div>
            <div class="muted2">{{ k.department }} — Score: {{ k.currentScore ?? 'N/A' }}</div>
            <div>{{ k.reason }}</div>
            <div class="rec">{{ k.recommendation }}</div>
          </div>
        </div>
      </div>

      <div class="plat-card subpanel" *ngIf="sub() === 'narrative'">
        <h3>Executive Narrative Summary</h3>
        <p class="note" *ngIf="narrative()?.narrative as n">{{ n }}</p>
        <ng-container *ngIf="(narrative()?.highlights?.length ?? 0) > 0">
          <div class="ttl green">Highlights</div>
          <div *ngFor="let h of narrative()?.highlights" class="li">✓ {{ h }}</div>
        </ng-container>
        <ng-container *ngIf="(narrative()?.concerns?.length ?? 0) > 0">
          <div class="ttl red">Concerns</div>
          <div *ngFor="let c of narrative()?.concerns" class="li">⚠ {{ c }}</div>
        </ng-container>
        <ng-container *ngIf="(narrative()?.recommendations?.length ?? 0) > 0">
          <div class="ttl blue">Recommendations</div>
          <div *ngFor="let r of narrative()?.recommendations" class="li">→ {{ r }}</div>
        </ng-container>
      </div>

      <div class="plat-card subpanel" *ngIf="sub() === 'evidence'">
        <h3>Evidence Gap Analysis</h3>
        <p class="note" *ngIf="gaps()?.summary as s">{{ s }}</p>
        <p class="empty" *ngIf="(gaps()?.gaps?.length ?? 0) === 0">No evidence gaps detected</p>
        <table class="tbl" *ngIf="(gaps()?.gaps?.length ?? 0) > 0">
          <thead><tr><th>KPI</th><th>Dept</th><th>Quarter</th><th>Gap</th><th>Severity</th><th>Suggestion</th></tr></thead>
          <tbody>
            <tr *ngFor="let g of gaps()?.gaps">
              <td>{{ g.kpiDescription }}</td>
              <td>{{ g.department }}</td>
              <td>Q{{ g.quarter }}</td>
              <td><span class="badge b-outline">{{ g.gapType }}</span></td>
              <td><span class="badge" [ngClass]="rcls(g.severity)">{{ g.severity }}</span></td>
              <td class="muted2">{{ g.suggestion }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="plat-card subpanel" *ngIf="sub() === 'alignment'">
        <h3>Cross-Module Alignment Check</h3>
        <p class="note" *ngIf="alignment()?.summary as s">{{ s }}</p>
        <p class="empty" *ngIf="(alignment()?.alignmentIssues?.length ?? 0) === 0">No alignment issues detected</p>
        <div class="cardlist">
          <div class="cl" *ngFor="let i of alignment()?.alignmentIssues">
            <div class="cl__h"><b>{{ i.sourceModule }} → {{ i.targetModule }}</b><span class="badge" [ngClass]="rcls(i.severity)">{{ i.severity }}</span></div>
            <div>{{ i.issue }}</div>
            <div class="rec">{{ i.recommendation }}</div>
          </div>
        </div>
      </div>

      <div class="plat-card subpanel" *ngIf="sub() === 'log'">
        <h3>AI Insight Log</h3>
        <p class="empty" *ngIf="(logs()?.length ?? 0) === 0">No insights generated yet</p>
        <table class="tbl" *ngIf="(logs()?.length ?? 0) > 0">
          <thead><tr><th>Type</th><th>Summary</th><th>Risk</th><th>Generated</th></tr></thead>
          <tbody>
            <tr *ngFor="let l of logs()">
              <td><span class="badge b-outline">{{ l.insightType }}</span></td>
              <td class="muted2">{{ l.summary || '—' }}</td>
              <td><span *ngIf="l.riskLevel as r" class="badge" [ngClass]="rcls(r)">{{ r }}</span><span *ngIf="!l.riskLevel">—</span></td>
              <td class="muted2">{{ l.createdAt }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-container>

    <ng-template #pick>
      <div class="plat-card empty-card">
        <span class="material-symbols-rounded big-icon">psychology</span>
        <p>Select a performance cycle to generate AI insights</p>
      </div>
    </ng-template>
  `,
  styles: [`
    :host { display:block; }
    .bar { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:18px; }
    .bar h2 { font-size:22px; font-weight:700; margin:0; display:flex; align-items:center; gap:8px; }
    .bar p { color: var(--plat-muted); margin:4px 0 0; }
    .bar select { padding:8px 10px; border:1px solid var(--plat-border); border-radius:8px; background:#fff; }
    .purple { color:#9333ea; }
    .kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:18px; }
    .kpi { padding:14px 16px; border-left:4px solid #cbd5e1; }
    .b-red { border-left-color:#ef4444; }
    .b-amber { border-left-color:#f59e0b; }
    .b-green { border-left-color:#22c55e; }
    .b-purple { border-left-color:#a855f7; }
    .muted { color:var(--plat-muted); font-size:13px; }
    .muted2 { color:var(--plat-muted); font-size:13px; }
    .big { font-size:28px; font-weight:700; }
    .red { color:#dc2626; } .amber { color:#d97706; } .green { color:#16a34a; }
    .recs { padding:14px 16px; background:#faf5ff; border:1px solid #e9d5ff; margin-bottom:18px; }
    .recs__t { font-weight:600; color:#7e22ce; margin-bottom:8px; font-size:13px; }
    .recs ul { margin:0; padding-left:18px; color:#6b21a8; font-size:13px; }
    .subtabs { display:flex; gap:4px; border-bottom:1px solid var(--plat-border); margin-bottom:14px; overflow-x:auto; }
    .subtab { background:transparent; border:0; padding:8px 14px; color:var(--plat-muted); display:inline-flex; align-items:center; gap:6px; cursor:pointer; border-bottom:2px solid transparent; white-space:nowrap; }
    .subtab.is-active { color:var(--plat-blue); border-bottom-color:var(--plat-blue); }
    .subtab .material-symbols-rounded { font-size:16px; }
    .subpanel { padding:18px; margin-bottom:18px; }
    .subpanel h3 { margin:0 0 12px; font-size:15px; font-weight:600; }
    .note { background:#f8fafc; padding:10px 12px; border-radius:6px; font-size:13px; color:#475569; margin:0 0 12px; }
    .empty { text-align:center; color:var(--plat-muted); padding:24px; }
    .empty-card { padding:48px; text-align:center; color:var(--plat-muted); }
    .big-icon { font-size:48px; display:block; margin:0 auto 12px; color:#cbd5e1; }
    .cardlist { display:flex; flex-direction:column; gap:10px; }
    .cl { padding:12px 14px; border:1px solid var(--plat-border); border-radius:8px; font-size:13px; }
    .cl__h { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
    .rec { color:#2563eb; font-weight:500; margin-top:4px; }
    .ttl { font-weight:600; font-size:13px; margin-top:12px; margin-bottom:4px; }
    .ttl.green { color:#15803d; } .ttl.red { color:#b91c1c; } .ttl.blue { color:#1d4ed8; }
    .li { font-size:13px; color:#475569; padding:2px 0; }
    .tbl { width:100%; border-collapse:collapse; font-size:13px; }
    .tbl th, .tbl td { padding:8px 10px; border-bottom:1px solid var(--plat-border); text-align:left; }
    .tbl th { font-size:11px; color:var(--plat-muted); text-transform:uppercase; }
    .badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:600; }
    .r-high { background:#fecaca; color:#991b1b; }
    .r-medium { background:#fef08a; color:#854d0e; }
    .r-low { background:#bbf7d0; color:#166534; }
    .r-none { background:#f1f5f9; color:#64748b; }
    .b-outline { background:transparent; border:1px solid var(--plat-border); color:#475569; }
  `],
})
export class AiTabComponent {
  private readonly api = inject(ApiService);
  readonly cycles = inject(CycleStore);
  readonly sub = signal<SubTab>('risk');

  readonly subTabs: { id: SubTab; label: string; icon: string; }[] = [
    { id: 'risk', label: 'At-Risk KPIs', icon: 'warning' },
    { id: 'narrative', label: 'Narrative', icon: 'trending_up' },
    { id: 'evidence', label: 'Evidence Gaps', icon: 'find_in_page' },
    { id: 'alignment', label: 'Alignment', icon: 'link' },
    { id: 'log', label: 'Insight Log', icon: 'history' },
  ];

  private readonly cycleObs = toObservable(this.cycles.cycleId);

  readonly dashboard = this.fetch<AiDashboard>('/ai-insights/dashboard');
  readonly atRisk = this.fetch<AtRiskResp>('/ai-insights/at-risk-kpis');
  readonly narrative = this.fetch<Narrative>('/ai-insights/narrative-summary');
  readonly gaps = this.fetch<GapsResp>('/ai-insights/evidence-gaps');
  readonly alignment = this.fetch<AlignResp>('/ai-insights/alignment-check');
  readonly logs = toSignal(
    this.cycleObs.pipe(
      switchMap((cid) => {
        if (!cid) return of<LogRow[]>([]);
        return this.api.get<LogRow[]>('/ai-insights/log', { cycleId: cid })
          .pipe(catchError(() => of<LogRow[]>([])));
      }),
    ),
    { initialValue: [] as LogRow[] },
  );

  private fetch<T>(path: string) {
    return toSignal<T | null>(
      this.cycleObs.pipe(
        switchMap((cid) => {
          if (!cid) return of(null);
          return this.api.get<T>(path, { cycleId: cid }).pipe(catchError(() => of(null)));
        }),
      ),
      { initialValue: null },
    );
  }

  rcls(r?: string): string {
    switch (r) {
      case 'high': return 'r-high';
      case 'medium': return 'r-medium';
      case 'low': return 'r-low';
      default: return 'r-none';
    }
  }
}
