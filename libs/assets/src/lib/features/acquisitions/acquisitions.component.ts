import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';

type WizardStep = 'classification' | 'dates' | 'ownership' | 'location' | 'review';
const WIZARD_STEP_ORDER: WizardStep[] = ['classification', 'dates', 'ownership', 'location', 'review'];

@Component({
  selector: 'app-acquisitions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './acquisitions.component.html',
  styleUrls: ['./acquisitions.component.scss']
})

export class AcquisitionsComponent implements OnInit {
  activeTab = signal<'scm' | 'inventory' | 'donation' | 'list'>('scm');
  wizardVisible = signal(false);
  wizardStep = signal<WizardStep>('classification');
  saving = signal(false);

  scmLoading = signal(false);
  scmResults = signal<any[]>([]);
  scmSelectedRow: any = null;
  scmTableCollapsed = signal(false);
  scmFilterTransferId = '';
  scmFilterGrnId = '';
  scmFilterCategory = '';
  scmFilterClass = '';

  invLoading = signal(false);
  invResults = signal<any[]>([]);
  invSelectedRow: any = null;
  invTableCollapsed = signal(false);
  invFilterItemId = '';
  invFilterInventoryId = '';
  invFilterCategory = '';
  invFilterClass = '';

  listLoading = signal(false);
  listItems = signal<any[]>([]);

  assetTypes = signal<any[]>([]);
  allCategories = signal<any[]>([]);
  allSubCategories = signal<any[]>([]);
  allClasses = signal<any[]>([]);
  assetStatuses = signal<any[]>([]);
  assetConditions = signal<any[]>([]);
  measurementTypes = signal<any[]>([]);
  departments = signal<any[]>([]);
  divisions = signal<any[]>([]);
  employees = signal<any[]>([]);
  towns = signal<any[]>([]);
  suburbs = signal<any[]>([]);
  wards = signal<any[]>([]);
  streets = signal<any[]>([]);
  buildings = signal<any[]>([]);
  floors = signal<any[]>([]);
  rooms = signal<any[]>([]);
  allDivisions = signal<any[]>([]);

  filteredClasses = signal<any[]>([]);
  filteredCategories = signal<any[]>([]);
  filteredSubCategories = signal<any[]>([]);
  filteredDivisions = signal<any[]>([]);

  na: any = this.emptyForm();

  wizardSteps: { key: WizardStep; label: string }[] = [
    { key: 'classification', label: '1. Classification' },
    { key: 'dates', label: '2. Dates' },
    { key: 'ownership', label: '3. Ownership' },
    { key: 'location', label: '4. Location' },
    { key: 'review', label: '5. Review' }
  ];

  listGroupedScm = computed(function(this: AcquisitionsComponent) {
    return this.listItems().filter(function(i: any) { return i.acquisitionType === 'SCM/GRN'; });
  }.bind(this));

  listGroupedInventory = computed(function(this: AcquisitionsComponent) {
    return this.listItems().filter(function(i: any) { return i.acquisitionType === 'Inventory'; });
  }.bind(this));

  listGroupedDonation = computed(function(this: AcquisitionsComponent) {
    return this.listItems().filter(function(i: any) { return i.acquisitionType === 'Donation'; });
  }.bind(this));

  constructor(private api: ApiService, private snackBar: MatSnackBar, public router: Router) {}

  ngOnInit() {
    this.loadLookups();
    this.loadScm();
  }

  emptyForm(): any {
    // CIDMS fields are intentionally omitted here: the acquisitions form captures new assets
    // at the point of purchase and does not collect CIDMS classification at capture time.
    // CIDMS is assigned later via the Asset Detail view once the asset is registered.
    return {
      description: '', typeId: 0, categoryId: 0, subCategoryId: 0, assetClassId: 0,
      measurementTypeId: 0, assetStatusId: 0, conditionId: 0, barcode: '', serialNumber: '',
      usefulLifeMonths: null, acquisitionDate: '', commissioningDate: '', inServiceDate: '',
      verificationDate: '', departmentId: 0, divisionId: 0, custodianId: 0,
      assetOwnership: '', townId: 0, suburbId: 0, wardId: 0, streetId: 0,
      buildingId: 0, floorId: 0, roomId: 0, locationDescription: '',
      acquisitionCost: null, supplierName: '', supplierCode: '',
      donorName: '', donorRegNumber: '', dateDonated: '',
      invoiceNo: '', paymentNo: '',
      grnId: null, inventoryId: null,
      scmTransferId: null, invTransferId: null
    };
  }

