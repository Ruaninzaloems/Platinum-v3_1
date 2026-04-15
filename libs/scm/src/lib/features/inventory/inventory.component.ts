import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { environment } from '../../environment';
import { DashboardService } from '../../core/services/dashboard.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { InventoryService } from '../../core/services/inventory.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-inventory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatTabsModule, MatChipsModule, MatBadgeModule, MatCheckboxModule, MatSlideToggleModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss'
})
export class InventoryComponent implements OnInit, AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private dashboardService = inject(DashboardService);
  private analyticsService = inject(AnalyticsService);
  private inventoryService = inject(InventoryService);

  currentView = signal<'dashboard' | 'list' | 'analytics' | 'report' | 'procurement' | 'stores' | 'replenishment' | 'monthEnd' | 'storePermissions'>('dashboard');
  currentListTab = signal<string>('items');
  notificationMessage = signal<string>('');
  loading = signal(false);

  dashboard = signal<any>({});
  pipeline = signal<any>({});
  items = signal<any[]>([]);
  movements = signal<any[]>([]);
  transfers = signal<any[]>([]);
  issues = signal<any[]>([]);
  stocktakes = signal<any[]>([]);
  donations = signal<any[]>([]);
  disposals = signal<any[]>([]);
  supplierReturns = signal<any[]>([]);
  adjustments = signal<any[]>([]);
  waterReadings = signal<any[]>([]);
  aiInsights = signal<any[]>([]);
  analyticsData = signal<any>(null);
  valuations = signal<any[]>([]);
  waterStockcounts = signal<any[]>([]);
  treatmentWorks = signal<any[]>([]);
  nrwData = signal<any>(null);
  selectedItem = signal<any>(null);
  selectedReport = signal<string | null>(null);
  reportResults = signal<any[]>([]);
  showAiPanel = signal(true);
  formMode = signal<string | null>(null);
  formData = signal<any>({});
  editingItem = signal<any>(null);
  waterSubTab = signal<string>('readings');
  storeLinks = signal<any[]>([]);
  returnToStore = signal<any[]>([]);
  closurePeriods = signal<any[]>([]);
  closureExceptions = signal<string[]>([]);
  csvUploadResult = signal<any>(null);
  waterRoutes = signal<any[]>([]);
  tariffData = signal<any>({});
  waterInventoryCalc = signal<any>({});
  waterHistory = signal<any[]>([]);
  commodities = signal<any[]>([]);
  stocktakeBlocked = signal(false);
  replenishmentData = signal<any>({});
  replenishmentRules = signal<any>({});
  replenishmentLoading = signal(false);
  replenishmentTriggered = signal(false);

  procurementPipeline = signal<any[]>([]);
  procurementPipelineFlow = signal<any[]>([]);
  procurementKpis = signal<any>({});
  selectedPipelineItem = signal<any>(null);
  procurementStageFilter = signal<string>('');
  procurementPriorityFilter = signal<string>('');
  replenishmentItems = signal<any[]>([]);
  triggeringReplenishment = signal(false);

  replenishmentSuggestions = signal<any[]>([]);
  replenishmentSuggestionsLoading = signal(false);
  monthEndStatus = signal<any>(null);
  monthEndExceptions = signal<any[]>([]);
  monthEndLoading = signal(false);
  storePermissions = signal<any[]>([]);
  storePermissionsLoading = signal(false);
  highValueItems = signal<any[]>([]);
  selectedStocktakeDetail = signal<any>(null);

  storesData = signal<any>({});
  storeTransfers = signal<any[]>([]);
  storeKpis = signal<any>({});
  selectedStore = signal<any>(null);
  showCreateStore = signal(false);
  createStoreData = signal<any>({ storeCategory: 'physical', name: '', code: '', type: '', location: '', capacity: 100, virtualType: 'grn_staging' });

  closureConfig: any = {
    inventoryStocktakeRequiredMonthly: true, inventoryStocktakeRequiredAnnually: true,
    waterStocktakeRequiredMonthly: true, waterStocktakeRequiredAnnually: true,
    waterBulkReadingRequiredMonthly: true, waterBulkReadingRequiredAnnually: true,
    stocklistVsLedgerSignoffRequired: true, exceptionReportSignoffRequired: true,
    daysSinceLastMonthlyStocktake: 35, daysSinceLastAnnualStocktake: 370,
    daysSinceLastMonthlyBulkReading: 35, daysSinceLastAnnualBulkReading: 370
  };
  closureChecks: any = {
    inventoryStocktake: false, waterStocktake: false, bulkReadings: false,
    stocklistReconciliation: false, exceptionReport: false
  };

  totalItems = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  totalPages = signal(1);

  searchQuery = '';
  filterStatus = '';
  filterCategory = '';
  filterWarehouse = '';
  filterAbc = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterMovementType = '';
  filterFromStore = '';
  filterToStore = '';
  filterHighValue = false;
  filterIssueType = '';
  filterStocktakeType = '';
  filterDisposalCategory = '';
  filterAdjustmentType = '';
  filterRoute = '';
  filterClassification = '';
  sortBy = 'code';
  sortDir = 'asc';

  reportDateFrom = '';
  reportDateTo = '';
  reportWarehouse = '';
  reportCategory = '';

  chartInstances: Chart[] = [];

  warehouseMap: Record<string, string> = {
    'WH001': 'Main Municipal Stores',
    'WH002': 'Water & Sanitation Depot',
    'WH003': 'Electricity Depot',
    'WH004': 'Fleet Depot',
    'WH005': 'Roads & Stormwater',
    'WH006': 'Parks & Recreation',
    'WH007': 'Community Services',
    'WH008': 'Emergency Stores'
  };

  ngOnInit() {
    this.loadDashboard();
    this.loadPipeline();
    this.loadItems();
    this.loadAiInsights();
    this.loadClosureConfig();
    this.loadCommodities();
    this.loadReplenishmentRules();
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  getHeaders(): any {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    return { Authorization: `Bearer ${token}` };
  }

  navigateTo(view: 'dashboard' | 'list' | 'analytics' | 'report' | 'procurement' | 'stores' | 'replenishment' | 'monthEnd' | 'storePermissions') {
    this.currentView.set(view);
    if (view === 'analytics') {
      this.loadAnalytics();
    }
    if (view === 'list') {
      this.loadCurrentTab();
    }
    if (view === 'dashboard') {
      this.loadDashboard();
      this.loadPipeline();
      this.loadReplenishmentRules();
    }
    if (view === 'procurement') {
      this.loadProcurementPipeline();
      this.loadLowStockItems();
    }
    if (view === 'stores') {
      this.loadStores();
      this.loadStoreTransfers();
    }
    if (view === 'replenishment') {
      this.loadReplenishmentSuggestions();
    }
    if (view === 'monthEnd') {
      this.loadMonthEndStatus();
      this.loadMonthEndExceptions();
    }
    if (view === 'storePermissions') {
      this.loadStorePermissionsList();
    }
  }

  navigateToListTab(tab: string) {
    this.currentListTab.set(tab);
    this.currentView.set('list');
    this.loadCurrentTab();
  }

  switchListTab(tab: string) {
    this.currentListTab.set(tab);
    this.currentPage.set(1);
    this.clearFilters();
    this.loadCurrentTab();
  }

  loadCurrentTab() {
    const tab = this.currentListTab();
    if (tab === 'items') this.loadItems();
    else if (tab === 'movements') this.loadMovements();
    else if (tab === 'transfers') this.loadTransfers();
    else if (tab === 'issues') this.loadIssues();
    else if (tab === 'stocktakes') this.loadStocktakes();
    else if (tab === 'donations') this.loadDonations();
    else if (tab === 'disposals') this.loadDisposals();
    else if (tab === 'supplierReturns') this.loadSupplierReturns();
    else if (tab === 'adjustments') this.loadAdjustments();
    else if (tab === 'valuations') this.loadValuations();
    else if (tab === 'waterReadings') { this.loadWaterReadings(); this.loadWaterStockcounts(); this.loadTreatmentWorks(); this.loadNrwData(); this.loadWaterRoutes(); this.loadTariffData(); this.loadWaterInventoryCalc(); }
    else if (tab === 'commodities') this.loadCommodities();
    else if (tab === 'storeLinks') this.loadStoreLinks();
    else if (tab === 'returnToStore') this.loadReturnToStore();
    else if (tab === 'closure') { this.loadClosurePeriods(); this.loadClosureConfig(); }
  }

  loadDashboard() {
    this.http.get<any>(`${environment.apiUrl}/inventory/dashboard`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.dashboard.set(data),
      error: () => {}
    });
  }

  loadPipeline() {
    this.http.get<any>(`${environment.apiUrl}/inventory/pipeline`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.pipeline.set(data),
      error: () => {}
    });
  }

  loadReplenishmentRules() {
    this.http.get<any>(`${environment.apiUrl}/inventory/replenishment-rules`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.replenishmentRules.set(data),
      error: () => {}
    });
  }

  triggerReplenishmentCheck() {
    this.replenishmentLoading.set(true);
    this.replenishmentTriggered.set(false);
    this.http.post<any>(`${environment.apiUrl}/inventory/trigger-replenishment`, {}, { headers: this.getHeaders() }).subscribe({
      next: (data) => {
        this.replenishmentData.set(data);
        this.replenishmentLoading.set(false);
        this.replenishmentTriggered.set(true);
        this.loadReplenishmentRules();
        this.showNotification(`Replenishment check complete: ${data.triggeredCount} items triggered`);
      },
      error: () => {
        this.replenishmentLoading.set(false);
        this.showNotification('Failed to run replenishment check');
      }
    });
  }

  navigateToProcurementPending() {
    this.procurementStageFilter.set('requisition');
    this.navigateTo('procurement');
  }

  getAutoRequisitionCount(): number {
    const items = this.replenishmentRules().itemsBelowReorderPoint || [];
    return items.filter((i: any) => i.autoRequisition).length;
  }

  getReplenishmentValue(): number {
    const items = this.replenishmentRules().itemsBelowReorderPoint || [];
    return items.reduce((sum: number, i: any) => sum + (i.estimatedCost || 0), 0);
  }

  loadItems() {
    let params: any = { page: this.currentPage(), pageSize: this.pageSize(), sortBy: this.sortBy, sortDir: this.sortDir };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.filterCategory) params.category = this.filterCategory;
    if (this.filterWarehouse) params.warehouseId = this.filterWarehouse;
    if (this.filterAbc) params.abcClassification = this.filterAbc;
    if (this.filterStatus) params.status = this.filterStatus;
    this.http.get<any>(`${environment.apiUrl}/inventory/items`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => {
        this.items.set(res.data || []);
        this.totalItems.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
      },
      error: () => {}
    });
  }

  loadMovements() {
    let params: any = { page: this.currentPage(), pageSize: this.pageSize() };
    if (this.filterWarehouse) params.warehouseId = this.filterWarehouse;
    if (this.filterMovementType) params.type = this.filterMovementType;
    if (this.filterDateFrom) params.dateFrom = this.filterDateFrom;
    if (this.filterDateTo) params.dateTo = this.filterDateTo;
    if (this.searchQuery) params.search = this.searchQuery;
    this.http.get<any>(`${environment.apiUrl}/inventory/movements`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => {
        this.movements.set(res.data || []);
        this.totalItems.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
      },
      error: () => {}
    });
  }

  loadTransfers() {
    let params: any = { page: this.currentPage(), pageSize: this.pageSize() };
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterFromStore) params.fromStoreId = this.filterFromStore;
    if (this.filterToStore) params.toStoreId = this.filterToStore;
    if (this.filterHighValue) params.isHighValue = 'true';
    this.http.get<any>(`${environment.apiUrl}/inventory/transfers`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => {
        this.transfers.set(res.data || []);
        this.totalItems.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
      },
      error: () => {}
    });
  }

  loadIssues() {
    let params: any = { page: this.currentPage(), pageSize: this.pageSize() };
    if (this.filterWarehouse) params.storeId = this.filterWarehouse;
    if (this.filterIssueType) params.type = this.filterIssueType;
    if (this.filterStatus) params.status = this.filterStatus;
    this.http.get<any>(`${environment.apiUrl}/inventory/issues`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => {
        this.issues.set(res.data || []);
        this.totalItems.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
      },
      error: () => {}
    });
  }

  loadStocktakes() {
    let params: any = { page: this.currentPage(), pageSize: this.pageSize() };
    if (this.filterWarehouse) params.warehouseId = this.filterWarehouse;
    if (this.filterStatus) params.status = this.filterStatus;
    this.http.get<any>(`${environment.apiUrl}/inventory/stocktakes`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => {
        this.stocktakes.set(res.data || []);
        this.totalItems.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
      },
      error: () => {}
    });
  }

  loadDonations() {
    let params: any = { page: this.currentPage(), pageSize: this.pageSize() };
    if (this.filterStatus) params.status = this.filterStatus;
    this.http.get<any>(`${environment.apiUrl}/inventory/donations`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => {
        this.donations.set(res.data || []);
        this.totalItems.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
      },
      error: () => {}
    });
  }

  loadDisposals() {
    let params: any = { page: this.currentPage(), pageSize: this.pageSize() };
    if (this.filterWarehouse) params.storeId = this.filterWarehouse;
    if (this.filterDisposalCategory) params.disposalCategory = this.filterDisposalCategory;
    if (this.filterStatus) params.status = this.filterStatus;
    this.http.get<any>(`${environment.apiUrl}/inventory/disposals`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => {
        this.disposals.set(res.data || []);
        this.totalItems.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
      },
      error: () => {}
    });
  }

  loadSupplierReturns() {
    let params: any = { page: this.currentPage(), pageSize: this.pageSize() };
    if (this.filterWarehouse) params.storeId = this.filterWarehouse;
    if (this.filterStatus) params.status = this.filterStatus;
    this.http.get<any>(`${environment.apiUrl}/inventory/supplier-returns`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => {
        this.supplierReturns.set(res.data || []);
        this.totalItems.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
      },
      error: () => {}
    });
  }

  loadAdjustments() {
    let params: any = { page: this.currentPage(), pageSize: this.pageSize() };
    if (this.filterWarehouse) params.storeId = this.filterWarehouse;
    if (this.filterAdjustmentType) params.adjustmentType = this.filterAdjustmentType;
    if (this.filterStatus) params.status = this.filterStatus;
    this.http.get<any>(`${environment.apiUrl}/inventory/adjustments`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => {
        this.adjustments.set(res.data || []);
        this.totalItems.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
      },
      error: () => {}
    });
  }

  loadWaterReadings() {
    let params: any = { page: this.currentPage(), pageSize: this.pageSize() };
    if (this.filterRoute) params.route = this.filterRoute;
    if (this.filterStatus) params.status = this.filterStatus;
    this.http.get<any>(`${environment.apiUrl}/inventory/water-readings`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => {
        this.waterReadings.set(res.data || []);
        this.totalItems.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
      },
      error: () => {}
    });
  }

  loadAiInsights() {
    this.http.get<any>(`${environment.apiUrl}/inventory/ai-insights`, { headers: this.getHeaders() }).subscribe({
      next: (data) => this.aiInsights.set(data || []),
      error: () => {}
    });
  }

  loadAnalytics() {
    if (this.analyticsData()) {
      setTimeout(() => this.createCharts(), 100);
      return;
    }
    this.analyticsService.getInventoryAnalytics().subscribe({
      next: (data) => {
        this.analyticsData.set(data);
        setTimeout(() => this.createCharts(), 100);
      },
      error: () => {}
    });
  }

  createCharts() {
    this.destroyCharts();
    const data = this.analyticsData();
    if (!data) return;

    const abcCtx = document.getElementById('abcClassChart') as HTMLCanvasElement;
    if (abcCtx) {
      this.chartInstances.push(new Chart(abcCtx, {
        type: 'doughnut',
        data: {
          labels: data.abcClassificationDistribution.labels,
          datasets: [{
            data: data.abcClassificationDistribution.datasets[0].data,
            backgroundColor: data.abcClassificationDistribution.datasets[0].backgroundColor,
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true, padding: 15 } } }
        }
      }));
    }

    const turnCtx = document.getElementById('turnoverChart') as HTMLCanvasElement;
    if (turnCtx) {
      this.chartInstances.push(new Chart(turnCtx, {
        type: 'line',
        data: {
          labels: data.stockTurnoverTrend.labels,
          datasets: data.stockTurnoverTrend.datasets.map((ds: any) => ({
            ...ds, tension: 0.4, pointRadius: 3, pointHoverRadius: 5, borderWidth: 2
          }))
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true, padding: 15 } } },
          scales: { y: { ticks: { font: { size: 10 } }, grid: { color: '#f1f5f9' } }, x: { ticks: { font: { size: 10 } }, grid: { display: false } } }
        }
      }));
    }

    const soCtx = document.getElementById('stockoutRiskChart') as HTMLCanvasElement;
    if (soCtx) {
      this.chartInstances.push(new Chart(soCtx, {
        type: 'bar',
        data: {
          labels: data.stockoutRiskMatrix.categories,
          datasets: [
            { label: 'Current Stock Days', data: data.stockoutRiskMatrix.datasets[0].data, backgroundColor: 'rgba(59,130,246,0.7)', borderRadius: 4 },
            { label: 'Safety Stock Days', data: data.stockoutRiskMatrix.datasets[1].data, backgroundColor: 'rgba(239,68,68,0.3)', borderColor: '#ef4444', borderWidth: 1, borderRadius: 4 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true, padding: 15 } } },
          scales: { y: { ticks: { font: { size: 10 } }, grid: { color: '#f1f5f9' } }, x: { ticks: { font: { size: 9 } }, grid: { display: false } } }
        }
      }));
    }

    const exCtx = document.getElementById('expiryRiskChart') as HTMLCanvasElement;
    if (exCtx) {
      this.chartInstances.push(new Chart(exCtx, {
        type: 'bar',
        data: {
          labels: data.expiryRiskTimeline.labels,
          datasets: [{
            label: 'Items at Risk',
            data: data.expiryRiskTimeline.datasets[0].data,
            backgroundColor: data.expiryRiskTimeline.datasets[0].backgroundColor,
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y' as const,
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#f1f5f9' } }, y: { ticks: { font: { size: 10 } }, grid: { display: false } } }
        }
      }));
    }

    const whCtx = document.getElementById('warehouseUtilChart') as HTMLCanvasElement;
    if (whCtx) {
      this.chartInstances.push(new Chart(whCtx, {
        type: 'bar',
        data: {
          labels: data.warehouseUtilisation.labels,
          datasets: [{
            label: 'Utilisation %',
            data: data.warehouseUtilisation.datasets[0].data,
            backgroundColor: data.warehouseUtilisation.datasets[0].backgroundColor,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { max: 100, ticks: { callback: (v: any) => v + '%', font: { size: 10 } }, grid: { color: '#f1f5f9' } }, x: { ticks: { font: { size: 9 } }, grid: { display: false } } }
        }
      }));
    }

    const vtCtx = document.getElementById('varianceTrendChart') as HTMLCanvasElement;
    if (vtCtx) {
      this.chartInstances.push(new Chart(vtCtx, {
        type: 'line',
        data: {
          labels: data.stocktakeVarianceTrend.labels,
          datasets: [
            { ...data.stocktakeVarianceTrend.datasets[0], tension: 0.4, pointRadius: 3, borderWidth: 2 },
            { ...data.stocktakeVarianceTrend.datasets[1], tension: 0.4, pointRadius: 3, borderWidth: 2 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true, padding: 15 } } },
          scales: {
            y: { ticks: { callback: (v: any) => 'R' + Math.abs(v / 1000).toFixed(0) + 'K', font: { size: 10 } }, grid: { color: '#f1f5f9' } },
            y1: { position: 'right' as const, ticks: { stepSize: 1, font: { size: 10 } }, grid: { display: false } },
            x: { ticks: { font: { size: 10 } }, grid: { display: false } }
          }
        }
      }));
    }

    const mpCtx = document.getElementById('movementPatternChart') as HTMLCanvasElement;
    if (mpCtx) {
      this.chartInstances.push(new Chart(mpCtx, {
        type: 'line',
        data: {
          labels: data.movementPatternAnalysis.labels,
          datasets: data.movementPatternAnalysis.datasets.map((ds: any) => ({
            ...ds, tension: 0.4, fill: false, pointRadius: 3, pointHoverRadius: 5, borderWidth: 2
          }))
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true, padding: 15 } } },
          scales: { y: { ticks: { font: { size: 10 } }, grid: { color: '#f1f5f9' } }, x: { ticks: { font: { size: 10 } }, grid: { display: false } } }
        }
      }));
    }

    const faCtx = document.getElementById('forecastAccuracyChart') as HTMLCanvasElement;
    if (faCtx) {
      this.chartInstances.push(new Chart(faCtx, {
        type: 'line',
        data: {
          labels: data.demandForecastAccuracy.labels,
          datasets: data.demandForecastAccuracy.datasets.map((ds: any) => ({
            ...ds, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2
          }))
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true, padding: 15 } } },
          scales: { y: { ticks: { font: { size: 10 } }, grid: { color: '#f1f5f9' } }, x: { ticks: { font: { size: 10 } }, grid: { display: false } } }
        }
      }));
    }

    const nrwCtx = document.getElementById('nrwChart') as HTMLCanvasElement;
    if (nrwCtx) {
      this.chartInstances.push(new Chart(nrwCtx, {
        type: 'line',
        data: {
          labels: data.nrwAnalytics.labels,
          datasets: data.nrwAnalytics.datasets.map((ds: any) => ({
            ...ds, tension: 0.4, pointRadius: 3, pointHoverRadius: 5, borderWidth: 2
          }))
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true, padding: 15 } } },
          scales: {
            y: { ticks: { callback: (v: any) => v + '%', font: { size: 10 } }, grid: { color: '#f1f5f9' } },
            x: { ticks: { font: { size: 10 } }, grid: { display: false } }
          }
        }
      }));
    }
  }

  destroyCharts() {
    this.chartInstances.forEach(c => c.destroy());
    this.chartInstances = [];
  }

  filterByPipeline(status: string) {
    if (this.filterStatus === status) {
      this.filterStatus = '';
    } else {
      this.filterStatus = status;
    }
    this.currentListTab.set('items');
    this.currentView.set('list');
    this.currentPage.set(1);
    this.loadItems();
  }

  applyFilters() {
    this.currentPage.set(1);
    this.loadItems();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterCategory = '';
    this.filterWarehouse = '';
    this.filterAbc = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterMovementType = '';
    this.filterFromStore = '';
    this.filterToStore = '';
    this.filterHighValue = false;
    this.filterIssueType = '';
    this.filterStocktakeType = '';
    this.filterDisposalCategory = '';
    this.filterAdjustmentType = '';
    this.filterRoute = '';
    this.currentPage.set(1);
  }

  sort(column: string) {
    if (this.sortBy === column) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDir = 'asc';
    }
    this.loadItems();
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  selectItem(item: any) {
    this.selectedItem.set(item);
  }

  selectReport(report: string) {
    this.selectedReport.set(report);
    this.reportResults.set([]);
  }

  generateReport() {
    this.loading.set(true);
    const report = this.selectedReport();
    let url = '';
    let params: any = {};

    if (report === 'stocklist' || report === 'low-stock' || report === 'valuation' || report === 'expiry') {
      url = `${environment.apiUrl}/inventory/reports/stocklist`;
      if (this.reportWarehouse) params.warehouseId = this.reportWarehouse;
      if (this.reportCategory) params.category = this.reportCategory;
    } else if (report === 'stock-movement') {
      url = `${environment.apiUrl}/inventory/reports/stock-movement`;
      if (this.reportWarehouse) params.warehouseId = this.reportWarehouse;
      if (this.reportDateFrom) params.dateFrom = this.reportDateFrom;
      if (this.reportDateTo) params.dateTo = this.reportDateTo;
    } else {
      url = `${environment.apiUrl}/inventory/reports/stocklist`;
      if (this.reportWarehouse) params.warehouseId = this.reportWarehouse;
      if (this.reportCategory) params.category = this.reportCategory;
    }

    this.http.get<any>(url, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.reportResults.set(res.data || []);
        this.showNotification(`Report generated: ${res.totalItems || res.totalMovements || (res.data || []).length} records`);
      },
      error: () => {
        this.loading.set(false);
        this.showNotification('Failed to generate report');
      }
    });
  }

  clearReportFilters() {
    this.reportDateFrom = '';
    this.reportDateTo = '';
    this.reportWarehouse = '';
    this.reportCategory = '';
  }

  getWarehouseName(id: string): string {
    return this.warehouseMap[id] || id || '—';
  }

  getWarehouseCount(): number {
    return Object.keys(this.dashboard().byWarehouse || {}).length || 8;
  }

  getWarehouseUtilisation(): number {
    const wh = this.dashboard().warehouseUtilization;
    if (wh) return Math.round(wh * 100);
    return 67;
  }

  getMovementCount(type: string): number {
    return this.movements().filter(m => m.type === type).length || 0;
  }

  getDonationTotalValue(donation: any): number {
    return (donation.items || []).reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0);
  }

  formatCurrency(amount: number): string {
    if (!amount && amount !== 0) return 'R 0';
    if (amount >= 1000000) return `R ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `R ${(amount / 1000).toFixed(0)}K`;
    return `R ${amount.toFixed(0)}`;
  }

  formatCurrencyFull(amount: number): string {
    if (!amount && amount !== 0) return 'R 0.00';
    return 'R ' + amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 });
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Active', low_stock: 'Low Stock', critical: 'Critical', out_of_stock: 'Out of Stock',
      expired: 'Expired', reserved: 'Reserved', draft: 'Draft', submitted: 'Submitted',
      approved: 'Approved', completed: 'Completed', received: 'Received', dispatched: 'Dispatched',
      in_transit: 'In Transit', voided: 'Voided', cancelled: 'Cancelled', pending: 'Pending',
      pending_approval: 'Pending Approval', in_progress: 'In Progress', issued: 'Issued',
      collected: 'Collected', rejected: 'Rejected'
    };
    return labels[status] || status || '—';
  }

  getMovementTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      receipt: 'Receipt', grn: 'GRN', issue: 'Issue',
      transfer_in: 'Transfer In', transfer_out: 'Transfer Out',
      adjustment_decrease: 'Adjustment (-)', adjustment_increase: 'Adjustment (+)',
      return_to_supplier: 'Return to Supplier', return_to_store: 'Return to Store',
      donation: 'Donation', disposal: 'Disposal', valuation: 'Valuation'
    };
    return labels[type] || type || '—';
  }

  getReportTitle(report: string): string {
    const titles: Record<string, string> = {
      'stocklist': 'Stocklist Report',
      'stock-movement': 'Stock Movement Report',
      'stocktake': 'Stocktake Report',
      'valuation': 'Valuation Report',
      'low-stock': 'Low Stock Report',
      'expiry': 'Expiry Report',
      'water-readings': 'Water Readings Report',
      'nrw': 'Non-Revenue Water Report',
      'closure': 'Period Closure Report',
      'adjustments': 'Adjustment Report'
    };
    return titles[report] || 'Report';
  }

  openForm(mode: string, item?: any) {
    if (item) {
      this.editingItem.set(item);
      this.formData.set({ ...item });
    } else {
      this.editingItem.set(null);
      this.formData.set(mode === 'create-issue' ? { items: [{}], issuedTo: {} } : mode === 'create-transfer' ? { items: [{}] } : mode === 'create-donation' ? { items: [{}] } : mode === 'create-disposal' ? { items: [{}] } : mode === 'create-return' ? { items: [{}] } : mode === 'create-return-to-store' ? { items: [{}] } : mode === 'create-water-route' ? { assets: [{}] } : {});
    }
    this.formMode.set(mode);
  }

  closeForm() {
    this.formMode.set(null);
    this.formData.set({});
    this.editingItem.set(null);
  }

  updateFormField(field: string, value: any) {
    const d = { ...this.formData() };
    const parts = field.split('.');
    if (parts.length === 2) {
      if (!d[parts[0]]) d[parts[0]] = {};
      d[parts[0]][parts[1]] = value;
    } else {
      d[field] = value;
    }
    this.formData.set(d);
  }

  addLineItem() {
    const d = { ...this.formData() };
    if (!d.items) d.items = [];
    d.items = [...d.items, {}];
    this.formData.set(d);
  }

  removeLineItem(idx: number) {
    const d = { ...this.formData() };
    d.items = d.items.filter((_: any, i: number) => i !== idx);
    this.formData.set(d);
  }

  updateLineItem(idx: number, field: string, value: any) {
    const d = { ...this.formData() };
    d.items = [...d.items];
    d.items[idx] = { ...d.items[idx], [field]: value };
    this.formData.set(d);
  }

  submitItem() {
    const data = this.formData();
    if (this.editingItem()) {
      this.http.put<any>(`${environment.apiUrl}/inventory/items/${this.editingItem().id}`, data, { headers: this.getHeaders() }).subscribe({
        next: () => { this.closeForm(); this.loadItems(); this.showNotification('Stock item updated'); },
        error: () => this.showNotification('Failed to update item')
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/inventory/items`, data, { headers: this.getHeaders() }).subscribe({
        next: (res) => { this.closeForm(); this.loadItems(); this.showNotification('Stock item created: ' + res.code); },
        error: () => this.showNotification('Failed to create item')
      });
    }
  }

  submitIssue() {
    const data = this.formData();
    this.http.post<any>(`${environment.apiUrl}/inventory/issues`, data, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.closeForm(); this.loadIssues(); this.showNotification('Issue created: ' + res.referenceNumber); },
      error: () => this.showNotification('Failed to create issue')
    });
  }

  submitTransfer() {
    const data = this.formData();
    this.http.post<any>(`${environment.apiUrl}/inventory/transfers`, data, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.closeForm(); this.loadTransfers(); this.showNotification('Transfer created: ' + res.referenceNumber); },
      error: () => this.showNotification('Failed to create transfer')
    });
  }

  submitDonation() {
    const data = this.formData();
    this.http.post<any>(`${environment.apiUrl}/inventory/donations`, data, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.closeForm(); this.loadDonations(); this.showNotification('Donation captured: ' + res.referenceNumber); },
      error: () => this.showNotification('Failed to capture donation')
    });
  }

  submitDisposal() {
    const data = this.formData();
    this.http.post<any>(`${environment.apiUrl}/inventory/disposals`, data, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.closeForm(); this.loadDisposals(); this.showNotification('Disposal created: ' + res.referenceNumber); },
      error: () => this.showNotification('Failed to create disposal')
    });
  }

  submitSupplierReturn() {
    const data = this.formData();
    this.http.post<any>(`${environment.apiUrl}/inventory/supplier-returns`, data, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.closeForm(); this.loadSupplierReturns(); this.showNotification('Return created: ' + res.referenceNumber); },
      error: () => this.showNotification('Failed to create return')
    });
  }

  submitStocktake() {
    const data = this.formData();
    this.http.post<any>(`${environment.apiUrl}/inventory/stocktakes`, data, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.closeForm(); this.loadStocktakes(); this.showNotification('Count sheet generated: ' + res.referenceNumber); },
      error: () => this.showNotification('Failed to generate count sheet')
    });
  }

  submitCheckStocktake() {
    const item = this.editingItem();
    if (!item) return;
    const data = this.formData();
    this.inventoryService.checkStocktake(+item.id, {
      items: data.items,
      checkerComments: data.checkerComments
    }).subscribe({
      next: () => { this.closeForm(); this.loadStocktakes(); this.showNotification('Stocktake checked successfully'); },
      error: () => this.showNotification('Failed to check stocktake')
    });
  }

  submitAdjustment() {
    const data = this.formData();
    this.http.post<any>(`${environment.apiUrl}/inventory/adjustments`, data, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.closeForm(); this.loadAdjustments(); this.showNotification('Adjustment created: ' + res.referenceNumber); },
      error: () => this.showNotification('Failed to create adjustment')
    });
  }

  submitValuation() {
    const data = this.formData();
    this.http.post<any>(`${environment.apiUrl}/inventory/valuations`, data, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.closeForm(); this.loadValuations(); this.showNotification('Valuation created: ' + res.referenceNumber); },
      error: () => this.showNotification('Failed to create valuation')
    });
  }

  submitWaterReading() {
    const data = this.formData();
    this.http.post<any>(`${environment.apiUrl}/inventory/water/readings`, data, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.closeForm(); this.loadWaterReadings(); this.showNotification('Water reading created: ' + res.referenceNumber); },
      error: () => this.showNotification('Failed to create water reading')
    });
  }

  submitWaterStockcount() {
    const data = this.formData();
    this.http.post<any>(`${environment.apiUrl}/inventory/water/stockcounts`, data, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.closeForm(); this.loadWaterStockcounts(); this.showNotification('Water stock count created: ' + res.referenceNumber); },
      error: () => this.showNotification('Failed to create water stock count')
    });
  }

  submitTreatmentWorks() {
    const data = this.formData();
    this.http.post<any>(`${environment.apiUrl}/inventory/water/treatment-works`, data, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.closeForm(); this.loadTreatmentWorks(); this.showNotification('Treatment works data captured'); },
      error: () => this.showNotification('Failed to capture treatment works data')
    });
  }

  approveRecord(type: string, id: string) {
    this.http.put<any>(`${environment.apiUrl}/inventory/${type}/${id}/approve`, { action: 'approve' }, { headers: this.getHeaders() }).subscribe({
      next: () => { this.showNotification('Approved successfully'); this.loadCurrentTab(); },
      error: () => this.showNotification('Failed to approve')
    });
  }

  rejectRecord(type: string, id: string) {
    this.http.put<any>(`${environment.apiUrl}/inventory/${type}/${id}/approve`, { action: 'reject', reason: 'Rejected by approver' }, { headers: this.getHeaders() }).subscribe({
      next: () => { this.showNotification('Rejected successfully'); this.loadCurrentTab(); },
      error: () => this.showNotification('Failed to reject')
    });
  }

  dispatchTransfer(id: string) {
    this.http.put<any>(`${environment.apiUrl}/inventory/transfers/${id}/dispatch`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => { this.showNotification('Transfer dispatched'); this.loadTransfers(); },
      error: () => this.showNotification('Failed to dispatch transfer')
    });
  }

  receiveTransfer(id: string) {
    this.http.put<any>(`${environment.apiUrl}/inventory/transfers/${id}/receive`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => { this.showNotification('Transfer received'); this.loadTransfers(); },
      error: () => this.showNotification('Failed to receive transfer')
    });
  }

  verifyStocktake(id: string) {
    this.http.put<any>(`${environment.apiUrl}/inventory/stocktakes/${id}/verify`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => { this.showNotification('Stocktake verified'); this.loadStocktakes(); },
      error: () => this.showNotification('Failed to verify stocktake')
    });
  }

  approveStocktake(id: string) {
    this.http.put<any>(`${environment.apiUrl}/inventory/stocktakes/${id}/approve`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => { this.showNotification('Stocktake approved'); this.loadStocktakes(); },
      error: () => this.showNotification('Failed to approve stocktake')
    });
  }

  loadProcurementPipeline() {
    let params: any = {};
    if (this.procurementStageFilter()) params.stage = this.procurementStageFilter();
    if (this.procurementPriorityFilter()) params.priority = this.procurementPriorityFilter();
    this.http.get<any>(`${environment.apiUrl}/inventory/procurement-pipeline`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => {
        this.procurementPipeline.set(res.data || []);
        this.procurementPipelineFlow.set(res.pipelineFlow || []);
        this.procurementKpis.set(res.kpis || {});
      },
      error: () => {}
    });
  }

  loadLowStockItems() {
    this.http.get<any>(`${environment.apiUrl}/inventory/items/low-stock`, { headers: this.getHeaders() }).subscribe({
      next: (res) => this.replenishmentItems.set(res.data || []),
      error: () => {}
    });
  }

  advancePipelineItem(item: any) {
    this.http.post<any>(`${environment.apiUrl}/inventory/procurement-pipeline/${item.id}/advance`, {}, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.showNotification('Pipeline item advanced to ' + (res.item?.pipelineStage || 'next stage'));
        this.loadProcurementPipeline();
        this.selectedPipelineItem.set(res.item || null);
      },
      error: (err) => this.showNotification(err.error?.error || 'Failed to advance pipeline item')
    });
  }

  inspectPipelineItem(item: any, result: string) {
    this.http.post<any>(`${environment.apiUrl}/inventory/procurement-pipeline/${item.id}/inspect`, { result, notes: '' }, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.showNotification('Inspection ' + result);
        this.loadProcurementPipeline();
        this.selectedPipelineItem.set(res.item || null);
      },
      error: (err) => this.showNotification(err.error?.error || 'Failed to record inspection')
    });
  }

  triggerReplenishment() {
    this.triggeringReplenishment.set(true);
    this.http.post<any>(`${environment.apiUrl}/inventory/trigger-replenishment`, {}, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.triggeringReplenishment.set(false);
        this.showNotification(res.message || 'Replenishment check complete');
        this.loadProcurementPipeline();
        this.loadLowStockItems();
      },
      error: () => { this.triggeringReplenishment.set(false); this.showNotification('Failed to trigger replenishment'); }
    });
  }

  loadReplenishmentSuggestions() {
    this.replenishmentSuggestionsLoading.set(true);
    this.inventoryService.getReplenishmentSuggestions().subscribe({
      next: (res) => {
        this.replenishmentSuggestions.set(res.suggestions || res.data || res || []);
        this.replenishmentSuggestionsLoading.set(false);
      },
      error: () => {
        this.replenishmentSuggestions.set([]);
        this.replenishmentSuggestionsLoading.set(false);
      }
    });
  }

  loadMonthEndStatus() {
    this.monthEndLoading.set(true);
    this.inventoryService.getMonthEndStatus().subscribe({
      next: (res) => {
        this.monthEndStatus.set(res);
        this.monthEndLoading.set(false);
      },
      error: () => { this.monthEndStatus.set(null); this.monthEndLoading.set(false); }
    });
  }

  loadMonthEndExceptions() {
    this.inventoryService.getMonthEndExceptions().subscribe({
      next: (res) => this.monthEndExceptions.set(res.exceptions || res || []),
      error: () => this.monthEndExceptions.set([])
    });
  }

  closeMonthEnd() {
    const status = this.monthEndStatus();
    if (!status) return;
    this.monthEndLoading.set(true);
    this.inventoryService.closeMonthEnd({ month: status.month, finYear: status.finYear }).subscribe({
      next: () => {
        this.showNotification('Month-end closed successfully');
        this.loadMonthEndStatus();
        this.loadMonthEndExceptions();
      },
      error: (err) => {
        this.monthEndLoading.set(false);
        this.showNotification(err.error?.message || 'Failed to close month-end — resolve exceptions first');
      }
    });
  }

  reopenMonthEnd() {
    const status = this.monthEndStatus();
    if (!status) return;
    if (!confirm('Reopen this period? This will allow transactions to be captured again.')) return;
    this.monthEndLoading.set(true);
    this.inventoryService.reopenMonthEnd({ month: status.month, finYear: status.finYear }).subscribe({
      next: () => {
        this.showNotification('Month-end reopened');
        this.loadMonthEndStatus();
      },
      error: (err) => {
        this.monthEndLoading.set(false);
        this.showNotification(err.error?.message || 'Failed to reopen month-end');
      }
    });
  }

  loadStorePermissionsList() {
    this.storePermissionsLoading.set(true);
    this.inventoryService.getStorePermissions().subscribe({
      next: (res) => {
        this.storePermissions.set(res || []);
        this.storePermissionsLoading.set(false);
      },
      error: () => { this.storePermissions.set([]); this.storePermissionsLoading.set(false); }
    });
  }

  countStocktakeWorkflow(id: string) {
    const data = this.formData();
    this.inventoryService.countStocktake(+id, { lines: data.countLines || [] }).subscribe({
      next: () => { this.closeForm(); this.showNotification('Count captured — ready for checking'); this.loadStocktakes(); },
      error: (err) => this.showNotification(err.error?.message || 'Failed to submit count')
    });
  }

  checkStocktakeWorkflow(id: string) {
    const data = this.formData();
    this.inventoryService.checkStocktake(+id, { lines: data.checkLines || [] }).subscribe({
      next: () => { this.closeForm(); this.showNotification('Check completed — ready for verification'); this.loadStocktakes(); },
      error: (err) => this.showNotification(err.error?.message || 'Failed to submit check')
    });
  }

  verifyStocktakeWorkflow(id: string) {
    const data = this.formData();
    this.inventoryService.verifyStocktakeWorkflow(+id, {
      verifiedBy: data.verifiedBy,
      verificationDate: data.verificationDate,
      verificationLines: data.verificationLines
    }).subscribe({
      next: () => { this.closeForm(); this.showNotification('Stocktake verified — ready for approval'); this.loadStocktakes(); },
      error: (err) => this.showNotification(err.error?.message || 'Failed to verify stocktake')
    });
  }

  approveStocktakeWorkflow(id: string) {
    this.inventoryService.approveStocktakeWorkflow(+id).subscribe({
      next: () => { this.showNotification('Stocktake approved — inventory adjusted'); this.loadStocktakes(); },
      error: (err) => this.showNotification(err.error?.message || 'Failed to approve stocktake')
    });
  }

  dispatchTransferWorkflow(id: string) {
    this.inventoryService.dispatchTransferWorkflow(+id).subscribe({
      next: () => { this.showNotification('Transfer dispatched — stock deducted from source'); this.loadTransfers(); },
      error: (err) => this.showNotification(err.error?.message || 'Failed to dispatch transfer')
    });
  }

  receiveTransferWorkflow(id: string) {
    this.inventoryService.receiveTransferWorkflow(+id).subscribe({
      next: () => { this.showNotification('Transfer received — stock added to destination'); this.loadTransfers(); },
      error: (err) => this.showNotification(err.error?.message || 'Failed to receive transfer')
    });
  }

  rejectTransferWorkflow(id: string) {
    const reason = prompt('Enter rejection reason (mandatory):');
    if (!reason) { this.showNotification('Rejection cancelled — reason is required'); return; }
    this.inventoryService.rejectTransferWorkflow(+id, { reason }).subscribe({
      next: () => { this.showNotification('Transfer rejected — stock restored to source'); this.loadTransfers(); },
      error: (err) => this.showNotification(err.error?.message || 'Failed to reject transfer')
    });
  }

  approveDisposalWorkflowAction(id: string) {
    this.inventoryService.approveDisposalWorkflow(+id).subscribe({
      next: () => { this.showNotification('Disposal approved'); this.loadDisposals(); },
      error: (err) => this.showNotification(err.error?.message || 'Failed to approve disposal')
    });
  }

  postDisposalJournalAction(id: string) {
    this.inventoryService.postDisposalJournal(+id, { debitPostingLevel: 'vote' }).subscribe({
      next: () => {
        this.showNotification('Disposal journal posted & approved');
        this.loadDisposals();
      },
      error: (err) => this.showNotification(err.error?.message || 'Failed to post disposal journal')
    });
  }

  submitValidatedIssue() {
    const data = this.formData();
    this.inventoryService.createValidatedIssue(data).subscribe({
      next: () => { this.closeForm(); this.showNotification('Issue created with validation'); this.loadIssues(); },
      error: (err) => this.showNotification(err.error?.message || 'Failed to create validated issue')
    });
  }

  submitValidatedCorrection() {
    const data = this.formData();
    this.inventoryService.createValidatedCorrection(data).subscribe({
      next: () => { this.closeForm(); this.showNotification('Correction recorded with journal entries'); this.loadAdjustments(); },
      error: (err) => this.showNotification(err.error?.message || 'Failed to create correction')
    });
  }

  approveValuationWorkflowAction(id: string) {
    this.inventoryService.approveValuationWorkflow(+id).subscribe({
      next: () => { this.showNotification('Valuation approved'); this.loadValuations(); },
      error: (err) => this.showNotification(err.error?.message || 'Failed to approve valuation')
    });
  }

  rejectValuationWorkflowAction(id: string) {
    const reason = prompt('Enter rejection reason (mandatory):');
    if (!reason) { this.showNotification('Rejection cancelled — reason is required'); return; }
    this.inventoryService.rejectValuationWorkflow(+id, { reason }).subscribe({
      next: () => { this.showNotification('Valuation rejected'); this.loadValuations(); },
      error: (err) => this.showNotification(err.error?.message || 'Failed to reject valuation')
    });
  }

  getStocktakeStepIndex(status: string): number {
    const steps = ['generated', 'counting', 'counted', 'checked', 'verified', 'approved'];
    return steps.indexOf(status);
  }

  getStocktakeStepLabel(step: string): string {
    const labels: Record<string, string> = {
      generated: 'Generated', counting: 'Counting', counted: 'Counted',
      checked: 'Checked', verified: 'Verified', approved: 'Approved'
    };
    return labels[step] || step;
  }

  getReplenishmentPriorityColor(priority: string): string {
    const colors: Record<string, string> = { critical: '#dc2626', high: '#ea580c', medium: '#eab308', low: '#10b981' };
    return colors[priority] || '#64748b';
  }

  getMonthName(month: number): string {
    const names = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return names[month] || '';
  }

  filterProcurementStage(stage: string) {
    this.procurementStageFilter.set(this.procurementStageFilter() === stage ? '' : stage);
    this.loadProcurementPipeline();
  }

  getStepCount(stage: string): number {
    const flow = this.procurementPipelineFlow();
    const match = flow.find((f: any) => f.stage === stage);
    return match?.count || 0;
  }

  isStageCompleted(currentStage: string, checkStage: string): boolean {
    const order = ['requisition', 'order', 'grn', 'stocked'];
    const currentIdx = order.indexOf(currentStage);
    const checkIdx = order.indexOf(checkStage);
    return checkIdx < currentIdx;
  }

  getPipelineStageIcon(stage: string): string {
    const icons: Record<string, string> = { demand: 'trending_up', requisition: 'description', order: 'shopping_cart', grn: 'local_shipping', inspect: 'verified', stocked: 'warehouse' };
    return icons[stage] || 'circle';
  }

  getPipelineStageLabel(stage: string): string {
    const labels: Record<string, string> = { demand: 'Demand', requisition: 'Requisition', order: 'Purchase Order', grn: 'GRN', inspect: 'Inspection', stocked: 'Stocked' };
    return labels[stage] || stage;
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = { critical: '#dc2626', high: '#ea580c', normal: '#3b82f6', low: '#10b981' };
    return colors[priority] || '#64748b';
  }

  getGateChecks(item: any): { label: string; passed: boolean }[] {
    const stage = item.pipelineStage;
    if (stage === 'requisition') {
      return [
        { label: 'Requisition submitted', passed: !!item.requisitionId },
        { label: 'Requisition approved', passed: item.currentStatus === 'approved' || item.currentStatus === 'emergency_approved' },
        { label: 'Budget verified', passed: true }
      ];
    } else if (stage === 'order') {
      return [
        { label: 'Purchase order issued', passed: !!item.orderId },
        { label: 'Supplier assigned', passed: !!item.supplierId },
        { label: 'Delivery confirmed', passed: !!item.expectedDelivery }
      ];
    } else if (stage === 'grn') {
      return [
        { label: 'GRN captured', passed: !!item.grnId },
        { label: 'Quantity received', passed: item.receivedQty > 0 },
        { label: 'Quality inspection passed', passed: item.qualityStatus === 'passed' }
      ];
    }
    return [{ label: 'Item stocked in warehouse', passed: item.pipelineStage === 'stocked' }];
  }

  getNextStepsGuidance(stage: string): string {
    const guidance: Record<string, string> = {
      requisition: 'Approve the requisition and create a Purchase Order to proceed. Assign a supplier and confirm budget availability.',
      order: 'Monitor delivery progress. Once goods arrive, capture the Goods Received Note (GRN) and schedule quality inspection.',
      grn: 'Complete quality inspection. If passed, advance to stocked. If failed, quarantine the items for return or disposal.',
      stocked: 'Item successfully received into warehouse. Available for issue against requisitions.'
    };
    return guidance[stage] || '';
  }

  getStageActionLabel(stage: string): string {
    const labels: Record<string, string> = { requisition: 'Approve & Create PO', order: 'Capture GRN', grn: 'Accept into Store', stocked: 'Completed' };
    return labels[stage] || 'Advance';
  }

  canAdvancePipeline(item: any): boolean {
    if (item.pipelineStage === 'stocked') return false;
    if (item.pipelineStage === 'requisition') return item.currentStatus === 'approved' || item.currentStatus === 'emergency_approved';
    if (item.pipelineStage === 'order') return item.currentStatus === 'ordered';
    if (item.pipelineStage === 'grn') return item.qualityStatus === 'passed';
    return false;
  }

  loadValuations() {
    let params: any = { page: this.currentPage(), pageSize: this.pageSize() };
    if (this.filterWarehouse) params.storeId = this.filterWarehouse;
    if (this.filterStatus) params.status = this.filterStatus;
    this.http.get<any>(`${environment.apiUrl}/inventory/valuations`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => {
        this.valuations.set(res.data || []);
        this.totalItems.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
      },
      error: () => {}
    });
  }

  loadWaterStockcounts() {
    let params: any = { page: this.currentPage(), pageSize: this.pageSize() };
    if (this.filterStatus) params.status = this.filterStatus;
    this.http.get<any>(`${environment.apiUrl}/inventory/water/stockcounts`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => { this.waterStockcounts.set(res.data || []); },
      error: () => {}
    });
  }

  loadTreatmentWorks() {
    let params: any = { page: this.currentPage(), pageSize: this.pageSize() };
    this.http.get<any>(`${environment.apiUrl}/inventory/water/treatment-works`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => { this.treatmentWorks.set(res.data || []); },
      error: () => {}
    });
  }

  loadNrwData() {
    this.http.get<any>(`${environment.apiUrl}/inventory/water/nrw-analytics`, { headers: this.getHeaders() }).subscribe({
      next: (data) => { this.nrwData.set(data); },
      error: () => {}
    });
  }

  loadCommodities() {
    let params: any = { page: this.currentPage(), pageSize: this.pageSize() };
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterClassification) params.classification = this.filterClassification;
    if (this.searchQuery) params.search = this.searchQuery;
    this.http.get<any>(`${environment.apiUrl}/inventory/commodity-approvals`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => this.commodities.set(res.data || res || []),
      error: () => {}
    });
  }

  loadStoreLinks() {
    let params: any = {};
    if (this.filterWarehouse) params.storeId = this.filterWarehouse;
    this.http.get<any>(`${environment.apiUrl}/inventory/store-commodity-links`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => this.storeLinks.set(res.data || res || []),
      error: () => {}
    });
  }

  loadReturnToStore() {
    let params: any = {};
    if (this.filterWarehouse) params.storeId = this.filterWarehouse;
    if (this.filterStatus) params.status = this.filterStatus;
    this.http.get<any>(`${environment.apiUrl}/inventory/return-to-store`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => this.returnToStore.set(res.data || res || []),
      error: () => {}
    });
  }

  loadClosurePeriods() {
    let params: any = {};
    if (this.filterStatus) params.status = this.filterStatus;
    this.http.get<any>(`${environment.apiUrl}/inventory/closure/periods`, { headers: this.getHeaders(), params }).subscribe({
      next: (res) => this.closurePeriods.set(res.data || res || []),
      error: () => {}
    });
  }

  loadClosureConfig() {
    this.http.get<any>(`${environment.apiUrl}/inventory/closure/config`, { headers: this.getHeaders() }).subscribe({
      next: (res) => { if (res) this.closureConfig = { ...this.closureConfig, ...res }; },
      error: () => {}
    });
  }

  saveClosureConfig() {
    this.http.put<any>(`${environment.apiUrl}/inventory/closure/config`, this.closureConfig, { headers: this.getHeaders() }).subscribe({
      next: () => this.showNotification('Configuration saved'),
      error: () => this.showNotification('Failed to save configuration')
    });
  }

  loadWaterRoutes() {
    this.http.get<any>(`${environment.apiUrl}/inventory/water/routes`, { headers: this.getHeaders() }).subscribe({
      next: (res) => this.waterRoutes.set(res.data || res || []),
      error: () => {}
    });
  }

  loadTariffData() {
    this.http.get<any>(`${environment.apiUrl}/inventory/water/tariff`, { headers: this.getHeaders() }).subscribe({
      next: (res) => this.tariffData.set(res || {}),
      error: () => {}
    });
  }

  loadWaterInventoryCalc() {
    this.http.get<any>(`${environment.apiUrl}/inventory/water/inventory-calc`, { headers: this.getHeaders() }).subscribe({
      next: (res) => this.waterInventoryCalc.set(res || {}),
      error: () => {}
    });
  }

  submitCommodity() {
    const data = this.formData();
    const editing = this.editingItem();
    if (editing) {
      this.http.put<any>(`${environment.apiUrl}/inventory/commodity-approvals/${editing.id}`, data, { headers: this.getHeaders() }).subscribe({
        next: () => { this.closeForm(); this.loadCommodities(); this.showNotification('Commodity updated'); },
        error: () => this.showNotification('Failed to update commodity')
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/inventory/commodity-approvals`, data, { headers: this.getHeaders() }).subscribe({
        next: (res) => { this.closeForm(); this.loadCommodities(); this.showNotification('Commodity submitted for approval: ' + (res.commodityId || res.id)); },
        error: () => this.showNotification('Failed to create commodity')
      });
    }
  }

  submitCommodityForApproval(id: string) {
    this.http.put<any>(`${environment.apiUrl}/inventory/commodity-approvals/${id}/approve`, { status: 'pending_approval' }, { headers: this.getHeaders() }).subscribe({
      next: () => { this.loadCommodities(); this.showNotification('Submitted for approval'); },
      error: () => this.showNotification('Failed to submit')
    });
  }

  approveCommodity(id: string) {
    this.http.put<any>(`${environment.apiUrl}/inventory/commodity-approvals/${id}/approve`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => { this.loadCommodities(); this.showNotification('Commodity approved and activated'); },
      error: () => this.showNotification('Failed to approve')
    });
  }

  cancelCommodity(id: string) {
    this.http.put<any>(`${environment.apiUrl}/inventory/commodities/${id}/cancel`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => { this.loadCommodities(); this.showNotification('Commodity cancelled'); },
      error: (err) => this.showNotification(err.error?.error || 'Failed to cancel — commodity may have existing transactions')
    });
  }

  submitStoreLink() {
    const data = this.formData();
    const editing = this.editingItem();
    const url = editing ? `${environment.apiUrl}/inventory/store-commodity-links/${editing.id}` : `${environment.apiUrl}/inventory/store-commodity-links`;
    const method = editing ? this.http.put<any>(url, data, { headers: this.getHeaders() }) : this.http.post<any>(url, data, { headers: this.getHeaders() });
    method.subscribe({
      next: () => { this.closeForm(); this.loadStoreLinks(); this.showNotification(editing ? 'Link updated' : 'Commodity linked to store'); },
      error: () => this.showNotification('Failed to save store link')
    });
  }

  submitReturnToStore() {
    const data = this.formData();
    this.http.post<any>(`${environment.apiUrl}/inventory/return-to-store`, data, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.closeForm(); this.loadReturnToStore(); this.showNotification('Return submitted: ' + (res.referenceNumber || res.id)); },
      error: () => this.showNotification('Failed to create return')
    });
  }

  approveReturnToStore(id: string) {
    this.http.put<any>(`${environment.apiUrl}/inventory/return-to-store/${id}/approve`, { action: 'approve' }, { headers: this.getHeaders() }).subscribe({
      next: () => { this.loadReturnToStore(); this.showNotification('Return approved — stock received'); },
      error: () => this.showNotification('Failed to approve')
    });
  }

  submitReturnForApproval(id: string) {
    this.http.put<any>(`${environment.apiUrl}/inventory/return-to-store/${id}/submit`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => { this.loadReturnToStore(); this.showNotification('Submitted for approval'); },
      error: () => this.showNotification('Failed to submit')
    });
  }

  rejectWithReason(type: string, id: string) {
    const reason = prompt('Enter rejection/decline reason (mandatory):');
    if (!reason) { this.showNotification('Rejection cancelled — reason is required'); return; }
    const url = type === 'transfers' ? `${environment.apiUrl}/inventory/transfers/${id}/reject` :
                type === 'disposals' ? `${environment.apiUrl}/inventory/disposals/${id}/decline` :
                type === 'valuations' ? `${environment.apiUrl}/inventory/valuations/${id}/reject` :
                type === 'return-to-store' ? `${environment.apiUrl}/inventory/return-to-store/${id}/approve` :
                type === 'commodity-approvals' ? `${environment.apiUrl}/inventory/commodity-approvals/${id}/reject` :
                `${environment.apiUrl}/inventory/${type}/${id}/reject`;
    const body = type === 'return-to-store' ? { action: 'reject', reason } : { reason };
    this.http.put<any>(url, body, { headers: this.getHeaders() }).subscribe({
      next: () => { this.showNotification('Rejected with reason'); this.loadCurrentTab(); },
      error: () => this.showNotification('Failed to reject')
    });
  }

  approveDisposalWithJournal(id: string) {
    this.http.put<any>(`${environment.apiUrl}/inventory/disposals/${id}/journal`, { debitPostingLevel: 'vote' }, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.http.put<any>(`${environment.apiUrl}/inventory/disposals/${id}/approve`, { action: 'approve' }, { headers: this.getHeaders() }).subscribe({
          next: () => { this.showNotification('Disposal approved & journal posted'); this.loadDisposals(); },
          error: () => this.showNotification('Journal posted but approval failed')
        });
      },
      error: () => this.showNotification('Failed to post journal')
    });
  }

  deleteStocktake(id: string) {
    if (!confirm('Delete this stocktake? Approved stocktakes cannot be deleted.')) return;
    this.http.delete<any>(`${environment.apiUrl}/inventory/stocktakes/${id}`, { headers: this.getHeaders() }).subscribe({
      next: () => { this.showNotification('Stocktake deleted'); this.loadStocktakes(); },
      error: (err) => this.showNotification(err.error?.error || 'Cannot delete approved stocktake')
    });
  }

  submitStocktakeLineReject() {
    const data = this.formData();
    const id = this.editingItem()?.id;
    if (!data.reason) { this.showNotification('Rejection reason is mandatory'); return; }
    this.http.put<any>(`${environment.apiUrl}/inventory/stocktakes/${id}/reject-line`, { commodityId: data.commodityId, reason: data.reason }, { headers: this.getHeaders() }).subscribe({
      next: () => { this.closeForm(); this.showNotification('Stocktake line rejected — no adjustment posted'); this.loadStocktakes(); },
      error: () => this.showNotification('Failed to reject line')
    });
  }

  submitVerification() {
    const data = this.formData();
    const id = this.editingItem()?.id;
    this.http.put<any>(`${environment.apiUrl}/inventory/stocktakes/${id}/verify`, {
      verifiedBy: data.verifiedBy,
      verificationDate: data.verificationDate,
      verificationLines: data.verificationLines
    }, { headers: this.getHeaders() }).subscribe({
      next: () => { this.closeForm(); this.showNotification('Stocktake verified with damaged quantities recorded'); this.loadStocktakes(); },
      error: () => this.showNotification('Failed to verify stocktake')
    });
  }

  updateVerificationLine(idx: number, field: string, value: any) {
    const d = { ...this.formData() };
    if (!d.verificationLines) d.verificationLines = [];
    d.verificationLines = [...d.verificationLines];
    d.verificationLines[idx] = { ...d.verificationLines[idx], [field]: value };
    this.formData.set(d);
  }

  submitValuationUpdate() {
    const data = this.formData();
    const id = this.editingItem()?.id;
    this.http.put<any>(`${environment.apiUrl}/inventory/valuations/${id}`, {
      valuationUnitCost: data.valuationUnitCost,
      comment: data.comment
    }, { headers: this.getHeaders() }).subscribe({
      next: () => { this.closeForm(); this.showNotification('Valuation updated'); this.loadValuations(); },
      error: (err) => this.showNotification(err.error?.error || 'Failed to update valuation')
    });
  }

  downloadCsvTemplate() {
    const headers = 'CommodityID,Description,ExtendedDescription,Classification,Type,SubType,MeasureCategory,DefaultUOM,VATIndicator\n';
    const sample = '00000001,Sample Item,Extended description here,Chemicals,Consumable,Water Treatment,Weight,kg,Standard (15%)\n';
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'commodity_template.csv';
    a.click();
    this.showNotification('CSV template downloaded');
  }

  handleCsvUpload(event: any) {
    const file = event.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const csvText = e.target.result;
      const lines = csvText.split('\n').filter((l: string) => l.trim());
      if (lines.length < 2) { this.csvUploadResult.set({ success: false, message: 'CSV file is empty or has no data rows' }); return; }
      const count = lines.length - 1;
      this.http.post<any>(`${environment.apiUrl}/inventory/commodities/take-on`, { csvData: csvText, count }, { headers: this.getHeaders() }).subscribe({
        next: (res) => { this.csvUploadResult.set({ success: true, message: `Successfully imported ${res.imported || count} commodities` }); this.loadCommodities(); },
        error: () => this.csvUploadResult.set({ success: false, message: 'Failed to process CSV file' })
      });
    };
    reader.readAsText(file);
  }

  handleFileUpload(event: any, context: string) {
    const file = event.target?.files?.[0];
    if (file) {
      this.showNotification(`File "${file.name}" attached to ${context}`);
    }
  }

  viewClosureExceptions(checkType: string) {
    this.http.get<any>(`${environment.apiUrl}/inventory/closure/exceptions`, { headers: this.getHeaders(), params: { checkType } }).subscribe({
      next: (res) => this.closureExceptions.set(res.exceptions || []),
      error: () => this.showNotification('Failed to load exceptions')
    });
  }

  submitClosure() {
    const data = this.formMode() === 'create-closure' ? { financialMonth: this.formData().financialMonth, checks: this.closureChecks } : { id: this.editingItem()?.id, checks: this.closureChecks };
    const isNew = this.formMode() === 'create-closure';
    const url = isNew ? `${environment.apiUrl}/inventory/closure/periods` : `${environment.apiUrl}/inventory/closure/periods/${this.editingItem()?.id}`;
    const method = isNew ? this.http.post<any>(url, data, { headers: this.getHeaders() }) : this.http.put<any>(url, data, { headers: this.getHeaders() });
    method.subscribe({
      next: () => { this.closeForm(); this.loadClosurePeriods(); this.showNotification('Closure submitted — notification sent to Ledger dashboard'); },
      error: () => this.showNotification('Failed to process closure')
    });
  }

  submitWaterRoute() {
    const data = this.formData();
    const editing = this.editingItem();
    const url = editing ? `${environment.apiUrl}/inventory/water/routes/${editing.id}` : `${environment.apiUrl}/inventory/water/routes`;
    const method = editing ? this.http.put<any>(url, data, { headers: this.getHeaders() }) : this.http.post<any>(url, data, { headers: this.getHeaders() });
    method.subscribe({
      next: () => { this.closeForm(); this.loadWaterRoutes(); this.showNotification(editing ? 'Route updated' : 'Water route created'); },
      error: () => this.showNotification('Failed to save water route')
    });
  }

  updateRouteAsset(idx: number, field: string, value: any) {
    const d = { ...this.formData() };
    if (!d.assets) d.assets = [];
    d.assets = [...d.assets];
    d.assets[idx] = { ...d.assets[idx], [field]: value };
    this.formData.set(d);
  }

  addRouteAsset() {
    const d = { ...this.formData() };
    if (!d.assets) d.assets = [];
    d.assets = [...d.assets, {}];
    this.formData.set(d);
  }

  removeRouteAsset(idx: number) {
    const d = { ...this.formData() };
    d.assets = d.assets.filter((_: any, i: number) => i !== idx);
    this.formData.set(d);
  }

  showNotification(msg: string) {
    this.notificationMessage.set(msg);
    setTimeout(() => this.notificationMessage.set(''), 5000);
  }

  loadStores() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/inventory/stores`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        const allStores = res.data || res || [];
        const physical = allStores.filter((s: any) => s.storeCategory !== 'virtual');
        const virtual = allStores.filter((s: any) => s.storeCategory === 'virtual');
        this.storesData.set({ physicalStores: physical, virtualStores: virtual });
        const totalCap = physical.reduce((sum: number, s: any) => sum + (s.capacity || 0), 0);
        const totalOcc = physical.reduce((sum: number, s: any) => sum + (s.currentOccupancy || 0), 0);
        const staging = virtual.find((s: any) => s.virtualType === 'grn_staging');
        const quarantine = virtual.find((s: any) => s.virtualType === 'quarantine');
        this.storeKpis.set({
          physicalStores: physical.length,
          virtualStores: virtual.length,
          totalCapacity: totalCap,
          utilization: totalCap > 0 ? Math.round((totalOcc / totalCap) * 100) : 0,
          itemsInStaging: staging?.currentOccupancy || 0,
          itemsInQuarantine: quarantine?.currentOccupancy || 0
        });
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }

  loadStoreTransfers() {
    this.http.get<any>(`${environment.apiUrl}/inventory/store-transfers`, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.storeTransfers.set(res.data || res || []); },
      error: () => {}
    });
  }

  viewStoreDetail(store: any) {
    this.http.get<any>(`${environment.apiUrl}/inventory/stores/${store.id}`, { headers: this.getHeaders() }).subscribe({
      next: (res) => { this.selectedStore.set(res.data || res || store); },
      error: () => { this.selectedStore.set(store); }
    });
  }

  openCreateStore(category: string) {
    this.createStoreData.set({ storeCategory: category, name: '', code: '', type: '', location: '', capacity: 100, virtualType: 'grn_staging', manager: '', linkedStore: '' });
    this.showCreateStore.set(true);
  }

  updateCreateStoreField(field: string, value: any) {
    const d = { ...this.createStoreData() };
    (d as any)[field] = value;
    this.createStoreData.set(d);
  }

  submitCreateStore() {
    const data = this.createStoreData();
    this.http.post<any>(`${environment.apiUrl}/inventory/stores`, data, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.showCreateStore.set(false);
        this.showNotification(`Store "${data.name}" created successfully`);
        this.loadStores();
      },
      error: () => { this.showNotification('Failed to create store — using mock data'); this.showCreateStore.set(false); this.loadStores(); }
    });
  }

  getVirtualStoreIcon(type: string): string {
    const icons: any = { grn_staging: 'login', inspection: 'fact_check', quarantine: 'dangerous', consignment: 'handshake', returns: 'undo', disposal: 'delete_sweep', transit: 'local_shipping', project_site: 'construction' };
    return icons[type] || 'cloud';
  }

  getVirtualStoreColor(type: string): string {
    const colors: any = { grn_staging: '#3b82f6', inspection: '#eab308', quarantine: '#ef4444', consignment: '#10b981', returns: '#f97316', disposal: '#a855f7', transit: '#6366f1', project_site: '#0891b2' };
    return colors[type] || '#8b5cf6';
  }
}
