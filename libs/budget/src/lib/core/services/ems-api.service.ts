import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const BASE = '/api/ems';

export interface EmsProjectSummary {
  projectId: number;
  projectCode: number | null;
  projectName: string;
  projectDesc: string | null;
  finYear: string | null;
  projectStatus: number;
  projectStatusLabel: string;
  capitalOperation: number | null;
  capitalOperationLabel: string;
  costEstimate: number;
  itemCount: number;
  totalY1: number;
  totalY2: number;
  totalY3: number;
  dateCaptured: string;
}

export interface EmsProjectItemDto {
  planProjectItemId: number;
  projectId: number;
  finYear: string | null;
  scoaItemCode: string | null;
  scoaItemDesc: string | null;
  scoaFundCode: string | null;
  scoaFundDesc: string | null;
  scoaFunctionCode: string | null;
  scoaFunctionDesc: string | null;
  scoaRegionCode: string | null;
  scoaCostingCode: string | null;
  budgetAmount: number | null;
  budgetAmountCurP1: number | null;
  budgetAmountCurP2: number | null;
  creditDebit: string | null;
}

export interface EmsProjectDetail extends EmsProjectSummary {
  items: EmsProjectItemDto[];
}

export interface EmsAvailableBudget {
  planProjectItemId: number;
  originalBudget: number;
  adjustments: number;
  totalVirementAmount: number;
  currentBudget: number;
  reserved: number;
  commitment: number;
  actual: number;
  availableBudget: number;
}

export interface EmsBudgetVersionSummary {
  budgetVersionId: number;
  versionNumber: string | null;
  versionName: string | null;
  comments: string | null;
  capturerID: number;
  dateCaptured: string;
  itemCount: number;
  totalY1: number;
  totalY2: number;
  totalY3: number;
}

export interface EmsBudgetVersionDetail extends EmsBudgetVersionSummary {
  details: EmsBudgetVersionDetailRow[];
}

export interface EmsBudgetVersionDetailRow {
  budgetVersionDetailId: number;
  projectId: number;
  projectCode: number | null;
  projectName: string | null;
  finYear: string | null;
  planProjectItemId: number;
  scoaItemCode: string | null;
  scoaItemDesc: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  capitalOperation: number;
  budgetAmount: number | null;
  budgetAmountCurP1: number | null;
  budgetAmountCurP2: number | null;
}

export interface EmsVersionCreateResult {
  result: string;
  budgetVersionId: number;
  versionNumber: string;
}

export interface EmsApprovalResult {
  projectsActivated: number;
  budgetLinesInitialised: number;
  errors: string[];
}

export interface EmsConsumptionReportRow {
  planProjectItemId: number;
  projectId: number;
  projectCode: number | null;
  projectName: string;
  finYear: string | null;
  scoaItemCode: string | null;
  scoaItemDesc: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  creditDebit: string | null;
  originalBudget: number;
  adjustments: number;
  virements: number;
  currentBudget: number;
  reserved: number;
  committed: number;
  actual: number;
  available: number;
  availablePct: number;
}

export interface EmsConsumptionHistory {
  budgetConsumption_ID: number;
  finYear: string;
  pK_TransactionID: number;
  transactionTableName: string;
  consumingTransactionAmount: number | null;
  availableBudget: number | null;
  reserveToDate: number | null;
  commitToDate: number | null;
  actualToDate: number | null;
  budgetConsumptionProcessID: number;
  dateCaptured: string;
}

export interface EmsVirementListDto {
  virementId: number;
  finYear: string | null;
  virementReferenceNumber: string | null;
  fromProjectId: number;
  fromProjectCode: number | null;
  fromProjectName: string | null;
  toProjectId: number;
  toProjectCode: number | null;
  toProjectName: string | null;
  fromVirementAmount: number | null;
  toVirementAmount: number | null;
  status: string | null;
  nextApproverName: string | null;
  nextApproverUserId: number | null;
  dateCaptured: string;
  approverCount: number;
  approvedCount: number;
}

export interface EmsApprovalStep {
  order: number;
  userId: number | null;
  userDisplay: string | null;
  status: string | null;
  actionDate: string | null;
  reason: string | null;
}

export interface EmsVirementDetail extends EmsVirementListDto {
  reasonForVirement: string | null;
  approvalChain: EmsApprovalStep[];
}

export interface EmsValidationResult {
  ruleId: number;
  ruleDesc: string;
  severity: string;
  projectId: number | null;
  projectCode: number | null;
  projectName: string | null;
  planProjectItemId: number | null;
  scoaItemCode: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  message: string;
}

export interface EmsNTValidationSummary {
  versionId: number;
  finYear: string | null;
  totalChecked: number;
  errors: number;
  warnings: number;
  passed: number;
  results: EmsValidationResult[];
}

