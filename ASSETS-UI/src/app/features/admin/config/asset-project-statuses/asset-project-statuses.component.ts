import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../../core/api.service';

@Component({
  selector: 'app-asset-project-statuses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './asset-project-statuses.component.html',
  styleUrls: ['./asset-project-statuses.component.css']
})
export class AssetProjectStatusesComponent implements OnInit {
  items = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  deleteConfirmId: number | null = null;
  formData = { statusDesc: '' };

  constructor(private api: ApiService, private snack: MatSnackBar) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading.set(true);
    this.api.getAssetProjectStatuses().subscribe({
      next: function(this: AssetProjectStatusesComponent, data: any[]) {
        this.items.set(data);
        this.loading.set(false);
      }.bind(this),
      error: function(this: AssetProjectStatusesComponent) { this.loading.set(false); }.bind(this)
    });
  }

  openAdd() {
    this.formData = { statusDesc: '' };
    this.editingId.set(null);
    this.showForm.set(true);
  }

  openEdit(item: any) {
    this.formData = { statusDesc: item.statusDesc };
    this.editingId.set(item.assetProjectStatusId);
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save() {
    if (!this.formData.statusDesc.trim()) {
      this.snack.open('Status description is required', 'OK', { duration: 3000 });
      return;
    }
    this.saving.set(true);
    const id = this.editingId();
    if (id) {
      this.api.updateAssetProjectStatus(id, this.formData).subscribe({
        next: function(this: AssetProjectStatusesComponent) {
          this.saving.set(false);
          this.showForm.set(false);
          this.loadData();
          this.snack.open('Status updated', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        }.bind(this),
        error: function(this: AssetProjectStatusesComponent, err: any) {
          this.saving.set(false);
          this.snack.open(err.error?.error || 'Update failed', 'OK', { duration: 4000 });
        }.bind(this)
      });
    } else {
      this.api.createAssetProjectStatus(this.formData).subscribe({
        next: function(this: AssetProjectStatusesComponent) {
          this.saving.set(false);
          this.showForm.set(false);
          this.loadData();
          this.snack.open('Status created', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        }.bind(this),
        error: function(this: AssetProjectStatusesComponent, err: any) {
          this.saving.set(false);
          this.snack.open(err.error?.error || 'Create failed', 'OK', { duration: 4000 });
        }.bind(this)
      });
    }
  }

  confirmDelete(id: number) { this.deleteConfirmId = id; }
  cancelDelete() { this.deleteConfirmId = null; }

  doDelete(id: number) {
    this.api.deleteAssetProjectStatus(id).subscribe({
      next: function(this: AssetProjectStatusesComponent) {
        this.deleteConfirmId = null;
        this.loadData();
        this.snack.open('Status deleted', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      }.bind(this),
      error: function(this: AssetProjectStatusesComponent, err: any) {
        this.deleteConfirmId = null;
        this.snack.open(err.error?.error || 'Delete failed', 'OK', { duration: 4000 });
      }.bind(this)
    });
  }
}