  loadLookups() {
    var self = this;
    this.api.getAssetTypes().subscribe(function(d: any) { self.assetTypes.set(d || []); }, function() {});
    this.api.getAssetCategoriesList().subscribe(function(d: any) { self.allCategories.set(d || []); }, function() {});
    this.api.getAssetStatuses().subscribe(function(d: any) { self.assetStatuses.set(d || []); }, function() {});
    this.api.getAssetConditions().subscribe(function(d: any) { self.assetConditions.set(d || []); }, function() {});
    this.api.getMeasurementTypes().subscribe(function(d: any) { self.measurementTypes.set(d || []); }, function() {});
    this.api.getDepartments().subscribe(function(d: any) { self.departments.set(d || []); }, function() {});
    this.api.getEmployees().subscribe(function(d: any) { self.employees.set(d || []); }, function() {});
    this.api.getVerificationLookupTowns().subscribe(function(d: any) { self.towns.set(d || []); }, function() {});
    this.api.getVerificationLookupWards().subscribe(function(d: any) { self.wards.set(d || []); }, function() {});
    this.api.getVerificationLookupBuildings().subscribe(function(d: any) { self.buildings.set(d || []); }, function() {});
    this.api.getVerificationLookupDivisions().subscribe(function(d: any) { self.allDivisions.set(d || []); self.divisions.set(d || []); }, function() {});
  }

  onTownChange() {
    var self = this;
    var townId = Number(this.na.townId);
    this.suburbs.set([]);
    this.streets.set([]);
    this.na.suburbId = 0;
    this.na.streetId = 0;
    if (!townId) return;
    this.api.getVerificationLookupSuburbs(townId).subscribe(function(d: any) { self.suburbs.set(d || []); }, function() {});
  }

  onSuburbChange() {
    var self = this;
    var suburbId = Number(this.na.suburbId);
    this.streets.set([]);
    this.na.streetId = 0;
    if (!suburbId) return;
    this.api.getVerificationLookupStreets(suburbId).subscribe(function(d: any) { self.streets.set(d || []); }, function() {});
  }

  onStreetChange() {
    var streetId = Number(this.na.streetId);
    this.na.streetId = streetId;
  }

  onBuildingChange() {
    var self = this;
    var buildingId = Number(this.na.buildingId);
    this.floors.set([]);
    this.rooms.set([]);
    this.na.floorId = 0;
    this.na.roomId = 0;
    if (!buildingId) return;
    this.api.getVerificationLookupFloors(buildingId).subscribe(function(d: any) { self.floors.set(d || []); }, function() {});
  }

  onFloorChange() {
    var self = this;
    var floorId = Number(this.na.floorId);
    this.rooms.set([]);
    this.na.roomId = 0;
    if (!floorId) return;
    this.api.getVerificationLookupRooms(floorId).subscribe(function(d: any) { self.rooms.set(d || []); }, function() {});
  }

  setTab(tab: 'scm' | 'inventory' | 'donation' | 'list') {
    this.activeTab.set(tab);
    this.wizardVisible.set(tab === 'donation');
    this.wizardStep.set('classification');
    this.scmSelectedRow = null;
    this.invSelectedRow = null;
    this.scmTableCollapsed.set(false);
    this.invTableCollapsed.set(false);
    this.na = this.emptyForm();
    if (tab === 'list') this.loadList();
    if (tab === 'scm' && this.scmResults().length === 0) this.loadScm();
    if (tab === 'inventory' && this.invResults().length === 0) this.loadInventory();
  }

