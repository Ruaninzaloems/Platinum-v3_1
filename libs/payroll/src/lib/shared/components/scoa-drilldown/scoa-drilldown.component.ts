import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

export interface ScoaItem {
  scoaId: number;
  scoaParentId: number;
  scoaCode: string;
  levelId: number;
  postingLevel: string;
  scoaDesc: string;
  scoaShortDesc: string;
}

export interface ScoaBreadcrumb {
  scoaId: number;
  parentId: number;
  label: string;
}

@Component({
  selector: 'app-scoa-drilldown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scoa-drilldown.component.html',
  styleUrl: './scoa-drilldown.component.css'
})
export class ScoaDrilldownComponent implements OnInit, OnChanges {
  @Input() finYear = '';
  @Input() value: string | number = '';
  @Input() meta: any = null;
  @Input() placeholder = '-- Select --';
  @Input() apiBase = '/gl/external/scoa-structure';
  @Output() valueChange = new EventEmitter<string>();
  @Output() metaChange = new EventEmitter<any>();
  @Output() itemSelected = new EventEmitter<ScoaItem>();

  breadcrumbs: ScoaBreadcrumb[] = [];
  currentOptions: ScoaItem[] = [];
  loading = false;
  dropdownValue = '';
  finalizedItem: ScoaItem | null = null;
  private lastEmittedValue = '';

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.value && this.finYear) {
      if (this.meta && this.meta.item) {
        this.restoreFromMeta();
      } else {
        this.resolveStoredValue();
      }
    } else if (this.finYear) {
      this.loadLevel(0);
    }
  }

  restoreFromMeta(): void {
    this.breadcrumbs = this.meta.breadcrumbs || [];
    this.finalizedItem = this.meta.item;
    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['finYear'] && !changes['finYear'].firstChange) {
      this.reset();
      if (this.finYear) {
        if (this.value) {
          this.resolveStoredValue();
        } else {
          this.loadLevel(0);
        }
      }
    }
    if (changes['value'] && !changes['value'].firstChange) {
      const newVal = changes['value'].currentValue;
      if (!newVal || newVal === '') {
        this.reset();
        if (this.finYear) {
          this.loadLevel(0);
        }
      } else if (String(newVal) === this.lastEmittedValue && this.finalizedItem) {
        this.lastEmittedValue = '';
      } else if (this.finYear) {
        this.reset();
        this.value = newVal;
        this.resolveStoredValue();
      }
    }
  }

  formatItem(item: ScoaItem): string {
    return `${item.scoaShortDesc} (${item.postingLevel}) ${item.scoaCode}`;
  }

  resolveStoredValue(): void {
    if (!this.value || !this.finYear) return;
    this.loading = true;
    this.cdr.detectChanges();
    this.api.get<any>(`${this.apiBase}/resolve`, { scoaId: this.value, finYear: this.finYear }).subscribe({
      next: (data) => {
        if (data && data.item) {
          this.breadcrumbs = data.breadcrumbs || [];
          this.finalizedItem = data.item;
          this.metaChange.emit({ item: data.item, breadcrumbs: this.breadcrumbs });
        }
        this.loading = false;
        if (!this.finalizedItem) {
          this.showUnresolvedFallback();
        } else {
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.loading = false;
        this.showUnresolvedFallback();
      }
    });
  }

  private showUnresolvedFallback(): void {
    if (this.value) {
      this.finalizedItem = {
        scoaId: Number(this.value),
        scoaParentId: 0,
        scoaCode: '',
        levelId: 0,
        postingLevel: 'Yes',
        scoaDesc: `SCOA ID: ${this.value}`,
        scoaShortDesc: `SCOA ID: ${this.value} (not yet resolved)`
      };
      this.cdr.detectChanges();
    } else {
      this.loadLevel(0);
    }
  }

  loadLevel(parentId: number): void {
    if (!this.finYear) return;
    this.loading = true;
    this.cdr.detectChanges();
    this.api.get<ScoaItem[]>(this.apiBase, { parentId, finYear: this.finYear }).subscribe({
      next: (data) => {
        this.currentOptions = data || [];
        this.dropdownValue = '';
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.currentOptions = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSelect(scoaIdStr: string): void {
    if (!scoaIdStr) return;
    const scoaId = Number(scoaIdStr);
    const item = this.currentOptions.find(o => o.scoaId === scoaId);
    if (!item) return;

    if (item.postingLevel === 'Yes') {
      this.finalizedItem = item;
      this.lastEmittedValue = String(item.scoaId);
      this.valueChange.emit(String(item.scoaId));
      this.metaChange.emit({ item, breadcrumbs: this.breadcrumbs });
      this.itemSelected.emit(item);
      this.cdr.detectChanges();
    } else {
      this.breadcrumbs.push({
        scoaId: item.scoaId,
        parentId: item.scoaParentId,
        label: item.scoaShortDesc
      });
      this.loadLevel(item.scoaId);
    }
  }

  onBreadcrumbClick(index: number): void {
    const crumb = this.breadcrumbs[index];
    this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
    this.finalizedItem = null;
    this.value = '';
    this.valueChange.emit('');
    this.loadLevel(crumb.scoaId);
  }

  resetToRoot(): void {
    this.reset();
    this.valueChange.emit('');
    this.metaChange.emit(null);
    if (this.finYear) {
      this.loadLevel(0);
    }
  }

  private reset(): void {
    this.breadcrumbs = [];
    this.currentOptions = [];
    this.dropdownValue = '';
    this.finalizedItem = null;
    this.value = '';
  }
}
