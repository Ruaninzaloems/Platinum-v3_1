import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-prior-period-adjustments',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule],
  templateUrl: './prior-period-adjustments.component.html',
  styleUrls: ['./prior-period-adjustments.component.css']
})
export class PriorPeriodAdjustmentsComponent implements OnInit {

  activeTab: 'capture' | 'review' = 'capture';

  captureStep: number = 1;

  searchId: string = '';
  searchDesc: string = '';
  searchResults = signal<any[]>([]);
  searchLoading = false;
  selectedAsset: any = null;
  private searchDebounce: any = null;

  adjustmentTypes: any[] = [];
  selectedTypeCode: string = '';
  get selectedType(): any {
    for (var i = 0; i < this.adjustmentTypes.length; i++) {
      if (this.adjustmentTypes[i].code === this.selectedTypeCode) return this.adjustmentTypes[i];
    }
    return null;
  }

  currentFinYear: string = '';
  currentPeriod: number = 0;
  availablePeriods: any[] = [];
  selectedTargetPeriod: number = 0;

  transactionDate: string = '';
  debitAmount: string = '';
  creditAmount: string = '';
  narration: string = '';
  adjustmentAmount: string = '';
  comments: string = '';

  downstreamImpactCount: number = 0;
  downstreamImpactTypes: string[] = [];
  downstreamWarning: string = '';
  downstreamClosedPeriodCount: number = 0;
  downstreamLoading = false;
  downstreamChecked = false;

  glFinYears: string[] = [];
  glFinYearsLoading = false;

  drFinYear: string = '';
  drProjects: any[] = [];
  drProjectsLoading = false;
  selectedDrProjectId: string = '';
  drScoaItems: any[] = [];
  drScoaLoading = false;
  selectedDrScoaItemId: string = '';

  crFinYear: string = '';
  crProjects: any[] = [];
  crProjectsLoading = false;
  selectedCrProjectId: string = '';
  crScoaItems: any[] = [];
  crScoaLoading = false;
  selectedCrScoaItemId: string = '';

  submitting = false;

  reviewFilter: string = 'Pending';
  reviewList = signal<any[]>([]);
  reviewLoading = false;
  selectedReview: any = null;
  reviewDetail: any = null;
  reviewDetailLoading = false;
  approving = false;
  rejecting = false;
  approveComments: string = '';
  rejectReason: string = '';
  showApproveForm = false;
  showRejectForm = false;

