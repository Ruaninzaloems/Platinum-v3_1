import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TabDef { id: string; label: string; icon: string; }
interface QuarterBar { name: string; achieved: number; pending: number; missed: number; }
interface DonutSlice { name: string; value: number; color: string; }
interface ActionItem { text: string; time: string; }
interface KpiCard { title: string; value: string; icon: string; tone: 'blue' | 'green' | 'orange' | 'slate'; }

@Component({
  selector: 'app-ins-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="perf-dashboard">
      <!-- Page header -->
      <div class="page-head">
        <div>
          <h1>Dashboard</h1>
          <p class="muted">Organisational performance at a glance</p>
        </div>
      </div>

      <!-- Horizontal tab strip -->
      <div class="tab-strip-wrap">
        <nav class="tab-strip">
          @for (t of tabs; track t.id) {
            <button
              class="tab"
              [class.active]="activeTab() === t.id"
              (click)="activeTab.set(t.id)">
              <span class="material-icons">{{ t.icon }}</span>
              {{ t.label }}
            </button>
          }
        </nav>
      </div>

      @if (activeTab() === 'summary') {
        <div class="tab-body">
          <!-- Active cycle pill -->
          <div class="cycle-pill">
            <span class="cycle-label">Active Cycle:</span>
            <span class="cycle-status">OPEN</span>
            <span class="cycle-fy">2025/2026</span>
          </div>

          <!-- KPI cards -->
          <div class="kpi-grid">
            @for (k of kpiCards; track k.title) {
              <div class="kpi-card" [attr.data-tone]="k.tone">
                <div class="kpi-row">
                  <div>
                    <div class="kpi-title">{{ k.title }}</div>
                    <div class="kpi-value">{{ k.value }}</div>
                  </div>
                  <div class="kpi-icon-box">
                    <span class="material-icons">{{ k.icon }}</span>
                  </div>
                </div>
                <div class="kpi-trend">
                  <span class="material-icons trend-up">trending_up</span>
                  <span class="trend-pct">+5%</span>
                  <span class="trend-text">from last quarter</span>
                </div>
              </div>
            }
          </div>

          <!-- Charts row -->
          <div class="charts-row">
            <!-- Performance Trend (stacked bars) -->
            <div class="chart-card chart-bars">
              <div class="chart-head">
                <h3><span class="material-icons">bar_chart</span> Performance Trend</h3>
                <p class="muted">Quarter over quarter KPI achievement</p>
              </div>
              <div class="bar-chart">
                <div class="y-axis">
                  <span>80</span><span>60</span><span>40</span><span>20</span><span>0</span>
                </div>
                <div class="bar-area">
                  @for (q of quarterly; track q.name) {
                    <div class="bar-col">
                      <div class="bar-stack">
                        <div class="seg seg-missed" [style.height.%]="seg(q.missed)"></div>
                        <div class="seg seg-pending" [style.height.%]="seg(q.pending)"></div>
                        <div class="seg seg-achieved" [style.height.%]="seg(q.achieved)"></div>
                      </div>
                      <div class="bar-label">{{ q.name }}</div>
                    </div>
                  }
                </div>
              </div>
              <div class="legend">
                <span class="dot dot-achieved"></span> Achieved
                <span class="dot dot-pending"></span> Pending
                <span class="dot dot-missed"></span> Missed
              </div>
            </div>

            <!-- KPI Distribution donut -->
            <div class="chart-card chart-donut">
              <div class="chart-head">
                <h3><span class="material-icons">pie_chart</span> KPI Distribution</h3>
                <p class="muted">Overall status breakdown</p>
              </div>
              <div class="donut-wrap">
                <svg viewBox="0 0 120 120" class="donut">
                  @for (s of donutSegments(); track s.name) {
                    <circle
                      cx="60" cy="60" r="42"
                      fill="none"
                      [attr.stroke]="s.color"
                      stroke-width="18"
                      [attr.stroke-dasharray]="s.dash"
                      [attr.stroke-dashoffset]="s.offset"
                      transform="rotate(-90 60 60)" />
                  }
                </svg>
              </div>
              <div class="donut-legend">
                @for (d of donut; track d.name) {
                  <div class="legend-item">
                    <span class="dot" [style.background]="d.color"></span>
                    {{ d.name }}
                  </div>
                }
              </div>
              <div class="donut-total">
                <div class="total-num">142</div>
                <div class="total-label">Total KPIs</div>
              </div>
            </div>
          </div>

          <!-- Action Required -->
          <div class="action-card">
            <div class="action-head">
              <h3><span class="material-icons">bolt</span> Action Required</h3>
              <p class="muted">Pending tasks for your attention</p>
            </div>
            <div class="action-grid">
              @for (a of actions; track a.text) {
                <div class="action-tile">
                  <span class="material-icons tile-icon">fact_check</span>
                  <div>
                    <div class="tile-text">{{ a.text }}</div>
                    <div class="tile-time">{{ a.time }}</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="tab-body">
          <div class="placeholder">
            <span class="material-icons big">{{ currentTabIcon() }}</span>
            <h3>{{ currentTabLabel() }}</h3>
            <p class="muted">This view is part of the Performance module roadmap.</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; --pp: #2563eb; --pp-soft: #eff6ff; }
    .perf-dashboard { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-head { display:flex; align-items:center; justify-content:space-between; padding-bottom: 1rem; }
    .page-head h1 { font-size: 1.5rem; font-weight: 700; color:#0f172a; margin: 0; letter-spacing:-.01em; }
    .muted { color:#64748b; font-size:.875rem; margin:.25rem 0 0; }

    .tab-strip-wrap { border-bottom: 1px solid #e2e8f0; margin-bottom: 1.5rem; overflow-x: auto; }
    .tab-strip { display:flex; gap:0; min-width: max-content; margin-bottom: -1px; }
    .tab { display:flex; align-items:center; gap:.5rem; padding:.75rem 1.5rem; font-size:.875rem; font-weight:500;
           background:transparent; border:none; border-bottom: 2px solid transparent; color:#64748b; cursor:pointer;
           transition: all .15s ease; white-space: nowrap; font-family:inherit; }
    .tab .material-icons { font-size:18px; }
    .tab:hover { color:#334155; border-bottom-color:#cbd5e1; }
    .tab.active { color: var(--pp); border-bottom-color: var(--pp); background:#eff6ff66; }

    .tab-body { animation: fade .25s ease; }
    @keyframes fade { from { opacity:0; transform: translateY(4px); } to { opacity:1; transform:none; } }

    .cycle-pill { display:inline-flex; align-items:center; gap:.6rem; background:#fff; padding:.5rem 1rem;
                  border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.05); border:1px solid #e2e8f0; margin-bottom: 1.5rem; }
    .cycle-label { font-size:.875rem; color:#475569; font-weight:500; }
    .cycle-status { background:#dcfce7; color:#15803d; font-weight:700; padding:.15rem .55rem; border-radius:6px; font-size:.75rem; letter-spacing:.05em; }
    .cycle-fy { color:#64748b; font-size:.875rem; }

    .kpi-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:1rem; margin-bottom:1.5rem; }
    .kpi-card { background:#fff; border-radius:12px; padding:1.25rem; box-shadow:0 1px 3px rgba(0,0,0,.05);
                border-left:4px solid #cbd5e1; transition: box-shadow .15s ease; }
    .kpi-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); }
    .kpi-card[data-tone=blue]   { border-left-color:#3b82f6; }
    .kpi-card[data-tone=green]  { border-left-color:#22c55e; }
    .kpi-card[data-tone=orange] { border-left-color:#f97316; }
    .kpi-card[data-tone=slate]  { border-left-color:#94a3b8; }
    .kpi-row { display:flex; justify-content:space-between; align-items:flex-start; }
    .kpi-title { font-size:.75rem; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.06em; margin-bottom:.35rem; }
    .kpi-value { font-size:2rem; font-weight:700; color:#0f172a; line-height:1; }
    .kpi-icon-box { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; border:1px solid; }
    .kpi-card[data-tone=blue]   .kpi-icon-box { background:#eff6ff; border-color:#bfdbfe; color:#2563eb; }
    .kpi-card[data-tone=green]  .kpi-icon-box { background:#f0fdf4; border-color:#bbf7d0; color:#16a34a; }
    .kpi-card[data-tone=orange] .kpi-icon-box { background:#fff7ed; border-color:#fed7aa; color:#ea580c; }
    .kpi-card[data-tone=slate]  .kpi-icon-box { background:#f1f5f9; border-color:#e2e8f0; color:#64748b; }
    .kpi-trend { margin-top:1rem; display:flex; align-items:center; gap:.5rem; font-size:.875rem; }
    .trend-up { color:#22c55e; font-size:18px; }
    .trend-pct { color:#16a34a; font-weight:600; }
    .trend-text { color:#94a3b8; }

    .charts-row { display:grid; grid-template-columns: 2fr 1fr; gap:1.5rem; margin-bottom:1.5rem; }
    @media (max-width: 1024px) { .charts-row { grid-template-columns: 1fr; } }
    .chart-card { background:#fff; border-radius:12px; padding:1.5rem; box-shadow:0 1px 3px rgba(0,0,0,.05); border:1px solid #f1f5f9; }
    .chart-head h3 { display:flex; align-items:center; gap:.5rem; font-size:1rem; font-weight:700; color:#0f172a; margin:0; }
    .chart-head h3 .material-icons { color: var(--pp); font-size:20px; }
    .chart-head .muted { margin: .15rem 0 1.25rem; }

    .bar-chart { display:flex; height:280px; }
    .y-axis { display:flex; flex-direction:column; justify-content:space-between; padding-right:.5rem;
              font-size:.75rem; color:#64748b; padding-bottom: 24px; }
    .bar-area { flex:1; display:flex; align-items:flex-end; gap:1rem; border-bottom:1px solid #e2e8f0; padding-bottom:0; }
    .bar-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:.5rem; height:100%; }
    .bar-stack { width:60%; max-width:80px; height: calc(100% - 24px); display:flex; flex-direction:column-reverse; border-radius: 4px; overflow:hidden; }
    .seg { width:100%; transition: height .35s ease; }
    .seg-achieved { background:#86efac; }
    .seg-pending  { background:#fdba74; }
    .seg-missed   { background:#fca5a5; }
    .bar-label { font-size:.8rem; color:#64748b; height:24px; line-height:24px; }
    .legend { display:flex; align-items:center; gap:1rem; margin-top:1rem; font-size:.8rem; color:#64748b; justify-content:center; }
    .dot { display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:.35rem; vertical-align: middle; }
    .dot-achieved { background:#86efac; }
    .dot-pending  { background:#fdba74; }
    .dot-missed   { background:#fca5a5; }

    .chart-donut { display:flex; flex-direction:column; }
    .donut-wrap { flex:1; min-height: 200px; display:flex; align-items:center; justify-content:center; padding:.5rem 0; }
    .donut { width: 200px; height: 200px; }
    .donut-legend { display:flex; gap:1rem; justify-content:center; font-size:.8rem; color:#64748b; flex-wrap:wrap; }
    .legend-item { display:flex; align-items:center; }
    .donut-total { text-align:center; margin-top:.75rem; }
    .total-num { font-size:1.875rem; font-weight:700; color:#0f172a; }
    .total-label { font-size:.75rem; color:#94a3b8; }

    .action-card { background:#fff; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,.05); overflow:hidden; border:1px solid #f1f5f9; }
    .action-head { background:#fff7ed; border-bottom:1px solid #fed7aa; padding:1.25rem; }
    .action-head h3 { display:flex; align-items:center; gap:.5rem; font-size:1rem; font-weight:700; color:#9a3412; margin:0; }
    .action-head h3 .material-icons { color:#ea580c; }
    .action-head .muted { color:#c2410c; opacity:.85; margin: .15rem 0 0; }
    .action-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); padding:.5rem; }
    .action-tile { display:flex; gap:.75rem; padding:.85rem; border-radius:8px; cursor:pointer; transition: background .15s ease; }
    .action-tile:hover { background:#f8fafc; }
    .tile-icon { color:#3b82f6; font-size:18px; margin-top:2px; }
    .tile-text { font-size:.875rem; font-weight:500; color:#1e293b; line-height:1.3; }
    .tile-time { font-size:.75rem; color:#94a3b8; margin-top:.25rem; }

    .placeholder { text-align:center; padding: 4rem 2rem; color:#64748b; }
    .placeholder .big { font-size: 64px; opacity:.25; color: var(--pp); }
    .placeholder h3 { margin: .75rem 0 .35rem; color:#1e293b; font-size:1.25rem; }
  `]
})
export class InsDashboardComponent {
  tabs: TabDef[] = [
    { id: 'summary',         label: 'Summary',          icon: 'bar_chart' },
    { id: 'executive',       label: 'Executive',        icon: 'trending_up' },
    { id: 'department',      label: 'Department',       icon: 'business' },
    { id: 'overview',        label: 'Overview',         icon: 'insights' },
    { id: 'ai',              label: 'AI Analytics',     icon: 'psychology' },
    { id: 'nkpa',            label: 'NKPA Performance', icon: 'layers' },
    { id: 'kpi-status',      label: 'KPI Status',       icon: 'pie_chart' },
    { id: 'financial',       label: 'Financial',        icon: 'attach_money' },
    { id: 'trendline',       label: 'Trendline',        icon: 'show_chart' },
    { id: 'underperforming', label: 'Underperforming',  icon: 'thumb_down' },
  ];
  activeTab = signal<string>('summary');

  kpiCards: KpiCard[] = [
    { title: 'Total KPIs',       value: '142', icon: 'flag',          tone: 'blue' },
    { title: 'Achieved',         value: '98',  icon: 'check_circle',  tone: 'green' },
    { title: 'At Risk',          value: '24',  icon: 'warning',       tone: 'orange' },
    { title: 'Pending Evidence', value: '20',  icon: 'schedule',      tone: 'slate' },
  ];

  quarterly: QuarterBar[] = [
    { name: 'Q1', achieved: 45, pending: 10, missed: 5 },
    { name: 'Q2', achieved: 52, pending: 8,  missed: 2 },
    { name: 'Q3', achieved: 38, pending: 20, missed: 8 },
    { name: 'Q4', achieved: 60, pending: 5,  missed: 1 },
  ];

  donut: DonutSlice[] = [
    { name: 'Achieved', value: 98, color: '#86efac' },
    { name: 'At Risk',  value: 24, color: '#fdba74' },
    { name: 'Missed',   value: 20, color: '#fca5a5' },
  ];

  actions: ActionItem[] = [
    { text: 'Review Q2 submissions for Finance', time: '2 hours ago' },
    { text: 'Approve updated NKPA weightings',   time: '5 hours ago' },
    { text: 'Missing evidence: KPI-042',         time: '1 day ago' },
    { text: 'Submit departmental constraints',   time: '2 days ago' },
  ];

  // 80 is the visual y-axis ceiling shown above
  seg(value: number): number { return Math.min(100, (value / 80) * 100); }

  // Build SVG donut segments using stroke-dasharray
  donutSegments() {
    const r = 42;
    const circumference = 2 * Math.PI * r; // ~263.9
    const total = this.donut.reduce((s, d) => s + d.value, 0) || 1;
    let consumed = 0;
    return this.donut.map(d => {
      const len = (d.value / total) * circumference;
      const dash = `${len} ${circumference - len}`;
      const offset = -consumed;
      consumed += len;
      return { name: d.name, color: d.color, dash, offset };
    });
  }

  currentTabLabel(): string {
    return this.tabs.find(t => t.id === this.activeTab())?.label ?? '';
  }
  currentTabIcon(): string {
    return this.tabs.find(t => t.id === this.activeTab())?.icon ?? 'dashboard';
  }
}
