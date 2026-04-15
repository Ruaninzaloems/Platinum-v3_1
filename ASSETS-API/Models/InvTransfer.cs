namespace MssqlApi.Models;

public class InvTransfer
{
    public int InvTransfer_ID { get; set; }
    public string? FinYear { get; set; }
    public DateTime? TransferDate { get; set; }
    public bool? Enabled { get; set; }
}
