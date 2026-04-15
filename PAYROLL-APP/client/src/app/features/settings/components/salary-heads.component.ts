import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';
import { DateSaPipe } from '../../../shared/pipes/date-sa.pipe';

@Component({
  selector: 'app-salary-heads',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, DateInputComponent, DateSaPipe],
  templateUrl: './salary-heads.component.html',
  styleUrl: './salary-heads.component.css'
})
export class SalaryHeadsComponent implements OnInit {
  items: any[] = [];
  filteredItems: any[] = [];
  transactionTypes: any[] = [];
  calculationMethods: any[] = [];
  irp5Codes: any[] = [];
  loading = true;
  searchTerm = '';

  view: 'list' | 'detail' = 'list';
  mode: 'create' | 'view' | 'edit' = 'view';
  activeTab = 'details';
  item: any = {};
  currentIndex = -1;

  history: any[] = [];
  historyLoading = false;

  currentPage = 1;
  pageSize = 15;

  mocRules: any[] = [];
  mocLoading = false;
  mocForm: any = null;
  mocFormMode: 'create' | 'edit' = 'create';
  cosOptions: any[] = [];
  empTypeOptions: any[] = [];
  empSubtypeOptions: any[] = [];
  mocLookupsLoaded = false;

  testFormula = '';
  testResult: any = null;
  testLoading = false;
  testEmployeeId: number | null = null;
  testEmployees: any[] = [];

  readonly roundMethods = [
    { code: 'ROUND', label: 'Round' },
    { code: 'FLOOR', label: 'Floor (Down)' },
    { code: 'CEIL', label: 'Ceiling (Up)' },
    { code: 'NONE', label: 'None (No rounding)' }
  ];

  readonly formulaVariables = [
    { name: 'BasicSalary', desc: 'Monthly basic salary' },
    { name: 'AnnualSalary', desc: 'Annual salary' },
    { name: 'PrevBasicSalary', desc: 'Previous period basic' },
    { name: 'PrevAnnualSalary', desc: 'Previous period annual' },
    { name: 'PrevSalary', desc: 'Previous period basic (alias)' },
    { name: 'CostAmount', desc: 'User-entered transaction amount' },
    { name: 'GrossEarnings', desc: 'Running gross earnings' },
    { name: 'TotalDeductions', desc: 'Total deductions' },
    { name: 'NetPay', desc: 'Net pay' },
    { name: 'HoursWorked', desc: 'Hours worked per month' },
    { name: 'DaysWorked', desc: 'Days worked per month' },
    { name: 'WHPM_Monthly', desc: 'Working hours per month' },
    { name: 'WHPD_Other', desc: 'Working hours per day' },
    { name: 'RPD_Other', desc: 'Rate per day (basic/days)' },
    { name: 'RPH_Monthly', desc: 'Rate per hour (basic/hours)' },
    { name: 'RPD', desc: 'Rate per day (basic/days)' },
    { name: 'FixedSalary', desc: 'Fixed monthly salary' },
    { name: 'ServiceYears', desc: 'Years of service' },
    { name: 'Age', desc: 'Employee age' },
    { name: 'MedicalDependants', desc: 'Medical aid dependants' },
    { name: 'PeriodsPerYear', desc: 'Pay periods per year' },
    { name: 'input', desc: 'Generic input value' }
  ];

