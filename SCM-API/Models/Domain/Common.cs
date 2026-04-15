using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SCM_API.Models.Domain;

[Table("Const_Department")]
public class Department
{
    [Key]
    [Column("Department_ID")]
    public int DepartmentId { get; set; }

    [Column("DepartmentDesc")]
    public string? DepartmentDesc { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }
}

[Table("Const_Division")]
public class Division
{
    [Key]
    [Column("Division_ID")]
    public int DivisionId { get; set; }

    [Column("DivisionDesc")]
    public string? DivisionDesc { get; set; }

    [Column("DepartmentID")]
    public int? DepartmentId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }
}

[Table("Payroll_Employee")]
public class Employee
{
    [Key]
    [Column("Employee_ID")]
    public int EmployeeId { get; set; }

    [Column("FirstName")]
    public string? FirstName { get; set; }

    [Column("Surname")]
    public string? Surname { get; set; }

    [Column("Email")]
    public string? Email { get; set; }

    [Column("DepartmentID")]
    public int? DepartmentId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }
}

[Table("Const_Store")]
public class Store
{
    [Key]
    [Column("Store_ID")]
    public int StoreId { get; set; }

    [Column("StoreName")]
    public string? StoreName { get; set; }

    [Column("StoreDescription")]
    public string? StoreDescription { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }
}

[Table("Led_Vote")]
public class Vote
{
    [Key]
    [Column("Vote_ID")]
    public int VoteId { get; set; }

    [Column("VoteNumber")]
    public string? VoteNumber { get; set; }

    [Column("VoteDesc")]
    public string? VoteDesc { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }
}

[Table("Const_SCMVendorStatus_sys")]
public class ScmVendorStatus
{
    [Key]
    [Column("Status_ID")]
    public int StatusId { get; set; }

    [Column("StatusName")]
    public string? StatusName { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }
}

[Table("Const_Bank")]
public class Bank
{
    [Key]
    [Column("Bank_ID")]
    public int BankId { get; set; }

    [Column("BankDesc")]
    public string? BankName { get; set; }

    [Column("Enabled")]
    public bool Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("CapturerID")]
    public int CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("BankLogo")]
    public string? BankLogo { get; set; }

    [Column("IsuseAccountStatment")]
    public bool IsuseAccountStatement { get; set; }

    [Column("CSDCode")]
    public string? CsdCode { get; set; }
}

[Table("Const_FinancialYear")]
public class FinancialYear
{
    [Key]
    [Column("FinancialYear_ID")]
    public int FinancialYearId { get; set; }

    [Column("FinancialYearName")]
    public string? FinancialYearName { get; set; }

    [Column("IsActive")]
    public bool? IsActive { get; set; }
}

[Table("AAAA_ConfigSettings")]
public class ConfigSetting
{
    [Key]
    [Column("ConfigSettID")]
    public int ConfigSettId { get; set; }

    [Column("KeyName")]
    public string? KeyName { get; set; }

    [Column("KeyValue")]
    public string? KeyValue { get; set; }

    [Column("KeyDescription")]
    public string? KeyDescription { get; set; }

    [Column("Module")]
    public string? Module { get; set; }
}

[Table("SCM_Notification")]
public class Notification
{
    [Key]
    [Column("Notification_ID")]
    public int NotificationId { get; set; }

    [Column("NotificationName")]
    public string? NotificationName { get; set; }

    [Column("NotificationType")]
    public string? NotificationType { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("SCM_NotificationDetail")]
public class NotificationDetail
{
    [Key]
    [Column("ID")]
    public int Id { get; set; }

    [Column("NotificationID")]
    public int? NotificationId { get; set; }

    [Column("UserId")]
    public int? UserId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("Sys_AuditLog")]
public class AuditLog
{
    [Key]
    [Column("Audit_ID")]
    public int AuditLogId { get; set; }

    [Column("UserID")]
    public int UserId { get; set; }

    [Column("AuditDesc")]
    public string AuditDesc { get; set; } = "";

    [Column("AuditDate")]
    public DateTime AuditDate { get; set; }

    [Column("AuditComment")]
    public string? AuditComment { get; set; }

    [Column("ActiveFinYear_UserFinYear")]
    public string? ActiveFinYearUserFinYear { get; set; }

    [Column("TableName")]
    public string TableName { get; set; } = "";

    [Column("ModuleID")]
    public int ModuleId { get; set; }