  scmFiltered(): any[] {
    var list = this.scmResults();
    var fT = this.scmFilterTransferId.toLowerCase();
    var fG = this.scmFilterGrnId.toLowerCase();
    var fC = this.scmFilterCategory.toLowerCase();
    var fCl = this.scmFilterClass.toLowerCase();
    var result = [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (fT && !String(r.transferId || '').toLowerCase().includes(fT)) continue;
      if (fG && !String(r.grnId || '').toLowerCase().includes(fG)) continue;
      if (fC && !(r.categoryDescription || '').toLowerCase().includes(fC)) continue;
      if (fCl && !(r.classDescription || '').toLowerCase().includes(fCl)) continue;
      result.push(r);
    }
    return result;
  }

  invFiltered(): any[] {
    var list = this.invResults();
    var fI = this.invFilterItemId.toLowerCase();
    var fV = this.invFilterInventoryId.toLowerCase();
    var fC = this.invFilterCategory.toLowerCase();
    var fCl = this.invFilterClass.toLowerCase();
    var result = [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (fI && !String(r.itemId || '').toLowerCase().includes(fI)) continue;
      if (fV && !String(r.inventoryId || '').toLowerCase().includes(fV)) continue;
      if (fC && !(r.categoryDescription || '').toLowerCase().includes(fC)) continue;
      if (fCl && !(r.classDescription || '').toLowerCase().includes(fCl)) continue;
      result.push(r);
    }
    return result;
  }

  loadList() {
    var self = this;
    this.listLoading.set(true);
    this.api.getAcquisitionsList().subscribe(function(d: any) {
      self.listItems.set(d || []);
      self.listLoading.set(false);
    }, function() { self.listLoading.set(false); });
  }

  loadScm() {
    var self = this;
    this.scmLoading.set(true);
    this.api.getScmInvoicesForAcquisition().subscribe(function(d: any) {
      self.scmResults.set(d || []);
      self.scmLoading.set(false);
    }, function() { self.scmLoading.set(false); });
  }

  selectScmRow(row: any) {
    var self = this;
    this.scmSelectedRow = row;
    this.na = this.emptyForm();
    this.na.scmTransferId    = row.transferId      != null ? row.transferId    : null;
    this.na.description      = row.description     || '';
    this.na.acquisitionCost  = row.currentAmount   != null ? row.currentAmount : null;
    this.na.grnId            = row.grnId           != null ? row.grnId         : null;
    this.na.barcode          = row.barcode        || '';
    this.na.serialNumber     = row.serialNumber   || '';
    this.na.supplierName     = row.supplierName   || '';
    this.na.supplierCode     = row.supplierCode   || '';
    this.na.invoiceNo        = row.invoiceNo      || '';
    this.na.acquisitionDate  = row.invoiceDate ? row.invoiceDate.substring(0, 10) : '';
    this.na.departmentId     = row.municipalDepartmentId || 0;
    this.na.custodianId      = row.custodianId        || 0;
    this.na.townId           = row.townId    || 0;
    this.na.streetId         = row.streetId  || 0;
    this.na.buildingId       = row.buildingId || 0;
    this.na.wardId           = row.wardId    || 0;
    this.na.roomId           = row.roomId    || 0;
    this.na.conditionId      = row.assetConditionId   || 0;
    // Classification: transfer row values take priority; class defaults as fallback
    this.na.typeId     = row.assetTypeId     || row.classTypeId     || 0;
    this.na.categoryId = row.assetCategoryId || row.classCategoryId || 0;
    // Load sub-category + class dropdown options (onCategoryChange resets subCategoryId/assetClassId synchronously)
    this.onCategoryChange();
    // Re-set immediately after (async API calls in onCategoryChange won't touch these values)
    this.na.subCategoryId    = row.assetSubCategoryId || row.classSubCategoryId    || 0;
    this.na.assetClassId     = row.assetClassId       || 0;
    this.na.measurementTypeId = row.classMeasurementTypeId || 0;
    this.na.assetStatusId    = row.assetStatusId      || row.classAssetStatusId    || 0;
    this.na.usefulLifeMonths = row.usefulLifeMonths   || row.classUsefulLifeMonths || null;
    // Load filtered categories for typeId (for type dropdown display)
    if (this.na.typeId) {
      var typeId = Number(this.na.typeId);
      this.api.getAssetCategoriesList({ typeId: typeId }).subscribe({
        next: function(cats: any[]) { self.filteredCategories.set(cats || []); },
        error: function() {}
      });
    }
    this.scmTableCollapsed.set(true);
    this.wizardVisible.set(true);
    this.wizardStep.set('classification');
  }

