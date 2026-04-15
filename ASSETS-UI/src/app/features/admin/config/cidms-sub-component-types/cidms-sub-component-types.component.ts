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
  selector: 'app-cidms-sub-component-types',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule],
  templateUrl: './cidms-sub-component-types.component.html',
  styleUrls: ['./cidms-sub-component-types.component.css']
})
export class CidmsSubComponentTypesComponent implements OnInit {
  items = signal<any[]>([]);
  componentTypes = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  formData: any = { assetCIDMSSubComponentTypeDesc: '', assetCIDMSComponentTypeID: null, infrastructure: 0, nature: 0 };
  showImport = signal(false);
  importFile = signal<File | null>(null);
  importing = signal(false);
  importErrors = signal<any[]>([]);
  importSuccess = signal('');

  natureOptions = [
    { value: 0, label: 'None' },
    { value: 1, label: 'Movable' },
    { value: 2, label: 'Immovable' },
    { value: 3, label: 'Intangible' }
  ];

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.api.getCidmsComponentTypes().subscribe({ next: function(this: CidmsSubComponentTypesComponent, data: any[]) { this.componentTypes.set(data); }.bind(this) });
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getCidmsSubComponentTypes().subscribe({
      next: function(this: CidmsSubComponentTypesComponent, data: any[]) { this.items.set(data); this.loading.set(false); }.bind(this),
      error: function(this: CidmsSubComponentTypesComponent) { this.loading.set(false); }.bind(this)
    });
  }

  getComponentTypeName(id: number): string {
    const list = this.componentTypes();
    for (let i = 0; i < list.length; i++) { if (list[i].assetCIDMSComponentTypeID === id) return list[i].assetCIDMSComponentTypeDesc; }
    return '';
  }

  getNatureLabel(val: number): string {
    for (let i = 0; i < this.natureOptions.length; i++) { if (this.natureOptions[i].value === val) return this.natureOptions[i].label; }
    return 'None';
  }

  openAdd(): void { this.formData = { assetCIDMSSubComponentTypeDesc: '', assetCIDMSComponentTypeID: null, infrastructure: 0, nature: 0 }; this.editingId.set(null); this.showForm.set(true); }

  openEdit(item: any): void {
    this.formData = {
      assetCIDMSSubComponentTypeDesc: item.assetCIDMSSubComponentTypeDesc,
      assetCIDMSComponentTypeID: item.assetCIDMSComponentTypeID,
      infrastructure: item.infrastructure || 0,
      nature: item.nature || 0
    };
    this.editingId.set(item.assetCIDMSSubComponentTypeID);
    this.showForm.set(true);
  }

  cancelForm(): void { this.showForm.set(false); this.editingId.set(null); }

  onInfrastructureChange(checked: boolean): void {
    this.formData.infrastructure = checked ? 1 : 0;
  }

  save(): void {
    const id = this.editingId();
    const payload = {
      assetCIDMSSubComponentTypeDesc: this.formData.assetCIDMSSubComponentTypeDesc,
      assetCIDMSComponentTypeID: this.formData.assetCIDMSComponentTypeID ? Number(this.formData.assetCIDMSComponentTypeID) : null,
      infrastructure: this.formData.infrastructure,
      nature: this.formData.nature ? Number(this.formData.nature) : 0
    };
    const obs = id ? this.api.updateCidmsSubComponentType(id, payload) : this.api.createCidmsSubComponentType(payload);
    obs.subscribe({
      next: function(this: CidmsSubComponentTypesComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open(id ? 'Updated' : 'Created', 'OK', { duration: 3000 }); }.bind(this),
      error: function(this: CidmsSubComponentTypesComponent, err: any) { this.snackBar.open(err.error?.error || 'Failed', 'OK', { duration: 4000 }); }.bind(this)
    });
  }

  confirmDelete(item: any): void {
    if (confirm('Delete "' + item.assetCIDMSSubComponentTypeDesc + '"?')) {
      this.api.deleteCidmsSubComponentType(item.assetCIDMSSubComponentTypeID).subscribe({
        next: function(this: CidmsSubComponentTypesComponent) { this.loadData(); this.snackBar.open('Deleted', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: CidmsSubComponentTypesComponent, err: any) { this.snackBar.open(err.error?.error || 'Delete failed', 'OK', { duration: 4000 }); }.bind(this)
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
    this.api.importCidmsSubComponentTypes(file).subscribe({
      next: function(this: CidmsSubComponentTypesComponent, result: any) { this.importing.set(false); this.importSuccess.set('Imported ' + result.imported + ' records'); this.loadData(); }.bind(this),
      error: function(this: CidmsSubComponentTypesComponent, err: any) { this.importing.set(false); if (err.error?.errors) { this.importErrors.set(err.error.errors); } else { this.snackBar.open(err.error?.error || 'Import failed', 'OK', { duration: 4000 }); } }.bind(this)
    });
  }

  downloadTemplate(): void {
    this.api.downloadCidmsSubComponentTypeTemplate().subscribe({
      next: function(blob: Blob) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'cidms_sub_component_types_template.xlsx'; a.click(); URL.revokeObjectURL(url); }
    });
  }
}
