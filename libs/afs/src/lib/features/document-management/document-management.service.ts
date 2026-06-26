import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AfsSharePointService, SpAfsDoc, AfsSpVariant } from '../../core/services/afs-sharepoint.service';

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
  private afsSp = inject(AfsSharePointService);

  /** The AFS entity id a document is linked to (working paper / compilation / finding / …). */
  private contextId(m: UploadMetadata): string {
    return (m.workingPaperId || m.compilationId || m.findingId || m.rfiId || m.adjustmentId || '') as string;
  }

  /** Adjustment documents go to the separate Adjustments library; everything else to the AFS library. */
  private variantForUpload(m: UploadMetadata): AfsSpVariant {
    return m.adjustmentId ? 'adjustments' : 'afs';
  }
  private variantForContext(contextType: string): AfsSpVariant {
    return contextType === 'adjustment' ? 'adjustments' : 'afs';
  }

  /**
   * Should this document use SharePoint storage? True when the variant's own toggle is on, OR
   * (for adjustment documents) when the working-paper SharePoint toggle is on — adjustment docs
   * always belong in the Adjustments library, so any active AFS SharePoint routes them there
   * (using the Adjustments library's defaults) rather than the local AFS API.
   */
  private useSharePoint(variant: AfsSpVariant): boolean {
    if (this.afsSp.isEnabled(variant)) return true;
    return variant === 'adjustments' && this.afsSp.isEnabled('afs');
  }

  /** Turn a code like "adjustment_support" / "internal" into a readable label
   *  ("Adjustment Support" / "Internal") for the SharePoint DocumentType/AccessLevel columns. */
  private prettify(s?: string): string | undefined {
    if (!s) return undefined;
    return s.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  /** Map a SharePoint doc to the DMS document shape the UI consumes. */
  private spToDms(d: SpAfsDoc): DmsDocument {
    return {
      id: d.id,
      fileName: d.fileName,
      originalName: d.fileName,
      mimeType: d.mimeType,
      fileSize: d.fileSize,
      sha256Hash: '',
      category: d.category || undefined,
      description: d.description || undefined,
      tags: d.tags,
      uploadedBy: '',
      documentType: 'working_paper',
      classificationLabel: d.classificationLabel || undefined,
      accessLevel: undefined,
      storageProvider: 'sharepoint',
      externalRef: d.id,
      createdAt: d.createdAt,
      __spItem: d.__item,
      __spVariant: d.__variant,
    } as unknown as DmsDocument;
  }

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
    // When AFS SharePoint storage is active (Admin → AFS), upload to the configured
    // library, tagged with AFSID (link to the entity) + description/Classification/
    // Category/Tags. Adjustment documents use the separate Adjustments library
    // (UatAFSAdjustments) when that toggle is on. Otherwise use the AFS API's local storage.
    const variant = this.variantForUpload(metadata);
    if (this.useSharePoint(variant)) {
      return from(this.afsSp.uploadAfsDocument(this.contextId(metadata), file, {
        description: metadata.description,
        classification: metadata.classificationLabel || metadata.classificationCode,
        category: metadata.category,
        tags: metadata.tags,
        documentType: this.prettify(metadata.documentType),
        accessLevel: this.prettify(metadata.accessLevel),
      }, variant).then(d => this.spToDms(d)));
    }
    return this.api.upload<DmsDocument>('/documents/upload', file, metadata as any);
  }

  /** True when AFS SharePoint storage is active for the given library variant. */
  isSharePointActive(variant: AfsSpVariant = 'afs'): boolean {
    return this.afsSp.isEnabled(variant);
  }

  /** List every document in a SharePoint library (e.g. all UatAFS working papers). */
  listAllSpDocuments(variant: AfsSpVariant = 'afs'): Observable<DmsDocument[]> {
    return from(this.afsSp.listAllAfsDocuments(variant).then(docs => docs.map(d => this.spToDms(d))));
  }

  /** Copy a SharePoint document into the Adjustments library, linked to the adjustment (ADJID). */
  copySpToAdjustment(doc: DmsDocument, adjustmentId: string): Observable<DmsDocument> {
    const item = (doc as any).__spItem;
    const sourceVariant: AfsSpVariant = (doc as any).__spVariant || 'afs';
    return from(this.afsSp.copyDocument(item, sourceVariant, 'adjustments', adjustmentId, {
      description: doc.description,
      classification: doc.classificationLabel,
      category: doc.category,
      tags: (doc.tags || []).join(', '),
    }).then(d => this.spToDms(d)));
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
    // When AFS SharePoint storage is active, list the entity's documents from the
    // configured library (filtered by AFSID = contextId). Adjustments read from the
    // separate Adjustments library when that toggle is on.
    const variant = this.variantForContext(contextType);
    if (this.useSharePoint(variant)) {
      return from(this.afsSp.listAfsDocuments(contextId, variant).then(docs => docs.map(d => this.spToDms(d))));
    }
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
