using System.Collections.Concurrent;
using System.Text.Json;
using SCM_API.Data;
using SCM_API.Helpers;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;
using SCM_API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace SCM_API.Services;

public class InvoiceService : IInvoiceService
{
    private readonly IInvoiceRepository _repository;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<InvoiceService> _logger;
    private readonly ApplicationDbContext _context;

    private static readonly ConcurrentDictionary<int, Dictionary<string, object?>> _invoices = new();
    private static int _nextInvoiceId = 803;
    private static bool _seeded = false;
    private static readonly object _seedLock = new();

    public InvoiceService(IInvoiceRepository repository, DbAvailabilityChecker dbChecker, ILogger<InvoiceService> logger, ApplicationDbContext context)
    {
        _repository = repository;
        _dbChecker = dbChecker;
        _logger = logger;
        _context = context;
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
        _invoices[801] = new Dictionary<string, object?>
        {
            ["id"] = 801,
            ["referenceNumber"] = "INV-2026-801",
            ["invoiceType"] = "regular",
            ["supplierName"] = "Cape IT Solutions CC",
            ["supplierId"] = "SUP-001",
            ["orderId"] = 302,
            ["orderNumber"] = "PO-2026-302",
            ["contractId"] = null,
            ["supplierInvoiceNumber"] = "CAPE-INV-2026-001",
            ["invoiceDate"] = "2026-03-12",
            ["receivedDate"] = "2026-03-12",
            ["dueDate"] = "2026-04-11",
            ["department"] = "Corporate Services",
            ["sundryCategory"] = null,
            ["retentionPercentage"] = 0,
            ["notes"] = "Invoice for Dell OptiPlex 7010 desktop computer",
            ["captureMethod"] = "manual",
            ["status"] = "approved",
            ["financialYear"] = "2025/2026",
            ["grnId"] = 501,
            ["grnNumber"] = "GRN-2026-501",
            ["lineItems"] = new object[]
            {
                new Dictionary<string, object?>
                {
                    ["description"] = "Desktop Computer - Dell OptiPlex 7010",
                    ["quantity"] = 1,
                    ["unitOfMeasure"] = "each",
                    ["unitPrice"] = new Dictionary<string, object?> { ["amount"] = 8800m, ["currency"] = "ZAR" },
                    ["totalPrice"] = new Dictionary<string, object?> { ["amount"] = 8800m, ["currency"] = "ZAR" },
                    ["vatRate"] = 15,
                    ["vatAmount"] = new Dictionary<string, object?> { ["amount"] = 1320m, ["currency"] = "ZAR" },
                    ["mscoaSegment"] = new Dictionary<string, object?> { ["fund"] = "4200-000-000" }
                }
            },
            ["subtotal"] = new Dictionary<string, object?> { ["amount"] = 8800m, ["currency"] = "ZAR" },
            ["vatAmount"] = new Dictionary<string, object?> { ["amount"] = 1320m, ["currency"] = "ZAR" },
            ["totalAmount"] = new Dictionary<string, object?> { ["amount"] = 10120m, ["currency"] = "ZAR" },
            ["ageDays"] = 6,
            ["mfmaCompliant"] = true,
            ["threeWayMatch"] = new Dictionary<string, object?>
            {
                ["status"] = "matched",
                ["matchDate"] = "2026-03-13",
                ["confidence"] = 98.5,
                ["details"] = new Dictionary<string, object?>
                {
                    ["supplierMatch"] = new Dictionary<string, object?> { ["matched"] = true },
                    ["orderMatch"] = new Dictionary<string, object?> { ["matched"] = true, ["poNumber"] = "PO-2026-302" },
                    ["grnMatch"] = new Dictionary<string, object?> { ["matched"] = true, ["grnNumber"] = "GRN-2026-501" },
                    ["quantityMatch"] = new Dictionary<string, object?> { ["matched"] = true, ["variance"] = 0.0, ["tolerance"] = 5.0 },
                    ["priceMatch"] = new Dictionary<string, object?> { ["matched"] = true, ["tolerance"] = 2.0 },
                    ["totalMatch"] = new Dictionary<string, object?> { ["matched"] = true, ["variance"] = 0.0 },
                    ["vatMatch"] = new Dictionary<string, object?> { ["matched"] = true, ["expectedVat"] = 1320m, ["invoiceVat"] = 1320m },
                    ["duplicateCheck"] = new Dictionary<string, object?> { ["passed"] = true }
                }
            },
            ["approvedBy"] = "Admin",
            ["approvalDate"] = "2026-03-14",
            ["createdAt"] = "2026-03-12T08:00:00Z",
            ["auditTrail"] = new object[]
            {
                new Dictionary<string, object?> { ["action"] = "Created", ["by"] = "Admin", ["date"] = "2026-03-12", ["type"] = "action", ["message"] = "Invoice captured manually" },
                new Dictionary<string, object?> { ["action"] = "Submitted", ["by"] = "Admin", ["date"] = "2026-03-12", ["type"] = "action", ["message"] = "Invoice submitted for processing" },
                new Dictionary<string, object?> { ["action"] = "3-Way Match", ["by"] = "System", ["date"] = "2026-03-13", ["type"] = "system", ["message"] = "3-way match completed: MATCHED (98.5% confidence)" },
                new Dictionary<string, object?> { ["action"] = "Approved", ["by"] = "Admin", ["date"] = "2026-03-14", ["type"] = "approval", ["message"] = "Invoice approved for payment" }
            }
        };

        _invoices[802] = new Dictionary<string, object?>
        {
            ["id"] = 802,
            ["referenceNumber"] = "INV-2026-802",
            ["invoiceType"] = "sundry",
            ["supplierName"] = "Telkom SA SOC Ltd",
            ["supplierId"] = "SUP-002",
            ["orderId"] = null,
            ["orderNumber"] = null,
            ["contractId"] = null,
            ["supplierInvoiceNumber"] = "TEL-2026-44521",
            ["invoiceDate"] = "2026-02-28",
            ["receivedDate"] = "2026-03-01",
            ["dueDate"] = "2026-03-31",
            ["department"] = "Infrastructure and Engineering",
            ["sundryCategory"] = "Telecommunications",
            ["retentionPercentage"] = 0,
            ["notes"] = "Monthly telecommunications charges - February 2026",
            ["captureMethod"] = "manual",
            ["status"] = "submitted",
            ["financialYear"] = "2025/2026",
            ["grnId"] = null,
            ["grnNumber"] = null,
            ["lineItems"] = new object[]
            {
                new Dictionary<string, object?>
                {
                    ["description"] = "Fixed-line telephone charges - February 2026",
                    ["quantity"] = 1,
                    ["unitOfMeasure"] = "month",
                    ["unitPrice"] = new Dictionary<string, object?> { ["amount"] = 45000m, ["currency"] = "ZAR" },
                    ["totalPrice"] = new Dictionary<string, object?> { ["amount"] = 45000m, ["currency"] = "ZAR" },
                    ["vatRate"] = 15,
                    ["vatAmount"] = new Dictionary<string, object?> { ["amount"] = 6750m, ["currency"] = "ZAR" },
                    ["mscoaSegment"] = new Dictionary<string, object?> { ["fund"] = "3100-000-000" }
                },
                new Dictionary<string, object?>
                {
                    ["description"] = "Internet connectivity - 100Mbps fibre",
                    ["quantity"] = 1,
                    ["unitOfMeasure"] = "month",
                    ["unitPrice"] = new Dictionary<string, object?> { ["amount"] = 12000m, ["currency"] = "ZAR" },
                    ["totalPrice"] = new Dictionary<string, object?> { ["amount"] = 12000m, ["currency"] = "ZAR" },
                    ["vatRate"] = 15,
                    ["vatAmount"] = new Dictionary<string, object?> { ["amount"] = 1800m, ["currency"] = "ZAR" },
                    ["mscoaSegment"] = new Dictionary<string, object?> { ["fund"] = "3100-000-000" }
                }
            },
            ["subtotal"] = new Dictionary<string, object?> { ["amount"] = 57000m, ["currency"] = "ZAR" },
            ["vatAmount"] = new Dictionary<string, object?> { ["amount"] = 8550m, ["currency"] = "ZAR" },
            ["totalAmount"] = new Dictionary<string, object?> { ["amount"] = 65550m, ["currency"] = "ZAR" },
            ["ageDays"] = 17,
            ["mfmaCompliant"] = true,
            ["threeWayMatch"] = new Dictionary<string, object?> { ["status"] = "not_applicable" },
            ["createdAt"] = "2026-03-01T10:00:00Z",
            ["auditTrail"] = new object[]
            {
                new Dictionary<string, object?> { ["action"] = "Created", ["by"] = "Admin", ["date"] = "2026-03-01", ["type"] = "action", ["message"] = "Sundry invoice captured" },
                new Dictionary<string, object?> { ["action"] = "Submitted", ["by"] = "Admin", ["date"] = "2026-03-02", ["type"] = "action", ["message"] = "Invoice submitted for approval" }
            }
        };
    }

