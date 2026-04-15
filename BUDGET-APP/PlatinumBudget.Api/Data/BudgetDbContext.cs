using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Data;

public class BudgetDbContext : DbContext
{
    public BudgetDbContext(DbContextOptions<BudgetDbContext> options) : base(options) { }

    public DbSet<ConstIdpLevelDescriptionDetail> ConstIdpLevelDescriptionDetails => Set<ConstIdpLevelDescriptionDetail>();
    public DbSet<ConstIdpLevelDescriptionHeader> ConstIdpLevelDescriptionHeaders => Set<ConstIdpLevelDescriptionHeader>();
    public DbSet<ConstIdpNationalKpaDetail> ConstIdpNationalKpaDetails => Set<ConstIdpNationalKpaDetail>();
    public DbSet<ConstIdpNationalKpaHeader> ConstIdpNationalKpaHeaders => Set<ConstIdpNationalKpaHeader>();
    public DbSet<IdpItem> IdpItems => Set<IdpItem>();
    public DbSet<ConstScoaFunctionStructureConsolidated> ConstScoaFunctionStructureConsolidated => Set<ConstScoaFunctionStructureConsolidated>();
    public DbSet<ConstScoaFundsStructureConsolidated> ConstScoaFundsStructureConsolidated => Set<ConstScoaFundsStructureConsolidated>();
    public DbSet<ConstScoaProjectStructureConsolidated> ConstScoaProjectStructureConsolidated => Set<ConstScoaProjectStructureConsolidated>();
    public DbSet<ConstScoaRegionalStructureConsolidated> ConstScoaRegionalStructureConsolidated => Set<ConstScoaRegionalStructureConsolidated>();
    public DbSet<ConstScoaStructureConsolidated> ConstScoaStructureConsolidated => Set<ConstScoaStructureConsolidated>();
    public DbSet<ConstScoaCostingStructureConsolidated> ConstScoaCostingStructureConsolidated => Set<ConstScoaCostingStructureConsolidated>();
    public DbSet<ConstProjectType> ConstProjectTypes => Set<ConstProjectType>();
    public DbSet<ConstStatus> ConstStatuses => Set<ConstStatus>();

    public DbSet<FinancialYear> FinancialYears => Set<FinancialYear>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<BudgetVersion> BudgetVersions => Set<BudgetVersion>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<BudgetString> BudgetStrings => Set<BudgetString>();
    public DbSet<BudgetApproval> BudgetApprovals => Set<BudgetApproval>();
    public DbSet<Models.ValidationResult> ValidationResults => Set<Models.ValidationResult>();
    public DbSet<VirementRequest> VirementRequests => Set<VirementRequest>();
    public DbSet<AuditTrail> AuditTrails => Set<AuditTrail>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<IntegrationDispatch> IntegrationDispatches => Set<IntegrationDispatch>();
    public DbSet<VirementPolicy> VirementPolicies => Set<VirementPolicy>();
    public DbSet<VirementPolicyRule> VirementPolicyRules => Set<VirementPolicyRule>();
    public DbSet<ProjectBudgetLine> ProjectBudgetLines => Set<ProjectBudgetLine>();

    public DbSet<ServiceCategory> ServiceCategories => Set<ServiceCategory>();
    public DbSet<Tariff> Tariffs => Set<Tariff>();
    public DbSet<TariffScenario> TariffScenarios => Set<TariffScenario>();
    public DbSet<TariffScenarioLine> TariffScenarioLines => Set<TariffScenarioLine>();
    public DbSet<ConsumerCategory> ConsumerCategories => Set<ConsumerCategory>();
    public DbSet<ConsumerCategoryService> ConsumerCategoryServices => Set<ConsumerCategoryService>();
    public DbSet<RevenueProjection> RevenueProjections => Set<RevenueProjection>();
    public DbSet<RebateType> RebateTypes => Set<RebateType>();
    public DbSet<RebateProjection> RebateProjections => Set<RebateProjection>();
    public DbSet<BillingBudgetApproval> BillingBudgetApprovals => Set<BillingBudgetApproval>();

    public DbSet<ExpenditureCategory> ExpenditureCategories => Set<ExpenditureCategory>();
    public DbSet<CostItem> CostItems => Set<CostItem>();
    public DbSet<ExpenditureScenario> ExpenditureScenarios => Set<ExpenditureScenario>();
    public DbSet<ExpenditureScenarioLine> ExpenditureScenarioLines => Set<ExpenditureScenarioLine>();
    public DbSet<CreditorCategory> CreditorCategories => Set<CreditorCategory>();
    public DbSet<CreditorCategoryItem> CreditorCategoryItems => Set<CreditorCategoryItem>();
    public DbSet<ExpenditureProjection> ExpenditureProjections => Set<ExpenditureProjection>();
    public DbSet<CreditorLiability> CreditorLiabilities => Set<CreditorLiability>();
    public DbSet<CreditorPaymentArrangement> CreditorPaymentArrangements => Set<CreditorPaymentArrangement>();
    public DbSet<ForecastAssumption> ForecastAssumptions => Set<ForecastAssumption>();
    public DbSet<CreditorsBudgetApproval> CreditorsBudgetApprovals => Set<CreditorsBudgetApproval>();

    public DbSet<PostEstablishment> PostEstablishments => Set<PostEstablishment>();
    public DbSet<SalaryStructure> SalaryStructures => Set<SalaryStructure>();
    public DbSet<SalaryIncrease> SalaryIncreases => Set<SalaryIncrease>();
    public DbSet<TemporaryContract> TemporaryContracts => Set<TemporaryContract>();
    public DbSet<CouncillorPosition> CouncillorPositions => Set<CouncillorPosition>();
    public DbSet<WardCommitteeBudget> WardCommitteeBudgets => Set<WardCommitteeBudget>();
    public DbSet<VariableBenefitHours> VariableBenefitHours => Set<VariableBenefitHours>();
    public DbSet<TravelRequirement> TravelRequirements => Set<TravelRequirement>();
    public DbSet<TravelStandardRate> TravelStandardRates => Set<TravelStandardRate>();
    public DbSet<StatutoryDeduction> StatutoryDeductions => Set<StatutoryDeduction>();
    public DbSet<PayrollLiability> PayrollLiabilities => Set<PayrollLiability>();
    public DbSet<DefinedBenefitObligation> DefinedBenefitObligations => Set<DefinedBenefitObligation>();
    public DbSet<LongServiceAward> LongServiceAwards => Set<LongServiceAward>();
    public DbSet<PerformanceBonus> PerformanceBonuses => Set<PerformanceBonus>();
    public DbSet<PayrollScenario> PayrollScenarios => Set<PayrollScenario>();
    public DbSet<PayrollBudgetLine> PayrollBudgetLines => Set<PayrollBudgetLine>();
    public DbSet<HrPayrollBudgetApproval> HrPayrollBudgetApprovals => Set<HrPayrollBudgetApproval>();

    public DbSet<ScoaItem> ScoaItems => Set<ScoaItem>();
    public DbSet<ScoaFund> ScoaFunds => Set<ScoaFund>();
    public DbSet<ScoaFunction> ScoaFunctions => Set<ScoaFunction>();
    public DbSet<ScoaProject> ScoaProjects => Set<ScoaProject>();
    public DbSet<ScoaRegion> ScoaRegions => Set<ScoaRegion>();
    public DbSet<ScoaCosting> ScoaCostings => Set<ScoaCosting>();
    public DbSet<ScoaMsc> ScoaMscs => Set<ScoaMsc>();
    public DbSet<ScoaValidCombination> ScoaValidCombinations => Set<ScoaValidCombination>();