  loadInventory() {
    var self = this;
    this.invLoading.set(true);
    this.api.getInventoryItemsForAcquisition().subscribe(function(d: any) {
      self.invResults.set(d || []);
      self.invLoading.set(false);
    }, function() { self.invLoading.set(false); });
  }

  selectInvRow(row: any) {
    var self = this;
    this.invSelectedRow = row;
    this.na = this.emptyForm();
    this.na.invTransferId    = row.itemId         != null ? row.itemId         : null;
    this.na.description      = row.description   || '';
    this.na.acquisitionCost  = row.purchaseAmount != null ? row.purchaseAmount : null;
    this.na.inventoryId      = row.inventoryId    != null ? row.inventoryId    : null;
    this.na.conditionId      = row.assetConditionId || 0;
    this.na.acquisitionDate  = row.invoiceDate ? row.invoiceDate.substring(0, 10) : '';
    // Classification: use class defaults for TypeID, SubCategory, Measurement (InvTransfer lacks these)
    this.na.typeId     = row.classTypeId     || 0;
    this.na.categoryId = row.assetCategoryId || row.classCategoryId || 0;
    // Load sub-category + class dropdown options (onCategoryChange resets subCategoryId/assetClassId synchronously)
    this.onCategoryChange();
    // Re-set immediately after (async API calls in onCategoryChange won't touch these values)
    this.na.subCategoryId    = row.classSubCategoryId    || 0;
    this.na.assetClassId     = row.assetClassId          || 0;
    this.na.measurementTypeId = row.classMeasurementTypeId || 0;
    this.na.assetStatusId    = row.assetStatusId         || row.classAssetStatusId || 0;
    this.na.usefulLifeMonths = row.usefulLifeMonths      || row.classUsefulLifeMonths || null;
    // Load filtered categories for typeId (for type dropdown display)
    if (this.na.typeId) {
      var typeId = Number(this.na.typeId);
      this.api.getAssetCategoriesList({ typeId: typeId }).subscribe({
        next: function(cats: any[]) { self.filteredCategories.set(cats || []); },
        error: function() {}
      });
    }
    this.invTableCollapsed.set(true);
    this.wizardVisible.set(true);
    this.wizardStep.set('classification');
  }

  cancelWizard() {
    this.wizardVisible.set(false);
    this.wizardStep.set('classification');
    this.scmSelectedRow = null;
    this.invSelectedRow = null;
    this.scmTableCollapsed.set(false);
    this.invTableCollapsed.set(false);
    this.na = this.emptyForm();
  }

  nextStep() {
    var idx = WIZARD_STEP_ORDER.indexOf(this.wizardStep());
    if (idx < WIZARD_STEP_ORDER.length - 1) {
      this.wizardStep.set(WIZARD_STEP_ORDER[idx + 1]!);
    }
  }

  prevStep() {
    var idx = WIZARD_STEP_ORDER.indexOf(this.wizardStep());
    if (idx > 0) {
      this.wizardStep.set(WIZARD_STEP_ORDER[idx - 1]!);
    }
  }

  goToStep(step: WizardStep) {
    this.wizardStep.set(step);
  }

  onTypeChange() {
    var self = this;
    var typeId = Number(this.na.typeId);
    this.na.categoryId = 0;
    this.na.subCategoryId = 0;
    this.na.assetClassId = 0;
    this.filteredSubCategories.set([]);
    this.filteredClasses.set([]);
    if (!typeId) {
      this.filteredCategories.set([]);
      return;
    }
    this.api.getAssetCategoriesList({ typeId: typeId }).subscribe({
      next: function(cats: any[]) { self.filteredCategories.set(cats || []); },
      error: function() {}
    });
  }

