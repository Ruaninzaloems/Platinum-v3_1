import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-prior-year-adjustments',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule],
  templateUrl: './prior-year-adjustments.component.html',
  styleUrls: ['./prior-year-adjustments.component.css']
})
export class PriorYearAdjustmentsComponent implements OnInit {

  activeTab: 'capture' | 'review' = 'capture';

  // --- Capture wizard ---
  captureStep: number = 1; // 1=search, 2=type, 3=values, 4=preview

  // Step 1
  searchId: string = '';
  searchDesc: string = '';
  searchResults = signal<any[]>([]);
  searchLoading = false;
  selectedAsset: any = null;
  private searchDebounce: any = null;

  // Step 2
  adjustmentTypes: any[] = [];
  selectedTypeCode: string = '';
  get selectedType(): any {
    for (var i = 0; i < this.adjustmentTypes.length; i++) {
      if (this.adjustmentTypes[i].code === this.selectedTypeCode) return this.adjustmentTypes[i];
    }
    return null;
  }

  // Step 3 — value inputs
  effectiveDate: string = '';
  newCostAmount: string = '';
  newValuationAmount: string = '';
  newRUL: string = '';
  newAcquisitionDate: string = '';
  newResidualValue: string = '';
  residualValueEffectiveDate: string = '';
  newImpairmentAmount: string = '';
  impairmentEffectiveDate: string = '';
  disposalDate: string = '';
  disposalReason: string = '';
  disposalProceeds: string = '';
  comments: string = '';

  // GL Coding — cascading dropdowns (shared fin year list)
  glFinYears: string[] = [];
  glFinYearsLoading = false;

  // Debit cascade
  drFinYear: string = '';
  drProjects: any[] = [];
  drProjectsLoading = false;
  selectedDrProjectId: string = '';
  drScoaItems: any[] = [];
  drScoaLoading = false;
  selectedDrScoaItemId: string = '';

  // Credit cascade
  crFinYear: string = '';
  crProjects: any[] = [];
  crProjectsLoading = false;
  selectedCrProjectId: string = '';
  crScoaItems: any[] = [];
  crScoaLoading = false;
  selectedCrScoaItemId: string = '';

  // Step 4 — preview
  calculating = false;
  submitting = false;
  calcResult: any = null;
  calcError: string = '';

  // Document upload (step 4)
  pendingId: number | null = null;   // ID returned by submit, needed for doc upload before approval
  captureDocFile: File | null = null;
  captureDocUploading = false;
  captureDocError: string = '';
  captureUploadedDocs: any[] = [];
  captureDocsLoading = false;

  // Export
  exporting = false;