      // EMS Const Tables (from EMS_GeorgeUAT schema)
      public DbSet<Const_BudgetAdjustmentType_Sys> Const_BudgetAdjustmentType_Sys => Set<Const_BudgetAdjustmentType_Sys>();
    public DbSet<Const_BudgetConsumptionProcess_Sys> Const_BudgetConsumptionProcess_Sys => Set<Const_BudgetConsumptionProcess_Sys>();
    public DbSet<Const_BudgetLayout_Sys> Const_BudgetLayout_Sys => Set<Const_BudgetLayout_Sys>();
    public DbSet<Const_BudgetSplitOptions> Const_BudgetSplitOptions => Set<Const_BudgetSplitOptions>();
    public DbSet<Const_BudgetTransactionType_sys> Const_BudgetTransactionType_sys => Set<Const_BudgetTransactionType_sys>();
    public DbSet<Const_BudgetValidationRule_Sys> Const_BudgetValidationRule_Sys => Set<Const_BudgetValidationRule_Sys>();
    public DbSet<Const_Department> Const_Department => Set<Const_Department>();
    public DbSet<Const_Division> Const_Division => Set<Const_Division>();
    public DbSet<Const_FunderType> Const_FunderType => Set<Const_FunderType>();
    public DbSet<Const_FundingSource> Const_FundingSource => Set<Const_FundingSource>();
    public DbSet<Const_FundManagement> Const_FundManagement => Set<Const_FundManagement>();
    public DbSet<Const_FundSourceChange> Const_FundSourceChange => Set<Const_FundSourceChange>();
    public DbSet<Const_GrantType> Const_GrantType => Set<Const_GrantType>();
    public DbSet<Const_KPIGroup> Const_KPIGroup => Set<Const_KPIGroup>();
    public DbSet<Const_KPIGroupDetail> Const_KPIGroupDetail => Set<Const_KPIGroupDetail>();
    public DbSet<Const_NationalKPA_Sys> Const_NationalKPA_Sys => Set<Const_NationalKPA_Sys>();
    public DbSet<Const_PlanAdjustmentReason_sys> Const_PlanAdjustmentReason_sys => Set<Const_PlanAdjustmentReason_sys>();
    public DbSet<Const_PlanAdjustmentType_sys> Const_PlanAdjustmentType_sys => Set<Const_PlanAdjustmentType_sys>();
    public DbSet<Const_PlanCapitalOperationalTypes_sys> Const_PlanCapitalOperationalTypes_sys => Set<Const_PlanCapitalOperationalTypes_sys>();
    public DbSet<Const_PlanNetAssetItems> Const_PlanNetAssetItems => Set<Const_PlanNetAssetItems>();
    public DbSet<Const_PlanNTValidations> Const_PlanNTValidations => Set<Const_PlanNTValidations>();
    public DbSet<Const_PlanSCOAFundCapital> Const_PlanSCOAFundCapital => Set<Const_PlanSCOAFundCapital>();
    public DbSet<Const_PlanSCOAFundOperational> Const_PlanSCOAFundOperational => Set<Const_PlanSCOAFundOperational>();
    public DbSet<Const_PlanSCOAItemAssetFBS> Const_PlanSCOAItemAssetFBS => Set<Const_PlanSCOAItemAssetFBS>();
    public DbSet<Const_PlanSCOAItemGainOR> Const_PlanSCOAItemGainOR => Set<Const_PlanSCOAItemGainOR>();
    public DbSet<Const_PlanSCOAItemLossOE> Const_PlanSCOAItemLossOE => Set<Const_PlanSCOAItemLossOE>();
    public DbSet<Const_PlanSCOAItemRevenueFBS> Const_PlanSCOAItemRevenueFBS => Set<Const_PlanSCOAItemRevenueFBS>();
    public DbSet<Const_PlanSCOAProjectFBS> Const_PlanSCOAProjectFBS => Set<Const_PlanSCOAProjectFBS>();
    public DbSet<Const_PlanVirementRules_sys> Const_PlanVirementRules_sys => Set<Const_PlanVirementRules_sys>();
    public DbSet<Const_PMSAnnualField_Detail> Const_PMSAnnualField_Detail => Set<Const_PMSAnnualField_Detail>();
    public DbSet<Const_PMSAnnualField_Header> Const_PMSAnnualField_Header => Set<Const_PMSAnnualField_Header>();
    public DbSet<Const_PMSCoreCompetencyRequirement> Const_PMSCoreCompetencyRequirement => Set<Const_PMSCoreCompetencyRequirement>();
    public DbSet<Const_PMSCoreCompetencyRequirementType_sys> Const_PMSCoreCompetencyRequirementType_sys => Set<Const_PMSCoreCompetencyRequirementType_sys>();
    public DbSet<Const_PMSDataType_Sys> Const_PMSDataType_Sys => Set<Const_PMSDataType_Sys>();
    public DbSet<Const_PMSDepartmentNKPAWeighting_Detail> Const_PMSDepartmentNKPAWeighting_Detail => Set<Const_PMSDepartmentNKPAWeighting_Detail>();
    public DbSet<Const_PMSDepartmentNKPAWeighting_Header> Const_PMSDepartmentNKPAWeighting_Header => Set<Const_PMSDepartmentNKPAWeighting_Header>();
    public DbSet<Const_PMSIndicatorCustomField_Detail> Const_PMSIndicatorCustomField_Detail => Set<Const_PMSIndicatorCustomField_Detail>();
    public DbSet<Const_PMSIndicatorCustomField_Header> Const_PMSIndicatorCustomField_Header => Set<Const_PMSIndicatorCustomField_Header>();
    public DbSet<Const_PMSIndicatorProgress> Const_PMSIndicatorProgress => Set<Const_PMSIndicatorProgress>();
    public DbSet<Const_PMSIndicatorQuarterlySubmissionDeadline> Const_PMSIndicatorQuarterlySubmissionDeadline => Set<Const_PMSIndicatorQuarterlySubmissionDeadline>();
    public DbSet<Const_PMSIndicatorUnitMeasure> Const_PMSIndicatorUnitMeasure => Set<Const_PMSIndicatorUnitMeasure>();
    public DbSet<Const_PMSMidYearField_Detail> Const_PMSMidYearField_Detail => Set<Const_PMSMidYearField_Detail>();
    public DbSet<Const_PMSMidYearField_Header> Const_PMSMidYearField_Header => Set<Const_PMSMidYearField_Header>();
    public DbSet<Const_PMSOrganisationNKPAWeighting_Detail> Const_PMSOrganisationNKPAWeighting_Detail => Set<Const_PMSOrganisationNKPAWeighting_Detail>();
    public DbSet<Const_PMSOrganisationNKPAWeighting_Header> Const_PMSOrganisationNKPAWeighting_Header => Set<Const_PMSOrganisationNKPAWeighting_Header>();
    public DbSet<Const_PMSPostCoreCompetencyRequirement_Detail> Const_PMSPostCoreCompetencyRequirement_Detail => Set<Const_PMSPostCoreCompetencyRequirement_Detail>();
    public DbSet<Const_PMSPostCoreCompetencyRequirement_Header> Const_PMSPostCoreCompetencyRequirement_Header => Set<Const_PMSPostCoreCompetencyRequirement_Header>();
    public DbSet<Const_PMSScorecardType> Const_PMSScorecardType => Set<Const_PMSScorecardType>();
    public DbSet<Const_SCOA_Costing_Structure> Const_SCOA_Costing_Structure => Set<Const_SCOA_Costing_Structure>();
    public DbSet<Const_SCOA_Function_Structure> Const_SCOA_Function_Structure => Set<Const_SCOA_Function_Structure>();
    public DbSet<Const_SCOA_Funds_Structure> Const_SCOA_Funds_Structure => Set<Const_SCOA_Funds_Structure>();
    public DbSet<Const_SCOA_Project_Structure> Const_SCOA_Project_Structure => Set<Const_SCOA_Project_Structure>();
    public DbSet<Const_SCOA_Regional_Structure> Const_SCOA_Regional_Structure => Set<Const_SCOA_Regional_Structure>();
    public DbSet<Const_SCOA_Structure> Const_SCOA_Structure => Set<Const_SCOA_Structure>();

