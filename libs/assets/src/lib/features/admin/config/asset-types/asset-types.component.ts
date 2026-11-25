import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../../../core/api.service';

@Component({
  selector: 'app-asset-types',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule, MatTooltipModule],
  templateUrl: './asset-types.component.html',
  styleUrls: ['./asset-types.component.css']
})
export class AssetTypesComponent implements OnInit {
  items = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  formData = { assetTypeDesc: '', enabled: 1, noUsefulLife: 0, requireStatus: 0 };
  showImport = signal(false);
  importFile = signal<File | null>(null);
  importing = signal(false);
  importErrors = signal<any[]>([]);
  importSuccess = signal('');

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getAssetTypes().subscribe({
      next: function(this: AssetTypesComponent, data: any[]) { this.items.set(data); this.loading.set(false); }.bind(this),
      error: function(this: AssetTypesComponent) { this.loading.set(false); }.bind(this)
    });
  }

  openAdd(): void {
    this.formData = { assetTypeDesc: '', enabled: 1, noUsefulLife: 0, requireStatus: 0 };
    this.editingId.set(null);
    this.showForm.set(true);
  }

  openEdit(item: any): void {
    this.formData = { assetTypeDesc: item.assetTypeDesc, enabled: item.enabled ?? 1, noUsefulLife: item.noUsefulLife ?? 0, requireStatus: item.requireStatus ?? 0 };
    this.editingId.set(item.assetTypeId);
    this.showForm.set(true);
  }

  cancelForm(): void {

    this.showForm.set(false);
    this.editingId.set(null);
  }

  onEnabledChange(event: Event): void { this.formData.enabled = (event.target as HTMLInputElement).checked ? 1 : 0; }
  onNoUsefulLifeChange(event: Event): void { this.formData.noUsefulLife = (event.target as HTMLInputElement).checked ? 1 : 0; }
  onRequireStatusChange(event: Event): void { this.formData.requireStatus = (event.target as HTMLInputElement).checked ? 1 : 0; }

  save(): void {
    const id = this.editingId();
    if (id) {
      this.api.updateAssetType(id, this.formData).subscribe({
        next: function(this: AssetTypesComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open('Asset type updated', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: AssetTypesComponent, err: any) { this.snackBar.open(err.error?.error || 'Update failed', 'OK', { duration: 4000 }); }.bind(this)
      });
    } else {
      this.api.createAssetType(this.formData).subscribe({
        next: function(this: AssetTypesComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open('Asset type created', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: AssetTypesComponent, err: any) { this.snackBar.open(err.error?.error || 'Create failed', 'OK', { duration: 4000 }); }.bind(this)
      });
    }
  }

  confirmDelete(item: any): void {
    if (confirm('Are you sure you want to delete "' + item.assetTypeDesc + '"?')) {
      this.api.deleteAssetType(item.assetTypeId).subscribe({
        next: function(this: AssetTypesComponent) { this.loadData(); this.snackBar.open('Asset type deleted', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: AssetTypesComponent, err: any) { this.snackBar.open(err.error?.error || 'Delete failed', 'OK', { duration: 4000 }); }.bind(this)
      });
    }
  }

  openImport(): void {
    this.showImport.set(true);
    this.importFile.set(null);
    this.importErrors.set([]);
    this.importSuccess.set('');
  }

  closeImport(): void {
    this.showImport.set(false);
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.importFile.set(input.files[0]);
      this.importErrors.set([]);
      this.importSuccess.set('');
    }
  }

  doImport(): void {
    const file = this.importFile();
    if (!file) return;
    this.importing.set(true);
    this.importErrors.set([]);
    this.importSuccess.set('');
    this.api.importAssetTypes(file).subscribe({
      next: function(this: AssetTypesComponent, result: any) {
        this.importing.set(false);
        this.importSuccess.set('Successfully imported ' + result.imported + ' records');
        this.loadData();
      }.bind(this),
      error: function(this: AssetTypesComponent, err: any) {
        this.importing.set(false);
        if (err.error && err.error.errors) {
          this.importErrors.set(err.error.errors);
        } else {
          this.snackBar.open(err.error?.error || 'Import failed', 'OK', { duration: 4000 });
        }
      }.bind(this)
    });
  }

  downloadTemplate(): void {
    this.api.downloadAssetTypeTemplate().subscribe({
      next: function(blob: Blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'asset_types_template.xlsx';
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  exportToExcel(): void {
    this.api.exportAssetTypes().subscribe({
      next: function(blob: Blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'asset_types_export.xlsx';
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }
}
