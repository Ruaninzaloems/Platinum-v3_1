import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConstantsApiService {
  private base = '/budget-app/api/constants';

  constructor(private http: HttpClient) {}

  getIdpLevelDescriptionDetails(headerId?: number, levelNumber?: number): Observable<any[]> {
    let params = new HttpParams();
    if (headerId != null) params = params.set('headerId', headerId);
    if (levelNumber != null) params = params.set('levelNumber', levelNumber);
    return this.http.get<any[]>(`${this.base}/idp-level-description-details`, { params });
  }

  getIdpLevelDescriptionHeaders(financialYear?: string): Observable<any[]> {
    let params = new HttpParams();
    if (financialYear) params = params.set('financialYear', financialYear);
    return this.http.get<any[]>(`${this.base}/idp-level-description-headers`, { params });
  }

  getIdpNationalKpaDetails(enabledOnly?: boolean, headerId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (enabledOnly != null) params = params.set('enabledOnly', enabledOnly);
    if (headerId != null) params = params.set('headerId', headerId);
    return this.http.get<any[]>(`${this.base}/idp-national-kpa-details`, { params });
  }

  getIdpNationalKpaHeaders(financialYear?: string): Observable<any[]> {
    let params = new HttpParams();
    if (financialYear) params = params.set('financialYear', financialYear);
    return this.http.get<any[]>(`${this.base}/idp-national-kpa-headers`, { params });
  }

  getIdpItems(financialYear?: string, levelNumber?: number, parentId?: number, isProj?: boolean): Observable<any[]> {
    let params = new HttpParams();
    if (financialYear) params = params.set('financialYear', financialYear);
    if (levelNumber != null) params = params.set('levelNumber', levelNumber);
    if (parentId != null) params = params.set('parentId', parentId);
    if (isProj != null) params = params.set('isProj', isProj);
    return this.http.get<any[]>(`${this.base}/idp-items`, { params });
  }

  getScoaProjectConsolidated(enabledOnly?: boolean, postingLevel?: string, finYearText?: string, parentId?: number, rootOnly?: boolean): Observable<any[]> {
    let params = new HttpParams();
    if (enabledOnly != null) params = params.set('enabledOnly', enabledOnly);
    if (postingLevel) params = params.set('postingLevel', postingLevel);
    if (finYearText) params = params.set('finYearText', finYearText);
    if (parentId != null) params = params.set('parentId', parentId);
    if (rootOnly) params = params.set('rootOnly', rootOnly);
    return this.http.get<any[]>(`${this.base}/scoa-project-structure-consolidated`, { params });
  }

  getScoaProjectConsolidatedById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/scoa-project-structure-consolidated/${id}`);
  }

  getScoaFunctionConsolidated(enabledOnly?: boolean, finYearText?: string): Observable<any[]> {
    let params = new HttpParams();
    if (enabledOnly != null) params = params.set('enabledOnly', enabledOnly);
    if (finYearText) params = params.set('finYearText', finYearText);
    return this.http.get<any[]>(`${this.base}/scoa-function-structure-consolidated`, { params });
  }

  getScoaFundsConsolidated(enabledOnly?: boolean, finYearText?: string, postingLevel?: string): Observable<any[]> {
    let params = new HttpParams();
    if (enabledOnly != null) params = params.set('enabledOnly', enabledOnly);
    if (finYearText) params = params.set('finYearText', finYearText);
    if (postingLevel) params = params.set('postingLevel', postingLevel);
    return this.http.get<any[]>(`${this.base}/scoa-funds-structure-consolidated`, { params });
  }

  getScoaFundsConsolidatedPosting(finYearText?: string): Observable<any[]> {
    return this.getScoaFundsConsolidated(true, finYearText, 'Yes');
  }

  getScoaRegionalConsolidated(enabledOnly?: boolean, finYearText?: string): Observable<any[]> {
    let params = new HttpParams();
    if (enabledOnly != null) params = params.set('enabledOnly', enabledOnly);
    if (finYearText) params = params.set('finYearText', finYearText);
    return this.http.get<any[]>(`${this.base}/scoa-regional-structure-consolidated`, { params });
  }

  getScoaStructureConsolidated(enabledOnly?: boolean, finYearText?: string, levelID?: number, postingLevel?: string, parentId?: number, rootOnly?: boolean): Observable<any[]> {
    let params = new HttpParams();
    if (enabledOnly != null) params = params.set('enabledOnly', enabledOnly);
    if (finYearText) params = params.set('finYearText', finYearText);
    if (levelID != null) params = params.set('levelID', levelID);
    if (postingLevel) params = params.set('postingLevel', postingLevel);
    if (parentId != null) params = params.set('parentId', parentId);
    if (rootOnly) params = params.set('rootOnly', rootOnly);
    return this.http.get<any[]>(`${this.base}/scoa-structure-consolidated`, { params });
  }

  searchScoaStructureConsolidated(search: string, postingLevel = 'Yes', take = 50): Observable<any[]> {
    let params = new HttpParams()
      .set('enabledOnly', true)
      .set('postingLevel', postingLevel)
      .set('search', search)
      .set('take', take);
    return this.http.get<any[]>(`${this.base}/scoa-structure-consolidated`, { params });
  }

  getScoaStructureConsolidatedById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/scoa-structure-consolidated/${id}`);
  }

  getScoaCostingConsolidated(enabledOnly?: boolean, postingLevel?: string): Observable<any[]> {
    let params = new HttpParams();
    if (enabledOnly != null) params = params.set('enabledOnly', enabledOnly);
    if (postingLevel) params = params.set('postingLevel', postingLevel);
    return this.http.get<any[]>(`${this.base}/scoa-costing-structure-consolidated`, { params });
  }

  getScoaFunctionConsolidatedPosting(): Observable<any[]> {
    let params = new HttpParams().set('enabledOnly', true).set('postingLevel', 'Yes');
    return this.http.get<any[]>(`${this.base}/scoa-function-structure-consolidated`, { params });
  }

  getScoaRegionalConsolidatedPosting(): Observable<any[]> {
    let params = new HttpParams().set('enabledOnly', true).set('postingLevel', 'Yes');
    return this.http.get<any[]>(`${this.base}/scoa-regional-structure-consolidated`, { params });
  }

  getPlanCapitalOperationalTypes(): Observable<any[]> {
    return this.http.get<any[]>('/api/ems/const/const-plancapitaloperationaltypes-sys?pageSize=200');
  }

  getStatuses(usedBy?: string): Observable<any[]> {
    let params = new HttpParams();
    if (usedBy) params = params.set('usedBy', usedBy);
    return this.http.get<any[]>(`${this.base}/statuses`, { params });
  }

  getProjectTypes(finYear?: string, enabledOnly = true): Observable<any[]> {
    let params = new HttpParams();
    if (finYear) params = params.set('finYear', finYear);
    if (enabledOnly) params = params.set('enabledOnly', true);
    return this.http.get<any[]>(`${this.base}/project-types`, { params });
  }
}
