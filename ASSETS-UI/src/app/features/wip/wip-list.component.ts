import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-wip-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './wip-list.component.html',
  styleUrls: ['./wip-list.component.css']
})
export class WipListComponent implements OnInit {
  projects = signal<any[]>([]);
  statuses = signal<any[]>([]);
  departments = signal<any[]>([]);
  divisions = signal<any[]>([]);
  employees = signal<any[]>([]);
  planProjects = signal<any[]>([]);
  fundingSources = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);
  showNewForm = false;
  showScmModal = false;
  scmContracts = signal<any[]>([]);
  scmContractsLoading = signal(false);
  filterFinYear = '';
  filterStatus = '';
  deleteConfirmId: number | null = null;

  newProject: any = {};

  financialYears: string[] = [];

  totalProjects = computed(function(this: WipListComponent) { return this.projects().length; }.bind(this));

  totalContractValue = computed(function(this: WipListComponent) {
    let sum = 0;
    const list = this.projects();
    for (let i = 0; i < list.length; i++) { sum += Number(list[i].contractValue) || 0; }
    return sum;
  }.bind(this));

  totalWipClosing = computed(function(this: WipListComponent) {
    let sum = 0;
    const list = this.projects();
    for (let i = 0; i < list.length; i++) { sum += Number(list[i].wipClosingBalance) || 0; }
    return sum;
  }.bind(this));

  constructor(private api: ApiService, private router: Router, private snack: MatSnackBar) {}

  ngOnInit() {
    this.resetNewProject();
    this.api.getFinancialYears().subscribe({
      next: function(this: WipListComponent, rows: any[]) {
        this.financialYears = rows.map(function(r: any) { return r.finyear || r.finYear; });
        const def = rows.find(function(r: any) { return r.isdefault || r.isDefault; });
        if (def) {
          const fy = def.finyear || def.finYear;
          this.filterFinYear = fy;
          this.newProject.finYear = fy;
        }
        this.syncScmAndLoad();
      }.bind(this),
      error: function(this: WipListComponent) { this.syncScmAndLoad(); }.bind(this)
    });
    this.api.getWipProjectStatuses().subscribe({
      next: function(this: WipListComponent, r: any) { this.statuses.set(Array.isArray(r) ? r : []); }.bind(this),
      error: function() {}
    });
    this.api.getConstFundingSources().subscribe({
      next: function(this: WipListComponent, r: any) { this.fundingSources.set(Array.isArray(r) ? r : []); }.bind(this),
      error: function() {}
    });
    this.api.getDepartments().subscribe({
      next: function(this: WipListComponent, r: any) { this.departments.set(Array.isArray(r) ? r : []); }.bind(this),
      error: function() {}
    });
    this.api.getDivisions().subscribe({
      next: function(this: WipListComponent, r: any) { this.divisions.set(Array.isArray(r) ? r : []); }.bind(this),
      error: function() {}
    });
    this.api.getEmployees().subscribe({
      next: function(this: WipListComponent, r: any) { this.employees.set(Array.isArray(r) ? r : []); }.bind(this),
      error: function() {}
    });
    this.api.getPlanProjects().subscribe({
      next: function(this: WipListComponent, r: any) { this.planProjects.set(Array.isArray(r) ? r : []); }.bind(this),
      error: function() {}
    });
  }

  getFilteredDivisions(): any[] {
    const deptId = this.newProject.departmentId;
    if (!deptId) { return this.divisions(); }
    const list = this.divisions();
    const result = [];
    for (let i = 0; i < list.length; i++) {
      if (Number(list[i].departmentId) === Number(deptId)) { result.push(list[i]); }
    }
    return result;
  }

  onDepartmentChange() {
    this.newProject.divisionId = null;
  }

  getFilteredFundingSources(): any[] {
    const fy = this.newProject.finYear;
    const list = this.fundingSources();
    if (!fy) return list;
    const result = [];
    for (let i = 0; i < list.length; i++) {
      if (list[i].finYear === fy) result.push(list[i]);
    }
    return result;
  }

  selectedFundingSourceIds: number[] = [];

  resetNewProject() {
    this.newProject = {
      projectName: '', projectNo: '', contractNumber: '',
      contractStartDate: '', contractEndDate: '', contractValue: null,
      finYear: this.filterFinYear || '', statusId: null, status: 'Active',
      departmentId: null, divisionId: null,
      custodianId: null, latitude: '', longitude: '',
      budgetProjectId: null, wipOpeningBalance: null, restatedOpeningBalance: null, wipClosingBalance: null,
      contractId: null, scmContractId: null
    };
    this.selectedFundingSourceIds = [];
  }

  openScmModal() {
    this.showScmModal = true;
    this.scmContractsLoading.set(true);
    var self = this;
    this.api.getScmContracts().subscribe({
      next: function(r: any) {
        self.scmContracts.set(Array.isArray(r) ? r : []);
        self.scmContractsLoading.set(false);
      },
      error: function() {
        self.scmContracts.set([]);
        self.scmContractsLoading.set(false);
      }
    });
  }

  closeScmModal() {
    this.showScmModal = false;
  }

  selectContract(contract: any) {
    this.showScmModal = false;
    this.resetNewProject();
    this.newProject.projectNo = String(contract.contractId);
    this.newProject.projectName = contract.contractDescription || '';
    this.newProject.finYear = contract.financialYear || '';
    this.newProject.contractNumber = contract.contractNumber || '';
    this.newProject.contractValue = contract.contractValue || null;
    this.newProject.contractStartDate = contract.plannedStartDate ? String(contract.plannedStartDate).slice(0, 10) : '';
    this.newProject.contractEndDate = contract.plannedEndDate ? String(contract.plannedEndDate).slice(0, 10) : '';
    this.newProject.custodianId = contract.contractManagerId || null;
    this.newProject.contractId = contract.contractId || null;
    this.newProject.scmContractId = contract.contractId || null;
    this.showNewForm = true;
  }

  toggleFundingSource(id: number) {
    const idx = this.selectedFundingSourceIds.indexOf(id);
    if (idx > -1) {
      this.selectedFundingSourceIds.splice(idx, 1);
    } else {
      this.selectedFundingSourceIds.push(id);
    }
  }

  isFundingSourceSelected(id: number): boolean {
    return this.selectedFundingSourceIds.indexOf(id) > -1;
  }

  syncScmAndLoad() {
    var self = this;
    this.api.syncScmDetails().subscribe({
      next: function() { self.loadProjects(); },
      error: function() { self.loadProjects(); }
    });
  }

  loadProjects() {
    this.loading.set(true);
    this.api.getWipProjects({
      finYear: this.filterFinYear || undefined,
      status: this.filterStatus || undefined
    }).subscribe({
      next: function(this: WipListComponent, res: any) {
        this.projects.set(Array.isArray(res) ? res : []);
        this.loading.set(false);
      }.bind(this),
      error: function(this: WipListComponent) {
        this.projects.set([]);
        this.loading.set(false);
      }.bind(this)
    });
  }

  applyFilters() { this.loadProjects(); }

  clearFilters() { this.filterFinYear = ''; this.filterStatus = ''; this.loadProjects(); }

  viewProject(id: number) { this.router.navigate(['/wip', id]); }

  formatCurrency(val: any): string {
    const n = Number(val);
    if (isNaN(n)) return 'R 0.00';
    return 'R ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  formatMillion(val: number): string {
    if (val >= 1000000) return 'R ' + (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return 'R ' + (val / 1000).toFixed(0) + 'K';
    return 'R ' + val.toFixed(0);
  }

  formatDate(val: any): string {
    if (!val) return '';
    try { return new Date(val).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return ''; }
  }

  getStatusClass(status: string): string {
    if (!status) return 'badge badge-grey';
    const s = status.toLowerCase();
    if (s === 'active' || s === 'new') return 'badge badge-blue';
    if (s === 'in progress') return 'badge badge-amber';
    if (s === 'completed') return 'badge badge-green';
    if (s === 'cancelled') return 'badge badge-red';
    return 'badge badge-grey';
  }

  toggleNewForm() {
    this.showNewForm = !this.showNewForm;
    if (this.showNewForm) {
      this.resetNewProject();
    }
  }

  saveNewProject() {
    if (!this.newProject.projectNo || !this.newProject.projectName || !this.newProject.finYear) {
      this.snack.open('Project No, Project Name and Financial Year are required', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    this.saving.set(true);
    this.api.createWipProject(this.newProject).subscribe({
      next: function(this: WipListComponent, res: any) {
        const createdId = res?.wipRegisterId;
        if (createdId && this.selectedFundingSourceIds.length > 0) {
          let pending = this.selectedFundingSourceIds.length;
          for (let i = 0; i < this.selectedFundingSourceIds.length; i++) {
            this.api.createWipFunding({ wipRegisterId: createdId, fundingSourceId: this.selectedFundingSourceIds[i] }).subscribe({
              next: function(this: WipListComponent) {
                pending--;
                if (pending <= 0) { this.finishCreate(); }
              }.bind(this),
              error: function(this: WipListComponent) {
                pending--;
                if (pending <= 0) { this.finishCreate(); }
              }.bind(this)
            });
          }
        } else {
          this.finishCreate();
        }
      }.bind(this),
      error: function(this: WipListComponent) {
        this.saving.set(false);
        this.snack.open('Failed to create WIP project', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  finishCreate() {
    this.saving.set(false);
    this.showNewForm = false;
    this.snack.open('WIP project created', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
    this.loadProjects();
  }

  confirmDelete(id: number) { this.deleteConfirmId = id; }
  cancelDelete() { this.deleteConfirmId = null; }

  deleteProject(id: number) {
    this.api.deleteWipProject(id).subscribe({
      next: function(this: WipListComponent) {
        this.deleteConfirmId = null;
        this.snack.open('WIP project deleted', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        this.loadProjects();
      }.bind(this),
      error: function(this: WipListComponent) {
        this.deleteConfirmId = null;
        this.snack.open('Failed to delete WIP project', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  getDeptDesc(id: any): string {
    if (!id) { return ''; }
    const list = this.departments();
    for (let i = 0; i < list.length; i++) {
      if (Number(list[i].id) === Number(id)) { return list[i].description; }
    }
    return String(id);
  }

  getStatusDescById(id: any): string {
    if (!id) return '';
    const list = this.statuses();
    for (let i = 0; i < list.length; i++) {
      if (Number(list[i].projectStatusId) === Number(id)) return list[i].statusDesc;
    }
    return '';
  }
}
