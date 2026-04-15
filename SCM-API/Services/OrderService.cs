using System.Collections.Concurrent;
using System.Text.Json;
using SCM_API.Helpers;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Data;
using SCM_API.Repositories.Interfaces;
using SCM_API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace SCM_API.Services;

public class OrderService : IOrderService
{
    private readonly IOrderRepository _repo;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<OrderService> _logger;
    private readonly ApplicationDbContext _context;

    private static readonly ConcurrentDictionary<int, Dictionary<string, object?>> _orders = new();
    private static int _nextId = 300;
    private static bool _seeded = false;
    private static readonly object _seedLock = new();

    public OrderService(IOrderRepository repo, DbAvailabilityChecker dbChecker, ILogger<OrderService> logger, ApplicationDbContext context)
    {
        _repo = repo;
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

    public async Task<object?> GetByIdAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetWithDetailsAsync(id);
                if (entity != null) return EntityToDict(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for order {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }
        _orders.TryGetValue(id, out var order);
        return order;
    }

    public async Task<PagedResult<object>> GetAllAsync(string? financialYear, int? statusId, int? vendorId, string? search, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repo.GetFilteredAsync(financialYear, statusId, vendorId, search, page, pageSize);
                var dicts = result.Items.Select(EntityToDict).ToList();
                var dbIds = new HashSet<int>();
                foreach (var d in dicts)
                {
                    if (d.TryGetValue("id", out var idObj) && idObj is int id2)
                    {
                        dbIds.Add(id2);
                        _orders[id2] = d;
                    }
                }
                foreach (var staleKey in _orders.Keys.Where(k => !dbIds.Contains(k)).ToList())
                    _orders.TryRemove(staleKey, out _);
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
                _logger.LogWarning(ex, "DB query failed for orders, falling back");
                _dbChecker.MarkUnavailable();
            }
        }

        var query = _orders.Values.Where(o => o.ContainsKey("enabled") && (bool)o["enabled"]!).AsEnumerable();

        if (!string.IsNullOrEmpty(financialYear))
            query = query.Where(o => o.TryGetValue("financialYear", out var fy) && fy?.ToString() == financialYear);
        if (statusId.HasValue)
            query = query.Where(o => o.TryGetValue("statusId", out var sid) && sid is int s && s == statusId.Value);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(o =>
                (o.TryGetValue("orderNumber", out var on) && on?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true) ||
                (o.TryGetValue("department", out var d) && d?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true));

