using SCM_API.Models.Common;

namespace SCM_API.Services.Interfaces;

public interface IWaterInventoryService
{
    Task<PagedResult<object>> GetMeterReadingsAsync(string? search, int? zoneId, int page, int pageSize);
    Task<object?> GetMeterReadingByIdAsync(int id);
    Task<object> CreateMeterReadingAsync(object dto);
    Task<bool> UpdateMeterReadingAsync(int id, object dto);
    Task<object> GetConsumptionReportAsync(int meterId, DateTime fromDate, DateTime toDate);
    Task<PagedResult<object>> GetMetersAsync(string? search, int page, int pageSize);
    Task<object> CreateMeterAsync(object dto);
    Task<object> GetZonesAsync();
}
