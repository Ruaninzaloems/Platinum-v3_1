import { Component, OnInit, signal, computed } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { Router, RouterModule } from '@angular/router';
  import { FormsModule } from '@angular/forms';
  import { MatIconModule } from '@angular/material/icon';
  import { MatButtonModule } from '@angular/material/button';
  import { MatFormFieldModule } from '@angular/material/form-field';
  import { MatInputModule } from '@angular/material/input';
  import { MatSelectModule } from '@angular/material/select';
  import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
  import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
  import { ApiService } from '../../../core/api.service';
  import { OrgSettingsService } from '../../../core/org-settings.service';
  import { CidmsPickerComponent } from '../../../shared/cidms-picker/cidms-picker.component';
  import { CidmsChainResult } from '../../../core/cidms-level-config';
  import * as XLSX from 'xlsx';

  @Component({
    selector: 'app-asset-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule, CidmsPickerComponent],
    templateUrl: './asset-list.component.html',
    styleUrls: ['./asset-list.component.css']
  })
  export class AssetListComponent implements OnInit {
  assets = signal<any[]>([]);
  departments = signal<any[]>([]);
  locations = signal<any[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  totalPages = signal(1);
  pageSize = 20;
  search = '';
  statusFilter = '';
  filterTypeId = 0;
  filterCategoryId = 0;
  filterSubCategoryId = 0;
  filterCategories = signal<any[]>([]);
  filterSubCategories = signal<any[]>([]);
  showNewAssetForm = false;
  formStep = 'details';

  assetTypes = signal<any[]>([]);
  allCategories = signal<any[]>([]);
  allSubCategories = signal<any[]>([]);
  assetStatuses = signal<any[]>([]);
  measurementTypes = signal<any[]>([]);
  depreciationMethods = signal<any[]>([]);
  filteredClasses = signal<any[]>([]);
  filteredCategories = signal<any[]>([]);
  filteredSubCategories = signal<any[]>([]);
  noClassMessage = signal('');

  newTowns = signal<any[]>([]);
  newSuburbs = signal<any[]>([]);
  newWards = signal<any[]>([]);
  newStreets = signal<any[]>([]);
  newBuildings = signal<any[]>([]);
  newFloors = signal<any[]>([]);
  newRooms = signal<any[]>([]);
  showNewCidmsPicker = signal(false);
  newEmployees = signal<any[]>([]);
  newDivisions = signal<any[]>([]);
  unitOfIssues = signal<any[]>([]);
  newFilteredDivisions = signal<any[]>([]);

  createConstFundingSources = signal<any[]>([]);
  createStagedFundingRows: any[] = [];
  createNewFundingSourceId: number | null = null;
  createNewFundingAmount: number | null = null;

  formSteps = [
    { key: 'details', label: '1. Asset Details' },
    { key: 'financial', label: '2. Financial & Dates' },
    { key: 'ownership', label: '3. Ownership & ID' },
    { key: 'location', label: '4. Location & Property' }
  ];

  na: any = this.getEmptyAsset();

  showingFrom = computed(function(this: AssetListComponent) { return ((this.page() - 1) * this.pageSize) + 1; }.bind(this));
  showingTo = computed(function(this: AssetListComponent) { return Math.min(this.page() * this.pageSize, this.total()); }.bind(this));

  constructor(private api: ApiService, private snackBar: MatSnackBar, private router: Router, public orgSettings: OrgSettingsService) {}

  getEmptyAsset(): any {
    return {
      description: '', assetClassName: '', assetClassId: 0, assetTypeName: '', categoryName: '', subCategoryName: '',
      typeId: 0, categoryId: 0, subCategoryId: 0,
      measurementType: '', measurementTypeId: 0, status: '', assetStatusId: 0, financialStatus: '', parentAssetId: '',
      cidmsSubComponentTypeId: 0, cidmsComponentType: '', cidmsAccountingGroup: '',
      cidmsSubAccountingGroup: '', cidmsAssetClass: '', cidmsAssetGroupType: '', cidmsAssetType: '',
      cidmsComponentTypeId: 0, cidmsAccountingGroupId: 0, cidmsSubAccountingGroupId: 0,
      cidmsClassId: 0, cidmsGroupTypeId: 0, cidmsAssetTypeId: 0,
      infrastructureType: '', cashGenerating: '', barcode: '', oldBarcode: '',
      municipalAssetId: '', mainAssetId: '', mainAssetDescription: '',
      basicMunicipalityService: 0, consequenceOfFailure: '', risk: 0,
      natureOfAddition: '', criticalityGrade: 0, performanceGrade: 0, utilisationGrade: 0,
      infrastructureHealthGrade: 0,
      acquisitionCost: 0, residualValue: 0, fundingSourceAmount: 0, fundingSourceNumber: '', fundType: '',
      currentReplacementCost: 0, annualisedMaintenanceCrc: 0, annualMaintenanceBudgetNeed: 0,
      depreciatedReplacementCost: 0, revaluationReserveClosingBalance: 0,
      movementInRevaluationReserve: 0, revaluationDate: '', revaluationValue: 0,
      impairmentDate: '', depreciationOffset: 0, deemedCost: 0,
      depreciationCurrentYear: 0, impairmentCurrentYear: 0, impairmentReversalAmount: 0,
      depreciationMethod: '', usefulLifeMonths: 0, remainingUsefulLifeMonths: 0,
      condition: 'Good', acquisitionDate: '', commissioningDate: '', inServiceDate: '',
      verificationDate: '', verificationDoneById: 0, yearConstructed: null, forecastReplacementYear: null,
      departmentId: 0, divisionId: 0, custodianId: 0, custodianIdNumber: '', assetOwnership: '',
      supplierName: '', supplierCode: '',
      insuranceCover: '', insurancePolicyNo: '', insuredAmount: 0, warranty: '',
      serialNumber: '', registrationNumber: '', unitNumber: '', make: '', model: '',
      constructionMaterial: '', diameter: '', capacity: '',
      uomId: 0, uom: '', quantity: 1, dim1: null, dim2: null, dim3: null, dimensionQuantity: null,
      townId: 0, suburbId: 0, wardId: 0, streetId: 0, buildingId: 0, floorId: 0, roomId: 0,
      latitude: null, longitude: null, gisFeature: '', wellKnownText: '',
      sgKey: '', deedNumber: '', erfNumber: '', portionNumber: '', erfSize: null,
      locationDescription: '', roomResponsiblePerson: '', itHardwareResponsiblePerson: '',
      fundingDescription: '', invoiceNo: '', paymentNo: '',
      donorName: '', donorRegNumber: '', dateDonated: ''
    };
  }

  getClassPlaceholder(): string {
    if (!this.na.typeId || !this.na.categoryId) { return 'Select type and category first...'; }
    if (this.filteredClasses().length === 0) { return 'No asset classes available'; }
    return 'Select asset class...';
  }

  onClassChange(classId: number): void {
    this.na.assetClassId = classId;
    this.noClassMessage.set('');
    if (!classId) {
      this.na.assetClassName = '';
      return;
    }
    var classes = this.filteredClasses();
    var cls: any = null;
    for (var i = 0; i < classes.length; i++) {
      if (classes[i].assetClass_ID === classId) { cls = classes[i]; break; }
    }
    if (!cls) { return; }

    this.na.assetClassName = cls.assetClassDesc;

    var usefulMonths = cls.usefulLifeInMonths || 0;
    this.na.usefulLifeMonths = usefulMonths;
    this.na.remainingUsefulLifeMonths = usefulMonths;

    if (cls.assetDepreciationMethod_ID) {
      var dms = this.depreciationMethods();
      for (var j = 0; j < dms.length; j++) {
        if (dms[j].assetDepreciationMethod_ID === cls.assetDepreciationMethod_ID) {
          this.na.depreciationMethod = dms[j].assetDepreciationMethodDesc;
          break;
        }
      }
    }

    if (cls.assetStatus_ID) {
      this.na.assetStatusId = cls.assetStatus_ID;
      var sts = this.assetStatuses();
      for (var k = 0; k < sts.length; k++) {
        if (sts[k].assetStatusId === cls.assetStatus_ID) {
          this.na.status = sts[k].assetStatusDesc;
          break;
        }
      }
    }
  }

  private loadClassesForHierarchy(): void {
    if (!this.na.typeId || !this.na.categoryId) {
      this.filteredClasses.set([]);
      this.noClassMessage.set('');
      return;
    }
    var params: any = { typeId: this.na.typeId, categoryId: this.na.categoryId };
    if (this.na.subCategoryId) { params.subCategoryId = this.na.subCategoryId; }
    this.api.getAssetClassesList(params).subscribe({
      next: function(this: AssetListComponent, res: any) {
        var list = Array.isArray(res) ? res : (res.data || []);
        this.filteredClasses.set(list);
        if (list.length === 0) {
          var typeName = this.na.assetTypeName || 'selected type';
          var catName = this.na.categoryName || 'selected category';
          var subName = this.na.subCategoryName;
          var msg = 'No Asset Class exists for ' + typeName + ' / ' + catName;
          if (subName) { msg += ' / ' + subName; }
          msg += '. Please create one in Configuration > Asset Classes before registering this asset.';
          this.noClassMessage.set(msg);
        } else {
          this.noClassMessage.set('');
        }
      }.bind(this)
    });
  }

  onTypeChange(typeId: number): void {
    this.na.typeId = typeId;
    this.na.categoryId = 0;
    this.na.categoryName = '';
    this.na.subCategoryId = 0;
    this.na.subCategoryName = '';
    this.na.assetClassId = 0;
    this.na.assetClassName = '';
    this.filteredSubCategories.set([]);
    this.filteredClasses.set([]);
    this.noClassMessage.set('');
    var matchedType: any = null;
    var types = this.assetTypes();
    for (var i = 0; i < types.length; i++) {
      if (types[i].assetTypeId === typeId) { matchedType = types[i]; break; }
    }
    this.na.assetTypeName = matchedType ? matchedType.assetTypeDesc : '';
    if (typeId) {
      this.loadCategoriesForType(typeId);
    } else {
      this.filteredCategories.set([]);
    }
  }

  onCategoryChange(categoryId: number): void {
    this.na.categoryId = categoryId;
    this.na.subCategoryId = 0;
    this.na.subCategoryName = '';
    this.na.assetClassId = 0;
    this.na.assetClassName = '';
    this.noClassMessage.set('');
    var matchedCat: any = null;
    var cats = this.allCategories();
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].assetCategoryId === categoryId) { matchedCat = cats[i]; break; }
    }
    this.na.categoryName = matchedCat ? matchedCat.assetCategoryDesc : '';
    if (categoryId && this.na.typeId) {
      this.loadSubCategoriesForCategory(this.na.typeId, categoryId);
    } else {
      this.filteredSubCategories.set([]);
    }
    this.loadClassesForHierarchy();
  }

  onSubCategoryChange(subCategoryId: number): void {
    this.na.subCategoryId = subCategoryId;
    this.na.assetClassId = 0;
    this.na.assetClassName = '';
    this.noClassMessage.set('');
    var matchedSub: any = null;
    var subs = this.filteredSubCategories();
    for (var i = 0; i < subs.length; i++) {
      if (subs[i].assetSubCategoryId === subCategoryId) { matchedSub = subs[i]; break; }
    }
    this.na.subCategoryName = matchedSub ? matchedSub.assetSubCategoryDesc : '';
    this.loadClassesForHierarchy();
  }

  private loadCategoriesForType(typeId: number): void {
    this.api.getAssetCategoriesList({ typeId: typeId }).subscribe({
      next: function(this: AssetListComponent, cats: any[]) {
        this.filteredCategories.set(cats);
      }.bind(this)
    });
  }

  private loadSubCategoriesForCategory(typeId: number, categoryId: number): void {
    this.api.getAssetSubCategoriesList({ typeId: typeId, categoryId: categoryId }).subscribe({
      next: function(this: AssetListComponent, subs: any[]) {
        this.filteredSubCategories.set(subs);
      }.bind(this)
    });
  }


  getStatusClass(status: string): string {
    return 'status-badge status-' + status.toLowerCase().replace(/ /g, '_');
  }

  getConditionColor(condition: string): string {
    if (condition === 'Very Good' || condition === 'Good' || condition === 'A - Very Good 76% - 100% ' || condition === 'B - Good 51% - 75%') return '#10b981';
    if (condition === 'Fair') return '#f59e0b';
    if (condition === 'Poor' || condition === 'Very Poor') return '#ef4444';
    return '#94a3b8';
  }

  getMeasurementLabel(type: string): string {
    if (type === 'Revaluation Module') return 'REVAL';
    if (type === 'Cost Module') return 'COST';
    return 'N/A';
  }

  getCurrentFinYear(): string {
    var s = this.orgSettings.settings();
    if (s && s.financial_year) return s.financial_year;
    var now = new Date();
    var month = now.getMonth() + 1;
    var year = now.getFullYear();
    if (month >= 7) { return year + '/' + (year + 1); }
    return (year - 1) + '/' + year;
  }

  getCurrentPeriod(): number {
    var s = this.orgSettings.settings();
    if (s && s.current_period_month) return s.current_period_month;
    if (s && s.current_period) return s.current_period;
    var month = new Date().getMonth() + 1;
    return month >= 7 ? month - 6 : month + 6;
  }

  getMunicipalityName(): string {
    var s = this.orgSettings.settings();
    return (s && s.municipality_name) ? s.municipality_name : 'Mnquma Local Municipality';
  }

  maskIdNumber(num: string): string {
    if (!num || num === 'NULL') { return ''; }
    var rest = num.length - 6;
    if (rest > 0) {
      return num.substring(0, 6) + 'x'.repeat(rest);
    }
    return num;
  }

  onNewCustodianChange(id: number) {
    this.na.custodianId = id;
    this.na.custodianIdNumber = '';
    if (!id) { return; }
    var employees = this.newEmployees();
    for (var i = 0; i < employees.length; i++) {
      if (employees[i].employeeId === id) {
        this.na.custodianIdNumber = this.maskIdNumber(employees[i].idNo || '');
        break;
      }
    }
  }

  onNewDepartmentChange(id: number) {
    this.na.departmentId = id;
    this.na.divisionId = 0;
    if (!id) {
      this.newFilteredDivisions.set([]);
      return;
    }
    var all = this.newDivisions();
    var filtered = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].departmentId === id) { filtered.push(all[i]); }
    }
    this.newFilteredDivisions.set(filtered);
  }

  onNewCidmsChainSelected(chain: CidmsChainResult) {
    var self = this;
    self.na.cidmsSubComponentTypeId = chain.cidmsSubComponentTypeId || 0;
    self.na.cidmsComponentTypeId = chain.cidmsComponentTypeId || 0;
    self.na.cidmsAccountingGroupId = chain.cidmsAccountingGroupId || 0;
    self.na.cidmsSubAccountingGroupId = chain.cidmsAccountingSubGroupId || 0;
    self.na.cidmsClassId = chain.cidmsClassId || 0;
    self.na.cidmsGroupTypeId = chain.cidmsGroupTypeId || 0;
    self.na.cidmsAssetTypeId = chain.cidmsAssetTypeId || 0;
    self.na.cidmsComponentType = chain.cidmsComponentTypeDesc || '';
    self.na.cidmsAccountingGroup = chain.cidmsAccountingGroupDesc || '';
    self.na.cidmsSubAccountingGroup = chain.cidmsAccountingSubGroupDesc || '';
    self.na.cidmsAssetClass = chain.cidmsClassDesc || '';
    self.na.cidmsAssetGroupType = chain.cidmsGroupTypeDesc || '';
    self.na.cidmsAssetType = chain.cidmsAssetTypeDesc || '';
    self.showNewCidmsPicker.set(false);
  }

  ngOnInit() {
    this.api.getDepartments().subscribe(function(this: AssetListComponent, d: any) { this.departments.set(d); }.bind(this));
    this.api.getLocations().subscribe(function(this: AssetListComponent, l: any) { this.locations.set(l); }.bind(this));
    this.api.getVerificationLookupTowns().subscribe(function(this: AssetListComponent, t: any[]) { this.newTowns.set(t); }.bind(this));
    this.api.getVerificationLookupWards().subscribe(function(this: AssetListComponent, w: any[]) { this.newWards.set(w); }.bind(this));
    this.api.getVerificationLookupBuildings().subscribe(function(this: AssetListComponent, b: any[]) { this.newBuildings.set(b); }.bind(this));
    this.api.getAssetTypes().subscribe(function(this: AssetListComponent, t: any[]) { this.assetTypes.set(t); }.bind(this));
    this.api.getAssetCategoriesList().subscribe(function(this: AssetListComponent, c: any[]) { this.allCategories.set(c); this.filterCategories.set(c); }.bind(this));
    this.api.getAssetSubCategoriesList().subscribe(function(this: AssetListComponent, sc: any[]) { this.allSubCategories.set(sc); }.bind(this));
    this.api.getAssetStatuses().subscribe(function(this: AssetListComponent, s: any[]) { this.assetStatuses.set(s); }.bind(this));
    this.api.getMeasurementTypes().subscribe(function(this: AssetListComponent, mt: any[]) { this.measurementTypes.set(mt); }.bind(this));
    this.api.getUnitOfIssues().subscribe(function(this: AssetListComponent, u: any[]) { this.unitOfIssues.set(u); }.bind(this));
    this.api.getDepreciationMethods().subscribe(function(this: AssetListComponent, dm: any[]) { this.depreciationMethods.set(dm); }.bind(this));
    this.api.getEmployees().subscribe(function(this: AssetListComponent, e: any[]) {
      e.sort(function(a: any, b: any) {
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
      this.newEmployees.set(e);
    }.bind(this));
    this.api.getVerificationLookupDivisions().subscribe(function(this: AssetListComponent, d: any[]) { this.newDivisions.set(d); }.bind(this));
    this.api.getConstFundingSources().subscribe(function(this: AssetListComponent, r: any[]) { this.createConstFundingSources.set(Array.isArray(r) ? r : []); }.bind(this));
    this.loadAssets();
  }

  getCreateAvailableFundingSources(): any[] {
    var all = this.createConstFundingSources();
    var staged = this.createStagedFundingRows;
    var result = [];
    for (var i = 0; i < all.length; i++) {
      var found = false;
      for (var j = 0; j < staged.length; j++) {
        if (Number(staged[j].fundingSourceId) === Number(all[i].fundingSourceId)) { found = true; break; }
      }
      if (!found) result.push(all[i]);
    }
    return result;
  }

  addCreateStagedFunding() {
    if (!this.createNewFundingSourceId) return;
    var all = this.createConstFundingSources();
    var desc = '';
    for (var i = 0; i < all.length; i++) {
      if (Number(all[i].fundingSourceId) === Number(this.createNewFundingSourceId)) { desc = all[i].fundingSourceDesc; break; }
    }
    this.createStagedFundingRows = this.createStagedFundingRows.concat([{ fundingSourceId: this.createNewFundingSourceId, fundingSourceDesc: desc, amount: this.createNewFundingAmount }]);
    this.createNewFundingSourceId = null;
    this.createNewFundingAmount = null;
  }

  removeCreateStagedFunding(idx: number) {
    var rows = [];
    for (var i = 0; i < this.createStagedFundingRows.length; i++) {
      if (i !== idx) rows.push(this.createStagedFundingRows[i]);
    }
    this.createStagedFundingRows = rows;
  }

  jumpToPage(value: string) {
    var n = parseInt(value, 10);
    if (isNaN(n)) return;
    var maxPage = this.totalPages() > 0 ? this.totalPages() : 1;
    if (n < 1) n = 1;
    if (n > maxPage) n = maxPage;
    if (n === this.page()) return;
    this.page.set(n);
    this.loadAssets();
  }

  loadAssets() {
    this.loading.set(true);
    const params: any = {
      page: this.page(),
      pageSize: this.pageSize,
      search: this.search
    };
    if (this.filterTypeId) { params.type = this.filterTypeId; }
    if (this.filterCategoryId) { params.category = this.filterCategoryId; }
    if (this.filterSubCategoryId) { params.subCategory = this.filterSubCategoryId; }
    this.api.getAssets(params).subscribe({
      next: (res) => {
        this.assets.set(res.data);
        this.total.set(res.total);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  clearFilters() {
    this.search = '';
    this.filterTypeId = 0;
    this.filterCategoryId = 0;
    this.filterSubCategoryId = 0;
    this.filterCategories.set(this.allCategories());
    this.filterSubCategories.set([]);
    this.page.set(1);
    this.loadAssets();
  }

  onFilterTypeChange(typeId: number): void {
    this.filterTypeId = typeId;
    this.filterCategoryId = 0;
    this.filterSubCategoryId = 0;
    this.filterSubCategories.set([]);
    if (typeId) {
      var all = this.allCategories();
      var filtered: any[] = [];
      for (var i = 0; i < all.length; i++) {
        if (all[i].assetTypeId === typeId) { filtered.push(all[i]); }
      }
      this.filterCategories.set(filtered);
    } else {
      this.filterCategories.set(this.allCategories());
    }
    this.page.set(1);
    this.loadAssets();
  }

  onFilterCategoryChange(catId: number): void {
    this.filterCategoryId = catId;
    this.filterSubCategoryId = 0;
    if (catId) {
      var allCats = this.allCategories();
      var matchedCat: any = null;
      for (var i = 0; i < allCats.length; i++) {
        if (allCats[i].assetCategoryId === catId) { matchedCat = allCats[i]; break; }
      }
      if (matchedCat && matchedCat.assetTypeId) {
        this.filterTypeId = matchedCat.assetTypeId;
        var filtered: any[] = [];
        for (var j = 0; j < allCats.length; j++) {
          if (allCats[j].assetTypeId === matchedCat.assetTypeId) { filtered.push(allCats[j]); }
        }
        this.filterCategories.set(filtered);
      }
      var allSubs = this.allSubCategories();
      var filteredSubs: any[] = [];
      for (var k = 0; k < allSubs.length; k++) {
        if (allSubs[k].assetCategoryId === catId) { filteredSubs.push(allSubs[k]); }
      }
      this.filterSubCategories.set(filteredSubs);
    } else {
      this.filterSubCategories.set([]);
    }
    this.page.set(1);
    this.loadAssets();
  }

  onFilterSubCategoryChange(subId: number): void {
    this.filterSubCategoryId = subId;
    if (subId) {
      var allSubs = this.allSubCategories();
      var matchedSub: any = null;
      for (var i = 0; i < allSubs.length; i++) {
        if (allSubs[i].assetSubCategoryId === subId) { matchedSub = allSubs[i]; break; }
      }
      if (matchedSub) {
        if (matchedSub.assetCategoryId) { this.filterCategoryId = matchedSub.assetCategoryId; }
        if (matchedSub.assetTypeId) {
          this.filterTypeId = matchedSub.assetTypeId;
          var allCats = this.allCategories();
          var filteredCats: any[] = [];
          for (var j = 0; j < allCats.length; j++) {
            if (allCats[j].assetTypeId === matchedSub.assetTypeId) { filteredCats.push(allCats[j]); }
          }
          this.filterCategories.set(filteredCats);
        }
        if (matchedSub.assetCategoryId) {
          var allSubs2 = this.allSubCategories();
          var filteredSubs: any[] = [];
          for (var k = 0; k < allSubs2.length; k++) {
            if (allSubs2[k].assetCategoryId === matchedSub.assetCategoryId) { filteredSubs.push(allSubs2[k]); }
          }
          this.filterSubCategories.set(filteredSubs);
        }
      }
    }
    this.page.set(1);
    this.loadAssets();
  }

  nextStep() {
    const idx = this.formSteps.findIndex(s => s.key === this.formStep);
    if (idx < this.formSteps.length - 1) {
      this.formStep = this.formSteps[idx + 1].key;
    }
  }

  prevStep() {
    const idx = this.formSteps.findIndex(s => s.key === this.formStep);
    if (idx > 0) {
      this.formStep = this.formSteps[idx - 1].key;
    }
  }

  onNewTownChange(townId: number) {
    this.na.townId = townId;
    this.na.suburbId = 0;
    this.na.streetId = 0;
    this.newSuburbs.set([]);
    this.newStreets.set([]);
    if (!townId) return;
    this.api.getVerificationLookupSuburbs(townId).subscribe(function(this: AssetListComponent, s: any[]) { this.newSuburbs.set(s); }.bind(this));
  }

  onNewSuburbChange(suburbId: number) {
    this.na.suburbId = suburbId;
    this.na.streetId = 0;
    this.newStreets.set([]);
    if (!suburbId) return;
    this.api.getVerificationLookupStreets(suburbId).subscribe(function(this: AssetListComponent, s: any[]) { this.newStreets.set(s); }.bind(this));
  }

  onNewStreetChange(streetId: number) {
    this.na.streetId = streetId;
  }

  onNewBuildingChange(buildingId: number) {
    this.na.buildingId = buildingId;
    this.na.floorId = 0;
    this.na.roomId = 0;
    this.newFloors.set([]);
    this.newRooms.set([]);
    if (!buildingId) return;
    this.api.getVerificationLookupFloors(buildingId).subscribe(function(this: AssetListComponent, f: any[]) { this.newFloors.set(f); }.bind(this));
  }

  onNewFloorChange(floorId: number) {
    this.na.floorId = floorId;
    this.na.roomId = 0;
    this.newRooms.set([]);
    if (!floorId) return;
    this.api.getVerificationLookupRooms(floorId).subscribe(function(this: AssetListComponent, r: any[]) { this.newRooms.set(r); }.bind(this));
  }

  createAsset() {
    if (!this.na.description || !this.na.categoryName || !this.na.acquisitionCost) {
      this.snackBar.open('Please fill required fields: Description, Category, Acquisition Cost', 'OK', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    if (!this.na.acquisitionDate) {
      this.snackBar.open('Please enter the Acquisition Date', 'OK', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }

    const payload: any = {};
    var def = function(key: string, dbKey: string, val: any) {
      if (val !== '' && val !== null && val !== undefined && val !== 0) { payload[dbKey] = val; }
    };

    def('d', 'Description', this.na.description);
    def('ty', 'AssetType_ID', this.na.typeId);
    def('cat2', 'AssetCategory_ID', this.na.categoryId);
    def('sc2', 'Asset_SubCategory_ID', this.na.subCategoryId);
    def('cls2', 'AssetClass_ID', this.na.assetClassId);
    def('mt2', 'MeasurementType_ID', this.na.measurementTypeId);
    def('sts', 'AssetStatus_ID', this.na.assetStatusId);
    def('b', 'Barcode', this.na.barcode);
    def('ob', 'OldBarCode', this.na.oldBarcode);
    def('pi', 'ParentAssetRegisterItem_ID', this.na.parentAssetId);
    def('mi', 'MunicipalAssetID', this.na.municipalAssetId);
    def('ma', 'MainAssetID', this.na.mainAssetId);
    def('md', 'MainAssetDescription', this.na.mainAssetDescription);
    def('ci', 'CIDMSSubComponentTypeID', this.na.cidmsSubComponentTypeId);
    def('ct', 'CIDMSComponentType', this.na.cidmsComponentTypeId);
    def('ca', 'CIDMSAccountingGroup', this.na.cidmsAccountingGroupId);
    def('cs', 'CIDMSSubAccountingGroup', this.na.cidmsSubAccountingGroupId);
    def('cc', 'CIDMSAssetClass', this.na.cidmsClassId);
    def('cg', 'CIDMSAssetGroupType', this.na.cidmsGroupTypeId);
    def('cat', 'CIDMSAssetType', this.na.cidmsAssetTypeId);
    def('inf', 'InfrastructurOrNonInfrastructure', this.na.infrastructureType);
    def('cg2', 'CashOrNoncashgeneratingunit', this.na.cashGenerating);
    def('bm', 'BasicMunicipalityService', this.na.basicMunicipalityService);
    def('na2', 'NatureOfAddition', this.na.natureOfAddition);
    def('cf', 'ConsequenceOfFailure', this.na.consequenceOfFailure);
    def('rk', 'Risk', this.na.risk);
    def('ad', 'AcquisitionDate', this.na.acquisitionDate);
    def('cd', 'CommisioningDate', this.na.commissioningDate);
    def('id', 'InserviceDate', this.na.inServiceDate);
    def('vd', 'VerificationDate', this.na.verificationDate);
    def('vb', 'VerificationDoneBy', this.na.verificationDoneById);
    def('yc', 'YearConstructed', this.na.yearConstructed);
    def('fr', 'ForecastReplacementYear', this.na.forecastReplacementYear);
    def('ul', 'UsefulLifeMonthComponent', this.na.usefulLifeMonths);
    def('ru', 'RemainingUsefulLife', this.na.remainingUsefulLifeMonths);
    def('co', 'AssetCondition_ID', this.na.condition === 'Good' ? 0 : 0);
    def('u', 'UoM', this.na.uomId);
    def('q', 'Quantity', this.na.quantity);
    def('d1', 'Dim1', this.na.dim1);
    def('d2', 'Dim2', this.na.dim2);
    def('d3', 'Dim3', this.na.dim3);
    def('dq', 'DimensionQuantity', this.na.dimensionQuantity);
    def('cm', 'ConstructionMaterial', this.na.constructionMaterial);
    def('di', 'Diameter', this.na.diameter);
    def('cap', 'Capacity', this.na.capacity);
    def('cg3', 'CriticalityGrade', this.na.criticalityGrade);
    def('pg', 'PerformanceGrade', this.na.performanceGrade);
    def('ug', 'UtilisationGrade', this.na.utilisationGrade);
    def('hg', 'InfrastructureHealthGrade', this.na.infrastructureHealthGrade);
    def('pa', 'PurchaseAmount', this.na.acquisitionCost);
    def('rs', 'ResidualValue', this.na.residualValue);
    def('cr', 'CurrentReplacementCostCRC', this.na.currentReplacementCost);
    def('dr', 'DepreciatedReplacementCostDRC', this.na.depreciatedReplacementCost);
    def('am', 'AnnualisedMaintenanceCRC', this.na.annualisedMaintenanceCrc);
    def('ab', 'AnnualMaintenanceBudgetNeed', this.na.annualMaintenanceBudgetNeed);
    def('dc', 'AccumulatedDepreciationCurrentYear', this.na.depreciationCurrentYear);
    def('ic', 'ImpairmentAmountCurrentYear', this.na.impairmentCurrentYear);
    def('ir', 'ReversalOfImpairmentAmount', this.na.impairmentReversalAmount);
    def('im', 'Impairment_Date', this.na.impairmentDate);
    def('rd', 'RevaluationDate', this.na.revaluationDate);
    def('rv', 'RevaluationValue', this.na.revaluationValue);
    def('mr', 'MovementInRevaluationReserve', this.na.movementInRevaluationReserve);
    def('rr', 'RevaluationReserveClosingBalance', this.na.revaluationReserveClosingBalance);
    def('do2', 'DepreciationOffset', this.na.depreciationOffset);
    def('dc2', 'DeemedCost', this.na.deemedCost);
    def('ic2', 'InsuranceCover', this.na.insuranceCover);
    def('ip', 'InsurancePolicyNo', this.na.insurancePolicyNo);
    def('ia', 'InsuredAmountInsuredBy', this.na.insuredAmount);
    def('w', 'Warranty', this.na.warranty);
    def('dep', 'MunicipalDepartment_ID', this.na.departmentId);
    def('div', 'DivisionID', this.na.divisionId);
    def('cus', 'Custodian_ID', this.na.custodianId);
    def('cid', 'CustodianIdNumber', this.na.custodianIdNumber);
    def('ao', 'AssetOwnershipName', this.na.assetOwnership);
    def('sn', 'SerialNumber', this.na.serialNumber);
    def('rn', 'RegistrationNumber', this.na.registrationNumber);
    def('un', 'UnitNumber', this.na.unitNumber);
    def('mk', 'Make', this.na.make);
    def('mo', 'Model', this.na.model);
    def('dn', 'DeedNumber', this.na.deedNumber);
    def('en', 'ErfNumber', this.na.erfNumber);
    def('pn', 'PortionNumber', this.na.portionNumber);
    def('es', 'ErfSizeM2', this.na.erfSize);
    def('su', 'SupplierName', this.na.supplierName);
    def('sc', 'SupplierCode', this.na.supplierCode);
    def('sg', 'SGNumberChange_ID', this.na.sgKey);
    def('la', 'latitude', this.na.latitude);
    def('lo', 'longitude', this.na.longitude);
    def('gf', 'GisFeature', this.na.gisFeature);
    def('wk', 'WellKnownTextWKT', this.na.wellKnownText);
    def('ld', 'LocationDescription', this.na.locationDescription);
    def('rp', 'RoomResponsiblePerson', this.na.roomResponsiblePerson);
    def('it', 'ITHardwareResponsiblePerson', this.na.itHardwareResponsiblePerson);
    def('fd', 'FundingDescription', this.na.fundingDescription);
    def('inv', 'InvoiceNo', this.na.invoiceNo);
    def('pay', 'PaymentNo', this.na.paymentNo);
    def('dnm', 'Donor_Name', this.na.donorName);
    def('drn', 'DonorRegNumber', this.na.donorRegNumber);
    def('dd', 'Date_Donated', this.na.dateDonated);

    const cost = Number(this.na.acquisitionCost) || 0;
    payload.PurchaseAmount = cost;
    payload.CarryingAmountClosingBalance = cost;

    if (this.na.townId) { payload.Town_ID = this.na.townId; }
    if (this.na.suburbId) { payload.SuburbID = this.na.suburbId; }
    if (this.na.wardId) { payload.Ward_ID = this.na.wardId; }
    if (this.na.streetId) { payload.Street_ID = this.na.streetId; }
    if (this.na.buildingId) { payload.Building_ID = this.na.buildingId; }
    if (this.na.floorId) { payload.FloorID = this.na.floorId; }
    if (this.na.roomId) { payload.Room_ID = this.na.roomId; }

    var self = this;
    var stagedRows = this.createStagedFundingRows.slice();
    this.api.createAsset(payload).subscribe({
      next: function(res: any) {
        var newId = res?.AssetRegisterItem_ID || res?.assetId || 0;
        self.snackBar.open('Asset ' + newId + ' registered successfully', 'View', {
          duration: 5000, horizontalPosition: 'end', verticalPosition: 'top'
        }).onAction().subscribe(function() {
          if (newId) self.router.navigate(['/assets', newId]);
        });
        self.showNewAssetForm = false;
        self.formStep = 'details';
        self.na = self.getEmptyAsset();
        self.createStagedFundingRows = [];
        self.createNewFundingSourceId = null;
        self.createNewFundingAmount = null;
        self.noClassMessage.set('');
        self.filteredClasses.set([]);
        self.filteredCategories.set([]);
        self.filteredSubCategories.set([]);
        self.loadAssets();
        if (newId) {
          for (var i = 0; i < stagedRows.length; i++) {
            self.api.createAssetFunding({ assetRegisterItemId: newId, fundingSourceId: stagedRows[i].fundingSourceId, finYear: null, amount: (stagedRows[i].amount !== null && stagedRows[i].amount !== undefined && stagedRows[i].amount !== '') ? stagedRows[i].amount : null }).subscribe(function() {}, function() {});
          }
          self.api.getSettings().subscribe(function(s: any) {
            var fy = (s && s.financial_year) ? s.financial_year : '2025/2026';
            self.api.rebuildTransactionSummary([newId], fy).subscribe(function() {
              console.log('Summary rebuild completed for asset ' + newId);
            });
          });
        }
      },
      error: function(err: any) {
        self.snackBar.open('Error creating asset: ' + (err?.error?.error || 'Unknown error'), 'OK', {
          duration: 5000, horizontalPosition: 'end', verticalPosition: 'top'
        });
      }
    });
  }

  exportToExcel() {
    this.snackBar.open('Generating Excel export...', '', { duration: 2000, horizontalPosition: 'end', verticalPosition: 'top' });
    this.api.getAssets({ pageSize: 500 }).subscribe({
      next: function(this: AssetListComponent, res: any) {
        var headers = ['Asset ID', 'Description', 'Category', 'Sub-Category', 'Asset Type', 'Condition', 'Measurement Type', 'Cost Closing Balance', 'Acc Depreciation', 'Carrying Amount', 'Revaluation Reserve', 'Department', 'Location', 'Custodian'];
        var wsData: any[][] = [headers];
        for (var i = 0; i < res.data.length; i++) {
          var a = res.data[i];
          wsData.push([
            a.assetId, a.description, a.categoryName, a.subCategoryName, a.assetTypeName,
            a.condition, a.measurementType,
            a.costClosingBalance, a.depreciationClosingBalance, a.carryingAmount,
            a.accumulatedRevaluationsClosing,
            a.departmentName, a.locationName, a.custodian
          ]);
        }
        var ws = XLSX.utils.aoa_to_sheet(wsData);
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Asset Register');
        var fileName = 'mnquma_asset_register_' + new Date().toISOString().split('T')[0] + '.xlsx';
        XLSX.writeFile(wb, fileName);
        this.snackBar.open('Export downloaded successfully', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }
}
