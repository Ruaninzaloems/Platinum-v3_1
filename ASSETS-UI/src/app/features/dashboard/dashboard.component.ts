import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/api.service';
import { OrgSettingsService } from '../../core/org-settings.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  data = signal<any>(null);
  insights = signal<any[]>([]);

  clearingData = signal(false);
  clearSuccess = signal(false);
  clearError = signal('');
  kpis = computed(() => {
    const d = this.data();
    if (!d) return [];
    const k = d.kpis || d;
    return [
      { label: 'Carrying Amount', value: 'R ' + this.formatNumber(k.totalAssetValue || 0), icon: 'account_balance', color: 'blue', sub: 'Cost R' + this.formatNumber(k.totalCostClosing || 0) },
      { label: 'Total Assets', value: (k.totalAssetCount || 0).toLocaleString(), icon: 'inventory_2', color: 'green', sub: (k.conditionGood || 0) + '% good condition' },
      { label: 'Reval Reserve', value: 'R ' + this.formatNumber(k.totalRevaluationReserve || 0), icon: 'auto_graph', color: 'purple', sub: (k.revaluationModelCount || 0).toLocaleString() + ' revalued assets' },
      { label: 'Nearing End of Life', value: (k.assetsNearingEol || 0).toString(), icon: 'hourglass_bottom', color: 'red', sub: 'RUL ≤ 12 months' },
      { label: 'Depreciation', value: 'R ' + this.formatNumber(k.totalDepreciationCharge || 0), icon: 'trending_down', color: 'amber', sub: (k.openFinYear || '') + ' P' + (k.openPeriod || '') }
    ];
  });

  constructor(private api: ApiService, public orgSettings: OrgSettingsService) {}

  getCurrentFinYear(): string {
    var s = this.orgSettings.settings();
    if (s && s.financial_year) return s.financial_year;
    var now = new Date();
    var month = now.getMonth() + 1;
    var year = now.getFullYear();
    if (month >= 7) { return year + '/' + (year + 1); }
    return (year - 1) + '/' + year;
  }

  getCurrentPeriod(): number {
    var s = this.orgSettings.settings();
    if (s && s.current_period_month) return s.current_period_month;
    if (s && s.current_period) return s.current_period;
    var month = new Date().getMonth() + 1;
    return month >= 7 ? month - 6 : month + 6;
  }

  getMunicipalityName(): string {
    var s = this.orgSettings.settings();
    return (s && s.municipality_name) ? s.municipality_name : 'Mnquma Local Municipality';
  }

  ngOnInit() {
    this.api.getDashboard().subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.api.getInsights().subscribe({
      next: function(this: DashboardComponent, i: any[]) { this.insights.set(i || []); }.bind(this),
      error: function(this: DashboardComponent) { this.insights.set([]); }.bind(this)
    });
  }

  getInsightIcon(severity: string): string {
    if (severity === 'critical') return 'error';
    if (severity === 'warning') return 'warning';
    return 'info';
  }

  dismissInsight(id: string) {
    this.api.dismissInsight(id).subscribe({
      next: function(this: DashboardComponent) {
        var updated: any[] = [];
        var all = this.insights();
        for (var i = 0; i < all.length; i++) {
          if (all[i].id !== id) updated.push(all[i]);
        }
        this.insights.set(updated);
      }.bind(this)
    });
  }

  formatNumber(n: number): string {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
    return n.toLocaleString();
  }

  getBarWidth(value: number): number {
    const max = this.data()?.charts?.valueByCategory?.[0]?.value || 1;
    return (value / max) * 100;
  }

  formatMillions(amount: number): string {
    return (amount / 1000000).toFixed(1);
  }

  getConditionColor(condition: string): string {
    const c = (condition || '').toLowerCase();
    if (c.includes('very good') || c.includes('76%') || c.includes('a -')) return '#10b981';
    if (c.includes('good') || c.includes('51%') || c.includes('b -')) return '#22c55e';
    if (c.includes('fair') || c.includes('26%') || c.includes('c -')) return '#f59e0b';
    if (c.includes('very poor') || c.includes('0%') || c.includes('e -')) return '#dc2626';
    if (c.includes('poor') || c.includes('d -')) return '#ef4444';
    if (c.includes('not assessed') || c.includes('not applicable')) return '#94a3b8';
    return '#64748b';
  }

  getDepBarHeight(amount: number): number {
    const items = this.data()?.charts?.monthlyDepreciation || [];
    var max = 1;
    for (var i = 0; i < items.length; i++) {
      if (items[i].amount > max) max = items[i].amount;
    }
    return (amount / max) * 130;
  }

  getAcqDisMax(): number {
    const items = this.data()?.charts?.acquisitionsVsDisposals || [];
    var max = 1;
    for (var i = 0; i < items.length; i++) {
      if (items[i].acquisitions > max) max = items[i].acquisitions;
      if (items[i].disposals > max) max = items[i].disposals;
    }
    return max;
  }

  getAcqBarHeight(value: number): number {
    return (value / this.getAcqDisMax()) * 120;
  }

  clearTestData() {
    if (!confirm('This will DELETE all asset register items, depreciation records, transactions, workflows, and related data, and reset all ID sequences to 1. Continue?')) {
      return;
    }
    this.clearingData.set(true);
    this.clearError.set('');
    this.clearSuccess.set(false);
    this.api.clearTestData().subscribe({
      next: function(this: DashboardComponent) {
        this.clearingData.set(false);
        this.clearSuccess.set(true);
        this.ngOnInit();
      }.bind(this),
      error: function(this: DashboardComponent, err: any) {
        this.clearingData.set(false);
        this.clearError.set(err?.error?.error || err?.message || 'Failed to clear data');
      }.bind(this)
    });
  }
}
