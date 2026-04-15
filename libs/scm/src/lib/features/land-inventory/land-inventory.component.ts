import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
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
import { environment } from '../../environment';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-land-inventory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatTabsModule, MatChipsModule, MatBadgeModule, MatCheckboxModule, MatSlideToggleModule, MatProgressBarModule],
  templateUrl: './land-inventory.component.html',
  styleUrl: './land-inventory.component.scss'
})
export class LandInventoryComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl + '/scm/land-inventory';
  private charts: Chart[] = [];
  private currentFY = '2025/2026';

  activeTab = signal('dashboard');
  txSection = signal('acquisitions');
  finSection = signal('valuations');
  compSection = signal('policies');

  notification = signal('');
  notificationType = signal<'success' | 'error'>('success');
  formMode = signal('');
  editItem: any = null;
  fd: any = {};
  page = signal(1);
  totalParcels = signal(0);

  dash = signal<any>({});
  parcels = signal<any[]>([]);
  acquisitions = signal<any[]>([]);
  transfers = signal<any[]>([]);
  distributions = signal<any[]>([]);
  reclassifications = signal<any[]>([]);
  councilResolutions = signal<any[]>([]);
  valuations = signal<any[]>([]);
  impairments = signal<any[]>([]);
  reconciliations = signal<any[]>([]);
  adjustingEntries = signal<any[]>([]);
  workingPapers = signal<any[]>([]);
  environmentalAssessments = signal<any[]>([]);
  servitudes = signal<any[]>([]);
  policyReviews = signal<any[]>([]);
  configuration = signal<any[]>([]);
  monthlyReports = signal<any[]>([]);

  byWard = signal<any[]>([]);
  byZoning = signal<any[]>([]);

  showAiPanel = signal(true);
  landInsights = signal<any[]>([]);
  analyticsZoning = signal<any[]>([]);
  analyticsNrvRisks = signal<any[]>([]);
  analyticsAcqDispData = signal<any>({});
  analyticsWardData = signal<any[]>([]);
  analyticsImpairmentData = signal<any[]>([]);
  analyticsEnvData = signal<any>({});
  analyticsDisposalData = signal<any[]>([]);
  analyticsComplianceData = signal<any[]>([]);
  analyticsOverallCompliance = signal(0);
  analyticsServitudeData = signal<any[]>([]);

  filterZoning = '';
  filterWard = '';
  filterOwnership = '';
  filterSearch = '';

  zoningOptions = ['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Mixed Use', 'Public Open Space', 'Institutional', 'Undetermined'];
  landUseOptions = ['Held for Sale', 'Held for Development', 'Held for Housing', 'Held for Community Facilities', 'Held for Infrastructure', 'Undeveloped', 'Commonage'];
  wardOptions = ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5', 'Ward 6', 'Ward 7', 'Ward 8', 'Ward 9', 'Ward 10', 'Ward 11', 'Ward 12', 'Ward 13'];
  ownershipOptions = ['Registered Owner', 'Pending Transfer', 'Expropriated', 'Custodian', 'Disputed'];
  classificationOptions = ['Inventory - Held for Sale', 'Inventory - Held for Development', 'Inventory - Housing Projects', 'Inventory - Land Reform', 'Investment Property', 'PPE - Community'];
  purposeOptions = ['Sale in ordinary course', 'Development for sale', 'Housing delivery', 'Community facilities', 'Infrastructure development', 'Land reform', 'Strategic reserve'];
  acquisitionMethods = ['Purchase', 'Donation', 'Expropriation', 'Land Reform Transfer', 'State Grant', 'Vesting', 'Exchange'];

  ngOnInit() {
    this.loadDashboard();
    this.loadInsights();
  }

  ngOnDestroy() { this.charts.forEach(c => c.destroy()); }

  private url(path: string) { return this.baseUrl + path; }
  private headers(): Record<string, string> { const t = localStorage.getItem('token'); return t ? { Authorization: `Bearer ${t}` } : {}; }

  switchTab(tab: string) {
    this.activeTab.set(tab);
    if (tab === 'dashboard') { this.loadDashboard(); this.loadInsights(); }
    else if (tab === 'register') { this.loadParcels(); }
    else if (tab === 'transactions') { this.loadForTxSection(this.txSection()); }
    else if (tab === 'financial') { this.loadForFinSection(this.finSection()); }
    else if (tab === 'compliance') { this.loadForCompSection(this.compSection()); }
    else if (tab === 'analytics') { this.loadAnalytics(); }
    else if (tab === 'reports') { this.loadMonthlyReports(); }
  }

  loadForTxSection(s: string) {
    if (s === 'acquisitions') this.loadAcquisitions();
    else if (s === 'transfers') this.loadTransfers();
    else if (s === 'distributions') this.loadDistributions();
    else if (s === 'reclassifications') this.loadReclassifications();
    else if (s === 'council') this.loadCouncilResolutions();
  }

  loadForFinSection(s: string) {
    if (s === 'valuations') this.loadValuations();
    else if (s === 'impairments') this.loadImpairments();
    else if (s === 'reconciliations') this.loadReconciliations();
    else if (s === 'adjustments') this.loadAdjustingEntries();
    else if (s === 'workingpapers') this.loadWorkingPapers();
  }

  loadForCompSection(s: string) {
    if (s === 'environmental') this.loadEnvironmentalAssessments();
    else if (s === 'servitudes') this.loadServitudes();
    else if (s === 'policies') this.loadPolicyReviews();
    else if (s === 'config') this.loadConfiguration();
  }

  loadDashboard() {
    this.http.get<any>(this.url('/dashboard'), { headers: this.headers(), params: { finYear: this.currentFY } }).subscribe({
      next: d => { this.dash.set(d || {}); this.loadChartData(); },
      error: () => { this.dash.set(this.mockDashboard()); this.loadChartData(); }
    });
  }

  loadChartData() {
    this.http.get<any>(this.url('/dashboard/by-ward'), { headers: this.headers(), params: { finYear: this.currentFY } }).subscribe({
      next: d => { this.byWard.set(d?.byWard || []); setTimeout(() => this.renderCharts(), 200); },
      error: () => { this.byWard.set(this.mockByWard()); setTimeout(() => this.renderCharts(), 200); }
    });
    this.http.get<any>(this.url('/dashboard/by-zoning'), { headers: this.headers(), params: { finYear: this.currentFY } }).subscribe({
      next: d => this.byZoning.set(d?.byZoning || []),
      error: () => this.byZoning.set(this.mockByZoning())
    });
  }

  loadParcels() {
    const p: any = { page: this.page(), pageSize: 50, finYear: this.currentFY };
    if (this.filterZoning) p.zoningClassification = this.filterZoning;
    if (this.filterWard) p.ward = this.filterWard;
    if (this.filterOwnership) p.ownershipStatus = this.filterOwnership;
    if (this.filterSearch) p.search = this.filterSearch;
    this.http.get<any>(this.url(''), { headers: this.headers(), params: p }).subscribe({
      next: r => { this.parcels.set(r?.data || []); this.totalParcels.set(r?.totalCount || 0); },
      error: () => { this.parcels.set(this.mockParcels()); this.totalParcels.set(this.mockParcels().length); }
    });
  }

  loadAcquisitions() {
    this.http.get<any>(this.url('/acquisitions'), { headers: this.headers(), params: { finYear: this.currentFY } }).subscribe({
      next: r => this.acquisitions.set(r?.data || r || []),
      error: () => this.acquisitions.set(this.mockAcquisitions())
    });
  }

  loadTransfers() {
    this.http.get<any>(this.url('/transfers'), { headers: this.headers(), params: { finYear: this.currentFY } }).subscribe({
      next: r => this.transfers.set(r?.data || r || []),
      error: () => this.transfers.set(this.mockTransfers())
    });
  }

  loadDistributions() {
    this.http.get<any>(this.url('/distributions'), { headers: this.headers(), params: { finYear: this.currentFY } }).subscribe({
      next: r => this.distributions.set(r?.data || r || []),
      error: () => this.distributions.set(this.mockDistributions())
    });
  }

  loadReclassifications() {
    this.http.get<any>(this.url('/reclassifications'), { headers: this.headers() }).subscribe({
      next: r => this.reclassifications.set(r?.data || r || []),
      error: () => this.reclassifications.set(this.mockReclassifications())
    });
  }

  loadCouncilResolutions() {
    this.http.get<any>(this.url('/council-resolutions'), { headers: this.headers() }).subscribe({
      next: r => this.councilResolutions.set(r?.data || r || []),
      error: () => this.councilResolutions.set(this.mockCouncilResolutions())
    });
  }

  loadValuations() {
    this.http.get<any>(this.url('/valuations'), { headers: this.headers(), params: { finYear: this.currentFY } }).subscribe({
      next: r => this.valuations.set(r?.data || r || []),
      error: () => this.valuations.set(this.mockValuations())
    });
  }

  loadImpairments() {
    this.http.get<any>(this.url('/impairments'), { headers: this.headers(), params: { finYear: this.currentFY } }).subscribe({
      next: r => this.impairments.set(r?.data || r || []),
      error: () => this.impairments.set(this.mockImpairments())
    });
  }

  loadReconciliations() {
    this.http.get<any>(this.url('/reconciliations'), { headers: this.headers(), params: { finYear: this.currentFY } }).subscribe({
      next: r => this.reconciliations.set(r?.data || r || []),
      error: () => this.reconciliations.set(this.mockReconciliations())
    });
  }

  loadAdjustingEntries() {
    this.http.get<any>(this.url('/adjusting-entries'), { headers: this.headers(), params: { finYear: this.currentFY } }).subscribe({
      next: r => this.adjustingEntries.set(r?.data || r || []),
      error: () => this.adjustingEntries.set(this.mockAdjustingEntries())
    });
  }

  loadWorkingPapers() {
    this.http.get<any>(this.url('/working-papers'), { headers: this.headers(), params: { finYear: this.currentFY } }).subscribe({
      next: r => this.workingPapers.set(r?.data || r || []),
      error: () => this.workingPapers.set(this.mockWorkingPapers())
    });
  }

  loadEnvironmentalAssessments() {
    this.http.get<any>(this.url('/environmental-assessments'), { headers: this.headers() }).subscribe({
      next: r => this.environmentalAssessments.set(r?.data || r || []),
      error: () => this.environmentalAssessments.set(this.mockEnvironmental())
    });
  }

  loadServitudes() {
    this.http.get<any>(this.url('/servitudes'), { headers: this.headers() }).subscribe({
      next: r => this.servitudes.set(r?.data || r || []),
      error: () => this.servitudes.set(this.mockServitudes())
    });
  }

  loadPolicyReviews() {
    this.http.get<any>(this.url('/policy-reviews'), { headers: this.headers() }).subscribe({
      next: r => this.policyReviews.set(r?.data || r || []),
      error: () => this.policyReviews.set(this.mockPolicyReviews())
    });
  }

  loadConfiguration() {
    this.http.get<any>(this.url('/configuration'), { headers: this.headers() }).subscribe({
      next: r => this.configuration.set(r?.data || r || []),
      error: () => this.configuration.set(this.mockConfiguration())
    });
  }

  loadMonthlyReports() {
    this.http.get<any>(this.url('/monthly-reports'), { headers: this.headers(), params: { finYear: this.currentFY } }).subscribe({
      next: r => this.monthlyReports.set(r?.data || r || []),
      error: () => this.monthlyReports.set(this.mockMonthlyReports())
    });
  }

  loadInsights() {
    this.http.get<any>(this.url('/ai/insights'), { headers: this.headers() }).subscribe({
      next: r => this.landInsights.set(r?.insights || r?.data || this.mockInsights()),
      error: () => this.landInsights.set(this.mockInsights())
    });
  }

  mockInsights(): any[] {
    return [
      { id: 1, severity: 'critical', title: 'NRV Write-Down Required', message: '4 parcels have carrying value exceeding NRV — R1.3M write-down needed per GRAP 12.28', icon: 'warning', color: '#dc2626', legislation: 'GRAP 12' },
      { id: 2, severity: 'high', title: 'Overdue Valuations', message: '12 parcels have not been valued in the current financial year as required by policy', icon: 'schedule', color: '#f59e0b', legislation: 'MFMA s63' },
      { id: 3, severity: 'medium', title: 'Pending Council Resolutions', message: '3 disposal transactions awaiting Council approval per MFMA s14 requirements', icon: 'gavel', color: '#3b82f6', legislation: 'MFMA s14' },
      { id: 4, severity: 'info', title: 'Transfer Opportunities', message: '5 parcels held for sale >3 years may need reclassification review per GRAP 12.8', icon: 'swap_horiz', color: '#10b981', legislation: 'GRAP 12' },
      { id: 5, severity: 'medium', title: 'Environmental Assessments Due', message: '8 parcels require environmental impact updates before disposal can proceed', icon: 'eco', color: '#3b82f6', legislation: 'NEMA' },
      { id: 6, severity: 'info', title: 'mSCOA Alignment', message: 'All land inventory items validated against mSCOA segment structure — 100% compliant', icon: 'verified', color: '#10b981', legislation: 'mSCOA' }
    ];
  }

  loadAnalytics() {
    const parcels = this.parcels().length ? this.parcels() : this.mockParcels();
    const valuations = this.valuations().length ? this.valuations() : this.mockValuations();
    const acquisitions = this.acquisitions().length ? this.acquisitions() : this.mockAcquisitions();
    const distributions = this.distributions().length ? this.distributions() : this.mockDistributions();
    const envAssessments = this.environmentalAssessments().length ? this.environmentalAssessments() : this.mockEnvironmental();
    const servitudeList = this.servitudes().length ? this.servitudes() : this.mockServitudes();
    const impairmentList = this.impairments().length ? this.impairments() : this.mockImpairments();

    const totalValue = parcels.reduce((s: number, p: any) => s + (p.carryingValue || 0), 0);
    const zoningGroups: Record<string, { parcelCount: number; totalValue: number }> = {};
    parcels.forEach((p: any) => {
      const z = p.zoningClassification || 'Unknown';
      if (!zoningGroups[z]) zoningGroups[z] = { parcelCount: 0, totalValue: 0 };
      zoningGroups[z].parcelCount++;
      zoningGroups[z].totalValue += (p.carryingValue || 0);
    });
    this.analyticsZoning.set(Object.entries(zoningGroups).map(([zoning, d]) => ({
      zoning, parcelCount: d.parcelCount, totalValue: d.totalValue,
      percentOfValue: totalValue > 0 ? Math.round((d.totalValue / totalValue) * 1000) / 10 : 0
    })));

    this.analyticsNrvRisks.set(
      parcels.filter((p: any) => p.requiresWriteDown || (p.nrv && p.carryingValue > p.nrv)).map((p: any) => ({
        erfNumber: p.erfNumber, zoning: p.zoningClassification,
        carryingValue: p.carryingValue, nrv: p.nrv || p.carryingValue,
        writeDown: Math.max(0, (p.carryingValue || 0) - (p.nrv || p.carryingValue)),
        risk: ((p.carryingValue || 0) - (p.nrv || p.carryingValue)) > 1000000 ? 'Critical' : ((p.carryingValue || 0) - (p.nrv || p.carryingValue)) > 500000 ? 'High' : ((p.carryingValue || 0) - (p.nrv || p.carryingValue)) > 100000 ? 'Medium' : 'Low'
      }))
    );

    this.analyticsAcqDispData.set({
      totalAcquired: acquisitions.length, totalDisposed: distributions.length,
      netGainLoss: distributions.reduce((s: number, d: any) => s + (d.gainLoss || d.gainOrLoss || 0), 0),
      acquiredValue: acquisitions.reduce((s: number, a: any) => s + (a.totalCost || a.purchasePrice || 0), 0),
      disposedValue: distributions.reduce((s: number, d: any) => s + (d.salePrice || d.sellingPrice || 0), 0)
    });

    const wardGroups: Record<string, { parcels: number; hectares: number; value: number }> = {};
    parcels.forEach((p: any) => {
      const w = p.municipalWard || 'Unknown';
      if (!wardGroups[w]) wardGroups[w] = { parcels: 0, hectares: 0, value: 0 };
      wardGroups[w].parcels++;
      wardGroups[w].hectares += (p.extentHectares || 0);
      wardGroups[w].value += (p.carryingValue || 0);
    });
    this.analyticsWardData.set(Object.entries(wardGroups).map(([ward, d]) => ({ ward, ...d })));

    const impGroups: Record<string, { count: number; totalLoss: number }> = {};
    impairmentList.forEach((imp: any) => {
      const t = imp.impairmentType || imp.impairmentReason?.split(' ')[0] || 'Other';
      if (!impGroups[t]) impGroups[t] = { count: 0, totalLoss: 0 };
      impGroups[t].count++;
      impGroups[t].totalLoss += (imp.impairmentLoss || 0);
    });
    if (Object.keys(impGroups).length === 0) {
      impGroups['Environmental'] = { count: 3, totalLoss: 2800000 };
      impGroups['Physical Damage'] = { count: 1, totalLoss: 450000 };
      impGroups['Market Decline'] = { count: 2, totalLoss: 1200000 };
      impGroups['Legal Encumbrance'] = { count: 1, totalLoss: 350000 };
    }
    this.analyticsImpairmentData.set(Object.entries(impGroups).map(([type, d]) => ({ type, ...d })));

    const highRisk = envAssessments.filter((e: any) => e.riskRating === 'High' || e.remediationRequired).length;
    const lowRisk = envAssessments.filter((e: any) => e.riskRating === 'Low').length;
    const medRisk = Math.max(0, envAssessments.length - highRisk - lowRisk);
    this.analyticsEnvData.set({
      totalAssessments: envAssessments.length, compliant: envAssessments.filter((e: any) => e.statusID === 2).length,
      nonCompliant: envAssessments.filter((e: any) => e.statusID !== 2).length, highRisk, mediumRisk: medRisk, lowRisk
    });

    this.analyticsDisposalData.set([
      { period: '2023/2024', disposals: 2, netGainLoss: 850000 },
      { period: '2024/2025', disposals: 1, netGainLoss: -1800000 },
      { period: '2025/2026', disposals: distributions.length,
        netGainLoss: distributions.reduce((s: number, d: any) => s + (d.gainLoss || d.gainOrLoss || 0), 0) }
    ]);

    const parcelsWithTitle = parcels.filter((p: any) => p.titleDeedNumber).length;
    const parcelsWithScoa = parcels.filter((p: any) => p.scoaItemSegment).length;
    const parcelsWithValuation = valuations.length;
    const parcelsWithClassification = parcels.filter((p: any) => p.classificationCategory || p.heldForPurpose).length;
    const parcelsWithEnv = envAssessments.length;
    const approvedDisposals = distributions.filter((d: any) => d.statusID === 2 && d.councilResolutionRef).length;
    const totalDisposals = distributions.length;

    const grap12Score = parcelsWithValuation > 0 ? Math.min(100, Math.round((parcelsWithValuation / Math.max(parcels.length, 1)) * 100 + (valuations.filter((v: any) => v.statusID === 2).length / Math.max(parcelsWithValuation, 1)) * 10)) : 85;
    const grap17Score = parcels.length > 0 ? Math.round((parcelsWithClassification / parcels.length) * 100) : 80;
    const mfmaScore = totalDisposals > 0 ? Math.round((approvedDisposals / totalDisposals) * 100) : 75;
    const mscoaScore = parcels.length > 0 ? Math.round((parcelsWithScoa / parcels.length) * 100) : 90;
    const titleScore = parcels.length > 0 ? Math.round((parcelsWithTitle / parcels.length) * 100) : 90;
    const envScore = parcels.length > 0 ? Math.min(100, Math.round((parcelsWithEnv / Math.max(parcels.filter((p: any) => p.zoningClassification === 'Industrial' || p.zoningClassification === 'Agricultural').length, 1)) * 100)) : 70;

    const complianceAreas = [
      { area: 'GRAP 12 Valuation', score: grap12Score, compliant: parcelsWithValuation, nonCompliant: Math.max(0, parcels.length - parcelsWithValuation) },
      { area: 'GRAP 17 PPE Classification', score: grap17Score, compliant: parcelsWithClassification, nonCompliant: Math.max(0, parcels.length - parcelsWithClassification) },
      { area: 'MFMA s14 Disposal', score: mfmaScore, compliant: approvedDisposals, nonCompliant: Math.max(0, totalDisposals - approvedDisposals) },
      { area: 'mSCOA Alignment', score: mscoaScore, compliant: parcelsWithScoa, nonCompliant: Math.max(0, parcels.length - parcelsWithScoa) },
      { area: 'Title Deed Registration', score: titleScore, compliant: parcelsWithTitle, nonCompliant: Math.max(0, parcels.length - parcelsWithTitle) },
      { area: 'Environmental Compliance', score: envScore, compliant: envAssessments.filter((e: any) => e.statusID === 2).length, nonCompliant: envAssessments.filter((e: any) => e.statusID !== 2).length }
    ];
    this.analyticsComplianceData.set(complianceAreas);
    this.analyticsOverallCompliance.set(Math.round(complianceAreas.reduce((s, a) => s + a.score, 0) / complianceAreas.length));

    const servGroups: Record<string, { count: number; affectedHectares: number; valueImpact: number }> = {};
    servitudeList.forEach((s: any) => {
      const t = s.servitudeType || 'Other';
      if (!servGroups[t]) servGroups[t] = { count: 0, affectedHectares: 0, valueImpact: 0 };
      servGroups[t].count++;
      servGroups[t].affectedHectares += (s.areaHectares || s.widthMetres ? (s.widthMetres || 10) * 0.01 : 5);
    });
    if (Object.keys(servGroups).length === 0) {
      servGroups['Water Pipeline'] = { count: 5, affectedHectares: 45, valueImpact: -2500000 };
      servGroups['Power Line'] = { count: 8, affectedHectares: 62, valueImpact: -3800000 };
      servGroups['Road Reserve'] = { count: 3, affectedHectares: 28, valueImpact: -1200000 };
      servGroups['Conservation'] = { count: 2, affectedHectares: 120, valueImpact: -5500000 };
    } else {
      Object.values(servGroups).forEach(sg => { sg.valueImpact = -(sg.affectedHectares * 50000); });
    }
    this.analyticsServitudeData.set(Object.entries(servGroups).map(([type, d]) => ({ type, ...d })));

    setTimeout(() => this.renderAnalyticsCharts(), 300);
  }

  renderAnalyticsCharts() {
    const pastel = ['#c4b5fd', '#93c5fd', '#a5b4fc', '#86efac', '#fcd34d', '#fca5a5', '#fdba74'];
    const chartOpts = (extra: any = {}) => ({ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 11 }, usePointStyle: true } } }, ...extra });

    const zoningCanvas = document.getElementById('analyticsZoningChart') as HTMLCanvasElement;
    if (zoningCanvas) {
      const zd = this.analyticsZoning();
      this.charts.push(new Chart(zoningCanvas, {
        type: 'doughnut', data: { labels: zd.map(z => z.zoning), datasets: [{ data: zd.map(z => z.parcelCount), backgroundColor: pastel, borderWidth: 0 }] },
        options: chartOpts()
      }));
    }

    const trendCanvas = document.getElementById('analyticsValueTrendChart') as HTMLCanvasElement;
    if (trendCanvas) {
      const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
      const baseVal = 118;
      const trendData = months.map((_, i) => baseVal + Math.round((i * 0.8 + Math.sin(i) * 2) * 10) / 10);
      this.charts.push(new Chart(trendCanvas, {
        type: 'line', data: {
          labels: months,
          datasets: [{ label: 'Carrying Value (R M)', data: trendData, borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)', fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#8b5cf6' }]
        }, options: { ...chartOpts({ plugins: { legend: { display: false } } }), scales: { y: { ticks: { callback: (v: any) => 'R' + v + 'M' } } } }
      }));
    }

    const nrvCanvas = document.getElementById('analyticsNrvRiskChart') as HTMLCanvasElement;
    if (nrvCanvas) {
      const risks = this.analyticsNrvRisks();
      if (risks.length) {
        this.charts.push(new Chart(nrvCanvas, {
          type: 'bar', data: {
            labels: risks.map(r => r.erfNumber),
            datasets: [
              { label: 'Carrying Value', data: risks.map(r => r.carryingValue), backgroundColor: '#93c5fd', borderRadius: 4 },
              { label: 'NRV', data: risks.map(r => r.nrv), backgroundColor: '#86efac', borderRadius: 4 },
              { label: 'Write-Down', data: risks.map(r => r.writeDown), backgroundColor: '#fca5a5', borderRadius: 4 }
            ]
          }, options: { ...chartOpts(), scales: { y: { ticks: { callback: (v: any) => 'R' + (v / 1000000).toFixed(1) + 'M' } } } }
        }));
      }
    }

    const acqDispCanvas = document.getElementById('analyticsAcqDispChart') as HTMLCanvasElement;
    if (acqDispCanvas) {
      this.charts.push(new Chart(acqDispCanvas, {
        type: 'bar', data: {
          labels: ['2023/2024', '2024/2025', '2025/2026'],
          datasets: [
            { label: 'Acquired', data: [3, 4, this.analyticsAcqDispData().totalAcquired || 5], backgroundColor: '#86efac', borderRadius: 4 },
            { label: 'Disposed', data: [2, 1, this.analyticsAcqDispData().totalDisposed || 3], backgroundColor: '#fca5a5', borderRadius: 4 }
          ]
        }, options: chartOpts()
      }));
    }

    const wardCanvas = document.getElementById('analyticsWardChart') as HTMLCanvasElement;
    if (wardCanvas) {
      const wd = this.analyticsWardData();
      this.charts.push(new Chart(wardCanvas, {
        type: 'bar', data: {
          labels: wd.map(w => w.ward),
          datasets: [
            { label: 'Value (R M)', data: wd.map(w => w.value / 1000000), backgroundColor: '#a5b4fc', borderRadius: 4, yAxisID: 'y' },
            { label: 'Hectares', data: wd.map(w => w.hectares), backgroundColor: '#fcd34d', borderRadius: 4, yAxisID: 'y1' }
          ]
        }, options: { ...chartOpts(), scales: { y: { position: 'left' as const, title: { display: true, text: 'Value (R M)' } }, y1: { position: 'right' as const, title: { display: true, text: 'Hectares' }, grid: { drawOnChartArea: false } } } }
      }));
    }

    const impairCanvas = document.getElementById('analyticsImpairmentChart') as HTMLCanvasElement;
    if (impairCanvas) {
      const id = this.analyticsImpairmentData();
      this.charts.push(new Chart(impairCanvas, {
        type: 'bar', data: { labels: id.map(i => i.type), datasets: [{ label: 'Loss (R)', data: id.map(i => i.totalLoss), backgroundColor: ['#fca5a5', '#fdba74', '#fcd34d', '#c4b5fd'], borderRadius: 4 }] },
        options: { indexAxis: 'y' as const, ...chartOpts({ plugins: { legend: { display: false } } }), scales: { x: { ticks: { callback: (v: any) => 'R' + (v / 1000000).toFixed(1) + 'M' } } } }
      }));
    }

    const envCanvas = document.getElementById('analyticsEnvRiskChart') as HTMLCanvasElement;
    if (envCanvas) {
      const ed = this.analyticsEnvData();
      this.charts.push(new Chart(envCanvas, {
        type: 'doughnut', data: {
          labels: ['Compliant', 'Non-Compliant', 'Pending'],
          datasets: [{ data: [ed.compliant || 0, ed.nonCompliant || 0, ed.pending || 0], backgroundColor: ['#86efac', '#fca5a5', '#fcd34d'], borderWidth: 0 }]
        }, options: chartOpts()
      }));
    }

    const gainLossCanvas = document.getElementById('analyticsGainLossChart') as HTMLCanvasElement;
    if (gainLossCanvas) {
      const dd = this.analyticsDisposalData();
      this.charts.push(new Chart(gainLossCanvas, {
        type: 'bar', data: {
          labels: dd.map(d => d.period),
          datasets: [
            { label: 'Disposals', data: dd.map(d => d.disposals), backgroundColor: '#93c5fd', borderRadius: 4, yAxisID: 'y' },
            { label: 'Net Gain/Loss (R)', data: dd.map(d => d.netGainLoss), backgroundColor: dd.map(d => d.netGainLoss >= 0 ? '#86efac' : '#fca5a5'), borderRadius: 4, yAxisID: 'y1' }
          ]
        }, options: { ...chartOpts(), scales: { y: { position: 'left' as const, title: { display: true, text: 'Count' } }, y1: { position: 'right' as const, title: { display: true, text: 'R Value' }, grid: { drawOnChartArea: false }, ticks: { callback: (v: any) => 'R' + (v / 1000000).toFixed(1) + 'M' } } } }
      }));
    }

    const servCanvas = document.getElementById('analyticsServitudeChart') as HTMLCanvasElement;
    if (servCanvas) {
      const sd = this.analyticsServitudeData();
      this.charts.push(new Chart(servCanvas, {
        type: 'bar', data: {
          labels: sd.map(s => s.type),
          datasets: [
            { label: 'Active Count', data: sd.map(s => s.count), backgroundColor: '#a5b4fc', borderRadius: 4, yAxisID: 'y' },
            { label: 'Value Impact (R)', data: sd.map(s => Math.abs(s.valueImpact)), backgroundColor: '#f0abfc', borderRadius: 4, yAxisID: 'y1' }
          ]
        }, options: { ...chartOpts(), scales: { y: { position: 'left' as const, title: { display: true, text: 'Count' } }, y1: { position: 'right' as const, title: { display: true, text: 'Impact (R)' }, grid: { drawOnChartArea: false }, ticks: { callback: (v: any) => 'R' + (v / 1000000).toFixed(1) + 'M' } } } }
      }));
    }
  }

  openForm(mode: string, item?: any) {
    this.formMode.set(mode);
    this.editItem = item || null;
    if (mode === 'edit-parcel' && item) { this.fd = { ...item }; }
    else if (mode === 'run-single-valuation' && item) { this.fd = { landInventoryID: item.landInventoryID, financialYear: this.currentFY, period: new Date().getMonth() + 1 }; }
    else { this.fd = { financialYear: this.currentFY, period: new Date().getMonth() + 1 }; }
  }

  closeForm() { this.formMode.set(''); this.editItem = null; this.fd = {}; }

  formTitle(): string {
    const t: Record<string, string> = {
      'create-parcel': 'Register Land Parcel', 'edit-parcel': 'Edit Land Parcel', 'view-parcel': 'Parcel Details',
      'create-acquisition': 'Record Land Acquisition', 'create-transfer': 'Record Transfer', 'create-distribution': 'Record Distribution (Disposal)',
      'create-reclassification': 'Record Reclassification', 'create-council-resolution': 'Record Council Resolution',
      'run-valuation': 'Run NRV Valuation', 'run-single-valuation': 'Run Valuation for Parcel', 'bulk-valuation': 'Bulk NRV Valuation',
      'create-impairment': 'Impairment Assessment', 'run-reconciliation': 'Run Reconciliation',
      'create-adjustment': 'Create Adjusting Entry', 'create-working-paper': 'Create Working Paper', 'edit-working-paper': 'Edit Working Paper',
      'create-environmental': 'Environmental Assessment', 'create-servitude': 'Record Servitude',
      'create-policy-review': 'New Policy Review', 'create-config': 'Add Configuration', 'generate-report': 'Generate Reports'
    };
    return t[this.formMode()] || this.formMode();
  }

  formIcon(): string {
    const m = this.formMode();
    if (m.includes('parcel')) return 'landscape';
    if (m.includes('acquisition')) return 'add_shopping_cart';
    if (m.includes('transfer')) return 'swap_horiz';
    if (m.includes('distribution')) return 'sell';
    if (m.includes('reclassification')) return 'category';
    if (m.includes('council')) return 'account_balance';
    if (m.includes('valuation')) return 'assessment';
    if (m.includes('impairment')) return 'warning_amber';
    if (m.includes('reconciliation')) return 'balance';
    if (m.includes('adjustment')) return 'tune';
    if (m.includes('working')) return 'description';
    if (m.includes('environmental')) return 'eco';
    if (m.includes('servitude')) return 'share_location';
    if (m.includes('policy')) return 'policy';
    if (m.includes('config')) return 'settings';
    if (m.includes('report')) return 'summarize';
    return 'edit';
  }

  isWideForm(): boolean {
    const m = this.formMode();
    return m.includes('parcel') || m.includes('acquisition') || m.includes('transfer') || m.includes('environmental') || m === 'view-parcel';
  }

  submitLabel(): string {
    const m = this.formMode();
    if (m.includes('run') || m.includes('bulk')) return 'Run';
    if (m.includes('generate')) return 'Generate All';
    return 'Save';
  }

  submitForm() {
    const m = this.formMode();
    const post = (path: string, data: any, cb: () => void) => {
      this.http.post(this.url(path), data, { headers: this.headers() }).subscribe({
        next: () => { this.notify('Saved successfully'); this.closeForm(); cb(); },
        error: () => { this.notify('Saved (mock)'); this.closeForm(); cb(); }
      });
    };
    const put = (path: string, data: any, cb: () => void) => {
      this.http.put(this.url(path), data, { headers: this.headers() }).subscribe({
        next: () => { this.notify('Updated successfully'); this.closeForm(); cb(); },
        error: () => { this.notify('Updated (mock)'); this.closeForm(); cb(); }
      });
    };

    if (m === 'create-parcel') post('', this.fd, () => this.loadParcels());
    else if (m === 'edit-parcel') put(`/${this.editItem.landInventoryID}`, this.fd, () => this.loadParcels());
    else if (m === 'create-acquisition') post('/acquisitions', this.fd, () => this.loadAcquisitions());
    else if (m === 'create-transfer') post('/transfers', this.fd, () => this.loadTransfers());
    else if (m === 'create-distribution') post('/distributions', this.fd, () => this.loadDistributions());
    else if (m === 'create-reclassification') post('/reclassifications', this.fd, () => this.loadReclassifications());
    else if (m === 'create-council-resolution') post('/council-resolutions', this.fd, () => this.loadCouncilResolutions());
    else if (m === 'run-valuation' || m === 'run-single-valuation') post('/valuations/run', this.fd, () => this.loadValuations());
    else if (m === 'bulk-valuation') post('/valuations/bulk-run', this.fd, () => this.loadValuations());
    else if (m === 'create-impairment') post('/impairments', this.fd, () => this.loadImpairments());
    else if (m === 'run-reconciliation') post('/reconciliations/run', this.fd, () => this.loadReconciliations());
    else if (m === 'create-adjustment') post('/adjusting-entries', this.fd, () => this.loadAdjustingEntries());
    else if (m === 'create-working-paper') post('/working-papers', this.fd, () => this.loadWorkingPapers());
    else if (m === 'edit-working-paper') put(`/working-papers/${this.editItem.workingPaperID}`, this.fd, () => this.loadWorkingPapers());
    else if (m === 'create-environmental') post('/environmental-assessments', this.fd, () => this.loadEnvironmentalAssessments());
    else if (m === 'create-servitude') post('/servitudes', this.fd, () => this.loadServitudes());
    else if (m === 'create-policy-review') post('/policy-reviews', this.fd, () => this.loadPolicyReviews());
    else if (m === 'create-config') post('/configuration', this.fd, () => this.loadConfiguration());
    else if (m === 'generate-report') post('/monthly-reports/generate', this.fd, () => this.loadMonthlyReports());
    else { this.notify('Form submitted'); this.closeForm(); }
  }

  approveAcquisition(a: any) { this.http.post(this.url(`/acquisitions/${a.acquisitionID}/approve`), { action: 'approve', comments: 'Approved' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Acquisition approved'); this.loadAcquisitions(); }, error: () => this.notify('Approved (mock)') }); }
  approveTransfer(t: any) { this.http.post(this.url(`/transfers/${t.transferID}/approve`), { action: 'approve', comments: 'Approved' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Transfer approved'); this.loadTransfers(); }, error: () => this.notify('Approved (mock)') }); }
  approveDistribution(d: any) { this.http.post(this.url(`/distributions/${d.distributionID}/approve`), { action: 'approve', comments: 'Approved' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Distribution approved'); this.loadDistributions(); }, error: () => this.notify('Approved (mock)') }); }
  approveValuation(v: any) { this.http.post(this.url(`/valuations/${v.valuationID}/approve`), { action: 'approve', comments: 'Approved' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Valuation approved'); this.loadValuations(); }, error: () => this.notify('Approved (mock)') }); }
  approveImpairment(imp: any) { this.http.post(this.url(`/impairments/${imp.impairmentID}/approve`), { action: 'approve', comments: 'Approved' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Impairment approved'); this.loadImpairments(); }, error: () => this.notify('Approved (mock)') }); }
  approveReconciliation(rc: any) { this.http.post(this.url(`/reconciliations/${rc.reconciliationID}/approve`), { action: 'approve', comments: 'Approved' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Reconciliation approved'); this.loadReconciliations(); }, error: () => this.notify('Approved (mock)') }); }
  approveAdjustingEntry(ae: any) { this.http.post(this.url(`/adjusting-entries/${ae.entryID}/approve`), { action: 'approve', comments: 'Approved' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Entry approved'); this.loadAdjustingEntries(); }, error: () => this.notify('Approved (mock)') }); }
  approvePolicyReview(pr: any) { this.http.post(this.url(`/policy-reviews/${pr.policyReviewID}/approve`), { action: 'approve', comments: 'Approved' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Policy review approved'); this.loadPolicyReviews(); }, error: () => this.notify('Approved (mock)') }); }
  approveConfig(c: any) { this.http.post(this.url(`/configuration/${c.configID}/approve`), { action: 'approve', comments: 'Approved' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Configuration approved'); this.loadConfiguration(); }, error: () => this.notify('Approved (mock)') }); }
  approveReport(rp: any) { this.http.post(this.url(`/monthly-reports/${rp.reportID}/approve`), { action: 'approve', comments: 'Approved' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Report approved'); this.loadMonthlyReports(); }, error: () => this.notify('Approved (mock)') }); }
  submitReport(rp: any) { this.http.post(this.url(`/monthly-reports/${rp.reportID}/approve`), { action: 'submit', comments: 'Submitted' }, { headers: this.headers() }).subscribe({ next: () => { this.notify('Report submitted to reporting mechanism'); this.loadMonthlyReports(); }, error: () => this.notify('Submitted (mock)') }); }

  statusName(id: number): string { return id === 1 ? 'pending' : id === 2 ? 'approved' : id === 3 ? 'rejected' : id === 4 ? 'completed' : 'draft'; }
  notify(msg: string, type: 'success' | 'error' = 'success') { this.notification.set(msg); this.notificationType.set(type); setTimeout(() => this.notification.set(''), 5000); }
  formatDate(d: string | undefined): string { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; } }
  formatNum(n: number | undefined): string { return (n || 0).toLocaleString('en-ZA', { maximumFractionDigits: 2 }); }
  formatRand(n: number | undefined): string { return 'R' + (n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  renderCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    const zd = this.byZoning().length ? this.byZoning() : this.mockByZoning();
    const wd = this.byWard().length ? this.byWard() : this.mockByWard();
    const pastelColors = ['#c4b5fd', '#93c5fd', '#a5b4fc', '#86efac', '#fcd34d', '#fca5a5', '#fdba74', '#f0abfc'];

    const c1 = document.getElementById('zoningChart') as HTMLCanvasElement;
    if (c1) {
      this.charts.push(new Chart(c1, {
        type: 'doughnut', data: {
          labels: zd.map((z: any) => z.zoning),
          datasets: [{ data: zd.map((z: any) => z.parcelCount), backgroundColor: pastelColors, borderWidth: 0 }]
        }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true } } } }
      }));
    }

    const c2 = document.getElementById('wardChart') as HTMLCanvasElement;
    if (c2) {
      this.charts.push(new Chart(c2, {
        type: 'bar', data: {
          labels: wd.map((w: any) => w.ward),
          datasets: [
            { label: 'Parcels', data: wd.map((w: any) => w.parcelCount), backgroundColor: '#c4b5fd', borderRadius: 4, yAxisID: 'y' },
            { label: 'Hectares', data: wd.map((w: any) => w.totalHectares), backgroundColor: '#93c5fd', borderRadius: 4, yAxisID: 'y1' }
          ]
        }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true } } }, scales: { y: { position: 'left', title: { display: true, text: 'Parcels' } }, y1: { position: 'right', title: { display: true, text: 'Hectares' }, grid: { drawOnChartArea: false } } } }
      }));
    }

    const ownershipData = [
      { label: 'Registered Owner', count: 42 }, { label: 'Pending Transfer', count: 8 },
      { label: 'Expropriated', count: 3 }, { label: 'Custodian', count: 12 }, { label: 'Disputed', count: 2 }
    ];
    const c3 = document.getElementById('ownershipChart') as HTMLCanvasElement;
    if (c3) {
      this.charts.push(new Chart(c3, {
        type: 'pie', data: {
          labels: ownershipData.map(o => o.label),
          datasets: [{ data: ownershipData.map(o => o.count), backgroundColor: ['#86efac', '#fcd34d', '#fca5a5', '#93c5fd', '#f0abfc'], borderWidth: 0 }]
        }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true } } } }
      }));
    }

    const classData = [
      { label: 'Held for Sale', value: 45000000 }, { label: 'Held for Development', value: 32000000 },
      { label: 'Housing Projects', value: 28000000 }, { label: 'Investment Property', value: 15000000 },
      { label: 'PPE - Community', value: 8000000 }
    ];
    const c4 = document.getElementById('classificationChart') as HTMLCanvasElement;
    if (c4) {
      this.charts.push(new Chart(c4, {
        type: 'bar', data: {
          labels: classData.map(c => c.label),
          datasets: [{ label: 'Value (R)', data: classData.map(c => c.value), backgroundColor: pastelColors.slice(0, classData.length), borderRadius: 4 }]
        }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { callback: (v: any) => 'R' + (v / 1000000).toFixed(0) + 'M' } } } }
      }));
    }
  }

  mockDashboard() { return { totalParcels: 67, totalHectares: 1245.8, totalCarryingValue: 128000000, totalMarketValue: 156000000, parcelsRequiringWriteDown: 4, pendingAcquisitions: 3, pendingDisposals: 2, pendingTransfers: 1 }; }
  mockByWard() { return [{ ward: 'Ward 1', parcelCount: 8, totalHectares: 120 }, { ward: 'Ward 3', parcelCount: 12, totalHectares: 245 }, { ward: 'Ward 5', parcelCount: 15, totalHectares: 310 }, { ward: 'Ward 7', parcelCount: 10, totalHectares: 180 }, { ward: 'Ward 9', parcelCount: 6, totalHectares: 95 }, { ward: 'Ward 11', parcelCount: 9, totalHectares: 165 }, { ward: 'Ward 13', parcelCount: 7, totalHectares: 130.8 }]; }
  mockByZoning() { return [{ zoning: 'Residential', parcelCount: 22, totalHectares: 380 }, { zoning: 'Commercial', parcelCount: 8, totalHectares: 95 }, { zoning: 'Agricultural', parcelCount: 12, totalHectares: 420 }, { zoning: 'Industrial', parcelCount: 5, totalHectares: 85 }, { zoning: 'Public Open Space', parcelCount: 10, totalHectares: 165 }, { zoning: 'Institutional', parcelCount: 6, totalHectares: 55 }, { zoning: 'Mixed Use', parcelCount: 4, totalHectares: 45.8 }]; }
  mockParcels() { return [{ landInventoryID: 1, erfNumber: 'ERF 1234', titleDeedNumber: 'T4567/2020', propertyDescription: 'Residential land — York Street', physicalAddress: '45 York Street, George', gpsCoordinates: '-33.9631, 22.4617', extentHectares: 2.5, zoningClassification: 'Residential', landUseCategory: 'Held for Sale', municipalWard: 'Ward 3', costPrice: 1500000, carryingValue: 1500000, nrv: 1800000, requiresWriteDown: false, statusID: 2, ownershipStatus: 'Registered Owner', classificationCategory: 'Inventory - Held for Sale', heldForPurpose: 'Sale in ordinary course', scoaItemSegment: '0340', scoaFundSegment: '0100', scoaFunctionSegment: '0810' }, { landInventoryID: 2, erfNumber: 'ERF 5678', titleDeedNumber: 'T8901/2019', propertyDescription: 'Development land — Industrial area', physicalAddress: 'Industrial Zone, George', gpsCoordinates: '-33.9502, 22.4523', extentHectares: 15.3, zoningClassification: 'Industrial', landUseCategory: 'Held for Development', municipalWard: 'Ward 7', costPrice: 8500000, carryingValue: 8500000, nrv: 7200000, requiresWriteDown: true, statusID: 2, ownershipStatus: 'Registered Owner', classificationCategory: 'Inventory - Held for Development', heldForPurpose: 'Development for sale', scoaItemSegment: '0340', scoaFundSegment: '0100', scoaFunctionSegment: '0810' }, { landInventoryID: 3, erfNumber: 'ERF 9012', titleDeedNumber: 'T2345/2021', propertyDescription: 'Housing project — Thembalethu', physicalAddress: 'Thembalethu Extension 9, George', gpsCoordinates: '-33.9812, 22.4234', extentHectares: 45.2, zoningClassification: 'Residential', landUseCategory: 'Held for Housing', municipalWard: 'Ward 11', costPrice: 22000000, carryingValue: 22000000, nrv: null, requiresWriteDown: false, statusID: 2, ownershipStatus: 'Registered Owner', classificationCategory: 'Inventory - Housing Projects', heldForPurpose: 'Housing delivery', scoaItemSegment: '0340', scoaFundSegment: '0200', scoaFunctionSegment: '0610' }]; }
  mockAcquisitions() { return [{ acquisitionID: 1, acquisitionDate: '2026-01-15', erfNumber: 'ERF 3456', titleDeedNumber: 'T6789/2026', acquisitionMethod: 'Purchase', sellerName: 'ABC Properties (Pty) Ltd', purchasePrice: 3200000, transferCosts: 45000, legalFees: 28000, surveyingCosts: 15000, environmentalCosts: 35000, totalCost: 3323000, councilResolutionRef: 'CR-2025/089', statusID: 1, financialYear: '2025/2026', period: 7 }, { acquisitionID: 2, acquisitionDate: '2025-11-20', erfNumber: 'ERF 7890', titleDeedNumber: 'T1234/2025', acquisitionMethod: 'Donation', sellerName: 'Provincial Government', purchasePrice: 0, transferCosts: 12000, legalFees: 8000, surveyingCosts: 10000, environmentalCosts: 0, totalCost: 30000, councilResolutionRef: 'CR-2025/072', statusID: 2, financialYear: '2025/2026', period: 5 }]; }
  mockTransfers() { return [{ transferID: 1, transferDate: '2026-02-01', transferType: 'Reclassification', transferDirection: 'Out', fromClassification: 'Inventory - Held for Sale', toClassification: 'PPE - Community', carryingValueAtTransfer: 4500000, fairValueAtTransfer: 5200000, reason: 'Council resolved to use for community park', councilResolutionRef: 'CR-2025/095', rezoningApprovalRef: 'RZ-2026/003', statusID: 1, financialYear: '2025/2026', period: 8, landInventoryID: 5 }]; }
  mockDistributions() { return [{ distributionID: 1, distributionDate: '2026-01-28', distributionType: 'Sale', recipientName: 'XYZ Developments (Pty) Ltd', sellingPrice: 5500000, carryingValue: 3200000, gainOrLoss: 2300000, councilResolutionRef: 'CR-2025/091', deedsOfficeRef: 'DO-2026/045', statusID: 1, financialYear: '2025/2026', period: 7, scoaItemSegment: '0340', landInventoryID: 4 }, { distributionID: 2, distributionDate: '2025-12-10', distributionType: 'Donation', recipientName: 'Housing Development Agency', sellingPrice: 0, carryingValue: 1800000, gainOrLoss: -1800000, councilResolutionRef: 'CR-2025/083', deedsOfficeRef: 'DO-2025/189', statusID: 2, financialYear: '2025/2026', period: 6, scoaItemSegment: '0340', landInventoryID: 6 }]; }
  mockReclassifications() { return [{ reclassificationID: 1, reclassificationDate: '2026-01-15', erfNumber: 'ERF 5678', fromClassification: 'Held for Sale', toClassification: 'Held for Development', carryingValueAtDate: 8500000, reason: 'Rezoning approved — industrial development planned', statusID: 2, landInventoryID: 2 }]; }
  mockCouncilResolutions() { return [{ resolutionID: 1, resolutionNumber: 'CR-2025/095', resolutionDate: '2025-11-28', resolutionType: 'Transfer', description: 'Approve transfer of ERF 4521 from inventory to PPE for community park development', relatedERF: 'ERF 4521', statusID: 2 }, { resolutionID: 2, resolutionNumber: 'CR-2025/091', resolutionDate: '2025-11-28', resolutionType: 'Disposal', description: 'Approve sale of ERF 3456 to XYZ Developments per MFMA s14', relatedERF: 'ERF 3456', statusID: 2 }]; }
  mockValuations() { return [{ valuationID: 1, landInventoryID: 2, financialYear: '2025/2026', period: 8, costPrice: 8500000, carryingValue: 8500000, estimatedSellingPrice: 7800000, estimatedCostsToSell: 600000, nrv: 7200000, writeDownRequired: 1300000, requiresWriteDown: true, grap12Reference: 'GRAP 12.28-12.34', statusID: 1 }, { valuationID: 2, landInventoryID: 1, financialYear: '2025/2026', period: 8, costPrice: 1500000, carryingValue: 1500000, estimatedSellingPrice: 2000000, estimatedCostsToSell: 120000, nrv: 1880000, writeDownRequired: 0, requiresWriteDown: false, grap12Reference: 'GRAP 12.28', statusID: 2 }]; }
  mockImpairments() { return [{ impairmentID: 1, landInventoryID: 7, financialYear: '2025/2026', period: 8, impairmentType: 'Environmental', impairmentIndicator: 'Soil contamination detected — historical fuel storage site', carryingValueBefore: 3200000, recoverableAmount: 1800000, impairmentLoss: 1400000, grap21Reference: 'GRAP 21.59-21.63', statusID: 1 }]; }
  mockReconciliations() { return [{ reconciliationID: 1, financialYear: '2025/2026', period: 8, openingParcelCount: 65, openingValue: 125000000, acquisitionsCount: 2, acquisitionsValue: 3353000, transfersInCount: 1, transfersInValue: 2500000, transfersOutCount: 1, transfersOutValue: 4500000, disposalsCount: 1, disposalsValue: 3200000, nrvWriteDowns: 1300000, impairmentAdjustments: 1400000, closingParcelCount: 67, closingValue: 120453000, isBalanced: true, statusID: 1 }]; }
  mockAdjustingEntries() { return [{ entryID: 1, financialYear: '2025/2026', period: 8, entryType: 'NRV Write-Down', description: 'Write-down of ERF 5678 industrial land — NRV below cost', debitAmount: 1300000, creditAmount: 1300000, statusID: 1 }]; }
  mockWorkingPapers() { return [{ workingPaperID: 1, financialYear: '2025/2026', period: 8, type: 'Valuation', title: 'NRV Assessment — February 2026', version: 1, statusID: 2 }, { workingPaperID: 2, financialYear: '2025/2026', period: 8, type: 'Reconciliation', title: 'Land Inventory Reconciliation — February 2026', version: 1, statusID: 1 }]; }
  mockEnvironmental() { return [{ assessmentID: 1, landInventoryID: 7, assessmentType: 'Soil', assessmentDate: '2025-10-15', assessorName: 'EnviroTech Solutions', riskRating: 'High', findings: 'Historical fuel storage contamination detected in subsurface soil layers. Lead and benzene levels exceed NEMA thresholds.', remediationRequired: true, statusID: 2 }, { assessmentID: 2, landInventoryID: 3, assessmentType: 'EIA', assessmentDate: '2025-09-20', assessorName: 'Green Africa Consulting', riskRating: 'Low', findings: 'No significant environmental concerns. Suitable for residential development.', remediationRequired: false, statusID: 2 }]; }
  mockServitudes() { return [{ servitudeID: 1, landInventoryID: 1, servitudeType: 'Pipeline', beneficiaryName: 'Garden Route District Municipality', description: 'Bulk water pipeline servitude — 10m wide corridor', registrationDate: '2018-03-15', expiryDate: null, isActive: true }, { servitudeID: 2, landInventoryID: 2, servitudeType: 'Right of Way', beneficiaryName: 'Eskom Holdings SOC', description: 'Power line servitude — 132kV transmission line', registrationDate: '2015-07-22', expiryDate: null, isActive: true }]; }
  mockPolicyReviews() { return [{ policyReviewID: 1, policyName: 'Land Inventory Accounting Policy', policyType: 'Accounting', version: 3, reviewedBy: 'CFO', reviewDate: '2025-06-30', statusID: 2 }, { policyReviewID: 2, policyName: 'Land Disposal Policy', policyType: 'Disposal', version: 2, reviewedBy: 'Municipal Manager', reviewDate: '2025-06-30', statusID: 2 }]; }
  mockConfiguration() { return [{ configID: 1, configKey: 'NRV_THRESHOLD_PERCENT', configValue: '10', category: 'Valuation', description: 'Percentage threshold below which NRV write-down is flagged', version: 1, isActive: true, approvalStatus: 'approved' }, { configID: 2, configKey: 'DISPOSAL_COUNCIL_REQUIRED', configValue: 'true', category: 'General', description: 'Whether all disposals require Council resolution per MFMA s14', version: 1, isActive: true, approvalStatus: 'approved' }, { configID: 3, configKey: 'DEFAULT_FINANCIAL_YEAR', configValue: '2025/2026', category: 'General', description: 'Current financial year for default filtering', version: 2, isActive: true, approvalStatus: 'pending' }]; }
  mockMonthlyReports() { return [{ reportID: 1, financialYear: '2025/2026', period: 8, reportType: 'PropertyRegisterReport', generatedDate: '2026-02-28', statusID: 2 }, { reportID: 2, financialYear: '2025/2026', period: 8, reportType: 'ReconciliationSchedule', generatedDate: '2026-02-28', statusID: 1 }, { reportID: 3, financialYear: '2025/2026', period: 8, reportType: 'ValuationSummary', generatedDate: '2026-02-28', statusID: 1 }]; }
}
