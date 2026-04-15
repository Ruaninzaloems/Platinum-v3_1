import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, PaginationComponent, DateInputComponent],
  templateUrl: './performance.component.html',
  styleUrl: './performance.component.css'
})
export class PerformanceComponent implements OnInit {
  activeTab = 'indicators';
  loading = true;

  periods: any[] = [];
  employees: any[] = [];
  indicators: any[] = [];
  indicatorsMeta: any = {};
  selectedPeriod: number | null = null;
  indicatorsPage = 1;

  scoringData: any[] = [];
  scoringByEmployee: any[] = [];
  scoringStats = { assessed: 0, totalKpis: 0, scored: 0, pending: 0 };

  feedback360: any[] = [];
  pips: any[] = [];
  goals: any[] = [];

  reviews: any[] = [];
  selectedReviewEmployee: number | null = null;

  showIndicatorModal = false;
  showScoreModal = false;
  show360Modal = false;
  showPIPModal = false;

  indicatorForm: any = {};
  scoreForm: any = {};
  fb360Form: any = {};
  pipForm: any = {};

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadInitial();
  }

  loadInitial(): void {
    this.loading = true;
    this.api.get<any[]>('/performance/periods').subscribe({
      next: (data) => {
        this.periods = data || [];
        if (this.periods.length > 0 && !this.selectedPeriod) {
          this.selectedPeriod = this.periods[0].id;
         this.cdr.detectChanges(); }
        this.loading = false; this.cdr.detectChanges();
        this.loadTab();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
    this.api.get<any[]>('/employees', { limit: 200, sort_by: 'surname', sort_order: 'asc' }).subscribe({
      next: (data) => this.employees = data || []
    });
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.loadTab();
  }

  loadTab(): void {
    switch (this.activeTab) {
      case 'indicators': this.loadIndicators(); break;
      case 'scoring': this.loadScoring(); break;
      case '360': this.load360(); break;
      case 'pip': this.loadPIPs(); break;
      case 'reviews': this.loadReviews(); break;
      case 'goals': break;
    }
  }

  loadIndicators(): void {
    const params: any = { limit: 20, page: this.indicatorsPage };
    if (this.selectedPeriod) params.period_id = this.selectedPeriod;
    this.api.getRaw<any>('/performance/indicators', params).subscribe({
      next: (res) => {
        this.indicators = res.data || [];
        this.indicatorsMeta = res.meta || {};
      }
    });
  }

  onPeriodChange(): void {
    this.indicatorsPage = 1;
    this.loadTab();
  }

  onIndicatorsPage(page: number): void {
    this.indicatorsPage = page;
    this.loadIndicators();
  }

  getScoreColor(score: any): string {
    const s = parseFloat(score);
    if (s >= 4) return '#10B981';
    if (s >= 3) return '#3B82F6';
    if (s >= 2) return '#F59E0B';
    if (s >= 1) return '#EF4444';
    return '#94A3B8';
  }

  getRatingLabel(score: any): string {
    const s = parseFloat(score);
    if (s >= 4) return 'Outstanding';
    if (s >= 3) return 'Good';
    if (s >= 2) return 'Needs Improvement';
    if (s >= 1) return 'Unsatisfactory';
    return 'Not Scored';
  }

  openAddIndicator(): void {
    this.indicatorForm = { period_id: this.selectedPeriod };
    this.showIndicatorModal = true;
  }

  saveIndicator(): void {
    this.api.post('/performance/indicators', {
      period_id: parseInt(this.indicatorForm.period_id),
      employee_id: parseInt(this.indicatorForm.employee_id),
      kpa: this.indicatorForm.kpa,
      kpi: this.indicatorForm.kpi,
      unit_of_measure: this.indicatorForm.unit_of_measure,
      baseline: this.indicatorForm.baseline,
      annual_target: this.indicatorForm.annual_target,
      q1_target: this.indicatorForm.q1_target,
      q2_target: this.indicatorForm.q2_target,
      q3_target: this.indicatorForm.q3_target,
      q4_target: this.indicatorForm.q4_target,
      weighting: this.indicatorForm.weighting || 0,
    }).subscribe({
      next: () => {
        this.ui.toast('success', 'Created', 'Performance indicator added successfully');
        this.showIndicatorModal = false;
        this.loadIndicators();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to save indicator')
    });
  }

  openScoreIndicator(ind: any): void {
    this.scoreForm = { id: ind.id, score: '', status: 'DRAFT', q1_actual: '', q2_actual: '', q3_actual: '', q4_actual: '' };
    this.showScoreModal = true;
  }

  saveScore(): void {
    const body: any = {};
    if (this.scoreForm.q1_actual) body.q1_actual = this.scoreForm.q1_actual;
    if (this.scoreForm.q2_actual) body.q2_actual = this.scoreForm.q2_actual;
    if (this.scoreForm.q3_actual) body.q3_actual = this.scoreForm.q3_actual;
    if (this.scoreForm.q4_actual) body.q4_actual = this.scoreForm.q4_actual;
    if (this.scoreForm.score) body.score = parseFloat(this.scoreForm.score);
    if (this.scoreForm.status) body.status = this.scoreForm.status;
    this.api.put(`/performance/indicators/${this.scoreForm.id}`, body).subscribe({
      next: () => {
        this.ui.toast('success', 'Scored', 'Performance score recorded');
        this.showScoreModal = false;
        this.loadTab();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to save score')
    });
  }

  loadScoring(): void {
    const params: any = { limit: 50 };
    if (this.selectedPeriod) params.period_id = this.selectedPeriod;
    this.api.getRaw<any>('/performance/indicators', params).subscribe({
      next: (res) => {
        const data = res.data || [];
        this.scoringData = data;
        const byEmp: any = {};
        data.forEach((ind: any) => {
          const key = ind.employee_id;
          if (!byEmp[key]) {
            byEmp[key] = { employee_id: key, name: `${ind.employee_code} - ${ind.first_name} ${ind.surname}`, indicators: [], totalWeight: 0, weightedScore: 0 };
          }
          byEmp[key].indicators.push(ind);
          const w = parseFloat(ind.weighting) || 0;
          const s = parseFloat(ind.score) || 0;
          byEmp[key].totalWeight += w;
          byEmp[key].weightedScore += w * s;
        });
        this.scoringByEmployee = Object.values(byEmp).map((emp: any) => ({
          ...emp,
          avgScore: emp.totalWeight > 0 ? (emp.weightedScore / emp.totalWeight).toFixed(1) : '-',
        }));
        this.scoringStats = {
          assessed: Object.keys(byEmp).length,
          totalKpis: data.length,
          scored: data.filter((i: any) => i.score > 0).length,
          pending: data.filter((i: any) => !i.score).length,
        };
      }
    });
  }

  load360(): void {
    this.api.get<any[]>('/performance/feedback-360').subscribe({
      next: (data) => this.feedback360 = data || [],
      error: () => this.feedback360 = []
    });
  }

  open360Form(): void {
    this.fb360Form = {};
    this.show360Modal = true;
  }

  save360(): void {
    this.api.post('/performance/feedback-360', {
      employee_id: parseInt(this.fb360Form.employee_id),
      period_id: parseInt(this.fb360Form.period_id),
      due_date: this.fb360Form.due_date || null,
    }).subscribe({
      next: () => {
        this.ui.toast('success', 'Created', '360 feedback initiated');
        this.show360Modal = false;
        this.load360();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to create')
    });
  }

  loadPIPs(): void {
    this.api.get<any[]>('/performance/pip').subscribe({
      next: (data) => this.pips = data || [],
      error: () => this.pips = []
    });
  }

  openPIPForm(): void {
    this.pipForm = {};
    this.showPIPModal = true;
  }

  savePIP(): void {
    this.api.post('/performance/pip', {
      employee_id: parseInt(this.pipForm.employee_id),
      start_date: this.pipForm.start_date,
      end_date: this.pipForm.end_date,
      reason: this.pipForm.reason,
      objectives: this.pipForm.objectives,
      support: this.pipForm.support,
    }).subscribe({
      next: () => {
        this.ui.toast('success', 'Created', 'PIP created');
        this.showPIPModal = false;
        this.loadPIPs();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to create PIP')
    });
  }

  loadReviews(): void {
    if (!this.selectedReviewEmployee) { this.reviews = []; return; }
    this.api.get<any[]>(`/performance/reviews/${this.selectedReviewEmployee}`).subscribe({
      next: (data) => this.reviews = Array.isArray(data) ? data : [],
      error: () => this.reviews = []
    });
  }

  onReviewEmployeeChange(): void {
    this.loadReviews();
  }

  startReview(): void {
    if (!this.selectedReviewEmployee) { this.ui.toast('warning', 'Required', 'Please select an employee'); return; }
    if (!this.selectedPeriod) { this.ui.toast('warning', 'Required', 'Please select a period'); return; }
    this.api.post('/performance/reviews', { employee_id: this.selectedReviewEmployee, period_id: this.selectedPeriod }).subscribe({
      next: () => {
        this.ui.toast('success', 'Created', 'Performance review started');
        this.loadReviews();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to start review')
    });
  }

  formatDate(d: string): string {
    if (!d) return '-';
    return d.split('T')[0];
  }
}
