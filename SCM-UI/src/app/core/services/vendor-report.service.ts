import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { PagedResult } from '../models';
import {
  VendorDetailReport, VendorStatusReport, VendorExceptionReport,
  PerformanceTrendReport, DiversityReport, VendorReportFilters
} from '../models/vendor-report.model';

@Injectable({ providedIn: 'root' })
export class VendorReportService {
  private api = inject(BaseApiService);

  getVendorDetails(filters?: VendorReportFilters): Observable<PagedResult<VendorDetailReport>> {
    return this.api.apiGetList<VendorDetailReport>('/vendor-reports/details', filters as any);
  }

  getStatusReport(): Observable<VendorStatusReport> {
    return this.api.apiGet<VendorStatusReport>('/vendor-reports/status');
  }

  getExceptionsReport(): Observable<VendorExceptionReport> {
    return this.api.apiGet<VendorExceptionReport>('/vendor-reports/exceptions');
  }

  getPerformanceTrends(): Observable<PerformanceTrendReport> {
    return this.api.apiGet<PerformanceTrendReport>('/vendor-reports/performance-trends');
  }

  getDiversityReport(): Observable<DiversityReport> {
    return this.api.apiGet<DiversityReport>('/vendor-reports/diversity');
  }

  getDeletedDocuments(): Observable<any> {
    return this.api.apiGet('/vendor-reports/deleted-documents');
  }
}
