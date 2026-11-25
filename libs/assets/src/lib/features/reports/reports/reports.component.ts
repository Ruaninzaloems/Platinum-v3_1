import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ApiService } from '../../../core/api.service';
import { OrgSettingsService } from '../../../core/org-settings.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTabsModule, MatProgressSpinnerModule, MatSnackBarModule, MatCheckboxModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  generating = signal(false);
  reportData = signal<any>(null);
  reportDate = new Date().toLocaleDateString('en-ZA');
  showFarFilters = signal(false);
  showDisposalFilters = signal(false);
  showDepFilters = signal(false);

  depFilters: any = {
    finYear: '',
    fromPeriod: 1,
    toPeriod: 12,
    typeId: '',
    categoryId: '',
    subCategoryId: '',
    measurementTypeId: '',
    statusId: '',
    assetItemId: '',
    acquisitionsOnly: false
  };

  depGenerating = signal(false);
  depReportData = signal<any[]>([]);
  depReportSubtitle = signal('');
  depReportGenerated = signal(false);
  depPage = signal(0);
  depPageSize = 20;
  depPagedRows: any;
  depTotalPages: any;

  farPage = signal(0);
  farPageSize = 20;
  farPagedRows: any;
  farTotalPages: any;

  drilldownVisible = signal(false);
  drilldownData = signal<any>(null);
  drilldownLoading = signal(false);
  drilldownAsset = signal<any>(null);

  txnDrilldownVisible = signal(false);
  txnDrilldownData = signal<any[]>([]);
  txnDrilldownLoading = signal(false);
  txnDrilldownPeriod = signal(0);
  txnDrilldownPeriodLabel = signal('');

  financialYearOptions = [
    '2022/2023', '2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028'
  ];

  periodOptions = [
    { value: 1, label: 'P1 — July' },
    { value: 2, label: 'P2 — August' },
    { value: 3, label: 'P3 — September' },
    { value: 4, label: 'P4 — October' },
    { value: 5, label: 'P5 — November' },
    { value: 6, label: 'P6 — December' },
    { value: 7, label: 'P7 — January' },
    { value: 8, label: 'P8 — February' },
    { value: 9, label: 'P9 — March' },
    { value: 10, label: 'P10 — April' },
    { value: 11, label: 'P11 — May' },
    { value: 12, label: 'P12 — June' },
  ];

  farFilters: any = {
    finYear: '',
    fromPeriod: 1,
    toPeriod: 12,
    typeId: '',
    categoryId: '',
    subCategoryId: '',
    measurementTypeId: '',
    statusId: '',
    assetItemId: '',
    acquisitionsOnly: false
  };

  disposalFilters: any = {
    finYear: '',
    fromPeriod: 1,
    toPeriod: 12,
    typeId: '',
    categoryId: '',
    subCategoryId: '',
    measurementTypeId: '',
    statusId: '',
    assetItemId: '',
    disposalMethodId: ''
  };

  disposalGenerating = signal(false);
  disposalReportData = signal<any[]>([]);
  disposalReportSubtitle = signal('');
  disposalReportGenerated = signal(false);
  disposalMethods = signal<any[]>([]);

  assetTypes = signal<any[]>([]);
  assetCategories = signal<any[]>([]);
  assetSubCategories = signal<any[]>([]);
  measurementTypes = signal<any[]>([]);
  assetStatuses = signal<any[]>([]);
  departments = signal<any[]>([]);

  showLocFilters = signal(false);
  locGenerating = signal(false);
  locReportGenerated = signal(false);
  locReportData = signal<any[]>([]);
  locFilters: any = {
    fromRoom: '',
    toRoom: '',
    custodianId: '',
    departmentId: '',
    divisionId: '',
    reportByRoom: true
  };
  locAllRooms: any[] = [];
  locCustodians: any[] = [];
  locDepartments: any[] = [];
  locAllDivisions: any[] = [];
  locFilteredDivisions: any[] = [];
  locFiltersLoaded = false;

  reportTypes = [
    { id: 'register', title: 'Financial Asset Register', description: 'Full 194-column FAR export (GRAP/mSCOA/MFMA compliant)', icon: 'inventory_2', color: 'blue', tags: ['GRAP 17', 'mSCOA', 'MFMA'] },
    { id: 'depreciation', title: 'Depreciation Schedule', description: 'Depreciation movement analysis', icon: 'trending_down', color: 'purple', tags: ['GRAP 17.67'] },
    { id: 'reconciliation', title: 'AFS Reconciliation', description: 'Cost, depreciation & carrying value reconciliation', icon: 'balance', color: 'green', tags: ['AFS Note', 'GRAP 17.88'] },
    { id: 'revaluation', title: 'Revaluation Reserve', description: 'Revaluation reserve movement by category', icon: 'auto_graph', color: 'purple', tags: ['GRAP 17.39-42', 'OCI'] },
    { id: 'condition', title: 'Condition Assessment', description: 'Physical condition of assets', icon: 'assessment', color: 'amber', tags: ['GRAP 17.41'] },
    { id: 'disposal', title: 'Disposal Report', description: 'Assets disposed with profit/loss analysis', icon: 'delete_sweep', color: 'red', tags: ['MFMA S.14'] },
    { id: 'location', title: 'Location Content Report', description: 'Assets per room grouped by building and floor', icon: 'location_on', color: 'amber', tags: ['Rooms', 'Custodian'] },
    { id: 'revaluation-txn', title: 'Revaluation Transactions', description: 'Approved revaluation transactions per asset', icon: 'price_change', color: 'blue', tags: ['GRAP 17.39', 'IAS 16'] },
    { id: 'impairment-txn', title: 'Impairment Report', description: 'Approved impairment transactions per asset', icon: 'trending_down', color: 'red', tags: ['GRAP 26', 'IAS 36'] },
    { id: 'impairment-reversal', title: 'Impairment Reversal Report', description: 'Impairment reversals per asset', icon: 'trending_up', color: 'green', tags: ['GRAP 26.79', 'IAS 36'] },
    { id: 'refurbishment', title: 'Refurbishment Report', description: 'Approved refurbishment transactions per asset', icon: 'build', color: 'amber', tags: ['GRAP 17.10', 'mSCOA'] },
    { id: 'prior-year-adj', title: 'Prior Year Adjustments', description: 'Approved prior year adjustment transactions', icon: 'history', color: 'purple', tags: ['GRAP 3', 'AFS Note'] },
    { id: 'prior-period-adj', title: 'Prior Period Adjustments', description: 'Approved prior period adjustment transactions', icon: 'update', color: 'green', tags: ['GRAP 3', 'mSCOA'] },
    { id: 'custom-far', title: 'Custom FAR', description: 'Select and order any of the 130+ FAR fields', icon: 'tune', color: 'teal', tags: ['Custom', 'FAR', 'GRAP 17'] },
    { id: 'measurement-model-compliance', title: 'Measurement Model Compliance Report', description: 'Assets whose measurement type conflicts with the current model', icon: 'rule', color: 'red', tags: ['GRAP 17', 'Compliance'] },
    { id: 'mscoa-prefix-errors', title: 'mSCOA Prefix Errors', description: 'mSCOA vote-field mappings whose SCOA account-code prefix does not match the required prefix rule', icon: 'error_outline', color: 'red', tags: ['mSCOA', 'Compliance', 'SCOA'] },
    { id: 'mscoa-missing-settings', title: 'Missing mSCOA Settings', description: 'Asset combinations that have no GL mapping for the selected financial year and transaction type', icon: 'search_off', color: 'orange', tags: ['mSCOA', 'Compliance', 'GL'] },
    { id: 'asset-gl', title: 'Asset GL Transactions', description: 'General ledger lines linked to asset transactions (mSCOA-coded)', icon: 'account_balance', color: 'teal', tags: ['GL', 'mSCOA', 'GRAP 17'] },
    { id: 'mscoa-settings', title: 'mSCOA Settings Report', description: 'All configured mSCOA vote field mappings with full SCOA codes per transaction slot', icon: 'settings', color: 'teal', tags: ['mSCOA', 'Compliance', 'GL'] },
    { id: 'asset-transfer', title: 'Asset Transfer Report', description: 'Bulk asset transfers: From/To classification, amounts transferred, and GL document numbers', icon: 'swap_horiz', color: 'blue', tags: ['mSCOA', 'GRAP 17', 'GL'] },
    { id: 'rul-adjustment-impact', title: 'RUL Adjustment Impact Report', description: 'Full-year depreciation before vs. after RUL adjustments — closing acc. dep., current value, and remaining RUL at year end', icon: 'trending_up', color: 'purple', tags: ['Depreciation', 'RUL', 'GRAP 17'] },
  ];

  showComplianceFilters = signal(false);
  complianceGenerating = signal(false);
  complianceReportGenerated = signal(false);
  complianceReportData = signal<any[]>([]);
  complianceOrgModel = signal<string>('');
  complianceReportSubtitle = signal('');
  compliancePage = signal(0);
  compliancePageSize = 20;
  complianceFilters: any = { typeId: '', categoryId: '', departmentId: '' };

  prefixViolGenerating = signal(false);
  prefixViolGenerated = signal(false);
  prefixViolData = signal<any[]>([]);
  prefixViolPage = signal(0);
  readonly prefixViolPageSize = 20;
  prefixViolFilters: any = { finYear: '', transactionType: '', assetType: '', category: '', subCategory: '', department: '', division: '' };

  showMissingMscoaFilters = signal(false);
  missingMscoaGenerating = signal(false);
  missingMscoaGenerated = signal(false);
  missingMscoaData = signal<any[]>([]);
  missingMscoaIncompleteData = signal<any[]>([]);
  missingMscoaUseDeptDiv = signal(false);
  missingMscoaPage = signal(0);
  readonly missingMscoaPageSize = 20;
  missingMscoaIncompletePage = signal(0);
  readonly missingMscoaIncompletePageSize = 20;
  missingMscoaFilters: any = { finYear: '', transactionTypeId: '' };
  transactionTypeDefs = signal<any[]>([]);

  prefixViolFilteredData(): any[] {
    const f = this.prefixViolFilters;
    return this.prefixViolData().filter((row: any) => {
      if (f.finYear && (row.finYear || '') !== f.finYear) return false;
      if (f.transactionType && (row.transactionTypeName || '') !== f.transactionType) return false;
      if (f.assetType && (row.assetTypeName || '') !== f.assetType) return false;
      if (f.category && (row.categoryName || '') !== f.category) return false;
      if (f.subCategory && (row.subCategoryName || '') !== f.subCategory) return false;
      if (f.department && (row.departmentName || '') !== f.department) return false;
      if (f.division && (row.divisionName || '') !== f.division) return false;
      return true;
    });
  }

  prefixViolUniqueValues(field: string): string[] {
    const seen = new Set<string>();
    this.prefixViolData().forEach((row: any) => { if (row[field]) seen.add(String(row[field])); });
    return Array.from(seen).sort();
  }

  onPrefixViolFilterChange(): void { this.prefixViolPage.set(0); }

  resetPrefixViolFilters(): void {
    this.prefixViolFilters = { finYear: '', transactionType: '', assetType: '', category: '', subCategory: '', department: '', division: '' };
    this.prefixViolPage.set(0);
  }

  revFilters: any = { finYear: '', fromPeriod: 1, toPeriod: 12, typeId: '', categoryId: '', subCategoryId: '', measurementTypeId: '', statusId: '', assetItemId: '' };
  impFilters: any = { finYear: '', fromPeriod: 1, toPeriod: 12, typeId: '', categoryId: '', subCategoryId: '', measurementTypeId: '', statusId: '', assetItemId: '' };
  impRevFilters: any = { finYear: '', fromPeriod: 1, toPeriod: 12, typeId: '', categoryId: '', subCategoryId: '', measurementTypeId: '', statusId: '', assetItemId: '' };
  refurbFilters: any = { finYear: '', fromPeriod: 1, toPeriod: 12, typeId: '', categoryId: '', subCategoryId: '', measurementTypeId: '', statusId: '', assetItemId: '' };
  pyaFilters: any = { finYear: '', fromPeriod: 1, toPeriod: 12, typeId: '', categoryId: '', subCategoryId: '', measurementTypeId: '', statusId: '', assetItemId: '' };
  ppaFilters: any = { finYear: '', fromPeriod: 1, toPeriod: 12, typeId: '', categoryId: '', subCategoryId: '', measurementTypeId: '', statusId: '', assetItemId: '' };

  showRevFilters = signal(false);
  revGenerating = signal(false);
  revReportData = signal<any[]>([]);
  revReportSubtitle = signal('');
  revReportGenerated = signal(false);

  showImpFilters = signal(false);
  impGenerating = signal(false);
  impReportData = signal<any[]>([]);
  impReportSubtitle = signal('');
  impReportGenerated = signal(false);

  showImpRevFilters = signal(false);
  impRevGenerating = signal(false);
  impRevReportData = signal<any[]>([]);
  impRevReportSubtitle = signal('');
  impRevReportGenerated = signal(false);

  showRefurbFilters = signal(false);
  refurbGenerating = signal(false);
  refurbReportData = signal<any[]>([]);
  refurbReportSubtitle = signal('');
  refurbReportGenerated = signal(false);

  showPyaFilters = signal(false);
  pyaGenerating = signal(false);
  pyaReportData = signal<any[]>([]);
  pyaReportSubtitle = signal('');
  pyaReportGenerated = signal(false);

  showPpaFilters = signal(false);
  ppaGenerating = signal(false);
  ppaReportData = signal<any[]>([]);
  ppaReportSubtitle = signal('');
  ppaReportGenerated = signal(false);

  showAssetGlFilters = signal(false);
  assetGlGenerating = signal(false);
  assetGlReportData = signal<any[]>([]);
  assetGlReportSubtitle = signal('');
  assetGlReportGenerated = signal(false);
  assetGlTransactionTypes = signal<any[]>([]);
  assetGlFinYears = signal<string[]>([]);
  assetGlProcessingMonths = signal<number[]>([]);
  assetGlFilters: any = { finYear: '', processingMonth: '', transactionTypeId: '' };

  showMscoaSettingsFilters = signal(false);
  mscoaSettingsGenerating = signal(false);
  mscoaSettingsGenerated = signal(false);
  mscoaSettingsData = signal<any[]>([]);
  mscoaSettingsSubtitle = signal('');
  mscoaSettingsPage = signal(0);
  readonly mscoaSettingsPageSize = 20;
  mscoaSettingsPagedRows: any;
  mscoaSettingsTotalPages: any;
  mscoaSettingsDepts = signal<any[]>([]);
  mscoaSettingsDivs = signal<any[]>([]);
  mscoaSettingsFilterCategories = signal<any[]>([]);
  mscoaSettingsFilterSubCategories = signal<any[]>([]);
  mscoaSettingsFilterDivisions = signal<any[]>([]);
  mscoaSettingsFilters: any = { finYear: '', typeId: '', categoryId: '', subCategoryId: '', departmentId: '', divisionId: '' };
  useDeptDivision = computed(() => this.orgSettings.settings()?.mscoa_use_dept_division !== false);

  showAfsFilters = signal(false);
  afsGenerating = signal(false);
  afsReportGenerated = signal(false);
  afsDisplayRows = signal<any[]>([]);
  afsReportSubtitle = signal('');
  afsFilters: any = { finYear: '' };

  afsDrilldownVisible = signal(false);
  afsDrilldownLoading = signal(false);
  afsDrilldownData = signal<any[]>([]);
  afsDrilldownCategoryDesc = signal('');
  afsDrilldownCategoryId = signal(0);

  readonly customFarDefaultKeys: string[] = [
    'AssetRegisterItem_ID', 'Description', 'AssetTypeDesc', 'AssetCategoryDesc',
    'Asset_SubCategoryDescription', 'AssetStatusDesc', 'MeasurementType',
    'AcquisitionDate', 'InserviceDate', 'CostRestatedOpeningBalance', 'Acquisitions',
    'CostClosingBalance', 'AccumulatedDepreciationOpeningBalance', 'Depreciation',
    'DepreciationClosingBalance', 'CarryingAmount'
  ];

  readonly customFarColumnCatalogue: {key: string; label: string; group: string}[] = [
    { key: 'FinYear', label: 'Financial Year', group: 'Identifiers' },
    { key: 'AssetRegisterItem_ID', label: 'Asset Register ID', group: 'Identifiers' },
    { key: 'MunicipalAssetID', label: 'Municipal Asset ID', group: 'Identifiers' },
    { key: 'ParentAssetRegisterItem_ID', label: 'Parent Asset Register ID', group: 'Identifiers' },
    { key: 'MainAssetID', label: 'Main Asset ID', group: 'Identifiers' },
    { key: 'GIS_ID', label: 'GIS ID', group: 'Identifiers' },
    { key: 'ErfNumber', label: 'Erf Number', group: 'Identifiers' },
    { key: 'AssetClass_ID', label: 'Asset Class ID', group: 'Identifiers' },
    { key: 'Asset_SubCategory_ID', label: 'Sub-Category ID', group: 'Identifiers' },
    { key: 'AssetCategory_ID', label: 'Category ID', group: 'Identifiers' },
    { key: 'AssetType_ID', label: 'Asset Type ID', group: 'Identifiers' },
    { key: 'AssetStatus_ID', label: 'Asset Status ID', group: 'Identifiers' },
    { key: 'Description', label: 'Description', group: 'Descriptions' },
    { key: 'MainAssetDescription', label: 'Main Asset Description', group: 'Descriptions' },
    { key: 'OldBarCode', label: 'Old Barcode', group: 'Descriptions' },
    { key: 'Barcode', label: 'Barcode', group: 'Descriptions' },
    { key: 'ImageRef', label: 'Image Reference', group: 'Descriptions' },
    { key: 'AssetTypeDesc', label: 'Asset Type', group: 'Classification' },
    { key: 'AssetCategoryDesc', label: 'Category', group: 'Classification' },
    { key: 'Asset_SubCategoryDescription', label: 'Sub-Category', group: 'Classification' },
    { key: 'AssetClassDesc', label: 'Asset Class', group: 'Classification' },
    { key: 'MeasurementType', label: 'Measurement Type', group: 'Classification' },
    { key: 'AssetStatusDesc', label: 'Asset Status', group: 'Classification' },
    { key: 'NatureOfAddition', label: 'Nature of Addition', group: 'Classification' },
    { key: 'InfrastructureNonInfrastructure', label: 'Infrastructure / Non-Infrastructure', group: 'Classification' },
    { key: 'CashNonCashGeneratingUnit', label: 'Cash / Non-Cash Generating Unit', group: 'Classification' },
    { key: 'FinancialStatusDesc', label: 'Financial Status', group: 'Classification' },
    { key: 'AssetCIDMSSubComponentTypeDesc', label: 'CIDMS Sub-Component Type', group: 'CIDMS' },
    { key: 'AssetCIDMSComponentTypeDesc', label: 'CIDMS Component Type', group: 'CIDMS' },
    { key: 'AssetAccountGroupDesc', label: 'Account Group', group: 'CIDMS' },
    { key: 'AssetAccountSubGroupDesc', label: 'Account Sub-Group', group: 'CIDMS' },
    { key: 'AssetCIDMSClassDesc', label: 'CIDMS Class', group: 'CIDMS' },
    { key: 'AssetCIDMSGroupTypeDesc', label: 'CIDMS Group Type', group: 'CIDMS' },
    { key: 'AssetCIDMSAssetTypeDesc', label: 'CIDMS Asset Type', group: 'CIDMS' },
    { key: 'TakeOnDate', label: 'Take-On Date', group: 'Dates' },
    { key: 'AcquisitionDate', label: 'Acquisition Date', group: 'Dates' },
    { key: 'DateofRefurbishmentImprovement', label: 'Date of Refurbishment / Improvement', group: 'Dates' },
    { key: 'InserviceDate', label: 'In-Service Date', group: 'Dates' },
    { key: 'DisposalDate', label: 'Disposal Date', group: 'Dates' },
    { key: 'DisposalReason', label: 'Disposal Reason', group: 'Dates' },
    { key: 'ImpairmentDate', label: 'Impairment Date', group: 'Dates' },
    { key: 'DateModified', label: 'Date Modified', group: 'Dates' },
    { key: 'VerificationDate', label: 'Verification Date', group: 'Dates' },
    { key: 'VerificationDoneBy', label: 'Verification Done By', group: 'Dates' },
    { key: 'YearConstructed', label: 'Year Constructed', group: 'Dates' },
    { key: 'CommisioningDate', label: 'Commissioning Date', group: 'Dates' },
    { key: 'ConstructionMaterial', label: 'Construction Material', group: 'Dates' },
    { key: 'ForecastReplacementYear', label: 'Forecast Replacement Year', group: 'Dates' },
    { key: 'AssetCondition', label: 'Asset Condition', group: 'Physical' },
    { key: 'InsuranceCover', label: 'Insurance Cover', group: 'Physical' },
    { key: 'InsurancePolicyNo', label: 'Insurance Policy No', group: 'Physical' },
    { key: 'Warranty', label: 'Warranty', group: 'Physical' },
    { key: 'CurrentReplacementCostCRC', label: 'Current Replacement Cost (CRC)', group: 'Physical' },
    { key: 'DepreciatedReplacementCostDRC', label: 'Depreciated Replacement Cost (DRC)', group: 'Physical' },
    { key: 'AnnualisedMaintenanceCRC', label: 'Annualised Maintenance (CRC)', group: 'Physical' },
    { key: 'AnnualMaintenanceBudgetNeed', label: 'Annual Maintenance Budget Need', group: 'Physical' },
    { key: 'AssetDepreciationMethodDesc', label: 'Depreciation Method', group: 'Useful Life' },
    { key: 'UsefulLifeYearComponent', label: 'Useful Life (Years)', group: 'Useful Life' },
    { key: 'UsefulLifeMonthComponent', label: 'Useful Life (Months)', group: 'Useful Life' },
    { key: 'UsefulLifeDaysComponent', label: 'Useful Life (Days)', group: 'Useful Life' },
    { key: 'RevisedUsefulLifeYearComponent', label: 'Revised Useful Life (Years)', group: 'Useful Life' },
    { key: 'RevisedUsefulLifeMonthComponent', label: 'Revised Useful Life (Months)', group: 'Useful Life' },
    { key: 'RevisedUsefulLifeDaysComponent', label: 'Revised Useful Life (Days)', group: 'Useful Life' },
    { key: 'RemainingUsefulLifeYearComponent', label: 'Remaining Useful Life (Years)', group: 'Useful Life' },
    { key: 'RemainingUsefulLifeMonthComponent', label: 'Remaining Useful Life (Months)', group: 'Useful Life' },
    { key: 'RemainingUsefulLifeDaysComponent', label: 'Remaining Useful Life (Days)', group: 'Useful Life' },
    { key: 'RemainingUsefulLifeAtTakeOn', label: 'Remaining Useful Life at Take-On', group: 'Useful Life' },
    { key: 'RevisedRemainingUsefulLifeYearComponent', label: 'Revised Remaining Useful Life (Years)', group: 'Useful Life' },
    { key: 'RevisedRemainingUsefulLifeMonthComponent', label: 'Revised Remaining Useful Life (Months)', group: 'Useful Life' },
    { key: 'RevisedRemainingUsefulLifeDaysComponent', label: 'Revised Remaining Useful Life (Days)', group: 'Useful Life' },
    { key: 'UoM', label: 'Unit of Measure', group: 'Dimensions' },
    { key: 'Dim1', label: 'Dimension 1', group: 'Dimensions' },
    { key: 'Dim2', label: 'Dimension 2', group: 'Dimensions' },
    { key: 'Dim3', label: 'Dimension 3', group: 'Dimensions' },
    { key: 'DimensionQuantity', label: 'Dimension Quantity', group: 'Dimensions' },
    { key: 'Quantity', label: 'Quantity', group: 'Dimensions' },
    { key: 'Diameter', label: 'Diameter', group: 'Dimensions' },
    { key: 'Capacity', label: 'Capacity', group: 'Dimensions' },
    { key: 'SGKey', label: 'SG Key', group: 'Land & Property' },
    { key: 'DeedNumber', label: 'Deed Number', group: 'Land & Property' },
    { key: 'ErfFarmNumber', label: 'Erf / Farm Number', group: 'Land & Property' },
    { key: 'ErfSizeM2', label: 'Erf Size (m\u00b2)', group: 'Land & Property' },
    { key: 'PortionNumber', label: 'Portion Number', group: 'Land & Property' },
    { key: 'UnitNumber', label: 'Unit Number', group: 'Land & Property' },
    { key: 'RegistrationNumber', label: 'Registration Number', group: 'Land & Property' },
    { key: 'SerialNumber', label: 'Serial Number', group: 'Land & Property' },
    { key: 'CustodianName', label: 'Custodian Name', group: 'Custodian & Grades' },
    { key: 'CustodianIDNumber', label: 'Custodian ID Number', group: 'Custodian & Grades' },
    { key: 'AssetMunicipalServicesDesc', label: 'Municipal Service', group: 'Custodian & Grades' },
    { key: 'AssetCriticalityGradeDesc', label: 'Criticality Grade', group: 'Custodian & Grades' },
    { key: 'AssetPerformanceGradeDesc', label: 'Performance Grade', group: 'Custodian & Grades' },
    { key: 'AssetUtilisationGradeDesc', label: 'Utilisation Grade', group: 'Custodian & Grades' },
    { key: 'AssetHealthGradeDesc', label: 'Health Grade', group: 'Custodian & Grades' },
    { key: 'ConsequenceOfFailure', label: 'Consequence of Failure', group: 'Custodian & Grades' },
    { key: 'Risk', label: 'Risk', group: 'Custodian & Grades' },
    { key: 'AssetOwnershipName', label: 'Ownership', group: 'Location' },
    { key: 'Department', label: 'Department', group: 'Location' },
    { key: 'Division', label: 'Division', group: 'Location' },
    { key: 'Town', label: 'Town', group: 'Location' },
    { key: 'StreetAddress', label: 'Street Address', group: 'Location' },
    { key: 'Building', label: 'Building', group: 'Location' },
    { key: 'Ward', label: 'Ward', group: 'Location' },
    { key: 'Zoning', label: 'Zoning', group: 'Location' },
    { key: 'Floor', label: 'Floor', group: 'Location' },
    { key: 'Room', label: 'Room', group: 'Location' },
    { key: 'Suburb', label: 'Suburb', group: 'Location' },
    { key: 'WellKnownTextWKT', label: 'WKT (GIS)', group: 'Location' },
    { key: 'Latitude', label: 'Latitude', group: 'Location' },
    { key: 'Longitude', label: 'Longitude', group: 'Location' },
    { key: 'FundingSourceAmount', label: 'Funding Source Amount', group: 'Funding' },
    { key: 'FundingSourceNumber', label: 'Funding Source Number', group: 'Funding' },
    { key: 'FundType', label: 'Fund Type', group: 'Funding' },
    { key: 'CostOfAddition', label: 'Cost of Addition', group: 'Funding' },
    { key: 'AccumulatedRevalutionsOpeningBalance', label: 'Acc. Revaluations OB', group: 'Revaluation Reserve' },
    { key: 'RevaluationReserveImpairmentOpeningBalance', label: 'Rev. Reserve Impairment OB', group: 'Revaluation Reserve' },
    { key: 'RevaluationReserveImpairments', label: 'Rev. Reserve Impairments', group: 'Revaluation Reserve' },
    { key: 'RevaluationReserveImpairmentReversals', label: 'Rev. Reserve Impairment Reversals', group: 'Revaluation Reserve' },
    { key: 'RevaluationReserveImpairmentClosingBalance', label: 'Rev. Reserve Impairment CB', group: 'Revaluation Reserve' },
    { key: 'RevaluationReserveRevaluations', label: 'Rev. Reserve Revaluations', group: 'Revaluation Reserve' },
    { key: 'RevaluationReserveDisposals', label: 'Rev. Reserve Disposals', group: 'Revaluation Reserve' },
    { key: 'RefurbRevaluation', label: 'Refurb Revaluation', group: 'Revaluation Reserve' },
    { key: 'AccumulatedRevaluationClosingBalance', label: 'Acc. Revaluation CB', group: 'Revaluation Reserve' },
    { key: 'MovementInRevaluationReserve', label: 'Movement in Revaluation Reserve', group: 'Revaluation Reserve' },
    { key: 'DepreciationOffsetOpeningBalance', label: 'Depreciation Offset OB', group: 'Revaluation Reserve' },
    { key: 'DepreciationOffset', label: 'Depreciation Offset', group: 'Revaluation Reserve' },
    { key: 'DepreciationOffsetClosingBalance', label: 'Depreciation Offset CB', group: 'Revaluation Reserve' },
    { key: 'RevaluationSurplusDeficit', label: 'Revaluation Surplus / Deficit', group: 'Revaluation Reserve' },
    { key: 'DeemedCost', label: 'Deemed Cost', group: 'Revaluation Reserve' },
    { key: 'CostRestatedOpeningBalance', label: 'Cost Restated OB', group: 'Cost' },
    { key: 'Acquisitions', label: 'Acquisitions', group: 'Cost' },
    { key: 'ResidualValue', label: 'Residual Value', group: 'Cost' },
    { key: 'RevisedResidualValue', label: 'Revised Residual Value', group: 'Cost' },
    { key: 'DecommisioningRestorationandSimilarLiabilities', label: 'Decommissioning / Restoration Liabilities', group: 'Cost' },
    { key: 'WorkInProgressAmount', label: 'Work in Progress', group: 'Cost' },
    { key: 'TransferFromAmount', label: 'Transfer Received', group: 'Cost' },
    { key: 'TransferToAmount', label: 'Transfer Made', group: 'Cost' },
    { key: 'RefurbDebitAmount', label: 'Refurb Debit Amount', group: 'Cost' },
    { key: 'RefurbCreditAmount', label: 'Refurb Credit Amount', group: 'Cost' },
    { key: 'ChangeinAccountingEstimate', label: 'Change in Accounting Estimate', group: 'Cost' },
    { key: 'FairValueAdjustment', label: 'Fair Value Adjustment', group: 'Cost' },
    { key: 'Revaluation', label: 'Revaluation', group: 'Cost' },
    { key: 'DisposalValue', label: 'Disposal Cost', group: 'Cost' },
    { key: 'CostClosingBalance', label: 'Cost Closing Balance', group: 'Cost' },
    { key: 'AccumulatedDepreciationOpeningBalance', label: 'Acc. Depreciation OB', group: 'Depreciation' },
    { key: 'DepreciationOtherChanges', label: 'Depreciation Other Changes', group: 'Depreciation' },
    { key: 'DepreciationRestatedOpeningBalance', label: 'Depreciation Restated OB', group: 'Depreciation' },
    { key: 'Depreciation', label: 'Depreciation', group: 'Depreciation' },
    { key: 'DepreciationAdjustments', label: 'Depreciation Adjustments', group: 'Depreciation' },
    { key: 'DisposalDepreciation', label: 'Disposal Depreciation', group: 'Depreciation' },
    { key: 'DepreciationTransfer', label: 'Depreciation Transfer', group: 'Depreciation' },
    { key: 'RefurbDepreciation', label: 'Refurb Depreciation', group: 'Depreciation' },
    { key: 'DepreciationClosingBalance', label: 'Depreciation Closing Balance', group: 'Depreciation' },
    { key: 'AccumulatedImpairmentOpeningBalance', label: 'Acc. Impairment OB', group: 'Impairment' },
    { key: 'ImpairmentOtherChanges', label: 'Impairment Other Changes', group: 'Impairment' },
    { key: 'ImpairmentRestatedOpeningBalance', label: 'Impairment Restated OB', group: 'Impairment' },
    { key: 'Impairment', label: 'Impairment', group: 'Impairment' },
    { key: 'ImpairmentReversal', label: 'Impairment Reversal', group: 'Impairment' },
    { key: 'DisposalImpairment', label: 'Disposal Impairment', group: 'Impairment' },
    { key: 'ImpairmentTransfers', label: 'Impairment Transfers', group: 'Impairment' },
    { key: 'ImpairmentClosingBalance', label: 'Impairment Closing Balance', group: 'Impairment' },
    { key: 'CarryingAmount', label: 'Carrying Amount', group: 'Carrying Amount' },
    { key: 'DisposalProceeds', label: 'Disposal Proceeds', group: 'Carrying Amount' },
    { key: 'DisposalProfitLoss', label: 'Disposal Profit / Loss', group: 'Carrying Amount' },
    { key: 'ReasonforAssetAdjustment', label: 'Reason for Asset Adjustment', group: 'Other' },
    { key: 'DonorIDRegistrationNumberParastatalCode', label: 'Donor ID / Parastatal Code', group: 'Other' },
    { key: 'DonorNameCompanyNameParastatalName', label: 'Donor Name / Parastatal Name', group: 'Other' },
    { key: 'DateDonated', label: 'Date Donated', group: 'Other' },
    { key: 'RULPY', label: 'RUL PY', group: 'Other' },
    { key: 'RULCY', label: 'RUL CY', group: 'Other' },
    { key: 'RULRevisedPY', label: 'RUL Revised PY', group: 'Other' },
    { key: 'RevisedULCY', label: 'Revised UL CY', group: 'Other' },
    { key: 'LastDateRULRevised', label: 'Last Date RUL Revised', group: 'Other' },
    { key: 'RULChangeReason', label: 'RUL Change Reason', group: 'Other' },
    { key: 'Make', label: 'Make', group: 'Other' },
    { key: 'Model', label: 'Model', group: 'Other' },
    { key: 'Custom_1', label: 'Custom 1', group: 'Custom Fields' },
    { key: 'Custom_2', label: 'Custom 2', group: 'Custom Fields' },
    { key: 'Custom_3', label: 'Custom 3', group: 'Custom Fields' },
    { key: 'Custom_4', label: 'Custom 4', group: 'Custom Fields' },
    { key: 'Custom_5', label: 'Custom 5', group: 'Custom Fields' },
    { key: 'Custom_6', label: 'Custom 6', group: 'Custom Fields' },
    { key: 'Custom_7', label: 'Custom 7', group: 'Custom Fields' },
    { key: 'Custom_8', label: 'Custom 8', group: 'Custom Fields' },
    { key: 'Custom_9', label: 'Custom 9', group: 'Custom Fields' },
  ];

  showCustomFarFilters = signal(false);
  customFarGenerating = signal(false);
  customFarReportGenerated = signal(false);
  customFarReportSubtitle = signal('');
  customFarReportRows = signal<any[]>([]);
  customFarActiveColumns = signal<string[]>([]);
  customFarSelectedKeys = signal<string[]>([]);
  customFarPage = signal(0);
  customFarPageSize = 20;
  customFarColumnSearch = '';
  customFarPagedRows: any;
  customFarTotalPages: any;

  customFarFilters: any = {
    finYear: '', fromPeriod: 1, toPeriod: 12,
    typeId: '', categoryId: '', subCategoryId: '',
    measurementTypeId: '', statusId: '', assetItemId: '',
    acquisitionsOnly: false
  };

  getReportIconColor(color: string): string {
    var map: Record<string, string> = {
      'blue': '#3b82f6', 'purple': '#8b5cf6', 'green': '#22c55e',
      'amber': '#f59e0b', 'red': '#ef4444', 'teal': '#14b8a6'
    };
    return map[color] || '#6366f1';
  }

  constructor(private api: ApiService, private snackBar: MatSnackBar, public orgSettings: OrgSettingsService) {
    this.farPagedRows = computed(() => {
      var data = this.reportData();
      if (!data || !data.rows) return [];
      var start = this.farPage() * this.farPageSize;
      var end = start + this.farPageSize;
      var result: any[] = [];
      for (var i = start; i < end && i < data.rows.length; i++) {
        result.push(data.rows[i]);
      }
      return result;
    });
    this.farTotalPages = computed(() => {
      var data = this.reportData();
      if (!data || !data.rows || data.rows.length === 0) return 0;
      return Math.ceil(data.rows.length / this.farPageSize);
    });
    this.depPagedRows = computed(() => {
      var data = this.depReportData();
      if (!data || data.length === 0) return [];
      var start = this.depPage() * this.depPageSize;
      var end = start + this.depPageSize;
      var result: any[] = [];
      for (var i = start; i < end && i < data.length; i++) {
        result.push(data[i]);
      }
      return result;
    });
    this.depTotalPages = computed(() => {
      var data = this.depReportData();
      if (!data || data.length === 0) return 0;
      return Math.ceil(data.length / this.depPageSize);
    });
    this.customFarPagedRows = computed(() => {
      var rows = this.customFarReportRows();
      var start = this.customFarPage() * this.customFarPageSize;
      var end = start + this.customFarPageSize;
      var result: any[] = [];
      for (var i = start; i < end && i < rows.length; i++) {
        result.push(rows[i]);
      }
      return result;
    });
    this.customFarTotalPages = computed(() => {
      var rows = this.customFarReportRows();
      if (!rows || rows.length === 0) return 0;
      return Math.ceil(rows.length / this.customFarPageSize);
    });
    this.mscoaSettingsPagedRows = computed(() => {
      var data = this.mscoaSettingsData();
      if (!data || data.length === 0) return [];
      var start = this.mscoaSettingsPage() * this.mscoaSettingsPageSize;
      var end = start + this.mscoaSettingsPageSize;
      var result: any[] = [];
      for (var i = start; i < end && i < data.length; i++) { result.push(data[i]); }
      return result;
    });
    this.mscoaSettingsTotalPages = computed(() => {
      var data = this.mscoaSettingsData();
      if (!data || data.length === 0) return 0;
      return Math.ceil(data.length / this.mscoaSettingsPageSize);
    });
  }

  ngOnInit() {
    this.api.getSettings().subscribe({
      next: function(this: ReportsComponent, s: any) {
        if (s && s.financial_year) {
          this.farFilters.finYear = s.financial_year;
          this.disposalFilters.finYear = s.financial_year;
          this.depFilters.finYear = s.financial_year;
          this.revFilters.finYear = s.financial_year;
          this.impFilters.finYear = s.financial_year;
          this.impRevFilters.finYear = s.financial_year;
          this.refurbFilters.finYear = s.financial_year;
          this.pyaFilters.finYear = s.financial_year;
          this.ppaFilters.finYear = s.financial_year;
          this.afsFilters.finYear = s.financial_year;
          this.customFarFilters.finYear = s.financial_year;
        }
        var period = (s && s.current_period_month) ? s.current_period_month : ((s && s.current_period) ? s.current_period : 0);
        if (period) {
          this.farFilters.toPeriod = period;
          this.disposalFilters.toPeriod = period;
          this.depFilters.toPeriod = period;
          this.revFilters.toPeriod = period;
          this.impFilters.toPeriod = period;
          this.impRevFilters.toPeriod = period;
          this.refurbFilters.toPeriod = period;
          this.pyaFilters.toPeriod = period;
          this.ppaFilters.toPeriod = period;
          this.customFarFilters.toPeriod = period;
        }
      }.bind(this)
    });
    this.api.getAssetTypes().subscribe({ next: function(this: ReportsComponent, d: any[]) { this.assetTypes.set(d); }.bind(this) });
    this.api.getCategories().subscribe({ next: function(this: ReportsComponent, d: any) { this.assetCategories.set(d); }.bind(this) });
    this.api.getAssetSubCategoriesList().subscribe({ next: function(this: ReportsComponent, d: any[]) { this.assetSubCategories.set(d); }.bind(this) });
    this.api.getMeasurementTypes().subscribe({ next: function(this: ReportsComponent, d: any[]) { this.measurementTypes.set(d); }.bind(this) });
    this.api.getAssetStatuses().subscribe({ next: function(this: ReportsComponent, d: any[]) { this.assetStatuses.set(d); }.bind(this) });
    this.api.getDisposalMethods().subscribe({ next: function(this: ReportsComponent, d: any[]) { this.disposalMethods.set(d); }.bind(this) });
    this.api.getDepartments().subscribe({ next: function(this: ReportsComponent, d: any) { var arr = Array.isArray(d) ? d : (d && d.data ? d.data : []); this.departments.set(arr); }.bind(this), error: function() {} });
  }

  isValueCol(col: string): boolean {
    return col.indexOf('(R)') >= 0 || col.indexOf('Value') >= 0 || col.indexOf('Cost') >= 0 || col.indexOf('Depreciation') >= 0 || col.indexOf('Reserve') >= 0 || col.indexOf('Carrying') >= 0 || col.indexOf('Amount') >= 0;
  }

  isSubtotalRow(row: any): boolean {
    const firstCol = Object.values(row)[0] as string;
    return firstCol === 'TOTAL' || (typeof firstCol === 'string' && firstCol.startsWith('TOTAL'));
  }

  formatRand(val: number): string {
    if (val == null || isNaN(val)) return 'R 0.00';
    return 'R ' + val.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDisposalNum(val: number): string {
    if (val == null || isNaN(val)) return '0.00';
    return val.toFixed(2);
  }

  formatDepNum(val: number): string {
    if (val == null || isNaN(val)) return '0';
    return val % 1 === 0 ? String(Math.round(val)) : val.toFixed(2);
  }

  farColumns: string[] = [];
  farData: any[] = [];

  openFarFilters() {
    this.reportData.set(null);
    this.showFarFilters.set(true);
  }

  applyFarFilters() {
    this.showFarFilters.set(false);
    this.generating.set(true);
    this.reportData.set(null);
    this.reportDate = new Date().toLocaleDateString('en-ZA');
    this.generateFarReport();
  }

  openDisposalFilters() {
    this.disposalReportData.set([]);
    this.disposalReportSubtitle.set('');
    this.disposalReportGenerated.set(false);
    this.showDisposalFilters.set(true);
    this.showFarFilters.set(false);
    this.showDepFilters.set(false);
  }

  applyDisposalFilters() {
    this.showDisposalFilters.set(false);
    this.disposalGenerating.set(true);
    this.disposalReportData.set([]);
    this.disposalReportSubtitle.set('');
    this.disposalReportGenerated.set(false);
    var self = this;
    var finYear = this.disposalFilters.finYear || this.getActiveFinancialYear();
    var params: any = { finYear: finYear, fromPeriod: this.disposalFilters.fromPeriod, toPeriod: this.disposalFilters.toPeriod };
    if (this.disposalFilters.typeId) { params.typeId = this.disposalFilters.typeId; }
    if (this.disposalFilters.categoryId) { params.categoryId = this.disposalFilters.categoryId; }
    if (this.disposalFilters.subCategoryId) { params.subCategoryId = this.disposalFilters.subCategoryId; }
    if (this.disposalFilters.measurementTypeId) { params.measurementTypeId = this.disposalFilters.measurementTypeId; }
    if (this.disposalFilters.statusId) { params.statusId = this.disposalFilters.statusId; }
    if (this.disposalFilters.assetItemId) { params.assetItemId = this.disposalFilters.assetItemId; }
    if (this.disposalFilters.disposalMethodId) { params.disposalMethodId = this.disposalFilters.disposalMethodId; }
    this.api.getDisposalReport(params).subscribe({
      next: function(res: any) {
        var data: any[] = Array.isArray(res) ? res : (res.data || []);
        self.disposalReportData.set(data);
        var periodLabel = 'P' + (self.disposalFilters.fromPeriod || 1) + '\u2013P' + (self.disposalFilters.toPeriod || 12);
        self.disposalReportSubtitle.set('MFMA S.14 Disposal Report \u2014 FY ' + finYear + ' ' + periodLabel + ' \u2014 ' + data.length + ' records');
        self.disposalGenerating.set(false);
        self.disposalReportGenerated.set(true);
      },
      error: function() {
        self.disposalGenerating.set(false);
        self.snackBar.open('Failed to generate Disposal Report', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  openDepFilters() {
    this.depReportData.set([]);
    this.depReportSubtitle.set('');
    this.depReportGenerated.set(false);
    this.showDepFilters.set(true);
    this.showFarFilters.set(false);
    this.showDisposalFilters.set(false);
  }

  applyDepFilters() {
    this.showDepFilters.set(false);
    this.depGenerating.set(true);
    this.depReportData.set([]);
    this.depReportSubtitle.set('');
    this.depReportGenerated.set(false);
    var self = this;
    var finYear = this.depFilters.finYear || this.getActiveFinancialYear();
    var params: any = { finYear: finYear };
    if (this.depFilters.fromPeriod) { params.fromPeriod = this.depFilters.fromPeriod; }
    if (this.depFilters.toPeriod) { params.toPeriod = this.depFilters.toPeriod; }
    if (this.depFilters.typeId) { params.typeId = this.depFilters.typeId; }
    if (this.depFilters.categoryId) { params.categoryId = this.depFilters.categoryId; }
    if (this.depFilters.subCategoryId) { params.subCategoryId = this.depFilters.subCategoryId; }
    if (this.depFilters.measurementTypeId) { params.measurementTypeId = this.depFilters.measurementTypeId; }
    if (this.depFilters.statusId) { params.statusId = this.depFilters.statusId; }
    if (this.depFilters.assetItemId) { params.assetId = this.depFilters.assetItemId; }
    if (this.depFilters.acquisitionsOnly) {
      params.acquisitionsOnly = true;
      if (!this.depFilters.finYear) { params.acquisitionsAllYears = true; }
    }
    this.api.getDepreciationScheduleReport(params).subscribe({
      next: function(res: any) {
        var data: any[] = Array.isArray(res) ? res : (res.data || []);
        self.depPage.set(0);
        self.depReportData.set(data);
        var periodLabel = 'P' + (self.depFilters.fromPeriod || 1) + '\u2013P' + (self.depFilters.toPeriod || 12);
        self.depReportSubtitle.set('Depreciation movement for FY ' + finYear + ' ' + periodLabel + ' \u2014 ' + data.length + ' records');
        self.depGenerating.set(false);
        self.depReportGenerated.set(true);
      },
      error: function() {
        self.depGenerating.set(false);
        self.snackBar.open('Failed to generate Depreciation Schedule', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  openLocFilters() {
    var self = this;
    self.locReportData.set([]);
    self.locReportGenerated.set(false);
    self.showLocFilters.set(true);
    self.showFarFilters.set(false);
    self.showDepFilters.set(false);
    self.showDisposalFilters.set(false);
    if (!self.locFiltersLoaded) {
      self.api.getLocationContentFilters().subscribe({
        next: function(res: any) {
          self.locAllRooms = res.rooms || [];
          self.locCustodians = res.custodians || [];
          self.locDepartments = res.departments || [];
          self.locAllDivisions = res.divisions || [];
          self.locFilteredDivisions = self.locAllDivisions.slice();
          self.locFiltersLoaded = true;
        },
        error: function() {}
      });
    }
  }

  onLocDepartmentChange() {
    var self = this;
    var depId = self.locFilters.departmentId;
    if (!depId) {
      self.locFilteredDivisions = self.locAllDivisions.slice();
    } else {
      var filtered: any[] = [];
      for (var i = 0; i < self.locAllDivisions.length; i++) {
        if (String(self.locAllDivisions[i].departmentId) === String(depId)) {
          filtered.push(self.locAllDivisions[i]);
        }
      }
      self.locFilteredDivisions = filtered;
    }
    self.locFilters.divisionId = '';
  }

  applyLocFilters() {
    var self = this;
    self.showLocFilters.set(false);
    self.locGenerating.set(true);
    self.locReportData.set([]);
    self.locReportGenerated.set(false);
    var filters: any = {};
    if (self.locFilters.fromRoom) filters.fromRoom = self.locFilters.fromRoom;
    if (self.locFilters.toRoom) filters.toRoom = self.locFilters.toRoom;
    if (self.locFilters.custodianId) filters.custodianId = self.locFilters.custodianId;
    if (self.locFilters.departmentId) filters.departmentId = self.locFilters.departmentId;
    if (self.locFilters.divisionId) filters.divisionId = self.locFilters.divisionId;
    self.api.getLocationContentReport(filters).subscribe({
      next: function(rows: any[]) {
        self.locReportData.set(rows);
        self.locGenerating.set(false);
        self.locReportGenerated.set(true);
      },
      error: function() {
        self.locGenerating.set(false);
        self.snackBar.open('Failed to generate Location Content Report', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  locGroupByRoom(rows: any[]): any[] {
    var map: Record<string, any> = {};
    var order: string[] = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var key = String(r.roomId);
      if (!map[key]) {
        map[key] = { roomId: r.roomId, roomDesc: r.roomDesc, floorDesc: r.floorDesc, buildingDesc: r.buildingDesc, items: [] };
        order.push(key);
      }
      map[key].items.push(r);
    }
    var result: any[] = [];
    for (var j = 0; j < order.length; j++) { result.push(map[order[j]]); }
    return result;
  }

  locFmtRand(v: any): string {
    var n = Number(v || 0);
    return 'R\u00a0' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  locFmtQty(v: any): string {
    var n = Number(v || 0);
    return n % 1 === 0 ? String(Math.round(n)) : n.toFixed(2);
  }

  locEsc(s: any): string {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  printLocReport() {
    var self = this;
    var rows = self.locReportData();
    if (!rows || rows.length === 0) return;
    var reportByRoom = !!self.locFilters.reportByRoom;
    var html: string;
    if (reportByRoom) {
      var groups = self.locGroupByRoom(rows);
      html = self.buildLocPrintHtml(rows, groups);
    } else {
      html = self.buildLocFlatPrintHtml(rows);
    }
    var w = window.open('', '_blank', 'width=900,height=700');
    if (w) {
      var win: Window = w;
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(function() { win.print(); }, 600);
    }
  }

  buildLocPrintHtml(rows: any[], groups: any[]): string {
    var self = this;
    var today = new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });
    var grandTotal = 0;
    for (var k = 0; k < rows.length; k++) { grandTotal += Number(rows[k].carryingValue || 0); }

    var hdrHtml = '<div class="hdr">' +
      '<div class="hdr-left"><h1>MNQUMA LOCAL MUNICIPALITY (EC122)</h1><h2>LOCATION CONTENT REPORT — BY ROOM</h2></div>' +
      '<div class="hdr-right">Generated: ' + today + '<br>MFMA / GRAP Compliant</div>' +
      '</div>';

    var roomHtml = '';
    for (var g = 0; g < groups.length; g++) {
      var grp = groups[g];
      var roomTotal = 0;
      for (var ri = 0; ri < grp.items.length; ri++) { roomTotal += Number(grp.items[ri].carryingValue || 0); }

      var locParts: string[] = [];
      if (grp.buildingDesc) locParts.push('<b>Building:</b> ' + self.locEsc(grp.buildingDesc));
      if (grp.floorDesc) locParts.push('<b>Floor:</b> ' + self.locEsc(grp.floorDesc));
      locParts.push('<b>Room:</b> ' + self.locEsc(grp.roomDesc));

      var rowsHtml = '';
      for (var ri2 = 0; ri2 < grp.items.length; ri2++) {
        var item = grp.items[ri2];
        var mm = [item.make, item.model].filter(function(x: string) { return !!x; }).join(' / ');
        rowsHtml += '<tr>' +
          '<td>' + self.locEsc(item.description) + '</td>' +
          '<td>' + self.locEsc(item.assetType) + '</td>' +
          '<td>' + self.locEsc(item.assetCategory) + '</td>' +
          '<td>' + self.locEsc(item.barcode) + '</td>' +
          '<td>' + self.locEsc(item.serialNumber) + '</td>' +
          '<td>' + self.locEsc(mm) + '</td>' +
          '<td>' + self.locEsc(item.custodianName) + '</td>' +
          '<td>' + self.locEsc(item.departmentDesc) + '</td>' +
          '<td class="num">' + self.locFmtQty(item.quantity) + (item.quantityCaption ? ' ' + self.locEsc(item.quantityCaption) : '') + '</td>' +
          '<td class="num">' + self.locFmtRand(item.carryingValue) + '</td>' +
          '</tr>';
      }

      roomHtml += '<div class="room-block">' +
        hdrHtml +
        '<div class="room-header">' + locParts.join(' &nbsp;|&nbsp; ') + '</div>' +
        '<table>' +
        '<thead><tr>' +
        '<th>Description</th><th>Asset Type</th><th>Category</th><th>Barcode</th>' +
        '<th>Serial No.</th><th>Make / Model</th><th>Custodian</th><th>Department</th>' +
        '<th class="num">Qty</th><th class="num">Carrying Value</th>' +
        '</tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
        '<tfoot><tr>' +
        '<td colspan="8" style="font-weight:600">Room Total — ' + grp.items.length + ' asset(s)</td>' +
        '<td></td>' +
        '<td class="num" style="font-weight:700">' + self.locFmtRand(roomTotal) + '</td>' +
        '</tr></tfoot>' +
        '</table></div>';
    }

    var grandTotalHtml = '<div class="grand">Grand Total — ' + rows.length + ' asset(s) across ' + groups.length + ' room(s)' +
      '<span>' + self.locFmtRand(grandTotal) + '</span></div>';

    return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<title>Location Content Report</title>' +
      '<style>' +
      '*{box-sizing:border-box;margin:0;padding:0}' +
      'body{font-family:Arial,sans-serif;font-size:10px;color:#1e293b;padding:16mm 12mm}' +
      '.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1e40af;padding-bottom:10px;margin-bottom:14px}' +
      '.hdr-left h1{font-size:14px;font-weight:700;color:#1e40af}.hdr-left h2{font-size:10px;font-weight:600;color:#374151;margin-top:2px}' +
      '.hdr-right{font-size:9px;color:#64748b;text-align:right}' +
      '.room-block{margin-bottom:0}.room-block + .room-block{page-break-before:always;margin-top:0}' +
      '.room-header{background:#1e40af;color:white;padding:5px 10px;font-size:9px;font-weight:600;border-radius:4px 4px 0 0}' +
      'table{width:100%;border-collapse:collapse;font-size:8.5px}' +
      'thead tr{background:#dbeafe;color:#1e3a8a}' +
      'th{padding:4px 6px;border:1px solid #bfdbfe;text-align:left;font-weight:700}' +
      'td{padding:3px 6px;border:1px solid #e2e8f0;vertical-align:top}' +
      'tbody tr:nth-child(even){background:#f8fafc}' +
      'tfoot tr{background:#f1f5f9}' +
      'tfoot td{border:1px solid #cbd5e1;font-size:8.5px;color:#374151}' +
      '.num{text-align:right}' +
      '.grand{margin-top:20px;padding:10px 14px;background:#1e40af;color:white;border-radius:6px;display:flex;justify-content:space-between;font-size:11px;font-weight:700}' +
      '@media print{body{padding:10mm 8mm}.room-block{page-break-inside:avoid}' +
      '*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}' +
      '</style></head><body>' + roomHtml + grandTotalHtml + '</body></html>';
  }

  buildLocFlatPrintHtml(rows: any[]): string {
    var self = this;
    var today = new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });
    var grandTotal = 0;
    for (var k = 0; k < rows.length; k++) { grandTotal += Number(rows[k].carryingValue || 0); }

    var rowsHtml = '';
    for (var i = 0; i < rows.length; i++) {
      var item = rows[i];
      var mm = [item.make, item.model].filter(function(x: string) { return !!x; }).join(' / ');
      rowsHtml += '<tr>' +
        '<td>' + self.locEsc(item.buildingDesc) + '</td>' +
        '<td>' + self.locEsc(item.floorDesc) + '</td>' +
        '<td>' + self.locEsc(item.roomDesc) + '</td>' +
        '<td>' + self.locEsc(item.description) + '</td>' +
        '<td>' + self.locEsc(item.assetType) + '</td>' +
        '<td>' + self.locEsc(item.assetCategory) + '</td>' +
        '<td>' + self.locEsc(item.barcode) + '</td>' +
        '<td>' + self.locEsc(item.serialNumber) + '</td>' +
        '<td>' + self.locEsc(mm) + '</td>' +
        '<td>' + self.locEsc(item.custodianName) + '</td>' +
        '<td>' + self.locEsc(item.departmentDesc) + '</td>' +
        '<td class="num">' + self.locFmtQty(item.quantity) + (item.quantityCaption ? ' ' + self.locEsc(item.quantityCaption) : '') + '</td>' +
        '<td class="num">' + self.locFmtRand(item.carryingValue) + '</td>' +
        '</tr>';
    }

    return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<title>Location Content Report</title>' +
      '<style>' +
      '*{box-sizing:border-box;margin:0;padding:0}' +
      'body{font-family:Arial,sans-serif;font-size:10px;color:#1e293b;padding:16mm 12mm}' +
      '.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1e40af;padding-bottom:10px;margin-bottom:14px}' +
      '.hdr-left h1{font-size:14px;font-weight:700;color:#1e40af}.hdr-left h2{font-size:10px;font-weight:600;color:#374151;margin-top:2px}' +
      '.hdr-right{font-size:9px;color:#64748b;text-align:right}' +
      'table{width:100%;border-collapse:collapse;font-size:8.5px;margin-top:4px}' +
      'thead tr{background:#dbeafe;color:#1e3a8a}' +
      'th{padding:4px 6px;border:1px solid #bfdbfe;text-align:left;font-weight:700}' +
      'td{padding:3px 6px;border:1px solid #e2e8f0;vertical-align:top}' +
      'tbody tr:nth-child(even){background:#f8fafc}' +
      '.num{text-align:right}' +
      '.grand{margin-top:20px;padding:10px 14px;background:#1e40af;color:white;border-radius:6px;display:flex;justify-content:space-between;font-size:11px;font-weight:700}' +
      '@media print{body{padding:10mm 8mm}' +
      '*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}' +
      '</style></head><body>' +
      '<div class="hdr">' +
      '<div class="hdr-left"><h1>MNQUMA LOCAL MUNICIPALITY (EC122)</h1><h2>LOCATION CONTENT REPORT — FLAT LIST</h2></div>' +
      '<div class="hdr-right">Generated: ' + today + '<br>MFMA / GRAP Compliant</div>' +
      '</div>' +
      '<table>' +
      '<thead><tr>' +
      '<th>Building</th><th>Floor</th><th>Room</th><th>Description</th><th>Asset Type</th><th>Category</th>' +
      '<th>Barcode</th><th>Serial No.</th><th>Make / Model</th><th>Custodian</th><th>Department</th>' +
      '<th class="num">Qty</th><th class="num">Carrying Value</th>' +
      '</tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody>' +
      '</table>' +
      '<div class="grand">Grand Total — ' + rows.length + ' asset(s)' +
      '<span>' + self.locFmtRand(grandTotal) + '</span></div>' +
      '</body></html>';
  }

  depColumns = computed(() => {
    var isCostModel = this.orgSettings.settings()?.measurement_model?.toLowerCase() === 'cost model';
    var cols = [
      'Asset Register Item ID', 'Asset Description', 'Asset Type', 'Asset Category', 'Asset Sub-Category',
      'Asset Class', 'Measurement Type', 'Asset Status', 'Financial Status', 'Asset Condition',
      'Depreciation Method', 'General Ledger Document Number', 'In Service Date', 'Scheduled Date',
      'Transaction Date (DepreciationDate)', 'AR Processing Month', 'GL Processing Month',
      'Useful Life (Months)', 'Useful Life (Days)', 'Remaining Useful Life (Months)', 'Remaining Useful Life (Days)',
      'Days From Last Run', 'Purchase Amount (R)',
      'Accumulated Depreciation Opening (R)', 'Accumulated Depreciation Closing (R)',
      'Accumulated Depreciation Current Year (R)', 'Depreciation Value (R)',
    ];
    if (!isCostModel) {
      cols.push('Depreciation Offset Opening Balance (R)', 'Depreciation Offset (R)', 'Depreciation Offset Closing Balance (R)');
    }
    cols.push(
      'Carrying Value (R)',
      'Planning Project (Debit)', 'SCOA Item Code (Debit)', 'Planning Project (Credit)', 'SCOA Item Code (Credit)',
      'Approve Status'
    );
    return cols;
  });

  depRowValue(row: any, col: string): string {
    var map: Record<string, string> = {
      'Asset Register Item ID': 'assetId',
      'Asset Description': 'description',
      'Asset Type': 'assetType',
      'Asset Category': 'assetCategory',
      'Asset Sub-Category': 'assetSubCategory',
      'Asset Class': 'assetClass',
      'Measurement Type': 'measurementType',
      'Asset Status': 'assetStatus',
      'Financial Status': 'financialStatus',
      'Asset Condition': 'assetCondition',
      'Depreciation Method': 'depreciationMethod',
      'General Ledger Document Number': 'documentNumber',
      'In Service Date': 'inServiceDate',
      'Scheduled Date': 'scheduledDate',
      'Transaction Date (DepreciationDate)': 'transactionDate',
      'AR Processing Month': 'arProcessingMonth',
      'GL Processing Month': 'glProcessingMonth',
      'Useful Life (Months)': 'usefulLifeMonths',
      'Useful Life (Days)': 'usefulLifeDays',
      'Remaining Useful Life (Months)': 'remainingUsefulLifeMonths',
      'Remaining Useful Life (Days)': 'remainingUsefulLifeDays',
      'Days From Last Run': 'daysFromLastRun',
      'Purchase Amount (R)': 'purchaseAmount',
      'Accumulated Depreciation Opening (R)': 'accDepOpening',
      'Accumulated Depreciation Closing (R)': 'accDepClosing',
      'Accumulated Depreciation Current Year (R)': 'accDepCurrentYear',
      'Depreciation Value (R)': 'depreciationValue',
      'Depreciation Offset Opening Balance (R)': 'depOffsetOpening',
      'Depreciation Offset (R)': 'depOffset',
      'Depreciation Offset Closing Balance (R)': 'depOffsetClosing',
      'Carrying Value (R)': 'carryingValue',
      'Planning Project (Debit)': 'planProjectDebit',
      'SCOA Item Code (Debit)': 'scoaItemCodeDebit',
      'Planning Project (Credit)': 'planProjectCredit',
      'SCOA Item Code (Credit)': 'scoaItemCodeCredit',
      'Approve Status': 'approveStatus'
    };
    var key = map[col];
    if (!key) return '';
    var val = row[key];
    if (val === null || val === undefined) return '';
    if (col === 'Asset Register Item ID' || col === 'AR Processing Month' || col === 'GL Processing Month' ||
        col === 'Useful Life (Months)' || col === 'Useful Life (Days)' ||
        col === 'Remaining Useful Life (Months)' || col === 'Remaining Useful Life (Days)' ||
        col === 'Days From Last Run') {
      return String(val);
    }
    if (col === 'Asset Description' || col === 'Asset Type' || col === 'Asset Category' ||
        col === 'Asset Sub-Category' || col === 'Asset Class' || col === 'Measurement Type' ||
        col === 'Asset Status' || col === 'Financial Status' || col === 'Asset Condition' ||
        col === 'Depreciation Method' || col === 'General Ledger Document Number' ||
        col === 'Planning Project (Debit)' || col === 'SCOA Item Code (Debit)' ||
        col === 'Planning Project (Credit)' || col === 'SCOA Item Code (Credit)' ||
        col === 'Approve Status') {
      return String(val);
    }
    if (col === 'In Service Date' || col === 'Scheduled Date' || col === 'Transaction Date (DepreciationDate)') {
      if (!val) return '';
      var d = new Date(val);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-ZA');
    }
    return this.formatDepNum(Number(val));
  }

  isDepValueCol(col: string): boolean {
    if (col.indexOf('(R)') >= 0) return true;
    return col === 'Useful Life (Months)' || col === 'Useful Life (Days)' ||
      col === 'Remaining Useful Life (Months)' || col === 'Remaining Useful Life (Days)' ||
      col === 'Days From Last Run' || col === 'AR Processing Month' || col === 'GL Processing Month';
  }

  exportDepExcel() {
    var self = this;
    var data = this.depReportData();
    if (!data || data.length === 0) return;
    var cols = this.depColumns();
    var wsData: any[][] = [];
    wsData.push([]);
    wsData.push(['Depreciation Schedule']);
    wsData.push(['FY ' + (this.depFilters.finYear || this.getActiveFinancialYear())]);
    wsData.push(['Generated: ' + new Date().toLocaleDateString('en-ZA')]);
    wsData.push(['Records: ' + data.length]);
    wsData.push([]);
    wsData.push(cols);
    for (var ri = 0; ri < data.length; ri++) {
      var rowArr: any[] = [];
      for (var ci = 0; ci < cols.length; ci++) {
        rowArr.push(self.depRowValue(data[ri], cols[ci]));
      }
      wsData.push(rowArr);
    }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    var colWidths: any[] = [];
    for (var wi = 0; wi < cols.length; wi++) { colWidths.push({ wch: 22 }); }
    ws['!cols'] = colWidths;
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Depreciation Schedule');
    var fileName = 'depreciation_schedule_' + new Date().toISOString().split('T')[0] + '.xlsx';
    XLSX.writeFile(wb, fileName);
    this.snackBar.open('Exported ' + data.length + ' records to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  exportDepCsv() {
    var self = this;
    var data = this.depReportData();
    if (!data || data.length === 0) return;
    var cols = this.depColumns();
    var lines: string[] = [];
    lines.push(cols.map(function(c: string) { return '"' + c.replace(/"/g, '""') + '"'; }).join(','));
    for (var ri = 0; ri < data.length; ri++) {
      var cells: string[] = [];
      for (var ci = 0; ci < cols.length; ci++) {
        var v = self.depRowValue(data[ri], cols[ci]);
        if (v === null || v === undefined || v === '') { cells.push(''); }
        else { cells.push('"' + String(v).replace(/"/g, '""') + '"'); }
      }
      lines.push(cells.join(','));
    }
    var csv = lines.join('\r\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'depreciation_schedule_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.snackBar.open('Exported ' + data.length + ' records to CSV', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  disposalColumns(): string[] {
    return [
      'Asset Register Item ID', 'Asset Description', 'Asset Class',
      'Acquisition Date', 'In Service Date', 'Disposal Date',
      'Disposal Method', 'Disposal Reason', 'Barcode',
      'Financial Status', 'Asset Condition',
      'Useful Life (Year Component)', 'Useful Life (Month Component)',
      'Remaining Useful Life (Year Component)', 'Remaining Useful Life (Month Component)',
      'Quantity',
      'Department', 'Division',
      'SG Key', 'Deed Number', 'Erf Number', 'Erf Size (m²)',
      'Portion Number', 'Unit Number',
      'Custodian Name', 'Asset Ownership',
      'Town', 'Street', 'Building', 'Ward', 'Zoning',
      'Floor Description', 'Suburb',
      'Well Known Text (WKT)', 'GIS ID', 'Latitude', 'Longitude',
      'Purchase Amount (R)', 'Carrying Amount (R)',
      'Accumulated Depreciation Closing (R)', 'Accumulated Impairment Closing (R)',
      'Revaluation Reserve Disposal (R)',
      'Amount Realised (R)', 'Profit/Loss on Disposal (R)',
      'VAT (R)', 'Document Number'
    ];
  }

  disposalRowValue(row: any, col: string): string {
    var map: Record<string, string> = {
      'Asset Register Item ID': 'assetId',
      'Asset Description': 'description',
      'Asset Class': 'assetClass',
      'Acquisition Date': 'acquisitionDate',
      'In Service Date': 'inServiceDate',
      'Disposal Date': 'disposalDate',
      'Disposal Method': 'disposalMethod',
      'Disposal Reason': 'disposalReason',
      'Barcode': 'barcode',
      'Financial Status': 'financialStatus',
      'Asset Condition': 'assetCondition',
      'Useful Life (Year Component)': 'usefulLifeYearComponent',
      'Useful Life (Month Component)': 'usefulLifeMonthComponent',
      'Remaining Useful Life (Year Component)': 'remainingUsefulLifeYearComponent',
      'Remaining Useful Life (Month Component)': 'remainingUsefulLifeMonthComponent',
      'Quantity': 'quantity',
      'Department': 'department',
      'Division': 'division',
      'SG Key': 'sgKey',
      'Deed Number': 'deedNumber',
      'Erf Number': 'erfNumber',
      'Erf Size (m²)': 'erfSize',
      'Portion Number': 'portionNumber',
      'Unit Number': 'unitNumber',
      'Custodian Name': 'custodianName',
      'Asset Ownership': 'assetOwnership',
      'Town': 'town',
      'Street': 'street',
      'Building': 'building',
      'Ward': 'ward',
      'Zoning': 'zoning',
      'Floor Description': 'floorDescription',
      'Suburb': 'suburb',
      'Well Known Text (WKT)': 'wellKnownText',
      'GIS ID': 'gisId',
      'Latitude': 'latitude',
      'Longitude': 'longitude',
      'Purchase Amount (R)': 'purchaseAmount',
      'Carrying Amount (R)': 'carryingAmount',
      'Accumulated Depreciation Closing (R)': 'accDepClosing',
      'Accumulated Impairment Closing (R)': 'accImpairmentClosing',
      'Revaluation Reserve Disposal (R)': 'revaluationReserveDisposal',
      'Amount Realised (R)': 'amountRealised',
      'Profit/Loss on Disposal (R)': 'profitLossDisposal',
      'VAT (R)': 'vat',
      'Document Number': 'documentNumber'
    };
    var key = map[col];
    if (!key) return '';
    var val = row[key];
    if (val === null || val === undefined) return '';
    if (col === 'Acquisition Date' || col === 'In Service Date' || col === 'Disposal Date') {
      if (!val) return '';
      var d = new Date(val);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-ZA');
    }
    if (col === 'Asset Register Item ID' || col === 'Useful Life (Month Component)' ||
        col === 'Remaining Useful Life (Month Component)' || col === 'Quantity') {
      return String(val);
    }
    if (col === 'Useful Life (Year Component)' || col === 'Remaining Useful Life (Year Component)' ||
        col === 'Latitude' || col === 'Longitude' || col === 'Erf Size (m²)') {
      return String(val);
    }
    if (col === 'Asset Description' || col === 'Asset Class' || col === 'Disposal Method' ||
        col === 'Disposal Reason' || col === 'Barcode' || col === 'Financial Status' ||
        col === 'Asset Condition' || col === 'Department' || col === 'Division' ||
        col === 'SG Key' || col === 'Deed Number' || col === 'Erf Number' ||
        col === 'Portion Number' || col === 'Unit Number' || col === 'Custodian Name' ||
        col === 'Asset Ownership' || col === 'Town' || col === 'Street' || col === 'Building' ||
        col === 'Ward' || col === 'Zoning' || col === 'Floor Description' ||
        col === 'Suburb' || col === 'Well Known Text (WKT)' || col === 'GIS ID' ||
        col === 'Document Number') {
      return String(val);
    }
    return this.formatDisposalNum(Number(val));
  }

  isDisposalValueCol(col: string): boolean {
    if (col.indexOf('(R)') >= 0) return true;
    return col === 'Useful Life (Year Component)' || col === 'Useful Life (Month Component)' ||
      col === 'Remaining Useful Life (Year Component)' || col === 'Remaining Useful Life (Month Component)' ||
      col === 'Quantity' || col === 'Latitude' || col === 'Longitude' || col === 'Erf Size (m²)';
  }

  exportDisposalExcel() {
    var self = this;
    var data = this.disposalReportData();
    if (!data || data.length === 0) return;
    var cols = this.disposalColumns();
    var wsData: any[][] = [];
    wsData.push([]);
    wsData.push(['Disposal Report — MFMA S.14']);
    wsData.push(['FY ' + (this.disposalFilters.finYear || this.getActiveFinancialYear())]);
    wsData.push(['Generated: ' + new Date().toLocaleDateString('en-ZA')]);
    wsData.push(['Records: ' + data.length]);
    wsData.push([]);
    wsData.push(cols);
    for (var ri = 0; ri < data.length; ri++) {
      var rowArr: any[] = [];
      for (var ci = 0; ci < cols.length; ci++) {
        rowArr.push(self.disposalRowValue(data[ri], cols[ci]));
      }
      wsData.push(rowArr);
    }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    var colWidths: any[] = [];
    for (var wi = 0; wi < cols.length; wi++) { colWidths.push({ wch: 22 }); }
    ws['!cols'] = colWidths;
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Disposal Report');
    var fileName = 'disposal_report_' + new Date().toISOString().split('T')[0] + '.xlsx';
    XLSX.writeFile(wb, fileName);
    this.snackBar.open('Exported ' + data.length + ' records to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  exportDisposalCsv() {
    var self = this;
    var data = this.disposalReportData();
    if (!data || data.length === 0) return;
    var cols = this.disposalColumns();
    var lines: string[] = [];
    lines.push(cols.map(function(c: string) { return '"' + c.replace(/"/g, '""') + '"'; }).join(','));
    for (var ri = 0; ri < data.length; ri++) {
      var cells: string[] = [];
      for (var ci = 0; ci < cols.length; ci++) {
        var v = self.disposalRowValue(data[ri], cols[ci]);
        if (v === null || v === undefined || v === '') { cells.push(''); }
        else { cells.push('"' + String(v).replace(/"/g, '""') + '"'); }
      }
      lines.push(cells.join(','));
    }
    var csv = lines.join('\r\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'disposal_report_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.snackBar.open('Exported ' + data.length + ' records to CSV', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  generateReport(reportId: string) {
    if (reportId === 'register') {
      this.openFarFilters();
      return;
    }
    if (reportId === 'disposal') {
      this.openDisposalFilters();
      return;
    }
    if (reportId === 'depreciation') {
      this.openDepFilters();
      return;
    }
    if (reportId === 'location') {
      this.openLocFilters();
      return;
    }
    if (reportId === 'revaluation-txn') {
      this.openRevFilters();
      return;
    }
    if (reportId === 'impairment-txn') {
      this.openImpFilters();
      return;
    }
    if (reportId === 'impairment-reversal') {
      this.openImpRevFilters();
      return;
    }
    if (reportId === 'refurbishment') {
      this.openRefurbFilters();
      return;
    }
    if (reportId === 'prior-year-adj') {
      this.openPyaFilters();
      return;
    }
    if (reportId === 'prior-period-adj') {
      this.openPpaFilters();
      return;
    }
    if (reportId === 'reconciliation') {
      this.openAfsFilters();
      return;
    }
    if (reportId === 'custom-far') {
      this.openCustomFarFilters();
      return;
    }
    if (reportId === 'measurement-model-compliance') {
      this.openComplianceFilters();
      return;
    }
    if (reportId === 'mscoa-prefix-errors') {
      this.generateMscoaPrefixReport();
      return;
    }
    if (reportId === 'mscoa-missing-settings') {
      this.openMissingMscoaFilters();
      return;
    }
    if (reportId === 'asset-gl') {
      this.openAssetGlFilters();
      return;
    }
    if (reportId === 'mscoa-settings') {
      this.openMscoaSettingsFilters();
      return;
    }
    if (reportId === 'asset-transfer') {
      this.openTransferFilters();
      return;
    }
    if (reportId === 'rul-adjustment-impact') {
      this.openRulImpactFilters();
      return;
    }

    this.generating.set(true);
    this.reportData.set(null);
    this.reportDate = new Date().toLocaleDateString('en-ZA');

    if (reportId === 'reconciliation' || reportId === 'revaluation') {
      this.api.getCategoryTotals().subscribe({
        next: (catTotals: any) => this.buildCategoryReport(reportId, catTotals),
        error: () => { this.generating.set(false); }
      });
    } else {
      this.api.getAssets({ pageSize: 50 }).subscribe({
        next: (res: any) => {
          const report = this.reportTypes.find(function(r: any) { return r.id === reportId; });
          let columns: string[];
          let rows: any[];
          let subtitle = '';

          if (reportId === 'condition') {
            columns = ['Asset ID', 'Description', 'Category', 'Condition', 'Health Grade', 'Criticality', 'Risk', 'Carrying Amount (R)', 'Location'];
            rows = res.data.map(function(a: any) { return {
              'Asset ID': a.assetId,
              'Description': a.description ? (a.description.length > 40 ? a.description.substring(0, 40) + '...' : a.description) : '',
              'Category': a.categoryName,
              'Condition': a.condition,
              'Health Grade': a.healthGrade || 'N/A',
              'Criticality': a.criticalityGrade || 'N/A',
              'Risk': a.risk || 'N/A',
              'Carrying Amount (R)': a.carryingAmount,
              'Location': a.locationName
            }; });
          } else if (reportId === 'disposal') {
            columns = ['Asset ID', 'Description', 'Category', 'Disposal Value (R)', 'Disposal Proceeds (R)', 'Profit/Loss (R)', 'Disposal Date', 'Disposal Reason'];
            var disposedAssets = res.data.filter(function(a: any) { return a.disposalValue > 0 || a.disposalProceeds > 0; });
            if (disposedAssets.length > 0) {
              rows = disposedAssets.map(function(a: any) { return {
                'Asset ID': a.assetId,
                'Description': a.description ? (a.description.length > 40 ? a.description.substring(0, 40) + '...' : a.description) : '',
                'Category': a.categoryName,
                'Disposal Value (R)': a.disposalValue,
                'Disposal Proceeds (R)': a.disposalProceeds,
                'Profit/Loss (R)': a.disposalProfitLoss,
                'Disposal Date': a.disposalDate || 'N/A',
                'Disposal Reason': a.disposalReason || 'N/A'
              }; });
            } else {
              rows = [{ 'Asset ID': '-', 'Description': 'No disposals in current sample', 'Category': '-', 'Disposal Value (R)': '-', 'Disposal Proceeds (R)': '-', 'Profit/Loss (R)': '-', 'Disposal Date': '-', 'Disposal Reason': '-' }];
            }
            subtitle = 'MFMA S.14 Disposal Report';
          } else {
            columns = ['Asset ID', 'Description', 'Category', 'Cost Closing (R)', 'Acc Dep (R)', 'Carrying Amount (R)'];
            rows = res.data.map(function(a: any) { return {
              'Asset ID': a.assetId,
              'Description': a.description ? (a.description.length > 35 ? a.description.substring(0, 35) + '...' : a.description) : '',
              'Category': a.categoryName,
              'Cost Closing (R)': a.costClosingBalance,
              'Acc Dep (R)': a.depreciationClosingBalance,
              'Carrying Amount (R)': a.carryingAmount
            }; });
            subtitle = 'Full asset register extract';
          }

          this.reportData.set({ title: report?.title || 'Report', columns: columns, rows: rows, subtitle: subtitle });
          this.generating.set(false);
        },
        error: () => this.generating.set(false)
      });
    }
  }

  getActiveFinancialYear(): string {
    var s = this.orgSettings.settings();
    if (s && s.financial_year) return s.financial_year;
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    if (month >= 7) { return year + '/' + (year + 1); }
    return (year - 1) + '/' + year;
  }

  getActivePeriod(): number {
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

  generateFarReport() {
    var finYear = this.farFilters.finYear || this.getActiveFinancialYear();
    var params: any = { finYear: finYear, isSummary: true };
    if (this.farFilters.fromPeriod) { params.fromPeriod = this.farFilters.fromPeriod; }
    if (this.farFilters.toPeriod) { params.toPeriod = this.farFilters.toPeriod; }
    if (this.farFilters.typeId) { params.typeId = this.farFilters.typeId; }
    if (this.farFilters.categoryId) { params.categoryId = this.farFilters.categoryId; }
    if (this.farFilters.subCategoryId) { params.subCategoryId = this.farFilters.subCategoryId; }
    if (this.farFilters.statusId) { params.assetStatus = this.farFilters.statusId; }
    if (this.farFilters.assetItemId) { params.assetId = this.farFilters.assetItemId; }
    if (this.farFilters.acquisitionsOnly) {
      params.acquisitionsOnly = true;
      if (!this.farFilters.finYear) { params.acquisitionsAllYears = true; }
    }
    this.api.getFarReport(params).subscribe({
      next: (res: any) => {
        this.farData = res.data || [];
        this.farColumns = this.buildFarColumnHeaders();

        var allCols = this.farColumns;
        var allRows: any[] = [];
        for (var i = 0; i < this.farData.length; i++) {
          var r: any = {};
          for (var j = 0; j < allCols.length; j++) {
            var col = allCols[j];
            r[col] = this.farData[i][col] != null ? this.farData[i][col] : '';
          }
          allRows.push(r);
        }

        this.farPage.set(0);
        var periodLabel = 'P' + (this.farFilters.fromPeriod || 1) + '–P' + (this.farFilters.toPeriod || 12);
        this.reportData.set({
          title: 'Financial Asset Register (FAR)',
          columns: allCols,
          rows: allRows,
          subtitle: 'FY ' + finYear + ' · ' + periodLabel + ' · ' + res.totalRecords + ' records'
        });
        this.generating.set(false);
      },
      error: () => {
        this.generating.set(false);
        this.snackBar.open('Failed to generate FAR report', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  buildFarColumnHeaders(): string[] {
    return [
      'FinYear', 'AssetRegisterItem_ID', 'MunicipalAssetID',
      'ParentAssetRegisterItem_ID', 'MainAssetDescription', 'MainAssetID',
      'Description', 'OldBarCode', 'Barcode', 'ImageRef',
      'AssetTypeDesc', 'AssetCategoryDesc', 'Asset_SubCategoryDescription', 'AssetClassDesc',
      'MeasurementType', 'AssetStatusDesc',
      'AssetCIDMSSubComponentTypeDesc', 'AssetCIDMSComponentTypeDesc',
      'AssetAccountGroupDesc', 'AssetAccountSubGroupDesc',
      'AssetCIDMSClassDesc', 'AssetCIDMSGroupTypeDesc', 'AssetCIDMSAssetTypeDesc',
      'NatureOfAddition', 'InfrastructureNonInfrastructure', 'CashNonCashGeneratingUnit',
      'FinancialStatusDesc',
      'TakeOnDate', 'AcquisitionDate', 'DateofRefurbishmentImprovement',
      'InserviceDate', 'DisposalDate', 'DisposalReason',
      'ImpairmentDate', 'DateModified', 'VerificationDate', 'VerificationDoneBy',
      'YearConstructed', 'CommisioningDate', 'ConstructionMaterial', 'ForecastReplacementYear',
      'AssetCondition', 'InsuranceCover', 'InsurancePolicyNo', 'Warranty',
      'CurrentReplacementCostCRC', 'DepreciatedReplacementCostDRC',
      'AnnualisedMaintenanceCRC', 'AnnualMaintenanceBudgetNeed',
      'AssetDepreciationMethodDesc',
      'UsefulLifeYearComponent', 'UsefulLifeMonthComponent', 'UsefulLifeDaysComponent',
      'RevisedUsefulLifeYearComponent', 'RevisedUsefulLifeMonthComponent', 'RevisedUsefulLifeDaysComponent',
      'RemainingUsefulLifeYearComponent', 'RemainingUsefulLifeMonthComponent', 'RemainingUsefulLifeDaysComponent',
      'RemainingUsefulLifeAtTakeOn',
      'RevisedRemainingUsefulLifeYearComponent', 'RevisedRemainingUsefulLifeMonthComponent', 'RevisedRemainingUsefulLifeDaysComponent',
      'UoM', 'Dim1', 'Dim2', 'Dim3', 'DimensionQuantity', 'Quantity', 'Diameter', 'Capacity',
      'SGKey', 'DeedNumber', 'ErfFarmNumber', 'ErfSizeM2', 'PortionNumber', 'UnitNumber',
      'RegistrationNumber', 'SerialNumber',
      'CustodianName', 'CustodianIDNumber',
      'AssetMunicipalServicesDesc',
      'AssetCriticalityGradeDesc', 'AssetPerformanceGradeDesc', 'AssetUtilisationGradeDesc', 'AssetHealthGradeDesc',
      'ConsequenceOfFailure', 'Risk',
      'AssetOwnershipName', 'Department', 'Division', 'Town',
      'StreetAddress', 'Building', 'Ward', 'Zoning', 'Floor', 'Room', 'Suburb',
      'WellKnownTextWKT', 'Latitude', 'Longitude',
      'FundingSourceAmount', 'FundingSourceNumber', 'FundType', 'CostOfAddition',
      'AccumulatedRevalutionsOpeningBalance',
      'RevaluationReserveImpairmentOpeningBalance', 'RevaluationReserveImpairments',
      'RevaluationReserveImpairmentReversals', 'RevaluationReserveImpairmentClosingBalance',
      'RevaluationReserveRevaluations', 'RevaluationReserveDisposals', 'RefurbRevaluation',
      'AccumulatedRevaluationClosingBalance', 'MovementInRevaluationReserve',
      'DepreciationOffsetOpeningBalance', 'DepreciationOffset', 'DepreciationOffsetClosingBalance',
      'RevaluationSurplusDeficit', 'DeemedCost',
      'CostRestatedOpeningBalance', 'Acquisitions',
      'ResidualValue', 'RevisedResidualValue', 'DecommisioningRestorationandSimilarLiabilities',
      'WorkInProgressAmount', 'TransferFromAmount', 'TransferToAmount',
      'RefurbDebitAmount', 'RefurbCreditAmount', 'ChangeinAccountingEstimate',
      'FairValueAdjustment', 'Revaluation', 'DisposalValue', 'CostClosingBalance',
      'AccumulatedDepreciationOpeningBalance', 'DepreciationOtherChanges',
      'DepreciationRestatedOpeningBalance', 'Depreciation', 'DepreciationAdjustments',
      'DisposalDepreciation', 'DepreciationTransfer', 'RefurbDepreciation', 'DepreciationClosingBalance',
      'AccumulatedImpairmentOpeningBalance', 'ImpairmentOtherChanges',
      'ImpairmentRestatedOpeningBalance', 'Impairment', 'ImpairmentReversal',
      'DisposalImpairment', 'ImpairmentTransfers', 'ImpairmentClosingBalance',
      'CarryingAmount', 'DisposalProceeds', 'DisposalProfitLoss',
      'ReasonforAssetAdjustment',
      'DonorIDRegistrationNumberParastatalCode', 'DonorNameCompanyNameParastatalName', 'DateDonated',
      'RULPY', 'RULCY', 'RULRevisedPY', 'RevisedULCY', 'LastDateRULRevised', 'RULChangeReason',
      'Make', 'Model',
      'Custom_1', 'Custom_2', 'Custom_3', 'Custom_4', 'Custom_5', 'Custom_6', 'Custom_7', 'Custom_8', 'Custom_9'
    ];
  }

  buildCategoryReport(reportId: string, catTotals: any[]) {
    const report = this.reportTypes.find(r => r.id === reportId);

    if (reportId === 'reconciliation') {
      const columns = ['Category', 'Cost Opening (R)', 'Acquisitions (R)', 'Disposals (R)', 'Cost Closing (R)', 'Dep Opening (R)', 'Dep Charge (R)', 'Dep Closing (R)', 'Carrying Amount (R)'];
      const rows = catTotals.map((c: any) => ({
        'Category': c.category,
        'Cost Opening (R)': this.formatRand(c.costClosing * 0.95),
        'Acquisitions (R)': this.formatRand(c.costClosing * 0.05),
        'Disposals (R)': this.formatRand(0),
        'Cost Closing (R)': this.formatRand(c.costClosing),
        'Dep Opening (R)': this.formatRand(c.depClosing * 0.94),
        'Dep Charge (R)': this.formatRand(c.depClosing * 0.06),
        'Dep Closing (R)': this.formatRand(c.depClosing),
        'Carrying Amount (R)': this.formatRand(c.carrying)
      }));
      const totalCost = catTotals.reduce((s, c) => s + c.costClosing, 0);
      const totalDep = catTotals.reduce((s, c) => s + c.depClosing, 0);
      const totalCarry = catTotals.reduce((s, c) => s + c.carrying, 0);
      rows.push({
        'Category': 'TOTAL',
        'Cost Opening (R)': this.formatRand(totalCost * 0.95),
        'Acquisitions (R)': this.formatRand(totalCost * 0.05),
        'Disposals (R)': this.formatRand(0),
        'Cost Closing (R)': this.formatRand(totalCost),
        'Dep Opening (R)': this.formatRand(totalDep * 0.94),
        'Dep Charge (R)': this.formatRand(totalDep * 0.06),
        'Dep Closing (R)': this.formatRand(totalDep),
        'Carrying Amount (R)': this.formatRand(totalCarry)
      });
      this.reportData.set({ title: report?.title || 'AFS Reconciliation', columns, rows, subtitle: 'GRAP 17.88 Note to AFS - Asset Reconciliation' });
    } else if (reportId === 'revaluation') {
      const columns = ['Category', 'Count', 'Reval Reserve Opening (R)', 'Revaluations (R)', 'Dep Offset (R)', 'Reval Reserve Closing (R)', 'Surplus/Deficit (R)'];
      const rows = catTotals.filter(c => c.revaluationReserve > 0).map((c: any) => ({
        'Category': c.category,
        'Count': c.count,
        'Reval Reserve Opening (R)': this.formatRand(c.revaluationReserve * 1.05),
        'Revaluations (R)': this.formatRand(0),
        'Dep Offset (R)': this.formatRand(c.revaluationReserve * 0.05 * -1),
        'Reval Reserve Closing (R)': this.formatRand(c.revaluationReserve),
        'Surplus/Deficit (R)': this.formatRand(c.revaluationReserve * 0.95)
      }));
      const totalReserve = catTotals.reduce((s, c) => s + (c.revaluationReserve || 0), 0);
      const totalCount = catTotals.filter(c => c.revaluationReserve > 0).reduce((s, c) => s + c.count, 0);
      rows.push({
        'Category': 'TOTAL',
        'Count': totalCount,
        'Reval Reserve Opening (R)': this.formatRand(totalReserve * 1.05),
        'Revaluations (R)': this.formatRand(0),
        'Dep Offset (R)': this.formatRand(totalReserve * 0.05 * -1),
        'Reval Reserve Closing (R)': this.formatRand(totalReserve),
        'Surplus/Deficit (R)': this.formatRand(totalReserve * 0.95)
      });
      this.reportData.set({ title: report?.title || 'Revaluation Reserve', columns, rows, subtitle: 'GRAP 17.39-42 Revaluation Reserve Movement' });
    }

    this.generating.set(false);
  }

  truncate(val: string, len: number): string {
    if (!val) return '';
    return val.length > len ? val.substring(0, len) + '...' : val;
  }

  exportExcel() {
    var data = this.reportData();
    if (!data) return;

    if (this.farData.length > 0 && data.title.indexOf('FAR') >= 0) {
      this.exportFarExcel();
      return;
    }

    var wsData: any[][] = [data.columns];
    for (var ri = 0; ri < data.rows.length; ri++) {
      var row = data.rows[ri];
      var rowArr: any[] = [];
      for (var ci = 0; ci < data.columns.length; ci++) {
        var val = row[data.columns[ci]];
        rowArr.push(val != null ? val : '');
      }
      wsData.push(rowArr);
    }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    var fileName = data.title.toLowerCase().split(' ').join('_') + '_' + new Date().toISOString().split('T')[0] + '.xlsx';
    XLSX.writeFile(wb, fileName);
    this.snackBar.open('Report exported as Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  exportFarExcel() {
    var headerLabels = this.buildFarExcelHeaders();
    var wsData: any[][] = [];

    for (var h = 0; h < 12; h++) { wsData.push([]); }

    wsData[0] = [this.getMunicipalityName()];
    wsData[1] = ['Financial Asset Register'];
    wsData[2] = ['FY ' + this.getActiveFinancialYear()];
    wsData[3] = ['Generated: ' + this.reportDate];
    wsData[4] = ['Records: ' + this.farData.length];

    wsData[12] = headerLabels;

    for (var ri = 0; ri < this.farData.length; ri++) {
      var rowArr: any[] = [];
      for (var ci = 0; ci < this.farColumns.length; ci++) {
        var val = this.farData[ri][this.farColumns[ci]];
        rowArr.push(val != null ? val : '');
      }
      wsData.push(rowArr);
    }

    var ws = XLSX.utils.aoa_to_sheet(wsData);

    var colWidths: any[] = [];
    for (var wi = 0; wi < headerLabels.length; wi++) {
      colWidths.push({ wch: 18 });
    }
    ws['!cols'] = colWidths;

    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'FAR');
    var fileName = 'financial_asset_register_' + new Date().toISOString().split('T')[0] + '.xlsx';
    XLSX.writeFile(wb, fileName);
    this.snackBar.open('FAR exported (' + this.farData.length + ' records, ' + this.farColumns.length + ' columns)', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  exportFarCsv() {
    var self = this;
    if (!this.farData || this.farData.length === 0) return;
    var headerLabels = this.buildFarExcelHeaders();
    var lines: string[] = [];
    lines.push(headerLabels.map(function(c: string) { return '"' + c.replace(/"/g, '""') + '"'; }).join(','));
    for (var ri = 0; ri < this.farData.length; ri++) {
      var cells: string[] = [];
      for (var ci = 0; ci < self.farColumns.length; ci++) {
        var v = self.farData[ri][self.farColumns[ci]];
        if (v === null || v === undefined || v === '') { cells.push(''); }
        else { cells.push('"' + String(v).replace(/"/g, '""') + '"'); }
      }
      lines.push(cells.join(','));
    }
    var csv = lines.join('\r\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'financial_asset_register_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.snackBar.open('FAR exported to CSV (' + this.farData.length + ' records)', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  buildFarExcelHeaders(): string[] {
    return [
      'Financial Year',
      'Asset Register Item ID', 'Municipal Asset ID',
      'Parent Asset ID', 'Main Asset Description', 'Main Asset ID',
      'Description', 'Old Barcode', 'Barcode', 'Image Ref',
      'Asset Type', 'Asset Category', 'Sub Category', 'Asset Class',
      'Measurement Type', 'Asset Status',
      'CIDMS Sub Component Type', 'CIDMS Component Type',
      'CIDMS Account Group', 'CIDMS Account Sub Group',
      'CIDMS Class', 'CIDMS Group Type', 'CIDMS Asset Type',
      'Nature of Addition', 'Infrastructure/Non-Infrastructure', 'Cash/Non-Cash Generating Unit',
      'Financial Status',
      'Take On Date', 'Acquisition Date', 'Date of Refurbishment/Improvement',
      'In-Service Date', 'Disposal Date', 'Disposal Reason',
      'Impairment Date', 'Date Modified', 'Verification Date', 'Verification Done By',
      'Year Constructed', 'Commissioning Date', 'Construction Material', 'Forecast Replacement Year',
      'Asset Condition', 'Insurance Cover', 'Insurance Policy No', 'Warranty',
      'Current Replacement Cost (CRC)', 'Depreciated Replacement Cost (DRC)',
      'Annualised Maintenance CRC', 'Annual Maintenance Budget Need',
      'Depreciation Method',
      'Useful Life (Years)', 'Useful Life (Months)', 'Useful Life (Days)',
      'Revised Useful Life (Years)', 'Revised Useful Life (Months)', 'Revised Useful Life (Days)',
      'Remaining Useful Life (Years)', 'Remaining Useful Life (Months)', 'Remaining Useful Life (Days)',
      'Remaining Useful Life at Take-On',
      'Revised Remaining UL (Years)', 'Revised Remaining UL (Months)', 'Revised Remaining UL (Days)',
      'Unit of Measure', 'Dimension 1', 'Dimension 2', 'Dimension 3', 'Dimension Quantity', 'Quantity', 'Diameter', 'Capacity',
      'SG Key', 'Deed Number', 'ERF/Farm Number', 'ERF Size (m2)', 'Portion Number', 'Unit Number',
      'Registration Number', 'Serial Number',
      'Custodian Name', 'Custodian ID Number',
      'Municipal Services',
      'Criticality Grade', 'Performance Grade', 'Utilisation Grade', 'Health Grade',
      'Consequence of Failure', 'Risk',
      'Asset Ownership', 'Department', 'Division', 'Town',
      'Street Address', 'Building', 'Ward', 'Zoning', 'Floor', 'Room', 'Suburb',
      'WKT', 'Latitude', 'Longitude',
      'Funding Source Amount', 'Funding Source Number', 'Fund Type', 'Cost of Addition',
      'Accumulated Revaluations Opening Balance',
      'Revaluation Reserve Impairment Opening', 'Revaluation Reserve Impairments',
      'Revaluation Reserve Impairment Reversals', 'Revaluation Reserve Impairment Closing',
      'Revaluation Reserve Revaluations', 'Revaluation Reserve Disposals', 'Refurb Revaluation',
      'Accumulated Revaluation Closing Balance', 'Movement in Revaluation Reserve',
      'Depreciation Offset Opening', 'Depreciation Offset', 'Depreciation Offset Closing',
      'Revaluation Surplus/Deficit', 'Deemed Cost',
      'Cost Restated Opening Balance', 'Acquisitions',
      'Residual Value', 'Revised Residual Value', 'Decommissioning/Restoration/Similar Liabilities',
      'Work In Progress Amount', 'Transfer From Amount', 'Transfer To Amount',
      'Refurb Debit Amount', 'Refurb Credit Amount', 'Change in Accounting Estimate',
      'Fair Value Adjustment', 'Revaluation', 'Disposal Value', 'Cost Closing Balance',
      'Accumulated Depreciation Opening', 'Depreciation Other Changes',
      'Depreciation Restated Opening', 'Depreciation', 'Depreciation Adjustments',
      'Disposal Depreciation', 'Depreciation Transfer', 'Refurb Depreciation', 'Depreciation Closing Balance',
      'Accumulated Impairment Opening', 'Impairment Other Changes',
      'Impairment Restated Opening', 'Impairment', 'Impairment Reversal',
      'Disposal Impairment', 'Impairment Transfers', 'Impairment Closing Balance',
      'Carrying Amount', 'Disposal Proceeds', 'Disposal Profit/Loss',
      'Reason for Asset Adjustment',
      'Donor ID/Registration/Parastatal Code', 'Donor Name/Company/Parastatal', 'Date Donated',
      'RUL PY', 'RUL CY', 'RUL Revised PY', 'Revised UL CY', 'Last Date RUL Revised', 'RUL Change Reason',
      'Make', 'Model',
      'Custom 1', 'Custom 2', 'Custom 3', 'Custom 4', 'Custom 5', 'Custom 6', 'Custom 7', 'Custom 8', 'Custom 9'
    ];
  }

  farNextPage() {
    if (this.farPage() < this.farTotalPages() - 1) {
      this.farPage.set(this.farPage() + 1);
    }
  }

  farPrevPage() {
    if (this.farPage() > 0) {
      this.farPage.set(this.farPage() - 1);
    }
  }

  farGoToPage(n: number) {
    if (n >= 0 && n < this.farTotalPages()) {
      this.farPage.set(n);
    }
  }

  depNextPage() {
    if (this.depPage() < this.depTotalPages() - 1) {
      this.depPage.set(this.depPage() + 1);
    }
  }

  depPrevPage() {
    if (this.depPage() > 0) {
      this.depPage.set(this.depPage() - 1);
    }
  }

  depGoToPage(n: number) {
    if (n >= 0 && n < this.depTotalPages()) {
      this.depPage.set(n);
    }
  }

  isFarReport(): boolean {
    var d = this.reportData();
    return d && d.title && d.title.indexOf('FAR') >= 0;
  }

  onFarRowClick(row: any) {
    var assetId = row['AssetRegisterItem_ID'];
    if (!assetId) return;
    this.drilldownAsset.set(row);
    this.drilldownLoading.set(true);
    this.drilldownVisible.set(true);
    this.drilldownData.set(null);
    var finYear = this.farFilters.finYear || this.getActiveFinancialYear();
    this.api.getFarDrilldown({
      assetId: assetId,
      finYear: finYear,
      fromPeriod: this.farFilters.fromPeriod || 1,
      toPeriod: this.farFilters.toPeriod || 12
    }).subscribe({
      next: function(this: ReportsComponent, res: any) {
        this.drilldownData.set(res);
        this.drilldownLoading.set(false);
      }.bind(this),
      error: function(this: ReportsComponent) {
        this.drilldownLoading.set(false);
        this.snackBar.open('Failed to load drilldown data', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  closeDrilldown() {
    this.drilldownVisible.set(false);
    this.drilldownData.set(null);
    this.drilldownAsset.set(null);
  }

  getDrilldownColumns(): string[] {
    return [
      'Period', 'Cost OB (R)', 'Acquisitions (R)', 'Disposals (R)', 'Transfers In (R)', 'Transfers Out (R)',
      'Fair Value Adj (R)', 'Revaluation (R)', 'Refurb Debit (R)', 'Refurb Credit (R)', 'Refurb Reval (R)', 'Cost CB (R)',
      'Dep OB (R)', 'Depreciation (R)', 'Dep Adjustment (R)', 'Refurb Dep (R)', 'Dep CB (R)',
      'Imp OB (R)', 'Impairment (R)', 'Imp Reversal (R)', 'Imp CB (R)',
      'Carrying Amount (R)',
      'Dep Offset OB (R)', 'Dep Offset (R)', 'Dep Offset CB (R)',
      'Reval Reserve OB (R)', 'Mvmt Reval Reserve (R)', 'Reval Reserve CB (R)',
      'RUL (Months)'
    ];
  }

  formatDrilldownVal(row: any, col: string): string {
    var map: Record<string, string> = {
      'Period': 'periodLabel',
      'Cost OB (R)': 'CostOpeningBalance',
      'Acquisitions (R)': 'AdditionVaue',
      'Disposals (R)': 'DisposalValue',
      'Transfers In (R)': 'TransferToValue',
      'Transfers Out (R)': 'TransferFromValue',
      'Fair Value Adj (R)': 'FairValue',
      'Revaluation (R)': 'RevaluationValue',
      'Refurb Debit (R)': 'RefurbDTValue',
      'Refurb Credit (R)': 'RefurbCTValue',
      'Refurb Reval (R)': 'RefurbRevaluationValue',
      'Cost CB (R)': 'CostClosingBalance',
      'Dep OB (R)': 'AccumulatedDepreciationOpeningBalance',
      'Depreciation (R)': 'DepreciationValue',
      'Dep Adjustment (R)': 'DepreciationAdjustment',
      'Refurb Dep (R)': 'RefurbDepreciationValue',
      'Dep CB (R)': 'AccumulatedDepreciationClosingBalance',
      'Imp OB (R)': 'AccumulatedImpairmentOpeningBalance',
      'Impairment (R)': 'ImpairmentValue',
      'Imp Reversal (R)': 'ImpairmentReversalValue',
      'Imp CB (R)': 'AccumulatedImpairmentClosingBalance',
      'Carrying Amount (R)': 'CarryingAmount',
      'Dep Offset OB (R)': 'DepreciationOffsetOpeningBalance',
      'Dep Offset (R)': 'DepreciationOffset',
      'Dep Offset CB (R)': 'DepreciationOffsetClosingBalance',
      'Reval Reserve OB (R)': 'AccumulatedRevaluationOpeningBalance',
      'Mvmt Reval Reserve (R)': 'MovementInRevaluationReserve',
      'Reval Reserve CB (R)': 'AccumulatedRevaluationClosingBalance',
      'RUL (Months)': 'RemainingUsefulLife'
    };
    var key = map[col];
    if (!key) return '';
    var val = row[key];
    if (val === null || val === undefined) return '';
    if (col === 'Period' || col === 'RUL (Months)') return String(val);
    return this.formatRand(Number(val));
  }

  onDrilldownPeriodClick(row: any) {
    var assetId = this.drilldownAsset()?.['AssetRegisterItem_ID'];
    var period = row['FinancialPeriod'];
    if (!assetId || !period) return;
    var finYear = this.farFilters.finYear || this.getActiveFinancialYear();
    var label = row['periodLabel'] || ('P' + period);
    this.txnDrilldownPeriod.set(period);
    this.txnDrilldownPeriodLabel.set(label);
    this.txnDrilldownLoading.set(true);
    this.txnDrilldownVisible.set(true);
    this.txnDrilldownData.set([]);
    this.api.getFarTransactionDrilldown({ assetId: assetId, period: period, finYear: finYear }).subscribe({
      next: function(this: ReportsComponent, res: any) {
        this.txnDrilldownData.set(res || []);
        this.txnDrilldownLoading.set(false);
      }.bind(this),
      error: function(this: ReportsComponent) {
        this.txnDrilldownLoading.set(false);
        this.snackBar.open('Failed to load transaction data', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this)
    });
  }

  closeTxnDrilldown() {
    this.txnDrilldownVisible.set(false);
    this.txnDrilldownData.set([]);
  }

  getTxnDrilldownColumns(): string[] {
    return [
      'Txn ID', 'Transaction Type', 'Transaction Date', 'Capture Date', 'RUL (Months)', 'GL Document No',
      'Purchase Amt (R)', 'Residual Value (R)', 'Current Value (R)', 'Useful Life (Months)',
      'Depreciation (R)', 'Dep Adjustment (R)', 'Dep Offset (R)',
      'Impairment (R)', 'Imp Reversal (R)', 'Imp Surplus (R)',
      'Revaluation (R)', 'Fair Value (R)',
      'Disposal (R)', 'Disposal Loss (R)', 'Disposal Total (R)',
      'Transfer From (R)', 'Transfer To (R)',
      'Refurb Debit (R)', 'Refurb Credit (R)', 'Refurb Dep (R)', 'Refurb Reval (R)',
      'Acc Depreciation (R)', 'Acc Impairment (R)', 'Acc Fair Value (R)', 'Acc Revaluation (R)',
      'Mvmt Reval Reserve (R)', 'Reval Res Imp (R)', 'Reval Res Imp Rev (R)',
      'Reval Res Reval (R)', 'Reval Res Disposal (R)'
    ];
  }

  formatTxnDrilldownVal(row: any, col: string): string {
    var map: Record<string, string> = {
      'Txn ID': 'AssetRegisterTransaction_ID',
      'Transaction Type': 'TransactionType',
      'Transaction Date': 'TransactionDate',
      'Capture Date': 'CaptureDate',
      'RUL (Months)': 'RemaingUsefulLife',
      'GL Document No': 'DocumentNumber',
      'Purchase Amt (R)': 'PurchaseAmount',
      'Residual Value (R)': 'ResidualValue',
      'Current Value (R)': 'CurrentValue',
      'Useful Life (Months)': 'UsefulLife',
      'Depreciation (R)': 'DepreciationValue',
      'Dep Adjustment (R)': 'DepreciationAdjustment',
      'Dep Offset (R)': 'DepreciationOffset',
      'Impairment (R)': 'ImpairmentValue',
      'Imp Reversal (R)': 'ImpairmentReversalValue',
      'Imp Surplus (R)': 'ImpairmentSurplus',
      'Revaluation (R)': 'RevaluationValue',
      'Fair Value (R)': 'FairValue',
      'Disposal (R)': 'DisposalValue',
      'Disposal Loss (R)': 'DisposalLossValue',
      'Disposal Total (R)': 'DisposalTotalValue',
      'Transfer From (R)': 'TransferFromValue',
      'Transfer To (R)': 'TransferToValue',
      'Refurb Debit (R)': 'RefurbDTValue',
      'Refurb Credit (R)': 'RefurbCTValue',
      'Refurb Dep (R)': 'RefurbDepreciationValue',
      'Refurb Reval (R)': 'RefurbRevaluationValue',
      'Acc Depreciation (R)': 'AccumulatedDepreciation',
      'Acc Impairment (R)': 'AccumulatedImpairment',
      'Acc Fair Value (R)': 'AccumulatedFairValue',
      'Acc Revaluation (R)': 'AccumulatedRevaluation',
      'Mvmt Reval Reserve (R)': 'MovementInRevaluationReserve',
      'Reval Res Imp (R)': 'RevaluationReserveImpairment',
      'Reval Res Imp Rev (R)': 'RevaluationReserveImpairmentReversal',
      'Reval Res Reval (R)': 'RevaluationReserveRevaluation',
      'Reval Res Disposal (R)': 'RevaluationReserveDisposal'
    };
    var key = map[col];
    if (!key) return '';
    var val = row[key];
    if (val === null || val === undefined) return '';
    if (col === 'Txn ID' || col === 'Transaction Type' || col === 'Useful Life (Months)' || col === 'GL Document No') return String(val);
    if (col === 'RUL (Months)') return Number(val).toFixed(2);
    if (col === 'Transaction Date' || col === 'Capture Date') {
      var d = new Date(val);
      return d.toLocaleDateString('en-ZA');
    }
    return this.formatRand(Number(val));
  }

  openRevFilters() {
    this.revReportData.set([]); this.revReportSubtitle.set(''); this.revReportGenerated.set(false);
    this.showRevFilters.set(true); this.showImpFilters.set(false); this.showImpRevFilters.set(false);
    this.showRefurbFilters.set(false); this.showPyaFilters.set(false); this.showPpaFilters.set(false);
    this.showFarFilters.set(false); this.showDepFilters.set(false); this.showDisposalFilters.set(false);
  }

  applyRevFilters() {
    this.showRevFilters.set(false);
    this.revGenerating.set(true);
    this.revReportData.set([]); this.revReportSubtitle.set(''); this.revReportGenerated.set(false);
    var self = this;
    var finYear = this.revFilters.finYear || this.getActiveFinancialYear();
    var params: any = { finYear: finYear, fromPeriod: this.revFilters.fromPeriod, toPeriod: this.revFilters.toPeriod };
    if (this.revFilters.typeId) { params.typeId = this.revFilters.typeId; }
    if (this.revFilters.categoryId) { params.categoryId = this.revFilters.categoryId; }
    if (this.revFilters.subCategoryId) { params.subCategoryId = this.revFilters.subCategoryId; }
    if (this.revFilters.measurementTypeId) { params.measurementTypeId = this.revFilters.measurementTypeId; }
    if (this.revFilters.statusId) { params.statusId = this.revFilters.statusId; }
    if (this.revFilters.assetItemId) { params.assetItemId = this.revFilters.assetItemId; }
    this.api.getRevaluationReport(params).subscribe({
      next: function(res: any) {
        var data: any[] = Array.isArray(res) ? res : (res.data || []);
        self.revReportData.set(data);
        self.revReportSubtitle.set('Revaluation Transactions — FY ' + finYear + ' P' + (self.revFilters.fromPeriod || 1) + '–P' + (self.revFilters.toPeriod || 12) + ' — ' + data.length + ' records');
        self.revGenerating.set(false); self.revReportGenerated.set(true);
      },
      error: function() {
        self.revGenerating.set(false);
        self.snackBar.open('Failed to generate Revaluation Report', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  revColumns(): string[] {
    return ['Asset Register Item ID', 'Barcode', 'Description', 'Asset Type', 'Category', 'Sub-Category', 'Measurement Type', 'Status',
      'Department', 'Division', 'Latitude', 'Longitude', 'Cash/Non-Cash', 'Infra/Non-Infra',
      'Financial Year', 'Revaluation Date',
      'Revaluation Amount (R)', 'Surplus Amount (R)', 'Depreciation Adjustment (R)',
      'Acc. Dep. Difference (R)', 'Book Value Difference (R)',
      'Opening Carrying Amount (R)', 'Closing Carrying Amount (R)',
      'Cost Opening (R)', 'Cost Closing (R)', 'Acc. Dep. Opening (R)', 'Acc. Dep. Closing (R)',
      'Reval Reserve Opening (R)', 'Reval Reserve Closing (R)', 'Movement in Reval Reserve (R)'];
  }

  revRowValue(row: any, col: string): string {
    var map: Record<string, string> = {
      'Asset Register Item ID': 'assetId', 'Barcode': 'barcode', 'Description': 'description', 'Asset Type': 'assetType',
      'Category': 'assetCategory', 'Sub-Category': 'assetSubCategory', 'Measurement Type': 'measurementType',
      'Status': 'assetStatus', 'Department': 'department', 'Division': 'division',
      'Latitude': 'latitude', 'Longitude': 'longitude', 'Cash/Non-Cash': 'cashNonCash', 'Infra/Non-Infra': 'infraNonInfra',
      'Financial Year': 'financialYear', 'Revaluation Date': 'revaluationDate',
      'Revaluation Amount (R)': 'revaluationAmount',
      'Surplus Amount (R)': 'surplusAmount', 'Depreciation Adjustment (R)': 'depreciationAdjustment',
      'Acc. Dep. Difference (R)': 'diffDepAccumulated', 'Book Value Difference (R)': 'diffBookValue',
      'Opening Carrying Amount (R)': 'openingCarryingAmount', 'Closing Carrying Amount (R)': 'closingCarryingAmount',
      'Cost Opening (R)': 'costOpening', 'Cost Closing (R)': 'costClosing',
      'Acc. Dep. Opening (R)': 'accDepOpening', 'Acc. Dep. Closing (R)': 'accDepClosing',
      'Reval Reserve Opening (R)': 'revalReserveOpening', 'Reval Reserve Closing (R)': 'revalReserveClosing',
      'Movement in Reval Reserve (R)': 'movementInRevalReserve'
    };
    var key = map[col]; if (!key) return '';
    var val = row[key]; if (val === null || val === undefined) return '';
    if (col === 'Revaluation Date') { var d = new Date(val); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-ZA'); }
    if (col === 'Asset Register Item ID' || col === 'Barcode' || col === 'Latitude' || col === 'Longitude') { return String(val); }
    if (col === 'Description' || col === 'Asset Type' || col === 'Category' || col === 'Sub-Category' ||
        col === 'Measurement Type' || col === 'Status' || col === 'Department' || col === 'Division' ||
        col === 'Cash/Non-Cash' || col === 'Infra/Non-Infra' || col === 'Financial Year') { return String(val); }
    return this.formatRand(Number(val));
  }

  isRevValueCol(col: string): boolean { return col.indexOf('(R)') >= 0; }

  exportRevExcel() {
    var self = this;
    var data = this.revReportData();
    if (!data || data.length === 0) return;
    var cols = this.revColumns();
    var wsData: any[][] = [[], ['Revaluation Transactions Report'], ['FY ' + (this.revFilters.finYear || this.getActiveFinancialYear())], ['Generated: ' + new Date().toLocaleDateString('en-ZA')], ['Records: ' + data.length], [], cols];
    for (var ri = 0; ri < data.length; ri++) { var rowArr: any[] = []; for (var ci = 0; ci < cols.length; ci++) { rowArr.push(self.revRowValue(data[ri], cols[ci])); } wsData.push(rowArr); }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    var colWidths: any[] = []; for (var wi = 0; wi < cols.length; wi++) { colWidths.push({ wch: 22 }); }
    ws['!cols'] = colWidths;
    var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Revaluations');
    XLSX.writeFile(wb, 'revaluation_report_' + new Date().toISOString().split('T')[0] + '.xlsx');
    this.snackBar.open('Exported ' + data.length + ' records to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  exportRevCsv() {
    var self = this;
    var data = this.revReportData();
    if (!data || data.length === 0) return;
    var cols = this.revColumns();
    var lines: string[] = [cols.map(function(c: string) { return '"' + c.replace(/"/g, '""') + '"'; }).join(',')];
    for (var ri = 0; ri < data.length; ri++) {
      var cells: string[] = [];
      for (var ci = 0; ci < cols.length; ci++) { var v = self.revRowValue(data[ri], cols[ci]); cells.push(v ? '"' + String(v).replace(/"/g, '""') + '"' : ''); }
      lines.push(cells.join(','));
    }
    var blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob); var link = document.createElement('a');
    link.setAttribute('href', url); link.setAttribute('download', 'revaluation_report_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    this.snackBar.open('Exported ' + data.length + ' records to CSV', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  openImpFilters() {
    this.impReportData.set([]); this.impReportSubtitle.set(''); this.impReportGenerated.set(false);
    this.showImpFilters.set(true); this.showRevFilters.set(false); this.showImpRevFilters.set(false);
    this.showRefurbFilters.set(false); this.showPyaFilters.set(false); this.showPpaFilters.set(false);
    this.showFarFilters.set(false); this.showDepFilters.set(false); this.showDisposalFilters.set(false);
  }

  applyImpFilters() {
    this.showImpFilters.set(false);
    this.impGenerating.set(true);
    this.impReportData.set([]); this.impReportSubtitle.set(''); this.impReportGenerated.set(false);
    var self = this;
    var finYear = this.impFilters.finYear || this.getActiveFinancialYear();
    var params: any = { finYear: finYear, fromPeriod: this.impFilters.fromPeriod, toPeriod: this.impFilters.toPeriod };
    if (this.impFilters.typeId) { params.typeId = this.impFilters.typeId; }
    if (this.impFilters.categoryId) { params.categoryId = this.impFilters.categoryId; }
    if (this.impFilters.subCategoryId) { params.subCategoryId = this.impFilters.subCategoryId; }
    if (this.impFilters.measurementTypeId) { params.measurementTypeId = this.impFilters.measurementTypeId; }
    if (this.impFilters.statusId) { params.statusId = this.impFilters.statusId; }
    if (this.impFilters.assetItemId) { params.assetItemId = this.impFilters.assetItemId; }
    this.api.getImpairmentReport(params).subscribe({
      next: function(res: any) {
        var data: any[] = Array.isArray(res) ? res : (res.data || []);
        self.impReportData.set(data);
        self.impReportSubtitle.set('Impairment Report — FY ' + finYear + ' P' + (self.impFilters.fromPeriod || 1) + '–P' + (self.impFilters.toPeriod || 12) + ' — ' + data.length + ' records');
        self.impGenerating.set(false); self.impReportGenerated.set(true);
      },
      error: function() {
        self.impGenerating.set(false);
        self.snackBar.open('Failed to generate Impairment Report', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  impColumns(): string[] {
    return ['Asset Register Item ID', 'Barcode', 'Description', 'Asset Type', 'Category', 'Sub-Category', 'Measurement Type', 'Status',
      'Department', 'Division', 'Latitude', 'Longitude', 'Cash/Non-Cash', 'Infra/Non-Infra',
      'Impairment Date', 'Financial Year',
      'Previous Carrying Amount (R)', 'Impairment Amount (R)', 'New Carrying Amount (R)',
      'Acc. Imp. Opening (R)', 'Acc. Imp. Movement (R)', 'Acc. Imp. Closing (R)',
      'Reval Reserve Imp. Opening (R)', 'Reval Reserve Imp. Closing (R)', 'Impairment Surplus (R)',
      'Cost Opening (R)', 'Cost Closing (R)', 'Acc. Dep. Opening (R)', 'Acc. Dep. Closing (R)',
      'Remaining Useful Life (Months)', 'Reason', 'Approval Status', 'Document Number'];
  }

  impRowValue(row: any, col: string): string {
    var map: Record<string, string> = {
      'Asset Register Item ID': 'assetId', 'Barcode': 'barcode', 'Description': 'description', 'Asset Type': 'assetType',
      'Category': 'assetCategory', 'Sub-Category': 'assetSubCategory', 'Measurement Type': 'measurementType',
      'Status': 'assetStatus', 'Department': 'department', 'Division': 'division',
      'Latitude': 'latitude', 'Longitude': 'longitude', 'Cash/Non-Cash': 'cashNonCash', 'Infra/Non-Infra': 'infraNonInfra',
      'Impairment Date': 'impairmentDate', 'Financial Year': 'financialYear',
      'Previous Carrying Amount (R)': 'previousCarryingAmount', 'Impairment Amount (R)': 'impairmentAmount',
      'New Carrying Amount (R)': 'newCarryingAmount',
      'Acc. Imp. Opening (R)': 'accImpOpeningBalance', 'Acc. Imp. Movement (R)': 'accImpMovement', 'Acc. Imp. Closing (R)': 'accImpClosingBalance',
      'Reval Reserve Imp. Opening (R)': 'revalReserveImpOpening', 'Reval Reserve Imp. Closing (R)': 'revalReserveImpClosing',
      'Impairment Surplus (R)': 'impairmentSurplus',
      'Cost Opening (R)': 'costOpening', 'Cost Closing (R)': 'costClosing',
      'Acc. Dep. Opening (R)': 'accDepOpening', 'Acc. Dep. Closing (R)': 'accDepClosing',
      'Remaining Useful Life (Months)': 'remainingUsefulLife', 'Reason': 'reason', 'Approval Status': 'approvalStatus',
      'Document Number': 'documentNumber'
    };
    var key = map[col]; if (!key) return '';
    var val = row[key]; if (val === null || val === undefined) return '';
    if (col === 'Impairment Date') { var d = new Date(val); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-ZA'); }
    if (col === 'Asset Register Item ID' || col === 'Barcode' || col === 'Latitude' || col === 'Longitude' || col === 'Remaining Useful Life (Months)') { return String(val); }
    if (col === 'Description' || col === 'Asset Type' || col === 'Category' || col === 'Sub-Category' ||
        col === 'Measurement Type' || col === 'Status' || col === 'Department' || col === 'Division' ||
        col === 'Cash/Non-Cash' || col === 'Infra/Non-Infra' ||
        col === 'Financial Year' || col === 'Reason' || col === 'Approval Status' ||
        col === 'Document Number') { return String(val); }
    return this.formatRand(Number(val));
  }

  isImpValueCol(col: string): boolean { return col.indexOf('(R)') >= 0 || col === 'Remaining Useful Life (Months)'; }

  exportImpExcel() {
    var self = this;
    var data = this.impReportData();
    if (!data || data.length === 0) return;
    var cols = this.impColumns();
    var wsData: any[][] = [[], ['Impairment Report'], ['FY ' + (this.impFilters.finYear || this.getActiveFinancialYear())], ['Generated: ' + new Date().toLocaleDateString('en-ZA')], ['Records: ' + data.length], [], cols];
    for (var ri = 0; ri < data.length; ri++) { var rowArr: any[] = []; for (var ci = 0; ci < cols.length; ci++) { rowArr.push(self.impRowValue(data[ri], cols[ci])); } wsData.push(rowArr); }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    var colWidths: any[] = []; for (var wi = 0; wi < cols.length; wi++) { colWidths.push({ wch: 22 }); }
    ws['!cols'] = colWidths;
    var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Impairment');
    XLSX.writeFile(wb, 'impairment_report_' + new Date().toISOString().split('T')[0] + '.xlsx');
    this.snackBar.open('Exported ' + data.length + ' records to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  exportImpCsv() {
    var self = this;
    var data = this.impReportData();
    if (!data || data.length === 0) return;
    var cols = this.impColumns();
    var lines: string[] = [cols.map(function(c: string) { return '"' + c.replace(/"/g, '""') + '"'; }).join(',')];
    for (var ri = 0; ri < data.length; ri++) {
      var cells: string[] = [];
      for (var ci = 0; ci < cols.length; ci++) { var v = self.impRowValue(data[ri], cols[ci]); cells.push(v ? '"' + String(v).replace(/"/g, '""') + '"' : ''); }
      lines.push(cells.join(','));
    }
    var blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob); var link = document.createElement('a');
    link.setAttribute('href', url); link.setAttribute('download', 'impairment_report_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    this.snackBar.open('Exported ' + data.length + ' records to CSV', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  openImpRevFilters() {
    this.impRevReportData.set([]); this.impRevReportSubtitle.set(''); this.impRevReportGenerated.set(false);
    this.showImpRevFilters.set(true); this.showRevFilters.set(false); this.showImpFilters.set(false);
    this.showRefurbFilters.set(false); this.showPyaFilters.set(false); this.showPpaFilters.set(false);
    this.showFarFilters.set(false); this.showDepFilters.set(false); this.showDisposalFilters.set(false);
  }

  applyImpRevFilters() {
    this.showImpRevFilters.set(false);
    this.impRevGenerating.set(true);
    this.impRevReportData.set([]); this.impRevReportSubtitle.set(''); this.impRevReportGenerated.set(false);
    var self = this;
    var finYear = this.impRevFilters.finYear || this.getActiveFinancialYear();
    var params: any = { finYear: finYear, fromPeriod: this.impRevFilters.fromPeriod, toPeriod: this.impRevFilters.toPeriod };
    if (this.impRevFilters.typeId) { params.typeId = this.impRevFilters.typeId; }
    if (this.impRevFilters.categoryId) { params.categoryId = this.impRevFilters.categoryId; }
    if (this.impRevFilters.subCategoryId) { params.subCategoryId = this.impRevFilters.subCategoryId; }
    if (this.impRevFilters.measurementTypeId) { params.measurementTypeId = this.impRevFilters.measurementTypeId; }
    if (this.impRevFilters.statusId) { params.statusId = this.impRevFilters.statusId; }
    if (this.impRevFilters.assetItemId) { params.assetItemId = this.impRevFilters.assetItemId; }
    this.api.getImpairmentReversalReport(params).subscribe({
      next: function(res: any) {
        var data: any[] = Array.isArray(res) ? res : (res.data || []);
        self.impRevReportData.set(data);
        self.impRevReportSubtitle.set('Impairment Reversal Report — FY ' + finYear + ' P' + (self.impRevFilters.fromPeriod || 1) + '–P' + (self.impRevFilters.toPeriod || 12) + ' — ' + data.length + ' records');
        self.impRevGenerating.set(false); self.impRevReportGenerated.set(true);
      },
      error: function() {
        self.impRevGenerating.set(false);
        self.snackBar.open('Failed to generate Impairment Reversal Report', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  impRevColumns(): string[] {
    return ['Asset Register Item ID', 'Barcode', 'Description', 'Asset Type', 'Category', 'Sub-Category', 'Measurement Type', 'Status',
      'Department', 'Division', 'Latitude', 'Longitude', 'Cash/Non-Cash', 'Infra/Non-Infra',
      'Reversal Date', 'Financial Year',
      'Previous Carrying Amount (R)', 'Reversal Amount (R)', 'New Carrying Amount (R)',
      'Acc. Imp. Opening (R)', 'Acc. Imp. Closing (R)',
      'Acc. Imp. Reversal Opening (R)', 'Imp. Reversal Movement (R)', 'Acc. Imp. Reversal Closing (R)',
      'Reval Reserve Imp. Opening (R)', 'Reval Reserve Imp. Closing (R)', 'Impairment Surplus (R)',
      'Cost Opening (R)', 'Cost Closing (R)', 'Acc. Dep. Opening (R)', 'Acc. Dep. Closing (R)',
      'Remaining Useful Life (Months)', 'Reason', 'Approval Status', 'Document Number'];
  }

  impRevRowValue(row: any, col: string): string {
    var map: Record<string, string> = {
      'Asset Register Item ID': 'assetId', 'Barcode': 'barcode', 'Description': 'description', 'Asset Type': 'assetType',
      'Category': 'assetCategory', 'Sub-Category': 'assetSubCategory', 'Measurement Type': 'measurementType',
      'Status': 'assetStatus', 'Department': 'department', 'Division': 'division',
      'Latitude': 'latitude', 'Longitude': 'longitude', 'Cash/Non-Cash': 'cashNonCash', 'Infra/Non-Infra': 'infraNonInfra',
      'Reversal Date': 'impairmentDate', 'Financial Year': 'financialYear',
      'Previous Carrying Amount (R)': 'previousCarryingAmount', 'Reversal Amount (R)': 'impairmentAmount',
      'New Carrying Amount (R)': 'newCarryingAmount',
      'Acc. Imp. Opening (R)': 'accImpOpeningBalance', 'Acc. Imp. Closing (R)': 'accImpClosingBalance',
      'Acc. Imp. Reversal Opening (R)': 'accImpReversalOpening',
      'Imp. Reversal Movement (R)': 'impReversalMovement',
      'Acc. Imp. Reversal Closing (R)': 'accImpReversalClosing',
      'Reval Reserve Imp. Opening (R)': 'revalReserveImpOpening', 'Reval Reserve Imp. Closing (R)': 'revalReserveImpClosing',
      'Impairment Surplus (R)': 'impairmentSurplus',
      'Cost Opening (R)': 'costOpening', 'Cost Closing (R)': 'costClosing',
      'Acc. Dep. Opening (R)': 'accDepOpening', 'Acc. Dep. Closing (R)': 'accDepClosing',
      'Remaining Useful Life (Months)': 'remainingUsefulLife', 'Reason': 'reason', 'Approval Status': 'approvalStatus',
      'Document Number': 'documentNumber'
    };
    var key = map[col]; if (!key) return '';
    var val = row[key]; if (val === null || val === undefined) return '';
    if (col === 'Reversal Date') { var d = new Date(val); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-ZA'); }
    if (col === 'Asset Register Item ID' || col === 'Barcode' || col === 'Latitude' || col === 'Longitude' || col === 'Remaining Useful Life (Months)') { return String(val); }
    if (col === 'Description' || col === 'Asset Type' || col === 'Category' || col === 'Sub-Category' ||
        col === 'Measurement Type' || col === 'Status' || col === 'Department' || col === 'Division' ||
        col === 'Cash/Non-Cash' || col === 'Infra/Non-Infra' ||
        col === 'Financial Year' || col === 'Reason' || col === 'Approval Status' ||
        col === 'Document Number') { return String(val); }
    return this.formatRand(Number(val));
  }

  isImpRevValueCol(col: string): boolean { return col.indexOf('(R)') >= 0 || col === 'Remaining Useful Life (Months)'; }

  exportImpRevExcel() {
    var self = this;
    var data = this.impRevReportData();
    if (!data || data.length === 0) return;
    var cols = this.impRevColumns();
    var wsData: any[][] = [[], ['Impairment Reversal Report'], ['FY ' + (this.impRevFilters.finYear || this.getActiveFinancialYear())], ['Generated: ' + new Date().toLocaleDateString('en-ZA')], ['Records: ' + data.length], [], cols];
    for (var ri = 0; ri < data.length; ri++) { var rowArr: any[] = []; for (var ci = 0; ci < cols.length; ci++) { rowArr.push(self.impRevRowValue(data[ri], cols[ci])); } wsData.push(rowArr); }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    var colWidths: any[] = []; for (var wi = 0; wi < cols.length; wi++) { colWidths.push({ wch: 22 }); }
    ws['!cols'] = colWidths;
    var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Imp Reversal');
    XLSX.writeFile(wb, 'impairment_reversal_report_' + new Date().toISOString().split('T')[0] + '.xlsx');
    this.snackBar.open('Exported ' + data.length + ' records to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  exportImpRevCsv() {
    var self = this;
    var data = this.impRevReportData();
    if (!data || data.length === 0) return;
    var cols = this.impRevColumns();
    var lines: string[] = [cols.map(function(c: string) { return '"' + c.replace(/"/g, '""') + '"'; }).join(',')];
    for (var ri = 0; ri < data.length; ri++) {
      var cells: string[] = [];
      for (var ci = 0; ci < cols.length; ci++) { var v = self.impRevRowValue(data[ri], cols[ci]); cells.push(v ? '"' + String(v).replace(/"/g, '""') + '"' : ''); }
      lines.push(cells.join(','));
    }
    var blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob); var link = document.createElement('a');
    link.setAttribute('href', url); link.setAttribute('download', 'impairment_reversal_report_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    this.snackBar.open('Exported ' + data.length + ' records to CSV', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  openRefurbFilters() {
    this.refurbReportData.set([]); this.refurbReportSubtitle.set(''); this.refurbReportGenerated.set(false);
    this.showRefurbFilters.set(true); this.showRevFilters.set(false); this.showImpFilters.set(false);
    this.showImpRevFilters.set(false); this.showPyaFilters.set(false); this.showPpaFilters.set(false);
    this.showFarFilters.set(false); this.showDepFilters.set(false); this.showDisposalFilters.set(false);
  }

  applyRefurbFilters() {
    this.showRefurbFilters.set(false);
    this.refurbGenerating.set(true);
    this.refurbReportData.set([]); this.refurbReportSubtitle.set(''); this.refurbReportGenerated.set(false);
    var self = this;
    var finYear = this.refurbFilters.finYear || this.getActiveFinancialYear();
    var params: any = { finYear: finYear, fromPeriod: this.refurbFilters.fromPeriod, toPeriod: this.refurbFilters.toPeriod };
    if (this.refurbFilters.typeId) { params.typeId = this.refurbFilters.typeId; }
    if (this.refurbFilters.categoryId) { params.categoryId = this.refurbFilters.categoryId; }
    if (this.refurbFilters.subCategoryId) { params.subCategoryId = this.refurbFilters.subCategoryId; }
    if (this.refurbFilters.measurementTypeId) { params.measurementTypeId = this.refurbFilters.measurementTypeId; }
    if (this.refurbFilters.statusId) { params.statusId = this.refurbFilters.statusId; }
    if (this.refurbFilters.assetItemId) { params.assetItemId = this.refurbFilters.assetItemId; }
    this.api.getRefurbishmentReport(params).subscribe({
      next: function(res: any) {
        var data: any[] = Array.isArray(res) ? res : (res.data || []);
        self.refurbReportData.set(data);
        self.refurbReportSubtitle.set('Refurbishment Report — FY ' + finYear + ' P' + (self.refurbFilters.fromPeriod || 1) + '–P' + (self.refurbFilters.toPeriod || 12) + ' — ' + data.length + ' records');
        self.refurbGenerating.set(false); self.refurbReportGenerated.set(true);
      },
      error: function() {
        self.refurbGenerating.set(false);
        self.snackBar.open('Failed to generate Refurbishment Report', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  refurbColumns(): string[] {
    return ['Asset Register Item ID', 'Barcode', 'Description', 'Asset Type', 'Category', 'Sub-Category', 'Measurement Type', 'Status',
      'Department', 'Division', 'Latitude', 'Longitude', 'Cash/Non-Cash', 'Infra/Non-Infra',
      'Refurbishment Date', 'Financial Year', 'Financial Period',
      'Debit Amount (R)', 'Credit Amount (R)', 'Depreciation Charge (R)', 'Revaluation Amount (R)', 'Impairment Amount (R)',
      'Opening Carrying Amount (R)', 'Closing Carrying Amount (R)',
      'Cost Opening (R)', 'Cost Closing (R)', 'Acc. Dep. Opening (R)', 'Acc. Dep. Closing (R)',
      'ATS Refurb Debit (R)', 'ATS Refurb Credit (R)'];
  }

  refurbRowValue(row: any, col: string): string {
    var map: Record<string, string> = {
      'Asset Register Item ID': 'assetId', 'Barcode': 'barcode', 'Description': 'description', 'Asset Type': 'assetType',
      'Category': 'assetCategory', 'Sub-Category': 'assetSubCategory', 'Measurement Type': 'measurementType',
      'Status': 'assetStatus', 'Department': 'department', 'Division': 'division',
      'Latitude': 'latitude', 'Longitude': 'longitude', 'Cash/Non-Cash': 'cashNonCash', 'Infra/Non-Infra': 'infraNonInfra',
      'Refurbishment Date': 'refurbDate', 'Financial Year': 'financialYear', 'Financial Period': 'financialPeriod',
      'Debit Amount (R)': 'debitAmount', 'Credit Amount (R)': 'creditAmount',
      'Depreciation Charge (R)': 'depreciationCharge', 'Revaluation Amount (R)': 'revaluationAmount',
      'Impairment Amount (R)': 'impairmentAmount',
      'Opening Carrying Amount (R)': 'openingCarryingAmount', 'Closing Carrying Amount (R)': 'closingCarryingAmount',
      'Cost Opening (R)': 'costOpening', 'Cost Closing (R)': 'costClosing',
      'Acc. Dep. Opening (R)': 'accDepOpening', 'Acc. Dep. Closing (R)': 'accDepClosing',
      'ATS Refurb Debit (R)': 'atsRefurbDebit', 'ATS Refurb Credit (R)': 'atsRefurbCredit'
    };
    var key = map[col]; if (!key) return '';
    var val = row[key]; if (val === null || val === undefined) return '';
    if (col === 'Refurbishment Date') { var d = new Date(val); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-ZA'); }
    if (col === 'Asset Register Item ID' || col === 'Barcode' || col === 'Latitude' || col === 'Longitude' || col === 'Financial Period') { return String(val); }
    if (col === 'Description' || col === 'Asset Type' || col === 'Category' || col === 'Sub-Category' ||
        col === 'Measurement Type' || col === 'Status' || col === 'Department' || col === 'Division' ||
        col === 'Cash/Non-Cash' || col === 'Infra/Non-Infra' || col === 'Financial Year') { return String(val); }
    return this.formatRand(Number(val));
  }

  isRefurbValueCol(col: string): boolean { return col.indexOf('(R)') >= 0 || col === 'Financial Period'; }

  exportRefurbExcel() {
    var self = this;
    var data = this.refurbReportData();
    if (!data || data.length === 0) return;
    var cols = this.refurbColumns();
    var wsData: any[][] = [[], ['Refurbishment Report'], ['FY ' + (this.refurbFilters.finYear || this.getActiveFinancialYear())], ['Generated: ' + new Date().toLocaleDateString('en-ZA')], ['Records: ' + data.length], [], cols];
    for (var ri = 0; ri < data.length; ri++) { var rowArr: any[] = []; for (var ci = 0; ci < cols.length; ci++) { rowArr.push(self.refurbRowValue(data[ri], cols[ci])); } wsData.push(rowArr); }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    var colWidths: any[] = []; for (var wi = 0; wi < cols.length; wi++) { colWidths.push({ wch: 22 }); }
    ws['!cols'] = colWidths;
    var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Refurbishment');
    XLSX.writeFile(wb, 'refurbishment_report_' + new Date().toISOString().split('T')[0] + '.xlsx');
    this.snackBar.open('Exported ' + data.length + ' records to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  exportRefurbCsv() {
    var self = this;
    var data = this.refurbReportData();
    if (!data || data.length === 0) return;
    var cols = this.refurbColumns();
    var lines: string[] = [cols.map(function(c: string) { return '"' + c.replace(/"/g, '""') + '"'; }).join(',')];
    for (var ri = 0; ri < data.length; ri++) {
      var cells: string[] = [];
      for (var ci = 0; ci < cols.length; ci++) { var v = self.refurbRowValue(data[ri], cols[ci]); cells.push(v ? '"' + String(v).replace(/"/g, '""') + '"' : ''); }
      lines.push(cells.join(','));
    }
    var blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob); var link = document.createElement('a');
    link.setAttribute('href', url); link.setAttribute('download', 'refurbishment_report_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    this.snackBar.open('Exported ' + data.length + ' records to CSV', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  openPyaFilters() {
    this.pyaReportData.set([]); this.pyaReportSubtitle.set(''); this.pyaReportGenerated.set(false);
    this.showPyaFilters.set(true); this.showRevFilters.set(false); this.showImpFilters.set(false);
    this.showImpRevFilters.set(false); this.showRefurbFilters.set(false); this.showPpaFilters.set(false);
    this.showFarFilters.set(false); this.showDepFilters.set(false); this.showDisposalFilters.set(false);
  }

  applyPyaFilters() {
    this.showPyaFilters.set(false);
    this.pyaGenerating.set(true);
    this.pyaReportData.set([]); this.pyaReportSubtitle.set(''); this.pyaReportGenerated.set(false);
    var self = this;
    var finYear = this.pyaFilters.finYear || this.getActiveFinancialYear();
    var params: any = { finYear: finYear, fromPeriod: this.pyaFilters.fromPeriod, toPeriod: this.pyaFilters.toPeriod };
    if (this.pyaFilters.typeId) { params.typeId = this.pyaFilters.typeId; }
    if (this.pyaFilters.categoryId) { params.categoryId = this.pyaFilters.categoryId; }
    if (this.pyaFilters.subCategoryId) { params.subCategoryId = this.pyaFilters.subCategoryId; }
    if (this.pyaFilters.measurementTypeId) { params.measurementTypeId = this.pyaFilters.measurementTypeId; }
    if (this.pyaFilters.statusId) { params.statusId = this.pyaFilters.statusId; }
    if (this.pyaFilters.assetItemId) { params.assetItemId = this.pyaFilters.assetItemId; }
    this.api.getPriorYearAdjustmentsReport(params).subscribe({
      next: function(res: any) {
        var data: any[] = Array.isArray(res) ? res : (res.data || []);
        self.pyaReportData.set(data);
        self.pyaReportSubtitle.set('Prior Year Adjustments — FY ' + finYear + ' P' + (self.pyaFilters.fromPeriod || 1) + '–P' + (self.pyaFilters.toPeriod || 12) + ' — ' + data.length + ' records');
        self.pyaGenerating.set(false); self.pyaReportGenerated.set(true);
      },
      error: function() {
        self.pyaGenerating.set(false);
        self.snackBar.open('Failed to generate Prior Year Adjustments Report', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  pyaColumns(): string[] {
    return ['Asset Register Item ID', 'Barcode', 'Description', 'Asset Type', 'Category', 'Sub-Category', 'Measurement Type', 'Status',
      'Department', 'Division', 'Latitude', 'Longitude', 'Cash/Non-Cash', 'Infra/Non-Infra',
      'Adjustment Type', 'Effective Date', 'Financial Year', 'Approval Status',
      'Opening Cost (R)', 'Opening Acc. Dep. (R)', 'Opening Acc. Imp. (R)', 'Opening Carrying Amount (R)', 'Opening Reval Reserve (R)',
      'Snapshot RUL',
      'New Cost Amount (R)', 'New Valuation Amount (R)', 'New Impairment Amount (R)', 'New Remaining Useful Life',
      'Cost Delta — Current Period (R)', 'Acc. Dep. Delta — Current Period (R)',
      'Acc. Imp. Delta — Current Period (R)', 'RR Delta — Current Period (R)',
      'Dep. Charge Delta — Current Period (R)',
      'Cost Delta — Comparative Period (R)', 'Acc. Dep. Delta — Comparative Period (R)',
      'Acc. Imp. Delta — Comparative Period (R)', 'RR Delta — Comparative Period (R)',
      'Dep. Charge Delta — Comparative Period (R)',
      'Cost Delta — Prior Periods (R)', 'Acc. Dep. Delta — Prior Periods (R)',
      'Acc. Imp. Delta — Prior Periods (R)', 'RR Delta — Prior Periods (R)',
      'Dep. Charge Delta — Prior Periods (R)'];
  }

  pyaRowValue(row: any, col: string): string {
    var map: Record<string, string> = {
      'Asset Register Item ID': 'assetId', 'Barcode': 'barcode', 'Description': 'description', 'Asset Type': 'assetType',
      'Category': 'assetCategory', 'Sub-Category': 'assetSubCategory', 'Measurement Type': 'measurementType',
      'Status': 'assetStatus', 'Department': 'department', 'Division': 'division',
      'Latitude': 'latitude', 'Longitude': 'longitude', 'Cash/Non-Cash': 'cashNonCash', 'Infra/Non-Infra': 'infraNonInfra',
      'Adjustment Type': 'adjustmentType', 'Effective Date': 'effectiveDate', 'Financial Year': 'financialYear',
      'Approval Status': 'approvalStatus',
      'Opening Cost (R)': 'openingCost', 'Opening Acc. Dep. (R)': 'openingAccDep',
      'Opening Acc. Imp. (R)': 'openingAccImp', 'Opening Carrying Amount (R)': 'openingCarryingAmount',
      'Opening Reval Reserve (R)': 'openingRevalReserve',
      'Snapshot RUL': 'snapshotRemainingUsefulLife',
      'New Cost Amount (R)': 'newCostAmount', 'New Valuation Amount (R)': 'newValuationAmount',
      'New Impairment Amount (R)': 'newImpairmentAmount',
      'New Remaining Useful Life': 'newRemainingUsefulLife',
      'Cost Delta — Current Period (R)': 'costDeltaCurrentPeriod',
      'Acc. Dep. Delta — Current Period (R)': 'accDepDeltaCurrentPeriod',
      'Acc. Imp. Delta — Current Period (R)': 'accImpDeltaCurrentPeriod',
      'RR Delta — Current Period (R)': 'rrDeltaCurrentPeriod',
      'Dep. Charge Delta — Current Period (R)': 'depChargeDeltaCurrentPeriod',
      'Cost Delta — Comparative Period (R)': 'costDeltaComparativePeriod',
      'Acc. Dep. Delta — Comparative Period (R)': 'accDepDeltaComparativePeriod',
      'Acc. Imp. Delta — Comparative Period (R)': 'accImpDeltaComparativePeriod',
      'RR Delta — Comparative Period (R)': 'rrDeltaComparativePeriod',
      'Dep. Charge Delta — Comparative Period (R)': 'depChargeDeltaComparativePeriod',
      'Cost Delta — Prior Periods (R)': 'costDeltaPriorPeriods',
      'Acc. Dep. Delta — Prior Periods (R)': 'accDepDeltaPriorPeriods',
      'Acc. Imp. Delta — Prior Periods (R)': 'accImpDeltaPriorPeriods',
      'RR Delta — Prior Periods (R)': 'rrDeltaPriorPeriods',
      'Dep. Charge Delta — Prior Periods (R)': 'depChargeDeltaPriorPeriods'
    };
    var key = map[col]; if (!key) return '';
    var val = row[key]; if (val === null || val === undefined) return '';
    if (col === 'Effective Date') { var d = new Date(val); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-ZA'); }
    if (col === 'Asset Register Item ID' || col === 'Barcode' || col === 'Latitude' || col === 'Longitude') { return String(val); }
    if (col === 'New Remaining Useful Life' || col === 'Snapshot RUL') { return Number(val).toFixed(2); }
    if (col === 'Description' || col === 'Asset Type' || col === 'Category' || col === 'Sub-Category' ||
        col === 'Measurement Type' || col === 'Status' || col === 'Department' || col === 'Division' ||
        col === 'Cash/Non-Cash' || col === 'Infra/Non-Infra' ||
        col === 'Adjustment Type' || col === 'Financial Year' || col === 'Approval Status') { return String(val); }
    return this.formatRand(Number(val));
  }

  isPyaValueCol(col: string): boolean { return col.indexOf('(R)') >= 0; }

  exportPyaExcel() {
    var self = this;
    var data = this.pyaReportData();
    if (!data || data.length === 0) return;
    var cols = this.pyaColumns();
    var wsData: any[][] = [[], ['Prior Year Adjustments Report'], ['FY ' + (this.pyaFilters.finYear || this.getActiveFinancialYear())], ['Generated: ' + new Date().toLocaleDateString('en-ZA')], ['Records: ' + data.length], [], cols];
    for (var ri = 0; ri < data.length; ri++) { var rowArr: any[] = []; for (var ci = 0; ci < cols.length; ci++) { rowArr.push(self.pyaRowValue(data[ri], cols[ci])); } wsData.push(rowArr); }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    var colWidths: any[] = []; for (var wi = 0; wi < cols.length; wi++) { colWidths.push({ wch: 22 }); }
    ws['!cols'] = colWidths;
    var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Prior Year Adj');
    XLSX.writeFile(wb, 'prior_year_adjustments_' + new Date().toISOString().split('T')[0] + '.xlsx');
    this.snackBar.open('Exported ' + data.length + ' records to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  exportPyaCsv() {
    var self = this;
    var data = this.pyaReportData();
    if (!data || data.length === 0) return;
    var cols = this.pyaColumns();
    var lines: string[] = [cols.map(function(c: string) { return '"' + c.replace(/"/g, '""') + '"'; }).join(',')];
    for (var ri = 0; ri < data.length; ri++) {
      var cells: string[] = [];
      for (var ci = 0; ci < cols.length; ci++) { var v = self.pyaRowValue(data[ri], cols[ci]); cells.push(v ? '"' + String(v).replace(/"/g, '""') + '"' : ''); }
      lines.push(cells.join(','));
    }
    var blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob); var link = document.createElement('a');
    link.setAttribute('href', url); link.setAttribute('download', 'prior_year_adjustments_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    this.snackBar.open('Exported ' + data.length + ' records to CSV', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  openPpaFilters() {
    this.ppaReportData.set([]); this.ppaReportSubtitle.set(''); this.ppaReportGenerated.set(false);
    this.showPpaFilters.set(true); this.showRevFilters.set(false); this.showImpFilters.set(false);
    this.showImpRevFilters.set(false); this.showRefurbFilters.set(false); this.showPyaFilters.set(false);
    this.showFarFilters.set(false); this.showDepFilters.set(false); this.showDisposalFilters.set(false);
  }

  applyPpaFilters() {
    this.showPpaFilters.set(false);
    this.ppaGenerating.set(true);
    this.ppaReportData.set([]); this.ppaReportSubtitle.set(''); this.ppaReportGenerated.set(false);
    var self = this;
    var finYear = this.ppaFilters.finYear || this.getActiveFinancialYear();
    var params: any = { finYear: finYear, fromPeriod: this.ppaFilters.fromPeriod, toPeriod: this.ppaFilters.toPeriod };
    if (this.ppaFilters.typeId) { params.typeId = this.ppaFilters.typeId; }
    if (this.ppaFilters.categoryId) { params.categoryId = this.ppaFilters.categoryId; }
    if (this.ppaFilters.subCategoryId) { params.subCategoryId = this.ppaFilters.subCategoryId; }
    if (this.ppaFilters.measurementTypeId) { params.measurementTypeId = this.ppaFilters.measurementTypeId; }
    if (this.ppaFilters.statusId) { params.statusId = this.ppaFilters.statusId; }
    if (this.ppaFilters.assetItemId) { params.assetItemId = this.ppaFilters.assetItemId; }
    this.api.getPriorPeriodAdjustmentsReport(params).subscribe({
      next: function(res: any) {
        var data: any[] = Array.isArray(res) ? res : (res.data || []);
        self.ppaReportData.set(data);
        self.ppaReportSubtitle.set('Prior Period Adjustments — FY ' + finYear + ' P' + (self.ppaFilters.fromPeriod || 1) + '–P' + (self.ppaFilters.toPeriod || 12) + ' — ' + data.length + ' records');
        self.ppaGenerating.set(false); self.ppaReportGenerated.set(true);
      },
      error: function() {
        self.ppaGenerating.set(false);
        self.snackBar.open('Failed to generate Prior Period Adjustments Report', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  ppaColumns(): string[] {
    return ['Asset Register Item ID', 'Barcode', 'Description', 'Asset Type', 'Category', 'Sub-Category', 'Measurement Type', 'Status',
      'Department', 'Division', 'Latitude', 'Longitude', 'Cash/Non-Cash', 'Infra/Non-Infra',
      'Adjustment Type', 'Target Financial Year', 'Target Period', 'Approval Status',
      'Debit Amount (R)', 'Credit Amount (R)', 'Adjustment Amount (R)',
      'New Depreciation Amount (R)', 'New Cost Amount (R)',
      'New Impairment Amount (R)', 'New Impairment Reversal Amount (R)', 'New Revaluation Amount (R)',
      'Snapshot Cost (R)', 'Opening Acc. Dep. (R)', 'Snapshot Acc. Imp. (R)',
      'Opening Carrying Amount (R)', 'Snapshot Reval Reserve (R)',
      'Transaction Date', 'Narration'];
  }

  ppaRowValue(row: any, col: string): string {
    var map: Record<string, string> = {
      'Asset Register Item ID': 'assetId', 'Barcode': 'barcode', 'Description': 'description', 'Asset Type': 'assetType',
      'Category': 'assetCategory', 'Sub-Category': 'assetSubCategory', 'Measurement Type': 'measurementType',
      'Status': 'assetStatus', 'Department': 'department', 'Division': 'division',
      'Latitude': 'latitude', 'Longitude': 'longitude', 'Cash/Non-Cash': 'cashNonCash', 'Infra/Non-Infra': 'infraNonInfra',
      'Adjustment Type': 'adjustmentType', 'Target Financial Year': 'targetFinancialYear',
      'Target Period': 'targetPeriod', 'Approval Status': 'approvalStatus',
      'Debit Amount (R)': 'debitAmount', 'Credit Amount (R)': 'creditAmount',
      'Adjustment Amount (R)': 'adjustmentAmount', 'New Depreciation Amount (R)': 'newDepreciationAmount',
      'New Cost Amount (R)': 'newCostAmount', 'New Impairment Amount (R)': 'newImpairmentAmount',
      'New Impairment Reversal Amount (R)': 'newImpairmentReversalAmount',
      'New Revaluation Amount (R)': 'newRevaluationAmount',
      'Snapshot Cost (R)': 'snapshotCost', 'Opening Acc. Dep. (R)': 'openingAccDep',
      'Snapshot Acc. Imp. (R)': 'snapshotAccImp',
      'Opening Carrying Amount (R)': 'openingCarryingAmount', 'Snapshot Reval Reserve (R)': 'snapshotRevalReserve',
      'Transaction Date': 'transactionDate', 'Narration': 'narration'
    };
    var key = map[col]; if (!key) return '';
    var val = row[key]; if (val === null || val === undefined) return '';
    if (col === 'Transaction Date') { var d = new Date(val); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-ZA'); }
    if (col === 'Asset Register Item ID' || col === 'Barcode' || col === 'Latitude' || col === 'Longitude' || col === 'Target Period') { return String(val); }
    if (col === 'Description' || col === 'Asset Type' || col === 'Category' || col === 'Sub-Category' ||
        col === 'Measurement Type' || col === 'Status' || col === 'Department' || col === 'Division' ||
        col === 'Cash/Non-Cash' || col === 'Infra/Non-Infra' ||
        col === 'Adjustment Type' || col === 'Target Financial Year' || col === 'Approval Status' ||
        col === 'Narration') { return String(val); }
    return this.formatRand(Number(val));
  }

  isPpaValueCol(col: string): boolean { return col.indexOf('(R)') >= 0 || col === 'Target Period'; }

  exportPpaExcel() {
    var self = this;
    var data = this.ppaReportData();
    if (!data || data.length === 0) return;
    var cols = this.ppaColumns();
    var wsData: any[][] = [[], ['Prior Period Adjustments Report'], ['FY ' + (this.ppaFilters.finYear || this.getActiveFinancialYear())], ['Generated: ' + new Date().toLocaleDateString('en-ZA')], ['Records: ' + data.length], [], cols];
    for (var ri = 0; ri < data.length; ri++) { var rowArr: any[] = []; for (var ci = 0; ci < cols.length; ci++) { rowArr.push(self.ppaRowValue(data[ri], cols[ci])); } wsData.push(rowArr); }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    var colWidths: any[] = []; for (var wi = 0; wi < cols.length; wi++) { colWidths.push({ wch: 22 }); }
    ws['!cols'] = colWidths;
    var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Prior Period Adj');
    XLSX.writeFile(wb, 'prior_period_adjustments_' + new Date().toISOString().split('T')[0] + '.xlsx');
    this.snackBar.open('Exported ' + data.length + ' records to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  exportPpaCsv() {
    var self = this;
    var data = this.ppaReportData();
    if (!data || data.length === 0) return;
    var cols = this.ppaColumns();
    var lines: string[] = [cols.map(function(c: string) { return '"' + c.replace(/"/g, '""') + '"'; }).join(',')];
    for (var ri = 0; ri < data.length; ri++) {
      var cells: string[] = [];
      for (var ci = 0; ci < cols.length; ci++) { var v = self.ppaRowValue(data[ri], cols[ci]); cells.push(v ? '"' + String(v).replace(/"/g, '""') + '"' : ''); }
      lines.push(cells.join(','));
    }
    var blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob); var link = document.createElement('a');
    link.setAttribute('href', url); link.setAttribute('download', 'prior_period_adjustments_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    this.snackBar.open('Exported ' + data.length + ' records to CSV', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  printReport() {
    window.print();
  }

  openAfsFilters() {
    this.showAfsFilters.set(true);
    this.showFarFilters.set(false);
    this.showDepFilters.set(false);
    this.showDisposalFilters.set(false);
  }

  closeAfsReport() {
    this.showAfsFilters.set(false);
    this.afsReportGenerated.set(false);
    this.afsDisplayRows.set([]);
  }

  applyAfsFilters() {
    var self = this;
    self.showAfsFilters.set(false);
    self.afsGenerating.set(true);
    self.afsReportGenerated.set(false);
    self.afsDisplayRows.set([]);
    var finYear = self.afsFilters.finYear || self.getActiveFinancialYear();
    self.api.getAfsReconciliation({ finYear: finYear }).subscribe({
      next: function(rows: any[]) {
        self.afsDisplayRows.set(self.buildAfsDisplayRows(rows));
        self.afsReportSubtitle.set('AFS Reconciliation (Appendix B) — FY ' + finYear + ' — ' + rows.length + ' categories');
        self.afsGenerating.set(false);
        self.afsReportGenerated.set(true);
      },
      error: function() {
        self.afsGenerating.set(false);
        self.snackBar.open('Failed to generate AFS Reconciliation', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  buildAfsDisplayRows(data: any[]): any[] {
    var typeMap: Record<string, any[]> = {};
    var typeOrder: string[] = [];
    for (var i = 0; i < data.length; i++) {
      var r = data[i];
      var typeKey = String(r.assetTypeId) + '|' + String(r.assetTypeDesc);
      if (!typeMap[typeKey]) {
        typeMap[typeKey] = [];
        typeOrder.push(typeKey);
      }
      typeMap[typeKey].push(r);
    }
    var result: any[] = [];
    var numFields = ['costOpeningBalance','correctionOfError','acquisitions','decommissioning','workInProgress','refurbishment','changeInEstimate','fairValueAdjustment','revaluation','transferReceived','transferMade','costDisposal','costClosingBalance','depOpeningBalance','depreciation','depAdjustments','depDisposal','depTransfer','depClosingBalance','impOpeningBalance','impairment','impairmentReversal','impDisposal','impTransfers','impClosingBalance','carryingAmount'];
    var grandTotals: Record<string, number> = {};
    for (var fi = 0; fi < numFields.length; fi++) { grandTotals[numFields[fi]] = 0; }

    for (var ti = 0; ti < typeOrder.length; ti++) {
      var tKey = typeOrder[ti];
      var cats = typeMap[tKey];
      var typeParts = tKey.split('|');
      result.push({ _rowType: 'type-header', label: typeParts.slice(1).join('|') });
      var typeTotals: Record<string, number> = {};
      for (var fi2 = 0; fi2 < numFields.length; fi2++) { typeTotals[numFields[fi2]] = 0; }
      for (var ci = 0; ci < cats.length; ci++) {
        var cat = cats[ci];
        var dr: any = { _rowType: 'category', assetCategoryId: cat.assetCategoryId, assetCategoryDesc: cat.assetCategoryDesc };
        for (var fi3 = 0; fi3 < numFields.length; fi3++) {
          var fld = numFields[fi3];
          var v = Number(cat[fld] || 0);
          dr[fld] = v;
          typeTotals[fld] += v;
          grandTotals[fld] += v;
        }
        dr.costRestatedOb = dr.costOpeningBalance + dr.correctionOfError;
        dr.depOtherChanges = dr.correctionOfError;
        dr.depRestatedOb = dr.depOpeningBalance + dr.depOtherChanges;
        dr.impOtherChanges = 0;
        dr.impRestatedOb = dr.impOpeningBalance + dr.impOtherChanges;
        result.push(dr);
      }
      var subRow: any = { _rowType: 'subtotal', label: 'TOTAL — ' + typeParts.slice(1).join('|') };
      for (var fi4 = 0; fi4 < numFields.length; fi4++) { subRow[numFields[fi4]] = typeTotals[numFields[fi4]]; }
      subRow.costRestatedOb = subRow.costOpeningBalance + subRow.correctionOfError;
      subRow.depOtherChanges = subRow.correctionOfError;
      subRow.depRestatedOb = subRow.depOpeningBalance + subRow.depOtherChanges;
      subRow.impOtherChanges = 0;
      subRow.impRestatedOb = subRow.impOpeningBalance + subRow.impOtherChanges;
      result.push(subRow);
    }
    var gtRow: any = { _rowType: 'grand-total', label: 'GRAND TOTAL' };
    for (var fi5 = 0; fi5 < numFields.length; fi5++) { gtRow[numFields[fi5]] = grandTotals[numFields[fi5]]; }
    gtRow.costRestatedOb = gtRow.costOpeningBalance + gtRow.correctionOfError;
    gtRow.depOtherChanges = gtRow.correctionOfError;
    gtRow.depRestatedOb = gtRow.depOpeningBalance + gtRow.depOtherChanges;
    gtRow.impOtherChanges = 0;
    gtRow.impRestatedOb = gtRow.impOpeningBalance + gtRow.impOtherChanges;
    result.push(gtRow);
    return result;
  }

  openAfsDrilldown(row: any) {
    if (row._rowType !== 'category') return;
    var self = this;
    self.afsDrilldownCategoryDesc.set(row.assetCategoryDesc);
    self.afsDrilldownCategoryId.set(row.assetCategoryId);
    self.afsDrilldownVisible.set(true);
    self.afsDrilldownLoading.set(true);
    self.afsDrilldownData.set([]);
    var finYear = self.afsFilters.finYear || self.getActiveFinancialYear();
    self.api.getAfsReconciliationDrilldown({ finYear: finYear, categoryId: row.assetCategoryId }).subscribe({
      next: function(rows: any[]) {
        var enriched: any[] = [];
        for (var i = 0; i < rows.length; i++) {
          var r: any = Object.assign({}, rows[i]);
          r.costRestatedOb = Number(r.costOpeningBalance || 0) + Number(r.correctionOfError || 0);
          r.depOtherChanges = Number(r.correctionOfError || 0);
          r.depRestatedOb = Number(r.depOpeningBalance || 0) + r.depOtherChanges;
          r.impOtherChanges = 0;
          r.impRestatedOb = Number(r.impOpeningBalance || 0);
          enriched.push(r);
        }
        self.afsDrilldownData.set(enriched);
        self.afsDrilldownLoading.set(false);
      },
      error: function() {
        self.afsDrilldownLoading.set(false);
        self.snackBar.open('Failed to load drilldown data', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  closeAfsDrilldown() {
    this.afsDrilldownVisible.set(false);
    this.afsDrilldownData.set([]);
  }

  afsR(v: any): string {
    var n = Number(v || 0);
    return 'R\u00a0' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  exportAfsExcel() {
    var self = this;
    var rows = self.afsDisplayRows();
    if (!rows || rows.length === 0) return;
    var finYear = self.afsFilters.finYear || self.getActiveFinancialYear();
    var header1 = ['', '', 'COST', '', '', '', '', '', '', '', '', '', '', '', '', 'ACCUMULATED DEPRECIATION', '', '', '', '', '', '', '', 'ACCUMULATED IMPAIRMENT', '', '', '', '', '', '', '', 'CARRYING AMOUNT'];
    var header2 = ['Category', 'Asset Type', 'Opening Balance', 'Correction of Error', 'Restated OB', 'Acquisitions', 'Decommissioning', 'Work In Progress', 'Refurbishment', 'Change in Estimate', 'Fair Value Adj', 'Revaluation', 'Transfer Received', 'Transfer Made', 'Disposal', 'Closing Balance', 'Opening Balance', 'Other Changes', 'Restated OB', 'Depreciation', 'Dep Adjustments', 'Disposal', 'Transfer', 'Closing Balance', 'Opening Balance', 'Other Changes', 'Restated OB', 'Impairment', 'Imp Reversal', 'Disposal', 'Transfers', 'Closing Balance', 'Carrying Amount'];
    var wsData: any[][] = [[], ['AFS Reconciliation (Appendix B)'], ['FY ' + finYear], ['Generated: ' + new Date().toLocaleDateString('en-ZA')], [], header1, header2];
    for (var ri = 0; ri < rows.length; ri++) {
      var row = rows[ri];
      if (row._rowType === 'type-header') {
        wsData.push([row.label]);
        continue;
      }
      var label = row._rowType === 'grand-total' ? 'GRAND TOTAL' : (row._rowType === 'subtotal' ? row.label : row.assetCategoryDesc);
      wsData.push([
        label, '',
        Number(row.costOpeningBalance || 0), Number(row.correctionOfError || 0), Number(row.costRestatedOb || 0),
        Number(row.acquisitions || 0), Number(row.decommissioning || 0), Number(row.workInProgress || 0),
        Number(row.refurbishment || 0), Number(row.changeInEstimate || 0), Number(row.fairValueAdjustment || 0),
        Number(row.revaluation || 0), Number(row.transferReceived || 0), Number(row.transferMade || 0),
        Number(row.costDisposal || 0), Number(row.costClosingBalance || 0),
        Number(row.depOpeningBalance || 0), Number(row.depOtherChanges || 0), Number(row.depRestatedOb || 0),
        Number(row.depreciation || 0), Number(row.depAdjustments || 0), Number(row.depDisposal || 0),
        Number(row.depTransfer || 0), Number(row.depClosingBalance || 0),
        Number(row.impOpeningBalance || 0), Number(row.impOtherChanges || 0), Number(row.impRestatedOb || 0),
        Number(row.impairment || 0), Number(row.impairmentReversal || 0), Number(row.impDisposal || 0),
        Number(row.impTransfers || 0), Number(row.impClosingBalance || 0),
        Number(row.carryingAmount || 0)
      ]);
    }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    var colWidths: any[] = [{ wch: 35 }, { wch: 25 }];
    for (var ci = 2; ci < 33; ci++) { colWidths.push({ wch: 18 }); }
    ws['!cols'] = colWidths;
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AFS Recon');
    XLSX.writeFile(wb, 'afs_reconciliation_' + new Date().toISOString().split('T')[0] + '.xlsx');
    self.snackBar.open('Exported to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  exportAfsDrilldownExcel() {
    var self = this;
    var data = self.afsDrilldownData();
    if (!data || data.length === 0) return;
    var finYear = self.afsFilters.finYear || self.getActiveFinancialYear();
    var categoryDesc = self.afsDrilldownCategoryDesc();
    var header1 = ['Asset ID', 'Description', 'Sub-Category', 'Measurement Type', 'Status',
      'COST', '', '', '', '', '', '', '', '', '', '',
      'ACCUMULATED DEPRECIATION', '', '', '', '', '', '', '',
      'ACCUMULATED IMPAIRMENT', '', '', '', '', '', '', '',
      'CARRYING AMOUNT'];
    var header2 = ['', '', '', '', '',
      'Opening Balance', 'Correction of Error', 'Restated OB', 'Acquisitions', 'Decommissioning',
      'Work In Progress', 'Refurbishment', 'Change in Estimate', 'Fair Value Adj', 'Revaluation',
      'Revaluation', 'Transfer Received', 'Transfer Made', 'Disposal', 'Closing Balance',
      'Opening Balance', 'Other Changes', 'Restated OB', 'Depreciation', 'Dep Adjustments',
      'Disposal', 'Transfer', 'Closing Balance',
      'Opening Balance', 'Other Changes', 'Restated OB', 'Impairment', 'Imp Reversal',
      'Disposal', 'Transfers', 'Closing Balance',
      'Carrying Amount'];
    var wsData: any[][] = [
      [],
      ['AFS Reconciliation (Appendix B) — Asset Drilldown'],
      [categoryDesc],
      ['FY ' + finYear],
      ['Generated: ' + new Date().toLocaleDateString('en-ZA')],
      [],
      header1,
      header2
    ];
    for (var ri = 0; ri < data.length; ri++) {
      var r = data[ri];
      var costRestatedOb = Number(r.costOpeningBalance || 0) + Number(r.correctionOfError || 0);
      var depOtherChanges = Number(r.correctionOfError || 0);
      var depRestatedOb = Number(r.depOpeningBalance || 0) + depOtherChanges;
      var impRestatedOb = Number(r.impOpeningBalance || 0);
      var carryingAmount = Number(r.costClosingBalance || 0) - Number(r.depClosingBalance || 0) - Number(r.impClosingBalance || 0);
      wsData.push([
        r.assetId, r.description, r.subCategory, r.measurementType, r.assetStatus,
        Number(r.costOpeningBalance || 0), Number(r.correctionOfError || 0), costRestatedOb,
        Number(r.acquisitions || 0), Number(r.decommissioning || 0), Number(r.workInProgress || 0),
        Number(r.refurbishment || 0), Number(r.changeInEstimate || 0), Number(r.fairValueAdjustment || 0),
        Number(r.revaluation || 0), Number(r.transferReceived || 0), Number(r.transferMade || 0),
        Number(r.costDisposal || 0), Number(r.costClosingBalance || 0),
        Number(r.depOpeningBalance || 0), depOtherChanges, depRestatedOb,
        Number(r.depreciation || 0), Number(r.depAdjustments || 0), Number(r.depDisposal || 0),
        Number(r.depTransfer || 0), Number(r.depClosingBalance || 0),
        Number(r.impOpeningBalance || 0), 0, impRestatedOb,
        Number(r.impairment || 0), Number(r.impairmentReversal || 0), Number(r.impDisposal || 0),
        Number(r.impTransfers || 0), Number(r.impClosingBalance || 0),
        carryingAmount
      ]);
    }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    var colWidths: any[] = [{ wch: 18 }, { wch: 30 }, { wch: 22 }, { wch: 20 }, { wch: 16 }];
    for (var ci = 5; ci < 37; ci++) { colWidths.push({ wch: 18 }); }
    ws['!cols'] = colWidths;
    var wb = XLSX.utils.book_new();
    var safeSheet = categoryDesc.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 30) || 'Drilldown';
    XLSX.utils.book_append_sheet(wb, ws, safeSheet);
    var safeCategory = categoryDesc.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').substring(0, 40);
    XLSX.writeFile(wb, 'afs_drilldown_' + safeCategory + '_' + new Date().toISOString().split('T')[0] + '.xlsx');
    self.snackBar.open('Drilldown exported to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  openCustomFarFilters() {
    if (!this.customFarSelectedKeys().length) {
      this.customFarSelectedKeys.set([...this.customFarDefaultKeys]);
    }
    this.showCustomFarFilters.set(true);
    this.showFarFilters.set(false);
    this.showDepFilters.set(false);
    this.showDisposalFilters.set(false);
    this.showLocFilters.set(false);
    this.showRevFilters.set(false);
    this.showImpFilters.set(false);
    this.showImpRevFilters.set(false);
    this.showRefurbFilters.set(false);
    this.showPyaFilters.set(false);
    this.showPpaFilters.set(false);
    this.showAfsFilters.set(false);
  }

  closeCustomFarReport() {
    this.showCustomFarFilters.set(false);
    this.customFarReportGenerated.set(false);
    this.customFarReportRows.set([]);
    this.customFarActiveColumns.set([]);
    this.customFarGenerating.set(false);
  }

  applyCustomFarFilters() {
    var self = this;
    var keys = self.customFarSelectedKeys();
    if (!keys || keys.length === 0) {
      self.snackBar.open('Please select at least one column', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    self.showCustomFarFilters.set(false);
    self.customFarGenerating.set(true);
    self.customFarReportGenerated.set(false);
    self.customFarReportRows.set([]);
    self.customFarActiveColumns.set([]);
    self.customFarPage.set(0);
    var finYear = self.customFarFilters.finYear || self.getActiveFinancialYear();
    var params: any = { finYear: finYear, isSummary: true };
    if (self.customFarFilters.fromPeriod) { params.fromPeriod = self.customFarFilters.fromPeriod; }
    if (self.customFarFilters.toPeriod) { params.toPeriod = self.customFarFilters.toPeriod; }
    if (self.customFarFilters.typeId) { params.typeId = self.customFarFilters.typeId; }
    if (self.customFarFilters.categoryId) { params.categoryId = self.customFarFilters.categoryId; }
    if (self.customFarFilters.subCategoryId) { params.subCategoryId = self.customFarFilters.subCategoryId; }
    if (self.customFarFilters.measurementTypeId) { params.measurementTypeId = self.customFarFilters.measurementTypeId; }
    if (self.customFarFilters.statusId) { params.assetStatus = self.customFarFilters.statusId; }
    if (self.customFarFilters.assetItemId) { params.assetId = self.customFarFilters.assetItemId; }
    if (self.customFarFilters.acquisitionsOnly) {
      params.acquisitionsOnly = true;
      if (!self.customFarFilters.finYear) { params.acquisitionsAllYears = true; }
    }
    self.api.getFarReport(params).subscribe({
      next: function(res: any) {
        var data = res.data || [];
        var cols = self.customFarSelectedKeys();
        var rows: any[] = [];
        for (var i = 0; i < data.length; i++) {
          var r: any = {};
          for (var j = 0; j < cols.length; j++) {
            r[cols[j]] = data[i][cols[j]] != null ? data[i][cols[j]] : '';
          }
          rows.push(r);
        }
        var periodLabel = 'P' + (self.customFarFilters.fromPeriod || 1) + '\u2013P' + (self.customFarFilters.toPeriod || 12);
        self.customFarActiveColumns.set([...cols]);
        self.customFarReportRows.set(rows);
        self.customFarReportSubtitle.set('FY ' + finYear + ' \u00b7 ' + periodLabel + ' \u00b7 ' + (res.totalRecords || data.length) + ' records \u00b7 ' + cols.length + ' columns');
        self.customFarReportGenerated.set(true);
        self.customFarGenerating.set(false);
      },
      error: function() {
        self.customFarGenerating.set(false);
        self.snackBar.open('Failed to generate Custom FAR report', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  customFarGroupNames(): string[] {
    var search = (this.customFarColumnSearch || '').toLowerCase();
    var groups: string[] = [];
    var seen: {[k: string]: boolean} = {};
    for (var i = 0; i < this.customFarColumnCatalogue.length; i++) {
      var col = this.customFarColumnCatalogue[i];
      if (search && col.label.toLowerCase().indexOf(search) < 0 && col.key.toLowerCase().indexOf(search) < 0) { continue; }
      if (!seen[col.group]) {
        seen[col.group] = true;
        groups.push(col.group);
      }
    }
    return groups;
  }

  customFarColumnsForGroup(group: string): {key: string; label: string; group: string}[] {
    var search = (this.customFarColumnSearch || '').toLowerCase();
    var result: {key: string; label: string; group: string}[] = [];
    for (var i = 0; i < this.customFarColumnCatalogue.length; i++) {
      var col = this.customFarColumnCatalogue[i];
      if (col.group !== group) { continue; }
      if (search && col.label.toLowerCase().indexOf(search) < 0 && col.key.toLowerCase().indexOf(search) < 0) { continue; }
      result.push(col);
    }
    return result;
  }

  customFarIsSelected(key: string): boolean {
    return this.customFarSelectedKeys().indexOf(key) >= 0;
  }

  customFarToggleColumn(key: string) {
    var keys = [...this.customFarSelectedKeys()];
    var idx = keys.indexOf(key);
    if (idx >= 0) {
      keys.splice(idx, 1);
    } else {
      keys.push(key);
    }
    this.customFarSelectedKeys.set(keys);
  }

  customFarMoveUp(index: number) {
    if (index <= 0) { return; }
    var keys = [...this.customFarSelectedKeys()];
    var tmp = keys[index - 1];
    keys[index - 1] = keys[index];
    keys[index] = tmp;
    this.customFarSelectedKeys.set(keys);
  }

  customFarMoveDown(index: number) {
    var keys = this.customFarSelectedKeys();
    if (index >= keys.length - 1) { return; }
    var arr = [...keys];
    var tmp = arr[index + 1];
    arr[index + 1] = arr[index];
    arr[index] = tmp;
    this.customFarSelectedKeys.set(arr);
  }

  customFarRemoveColumn(key: string) {
    var keys = this.customFarSelectedKeys().filter(function(k) { return k !== key; });
    this.customFarSelectedKeys.set(keys);
  }

  customFarResetDefaults() {
    this.customFarSelectedKeys.set([...this.customFarDefaultKeys]);
  }

  customFarLabelForKey(key: string): string {
    for (var i = 0; i < this.customFarColumnCatalogue.length; i++) {
      if (this.customFarColumnCatalogue[i].key === key) { return this.customFarColumnCatalogue[i].label; }
    }
    return key;
  }

  customFarSelectAll() {
    var keys: string[] = [];
    for (var i = 0; i < this.customFarColumnCatalogue.length; i++) {
      keys.push(this.customFarColumnCatalogue[i].key);
    }
    this.customFarSelectedKeys.set(keys);
  }

  customFarClearAll() {
    this.customFarSelectedKeys.set([]);
  }

  private htmlEsc(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  printCustomFar() {
    var self = this;
    var rows = self.customFarReportRows();
    var cols = self.customFarActiveColumns();
    if (!rows || rows.length === 0) { return; }
    var subtitle = self.htmlEsc(self.customFarReportSubtitle());
    var headerCells = cols.map(function(k) {
      return '<th style="border:1px solid #cbd5e1;padding:6px 10px;background:#1e293b;color:#fff;white-space:nowrap;font-size:11px">' + self.htmlEsc(self.customFarLabelForKey(k)) + '</th>';
    }).join('');
    var bodyRows = rows.map(function(row) {
      var cells = cols.map(function(k) {
        var v = row[k] != null ? self.htmlEsc(String(row[k])) : '';
        return '<td style="border:1px solid #e2e8f0;padding:4px 10px;font-size:11px;white-space:nowrap">' + v + '</td>';
      }).join('');
      return '<tr>' + cells + '</tr>';
    }).join('');
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Custom FAR Report</title><style>'
      + 'body{font-family:Arial,sans-serif;margin:20px;color:#0f172a}'
      + 'h1{font-size:18px;margin:0 0 4px}'
      + '.subtitle{font-size:12px;color:#64748b;margin-bottom:16px}'
      + 'table{border-collapse:collapse;width:100%;min-width:max-content}'
      + '@media print{@page{margin:10mm;size:landscape}button{display:none}}'
      + '</style></head><body>'
      + '<h1>Custom FAR Report</h1>'
      + '<div class="subtitle">' + subtitle + '</div>'
      + '<table><thead><tr>' + headerCells + '</tr></thead><tbody>' + bodyRows + '</tbody></table>'
      + '<script>window.onload=function(){window.print();}<\/script>'
      + '</body></html>';
    var win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  exportCustomFarExcel() {
    var self = this;
    var rows = self.customFarReportRows();
    var cols = self.customFarActiveColumns();
    if (!rows || rows.length === 0) { return; }
    var finYear = self.customFarFilters.finYear || self.getActiveFinancialYear();
    var header = cols.map(function(k) { return self.customFarLabelForKey(k); });
    var wsData: any[][] = [
      [],
      ['Custom FAR Report'],
      ['Mnquma Local Municipality (EC122)'],
      ['FY ' + finYear],
      ['Generated: ' + new Date().toLocaleDateString('en-ZA')],
      ['Columns: ' + cols.length + ' | Records: ' + rows.length],
      [],
      header
    ];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var rowArr: any[] = [];
      for (var j = 0; j < cols.length; j++) {
        rowArr.push(r[cols[j]] != null ? r[cols[j]] : '');
      }
      wsData.push(rowArr);
    }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    var colWidths: any[] = [];
    for (var ci = 0; ci < cols.length; ci++) { colWidths.push({ wch: 22 }); }
    ws['!cols'] = colWidths;
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Custom FAR');
    XLSX.writeFile(wb, 'custom_far_' + new Date().toISOString().split('T')[0] + '.xlsx');
    self.snackBar.open('Exported ' + rows.length + ' records to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  openComplianceFilters() {
    this.complianceReportData.set([]);
    this.complianceReportSubtitle.set('');
    this.complianceReportGenerated.set(false);
    this.showComplianceFilters.set(true);
    this.showFarFilters.set(false);
    this.showDepFilters.set(false);
    this.showDisposalFilters.set(false);
    this.showRevFilters.set(false);
    this.showImpFilters.set(false);
    this.showImpRevFilters.set(false);
    this.showRefurbFilters.set(false);
    this.showPyaFilters.set(false);
    this.showPpaFilters.set(false);
    this.showAfsFilters.set(false);
    this.showLocFilters.set(false);
    this.showCustomFarFilters.set(false);
  }

  applyComplianceFilters() {
    this.showComplianceFilters.set(false);
    this.complianceGenerating.set(true);
    this.complianceReportData.set([]);
    this.complianceReportSubtitle.set('');
    this.complianceReportGenerated.set(false);
    var self = this;
    var params: any = {};
    if (this.complianceFilters.typeId) { params.typeId = this.complianceFilters.typeId; }
    if (this.complianceFilters.categoryId) { params.categoryId = this.complianceFilters.categoryId; }
    if (this.complianceFilters.departmentId) { params.departmentId = this.complianceFilters.departmentId; }
    this.api.getMeasurementModelComplianceReport(params).subscribe({
      next: function(res: any) {
        var data: any[] = Array.isArray(res) ? res : (res.conflicts || []);
        var orgModel: string = res.orgModel || '';
        self.compliancePage.set(0);
        self.complianceReportData.set(data);
        self.complianceOrgModel.set(orgModel);
        self.complianceReportSubtitle.set('Org Model: ' + (orgModel || 'Not configured') + ' \u2014 ' + data.length + ' conflicting asset(s) found');
        self.complianceGenerating.set(false);
        self.complianceReportGenerated.set(true);
      },
      error: function() {
        self.complianceGenerating.set(false);
        self.snackBar.open('Failed to generate Measurement Model Compliance Report', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  complianceColumns(): string[] {
    return [
      'Asset ID', 'Description', 'Barcode', 'Asset Type', 'Category', 'Sub Category',
      'Asset Class', 'Measurement Type', 'No Depreciation Flag',
      'Asset Status', 'Department', 'Acquisition Date', 'In Service Date',
      'Remaining Useful Life (Months)', 'Conflict Reason'
    ];
  }

  complianceRowValue(row: any, col: string): string {
    var orgModel = this.complianceOrgModel();
    switch (col) {
      case 'Asset ID': return row.assetId != null ? String(row.assetId) : '';
      case 'Description': return row.description || '';
      case 'Barcode': return row.barcode || '';
      case 'Asset Type': return row.assetType || '';
      case 'Category': return row.assetCategory || '';
      case 'Sub Category': return row.assetSubCategory || '';
      case 'Asset Class': return row.assetClass || '';
      case 'Measurement Type': return row.measurementType || '';
      case 'No Depreciation Flag': return row.noDepreciation ? 'Yes (Revaluation)' : 'No (Cost)';
      case 'Asset Status': return row.assetStatus || '';
      case 'Department': return row.department || '';
      case 'Acquisition Date': {
        if (!row.acquisitionDate) return '';
        var d = new Date(row.acquisitionDate);
        return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-ZA');
      }
      case 'In Service Date': {
        if (!row.inServiceDate) return '';
        var d2 = new Date(row.inServiceDate);
        return isNaN(d2.getTime()) ? '' : d2.toLocaleDateString('en-ZA');
      }
      case 'Remaining Useful Life (Months)': return row.remainingUsefulLifeMonths != null ? String(row.remainingUsefulLifeMonths) : '0';
      case 'Conflict Reason': {
        var measName = (row.measurementType || '').toLowerCase();
        if (orgModel === 'Cost' && measName.includes('revaluation')) {
          return 'Revaluation-type measurement assigned under Cost model';
        }
        if (orgModel === 'Revaluation' && measName.includes('cost')) {
          return 'Cost-type measurement assigned under Revaluation model';
        }
        return 'Incompatible with current model';
      }
      default: return '';
    }
  }

  compliancePagedRows() {
    var data = this.complianceReportData();
    var start = this.compliancePage() * this.compliancePageSize;
    return data.slice(start, start + this.compliancePageSize);
  }

  complianceTotalPages() {
    return Math.max(1, Math.ceil(this.complianceReportData().length / this.compliancePageSize));
  }

  exportComplianceExcel() {
    var self = this;
    var data = this.complianceReportData();
    if (!data || data.length === 0) return;
    var cols = this.complianceColumns();
    var wsData: any[][] = [];
    wsData.push([]);
    wsData.push(['Measurement Model Compliance Report']);
    wsData.push(['Org Model: ' + this.complianceOrgModel()]);
    wsData.push(['Generated: ' + new Date().toLocaleDateString('en-ZA')]);
    wsData.push(['Records: ' + data.length]);
    wsData.push([]);
    wsData.push(cols);
    for (var ri = 0; ri < data.length; ri++) {
      var rowArr: any[] = [];
      for (var ci = 0; ci < cols.length; ci++) {
        rowArr.push(self.complianceRowValue(data[ri], cols[ci]));
      }
      wsData.push(rowArr);
    }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    var colWidths: any[] = [];
    for (var wi = 0; wi < cols.length; wi++) { colWidths.push({ wch: 24 }); }
    ws['!cols'] = colWidths;
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Compliance');
    var fileName = 'measurement_model_compliance_' + new Date().toISOString().split('T')[0] + '.xlsx';
    XLSX.writeFile(wb, fileName);
    this.snackBar.open('Exported ' + data.length + ' records to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  generateMscoaPrefixReport() {
    var self = this;
    this.prefixViolGenerating.set(true);
    this.prefixViolGenerated.set(false);
    this.prefixViolData.set([]);
    this.prefixViolPage.set(0);
    this.api.getMscoaPrefixViolations().subscribe({
      next: function(data: any[]) {
        self.prefixViolData.set(data || []);
        self.prefixViolGenerating.set(false);
        self.prefixViolGenerated.set(true);
      },
      error: function() {
        self.prefixViolGenerating.set(false);
        self.snackBar.open('Failed to generate mSCOA Prefix Violations report', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  prefixViolPagedRows() {
    var data = this.prefixViolFilteredData();
    var start = this.prefixViolPage() * this.prefixViolPageSize;
    return data.slice(start, start + this.prefixViolPageSize);
  }

  prefixViolTotalPages() {
    return Math.max(1, Math.ceil(this.prefixViolFilteredData().length / this.prefixViolPageSize));
  }

  openMissingMscoaFilters(): void {
    if (!this.missingMscoaFilters.finYear) {
      this.missingMscoaFilters = { finYear: this.getActiveFinancialYear() || '', transactionTypeId: '' };
    }
    if (this.transactionTypeDefs().length === 0) {
      this.api.getMscoaTransactionTypeDefs().subscribe({
        next: (defs: any[]) => this.transactionTypeDefs.set(defs),
        error: () => {
          this.snackBar.open('Failed to load transaction types. Please refresh and try again.', 'OK', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
        }
      });
    }
    this.showMissingMscoaFilters.set(true);
    this.missingMscoaGenerated.set(false);
  }

  generateMissingMscoa(): void {
    var f = this.missingMscoaFilters;
    if (!f.finYear || !f.transactionTypeId) {
      this.snackBar.open('Please select a Financial Year and Transaction Type.', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    this.showMissingMscoaFilters.set(false);
    this.missingMscoaGenerating.set(true);
    this.missingMscoaGenerated.set(false);
    this.api.getMissingMscoaSettings(f.finYear, f.transactionTypeId).subscribe({
      next: (res: any) => {
        this.missingMscoaData.set(res.rows || []);
        this.missingMscoaIncompleteData.set(res.incompleteRows || []);
        this.missingMscoaUseDeptDiv.set(!!res.useDeptDivision);
        this.missingMscoaPage.set(0);
        this.missingMscoaIncompletePage.set(0);
        this.missingMscoaGenerating.set(false);
        this.missingMscoaGenerated.set(true);
      },
      error: () => {
        this.missingMscoaGenerating.set(false);
        this.snackBar.open('Failed to generate the Missing mSCOA Settings report. Please try again.', 'OK', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  missingMscoaPagedRows(): any[] {
    var start = this.missingMscoaPage() * this.missingMscoaPageSize;
    return this.missingMscoaData().slice(start, start + this.missingMscoaPageSize);
  }

  missingMscoaTotalPages(): number {
    return Math.max(1, Math.ceil(this.missingMscoaData().length / this.missingMscoaPageSize));
  }

  missingMscoaIncompletePagedRows(): any[] {
    var start = this.missingMscoaIncompletePage() * this.missingMscoaIncompletePageSize;
    return this.missingMscoaIncompleteData().slice(start, start + this.missingMscoaIncompletePageSize);
  }

  missingMscoaIncompleteTotalPages(): number {
    return Math.max(1, Math.ceil(this.missingMscoaIncompleteData().length / this.missingMscoaIncompletePageSize));
  }

  exportMissingMscoaExcel(): void {
    var data = this.missingMscoaData();
    var incData = this.missingMscoaIncompleteData();
    if ((!data || data.length === 0) && (!incData || incData.length === 0)) return;
    var useDd = this.missingMscoaUseDeptDiv();
    var wsData: any[][] = [];
    wsData.push([]);
    wsData.push(['Missing / Incomplete mSCOA Settings Report']);
    wsData.push(['Generated: ' + new Date().toLocaleDateString('en-ZA')]);
    wsData.push(['Fin Year: ' + this.missingMscoaFilters.finYear + '  |  Transaction Type ID: ' + this.missingMscoaFilters.transactionTypeId]);
    wsData.push(['Missing (no mapping): ' + data.length + '   Incomplete (broken vote legs): ' + incData.length]);
    wsData.push([]);
    if (data.length > 0) {
      wsData.push(['--- Missing GL Mappings (no configuration record exists) ---']);
      var missCols = ['Asset Type', 'Category', 'Sub Category', 'Measurement Type'];
      if (useDd) { missCols.push('Department'); missCols.push('Division'); }
      missCols.push('Asset Count');
      wsData.push(missCols);
      for (var ri = 0; ri < data.length; ri++) {
        var row = data[ri];
        var r: any[] = [row.assetTypeName || '', row.categoryName || '', row.subCategoryName || '', row.measurementTypeName || ''];
        if (useDd) { r.push(row.departmentName || ''); r.push(row.divisionName || ''); }
        r.push(row.assetCount || 0);
        wsData.push(r);
      }
      wsData.push([]);
    }
    if (incData.length > 0) {
      wsData.push(['--- Incomplete GL Mappings (configuration exists but vote legs unresolvable) ---']);
      var incCols = ['Asset Type', 'Category', 'Sub Category', 'Measurement Type', 'Status'];
      if (useDd) { incCols.push('Department'); incCols.push('Division'); }
      incCols.push('Asset Count'); incCols.push('Incomplete Reason');
      wsData.push(incCols);
      for (var ii = 0; ii < incData.length; ii++) {
        var irow = incData[ii];
        var ir: any[] = [irow.assetTypeName || '', irow.categoryName || '', irow.subCategoryName || '', irow.measurementTypeName || '', irow.statusName || ''];
        if (useDd) { ir.push(irow.departmentName || ''); ir.push(irow.divisionName || ''); }
        ir.push(irow.assetCount || 0);
        ir.push(irow.incompleteReason || '');
        wsData.push(ir);
      }
    }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = Array(12).fill({ wch: 26 });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'mSCOA Diagnostics');
    XLSX.writeFile(wb, 'mscoa_missing_settings_' + new Date().toISOString().split('T')[0] + '.xlsx');
    this.snackBar.open('Exported to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  exportMissingOnlyExcel(): void {
    var data = this.missingMscoaData();
    if (!data || data.length === 0) return;
    var useDd = this.missingMscoaUseDeptDiv();
    var wsData: any[][] = [];
    wsData.push([]);
    wsData.push(['Missing GL Mappings Report']);
    wsData.push(['Generated: ' + new Date().toLocaleDateString('en-ZA')]);
    wsData.push(['Fin Year: ' + this.missingMscoaFilters.finYear + '  |  Transaction Type ID: ' + this.missingMscoaFilters.transactionTypeId]);
    wsData.push(['Missing rows (no configuration record exists): ' + data.length]);
    wsData.push([]);
    var cols = ['Asset Type', 'Category', 'Sub Category', 'Measurement Type'];
    if (useDd) { cols.push('Department'); cols.push('Division'); }
    cols.push('Asset Count');
    wsData.push(cols);
    for (var ri = 0; ri < data.length; ri++) {
      var row = data[ri];
      var r: any[] = [row.assetTypeName || '', row.categoryName || '', row.subCategoryName || '', row.measurementTypeName || ''];
      if (useDd) { r.push(row.departmentName || ''); r.push(row.divisionName || ''); }
      r.push(row.assetCount || 0);
      wsData.push(r);
    }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = Array(10).fill({ wch: 26 });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Missing GL Mappings');
    XLSX.writeFile(wb, 'missing_gl_mappings_' + new Date().toISOString().split('T')[0] + '.xlsx');
    this.snackBar.open('Missing GL Mappings exported to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  exportIncompleteGlMappingsExcel(): void {
    var incData = this.missingMscoaIncompleteData();
    if (!incData || incData.length === 0) return;
    var useDd = this.missingMscoaUseDeptDiv();
    var wsData: any[][] = [];
    wsData.push([]);
    wsData.push(['Incomplete GL Mappings Report']);
    wsData.push(['Generated: ' + new Date().toLocaleDateString('en-ZA')]);
    wsData.push(['Fin Year: ' + this.missingMscoaFilters.finYear + '  |  Transaction Type ID: ' + this.missingMscoaFilters.transactionTypeId]);
    wsData.push(['Incomplete rows (configuration exists but vote legs unresolvable): ' + incData.length]);
    wsData.push([]);
    var incCols = ['Asset Type', 'Category', 'Sub Category', 'Measurement Type', 'Status'];
    if (useDd) { incCols.push('Department'); incCols.push('Division'); }
    incCols.push('Asset Count');
    incCols.push('Incomplete Reason');
    wsData.push(incCols);
    for (var ii = 0; ii < incData.length; ii++) {
      var irow = incData[ii];
      var ir: any[] = [irow.assetTypeName || '', irow.categoryName || '', irow.subCategoryName || '', irow.measurementTypeName || '', irow.statusName || ''];
      if (useDd) { ir.push(irow.departmentName || ''); ir.push(irow.divisionName || ''); }
      ir.push(irow.assetCount || 0);
      ir.push(irow.incompleteReason || '');
      wsData.push(ir);
    }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = Array(12).fill({ wch: 28 });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Incomplete GL Mappings');
    XLSX.writeFile(wb, 'incomplete_gl_mappings_' + new Date().toISOString().split('T')[0] + '.xlsx');
    this.snackBar.open('Incomplete GL Mappings exported to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  exportAllGlIssuesExcel(): void {
    var data = this.missingMscoaData();
    var incData = this.missingMscoaIncompleteData();
    if ((!data || data.length === 0) && (!incData || incData.length === 0)) return;
    var useDd = this.missingMscoaUseDeptDiv();
    var wb = XLSX.utils.book_new();

    var missData: any[][] = [];
    missData.push([]);
    missData.push(['Missing GL Mappings Report']);
    missData.push(['Generated: ' + new Date().toLocaleDateString('en-ZA')]);
    missData.push(['Fin Year: ' + this.missingMscoaFilters.finYear + '  |  Transaction Type ID: ' + this.missingMscoaFilters.transactionTypeId]);
    missData.push(['Missing rows (no configuration record exists): ' + (data ? data.length : 0)]);
    missData.push([]);
    var missCols = ['Asset Type', 'Category', 'Sub Category', 'Measurement Type'];
    if (useDd) { missCols.push('Department'); missCols.push('Division'); }
    missCols.push('Asset Count');
    missData.push(missCols);
    if (data && data.length > 0) {
      for (var ri = 0; ri < data.length; ri++) {
        var row = data[ri];
        var r: any[] = [row.assetTypeName || '', row.categoryName || '', row.subCategoryName || '', row.measurementTypeName || ''];
        if (useDd) { r.push(row.departmentName || ''); r.push(row.divisionName || ''); }
        r.push(row.assetCount || 0);
        missData.push(r);
      }
    }
    var wsMiss = XLSX.utils.aoa_to_sheet(missData);
    wsMiss['!cols'] = Array(10).fill({ wch: 26 });
    XLSX.utils.book_append_sheet(wb, wsMiss, 'Missing GL Mappings');

    var incWsData: any[][] = [];
    incWsData.push([]);
    incWsData.push(['Incomplete GL Mappings Report']);
    incWsData.push(['Generated: ' + new Date().toLocaleDateString('en-ZA')]);
    incWsData.push(['Fin Year: ' + this.missingMscoaFilters.finYear + '  |  Transaction Type ID: ' + this.missingMscoaFilters.transactionTypeId]);
    incWsData.push(['Incomplete rows (configuration exists but vote legs unresolvable): ' + (incData ? incData.length : 0)]);
    incWsData.push([]);
    var incCols = ['Asset Type', 'Category', 'Sub Category', 'Measurement Type', 'Status'];
    if (useDd) { incCols.push('Department'); incCols.push('Division'); }
    incCols.push('Asset Count');
    incCols.push('Incomplete Reason');
    incWsData.push(incCols);
    if (incData && incData.length > 0) {
      for (var ii = 0; ii < incData.length; ii++) {
        var irow = incData[ii];
        var ir: any[] = [irow.assetTypeName || '', irow.categoryName || '', irow.subCategoryName || '', irow.measurementTypeName || '', irow.statusName || ''];
        if (useDd) { ir.push(irow.departmentName || ''); ir.push(irow.divisionName || ''); }
        ir.push(irow.assetCount || 0);
        ir.push(irow.incompleteReason || '');
        incWsData.push(ir);
      }
    }
    var wsInc = XLSX.utils.aoa_to_sheet(incWsData);
    wsInc['!cols'] = Array(12).fill({ wch: 28 });
    XLSX.utils.book_append_sheet(wb, wsInc, 'Incomplete GL Mappings');

    XLSX.writeFile(wb, 'gl_mapping_issues_' + new Date().toISOString().split('T')[0] + '.xlsx');
    this.snackBar.open('All GL Issues exported to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  printMissingMscoaReport(): void {
    var self = this;
    var data = this.missingMscoaData();
    var incData = this.missingMscoaIncompleteData();
    if ((!data || data.length === 0) && (!incData || incData.length === 0)) return;
    var useDd = this.missingMscoaUseDeptDiv();
    var buildTable = function(rows: any[], colDefs: {label: string; key: string}[]) {
      var hdr = colDefs.map(function(c) {
        return '<th style="border:1px solid #cbd5e1;padding:6px 8px;background:#1e293b;color:#fff;white-space:nowrap;font-size:11px">' + self.htmlEsc(c.label) + '</th>';
      }).join('');
      var body = rows.map(function(row: any) {
        return '<tr>' + colDefs.map(function(c) {
          return '<td style="border:1px solid #e2e8f0;padding:4px 8px;font-size:11px;white-space:nowrap">' + self.htmlEsc(row[c.key] != null ? String(row[c.key]) : '') + '</td>';
        }).join('') + '</tr>';
      }).join('');
      return '<table style="border-collapse:collapse;width:100%;min-width:max-content;margin-bottom:24px"><thead><tr>' + hdr + '</tr></thead><tbody>' + body + '</tbody></table>';
    };
    var missCols: {label: string; key: string}[] = [
      {label: 'Asset Type', key: 'assetTypeName'}, {label: 'Category', key: 'categoryName'},
      {label: 'Sub Category', key: 'subCategoryName'}, {label: 'Measurement Type', key: 'measurementTypeName'}
    ];
    if (useDd) { missCols.push({label: 'Department', key: 'departmentName'}); missCols.push({label: 'Division', key: 'divisionName'}); }
    missCols.push({label: 'Asset Count', key: 'assetCount'});
    var incCols: {label: string; key: string}[] = [
      {label: 'Asset Type', key: 'assetTypeName'}, {label: 'Category', key: 'categoryName'},
      {label: 'Sub Category', key: 'subCategoryName'}, {label: 'Measurement Type', key: 'measurementTypeName'},
      {label: 'Status', key: 'statusName'}
    ];
    if (useDd) { incCols.push({label: 'Department', key: 'departmentName'}); incCols.push({label: 'Division', key: 'divisionName'}); }
    incCols.push({label: 'Asset Count', key: 'assetCount'}); incCols.push({label: 'Incomplete Reason', key: 'incompleteReason'});
    var body = '';
    if (data.length > 0) {
      body += '<h2 style="font-size:14px;margin:16px 0 6px;color:#c2410c">Missing GL Mappings (' + data.length + ') — No configuration record exists</h2>';
      body += buildTable(data, missCols);
    }
    if (incData.length > 0) {
      body += '<h2 style="font-size:14px;margin:16px 0 6px;color:#b45309">Incomplete GL Mappings (' + incData.length + ') — Configuration exists but vote legs unresolvable</h2>';
      body += buildTable(incData, incCols);
    }
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>mSCOA GL Diagnostics</title><style>'
      + 'body{font-family:Arial,sans-serif;margin:20px;color:#0f172a}'
      + 'h1{font-size:18px;margin:0 0 4px}'
      + '.subtitle{font-size:12px;color:#64748b;margin-bottom:16px}'
      + '@media print{@page{margin:10mm;size:landscape}button{display:none}}'
      + '</style></head><body>'
      + '<h1>mSCOA GL Diagnostics Report</h1>'
      + '<div class="subtitle">Fin Year: ' + self.htmlEsc(self.missingMscoaFilters.finYear)
      + ' &mdash; Generated: ' + new Date().toLocaleDateString('en-ZA')
      + ' &mdash; Missing: ' + data.length + ' &mdash; Incomplete: ' + incData.length + '</div>'
      + body
      + '<script>window.onload=function(){window.print();}<\/script>'
      + '</body></html>';
    var win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  }

  printMissingOnlyReport(): void {
    var self = this;
    var data = this.missingMscoaData();
    if (!data || data.length === 0) return;
    var useDd = this.missingMscoaUseDeptDiv();
    var missCols: {label: string; key: string}[] = [
      {label: 'Asset Type', key: 'assetTypeName'}, {label: 'Category', key: 'categoryName'},
      {label: 'Sub Category', key: 'subCategoryName'}, {label: 'Measurement Type', key: 'measurementTypeName'}
    ];
    if (useDd) { missCols.push({label: 'Department', key: 'departmentName'}); missCols.push({label: 'Division', key: 'divisionName'}); }
    missCols.push({label: 'Asset Count', key: 'assetCount'});
    var hdr = missCols.map(function(c) {
      return '<th style="border:1px solid #fed7aa;padding:6px 8px;background:#c2410c;color:#fff;white-space:nowrap;font-size:11px">' + self.htmlEsc(c.label) + '</th>';
    }).join('');
    var body = data.map(function(row: any) {
      return '<tr>' + missCols.map(function(c) {
        return '<td style="border:1px solid #fed7aa;padding:4px 8px;font-size:11px;white-space:nowrap">' + self.htmlEsc(row[c.key] != null ? String(row[c.key]) : '') + '</td>';
      }).join('') + '</tr>';
    }).join('');
    var table = '<table style="border-collapse:collapse;width:100%;min-width:max-content;margin-bottom:24px"><thead><tr>' + hdr + '</tr></thead><tbody>' + body + '</tbody></table>';
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Missing GL Mappings</title><style>'
      + 'body{font-family:Arial,sans-serif;margin:20px;color:#0f172a}'
      + 'h1{font-size:18px;margin:0 0 4px;color:#c2410c}'
      + '.subtitle{font-size:12px;color:#64748b;margin-bottom:16px}'
      + '@media print{@page{margin:10mm;size:landscape}button{display:none}}'
      + '</style></head><body>'
      + '<h1>Missing GL Mappings Report</h1>'
      + '<div class="subtitle">Fin Year: ' + self.htmlEsc(self.missingMscoaFilters.finYear)
      + ' &mdash; Generated: ' + new Date().toLocaleDateString('en-ZA')
      + ' &mdash; Missing: ' + data.length + '</div>'
      + '<h2 style="font-size:14px;margin:16px 0 6px;color:#c2410c">Missing GL Mappings (' + data.length + ') — No configuration record exists</h2>'
      + table
      + '<script>window.onload=function(){window.print();}<\/script>'
      + '</body></html>';
    var win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  }

  printIncompleteGlMappingsReport(): void {
    var self = this;
    var incData = this.missingMscoaIncompleteData();
    if (!incData || incData.length === 0) return;
    var useDd = this.missingMscoaUseDeptDiv();
    var incCols: {label: string; key: string}[] = [
      {label: 'Asset Type', key: 'assetTypeName'}, {label: 'Category', key: 'categoryName'},
      {label: 'Sub Category', key: 'subCategoryName'}, {label: 'Measurement Type', key: 'measurementTypeName'},
      {label: 'Status', key: 'statusName'}
    ];
    if (useDd) { incCols.push({label: 'Department', key: 'departmentName'}); incCols.push({label: 'Division', key: 'divisionName'}); }
    incCols.push({label: 'Asset Count', key: 'assetCount'}); incCols.push({label: 'Incomplete Reason', key: 'incompleteReason'});
    var hdr = incCols.map(function(c) {
      return '<th style="border:1px solid #cbd5e1;padding:6px 8px;background:#1e293b;color:#fff;white-space:nowrap;font-size:11px">' + self.htmlEsc(c.label) + '</th>';
    }).join('');
    var body = incData.map(function(row: any) {
      return '<tr>' + incCols.map(function(c) {
        return '<td style="border:1px solid #e2e8f0;padding:4px 8px;font-size:11px;white-space:nowrap">' + self.htmlEsc(row[c.key] != null ? String(row[c.key]) : '') + '</td>';
      }).join('') + '</tr>';
    }).join('');
    var table = '<table style="border-collapse:collapse;width:100%;min-width:max-content;margin-bottom:24px"><thead><tr>' + hdr + '</tr></thead><tbody>' + body + '</tbody></table>';
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Incomplete GL Mappings</title><style>'
      + 'body{font-family:Arial,sans-serif;margin:20px;color:#0f172a}'
      + 'h1{font-size:18px;margin:0 0 4px}'
      + '.subtitle{font-size:12px;color:#64748b;margin-bottom:16px}'
      + '@media print{@page{margin:10mm;size:landscape}button{display:none}}'
      + '</style></head><body>'
      + '<h1>Incomplete GL Mappings Report</h1>'
      + '<div class="subtitle">Fin Year: ' + self.htmlEsc(self.missingMscoaFilters.finYear)
      + ' &mdash; Generated: ' + new Date().toLocaleDateString('en-ZA')
      + ' &mdash; Incomplete: ' + incData.length + '</div>'
      + '<h2 style="font-size:14px;margin:16px 0 6px;color:#b45309">Incomplete GL Mappings (' + incData.length + ') — Configuration exists but vote legs unresolvable</h2>'
      + table
      + '<script>window.onload=function(){window.print();}<\/script>'
      + '</body></html>';
    var win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  }

  exportPrefixViolExcel() {
    var data = this.prefixViolFilteredData();
    if (!data || data.length === 0) return;
    var cols = ['Fin Year', 'Transaction Type', 'Asset Type', 'Category', 'Sub Category', 'Department', 'Division', 'Vote Key', 'Field Label', 'Actual SCOA Code', 'Required Prefix'];
    var wsData: any[][] = [];
    wsData.push([]);
    wsData.push(['mSCOA SCOA Account-Code Prefix Violations']);
    wsData.push(['Generated: ' + new Date().toLocaleDateString('en-ZA')]);
    wsData.push(['Violations: ' + data.length]);
    wsData.push([]);
    wsData.push(cols);
    for (var ri = 0; ri < data.length; ri++) {
      var row = data[ri];
      wsData.push([
        row.finYear || '', row.transactionTypeName || '', row.assetTypeName || '',
        row.categoryName || '', row.subCategoryName || '', row.departmentName || '', row.divisionName || '',
        row.voteKey || '', row.fieldLabel || '', row.actualScoaCode || '', row.requiredPrefix || ''
      ]);
    }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = cols.map(function() { return { wch: 22 }; });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prefix Violations');
    XLSX.writeFile(wb, 'mscoa_prefix_violations_' + new Date().toISOString().split('T')[0] + '.xlsx');
    this.snackBar.open('Exported ' + data.length + ' violation(s) to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  printPrefixViolReport() {
    var self = this;
    var data = this.prefixViolFilteredData();
    if (!data || data.length === 0) return;
    var cols = ['Fin Year', 'Transaction Type', 'Asset Type', 'Category', 'Sub Category', 'Department', 'Division', 'Vote Key', 'Field Label', 'Actual SCOA Code', 'Required Prefix'];
    var fieldKeys = ['finYear', 'transactionTypeName', 'assetTypeName', 'categoryName', 'subCategoryName', 'departmentName', 'divisionName', 'voteKey', 'fieldLabel', 'actualScoaCode', 'requiredPrefix'];
    var headerCells = cols.map(function(c) {
      return '<th style="border:1px solid #cbd5e1;padding:6px 8px;background:#1e293b;color:#fff;white-space:nowrap;font-size:11px">' + self.htmlEsc(c) + '</th>';
    }).join('');
    var bodyRows = data.map(function(row: any) {
      var cells = fieldKeys.map(function(k) {
        return '<td style="border:1px solid #e2e8f0;padding:4px 8px;font-size:11px;white-space:nowrap">' + self.htmlEsc(row[k] != null ? String(row[k]) : '') + '</td>';
      }).join('');
      return '<tr>' + cells + '</tr>';
    }).join('');
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>mSCOA Prefix Errors</title><style>'
      + 'body{font-family:Arial,sans-serif;margin:20px;color:#0f172a}'
      + 'h1{font-size:18px;margin:0 0 4px}'
      + '.subtitle{font-size:12px;color:#64748b;margin-bottom:16px}'
      + 'table{border-collapse:collapse;width:100%;min-width:max-content}'
      + '@media print{@page{margin:10mm;size:landscape}button{display:none}}'
      + '</style></head><body>'
      + '<h1>mSCOA Prefix Errors</h1>'
      + '<div class="subtitle">Generated: ' + new Date().toLocaleDateString('en-ZA') + ' &mdash; ' + data.length + ' violation(s)</div>'
      + '<table><thead><tr>' + headerCells + '</tr></thead><tbody>' + bodyRows + '</tbody></table>'
      + '<script>window.onload=function(){window.print();}<\/script>'
      + '</body></html>';
    var win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  incompleteReasonBadgeStyle(reason: string): string {
    let bg = '#f1f5f9'; let color = '#475569'; let border = '#cbd5e1';
    if (reason && reason.indexOf('vote not loaded') !== -1) { bg = '#fffbeb'; color = '#b45309'; border = '#fde68a'; }
    else if (reason && reason.indexOf('not found') !== -1) { bg = '#fee2e2'; color = '#dc2626'; border = '#fca5a5'; }
    return 'display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap;background:' + bg + ';color:' + color + ';border:1px solid ' + border;
  }

  // ─── Asset GL Transactions Report ─────────────────────────────────────────

  openAssetGlFilters(): void {
    this.assetGlReportData.set([]); this.assetGlReportSubtitle.set(''); this.assetGlReportGenerated.set(false);
    this.assetGlFilters = { finYear: '', processingMonth: '', transactionTypeId: '' };
    this.assetGlFinYears.set([]); this.assetGlProcessingMonths.set([]); this.assetGlTransactionTypes.set([]);
    this.showAssetGlFilters.set(true);
    this.showFarFilters.set(false); this.showDepFilters.set(false); this.showDisposalFilters.set(false);
    this.showRevFilters.set(false); this.showImpFilters.set(false); this.showImpRevFilters.set(false);
    this.showRefurbFilters.set(false); this.showPyaFilters.set(false); this.showPpaFilters.set(false);
    this.showAfsFilters.set(false); this.showComplianceFilters.set(false); this.showMissingMscoaFilters.set(false);
    this.loadAssetGlFilterOptions();
  }

  loadAssetGlFilterOptions(): void {
    var self = this;
    var params: any = {};
    if (this.assetGlFilters.finYear) params['finYear'] = this.assetGlFilters.finYear;
    if (this.assetGlFilters.processingMonth) params['processingMonth'] = this.assetGlFilters.processingMonth;
    this.api.getAssetGlFilterOptions(params).subscribe({
      next: function(res: any) {
        self.assetGlFinYears.set(res.finYears || []);
        self.assetGlProcessingMonths.set(res.processingMonths || []);
        self.assetGlTransactionTypes.set(res.transactionTypes || []);
      },
      error: function() {}
    });
  }

  onAssetGlFinYearChange(): void {
    this.assetGlFilters.processingMonth = '';
    this.assetGlFilters.transactionTypeId = '';
    this.assetGlProcessingMonths.set([]);
    this.assetGlTransactionTypes.set([]);
    this.loadAssetGlFilterOptions();
  }

  onAssetGlProcessingMonthChange(): void {
    this.assetGlFilters.transactionTypeId = '';
    this.assetGlTransactionTypes.set([]);
    this.loadAssetGlFilterOptions();
  }

  assetGlMonthLabel(month: number): string {
    var labels: { [k: number]: string } = {
      1: 'P1 — July', 2: 'P2 — August', 3: 'P3 — September', 4: 'P4 — October',
      5: 'P5 — November', 6: 'P6 — December', 7: 'P7 — January', 8: 'P8 — February',
      9: 'P9 — March', 10: 'P10 — April', 11: 'P11 — May', 12: 'P12 — June'
    };
    return labels[month] || ('P' + month);
  }

  applyAssetGlFilters(): void {
    this.showAssetGlFilters.set(false);
    this.assetGlGenerating.set(true);
    this.assetGlReportData.set([]); this.assetGlReportSubtitle.set(''); this.assetGlReportGenerated.set(false);
    var self = this;
    var finYear = this.assetGlFilters.finYear || this.getActiveFinancialYear();
    var params: any = { finYear: finYear };
    if (this.assetGlFilters.processingMonth) { params['processingMonth'] = this.assetGlFilters.processingMonth; }
    if (this.assetGlFilters.transactionTypeId) { params['transactionTypeId'] = this.assetGlFilters.transactionTypeId; }
    this.api.getAssetGlReport(params).subscribe({
      next: function(res: any) {
        var data: any[] = Array.isArray(res) ? res : (res.data || []);
        self.assetGlReportData.set(data);
        var subtitle = 'Asset GL Transactions — FY ' + finYear;
        if (self.assetGlFilters.processingMonth) { subtitle += ' | P' + self.assetGlFilters.processingMonth; }
        if (self.assetGlFilters.transactionTypeId) {
          var tt = self.assetGlTransactionTypes().find(function(t: any) { return String(t.documentTypeId) === String(self.assetGlFilters.transactionTypeId); });
          subtitle += ' | ' + (tt ? tt.documentTypeDesc : 'Type ' + self.assetGlFilters.transactionTypeId);
        }
        subtitle += ' — ' + data.length + ' records';
        self.assetGlReportSubtitle.set(subtitle);
        self.assetGlGenerating.set(false); self.assetGlReportGenerated.set(true);
      },
      error: function() {
        self.assetGlGenerating.set(false);
        self.snackBar.open('Failed to generate Asset GL report', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  assetGlColumns(): string[] {
    return [
      'GL ID', 'Document No', 'Financial Year', 'Period', 'Posting Date',
      'Transaction Type', 'Transaction Details',
      'Debit (R)', 'Credit (R)', 'Total (R)',
      'SCOA Item Code', 'SCOA Item Desc',
      'Fund Code', 'Fund Desc',
      'Function Code', 'Function Desc',
      'Project Code', 'Project Desc',
      'Costing Code', 'Costing Desc',
      'Region Code', 'Region Desc',
      'Municipal Class', 'Municipal Class Desc'
    ];
  }

  assetGlRowValue(row: any, col: string): string {
    var map: Record<string, string> = {
      'GL ID': 'genLedgerId', 'Document No': 'documentNumber', 'Financial Year': 'finYear',
      'Period': 'processingMonth', 'Posting Date': 'postingDate',
      'Transaction Type': 'transactionType', 'Transaction Details': 'transactionDetails',
      'Debit (R)': 'debit', 'Credit (R)': 'credit', 'Total (R)': 'total',
      'SCOA Item Code': 'scoaItemCode', 'SCOA Item Desc': 'scoaItemDesc',
      'Fund Code': 'scoaFundCode', 'Fund Desc': 'scoaFundDesc',
      'Function Code': 'scoaFunctionCode', 'Function Desc': 'scoaFunctionDesc',
      'Project Code': 'scoaProjectCode', 'Project Desc': 'scoaProjectDesc',
      'Costing Code': 'scoaCostingCode', 'Costing Desc': 'scoaCostingDesc',
      'Region Code': 'scoaRegionCode', 'Region Desc': 'scoaRegionDesc',
      'Municipal Class': 'municipalClass', 'Municipal Class Desc': 'municipalClassDesc'
    };
    var key = map[col]; if (!key) { return ''; }
    var val = row[key]; if (val === null || val === undefined) { return ''; }
    if (col === 'Debit (R)' || col === 'Credit (R)' || col === 'Total (R)') { return Number(val).toFixed(2); }
    return String(val);
  }

  isAssetGlAmountCol(col: string): boolean {
    return col === 'Debit (R)' || col === 'Credit (R)' || col === 'Total (R)';
  }

  assetGlTotals(): { debit: string; credit: string; total: string } {
    var data = this.assetGlReportData();
    var debit = 0; var credit = 0;
    for (var i = 0; i < data.length; i++) { debit += Number(data[i]['debit'] || 0); credit += Number(data[i]['credit'] || 0); }
    return { debit: debit.toFixed(2), credit: credit.toFixed(2), total: (debit - credit).toFixed(2) };
  }

  exportAssetGlExcel(): void {
    var data = this.assetGlReportData();
    if (!data || data.length === 0) { return; }
    var cols = this.assetGlColumns();
    var self = this;
    var wsData: any[][] = [
      [],
      ['Asset GL Transactions Report'],
      ['FY ' + (this.assetGlFilters.finYear || this.getActiveFinancialYear())],
      ['Generated: ' + new Date().toLocaleDateString('en-ZA')],
      ['Records: ' + data.length],
      [],
      cols
    ];
    for (var ri = 0; ri < data.length; ri++) {
      var rowArr: any[] = [];
      for (var ci = 0; ci < cols.length; ci++) {
        var v = self.assetGlRowValue(data[ri], cols[ci]);
        rowArr.push(self.isAssetGlAmountCol(cols[ci]) ? parseFloat(v) : v);
      }
      wsData.push(rowArr);
    }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = cols.map(function() { return { wch: 20 }; });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asset GL');
    XLSX.writeFile(wb, 'asset_gl_transactions_' + new Date().toISOString().substring(0, 10) + '.xlsx');
    this.snackBar.open('Exported ' + data.length + ' records to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  exportAssetGlCsv(): void {
    var data = this.assetGlReportData();
    if (!data || data.length === 0) { return; }
    var cols = this.assetGlColumns();
    var self = this;
    var csv = cols.map(function(c: string) { return '"' + c + '"'; }).join(',') + '\n';
    for (var ri = 0; ri < data.length; ri++) {
      var rowParts: string[] = [];
      for (var ci = 0; ci < cols.length; ci++) {
        var v = self.assetGlRowValue(data[ri], cols[ci]);
        rowParts.push('"' + String(v).split('"').join('""') + '"');
      }
      csv += rowParts.join(',') + '\n';
    }
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = window.URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'asset_gl_transactions_' + new Date().toISOString().substring(0, 10) + '.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    this.snackBar.open('Exported ' + data.length + ' records to CSV', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  // ─── mSCOA Settings Report ─────────────────────────────────────────────────

  openMscoaSettingsFilters(): void {
    this.mscoaSettingsFilters = { finYear: this.getActiveFinancialYear(), typeId: '', categoryId: '', subCategoryId: '', departmentId: '', divisionId: '' };
    this.mscoaSettingsFilterCategories.set([]); this.mscoaSettingsFilterSubCategories.set([]); this.mscoaSettingsFilterDivisions.set([]);
    this.showMscoaSettingsFilters.set(true);
    this.showFarFilters.set(false); this.showDepFilters.set(false); this.showDisposalFilters.set(false);
    this.showRevFilters.set(false); this.showImpFilters.set(false); this.showImpRevFilters.set(false);
    this.showRefurbFilters.set(false); this.showPyaFilters.set(false); this.showPpaFilters.set(false);
    this.showAfsFilters.set(false); this.showComplianceFilters.set(false); this.showMissingMscoaFilters.set(false);
    this.showAssetGlFilters.set(false);
    var self = this;
    this.api.getMscoaDepartments().subscribe({
      next: function(data: any[]) { self.mscoaSettingsDepts.set(data || []); },
      error: function() {}
    });
  }

  onMscoaSettingsTypeChange(): void {
    this.mscoaSettingsFilters.categoryId = '';
    this.mscoaSettingsFilters.subCategoryId = '';
    this.mscoaSettingsFilterSubCategories.set([]);
    if (!this.mscoaSettingsFilters.typeId) { this.mscoaSettingsFilterCategories.set([]); return; }
    var self = this;
    this.api.getAssetCategoriesList({ typeId: this.mscoaSettingsFilters.typeId }).subscribe({
      next: function(data: any[]) { self.mscoaSettingsFilterCategories.set(data); },
      error: function() {}
    });
  }

  onMscoaSettingsCategoryChange(): void {
    this.mscoaSettingsFilters.subCategoryId = '';
    if (!this.mscoaSettingsFilters.categoryId) { this.mscoaSettingsFilterSubCategories.set([]); return; }
    var self = this;
    this.api.getAssetSubCategoriesList({ typeId: this.mscoaSettingsFilters.typeId, categoryId: this.mscoaSettingsFilters.categoryId }).subscribe({
      next: function(data: any[]) { self.mscoaSettingsFilterSubCategories.set(data); },
      error: function() {}
    });
  }

  onMscoaSettingsDeptChange(): void {
    this.mscoaSettingsFilters.divisionId = '';
    this.mscoaSettingsFilterDivisions.set([]);
    if (!this.mscoaSettingsFilters.departmentId) { return; }
    var self = this;
    this.api.getMscoaDivisions(parseInt(this.mscoaSettingsFilters.departmentId)).subscribe({
      next: function(data: any[]) { self.mscoaSettingsFilterDivisions.set(data || []); },
      error: function() {}
    });
  }

  applyMscoaSettingsFilters(): void {
    this.showMscoaSettingsFilters.set(false);
    this.mscoaSettingsGenerating.set(true);
    this.mscoaSettingsData.set([]); this.mscoaSettingsSubtitle.set(''); this.mscoaSettingsGenerated.set(false);
    this.mscoaSettingsPage.set(0);
    var self = this;
    var params: any = {};
    var finYear = this.mscoaSettingsFilters.finYear || this.getActiveFinancialYear();
    params['finYear'] = finYear;
    if (this.mscoaSettingsFilters.typeId) params['typeId'] = this.mscoaSettingsFilters.typeId;
    if (this.mscoaSettingsFilters.categoryId) params['categoryId'] = this.mscoaSettingsFilters.categoryId;
    if (this.mscoaSettingsFilters.subCategoryId) params['subCategoryId'] = this.mscoaSettingsFilters.subCategoryId;
    if (this.mscoaSettingsFilters.departmentId) params['departmentId'] = this.mscoaSettingsFilters.departmentId;
    if (this.mscoaSettingsFilters.divisionId) params['divisionId'] = this.mscoaSettingsFilters.divisionId;
    this.api.getMscoaSettingsReport(params).subscribe({
      next: function(res: any) {
        var data: any[] = Array.isArray(res) ? res : [];
        self.mscoaSettingsData.set(data);
        var subtitle = 'mSCOA Settings — FY ' + finYear;
        if (self.mscoaSettingsFilters.typeId) {
          var t = self.assetTypes().find(function(x: any) { return String(x.assetType_ID || x.id) === String(self.mscoaSettingsFilters.typeId); });
          if (t) subtitle += ' | ' + (t.assetTypeDesc || t.name || '');
        }
        subtitle += ' — ' + data.length + ' records';
        self.mscoaSettingsSubtitle.set(subtitle);
        self.mscoaSettingsGenerating.set(false); self.mscoaSettingsGenerated.set(true);
      },
      error: function() {
        self.mscoaSettingsGenerating.set(false);
        self.snackBar.open('Failed to generate mSCOA Settings report', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  mscoaSettingsColumns(): string[] {
    return [
      'mSCOA ID', 'Fin Year', 'Asset Type', 'Category', 'Sub Category',
      'Measurement Type', 'Status', 'Department', 'Division', 'Transaction Type', 'Transaction Description', 'Transaction Subtype',
      'Project Item ID', 'Project Code / Name',
      'SCOA Item Code', 'SCOA Item Desc',
      'Fund Code', 'Fund Desc',
      'Function Code', 'Function Desc',
      'Region Code', 'Region Desc',
      'Costing Code', 'Costing Desc',
      'Project Code', 'Project Desc',
      'Municipal Classification'
    ];
  }

  mscoaSettingsRowValue(row: any, col: string): string {
    var map: Record<string, string> = {
      'mSCOA ID': 'mscoaId', 'Fin Year': 'finYear', 'Asset Type': 'assetType',
      'Category': 'category', 'Sub Category': 'subCategory', 'Measurement Type': 'measurementType',
      'Status': 'status', 'Department': 'departmentDesc', 'Division': 'divisionDesc',
      'Transaction Type': 'transactionType',
      'Transaction Description': 'transactionDescription', 'Transaction Subtype': 'transactionSubtype',
      'Project Item ID': 'projectItemId', 'Project Code / Name': 'projectCodeName',
      'SCOA Item Code': 'scoaItemCode', 'SCOA Item Desc': 'scoaItemDesc',
      'Fund Code': 'scoaFundCode', 'Fund Desc': 'scoaFundDesc',
      'Function Code': 'scoaFunctionCode', 'Function Desc': 'scoaFunctionDesc',
      'Region Code': 'scoaRegionCode', 'Region Desc': 'scoaRegionDesc',
      'Costing Code': 'scoaCostingCode', 'Costing Desc': 'scoaCostingDesc',
      'Project Code': 'scoaProjectCode', 'Project Desc': 'scoaProjectDesc',
      'Municipal Classification': 'municipalClassification'
    };
    var key = map[col]; if (!key) return '';
    var val = row[key]; if (val === null || val === undefined) return '';
    return String(val);
  }

  mscoaSettingsNextPage(): void { if (this.mscoaSettingsPage() < this.mscoaSettingsTotalPages() - 1) { this.mscoaSettingsPage.set(this.mscoaSettingsPage() + 1); } }
  mscoaSettingsPrevPage(): void { if (this.mscoaSettingsPage() > 0) { this.mscoaSettingsPage.set(this.mscoaSettingsPage() - 1); } }
  mscoaSettingsGoToPage(n: number): void { if (n >= 0 && n < this.mscoaSettingsTotalPages()) { this.mscoaSettingsPage.set(n); } }

  exportMscoaSettingsExcel(): void {
    var self = this;
    var params: any = {};
    var finYear = this.mscoaSettingsFilters.finYear || this.getActiveFinancialYear();
    params['finYear'] = finYear;
    if (this.mscoaSettingsFilters.typeId) params['typeId'] = this.mscoaSettingsFilters.typeId;
    if (this.mscoaSettingsFilters.categoryId) params['categoryId'] = this.mscoaSettingsFilters.categoryId;
    if (this.mscoaSettingsFilters.subCategoryId) params['subCategoryId'] = this.mscoaSettingsFilters.subCategoryId;
    if (this.mscoaSettingsFilters.departmentId) params['departmentId'] = this.mscoaSettingsFilters.departmentId;
    if (this.mscoaSettingsFilters.divisionId) params['divisionId'] = this.mscoaSettingsFilters.divisionId;
    this.api.getMscoaSettingsReportExcel(params).subscribe({
      next: function(blob: Blob) {
        var url = window.URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'mscoa_settings_' + new Date().toISOString().substring(0, 10) + '.xlsx');
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        self.snackBar.open('Excel download started', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      },
      error: function() {
        self.snackBar.open('Excel export failed', 'OK', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  // ── Asset Transfer Report ─────────────────────────────────────────────────
  showTransferFilters = signal(false);
  transferGenerating = signal(false);
  transferReportGenerated = signal(false);
  transferReportData = signal<any[]>([]);
  transferReportSubtitle = signal('');
  transferFilters: any = { finYear: '', assetId: '' };

  readonly transferCols = [
    'TransferId', 'AssetRegisterItemId', 'AssetDescription', 'Barcode',
    'TransferDate', 'FinYear',
    'FromAssetTypeDesc', 'ToAssetTypeDesc',
    'FromAssetCategoryDesc', 'ToAssetCategoryDesc',
    'FromAssetSubCategoryDesc', 'ToAssetSubCategoryDesc',
    'FromAssetClassDesc', 'ToAssetClassDesc',
    'FromMeasurementTypeDesc', 'ToMeasurementTypeDesc',
    'FromAssetStatusDesc', 'ToAssetStatusDesc',
    'FromDepartment', 'ToDepartment',
    'FromDivision', 'ToDivision',
    'FromIsInfrastructure', 'ToIsInfrastructure',
    'CostTransferred', 'AccDepTransferred', 'AccImpTransferred',
    'RevalReserveTransferred', 'DepOffsetTransferred', 'CatchUpDepPosted',
    'DocumentNumber', 'Status'
  ];

  readonly transferColLabels: Record<string, string> = {
    TransferId: 'Transfer ID',
    AssetRegisterItemId: 'Asset ID',
    AssetDescription: 'Asset Description',
    Barcode: 'Barcode',
    TransferDate: 'Transfer Date',
    FinYear: 'Financial Year',
    FromAssetTypeDesc: 'From Asset Type',
    ToAssetTypeDesc: 'To Asset Type',
    FromAssetCategoryDesc: 'From Category',
    ToAssetCategoryDesc: 'To Category',
    FromAssetSubCategoryDesc: 'From Sub-Category',
    ToAssetSubCategoryDesc: 'To Sub-Category',
    FromAssetClassDesc: 'From Asset Class',
    ToAssetClassDesc: 'To Asset Class',
    FromMeasurementTypeDesc: 'From Measurement Type',
    ToMeasurementTypeDesc: 'To Measurement Type',
    FromAssetStatusDesc: 'From Status',
    ToAssetStatusDesc: 'To Status',
    FromDepartment: 'From Department',
    ToDepartment: 'To Department',
    FromDivision: 'From Division',
    ToDivision: 'To Division',
    FromIsInfrastructure: 'From Infrastructure?',
    ToIsInfrastructure: 'To Infrastructure?',
    CostTransferred: 'Cost Transferred',
    AccDepTransferred: 'Acc. Dep. Transferred',
    AccImpTransferred: 'Acc. Imp. Transferred',
    RevalReserveTransferred: 'Reval Reserve Transferred',
    DepOffsetTransferred: 'Dep. Offset Transferred',
    CatchUpDepPosted: 'Catch-up Dep. Posted',
    DocumentNumber: 'Document Number',
    Status: 'Status'
  };

  transferColLabel(col: string): string {
    return this.transferColLabels[col] || col;
  }

  readonly transferAmountCols = new Set([
    'CostTransferred', 'AccDepTransferred', 'AccImpTransferred',
    'RevalReserveTransferred', 'DepOffsetTransferred', 'CatchUpDepPosted'
  ]);

  transferRowValue(row: any, col: string): string {
    var val = row[col];
    if (val === null || val === undefined) return '';
    if (this.transferAmountCols.has(col)) {
      var n = Number(val);
      if (isNaN(n)) return String(val);
      return n.toFixed(2);
    }
    if (col === 'TransferDate') {
      try { return new Date(val).toLocaleDateString('en-ZA'); } catch { return String(val); }
    }
    return String(val);
  }

  openTransferFilters() {
    this.transferReportData.set([]);
    this.transferReportSubtitle.set('');
    this.transferReportGenerated.set(false);
    this.showTransferFilters.set(true);
  }

  applyTransferFilters() {
    this.showTransferFilters.set(false);
    this.transferGenerating.set(true);
    this.transferReportData.set([]);
    this.transferReportSubtitle.set('');
    this.transferReportGenerated.set(false);
    var self = this;
    var params: any = {};
    if (this.transferFilters.finYear) { params['finYear'] = this.transferFilters.finYear; }
    if (this.transferFilters.assetId) { params['assetId'] = this.transferFilters.assetId; }
    this.api.getTransferReport(params).subscribe({
      next: function(res: any) {
        var data: any[] = Array.isArray(res) ? res : (res.data || []);
        self.transferReportData.set(data);
        var subtitle = 'Asset Transfer Report';
        if (self.transferFilters.finYear) { subtitle += ' \u2014 FY ' + self.transferFilters.finYear; }
        subtitle += ' \u2014 ' + data.length + ' records';
        self.transferReportSubtitle.set(subtitle);
        self.transferGenerating.set(false);
        self.transferReportGenerated.set(true);
      },
      error: function() {
        self.transferGenerating.set(false);
        self.snackBar.open('Failed to generate Transfer Report', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  exportTransferExcel() {
    var self = this;
    var data = this.transferReportData();
    if (!data || data.length === 0) return;
    var cols = this.transferCols;
    var wsData: any[][] = [];
    wsData.push([]);
    wsData.push(['Asset Transfer Report']);
    if (this.transferFilters.finYear) { wsData.push(['FY ' + this.transferFilters.finYear]); }
    wsData.push(['Generated: ' + new Date().toLocaleDateString('en-ZA')]);
    wsData.push(['Records: ' + data.length]);
    wsData.push([]);
    wsData.push(cols.map(function(c: string) { return self.transferColLabel(c); }));
    for (var ri = 0; ri < data.length; ri++) {
      var rowArr: any[] = [];
      for (var ci = 0; ci < cols.length; ci++) { rowArr.push(self.transferRowValue(data[ri], cols[ci])); }
      wsData.push(rowArr);
    }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = cols.map(function() { return { wch: 22 }; });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transfer Report');
    XLSX.writeFile(wb, 'transfer_report_' + new Date().toISOString().split('T')[0] + '.xlsx');
    self.snackBar.open('Exported ' + data.length + ' records to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  exportTransferCsv() {
    var self = this;
    var data = this.transferReportData();
    if (!data || data.length === 0) return;
    var cols = this.transferCols;
    var lines: string[] = [];
    lines.push(cols.map(function(c: string) { return '"' + self.transferColLabel(c).replace(/"/g, '""') + '"'; }).join(','));
    for (var ri = 0; ri < data.length; ri++) {
      var cells: string[] = [];
      for (var ci = 0; ci < cols.length; ci++) {
        var v = self.transferRowValue(data[ri], cols[ci]);
        if (v === null || v === undefined || v === '') { cells.push(''); }
        else { cells.push('"' + String(v).replace(/"/g, '""') + '"'); }
      }
      lines.push(cells.join(','));
    }
    var csv = lines.join('\r\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'transfer_report_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    self.snackBar.open('Exported ' + data.length + ' records to CSV', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  showRulImpactFilters = signal(false);
  rulImpactGenerating = signal(false);
  rulImpactReportGenerated = signal(false);
  rulImpactReportData = signal<any[]>([]);
  rulImpactReportSubtitle = signal('');
  rulImpactFilters: any = { finYear: '' };

  rulImpactTotals = computed(() => {
    var data = this.rulImpactReportData();
    var totalDepWithout = 0;
    var totalDepWith = 0;
    for (var i = 0; i < data.length; i++) {
      totalDepWithout += Number(data[i]['DepWithoutRulAdj']) || 0;
      totalDepWith += Number(data[i]['DepWithRulAdj']) || 0;
    }
    return {
      count: data.length,
      totalDepWithout: totalDepWithout,
      totalDepWith: totalDepWith,
      variance: totalDepWith - totalDepWithout
    };
  });

  rulImpactFmtAmt(n: number): string {
    var abs = n < 0 ? -n : n;
    var parts = abs.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (n < 0 ? '-' : '') + 'R ' + parts.join('.');
  }

  readonly rulImpactCols = [
    'FinancialYear', 'AssetRegisterItemId', 'AssetTypeDesc', 'AssetCategoryDesc',
    'AssetSubCategoryDesc', 'AssetClassDesc', 'AssetStatusDesc', 'MeasurementTypeDesc',
    'CostClosingBalance', 'AccDepOpeningBalance',
    'DepWithoutRulAdj', 'DepWithRulAdj',
    'DepClosingWithout', 'DepClosingWith',
    'ImpairmentClosingBalance', 'DisposalValue',
    'CurrentValueWithout', 'CurrentValueWith',
    'RulMonthsWithout', 'RulMonthsWith'
  ];

  readonly rulImpactColLabels: Record<string, string> = {
    FinancialYear: 'Financial Year',
    AssetRegisterItemId: 'Asset ID',
    AssetTypeDesc: 'Asset Type',
    AssetCategoryDesc: 'Category',
    AssetSubCategoryDesc: 'Sub-Category',
    AssetClassDesc: 'Asset Class',
    AssetStatusDesc: 'Status',
    MeasurementTypeDesc: 'Measurement Type',
    CostClosingBalance: 'Cost (Closing)',
    AccDepOpeningBalance: 'Acc. Dep. (Opening)',
    DepWithoutRulAdj: 'Dep. Without Adj (Full Year)',
    DepWithRulAdj: 'Dep. With Adj (Full Year)',
    DepClosingWithout: 'Acc. Dep. Closing (Without)',
    DepClosingWith: 'Acc. Dep. Closing (With)',
    ImpairmentClosingBalance: 'Impairment (Closing)',
    DisposalValue: 'Disposal Value',
    CurrentValueWithout: 'Current Value (Without)',
    CurrentValueWith: 'Current Value (With)',
    RulMonthsWithout: 'RUL Months at YE (Without)',
    RulMonthsWith: 'RUL Months at YE (With)'
  };

  rulImpactColLabel(col: string): string {
    return this.rulImpactColLabels[col] || col;
  }

  readonly rulImpactAmountCols = new Set([
    'CostClosingBalance', 'AccDepOpeningBalance',
    'DepWithoutRulAdj', 'DepWithRulAdj',
    'DepClosingWithout', 'DepClosingWith',
    'ImpairmentClosingBalance', 'DisposalValue',
    'CurrentValueWithout', 'CurrentValueWith'
  ]);

  rulImpactRowValue(row: any, col: string): string {
    var val = row[col];
    if (val === null || val === undefined) return '';
    if (this.rulImpactAmountCols.has(col)) {
      var n = Number(val);
      if (isNaN(n)) return String(val);
      return n.toFixed(2);
    }
    return String(val);
  }

  openRulImpactFilters() {
    this.rulImpactReportData.set([]);
    this.rulImpactReportSubtitle.set('');
    this.rulImpactReportGenerated.set(false);
    this.showRulImpactFilters.set(true);
  }

  applyRulImpactFilters() {
    this.showRulImpactFilters.set(false);
    this.rulImpactGenerating.set(true);
    this.rulImpactReportData.set([]);
    this.rulImpactReportSubtitle.set('');
    this.rulImpactReportGenerated.set(false);
    var self = this;
    var params: any = {};
    if (this.rulImpactFilters.finYear) { params['finYear'] = this.rulImpactFilters.finYear; }
    this.api.getRulAdjustmentImpactReport(params).subscribe({
      next: function(res: any) {
        var data: any[] = Array.isArray(res) ? res : (res.data || []);
        self.rulImpactReportData.set(data);
        var subtitle = 'RUL Adjustment Impact Report';
        if (self.rulImpactFilters.finYear) { subtitle += ' \u2014 FY ' + self.rulImpactFilters.finYear; }
        subtitle += ' \u2014 ' + data.length + ' records';
        self.rulImpactReportSubtitle.set(subtitle);
        self.rulImpactGenerating.set(false);
        self.rulImpactReportGenerated.set(true);
      },
      error: function() {
        self.rulImpactGenerating.set(false);
        self.snackBar.open('Failed to generate RUL Adjustment Impact Report', 'OK', { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  exportRulImpactExcel() {
    var self = this;
    var params: any = {};
    if (this.rulImpactFilters.finYear) { params['finYear'] = this.rulImpactFilters.finYear; }
    this.api.getRulAdjustmentImpactExport(params).subscribe({
      next: function(blob: Blob) {
        var url = window.URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'rul_adjustment_impact_' + new Date().toISOString().split('T')[0] + '.xlsx');
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        self.snackBar.open('Excel export downloaded', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      },
      error: function() {
        self.snackBar.open('Excel export failed', 'OK', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }

  exportRulImpactCsv() {
    var self = this;
    var data = this.rulImpactReportData();
    if (!data || data.length === 0) return;
    var cols = this.rulImpactCols;
    var totals = this.rulImpactTotals();
    var lines: string[] = [];
    lines.push(cols.map(function(c: string) { return '"' + self.rulImpactColLabel(c).replace(/"/g, '""') + '"'; }).join(','));
    for (var ri = 0; ri < data.length; ri++) {
      var cells: string[] = [];
      for (var ci = 0; ci < cols.length; ci++) {
        var v = self.rulImpactRowValue(data[ri], cols[ci]);
        if (v === null || v === undefined || v === '') { cells.push(''); }
        else { cells.push('"' + String(v).replace(/"/g, '""') + '"'); }
      }
      lines.push(cells.join(','));
    }
    var totalCells: string[] = [];
    for (var ti = 0; ti < cols.length; ti++) {
      var tc = cols[ti];
      if (tc === 'FinancialYear') { totalCells.push('"TOTALS (' + totals.count + ' assets)"'); }
      else if (tc === 'DepWithoutRulAdj') { totalCells.push('"' + totals.totalDepWithout.toFixed(2) + '"'); }
      else if (tc === 'DepWithRulAdj') { totalCells.push('"' + totals.totalDepWith.toFixed(2) + '"'); }
      else if (tc === 'AssetRegisterItemId') { totalCells.push('"Variance (With-Without): ' + totals.variance.toFixed(2) + '"'); }
      else { totalCells.push(''); }
    }
    lines.push(totalCells.join(','));
    var csv = lines.join('\r\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'rul_adjustment_impact_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    self.snackBar.open('Exported ' + data.length + ' records to CSV', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  exportMscoaSettingsCsv(): void {
    var self = this;
    var params: any = {};
    var finYear = this.mscoaSettingsFilters.finYear || this.getActiveFinancialYear();
    params['finYear'] = finYear;
    if (this.mscoaSettingsFilters.typeId) params['typeId'] = this.mscoaSettingsFilters.typeId;
    if (this.mscoaSettingsFilters.categoryId) params['categoryId'] = this.mscoaSettingsFilters.categoryId;
    if (this.mscoaSettingsFilters.subCategoryId) params['subCategoryId'] = this.mscoaSettingsFilters.subCategoryId;
    if (this.mscoaSettingsFilters.departmentId) params['departmentId'] = this.mscoaSettingsFilters.departmentId;
    if (this.mscoaSettingsFilters.divisionId) params['divisionId'] = this.mscoaSettingsFilters.divisionId;
    this.api.getMscoaSettingsReportCsv(params).subscribe({
      next: function(blob: Blob) {
        var url = window.URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'mscoa_settings_' + new Date().toISOString().substring(0, 10) + '.csv');
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        self.snackBar.open('CSV download started', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      },
      error: function() {
        self.snackBar.open('CSV export failed', 'OK', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
    });
  }
}
