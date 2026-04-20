import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-wip-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './wip-detail.component.html',
  styleUrls: ['./wip-detail.component.css']
})
export class WipDetailComponent implements OnInit {
  projectId = 0;
  project = signal<any>(null);
  loading = signal(true);
  saving = signal(false);
  activeTab = 'details';
  editMode = false;
  editData: any = {};

  statuses = signal<any[]>([]);
  fundingSources = signal<any[]>([]);
  departments = signal<any[]>([]);
  divisions = signal<any[]>([]);
  employees = signal<any[]>([]);
  planProjects = signal<any[]>([]);
  vendors = signal<any[]>([]);
  financialYears: string[] = [];

  invoices = signal<any[]>([]);
  invoicesLoading = signal(false);
  showInvoiceForm = false;
  invoiceSaving = signal(false);
  editInvoiceId: number | null = null;
  deleteInvoiceConfirmId: number | null = null;
  newInvoice: any = {};

  fundingRows = signal<any[]>([]);
  fundingLoading = signal(false);
  deleteFundingConfirmId: number | null = null;
  newFundingSourceId: number | null = null;
  fundingSaving = signal(false);

  totalInvoiceAmount = computed(function(this: WipDetailComponent) {
    let sum = 0;
    const list = this.invoices();
    for (let i = 0; i < list.length; i++) { sum += Number(list[i].amount) || 0; }
    return sum;
  }.bind(this));

  totalInvoiceVat = computed(function(this: WipDetailComponent) {
    let sum = 0;
    const list = this.invoices();
    for (let i = 0; i < list.length; i++) { sum += Number(list[i].vatAmount) || 0; }
    return sum;
  }.bind(this));

