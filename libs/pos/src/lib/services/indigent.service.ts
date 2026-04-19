import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../core/services/api.service';
import type {
  DashboardSummary,
  IndigentType,
  IndigentTypeSubRule,
  QualificationCheck,
  ApplicationDetail,
  SaveApplicationRequest,
  SaveApplicationResponse,
  SaveOccupierRequest,
  SaveOccupierResponse,
  SaveTenantRequest,
  SaveTenantResponse,
  VerificationQueueItem,
  SaveVerificationRequest,
  SaveVerificationResponse,
  AuthorizationQueueItem,
  AuthorizeRequest,
  AuthorizeResponse,
  DeclineRequest,
  DeclineResponse,
  IndigentRegisterItem,
  ReapplicationDueItem,
  SubmitReapplicationRequest,
  ReapplicationResponse,
  TerminateRequest,
  TerminateResponse,
  BatchTerminateRequest,
  BatchTerminateResponse,
  OverrideDisqualificationRequest,
  OverrideResponse,
  Contractor,
  SaveContractorRequest,
  DeclineReason,
  IncomeSource,
  Employer,
  IndigentTypeRule,
  AutomatedLetter,
  SaveAutomatedLetterRequest,
  ApplicationStats,
  DoNotCutUpdateRequest,
  DoNotCutUpdateResponse,
  PaginatedResponse,
  SubsidyItemCounts,
  ATTPDocument,
  ATTPDocumentType,
  ATTPSignature,
  VerificationProvider,
  IDVerificationResult,
  TerminationQueueItem,
  UploadDocumentRequest,
  SaveSignatureRequest,
  SaveVerificationProviderRequest,
  SaveDeclineReasonRequest,
  IncomeSourceItem,
  SaveIncomeSourceRequest,
  SaveDocumentTypeRequest,
  AccountSearchResult,
  BulkActivateRequest,
  BulkActivateResponse,
  SmartQualificationData,
  FieldWorker,
  SteercomReferralItem,
  ContractorAllocationRequest,
  ContractorAllocationResponse,
  DocVerificationQueueItem,
  CommunicationLogEntry,
  IndigentLifecycleEvent,
  CommunicationTemplate,
  CcStakeholder,
  SlaInfo,
  OccupierTypeConfig
} from '../models/indigent.models';

@Injectable({ providedIn: 'root' })
export class IndigentService {
  constructor(private api: ApiService) {}

  getDashboardSummary(finYear?: string): Observable<DashboardSummary> {
    const params: Record<string, string> = {};
    if (finYear) params['finYear'] = finYear;
    return this.api.get<DashboardSummary>('/api/platinum/billing-attp/dashboard-summary', params);
  }

  getIndigentTypes(): Observable<IndigentType[]> {
    return this.api.get<IndigentType[]>('/api/platinum/billing-attp/indigent-types');
  }

  getIndigentTypeSubRules(indigentTypeId: number): Observable<IndigentTypeSubRule[]> {
    return this.api.get<IndigentTypeSubRule[]>('/api/platinum/billing-attp/indigent-type-sub-rules', { indigentTypeId: String(indigentTypeId) });
  }

  getPropertyCategories(): Observable<{ id: number; name: string }[]> {
    return this.api.get<{ id: number; name: string }[]>('/api/platinum/billing-debt/property-categories');
  }

  getNameTypes(): Observable<{ id: number; name: string }[]> {
    return this.api.get<{ id: number; name: string }[]>('/api/platinum/billing-attp/name-types');
  }

  getQualificationCheck(accountId: number, indigentTypeId: number): Observable<QualificationCheck> {
    return this.api.get<QualificationCheck>('/api/platinum/billing-attp/qualification-check', { accountId: String(accountId), indigentTypeId: String(indigentTypeId) });
  }

  getSmartQualificationData(accountId: number): Observable<SmartQualificationData> {
    return this.api.get<SmartQualificationData>('/api/platinum/billing-attp/smart-qualification', { accountId: String(accountId) });
  }

  getApplicationDetail(applicationId: number): Observable<ApplicationDetail> {
    return this.api.get<ApplicationDetail>('/api/platinum/billing-attp/application-detail', { applicationId: String(applicationId) });
  }

  downloadApplicationPdf(applicationId: number): Observable<Blob> {
    return this.api.getBlob('/api/platinum/billing-attp/download-application-pdf', { appId: String(applicationId) }).pipe(
      map(result => result.blob)
    );
  }

  downloadSiteVerificationPdf(applicationId: number): Observable<Blob> {
    return this.api.getBlob('/api/platinum/billing-attp/download-site-verification-pdf', { appId: String(applicationId) }).pipe(
      map(result => result.blob)
    );
  }

