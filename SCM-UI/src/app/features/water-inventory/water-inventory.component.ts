import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { environment } from '../../../environments/environment';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-water-inventory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatTabsModule, MatChipsModule, MatBadgeModule, MatCheckboxModule, MatSlideToggleModule, MatProgressBarModule],
  templateUrl: './water-inventory.component.html',
  styleUrl: './water-inventory.component.scss'
})
export class WaterInventoryComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private apiUrl = environment.apiUrl;
  private charts: Chart[] = [];

  activeTab = signal('dashboard');
  opSection = signal('readings');
  finSection = signal('valuations');
  compSection = signal('quality');
  cfgSection = signal('network');
  page = signal(1);
  notification = signal('');
  notificationType = signal<'success' | 'error'>('success');

  dash = signal<any>({});
  nrwAnalytics = signal<any>({});
  treatmentSummary = signal<any>({});

  meterReadings = signal<any[]>([]);
  stocktakes = signal<any[]>([]);
  acquisitions = signal<any[]>([]);
  distributions = signal<any[]>([]);
  waterLosses = signal<any[]>([]);
  treatment = signal<any[]>([]);
  valuations = signal<any[]>([]);
  reconciliations = signal<any[]>([]);
  qualityCompliance = signal<any[]>([]);
  adjustingEntries = signal<any[]>([]);
  workingPapers = signal<any[]>([]);
  policyReviews = signal<any[]>([]);
  monthlyReports = signal<any[]>([]);
  configuration = signal<any[]>([]);
  routes = signal<any[]>([]);
  routeNodes = signal<any[]>([]);
  assetTypes = signal<any[]>([]);
  allNodes = signal<any[]>([]);
  wacData = signal<any>({});

  damLevels = signal<any[]>([]);
  daysOfSupply = signal(0);
  daysOfSupplyPeak = signal(0);
  daysOfSupplyDrought = signal(0);
  dailyAvgConsumption = signal(0);
  avgDailyInflow = signal(0);
  restrictionForecast = signal<any[]>([]);
  weatherOutlook = signal<any[]>([]);
  weatherSummary = signal('');

  analyticsNrwSummary = signal<any>({});
  analyticsRouteEfficiency = signal<any[]>([]);
  analyticsLossCategories = signal<any[]>([]);
  analyticsCostData = signal<any>({});
  analyticsTreatmentPlants = signal<any[]>([]);
  analyticsAnomalies = signal<any[]>([]);
  analyticsForecast = signal<any[]>([]);
  analyticsComplianceAreas = signal<any[]>([]);
  analyticsOverallCompliance = signal(0);
  analyticsRevenueData = signal<any>({});
  analyticsInfraBrackets = signal<any[]>([]);

  latestLoss = computed(() => this.waterLosses().length > 0 ? this.waterLosses()[0] : null);

  formMode = signal('');
  editItem: any = null;
  fd: any = {};

  filterRoute = '';
  filterStatus = '';

  months = [
    { v: 1, l: 'January' }, { v: 2, l: 'February' }, { v: 3, l: 'March' }, { v: 4, l: 'April' },
    { v: 5, l: 'May' }, { v: 6, l: 'June' }, { v: 7, l: 'July' }, { v: 8, l: 'August' },
    { v: 9, l: 'September' }, { v: 10, l: 'October' }, { v: 11, l: 'November' }, { v: 12, l: 'December' }
  ];

  private headers() { return { Authorization: `Bearer ${localStorage.getItem('token') || 'mock-token'}` }; }
  private base = '/scm/water-inventory';
  private url(path: string) { return `${this.apiUrl}${this.base}${path}`; }

  ngOnInit() {
    this.loadDashboard();
    this.loadRoutes();
    this.loadRouteNodes();
  }

  ngOnDestroy() { this.charts.forEach(c => c.destroy()); }

  switchTab(tab: string) {
    this.activeTab.set(tab);
    if (tab === 'dashboard') { this.loadDashboard(); }
    else if (tab === 'operations') { this.loadForSection(this.opSection()); }
    else if (tab === 'financial') { this.loadForFinSection(this.finSection()); }
    else if (tab === 'compliance') { this.loadForCompSection(this.compSection()); }
    else if (tab === 'config') { this.loadRoutes(); }
    else if (tab === 'damlevels') { this.loadDamLevels(); }
    else if (tab === 'analytics') { this.loadAnalytics(); }
    else if (tab === 'reports') { this.loadMonthlyReports(); }
  }

  loadForSection(s: string) {
    if (s === 'readings') this.loadMeterReadings();
    else if (s === 'stocktakes') this.loadStocktakes();
    else if (s === 'acquisitions') this.loadAcquisitions();
    else if (s === 'distributions') this.loadDistributions();
    else if (s === 'losses') this.loadWaterLosses();
    else if (s === 'treatment') this.loadTreatment();
  }

  loadForFinSection(s: string) {
    if (s === 'valuations') this.loadValuations();
    else if (s === 'reconciliations') this.loadReconciliations();
    else if (s === 'wac') this.loadWac();
    else if (s === 'adjustments') this.loadAdjustingEntries();
    else if (s === 'workingpapers') this.loadWorkingPapers();
  }

  loadForCompSection(s: string) {
    if (s === 'quality') this.loadQualityCompliance();
    else if (s === 'policies') this.loadPolicyReviews();
  }

  loadDashboard() {
    this.http.get<any>(this.url('/dashboard'), { headers: this.headers() }).subscribe({
      next: d => { this.dash.set(d || {}); this.cdr.detectChanges(); setTimeout(() => this.renderCharts(), 100); },
      error: () => { this.dash.set(this.mockDashboard()); this.cdr.detectChanges(); setTimeout(() => this.renderCharts(), 100); }
    });
    this.http.get<any>(this.url('/dashboard/nrw-analytics'), { headers: this.headers() }).subscribe({
      next: d => this.nrwAnalytics.set(d || {}),
      error: () => this.nrwAnalytics.set(this.mockNrw())
    });
  }

  loadDamLevels() {
    const dams = [
      { name: 'Garden Route Dam', capacityKl: 12700000, currentKl: 9398000, levelPercent: 74, dailyDrawdownKl: 18500, trend: 'falling' as string, yearLowPercent: 52, yearHighPercent: 89, daysRemaining: 0 },
      { name: 'Outeniqua Dam', capacityKl: 4500000, currentKl: 2835000, levelPercent: 63, dailyDrawdownKl: 8200, trend: 'stable' as string, yearLowPercent: 38, yearHighPercent: 78, daysRemaining: 0 },
      { name: 'Wolwedans Dam', capacityKl: 2100000, currentKl: 1407000, levelPercent: 67, dailyDrawdownKl: 4800, trend: 'rising' as string, yearLowPercent: 45, yearHighPercent: 82, daysRemaining: 0 },
      { name: 'Kaaimans Dam', capacityKl: 1800000, currentKl: 468000, levelPercent: 26, dailyDrawdownKl: 3900, trend: 'falling' as string, yearLowPercent: 18, yearHighPercent: 71, daysRemaining: 0 },
      { name: 'Swartrivier Weir', capacityKl: 800000, currentKl: 96000, levelPercent: 12, dailyDrawdownKl: 2100, trend: 'falling' as string, yearLowPercent: 8, yearHighPercent: 65, daysRemaining: 0 }
    ];

    dams.forEach(d => { d.daysRemaining = Math.round(d.currentKl / d.dailyDrawdownKl); });
    this.damLevels.set(dams);

    const totalCurrent = dams.reduce((s, d) => s + d.currentKl, 0);
    const totalDrawdown = dams.reduce((s, d) => s + d.dailyDrawdownKl, 0);
    const peakDrawdown = totalDrawdown * 1.35;

    this.dailyAvgConsumption.set(totalDrawdown);
    this.avgDailyInflow.set(Math.round(totalDrawdown * 0.82));
    this.daysOfSupply.set(Math.round(totalCurrent / totalDrawdown));
    this.daysOfSupplyPeak.set(Math.round(totalCurrent / peakDrawdown));
    this.daysOfSupplyDrought.set(Math.round(totalCurrent / (peakDrawdown * 1.1)));

    this.restrictionForecast.set([
      { level: 0, name: 'No Restrictions', description: 'Normal water supply — dams above 60%', color: '#10b981', isCurrentLevel: false, triggered: true, triggerDate: 'Historical' },
      { level: 1, name: 'Voluntary Savings', description: 'Reduce usage by 10% — awareness campaigns', color: '#22c55e', isCurrentLevel: true, triggered: false, triggerDate: null, predictedDate: null },
      { level: 2, name: 'Moderate Restrictions', description: 'No garden watering 10am-4pm, car wash banned', color: '#f59e0b', isCurrentLevel: false, triggered: false, triggerDate: null, predictedDate: 'Apr 2026' },
      { level: 3, name: 'Severe Restrictions', description: 'No outdoor use, 200L per person per day', color: '#ea580c', isCurrentLevel: false, triggered: false, triggerDate: null, predictedDate: 'Jul 2026' },
      { level: 4, name: 'Critical Restrictions', description: 'Essential use only, 50L per person per day', color: '#dc2626', isCurrentLevel: false, triggered: false, triggerDate: null, predictedDate: null },
      { level: 5, name: 'Day Zero', description: 'Municipal supply cut — collection points only', color: '#7f1d1d', isCurrentLevel: false, triggered: false, triggerDate: null, predictedDate: null }
    ]);

    this.weatherOutlook.set([
      { month: 'March 2026', monthShort: 'Mar', rainfallMm: 42, tempAvgC: 22 },
      { month: 'April 2026', monthShort: 'Apr', rainfallMm: 55, tempAvgC: 19 },
      { month: 'May 2026', monthShort: 'May', rainfallMm: 68, tempAvgC: 16 },
      { month: 'June 2026', monthShort: 'Jun', rainfallMm: 78, tempAvgC: 13 },
      { month: 'July 2026', monthShort: 'Jul', rainfallMm: 72, tempAvgC: 12 },
      { month: 'August 2026', monthShort: 'Aug', rainfallMm: 65, tempAvgC: 14 }
    ]);

    const totalRainfall = this.weatherOutlook().reduce((s, w) => s + w.rainfallMm, 0);
    this.weatherSummary.set(
      totalRainfall > 350
        ? 'Above-average winter rainfall expected. Dam recovery likely by August if consumption managed.'
        : totalRainfall > 250
        ? 'Near-average rainfall forecast. Current restrictions should stabilise levels through winter.'
        : 'Below-average rainfall forecast. Proactive restriction escalation recommended.'
    );

    this.cdr.detectChanges();
    setTimeout(() => this.renderDamCharts(), 100);
  }

  renderDamCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    const forecastEl = document.getElementById('damForecastChart') as HTMLCanvasElement;
    if (forecastEl) {
      const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
      const currentLevel = 56;
      const optimistic = [currentLevel, 54, 52, 55, 60, 65, 68, 66, 63, 60, 58, 57];
      const baseline = [currentLevel, 51, 47, 44, 43, 45, 48, 47, 44, 40, 37, 35];
      const drought = [currentLevel, 48, 41, 34, 28, 23, 19, 16, 13, 10, 8, 6];
      const criticalLine = months.map(() => 15);

      this.charts.push(new Chart(forecastEl, {
        type: 'line',
        data: {
          labels: months,
          datasets: [
            {
              label: 'Optimistic', data: optimistic,
              borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)',
              fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: '#10b981'
            },
            {
              label: 'Baseline', data: baseline,
              borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)',
              fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: '#f59e0b'
            },
            {
              label: 'Drought', data: drought,
              borderColor: '#dc2626', backgroundColor: 'rgba(220,38,38,0.08)',
              fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: '#dc2626'
            },
            {
              label: 'Critical (15%)', data: criticalLine,
              borderColor: '#ef4444', borderDash: [6, 4], borderWidth: 2,
              pointRadius: 0, fill: false
            }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15,23,42,0.9)', titleFont: { size: 12 }, bodyFont: { size: 11 },
              callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y}%` }
            }
          },
          scales: {
            y: {
              min: 0, max: 80,
              ticks: { callback: (v: any) => v + '%', font: { size: 10 }, color: '#94a3b8' },
              grid: { color: '#f1f5f9' }
            },
            x: { ticks: { font: { size: 10 }, color: '#94a3b8' }, grid: { display: false } }
          }
        }
      }));
    }

    const ioEl = document.getElementById('inflowOutflowChart') as HTMLCanvasElement;
    if (ioEl) {
      const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - 29 + i);
        return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
      });
      const avgConsumption = this.dailyAvgConsumption();
      const avgInflow = this.avgDailyInflow();
      const inflowData = days.map((_, i) => Math.round(avgInflow * (0.7 + Math.random() * 0.6 + (i > 20 ? Math.random() * 0.3 : 0))));
      const consumptionData = days.map((_, i) => Math.round(avgConsumption * (0.85 + Math.random() * 0.3 + (i % 7 < 2 ? -0.1 : 0))));

      this.charts.push(new Chart(ioEl, {
        type: 'bar',
        data: {
          labels: days,
          datasets: [
            {
              label: 'Inflow (kl)', data: inflowData,
              backgroundColor: 'rgba(14,165,233,0.6)', borderRadius: 3, barPercentage: 0.8
            },
            {
              label: 'Consumption (kl)', data: consumptionData,
              backgroundColor: 'rgba(239,68,68,0.4)', borderRadius: 3, barPercentage: 0.8
            }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true, padding: 12 } },
            tooltip: {
              backgroundColor: 'rgba(15,23,42,0.9)', titleFont: { size: 11 }, bodyFont: { size: 10 },
              callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('en-ZA')} kl` }
            }
          },
          scales: {
            y: {
              ticks: { callback: (v: any) => (v / 1000).toFixed(0) + 'k', font: { size: 10 }, color: '#94a3b8' },
              grid: { color: '#f1f5f9' }
            },
            x: { ticks: { font: { size: 9 }, color: '#94a3b8', maxRotation: 45 }, grid: { display: false } }
          }
        }
      }));
    }
  }

  loadMeterReadings() {
    const p: any = { page: this.page(), pageSize: 20 };
    if (this.filterRoute) p.routeId = this.filterRoute;
    if (this.filterStatus) p.status = this.filterStatus;
    this.http.get<any>(this.url('/meter-readings'), { headers: this.headers(), params: p }).subscribe({
      next: r => this.meterReadings.set(r?.data || r || []),
      error: () => this.meterReadings.set(this.mockReadings())
    });
  }

  loadStocktakes() {
    this.http.get<any>(this.url('/stocktakes'), { headers: this.headers() }).subscribe({
      next: r => this.stocktakes.set(r?.data || r || []),
      error: () => this.stocktakes.set(this.mockStocktakes())
    });
  }

  loadAcquisitions() {
    this.http.get<any>(this.url('/acquisitions'), { headers: this.headers() }).subscribe({
      next: r => this.acquisitions.set(r?.data || r || []),
      error: () => this.acquisitions.set(this.mockAcquisitions())
    });
  }

  loadDistributions() {
    this.http.get<any>(this.url('/distributions'), { headers: this.headers() }).subscribe({
      next: r => this.distributions.set(r?.data || r || []),
      error: () => this.distributions.set(this.mockDistributions())
    });
  }

  loadWaterLosses() {
    this.http.get<any>(this.url('/water-losses'), { headers: this.headers() }).subscribe({
      next: r => this.waterLosses.set(r?.data || r || []),
      error: () => this.waterLosses.set(this.mockLosses())
    });
  }

  loadTreatment() {
    this.http.get<any>(this.url('/treated'), { headers: this.headers() }).subscribe({
      next: r => this.treatment.set(r?.data || r || []),
      error: () => this.treatment.set(this.mockTreatment())
    });
  }

  loadValuations() {
    this.http.get<any>(this.url('/valuations'), { headers: this.headers() }).subscribe({
      next: r => this.valuations.set(r?.data || r || []),
      error: () => this.valuations.set(this.mockValuations())
    });
  }

  loadReconciliations() {
    this.http.get<any>(this.url('/reconciliations'), { headers: this.headers() }).subscribe({
      next: r => this.reconciliations.set(r?.data || r || []),
      error: () => this.reconciliations.set(this.mockReconciliations())
    });
  }

  loadWac() {
    this.http.get<any>(this.url('/weighted-average-cost'), { headers: this.headers() }).subscribe({
      next: r => this.wacData.set(r || {}),
      error: () => this.wacData.set({ currentWac: 8.45, totalVolumeKl: 125000, totalValueZar: 1056250 })
    });
  }

  loadQualityCompliance() {
    this.http.get<any>(this.url('/quality-compliance'), { headers: this.headers() }).subscribe({
      next: r => this.qualityCompliance.set(r?.data || r || []),
      error: () => this.qualityCompliance.set(this.mockCompliance())
    });
  }

  loadAdjustingEntries() {
    this.http.get<any>(this.url('/adjusting-entries'), { headers: this.headers() }).subscribe({
      next: r => this.adjustingEntries.set(r?.data || r || []),
      error: () => this.adjustingEntries.set([])
    });
  }

  loadWorkingPapers() {
    this.http.get<any>(this.url('/working-papers'), { headers: this.headers() }).subscribe({
      next: r => this.workingPapers.set(r?.data || r || []),
      error: () => this.workingPapers.set([])
    });
  }

  loadPolicyReviews() {
    this.http.get<any>(this.url('/policy-reviews'), { headers: this.headers() }).subscribe({
      next: r => this.policyReviews.set(r?.data || r || []),
      error: () => this.policyReviews.set([])
    });
  }

  loadMonthlyReports() {
    this.http.get<any>(this.url('/monthly-reports'), { headers: this.headers() }).subscribe({
      next: r => this.monthlyReports.set(r?.data || r || []),
      error: () => this.monthlyReports.set([])
    });
  }

  loadConfiguration() {
    this.http.get<any>(this.url('/configuration'), { headers: this.headers() }).subscribe({
      next: r => this.configuration.set(r || []),
      error: () => this.configuration.set([])
    });
  }

  loadRoutes() {
    this.http.get<any>(this.url('/routes'), { headers: this.headers() }).subscribe({
      next: r => this.routes.set(r || []),
      error: () => this.routes.set(this.mockRoutes())
    });
  }

  loadRouteNodes(routeId?: number) {
    const p: any = routeId ? { routeId } : {};
    this.http.get<any>(this.url('/route-nodes'), { headers: this.headers(), params: p }).subscribe({
      next: r => { this.routeNodes.set(r || []); if (!routeId) this.allNodes.set(r || []); },
      error: () => this.routeNodes.set([])
    });
  }

  loadAssetTypes() {
    this.http.get<any>(this.url('/asset-types'), { headers: this.headers() }).subscribe({
      next: r => this.assetTypes.set(r || []),
      error: () => this.assetTypes.set([])
    });
  }

  openForm(mode: string, item?: any) {
    this.formMode.set(mode);
    this.editItem = item || null;
    this.fd = item ? { ...item } : { periodYear: new Date().getFullYear() };
  }

  closeForm() { this.formMode.set(''); this.editItem = null; this.fd = {}; }

  formTitle(): string {
    const m = this.formMode();
    const titles: Record<string, string> = {
      'create-reading': 'Capture Meter Reading', 'amend-reading': 'Amend Meter Reading', 'bulk-reading': 'Bulk Import Readings', 'reading-history': 'Reading Amendment History',
      'create-stocktake': 'Create Water Stocktake', 'count-stocktake': 'Capture Physical Counts', 'verify-stocktake': 'Verify Stocktake Counts', 'approve-stocktake': 'Approve Stocktake',
      'create-acquisition': 'Record Water Acquisition', 'create-distribution': 'Record Water Distribution', 'create-loss': 'Record Water Loss Data',
      'create-treatment': 'Record Treatment Data', 'create-purification-cost': 'Record Purification Cost',
      'run-valuation': 'Run NRV Valuation (GRAP 12)', 'manage-nrv-formulas': 'NRV Formula Management',
      'run-reconciliation': 'Run Monthly Reconciliation',
      'create-adjustment': 'Create Adjusting Entry', 'create-working-paper': 'Create Working Paper', 'edit-working-paper': 'Edit Working Paper',
      'create-compliance': 'New Compliance Assessment', 'create-policy-review': 'New Policy Review',
      'create-route': 'Create Water Route', 'create-node': 'Create Route Node', 'create-asset-type': 'Create Asset Type', 'edit-asset-type': 'Edit Asset Type',
      'create-config': 'Add Configuration Parameter', 'generate-report': 'Generate Monthly Report',
      'manage-loss-formulas': 'Water Loss Formulas', 'manage-implementation-plans': 'Implementation Plans'
    };
    return titles[m] || m;
  }

  formIcon(): string {
    const m = this.formMode();
    if (m.includes('reading')) return 'speed';
    if (m.includes('stocktake')) return 'fact_check';
    if (m.includes('acquisition')) return 'add_shopping_cart';
    if (m.includes('distribution')) return 'local_shipping';
    if (m.includes('loss') || m.includes('implementation')) return 'water_damage';
    if (m.includes('treatment') || m.includes('purification')) return 'science';
    if (m.includes('valuation') || m.includes('nrv')) return 'assessment';
    if (m.includes('reconciliation')) return 'balance';
    if (m.includes('adjustment')) return 'tune';
    if (m.includes('working')) return 'description';
    if (m.includes('compliance')) return 'health_and_safety';
    if (m.includes('policy')) return 'policy';
    if (m.includes('route') || m.includes('node')) return 'route';
    if (m.includes('asset')) return 'category';
    if (m.includes('config')) return 'settings';
    if (m.includes('report')) return 'summarize';
    return 'edit';
  }

  isWideForm(): boolean {
    const m = this.formMode();
    return m.includes('acquisition') || m.includes('loss') || m.includes('treatment') || m.includes('compliance') || m.includes('adjustment');
  }

  submitLabel(): string {
    const m = this.formMode();
    if (m.includes('run')) return 'Run';
    if (m.includes('generate')) return 'Generate';
    if (m.includes('approve')) return 'Approve';
    if (m.includes('verify')) return 'Verify';
    if (m.includes('count')) return 'Submit Counts';
    if (m.includes('amend')) return 'Save Amendment';
    if (m.includes('bulk')) return 'Upload';
    return 'Save';
  }

  submitForm() {
    const m = this.formMode();
    const post = (path: string, data: any, cb: () => void) => {
      this.http.post(this.url(path), data, { headers: this.headers() }).subscribe({ next: () => { this.notify('Saved successfully'); this.closeForm(); cb(); }, error: () => { this.notify('Saved (mock)'); this.closeForm(); cb(); } });
    };

    if (m === 'create-reading') post('/meter-readings', this.fd, () => this.loadMeterReadings());
    else if (m === 'amend-reading') { this.http.put(this.url(`/meter-readings/${this.editItem.id}/amend`), this.fd, { headers: this.headers() }).subscribe({ next: () => { this.notify('Reading amended'); this.closeForm(); this.loadMeterReadings(); }, error: () => { this.notify('Amended (mock)'); this.closeForm(); } }); }
    else if (m === 'create-stocktake') post('/stocktakes', this.fd, () => this.loadStocktakes());
    else if (m === 'count-stocktake') post(`/stocktakes/${this.editItem.id}/count`, this.fd, () => this.loadStocktakes());
    else if (m === 'verify-stocktake') post(`/stocktakes/${this.editItem.id}/verify`, this.fd, () => this.loadStocktakes());
    else if (m === 'approve-stocktake') post(`/stocktakes/${this.editItem.id}/approve`, this.fd, () => this.loadStocktakes());
    else if (m === 'create-acquisition') post('/acquisitions', this.fd, () => this.loadAcquisitions());
    else if (m === 'create-distribution') post('/distributions', this.fd, () => this.loadDistributions());
    else if (m === 'create-loss') post('/water-losses', this.fd, () => this.loadWaterLosses());
    else if (m === 'create-treatment') post('/treated', this.fd, () => this.loadTreatment());
    else if (m === 'run-valuation') post('/valuations/run', this.fd, () => this.loadValuations());
    else if (m === 'run-reconciliation') post('/reconciliations/run', this.fd, () => this.loadReconciliations());
    else if (m === 'create-adjustment') post('/adjusting-entries', this.fd, () => this.loadAdjustingEntries());
    else if (m === 'create-working-paper') post('/working-papers', this.fd, () => this.loadWorkingPapers());
    else if (m === 'edit-working-paper') { this.http.put(this.url(`/working-papers/${this.editItem.id}`), this.fd, { headers: this.headers() }).subscribe({ next: () => { this.notify('Updated'); this.closeForm(); this.loadWorkingPapers(); }, error: () => { this.notify('Updated (mock)'); this.closeForm(); } }); }
    else if (m === 'create-compliance') post('/quality-compliance', this.fd, () => this.loadQualityCompliance());
    else if (m === 'create-policy-review') post('/policy-reviews', this.fd, () => this.loadPolicyReviews());
    else if (m === 'create-route') post('/routes', this.fd, () => this.loadRoutes());
    else if (m === 'create-node') post('/route-nodes', this.fd, () => this.loadRouteNodes());
    else if (m === 'create-asset-type') post('/asset-types', this.fd, () => this.loadAssetTypes());
    else if (m === 'edit-asset-type') { this.http.put(this.url(`/asset-types/${this.editItem.id}`), this.fd, { headers: this.headers() }).subscribe({ next: () => { this.notify('Updated'); this.closeForm(); this.loadAssetTypes(); }, error: () => { this.notify('Updated (mock)'); this.closeForm(); } }); }
    else if (m === 'create-config') post('/configuration', this.fd, () => this.loadConfiguration());
    else if (m === 'generate-report') post('/monthly-reports/generate', this.fd, () => this.loadMonthlyReports());
    else { this.notify('Form submitted'); this.closeForm(); }
  }

  approveReading(r: any) { this.http.post(this.url(`/meter-readings/${r.id}/approve`), { comments: 'Approved' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Reading approved'); this.loadMeterReadings(); }, error: () => this.notify('Approved (mock)') }); }
  approveAcquisition(a: any) { this.http.post(this.url(`/acquisitions/${a.id}/approve`), { comments: 'Approved' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Acquisition approved — WAC updated'); this.loadAcquisitions(); }, error: () => this.notify('Approved (mock)') }); }
  approveValuation(v: any) { this.http.post(this.url(`/valuations/${v.id}/approve`), { comments: 'Approved' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Valuation approved'); this.loadValuations(); }, error: () => this.notify('Approved (mock)') }); }
  approveReconciliation(rc: any) { this.http.post(this.url(`/reconciliations/${rc.id}/approve`), { comments: 'Approved' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Reconciliation approved'); this.loadReconciliations(); }, error: () => this.notify('Approved (mock)') }); }
  approveAdjustingEntry(ae: any) { this.http.post(this.url(`/adjusting-entries/${ae.id}/approve`), { comments: 'Approved' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Entry approved'); this.loadAdjustingEntries(); }, error: () => this.notify('Approved (mock)') }); }
  approvePolicyReview(pr: any) { this.http.post(this.url(`/policy-reviews/${pr.id}/approve`), { comments: 'Approved' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Policy review approved'); this.loadPolicyReviews(); }, error: () => this.notify('Approved (mock)') }); }
  approveConfig(c: any) { this.http.post(this.url(`/configuration/${c.id}/approve`), { comments: 'Approved' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Configuration approved'); this.loadConfiguration(); }, error: () => this.notify('Approved (mock)') }); }
  approveReport(rp: any) { this.http.post(this.url(`/monthly-reports/${rp.id}/approve`), { comments: 'Approved' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Report approved'); this.loadMonthlyReports(); }, error: () => this.notify('Approved (mock)') }); }
  submitReport(rp: any) { this.http.post(this.url(`/monthly-reports/${rp.id}/submit`), { submittedTo: 'Reporting Mechanism' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Report submitted to reporting mechanism'); this.loadMonthlyReports(); }, error: () => this.notify('Submitted (mock)') }); }
  cancelStocktake(s: any) { this.http.post(this.url(`/stocktakes/${s.id}/cancel`), {}, { headers: this.headers() }).subscribe({ next: () => { this.notify('Stocktake cancelled'); this.loadStocktakes(); }, error: () => this.notify('Cancelled (mock)') }); }
  viewVarianceReport(s: any) { this.http.get(this.url(`/stocktakes/${s.id}/variance-report`), { headers: this.headers() }).subscribe({ next: () => this.notify('Variance report generated'), error: () => this.notify('Variance report (mock)') }); }
  deleteAssetType(at: any) { this.http.delete(this.url(`/asset-types/${at.id}`), { headers: this.headers() }).subscribe({ next: () => { this.notify('Asset type deleted'); this.loadAssetTypes(); }, error: () => this.notify('Deleted (mock)') }); }
  handleFile(event: any) { this.notify('File selected — bulk import would be processed'); }

  loadAnalytics() {
    const nrw = this.nrwAnalytics();
    const trendRaw = nrw?.trendData || this.mockNrw().trendData;

    this.analyticsNrwSummary.set({
      currentNrw: nrw?.nrwPercentage || 34.2,
      improvement: 3.8,
      predicted: 30.5
    });

    this.analyticsRouteEfficiency.set([
      { route: 'Northern Bulk Main', efficiency: 82, volumeKl: 45000, lossKl: 8100 },
      { route: 'Southern Distribution', efficiency: 72, volumeKl: 38000, lossKl: 10640 },
      { route: 'Eastern Reticulation', efficiency: 58, volumeKl: 52000, lossKl: 21840 },
      { route: 'CBD Network', efficiency: 88, volumeKl: 28000, lossKl: 3360 },
      { route: 'Industrial Zone', efficiency: 76, volumeKl: 22000, lossKl: 5280 }
    ]);

    const totalLoss = 42500;
    this.analyticsLossCategories.set([
      { category: 'Pipe Leaks & Bursts', volumeKl: 18750, percentage: (18750 / totalLoss) * 100 },
      { category: 'Meter Inaccuracy', volumeKl: 8500, percentage: (8500 / totalLoss) * 100 },
      { category: 'Illegal Connections', volumeKl: 6375, percentage: (6375 / totalLoss) * 100 },
      { category: 'Unbilled Authorised', volumeKl: 4250, percentage: (4250 / totalLoss) * 100 },
      { category: 'Reservoir Overflow', volumeKl: 2975, percentage: (2975 / totalLoss) * 100 },
      { category: 'Other / Unaccounted', volumeKl: 1650, percentage: (1650 / totalLoss) * 100 }
    ]);

    this.analyticsCostData.set({
      currentWac: 8.45, avgTariff: 15.80, margin: 46.5,
      trend: [
        { month: 'Sep', wac: 7.92, tariff: 14.50 }, { month: 'Oct', wac: 8.05, tariff: 14.50 },
        { month: 'Nov', wac: 8.12, tariff: 15.80 }, { month: 'Dec', wac: 8.28, tariff: 15.80 },
        { month: 'Jan', wac: 8.35, tariff: 15.80 }, { month: 'Feb', wac: 8.45, tariff: 15.80 }
      ]
    });

    this.analyticsTreatmentPlants.set([
      { name: 'Outeniqua WTW', volumeKl: 95000, efficiency: 94, costPerKl: 2.93 },
      { name: 'Garden Route Dam', volumeKl: 62000, efficiency: 91, costPerKl: 3.15 },
      { name: 'Wilderness WTW', volumeKl: 28000, efficiency: 88, costPerKl: 3.45 }
    ]);

    this.analyticsAnomalies.set([
      { storagePoint: 'Garden Route Dam Outlet', route: 'Northern Bulk Main', severity: 'critical', description: 'Consumption 25.3% above 30-day moving average — possible burst main', variance: 25.3, expectedKl: 960, actualKl: 1200 },
      { storagePoint: 'Pacaltsdorp Reservoir', route: 'Eastern Reticulation', severity: 'warning', description: 'Night-flow readings indicate 14.8% above baseline — possible slow leak', variance: 14.8, expectedKl: 340, actualKl: 390 },
      { storagePoint: 'Industrial Zone Meter 7', route: 'Industrial Zone', severity: 'info', description: 'Weekend consumption anomaly detected — factory running off-hours', variance: 8.2, expectedKl: 120, actualKl: 130 }
    ]);

    this.analyticsForecast.set([
      { month: 'Mar 2026', forecastKl: 188000, confidence: 92 },
      { month: 'Apr 2026', forecastKl: 175000, confidence: 88 },
      { month: 'May 2026', forecastKl: 162000, confidence: 85 },
      { month: 'Jun 2026', forecastKl: 148000, confidence: 82 },
      { month: 'Jul 2026', forecastKl: 141000, confidence: 78 },
      { month: 'Aug 2026', forecastKl: 145000, confidence: 75 }
    ]);

    this.analyticsComplianceAreas.set([
      { area: 'Blue Drop — Drinking Water', score: 87, compliant: 14, nonCompliant: 2 },
      { area: 'Green Drop — Wastewater', score: 82, compliant: 11, nonCompliant: 3 },
      { area: 'Microbiological Standards', score: 95, compliant: 18, nonCompliant: 1 },
      { area: 'Chemical Standards', score: 89, compliant: 16, nonCompliant: 2 },
      { area: 'Meter Calibration', score: 78, compliant: 35, nonCompliant: 10 },
      { area: 'SANS 241 Compliance', score: 91, compliant: 12, nonCompliant: 1 }
    ]);
    const areas = this.analyticsComplianceAreas();
    this.analyticsOverallCompliance.set(Math.round(areas.reduce((s, a) => s + a.score, 0) / areas.length));

    this.analyticsRevenueData.set({
      totalRevenue: 21862500, totalCost: 14175000, costRecovery: 154.3,
      monthly: [
        { month: 'Sep', revenue: 3200000, cost: 2100000 }, { month: 'Oct', revenue: 3450000, cost: 2250000 },
        { month: 'Nov', revenue: 3600000, cost: 2350000 }, { month: 'Dec', revenue: 3850000, cost: 2500000 },
        { month: 'Jan', revenue: 3912500, cost: 2575000 }, { month: 'Feb', revenue: 3850000, cost: 2400000 }
      ]
    });

    this.analyticsInfraBrackets.set([
      { bracket: '0-5 years', count: 12, riskLevel: 'low', replacementCost: 8500000 },
      { bracket: '5-15 years', count: 18, riskLevel: 'low', replacementCost: 24500000 },
      { bracket: '15-25 years', count: 9, riskLevel: 'medium', replacementCost: 45000000 },
      { bracket: '25-40 years', count: 5, riskLevel: 'medium', replacementCost: 62000000 },
      { bracket: '40+ years', count: 3, riskLevel: 'high', replacementCost: 38000000 }
    ]);

    this.cdr.detectChanges();
    setTimeout(() => this.renderAnalyticsCharts(), 100);
  }

  renderAnalyticsCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    const c1 = document.getElementById('aiNrwTrendChart') as HTMLCanvasElement;
    if (c1) {
      const months = ['Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb'];
      const nrwData = months.map((_, i) => 42 - i * 0.35 + (Math.sin(i * 0.5) * 2));
      const targetData = months.map(() => 30);
      const predictedData = months.map((_, i) => i >= 18 ? nrwData[17] - (i - 17) * 0.6 : null);
      this.charts.push(new Chart(c1, {
        type: 'line', data: {
          labels: months,
          datasets: [
            { label: 'NRW %', data: nrwData, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 2 },
            { label: 'Target', data: targetData, borderColor: '#22c55e', borderDash: [5, 5], borderWidth: 1.5, pointRadius: 0, fill: false },
            { label: 'AI Predicted', data: predictedData, borderColor: '#3b82f6', borderDash: [3, 3], borderWidth: 2, pointRadius: 2, fill: false }
          ]
        }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true } } }, scales: { y: { min: 20, max: 50, ticks: { callback: (v: any) => v + '%', font: { size: 10 } } } } }
      }));
    }

    const routeData = this.analyticsRouteEfficiency();
    const c2 = document.getElementById('aiRouteEfficiencyChart') as HTMLCanvasElement;
    if (c2) {
      this.charts.push(new Chart(c2, {
        type: 'bar', data: {
          labels: routeData.map(r => r.route),
          datasets: [
            { label: 'Efficiency %', data: routeData.map(r => r.efficiency), backgroundColor: routeData.map(r => r.efficiency >= 80 ? '#86efac' : r.efficiency >= 60 ? '#fde68a' : '#fca5a5'), borderRadius: 4 },
            { label: 'Loss kl', data: routeData.map(r => r.lossKl), backgroundColor: 'rgba(239,68,68,0.3)', borderRadius: 4, yAxisID: 'y1' }
          ]
        }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true } } }, scales: { y: { min: 0, max: 100, ticks: { callback: (v: any) => v + '%', font: { size: 10 } } }, y1: { position: 'right', grid: { display: false }, ticks: { font: { size: 10 } } } } }
      }));
    }

    const lossCats = this.analyticsLossCategories();
    const c3 = document.getElementById('aiLossCategoryChart') as HTMLCanvasElement;
    if (c3) {
      this.charts.push(new Chart(c3, {
        type: 'doughnut', data: {
          labels: lossCats.map(c => c.category),
          datasets: [{ data: lossCats.map(c => c.volumeKl), backgroundColor: ['#ef4444', '#f59e0b', '#8b5cf6', '#94a3b8', '#0284c7', '#64748b'], borderWidth: 0 }]
        }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 10 }, usePointStyle: true, padding: 8 } } } }
      }));
    }

    const costData = this.analyticsCostData();
    const c4 = document.getElementById('aiCostTrendChart') as HTMLCanvasElement;
    if (c4 && costData.trend) {
      this.charts.push(new Chart(c4, {
        type: 'line', data: {
          labels: costData.trend.map((t: any) => t.month),
          datasets: [
            { label: 'WAC (R/kl)', data: costData.trend.map((t: any) => t.wac), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3 },
            { label: 'Tariff (R/kl)', data: costData.trend.map((t: any) => t.tariff), borderColor: '#3b82f6', borderWidth: 2, pointRadius: 3, fill: false }
          ]
        }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true } } }, scales: { y: { min: 5, max: 20, ticks: { callback: (v: any) => 'R' + v, font: { size: 10 } } } } }
      }));
    }

    const plants = this.analyticsTreatmentPlants();
    const c5 = document.getElementById('aiTreatmentChart') as HTMLCanvasElement;
    if (c5) {
      this.charts.push(new Chart(c5, {
        type: 'bar', data: {
          labels: plants.map(p => p.name),
          datasets: [
            { label: 'Efficiency %', data: plants.map(p => p.efficiency), backgroundColor: ['#86efac', '#93c5fd', '#c4b5fd'], borderRadius: 4, yAxisID: 'y' },
            { label: 'Cost R/kl', data: plants.map(p => p.costPerKl), backgroundColor: ['#fca5a5', '#fde68a', '#fdba74'], borderRadius: 4, yAxisID: 'y1' }
          ]
        }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true } } }, scales: { y: { min: 80, max: 100, ticks: { callback: (v: any) => v + '%', font: { size: 10 } } }, y1: { position: 'right', grid: { display: false }, ticks: { callback: (v: any) => 'R' + v, font: { size: 10 } } } } }
      }));
    }

    const forecast = this.analyticsForecast();
    const c6 = document.getElementById('aiDemandForecastChart') as HTMLCanvasElement;
    if (c6) {
      const histMonths = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
      const histData = [165000, 172000, 178000, 182000, 185000, 185000];
      const allLabels = [...histMonths, ...forecast.map(f => f.month.substring(0, 3))];
      const actualData = [...histData, ...forecast.map(() => null as any)];
      const forecastData = [...histData.map(() => null as any), ...forecast.map(f => f.forecastKl)];
      forecastData[histData.length - 1] = histData[histData.length - 1];
      this.charts.push(new Chart(c6, {
        type: 'line', data: {
          labels: allLabels,
          datasets: [
            { label: 'Actual', data: actualData, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3 },
            { label: 'AI Forecast', data: forecastData, borderColor: '#8b5cf6', borderDash: [4, 4], backgroundColor: 'rgba(139,92,246,0.08)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3 }
          ]
        }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true } } }, scales: { y: { ticks: { callback: (v: any) => (v / 1000).toFixed(0) + 'k kl', font: { size: 10 } } } } }
      }));
    }

    const revData = this.analyticsRevenueData();
    const c7 = document.getElementById('aiRevenueCostChart') as HTMLCanvasElement;
    if (c7 && revData.monthly) {
      this.charts.push(new Chart(c7, {
        type: 'bar', data: {
          labels: revData.monthly.map((m: any) => m.month),
          datasets: [
            { label: 'Revenue', data: revData.monthly.map((m: any) => m.revenue), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4 },
            { label: 'Cost', data: revData.monthly.map((m: any) => m.cost), backgroundColor: 'rgba(239,68,68,0.5)', borderRadius: 4 }
          ]
        }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true } } }, scales: { y: { ticks: { callback: (v: any) => 'R' + (v / 1000000).toFixed(1) + 'M', font: { size: 10 } } } } }
      }));
    }

    const infra = this.analyticsInfraBrackets();
    const c8 = document.getElementById('aiInfraAgeChart') as HTMLCanvasElement;
    if (c8) {
      this.charts.push(new Chart(c8, {
        type: 'bar', data: {
          labels: infra.map(b => b.bracket),
          datasets: [
            { label: 'Asset Count', data: infra.map(b => b.count), backgroundColor: infra.map(b => b.riskLevel === 'high' ? '#fca5a5' : b.riskLevel === 'medium' ? '#fde68a' : '#86efac'), borderRadius: 4 }
          ]
        }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 10 } } } } }
      }));
    }
  }

  getVariance(): number {
    if (!this.fd.previousReading || this.fd.previousReading === 0) return 0;
    return Math.abs(((this.fd.currentReading - this.fd.previousReading) - this.fd.previousReading) / this.fd.previousReading * 100);
  }

  notify(msg: string, type: 'success' | 'error' = 'success') {
    this.notification.set(msg);
    this.notificationType.set(type);
    setTimeout(() => this.notification.set(''), 5000);
  }

  formatDate(d: string | undefined): string { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; } }
  formatNum(n: number | undefined): string { return (n || 0).toLocaleString('en-ZA', { maximumFractionDigits: 0 }); }
  formatRand(n: number | undefined): string { return 'R' + (n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  getMonthName(m: number): string { return this.months.find(x => x.v === m)?.l || ''; }

  renderCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    const nrw = this.nrwAnalytics();
    const trendData = nrw?.trendData || this.mockNrw().trendData;

    const c1 = document.getElementById('nrwTrendChart') as HTMLCanvasElement;
    if (c1) {
      this.charts.push(new Chart(c1, {
        type: 'line', data: {
          labels: trendData.map((d: any) => d.month),
          datasets: [
            { label: 'NRW %', data: trendData.map((d: any) => d.nrw), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3 },
            { label: 'Target', data: trendData.map((d: any) => d.target), borderColor: '#22c55e', borderDash: [5, 5], borderWidth: 1.5, pointRadius: 0, fill: false }
          ]
        }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true } } }, scales: { y: { min: 0, max: 60, ticks: { callback: (v: any) => v + '%', font: { size: 10 } } } } }
      }));
    }

    const c2 = document.getElementById('waterBalanceChart') as HTMLCanvasElement;
    if (c2) {
      this.charts.push(new Chart(c2, {
        type: 'doughnut', data: {
          labels: ['Billed', 'Physical Loss', 'Commercial Loss', 'Unbilled Auth.'],
          datasets: [{ data: [nrw?.totalBilledMl || 60, nrw?.physicalLossMl || 18, nrw?.commercialLossMl || 12, nrw?.unbilledAuthorisedMl || 10], backgroundColor: ['#22c55e', '#ef4444', '#f59e0b', '#94a3b8'], borderWidth: 0 }]
        }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true } } } }
      }));
    }

    const routeData = nrw?.routeBreakdown || this.mockNrw().routeBreakdown;
    const c3 = document.getElementById('routeNrwChart') as HTMLCanvasElement;
    if (c3) {
      this.charts.push(new Chart(c3, {
        type: 'bar', data: {
          labels: routeData.map((r: any) => r.route),
          datasets: [{ label: 'NRW %', data: routeData.map((r: any) => r.nrw), backgroundColor: routeData.map((r: any) => r.nrw > 30 ? '#fca5a5' : '#86efac'), borderRadius: 4 }]
        }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { max: 50, ticks: { callback: (v: any) => v + '%' } } } }
      }));
    }

    const c4 = document.getElementById('treatmentChart') as HTMLCanvasElement;
    if (c4) {
      const ts = this.treatmentSummary();
      const pd = ts?.plantData || [{ name: 'Outeniqua WTW', efficiency: 94 }, { name: 'Garden Route Dam', efficiency: 91 }, { name: 'Wilderness WTW', efficiency: 88 }];
      this.charts.push(new Chart(c4, {
        type: 'bar', data: {
          labels: pd.map((p: any) => p.name),
          datasets: [{ label: 'Efficiency %', data: pd.map((p: any) => p.efficiency), backgroundColor: ['#93c5fd', '#a5b4fc', '#c4b5fd'], borderRadius: 4 }]
        }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 80, max: 100, ticks: { callback: (v: any) => v + '%' } } } }
      }));
    }
  }

  mockDashboard() { return { totalStoragePoints: 47, totalCapacityKl: 185000, currentVolumeKl: 142500, utilisationPercent: 77, totalValueZar: 1203750, wacPerKl: 8.45, pendingReadings: 12, pendingStocktakes: 2, nrwPercentage: 34.2, blueDropScore: 87.5, greenDropScore: 82.3, activeAlerts: 5, meterReadingsThisMonth: 156, acquisitionsThisMonth: 3, distributionsThisMonth: 890, lossesThisMonthKl: 4850 }; }
  mockNrw() { return { totalProducedMl: 2450, totalBilledMl: 1612, totalLostMl: 838, nrwPercentage: 34.2, physicalLossMl: 502, commercialLossMl: 251, unbilledAuthorisedMl: 85, blueDropTarget: 30, nationalAverage: 41, trendData: ['Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb'].map((m,i) => ({ month: m, nrw: 38 - i*0.4 + Math.random()*3, target: 30 })), routeBreakdown: [{ route: 'Northern Bulk', nrw: 28, volume: 800 }, { route: 'Southern Dist.', nrw: 36, volume: 650 }, { route: 'Eastern Retic.', nrw: 42, volume: 500 }, { route: 'CBD Network', nrw: 22, volume: 300 }, { route: 'Industrial Zone', nrw: 31, volume: 200 }] }; }
  mockReadings() { return [{ id: 1, storagePointName: 'Outeniqua Reservoir', routeName: 'Northern Bulk Main', readingDate: '2026-02-20', previousReading: 14500, currentReading: 14850, consumptionKl: 350, variancePercent: 8.2, varianceFlagged: false, status: 'approved' }, { id: 2, storagePointName: 'Garden Route Dam Outlet', routeName: 'Northern Bulk Main', readingDate: '2026-02-20', previousReading: 28000, currentReading: 29200, consumptionKl: 1200, variancePercent: 25.3, varianceFlagged: true, status: 'flagged' }, { id: 3, storagePointName: 'Wilderness WTW', routeName: 'Southern Distribution', readingDate: '2026-02-21', previousReading: 8200, currentReading: 8580, consumptionKl: 380, variancePercent: 5.1, varianceFlagged: false, status: 'pending' }]; }
  mockStocktakes() { return [{ id: 1, referenceNumber: 'WST-2026-001', stocktakeDate: '2026-02-15', routeName: 'Northern Bulk Main', status: 'approved', totalPoints: 12, countedPoints: 12, varianceCount: 2, varianceValueZar: 4250 }, { id: 2, referenceNumber: 'WST-2026-002', stocktakeDate: '2026-02-22', routeName: 'Southern Distribution', status: 'counted', totalPoints: 8, countedPoints: 6, varianceCount: 0, varianceValueZar: 0 }]; }
  mockAcquisitions() { return [{ id: 1, referenceNumber: 'WAQ-2026-001', acquisitionDate: '2026-02-10', sourceType: 'water_board', sourceName: 'Garden Route District Municipality', volumeKl: 15000, unitCostZar: 7.85, transportCostZar: 2500, treatmentCostZar: 18000, totalAcquisitionCostZar: 138250, wacBefore: 8.32, wacAfter: 8.45, status: 'approved' }]; }
  mockDistributions() { return [{ id: 1, referenceNumber: 'WDS-2026-001', distributionDate: '2026-02-20', fromStoragePoint: 'Outeniqua Reservoir', toConsumer: 'George CBD', consumerType: 'commercial', volumeKl: 2500, wacPerKl: 8.45, totalValueZar: 21125, tariffPerKl: 15.80, revenueZar: 39500, status: 'completed' }]; }
  mockLosses() { return [{ id: 1, periodMonth: 2, periodYear: 2026, routeName: 'All Routes', totalProducedKl: 185000, totalDistributedKl: 142500, totalBilledKl: 121725, physicalLossKl: 25530, commercialLossKl: 12765, unbilledAuthorisedKl: 4205, totalLossKl: 42500, lossPercentage: 22.97, nrwPercentage: 34.2, valueLostZar: 359125, status: 'completed' }]; }
  mockTreatment() { return [{ id: 1, treatmentPlantName: 'Outeniqua WTW', periodMonth: 2, periodYear: 2026, rawWaterVolumeKl: 95000, treatedVolumeKl: 89300, outputVolumeKl: 88500, processLossKl: 6500, processLossPercent: 6.8, chemicalCostZar: 125000, energyCostZar: 89000, labourCostZar: 45000, totalCostZar: 259000, costPerKlZar: 2.93 }]; }
  mockValuations() { return [{ id: 1, referenceNumber: 'WVL-2026-002', valuationDate: '2026-02-28', periodMonth: 2, periodYear: 2026, totalVolumeKl: 142500, wacPerKl: 8.45, carryingValueZar: 1204125, nrvPerKl: 12.50, nrvTotalZar: 1781250, writeDownRequiredZar: 0, grapCompliant: true, status: 'approved' }]; }
  mockReconciliations() { return [{ id: 1, referenceNumber: 'WRC-2026-002', periodMonth: 2, periodYear: 2026, openingBalanceKl: 138000, openingValueZar: 1165650, acquisitionsKl: 15000, acquisitionsZar: 138250, distributionsKl: 2500, distributionsZar: 21125, lossesKl: 8000, lossesZar: 67600, adjustmentsKl: 0, adjustmentsZar: 0, closingBalanceKl: 142500, closingValueZar: 1215175, varianceKl: 0, varianceZar: 0, isBalanced: true, status: 'approved' }]; }
  mockCompliance() { return [{ id: 1, complianceType: 'Blue Drop', assessmentDate: '2026-01-15', overallScore: 87.5, drinkingWaterScore: 91.2, wastewaterScore: null, microbiologicalCompliance: 94.8, chemicalCompliance: 89.1, status: 'completed', findings: 'Minor issues with chlorine residual monitoring at 2 distribution points', correctiveActions: 'Install continuous chlorine monitors at identified points', nextAssessmentDate: '2026-07-15' }, { id: 2, complianceType: 'Green Drop', assessmentDate: '2026-01-15', overallScore: 82.3, drinkingWaterScore: null, wastewaterScore: 82.3, microbiologicalCompliance: 85.6, chemicalCompliance: 79.0, status: 'completed', findings: 'Effluent quality at Wilderness WWTW below standard', correctiveActions: 'Upgrade biological nutrient removal capacity', nextAssessmentDate: '2026-07-15' }]; }
  mockRoutes() { return [{ id: 1, routeName: 'Northern Bulk Main', description: 'Garden Route Dam to George CBD', nodeCount: 12, enabled: true }, { id: 2, routeName: 'Southern Distribution', description: 'Outeniqua WTW to Wilderness', nodeCount: 8, enabled: true }, { id: 3, routeName: 'Eastern Reticulation', description: 'Pacaltsdorp and Rosemoore reticulation', nodeCount: 15, enabled: true }]; }
}