        var items = query.OrderByDescending(o => o.TryGetValue("captureDate", out var cd) ? cd?.ToString() : "").ToList();
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
            ["statusId"] = 0,
            ["enabled"] = true,
            ["isVoid"] = false,
            ["isForwardedToVendor"] = false,
            ["auditTrail"] = new object[] { new { action = "Created", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = "Purchase order created" } }
        };

        var incoming = ConvertToDict(dto);
        foreach (var kv in incoming) data[kv.Key] = kv.Value;

        if (UseDb)
        {
            try
            {
                var entity = DictToEntity(data);
                await _repo.AddAsync(entity);
                await _repo.SaveChangesAsync();
                _logger.LogInformation("Created order {Id} in DB", entity.OrderId);
                var saved = await _repo.GetWithDetailsAsync(entity.OrderId);
                return EntityToDict(saved ?? entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for order, falling back");
                _dbChecker.MarkUnavailable();
            }
        }

        var id = CreateOrderRecord(data);
        _logger.LogInformation("Created order {Id} in-memory", id);
        return _orders[id];
    }

    public int CreateFromQuotation(string quotationRef, string requisitionRef, string demandPlanRef, string department, string supplierName, int bbbeeLevel, decimal totalValue, string financialYear, string voteNumber, string contactPerson, object[]? lineItems = null)
    {
        var transformedLineItems = TransformQuotationLineItems(lineItems, totalValue);

        var data = new Dictionary<string, object?>
        {
            ["department"] = department,
            ["status"] = "approved",
            ["statusId"] = 2,
            ["financialYear"] = financialYear,
            ["supplier"] = new { name = supplierName, bbbeeLevel },
            ["vendorName"] = supplierName,
            ["supplierName"] = supplierName,
            ["bbbeeLevel"] = bbbeeLevel,
            ["totalValue"] = new { amount = totalValue, currency = "ZAR" },
            ["totalAmount"] = new { amount = totalValue, currency = "ZAR" },
            ["totalExclVat"] = new { amount = totalValue, currency = "ZAR" },
            ["subtotal"] = new { amount = totalValue, currency = "ZAR" },
            ["vatAmount"] = new { amount = totalValue * 0.15m, currency = "ZAR" },
            ["vatTotal"] = new { amount = totalValue * 0.15m, currency = "ZAR" },
            ["vat"] = new { amount = totalValue * 0.15m, currency = "ZAR" },
            ["totalIncVat"] = new { amount = totalValue * 1.15m, currency = "ZAR" },
            ["totalInclVat"] = new { amount = totalValue * 1.15m, currency = "ZAR" },
            ["quotationRef"] = quotationRef,
            ["requisitionRef"] = requisitionRef,
            ["demandPlanRef"] = demandPlanRef,
            ["referenceType"] = "quotation",
            ["referenceNumber"] = quotationRef,
            ["voteNumber"] = voteNumber,
            ["paymentTerms"] = "30 days",
            ["deliveryTerms"] = "Ex Works",
            ["contactPerson"] = contactPerson,
            ["enabled"] = true,
            ["isVoid"] = false,
            ["isForwardedToVendor"] = false,
            ["lineItems"] = transformedLineItems,
            ["auditTrail"] = new object[]
            {
                new { action = "Created", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = $"Purchase order created from awarded {quotationRef}" },
                new { action = "Auto-Approved", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = "Auto-approved from RFQ award" }
            }
        };

        if (UseDb)
        {
            try
            {
                var entity = DictToEntity(data);
                _repo.AddAsync(entity).GetAwaiter().GetResult();
                _repo.SaveChangesAsync().GetAwaiter().GetResult();
                _logger.LogInformation("Created order {Id} in DB from quotation {QuotationRef}", entity.OrderId, quotationRef);
                data["id"] = entity.OrderId;
                data["orderNumber"] = $"PO-{DateTime.UtcNow:yyyy}-{entity.OrderId:D3}";
                data["referenceNumber"] = data["orderNumber"];
                _orders[entity.OrderId] = data;
                return entity.OrderId;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for order from quotation, falling back");
                _dbChecker.MarkUnavailable();
            }
        }

        var id = CreateOrderRecord(data);
        _logger.LogInformation("Created order {Id} in-memory from quotation {QuotationRef}", id, quotationRef);
        return id;
    }

    private object[] TransformQuotationLineItems(object[]? lineItems, decimal totalValue)
    {
        if (lineItems == null || lineItems.Length == 0)
        {
            return new object[]
            {
                new { id = $"OLI-{Guid.NewGuid().ToString("N")[..6]}", lineNumber = 1, description = "As per quotation", quantity = 1, unitOfMeasure = "each", unitPrice = new { amount = totalValue, currency = "ZAR" }, totalPrice = new { amount = totalValue, currency = "ZAR" }, vatRate = 15, quantityReceived = 0, quantityInvoiced = 0 }
            };
        }

        var result = new List<object>();
        int lineNum = 0;
        foreach (var item in lineItems)
        {
            lineNum++;
            var dict = ConvertToDict(item);
            var desc = dict.GetValueOrDefault("description")?.ToString()
                ?? dict.GetValueOrDefault("name")?.ToString()
                ?? dict.GetValueOrDefault("purchaseItem")?.ToString()
                ?? "Line item";
            var qty = 1;
            if (dict.TryGetValue("quantity", out var qVal) && qVal != null)
                int.TryParse(qVal.ToString(), out qty);
            if (qty <= 0) qty = 1;
            var uom = dict.GetValueOrDefault("unitOfMeasure")?.ToString() ?? "each";
            var id = dict.GetValueOrDefault("id")?.ToString() ?? $"OLI-{lineNum:D3}";

            decimal unitPriceAmount = 0;
            if (dict.TryGetValue("unitPrice", out var up) && up != null)
            {
                var upDict = ConvertToDict(up);
                if (upDict.TryGetValue("amount", out var amt))
                    decimal.TryParse(amt?.ToString(), out unitPriceAmount);
            }
            else if (dict.TryGetValue("estimatedUnitPrice", out var eup) && eup != null)
            {
                var eupDict = ConvertToDict(eup);
                if (eupDict.TryGetValue("amount", out var amt))
                    decimal.TryParse(amt?.ToString(), out unitPriceAmount);
            }
            else if (dict.TryGetValue("estimatedUnitCost", out var euc) && euc != null)
            {
                var eucDict = ConvertToDict(euc);
                if (eucDict.TryGetValue("amount", out var amt))
                    decimal.TryParse(amt?.ToString(), out unitPriceAmount);
            }

            decimal totalPriceAmount = qty * unitPriceAmount;
            if (dict.TryGetValue("totalPrice", out var tp) && tp != null)
            {
                var tpDict = ConvertToDict(tp);
                if (tpDict.TryGetValue("amount", out var amt))
                    decimal.TryParse(amt?.ToString(), out totalPriceAmount);
            }
            else if (dict.TryGetValue("total", out var tot) && tot != null)
            {
                var totDict = ConvertToDict(tot);
                if (totDict.TryGetValue("amount", out var amt))
                    decimal.TryParse(amt?.ToString(), out totalPriceAmount);
            }
            else if (dict.TryGetValue("estimatedTotal", out var et) && et != null)
            {
                var etDict = ConvertToDict(et);
                if (etDict.TryGetValue("amount", out var amt))
                    decimal.TryParse(amt?.ToString(), out totalPriceAmount);
            }

            if (qty == 1 && unitPriceAmount > 0 && totalPriceAmount > unitPriceAmount)
            {
                var inferred = (int)Math.Round(totalPriceAmount / unitPriceAmount);
                if (inferred > 1) qty = inferred;
            }
            totalPriceAmount = qty * unitPriceAmount;

            result.Add(new
            {
                id,
                lineNumber = lineNum,
                description = desc,
                quantity = qty,
                unitOfMeasure = uom,
                unitPrice = new { amount = unitPriceAmount, currency = "ZAR" },
                totalPrice = new { amount = totalPriceAmount, currency = "ZAR" },
                vatRate = 15,
                quantityReceived = 0,
                quantityInvoiced = 0
            });
        }
        return result.ToArray();
    }

    public async Task<bool> UpdateAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(id);
                if (entity == null) return false;
                var incoming = ConvertToDict(dto);
                ApplyDictToEntity(entity, incoming);
                entity.DateModified = DateTime.UtcNow;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB update failed for order {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_orders.TryGetValue(id, out var order)) return false;
        var incomingDict = ConvertToDict(dto);
        foreach (var kv in incomingDict)
        {
            if (kv.Key != "id" && kv.Key != "orderNumber" && kv.Key != "referenceNumber")
                order[kv.Key] = kv.Value;
        }
        return true;
    }

    public async Task<bool> ApproveAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(id);
                if (entity == null) return false;
                entity.ApproveStatus = 2;
                entity.StatusId = StatusMapper.ToStatusId("order", "approved");
                entity.ApprovedDate = DateTime.UtcNow;
                entity.DateModified = DateTime.UtcNow;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB approve failed for order {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_orders.TryGetValue(id, out var order)) return false;
        order["status"] = "approved";
        order["statusId"] = 2;
        var trail = order.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
        trail.Add(new { action = "Approved", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = "Order approved" });
        order["auditTrail"] = trail.ToArray();
        return true;
    }

    public async Task<bool> VoidAsync(int id, string reason, int userId)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(id);
                if (entity == null) return false;
                entity.IsVoid = true;
                entity.VoidedReason = reason;
                entity.VoidedDate = DateTime.UtcNow;
                entity.VoidedBy = userId;
                entity.DateModified = DateTime.UtcNow;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB void failed for order {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_orders.TryGetValue(id, out var order)) return false;
        order["isVoid"] = true;
        order["status"] = "voided";
        order["statusId"] = StatusMapper.ToStatusId("order", "voided");
        var trail = order.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
        trail.Add(new { action = "Voided", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = reason });
        order["auditTrail"] = trail.ToArray();
        return true;
    }

    public async Task<object> GetOrderDetailsAsync(int orderId)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(orderId);
                if (entity != null)
                    return EntityToDict(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB GetOrderDetails failed for {Id}, falling back", orderId);
                _dbChecker.MarkUnavailable();
            }
        }
        if (_orders.TryGetValue(orderId, out var order))
            return order;
        return new Dictionary<string, object?>();
    }

    public async Task<bool> ForwardToVendorAsync(int orderId)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(orderId);
                if (entity == null) return false;
                entity.IsForwardedToVendor = true;
                entity.StatusId = StatusMapper.ToStatusId("order", "dispatched");
                entity.DateModified = DateTime.UtcNow;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB forward failed for order {Id}, falling back", orderId);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_orders.TryGetValue(orderId, out var order)) return false;
        order["isForwardedToVendor"] = true;
        order["status"] = "dispatched";
        order["statusId"] = 3;
        var trail = order.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
        trail.Add(new { action = "Dispatched", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = "Forwarded to vendor" });
        order["auditTrail"] = trail.ToArray();
        return true;
    }

    public async Task<object> GetOrderSplitDetailsAsync(int orderId)
    {
        if (UseDb)
        {
            try
            {
                var rows = await _context.OrderSplitDetails
                    .Where(s => s.OrderId == orderId)
                    .ToListAsync();
                var items = rows.Select(s => (object)new Dictionary<string, object?>
                {
                    ["id"] = s.OrderSplitDetailId,
                    ["orderDetailId"] = s.OrderDetailId,
                    ["description"] = s.ServiceDescription,
                    ["quantity"] = s.Quantity ?? 0m,
                    ["cost"] = s.Cost ?? 0m,
                    ["deliveryDate"] = s.DeliveryDate?.ToString("yyyy-MM-dd"),
                    ["deliveryAddress"] = s.DeliveryAddress,
                    ["isDefault"] = s.IsDefault ?? false
                }).ToList();
                return items;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB query failed for order split details, order {Id}", orderId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new List<object>();
    }

    public async Task<bool> CessionAsync(int orderId, object cessionDto)
    {
        if (UseDb)
        {
            try
            {
                var dict = ConvertToDict(cessionDto);
                var beneficiaryVendorId = DictHelper.GetNullableInt(dict, "beneficiaryVendorId");
                var ceedantVendorId = DictHelper.GetNullableInt(dict, "ceedantVendorId");
                if (beneficiaryVendorId == null && ceedantVendorId == null)
                {
                    _logger.LogWarning("Cession for order {Id} rejected: missing vendor IDs", orderId);
                    return false;
                }
                var cession = new CessionAgreement
                {
                    ContractId = orderId,
                    BeneficiaryVendorId = beneficiaryVendorId,
                    BeneficiaryPercentage = DictHelper.GetNullableDecimal(dict, "beneficiaryPercentage"),
                    CeedantVendorId = ceedantVendorId,
                    CeedantPercentage = DictHelper.GetNullableDecimal(dict, "ceedantPercentage"),
                    CessionAgreementTypeId = DictHelper.GetNullableInt(dict, "cessionAgreementTypeId"),
                    Description = DictHelper.GetString(dict, "description"),
                    Comments = DictHelper.GetString(dict, "comments"),
                    ClaimAmount = DictHelper.GetNullableDecimal(dict, "claimAmount"),
                    AgreementDate = DateTime.UtcNow,
                    DateCaptured = DateTime.UtcNow
                };
                _context.CessionAgreements.Add(cession);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB cession failed for order {Id}", orderId);
                _dbChecker.MarkUnavailable();
            }
        }
        return false;
    }

    public async Task<bool> DeclineAsync(int id, string? reason = null)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(id);
                if (entity == null) return false;
                entity.StatusId = StatusMapper.ToStatusId("order", "declined");
                entity.DateModified = DateTime.UtcNow;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB decline failed for order {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_orders.TryGetValue(id, out var order)) return false;
        order["status"] = "declined";
        order["statusId"] = StatusMapper.ToStatusId("order", "declined");
        var trail = order.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
        trail.Add(new { action = "Declined", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = reason ?? "Order declined" });
        order["auditTrail"] = trail.ToArray();
        return true;
    }

    public async Task<bool> SubmitAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(id);
                if (entity == null) return false;
                entity.StatusId = StatusMapper.ToStatusId("order", "submitted");
                entity.DateModified = DateTime.UtcNow;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB submit failed for order {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_orders.TryGetValue(id, out var order)) return false;
        order["status"] = "submitted";
        order["statusId"] = 1;
        var trail = order.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
        trail.Add(new { action = "Submitted", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = "Submitted for approval" });
        order["auditTrail"] = trail.ToArray();
        return true;
    }

    public List<Dictionary<string, object?>> GetByQuotationRef(string quotationRef)
    {
        var results = _orders.Values
            .Where(o => o.TryGetValue("quotationRef", out var qr) && qr?.ToString() == quotationRef)
            .ToList();
        if (results.Count > 0) return results;

        if (UseDb)
        {
            try
            {
                var all = GetAllAsync(null, null, null, null, 1, 1000).GetAwaiter().GetResult();
                results = all.Items
                    .OfType<Dictionary<string, object?>>()
                    .Where(o => o.TryGetValue("quotationRef", out var qr) && qr?.ToString() == quotationRef)
                    .ToList();
                if (results.Count > 0) return results;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB query failed for orders by quotation ref");
                _dbChecker.MarkUnavailable();
            }
        }
        return results;
    }

    public Dictionary<string, object?>? GetByOrderNumber(string orderNumber)
    {
        if (UseDb)
        {
            try
            {
                var all = GetAllAsync(null, null, null, null, 1, 1000).GetAwaiter().GetResult();
                var match = all.Items
                    .OfType<Dictionary<string, object?>>()
                    .FirstOrDefault(o => o.TryGetValue("orderNumber", out var on) &&
                        string.Equals(on?.ToString(), orderNumber, StringComparison.OrdinalIgnoreCase));
                if (match != null) return match;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB query failed for order by number");
                _dbChecker.MarkUnavailable();
            }
        }
        return _orders.Values
            .FirstOrDefault(o => o.TryGetValue("orderNumber", out var on) &&
                string.Equals(on?.ToString(), orderNumber, StringComparison.OrdinalIgnoreCase));
    }

    private Dictionary<string, object?> EntityToDict(Order entity)
    {
        var statusName = StatusMapper.ToStatusName("order", entity.StatusId);
        var lineItems = entity.OrderDetails?.Select((od, idx) => (object)new Dictionary<string, object?>
        {
            ["id"] = $"OLI-{od.OrderDetailId}",
            ["lineNumber"] = idx + 1,
            ["description"] = od.ServiceDescription ?? od.Item ?? "Item",
            ["quantity"] = (int)(od.Quantity ?? 1),
            ["unitOfMeasure"] = "each",
            ["unitPrice"] = new { amount = od.UnitPrice ?? 0m, currency = "ZAR" },
            ["totalPrice"] = new { amount = od.Amount ?? od.TotalAmount ?? 0m, currency = "ZAR" },
            ["vatRate"] = 15,
            ["quantityReceived"] = 0,
            ["quantityInvoiced"] = 0
        }).ToArray() ?? Array.Empty<object>();

        var totalValue = entity.OrderDetails?.Sum(od => od.Amount ?? od.TotalAmount ?? 0m) ?? 0m;

        return new Dictionary<string, object?>
        {
            ["id"] = entity.OrderId,
            ["orderNumber"] = entity.OrderNumber,
            ["referenceNumber"] = entity.OrderNumber,
            ["department"] = $"Department {entity.RegionId}",
            ["status"] = statusName,
            ["statusId"] = entity.StatusId ?? 0,
            ["financialYear"] = entity.FinancialYear,
            ["totalValue"] = new { amount = totalValue, currency = "ZAR" },
            ["captureDate"] = entity.DateCaptured?.ToString("yyyy-MM-dd"),
            ["enabled"] = entity.Enabled ?? true,
            ["isVoid"] = entity.IsVoid ?? false,
            ["isForwardedToVendor"] = entity.IsForwardedToVendor ?? false,
            ["lineItems"] = lineItems,
            ["auditTrail"] = Array.Empty<object>()
        };
    }

    private Order DictToEntity(Dictionary<string, object?> data)
    {
        var order = new Order
        {
            OrderNumber = data.GetValueOrDefault("orderNumber")?.ToString() ?? $"PO-{DateTime.UtcNow:yyyy}-{Interlocked.Increment(ref _nextId):D3}",
            FinancialYear = data.GetValueOrDefault("financialYear")?.ToString(),
            StatusId = data.TryGetValue("statusId", out var sid) && sid is int s ? s : 0,
            Enabled = true,
            DateCaptured = DateTime.UtcNow,
            CapturerId = 1
        };
        if (data.TryGetValue("lineItems", out var liObj) && liObj is object[] items)
        {
            foreach (var item in items)
            {
                if (item is Dictionary<string, object?> li)
                {
                    var detail = new OrderTypeDetail
                    {
                        Item = li.GetValueOrDefault("description")?.ToString(),
                        ServiceDescription = li.GetValueOrDefault("description")?.ToString(),
                        Quantity = li.TryGetValue("quantity", out var qty) && qty != null ? Convert.ToDecimal(qty) : 1,
                        Enabled = true
                    };
                    if (li.TryGetValue("unitPrice", out var up) && up is Dictionary<string, object?> upd && upd.TryGetValue("amount", out var upa))
                        detail.UnitPrice = Convert.ToDecimal(upa);
                    else if (li.TryGetValue("unitPrice", out var up2) && up2 != null)
                        detail.UnitPrice = Convert.ToDecimal(up2);
                    if (li.TryGetValue("totalPrice", out var tp) && tp is Dictionary<string, object?> tpd && tpd.TryGetValue("amount", out var tpa))
                        detail.Amount = Convert.ToDecimal(tpa);
                    detail.TotalAmount = detail.Amount ?? (detail.UnitPrice ?? 0) * (detail.Quantity ?? 1);
                    order.OrderDetails.Add(detail);
                }
            }
        }
        return order;
    }

    private void ApplyDictToEntity(Order entity, Dictionary<string, object?> data)
    {
        if (data.TryGetValue("financialYear", out var fy) && fy != null)
            entity.FinancialYear = fy.ToString();
        if (data.TryGetValue("statusId", out var sid) && sid != null)
            entity.StatusId = Convert.ToInt32(sid);
    }

    private int CreateOrderRecord(Dictionary<string, object?> data)
    {
        var id = Interlocked.Increment(ref _nextId);
        data["id"] = id;
        if (!data.ContainsKey("orderNumber"))
            data["orderNumber"] = $"PO-{DateTime.UtcNow:yyyy}-{id:D3}";
        data["referenceNumber"] = data["orderNumber"];
        if (!data.ContainsKey("captureDate"))
            data["captureDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd");
        if (!data.ContainsKey("enabled"))
            data["enabled"] = true;
        _orders[id] = data;
        return id;
    }

    private void SeedData()
    {
        CreateOrderRecord(new Dictionary<string, object?>
        {
            ["orderNumber"] = "PO-2025-001",
            ["department"] = "Infrastructure Development",
            ["status"] = "approved",
            ["statusId"] = 2,
            ["financialYear"] = "2025/26",
            ["supplier"] = new { name = "Roadpave Materials (Pty) Ltd", bbbeeLevel = 2, registrationNumber = "2015/123456/07" },
            ["totalValue"] = new { amount = 7850000m, currency = "ZAR" },
            ["vatAmount"] = new { amount = 1177500m, currency = "ZAR" },
            ["totalIncVat"] = new { amount = 9027500m, currency = "ZAR" },
            ["captureDate"] = "2025-03-22",
            ["deliveryDate"] = "2025-04-30",
            ["quotationRef"] = "RFQ-2025-001",
            ["requisitionRef"] = "REQ-2025-001",
            ["demandPlanRef"] = "DP-2025-001",
            ["referenceType"] = "quotation",
            ["referenceNumber"] = "RFQ-2025-001",
            ["costCentre"] = "CC-INF-001",
            ["voteNumber"] = "Vote 8",
            ["paymentTerms"] = "30 days",
            ["deliveryTerms"] = "Ex Works",
            ["deliveryAddress"] = "Municipal Depot, York Street, George, 6530",
            ["contactPerson"] = "J. Molefe",
            ["contactTelephone"] = "044-801-9111",
            ["contactEmail"] = "j.molefe@george.gov.za",
            ["enabled"] = true,
            ["isVoid"] = false,
            ["isForwardedToVendor"] = true,
            ["lineItems"] = new object[]
            {
                new { id = "OLI-001", description = "Bitumen supply", quantity = 500, unitOfMeasure = "tonnes", unitPrice = new { amount = 7800m, currency = "ZAR" }, totalPrice = new { amount = 3900000m, currency = "ZAR" }, vatRate = 15 },
                new { id = "OLI-002", description = "Gravel and aggregate", quantity = 1200, unitOfMeasure = "cubic metres", unitPrice = new { amount = 780m, currency = "ZAR" }, totalPrice = new { amount = 936000m, currency = "ZAR" }, vatRate = 15 },
                new { id = "OLI-003", description = "Road marking paint", quantity = 200, unitOfMeasure = "litres", unitPrice = new { amount = 320m, currency = "ZAR" }, totalPrice = new { amount = 64000m, currency = "ZAR" }, vatRate = 15 }
            },
            ["auditTrail"] = new object[]
            {
                new { action = "Created", by = "System", date = "2025-03-22", notes = "Purchase order created from awarded RFQ-2025-001" },
                new { action = "Approved", by = "T. Dlamini", date = "2025-03-23", notes = "Order approved by CFO" },
                new { action = "Dispatched", by = "J. Molefe", date = "2025-03-24", notes = "Forwarded to Roadpave Materials (Pty) Ltd" }
            }
        });

        CreateOrderRecord(new Dictionary<string, object?>
        {
            ["orderNumber"] = "PO-2026-302",
            ["department"] = "Corporate Services",
            ["status"] = "dispatched",
            ["statusId"] = 3,
            ["financialYear"] = "2025/2026",
            ["supplier"] = new { name = "Cape IT Solutions CC", bbbeeLevel = 1, registrationNumber = "2018/654321/07" },
            ["totalValue"] = new { amount = 8800m, currency = "ZAR" },
            ["subtotal"] = new { amount = 8800m, currency = "ZAR" },
            ["vatAmount"] = new { amount = 1320m, currency = "ZAR" },
            ["totalIncVat"] = new { amount = 10120m, currency = "ZAR" },
            ["captureDate"] = "2026-03-05",
            ["deliveryDate"] = "2026-03-10",
            ["quotationRef"] = "RFQ-2026-002",
            ["requisitionRef"] = "REQ-2026-002",
            ["referenceType"] = "quotation",
            ["referenceNumber"] = "RFQ-2026-002",
            ["costCentre"] = "CC-COR-001",
            ["voteNumber"] = "Vote 3",
            ["paymentTerms"] = "30 days",
            ["deliveryTerms"] = "Delivered",
            ["deliveryAddress"] = "Municipal Offices, York Street, George, 6530",
            ["contactPerson"] = "M. Jacobs",
            ["contactTelephone"] = "044-801-9222",
            ["contactEmail"] = "m.jacobs@george.gov.za",
            ["enabled"] = true,
            ["isVoid"] = false,
            ["isForwardedToVendor"] = true,
            ["lineItems"] = new object[]
            {
                new { id = "OLI-PO302-001", lineNumber = 1, description = "Desktop Computer - Dell OptiPlex 7010", quantity = 1, unitOfMeasure = "each", unitPrice = new { amount = 8800m, currency = "ZAR" }, totalPrice = new { amount = 8800m, currency = "ZAR" }, vatRate = 15, quantityReceived = 1, quantityInvoiced = 0 }
            },
            ["auditTrail"] = new object[]
            {
                new { action = "Created", by = "System", date = "2026-03-05", notes = "Purchase order created from RFQ-2026-002" },
                new { action = "Approved", by = "Admin", date = "2026-03-06", notes = "Order approved" },
                new { action = "Dispatched", by = "Admin", date = "2026-03-07", notes = "Forwarded to Cape IT Solutions CC" }
            }
        });
    }

    private static Dictionary<string, object?> ConvertToDict(object dto)
    {
        if (dto is Dictionary<string, object?> dict) return dict;
        if (dto is JsonElement je && je.ValueKind == JsonValueKind.Object)
        {
            var result = new Dictionary<string, object?>();
            foreach (var prop in je.EnumerateObject())
                result[prop.Name] = ConvertJsonElement(prop.Value);
            return result;
        }
        try
        {
            var json = JsonSerializer.Serialize(dto);
            return JsonSerializer.Deserialize<Dictionary<string, object?>>(json) ?? new();
        }
        catch { return new Dictionary<string, object?>(); }
    }

    private static object? ConvertJsonElement(JsonElement el)
    {
        return el.ValueKind switch
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
    }
}
