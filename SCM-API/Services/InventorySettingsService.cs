using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Helpers;
using SCM_API.Models.Domain;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class InventorySettingsService : IInventorySettingsService
{
    private readonly ApplicationDbContext _context;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<InventorySettingsService> _logger;

    private bool UseDb => _dbChecker.IsDbAvailable;

    public InventorySettingsService(ApplicationDbContext context, DbAvailabilityChecker dbChecker, ILogger<InventorySettingsService> logger)
    {
        _context = context;
        _dbChecker = dbChecker;
        _logger = logger;
    }

    public async Task<object> GetSettingsAsync(string settingType)
    {
        if (UseDb)
        {
            try
            {
                return settingType switch
                {
                    "bin-codes" => await _context.AutoBinCodes.ToListAsync(),
                    "classifications" => await _context.CommodityClassifications.ToListAsync(),
                    "commodity-types" => await _context.CommodityTypes.ToListAsync(),
                    "commodity-sub-types" => await _context.CommoditySubTypes.ToListAsync(),
                    "type-subtype-mappings" => await _context.CommodityTypeSubTypeMappings.ToListAsync(),
                    "units-of-issue" => await _context.UnitsOfIssue.ToListAsync(),
                    "measure-groups" => await _context.MeasureGroupCategories.ToListAsync(),
                    "scoa-item-setup" => await _context.InventoryScoaItemSetups.ToListAsync(),
                    "classification-scoa" => await _context.CommodityClassificationScoaItems.ToListAsync(),
                    "classification-expense" => await _context.CommodityClassificationScoaExpenses.ToListAsync(),
                    "cost-formula" => await _context.CommodityClassificationScoaCostFormulas.ToListAsync(),
                    "month-end" => await _context.InvenMonthEnds.ToListAsync(),
                    "take-on-settings" => await _context.InvenTakeOnSettings.ToListAsync(),
                    "store-permissions" => await _context.UserStorePermissions.ToListAsync(),
                    "water-route-names" => await _context.WaterRouteNames.ToListAsync(),
                    "water-routes" => await _context.WaterRoutes.ToListAsync(),
                    "water-route-nodes" => await _context.WaterRouteNodes.ToListAsync(),
                    "reporting" => await _context.InventoryReportings.ToListAsync(),
                    _ => new List<object>()
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB unavailable for inventory settings {Type}", settingType);
                _dbChecker.MarkUnavailable();
            }
        }
        return GetFallback(settingType);
    }

    public async Task<object?> GetSettingByIdAsync(string settingType, int id)
    {
        if (UseDb)
        {
            try
            {
                return settingType switch
                {
                    "bin-codes" => await _context.AutoBinCodes.FindAsync(id) as object,
                    "classifications" => await _context.CommodityClassifications.FindAsync(id),
                    "commodity-types" => await _context.CommodityTypes.FindAsync(id),
                    "commodity-sub-types" => await _context.CommoditySubTypes.FindAsync(id),
                    "type-subtype-mappings" => await _context.CommodityTypeSubTypeMappings.FindAsync(id),
                    "units-of-issue" => await _context.UnitsOfIssue.FindAsync(id),
                    "measure-groups" => await _context.MeasureGroupCategories.FindAsync(id),
                    "scoa-item-setup" => await _context.InventoryScoaItemSetups.FindAsync(id),
                    "classification-scoa" => await _context.CommodityClassificationScoaItems.FindAsync(id),
                    "classification-expense" => await _context.CommodityClassificationScoaExpenses.FindAsync(id),
                    "cost-formula" => await _context.CommodityClassificationScoaCostFormulas.FindAsync(id),
                    "month-end" => await _context.InvenMonthEnds.FindAsync(id),
                    "take-on-settings" => await _context.InvenTakeOnSettings.FindAsync(id),
                    "store-permissions" => await _context.UserStorePermissions.FindAsync(id),
                    "water-route-names" => await _context.WaterRouteNames.FindAsync(id),
                    "water-routes" => await _context.WaterRoutes.FindAsync(id),
                    "water-route-nodes" => await _context.WaterRouteNodes.FindAsync(id),
                    "reporting" => await _context.InventoryReportings.FindAsync(id),
                    _ => null
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB unavailable for setting {Type}/{Id}", settingType, id);
                _dbChecker.MarkUnavailable();
            }
        }
        return null;
    }

    public async Task<object> CreateSettingAsync(string settingType, object dto)
    {
        if (UseDb)
        {
            try
            {
                var json = JsonSerializer.Serialize(dto);
                var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                object entity = settingType switch
                {
                    "bin-codes" => JsonSerializer.Deserialize<AutoBinCode>(json, opts)!,
                    "classifications" => JsonSerializer.Deserialize<CommodityClassification>(json, opts)!,
                    "commodity-types" => JsonSerializer.Deserialize<CommodityType>(json, opts)!,
                    "commodity-sub-types" => JsonSerializer.Deserialize<CommoditySubType>(json, opts)!,
                    "type-subtype-mappings" => JsonSerializer.Deserialize<CommodityTypeSubTypeMapping>(json, opts)!,
                    "units-of-issue" => JsonSerializer.Deserialize<UnitOfIssue>(json, opts)!,
                    "measure-groups" => JsonSerializer.Deserialize<MeasureGroupCategory>(json, opts)!,
                    "scoa-item-setup" => JsonSerializer.Deserialize<InventoryScoaItemSetup>(json, opts)!,
                    "classification-scoa" => JsonSerializer.Deserialize<CommodityClassificationScoaItem>(json, opts)!,
                    "classification-expense" => JsonSerializer.Deserialize<CommodityClassificationScoaExpense>(json, opts)!,
                    "cost-formula" => JsonSerializer.Deserialize<CommodityClassificationScoaCostFormula>(json, opts)!,
                    "month-end" => JsonSerializer.Deserialize<InvenMonthEnd>(json, opts)!,
                    "take-on-settings" => JsonSerializer.Deserialize<InvenTakeOnSettings>(json, opts)!,
                    "store-permissions" => JsonSerializer.Deserialize<UserStorePermission>(json, opts)!,
                    "water-route-names" => JsonSerializer.Deserialize<WaterRouteName>(json, opts)!,
                    "water-routes" => JsonSerializer.Deserialize<WaterRoute>(json, opts)!,
                    "water-route-nodes" => JsonSerializer.Deserialize<WaterRouteNode>(json, opts)!,
                    "reporting" => JsonSerializer.Deserialize<InventoryReporting>(json, opts)!,
                    _ => dto
                };
                _context.Add(entity);
                await _context.SaveChangesAsync();
                return entity;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB write failed for setting create {Type}", settingType);
                _dbChecker.MarkUnavailable();
            }
        }
        return dto;
    }

    public async Task<bool> UpdateSettingAsync(string settingType, int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var existing = await GetSettingByIdAsync(settingType, id);
                if (existing == null) return false;

                var json = JsonSerializer.Serialize(dto);
                var props = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json);
                if (props == null) return false;

                var entry = _context.Entry(existing);
                foreach (var prop in props)
                {
                    var entityProp = existing.GetType().GetProperties()
                        .FirstOrDefault(p => p.Name.Equals(prop.Key, StringComparison.OrdinalIgnoreCase));
                    if (entityProp != null && entityProp.CanWrite)
                    {
                        var val = JsonSerializer.Deserialize(prop.Value.GetRawText(), entityProp.PropertyType);
                        entityProp.SetValue(existing, val);
                    }
                }
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB write failed for setting update {Type}/{Id}", settingType, id);
                _dbChecker.MarkUnavailable();
            }
        }
        return false;
    }

    public async Task<bool> ToggleSettingAsync(string settingType, int id, bool enabled)
    {
        if (UseDb)
        {
            try
            {
                var existing = await GetSettingByIdAsync(settingType, id);
                if (existing == null) return false;

                var enabledProp = existing.GetType().GetProperty("Enabled");
                if (enabledProp != null)
                {
                    enabledProp.SetValue(existing, (bool?)enabled);
                    await _context.SaveChangesAsync();
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB write failed for setting toggle {Type}/{Id}", settingType, id);
                _dbChecker.MarkUnavailable();
            }
        }
        return false;
    }

    private static object GetFallback(string settingType) => settingType switch
    {
        "bin-codes" => new List<object> { new { autoBinCodeId = 1, storeId = 1, binPrefix = "BIN", binSuffix = "", binLength = 6, nextNumber = 1, enabled = true } },
        "classifications" => new List<object>
        {
            new { commodityClassificationId = 1, commodityClassificationDesc = "General Stores", enabled = true },
            new { commodityClassificationId = 2, commodityClassificationDesc = "Fuel & Lubricants", enabled = true },
            new { commodityClassificationId = 3, commodityClassificationDesc = "Chemicals", enabled = true },
            new { commodityClassificationId = 4, commodityClassificationDesc = "Electrical", enabled = true },
            new { commodityClassificationId = 5, commodityClassificationDesc = "Plumbing", enabled = true }
        },
        "commodity-types" => new List<object>
        {
            new { commodityTypeId = 1, commodityTypeDesc = "Consumable", enabled = true },
            new { commodityTypeId = 2, commodityTypeDesc = "Non-Consumable", enabled = true },
            new { commodityTypeId = 3, commodityTypeDesc = "Raw Material", enabled = true }
        },
        "commodity-sub-types" => new List<object>
        {
            new { commoditySubTypeId = 1, commoditySubTypeDesc = "Office Supplies", commodityTypeId = 1, enabled = true },
            new { commoditySubTypeId = 2, commoditySubTypeDesc = "Cleaning Materials", commodityTypeId = 1, enabled = true },
            new { commoditySubTypeId = 3, commoditySubTypeDesc = "Furniture", commodityTypeId = 2, enabled = true }
        },
        "type-subtype-mappings" => new List<object>
        {
            new { mappingId = 1, commodityTypeId = 1, commoditySubTypeId = 1, enabled = true },
            new { mappingId = 2, commodityTypeId = 1, commoditySubTypeId = 2, enabled = true },
            new { mappingId = 3, commodityTypeId = 2, commoditySubTypeId = 3, enabled = true }
        },
        "units-of-issue" => new List<object>
        {
            new { unitOfIssueId = 1, unitOfIssueDesc = "Each", uomCode = "EA", enabled = true },
            new { unitOfIssueId = 2, unitOfIssueDesc = "Kilogram", uomCode = "KG", enabled = true },
            new { unitOfIssueId = 3, unitOfIssueDesc = "Litre", uomCode = "LT", enabled = true },
            new { unitOfIssueId = 4, unitOfIssueDesc = "Metre", uomCode = "MT", enabled = true },
            new { unitOfIssueId = 5, unitOfIssueDesc = "Box", uomCode = "BX", enabled = true }
        },
        "measure-groups" => new List<object>
        {
            new { measureGroupCategoryId = 1, measureGroupCategoryDesc = "Weight", enabled = true },
            new { measureGroupCategoryId = 2, measureGroupCategoryDesc = "Volume", enabled = true },
            new { measureGroupCategoryId = 3, measureGroupCategoryDesc = "Length", enabled = true },
            new { measureGroupCategoryId = 4, measureGroupCategoryDesc = "Count", enabled = true }
        },
        "scoa-item-setup" => new List<object>
        {
            new { inventoryScoaItemSetupId = 1, scoaItemId = 1, scoaItemDesc = "General Inventory", commodityClassificationId = 1, enabled = true }
        },
        "classification-scoa" => new List<object>(),
        "classification-expense" => new List<object>(),
        "cost-formula" => new List<object>
        {
            new { classificationScoaItemCostFormulaId = 1, commodityClassificationId = 1, costFormulaDesc = "Weighted Average", enabled = true }
        },
        "month-end" => new List<object>
        {
            new { monthEndId = 1, finYear = "2025/2026", month = 1, monthName = "July", isClosed = true, enabled = true },
            new { monthEndId = 2, finYear = "2025/2026", month = 2, monthName = "August", isClosed = true, enabled = true },
            new { monthEndId = 3, finYear = "2025/2026", month = 3, monthName = "September", isClosed = true, enabled = true },
            new { monthEndId = 4, finYear = "2025/2026", month = 4, monthName = "October", isClosed = false, enabled = true }
        },
        "take-on-settings" => new List<object>
        {
            new { takeOnSettingsId = 1, storeId = 1, allowTakeOn = true, takeOnFinYear = "2025/2026", enabled = true }
        },
        "store-permissions" => new List<object>
        {
            new { userStorePermissionId = 1, userId = 1, storeId = 1, canCapture = true, canApprove = true, canView = true, enabled = true }
        },
        "water-route-names" => new List<object>
        {
            new { routeNameId = 1, routeName = "Main Distribution", routeDescription = "Primary water distribution route", enabled = true }
        },
        "water-routes" => new List<object>(),
        "water-route-nodes" => new List<object>(),
        "reporting" => new List<object>
        {
            new { reportingId = 1, reportName = "Stock Listing", reportDescription = "Complete inventory stock listing", reportCategory = "Inventory", isActive = true, enabled = true },
            new { reportingId = 2, reportName = "Stock Movement", reportDescription = "Inventory movement report", reportCategory = "Inventory", isActive = true, enabled = true },
            new { reportingId = 3, reportName = "Valuation Report", reportDescription = "Inventory valuation summary", reportCategory = "Finance", isActive = true, enabled = true }
        },
        _ => new List<object>()
    };
}