  periodMonths: any[] = [
    { value: 1, label: 'July' }, { value: 2, label: 'August' }, { value: 3, label: 'September' },
    { value: 4, label: 'October' }, { value: 5, label: 'November' }, { value: 6, label: 'December' },
    { value: 7, label: 'January' }, { value: 8, label: 'February' }, { value: 9, label: 'March' },
    { value: 10, label: 'April' }, { value: 11, label: 'May' }, { value: 12, label: 'June' },
  ];

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    var self = this;
    this.api.getPriorPeriodAdjustmentTypes().subscribe({
      next: function(data: any[]) { self.adjustmentTypes = data; }
    });
    this.api.getPriorPeriodEligiblePeriods().subscribe({
      next: function(data: any) {
        self.currentFinYear = data.currentFinYear;
        self.currentPeriod = data.currentPeriod;
        self.availablePeriods = data.periods || [];
      }
    });
    this.loadReviewList();
  }

  onSearchIdInput(): void {
    var self = this;
    if (self.searchDebounce) clearTimeout(self.searchDebounce);
    if (!self.searchId.trim()) {
      self.searchResults.set([]);
      return;
    }
    self.searchDebounce = setTimeout(function() { self.searchAssets(); }, 300);
  }

  searchAssets(): void {
    var params: any = {};
    if (this.searchId.trim()) params['assetRegisterItemId'] = this.searchId.trim();
    if (this.searchDesc.trim()) params['description'] = this.searchDesc.trim();
    if (!params['assetRegisterItemId'] && !params['description']) return;
    this.searchLoading = true;
    this.searchResults.set([]);
    var self = this;
    this.api.searchAssetsForPriorPeriod(params).subscribe({
      next: function(data: any[]) {
        self.searchResults.set(data);
        self.searchLoading = false;
      },
      error: function() { self.searchLoading = false; }
    });
  }

  selectAsset(asset: any): void {
    this.selectedAsset = asset;
    this.captureStep = 2;
  }

  selectType(code: string): void {
    this.selectedTypeCode = code;
    this.resetValues();
    this.captureStep = 3;
  }

  proceedToDownstreamImpact(): void {
    if (!this.selectedTargetPeriod || !this.adjustmentAmount || !this.transactionDate) return;
    this.captureStep = 4;
    this.checkDownstreamImpact();
  }

  checkDownstreamImpact(): void {
    this.downstreamChecked = false;
    this.downstreamImpactCount = 0;
    this.downstreamImpactTypes = [];
    this.downstreamWarning = '';
    this.downstreamClosedPeriodCount = 0;
    if (!this.selectedTargetPeriod || !this.selectedAsset) return;
    this.downstreamLoading = true;
    var self = this;
    this.api.getPriorPeriodDownstreamImpact(
      this.selectedAsset.AssetRegisterItem_ID,
      this.currentFinYear,
      this.selectedTargetPeriod
    ).subscribe({
      next: function(data: any) {
        self.downstreamImpactCount = data.count || 0;
        self.downstreamImpactTypes = data.transactionTypes || [];
        self.downstreamWarning = data.warning || '';
        self.downstreamClosedPeriodCount = data.closedPeriodCount || 0;
        self.downstreamChecked = true;
        self.downstreamLoading = false;
      },
      error: function() {
        self.downstreamChecked = true;
        self.downstreamLoading = false;
      }
    });
  }

  proceedToGlCoding(): void {
    this.captureStep = 5;
    this.loadGlFinYears();
  }

  proceedToPreview(): void {
    this.captureStep = 6;
  }

  loadGlFinYears(): void {
    if (this.glFinYears.length > 0) return;
    this.glFinYearsLoading = true;
    var self = this;
    this.api.getWipTransferFinancialYears().subscribe({
      next: function(data: string[]) { self.glFinYears = data; self.glFinYearsLoading = false; },
      error: function() { self.glFinYearsLoading = false; }
    });
  }

  onDrFinYearChange(): void {
    this.selectedDrProjectId = '';
    this.drProjects = [];
    this.selectedDrScoaItemId = '';
    this.drScoaItems = [];
    if (!this.drFinYear) return;
    var self = this;
    this.drProjectsLoading = true;
    this.api.getWipTransferProjects(this.drFinYear).subscribe({
      next: function(data: any[]) { self.drProjects = data; self.drProjectsLoading = false; },
      error: function() { self.drProjectsLoading = false; }
    });
  }

  onDrProjectChange(): void {
    this.selectedDrScoaItemId = '';
    this.drScoaItems = [];
    if (!this.selectedDrProjectId) return;
    var self = this;
    this.drScoaLoading = true;
    this.api.getWipTransferScoaItems(Number(this.selectedDrProjectId)).subscribe({
      next: function(data: any[]) { self.drScoaItems = data; self.drScoaLoading = false; },
      error: function() { self.drScoaLoading = false; }
    });
  }

  onCrFinYearChange(): void {
    this.selectedCrProjectId = '';
    this.crProjects = [];
    this.selectedCrScoaItemId = '';
    this.crScoaItems = [];
    if (!this.crFinYear) return;
    var self = this;
    this.crProjectsLoading = true;
    this.api.getWipTransferProjects(this.crFinYear).subscribe({
      next: function(data: any[]) { self.crProjects = data; self.crProjectsLoading = false; },
      error: function() { self.crProjectsLoading = false; }
    });
  }

  onCrProjectChange(): void {
    this.selectedCrScoaItemId = '';
    this.crScoaItems = [];
    if (!this.selectedCrProjectId) return;
    var self = this;
    this.crScoaLoading = true;
    this.api.getWipTransferScoaItems(Number(this.selectedCrProjectId)).subscribe({
      next: function(data: any[]) { self.crScoaItems = data; self.crScoaLoading = false; },
      error: function() { self.crScoaLoading = false; }
    });
  }

  getAmountLabel(): string {
    if (this.selectedTypeCode === 'DEP_ADJ') return 'New Depreciation Amount (R)';
    if (this.selectedTypeCode === 'COST_ADJ') return 'New Cost Amount (R)';
    if (this.selectedTypeCode === 'IMP_ADJ') return 'Impairment Amount (R)';
    if (this.selectedTypeCode === 'IMPREV_ADJ') return 'Impairment Reversal Amount (R)';
    if (this.selectedTypeCode === 'REVAL_ADJ') return 'Revaluation Amount (R)';
    return 'Adjustment Amount (R)';
  }

  canProceedStep3(): boolean {
    if (!this.selectedTargetPeriod) return false;
    if (!this.adjustmentAmount) return false;
    if (!this.transactionDate) return false;
    return true;
  }

  submit(): void {
    this.submitting = true;
    var body: any = {
      assetRegisterItemId: this.selectedAsset.AssetRegisterItem_ID,
      adjustmentTypeCode: this.selectedTypeCode,
      targetFinYear: this.currentFinYear,
      targetFinPeriod: this.selectedTargetPeriod,
      transactionDate: this.transactionDate,
      narration: this.narration || null,
      downstreamImpactCount: this.downstreamImpactCount,
      downstreamImpactTypes: this.downstreamImpactTypes.join(', ')
    };

    var amt = parseFloat(this.adjustmentAmount);
    if (this.selectedTypeCode === 'DEP_ADJ') body['newDepreciationAmount'] = amt;
    else if (this.selectedTypeCode === 'COST_ADJ') body['newCostAmount'] = amt;
    else if (this.selectedTypeCode === 'IMP_ADJ') body['newImpairmentAmount'] = amt;
    else if (this.selectedTypeCode === 'IMPREV_ADJ') body['newImpairmentReversalAmount'] = amt;
    else if (this.selectedTypeCode === 'REVAL_ADJ') body['newRevaluationAmount'] = amt;
    else body['adjustmentAmount'] = amt;

    if (this.debitAmount) body['debitAmount'] = parseFloat(this.debitAmount);
    if (this.creditAmount) body['creditAmount'] = parseFloat(this.creditAmount);
    if (this.selectedDrScoaItemId) body['drPlanProjectItemID'] = Number(this.selectedDrScoaItemId);
    if (this.selectedCrScoaItemId) body['crPlanProjectItemID'] = Number(this.selectedCrScoaItemId);
    if (this.comments) body['comments'] = this.comments;

    var self = this;
    this.api.submitPriorPeriodAdjustment(body).subscribe({
      next: function(res: any) {
        self.submitting = false;
        self.snackBar.open('Prior period adjustment submitted (ID: ' + res.id + '). Awaiting approval.', 'OK', { duration: 6000 });
        self.resetCapture();
        self.loadReviewList();
      },
      error: function(err: any) {
        self.submitting = false;
        self.snackBar.open(err.error?.error || 'Submit failed', 'OK', { duration: 6000 });
      }
    });
  }

  resetValues(): void {
    this.selectedTargetPeriod = 0;
    this.transactionDate = '';
    this.debitAmount = '';
    this.creditAmount = '';
    this.narration = '';
    this.adjustmentAmount = '';
    this.comments = '';
    this.downstreamImpactCount = 0;
    this.downstreamImpactTypes = [];
    this.downstreamWarning = '';
    this.downstreamClosedPeriodCount = 0;
    this.downstreamChecked = false;
    this.drFinYear = '';
    this.drProjects = [];
    this.selectedDrProjectId = '';
    this.drScoaItems = [];
    this.selectedDrScoaItemId = '';
    this.crFinYear = '';
    this.crProjects = [];
    this.selectedCrProjectId = '';
    this.crScoaItems = [];
    this.selectedCrScoaItemId = '';
  }

  resetCapture(): void {
    this.captureStep = 1;
    this.searchId = '';
    this.searchDesc = '';
    this.searchResults.set([]);
    this.selectedAsset = null;
    this.selectedTypeCode = '';
    this.resetValues();
  }

  goBackCapture(step: number): void {
    this.captureStep = step;
    if (step <= 2) { this.selectedTypeCode = ''; this.resetValues(); }
    if (step <= 1) { this.selectedAsset = null; }
  }

  getPeriodLabel(period: number): string {
    for (var i = 0; i < this.periodMonths.length; i++) {
      if (this.periodMonths[i].value === period) return this.periodMonths[i].label;
    }
    return 'Period ' + period;
  }

  loadReviewList(): void {
    this.reviewLoading = true;
    var params: any = {};
    if (this.reviewFilter !== 'All') params['status'] = this.reviewFilter;
    var self = this;
    this.api.getPriorPeriodAdjustments(params).subscribe({
      next: function(data: any[]) {
        self.reviewList.set(data);
        self.reviewLoading = false;
      },
      error: function() { self.reviewLoading = false; }
    });
  }

  selectReview(item: any): void {
    if (this.selectedReview?.PriorPeriodAdjustment_ID === item.PriorPeriodAdjustment_ID) return;
    this.selectedReview = item;
    this.reviewDetail = null;
    this.showApproveForm = false;
    this.showRejectForm = false;
    this.approveComments = '';
    this.rejectReason = '';
    this.reviewDetailLoading = true;
    var self = this;
    this.api.getPriorPeriodAdjustmentById(item.PriorPeriodAdjustment_ID).subscribe({
      next: function(data: any) {
        self.reviewDetail = data;
        self.reviewDetailLoading = false;
      },
      error: function() { self.reviewDetailLoading = false; }
    });
  }

  approveRecord(): void {
    if (!this.selectedReview) return;
    this.approving = true;
    var self = this;
    this.api.approvePriorPeriodAdjustment(this.selectedReview.PriorPeriodAdjustment_ID, { comments: this.approveComments }).subscribe({
      next: function() {
        self.approving = false;
        self.snackBar.open('Prior period adjustment approved. Transaction posted and summaries cascaded through all subsequent periods.', 'OK', { duration: 5000 });
        self.selectedReview = null;
        self.reviewDetail = null;
        self.showApproveForm = false;
        self.loadReviewList();
      },
      error: function(err: any) {
        self.approving = false;
        self.snackBar.open(err.error?.error || 'Approval failed', 'OK', { duration: 6000 });
      }
    });
  }

  rejectRecord(): void {
    if (!this.selectedReview || !this.rejectReason.trim()) return;
    this.rejecting = true;
    var self = this;
    this.api.rejectPriorPeriodAdjustment(this.selectedReview.PriorPeriodAdjustment_ID, { rejectionReason: this.rejectReason }).subscribe({
      next: function() {
        self.rejecting = false;
        self.snackBar.open('Adjustment rejected.', 'OK', { duration: 4000 });
        self.selectedReview = null;
        self.reviewDetail = null;
        self.showRejectForm = false;
        self.loadReviewList();
      },
      error: function(err: any) {
        self.rejecting = false;
        self.snackBar.open(err.error?.error || 'Rejection failed', 'OK', { duration: 5000 });
      }
    });
  }

  getStatusClass(status: string): string {
    if (status === 'Pending') return 'badge-pending';
    if (status === 'Approved') return 'badge-approved';
    if (status === 'Rejected') return 'badge-rejected';
    return 'badge-other';
  }

  getTypeLabel(code: string): string {
    for (var i = 0; i < this.adjustmentTypes.length; i++) {
      if (this.adjustmentTypes[i].code === code) return this.adjustmentTypes[i].label;
    }
    return code;
  }

  formatNum(v: any): string {
    if (v === null || v === undefined) return '—';
    var n = parseFloat(v);
    if (isNaN(n)) return '—';
    return n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
