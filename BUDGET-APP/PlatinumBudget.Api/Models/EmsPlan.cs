using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumBudget.Api.Models;

[Table("Plan_Activity")]
public class Plan_Activity
{
    [Key]
    public int Activity_ID { get; set; } = 0;

    public int IDPItemID { get; set; }

    public string? ActivityDesc { get; set; }

    public int ActivityStatusID { get; set; }

    public DateTime ActivityStartDate { get; set; } = DateTime.UtcNow;

    public DateTime ActivityEndDate { get; set; } = DateTime.UtcNow;

    public int ResponsiblePersonID { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ItemID { get; set; }

    public int? DivisionID { get; set; }
}

[Table("Plan_ActivityProgress")]
public class Plan_ActivityProgress
{
    [Key]
    public int ActivityProgress_ID { get; set; } = 0;

    public int ActivityID { get; set; }

    public decimal ProgressPercent { get; set; }

    public string? ProgressComment { get; set; }

    public DateTime ProgressCaptureDate { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Plan_AdjBudgetTemp")]
public class Plan_AdjBudgetTemp
{
    [Key]
    public int? IDCount { get; set; } = 0;

    public int? ProjectID { get; set; }

    public int? DivisionID { get; set; }

    public string? SingleMulti { get; set; }

    public string? DebitCredit { get; set; }

    public int? CapitalOperational { get; set; }

    public string? ScoaItem { get; set; }

    public string? ScoaFund { get; set; }

    public string? ScoaFunction { get; set; }

    public string? ScoaCosting { get; set; }

    public string? ScoaProject { get; set; }

    public string? ScoaRegion { get; set; }

    public int? AdjustmentTypeID { get; set; }

    public decimal? BudgetMonth1 { get; set; }

    public decimal? BudgetMonth2 { get; set; }

    public decimal? BudgetMonth3 { get; set; }

    public decimal? BudgetMonth4 { get; set; }

    public decimal? BudgetMonth5 { get; set; }

    public decimal? BudgetMonth6 { get; set; }

    public decimal? BudgetMonth7 { get; set; }

    public decimal? BudgetMonth8 { get; set; }

    public decimal? BudgetMonth9 { get; set; }

    public decimal? BudgetMonth10 { get; set; }

    public decimal? BudgetMonth11 { get; set; }

    public decimal? BudgetMonth12 { get; set; }

    public decimal? BudgetY1 { get; set; }

    public decimal? BudgetY2 { get; set; }

    public decimal? BudgetY3 { get; set; }

    public int? PlanProjectItemId { get; set; }

    public string? ProjectName { get; set; }

    public int? IDCountItem { get; set; }
}

[Table("Plan_Adjustment")]
public class Plan_Adjustment
{
    [Key]
    public int AdjustmentBudget_Id { get; set; } = 0;

    public string? FinYear { get; set; }

    public int FromProjectId { get; set; }

    public int ToProjectId { get; set; }

    public int? FromSCOAProjectID { get; set; }

    public int? ToSCOAProjectID { get; set; }

    public int? FromSCOAFunctionId { get; set; }

    public int? ToSCOAFunctionId { get; set; }

    public int? FromDivisionId { get; set; }

    public int? ToDivisionId { get; set; }

    public int? FromSCOAFundID { get; set; }

    public int? ToSCOAFundID { get; set; }

    public int? FromSCOARegion { get; set; }

    public int? ToSCOARegion { get; set; }

    public int? FromSCOAItem { get; set; }

    public int? ToSCOAItem { get; set; }

    public int? ReasonForAdjustment { get; set; }

    public int TypeOfAdjustment { get; set; }

    public decimal? FromAvailableFund { get; set; }

    public decimal? FromAdjustmentAmount { get; set; }

    public decimal? FromNewAvailableBudget { get; set; }

    public decimal? ToAvailableFund { get; set; }

    public decimal? ToAdjustmentAmount { get; set; }

    public decimal? ToNewAvailableBudget { get; set; }

    public string? AdjustmentReferenceNumber { get; set; }

    public int? VersionNumber { get; set; }

    public int? Status { get; set; }

    public int TransferBy { get; set; }

    public DateTime TransferOn { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? FromCapitalOperation { get; set; }

    public int? ToCapitalOperation { get; set; }
}

[Table("Plan_AdjustmentApprovalRejections")]
public class Plan_AdjustmentApprovalRejections
{
    [Key]
    public int AdjustmentApprovalRejectionId { get; set; } = 0;

    public int? AdjustmentBudgetId { get; set; }

    public bool? IsApproved { get; set; }

    public int? ApprovedBy { get; set; }

    public DateTime? ApprovedOn { get; set; }

    public string? ApprovalRejectionFileName { get; set; }

    public bool? IsRejected { get; set; }

    public string? RejectReason { get; set; }

    public int? RejectedBy { get; set; }

    public DateTime? RejectedOn { get; set; }

    public int? CapturerID { get; set; }

    public DateTime? DateCaptured { get; set; }

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Plan_AdjustmentBudgetApproval")]
public class Plan_AdjustmentBudgetApproval
{
    [Key]
    public int AdjustmentBudgetApproval_Id { get; set; } = 0;

    public string? FinancialYear { get; set; }

    public bool? IsInitializeAdjustmentBudget { get; set; }

    public string? ApprovedAdjustmentBudgetFileName { get; set; }

    public int ApprovedBy { get; set; }

    public DateTime ApprovedDate { get; set; } = DateTime.UtcNow;

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public DateTime? CouncilApprovedDate { get; set; }

    public int? AdjustmentVersionId { get; set; }

    public int? AdjustmentFundingVersionId { get; set; }

    public bool? IsCouncilApproved { get; set; }
}

[Table("Plan_AdjustmentBudgetPolicyApproval")]
public class Plan_AdjustmentBudgetPolicyApproval
{
    [Key]
    public int AdjustmentBudgetPolicyApproval_Id { get; set; } = 0;

    public string? FinancialYear { get; set; }

    public bool? IsApprovedAdjustmentBudgetPolicy { get; set; }

    public string? ApprovedAdjustmentBudgetPolicyFileName { get; set; }

    public int ApprovedBy { get; set; }

    public DateTime ApprovedDate { get; set; } = DateTime.UtcNow;

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public int? AdjustmentVersionId { get; set; }

    public int? AdjustmentFundingVersionId { get; set; }

    public bool? IsAdjustmentFinalApproved { get; set; }
}

[Table("Plan_AdjustmentBudgetVersion")]
public class Plan_AdjustmentBudgetVersion
{
    [Key]
    public int AdjustmentBudgetVersion_ID { get; set; } = 0;

    public string? VersionNumber { get; set; }

    public string? VersionName { get; set; }

    public string? Comments { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;
}

[Table("Plan_AdjustmentBudgetVersionDetail")]
public class Plan_AdjustmentBudgetVersionDetail
{
    [Key]
    public int AdjustmentBudgetVersionDetail_ID { get; set; } = 0;

    public int AdjustmentBudgetVersionID { get; set; }

    public int ProjectID { get; set; }

    public string? FinYear { get; set; }

    public int IDPItemID { get; set; }

    public int CapitalOperation { get; set; }

    public int ScoaProjectID { get; set; }

    public int SCOACostingID { get; set; }

    public int? ProjectTypeID { get; set; }

    public int PlanProjectItemID { get; set; }

    public int? ProjectItemID { get; set; }

    public int SCOAItemID { get; set; }

    public int SCOAFundId { get; set; }

    public decimal? BudgetAmount { get; set; }

    public decimal? BudgetAmountCurP1 { get; set; }

    public decimal? BudgetAmountCurP2 { get; set; }

    public int SCOAFunctionId { get; set; }

    public int SCOARegionId { get; set; }

    public int DivisionId { get; set; }

    public int? BudgetSplitID { get; set; }

    public int? VirementId { get; set; }

    public int? AdjustmentId { get; set; }

    public int? ModificationNumber { get; set; }

    public bool? IsItemLocked { get; set; }

    public string? CreditDebit { get; set; }

    public int? AdjutmentType { get; set; }

    public int? LegislativeReasonAdjustment { get; set; }

    public string? ReasonForAdjustment { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public string? GRAPClassification { get; set; }

    public string? GRAPClassificationNote { get; set; }

    public string? MainSegmentReporting { get; set; }

    public string? SubSegmentReporting { get; set; }

    public bool? CostingProject { get; set; }
}

[Table("Plan_AdjustmentBudgetVersionMonths")]
public class Plan_AdjustmentBudgetVersionMonths
{
    [Key]
    public int AdjustmentBudgetVersionMonth_ID { get; set; } = 0;

    public int AdjustmentBudgetVersionID { get; set; }

    public int? AdjustmentProjectItemMonth_ID { get; set; }

    public int PlanAdjustmentProjectItemID { get; set; }

    public int MonthID { get; set; }

    public decimal UnitQuantity { get; set; }

    public decimal UnitPrice { get; set; }

    public int CaptureID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? VirementId { get; set; }

    public int? AdjustmentId { get; set; }
}

[Table("Plan_AdjustmentFundingBudgetVersion")]
public class Plan_AdjustmentFundingBudgetVersion
{
    [Key]
    public int AdjustmentFundingBudgetVersion_ID { get; set; } = 0;

    public string? VersionNumber { get; set; }

    public string? VersionName { get; set; }

    public string? Comments { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;
}

[Table("Plan_AdjustmentFundingBudgetVersionDetails")]
public class Plan_AdjustmentFundingBudgetVersionDetails
{
    [Key]
    public int AdjustmentFundingBudgetVersionDetail_Id { get; set; } = 0;

    public int AdjustmentFundingBudgetVersionId { get; set; }

    public int AdjustmentFundingSourceBudgetDetail_ID { get; set; }

    public int AdjustmentFundingSourceBudgetHeaderID { get; set; }

    public string? FinancialYear { get; set; }

    public int? FundingSourceID { get; set; }

    public int ScoaID { get; set; }

    public decimal FundingSourceBudget { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public string? UploadedDocument { get; set; }
}

[Table("Plan_AdjustmentFundingSourceBudget_Detail")]
public class Plan_AdjustmentFundingSourceBudget_Detail
{
    [Key]
    public int AdjustmentFundingSourceBudgetDetail_ID { get; set; } = 0;

    public int AdjustmentFundingSourceBudgetHeaderID { get; set; }

    public int? AdjustmentFundingSourceID { get; set; }

    public int ScoaID { get; set; }

    public decimal FundingSourceBudget { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public bool? IsHidden { get; set; }

    public string? UploadedDocument { get; set; }

    public int? RefFundingSourceDetailId { get; set; }

    public int? AdjustmentFundingVersionId { get; set; }
}

[Table("Plan_AdjustmentFundingSourceBudget_Header")]
public class Plan_AdjustmentFundingSourceBudget_Header
{
    [Key]
    public int AdjustmentFundingSourceBudgetHeader_ID { get; set; } = 0;

    public string? FinancialYear { get; set; }

    public bool Submitted { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public int? RefFundingSourceHeaderId { get; set; }

    public int? AdjustmentFundingVersionId { get; set; }
}

[Table("Plan_AdjustmentFundingSourceChanges")]
public class Plan_AdjustmentFundingSourceChanges
{
    [Key]
    public int PlanAdjustmentFundingSourceChange_ID { get; set; } = 0;

    public int AdjustmentFundingSourceDetailsID { get; set; }

    public int FundSourceChangeID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }
}

[Table("Plan_AdjustmentFundingSourceDocs")]
public class Plan_AdjustmentFundingSourceDocs
{
    [Key]
    public int AdjustmentFundingSourceDocs_ID { get; set; } = 0;

    public int? SupportingDocsID { get; set; }

    public int? AdjustmentFundingSourceBudgetDetailID { get; set; }

    public int? ScoaID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public int? RefFundingSourceDocsID { get; set; }

    public int? AdjustmentFundingVersionId { get; set; }
}

[Table("Plan_AdjustmentPolicyApproval")]
public class Plan_AdjustmentPolicyApproval
{
    [Key]
    public int AdjustmentPolicyApproval_Id { get; set; } = 0;

    public string? FinancialYear { get; set; }

    public bool? IsApprovedAdjustmentPolicy { get; set; }

    public string? ApprovedAdjustmentPolicyFileName { get; set; }

    public int ApprovedBy { get; set; }

    public DateTime ApprovedDate { get; set; } = DateTime.UtcNow;

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Plan_AdjustmentProject")]
public class Plan_AdjustmentProject
{
    [Key]
    public int AdjustmentProject_ID { get; set; } = 0;

    public int? ReferenceProject_ID { get; set; }

    public string? AdjustmentProjectName { get; set; }

    public string? AdjustmentProjectDesc { get; set; }

    public int? ProjectManagerID { get; set; }

    public int? SupplyChainOfficialID { get; set; }

    public int? CapitalOperation { get; set; }

    public decimal CostEstimate { get; set; }

    public int ScoaProjectID { get; set; }

    public DateTime? EstimatedStartDate { get; set; }

    public DateTime? EstimatedEndDate { get; set; }

    public int ProjectStatus { get; set; }

    public DateTime? CommencementDate { get; set; }

    public string? FinYear { get; set; }

    public string? ProjectDetailDesc { get; set; }

    public int? ProjectCategoryID { get; set; }

    public int? ProjectImplementAgentID { get; set; }

    public string? Longitude { get; set; }

    public string? Latitude { get; set; }

    public int? ProgrammeManagerID { get; set; }

    public int? FinancialControllerID { get; set; }

    public int? ProjectTypeID { get; set; }

    public int? EstimatedDuration { get; set; }

    public int? ProjectDistinctionID { get; set; }

    public bool? IsDeleted { get; set; }

    public string? HistoricalProjectCode { get; set; }

    public int? ProjectParentID { get; set; }

    public string? SingleMultiYear { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? AdjustmentVersionId { get; set; }

    public bool? IsRecommended { get; set; }

    public int? ProjectCode { get; set; }

    public bool? CostingProject { get; set; }
}

[Table("Plan_AdjustmentProjectCosting")]
public class Plan_AdjustmentProjectCosting
{
    [Key]
    public int AdjustmentProjectCosting_ID { get; set; } = 0;

    public int? ReferenceProjectCostingID { get; set; }

    public int AdjustmentProjectID { get; set; }

    public int ScoaCostingID { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? AdjustmentVersionId { get; set; }
}

[Table("Plan_AdjustmentProjectDivisions")]
public class Plan_AdjustmentProjectDivisions
{
    [Key]
    public int AdjustmentProjectDivision_ID { get; set; } = 0;

    public int? ReferenceProjectDivisionID { get; set; }

    public int AdjustmentProjectID { get; set; }

    public int DivisionID { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? AdjustmentVersionId { get; set; }
}

[Table("Plan_AdjustmentProjectFunctions")]
public class Plan_AdjustmentProjectFunctions
{
    [Key]
    public int AdjustmentProjectFunction_ID { get; set; } = 0;

    public int? ReferenceProjectFunctionID { get; set; }

    public int AdjustmentProjectID { get; set; }

    public int ScoaFunctionID { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? AdjustmentVersionId { get; set; }
}

[Table("Plan_AdjustmentProjectFund")]
public class Plan_AdjustmentProjectFund
{
    [Key]
    public int AdjustmentProjectFund_ID { get; set; } = 0;

    public int? ReferenceProjectFundID { get; set; }

    public int AdjustmentProjectID { get; set; }

    public int ScoaFundID { get; set; }

    public decimal? FundAmount { get; set; }

    public string? FundReference { get; set; }

    public int? VirementId { get; set; }

    public int? AdjustmentId { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? AdjustmentVersionId { get; set; }
}

[Table("Plan_AdjustmentProjectFundYear")]
public class Plan_AdjustmentProjectFundYear
{
    [Key]
    public int AdjustmentProjectFundYear_ID { get; set; } = 0;

    public int? ReferenceProjectFundYearID { get; set; }

    public int AdjustmentProjectFundID { get; set; }

    public string? FinYear { get; set; }

    public decimal YearFundAmount { get; set; }

    public int? VirementId { get; set; }

    public int? AdjustmentId { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? AdjustmentVersionId { get; set; }
}

[Table("Plan_AdjustmentProjectIDP")]
public class Plan_AdjustmentProjectIDP
{
    [Key]
    public int AdjustmentProjectIDP_ID { get; set; } = 0;

    public int? ReferenceProjectIDPID { get; set; }

    public int AdjustmentProjectID { get; set; }

    public int ParentIDPItemID { get; set; }

    public int AdjustmentProjectIDPItemID { get; set; }

    public decimal Percentage { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public int? AdjustmentVersionId { get; set; }
}

[Table("Plan_AdjustmentProjectItem")]
public class Plan_AdjustmentProjectItem
{
    [Key]
    public int PlanAdjustmentProjectItem_ID { get; set; } = 0;

    public int? ReferencePlanProjectItem_ID { get; set; }

    public int AdjustmentProjectID { get; set; }

    public int? ProjectItemID { get; set; }

    public int SCOAItemID { get; set; }

    public string? FinYear { get; set; }

    public int? ProjectFundYearID { get; set; }

    public int? SCOAFundId { get; set; }

    public decimal? BudgetAmount { get; set; }

    public decimal? BudgetAmountCurP1 { get; set; }

    public decimal? BudgetAmountCurP2 { get; set; }

    public decimal? AdjustedBudgetAmount { get; set; }

    public decimal? AdjustedBudgetAmountCurP1 { get; set; }

    public decimal? AdjustedBudgetAmountCurP2 { get; set; }

    public int? SCOAFunctionId { get; set; }

    public int? SCOARegionId { get; set; }

    public int? DivisionId { get; set; }

    public int? BudgetSplitID { get; set; }

    public int? VirementId { get; set; }

    public string? HistoricalProjectCode { get; set; }

    public int? AdjustmentId { get; set; }

    public int? ModificationNumber { get; set; }

    public int? SCOACostingID { get; set; }

    public bool? IsItemLocked { get; set; }

    public string? CreditDebit { get; set; }

    public int? AdjutmentType { get; set; }

    public int? LegislativeReasonAdjustment { get; set; }

    public string? ReasonForAdjustment { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? AdjustmentVersionId { get; set; }

    public string? GRAPClassification { get; set; }

    public string? GRAPClassificationNote { get; set; }

    public string? MainSegmentReporting { get; set; }

    public string? SubSegmentReporting { get; set; }

    public bool? IsActiveForSCM { get; set; }
}

[Table("Plan_AdjustmentProjectItemDocs")]
public class Plan_AdjustmentProjectItemDocs
{
    [Key]
    public int AdjustmentProjectItemDocs_ID { get; set; } = 0;

    public int? ReferenceProjectItemDocsID { get; set; }

    public int? SupportingDocsID { get; set; }

    public int? PlanAdjustmentProjectItemID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public int? AdjustmentVersionId { get; set; }
}

[Table("Plan_AdjustmentProjectItemMonth")]
public class Plan_AdjustmentProjectItemMonth
{
    [Key]
    public int AdjustmentProjectItemMonth_ID { get; set; } = 0;

    public int? ReferenceProjectItemMonthID { get; set; }

    public int PlanAdjustmentProjectItemID { get; set; }

    public int MonthID { get; set; }

    public decimal UnitQuantity { get; set; }

    public decimal UnitPrice { get; set; }

    public int CaptureID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? VirementId { get; set; }

    public int? AdjustmentId { get; set; }

    public int? AdjustmentVersionId { get; set; }

    public decimal? AdjustedUnitPrice { get; set; }
}

[Table("Plan_AdjustmentProjectRecommendation")]
public class Plan_AdjustmentProjectRecommendation
{
    [Key]
    public int AdjustmentProjectRecommendation_Id { get; set; } = 0;

    public int? AdjustmentProjectId { get; set; }

    public bool? IsRecommend { get; set; }

    public int? RecommendBy { get; set; }

    public DateTime? RecommendOn { get; set; }

    public bool? IsRejected { get; set; }

    public string? RejectReason { get; set; }

    public int? RejectedBy { get; set; }

    public DateTime? RejectedOn { get; set; }

    public int? CapturerID { get; set; }

    public DateTime? DateCaptured { get; set; }

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? AdjustmentVersionId { get; set; }
}

[Table("Plan_AdjustmentProjectRecommendUsers")]
public class Plan_AdjustmentProjectRecommendUsers
{
    [Key]
    public int AdjustmentProjectRecommendUser_Id { get; set; } = 0;

    public int? AdjustmentProjectId { get; set; }

    public int? UserId { get; set; }

    public int? CapturerID { get; set; }

    public DateTime? DateCaptured { get; set; }

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? AdjustmentVersionId { get; set; }
}

[Table("Plan_AdjustmentProjectRegions")]
public class Plan_AdjustmentProjectRegions
{
    [Key]
    public int AdjustmentProjectRegion_ID { get; set; } = 0;

    public int? ReferenceProjectRegionID { get; set; }

    public int AdjustmentProjectID { get; set; }

    public int ScoaRegionID { get; set; }

    public decimal? RegionPercent { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? AdjustmentVersionId { get; set; }
}

[Table("Plan_AdjustmentTrackChanges")]
public class Plan_AdjustmentTrackChanges
{
    [Key]
    public int AdjustmentTrackChanges_ID { get; set; } = 0;

    public int? AdjustmentPlanProjectItem_ID { get; set; }

    public int AdjustmentProjectID { get; set; }

    public string? FinYear { get; set; }

    public int? ProjectItemID { get; set; }

    public int? SCOAItemID { get; set; }

    public int? SCOAFunctionId { get; set; }

    public int? SCOAFundId { get; set; }

    public int? SCOARegionId { get; set; }

    public int? DivisionId { get; set; }

    public decimal? OriginalBudgetAmount { get; set; }

    public decimal? OriginalBudgetAmountCurP1 { get; set; }

    public decimal? OriginalBudgetAmountCurP2 { get; set; }

    public decimal? RevisedBudgetAmount { get; set; }

    public decimal? RevisedBudgetAmountCurP1 { get; set; }

    public decimal? RevisedBudgetAmountCurP2 { get; set; }

    public string? Comment { get; set; }

    public string? CommentFor { get; set; }

    public bool? IsProjectDeleted { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Plan_BudgetAdjustmentExportImportVersion_Header")]
public class Plan_BudgetAdjustmentExportImportVersion_Header
{
    [Key]
    public int BudgetAdjustmentExportImportVersionHeader_ID { get; set; } = 0;

    public string? BudgetAdjustmentExportImportVersionFileName { get; set; }

    public string? FinYear { get; set; }

    public int AdjustmentVersionID { get; set; }

    public int StatusID { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public bool? IsProjectRegistered { get; set; }
}

[Table("Plan_BudgetAdjustmentExportVersion_Detail")]
public class Plan_BudgetAdjustmentExportVersion_Detail
{
    [Key]
    public int BudgetAdjustmentExportVersionDetail_ID { get; set; } = 0;

    public int BudgetAdjustmentExportImportVersionHeaderID { get; set; }

    public string? FinYear1 { get; set; }

    public string? FinYear2 { get; set; }

    public string? FinYear3 { get; set; }

    public int AdjustmentVersionID { get; set; }

    public int AdjustmentProjectID { get; set; }

    public string? IDPItem { get; set; }

    public int? ProjectID { get; set; }

    public int? ProjectCode { get; set; }

    public string? ProjectName { get; set; }

    public string? ProjectDesc { get; set; }

    public string? SingleMultiYear { get; set; }

    public int? PlanProjectItemID { get; set; }

    public string? BudgetType { get; set; }

    public string? SCOAProjectCode { get; set; }

    public string? SCOAProject { get; set; }

    public string? SCOAFunctionCode { get; set; }

    public string? SCOAFunction { get; set; }

    public string? MSCDepartmentCode { get; set; }

    public string? MSCDepartment { get; set; }

    public string? MSCDivisionCode { get; set; }

    public string? MSCDivision { get; set; }

    public string? MunicipalClassification { get; set; }

    public string? SCOAFundCode { get; set; }

    public string? SCOAFund { get; set; }

    public string? SCOARegionCode { get; set; }

    public string? SCOARegion { get; set; }

    public string? SCOACostingCode { get; set; }

    public string? SCOACosting { get; set; }

    public string? SCOAItemCode { get; set; }

    public string? SCOAItem { get; set; }

    public string? ItemDescription { get; set; }

    public decimal CurrentBudgetFinYear1 { get; set; }

    public decimal CurrentBudgetFinYear2 { get; set; }

    public decimal CurrentBudgetFinYear3 { get; set; }

    public decimal AvailableBudgetFinYear1 { get; set; }

    public string? SplitType { get; set; }

    public decimal M1 { get; set; }

    public decimal M2 { get; set; }

    public decimal M3 { get; set; }

    public decimal M4 { get; set; }

    public decimal M5 { get; set; }

    public decimal M6 { get; set; }

    public decimal M7 { get; set; }

    public decimal M8 { get; set; }

    public decimal M9 { get; set; }

    public decimal M10 { get; set; }

    public decimal M11 { get; set; }

    public decimal M12 { get; set; }

    public string? CreditDebit { get; set; }

    public string? AdjustmentType { get; set; }

    public string? LegislativeAdjustmentReason { get; set; }

    public string? ReasonForAdjustment { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public string? GRAPClassification { get; set; }

    public string? GRAPClassificationNote { get; set; }

    public string? MainSegmentReporting { get; set; }

    public string? SubSegmentReporting { get; set; }

    public bool? CostingProject { get; set; }
}

[Table("Plan_BudgetAdjustmentImportVersion_Detail")]
public class Plan_BudgetAdjustmentImportVersion_Detail
{
    [Key]
    public int BudgetAdjustmentImportVersionDetail_ID { get; set; } = 0;

    public int BudgetAdjustmentExportImportVersionHeaderID { get; set; }

    public int BudgetAdjustmentImportVersionNumber { get; set; }

    public string? FinYear1 { get; set; }

    public string? FinYear2 { get; set; }

    public string? FinYear3 { get; set; }

    public int AdjustmentVersionID { get; set; }

    public int AdjustmentProjectID { get; set; }

    public string? IDPItem { get; set; }

    public int? ProjectID { get; set; }

    public int? ProjectCode { get; set; }

    public string? ProjectName { get; set; }

    public string? ProjectDesc { get; set; }

    public string? SingleMultiYear { get; set; }

    public int? PlanProjectItemID { get; set; }

    public string? BudgetType { get; set; }

    public string? SCOAProjectCode { get; set; }

    public string? SCOAProject { get; set; }

    public string? SCOAFunctionCode { get; set; }

    public string? SCOAFunction { get; set; }

    public string? MSCDepartmentCode { get; set; }

    public string? MSCDepartment { get; set; }

    public string? MSCDivisionCode { get; set; }

    public string? MSCDivision { get; set; }

    public string? MunicipalClassification { get; set; }

    public string? SCOAFundCode { get; set; }

    public string? SCOAFund { get; set; }

    public string? SCOARegionCode { get; set; }

    public string? SCOARegion { get; set; }

    public string? SCOACostingCode { get; set; }

    public string? SCOACosting { get; set; }

    public string? SCOAItemCode { get; set; }

    public string? SCOAItem { get; set; }

    public string? ItemDescription { get; set; }

    public decimal CurrentBudgetFinYear1 { get; set; }

    public decimal CurrentBudgetFinYear2 { get; set; }

    public decimal CurrentBudgetFinYear3 { get; set; }

    public decimal AvailableBudgetFinYear1 { get; set; }

    public string? SplitType { get; set; }

    public decimal M1 { get; set; }

    public decimal M2 { get; set; }

    public decimal M3 { get; set; }

    public decimal M4 { get; set; }

    public decimal M5 { get; set; }

    public decimal M6 { get; set; }

    public decimal M7 { get; set; }

    public decimal M8 { get; set; }

    public decimal M9 { get; set; }

    public decimal M10 { get; set; }

    public decimal M11 { get; set; }

    public decimal M12 { get; set; }

    public string? CreditDebit { get; set; }

    public string? AdjustmentType { get; set; }

    public string? LegislativeAdjustmentReason { get; set; }

    public string? ReasonForAdjustment { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public string? GRAPClassification { get; set; }

    public string? MainSegmentReporting { get; set; }

    public string? SubSegmentReporting { get; set; }

    public string? GRAPClassificationNote { get; set; }

    public bool? CostingProject { get; set; }
}

[Table("Plan_BudgetAdjustmentImportVersion_DetailException")]
public class Plan_BudgetAdjustmentImportVersion_DetailException
{
    [Key]
    public int BudgetAdjustmentImportVersionException_ID { get; set; } = 0;

    public int BudgetAdjustmentImportVersionDetailID { get; set; }

    public string? ExceptionDetail { get; set; }
}

[Table("Plan_BudgetAdjustmentImportVersion_File")]
public class Plan_BudgetAdjustmentImportVersion_File
{
    [Key]
    public int BudgetAdjustmentImportVersionFile_ID { get; set; } = 0;

    public int BudgetAdjustmentExportImportVersionHeaderID { get; set; }

    public int BudgetAdjustmentImportVersionNumber { get; set; }

    public string? BudgetAdjustmentImportVersionFileName { get; set; }

    public string? BudgetAdjustmentImportVersionFileNameSaved { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Plan_BudgetAdjustmentImportVersion_OverallException")]
public class Plan_BudgetAdjustmentImportVersion_OverallException
{
    [Key]
    public int BudgetAdjustmentImportVersionException_ID { get; set; } = 0;

    public int BudgetAdjustmentExportImportVersionHeaderID { get; set; }

    public int BudgetAdjustmentImportVersionNumber { get; set; }

    public string? ExceptionDetail { get; set; }
}

[Table("Plan_BudgetConsumption")]
public class Plan_BudgetConsumption
{
    [Key]
    public int BudgetConsumption_ID { get; set; } = 0;

    public string? FinYear { get; set; }

    public int? PlanProjectItemID { get; set; }

    public int? BudgetTransactionTypeID { get; set; }

    public int? ModuleID { get; set; }

    public int? PK_TransactionID { get; set; }

    public string? TransactionTableName { get; set; }

    public decimal? ConsumingTransactionAmount { get; set; }

    public decimal? ConsumingTransactionAmountMultiyear { get; set; }

    public decimal? AdjustedTansactionAmount { get; set; }

    public decimal? AvailableBudget { get; set; }

    public decimal? AvailableBudgetMultiyear { get; set; }

    public int? ProcessingMonth { get; set; }

    public int? BudgetConsumptionProcessID { get; set; }

    public decimal? OriginalBudgetToDate { get; set; }

    public decimal? AdjustedBudgetToDate { get; set; }

    public decimal? CapturedExpenditureToDate { get; set; }

    public decimal? CapturedExpenditureToDateMultiyear { get; set; }

    public decimal? ReserveToDate { get; set; }

    public decimal? ReserveToDateMultiyear { get; set; }

    public decimal? CommitToDate { get; set; }

    public decimal? ActualToDate { get; set; }

    public decimal? CurrentlyConsumedAmount { get; set; }

    public decimal? CurrentlyConsumedAmountMultiyear { get; set; }

    public string? InitialLine { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Plan_BudgetConsumption_Import")]
public class Plan_BudgetConsumption_Import
{
    [Key]
    public int BudgetConsumption_ID { get; set; } = 0;

    public string? FinYear { get; set; }

    public int? PlanProjectItemID { get; set; }

    public int? BudgetTransactionTypeID { get; set; }

    public int? ModuleID { get; set; }

    public int? PK_TransactionID { get; set; }

    public string? TransactionTableName { get; set; }

    public decimal? ConsumingTransactionAmount { get; set; }

    public decimal? ConsumingTransactionAmountMultiyear { get; set; }

    public decimal? AdjustedTansactionAmount { get; set; }

    public decimal? AvailableBudget { get; set; }

    public decimal? AvailableBudgetMultiyear { get; set; }

    public int? ProcessingMonth { get; set; }

    public int? BudgetConsumptionProcessID { get; set; }

    public decimal? OriginalBudgetToDate { get; set; }

    public decimal? AdjustedBudgetToDate { get; set; }

    public decimal? CapturedExpenditureToDate { get; set; }

    public decimal? CapturedExpenditureToDateMultiyear { get; set; }

    public decimal? ReserveToDate { get; set; }

    public decimal? ReserveToDateMultiyear { get; set; }

    public decimal? CommitToDate { get; set; }

    public decimal? ActualToDate { get; set; }

    public decimal? CurrentlyConsumedAmount { get; set; }

    public decimal? CurrentlyConsumedAmountMultiyear { get; set; }

    public string? InitialLine { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Plan_BudgetMigration")]
public class Plan_BudgetMigration
{
    [Key]
    public int BudgetMigration_Id { get; set; } = 0;

    public string? FromFinYear { get; set; }

    public string? ToFinYear { get; set; }

    public bool? IsBudgetMigrated { get; set; }

    public int? CapturerID { get; set; }

    public DateTime? DateCaptured { get; set; }

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Plan_BudgetOriginalExportImportVersion_Header")]
public class Plan_BudgetOriginalExportImportVersion_Header
{
    [Key]
    public int BudgetOriginalExportImportVersionHeader_ID { get; set; } = 0;

    public string? BudgetOriginalExportImportVersionFileName { get; set; }

    public string? FinYear { get; set; }

    public int OriginalVersionID { get; set; }

    public int ProjectStatusID { get; set; }

    public string? BudgetType { get; set; }

    public int StatusID { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public bool? IsProjectRegistered { get; set; }

    public int? BudgetVersionID { get; set; }
}

[Table("Plan_BudgetOriginalExportVersion_Detail")]
public class Plan_BudgetOriginalExportVersion_Detail
{
    [Key]
    public int BudgetOriginalExportVersionDetail_ID { get; set; } = 0;

    public int BudgetOriginalExportImportVersionHeaderID { get; set; }

    public string? FinYear1 { get; set; }

    public string? FinYear2 { get; set; }

    public string? FinYear3 { get; set; }

    public int VersionID { get; set; }

    public string? IDPItem { get; set; }

    public int? ProjectID { get; set; }

    public int? ProjectCode { get; set; }

    public string? ProjectName { get; set; }

    public string? ProjectDesc { get; set; }

    public string? SingleMultiYear { get; set; }

    public int? PlanProjectItemID { get; set; }

    public string? BudgetType { get; set; }

    public string? SCOAProjectCode { get; set; }

    public string? SCOAProject { get; set; }

    public string? SCOAFunctionCode { get; set; }

    public string? SCOAFunction { get; set; }

    public string? MSCDepartmentCode { get; set; }

    public string? MSCDepartment { get; set; }

    public string? MSCDivisionCode { get; set; }

    public string? MSCDivision { get; set; }

    public string? MunicipalClassification { get; set; }

    public string? SCOAFundCode { get; set; }

    public string? SCOAFund { get; set; }

    public string? SCOARegionCode { get; set; }

    public string? SCOARegion { get; set; }

    public string? SCOACostingCode { get; set; }

    public string? SCOACosting { get; set; }

    public string? SCOAItemCode { get; set; }

    public string? SCOAItem { get; set; }

    public string? ItemDescription { get; set; }

    public decimal CurrentBudgetFinYear1 { get; set; }

    public decimal CurrentBudgetFinYear2 { get; set; }

    public decimal CurrentBudgetFinYear3 { get; set; }

    public string? SplitType { get; set; }

    public decimal M1 { get; set; }

    public decimal M2 { get; set; }

    public decimal M3 { get; set; }

    public decimal M4 { get; set; }

    public decimal M5 { get; set; }

    public decimal M6 { get; set; }

    public decimal M7 { get; set; }

    public decimal M8 { get; set; }

    public decimal M9 { get; set; }

    public decimal M10 { get; set; }

    public decimal M11 { get; set; }

    public decimal M12 { get; set; }

    public string? CreditDebit { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public string? GRAPClassification { get; set; }

    public string? GRAPClassificationNote { get; set; }

    public string? MainSegmentReporting { get; set; }

    public string? SubSegmentReporting { get; set; }

    public bool? CostingProject { get; set; }

    public bool? ActiveForSCM { get; set; }
}

[Table("Plan_BudgetOriginalImportVersion_Detail")]
public class Plan_BudgetOriginalImportVersion_Detail
{
    [Key]
    public int BudgetOriginalImportVersionDetail_ID { get; set; } = 0;

    public int BudgetOriginalExportImportVersionHeaderID { get; set; }

    public int BudgetOriginalImportVersionNumber { get; set; }

    public string? FinYear1 { get; set; }

    public string? FinYear2 { get; set; }

    public string? FinYear3 { get; set; }

    public int VersionID { get; set; }

    public string? IDPItem { get; set; }

    public int? ProjectID { get; set; }

    public int? ProjectCode { get; set; }

    public string? ProjectName { get; set; }

    public string? ProjectDesc { get; set; }

    public string? SingleMultiYear { get; set; }

    public int? PlanProjectItemID { get; set; }

    public string? BudgetType { get; set; }

    public string? SCOAProjectCode { get; set; }

    public string? SCOAProject { get; set; }

    public string? SCOAFunctionCode { get; set; }

    public string? SCOAFunction { get; set; }

    public string? MSCDepartmentCode { get; set; }

    public string? MSCDepartment { get; set; }

    public string? MSCDivisionCode { get; set; }

    public string? MSCDivision { get; set; }

    public string? MunicipalClassification { get; set; }

    public string? SCOAFundCode { get; set; }

    public string? SCOAFund { get; set; }

    public string? SCOARegionCode { get; set; }

    public string? SCOARegion { get; set; }

    public string? SCOACostingCode { get; set; }

    public string? SCOACosting { get; set; }

    public string? SCOAItemCode { get; set; }

    public string? SCOAItem { get; set; }

    public string? ItemDescription { get; set; }

    public decimal CurrentBudgetFinYear1 { get; set; }

    public decimal CurrentBudgetFinYear2 { get; set; }

    public decimal CurrentBudgetFinYear3 { get; set; }

    public string? SplitType { get; set; }

    public decimal M1 { get; set; }

    public decimal M2 { get; set; }

    public decimal M3 { get; set; }

    public decimal M4 { get; set; }

    public decimal M5 { get; set; }

    public decimal M6 { get; set; }

    public decimal M7 { get; set; }

    public decimal M8 { get; set; }

    public decimal M9 { get; set; }

    public decimal M10 { get; set; }

    public decimal M11 { get; set; }

    public decimal M12 { get; set; }

    public string? CreditDebit { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public string? GRAPClassification { get; set; }

    public string? MainSegmentReporting { get; set; }

    public string? SubSegmentReporting { get; set; }

    public string? GRAPClassificationNote { get; set; }

    public bool? CostingProject { get; set; }

    public bool? DeleteItem { get; set; }

    public bool? ActiveForSCM { get; set; }
}

[Table("Plan_BudgetOriginalImportVersion_DetailException")]
public class Plan_BudgetOriginalImportVersion_DetailException
{
    [Key]
    public int BudgetOriginalImportVersionException_ID { get; set; } = 0;

    public int BudgetOriginalImportVersionDetailID { get; set; }

    public string? ExceptionDetail { get; set; }
}

[Table("Plan_BudgetOriginalImportVersion_File")]
public class Plan_BudgetOriginalImportVersion_File
{
    [Key]
    public int BudgetOriginalImportVersionFile_ID { get; set; } = 0;

    public int BudgetOriginalExportImportVersionHeaderID { get; set; }

    public int BudgetOriginalImportVersionNumber { get; set; }

    public string? BudgetOriginalImportVersionFileName { get; set; }

    public string? BudgetOriginalImportVersionFileNameSaved { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Plan_BudgetOriginalImportVersion_OverallException")]
public class Plan_BudgetOriginalImportVersion_OverallException
{
    [Key]
    public int BudgetOriginalImportVersionException_ID { get; set; } = 0;

    public int BudgetOriginalExportImportVersionHeaderID { get; set; }

    public int BudgetOriginalImportVersionNumber { get; set; }

    public string? ExceptionDetail { get; set; }
}

[Table("Plan_BudgetRegister")]
public class Plan_BudgetRegister
{
    [Key]
    public int BudgetRegister_ID { get; set; } = 0;

    public int? PlanProjectItemID { get; set; }

    public int? BudgetTransactionTypeID { get; set; }

    public int? ModuleID { get; set; }

    public int? PK_TransactionID { get; set; }

    public string? TransactionTableName { get; set; }

    public decimal? TransactionAmount { get; set; }

    public decimal? AvailableBudget { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public string? FinYear { get; set; }
}

[Table("Plan_BudgetRegisterBackup")]
public class Plan_BudgetRegisterBackup
{
    [Key]
    public int BudgetRegister_ID { get; set; } = 0;

    public int? PlanProjectItemID { get; set; }

    public int? BudgetTransactionTypeID { get; set; }

    public int? ModuleID { get; set; }

    public int? PK_TransactionID { get; set; }

    public string? TransactionTableName { get; set; }

    public decimal? TransactionAmount { get; set; }

    public decimal? AvailableBudget { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public string? FinYear { get; set; }
}

[Table("Plan_BudgetRollover")]
public class Plan_BudgetRollover
{
    [Key]
    public int BudgetRollOver_Id { get; set; } = 0;

    public string? FromFinYear { get; set; }

    public string? ToFinYear { get; set; }

    public bool? IsBudgetRollover { get; set; }

    public string? BudgetRolloverFileName { get; set; }

    public int? CapturerID { get; set; }

    public DateTime? DateCaptured { get; set; }

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Plan_BudgetVersion")]
public class Plan_BudgetVersion
{
    [Key]
    public int BudgetVersion_ID { get; set; } = 0;

    public string? VersionNumber { get; set; }

    public string? VersionName { get; set; }

    public string? Comments { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;
}

[Table("Plan_BudgetVersionDetail")]
public class Plan_BudgetVersionDetail
{
    [Key]
    public int BudgetVersionDetail_ID { get; set; } = 0;

    public int BudgetVersionID { get; set; }

    public int ProjectID { get; set; }

    public string? FinYear { get; set; }

    public int IDPItemID { get; set; }

    public int CapitalOperation { get; set; }

    public int ScoaProjectID { get; set; }

    public int SCOACostingID { get; set; }

    public int? ProjectTypeID { get; set; }

    public int PlanProjectItemID { get; set; }

    public int? ProjectItemID { get; set; }

    public int SCOAItemID { get; set; }

    public int SCOAFundId { get; set; }

    public decimal? BudgetAmount { get; set; }

    public decimal? BudgetAmountCurP1 { get; set; }

    public decimal? BudgetAmountCurP2 { get; set; }

    public int SCOAFunctionId { get; set; }

    public int SCOARegionId { get; set; }

    public int DivisionId { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public bool? CostingProject { get; set; }
}

[Table("Plan_BudgetVersionMonths")]
public class Plan_BudgetVersionMonths
{
    [Key]
    public int BudgetVersionMonth_ID { get; set; } = 0;

    public int BudgetVersionID { get; set; }

    public int? ProjectItemMonth_ID { get; set; }

    public int PlanProjectItemID { get; set; }

    public int MonthID { get; set; }

    public decimal UnitQuantity { get; set; }

    public decimal UnitPrice { get; set; }

    public int CaptureID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? VirementId { get; set; }

    public int? AdjustmentId { get; set; }
}

[Table("Plan_BudgetZeroExportImportVersion_Header")]
public class Plan_BudgetZeroExportImportVersion_Header
{
    [Key]
    public int BudgetZeroExportImportVersionHeader_ID { get; set; } = 0;

    public string? BudgetZeroExportImportVersionFileName { get; set; }

    public string? FinYear { get; set; }

    public int ZeroVersionID { get; set; }

    public int ProjectStatusID { get; set; }

    public string? BudgetType { get; set; }

    public int StatusID { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public bool? IsProjectRegistered { get; set; }

    public int? BudgetVersionID { get; set; }
}

[Table("Plan_BudgetZeroImportVersion_Detail")]
public class Plan_BudgetZeroImportVersion_Detail
{
    [Key]
    public int BudgetZeroImportVersionDetail_ID { get; set; } = 0;

    public int BudgetZeroExportImportVersionHeaderID { get; set; }

    public int BudgetZeroImportVersionNumber { get; set; }

    public string? FinYear1 { get; set; }

    public string? FinYear2 { get; set; }

    public string? FinYear3 { get; set; }

    public int VersionID { get; set; }

    public string? IDPItem { get; set; }

    public int? ProjectID { get; set; }

    public int? ProjectCode { get; set; }

    public string? ProjectName { get; set; }

    public string? ProjectDesc { get; set; }

    public string? SingleMultiYear { get; set; }

    public int? PlanProjectItemID { get; set; }

    public string? BudgetType { get; set; }

    public string? SCOAProjectCode { get; set; }

    public string? SCOAProject { get; set; }

    public string? SCOAFunctionCode { get; set; }

    public string? SCOAFunction { get; set; }

    public string? MSCDepartmentCode { get; set; }

    public string? MSCDepartment { get; set; }

    public string? MSCDivisionCode { get; set; }

    public string? MSCDivision { get; set; }

    public string? MunicipalClassification { get; set; }

    public string? SCOAFundCode { get; set; }

    public string? SCOAFund { get; set; }

    public string? SCOARegionCode { get; set; }

    public string? SCOARegion { get; set; }

    public string? SCOACostingCode { get; set; }

    public string? SCOACosting { get; set; }

    public string? SCOAItemCode { get; set; }

    public string? SCOAItem { get; set; }

    public string? ItemDescription { get; set; }

    public decimal CurrentBudgetFinYear1 { get; set; }

    public decimal CurrentBudgetFinYear2 { get; set; }

    public decimal CurrentBudgetFinYear3 { get; set; }

    public string? SplitType { get; set; }

    public decimal M1 { get; set; }

    public decimal M2 { get; set; }

    public decimal M3 { get; set; }

    public decimal M4 { get; set; }

    public decimal M5 { get; set; }

    public decimal M6 { get; set; }

    public decimal M7 { get; set; }

    public decimal M8 { get; set; }

    public decimal M9 { get; set; }

    public decimal M10 { get; set; }

    public decimal M11 { get; set; }

    public decimal M12 { get; set; }

    public string? CreditDebit { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public string? GRAPClassification { get; set; }

    public string? MainSegmentReporting { get; set; }

    public string? SubSegmentReporting { get; set; }

    public string? GRAPClassificationNote { get; set; }

    public bool? CostingProject { get; set; }

    public bool? ActiveForSCM { get; set; }

    public string? ZeroBudgetItemReason { get; set; }
}

[Table("Plan_BudgetZeroImportVersion_DetailException")]
public class Plan_BudgetZeroImportVersion_DetailException
{
    [Key]
    public int BudgetZeroImportVersionException_ID { get; set; } = 0;

    public int BudgetZeroImportVersionDetailID { get; set; }

    public string? ExceptionDetail { get; set; }
}

[Table("Plan_BudgetZeroImportVersion_File")]
public class Plan_BudgetZeroImportVersion_File
{
    [Key]
    public int BudgetZeroImportVersionFile_ID { get; set; } = 0;

    public int BudgetZeroExportImportVersionHeaderID { get; set; }

    public int BudgetZeroImportVersionNumber { get; set; }

    public string? BudgetZeroImportVersionFileName { get; set; }

    public string? BudgetZeroImportVersionFileNameSaved { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Plan_FundingBudgetVersion")]
public class Plan_FundingBudgetVersion
{
    [Key]
    public int FundingBudgetVersion_ID { get; set; } = 0;

    public string? VersionNumber { get; set; }

    public string? VersionName { get; set; }

    public string? Comments { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;
}

[Table("Plan_FundingBudgetVersionDetails")]
public class Plan_FundingBudgetVersionDetails
{
    [Key]
    public int FundingBudgetVersionDetail_Id { get; set; } = 0;

    public int FundingBudgetVersionId { get; set; }

    public int FundingSourceBudgetDetail_ID { get; set; }

    public int FundingSourceBudgetHeaderID { get; set; }

    public string? FinancialYear { get; set; }

    public int? FundingSourceID { get; set; }

    public int ScoaID { get; set; }

    public decimal FundingSourceBudget { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public string? UploadedDocument { get; set; }
}

[Table("Plan_FundingSourceBudget_Detail")]
public class Plan_FundingSourceBudget_Detail
{
    [Key]
    public int FundingSourceBudgetDetail_ID { get; set; } = 0;

    public int FundingSourceBudgetHeaderID { get; set; }

    public int? FundingSourceID { get; set; }

    public int ScoaID { get; set; }

    public decimal FundingSourceBudget { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public bool? IsHidden { get; set; }

    public string? UploadedDocument { get; set; }

    public int? PreviousReferenceId { get; set; }
}

[Table("Plan_FundingSourceBudget_Header")]
public class Plan_FundingSourceBudget_Header
{
    [Key]
    public int FundingSourceBudgetHeader_ID { get; set; } = 0;

    public string? FinancialYear { get; set; }

    public bool Submitted { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public int? PreviousReferenceId { get; set; }
}

[Table("Plan_FundingSourceChanges")]
public class Plan_FundingSourceChanges
{
    [Key]
    public int PlanFundingSourceChange_ID { get; set; } = 0;

    public int FundingSourceDetailsID { get; set; }

    public int FundSourceChangeID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }
}

[Table("Plan_FundingSourceDocs")]
public class Plan_FundingSourceDocs
{
    [Key]
    public int FundingSourceDocs_ID { get; set; } = 0;

    public int? SupportingDocsID { get; set; }

    public int? FundingSourceBudgetDetailID { get; set; }

    public int? ScoaID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Plan_GetApprovedVirementFromSP_Temp")]
public class Plan_GetApprovedVirementFromSP_Temp
{
    [Key]
    public int? Rownumber { get; set; } = 0;

    public string? FinYear { get; set; }

    public decimal? VirementAmount { get; set; }

    public string? ReasonForVirement { get; set; }

    public string? FirstApprover { get; set; }

    public string? SecondApprover { get; set; }

    public string? ThirdApprover { get; set; }

    public string? FileName { get; set; }

    public string? FromHistoricalProjectCode { get; set; }

    public string? FromProjectName { get; set; }

    public int? FromCapitalOperation { get; set; }

    public string? FromScoaProjectID { get; set; }

    public int? FromDivisionID { get; set; }

    public string? FromSCOAFunctionID { get; set; }

    public string? FromSCOARegionID { get; set; }

    public string? FromSCOACostingID { get; set; }

    public string? FromSCOAItemID { get; set; }

    public string? FromScoaFundID { get; set; }

    public int? FromProjectItemID { get; set; }

    public string? ToHistoricalProjectCode { get; set; }

    public string? ToProjectName { get; set; }

    public int? ToCapitalOperation { get; set; }

    public string? ToScoaProjectID { get; set; }

    public int? ToDivisionID { get; set; }

    public string? ToSCOAFunctionID { get; set; }

    public string? ToSCOARegionID { get; set; }

    public string? ToSCOACostingID { get; set; }

    public string? ToSCOAItemID { get; set; }

    public string? ToScoaFundID { get; set; }

    public int? ToProjectItemID { get; set; }
}

[Table("Plan_IDPMTREFApproval")]
public class Plan_IDPMTREFApproval
{
    [Key]
    public int IDPMTREFApproval_Id { get; set; } = 0;

    public string? FinancialYear { get; set; }

    public bool? IsInitializeIDPMTREF { get; set; }

    public string? ApprovedIDPFileName { get; set; }

    public string? ApprovedMTREFFileName { get; set; }

    public int ApprovedBy { get; set; }

    public DateTime ApprovedDate { get; set; } = DateTime.UtcNow;

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Plan_MTREFApproval")]
public class Plan_MTREFApproval
{
    [Key]
    public int IDPMTREFApproval_Id { get; set; } = 0;

    public string? FinancialYear { get; set; }

    public bool? IsInitializeIDPMTREF { get; set; }

    public string? ApprovedMTREFFileName { get; set; }

    public int ApprovedBy { get; set; }

    public DateTime ApprovedDate { get; set; } = DateTime.UtcNow;

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public DateTime? CouncilApprovedDate { get; set; }
}

[Table("Plan_MTREFDraft")]
public class Plan_MTREFDraft
{
    [Key]
    public int MTREFDarft_Id { get; set; } = 0;

    public string? FinancialYear { get; set; }

    public bool? IsApprovedMTREFDraft { get; set; }

    public string? ApprovedMTREFDraftFileName { get; set; }

    public int ApprovedBy { get; set; }

    public DateTime ApprovedDate { get; set; } = DateTime.UtcNow;

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Plan_Project")]
public class Plan_Project
{
    [Key]
    public int Project_ID { get; set; } = 0;

    public string? ProjectName { get; set; }

    public string? ProjectDesc { get; set; }

    public int? ProjectManagerID { get; set; }

    public int? SupplyChainOfficialID { get; set; }

    public int? CapitalOperation { get; set; }

    public decimal CostEstimate { get; set; }

    public int ScoaProjectID { get; set; }

    public DateTime? EstimatedStartDate { get; set; }

    public DateTime? EstimatedEndDate { get; set; }

    public int ProjectStatus { get; set; }

    public DateTime? CommencementDate { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public string? FinYear { get; set; }

    public string? ProjectDetailDesc { get; set; }

    public int? ProjectCategoryID { get; set; }

    public int? ProjectImplementAgentID { get; set; }

    public string? Longitude { get; set; }

    public string? Latitude { get; set; }

    public int? ProgrammeManagerID { get; set; }

    public int? FinancialControllerID { get; set; }

    public int? ProjectTypeID { get; set; }

    public int? EstimatedDuration { get; set; }

    public int? ProjectDistinctionID { get; set; }

    public bool? IsDeleted { get; set; }

    public string? HistoricalProjectCode { get; set; }

    public int? ProjectParentID { get; set; }

    public string? SingleMultiYear { get; set; }

    public int? PreviousReferenceId { get; set; }

    public int? ProjectCode { get; set; }

    public bool? CostingProject { get; set; }
}

[Table("Plan_Project_Beneficiaries")]
public class Plan_Project_Beneficiaries
{
    [Key]
    public int PlanProjectBeneficiary_ID { get; set; } = 0;

    public int ProjectID { get; set; }

    public int? PlanperHousehold { get; set; }

    public int? ActperHousehold { get; set; }

    public int? PlanperPeople { get; set; }

    public int? ActperPeople { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Plan_Project_CashFlow")]
public class Plan_Project_CashFlow
{
    [Key]
    public int ProjectCashFlow_ID { get; set; } = 0;

    public int ProjectFundID { get; set; }

    public int ProjectID { get; set; }

    public DateTime PeriodEnd { get; set; } = DateTime.UtcNow;

    public decimal? PlanDirect { get; set; }

    public decimal? PlanIndirect { get; set; }

    public decimal? RevDirect { get; set; }

    public decimal? RevIndirect { get; set; }

    public string? RevComment { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Plan_ProjectDivisions")]
public class Plan_ProjectDivisions
{
    [Key]
    public int ProjectDivision_ID { get; set; } = 0;

    public int ProjectID { get; set; }

    public int DivisionID { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? PreviousReferenceId { get; set; }
}

[Table("Plan_ProjectFunctions")]
public class Plan_ProjectFunctions
{
    [Key]
    public int ProjectFunction_ID { get; set; } = 0;

    public int ProjectID { get; set; }

    public int ScoaFunctionID { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? PreviousReferenceId { get; set; }
}

[Table("Plan_ProjectFund")]
public class Plan_ProjectFund
{
    [Key]
    public int ProjectFund_ID { get; set; } = 0;

    public int ProjectID { get; set; }

    public int ScoaFundID { get; set; }

    public decimal? FundAmount { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public string? FundReference { get; set; }

    public int? VirementId { get; set; }

    public int? AdjustmentId { get; set; }

    public int? PreviousReferenceId { get; set; }
}

[Table("Plan_ProjectFundYear")]
public class Plan_ProjectFundYear
{
    [Key]
    public int ProjectFundYear_ID { get; set; } = 0;

    public int ProjectFundID { get; set; }

    public string? FinYear { get; set; }

    public decimal YearFundAmount { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? VirementId { get; set; }

    public int? AdjustmentId { get; set; }

    public int? PreviousReferenceId { get; set; }
}

[Table("Plan_ProjectIDP")]
public class Plan_ProjectIDP
{
    [Key]
    public int ProjectIDP_ID { get; set; } = 0;

    public int ProjectID { get; set; }

    public int ParentIDPItemID { get; set; }

    public int ProjectIDPItemID { get; set; }

    public decimal Percentage { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public int? PreviousReferenceId { get; set; }
}

[Table("Plan_ProjectItem")]
public class Plan_ProjectItem
{
    [Key]
    public int PlanProjectItem_ID { get; set; } = 0;

    public int ProjectID { get; set; }

    public int? ProjectItemID { get; set; }

    public int? ProjectItemCode { get; set; }

    public int SCOAItemID { get; set; }

    public string? FinYear { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ProjectFundYearID { get; set; }

    public int? SCOAFundId { get; set; }

    public decimal? BudgetAmount { get; set; }

    public decimal? BudgetAmountCurP1 { get; set; }

    public decimal? BudgetAmountCurP2 { get; set; }

    public int? SCOAFunctionId { get; set; }

    public int? SCOARegionId { get; set; }

    public int? DivisionId { get; set; }

    public int? BudgetSplitID { get; set; }

    public int? VirementId { get; set; }

    public string? HistoricalProjectCode { get; set; }

    public int? AdjustmentId { get; set; }

    public int? ModificationNumber { get; set; }

    public int? SCOACostingID { get; set; }

    public bool? IsItemLocked { get; set; }

    public string? CreditDebit { get; set; }

    public int? PreviousReferenceId { get; set; }

    public string? GRAPClassification { get; set; }

    public string? GRAPClassificationNote { get; set; }

    public string? MainSegmentReporting { get; set; }

    public string? SubSegmentReporting { get; set; }

    public bool? IsActiveForSCM { get; set; }

    public bool? ZeroBudgetItem { get; set; }

    public string? ZeroBudgetItemReason { get; set; }
}

[Table("Plan_ProjectItemDocs")]
public class Plan_ProjectItemDocs
{
    [Key]
    public int ProjectItemDocs_ID { get; set; } = 0;

    public int? SupportingDocsID { get; set; }

    public int? PlanProjectItemID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }

    public int? PreviousReferenceId { get; set; }
}

[Table("Plan_ProjectItemMonth")]
public class Plan_ProjectItemMonth
{
    [Key]
    public int ProjectItemMonth_ID { get; set; } = 0;

    public int PlanProjectItemID { get; set; }

    public int MonthID { get; set; }

    public decimal UnitQuantity { get; set; }

    public decimal UnitPrice { get; set; }

    public int CaptureID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? VirementId { get; set; }

    public int? AdjustmentId { get; set; }

    public int? PreviousReferenceId { get; set; }
}

[Table("Plan_ProjectJustification")]
public class Plan_ProjectJustification
{
    [Key]
    public int PlanProjectJustification_ID { get; set; } = 0;

    public int ProjectID { get; set; }

    public int ProjectJustificationID { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Plan_ProjectRegions")]
public class Plan_ProjectRegions
{
    [Key]
    public int ProjectRegion_ID { get; set; } = 0;

    public int ProjectID { get; set; }

    public int ScoaRegionID { get; set; }

    public decimal? RegionPercent { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? PreviousReferenceId { get; set; }
}

[Table("Plan_SupplementaryAdjustment")]
public class Plan_SupplementaryAdjustment
{
    [Key]
    public int SupplementaryAdjustment_Id { get; set; } = 0;

    public string? FinancialYear { get; set; }

    public int? AdjustmentVersionId { get; set; }

    public int? AdjustmentFundingVersionId { get; set; }

    public bool? IsSupplementaryAdjustment { get; set; }

    public string? SupplementaryAdjustmentFileName { get; set; }

    public bool? IsAdjustmentFinalApproved { get; set; }

    public int FinalApprovedBy { get; set; }

    public DateTime FinalApprovedDate { get; set; } = DateTime.UtcNow;

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Plan_TrackChanges")]
public class Plan_TrackChanges
{
    [Key]
    public int TrackChanges_ID { get; set; } = 0;

    public int? PlanProjectItem_ID { get; set; }

    public int ProjectID { get; set; }

    public string? FinYear { get; set; }

    public int? ProjectItemID { get; set; }

    public int? SCOAItemID { get; set; }

    public int? SCOAFunctionId { get; set; }

    public int? SCOAFundId { get; set; }

    public int? SCOARegionId { get; set; }

    public int? DivisionId { get; set; }

    public decimal? OriginalBudgetAmount { get; set; }

    public decimal? OriginalBudgetAmountCurP1 { get; set; }

    public decimal? OriginalBudgetAmountCurP2 { get; set; }

    public decimal? RevisedBudgetAmount { get; set; }

    public decimal? RevisedBudgetAmountCurP1 { get; set; }

    public decimal? RevisedBudgetAmountCurP2 { get; set; }

    public string? Comment { get; set; }

    public string? CommentFor { get; set; }

    public bool? IsProjectDeleted { get; set; }

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Plan_TrackChangesVirement")]
public class Plan_TrackChangesVirement
{
    [Key]
    public int TrackChangesVirement_Id { get; set; } = 0;

    public int VirementId { get; set; }

    public string? FinYear { get; set; }

    public int FromProjectId { get; set; }

    public int ToProjectId { get; set; }

    public int? FromSCOAProjectID { get; set; }

    public int? ToSCOAProjectID { get; set; }

    public int? FromSCOAFunctionId { get; set; }

    public int? ToSCOAFunctionId { get; set; }

    public int? FromDivisionId { get; set; }

    public int? ToDivisionId { get; set; }

    public int? FromSCOAFundID { get; set; }

    public int? ToSCOAFundID { get; set; }

    public int? FromSCOARegion { get; set; }

    public int? ToSCOARegion { get; set; }

    public int? FromSCOAItem { get; set; }

    public int? ToSCOAItem { get; set; }

    public string? ReasonForVirement { get; set; }

    public decimal? FromAvailableFund { get; set; }

    public decimal? FromVirementAmount { get; set; }

    public decimal? FromNewAvailableBudget { get; set; }

    public decimal? ToAvailableFund { get; set; }

    public decimal? ToVirementAmount { get; set; }

    public decimal? ToNewAvailableBudget { get; set; }

    public string? VirementReferenceNumber { get; set; }

    public int? FromCapitalOperation { get; set; }

    public int? ToCapitalOperation { get; set; }

    public string? UploadedVirementDoc { get; set; }

    public bool? IsNewItemAdded { get; set; }

    public int? FromSCOACostingId { get; set; }

    public int? ToSCOACostingId { get; set; }

    public int? VirementStatus { get; set; }

    public int? FromProjectItemId { get; set; }

    public int? ToProjectItemId { get; set; }

    public decimal? OriginalVirementAmount { get; set; }

    public decimal? RevisedVirementAmount { get; set; }

    public int TransferBy { get; set; }

    public DateTime TransferOn { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Plan_TrackExceptions")]
public class Plan_TrackExceptions
{
    [Key]
    public int TrackException_Id { get; set; } = 0;

    public string? FinYear { get; set; }

    public bool? IsSCOAProject { get; set; }

    public bool? IsSCOAFunction { get; set; }

    public bool? IsSCOARegion { get; set; }

    public bool? IsSCOACosting { get; set; }

    public bool? IsSCOAFunding { get; set; }

    public bool? IsSCOAItemIR { get; set; }

    public bool? IsSCOAItemIE { get; set; }

    public bool? IsSCOAItemIA { get; set; }

    public bool? IsSCOAItemIL { get; set; }

    public bool? IsSCOAItemIZ { get; set; }

    public bool? IsSCOAItemLN { get; set; }

    public int? CapturerID { get; set; }

    public DateTime? DateCaptured { get; set; }

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Plan_VirementApprovalRejections")]
public class Plan_VirementApprovalRejections
{
    [Key]
    public int VirementApprovalRejectionId { get; set; } = 0;

    public int? VirementId { get; set; }

    public bool? IsApproved { get; set; }

    public int? ApprovedBy { get; set; }

    public DateTime? ApprovedOn { get; set; }

    public bool? IsRejected { get; set; }

    public string? RejectReason { get; set; }

    public int? RejectedBy { get; set; }

    public DateTime? RejectedOn { get; set; }

    public int? CapturerID { get; set; }

    public DateTime? DateCaptured { get; set; }

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Plan_VirementApprovalUsers")]
public class Plan_VirementApprovalUsers
{
    [Key]
    public int VirementApprovalUserId { get; set; } = 0;

    public int? VirementId { get; set; }

    public int? UserId { get; set; }

    public int? CapturerID { get; set; }

    public DateTime? DateCaptured { get; set; }

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }
}

[Table("Plan_VirementBudgetSplit")]
public class Plan_VirementBudgetSplit
{
    [Key]
    public int VirementBudgetSplit_Id { get; set; } = 0;

    public int? VirementId { get; set; }

    public int? AdjustmentId { get; set; }

    public int? BudgetSplitId { get; set; }

    public decimal? Month1Price { get; set; }

    public decimal? Month2Price { get; set; }

    public decimal? Month3Price { get; set; }

    public decimal? Month4Price { get; set; }

    public decimal? Month5Price { get; set; }

    public decimal? Month6Price { get; set; }

    public decimal? Month7Price { get; set; }

    public decimal? Month8Price { get; set; }

    public decimal? Month9Price { get; set; }

    public decimal? Month10Price { get; set; }

    public decimal? Month11Price { get; set; }

    public decimal? Month12Price { get; set; }

    public decimal? Month13Price { get; set; }

    public decimal? Month14Price { get; set; }

    public int CaptureID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public string? TransferFromTo { get; set; }
}

[Table("Plan_VirementPolicyApproval")]
public class Plan_VirementPolicyApproval
{
    [Key]
    public int VirementPolicyApproval_Id { get; set; } = 0;

    public string? FinancialYear { get; set; }

    public bool? IsApprovedVirementPolicy { get; set; }

    public string? ApprovedVirementPolicyFileName { get; set; }

    public int ApprovedBy { get; set; }

    public DateTime ApprovedDate { get; set; } = DateTime.UtcNow;

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Plan_VirementPolicyVersion")]
public class Plan_VirementPolicyVersion
{
    [Key]
    public int VirementPolicyVersion_ID { get; set; } = 0;

    public string? FinancialYear { get; set; }

    public string? VersionNumber { get; set; }

    public string? VersionName { get; set; }

    public string? Comments { get; set; }

    public bool? IsCouncilApprovedPolicy { get; set; }

    public string? ApprovedVirementPolicyFileName { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Plan_VirementPolicyVersionDetail")]
public class Plan_VirementPolicyVersionDetail
{
    [Key]
    public int VirementPolicyVersionDetail_ID { get; set; } = 0;

    public int VirementPolicyVersionID { get; set; }

    public int VirementRule_ID { get; set; }

    public int Priority { get; set; }

    public string? VirementDesc { get; set; }

    public string? VirementDefinition { get; set; }

    public string? VirementRuleDesc { get; set; }

    public string? BusinessRule { get; set; }

    public bool Enabled { get; set; }

    public bool Option { get; set; }

    public bool Lockdown { get; set; }

    public string? FinYear { get; set; }

    public int? PreviousReferenceId { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? ModifierID { get; set; }
}

[Table("Plan_Virements")]
public class Plan_Virements
{
    [Key]
    public int VirementId { get; set; } = 0;

    public string? FinYear { get; set; }

    public int FromProjectId { get; set; }

    public int ToProjectId { get; set; }

    public int? FromSCOAProjectID { get; set; }

    public int? ToSCOAProjectID { get; set; }

    public int? FromSCOAFunctionId { get; set; }

    public int? ToSCOAFunctionId { get; set; }

    public int? FromDivisionId { get; set; }

    public int? ToDivisionId { get; set; }

    public int? FromSCOAFundID { get; set; }

    public int? ToSCOAFundID { get; set; }

    public int? FromSCOARegion { get; set; }

    public int? ToSCOARegion { get; set; }

    public int? FromSCOAItem { get; set; }

    public int? ToSCOAItem { get; set; }

    public string? ReasonForVirement { get; set; }

    public decimal? FromAvailableFund { get; set; }

    public decimal? FromVirementAmount { get; set; }

    public decimal? FromNewAvailableBudget { get; set; }

    public decimal? ToAvailableFund { get; set; }

    public decimal? ToVirementAmount { get; set; }

    public decimal? ToNewAvailableBudget { get; set; }

    public string? VirementReferenceNumber { get; set; }

    public int TransferBy { get; set; }

    public DateTime TransferOn { get; set; } = DateTime.UtcNow;

    public int CapturerID { get; set; }

    public DateTime DateCaptured { get; set; } = DateTime.UtcNow;

    public int? ModifierID { get; set; }

    public DateTime? DateModified { get; set; }

    public int? FromCapitalOperation { get; set; }

    public int? ToCapitalOperation { get; set; }

    public string? UploadedVirementDoc { get; set; }

    public bool? IsNewItemAdded { get; set; }

    public int? FromSCOACostingId { get; set; }

    public int? ToSCOACostingId { get; set; }

    public int? FromProjectItemId { get; set; }

    public int? ToProjectItemId { get; set; }

    public int? VirementStatus { get; set; }

    public string? FromUkey { get; set; }

    public int? FromPlanProjectItemID { get; set; }

    public string? ToUkey { get; set; }

    public int? ToPlanProjectItemID { get; set; }
}
