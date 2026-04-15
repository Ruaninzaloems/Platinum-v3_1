namespace PlatinumBudget.Api.Models;

public class Attachment
{
    public int Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public string DocType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public long FileSize { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public string? FileHash { get; set; }
    public string UploadedBy { get; set; } = string.Empty;
    public DateTime UploadedOn { get; set; } = DateTime.UtcNow;
}
