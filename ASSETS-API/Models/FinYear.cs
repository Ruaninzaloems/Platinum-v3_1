namespace MssqlApi.Models;

public class FinYear
{
    public int ID { get; set; }
    public string? FinancialYear { get; set; }
    public bool? IsCurrent { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
