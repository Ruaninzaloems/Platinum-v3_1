import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, DateInputComponent],
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.css'
})
export class SkillsComponent implements OnInit {
  activeTab = 'courses';
  loading = false;

  courses: any[] = [];
  records: any[] = [];
  competencies: any[] = [];
  employees: any[] = [];

  qualEmployeeId: number | null = null;
  qualifications: any[] = [];

  gapEmployeeId: number | null = null;
  gapItems: any[] = [];

  wspYear = new Date().getFullYear();
  wspData: any = null;

  calendarYear = new Date().getFullYear();
  calendarMonth = new Date().getMonth() + 1;
  calendarItems: any[] = [];
  monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  showCourseModal = false;
  showRecordModal = false;
  showQualModal = false;
  showCompModal = false;
  courseForm: any = {};
  recordForm: any = {};
  qualForm: any = {};
  compForm: any = {};

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadTab();
  }

  loadEmployees(): void {
    this.api.get<any[]>('/employees', { limit: 100, sort_by: 'surname', sort_order: 'asc' }).subscribe({
      next: (data) => this.employees = data || []
    });
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.loadTab();
  }

  loadTab(): void {
    switch (this.activeTab) {
      case 'courses': this.loadCourses(); break;
      case 'records': this.loadRecords(); break;
      case 'competencies': this.loadCompetencies(); break;
      case 'wsp': this.loadWSP(); break;
      case 'trainingCalendar': this.loadCalendar(); break;
    }
  }

  loadCourses(): void {
    this.loading = true;
    this.api.get<any[]>('/skills/courses').subscribe({
      next: (data) => { this.courses = data || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.courses = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  openAddCourse(): void {
    this.courseForm = {};
    this.showCourseModal = true;
  }

  editCourse(c: any): void {
    this.courseForm = { ...c };
    this.showCourseModal = true;
  }

  deleteCourse(c: any): void {
    if (!confirm(`Delete course "${c.course_name || c.title}"?`)) return;
    this.api.delete(`/skills/courses/${c.id}`).subscribe({
      next: () => { this.ui.toast('success', 'Deleted', 'Course removed'); this.loadCourses(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to delete course')
    });
  }

  saveCourse(): void {
    const payload = {
      course_code: this.courseForm.course_code, course_name: this.courseForm.course_name,
      category: this.courseForm.category, provider: this.courseForm.provider,
      duration_hours: this.courseForm.duration_hours ? parseInt(this.courseForm.duration_hours) : null,
      cost: this.courseForm.cost ? parseFloat(this.courseForm.cost) : null,
      nqf_level: this.courseForm.nqf_level ? parseInt(this.courseForm.nqf_level) : null,
      saqa_id: this.courseForm.saqa_id, description: this.courseForm.description,
    };
    const req$ = this.courseForm.id
      ? this.api.put(`/skills/courses/${this.courseForm.id}`, payload)
      : this.api.post('/skills/courses', payload);
    req$.subscribe({
      next: () => { this.ui.toast('success', this.courseForm.id ? 'Updated' : 'Course Added', 'Training course saved'); this.showCourseModal = false; this.loadCourses(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to save course')
    });
  }

  loadRecords(): void {
    this.loading = true;
    this.api.get<any[]>('/skills/records').subscribe({
      next: (data) => { this.records = data || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.records = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  openAddRecord(): void {
    this.recordForm = {};
    this.showRecordModal = true;
  }

  editRecord(r: any): void {
    this.recordForm = { ...r };
    this.showRecordModal = true;
  }

  deleteRecord(r: any): void {
    if (!confirm(`Delete this training record?`)) return;
    this.api.delete(`/skills/records/${r.id}`).subscribe({
      next: () => { this.ui.toast('success', 'Deleted', 'Training record removed'); this.loadRecords(); this.loadCalendar(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to delete record')
    });
  }

  saveRecord(): void {
    const payload = {
      employee_id: parseInt(this.recordForm.employee_id), course_id: parseInt(this.recordForm.course_id),
      training_date: this.recordForm.training_date, status: this.recordForm.status,
      cost_actual: this.recordForm.cost_actual ? parseFloat(this.recordForm.cost_actual) : null,
      nqf_level: this.recordForm.nqf_level ? parseInt(this.recordForm.nqf_level) : null,
      cpd_points: this.recordForm.cpd_points ? parseInt(this.recordForm.cpd_points) : null,
      wsp_year: this.recordForm.wsp_year ? parseInt(this.recordForm.wsp_year) : null,
    };
    const req$ = this.recordForm.id
      ? this.api.put(`/skills/records/${this.recordForm.id}`, payload)
      : this.api.post('/skills/records', payload);
    req$.subscribe({
      next: () => { this.ui.toast('success', 'Recorded', 'Training record saved'); this.showRecordModal = false; this.loadRecords(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to save record')
    });
  }

  loadQualifications(): void {
    if (!this.qualEmployeeId) { this.qualifications = []; return; }
    this.api.get<any[]>(`/skills/qualifications/${this.qualEmployeeId}`).subscribe({
      next: (data) => this.qualifications = data || [],
      error: () => this.qualifications = []
    });
  }

  openAddQualification(): void {
    this.qualForm = {};
    this.showQualModal = true;
  }

  editQualification(q: any): void {
    this.qualForm = { ...q };
    this.showQualModal = true;
  }

  async deleteQualification(q: any): Promise<void> {
    const confirmed = await this.ui.confirm({ title: 'Delete Qualification', message: `Delete "${q.qualification_name}"?`, danger: true });
    if (!confirmed) return;
    this.api.delete(`/skills/qualifications/${q.id}`).subscribe({
      next: () => { this.ui.toast('success', 'Deleted', 'Qualification removed'); this.loadQualifications(); this.cdr.detectChanges(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to delete qualification')
    });
  }

  saveQualification(): void {
    const payload = {
      employee_id: parseInt(this.qualForm.employee_id), qualification_name: this.qualForm.qualification_name,
      qualification_type: this.qualForm.qualification_type, institution: this.qualForm.institution,
      nqf_level: this.qualForm.nqf_level ? parseInt(this.qualForm.nqf_level) : null,
      year_obtained: this.qualForm.year_obtained ? parseInt(this.qualForm.year_obtained) : null,
      reference_number: this.qualForm.reference_number,
    };
    const obs = this.qualForm.id
      ? this.api.put(`/skills/qualifications/${this.qualForm.id}`, payload)
      : this.api.post('/skills/qualifications', payload);
    obs.subscribe({
      next: () => { this.ui.toast('success', 'Saved', 'Qualification saved'); this.showQualModal = false; this.loadQualifications(); this.cdr.detectChanges(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to save qualification')
    });
  }

  loadCompetencies(): void {
    this.loading = true;
    this.api.get<any[]>('/skills/competencies').subscribe({
      next: (data) => { this.competencies = data || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.competencies = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  openAddCompetency(): void {
    this.compForm = {};
    this.showCompModal = true;
  }

  editCompetency(c: any): void {
    this.compForm = { ...c };
    this.showCompModal = true;
  }

  deleteCompetency(c: any): void {
    if (!confirm(`Delete competency "${c.name}"?`)) return;
    this.api.delete(`/skills/competencies/${c.id}`).subscribe({
      next: () => { this.ui.toast('success', 'Deleted', 'Competency removed'); this.loadCompetencies(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to delete competency')
    });
  }

  saveCompetency(): void {
    const payload = {
      name: this.compForm.name, category: this.compForm.category, description: this.compForm.description,
    };
    const req$ = this.compForm.id
      ? this.api.put(`/skills/competencies/${this.compForm.id}`, payload)
      : this.api.post('/skills/competencies', payload);
    req$.subscribe({
      next: () => { this.ui.toast('success', this.compForm.id ? 'Updated' : 'Added', 'Competency saved'); this.showCompModal = false; this.loadCompetencies(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to save')
    });
  }

  loadGapAnalysis(): void {
    if (!this.gapEmployeeId) { this.gapItems = []; return; }
    this.api.get<any[]>(`/skills/gap-analysis/${this.gapEmployeeId}`).subscribe({
      next: (data) => this.gapItems = data || [],
      error: () => this.gapItems = []
    });
  }

  getGapBadgeClass(gap: number): string {
    if (gap >= 2) return 'badge-danger';
    if (gap === 1) return 'badge-warning';
    return 'badge-success';
  }

  loadWSP(): void {
    this.api.get<any>(`/skills/wsp-summary/${this.wspYear}`).subscribe({
      next: (data) => this.wspData = data,
      error: () => this.wspData = null
    });
  }

  loadCalendar(): void {
    this.api.get<any[]>(`/skills/training-calendar/${this.calendarYear}/${this.calendarMonth}`).subscribe({
      next: (data) => this.calendarItems = data || [],
      error: () => this.calendarItems = []
    });
  }

  formatDate(d: string): string {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('en-ZA'); } catch { return '-'; }
  }
}
