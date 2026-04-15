import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class NlqService {
  private api = inject(BaseApiService);

  query(question: string): Observable<any> { return this.api.apiPost('/nlq/query', { question }); }
  getSuggestions(): Observable<any[]> { return this.api.apiGet('/nlq/suggestions'); }
  getHistory(params?: any): Observable<any> { return this.api.apiGet('/nlq/history', params); }
  saveQuery(data: any): Observable<any> { return this.api.apiPost('/nlq/saved', data); }
  getSavedQueries(): Observable<any[]> { return this.api.apiGet('/nlq/saved'); }
  deleteSavedQuery(id: string): Observable<any> { return this.api.apiDelete(`/nlq/saved/${id}`); }
  getQueryById(id: string): Observable<any> { return this.api.apiGet(`/nlq/history/${id}`); }
  feedback(id: string, data: any): Observable<any> { return this.api.apiPost(`/nlq/history/${id}/feedback`, data); }
}
