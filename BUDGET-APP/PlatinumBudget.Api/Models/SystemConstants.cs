using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PlatinumBudget.Api.Models;

[Table("Const_IDPLevelDescription_Detail")]
public class ConstIdpLevelDescriptionDetail
{
    [Key] public int IDPLevelDescDetail_ID { get; set; }
    public int? IDPLevelDescHeaderID { get; set; }
    public int? IDPLevelNumber { get; set; }
    public string? IDPLevelDesc { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? PreviousReferenceId { get; set; }
}

[Table("Const_IDPLevelDescription_Header")]
public class ConstIdpLevelDescriptionHeader
{
    [Key] public int IDPLevelDescHeader_ID { get; set; }
    public string? FinancialYear { get; set; }
    public int? IDPNumLevel { get; set; }
    public int? IDPLevelDescSubmitted { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? PreviousReferenceId { get; set; }
}

[Table("Const_IDPNationalKPA_Detail")]
public class ConstIdpNationalKpaDetail
{
    [Key] public int NationalKPADetail_ID { get; set; }
    public int? NationalKPAHeaderID { get; set; }
    public int? NationalKPANumber { get; set; }
    public string? NationalKPADesc { get; set; }
    public bool? NationalKPAEnabled { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? PreviousReferenceId { get; set; }
}

[Table("Const_IDPNationalKPA_Header")]
public class ConstIdpNationalKpaHeader
{
    [Key] public int NationalKPAHeader_ID { get; set; }
    public string? FinancialYear { get; set; }
    public bool? NationalKPASubmitted { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? PreviousReferenceId { get; set; }
}

[Table("IDP_Item")]
public class IdpItem
{
    [Key] public int Item_ID { get; set; }
    public string? ItemDesc { get; set; }
    public string? FinancialYear { get; set; }
    public int? ItemParentID { get; set; }
    public int? IDPLevelNumber { get; set; }
    public int? ItemOrderID { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? ModifierID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ActProjID { get; set; }
    public bool? isProj { get; set; }
    public int? KpiID { get; set; }
    public int? NationalKPADetailID { get; set; }
    public int? IDPInitialized { get; set; }
    public int? PreviousReferenceId { get; set; }
}

[Table("Const_SCOA_Function_Structure_Consolidated")]
public class ConstScoaFunctionStructureConsolidated
{
    [Key] public int ScoaID { get; set; }
    public long? FinYear { get; set; }
    public string? FinYearText { get; set; }
    public string? ScoaCode { get; set; }
    public int? LevelID { get; set; }
    public string? PostingLevel { get; set; }
    public string? BreakDownAllowed { get; set; }
    public string? ScoaDesc { get; set; }
    public string? ScoaShortDesc { get; set; }
    public int? ScoaParentID { get; set; }
    public bool? ParentID { get; set; }
    public string? NTGFSCode { get; set; }
    public string? NTVatStatus { get; set; }
    public string? NTSCOAFile { get; set; }
    public int? NTScoaLevel { get; set; }
    public string? NTExcelRowNumber { get; set; }
    public string? NTPrinciple { get; set; }
    public string? NTApplicableTo { get; set; }
    public string? NTPostingLevelDescription { get; set; }
    public string? NTScoaID { get; set; }
    public string? NTParentScoaId { get; set; }
    public bool? Enabled { get; set; }
    public string? Version { get; set; }
}

[Table("Const_SCOA_Funds_Structure_Consolidated")]
public class ConstScoaFundsStructureConsolidated
{
    [Key] public int ScoaID { get; set; }
    public long? FinYear { get; set; }
    public string? FinYearText { get; set; }
    public string? ScoaCode { get; set; }
    public int? LevelID { get; set; }
    public string? PostingLevel { get; set; }
    public string? BreakDownAllowed { get; set; }
    public string? ScoaDesc { get; set; }
    public string? ScoaShortDesc { get; set; }
    public int? ScoaParentID { get; set; }
    public bool? ParentID { get; set; }
    public string? NTGFSCode { get; set; }
    public string? NTVatStatus { get; set; }
    public string? NTSCOAFile { get; set; }
    public int? NTScoaLevel { get; set; }
    public string? NTExcelRowNumber { get; set; }
    public string? NTPrinciple { get; set; }
    public string? NTApplicableTo { get; set; }
    public string? NTPostingLevelDescription { get; set; }
    public string? NTScoaID { get; set; }
    public string? NTParentScoaId { get; set; }
    public bool? Enabled { get; set; }
    public string? Version { get; set; }
}

[Table("Const_SCOA_Project_Structure_Consolidated")]
public class ConstScoaProjectStructureConsolidated
{
    [Key] public int ScoaID { get; set; }
    public long? FinYear { get; set; }
    public string? FinYearText { get; set; }
    public string? ScoaCode { get; set; }
    public int? LevelID { get; set; }
    public string? PostingLevel { get; set; }
    public string? BreakDownAllowed { get; set; }
    public string? ScoaDesc { get; set; }
    public string? ScoaShortDesc { get; set; }
    public int? ScoaParentID { get; set; }
    public bool? ParentID { get; set; }
    public string? NTGFSCode { get; set; }
    public string? NTVatStatus { get; set; }
    public string? NTSCOAFile { get; set; }
    public int? NTScoaLevel { get; set; }
    public string? NTExcelRowNumber { get; set; }
    public string? NTPrinciple { get; set; }
    public string? NTApplicableTo { get; set; }
    public string? NTPostingLevelDescription { get; set; }
    public string? NTScoaID { get; set; }
    public string? NTParentScoaId { get; set; }
    public bool? Enabled { get; set; }
    public string? Version { get; set; }
}

[Table("Const_SCOA_Regional_Structure_Consolidated")]
public class ConstScoaRegionalStructureConsolidated
{
    [Key] public int ScoaID { get; set; }
    public long? FinYear { get; set; }
    public string? FinYearText { get; set; }
    public string? ScoaCode { get; set; }
    public int? LevelID { get; set; }
    public string? PostingLevel { get; set; }
    public string? BreakDownAllowed { get; set; }
    public string? ScoaDesc { get; set; }
    public string? ScoaShortDesc { get; set; }
    public int? ScoaParentID { get; set; }
    public bool? ParentID { get; set; }
    public string? NTGFSCode { get; set; }
    public string? NTVatStatus { get; set; }
    public string? NTSCOAFile { get; set; }
    public int? NTScoaLevel { get; set; }
    public string? NTExcelRowNumber { get; set; }
    public string? NTPrinciple { get; set; }
    public string? NTApplicableTo { get; set; }
    public string? NTPostingLevelDescription { get; set; }
    public string? NTScoaID { get; set; }
    public string? NTParentScoaId { get; set; }
    public bool? Enabled { get; set; }
    public string? Version { get; set; }
}

[Table("Const_SCOA_Structure_Consolidated")]
public class ConstScoaStructureConsolidated
{
    [Key] public int ScoaID { get; set; }
    public long? FinYear { get; set; }
    public string? FinYearText { get; set; }
    public string? ScoaCode { get; set; }
    public int? LevelID { get; set; }
    public string? PostingLevel { get; set; }
    public string? BreakDownAllowed { get; set; }
    public string? ScoaDesc { get; set; }
    public string? ScoaShortDesc { get; set; }
    public int? ScoaParentID { get; set; }
    public bool? ParentID { get; set; }
    public string? NTGFSCode { get; set; }
    public string? NTVatStatus { get; set; }
    public string? NTSCOAFile { get; set; }
    public int? NTScoaLevel { get; set; }
    public string? NTExcelRowNumber { get; set; }
    public string? NTPrinciple { get; set; }
    public string? NTApplicableTo { get; set; }
    public string? NTPostingLevelDescription { get; set; }
    public string? NTScoaID { get; set; }
    public string? NTParentScoaId { get; set; }
    public bool? Enabled { get; set; }
    public string? Version { get; set; }
    public int? TableID { get; set; }
    public string? TableName { get; set; }
    public int? VoteTypeID { get; set; }
    public bool? DebitCreditID { get; set; }
    public int? VatIndicatorID { get; set; }
    public bool? VatApportionment { get; set; }
    public int? CapitalTimePeriodID { get; set; }
    public bool? IsCapexVote { get; set; }
    public bool? IsControlVote { get; set; }
    public string? DefinitionDescription { get; set; }
}

[Table("Const_SCOA_Costing_Structure_Consolidated")]
public class ConstScoaCostingStructureConsolidated
{
    [Key]
    public int ScoaID { get; set; }
    public long? FinYear { get; set; }
    public string? FinYearText { get; set; }
    public string? ScoaCode { get; set; }
    public int? LevelID { get; set; }
    public string? PostingLevel { get; set; }
    public string? BreakDownAllowed { get; set; }
    public string? ScoaDesc { get; set; }
    public string? ScoaShortDesc { get; set; }
    public int? ScoaParentID { get; set; }
    public bool? ParentID { get; set; }
    public string? NTGFSCode { get; set; }
    public string? NTVatStatus { get; set; }
    public string? NTSCOAFile { get; set; }
    public int? NTScoaLevel { get; set; }
    public string? NTExcelRowNumber { get; set; }
    public string? NTPrinciple { get; set; }
    public string? NTApplicableTo { get; set; }
    public string? NTPostingLevelDescription { get; set; }
    public string? NTScoaID { get; set; }
    public string? NTParentScoaId { get; set; }
    public bool? Enabled { get; set; }
    public string? Version { get; set; }
}

[Table("Const_ProjectType")]
public class ConstProjectType
{
    [Key]
    public int ProjectType_ID { get; set; }
    public string? ProjectTypeDescrip { get; set; }
    public bool Enabled { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public string? FinYear { get; set; }
    public int? PreviousReferenceId { get; set; }
}

[Table("Const_Status")]
public class ConstStatus
{
    [Key]
    public int Status_ID { get; set; }
    public string? StatusDesc { get; set; }
    public string? UsedBy { get; set; }
    public bool Enabled { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
}
