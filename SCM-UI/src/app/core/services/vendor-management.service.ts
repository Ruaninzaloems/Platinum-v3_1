import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { PagedResult, ApiListParams } from '../models';
import {
  VendorManagementConfig, VendorDocument, DocumentChecklist,
  VendorDirector, DirectorResponse, VendorAccreditation,
  VendorProfessionalRegistration, VendorDiscountDetail,
  VendorRegistration, VendorStatusChange, CsdSearchResult,
  DiversitySummary, DocumentExpiryAlert
} from '../models/vendor-management.model';

@Injectable({ providedIn: 'root' })
export class VendorManagementService {
  private api = inject(BaseApiService);

  getConfig(): Observable<VendorManagementConfig> {
    return this.api.apiGet<VendorManagementConfig>('/vendor-management/config');
  }

  searchCsd(params: { csdNumber?: string; companyName?: string; registrationNumber?: string }): Observable<{ results: CsdSearchResult[]; total: number }> {
    return this.api.apiGet('/vendor-management/csd/search', params as any);
  }

  importFromCsd(csdNumber: string): Observable<{ registration: VendorRegistration }> {
    return this.api.apiPost('/vendor-management/csd/import', { csdNumber });
  }

  registerManual(data: any): Observable<{ supplier: any; registration: VendorRegistration }> {
    return this.api.apiPost('/vendor-management/register/manual', data);
  }

  getRegistrations(params?: ApiListParams): Observable<PagedResult<VendorRegistration>> {
    return this.api.apiGetList<VendorRegistration>('/vendor-management/registrations', params);
  }

  getRegistration(id: string): Observable<{ registration: VendorRegistration; supplier: any }> {
    return this.api.apiGet(`/vendor-management/registrations/${id}`);
  }

  updateWizardStep(id: string, data: { step?: number; stepData?: any; completedStep?: string }): Observable<{ registration: VendorRegistration }> {
    return this.api.apiPut(`/vendor-management/registrations/${id}/wizard`, data);
  }

  submitRegistration(id: string): Observable<{ registration: VendorRegistration }> {
    return this.api.apiPost(`/vendor-management/registrations/${id}/submit`, {});
  }

  approveRegistration(id: string, data: { action: string; comments?: string }): Observable<{ registration: VendorRegistration }> {
    return this.api.apiPost(`/vendor-management/registrations/${id}/approve`, data);
  }

  getDocuments(params?: ApiListParams & { supplierId?: string; documentType?: string }): Observable<PagedResult<VendorDocument>> {
    return this.api.apiGetList<VendorDocument>('/vendor-management/documents', params as any);
  }

  getDocumentChecklist(supplierId: string): Observable<DocumentChecklist> {
    return this.api.apiGet<DocumentChecklist>(`/vendor-management/documents/${supplierId}`);
  }

  uploadDocument(data: Partial<VendorDocument>): Observable<{ document: VendorDocument }> {
    return this.api.apiPost('/vendor-management/documents', data);
  }

  verifyDocument(id: string): Observable<{ document: VendorDocument }> {
    return this.api.apiPut(`/vendor-management/documents/${id}/verify`, {});
  }

  deleteDocument(id: string): Observable<{ document: VendorDocument }> {
    return this.api.apiDelete(`/vendor-management/documents/${id}`);
  }

  getExpiringDocuments(days?: number): Observable<{ expiring: DocumentExpiryAlert[]; expired: DocumentExpiryAlert[] }> {
    return this.api.apiGet('/vendor-management/documents/expiring', { days } as any);
  }

  getDirectors(supplierId: string): Observable<DirectorResponse> {
    return this.api.apiGet<DirectorResponse>(`/vendor-management/directors/${supplierId}`);
  }

  addDirector(data: Partial<VendorDirector>): Observable<{ director: VendorDirector }> {
    return this.api.apiPost('/vendor-management/directors', data);
  }

  updateDirector(id: string, data: Partial<VendorDirector>): Observable<{ director: VendorDirector }> {
    return this.api.apiPut(`/vendor-management/directors/${id}`, data);
  }

  getAccreditations(params?: ApiListParams & { supplierId?: string; type?: string }): Observable<PagedResult<VendorAccreditation>> {
    return this.api.apiGetList<VendorAccreditation>('/vendor-management/accreditations', params as any);
  }

  addAccreditation(data: Partial<VendorAccreditation>): Observable<{ accreditation: VendorAccreditation }> {
    return this.api.apiPost('/vendor-management/accreditations', data);
  }

  updateAccreditation(id: string, data: Partial<VendorAccreditation>): Observable<{ accreditation: VendorAccreditation }> {
    return this.api.apiPut(`/vendor-management/accreditations/${id}`, data);
  }

  getProfessionalRegistrations(params?: ApiListParams & { supplierId?: string }): Observable<PagedResult<VendorProfessionalRegistration>> {
    return this.api.apiGetList<VendorProfessionalRegistration>('/vendor-management/professional-registrations', params as any);
  }

  addProfessionalRegistration(data: Partial<VendorProfessionalRegistration>): Observable<{ registration: VendorProfessionalRegistration }> {
    return this.api.apiPost('/vendor-management/professional-registrations', data);
  }

  getDiscountDetails(params?: ApiListParams & { supplierId?: string }): Observable<PagedResult<VendorDiscountDetail>> {
    return this.api.apiGetList<VendorDiscountDetail>('/vendor-management/discount-details', params as any);
  }

  addDiscountDetail(data: Partial<VendorDiscountDetail>): Observable<{ discount: VendorDiscountDetail }> {
    return this.api.apiPost('/vendor-management/discount-details', data);
  }

  updateDiscountDetail(id: string, data: Partial<VendorDiscountDetail>): Observable<{ discount: VendorDiscountDetail }> {
    return this.api.apiPut(`/vendor-management/discount-details/${id}`, data);
  }

  getStatusChanges(params?: ApiListParams & { supplierId?: string }): Observable<PagedResult<VendorStatusChange>> {
    return this.api.apiGetList<VendorStatusChange>('/vendor-management/status-changes', params as any);
  }

  changeStatus(data: { supplierId: string; toStatus: string; reason: string }): Observable<{ change: VendorStatusChange }> {
    return this.api.apiPost('/vendor-management/status-changes', data);
  }

  syncOfflineData(registrationIds?: string[]): Observable<{ synced: string[]; errors: any[] }> {
    return this.api.apiPost('/vendor-management/sync', { registrationIds });
  }

  getDiversitySummary(): Observable<DiversitySummary> {
    return this.api.apiGet<DiversitySummary>('/vendor-management/diversity-summary');
  }
}
