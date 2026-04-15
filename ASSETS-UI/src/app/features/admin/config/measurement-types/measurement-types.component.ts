import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../../core/api.service';

@Component({
  selector: 'app-measurement-types',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './measurement-types.component.html',
  styleUrls: ['./measurement-types.component.css']
})
export class MeasurementTypesComponent implements OnInit {
  items = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  formData = { name: '' };
  showImport = signal(false);
  importFile = signal<File | null>(null);
  importing = signal(false);
  importErrors = signal<any[]>([]);
  importSuccess = signal('');

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading.set(true);
    this.api.getMeasurementTypes().subscribe({
      next: function(this: MeasurementTypesComponent, data: any[]) { this.items.set(data); this.loading.set(false); }.bind(this),
      error: function(this: MeasurementTypesComponent) { this.loading.set(false); }.bind(this)
    });
  }

  openAdd(): void { this.formData = { name: '' }; this.editingId.set(null); this.showForm.set(true); }
  openEdit(item: any): void { this.formData = { name: item.name }; this.editingId.set(item.assetMeasurement_ID); this.showForm.set(true); }
  cancelForm(): void { this.showForm.set(false); this.editingId.set(null); }

  save(): void {
    const id = this.editingId();
    const obs = id ? this.api.updateMeasurementType(id, this.formData) : this.api.createMeasurementType(this.formData);
    obs.subscribe({
      next: function(this: MeasurementTypesComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open(id ? 'Updated' : 'Created', 'OK', { duration: 3000 }); }.bind(this),
      error: function(this: MeasurementTypesComponent, err: any) { this.snackBar.open(err.error?.error || 'Failed', 'OK', { duration: 4000 }); }.bind(this)
    });
  }

  confirmDelete(item: any): void {
    if (confirm('Delete "' + item.name + '"?')) {
      this.api.deleteMeasurementType(item.assetMeasurement_ID).subscribe({
        next: function(this: MeasurementTypesComponent) { this.loadData(); this.snackBar.open('Deleted', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: MeasurementTypesComponent, err: any) { this.snackBar.open(err.error?.error || 'Delete failed', 'OK', { duration: 4000 }); }.bind(this)
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
    this.api.importMeasurementTypes(file).subscribe({
      next: function(this: MeasurementTypesComponent, result: any) { this.importing.set(false); this.importSuccess.set('Imported ' + result.imported + ' records'); this.loadData(); }.bind(this),
      error: function(this: MeasurementTypesComponent, err: any) { this.importing.set(false); if (err.error?.errors) { this.importErrors.set(err.error.errors); } else { this.snackBar.open(err.error?.error || 'Import failed', 'OK', { duration: 4000 }); } }.bind(this)
    });
  }

  downloadTemplate(): void {
    this.api.downloadMeasurementTypeTemplate().subscribe({
      next: function(blob: Blob) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'measurement_types_template.xlsx'; a.click(); URL.revokeObjectURL(url); }
    });
  }
}
