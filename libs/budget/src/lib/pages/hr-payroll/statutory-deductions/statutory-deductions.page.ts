import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../../services/api.service';
import { StatutoryDeduction, PayrollLiability } from '../../../models/budget.models';

interface PayeDepartment {
  department: string;
  totalRemuneration: number;
  payeAmount: number;
  effectiveRate: number;
}

interface OtherDeductionView extends StatutoryDeduction {
  employeeAmount: number;
  employerAmount: number;
  totalAmount: number;
}

interface MonthPhasing {
  label: string;
  percent: number;
}

@Component({
  selector: 'app-statutory-deductions-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatDialogModule],
  templateUrl: './statutory-deductions.page.html',
  styleUrls: ['./statutory-deductions.page.scss']
})
export class StatutoryDeductionsPage implements OnInit {
  deductions: StatutoryDeduction[] = [];
  liabilities: PayrollLiability[] = [];
  kpiCards: any[] = [];
  expandedSection: string | null = 'types';

  payeByDepartment: PayeDepartment[] = [];
  otherDeductions: OtherDeductionView[] = [];

  uifTotal = 0;
  uifEmployee = 0;
  uifEmployer = 0;
  uifThreshold = 17712;
  sdlTotal = 0;
  sdlThreshold = 500000;
  annualTotal = 0;

  monthlyPhasing: MonthPhasing[] = [];

  showDeductionDialog = false;
  editingDeduction: StatutoryDeduction | null = null;
  saving = false;
  calculating = false;