@Injectable({ providedIn: 'root' })
export class EmsApiService {
  constructor(private http: HttpClient) {}

  getProjects(finYear?: string, divisionId?: number, status?: number): Observable<EmsProjectSummary[]> {
    let params = new HttpParams();
    if (finYear) params = params.set('finYear', finYear);
    if (divisionId) params = params.set('divisionId', divisionId);
    if (status !== undefined) params = params.set('status', status);
    return this.http.get<EmsProjectSummary[]>(`${BASE}/projects`, { params });
  }

  getProject(id: number): Observable<EmsProjectDetail> {
    return this.http.get<EmsProjectDetail>(`${BASE}/projects/${id}`);
  }

  createProject(project: Partial<any>): Observable<any> {
    return this.http.post(`${BASE}/projects`, project);
  }

  updateProject(id: number, project: Partial<any>): Observable<any> {
    return this.http.put(`${BASE}/projects/${id}`, project);
  }

  deleteProject(id: number): Observable<any> {
    return this.http.delete(`${BASE}/projects/${id}`);
  }

  getProjectItems(projectId: number): Observable<EmsProjectItemDto[]> {
    return this.http.get<EmsProjectItemDto[]>(`${BASE}/projects/${projectId}/items`);
  }

  addProjectItem(projectId: number, item: Partial<any>): Observable<any> {
    return this.http.post(`${BASE}/projects/${projectId}/items`, item);
  }

  deleteProjectItem(projectId: number, itemId: number): Observable<any> {
    return this.http.delete(`${BASE}/projects/${projectId}/items/${itemId}`);
  }

  getAvailableBudget(planProjectItemId: number): Observable<EmsAvailableBudget> {
    return this.http.get<EmsAvailableBudget>(`${BASE}/projects/items/${planProjectItemId}/budget-summary`);
  }

  getBudgetVersions(finYear?: string): Observable<EmsBudgetVersionSummary[]> {
    let params = new HttpParams();
    if (finYear) params = params.set('finYear', finYear);
    return this.http.get<EmsBudgetVersionSummary[]>(`${BASE}/budget-versions`, { params });
  }

  getBudgetVersionDetail(id: number): Observable<EmsBudgetVersionDetail> {
    return this.http.get<EmsBudgetVersionDetail>(`${BASE}/budget-versions/${id}`);
  }

  createBudgetVersion(req: { versionNumber: string; versionName: string; comments: string; finYear: string; userId: number }): Observable<EmsVersionCreateResult> {
    return this.http.post<EmsVersionCreateResult>(`${BASE}/budget-versions/create`, req);
  }

  initiateBudgetApproval(req: { finYear: string; userId: number }): Observable<EmsApprovalResult> {
    return this.http.post<EmsApprovalResult>(`${BASE}/budget-versions/approve`, req);
  }

  getBudgetConsumptionReport(finYear: string, divisionId?: number, projectId?: number): Observable<EmsConsumptionReportRow[]> {
    let params = new HttpParams().set('finYear', finYear);
    if (divisionId) params = params.set('divisionId', divisionId);
    if (projectId) params = params.set('projectId', projectId);
    return this.http.get<EmsConsumptionReportRow[]>(`${BASE}/budget-consumption/report`, { params });
  }

  getConsumptionBalance(planProjectItemId: number, finYear: string): Observable<any> {
    return this.http.get(`${BASE}/budget-consumption/balance/${planProjectItemId}`, {
      params: new HttpParams().set('finYear', finYear)
    });
  }

  getConsumptionHistory(planProjectItemId: number, finYear: string): Observable<EmsConsumptionHistory[]> {
    return this.http.get<EmsConsumptionHistory[]>(`${BASE}/budget-consumption/history/${planProjectItemId}`, {
      params: new HttpParams().set('finYear', finYear)
    });
  }

  getVirements(finYear?: string): Observable<EmsVirementListDto[]> {
    let params = new HttpParams();
    if (finYear) params = params.set('finYear', finYear);
    return this.http.get<EmsVirementListDto[]>(`${BASE}/virements`, { params });
  }

  getVirement(id: number): Observable<EmsVirementDetail> {
    return this.http.get<EmsVirementDetail>(`${BASE}/virements/${id}`);
  }

  createVirement(req: any): Observable<any> {
    return this.http.post(`${BASE}/virements`, req);
  }

  approveVirement(id: number, userId: number, comment?: string): Observable<any> {
    return this.http.post(`${BASE}/virements/${id}/approve`, { userId, comment });
  }

  rejectVirement(id: number, userId: number, comment: string): Observable<any> {
    return this.http.post(`${BASE}/virements/${id}/reject`, { userId, comment });
  }

  runNTValidations(versionId: number): Observable<EmsNTValidationSummary> {
    return this.http.post<EmsNTValidationSummary>(`${BASE}/validations/run`, { versionId });
  }
}
