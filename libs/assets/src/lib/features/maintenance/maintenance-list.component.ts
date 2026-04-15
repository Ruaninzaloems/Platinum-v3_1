import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-maintenance-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './maintenance-list.component.html',
  styleUrls: ['./maintenance-list.component.css']
})
export class MaintenanceListComponent implements OnInit {
  items = signal<any[]>([]);
  loading = signal(true);
  showNewForm = false;
  newRequest = { assetId: '', priority: 'Medium', serviceGroup: 'General', description: '', estimatedCost: 0 };
  urgentCount = computed(() => this.items().filter(i => i.priority === 'Urgent').length);
  pendingCount = computed(() => this.items().filter(i => i.status === 'Pending').length);
  inProgressCount = computed(() => this.items().filter(i => i.status === 'In Progress').length);
  completedCount = computed(() => this.items().filter(i => i.status === 'Completed').length);

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.api.getMaintenanceRequests().subscribe({
      next: (res) => { this.items.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      'Urgent': 'status-badge status-rejected',
      'High': 'status-badge status-pending',
      'Medium': 'status-badge status-in_progress',
      'Low': 'status-badge status-draft'
    };
    return map[priority] || 'status-badge';
  }

  getStatusClass(status: string): string {
    const s = status.toLowerCase().replace(/ /g, '_');
    return 'status-badge status-' + s;
  }

  submitRequest() {
    if (!this.newRequest.assetId || !this.newRequest.description) {
      this.snackBar.open('Please fill in Asset ID and Description', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      return;
    }
    const newItem = {
      id: Date.now(),
      requestNumber: 'MR-' + String(this.items().length + 1).padStart(3, '0'),
      assetId: this.newRequest.assetId,
      description: this.newRequest.description,
      priority: this.newRequest.priority,
      status: 'Pending',
      serviceGroup: this.newRequest.serviceGroup,
      estimatedCost: this.newRequest.estimatedCost || 0,
      assignedTo: 'Unassigned',
      requestDate: new Date().toISOString().split('T')[0]
    };
    this.items.set([newItem, ...this.items()]);
    this.showNewForm = false;
    this.newRequest = { assetId: '', priority: 'Medium', serviceGroup: 'General', description: '', estimatedCost: 0 };
    this.snackBar.open('Maintenance request submitted successfully', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  assignRequest(item: any) {
    this.items.set(this.items().map(i => i.id === item.id ? { ...i, status: 'In Progress', assignedTo: 'J. Ndlovu' } : i));
    this.snackBar.open('Request assigned to J. Ndlovu', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  pendingComplete = signal<any>(null);

  completeRequest(item: any) {
    this.pendingComplete.set(item);
  }

  confirmComplete() {
    const item = this.pendingComplete();
    if (item) {
      this.items.set(this.items().map(i => i.id === item.id ? { ...i, status: 'Completed' } : i));
      this.snackBar.open('Maintenance request completed', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
    }
    this.pendingComplete.set(null);
  }
}