  deductionForm: any = {};

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.initMonthlyPhasing();
    this.loadData();
  }

  loadData() {
    this.api.getStatutoryDeductions().subscribe(data => {
      this.deductions = data;
      this.buildOtherDeductions();
      this.buildKpis();
      this.cdr.markForCheck();
    });
    this.api.getPayrollLiabilities().subscribe(data => {
      this.liabilities = data;
      this.buildKpis();
      this.cdr.markForCheck();
    });
  }

  initMonthlyPhasing() {
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    this.monthlyPhasing = months.map(label => ({ label, percent: 100 / 12 }));
  }

  buildOtherDeductions() {
    const otherTypes = ['Pension', 'MedicalAid', 'UnionFees', 'GroupLife'];
    this.otherDeductions = this.deductions
      .filter(d => otherTypes.includes(d.deductionType))
      .map(d => ({
        ...d,
        employeeAmount: 0,
        employerAmount: 0,
        totalAmount: 0
      }));

    const uifDed = this.deductions.find(d => d.deductionType === 'UIF');
    if (uifDed) {
      this.uifThreshold = uifDed.threshold || 17712;
    }
    const sdlDed = this.deductions.find(d => d.deductionType === 'SDL');
    if (sdlDed) {
      this.sdlThreshold = sdlDed.threshold || 500000;
    }
  }

  buildKpis() {
    const totalPaye = this.getTotalPaye();
    const totalLiab = this.getTotalLiabilities();
    const pensionMedical = this.otherDeductions.reduce((s, d) => s + d.totalAmount, 0);
    this.annualTotal = totalPaye + this.uifTotal + this.sdlTotal + pensionMedical + totalLiab;

    this.kpiCards = [
      { icon: 'account_balance', label: 'Total PAYE', value: 'R ' + this.formatMoney(totalPaye), subtitle: 'Pay As You Earn', colorClass: 'icon-blue' },
      { icon: 'shield', label: 'Total UIF', value: 'R ' + this.formatMoney(this.uifTotal), subtitle: 'Unemployment Insurance', colorClass: 'icon-green' },
      { icon: 'school', label: 'Total SDL', value: 'R ' + this.formatMoney(this.sdlTotal), subtitle: 'Skills Development Levy', colorClass: 'icon-amber' },
      { icon: 'local_hospital', label: 'Pension & Medical', value: 'R ' + this.formatMoney(pensionMedical), subtitle: 'Other deductions', colorClass: 'icon-purple' },
      { icon: 'account_balance_wallet', label: 'Total Liabilities', value: 'R ' + this.formatMoney(totalLiab), subtitle: this.liabilities.length + ' liability items', colorClass: 'icon-teal' },
    ];
  }

  formatMoney(val: number): string {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
    return val.toFixed(0);
  }

  toggleSection(section: string) {
    this.expandedSection = this.expandedSection === section ? null : section;
  }

  getTotalRemuneration(): number {
    return this.payeByDepartment.reduce((s, p) => s + p.totalRemuneration, 0);
  }

  getTotalPaye(): number {
    return this.payeByDepartment.reduce((s, p) => s + p.payeAmount, 0);
  }

  getAvgPayeRate(): number {
    const totalRem = this.getTotalRemuneration();
    return totalRem > 0 ? (this.getTotalPaye() / totalRem) * 100 : 0;
  }

  getTotalEmployeeContrib(): number {
    return this.liabilities.reduce((s, l) => s + l.employeeContribution, 0);
  }

  getTotalEmployerContrib(): number {
    return this.liabilities.reduce((s, l) => s + l.employerContribution, 0);
  }

  getTotalLiabilities(): number {
    return this.liabilities.reduce((s, l) => s + l.totalLiability, 0);
  }

  calculateAll() {
    this.calculating = true;
    this.api.calculateAllDeductions(1).subscribe({
      next: (result: any) => {
        this.calculating = false;
        if (result?.payeByDepartment) {
          this.payeByDepartment = result.payeByDepartment;
        }
        if (result?.uifTotal !== undefined) {
          this.uifTotal = result.uifTotal || 0;
          this.uifEmployee = result.uifEmployee || 0;
          this.uifEmployer = result.uifEmployer || 0;
        }
        if (result?.sdlTotal !== undefined) {
          this.sdlTotal = result.sdlTotal || 0;
        }
        this.buildKpis();
        this.loadData();
        this.cdr.markForCheck();
      },
      error: () => { this.calculating = false; this.cdr.markForCheck(); }
    });
  }

  calculatePaye() {
    this.calculating = true;
    this.api.calculatePaye(1).subscribe({
      next: (result: any) => {
        this.calculating = false;
        if (result?.payeByDepartment) {
          this.payeByDepartment = result.payeByDepartment;
        }
        this.buildKpis();
        this.cdr.markForCheck();
      },
      error: () => { this.calculating = false; this.cdr.markForCheck(); }
    });
  }

  calculateUif() {
    this.calculating = true;
    this.api.calculateUif(1).subscribe({
      next: (result: any) => {
        this.calculating = false;
        if (result) {
          this.uifTotal = result.uifTotal || result.totalUif || 0;
          this.uifEmployee = result.uifEmployee || result.employeeContribution || 0;
          this.uifEmployer = result.uifEmployer || result.employerContribution || 0;
        }
        this.buildKpis();
        this.cdr.markForCheck();
      },
      error: () => { this.calculating = false; this.cdr.markForCheck(); }
    });
  }

  calculateSdl() {
    this.calculating = true;
    this.api.calculateSdl(1).subscribe({
      next: (result: any) => {
        this.calculating = false;
        if (result) {
          this.sdlTotal = result.sdlTotal || result.totalSdl || 0;
        }
        this.buildKpis();
        this.cdr.markForCheck();
      },
      error: () => { this.calculating = false; this.cdr.markForCheck(); }
    });
  }

  calculateLiabilities() {
    this.calculating = true;
    this.api.calculatePayrollLiabilities(1).subscribe({
      next: () => {
        this.calculating = false;
        this.loadData();
        this.cdr.markForCheck();
      },
      error: () => { this.calculating = false; this.cdr.markForCheck(); }
    });
  }

  amendPaymentPercentages() {
    this.api.amendPaymentPercentages({ financialYearId: 1, percentages: this.monthlyPhasing.map(m => m.percent) }).subscribe({
      next: () => { this.cdr.markForCheck(); },
      error: () => { this.cdr.markForCheck(); }
    });
  }

  resetForm() {
    this.editingDeduction = null;
    this.deductionForm = {
      deductionType: 'PAYE',
      calculationMethod: 'Percentage',
      rate: 0,
      threshold: null,
      employerContributionRate: null,
      description: ''
    };
  }

  editDeduction(d: StatutoryDeduction) {
    this.editingDeduction = d;
    this.deductionForm = {
      deductionType: d.deductionType,
      calculationMethod: d.calculationMethod,
      rate: d.rate,
      threshold: d.threshold,
      employerContributionRate: d.employerContributionRate,
      description: d.description
    };
    this.showDeductionDialog = true;
  }

  saveDeduction() {
    this.saving = true;
    const form = { ...this.deductionForm, isActive: true };
    this.api.createStatutoryDeduction(form).subscribe({
      next: () => {
        this.saving = false;
        this.showDeductionDialog = false;
        this.editingDeduction = null;
        this.loadData();
      },
      error: () => { this.saving = false; this.cdr.markForCheck(); }
    });
  }
}
