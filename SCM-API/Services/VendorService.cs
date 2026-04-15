using System.Text.Json;
using SCM_API.Helpers;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class VendorService : IVendorService
{
    private readonly IVendorRepository _repository;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<VendorService> _logger;

    public VendorService(IVendorRepository repository, DbAvailabilityChecker dbChecker, ILogger<VendorService> logger)
    {
        _repository = repository;
        _dbChecker = dbChecker;
        _logger = logger;
    }

    private bool UseDb => _dbChecker.IsDbAvailable;

    public async Task<object?> GetByIdAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                return await _repository.GetWithDetailsAsync(id);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for vendor {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }
        return null;
    }

    public async Task<PagedResult<object>> GetAllAsync(string? search, int? statusId, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Max(1, pageSize);

        if (UseDb)
        {
            try
            {
                var result = await _repository.GetFilteredAsync(search, statusId, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for vendors list, falling back");
                _dbChecker.MarkUnavailable();
            }
        }
        return new PagedResult<object> { Items = Enumerable.Empty<object>(), Page = page, PageSize = pageSize, TotalCount = 0 };
    }

    public async Task<object> CreateAsync(object dto)
    {
        if (UseDb)
        {
            try
            {
                var formData = ConvertToDict(dto);
                var entity = new Vendor
                {
                    VendorName = GetStr(formData, "vendorName") ?? GetStr(formData, "name"),
                    TradingName = GetStr(formData, "tradingName"),
                    RegistrationNumber = GetStr(formData, "registrationNumber"),
                    Email = GetStr(formData, "email"),
                    TelWork = GetStr(formData, "telWork") ?? GetStr(formData, "phone"),
                    VatRegistrationNumber = GetStr(formData, "vatRegistrationNumber") ?? GetStr(formData, "vatNumber"),
                    PostalAddress1 = GetStr(formData, "postalAddress1"),
                    PhysicalAddress1 = GetStr(formData, "physicalAddress1"),
                    Status = 1,
                    Enabled = true,
                    DateCaptured = DateTime.UtcNow,
                    CapturerId = 1
                };

                await _repository.AddAsync(entity);
                await _repository.SaveChangesAsync();
                _logger.LogInformation("Created vendor {Id} in DB", entity.VendorId);
                return entity;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for vendor, falling back");
                _dbChecker.MarkUnavailable();
            }
        }
        return dto;
    }

    public async Task<bool> UpdateAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id);
                if (entity == null) return false;

                var formData = ConvertToDict(dto);
                if (formData.ContainsKey("vendorName") || formData.ContainsKey("name"))
                    entity.VendorName = GetStr(formData, "vendorName") ?? GetStr(formData, "name");
                if (formData.ContainsKey("tradingName"))
                    entity.TradingName = GetStr(formData, "tradingName");
                if (formData.ContainsKey("registrationNumber"))
                    entity.RegistrationNumber = GetStr(formData, "registrationNumber");
                if (formData.ContainsKey("email"))
                    entity.Email = GetStr(formData, "email");
                if (formData.ContainsKey("phone") || formData.ContainsKey("telWork"))
                    entity.TelWork = GetStr(formData, "telWork") ?? GetStr(formData, "phone");
                if (formData.ContainsKey("vatRegistrationNumber") || formData.ContainsKey("vatNumber"))
                    entity.VatRegistrationNumber = GetStr(formData, "vatRegistrationNumber") ?? GetStr(formData, "vatNumber");

                _repository.Update(entity);
                await _repository.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB update failed for vendor {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }
        return true;
    }

    public async Task<object> GetVendorBankDetailsAsync(int vendorId)
    {
        if (UseDb)
        {
            try
            {
                return await _repository.GetBankDetailsAsync(vendorId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for vendor bank details {Id}, falling back", vendorId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new List<object>();
    }

    public async Task<object> GetVendorDirectorsAsync(int vendorId)
    {
        if (UseDb)
        {
            try
            {
                return await _repository.GetDirectorsAsync(vendorId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for vendor directors {Id}, falling back", vendorId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new List<object>();
    }

    public async Task<object> GetVendorDocumentsAsync(int vendorId) => new List<object>();
    public async Task<object> GetVendorAccreditationsAsync(int vendorId) => new List<object>();
    public async Task<object> GetVendorCommoditiesAsync(int vendorId) => new List<object>();

    public async Task<bool> ActivateAsync(int vendorId)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(vendorId);
                if (entity == null) return false;
                entity.Status = 1;
                _repository.Update(entity);
                await _repository.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB activate failed for vendor {Id}, falling back", vendorId);
                _dbChecker.MarkUnavailable();
            }
        }
        return false;
    }

    public async Task<bool> DeactivateAsync(int vendorId)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(vendorId);
                if (entity == null) return false;
                entity.Status = 2;
                _repository.Update(entity);
                await _repository.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB deactivate failed for vendor {Id}, falling back", vendorId);
                _dbChecker.MarkUnavailable();
            }
        }
        return false;
    }

    public async Task<bool> BlacklistAsync(int vendorId, object blacklistDto)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(vendorId);
                if (entity == null) return false;
                entity.Status = 3;
                entity.IsNtBlackList = true;
                entity.BlackListedFromDate = DateTime.UtcNow;

                var formData = ConvertToDict(blacklistDto);
                if (formData.ContainsKey("reason"))
                    entity.BlackListReason = GetStr(formData, "reason");

                _repository.Update(entity);
                await _repository.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB blacklist failed for vendor {Id}, falling back", vendorId);
                _dbChecker.MarkUnavailable();
            }
        }
        return false;
    }

    private static Dictionary<string, object> ConvertToDict(object dto)
    {
        if (dto is Dictionary<string, object> dict) return dict;
        if (dto is JsonElement je) return ConvertJsonElement(je);
        var json = JsonSerializer.Serialize(dto);
        var parsed = JsonSerializer.Deserialize<JsonElement>(json);
        return ConvertJsonElement(parsed);
    }

    private static Dictionary<string, object> ConvertJsonElement(JsonElement el)
    {
        var dict = new Dictionary<string, object>();
        if (el.ValueKind == JsonValueKind.Object)
        {
            foreach (var prop in el.EnumerateObject())
            {
                dict[prop.Name] = prop.Value.ValueKind switch
                {
                    JsonValueKind.String => prop.Value.GetString()!,
                    JsonValueKind.Number => prop.Value.GetDecimal(),
                    JsonValueKind.True => true,
                    JsonValueKind.False => false,
                    JsonValueKind.Null => null!,
                    _ => prop.Value.ToString()
                };
            }
        }
        return dict;
    }

    private static string? GetStr(Dictionary<string, object> d, string key) =>
        d.TryGetValue(key, out var v) ? v?.ToString() : null;
}
