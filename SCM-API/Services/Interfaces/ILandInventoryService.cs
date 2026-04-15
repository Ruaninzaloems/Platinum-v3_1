using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface ILandInventoryService
{
    Task<PagedResult<object>> GetPropertiesAsync(string? search, int? propertyType, int page, int pageSize);
    Task<object?> GetPropertyByIdAsync(int id);
    Task<object> CreatePropertyAsync(object dto);
    Task<bool> UpdatePropertyAsync(int id, object dto);
    Task<object> GetValuationsAsync(int propertyId);
    Task<object> GetLeasesAsync(int propertyId);
    Task<object> CreateLeaseAsync(object dto);
    Task<object> GetPropertyTypesAsync();
}
