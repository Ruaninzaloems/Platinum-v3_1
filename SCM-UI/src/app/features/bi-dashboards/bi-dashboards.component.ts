import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { environment } from '../../../environments/environment';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-bi-dashboards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatMenuModule, MatTooltipModule, MatTabsModule, MatChipsModule, MatBadgeModule, MatProgressBarModule, MatSlideToggleModule],
  templateUrl: './bi-dashboards.component.html',
  styleUrl: './bi-dashboards.component.scss'
})
export class BiDashboardsComponent implements OnInit, AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private analyticsService = inject(AnalyticsService);
  private apiUrl = environment.apiUrl;
  private charts: Chart[] = [];

  notification = signal('');
  notificationType = signal<'success' | 'error'>('success');
  loading = signal(false);
  currentTab = signal('executive');

  spendFilters = { financialYear: '2025/2026', department: '', method: '' };

  execData = signal<any>({
    totalSpend: 8750000, totalOrders: 342, budgetUtilisation: 62.4, budgetUsed: 28080000,
    totalBudget: 45000000, openTenders: 3, tenderValue: 12500000, activeContracts: 6,
    expiringContracts: 2, complianceScore: 94, ifwCount: 3, paymentCompliance: 85
  });

  spendData = signal<any>({
    totalSpend: 8750000, orderCount: 342, avgOrderValue: 25584, bbbeeSpendPct: 81.1, localContentPct: 67.3
  });

  pipeData = signal<any>({
    openReqs: 47, openReqValue: 2345890, activeOrders: 23, activeOrderValue: 1876450,
    avgCycleTime: 34.8, grnRate: 84.5, pendingGrn: 8, matchRate: 97
  });

  compData = signal<any>({
    overallScore: 94, ifwCount: 3, ifwValue: 456000, deviations: 5,
    taxComplianceRate: 91, csdVerified: 96
  });

  suppData = signal<any>({
    totalSuppliers: 98, newThisYear: 14, avgPerformance: 3.8, bbbeeL1L2Pct: 64,
    concentrationRisk: 38, expiredDocs: 12
  });

  departments = signal(['Water & Sanitation', 'Roads & Transport', 'Community Services', 'Corporate Services', 'Finance', 'Electricity', 'Housing', 'Planning & Development']);

  kpiIndicators = signal([
    { label: 'Requisition Turnaround', value: '4.2 days', target: '7 days', progress: 60, trend: -8.5, tooltip: 'Average time from req creation to PO generation' },
    { label: 'PO-to-Delivery', value: '12.5 days', target: '14 days', progress: 89, trend: 3.2, tooltip: 'Average time from PO issue to goods delivery' },
    { label: 'Invoice Processing', value: '18.3 days', target: '30 days', progress: 61, trend: -12.1, tooltip: 'Average time from invoice receipt to payment — MFMA s65(2)(e)' },
    { label: 'GRN Processing', value: '1.8 days', target: '2 days', progress: 90, trend: -5.0, tooltip: 'Average GRN capture time after delivery' },
    { label: '3-Way Match Rate', value: '97%', target: '95%', progress: 97, trend: 2.1, tooltip: 'PO vs GRN vs Invoice match success rate' },
    { label: 'Budget Utilisation', value: '62.4%', target: '75%', progress: 83, trend: 4.2, tooltip: 'Total budget utilised vs allocated — MFMA s71' },
    { label: 'Contract Coverage', value: '89%', target: '90%', progress: 99, trend: 1.5, tooltip: 'Percentage of spend under valid contracts' },
    { label: 'Supplier Rotation', value: '72%', target: '80%', progress: 90, trend: 6.3, tooltip: 'Rotational vendor compliance — SCM Reg 17(a)' }
  ]);

  spendCategories = signal([
    { category: 'Professional Services', spend: 2800000, orders: 45, avgValue: 62222, pctOfTotal: 32, trend: 8.5 },
    { category: 'Construction & Maintenance', spend: 1950000, orders: 28, avgValue: 69643, pctOfTotal: 22.3, trend: -3.2 },
    { category: 'IT Equipment & Software', spend: 1200000, orders: 67, avgValue: 17910, pctOfTotal: 13.7, trend: 15.2 },
    { category: 'Vehicle Fleet', spend: 980000, orders: 34, avgValue: 28824, pctOfTotal: 11.2, trend: -1.8 },
    { category: 'Office Supplies', spend: 650000, orders: 89, avgValue: 7303, pctOfTotal: 7.4, trend: 4.1 },
    { category: 'Cleaning & Hygiene', spend: 420000, orders: 24, avgValue: 17500, pctOfTotal: 4.8, trend: 2.3 },
    { category: 'Security Services', spend: 380000, orders: 12, avgValue: 31667, pctOfTotal: 4.3, trend: 0 },
    { category: 'Electrical Materials', spend: 210000, orders: 18, avgValue: 11667, pctOfTotal: 2.4, trend: -6.5 },
    { category: 'Water Treatment', spend: 95000, orders: 8, avgValue: 11875, pctOfTotal: 1.1, trend: 12.0 },
    { category: 'Printing & Stationery', spend: 65000, orders: 17, avgValue: 3824, pctOfTotal: 0.7, trend: -15.3 }
  ]);

  bottlenecks = signal([
    { stage: 'HOD Approval', count: 12, avgDays: 6.2, targetDays: 3, severity: 'high', icon: 'supervisor_account' },
    { stage: 'Supplier Response', count: 8, avgDays: 9.5, targetDays: 7, severity: 'medium', icon: 'hourglass_empty' },
    { stage: 'GRN Capture', count: 5, avgDays: 3.1, targetDays: 2, severity: 'medium', icon: 'local_shipping' },
    { stage: 'Invoice Matching', count: 4, avgDays: 4.8, targetDays: 5, severity: 'low', icon: 'receipt_long' },
    { stage: 'Budget Approval', count: 6, avgDays: 5.5, targetDays: 3, severity: 'high', icon: 'account_balance' },
    { stage: 'Payment Processing', count: 3, avgDays: 8.2, targetDays: 10, severity: 'low', icon: 'payments' }
  ]);

  complianceChecklist = signal([
    { label: 'CSD Verification Currency', reference: 'NT Instruction Note 4A/2016-17', score: 96, status: 'pass' },
    { label: 'Tax Clearance Validity', reference: 'SARS TCC Regulation', score: 91, status: 'pass' },
    { label: 'B-BBEE Certificate Currency', reference: 'PPPFA s2, B-BBEE Act 46/2013', score: 88, status: 'warn' },
    { label: 'Threshold Compliance', reference: 'SCM Reg 12(1)(a-d)', score: 100, status: 'pass' },
    { label: '3-Way Match Rate', reference: 'SCM Reg 38, MFMA s65', score: 97, status: 'pass' },
    { label: 'Contract Coverage', reference: 'MFMA s116(1)', score: 89, status: 'warn' },
    { label: 'Deviation Authorisation', reference: 'SCM Reg 36, MFMA s36', score: 94, status: 'pass' },
    { label: '30-Day Payment Compliance', reference: 'MFMA s65(2)(e), NT Instruction 34', score: 85, status: 'warn' },
    { label: 'Rotation Compliance', reference: 'SCM Reg 17(a)', score: 72, status: 'fail' },
    { label: 'IFW Register Maintenance', reference: 'MFMA s32(4), s102', score: 100, status: 'pass' }
  ]);

  topSuppliers = signal([
    { name: 'ABC Construction (Pty) Ltd', level: 1, spend: 3200000, orders: 28, score: 4.2, share: 16.8 },
    { name: 'Metro IT Solutions', level: 2, spend: 1850000, orders: 45, score: 4.5, share: 9.7 },
    { name: 'National Fleet Services', level: 1, spend: 1420000, orders: 34, score: 3.8, share: 7.5 },
    { name: 'SA Cleaning Co', level: 3, spend: 980000, orders: 24, score: 3.6, share: 5.1 },
    { name: 'XYZ Office Supplies', level: 2, spend: 850000, orders: 89, score: 4.1, share: 4.5 },
    { name: 'Green Energy SA', level: 1, spend: 780000, orders: 12, score: 4.7, share: 4.1 },
    { name: 'Waterworks Engineering', level: 2, spend: 650000, orders: 8, score: 3.9, share: 3.4 },
    { name: 'Premier Security Services', level: 4, spend: 520000, orders: 6, score: 3.2, share: 2.7 }
  ]);

  ngOnInit(): void {
    this.loadAllData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.renderCharts(), 200);
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  switchTab(tab: string): void {
    this.currentTab.set(tab);
    this.destroyCharts();
    setTimeout(() => this.renderCharts(), 200);
  }

  drillTo(route: string): void {
    this.router.navigate([route]);
  }

  loadAllData(): void {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/analytics/spend`).subscribe({
      next: (data) => {
        if (data?.totalSpend) {
          const total = typeof data.totalSpend === 'object' ? data.totalSpend.amount : data.totalSpend;
          this.execData.update(e => ({ ...e, totalSpend: total }));
          this.spendData.update(s => ({ ...s, totalSpend: total }));
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.http.get<any>(`${this.apiUrl}/dashboard/executive`).subscribe({
      next: (data) => {
        if (data?.kpiCards) {
          const reqCard = data.kpiCards.find((k: any) => k.id === 'requisitions');
          const ordCard = data.kpiCards.find((k: any) => k.id === 'orders');
          const budCard = data.kpiCards.find((k: any) => k.id === 'budget');
          if (reqCard) this.pipeData.update(p => ({ ...p, openReqs: reqCard.count || p.openReqs, openReqValue: reqCard.value || p.openReqValue }));
          if (ordCard) this.pipeData.update(p => ({ ...p, activeOrders: ordCard.count || p.activeOrders, activeOrderValue: ordCard.value || p.activeOrderValue }));
          if (budCard) this.execData.update(e => ({ ...e, budgetUtilisation: budCard.percentage || e.budgetUtilisation, budgetUsed: budCard.value || e.budgetUsed, totalBudget: budCard.total || e.totalBudget }));
        }
        if (data?.complianceScore) {
          this.execData.update(e => ({ ...e, complianceScore: data.complianceScore.overall || e.complianceScore }));
          this.compData.update(c => ({ ...c, overallScore: data.complianceScore.overall || c.overallScore }));
        }
      },
      error: () => {}
    });
  }

  loadSpendData(): void {
    this.destroyCharts();
    setTimeout(() => this.renderCharts(), 200);
  }

  resetSpendFilters(): void {
    this.spendFilters = { financialYear: '2025/2026', department: '', method: '' };
    this.loadSpendData();
  }

  renderCharts(): void {
    const tab = this.currentTab();
    if (tab === 'executive') this.renderExecutiveCharts();
    else if (tab === 'spend') this.renderSpendCharts();
    else if (tab === 'procurement') this.renderProcurementCharts();
    else if (tab === 'compliance') this.renderComplianceCharts();
    else if (tab === 'supplier') this.renderSupplierCharts();
  }

  private renderExecutiveCharts(): void {
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    this.createChart('execSpendTrendChart', {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          { label: 'Spend', data: [1200000, 980000, 1100000, 1350000, 890000, 750000, 1480000, 1000000], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4 },
          { label: 'Budget', data: [1500000, 1500000, 1500000, 1500000, 1500000, 1500000, 1500000, 1500000], borderColor: '#10b981', borderDash: [5, 5], backgroundColor: 'transparent', tension: 0 }
        ]
      },
      options: this.lineOptions('Monthly Spend vs Budget (R)')
    });

    this.createChart('execDeptSpendChart', {
      type: 'doughnut',
      data: {
        labels: ['Infrastructure', 'Water & Sanitation', 'Corporate Services', 'Electricity', 'Community Services'],
        datasets: [{ data: [3200000, 2100000, 1850000, 950000, 650000], backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'] }]
      },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } }
    });

    this.createChart('execPipelineChart', {
      type: 'bar',
      data: {
        labels: ['Demand', 'Requisition', 'Sourcing', 'PO', 'Delivery', 'Invoice', 'Payment'],
        datasets: [
          { label: 'Active Items', data: [4, 12, 6, 8, 3, 7, 5], backgroundColor: '#3b82f6', borderRadius: 4 },
          { label: 'Target Days', data: [3, 5, 10, 3, 14, 7, 30], backgroundColor: '#e2e8f0', borderRadius: 4 },
          { label: 'Avg Days', data: [2.1, 3.8, 7.2, 2.1, 8.5, 5.3, 12.4], backgroundColor: '#10b981', borderRadius: 4 }
        ]
      },
      options: this.barOptions('Lifecycle Pipeline')
    });

    this.createChart('execBbbeeChart', {
      type: 'pie',
      data: {
        labels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5+'],
        datasets: [{ data: [3500000, 2100000, 1500000, 800000, 850000], backgroundColor: ['#2e7d32', '#1565c0', '#6a1b9a', '#ef6c00', '#c62828'] }]
      },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } }
    });
  }

  private renderSpendCharts(): void {
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    this.createChart('spendVsBudgetChart', {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: 'Actual Spend', data: [1200000, 980000, 1100000, 1350000, 890000, 750000, 1480000, 1000000], backgroundColor: '#3b82f6', borderRadius: 4 },
          { label: 'Budget', data: [1500000, 1500000, 1400000, 1600000, 1200000, 1000000, 1800000, 1500000], backgroundColor: '#e2e8f0', borderRadius: 4 },
          { label: 'Committed', data: [300000, 520000, 300000, 250000, 310000, 250000, 320000, 500000], backgroundColor: '#f59e0b', borderRadius: 4 }
        ]
      },
      options: this.barOptions('Amount (R)')
    });

    this.createChart('spendByMethodChart', {
      type: 'doughnut',
      data: {
        labels: ['Competitive Bid', '3 Quotes', 'Rate Contract', 'Deviation', 'Petty Cash'],
        datasets: [{ data: [5200000, 2100000, 950000, 500000, 180000], backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#94a3b8'] }]
      },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } }
    });

    this.createChart('spendByDeptChart', {
      type: 'bar',
      data: {
        labels: ['Infrastructure', 'Water', 'Corporate', 'Electricity', 'Community', 'Housing', 'Finance', 'Planning'],
        datasets: [{ label: 'Spend (R)', data: [3200000, 2100000, 1850000, 950000, 650000, 480000, 320000, 200000], backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#c9a84c', '#94a3b8'], borderRadius: 4 }]
      },
      options: { ...this.barOptions('Department Spend (R)'), indexAxis: 'y' as const }
    });

    this.createChart('spendByBbbeeChart', {
      type: 'bar',
      data: {
        labels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6-8', 'Non-compliant'],
        datasets: [
          { label: 'Spend', data: [3500000, 2100000, 1500000, 800000, 450000, 250000, 150000], backgroundColor: '#3b82f6', borderRadius: 4 },
          { label: 'Supplier Count', data: [28, 22, 18, 12, 8, 5, 5], backgroundColor: '#c9a84c', borderRadius: 4, yAxisID: 'y1' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Spend (R)', font: { size: 11 } }, ticks: { font: { size: 10 } } },
          y1: { position: 'right' as const, beginAtZero: true, title: { display: true, text: 'Suppliers', font: { size: 11 } }, grid: { drawOnChartArea: false }, ticks: { font: { size: 10 } } },
          x: { ticks: { font: { size: 10 } } }
        },
        plugins: { legend: { labels: { font: { size: 11 } } } }
      }
    });
  }

  private renderProcurementCharts(): void {
    this.createChart('procFunnelChart', {
      type: 'bar',
      data: {
        labels: ['Demand Plans', 'Requisitions', 'RFQ/Tenders', 'Purchase Orders', 'GRN', 'Invoices', 'Payments'],
        datasets: [
          { label: 'Count', data: [15, 47, 18, 23, 19, 31, 28], backgroundColor: ['#94a3b8', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#059669'], borderRadius: 4 }
        ]
      },
      options: this.barOptions('Pipeline Count')
    });

    this.createChart('procTurnaroundChart', {
      type: 'bar',
      data: {
        labels: ['Req→PO', 'PO→Delivery', 'Inv→Payment', 'Full Cycle', 'GRN Process', '3-Way Match'],
        datasets: [
          { label: 'Actual (days)', data: [4.2, 12.5, 18.3, 34.8, 1.8, 2.4], backgroundColor: '#3b82f6', borderRadius: 4 },
          { label: 'Target (days)', data: [7, 14, 30, 45, 2, 3], backgroundColor: '#e2e8f0', borderRadius: 4 }
        ]
      },
      options: { ...this.barOptions('Days'), indexAxis: 'y' as const }
    });

    this.createChart('procAgingChart', {
      type: 'bar',
      data: {
        labels: ['0-7d', '8-14d', '15-21d', '22-30d', '31-60d', '60+d'],
        datasets: [
          { label: 'PO without GRN', data: [12, 18, 8, 6, 5, 4], backgroundColor: '#3b82f6', borderRadius: 4 },
          { label: 'GRN without Inv', data: [15, 12, 6, 3, 2, 1], backgroundColor: '#f59e0b', borderRadius: 4 },
          { label: 'Invoice Unpaid', data: [22, 18, 14, 8, 4, 2], backgroundColor: '#ef4444', borderRadius: 4 }
        ]
      },
      options: this.barOptions('Aging Analysis')
    });

    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    this.createChart('procVolumeTrendChart', {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          { label: 'Requisitions', data: [38, 42, 51, 46, 39, 28, 55, 47], borderColor: '#3b82f6', tension: 0.4 },
          { label: 'Orders', data: [28, 32, 38, 35, 30, 22, 42, 34], borderColor: '#10b981', tension: 0.4 },
          { label: 'Invoices', data: [25, 28, 34, 32, 27, 20, 38, 31], borderColor: '#f59e0b', tension: 0.4 }
        ]
      },
      options: this.lineOptions('Monthly Volume')
    });
  }

  private renderComplianceCharts(): void {
    this.createChart('compComponentsChart', {
      type: 'radar',
      data: {
        labels: ['CSD Verified', 'Tax Clearance', 'B-BBEE Cert', 'Thresholds', '3-Way Match', 'Contract Coverage', 'Deviations', '30-Day Payment'],
        datasets: [
          { label: 'Score', data: [96, 91, 88, 100, 97, 89, 94, 85], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', pointBackgroundColor: '#3b82f6' },
          { label: 'Target', data: [95, 95, 90, 100, 95, 90, 95, 100], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.05)', borderDash: [5, 5], pointBackgroundColor: '#10b981' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: true, scales: { r: { beginAtZero: true, max: 100, ticks: { font: { size: 9 } }, pointLabels: { font: { size: 10 } } } }, plugins: { legend: { labels: { font: { size: 11 } } } } }
    });

    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    this.createChart('compIfwTrendChart', {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: 'Irregular', data: [2, 1, 3, 1, 2, 0, 1, 1], backgroundColor: '#ef4444', borderRadius: 4 },
          { label: 'Fruitless', data: [0, 1, 0, 0, 1, 0, 0, 0], backgroundColor: '#f59e0b', borderRadius: 4 },
          { label: 'Wasteful', data: [1, 0, 0, 1, 0, 0, 1, 0], backgroundColor: '#94a3b8', borderRadius: 4 }
        ]
      },
      options: { ...this.barOptions('IFW Incidents'), scales: { x: { stacked: true, ticks: { font: { size: 10 } } }, y: { stacked: true, beginAtZero: true, ticks: { font: { size: 10 } } } } }
    });

    this.createChart('compDeviationChart', {
      type: 'doughnut',
      data: {
        labels: ['Emergency (s36)', 'Sole Source', 'Treasury Approved', 'Council Resolution', 'Other'],
        datasets: [{ data: [3, 5, 2, 1, 1], backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#94a3b8'] }]
      },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } }
    });

    this.createChart('compAuditChart', {
      type: 'line',
      data: {
        labels: ['2020/21', '2021/22', '2022/23', '2023/24', '2024/25', '2025/26 YTD'],
        datasets: [
          { label: 'Findings', data: [18, 14, 11, 8, 6, 3], borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4 },
          { label: 'Resolved', data: [12, 11, 10, 7, 5, 2], borderColor: '#10b981', tension: 0.4 }
        ]
      },
      options: this.lineOptions('AG Audit Findings')
    });
  }

  private renderSupplierCharts(): void {
    this.createChart('suppBbbeeDistChart', {
      type: 'bar',
      data: {
        labels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7', 'Level 8', 'Non-compliant'],
        datasets: [{ label: 'Suppliers', data: [28, 22, 18, 12, 8, 4, 3, 1, 2], backgroundColor: '#3b82f6', borderRadius: 4 }]
      },
      options: this.barOptions('Supplier Count')
    });

    this.createChart('suppConcentrationChart', {
      type: 'pie',
      data: {
        labels: ['ABC Construction', 'Metro IT', 'National Fleet', 'SA Cleaning', 'XYZ Supplies', 'Other (93 suppliers)'],
        datasets: [{ data: [16.8, 9.7, 7.5, 5.1, 4.5, 56.4], backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#e2e8f0'] }]
      },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } } }
    });

    this.createChart('suppPerformanceChart', {
      type: 'bar',
      data: {
        labels: ['1.0-1.9', '2.0-2.9', '3.0-3.9', '4.0-4.9', '5.0'],
        datasets: [{ label: 'Suppliers', data: [2, 8, 35, 42, 11], backgroundColor: ['#c62828', '#ef6c00', '#f59e0b', '#10b981', '#2e7d32'], borderRadius: 4 }]
      },
      options: this.barOptions('Performance Distribution')
    });

    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    this.createChart('suppOnboardingChart', {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          { label: 'New Registrations', data: [3, 2, 4, 1, 2, 0, 3, 2], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4 },
          { label: 'Deactivated', data: [1, 0, 1, 0, 0, 1, 0, 1], borderColor: '#ef4444', tension: 0.4 }
        ]
      },
      options: this.lineOptions('Supplier Onboarding')
    });
  }

  private createChart(id: string, config: any): void {
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    if (!canvas) return;
    const chart = new Chart(canvas, config);
    this.charts.push(chart);
  }

  private destroyCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  private lineOptions(title: string): any {
    return {
      responsive: true, maintainAspectRatio: true,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: title, font: { size: 11 } }, ticks: { font: { size: 10 } } },
        x: { ticks: { font: { size: 10 } } }
      },
      plugins: { legend: { labels: { font: { size: 11 } } } }
    };
  }

  private barOptions(title: string): any {
    return {
      responsive: true, maintainAspectRatio: true,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: title, font: { size: 11 } }, ticks: { font: { size: 10 } } },
        x: { ticks: { font: { size: 10 } } }
      },
      plugins: { legend: { labels: { font: { size: 11 } } } }
    };
  }

  formatCurrency(value: number): string {
    if (!value) return 'R 0';
    if (value >= 1000000) return `R ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R ${(value / 1000).toFixed(0)}k`;
    return `R ${value.toFixed(0)}`;
  }

  formatCurrencyFull(value: number): string {
    if (!value) return 'R 0.00';
    return 'R ' + value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
