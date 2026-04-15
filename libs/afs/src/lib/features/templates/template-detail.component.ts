import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { AfsTemplate, TemplateSection, TemplateLineItem } from '../../core/models/interfaces';
import { AccountingPoliciesComponent } from '../accounting-policies/accounting-policies.component';
import { AbbreviationsComponent } from '../abbreviations/abbreviations.component';

interface MappingValidation {
  templateId: string;
  totalRules: number;
  isValid: boolean;
  mscoaVersion?: { id: string; version: string; label: string } | null;
  mscoaVersionMixed?: boolean;
  statementLineCoverage: {
    totalDataLines: number;
    mapped: number;
    unmapped: number;
    unmappedDetails: { section: string; label: string; lineItemId: string }[];
  };
  noteCoverage: {
    totalNoteSections: number;
    mapped: number;
    unmapped: number;
    mappedDetails: { title: string; sectionId: string; ruleCount: number; lineItemCoverage: { total: number; mapped: number } }[];
    unmappedDetails: { title: string; sectionId: string; dataLineCount: number }[];
    lineItemLevel: { totalDataLines: number; mappedDataLines: number; coveragePercent: number };
  };
  subClassCoverage: { total: number; matched: number; unmatched: number; coveragePercent: number };
}

interface VersionHistoryEntry {
  id: string;
  version: string;
  versionNumber: number;
  versionLabel: string;
  isCurrentVersion: boolean;
  status: string;
  specimenYear: string;
  createdAt: string;
  publishedAt: string | null;
  sectionCount: number;
  compilationCount: number;
}

interface VersionHistory {
  familyRootId: string;
  familyName: string;
  versions: VersionHistoryEntry[];
}

interface ComparisonLineItemDiff {
  label: string;
  lineType: string;
  change: 'added' | 'removed' | 'modified' | 'unchanged';
  details?: Record<string, { old: string | number | boolean | null; new: string | number | boolean | null }>;
}

interface ComparisonSectionDiff {
  title: string;
  sectionType: string;
  change: 'added' | 'removed' | 'modified' | 'unchanged';
  lineItems: ComparisonLineItemDiff[];
}

interface ComparisonResult {
  template1: { id: string; name: string; version: string; versionNumber: number; versionLabel: string };
  template2: { id: string; name: string; version: string; versionNumber: number; versionLabel: string };
  summary: { totalSections: number; added: number; removed: number; modified: number; unchanged: number };
  sections: ComparisonSectionDiff[];
}

@Component({
  selector: 'app-template-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatTooltipModule,
    MatTabsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    AccountingPoliciesComponent,
    AbbreviationsComponent,
  ],
  templateUrl: './template-detail.component.html',
  styleUrl: './template-detail.component.css',
})
export class TemplateDetailComponent implements OnInit {
  Math = Math;
  template = signal<AfsTemplate | null>(null);
  mappingData = signal<MappingValidation | null>(null);
  mappingLoading = signal(false);
  creatingVersion = signal(false);
  versionHistory = signal<VersionHistory | null>(null);
  versionLoading = signal(false);
  comparisonData = signal<ComparisonResult | null>(null);
  mscoaVersionLabel = signal<string>('');
  selectedTabIndex = 0;

  statementSections = computed(() => {
    const tmpl = this.template();
    if (!tmpl?.sections) return [];
    const noteTypes = ['disclosure_note', 'note', 'notes'];
    return tmpl.sections.filter(s =>
      !s.noteNumber && !noteTypes.includes(s.sectionType)
    );
  });

  noteSections = computed(() => {
    const tmpl = this.template();
    if (!tmpl?.sections) return [];
    const noteTypes = ['disclosure_note', 'note', 'notes'];
    return tmpl.sections.filter(s =>
      !!s.noteNumber || noteTypes.includes(s.sectionType)
    );
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab) {
      const tabMap: Record<string, number> = {
        statements: 0,
        policies: 1,
        notes: 2,
        abbreviations: 3,
        mapping: 4,
        versions: 5,
      };
      this.selectedTabIndex = tabMap[tab] ?? 0;
    }

    if (id) {
      this.api.get<AfsTemplate>(`/templates/${id}`).subscribe({
        next: (data) => this.template.set(data),
      });

      this.loadMappingData();

      if (this.selectedTabIndex === 5) {
        this.loadVersionHistory();
      }
    }
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
    const tabNames = ['statements', 'policies', 'notes', 'abbreviations', 'mapping', 'versions'];
    this.router.navigate([], { queryParams: { tab: tabNames[index] }, queryParamsHandling: 'merge', replaceUrl: true });
    if (index === 4 && !this.mappingData() && !this.mappingLoading()) {
      this.loadMappingData();
    }
    if (index === 5 && !this.versionHistory() && !this.versionLoading()) {
      this.loadVersionHistory();
    }
  }

  private loadMappingData() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.mappingLoading.set(true);
    this.api.get<MappingValidation>(`/mscoa/disclosure-mappings/${id}/validate`).subscribe({
      next: (data) => {
        this.mappingData.set(data);
        this.mappingLoading.set(false);
        if (data.mscoaVersionMixed) {
          this.mscoaVersionLabel.set('Mixed versions');
        } else if (data.mscoaVersion) {
          this.mscoaVersionLabel.set(`v${data.mscoaVersion.version}${data.mscoaVersion.label ? ' — ' + data.mscoaVersion.label : ''}`);
        } else {
          this.mscoaVersionLabel.set('Not set');
        }
      },
      error: () => {
        this.mappingData.set(null);
        this.mappingLoading.set(false);
        this.mscoaVersionLabel.set('N/A');
      },
    });
  }

  goBack() {
    this.router.navigate(['/templates']);
  }

  editStyle() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate(['/templates', id, 'style']);
    }
  }

  createNewVersion() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.creatingVersion.set(true);
    this.api.post<AfsTemplate>(`/templates/${id}/create-version`, {}).subscribe({
      next: (newTemplate) => {
        this.creatingVersion.set(false);
        this.router.navigate(['/templates', newTemplate.id], { queryParams: { tab: 'versions' } });
      },
      error: () => {
        this.creatingVersion.set(false);
      },
    });
  }

  private loadVersionHistory() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.versionLoading.set(true);
    this.api.get<VersionHistory>(`/templates/${id}/version-history`).subscribe({
      next: (data) => {
        this.versionHistory.set(data);
        this.versionLoading.set(false);
      },
      error: () => {
        this.versionHistory.set(null);
        this.versionLoading.set(false);
      },
    });
  }

  openVersion(versionId: string) {
    this.router.navigate(['/templates', versionId]);
  }

  compareWithVersion(otherId: string) {
    const currentId = this.route.snapshot.paramMap.get('id');
    if (!currentId) return;
    this.api.get<ComparisonResult>(`/templates/compare/${currentId}/${otherId}`).subscribe({
      next: (data) => this.comparisonData.set(data),
    });
  }

  closeComparison() {
    this.comparisonData.set(null);
  }

  objectEntries(obj: Record<string, { old: string | number | boolean | null; new: string | number | boolean | null }>): [string, { old: string | number | boolean | null; new: string | number | boolean | null }][] {
    return Object.entries(obj);
  }
}
