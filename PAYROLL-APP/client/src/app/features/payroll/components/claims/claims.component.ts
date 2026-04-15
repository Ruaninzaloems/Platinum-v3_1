import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { UiService } from '../../../../core/services/ui.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { CurrencyZarPipe } from '../../../../shared/pipes/currency-zar.pipe';
import { DateSaPipe } from '../../../../shared/pipes/date-sa.pipe';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-claims',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, StatusBadgeComponent, PaginationComponent, CurrencyZarPipe, DateSaPipe, DateInputComponent],
  templateUrl: './claims.component.html',
  styleUrl: './claims.component.css'
})
export class ClaimsComponent implements OnInit {
  view: 'list' | 'form' = 'list';
  loading = true;
  claims: any[] = [];

  statusFilter = '';
  claimTypeFilter = '';
  employeeFilter = '';
  employeeFilterId: number | null = null;
  filterEmployees: any[] = [];
  filterEmployeeSearch = '';

  page = 1;
  limit = 25;
  total = 0;

  formLoading = false;
  form: any = {};

  employees: any[] = [];
  employeeSearch = '';
  employeeLoading = false;
  selectedEmployee: any = null;

  claimConfigurations: any[] = [];
  selectedConfig: any = null;
  tariff = 0;

  claimTypes = [
    { value: 'S_AND_T', label: 'S & T' },
    { value: 'TRAVEL', label: 'Travel' }
  ];

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadClaims();
  }

  loadClaims(): void {
    this.loading = true;
    const params: any = { page: this.page, limit: this.limit };
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.claimTypeFilter) params.claim_type = this.claimTypeFilter;
    if (this.employeeFilterId) params.employee_id = this.employeeFilterId;

    this.api.getPaginated<any>('/time/claims', params).subscribe({
      next: (res: any) => {
        this.claims = res.data || [];
        this.total = res.meta?.total || 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.claims = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPageChange(p: number): void {
    this.page = p;
    this.loadClaims();
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadClaims();
  }

  searchFilterEmployees(): void {
    if (!this.filterEmployeeSearch || this.filterEmployeeSearch.length < 2) {
      this.filterEmployees = [];
      this.cdr.detectChanges();
      return;
    }
    this.api.getPaginated<any>('/employees', { search: this.filterEmployeeSearch, limit: 20 }).subscribe({
      next: (res: any) => {
        this.filterEmployees = res.data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.filterEmployees = [];
        this.cdr.detectChanges();
      }
    });
  }

  selectFilterEmployee(emp: any): void {
    this.employeeFilterId = emp.id;
    this.filterEmployeeSearch = emp.employee_code + ' - ' + emp.first_name + ' ' + emp.surname;
    this.filterEmployees = [];
    this.onFilterChange();
  }

  clearEmployeeFilter(): void {
    this.employeeFilterId = null;
    this.filterEmployeeSearch = '';
    this.filterEmployees = [];
    this.onFilterChange();
  }

  openAddForm(): void {
    this.form = {
      employee_id: null,
      claim_type: '',
      sub_type: '',
      start_date: '',
      end_date: '',
      kilometres: null,
      reference_no: '',
      reason: ''
    };
    this.selectedEmployee = null;
    this.claimConfigurations = [];
    this.selectedConfig = null;
    this.tariff = 0;
    this.employees = [];
    this.employeeSearch = '';
    this.view = 'form';
    this.cdr.detectChanges();
  }

  backToList(): void {
    this.view = 'list';
    this.loadClaims();
  }

  searchEmployees(): void {
    if (!this.employeeSearch || this.employeeSearch.length < 2) {
      this.employees = [];
      this.cdr.detectChanges();
      return;
    }
    this.employeeLoading = true;
    this.api.getPaginated<any>('/employees', { search: this.employeeSearch, limit: 20 }).subscribe({
      next: (res: any) => {
        this.employees = res.data || [];
        this.employeeLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.employees = [];
        this.employeeLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectEmployee(emp: any): void {
    this.selectedEmployee = emp;
    this.form.employee_id = emp.id;
    this.employeeSearch = emp.employee_code + ' - ' + emp.first_name + ' ' + emp.surname;
    this.employees = [];
    this.cdr.detectChanges();
  }

  clearEmployee(): void {
    this.selectedEmployee = null;
    this.form.employee_id = null;
    this.employeeSearch = '';
    this.employees = [];
    this.cdr.detectChanges();
  }

  onClaimTypeChange(): void {
    this.form.sub_type = '';
    this.selectedConfig = null;
    this.tariff = 0;
    this.form.kilometres = null;
    this.form.end_date = '';
    this.claimConfigurations = [];

    if (this.form.claim_type) {
      this.api.get<any[]>('/time/claims/configurations-by-type', { claim_type: this.form.claim_type }).subscribe({
        next: (data) => {
          this.claimConfigurations = data || [];
          this.cdr.detectChanges();
        },
        error: () => {
          this.claimConfigurations = [];
          this.cdr.detectChanges();
        }
      });
    }
    this.cdr.detectChanges();
  }

  onSubTypeChange(): void {
    if (!this.form.sub_type) {
      this.selectedConfig = null;
      this.tariff = 0;
      this.cdr.detectChanges();
      return;
    }
    const configId = parseInt(this.form.sub_type, 10);
    this.selectedConfig = this.claimConfigurations.find((c: any) => c.id === configId) || null;
    this.tariff = this.selectedConfig?.sars_rate ? parseFloat(this.selectedConfig.sars_rate) : 0;
    this.cdr.detectChanges();
  }

  get claimValue(): number {
    if (!this.tariff) return 0;
    if (this.form.claim_type === 'TRAVEL') {
      const km = parseFloat(this.form.kilometres) || 0;
      return parseFloat((km * this.tariff).toFixed(2));
    }
    if (this.form.claim_type === 'S_AND_T') {
      if (this.form.start_date && this.form.end_date) {
        const start = new Date(this.form.start_date);
        const end = new Date(this.form.end_date);
        if (end < start) return 0;
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return parseFloat((days * this.tariff).toFixed(2));
      }
    }
    return 0;
  }

  get dayCount(): number {
    if (this.form.claim_type !== 'S_AND_T' || !this.form.start_date || !this.form.end_date) return 0;
    const start = new Date(this.form.start_date);
    const end = new Date(this.form.end_date);
    if (end < start) return 0;
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  getSubTypeLabel(config: any): string {
    if (!config) return '';
    const group = config.claim_group ? config.claim_group + ' - ' : '';
    return group + config.claim_subtype;
  }

  submitClaim(): void {
    if (!this.form.employee_id) {
      this.ui.toast('error', 'Validation', 'Please select an employee');
      return;
    }
    if (!this.form.claim_type) {
      this.ui.toast('error', 'Validation', 'Please select a claim type');
      return;
    }
    if (!this.form.sub_type) {
      this.ui.toast('error', 'Validation', 'Please select a sub-type');
      return;
    }
    if (!this.form.start_date) {
      this.ui.toast('error', 'Validation', 'Start date is required');
      return;
    }
    if (this.form.claim_type === 'S_AND_T' && !this.form.end_date) {
      this.ui.toast('error', 'Validation', 'End date is required for S & T claims');
      return;
    }
    if (this.form.claim_type === 'S_AND_T' && this.form.end_date && new Date(this.form.end_date) < new Date(this.form.start_date)) {
      this.ui.toast('error', 'Validation', 'End date cannot be before start date');
      return;
    }
    if (this.form.claim_type === 'TRAVEL' && (!this.form.kilometres || this.form.kilometres <= 0)) {
      this.ui.toast('error', 'Validation', 'Kilometres must be greater than 0 for Travel claims');
      return;
    }
    if (this.claimValue <= 0) {
      this.ui.toast('error', 'Validation', 'Claim value must be greater than 0');
      return;
    }

    this.formLoading = true;
    const body = {
      employee_id: this.form.employee_id,
      claim_type: this.form.claim_type,
      sub_type: this.selectedConfig ? this.getSubTypeLabel(this.selectedConfig) : '',
      start_date: this.form.start_date,
      end_date: this.form.end_date || null,
      amount: this.claimValue,
      kilometres: this.form.kilometres || null,
      reason: this.form.reason || null,
      reference_no: this.form.reference_no || null
    };

    this.api.post('/time/claims', body).subscribe({
      next: () => {
        this.ui.toast('success', 'Submitted', 'Claim submitted successfully');
        this.formLoading = false;
        this.backToList();
      },
      error: () => {
        this.ui.toast('error', 'Error', 'Failed to submit claim');
        this.formLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  async approveClaim(claim: any): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Approve Claim',
      message: `Approve ${this.getClaimTypeLabel(claim.claim_type)} claim for ${claim.first_name} ${claim.surname} - R${parseFloat(claim.amount).toFixed(2)}?`
    });
    if (!confirmed) return;

    this.api.patch<any>(`/time/claims/${claim.id}/approve`, {}).subscribe({
      next: () => {
        this.ui.toast('success', 'Approved', 'Claim approved successfully');
        this.loadClaims();
      },
      error: (err: any) => {
        if (err.status === 403) {
          this.ui.toast('error', 'Unauthorized', 'You do not have permission to approve claims');
        } else {
          this.ui.toast('error', 'Error', 'Failed to approve claim');
        }
      }
    });
  }

  async rejectClaim(claim: any): Promise<void> {
    const confirmed = await this.ui.confirm({
      title: 'Reject Claim',
      message: `Reject ${this.getClaimTypeLabel(claim.claim_type)} claim for ${claim.first_name} ${claim.surname}?`,
      danger: true
    });
    if (!confirmed) return;

    this.api.patch<any>(`/time/claims/${claim.id}/reject`, {}).subscribe({
      next: () => {
        this.ui.toast('success', 'Rejected', 'Claim rejected');
        this.loadClaims();
      },
      error: (err: any) => {
        if (err.status === 403) {
          this.ui.toast('error', 'Unauthorized', 'You do not have permission to reject claims');
        } else {
          this.ui.toast('error', 'Error', 'Failed to reject claim');
        }
      }
    });
  }

  getClaimTypeLabel(type: string): string {
    const found = this.claimTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

}
