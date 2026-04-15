using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumBudget.Api.Models;

[Table("Const_BudgetAdjustmentType_Sys")]
public class Const_BudgetAdjustmentType_Sys
{
    [Key]
    public int AdjustmentType_ID { get; set; } = 0;

    public string? AdjustmentTypeDesc { get; set; }

    public bool Enabled { get; set; }

    public int DisplayOrder { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public string? ModifierId { get; set; }
}

[Table("Const_BudgetConsumptionProcess_Sys")]
public class Const_BudgetConsumptionProcess_Sys
{
    [Key]
    public int BudgetConsumptionProcess_ID { get; set; } = 0;

    public string? BudgetConsumptionProcessDesc { get; set; }

    public bool BudgetConsumptionProcessEnabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_BudgetLayout_Sys")]
public class Const_BudgetLayout_Sys
{
    [Key]
    public int BudgetLayout_ID { get; set; } = 0;

    public string? BudgetLayoutDesc { get; set; }

    public bool Enabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_BudgetSplitOptions")]
public class Const_BudgetSplitOptions
{
    [Key]
    public int BudgetSplit_ID { get; set; } = 0;

    public string? BudgetSplitDesc { get; set; }

    public int DivideBy_ID { get; set; }

    public bool Enabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_BudgetTransactionType_sys")]
public class Const_BudgetTransactionType_sys
{
    [Key]
    public int BudgetTransactionType_ID { get; set; } = 0;

    public string? BudgetTransDesc { get; set; }

