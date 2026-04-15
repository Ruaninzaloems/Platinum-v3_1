import { Component, OnInit, inject } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';
import { PeriodFilterService } from '../../core/services/period-filter.service';
import { GiReviewDialogComponent } from './gi-review-dialog.component';
import { AbbreviationsComponent } from '../abbreviations/abbreviations.component';
import { AO_RESPONSIBILITIES_ITEMS, AO_REPORT_ITEMS, buildAoDefaultText } from './ao-defaults.data';

interface CustomColumn {
  key: string;
  label: string;
}

interface TableConfig {
  hiddenColumns: string[];
  customColumns: CustomColumn[];
  columnOrder: string[];
}

interface BuiltInColumn {
  key: string;
  label: string;
  type: 'text' | 'date' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  narrow?: boolean;
}

type EntityType = 'municipality' | 'company' | 'npo' | 'soe';

interface EntityTypeConfig {
  label: string;
  entityNameLabel: string;
  logoLabel: string;
  detailsLabel: string;
  registrationNumberLabel: string;
  hiddenFields: string[];
  hiddenGovernanceSections: string[];
}

const ENTITY_TYPE_CONFIGS: Record<EntityType, EntityTypeConfig> = {
  municipality: {
    label: 'Municipality',
    entityNameLabel: 'Municipality Name',
    logoLabel: 'Logo',
    detailsLabel: 'Entity Details',
    registrationNumberLabel: 'Registration Number',
    hiddenFields: [],
    hiddenGovernanceSections: [],
  },
  company: {
    label: 'Company',
    entityNameLabel: 'Company Name',
    logoLabel: 'Logo',
    detailsLabel: 'Entity Details',
    registrationNumberLabel: 'Company Registration Number',
    hiddenFields: ['demarcationCode', 'municipalCategory', 'legalStatus', 'grading', 'province', 'speaker'],
    hiddenGovernanceSections: ['mayoralCommittee', 'councilMembers'],
  },
  npo: {
    label: 'NPO',
    entityNameLabel: 'Organisation Name',
    logoLabel: 'Logo',
    detailsLabel: 'Entity Details',
    registrationNumberLabel: 'NPO Registration Number',
    hiddenFields: ['demarcationCode', 'municipalCategory', 'legalStatus', 'grading', 'province', 'speaker'],
    hiddenGovernanceSections: ['mayoralCommittee', 'councilMembers'],
  },
  soe: {
    label: 'State-Owned Entity',
    entityNameLabel: 'Entity Name',
    logoLabel: 'Logo',
    detailsLabel: 'Entity Details',
    registrationNumberLabel: 'Registration Number',
    hiddenFields: ['demarcationCode', 'municipalCategory', 'legalStatus', 'province', 'speaker'],
    hiddenGovernanceSections: ['mayoralCommittee', 'councilMembers'],
  },
};

interface SectionCustomContentEntry {
  heading?: string;
  text?: string;
}

