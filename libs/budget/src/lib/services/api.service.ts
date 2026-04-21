import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  FinancialYear, BudgetVersionSummary, BudgetVersionDetail, BudgetStringList,
  ScoaSegment, ValidationRun, VirementListItem, CfoDashboard, ProjectItem,
  ProjectBudgetLine, ValidationDashboard, BudgetOverview, MtrefSummary, Department,
  ServiceCategory, Tariff, TariffScenarioSummary, TariffScenario, ScenarioComparison,
  ConsumerCategory, ProjectedBill, RevenueProjection, RevenueProjectionSummary,
  RebateType, RebateProjection, DraftRevenueBudget, BillingIntegrationStatus,
  ExpenditureCategory, CostItem, ExpenditureScenarioSummary, ExpenditureScenario,
  ExpenditureScenarioComparison, CreditorCategoryDetail, CreditorPaymentArrangement,
  AgeAnalysis, ExpenditureProjection, ExpenditureProjectionSummary,
  CreditorLiabilitySummary, ForecastAssumption, SensitivityAnalysis,
  DraftExpenditureBudget, CreditorsIntegrationStatus,
  PostEstablishment, SalaryStructure, SalaryIncrease, TemporaryContract,
  CouncillorPosition, WardCommitteeBudget, VariableBenefitHours,
  TravelRequirement, TravelStandardRate, StatutoryDeduction,
  PayrollLiability, DefinedBenefitObligation, LongServiceAward,
  PerformanceBonus, PayrollScenario, PayrollBudgetLine,
  PayrollBudgetSummary, PostEstablishmentSummary, DboSummary
} from '../models/budget.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = '/budget-app/api';

  constructor(private http: HttpClient) {}

  getFinancialYears(): Observable<FinancialYear[]> {
    return this.http.get<FinancialYear[]>(`${this.base}/financialyears`);
  }

  getActiveFinancialYear(): Observable<FinancialYear> {
    return this.http.get<FinancialYear>(`${this.base}/financialyears/active`);
  }

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.base}/departments`);
  }

  getBudgetVersions(financialYearId?: number, type?: string, status?: string): Observable<BudgetVersionSummary[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    if (type) params = params.set('type', type);
    if (status) params = params.set('status', status);
    return this.http.get<BudgetVersionSummary[]>(`${this.base}/budgetversions`, { params });
  }

  getBudgetVersion(id: number): Observable<BudgetVersionDetail> {
    return this.http.get<BudgetVersionDetail>(`${this.base}/budgetversions/${id}`);
  }

  createBudgetVersion(data: any): Observable<any> {
    return this.http.post(`${this.base}/budgetversions`, data);
  }

  submitBudgetVersion(id: number, data: any): Observable<any> {
    return this.http.post(`${this.base}/budgetversions/${id}/submit-approval`, data);
  }

  approveBudgetVersion(id: number, data: any): Observable<any> {
    return this.http.post(`${this.base}/budgetversions/${id}/approve`, data);
  }

  rejectBudgetVersion(id: number, data: any): Observable<any> {
    return this.http.post(`${this.base}/budgetversions/${id}/reject`, data);
  }

  lockBudgetVersion(id: number, data: any): Observable<any> {
    return this.http.post(`${this.base}/budgetversions/${id}/lock`, data);
  }

  unlockBudgetVersion(id: number, data: any): Observable<any> {
    return this.http.post(`${this.base}/budgetversions/${id}/unlock-request`, data);
  }

  activateBudgetVersion(id: number, data: any): Observable<any> {
    return this.http.post(`${this.base}/budgetversions/${id}/activate`, data);
  }

  cloneBudgetVersion(id: number, data: any): Observable<any> {
    return this.http.post(`${this.base}/budgetversions/${id}/clone`, data);
  }

  getVersionDiff(idA: number, idB: number): Observable<any> {
    return this.http.get(`${this.base}/budgetversions/${idA}/diff/${idB}`);
  }

  getBudgetStrings(versionId?: number, module?: string, itemId?: number, fundId?: number): Observable<BudgetStringList[]> {
    let params = new HttpParams();
    if (versionId) params = params.set('versionId', versionId);
    if (module) params = params.set('module', module);
    if (itemId) params = params.set('itemId', itemId);
    if (fundId) params = params.set('fundId', fundId);
    return this.http.get<BudgetStringList[]>(`${this.base}/budgetstrings`, { params });
  }

  createBudgetString(data: any): Observable<any> {
    return this.http.post(`${this.base}/budgetstrings`, data);
  }

  updateBudgetString(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/budgetstrings/${id}`, data);
  }

  deleteBudgetString(id: number): Observable<any> {
    return this.http.delete(`${this.base}/budgetstrings/${id}`);
  }

  validateBudgetStrings(versionId: number): Observable<ValidationRun> {
    return this.http.post<ValidationRun>(`${this.base}/budgetstrings/validate?versionId=${versionId}`, {});
  }

  getBudgetStringSummary(versionId: number, groupBy: string = 'item'): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/budgetstrings/summary?versionId=${versionId}&groupBy=${groupBy}`);
  }

  getScoaItems(): Observable<ScoaSegment[]> { return this.http.get<ScoaSegment[]>(`${this.base}/scoa/items`); }
  getScoaFunds(): Observable<ScoaSegment[]> { return this.http.get<ScoaSegment[]>(`${this.base}/scoa/funds`); }
  getScoaFunctions(): Observable<ScoaSegment[]> { return this.http.get<ScoaSegment[]>(`${this.base}/scoa/functions`); }
  getScoaProjects(): Observable<ScoaSegment[]> { return this.http.get<ScoaSegment[]>(`${this.base}/scoa/projects`); }
  getScoaRegions(): Observable<ScoaSegment[]> { return this.http.get<ScoaSegment[]>(`${this.base}/scoa/regions`); }
  getScoaCostings(): Observable<ScoaSegment[]> { return this.http.get<ScoaSegment[]>(`${this.base}/scoa/costings`); }
  getScoaMscs(): Observable<ScoaSegment[]> { return this.http.get<ScoaSegment[]>(`${this.base}/scoa/mscs`); }

  getVirements(versionId?: number, status?: string): Observable<VirementListItem[]> {
    let params = new HttpParams();
    if (versionId) params = params.set('versionId', versionId);
    if (status) params = params.set('status', status);
    return this.http.get<VirementListItem[]>(`${this.base}/virements`, { params });
  }

  createVirement(data: any): Observable<any> {
    return this.http.post(`${this.base}/virements`, data);
  }

  submitVirement(id: number, data: any): Observable<any> {
    return this.http.post(`${this.base}/virements/${id}/submit`, data);
  }

  approveVirement(id: number, data: any): Observable<any> {
    return this.http.post(`${this.base}/virements/${id}/approve`, data);
  }

  rejectVirement(id: number, data: any): Observable<any> {
    return this.http.post(`${this.base}/virements/${id}/reject`, data);
  }

  returnVirement(id: number, data: any): Observable<any> {
    return this.http.post(`${this.base}/virements/${id}/return`, data);
  }

  getVirementDetail(id: number): Observable<any> {
    return this.http.get(`${this.base}/virements/${id}`);
  }

  getVirementApprovalChain(id: number): Observable<any> {
    return this.http.get(`${this.base}/virements/${id}/approval-chain`);
  }

  getBudgetSummary(budgetVersionId: number, itemId: number, fundId: number, functionId: number, projectId: number, regionId: number, costingId: number, mscId: number): Observable<any> {
    let params = new HttpParams()
      .set('budgetVersionId', budgetVersionId).set('itemId', itemId).set('fundId', fundId)
      .set('functionId', functionId).set('projectId', projectId).set('regionId', regionId)
      .set('costingId', costingId).set('mscId', mscId);
    return this.http.get(`${this.base}/virements/budget-summary`, { params });
  }

  getCfoDashboard(financialYearId?: number): Observable<CfoDashboard> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<CfoDashboard>(`${this.base}/dashboard/cfo`, { params });
  }

  getValidationDashboard(versionId?: number): Observable<ValidationDashboard> {
    let params = new HttpParams();
    if (versionId) params = params.set('versionId', versionId);
    return this.http.get<ValidationDashboard>(`${this.base}/dashboard/validation`, { params });
  }

  getBudgetOverview(versionId: number): Observable<BudgetOverview> {
    return this.http.get<BudgetOverview>(`${this.base}/dashboard/budget-overview/${versionId}`);
  }

  getMtrefSummary(versionId: number): Observable<MtrefSummary[]> {
    return this.http.get<MtrefSummary[]>(`${this.base}/dashboard/mtref-summary/${versionId}`);
  }

  getProjects(departmentId?: number, type?: string): Observable<ProjectItem[]> {
    let params = new HttpParams();
    if (departmentId) params = params.set('departmentId', departmentId);
    if (type) params = params.set('type', type);
    return this.http.get<ProjectItem[]>(`${this.base}/projects`, { params });
  }

  getProject(id: number): Observable<ProjectItem> {
    return this.http.get<ProjectItem>(`${this.base}/projects/${id}`);
  }

  createProject(data: any): Observable<any> {
    return this.http.post(`${this.base}/projects`, data);
  }

  updateProject(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/projects/${id}`, data);
  }

  getProjectBudgetLines(projectId: number): Observable<ProjectBudgetLine[]> {
    return this.http.get<ProjectBudgetLine[]>(`${this.base}/projects/${projectId}/budget-lines`);
  }

  addProjectBudgetLine(projectId: number, data: any): Observable<any> {
    return this.http.post(`${this.base}/projects/${projectId}/budget-lines`, data);
  }

  updateProjectBudgetLine(projectId: number, lineId: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/projects/${projectId}/budget-lines/${lineId}`, data);
  }

  deleteProjectBudgetLine(projectId: number, lineId: number): Observable<any> {
    return this.http.delete(`${this.base}/projects/${projectId}/budget-lines/${lineId}`);
  }

  batchUpdateProjectBudgetLines(projectId: number, lines: any[]): Observable<any> {
    return this.http.put(`${this.base}/projects/${projectId}/budget-lines/batch`, lines);
  }

  getBudgetVsActual(versionId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (versionId) params = params.set('versionId', versionId);
    return this.http.get<any[]>(`${this.base}/reports/budget-vs-actual`, { params });
  }

  getScheduleA(versionId?: number): Observable<any> {
    let params = new HttpParams();
    if (versionId) params = params.set('versionId', versionId);
    return this.http.get<any>(`${this.base}/reports/schedule-a`, { params });
  }

  getMscoaStringExport(versionId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (versionId) params = params.set('versionId', versionId);
    return this.http.get<any[]>(`${this.base}/reports/mscoa-strings`, { params });
  }

  getVirementRegister(versionId?: number, status?: string): Observable<any[]> {
    let params = new HttpParams();
    if (versionId) params = params.set('versionId', versionId);
    if (status) params = params.set('status', status);
    return this.http.get<any[]>(`${this.base}/reports/virement-register`, { params });
  }

  getAdjustmentRegister(financialYearId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<any[]>(`${this.base}/reports/adjustment-register`, { params });
  }

  getAiInsights(financialYearId?: number): Observable<any> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<any>(`${this.base}/dashboard/ai-insights`, { params });
  }

  getVirementPolicies(financialYearId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<any[]>(`${this.base}/virement-policies`, { params });
  }

  getVirementPolicy(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/virement-policies/${id}`);
  }

  getActiveVirementPolicy(financialYearId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/virement-policies/active/${financialYearId}`);
  }

  createVirementPolicy(data: any): Observable<any> {
    return this.http.post(`${this.base}/virement-policies`, data);
  }

  addVirementPolicyRule(policyId: number, data: any): Observable<any> {
    return this.http.post(`${this.base}/virement-policies/${policyId}/rules`, data);
  }

  updateVirementPolicyRule(ruleId: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/virement-policies/rules/${ruleId}`, data);
  }

  deleteVirementPolicyRule(ruleId: number): Observable<any> {
    return this.http.delete(`${this.base}/virement-policies/rules/${ruleId}`);
  }

  lockVirementPolicy(id: number): Observable<any> {
    return this.http.post(`${this.base}/virement-policies/${id}/lock`, {});
  }

  unlockVirementPolicy(id: number): Observable<any> {
    return this.http.post(`${this.base}/virement-policies/${id}/unlock`, {});
  }

  validateVirement(data: any): Observable<any> {
    return this.http.post(`${this.base}/virements/validate`, data);
  }

  getServiceCategories(): Observable<ServiceCategory[]> {
    return this.http.get<ServiceCategory[]>(`${this.base}/billing/service-categories`);
  }

  getTariffs(serviceCategoryId?: number, propertyCategory?: string, financialYearId?: number): Observable<Tariff[]> {
    let params = new HttpParams();
    if (serviceCategoryId) params = params.set('serviceCategoryId', serviceCategoryId);
    if (propertyCategory) params = params.set('propertyCategory', propertyCategory);
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<Tariff[]>(`${this.base}/billing/tariffs`, { params });
  }

  createTariff(data: any): Observable<any> {
    return this.http.post(`${this.base}/billing/tariffs`, data);
  }

  updateTariff(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/billing/tariffs/${id}`, data);
  }

  getTariffScenarios(financialYearId?: number): Observable<TariffScenarioSummary[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<TariffScenarioSummary[]>(`${this.base}/billing/tariff-scenarios`, { params });
  }

  createTariffScenario(data: any): Observable<any> {
    return this.http.post(`${this.base}/billing/tariff-scenarios`, data);
  }

  getTariffScenario(id: number): Observable<TariffScenario> {
    return this.http.get<TariffScenario>(`${this.base}/billing/tariff-scenarios/${id}`);
  }

  calculateScenario(id: number): Observable<any> {
    return this.http.post(`${this.base}/billing/tariff-scenarios/${id}/calculate`, {});
  }

  submitScenario(id: number): Observable<any> {
    return this.http.post(`${this.base}/billing/tariff-scenarios/${id}/submit`, {});
  }

  approveScenario(id: number, comment?: string): Observable<any> {
    return this.http.post(`${this.base}/billing/tariff-scenarios/${id}/approve`, { comment });
  }

  compareScenarios(ids: number[]): Observable<ScenarioComparison> {
    return this.http.get<ScenarioComparison>(`${this.base}/billing/tariff-scenarios/compare?ids=${ids.join(',')}`);
  }

  getConsumerCategories(): Observable<ConsumerCategory[]> {
    return this.http.get<ConsumerCategory[]>(`${this.base}/billing/consumer-categories`);
  }

  createConsumerCategory(data: any): Observable<any> {
    return this.http.post(`${this.base}/billing/consumer-categories`, data);
  }

  updateConsumerCategory(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/billing/consumer-categories/${id}`, data);
  }

  getProjectedBills(consumerCategoryId: number, tariffScenarioId?: number): Observable<ProjectedBill> {
    let params = new HttpParams();
    if (tariffScenarioId) params = params.set('tariffScenarioId', tariffScenarioId);
    return this.http.get<ProjectedBill>(`${this.base}/billing/consumer-categories/${consumerCategoryId}/projected-bills`, { params });
  }

  getRevenueProjections(financialYearId?: number, status?: string): Observable<RevenueProjection[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    if (status) params = params.set('status', status);
    return this.http.get<RevenueProjection[]>(`${this.base}/billing/revenue-projections`, { params });
  }

  calculateRevenueProjections(data: any): Observable<any> {
    return this.http.post(`${this.base}/billing/revenue-projections/calculate`, data);
  }

  getRevenueProjectionSummary(financialYearId?: number): Observable<RevenueProjectionSummary> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<RevenueProjectionSummary>(`${this.base}/billing/revenue-projections/summary`, { params });
  }

  submitRevenueProjection(id: number): Observable<any> {
    return this.http.post(`${this.base}/billing/revenue-projections/${id}/submit`, {});
  }

  approveRevenueProjection(id: number, comment?: string): Observable<any> {
    return this.http.post(`${this.base}/billing/revenue-projections/${id}/approve`, { comment });
  }

  submitAllRevenueProjections(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/billing/revenue-projections/submit-all?financialYearId=${financialYearId}`, {});
  }

  approveAllRevenueProjections(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/billing/revenue-projections/approve-all?financialYearId=${financialYearId}`, {});
  }

  getRebateTypes(): Observable<RebateType[]> {
    return this.http.get<RebateType[]>(`${this.base}/billing/rebate-types`);
  }

  createRebateType(data: any): Observable<any> {
    return this.http.post(`${this.base}/billing/rebate-types`, data);
  }

  getRebateProjections(financialYearId?: number): Observable<RebateProjection[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<RebateProjection[]>(`${this.base}/billing/rebate-projections`, { params });
  }

  calculateRebateProjections(data: any): Observable<any> {
    return this.http.post(`${this.base}/billing/rebate-projections/calculate`, data);
  }

  submitRebateProjection(id: number): Observable<any> {
    return this.http.post(`${this.base}/billing/rebate-projections/${id}/submit`, {});
  }

  approveRebateProjection(id: number, comment?: string): Observable<any> {
    return this.http.post(`${this.base}/billing/rebate-projections/${id}/approve`, { comment });
  }

  generateBillingBudgetStrings(data: any): Observable<any> {
    return this.http.post(`${this.base}/billing/generate-budget-strings`, data);
  }

  getBillingBudgetStrings(versionId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (versionId) params = params.set('versionId', versionId);
    return this.http.get<any[]>(`${this.base}/billing/budget-strings`, { params });
  }

  getDraftRevenueBudget(financialYearId?: number): Observable<DraftRevenueBudget> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<DraftRevenueBudget>(`${this.base}/billing/draft-revenue-budget`, { params });
  }

  getBillingIntegrationStatus(financialYearId?: number): Observable<BillingIntegrationStatus> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<BillingIntegrationStatus>(`${this.base}/billing/integration-status`, { params });
  }

  getExpenditureCategories(): Observable<ExpenditureCategory[]> {
    return this.http.get<ExpenditureCategory[]>(`${this.base}/creditors/expenditure-categories`);
  }

  createExpenditureCategory(data: any): Observable<any> {
    return this.http.post(`${this.base}/creditors/expenditure-categories`, data);
  }

  getCostItems(expenditureCategoryId?: number, itemType?: string, financialYearId?: number): Observable<CostItem[]> {
    let params = new HttpParams();
    if (expenditureCategoryId) params = params.set('expenditureCategoryId', expenditureCategoryId);
    if (itemType) params = params.set('itemType', itemType);
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<CostItem[]>(`${this.base}/creditors/cost-items`, { params });
  }

  createCostItem(data: any): Observable<any> {
    return this.http.post(`${this.base}/creditors/cost-items`, data);
  }

  updateCostItem(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/creditors/cost-items/${id}`, data);
  }

  getExpenditureScenarios(financialYearId?: number): Observable<ExpenditureScenarioSummary[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<ExpenditureScenarioSummary[]>(`${this.base}/creditors/expenditure-scenarios`, { params });
  }

  createExpenditureScenario(data: any): Observable<any> {
    return this.http.post(`${this.base}/creditors/expenditure-scenarios`, data);
  }

  getExpenditureScenario(id: number): Observable<ExpenditureScenario> {
    return this.http.get<ExpenditureScenario>(`${this.base}/creditors/expenditure-scenarios/${id}`);
  }

  calculateExpenditureScenario(id: number): Observable<any> {
    return this.http.post(`${this.base}/creditors/expenditure-scenarios/${id}/calculate`, {});
  }

  submitExpenditureScenario(id: number): Observable<any> {
    return this.http.post(`${this.base}/creditors/expenditure-scenarios/${id}/submit`, {});
  }

  approveExpenditureScenario(id: number, comment?: string): Observable<any> {
    return this.http.post(`${this.base}/creditors/expenditure-scenarios/${id}/approve`, { comment });
  }

  compareExpenditureScenarios(ids: number[]): Observable<ExpenditureScenarioComparison> {
    return this.http.get<ExpenditureScenarioComparison>(`${this.base}/creditors/expenditure-scenarios/compare?ids=${ids.join(',')}`);
  }

  getCreditorCategories(): Observable<CreditorCategoryDetail[]> {
    return this.http.get<CreditorCategoryDetail[]>(`${this.base}/creditors/creditor-categories`);
  }

  createCreditorCategory(data: any): Observable<any> {
    return this.http.post(`${this.base}/creditors/creditor-categories`, data);
  }

  createCreditorCategoryItem(data: any): Observable<any> {
    return this.http.post(`${this.base}/creditors/creditor-category-items`, data);
  }

  getPaymentArrangements(): Observable<CreditorPaymentArrangement[]> {
    return this.http.get<CreditorPaymentArrangement[]>(`${this.base}/creditors/payment-arrangements`);
  }

  getAgeAnalysis(): Observable<AgeAnalysis[]> {
    return this.http.get<AgeAnalysis[]>(`${this.base}/creditors/age-analysis`);
  }

  getExpenditureProjections(financialYearId?: number, status?: string): Observable<ExpenditureProjection[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    if (status) params = params.set('status', status);
    return this.http.get<ExpenditureProjection[]>(`${this.base}/creditors/expenditure-projections`, { params });
  }

  calculateExpenditureProjections(data: any): Observable<any> {
    return this.http.post(`${this.base}/creditors/expenditure-projections/calculate`, data);
  }

  getExpenditureProjectionSummary(financialYearId?: number): Observable<ExpenditureProjectionSummary> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<ExpenditureProjectionSummary>(`${this.base}/creditors/expenditure-projections/summary`, { params });
  }

  submitExpenditureProjection(id: number): Observable<any> {
    return this.http.post(`${this.base}/creditors/expenditure-projections/${id}/submit`, {});
  }

  approveExpenditureProjection(id: number, comment?: string): Observable<any> {
    return this.http.post(`${this.base}/creditors/expenditure-projections/${id}/approve`, { comment });
  }

  submitAllExpenditureProjections(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/creditors/expenditure-projections/submit-all?financialYearId=${financialYearId}`, {});
  }

  approveAllExpenditureProjections(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/creditors/expenditure-projections/approve-all?financialYearId=${financialYearId}`, {});
  }

  getCreditorLiabilities(financialYearId?: number): Observable<CreditorLiabilitySummary> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<CreditorLiabilitySummary>(`${this.base}/creditors/liabilities`, { params });
  }

  generateCreditorLiabilities(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/creditors/liabilities/generate?financialYearId=${financialYearId}`, {});
  }

  getForecastAssumptions(financialYearId?: number): Observable<ForecastAssumption[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<ForecastAssumption[]>(`${this.base}/creditors/forecast-assumptions`, { params });
  }

  createForecastAssumption(data: any): Observable<any> {
    return this.http.post(`${this.base}/creditors/forecast-assumptions`, data);
  }

  updateForecastAssumption(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/creditors/forecast-assumptions/${id}`, data);
  }

  getSensitivityAnalysis(financialYearId?: number): Observable<SensitivityAnalysis[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<SensitivityAnalysis[]>(`${this.base}/creditors/sensitivity-analysis`, { params });
  }

  generateCreditorsBudgetStrings(data: any): Observable<any> {
    return this.http.post(`${this.base}/creditors/generate-budget-strings`, data);
  }

  getCreditorsBudgetStrings(versionId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (versionId) params = params.set('versionId', versionId);
    return this.http.get<any[]>(`${this.base}/creditors/budget-strings`, { params });
  }

  getDraftExpenditureBudget(financialYearId?: number): Observable<DraftExpenditureBudget> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<DraftExpenditureBudget>(`${this.base}/creditors/draft-expenditure-budget`, { params });
  }

  getCreditorsIntegrationStatus(financialYearId?: number): Observable<CreditorsIntegrationStatus> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<CreditorsIntegrationStatus>(`${this.base}/creditors/integration-status`, { params });
  }

  getPostEstablishments(financialYearId?: number, department?: string, status?: string): Observable<PostEstablishment[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    if (department) params = params.set('department', department);
    if (status) params = params.set('status', status);
    return this.http.get<PostEstablishment[]>(`${this.base}/hr-payroll/post-establishments`, { params });
  }

  createPostEstablishment(data: any): Observable<PostEstablishment> {
    return this.http.post<PostEstablishment>(`${this.base}/hr-payroll/post-establishments`, data);
  }

  updatePostEstablishment(id: number, data: any): Observable<PostEstablishment> {
    return this.http.put<PostEstablishment>(`${this.base}/hr-payroll/post-establishments/${id}`, data);
  }

  flagActivePosts(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/post-establishments/flag-active-posts?financialYearId=${financialYearId}`, {});
  }

  getOrganogramSummary(financialYearId?: number): Observable<PostEstablishmentSummary> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<PostEstablishmentSummary>(`${this.base}/hr-payroll/post-establishments/organogram-summary`, { params });
  }

  getVacantPosts(financialYearId?: number): Observable<PostEstablishment[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<PostEstablishment[]>(`${this.base}/hr-payroll/post-establishments/vacant-posts`, { params });
  }

  getUnprioritisedPosts(financialYearId?: number): Observable<PostEstablishment[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<PostEstablishment[]>(`${this.base}/hr-payroll/post-establishments/unprioritised-posts`, { params });
  }

  getSalaryStructures(): Observable<SalaryStructure[]> {
    return this.http.get<SalaryStructure[]>(`${this.base}/hr-payroll/salary-structures`);
  }

  createSalaryStructure(data: any): Observable<SalaryStructure> {
    return this.http.post<SalaryStructure>(`${this.base}/hr-payroll/salary-structures`, data);
  }

  getSalaryIncreases(financialYearId?: number): Observable<SalaryIncrease[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<SalaryIncrease[]>(`${this.base}/hr-payroll/salary-increases`, { params });
  }

  createSalaryIncrease(data: any): Observable<SalaryIncrease> {
    return this.http.post<SalaryIncrease>(`${this.base}/hr-payroll/salary-increases`, data);
  }

  calculateNotchProgression(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/calculate-notch-progression?financialYearId=${financialYearId}`, {});
  }

  calculatePercentageIncrease(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/calculate-percentage-increase?financialYearId=${financialYearId}`, {});
  }

  getTemporaryContracts(financialYearId?: number): Observable<TemporaryContract[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<TemporaryContract[]>(`${this.base}/hr-payroll/temporary-contracts`, { params });
  }

  createTemporaryContract(data: any): Observable<TemporaryContract> {
    return this.http.post<TemporaryContract>(`${this.base}/hr-payroll/temporary-contracts`, data);
  }

  calculateContractBudgets(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/temporary-contracts/calculate-contract-budgets?financialYearId=${financialYearId}`, {});
  }

  getCouncillorPositions(financialYearId?: number): Observable<CouncillorPosition[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<CouncillorPosition[]>(`${this.base}/hr-payroll/councillor-positions`, { params });
  }

  createCouncillorPosition(data: any): Observable<CouncillorPosition> {
    return this.http.post<CouncillorPosition>(`${this.base}/hr-payroll/councillor-positions`, data);
  }

  calculateCouncillorBudget(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/councillor-positions/calculate-councillor-budget?financialYearId=${financialYearId}`, {});
  }

  applyCouncillorIncrease(financialYearId: number, increasePercent: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/councillor-positions/councillor-increase`, { financialYearId, increasePercent });
  }

  getWardCommitteeBudgets(financialYearId?: number): Observable<WardCommitteeBudget[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<WardCommitteeBudget[]>(`${this.base}/hr-payroll/ward-committee-budgets`, { params });
  }

  createWardCommitteeBudget(data: any): Observable<WardCommitteeBudget> {
    return this.http.post<WardCommitteeBudget>(`${this.base}/hr-payroll/ward-committee-budgets`, data);
  }

  calculateWardBudget(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/ward-committee-budgets/calculate-ward-budget?financialYearId=${financialYearId}`, {});
  }

  getVariableBenefitHours(financialYearId?: number, department?: string): Observable<VariableBenefitHours[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    if (department) params = params.set('department', department);
    return this.http.get<VariableBenefitHours[]>(`${this.base}/hr-payroll/variable-benefit-hours`, { params });
  }

  createVariableBenefitHours(data: any): Observable<VariableBenefitHours> {
    return this.http.post<VariableBenefitHours>(`${this.base}/hr-payroll/variable-benefit-hours`, data);
  }

  calculateVariableBenefits(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/variable-benefit-hours/calculate-variable-benefits?financialYearId=${financialYearId}`, {});
  }

  getHoursHistory(department?: string): Observable<VariableBenefitHours[]> {
    let params = new HttpParams();
    if (department) params = params.set('department', department);
    return this.http.get<VariableBenefitHours[]>(`${this.base}/hr-payroll/variable-benefit-hours/hours-history`, { params });
  }

  getTravelRequirements(financialYearId?: number, department?: string): Observable<TravelRequirement[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    if (department) params = params.set('department', department);
    return this.http.get<TravelRequirement[]>(`${this.base}/hr-payroll/travel-requirements`, { params });
  }

  createTravelRequirement(data: any): Observable<TravelRequirement> {
    return this.http.post<TravelRequirement>(`${this.base}/hr-payroll/travel-requirements`, data);
  }

  getTravelStandardRates(): Observable<TravelStandardRate[]> {
    return this.http.get<TravelStandardRate[]>(`${this.base}/hr-payroll/travel-standard-rates`);
  }

  createTravelStandardRate(data: any): Observable<TravelStandardRate> {
    return this.http.post<TravelStandardRate>(`${this.base}/hr-payroll/travel-standard-rates`, data);
  }

  calculateTravelBudget(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/travel-requirements/calculate-travel-budget?financialYearId=${financialYearId}`, {});
  }

  getTravelTrends(department?: string): Observable<any[]> {
    let params = new HttpParams();
    if (department) params = params.set('department', department);
    return this.http.get<any[]>(`${this.base}/hr-payroll/travel-requirements/travel-trends`, { params });
  }

  getPerformanceBonuses(financialYearId?: number): Observable<PerformanceBonus[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<PerformanceBonus[]>(`${this.base}/hr-payroll/performance-bonuses`, { params });
  }

  createPerformanceBonus(data: any): Observable<PerformanceBonus> {
    return this.http.post<PerformanceBonus>(`${this.base}/hr-payroll/performance-bonuses`, data);
  }

  calculateBonusBudget(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/performance-bonuses/calculate-bonus-budget?financialYearId=${financialYearId}`, {});
  }

  getStatutoryDeductions(): Observable<StatutoryDeduction[]> {
    return this.http.get<StatutoryDeduction[]>(`${this.base}/hr-payroll/statutory-deductions`);
  }

  createStatutoryDeduction(data: any): Observable<StatutoryDeduction> {
    return this.http.post<StatutoryDeduction>(`${this.base}/hr-payroll/statutory-deductions`, data);
  }

  calculatePaye(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/statutory-deductions/calculate-paye?financialYearId=${financialYearId}`, {});
  }

  calculateUif(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/statutory-deductions/calculate-uif?financialYearId=${financialYearId}`, {});
  }

  calculateSdl(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/statutory-deductions/calculate-sdl?financialYearId=${financialYearId}`, {});
  }

  calculateAllDeductions(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/statutory-deductions/calculate-all-deductions?financialYearId=${financialYearId}`, {});
  }

  getPayrollLiabilities(financialYearId?: number): Observable<PayrollLiability[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<PayrollLiability[]>(`${this.base}/hr-payroll/payroll-liabilities`, { params });
  }

  calculatePayrollLiabilities(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/payroll-liabilities/calculate-liabilities?financialYearId=${financialYearId}`, {});
  }

  getDboEntries(financialYearId?: number): Observable<DefinedBenefitObligation[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<DefinedBenefitObligation[]>(`${this.base}/hr-payroll/dbo-entries`, { params });
  }

  createDboEntry(data: any): Observable<DefinedBenefitObligation> {
    return this.http.post<DefinedBenefitObligation>(`${this.base}/hr-payroll/dbo-entries`, data);
  }

  calculateDbo(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/dbo-entries/calculate-dbo?financialYearId=${financialYearId}`, {});
  }

  allocateCurrentNonCurrent(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/dbo-entries/allocate-current-noncurrent?financialYearId=${financialYearId}`, {});
  }

  getDboSummary(financialYearId?: number): Observable<DboSummary> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<DboSummary>(`${this.base}/hr-payroll/dbo-entries/dbo-summary`, { params });
  }

  getLongServiceAwards(financialYearId?: number): Observable<LongServiceAward[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<LongServiceAward[]>(`${this.base}/hr-payroll/long-service-awards`, { params });
  }

  createLongServiceAward(data: any): Observable<LongServiceAward> {
    return this.http.post<LongServiceAward>(`${this.base}/hr-payroll/long-service-awards`, data);
  }

  calculateLsaPayments(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/long-service-awards/calculate-lsa-payments?financialYearId=${financialYearId}`, {});
  }

  getPayrollScenarios(financialYearId?: number): Observable<PayrollScenario[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<PayrollScenario[]>(`${this.base}/hr-payroll/scenarios`, { params });
  }

  createPayrollScenario(data: any): Observable<PayrollScenario> {
    return this.http.post<PayrollScenario>(`${this.base}/hr-payroll/scenarios`, data);
  }

  calculatePayrollScenario(id: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/scenarios/${id}/calculate`, {});
  }

  comparePayrollScenarios(ids: number[]): Observable<any> {
    return this.http.get(`${this.base}/hr-payroll/scenarios/compare?ids=${ids.join(',')}`);
  }

  getPayrollBudgetLines(financialYearId?: number, department?: string): Observable<PayrollBudgetLine[]> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    if (department) params = params.set('department', department);
    return this.http.get<PayrollBudgetLine[]>(`${this.base}/hr-payroll/payroll-budget-lines`, { params });
  }

  calculatePayrollBudget(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/payroll-budget-lines/calculate-payroll-budget?financialYearId=${financialYearId}`, {});
  }

  generateHrBudgetStrings(data: any): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/payroll-budget-lines/generate-budget-strings`, data);
  }

  validateHrMscoa(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/payroll-budget-lines/validate-mscoa?financialYearId=${financialYearId}`, {});
  }

  submitAllHrBudget(financialYearId: number): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/payroll-budget-lines/submit-all?financialYearId=${financialYearId}`, {});
  }

  approveHrBudget(id: number, data: any): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/payroll-budget-lines/approve/${id}`, data);
  }

  getPayrollBudgetSummary(financialYearId?: number): Observable<PayrollBudgetSummary> {
    let params = new HttpParams();
    if (financialYearId) params = params.set('financialYearId', financialYearId);
    return this.http.get<PayrollBudgetSummary>(`${this.base}/hr-payroll/payroll-budget-lines/summary`, { params });
  }

  amendHrBudget(data: any): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/amend-budget`, data);
  }

  amendDboEstimates(data: any): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/amend-dbo-estimates`, data);
  }

  amendMscoaLinkage(data: any): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/amend-mscoa-linkage`, data);
  }

  amendVariableHours(data: any): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/amend-variable-hours`, data);
  }

  amendPaymentPercentages(data: any): Observable<any> {
    return this.http.post(`${this.base}/hr-payroll/amend-payment-percentages`, data);
  }
}
