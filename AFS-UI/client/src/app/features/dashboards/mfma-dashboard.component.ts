import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { ApiService } from '../../core/services/api.service';
import { KpiTileComponent } from '../../shared/components/kpi-tile.component';
import { TrafficLightComponent } from '../../shared/components/traffic-light.component';

interface MfmaMonthlyRow {
  period: number;
  label: string;
  revenue: { budgetOriginal: number; budgetAdjusted: number; actual: number; variance: number; variancePercent: number };
  expenditure: { budgetOriginal: number; budgetAdjusted: number; actual: number; variance: number; variancePercent: number };
  surplus: number;
  ytdRevenue: number;
  ytdExpenditure: number;
  status: 'green' | 'amber' | 'red';
  categoryBreakdown?: any;
}

interface CategoryRow {
  category: string;
  budgetOriginal: number;
  budgetAdjusted: number;
  actual: number;
  variance: number;
  collectionRate?: number;
  spendingRate?: number;
}

interface ValidationResult {
  ruleId: string;
  ruleName: string;
  category: string;
  status: string;
  severity: string;
  message: string;
}

interface Commentary {
  id?: string;
  lineItem: string;
  commentary: string;
  period: number;
}

interface Submission {
  id?: string;
  reportType: string;
  period: number;
  status: string;
  submittedAt?: string;
  submittedBy?: string;
}

@Component({
  selector: 'app-mfma-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatProgressBarModule, MatTooltipModule,
    MatSelectModule, MatFormFieldModule, MatInputModule, MatChipsModule,
    MatMenuModule, MatBadgeModule, MatTabsModule, MatExpansionModule,
    KpiTileComponent, TrafficLightComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mfma-dashboard.component.html',
  styleUrl: './mfma-dashboard.component.css'
})
export class MfmaDashboardComponent implements OnInit {
  loading = true;
  error = '';
  data: any = null;

  financialYears: Array<{ id: string; label: string }> = [];
  selectedFyId = '';
  financialYearLabel = '';
  reportType: 'section71' | 'section72' = 'section71';
  selectedPeriod = 0;
  periodOptions: Array<{ value: number; label: string }> = [];

  monthlyBreakdown: MfmaMonthlyRow[] = [];
  quarterlyBreakdown: any[] = [];
  revenueCategories: CategoryRow[] = [];
  expenditureCategories: CategoryRow[] = [];

  collectionRate = 0;
  spendingRate = 0;
  budgetPerformance = 0;
  surplus = 0;
  totalBudgetRevenue = 0;
  totalActualRevenue = 0;
  totalBudgetExpenditure = 0;
  totalActualExpenditure = 0;

  validationResults: ValidationResult[] = [];
  validationCounts = { pass: 0, fail: 0, warning: 0 };
  validating = false;

  commentaryMap: Record<string, Commentary> = {};
  editingCommentary: number | null = null;
  commentaryText = '';