  // --- Review tab ---
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
  reviewDocs: any[] = [];
  reviewDocsLoading = false;
  reviewDocUploading = false;
  reviewDocError: string = '';
  reviewDocFile: File | null = null;

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.api.getPriorYearAdjustmentTypes().subscribe({
      next: function(this: PriorYearAdjustmentsComponent, data: any[]) { this.adjustmentTypes = data; }.bind(this)
    });
    this.loadReviewList();
  }

  // ===== Step 1: Search =====
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
    this.api.searchAssetsForPriorYear(params).subscribe({
      next: function(this: PriorYearAdjustmentsComponent, data: any[]) {
        this.searchResults.set(data);
        this.searchLoading = false;
      }.bind(this),
      error: function(this: PriorYearAdjustmentsComponent) { this.searchLoading = false; }.bind(this)
    });
  }

  selectAsset(asset: any): void {
    this.selectedAsset = asset;
    this.captureStep = 2;
  }

  // ===== Step 2: Type selection =====
  selectType(code: string): void {
    this.selectedTypeCode = code;
    this.resetValues();
    this.captureStep = 3;
    this.loadGlFinYears();
  }

  // ===== GL Coding — cascade helpers =====
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

  // ===== Step 3: Values =====
  needsEffectiveDate(): boolean { return true; }
  needsNewCost(): boolean { return this.selectedTypeCode === 'COST' || this.selectedTypeCode === 'DEEMED_COST'; }
  needsNewValuation(): boolean { return this.selectedTypeCode === 'VALUATION'; }
  needsNewRUL(): boolean { return this.selectedTypeCode === 'VALUATION' || this.selectedTypeCode === 'DEEMED_COST'; }
  needsNewAcquisitionDate(): boolean { return this.selectedTypeCode === 'DATE' || this.selectedTypeCode === 'DEEMED_COST'; }
  needsNewResidual(): boolean { return this.selectedTypeCode === 'RESIDUAL' || this.selectedTypeCode === 'DEEMED_COST'; }
  needsResidualEffectiveDate(): boolean { return this.selectedTypeCode === 'RESIDUAL'; }
  needsImpairment(): boolean {
    return this.selectedTypeCode === 'IMP_COST' || this.selectedTypeCode === 'IMP_REVAL' ||
           this.selectedTypeCode === 'IMPREV_COST' || this.selectedTypeCode === 'IMPREV_REVAL';
  }
  needsImpairmentEffectiveDate(): boolean { return this.needsImpairment(); }
  needsDisposal(): boolean { return this.selectedTypeCode === 'DISP_COST' || this.selectedTypeCode === 'DISP_REVAL'; }

  isImpairmentReversal(): boolean {
    return this.selectedTypeCode === 'IMPREV_COST' || this.selectedTypeCode === 'IMPREV_REVAL';
  }

  canProceedToPreview(): boolean {
    if (!this.effectiveDate) return false;
    if (this.needsNewCost() && !this.newCostAmount) return false;
    if (this.needsNewValuation() && !this.newValuationAmount) return false;
    if (this.needsNewRUL() && !this.newRUL) return false;
    if (this.needsNewAcquisitionDate() && !this.newAcquisitionDate) return false;
    if (this.needsNewResidual() && this.selectedTypeCode === 'RESIDUAL' && !this.newResidualValue) return false;
    if (this.needsImpairment() && !this.newImpairmentAmount) return false;
    if (this.needsDisposal() && !this.disposalDate) return false;
    return true;
  }

  buildCalcBody(): any {
    var body: any = {
      adjustmentTypeCode: this.selectedTypeCode,
      assetRegisterItemId: this.selectedAsset.assetRegisterItem_ID,
      effectiveDate: this.effectiveDate || null
    };
    if (this.newCostAmount) body['newCostAmount'] = parseFloat(this.newCostAmount);
    if (this.newValuationAmount) body['newValuationAmount'] = parseFloat(this.newValuationAmount);
    if (this.newRUL) body['newRUL'] = parseFloat(this.newRUL);
    if (this.newAcquisitionDate) body['newAcquisitionDate'] = this.newAcquisitionDate;
    if (this.newResidualValue) body['newResidualValue'] = parseFloat(this.newResidualValue);
    if (this.residualValueEffectiveDate) body['residualValueEffectiveDate'] = this.residualValueEffectiveDate;
    if (this.newImpairmentAmount) body['newImpairmentAmount'] = parseFloat(this.newImpairmentAmount);
    if (this.impairmentEffectiveDate) body['impairmentEffectiveDate'] = this.impairmentEffectiveDate;
    if (this.disposalDate) body['disposalDate'] = this.disposalDate;
    if (this.disposalReason) body['disposalReason'] = this.disposalReason;
    if (this.disposalProceeds) body['disposalProceeds'] = parseFloat(this.disposalProceeds);
    return body;
  }

  calculate(): void {
    if (!this.canProceedToPreview()) return;
    this.calculating = true;
    this.calcResult = null;
    this.calcError = '';
    this.api.calculatePriorYearAdjustment(this.buildCalcBody()).subscribe({
      next: function(this: PriorYearAdjustmentsComponent, res: any) {
        this.calcResult = res;
        this.calculating = false;
        this.captureStep = 4;
      }.bind(this),
      error: function(this: PriorYearAdjustmentsComponent, err: any) {
        this.calcError = err.error?.error || 'Calculation failed';
        this.calculating = false;
      }.bind(this)
    });
  }

  canSubmit(): boolean {
    if (!this.calcResult) return false;
    if (this.submitting) return false;
    return true;
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.submitting = true;
    var self = this;
    var body: any = this.buildCalcBody();
    body['calculationResult'] = this.calcResult;
    if (this.selectedDrScoaItemId) body['drPlanProjectItemID'] = Number(this.selectedDrScoaItemId);
    if (this.selectedCrScoaItemId) body['crPlanProjectItemID'] = Number(this.selectedCrScoaItemId);
    if (this.comments) body['comments'] = this.comments;
    this.api.submitPriorYearAdjustment(body).subscribe({
      next: function(res: any) {
        var submittedId: number = res.id;
        if (self.captureDocFile) {
          self.api.uploadPriorYearDocument(submittedId, self.captureDocFile).subscribe({
            next: function() {
              self.submitting = false;
              self.snackBar.open('Adjustment submitted (ID: ' + submittedId + ') with supporting document. Awaiting approval.', 'OK', { duration: 7000 });
              self.resetCapture();
              self.loadReviewList();
            },
            error: function() {
              self.submitting = false;
              self.snackBar.open('Adjustment submitted (ID: ' + submittedId + ') but document upload failed. Upload via Review tab.', 'Close', { duration: 8000 });
              self.resetCapture();
              self.loadReviewList();
            }
          });
        } else {
          self.submitting = false;
          self.snackBar.open('Prior year adjustment submitted (ID: ' + submittedId + '). Awaiting approval.', 'OK', { duration: 6000 });
          self.resetCapture();
          self.loadReviewList();
        }
      },
      error: function(err: any) {
        self.submitting = false;
        self.snackBar.open(err.error?.error || 'Submit failed', 'OK', { duration: 6000 });
      }
    });
  }

  onCaptureDocSelect(event: Event): void {
    var input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.captureDocFile = input.files[0];
      this.captureDocError = '';
    }
  }

  clearCaptureDoc(): void {
    this.captureDocFile = null;
  }

  exportTransactions(id: number): void {
    this.api.exportPriorYearTransactions(id);
  }

  resetValues(): void {
    this.effectiveDate = '';
    this.newCostAmount = '';
    this.newValuationAmount = '';
    this.newRUL = '';
    this.newAcquisitionDate = '';
    this.newResidualValue = '';
    this.residualValueEffectiveDate = '';
    this.newImpairmentAmount = '';
    this.impairmentEffectiveDate = '';
    this.disposalDate = '';
    this.disposalReason = '';
    this.disposalProceeds = '';
    this.comments = '';
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
    this.calcResult = null;
    this.calcError = '';
    this.captureDocFile = null;
    this.captureDocError = '';
    this.captureUploadedDocs = [];
    this.pendingId = null;
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
    if (step <= 3) { this.calcResult = null; this.calcError = ''; }
    if (step <= 2) { this.selectedTypeCode = ''; this.resetValues(); }
    if (step <= 1) { this.selectedAsset = null; }
  }

  // ===== Review tab =====
  loadReviewList(): void {
    this.reviewLoading = true;
    var params: any = {};
    if (this.reviewFilter !== 'All') params['status'] = this.reviewFilter;
    this.api.getPriorYearAdjustments(params).subscribe({
      next: function(this: PriorYearAdjustmentsComponent, data: any[]) {
        this.reviewList.set(data);
        this.reviewLoading = false;
      }.bind(this),
      error: function(this: PriorYearAdjustmentsComponent) { this.reviewLoading = false; }.bind(this)
    });
  }

  selectReview(item: any): void {
    if (this.selectedReview?.priorYearAdjustment_ID === item.priorYearAdjustment_ID) return;
    this.selectedReview = item;
    this.reviewDetail = null;
    this.reviewDocs = [];
    this.reviewDocFile = null;
    this.reviewDocError = '';
    this.showApproveForm = false;
    this.showRejectForm = false;
    this.approveComments = '';
    this.rejectReason = '';
    this.reviewDetailLoading = true;
    var self = this;
    this.api.getPriorYearAdjustmentById(item.priorYearAdjustment_ID).subscribe({
      next: function(data: any) {
        self.reviewDetail = data;
        self.reviewDetailLoading = false;
      },
      error: function() { self.reviewDetailLoading = false; }
    });
    this.loadReviewDocs(item.priorYearAdjustment_ID);
  }

  loadReviewDocs(id: number): void {
    this.reviewDocsLoading = true;
    var self = this;
    this.api.getPriorYearDocuments(id).subscribe({
      next: function(data: any[]) { self.reviewDocs = data; self.reviewDocsLoading = false; },
      error: function() { self.reviewDocsLoading = false; }
    });
  }

  onReviewDocSelect(event: Event): void {
    var input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.reviewDocFile = input.files[0];
      this.reviewDocError = '';
    }
  }

  uploadReviewDoc(): void {
    if (!this.reviewDocFile || !this.selectedReview) return;
    this.reviewDocUploading = true;
    var self = this;
    var id: number = this.selectedReview.priorYearAdjustment_ID;
    this.api.uploadPriorYearDocument(id, this.reviewDocFile).subscribe({
      next: function() {
        self.reviewDocUploading = false;
        self.reviewDocFile = null;
        self.loadReviewDocs(id);
        self.snackBar.open('Document uploaded.', 'OK', { duration: 3000 });
      },
      error: function(err: any) {
        self.reviewDocUploading = false;
        self.reviewDocError = err.error?.error || 'Upload failed';
      }
    });
  }

  downloadReviewDoc(docId: number): void {
    if (!this.selectedReview) return;
    this.api.downloadPriorYearDocument(this.selectedReview.priorYearAdjustment_ID, docId);
  }

  approveRecord(): void {
    if (!this.selectedReview) return;
    this.approving = true;
    this.api.approvePriorYearAdjustment(this.selectedReview.priorYearAdjustment_ID, { comments: this.approveComments }).subscribe({
      next: function(this: PriorYearAdjustmentsComponent) {
        this.approving = false;
        this.snackBar.open('Adjustment approved and asset register updated.', 'OK', { duration: 5000 });
        this.selectedReview = null;
        this.reviewDetail = null;
        this.showApproveForm = false;
        this.loadReviewList();
      }.bind(this),
      error: function(this: PriorYearAdjustmentsComponent, err: any) {
        this.approving = false;
        this.snackBar.open(err.error?.error || 'Approval failed', 'OK', { duration: 6000 });
      }.bind(this)
    });
  }

  rejectRecord(): void {
    if (!this.selectedReview || !this.rejectReason.trim()) return;
    this.rejecting = true;
    this.api.rejectPriorYearAdjustment(this.selectedReview.priorYearAdjustment_ID, { rejectionReason: this.rejectReason }).subscribe({
      next: function(this: PriorYearAdjustmentsComponent) {
        this.rejecting = false;
        this.snackBar.open('Adjustment rejected.', 'OK', { duration: 4000 });
        this.selectedReview = null;
        this.reviewDetail = null;
        this.showRejectForm = false;
        this.loadReviewList();
      }.bind(this),
      error: function(this: PriorYearAdjustmentsComponent, err: any) {
        this.rejecting = false;
        this.snackBar.open(err.error?.error || 'Rejection failed', 'OK', { duration: 5000 });
      }.bind(this)
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

  hasNonZeroDelta(result: any): boolean {
    if (!result) return false;
    return !!(result.currentPeriod_CostDelta || result.currentPeriod_AccDepDelta ||
              result.currentPeriod_AccImpDelta || result.currentPeriod_RRDelta ||
              result.comparativePeriod_CostDelta || result.comparativePeriod_AccDepDelta ||
              result.priorPeriods_CostDelta || result.priorPeriods_AccDepDelta);
  }

  formatNum(v: any): string {
    if (v === null || v === undefined) return '—';
    var n = parseFloat(v);
    if (isNaN(n)) return '—';
    return n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  signClass(v: any): string {
    var n = parseFloat(v);
    if (isNaN(n) || n === 0) return '';
    return n > 0 ? 'delta-pos' : 'delta-neg';
  }
}
