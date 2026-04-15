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

public class QuotationService : IQuotationService
{
    private readonly IQuotationRepository _repo;
    private readonly ApplicationDbContext _context;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<QuotationService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    private static readonly ConcurrentDictionary<int, Dictionary<string, object?>> _quotations = new();
    private static readonly ConcurrentDictionary<string, List<VendorInvitationRecord>> _vendorRotation = new();
    private static int _nextId = 200;
    private static bool _seeded = false;
    private static readonly object _seedLock = new();

    public QuotationService(IQuotationRepository repo, ApplicationDbContext context, DbAvailabilityChecker dbChecker, ILogger<QuotationService> logger, IHttpContextAccessor httpContextAccessor)
    {
        _repo = repo;
        _context = context;
        _dbChecker = dbChecker;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
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
                _logger.LogWarning(ex, "DB read failed for quotation {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }
        _quotations.TryGetValue(id, out var q);
        return q;
    }

    public async Task<PagedResult<object>> GetAllAsync(string? financialYear, int? statusId, string? search, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repo.GetFilteredAsync(financialYear, statusId, search, page, pageSize);
                var dicts = result.Items.Select(EntityToDict).ToList();
                var dbIds = new HashSet<int>();
                foreach (var d in dicts)
                {
                    if (d.TryGetValue("id", out var idObj) && idObj is int id2)
                    {
                        dbIds.Add(id2);
                        _quotations[id2] = d;
                    }
                }
                foreach (var staleKey in _quotations.Keys.Where(k => !dbIds.Contains(k)).ToList())
                    _quotations.TryRemove(staleKey, out _);
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
                _logger.LogWarning(ex, "DB query failed for quotations, falling back");
                _dbChecker.MarkUnavailable();
            }
        }

        var query = _quotations.Values.Where(q => q.ContainsKey("enabled") && (bool)q["enabled"]!).AsEnumerable();

        if (!string.IsNullOrEmpty(financialYear))
            query = query.Where(q => q.TryGetValue("financialYear", out var fy) && fy?.ToString() == financialYear);
        if (statusId.HasValue)
            query = query.Where(q => q.TryGetValue("statusId", out var sid) && sid is int s && s == statusId.Value);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(q =>
                (q.TryGetValue("quotationNumber", out var qn) && qn?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true) ||
                (q.TryGetValue("title", out var t) && t?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true) ||
                (q.TryGetValue("description", out var d) && d?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true));