    [Column("RecordID")]
    public int? RecordId { get; set; }

    [Column("AuditID")]
    public int? AuditId { get; set; }

    [Column("AuditGuid")]
    public Guid AuditGuid { get; set; }
}

[Table("SCM_Document")]
public class Document
{
    [Key]
    [Column("Document_ID")]
    public int DocumentId { get; set; }

    [Column("DocumentName")]
    public string? DocumentName { get; set; }

    [Column("DocumentPath")]
    public string? DocumentPath { get; set; }

    [Column("DocumentType")]
    public string? DocumentType { get; set; }

    [Column("EntityType")]
    public string? EntityType { get; set; }

    [Column("EntityId")]
    public int? EntityId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("SCM_GeneralRequest")]
public class GeneralRequest
{
    [Key]
    [Column("GenRequestID")]
    public int GenRequestId { get; set; }

    [Column("DateRequested")]
    public DateTime? DateRequested { get; set; }

    [Column("RequestedBy")]
    public int? RequestedBy { get; set; }

    [Column("OfflineReferenceNo")]
    public string? OfflineReferenceNo { get; set; }

    [Column("RequestTypeID")]
    public int? RequestTypeId { get; set; }

    [Column("ScmRequisitionID")]
    public int? ScmRequisitionId { get; set; }

    [Column("InvRequisitionID")]
    public int? InvRequisitionId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("FinYear")]
    public string? FinYear { get; set; }

    [Column("Description")]
    public string? Description { get; set; }
}

[Table("SCM_DeviationsRegister")]
public class DeviationsRegister
{
    [Key]
    [Column("DeviationsRegister_ID")]
    public int DeviationsRegisterId { get; set; }

    [Column("RequisitionID")]
    public int? RequisitionId { get; set; }

    [Column("OrderID")]
    public int? OrderId { get; set; }

    [Column("CaptureDate")]
    public DateTime? CaptureDate { get; set; }

    [Column("Deviation_Amount")]
    public decimal? DeviationAmount { get; set; }

    [Column("ReqAuthorisedBy")]
    public int? ReqAuthorisedBy { get; set; }

    [Column("OrderAuthorisedBy")]
    public int? OrderAuthorisedBy { get; set; }

    [Column("AuthorisedExpenditure_Indicator")]
    public string? AuthorisedExpenditureIndicator { get; set; }

    [Column("DocumentID")]
    public int? DocumentId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("SCM_UnauthorisedExpenditureRegister")]
public class UnauthorisedExpenditureRegister
{
    [Key]
    [Column("UnauthorizedExpenditureRegister_ID")]
    public int UnauthorizedExpenditureRegisterId { get; set; }

    [Column("ProjectID")]
    public int? ProjectId { get; set; }

    [Column("AuthorisedBy")]
    public int? AuthorisedBy { get; set; }

    [Column("Total_AnnualBudget")]
    public decimal? TotalAnnualBudget { get; set; }

    [Column("UnauthorisedAmount")]
    public decimal? UnauthorisedAmount { get; set; }

    [Column("VendorID")]
    public int? VendorId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("Const_UserDashboardConfiguration")]
public class UserDashboardConfiguration
{
    [Key]
    [Column("Id")]
    public int Id { get; set; }

    [Column("DivName")]
    public string? DivName { get; set; }

    [Column("UserId")]
    public int? UserId { get; set; }

    [Column("ModuleId")]
    public int? ModuleId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }
}

[Table("Const_SCMPreferencePointThreshold_Sys")]
public class ScmPreferencePointThreshold
{
    [Key]
    [Column("Preference_ID")]
    public int PreferenceId { get; set; }

    [Column("EvalMenthodName")]
    public string EvalMethodName { get; set; } = "";

    [Column("Minimum")]
    public decimal Minimum { get; set; }

    [Column("Maximum")]
    public decimal Maximum { get; set; }

    [Column("PricePercent")]
    public int PricePercent { get; set; }

    [Column("BEEPercent")]
    public int BeePercent { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("CaptureID")]
    public int CaptureId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }
}

[Table("Const_SCMDeviationMotivation")]
public class ScmDeviationMotivation
{
    [Key]
    [Column("SCMMotivation_ID")]
    public int ScmMotivationId { get; set; }

