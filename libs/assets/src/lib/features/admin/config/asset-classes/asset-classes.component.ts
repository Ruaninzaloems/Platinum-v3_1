import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../../core/api.service';
import { OrgSettingsService } from '../../../../core/org-settings.service';

@Component({
  selector: 'app-asset-classes',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './asset-classes.component.html',
  styleUrls: ['./asset-classes.component.css']
})
export class AssetClassesComponent implements OnInit {
  items = signal<any[]>([]);
  totalItems = signal(0);
  currentPage = signal(1);
  pageSize = 50;
  assetTypes = signal<any[]>([]);
  statuses = signal<any[]>([]);
  measurementTypes = signal<any[]>([]);
  formMeasurementTypes = signal<any[]>([]);
  depreciationMethods = signal<any[]>([]);
  filterCategories = signal<any[]>([]);
  filterSubCategories = signal<any[]>([]);
  formCategories = signal<any[]>([]);
  formSubCategories = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  searchTerm = signal('');
  filterTypeId = signal<number | null>(null);
  filterCategoryId = signal<number | null>(null);

  ignoreUsefulLife = signal(false);
  statusRequired = signal(false);
  categoryEnabled = signal(false);
  subCatEnabled = signal(false);
  measurementEnabled = signal(false);
  depreciationEnabled = signal(false);
  showRevaluationMethod = signal(false);
  revaluationMethod = signal<'restatement' | 'elimination'>('restatement');
  isDefaultRecord = signal(false);

  formData: any = {
    assetClassDesc: '', typeID: null, assetCategoryID: null,
    asset_SubCategory_ID: null, assetMeasurement_ID: null,
    assetStatus_ID: null, usefulLifeInMonths: null,
    assetDepreciationMethod_ID: null, revaluationMethod: 'restatement'
  };
  showImport = signal(false);
  importFile = signal<File | null>(null);
  importing = signal(false);
  importErrors = signal<any[]>([]);
  importSuccess = signal('');

  constructor(private api: ApiService, private snackBar: MatSnackBar, private orgSettings: OrgSettingsService) {}

