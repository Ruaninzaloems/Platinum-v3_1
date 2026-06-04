import { Component, forwardRef, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-employee-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EmployeeSelectComponent),
      multi: true
    }
  ],
  template: `
    <div style="display:flex;flex-direction:column;gap:4px">
      <input
        type="text"
        [value]="searchTerm"
        (input)="onSearchInput($any($event.target).value)"
        (focus)="ensureLoaded()"
        placeholder="Search employees..."
        style="padding:5px 8px;border:1px solid #cbd5e1;border-radius:4px;font-size:12px;width:100%;box-sizing:border-box;color:#374151"
      >
      <select
        [class]="selectClass"
        [ngModel]="value"
        (ngModelChange)="onValueChange($event)"
        [style]="selectStyle"
        (mousedown)="ensureLoaded()"
      >
        <option [ngValue]="null">{{placeholder}}</option>
        @if (hasPreselected) {
          <option [ngValue]="preselectedId" style="font-style:italic;color:#6b7280">
            {{preselectedLabel}}
          </option>
        }
        @for (e of employees; track e.employeeId) {
          <option [ngValue]="e.employeeId">{{e.surname}}, {{e.firstName}}</option>
        }
      </select>
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#6b7280;min-height:18px">
        @if (hasLoaded) {
          <span>Showing {{employees.length}} of {{totalCount}}</span>
          @if (hasMore) {
            <button
              type="button"
              (click)="loadMore()"
              [disabled]="loading"
              style="font-size:11px;color:#2563eb;background:none;border:none;cursor:pointer;padding:0;text-decoration:underline"
            >{{loading ? 'Loading...' : 'Load more'}}</button>
          }
        }
        @if (loading && employees.length === 0) {
          <span style="color:#9ca3af">Loading...</span>
        }
      </div>
    </div>
  `
})
export class EmployeeSelectComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() placeholder = '-- Select Employee --';
  @Input() selectClass = '';
  @Input() selectStyle = '';
  @Output() selectionChange = new EventEmitter<any>();

  value: any = null;
  employees: any[] = [];
  totalCount = 0;
  currentPage = 1;
  pageSize = 50;
  searchTerm = '';
  loading = false;
  hasLoaded = false;
  hasPreselected = false;
  preselectedId: any = null;
  preselectedLabel = '';

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private onChange: (v: any) => void = function() {};
  private onTouched: () => void = function() {};

  constructor(private api: ApiService) {}

  ngOnInit() {
    var self = this;
    self.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(self.destroy$)
    ).subscribe(function(term: string) {
      self.searchTerm = term;
      self.currentPage = 1;
      self.employees = [];
      self.hasLoaded = false;
      self.loadPage(1);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ensureLoaded() {
    if (!this.hasLoaded && !this.loading) {
      this.loadPage(1);
    }
  }

  writeValue(v: any) {
    var prev = this.value;
    this.value = (v != null && v !== 0 && v !== '') ? v : null;
    if (this.value && this.value !== prev) {
      var found = this.employees.find(function(e: any) { return e.employeeId == v; });
      if (!found) {
        this.hasPreselected = true;
        this.preselectedId = this.value;
        this.preselectedLabel = 'Employee #' + this.value + ' (search to change)';
      } else {
        this.hasPreselected = false;
      }
    }
    if (!this.value) {
      this.hasPreselected = false;
    }
  }

  registerOnChange(fn: any) { this.onChange = fn; }
  registerOnTouched(fn: any) { this.onTouched = fn; }

  onSearchInput(term: string) {
    this.searchSubject.next(term);
  }

  loadPage(page: number) {
    var self = this;
    self.loading = true;
    self.api.getEmployeesPage({ page: page, pageSize: self.pageSize, search: self.searchTerm }).subscribe({
      next: function(res: any) {
        var items: any[] = [];
        var count = 0;
        if (res && Array.isArray(res.items)) {
          items = res.items;
          count = res.totalCount || 0;
        } else if (Array.isArray(res)) {
          items = res;
          count = res.length;
        }
        if (page === 1) {
          self.employees = items;
        } else {
          self.employees = self.employees.concat(items);
        }
        self.totalCount = count;
        self.currentPage = page;
        self.loading = false;
        self.hasLoaded = true;
        if (self.value) {
          var found = self.employees.find(function(e: any) { return e.employeeId == self.value; });
          if (found) {
            self.hasPreselected = false;
          } else {
            self.hasPreselected = true;
            self.preselectedId = self.value;
            self.preselectedLabel = 'Employee #' + self.value + ' (search to change)';
          }
        }
      },
      error: function() {
        self.loading = false;
        self.hasLoaded = true;
      }
    });
  }

  loadMore() {
    this.loadPage(this.currentPage + 1);
  }

  get hasMore() {
    return this.employees.length < this.totalCount;
  }

  onValueChange(val: any) {
    var numVal = (val != null && val !== '' && val !== 'null') ? Number(val) : null;
    if (numVal === 0) numVal = null;
    this.value = numVal;
    if (numVal) {
      this.hasPreselected = false;
    }
    this.onChange(this.value);
    this.onTouched();
    var emp = numVal ? this.employees.find(function(e: any) { return e.employeeId == numVal; }) : null;
    if (!emp && numVal && this.hasPreselected) {
      emp = { employeeId: this.preselectedId };
    }
    this.selectionChange.emit(emp || null);
  }
}
