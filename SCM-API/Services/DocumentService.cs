using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class DocumentService : IDocumentService
{
    private readonly ILogger<DocumentService> _logger;

    public DocumentService(ILogger<DocumentService> logger) { _logger = logger; }

    public async Task<object?> GetByIdAsync(int id) => new { DocumentId = id };
    public async Task<PagedResult<object>> GetAllAsync(string? entityType, int? entityId, int page, int pageSize)
        => new PagedResult<object> { Items = new List<object>(), Page = page, PageSize = pageSize, TotalCount = 0 };
    public async Task<object> UploadAsync(object dto) { return dto; }
    public async Task<bool> DeleteAsync(int id) { return true; }
    public async Task<byte[]?> DownloadAsync(int id) { return null; }
    public async Task<object> GetDocumentTypesAsync()
        => new List<object>
        {
            new { Id = 1, Name = "Tax Clearance Certificate" },
            new { Id = 2, Name = "Company Registration" },
            new { Id = 3, Name = "B-BBEE Certificate" },
            new { Id = 4, Name = "Quote Document" },
            new { Id = 5, Name = "Invoice Document" }
        };
}