    [Column("Motivation")]
    public string Motivation { get; set; } = "";

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("MotivationId")]
    public string? MotivationId { get; set; }

    [Column("FirstLevelReq")]
    public bool? FirstLevelReq { get; set; }

    [Column("SecLevelReq")]
    public bool? SecLevelReq { get; set; }

    [Column("ThirLevelReq")]
    public bool? ThirdLevelReq { get; set; }

    [Column("FourtLevelReq")]
    public bool? FourthLevelReq { get; set; }

    [Column("FifthLevelReq")]
    public bool? FifthLevelReq { get; set; }
}

[Table("Const_SCMDeviationApproval")]
public class ScmDeviationApproval
{
    [Key]
    [Column("SCMDeviationApprove_ID")]
    public int ScmDeviationApproveId { get; set; }

    [Column("ApprovalLevel")]
    public string? ApprovalLevel { get; set; }

    [Column("ApprovalLeveDesc")]
    public string? ApprovalLevelDesc { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }
}

[Table("Const_SCMEvalutionMethod_sys")]
public class ScmEvaluationMethod
{
    [Key]
    [Column("EvalutionMethod_ID")]
    public int EvaluationMethodId { get; set; }

    [Column("EvalutionMethod")]
    public string? EvaluationMethod { get; set; }

    [Column("Enabled")]
    public bool Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("CapturerID")]
    public int CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }
}

[Table("Const_SCMServiceType_sys")]
public class ScmServiceType
{
    [Key]
    [Column("ServiceType_ID")]
    public int ServiceTypeId { get; set; }

    [Column("ServiceType")]
    public string? ServiceType { get; set; }

    [Column("Enabled")]
    public bool Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("CapturerID")]
    public int CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }
}

[Table("Const_SCMTenderApproval")]
public class ScmTenderApproval
{
    [Key]
    [Column("SCMTenderApproval_ID")]
    public int ScmTenderApprovalId { get; set; }

    [Column("ApprovalLevel")]
    public string? ApprovalLevel { get; set; }

    [Column("ApprovalLeveDesc")]
    public string? ApprovalLevelDesc { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("ApprovalType")]
    public string ApprovalType { get; set; } = "";

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("ApprovalSequence")]
    public int? ApprovalSequence { get; set; }
}

[Table("Const_SCMApprovalType_sys")]
public class ScmApprovalType
{
    [Key]
    [Column("ApprovalType_ID")]
    public int ApprovalTypeId { get; set; }

    [Column("ApprovalType")]
    public string? ApprovalType { get; set; }

    [Column("Enabled")]
    public bool Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("CapturerID")]
    public int CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }
}

[Table("Const_SCMProcurementGoalsSetup")]
public class ScmProcurementGoal
{
    [Key]
    [Column("ProcurementGoals_ID")]
    public int ProcurementGoalsId { get; set; }

    [Column("ProcurementGoal")]
    public string? ProcurementGoal { get; set; }

    [Column("Description")]
    public string? Description { get; set; }

    [Column("EnabledForInformalTender")]
    public bool? EnabledForInformalTender { get; set; }

    [Column("EnabledForTender")]
    public bool? EnabledForTender { get; set; }

    [Column("EnabledForQuotation")]
    public bool? EnabledForQuotation { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CaptureID")]
    public int? CaptureId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }
}

[Table("SCM_ProcessBoundary")]
public class ProcessBoundary
{
    [Key]
    [Column("ProcessBoundary_ID")]
    public int ProcessBoundaryId { get; set; }

    [Column("Method")]
    public string? Method { get; set; }

    [Column("Label")]
    public string? Label { get; set; }

    [Column("RangeFrom")]
    public decimal? RangeFrom { get; set; }

    [Column("RangeTo")]
    public decimal? RangeTo { get; set; }

    [Column("MinQuotes")]
    public int? MinQuotes { get; set; }

    [Column("Scoring")]
    public string? Scoring { get; set; }

    [Column("AdvertDays")]
    public int? AdvertDays { get; set; }

    [Column("Committees")]
    public string? Committees { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("Description")]
    public string? Description { get; set; }

    [Column("VatInclusive")]
    public bool? VatInclusive { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }
}

[Table("SCM_DemandPlan")]
public class DemandPlan
{
    [Key]
    [Column("DemandPlan_ID")]
    public int DemandPlanId { get; set; }

    [Column("DepartmentID")]
    public int? DepartmentId { get; set; }

    [Column("FinancialYear")]
    public string? FinancialYear { get; set; }

    [Column("Description")]
    public string? Description { get; set; }

