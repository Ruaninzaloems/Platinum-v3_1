import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../services/api.service';
import {
  PayrollBudgetLine, PayrollBudgetSummary, PayrollScenario,
  CouncillorPosition, WardCommitteeBudget
} from '../../../models/budget.models';

@Component({
  selector: 'app-hr-draft-budget-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './draft-budget.page.html',
  styleUrls: ['./draft-budget.page.scss']
})
export class HrDraftBudgetPage implements OnInit {
  budgetLines: PayrollBudgetLine[] = [];
  summary: PayrollBudgetSummary | null = null;
  scenarios: PayrollScenario[] = [];
  councillorPositions: CouncillorPosition[] = [];
  wardBudgets: WardCommitteeBudget[] = [];
  kpiCards: any[] = [];
  validationResults: any[] = [];
  validationPassed = 0;
  validationWarnings = 0;
  validationErrors = 0;
  councillorTotal = 0;
  wardTotal = 0;

  calculating = false;
  generating = false;
  validating = false;
  submitting = false;

  showMonthlyDialog = false;
  showApproveDialog = false;
  selectedLine: PayrollBudgetLine | null = null;
  approvalComments = '';
  approvalLineId: number | null = null;

  months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.api.getPayrollBudgetLines().subscribe(data => {
      this.budgetLines = data;
      this.cdr.markForCheck();
    });
    this.api.getPayrollBudgetSummary().subscribe(data => {
      this.summary = data;
      this.buildKpis();
      this.cdr.markForCheck();
    });
    this.api.getPayrollScenarios().subscribe(data => {
      this.scenarios = data;
      this.cdr.markForCheck();
    });
    this.api.getCouncillorPositions().subscribe(data => {
      this.councillorPositions = data;
      this.councillorTotal = data.reduce((s, c) => s + c.basicSalary + c.travelAllowance + c.cellphoneAllowance + c.medicalContribution, 0);
      this.buildKpis();
      this.cdr.markForCheck();
    });
    this.api.getWardCommitteeBudgets().subscribe(data => {
      this.wardBudgets = data;
      this.wardTotal = data.reduce((s, w) => s + w.totalEstimatedCost, 0);
      this.buildKpis();
      this.cdr.markForCheck();
    });
  }

  buildKpis() {
    this.kpiCards = [
      { icon: 'account_balance_wallet', label: 'Total Payroll Budget', value: 'R ' + ((this.summary?.totalPayrollBudget || 0) / 1000000).toFixed(1) + 'M', subtitle: 'All categories', colorClass: 'icon-blue' },
      { icon: 'lock', label: 'Fixed Costs', value: 'R ' + ((this.summary?.totalFixedCosts || 0) / 1000000).toFixed(1) + 'M', subtitle: 'Salaries & benefits', colorClass: 'icon-green' },
      { icon: 'sync_alt', label: 'Variable Costs', value: 'R ' + ((this.summary?.totalVariableCosts || 0) / 1000000).toFixed(1) + 'M', subtitle: 'Overtime, travel etc.', colorClass: 'icon-amber' },
      { icon: 'groups', label: 'Councillor Costs', value: 'R ' + ((this.summary?.totalCouncillorCosts || 0) / 1000000).toFixed(1) + 'M', subtitle: 'All councillor positions', colorClass: 'icon-teal' },
      { icon: 'location_city', label: 'Ward Committee', value: 'R ' + ((this.summary?.totalWardCommitteeCosts || 0) / 1000000).toFixed(1) + 'M', subtitle: 'Ward meetings budget', colorClass: 'icon-purple' },
    ];
  }

  calculateFullBudget() {
    this.calculating = true;
    this.cdr.markForCheck();
    this.api.calculatePayrollBudget(1).subscribe({
      next: () => { this.calculating = false; this.loadData(); },
      error: () => { this.calculating = false; this.cdr.markForCheck(); }
    });
  }

  generateBudgetStrings() {
    this.generating = true;
    this.cdr.markForCheck();
    this.api.generateHrBudgetStrings({ budgetVersionId: 1, financialYearId: 1 }).subscribe({
      next: () => { this.generating = false; this.loadData(); },
      error: () => { this.generating = false; this.cdr.markForCheck(); }
    });
  }

  validateMscoa() {
    this.validating = true;
    this.cdr.markForCheck();
    this.api.validateHrMscoa(1).subscribe({
      next: (res: any) => {
        this.validating = false;
        this.validationResults = res.results || [];
        this.validationPassed = res.passed || 0;
        this.validationWarnings = res.warnings || 0;
        this.validationErrors = res.errors || 0;
        this.cdr.markForCheck();
      },
      error: () => { this.validating = false; this.cdr.markForCheck(); }
    });
  }

  submitAll() {
    this.submitting = true;
    this.cdr.markForCheck();
    this.api.submitAllHrBudget(1).subscribe({
      next: () => { this.submitting = false; this.loadData(); },
      error: () => { this.submitting = false; this.cdr.markForCheck(); }
    });
  }

  showMonthlyBreakdown(line: PayrollBudgetLine) {
    this.selectedLine = line;
    this.showMonthlyDialog = true;
  }

  getMonthValue(line: PayrollBudgetLine, index: number): number {
    const monthKeys = ['month01','month02','month03','month04','month05','month06','month07','month08','month09','month10','month11','month12'] as const;
    return (line as any)[monthKeys[index]] || 0;
  }

  approveLine(line: PayrollBudgetLine) {
    this.approvalLineId = line.id;
    this.approvalComments = '';
    this.showApproveDialog = true;
  }

  confirmApproval() {
    if (this.approvalLineId) {
      this.api.approveHrBudget(this.approvalLineId, { comments: this.approvalComments, approvedBy: 'system' }).subscribe({
        next: () => { this.showApproveDialog = false; this.approvalLineId = null; this.loadData(); },
        error: () => { this.cdr.markForCheck(); }
      });
    }
  }

  calculateScenario(id: number) {
    this.api.calculatePayrollScenario(id).subscribe(() => this.loadData());
  }

  submitScenarioReport(scenario: PayrollScenario) {
    this.api.approveHrBudget(scenario.id, { entityType: 'PayrollScenario', decision: 'Submitted', comments: 'Scenario report submitted', approvedBy: 'system' }).subscribe(() => this.loadData());
  }

  approveScenarioReport(scenario: PayrollScenario) {
    this.api.approveHrBudget(scenario.id, { entityType: 'PayrollScenario', decision: 'Approved', comments: 'Scenario report approved', approvedBy: 'system' }).subscribe(() => this.loadData());
  }
}