      // EMS Plan Tables (from EMS_GeorgeUAT schema)
      public DbSet<Plan_Activity> Plan_Activity => Set<Plan_Activity>();
    public DbSet<Plan_ActivityProgress> Plan_ActivityProgress => Set<Plan_ActivityProgress>();
    public DbSet<Plan_AdjBudgetTemp> Plan_AdjBudgetTemp => Set<Plan_AdjBudgetTemp>();
    public DbSet<Plan_Adjustment> Plan_Adjustment => Set<Plan_Adjustment>();
    public DbSet<Plan_AdjustmentApprovalRejections> Plan_AdjustmentApprovalRejections => Set<Plan_AdjustmentApprovalRejections>();
    public DbSet<Plan_AdjustmentBudgetApproval> Plan_AdjustmentBudgetApproval => Set<Plan_AdjustmentBudgetApproval>();
    public DbSet<Plan_AdjustmentBudgetPolicyApproval> Plan_AdjustmentBudgetPolicyApproval => Set<Plan_AdjustmentBudgetPolicyApproval>();
    public DbSet<Plan_AdjustmentBudgetVersion> Plan_AdjustmentBudgetVersion => Set<Plan_AdjustmentBudgetVersion>();
    public DbSet<Plan_AdjustmentBudgetVersionDetail> Plan_AdjustmentBudgetVersionDetail => Set<Plan_AdjustmentBudgetVersionDetail>();
    public DbSet<Plan_AdjustmentBudgetVersionMonths> Plan_AdjustmentBudgetVersionMonths => Set<Plan_AdjustmentBudgetVersionMonths>();
    public DbSet<Plan_AdjustmentFundingBudgetVersion> Plan_AdjustmentFundingBudgetVersion => Set<Plan_AdjustmentFundingBudgetVersion>();
    public DbSet<Plan_AdjustmentFundingBudgetVersionDetails> Plan_AdjustmentFundingBudgetVersionDetails => Set<Plan_AdjustmentFundingBudgetVersionDetails>();
    public DbSet<Plan_AdjustmentFundingSourceBudget_Detail> Plan_AdjustmentFundingSourceBudget_Detail => Set<Plan_AdjustmentFundingSourceBudget_Detail>();
    public DbSet<Plan_AdjustmentFundingSourceBudget_Header> Plan_AdjustmentFundingSourceBudget_Header => Set<Plan_AdjustmentFundingSourceBudget_Header>();
    public DbSet<Plan_AdjustmentFundingSourceChanges> Plan_AdjustmentFundingSourceChanges => Set<Plan_AdjustmentFundingSourceChanges>();
    public DbSet<Plan_AdjustmentFundingSourceDocs> Plan_AdjustmentFundingSourceDocs => Set<Plan_AdjustmentFundingSourceDocs>();
    public DbSet<Plan_AdjustmentPolicyApproval> Plan_AdjustmentPolicyApproval => Set<Plan_AdjustmentPolicyApproval>();
    public DbSet<Plan_AdjustmentProject> Plan_AdjustmentProject => Set<Plan_AdjustmentProject>();
    public DbSet<Plan_AdjustmentProjectCosting> Plan_AdjustmentProjectCosting => Set<Plan_AdjustmentProjectCosting>();
    public DbSet<Plan_AdjustmentProjectDivisions> Plan_AdjustmentProjectDivisions => Set<Plan_AdjustmentProjectDivisions>();
    public DbSet<Plan_AdjustmentProjectFunctions> Plan_AdjustmentProjectFunctions => Set<Plan_AdjustmentProjectFunctions>();
    public DbSet<Plan_AdjustmentProjectFund> Plan_AdjustmentProjectFund => Set<Plan_AdjustmentProjectFund>();
    public DbSet<Plan_AdjustmentProjectFundYear> Plan_AdjustmentProjectFundYear => Set<Plan_AdjustmentProjectFundYear>();
    public DbSet<Plan_AdjustmentProjectIDP> Plan_AdjustmentProjectIDP => Set<Plan_AdjustmentProjectIDP>();
    public DbSet<Plan_AdjustmentProjectItem> Plan_AdjustmentProjectItem => Set<Plan_AdjustmentProjectItem>();
    public DbSet<Plan_AdjustmentProjectItemDocs> Plan_AdjustmentProjectItemDocs => Set<Plan_AdjustmentProjectItemDocs>();
    public DbSet<Plan_AdjustmentProjectItemMonth> Plan_AdjustmentProjectItemMonth => Set<Plan_AdjustmentProjectItemMonth>();
    public DbSet<Plan_AdjustmentProjectRecommendation> Plan_AdjustmentProjectRecommendation => Set<Plan_AdjustmentProjectRecommendation>();
    public DbSet<Plan_AdjustmentProjectRecommendUsers> Plan_AdjustmentProjectRecommendUsers => Set<Plan_AdjustmentProjectRecommendUsers>();
    public DbSet<Plan_AdjustmentProjectRegions> Plan_AdjustmentProjectRegions => Set<Plan_AdjustmentProjectRegions>();
    public DbSet<Plan_AdjustmentTrackChanges> Plan_AdjustmentTrackChanges => Set<Plan_AdjustmentTrackChanges>();
    public DbSet<Plan_BudgetAdjustmentExportImportVersion_Header> Plan_BudgetAdjustmentExportImportVersion_Header => Set<Plan_BudgetAdjustmentExportImportVersion_Header>();
    public DbSet<Plan_BudgetAdjustmentExportVersion_Detail> Plan_BudgetAdjustmentExportVersion_Detail => Set<Plan_BudgetAdjustmentExportVersion_Detail>();
    public DbSet<Plan_BudgetAdjustmentImportVersion_Detail> Plan_BudgetAdjustmentImportVersion_Detail => Set<Plan_BudgetAdjustmentImportVersion_Detail>();
    public DbSet<Plan_BudgetAdjustmentImportVersion_DetailException> Plan_BudgetAdjustmentImportVersion_DetailException => Set<Plan_BudgetAdjustmentImportVersion_DetailException>();
    public DbSet<Plan_BudgetAdjustmentImportVersion_File> Plan_BudgetAdjustmentImportVersion_File => Set<Plan_BudgetAdjustmentImportVersion_File>();
    public DbSet<Plan_BudgetAdjustmentImportVersion_OverallException> Plan_BudgetAdjustmentImportVersion_OverallException => Set<Plan_BudgetAdjustmentImportVersion_OverallException>();
    public DbSet<Plan_BudgetConsumption> Plan_BudgetConsumption => Set<Plan_BudgetConsumption>();
    public DbSet<Plan_BudgetConsumption_Import> Plan_BudgetConsumption_Import => Set<Plan_BudgetConsumption_Import>();
    public DbSet<Plan_BudgetMigration> Plan_BudgetMigration => Set<Plan_BudgetMigration>();
    public DbSet<Plan_BudgetOriginalExportImportVersion_Header> Plan_BudgetOriginalExportImportVersion_Header => Set<Plan_BudgetOriginalExportImportVersion_Header>();
    public DbSet<Plan_BudgetOriginalExportVersion_Detail> Plan_BudgetOriginalExportVersion_Detail => Set<Plan_BudgetOriginalExportVersion_Detail>();
    public DbSet<Plan_BudgetOriginalImportVersion_Detail> Plan_BudgetOriginalImportVersion_Detail => Set<Plan_BudgetOriginalImportVersion_Detail>();
    public DbSet<Plan_BudgetOriginalImportVersion_DetailException> Plan_BudgetOriginalImportVersion_DetailException => Set<Plan_BudgetOriginalImportVersion_DetailException>();
    public DbSet<Plan_BudgetOriginalImportVersion_File> Plan_BudgetOriginalImportVersion_File => Set<Plan_BudgetOriginalImportVersion_File>();
    public DbSet<Plan_BudgetOriginalImportVersion_OverallException> Plan_BudgetOriginalImportVersion_OverallException => Set<Plan_BudgetOriginalImportVersion_OverallException>();
    public DbSet<Plan_BudgetRegister> Plan_BudgetRegister => Set<Plan_BudgetRegister>();
    public DbSet<Plan_BudgetRegisterBackup> Plan_BudgetRegisterBackup => Set<Plan_BudgetRegisterBackup>();
    public DbSet<Plan_BudgetRollover> Plan_BudgetRollover => Set<Plan_BudgetRollover>();
    public DbSet<Plan_BudgetVersion> Plan_BudgetVersion => Set<Plan_BudgetVersion>();
    public DbSet<Plan_BudgetVersionDetail> Plan_BudgetVersionDetail => Set<Plan_BudgetVersionDetail>();
    public DbSet<Plan_BudgetVersionMonths> Plan_BudgetVersionMonths => Set<Plan_BudgetVersionMonths>();
    public DbSet<Plan_BudgetZeroExportImportVersion_Header> Plan_BudgetZeroExportImportVersion_Header => Set<Plan_BudgetZeroExportImportVersion_Header>();
    public DbSet<Plan_BudgetZeroImportVersion_Detail> Plan_BudgetZeroImportVersion_Detail => Set<Plan_BudgetZeroImportVersion_Detail>();
    public DbSet<Plan_BudgetZeroImportVersion_DetailException> Plan_BudgetZeroImportVersion_DetailException => Set<Plan_BudgetZeroImportVersion_DetailException>();
    public DbSet<Plan_BudgetZeroImportVersion_File> Plan_BudgetZeroImportVersion_File => Set<Plan_BudgetZeroImportVersion_File>();
    public DbSet<Plan_FundingBudgetVersion> Plan_FundingBudgetVersion => Set<Plan_FundingBudgetVersion>();
    public DbSet<Plan_FundingBudgetVersionDetails> Plan_FundingBudgetVersionDetails => Set<Plan_FundingBudgetVersionDetails>();
    public DbSet<Plan_FundingSourceBudget_Detail> Plan_FundingSourceBudget_Detail => Set<Plan_FundingSourceBudget_Detail>();
    public DbSet<Plan_FundingSourceBudget_Header> Plan_FundingSourceBudget_Header => Set<Plan_FundingSourceBudget_Header>();
    public DbSet<Plan_FundingSourceChanges> Plan_FundingSourceChanges => Set<Plan_FundingSourceChanges>();
    public DbSet<Plan_FundingSourceDocs> Plan_FundingSourceDocs => Set<Plan_FundingSourceDocs>();
    public DbSet<Plan_GetApprovedVirementFromSP_Temp> Plan_GetApprovedVirementFromSP_Temp => Set<Plan_GetApprovedVirementFromSP_Temp>();
    public DbSet<Plan_IDPMTREFApproval> Plan_IDPMTREFApproval => Set<Plan_IDPMTREFApproval>();
    public DbSet<Plan_MTREFApproval> Plan_MTREFApproval => Set<Plan_MTREFApproval>();
    public DbSet<Plan_MTREFDraft> Plan_MTREFDraft => Set<Plan_MTREFDraft>();
    public DbSet<Plan_Project> Plan_Project => Set<Plan_Project>();
    public DbSet<Plan_Project_Beneficiaries> Plan_Project_Beneficiaries => Set<Plan_Project_Beneficiaries>();
    public DbSet<Plan_Project_CashFlow> Plan_Project_CashFlow => Set<Plan_Project_CashFlow>();
    public DbSet<Plan_ProjectDivisions> Plan_ProjectDivisions => Set<Plan_ProjectDivisions>();
    public DbSet<Plan_ProjectFunctions> Plan_ProjectFunctions => Set<Plan_ProjectFunctions>();
    public DbSet<Plan_ProjectFund> Plan_ProjectFund => Set<Plan_ProjectFund>();
    public DbSet<Plan_ProjectFundYear> Plan_ProjectFundYear => Set<Plan_ProjectFundYear>();
    public DbSet<Plan_ProjectIDP> Plan_ProjectIDP => Set<Plan_ProjectIDP>();
    public DbSet<Plan_ProjectItem> Plan_ProjectItem => Set<Plan_ProjectItem>();
    public DbSet<Plan_ProjectItemDocs> Plan_ProjectItemDocs => Set<Plan_ProjectItemDocs>();
    public DbSet<Plan_ProjectItemMonth> Plan_ProjectItemMonth => Set<Plan_ProjectItemMonth>();
    public DbSet<Plan_ProjectJustification> Plan_ProjectJustification => Set<Plan_ProjectJustification>();
    public DbSet<Plan_ProjectRegions> Plan_ProjectRegions => Set<Plan_ProjectRegions>();
    public DbSet<Plan_SupplementaryAdjustment> Plan_SupplementaryAdjustment => Set<Plan_SupplementaryAdjustment>();
    public DbSet<Plan_TrackChanges> Plan_TrackChanges => Set<Plan_TrackChanges>();
    public DbSet<Plan_TrackChangesVirement> Plan_TrackChangesVirement => Set<Plan_TrackChangesVirement>();
    public DbSet<Plan_TrackExceptions> Plan_TrackExceptions => Set<Plan_TrackExceptions>();
    public DbSet<Plan_VirementApprovalRejections> Plan_VirementApprovalRejections => Set<Plan_VirementApprovalRejections>();
    public DbSet<Plan_VirementApprovalUsers> Plan_VirementApprovalUsers => Set<Plan_VirementApprovalUsers>();
    public DbSet<Plan_VirementBudgetSplit> Plan_VirementBudgetSplit => Set<Plan_VirementBudgetSplit>();
    public DbSet<Plan_VirementPolicyApproval> Plan_VirementPolicyApproval => Set<Plan_VirementPolicyApproval>();
    public DbSet<Plan_VirementPolicyVersion> Plan_VirementPolicyVersion => Set<Plan_VirementPolicyVersion>();
    public DbSet<Plan_VirementPolicyVersionDetail> Plan_VirementPolicyVersionDetail => Set<Plan_VirementPolicyVersionDetail>();
    public DbSet<Plan_Virements> Plan_Virements => Set<Plan_Virements>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<FinancialYear>(e =>
        {
            e.HasIndex(x => x.YearCode).IsUnique();
            e.Property(x => x.YearCode).HasMaxLength(9);
        });

