import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../../core/api.service';

@Component({
  selector: 'app-asset-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './asset-categories.component.html',
  styleUrls: ['./asset-categories.component.css']
})
export class AssetCategoriesComponent implements OnInit {
  items = signal<any[]>([]);
  assetTypes = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  formData: any = { assetCategoryDesc: '', typeID: null };
  filterTypeId = signal<number | null>(null);
  showImport = signal(false);
  importFile = signal<File | null>(null);
  importing = signal(false);
  importErrors = signal<any[]>([]);
  importSuccess = signal('');

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.api.getAssetTypes().subscribe({ next: function(this: AssetCategoriesComponent, data: any[]) { this.assetTypes.set(data); }.bind(this) });
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const params: any = {};
    const ftid = this.filterTypeId();
    if (ftid) { params.typeId = ftid; }
    this.api.getAssetCategoriesList(params).subscribe({
      next: function(this: AssetCategoriesComponent, data: any[]) { this.items.set(data); this.loading.set(false); }.bind(this),
      error: function(this: AssetCategoriesComponent) { this.loading.set(false); }.bind(this)
    });
  }

  onFilterChange(value: string): void {
    this.filterTypeId.set(value ? Number(value) : null);
    this.loadData();
  }

  getTypeName(typeId: number): string {
    const types = this.assetTypes();
    for (let i = 0; i < types.length; i++) { if (types[i].assetType_ID === typeId) return types[i].assetTypeDesc; }
    return '';
  }

  openAdd(): void { this.formData = { assetCategoryDesc: '', typeID: null }; this.editingId.set(null); this.showForm.set(true); }

  openEdit(item: any): void {
    this.formData = { assetCategoryDesc: item.assetCategoryDesc, typeID: item.typeID };
    this.editingId.set(item.assetCategoryID);
    this.showForm.set(true);
  }

  cancelForm(): void { this.showForm.set(false); this.editingId.set(null); }

  save(): void {
    const id = this.editingId();
    const payload = { assetCategoryDesc: this.formData.assetCategoryDesc, typeID: Number(this.formData.typeID) };
    const obs = id ? this.api.updateAssetCategory(id, payload) : this.api.createAssetCategory(payload);
    obs.subscribe({
      next: function(this: AssetCategoriesComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open(id ? 'Updated' : 'Created', 'OK', { duration: 3000 }); }.bind(this),
      error: function(this: AssetCategoriesComponent, err: any) { this.snackBar.open(err.error?.error || 'Failed', 'OK', { duration: 4000 }); }.bind(this)
    });
  }

  confirmDelete(item: any): void {
    if (confirm('Delete "' + item.assetCategoryDesc + '"?')) {
      this.api.deleteAssetCategory(item.assetCategoryID).subscribe({
        next: function(this: AssetCategoriesComponent) { this.loadData(); this.snackBar.open('Deleted', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: AssetCategoriesComponent, err: any) { this.snackBar.open(err.error?.error || 'Delete failed', 'OK', { duration: 4000 }); }.bind(this)
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
    this.api.importAssetCategories(file).subscribe({
      next: function(this: AssetCategoriesComponent, result: any) { this.importing.set(false); this.importSuccess.set('Imported ' + result.imported + ' records'); this.loadData(); }.bind(this),
      error: function(this: AssetCategoriesComponent, err: any) { this.importing.set(false); if (err.error?.errors) { this.importErrors.set(err.error.errors); } else { this.snackBar.open(err.error?.error || 'Import failed', 'OK', { duration: 4000 }); } }.bind(this)
    });
  }

  downloadTemplate(): void {
    this.api.downloadAssetCategoryTemplate().subscribe({
      next: function(blob: Blob) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'asset_categories_template.xlsx'; a.click(); URL.revokeObjectURL(url); }
    });
  }
}