  onCategoryChange() {
    var self = this;
    var catId = Number(this.na.categoryId);
    var typeId = Number(this.na.typeId);
    this.na.subCategoryId = 0;
    this.na.assetClassId = 0;
    this.filteredClasses.set([]);
    if (!catId) {
      this.filteredSubCategories.set([]);
      return;
    }
    var subParams: any = { categoryId: catId };
    if (typeId) { subParams.typeId = typeId; }
    this.api.getAssetSubCategoriesList(subParams).subscribe({
      next: function(subs: any[]) { self.filteredSubCategories.set(subs || []); },
      error: function() {}
    });
    var classParams: any = { categoryId: catId };
    if (typeId) { classParams.typeId = typeId; }
    this.api.getAssetClassesList(classParams).subscribe({
      next: function(res: any) { var arr = Array.isArray(res) ? res : (res?.items || res?.data || []); self.filteredClasses.set(arr); },
      error: function() {}
    });
  }

  onSubCategoryChange() {
    var self = this;
    var subCatId = Number(this.na.subCategoryId);
    var catId = Number(this.na.categoryId);
    var typeId = Number(this.na.typeId);
    this.na.assetClassId = 0;
    if (!catId) { return; }
    var params: any = { categoryId: catId };
    if (typeId) { params.typeId = typeId; }
    if (subCatId) { params.subCategoryId = subCatId; }
    this.api.getAssetClassesList(params).subscribe({
      next: function(res: any) { var arr = Array.isArray(res) ? res : (res?.items || res?.data || []); self.filteredClasses.set(arr); },
      error: function() {}
    });
  }

  onDepartmentChange() {
    var deptId = Number(this.na.departmentId);
    this.na.divisionId = 0;
    if (!deptId) { this.filteredDivisions.set(this.allDivisions()); return; }
    this.filteredDivisions.set(this.allDivisions().filter(function(d: any) { return d.departmentId === deptId; }));
  }

