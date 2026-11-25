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
  selector: 'app-maint-frequencies',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule],
  templateUrl: './maint-frequencies.component.html',
  styleUrls: ['./maint-frequencies.component.css']
})
export class MaintFrequenciesComponent implements OnInit {
  items = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  formData = { frequencyDesc: '', intervalDays: 0, enabled: true, sortOrder: 0 };

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getAllMaintFrequencies().subscribe({
      next: function(this: MaintFrequenciesComponent, data: any[]) { this.items.set(data); this.loading.set(false); }.bind(this),
      error: function(this: MaintFrequenciesComponent) { this.loading.set(false); }.bind(this)
    });
  }

  openAdd(): void {
    const maxOrder = this.items().reduce(function(m: number, i: any) { return Math.max(m, i.sortOrder || 0); }, 0);
    this.formData = { frequencyDesc: '', intervalDays: 0, enabled: true, sortOrder: maxOrder + 10 };
    this.editingId.set(null);
    this.showForm.set(true);
  }

  openEdit(item: any): void {
    this.formData = { frequencyDesc: item.frequencyDesc, intervalDays: item.intervalDays || 0, enabled: !!item.enabled, sortOrder: item.sortOrder || 0 };
    this.editingId.set(item.frequencyId);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save(): void {
    const id = this.editingId();
    const payload = { frequencyDesc: this.formData.frequencyDesc, intervalDays: Number(this.formData.intervalDays), enabled: this.formData.enabled, sortOrder: Number(this.formData.sortOrder) };
    if (id) {
      this.api.updateMaintFrequency(id, payload).subscribe({
        next: function(this: MaintFrequenciesComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open('Maintenance frequency updated', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: MaintFrequenciesComponent, err: any) { this.snackBar.open(err.error?.error || 'Update failed', 'OK', { duration: 4000 }); }.bind(this)
      });
    } else {
      this.api.createMaintFrequency(payload).subscribe({
        next: function(this: MaintFrequenciesComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open('Maintenance frequency created', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: MaintFrequenciesComponent, err: any) { this.snackBar.open(err.error?.error || 'Create failed', 'OK', { duration: 4000 }); }.bind(this)
      });
    }
  }

  toggleEnabled(item: any): void {
    const newEnabled = !item.enabled;
    const payload = { frequencyDesc: item.frequencyDesc, intervalDays: item.intervalDays || 0, enabled: newEnabled, sortOrder: item.sortOrder || 0 };
    this.api.updateMaintFrequency(item.frequencyId, payload).subscribe({
      next: function(this: MaintFrequenciesComponent) { this.loadData(); this.snackBar.open(newEnabled ? 'Enabled' : 'Disabled', 'OK', { duration: 3000 }); }.bind(this),
      error: function(this: MaintFrequenciesComponent, err: any) { this.snackBar.open(err.error?.error || 'Update failed', 'OK', { duration: 4000 }); }.bind(this)
    });
  }

  confirmDelete(item: any): void {
    if (confirm('Delete "' + item.frequencyDesc + '"? This will fail if plans reference it.')) {
      this.api.deleteMaintFrequency(item.frequencyId).subscribe({
        next: function(this: MaintFrequenciesComponent) { this.loadData(); this.snackBar.open('Maintenance frequency deleted', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: MaintFrequenciesComponent, err: any) { this.snackBar.open(err.error?.error || 'Delete failed', 'OK', { duration: 4000 }); }.bind(this)
      });
    }
  }

  exportToExcel(): void {
    this.api.exportMaintFrequencies().subscribe({
      next: (blob: Blob) => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'maintenance_frequencies_export.xlsx'; a.click(); URL.revokeObjectURL(url); }
    });
  }
}
