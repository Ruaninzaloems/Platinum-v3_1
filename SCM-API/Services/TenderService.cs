using System.Collections.Concurrent;
using System.Text.Json;
using SCM_API.Helpers;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class TenderService : ITenderService
{
    private readonly ITenderRepository _repository;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<TenderService> _logger;

    private static readonly ConcurrentDictionary<int, Dictionary<string, object?>> _tenders = new();
    private static int _nextId = 500;
    private static bool _seeded = false;
    private static readonly object _seedLock = new();

    public TenderService(ITenderRepository repository, DbAvailabilityChecker dbChecker, ILogger<TenderService> logger)
    {
        _repository = repository;
        _dbChecker = dbChecker;
        _logger = logger;
        EnsureSeeded();
    }

    private bool UseDb => _dbChecker.IsDbAvailable;

    private void EnsureSeeded()
    {
        if (_seeded) return;
        lock (_seedLock)
        {
            if (_seeded) return;
            SeedData();
            _seeded = true;
        }
    }

    public async Task<object?> GetByIdAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetWithDetailsAsync(id);
                if (entity != null) return EntityToDict(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for tender {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }
        _tenders.TryGetValue(id, out var t);
        return t;
    }

    public async Task<PagedResult<object>> GetAllAsync(string? financialYear, int? statusId, string? search, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetFilteredAsync(financialYear, statusId, search, page, pageSize);
                var dicts = result.Items.Select(EntityToDict).ToList();
                var dbIds = new HashSet<int>();
                foreach (var d in dicts)
                {
                    if (d.TryGetValue("id", out var idObj) && idObj is int id2)
                    {
                        dbIds.Add(id2);
                        _tenders[id2] = d;
                    }
                }
                foreach (var staleKey in _tenders.Keys.Where(k => !dbIds.Contains(k)).ToList())
                    _tenders.TryRemove(staleKey, out _);
                return new PagedResult<object>
                {
                    Items = dicts.Cast<object>(),
                    Page = result.Page,
                    PageSize = result.PageSize,
                    TotalCount = result.TotalCount
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB query failed for tenders, falling back");
                _dbChecker.MarkUnavailable();
            }
        }

        var query = _tenders.Values.Where(q => q.ContainsKey("enabled") && q["enabled"] is true).AsEnumerable();

        if (!string.IsNullOrEmpty(financialYear))
            query = query.Where(q => q.TryGetValue("financialYear", out var fy) && fy?.ToString() == financialYear);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(q =>
                (q.TryGetValue("tenderNumber", out var tn) && tn?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true) ||
                (q.TryGetValue("title", out var t) && t?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true) ||
                (q.TryGetValue("description", out var d) && d?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true));

        var items = query.OrderByDescending(q => q.TryGetValue("dateCaptured", out var dc) ? dc?.ToString() : "").ToList();
        var totalCount = items.Count;
        var paged = items.Skip((page - 1) * pageSize).Take(pageSize);

        return new PagedResult<object>
        {
            Items = paged.Cast<object>(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<object> CreateAsync(object dto)
    {
        var data = new Dictionary<string, object?>
        {
            ["status"] = "draft",
            ["enabled"] = true
        };

        var incoming = ConvertToDict(dto);
        foreach (var kv in incoming) data[kv.Key] = kv.Value;

        if (UseDb)
        {
            try
            {
                var entity = DictToEntity(data);
                entity.TenderNumber = $"T-{DateTime.UtcNow:yyyy}-{(Interlocked.Increment(ref _nextId)):D3}";
                entity.DateCaptured = DateTime.UtcNow;
                entity.Enabled = true;
                entity.FinancialYear ??= $"{DateTime.UtcNow.Year}/{DateTime.UtcNow.Year + 1}";
                await _repository.AddAsync(entity);
                await _repository.SaveChangesAsync();
                _logger.LogInformation("Created tender {Id} in DB", entity.TenderId);
                var saved = await _repository.GetWithDetailsAsync(entity.TenderId);
                return EntityToDict(saved ?? entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for tender, falling back");
                _dbChecker.MarkUnavailable();
            }
        }

        var id = Interlocked.Increment(ref _nextId);
        data["id"] = id;
        data["tenderNumber"] = $"T-{DateTime.UtcNow:yyyy}-{id:D3}";
        data["referenceNumber"] = data["tenderNumber"];
        data["dateCaptured"] = DateTime.UtcNow.ToString("yyyy-MM-dd");
        data["financialYear"] = data.TryGetValue("financialYear", out var fy) && fy != null ? fy : $"{DateTime.UtcNow.Year}/{DateTime.UtcNow.Year + 1}";
        data["bidders"] = new List<object>();
        data["documents"] = new List<object>();
        data["committees"] = new Dictionary<string, object?> { ["bsc"] = new { status = "not_started" }, ["bec"] = new { status = "not_started" }, ["bac"] = new { status = "not_started" } };
        data["complianceChecks"] = new { budgetVerified = false };
        _tenders[id] = data;
        _logger.LogInformation("Created tender {Id} in-memory", id);
        return data;
    }

    public async Task<bool> UpdateAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id);
                if (entity == null) return false;
                var incoming = ConvertToDict(dto);
                ApplyDictToEntity(entity, incoming);
                entity.DateModified = DateTime.UtcNow;
                _repository.Update(entity);
                await _repository.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB update failed for tender {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_tenders.TryGetValue(id, out var t)) return false;
        var incomingDict = ConvertToDict(dto);
        foreach (var kv in incomingDict)
        {
            if (kv.Key != "id" && kv.Key != "tenderNumber")
                t[kv.Key] = kv.Value;
        }
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id);
                if (entity == null) return false;
                entity.Enabled = false;
                _repository.Update(entity);
                await _repository.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB delete failed for tender {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_tenders.TryGetValue(id, out var t)) return false;
        t["enabled"] = false;
        return true;
    }

    public async Task<bool> TransitionStatusAsync(int id, string newStatus)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id);
                if (entity == null) return false;
                ApplyStatusToEntity(entity, newStatus);
                entity.DateModified = DateTime.UtcNow;
                _repository.Update(entity);
                await _repository.SaveChangesAsync();
                _logger.LogInformation("Transitioned tender {Id} to {Status} in DB", id, newStatus);
                if (_tenders.TryGetValue(id, out var cached))
                    cached["status"] = newStatus;
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB status transition failed for tender {Id}", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_tenders.TryGetValue(id, out var t)) return false;
        t["status"] = newStatus;
        return true;
    }

    private static void ApplyStatusToEntity(Tender entity, string newStatus)
    {
        var now = DateTime.UtcNow;
        switch (newStatus)
        {
            case "specifications":
                entity.BidSpecification ??= now.ToString("yyyy-MM-dd");
                break;
            case "published":
                entity.AdvertisementDate ??= now;
                break;
            case "closed":
                entity.ClosingDate ??= now;
                break;
            case "evaluation":
                entity.BidEvaluationDate ??= now;
                break;
            case "adjudication":
                entity.BidAdjudicationDate ??= now;
                break;
            case "awarded":
                entity.BidAdjudicationDate ??= now;
                break;
            case "cancelled":
                entity.TenderCancel = true;
                break;
            case "void_requested":
                break;
            case "contract_active":
                entity.BidAdjudicationDate ??= now;
                break;
            case "draft":
                entity.BidSpecification = null;
                break;
        }
    }

    public async Task<object> GetTenderBidsAsync(int tenderId)
    {
        if (UseDb)
        {
            try
            {
                var bids = await _repository.GetBidsAsync(tenderId);
                return bids.Select(b => new Dictionary<string, object?>
                {
                    ["id"] = b.TenderVendorId,
                    ["vendorId"] = b.VendorId,
                    ["supplierName"] = b.CsdVendorName ?? $"Vendor {b.VendorId}",
                    ["bidAmount"] = new { amount = b.TenderAmount ?? 0m, currency = "ZAR" },
                    ["vatAmount"] = b.VatAmount,
                    ["totalAmount"] = b.TotalAmount,
                    ["enabled"] = b.Enabled
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB bids query failed for tender {Id}", tenderId);
                _dbChecker.MarkUnavailable();
            }
        }

        if (_tenders.TryGetValue(tenderId, out var t) && t.TryGetValue("bidders", out var bidders))
            return bidders ?? new List<object>();
        return new List<object>();
    }

    public async Task<bool> AwardAsync(int tenderId, object awardDto)
    {
        return await TransitionStatusAsync(tenderId, "awarded");
    }

    public async Task<object> GetEvaluationAsync(int tenderId)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetWithDetailsAsync(tenderId);
                if (entity != null)
                {
                    return new Dictionary<string, object?>
                    {
                        ["tenderId"] = tenderId,
                        ["evaluations"] = entity.TenderEvaluations?.Select(e => new
                        {
                            id = e.TenderEvaluationId,
                            vendorId = e.VendorId,
                            vendorName = e.CsdVendorName ?? $"Vendor {e.VendorId}",
                            bbbeePoints = e.BbbeePoints,
                            pricePoints = e.PricePoints,
                            totalPoints = e.TotalPoints
                        }).ToList(),
                        ["adjudications"] = entity.TenderAdjudications?.Select(a => new
                        {
                            id = a.TenderAdjudicationId,
                            vendorId = a.VendorId,
                            vendorName = a.CsdVendorName ?? $"Vendor {a.VendorId}",
                            bbbeePoints = a.BbbeePoints,
                            pricePoints = a.PricePoints,
                            quantity = a.Quantity,
                            unitCost = a.UnitCost,
                            totalUnitCost = a.TotalUnitCost
                        }).ToList()
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB evaluation query failed for tender {Id}", tenderId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new Dictionary<string, object?> { ["tenderId"] = tenderId, ["evaluationStatus"] = "Pending" };
    }

    public async Task<bool> PublishAsync(int tenderId)
    {
        return await TransitionStatusAsync(tenderId, "published");
    }

    public async Task<bool> CloseAsync(int tenderId)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(tenderId);
                if (entity == null) return false;
                entity.ClosingDate = DateTime.UtcNow;
                entity.DateModified = DateTime.UtcNow;
                _repository.Update(entity);
                await _repository.SaveChangesAsync();
                if (_tenders.TryGetValue(tenderId, out var t))
                {
                    t["status"] = "closed";
                    t["closingDate"] = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss");
                }
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB close failed for tender {Id}", tenderId);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_tenders.TryGetValue(tenderId, out var tender)) return false;
        tender["status"] = "closed";
        tender["closingDate"] = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss");
        return true;
    }

    public async Task<bool> SubmitAsync(int id) => await TransitionStatusAsync(id, "specifications");

    public async Task<bool> ApproveAsync(int id, object dto) => await TransitionStatusAsync(id, "contract_active");

    public async Task<object> GetDashboardSummaryAsync()
    {
        if (UseDb)
        {
            try
            {
                var all = await _repository.GetFilteredAsync(null, null, null, 1, 10000);
                var items = all.Items.ToList();
                return new Dictionary<string, object?>
                {
                    ["total"] = items.Count,
                    ["draft"] = items.Count(t => t.TenderCancel != true && t.ClosingDate == null && t.AdvertisementDate == null),
                    ["published"] = items.Count(t => t.AdvertisementDate != null && t.ClosingDate == null),
                    ["closed"] = items.Count(t => t.ClosingDate != null && t.ClosingDate <= DateTime.UtcNow),
                    ["evaluation"] = items.Count(t => t.BidEvaluationDate != null),
                    ["adjudication"] = items.Count(t => t.BidAdjudicationDate != null),
                    ["awarded"] = items.Count(t => t.SystemVendorId != null),
                    ["cancelled"] = items.Count(t => t.TenderCancel == true),
                    ["totalValue"] = items.Sum(t => t.TenderEstimate ?? 0m)
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB dashboard query failed, falling back");
                _dbChecker.MarkUnavailable();
            }
        }

        var tenders = _tenders.Values.Where(t => t.TryGetValue("enabled", out var e) && e is true).ToList();
        return new Dictionary<string, object?>
        {
            ["total"] = tenders.Count,
            ["draft"] = tenders.Count(t => GetStr(t, "status") == "draft"),
            ["published"] = tenders.Count(t => GetStr(t, "status") == "published"),
            ["closed"] = tenders.Count(t => GetStr(t, "status") == "closed"),
            ["evaluation"] = tenders.Count(t => GetStr(t, "status") == "evaluation"),
            ["adjudication"] = tenders.Count(t => GetStr(t, "status") == "adjudication"),
            ["awarded"] = tenders.Count(t => GetStr(t, "status") == "awarded"),
            ["cancelled"] = tenders.Count(t => GetStr(t, "status") == "cancelled"),
            ["totalValue"] = tenders.Sum(t => GetDec(t, "estimatedValue"))
        };
    }

    public async Task<object> GetPipelineAsync()
    {
        var summary = (Dictionary<string, object?>)await GetDashboardSummaryAsync();
        var stages = new[]
        {
            new { key = "draft", label = "Draft", count = summary.GetValueOrDefault("draft", 0) },
            new { key = "specifications", label = "BSC Review", count = summary.GetValueOrDefault("specifications", 0) },
            new { key = "published", label = "Published", count = summary.GetValueOrDefault("published", 0) },
            new { key = "closed", label = "Closed", count = summary.GetValueOrDefault("closed", 0) },
            new { key = "evaluation", label = "BEC", count = summary.GetValueOrDefault("evaluation", 0) },
            new { key = "adjudication", label = "BAC", count = summary.GetValueOrDefault("adjudication", 0) },
            new { key = "awarded", label = "Awarded", count = summary.GetValueOrDefault("awarded", 0) }
        };
        return new
        {
            stages,
            summary = new
            {
                total = summary.GetValueOrDefault("total", 0),
                open = (int)(summary.GetValueOrDefault("published", 0) ?? 0),
                closed = (int)(summary.GetValueOrDefault("closed", 0) ?? 0),
                awarded = (int)(summary.GetValueOrDefault("awarded", 0) ?? 0),
                totalValue = summary.GetValueOrDefault("totalValue", 0m)
            }
        };
    }

    private Dictionary<string, object?> EntityToDict(Tender entity)
    {
        var statusName = "draft";
        if (entity.TenderCancel == true) statusName = "cancelled";
        else if (entity.SystemVendorId != null) statusName = "awarded";
        else if (entity.BidAdjudicationDate != null) statusName = "adjudication";
        else if (entity.BidEvaluationDate != null) statusName = "evaluation";
        else if (entity.ClosingDate != null && entity.ClosingDate <= DateTime.UtcNow) statusName = "closed";
        else if (entity.AdvertisementDate != null) statusName = "published";
        else if (entity.BidSpecification != null) statusName = "specifications";

        var bidders = entity.TenderVendors?.Select(v => (object)new Dictionary<string, object?>
        {
            ["id"] = v.TenderVendorId,
            ["vendorId"] = v.VendorId,
            ["supplierName"] = v.CsdVendorName ?? $"Vendor {v.VendorId}",
            ["bidAmount"] = new { amount = v.TenderAmount ?? 0m, currency = "ZAR" },
            ["vatAmount"] = v.VatAmount,
            ["totalAmount"] = v.TotalAmount,
            ["responsive"] = v.Enabled != false,
            ["complianceChecked"] = true
        }).ToList() ?? new List<object>();

        var documents = entity.TenderDocuments?.Select(d => (object)new Dictionary<string, object?>
        {
            ["id"] = d.TenderDocumentId,
            ["name"] = d.DocumentName,
            ["type"] = d.DocumentType,
            ["path"] = d.DocumentPath,
            ["compulsory"] = d.Compulsory
        }).ToList() ?? new List<object>();

        return new Dictionary<string, object?>
        {
            ["id"] = entity.TenderId,
            ["tenderNumber"] = entity.TenderNumber,
            ["referenceNumber"] = entity.TenderNumber ?? entity.ReferenceNumber,
            ["title"] = entity.TenderDescription,
            ["description"] = entity.TenderDescription,
            ["departmentId"] = entity.DepartmentId,
            ["department"] = $"Department {entity.DepartmentId}",
            ["tenderManagerId"] = entity.TenderManagerId,
            ["tenderTypeId"] = entity.TenderTypeId,
            ["status"] = statusName,
            ["estimatedValue"] = new { amount = entity.TenderEstimate ?? 0m, currency = "ZAR" },
            ["closingDate"] = entity.ClosingDate?.ToString("yyyy-MM-ddTHH:mm:ss"),
            ["advertisementDate"] = entity.AdvertisementDate?.ToString("yyyy-MM-ddTHH:mm:ss"),
            ["bidEvaluationDate"] = entity.BidEvaluationDate?.ToString("yyyy-MM-ddTHH:mm:ss"),
            ["bidAdjudicationDate"] = entity.BidAdjudicationDate?.ToString("yyyy-MM-ddTHH:mm:ss"),
            ["scopeOfWork"] = entity.ScopeOfWork,
            ["generalCondition"] = entity.GeneralCondition,
            ["specificCondition"] = entity.SpecificCondition,
            ["twoEnvelope"] = entity.TwoEnvelope ?? false,
            ["singleEnvelope"] = entity.SingleEnvelope ?? true,
            ["isRateBasedContract"] = entity.IsRateBasedContract ?? false,
            ["financialYear"] = entity.FinancialYear,
            ["requisitionId"] = entity.RequisitionId,
            ["dateCaptured"] = entity.DateCaptured?.ToString("yyyy-MM-ddTHH:mm:ss"),
            ["dateModified"] = entity.DateModified?.ToString("yyyy-MM-ddTHH:mm:ss"),
            ["enabled"] = entity.Enabled ?? true,
            ["bidders"] = bidders,
            ["documents"] = documents,
            ["committees"] = new Dictionary<string, object?>
            {
                ["bsc"] = new { status = statusName == "specifications" || OrderOf(statusName) > 1 ? "approved" : "not_started" },
                ["bec"] = new { status = OrderOf(statusName) >= 4 ? "completed" : "not_started" },
                ["bac"] = new { status = OrderOf(statusName) >= 5 ? "completed" : "not_started" }
            },
            ["complianceChecks"] = new { budgetVerified = true }
        };
    }

    private static int OrderOf(string status) => status switch
    {
        "draft" => 0, "specifications" => 1, "published" => 2, "closed" => 3,
        "evaluation" => 4, "adjudication" => 5, "awarded" => 6, "contract_active" => 7,
        _ => 0
    };

    private Tender DictToEntity(Dictionary<string, object?> data)
    {
        var entity = new Tender
        {
            TenderDescription = GetStr(data, "title") ?? GetStr(data, "description"),
            TenderEstimate = GetDec(data, "estimatedValue"),
            ScopeOfWork = GetStr(data, "specScope") ?? GetStr(data, "scopeOfWork"),
            GeneralCondition = GetStr(data, "specGeneralConditions") ?? GetStr(data, "generalCondition"),
            SpecificCondition = GetStr(data, "specSpecificConditions") ?? GetStr(data, "specificCondition"),
            TwoEnvelope = GetBool(data, "twoEnvelope"),
            FinancialYear = GetStr(data, "financialYear")
        };

        if (data.TryGetValue("closingDate", out var cd) && cd != null)
        {
            if (DateTime.TryParse(cd.ToString(), out var dt))
                entity.ClosingDate = dt;
        }

        if (data.TryGetValue("briefingDate", out var bd) && bd != null)
        {
            if (DateTime.TryParse(bd.ToString(), out var dt))
                entity.BidSpecification = dt.ToString("yyyy-MM-dd");
        }

        if (data.TryGetValue("validityFromDate", out var vf) && vf != null && DateTime.TryParse(vf.ToString(), out var vfd))
            entity.AdvertisementDate = vfd;

        return entity;
    }

    private void ApplyDictToEntity(Tender entity, Dictionary<string, object?> data)
    {
        if (data.ContainsKey("title")) entity.TenderDescription = GetStr(data, "title");
        if (data.ContainsKey("description")) entity.TenderDescription = GetStr(data, "description");
        if (data.ContainsKey("scopeOfWork")) entity.ScopeOfWork = GetStr(data, "scopeOfWork");
        if (data.ContainsKey("specScope")) entity.ScopeOfWork = GetStr(data, "specScope");
        if (data.ContainsKey("generalCondition")) entity.GeneralCondition = GetStr(data, "generalCondition");
        if (data.ContainsKey("specGeneralConditions")) entity.GeneralCondition = GetStr(data, "specGeneralConditions");
        if (data.ContainsKey("specificCondition")) entity.SpecificCondition = GetStr(data, "specificCondition");
        if (data.ContainsKey("specSpecificConditions")) entity.SpecificCondition = GetStr(data, "specSpecificConditions");
        if (data.ContainsKey("twoEnvelope")) entity.TwoEnvelope = GetBool(data, "twoEnvelope");
        if (data.ContainsKey("financialYear")) entity.FinancialYear = GetStr(data, "financialYear");
        if (data.TryGetValue("estimatedValue", out var ev) && ev != null)
            entity.TenderEstimate = GetDec(data, "estimatedValue");
        if (data.TryGetValue("closingDate", out var cd) && cd != null && DateTime.TryParse(cd.ToString(), out var cdt))
            entity.ClosingDate = cdt;
    }

    private static Dictionary<string, object?> ConvertToDict(object dto)
    {
        if (dto is Dictionary<string, object?> d) return d;
        if (dto is JsonElement je && je.ValueKind == JsonValueKind.Object)
        {
            var result = new Dictionary<string, object?>();
            foreach (var prop in je.EnumerateObject())
            {
                result[prop.Name] = prop.Value.ValueKind switch
                {
                    JsonValueKind.String => prop.Value.GetString(),
                    JsonValueKind.Number => prop.Value.TryGetInt32(out var i) ? i : prop.Value.GetDecimal(),
                    JsonValueKind.True => true,
                    JsonValueKind.False => false,
                    JsonValueKind.Null => null,
                    _ => prop.Value.Clone()
                };
            }
            return result;
        }
        var json = JsonSerializer.Serialize(dto);
        return JsonSerializer.Deserialize<Dictionary<string, object?>>(json) ?? new();
    }

    private static string? GetStr(Dictionary<string, object?> d, string key)
    {
        if (!d.TryGetValue(key, out var v) || v == null) return null;
        return v.ToString();
    }

    private static decimal GetDec(Dictionary<string, object?> d, string key)
    {
        if (!d.TryGetValue(key, out var v) || v == null) return 0m;
        if (v is decimal dec) return dec;
        if (v is int i) return i;
        if (v is double db) return (decimal)db;
        if (v is JsonElement je)
        {
            if (je.ValueKind == JsonValueKind.Number) return je.GetDecimal();
            if (je.ValueKind == JsonValueKind.Object && je.TryGetProperty("amount", out var amt))
                return amt.ValueKind == JsonValueKind.Number ? amt.GetDecimal() : 0m;
        }
        if (decimal.TryParse(v.ToString(), out var parsed)) return parsed;
        return 0m;
    }

    private static bool GetBool(Dictionary<string, object?> d, string key)
    {
        if (!d.TryGetValue(key, out var v) || v == null) return false;
        if (v is bool b) return b;
        if (v is JsonElement je && je.ValueKind == JsonValueKind.True) return true;
        return false;
    }

    private void SeedData()
    {
        var now = DateTime.UtcNow;
        var seeds = new[]
        {
            new { Title = "Supply and Delivery of Water Infrastructure Materials", Status = "published", Estimate = 2500000m, Dept = "Water & Sanitation", Days = -10 },
            new { Title = "Construction of Community Hall - Phase 2", Status = "evaluation", Estimate = 8500000m, Dept = "Infrastructure and Engineering", Days = -30 },
            new { Title = "IT Network Infrastructure Upgrade", Status = "draft", Estimate = 1200000m, Dept = "Corporate Services", Days = 0 },
            new { Title = "Fleet Management and Vehicle Maintenance Services", Status = "awarded", Estimate = 4200000m, Dept = "Community Services", Days = -60 },
            new { Title = "Environmental Impact Assessment Services", Status = "adjudication", Estimate = 950000m, Dept = "Planning & Development", Days = -45 }
        };

        foreach (var s in seeds)
        {
            var id = Interlocked.Increment(ref _nextId);
            _tenders[id] = new Dictionary<string, object?>
            {
                ["id"] = id,
                ["tenderNumber"] = $"T-{now:yyyy}-{id:D3}",
                ["referenceNumber"] = $"T-{now:yyyy}-{id:D3}",
                ["title"] = s.Title,
                ["description"] = s.Title,
                ["department"] = s.Dept,
                ["status"] = s.Status,
                ["estimatedValue"] = new { amount = s.Estimate, currency = "ZAR" },
                ["closingDate"] = now.AddDays(s.Days + 21).ToString("yyyy-MM-ddTHH:mm:ss"),
                ["advertisementDate"] = s.Status != "draft" ? now.AddDays(s.Days).ToString("yyyy-MM-ddTHH:mm:ss") : null,
                ["dateCaptured"] = now.AddDays(s.Days).ToString("yyyy-MM-ddTHH:mm:ss"),
                ["financialYear"] = $"{now.Year}/{now.Year + 1}",
                ["twoEnvelope"] = false,
                ["enabled"] = true,
                ["bidders"] = new List<object>(),
                ["documents"] = new List<object>(),
                ["committees"] = new Dictionary<string, object?>
                {
                    ["bsc"] = new { status = OrderOf(s.Status) >= 1 ? "approved" : "not_started" },
                    ["bec"] = new { status = OrderOf(s.Status) >= 4 ? "completed" : "not_started" },
                    ["bac"] = new { status = OrderOf(s.Status) >= 5 ? "completed" : "not_started" }
                },
                ["complianceChecks"] = new { budgetVerified = true }
            };
        }
    }
}
