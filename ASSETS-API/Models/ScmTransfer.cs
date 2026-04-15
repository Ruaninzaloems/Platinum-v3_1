namespace MssqlApi.Models;

public class ScmTransfer
{
    public int ScmTransfer_ID { get; set; }
    public string? FinYear { get; set; }
    public DateTime? TransferDate { get; set; }
    public bool? Enabled { get; set; }
}
