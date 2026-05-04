import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-pay-points',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, PaginationComponent],
  templateUrl: './pay-points.component.html',
  styleUrl: './pay-points.component.css'
})
export class PayPointsComponent implements OnInit {
  payPoints: any[] = [];
  filteredPayPoints: any[] = [];
  loading = true;
  searchTerm = '';
  page = 1;
  limit = 25;

  view: 'list' | 'detail' = 'list';
  mode: 'create' | 'view' | 'edit' = 'view';
  activeTab = 'details';
  payPoint: any = {};
  currentIndex = -1;

  departments: any[] = [];
  linkedDepartments: any[] = [];
  selectedDepartmentId = '';

  constructor(private api: ApiService, private ui: UiService, public cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
    this.loadDepartments();
  }

  load(): void {
    this.loading = true;
    this.api.get<any[]>('/pay-points').subscribe({
      next: (data) => {
        this.payPoints = data || [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.ui.toast('error', 'Error', 'Failed to load pay points');
        this.cdr.detectChanges();
      }
    });
  }

  loadDepartments(): void {
    this.api.get<any[]>('/departments?limit=9999').subscribe({
      next: (data) => { this.departments = data || []; this.cdr.detectChanges(); },
      error: () => { this.departments = []; }
    });
  }

  applyFilter(): void {
    const s = this.searchTerm.toLowerCase();
    this.filteredPayPoints = s
      ? this.payPoints.filter(pp =>
          (pp.code || '').toLowerCase().includes(s) ||
          (pp.name || '').toLowerCase().includes(s) ||
          (pp.location || '').toLowerCase().includes(s) ||
          (pp.address || '').toLowerCase().includes(s))
      : [...this.payPoints];
    this.page = 1;
    this.cdr.detectChanges();
  }

  get activeCount(): number {
    return this.payPoints.filter(pp => pp.enabled).length;
  }

  get inactiveCount(): number {
    return this.payPoints.filter(pp => !pp.enabled).length;
  }

  get pagedPayPoints(): any[] {
    const start = (this.page - 1) * this.limit;
    return this.filteredPayPoints.slice(start, start + this.limit);
  }

  get isEditable(): boolean {
    return this.mode === 'create' || this.mode === 'edit';
  }

  get pageTitle(): string {
    if (this.mode === 'create') return 'Add New Pay Point';
    return this.payPoint.name || 'Pay Point';
  }

  get availableDepartments(): any[] {
    const linkedIds = new Set(this.linkedDepartments.map(l => l.department_id));
    return this.departments.filter(d => !linkedIds.has(d.id));
  }

  openCreate(): void {
    this.payPoint = { enabled: true };
    this.mode = 'create';
    this.view = 'detail';
    this.activeTab = 'details';
    this.linkedDepartments = [];
    this.selectedDepartmentId = '';
    this.cdr.detectChanges();
  }

  openDetail(item: any, idx?: number): void {
    this.api.get<any>(`/pay-points/${item.id}`).subscribe({
      next: (data) => {
        this.payPoint = { ...data };
        this.currentIndex = idx !== undefined ? idx : this.payPoints.findIndex(p => p.id === item.id);
        this.mode = 'view';
        this.view = 'detail';
        this.activeTab = 'details';
        this.loadLinkedDepartments();
        this.cdr.detectChanges();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to load pay point')
    });
  }

  goBack(): void {
    this.view = 'list';
    this.load();
    this.cdr.detectChanges();
  }

  enterEdit(): void {
    this.mode = 'edit';
    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    if (this.mode === 'create') {
      this.goBack();
    } else {
      this.openDetail(this.payPoint);
    }
  }

  editFromList(item: any): void {
    this.api.get<any>(`/pay-points/${item.id}`).subscribe({
      next: (data) => {
        this.payPoint = { ...data };
        this.currentIndex = this.payPoints.findIndex(p => p.id === item.id);
        this.mode = 'edit';
        this.view = 'detail';
        this.activeTab = 'details';
        this.loadLinkedDepartments();
        this.cdr.detectChanges();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to load pay point')
    });
  }

  navigatePrev(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.openDetail(this.payPoints[this.currentIndex], this.currentIndex);
    }
  }

  navigateNext(): void {
    if (this.currentIndex < this.payPoints.length - 1) {
      this.currentIndex++;
      this.openDetail(this.payPoints[this.currentIndex], this.currentIndex);
    }
  }

  switchToDepartments(): void {
    this.activeTab = 'departments';
    this.selectedDepartmentId = '';
    this.cdr.detectChanges();
  }

  save(): void {
    if (!this.payPoint.code || !this.payPoint.code.trim()) {
      this.ui.toast('error', 'Validation', 'Pay Point Code is required');
      return;
    }
    if (!this.payPoint.name || !this.payPoint.name.trim()) {
      this.ui.toast('error', 'Validation', 'Description is required');
      return;
    }

    const payload = {
      code: this.payPoint.code,
      name: this.payPoint.name,
      address: this.payPoint.address || null,
      location: this.payPoint.location || null,
      enabled: this.payPoint.enabled !== false
    };

    const request$ = this.mode === 'create'
      ? this.api.post<any>('/pay-points', payload)
      : this.api.put<any>(`/pay-points/${this.payPoint.id}`, payload);

    request$.subscribe({
      next: (data) => {
        this.ui.toast('success', 'Success', this.mode === 'create' ? 'Pay point created' : 'Pay point updated');
        this.payPoint = { ...data };
        this.mode = 'view';
        this.load();
        if (this.mode === 'view') this.loadLinkedDepartments();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        const msg = err?.error?.error || 'Failed to save pay point';
        this.ui.toast('error', 'Error', msg);
        this.cdr.detectChanges();
      }
    });
  }

  deleteFromList(item: any): void {
    if (!confirm(`Delete pay point "${item.name}"? This will also remove all linked departments.`)) return;
    this.api.delete(`/pay-points/${item.id}`).subscribe({
      next: () => {
        this.ui.toast('success', 'Deleted', 'Pay point removed');
        this.load();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to delete pay point')
    });
  }

  loadLinkedDepartments(): void {
    if (!this.payPoint.id) return;
    this.api.get<any[]>(`/pay-points/${this.payPoint.id}/departments`).subscribe({
      next: (data) => { this.linkedDepartments = data || []; this.cdr.detectChanges(); },
      error: () => { this.linkedDepartments = []; this.cdr.detectChanges(); }
    });
  }

  linkDepartment(): void {
    if (!this.selectedDepartmentId) return;
    this.api.post<any>(`/pay-points/${this.payPoint.id}/departments`, { department_id: +this.selectedDepartmentId }).subscribe({
      next: (data) => {
        this.linkedDepartments.push(data);
        this.selectedDepartmentId = '';
        this.ui.toast('success', 'Linked', 'Department linked to pay point');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        const msg = err?.error?.error || 'Failed to link department';
        this.ui.toast('error', 'Error', msg);
        this.cdr.detectChanges();
      }
    });
  }

  unlinkDepartment(link: any): void {
    if (!confirm(`Remove "${link.department_name}" from this pay point?`)) return;
    this.api.delete(`/pay-points/${this.payPoint.id}/departments/${link.id}`).subscribe({
      next: () => {
        this.linkedDepartments = this.linkedDepartments.filter(l => l.id !== link.id);
        this.ui.toast('success', 'Removed', 'Department unlinked');
        this.cdr.detectChanges();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to unlink department')
    });
  }
}
