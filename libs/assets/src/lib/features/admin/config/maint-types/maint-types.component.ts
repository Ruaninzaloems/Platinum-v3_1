import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../../../core/api.service';

@Component({
  selector: 'app-maint-types',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule],
  templateUrl: './maint-types.component.html',
  styleUrls: ['./maint-types.component.css']
})
export class MaintTypesComponent implements OnInit {
  items = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  formData = { maintTypeDesc: '', isCapex: false, enabled: true, sortOrder: 0 };

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getAllMaintTypes().subscribe({
      next: function(this: MaintTypesComponent, data: any[]) { this.items.set(data); this.loading.set(false); }.bind(this),
      error: function(this: MaintTypesComponent) { this.loading.set(false); }.bind(this)
    });
  }

  openAdd(): void {
    const maxOrder = this.items().reduce(function(m: number, i: any) { return Math.max(m, i.sortOrder || 0); }, 0);
    this.formData = { maintTypeDesc: '', isCapex: false, enabled: true, sortOrder: maxOrder + 10 };
    this.editingId.set(null);
    this.showForm.set(true);
  }

  openEdit(item: any): void {
    this.formData = { maintTypeDesc: item.maintTypeDesc, isCapex: !!item.isCapex, enabled: !!item.enabled, sortOrder: item.sortOrder || 0 };
    this.editingId.set(item.maintTypeId);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save(): void {
    const id = this.editingId();
    const payload = { maintTypeDesc: this.formData.maintTypeDesc, isCapex: this.formData.isCapex, enabled: this.formData.enabled, sortOrder: Number(this.formData.sortOrder) };
    if (id) {
      this.api.updateMaintType(id, payload).subscribe({
        next: function(this: MaintTypesComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open('Maintenance type updated', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: MaintTypesComponent, err: any) { this.snackBar.open(err.error?.error || 'Update failed', 'OK', { duration: 4000 }); }.bind(this)
      });
    } else {
      this.api.createMaintType(payload).subscribe({
        next: function(this: MaintTypesComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open('Maintenance type created', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: MaintTypesComponent, err: any) { this.snackBar.open(err.error?.error || 'Create failed', 'OK', { duration: 4000 }); }.bind(this)
      });
    }
  }

  toggleEnabled(item: any): void {
    const newEnabled = !item.enabled;
    const payload = { maintTypeDesc: item.maintTypeDesc, isCapex: !!item.isCapex, enabled: newEnabled, sortOrder: item.sortOrder || 0 };
    this.api.updateMaintType(item.maintTypeId, payload).subscribe({
      next: function(this: MaintTypesComponent) { this.loadData(); this.snackBar.open(newEnabled ? 'Enabled' : 'Disabled', 'OK', { duration: 3000 }); }.bind(this),
      error: function(this: MaintTypesComponent, err: any) { this.snackBar.open(err.error?.error || 'Update failed', 'OK', { duration: 4000 }); }.bind(this)
    });
  }

  confirmDelete(item: any): void {
    if (confirm('Delete "' + item.maintTypeDesc + '"? This will fail if plans reference it.')) {
      this.api.deleteMaintType(item.maintTypeId).subscribe({
        next: function(this: MaintTypesComponent) { this.loadData(); this.snackBar.open('Maintenance type deleted', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: MaintTypesComponent, err: any) { this.snackBar.open(err.error?.error || 'Delete failed', 'OK', { duration: 4000 }); }.bind(this)
      });
    }
  }

  exportToExcel(): void {
    this.api.exportMaintTypes().subscribe({
      next: (blob: Blob) => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'maintenance_types_export.xlsx'; a.click(); URL.revokeObjectURL(url); }
    });
  }
}
