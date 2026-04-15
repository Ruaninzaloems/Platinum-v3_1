import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-disciplinary',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, DateInputComponent],
  templateUrl: './disciplinary.component.html',
  styleUrl: './disciplinary.component.css'
})
export class DisciplinaryComponent implements OnInit {
  activeTab = 'cases';
  cases: any[] = [];
  grievances: any[] = [];
  employees: any[] = [];
  loading = false;

  showCaseModal = false;
  showGrievanceModal = false;
  showEditCaseModal = false;
  caseForm: any = {};
  grievanceForm: any = {};
  editCaseForm: any = {};

  progressionEmployeeId: number | null = null;
  progressionSteps: any[] = [];

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadTab();
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.loadTab();
  }

  loadTab(): void {
    switch (this.activeTab) {
      case 'cases': this.loadCases(); break;
      case 'grievances': this.loadGrievances(); break;
    }
  }

  loadEmployees(): void {
    this.api.get<any[]>('/employees', { limit: 100, sort_by: 'surname', sort_order: 'asc' }).subscribe({
      next: (data) => this.employees = data || []
    });
  }

  loadCases(): void {
    this.loading = true;
    this.api.get<any[]>('/disciplinary/cases').subscribe({
      next: (data) => { this.cases = data || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.cases = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadGrievances(): void {
    this.loading = true;
    this.api.get<any[]>('/disciplinary/grievances').subscribe({
      next: (data) => { this.grievances = data || []; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.grievances = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  getStatusClass(status: string): string {
    const map: any = { INITIATED:'status-pending', HEARING_SCHEDULED:'status-processing', HEARING_COMPLETED:'status-completed', APPEAL:'status-locked', CLOSED:'status-approved', CCMA:'status-failed' };
    return map[status] || '';
  }

  openNewCase(): void {
    this.caseForm = {};
    this.showCaseModal = true;
  }

  saveCase(): void {
    this.api.post('/disciplinary/cases', {
      employee_id: parseInt(this.caseForm.employee_id),
      charge_description: this.caseForm.charge_description,
      offence_date: this.caseForm.offence_date,
      hearing_date: this.caseForm.hearing_date,
      hearing_chairperson: this.caseForm.hearing_chairperson,
    }).subscribe({
      next: () => { this.ui.toast('success', 'Case Initiated', 'Disciplinary case created'); this.showCaseModal = false; this.loadCases(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to create case')
    });
  }

  editCase(c: any): void {
    this.editCaseForm = { ...c, hearing_date: c.hearing_date ? c.hearing_date.split('T')[0] : '' };
    this.showEditCaseModal = true;
  }

  updateCase(): void {
    this.api.put(`/disciplinary/cases/${this.editCaseForm.id}`, {
      status: this.editCaseForm.status,
      outcome: this.editCaseForm.outcome,
      sanction: this.editCaseForm.sanction,
      hearing_date: this.editCaseForm.hearing_date,
      hearing_chairperson: this.editCaseForm.hearing_chairperson,
    }).subscribe({
      next: () => { this.ui.toast('success', 'Updated', 'Case updated'); this.showEditCaseModal = false; this.loadCases(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to update case')
    });
  }

  downloadDocument(caseId: number, type: string): void {
    window.open(`/api/v1/disciplinary/${caseId}/${type}`, '_blank');
  }

  openNewGrievance(): void {
    this.grievanceForm = {};
    this.showGrievanceModal = true;
  }

  saveGrievance(): void {
    this.api.post('/disciplinary/grievances', {
      employee_id: parseInt(this.grievanceForm.employee_id),
      description: this.grievanceForm.description,
      category: this.grievanceForm.category,
    }).subscribe({
      next: () => { this.ui.toast('success', 'Grievance Filed', 'Grievance submitted'); this.showGrievanceModal = false; this.loadGrievances(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to file grievance')
    });
  }

  loadProgression(): void {
    if (!this.progressionEmployeeId) { this.ui.toast('error', 'Error', 'Please select an employee'); return; }
    this.api.get<any[]>(`/disciplinary/progression/${this.progressionEmployeeId}`).subscribe({
      next: (data) => this.progressionSteps = data || [],
      error: () => this.progressionSteps = []
    });
  }

  getProgressionMatch(stepKey: string): any {
    return this.progressionSteps.find(s => (s.outcome || '').toUpperCase() === stepKey || (s.step_type || '').toUpperCase() === stepKey);
  }

  formatDate(d: string): string {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('en-ZA'); } catch { return d.split('T')[0]; }
  }
}