const GOVERNANCE_BUILT_IN_COLUMNS: BuiltInColumn[] = [
  { key: 'position', label: 'Position', type: 'text', required: true, placeholder: 'Position' },
  { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Name' },
  { key: 'startDate', label: 'Start Date', type: 'date' },
  { key: 'endDate', label: 'End Date', type: 'date' },
  { key: 'isActive', label: 'Active', type: 'checkbox', narrow: true },
  { key: 'notes', label: 'Notes', type: 'text', placeholder: 'Notes' },
];

const COUNCIL_BUILT_IN_COLUMNS: BuiltInColumn[] = [
  { key: 'position', label: 'Position', type: 'text', required: true, placeholder: 'Position' },
  { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Name' },
  { key: 'ward', label: 'Ward', type: 'text', placeholder: 'Ward' },
  { key: 'startDate', label: 'Start Date', type: 'date' },
  { key: 'endDate', label: 'End Date', type: 'date' },
  { key: 'isActive', label: 'Active', type: 'checkbox', narrow: true },
  { key: 'notes', label: 'Notes', type: 'text', placeholder: 'Notes' },
];

type GovernanceTableName = 'mayoralCommittee' | 'executiveManagement' | 'auditCommittee' | 'councilMembers' | 'otherCommittees';

@Component({
  selector: 'app-general-information',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatDialogModule,
    MatMenuModule,
    MatChipsModule,
    MatDatepickerModule,
    AbbreviationsComponent,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './general-information.component.html',
  styleUrl: './general-information.component.css',
  animations: [
    trigger('slideContent', [
      transition(':enter', [
        style({ opacity: 0, height: 0, overflow: 'hidden' }),
        animate('200ms ease-out', style({ opacity: 1, height: '*' })),
      ]),
      transition(':leave', [
        style({ overflow: 'hidden' }),
        animate('150ms ease-in', style({ opacity: 0, height: 0 })),
      ]),
    ]),
  ],
})
export class GeneralInformationComponent implements OnInit {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private periodFilter = inject(PeriodFilterService);

  form: FormGroup | null = null;
  loading = true;
  saving = false;
  validating = false;
  validationResult: { complete: boolean; missingFields: { field: string; label: string }[]; entityType: string; errors: string[] } | null = null;

  logoPreviewUrl: string | null = null;
  logoMetadata: { fileName?: string; fileSize?: number; uploadedAt?: Date; uploadedBy?: string } | null = null;
  logoUploading = false;

  entityType: EntityType = 'municipality';
  entityTypes: { value: EntityType; label: string }[] = [
    { value: 'municipality', label: 'Municipality' },
    { value: 'company', label: 'Company' },
    { value: 'npo', label: 'NPO' },
    { value: 'soe', label: 'State-Owned Entity' },
  ];

  sectionCustomContent: Record<string, SectionCustomContentEntry> = {};
  expandedCustomContent: Set<string> = new Set();
  collapsedSections: Set<string> = new Set();

  isSectionCollapsed(sectionKey: string): boolean {
    return this.collapsedSections.has(sectionKey);
  }

  toggleSection(sectionKey: string) {
    if (this.collapsedSections.has(sectionKey)) {
      this.collapsedSections.delete(sectionKey);
    } else {
      this.collapsedSections.add(sectionKey);
    }
  }

  provinces = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
    'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
  ];
  gradings = ['High Capacity', 'Medium Capacity', 'Low Capacity'];
  municipalCategories = ['Category A', 'Category B', 'Category C'];

  tableConfigs: Record<string, TableConfig> = {};

  governanceTables: { name: GovernanceTableName; title: string; icon: string; isCouncil: boolean }[] = [
    { name: 'mayoralCommittee', title: 'Governance — Mayoral Committee', icon: 'groups', isCouncil: false },
    { name: 'executiveManagement', title: 'Governance — Executive Management', icon: 'manage_accounts', isCouncil: false },
    { name: 'auditCommittee', title: 'Governance — Audit Committee', icon: 'verified_user', isCouncil: false },
    { name: 'councilMembers', title: 'Governance — Council Members', icon: 'people', isCouncil: true },
    { name: 'otherCommittees', title: 'Governance — Other Committees', icon: 'group_work', isCouncil: false },
  ];

  get currentConfig(): EntityTypeConfig {
    return ENTITY_TYPE_CONFIGS[this.entityType] || ENTITY_TYPE_CONFIGS['municipality'];
  }

  get visibleGovernanceTables() {
    const hidden = this.currentConfig.hiddenGovernanceSections;
    return this.governanceTables.filter(t => !hidden.includes(t.name));
  }

  isFieldHidden(fieldName: string): boolean {
    return this.currentConfig.hiddenFields.includes(fieldName);
  }

  onEntityTypeChange(newType: EntityType) {
    this.entityType = newType;
  }

  getSectionCustomContent(sectionKey: string): SectionCustomContentEntry {
    return this.sectionCustomContent[sectionKey] || {};
  }

  hasSectionCustomContent(sectionKey: string): boolean {
    const entry = this.sectionCustomContent[sectionKey];
    return !!(entry && (entry.heading?.trim() || entry.text?.trim()));
  }

  isSectionCustomContentExpanded(sectionKey: string): boolean {
    return this.expandedCustomContent.has(sectionKey) || this.hasSectionCustomContent(sectionKey);
  }

  toggleSectionCustomContent(sectionKey: string) {
    if (this.expandedCustomContent.has(sectionKey)) {
      this.expandedCustomContent.delete(sectionKey);
    } else {
      this.expandedCustomContent.add(sectionKey);
    }
  }

  onSectionHeadingInput(sectionKey: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (!this.sectionCustomContent[sectionKey]) {
      this.sectionCustomContent[sectionKey] = {};
    }
    this.sectionCustomContent[sectionKey].heading = value;
  }

  onSectionTextInput(sectionKey: string, event: Event) {
    const value = (event.target as HTMLTextAreaElement).value;
    if (!this.sectionCustomContent[sectionKey]) {
      this.sectionCustomContent[sectionKey] = {};
    }
    this.sectionCustomContent[sectionKey].text = value;
  }

  getFormArray(name: string): FormArray {
    return this.form!.get(name) as FormArray;
  }

  getBuiltInColumns(tableName: string): BuiltInColumn[] {
    return tableName === 'councilMembers' ? COUNCIL_BUILT_IN_COLUMNS : GOVERNANCE_BUILT_IN_COLUMNS;
  }

  getAllColumnsForMenu(tableName: string): { key: string; label: string; type: 'text' | 'date' | 'checkbox'; required?: boolean; placeholder?: string; narrow?: boolean; isCustom: boolean }[] {
    const order = this.ensureColumnOrder(tableName);
    const builtIn = this.getBuiltInColumns(tableName);
    const custom = this.getCustomColumns(tableName);

    const allCols = [
      ...builtIn.map(c => ({ ...c, isCustom: false })),
      ...custom.map(c => ({ key: c.key, label: c.label, type: 'text' as const, placeholder: c.label, isCustom: true })),
    ];

    if (order.length === 0) return allCols;

    const ordered: typeof allCols = [];
    for (const key of order) {
      const col = allCols.find(c => c.key === key);
      if (col) ordered.push(col);
    }
    for (const col of allCols) {
      if (!ordered.some(o => o.key === col.key)) ordered.push(col);
    }
    return ordered;
  }

  getVisibleOrderedColumns(tableName: string): { key: string; label: string; type: 'text' | 'date' | 'checkbox'; required?: boolean; placeholder?: string; narrow?: boolean; isCustom: boolean }[] {
    const hidden = this.tableConfigs[tableName]?.hiddenColumns || [];
    return this.getAllColumnsForMenu(tableName).filter(c => !hidden.includes(c.key));
  }

  getCustomColumns(tableName: string): CustomColumn[] {
    return this.tableConfigs[tableName]?.customColumns || [];
  }

  isColumnHidden(tableName: string, colKey: string): boolean {
    return (this.tableConfigs[tableName]?.hiddenColumns || []).includes(colKey);
  }

  isColumnRequired(tableName: string, colKey: string): boolean {
    const builtIn = this.getBuiltInColumns(tableName).find(c => c.key === colKey);
    return !!builtIn?.required;
  }

  toggleColumnVisibility(tableName: string, colKey: string) {
    if (this.isColumnRequired(tableName, colKey)) {
      this.snackBar.open('Required columns cannot be hidden.', 'OK', { duration: 3000 });
      return;
    }
    if (!this.tableConfigs[tableName]) {
      this.tableConfigs[tableName] = { hiddenColumns: [], customColumns: [], columnOrder: [] };
    }
    const hidden = this.tableConfigs[tableName].hiddenColumns;
    const idx = hidden.indexOf(colKey);
    if (idx >= 0) {
      hidden.splice(idx, 1);
    } else {
      hidden.push(colKey);
    }
  }

  moveColumnUp(tableName: string, colKey: string) {
    const order = this.ensureColumnOrder(tableName);
    const idx = order.indexOf(colKey);
    if (idx <= 0) return;
    [order[idx - 1], order[idx]] = [order[idx], order[idx - 1]];
  }

  moveColumnDown(tableName: string, colKey: string) {
    const order = this.ensureColumnOrder(tableName);
    const idx = order.indexOf(colKey);
    if (idx < 0 || idx >= order.length - 1) return;
    [order[idx], order[idx + 1]] = [order[idx + 1], order[idx]];
  }

  private ensureColumnOrder(tableName: string): string[] {
    if (!this.tableConfigs[tableName]) {
      this.tableConfigs[tableName] = { hiddenColumns: [], customColumns: [], columnOrder: [] };
    }
    if (!this.tableConfigs[tableName].columnOrder || this.tableConfigs[tableName].columnOrder.length === 0) {
      const builtInKeys = this.getBuiltInColumns(tableName).map(c => c.key);
      const customKeys = (this.tableConfigs[tableName].customColumns || []).map(c => c.key);
      this.tableConfigs[tableName].columnOrder = [...builtInKeys, ...customKeys];
    }
    return this.tableConfigs[tableName].columnOrder;
  }

  addCustomColumn(tableName: string) {
    const label = prompt('Enter column name:');
    if (!label || !label.trim()) return;
    if (!this.tableConfigs[tableName]) {
      this.tableConfigs[tableName] = { hiddenColumns: [], customColumns: [], columnOrder: [] };
    }
    const key = 'custom_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    this.tableConfigs[tableName].customColumns.push({ key, label: label.trim() });

    if (this.tableConfigs[tableName].columnOrder && this.tableConfigs[tableName].columnOrder.length > 0) {
      this.tableConfigs[tableName].columnOrder.push(key);
    }

    const arr = this.getFormArray(tableName);
    for (let i = 0; i < arr.length; i++) {
      const group = arr.at(i) as FormGroup;
      const cf = group.get('customFields') as FormGroup;
      if (cf) {
        cf.addControl(key, new FormControl(''));
      }
    }
  }

  renameCustomColumn(tableName: string, colKey: string) {
    const config = this.tableConfigs[tableName];
    if (!config) return;
    const col = config.customColumns.find(c => c.key === colKey);
    if (!col) return;
    const newLabel = prompt('Rename column:', col.label);
    if (newLabel && newLabel.trim()) {
      col.label = newLabel.trim();
    }
  }

  removeCustomColumn(tableName: string, colKey: string) {
    const config = this.tableConfigs[tableName];
    if (!config) return;
    config.customColumns = config.customColumns.filter(c => c.key !== colKey);

    if (config.columnOrder) {
      config.columnOrder = config.columnOrder.filter(k => k !== colKey);
    }

    const arr = this.getFormArray(tableName);
    for (let i = 0; i < arr.length; i++) {
      const group = arr.at(i) as FormGroup;
      const cf = group.get('customFields') as FormGroup;
      if (cf) {
        cf.removeControl(colKey);
      }
    }
  }

  ngOnInit() {
    this.loadData();
  }

  private get fyId(): string {
    return this.periodFilter.selectedFyId() || '';
  }

  private loadData() {
    const fyId = this.fyId;
    if (!fyId) {
      this.loading = false;
      this.buildForm({});
      return;
    }
    this.loading = true;
    this.api.get<any>(`/general-information/${fyId}`).subscribe({
      next: (data) => {
        this.buildForm(data || {});
        this.loading = false;
        this.loadLogoMetadata();
      },
      error: () => {
        this.buildForm({});
        this.loading = false;
      }
    });
  }

  private buildForm(data: any) {
    this.entityType = data.entityType || 'municipality';
    this.sectionCustomContent = data.sectionCustomContent || {};

    this.tableConfigs = {};
    const savedConfig = data.governanceColumnConfig || {};
    for (const tbl of this.governanceTables) {
      const cfg = savedConfig[tbl.name];
      this.tableConfigs[tbl.name] = {
        hiddenColumns: cfg?.hiddenColumns || [],
        customColumns: cfg?.customColumns || [],
        columnOrder: cfg?.columnOrder || [],
      };
    }

    this.form = this.fb.group({
      municipalityName: [data.municipalityName || ''],
      demarcationCode: [data.demarcationCode || ''],
      registeredOffice: [data.registeredOffice || ''],
      postalAddress: [data.postalAddress || ''],
      telephone: [data.telephone || ''],
      fax: [data.fax || ''],
      email: [data.email || ''],
      website: [data.website || ''],
      accountingOfficer: [data.accountingOfficer || ''],
      cfo: [data.cfo || ''],
      speaker: [data.speaker || ''],
      auditor: [data.auditor || ''],
      priorYearAuditor: [data.priorYearAuditor || ''],
      auditorAddress: [data.auditorAddress || ''],
      banker: [data.banker || ''],
      bankerAddress: [data.bankerAddress || ''],
      attorneys: [data.attorneys || ''],
      legalStatus: [data.legalStatus || ''],
      municipalCategory: [data.municipalCategory || ''],
      legislation: [data.legislation || ''],
      province: [data.province || ''],
      country: [data.country || ''],
      grading: [data.grading || ''],
      registrationNumber: [data.registrationNumber || ''],
      natureOfBusiness: [data.natureOfBusiness || ''],
      reportingPeriodStart: [this.parseLocalDate(data.reportingPeriodStart)],
      reportingPeriodEnd: [this.parseLocalDate(data.reportingPeriodEnd)],
      approvalDate: [this.parseLocalDate(data.approvalDate)],
      levelOfAssurance: [data.levelOfAssurance || ''],
      vision: [data.vision || ''],
      mission: [data.mission || ''],
      slogan: [data.slogan || ''],
      mayoralCommittee: this.fb.array((data.mayoralCommittee || []).map((m: any) => this.createGovernanceGroup(m, 'mayoralCommittee'))),
      executiveManagement: this.fb.array((data.executiveManagement || []).map((m: any) => this.createGovernanceGroup(m, 'executiveManagement'))),
      auditCommittee: this.fb.array((data.auditCommittee || []).map((m: any) => this.createGovernanceGroup(m, 'auditCommittee'))),
      councilMembers: this.fb.array((data.councilMembers || []).map((m: any) => this.createCouncilGroup(m))),
      otherCommittees: this.fb.array((data.otherCommittee || data.otherCommittees || []).map((m: any) => this.createGovernanceGroup(m, 'otherCommittees'))),
      aoResponsibilitiesContent: [data.aoResponsibilitiesContent || ''],
      aoReportContent: [data.aoReportContent || ''],
      consolidatedEntities: this.fb.array((data.consolidatedEntities || []).map((e: any) => this.createEntityGroup(e))),
    });
  }

  private createGovernanceGroup(m: any = {}, tableName: string): FormGroup {
    const customCols = this.tableConfigs[tableName]?.customColumns || [];
    const cfGroup: Record<string, FormControl> = {};
    for (const col of customCols) {
      cfGroup[col.key] = new FormControl(m.customFields?.[col.key] || '');
    }
    return this.fb.group({
      name: [m.name || ''],
      position: [m.position || m.portfolio || ''],
      startDate: [m.startDate || ''],
      endDate: [m.endDate || ''],
      notes: [m.notes || ''],
      isActive: [m.isActive !== undefined ? m.isActive : true],
      customFields: this.fb.group(cfGroup),
    });
  }

  private createCouncilGroup(m: any = {}): FormGroup {
    const customCols = this.tableConfigs['councilMembers']?.customColumns || [];
    const cfGroup: Record<string, FormControl> = {};
    for (const col of customCols) {
      cfGroup[col.key] = new FormControl(m.customFields?.[col.key] || '');
    }
    return this.fb.group({
      name: [m.name || ''],
      position: [m.position || ''],
      ward: [m.ward || ''],
      startDate: [m.startDate || ''],
      endDate: [m.endDate || ''],
      notes: [m.notes || ''],
      isActive: [m.isActive !== undefined ? m.isActive : true],
      customFields: this.fb.group(cfGroup),
    });
  }

  private createEntityGroup(e: any = {}): FormGroup {
    return this.fb.group({
      name: [e.name || ''],
      type: [e.type || ''],
    });
  }

  get consolidatedEntitiesArray(): FormArray {
    return this.form?.get('consolidatedEntities') as FormArray;
  }

  addEntity() {
    this.consolidatedEntitiesArray.push(this.createEntityGroup());
  }

  removeEntity(index: number) {
    this.consolidatedEntitiesArray.removeAt(index);
  }

  addRow(tableName: string, isCouncil: boolean) {
    const arr = this.getFormArray(tableName);
    if (isCouncil) {
      arr.push(this.createCouncilGroup());
    } else {
      arr.push(this.createGovernanceGroup({}, tableName));
    }
  }

  insertRowAt(tableName: string, index: number, isCouncil: boolean) {
    const arr = this.getFormArray(tableName);
    const group = isCouncil ? this.createCouncilGroup() : this.createGovernanceGroup({}, tableName);
    arr.insert(index, group);
  }

  removeRow(tableName: string, index: number) {
    const arr = this.getFormArray(tableName);
    arr.removeAt(index);
  }

  private parseLocalDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const parts = value.substring(0, 10).split('-');
    if (parts.length !== 3) return null;
    return new Date(+parts[0], +parts[1] - 1, +parts[2]);
  }

  private serializeDate(val: any): string | null {
    if (!val) return null;
    if (val instanceof Date) {
      if (isNaN(val.getTime())) return null;
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return typeof val === 'string' ? val : null;
  }

  save() {
    if (!this.form || !this.fyId) return;
    this.saving = true;
    const value = this.form.getRawValue();
    value.entityType = this.entityType;
    value.sectionCustomContent = { ...this.sectionCustomContent };
    value.governanceColumnConfig = { ...this.tableConfigs };
    value.reportingPeriodStart = this.serializeDate(value.reportingPeriodStart);
    value.reportingPeriodEnd = this.serializeDate(value.reportingPeriodEnd);
    value.approvalDate = this.serializeDate(value.approvalDate);
    this.api.put(`/general-information/${this.fyId}`, value).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('General information saved successfully', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open('Failed to save: ' + (err?.error?.message || 'Unknown error'), 'OK', { duration: 5000 });
      }
    });
  }

  validateRecord() {
    if (!this.fyId) return;
    this.validating = true;
    this.api.get<any>(`/general-information/${this.fyId}/validate`).subscribe({
      next: (result) => {
        this.validationResult = result;
        this.validating = false;
        if (result.complete) {
          this.snackBar.open('All required fields are complete', 'OK', { duration: 3000 });
        } else {
          const labels = result.missingFields.map((f: any) => f.label).join(', ');
          const msg = result.errors?.length
            ? `Missing: ${labels}. Errors: ${result.errors.join('; ')}`
            : `Missing: ${labels}`;
          this.snackBar.open(msg, 'OK', { duration: 8000 });
        }
      },
      error: () => {
        this.validating = false;
        this.snackBar.open('Validation check failed', 'OK', { duration: 5000 });
      }
    });
  }

  seedDefaults() {
    if (!this.fyId) return;
    this.saving = true;
    this.api.post(`/general-information/${this.fyId}/seed`, { entityType: this.entityType }).subscribe({
      next: (data: any) => {
        this.buildForm(data || {});
        this.saving = false;
        this.snackBar.open('Default values seeded', 'OK', { duration: 3000 });
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Failed to seed defaults', 'OK', { duration: 5000 });
      }
    });
  }

  private loadLogoMetadata() {
    if (!this.fyId) return;
    this.api.get<any>(`/general-information/${this.fyId}/logo/metadata`).subscribe({
      next: (meta) => {
        if (meta?.hasLogo) {
          this.logoMetadata = meta;
          this.fetchLogoBlob();
        } else {
          this.logoMetadata = null;
          this.revokePreviewUrl();
        }
      },
      error: () => {
        this.logoMetadata = null;
        this.revokePreviewUrl();
      },
    });
  }

  private fetchLogoBlob() {
    if (!this.fyId) return;
    this.http.get(`/api/general-information/${this.fyId}/logo`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.revokePreviewUrl();
        this.logoPreviewUrl = URL.createObjectURL(blob);
      },
      error: () => {
        this.revokePreviewUrl();
      },
    });
  }

  private revokePreviewUrl() {
    if (this.logoPreviewUrl) {
      URL.revokeObjectURL(this.logoPreviewUrl);
    }
    this.logoPreviewUrl = null;
  }

  onLogoFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Please select an image file.', 'OK', { duration: 5000 });
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.snackBar.open('File is too large. Maximum size is 10 MB.', 'OK', { duration: 5000 });
      input.value = '';
      return;
    }

    this.revokePreviewUrl();
    this.logoPreviewUrl = URL.createObjectURL(file);

    this.uploadLogo(file);
    input.value = '';
  }

  private uploadLogo(file: File) {
    if (!this.fyId) return;
    this.logoUploading = true;
    const formData = new FormData();
    formData.append('file', file);

    this.http.post<any>(`/api/general-information/${this.fyId}/logo`, formData).subscribe({
      next: (result) => {
        this.logoUploading = false;
        this.logoMetadata = result;
        this.snackBar.open('Logo uploaded successfully', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.logoUploading = false;
        this.revokePreviewUrl();
        this.snackBar.open(err?.error?.message || 'Failed to upload logo', 'OK', { duration: 5000 });
      },
    });
  }

  removeLogo() {
    if (!this.fyId || !this.logoMetadata) return;
    if (!confirm(`Are you sure you want to remove the ${this.currentConfig.logoLabel.toLowerCase()}? This action is audit-logged.`)) return;

    this.logoUploading = true;
    this.http.delete<any>(`/api/general-information/${this.fyId}/logo`).subscribe({
      next: () => {
        this.logoUploading = false;
        this.logoMetadata = null;
        this.revokePreviewUrl();
        this.snackBar.open('Logo removed', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.logoUploading = false;
        this.snackBar.open(err?.error?.message || 'Failed to remove logo', 'OK', { duration: 5000 });
      },
    });
  }

  formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  private readonly AO_RESPONSIBILITIES_DEFAULT = buildAoDefaultText(AO_RESPONSIBILITIES_ITEMS);
  private readonly AO_REPORT_DEFAULT = buildAoDefaultText(AO_REPORT_ITEMS);

  seedAoResponsibilities() {
    if (!this.form) return;
    this.form.get('aoResponsibilitiesContent')?.setValue(this.AO_RESPONSIBILITIES_DEFAULT);
    this.snackBar.open('AO Responsibilities reset to default text', 'OK', { duration: 3000 });
  }

  seedAoReport() {
    if (!this.form) return;
    this.form.get('aoReportContent')?.setValue(this.AO_REPORT_DEFAULT);
    this.snackBar.open('AO Report reset to default text', 'OK', { duration: 3000 });
  }

  submitForReview() {
    const fyId = this.periodFilter.selectedFyId();
    if (!fyId) {
      this.snackBar.open('No financial year selected', 'OK', { duration: 4000 });
      return;
    }
    const dialogRef = this.dialog.open(GiReviewDialogComponent, {
      width: '640px',
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      this.http.post(`/api/general-information/${fyId}/review`, result).subscribe({
        next: () => {
          this.snackBar.open('Review request sent successfully', 'OK', { duration: 4000 });
        },
        error: (err) => {
          this.snackBar.open(err?.error?.message || 'Failed to send review request', 'OK', { duration: 5000 });
        },
      });
    });
  }
}
