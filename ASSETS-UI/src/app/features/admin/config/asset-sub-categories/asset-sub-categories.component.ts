import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../../core/api.service';

@Component({
  selector: 'app-asset-sub-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './asset-sub-categories.component.html',
  styleUrls: ['./asset-sub-categories.component.css']
})
export class AssetSubCategoriesComponent implements OnInit {
  items = signal<any[]>([]);
  assetTypes = signal<any[]>([]);
  categories = signal<any[]>([]);
  formCategories = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  formData: any = { asset_SubCategoryDescription: '', typeID: null, assetCategoryID: null };
  filterTypeId = signal<number | null>(null);
  filterCategoryId = signal<number | null>(null);
  filterCategories = signal<any[]>([]);
  showImport = signal(false);
  importFile = signal<File | null>(null);
  importing = signal(false);
  importErrors = signal<any[]>([]);
  importSuccess = signal('');

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.api.getAssetTypes().subscribe({ next: function(this: AssetSubCategoriesComponent, data: any[]) { this.assetTypes.set(data); }.bind(this) });
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const params: any = {};
    const ftid = this.filterTypeId();
    const fcid = this.filterCategoryId();
    if (ftid) { params.typeId = ftid; }
    if (fcid) { params.categoryId = fcid; }
    this.api.getAssetSubCategoriesList(params).subscribe({
      next: function(this: AssetSubCategoriesComponent, data: any[]) { this.items.set(data); this.loading.set(false); }.bind(this),
      error: function(this: AssetSubCategoriesComponent) { this.loading.set(false); }.bind(this)
    });
  }

  onFilterTypeChange(value: string): void {
    this.filterTypeId.set(value ? Number(value) : null);
    this.filterCategoryId.set(null);
    if (value) {
      this.api.getAssetCategoriesList({ typeId: Number(value) }).subscribe({
        next: function(this: AssetSubCategoriesComponent, data: any[]) { this.filterCategories.set(data); }.bind(this)
      });
    } else {
      this.filterCategories.set([]);
    }
    this.loadData();
  }

  onFilterCategoryChange(value: string): void {
    this.filterCategoryId.set(value ? Number(value) : null);
    this.loadData();
  }

  onFormTypeChange(value: string): void {
    this.formData.typeID = value ? Number(value) : null;
    this.formData.assetCategoryID = null;
    if (value) {
      this.api.getAssetCategoriesList({ typeId: Number(value) }).subscribe({
        next: function(this: AssetSubCategoriesComponent, data: any[]) { this.formCategories.set(data); }.bind(this)
      });
    } else {
      this.formCategories.set([]);
    }
  }

  getTypeName(typeId: number): string {
    const types = this.assetTypes();
    for (let i = 0; i < types.length; i++) { if (types[i].assetType_ID === typeId) return types[i].assetTypeDesc; }
    return '';
  }

  openAdd(): void {
    this.formData = { asset_SubCategoryDescription: '', typeID: null, assetCategoryID: null };
    this.formCategories.set([]);
    this.editingId.set(null);
    this.showForm.set(true);
  }

  openEdit(item: any): void {
    this.formData = { asset_SubCategoryDescription: item.asset_SubCategoryDescription, typeID: item.typeID, assetCategoryID: item.assetCategoryID };
    if (item.typeID) {
      this.api.getAssetCategoriesList({ typeId: item.typeID }).subscribe({
        next: function(this: AssetSubCategoriesComponent, data: any[]) { this.formCategories.set(data); }.bind(this)
      });
    }
    this.editingId.set(item.asset_SubCategory_ID);
    this.showForm.set(true);
  }

  cancelForm(): void { this.showForm.set(false); this.editingId.set(null); }

  save(): void {
    const id = this.editingId();
    const payload = {
      asset_SubCategoryDescription: this.formData.asset_SubCategoryDescription,
      typeID: this.formData.typeID ? Number(this.formData.typeID) : null,
      assetCategoryID: this.formData.assetCategoryID ? Number(this.formData.assetCategoryID) : null
    };
    const obs = id ? this.api.updateAssetSubCategory(id, payload) : this.api.createAssetSubCategory(payload);
    obs.subscribe({
      next: function(this: AssetSubCategoriesComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open(id ? 'Updated' : 'Created', 'OK', { duration: 3000 }); }.bind(this),
      error: function(this: AssetSubCategoriesComponent, err: any) { this.snackBar.open(err.error?.error || 'Failed', 'OK', { duration: 4000 }); }.bind(this)
    });
  }

  confirmDelete(item: any): void {
    if (confirm('Delete "' + item.asset_SubCategoryDescription + '"?')) {
      this.api.deleteAssetSubCategory(item.asset_SubCategory_ID).subscribe({
        next: function(this: AssetSubCategoriesComponent) { this.loadData(); this.snackBar.open('Deleted', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: AssetSubCategoriesComponent, err: any) { this.snackBar.open(err.error?.error || 'Delete failed', 'OK', { duration: 4000 }); }.bind(this)
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
    this.api.importAssetSubCategories(file).subscribe({
      next: function(this: AssetSubCategoriesComponent, result: any) { this.importing.set(false); this.importSuccess.set('Imported ' + result.imported + ' records'); this.loadData(); }.bind(this),
      error: function(this: AssetSubCategoriesComponent, err: any) { this.importing.set(false); if (err.error?.errors) { this.importErrors.set(err.error.errors); } else { this.snackBar.open(err.error?.error || 'Import failed', 'OK', { duration: 4000 }); } }.bind(this)
    });
  }

  downloadTemplate(): void {
    this.api.downloadAssetSubCategoryTemplate().subscribe({
      next: function(blob: Blob) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'asset_sub_categories_template.xlsx'; a.click(); URL.revokeObjectURL(url); }
    });
  }
}