    [Column("StatusID")]
    public int? StatusId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("CapturerID")]
    public int? CapturerId { get; set; }

    [Column("Title")]
    public string? Title { get; set; }

    [Column("ReferenceNumber")]
    public string? ReferenceNumber { get; set; }

    [Column("Vote")]
    public string? Vote { get; set; }

    [Column("TotalBudget")]
    public decimal? TotalBudget { get; set; }

    [Column("TotalDemand")]
    public decimal? TotalDemand { get; set; }

    [Column("IdpReference")]
    public string? IdpReference { get; set; }

    [Column("IdpObjective")]
    public string? IdpObjective { get; set; }

    [Column("SdbipReference")]
    public string? SdbipReference { get; set; }

    [Column("SdbipIndicator")]
    public string? SdbipIndicator { get; set; }

    [Column("Priority")]
    public string? Priority { get; set; }

    [Column("RiskLevel")]
    public string? RiskLevel { get; set; }

    [Column("Notes")]
    public string? Notes { get; set; }

    [Column("CreatedBy")]
    public string? CreatedBy { get; set; }

    [Column("CreatedByName")]
    public string? CreatedByName { get; set; }

    [Column("ReviewedByName")]
    public string? ReviewedByName { get; set; }

    [Column("ReviewedDate")]
    public DateTime? ReviewedDate { get; set; }

    [Column("ApprovedByName")]
    public string? ApprovedByName { get; set; }

    [Column("ApprovedDate")]
    public DateTime? ApprovedDate { get; set; }

    [Column("RejectionReason")]
    public string? RejectionReason { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    public List<DemandPlanItem> Items { get; set; } = new();
}

[Table("SCM_DemandPlanItem")]
public class DemandPlanItem
{
    [Key]
    [Column("DemandPlanItem_ID")]
    public int DemandPlanItemId { get; set; }

    [Column("DemandPlan_ID")]
    public int DemandPlanId { get; set; }

    [Column("Description")]
    public string? Description { get; set; }

    [Column("Quantity")]
    public int? Quantity { get; set; }

    [Column("UnitOfMeasure")]
    public string? UnitOfMeasure { get; set; }

    [Column("UnitPrice")]
    public decimal? UnitPrice { get; set; }

    [Column("EstimatedValue")]
    public decimal? EstimatedValue { get; set; }

    [Column("Category")]
    public string? Category { get; set; }

    [Column("ProcurementMethod")]
    public string? ProcurementMethod { get; set; }

    [Column("Priority")]
    public string? Priority { get; set; }

    [Column("DeliveryQuarter")]
    public string? DeliveryQuarter { get; set; }

    [Column("StatusDesc")]
    public string? Status { get; set; }

    [Column("MscoaSegment")]
    public string? MscoaSegment { get; set; }

    [Column("NeedsAssessmentId")]
    public string? NeedsAssessmentId { get; set; }

    [Column("SpecificationId")]
    public string? SpecificationId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    public DemandPlan? DemandPlan { get; set; }
}

[Table("SCM_NeedsAssessment")]
public class NeedsAssessment
{
    [Key]
    [Column("NeedsAssessment_ID")]
    public int NeedsAssessmentId { get; set; }

    [Column("ReferenceNumber")]
    public string? ReferenceNumber { get; set; }

    [Column("Title")]
    public string? Title { get; set; }

    [Column("DepartmentID")]
    public int? DepartmentId { get; set; }

    [Column("Priority")]
    public string? Priority { get; set; }

    [Column("Justification")]
    public string? Justification { get; set; }

    [Column("CurrentSituation")]
    public string? CurrentSituation { get; set; }

    [Column("ProposedSolution")]
    public string? ProposedSolution { get; set; }

    [Column("EstimatedCost")]
    public decimal? EstimatedCost { get; set; }

    [Column("StatusDesc")]
    public string? Status { get; set; }

    [Column("RiskFactors")]
    public string? RiskFactors { get; set; }

    [Column("CreatedBy")]
    public string? CreatedBy { get; set; }

    [Column("CreatedByName")]
    public string? CreatedByName { get; set; }

    [Column("DateCaptured")]
    public DateTime? DateCaptured { get; set; }

    [Column("Category")]
    public string? Category { get; set; }

    [Column("LinkedPlanId")]
    public string? LinkedPlanId { get; set; }

    [Column("Enabled")]
    public bool? Enabled { get; set; }
}