  downloadDocVerificationPdf(applicationId: number): Observable<Blob> {
    return this.api.getBlob('/api/platinum/billing-attp/download-doc-verification-pdf', { appId: String(applicationId) }).pipe(
      map(result => result.blob)
    );
  }

  downloadAuthorizationLetter(applicationId: number): Observable<Blob> {
    return this.api.getBlob('/api/platinum/billing-attp/download-authorization-letter', { appId: String(applicationId) }).pipe(
      map(result => result.blob)
    );
  }

  downloadTerminationLetter(applicationId: number): Observable<Blob> {
    return this.api.getBlob('/api/platinum/billing-attp/download-termination-letter', { appId: String(applicationId) }).pipe(
      map(result => result.blob)
    );
  }

  saveApplication(request: SaveApplicationRequest): Observable<SaveApplicationResponse> {
    return this.api.post<SaveApplicationResponse>('/api/platinum/billing-attp/save-application', request);
  }

  saveOccupier(request: SaveOccupierRequest): Observable<SaveOccupierResponse> {
    return this.api.post<SaveOccupierResponse>('/api/platinum/billing-attp/save-occupier', request);
  }

  deleteOccupier(occupierId: number, applicationId?: number): Observable<{ isSuccess?: boolean; success?: boolean; deletedOccupierId?: number; message?: string }> {
    const params: Record<string, string> = { occupierId: String(occupierId) };
    if (applicationId) params['applicationId'] = String(applicationId);
    return this.api.delete<{ success: boolean; message: string }>('/api/platinum/billing-attp/delete-occupier', params);
  }

  saveTenant(request: SaveTenantRequest): Observable<SaveTenantResponse> {
    return this.api.post<SaveTenantResponse>('/api/platinum/billing-attp/save-tenant', request);
  }

  assignContractor(request: { applicationId: number; contractorId: number; verificationDueDate?: string; capturerID?: number }): Observable<any> {
    return this.api.post<any>('/api/platinum/billing-attp/assign-contractor', request);
  }

  getVerificationQueue(params?: { page?: number; pageSize?: number; contractorId?: number }): Observable<PaginatedResponse<VerificationQueueItem>> {
    const p: Record<string, string> = {};
    if (params?.page) p['page'] = String(params.page);
    if (params?.pageSize) p['pageSize'] = String(params.pageSize);
    if (params?.contractorId) p['contractorId'] = String(params.contractorId);
    return this.api.get<PaginatedResponse<VerificationQueueItem>>('/api/platinum/billing-attp/verification-queue', p);
  }

  saveVerification(request: SaveVerificationRequest): Observable<SaveVerificationResponse> {
    return this.api.post<SaveVerificationResponse>('/api/platinum/billing-attp/save-verification', request);
  }

  submitForVerification(request: { applicationId: number; capturerId?: number; modifierId?: number }): Observable<{ isSuccess: boolean; message?: string; appStatusId?: number }> {
    return this.api.post<{ isSuccess: boolean; message?: string; appStatusId?: number }>('/api/platinum/billing-attp/submit-for-verification', request);
  }

  saveDocVerification(request: { applicationId: number; verificationOutcomeId: number; verificationOutcomeDate?: string; remarks?: string; capturerId?: number; modifierId?: number; referralTarget?: string; referralNote?: string; verificationResults?: any[] }): Observable<{ isSuccess: boolean; message?: string }> {
    return this.api.post<{ isSuccess: boolean; message?: string }>('/api/platinum/billing-attp/save-doc-verification', request);
  }

  getDocVerificationQueue(params?: { page?: number; pageSize?: number; indigentTypeId?: number; status?: string }): Observable<PaginatedResponse<DocVerificationQueueItem>> {
    const p: Record<string, string> = {};
    if (params?.page) p['page'] = String(params.page);
    if (params?.pageSize) p['pageSize'] = String(params.pageSize);
    if (params?.indigentTypeId) p['indigentTypeId'] = String(params.indigentTypeId);
    if (params?.status) p['status'] = params.status;
    return this.api.get<PaginatedResponse<DocVerificationQueueItem>>('/api/platinum/billing-attp/doc-verification-queue', p);
  }

