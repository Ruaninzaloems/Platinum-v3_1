import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpEventType, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TbImportWorkbenchService {
  private baseUrl = '/api/tb-import-workbench';

  constructor(private http: HttpClient) {}

  uploadFile(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/upload`, formData);
  }

  uploadFileWithProgress(formData: FormData): Observable<HttpEvent<any>> {
    const req = new HttpRequest('POST', `${this.baseUrl}/upload`, formData, {
      reportProgress: true,
    });
    return this.http.request(req);
  }

  confirmHeader(batchId: string, headerRow: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${batchId}/confirm-header`, { headerRow });
  }

  suggestMapping(batchId: string, importMode: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${batchId}/suggest-mapping`, { importMode });
  }

  saveMapping(batchId: string, importMode: string, columnMapping: any, signConvention: string = 'positive_debit'): Observable<any> {
    return this.http.post(`${this.baseUrl}/${batchId}/save-mapping`, { importMode, columnMapping, signConvention });
  }

  normalizeAndValidate(batchId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${batchId}/normalize-and-validate`, {});
  }

  overrideWarning(batchId: string, ruleId: string, reason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${batchId}/override-warning`, { ruleId, reason });
  }

  commit(batchId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${batchId}/commit`, {});
  }

  abandon(batchId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${batchId}/abandon`, {});
  }

  updateRowClassification(batchId: string, rowId: string, classification: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${batchId}/row-classification`, { rowId, classification });
  }

  getBatch(batchId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${batchId}`);
  }

  getRawRows(batchId: string, classification?: string): Observable<any> {
    const params: any = {};
    if (classification) params.classification = classification;
    return this.http.get(`${this.baseUrl}/${batchId}/raw-rows`, { params });
  }

  getNormalizedRows(batchId: string, normalizedOnly?: boolean): Observable<any> {
    const params: any = {};
    if (normalizedOnly !== undefined) params.normalizedOnly = String(normalizedOnly);
    return this.http.get(`${this.baseUrl}/${batchId}/normalized-rows`, { params });
  }

  getValidation(batchId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${batchId}/validation`);
  }

  getValidationSamples(batchId: string, ruleId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${batchId}/validation/${ruleId}/samples`);
  }

  getCommitHistory(batchId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${batchId}/commit-history`);
  }

  getTenantBatches(tenantId: string, financialYearId?: string): Observable<any> {
    const params: any = {};
    if (financialYearId) params.financialYearId = financialYearId;
    return this.http.get(`${this.baseUrl}/tenant/${tenantId}/batches`, { params });
  }

  getTenantCommitHistory(tenantId: string, financialYearId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/tenant/${tenantId}/commit-history`, { params: { financialYearId } });
  }

  getCompilations(financialYearId: string): Observable<any> {
    return this.http.get('/api/compilations', { params: { financialYearId } });
  }
}