    public bool? Enabled { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Const_BudgetValidationRule_Sys")]
public class Const_BudgetValidationRule_Sys
{
    [Key]
    public int BudgetValidationRule_ID { get; set; } = 0;

    public string? BudgetValidationRuleDesc { get; set; }

    public bool BudgetValidationRuleApplicableOverallBudget { get; set; }

    public bool BudgetValidationRuleEnabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_Department")]
public class Const_Department
{
    [Key]
    public int Department_ID { get; set; } = 0;

    public string? DepartmentDesc { get; set; }

    public bool Enabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public string? DepartmentCode { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public int? VatApportionment { get; set; }

    public int? ManagerPositionID { get; set; }

    public DateTime? ManagerStartDate { get; set; }

    public DateTime? ManagerEndDate { get; set; }

    public string? FinYear { get; set; }
}

[Table("Const_Division")]
public class Const_Division
{
    [Key]
    public int Division_ID { get; set; } = 0;

    public string? DivisionDesc { get; set; }

    public string? DivisionCode { get; set; }

    public int DepartmentID { get; set; }

    public int? DivisionParentID { get; set; }

    public bool Enabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public int? SCOAFunctionID { get; set; }

    public int? HRPayrollSCOAFundID { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public int? RegionID { get; set; }

    public int? ProjectID { get; set; }

    public int? ManagerPositionID { get; set; }

    public DateTime? ManagerStartDate { get; set; }

    public DateTime? ManagerEndDate { get; set; }

    public int? ConditionOfServiceID { get; set; }

    public bool? DirectorateLevel { get; set; }

    public string? FinYear { get; set; }
}

[Table("Const_FunderType")]
public class Const_FunderType
{
    [Key]
    public int Funder_ID { get; set; } = 0;

    public string? FunderName { get; set; }

    public bool Enabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_FundingSource")]
public class Const_FundingSource
{
    [Key]
    public int FundingSource_ID { get; set; } = 0;

    public string? FundingSourceDesc { get; set; }

    public bool Enabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public string? FinYear { get; set; }

    public int? PreviousReferenceId { get; set; }
}

[Table("Const_FundManagement")]
public class Const_FundManagement
{
    [Key]
    public int DocumentType_ID { get; set; } = 0;

    public string? DocumentTypeDesc { get; set; }

    public string? FinancialYear { get; set; }

    public bool Enabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public string? IsEditable { get; set; }
}

[Table("Const_FundSourceChange")]
public class Const_FundSourceChange
{
    [Key]
    public int FundSourceChange_ID { get; set; } = 0;

    public string? FundSourceChangeDesc { get; set; }

    public bool Enabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public string? FinYear { get; set; }

    public int? PreviousReferenceId { get; set; }
}

[Table("Const_GrantType")]
public class Const_GrantType
{
    [Key]
    public int GrantTypeID { get; set; } = 0;

    public string? Name { get; set; }

    public string? Description { get; set; }
}

[Table("Const_KPIGroup")]
public class Const_KPIGroup
{
    [Key]
    public int KPIGroup_ID { get; set; } = 0;

    public string? KPIGroupName { get; set; }

    public bool Enabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_KPIGroupDetail")]
public class Const_KPIGroupDetail
{
    [Key]
    public int KPIGroupDetail_ID { get; set; } = 0;

    public int KPIGroupID { get; set; }

    public string? KPIGroupName { get; set; }

    public bool Enabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_NationalKPA_Sys")]
public class Const_NationalKPA_Sys
{
    [Key]
    public int NKPA_ID { get; set; } = 0;

    public int NKPANumber { get; set; }

    public string? NKPADesc { get; set; }

    public string? FinancialYear { get; set; }

    public bool Enabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public int? PreviousReferenceId { get; set; }
}

[Table("Const_PlanAdjustmentReason_sys")]
public class Const_PlanAdjustmentReason_sys
{
    [Key]
    public int AdjustmentReason_ID { get; set; } = 0;

    public int Number { get; set; }

    public string? AdjustmentReason { get; set; }

    public bool Enabled { get; set; }

    public bool Lockdown { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public string? Reference { get; set; }

    public string? FinYear { get; set; }

    public int? PreviousReferenceId { get; set; }
}

[Table("Const_PlanAdjustmentType_sys")]
public class Const_PlanAdjustmentType_sys
{
    [Key]
    public int AdjustmentType_ID { get; set; } = 0;

    public int Number { get; set; }

    public string? AdjustmentType { get; set; }

    public bool Enabled { get; set; }

    public bool Lockdown { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public string? FinYear { get; set; }

    public int? PreviousReferenceId { get; set; }
}

[Table("Const_PlanCapitalOperationalTypes_sys")]
public class Const_PlanCapitalOperationalTypes_sys
{
    [Key]
    public int Type_ID { get; set; } = 0;

    public string? TypeName { get; set; }

    public int? TypeValue { get; set; }

    public bool Enabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public int? SortOrder { get; set; }

    public int StatusID { get; set; }
}

[Table("Const_PlanNetAssetItems")]
public class Const_PlanNetAssetItems
{
    [Key]
    public int NetAssetItems_ID { get; set; } = 0;

    public string? NTSCOAID { get; set; }

    public string? SCOADesc { get; set; }

    public int? CapturerID { get; set; }

    public DateTime? DateCaptured { get; set; }

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Const_PlanNTValidations")]
public class Const_PlanNTValidations
{
    [Key]
    public int NTValidation_Id { get; set; } = 0;

    public int ScoaItemId { get; set; }

    public int? ScoaFunctionId { get; set; }

    public bool? IsEnable { get; set; }

    public int? BudgetType { get; set; }

    public string? FinYear { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Const_PlanSCOAFundCapital")]
public class Const_PlanSCOAFundCapital
{
    [Key]
    public int SCOAFundCapital_Id { get; set; } = 0;

    public int ScoaFundId { get; set; }

    public bool? IsEnable { get; set; }

    public int? BudgetType { get; set; }

    public string? FinYear { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Const_PlanSCOAFundOperational")]
public class Const_PlanSCOAFundOperational
{
    [Key]
    public int SCOAFundOperational_Id { get; set; } = 0;

    public int ScoaFundId { get; set; }

    public bool? IsEnable { get; set; }

    public int? BudgetType { get; set; }

    public string? FinYear { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Const_PlanSCOAItemAssetFBS")]
public class Const_PlanSCOAItemAssetFBS
{
    [Key]
    public int SCOAItemAssetFBS_Id { get; set; } = 0;

    public int ScoaItemId { get; set; }

    public bool? IsEnable { get; set; }

    public int? BudgetType { get; set; }

    public string? CreditDebit { get; set; }

    public string? FinYear { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Const_PlanSCOAItemGainOR")]
public class Const_PlanSCOAItemGainOR
{
    [Key]
    public int SCOAItemGainOR_Id { get; set; } = 0;

    public int ScoaItemId { get; set; }

    public bool? IsEnable { get; set; }

    public int? BudgetType { get; set; }

    public string? CreditDebit { get; set; }

    public string? FinYear { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Const_PlanSCOAItemLossOE")]
public class Const_PlanSCOAItemLossOE
{
    [Key]
    public int SCOAItemLossOE_Id { get; set; } = 0;

    public int ScoaItemId { get; set; }

    public bool? IsEnable { get; set; }

    public int? BudgetType { get; set; }

    public string? CreditDebit { get; set; }

    public string? FinYear { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Const_PlanSCOAItemRevenueFBS")]
public class Const_PlanSCOAItemRevenueFBS
{
    [Key]
    public int SCOAItemRevenueFBS_Id { get; set; } = 0;

    public int ScoaItemId { get; set; }

    public bool? IsEnable { get; set; }

    public int? BudgetType { get; set; }

    public string? CreditDebit { get; set; }

    public string? FinYear { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Const_PlanSCOAProjectFBS")]
public class Const_PlanSCOAProjectFBS
{
    [Key]
    public int SCOAProjectFBS_Id { get; set; } = 0;

    public int ScoaId { get; set; }

    public bool? IsEnable { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public string? FinYear { get; set; }
}

[Table("Const_PlanVirementRules_sys")]
public class Const_PlanVirementRules_sys
{
    [Key]
    public int VirementRule_ID { get; set; } = 0;

    public int Priority { get; set; }

    public string? VirementDesc { get; set; }

    public string? VirementDefinition { get; set; }

    public string? VirementRuleDesc { get; set; }

    public string? BusinessRule { get; set; }

    public bool Enabled { get; set; }

    public bool Option { get; set; }

    public bool Lockdown { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public string? FinYear { get; set; }

    public int? PreviousReferenceId { get; set; }

    public int? VirementPolicyVersionID { get; set; }
}

[Table("Const_PMSAnnualField_Detail")]
public class Const_PMSAnnualField_Detail
{
    [Key]
    public int AnnualFieldDetail_ID { get; set; } = 0;

    public int AnnualFieldHeaderID { get; set; }

    public int DataTypeID { get; set; }

    public string? AnnualFieldDesc { get; set; }

    public int AnnualFieldOrderID { get; set; }

    public bool AnnualFieldEnabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_PMSAnnualField_Header")]
public class Const_PMSAnnualField_Header
{
    [Key]
    public int AnnualFieldHeader_ID { get; set; } = 0;

    public string? FinancialYear { get; set; }

    public bool AnnualFieldSubmitted { get; set; }

    public DateTime DataCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_PMSCoreCompetencyRequirement")]
public class Const_PMSCoreCompetencyRequirement
{
    [Key]
    public int CoreCompetencyRequirement_ID { get; set; } = 0;

    public int CoreCompetencyRequirementTypeID { get; set; }

    public string? CoreCompetencyRequirementDesc { get; set; }

    public bool Enabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public string? CoreCompetencyRequirement { get; set; }
}

[Table("Const_PMSCoreCompetencyRequirementType_sys")]
public class Const_PMSCoreCompetencyRequirementType_sys
{
    [Key]
    public int CoreCompetencyRequirementType_ID { get; set; } = 0;

    public string? CoreCompetencyRequirementTypeDesc { get; set; }

    public bool Enabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_PMSDataType_Sys")]
public class Const_PMSDataType_Sys
{
    [Key]
    public int DataType_ID { get; set; } = 0;

    public string? DataTypeName { get; set; }

    public string? DataTypeDesc { get; set; }

    public bool DataTypeEnabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_PMSDepartmentNKPAWeighting_Detail")]
public class Const_PMSDepartmentNKPAWeighting_Detail
{
    [Key]
    public int DepartmentNKPAWeightingDetail_ID { get; set; } = 0;

    public int DepartmentNKPAWeightingHeaderID { get; set; }

    public int NationalKPADetailID { get; set; }

    public decimal Weighting { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_PMSDepartmentNKPAWeighting_Header")]
public class Const_PMSDepartmentNKPAWeighting_Header
{
    [Key]
    public int DepartmentNKPAWeightingHeader_ID { get; set; } = 0;

    public string? FinancialYear { get; set; }

    public int DepartmentID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_PMSIndicatorCustomField_Detail")]
public class Const_PMSIndicatorCustomField_Detail
{
    [Key]
    public int CustomFieldDetail_ID { get; set; } = 0;

    public int CustomFieldHeaderID { get; set; }

    public int DataTypeID { get; set; }

    public string? CustomFieldDesc { get; set; }

    public int CustomFieldOrderID { get; set; }

    public bool CustomFieldEnabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_PMSIndicatorCustomField_Header")]
public class Const_PMSIndicatorCustomField_Header
{
    [Key]
    public int CustomFieldHeader_ID { get; set; } = 0;

    public string? FinancialYear { get; set; }

    public bool CustomFieldSubmitted { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_PMSIndicatorProgress")]
public class Const_PMSIndicatorProgress
{
    [Key]
    public int Progress_ID { get; set; } = 0;

    public string? ProgressDesc { get; set; }

    public bool ProgressEnabled { get; set; }

    public int ProgressDisplayOrder { get; set; }

    public bool ProgressTargetExceeded { get; set; }

    public bool ProgressTargetMet { get; set; }

    public int ProgressColourR { get; set; }

    public int ProgressColourG { get; set; }

    public int ProgressColourB { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public string? ProgressDescFull { get; set; }
}

[Table("Const_PMSIndicatorQuarterlySubmissionDeadline")]
public class Const_PMSIndicatorQuarterlySubmissionDeadline
{
    [Key]
    public int KpiSubmissionDeadline_ID { get; set; } = 0;

    public string? FinancialYear { get; set; }

    public DateTime ResponsiblePostDeadlineQ1 { get; set; } = DateTime.UtcNow;

    public DateTime ResponsiblePostDeadlineQ2 { get; set; } = DateTime.UtcNow;

    public DateTime ResponsiblePostDeadlineQ3 { get; set; } = DateTime.UtcNow;

    public DateTime ResponsiblePostDeadlineQ4 { get; set; } = DateTime.UtcNow;

    public DateTime CustodianPostDeadlineQ1 { get; set; } = DateTime.UtcNow;

    public DateTime CustodianPostDeadlineQ2 { get; set; } = DateTime.UtcNow;

    public DateTime CustodianPostDeadlineQ3 { get; set; } = DateTime.UtcNow;

    public DateTime CustodianPostDeadlineQ4 { get; set; } = DateTime.UtcNow;

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_PMSIndicatorUnitMeasure")]
public class Const_PMSIndicatorUnitMeasure
{
    [Key]
    public int UnitMeasure_ID { get; set; } = 0;

    public int DataTypeID { get; set; }

    public string? UnitMeasureDesc { get; set; }

    public bool UnitMeasureEnabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_PMSMidYearField_Detail")]
public class Const_PMSMidYearField_Detail
{
    [Key]
    public int MidYearFieldDetail_ID { get; set; } = 0;

    public int MidYearFieldHeaderID { get; set; }

    public int DataTypeID { get; set; }

    public string? MidYearFieldDesc { get; set; }

    public int MidYearFieldOrderID { get; set; }

    public bool MidYearFieldEnabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_PMSMidYearField_Header")]
public class Const_PMSMidYearField_Header
{
    [Key]
    public int MidYearFieldHeader_ID { get; set; } = 0;

    public string? FinancialYear { get; set; }

    public bool MidYearFieldSubmitted { get; set; }

    public DateTime DataCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_PMSOrganisationNKPAWeighting_Detail")]
public class Const_PMSOrganisationNKPAWeighting_Detail
{
    [Key]
    public int OrganisationNKPAWeightingDetail_ID { get; set; } = 0;

    public int OrganisationNKPAWeightingHeaderID { get; set; }

    public int NationalKPADetailID { get; set; }

    public decimal Weighting { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_PMSOrganisationNKPAWeighting_Header")]
public class Const_PMSOrganisationNKPAWeighting_Header
{
    [Key]
    public int OrganisationNKPAWeightingHeader_ID { get; set; } = 0;

    public string? FinancialYear { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_PMSPostCoreCompetencyRequirement_Detail")]
public class Const_PMSPostCoreCompetencyRequirement_Detail
{
    [Key]
    public int PostCoreCompetencyRequirementDetail_ID { get; set; } = 0;

    public int PostCoreCompetencyRequirementHeaderID { get; set; }

    public int CoreCompetencyRequirementID { get; set; }

    public decimal Weighting { get; set; }

    public bool Assigned { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_PMSPostCoreCompetencyRequirement_Header")]
public class Const_PMSPostCoreCompetencyRequirement_Header
{
    [Key]
    public int PostCoreCompetencyRequirementHeader_ID { get; set; } = 0;

    public int JobProfileID { get; set; }

    public bool Submitted { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_PMSScorecardType")]
public class Const_PMSScorecardType
{
    [Key]
    public int ScorecardType_ID { get; set; } = 0;

    public string? ScorecardTypeDesc { get; set; }

    public bool ScorecardTypeEnabled { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Const_SCOA_Costing_Structure")]
public class Const_SCOA_Costing_Structure
{
    [Key]
    public int ScoaID { get; set; } = 0;

    public string? ScoaCode { get; set; }

    public int? LevelID { get; set; }

    public string? PostingLevel { get; set; }

    public string? BreakDownAllowed { get; set; }

    public string? ScoaDesc { get; set; }

    public string? ScoaShortDesc { get; set; }

    public int? ScoaParentID { get; set; }

    public int? ParentID { get; set; }

    public string? NTVatStatus { get; set; }

    public string? NTSCOAFile { get; set; }

    public string? NTScoaLevel { get; set; }

    public string? NTExcelRowNumber { get; set; }

    public string? NTPrinciple { get; set; }

    public string? NTApplicableTo { get; set; }

    public string? NTPostingLevelDescription { get; set; }

    public string? NTScoaID { get; set; }

    public string? NTParentScoaId { get; set; }

    public bool Enabled { get; set; }

    public string? Version { get; set; }

    public string? NTGFSCode { get; set; }
}

[Table("Const_SCOA_Function_Structure")]
public class Const_SCOA_Function_Structure
{
    [Key]
    public int ScoaID { get; set; } = 0;

    public string? ScoaCode { get; set; }

    public int? LevelID { get; set; }

    public string? PostingLevel { get; set; }

    public string? BreakDownAllowed { get; set; }

    public string? ScoaDesc { get; set; }

    public string? ScoaShortDesc { get; set; }

    public int? ScoaParentID { get; set; }

    public int? ParentID { get; set; }

    public string? NTVatStatus { get; set; }

    public string? NTSCOAFile { get; set; }

    public string? NTScoaLevel { get; set; }

    public string? NTExcelRowNumber { get; set; }

    public string? NTPrinciple { get; set; }

    public string? NTApplicableTo { get; set; }

    public string? NTPostingLevelDescription { get; set; }

    public string? NTScoaID { get; set; }

    public string? NTParentScoaId { get; set; }

    public bool Enabled { get; set; }

    public string? Version { get; set; }

    public string? NTGFSCode { get; set; }
}

[Table("Const_SCOA_Funds_Structure")]
public class Const_SCOA_Funds_Structure
{
    [Key]
    public int ScoaID { get; set; } = 0;

    public string? ScoaCode { get; set; }

    public int? LevelID { get; set; }

    public string? PostingLevel { get; set; }

    public string? BreakDownAllowed { get; set; }

    public string? ScoaDesc { get; set; }

    public string? ScoaShortDesc { get; set; }

    public int? ScoaParentID { get; set; }

    public int? ParentID { get; set; }

    public string? NTVatStatus { get; set; }

    public string? NTSCOAFile { get; set; }

    public string? NTScoaLevel { get; set; }

    public string? NTExcelRowNumber { get; set; }

    public string? NTPrinciple { get; set; }

    public string? NTApplicableTo { get; set; }

    public string? NTPostingLevelDescription { get; set; }

    public string? NTScoaID { get; set; }

    public string? NTParentScoaId { get; set; }

    public bool Enabled { get; set; }

    public string? Version { get; set; }

    public string? NTGFSCode { get; set; }
}

[Table("Const_SCOA_Project_Structure")]
public class Const_SCOA_Project_Structure
{
    [Key]
    public int ScoaID { get; set; } = 0;

    public string? ScoaCode { get; set; }

    public int? LevelID { get; set; }

    public string? PostingLevel { get; set; }

    public string? BreakDownAllowed { get; set; }

    public string? ScoaDesc { get; set; }

    public string? ScoaShortDesc { get; set; }

    public int? ScoaParentID { get; set; }

    public int? ParentID { get; set; }

    public string? NTVatStatus { get; set; }

    public string? NTSCOAFile { get; set; }

    public string? NTScoaLevel { get; set; }

    public string? NTExcelRowNumber { get; set; }

    public string? NTPrinciple { get; set; }

    public string? NTApplicableTo { get; set; }

    public string? NTPostingLevelDescription { get; set; }

    public string? NTScoaID { get; set; }

    public string? NTParentScoaId { get; set; }

    public bool Enabled { get; set; }

    public string? Version { get; set; }

    public string? NTGFSCode { get; set; }
}

[Table("Const_SCOA_Regional_Structure")]
public class Const_SCOA_Regional_Structure
{
    [Key]
    public int ScoaID { get; set; } = 0;

    public string? ScoaCode { get; set; }

    public int? LevelID { get; set; }

    public string? PostingLevel { get; set; }

    public string? BreakDownAllowed { get; set; }

    public string? ScoaDesc { get; set; }

    public string? ScoaShortDesc { get; set; }

    public int? ScoaParentID { get; set; }

    public int? ParentID { get; set; }

    public string? NTVatStatus { get; set; }

    public string? NTSCOAFile { get; set; }

    public string? NTScoaLevel { get; set; }

    public string? NTExcelRowNumber { get; set; }

    public string? NTPrinciple { get; set; }

    public string? NTApplicableTo { get; set; }

    public string? NTPostingLevelDescription { get; set; }

    public string? NTScoaID { get; set; }

    public string? NTParentScoaId { get; set; }

    public bool Enabled { get; set; }

    public string? Version { get; set; }

    public string? NTGFSCode { get; set; }
}

[Table("Const_SCOA_Structure")]
public class Const_SCOA_Structure
{
    [Key]
    public int ScoaID { get; set; } = 0;

    public string? ScoaCode { get; set; }

    public int? LevelID { get; set; }

    public int? TableID { get; set; }

    public string? TableName { get; set; }

    public string? PostingLevel { get; set; }

    public string? BreakDownAllowed { get; set; }

    public string? ScoaDesc { get; set; }

    public string? ScoaShortDesc { get; set; }

    public int? ScoaParentID { get; set; }

    public int? VoteTypeID { get; set; }

    public int? DebitCreditID { get; set; }

    public int? VatIndicatorID { get; set; }

    public int? VatApportionment { get; set; }

    public int? CapitalTimePeriodID { get; set; }

    public bool? IsCapexVote { get; set; }

    public bool? IsControlVote { get; set; }

    public int? ParentID { get; set; }

    public string? NTVatStatus { get; set; }

    public string? NTSCOAFile { get; set; }

    public string? NTScoaLevel { get; set; }

    public string? NTExcelRowNumber { get; set; }

    public string? NTPrinciple { get; set; }

    public string? NTApplicableTo { get; set; }

    public string? NTPostingLevelDescription { get; set; }

    public string? NTScoaID { get; set; }

    public string? NTParentScoaId { get; set; }

    public string? DefinitionDescription { get; set; }

    public bool Enabled { get; set; }

    public string? Version { get; set; }

    public string? NTGFSCode { get; set; }
}