        modelBuilder.Entity<Department>(e =>
        {
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.Code).HasMaxLength(50);
            e.Property(x => x.Name).HasMaxLength(200);
        });

        modelBuilder.Entity<BudgetVersion>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany(f => f.BudgetVersions).HasForeignKey(x => x.FinancialYearId);
            e.HasOne(x => x.ParentVersion).WithMany().HasForeignKey(x => x.ParentVersionId);
            e.Property(x => x.VersionName).HasMaxLength(200);
            e.Property(x => x.VersionType).HasConversion<string>().HasMaxLength(10);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
        });

        modelBuilder.Entity<Project>(e =>
        {
            e.HasIndex(x => x.ProjectCode).IsUnique();
            e.Property(x => x.ProjectCode).HasMaxLength(50);
            e.Property(x => x.ProjectName).HasMaxLength(300);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Department).WithMany(d => d.Projects).HasForeignKey(x => x.DepartmentId);
        });

        modelBuilder.Entity<BudgetString>(e =>
        {
            e.HasOne(x => x.BudgetVersion).WithMany(v => v.BudgetStrings).HasForeignKey(x => x.BudgetVersionId);
            e.HasOne(x => x.Project).WithMany(p => p.BudgetStrings).HasForeignKey(x => x.ProjectId);
            e.HasOne(x => x.ScoaItem).WithMany().HasForeignKey(x => x.ScoaItemId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaFund).WithMany().HasForeignKey(x => x.ScoaFundId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaFunction).WithMany().HasForeignKey(x => x.ScoaFunctionId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaProjectNav).WithMany().HasForeignKey(x => x.ScoaProjectId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaRegion).WithMany().HasForeignKey(x => x.ScoaRegionId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaCosting).WithMany().HasForeignKey(x => x.ScoaCostingId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaMsc).WithMany().HasForeignKey(x => x.ScoaMscId).OnDelete(DeleteBehavior.Restrict);
            e.Property(x => x.SourceModule).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Year1Amount).HasPrecision(18, 2);
            e.Property(x => x.Year2Amount).HasPrecision(18, 2);
            e.Property(x => x.Year3Amount).HasPrecision(18, 2);
            e.Property(x => x.Month01).HasPrecision(18, 2);
            e.Property(x => x.Month02).HasPrecision(18, 2);
            e.Property(x => x.Month03).HasPrecision(18, 2);
            e.Property(x => x.Month04).HasPrecision(18, 2);
            e.Property(x => x.Month05).HasPrecision(18, 2);
            e.Property(x => x.Month06).HasPrecision(18, 2);
            e.Property(x => x.Month07).HasPrecision(18, 2);
            e.Property(x => x.Month08).HasPrecision(18, 2);
            e.Property(x => x.Month09).HasPrecision(18, 2);
            e.Property(x => x.Month10).HasPrecision(18, 2);
            e.Property(x => x.Month11).HasPrecision(18, 2);
            e.Property(x => x.Month12).HasPrecision(18, 2);
            e.HasIndex(x => new { x.BudgetVersionId, x.ScoaItemId, x.ScoaFundId, x.ScoaFunctionId, x.ScoaProjectId, x.ScoaRegionId, x.ScoaCostingId, x.ScoaMscId });
        });

        modelBuilder.Entity<BudgetApproval>(e =>
        {
            e.HasOne(x => x.BudgetVersion).WithMany(v => v.Approvals).HasForeignKey(x => x.BudgetVersionId);
            e.Property(x => x.EntityType).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.Decision).HasConversion<string>().HasMaxLength(20);
        });

        modelBuilder.Entity<Models.ValidationResult>(e =>
        {
            e.HasOne(x => x.BudgetVersion).WithMany(v => v.ValidationResults).HasForeignKey(x => x.BudgetVersionId);
            e.HasOne(x => x.BudgetString).WithMany(s => s.ValidationResults).HasForeignKey(x => x.BudgetStringId);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(10);
        });

        modelBuilder.Entity<VirementRequest>(e =>
        {
            e.HasOne(x => x.BudgetVersion).WithMany().HasForeignKey(x => x.BudgetVersionId);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.Property(x => x.ThresholdPercentage).HasPrecision(5, 2);
            e.HasIndex(x => x.VirementNumber).IsUnique();
        });

        modelBuilder.Entity<VirementPolicy>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.Property(x => x.PolicyVersion).HasMaxLength(50);
            e.HasIndex(x => new { x.FinancialYearId, x.PolicyVersion }).IsUnique();
        });

        modelBuilder.Entity<VirementPolicyRule>(e =>
        {
            e.HasOne(x => x.Policy).WithMany(p => p.Rules).HasForeignKey(x => x.VirementPolicyId).OnDelete(DeleteBehavior.Cascade);
            e.Property(x => x.Principle).HasMaxLength(100);
            e.Property(x => x.Description).HasMaxLength(2000);
            e.Property(x => x.ValidationRule).HasMaxLength(1000);
            e.Property(x => x.Severity).HasMaxLength(20);
            e.Property(x => x.SegmentType).HasMaxLength(50);
            e.Property(x => x.FromSegmentFilter).HasMaxLength(200);
            e.Property(x => x.ToSegmentFilter).HasMaxLength(200);
            e.Property(x => x.ThresholdPercent).HasPrecision(5, 2);
            e.Property(x => x.MaxAmount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<ProjectBudgetLine>(e =>
        {
            e.HasOne(x => x.Project).WithMany(p => p.ProjectBudgetLines).HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ScoaItem).WithMany().HasForeignKey(x => x.ScoaItemId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaFund).WithMany().HasForeignKey(x => x.ScoaFundId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaFunction).WithMany().HasForeignKey(x => x.ScoaFunctionId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaRegion).WithMany().HasForeignKey(x => x.ScoaRegionId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaCosting).WithMany().HasForeignKey(x => x.ScoaCostingId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Department).WithMany().HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.Restrict);
            e.Property(x => x.Year1Amount).HasPrecision(18, 2);
            e.Property(x => x.Year2Amount).HasPrecision(18, 2);
            e.Property(x => x.Year3Amount).HasPrecision(18, 2);
            e.Property(x => x.Month01).HasPrecision(18, 2);
            e.Property(x => x.Month02).HasPrecision(18, 2);
            e.Property(x => x.Month03).HasPrecision(18, 2);
            e.Property(x => x.Month04).HasPrecision(18, 2);
            e.Property(x => x.Month05).HasPrecision(18, 2);
            e.Property(x => x.Month06).HasPrecision(18, 2);
            e.Property(x => x.Month07).HasPrecision(18, 2);
            e.Property(x => x.Month08).HasPrecision(18, 2);
            e.Property(x => x.Month09).HasPrecision(18, 2);
            e.Property(x => x.Month10).HasPrecision(18, 2);
            e.Property(x => x.Month11).HasPrecision(18, 2);
            e.Property(x => x.Month12).HasPrecision(18, 2);
        });

        modelBuilder.Entity<AuditTrail>(e =>
        {
            e.HasIndex(x => new { x.EntityType, x.EntityId });
            e.HasIndex(x => x.Timestamp);
        });

        modelBuilder.Entity<IntegrationDispatch>(e =>
        {
            e.HasOne(x => x.BudgetVersion).WithMany(v => v.Dispatches).HasForeignKey(x => x.BudgetVersionId);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        });

        modelBuilder.Entity<ServiceCategory>(e =>
        {
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.Code).HasMaxLength(20);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.MeasurementUnit).HasMaxLength(20);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(20);
        });

        modelBuilder.Entity<Tariff>(e =>
        {
            e.HasOne(x => x.ServiceCategory).WithMany(s => s.Tariffs).HasForeignKey(x => x.ServiceCategoryId);
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.Property(x => x.PropertyCategory).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.TariffType).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.BasicCharge).HasPrecision(18, 4);
            e.Property(x => x.UnitRate).HasPrecision(18, 4);
            e.Property(x => x.BlockStart).HasPrecision(18, 2);
            e.Property(x => x.BlockEnd).HasPrecision(18, 2);
        });

        modelBuilder.Entity<TariffScenario>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.BaseIncreasePercentage).HasPrecision(5, 2);
        });

        modelBuilder.Entity<TariffScenarioLine>(e =>
        {
            e.HasOne(x => x.Scenario).WithMany(s => s.Lines).HasForeignKey(x => x.TariffScenarioId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ServiceCategory).WithMany().HasForeignKey(x => x.ServiceCategoryId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.BaseTariff).WithMany().HasForeignKey(x => x.BaseTariffId).OnDelete(DeleteBehavior.SetNull);
            e.Property(x => x.CurrentUnitRate).HasPrecision(18, 4);
            e.Property(x => x.CurrentBasicCharge).HasPrecision(18, 4);
            e.Property(x => x.ProjectedUnitRate).HasPrecision(18, 4);
            e.Property(x => x.ProjectedBasicCharge).HasPrecision(18, 4);
            e.Property(x => x.IncreasePercent).HasPrecision(5, 2);
            e.Property(x => x.CurrentRevenue).HasPrecision(18, 2);
            e.Property(x => x.ProjectedRevenue).HasPrecision(18, 2);
            e.Property(x => x.VarianceAmount).HasPrecision(18, 2);
            e.Property(x => x.VariancePercent).HasPrecision(8, 2);
        });

        modelBuilder.Entity<ConsumerCategory>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.AvgMonthlyConsumption).HasPrecision(18, 2);
            e.Property(x => x.PropertyValueMin).HasPrecision(18, 2);
            e.Property(x => x.PropertyValueMax).HasPrecision(18, 2);
            e.Property(x => x.GeographicArea).HasMaxLength(200);
        });

        modelBuilder.Entity<ConsumerCategoryService>(e =>
        {
            e.HasOne(x => x.ConsumerCategory).WithMany(c => c.ConsumerServices).HasForeignKey(x => x.ConsumerCategoryId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ServiceCategory).WithMany(s => s.ConsumerServices).HasForeignKey(x => x.ServiceCategoryId).OnDelete(DeleteBehavior.Cascade);
            e.Property(x => x.AvgConsumption).HasPrecision(18, 2);
            e.HasIndex(x => new { x.ConsumerCategoryId, x.ServiceCategoryId }).IsUnique();
        });

        modelBuilder.Entity<RevenueProjection>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.HasOne(x => x.BudgetVersion).WithMany().HasForeignKey(x => x.BudgetVersionId);
            e.HasOne(x => x.ServiceCategory).WithMany().HasForeignKey(x => x.ServiceCategoryId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ConsumerCategory).WithMany().HasForeignKey(x => x.ConsumerCategoryId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.TariffScenario).WithMany().HasForeignKey(x => x.TariffScenarioId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.ScoaItem).WithMany().HasForeignKey(x => x.ScoaItemId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaFund).WithMany().HasForeignKey(x => x.ScoaFundId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaFunction).WithMany().HasForeignKey(x => x.ScoaFunctionId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaRegion).WithMany().HasForeignKey(x => x.ScoaRegionId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaCosting).WithMany().HasForeignKey(x => x.ScoaCostingId).OnDelete(DeleteBehavior.Restrict);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.AvgConsumption).HasPrecision(18, 2);
            e.Property(x => x.TariffRate).HasPrecision(18, 4);
            e.Property(x => x.GrossRevenue).HasPrecision(18, 2);
            e.Property(x => x.RebateAmount).HasPrecision(18, 2);
            e.Property(x => x.NetRevenue).HasPrecision(18, 2);
            e.Property(x => x.Year1Amount).HasPrecision(18, 2);
            e.Property(x => x.Year2Amount).HasPrecision(18, 2);
            e.Property(x => x.Year3Amount).HasPrecision(18, 2);
            e.Property(x => x.Month01).HasPrecision(18, 2);
            e.Property(x => x.Month02).HasPrecision(18, 2);
            e.Property(x => x.Month03).HasPrecision(18, 2);
            e.Property(x => x.Month04).HasPrecision(18, 2);
            e.Property(x => x.Month05).HasPrecision(18, 2);
            e.Property(x => x.Month06).HasPrecision(18, 2);
            e.Property(x => x.Month07).HasPrecision(18, 2);
            e.Property(x => x.Month08).HasPrecision(18, 2);
            e.Property(x => x.Month09).HasPrecision(18, 2);
            e.Property(x => x.Month10).HasPrecision(18, 2);
            e.Property(x => x.Month11).HasPrecision(18, 2);
            e.Property(x => x.Month12).HasPrecision(18, 2);
        });

        modelBuilder.Entity<RebateType>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Category).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.RebatePercent).HasPrecision(5, 2);
            e.Property(x => x.FixedAmount).HasPrecision(18, 2);
            e.HasOne(x => x.ServiceCategory).WithMany(s => s.RebateTypes).HasForeignKey(x => x.ServiceCategoryId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<RebateProjection>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.HasOne(x => x.RebateType).WithMany(r => r.Projections).HasForeignKey(x => x.RebateTypeId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ServiceCategory).WithMany().HasForeignKey(x => x.ServiceCategoryId).OnDelete(DeleteBehavior.SetNull);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.ProjectedUptakePercent).HasPrecision(5, 2);
            e.Property(x => x.TotalRebateAmount).HasPrecision(18, 2);
            e.Property(x => x.Year1Amount).HasPrecision(18, 2);
            e.Property(x => x.Year2Amount).HasPrecision(18, 2);
            e.Property(x => x.Year3Amount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<BillingBudgetApproval>(e =>
        {
            e.Property(x => x.EntityType).HasMaxLength(50);
            e.Property(x => x.ApprovalType).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.Decision).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(x => new { x.EntityType, x.EntityId });
        });

        modelBuilder.Entity<ExpenditureCategory>(e =>
        {
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.Code).HasMaxLength(20);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.MeasurementUnit).HasMaxLength(20);
            e.Property(x => x.Department).HasMaxLength(100);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(30);
        });

        modelBuilder.Entity<CostItem>(e =>
        {
            e.HasOne(x => x.ExpenditureCategory).WithMany(s => s.CostItems).HasForeignKey(x => x.ExpenditureCategoryId);
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.Property(x => x.ItemType).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.VatIndicator).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.BasicCost).HasPrecision(18, 4);
            e.Property(x => x.UnitRate).HasPrecision(18, 4);
            e.Property(x => x.BlockStart).HasPrecision(18, 2);
            e.Property(x => x.BlockEnd).HasPrecision(18, 2);
            e.Property(x => x.SupplierName).HasMaxLength(200);
            e.Property(x => x.SupplierVatNumber).HasMaxLength(20);
            e.Property(x => x.ContractReference).HasMaxLength(50);
            e.Property(x => x.VariabilityType).HasMaxLength(50);
        });

        modelBuilder.Entity<ExpenditureScenario>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.BaseInflationPercent).HasPrecision(5, 2);
            e.Property(x => x.DemandAdjustmentPercent).HasPrecision(5, 2);
        });

        modelBuilder.Entity<ExpenditureScenarioLine>(e =>
        {
            e.HasOne(x => x.Scenario).WithMany(s => s.Lines).HasForeignKey(x => x.ExpenditureScenarioId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ExpenditureCategory).WithMany().HasForeignKey(x => x.ExpenditureCategoryId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.BaseCostItem).WithMany().HasForeignKey(x => x.BaseCostItemId).OnDelete(DeleteBehavior.SetNull);
            e.Property(x => x.CurrentUnitRate).HasPrecision(18, 4);
            e.Property(x => x.CurrentBasicCost).HasPrecision(18, 4);
            e.Property(x => x.ProjectedUnitRate).HasPrecision(18, 4);
            e.Property(x => x.ProjectedBasicCost).HasPrecision(18, 4);
            e.Property(x => x.InflationPercent).HasPrecision(5, 2);
            e.Property(x => x.DemandAdjustmentPercent).HasPrecision(5, 2);
            e.Property(x => x.CurrentExpenditure).HasPrecision(18, 2);
            e.Property(x => x.ProjectedExpenditure).HasPrecision(18, 2);
            e.Property(x => x.VarianceAmount).HasPrecision(18, 2);
            e.Property(x => x.VariancePercent).HasPrecision(8, 2);
        });

        modelBuilder.Entity<CreditorCategory>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.InterestRate).HasPrecision(5, 2);
            e.Property(x => x.InterestCalculationMethod).HasMaxLength(50);
        });

        modelBuilder.Entity<CreditorCategoryItem>(e =>
        {
            e.HasOne(x => x.CreditorCategory).WithMany(c => c.CreditorItems).HasForeignKey(x => x.CreditorCategoryId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ExpenditureCategory).WithMany(s => s.CreditorItems).HasForeignKey(x => x.ExpenditureCategoryId).OnDelete(DeleteBehavior.Cascade);
            e.Property(x => x.PaymentRate30Days).HasPrecision(5, 2);
            e.Property(x => x.PaymentRate60Days).HasPrecision(5, 2);
            e.Property(x => x.PaymentRate90Days).HasPrecision(5, 2);
            e.Property(x => x.PaymentRateOver90Days).HasPrecision(5, 2);
            e.HasIndex(x => new { x.CreditorCategoryId, x.ExpenditureCategoryId }).IsUnique();
        });

        modelBuilder.Entity<ExpenditureProjection>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.HasOne(x => x.BudgetVersion).WithMany().HasForeignKey(x => x.BudgetVersionId);
            e.HasOne(x => x.ExpenditureCategory).WithMany().HasForeignKey(x => x.ExpenditureCategoryId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.CostItem).WithMany().HasForeignKey(x => x.CostItemId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.ExpenditureScenario).WithMany().HasForeignKey(x => x.ExpenditureScenarioId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.ScoaItem).WithMany().HasForeignKey(x => x.ScoaItemId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaFund).WithMany().HasForeignKey(x => x.ScoaFundId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaFunction).WithMany().HasForeignKey(x => x.ScoaFunctionId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaRegion).WithMany().HasForeignKey(x => x.ScoaRegionId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaCosting).WithMany().HasForeignKey(x => x.ScoaCostingId).OnDelete(DeleteBehavior.Restrict);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.UnitRate).HasPrecision(18, 4);
            e.Property(x => x.BasicCost).HasPrecision(18, 4);
            e.Property(x => x.GrossExpenditure).HasPrecision(18, 2);
            e.Property(x => x.VatAmount).HasPrecision(18, 2);
            e.Property(x => x.NetExpenditure).HasPrecision(18, 2);
            e.Property(x => x.Year1Amount).HasPrecision(18, 2);
            e.Property(x => x.Year2Amount).HasPrecision(18, 2);
            e.Property(x => x.Year3Amount).HasPrecision(18, 2);
            e.Property(x => x.Month01).HasPrecision(18, 2);
            e.Property(x => x.Month02).HasPrecision(18, 2);
            e.Property(x => x.Month03).HasPrecision(18, 2);
            e.Property(x => x.Month04).HasPrecision(18, 2);
            e.Property(x => x.Month05).HasPrecision(18, 2);
            e.Property(x => x.Month06).HasPrecision(18, 2);
            e.Property(x => x.Month07).HasPrecision(18, 2);
            e.Property(x => x.Month08).HasPrecision(18, 2);
            e.Property(x => x.Month09).HasPrecision(18, 2);
            e.Property(x => x.Month10).HasPrecision(18, 2);
            e.Property(x => x.Month11).HasPrecision(18, 2);
            e.Property(x => x.Month12).HasPrecision(18, 2);
        });

        modelBuilder.Entity<CreditorLiability>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.HasOne(x => x.ExpenditureCategory).WithMany().HasForeignKey(x => x.ExpenditureCategoryId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.CreditorCategory).WithMany().HasForeignKey(x => x.CreditorCategoryId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.ScoaItem).WithMany().HasForeignKey(x => x.ScoaItemId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaFund).WithMany().HasForeignKey(x => x.ScoaFundId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaFunction).WithMany().HasForeignKey(x => x.ScoaFunctionId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaRegion).WithMany().HasForeignKey(x => x.ScoaRegionId).OnDelete(DeleteBehavior.Restrict);
            e.Property(x => x.LiabilityType).HasMaxLength(50);
            e.Property(x => x.ContraBankAccount).HasMaxLength(50);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.OpeningBalance).HasPrecision(18, 2);
            e.Property(x => x.ProjectedExpenditure).HasPrecision(18, 2);
            e.Property(x => x.ProjectedPayments).HasPrecision(18, 2);
            e.Property(x => x.ClosingBalance).HasPrecision(18, 2);
            e.Property(x => x.PaymentRate).HasPrecision(5, 2);
            e.Property(x => x.Year1Amount).HasPrecision(18, 2);
            e.Property(x => x.Year2Amount).HasPrecision(18, 2);
            e.Property(x => x.Year3Amount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<CreditorPaymentArrangement>(e =>
        {
            e.HasOne(x => x.ExpenditureCategory).WithMany().HasForeignKey(x => x.ExpenditureCategoryId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.ScoaItem).WithMany().HasForeignKey(x => x.ScoaItemId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ScoaFunction).WithMany().HasForeignKey(x => x.ScoaFunctionId).OnDelete(DeleteBehavior.Restrict);
            e.Property(x => x.CreditorName).HasMaxLength(200);
            e.Property(x => x.ReferenceNumber).HasMaxLength(50);
            e.Property(x => x.ArrangementStatus).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.TotalOutstanding).HasPrecision(18, 2);
            e.Property(x => x.InstalmentAmount).HasPrecision(18, 2);
            e.Property(x => x.RemainingBalance).HasPrecision(18, 2);
            e.Property(x => x.InterestRate).HasPrecision(5, 2);
        });

        modelBuilder.Entity<ForecastAssumption>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.AssumptionType).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.Category).HasMaxLength(100);
            e.Property(x => x.Year1Value).HasPrecision(8, 4);
            e.Property(x => x.Year2Value).HasPrecision(8, 4);
            e.Property(x => x.Year3Value).HasPrecision(8, 4);
        });

        modelBuilder.Entity<CreditorsBudgetApproval>(e =>
        {
            e.Property(x => x.EntityType).HasMaxLength(50);
            e.Property(x => x.ApprovalType).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.Decision).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(x => new { x.EntityType, x.EntityId });
        });

        modelBuilder.Entity<PostEstablishment>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.HasIndex(x => x.PostCode).IsUnique();
            e.Property(x => x.PostCode).HasMaxLength(50);
            e.Property(x => x.Title).HasMaxLength(300);
            e.Property(x => x.Department).HasMaxLength(100);
            e.Property(x => x.JobLevel).HasMaxLength(50);
            e.Property(x => x.EmploymentType).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.PriorityStatus).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.FundingSource).HasMaxLength(100);
            e.Property(x => x.BargainingUnit).HasMaxLength(100);
            e.Property(x => x.EmployeeCategory).HasMaxLength(100);
            e.Property(x => x.AnnualSalary).HasPrecision(18, 2);
            e.Property(x => x.TotalCostToMunicipality).HasPrecision(18, 2);
            e.Property(x => x.RankingScore).HasPrecision(8, 2);
            e.Property(x => x.ScoaItemCode).HasMaxLength(50);
            e.Property(x => x.ScoaFundCode).HasMaxLength(50);
            e.Property(x => x.ScoaFunctionCode).HasMaxLength(50);
            e.Property(x => x.ScoaRegionCode).HasMaxLength(50);
            e.Property(x => x.ScoaCostingCode).HasMaxLength(50);
        });

        modelBuilder.Entity<SalaryStructure>(e =>
        {
            e.HasIndex(x => new { x.Grade, x.Notch }).IsUnique();
            e.Property(x => x.AnnualAmount).HasPrecision(18, 2);
            e.Property(x => x.HourlyRate).HasPrecision(18, 4);
            e.Property(x => x.BargainingUnit).HasMaxLength(100);
            e.Property(x => x.EmployeeCategory).HasMaxLength(100);
            e.Property(x => x.JobLevel).HasMaxLength(50);
        });

        modelBuilder.Entity<SalaryIncrease>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.Property(x => x.EmployeeCategory).HasMaxLength(100);
            e.Property(x => x.BargainingUnit).HasMaxLength(100);
            e.Property(x => x.PostLevel).HasMaxLength(50);
            e.Property(x => x.IncreasePercentage).HasPrecision(5, 2);
        });

        modelBuilder.Entity<TemporaryContract>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.Property(x => x.EmployeeName).HasMaxLength(200);
            e.Property(x => x.PostCode).HasMaxLength(50);
            e.Property(x => x.Department).HasMaxLength(100);
            e.Property(x => x.JobTitle).HasMaxLength(200);
            e.Property(x => x.RemunerationType).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Rate).HasPrecision(18, 2);
            e.Property(x => x.CalculatedBudget).HasPrecision(18, 2);
            e.Property(x => x.ContractStatus).HasMaxLength(30);
            e.Property(x => x.ScoaItemCode).HasMaxLength(50);
            e.Property(x => x.ScoaFundCode).HasMaxLength(50);
            e.Property(x => x.ScoaFunctionCode).HasMaxLength(50);
        });

        modelBuilder.Entity<CouncillorPosition>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.Property(x => x.PositionTitle).HasMaxLength(200);
            e.Property(x => x.CouncillorType).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.BasicSalary).HasPrecision(18, 2);
            e.Property(x => x.TravelAllowance).HasPrecision(18, 2);
            e.Property(x => x.CellphoneAllowance).HasPrecision(18, 2);
            e.Property(x => x.MedicalContribution).HasPrecision(18, 2);
            e.Property(x => x.OtherBenefits).HasPrecision(18, 2);
            e.Property(x => x.TotalRemuneration).HasPrecision(18, 2);
            e.Property(x => x.AnticipatedIncreasePercent).HasPrecision(5, 2);
            e.Property(x => x.AdjustedTotalRemuneration).HasPrecision(18, 2);
            e.Property(x => x.GazettedUpperLimit).HasPrecision(18, 2);
            e.Property(x => x.ScoaItemCode).HasMaxLength(50);
            e.Property(x => x.ScoaFundCode).HasMaxLength(50);
            e.Property(x => x.ScoaFunctionCode).HasMaxLength(50);
            e.Property(x => x.ScoaRegionCode).HasMaxLength(50);
        });

        modelBuilder.Entity<WardCommitteeBudget>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.Property(x => x.WardName).HasMaxLength(100);
            e.Property(x => x.Region).HasMaxLength(100);
            e.Property(x => x.RatePerMeeting).HasPrecision(18, 2);
            e.Property(x => x.AdjustedRatePerMeeting).HasPrecision(18, 2);
            e.Property(x => x.AnticipatedRateIncreasePercent).HasPrecision(5, 2);
            e.Property(x => x.TotalEstimatedCost).HasPrecision(18, 2);
            e.Property(x => x.ScoaItemCode).HasMaxLength(50);
            e.Property(x => x.ScoaFundCode).HasMaxLength(50);
            e.Property(x => x.ScoaFunctionCode).HasMaxLength(50);
            e.Property(x => x.ScoaRegionCode).HasMaxLength(50);
        });

        modelBuilder.Entity<VariableBenefitHours>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.Property(x => x.Department).HasMaxLength(100);
            e.Property(x => x.BenefitType).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.EstimatedHours).HasPrecision(18, 2);
            e.Property(x => x.AverageRate).HasPrecision(18, 4);
            e.Property(x => x.CalculatedCost).HasPrecision(18, 2);
            e.Property(x => x.HistoricalHours).HasPrecision(18, 2);
            e.Property(x => x.HistoricalCost).HasPrecision(18, 2);
            e.Property(x => x.VariancePercent).HasPrecision(8, 2);
            e.Property(x => x.ScoaItemCode).HasMaxLength(50);
            e.Property(x => x.ScoaFundCode).HasMaxLength(50);
            e.Property(x => x.ScoaFunctionCode).HasMaxLength(50);
        });

        modelBuilder.Entity<TravelRequirement>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.Property(x => x.Department).HasMaxLength(100);
            e.Property(x => x.ProjectReference).HasMaxLength(50);
            e.Property(x => x.Destination).HasMaxLength(200);
            e.Property(x => x.PurposeOfTravel).HasMaxLength(500);
            e.Property(x => x.TransportMode).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.EstimatedKilometres).HasPrecision(18, 2);
            e.Property(x => x.EstimatedCost).HasPrecision(18, 2);
            e.Property(x => x.ScoaItemCode).HasMaxLength(50);
            e.Property(x => x.ScoaFundCode).HasMaxLength(50);
            e.Property(x => x.ScoaFunctionCode).HasMaxLength(50);
            e.Property(x => x.ScoaProjectCode).HasMaxLength(50);
            e.Property(x => x.ScoaRegionCode).HasMaxLength(50);
        });

        modelBuilder.Entity<TravelStandardRate>(e =>
        {
            e.Property(x => x.RateType).HasMaxLength(100);
            e.Property(x => x.Classification).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.EmployeeLevel).HasMaxLength(50);
            e.Property(x => x.RateAmount).HasPrecision(18, 2);
            e.Property(x => x.PolicyReference).HasMaxLength(200);
        });

        modelBuilder.Entity<StatutoryDeduction>(e =>
        {
            e.Property(x => x.DeductionType).HasMaxLength(50);
            e.Property(x => x.CalculationMethod).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Rate).HasPrecision(8, 4);
            e.Property(x => x.Threshold).HasPrecision(18, 2);
            e.Property(x => x.EmployerContributionRate).HasPrecision(8, 4);
            e.Property(x => x.Description).HasMaxLength(500);
            e.HasIndex(x => x.DeductionType).IsUnique();
        });

        modelBuilder.Entity<PayrollLiability>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.Property(x => x.LiabilityType).HasMaxLength(50);
            e.Property(x => x.Department).HasMaxLength(100);
            e.Property(x => x.EmployeeContribution).HasPrecision(18, 2);
            e.Property(x => x.EmployerContribution).HasPrecision(18, 2);
            e.Property(x => x.TotalLiability).HasPrecision(18, 2);
            e.Property(x => x.PaymentPeriod).HasMaxLength(20);
            e.Property(x => x.ScoaItemCode).HasMaxLength(50);
            e.Property(x => x.ScoaFundCode).HasMaxLength(50);
            e.Property(x => x.ScoaFunctionCode).HasMaxLength(50);
            e.Property(x => x.ScoaRegionCode).HasMaxLength(50);
        });

        modelBuilder.Entity<DefinedBenefitObligation>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.Property(x => x.BenefitType).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.Department).HasMaxLength(100);
            e.Property(x => x.OpeningBalance).HasPrecision(18, 2);
            e.Property(x => x.ServiceCost).HasPrecision(18, 2);
            e.Property(x => x.InterestCost).HasPrecision(18, 2);
            e.Property(x => x.BenefitPayments).HasPrecision(18, 2);
            e.Property(x => x.ActuarialGainLoss).HasPrecision(18, 2);
            e.Property(x => x.ClosingBalance).HasPrecision(18, 2);
            e.Property(x => x.CurrentPortion).HasPrecision(18, 2);
            e.Property(x => x.NonCurrentPortion).HasPrecision(18, 2);
            e.Property(x => x.DiscountRate).HasPrecision(8, 4);
            e.Property(x => x.InflationRate).HasPrecision(8, 4);
            e.Property(x => x.SalaryGrowthRate).HasPrecision(8, 4);
            e.Property(x => x.MortalityRate).HasPrecision(8, 4);
            e.Property(x => x.TurnoverRate).HasPrecision(8, 4);
            e.Property(x => x.ScoaItemCode).HasMaxLength(50);
            e.Property(x => x.ScoaFundCode).HasMaxLength(50);
            e.Property(x => x.ScoaFunctionCode).HasMaxLength(50);
            e.Property(x => x.ScoaRegionCode).HasMaxLength(50);
        });

        modelBuilder.Entity<LongServiceAward>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.Property(x => x.Department).HasMaxLength(100);
            e.Property(x => x.BenefitAmount).HasPrecision(18, 2);
            e.Property(x => x.EstimatedPayments).HasPrecision(18, 2);
            e.Property(x => x.CurrentPortion).HasPrecision(18, 2);
            e.Property(x => x.NonCurrentPortion).HasPrecision(18, 2);
            e.Property(x => x.ScoaItemCode).HasMaxLength(50);
            e.Property(x => x.ScoaFundCode).HasMaxLength(50);
            e.Property(x => x.ScoaFunctionCode).HasMaxLength(50);
        });

        modelBuilder.Entity<PerformanceBonus>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.Property(x => x.Department).HasMaxLength(100);
            e.Property(x => x.EmployeeCategory).HasMaxLength(100);
            e.Property(x => x.BonusPercentage).HasPrecision(5, 2);
            e.Property(x => x.AverageSalary).HasPrecision(18, 2);
            e.Property(x => x.EstimatedTotalCost).HasPrecision(18, 2);
            e.Property(x => x.ScoaItemCode).HasMaxLength(50);
            e.Property(x => x.ScoaFundCode).HasMaxLength(50);
            e.Property(x => x.ScoaFunctionCode).HasMaxLength(50);
        });

        modelBuilder.Entity<PayrollScenario>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.Property(x => x.Name).HasMaxLength(200);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.SalaryIncreasePercent).HasPrecision(5, 2);
            e.Property(x => x.VacancyFillingPercent).HasPrecision(5, 2);
            e.Property(x => x.BenefitAdjustmentPercent).HasPrecision(5, 2);
            e.Property(x => x.OvertimeAdjustmentPercent).HasPrecision(5, 2);
            e.Property(x => x.TravelAdjustmentPercent).HasPrecision(5, 2);
            e.Property(x => x.TotalBaselineCost).HasPrecision(18, 2);
            e.Property(x => x.TotalScenarioCost).HasPrecision(18, 2);
            e.Property(x => x.VarianceAmount).HasPrecision(18, 2);
            e.Property(x => x.VariancePercent).HasPrecision(8, 2);
        });

        modelBuilder.Entity<PayrollBudgetLine>(e =>
        {
            e.HasOne(x => x.FinancialYear).WithMany().HasForeignKey(x => x.FinancialYearId);
            e.Property(x => x.Department).HasMaxLength(100);
            e.Property(x => x.CostCategory).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.SubCategory).HasMaxLength(100);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.Year1Amount).HasPrecision(18, 2);
            e.Property(x => x.Year2Amount).HasPrecision(18, 2);
            e.Property(x => x.Year3Amount).HasPrecision(18, 2);
            e.Property(x => x.Month01).HasPrecision(18, 2);
            e.Property(x => x.Month02).HasPrecision(18, 2);
            e.Property(x => x.Month03).HasPrecision(18, 2);
            e.Property(x => x.Month04).HasPrecision(18, 2);
            e.Property(x => x.Month05).HasPrecision(18, 2);
            e.Property(x => x.Month06).HasPrecision(18, 2);
            e.Property(x => x.Month07).HasPrecision(18, 2);
            e.Property(x => x.Month08).HasPrecision(18, 2);
            e.Property(x => x.Month09).HasPrecision(18, 2);
            e.Property(x => x.Month10).HasPrecision(18, 2);
            e.Property(x => x.Month11).HasPrecision(18, 2);
            e.Property(x => x.Month12).HasPrecision(18, 2);
            e.Property(x => x.ScoaItemCode).HasMaxLength(50);
            e.Property(x => x.ScoaFundCode).HasMaxLength(50);
            e.Property(x => x.ScoaFunctionCode).HasMaxLength(50);
            e.Property(x => x.ScoaRegionCode).HasMaxLength(50);
            e.Property(x => x.ScoaCostingCode).HasMaxLength(50);
        });

        modelBuilder.Entity<HrPayrollBudgetApproval>(e =>
        {
            e.Property(x => x.EntityType).HasMaxLength(50);
            e.Property(x => x.Decision).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(x => new { x.EntityType, x.EntityId });
        });

        ConfigureScoaSegments<ScoaItem>(modelBuilder, "ScoaItems");
        ConfigureScoaSegments<ScoaFund>(modelBuilder, "ScoaFunds");
        ConfigureScoaSegments<ScoaFunction>(modelBuilder, "ScoaFunctions");
        ConfigureScoaSegments<ScoaProject>(modelBuilder, "ScoaProjects");
        ConfigureScoaSegments<ScoaRegion>(modelBuilder, "ScoaRegions");
        ConfigureScoaSegments<ScoaCosting>(modelBuilder, "ScoaCostings");
        ConfigureScoaSegments<ScoaMsc>(modelBuilder, "ScoaMscs");
    }

    private static void ConfigureScoaSegments<T>(ModelBuilder modelBuilder, string tableName) where T : ScoaSegmentBase
    {
        modelBuilder.Entity<T>(e =>
        {
            e.ToTable(tableName);
            e.HasIndex(x => x.Code);
            e.Property(x => x.Code).HasMaxLength(50);
            e.Property(x => x.Description).HasMaxLength(500);
        });
    }
}
