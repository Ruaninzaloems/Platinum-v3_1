import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../core/services/api.service';
import {
  MscoaChartVersion,
  MscoaChartItem,
  MscoaGrapMapping,
  MscoaSegmentInfo,
  MscoaPaginatedResult,
  MscoaVersionComparison,
} from '../../core/models/interfaces';

interface SegmentDetail {
  code: string;
  name: string;
  scoaFile: string;
  statementType: string | null;
  description: string;
}

interface GrapCategory {
  category: string;
  statementType: string;
  count: string;
}

interface GrapReportingItem {
  category: string;
  reportingItem: string;
  count: string;
}

@Component({
  selector: 'app-mscoa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTabsModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatExpansionModule,
    MatDividerModule,
  ],
  templateUrl: './mscoa.component.html',
  styleUrl: './mscoa.component.css',
})
export class MscoaComponent implements OnInit {
  currentVersion = signal<MscoaChartVersion | null>(null);
  selectedVersion = signal<MscoaChartVersion | null>(null);
  selectedVersionId = signal<string>('');
  versions = signal<MscoaChartVersion[]>([]);
  chartItems = signal<MscoaChartItem[]>([]);
  chartTotal = signal(0);
  grapItems = signal<MscoaGrapMapping[]>([]);
  grapTotal = signal(0);
  segmentStats = signal<(SegmentDetail & { count?: number })[]>([]);
  allSegmentDetails = signal<SegmentDetail[]>([]);
  selectedSegment = signal('');
  loading = signal(false);
  comparison = signal<MscoaVersionComparison | null>(null);
  comparisonLoading = signal(false);
  comparisonError = signal<string>('');

  searchTerm = '';
  filterSegment = '';
  filterPostingLevel = '';
  grapSearchTerm = '';
  filterCategory = '';
  filterStatementType = '';
  activeTab = 0;
  chartPageSize = 100;
  chartPage = 1;
  grapPageSize = 100;
  grapPage = 1;
  compareVersion1 = '';
  compareVersion2 = '';

  chartColumns = ['accountNumber', 'segment', 'description', 'level', 'postingLevel', 'hierarchy'];
  grapColumns = ['accountNumber', 'category', 'reportingItem', 'subClass', 'subClassBreakdown', 'postingLevel'];

  private segmentCountMap = new Map<string, number>();

  private segmentColors: Record<string, string> = {
    IA: '#22c55e', IL: '#ef4444', LN: '#a855f7', IR: '#3b82f6',
    IE: '#f59e0b', IZ: '#ec4899', FD: '#06b6d4', FX: '#8b5cf6',
    CO: '#64748b', PC: '#14b8a6', PO: '#f97316', PD: '#6b7280', RX: '#0ea5e9',
  };

  private segmentIcons: Record<string, string> = {
    IA: 'account_balance_wallet', IL: 'credit_card', LN: 'savings', IR: 'trending_up',
    IE: 'trending_down', IZ: 'swap_vert', FD: 'account_balance', FX: 'hub',
    CO: 'price_change', PC: 'construction', PO: 'work', PD: 'receipt', RX: 'map',
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadVersions();
    this.loadSegmentDetails();
    this.loadCurrentVersion();
  }

  loadVersions() {
    this.api.get<MscoaChartVersion[]>('/mscoa/versions').subscribe({
      next: v => this.versions.set(v),
      error: () => {},
    });
  }

  loadCurrentVersion() {
    this.api.get<MscoaChartVersion>('/mscoa/versions/current').subscribe({
      next: v => {
        this.currentVersion.set(v);
        this.selectedVersion.set(v);
        this.selectedVersionId.set(v.id);
        this.loadSegments(v.id);
        this.searchChart();
      },
      error: () => {},
    });
  }

  onVersionSwitch(versionId: string) {
    const ver = this.versions().find(v => v.id === versionId);
    if (!ver) return;
    this.selectedVersion.set(ver);
    this.selectedVersionId.set(ver.id);
    this.chartPage = 1;
    this.grapPage = 1;
    this.loadSegments(ver.id);
    this.searchChart();
    this.searchGrapMappings();
    this.activeTab = 0;
  }

