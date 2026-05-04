namespace PlatinumOvertime_API.Models.Domain;

public class OvertimeTransactionDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OvertimeTransactionId { get; set; }
    public OvertimeTransaction? OvertimeTransaction { get; set; }

    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;

    public string? UploadedBy { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
