namespace PlatinumBudget.Api.Models;

public class FinancialYear
{
    public int Id { get; set; }
    public string YearCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;

    public ICollection<BudgetVersion> BudgetVersions { get; set; } = new List<BudgetVersion>();
}
