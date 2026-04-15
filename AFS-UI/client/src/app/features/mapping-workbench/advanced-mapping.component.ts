import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MappingWorkbenchService } from './mapping-workbench.service';

interface MappedRow {
  id: string;
  scoaItemCode: string;
  sortDesc: string;
  mscoaLabel: string;
  currentYearAmount: number;
  priorYearAmount: number;
  matchStatus: string;
  reviewStatus: string;
}

interface TreeNode {
  disclosureId: string;
  parentDisclosureId: string | null;
  lineLabel: string;
  lineCode: string;
  level: number;
  sortOrder: number;
  statementGroup: string;
  disclosureType: string;
  sourceClass: string;
  balance: number;
  pyBalance: number;
  budgetBalance: number;
  mappedCount: number;
  children: TreeNode[];
  isExpandable: boolean;
  expanded?: boolean;
  visible?: boolean;
  mappedRows?: MappedRow[];
  mappedRowsLoading?: boolean;
  mappedRowsLoaded?: boolean;
  showMappedRows?: boolean;
  mappedRowsPage?: number;
  mappedRowsTotal?: number;
  mappedRowsLimit?: number;
  mappedRowsSearchTerm?: string;
  noteHeadings?: Record<string, string>[];
}

interface FlatItem {
  type: 'disclosure' | 'mapped-row' | 'mapped-row-pagination' | 'mapped-row-header';
  node?: TreeNode;
  row?: MappedRow;
  parentNode?: TreeNode;
  indentLevel: number;
}

@Component({
  selector: 'app-advanced-mapping',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatCheckboxModule,
    MatChipsModule, MatProgressBarModule, MatSnackBarModule,
    MatTooltipModule, MatBadgeModule, MatDividerModule,
    MatSlideToggleModule, MatSelectModule, MatDialogModule,
    MatMenuModule,
  ],
  templateUrl: './advanced-mapping.component.html',
  styleUrls: ['./advanced-mapping.component.scss'],
})
export class AdvancedMappingComponent implements OnInit, OnChanges, OnDestroy {
  @Input() runId = '';
  @Input() runStatus = '';
  @Input() fullscreen = false;
  @Output() mappingApplied = new EventEmitter<void>();

  isNativeFullscreen = false;

  unmappedRows: any[] = [];
  unmappedTotal = 0;
  unmappedTotalUnfiltered = 0;
  unmappedLoading = false;
  unmappedSearch = '';
  hideZeroBalance = false;

