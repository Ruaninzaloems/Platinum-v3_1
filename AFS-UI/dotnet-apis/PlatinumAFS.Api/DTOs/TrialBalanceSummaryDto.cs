namespace PlatinumAFS.Api.DTOs;

public class TrialBalanceSummaryDto
{
    public string SortDesc { get; set; } = string.Empty;
    public int EntryCount { get; set; }
    public decimal TotalOpeningBalance { get; set; }
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public decimal TotalClosingBalance { get; set; }
    public decimal TotalBudgetOriginal { get; set; }
    public decimal TotalBudgetAdjusted { get; set; }
}
