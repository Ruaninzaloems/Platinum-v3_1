import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CurrencyShortPipe } from '../../shared/pipes/currency-short.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent, CurrencyShortPipe, StatusBadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  activeTab = 'dashboard';
  loading = true;

  summary: any = {};
  emp: any = {};
  pos: any = {};
  lv: any = {};
  pr: any = {};
  cp: any = null;
  cmp: any = { data_quality: {}, audit: {} };
  currentCyclesData: any = { system_tax_year: '', system_financial_year: '', system_month: '', cycles: [] };

  deptData: any[] = [];
  leaveData: any[] = [];

  workflowCount = 0;
  probationCount = 0;
  ghostCount = 0;

  empListState = {
    page: 1,
    limit: 50,
    search: '',
    sortBy: 'surname',
    sortOrder: 'asc',
    status: '',
    data: [] as any[],
    total: 0,
    totalPages: 1,
    loading: false,
  };

  private searchTimeout: any;

  insights = [
    {
      severity: 'red',
      title: 'PAYE Compliance Risk Detected',
      desc: 'Multiple employees are missing SARS income tax reference numbers. This will result in non-compliance with EMP201 submissions and potential SARS penalties.',
      ref: 'SARS Tax Administration Act',
      refBadge: 'badge-danger',
      confidence: 92
    },
    {
      severity: 'orange',
      title: 'Annual Leave Accumulation Warning',
      desc: 'Several employees have accumulated leave exceeding the BCEA maximum of 48 days. Consider enforcing leave scheduling per the BCEA Section 20 requirements.',
      ref: 'BCEA Section 20',
      refBadge: 'badge-warning',
      confidence: 87
    },
    {
      severity: 'blue',
      title: 'CoE Budget Threshold Alert',
      desc: 'Compensation of Employees is approaching the mSCOA budget allocation threshold for this financial year. Review against MFMA Section 28 expenditure controls.',
      ref: 'MFMA Section 28',
      refBadge: 'badge-info',
      confidence: 78
    },
    {
      severity: 'orange',
      title: 'Position Vacancy Trend',
      desc: 'Vacancy rate exceeds the Municipal Staff Regulations 2021 recommended staffing threshold. Critical positions remain unfilled which may affect service delivery.',
      ref: 'Municipal Staff Regulations 2021',
      refBadge: 'badge-warning',
      confidence: 85
    },
    {
      severity: 'red',
      title: 'EFT Payment Data Incomplete',
      desc: 'Employees missing banking details cannot receive salary payments via EFT. Resolve before next payroll run to prevent payment failures.',
      ref: 'MFMA Section 65',
      refBadge: 'badge-danger',
      confidence: 95
    },
    {
      severity: 'blue',
      title: 'Employment Equity Reporting Due',
      desc: 'EEA2 and EEA4 annual reports must be submitted to the Department of Employment and Labour. Ensure demographic data is current for accurate reporting.',
      ref: 'Employment Equity Act',
      refBadge: 'badge-info',
      confidence: 80
    }
  ];

  deptChartColors = ['#6C7AE0','#68D391','#F6AD55','#FC8181','#B794F4','#F687B3','#81E6D9','#FBD38D'];

  constructor(private api: ApiService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  }

  loadDashboard(): void {
    this.loading = true;

    forkJoin({
      summary: this.api.get<any>('/dashboard/summary').pipe(catchError(() => of({}))),
      deptData: this.api.get<any>('/dashboard/department-headcount').pipe(catchError(() => of([]))),
      leaveData: this.api.get<any>('/dashboard/leave-summary').pipe(catchError(() => of([]))),
      payrollData: this.api.get<any>('/dashboard/payroll-summary').pipe(catchError(() => of({}))),
      compliance: this.api.get<any>('/dashboard/compliance').pipe(catchError(() => of({ data_quality: {}, audit: {} }))),
      currentCycles: this.api.get<any>('/dashboard/current-cycles').pipe(catchError(() => of({ cycles: [] }))),
    }).subscribe({
      next: (results) => {
        this.summary = results.summary || {};
        this.emp = this.summary.employees || {};
        this.pos = this.summary.positions || {};
        this.lv = this.summary.leave || {};
        this.pr = this.summary.payroll || {};
        this.cp = this.summary.current_period || null;
        this.cmp = results.compliance || { data_quality: {}, audit: {} };
        this.currentCyclesData = results.currentCycles || { cycles: [] };
        this.deptData = results.deptData || [];
        this.leaveData = results.leaveData || [];
        this.loading = false; this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });

    this.api.getRaw<any>('/workflows/pending').pipe(catchError(() => of(null))).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.workflowCount = Array.isArray(res.data) ? res.data.length : (parseInt(res.data.count) || 0);
         this.cdr.detectChanges(); }
      }
    });
    this.api.getRaw<any>('/employees/probation-alerts').pipe(catchError(() => of(null))).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.probationCount = Array.isArray(res.data) ? res.data.length : (parseInt(res.data.count) || 0);
         this.cdr.detectChanges(); }
      }
    });
    this.api.getRaw<any>('/time/ghost-detection?months=3').pipe(catchError(() => of(null))).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.ghostCount = Array.isArray(res.data) ? res.data.length : (parseInt(res.data.count) || 0);
         this.cdr.detectChanges(); }
      }
    });
  }

  get vacancyRate(): string {
    const total = parseInt(this.pos.total_positions) || 0;
    const vacant = parseInt(this.pos.vacant_positions) || 0;
    if (total === 0) return '0';
    return ((vacant / total) * 100).toFixed(0);
  }

  get approvalRate(): number {
    const total = parseInt(this.lv.total_requests) || 0;
    const pending = parseInt(this.lv.pending_requests) || 0;
    if (total === 0) return 0;
    return Math.round(((total - pending) / total) * 100);
  }

  get deptMaxCount(): number {
    if (!this.deptData || this.deptData.length === 0) return 1;
    return Math.max(...this.deptData.map((d: any) => parseInt(d.active_employees) || 0), 1);
  }

  getDeptBarWidth(d: any): number {
    const count = parseInt(d.active_employees) || 0;
    return Math.max((count / this.deptMaxCount) * 100, 3);
  }

  getDeptBarColor(i: number): string {
    return this.deptChartColors[i % this.deptChartColors.length];
  }

  truncateDeptName(name: string): string {
    if (!name) return '';
    return name.length > 22 ? name.substring(0, 22) + '...' : name;
  }

  formatNumber(val: any): string {
    return parseInt(val || 0).toLocaleString();
  }

  formatCurrency(val: any): string {
    const num = parseFloat(val) || 0;
    if (num >= 1e6) return `R ${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `R ${(num / 1e3).toFixed(0)}K`;
    return `R ${num.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`;
  }

  formatMonthly(val: any): string {
    const num = parseFloat(val) || 0;
    return this.formatCurrency(num / 12);
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'list' && this.empListState.data.length === 0) {
      this.loadEmployeeList(true);
    }
  }

  navigateToModule(module: string): void {
    const routeMap: Record<string, string> = {
      'settings-workflows': '/settings/workflows',
      'employees': '/employees',
      'time': '/time',
      'payroll': '/payroll',
    };
    const route = routeMap[module];
    if (route) this.router.navigate([route]);
  }

  onSearchInput(value: string): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.empListState.search = value;
      this.loadEmployeeList(true);
    }, 350);
  }

  onStatusChange(value: string): void {
    this.empListState.status = value;
    this.loadEmployeeList(true);
  }

  onPageSizeChange(value: string): void {
    this.empListState.limit = parseInt(value);
    this.loadEmployeeList(true);
  }

  loadEmployeeList(resetPage?: boolean): void {
    if (resetPage) this.empListState.page = 1;
    this.empListState.loading = true;

    const params: any = {
      limit: this.empListState.limit,
      page: this.empListState.page,
      sort_by: this.empListState.sortBy,
      sort_order: this.empListState.sortOrder,
    };
    if (this.empListState.search) params.search = this.empListState.search;
    if (this.empListState.status) params.status = this.empListState.status;

    this.api.getRaw<any>('/employees', params).subscribe({
      next: (res) => {
        this.empListState.data = res.data || [];
        this.empListState.total = res.meta?.total || 0;
        this.empListState.totalPages = Math.ceil(this.empListState.total / this.empListState.limit) || 1;
        this.empListState.loading = false;
       this.cdr.detectChanges(); },
      error: () => {
        this.empListState.loading = false;
      }
    });
  }

  get empShowingFrom(): number {
    if (this.empListState.total === 0) return 0;
    return ((this.empListState.page - 1) * this.empListState.limit) + 1;
  }

  get empShowingTo(): number {
    return Math.min(this.empListState.page * this.empListState.limit, this.empListState.total);
  }

  get empPageButtons(): number[] {
    const page = this.empListState.page;
    const totalPages = this.empListState.totalPages;
    const maxBtns = 7;
    let startP = Math.max(1, page - Math.floor(maxBtns / 2));
    let endP = Math.min(totalPages, startP + maxBtns - 1);
    if (endP - startP < maxBtns - 1) startP = Math.max(1, endP - maxBtns + 1);
    const buttons: number[] = [];
    for (let i = startP; i <= endP; i++) buttons.push(i);
    return buttons;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.empListState.totalPages) return;
    this.empListState.page = page;
    this.loadEmployeeList();
  }

  getSeverityColor(severity: string): string {
    if (severity === 'red') return 'var(--danger)';
    if (severity === 'orange') return 'var(--warning)';
    return 'var(--info)';
  }
}
