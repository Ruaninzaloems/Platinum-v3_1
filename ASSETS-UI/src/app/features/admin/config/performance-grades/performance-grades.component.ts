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
  selector: 'app-performance-grades',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule],
  templateUrl: './performance-grades.component.html',
  styleUrls: ['./performance-grades.component.css']
})
export class PerformanceGradesComponent implements OnInit {
  items = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  formData = { performanceGradeDesc: '' };
  showImport = signal(false);
  importFile = signal<File | null>(null);
  importing = signal(false);
  importErrors = signal<any[]>([]);
  importSuccess = signal('');

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getPerformanceGrades().subscribe({
      next: function(this: PerformanceGradesComponent, data: any[]) { this.items.set(data); this.loading.set(false); }.bind(this),
      error: function(this: PerformanceGradesComponent) { this.loading.set(false); }.bind(this)
    });
  }

  openAdd(): void {
    this.formData = { performanceGradeDesc: '' };
    this.editingId.set(null);
    this.showForm.set(true);
  }

  openEdit(item: any): void {
    this.formData = { performanceGradeDesc: item.performanceGradeDesc };
    this.editingId.set(item.performanceGrade_ID);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  save(): void {
    const id = this.editingId();
    if (id) {
      this.api.updatePerformanceGrade(id, this.formData).subscribe({
        next: function(this: PerformanceGradesComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open('Performance grade updated', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: PerformanceGradesComponent, err: any) { this.snackBar.open(err.error?.error || 'Update failed', 'OK', { duration: 4000 }); }.bind(this)
      });
    } else {
      this.api.createPerformanceGrade(this.formData).subscribe({
        next: function(this: PerformanceGradesComponent) { this.showForm.set(false); this.loadData(); this.snackBar.open('Performance grade created', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: PerformanceGradesComponent, err: any) { this.snackBar.open(err.error?.error || 'Create failed', 'OK', { duration: 4000 }); }.bind(this)
      });
    }
  }

  confirmDelete(item: any): void {
    if (confirm('Are you sure you want to delete "' + item.performanceGradeDesc + '"?')) {
      this.api.deletePerformanceGrade(item.performanceGrade_ID).subscribe({
        next: function(this: PerformanceGradesComponent) { this.loadData(); this.snackBar.open('Performance grade deleted', 'OK', { duration: 3000 }); }.bind(this),
        error: function(this: PerformanceGradesComponent, err: any) { this.snackBar.open(err.error?.error || 'Delete failed', 'OK', { duration: 4000 }); }.bind(this)
      });
    }
  }

  openImport(): void {
    this.showImport.set(true);
    this.importFile.set(null);
    this.importErrors.set([]);
    this.importSuccess.set('');
  }

  closeImport(): void {
    this.showImport.set(false);
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.importFile.set(input.files[0]);
      this.importErrors.set([]);
      this.importSuccess.set('');
    }
  }

  doImport(): void {
    const file = this.importFile();
    if (!file) return;
    this.importing.set(true);
    this.importErrors.set([]);
    this.importSuccess.set('');
    this.api.importPerformanceGrades(file).subscribe({
      next: function(this: PerformanceGradesComponent, result: any) {
        this.importing.set(false);
        this.importSuccess.set('Successfully imported ' + result.imported + ' records');
        this.loadData();
      }.bind(this),
      error: function(this: PerformanceGradesComponent, err: any) {
        this.importing.set(false);
        if (err.error && err.error.errors) {
          this.importErrors.set(err.error.errors);
        } else {
          this.snackBar.open(err.error?.error || 'Import failed', 'OK', { duration: 4000 });
        }
      }.bind(this)
    });
  }

  downloadTemplate(): void {
    this.api.downloadPerformanceGradeTemplate().subscribe({
      next: function(blob: Blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'performance_grades_template.xlsx';
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }
}