  submissions: Submission[] = [];
  currentSubmission: Submission | null = null;
  currentSubmissionStatus = 'draft';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.api.get<any>('/reports/dashboard').subscribe({
      next: (dashboard) => {
        const fy = dashboard?.financialYear;
        if (!fy?.id) {
          this.loading = false;
          this.error = 'No active financial year found. Please ensure a financial year is configured.';
          this.cdr.markForCheck();
          return;
        }
        this.financialYears = [{ id: fy.id, label: fy.label }];
        if (!this.selectedFyId) this.selectedFyId = fy.id;
        this.financialYearLabel = fy.label;
        this.buildPeriodOptions();
        this.loadMfmaReport();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load dashboard data';
        this.cdr.markForCheck();
      }
    });
  }

  private loadMfmaReport() {
    const rt = this.reportType === 'section72' ? 'section72' : 'section71';
    this.api.get<any>(`/reports/mfma-report/${this.selectedFyId}`, { reportType: rt }).subscribe({
      next: (report) => {
        this.data = report;
        this.processReport(report);
        this.loading = false;
        this.cdr.markForCheck();
        this.loadCommentary();
        this.loadSubmissions();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load MFMA report data';
        this.cdr.markForCheck();
      }
    });
  }

  private processReport(report: any) {
    const summary = report?.summary || {};
    const rev = summary.totalRevenue || {};
    const exp = summary.totalExpenditure || {};

    this.collectionRate = rev.collectionRate || 0;
    this.spendingRate = exp.spendingRate || 0;
    this.budgetPerformance = Math.round((this.collectionRate + (200 - this.spendingRate)) / 2);
    this.surplus = summary.surplus || 0;

    this.totalBudgetRevenue = rev.budgetAdjusted || 0;
    this.totalActualRevenue = rev.actual || 0;
    this.totalBudgetExpenditure = exp.budgetAdjusted || 0;
    this.totalActualExpenditure = exp.actual || 0;

    this.monthlyBreakdown = (report?.monthlyBreakdown || []).map((m: any) => ({
      ...m,
      status: m.status || 'green',
    }));

    this.quarterlyBreakdown = report?.quarterlyBreakdown || [];

    this.revenueCategories = (report?.revenueCategories || []).map((c: any) => ({
      category: c.category,
      budgetOriginal: c.budgetOriginal || 0,
      budgetAdjusted: c.budgetAdjusted || 0,
      actual: c.actual || 0,
      variance: c.variance || 0,
      collectionRate: c.collectionRate || 0,
    }));

    this.expenditureCategories = (report?.expenditureCategories || []).map((c: any) => ({
      category: c.category,
      budgetOriginal: c.budgetOriginal || 0,
      budgetAdjusted: c.budgetAdjusted || 0,
      actual: c.actual || 0,
      variance: c.variance || 0,
      spendingRate: c.spendingRate || 0,
    }));

    if (this.monthlyBreakdown.length === 0 && report?.section71Monthly) {
      this.monthlyBreakdown = (report.section71Monthly || []).map((m: any, i: number) => ({
        period: i + 1,
        label: m.month || `Month ${i + 1}`,
        revenue: { budgetOriginal: 0, budgetAdjusted: m.budgetRevenue || 0, actual: m.actualRevenue || 0, variance: (m.actualRevenue || 0) - (m.budgetRevenue || 0), variancePercent: 0 },
        expenditure: { budgetOriginal: 0, budgetAdjusted: m.budgetExpenditure || 0, actual: m.actualExpenditure || 0, variance: (m.budgetExpenditure || 0) - (m.actualExpenditure || 0), variancePercent: 0 },
        surplus: (m.actualRevenue || 0) - (m.actualExpenditure || 0),
        ytdRevenue: 0,
        ytdExpenditure: 0,
        status: this.computeStatus(m),
      }));
    }
  }

  private computeStatus(m: any): 'green' | 'amber' | 'red' {
    const revPct = m.budgetRevenue > 0 ? (m.actualRevenue / m.budgetRevenue) * 100 : 100;
    const expPct = m.budgetExpenditure > 0 ? (m.actualExpenditure / m.budgetExpenditure) * 100 : 0;
    if (revPct >= 90 && expPct <= 105) return 'green';
    if (revPct >= 75 && expPct <= 115) return 'amber';
    return 'red';
  }

  private buildPeriodOptions() {
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    this.periodOptions = [
      { value: 0, label: 'All Periods' },
      ...months.map((m, i) => ({ value: i + 1, label: `Period ${i + 1} (${m})` })),
    ];
  }

  onFyChange() {
    const fy = this.financialYears.find(f => f.id === this.selectedFyId);
    if (fy) this.financialYearLabel = fy.label;
    this.loading = true;
    this.cdr.markForCheck();
    this.loadMfmaReport();
  }

  setReportType(rt: 'section71' | 'section72') {
    if (this.reportType === rt) return;
    this.reportType = rt;
    this.loading = true;
    this.cdr.markForCheck();
    this.loadMfmaReport();
  }

  onPeriodChange() {
    this.cdr.markForCheck();
  }

  loadCommentary() {
    this.api.get<any[]>(`/reports/mfma-commentary/${this.selectedFyId}`).subscribe({
      next: (items) => {
        this.commentaryMap = {};
        for (const c of items || []) {
          this.commentaryMap[`${c.period}_${c.lineItem}`] = c;
        }
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  loadSubmissions() {
    this.api.get<any[]>(`/reports/mfma-submissions/${this.selectedFyId}`).subscribe({
      next: (subs) => {
        this.submissions = subs || [];
        if (this.selectedPeriod === 0) {
          this.currentSubmission = null;
          this.currentSubmissionStatus = 'draft';
        } else {
          this.currentSubmission = this.submissions.find(s =>
            s.reportType === (this.reportType === 'section72' ? 's72' : 's71') &&
            s.period === this.selectedPeriod
          ) || null;
          this.currentSubmissionStatus = this.currentSubmission?.status || 'draft';
        }
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  getCommentary(period: number): string {
    for (const key of Object.keys(this.commentaryMap)) {
      if (key.startsWith(`${period}_`)) {
        return this.commentaryMap[key]?.commentary || '';
      }
    }
    return '';
  }

  startCommentaryEdit(period: number) {
    this.editingCommentary = period;
    this.commentaryText = this.getCommentary(period);
    this.cdr.markForCheck();
  }

  cancelCommentaryEdit() {
    this.editingCommentary = null;
    this.commentaryText = '';
    this.cdr.markForCheck();
  }

  saveCommentary(period: number, lineItem: string) {
    if (!this.commentaryText.trim()) {
      this.cancelCommentaryEdit();
      return;
    }
    this.api.post('/reports/mfma-commentary', {
      financialYearId: this.selectedFyId,
      period,
      lineItem,
      commentary: this.commentaryText,
    }).subscribe({
      next: (saved: any) => {
        this.commentaryMap[`${period}_${lineItem}`] = saved;
        this.editingCommentary = null;
        this.commentaryText = '';
        this.cdr.markForCheck();
      },
      error: () => {
        this.editingCommentary = null;
        this.cdr.markForCheck();
      }
    });
  }

  runValidation() {
    this.validating = true;
    this.cdr.markForCheck();
    const context = this.reportType === 'section72' ? 'nt_s72' : 'nt_s71';
    this.api.post<any>('/validation-rules/run', {
      financialYearId: this.selectedFyId,
      context,
      period: this.selectedPeriod || undefined,
    }).subscribe({
      next: (results) => {
        this.validationResults = (results || []).map((r: any) => ({
          ruleId: r.ruleId || r.id,
          ruleName: r.ruleName || r.rule?.name || 'Rule',
          category: r.category || r.rule?.category || '',
          status: r.status || 'pass',
          severity: r.severity || r.rule?.severity || 'info',
          message: r.message || '',
        }));
        this.validationCounts = {
          pass: this.validationResults.filter(r => r.status === 'pass').length,
          fail: this.validationResults.filter(r => r.status === 'fail').length,
          warning: this.validationResults.filter(r => r.status === 'warning').length,
        };
        this.validating = false;

        if (this.validationCounts.fail === 0) {
          this.updateSubmissionStatus('validated');
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.validating = false;
        this.cdr.markForCheck();
      }
    });
  }

  markSubmitted() {
    this.updateSubmissionStatus('submitted');
  }

  private updateSubmissionStatus(status: string) {
    this.api.post('/reports/mfma-submissions', {
      financialYearId: this.selectedFyId,
      reportType: this.reportType === 'section72' ? 's72' : 's71',
      period: this.selectedPeriod || 1,
      status,
      validationSummary: status === 'validated' ? this.validationCounts : undefined,
    }).subscribe({
      next: (sub: any) => {
        this.currentSubmission = sub;
        this.currentSubmissionStatus = sub.status || status;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  exportForSubmission() {
    this.api.post<any>('/reports/mfma-export', {
      financialYearId: this.selectedFyId,
      reportType: this.reportType,
      period: this.selectedPeriod,
      format: 'xlsx',
    }).subscribe({
      next: (job: any) => {
        if (job?.id) {
          this.pollExportJob(job.id);
        }
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Export failed';
        this.error = msg;
        this.cdr.markForCheck();
      }
    });
  }

  exportPdf() {
    this.api.post<any>('/reports/mfma-export', {
      financialYearId: this.selectedFyId,
      reportType: this.reportType,
      period: this.selectedPeriod,
      format: 'pdf',
    }).subscribe({
      next: (job: any) => {
        if (job?.id) {
          this.pollExportJob(job.id);
        }
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Export failed';
        this.error = msg;
        this.cdr.markForCheck();
      }
    });
  }

  private pollExportJob(jobId: string) {
    const interval = setInterval(() => {
      this.api.get<any>(`/exports/${jobId}/progress`).subscribe({
        next: (progress: any) => {
          if (progress.status === 'completed') {
            clearInterval(interval);
            window.open(`/api/exports/${jobId}/download`, '_blank');
          } else if (progress.status === 'failed') {
            clearInterval(interval);
            this.error = progress.error || 'Export failed';
            this.cdr.markForCheck();
          }
        },
        error: () => {
          clearInterval(interval);
        }
      });
    }, 2000);
  }

  formatCurrency(value: number): string {
    if (value == null || isNaN(value)) return 'R 0';
    const abs = Math.abs(value);
    let formatted: string;
    if (abs >= 1e9) formatted = (abs / 1e9).toFixed(2) + 'B';
    else if (abs >= 1e6) formatted = (abs / 1e6).toFixed(1) + 'M';
    else if (abs >= 1e3) formatted = (abs / 1e3).toFixed(0) + 'K';
    else formatted = abs.toFixed(0);
    return (value < 0 ? '(R ' : 'R ') + formatted + (value < 0 ? ')' : '');
  }

  getRateClass(rate: number): string {
    if (rate >= 90) return 'rate-good';
    if (rate >= 75) return 'rate-warning';
    return 'rate-danger';
  }

  getExpRateClass(rate: number): string {
    if (rate <= 100) return 'rate-good';
    if (rate <= 110) return 'rate-warning';
    return 'rate-danger';
  }
}
