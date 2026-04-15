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
  selector: 'app-cidms-classes',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule],
  templateUrl: './cidms-classes.component.html',
  styleUrls: ['./cidms-classes.component.css']
})
export class CidmsClassesComponent implements OnInit {
  items = signal<any[]>([]);
  accountingSubGroups = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  formData: any = { assetCIDMSClassDesc: '', assetAccountSubGroupID: null };
  showImport = signal(false);
  importFile = signal<File | null>(null);
  importing = signal(false);
  importErrors = signal<any[]>([]);
  importSuccess = signal('');

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.api.getCidmsAccountingSubGroups().subscribe({ next: function(this: CidmsClassesComponent, data: any[]) { this.accountingSubGroups.set(data); }.bind(this) });
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getCidmsClasses().subscribe({
      next: function(this: CidmsClassesComponent, data: any[]) { this.items.set(data); this.loading.set(false); }.bind(this),
      error: function(this: CidmsClassesComponent) { this.loading.set(false); }.bind(this)
    });
  }

  getSubGroupName(id: number): string {
    const list = this.accountingSubGroups();
    for (let i = 0; i < list.length; i++) { if (list[i].assetAccountSubGroupID === id) return list[i].assetAccountSubGroupDesc; }
    return '';
  }

  openAdd(): void { this.formData = { assetCIDMSClassDesc: '', assetAccountSubGroupID: null }; this.editingId.set(null); this.showForm.set(true); }

  openEdit(item: any): void {
    this.formData = { assetCIDMSClassDesc: item.assetCIDMSClassDesc, assetAccountSubGroupID: item.assetAccountSubGroupID };
    this.editingId.set(item.assetCIDMSClassID);
    this.showForm.set(true);
  }

  cancelForm(): void { this.showForm.set(false); this.editingId.set(null); }

  save(): void {
    const id = this.editingId();
    const payload = { assetCIDMSClassDesc: this.formData.assetCIDMSClassDesc, assetAccountSubGroupID: this.formData.assetAccountSubGroupID ? Number(this.formData.assetAccountSubGroupID) : null };
    const obs = id ? this.api.updateCidmsClass(id, payload) : this.api.createCidmsClass(payload);
    obs.subscribe({
      next: function(this: CidmsClassesComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open(id ? 'Updated' : 'Created', 'OK', { duration: 3000 }); }.bind(this),
      error: function(this: CidmsClassesComponent, err: any) { this.snackBar.open(err.error?.error || 'Failed', 'OK', { duration: 4000 }); }.bind(this)
    });
  }

  confirmDelete(item: any): void {
    if (confirm('Delete "' + item.assetCIDMSClassDesc + '"?')) {
      this.api.deleteCidmsClass(item.assetCIDMSClassID).subscribe({
        next: function(this: CidmsClassesComponent) { this.loadData(); this.snackBar.open('Deleted', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: CidmsClassesComponent, err: any) { this.snackBar.open(err.error?.error || 'Delete failed', 'OK', { duration: 4000 }); }.bind(this)
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
    this.api.importCidmsClasses(file).subscribe({
      next: function(this: CidmsClassesComponent, result: any) { this.importing.set(false); this.importSuccess.set('Imported ' + result.imported + ' records'); this.loadData(); }.bind(this),
      error: function(this: CidmsClassesComponent, err: any) { this.importing.set(false); if (err.error?.errors) { this.importErrors.set(err.error.errors); } else { this.snackBar.open(err.error?.error || 'Import failed', 'OK', { duration: 4000 }); } }.bind(this)
    });
  }

  downloadTemplate(): void {
    this.api.downloadCidmsClassTemplate().subscribe({
      next: function(blob: Blob) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'cidms_classes_template.xlsx'; a.click(); URL.revokeObjectURL(url); }
    });
  }
}
