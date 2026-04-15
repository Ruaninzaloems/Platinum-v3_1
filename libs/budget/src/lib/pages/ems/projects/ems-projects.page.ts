import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EmsApiService, EmsProjectSummary, EmsProjectDetail, EmsProjectItemDto, EmsAvailableBudget } from '../../../core/services/ems-api.service';

@Component({
  selector: 'app-ems-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatInputModule, MatDialogModule, MatProgressSpinnerModule, MatTooltipModule, CurrencyPipe],
  templateUrl: './ems-projects.page.html',
  styleUrl: './ems-projects.page.scss'
})
export class EmsProjectsPage implements OnInit {
  projects: EmsProjectSummary[] = [];
  filtered: EmsProjectSummary[] = [];
  loading = false;
  error: string | null = null;

  selectedFinYear = '2025/2026';
  searchTerm = '';
  statusFilter = '';
  capOpFilter = '';

  finYears = ['2024/2025', '2025/2026', '2026/2027'];
  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: '1', label: 'Draft' },
    { value: '23', label: 'Approved' },
    { value: '24', label: 'Activated' },
    { value: '25', label: 'Completed' }
  ];
  capOpOptions = [
    { value: '', label: 'All Types' },
    { value: '1', label: 'Capital' },
    { value: '2', label: 'Operating' },
    { value: '3', label: 'Revenue' }
  ];

  selectedProject: EmsProjectDetail | null = null;
  selectedItemBudget: EmsAvailableBudget | null = null;
  loadingDetail = false;
  showDetailPanel = false;
  showCreateDialog = false;
  showHistoryFor: EmsProjectItemDto | null = null;

  newProject = {
    projectName: '',
    projectDesc: '',
    finYear: '2025/2026',
    capitalOperation: 1,
    costEstimate: 0,
    projectStatus: 1,
    capturerID: 1
  };

  get kpis() {
    const total = this.projects.length;
    const capital = this.projects.filter(p => p.capitalOperation === 1).length;
    const operating = this.projects.filter(p => p.capitalOperation === 2).length;
    const totalY1 = this.projects.reduce((s, p) => s + p.totalY1, 0);
    const totalY2 = this.projects.reduce((s, p) => s + p.totalY2, 0);
    const totalY3 = this.projects.reduce((s, p) => s + p.totalY3, 0);
    return { total, capital, operating, totalY1, totalY2, totalY3 };
  }

  constructor(private ems: EmsApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = null;
    this.ems.getProjects(this.selectedFinYear).subscribe({
      next: data => {
        this.projects = data;
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.error = 'Failed to load EMS projects'; this.loading = false; }
    });
  }

  applyFilter() {
    let result = [...this.projects];
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      result = result.filter(p => p.projectName.toLowerCase().includes(q) || (p.projectCode?.toString() ?? '').includes(q));
    }
    if (this.statusFilter) result = result.filter(p => p.projectStatus === +this.statusFilter);
    if (this.capOpFilter) result = result.filter(p => p.capitalOperation === +this.capOpFilter);
    this.filtered = result;
  }

  selectProject(project: EmsProjectSummary) {
    this.loadingDetail = true;
    this.showDetailPanel = true;
    this.selectedItemBudget = null;
    this.ems.getProject(project.projectId).subscribe({
      next: detail => { this.selectedProject = detail; this.loadingDetail = false; },
      error: () => { this.loadingDetail = false; }
    });
  }

  loadItemBudget(item: EmsProjectItemDto) {
    this.ems.getAvailableBudget(item.planProjectItemId).subscribe({
      next: data => { this.selectedItemBudget = data; this.showHistoryFor = item; },
      error: () => {}
    });
  }

  closeDetail() { this.showDetailPanel = false; this.selectedProject = null; this.selectedItemBudget = null; this.showHistoryFor = null; }

  openCreate() { this.showCreateDialog = true; this.newProject.finYear = this.selectedFinYear; }

  createProject() {
    this.ems.createProject({ ...this.newProject }).subscribe({
      next: () => { this.showCreateDialog = false; this.load(); },
      error: () => {}
    });
  }

  deleteProject(id: number, event: Event) {
    event.stopPropagation();
    if (!confirm('Delete this project?')) return;
    this.ems.deleteProject(id).subscribe({ next: () => this.load() });
  }

  getStatusClass(status: number): string {
    if (status === 24) return 'badge-success';
    if (status === 23) return 'badge-info';
    if (status === 22) return 'badge-danger';
    if (status === 20 || status === 21) return 'badge-warning';
    return 'badge-default';
  }

  getCapOpClass(capOp: number | null): string {
    if (capOp === 1) return 'badge-capital';
    if (capOp === 2) return 'badge-operating';
    if (capOp === 3) return 'badge-revenue';
    return 'badge-default';
  }

  getAvailPct(item: EmsAvailableBudget): number {
    return item.currentBudget > 0 ? Math.round((item.availableBudget / item.currentBudget) * 100) : 0;
  }

  formatZAR(val: number): string {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(val);
  }
}
