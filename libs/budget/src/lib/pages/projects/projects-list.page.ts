import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '../../core/services/api.service';
import { ProjectItem, ProjectBudgetLine, Department, ScoaSegment } from '../../core/models/budget.models';

interface BudgetLineForm {
  id?: number;
  scoaItemId: number;
  scoaFundId: number;
  scoaFunctionId: number;
  scoaRegionId: number;
  scoaCostingId: number;
  departmentId: number | null;
  year1Amount: number;
  year2Amount: number;
  year3Amount: number;
  month01: number; month02: number; month03: number; month04: number;
  month05: number; month06: number; month07: number; month08: number;
  month09: number; month10: number; month11: number; month12: number;
}

@Component({
  selector: 'app-projects-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatInputModule, MatProgressBarModule],
  templateUrl: './projects-list.page.html',
  styleUrls: ['./projects-list.page.scss']
})
export class ProjectsListPage implements OnInit {
  projects: ProjectItem[] = [];
  departments: Department[] = [];
  scoaItems: ScoaSegment[] = [];
  scoaFunds: ScoaSegment[] = [];
  scoaFunctions: ScoaSegment[] = [];
  scoaRegions: ScoaSegment[] = [];
  scoaCostings: ScoaSegment[] = [];

  filterDept = 0;
  filterType = '';
  showCreateDialog = false;
  showDetailDialog = false;
  editingProject: ProjectItem | null = null;
  selectedProject: ProjectItem | null = null;
  activeTab: 'details' | 'scoa' = 'details';
  saving = false;
  expandedLine: number | null = null;

  months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  newProject: any = this.getEmptyProject();
  budgetLines: BudgetLineForm[] = [];

  get capitalCount() { return this.projects.filter(p => p.type === 'Capital').length; }
  get operationalCount() { return this.projects.filter(p => p.type === 'Operational').length; }
  get revenueCount() { return this.projects.filter(p => p.type === 'Revenue').length; }
  get totalBudget() { return this.projects.reduce((s, p) => s + p.totalBudgetYear1, 0); }
  get scoaTotalYear1() { return this.budgetLines.reduce((s, l) => s + (l.year1Amount || 0), 0); }
  get scoaTotalYear2() { return this.budgetLines.reduce((s, l) => s + (l.year2Amount || 0), 0); }
  get scoaTotalYear3() { return this.budgetLines.reduce((s, l) => s + (l.year3Amount || 0), 0); }

  constructor(private api: ApiService, private router: Router) {}

  captureNewProject() {
    this.router.navigate(['/projects/capture']);
  }

  captureEditProject(p: ProjectItem) {
    this.router.navigate(['/projects/capture', p.id]);
  }

  ngOnInit() {
    this.api.getDepartments().subscribe(d => this.departments = d);
    this.api.getScoaItems().subscribe(d => this.scoaItems = d);
    this.api.getScoaFunds().subscribe(d => this.scoaFunds = d);
    this.api.getScoaFunctions().subscribe(d => this.scoaFunctions = d);
    this.api.getScoaRegions().subscribe(d => this.scoaRegions = d);
    this.api.getScoaCostings().subscribe(d => this.scoaCostings = d);
    this.loadProjects();
  }

  loadProjects() {
    this.api.getProjects(this.filterDept || undefined, this.filterType || undefined).subscribe(p => this.projects = p);
  }

