namespace MssqlApi.Models;

public class GlOutboxCreateRequest
{
    public Guid? OutboxId { get; set; }
    public int SubmoduleId { get; set; } = 8;
    public string EventType { get; set; } = "";
    public string DocumentNumber { get; set; } = "";
    public bool IsCashflow { get; set; } = false;
    public string Status { get; set; } = "PENDING";
}