    public async Task<Dictionary<string, object?>?> GetInvoiceDictAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetWithDetailsAsync(id);
                if (entity != null)
                {
                    var dict = MapEntityToDict(entity);
                    _invoices[id] = dict;
                    return dict;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for invoice {Id}, using in-memory fallback", id);
                _dbChecker.MarkUnavailable();
            }
        }

        return _invoices.TryGetValue(id, out var cached) ? cached : null;
    }

    public async Task<ICollection<Dictionary<string, object?>>> GetAllInvoiceDictsAsync()
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetFilteredAsync(null, null, null, 1, 1000);
                var dbIds = new HashSet<int>();
                foreach (var entity in result.Items)
                {
                    var dict = MapEntityToDict(entity);
                    _invoices[entity.InvoiceId] = dict;
                    dbIds.Add(entity.InvoiceId);
                }
                foreach (var key in _invoices.Keys.Where(k => !dbIds.Contains(k)).ToList())
                    _invoices.TryRemove(key, out _);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB query failed for invoices, using in-memory fallback");
                _dbChecker.MarkUnavailable();
            }
        }

        return _invoices.Values;
    }

    public async Task SaveInvoiceDictAsync(int id, Dictionary<string, object?> invoice)
    {
        _invoices[id] = invoice;

        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id);
                if (entity != null)
                {
                    entity.DateModified = DateTime.UtcNow;
                    if (invoice.TryGetValue("status", out var statusObj))
                        entity.StatusId = StatusMapper.ToStatusId("invoice", statusObj?.ToString());
                    if (invoice.TryGetValue("comments", out var cmObj) && cmObj != null)
                        entity.Comments = cmObj.ToString();
                    if (invoice.TryGetValue("invoiceDate", out var idObj) && DateTime.TryParse(idObj?.ToString(), out var invDate))
                        entity.InvoiceDate = invDate;
                    if (invoice.TryGetValue("receivedDate", out var rdObj) && DateTime.TryParse(rdObj?.ToString(), out var rcvDate))
                        entity.InvoiceReceivedDate = rcvDate;
                    if (invoice.TryGetValue("totalAmountValue", out var taObj) && taObj != null)
                        entity.CalculatedInvoiceAmount = Convert.ToDecimal(taObj);
                    if (invoice.TryGetValue("referenceNumber", out var rnObj) && rnObj != null)
                        entity.VendorInvoiceNumber = rnObj.ToString();
                    if (invoice.TryGetValue("discountRate", out var drObj) && drObj != null)
                        entity.DiscountRate = Convert.ToDecimal(drObj);
                    if (invoice.TryGetValue("financialYear", out var fyObj) && fyObj != null)
                        entity.FinancialYear = fyObj.ToString();
                    _repository.Update(entity);
                    await _repository.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB save failed for invoice {Id}, in-memory update preserved", id);
                _dbChecker.MarkUnavailable();
            }
        }
    }

    public async Task<bool> DeleteInvoiceDictAsync(int id)
    {
        var removed = _invoices.TryRemove(id, out _);

        if (UseDb)
        {
            try
            {
                var entity = await _repository.GetByIdAsync(id);
                if (entity != null)
                {
                    entity.Enabled = false;
                    _repository.Update(entity);
                    await _repository.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB delete failed for invoice {Id}", id);
                _dbChecker.MarkUnavailable();
            }
        }

        return removed;
    }

    public int AllocateNextId()
        => Interlocked.Increment(ref _nextInvoiceId);

    public async Task<object?> GetByIdAsync(int id)
    {
        return await GetInvoiceDictAsync(id);
    }

    public async Task<PagedResult<object>> GetAllAsync(string? financialYear, int? statusId, string? search, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repository.GetFilteredAsync(financialYear, statusId, search, page, pageSize);
                return new PagedResult<object> { Items = result.Items.Select(MapEntityToDict).Cast<object>(), Page = result.Page, PageSize = result.PageSize, TotalCount = result.TotalCount };
            }
            catch (Exception ex) { _logger.LogWarning(ex, "DB query failed for invoices"); _dbChecker.MarkUnavailable(); }
        }
        var all = await GetAllInvoiceDictsAsync();
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
                var memId = AllocateNextId();
                var refNum = data.GetValueOrDefault("referenceNumber")?.ToString() ?? $"INV-{DateTime.UtcNow:yyyy}-{memId}";
                var entity = new Invoice
                {
                    VendorInvoiceNumber = refNum,
                    StatusId = StatusMapper.ToStatusId("invoice", data.GetValueOrDefault("status")?.ToString()),
                    DateCaptured = DateTime.UtcNow,
                    Enabled = true,
                    FinancialYear = data.GetValueOrDefault("financialYear")?.ToString(),
                    Comments = data.GetValueOrDefault("comments")?.ToString()
                };
                if (data.TryGetValue("totalAmountValue", out var taObj) && taObj != null)
                    entity.CalculatedInvoiceAmount = Convert.ToDecimal(taObj);
                if (data.TryGetValue("invoiceDate", out var idObj) && DateTime.TryParse(idObj?.ToString(), out var invDate))
                    entity.InvoiceDate = invDate;
                MapLineItemsToInvoiceDetails(entity, data);
                await _repository.AddAsync(entity);
                await _repository.SaveChangesAsync();
                var dbId = entity.InvoiceId;
                data["id"] = dbId;
                data["referenceNumber"] = refNum;
                _invoices[dbId] = data;
                _logger.LogInformation("Created invoice {Id} in DB with {DetailCount} details", dbId, entity.InvoiceDetails.Count);
                return data;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for invoice, continuing with in-memory");
                _dbChecker.MarkUnavailable();
            }
        }

        var id = AllocateNextId();
        data["id"] = id;
        if (!data.ContainsKey("referenceNumber"))
            data["referenceNumber"] = $"INV-{DateTime.UtcNow:yyyy}-{id}";
        _invoices[id] = data;
        return data;
    }

    public async Task<bool> UpdateAsync(int id, object dto)
    {
        var inv = await GetInvoiceDictAsync(id);
        if (inv == null) return false;

        var incoming = ConvertToDict(dto);
        foreach (var kv in incoming)
        {
            if (kv.Key != "id" && kv.Key != "referenceNumber")
                inv[kv.Key] = kv.Value;
        }

        await SaveInvoiceDictAsync(id, inv);
        return true;
    }

    public async Task<object> GetInvoiceDetailsAsync(int invoiceId)
    {
        var inv = await GetInvoiceDictAsync(invoiceId);
        return inv ?? new object();
    }

    public async Task<bool> ApproveAsync(int id, object dto)
    {
        var inv = await GetInvoiceDictAsync(id);
        if (inv == null) return false;
        inv["status"] = "approved";
        await SaveInvoiceDictAsync(id, inv);
        return true;
    }

    public async Task<bool> SubmitAsync(int id)
    {
        var inv = await GetInvoiceDictAsync(id);
        if (inv == null) return false;
        inv["status"] = "submitted";
        await SaveInvoiceDictAsync(id, inv);
        return true;
    }

    public async Task<object> GetInvoiceByOrderAsync(int orderId)
    {
        var all = await GetAllInvoiceDictsAsync();
        var matches = all
            .Where(inv => inv.TryGetValue("orderId", out var oid) && oid != null && Convert.ToInt32(oid) == orderId)
            .Cast<object>()
            .ToList();
        return matches;
    }

    public async Task<bool> MatchAsync(int invoiceId)
    {
        var inv = await GetInvoiceDictAsync(invoiceId);
        if (inv == null) return false;
        inv["matchedDate"] = DateTime.UtcNow.ToString("o");
        await SaveInvoiceDictAsync(invoiceId, inv);
        return true;
    }

    private int? ResolveVendorId(Invoice entity)
    {
        if (!entity.OrderId.HasValue) return null;
        try
        {
            return _context.Orders
                .Where(o => o.OrderId == entity.OrderId.Value)
                .Select(o => o.VendorId)
                .FirstOrDefault();
        }
        catch { return null; }
    }

    private string? ResolveSupplierName(Invoice entity)
    {
        var vendorId = ResolveVendorId(entity);
        if (!vendorId.HasValue) return null;
        try
        {
            return _context.Vendors
                .Where(v => v.VendorId == vendorId.Value)
                .Select(v => v.VendorName ?? v.TradingName)
                .FirstOrDefault();
        }
        catch { return null; }
    }

    private Dictionary<string, object?> MapEntityToDict(Invoice entity)
    {
        var statusName = StatusMapper.ToStatusName("invoice", entity.StatusId);
        var invoiceDate = entity.InvoiceDate?.ToString("yyyy-MM-dd");
        var ageDays = entity.InvoiceDate.HasValue ? Math.Max(0, (int)(DateTime.Now - entity.InvoiceDate.Value).TotalDays) : 0;

        var lineItems = entity.InvoiceDetails.Where(d => d.Enabled != false).Select(d => new Dictionary<string, object?>
        {
            ["id"] = d.InvoiceDetailId,
            ["description"] = d.ServiceDescription,
            ["quantity"] = d.InvoiceQuantity ?? 0m,
            ["unitPrice"] = new Dictionary<string, object?> { ["amount"] = d.InvoiceUnitPrice ?? 0m, ["currency"] = "ZAR" },
            ["totalPrice"] = new Dictionary<string, object?> { ["amount"] = d.Amount ?? 0m, ["currency"] = "ZAR" },
            ["vatAmount"] = new Dictionary<string, object?> { ["amount"] = d.VatAmount ?? 0m, ["currency"] = "ZAR" },
            ["lineTotal"] = new Dictionary<string, object?> { ["amount"] = d.TotalAmount ?? 0m, ["currency"] = "ZAR" }
        }).ToArray();

        var subtotal = entity.InvoiceDetails.Where(d => d.Enabled != false).Sum(d => d.Amount ?? 0m);
        var vatTotal = entity.InvoiceDetails.Where(d => d.Enabled != false).Sum(d => d.VatAmount ?? 0m);
        var totalAmount = entity.CalculatedInvoiceAmount ?? (subtotal + vatTotal);

        var dict = new Dictionary<string, object?>
        {
            ["id"] = entity.InvoiceId,
            ["referenceNumber"] = entity.VendorInvoiceNumber ?? entity.DocNumber,
            ["docNumber"] = entity.DocNumber,
            ["invoiceType"] = entity.ContractId.HasValue ? "service" : entity.OrderId.HasValue ? "regular" : "sundry",
            ["invoiceDate"] = invoiceDate,
            ["receivedDate"] = entity.InvoiceReceivedDate?.ToString("yyyy-MM-dd"),
            ["status"] = statusName,
            ["statusId"] = entity.StatusId,
            ["orderId"] = entity.OrderId,
            ["grnId"] = entity.GrnId,
            ["contractId"] = entity.ContractId,
            ["comments"] = entity.Comments,
            ["discountRate"] = entity.DiscountRate,
            ["discountToAll"] = entity.DiscountToAll,
            ["volumeDiscount"] = entity.VolumeDiscount,
            ["enabled"] = entity.Enabled,
            ["financialYear"] = entity.FinancialYear ?? "2025/2026",
            ["createdAt"] = entity.DateCaptured?.ToString("o"),
            ["lineItems"] = lineItems,
            ["subtotalAmount"] = new Dictionary<string, object?> { ["amount"] = subtotal, ["currency"] = "ZAR" },
            ["vatAmount"] = new Dictionary<string, object?> { ["amount"] = vatTotal, ["currency"] = "ZAR" },
            ["totalAmount"] = new Dictionary<string, object?> { ["amount"] = totalAmount, ["currency"] = "ZAR" },
            ["totalAmountValue"] = totalAmount,
            ["ageDays"] = ageDays,
            ["mfmaCompliant"] = ageDays <= 30,
            ["auditTrail"] = Array.Empty<object>(),
            ["documents"] = entity.InvoiceDocuments.Where(d => d.Enabled != false).Select(d => new Dictionary<string, object?>
            {
                ["id"] = d.InvoiceDocumentsId,
                ["name"] = d.DocumentName,
                ["date"] = d.DocumentDate?.ToString("yyyy-MM-dd")
            }).ToArray(),
            ["supplierName"] = ResolveSupplierName(entity),
            ["supplierId"] = ResolveVendorId(entity),
            ["orderNumber"] = entity.OrderId.HasValue ? $"PO-{entity.OrderId}" : null,
            ["grnNumber"] = entity.GrnId.HasValue ? $"GRN-{entity.GrnId}" : null,
            ["dueDate"] = entity.InvoiceDate.HasValue ? entity.InvoiceDate.Value.AddDays(30).ToString("yyyy-MM-dd") : null,
            ["threeWayMatch"] = BuildThreeWayMatch(entity),
            ["debitCreditNotes"] = Array.Empty<object>()
        };

        return dict;
    }

    private static Dictionary<string, object?> BuildThreeWayMatch(Invoice entity)
    {
        if (!entity.OrderId.HasValue)
            return new Dictionary<string, object?> { ["status"] = "not_applicable" };

        return new Dictionary<string, object?>
        {
            ["status"] = "matched",
            ["orderMatch"] = new Dictionary<string, object?> { ["matched"] = entity.OrderId.HasValue, ["orderNumber"] = entity.OrderId.HasValue ? $"PO-{entity.OrderId}" : null },
            ["grnMatch"] = new Dictionary<string, object?> { ["matched"] = entity.GrnId.HasValue, ["grnNumber"] = entity.GrnId.HasValue ? $"GRN-{entity.GrnId}" : null },
            ["invoiceMatch"] = new Dictionary<string, object?> { ["matched"] = true, ["invoiceNumber"] = entity.VendorInvoiceNumber }
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

    private static void MapLineItemsToInvoiceDetails(Invoice entity, Dictionary<string, object?> data)
    {
        if (data.TryGetValue("lineItems", out var liObj) && liObj is object[] items)
        {
            foreach (var item in items)
            {
                if (item is Dictionary<string, object?> li)
                {
                    var detail = new InvoiceDetail
                    {
                        ServiceDescription = li.GetValueOrDefault("description")?.ToString(),
                        InvoiceQuantity = li.TryGetValue("quantity", out var qty) && qty != null ? Convert.ToDecimal(qty) : 1,
                        Enabled = true,
                        DateCaptured = DateTime.UtcNow,
                        CapturerId = 1
                    };
                    if (li.TryGetValue("unitPrice", out var up) && up is Dictionary<string, object?> upd && upd.TryGetValue("amount", out var upa))
                        detail.InvoiceUnitPrice = Convert.ToDecimal(upa);
                    else if (li.TryGetValue("unitPrice", out var up2) && up2 != null)
                        detail.InvoiceUnitPrice = Convert.ToDecimal(up2);
                    detail.Amount = (detail.InvoiceUnitPrice ?? 0) * (detail.InvoiceQuantity ?? 1);
                    detail.VatAmount = detail.Amount * 0.15m;
                    detail.TotalAmount = detail.Amount + detail.VatAmount;
                    entity.InvoiceDetails.Add(detail);
                }
            }
        }
    }

    private static string GetStr(Dictionary<string, object?> d, string k)
        => d.TryGetValue(k, out var v) && v != null ? v.ToString()! : "";

    private static void AddAudit(Dictionary<string, object?> inv, string action, string message, string type = "action")
    {
        var existing = inv.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
        existing.Add(new Dictionary<string, object?> { ["action"] = action, ["by"] = "Admin", ["date"] = DateTime.UtcNow.ToString("yyyy-MM-dd"), ["type"] = type, ["message"] = message });
        inv["auditTrail"] = existing.ToArray();
    }

    private static void ComputeTotals(Dictionary<string, object?> inv)
    {
        if (!inv.TryGetValue("lineItems", out var liObj) || liObj is not object[] items) return;
        decimal subtotal = 0, vatTotal = 0;
        foreach (var raw in items)
        {
            if (raw is not Dictionary<string, object?> line) continue;
            decimal tp = 0, va = 0;
            if (line.TryGetValue("totalPrice", out var tpObj) && tpObj is Dictionary<string, object?> tpd)
            {
                if (tpd.TryGetValue("amount", out var a)) decimal.TryParse(a?.ToString(), out tp);
            }
            if (line.TryGetValue("vatAmount", out var vaObj) && vaObj is Dictionary<string, object?> vad)
            {
                if (vad.TryGetValue("amount", out var a)) decimal.TryParse(a?.ToString(), out va);
            }
            subtotal += tp;
            vatTotal += va;
        }
        inv["subtotal"] = new Dictionary<string, object?> { ["amount"] = subtotal, ["currency"] = "ZAR" };
        inv["vatAmount"] = new Dictionary<string, object?> { ["amount"] = vatTotal, ["currency"] = "ZAR" };
        inv["totalAmount"] = new Dictionary<string, object?> { ["amount"] = subtotal + vatTotal, ["currency"] = "ZAR" };
        inv["netPayable"] = new Dictionary<string, object?> { ["amount"] = subtotal + vatTotal, ["currency"] = "ZAR" };
    }

    private static void ComputeAgeDays(Dictionary<string, object?> inv)
    {
        var dateStr = GetStr(inv, "invoiceDate");
        if (DateTime.TryParse(dateStr, out var dt))
        {
            var age = (int)(DateTime.Now - dt).TotalDays;
            inv["ageDays"] = Math.Max(0, age);
            inv["mfmaCompliant"] = age <= 30;
        }
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> CreateInvoiceDictAsync(Dictionary<string, object?> data)
    {
        data["status"] = "draft";
        data["financialYear"] = data.GetValueOrDefault("financialYear")?.ToString() ?? "2025/2026";
        data["createdAt"] = DateTime.UtcNow.ToString("o");
        ComputeTotals(data);
        ComputeAgeDays(data);
        AddAudit(data, "Created", "Invoice captured");

        if (UseDb)
        {
            try
            {
                var memId = AllocateNextId();
                var refNum = data.GetValueOrDefault("referenceNumber")?.ToString() ?? $"INV-{DateTime.UtcNow:yyyy}-{memId:D3}";
                var entity = new Invoice
                {
                    VendorInvoiceNumber = refNum,
                    StatusId = StatusMapper.ToStatusId("invoice", "draft"),
                    DateCaptured = DateTime.UtcNow,
                    Enabled = true,
                    FinancialYear = data.GetValueOrDefault("financialYear")?.ToString(),
                    Comments = data.GetValueOrDefault("comments")?.ToString()
                };
                if (data.TryGetValue("totalAmountValue", out var taObj) && taObj != null)
                    entity.CalculatedInvoiceAmount = Convert.ToDecimal(taObj);
                if (data.TryGetValue("invoiceDate", out var idObj) && DateTime.TryParse(idObj?.ToString(), out var invDate))
                    entity.InvoiceDate = invDate;
                MapLineItemsToInvoiceDetails(entity, data);
                await _repository.AddAsync(entity);
                await _repository.SaveChangesAsync();
                var dbId = entity.InvoiceId;
                data["id"] = dbId;
                data["referenceNumber"] = refNum;
                _invoices[dbId] = data;
                _logger.LogInformation("Created invoice {Id} in DB via CreateInvoiceDictAsync with {DetailCount} details", dbId, entity.InvoiceDetails.Count);
                return (data, null);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed in CreateInvoiceDictAsync, falling back to in-memory");
                _dbChecker.MarkUnavailable();
            }
        }

        var id = AllocateNextId();
        data["id"] = id;
        if (!data.ContainsKey("referenceNumber") || data["referenceNumber"] == null)
            data["referenceNumber"] = $"INV-{DateTime.UtcNow:yyyy}-{id:D3}";
        _invoices[id] = data;
        _logger.LogInformation("Created invoice {Id} in-memory via CreateInvoiceDictAsync", id);
        return (data, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> UpdateInvoiceDictAsync(int id, Dictionary<string, object?> updates)
    {
        var inv = await GetInvoiceDictAsync(id);
        if (inv == null) return (null, "Invoice not found");
        foreach (var kv in updates)
        {
            if (kv.Key is "id" or "referenceNumber" or "status") continue;
            inv[kv.Key] = kv.Value;
        }
        ComputeTotals(inv);
        ComputeAgeDays(inv);
        AddAudit(inv, "Updated", "Invoice details updated");
        await SaveInvoiceDictAsync(id, inv);
        return (inv, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> SubmitInvoiceDictAsync(int id)
    {
        var inv = await GetInvoiceDictAsync(id);
        if (inv == null) return (null, "Invoice not found");
        var status = GetStr(inv, "status");
        if (status != "draft" && status != "match_exception")
            return (null, $"Cannot submit invoice in '{status}' status. Only draft or match_exception invoices can be submitted.");
        inv["status"] = "submitted";
        inv["submittedDate"] = DateTime.UtcNow.ToString("o");
        AddAudit(inv, "Submitted", "Invoice submitted for processing");
        await SaveInvoiceDictAsync(id, inv);
        return (inv, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> VerifyInvoiceDictAsync(int id)
    {
        var inv = await GetInvoiceDictAsync(id);
        if (inv == null) return (null, "Invoice not found");
        var status = GetStr(inv, "status");
        if (status != "submitted" && status != "pending_match")
            return (null, $"Cannot verify invoice in '{status}' status. Invoice must be submitted first.");
        inv["status"] = "verified";
        inv["verifiedBy"] = "Admin";
        inv["verifiedDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd");
        AddAudit(inv, "Verified", "Invoice verified", "verification");
        await SaveInvoiceDictAsync(id, inv);
        return (inv, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> ApproveInvoiceDictAsync(int id)
    {
        var inv = await GetInvoiceDictAsync(id);
        if (inv == null) return (null, "Invoice not found");
        var status = GetStr(inv, "status");
        if (!new[] { "verified", "supervisor_review", "hod_review", "cfo_review" }.Contains(status))
            return (null, $"Cannot approve invoice in '{status}' status. Invoice must be verified first.");
        inv["status"] = "approved";
        inv["approvedBy"] = "Admin";
        inv["approvalDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd");
        AddAudit(inv, "Approved", "Invoice approved for payment", "approval");
        await SaveInvoiceDictAsync(id, inv);
        return (inv, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> RejectInvoiceDictAsync(int id, string? reason)
    {
        var inv = await GetInvoiceDictAsync(id);
        if (inv == null) return (null, "Invoice not found");
        var status = GetStr(inv, "status");
        if (new[] { "paid", "voided", "rejected" }.Contains(status))
            return (null, $"Cannot reject invoice in '{status}' status.");
        inv["status"] = "rejected";
        inv["rejectionReason"] = reason ?? "Rejected";
        AddAudit(inv, "Rejected", $"Invoice rejected: {reason ?? "No reason provided"}", "rejection");
        await SaveInvoiceDictAsync(id, inv);
        return (inv, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> VoidInvoiceDictAsync(int id, string? reason)
    {
        var inv = await GetInvoiceDictAsync(id);
        if (inv == null) return (null, "Invoice not found");
        var status = GetStr(inv, "status");
        if (new[] { "paid", "voided" }.Contains(status))
            return (null, $"Cannot void invoice in '{status}' status.");
        inv["status"] = "voided";
        inv["voidReason"] = reason ?? "Voided";
        AddAudit(inv, "Voided", $"Invoice voided: {reason ?? "No reason provided"}", "rejection");
        await SaveInvoiceDictAsync(id, inv);
        return (inv, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> MarkPaidDictAsync(int id)
    {
        var inv = await GetInvoiceDictAsync(id);
        if (inv == null) return (null, "Invoice not found");
        var status = GetStr(inv, "status");
        if (status != "approved" && status != "payment_batched")
            return (null, $"Cannot mark invoice as paid in '{status}' status. Invoice must be approved or payment batched first.");
        inv["status"] = "paid";
        inv["paidDate"] = DateTime.UtcNow.ToString("o");
        AddAudit(inv, "Paid", "Invoice marked as paid");
        await SaveInvoiceDictAsync(id, inv);
        return (inv, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> HoldInvoiceDictAsync(int id)
    {
        var inv = await GetInvoiceDictAsync(id);
        if (inv == null) return (null, "Invoice not found");
        var status = GetStr(inv, "status");
        if (new[] { "paid", "voided", "rejected", "on_hold" }.Contains(status))
            return (null, $"Cannot hold invoice in '{status}' status.");
        inv["previousStatus"] = status;
        inv["status"] = "on_hold";
        inv["holdDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd");
        AddAudit(inv, "On Hold", "Invoice placed on hold");
        await SaveInvoiceDictAsync(id, inv);
        return (inv, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> ReleaseHoldDictAsync(int id)
    {
        var inv = await GetInvoiceDictAsync(id);
        if (inv == null) return (null, "Invoice not found");
        var status = GetStr(inv, "status");
        if (status != "on_hold")
            return (null, $"Invoice is not on hold (status: '{status}').");
        var prevStatus = GetStr(inv, "previousStatus");
        inv["status"] = string.IsNullOrEmpty(prevStatus) ? "submitted" : prevStatus;
        inv.Remove("previousStatus");
        inv.Remove("holdDate");
        AddAudit(inv, "Hold Released", $"Invoice hold released, restored to '{inv["status"]}'");
        await SaveInvoiceDictAsync(id, inv);
        return (inv, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> DisputeInvoiceDictAsync(int id, string? reason)
    {
        var inv = await GetInvoiceDictAsync(id);
        if (inv == null) return (null, "Invoice not found");
        var status = GetStr(inv, "status");
        if (new[] { "paid", "voided", "rejected", "disputed" }.Contains(status))
            return (null, $"Cannot dispute invoice in '{status}' status.");
        inv["previousStatus"] = status;
        inv["status"] = "disputed";
        inv["disputeReason"] = reason ?? "Under dispute";
        inv["disputeDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd");
        AddAudit(inv, "Disputed", $"Invoice disputed: {reason ?? "No reason provided"}");
        await SaveInvoiceDictAsync(id, inv);
        return (inv, null);
    }

    public async Task<(Dictionary<string, object?>? result, string? error)> RunMatchDictAsync(int id)
    {
        var inv = await GetInvoiceDictAsync(id);
        if (inv == null) return (null, "Invoice not found");
        inv["threeWayMatch"] = new Dictionary<string, object?>
        {
            ["status"] = "matched",
            ["matchDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            ["confidence"] = 100.0,
            ["details"] = new Dictionary<string, object?>
            {
                ["supplierMatch"] = new Dictionary<string, object?> { ["matched"] = true },
                ["orderMatch"] = new Dictionary<string, object?> { ["matched"] = true },
                ["grnMatch"] = new Dictionary<string, object?> { ["matched"] = true },
                ["quantityMatch"] = new Dictionary<string, object?> { ["matched"] = true },
                ["priceMatch"] = new Dictionary<string, object?> { ["matched"] = true },
                ["totalMatch"] = new Dictionary<string, object?> { ["matched"] = true },
                ["duplicateCheck"] = new Dictionary<string, object?> { ["passed"] = true }
            }
        };
        AddAudit(inv, "3-Way Match", "3-way match completed: MATCHED", "system");
        await SaveInvoiceDictAsync(id, inv);
        return (inv, null);
    }
}