  saveAcquisition() {
    var self = this;
    if (!this.na.description) {
      this.snackBar.open('Description is required', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    if (!this.na.acquisitionCost && this.na.acquisitionCost !== 0) {
      this.snackBar.open('Acquisition cost is required', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    if (this.activeTab() === 'donation') {
      if (!this.na.donorName) {
        this.snackBar.open('Donor name is required for donation acquisitions', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        return;
      }
      if (!this.na.dateDonated) {
        this.snackBar.open('Date donated is required for donation acquisitions', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        return;
      }
    }

    var payload: any = {};
    var defStr = function(dbKey: string, val: any) {
      if (val !== '' && val !== null && val !== undefined) { payload[dbKey] = val; }
    };
    var defInt = function(dbKey: string, val: any) {
      var n = Number(val);
      if (!isNaN(n) && n !== 0) { payload[dbKey] = n; }
    };

    defStr('Description', self.na.description);
    defInt('AssetType_ID', self.na.typeId);
    defInt('AssetCategory_ID', self.na.categoryId);
    defInt('Asset_SubCategory_ID', self.na.subCategoryId);
    defInt('AssetClass_ID', self.na.assetClassId);
    defInt('MeasurementType_ID', self.na.measurementTypeId);
    defInt('AssetStatus_ID', self.na.assetStatusId);
    defInt('AssetCondition_ID', self.na.conditionId);
    defStr('Barcode', self.na.barcode);
    defStr('SerialNumber', self.na.serialNumber);
    defInt('UsefulLifeMonthComponent', self.na.usefulLifeMonths);
    if (self.na.usefulLifeMonths && Number(self.na.usefulLifeMonths) > 0) {
      var months = Number(self.na.usefulLifeMonths);
      var years = Math.floor(months / 12);
      payload['UsefulLifeYearComponent'] = years;
      payload['RemainingUsefulLife'] = months;
      payload['Remaining_Useful_Life_Year'] = years;
    }
    defStr('AcquisitionDate', self.na.acquisitionDate);
    defStr('CommisioningDate', self.na.commissioningDate);
    defStr('InserviceDate', self.na.inServiceDate);
    defStr('VerificationDate', self.na.verificationDate);
    defInt('MunicipalDepartment_ID', self.na.departmentId);
    defInt('DivisionID', self.na.divisionId);
    defInt('Custodian_ID', self.na.custodianId);
    defStr('AssetOwnershipName', self.na.assetOwnership);
    defInt('Town_ID', self.na.townId);
    defInt('SuburbID', self.na.suburbId);
    defInt('Ward_ID', self.na.wardId);
    defInt('Street_ID', self.na.streetId);
    defInt('Building_ID', self.na.buildingId);
    defInt('FloorID', self.na.floorId);
    defInt('Room_ID', self.na.roomId);
    defStr('LocationDescription', self.na.locationDescription);
    defStr('SupplierName', self.na.supplierName);
    defStr('SupplierCode', self.na.supplierCode);
    defStr('InvoiceNo', self.na.invoiceNo);
    defStr('PaymentNo', self.na.paymentNo);
    defStr('Donor_Name', self.na.donorName);
    defStr('DonorRegNumber', self.na.donorRegNumber);
    defStr('Date_Donated', self.na.dateDonated);
    defInt('GRN_ID', self.na.grnId);
    defInt('InventoryID', self.na.inventoryId);
    if (self.na.scmTransferId != null) { payload['SCMTransfer_ID'] = self.na.scmTransferId; }
    if (self.na.invTransferId != null) { payload['InvTransfer_ID'] = self.na.invTransferId; }

    var cost = Number(self.na.acquisitionCost) || 0;
    payload['PurchaseAmount'] = cost;
    payload['CarryingAmountClosingBalance'] = cost;

    self.saving.set(true);

    var tab = self.activeTab();
    var saveCall: any;
    if (tab === 'scm') { saveCall = self.api.createScmAcquisition(payload); }
    else if (tab === 'inventory') { saveCall = self.api.createInventoryAcquisition(payload); }
    else { saveCall = self.api.createDonationAcquisition(payload); }

    saveCall.subscribe(function(res: any) {
      self.saving.set(false);
      if (res && res.pendingApproval === true) {
        self.snackBar.open('Asset submitted for approval — awaiting review in Workflow Inbox', 'OK', {
          duration: 6000, horizontalPosition: 'end', verticalPosition: 'top'
        });
        self.cancelWizard();
        self.na = self.emptyForm();
        if (tab === 'scm') { self.loadScm(); }
        else if (tab === 'inventory') { self.loadInventory(); }
        return;
      }
      var newId = res?.assetRegisterItem_ID || res?.AssetRegisterItem_ID || res?.assetId || 0;
      self.snackBar.open('Asset ' + newId + ' registered successfully', 'View', {
        duration: 5000, horizontalPosition: 'end', verticalPosition: 'top'
      }).onAction().subscribe(function() {
        if (newId) self.router.navigate(['/assets/assets', newId]);
      });
      self.cancelWizard();
      self.na = self.emptyForm();
      if (tab === 'scm') { self.loadScm(); }
      else if (tab === 'inventory') { self.loadInventory(); }
      self.loadList();
      self.api.getSettings().subscribe(function(s: any) {
        var fy = (s && s.financial_year) ? s.financial_year : '2025/2026';
        self.api.rebuildTransactionSummary([newId], fy).subscribe(function() {}, function() {});
      }, function() {});
    }, function(err: any) {
      self.saving.set(false);
      self.snackBar.open('Error saving asset: ' + (err?.error?.message || err?.message || 'Unknown error'), 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
    });
  }

  formatCurrency(val: any): string {
    if (val === null || val === undefined) return '';
    var n = Number(val);
    if (isNaN(n)) return '';
    return 'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  isStepDone(stepKey: string): boolean {
    var steps = ['classification', 'dates', 'ownership', 'location', 'review'];
    var current = steps.indexOf(this.wizardStep());
    var target = steps.indexOf(stepKey);
    return target < current;
  }

  formatDate(val: any): string {
    if (!val) return '';
    return val.substring(0, 10);
  }
}
