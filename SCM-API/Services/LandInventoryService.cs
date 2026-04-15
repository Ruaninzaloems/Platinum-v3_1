using SCM_API.Models.Common;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class LandInventoryService : ILandInventoryService
{
    private readonly ILogger<LandInventoryService> _logger;

    public LandInventoryService(ILogger<LandInventoryService> logger) { _logger = logger; }

    public async Task<PagedResult<object>> GetPropertiesAsync(string? search, int? propertyType, int page, int pageSize)
        => new PagedResult<object> { Items = new List<object>(), Page = page, PageSize = pageSize, TotalCount = 0 };
    public async Task<object?> GetPropertyByIdAsync(int id) => new { PropertyId = id };
    public async Task<object> CreatePropertyAsync(object dto) { return dto; }
    public async Task<bool> UpdatePropertyAsync(int id, object dto) { return true; }
    public async Task<object> GetValuationsAsync(int propertyId) => new List<object>();
    public async Task<object> GetLeasesAsync(int propertyId) => new List<object>();
    public async Task<object> CreateLeaseAsync(object dto) { return dto; }
    public async Task<object> GetPropertyTypesAsync()
        => new List<object>
        {
            new { Id = 1, Name = "Residential" },
            new { Id = 2, Name = "Commercial" },
            new { Id = 3, Name = "Industrial" },
            new { Id = 4, Name = "Agricultural" }
        };
}
