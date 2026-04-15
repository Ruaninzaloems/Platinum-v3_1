using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IDocumentService
{
    Task<object?> GetByIdAsync(int id);
    Task<PagedResult<object>> GetAllAsync(string? entityType, int? entityId, int page, int pageSize);
    Task<object> UploadAsync(object dto);
    Task<bool> DeleteAsync(int id);
    Task<byte[]?> DownloadAsync(int id);
    Task<object> GetDocumentTypesAsync();
}
