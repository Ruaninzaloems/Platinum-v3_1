namespace PlatinumAFS.Api.Models;

public class TrialBalanceEntry
{
    public int VoteID { get; set; }
    public string VoteNumber { get; set; } = string.Empty;
    public string? VoteDescription { get; set; }
    public string FinYear { get; set; } = string.Empty;
    public int? SCOAItemID { get; set; }
    public string? ScoaItemCode { get; set; }
    public string? ScoaItemShortDesc { get; set; }
    public string? ScoaItemDescription { get; set; }
    public int? ScoaItemLevelID { get; set; }
    public int? ScoaParentID { get; set; }
    public string? PostingLevel { get; set; }
    public string? PostingLevelParent { get; set; }
    public int? DebitCreditID { get; set; }
    public string? Level1 { get; set; }
    public string? Level2 { get; set; }
    public string? Level3 { get; set; }
    public string? Level4 { get; set; }
    public string? Level5 { get; set; }
    public string? Level6 { get; set; }
    public string? Level7 { get; set; }
    public string? ProjectCode { get; set; }
    public string? ScoaFundsCode { get; set; }
    public string? ScoaFundsDescription { get; set; }
    public string? ScoaFunctionCode { get; set; }
    public string? ScoaFunctionDescription { get; set; }
    public string? ScoaProjectCode { get; set; }
    public string? ScoaProjectDescription { get; set; }
    public string? ScoaCostingCode { get; set; }
    public string? ScoaCostingDescription { get; set; }
    public string? ScoaMunicipalClassificationCode { get; set; }
    public string? ScoaMunicipalClassificationDescription { get; set; }
    public string? ScoaRegionCode { get; set; }
    public string? ScoaRegionDescription { get; set; }
    public string? SortDesc { get; set; }
    public decimal BudgetOriginal { get; set; }
    public decimal BudgetAdjusted { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public decimal ClosingBalance { get; set; }
    public decimal DebitCloseBalance { get; set; }
    public decimal CreditCloseBalance { get; set; }
    public decimal PriorYear1Balance { get; set; }
    public decimal PriorYear2Balance { get; set; }
    public decimal PriorYear3Balance { get; set; }
}
