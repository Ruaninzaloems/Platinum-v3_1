namespace PlatinumAFS.Api.DTOs;

public class GeneralLedgerSummaryDto
{
    public int ProcessingMonth { get; set; }
    public int EntryCount { get; set; }
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public decimal TotalBalance { get; set; }
}
