import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private api = inject(BaseApiService);

  getRequisitionAnalytics(): Observable<any> {
    return this.api.apiGet<any>('/analytics/requisitions');
  }

  getOrderAnalytics(): Observable<any> {
    return this.api.apiGet<any>('/analytics/orders');
  }

  getQuotationAnalytics(): Observable<any> {
    return this.api.apiGet<any>('/analytics/quotations');
  }

  getTenderAnalytics(): Observable<any> {
    return this.api.apiGet<any>('/analytics/tenders');
  }

  getInvoiceAnalytics(): Observable<any> {
    return this.api.apiGet<any>('/analytics/invoices');
  }

  getPaymentAnalytics(): Observable<any> {
    return this.api.apiGet<any>('/analytics/payments');
  }

  getGrnAnalytics(): Observable<any> {
    return this.api.apiGet<any>('/analytics/grn');
  }

  getVendorAnalytics(): Observable<any> {
    return this.api.apiGet<any>('/analytics/vendors');
  }

  getSupplierPerformanceAnalytics(): Observable<any> {
    return this.api.apiGet<any>('/analytics/supplier-performance');
  }

  getContractAnalytics(): Observable<any> {
    return this.api.apiGet<any>('/analytics/contracts');
  }

  getComplianceAnalytics(): Observable<any> {
    return this.api.apiGet<any>('/analytics/compliance');
  }

  getDemandAnalytics(): Observable<any> {
    return this.api.apiGet<any>('/analytics/demand');
  }

  getInventoryAnalytics(): Observable<any> {
    return this.api.apiGet<any>('/analytics/inventory');
  }

  getDemandForecastMl(params?: any): Observable<any> { return this.api.apiGet('/analytics/predictive/demand-forecast', params); }
  getPricePrediction(params?: any): Observable<any> { return this.api.apiGet('/analytics/predictive/price-prediction', params); }
  getSupplierRiskScore(params?: any): Observable<any> { return this.api.apiGet('/analytics/predictive/supplier-risk', params); }
  getSpendAnomalyDetection(params?: any): Observable<any> { return this.api.apiGet('/analytics/predictive/spend-anomaly', params); }
  getContractExpiryPrediction(params?: any): Observable<any> { return this.api.apiGet('/analytics/predictive/contract-expiry', params); }
  getCategoryManagement(): Observable<any> { return this.api.apiGet('/analytics/category-management'); }
  getCategoryStrategy(categoryId: string): Observable<any> { return this.api.apiGet(`/analytics/category-management/${categoryId}/strategy`); }
  updateCategoryStrategy(categoryId: string, data: any): Observable<any> { return this.api.apiPut(`/analytics/category-management/${categoryId}/strategy`, data); }
}
