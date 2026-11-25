namespace PlatinumBudget.Api.Models;

public class ProjectImportBatch
{
    public int Id { get; set; }
    public string FinancialYear { get; set; } = string.Empty;
    public string ImportType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string Status { get; set; } = "Staged";
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public string CsvData { get; set; } = "[]";
    public int RowCount { get; set; }
    public int ErrorRecords { get; set; }
    public decimal TotalBudgetY1 { get; set; }
    public decimal TotalBudgetY2 { get; set; }
    public decimal TotalBudgetY3 { get; set; }
    public string CreatedBy { get; set; } = "System Admin";
}
