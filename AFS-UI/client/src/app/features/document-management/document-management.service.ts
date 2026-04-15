import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface DmsDocument {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  sha256Hash: string;
  category?: string;
  description?: string;
  tags?: string[];
  uploadedBy: string;
  documentType?: string;
  classificationCode?: string;
  classificationLabel?: string;
  retentionPeriodYears?: number;
  retentionExpiresAt?: string;
  disposalAction?: string;
  disposalAuthorityRef?: string;
  disposalStatus?: string;
  accessLevel?: string;
  archivalStatus?: string;
  financialYearId?: string;
  storageProvider?: string;
  externalRef?: string;
  lockedAt?: string;
  lockedBy?: string;
  checkoutBy?: string;
  checkoutAt?: string;
  compilationId?: string;
  rfiId?: string;
  findingId?: string;
  workingPaperId?: string;
  adjustmentId?: string;
  version?: number;
  previousVersionId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DmsClassification {
  id: string;
  code: string;
  label: string;
  description?: string;
  parentCode?: string;
  retentionPeriodYears?: number;
  disposalAction?: string;
  defaultAccessLevel?: string;
  applicableDocumentTypes?: string[];
  sortOrder?: number;
}

export interface DmsStats {
  totalDocuments: number;
  totalSize: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byAccessLevel: Record<string, number>;
  lockedCount: number;
  checkedOutCount: number;
  approachingExpiry: number;
}

export interface DmsSearchParams {
  documentType?: string;
  classificationCode?: string;
  category?: string;
  financialYearId?: string;
  accessLevel?: string;
  archivalStatus?: string;
  disposalStatus?: string;
  tags?: string[];
  search?: string;
  compilationId?: string;
  rfiId?: string;
  findingId?: string;
  workingPaperId?: string;
  adjustmentId?: string;
  page?: number;
  limit?: number;
}

export interface DmsSearchResult {
  items: DmsDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RetentionItem {
  id: string;
  originalName: string;
  classificationLabel?: string;
  retentionPeriodYears?: number;
  retentionExpiresAt?: string;
  disposalStatus?: string;
  createdAt: string;
}

export interface UploadMetadata {
  category?: string;
  description?: string;
  tags?: string;
  documentType?: string;
  classificationCode?: string;
  classificationLabel?: string;
  accessLevel?: string;
  financialYearId?: string;
  compilationId?: string;
  rfiId?: string;
  findingId?: string;
  workingPaperId?: string;
  adjustmentId?: string;
  storageProvider?: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentManagementService {
  private api = inject(ApiService);

  search(params: DmsSearchParams): Observable<DmsSearchResult> {
    const query: Record<string, any> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query[k] = v;
      }
    });
    return this.api.get<DmsSearchResult>('/documents', query);
  }

  getDocument(id: string): Observable<DmsDocument> {
    return this.api.get<DmsDocument>(`/documents/${id}`);
  }

  getStats(): Observable<DmsStats> {
    return this.api.get<DmsStats>('/documents/stats');
  }

  getRetentionSchedule(): Observable<RetentionItem[]> {
    return this.api.get<RetentionItem[]>('/documents/retention-schedule');
  }

  getClassifications(): Observable<DmsClassification[]> {
    return this.api.get<DmsClassification[]>('/documents/classifications');
  }

  createClassification(data: Partial<DmsClassification>): Observable<DmsClassification> {
    return this.api.post<DmsClassification>('/documents/classifications', data);
  }

  upload(file: File, metadata: UploadMetadata): Observable<DmsDocument> {
    return this.api.upload<DmsDocument>('/documents/upload', file, metadata as any);
  }

  download(id: string): Observable<Blob> {
    return this.api.get<Blob>(`/documents/${id}/download`);
  }

  getVersionHistory(id: string): Observable<DmsDocument[]> {
    return this.api.get<DmsDocument[]>(`/documents/${id}/versions`);
  }

  getAuditTrail(id: string): Observable<any[]> {
    return this.api.get<any[]>(`/documents/${id}/audit-trail`);
  }

  verifyIntegrity(id: string): Observable<any> {
    return this.api.get<any>(`/documents/${id}/verify`);
  }

  checkOut(id: string): Observable<DmsDocument> {
    return this.api.post<DmsDocument>(`/documents/${id}/checkout`);
  }

  checkIn(id: string, file?: File): Observable<DmsDocument> {
    if (file) {
      return this.api.upload<DmsDocument>(`/documents/${id}/checkin`, file);
    }
    return this.api.post<DmsDocument>(`/documents/${id}/checkin`);
  }

  lock(id: string): Observable<DmsDocument> {
    return this.api.post<DmsDocument>(`/documents/${id}/lock`);
  }

  classify(id: string, classificationCode: string, classificationLabel: string): Observable<DmsDocument> {
    return this.api.post<DmsDocument>(`/documents/${id}/classify`, { classificationCode, classificationLabel });
  }

  requestDisposal(documentIds: string[], justification: string): Observable<any> {
    return this.api.post('/documents/disposal-request', { documentIds, justification });
  }

  getByContext(contextType: string, contextId: string): Observable<DmsDocument[]> {
    return this.api.get<DmsDocument[]>(`/documents/by-context/${contextType}/${contextId}`);
  }

  getSourceDocuments(documentNumber: string, finYear?: string): Observable<SourceDocumentChain> {
    const params: Record<string, any> = { documentNumber };
    if (finYear) params['finYear'] = finYear;
    return this.api.get<SourceDocumentChain>('/documents/source-documents', params);
  }
}

export interface SourceDocumentChainSummary {
  hasRequisition: boolean;
  hasGrn: boolean;
  hasInvoice: boolean;
  hasPayment: boolean;
  hasCreditNote: boolean;
  threeWayMatch: boolean;
}

export interface SourceDocumentChain {
  available: boolean;
  message?: string;
  documentNumber: string;
  finYear: string | null;
  chain?: {
    requisitions: any[];
    grns: any[];
    invoices: any[];
    creditNotes: any[];
    sundryPayments: any[];
    payments: any[];
    cashbookEntries: any[];
  };
  vendor?: {
    vendor: any;
    bankingDetails: any[];
  } | null;
  summary?: SourceDocumentChainSummary;
}