  totalInvoiceTotal = computed(function(this: WipDetailComponent) {
    let sum = 0;
    const list = this.invoices();
    for (let i = 0; i < list.length; i++) { sum += Number(list[i].totalAmount) || 0; }
    return sum;
  }.bind(this));

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private snack: MatSnackBar
  ) {}

  ngOnInit() {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProject();
    this.loadFunding();
    this.api.getFinancialYears().subscribe({
      next: function(this: WipDetailComponent, rows: any[]) {
        this.financialYears = rows.map(function(r: any) { return r.finyear || r.finYear; });
      }.bind(this),
      error: function() {}
    });
    this.api.getWipProjectStatuses().subscribe({
      next: function(this: WipDetailComponent, r: any) { this.statuses.set(Array.isArray(r) ? r : []); }.bind(this),
      error: function() {}
    });
    this.api.getConstFundingSources().subscribe({
      next: function(this: WipDetailComponent, r: any) { this.fundingSources.set(Array.isArray(r) ? r : []); }.bind(this),
      error: function() {}
    });
    this.api.getDepartments().subscribe({
      next: function(this: WipDetailComponent, r: any) { this.departments.set(Array.isArray(r) ? r : []); }.bind(this),
      error: function() {}
    });
    this.api.getDivisions().subscribe({
      next: function(this: WipDetailComponent, r: any) { this.divisions.set(Array.isArray(r) ? r : []); }.bind(this),
      error: function() {}
    });
    this.api.getEmployees().subscribe({
      next: function(this: WipDetailComponent, r: any) { this.employees.set(Array.isArray(r) ? r : []); }.bind(this),
      error: function() {}
    });
    this.api.getPlanProjects().subscribe({
      next: function(this: WipDetailComponent, r: any) { this.planProjects.set(Array.isArray(r) ? r : []); }.bind(this),
      error: function() {}
    });
    this.api.getVendors().subscribe({
      next: function(this: WipDetailComponent, r: any) { this.vendors.set(Array.isArray(r) ? r : []); }.bind(this),
      error: function() {}
    });
  }

  getFilteredDivisions(): any[] {
    const deptId = this.editData.departmentId;
    if (!deptId) { return this.divisions(); }
    const list = this.divisions();
    const result = [];
    for (let i = 0; i < list.length; i++) {
      if (Number(list[i].departmentId) === Number(deptId)) { result.push(list[i]); }
    }
    return result;
  }

  onEditDepartmentChange() {
    this.editData.divisionId = null;
  }

  getDeptDesc(id: any): string {
    if (!id) { return ''; }
    const list = this.departments();
    for (let i = 0; i < list.length; i++) {
      if (Number(list[i].id) === Number(id)) { return list[i].description; }
    }
    return String(id);
  }

  getDivisionDesc(id: any): string {
    if (!id) { return ''; }
    const list = this.divisions();
    for (let i = 0; i < list.length; i++) {
      if (Number(list[i].id) === Number(id)) { return list[i].description; }
    }
    return String(id);
  }

  getVendorName(id: any): string {
    if (!id) { return ''; }
    const list = this.vendors();
    for (let i = 0; i < list.length; i++) {
      if (Number(list[i].vendorId) === Number(id)) { return list[i].vendorName; }
    }
    return String(id);
  }

  getCustodianName(id: any): string {
    if (!id) { return ''; }
    const list = this.employees();
    for (let i = 0; i < list.length; i++) {
      if (Number(list[i].employeeId) === Number(id)) { return list[i].surname + ', ' + list[i].firstName; }
    }
    return String(id);
  }

  getBudgetProjectName(id: any): string {
    if (!id) { return ''; }
    const list = this.planProjects();
    for (let i = 0; i < list.length; i++) {
      if (Number(list[i].projectId) === Number(id)) { return list[i].projectCode + ' - ' + list[i].projectName; }
    }
    return String(id);
  }

  loadProject() {
    this.loading.set(true);
    this.api.getWipProject(this.projectId).subscribe({
      next: function(this: WipDetailComponent, p: any) {
        this.project.set(p);
        this.loading.set(false);
      }.bind(this),
      error: function(this: WipDetailComponent) {
        this.loading.set(false);
        this.router.navigate(['/assets/wip']);
      }.bind(this)
    });
  }

  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'payments' && this.invoices().length === 0) this.loadInvoices();
  }

  startEdit() {
    const p = this.project();
    this.editData = {
      projectName: p.projectName,
      projectNo: p.projectNo,
      projectNumber: p.projectNumber,
      contractNumber: p.contractNumber,
      contractStartDate: this.toDateInput(p.contractStartDate),
      contractEndDate: this.toDateInput(p.contractEndDate),
      contractValue: p.contractValue,
      totalBudget: p.totalBudget,
      finYear: p.finYear,
      status: p.status,
      statusId: p.statusId,
      departmentId: p.departmentId,
      divisionId: p.divisionId,
      custodianId: p.custodianId,
      startDate: this.toDateInput(p.startDate),
      expectedEndDate: this.toDateInput(p.expectedEndDate),
      actualEndDate: this.toDateInput(p.actualEndDate),
      completionDate: this.toDateInput(p.completionDate),
      wipOpeningBalance: p.wipOpeningBalance,
      restatedOpeningBalance: p.restatedOpeningBalance,
      wipClosingBalance: p.wipClosingBalance,
      transferOfAssets: p.transferOfAssets,
      writeOff: p.writeOff,
      impairment: p.impairment,
      priorYearAdjustment: p.priorYearAdjustment,
      latitude: p.latitude,
      longitude: p.longitude,
      budgetProjectId: p.budgetProjectId
    };
    this.editMode = true;
  }

  cancelEdit() { this.editMode = false; }

  saveEdit() {
    this.saving.set(true);
    this.api.updateWipProject(this.projectId, this.editData).subscribe({
      next: function(this: WipDetailComponent, p: any) {
        this.project.set(p);
        this.editMode = false;
        this.saving.set(false);
        this.snack.open('Project saved', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this),
      error: function(this: WipDetailComponent) {
        this.saving.set(false);
        this.snack.open('Failed to save project', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  loadInvoices() {
    this.invoicesLoading.set(true);
    this.api.getWipDetails(this.projectId).subscribe({
      next: function(this: WipDetailComponent, r: any) {
        this.invoices.set(Array.isArray(r) ? r : []);
        this.invoicesLoading.set(false);
      }.bind(this),
      error: function(this: WipDetailComponent) {
        this.invoices.set([]);
        this.invoicesLoading.set(false);
      }.bind(this)
    });
  }

  resetNewInvoice() {
    this.newInvoice = {
      wipRegisterId: this.projectId,
      description: '',
      invoiceNumber: '', invoiceDate: '', vendorId: null,
      amount: null, vatAmount: null, totalAmount: null,
      documentNumber: '', paymentReference: ''
    };
  }

  toggleInvoiceForm() {
    if (!this.showInvoiceForm) {
      this.resetNewInvoice();
      this.editInvoiceId = null;
    }
    this.showInvoiceForm = !this.showInvoiceForm;
  }

  onInvoiceAmountChange() {
    const a = Number(this.newInvoice.amount) || 0;
    const v = Number(this.newInvoice.vatAmount) || 0;
    this.newInvoice.totalAmount = a + v;
  }

  editInvoice(inv: any) {
    this.editInvoiceId = inv.wipRegisterDetailId;
    this.newInvoice = {
      wipRegisterId: this.projectId,
      description: inv.description || '',
      invoiceNumber: inv.invoiceNumber || '',
      invoiceDate: this.toDateInput(inv.invoiceDate),
      vendorId: inv.vendorId,
      amount: inv.amount,
      vatAmount: inv.vatAmount,
      totalAmount: inv.totalAmount,
      documentNumber: inv.documentNumber || '',
      paymentReference: inv.paymentReference || ''
    };
    this.showInvoiceForm = true;
  }

  saveInvoice() {
    if (!this.newInvoice.invoiceNumber) {
      this.snack.open('Invoice Number is required', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    this.invoiceSaving.set(true);
    const isEdit = !!this.editInvoiceId;
    const obs = isEdit
      ? this.api.updateWipDetail(this.editInvoiceId!, this.newInvoice)
      : this.api.createWipDetail(this.newInvoice);
    obs.subscribe({
      next: function(this: WipDetailComponent) {
        this.invoiceSaving.set(false);
        this.showInvoiceForm = false;
        this.editInvoiceId = null;
        this.snack.open(isEdit ? 'Invoice updated' : 'Invoice captured', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        this.loadInvoices();
        this.loadProject();
      }.bind(this),
      error: function(this: WipDetailComponent) {
        this.invoiceSaving.set(false);
        this.snack.open('Failed to save invoice', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  confirmDeleteInvoice(id: number) { this.deleteInvoiceConfirmId = id; }
  cancelDeleteInvoice() { this.deleteInvoiceConfirmId = null; }

  deleteInvoice(id: number) {
    this.api.deleteWipDetail(id).subscribe({
      next: function(this: WipDetailComponent) {
        this.deleteInvoiceConfirmId = null;
        this.snack.open('Invoice deleted', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        this.loadInvoices();
        this.loadProject();
      }.bind(this),
      error: function(this: WipDetailComponent) {
        this.deleteInvoiceConfirmId = null;
        this.snack.open('Failed to delete invoice', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  loadFunding() {
    this.fundingLoading.set(true);
    this.api.getWipFunding(this.projectId).subscribe({
      next: function(this: WipDetailComponent, r: any) {
        this.fundingRows.set(Array.isArray(r) ? r : []);
        this.fundingLoading.set(false);
      }.bind(this),
      error: function(this: WipDetailComponent) {
        this.fundingRows.set([]);
        this.fundingLoading.set(false);
      }.bind(this)
    });
  }

  addFundingSource() {
    if (!this.newFundingSourceId) return;
    this.fundingSaving.set(true);
    this.api.createWipFunding({ wipRegisterId: this.projectId, fundingSourceId: this.newFundingSourceId }).subscribe({
      next: function(this: WipDetailComponent) {
        this.fundingSaving.set(false);
        this.newFundingSourceId = null;
        this.snack.open('Funding source added', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        this.loadFunding();
      }.bind(this),
      error: function(this: WipDetailComponent) {
        this.fundingSaving.set(false);
        this.snack.open('Failed to add funding source', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  confirmDeleteFunding(id: number) { this.deleteFundingConfirmId = id; }
  cancelDeleteFunding() { this.deleteFundingConfirmId = null; }

  deleteFunding(wipRegisterFundingId: number) {
    this.api.deleteWipFunding(wipRegisterFundingId).subscribe({
      next: function(this: WipDetailComponent) {
        this.deleteFundingConfirmId = null;
        this.snack.open('Funding source removed', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        this.loadFunding();
      }.bind(this),
      error: function(this: WipDetailComponent) {
        this.deleteFundingConfirmId = null;
        this.snack.open('Failed to remove funding source', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  getFilteredFundingSources(): any[] {
    const p = this.project();
    const fy = p ? p.finYear : null;
    const list = this.fundingSources();
    if (!fy) return list;
    const result = [];
    for (let i = 0; i < list.length; i++) {
      if (list[i].finYear === fy) result.push(list[i]);
    }
    return result;
  }

  getFundingSourceDesc(id: any): string {
    if (!id) return '';
    const list = this.fundingSources();
    for (let i = 0; i < list.length; i++) {
      if (Number(list[i].fundingSourceId) === Number(id)) return list[i].fundingSourceDesc;
    }
    return String(id);
  }

  toDateInput(val: any): string {
    if (!val) return '';
    try { return new Date(val).toISOString().split('T')[0]; } catch { return ''; }
  }

  calcFinancialProgress(): string {
    const closing = this.editMode
      ? (Number(this.editData.wipClosingBalance) || 0)
      : (Number(this.project()?.wipClosingBalance) || 0);
    const contract = this.editMode
      ? (Number(this.editData.contractValue) || 0)
      : (Number(this.project()?.contractValue) || 0);
    if (contract === 0) return '0%';
    return (closing / contract * 100).toFixed(1) + '%';
  }

  formatCurrency(val: any): string {
    const n = Number(val);
    if (isNaN(n) || val === null || val === undefined || val === '') return '';
    return 'R ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  formatDate(val: any): string {
    if (!val) return '';
    try { return new Date(val).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return ''; }
  }

  getStatusClass(s: string): string {
    if (!s) return 'badge badge-grey';
    const l = s.toLowerCase();
    if (l === 'active' || l === 'new') return 'badge badge-blue';
    if (l === 'in progress') return 'badge badge-amber';
    if (l === 'completed') return 'badge badge-green';
    if (l === 'cancelled') return 'badge badge-red';
    return 'badge badge-grey';
  }
}
