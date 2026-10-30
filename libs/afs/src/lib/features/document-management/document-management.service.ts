import { Injectable, inject } from '@angular/core';
import { Observable, from, forkJoin, of, catchError, map } from 'rxjs';
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

  /** The AFS entity id a document is linked to (working paper / compilation / finding / …).
   *  The RFI, working-paper and finding libraries link by the RFI / working-paper / finding id itself. */
  private contextId(m: UploadMetadata, variant: AfsSpVariant): string {
    if (variant === 'rfi') return (m.rfiId || '') as string;
    if (variant === 'workingPaper') return (m.workingPaperId || '') as string;
    if (variant === 'finding') return (m.findingId || '') as string;
    if (variant === 'adjustmentSupport') return (m.adjustmentId || '') as string;
    return (m.workingPaperId || m.compilationId || m.findingId || m.rfiId || m.adjustmentId || '') as string;
  }

  /** Adjustment documents go to the Working-Papers adjustment support library when its toggle is
   *  on, otherwise the separate Adjustments library; RFI attachments, finding
   *  attachments, SCOA version documents, mapping snapshots, exports, templates, AFS drafts, final AFS
   *  documents and working papers to their Working-Papers libraries
   *  (when those toggles are on); everything else to the AFS library. */
  private variantForUpload(m: UploadMetadata): AfsSpVariant {
    if (m.adjustmentId) return this.afsSp.isEnabled('adjustmentSupport') ? 'adjustmentSupport' : 'adjustments';
    if (m.rfiId && this.afsSp.isEnabled('rfi')) return 'rfi';
    if (m.findingId && this.afsSp.isEnabled('finding')) return 'finding';
    if (m.documentType === 'scoa_version' && this.afsSp.isEnabled('scoaVersion')) return 'scoaVersion';
    if (m.documentType === 'afs_draft' && this.afsSp.isEnabled('afsDraft')) return 'afsDraft';
    if (m.documentType === 'afs_final' && this.afsSp.isEnabled('afsFinal')) return 'afsFinal';
    if (m.documentType === 'adjustment_support' && this.afsSp.isEnabled('adjustmentSupport')) return 'adjustmentSupport';
    if (m.documentType === 'mapping_snapshot' && this.afsSp.isEnabled('mappingSnapshot')) return 'mappingSnapshot';
    if (m.documentType === 'export' && this.afsSp.isEnabled('export')) return 'export';
    if (m.documentType === 'template' && this.afsSp.isEnabled('template')) return 'template';
    if (m.workingPaperId && this.afsSp.isEnabled('workingPaper')) return 'workingPaper';
    return 'afs';
  }
  private variantForContext(contextType: string): AfsSpVariant {
    if (contextType === 'adjustment') return 'adjustments';
    if (contextType === 'rfi' && this.afsSp.isEnabled('rfi')) return 'rfi';
    if (contextType === 'finding' && this.afsSp.isEnabled('finding')) return 'finding';
    if (contextType === 'working_paper' && this.afsSp.isEnabled('workingPaper')) return 'workingPaper';
    return 'afs';
  }

  /** The library that holds working papers: the Working-Papers library when its toggle is on,
   *  otherwise the general AFS library. */
  workingPaperVariant(): AfsSpVariant {
    return this.afsSp.isEnabled('workingPaper') ? 'workingPaper' : 'afs';
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
      return from(this.afsSp.uploadAfsDocument(this.contextId(metadata, variant), file, {
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

  /** Download a SharePoint-stored document (as shaped by spToDms) via Graph. */
  downloadSpDocument(doc: DmsDocument): Promise<void> {
    return this.afsSp.downloadAfsDocument((doc as any).__spItem, (doc as any).__spVariant || 'afs');
  }

  /** List every document in a SharePoint library (e.g. all UatAFS working papers). */
  listAllSpDocuments(variant: AfsSpVariant = 'afs'): Observable<DmsDocument[]> {
    return from(this.afsSp.listAllAfsDocuments(variant).then(docs => docs.map(d => this.spToDms(d))));
  }

  /** Copy a SharePoint document into the adjustment's library (the Working-Papers adjustment
   *  support library when its toggle is on, otherwise Adjustments), linked to the adjustment. */
  copySpToAdjustment(doc: DmsDocument, adjustmentId: string): Observable<DmsDocument> {
    const item = (doc as any).__spItem;
    const sourceVariant: AfsSpVariant = (doc as any).__spVariant || 'afs';
    const target: AfsSpVariant = this.afsSp.isEnabled('adjustmentSupport') ? 'adjustmentSupport' : 'adjustments';
    return from(this.afsSp.copyDocument(item, sourceVariant, target, adjustmentId, {
      description: doc.description,
      classification: doc.classificationLabel,
      category: doc.category,
      tags: (doc.tags || []).join(', '),
      documentType: this.prettify(doc.documentType),
      accessLevel: this.prettify(doc.accessLevel),
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
    const list$ = this.useSharePoint(variant)
      ? from(this.afsSp.listAfsDocuments(contextId, variant).then(docs => docs.map(d => this.spToDms(d))))
      : this.api.get<DmsDocument[]>(`/documents/by-context/${contextType}/${contextId}`);
    // A compilation's AFS drafts / final AFS documents live in their Working-Papers libraries when
    // those toggles are on; list them alongside the compilation's other documents.
    // An adjustment's support documents go to the Working-Papers adjustment support library when
    // its toggle is on; keep listing the ones already in the Adjustments library too.
    if (contextType === 'adjustment' && this.afsSp.isEnabled('adjustmentSupport')) {
      const support$ = from(this.afsSp.listAfsDocuments(contextId, 'adjustmentSupport').then(docs => docs.map(d => this.spToDms(d))));
      return forkJoin([support$, list$.pipe(catchError(() => of([] as DmsDocument[])))]).pipe(
        map(lists => lists.flatMap(l => l || [])),
      );
    }
    if (contextType === 'compilation') {
      const extra = ([['afsDraft', 'afs_draft'], ['afsFinal', 'afs_final']] as [AfsSpVariant, string][])
        .filter(([v]) => this.afsSp.isEnabled(v))
        .map(([v, type]) => from(this.afsSp.listAfsDocuments(contextId, v)
          .then(docs => docs.map(d => ({ ...this.spToDms(d), documentType: type }) as DmsDocument))));
      if (extra.length) {
        return forkJoin([...extra, list$.pipe(catchError(() => of([] as DmsDocument[])))]).pipe(
          map(lists => lists.flatMap(l => l || [])),
        );
      }
    }
    return list$;
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