  formatCurrency(v: number | null | undefined): string {
    if (!v) return 'R 0';
    return 'R ' + v.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  padMonth(n: number): string {
    return n < 10 ? '0' + n : '' + n;
  }

  getEmptyProject() {
    return {
      projectCode: '', projectName: '', description: '', type: 'Capital',
      departmentId: null, ward: '', idpLink: '', idpPriorityArea: '', idpStrategicObjective: '',
      gpsCoordinates: '', projectManager: '', contractorName: '', contractNumber: '',
      fundingSource: '', startDate: null, endDate: null, totalProjectCost: null
    };
  }

  getEmptyBudgetLine(): BudgetLineForm {
    return {
      scoaItemId: 0, scoaFundId: 0, scoaFunctionId: 0, scoaRegionId: 0, scoaCostingId: 0,
      departmentId: null, year1Amount: 0, year2Amount: 0, year3Amount: 0,
      month01: 0, month02: 0, month03: 0, month04: 0,
      month05: 0, month06: 0, month07: 0, month08: 0,
      month09: 0, month10: 0, month11: 0, month12: 0
    };
  }

  openCreateDialog() {
    this.editingProject = null;
    this.newProject = this.getEmptyProject();
    this.budgetLines = [];
    this.activeTab = 'details';
    this.showCreateDialog = true;
  }

  editProject(p: ProjectItem) {
    this.showDetailDialog = false;
    this.api.getProject(p.id).subscribe(detail => {
      this.editingProject = detail;
      this.newProject = {
        projectCode: detail.projectCode,
        projectName: detail.projectName,
        description: detail.description || '',
        type: detail.type,
        departmentId: detail.departmentId,
        ward: detail.ward || '',
        idpLink: detail.idpLink || '',
        idpPriorityArea: detail.idpPriorityArea || '',
        idpStrategicObjective: detail.idpStrategicObjective || '',
        gpsCoordinates: detail.gpsCoordinates || '',
        projectManager: detail.projectManager || '',
        contractorName: detail.contractorName || '',
        contractNumber: detail.contractNumber || '',
        fundingSource: detail.fundingSource || '',
        startDate: detail.startDate ? detail.startDate.substring(0, 10) : null,
        endDate: detail.endDate ? detail.endDate.substring(0, 10) : null,
        totalProjectCost: detail.totalProjectCost
      };
      this.budgetLines = (detail.budgetLines || []).map(bl => ({
        id: bl.id,
        scoaItemId: bl.scoaItemId,
        scoaFundId: bl.scoaFundId,
        scoaFunctionId: bl.scoaFunctionId,
        scoaRegionId: bl.scoaRegionId,
        scoaCostingId: bl.scoaCostingId,
        departmentId: bl.departmentId,
        year1Amount: bl.year1Amount,
        year2Amount: bl.year2Amount,
        year3Amount: bl.year3Amount,
        month01: bl.month01, month02: bl.month02, month03: bl.month03, month04: bl.month04,
        month05: bl.month05, month06: bl.month06, month07: bl.month07, month08: bl.month08,
        month09: bl.month09, month10: bl.month10, month11: bl.month11, month12: bl.month12
      }));
      this.activeTab = 'details';
      this.showCreateDialog = true;
    });
  }

  openProjectDetail(p: ProjectItem) {
    this.api.getProject(p.id).subscribe(detail => {
      this.selectedProject = detail;
      this.expandedLine = null;
      this.showDetailDialog = true;
    });
  }

  addBudgetLine() {
    this.budgetLines.push(this.getEmptyBudgetLine());
  }

  removeBudgetLine(index: number) {
    this.budgetLines.splice(index, 1);
  }

  getMonthValue(line: any, monthIndex: number): number {
    return line['month' + this.padMonth(monthIndex)] || 0;
  }

  setMonthValue(line: any, monthIndex: number, value: number) {
    line['month' + this.padMonth(monthIndex)] = value;
  }

  getCashflowTotal(line: BudgetLineForm): number {
    const a: any = line;
    let total = 0;
    for (let i = 1; i <= 12; i++) {
      total += (a['month' + this.padMonth(i)] || 0);
    }
    return total;
  }

  autoDistributeCashflow(line: BudgetLineForm) {
    if (this.getCashflowTotal(line) === 0 && line.year1Amount > 0) {
      this.evenDistribute(line);
    }
  }

  evenDistribute(line: BudgetLineForm) {
    const a: any = line;
    const monthly = Math.floor((line.year1Amount || 0) / 12 * 100) / 100;
    const remainder = Math.round(((line.year1Amount || 0) - monthly * 12) * 100) / 100;
    for (let i = 1; i <= 12; i++) {
      a['month' + this.padMonth(i)] = i === 1 ? monthly + remainder : monthly;
    }
  }

  getLineMonths(line: BudgetLineForm): number[] {
    const a: any = line;
    return Array.from({length: 12}, (_, i) => a['month' + this.padMonth(i + 1)] || 0);
  }

  toggleCashflow(index: number) {
    this.expandedLine = this.expandedLine === index ? null : index;
  }

  private mapLineToPayload(l: BudgetLineForm, includeId = false): any {
    const payload: any = {
      scoaItemId: l.scoaItemId,
      scoaFundId: l.scoaFundId,
      scoaFunctionId: l.scoaFunctionId,
      scoaRegionId: l.scoaRegionId,
      scoaCostingId: l.scoaCostingId,
      departmentId: l.departmentId,
      year1Amount: l.year1Amount || 0,
      year2Amount: l.year2Amount || 0,
      year3Amount: l.year3Amount || 0
    };
    if (includeId) payload.id = l.id || null;
    for (let i = 1; i <= 12; i++) {
      const key = 'month' + this.padMonth(i);
      payload[key] = (l as any)[key] || 0;
    }
    return payload;
  }

  saveProject() {
    this.saving = true;
    const typeMap: any = { 'Capital': 1, 'Operational': 2, 'Revenue': 3, 'Mixed': 4 };

    if (this.editingProject) {
      const updateData: any = { ...this.newProject };
      updateData.type = typeMap[this.newProject.type] || 1;
      this.api.updateProject(this.editingProject.id, updateData).subscribe({
        next: () => {
          const lines = this.budgetLines.map(l => this.mapLineToPayload(l, true));
          this.api.batchUpdateProjectBudgetLines(this.editingProject!.id, lines).subscribe({
            next: () => {
              this.showCreateDialog = false;
              this.saving = false;
              this.loadProjects();
            },
            error: () => this.saving = false
          });
        },
        error: () => this.saving = false
      });
    } else {
      const createData: any = {
        ...this.newProject,
        type: typeMap[this.newProject.type] || 1,
        budgetLines: this.budgetLines.map(l => this.mapLineToPayload(l))
      };
      this.api.createProject(createData).subscribe({
        next: () => {
          this.showCreateDialog = false;
          this.saving = false;
          this.newProject = this.getEmptyProject();
          this.budgetLines = [];
          this.loadProjects();
        },
        error: () => this.saving = false
      });
    }
  }
}