[Table("SCM_InformalTender")]
public class InformalTender
{
    [Key]
    [Column("InformalTender_ID")]
    public int InformalTenderId { get; set; }

    [Column("Comments")]
    public string? Comments { get; set; }

    [Column("ServiceTypeID")]
    public int? ServiceTypeId { get; set; }

    [Column("RegionID")]
    public int? RegionId { get; set; }

    [Column("DepartmentID")]
    public int? DepartmentId { get; set; }

    [Column("ProvenceID")]
    public int? ProvinceId { get; set; }

    [Column("TownID")]
    public int? TownId { get; set; }

    [Column("OpeningDate")]
    public DateTime OpeningDate { get; set; }

    [Column("ClosingDate")]
    public DateTime ClosingDate { get; set; }

    [Column("ClosingTime")]
    public string ClosingTime { get; set; } = "12:00";

    [Column("PersonName")]
    public string PersonName { get; set; } = "";

    [Column("PersonEmail")]
    public string PersonEmail { get; set; } = "";

    [Column("PersonTel")]
    public string PersonTel { get; set; } = "";

    [Column("SubDepartmentID")]
    public int? SubDepartmentId { get; set; }

    [Column("OrderNo")]
    public string? OrderNo { get; set; }

    [Column("Approved")]
    public bool? Approved { get; set; }

    [Column("Cancel")]
    public bool? Cancel { get; set; }

    [Column("ApprovedReason")]
    public string? ApprovedReason { get; set; }

    [Column("CancelReason")]
    public string? CancelReason { get; set; }

    [Column("Enabled")]
    public bool Enabled { get; set; } = true;

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("CapturerID")]
    public int CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("InformalTenderNumber")]
    public string? InformalTenderNumber { get; set; }

    [Column("SubSectorID")]
    public int? SubSectorId { get; set; }

    [Column("EstimatedCost")]
    public decimal EstimatedCost { get; set; }

    [Column("ApprovedBy")]
    public int? ApprovedBy { get; set; }

    [Column("ApprovedDate")]
    public DateTime? ApprovedDate { get; set; }

    [Column("CancelBy")]
    public int? CancelBy { get; set; }

    [Column("CancelDate")]
    public DateTime? CancelDate { get; set; }

    [Column("CompulsoryCertifications")]
    public string? CompulsoryCertifications { get; set; }

    [Column("ServiceContract")]
    public bool ServiceContract { get; set; }

    [Column("FinancialYear")]
    public string FinancialYear { get; set; } = "";

    [Column("StatusId")]
    public int StatusId { get; set; }

    [Column("ReQuotation")]
    public bool? ReQuotation { get; set; }

    [Column("MarsQuoteNum")]
    public string? MarsQuoteNum { get; set; }

    [Column("PreviousInformalTenderID")]
    public int? PreviousInformalTenderId { get; set; }

    public ICollection<InformalTenderVendor>? Vendors { get; set; }
}

[Table("SCM_InformalTenderVendor")]
public class InformalTenderVendor
{
    [Key]
    [Column("Email_ID")]
    public int EmailId { get; set; }

    [Column("InformalTenderID")]
    public int InformalTenderId { get; set; }

    [Column("VendorID")]
    public int VendorId { get; set; }

    [Column("EmailText")]
    public string? EmailText { get; set; }

    [Column("Cost")]
    public decimal? Cost { get; set; }

    [Column("Successful")]
    public bool? Successful { get; set; }

    [Column("NoResponse")]
    public bool? NoResponse { get; set; }

    [Column("NonCompliant")]
    public bool? NonCompliant { get; set; }

    [Column("NonComplianceReason")]
    public string? NonComplianceReason { get; set; }

    [Column("Resend")]
    public bool? Resend { get; set; }

    [Column("Enabled")]
    public bool Enabled { get; set; } = true;

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("CapturerID")]
    public int CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("EmailSubject")]
    public string? EmailSubject { get; set; }

    [Column("Send")]
    public bool? Send { get; set; }

    [Column("IsHistory")]
    public bool? IsHistory { get; set; }

    [Column("FurthurRequestComment")]
    public string? FurtherRequestComment { get; set; }

    [Column("FurthurRequestApproveBy")]
    public int? FurtherRequestApproveBy { get; set; }

    [Column("FurthurRequestDate")]
    public DateTime? FurtherRequestDate { get; set; }

    [Column("IsApprovedSentStatus")]
    public bool? IsApprovedSentStatus { get; set; }

    [Column("SystemGenerated")]
    public bool? SystemGenerated { get; set; }

    [Column("ReasonForSelectingVendor")]
    public string? ReasonForSelectingVendor { get; set; }

    [ForeignKey("InformalTenderId")]
    public InformalTender? InformalTender { get; set; }
}

