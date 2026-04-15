import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService } from '../../core/services/api.service';
import { CfoDashboard } from '../../core/models/budget.models';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule],
  template: `
    <div class="page-header">
      <div>
        <h1>CFO Analytics</h1>
        <p class="subtitle">Advanced budget analytics and financial performance insights</p>
      </div>
    </div>

    <div class="gradient-kpis" *ngIf="dashboard">
      <div class="g-kpi navy">
        <div class="g-kpi-icon"><mat-icon>account_balance_wallet</mat-icon></div>
        <div class="g-kpi-value">{{formatCurrency(dashboard.totalBudgetYear1)}}</div>
        <div class="g-kpi-label">Total Budget</div>
      </div>
      <div class="g-kpi green">
        <div class="g-kpi-icon"><mat-icon>trending_up</mat-icon></div>
        <div class="g-kpi-value">{{formatCurrency(dashboard.totalRevenueYear1)}}</div>
        <div class="g-kpi-label">Revenue</div>
      </div>
      <div class="g-kpi red">
        <div class="g-kpi-icon"><mat-icon>trending_down</mat-icon></div>
        <div class="g-kpi-value">{{formatCurrency(dashboard.totalExpenditureYear1)}}</div>
        <div class="g-kpi-label">Expenditure</div>
      </div>
      <div class="g-kpi purple">
        <div class="g-kpi-icon"><mat-icon>domain</mat-icon></div>
        <div class="g-kpi-value">{{formatCurrency(dashboard.totalCapitalYear1)}}</div>
        <div class="g-kpi-label">Capital</div>
      </div>
      <div class="g-kpi gold">
        <div class="g-kpi-icon"><mat-icon>speed</mat-icon></div>
        <div class="g-kpi-value">{{dashboard.burnRatePercentage | number:'1.1-1'}}%</div>
        <div class="g-kpi-label">Burn Rate</div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="card-container chart-card">
        <div class="card-title-bar">
          <h2><mat-icon>bar_chart</mat-icon> Budget by Department</h2>
        </div>
        <div class="chart-wrap"><canvas #deptChart></canvas></div>
      </div>

      <div class="card-container chart-card">
        <div class="card-title-bar">
          <h2><mat-icon>donut_large</mat-icon> Revenue vs Expenditure vs Capital</h2>
        </div>
        <div class="chart-wrap"><canvas #recChart></canvas></div>
      </div>

      <div class="card-container chart-card">
        <div class="card-title-bar">
          <h2><mat-icon>show_chart</mat-icon> Budget vs Actual Trend</h2>
        </div>
        <div class="chart-wrap"><canvas #trendChart></canvas></div>
      </div>

      <div class="card-container chart-card">
        <div class="card-title-bar">
          <h2><mat-icon>stacked_bar_chart</mat-icon> MTREF by Function</h2>
        </div>
        <div class="chart-wrap"><canvas #funcChart></canvas></div>
      </div>
    </div>

    <div class="card-container" *ngIf="dashboard && dashboard.unfundedMandateCount > 0">
      <div class="card-title-bar alert-bar">
        <h2><mat-icon>warning</mat-icon> Unfunded Mandates Alert</h2>
      </div>
      <div class="alert-content">
        <p>{{dashboard.unfundedMandateCount}} unfunded mandate(s) detected. Review budget allocations to ensure compliance.</p>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { font-size: 28px; font-weight: 700; color: #1e293b; margin: 0; }
    .subtitle { font-size: 14px; color: #64748b; margin: 4px 0 0; }
    .gradient-kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 24px; }
    .g-kpi { padding: 20px; border-radius: 14px; color: white; position: relative; overflow: hidden; }
    .g-kpi.navy { background: linear-gradient(135deg, #0f2b46, #1a4a7a); }
    .g-kpi.green { background: linear-gradient(135deg, #1b5e20, #43a047); }
    .g-kpi.red { background: linear-gradient(135deg, #b71c1c, #ef5350); }
    .g-kpi.purple { background: linear-gradient(135deg, #4a148c, #7e57c2); }
    .g-kpi.gold { background: linear-gradient(135deg, #a97d24, #d5b866); }
    .g-kpi-icon { margin-bottom: 10px; opacity: 0.8; }
    .g-kpi-icon mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .g-kpi-value { font-size: 22px; font-weight: 700; font-family: 'SF Mono', ui-monospace, monospace; }
    .g-kpi-label { font-size: 12px; opacity: 0.85; margin-top: 4px; }
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .chart-card { min-height: 360px; }
    .chart-wrap { padding: 20px; height: 280px; }
    .chart-wrap canvas { width: 100% !important; height: 100% !important; }
    .alert-bar { background: #fff3e0; }
    .alert-bar h2 { color: #e65100; }
    .alert-content { padding: 16px 22px; font-size: 14px; color: #bf360c; }
    @media (max-width: 1100px) { .gradient-kpis { grid-template-columns: repeat(3, 1fr); } .charts-grid { grid-template-columns: 1fr; } }
    @media (max-width: 600px) { .gradient-kpis { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class AnalyticsPage implements OnInit, AfterViewInit {
  @ViewChild('deptChart') deptChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('recChart') recChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart') trendChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('funcChart') funcChartRef!: ElementRef<HTMLCanvasElement>;

  dashboard: CfoDashboard | null = null;
  private charts: Chart[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getCfoDashboard().subscribe(d => {
      this.dashboard = d;
      setTimeout(() => this.renderCharts(), 100);
    });
  }

  ngAfterViewInit() {}

  formatCurrency(v: number): string {
    if (!v) return 'R 0';
    if (v >= 1000000) return 'R ' + (v / 1000000).toFixed(1) + 'M';
    if (v >= 1000) return 'R ' + (v / 1000).toFixed(0) + 'K';
    return 'R ' + v.toLocaleString('en-ZA');
  }

  renderCharts() {
    if (!this.dashboard) return;
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    if (this.deptChartRef?.nativeElement) {
      const deptLabels = this.dashboard.byDepartment.map(d => d.department);
      this.charts.push(new Chart(this.deptChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: deptLabels,
          datasets: [
            { label: 'Revenue', data: this.dashboard.byDepartment.map(d => d.revenue), backgroundColor: '#4caf50' },
            { label: 'Expenditure', data: this.dashboard.byDepartment.map(d => d.expenditure), backgroundColor: '#ef5350' },
            { label: 'Capital', data: this.dashboard.byDepartment.map(d => d.capital), backgroundColor: '#7e57c2' }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
      }));
    }

    if (this.recChartRef?.nativeElement) {
      this.charts.push(new Chart(this.recChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Revenue', 'Expenditure', 'Capital'],
          datasets: [{ data: [this.dashboard.totalRevenueYear1, this.dashboard.totalExpenditureYear1, this.dashboard.totalCapitalYear1], backgroundColor: ['#4caf50', '#ef5350', '#7e57c2'] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
      }));
    }

    if (this.trendChartRef?.nativeElement) {
      const months = this.dashboard.monthlyTrend.map(m => m.month);
      this.charts.push(new Chart(this.trendChartRef.nativeElement, {
        type: 'line',
        data: {
          labels: months,
          datasets: [
            { label: 'Budget', data: this.dashboard.monthlyTrend.map(m => m.budget), borderColor: '#42a5f5', tension: 0.3, fill: false },
            { label: 'Actual', data: this.dashboard.monthlyTrend.map(m => m.actual), borderColor: '#c9a84c', tension: 0.3, fill: false }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }
      }));
    }

    if (this.funcChartRef?.nativeElement) {
      const funcLabels = this.dashboard.byFunction.map(f => f.function);
      this.charts.push(new Chart(this.funcChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: funcLabels,
          datasets: [
            { label: 'Year 1', data: this.dashboard.byFunction.map(f => f.year1), backgroundColor: '#0f2b46' },
            { label: 'Year 2', data: this.dashboard.byFunction.map(f => f.year2), backgroundColor: '#42a5f5' },
            { label: 'Year 3', data: this.dashboard.byFunction.map(f => f.year3), backgroundColor: '#c9a84c' }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { position: 'bottom' } } }
      }));
    }
  }
}
