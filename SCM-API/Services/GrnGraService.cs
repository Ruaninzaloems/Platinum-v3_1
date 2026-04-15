using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Helpers;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class GrnGraService : IGrnGraService
{
    private readonly IGrnGraRepository _repository;
    private readonly ApplicationDbContext _context;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<GrnGraService> _logger;

    private static readonly ConcurrentDictionary<int, Dictionary<string, object?>> _grns = new();
    private static readonly ConcurrentDictionary<int, Dictionary<string, object?>> _gras = new();
    private static readonly ConcurrentDictionary<int, Dictionary<string, object?>> _returns = new();
    private static int _nextGrnId = 502;
    private static int _nextGraId = 702;
    private static int _nextReturnId = 602;
    private static bool _seeded = false;
    private static readonly object _seedLock = new();

    public GrnGraService(IGrnGraRepository repository, ApplicationDbContext context, DbAvailabilityChecker dbChecker, ILogger<GrnGraService> logger)
    {
        _repository = repository;
        _context = context;
        _dbChecker = dbChecker;
        _logger = logger;
        EnsureSeeded();
    }

    private bool UseDb => _dbChecker.IsDbAvailable;

    private static bool ShouldSeedMockData =>
        string.Equals(Environment.GetEnvironmentVariable("USE_MOCK_DATA"), "true", StringComparison.OrdinalIgnoreCase);

    private void EnsureSeeded()
    {
        if (_seeded) return;
        lock (_seedLock)
        {
            if (_seeded) return;
            if (ShouldSeedMockData || !UseDb)
                SeedData();
            _seeded = true;
        }
    }

    private void SeedData()
    {
        _grns[501] = new Dictionary<string, object?>
        {
            ["id"] = 501,
            ["grnNumber"] = "GRN-2026-501",
            ["status"] = "approved",
            ["orderNumber"] = "PO-2026-302",
            ["orderId"] = 302,
            ["vendorName"] = "Cape IT Solutions CC",
            ["storeId"] = "STR-001",
            ["storeName"] = "Main Municipal Stores",
            ["deliveryNoteNumber"] = "DN-001",
            ["dateReceived"] = "2026-03-10",
            ["financialYear"] = "2025/2026",
            ["qualityCheckPassed"] = true,
            ["approvedDate"] = "2026-03-11",
            ["approvedBy"] = "Admin",
            ["createdAt"] = "2026-03-10T08:00:00Z",
            ["lineItems"] = new object[]
            {
                new Dictionary<string, object?>
                {
                    ["id"] = "LI-001",
                    ["description"] = "Desktop Computer - Dell OptiPlex 7010",
                    ["orderedQuantity"] = 1,
                    ["receivedQuantity"] = 1,
                    ["rejectedQuantity"] = 0,
                    ["condition"] = "good",
                    ["unitOfMeasure"] = "each"
                }
            },
            ["auditTrail"] = new object[]
            {
                new { action = "Created", by = "Admin", date = "2026-03-10", type = "action", message = "GRN captured" },
                new { action = "Submitted", by = "Admin", date = "2026-03-10", type = "action", message = "GRN submitted for approval" },
                new { action = "Approved", by = "Admin", date = "2026-03-11", type = "approval", message = "GRN approved" }
            }
        };

        _returns[601] = new Dictionary<string, object?>
        {
            ["id"] = 601,
            ["returnNumber"] = "RET-2026-601",
            ["status"] = "gra_created",
            ["grnId"] = 501,
            ["grnNumber"] = "GRN-2026-501",
            ["orderId"] = 302,
            ["orderNumber"] = "PO-2026-302",
            ["vendorName"] = "Cape IT Solutions CC",
            ["returnDate"] = "2026-03-12",
            ["financialYear"] = "2025/2026",
            ["returnBy"] = "Admin",
            ["description"] = "Desktop computer received with defective monitor - screen flickering intermittently",
            ["approvedBy"] = "Admin",
            ["approvalDate"] = "2026-03-13",
            ["budgetImpact"] = 100m,
            ["createdAt"] = "2026-03-12T09:00:00Z",
            ["lineItems"] = new object[]
            {
                new Dictionary<string, object?>
                {
                    ["description"] = "Desktop Computer - Dell OptiPlex 7010",
                    ["grnQuantity"] = 1,
                    ["returnQuantity"] = 1,
                    ["returnReason"] = "defective",
                    ["lineId"] = "LI-001"
                }
            },
            ["auditTrail"] = new object[]
            {
                new { action = "Created", by = "Admin", date = "2026-03-12", type = "action", message = "Goods return captured" },
                new { action = "Submitted", by = "Admin", date = "2026-03-12", type = "action", message = "Return submitted for approval" },
                new { action = "Approved", by = "Admin", date = "2026-03-13", type = "approval", message = "Return approved" },
                new { action = "GRA Created", by = "Admin", date = "2026-03-14", type = "action", message = "GRA GRA-2026-701 created from this return" }
            }
        };

        _gras[701] = new Dictionary<string, object?>
        {
            ["id"] = 701,
            ["graNumber"] = "GRA-2026-701",
            ["debitNoteNumber"] = "DN-2026-701",
            ["returnId"] = 601,
            ["returnNumber"] = "RET-2026-601",
            ["grnId"] = 501,
            ["orderId"] = 302,
            ["vendorName"] = "Cape IT Solutions CC",
            ["status"] = "active",
            ["description"] = "Debit note request for defective Dell OptiPlex 7010 desktop computer",
            ["createdDate"] = "2026-03-14",
            ["createdBy"] = "Admin",
            ["budgetReleased"] = 100m,
            ["financialYear"] = "2025/2026",
            ["lineItems"] = new object[]
            {
                new Dictionary<string, object?>
                {
                    ["description"] = "Desktop Computer - Dell OptiPlex 7010",
                    ["grnQuantity"] = 1,
                    ["returnQuantity"] = 1,
                    ["returnReason"] = "defective",
                    ["unitPrice"] = 8800m,
                    ["totalValue"] = 8800m
                }
            }
        };
    }

    public async Task<Dictionary<string, object?>?> GetGrnDictAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetWithDetailsAsync(id);
                if (entity != null)
                {
                    var dict = MapGrnEntityToDict(entity);
                    _grns[id] = dict;
                    return dict;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for GRN {Id}", id);
                _dbChecker.MarkUnavailable();
            }
        }

        return _grns.TryGetValue(id, out var cached) ? cached : null;
    }

    public async Task<ICollection<Dictionary<string, object?>>> GetAllGrnDictsAsync()
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetFilteredAsync(null, null, null, 1, 1000);
                var dbIds = new HashSet<int>();
                foreach (var entity in result.Items)
                {
                    var dict = MapGrnEntityToDict(entity);
                    _grns[entity.GrnId] = dict;
                    dbIds.Add(entity.GrnId);
                }
                foreach (var key in _grns.Keys.Where(k => !dbIds.Contains(k)).ToList())
                    _grns.TryRemove(key, out _);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB query failed for GRNs");
                _dbChecker.MarkUnavailable();
            }
        }
        return _grns.Values;
    }

    public async Task SaveGrnDictAsync(int id, Dictionary<string, object?> grn)
    {
        _grns[id] = grn;

        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id);
                if (entity != null)
                {
                    entity.DateModified = DateTime.UtcNow;
                    if (grn.TryGetValue("status", out var s))
                        entity.StatusId = StatusMapper.ToStatusId("grn", s?.ToString());
                    if (grn.TryGetValue("comments", out var c) && c != null)
                        entity.Comments = c.ToString();
                    if (grn.TryGetValue("description", out var d) && d != null)
                        entity.Description = d.ToString();
                    if (grn.TryGetValue("deliveryNoteNumber", out var dn) && dn != null)
                        entity.DeliveryNoteNumber = dn.ToString();
                    if (grn.TryGetValue("deliveryNoteDate", out var dnd) && DateTime.TryParse(dnd?.ToString(), out var dnDate))
                        entity.DeliveryNoteDate = dnDate;
                    if (grn.TryGetValue("dateReceived", out var dr) && DateTime.TryParse(dr?.ToString(), out var rcvDate))
                        entity.GrnReceivedDate = rcvDate;
                    if (grn.TryGetValue("deliveryIndicator", out var di) && di != null)
                        entity.DeliveryIndicator = di.ToString();
                    if (grn.TryGetValue("qualityCheckPassed", out var qc) && qc is bool qcBool)
                        entity.GoodsReceived = qcBool;
                    if (grn.TryGetValue("financialYear", out var fy) && fy != null)
                        entity.FinancialYear = fy.ToString();
                    entity.IsApproved = grn.TryGetValue("status", out var st) && st?.ToString() == "approved";
                    _repository.Update(entity);
                    await _repository.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB save failed for GRN {Id}", id);
                _dbChecker.MarkUnavailable();
            }
        }
    }

    public async Task<bool> DeleteGrnDictAsync(int id)
    {
        var removed = _grns.TryRemove(id, out _);
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id);
                if (entity != null) { entity.Enabled = false; _repository.Update(entity); await _repository.SaveChangesAsync(); }
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB delete failed for GRN {Id}", id); _dbChecker.MarkUnavailable(); }
        }
        return removed;
    }

    public int AllocateNextGrnId()
        => Interlocked.Increment(ref _nextGrnId);

    public async Task<Dictionary<string, object?>?> GetReturnDictAsync(int id)
    {
        if (_returns.TryGetValue(id, out var cached))
            return cached;
        return null;
    }

    public Task<ICollection<Dictionary<string, object?>>> GetAllReturnDictsAsync()
        => Task.FromResult<ICollection<Dictionary<string, object?>>>(_returns.Values);

    public Task SaveReturnDictAsync(int id, Dictionary<string, object?> ret)
    {
        _returns[id] = ret;
        return Task.CompletedTask;
    }

    public Task<bool> DeleteReturnDictAsync(int id)
        => Task.FromResult(_returns.TryRemove(id, out _));

    public int AllocateNextReturnId()
        => Interlocked.Increment(ref _nextReturnId);

    public async Task<Dictionary<string, object?>?> GetGraDictAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetGraByIdAsync(id);
                if (entity != null)
                {
                    var dict = MapGraEntityToDict(entity);
                    _gras[id] = dict;
                    return dict;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for GRA {Id}", id);
                _dbChecker.MarkUnavailable();
            }
        }
        return _gras.TryGetValue(id, out var cached) ? cached : null;
    }

    public async Task<ICollection<Dictionary<string, object?>>> GetAllGraDictsAsync()
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetGrasAsync(null, null, 1, 1000);
                var dbIds = new HashSet<int>();
                foreach (var entity in result.Items)
                {
                    var dict = MapGraEntityToDict(entity);
                    _gras[entity.GraId] = dict;
                    dbIds.Add(entity.GraId);
                }
                foreach (var key in _gras.Keys.Where(k => !dbIds.Contains(k)).ToList())
                    _gras.TryRemove(key, out _);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB query failed for GRAs");
                _dbChecker.MarkUnavailable();
            }
        }
        return _gras.Values;
    }

    public async Task SaveGraDictAsync(int id, Dictionary<string, object?> gra)
    {
        _gras[id] = gra;

        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetGraByIdAsync(id);
                if (entity != null)
                {
                    if (gra.TryGetValue("status", out var s))
                        entity.StatusId = StatusMapper.ToStatusId("gra", s?.ToString());
                    if (gra.TryGetValue("comments", out var c) && c != null)
                        entity.Comments = c.ToString();
                    if (gra.TryGetValue("returnReason", out var rr) && rr != null)
                        entity.ReturnReason = rr.ToString();
                    if (gra.TryGetValue("returnDate", out var rd) && DateTime.TryParse(rd?.ToString(), out var retDate))
                        entity.ReturnDate = retDate;
                    if (gra.TryGetValue("approvedDate", out var ad) && DateTime.TryParse(ad?.ToString(), out var appDate))
                        entity.ApprovedDate = appDate;
                    await _repository.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB save failed for GRA {Id}", id);
                _dbChecker.MarkUnavailable();
            }
        }
    }

    public Task<bool> DeleteGraDictAsync(int id)
        => Task.FromResult(_gras.TryRemove(id, out _));

    public int AllocateNextGraId()
        => Interlocked.Increment(ref _nextGraId);

    public async Task<object?> GetByIdAsync(int id)
    {
        return await GetGrnDictAsync(id);
    }

    public async Task<PagedResult<object>> GetAllAsync(string? financialYear, int? statusId, int? orderId, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetFilteredAsync(financialYear, statusId, orderId, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Select(MapGrnEntityToDict).Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB query failed for GRNs"); _dbChecker.MarkUnavailable(); }
        }
        var all = await GetAllGrnDictsAsync();
        return new PagedResult<object> { Items = all.Cast<object>(), Page = page, PageSize = pageSize, TotalCount = all.Count };
    }

    public async Task<object> CreateAsync(object dto)
    {
        var data = ConvertToDict(dto);
        if (!data.ContainsKey("status"))
            data["status"] = "draft";
        if (!data.ContainsKey("createdAt"))
            data["createdAt"] = DateTime.UtcNow.ToString("o");

        if (UseDb)
        {
            try
            {
                var memId = AllocateNextGrnId();
                var grnNum = data.GetValueOrDefault("grnNumber")?.ToString() ?? $"GRN-{DateTime.UtcNow:yyyy}-{memId:D3}";
                var entity = new Grn
                {
                    GrnVendorNumber = grnNum,
                    DateCaptured = DateTime.UtcNow,
                    Enabled = true,
                    FinancialYear = data.GetValueOrDefault("financialYear")?.ToString()
                };
                if (data.TryGetValue("lineItems", out var liObj) && liObj is object[] items)
                {
                    foreach (var item in items)
                    {
                        if (item is Dictionary<string, object?> li)
                        {
                            var detail = new GrnDetail
                            {
                                Description = li.GetValueOrDefault("description")?.ToString(),
                                QtyOrdered = ResolveDecimal(li, "orderedQuantity", "quantityOrdered"),
                                QtyReceived = ResolveDecimal(li, "receivedQuantity", "quantityReceived"),
                                Enabled = true,
                                DateCaptured = DateTime.UtcNow,
                                CapturerId = 1
                            };
                            if (li.TryGetValue("unitPrice", out var up) && up is Dictionary<string, object?> upd && upd.TryGetValue("amount", out var upa))
                                detail.UnitPrice = Convert.ToDecimal(upa);
                            else if (li.TryGetValue("unitPrice", out var up2) && up2 != null)
                                detail.UnitPrice = Convert.ToDecimal(up2);
                            detail.Amount = (detail.UnitPrice ?? 0) * (detail.QtyReceived ?? 0);
                            detail.TotalAmount = detail.Amount;
                            entity.GrnDetails.Add(detail);
                        }
                    }
                }
                await _repository.AddAsync(entity);
                await _repository.SaveChangesAsync();
                var dbId = entity.GrnId;
                data["id"] = dbId;
                data["grnNumber"] = grnNum;
                _grns[dbId] = data;
                _logger.LogInformation("Created GRN {Id} in DB with {DetailCount} detail rows", dbId, entity.GrnDetails.Count);
                return data;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for GRN, continuing with in-memory");
                _dbChecker.MarkUnavailable();
            }
        }

        var id = AllocateNextGrnId();
        data["id"] = id;
        if (!data.ContainsKey("grnNumber"))
            data["grnNumber"] = $"GRN-{DateTime.UtcNow:yyyy}-{id:D3}";
        _grns[id] = data;
        return data;
    }

    public async Task<PagedResult<object>> GetGrasAsync(string? financialYear, int? statusId, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetGrasAsync(financialYear, statusId, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Select(MapGraEntityToDict).Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB query failed for GRAs"); _dbChecker.MarkUnavailable(); }
        }
        var all = await GetAllGraDictsAsync();
        return new PagedResult<object> { Items = all.Cast<object>(), Page = page, PageSize = pageSize, TotalCount = all.Count };
    }

    public async Task<object?> GetGraByIdAsync(int id)
    {
        return await GetGraDictAsync(id);
    }

    public async Task<object> CreateGraAsync(object dto)
    {
        var data = ConvertToDict(dto);
        if (UseDb)
        {
            try
            {
                var entity = new Gra
                {
                    GrnId = data.TryGetValue("grnId", out var gi) ? DictHelper.GetNullableInt(data, "grnId") : null,
                    OrderId = data.TryGetValue("orderId", out var oi) ? DictHelper.GetNullableInt(data, "orderId") : null,
                    ReturnDate = DictHelper.GetNullableDateTime(data, "returnDate") ?? DateTime.UtcNow,
                    ReturnReason = DictHelper.GetString(data, "returnReason") ?? DictHelper.GetString(data, "reason"),
                    StatusId = StatusMapper.ToStatusId("gra", "draft"),
                    Enabled = true,
                    DateCaptured = DateTime.UtcNow,
                    CapturerId = 1,
                    Comments = DictHelper.GetString(data, "comments")
                };
                await _repository.AddGraAsync(entity);
                await _repository.SaveChangesAsync();
                data["id"] = entity.GraId;
                _gras[entity.GraId] = data;
                _logger.LogInformation("Created GRA {Id} in DB", entity.GraId);
                return data;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB GRA creation failed, falling back to in-memory");
                _dbChecker.MarkUnavailable();
            }
        }
        var id = AllocateNextGraId();
        data["id"] = id;
        _gras[id] = data;
        return data;
    }

    public async Task<bool> ApproveGrnAsync(int id, object dto)
    {
        var grn = await GetGrnDictAsync(id);
        if (grn == null) return false;
        grn["status"] = "approved";
        grn["approvedDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd");
        grn["approvedBy"] = "Admin";
        await SaveGrnDictAsync(id, grn);
        return true;
    }

    public async Task<bool> ApproveGraAsync(int id, object dto)
    {
        var gra = await GetGraDictAsync(id);
        if (gra == null) return false;
        gra["status"] = "approved";
        await SaveGraDictAsync(id, gra);
        return true;
    }

    public async Task<object> GetGrnDetailsAsync(int grnId)
    {
        var grn = await GetGrnDictAsync(grnId);
        return grn ?? new object();
    }

    private static Dictionary<string, object?> MapGrnEntityToDict(Grn entity)
    {
        var lineItems = entity.GrnDetails.Where(d => d.Enabled != false && d.IsVoid != true).Select(d => new Dictionary<string, object?>
        {
            ["id"] = d.GrnDetailId.ToString(),
            ["description"] = d.Description,
            ["orderedQuantity"] = d.QtyOrdered ?? 0m,
            ["receivedQuantity"] = d.QtyReceived ?? 0m,
            ["rejectedQuantity"] = (d.QtyOrdered ?? 0m) - (d.QtyReceived ?? 0m),
            ["unitPrice"] = d.UnitPrice ?? 0m,
            ["amount"] = d.Amount ?? 0m,
            ["vatAmount"] = d.VatAmount ?? 0m,
            ["totalAmount"] = d.TotalAmount ?? 0m,
            ["condition"] = "good",
            ["unitOfMeasure"] = "each"
        }).ToArray();

        return new Dictionary<string, object?>
        {
            ["id"] = entity.GrnId,
            ["grnNumber"] = entity.GrnVendorNumber ?? $"GRN-{entity.GrnId}",
            ["status"] = StatusMapper.ToStatusName("grn", entity.StatusId),
            ["statusId"] = entity.StatusId,
            ["orderId"] = entity.OrderId,
            ["vendorId"] = entity.VendorId,
            ["storeId"] = entity.RecStoreId?.ToString(),
            ["enabled"] = entity.Enabled,
            ["deliveryNoteNumber"] = entity.DeliveryNoteNumber,
            ["deliveryNoteDate"] = entity.DeliveryNoteDate?.ToString("yyyy-MM-dd"),
            ["deliveryIndicator"] = entity.DeliveryIndicator,
            ["dateReceived"] = entity.GrnReceivedDate?.ToString("yyyy-MM-dd"),
            ["description"] = entity.Description,
            ["comments"] = entity.Comments,
            ["goodsReceived"] = entity.GoodsReceived,
            ["qualityCheckPassed"] = entity.GoodsReceived ?? false,
            ["approvedDate"] = entity.IsApproved == true ? entity.DateModified?.ToString("yyyy-MM-dd") : null,
            ["approvedBy"] = entity.IsApproved == true ? "Admin" : null,
            ["financialYear"] = entity.FinancialYear ?? "2025/2026",
            ["createdAt"] = entity.DateCaptured?.ToString("o"),
            ["lineItems"] = lineItems,
            ["auditTrail"] = Array.Empty<object>(),
            ["documents"] = entity.GrnDocuments.Select(d => new Dictionary<string, object?>
            {
                ["id"] = d.DocumentId,
                ["name"] = d.DocumentName,
                ["path"] = d.DocumentPath,
                ["type"] = d.DocumentType,
                ["date"] = d.DateCaptured?.ToString("yyyy-MM-dd")
            }).ToArray()
        };
    }

    private static Dictionary<string, object?> MapGraEntityToDict(Gra entity)
    {
        var lineItems = entity.GraDetails.Select(d => new Dictionary<string, object?>
        {
            ["id"] = d.GraDetailId.ToString(),
            ["description"] = d.Description,
            ["grnDetailId"] = d.GrnDetailId,
            ["returnQuantity"] = d.QtyReturned ?? 0m,
            ["unitPrice"] = d.UnitPrice ?? 0m,
            ["amount"] = d.Amount ?? 0m,
            ["vatAmount"] = d.VatAmount ?? 0m,
            ["totalAmount"] = d.TotalAmount ?? 0m,
            ["returnReason"] = d.ReturnReason
        }).ToArray();

        return new Dictionary<string, object?>
        {
            ["id"] = entity.GraId,
            ["graNumber"] = $"GRA-{entity.GraId}",
            ["status"] = StatusMapper.ToStatusName("gra", entity.StatusId),
            ["statusId"] = entity.StatusId,
            ["grnId"] = entity.GrnId,
            ["orderId"] = entity.OrderId,
            ["returnDate"] = entity.ReturnDate?.ToString("yyyy-MM-dd"),
            ["returnReason"] = entity.ReturnReason,
            ["comments"] = entity.Comments,
            ["approvedBy"] = entity.ApprovedBy,
            ["approvedDate"] = entity.ApprovedDate?.ToString("yyyy-MM-dd"),
            ["enabled"] = entity.Enabled,
            ["financialYear"] = "2025/2026",
            ["createdAt"] = entity.DateCaptured?.ToString("o"),
            ["lineItems"] = lineItems,
            ["budgetReleased"] = lineItems.Sum(li => Convert.ToDecimal(li["totalAmount"] ?? 0m)),
            ["documents"] = Array.Empty<object>()
        };
    }

    private Dictionary<string, object?> ConvertToDict(object obj)
    {
        if (obj is Dictionary<string, object?> d) return d;
        try
        {
            var json = JsonSerializer.Serialize(obj);
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.EnumerateObject()
                .ToDictionary(p => p.Name, p => ConvertJsonElement(p.Value));
        }
        catch { return new Dictionary<string, object?>(); }
    }

    private static object? ConvertJsonElement(JsonElement el) => el.ValueKind switch
    {
        JsonValueKind.String => el.GetString(),
        JsonValueKind.Number => el.TryGetInt64(out var l) ? (object)l : el.GetDecimal(),
        JsonValueKind.True => true,
        JsonValueKind.False => false,
        JsonValueKind.Null => null,
        JsonValueKind.Array => el.EnumerateArray().Select(ConvertJsonElement).ToArray(),
        JsonValueKind.Object => el.EnumerateObject().ToDictionary(p => p.Name, p => ConvertJsonElement(p.Value)),
        _ => el.ToString()
    };

    private static string GetStr(Dictionary<string, object?> d, string k)
        => d.TryGetValue(k, out var v) && v != null ? v.ToString()! : "";

    private static void AddAudit(Dictionary<string, object?> item, string action, string message, string type = "action")
    {
        var existing = item.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
        existing.Add(new Dictionary<string, object?> { ["action"] = action, ["by"] = "Admin", ["date"] = DateTime.UtcNow.ToString("yyyy-MM-dd"), ["type"] = type, ["message"] = message });
        item["auditTrail"] = existing.ToArray();
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> CreateGrnDictAsync(Dictionary<string, object?> data)
    {
        data["status"] = "draft";
        data["dateReceived"] = data.GetValueOrDefault("dateReceived")?.ToString() ?? DateTime.UtcNow.ToString("yyyy-MM-dd");
        data["financialYear"] = data.GetValueOrDefault("financialYear")?.ToString() ?? "2025/2026";
        data["createdAt"] = DateTime.UtcNow.ToString("o");
        AddAudit(data, "Created", "GRN captured");

        if (UseDb)
        {
            try
            {
                var memId = AllocateNextGrnId();
                var grnNum = $"GRN-{DateTime.UtcNow:yyyy}-{memId:D3}";
                var entity = new Grn
                {
                    GrnVendorNumber = grnNum,
                    DateCaptured = DateTime.UtcNow,
                    Enabled = true,
                    FinancialYear = data.GetValueOrDefault("financialYear")?.ToString(),
                    StatusId = StatusMapper.ToStatusId("grn", "draft")
                };
                if (data.TryGetValue("orderId", out var oid) && oid != null)
                    entity.OrderId = Convert.ToInt32(oid);
                if (data.TryGetValue("vendorId", out var vid) && vid != null)
                    entity.VendorId = Convert.ToInt32(vid);
                if (data.TryGetValue("description", out var desc) && desc != null)
                    entity.Description = desc.ToString();
                if (data.TryGetValue("comments", out var cmts) && cmts != null)
                    entity.Comments = cmts.ToString();
                if (data.TryGetValue("deliveryNoteNumber", out var dnn) && dnn != null)
                    entity.DeliveryNoteNumber = dnn.ToString();
                if (data.TryGetValue("dateReceived", out var dr) && DateTime.TryParse(dr?.ToString(), out var rcvDate))
                    entity.GrnReceivedDate = rcvDate;
                if (data.TryGetValue("lineItems", out var liObj) && liObj is object[] items)
                {
                    foreach (var item in items)
                    {
                        if (item is Dictionary<string, object?> li)
                        {
                            var detail = new GrnDetail
                            {
                                Description = li.GetValueOrDefault("description")?.ToString(),
                                QtyOrdered = ResolveDecimal(li, "orderedQuantity", "quantityOrdered"),
                                QtyReceived = ResolveDecimal(li, "receivedQuantity", "quantityReceived"),
                                Enabled = true,
                                DateCaptured = DateTime.UtcNow,
                                CapturerId = 1
                            };
                            if (li.TryGetValue("unitPrice", out var up) && up != null)
                                detail.UnitPrice = Convert.ToDecimal(up);
                            detail.Amount = (detail.UnitPrice ?? 0) * (detail.QtyReceived ?? 0);
                            detail.TotalAmount = detail.Amount;
                            entity.GrnDetails.Add(detail);
                        }
                    }
                }
                await _repository.AddAsync(entity);
                await _repository.SaveChangesAsync();
                var dbId = entity.GrnId;
                data["id"] = dbId;
                data["grnNumber"] = grnNum;
                _grns[dbId] = data;
                _logger.LogInformation("Created GRN {Id} in DB with {DetailCount} detail rows via CreateGrnDictAsync", dbId, entity.GrnDetails.Count);
                return (data, null);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for GRN in CreateGrnDictAsync, falling back to in-memory");
                _dbChecker.MarkUnavailable();
            }
        }

        var id = AllocateNextGrnId();
        data["id"] = id;
        data["grnNumber"] = $"GRN-{DateTime.UtcNow:yyyy}-{id:D3}";
        _grns[id] = data;
        _logger.LogInformation("Created GRN {Id} - {GrnNumber} in-memory", id, data["grnNumber"]);
        return (data, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> SubmitGrnDictAsync(int id)
    {
        var grn = await GetGrnDictAsync(id);
        if (grn == null) return (null, "GRN not found");
        var status = GetStr(grn, "status");
        if (status != "draft")
            return (null, $"Cannot submit GRN in '{status}' status. Only draft GRNs can be submitted.");
        grn["status"] = "submitted";
        AddAudit(grn, "Submitted", "GRN submitted for approval");
        await SaveGrnDictAsync(id, grn);
        return (grn, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> ApproveGrnDictAsync(int id)
    {
        var grn = await GetGrnDictAsync(id);
        if (grn == null) return (null, "GRN not found");
        var status = GetStr(grn, "status");
        if (status != "submitted")
            return (null, $"Cannot approve GRN in '{status}' status. Only submitted GRNs can be approved.");

        var toleranceError = await CheckToleranceAsync(grn);
        if (toleranceError != null)
            return (null, toleranceError);

        grn["status"] = "approved";
        grn["approvedDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd");
        grn["approvedBy"] = "Admin";
        AddAudit(grn, "Approved", "GRN approved", "approval");
        await SaveGrnDictAsync(id, grn);

        await UpdateInventoryOnApprovalAsync(id, grn);

        return (grn, null);
    }

    private async Task<string?> CheckToleranceAsync(Dictionary<string, object?> grn)
    {
        if (!UseDb) return null;
        try
        {
            var setup = await _context.GrnApprovalSetups
                .Where(s => s.IsActive == true && s.Enabled == true)
                .FirstOrDefaultAsync();
            var tolerancePct = setup?.TolerancePercentage ?? 10m;
            var allowOver = setup?.AllowOverDelivery ?? true;

            if (grn.TryGetValue("lineItems", out var liObj) && liObj is object[] items)
            {
                foreach (var item in items)
                {
                    if (item is not Dictionary<string, object?> li) continue;
                    var ordered = ResolveDecimal(li, "orderedQuantity", "quantityOrdered");
                    var received = ResolveDecimal(li, "receivedQuantity", "quantityReceived");
                    if (ordered <= 0) continue;
                    var overPct = ((received - ordered) / ordered) * 100m;
                    if (received > ordered && !allowOver)
                        return $"Over-delivery not allowed. Item '{li.GetValueOrDefault("description")}' received {received} vs ordered {ordered}.";
                    if (overPct > tolerancePct)
                        return $"Quantity received exceeds tolerance ({tolerancePct}%). Item '{li.GetValueOrDefault("description")}' over by {overPct:F1}%.";
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Tolerance check failed, proceeding with approval");
        }
        return null;
    }

    private async Task UpdateInventoryOnApprovalAsync(int grnId, Dictionary<string, object?> grn)
    {
        if (!UseDb) return;
        try
        {
            var grnEntity = await _repository.GetWithDetailsAsync(grnId);
            if (grnEntity == null || grnEntity.GrnDetails.Count == 0)
            {
                _logger.LogWarning("No GRN entity/details found for inventory update, GRN {Id}", grnId);
                return;
            }

            var storeId = grnEntity.RecStoreId ?? 1;
            foreach (var detail in grnEntity.GrnDetails.Where(d => d.Enabled != false))
            {
                var qtyReceived = detail.QtyReceived ?? 0m;
                if (qtyReceived <= 0) continue;

                var unitCost = detail.UnitPrice ?? 0m;
                var commodityId = detail.ScoaItemId;

                var invItem = commodityId.HasValue
                    ? await _context.InventoryItems
                        .FirstOrDefaultAsync(i => i.CommodityId == commodityId && i.StoreId == storeId)
                    : null;

                if (invItem != null)
                {
                    var oldQty = invItem.Quantity ?? 0m;
                    var oldAvgCost = invItem.CommodityWeightedAvg ?? 0m;
                    var newQty = oldQty + qtyReceived;
                    invItem.CommodityWeightedAvg = newQty > 0 ? ((oldAvgCost * oldQty) + (unitCost * qtyReceived)) / newQty : unitCost;
                    invItem.Quantity = newQty;
                    invItem.UnitPrice = unitCost;
                    invItem.RunningTotal = invItem.CommodityWeightedAvg * newQty;
                    invItem.GrnDetailId = detail.GrnDetailId;
                    invItem.DateModified = DateTime.UtcNow;

                    _context.InventoryGrnDetails.Add(new InventoryGrnDetail
                    {
                        InventoryId = invItem.InventoryId,
                        GrnDetailId = detail.GrnDetailId,
                        UnitCost = unitCost,
                        Quantity = qtyReceived,
                        Enabled = true
                    });
                }
                else
                {
                    var newItem = new InventoryItem
                    {
                        CommodityId = commodityId,
                        StoreId = storeId,
                        Quantity = qtyReceived,
                        CommodityWeightedAvg = unitCost,
                        UnitPrice = unitCost,
                        RunningTotal = unitCost * qtyReceived,
                        GrnDetailId = detail.GrnDetailId,
                        DateCaptured = DateTime.UtcNow,
                        CapturerId = 1,
                        FinYear = grnEntity.FinancialYear
                    };
                    _context.InventoryItems.Add(newItem);
                    await _context.SaveChangesAsync();

                    _context.InventoryGrnDetails.Add(new InventoryGrnDetail
                    {
                        InventoryId = newItem.InventoryId,
                        GrnDetailId = detail.GrnDetailId,
                        UnitCost = unitCost,
                        Quantity = qtyReceived,
                        Enabled = true
                    });
                }
            }

            await _context.SaveChangesAsync();
            grn["inventoryUpdated"] = true;
            AddAudit(grn, "Inventory Updated", "Inventory quantities and costs updated from GRN", "system");
            _logger.LogInformation("Inventory auto-updated for GRN {Id} with {Count} detail lines", grnId, grnEntity.GrnDetails.Count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Inventory auto-update failed for GRN {Id}, GRN still approved", grnId);
            grn["inventoryUpdateError"] = ex.Message;
        }
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> VoidGrnDictAsync(int id)
    {
        var grn = await GetGrnDictAsync(id);
        if (grn == null) return (null, "GRN not found");
        var status = GetStr(grn, "status");
        if (status == "voided") return (null, "GRN is already voided.");
        if (status == "approved") return (null, "Cannot void an approved GRN. Contact finance to reverse.");
        grn["status"] = "voided";
        grn["voidDetails"] = new { voidedBy = "Admin", voidDate = DateTime.UtcNow.ToString("yyyy-MM-dd"), reason = "Voided by user" };
        AddAudit(grn, "Voided", "GRN voided", "rejection");
        await SaveGrnDictAsync(id, grn);
        return (grn, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> CreateReturnDictAsync(int grnId, Dictionary<string, object?> data)
    {
        var grn = await GetGrnDictAsync(grnId);
        if (grn == null) return (null, "Referenced GRN not found.");
        var grnStatus = GetStr(grn, "status");
        if (grnStatus != "approved")
            return (null, $"GRN is in '{grnStatus}' status. Only approved GRNs can have returns captured.");

        var id = AllocateNextReturnId();
        data["id"] = id;
        data["returnNumber"] = $"RET-{DateTime.UtcNow:yyyy}-{id:D3}";
        data["status"] = "draft";
        data["returnDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd");
        data["financialYear"] = "2025/2026";
        data["returnBy"] = "Admin";
        data["createdAt"] = DateTime.UtcNow.ToString("o");

        if (!data.ContainsKey("grnNumber") || data["grnNumber"] == null)
            data["grnNumber"] = grn.TryGetValue("grnNumber", out var gn) ? gn : null;
        if (!data.ContainsKey("orderNumber") || data["orderNumber"] == null)
            data["orderNumber"] = grn.TryGetValue("orderNumber", out var on) ? on : null;
        if (!data.ContainsKey("vendorName") || data["vendorName"]?.ToString() == "")
            data["vendorName"] = grn.TryGetValue("vendorName", out var vn) ? vn : null;
        if (!data.ContainsKey("orderId") || data["orderId"] == null)
            data["orderId"] = grn.TryGetValue("orderId", out var oi) ? oi : null;

        AddAudit(data, "Created", "Goods return captured");
        await SaveReturnDictAsync(id, data);
        _logger.LogInformation("Created Return {Id} - {ReturnNumber}", id, data["returnNumber"]);
        return (data, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> SubmitReturnDictAsync(int id)
    {
        var ret = await GetReturnDictAsync(id);
        if (ret == null) return (null, "Return not found");
        var status = GetStr(ret, "status");
        if (status != "draft")
            return (null, $"Cannot submit return in '{status}' status. Only draft returns can be submitted.");
        ret["status"] = "pending_approval";
        AddAudit(ret, "Submitted", "Return submitted for approval");
        await SaveReturnDictAsync(id, ret);
        return (ret, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> ApproveReturnDictAsync(int id)
    {
        var ret = await GetReturnDictAsync(id);
        if (ret == null) return (null, "Return not found");
        var status = GetStr(ret, "status");
        if (status != "pending_approval")
            return (null, $"Cannot approve return in '{status}' status. Only pending returns can be approved.");
        ret["status"] = "approved";
        ret["approvedBy"] = "Admin";
        ret["approvalDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd");
        AddAudit(ret, "Approved", "Return approved", "approval");
        await SaveReturnDictAsync(id, ret);
        return (ret, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> DeclineReturnDictAsync(int id, string? comment)
    {
        var ret = await GetReturnDictAsync(id);
        if (ret == null) return (null, "Return not found");
        var status = GetStr(ret, "status");
        if (status != "pending_approval")
            return (null, $"Cannot decline return in '{status}' status. Only pending returns can be declined.");
        ret["status"] = "declined";
        ret["approvedBy"] = "Admin";
        ret["approvalDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd");
        ret["approvalComments"] = comment ?? "";
        AddAudit(ret, "Declined", $"Return declined: {comment ?? ""}", "rejection");
        await SaveReturnDictAsync(id, ret);
        return (ret, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> CreateGraDictAsync(int returnId, string? description)
    {
        var ret = await GetReturnDictAsync(returnId);
        if (ret == null) return (null, "Invalid or missing return ID. Select an approved return.");
        var retStatus = GetStr(ret, "status");
        if (retStatus != "approved")
            return (null, $"Return is in '{retStatus}' status. Only approved returns can have GRAs created.");

        ret["status"] = "gra_created";

        if (UseDb)
        {
            try
            {
                var entity = new Gra
                {
                    ReturnReason = description ?? "",
                    StatusId = StatusMapper.ToStatusId("gra", "active"),
                    DateCaptured = DateTime.UtcNow,
                    Enabled = true,
                    CapturerId = 1
                };
                if (ret.TryGetValue("grnId", out var gi) && gi != null)
                    entity.GrnId = Convert.ToInt32(gi);
                if (ret.TryGetValue("orderId", out var oi) && oi != null)
                    entity.OrderId = Convert.ToInt32(oi);
                await _repository.AddGraAsync(entity);
                await _repository.SaveChangesAsync();
                var dbId = entity.GraId;
                var gra = new Dictionary<string, object?>
                {
                    ["id"] = dbId,
                    ["graNumber"] = $"GRA-{DateTime.UtcNow:yyyy}-{dbId:D3}",
                    ["debitNoteNumber"] = $"DN-{DateTime.UtcNow:yyyy}-{dbId:D3}",
                    ["returnId"] = returnId,
                    ["returnNumber"] = ret.TryGetValue("returnNumber", out var rn) ? rn : null,
                    ["grnId"] = gi,
                    ["orderId"] = oi,
                    ["vendorName"] = ret.TryGetValue("vendorName", out var vn) ? vn : null,
                    ["status"] = "active",
                    ["description"] = description ?? "",
                    ["createdDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                    ["createdBy"] = "Admin",
                    ["budgetReleased"] = ret.TryGetValue("budgetImpact", out var bi) ? bi : 0m,
                    ["lineItems"] = ret.TryGetValue("lineItems", out var li) ? li : Array.Empty<object>(),
                    ["financialYear"] = "2025/2026",
                };
                AddAudit(ret, "GRA Created", $"GRA {gra["graNumber"]} created from this return");
                await SaveReturnDictAsync(returnId, ret);
                _gras[dbId] = gra;
                _logger.LogInformation("Created GRA {Id} in DB from Return {ReturnId}", dbId, returnId);
                return (gra, null);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for GRA, falling back to in-memory");
                _dbChecker.MarkUnavailable();
            }
        }

        var id = AllocateNextGraId();
        var graDict = new Dictionary<string, object?>
        {
            ["id"] = id,
            ["graNumber"] = $"GRA-{DateTime.UtcNow:yyyy}-{id:D3}",
            ["debitNoteNumber"] = $"DN-{DateTime.UtcNow:yyyy}-{id:D3}",
            ["returnId"] = returnId,
            ["returnNumber"] = ret.TryGetValue("returnNumber", out var rn2) ? rn2 : null,
            ["grnId"] = ret.TryGetValue("grnId", out var gi2) ? gi2 : null,
            ["orderId"] = ret.TryGetValue("orderId", out var oi2) ? oi2 : null,
            ["vendorName"] = ret.TryGetValue("vendorName", out var vn2) ? vn2 : null,
            ["status"] = "active",
            ["description"] = description ?? "",
            ["createdDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            ["createdBy"] = "Admin",
            ["budgetReleased"] = ret.TryGetValue("budgetImpact", out var bi2) ? bi2 : 0m,
            ["lineItems"] = ret.TryGetValue("lineItems", out var li2) ? li2 : Array.Empty<object>(),
            ["financialYear"] = "2025/2026",
        };

        AddAudit(ret, "GRA Created", $"GRA {graDict["graNumber"]} created from this return");
        await SaveReturnDictAsync(returnId, ret);
        _gras[id] = graDict;
        _logger.LogInformation("Created GRA {Id} - {GraNumber} in-memory from Return {ReturnId}", id, graDict["graNumber"], returnId);
        return (graDict, null);
    }

    public async Task<object> GetApprovalSetupAsync()
    {
        if (UseDb)
        {
            try
            {
                var setups = await _context.GrnApprovalSetups
                    .Where(s => s.Enabled == true)
                    .OrderBy(s => s.ApprovalLevel)
                    .ToListAsync();
                return new
                {
                    levels = setups.Select(s => new
                    {
                        id = s.GrnApprovalSetupId,
                        level = s.ApprovalLevel,
                        approverRoleId = s.ApproverRoleId,
                        approverEmployeeId = s.ApproverEmployeeId,
                        minAmount = s.MinAmount,
                        maxAmount = s.MaxAmount,
                        departmentId = s.DepartmentId,
                        isActive = s.IsActive,
                        tolerancePercentage = s.TolerancePercentage,
                        allowOverDelivery = s.AllowOverDelivery
                    }),
                    total = setups.Count
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for GRN approval setup");
                _dbChecker.MarkUnavailable();
            }
        }
        return new { levels = Array.Empty<object>(), total = 0 };
    }

    public async Task<object> GetServiceEntrySheetsAsync(int? orderId, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var query = _context.ServiceEntrySheets
                    .Where(s => s.Enabled == true)
                    .Include(s => s.Details)
                    .AsQueryable();
                if (orderId.HasValue)
                    query = query.Where(s => s.OrderId == orderId);
                var total = await query.CountAsync();
                var items = await query.OrderByDescending(s => s.DateCaptured)
                    .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
                return new
                {
                    items = items.Select(s => new
                    {
                        id = s.ServiceEntryId, orderId = s.OrderId, grnId = s.GrnId,
                        vendorId = s.VendorId, serviceDescription = s.ServiceDescription,
                        serviceDate = s.ServiceDate, completionDate = s.CompletionDate,
                        completionPercentage = s.CompletionPercentage, totalAmount = s.TotalAmount,
                        statusId = s.StatusId, certifiedBy = s.CertifiedBy, certifiedDate = s.CertifiedDate,
                        approvedBy = s.ApprovedBy, approvedDate = s.ApprovedDate,
                        comments = s.Comments, financialYear = s.FinancialYear,
                        details = s.Details.Where(d => d.Enabled != false).Select(d => new
                        {
                            id = d.ServiceEntryDetailId, description = d.Description,
                            quantityOrdered = d.QuantityOrdered, quantityDelivered = d.QuantityDelivered,
                            unitPrice = d.UnitPrice, amount = d.Amount, completionPercentage = d.CompletionPercentage
                        })
                    }),
                    total, page, pageSize
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for service entry sheets");
                _dbChecker.MarkUnavailable();
            }
        }
        return new { items = Array.Empty<object>(), total = 0, page, pageSize };
    }

    public async Task<object?> GetServiceEntrySheetByIdAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var s = await _context.ServiceEntrySheets
                    .Include(se => se.Details)
                    .FirstOrDefaultAsync(se => se.ServiceEntryId == id);
                if (s == null) return null;
                return new
                {
                    id = s.ServiceEntryId, orderId = s.OrderId, grnId = s.GrnId,
                    vendorId = s.VendorId, serviceDescription = s.ServiceDescription,
                    serviceDate = s.ServiceDate, completionDate = s.CompletionDate,
                    completionPercentage = s.CompletionPercentage, totalAmount = s.TotalAmount,
                    statusId = s.StatusId, certifiedBy = s.CertifiedBy, certifiedDate = s.CertifiedDate,
                    approvedBy = s.ApprovedBy, approvedDate = s.ApprovedDate,
                    comments = s.Comments, financialYear = s.FinancialYear,
                    details = s.Details.Where(d => d.Enabled != false).Select(d => new
                    {
                        id = d.ServiceEntryDetailId, description = d.Description,
                        quantityOrdered = d.QuantityOrdered, quantityDelivered = d.QuantityDelivered,
                        unitPrice = d.UnitPrice, amount = d.Amount, completionPercentage = d.CompletionPercentage
                    })
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for service entry sheet {Id}", id);
                _dbChecker.MarkUnavailable();
            }
        }
        return null;
    }

    public async Task<(object? result, string? error)> CreateServiceEntrySheetAsync(Dictionary<string, object?> data)
    {
        if (UseDb)
        {
            try
            {
                var entity = new ServiceEntrySheet
                {
                    OrderId = DictHelper.GetNullableInt(data, "orderId"),
                    GrnId = DictHelper.GetNullableInt(data, "grnId"),
                    VendorId = DictHelper.GetNullableInt(data, "vendorId"),
                    ServiceDescription = data.GetValueOrDefault("serviceDescription")?.ToString(),
                    ServiceDate = DateTime.TryParse(data.GetValueOrDefault("serviceDate")?.ToString(), out var sd) ? sd : DateTime.UtcNow,
                    CompletionPercentage = 0,
                    StatusId = 0,
                    Comments = data.GetValueOrDefault("comments")?.ToString(),
                    FinancialYear = data.GetValueOrDefault("financialYear")?.ToString() ?? "2025/2026",
                    Enabled = true,
                    DateCaptured = DateTime.UtcNow,
                    CapturerId = 1
                };
                if (data.TryGetValue("details", out var detailsObj) && detailsObj is object[] detailItems)
                {
                    foreach (var item in detailItems)
                    {
                        if (item is Dictionary<string, object?> d)
                        {
                            entity.Details.Add(new ServiceEntrySheetDetail
                            {
                                Description = d.GetValueOrDefault("description")?.ToString(),
                                QuantityOrdered = ResolveDecimal(d, "quantityOrdered", "quantity"),
                                QuantityDelivered = ResolveDecimal(d, "quantityDelivered", "delivered"),
                                UnitPrice = ResolveDecimal(d, "unitPrice", "price"),
                                Amount = ResolveDecimal(d, "amount", "total"),
                                CompletionPercentage = ResolveDecimal(d, "completionPercentage", "completion"),
                                Enabled = true
                            });
                        }
                    }
                }
                _context.ServiceEntrySheets.Add(entity);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Created Service Entry Sheet {Id}", entity.ServiceEntryId);
                return (new { id = entity.ServiceEntryId, status = "draft" }, null);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for service entry sheet");
                _dbChecker.MarkUnavailable();
                return (null, "Failed to create service entry sheet: " + ex.Message);
            }
        }
        return (null, "Database not available");
    }

    public async Task<(object? result, string? error)> CertifyServiceEntrySheetAsync(int id)
    {
        if (!UseDb) return (null, "Database not available");
        try
        {
            var entity = await _context.ServiceEntrySheets.FindAsync(id);
            if (entity == null) return (null, "Service entry sheet not found");
            if (entity.StatusId != 0 && entity.StatusId != 1) return (null, "Can only certify draft or submitted service entry sheets");
            entity.StatusId = 2;
            entity.CertifiedBy = 1;
            entity.CertifiedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return (new { id, status = "certified" }, null);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Certify failed for SES {Id}", id);
            return (null, ex.Message);
        }
    }

    public async Task<(object? result, string? error)> ApproveServiceEntrySheetAsync(int id)
    {
        if (!UseDb) return (null, "Database not available");
        try
        {
            var entity = await _context.ServiceEntrySheets.FindAsync(id);
            if (entity == null) return (null, "Service entry sheet not found");
            if (entity.StatusId != 2) return (null, "Can only approve certified service entry sheets");
            entity.StatusId = 3;
            entity.ApprovedBy = 1;
            entity.ApprovedDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return (new { id, status = "approved" }, null);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Approve failed for SES {Id}", id);
            return (null, ex.Message);
        }
    }

    private static decimal ResolveDecimal(Dictionary<string, object?> dict, string primaryKey, string fallbackKey)
    {
        if (dict.TryGetValue(primaryKey, out var v1) && v1 != null)
        {
            try { return Convert.ToDecimal(v1); } catch { }
        }
        if (dict.TryGetValue(fallbackKey, out var v2) && v2 != null)
        {
            try { return Convert.ToDecimal(v2); } catch { }
        }
        return 0m;
    }
}