[Table("User_UserDetail")]
public class User
{
    [Key]
    [Column("User_ID")]
    public int UserId { get; set; }

    [Column("UserName")]
    public string UserName { get; set; } = "";

    [Column("Password")]
    public string Password { get; set; } = "";

    [Column("Company")]
    public string? Company { get; set; }

    [Column("TelNo")]
    public string? TelNo { get; set; }

    [Column("eMail")]
    public string? Email { get; set; }

    [Column("FirstName")]
    public string FirstName { get; set; } = "";

    [Column("LastName")]
    public string LastName { get; set; } = "";

    [Column("EmpID")]
    public int? EmpId { get; set; }

    [Column("DepartmentID")]
    public int? DepartmentId { get; set; }

    [Column("Enabled")]
    public bool Enabled { get; set; }

    [Column("TotalLogin")]
    public int? TotalLogin { get; set; }

    [Column("LastLoginDate")]
    public DateTime? LastLoginDate { get; set; }

    [Column("sendSMS")]
    public bool? SendSms { get; set; }

    [Column("SuperUser")]
    public bool SuperUser { get; set; }

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("CapturerID")]
    public int CapturerId { get; set; }

    [Column("PasswordNeverExpire")]
    public bool PasswordNeverExpire { get; set; }

    [Column("PasswordLastChangedDate")]
    public DateTime PasswordLastChangedDate { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("TemporaryPassword")]
    public bool? TemporaryPassword { get; set; }

    [Column("CashFloat")]
    public decimal CashFloat { get; set; }

    [Column("StartDate")]
    public DateTime? StartDate { get; set; }

    [Column("EndDate")]
    public DateTime? EndDate { get; set; }

    [Column("HistoricUser")]
    public string? HistoricUser { get; set; }

    [Column("TransactionPassword")]
    public string? TransactionPassword { get; set; }

    [Column("SignatureFilePath")]
    public string? SignatureFilePath { get; set; }

    [Column("SignatureUploadedOn")]
    public DateTime? SignatureUploadedOn { get; set; }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<UserTransactionAuthorize> TransactionAuthorizations { get; set; } = new List<UserTransactionAuthorize>();
}

[Table("User_UserRoles")]
public class UserRole
{
    [Column("UserID")]
    public int UserId { get; set; }

    [Column("RoleID")]
    public int RoleId { get; set; }

    [Column("DelegatedByUserID")]
    public int? DelegatedByUserId { get; set; }

    [Column("DelegationStart")]
    public DateTime? DelegationStart { get; set; }

    [Column("DelegationExpiry")]
    public DateTime? DelegationExpiry { get; set; }

    public User? User { get; set; }
    public SysRoleName? Role { get; set; }
}

[Table("User_TransactionAuthorize")]
public class UserTransactionAuthorize
{
    [Key]
    [Column("TransactionAuthorize_ID")]
    public int TransactionAuthorizeId { get; set; }

    [Column("UserID")]
    public int UserId { get; set; }

    [Column("TransactionTypeID")]
    public int? TransactionTypeId { get; set; }

    [Column("MaxValue")]
    public decimal MaxValue { get; set; }

    [Column("DateCaptured")]
    public DateTime DateCaptured { get; set; }

    [Column("CapturerID")]
    public int CapturerId { get; set; }

    [Column("DateModified")]
    public DateTime? DateModified { get; set; }

    [Column("ModifierID")]
    public int? ModifierId { get; set; }

    [Column("JournalTransactionTypeID")]
    public int? JournalTransactionTypeId { get; set; }

    [Column("SCMTransactionTypeID")]
    public int? ScmTransactionTypeId { get; set; }

    [Column("PayrollTransactionTypeID")]
    public int? PayrollTransactionTypeId { get; set; }

    [Column("DivisionID")]
    public int? DivisionId { get; set; }

    [Column("InventoryTransactionTypeID")]
    public int? InventoryTransactionTypeId { get; set; }

    [Column("MinValue")]
    public decimal? MinValue { get; set; }

    public User? User { get; set; }
}
