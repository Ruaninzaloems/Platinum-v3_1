import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DatabaseToggleService, DatabaseBackend } from './database-toggle.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient, private dbToggle: DatabaseToggleService) {}

  get apiPrefix(): string {
    return this.dbToggle.apiPrefix;
  }

  getTableUrl(tableKey: string): string {
    return this.dbToggle.getTableUrl(tableKey);
  }

  get activeBackend(): DatabaseBackend {
    return this.dbToggle.activeBackend();
  }

  setBackend(backend: DatabaseBackend): void {
    this.dbToggle.setBackend(backend);
  }

  getAssetTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/asset-types`);
  }
  getAssetType(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiPrefix}/asset-types/${id}`);
  }
  createAssetType(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-types`, data);
  }
  updateAssetType(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/asset-types/${id}`, data);
  }
  deleteAssetType(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/asset-types/${id}`);
  }
  importAssetTypes(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/asset-types/import`, fd);
  }
  downloadAssetTypeTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/asset-types/import-template`, { responseType: 'blob' });
  }

  getAssetStatuses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/asset-statuses`);
  }
  createAssetStatus(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-statuses`, data);
  }
  updateAssetStatus(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/asset-statuses/${id}`, data);
  }
  deleteAssetStatus(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/asset-statuses/${id}`);
  }
  importAssetStatuses(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/asset-statuses/import`, fd);
  }
  downloadAssetStatusTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/asset-statuses/import-template`, { responseType: 'blob' });
  }

  getAssetCategoriesList(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(key) { if (params[key] !== null && params[key] !== undefined) { httpParams = httpParams.set(key, params[key]); } }); }
    return this.http.get<any[]>(`${this.apiPrefix}/asset-categories`, { params: httpParams });
  }
  createAssetCategory(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-categories`, data);
  }
  updateAssetCategory(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/asset-categories/${id}`, data);
  }
  deleteAssetCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/asset-categories/${id}`);
  }
  importAssetCategories(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/asset-categories/import`, fd);
  }
  downloadAssetCategoryTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/asset-categories/import-template`, { responseType: 'blob' });
  }

  getAssetSubCategoriesList(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(key) { if (params[key] !== null && params[key] !== undefined) { httpParams = httpParams.set(key, params[key]); } }); }
    return this.http.get<any[]>(`${this.apiPrefix}/asset-sub-categories`, { params: httpParams });
  }
  createAssetSubCategory(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-sub-categories`, data);
  }
  updateAssetSubCategory(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/asset-sub-categories/${id}`, data);
  }
  deleteAssetSubCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/asset-sub-categories/${id}`);
  }
  importAssetSubCategories(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/asset-sub-categories/import`, fd);
  }
  downloadAssetSubCategoryTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/asset-sub-categories/import-template`, { responseType: 'blob' });
  }

  getAssetProjectStatuses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/asset-project-statuses`);
  }
  createAssetProjectStatus(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-project-statuses`, data);
  }
  updateAssetProjectStatus(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/asset-project-statuses/${id}`, data);
  }
  deleteAssetProjectStatus(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/asset-project-statuses/${id}`);
  }

  getMonths(): Observable<any[]> {
    return this.http.get<any[]>(`${this.getTableUrl('months')}`);
  }

  getConstFundingSources(finYear?: string): Observable<any[]> {
    let params = new HttpParams();
    if (finYear) params = params.set('finYear', finYear);
    return this.http.get<any[]>(`${this.getTableUrl('funding-sources')}`, { params });
  }
  createConstFundingSource(data: any): Observable<any> {
    return this.http.post(`${this.getTableUrl('funding-sources')}`, data);
  }
  updateConstFundingSource(id: number, data: any): Observable<any> {
    return this.http.put(`${this.getTableUrl('funding-sources')}/${id}`, data);
  }
  deleteConstFundingSource(id: number): Observable<any> {
    return this.http.delete(`${this.getTableUrl('funding-sources')}/${id}`);
  }

  getDocumentTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.getTableUrl('document-types')}`);
  }
  getDocumentTypeById(id: number): Observable<any> {
    return this.http.get<any>(`${this.getTableUrl('document-types')}/${id}`);
  }

  getPropertyTypesOfUse(): Observable<any[]> {
    return this.http.get<any[]>(`${this.getTableUrl('property-types-of-use')}`);
  }
  getPropertyTypeOfUseById(id: number): Observable<any> {
    return this.http.get<any>(`${this.getTableUrl('property-types-of-use')}/${id}`);
  }

  getScoaStructure(tableId?: string): Observable<any[]> {
    let params = new HttpParams();
    if (tableId) params = params.set('tableId', tableId);
    return this.http.get<any[]>(`${this.getTableUrl('scoa-structure')}`, { params });
  }
  getScoaStructureById(id: number): Observable<any> {
    return this.http.get<any>(`${this.getTableUrl('scoa-structure')}/${id}`);
  }

  getUserProcessingMonths(userId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (userId !== undefined && userId !== null) params = params.set('userId', userId.toString());
    return this.http.get<any[]>(`${this.getTableUrl('user-processing-months')}`, { params });
  }
  getUserProcessingMonthById(id: number): Observable<any> {
    return this.http.get<any>(`${this.getTableUrl('user-processing-months')}/${id}`);
  }
  getCurrentUserProcessingMonth(userId: number): Observable<any> {
    let params = new HttpParams().set('userId', userId.toString());
    return this.http.get<any>(`${this.getTableUrl('user-processing-months')}/current`, { params });
  }
  setCurrentUserProcessingMonth(userId: number, data: any): Observable<any> {
    let params = new HttpParams().set('userId', userId.toString());
    return this.http.post(`${this.getTableUrl('user-processing-months')}/current`, data, { params });
  }
  createUserProcessingMonth(data: any): Observable<any> {
    return this.http.post(`${this.getTableUrl('user-processing-months')}`, data);
  }
  updateUserProcessingMonth(id: number, data: any): Observable<any> {
    return this.http.put(`${this.getTableUrl('user-processing-months')}/${id}`, data);
  }

  getInvTransfers(finYear?: string): Observable<any[]> {
    let params = new HttpParams();
    if (finYear) params = params.set('finYear', finYear);
    return this.http.get<any[]>(`${this.getTableUrl('inv-transfers')}`, { params });
  }
  getInvTransferById(id: number): Observable<any> {
    return this.http.get<any>(`${this.getTableUrl('inv-transfers')}/${id}`);
  }

  getScmTransfers(finYear?: string): Observable<any[]> {
    let params = new HttpParams();
    if (finYear) params = params.set('finYear', finYear);
    return this.http.get<any[]>(`${this.getTableUrl('scm-transfers')}`, { params });
  }
  getScmTransferById(id: number): Observable<any> {
    return this.http.get<any>(`${this.getTableUrl('scm-transfers')}/${id}`);
  }

  getScmInvoiceDetails(invoiceId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (invoiceId !== undefined && invoiceId !== null) params = params.set('invoiceId', invoiceId.toString());
    return this.http.get<any[]>(`${this.getTableUrl('scm-invoice-details')}`, { params });
  }
  getScmInvoiceDetailById(id: number): Observable<any> {
    return this.http.get<any>(`${this.getTableUrl('scm-invoice-details')}/${id}`);
  }

  getScmContractDetailItems(): Observable<any[]> {
    return this.http.get<any[]>(`${this.getTableUrl('scm-contract-detail-items')}`);
  }
  getScmContractDetailItemById(id: number): Observable<any> {
    return this.http.get<any>(`${this.getTableUrl('scm-contract-detail-items')}/${id}`);
  }
  createScmContractDetailItem(data: any): Observable<any> {
    return this.http.post(`${this.getTableUrl('scm-contract-detail-items')}`, data);
  }
  updateScmContractDetailItem(id: number, data: any): Observable<any> {
    return this.http.put(`${this.getTableUrl('scm-contract-detail-items')}/${id}`, data);
  }
  deleteScmContractDetailItem(id: number): Observable<any> {
    return this.http.delete(`${this.getTableUrl('scm-contract-detail-items')}/${id}`);
  }

  getScmUnbundlingHeaders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.getTableUrl('scm-unbundling-headers')}`);
  }
  getScmUnbundlingHeaderById(id: number): Observable<any> {
    return this.http.get<any>(`${this.getTableUrl('scm-unbundling-headers')}/${id}`);
  }
  createScmUnbundlingHeader(data: any): Observable<any> {
    return this.http.post(`${this.getTableUrl('scm-unbundling-headers')}`, data);
  }
  updateScmUnbundlingHeader(id: number, data: any): Observable<any> {
    return this.http.put(`${this.getTableUrl('scm-unbundling-headers')}/${id}`, data);
  }
  deleteScmUnbundlingHeader(id: number): Observable<any> {
    return this.http.delete(`${this.getTableUrl('scm-unbundling-headers')}/${id}`);
  }

  getScmUnbundlingDetails(): Observable<any[]> {
    return this.http.get<any[]>(`${this.getTableUrl('scm-unbundling-details')}`);
  }
  getScmUnbundlingDetailById(id: number): Observable<any> {
    return this.http.get<any>(`${this.getTableUrl('scm-unbundling-details')}/${id}`);
  }
  createScmUnbundlingDetail(data: any): Observable<any> {
    return this.http.post(`${this.getTableUrl('scm-unbundling-details')}`, data);
  }
  updateScmUnbundlingDetail(id: number, data: any): Observable<any> {
    return this.http.put(`${this.getTableUrl('scm-unbundling-details')}/${id}`, data);
  }
  deleteScmUnbundlingDetail(id: number): Observable<any> {
    return this.http.delete(`${this.getTableUrl('scm-unbundling-details')}/${id}`);
  }

  getAssetClassesList(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(key) { if (params[key] !== null && params[key] !== undefined && params[key] !== '') { httpParams = httpParams.set(key, params[key]); } }); }
    return this.http.get<any>(`${this.apiPrefix}/asset-classes`, { params: httpParams });
  }
  createAssetClass(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-classes`, data);
  }
  updateAssetClass(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/asset-classes/${id}`, data);
  }
  deleteAssetClass(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/asset-classes/${id}`);
  }
  importAssetClasses(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/asset-classes/import`, fd);
  }
  downloadAssetClassTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/asset-classes/import-template`, { responseType: 'blob' });
  }

  getMeasurementTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/measurement-types`);
  }
  createMeasurementType(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/measurement-types`, data);
  }
  updateMeasurementType(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/measurement-types/${id}`, data);
  }
  deleteMeasurementType(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/measurement-types/${id}`);
  }
  importMeasurementTypes(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/measurement-types/import`, fd);
  }
  downloadMeasurementTypeTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/measurement-types/import-template`, { responseType: 'blob' });
  }

  getCriticalityGrades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/criticality-grades`);
  }
  createCriticalityGrade(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/criticality-grades`, data);
  }
  updateCriticalityGrade(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/criticality-grades/${id}`, data);
  }
  deleteCriticalityGrade(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/criticality-grades/${id}`);
  }
  importCriticalityGrades(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/criticality-grades/import`, fd);
  }
  downloadCriticalityGradeTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/criticality-grades/import-template`, { responseType: 'blob' });
  }

  getHealthGrades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/health-grades`);
  }
  createHealthGrade(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/health-grades`, data);
  }
  updateHealthGrade(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/health-grades/${id}`, data);
  }
  deleteHealthGrade(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/health-grades/${id}`);
  }
  importHealthGrades(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/health-grades/import`, fd);
  }
  downloadHealthGradeTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/health-grades/import-template`, { responseType: 'blob' });
  }

  getPerformanceGrades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/performance-grades`);
  }
  createPerformanceGrade(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/performance-grades`, data);
  }
  updatePerformanceGrade(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/performance-grades/${id}`, data);
  }
  deletePerformanceGrade(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/performance-grades/${id}`);
  }
  importPerformanceGrades(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/performance-grades/import`, fd);
  }
  downloadPerformanceGradeTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/performance-grades/import-template`, { responseType: 'blob' });
  }

  getUtilisationGrades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/utilisation-grades`);
  }
  createUtilisationGrade(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/utilisation-grades`, data);
  }
  updateUtilisationGrade(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/utilisation-grades/${id}`, data);
  }
  deleteUtilisationGrade(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/utilisation-grades/${id}`);
  }
  importUtilisationGrades(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/utilisation-grades/import`, fd);
  }
  downloadUtilisationGradeTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/utilisation-grades/import-template`, { responseType: 'blob' });
  }

  getDepreciationMethods(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/asset-depreciation-methods`);
  }

  getCidmsAccountingGroups(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/cidms-accounting-groups`);
  }
  createCidmsAccountingGroup(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/cidms-accounting-groups`, data);
  }
  updateCidmsAccountingGroup(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/cidms-accounting-groups/${id}`, data);
  }
  deleteCidmsAccountingGroup(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/cidms-accounting-groups/${id}`);
  }
  importCidmsAccountingGroups(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/cidms-accounting-groups/import`, fd);
  }
  downloadCidmsAccountingGroupTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/cidms-accounting-groups/import-template`, { responseType: 'blob' });
  }

  getCidmsAccountingSubGroups(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/cidms-accounting-sub-groups`);
  }
  createCidmsAccountingSubGroup(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/cidms-accounting-sub-groups`, data);
  }
  updateCidmsAccountingSubGroup(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/cidms-accounting-sub-groups/${id}`, data);
  }
  deleteCidmsAccountingSubGroup(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/cidms-accounting-sub-groups/${id}`);
  }
  importCidmsAccountingSubGroups(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/cidms-accounting-sub-groups/import`, fd);
  }
  downloadCidmsAccountingSubGroupTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/cidms-accounting-sub-groups/import-template`, { responseType: 'blob' });
  }

  getCidmsMunicipalServices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/cidms-municipal-services`);
  }
  createCidmsMunicipalService(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/cidms-municipal-services`, data);
  }
  updateCidmsMunicipalService(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/cidms-municipal-services/${id}`, data);
  }
  deleteCidmsMunicipalService(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/cidms-municipal-services/${id}`);
  }
  importCidmsMunicipalServices(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/cidms-municipal-services/import`, fd);
  }
  downloadCidmsMunicipalServiceTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/cidms-municipal-services/import-template`, { responseType: 'blob' });
  }

  getCidmsClasses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/cidms-classes`);
  }
  createCidmsClass(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/cidms-classes`, data);
  }
  updateCidmsClass(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/cidms-classes/${id}`, data);
  }
  deleteCidmsClass(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/cidms-classes/${id}`);
  }
  importCidmsClasses(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/cidms-classes/import`, fd);
  }
  downloadCidmsClassTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/cidms-classes/import-template`, { responseType: 'blob' });
  }

  getCidmsGroupTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/cidms-group-types`);
  }
  createCidmsGroupType(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/cidms-group-types`, data);
  }
  updateCidmsGroupType(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/cidms-group-types/${id}`, data);
  }
  deleteCidmsGroupType(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/cidms-group-types/${id}`);
  }
  importCidmsGroupTypes(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/cidms-group-types/import`, fd);
  }
  downloadCidmsGroupTypeTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/cidms-group-types/import-template`, { responseType: 'blob' });
  }

  getCidmsAssetTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/cidms-asset-types`);
  }
  createCidmsAssetType(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/cidms-asset-types`, data);
  }
  updateCidmsAssetType(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/cidms-asset-types/${id}`, data);
  }
  deleteCidmsAssetType(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/cidms-asset-types/${id}`);
  }
  importCidmsAssetTypes(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/cidms-asset-types/import`, fd);
  }
  downloadCidmsAssetTypeTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/cidms-asset-types/import-template`, { responseType: 'blob' });
  }

  getCidmsComponentTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/cidms-component-types`);
  }
  createCidmsComponentType(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/cidms-component-types`, data);
  }
  updateCidmsComponentType(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/cidms-component-types/${id}`, data);
  }
  deleteCidmsComponentType(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/cidms-component-types/${id}`);
  }
  importCidmsComponentTypes(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/cidms-component-types/import`, fd);
  }
  downloadCidmsComponentTypeTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/cidms-component-types/import-template`, { responseType: 'blob' });
  }

  getCidmsSubComponentTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/cidms-sub-component-types`);
  }
  createCidmsSubComponentType(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/cidms-sub-component-types`, data);
  }
  updateCidmsSubComponentType(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/cidms-sub-component-types/${id}`, data);
  }
  deleteCidmsSubComponentType(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/cidms-sub-component-types/${id}`);
  }
  importCidmsSubComponentTypes(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/cidms-sub-component-types/import`, fd);
  }
  downloadCidmsSubComponentTypeTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/cidms-sub-component-types/import-template`, { responseType: 'blob' });
  }

  getAssets(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get(`${this.apiPrefix}/asset-register-items`, { params: httpParams });
  }

  getAsset(id: string | number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/asset-register-items/${id}`);
  }

  getCategories(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/asset-categories`);
  }

  getWipProjects(params?: { finYear?: string; status?: string }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.finYear) httpParams = httpParams.set('finYear', params.finYear);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    return this.http.get(`${this.apiPrefix}/wip-register-items`, { params: httpParams });
  }

  getWipProject(id: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/wip-register-items/${id}`);
  }

  createWipProject(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/wip-register-items`, data);
  }

  updateWipProject(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/wip-register-items/${id}`, data);
  }

  patchWipMainDescription(id: number, mainAssetDescription: string): Observable<any> {
    return this.http.patch(`${this.apiPrefix}/wip-register-items/${id}/main-description`, { mainAssetDescription });
  }

  deleteWipProject(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/wip-register-items/${id}`);
  }

  syncScmDetails(): Observable<any> {
    return this.http.post(`${this.apiPrefix}/wip-register-items/sync-scm`, {});
  }

  getWipDetails(wipRegisterId: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/wip-register-details/by-wip-register/${wipRegisterId}`);
  }

  createWipDetail(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/wip-register-details`, data);
  }

  updateWipDetail(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/wip-register-details/${id}`, data);
  }

  deleteWipDetail(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/wip-register-details/${id}`);
  }

  getWipRegisterItems(wipRegisterId: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/asset-wip-register-items`, { params: new HttpParams().set('wipRegisterId', wipRegisterId) });
  }

  getWipScmBoqSeed(wipId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/wip-register-items/${wipId}/scm-boq-seed`);
  }

  createWipRegisterItem(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-wip-register-items`, data);
  }

  updateWipRegisterItem(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/asset-wip-register-items/${id}`, data);
  }

  deleteWipRegisterItem(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/asset-wip-register-items/${id}`);
  }

  getWipDocuments(wipId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/wip-register-items/${wipId}/documents`);
  }

  uploadWipDocument(wipId: number, data: { documentType: string; documentName: string; fileDataBase64: string; mimeType: string; fileSizeKB: number }): Observable<any> {
    return this.http.post(`${this.apiPrefix}/wip-register-items/${wipId}/documents`, data);
  }

  downloadWipDocument(wipId: number, docId: number): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/wip-register-items/${wipId}/documents/${docId}/download`, { responseType: 'blob' });
  }

  deleteWipDocument(wipId: number, docId: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/wip-register-items/${wipId}/documents/${docId}`);
  }

  getCidmsSubComponentTypeChain(id: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/cidms-sub-component-types/${id}/chain`);
  }

  getCidmsResolveUpper(params: {
    componentTypeId?: number; accountingGroupId?: number; subAccountingGroupId?: number;
    classId?: number; groupTypeId?: number; assetTypeId?: number; subComponentTypeId?: number;
  }): Observable<any> {
    var parts: string[] = [];
    if (params.componentTypeId) { parts.push('componentTypeId=' + params.componentTypeId); }
    if (params.accountingGroupId) { parts.push('accountingGroupId=' + params.accountingGroupId); }
    if (params.subAccountingGroupId) { parts.push('subAccountingGroupId=' + params.subAccountingGroupId); }
    if (params.classId) { parts.push('classId=' + params.classId); }
    if (params.groupTypeId) { parts.push('groupTypeId=' + params.groupTypeId); }
    if (params.assetTypeId) { parts.push('assetTypeId=' + params.assetTypeId); }
    if (params.subComponentTypeId) { parts.push('subComponentTypeId=' + params.subComponentTypeId); }
    return this.http.get(`${this.apiPrefix}/cidms-sub-component-types/resolve-upper?` + parts.join('&'));
  }

  getWipCostDistribution(wipId: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/wip-register-items/${wipId}/cost-distribution`);
  }

  saveWipActualSurvey(wipId: number, surveyData: { [key: string]: number }): Observable<any> {
    return this.http.post(`${this.apiPrefix}/wip-register-items/${wipId}/save-actual-survey`, { surveyData });
  }

  approveWipUnbundling(wipId: number, data?: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/wip-register-items/${wipId}/approve`, data || {});
  }

  declineWipUnbundling(wipId: number, comment: string): Observable<any> {
    return this.http.post(`${this.apiPrefix}/wip-register-items/${wipId}/decline`, { comment });
  }

  submitWipForApproval(wipId: number): Observable<any> {
    return this.http.post(`${this.apiPrefix}/wip-register-items/${wipId}/submit-for-approval`, {});
  }

  commissionWip(wipId: number): Observable<any> {
    return this.http.post(`${this.apiPrefix}/wip-register-items/${wipId}/commission`, {});
  }

  declineWipCommission(wipId: number, comment: string): Observable<any> {
    return this.http.post(`${this.apiPrefix}/wip-register-items/${wipId}/decline-commission`, { comment });
  }

  getWipGeneratedAssets(wipId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/wip-register-items/${wipId}/generated-assets`);
  }

  uploadWipAssetList(wipId: number, rows: any[]): Observable<any> {
    return this.http.post(`${this.apiPrefix}/wip-register-items/${wipId}/upload-asset-list`, rows);
  }

  getAssetFunding(assetRegisterItemId: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/asset-register-funding/by-asset/${assetRegisterItemId}`);
  }

  createAssetFunding(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-register-funding`, data);
  }

  updateAssetFunding(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/asset-register-funding/${id}`, data);
  }

  deleteAssetFunding(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/asset-register-funding/${id}`);
  }

  getWipFunding(wipRegisterId: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/wip-register-funding/by-wip-register/${wipRegisterId}`);
  }

  createWipFunding(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/wip-register-funding`, data);
  }

  updateWipFunding(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/wip-register-funding/${id}`, data);
  }

  deleteWipFunding(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/wip-register-funding/${id}`);
  }

  getVendors(): Observable<any[]> {
    return this.http.get<any[]>(this.dbToggle.getTableUrl('vendors'));
  }

  getWipProjectStatuses(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/wip-project-statuses`);
  }

  getWipFundingSources(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/wip-funding-sources`);
  }

  getWipFundingTypes(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/wip-funding-types`);
  }

  getFinancialYears(): Observable<any[]> {
    return this.http.get<any[]>(this.dbToggle.getTableUrl('fin-years'));
  }

  getDefaultFinancialYear(): Observable<any> {
    return this.http.get(this.dbToggle.getTableUrl('fin-years') + '/default');
  }

  getWipItems(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/wip-register-items`);
  }

  getWipItem(id: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/wip-register-items/${id}`);
  }

  getMaintenanceRequests(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.serviceGroupId) httpParams = httpParams.set('serviceGroupId', params.serviceGroupId);
      if (params.isApproved !== undefined && params.isApproved !== null && params.isApproved !== '') httpParams = httpParams.set('isApproved', params.isApproved);
      if (params.dateFrom) httpParams = httpParams.set('dateFrom', params.dateFrom);
      if (params.dateTo) httpParams = httpParams.set('dateTo', params.dateTo);
    }
    return this.http.get(`${this.apiPrefix}/maintenance-requests`, { params: httpParams });
  }
  getMaintenanceRequest(id: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/maintenance-requests/${id}`);
  }
  createMaintenanceRequest(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/maintenance-requests`, data);
  }
  updateMaintenanceRequest(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/maintenance-requests/${id}`, data);
  }
  deleteMaintenanceRequest(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/maintenance-requests/${id}`);
  }
  getMaintenanceLeadTimes(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/maintenance-lead-times`);
  }
  getAllMaintenanceLeadTimes(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/maintenance-lead-times?includeDisabled=true`);
  }
  createLeadTime(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/maintenance-lead-times`, data);
  }
  updateLeadTime(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/maintenance-lead-times/${id}`, data);
  }
  getMaintenanceServiceGroups(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/maintenance-service-groups`);
  }
  getAllMaintenanceServiceGroups(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/maintenance-service-groups?includeDisabled=true`);
  }
  createServiceGroup(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/maintenance-service-groups`, data);
  }
  updateServiceGroup(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/maintenance-service-groups/${id}`, data);
  }
  getMaintenanceWorkOrders(requestId: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/maintenance-work-orders/by-request/${requestId}`);
  }
  createMaintenanceWorkOrder(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/maintenance-work-orders`, data);
  }
  updateMaintenanceWorkOrder(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/maintenance-work-orders/${id}`, data);
  }
  deleteMaintenanceWorkOrder(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/maintenance-work-orders/${id}`);
  }
  getMaintenanceWorkOrderDetails(workOrderId: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/maintenance-work-order-details/by-work-order/${workOrderId}`);
  }
  createMaintenanceWorkOrderDetail(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/maintenance-work-order-details`, data);
  }
  updateMaintenanceWorkOrderDetail(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/maintenance-work-order-details/${id}`, data);
  }
  deleteMaintenanceWorkOrderDetail(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/maintenance-work-order-details/${id}`);
  }

  getDepartments(): Observable<any> {
    return this.http.get(this.dbToggle.getTableUrl('departments'));
  }

  getDivisions(): Observable<any[]> {
    return this.http.get<any[]>(this.dbToggle.getTableUrl('divisions'));
  }

  getLocations(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/locations`);
  }

  getConfigSettings(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/config-settings`);
  }

  getDepreciation(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k]) httpParams = httpParams.set(k, params[k]); });
    return this.http.get(`${this.apiPrefix}/depreciation/calculate`, { params: httpParams });
  }

  getDepreciationByDays(params: { assetId?: string; fromDate?: string; toDate?: string }): Observable<any> {
    let httpParams = new HttpParams();
    if (params.assetId) httpParams = httpParams.set('assetId', params.assetId);
    if (params.fromDate) httpParams = httpParams.set('fromDate', params.fromDate);
    if (params.toDate) httpParams = httpParams.set('toDate', params.toDate);
    return this.http.get(`${this.apiPrefix}/depreciation/calculate-days`, { params: httpParams });
  }

  getLastDepreciationDate(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/workflows/last-depreciation-date`);
  }

  getAssetTransactions(assetId: string): Observable<any> {
    return this.http.get(`${this.apiPrefix}/workflows/transactions/${assetId}`);
  }

  getAssetScheduleSummary(assetId: string | number, finYear?: string): Observable<any> {
    var params: any = {};
    if (finYear) params.finYear = finYear;
    return this.http.get(`${this.apiPrefix}/asset-register-items/${assetId}/schedule-summary`, { params: params });
  }

  getAllTransactions(params?: { type?: string; from?: string; to?: string; limit?: number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.type) httpParams = httpParams.set('type', params.type);
    if (params?.from) httpParams = httpParams.set('from', params.from);
    if (params?.to) httpParams = httpParams.set('to', params.to);
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get(`${this.apiPrefix}/workflows/transactions`, { params: httpParams });
  }

  getDashboard(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/analytics/dashboard`);
  }
  clearTestData(): Observable<any> {
    return this.http.post(`${this.apiPrefix}/admin/clear-test-data`, {});
  }

  getInsights(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k]) httpParams = httpParams.set(k, params[k]); });
    return this.http.get(`${this.apiPrefix}/analytics/insights`, { params: httpParams });
  }

  dismissInsight(id: string): Observable<any> {
    return this.http.patch(`${this.apiPrefix}/analytics/insights/${id}/dismiss`, {});
  }

  getPendingWorkflows(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/workflows/pending`);
  }

  getPendingCount(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/workflows/pending-count`);
  }

  getAllWorkflows(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/workflows/all`);
  }

  getWorkflowStats(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/workflows/stats`);
  }

  getWorkflowInstance(id: string): Observable<any> {
    return this.http.get(`${this.apiPrefix}/workflows/instance/${id}`);
  }

  workflowAction(id: string, action: string, comments: string): Observable<any> {
    return this.http.post(`${this.apiPrefix}/workflows/action/${id}`, { action, comments });
  }

  initiateWorkflow(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/workflows/initiate`, data);
  }

  getAuditTrail(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k]) httpParams = httpParams.set(k, params[k]); });
    return this.http.get(`${this.apiPrefix}/audit`, { params: httpParams });
  }

  getSettings(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/settings`);
  }

  updateSettings(data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/settings`, data);
  }

  getNextRunCutoff(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/settings/next-run-cutoff`);
  }

  getUsers(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/auth/users`);
  }

  getRoles(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/auth/roles`);
  }

  getFleetTrips(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k]) httpParams = httpParams.set(k, params[k]); });
    return this.http.get(`${this.apiPrefix}/fleet-ext/trips`, { params: httpParams });
  }

  createTrip(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/fleet-ext/trips`, data);
  }

  getFleetBookings(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/fleet-ext/bookings`);
  }

  getFarReport(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(key) { if (params[key] !== null && params[key] !== undefined) { httpParams = httpParams.set(key, params[key]); } }); }
    return this.http.get(`${this.apiPrefix}/reports/far`, { params: httpParams });
  }

  getDisposalMethods(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/reports/disposal-methods`);
  }

  getDisposalReport(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(key) { if (params[key] !== null && params[key] !== undefined) { httpParams = httpParams.set(key, params[key]); } }); }
    return this.http.get(`${this.apiPrefix}/reports/disposal-report`, { params: httpParams });
  }

  getFarDrilldown(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(function(key) { if (params[key] !== null && params[key] !== undefined) { httpParams = httpParams.set(key, params[key]); } });
    return this.http.get(`${this.apiPrefix}/reports/far-drilldown`, { params: httpParams });
  }

  getDepreciationScheduleReport(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(key) { if (params[key] !== null && params[key] !== undefined && params[key] !== '') { httpParams = httpParams.set(key, params[key]); } }); }
    return this.http.get(`${this.apiPrefix}/reports/depreciation-schedule`, { params: httpParams });
  }

  getRevaluationReport(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(key) { if (params[key] !== null && params[key] !== undefined && params[key] !== '') { httpParams = httpParams.set(key, params[key]); } }); }
    return this.http.get<any[]>(`${this.apiPrefix}/reports/revaluation-report`, { params: httpParams });
  }

  getImpairmentReport(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(key) { if (params[key] !== null && params[key] !== undefined && params[key] !== '') { httpParams = httpParams.set(key, params[key]); } }); }
    return this.http.get<any[]>(`${this.apiPrefix}/reports/impairment-report`, { params: httpParams });
  }

  getImpairmentReversalReport(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(key) { if (params[key] !== null && params[key] !== undefined && params[key] !== '') { httpParams = httpParams.set(key, params[key]); } }); }
    return this.http.get<any[]>(`${this.apiPrefix}/reports/impairment-reversal-report`, { params: httpParams });
  }

  getRefurbishmentReport(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(key) { if (params[key] !== null && params[key] !== undefined && params[key] !== '') { httpParams = httpParams.set(key, params[key]); } }); }
    return this.http.get<any[]>(`${this.apiPrefix}/reports/refurbishment-report`, { params: httpParams });
  }

  getPriorYearAdjustmentsReport(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(key) { if (params[key] !== null && params[key] !== undefined && params[key] !== '') { httpParams = httpParams.set(key, params[key]); } }); }
    return this.http.get<any[]>(`${this.apiPrefix}/reports/prior-year-adjustments-report`, { params: httpParams });
  }

  getPriorPeriodAdjustmentsReport(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(key) { if (params[key] !== null && params[key] !== undefined && params[key] !== '') { httpParams = httpParams.set(key, params[key]); } }); }
    return this.http.get<any[]>(`${this.apiPrefix}/reports/prior-period-adjustments-report`, { params: httpParams });
  }

  getFarTransactionDrilldown(params: { assetId: number; period: number; finYear?: string }): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('assetId', params.assetId);
    httpParams = httpParams.set('period', params.period);
    if (params.finYear) httpParams = httpParams.set('finYear', params.finYear);
    return this.http.get(`${this.apiPrefix}/reports/far-transaction-drilldown`, { params: httpParams });
  }

  getReconciliation(params: { finYear?: string; fromPeriod?: number; toPeriod?: number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params.finYear) httpParams = httpParams.set('finYear', params.finYear);
    if (params.fromPeriod) httpParams = httpParams.set('fromPeriod', String(params.fromPeriod));
    if (params.toPeriod) httpParams = httpParams.set('toPeriod', String(params.toPeriod));
    return this.http.get(`${this.apiPrefix}/reports/reconciliation`, { params: httpParams });
  }

  getReconciliationAssetTxns(params: { transactionTypeId: number; finYear?: string; fromPeriod?: number; toPeriod?: number; isOffset?: boolean }): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('transactionTypeId', String(params.transactionTypeId));
    if (params.finYear) httpParams = httpParams.set('finYear', params.finYear);
    if (params.fromPeriod) httpParams = httpParams.set('fromPeriod', String(params.fromPeriod));
    if (params.toPeriod) httpParams = httpParams.set('toPeriod', String(params.toPeriod));
    if (params.isOffset) httpParams = httpParams.set('isOffset', 'true');
    return this.http.get(`${this.apiPrefix}/reports/reconciliation/asset-transactions`, { params: httpParams });
  }

  getReconciliationGlTxns(params: { transactionTypeId: number; finYear?: string; fromPeriod?: number; toPeriod?: number; isOffset?: boolean }): Observable<any> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('transactionTypeId', String(params.transactionTypeId));
    if (params.finYear) httpParams = httpParams.set('finYear', params.finYear);
    if (params.fromPeriod) httpParams = httpParams.set('fromPeriod', String(params.fromPeriod));
    if (params.toPeriod) httpParams = httpParams.set('toPeriod', String(params.toPeriod));
    if (params.isOffset) httpParams = httpParams.set('isOffset', 'true');
    return this.http.get(`${this.apiPrefix}/reports/reconciliation/gl-transactions`, { params: httpParams });
  }

  getFinancialSummary(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/financial-summary`);
  }

  getCategoryTotals(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/category-totals`);
  }

  getRevaluationSummary(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/revaluation-summary`);
  }

  getImportBatches(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/import/batches`);
  }

  validateImport(data: { fileName: string; rows: any[] }): Observable<any> {
    return this.http.post(`${this.apiPrefix}/import/validate`, data);
  }

  commitImport(batchId: number): Observable<any> {
    return this.http.post(`${this.apiPrefix}/import/commit/${batchId}`, {});
  }

  downloadImportTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/import/template`, { responseType: 'blob' });
  }

  downloadBulkUploadTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/bulk-upload/template`, { responseType: 'blob' });
  }

  createAsset(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-register-items`, data);
  }

  rebuildTransactionSummary(assetIds: number[], finYear: string): Observable<any> {
    return this.http.post(`${this.apiPrefix}/admin/populate-transaction-summary`, { AssetIds: assetIds, FinYear: finYear, FinPeriod: 1 });
  }

  updateAsset(assetId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/asset-register-items/${assetId}`, data);
  }

  getFinancialStatuses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/asset-register-items/lookups/financial-statuses`);
  }

  getAssetConditions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/asset-conditions`);
  }
  createAssetCondition(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-conditions`, data);
  }
  updateAssetCondition(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/asset-conditions/${id}`, data);
  }
  deleteAssetCondition(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/asset-conditions/${id}`);
  }
  importAssetConditions(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/asset-conditions/import`, fd);
  }
  downloadAssetConditionTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/asset-conditions/import-template`, { responseType: 'blob' });
  }

  getComponentTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/component-types`);
  }
  createComponentType(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/component-types`, data);
  }
  updateComponentType(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/component-types/${id}`, data);
  }
  deleteComponentType(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/component-types/${id}`);
  }
  importComponentTypes(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/component-types/import`, fd);
  }
  downloadComponentTypeTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/component-types/import-template`, { responseType: 'blob' });
  }

  getTransactionTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/asset-config-transaction-types`);
  }
  createTransactionType(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-config-transaction-types`, data);
  }
  updateTransactionType(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/asset-config-transaction-types/${id}`, data);
  }
  deleteTransactionType(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/asset-config-transaction-types/${id}`);
  }
  importTransactionTypes(file: File): Observable<any> {
    const fd = new FormData(); fd.append('file', file);
    return this.http.post(`${this.apiPrefix}/asset-config-transaction-types/import`, fd);
  }
  downloadTransactionTypeTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/asset-config-transaction-types/import-template`, { responseType: 'blob' });
  }

  getUploadTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/bulk-upload/upload-types`);
  }
  uploadBulkFile(file: File, uploadType: number, progressKey?: string): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('uploadType', uploadType.toString());
    if (progressKey) fd.append('progressKey', progressKey);
    return this.http.post(`${this.apiPrefix}/bulk-upload/upload`, fd);
  }
  getBulkUploadJobs(uploadType?: number): Observable<any[]> {
    var params = uploadType != null ? '?uploadType=' + uploadType : '';
    return this.http.get<any[]>(`${this.apiPrefix}/bulk-upload/jobs` + params);
  }
  getBulkUploadJob(id: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/bulk-upload/jobs/${id}`);
  }
  getBulkUploadErrors(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/bulk-upload/jobs/${id}/errors`);
  }
  downloadBulkUploadFile(id: number): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/bulk-upload/jobs/${id}/download`, { responseType: 'blob' });
  }
  exportBulkUploadErrors(id: number): Observable<Blob> {
    return this.http.get(`${this.apiPrefix}/bulk-upload/jobs/${id}/errors/export`, { responseType: 'blob' });
  }
  getUploadedItems(financialYear?: string): Observable<any[]> {
    const params = financialYear ? '?financialYear=' + encodeURIComponent(financialYear) : '';
    return this.http.get<any[]>(`${this.apiPrefix}/bulk-upload/uploaded-items` + params);
  }
  getUploadedItemsByRun(runId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/bulk-upload/uploaded-items/${runId}`);
  }
  approveBulkUpload(id: number, financialYear: string): Observable<any> {
    return this.http.post(`${this.apiPrefix}/bulk-upload/jobs/${id}/approve`, { financialYear });
  }
  rejectBulkUpload(id: number): Observable<any> {
    return this.http.post(`${this.apiPrefix}/bulk-upload/jobs/${id}/reject`, {});
  }
  getBulkUploadProgress(key: string): Observable<any> {
    return this.http.get(`${this.apiPrefix}/bulk-upload/progress/` + encodeURIComponent(key));
  }

  uploadBulkFileWip(file: File, progressKey?: string): Observable<any> {
    var fd = new FormData();
    fd.append('file', file);
    fd.append('uploadType', '2');
    if (progressKey) fd.append('progressKey', progressKey);
    return this.http.post(`${this.apiPrefix}/bulk-upload/upload`, fd);
  }
  getWipJobs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/bulk-upload/jobs?uploadType=2`);
  }
  getWipTransferFinancialYears(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiPrefix}/wip-transfers/financial-years`);
  }
  getWipTransferProjects(finYear: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/wip-transfers/projects?finYear=` + encodeURIComponent(finYear));
  }
  getWipTransferScoaItems(projectId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/wip-transfers/scoa-items?projectId=` + projectId);
  }
  validateWipTransferAssetId(assetId: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/wip-transfers/validate-asset?assetId=` + assetId);
  }
  approveWipTransfer(jobId: number, body: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/bulk-upload/jobs/${jobId}/approve-wip`, body);
  }

  getImpairments(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(k) { if (params[k]) httpParams = httpParams.set(k, params[k]); }); }
    return this.http.get<any[]>(`${this.apiPrefix}/asset-impairments`, { params: httpParams });
  }
  createImpairment(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-impairments`, data);
  }
  getImpairmentDetail(id: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/asset-impairments/` + id + '/detail');
  }
  getDisposalDetail(id: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/disposals/` + id + '/detail');
  }
  getRevaluationDetail(id: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/asset-revaluations/` + id + '/detail');
  }
  approveImpairment(id: number, approvedBy: number): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-impairments/` + id + '/approve', { approvedBy: approvedBy });
  }
  rejectImpairment(id: number): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-impairments/` + id + '/reject', {});
  }
  approveImpairmentReversal(id: number, approvedBy: number): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-impairments/` + id + '/approve-reversal', { approvedBy: approvedBy });
  }
  rejectImpairmentReversal(id: number, reason?: string): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-impairments/` + id + '/reject-reversal', { reason: reason || '' });
  }
  getImpairmentReserveBasis(assetId: number): Observable<{ originalPnL: number; originalReserve: number }> {
    return this.http.get<{ originalPnL: number; originalReserve: number }>(`${this.apiPrefix}/asset-impairments/asset/` + assetId + '/reserve-basis');
  }
  correctImpairmentGl(id: number): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-impairments/` + id + '/correct-gl', {});
  }
  createImpairmentPosting(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-impairment-postings`, data);
  }

  getRevaluations(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(k) { if (params[k]) httpParams = httpParams.set(k, params[k]); }); }
    return this.http.get<any[]>(`${this.apiPrefix}/asset-revaluations`, { params: httpParams });
  }
  createRevaluation(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-revaluations`, data);
  }
  approveRevaluation(id: number, approvedBy: number, usefulLife?: number): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-revaluations/` + id + '/approve', { approvedBy: approvedBy, usefulLife: usefulLife || 0 });
  }
  rejectRevaluation(id: number): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-revaluations/` + id + '/reject', {});
  }

  getDisposals(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(k) { if (params[k]) httpParams = httpParams.set(k, params[k]); }); }
    return this.http.get<any[]>(`${this.apiPrefix}/disposals`, { params: httpParams });
  }
  getAssetLastDepDate(assetRegId: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/disposals/asset-last-dep-date/` + assetRegId);
  }
  createDisposal(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/disposals`, data);
  }
  submitDisposalForApproval(id: number): Observable<any> {
    return this.http.post(`${this.apiPrefix}/disposals/` + id + '/submit-for-approval', {});
  }
  approveDisposal(id: number, approvedBy: number, comments?: string): Observable<any> {
    return this.http.post(`${this.apiPrefix}/disposals/` + id + '/approve', { approvedBy: approvedBy, comments: comments || '' });
  }

  getDepreciationRecords(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(k) { if (params[k]) httpParams = httpParams.set(k, params[k]); }); }
    return this.http.get<any[]>(`${this.apiPrefix}/depreciation`, { params: httpParams });
  }
  getDepreciationSchedules(finYear?: string): Observable<any[]> {
    let httpParams = new HttpParams();
    if (finYear) httpParams = httpParams.set('finYear', finYear);
    return this.http.get<any[]>(`${this.apiPrefix}/depreciation/schedules`, { params: httpParams });
  }
  runDepreciationBatch(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/depreciation/run`, data);
  }
  approveDepreciationBatch(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/depreciation/approve`, data);
  }
  rebuildDepSummaries(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/depreciation/rebuild-summaries`, data);
  }
  getDepRebuildProgress(key: string): Observable<any> {
    return this.http.get(`${this.apiPrefix}/depreciation/rebuild-progress/${key}`);
  }
  getDepreciationScheduleDetails(scheduleId: number, ids?: string, itemId?: number): Observable<any[]> {
    let httpParams = new HttpParams();
    if (ids) httpParams = httpParams.set('ids', ids);
    if (itemId) httpParams = httpParams.set('itemId', String(itemId));
    return this.http.get<any[]>(`${this.apiPrefix}/depreciation/schedule-items/` + scheduleId + '/details', { params: httpParams });
  }
  exportDepreciationScheduleDetails(scheduleId: number, itemId?: number): string {
    var url = `${this.apiPrefix}/depreciation/schedule-items/` + scheduleId + '/export';
    if (itemId) url = url + '?itemId=' + itemId;
    return url;
  }
  getDepreciationScheduleById(scheduleId: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/depreciation/schedules/` + scheduleId);
  }
  depreciateAsset(assetId: number, data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/depreciation/assets/` + assetId + '/depreciate', data);
  }
  calculateDepreciationDays(assetId: number, fromDate?: string, toDate?: string): Observable<any> {
    let httpParams = new HttpParams().set('assetId', String(assetId));
    if (fromDate) httpParams = httpParams.set('fromDate', fromDate);
    if (toDate) httpParams = httpParams.set('toDate', toDate);
    return this.http.get(`${this.apiPrefix}/depreciation/calculate-days`, { params: httpParams });
  }
  rejectDisposal(id: number, reason?: string): Observable<any> {
    return this.http.post(`${this.apiPrefix}/disposals/` + id + '/reject', { reason: reason || '' });
  }
  getRefurbishments(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(k) { if (params[k]) httpParams = httpParams.set(k, params[k]); }); }
    return this.http.get<any[]>(`${this.apiPrefix}/refurbishments`, { params: httpParams });
  }
  createRefurbishment(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/refurbishments`, data);
  }
  getRefurbishmentDetail(id: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/refurbishments/` + id + '/detail');
  }
  approveRefurbishment(id: number, approvedBy: number): Observable<any> {
    return this.http.post(`${this.apiPrefix}/refurbishments/` + id + '/approve', { approvedBy: approvedBy });
  }
  rejectRefurbishment(id: number, reason?: string): Observable<any> {
    return this.http.post(`${this.apiPrefix}/refurbishments/` + id + '/reject', { reason: reason || '' });
  }
  validateGlPosting(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/gl-validation/validate`, data);
  }
  validateDepreciationScheduleGl(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/gl-validation/validate-schedule`, data);
  }
  validateDepreciationPreRun(data: { finYear: string }): Observable<any> {
    return this.http.post(`${this.apiPrefix}/gl-validation/validate-pre-run`, data);
  }
  rejectDepreciationSchedule(scheduleId: number): Observable<any> {
    return this.http.post(`${this.apiPrefix}/depreciation/schedules/${scheduleId}/reject`, {});
  }
  recalculateAfterRejection(data: { assetId: number; finYear: string; afterDate: Date; rejectedTransactionType: string }): Observable<any> {
    return this.http.post(`${this.apiPrefix}/automated/recalculate-after-rejection`, data);
  }
  checkMonthEnd(finYear: string, period: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/month-end/check`, { params: new HttpParams().set('finYear', finYear).set('period', String(period)) });
  }
  runMonthEnd(data: { finYear: string; period: number }): Observable<any> {
    return this.http.post(`${this.apiPrefix}/month-end/run`, data);
  }
  createMonthlyApproval(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/monthly-approval`, data);
  }
  checkMonthlyApproval(finYear: string, period: number): Observable<any> {
    return this.http.get(`${this.apiPrefix}/monthly-approval/check`, { params: new HttpParams().set('finYear', finYear).set('period', String(period)) });
  }
  getMonthlyApprovals(finYear?: string): Observable<any[]> {
    var params = new HttpParams();
    if (finYear) params = params.set('finYear', finYear);
    return this.http.get<any[]>(`${this.apiPrefix}/monthly-approval`, { params });
  }
  getMinTransactionDate(): Observable<any> {
    return this.http.get(`${this.apiPrefix}/monthly-approval/min-transaction-date`);
  }

  getMscoaFinYears(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiPrefix}/asset-config-mscoa/fin-years`);
  }
  getMscoaDepartments(): Observable<any[]> {
    return this.http.get<any[]>(this.dbToggle.getTableUrl('departments'));
  }
  getMscoaDivisions(departmentId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (departmentId) params = params.set('departmentId', departmentId.toString());
    return this.http.get<any[]>(this.dbToggle.getTableUrl('divisions'), { params });
  }
  getMscoaTransactionTypeDefs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/asset-config-mscoa/transaction-type-defs`);
  }
  getMscoaVotes(finYear: string): Observable<any[]> {
    return this.http.get<any[]>(this.dbToggle.getTableUrl('led-votes'), { params: new HttpParams().set('finYear', finYear) });
  }
  getMscoaProjects(finYear: string): Observable<any[]> {
    return this.http.get<any[]>(this.dbToggle.getTableUrl('plan-projects'), { params: new HttpParams().set('finYear', finYear) });
  }
  getMscoaList(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(key) { if (params[key] !== null && params[key] !== undefined && params[key] !== '') { httpParams = httpParams.set(key, params[key]); } }); }
    return this.http.get<any[]>(`${this.apiPrefix}/asset-config-mscoa`, { params: httpParams });
  }
  getMscoaById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiPrefix}/asset-config-mscoa/${id}`);
  }
  createMscoa(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-config-mscoa`, data);
  }
  copyMscoa(sourceId: number, data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-config-mscoa/${sourceId}/copy`, data);
  }
  updateMscoa(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiPrefix}/asset-config-mscoa/${id}`, data);
  }
  deleteMscoa(id: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/asset-config-mscoa/${id}`);
  }
  getMscoaTransactionTypes(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/asset-config-mscoa/${id}/transaction-types`);
  }
  saveMscoaTransactionType(id: number, data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/asset-config-mscoa/${id}/transaction-types`, data);
  }
  deleteMscoaTransactionType(ttId: number): Observable<any> {
    return this.http.delete(`${this.apiPrefix}/asset-config-mscoa/transaction-types/${ttId}`);
  }

  getUnitOfIssues(): Observable<any[]> {
    return this.http.get<any[]>(`${this.getTableUrl('unit-of-issue')}`);
  }

  getPlanProjects(finYear?: string): Observable<any[]> {
    let params = new HttpParams();
    if (finYear) params = params.set('finYear', finYear);
    return this.http.get<any[]>(`${this.getTableUrl('plan-projects')}`, { params });
  }

  getPlanProjectItems(projectId: number, finYear?: string): Observable<any[]> {
    let params = new HttpParams().set('projectId', projectId);
    if (finYear) params = params.set('finYear', finYear);
    return this.http.get<any[]>(`${this.getTableUrl('plan-project-items')}/scoa`, { params });
  }

  getCidmsHierarchy(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/cidms-sub-component-types/with-hierarchy`);
  }

  approveWip(id: number, comment: string, approverId: number): Observable<any> {
    return this.http.post(`${this.apiPrefix}/wip-register-items/${id}/approve`, { comment, approverId });
  }

  declineWip(id: number, comment: string): Observable<any> {
    return this.http.post(`${this.apiPrefix}/wip-register-items/${id}/decline`, { comment });
  }

  generateWipAssetList(id: number): Observable<any> {
    return this.http.post(`${this.apiPrefix}/wip-register-items/${id}/generate-asset-list`, {});
  }

  getScmContracts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.getTableUrl('scm-contracts')}`);
  }

  getScmContract(id: number): Observable<any> {
    return this.http.get(`${this.getTableUrl('scm-contracts')}/${id}`);
  }

  getScmContractUnbundlingItems(contractId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.getTableUrl('scm-contracts')}/${contractId}/unbundling-items`);
  }

  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(this.dbToggle.getTableUrl('employees'));
  }

  getVerificationLookupTowns(): Observable<any[]> {
    return this.http.get<any[]>(this.dbToggle.getTableUrl('towns'));
  }
  getVerificationLookupSuburbs(townId?: number): Observable<any[]> {
    var params = new HttpParams();
    if (townId) params = params.set('townId', String(townId));
    return this.http.get<any[]>(this.dbToggle.getTableUrl('suburbs'), { params });
  }
  getVerificationLookupWards(): Observable<any[]> {
    return this.http.get<any[]>(this.dbToggle.getTableUrl('wards'));
  }
  getVerificationLookupStreets(suburbId?: number): Observable<any[]> {
    var params = new HttpParams();
    if (suburbId) params = params.set('suburbId', String(suburbId));
    return this.http.get<any[]>(this.dbToggle.getTableUrl('streets'), { params });
  }
  getVerificationLookupBuildings(streetId?: number): Observable<any[]> {
    var params = new HttpParams();
    if (streetId) params = params.set('streetId', String(streetId));
    return this.http.get<any[]>(this.dbToggle.getTableUrl('buildings'), { params });
  }
  getVerificationLookupFloors(buildingId?: number): Observable<any[]> {
    var params = new HttpParams();
    if (buildingId) params = params.set('buildingId', String(buildingId));
    return this.http.get<any[]>(this.dbToggle.getTableUrl('floors'), { params });
  }
  getVerificationLookupRooms(floorId?: number): Observable<any[]> {
    var params = new HttpParams();
    if (floorId) params = params.set('floorId', String(floorId));
    return this.http.get<any[]>(this.dbToggle.getTableUrl('rooms'), { params });
  }
  getVerificationLookupOwnerships(): Observable<any[]> {
    return this.http.get<any[]>('/api/verification-registers/lookups/ownerships');
  }
  getVerificationLookupDivisions(): Observable<any[]> {
    return this.http.get<any[]>(this.dbToggle.getTableUrl('divisions'));
  }
  getVerificationLookupDepartments(): Observable<any[]> {
    return this.http.get<any[]>(this.dbToggle.getTableUrl('departments'));
  }

  getVerificationRegisters(params?: { isHistory?: number }): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params && params.isHistory !== undefined) httpParams = httpParams.set('isHistory', String(params.isHistory));
    return this.http.get<any[]>('/api/verification-registers', { params: httpParams });
  }

  getVerificationRegister(id: number): Observable<any> {
    return this.http.get('/api/verification-registers/' + id);
  }

  getVerificationReport(params: { registerId: number; reportType: string; assetClassIds?: number[] }): Observable<any[]> {
    let httpParams = new HttpParams()
      .set('registerId', String(params.registerId))
      .set('reportType', params.reportType);
    if (params.assetClassIds && params.assetClassIds.length > 0) {
      httpParams = httpParams.set('assetClassIds', params.assetClassIds.join(','));
    }
    return this.http.get<any[]>('/api/verification-registers/report', { params: httpParams });
  }

  generateVerificationName(registerType: string): Observable<any> {
    return this.http.get('/api/verification-registers/generate-name', { params: new HttpParams().set('registerType', registerType) });
  }

  getVerificationPreviewItems(params: any): Observable<any[]> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(function(k) { if (params[k] !== null && params[k] !== undefined && params[k] !== '') { httpParams = httpParams.set(k, params[k]); } });
    return this.http.get<any[]>('/api/verification-registers/preview-items', { params: httpParams });
  }

  createVerificationRegister(data: any): Observable<any> {
    return this.http.post('/api/verification-registers', data);
  }

  createVerificationItems(registerId: number, assetIds: number[]): Observable<any> {
    return this.http.post('/api/verification-registers/' + registerId + '/create-items', assetIds);
  }

  moveVerificationToHistory(id: number): Observable<any> {
    return this.http.post('/api/verification-registers/' + id + '/move-to-history', {});
  }

  deleteVerificationRegister(id: number): Observable<any> {
    return this.http.delete('/api/verification-registers/' + id);
  }

  getRegisterTeamMembers(registerId: number): Observable<any[]> {
    return this.http.get<any[]>('/api/verification-registers/' + registerId + '/team-members');
  }

  addRegisterTeamMember(registerId: number, member: any): Observable<any> {
    return this.http.post('/api/verification-registers/' + registerId + '/team-members', member);
  }

  removeRegisterTeamMember(registerId: number, memberId: number): Observable<any> {
    return this.http.delete('/api/verification-registers/' + registerId + '/team-members/' + memberId);
  }

  syncPlanTeam(registerId: number, planId: number): Observable<any> {
    return this.http.post('/api/verification-registers/' + registerId + '/sync-plan-team/' + planId, {});
  }

  getRegisterDashboardStats(registerId: number): Observable<any> {
    return this.http.get<any>('/api/verification-registers/' + registerId + '/dashboard-stats');
  }

  getVerificationItems(registerId: number, params?: { tab?: string; search?: string }): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params?.tab) httpParams = httpParams.set('tab', params.tab);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<any[]>('/api/verification-items/by-register/' + registerId, { params: httpParams });
  }

  getVerificationItem(id: number): Observable<any> {
    return this.http.get('/api/verification-items/' + id);
  }

  updateVerificationItem(id: number, data: any): Observable<any> {
    return this.http.put('/api/verification-items/' + id, data);
  }

  submitVerificationItems(itemIds: number[]): Observable<any> {
    return this.http.post('/api/verification-items/submit', itemIds);
  }

  approveVerificationItems(itemIds: number[]): Observable<any> {
    return this.http.post('/api/verification-items/approve', itemIds);
  }

  backToManageVerificationItems(data: { itemIds: number[]; reason: string }): Observable<any> {
    return this.http.post('/api/verification-items/back-to-manage', data);
  }

  getVerificationAuditTrail(itemId: number): Observable<any[]> {
    return this.http.get<any[]>('/api/verification-items/' + itemId + '/audit-trail');
  }

  getAssetVerificationAuditTrail(assetId: string): Observable<any[]> {
    return this.http.get<any[]>('/api/assets/' + assetId + '/verification-audit-trail');
  }

  matchCsvAssets(values: string[]): Observable<any[]> {
    return this.http.post<any[]>('/api/verification-registers/match-csv-assets', values);
  }

  exportVerificationCsv(registerId: number): Observable<Blob> {
    return this.http.get('/api/verification-items/by-register/' + registerId + '/export-csv', { responseType: 'blob' });
  }

  importVerificationCsv(registerId: number, file: File): Observable<any> {
    var formData = new FormData();
    formData.append('file', file);
    return this.http.post('/api/verification-items/by-register/' + registerId + '/import-csv', formData);
  }

  getVerificationMapItems(registerId: number, statusFilter?: string): Observable<any[]> {
    var params = new HttpParams();
    if (statusFilter) params = params.set('statusFilter', statusFilter);
    return this.http.get<any[]>('/api/verification-items/by-register/' + registerId + '/map-items', { params });
  }

  getVerificationPlans(params?: any): Observable<any[]> {
    var httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(key: string) { if (params[key] !== null && params[key] !== undefined && params[key] !== '') { httpParams = httpParams.set(key, params[key]); } }); }
    return this.http.get<any[]>('/api/verification-plans', { params: httpParams });
  }

  getVerificationPlan(id: number): Observable<any> {
    return this.http.get('/api/verification-plans/' + id);
  }

  createVerificationPlan(data: any): Observable<any> {
    return this.http.post('/api/verification-plans', data);
  }

  amendVerificationPlan(id: number, data: any): Observable<any> {
    return this.http.put('/api/verification-plans/' + id + '/amend', data);
  }

  approveVerificationPlan(id: number, data: any): Observable<any> {
    return this.http.post('/api/verification-plans/' + id + '/approve', data);
  }

  deleteVerificationPlan(id: number): Observable<any> {
    return this.http.delete('/api/verification-plans/' + id);
  }

  getVerificationPlanTeamMembers(planId: number): Observable<any[]> {
    return this.http.get<any[]>('/api/verification-plans/' + planId + '/team-members');
  }

  addVerificationPlanTeamMember(planId: number, data: any): Observable<any> {
    return this.http.post('/api/verification-plans/' + planId + '/team-members', data);
  }

  removeVerificationPlanTeamMember(planId: number, memberId: number): Observable<any> {
    return this.http.delete('/api/verification-plans/' + planId + '/team-members/' + memberId);
  }

  getVerificationPlanApprovals(planId: number): Observable<any[]> {
    return this.http.get<any[]>('/api/verification-plans/' + planId + '/approvals');
  }

  getVerificationPlanAuditTrail(planId: number): Observable<any[]> {
    return this.http.get<any[]>('/api/verification-plans/' + planId + '/audit-trail');
  }

  getVerificationPlanExport(planId: number): Observable<any> {
    return this.http.get('/api/verification-plans/' + planId + '/export');
  }

  uploadDocument(file: File, entityType: string, entityId: string, description?: string): Observable<any> {
    var formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', entityType);
    formData.append('entity_id', entityId);
    if (description) formData.append('description', description);
    return this.http.post('/api/documents/upload', formData);
  }

  getDocuments(entityType: string, entityId: string): Observable<any[]> {
    return this.http.get<any[]>('/api/documents/' + entityType + '/' + entityId);
  }

  downloadDocument(id: number): void {
    window.open('/api/documents/download/' + id, '_blank');
  }

  deleteDocument(id: number): Observable<any> {
    return this.http.delete('/api/documents/' + id);
  }

  getRoomsWithAssets(): Observable<any[]> {
    return this.http.get<any[]>('/api/reports/rooms-with-assets');
  }

  getLocationContentReport(filters?: { fromRoom?: string | null; toRoom?: string | null; custodianId?: number | null; departmentId?: number | null; divisionId?: number | null }): Observable<any[]> {
    var params: any = {};
    if (filters) {
      if (filters.fromRoom) params['fromRoom'] = filters.fromRoom;
      if (filters.toRoom) params['toRoom'] = filters.toRoom;
      if (filters.custodianId != null) params['custodianId'] = filters.custodianId;
      if (filters.departmentId != null) params['departmentId'] = filters.departmentId;
      if (filters.divisionId != null) params['divisionId'] = filters.divisionId;
    }
    return this.http.get<any[]>('/api/reports/location-content', { params });
  }

  getLocationContentFilters(): Observable<any> {
    return this.http.get<any>('/api/reports/location-content-filters');
  }

  getPriorYearAdjustmentTypes(): Observable<any[]> {
    return this.http.get<any[]>('/api/prior-year-adjustments/types');
  }

  searchAssetsForPriorYear(params: any): Observable<any[]> {
    return this.http.get<any[]>('/api/prior-year-adjustments/search', { params });
  }

  calculatePriorYearAdjustment(body: any): Observable<any> {
    return this.http.post<any>('/api/prior-year-adjustments/calculate', body);
  }

  submitPriorYearAdjustment(body: any): Observable<any> {
    return this.http.post<any>('/api/prior-year-adjustments/submit', body);
  }

  getPriorYearAdjustments(params?: any): Observable<any[]> {
    return this.http.get<any[]>('/api/prior-year-adjustments', { params });
  }

  getPriorYearAdjustmentById(id: number): Observable<any> {
    return this.http.get<any>('/api/prior-year-adjustments/' + id);
  }

  approvePriorYearAdjustment(id: number, body: any): Observable<any> {
    return this.http.post<any>('/api/prior-year-adjustments/' + id + '/approve', body);
  }

  rejectPriorYearAdjustment(id: number, body: any): Observable<any> {
    return this.http.post<any>('/api/prior-year-adjustments/' + id + '/reject', body);
  }

  uploadPriorYearDocument(id: number, file: File): Observable<any> {
    var form = new FormData();
    form.append('file', file);
    return this.http.post<any>('/api/prior-year-adjustments/' + id + '/documents', form);
  }

  downloadPriorYearDocument(id: number, docId: number): void {
    window.open('/api/prior-year-adjustments/' + id + '/documents/' + docId + '/download', '_blank');
  }

  getPriorYearDocuments(id: number): Observable<any[]> {
    return this.http.get<any[]>('/api/prior-year-adjustments/' + id + '/documents');
  }

  exportPriorYearTransactions(id: number): void {
    window.open('/api/prior-year-adjustments/' + id + '/transactions/export', '_blank');
  }

  getBulkTransactionTemplate(type: string): Observable<Blob> {
    return this.http.get('/api/bulk-transactions/template/' + type, { responseType: 'blob' });
  }

  downloadBulkTransactionTemplate(type: string): void {
    window.open('/api/bulk-transactions/template/' + type, '_blank');
  }

  uploadBulkTransactions(file: File, transactionType: string): Observable<any> {
    var fd = new FormData();
    fd.append('file', file);
    fd.append('transactionType', transactionType);
    return this.http.post<any>('/api/bulk-transactions/upload', fd);
  }

  getBulkTransactionJobs(): Observable<any[]> {
    return this.http.get<any[]>('/api/bulk-transactions/jobs');
  }

  getBulkTransactionJobItems(jobId: number, type?: string): Observable<any> {
    var params = type ? '?type=' + type : '';
    return this.http.get<any>('/api/bulk-transactions/jobs/' + jobId + '/items' + params);
  }

  approveBulkTransactionJob(jobId: number): Observable<any> {
    return this.http.post<any>('/api/bulk-transactions/jobs/' + jobId + '/approve', {});
  }

  rejectBulkTransactionJob(jobId: number, reason: string): Observable<any> {
    return this.http.post<any>('/api/bulk-transactions/jobs/' + jobId + '/reject', { reason: reason });
  }

  downloadBulkRefurbTemplate(): void {
    window.open('/api/bulk-refurb/template', '_blank');
  }

  uploadBulkRefurb(file: File): Observable<any> {
    var fd = new FormData();
    fd.append('file', file);
    return this.http.post<any>('/api/bulk-refurb/upload', fd);
  }

  getBulkRefurbJobs(): Observable<any[]> {
    return this.http.get<any[]>('/api/bulk-refurb/jobs');
  }

  getBulkRefurbJobItems(jobId: number): Observable<any> {
    return this.http.get<any>('/api/bulk-refurb/jobs/' + jobId + '/items');
  }

  approveBulkRefurbJob(jobId: number): Observable<any> {
    return this.http.post<any>('/api/bulk-refurb/jobs/' + jobId + '/approve', {});
  }

  rejectBulkRefurbJob(jobId: number, reason: string): Observable<any> {
    return this.http.post<any>('/api/bulk-refurb/jobs/' + jobId + '/reject', { reason: reason });
  }

  getPriorPeriodAdjustmentTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/prior-period-adjustments/types`);
  }

  getPriorPeriodAvailablePeriods(): Observable<any> {
    return this.http.get<any>(`${this.apiPrefix}/prior-period-adjustments/periods`);
  }

  getPriorPeriodEligiblePeriods(finYear?: string): Observable<any> {
    var params: any = {};
    if (finYear) params['finYear'] = finYear;
    return this.http.get<any>(`${this.apiPrefix}/prior-period-adjustments/eligible-periods`, { params });
  }

  getPriorPeriodPending(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/prior-period-adjustments/pending`);
  }

  searchAssetsForPriorPeriod(params: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/prior-period-adjustments/search`, { params });
  }

  getPriorPeriodDownstreamImpact(assetId: number, finYear: string, targetPeriod: number): Observable<any> {
    return this.http.get<any>(`${this.apiPrefix}/prior-period-adjustments/downstream-impact`, {
      params: { assetRegisterItemId: assetId, finYear: finYear, targetPeriod: targetPeriod }
    });
  }

  submitPriorPeriodAdjustment(body: any): Observable<any> {
    return this.http.post<any>(`${this.apiPrefix}/prior-period-adjustments/submit`, body);
  }

  getPriorPeriodAdjustments(params?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/prior-period-adjustments`, { params });
  }

  getPriorPeriodAdjustmentById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiPrefix}/prior-period-adjustments/${id}`);
  }

  approvePriorPeriodAdjustment(id: number, body: any): Observable<any> {
    return this.http.post<any>(`${this.apiPrefix}/prior-period-adjustments/${id}/approve`, body);
  }

  rejectPriorPeriodAdjustment(id: number, body: any): Observable<any> {
    return this.http.post<any>(`${this.apiPrefix}/prior-period-adjustments/${id}/reject`, body);
  }

  getScmInvoicesForAcquisition(): Observable<any[]> {
    return this.http.get<any[]>(`${this.getTableUrl('scm-transfers')}/pending`);
  }

  getInventoryItemsForAcquisition(): Observable<any[]> {
    return this.http.get<any[]>(`${this.getTableUrl('inv-transfers')}/pending`);
  }

  getAcquisitionsList(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiPrefix}/acquisitions`);
  }

  createScmAcquisition(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/acquisitions/scm`, data);
  }

  createInventoryAcquisition(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/acquisitions/inventory`, data);
  }

  createDonationAcquisition(data: any): Observable<any> {
    return this.http.post(`${this.apiPrefix}/acquisitions/donation`, data);
  }

  getAssetApprovals(params?: any): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params) { Object.keys(params).forEach(function(key) { if (params[key] !== null && params[key] !== undefined) { httpParams = httpParams.set(key, params[key]); } }); }
    return this.http.get<any[]>(`${this.apiPrefix}/asset-approvals`, { params: httpParams });
  }

  getAssetApprovalById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiPrefix}/asset-approvals/${id}`);
  }

  approveAssetApproval(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiPrefix}/asset-approvals/${id}/approve`, {});
  }

  rejectAssetApproval(id: number, reason: string): Observable<any> {
    return this.http.post<any>(`${this.apiPrefix}/asset-approvals/${id}/reject`, { reason });
  }

  getCommodities(): Observable<any[]> {
    return this.http.get<any[]>(this.dbToggle.getTableUrl('commodities'));
  }

  getAfsReconciliation(params: { finYear: string }): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params.finYear) httpParams = httpParams.set('finYear', params.finYear);
    return this.http.get<any[]>(`${this.apiPrefix}/reports/afs-reconciliation`, { params: httpParams });
  }

  getAfsReconciliationDrilldown(params: { finYear: string; categoryId: number }): Observable<any[]> {
    let httpParams = new HttpParams();
    if (params.finYear) httpParams = httpParams.set('finYear', params.finYear);
    httpParams = httpParams.set('categoryId', params.categoryId);
    return this.http.get<any[]>(`${this.apiPrefix}/reports/afs-reconciliation/drilldown`, { params: httpParams });
  }
}
