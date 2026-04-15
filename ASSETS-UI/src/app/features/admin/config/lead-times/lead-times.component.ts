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
  selector: 'app-lead-times',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule],
  templateUrl: './lead-times.component.html',
  styleUrls: ['./lead-times.component.css']
})
export class LeadTimesComponent implements OnInit {
  items = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  editingEnabled = signal<boolean>(true);
  formData = { maintenanceDesc: '', leadTimeDays: 1 };

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getAllMaintenanceLeadTimes().subscribe({
      next: function(this: LeadTimesComponent, data: any[]) { this.items.set(data); this.loading.set(false); }.bind(this),
      error: function(this: LeadTimesComponent) { this.loading.set(false); }.bind(this)
    });
  }

  openAdd(): void {
    this.formData = { maintenanceDesc: '', leadTimeDays: 1 };
    this.editingId.set(null);
    this.showForm.set(true);
  }

  openEdit(item: any): void {
    this.formData = { maintenanceDesc: item.maintenanceDesc, leadTimeDays: item.leadTimeDays };
    this.editingId.set(item.leadTimeId);
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
      const payload = { maintenanceDesc: this.formData.maintenanceDesc, leadTimeDays: Number(this.formData.leadTimeDays), enabled: this.editingEnabled() };
      this.api.updateLeadTime(id, payload).subscribe({
        next: function(this: LeadTimesComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open('Lead time updated', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: LeadTimesComponent, err: any) { this.snackBar.open(err.error?.error || 'Update failed', 'OK', { duration: 4000 }); }.bind(this)
      });
    } else {
      const payload = { maintenanceDesc: this.formData.maintenanceDesc, leadTimeDays: Number(this.formData.leadTimeDays) };
      this.api.createLeadTime(payload).subscribe({
        next: function(this: LeadTimesComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open('Lead time created', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: LeadTimesComponent, err: any) { this.snackBar.open(err.error?.error || 'Create failed', 'OK', { duration: 4000 }); }.bind(this)
      });
    }
  }

  toggleEnabled(item: any): void {
    const newEnabled = !item.enabled;
    const label = newEnabled ? 'enabled' : 'disabled';
    const payload = { maintenanceDesc: item.maintenanceDesc, leadTimeDays: item.leadTimeDays, enabled: newEnabled };
    this.api.updateLeadTime(item.leadTimeId, payload).subscribe({
      next: function(this: LeadTimesComponent) { this.loadData(); this.snackBar.open('Lead time ' + label, 'OK', { duration: 3000 }); }.bind(this),
      error: function(this: LeadTimesComponent, err: any) { this.snackBar.open(err.error?.error || 'Update failed', 'OK', { duration: 4000 }); }.bind(this)
    });
  }
}