  readonly formulaFunctions = [
    { name: 'IF(cond, trueVal, falseVal)', desc: 'Conditional' },
    { name: 'MIN(a, b)', desc: 'Minimum of two values' },
    { name: 'MAX(a, b)', desc: 'Maximum of two values' },
    { name: 'ROUND(val, digits)', desc: 'Round to digits' },
    { name: 'ABS(val)', desc: 'Absolute value' },
    { name: '[CODE]', desc: 'Cross-reference another salary head result' }
  ];

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadLookups();
    this.loadItems();
  }

  loadLookups(): void {
    this.api.get<any>('/salary-transactions/types').subscribe({
      next: (d) => { this.transactionTypes = d || []; this.cdr.detectChanges(); },
      error: () => { this.transactionTypes = []; }
    });
    this.api.get<any>('/salary-transactions/calculation-methods').subscribe({
      next: (d) => { this.calculationMethods = d || []; this.cdr.detectChanges(); },
      error: () => { this.calculationMethods = []; }
    });
    this.api.get<any>('/salary-transactions/irp5-codes').subscribe({
      next: (d) => { this.irp5Codes = d || []; this.cdr.detectChanges(); },
      error: () => { this.irp5Codes = []; }
    });
  }

  loadMocLookups(): void {
    if (this.mocLookupsLoaded) return;
    this.api.get<any>('/positions/lookups/positions-all').subscribe({
      next: (d) => {
        this.cosOptions = d?.conditions_of_service || [];
        this.empTypeOptions = d?.employee_types || [];
        this.empSubtypeOptions = d?.employee_subtypes || [];
        this.mocLookupsLoaded = true;
        this.cdr.detectChanges();
      },
      error: () => { this.mocLookupsLoaded = true; this.cdr.detectChanges(); }
    });
    this.api.get<any>('/employees?limit=50&status=ACTIVE').subscribe({
      next: (d) => {
        this.testEmployees = (d?.employees || d || []).slice(0, 50);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadItems(): void {
    this.loading = true;
    this.api.get<any>('/salary-transactions').subscribe({
      next: (d) => {
        this.items = d || [];
        this.filterItems();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.items = []; this.filteredItems = []; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  filterItems(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter(i =>
        (i.code || '').toLowerCase().includes(term) ||
        (i.name || '').toLowerCase().includes(term) ||
        (i.type_description || '').toLowerCase().includes(term) ||
        (i.calc_method_description || '').toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  get activeCount(): number {
    return this.items.filter(i => i.enabled).length;
  }

  get earningsCount(): number {
    return this.items.filter(i => i.transaction_type === 'EARNING').length;
  }

  get deductionsCount(): number {
    return this.items.filter(i => i.transaction_type === 'DEDUCTION').length;
  }

  get companyContribCount(): number {
    return this.items.filter(i => i.transaction_type === 'COMPANY_CONTRIBUTION').length;
  }

  get fringeBenefitCount(): number {
    return this.items.filter(i => i.transaction_type === 'FRINGE_BENEFIT').length;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredItems.length / this.pageSize) || 1;
  }

  get pagedItems(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.detectChanges();
    }
  }

  getTypeLabel(type: string): string {
    const t = this.transactionTypes.find(tt => tt.code === type);
    return t ? t.description : type || '—';
  }

  getCalcMethodLabel(method: string): string {
    const m = this.calculationMethods.find(cm => cm.code === method);
    return m ? m.description : method || '—';
  }

  getTypeBadgeClass(type: string): string {
    const map: Record<string, string> = {
      'EARNING': 'type-earning',
      'DEDUCTION': 'type-deduction',
      'COMPANY_CONTRIBUTION': 'type-company',
      'FRINGE_BENEFIT': 'type-fringe'
    };
    return map[type] || '';
  }

  openCreate(): void {
    this.item = {
      code: '',
      name: '',
      description: '',
      transaction_type: null,
      calculation_method: 'USER_INPUT',
      formula: '',
      irp5_code: '',
      sars_code: '',
      taxable: true,
      affects_uif: false,
      affects_sdl: false,
      show_on_payslip: true,
      priority: 0,
      start_date: '1900-01-01',
      end_date: '9999-12-31',
      pro_rated: false,
      retirement_funding_income: false,
      group_on_payslip_by_irp5: false,
      enabled: true,
      employer_contribution: 0,
      employee_contribution: 0
    };
    this.mode = 'create';
    this.activeTab = 'details';
    this.view = 'detail';
    this.history = [];
    this.mocRules = [];
    this.mocForm = null;
    this.cdr.detectChanges();
  }

  openDetail(row: any, _filteredIndex: number): void {
    this.item = { ...row };
    this.normalizeItemDates();
    this.currentIndex = this.items.findIndex(i => i.id === row.id);
    this.mode = 'view';
    this.activeTab = 'details';
    this.view = 'detail';
    this.history = [];
    this.mocRules = [];
    this.mocForm = null;
    this.cdr.detectChanges();
  }

  normalizeItemDates(): void {
    if (this.item.start_date?.includes('T')) this.item.start_date = this.item.start_date.split('T')[0];
    if (this.item.end_date?.includes('T')) this.item.end_date = this.item.end_date.split('T')[0];
  }

  goBack(): void {
    this.view = 'list';
    this.loadItems();
    this.cdr.detectChanges();
  }

  enterEdit(): void {
    this.mode = 'edit';
    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    if (this.mode === 'create') {
      this.goBack();
    } else {
      const r = this.items[this.currentIndex];
      if (r) { this.item = { ...r }; this.normalizeItemDates(); }
      this.mode = 'view';
      this.cdr.detectChanges();
    }
  }

  get isEditable(): boolean {
    return this.mode === 'edit' || this.mode === 'create';
  }

  get pageTitle(): string {
    if (this.mode === 'create') return 'New Salary Transaction';
    return this.item.name || 'Salary Transaction';
  }

  get showMocTab(): boolean {
    return this.item.id && this.item.calculation_method === 'SYSTEM_CALCULATE';
  }

  navigatePrev(): void {
    if (this.currentIndex <= 0) return;
    this.currentIndex--;
    this.item = { ...this.items[this.currentIndex] };
    this.normalizeItemDates();
    this.mode = 'view';
    this.activeTab = 'details';
    this.history = [];
    this.mocRules = [];
    this.mocForm = null;
    this.cdr.detectChanges();
  }

  navigateNext(): void {
    if (this.currentIndex >= this.items.length - 1) return;
    this.currentIndex++;
    this.item = { ...this.items[this.currentIndex] };
    this.normalizeItemDates();
    this.mode = 'view';
    this.activeTab = 'details';
    this.history = [];
    this.mocRules = [];
    this.mocForm = null;
    this.cdr.detectChanges();
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'history' && this.item.id && this.history.length === 0) {
      this.loadHistory();
    }
    if (tab === 'moc' && this.item.id && this.mocRules.length === 0) {
      this.loadMocRules();
      this.loadMocLookups();
    }
    this.cdr.detectChanges();
  }

  loadHistory(): void {
    if (!this.item.id) return;
    this.historyLoading = true;
    this.api.get<any>(`/salary-transactions/${this.item.id}/history`).subscribe({
      next: (d) => {
        this.history = d || [];
        this.historyLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.history = []; this.historyLoading = false; this.cdr.detectChanges(); }
    });
  }

  loadMocRules(): void {
    if (!this.item.id) return;
    this.mocLoading = true;
    this.api.get<any>(`/payroll/salary-heads/${this.item.id}/formulas`).subscribe({
      next: (d) => {
        this.mocRules = d || [];
        this.mocLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.mocRules = []; this.mocLoading = false; this.cdr.detectChanges(); }
    });
  }

  openMocCreate(): void {
    this.mocFormMode = 'create';
    this.mocForm = {
      rule_name: '',
      formula: '',
      condition_of_service_id: null,
      employee_type_id: null,
      employee_subtype_id: null,
      priority: 0,
      round_method: 'ROUND',
      round_digits: 2,
      pro_rata: false,
      enabled: true,
      start_date: null,
      end_date: null,
      notes: ''
    };
    this.testFormula = '';
    this.testResult = null;
    this.cdr.detectChanges();
  }

  openMocEdit(rule: any): void {
    this.mocFormMode = 'edit';
    this.mocForm = { ...rule };
    this.testFormula = rule.formula || '';
    this.testResult = null;
    this.cdr.detectChanges();
  }

  cancelMocForm(): void {
    this.mocForm = null;
    this.testFormula = '';
    this.testResult = null;
    this.cdr.detectChanges();
  }

  saveMocRule(): void {
    if (!this.mocForm.rule_name?.trim()) {
      this.ui.toast('error', 'Validation', 'Rule name is required');
      return;
    }
    if (!this.mocForm.formula?.trim()) {
      this.ui.toast('error', 'Validation', 'Formula is required');
      return;
    }

    const payload = {
      rule_name: this.mocForm.rule_name.trim(),
      formula: this.mocForm.formula.trim(),
      condition_of_service_id: this.mocForm.condition_of_service_id || null,
      employee_type_id: this.mocForm.employee_type_id || null,
      employee_subtype_id: this.mocForm.employee_subtype_id || null,
      priority: parseInt(this.mocForm.priority) || 0,
      round_method: this.mocForm.round_method || 'ROUND',
      round_digits: parseInt(this.mocForm.round_digits) ?? 2,
      pro_rata: this.mocForm.pro_rata === true,
      enabled: this.mocForm.enabled !== false,
      start_date: this.mocForm.start_date || null,
      end_date: this.mocForm.end_date || null,
      notes: this.mocForm.notes || null
    };

    const obs = this.mocFormMode === 'edit' && this.mocForm.id
      ? this.api.put(`/payroll/salary-heads/${this.item.id}/formulas/${this.mocForm.id}`, payload)
      : this.api.post(`/payroll/salary-heads/${this.item.id}/formulas`, payload);

    obs.subscribe({
      next: () => {
        this.ui.toast('success', 'Saved', this.mocFormMode === 'edit' ? 'Formula rule updated' : 'Formula rule created');
        this.mocForm = null;
        this.loadMocRules();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to save formula rule');
      }
    });
  }

  deleteMocRule(rule: any): void {
    if (!confirm(`Delete formula rule "${rule.rule_name}"?`)) return;
    this.api.delete(`/payroll/salary-heads/${this.item.id}/formulas/${rule.id}`).subscribe({
      next: () => {
        this.ui.toast('success', 'Deleted', 'Formula rule removed');
        this.loadMocRules();
      },
      error: (err: any) => {
        this.ui.toast('error', 'Error', err?.error?.error?.message || 'Cannot delete');
      }
    });
  }

  testMocFormula(): void {
    const formula = this.mocForm?.formula || this.testFormula;
    if (!formula?.trim()) {
      this.ui.toast('error', 'Validation', 'Enter a formula to test');
      return;
    }
    this.testLoading = true;
    const testPayload: any = { formula: formula.trim() };
    if (this.testEmployeeId) testPayload.employee_id = this.testEmployeeId;
    this.api.post<any>(`/payroll/salary-heads/${this.item.id}/formulas/test`, testPayload).subscribe({
      next: (d) => {
        this.testResult = d;
        this.testLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.testResult = { error: err?.error?.error?.message || 'Test failed' };
        this.testLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  insertVariable(varName: string): void {
    if (this.mocForm) {
      this.mocForm.formula = (this.mocForm.formula || '') + varName;
      this.cdr.detectChanges();
    }
  }

  getCosName(id: number): string {
    const c = this.cosOptions.find(o => o.id === id);
    return c ? c.name : '—';
  }

  getEmpTypeName(id: number): string {
    const t = this.empTypeOptions.find(o => o.id === id);
    return t ? t.name : '—';
  }

  getEmpSubtypeName(id: number): string {
    const s = this.empSubtypeOptions.find(o => o.id === id);
    return s ? s.name : '—';
  }

  formatEndDate(d: string): string {
    if (!d) return '—';
    if (d.startsWith('9999-12-31')) return '9999-12-31';
    return d.split('T')[0];
  }

  save(): void {
    if (!this.item.transaction_type) {
      this.ui.toast('error', 'Validation', 'Transaction Type is required');
      return;
    }
    if (this.mode === 'create' && !this.item.code?.trim()) {
      this.ui.toast('error', 'Validation', 'Code is required');
      return;
    }
    if (!this.item.name?.trim()) {
      this.ui.toast('error', 'Validation', 'Title is required');
      return;
    }

    const payload = {
      code: this.item.code?.trim(),
      name: this.item.name.trim(),
      description: this.item.description || null,
      transaction_type: this.item.transaction_type,
      calculation_method: this.item.calculation_method || 'USER_INPUT',
      irp5_code: this.item.irp5_code || null,
      sars_code: this.item.sars_code || null,
      taxable: this.item.taxable !== false,
      affects_uif: this.item.affects_uif === true,
      affects_sdl: this.item.affects_sdl === true,
      show_on_payslip: this.item.show_on_payslip !== false,
      priority: parseInt(this.item.priority) || 0,
      start_date: this.item.start_date || '1900-01-01',
      end_date: this.item.end_date || '9999-12-31',
      pro_rated: this.item.pro_rated === true,
      retirement_funding_income: this.item.retirement_funding_income === true,
      group_on_payslip_by_irp5: this.item.group_on_payslip_by_irp5 === true,
      enabled: this.item.enabled !== false,
      employer_contribution: parseFloat(this.item.employer_contribution) || 0,
      employee_contribution: parseFloat(this.item.employee_contribution) || 0
    };

    const obs = this.item.id
      ? this.api.put(`/salary-transactions/${this.item.id}`, payload)
      : this.api.post('/salary-transactions', payload);

    const isEdit = !!this.item.id;
    obs.subscribe({
      next: (d: any) => {
        this.ui.toast('success', 'Saved', isEdit ? 'Salary transaction updated' : 'Salary transaction created');
        if (isEdit) {
          this.item = d;
          this.normalizeItemDates();
          this.loadItems();
          this.mode = 'view';
        } else {
          this.goBack();
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.ui.toast('error', 'Error', err?.error?.error?.message || err?.error?.error || 'Failed to save');
      }
    });
  }

  deleteFromList(row: any, event?: Event): void {
    if (event) event.stopPropagation();
    if (!confirm(`Delete salary transaction "${row.code} - ${row.name}"?`)) return;
    this.api.delete(`/salary-transactions/${row.id}`).subscribe({
      next: () => {
        this.ui.toast('success', 'Deleted', 'Salary transaction removed');
        this.loadItems();
      },
      error: (err: any) => {
        this.ui.toast('error', 'Error', err?.error?.error?.message || err?.error?.error || 'Cannot delete');
      }
    });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-ZA', { year: 'numeric', month: '2-digit', day: '2-digit' }) +
      ' ' + dt.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  }
}
