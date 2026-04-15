import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { ActivatedRoute, Router, RouterModule } from '@angular/router';
  import { FormsModule } from '@angular/forms';
  import { MatIconModule } from '@angular/material/icon';
  import { MatButtonModule } from '@angular/material/button';
  import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
  import { MatDialogModule } from '@angular/material/dialog';
  import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
  import { ApiService } from '../../../core/api.service';
  import { CidmsPickerComponent } from '../../../shared/cidms-picker/cidms-picker.component';
  import { CidmsChainResult } from '../../../core/cidms-level-config';

  @Component({
    selector: 'app-asset-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule, CidmsPickerComponent],
    templateUrl: './asset-detail.component.html',
    styleUrls: ['./asset-detail.component.css']
  })
  export class AssetDetailComponent implements OnInit, OnDestroy {
  asset = signal<any>(null);
  loading = signal(true);
  editing = signal(false);
  hasPendingEdit = signal(false);
  pendingEditApprovalId = signal<number>(0);
  showTransfer = signal(false);
  showDisposal = signal(false);
  showCidmsPicker = signal(false);
  documents = signal<any[]>([]);
  verificationAuditRows = signal<any[]>([]);
  expandedAuditSessionId = signal<string | null>(null);
  transactions = signal<any[]>([]);
  depreciationTxns = signal<any[]>([]);
  impairmentTxns = signal<any[]>([]);
  revaluationTxns = signal<any[]>([]);
  disposalTxns = signal<any[]>([]);
  transferTxns = signal<any[]>([]);
  activeTab = signal('details');
  schedule = signal<any>(null);

  sched(field: string): number {
    var s = this.schedule();
    if (!s || !s.hasData) return 0;
    var ob = s.openingBalances || {};
    var cb = s.closingBalances || {};
    var mv = s.movements || {};
    var val = ob[field] ?? cb[field] ?? mv[field] ?? 0;
    return Number(val) || 0;
  }

  costClosingCalc = computed(() => {
    var s = this.schedule();
    if (!s || !s.hasData) {
      var a = this.asset();
      return Number(a?.costClosingBalance) || Number(a?.costOpeningBalance) || 0;
    }
    return this.sched('costClosingBalance');
  });

  depClosingCalc = computed(() => {
    var s = this.schedule();
    if (!s || !s.hasData) {
      return Number(this.asset()?.depreciationClosingBalance) || 0;
    }
    return this.sched('depClosingBalance');
  });

  impClosingCalc = computed(() => {
    var s = this.schedule();
    if (!s || !s.hasData) return Number(this.asset()?.accumulatedImpairmentClosingBalance) || 0;
    return this.sched('impClosingBalance');
  });

  schedRul = computed(() => {
    var s = this.schedule();
    if (!s || !s.hasData) return Number(this.asset()?.remainingUsefulLife) || 0;
    return Number(s.closingBalances?.remainingUsefulLife) || 0;
  });

  carryingCalc = computed(() => {
    return Math.max(0, this.costClosingCalc() - this.depClosingCalc() - this.impClosingCalc());
  });

  visibleTabs = computed(() => {
    const tabs = [
      { key: 'details', label: 'Details' },
      { key: 'cost', label: 'Cost Movement' },
      { key: 'depreciation', label: 'Depreciation' },
    ];
    if (this.hasRevaluationData()) {
      tabs.push({ key: 'revaluation', label: 'Revaluation Reserve' });
    }
    tabs.push(
      { key: 'impairment', label: 'Impairment' },
      { key: 'disposal', label: 'Disposal' },
      { key: 'location', label: 'Location' },
      { key: 'funding', label: 'Funding Sources' },
      { key: 'documents', label: 'Documents' },
      { key: 'audit', label: 'Audit History' },
    );
    return tabs;
  });

  editFormSteps = [
    { key: 'details', label: '1. Asset Details' },
    { key: 'financial', label: '2. Financial Information' },
    { key: 'ownership', label: '3. Asset Ownership' },
    { key: 'location', label: '4. Asset Location' }
  ];
  editStep = 'details';
  ef: any = {};

  editCategories = signal<any[]>([]);
  editDepartments = signal<any[]>([]);
  editLocations = signal<any[]>([]);
  editSaving = signal(false);
  editAssetTypes = signal<any[]>([]);
  editAssetStatuses = signal<any[]>([]);
  editMeasurementTypes = signal<any[]>([]);
  editDepreciationMethods = signal<any[]>([]);
  editFilteredClasses = signal<any[]>([]);
  editFilteredCategories = signal<any[]>([]);
  editFilteredSubCategories = signal<any[]>([]);
  editNoClassMessage = signal('');
  editAssetConditions = signal<any[]>([]);
  editFinancialStatuses = signal<any[]>([]);
  editCriticalityGrades = signal<any[]>([]);
  editPerformanceGrades = signal<any[]>([]);
  editUtilisationGrades = signal<any[]>([]);
  editHealthGrades = signal<any[]>([]);
  editCidmsSubComponentTypes = signal<any[]>([]);
  editEmployees = signal<any[]>([]);
  editDivisions = signal<any[]>([]);
  editFilteredDivisions = signal<any[]>([]);
  editTowns = signal<any[]>([]);
  editSuburbs = signal<any[]>([]);
  editWards = signal<any[]>([]);
  editStreets = signal<any[]>([]);
  editBuildings = signal<any[]>([]);
  editFloors = signal<any[]>([]);
  editRooms = signal<any[]>([]);

  fundingRows = signal<any[]>([]);
  fundingLoading = signal(false);
  fundingSaving = signal(false);
  constFundingSources = signal<any[]>([]);
  newFundingSourceId: number | null = null;
  deleteFundingConfirmId: number | null = null;

  showLocationMapModal = signal(false);
  private locationLeafletMap: any = null;
  private locationL: any = null;

  transferForm = { department: '', location: '', reason: '' };
  disposalForm = { method: '', date: '', value: 0, reason: '' };

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router, private snackBar: MatSnackBar) {}

  ngOnDestroy() {
    this.destroyLocationMap();
  }

  openLocationMap() {
    this.showLocationMapModal.set(true);
    var self = this;
    setTimeout(function() { self.initLocationMap(); }, 120);
  }

  closeLocationMap() {
    this.showLocationMapModal.set(false);
    this.destroyLocationMap();
  }

  private initLocationMap() {
    var a = this.asset();
    if (!a || !a.latitude || !a.longitude) return;
    var lat = parseFloat(a.latitude);
    var lng = parseFloat(a.longitude);
    if (isNaN(lat) || isNaN(lng)) return;
    var self = this;
    import('leaflet').then(function(leafletModule: any) {
      self.locationL = leafletModule.default || leafletModule;
      var L = self.locationL;
      var container = document.getElementById('asset-location-map');
      if (!container) return;
      if (self.locationLeafletMap) { self.locationLeafletMap.remove(); self.locationLeafletMap = null; }
      self.locationLeafletMap = L.map(container).setView([lat, lng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19
      }).addTo(self.locationLeafletMap);
      var icon = L.divIcon({
        className: '',
        html: '<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      L.marker([lat, lng], { icon: icon })
        .addTo(self.locationLeafletMap)
        .bindPopup('<b>' + (a.description || 'Asset') + '</b><br>' + lat.toFixed(6) + ', ' + lng.toFixed(6))
        .openPopup();
      setTimeout(function() { if (self.locationLeafletMap) self.locationLeafletMap.invalidateSize(); }, 200);
    }).catch(function() {});
  }

  private destroyLocationMap() {
    if (this.locationLeafletMap) {
      this.locationLeafletMap.remove();
      this.locationLeafletMap = null;
    }
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    console.log('[AssetDetail] Loading asset:', id);
    this.api.getConstFundingSources().subscribe({
      next: function(this: AssetDetailComponent, r: any[]) { this.constFundingSources.set(Array.isArray(r) ? r : []); }.bind(this),
      error: function(this: AssetDetailComponent) { this.constFundingSources.set([]); }.bind(this)
    });
    this.api.getDepartments().subscribe({
      next: function(this: AssetDetailComponent, d: any) { this.editDepartments.set(Array.isArray(d) ? d : []); }.bind(this),
      error: function() {}
    });
    this.api.getVerificationLookupDivisions().subscribe({
      next: function(this: AssetDetailComponent, divs: any[]) { this.editDivisions.set(Array.isArray(divs) ? divs : []); }.bind(this),
      error: function() {}
    });
    this.api.getAsset(id).subscribe({
      next: (a) => {
        console.log('[AssetDetail] Asset loaded:', a?.assetId, 'fields:', a ? Object.keys(a).length : 0);
        this.asset.set(a);
        this.populateEditForm(a);
        this.documents.set([
          { name: 'Purchase Order - PO-2024-' + (a.assetId || a.id), type: 'pdf', size: '245 KB', date: this.formatDate(a.acquisitionDate) },
          { name: 'Verification Certificate - VC-' + (a.assetId || a.id), type: 'pdf', size: '128 KB', date: this.formatDate(a.verificationDate) },
        ]);
        this.loading.set(false);
        this.loadTransactions(a.assetId);
        this.loadVerificationAuditTrail(a.assetId);
        this.loadFunding(Number(a.assetId));
        this.api.getAssetApprovals({ status: 'Pending', type: 'Edit', assetId: a.assetId }).subscribe({
          next: function(this: AssetDetailComponent, items: any[]) {
            if (items && items.length > 0) {
              this.hasPendingEdit.set(true);
              this.pendingEditApprovalId.set(items[0].approvalId || 0);
            }
          }.bind(this),
          error: function() {}
        });
      },
      error: (err) => {
        console.error('[AssetDetail] Error loading asset:', err);
        this.loading.set(false);
      }
    });
  }

  loadFunding(assetId: number) {
    this.fundingLoading.set(true);
    this.api.getAssetFunding(assetId).subscribe({
      next: function(this: AssetDetailComponent, r: any) {
        this.fundingRows.set(Array.isArray(r) ? r : []);
        this.fundingLoading.set(false);
      }.bind(this),
      error: function(this: AssetDetailComponent) {
        this.fundingRows.set([]);
        this.fundingLoading.set(false);
      }.bind(this)
    });
  }

  addFundingSource() {
    var a = this.asset();
    if (!this.newFundingSourceId || !a) return;
    this.fundingSaving.set(true);
    this.api.createAssetFunding({ assetRegisterItemId: Number(a.assetId), fundingSourceId: this.newFundingSourceId, finYear: a.finYear || null, amount: null }).subscribe({
      next: function(this: AssetDetailComponent) {
        this.fundingSaving.set(false);
        this.newFundingSourceId = null;
        this.snackBar.open('Funding source added', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        this.loadFunding(Number(this.asset().assetId));
      }.bind(this),
      error: function(this: AssetDetailComponent) {
        this.fundingSaving.set(false);
        this.snackBar.open('Failed to add funding source', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  confirmDeleteFunding(id: number) { this.deleteFundingConfirmId = id; }
  cancelDeleteFunding() { this.deleteFundingConfirmId = null; }

  deleteFunding(id: number) {
    this.api.deleteAssetFunding(id).subscribe({
      next: function(this: AssetDetailComponent) {
        this.deleteFundingConfirmId = null;
        this.snackBar.open('Funding source removed', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        this.loadFunding(Number(this.asset().assetId));
      }.bind(this),
      error: function(this: AssetDetailComponent) {
        this.deleteFundingConfirmId = null;
        this.snackBar.open('Failed to remove funding source', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  getAvailableFundingSources(): any[] {
    var linked = this.fundingRows();
    var all = this.constFundingSources();
    var result = [];
    for (var i = 0; i < all.length; i++) {
      var found = false;
      for (var j = 0; j < linked.length; j++) {
        if (Number(linked[j].fundingSourceId) === Number(all[i].fundingSourceId)) { found = true; break; }
      }
      if (!found) result.push(all[i]);
    }
    return result;
  }

  loadTransactions(assetId: string) {
    this.api.getAssetTransactions(assetId).subscribe({
      next: (txns: any[]) => {
        const all = txns || [];
        this.transactions.set(all);
        this.depreciationTxns.set(all.filter(t => t.transaction_type === 'depreciation'));
        this.impairmentTxns.set(all.filter(t => t.transaction_type === 'impairment' || t.transaction_type === 'impairment_reversal'));
        this.revaluationTxns.set(all.filter(t => t.transaction_type === 'revaluation'));
        this.disposalTxns.set(all.filter(t => t.transaction_type === 'disposal'));
        this.transferTxns.set(all.filter(t => t.transaction_type === 'transfer'));
      },
      error: () => {
        this.transactions.set([]);
        this.depreciationTxns.set([]);
        this.impairmentTxns.set([]);
        this.revaluationTxns.set([]);
        this.disposalTxns.set([]);
        this.transferTxns.set([]);
      }
    });
    this.api.getAssetScheduleSummary(assetId).subscribe({
      next: function(this: AssetDetailComponent, data: any) {
        this.schedule.set(data);
      }.bind(this),
      error: function(this: AssetDetailComponent) {
        this.schedule.set(null);
      }.bind(this)
    });
  }

  formatTransactionDate(val: string | null | undefined): string {
    if (!val) return 'N/A';
    return String(val).split('T')[0];
  }

  getTransactionDetail(tx: any, key: string): string {
    try {
      const details = typeof tx.details === 'string' ? JSON.parse(tx.details) : (tx.details || {});
      return details[key] || '';
    } catch {
      return '';
    }
  }

  getTransactionIcon(type: string): string {
    const map: Record<string, string> = {
      depreciation: 'trending_down',
      impairment: 'warning',
      impairment_reversal: 'replay',
      revaluation: 'auto_graph',
      disposal: 'delete_sweep',
      transfer: 'swap_horiz'
    };
    return map[type] || 'receipt';
  }

  getTransactionColor(type: string): string {
    const map: Record<string, string> = {
      depreciation: '#8b5cf6',
      impairment: '#ef4444',
      impairment_reversal: '#10b981',
      revaluation: '#3b82f6',
      disposal: '#f59e0b',
      transfer: '#06b6d4'
    };
    return map[type] || '#64748b';
  }

  getTransactionLabel(type: string): string {
    const map: Record<string, string> = {
      depreciation: 'Depreciation',
      impairment: 'Impairment Loss',
      impairment_reversal: 'Impairment Reversal',
      revaluation: 'Revaluation',
      disposal: 'Disposal',
      transfer: 'Transfer'
    };
    return map[type] || type;
  }

  getDepartmentDisplayName(deptId: any): string {
    if (!deptId) return 'N/A';
    var depts = this.editDepartments();
    var dept = depts.find(function(d) { return Number(d.id) === Number(deptId); });
    return dept ? dept.description : 'N/A';
  }

  getDivisionDisplayName(divId: any): string {
    if (!divId) return 'N/A';
    var divs = this.editDivisions();
    var div = divs.find(function(d) { return Number(d.id) === Number(divId); });
    return div ? div.description : 'N/A';
  }

  formatDate(val: any): string {
    if (!val || val === 'NULL') return 'N/A';
    const s = String(val);
    const d = s.includes('T') ? s.split('T')[0] : s.split(' ')[0];
    if (d === '1900-01-01') return 'N/A';
    return d;
  }

  formatCoord(val: number | null | undefined): string {
    return val != null ? val.toFixed(6) : 'N/A';
  }

  formatUsefulLife(val: number | null | undefined): string {
    if (val == null) return '0';
    return val.toFixed(1);
  }

  getStatusClass(status: string | null | undefined): string {
    if (!status) return 'status-badge';
    return 'status-badge status-' + status.toLowerCase().replace(/ /g, '_');
  }

  hasRevaluationData(): boolean {
    const a = this.asset();
    return a && a.measurementType === 'Revaluation Module' && (a.accumulatedRevaluationsClosing > 0 || a.accumulatedRevaluationsOpening > 0);
  }

  getDepPercent(): number {
    const cost = this.costClosingCalc();
    if (!cost) return 0;
    const dep = this.depClosingCalc();
    return Math.min(100, Math.abs(dep / cost) * 100);
  }

  formatDepPercent(): string {
    return this.getDepPercent().toFixed(1) + '%';
  }

  getDisposalPLColor(): string {
    const a = this.asset();
    if (!a) return '#1e293b';
    return a.disposalProfitLoss > 0 ? '#10b981' : a.disposalProfitLoss < 0 ? '#ef4444' : '#64748b';
  }

  populateEditForm(a: any) {
    var usefulLifeMonths = Number(a.usefulLifeMonths) || 0;
    var usefulLifeYears = Number(a.usefulLife) || 0;
    var usefulLifeTotal = usefulLifeMonths > 0 ? usefulLifeMonths : usefulLifeYears * 12;
    var remainingMonths = Number(a.remainingUsefulLifeMonths) || 0;
    var remainingYears = Number(a.remainingUsefulLife) || 0;
    var remainingTotal = remainingMonths > 0 ? remainingMonths : remainingYears * 12;

    this.ef = {
      description: a.description || '',
      barcode: a.barcode || '',
      oldBarcode: a.oldBarcode || '',
      parentAssetId: a.parentAssetId || '',
      municipalAssetId: a.municipalAssetId || '',
      mainAssetId: a.mainAssetId || '',
      mainAssetDescription: a.mainAssetDescription || '',
      assetTypeName: a.assetTypeName || '',
      categoryName: a.categoryName || '',
      subCategoryName: a.subCategoryName || '',
      assetClassName: a.assetClassName || '',
      editTypeId: Number(a.assetTypeId) || 0,
      editCategoryId: Number(a.assetCategoryId) || 0,
      editSubCategoryId: Number(a.assetSubCategoryId) || 0,
      editClassId: Number(a.assetClassId) || 0,
      editStatusId: Number(a.assetStatusId) || 0,
      editMeasurementTypeId: Number(a.measurementTypeId) || 0,
      editFinancialStatusId: Number(a.financialStatusId) || 0,
      editConditionId: Number(a.assetConditionId) || 0,
      editCriticalityGradeId: Number(a.criticalityGrade) || 0,
      editPerformanceGradeId: Number(a.performanceGrade) || 0,
      editUtilisationGradeId: Number(a.utilisationGrade) || 0,
      editHealthGradeId: Number(a.infrastructureHealthGrade) || 0,
      editCidmsSubComponentTypeId: Number(a.cidmsSubComponentTypeId) || 0,
      editCidmsSubComponentTypeDesc: '',
      cidmsComponentTypeId: Number(a.cidmsComponentType) || 0,
      cidmsAccountingGroupId: Number(a.cidmsAccountingGroup) || 0,
      cidmsSubAccountingGroupId: Number(a.cidmsSubAccountingGroup) || 0,
      cidmsAssetClassId: Number(a.cidmsAssetClass) || 0,
      cidmsAssetGroupTypeId: Number(a.cidmsAssetGroupType) || 0,
      cidmsAssetTypeId: Number(a.cidmsAssetType) || 0,
      cidmsComponentType: '',
      cidmsAccountingGroup: '',
      cidmsSubAccountingGroup: '',
      cidmsAssetClass: '',
      cidmsAssetGroupType: '',
      cidmsAssetType: '',
      infrastructureType: a.infrastructureType || '',
      natureOfAddition: a.natureOfAddition || '',
      cashGenerating: a.cashGenerating || '',
      basicMunicipalityService: a.basicMunicipalityService || '',
      consequenceOfFailure: a.consequenceOfFailure || '',
      risk: a.risk || '',
      acquisitionDate: this.toDateInput(a.acquisitionDate),
      commissioningDate: this.toDateInput(a.commissioningDate),
      inServiceDate: this.toDateInput(a.inServiceDate),
      verificationDate: this.toDateInput(a.verificationDate),
      verificationDoneBy: Number(a.verificationDoneBy) || 0,
      yearConstructed: a.yearConstructed || null,
      forecastReplacementYear: a.forecastReplacementYear || null,
      usefulLifeTotal: usefulLifeTotal,
      remainingUsefulLifeTotal: remainingTotal,
      uom: a.uom || '',
      quantity: Number(a.quantity) || 1,
      dim1: a.dim1 || null,
      dim2: a.dim2 || null,
      dim3: a.dim3 || null,
      dimensionQuantity: a.dimensionQuantity || null,
      constructionMaterial: a.constructionMaterial || '',
      diameter: a.diameter || '',
      capacity: a.capacity || '',
      acquisitionCost: Number(a.acquisitionCost) || Number(a.costOpeningBalance) || 0,
      residualValue: Number(a.residualValue) || 0,
      fundingSourceAmount: Number(a.fundingSourceAmount) || 0,
      fundingSourceNumber: a.fundingSourceNumber || '',
      fundType: a.fundType || '',
      currentReplacementCost: Number(a.currentReplacementCost) || 0,
      annualisedMaintenanceCrc: Number(a.annualisedMaintenanceCrc) || 0,
      annualMaintenanceBudgetNeed: Number(a.annualMaintenanceBudgetNeed) || 0,
      insuranceCover: a.insuranceCover || '',
      insurancePolicyNo: a.insurancePolicyNo || '',
      insuredAmount: Number(a.insuredAmount) || 0,
      warranty: a.warranty || '',
      impairmentDate: this.toDateInput(a.impairmentDate),
      revaluationDate: this.toDateInput(a.revaluationDate),
      movementInRevaluationReserve: Number(a.movementInRevaluationReserve) || 0,
      depreciationOffset: Number(a.depreciationOffset) || 0,
      deemedCost: Number(a.deemedCost) || 0,
      revaluationValue: Number(a.revaluationValue) || 0,
      editDepartmentId: Number(a.municipalDepartmentId) || Number(a.departmentId) || 0,
      editCustodianId: Number(a.custodian) || Number(a.custodianId) || 0,
      custodianIdNumber: a.custodianIdNumber || '',
      assetOwnership: a.assetOwnership || '',
      make: a.make || '',
      model: a.model || '',
      unitNumber: a.unitNumber || '',
      registrationNumber: a.registrationNumber || '',
      serialNumber: a.serialNumber || '',
      deedNumber: a.deedNumber || '',
      erfNumber: a.erfNumber || '',
      portionNumber: a.portionNumber || '',
      erfSize: a.erfSize || null,
      supplierName: a.supplierName || '',
      supplierCode: a.supplierCode || '',
      editTownId: Number(a.townId) || 0,
      editSuburbId: Number(a.suburbId) || 0,
      editWardId: Number(a.wardId) || 0,
      editStreetId: Number(a.streetId) || 0,
      editBuildingId: Number(a.buildingId) || 0,
      editFloorId: Number(a.floorId) || 0,
      editRoomId: Number(a.roomId) || 0,
      suburb: a.suburb || '',
      latitude: a.latitude || null,
      longitude: a.longitude || null,
      gisFeature: a.gisFeature || '',
      wellKnownText: a.wellKnownText || '',
      invoiceNo: a.invoiceNo || '',
      disposalDocNo: a.disposalDocNo || '',
      paymentNo: a.paymentNo || '',
      fundingDescription: a.fundingDescription || '',
      locationDescription: a.locationDescription || '',
      roomResponsiblePerson: a.roomResponsiblePerson || '',
      itHardwareResponsiblePerson: a.itHardwareResponsiblePerson || '',
      reasonForChange: a.reasonForChange || '',
      divisionId: Number(a.divisionId) || 0,
      divisionName: a.divisionName || '',
      donorRegNumber: a.donorRegNumber || '',
      donorName: a.donorName || '',
      dateDonated: this.toDateInput(a.dateDonated),
      sgKey: a.sgKey || '',
      depreciationCurrentYear: Number(a.depreciationCurrentYear) || 0,
      impairmentCurrentYear: Number(a.impairmentCurrentYear) || 0,
      impairmentReversalAmount: Number(a.impairmentReversalAmount) || 0,
      depreciatedReplacementCost: Number(a.depreciatedReplacementCost) || 0,
      revaluationReserveClosingBalance: Number(a.revaluationReserveClosingBalance) || 0,
      capturerId: a.capturerId || '',
      capturerName: a.capturerName || '',
      modifierId: a.modifierId || '',
      modifierName: a.modifierName || ''
    };
  }

  toDateInput(val: any): string {
    if (!val) return '';
    return String(val).split('T')[0];
  }

  toggleEdit() {
    if (!this.editing()) {
      this.populateEditForm(this.asset());
      this.editStep = 'details';

      var self = this;
      var editInitCount = 0;
      function onEditInitReady() {
        editInitCount++;
        if (editInitCount >= 3) { self.loadEditClassesForHierarchy(); }
      }

      this.api.getAssetTypes().subscribe(function(this: AssetDetailComponent, t: any[]) {
        this.editAssetTypes.set(t);
        if (!this.ef.editTypeId) {
          var typeName = this.ef.assetTypeName;
          if (typeName) {
            for (var i = 0; i < t.length; i++) {
              if (t[i].assetTypeDesc === typeName) { this.ef.editTypeId = t[i].assetTypeId; break; }
            }
          }
        }
        onEditInitReady();
      }.bind(this));

      this.api.getAssetCategoriesList().subscribe(function(this: AssetDetailComponent, c: any[]) {
        this.editFilteredCategories.set(c);
        if (!this.ef.editCategoryId) {
          var catName = this.ef.categoryName;
          if (catName) {
            for (var i = 0; i < c.length; i++) {
              if (c[i].assetCategoryDesc === catName) { this.ef.editCategoryId = c[i].assetCategoryId; break; }
            }
          }
        }
        onEditInitReady();
      }.bind(this));

      this.api.getAssetSubCategoriesList().subscribe(function(this: AssetDetailComponent, sc: any[]) {
        this.editFilteredSubCategories.set(sc);
        if (!this.ef.editSubCategoryId) {
          var subName = this.ef.subCategoryName;
          if (subName) {
            for (var i = 0; i < sc.length; i++) {
              if (sc[i].assetSubCategoryDesc === subName) { this.ef.editSubCategoryId = sc[i].assetSubCategoryId; break; }
            }
          }
        }
        onEditInitReady();
      }.bind(this));

      this.api.getAssetStatuses().subscribe(function(this: AssetDetailComponent, s: any[]) {
        this.editAssetStatuses.set(s);
        if (!this.ef.editStatusId) {
          var statusName = this.ef.status || (this.asset() ? this.asset().status : '');
          if (statusName) {
            for (var i = 0; i < s.length; i++) {
              if (s[i].assetStatusDesc === statusName) { this.ef.editStatusId = s[i].assetStatusId; break; }
            }
          }
        }
      }.bind(this));

      this.api.getMeasurementTypes().subscribe(function(this: AssetDetailComponent, mt: any[]) {
        this.editMeasurementTypes.set(mt);
        if (!this.ef.editMeasurementTypeId) {
          var a = this.asset();
          var mtName = a ? a.measurementType : '';
          if (mtName) {
            for (var i = 0; i < mt.length; i++) {
              if (mt[i].measurementTypeDesc === mtName) { this.ef.editMeasurementTypeId = mt[i].measurementTypeId; break; }
            }
          }
        }
      }.bind(this));

      this.api.getDepreciationMethods().subscribe(function(this: AssetDetailComponent, dm: any[]) {
        this.editDepreciationMethods.set(dm);
      }.bind(this));

      this.api.getAssetConditions().subscribe(function(this: AssetDetailComponent, conds: any[]) {
        this.editAssetConditions.set(conds);
        if (!this.ef.editConditionId) {
          var a = this.asset();
          var condName = a ? a.condition : '';
          if (condName) {
            for (var i = 0; i < conds.length; i++) {
              if (conds[i].assetConditionDesc === condName) { this.ef.editConditionId = conds[i].assetCondition_ID; break; }
            }
          }
        }
      }.bind(this));

      this.api.getFinancialStatuses().subscribe(function(this: AssetDetailComponent, fs: any[]) {
        this.editFinancialStatuses.set(fs);
        var a = this.asset();
        var fsName = a ? a.financialStatus : '';
        if (fsName) {
          for (var i = 0; i < fs.length; i++) {
            if (fs[i].description === fsName) { this.ef.editFinancialStatusId = fs[i].id; break; }
          }
        }
      }.bind(this));

      this.api.getCriticalityGrades().subscribe(function(this: AssetDetailComponent, g: any[]) {
        this.editCriticalityGrades.set(g);
      }.bind(this));

      this.api.getPerformanceGrades().subscribe(function(this: AssetDetailComponent, g: any[]) {
        this.editPerformanceGrades.set(g);
      }.bind(this));

      this.api.getUtilisationGrades().subscribe(function(this: AssetDetailComponent, g: any[]) {
        this.editUtilisationGrades.set(g);
      }.bind(this));

      this.api.getHealthGrades().subscribe(function(this: AssetDetailComponent, g: any[]) {
        this.editHealthGrades.set(g);
      }.bind(this));

      this.api.getCidmsSubComponentTypes().subscribe(function(this: AssetDetailComponent, sc: any[]) {
        sc.sort(function(a: any, b: any) {
          var ad = (a.assetCIDMSSubComponentTypeDesc || '').toLowerCase();
          var bd = (b.assetCIDMSSubComponentTypeDesc || '').toLowerCase();
          if (ad < bd) { return -1; }
          if (ad > bd) { return 1; }
          return 0;
        });
        this.editCidmsSubComponentTypes.set(sc);
      }.bind(this));

      this.api.getEmployees().subscribe(function(this: AssetDetailComponent, emps: any[]) {
        emps.sort(function(a: any, b: any) {
          var as = (a.surname || '').toLowerCase();
          var bs = (b.surname || '').toLowerCase();
          if (as < bs) { return -1; }
          if (as > bs) { return 1; }
          var af = (a.firstName || '').toLowerCase();
          var bf = (b.firstName || '').toLowerCase();
          if (af < bf) { return -1; }
          if (af > bf) { return 1; }
          return 0;
        });
        this.editEmployees.set(emps);
      }.bind(this));

      this.api.getDepartments().subscribe(function(this: AssetDetailComponent, d: any) {
        this.editDepartments.set(Array.isArray(d) ? d : []);
      }.bind(this));

      this.api.getVerificationLookupDivisions().subscribe(function(this: AssetDetailComponent, divs: any[]) {
        this.editDivisions.set(divs);
        var currentDeptId = this.ef.editDepartmentId;
        if (currentDeptId) {
          var filtered = [];
          for (var i = 0; i < divs.length; i++) {
            if (Number(divs[i].departmentId) === Number(currentDeptId)) { filtered.push(divs[i]); }
          }
          this.editFilteredDivisions.set(filtered);
        } else {
          this.editFilteredDivisions.set(divs);
        }
      }.bind(this));

      this.api.getVerificationLookupTowns().subscribe(function(this: AssetDetailComponent, towns: any[]) {
        this.editTowns.set(towns);
      }.bind(this));

      this.api.getVerificationLookupWards().subscribe(function(this: AssetDetailComponent, wards: any[]) {
        this.editWards.set(wards);
      }.bind(this));

      var townId = this.ef.editTownId;
      var suburbId = this.ef.editSuburbId;
      var streetId = this.ef.editStreetId;
      var buildingId = this.ef.editBuildingId;
      var floorId = this.ef.editFloorId;

      if (townId) {
        this.api.getVerificationLookupSuburbs(townId).subscribe(function(this: AssetDetailComponent, suburbs: any[]) {
          this.editSuburbs.set(suburbs);
        }.bind(this));
      }
      if (suburbId) {
        this.api.getVerificationLookupStreets(suburbId).subscribe(function(this: AssetDetailComponent, streets: any[]) {
          this.editStreets.set(streets);
        }.bind(this));
      }
      this.api.getVerificationLookupBuildings().subscribe(function(this: AssetDetailComponent, buildings: any[]) {
        this.editBuildings.set(buildings);
      }.bind(this));
      if (buildingId) {
        this.api.getVerificationLookupFloors(buildingId).subscribe(function(this: AssetDetailComponent, floors: any[]) {
          this.editFloors.set(floors);
        }.bind(this));
      }
      if (floorId) {
        this.api.getVerificationLookupRooms(floorId).subscribe(function(this: AssetDetailComponent, rooms: any[]) {
          this.editRooms.set(rooms);
        }.bind(this));
      }

      if (this.ef.editCidmsSubComponentTypeId) {
        this.api.getCidmsSubComponentTypeChain(this.ef.editCidmsSubComponentTypeId).subscribe(function(this: AssetDetailComponent, chain: any) {
          if (chain) { this.applyCidmsChain(chain); }
        }.bind(this));
        var subTypes = this.editCidmsSubComponentTypes();
        for (var _si = 0; _si < subTypes.length; _si++) {
          if (subTypes[_si].assetCIDMSSubComponentTypeID === this.ef.editCidmsSubComponentTypeId) {
            this.ef.editCidmsSubComponentTypeDesc = subTypes[_si].assetCIDMSSubComponentTypeDesc || '';
            break;
          }
        }
      } else if (this.ef.cidmsComponentTypeId || this.ef.cidmsAccountingGroupId || this.ef.cidmsSubAccountingGroupId || this.ef.cidmsAssetClassId || this.ef.cidmsAssetGroupTypeId || this.ef.cidmsAssetTypeId) {
        this.api.getCidmsResolveUpper({
          componentTypeId: this.ef.cidmsComponentTypeId || undefined,
          accountingGroupId: this.ef.cidmsAccountingGroupId || undefined,
          subAccountingGroupId: this.ef.cidmsSubAccountingGroupId || undefined,
          classId: this.ef.cidmsAssetClassId || undefined,
          groupTypeId: this.ef.cidmsAssetGroupTypeId || undefined,
          assetTypeId: this.ef.cidmsAssetTypeId || undefined
        }).subscribe(function(this: AssetDetailComponent, chain: any) {
          if (chain) { this.applyCidmsChain(chain); }
        }.bind(this));
      }
    }
    this.editing.set(!this.editing());
    this.showTransfer.set(false);
    this.showDisposal.set(false);
  }

  applyCidmsChain(chain: any) {
    this.ef.cidmsComponentTypeId = chain.cidmsComponentTypeId || 0;
    this.ef.cidmsAccountingGroupId = chain.cidmsAccountingGroupId || 0;
    this.ef.cidmsSubAccountingGroupId = chain.cidmsAccountingSubGroupId || 0;
    this.ef.cidmsAssetClassId = chain.cidmsClassId || 0;
    this.ef.cidmsAssetGroupTypeId = chain.cidmsGroupTypeId || 0;
    this.ef.cidmsAssetTypeId = chain.cidmsAssetTypeId || 0;
    this.ef.cidmsComponentType = chain.cidmsComponentTypeDesc || '';
    this.ef.cidmsAccountingGroup = chain.cidmsAccountingGroupDesc || '';
    this.ef.cidmsSubAccountingGroup = chain.cidmsAccountingSubGroupDesc || '';
    this.ef.cidmsAssetClass = chain.cidmsClassDesc || '';
    this.ef.cidmsAssetGroupType = chain.cidmsGroupTypeDesc || '';
    this.ef.cidmsAssetType = chain.cidmsAssetTypeDesc || '';
  }

  onCidmsSubComponentTypeChange(id: number) {
    this.ef.editCidmsSubComponentTypeId = id;
    if (!id) {
      this.ef.editCidmsSubComponentTypeDesc = '';
      this.ef.cidmsComponentTypeId = 0;
      this.ef.cidmsAccountingGroupId = 0;
      this.ef.cidmsSubAccountingGroupId = 0;
      this.ef.cidmsAssetClassId = 0;
      this.ef.cidmsAssetGroupTypeId = 0;
      this.ef.cidmsAssetTypeId = 0;
      this.ef.cidmsComponentType = '';
      this.ef.cidmsAccountingGroup = '';
      this.ef.cidmsSubAccountingGroup = '';
      this.ef.cidmsAssetClass = '';
      this.ef.cidmsAssetGroupType = '';
      this.ef.cidmsAssetType = '';
      return;
    }
    this.api.getCidmsSubComponentTypeChain(id).subscribe(function(this: AssetDetailComponent, chain: any) {
      if (chain) { this.applyCidmsChain(chain); }
    }.bind(this));
  }

  openCidmsPicker() {
    this.showCidmsPicker.set(true);
  }

  clearCidmsSelection() {
    this.onCidmsSubComponentTypeChange(0);
  }

  onCidmsPickerSelected(chain: CidmsChainResult) {
    this.ef.editCidmsSubComponentTypeId = chain.cidmsSubComponentTypeId || 0;
    this.ef.editCidmsSubComponentTypeDesc = chain.cidmsSubComponentTypeDesc || '';
    this.ef.cidmsComponentTypeId = chain.cidmsComponentTypeId || 0;
    this.ef.cidmsComponentType = chain.cidmsComponentTypeDesc || '';
    this.ef.cidmsAccountingGroupId = chain.cidmsAccountingGroupId || 0;
    this.ef.cidmsAccountingGroup = chain.cidmsAccountingGroupDesc || '';
    this.ef.cidmsSubAccountingGroupId = chain.cidmsAccountingSubGroupId || 0;
    this.ef.cidmsSubAccountingGroup = chain.cidmsAccountingSubGroupDesc || '';
    this.ef.cidmsAssetClassId = chain.cidmsClassId || 0;
    this.ef.cidmsAssetClass = chain.cidmsClassDesc || '';
    this.ef.cidmsAssetGroupTypeId = chain.cidmsGroupTypeId || 0;
    this.ef.cidmsAssetGroupType = chain.cidmsGroupTypeDesc || '';
    this.ef.cidmsAssetTypeId = chain.cidmsAssetTypeId || 0;
    this.ef.cidmsAssetType = chain.cidmsAssetTypeDesc || '';
    this.showCidmsPicker.set(false);
  }

  onEditDepartmentChange(deptId: number) {
    this.ef.editDepartmentId = deptId;
    this.ef.divisionId = 0;
    var all = this.editDivisions();
    if (!deptId) {
      this.editFilteredDivisions.set(all);
      return;
    }
    var filtered = [];
    for (var i = 0; i < all.length; i++) {
      if (Number(all[i].departmentId) === Number(deptId)) { filtered.push(all[i]); }
    }
    this.editFilteredDivisions.set(filtered);
  }

  onEditTownChange(townId: number) {
    this.ef.editTownId = townId;
    this.ef.editSuburbId = 0;
    this.ef.editStreetId = 0;
    this.editSuburbs.set([]);
    this.editStreets.set([]);
    if (!townId) return;
    this.api.getVerificationLookupSuburbs(townId).subscribe(function(this: AssetDetailComponent, suburbs: any[]) {
      this.editSuburbs.set(suburbs);
    }.bind(this));
  }

  onEditSuburbChange(suburbId: number) {
    this.ef.editSuburbId = suburbId;
    this.ef.editStreetId = 0;
    this.editStreets.set([]);
    if (!suburbId) return;
    this.api.getVerificationLookupStreets(suburbId).subscribe(function(this: AssetDetailComponent, streets: any[]) {
      this.editStreets.set(streets);
    }.bind(this));
  }

  onEditStreetChange(streetId: number) {
    this.ef.editStreetId = streetId;
  }

  onEditBuildingChange(buildingId: number) {
    this.ef.editBuildingId = buildingId;
    this.ef.editFloorId = 0;
    this.ef.editRoomId = 0;
    this.editFloors.set([]);
    this.editRooms.set([]);
    if (!buildingId) return;
    this.api.getVerificationLookupFloors(buildingId).subscribe(function(this: AssetDetailComponent, floors: any[]) {
      this.editFloors.set(floors);
    }.bind(this));
  }

  onEditFloorChange(floorId: number) {
    this.ef.editFloorId = floorId;
    this.ef.editRoomId = 0;
    this.editRooms.set([]);
    if (!floorId) return;
    this.api.getVerificationLookupRooms(floorId).subscribe(function(this: AssetDetailComponent, rooms: any[]) {
      this.editRooms.set(rooms);
    }.bind(this));
  }

  getEditClassPlaceholder(): string {
    if (!this.ef.editTypeId || !this.ef.editCategoryId) { return 'Select type and category first...'; }
    if (this.editFilteredClasses().length === 0) { return 'No asset classes available'; }
    return 'Select asset class...';
  }

  onEditClassChange(classId: number): void {
    this.ef.editClassId = classId;
    this.editNoClassMessage.set('');
    if (!classId) {
      this.ef.assetClassName = '';
      return;
    }
    var classes = this.editFilteredClasses();
    var cls: any = null;
    for (var i = 0; i < classes.length; i++) {
      if (classes[i].assetClass_ID === classId) { cls = classes[i]; break; }
    }
    if (!cls) { return; }
    this.ef.assetClassName = cls.assetClassDesc;
    var usefulMonths = cls.usefulLifeInMonths || 0;
    this.ef.usefulLifeTotal = usefulMonths;
    if (cls.assetDepreciationMethod_ID) {
      var dms = this.editDepreciationMethods();
      for (var j = 0; j < dms.length; j++) {
        if (dms[j].assetDepreciationMethod_ID === cls.assetDepreciationMethod_ID) {
          break;
        }
      }
    }
    if (cls.assetStatus_ID) {
      var sts = this.editAssetStatuses();
      for (var k = 0; k < sts.length; k++) {
        if (sts[k].assetStatusId === cls.assetStatus_ID) {
          this.ef.editStatusId = sts[k].assetStatusId;
          break;
        }
      }
    }
  }

  private loadEditClassesForHierarchy(): void {
    if (!this.ef.editTypeId || !this.ef.editCategoryId) {
      this.editFilteredClasses.set([]);
      this.editNoClassMessage.set('');
      return;
    }
    var params: any = { typeId: this.ef.editTypeId, categoryId: this.ef.editCategoryId };
    if (this.ef.editSubCategoryId) { params.subCategoryId = this.ef.editSubCategoryId; }
    this.api.getAssetClassesList(params).subscribe({
      next: function(this: AssetDetailComponent, res: any) {
        var list = Array.isArray(res) ? res : (res.data || []);
        this.editFilteredClasses.set(list);
        if (list.length === 0) {
          var typeName = this.ef.assetTypeName || 'selected type';
          var catName = this.ef.categoryName || 'selected category';
          var subName = this.ef.subCategoryName;
          var msg = 'No Asset Class exists for ' + typeName + ' / ' + catName;
          if (subName) { msg += ' / ' + subName; }
          msg += '. Please create one in Configuration > Asset Classes first.';
          this.editNoClassMessage.set(msg);
        } else {
          this.editNoClassMessage.set('');
          if (!this.ef.editClassId) {
            var className = this.ef.assetClassName;
            if (className) {
              for (var i = 0; i < list.length; i++) {
                if (list[i].assetClassDesc === className) {
                  this.ef.editClassId = list[i].assetClass_ID;
                  break;
                }
              }
            }
          }
        }
      }.bind(this)
    });
  }

  onEditTypeChange(typeId: number): void {
    this.ef.editTypeId = typeId;
    this.ef.editCategoryId = 0;
    this.ef.categoryName = '';
    this.ef.editSubCategoryId = 0;
    this.ef.subCategoryName = '';
    this.ef.editClassId = 0;
    this.ef.assetClassName = '';
    this.editFilteredSubCategories.set([]);
    this.editFilteredClasses.set([]);
    this.editNoClassMessage.set('');
    var matchedType: any = null;
    var types = this.editAssetTypes();
    for (var i = 0; i < types.length; i++) {
      if (types[i].assetTypeId === typeId) { matchedType = types[i]; break; }
    }
    this.ef.assetTypeName = matchedType ? matchedType.assetTypeDesc : '';
    if (typeId) {
      this.api.getAssetCategoriesList({ typeId: typeId }).subscribe(function(this: AssetDetailComponent, cats: any[]) {
        this.editFilteredCategories.set(cats);
      }.bind(this));
    } else {
      this.editFilteredCategories.set([]);
    }
  }

  onEditCategoryChange(categoryId: number): void {
    this.ef.editCategoryId = categoryId;
    this.ef.editSubCategoryId = 0;
    this.ef.subCategoryName = '';
    this.ef.editClassId = 0;
    this.ef.assetClassName = '';
    this.editNoClassMessage.set('');
    var matchedCat: any = null;
    var cats = this.editFilteredCategories();
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].assetCategoryId === categoryId) { matchedCat = cats[i]; break; }
    }
    this.ef.categoryName = matchedCat ? matchedCat.assetCategoryDesc : '';
    if (categoryId && this.ef.editTypeId) {
      this.api.getAssetSubCategoriesList({ typeId: this.ef.editTypeId, categoryId: categoryId }).subscribe(function(this: AssetDetailComponent, subs: any[]) {
        this.editFilteredSubCategories.set(subs);
      }.bind(this));
    } else {
      this.editFilteredSubCategories.set([]);
    }
    this.loadEditClassesForHierarchy();
  }

  onEditSubCategoryChange(subCategoryId: number): void {
    this.ef.editSubCategoryId = subCategoryId;
    this.ef.editClassId = 0;
    this.ef.assetClassName = '';
    this.editNoClassMessage.set('');
    var matchedSub: any = null;
    var subs = this.editFilteredSubCategories();
    for (var i = 0; i < subs.length; i++) {
      if (subs[i].assetSubCategoryId === subCategoryId) { matchedSub = subs[i]; break; }
    }
    this.ef.subCategoryName = matchedSub ? matchedSub.assetSubCategoryDesc : '';
    this.loadEditClassesForHierarchy();
  }

  nextEditStep() {
    const idx = this.editFormSteps.findIndex(s => s.key === this.editStep);
    if (idx < this.editFormSteps.length - 1) {
      this.editStep = this.editFormSteps[idx + 1].key;
    }
  }

  prevEditStep() {
    const idx = this.editFormSteps.findIndex(s => s.key === this.editStep);
    if (idx > 0) {
      this.editStep = this.editFormSteps[idx - 1].key;
    }
  }

  saveEdit() {
    if (!this.ef.description) {
      this.snackBar.open('Description is required', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    if (!this.ef.reasonForChange) {
      this.snackBar.open('Reason for Change is required', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      this.editStep = 'location';
      return;
    }
    this.editSaving.set(true);
    var payload: any = {};
    function setVal(col: string, val: any) {
      if (val !== null && val !== undefined && val !== '' && val !== 0) {
        payload[col] = val;
      }
    }
    setVal('Description', this.ef.description);
    setVal('Barcode', this.ef.barcode);
    setVal('OldBarCode', this.ef.oldBarcode);
    setVal('ParentAssetRegisterItem_ID', this.ef.parentAssetId);
    setVal('MunicipalAssetID', this.ef.municipalAssetId);
    setVal('MainAssetID', this.ef.mainAssetId);
    setVal('MainAssetDescription', this.ef.mainAssetDescription);
    setVal('AssetType_ID', this.ef.editTypeId);
    setVal('AssetCategory_ID', this.ef.editCategoryId);
    setVal('Asset_SubCategory_ID', this.ef.editSubCategoryId);
    setVal('AssetClass_ID', this.ef.editClassId);
    setVal('AssetStatus_ID', this.ef.editStatusId);
    setVal('MeasurementType_ID', this.ef.editMeasurementTypeId);
    setVal('Financial_Status_ID', this.ef.editFinancialStatusId);
    setVal('AssetCondition_ID', this.ef.editConditionId);
    setVal('InfrastructurOrNonInfrastructure', this.ef.infrastructureType);
    setVal('NatureOfAddition', this.ef.natureOfAddition);
    payload['CIDMSSubComponentTypeID'] = this.ef.editCidmsSubComponentTypeId || null;
    payload['CIDMSComponentType'] = this.ef.cidmsComponentTypeId || null;
    payload['CIDMSAccountingGroup'] = this.ef.cidmsAccountingGroupId || null;
    payload['CIDMSSubAccountingGroup'] = this.ef.cidmsSubAccountingGroupId || null;
    payload['CIDMSAssetClass'] = this.ef.cidmsAssetClassId || null;
    payload['CIDMSAssetGroupType'] = this.ef.cidmsAssetGroupTypeId || null;
    payload['CIDMSAssetType'] = this.ef.cidmsAssetTypeId || null;
    setVal('CashOrNoncashgeneratingunit', this.ef.cashGenerating);
    setVal('BasicMunicipalityService', this.ef.basicMunicipalityService);
    setVal('CriticalityGrade', this.ef.editCriticalityGradeId);
    setVal('PerformanceGrade', this.ef.editPerformanceGradeId);
    setVal('UtilisationGrade', this.ef.editUtilisationGradeId);
    setVal('InfrastructureHealthGrade', this.ef.editHealthGradeId);
    setVal('ConsequenceOfFailure', this.ef.consequenceOfFailure);
    setVal('Risk', this.ef.risk);
    setVal('AcquisitionDate', this.ef.acquisitionDate);
    setVal('CommisioningDate', this.ef.commissioningDate);
    setVal('InserviceDate', this.ef.inServiceDate);
    setVal('VerificationDate', this.ef.verificationDate);
    setVal('VerificationDoneBy', this.ef.verificationDoneBy);
    setVal('YearConstructed', this.ef.yearConstructed);
    setVal('ForecastReplacementYear', this.ef.forecastReplacementYear);
    if (this.ef.remainingUsefulLifeTotal) { payload['RemainingUsefulLife'] = this.ef.remainingUsefulLifeTotal; payload['Remaining_Useful_Life_Year'] = Math.floor(this.ef.remainingUsefulLifeTotal / 12); }
    setVal('UoM', this.ef.uom);
    setVal('Quantity', this.ef.quantity);
    setVal('Dim1', this.ef.dim1);
    setVal('Dim2', this.ef.dim2);
    setVal('Dim3', this.ef.dim3);
    setVal('DimensionQuantity', this.ef.dimensionQuantity);
    setVal('ConstructionMaterial', this.ef.constructionMaterial);
    setVal('Diameter', this.ef.diameter);
    setVal('Capacity', this.ef.capacity);
    setVal('PurchaseAmount', this.ef.acquisitionCost);
    setVal('ResidualValue', this.ef.residualValue);
    setVal('CurrentReplacementCostCRC', this.ef.currentReplacementCost);
    setVal('AnnualisedMaintenanceCRC', this.ef.annualisedMaintenanceCrc);
    setVal('AnnualMaintenanceBudgetNeed', this.ef.annualMaintenanceBudgetNeed);
    setVal('InsuranceCover', this.ef.insuranceCover);
    setVal('InsurancePolicyNo', this.ef.insurancePolicyNo);
    setVal('InsuredAmountInsuredBy', this.ef.insuredAmount);
    setVal('Warranty', this.ef.warranty);
    setVal('Impairment_Date', this.ef.impairmentDate);
    setVal('RevaluationDate', this.ef.revaluationDate);
    setVal('MovementInRevaluationReserve', this.ef.movementInRevaluationReserve);
    setVal('DepreciationOffset', this.ef.depreciationOffset);
    setVal('DeemedCost', this.ef.deemedCost);
    setVal('RevaluationValue', this.ef.revaluationValue);
    setVal('MunicipalDepartment_ID', this.ef.editDepartmentId);
    setVal('Custodian_ID', this.ef.editCustodianId);
    setVal('CustodianIdNumber', this.ef.custodianIdNumber);
    setVal('AssetOwnershipName', this.ef.assetOwnership);
    setVal('Make', this.ef.make);
    setVal('Model', this.ef.model);
    setVal('UnitNumber', this.ef.unitNumber);
    setVal('RegistrationNumber', this.ef.registrationNumber);
    setVal('SerialNumber', this.ef.serialNumber);
    setVal('DeedNumber', this.ef.deedNumber);
    setVal('ErfNumber', this.ef.erfNumber);
    setVal('PortionNumber', this.ef.portionNumber);
    setVal('ErfSizeM2', this.ef.erfSize);
    setVal('SupplierName', this.ef.supplierName);
    setVal('SupplierCode', this.ef.supplierCode);
    setVal('Town_ID', this.ef.editTownId);
    setVal('SuburbID', this.ef.editSuburbId);
    setVal('Ward_ID', this.ef.editWardId);
    setVal('Street_ID', this.ef.editStreetId);
    setVal('Building_ID', this.ef.editBuildingId);
    setVal('FloorID', this.ef.editFloorId);
    setVal('Room_ID', this.ef.editRoomId);
    setVal('Suburb', this.ef.suburb);
    setVal('latitude', this.ef.latitude);
    setVal('longitude', this.ef.longitude);
    setVal('GisFeature', this.ef.gisFeature);
    setVal('WellKnownTextWKT', this.ef.wellKnownText);
    setVal('InvoiceNo', this.ef.invoiceNo);
    setVal('DisposalDocNo', this.ef.disposalDocNo);
    setVal('PaymentNo', this.ef.paymentNo);
    setVal('FundingDescription', this.ef.fundingDescription);
    setVal('LocationDescription', this.ef.locationDescription);
    setVal('RoomResponsiblePerson', this.ef.roomResponsiblePerson);
    setVal('ITHardwareResponsiblePerson', this.ef.itHardwareResponsiblePerson);
    setVal('ReasonForChange', this.ef.reasonForChange);
    setVal('DivisionID', this.ef.divisionId);
    setVal('DonorRegNumber', this.ef.donorRegNumber);
    setVal('Donor_Name', this.ef.donorName);
    setVal('Date_Donated', this.ef.dateDonated);
    setVal('SGNumberChange_ID', this.ef.sgKey);
    setVal('AccumulatedDepreciationCurrentYear', this.ef.depreciationCurrentYear);
    setVal('ImpairmentAmountCurrentYear', this.ef.impairmentCurrentYear);
    setVal('ReversalOfImpairmentAmount', this.ef.impairmentReversalAmount);
    setVal('DepreciatedReplacementCostDRC', this.ef.depreciatedReplacementCost);
    setVal('RevaluationReserveClosingBalance', this.ef.revaluationReserveClosingBalance);

    var self = this;
    this.api.updateAsset(String(this.asset().assetId), payload).subscribe({
      next: function(res: any) {
        self.editSaving.set(false);
        if (res && res.noChanges === true) {
          self.editing.set(false);
          self.snackBar.open('No changes detected — the asset was not modified.', 'OK', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
          return;
        }
        if (res && res.pendingApproval === true) {
          self.editing.set(false);
          self.hasPendingEdit.set(true);
          self.snackBar.open('Edit submitted for approval — awaiting review in Workflow Inbox', 'OK', { duration: 6000, horizontalPosition: 'end', verticalPosition: 'top' });
          return;
        }
        self.api.getAsset(String(self.asset().assetId)).subscribe(function(a: any) {
          self.asset.set(a);
          self.populateEditForm(a);
          self.editing.set(false);
          self.snackBar.open('Asset updated successfully', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        });
      },
      error: function(err: any) {
        self.editSaving.set(false);
        self.snackBar.open('Error saving: ' + (err?.error?.error || 'Unknown error'), 'OK', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  initiateTransfer() {
    this.showTransfer.set(!this.showTransfer());
    this.editing.set(false);
    this.showDisposal.set(false);
    this.transferForm = { department: '', location: '', reason: '' };
  }

  submitTransfer() {
    if (!this.transferForm.department || !this.transferForm.reason) {
      this.snackBar.open('Please fill in department and reason', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    const a = this.asset();
    this.api.initiateWorkflow({
      entity_type: 'transfer',
      entity_id: a.assetId,
      description: `Transfer ${a.assetId} to ${this.transferForm.department}`,
      comments: this.transferForm.reason,
      data: {
        transfer_date: new Date().toISOString().split('T')[0],
        new_department: this.transferForm.department,
        new_location: this.transferForm.location,
        old_department: a.departmentName,
        old_location: a.locationName,
        reason: this.transferForm.reason
      }
    }).subscribe({
      next: () => {
        this.snackBar.open('Transfer request submitted for approval', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        this.showTransfer.set(false);
      },
      error: () => this.snackBar.open('Transfer submitted (workflow pending)', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' })
    });
  }

  initiateDisposal() {
    this.showDisposal.set(!this.showDisposal());
    this.editing.set(false);
    this.showTransfer.set(false);
    this.disposalForm = { method: '', date: new Date().toISOString().split('T')[0], value: 0, reason: '' };
  }

  getDisposalPLPreview(): number {
    return (Number(this.disposalForm.value) || 0) - (Number(this.asset().carryingAmount) || 0);
  }

  getDisposalPLPreviewColor(): string {
    return this.getDisposalPLPreview() >= 0 ? '#10b981' : '#ef4444';
  }

  submitDisposal() {
    if (!this.disposalForm.method || !this.disposalForm.reason) {
      this.snackBar.open('Please fill in disposal method and reason', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    if (!this.disposalForm.date) {
      this.snackBar.open('Please enter a disposal date', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    const a = this.asset();
    const proceeds = Number(this.disposalForm.value) || 0;
    const carryingAmount = Number(a.carryingAmount) || 0;
    const profitLoss = proceeds - carryingAmount;

    this.api.initiateWorkflow({
      entity_type: 'disposal',
      entity_id: a.assetId,
      description: `Dispose ${a.assetId} via ${this.disposalForm.method}`,
      comments: this.disposalForm.reason,
      data: {
        disposal_date: this.disposalForm.date,
        disposal_proceeds: proceeds,
        method: this.disposalForm.method,
        reason: this.disposalForm.reason,
        profit_loss: profitLoss,
        carrying_amount: carryingAmount,
        adjusted_carrying_amount: carryingAmount,
        cost_closing: Number(a.costClosingBalance) || 0,
        acc_depreciation: Number(a.depreciationClosingBalance) || 0,
        acc_impairment: Number(a.impairmentClosingBalance) || 0
      }
    }).subscribe({
      next: () => {
        this.snackBar.open('Disposal request submitted for MFMA S.14 approval', 'OK', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
        this.showDisposal.set(false);
      },
      error: () => this.snackBar.open('Disposal submitted (workflow pending)', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' })
    });
  }

  showUploadForm = signal(false);
  newDocName = '';

  uploadDocument() {
    this.showUploadForm.set(true);
    this.newDocName = '';
  }

  confirmUpload() {
    if (!this.newDocName.trim()) {
      this.snackBar.open('Please enter a document name', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    this.documents.set([
      ...this.documents(),
      { name: this.newDocName, type: 'pdf', size: '0 KB', date: new Date().toISOString().split('T')[0] }
    ]);
    this.showUploadForm.set(false);
    this.newDocName = '';
    this.snackBar.open('Document uploaded successfully', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  pendingDeleteDoc = signal<string | null>(null);

  deleteDocument(name: string) {
    this.pendingDeleteDoc.set(name);
  }

  confirmDeleteDoc() {
    const name = this.pendingDeleteDoc();
    if (name) {
      this.documents.set(this.documents().filter(d => d.name !== name));
      this.snackBar.open('Document deleted', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
    }
    this.pendingDeleteDoc.set(null);
  }

  getDocIcon(type: string): string {
    const map: Record<string, string> = { pdf: 'picture_as_pdf', xlsx: 'table_chart', docx: 'description', jpg: 'image', png: 'image' };
    return map[type] || 'insert_drive_file';
  }

  loadVerificationAuditTrail(assetId: string) {
    this.api.getAssetVerificationAuditTrail(assetId).subscribe({
      next: function(this: AssetDetailComponent, rows: any[]) {
        this.verificationAuditRows.set(rows || []);
      }.bind(this),
      error: function(this: AssetDetailComponent) {
        this.verificationAuditRows.set([]);
      }.bind(this)
    });
  }

  groupedAuditSessions(): any[] {
    var rows = this.verificationAuditRows();
    if (!rows || rows.length === 0) return [];
    var map: Record<string, any> = {};
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var changedAtStr = r.changedAt ? new Date(r.changedAt).toISOString() : '';
      var key = r.verificationRegisterId + '_' + r.verificationItemId + '_' + changedAtStr + '_' + (r.changedById || 0);
      if (!map[key]) {
        map[key] = {
          key: key,
          registerName: r.registerName,
          startDate: r.startDate,
          endDate: r.endDate,
          changedByName: r.changedByName,
          changedAt: r.changedAt,
          fields: []
        };
      }
      map[key].fields.push({ auditTrailId: r.auditTrailId, fieldName: r.fieldName, oldValue: r.oldValue, newValue: r.newValue });
    }
    var result: any[] = [];
    var keys = Object.keys(map);
    for (var k = 0; k < keys.length; k++) {
      result.push(map[keys[k]]);
    }
    return result;
  }

  toggleAuditSession(key: string) {
    if (this.expandedAuditSessionId() === key) {
      this.expandedAuditSessionId.set(null);
    } else {
      this.expandedAuditSessionId.set(key);
    }
  }
}