        var items = query.OrderByDescending(q => q.TryGetValue("captureDate", out var cd) ? cd?.ToString() : "").ToList();
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
            ["quotes"] = new object[] {},
            ["auditTrail"] = new object[] { new { action = "Created", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = "RFQ created" } }
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
                _logger.LogInformation("Created quotation {Id} in DB", entity.QuotationId);
                var saved = await _repo.GetWithDetailsAsync(entity.QuotationId);
                return EntityToDict(saved ?? entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for quotation, falling back");
                _dbChecker.MarkUnavailable();
            }
        }

        var id = CreateQuotationRecord(data);
        _logger.LogInformation("Created quotation {Id} in-memory", id);
        return _quotations[id];
    }

    public int CreateFromRequisition(string requisitionRef, string demandPlanRef, string title, string description, string department, decimal estimatedValue, string financialYear, string voteNumber, string serviceType, string contactPerson, object[]? lineItems = null, string? category = null, string? scoring = null, int? minQuotes = null, int? advertDays = null)
    {
        var effectiveScoring = scoring ?? "lowest_price";
        var effectiveAdvertDays = advertDays ?? 21;

        var data = new Dictionary<string, object?>
        {
            ["title"] = title,
            ["description"] = description,
            ["department"] = department,
            ["status"] = "draft",
            ["statusId"] = 0,
            ["financialYear"] = financialYear,
            ["estimatedCost"] = new { amount = estimatedValue, currency = "ZAR" },
            ["requisitionRef"] = requisitionRef,
            ["demandPlanRef"] = demandPlanRef,
            ["serviceType"] = serviceType,
            ["category"] = category ?? "",
            ["scoringMethod"] = effectiveScoring,
            ["contactPerson"] = contactPerson,
            ["voteNumber"] = voteNumber,
            ["enabled"] = true,
            ["closingDate"] = DateTime.UtcNow.AddDays(effectiveAdvertDays).ToString("yyyy-MM-dd"),
            ["closingTime"] = "11:00",
            ["minQuotes"] = minQuotes ?? 3,
            ["lineItems"] = lineItems ?? Array.Empty<object>(),
            ["quotes"] = new object[] {},
            ["auditTrail"] = new object[]
            {
                new { action = "Created", by = contactPerson, date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = $"RFQ created from requisition {requisitionRef} (scoring: {effectiveScoring}, advert: {effectiveAdvertDays}d)" }
            }
        };

        if (UseDb)
        {
            try
            {
                var entity = DictToEntity(data);
                _repo.AddAsync(entity).GetAwaiter().GetResult();
                _repo.SaveChangesAsync().GetAwaiter().GetResult();
                _logger.LogInformation("Created RFQ {Id} in DB from requisition {RequisitionRef}", entity.QuotationId, requisitionRef);
                data["id"] = entity.QuotationId;
                data["referenceNumber"] = $"RFQ-{DateTime.UtcNow:yyyy}-{entity.QuotationId:D3}";
                _quotations[entity.QuotationId] = data;
                return entity.QuotationId;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for RFQ from requisition, falling back");
                _dbChecker.MarkUnavailable();
            }
        }

        var id = CreateQuotationRecord(data);
        _logger.LogInformation("Created RFQ {Id} in-memory from requisition {RequisitionRef}", id, requisitionRef);
        return id;
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
                _logger.LogWarning(ex, "DB update failed for quotation {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_quotations.TryGetValue(id, out var q)) return false;
        var incomingDict = ConvertToDict(dto);
        foreach (var kv in incomingDict)
        {
            if (kv.Key != "id" && kv.Key != "referenceNumber")
                q[kv.Key] = kv.Value;
        }
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(id);
                if (entity == null) return false;
                entity.Enabled = false;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB delete failed for quotation {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_quotations.TryGetValue(id, out var q)) return false;
        q["enabled"] = false;
        return true;
    }

    public async Task<object> GetServiceDetailsAsync(int quotationId)
    {
        var q = await GetByIdAsync(quotationId);
        if (q is Dictionary<string, object?> dict && dict.TryGetValue("lineItems", out var items))
            return items ?? new List<object>();
        return new List<object>();
    }

    public Task<object> GetQuotationVendorsAsync(int quotationId)
    {
        if (_quotations.TryGetValue(quotationId, out var q) && q.TryGetValue("quotes", out var quotes))
            return Task.FromResult<object>(quotes!);
        return Task.FromResult<object>(new List<object>());
    }

    public async Task<bool> AwardAsync(int quotationId, object awardDto)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(quotationId);
                if (entity == null) return false;
                entity.StatusId = StatusMapper.ToStatusId("quotation", "awarded");
                entity.DateModified = DateTime.UtcNow;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                _logger.LogInformation("Awarded quotation {Id} in DB", quotationId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB award failed for quotation {Id}, falling back", quotationId);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_quotations.TryGetValue(quotationId, out var q)) return false;
        q["status"] = "awarded";
        q["statusId"] = 4;
        var trail = q.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
        trail.Add(new { action = "Awarded", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = "RFQ awarded" });
        q["auditTrail"] = trail.ToArray();
        _logger.LogInformation("Awarded quotation {Id}", quotationId);
        return true;
    }

    public async Task<object> GetEvaluationAsync(int quotationId)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(quotationId);
                if (entity != null)
                {
                    var statusName = StatusMapper.ToStatusName("quotation", entity.StatusId);
                    var isEvaluated = statusName == "evaluated" || statusName == "awarded" || statusName == "approved";
                    return new Dictionary<string, object?>
                    {
                        ["quotationId"] = quotationId,
                        ["evaluationStatus"] = isEvaluated ? "Completed" : "Pending",
                        ["statusName"] = statusName,
                        ["evaluationDate"] = entity.DateModified?.ToString("yyyy-MM-dd")
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB evaluation query failed for quotation {Id}", quotationId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new Dictionary<string, object?>
        {
            ["quotationId"] = quotationId,
            ["evaluationStatus"] = "Pending"
        };
    }

    public async Task<bool> SubmitAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(id);
                if (entity == null) return false;
                entity.StatusId = StatusMapper.ToStatusId("quotation", "submitted");
                entity.DateModified = DateTime.UtcNow;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB submit failed for quotation {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_quotations.TryGetValue(id, out var q)) return false;
        q["status"] = "submitted";
        q["statusId"] = 6;
        var auditTrail = q.TryGetValue("auditTrail", out var at) && at is List<object> list ? list : new List<object>();
        auditTrail.Add(new { action = "Submitted", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = "Submitted for approval" });
        q["auditTrail"] = auditTrail;
        return true;
    }

    public async Task<bool> PublishAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(id);
                if (entity == null) return false;
                entity.StatusId = StatusMapper.ToStatusId("quotation", "open");
                entity.DateModified = DateTime.UtcNow;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB publish failed for quotation {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_quotations.TryGetValue(id, out var q)) return false;
        q["status"] = "published";
        q["statusId"] = 1;
        var auditTrail = q.TryGetValue("auditTrail", out var at) && at is List<object> list ? list : new List<object>();
        auditTrail.Add(new { action = "Published", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = "Published to vendors" });
        q["auditTrail"] = auditTrail;
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
                entity.StatusId = StatusMapper.ToStatusId("quotation", "closed");
                entity.Approved = true;
                entity.ApprovedDate = DateTime.UtcNow;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB approve failed for quotation {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_quotations.TryGetValue(id, out var q)) return false;
        q["status"] = "approved";
        q["statusId"] = 2;
        return true;
    }

    public Dictionary<string, object?>? GetQuotationData(int id)
    {
        var result = GetByIdAsync(id).GetAwaiter().GetResult();
        return result as Dictionary<string, object?>;
    }

    public List<Dictionary<string, object?>> GetByRequisitionRef(string requisitionRef)
    {
        var results = _quotations.Values
            .Where(q => q.TryGetValue("requisitionRef", out var rr) && rr?.ToString() == requisitionRef)
            .ToList();
        if (results.Count > 0) return results;

        if (UseDb)
        {
            try
            {
                var all = GetAllAsync(null, null, null, 1, 1000).GetAwaiter().GetResult();
                results = all.Items
                    .OfType<Dictionary<string, object?>>()
                    .Where(q => q.TryGetValue("requisitionRef", out var rr) && rr?.ToString() == requisitionRef)
                    .ToList();
                if (results.Count > 0) return results;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB query failed for quotations by requisition ref");
                _dbChecker.MarkUnavailable();
            }
        }
        return results;
    }

    private Dictionary<string, object?> EntityToDict(Quotation entity)
    {
        var statusName = StatusMapper.ToStatusName("quotation", entity.StatusId);
        var lineItems = entity.ServiceDetails?.Select(sd => (object)new Dictionary<string, object?>
        {
            ["id"] = $"QLI-{sd.QuotationServiceDelId}",
            ["lineNumber"] = sd.QuotationServiceDelId,
            ["description"] = sd.ServiceDetailDesc ?? "Item",
            ["quantity"] = (int)(sd.Quantity ?? 1),
            ["unitOfMeasure"] = "each",
            ["estimatedUnitCost"] = new { amount = sd.UnitPrice ?? sd.EstimatedCost ?? 0m, currency = "ZAR" }
        }).ToArray() ?? Array.Empty<object>();

        var vendorQuotes = entity.Vendors?
            .Where(v => v.Enabled == true)
            .Select(v => (object)new Dictionary<string, object?>
            {
                ["id"] = $"QV-{v.EmailId}",
                ["vendorId"] = v.VendorId,
                ["supplierId"] = v.VendorId?.ToString() ?? "",
                ["supplierName"] = $"Vendor {v.VendorId}",
                ["vendorName"] = $"Vendor {v.VendorId}",
                ["totalAmount"] = new { amount = v.Cost ?? 0m, currency = "ZAR" },
                ["quotedAmount"] = v.Cost ?? 0m,
                ["isCompliant"] = !(v.NonCompliant ?? false),
                ["complianceStatus"] = (v.NonCompliant ?? false) ? "non_compliant" : "compliant",
                ["nonComplianceReason"] = v.NonComplianceReason,
                ["isSuccessful"] = v.Successful ?? false,
                ["isRecommended"] = v.Successful ?? false,
                ["noResponse"] = v.NoResponse ?? false,
                ["bbbeeLevel"] = 4,
                ["dateCaptured"] = v.DateCaptured?.ToString("yyyy-MM-dd")
            }).ToArray() ?? Array.Empty<object>();

        return new Dictionary<string, object?>
        {
            ["id"] = entity.QuotationId,
            ["quotationNumber"] = entity.QuotationNumber,
            ["referenceNumber"] = entity.QuotationNumber,
            ["title"] = entity.QuotationDescription,
            ["description"] = entity.QuotationDescription,
            ["departmentId"] = entity.DepartmentId,
            ["department"] = $"Department {entity.DepartmentId}",
            ["status"] = statusName,
            ["statusId"] = entity.StatusId ?? 0,
            ["financialYear"] = entity.FinancialYear,
            ["estimatedCost"] = new { amount = entity.EstimatedCost ?? 0m, currency = "ZAR" },
            ["closingDate"] = entity.ClosingDate?.ToString("yyyy-MM-dd") ?? "",
            ["closingTime"] = entity.ClosingTime ?? "11:00",
            ["contactPerson"] = entity.PersonName,
            ["contactEmail"] = entity.PersonEmail,
            ["captureDate"] = entity.DateCaptured?.ToString("yyyy-MM-dd"),
            ["enabled"] = entity.Enabled ?? true,
            ["lineItems"] = lineItems,
            ["quotes"] = vendorQuotes,
            ["auditTrail"] = Array.Empty<object>()
        };
    }

    private Quotation DictToEntity(Dictionary<string, object?> data)
    {
        var quotation = new Quotation
        {
            QuotationNumber = data.GetValueOrDefault("quotationNumber")?.ToString() ?? $"RFQ-{DateTime.UtcNow:yyyy}-{Interlocked.Increment(ref _nextId):D3}",
            QuotationDescription = data.GetValueOrDefault("description")?.ToString() ?? data.GetValueOrDefault("title")?.ToString(),
            FinancialYear = data.GetValueOrDefault("financialYear")?.ToString(),
            StatusId = data.TryGetValue("statusId", out var sid) && sid is int s ? s : 0,
            Enabled = true,
            DateCaptured = DateTime.UtcNow,
            CapturerId = 1,
            PersonName = data.GetValueOrDefault("contactPerson")?.ToString(),
            PersonEmail = data.GetValueOrDefault("contactEmail")?.ToString()
        };
        if (data.TryGetValue("estimatedCost", out var ecObj) && ecObj is Dictionary<string, object?> ecd && ecd.TryGetValue("amount", out var eca))
            quotation.EstimatedCost = Convert.ToDecimal(eca);
        if (data.TryGetValue("lineItems", out var liObj) && liObj is object[] items)
        {
            foreach (var item in items)
            {
                if (item is Dictionary<string, object?> li)
                {
                    var detail = new QuotationServiceDetail
                    {
                        ServiceDetailDesc = li.GetValueOrDefault("description")?.ToString(),
                        Quantity = li.TryGetValue("quantity", out var qty) && qty != null ? Convert.ToDecimal(qty) : 1,
                        Enabled = true,
                        DateCaptured = DateTime.UtcNow,
                        CapturerId = 1
                    };
                    if (li.TryGetValue("estimatedUnitCost", out var euc) && euc is Dictionary<string, object?> eucd && eucd.TryGetValue("amount", out var euca))
                    {
                        detail.UnitPrice = Convert.ToDecimal(euca);
                        detail.EstimatedCost = detail.UnitPrice * detail.Quantity;
                    }
                    quotation.ServiceDetails.Add(detail);
                }
            }
        }
        return quotation;
    }

    private void ApplyDictToEntity(Quotation entity, Dictionary<string, object?> data)
    {
        if (data.TryGetValue("description", out var desc) && desc != null)
            entity.QuotationDescription = desc.ToString();
        if (data.TryGetValue("financialYear", out var fy) && fy != null)
            entity.FinancialYear = fy.ToString();
        if (data.TryGetValue("statusId", out var sid) && sid != null)
            entity.StatusId = Convert.ToInt32(sid);
        if (data.TryGetValue("contactPerson", out var cp) && cp != null)
            entity.PersonName = cp.ToString();
    }

    private int CreateQuotationRecord(Dictionary<string, object?> data)
    {
        var id = Interlocked.Increment(ref _nextId);
        data["id"] = id;
        if (!data.ContainsKey("quotationNumber"))
            data["quotationNumber"] = $"RFQ-{DateTime.UtcNow:yyyy}-{id:D3}";
        data["referenceNumber"] = data["quotationNumber"];
        if (!data.ContainsKey("captureDate"))
            data["captureDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd");
        if (!data.ContainsKey("enabled"))
            data["enabled"] = true;
        _quotations[id] = data;
        return id;
    }

    private void SeedData()
    {
        CreateQuotationRecord(new Dictionary<string, object?>
        {
            ["quotationNumber"] = "RFQ-2025-001",
            ["title"] = "Road Rehabilitation Materials Supply",
            ["description"] = "Supply of bitumen, aggregate and road marking materials for the 2025/26 road rehabilitation programme",
            ["department"] = "Infrastructure Development",
            ["status"] = "awarded",
            ["statusId"] = 4,
            ["financialYear"] = "2025/26",
            ["estimatedCost"] = new { amount = 8500000m, currency = "ZAR" },
            ["closingDate"] = "2025-03-15",
            ["closingTime"] = "11:00",
            ["requisitionRef"] = "REQ-2025-001",
            ["demandPlanRef"] = "DP-2025-001",
            ["serviceType"] = "goods",
            ["businessArea"] = "Roads & Stormwater",
            ["scoringMethod"] = "price_and_quality",
            ["contactPerson"] = "J. Molefe",
            ["contactEmail"] = "j.molefe@george.gov.za",
            ["voteNumber"] = "Vote 8",
            ["enabled"] = true,
            ["captureDate"] = "2025-02-27",
            ["lineItems"] = new object[]
            {
                new { id = "QLI-001", lineNumber = 1, description = "Bitumen supply", quantity = 500, unitOfMeasure = "tonnes", estimatedUnitCost = new { amount = 8500m, currency = "ZAR" } },
                new { id = "QLI-002", lineNumber = 2, description = "Gravel and aggregate", quantity = 1200, unitOfMeasure = "cubic metres", estimatedUnitCost = new { amount = 850m, currency = "ZAR" } },
                new { id = "QLI-003", lineNumber = 3, description = "Road marking paint", quantity = 200, unitOfMeasure = "litres", estimatedUnitCost = new { amount = 350m, currency = "ZAR" } }
            },
            ["quotes"] = new object[]
            {
                new { id = "Q-001", supplierName = "Roadpave Materials (Pty) Ltd", bbbeeLevel = 2, totalAmount = new { amount = 7850000m, currency = "ZAR" }, deliveryDays = 21, isRecommended = true, status = "awarded", score = 92 },
                new { id = "Q-002", supplierName = "SA Bitumen Supplies", bbbeeLevel = 3, totalAmount = new { amount = 8200000m, currency = "ZAR" }, deliveryDays = 28, isRecommended = false, status = "not_awarded", score = 78 },
                new { id = "Q-003", supplierName = "National Road Materials", bbbeeLevel = 1, totalAmount = new { amount = 9100000m, currency = "ZAR" }, deliveryDays = 14, isRecommended = false, status = "not_awarded", score = 71 }
            },
            ["auditTrail"] = new object[]
            {
                new { action = "Created", by = "J. Molefe", date = "2025-02-27", notes = "RFQ created from requisition REQ-2025-001" },
                new { action = "Published", by = "J. Molefe", date = "2025-02-28", notes = "Published to 5 vendors" },
                new { action = "Closed", by = "System", date = "2025-03-15", notes = "3 quotes received" },
                new { action = "Evaluated", by = "S. Nkosi", date = "2025-03-18", notes = "Price and quality evaluation completed" },
                new { action = "Awarded", by = "T. Dlamini", date = "2025-03-20", notes = "Awarded to Roadpave Materials (Pty) Ltd" }
            }
        });

        CreateQuotationRecord(new Dictionary<string, object?>
        {
            ["quotationNumber"] = "RFQ-2025-002",
            ["title"] = "Water Pipeline Components Supply",
            ["description"] = "Supply of HDPE pipes, fittings and valves for pipeline replacement project",
            ["department"] = "Infrastructure Development",
            ["status"] = "open",
            ["statusId"] = 1,
            ["financialYear"] = "2025/26",
            ["estimatedCost"] = new { amount = 12800000m, currency = "ZAR" },
            ["closingDate"] = "2025-04-15",
            ["closingTime"] = "11:00",
            ["requisitionRef"] = "REQ-2025-002",
            ["demandPlanRef"] = "DP-2025-001",
            ["serviceType"] = "goods",
            ["businessArea"] = "Water & Sanitation",
            ["scoringMethod"] = "lowest_price",
            ["contactPerson"] = "J. Molefe",
            ["contactEmail"] = "j.molefe@george.gov.za",
            ["voteNumber"] = "Vote 8",
            ["enabled"] = true,
            ["captureDate"] = "2025-03-01",
            ["lineItems"] = new object[]
            {
                new { id = "QLI-004", lineNumber = 1, description = "HDPE pipes 200mm", quantity = 2000, unitOfMeasure = "metres", estimatedUnitCost = new { amount = 3200m, currency = "ZAR" } },
                new { id = "QLI-005", lineNumber = 2, description = "Pipe fittings and valves", quantity = 150, unitOfMeasure = "sets", estimatedUnitCost = new { amount = 4500m, currency = "ZAR" } }
            },
            ["invitedVendors"] = new object[]
            {
                new { supplierId = "v001", supplierName = "Boland Building Supplies (Pty) Ltd", bbbeeLevel = 2 },
                new { supplierId = "v002", supplierName = "Cape IT Solutions CC", bbbeeLevel = 1 },
                new { supplierId = "v003", supplierName = "Garden Route Electrical (Pty) Ltd", bbbeeLevel = 3 }
            },
            ["quotes"] = new object[] {},
            ["auditTrail"] = new object[]
            {
                new { action = "Created", by = "J. Molefe", date = "2025-03-01", notes = "RFQ created from requisition REQ-2025-002" },
                new { action = "Published", by = "J. Molefe", date = "2025-03-02", notes = "Published to 4 vendors" }
            }
        });

        CreateQuotationRecord(new Dictionary<string, object?>
        {
            ["quotationNumber"] = "RFQ-2025-003",
            ["title"] = "Community Hall Renovation",
            ["description"] = "Building renovation and electrical rewiring services for community hall",
            ["department"] = "Community Services",
            ["status"] = "draft",
            ["statusId"] = 0,
            ["financialYear"] = "2025/26",
            ["estimatedCost"] = new { amount = 3200000m, currency = "ZAR" },
            ["closingDate"] = "",
            ["closingTime"] = "11:00",
            ["requisitionRef"] = "REQ-2025-003",
            ["demandPlanRef"] = "DP-2025-002",
            ["serviceType"] = "services",
            ["businessArea"] = "Buildings & Facilities",
            ["scoringMethod"] = "price_and_quality",
            ["contactPerson"] = "N. Khumalo",
            ["contactEmail"] = "n.khumalo@george.gov.za",
            ["voteNumber"] = "Vote 5",
            ["enabled"] = true,
            ["captureDate"] = "2025-03-05",
            ["lineItems"] = new object[]
            {
                new { id = "QLI-006", lineNumber = 1, description = "Building renovation works", quantity = 1, unitOfMeasure = "service", estimatedUnitCost = new { amount = 2500000m, currency = "ZAR" } },
                new { id = "QLI-007", lineNumber = 2, description = "Electrical rewiring", quantity = 1, unitOfMeasure = "service", estimatedUnitCost = new { amount = 700000m, currency = "ZAR" } }
            },
            ["quotes"] = new object[] {},
            ["auditTrail"] = new object[]
            {
                new { action = "Created", by = "N. Khumalo", date = "2025-03-05", notes = "RFQ created from requisition REQ-2025-003" }
            }
        });

        CreateQuotationRecord(new Dictionary<string, object?>
        {
            ["quotationNumber"] = "RFQ-2026-204",
            ["title"] = "Computer",
            ["description"] = "Computer procurement for Infrastructure and Engineering",
            ["department"] = "Infrastructure and Engineering",
            ["status"] = "published",
            ["statusId"] = 1,
            ["financialYear"] = "2025/26",
            ["estimatedCost"] = new { amount = 1000m, currency = "ZAR" },
            ["closingDate"] = "2026-04-07",
            ["closingTime"] = "11:00",
            ["requisitionRef"] = "REQ-2026-104",
            ["demandPlanRef"] = "",
            ["serviceType"] = "goods",
            ["category"] = "goods",
            ["businessArea"] = "Infrastructure and Engineering",
            ["scoringMethod"] = "lowest_price",
            ["contactPerson"] = "System",
            ["voteNumber"] = "",
            ["enabled"] = true,
            ["captureDate"] = "2026-03-17",
            ["assignedBuyerName"] = "S. Nkosi",
            ["assignedBuyer"] = "buyer-001",
            ["publishedDate"] = "2026-03-17",
            ["lineItems"] = new object[]
            {
                new { id = "QLI-204-001", lineNumber = 1, purchaseItem = "Computer", name = "Computer", description = "Computer", quantity = 1, unitOfMeasure = "each", estimatedUnitPrice = new { amount = 1000m, currency = "ZAR" }, estimatedTotal = new { amount = 1000m, currency = "ZAR" } }
            },
            ["invitedVendors"] = new object[]
            {
                new { supplierId = "v001", supplierName = "Boland Building Supplies (Pty) Ltd", bbbeeLevel = 2 },
                new { supplierId = "v002", supplierName = "Cape IT Solutions CC", bbbeeLevel = 1 },
                new { supplierId = "v003", supplierName = "Garden Route Electrical (Pty) Ltd", bbbeeLevel = 3 }
            },
            ["quotes"] = new List<object>
            {
                new Dictionary<string, object?> { ["id"] = "Q-204-001", ["supplierId"] = "v001", ["supplierName"] = "Boland Building Supplies (Pty) Ltd", ["bbbeeLevel"] = 2, ["totalAmount"] = new { amount = 950m, currency = "ZAR" }, ["deliveryDays"] = 14, ["status"] = "received", ["responseStatus"] = "received", ["complianceStatus"] = "compliant", ["score"] = 0 },
                new Dictionary<string, object?> { ["id"] = "Q-204-002", ["supplierId"] = "v002", ["supplierName"] = "Cape IT Solutions CC", ["bbbeeLevel"] = 3, ["totalAmount"] = new { amount = 880m, currency = "ZAR" }, ["deliveryDays"] = 7, ["status"] = "received", ["responseStatus"] = "received", ["complianceStatus"] = "compliant", ["score"] = 0 },
                new Dictionary<string, object?> { ["id"] = "Q-204-003", ["supplierId"] = "v003", ["supplierName"] = "Garden Route Electrical (Pty) Ltd", ["bbbeeLevel"] = 1, ["totalAmount"] = new { amount = 1050m, currency = "ZAR" }, ["deliveryDays"] = 10, ["status"] = "received", ["responseStatus"] = "received", ["complianceStatus"] = "compliant", ["score"] = 0 }
            },
            ["auditTrail"] = new List<object>
            {
                new { action = "Created", by = "System", date = "2026-03-17", notes = "RFQ created from requisition REQ-2026-104 (Computer)" },
                new { action = "Buyer Assigned", by = "System", date = "2026-03-17", notes = "Buyer S. Nkosi assigned" },
                new { action = "Submitted", by = "System", date = "2026-03-17", notes = "Submitted for approval" },
                new { action = "Approved", by = "T. Dlamini", date = "2026-03-17", notes = "RFQ approved by CFO" },
                new { action = "Published", by = "S. Nkosi", date = "2026-03-17", notes = "Published to 3 vendors" },
                new { action = "Quote Received", by = "Boland Building Supplies", date = "2026-03-18", notes = "Quote R950.00 received" },
                new { action = "Quote Received", by = "Cape IT Solutions", date = "2026-03-19", notes = "Quote R880.00 received (lowest)" },
                new { action = "Quote Received", by = "Garden Route Electrical", date = "2026-03-20", notes = "Quote R1,050.00 received" }
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

    private string GetCurrentUser()
    {
        return _httpContextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
    }

    public async Task<object> GetVendorRotationAsync(string? category)
    {
        var cat = category ?? "all";
        if (UseDb)
        {
            try
            {
                var invitations = await _context.QuotationVendors
                    .Where(qv => qv.Enabled == true)
                    .GroupBy(qv => qv.VendorId)
                    .Select(g => new
                    {
                        VendorId = g.Key,
                        InvitationCount = g.Count(),
                        LastInvited = g.Max(qv => qv.DateCaptured),
                        AwardCount = g.Count(qv => qv.Successful == true)
                    })
                    .OrderBy(v => v.InvitationCount)
                    .ThenBy(v => v.LastInvited)
                    .ToListAsync();

                return new
                {
                    category = cat,
                    vendors = invitations.Select(v => new
                    {
                        vendorId = v.VendorId,
                        invitationCount = v.InvitationCount,
                        lastInvited = v.LastInvited?.ToString("yyyy-MM-dd"),
                        awardCount = v.AwardCount,
                        rotationScore = CalculateRotationScore(v.InvitationCount, v.AwardCount, v.LastInvited)
                    }),
                    generatedDate = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB vendor rotation query failed, falling back");
                _dbChecker.MarkUnavailable();
            }
        }

        var records = _vendorRotation.GetOrAdd(cat, _ => new List<VendorInvitationRecord>());
        var grouped = records.GroupBy(r => r.VendorId).Select(g => new
        {
            vendorId = g.Key,
            vendorName = g.First().VendorName,
            invitationCount = g.Count(),
            lastInvited = g.Max(r => r.InvitedDate).ToString("yyyy-MM-dd"),
            awardCount = 0,
            rotationScore = CalculateRotationScore(g.Count(), 0, g.Max(r => r.InvitedDate))
        }).OrderBy(v => v.invitationCount).ThenBy(v => v.lastInvited);

        return new { category = cat, vendors = grouped, generatedDate = DateTime.UtcNow };
    }

    public async Task<bool> RecordVendorInvitationAsync(int quotationId, string vendorId, string category)
    {
        var cat = category ?? "all";
        var records = _vendorRotation.GetOrAdd(cat, _ => new List<VendorInvitationRecord>());
        records.Add(new VendorInvitationRecord
        {
            QuotationId = quotationId,
            VendorId = vendorId,
            VendorName = vendorId,
            Category = cat,
            InvitedDate = DateTime.UtcNow
        });

        if (UseDb)
        {
            try
            {
                var parsedVendorId = int.TryParse(vendorId, out var vid) ? vid : 0;
                var exists = await _context.QuotationVendors
                    .AnyAsync(qv => qv.QuotationId == quotationId && qv.VendorId == parsedVendorId);
                if (!exists && parsedVendorId > 0)
                {
                    var qv = new QuotationVendor
                    {
                        QuotationId = quotationId,
                        VendorId = parsedVendorId,
                        Enabled = true,
                        DateCaptured = DateTime.UtcNow,
                        CapturerId = 1
                    };
                    await _context.QuotationVendors.AddAsync(qv);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Recorded vendor {VendorId} invitation for quotation {QuotationId}", vendorId, quotationId);
                }
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB record vendor invitation failed, falling back");
                _dbChecker.MarkUnavailable();
            }
        }

        return true;
    }

    public async Task<object?> CreateDeviationAsync(int quotationId, string reason, string motivatedBy)
    {
        if (UseDb)
        {
            try
            {
                var quotation = await _repo.GetByIdAsync(quotationId);
                if (quotation == null) return null;

                var deviation = new DeviationsRegister
                {
                    RequisitionId = quotationId,
                    OrderId = null,
                    CaptureDate = DateTime.UtcNow,
                    DeviationAmount = quotation.EstimatedCost,
                    AuthorisedExpenditureIndicator = reason,
                    DateCaptured = DateTime.UtcNow,
                    CapturerId = 1
                };
                _context.DeviationsRegisters.Add(deviation);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created deviation {DeviationId} for quotation {QuotationId}", deviation.DeviationsRegisterId, quotationId);
                return new
                {
                    deviationId = deviation.DeviationsRegisterId,
                    quotationId,
                    reason,
                    motivatedBy,
                    amount = quotation.EstimatedCost,
                    status = "pending_ao_approval",
                    createdDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                    type = "less_than_three_quotes"
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create deviation failed for quotation {QuotationId}, falling back", quotationId);
                _dbChecker.MarkUnavailable();
            }
        }

        return new
        {
            deviationId = new Random().Next(1000, 9999),
            quotationId,
            reason,
            motivatedBy,
            amount = 0m,
            status = "pending_ao_approval",
            createdDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            type = "less_than_three_quotes"
        };
    }

    public async Task<object> GetDeviationsAsync(int quotationId)
    {
        if (UseDb)
        {
            try
            {
                var deviations = await _context.DeviationsRegisters
                    .Where(d => d.RequisitionId == quotationId || d.OrderId == quotationId)
                    .OrderByDescending(d => d.DateCaptured)
                    .ToListAsync();

                return deviations.Select(d => new
                {
                    deviationId = d.DeviationsRegisterId,
                    amount = d.DeviationAmount,
                    captureDate = d.CaptureDate?.ToString("yyyy-MM-dd"),
                    indicator = d.AuthorisedExpenditureIndicator
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB deviations query failed for quotation {QuotationId}", quotationId);
                _dbChecker.MarkUnavailable();
            }
        }

        return new List<object>();
    }

    private static decimal CalculateRotationScore(int invitationCount, int awardCount, DateTime? lastInvited)
    {
        var daysSinceInvite = lastInvited.HasValue ? (DateTime.UtcNow - lastInvited.Value).TotalDays : 365;
        var invitePenalty = invitationCount * 10m;
        var awardPenalty = awardCount * 20m;
        var recencyBonus = (decimal)Math.Min(daysSinceInvite, 365) / 365m * 100m;
        return Math.Round(Math.Max(0, recencyBonus - invitePenalty - awardPenalty), 1);
    }
}

public class VendorInvitationRecord
{
    public int QuotationId { get; set; }
    public string VendorId { get; set; } = "";
    public string VendorName { get; set; } = "";
    public string Category { get; set; } = "";
    public DateTime InvitedDate { get; set; }
}
