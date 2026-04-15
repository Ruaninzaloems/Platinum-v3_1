import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../../core/api.service';

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
  formData: any = {
    assetClassDesc: '', typeID: null, assetCategoryID: null,
    asset_SubCategory_ID: null, assetMeasurement_ID: null,
    assetStatus_ID: null, usefulLifeInMonths: null,
    assetDepreciationMethod_ID: null
  };
  showImport = signal(false);
  importFile = signal<File | null>(null);
  importing = signal(false);
  importErrors = signal<any[]>([]);
  importSuccess = signal('');

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.api.getAssetTypes().subscribe({ next: function(this: AssetClassesComponent, d: any[]) { this.assetTypes.set(d); }.bind(this) });
    this.api.getAssetStatuses().subscribe({ next: function(this: AssetClassesComponent, d: any[]) { this.statuses.set(d); }.bind(this) });
    this.api.getMeasurementTypes().subscribe({ next: function(this: AssetClassesComponent, d: any[]) { this.measurementTypes.set(d); }.bind(this) });
    this.api.getDepreciationMethods().subscribe({ next: function(this: AssetClassesComponent, d: any[]) { this.depreciationMethods.set(d); }.bind(this) });
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
      next: function(this: AssetClassesComponent, result: any) {
        this.items.set(result.data || []);
        this.totalItems.set(result.total || 0);
        this.loading.set(false);
      }.bind(this),
      error: function(this: AssetClassesComponent) { this.loading.set(false); }.bind(this)
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
        next: function(this: AssetClassesComponent, d: any[]) { this.filterCategories.set(d); }.bind(this)
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

  onFormTypeChange(value: string): void {
    this.formData.typeID = value ? Number(value) : null;
    this.formData.assetCategoryID = null;
    this.formData.asset_SubCategory_ID = null;
    this.formSubCategories.set([]);
    if (value) {
      this.api.getAssetCategoriesList({ typeId: Number(value) }).subscribe({
        next: function(this: AssetClassesComponent, d: any[]) { this.formCategories.set(d); }.bind(this)
      });
    } else { this.formCategories.set([]); }
  }

  onFormCategoryChange(value: string): void {
    this.formData.assetCategoryID = value ? Number(value) : null;
    this.formData.asset_SubCategory_ID = null;
    if (value && this.formData.typeID) {
      this.api.getAssetSubCategoriesList({ typeId: this.formData.typeID, categoryId: Number(value) }).subscribe({
        next: function(this: AssetClassesComponent, d: any[]) { this.formSubCategories.set(d); }.bind(this)
      });
    } else { this.formSubCategories.set([]); }
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
    this.formData = { assetClassDesc: '', typeID: null, assetCategoryID: null, asset_SubCategory_ID: null, assetMeasurement_ID: null, assetStatus_ID: null, usefulLifeInMonths: null, assetDepreciationMethod_ID: null };
    this.formCategories.set([]);
    this.formSubCategories.set([]);
    this.editingId.set(null);
    this.showForm.set(true);
  }

  openEdit(item: any): void {
    this.formData = {
      assetClassDesc: item.assetClassDesc,
      typeID: item.typeID,
      assetCategoryID: item.assetCategoryID,
      asset_SubCategory_ID: item.asset_SubCategory_ID,
      assetMeasurement_ID: item.assetMeasurement_ID,
      assetStatus_ID: item.assetStatus_ID,
      usefulLifeInMonths: item.usefulLifeInMonths,
      assetDepreciationMethod_ID: item.assetDepreciationMethod_ID
    };
    if (item.typeID) {
      this.api.getAssetCategoriesList({ typeId: item.typeID }).subscribe({
        next: function(this: AssetClassesComponent, d: any[]) { this.formCategories.set(d); }.bind(this)
      });
    }
    if (item.typeID && item.assetCategoryID) {
      this.api.getAssetSubCategoriesList({ typeId: item.typeID, categoryId: item.assetCategoryID }).subscribe({
        next: function(this: AssetClassesComponent, d: any[]) { this.formSubCategories.set(d); }.bind(this)
      });
    }
    this.editingId.set(item.assetClass_ID);
    this.showForm.set(true);
  }

  cancelForm(): void { this.showForm.set(false); this.editingId.set(null); }

  save(): void {
    const id = this.editingId();
    const payload: any = {
      assetClassDesc: this.formData.assetClassDesc,
      typeID: this.formData.typeID ? Number(this.formData.typeID) : null,
      assetCategoryID: this.formData.assetCategoryID ? Number(this.formData.assetCategoryID) : null,
      asset_SubCategory_ID: this.formData.asset_SubCategory_ID ? Number(this.formData.asset_SubCategory_ID) : null,
      assetMeasurement_ID: this.formData.assetMeasurement_ID ? Number(this.formData.assetMeasurement_ID) : null,
      assetStatus_ID: this.formData.assetStatus_ID ? Number(this.formData.assetStatus_ID) : null,
      usefulLifeInMonths: this.formData.usefulLifeInMonths ? Number(this.formData.usefulLifeInMonths) : null,
      assetDepreciationMethod_ID: this.formData.assetDepreciationMethod_ID ? Number(this.formData.assetDepreciationMethod_ID) : null
    };
    const obs = id ? this.api.updateAssetClass(id, payload) : this.api.createAssetClass(payload);
    obs.subscribe({
      next: function(this: AssetClassesComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open(id ? 'Updated' : 'Created', 'OK', { duration: 3000 }); }.bind(this),
      error: function(this: AssetClassesComponent, err: any) { this.snackBar.open(err.error?.error || 'Failed', 'OK', { duration: 4000 }); }.bind(this)
    });
  }

  confirmDelete(item: any): void {
    if (confirm('Delete "' + item.assetClassDesc + '"?')) {
      this.api.deleteAssetClass(item.assetClass_ID).subscribe({
        next: function(this: AssetClassesComponent) { this.loadData(); this.snackBar.open('Deleted', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: AssetClassesComponent, err: any) { this.snackBar.open(err.error?.error || 'Delete failed', 'OK', { duration: 4000 }); }.bind(this)
      });
    }
  }

  openImport(): void { this.showImport.set(true); this.importFile.set(null); this.importErrors.set([]); this.importSuccess.set(''); }
  closeImport(): void { this.showImport.set(false); }
  onImportFileSelected(event: Event): void { const input = event.target as HTMLInputElement; if (input.files && input.files[0]) { this.importFile.set(input.files[0]); this.importErrors.set([]); this.importSuccess.set(''); } }

  doImport(): void {
    const file = this.importFile();
    if (!file) return;
    this.importing.set(true);
    this.api.importAssetClasses(file).subscribe({
      next: function(this: AssetClassesComponent, result: any) { this.importing.set(false); this.importSuccess.set('Imported ' + result.imported + ' records'); this.loadData(); }.bind(this),
      error: function(this: AssetClassesComponent, err: any) { this.importing.set(false); if (err.error?.errors) { this.importErrors.set(err.error.errors); } else { this.snackBar.open(err.error?.error || 'Import failed', 'OK', { duration: 4000 }); } }.bind(this)
    });
  }

  downloadTemplate(): void {
    this.api.downloadAssetClassTemplate().subscribe({
      next: function(blob: Blob) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'asset_classes_template.xlsx'; a.click(); URL.revokeObjectURL(url); }
    });
  }
}