  ngOnInit(): void {
    this.api.getAssetTypes().subscribe({ next: (d: any[]) => this.assetTypes.set(d) });
    this.api.getAssetStatuses().subscribe({ next: (d: any[]) => this.statuses.set(d) });
    this.api.getMeasurementTypes().subscribe({ next: (d: any[]) => this.measurementTypes.set(d) });
    this.api.getDepreciationMethods().subscribe({ next: (d: any[]) => this.depreciationMethods.set(d) });
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const params: any = { page: this.currentPage(), pageSize: this.pageSize };
    const s = this.searchTerm();
    if (s) { params.search = s; }
    const ft = this.filterTypeId();
    if (ft) { params.typeId = ft; }
    const fc = this.filterCategoryId();
    if (fc) { params.categoryId = fc; }
    this.api.getAssetClassesList(params).subscribe({
      next: (result: any) => {
        this.items.set(result.data || []);
        this.totalItems.set(result.total || 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
    this.loadData();
  }

  onFilterTypeChange(value: string): void {
    this.filterTypeId.set(value ? Number(value) : null);
    this.filterCategoryId.set(null);
    this.filterSubCategories.set([]);
    if (value) {
      this.api.getAssetCategoriesList({ typeId: Number(value) }).subscribe({
        next: (d: any[]) => this.filterCategories.set(d)
      });
    } else { this.filterCategories.set([]); }
    this.currentPage.set(1);
    this.loadData();
  }

  onFilterCategoryChange(value: string): void {
    this.filterCategoryId.set(value ? Number(value) : null);
    this.currentPage.set(1);
    this.loadData();
  }

  onFormTypeChange(value: any): void {
    const typeId = value ? Number(value) : null;
    this.formData.typeID = typeId;
    this.formData.assetCategoryID = null;
    this.formData.asset_SubCategory_ID = null;
    this.formData.assetStatus_ID = null;
    this.formData.assetMeasurement_ID = null;
    this.formData.assetDepreciationMethod_ID = null;
    this.formCategories.set([]);
    this.formSubCategories.set([]);
    this.formMeasurementTypes.set([]);
    this.statusRequired.set(false);
    this.categoryEnabled.set(false);
    this.subCatEnabled.set(false);
    this.measurementEnabled.set(false);
    this.depreciationEnabled.set(false);
    this.showRevaluationMethod.set(false);
    this.revaluationMethod.set('restatement');

    if (!typeId) {
      this.ignoreUsefulLife.set(false);
      return;
    }

    const selectedType = this.assetTypes().find((t: any) => t.assetTypeId === typeId);
    const noUsefulLife = selectedType?.noUsefulLife === 1 || selectedType?.noUsefulLife === true;
    this.ignoreUsefulLife.set(noUsefulLife);
    if (noUsefulLife) { this.formData.usefulLifeInMonths = null; }

    this.api.getAssetCategoriesList({ typeId }).subscribe({
      next: (cats: any[]) => {
        this.formCategories.set(cats);
        this.categoryEnabled.set(cats.length > 0);
      }
    });

    this.orgSettings.whenLoaded().subscribe((s: any) => {
      this.api.getMeasurementTypes({ typeId, model: s?.measurement_model || undefined }).subscribe({
        next: (types: any[]) => {
          this.formMeasurementTypes.set(types);
          this.measurementEnabled.set(types.length > 0);
        }
      });
    });
  }

  onFormCategoryChange(value: any): void {
    const catId = value ? Number(value) : null;
    this.formData.assetCategoryID = catId;
    this.formData.asset_SubCategory_ID = null;
    this.formData.assetStatus_ID = null;
    this.formSubCategories.set([]);
    this.subCatEnabled.set(false);

    if (!catId) {
      this.statusRequired.set(false);
      return;
    }

    const selectedCat = this.formCategories().find((c: any) => c.assetCategoryId === catId);
    const requireStatus = selectedCat?.requireStatus === 1 || selectedCat?.requireStatus === true;
    this.statusRequired.set(requireStatus);
    if (!requireStatus) { this.formData.assetStatus_ID = null; }

    if (this.formData.typeID) {
      this.api.getAssetSubCategoriesList({ typeId: this.formData.typeID, categoryId: catId }).subscribe({
        next: (subs: any[]) => {
          this.formSubCategories.set(subs);
          this.subCatEnabled.set(subs.length > 0);
        }
      });
    }
  }

  onFormMeasurementChange(value: any): void {
    const measureId = value ? Number(value) : null;
    this.formData.assetMeasurement_ID = measureId;

    if (!measureId) {
      this.depreciationEnabled.set(false);
      this.formData.assetDepreciationMethod_ID = null;
      this.showRevaluationMethod.set(false);
      this.revaluationMethod.set('restatement');
      return;
    }

    const selectedType = this.formMeasurementTypes().find((m: any) => m.measurementTypeId === measureId)
      ?? this.measurementTypes().find((m: any) => m.measurementTypeId === measureId);

    if (selectedType) {
      const noDepreciation = selectedType.noDepreciation === 1 || selectedType.noDepreciation === true;
      this.depreciationEnabled.set(!noDepreciation);
      if (noDepreciation) { this.formData.assetDepreciationMethod_ID = null; }

      const isRevaluation = (selectedType.measurementTypeDesc ?? '').trim() === 'Revaluation Module';
      this.showRevaluationMethod.set(isRevaluation);
      if (!isRevaluation) { this.revaluationMethod.set('restatement'); }
    }
  }

  onRevaluationMethodChange(value: 'restatement' | 'elimination'): void {
    this.revaluationMethod.set(value);
    this.formData.revaluationMethod = value;
  }

  getTotalPages(): number {
    const total = this.totalItems();
    return total > 0 ? Math.ceil(total / this.pageSize) : 1;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.getTotalPages()) return;
    this.currentPage.set(page);
    this.loadData();
  }

  openAdd(): void {
    this.formData = {
      assetClassDesc: '', typeID: null, assetCategoryID: null,
      asset_SubCategory_ID: null, assetMeasurement_ID: null,
      assetStatus_ID: null, usefulLifeInMonths: null,
      assetDepreciationMethod_ID: null, revaluationMethod: 'restatement', enabled: 1
    };
    this.formCategories.set([]);
    this.formSubCategories.set([]);
    this.formMeasurementTypes.set([]);
    this.ignoreUsefulLife.set(false);
    this.statusRequired.set(false);
    this.categoryEnabled.set(false);
    this.subCatEnabled.set(false);
    this.measurementEnabled.set(false);
    this.depreciationEnabled.set(false);
    this.showRevaluationMethod.set(false);
    this.revaluationMethod.set('restatement');
    this.isDefaultRecord.set(false);
    this.editingId.set(null);
    this.showForm.set(true);
  }

  openEdit(item: any): void {
    if (item.default === 1 || item.isDefault === true || item.isDefault === 1) {
      this.isDefaultRecord.set(true);
      this.formData = {
        assetClassDesc: item.assetClassDesc,
        typeID: item.typeID,
        assetCategoryID: item.assetCategoryId ?? item.assetCategoryID,
        asset_SubCategory_ID: item.assetSubCategoryId ?? item.asset_SubCategory_ID,
        assetMeasurement_ID: item.assetMeasurement_ID ?? item.measurementTypeId,
        assetStatus_ID: item.assetStatus_ID,
        usefulLifeInMonths: item.usefulLifeInMonths,
        assetDepreciationMethod_ID: item.assetDepreciationMethodId ?? item.assetDepreciationMethod_ID,
        revaluationMethod: item.revaluationMethod ?? 'restatement',
        enabled: item.enabled ?? 1
      };
      this.editingId.set(item.assetClass_ID);
      this.showForm.set(true);
      this.snackBar.open('Unable to Edit Default Setting.', 'OK', { duration: 5000 });
      return;
    }

    this.isDefaultRecord.set(false);
    this.formData = {
      assetClassDesc: item.assetClassDesc,
      typeID: item.typeID,
      assetCategoryID: item.assetCategoryId ?? item.assetCategoryID,
      asset_SubCategory_ID: item.assetSubCategoryId ?? item.asset_SubCategory_ID,
      assetMeasurement_ID: item.assetMeasurement_ID ?? item.measurementTypeId,
      assetStatus_ID: item.assetStatus_ID,
      usefulLifeInMonths: item.usefulLifeInMonths,
      assetDepreciationMethod_ID: item.assetDepreciationMethodId ?? item.assetDepreciationMethod_ID,
      revaluationMethod: item.revaluationMethod ?? 'restatement',
      enabled: item.enabled ?? 1
    };
    this.revaluationMethod.set(this.formData.revaluationMethod ?? 'restatement');

    this.formCategories.set([]);
    this.formSubCategories.set([]);
    this.formMeasurementTypes.set([]);
    this.statusRequired.set(false);
    this.categoryEnabled.set(false);
    this.subCatEnabled.set(false);
    this.measurementEnabled.set(false);
    this.depreciationEnabled.set(false);
    this.showRevaluationMethod.set(false);
    this.ignoreUsefulLife.set(false);

    if (item.typeID) {
      const selectedType = this.assetTypes().find((t: any) => t.assetTypeId === item.typeID);
      const noUsefulLife = selectedType?.noUsefulLife === 1 || selectedType?.noUsefulLife === true;
      this.ignoreUsefulLife.set(noUsefulLife);
      if (noUsefulLife) { this.formData.usefulLifeInMonths = null; }

      this.api.getAssetCategoriesList({ typeId: item.typeID }).subscribe({
        next: (cats: any[]) => {
          this.formCategories.set(cats);
          this.categoryEnabled.set(cats.length > 0);

          const catId = this.formData.assetCategoryID;
          if (catId) {
            const selectedCat = cats.find((c: any) => c.assetCategoryId === catId);
            const requireStatus = selectedCat?.requireStatus === 1 || selectedCat?.requireStatus === true;
            this.statusRequired.set(requireStatus);
            if (!requireStatus) { this.formData.assetStatus_ID = null; }

            this.api.getAssetSubCategoriesList({ typeId: item.typeID, categoryId: catId }).subscribe({
              next: (subs: any[]) => {
                this.formSubCategories.set(subs);
                this.subCatEnabled.set(subs.length > 0);
              }
            });
          }
        }
      });

      this.orgSettings.whenLoaded().subscribe((s: any) => {
        this.api.getMeasurementTypes({ typeId: item.typeID, model: s?.measurement_model || undefined }).subscribe({
          next: (types: any[]) => {
            this.formMeasurementTypes.set(types);
            this.measurementEnabled.set(types.length > 0);
            const measId = this.formData.assetMeasurement_ID;
            if (measId) {
              const sel = types.find((m: any) => m.measurementTypeId === measId);
              if (sel) {
                const noDepreciation = sel.noDepreciation === 1 || sel.noDepreciation === true;
                this.depreciationEnabled.set(!noDepreciation);
                if (noDepreciation) { this.formData.assetDepreciationMethod_ID = null; }
                const isRevaluation = (sel.measurementTypeDesc ?? '').trim() === 'Revaluation Module';
                this.showRevaluationMethod.set(isRevaluation);
              }
            }
          }
        });
      });
    }

    this.editingId.set(item.assetClass_ID);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.isDefaultRecord.set(false);
  }

  onEnabledChange(event: Event): void {
    this.formData.enabled = (event.target as HTMLInputElement).checked ? 1 : 0;
  }

  save(): void {
    if (this.isDefaultRecord()) { return; }

    if (!this.formData.assetClassDesc || !this.formData.assetClassDesc.trim()) {
      this.snackBar.open('Asset Class is a required field', 'OK', { duration: 4000 }); return;
    }
    if (!this.ignoreUsefulLife() && !this.formData.usefulLifeInMonths) {
      this.snackBar.open('Useful Life is a required field', 'OK', { duration: 4000 }); return;
    }
    if (!this.formData.typeID) {
      this.snackBar.open('Asset Type is a required field', 'OK', { duration: 4000 }); return;
    }
    if (this.categoryEnabled() && !this.formData.assetCategoryID) {
      this.snackBar.open('Asset Category for this Asset Type is a required field', 'OK', { duration: 4000 }); return;
    }
    if (this.subCatEnabled() && !this.formData.asset_SubCategory_ID) {
      this.snackBar.open('Asset Sub Category for this Asset Type is a required field', 'OK', { duration: 4000 }); return;
    }
    if (this.statusRequired() && !this.formData.assetStatus_ID) {
      this.snackBar.open('Asset Status is a required field', 'OK', { duration: 4000 }); return;
    }
    if (this.measurementEnabled() && !this.formData.assetMeasurement_ID) {
      this.snackBar.open('Measurement Type is a required field', 'OK', { duration: 4000 }); return;
    }

    const id = this.editingId();
    const payload: any = {
      assetClassDesc: this.formData.assetClassDesc,
      typeID: this.formData.typeID ? Number(this.formData.typeID) : null,
      assetCategoryID: this.formData.assetCategoryID ? Number(this.formData.assetCategoryID) : null,
      asset_SubCategory_ID: this.formData.asset_SubCategory_ID ? Number(this.formData.asset_SubCategory_ID) : null,
      assetMeasurement_ID: this.formData.assetMeasurement_ID ? Number(this.formData.assetMeasurement_ID) : null,
      assetStatus_ID: this.formData.assetStatus_ID ? Number(this.formData.assetStatus_ID) : null,
      usefulLifeInMonths: this.formData.usefulLifeInMonths ? Number(this.formData.usefulLifeInMonths) : null,
      assetDepreciationMethod_ID: this.formData.assetDepreciationMethod_ID ? Number(this.formData.assetDepreciationMethod_ID) : null,
      revaluationMethod: this.revaluationMethod(),
      enabled: this.formData.enabled
    };

    const obs = id ? this.api.updateAssetClass(id, payload) : this.api.createAssetClass(payload);
    obs.subscribe({
      next: () => {
        this.showForm.set(false);
        this.loadData();
        this.snackBar.open(id ? 'Asset Class Successfully Updated' : 'Asset Class saved successfully', 'OK', { duration: 3000 });
      },
      error: (err: any) => {
        const msg = err.error?.error || '';
        if (err.status === 409) {
          this.snackBar.open('The Asset Class already exists.', 'OK', { duration: 4000 });
        } else if (msg.toLowerCase().includes('system class') || msg.toLowerCase().includes('system classes')) {
          this.snackBar.open('Could not save the Asset Class: System Classes cannot be changed.', 'OK', { duration: 5000 });
        } else {
          this.snackBar.open(msg || 'Failed to save', 'OK', { duration: 4000 });
        }
      }
    });
  }

  confirmDelete(item: any): void {
    if (confirm('Delete "' + item.assetClassDesc + '"?')) {
      this.api.deleteAssetClass(item.assetClass_ID).subscribe({
        next: () => {
          this.loadData();
          this.snackBar.open('Asset Class deleted successfully.', 'OK', { duration: 3000 });
        },
        error: (err: any) => {
          const msg = err.error?.error || '';
          if (msg.toLowerCase().includes('system class') || msg.toLowerCase().includes('system classes')) {
            this.snackBar.open('Could not delete the Asset Class: System Classes cannot be deleted.', 'OK', { duration: 5000 });
          } else {
            this.snackBar.open(msg || 'Delete failed', 'OK', { duration: 4000 });
          }
        }
      });
    }
  }

  openImport(): void { this.showImport.set(true); this.importFile.set(null); this.importErrors.set([]); this.importSuccess.set(''); }
  closeImport(): void { this.showImport.set(false); }
  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) { this.importFile.set(input.files[0]); this.importErrors.set([]); this.importSuccess.set(''); }
  }

  doImport(): void {
    const file = this.importFile();
    if (!file) return;
    this.importing.set(true);
    this.api.importAssetClasses(file).subscribe({
      next: (result: any) => {
        this.importing.set(false);
        const parts = [];
        if (result.inserted > 0) parts.push(result.inserted + ' added');
        if (result.updated > 0) parts.push(result.updated + ' updated');
        if (result.skipped > 0) parts.push(result.skipped + ' skipped (system records)');
        this.importSuccess.set('Imported ' + result.imported + ' records' + (parts.length ? ' (' + parts.join(', ') + ')' : ''));
        this.loadData();
      },
      error: (err: any) => {
        this.importing.set(false);
        if (err.error?.errors) { this.importErrors.set(err.error.errors); }
        else { this.snackBar.open(err.error?.error || 'Import failed', 'OK', { duration: 4000 }); }
      }
    });
  }

  downloadTemplate(): void {
    this.api.downloadAssetClassTemplate().subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'asset_classes_template.xlsx'; a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  exportToExcel(): void {
    this.api.exportAssetClasses().subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'AssetClasses_Export.xlsx'; a.click();
        URL.revokeObjectURL(url);
      },
      error: () => { this.snackBar.open('Export failed', 'OK', { duration: 4000 }); }
    });
  }
}
