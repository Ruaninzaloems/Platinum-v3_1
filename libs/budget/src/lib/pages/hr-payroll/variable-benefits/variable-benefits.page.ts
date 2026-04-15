import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { VariableBenefitHours, TravelRequirement, TravelStandardRate } from '../../../core/models/budget.models';

@Component({
  selector: 'app-variable-benefits-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatDialogModule],
  templateUrl: './variable-benefits.page.html',
  styleUrls: ['./variable-benefits.page.scss']
})
export class VariableBenefitsPage implements OnInit {
  variableBenefits: VariableBenefitHours[] = [];
  hoursHistory: VariableBenefitHours[] = [];
  travelRequirements: TravelRequirement[] = [];
  standardRates: TravelStandardRate[] = [];
  travelTrends: any[] = [];
  kpiCards: any[] = [];
  departments: string[] = [];

  activeTab = 'hours';
  filterDepartment = '';
  historyDepartment = '';
  travelDepartment = '';
  trendDepartment = '';

  showHoursDialog = false;
  showTravelDialog = false;
  showRateDialog = false;
  editingHours: VariableBenefitHours | null = null;
  saving = false;

  hoursForm: any = {};
  travelForm: any = {};
  rateForm: any = {};

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadVariableBenefits();
    this.loadTravelRequirements();
    this.loadStandardRates();
    this.loadHoursHistory();
  }

  loadVariableBenefits() {
    this.api.getVariableBenefitHours(undefined, this.filterDepartment || undefined).subscribe(data => {
      this.variableBenefits = data;
      this.extractDepartments(data);
      this.buildKpis();
      this.cdr.markForCheck();
    });
  }

  loadHoursHistory() {
    this.api.getHoursHistory(this.historyDepartment || undefined).subscribe(data => {
      this.hoursHistory = data;
      this.cdr.markForCheck();
    });
  }

  loadTravelRequirements() {
    this.api.getTravelRequirements(undefined, this.travelDepartment || undefined).subscribe(data => {
      this.travelRequirements = data;
      this.buildKpis();
      this.cdr.markForCheck();
    });
  }

  loadStandardRates() {
    this.api.getTravelStandardRates().subscribe(data => {
      this.standardRates = data;
      this.cdr.markForCheck();
    });
  }

  loadTravelTrends() {
    this.api.getTravelTrends(this.trendDepartment || undefined).subscribe(data => {
      this.travelTrends = data;
      this.cdr.markForCheck();
    });
  }

  extractDepartments(data: VariableBenefitHours[]) {
    const depts = new Set<string>();
    data.forEach(d => { if (d.department) depts.add(d.department); });
    this.departments = Array.from(depts).sort();
  }

  buildKpis() {
    const totalVariable = this.variableBenefits.reduce((s, v) => s + v.calculatedCost, 0);
    const overtimeBudget = this.variableBenefits.filter(v => v.benefitType === 'Overtime').reduce((s, v) => s + v.calculatedCost, 0);
    const standbyBudget = this.variableBenefits.filter(v => v.benefitType === 'Standby').reduce((s, v) => s + v.calculatedCost, 0);
    const travelBudget = this.travelRequirements.reduce((s, t) => s + t.estimatedCost, 0);
    const totalHours = this.variableBenefits.reduce((s, v) => s + v.estimatedHours, 0);

    this.kpiCards = [
      { icon: 'payments', label: 'Total Variable Benefits', value: 'R ' + (totalVariable / 1000000).toFixed(1) + 'M', subtitle: 'All benefit types', colorClass: 'icon-blue' },
      { icon: 'schedule', label: 'Overtime Budget', value: 'R ' + (overtimeBudget / 1000000).toFixed(1) + 'M', subtitle: 'Overtime costs', colorClass: 'icon-amber' },
      { icon: 'nights_stay', label: 'Standby Budget', value: 'R ' + (standbyBudget / 1000000).toFixed(1) + 'M', subtitle: 'Standby allowances', colorClass: 'icon-teal' },
      { icon: 'flight', label: 'Travel Budget', value: 'R ' + (travelBudget / 1000000).toFixed(1) + 'M', subtitle: 'All travel costs', colorClass: 'icon-purple' },
      { icon: 'timer', label: 'Total Hours', value: totalHours.toLocaleString(), subtitle: 'Estimated hours', colorClass: 'icon-green' },
    ];
  }

  getTotalEstimatedHours(): number {
    return this.variableBenefits.reduce((s, v) => s + v.estimatedHours, 0);
  }

  getTotalCalculatedCost(): number {
    return this.variableBenefits.reduce((s, v) => s + v.calculatedCost, 0);
  }

  getTotalHistoricalHours(): number {
    return this.variableBenefits.reduce((s, v) => s + (v.historicalHours || 0), 0);
  }

  getTotalHistoricalCost(): number {
    return this.variableBenefits.reduce((s, v) => s + (v.historicalCost || 0), 0);
  }

  getTotalTravelCost(): number {
    return this.travelRequirements.reduce((s, t) => s + t.estimatedCost, 0);
  }

  resetHoursForm() {
    this.editingHours = null;
    this.hoursForm = { department: '', benefitType: 'Overtime', estimatedHours: 0, averageRate: 0, historicalHours: null, historicalCost: null };
  }

  editHours(vb: VariableBenefitHours) {
    this.editingHours = vb;
    this.hoursForm = {
      department: vb.department,
      benefitType: vb.benefitType,
      estimatedHours: vb.estimatedHours,
      averageRate: vb.averageRate,
      historicalHours: vb.historicalHours,
      historicalCost: vb.historicalCost
    };
    this.showHoursDialog = true;
  }

  saveHours() {
    this.saving = true;
    if (this.editingHours) {
      this.api.amendVariableHours({
        id: this.editingHours.id,
        estimatedHours: this.hoursForm.estimatedHours,
        averageRate: this.hoursForm.averageRate,
        historicalHours: this.hoursForm.historicalHours,
        historicalCost: this.hoursForm.historicalCost
      }).subscribe({
        next: () => { this.saving = false; this.showHoursDialog = false; this.editingHours = null; this.loadVariableBenefits(); },
        error: () => { this.saving = false; this.cdr.markForCheck(); }
      });
    } else {
      this.api.createVariableBenefitHours({
        ...this.hoursForm,
        financialYearId: 1
      }).subscribe({
        next: () => { this.saving = false; this.showHoursDialog = false; this.loadVariableBenefits(); },
        error: () => { this.saving = false; this.cdr.markForCheck(); }
      });
    }
  }

  resetTravelForm() {
    this.travelForm = {
      department: '', destination: '', purposeOfTravel: '', transportMode: 'Vehicle',
      numberOfOfficials: 1, numberOfTrips: 1, estimatedKilometres: 0,
      accommodationNights: 0, travelDuration: 1, projectReference: ''
    };
  }

  saveTravel() {
    this.saving = true;
    this.api.createTravelRequirement({
      ...this.travelForm,
      financialYearId: 1
    }).subscribe({
      next: () => { this.saving = false; this.showTravelDialog = false; this.loadTravelRequirements(); },
      error: () => { this.saving = false; this.cdr.markForCheck(); }
    });
  }

  resetRateForm() {
    this.rateForm = {
      rateType: 'Mileage', classification: 'Local', employeeLevel: '',
      rateAmount: 0, effectiveDate: new Date().toISOString().split('T')[0], policyReference: ''
    };
  }

  saveRate() {
    this.saving = true;
    this.api.createTravelStandardRate(this.rateForm).subscribe({
      next: () => { this.saving = false; this.showRateDialog = false; this.loadStandardRates(); },
      error: () => { this.saving = false; this.cdr.markForCheck(); }
    });
  }

  calculateVariableBenefits() {
    this.api.calculateVariableBenefits(1).subscribe({
      next: () => { this.loadVariableBenefits(); },
      error: () => { this.cdr.markForCheck(); }
    });
  }

  calculateTravelBudget() {
    this.api.calculateTravelBudget(1).subscribe({
      next: () => { this.loadTravelRequirements(); },
      error: () => { this.cdr.markForCheck(); }
    });
  }
}
