namespace PlatinumAFS.Api.DTOs;

public class DocumentTypeSummaryDto
{
    public string? DocumentType { get; set; }
    public int DocumentCount { get; set; }
    public int LineItemCount { get; set; }
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public decimal NetAmount { get; set; }
}

public class DocumentMonthlySummaryDto
{
    public int ProcessingMonth { get; set; }
    public int DocumentCount { get; set; }
    public int LineItemCount { get; set; }
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
}

public class DocumentSupplierSummaryDto
{
    public string? SupplierNo { get; set; }
    public string? SupplierName { get; set; }
    public int DocumentCount { get; set; }
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public decimal NetAmount { get; set; }
}

public class DocumentOverviewDto
{
    public string? FinYear { get; set; }
    public int TotalDocuments { get; set; }
    public int TotalLineItems { get; set; }
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public List<DocumentTypeSummaryDto> ByType { get; set; } = new();
    public List<DocumentMonthlySummaryDto> ByMonth { get; set; } = new();
    public List<DocumentSupplierSummaryDto> TopSuppliers { get; set; } = new();
}
