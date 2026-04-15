namespace AssetManagement.Models;

public class FinancialStatus
{
    public int FinStatusID { get; set; }
    public string? FinancialStatusDesc { get; set; }
    public int? Default { get; set; }
    public int Enabled { get; set; } = 1;
    public int? CreatedByID { get; set; }
    public DateTime? CreatedDate { get; set; }
    public int? ModifiedByID { get; set; }
    public DateTime? ModiefiedDate { get; set; }
}
