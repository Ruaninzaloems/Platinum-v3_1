import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import {
  SalaryIncrease, SalaryStructure, TemporaryContract,
  PerformanceBonus, PostEstablishment
} from '../../../core/models/budget.models';

@Component({
  selector: 'app-salary-calculations-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatDialogModule],
  templateUrl: './salary-calculations.page.html',
  styleUrls: ['./salary-calculations.page.scss']
})
export class SalaryCalculationsPage implements OnInit {
  salaryIncreases: SalaryIncrease[] = [];
  salaryStructures: SalaryStructure[] = [];
  temporaryContracts: TemporaryContract[] = [];
  performanceBonuses: PerformanceBonus[] = [];
  vacantPosts: PostEstablishment[] = [];
  kpiCards: any[] = [];

  activePanel: string = 'increases';
  calculating = false;

  showIncreaseDialog = false;
  increaseForm: any = {};
  savingIncrease = false;

  showContractDialog = false;
  contractForm: any = {};
  savingContract = false;

  showBonusDialog = false;
  bonusForm: any = {};
  savingBonus = false;

  notchResults: any = null;
  percentageResults: any = null;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.api.getSalaryIncreases().subscribe(data => {
      this.salaryIncreases = data;
      this.buildKpis();
      this.cdr.markForCheck();
    });
    this.api.getSalaryStructures().subscribe(data => {
      this.salaryStructures = data;
      this.cdr.markForCheck();
    });
    this.api.getTemporaryContracts().subscribe(data => {
      this.temporaryContracts = data;
      this.buildKpis();
      this.cdr.markForCheck();
    });
    this.api.getPerformanceBonuses().subscribe(data => {
      this.performanceBonuses = data;
      this.buildKpis();
      this.cdr.markForCheck();
    });
    this.api.getVacantPosts().subscribe(data => {
      this.vacantPosts = data;
      this.buildKpis();
      this.cdr.markForCheck();
    });
  }

  buildKpis() {
    const totalSalary = this.salaryStructures.reduce((s, ss) => s + ss.annualAmount, 0);
    const increaseImpact = this.salaryIncreases.reduce((s, si) => s + (si.increasePercentage / 100) * totalSalary, 0);
    const notchCost = this.salaryIncreases.filter(si => si.isNotchProgression).reduce((s, si) => s + (si.increasePercentage / 100) * totalSalary, 0);
    const tempBudget = this.temporaryContracts.reduce((s, tc) => s + tc.calculatedBudget, 0);
    const bonusProvision = this.performanceBonuses.reduce((s, pb) => s + pb.estimatedTotalCost, 0);

    this.kpiCards = [
      { icon: 'account_balance_wallet', label: 'Total Salary Budget', value: 'R ' + this.formatMillions(totalSalary), subtitle: 'Salary structures', colorClass: 'icon-blue' },
      { icon: 'trending_up', label: 'Increase Impact', value: 'R ' + this.formatMillions(increaseImpact), subtitle: this.salaryIncreases.length + ' categories', colorClass: 'icon-green' },
      { icon: 'stairs', label: 'Notch Progression Cost', value: 'R ' + this.formatMillions(notchCost), subtitle: 'Auto progression', colorClass: 'icon-amber' },
      { icon: 'description', label: 'Temp Contract Budget', value: 'R ' + this.formatMillions(tempBudget), subtitle: this.temporaryContracts.length + ' contracts', colorClass: 'icon-teal' },
      { icon: 'emoji_events', label: 'Bonus Provision', value: 'R ' + this.formatMillions(bonusProvision), subtitle: this.performanceBonuses.length + ' categories', colorClass: 'icon-purple' },
    ];
  }

  formatMillions(val: number): string {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'K';
    return val.toFixed(0);
  }

  setPanel(panel: string) { this.activePanel = panel; }

  calculateNotchProgression() {
    this.calculating = true;
    this.api.calculateNotchProgression(1).subscribe({
      next: (result) => { this.notchResults = result; this.calculating = false; this.loadData(); },
      error: () => { this.calculating = false; this.cdr.markForCheck(); }
    });
  }

  calculatePercentageIncrease() {
    this.calculating = true;
    this.api.calculatePercentageIncrease(1).subscribe({
      next: (result) => { this.percentageResults = result; this.calculating = false; this.loadData(); },
      error: () => { this.calculating = false; this.cdr.markForCheck(); }
    });
  }

  calculateContractBudgets() {
    this.calculating = true;
    this.api.calculateContractBudgets(1).subscribe({
      next: () => { this.calculating = false; this.loadData(); },
      error: () => { this.calculating = false; this.cdr.markForCheck(); }
    });
  }

  calculateBonusBudget() {
    this.calculating = true;
    this.api.calculateBonusBudget(1).subscribe({
      next: () => { this.calculating = false; this.loadData(); },
      error: () => { this.calculating = false; this.cdr.markForCheck(); }
    });
  }

  openIncreaseDialog() {
    this.increaseForm = { employeeCategory: '', increasePercentage: 0, effectiveDate: new Date().toISOString().split('T')[0], isNotchProgression: false };
    this.showIncreaseDialog = true;
  }

  saveIncrease() {
    this.savingIncrease = true;
    const data = { ...this.increaseForm, financialYearId: 1, effectiveDate: this.increaseForm.effectiveDate || new Date().toISOString() };
    this.api.createSalaryIncrease(data).subscribe({
      next: () => { this.savingIncrease = false; this.showIncreaseDialog = false; this.loadData(); },
      error: () => { this.savingIncrease = false; this.cdr.markForCheck(); }
    });
  }

  openContractDialog() {
    this.contractForm = { employeeName: '', department: '', remunerationType: 'Monthly', rate: 0, contractStartDate: new Date().toISOString().split('T')[0], contractEndDate: '' };
    this.showContractDialog = true;
  }

  saveContract() {
    this.savingContract = true;
    const data = { ...this.contractForm, financialYearId: 1 };
    this.api.createTemporaryContract(data).subscribe({
      next: () => { this.savingContract = false; this.showContractDialog = false; this.loadData(); },
      error: () => { this.savingContract = false; this.cdr.markForCheck(); }
    });
  }

  openBonusDialog() {
    this.bonusForm = { department: '', employeeCategory: '', bonusPercentage: 0, qualifyingEmployees: 0 };
    this.showBonusDialog = true;
  }

  saveBonus() {
    this.savingBonus = true;
    const data = { ...this.bonusForm, financialYearId: 1 };
    this.api.createPerformanceBonus(data).subscribe({
      next: () => { this.savingBonus = false; this.showBonusDialog = false; this.loadData(); },
      error: () => { this.savingBonus = false; this.cdr.markForCheck(); }
    });
  }

  getVacantPostBudget(): number {
    return this.vacantPosts.reduce((s, p) => s + p.annualSalary, 0);
  }
}
