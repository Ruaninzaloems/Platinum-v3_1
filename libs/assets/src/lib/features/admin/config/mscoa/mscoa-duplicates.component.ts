import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../../../core/api.service';

@Component({
  selector: 'app-mscoa-duplicates',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule],
  templateUrl: './mscoa-duplicates.component.html',
  styleUrls: ['./mscoa-config.component.css']
})
export class MscoaDuplicatesComponent implements OnInit {
  finYears = signal<string[]>([]);
  txnTypeDefs = signal<any[]>([]);
  results = signal<any[]>([]);
  loading = signal(false);
  searched = signal(false);
  deleting = signal<number | null>(null);
  exportingExcel = signal(false);

  filterFinYear = '';
  filterTransactionTypeId = '';
  includeDeptDiv = false;

  totalCount = computed(function(this: MscoaDuplicatesComponent) { return this.results().length; }.bind(this));

  groupCount = computed(function(this: MscoaDuplicatesComponent) {
    var seen: { [key: string]: boolean } = {};
    var count = 0;
    var items = this.results();
    for (var i = 0; i < items.length; i++) {
      var r = items[i];
      var key = (r.finYear || '') + '|' + (r.typeId || '') + '|' + (r.categoryId || '') + '|' + (r.subCategoryId || '') + '|' + (r.measurementTypeId || '') + '|' + (r.departmentId || '') + '|' + (r.divisionId || '');
      if (!seen[key]) { seen[key] = true; count++; }
    }
    return count;
  }.bind(this));

  constructor(private api: ApiService, private router: Router, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.api.getMscoaFinYears().subscribe({
      next: function(this: MscoaDuplicatesComponent, data: string[]) { this.finYears.set(data); }.bind(this),
      error: function() {}
    });
    this.api.getMscoaTransactionTypeDefs().subscribe({
      next: function(this: MscoaDuplicatesComponent, data: any[]) { this.txnTypeDefs.set(data); }.bind(this),
      error: function() {}
    });
  }

  search(): void {
    this.loading.set(true);
    this.searched.set(false);
    var params: any = { includeDeptDiv: this.includeDeptDiv };
    if (this.filterFinYear) params['finYear'] = this.filterFinYear;
    if (this.filterTransactionTypeId) params['transactionTypeId'] = this.filterTransactionTypeId;
    this.api.getMscoaDuplicates(params).subscribe({
      next: function(this: MscoaDuplicatesComponent, data: any[]) {
        this.results.set(data);
        this.loading.set(false);
        this.searched.set(true);
      }.bind(this),
      error: function(this: MscoaDuplicatesComponent) {
        this.loading.set(false);
        this.searched.set(true);
        this.snackBar.open('Failed to load duplicates', 'OK', { duration: 4000 });
      }.bind(this)
    });
  }

  clearFilter(): void {
    this.filterFinYear = '';
    this.filterTransactionTypeId = '';
    this.includeDeptDiv = false;
    this.results.set([]);
    this.searched.set(false);
  }

  confirmDelete(item: any): void {
    if (!confirm('Delete this mSCOA config row (ID ' + item.id + ')?\n\n' +
      item.finYear + ' | ' + (item.typeDesc || '—') + ' / ' + (item.categoryDesc || '—') + '\n\n' +
      'This will also delete all its transaction type mappings.')) return;

    this.deleting.set(item.id);
    this.api.deleteMscoa(item.id).subscribe({
      next: function(this: MscoaDuplicatesComponent) {
        this.deleting.set(null);
        this.snackBar.open('Row deleted. Re-running search...', 'OK', { duration: 2000 });
        this.search();
      }.bind(this),
      error: function(this: MscoaDuplicatesComponent, err: any) {
        this.deleting.set(null);
        this.snackBar.open(err.error?.error || 'Delete failed', 'OK', { duration: 4000 });
      }.bind(this)
    });
  }

  exportExcel(): void {
    this.exportingExcel.set(true);
    var params: any = { includeDeptDiv: this.includeDeptDiv };
    if (this.filterFinYear) params['finYear'] = this.filterFinYear;
    if (this.filterTransactionTypeId) params['transactionTypeId'] = this.filterTransactionTypeId;
    this.api.getMscoaDuplicatesExcel(params).subscribe({
      next: function(this: MscoaDuplicatesComponent, blob: Blob) {
        this.exportingExcel.set(false);
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'mscoa_duplicates.xlsx';
        a.click();
        URL.revokeObjectURL(url);
      }.bind(this),
      error: function(this: MscoaDuplicatesComponent) {
        this.exportingExcel.set(false);
        this.snackBar.open('Export failed', 'OK', { duration: 4000 });
      }.bind(this)
    });
  }

  exportCsv(): void {
    var rows = this.results();
    if (rows.length === 0) return;
    var headers = ['ID', 'Fin Year', 'Asset Type', 'Category', 'Sub Category', 'Measurement Type', 'Status', 'Department', 'Division', 'Count In Group'];
    var lines: string[] = [headers.join(',')];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var cols = [
        r.id,
        this.csvVal(r.finYear),
        this.csvVal(r.typeDesc),
        this.csvVal(r.categoryDesc),
        this.csvVal(r.subCategoryDesc),
        this.csvVal(r.measurementTypeName),
        this.csvVal(r.statusDesc),
        this.csvVal(r.departmentDesc),
        this.csvVal(r.divisionDesc),
        r.duplicateGroupCount
      ];
      lines.push(cols.join(','));
    }
    var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'mscoa_duplicates.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  private csvVal(v: any): string {
    if (v === null || v === undefined) return '';
    var s = String(v);
    if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  isDeleting(id: number): boolean {
    return this.deleting() === id;
  }

  backToSettings(): void {
    this.router.navigate(['/assets/config/mscoa']);
  }
}
