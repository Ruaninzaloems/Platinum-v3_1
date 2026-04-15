import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../../../core/api.service';

interface TabFieldDef {
  label: string;
  projectKey: string;
  voteKey: string;
}

interface TabDef {
  name: string;
  transactionTypeId: number;
  subType1: string;
  subType2: string;
  leftFields: TabFieldDef[];
  rightFields: TabFieldDef[];
}

@Component({
  selector: 'app-mscoa-config',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatTabsModule, MatTooltipModule],
  templateUrl: './mscoa-config.component.html',
  styleUrls: ['./mscoa-config.component.css']
})
export class MscoaConfigComponent implements OnInit {
  view = signal<'list' | 'step1' | 'step2'>('list');
  loading = signal(true);
  saving = signal(false);

  items = signal<any[]>([]);
  finYears = signal<string[]>([]);
  assetTypes = signal<any[]>([]);
  categories = signal<any[]>([]);
  subCategories = signal<any[]>([]);
  measurementTypes = signal<any[]>([]);
  statuses = signal<any[]>([]);
  departments = signal<any[]>([]);
  divisions = signal<any[]>([]);
  allDivisions = signal<any[]>([]);
  step1Divisions = signal<any[]>([]);
  projects = signal<any[]>([]);
  projectsLoading = false;
  scoaItemsMap: { [key: string]: any[] } = {};
  private readonly emptyScoaItems: any[] = [];
  transactionTypeDefs = signal<any[]>([]);

  filterFinYear = '';
  filterTypeId = '';
  filterCategoryId = '';
  filterSubCategoryId = '';
  filterDepartmentId = '';
  filterDivisionId = '';

  filterCategories = signal<any[]>([]);
  filterSubCategories = signal<any[]>([]);
  filterDivisions = signal<any[]>([]);

  editingId = signal<number | null>(null);
  copyingFromId = signal<number | null>(null);
  currentRecord = signal<any>(null);

  step1Form: any = { finYear: '', typeId: '', categoryId: '', subCategoryId: '', measurementTypeId: '', statusId: '', departmentId: '', divisionId: '' };
  step1Categories = signal<any[]>([]);
  step1SubCategories = signal<any[]>([]);