  submitDocVerification(request: { applicationId: number; verificationResults: { documentId: number; status: string; rejectionReason?: string }[]; overallOutcome: 'approved' | 'rejected' | 'referred'; referralTarget?: string | null; referralNote?: string }): Observable<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>('/api/platinum/billing-attp/submit-doc-verification', request);
  }

  getAuthorizationQueue(params?: { page?: number; pageSize?: number; indigentTypeId?: number }): Observable<PaginatedResponse<AuthorizationQueueItem>> {
    const p: Record<string, string> = {};
    if (params?.page) p['page'] = String(params.page);
    if (params?.pageSize) p['pageSize'] = String(params.pageSize);
    if (params?.indigentTypeId) p['indigentTypeId'] = String(params.indigentTypeId);
    return this.api.get<PaginatedResponse<AuthorizationQueueItem>>('/api/platinum/billing-attp/authorization-queue', p);
  }

  authorizeVerification(request: AuthorizeRequest): Observable<AuthorizeResponse> {
    return this.api.post<AuthorizeResponse>('/api/platinum/billing-attp/authorize-application', request);
  }

  authorizeApplication(request: AuthorizeRequest): Observable<AuthorizeResponse> {
    return this.api.post<AuthorizeResponse>('/api/platinum/billing-attp/authorize-application', request);
  }

  executeIndigentDebtActions(payload: {
    accountNo: string;
    indigentTypeId: number;
    writeOffHandoverDebt: boolean;
    terminateHandover: boolean;
    terminateRepaymentPlan: boolean;
    onceWriteOff?: number;
    writeOffDocumentType?: number;
    capturerID: number;
    remarks?: string;
  }): Observable<{ success: boolean; accountNo: string; message: string; actions: { action: string; success: boolean; message: string; data?: any }[] }> {
    return this.api.post('/api/platinum/billing-attp/indigent-debt-actions', payload);
  }

  declineApplication(request: DeclineRequest): Observable<DeclineResponse> {
    return this.api.post<DeclineResponse>('/api/platinum/billing-attp/decline-application', request);
  }

  getIndigentRegister(params?: { status?: string; indigentTypeId?: number; town?: string; page?: number; pageSize?: number; search?: string }): Observable<PaginatedResponse<IndigentRegisterItem>> {
    const p: Record<string, string> = {};
    if (params?.status) p['status'] = params.status;
    if (params?.indigentTypeId) p['indigentTypeId'] = String(params.indigentTypeId);
    if (params?.town) p['town'] = params.town;
    if (params?.page) p['page'] = String(params.page);
    if (params?.pageSize) p['pageSize'] = String(params.pageSize);
    if (params?.search) p['search'] = params.search;
    return this.api.get<PaginatedResponse<IndigentRegisterItem>>('/api/platinum/billing-attp/indigent-register', p);
  }

  getReapplicationDue(days: number): Observable<{ data: ReapplicationDueItem[]; totalCount: number }> {
    return this.api.get<{ data: ReapplicationDueItem[]; totalCount: number }>('/api/platinum/billing-attp/reapplication-due', { days: String(days) });
  }

  submitReapplication(request: SubmitReapplicationRequest): Observable<ReapplicationResponse> {
    return this.api.post<ReapplicationResponse>('/api/platinum/billing-attp/submit-reapplication', request);
  }

  terminateApplication(request: TerminateRequest): Observable<TerminateResponse> {
    return this.api.post<TerminateResponse>('/api/platinum/billing-attp/terminate-application', request);
  }

  batchTerminate(request: BatchTerminateRequest): Observable<BatchTerminateResponse> {
    return this.api.post<BatchTerminateResponse>('/api/platinum/billing-attp/batch-terminate', request);
  }

  bulkActivate(request: BulkActivateRequest): Observable<BulkActivateResponse> {
    return this.api.post<BulkActivateResponse>('/api/platinum/billing-attp/bulk-activate', request);
  }

  overrideDisqualification(request: OverrideDisqualificationRequest): Observable<OverrideResponse> {
    return this.api.post<OverrideResponse>('/api/platinum/billing-attp/override-disqualification', request);
  }

  getContractors(): Observable<Contractor[]> {
    return this.api.get<Contractor[]>('/api/platinum/billing-attp/contractors');
  }

  saveContractor(request: SaveContractorRequest): Observable<Contractor> {
    return this.api.post<Contractor>('/api/platinum/billing-attp/save-contractor', request);
  }

  getDeclineReasons(): Observable<DeclineReason[]> {
    return this.api.get<DeclineReason[]>('/api/platinum/billing-attp/decline-reasons');
  }

  getIncomeSources(): Observable<IncomeSourceItem[]> {
    return this.api.get<IncomeSourceItem[]>('/api/platinum/billing-attp/income-sources');
  }

  getEmployers(): Observable<Employer[]> {
    return this.api.get<Employer[]>('/api/platinum/billing-attp/employers');
  }

  saveIndigentTypeRules(request: IndigentTypeRule): Observable<IndigentTypeRule> {
    return this.api.post<IndigentTypeRule>('/api/platinum/billing-attp/save-indigent-type-rules', request);
  }

  saveCommConfig(config: {
    indigentTypeId: number;
    enableIndigentCommunications: boolean;
    applicationSlaTargetDays: number;
    ccStakeholders: CcStakeholder[];
    communicationTemplates: CommunicationTemplate[];
  }): Observable<{ success: boolean }> {
    return this.api.post<{ success: boolean }>('/api/indigent-comm-config/save', config);
  }

  getAutomatedLetters(indigentTypeId?: number): Observable<AutomatedLetter[]> {
    const params: Record<string, string> = {};
    if (indigentTypeId) params['indigentTypeId'] = String(indigentTypeId);
    return this.api.get<AutomatedLetter[]>('/api/platinum/billing-attp/automated-letters', params);
  }

  saveAutomatedLetter(request: SaveAutomatedLetterRequest): Observable<AutomatedLetter> {
    return this.api.post<AutomatedLetter>('/api/platinum/billing-attp/save-automated-letter', request);
  }

  getApplicationStats(finYear?: string): Observable<ApplicationStats> {
    const params: Record<string, string> = {};
    if (finYear) params['finYear'] = finYear;
    return this.api.get<ApplicationStats>('/api/platinum/billing-attp/application-stats', params);
  }

  doNotCutUpdate(request: DoNotCutUpdateRequest): Observable<DoNotCutUpdateResponse> {
    return this.api.post<DoNotCutUpdateResponse>('/api/platinum/billing-attp/do-not-cut-update', request);
  }

  getApplicationHistory(accountId: number): Observable<Record<string, unknown>[]> {
    return this.api.get<Record<string, unknown>[]>('/api/platinum/billing-enquiry/attp-application-history', { accountId: String(accountId) });
  }

  getSubsidyItemCounts(): Observable<SubsidyItemCounts> {
    return this.api.get<SubsidyItemCounts>('/api/platinum/billing-dashboard/get-subsidy-item-counts');
  }

  getAuthorizationDetails(): Observable<Record<string, unknown>[]> {
    return this.api.get<Record<string, unknown>[]>('/api/platinum/billing-dashboard/get-attp-application-authorization-details');
  }

  getTerminationDetails(): Observable<Record<string, unknown>[]> {
    return this.api.get<Record<string, unknown>[]>('/api/platinum/billing-dashboard/get-attp-application-termination-details');
  }

  getAwaitingVerification(): Observable<Record<string, unknown>[]> {
    return this.api.get<Record<string, unknown>[]>('/api/platinum/billing-dashboard/get-awaiting-verification');
  }

  getAutomaticDisqualification(): Observable<Record<string, unknown>[]> {
    return this.api.get<Record<string, unknown>[]>('/api/platinum/billing-dashboard/get-automatic-disqualification');
  }

  getDeclinedApplications(): Observable<Record<string, unknown>[]> {
    return this.api.get<Record<string, unknown>[]>('/api/platinum/billing-dashboard/get-awaiting-application-declined-details');
  }

  getDocumentTypes(): Observable<ATTPDocumentType[]> {
    return this.api.get<ATTPDocumentType[]>('/api/platinum/billing-attp/document-types');
  }

  saveDocumentType(data: SaveDocumentTypeRequest): Observable<ATTPDocumentType> {
    return this.api.post<ATTPDocumentType>('/api/platinum/billing-attp/save-document-type', data);
  }

  getDocuments(applicationId: number): Observable<ATTPDocument[]> {
    return this.api.get<ATTPDocument[]>('/api/platinum/billing-attp/documents', { applicationId: String(applicationId) });
  }

  downloadDocument(documentId: number): Observable<{ fileData: string; fileName: string; contentType: string }> {
    return this.api.get<{ fileData: string; fileName: string; contentType: string }>('/api/platinum/billing-attp/download-document', { docId: String(documentId) });
  }

  uploadDocument(data: UploadDocumentRequest): Observable<ATTPDocument> {
    return this.api.post<ATTPDocument>('/api/platinum/billing-attp/upload-document', data);
  }

  deleteDocument(documentId: number): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>('/api/platinum/billing-attp/delete-document', { docId: String(documentId) });
  }

  getSignatures(applicationId: number): Observable<ATTPSignature[]> {
    return this.api.get<ATTPSignature[]>('/api/platinum/billing-attp/signatures', { appId: String(applicationId) });
  }

  saveSignature(data: SaveSignatureRequest): Observable<ATTPSignature> {
    return this.api.post<ATTPSignature>('/api/platinum/billing-attp/save-signature', data);
  }

  getClientIp(): Observable<{ ip: string; userAgent: string }> {
    return this.api.get<{ ip: string; userAgent: string }>('/api/client-ip');
  }

  getVerificationProviders(): Observable<VerificationProvider[]> {
    return this.api.get<VerificationProvider[]>('/api/platinum/billing-attp/verification-providers');
  }

  saveVerificationProvider(data: SaveVerificationProviderRequest): Observable<VerificationProvider> {
    return this.api.post<VerificationProvider>('/api/platinum/billing-attp/save-verification-provider', data);
  }

  runIdVerification(data: { appId: number; idNumber: string; providerId: number }): Observable<IDVerificationResult> {
    return this.api.post<IDVerificationResult>('/api/platinum/billing-attp/run-id-verification', data);
  }

  getIdVerificationHistory(applicationId: number): Observable<IDVerificationResult[]> {
    return this.api.get<IDVerificationResult[]>('/api/platinum/billing-attp/id-verification-history', { appId: String(applicationId) });
  }

  getTerminationQueue(params?: { page?: number; pageSize?: number; status?: string }): Observable<PaginatedResponse<TerminationQueueItem>> {
    const p: Record<string, string> = {};
    if (params?.page) p['page'] = String(params.page);
    if (params?.pageSize) p['pageSize'] = String(params.pageSize);
    if (params?.status) p['status'] = params.status;
    return this.api.get<PaginatedResponse<TerminationQueueItem>>('/api/platinum/billing-attp/termination-queue', p);
  }

  getTerminationReasons(): Observable<{ reasonId: number; reasonName: string }[]> {
    return this.api.get<{ reasonId: number; reasonName: string }[]>('/api/platinum/billing-attp/termination-reasons');
  }

  getHomeVisitOutcomes(): Observable<{ outcomeId: number; outcomeName: string }[]> {
    return this.api.get<{ outcomeId: number; outcomeName: string }[]>('/api/platinum/billing-attp/home-visit-outcomes');
  }

  getVerificationOutcomes(): Observable<{ outcomeId: number; outcomeName: string }[]> {
    return this.api.get<{ outcomeId: number; outcomeName: string }[]>('/api/platinum/billing-attp/verification-outcomes');
  }

  saveDeclineReason(data: SaveDeclineReasonRequest): Observable<DeclineReason> {
    return this.api.post<DeclineReason>('/api/platinum/billing-attp/save-decline-reason', data);
  }

  saveIncomeSource(data: SaveIncomeSourceRequest): Observable<IncomeSourceItem> {
    return this.api.post<IncomeSourceItem>('/api/platinum/billing-attp/save-income-source', data);
  }

  saveEmployer(data: { employerId?: number | null; employerName: string; isActive: boolean; capturerID: number; dateCaptured: string; modifierID: number; dateModified: string }): Observable<any> {
    return this.api.post<any>('/api/platinum/billing-attp/save-employer', data);
  }

  getOccupierTypes(): Observable<OccupierTypeConfig[]> {
    return this.api.get<OccupierTypeConfig[]>('/api/config/occupier-types/all');
  }

  getActiveOccupierTypes(): Observable<OccupierTypeConfig[]> {
    return this.api.get<OccupierTypeConfig[]>('/api/config/occupier-types');
  }

  saveOccupierType(data: { occupierTypeId?: number | null; name: string; includeInHouseholdIncome: boolean; isActive: boolean }): Observable<OccupierTypeConfig> {
    return this.api.post<OccupierTypeConfig>('/api/config/occupier-types', data);
  }

  deleteOccupierType(id: number): Observable<any> {
    return this.api.delete<any>(`/api/config/occupier-types/${id}`);
  }

  seedIncomeSources(): Observable<{ created: number; errors: string[]; results: any[] }> {
    return this.api.post<{ created: number; errors: string[]; results: any[] }>('/api/platinum/billing-attp/seed-income-sources', {});
  }

  getFieldWorkers(contractorId?: number): Observable<FieldWorker[]> {
    const params: Record<string, string> = {};
    if (contractorId) params['contractorId'] = String(contractorId);
    return this.api.get<FieldWorker[]>('/api/platinum/billing-attp/field-workers', params);
  }

  allocateContractors(request: ContractorAllocationRequest): Observable<ContractorAllocationResponse> {
    return this.api.post<ContractorAllocationResponse>('/api/platinum/billing-attp/allocate-contractors', request);
  }

  getSteercomReferrals(params?: { page?: number; pageSize?: number; fromDate?: string; toDate?: string; indigentTypeId?: number }): Observable<PaginatedResponse<SteercomReferralItem>> {
    const p: Record<string, string> = {};
    if (params?.page) p['page'] = String(params.page);
    if (params?.pageSize) p['pageSize'] = String(params.pageSize);
    if (params?.fromDate) p['fromDate'] = params.fromDate;
    if (params?.toDate) p['toDate'] = params.toDate;
    if (params?.indigentTypeId) p['indigentTypeId'] = String(params.indigentTypeId);
    return this.api.get<PaginatedResponse<SteercomReferralItem>>('/api/platinum/billing-attp/steercom-referrals', p);
  }

  async searchAccounts(searchTerm: string): Promise<AccountSearchResult[]> {
    const trimmed = searchTerm.trim();
    const isNumeric = /^\d+$/.test(trimmed);
    if (isNumeric) {
      const items = await firstValueFrom(
        this.api.get<{displayItem: string, accountId: number}[]>('/api/platinum/billing-enquiry/autocomplete', { search: trimmed, type: 'accountNumber' })
      );
      const enriched: AccountSearchResult[] = [];
      for (const item of (items || []).slice(0, 10)) {
        try {
          const d = await firstValueFrom(this.api.get<any>('/api/platinum/billing-enquiry/basic-account-details', { AccountId: String(item.accountId), IsSundryDebtor: 'false' }));
          const result: AccountSearchResult = {
            accountID: item.accountId,
            account_ID: item.accountId,
            accountNumber: d.accountNumber || item.displayItem,
            name: d.fullNAME || '',
            surname_Company: '',
            initials: '',
            idRegistrationNumber: '',
            deliveryAddress: '',
            locationAddress: d.fullAddress || '',
            statusDesc: '',
            outStandingAmt: d.outStandingAmt || 0,
            outStandingAmount: d.outStandingAmt || 0,
            cellNumber: '',
            emailAddress: '',
          };
          enriched.push(result);
        } catch { /* skip enrichment failures */ }
      }
      return enriched;
    }
    return firstValueFrom(
      this.api.post<AccountSearchResult[]>('/api/platinum/billing-payment/search-accounts', { name: trimmed })
    );
  }

  async getAccountAutocomplete(q: string): Promise<{accountId: number, displayItem: string, accountName: string, address: string, balance: number | null, status: string}[]> {
    const trimmed = q.trim();
    const isNumeric = /^\d+$/.test(trimmed);
    if (isNumeric) {
      const items = await firstValueFrom(
        this.api.get<{displayItem: string, accountId: number}[]>('/api/platinum/billing-enquiry/autocomplete', { search: trimmed, type: 'accountNumber' })
      );
      return (items || []).slice(0, 8).map(r => ({
        accountId: r.accountId, displayItem: r.displayItem, accountName: '', address: '', balance: null, status: '',
      }));
    } else {
      const results = await firstValueFrom(
        this.api.post<any[]>('/api/platinum/billing-payment/search-accounts', { name: trimmed })
      );
      return (results || []).slice(0, 8)
        .map((r: any) => ({
          accountId: r.accountID || r.account_ID || 0,
          displayItem: r.accountNumber || '',
          accountName: ((r.name || '') + ' ' + (r.surname_Company || '')).trim() || r.fullNAME || '',
          address: r.locationAddress || '',
          balance: r.outStandingAmt ?? null,
          status: r.accountStatus || '',
        }))
        .filter(r => r.accountId > 0);
    }
  }

  async getAccountDetails(accountId: number): Promise<any> {
    return firstValueFrom(
      this.api.get<any>('/api/platinum/billing-enquiry/basic-account-details', { AccountId: String(accountId), IsSundryDebtor: 'false' })
    );
  }

  getAccountBalance(accountId: number): Observable<any[]> {
    return this.api.get<any[]>(`/api/platinum/billing-enquiry/total-balance-debt-inquiry/${accountId}`);
  }

  async getApplicationHistoryAsync(accountId: number): Promise<any[]> {
    return firstValueFrom(
      this.api.get<any[]>('/api/platinum/billing-enquiry/attp-application-history', { accountId: String(accountId) })
    );
  }

  getExpiringApplications(params: Record<string, string | number>): Observable<any> {
    const qp: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => qp[k] = String(v));
    return this.api.get<any>('/api/platinum/billing-attp/get-expiring-applications', qp);
  }

  runAutoTermination(request: { indigentTypeId?: number; dryRun?: boolean }): Observable<any> {
    return this.api.post<any>('/api/platinum/billing-attp/run-auto-termination', request);
  }

  getAutoTerminationLog(params?: Record<string, string>): Observable<any[]> {
    return this.api.get<any[]>('/api/platinum/billing-attp/auto-termination-log', params);
  }

  logCommunication(log: {
    accountId: string; accountNumber?: string; accountHolder?: string;
    method: string; recipients: string; subject?: string; messageBody?: string;
    statementType?: string;
  }): Observable<any> {
    return this.api.post<any>('/api/communication-logs', log);
  }

  getCommunicationLogs(accountId: string, applicationId?: string | number): Observable<CommunicationLogEntry[]> {
    const params: Record<string, string> = {};
    if (applicationId) params['applicationId'] = String(applicationId);
    const local$ = this.api.get<CommunicationLogEntry[]>(`/api/communication-logs/${accountId}`, params).pipe(catchError(() => of([] as CommunicationLogEntry[])));
    const platParams: Record<string, string> = { accountNo: accountId };
    if (applicationId) platParams['applicationId'] = String(applicationId);
    const platinum$ = this.api.get<any[]>('/api/platinum/billing-attp/indigent-comm-logs', platParams).pipe(
      map((items: any[]) => (items || []).filter((i: any) => i && !i._error).map((i: any) => ({
        id: i.id || i.commLogId || 0,
        accountId: String(i.accountId || i.accountID || accountId),
        accountNumber: i.accountNumber || i.accountNo || '',
        accountHolder: i.accountHolder || '',
        method: i.method || '',
        recipients: i.recipients || '',
        subject: i.subject || '',
        messageBody: i.messageBody || '',
        eventType: i.eventType || '',
        indigentTypeName: i.indigentTypeName || '',
        status: i.status || 'sent',
        createdAt: i.createdAt || i.dateCaptured || i.sentDate || new Date().toISOString(),
        sentBy: i.sentBy || i.sentById || '',
        sentByName: i.sentByName || '',
        source: 'platinum',
      } as any))),
      catchError(() => of([] as CommunicationLogEntry[]))
    );
    return forkJoin([local$, platinum$]).pipe(
      map(([localLogs, platLogs]) => {
        const combined = [...localLogs.map(l => ({ ...l, source: 'local' as string })), ...platLogs];
        const seen = new Set<string>();
        return combined.filter(log => {
          const key = `${log.method}-${log.recipients}-${log.subject}-${log.eventType || ''}-${(log.createdAt || '').toString()}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      })
    );
  }

  getCommunicationAuditLogs(params: Record<string, string>): Observable<CommunicationLogEntry[]> {
    return this.api.get<CommunicationLogEntry[]>('/api/communication-logs-audit', params);
  }

  sendIndigentNotification(params: {
    eventType: IndigentLifecycleEvent;
    template: CommunicationTemplate;
    mergeData: Record<string, string>;
    recipientEmail?: string;
    recipientPhone?: string;
    accountId: string;
    accountNumber: string;
    accountHolder: string;
    indigentTypeName?: string;
    applicationId?: string;
    ccStakeholders?: CcStakeholder[];
  }): Promise<{ sent: boolean; channels: string[] }> {
    return this._sendIndigentNotificationAsync(params);
  }

  private async _sendIndigentNotificationAsync(params: {
    eventType: IndigentLifecycleEvent;
    template: CommunicationTemplate;
    mergeData: Record<string, string>;
    recipientEmail?: string;
    recipientPhone?: string;
    accountId: string;
    accountNumber: string;
    accountHolder: string;
    indigentTypeName?: string;
    applicationId?: string;
    ccStakeholders?: CcStakeholder[];
  }): Promise<{ sent: boolean; channels: string[] }> {
    const { eventType, template, mergeData, recipientEmail, recipientPhone, accountId, accountNumber, accountHolder, indigentTypeName, applicationId, ccStakeholders } = params;
    const subject = this.mergePlaceholders(template.subject, mergeData);
    const body = this.mergePlaceholders(template.body, mergeData);
    const dispatches: Promise<string>[] = [];

    if (template.emailEnabled && recipientEmail) {
      const ccList = (ccStakeholders || []).map(cc => cc.email).filter(Boolean).join(';');
      dispatches.push(
        firstValueFrom(this.api.post('/api/communications/dispatch', {
          channel: 'email',
          recipient: recipientEmail,
          subject,
          message: body,
          messageBody: body,
          accountNo: accountNumber,
          accountId,
          accountHolder,
          ccRecipients: ccList,
          eventType,
          indigentTypeName,
          applicationId,
        })).then(() => 'email')
      );
    }

    if (template.smsEnabled && recipientPhone) {
      const smsBody = body.length > 160 ? body.substring(0, 157) + '...' : body;
      dispatches.push(
        firstValueFrom(this.api.post('/api/communications/dispatch', {
          channel: 'sms',
          sendingType: 'SMS',
          recipient: recipientPhone,
          phoneNumber: recipientPhone,
          message: smsBody,
          body: smsBody,
          subject,
          accountNo: accountNumber,
          accountId,
          accountHolder,
          eventType,
          indigentTypeName,
          applicationId,
        })).then(() => 'sms')
      );
    }

    if (dispatches.length === 0) {
      return { sent: false, channels: [] };
    }

    const results = await Promise.allSettled(dispatches);
    const succeeded = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map(r => r.value);
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      failed.forEach(r => console.error(`[comm] dispatch failed for ${eventType}:`, (r as PromiseRejectedResult).reason));
    }

    if (succeeded.length > 0) {
      firstValueFrom(this.api.post('/api/platinum/billing-attp/indigent-comm-log', {
        accountId: Number(accountId) || 0,
        accountNumber: accountNumber,
        accountHolder: accountHolder,
        method: succeeded.join(','),
        recipients: [recipientEmail, recipientPhone].filter(Boolean).join('; '),
        subject,
        messageBody: body,
        eventType,
        indigentTypeName: indigentTypeName || '',
        applicationId: applicationId ? Number(applicationId) : undefined,
      })).catch(err => console.warn('[comm] Platinum comm-log fallback:', err));
    }

    return { sent: succeeded.length > 0, channels: succeeded };
  }

  fireLifecycleNotification(params: {
    indigentType: IndigentType;
    eventType: IndigentLifecycleEvent;
    mergeData: Record<string, string>;
    recipientEmail?: string;
    recipientPhone?: string;
    accountId: string;
    accountNumber: string;
    accountHolder: string;
  }): void {
    const { indigentType, eventType, mergeData, recipientEmail, recipientPhone, accountId, accountNumber, accountHolder } = params;
    if (!indigentType.enableIndigentCommunications) return;
    const templates = indigentType.communicationTemplates || [];
    const template = templates.find(t => t.eventType === eventType);
    if (!template || (!template.emailEnabled && !template.smsEnabled)) return;

    this.sendIndigentNotification({
      eventType,
      template,
      mergeData,
      recipientEmail,
      recipientPhone,
      accountId,
      accountNumber,
      accountHolder,
      indigentTypeName: indigentType.indigentTypeName,
      applicationId: mergeData['applicationId'],
      ccStakeholders: indigentType.ccStakeholders,
    });
  }

  private mergePlaceholders(text: string, data: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? '');
  }

  computeSlaInfo(applicationDate: string, slaTargetDays: number, commLogs?: CommunicationLogEntry[]): SlaInfo {
    const appDate = new Date(applicationDate);
    const now = new Date();
    const daysElapsed = Math.floor((now.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24));
    const target = slaTargetDays || 30;

    let ballWith: 'municipality' | 'applicant' = 'municipality';
    let lastMunicipalityAction: string | null = null;
    let lastApplicantResponse: string | null = null;

    if (commLogs && commLogs.length > 0) {
      const sortedLogs = [...commLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const docRequestEvents = ['documents_outstanding'];
      const applicantResponseEvents = ['reapplication_received'];

      const lastDocRequest = sortedLogs.find(l =>
        docRequestEvents.includes(l.eventType || '') ||
        l.subject?.toLowerCase().includes('outstanding')
      );
      const lastApplicantLog = sortedLogs.find(l =>
        applicantResponseEvents.includes(l.eventType || '')
      );

      const anyMuniAction = sortedLogs.find(l => l.eventType && l.eventType !== '');
      if (anyMuniAction) {
        lastMunicipalityAction = anyMuniAction.createdAt;
      }
      if (lastApplicantLog) {
        lastApplicantResponse = lastApplicantLog.createdAt;
      }

      if (lastDocRequest) {
        if (!lastApplicantLog || new Date(lastDocRequest.createdAt) > new Date(lastApplicantLog.createdAt)) {
          ballWith = 'applicant';
        }
      }
    }

    let ragStatus: 'green' | 'amber' | 'red';
    const greenThreshold = Math.floor(target * 0.5);
    const amberThreshold = Math.floor(target * 0.833);
    if (daysElapsed < greenThreshold) ragStatus = 'green';
    else if (daysElapsed <= amberThreshold) ragStatus = 'amber';
    else ragStatus = 'red';

    return { applicationDate, daysElapsed, ballWith, lastMunicipalityAction, lastApplicantResponse, ragStatus, slaTargetDays: target };
  }

  async requestOutstandingDocuments(params: {
    applicationId: number;
    accountId: string;
    accountNumber: string;
    accountHolder: string;
    recipientEmail?: string;
    recipientPhone?: string;
    missingDocuments: string[];
    deadlineDays: number;
    customMessage?: string;
    indigentType: IndigentType;
  }): Promise<{ sent: boolean; channels: string[] }> {
    const { applicationId, accountId, accountNumber, accountHolder, recipientEmail, recipientPhone, missingDocuments, deadlineDays, customMessage, indigentType } = params;
    if (!indigentType.enableIndigentCommunications) {
      return { sent: false, channels: [] };
    }
    const templates = indigentType.communicationTemplates || [];
    const template = templates.find(t => t.eventType === 'documents_outstanding');
    if (!template || (!template.emailEnabled && !template.smsEnabled)) {
      return { sent: false, channels: [] };
    }

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + deadlineDays);
    const deadlineStr = deadline.toLocaleDateString('en-ZA');
    const docList = missingDocuments.map(d => `- ${d}`).join('\n');
    const additionalNote = customMessage ? `\n\n${customMessage}` : '';

    return this.sendIndigentNotification({
      eventType: 'documents_outstanding',
      template,
      mergeData: {
        applicantName: accountHolder,
        accountNumber,
        applicationId: String(applicationId),
        missingDocuments: docList + additionalNote,
        deadline: deadlineStr,
        indigentTypeName: indigentType.indigentTypeName,
      },
      recipientEmail,
      recipientPhone,
      accountId,
      accountNumber,
      accountHolder,
      indigentTypeName: indigentType.indigentTypeName,
      applicationId: String(applicationId),
      ccStakeholders: indigentType.ccStakeholders,
    });
  }
}
