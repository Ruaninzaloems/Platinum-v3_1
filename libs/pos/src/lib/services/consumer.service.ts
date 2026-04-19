import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConsumerService {
  private http = inject(HttpClient);

  getPropertyTypes(): Observable<any[]> {
    return this.http.get<any[]>('/api/platinum/consumer-lookups/property-types');
  }
  getAccountTypes(): Observable<any[]> {
    return this.http.get<any[]>('/api/platinum/consumer-lookups/account-types');
  }
  getServiceModes(): Observable<any[]> {
    return this.http.get<any[]>('/api/platinum/consumer-lookups/service-modes');
  }
  getTariffTypes(): Observable<any[]> {
    return this.http.get<any[]>('/api/platinum/consumer-lookups/tariff-types');
  }
  getTariffs(params?: Record<string, string>): Observable<any[]> {
    return this.http.get<any[]>('/api/platinum/consumer-lookups/tariffs', { params });
  }
  getMeters(params?: Record<string, string>): Observable<any[]> {
    return this.http.get<any[]>('/api/platinum/consumer-lookups/meters', { params });
  }

  searchNames(params: Record<string, string>): Observable<any> {
    return this.http.get('/api/platinum/cons-name/search', { params });
  }
  getName(id: number): Observable<any> {
    return this.http.get(`/api/platinum/cons-name/${id}`);
  }
  createName(data: any): Observable<any> {
    return this.http.post('/api/platinum/cons-name', data);
  }
  updateName(id: number, data: any): Observable<any> {
    return this.http.put(`/api/platinum/cons-name/${id}`, data);
  }
  bulkCreateNames(items: any[]): Observable<any> {
    return this.http.post('/api/platinum/cons-name/bulk', items);
  }

  searchUnits(params: Record<string, string>): Observable<any> {
    return this.http.get('/api/platinum/cons-unit/search', { params });
  }
  getUnit(id: number): Observable<any> {
    return this.http.get(`/api/platinum/cons-unit/${id}`);
  }
  createUnit(data: any): Observable<any> {
    return this.http.post('/api/platinum/cons-unit', data);
  }
  updateUnit(id: number, data: any): Observable<any> {
    return this.http.put(`/api/platinum/cons-unit/${id}`, data);
  }
  bulkCreateUnits(items: any[]): Observable<any> {
    return this.http.post('/api/platinum/cons-unit/bulk', items);
  }

  searchPartitions(params: Record<string, string>): Observable<any> {
    return this.http.get('/api/platinum/cons-unitpartition/search', { params });
  }
  getPartitionsByUnit(unitId: number): Observable<any> {
    return this.http.get(`/api/platinum/cons-unitpartition/by-unit/${unitId}`);
  }
  getPartition(id: number): Observable<any> {
    return this.http.get(`/api/platinum/cons-unitpartition/${id}`);
  }
  createPartition(data: any): Observable<any> {
    return this.http.post('/api/platinum/cons-unitpartition', data);
  }
  updatePartition(id: number, data: any): Observable<any> {
    return this.http.put(`/api/platinum/cons-unitpartition/${id}`, data);
  }
  bulkCreatePartitions(items: any[]): Observable<any> {
    return this.http.post('/api/platinum/cons-unitpartition/bulk', items);
  }

  searchOwners(params: Record<string, string>): Observable<any> {
    return this.http.get('/api/platinum/cons-unitpartitionowner/search', { params });
  }
  getOwnersByPartition(partitionId: number): Observable<any> {
    return this.http.get(`/api/platinum/cons-unitpartitionowner/by-partition/${partitionId}`);
  }
  getOwner(id: number): Observable<any> {
    return this.http.get(`/api/platinum/cons-unitpartitionowner/${id}`);
  }
  createOwner(data: any): Observable<any> {
    return this.http.post('/api/platinum/cons-unitpartitionowner', data);
  }
  updateOwner(id: number, data: any): Observable<any> {
    return this.http.put(`/api/platinum/cons-unitpartitionowner/${id}`, data);
  }
  bulkCreateOwners(items: any[]): Observable<any> {
    return this.http.post('/api/platinum/cons-unitpartitionowner/bulk', items);
  }

  searchAccounts(params: Record<string, string>): Observable<any> {
    return this.http.get('/api/platinum/cons-account/search', { params });
  }
  getAccountsByPartition(partitionId: number): Observable<any> {
    return this.http.get(`/api/platinum/cons-account/by-partition/${partitionId}`);
  }
  getAccount(id: number): Observable<any> {
    return this.http.get(`/api/platinum/cons-account/${id}`);
  }
  createAccount(data: any): Observable<any> {
    return this.http.post('/api/platinum/cons-account', data);
  }
  updateAccount(id: number, data: any): Observable<any> {
    return this.http.put(`/api/platinum/cons-account/${id}`, data);
  }
  bulkCreateAccounts(items: any[]): Observable<any> {
    return this.http.post('/api/platinum/cons-account/bulk', items);
  }

  getContactDetailsByAccount(accountId: number): Observable<any> {
    return this.http.get(`/api/platinum/cons-account-contactdetails/by-account/${accountId}`);
  }
  createContactDetails(data: any): Observable<any> {
    return this.http.post('/api/platinum/cons-account-contactdetails', data);
  }
  bulkCreateContactDetails(items: any[]): Observable<any> {
    return this.http.post('/api/platinum/cons-account-contactdetails/bulk', items);
  }

  getServicesByAccount(accountId: number): Observable<any> {
    return this.http.get(`/api/platinum/cons-services/by-account/${accountId}`);
  }
  createService(data: any): Observable<any> {
    return this.http.post('/api/platinum/cons-services', data);
  }
  bulkCreateServices(items: any[]): Observable<any> {
    return this.http.post('/api/platinum/cons-services/bulk', items);
  }

  getAdditionalBillingByAccount(accountId: number): Observable<any> {
    return this.http.get(`/api/platinum/cons-additionalbilling/by-account/${accountId}`);
  }
  createAdditionalBilling(data: any): Observable<any> {
    return this.http.post('/api/platinum/cons-additionalbilling', data);
  }
  bulkCreateAdditionalBilling(items: any[]): Observable<any> {
    return this.http.post('/api/platinum/cons-additionalbilling/bulk', items);
  }
}
