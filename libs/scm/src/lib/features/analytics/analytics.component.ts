import { Component, ChangeDetectionStrategy, signal, inject, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { environment } from '../../environment';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatChipsModule, MatProgressBarModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss'
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;
  private charts: Chart[] = [];

  currentTab = signal<string>('requisitions');
  loading = signal(false);
  notification = signal('');
  notificationType = signal<'success' | 'error'>('success');

  reqData = signal<any>(null);
  orderData = signal<any>(null);
  invoiceData = signal<any>(null);
  paymentData = signal<any>(null);
  grnData = signal<any>(null);
  vendorData = signal<any>(null);
  suppPerfData = signal<any>(null);
  complianceData = signal<any>(null);
  inventoryData = signal<any>(null);

  ngOnInit() {
    this.loadTabData('requisitions');
  }

  ngAfterViewInit() {
    setTimeout(() => this.renderCharts(), 300);
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  switchTab(tab: string) {
    this.currentTab.set(tab);
    this.loadTabData(tab);
    setTimeout(() => this.renderCharts(), 200);
  }

  loadTabData(tab: string) {
    this.loading.set(true);
    const endpointMap: Record<string, string> = {
      requisitions: 'requisitions',
      orders: 'orders',
      invoices: 'invoices',
      payments: 'payments',
      vendors: 'vendors',
      compliance: 'compliance',
      inventory: 'inventory'
    };
    const endpoint = endpointMap[tab];
    if (!endpoint) { this.loading.set(false); return; }

    this.http.get<any>(`${this.apiUrl}/analytics/${endpoint}`).subscribe({
      next: (data) => {
        switch (tab) {
          case 'requisitions': this.reqData.set(data); break;
          case 'orders': this.orderData.set(data); break;
          case 'invoices': this.invoiceData.set(data); break;
          case 'payments': this.paymentData.set(data); break;
          case 'vendors': this.vendorData.set(data); break;
          case 'compliance': this.complianceData.set(data); break;
          case 'inventory': this.inventoryData.set(data); break;
        }
        this.loading.set(false);
        setTimeout(() => this.renderCharts(), 200);
      },
      error: () => {
        this.loading.set(false);
        this.showNotification('Failed to load analytics data', 'error');
      }
    });

    if (tab === 'vendors') {
      this.http.get<any>(`${this.apiUrl}/analytics/grn`).subscribe({
        next: (data) => this.grnData.set(data),
        error: () => {}
      });
      this.http.get<any>(`${this.apiUrl}/analytics/supplier-performance`).subscribe({
        next: (data) => this.suppPerfData.set(data),
        error: () => {}
      });
    }
  }

  renderCharts() {
    this.destroyCharts();
    const tab = this.currentTab();
    switch (tab) {
      case 'requisitions': this.renderReqCharts(); break;
      case 'orders': this.renderOrderCharts(); break;
      case 'invoices': this.renderInvoiceCharts(); break;
      case 'payments': this.renderPaymentCharts(); break;
      case 'vendors': this.renderVendorCharts(); break;
      case 'compliance': this.renderComplianceCharts(); break;
      case 'inventory': this.renderInventoryCharts(); break;
    }
  }

  private renderReqCharts() {
    const data = this.reqData();
    if (!data) return;

    const demandBudget = data.demandVsBudget;
    if (demandBudget) {
      this.createChart('reqDemandBudgetChart', 'line', {
        labels: demandBudget.labels,
        datasets: demandBudget.datasets.map((ds: any) => ({
          ...ds,
          tension: 0.3,
          fill: true,
          pointRadius: 3
        }))
      }, { scales: { y: { ticks: { callback: (v: number) => 'R' + (v / 1000000).toFixed(1) + 'M' } } } });

      if (demandBudget.byDepartment) {
        this.createChart('reqDeptDemandChart', 'bar', {
          labels: demandBudget.byDepartment.map((d: any) => d.department),
          datasets: [
            { label: 'Demand', data: demandBudget.byDepartment.map((d: any) => d.demand), backgroundColor: '#3b82f6' },
            { label: 'Budget', data: demandBudget.byDepartment.map((d: any) => d.budget), backgroundColor: '#10b981' }
          ]
        }, { indexAxis: 'y' as const, scales: { x: { ticks: { callback: (v: number) => 'R' + (v / 1000000).toFixed(1) + 'M' } } } });
      }
    }

    if (data.agingFunnel?.stages) {
      this.createChart('reqAgingFunnelChart', 'bar', {
        labels: data.agingFunnel.stages.map((s: any) => s.stage),
        datasets: [{
          label: 'Count',
          data: data.agingFunnel.stages.map((s: any) => s.count),
          backgroundColor: data.agingFunnel.stages.map((s: any) => s.color)
        }]
      }, { indexAxis: 'y' as const });
    }

    if (data.splittingDetection) {
      this.createChart('reqSplittingChart', 'bar', {
        labels: data.splittingDetection.labels,
        datasets: [{
          label: 'Cases Detected',
          data: data.splittingDetection.detectedCases,
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          borderWidth: 1
        }]
      });
    }
  }

  private renderOrderCharts() {
    const data = this.orderData();
    if (!data) return;

    if (data.conversionPipeline?.stages) {
      this.createChart('orderConversionChart', 'bar', {
        labels: data.conversionPipeline.stages.map((s: any) => s.stage),
        datasets: [
          { label: 'Count', data: data.conversionPipeline.stages.map((s: any) => s.count), backgroundColor: '#3b82f6', yAxisID: 'y' },
          { label: 'Value (R)', data: data.conversionPipeline.stages.map((s: any) => s.value), backgroundColor: '#10b981', type: 'line' as const, yAxisID: 'y1', tension: 0.3, borderColor: '#10b981' }
        ]
      }, {
        scales: {
          y: { position: 'left' as const },
          y1: { position: 'right' as const, grid: { drawOnChartArea: false }, ticks: { callback: (v: number) => 'R' + (v / 1000000).toFixed(0) + 'M' } }
        }
      });
    }

    if (data.spendByMethod) {
      this.createChart('orderSpendMethodChart', 'doughnut', {
        labels: data.spendByMethod.labels,
        datasets: [{
          data: data.spendByMethod.data,
          backgroundColor: data.spendByMethod.colors
        }]
      }, { plugins: { legend: { position: 'right' as const, labels: { font: { size: 11 } } } } });
    }

    if (data.conversionPipeline?.aging) {
      this.createChart('orderAgingChart', 'bar', {
        labels: data.conversionPipeline.aging.labels,
        datasets: [
          { label: 'PO without GRN', data: data.conversionPipeline.aging.poWithoutGrn, backgroundColor: '#3b82f6' },
          { label: 'GRN without Invoice', data: data.conversionPipeline.aging.grnWithoutInvoice, backgroundColor: '#f59e0b' },
          { label: 'Invoice Unpaid', data: data.conversionPipeline.aging.invoiceUnpaid, backgroundColor: '#ef4444' }
        ]
      }, { scales: { x: { stacked: true }, y: { stacked: true } } });
    }

    if (data.amendmentsHeatmap) {
      const hm = data.amendmentsHeatmap;
      const heatData: any[] = [];
      hm.vendors.forEach((v: string, vi: number) => {
        hm.departments.forEach((d: string, di: number) => {
          if (hm.data[vi][di] > 0) {
            heatData.push({ x: di, y: vi, v: hm.data[vi][di] });
          }
        });
      });
      this.createChart('orderAmendmentsChart', 'bar', {
        labels: hm.vendors,
        datasets: hm.departments.map((dept: string, i: number) => ({
          label: dept,
          data: hm.data.map((row: number[]) => row[i]),
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][i]
        }))
      }, { scales: { x: { stacked: true }, y: { stacked: true } }, indexAxis: 'y' as const });
    }
  }

  private renderInvoiceCharts() {
    const data = this.invoiceData();
    if (!data) return;

    if (data.aging) {
      const depts = data.aging.departments;
      const brackets = data.aging.brackets;
      this.createChart('invoiceAgingChart', 'bar', {
        labels: depts,
        datasets: brackets.map((b: string, i: number) => ({
          label: b,
          data: data.aging.data.map((d: number[]) => d[i]),
          backgroundColor: ['#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444'][i]
        }))
      }, { scales: { x: { stacked: true }, y: { stacked: true } } });
    }

    if (data.exceptionWaterfall?.categories) {
      this.createChart('invoiceExceptionChart', 'doughnut', {
        labels: data.exceptionWaterfall.categories.map((c: any) => c.label),
        datasets: [{
          data: data.exceptionWaterfall.categories.map((c: any) => c.count),
          backgroundColor: data.exceptionWaterfall.categories.map((c: any) => c.color)
        }]
      }, { plugins: { legend: { position: 'right' as const, labels: { font: { size: 11 } } } } });
    }
  }

  private renderPaymentCharts() {
    const data = this.paymentData();
    if (!data) return;

    if (data.cycleTime) {
      const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      this.createChart('paymentCycleChart', 'line', {
        labels: months,
        datasets: [
          { label: 'Invoice → Approval', data: data.cycleTime.invoiceToApproval, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3 },
          { label: 'Approval → Payment', data: data.cycleTime.approvalToPayment, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.3 },
          { label: 'Total Cycle', data: data.cycleTime.totalCycle, borderColor: '#ef4444', borderDash: [5, 5], tension: 0.3 },
          { label: 'Target (30 days)', data: Array(12).fill(data.cycleTime.target), borderColor: '#94a3b8', borderDash: [3, 3], pointRadius: 0 }
        ]
      }, { scales: { y: { title: { display: true, text: 'Days' } } } });
    }

    if (data.bankChangeRisk) {
      const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      this.createChart('paymentBankChangeChart', 'bar', {
        labels: months,
        datasets: [
          { label: 'Changes', data: data.bankChangeRisk.changes, backgroundColor: '#3b82f6' },
          { label: 'Flagged', data: data.bankChangeRisk.flagged, backgroundColor: '#f59e0b' },
          { label: 'Close to Payment', data: data.bankChangeRisk.closToPayment, backgroundColor: '#ef4444' }
        ]
      });
    }
  }

  private renderVendorCharts() {
    const data = this.vendorData();
    if (!data) return;

    if (data.complianceStatus) {
      const cs = data.complianceStatus;
      this.createChart('vendorStatusChart', 'bar', {
        labels: ['Active', 'Expired', 'Pending', 'Incomplete', 'Blocked', 'Suspended'],
        datasets: [{
          label: 'Suppliers',
          data: [cs.active, cs.expired, cs.pending, cs.incomplete, cs.blocked, cs.suspended],
          backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#94a3b8', '#ef4444', '#dc2626']
        }]
      });
    }

    const grn = this.grnData();
    if (grn?.supplierOtif?.suppliers) {
      this.createChart('vendorOtifChart', 'bar', {
        labels: grn.supplierOtif.suppliers.map((s: any) => s.name),
        datasets: [
          { label: 'On-Time', data: grn.supplierOtif.suppliers.map((s: any) => s.onTime), backgroundColor: '#3b82f6' },
          { label: 'In-Full', data: grn.supplierOtif.suppliers.map((s: any) => s.inFull), backgroundColor: '#10b981' },
          { label: 'OTIF', data: grn.supplierOtif.suppliers.map((s: any) => s.otif), backgroundColor: '#f59e0b' }
        ]
      }, { indexAxis: 'y' as const, scales: { x: { max: 100, ticks: { callback: (v: number) => v + '%' } } } });
    }
  }

  private renderComplianceCharts() {
    const data = this.complianceData();
    if (!data) return;

    if (data.deviationRegister) {
      const months = ['Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'];
      this.createChart('compDeviationTrendChart', 'bar', {
        labels: months,
        datasets: [
          { label: 'Deviation Count', data: data.deviationRegister.count, backgroundColor: '#ef4444', yAxisID: 'y' },
          { label: 'Deviation Value', data: data.deviationRegister.value, type: 'line' as const, borderColor: '#3b82f6', yAxisID: 'y1', tension: 0.3 }
        ]
      }, {
        scales: {
          y: { position: 'left' as const },
          y1: { position: 'right' as const, grid: { drawOnChartArea: false }, ticks: { callback: (v: number) => 'R' + (v / 1000).toFixed(0) + 'k' } }
        }
      });
    }

    if (data.methodDistribution) {
      this.createChart('compMethodDistChart', 'radar', {
        labels: data.methodDistribution.labels,
        datasets: [
          { label: 'Actual %', data: data.methodDistribution.actual, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', pointBackgroundColor: '#3b82f6' },
          { label: 'Expected %', data: data.methodDistribution.expected, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', pointBackgroundColor: '#10b981', borderDash: [5, 5] }
        ]
      }, { scales: { r: { beginAtZero: true, ticks: { callback: (v: number) => v + '%' } } } });
    }
  }

  private renderInventoryCharts() {
    const data = this.inventoryData();
    if (!data) return;

    if (data.abcClassificationDistribution) {
      this.createChart('invAbcChart', 'doughnut', {
        labels: data.abcClassificationDistribution.labels,
        datasets: data.abcClassificationDistribution.datasets
      }, { plugins: { legend: { position: 'right' as const } } });
    }

    if (data.stockTurnoverTrend) {
      this.createChart('invTurnoverChart', 'line', {
        labels: data.stockTurnoverTrend.labels,
        datasets: data.stockTurnoverTrend.datasets.map((ds: any) => ({
          ...ds,
          tension: 0.3,
          pointRadius: 3
        }))
      }, { scales: { y: { title: { display: true, text: 'Turnover Rate (x)' } } } });
    }

    if (data.warehouseUtilisation) {
      this.createChart('invWarehouseChart', 'bar', {
        labels: data.warehouseUtilisation.labels,
        datasets: data.warehouseUtilisation.datasets.map((ds: any) => ({ ...ds }))
      }, { scales: { y: { max: 100, ticks: { callback: (v: number) => v + '%' } } } });
    }

    if (data.movementPatternAnalysis) {
      this.createChart('invMovementChart', 'line', {
        labels: data.movementPatternAnalysis.labels,
        datasets: data.movementPatternAnalysis.datasets.map((ds: any) => ({
          ...ds,
          tension: 0.3,
          fill: false,
          pointRadius: 3
        }))
      });
    }
  }

  private createChart(canvasId: string, type: any, data: any, options: any = {}) {
    const el = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!el) return;
    const chart = new Chart(el, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true, position: 'top' as const, labels: { usePointStyle: true, font: { size: 11 } } },
          ...options?.plugins
        },
        ...options,
        scales: { ...options?.scales }
      }
    });
    this.charts.push(chart);
  }

  private destroyCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  formatCurrency(value: number): string {
    if (!value && value !== 0) return 'R0';
    if (value >= 1000000) return 'R' + (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return 'R' + (value / 1000).toFixed(0) + 'k';
    return 'R' + value.toFixed(0);
  }

  getPendingReqs(): number {
    const data = this.reqData();
    if (!data?.agingFunnel?.stages) return 0;
    return data.agingFunnel.stages.slice(0, 4).reduce((sum: number, s: any) => sum + s.count, 0);
  }

  getTotalSplitting(): number {
    const data = this.reqData();
    if (!data?.splittingDetection?.detectedCases) return 0;
    return data.splittingDetection.detectedCases.reduce((sum: number, v: number) => sum + v, 0);
  }

  getAvgCycleTime(): number {
    const data = this.paymentData();
    if (!data?.cycleTime?.totalCycle) return 0;
    const arr = data.cycleTime.totalCycle;
    return Math.round(arr.reduce((s: number, v: number) => s + v, 0) / arr.length);
  }

  getTotalDeviations(): number {
    const data = this.complianceData();
    if (!data?.deviationRegister?.count) return 0;
    return data.deviationRegister.count.reduce((s: number, v: number) => s + v, 0);
  }

  getTotalMethodCount(): number {
    const data = this.complianceData();
    if (!data?.methodDistribution?.counts) return 0;
    return data.methodDistribution.counts.reduce((s: number, v: number) => s + v, 0);
  }

  getTotalInventoryItems(): number {
    const data = this.inventoryData();
    if (!data?.abcClassificationDistribution?.values) return 0;
    return data.abcClassificationDistribution.values.reduce((s: number, v: any) => s + v.count, 0);
  }

  showNotification(msg: string, type: 'success' | 'error' = 'success') {
    this.notification.set(msg);
    this.notificationType.set(type);
    setTimeout(() => this.notification.set(''), 4000);
  }
}
