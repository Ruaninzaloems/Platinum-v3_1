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
  selector: 'app-service-groups',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule],
  templateUrl: './service-groups.component.html',
  styleUrls: ['./service-groups.component.css']
})
export class ServiceGroupsComponent implements OnInit {
  items = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  editingEnabled = signal<boolean>(true);
  formData = { assetServiceGroupDesc: '' };

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getAllMaintenanceServiceGroups().subscribe({
      next: function(this: ServiceGroupsComponent, data: any[]) { this.items.set(data); this.loading.set(false); }.bind(this),
      error: function(this: ServiceGroupsComponent) { this.loading.set(false); }.bind(this)
    });
  }

  openAdd(): void {
    this.formData = { assetServiceGroupDesc: '' };
    this.editingId.set(null);
    this.showForm.set(true);
  }

  openEdit(item: any): void {
    this.formData = { assetServiceGroupDesc: item.assetServiceGroupDesc };
    this.editingId.set(item.assetServiceGroupId);
    this.editingEnabled.set(item.enabled);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save(): void {
    const id = this.editingId();
    if (id) {
      const payload = { assetServiceGroupDesc: this.formData.assetServiceGroupDesc, enabled: this.editingEnabled() };
      this.api.updateServiceGroup(id, payload).subscribe({
        next: function(this: ServiceGroupsComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open('Service group updated', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: ServiceGroupsComponent, err: any) { this.snackBar.open(err.error?.error || 'Update failed', 'OK', { duration: 4000 }); }.bind(this)
      });
    } else {
      this.api.createServiceGroup(this.formData).subscribe({
        next: function(this: ServiceGroupsComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open('Service group created', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: ServiceGroupsComponent, err: any) { this.snackBar.open(err.error?.error || 'Create failed', 'OK', { duration: 4000 }); }.bind(this)
      });
    }
  }

  toggleEnabled(item: any): void {
    const newEnabled = !item.enabled;
    const label = newEnabled ? 'enabled' : 'disabled';
    const payload = { assetServiceGroupDesc: item.assetServiceGroupDesc, enabled: newEnabled };
    this.api.updateServiceGroup(item.assetServiceGroupId, payload).subscribe({
      next: function(this: ServiceGroupsComponent) { this.loadData(); this.snackBar.open('Service group ' + label, 'OK', { duration: 3000 }); }.bind(this),
      error: function(this: ServiceGroupsComponent, err: any) { this.snackBar.open(err.error?.error || 'Update failed', 'OK', { duration: 4000 }); }.bind(this)
    });
  }
}