  runComparison() {
    if (!this.compareVersion1 || !this.compareVersion2 || this.compareVersion1 === this.compareVersion2) return;
    this.comparisonLoading.set(true);
    this.comparison.set(null);
    this.comparisonError.set('');
    this.api.get<MscoaVersionComparison>(`/mscoa/versions/compare/${this.compareVersion1}/${this.compareVersion2}`).subscribe({
      next: res => {
        this.comparison.set(res);
        this.comparisonLoading.set(false);
      },
      error: (err) => {
        this.comparisonLoading.set(false);
        this.comparisonError.set(err?.error?.message || 'Failed to compare versions. Please try again.');
      },
    });
  }

  getComparisonSegments(): string[] {
    const comp = this.comparison();
    if (!comp) return [];
    const segs = new Set<string>();
    for (const s of Object.keys(comp.bySegment.added)) segs.add(s);
    for (const s of Object.keys(comp.bySegment.removed)) segs.add(s);
    for (const s of Object.keys(comp.bySegment.changed)) segs.add(s);
    return Array.from(segs).sort();
  }

  loadSegmentDetails() {
    this.api.get<{ segments: SegmentDetail[] }>('/mscoa/segments/details').subscribe({
      next: res => {
        this.allSegmentDetails.set(res.segments);
        this.segmentStats.set(res.segments);
      },
    });
  }

  loadSegments(versionId: string) {
    this.api.get<MscoaSegmentInfo[]>('/mscoa/segments', { versionId }).subscribe({
      next: segs => {
        segs.forEach(s => this.segmentCountMap.set(s.segment, parseInt(s.totalAccounts)));
      },
    });
  }

  selectSegment(code: string) {
    if (this.selectedSegment() === code) {
      this.selectedSegment.set('');
      this.filterSegment = '';
    } else {
      this.selectedSegment.set(code);
      this.filterSegment = code;
    }
    this.activeTab = 0;
    this.chartPage = 1;
    this.searchChart();
  }

  searchChart() {
    const ver = this.selectedVersion();
    if (!ver) return;
    this.loading.set(true);
    const params: any = { page: this.chartPage, limit: this.chartPageSize };
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.filterSegment) params.segment = this.filterSegment;
    if (this.filterPostingLevel) params.postingLevel = this.filterPostingLevel;

    this.api.get<MscoaPaginatedResult<MscoaChartItem>>(`/mscoa/chart/${ver.id}`, params).subscribe({
      next: res => {
        this.chartItems.set(res.items);
        this.chartTotal.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  searchGrapMappings() {
    const ver = this.selectedVersion();
    if (!ver) return;
    this.loading.set(true);
    const params: any = { page: this.grapPage, limit: this.grapPageSize };
    if (this.grapSearchTerm) params.search = this.grapSearchTerm;
    if (this.filterCategory) params.category = this.filterCategory;
    if (this.filterStatementType) params.statementType = this.filterStatementType;

    this.api.get<MscoaPaginatedResult<any>>(`/mscoa/grap-mappings/${ver.id}`, params).subscribe({
      next: res => {
        this.grapItems.set(res.items);
        this.grapTotal.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onChartPageChange(event: PageEvent) {
    this.chartPage = event.pageIndex + 1;
    this.chartPageSize = event.pageSize;
    this.searchChart();
  }

  onGrapPageChange(event: PageEvent) {
    this.grapPage = event.pageIndex + 1;
    this.grapPageSize = event.pageSize;
    this.searchGrapMappings();
  }

  getHierarchyPath(item: MscoaChartItem): string {
    return [item.l1, item.l2, item.l3, item.l4, item.l5, item.l6].filter(Boolean).join(' > ');
  }

  getSegmentColor(code: string, opacity?: number): string {
    const color = this.segmentColors[code] || '#64748b';
    if (opacity !== undefined) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${opacity})`;
    }
    return color;
  }

  getSegmentIcon(code: string): string {
    return this.segmentIcons[code] || 'category';
  }

  getSegmentCount(code: string): number {
    return this.segmentCountMap.get(code) || 0;
  }

  getCategoryClass(category: string): string {
    if (!category) return '';
    const map: Record<string, string> = {
      'Assets': 'assets', 'Liabilities': 'liabilities', 'Net Assets': 'netassets',
      'Revenue': 'revenue', 'Expenditure': 'expenditure', 'Gains and Losses': 'gainslosses',
    };
    return map[category] || '';
  }

  getSegmentSummaryEntries(summary: Record<string, any>): { key: string; value: any }[] {
    return Object.entries(summary).map(([key, value]) => ({ key, value }));
  }
}