  activeTabIndex = signal(0);
  tabs = signal<TabDef[]>([]);
  enabledTabs = signal<boolean[]>([]);
  tabData: any[] = [];
  savedTabMappings: any[] = [];

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadRefData();
  }

  loadRefData(): void {
    this.api.getMscoaFinYears().subscribe({
      next: function(this: MscoaConfigComponent, data: string[]) { this.finYears.set(data); }.bind(this),
      error: function() {}
    });
    this.api.getAssetTypes().subscribe({
      next: function(this: MscoaConfigComponent, data: any[]) { this.assetTypes.set(data); }.bind(this),
      error: function() {}
    });
    this.api.getMeasurementTypes().subscribe({
      next: function(this: MscoaConfigComponent, data: any[]) { this.measurementTypes.set(data); }.bind(this),
      error: function() {}
    });
    this.api.getAssetStatuses().subscribe({
      next: function(this: MscoaConfigComponent, data: any[]) { this.statuses.set(data); }.bind(this),
      error: function() {}
    });
    this.api.getMscoaDepartments().subscribe({
      next: function(this: MscoaConfigComponent, data: any[]) { this.departments.set(data); }.bind(this),
      error: function() {}
    });
    this.api.getMscoaDivisions().subscribe({
      next: function(this: MscoaConfigComponent, data: any[]) { this.allDivisions.set(Array.isArray(data) ? data : []); }.bind(this),
      error: function() {}
    });
    this.api.getMscoaTransactionTypeDefs().subscribe({
      next: function(this: MscoaConfigComponent, data: any[]) { this.transactionTypeDefs.set(data); }.bind(this),
      error: function() {}
    });
    this.loadList();
  }

  loadList(): void {
    this.loading.set(true);
    const params: any = {};
    if (this.filterFinYear) params.finYear = this.filterFinYear;
    if (this.filterTypeId) params.typeId = this.filterTypeId;
    if (this.filterCategoryId) params.categoryId = this.filterCategoryId;
    if (this.filterSubCategoryId) params.subCategoryId = this.filterSubCategoryId;
    if (this.filterDepartmentId) params.departmentId = this.filterDepartmentId;
    if (this.filterDivisionId) params.divisionId = this.filterDivisionId;
    this.api.getMscoaList(params).subscribe({
      next: function(this: MscoaConfigComponent, data: any[]) { this.items.set(data); this.loading.set(false); }.bind(this),
      error: function(this: MscoaConfigComponent) { this.loading.set(false); }.bind(this)
    });
  }

  onFilterTypeChange(): void {
    this.filterCategoryId = '';
    this.filterSubCategoryId = '';
    this.filterSubCategories.set([]);
    if (!this.filterTypeId) { this.filterCategories.set([]); return; }
    this.api.getAssetCategoriesList({ typeId: this.filterTypeId }).subscribe({
      next: function(this: MscoaConfigComponent, data: any[]) { this.filterCategories.set(data); }.bind(this),
      error: function() {}
    });
  }

  onFilterCategoryChange(): void {
    this.filterSubCategoryId = '';
    if (!this.filterCategoryId) { this.filterSubCategories.set([]); return; }
    this.api.getAssetSubCategoriesList({ typeId: this.filterTypeId, categoryId: this.filterCategoryId }).subscribe({
      next: function(this: MscoaConfigComponent, data: any[]) { this.filterSubCategories.set(data); }.bind(this),
      error: function() {}
    });
  }

  getDeptName(deptId: any): string {
    if (!deptId) return '—';
    var dept = this.departments().find(function(d) { return Number(d.id) === Number(deptId); });
    return dept ? dept.description : '—';
  }

  getDivName(divId: any): string {
    if (!divId) return '—';
    var div = this.allDivisions().find(function(d) { return Number(d.id) === Number(divId); });
    return div ? div.description : '—';
  }

  onFilterDepartmentChange(): void {
    this.filterDivisionId = '';
    this.filterDivisions.set([]);
    if (!this.filterDepartmentId) { return; }
    var deptId = parseInt(this.filterDepartmentId);
    this.api.getMscoaDivisions(deptId).subscribe({
      next: function(this: MscoaConfigComponent, data: any[]) { this.filterDivisions.set(data); }.bind(this),
      error: function() {}
    });
  }

  search(): void { this.loadList(); }

  clearFilter(): void {
    this.filterFinYear = '';
    this.filterTypeId = '';
    this.filterCategoryId = '';
    this.filterSubCategoryId = '';
    this.filterDepartmentId = '';
    this.filterDivisionId = '';
    this.filterCategories.set([]);
    this.filterSubCategories.set([]);
    this.filterDivisions.set([]);
    this.loadList();
  }

  openAdd(): void {
    this.editingId.set(null);
    this.currentRecord.set(null);
    this.step1Form = { finYear: this.finYears().length > 0 ? this.finYears()[this.finYears().length - 1] : '', typeId: '', categoryId: '', subCategoryId: '', measurementTypeId: '', statusId: '', departmentId: '', divisionId: '' };
    this.step1Categories.set([]);
    this.step1SubCategories.set([]);
    this.step1Divisions.set([]);
    this.view.set('step1');
  }

  openEdit(item: any): void {
    this.editingId.set(item.assetConfigMscoaId);
    this.currentRecord.set(item);
    this.step1Form = {
      finYear: item.finYear || '',
      typeId: item.typeId ? String(item.typeId) : '',
      categoryId: item.categoryId ? String(item.categoryId) : '',
      subCategoryId: item.subCategoryId ? String(item.subCategoryId) : '',
      measurementTypeId: item.measurementTypeId ? String(item.measurementTypeId) : '',
      statusId: item.statusId ? String(item.statusId) : '',
      departmentId: item.departmentId ? String(item.departmentId) : '',
      divisionId: item.divisionId ? String(item.divisionId) : ''
    };
    if (this.step1Form.typeId) {
      this.api.getAssetCategoriesList({ typeId: this.step1Form.typeId }).subscribe({
        next: function(this: MscoaConfigComponent, data: any[]) { this.step1Categories.set(data); }.bind(this),
        error: function() {}
      });
    }
    if (this.step1Form.categoryId) {
      this.api.getAssetSubCategoriesList({ typeId: this.step1Form.typeId, categoryId: this.step1Form.categoryId }).subscribe({
        next: function(this: MscoaConfigComponent, data: any[]) { this.step1SubCategories.set(data); }.bind(this),
        error: function() {}
      });
    }
    if (this.step1Form.departmentId) {
      var deptIdNum = parseInt(this.step1Form.departmentId);
      this.api.getMscoaDivisions(deptIdNum).subscribe({
        next: function(this: MscoaConfigComponent, data: any[]) { this.step1Divisions.set(data); }.bind(this),
        error: function() {}
      });
    } else {
      this.step1Divisions.set([]);
    }
    this.loadStep2(item.assetConfigMscoaId, item.measurementTypeId || 0);
  }

  openCopy(item: any): void {
    this.editingId.set(null);
    this.copyingFromId.set(item.assetConfigMscoaId);
    this.currentRecord.set(null);
    this.step1Form = {
      finYear: item.finYear || '',
      typeId: item.typeId ? String(item.typeId) : '',
      categoryId: item.categoryId ? String(item.categoryId) : '',
      subCategoryId: item.subCategoryId ? String(item.subCategoryId) : '',
      measurementTypeId: item.measurementTypeId ? String(item.measurementTypeId) : '',
      statusId: item.statusId ? String(item.statusId) : '',
      departmentId: item.departmentId ? String(item.departmentId) : '',
      divisionId: item.divisionId ? String(item.divisionId) : ''
    };
    if (this.step1Form.typeId) {
      this.api.getAssetCategoriesList({ typeId: this.step1Form.typeId }).subscribe({
        next: function(this: MscoaConfigComponent, data: any[]) { this.step1Categories.set(data); }.bind(this),
        error: function() {}
      });
    } else {
      this.step1Categories.set([]);
    }
    if (this.step1Form.categoryId) {
      this.api.getAssetSubCategoriesList({ typeId: this.step1Form.typeId, categoryId: this.step1Form.categoryId }).subscribe({
        next: function(this: MscoaConfigComponent, data: any[]) { this.step1SubCategories.set(data); }.bind(this),
        error: function() {}
      });
    } else {
      this.step1SubCategories.set([]);
    }
    if (this.step1Form.departmentId) {
      var deptIdNum = parseInt(this.step1Form.departmentId);
      this.api.getMscoaDivisions(deptIdNum).subscribe({
        next: function(this: MscoaConfigComponent, data: any[]) { this.step1Divisions.set(data); }.bind(this),
        error: function() {}
      });
    } else {
      this.step1Divisions.set([]);
    }
    this.view.set('step1');
  }

  onStep1TypeChange(): void {
    this.step1Form.categoryId = '';
    this.step1Form.subCategoryId = '';
    this.step1SubCategories.set([]);
    if (!this.step1Form.typeId) { this.step1Categories.set([]); return; }
    this.api.getAssetCategoriesList({ typeId: this.step1Form.typeId }).subscribe({
      next: function(this: MscoaConfigComponent, data: any[]) { this.step1Categories.set(data); }.bind(this),
      error: function() {}
    });
  }

  onStep1CategoryChange(): void {
    this.step1Form.subCategoryId = '';
    if (!this.step1Form.categoryId) { this.step1SubCategories.set([]); return; }
    this.api.getAssetSubCategoriesList({ typeId: this.step1Form.typeId, categoryId: this.step1Form.categoryId }).subscribe({
      next: function(this: MscoaConfigComponent, data: any[]) { this.step1SubCategories.set(data); }.bind(this),
      error: function() {}
    });
  }

  onStep1DepartmentChange(): void {
    this.step1Form.divisionId = '';
    this.step1Divisions.set([]);
    if (!this.step1Form.departmentId) { return; }
    var deptIdNum = parseInt(this.step1Form.departmentId);
    this.api.getMscoaDivisions(deptIdNum).subscribe({
      next: function(this: MscoaConfigComponent, data: any[]) { this.step1Divisions.set(data); }.bind(this),
      error: function() {}
    });
  }

  isStep1Valid(): boolean {
    return !!(this.step1Form.finYear && this.step1Form.typeId && this.step1Form.measurementTypeId && this.step1Form.departmentId && this.step1Form.divisionId);
  }

  saveStep1(): void {
    if (!this.isStep1Valid()) { this.snackBar.open('Please fill in all required fields', 'OK', { duration: 3000 }); return; }
    this.saving.set(true);
    const payload = {
      finYear: this.step1Form.finYear,
      typeId: parseInt(this.step1Form.typeId) || null,
      categoryId: parseInt(this.step1Form.categoryId) || null,
      subCategoryId: parseInt(this.step1Form.subCategoryId) || null,
      measurementTypeId: parseInt(this.step1Form.measurementTypeId) || null,
      statusId: parseInt(this.step1Form.statusId) || null,
      departmentId: parseInt(this.step1Form.departmentId) || null,
      divisionId: parseInt(this.step1Form.divisionId) || null
    };
    const editId = this.editingId();
    const copyFromId = this.copyingFromId();
    var obs: any;
    if (copyFromId) {
      obs = this.api.copyMscoa(copyFromId, payload);
    } else if (editId) {
      obs = this.api.updateMscoa(editId, payload);
    } else {
      obs = this.api.createMscoa(payload);
    }
    obs.subscribe({
      next: function(this: MscoaConfigComponent, resp: any) {
        this.saving.set(false);
        const id = editId || resp.id;
        this.editingId.set(id);
        this.copyingFromId.set(null);
        const mtId = String(this.step1Form.measurementTypeId);
        const tyId = String(this.step1Form.typeId);
        const catId = String(this.step1Form.categoryId);
        const subCatId = String(this.step1Form.subCategoryId);
        const stId = String(this.step1Form.statusId);
        const deptId = String(this.step1Form.departmentId);
        const divId = String(this.step1Form.divisionId);
        const numMtId = parseInt(this.step1Form.measurementTypeId) || 0;
        const measurementType = this.measurementTypes().find(function(m: any) { return String(m.measurementTypeId) === mtId; });
        const measurementTypeName = measurementType ? (measurementType.measurementTypeDesc || '') : '';
        const assetType = this.assetTypes().find(function(t: any) { return String(t.assetTypeId || t.id) === tyId; });
        const category = this.step1Categories().find(function(c: any) { return String(c.assetCategoryId || c.id) === catId; });
        const subCategory = this.step1SubCategories().find(function(sub: any) { return String(sub.assetSubCategoryId || sub.id) === subCatId; });
        const status = this.statuses().find(function(st: any) { return String(st.assetStatus_ID || st.id) === stId; });
        const dept = this.departments().find(function(d: any) { return String(d.id) === deptId; });
        const div = this.step1Divisions().find(function(d: any) { return String(d.id) === divId; });
        this.currentRecord.set({
          assetConfigMscoaId: id,
          finYear: this.step1Form.finYear,
          typeId: parseInt(this.step1Form.typeId) || null,
          categoryId: parseInt(this.step1Form.categoryId) || null,
          subCategoryId: parseInt(this.step1Form.subCategoryId) || null,
          measurementTypeId: numMtId,
          statusId: parseInt(this.step1Form.statusId) || null,
          departmentId: parseInt(this.step1Form.departmentId) || null,
          divisionId: parseInt(this.step1Form.divisionId) || null,
          typeDesc: assetType ? (assetType.assetTypeDesc || assetType.name || '') : '',
          categoryDesc: category ? (category.assetCategoryDesc || category.name || '') : '',
          subCategoryDesc: subCategory ? (subCategory.assetSubCategoryDesc || subCategory.name || '') : '',
          measurementTypeName: measurementTypeName,
          statusDesc: status ? (status.assetStatusDesc || status.name || '') : '',
          departmentDesc: dept ? (dept.description || '') : '',
          divisionDesc: div ? (div.description || '') : ''
        });
        this.loadStep2(id, numMtId);
      }.bind(this),
      error: function(this: MscoaConfigComponent, err: any) {
        this.saving.set(false);
        const status = err.status || 0;
        if (status === 409) {
          this.snackBar.open(err.error?.error || 'A duplicate mSCOA configuration already exists for this combination.', 'OK', { duration: 6000 });
        } else {
          this.snackBar.open(err.error?.error || 'Save failed', 'OK', { duration: 4000 });
        }
      }.bind(this)
    });
  }

  loadStep2(mscoaId: number, measurementTypeId: number): void {
    this.activeTabIndex.set(0);
    this.scoaItemsMap = {};
    this.projects.set([]);
    this.projectsLoading = false;
    this.buildTabs(measurementTypeId);
    this.api.getMscoaTransactionTypes(mscoaId).subscribe({
      next: function(this: MscoaConfigComponent, data: any[]) {
        this.savedTabMappings = data;
        this.initTabData();
        this.preloadScoaItemsForSavedMappings();
        this.view.set('step2');
        this.ensureProjectsLoaded();
      }.bind(this),
      error: function(this: MscoaConfigComponent) {
        this.savedTabMappings = [];
        this.initTabData();
        this.view.set('step2');
        this.ensureProjectsLoaded();
      }.bind(this)
    });
  }

  ensureProjectsLoaded(): void {
    if (this.projectsLoading || this.projects().length > 0) return;
    this.projectsLoading = true;
    var self = this;
    var finYear = this.step1Form.finYear || (this.currentRecord() ? this.currentRecord().finYear : '');
    this.api.getPlanProjects(finYear).subscribe({
      next: function(data: any[]) { self.projects.set(data); }
    });
  }

  ensureScoaItemsLoaded(tabIndex: number, projectKey: string, projectId: any): void {
    if (!projectId) return;
    var mapKey = tabIndex + '_' + projectKey;
    if (this.scoaItemsMap[mapKey] !== undefined) return;
    var self = this;
    var finYear = this.step1Form.finYear || (this.currentRecord() ? this.currentRecord().finYear : '');
    this.scoaItemsMap[mapKey] = this.emptyScoaItems;
    this.api.getPlanProjectItems(Number(projectId), finYear).subscribe({
      next: function(data: any[]) { self.scoaItemsMap[mapKey] = data; }
    });
  }

  preloadScoaItemsForSavedMappings(): void {
    var self = this;
    var finYear = this.step1Form.finYear || (this.currentRecord() ? this.currentRecord().finYear : '');
    var projectKeys = ['project11','project21','project12','project22','project13','project23','project14','project24','project15','project25'];
    for (var i = 0; i < this.tabData.length; i++) {
      var td = this.tabData[i];
      if (!td) continue;
      for (var j = 0; j < projectKeys.length; j++) {
        var pk = projectKeys[j];
        if (!td[pk]) continue;
        var mapKey = i + '_' + pk;
        if (this.scoaItemsMap[mapKey] !== undefined) continue;
        this.scoaItemsMap[mapKey] = this.emptyScoaItems;
        (function(mk: string, pid: number, fy: string) {
          self.api.getPlanProjectItems(pid, fy).subscribe({
            next: function(data: any[]) { self.scoaItemsMap[mk] = data; }
          });
        })(mapKey, Number(td[pk]), finYear);
      }
    }
  }

  onMscoaProjectChange(tabIndex: number, projectKey: string, voteKey: string, value: string): void {
    this.setTabField(tabIndex, projectKey, value);
    this.setTabField(tabIndex, voteKey, '');
    this.setTabField(tabIndex, projectKey + 'Display', '');
    this.setTabField(tabIndex, voteKey + 'Display', '');
    var mapKey = tabIndex + '_' + projectKey;
    this.scoaItemsMap[mapKey] = this.emptyScoaItems;
    if (value) {
      var self = this;
      var finYear = this.step1Form.finYear || (this.currentRecord() ? this.currentRecord().finYear : '');
      this.api.getPlanProjectItems(Number(value), finYear).subscribe({
        next: function(data: any[]) { self.scoaItemsMap[mapKey] = data; }
      });
    }
  }

  getMscoaScoaItems(tabIndex: number, projectKey: string): any[] {
    var items = this.scoaItemsMap[tabIndex + '_' + projectKey];
    return items !== undefined ? items : this.emptyScoaItems;
  }

  getProjectOptions(tabIndex: number, projectKey: string): any[] {
    if (this.projects().length > 0) return this.projects();
    var td = this.tabData[tabIndex];
    if (!td || !td[projectKey]) return [];
    return [{ projectId: td[projectKey], projectCode: td[projectKey + 'Display'] || String(td[projectKey]), projectName: '' }];
  }

  getScoaOptions(tabIndex: number, projectKey: string, voteKey: string): any[] {
    var items = this.getMscoaScoaItems(tabIndex, projectKey);
    if (items.length > 0) return items;
    var td = this.tabData[tabIndex];
    if (!td || !td[voteKey]) return [];
    return [{ planProjectItemId: td[voteKey], scoaDesc: td[voteKey + 'Display'] || String(td[voteKey]) }];
  }

  buildTabs(measurementTypeId: number): void {
    const defs = this.transactionTypeDefs();
    const tabNames = ['Depreciation', 'Impairment', 'Impairment Reversal', 'Fair Value', 'Revaluation', 'Disposal', 'Asset Unbundling'];
    const builtTabs: TabDef[] = [];
    const enabled: boolean[] = [];

    for (let i = 0; i < tabNames.length; i++) {
      const name = tabNames[i];
      const def = defs.find(function(d: any) { return d.name === name; });
      if (!def) continue;
      const tab: TabDef = {
        name: name,
        transactionTypeId: def.id,
        subType1: def.subType1 || name,
        subType2: def.subType2 || '',
        leftFields: this.buildFieldsForTab(name, measurementTypeId, def, 'left'),
        rightFields: this.buildFieldsForTab(name, measurementTypeId, def, 'right')
      };
      builtTabs.push(tab);
      enabled.push(this.isTabEnabled(name, measurementTypeId));
    }

    this.tabs.set(builtTabs);
    this.enabledTabs.set(enabled);
  }

  isTabEnabled(tabName: string, measurementTypeId: number): boolean {
    if (measurementTypeId === 3) {
      return tabName === 'Fair Value';
    }
    if (measurementTypeId === 2) {
      return tabName === 'Depreciation' || tabName === 'Impairment' || tabName === 'Impairment Reversal' || tabName === 'Disposal' || tabName === 'Asset Unbundling' || tabName === 'Revaluation';
    }
    return tabName === 'Depreciation' || tabName === 'Impairment' || tabName === 'Impairment Reversal' || tabName === 'Disposal' || tabName === 'Asset Unbundling';
  }

  buildFieldsForTab(tabName: string, measurementTypeId: number, def: any, side: string): TabFieldDef[] {
    const fields: TabFieldDef[] = [];
    if (side === 'left') {
      this.addLeftFieldsForTab(tabName, measurementTypeId, def, fields);
    } else {
      this.addRightFieldsForTab(tabName, measurementTypeId, def, fields);
    }
    return fields;
  }

  addLeftFieldsForTab(tabName: string, measurementTypeId: number, def: any, fields: TabFieldDef[]): void {
    if (tabName === 'Depreciation') {
      fields.push({ label: 'Dt SCOA Item – Depreciation (IE)', projectKey: 'project11', voteKey: 'debitItem11_1' });
      if (measurementTypeId === 2) {
        fields.push({ label: 'Ct SCOA Item – Depreciation Offset', projectKey: 'project13', voteKey: 'creditItem13_1' });
        fields.push({ label: 'Dt SCOA Item – Revaluation Reserve', projectKey: 'project12', voteKey: 'creditItem12_1' });
      }
      fields.push({ label: 'Ct SCOA Item – Accumulated Depreciation (IA)', projectKey: 'project14', voteKey: 'creditItem11_1' });
    } else if (tabName === 'Impairment') {
      fields.push({ label: 'Dt SCOA Item – Impairment Loss (Gains & Losses) (IZ)', projectKey: 'project11', voteKey: 'debitItem11_1' });
      if (measurementTypeId === 2) {
        fields.push({ label: 'Dt SCOA Item – Revaluation Reserve', projectKey: 'project13', voteKey: 'creditItem13_1' });
      }
      fields.push({ label: 'Ct SCOA Item – Accumulated Impairment (IA)', projectKey: 'project14', voteKey: 'creditItem11_1' });
    } else if (tabName === 'Impairment Reversal') {
      fields.push({ label: 'Dt SCOA Item – Accumulated Impairment (IA)', projectKey: 'project11', voteKey: 'debitItem11_1' });
      if (measurementTypeId === 2) {
        fields.push({ label: 'Ct SCOA Item – Revaluation Reserve', projectKey: 'project13', voteKey: 'creditItem13_1' });
      }
      fields.push({ label: 'Ct SCOA Item – Reversal of Impairment (Gains & Losses) (IZ)', projectKey: 'project14', voteKey: 'creditItem11_1' });
    } else if (tabName === 'Fair Value') {
      fields.push({ label: 'Dt SCOA Item – Asset Account (IA)', projectKey: 'project11', voteKey: 'debitItem11_1' });
      fields.push({ label: 'Ct SCOA Item – Gains: Fair Value Adjustment (IZ)', projectKey: 'project14', voteKey: 'creditItem11_1' });
    } else if (tabName === 'Revaluation') {
      fields.push({ label: 'Dt SCOA Item – Asset Revaluation', projectKey: 'project11', voteKey: 'debitItem11_1' });
      fields.push({ label: 'Ct SCOA Item – Accumulated Revaluation Disposal', projectKey: 'project12', voteKey: 'debitItem12_1' });
      fields.push({ label: 'Dt SCOA Item – Accumulated Depreciation', projectKey: 'project13', voteKey: 'creditItem13_1' });
      fields.push({ label: 'Ct SCOA Item – Accumulated Surplus for Disposal', projectKey: 'project14', voteKey: 'debitItem11_2' });
      fields.push({ label: 'Ct SCOA Item – Revaluation Reserve', projectKey: 'project15', voteKey: 'creditItem11_1' });
    } else if (tabName === 'Disposal') {
      fields.push({ label: 'Dt SCOA Item – Accumulated Depreciation (IA)', projectKey: 'project11', voteKey: 'debitItem11_1' });
      fields.push({ label: 'Dt SCOA Item – Accumulated Impairment (IA)', projectKey: 'project12', voteKey: 'debitItem12_1' });
      fields.push({ label: 'Dt SCOA Item – Loss on Disposal (IZ)', projectKey: 'project13', voteKey: 'creditItem13_1' });
      fields.push({ label: 'Dt SCOA Item – Disposal Clearing Account (IL)', projectKey: 'project14', voteKey: 'debitItem11_2' });
      fields.push({ label: 'Ct SCOA Item – Asset Disposal Account (IA)', projectKey: 'project15', voteKey: 'creditItem11_1' });
    } else if (tabName === 'Asset Unbundling') {
      fields.push({ label: 'Dt SCOA Item – Debit Asset Acquisition Account (IA)', projectKey: 'project11', voteKey: 'debitItem11_1' });
      fields.push({ label: 'Ct SCOA Item – Credit Work in Progress Account (IA)', projectKey: 'project14', voteKey: 'creditItem11_1' });
    }
  }

  addRightFieldsForTab(tabName: string, measurementTypeId: number, def: any, fields: TabFieldDef[]): void {
    if (tabName === 'Fair Value') {
      fields.push({ label: 'Dt SCOA Item – Losses: Fair Value Adjustment (IZ)', projectKey: 'project21', voteKey: 'debitItem21_1' });
      fields.push({ label: 'Ct SCOA Item – Asset Account (IA)', projectKey: 'project24', voteKey: 'creditItem21_1' });
    } else if (tabName === 'Revaluation') {
      fields.push({ label: 'Dt SCOA Item – Asset Revaluation', projectKey: 'project21', voteKey: 'debitItem21_1' });
      fields.push({ label: 'Ct SCOA Item – Accumulated Revaluation Disposal', projectKey: 'project22', voteKey: 'debitItem22_1' });
      fields.push({ label: 'Dt SCOA Item – Accumulated Depreciation', projectKey: 'project23', voteKey: 'creditItem23_1' });
      fields.push({ label: 'Ct SCOA Item – Revaluation Reserve', projectKey: 'project24', voteKey: 'debitItem21_2' });
      fields.push({ label: 'Ct SCOA Item – Accumulated Surplus for Disposal', projectKey: 'project25', voteKey: 'creditItem21_1' });
    } else if (tabName === 'Disposal') {
      fields.push({ label: 'Dt SCOA Item – Accumulated Depreciation (IA)', projectKey: 'project21', voteKey: 'debitItem21_1' });
      fields.push({ label: 'Dt SCOA Item – Accumulated Impairment (IA)', projectKey: 'project22', voteKey: 'debitItem22_1' });
      fields.push({ label: 'Dt SCOA Item – Gain on Disposal of Asset (IZ)', projectKey: 'project23', voteKey: 'creditItem23_1' });
      fields.push({ label: 'Ct SCOA Item – Disposal Clearing Account (IL)', projectKey: 'project24', voteKey: 'debitItem21_2' });
      fields.push({ label: 'Ct SCOA Item – Asset Disposal Account (Cost) (IA)', projectKey: 'project25', voteKey: 'creditItem21_1' });
    }
  }

  initTabData(): void {
    const tabs = this.tabs();
    this.tabData = [];
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const saved = this.savedTabMappings.find(function(m: any) { return m.transactionTypeId === tab.transactionTypeId; });
      const entry: any = { transactionTypeId: tab.transactionTypeId };
      const allFieldKeys = ['project11','debitItem11_1','debitItem11_2','creditItem11_1',
        'project21','debitItem21_1','debitItem21_2','creditItem21_1',
        'project12','debitItem12_1','creditItem12_1','project22','debitItem22_1',
        'project13','creditItem13_1','project23','creditItem23_1',
        'project14','project24','project15','project25',
        'project11Display','project12Display','project13Display','project14Display','project15Display',
        'project21Display','project22Display','project23Display','project24Display','project25Display',
        'debitItem11_1Display','debitItem11_2Display','creditItem11_1Display',
        'debitItem21_1Display','debitItem21_2Display','creditItem21_1Display',
        'debitItem12_1Display','creditItem12_1Display','debitItem22_1Display',
        'creditItem13_1Display','creditItem23_1Display'];
      for (let j = 0; j < allFieldKeys.length; j++) {
        const k = allFieldKeys[j];
        entry[k] = saved ? (saved[k] || '') : '';
      }
      this.tabData.push(entry);
    }
  }

  getTabData(tabIndex: number): any {
    return this.tabData[tabIndex] || {};
  }

  setTabField(tabIndex: number, key: string, value: string): void {
    if (this.tabData[tabIndex]) {
      this.tabData[tabIndex][key] = value;
    }
  }

  saveCurrentTab(): void {
    const idx = this.activeTabIndex();
    const tab = this.tabs()[idx];
    const td = this.tabData[idx];
    if (!td) return;
    const mscoaId = this.editingId();
    if (!mscoaId) return;
    this.saving.set(true);
    const payload: any = { transactionTypeId: tab.transactionTypeId };
    const fieldKeys = ['project11','debitItem11_1','debitItem11_2','creditItem11_1',
      'project21','debitItem21_1','debitItem21_2','creditItem21_1',
      'project12','debitItem12_1','creditItem12_1','project22','debitItem22_1',
      'project13','creditItem13_1','project23','creditItem23_1',
      'project14','project24','project15','project25'];
    for (let i = 0; i < fieldKeys.length; i++) {
      const k = fieldKeys[i];
      payload[k] = td[k] ? parseInt(td[k]) : null;
    }
    this.api.saveMscoaTransactionType(mscoaId, payload).subscribe({
      next: function(this: MscoaConfigComponent) {
        this.saving.set(false);
        this.snackBar.open('Saved "' + tab.name + '" mapping', 'OK', { duration: 3000 });
        this.api.getMscoaTransactionTypes(mscoaId).subscribe({
          next: function(this: MscoaConfigComponent, data: any[]) { this.savedTabMappings = data; this.initTabData(); }.bind(this),
          error: function() {}
        });
      }.bind(this),
      error: function(this: MscoaConfigComponent, err: any) {
        this.saving.set(false);
        this.snackBar.open(err.error?.error || 'Save failed', 'OK', { duration: 4000 });
      }.bind(this)
    });
  }

  confirmDelete(item: any): void {
    if (!confirm('Delete mSCOA settings for "' + (item.typeDesc || '') + ' / ' + (item.categoryDesc || '') + '"?')) return;
    this.api.deleteMscoa(item.assetConfigMscoaId).subscribe({
      next: function(this: MscoaConfigComponent) { this.loadList(); this.snackBar.open('Deleted', 'OK', { duration: 3000 }); }.bind(this),
      error: function(this: MscoaConfigComponent, err: any) { this.snackBar.open(err.error?.error || 'Delete failed', 'OK', { duration: 4000 }); }.bind(this)
    });
  }

  backToList(): void {
    this.copyingFromId.set(null);
    this.view.set('list');
    this.loadList();
  }

  onTabChange(index: number): void {
    this.activeTabIndex.set(index);
  }

  isCurrentTabEnabled(): boolean {
    const enabled = this.enabledTabs();
    const idx = this.activeTabIndex();
    return enabled[idx] !== false;
  }

  getTabClass(index: number): string {
    const enabled = this.enabledTabs();
    return enabled[index] ? 'tab-enabled' : 'tab-disabled';
  }

  getMeasurementTypeDisplayName(item: any): string {
    if (!item) return '—';
    var id = Number(item.measurementTypeId || item.MeasurementType_ID || 0);
    if (id) {
      var types = this.measurementTypes();
      for (var i = 0; i < types.length; i++) {
        if (Number(types[i].measurementTypeId) === id) {
          return types[i].measurementTypeDesc || types[i].measurementTypeName || '—';
        }
      }
      var staticNames: any = { 1: 'Cost Module', 2: 'Revaluation Module', 3: 'Fair Value Module', 4: 'Leased Assets' };
      if (staticNames[id]) return staticNames[id];
    }
    return item.measurementTypeName || '—';
  }

  getMtypeClass(item: any): string {
    var name = typeof item === 'string' ? item : this.getMeasurementTypeDisplayName(item);
    if (!name || name === '—') return 'mtype-badge mtype-other';
    const lower = name.toLowerCase();
    if (lower.indexOf('cost') >= 0) return 'mtype-badge mtype-cost';
    if (lower.indexOf('revaluation') >= 0) return 'mtype-badge mtype-revaluation';
    if (lower.indexOf('fair') >= 0) return 'mtype-badge mtype-fairvalue';
    if (lower.indexOf('lease') >= 0) return 'mtype-badge mtype-leased';
    return 'mtype-badge mtype-other';
  }

  isTabSaved(transactionTypeId: number): boolean {
    for (let i = 0; i < this.savedTabMappings.length; i++) {
      if (this.savedTabMappings[i].transactionTypeId === transactionTypeId) return true;
    }
    return false;
  }
}