  currentPage = 1;
  pageSize = 500;
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.unmappedTotal / this.pageSize));
  }

  treeRoots: TreeNode[] = [];
  flatItems: FlatItem[] = [];
  treeLoading = false;
  treeSearch = '';

  selectedRowIds = new Set<string>();
  selectedDisclosureId = '';
  selectedDisclosureLabel = '';

  selectedMappedRowIds = new Set<string>();
  selectedMappedRowParentNode: TreeNode | null = null;

  searchMatchedDisclosureIds = new Set<string>();
  private searchDebounceTimer: any = null;
  private searchVersion = 0;

  assigning = false;
  unmapping = false;
  assignReason = '';

  autoMapping = false;
  showCustomL3Dialog = false;
  customL3ParentId = '';
  customL3ParentLabel = '';
  customL3Label = '';
  customL3Code = '';
  addingCustomL3 = false;

  lastSavedAt: Date | null = null;
  saving = false;
  private autoSaveTimer: any = null;
  private readonly AUTO_SAVE_INTERVAL = 30 * 60 * 1000;

  leftPanelPercent = 45;
  isDragging = false;

  unmappedColWidths: { [key: string]: number } = {
    code: 160, desc: 0, cyAmount: 110, pyAmount: 110
  };
  treeColWidths: { [key: string]: number } = {
    label: 0, code: 80, cyBalance: 100, pyBalance: 100, mapped: 60
  };
  scoaColWidths: { [key: string]: number } = {
    code: 180, desc: 0, cyAmount: 100, pyAmount: 100
  };
  private colResizing = false;
  private colResizeTarget: 'unmapped' | 'tree' | 'scoa' = 'unmapped';
  private colResizeKey = '';
  private colResizeStartX = 0;
  private colResizeStartWidth = 0;
  private colMinWidths: { [key: string]: number } = {
    code: 80, desc: 60, cyAmount: 60, pyAmount: 60,
    label: 80, cyBalance: 60, pyBalance: 60, mapped: 40
  };

  get canAssign(): boolean {
    return this.selectedRowIds.size > 0
      && !!this.selectedDisclosureId
      && this.runStatus === 'draft';
  }

  get canUnmap(): boolean {
    return this.selectedMappedRowIds.size > 0
      && this.runStatus === 'draft';
  }

  get canRemap(): boolean {
    return this.selectedMappedRowIds.size > 0
      && !!this.selectedDisclosureId
      && this.runStatus === 'draft'
      && !!this.selectedMappedRowParentNode
      && this.selectedDisclosureId !== this.selectedMappedRowParentNode.disclosureId;
  }

  get isReadOnly(): boolean {
    return this.runStatus !== 'draft';
  }

  constructor(
    private workbenchService: MappingWorkbenchService,
    private snackBar: MatSnackBar,
    private elRef: ElementRef,
  ) {}

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.isNativeFullscreen = !!document.fullscreenElement;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.colResizing) {
      const delta = event.clientX - this.colResizeStartX;
      const newWidth = Math.max(
        this.colMinWidths[this.colResizeKey] || 40,
        this.colResizeStartWidth + delta
      );
      if (this.colResizeTarget === 'unmapped') {
        this.unmappedColWidths[this.colResizeKey] = newWidth;
      } else if (this.colResizeTarget === 'tree') {
        this.treeColWidths[this.colResizeKey] = newWidth;
      } else {
        this.scoaColWidths[this.colResizeKey] = newWidth;
      }
      return;
    }
    if (!this.isDragging) return;
    const container = this.elRef.nativeElement.querySelector('.split-panel') as HTMLElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const pct = (x / rect.width) * 100;
    this.leftPanelPercent = Math.max(25, Math.min(75, pct));
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (this.colResizing) {
      this.colResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    if (this.isDragging) {
      this.isDragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }

  startDragging(event: MouseEvent): void {
    event.preventDefault();
    this.isDragging = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  startColResize(event: MouseEvent, target: 'unmapped' | 'tree' | 'scoa', key: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.colResizing = true;
    this.colResizeTarget = target;
    this.colResizeKey = key;
    this.colResizeStartX = event.clientX;
    const widths = target === 'unmapped' ? this.unmappedColWidths
      : target === 'tree' ? this.treeColWidths : this.scoaColWidths;
    let startW = widths[key];
    if (!startW) {
      const handle = event.target as HTMLElement;
      const cell = handle.parentElement;
      startW = cell ? cell.getBoundingClientRect().width : 200;
    }
    this.colResizeStartWidth = startW;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  colStyle(target: 'unmapped' | 'tree' | 'scoa', key: string): { [klass: string]: string } {
    const widths = target === 'unmapped' ? this.unmappedColWidths
      : target === 'tree' ? this.treeColWidths : this.scoaColWidths;
    const w = widths[key];
    if (!w) return {};
    return { width: w + 'px', 'min-width': w + 'px', 'max-width': w + 'px', flex: '0 0 auto' };
  }

  ngOnInit(): void {
    if (this.runId) {
      this.loadData();
    }
    this.startAutoSave();
  }

  ngOnDestroy(): void {
    this.stopAutoSave();
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
    if (this.colResizing) {
      this.colResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }

  private startAutoSave(): void {
    this.stopAutoSave();
    this.autoSaveTimer = setInterval(() => {
      if (this.runId && this.runStatus === 'draft' && !this.saving) {
        this.refreshTreeQuietly();
      }
    }, this.AUTO_SAVE_INTERVAL);
  }

  private stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  private refreshTreeQuietly(): void {
    this.loadDisclosureTree(true);
  }

  saveProgress(): void {
    if (this.saving || !this.runId) return;
    this.saving = true;
    this.loadDisclosureTree(true);
    this.loadUnmappedRows();
    this.lastSavedAt = new Date();
    setTimeout(() => {
      this.saving = false;
    }, 2000);
  }

  get lastSavedLabel(): string {
    if (!this.lastSavedAt) return '';
    const now = new Date();
    const diffMs = now.getTime() - this.lastSavedAt.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 10) return 'Saved just now';
    if (diffSec < 60) return `Saved ${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    return `Saved ${diffMin}m ago`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['runId'] && !changes['runId'].firstChange) {
      this.resetState();
      this.loadData();
    }
  }

  private resetState(): void {
    this.selectedRowIds.clear();
    this.selectedMappedRowIds.clear();
    this.selectedMappedRowParentNode = null;
    this.selectedDisclosureId = '';
    this.selectedDisclosureLabel = '';
    this.unmappedSearch = '';
    this.treeSearch = '';
    this.currentPage = 1;
  }

  loadData(): void {
    this.loadUnmappedRows();
    this.loadDisclosureTree(true);
  }

  loadUnmappedRows(): void {
    if (!this.runId) return;
    this.unmappedLoading = true;
    this.workbenchService.getUnmappedRows(this.runId, {
      search: this.unmappedSearch || undefined,
      page: this.currentPage,
      limit: this.pageSize,
      hideZeroBalance: this.hideZeroBalance || undefined,
    }).subscribe({
      next: (res) => {
        this.unmappedRows = res.items;
        this.unmappedTotal = res.total;
        this.unmappedLoading = false;
      },
      error: () => {
        this.unmappedLoading = false;
        this.snackBar.open('Failed to load unmapped accounts', 'Dismiss', { duration: 4000 });
      },
    });

    if (this.hideZeroBalance) {
      this.workbenchService.getUnmappedRows(this.runId, {
        page: 1,
        limit: 1,
      }).subscribe({
        next: (res) => { this.unmappedTotalUnfiltered = res.total; },
      });
    } else {
      this.unmappedTotalUnfiltered = 0;
    }
  }

  loadDisclosureTree(preserveState = false): void {
    if (!this.runId) return;
    const savedState = preserveState ? this.captureTreeState(this.treeRoots) : new Map();
    this.treeLoading = true;
    this.workbenchService.getDisclosureTree(this.runId).subscribe({
      next: (roots) => {
        this.treeRoots = roots;
        this.initTreeState(this.treeRoots, savedState);
        this.rebuildFlatItems();
        this.treeLoading = false;
      },
      error: () => {
        this.treeLoading = false;
        this.snackBar.open('Failed to load disclosure tree', 'Dismiss', { duration: 4000 });
      },
    });
  }

  private captureTreeState(nodes: TreeNode[]): Map<string, { expanded: boolean; showMappedRows: boolean }> {
    const state = new Map<string, { expanded: boolean; showMappedRows: boolean }>();
    const walk = (list: TreeNode[]) => {
      for (const n of list) {
        if (n.expanded || n.showMappedRows) {
          state.set(n.disclosureId, { expanded: !!n.expanded, showMappedRows: !!n.showMappedRows });
        }
        if (n.children?.length) walk(n.children);
      }
    };
    walk(nodes);
    return state;
  }

  private initTreeState(nodes: TreeNode[], savedState: Map<string, { expanded: boolean; showMappedRows: boolean }>): void {
    for (const node of nodes) {
      const prev = savedState.get(node.disclosureId);
      node.expanded = prev?.expanded ?? false;
      node.visible = true;
      node.mappedRows = [];
      node.mappedRowsLoading = false;
      node.mappedRowsLoaded = false;
      node.showMappedRows = prev?.showMappedRows ?? false;
      node.mappedRowsSearchTerm = '';
      if (node.children?.length) {
        this.initTreeState(node.children, savedState);
      }
    }
  }

  private rebuildFlatItems(): void {
    this.flatItems = [];
    const q = this.treeSearch ? this.treeSearch.toLowerCase() : '';
    const walk = (nodes: TreeNode[], parentVisible: boolean) => {
      for (const node of nodes) {
        node.visible = parentVisible;
        if (parentVisible) {
          if (q) {
            const disclosureMatch = node.lineLabel.toLowerCase().includes(q)
              || node.lineCode?.toLowerCase().includes(q)
              || node.statementGroup?.toLowerCase().includes(q);
            const hasMappedMatch = this.hasMatchingMappedRow(node, q);
            const serverMatch = this.searchMatchedDisclosureIds.has(node.disclosureId);
            if (!disclosureMatch && !hasMappedMatch && !serverMatch && !this.hasMatchingDescendant(node)) {
              continue;
            }
          }
          this.flatItems.push({ type: 'disclosure', node, indentLevel: node.level });

          if (node.showMappedRows && node.mappedRows?.length) {
            const serverFilteredForCurrentQuery = node.mappedRowsSearchTerm === q && !!q;
            const visibleRows = (q && !serverFilteredForCurrentQuery)
              ? node.mappedRows.filter(r => this.mappedRowMatchesSearch(r, q))
              : node.mappedRows;

            if (visibleRows.length > 0) {
              this.flatItems.push({
                type: 'mapped-row-header',
                parentNode: node,
                indentLevel: node.level + 1,
              });
              for (const row of visibleRows) {
                this.flatItems.push({
                  type: 'mapped-row',
                  row,
                  parentNode: node,
                  indentLevel: node.level + 1,
                });
              }
            }
            const totalPages = Math.ceil((node.mappedRowsTotal || 0) / (node.mappedRowsLimit || 500));
            if (totalPages > 1) {
              this.flatItems.push({
                type: 'mapped-row-pagination',
                parentNode: node,
                indentLevel: node.level + 1,
              });
            }
          }
        }
        if (node.children?.length && node.expanded) {
          walk(node.children, parentVisible);
        }
      }
    };
    walk(this.treeRoots, true);
  }

  private hasMatchingDescendant(node: TreeNode): boolean {
    if (!this.treeSearch) return true;
    const q = this.treeSearch.toLowerCase();
    const check = (n: TreeNode): boolean => {
      if (n.lineLabel.toLowerCase().includes(q) || n.lineCode?.toLowerCase().includes(q)) return true;
      if (this.hasMatchingMappedRow(n, q)) return true;
      if (this.searchMatchedDisclosureIds.has(n.disclosureId)) return true;
      return n.children?.some(check) || false;
    };
    return node.children?.some(check)
      || this.hasMatchingMappedRow(node, q)
      || this.searchMatchedDisclosureIds.has(node.disclosureId)
      || false;
  }

  private hasMatchingMappedRow(node: TreeNode, q: string): boolean {
    if (!node.mappedRows?.length) return false;
    return node.mappedRows.some(r => this.mappedRowMatchesSearch(r, q));
  }

  private mappedRowMatchesSearch(row: MappedRow, q: string): boolean {
    return row.scoaItemCode?.toLowerCase().includes(q)
      || row.sortDesc?.toLowerCase().includes(q)
      || row.mscoaLabel?.toLowerCase().includes(q);
  }

  toggleTreeNode(node: TreeNode): void {
    if (node.isExpandable) {
      node.expanded = !node.expanded;
      this.rebuildFlatItems();
      return;
    }
    if (node.mappedCount > 0) {
      this.toggleMappedRowsInternal(node);
    }
  }

  private toggleMappedRowsInternal(node: TreeNode): void {
    if (node.mappedCount === 0) return;

    const activeSearch = this.treeSearch && this.treeSearch.length >= 2 ? this.treeSearch.toLowerCase() : '';
    const currentNodeSearch = node.mappedRowsSearchTerm || '';

    if (node.showMappedRows && currentNodeSearch === activeSearch) {
      node.showMappedRows = false;
      this.rebuildFlatItems();
      return;
    }

    if (node.mappedRowsLoaded && currentNodeSearch === activeSearch) {
      node.showMappedRows = true;
      this.rebuildFlatItems();
      return;
    }

    node.mappedRowsLoading = true;
    node.mappedRowsPage = 1;
    node.mappedRowsLimit = 500;
    node.mappedRows = [];
    this.rebuildFlatItems();
    this.loadMappedRowsPage(node, activeSearch || undefined);
  }

  toggleMappedRows(node: TreeNode, event: Event): void {
    event.stopPropagation();
    this.toggleMappedRowsInternal(node);
  }

  private loadMappedRowsPage(node: TreeNode, search?: string): void {
    const page = node.mappedRowsPage || 1;
    const limit = node.mappedRowsLimit || 500;
    const requestVersion = this.searchVersion;
    this.workbenchService.getDisclosureMappedRows(this.runId, node.disclosureId, page, limit, search).subscribe({
      next: (res) => {
        if (search && requestVersion !== this.searchVersion) {
          node.mappedRowsLoading = false;
          this.rebuildFlatItems();
          return;
        }
        node.mappedRows = res.items;
        node.mappedRowsTotal = res.total;
        node.mappedRowsLoaded = !search;
        node.mappedRowsLoading = false;
        node.showMappedRows = true;
        node.mappedRowsSearchTerm = search ? search.toLowerCase() : '';
        this.rebuildFlatItems();
        if (res.total === 0 && node.mappedCount > 0 && !search) {
          this.snackBar.open(
            `Expected ${node.mappedCount} mapped rows but none were found. The mapping data may need to be refreshed.`,
            'Dismiss', { duration: 6000 },
          );
        }
      },
      error: (err) => {
        node.mappedRowsLoading = false;
        this.rebuildFlatItems();
        const detail = err?.error?.message || 'Failed to load mapped SCOA items';
        this.snackBar.open(detail, 'Dismiss', { duration: 4000 });
      },
    });
  }

  loadMappedRowsPageNav(node: TreeNode, page: number): void {
    node.mappedRowsPage = page;
    node.mappedRowsLoading = true;
    this.rebuildFlatItems();
    const search = node.mappedRowsSearchTerm || undefined;
    this.loadMappedRowsPage(node, search);
  }

  mappedRowsTotalPages(node: TreeNode): number {
    return Math.ceil((node.mappedRowsTotal || 0) / (node.mappedRowsLimit || 500));
  }

  expandAll(): void {
    const setExpanded = (nodes: TreeNode[], val: boolean) => {
      for (const n of nodes) {
        if (n.isExpandable) n.expanded = val;
        if (n.children?.length) setExpanded(n.children, val);
      }
    };
    setExpanded(this.treeRoots, true);
    this.rebuildFlatItems();
  }

  collapseAll(): void {
    const setAll = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        if (n.isExpandable) n.expanded = false;
        n.showMappedRows = false;
        if (n.children?.length) setAll(n.children);
      }
    };
    setAll(this.treeRoots);
    this.rebuildFlatItems();
  }

  onTreeSearchChange(): void {
    if (this.treeSearch && this.treeSearch.length >= 2) {
      this.expandAll();
      this.autoExpandMatchingMappedRows(this.treeRoots);
      this.triggerServerMappedRowSearch();
    } else {
      this.searchMatchedDisclosureIds.clear();
      ++this.searchVersion;
      if (this.treeSearch) {
        this.expandAll();
      }
    }
    this.rebuildFlatItems();
  }

  private triggerServerMappedRowSearch(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    const q = this.treeSearch;
    if (!q || q.length < 2 || !this.runId) return;

    const version = ++this.searchVersion;
    this.searchDebounceTimer = setTimeout(() => {
      this.workbenchService.searchMappedRows(this.runId, q).subscribe({
        next: (res) => {
          if (version !== this.searchVersion) return;
          this.searchMatchedDisclosureIds = new Set(res.disclosureIds);
          this.loadAndExpandServerMatches(this.treeRoots);
          this.rebuildFlatItems();
        },
      });
    }, 400);
  }

  private loadAndExpandServerMatches(nodes: TreeNode[]): void {
    const searchTerm = this.treeSearch ? this.treeSearch.toLowerCase() : '';
    for (const node of nodes) {
      if (this.searchMatchedDisclosureIds.has(node.disclosureId)) {
        const currentSearchTerm = node.mappedRowsSearchTerm || '';
        if (currentSearchTerm !== searchTerm && !node.mappedRowsLoading) {
          node.mappedRowsLoading = true;
          node.mappedRowsPage = 1;
          node.mappedRowsLimit = 500;
          node.mappedRows = [];
          this.loadMappedRowsPage(node, searchTerm);
        } else if (node.mappedRows?.length) {
          node.showMappedRows = true;
        }
      }
      if (node.children?.length) {
        this.loadAndExpandServerMatches(node.children);
      }
    }
  }

  private autoExpandMatchingMappedRows(nodes: TreeNode[]): void {
    const q = this.treeSearch?.toLowerCase();
    if (!q) return;
    for (const node of nodes) {
      if (node.mappedRowsLoaded && node.mappedRows?.length) {
        if (this.hasMatchingMappedRow(node, q)) {
          node.showMappedRows = true;
        }
      }
      if (node.children?.length) {
        this.autoExpandMatchingMappedRows(node.children);
      }
    }
  }

  clearUnmappedSearch(): void {
    this.unmappedSearch = '';
    this.currentPage = 1;
    this.loadUnmappedRows();
  }

  clearTreeSearch(): void {
    this.treeSearch = '';
    this.searchMatchedDisclosureIds.clear();
    ++this.searchVersion;
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
    this.clearSearchTermsOnNodes(this.treeRoots);
    this.collapseAll();
  }

  private clearSearchTermsOnNodes(nodes: TreeNode[]): void {
    for (const node of nodes) {
      if (node.mappedRowsSearchTerm) {
        node.mappedRowsSearchTerm = '';
        node.mappedRowsLoaded = false;
        node.mappedRows = [];
        node.showMappedRows = false;
      }
      if (node.children?.length) {
        this.clearSearchTermsOnNodes(node.children);
      }
    }
  }

  onUnmappedSearchChange(): void {
    this.currentPage = 1;
    this.loadUnmappedRows();
  }

  onHideZeroBalanceChange(): void {
    this.currentPage = 1;
    this.loadUnmappedRows();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadUnmappedRows();
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    if (end - start < 4) {
      if (start === 1) end = Math.min(total, start + 4);
      else start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  toggleRowSelection(rowId: string): void {
    if (this.selectedMappedRowIds.size > 0) {
      this.selectedMappedRowIds.clear();
      this.selectedMappedRowParentNode = null;
    }

    if (this.selectedRowIds.has(rowId)) {
      this.selectedRowIds.delete(rowId);
    } else {
      this.selectedRowIds.add(rowId);
    }
  }

  isRowSelected(rowId: string): boolean {
    return this.selectedRowIds.has(rowId);
  }

  private get currentPageSelectedCount(): number {
    let count = 0;
    for (const row of this.unmappedRows) {
      if (this.selectedRowIds.has(row.id)) count++;
    }
    return count;
  }

  selectAllRows(): void {
    if (this.selectedMappedRowIds.size > 0) {
      this.selectedMappedRowIds.clear();
      this.selectedMappedRowParentNode = null;
    }

    const pageCount = this.currentPageSelectedCount;
    if (pageCount === this.unmappedRows.length) {
      for (const row of this.unmappedRows) {
        this.selectedRowIds.delete(row.id);
      }
    } else {
      for (const row of this.unmappedRows) {
        this.selectedRowIds.add(row.id);
      }
      if (this.unmappedTotal > this.unmappedRows.length) {
        this.snackBar.open(
          `Selected ${this.unmappedRows.length} items on this page. There are ${this.unmappedTotal} total across ${this.totalPages} pages.`,
          'OK', { duration: 6000 },
        );
      }
    }
  }

  get allRowsSelected(): boolean {
    return this.unmappedRows.length > 0 && this.currentPageSelectedCount === this.unmappedRows.length;
  }

  get someRowsSelected(): boolean {
    const pageSelected = this.currentPageSelectedCount;
    return pageSelected > 0 && pageSelected < this.unmappedRows.length;
  }

  onDisclosureRowClick(node: TreeNode): void {
    this.selectDisclosureNode(node);
    if (!node.isExpandable && node.mappedCount > 0) {
      this.toggleMappedRowsInternal(node);
    }
  }

  selectDisclosureNode(node: TreeNode): void {
    if (this.isReadOnly) return;
    this.selectedDisclosureId = node.disclosureId;
    this.selectedDisclosureLabel = node.lineLabel;
  }

  isDisclosureSelected(node: TreeNode): boolean {
    return this.selectedDisclosureId === node.disclosureId;
  }

  assignMapping(): void {
    if (!this.canAssign || this.assigning) return;
    this.assigning = true;
    this.workbenchService.assignMapping(this.runId, {
      rowIds: Array.from(this.selectedRowIds),
      targetDisclosureId: this.selectedDisclosureId,
      reason: this.assignReason || 'Manual assignment via Mapping Studio',
    }).subscribe({
      next: () => {
        this.snackBar.open(
          `Mapped ${this.selectedRowIds.size} account(s) to "${this.selectedDisclosureLabel}"`,
          'OK', { duration: 4000 },
        );
        this.selectedRowIds.clear();
        this.selectedDisclosureId = '';
        this.selectedDisclosureLabel = '';
        this.assignReason = '';
        this.assigning = false;
        this.lastSavedAt = new Date();
        this.loadData();
        this.mappingApplied.emit();
      },
      error: (err: any) => {
        this.assigning = false;
        const msg = err?.error?.message || 'Failed to assign mapping';
        this.snackBar.open(msg, 'Dismiss', { duration: 5000 });
      },
    });
  }

  openFullscreen(): void {
    const el = this.elRef.nativeElement as HTMLElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen();
    }
  }

  exitFullscreen(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    }
  }

  clearSelection(): void {
    this.selectedRowIds.clear();
    this.selectedMappedRowIds.clear();
    this.selectedMappedRowParentNode = null;
    this.selectedDisclosureId = '';
    this.selectedDisclosureLabel = '';
  }

  toggleMappedRowSelection(row: MappedRow, parentNode: TreeNode): void {
    if (this.isReadOnly) return;
    if (this.selectedMappedRowParentNode && this.selectedMappedRowParentNode.disclosureId !== parentNode.disclosureId) {
      this.selectedMappedRowIds.clear();
    }
    this.selectedMappedRowParentNode = parentNode;

    if (this.selectedRowIds.size > 0) {
      this.selectedRowIds.clear();
    }

    if (this.selectedMappedRowIds.has(row.id)) {
      this.selectedMappedRowIds.delete(row.id);
      if (this.selectedMappedRowIds.size === 0) {
        this.selectedMappedRowParentNode = null;
      }
    } else {
      this.selectedMappedRowIds.add(row.id);
    }
  }

  isMappedRowSelected(rowId: string): boolean {
    return this.selectedMappedRowIds.has(rowId);
  }

  selectAllMappedRows(node: TreeNode): void {
    if (this.isReadOnly || !node.mappedRows?.length) return;

    if (this.selectedRowIds.size > 0) {
      this.selectedRowIds.clear();
    }

    if (this.selectedMappedRowParentNode && this.selectedMappedRowParentNode.disclosureId !== node.disclosureId) {
      this.selectedMappedRowIds.clear();
    }
    this.selectedMappedRowParentNode = node;

    const q = this.treeSearch ? this.treeSearch.toLowerCase() : '';
    const visibleRows = q ? node.mappedRows.filter(r => this.mappedRowMatchesSearch(r, q)) : node.mappedRows;

    const allSelected = this.allMappedRowsSelectedForNode(node);
    if (allSelected) {
      for (const row of visibleRows) {
        this.selectedMappedRowIds.delete(row.id);
      }
      if (this.selectedMappedRowIds.size === 0) {
        this.selectedMappedRowParentNode = null;
      }
    } else {
      for (const row of visibleRows) {
        this.selectedMappedRowIds.add(row.id);
      }
      const totalPages = Math.ceil((node.mappedRowsTotal || 0) / (node.mappedRowsLimit || 500));
      if (totalPages > 1) {
        this.snackBar.open(
          `Selected ${visibleRows.length} items on this page. There are ${node.mappedRowsTotal} total across ${totalPages} pages.`,
          'OK', { duration: 6000 },
        );
      }
    }
  }

  allMappedRowsSelectedForNode(node: TreeNode): boolean {
    if (!node.mappedRows?.length) return false;
    const q = this.treeSearch ? this.treeSearch.toLowerCase() : '';
    const visibleRows = q ? node.mappedRows.filter(r => this.mappedRowMatchesSearch(r, q)) : node.mappedRows;
    return visibleRows.length > 0 && visibleRows.every(r => this.selectedMappedRowIds.has(r.id));
  }

  someMappedRowsSelectedForNode(node: TreeNode): boolean {
    if (!node.mappedRows?.length) return false;
    const q = this.treeSearch ? this.treeSearch.toLowerCase() : '';
    const visibleRows = q ? node.mappedRows.filter(r => this.mappedRowMatchesSearch(r, q)) : node.mappedRows;
    const selectedCount = visibleRows.filter(r => this.selectedMappedRowIds.has(r.id)).length;
    return selectedCount > 0 && selectedCount < visibleRows.length;
  }

  unmapSelection(): void {
    if (!this.canUnmap || this.unmapping) return;
    this.unmapping = true;
    this.workbenchService.unmapRows(this.runId, {
      rowIds: Array.from(this.selectedMappedRowIds),
      reason: this.assignReason || 'Unmapped via Mapping Studio',
    }).subscribe({
      next: (res) => {
        this.snackBar.open(
          `Unmapped ${res.unmappedCount} account(s)`,
          'OK', { duration: 4000 },
        );
        this.selectedMappedRowIds.clear();
        this.selectedMappedRowParentNode = null;
        this.selectedDisclosureId = '';
        this.selectedDisclosureLabel = '';
        this.assignReason = '';
        this.unmapping = false;
        this.lastSavedAt = new Date();
        this.loadData();
        this.mappingApplied.emit();
      },
      error: (err: any) => {
        this.unmapping = false;
        const msg = err?.error?.message || 'Failed to unmap rows';
        this.snackBar.open(msg, 'Dismiss', { duration: 5000 });
      },
    });
  }

  remapSelection(): void {
    if (!this.canRemap || this.assigning) return;
    this.assigning = true;
    this.workbenchService.assignMapping(this.runId, {
      rowIds: Array.from(this.selectedMappedRowIds),
      targetDisclosureId: this.selectedDisclosureId,
      reason: this.assignReason || 'Remapped via Mapping Studio',
    }).subscribe({
      next: () => {
        this.snackBar.open(
          `Remapped ${this.selectedMappedRowIds.size} account(s) to "${this.selectedDisclosureLabel}"`,
          'OK', { duration: 4000 },
        );
        this.selectedMappedRowIds.clear();
        this.selectedMappedRowParentNode = null;
        this.selectedDisclosureId = '';
        this.selectedDisclosureLabel = '';
        this.assignReason = '';
        this.assigning = false;
        this.lastSavedAt = new Date();
        this.loadData();
        this.mappingApplied.emit();
      },
      error: (err: any) => {
        this.assigning = false;
        const msg = err?.error?.message || 'Failed to remap rows';
        this.snackBar.open(msg, 'Dismiss', { duration: 5000 });
      },
    });
  }

  autoMapFromSixNine(scopeDisclosureId?: string): void {
    if (this.autoMapping || this.isReadOnly) return;

    if (!scopeDisclosureId) {
      const proceed = confirm(
        'Auto-Map from 6.9 will apply to the entire trial balance.\n\n' +
        'Any existing auto-mapped entries will be overridden.\n' +
        'Manual mappings will be preserved.\n\n' +
        'To map only a specific disclosure, right-click or use the auto-map button on individual tree items.\n\n' +
        'Continue with full auto-map?'
      );
      if (!proceed) return;
    }

    this.autoMapping = true;
    const cleanId = scopeDisclosureId?.includes('__') ? scopeDisclosureId.split('__')[0] : scopeDisclosureId;
    this.workbenchService.autoMapFromSixNine(this.runId, cleanId).subscribe({
      next: (res) => {
        this.autoMapping = false;
        const scope = res.scoped ? ' (scoped)' : '';
        const msg = `Auto-map complete${scope}: ${res.mapped} mapped, ${res.skipped} skipped`;
        this.snackBar.open(msg, 'OK', { duration: 6000 });
        if (res.mapped > 0) {
          this.lastSavedAt = new Date();
          this.loadData();
          this.mappingApplied.emit();
        }
      },
      error: (err: any) => {
        this.autoMapping = false;
        const msg = err?.error?.message || 'Auto-map failed';
        this.snackBar.open(msg, 'Dismiss', { duration: 5000 });
      },
    });
  }

  openCustomL3Dialog(node: TreeNode): void {
    if (node.level < 2) {
      this.snackBar.open('Custom items cannot be added under root-level nodes', 'OK', { duration: 4000 });
      return;
    }
    this.customL3ParentId = node.disclosureId;
    this.customL3ParentLabel = node.lineLabel;
    this.customL3Label = '';
    this.customL3Code = '';
    this.showCustomL3Dialog = true;
  }

  cancelCustomL3(): void {
    this.showCustomL3Dialog = false;
    this.customL3ParentId = '';
    this.customL3ParentLabel = '';
    this.customL3Label = '';
    this.customL3Code = '';
  }

  addCustomL3(): void {
    if (this.addingCustomL3 || !this.customL3Label.trim()) return;
    this.addingCustomL3 = true;
    this.workbenchService.addCustomL3Disclosure({
      parentDisclosureId: this.customL3ParentId,
      lineLabel: this.customL3Label.trim(),
      lineCode: this.customL3Code.trim() || undefined,
    }).subscribe({
      next: (res) => {
        this.addingCustomL3 = false;
        this.showCustomL3Dialog = false;
        this.snackBar.open(`Custom disclosure "${res.lineLabel}" added`, 'OK', { duration: 4000 });
        this.loadDisclosureTree();
      },
      error: (err: any) => {
        this.addingCustomL3 = false;
        const msg = err?.error?.message || 'Failed to add custom disclosure';
        this.snackBar.open(msg, 'Dismiss', { duration: 5000 });
      },
    });
  }

  formatAmount(val: number | null | undefined): string {
    if (val == null) return '—';
    return val.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getIndentPx(level: number): string {
    return (level * 20) + 'px';
  }
}
