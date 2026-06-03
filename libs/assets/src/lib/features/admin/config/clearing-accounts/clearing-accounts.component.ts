import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../../core/api.service';

@Component({
  selector: 'app-clearing-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './clearing-accounts.component.html',
  styleUrls: ['./clearing-accounts.component.css']
})
export class ClearingAccountsComponent implements OnInit {
  items = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);

  projects = signal<any[]>([]);
  projectItems = signal<any[]>([]);
  projectItemsLoading = false;

  selectedProjectId: any = null;
  selectedPlanProjectItemId: any = null;

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadList();
    this.loadProjects();
  }

  loadList(): void {
    this.loading.set(true);
    this.api.getClearingAccounts().subscribe({
      next: function(this: ClearingAccountsComponent, data: any[]) { this.items.set(data); this.loading.set(false); }.bind(this),
      error: function(this: ClearingAccountsComponent) { this.loading.set(false); }.bind(this)
    });
  }

  loadProjects(): void {
    this.api.getPlanProjects().subscribe({
      next: function(this: ClearingAccountsComponent, data: any[]) { this.projects.set(data || []); }.bind(this),
      error: function() {}
    });
  }

  openAdd(): void {
    this.selectedProjectId = null;
    this.selectedPlanProjectItemId = null;
    this.projectItems.set([]);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.selectedProjectId = null;
    this.selectedPlanProjectItemId = null;
    this.projectItems.set([]);
  }

  onProjectChange(projectId: any): void {
    this.selectedProjectId = projectId;
    this.selectedPlanProjectItemId = null;
    this.projectItems.set([]);
    if (!projectId) return;
    this.projectItemsLoading = true;
    this.api.getPlanProjectItems(Number(projectId)).subscribe({
      next: function(this: ClearingAccountsComponent, data: any[]) { this.projectItems.set(data || []); this.projectItemsLoading = false; }.bind(this),
      error: function(this: ClearingAccountsComponent) { this.projectItemsLoading = false; }.bind(this)
    });
  }

  isFormValid(): boolean {
    return !!(this.selectedPlanProjectItemId);
  }

  save(): void {
    if (!this.isFormValid()) { this.snackBar.open('Please select a project item', 'OK', { duration: 3000 }); return; }
    this.saving.set(true);
    this.api.addClearingAccount(Number(this.selectedPlanProjectItemId)).subscribe({
      next: function(this: ClearingAccountsComponent) {
        this.saving.set(false);
        this.showForm.set(false);
        this.selectedProjectId = null;
        this.selectedPlanProjectItemId = null;
        this.projectItems.set([]);
        this.loadList();
        this.snackBar.open('Clearing account added', 'OK', { duration: 3000 });
      }.bind(this),
      error: function(this: ClearingAccountsComponent, err: any) {
        this.saving.set(false);
        this.snackBar.open(err.error?.error || 'Save failed', 'OK', { duration: 4000 });
      }.bind(this)
    });
  }

  confirmDelete(item: any): void {
    if (!confirm('Remove this clearing account entry?')) return;
    this.api.deleteClearingAccount(item.id).subscribe({
      next: function(this: ClearingAccountsComponent) { this.loadList(); this.snackBar.open('Removed', 'OK', { duration: 3000 }); }.bind(this),
      error: function(this: ClearingAccountsComponent, err: any) { this.snackBar.open(err.error?.error || 'Delete failed', 'OK', { duration: 4000 }); }.bind(this)
    });
  }
}
