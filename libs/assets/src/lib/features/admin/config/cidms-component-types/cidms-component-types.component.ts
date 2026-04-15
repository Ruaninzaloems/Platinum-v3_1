import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../../../core/api.service';

@Component({
  selector: 'app-cidms-component-types',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule],
  templateUrl: './cidms-component-types.component.html',
  styleUrls: ['./cidms-component-types.component.css']
})
export class CidmsComponentTypesComponent implements OnInit {
  items = signal<any[]>([]);
  cidmsAssetTypes = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  formData: any = { assetCIDMSComponentTypeDesc: '', assetCIDMSAssetTypeID: null };
  showImport = signal(false);
  importFile = signal<File | null>(null);
  importing = signal(false);
  importErrors = signal<any[]>([]);
  importSuccess = signal('');

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.api.getCidmsAssetTypes().subscribe({ next: function(this: CidmsComponentTypesComponent, data: any[]) { this.cidmsAssetTypes.set(data); }.bind(this) });
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getCidmsComponentTypes().subscribe({
      next: function(this: CidmsComponentTypesComponent, data: any[]) { this.items.set(data); this.loading.set(false); }.bind(this),
      error: function(this: CidmsComponentTypesComponent) { this.loading.set(false); }.bind(this)
    });
  }

  getAssetTypeName(id: number): string {
    const list = this.cidmsAssetTypes();
    for (let i = 0; i < list.length; i++) { if (list[i].assetCIDMSAssetTypeID === id) return list[i].assetCIDMSAssetTypeDesc; }
    return '';
  }

  openAdd(): void { this.formData = { assetCIDMSComponentTypeDesc: '', assetCIDMSAssetTypeID: null }; this.editingId.set(null); this.showForm.set(true); }

  openEdit(item: any): void {
    this.formData = { assetCIDMSComponentTypeDesc: item.assetCIDMSComponentTypeDesc, assetCIDMSAssetTypeID: item.assetCIDMSAssetTypeID };
    this.editingId.set(item.assetCIDMSComponentTypeID);
    this.showForm.set(true);
  }

  cancelForm(): void { this.showForm.set(false); this.editingId.set(null); }

  save(): void {
    const id = this.editingId();
    const payload = { assetCIDMSComponentTypeDesc: this.formData.assetCIDMSComponentTypeDesc, assetCIDMSAssetTypeID: this.formData.assetCIDMSAssetTypeID ? Number(this.formData.assetCIDMSAssetTypeID) : null };
    const obs = id ? this.api.updateCidmsComponentType(id, payload) : this.api.createCidmsComponentType(payload);
    obs.subscribe({
      next: function(this: CidmsComponentTypesComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open(id ? 'Updated' : 'Created', 'OK', { duration: 3000 }); }.bind(this),
      error: function(this: CidmsComponentTypesComponent, err: any) { this.snackBar.open(err.error?.error || 'Failed', 'OK', { duration: 4000 }); }.bind(this)
    });
  }

  confirmDelete(item: any): void {
    if (confirm('Delete "' + item.assetCIDMSComponentTypeDesc + '"?')) {
      this.api.deleteCidmsComponentType(item.assetCIDMSComponentTypeID).subscribe({
        next: function(this: CidmsComponentTypesComponent) { this.loadData(); this.snackBar.open('Deleted', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: CidmsComponentTypesComponent, err: any) { this.snackBar.open(err.error?.error || 'Delete failed', 'OK', { duration: 4000 }); }.bind(this)
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
    this.api.importCidmsComponentTypes(file).subscribe({
      next: function(this: CidmsComponentTypesComponent, result: any) { this.importing.set(false); this.importSuccess.set('Imported ' + result.imported + ' records'); this.loadData(); }.bind(this),
      error: function(this: CidmsComponentTypesComponent, err: any) { this.importing.set(false); if (err.error?.errors) { this.importErrors.set(err.error.errors); } else { this.snackBar.open(err.error?.error || 'Import failed', 'OK', { duration: 4000 }); } }.bind(this)
    });
  }

  downloadTemplate(): void {
    this.api.downloadCidmsComponentTypeTemplate().subscribe({
      next: function(blob: Blob) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'cidms_component_types_template.xlsx'; a.click(); URL.revokeObjectURL(url); }
    });
  }
}
