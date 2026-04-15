import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../../services/api.service';
import { DefinedBenefitObligation, LongServiceAward, DboSummary } from '../../../models/budget.models';

@Component({
  selector: 'app-benefit-obligations-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatDialogModule],
  templateUrl: './benefit-obligations.page.html',
  styleUrls: ['./benefit-obligations.page.scss']
})
export class BenefitObligationsPage implements OnInit {
  dboEntries: DefinedBenefitObligation[] = [];
  longServiceAwards: LongServiceAward[] = [];
  dboSummary: DboSummary | null = null;
  kpiCards: any[] = [];
  expandedPanel: string | null = 'dbo';

  showDboDialog = false;
  showLsaDialog = false;
  editingDbo: DefinedBenefitObligation | null = null;
  editingLsa: LongServiceAward | null = null;
  saving = false;
  dboForm: any = {};
  lsaForm: any = {};

  dboTotals = { openingBalance: 0, serviceCost: 0, interestCost: 0, benefitPayments: 0, actuarialGainLoss: 0, closingBalance: 0, currentPortion: 0, nonCurrentPortion: 0 };
  lsaTotals = { eligibleEmployees: 0, estimatedPayments: 0, currentPortion: 0, nonCurrentPortion: 0 };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.api.getDboEntries().subscribe(data => {
      this.dboEntries = data;
      this.computeDboTotals();
      this.buildKpis();
      this.cdr.markForCheck();
    });
    this.api.getLongServiceAwards().subscribe(data => {
      this.longServiceAwards = data;
      this.computeLsaTotals();
      this.buildKpis();
      this.cdr.markForCheck();
    });
    this.api.getDboSummary().subscribe(data => {
      this.dboSummary = data;
      this.buildKpis();
      this.cdr.markForCheck();
    });
  }

  computeDboTotals() {
    this.dboTotals = this.dboEntries.reduce((acc, d) => ({
      openingBalance: acc.openingBalance + d.openingBalance,
      serviceCost: acc.serviceCost + d.serviceCost,
      interestCost: acc.interestCost + d.interestCost,
      benefitPayments: acc.benefitPayments + d.benefitPayments,
      actuarialGainLoss: acc.actuarialGainLoss + d.actuarialGainLoss,
      closingBalance: acc.closingBalance + d.closingBalance,
      currentPortion: acc.currentPortion + d.currentPortion,
      nonCurrentPortion: acc.nonCurrentPortion + d.nonCurrentPortion
    }), { openingBalance: 0, serviceCost: 0, interestCost: 0, benefitPayments: 0, actuarialGainLoss: 0, closingBalance: 0, currentPortion: 0, nonCurrentPortion: 0 });
  }

  computeLsaTotals() {
    this.lsaTotals = this.longServiceAwards.reduce((acc, l) => ({
      eligibleEmployees: acc.eligibleEmployees + l.eligibleEmployees,
      estimatedPayments: acc.estimatedPayments + l.estimatedPayments,
      currentPortion: acc.currentPortion + l.currentPortion,
      nonCurrentPortion: acc.nonCurrentPortion + l.nonCurrentPortion
    }), { eligibleEmployees: 0, estimatedPayments: 0, currentPortion: 0, nonCurrentPortion: 0 });
  }

  buildKpis() {
    const totalDbo = this.dboSummary?.totalDbo ?? this.dboTotals.closingBalance;
    const currentPortion = this.dboSummary?.currentPortion ?? this.dboTotals.currentPortion;
    const nonCurrentPortion = this.dboSummary?.nonCurrentPortion ?? this.dboTotals.nonCurrentPortion;
    const totalLsa = this.dboSummary?.totalLongServiceAwards ?? this.lsaTotals.estimatedPayments;
    const totalPayments = this.dboSummary?.totalEstimatedPayments ?? this.dboTotals.benefitPayments;

    this.kpiCards = [
      { icon: 'account_balance', label: 'Total DBO', value: 'R ' + (totalDbo / 1000000).toFixed(1) + 'M', subtitle: 'Closing balance', colorClass: 'icon-blue' },
      { icon: 'trending_up', label: 'Current Portion', value: 'R ' + (currentPortion / 1000000).toFixed(1) + 'M', subtitle: 'Due within 12 months', colorClass: 'icon-green' },
      { icon: 'schedule', label: 'Non-Current Portion', value: 'R ' + (nonCurrentPortion / 1000000).toFixed(1) + 'M', subtitle: 'Due after 12 months', colorClass: 'icon-amber' },
      { icon: 'emoji_events', label: 'Long Service Awards', value: 'R ' + (totalLsa / 1000000).toFixed(1) + 'M', subtitle: this.longServiceAwards.length + ' milestones', colorClass: 'icon-teal' },
      { icon: 'payments', label: 'Estimated Payments', value: 'R ' + (totalPayments / 1000000).toFixed(1) + 'M', subtitle: 'Projected benefit payments', colorClass: 'icon-purple' },
    ];
  }

  get uniqueDboAssumptions(): DefinedBenefitObligation[] {
    const seen = new Set<string>();
    return this.dboEntries.filter(d => {
      if (seen.has(d.benefitType)) return false;
      seen.add(d.benefitType);
      return true;
    });
  }

  calculateDbo() {
    this.api.calculateDbo(1).subscribe({
      next: () => this.loadData(),
      error: () => this.cdr.markForCheck()
    });
  }

  allocateCurrentNonCurrent() {
    this.api.allocateCurrentNonCurrent(1).subscribe({
      next: () => this.loadData(),
      error: () => this.cdr.markForCheck()
    });
  }

  calculateLsaPayments() {
    this.api.calculateLsaPayments(1).subscribe({
      next: () => this.loadData(),
      error: () => this.cdr.markForCheck()
    });
  }

  resetDboForm() {
    this.editingDbo = null;
    this.dboForm = {
      benefitType: 'PostRetirementMedical',
      department: '',
      openingBalance: 0,
      serviceCost: 0,
      interestCost: 0,
      benefitPayments: 0,
      actuarialGainLoss: 0,
      discountRate: 9.5,
      inflationRate: 5.5,
      salaryGrowthRate: 6.5,
      mortalityRate: null,
      turnoverRate: null,
      financialYearId: 1
    };
  }

  editDbo(d: DefinedBenefitObligation) {
    this.editingDbo = d;
    this.dboForm = {
      benefitType: d.benefitType,
      department: d.department,
      openingBalance: d.openingBalance,
      serviceCost: d.serviceCost,
      interestCost: d.interestCost,
      benefitPayments: d.benefitPayments,
      actuarialGainLoss: d.actuarialGainLoss,
      discountRate: d.discountRate,
      inflationRate: d.inflationRate,
      salaryGrowthRate: d.salaryGrowthRate,
      mortalityRate: d.mortalityRate,
      turnoverRate: d.turnoverRate,
      financialYearId: d.financialYearId
    };
    this.showDboDialog = true;
  }

  saveDbo() {
    this.saving = true;
    if (this.editingDbo) {
      this.api.amendDboEstimates({ ...this.dboForm, id: this.editingDbo.id }).subscribe({
        next: () => { this.saving = false; this.showDboDialog = false; this.editingDbo = null; this.loadData(); },
        error: () => { this.saving = false; this.cdr.markForCheck(); }
      });
    } else {
      this.api.createDboEntry(this.dboForm).subscribe({
        next: () => { this.saving = false; this.showDboDialog = false; this.dboForm = {}; this.loadData(); },
        error: () => { this.saving = false; this.cdr.markForCheck(); }
      });
    }
  }

  resetLsaForm() {
    this.editingLsa = null;
    this.lsaForm = {
      department: '',
      milestoneYears: 10,
      benefitAmount: 0,
      eligibleEmployees: 0,
      financialYearId: 1
    };
  }

  editLsa(lsa: LongServiceAward) {
    this.editingLsa = lsa;
    this.lsaForm = {
      department: lsa.department,
      milestoneYears: lsa.milestoneYears,
      benefitAmount: lsa.benefitAmount,
      eligibleEmployees: lsa.eligibleEmployees,
      financialYearId: lsa.financialYearId
    };
    this.showLsaDialog = true;
  }

  saveLsa() {
    this.saving = true;
    this.api.createLongServiceAward(this.lsaForm).subscribe({
      next: () => { this.saving = false; this.showLsaDialog = false; this.lsaForm = {}; this.loadData(); },
      error: () => { this.saving = false; this.cdr.markForCheck(); }
    });
  }
}
