import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-recruitment',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, DateInputComponent],
  templateUrl: './recruitment.component.html',
  styleUrl: './recruitment.component.css'
})
export class RecruitmentComponent implements OnInit {
  activeTab = 'vacancies';
  loading = false;

  vacancies: any[] = [];
  organogramVacancies: any[] = [];
  applicants: any[] = [];
  interviews: any[] = [];
  onboardingList: any[] = [];
  pipeline: any = {};
  probationAlerts: any[] = [];

  showVacancyModal = false;
  showApplicantModal = false;
  showInterviewModal = false;
  showOnboardingModal = false;

  vacancyForm: any = {};
  applicantForm: any = {};
  interviewForm: any = {};
  onboardingForm: any = {};
  editingVacancyId: number | null = null;
  editingInterviewId: number | null = null;
  editingOnboardingId: number | null = null;

  positions: any[] = [];
  departments: any[] = [];
  employees: any[] = [];

  pipelineStages = [
    { key: 'applied', label: 'Applied', icon: 'fileText', color: '#3B82F6' },
    { key: 'shortlisted', label: 'Shortlisted', icon: 'filter', color: '#8B5CF6' },
    { key: 'interviewed', label: 'Interviewed', icon: 'calendar', color: '#F59E0B' },
    { key: 'offered', label: 'Offered', icon: 'send', color: '#06B6D4' },
    { key: 'hired', label: 'Hired', icon: 'userCheck', color: '#10B981' },
    { key: 'rejected', label: 'Rejected', icon: 'xCircle', color: '#EF4444' },
  ];

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadTab();
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.loadTab();
  }

  loadTab(): void {
    switch (this.activeTab) {
      case 'vacancies': this.loadVacancies(); break;
      case 'organogram': this.loadOrganogramVacancies(); break;
      case 'applicants': this.loadApplicants(); break;
      case 'interviews': this.loadInterviews(); break;
      case 'onboarding': this.loadOnboarding(); break;
      case 'pipeline': this.loadPipeline(); break;
      case 'scoring': this.loadApplicants(); break;
      case 'probation': this.loadProbation(); break;
    }
  }

  loadVacancies(): void {
    this.loading = true;
    this.api.get<any[]>('/recruitment/vacancies').subscribe({
      next: (data) => { this.vacancies = data || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.vacancies = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadOrganogramVacancies(): void {
    this.loading = true;
    this.api.get<any[]>('/recruitment/vacancies/from-organogram').subscribe({
      next: (data) => { this.organogramVacancies = data || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.organogramVacancies = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadApplicants(): void {
    this.loading = true;
    this.api.get<any[]>('/recruitment/applicants').subscribe({
      next: (data) => { this.applicants = data || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.applicants = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadInterviews(): void {
    this.loading = true;
    this.api.get<any[]>('/recruitment/interview-slots').subscribe({
      next: (data) => { this.interviews = data || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.interviews = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadOnboarding(): void {
    this.loading = true;
    this.api.get<any[]>('/recruitment/onboarding').subscribe({
      next: (data) => { this.onboardingList = data || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.onboardingList = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadPipeline(): void {
    this.api.get<any>('/recruitment/pipeline').subscribe({
      next: (data) => this.pipeline = data || {},
      error: () => this.pipeline = {}
    });
  }

  loadProbation(): void {
    this.loading = true;
    this.api.get<any[]>('/employees/probation-alerts').subscribe({
      next: (data) => { this.probationAlerts = data || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.probationAlerts = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  getPipelineTotal(): number {
    return this.pipelineStages.reduce((sum, s) => sum + (parseInt(this.pipeline[s.key]) || 0), 0) || 1;
  }

  getPipelinePct(key: string): number {
    return Math.round(((parseInt(this.pipeline[key]) || 0) / this.getPipelineTotal()) * 100);
  }

  getVacancyStatusClass(status: string): string {
    const map: any = { DRAFT:'status-pending', OPEN:'status-processing', SHORTLISTING:'status-locked', INTERVIEWING:'status-completed', OFFERED:'status-approved', FILLED:'status-approved', CANCELLED:'status-failed' };
    return map[status] || '';
  }

  openAddVacancy(): void {
    this.vacancyForm = { start_date: '1900-01-01', end_date: '9999-12-31' };
    this.editingVacancyId = null;
    this.loadLookups();
    this.showVacancyModal = true;
  }

  editVacancy(v: any): void {
    this.vacancyForm = { ...v };
    this.editingVacancyId = v.id;
    this.loadLookups();
    this.showVacancyModal = true;
  }

  deleteVacancy(v: any): void {
    if (!confirm('Are you sure you want to delete this vacancy?')) return;
    this.api.delete(`/recruitment/vacancies/${v.id}`).subscribe({
      next: () => { this.ui.toast('success', 'Deleted', 'Vacancy deleted'); this.loadVacancies(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to delete vacancy')
    });
  }

  editApplicant(a: any): void {
    this.applicantForm = { ...a };
    this.showApplicantModal = true;
  }

  deleteApplicant(a: any): void {
    if (!confirm('Are you sure you want to delete this applicant?')) return;
    this.api.delete(`/recruitment/applicants/${a.id}`).subscribe({
      next: () => { this.ui.toast('success', 'Deleted', 'Applicant deleted'); this.loadApplicants(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to delete applicant')
    });
  }

  editInterview(slot: any): void {
    this.interviewForm = { ...slot };
    this.editingInterviewId = slot.id;
    this.loadLookups();
    this.showInterviewModal = true;
  }

  deleteInterview(slot: any): void {
    if (!confirm('Are you sure you want to delete this interview?')) return;
    this.api.delete(`/recruitment/interview-slots/${slot.id}`).subscribe({
      next: () => { this.ui.toast('success', 'Deleted', 'Interview deleted'); this.loadInterviews(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to delete interview')
    });
  }

  editOnboarding(cl: any): void {
    this.onboardingForm = { ...cl };
    this.editingOnboardingId = cl.id;
    this.loadLookups();
    this.showOnboardingModal = true;
  }

  deleteOnboarding(cl: any): void {
    if (!confirm('Are you sure you want to delete this onboarding checklist?')) return;
    this.api.delete(`/recruitment/onboarding/${cl.id}`).subscribe({
      next: () => { this.ui.toast('success', 'Deleted', 'Onboarding checklist deleted'); this.loadOnboarding(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to delete checklist')
    });
  }

  loadLookups(): void {
    if (this.positions.length === 0) {
      this.api.get<any[]>('/positions', { limit: 100 }).subscribe({ next: (d) => this.positions = d || [] });
    }
    if (this.departments.length === 0) {
      this.api.get<any[]>('/departments', { limit: 100 }).subscribe({ next: (d) => this.departments = d || [] });
    }
    if (this.employees.length === 0) {
      this.api.get<any[]>('/employees', { limit: 200, sort_by: 'surname', sort_order: 'asc' }).subscribe({ next: (d) => this.employees = d || [] });
    }
  }

  saveVacancy(): void {
    const payload = {
      position_id: parseInt(this.vacancyForm.position_id),
      department_id: this.vacancyForm.department_id ? parseInt(this.vacancyForm.department_id) : null,
      title: '', closing_date: this.vacancyForm.closing_date,
      requirements: this.vacancyForm.requirements, duties: this.vacancyForm.duties,
    };
    const req = this.editingVacancyId
      ? this.api.put(`/recruitment/vacancies/${this.editingVacancyId}`, payload)
      : this.api.post('/recruitment/vacancies', payload);
    req.subscribe({
      next: () => { this.ui.toast('success', this.editingVacancyId ? 'Updated' : 'Vacancy Created', this.editingVacancyId ? 'Vacancy updated' : 'New vacancy posted'); this.showVacancyModal = false; this.editingVacancyId = null; this.loadVacancies(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to save vacancy')
    });
  }

  openScheduleInterview(): void {
    this.interviewForm = {};
    this.editingInterviewId = null;
    this.loadLookups();
    this.showInterviewModal = true;
  }

  saveInterview(): void {
    const payload = {
      applicant_id: parseInt(this.interviewForm.applicant_id),
      interview_date: this.interviewForm.interview_date,
      interview_time: this.interviewForm.interview_time,
      interviewer_name: this.interviewForm.interviewer_name,
      venue: this.interviewForm.venue,
      interview_type: this.interviewForm.interview_type,
      notes: this.interviewForm.notes,
    };
    const req = this.editingInterviewId
      ? this.api.put(`/recruitment/interview-slots/${this.editingInterviewId}`, payload)
      : this.api.post('/recruitment/interview-slots', payload);
    req.subscribe({
      next: () => { this.ui.toast('success', this.editingInterviewId ? 'Updated' : 'Scheduled', this.editingInterviewId ? 'Interview updated' : 'Interview slot created'); this.showInterviewModal = false; this.editingInterviewId = null; this.loadInterviews(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to save interview')
    });
  }

  openCreateOnboarding(): void {
    this.onboardingForm = { start_date: '1900-01-01' };
    this.editingOnboardingId = null;
    this.loadLookups();
    this.showOnboardingModal = true;
  }

  saveOnboarding(): void {
    const items = (this.onboardingForm.items || '').split('\n').filter((i: string) => i.trim()).map((i: string) => i.trim());
    const payload = {
      employee_id: parseInt(this.onboardingForm.employee_id),
      start_date: this.onboardingForm.start_date,
      items: items,
    };
    const req = this.editingOnboardingId
      ? this.api.put(`/recruitment/onboarding/${this.editingOnboardingId}`, payload)
      : this.api.post('/recruitment/onboarding', payload);
    req.subscribe({
      next: () => { this.ui.toast('success', this.editingOnboardingId ? 'Updated' : 'Created', this.editingOnboardingId ? 'Onboarding checklist updated' : 'Onboarding checklist created'); this.showOnboardingModal = false; this.editingOnboardingId = null; this.loadOnboarding(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to save checklist')
    });
  }

  getCompletionPct(cl: any): number {
    const total = cl.total_items || 0;
    const completed = cl.completed_items || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  getCompletionColor(pct: number): string {
    if (pct >= 75) return '#10B981';
    if (pct >= 50) return '#3B82F6';
    if (pct >= 25) return '#F59E0B';
    return '#EF4444';
  }

  formatDate(d: string): string {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('en-ZA'); } catch { return '-'; }
  }

  formatSalary(v: any): string {
    if (!v) return '';
    return 'R ' + parseFloat(v).toLocaleString();
  }
}
