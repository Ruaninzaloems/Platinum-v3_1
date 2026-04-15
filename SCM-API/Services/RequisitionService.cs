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

public class RequisitionService : IRequisitionService
{
    private readonly IRequisitionRepository _repo;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<RequisitionService> _logger;
    private readonly ApplicationDbContext _context;

    private static readonly ConcurrentDictionary<int, Dictionary<string, object?>> _requisitions = new();
    private static readonly ConcurrentDictionary<int, string> _departmentNames = new();
    private static int _nextId = 100;
    private static bool _seeded = false;
    private static readonly object _seedLock = new();


    public RequisitionService(IRequisitionRepository repo, DbAvailabilityChecker dbChecker, ILogger<RequisitionService> logger, ApplicationDbContext context)
    {
        _repo = repo;
        _dbChecker = dbChecker;
        _logger = logger;
        _context = context;
        EnsureSeeded();
        LoadDepartmentNames();
    }

    private void LoadDepartmentNames()
    {
        if (_departmentNames.Count > 0 || !UseDb) return;
        try
        {
            var depts = _context.Departments.Where(d => d.Enabled == true).ToList();
            foreach (var d in depts)
                _departmentNames.TryAdd(d.DepartmentId, d.DepartmentDesc ?? $"Department {d.DepartmentId}");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load department names from DB");
        }
    }

    private string GetDepartmentName(int? deptId) =>
        deptId.HasValue && _departmentNames.TryGetValue(deptId.Value, out var name) ? name : deptId.HasValue ? $"Department {deptId}" : "Unassigned";

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
                _logger.LogWarning(ex, "DB read failed for requisition {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }
        _requisitions.TryGetValue(id, out var req);
        return req;
    }

    public async Task<PagedResult<object>> GetAllAsync(string? financialYear, int? statusId, int? departmentId, string? search, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var result = await _repo.GetFilteredAsync(financialYear, statusId, departmentId, search, page, pageSize);
                return new PagedResult<object>
                {
                    Items = result.Items.Select(EntityToDict).Cast<object>(),
                    Page = result.Page,
                    PageSize = result.PageSize,
                    TotalCount = result.TotalCount
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB query failed for requisitions, falling back");
                _dbChecker.MarkUnavailable();
            }
        }

        var query = _requisitions.Values.Where(r => r.ContainsKey("enabled") && (bool)r["enabled"]!).AsEnumerable();

        if (!string.IsNullOrEmpty(financialYear))
            query = query.Where(r => r.TryGetValue("financialYear", out var fy) && fy?.ToString() == financialYear);
        if (statusId.HasValue)
            query = query.Where(r => r.TryGetValue("statusId", out var sid) && sid is int s && s == statusId.Value);
        if (departmentId.HasValue)
            query = query.Where(r => r.TryGetValue("departmentId", out var did) && did is int d && d == departmentId.Value);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(r =>
                (r.TryGetValue("requisitionNumber", out var rn) && rn?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true) ||
                (r.TryGetValue("serviceDescription", out var sd) && sd?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true) ||
                (r.TryGetValue("department", out var dept) && dept?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true));

        var items = query.OrderByDescending(r => r.TryGetValue("captureDate", out var cd) ? cd?.ToString() : "").ToList();
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
            ["finalApproved"] = false,
            ["enabled"] = true,
            ["auditTrail"] = new object[] { new { action = "Created", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = "Requisition created" } }
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
                _logger.LogInformation("Created requisition {Id} in DB", entity.RequisitionId);
                var saved = await _repo.GetWithDetailsAsync(entity.RequisitionId);
                return EntityToDict(saved ?? entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for requisition, falling back");
                _dbChecker.MarkUnavailable();
            }
        }

        var id = CreateRequisitionRecord(data);
        _logger.LogInformation("Created requisition {Id} in-memory", id);
        return _requisitions[id];
    }

    public int CreateFromDemandPlan(string demandPlanRef, string department, int departmentId, string description, decimal estimatedValue, string requestedBy, string financialYear, string voteNumber, string procurementRoute, string priority, object[]? lineItems = null)
    {
        var data = new Dictionary<string, object?>
        {
            ["department"] = department,
            ["departmentId"] = departmentId,
            ["serviceDescription"] = description,
            ["status"] = "draft",
            ["statusId"] = 0,
            ["financialYear"] = financialYear,
            ["totalEstimatedValue"] = new { amount = estimatedValue, currency = "ZAR" },
            ["requestedBy"] = requestedBy,
            ["voteNumber"] = voteNumber,
            ["demandPlanRef"] = demandPlanRef,
            ["priority"] = priority,
            ["procurementRoute"] = procurementRoute,
            ["finalApproved"] = false,
            ["enabled"] = true,
            ["lineItems"] = lineItems ?? Array.Empty<object>(),
            ["auditTrail"] = new object[]
            {
                new { action = "Created", by = requestedBy, date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = $"Generated from demand plan {demandPlanRef}" }
            }
        };

        if (UseDb)
        {
            try
            {
                var entity = DictToEntity(data);
                _repo.AddAsync(entity).GetAwaiter().GetResult();
                _repo.SaveChangesAsync().GetAwaiter().GetResult();
                _logger.LogInformation("Created requisition {Id} in DB from demand plan {DemandPlanRef}", entity.RequisitionId, demandPlanRef);
                data["id"] = entity.RequisitionId;
                data["requisitionNumber"] = $"REQ-{DateTime.UtcNow:yyyy}-{entity.RequisitionId:D3}";
                data["referenceNumber"] = data["requisitionNumber"];
                _requisitions[entity.RequisitionId] = data;
                return entity.RequisitionId;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for requisition from demand plan, falling back");
                _dbChecker.MarkUnavailable();
            }
        }

        var id = CreateRequisitionRecord(data);
        _logger.LogInformation("Created requisition {Id} in-memory from demand plan {DemandPlanRef}", id, demandPlanRef);
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
                _logger.LogWarning(ex, "DB update failed for requisition {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_requisitions.TryGetValue(id, out var req)) return false;
        var incomingDict = ConvertToDict(dto);
        foreach (var kv in incomingDict)
        {
            if (kv.Key != "id" && kv.Key != "requisitionNumber" && kv.Key != "referenceNumber")
                req[kv.Key] = kv.Value;
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
                entity.IsDeleted = true;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB delete failed for requisition {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_requisitions.TryGetValue(id, out var req)) return false;
        req["enabled"] = false;
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
                entity.FinalApproved = true;
                entity.SavedStatusId = StatusMapper.ToStatusId("requisition", "final_approved");
                entity.DateModified = DateTime.UtcNow;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                _logger.LogInformation("Approved requisition {Id} in DB", id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB approve failed for requisition {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_requisitions.TryGetValue(id, out var req)) return false;
        req["status"] = "final_approved";
        req["statusId"] = 6;
        req["finalApproved"] = true;
        var trail = req.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
        trail.Add(new { action = "Final Approved", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = "Requisition approved" });
        req["auditTrail"] = trail.ToArray();
        _logger.LogInformation("Approved requisition {Id}", id);
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
                entity.SavedStatusId = StatusMapper.ToStatusId("requisition", "supervisor_review");
                entity.DateModified = DateTime.UtcNow;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB submit failed for requisition {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_requisitions.TryGetValue(id, out var req)) return false;
        req["status"] = "supervisor_review";
        req["statusId"] = 3;
        var trail = req.TryGetValue("auditTrail", out var at) && at is object[] arr ? arr.ToList() : new List<object>();
        trail.Add(new { action = "Submitted", by = "System", date = DateTime.UtcNow.ToString("yyyy-MM-dd"), notes = "Submitted for supervisor review" });
        req["auditTrail"] = trail.ToArray();
        return true;
    }

    public async Task<object> GetServiceDetailsAsync(int requisitionId)
    {
        var req = await GetByIdAsync(requisitionId);
        if (req is Dictionary<string, object?> dict && dict.TryGetValue("lineItems", out var items))
            return items ?? new List<object>();
        return new List<object>();
    }

    public async Task<object> GetDocumentsAsync(int requisitionId)
    {
        var req = await GetByIdAsync(requisitionId);
        if (req is Dictionary<string, object?> dict && dict.TryGetValue("documents", out var docs))
            return docs ?? new List<object>();
        return new List<object>();
    }
    public async Task<object> GetApprovalHistoryAsync(int requisitionId)
    {
        if (UseDb)
        {
            try
            {
                var rows = await _context.AuditLogs
                    .Where(a => a.RecordId == requisitionId && a.TableName == "SCM_Requisition")
                    .OrderByDescending(a => a.AuditDate)
                    .ToListAsync();
                if (rows.Count > 0)
                {
                    return rows.Select(a => (object)new Dictionary<string, object?>
                    {
                        ["action"] = a.AuditDesc,
                        ["date"] = a.AuditDate.ToString("yyyy-MM-dd HH:mm"),
                        ["notes"] = a.AuditComment,
                        ["userId"] = a.UserId
                    }).ToList();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB audit query failed for requisition {Id}", requisitionId);
                _dbChecker.MarkUnavailable();
            }
        }
        if (_requisitions.TryGetValue(requisitionId, out var req) && req.TryGetValue("auditTrail", out var trail))
            return trail!;
        return new List<object>();
    }
    public async Task<object> GetBillOfQuantityAsync(int requisitionId)
    {
        if (UseDb)
        {
            try
            {
                var rows = await _context.RequisitionBillOfQuantities
                    .Where(b => b.RequisitionId == requisitionId)
                    .ToListAsync();
                var items = rows.Select(b => (object)new Dictionary<string, object?>
                {
                    ["id"] = b.BillOfQuantityId,
                    ["purchaseItem"] = b.PurchaseItem,
                    ["quantity"] = b.Quantity ?? 0m,
                    ["uom"] = b.Uom ?? "each"
                }).ToList();
                return items;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB query failed for bill of quantity, requisition {Id}", requisitionId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new List<object>();
    }

    public async Task<bool> RouteAsync(int id, object routingDto)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(id);
                if (entity == null) return false;
                entity.SavedStatusId = StatusMapper.ToStatusId("requisition", "routed");
                entity.DateModified = DateTime.UtcNow;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB route failed for requisition {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_requisitions.TryGetValue(id, out var req)) return false;
        req["status"] = "routed";
        req["statusId"] = 7;
        return true;
    }

    public async Task<bool> AmendAsync(int id, object amendDto)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(id);
                if (entity == null) return false;
                entity.DateModified = DateTime.UtcNow;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB amend failed for requisition {Id}", id);
                _dbChecker.MarkUnavailable();
            }
        }

        var data = await GetByIdAsync(id);
        if (data is not Dictionary<string, object?> req) return false;
        var incoming = ConvertToDict(amendDto);
        foreach (var kv in incoming)
        {
            if (kv.Key is "id" or "requisitionNumber") continue;
            req[kv.Key] = kv.Value;
        }
        req["status"] = "draft";
        req["statusId"] = 0;
        await UpdateAsync(id, req);
        return true;
    }

    public async Task<bool> ReturnAsync(int id, object returnDto)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(id);
                if (entity == null) return false;
                entity.SavedStatusId = StatusMapper.ToStatusId("requisition", "returned");
                entity.Rejected = true;
                entity.DateModified = DateTime.UtcNow;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB return failed for requisition {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_requisitions.TryGetValue(id, out var req)) return false;
        req["status"] = "returned";
        req["statusId"] = 9;
        return true;
    }

    public async Task<object> GetDeviationsAsync(int requisitionId)
    {
        if (UseDb)
        {
            try
            {
                var rows = await _context.DeviationsRegisters
                    .Where(d => d.RequisitionId == requisitionId)
                    .ToListAsync();
                var items = rows.Select(d => (object)new Dictionary<string, object?>
                {
                    ["id"] = d.DeviationsRegisterId,
                    ["captureDate"] = d.CaptureDate?.ToString("yyyy-MM-dd"),
                    ["deviationAmount"] = new Dictionary<string, object?> { ["amount"] = d.DeviationAmount ?? 0m, ["currency"] = "ZAR" },
                    ["indicator"] = d.AuthorisedExpenditureIndicator
                }).ToList();
                return items;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB query failed for deviations, requisition {Id}", requisitionId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new List<object>();
    }

    public List<Dictionary<string, object?>> GetByDemandPlanRef(string demandPlanRef)
    {
        return _requisitions.Values
            .Where(r => r.TryGetValue("demandPlanRef", out var dp) && dp?.ToString() == demandPlanRef && r.ContainsKey("enabled") && (bool)r["enabled"]!)
            .ToList();
    }

    private Dictionary<string, object?> EntityToDict(Requisition entity)
    {
        var statusName = StatusMapper.ToStatusName("requisition", entity.SavedStatusId);
        var lineItems = entity.ServiceDetails?.Select(sd => (object)new Dictionary<string, object?>
        {
            ["id"] = $"LI-{sd.RequisitionDetailId}",
            ["purchaseItem"] = sd.PurchaseItem ?? sd.ServiceDescription ?? "Item",
            ["name"] = sd.PurchaseItem ?? sd.ServiceDescription ?? "Item",
            ["description"] = sd.ServiceDescription ?? sd.PurchaseItem ?? "Item",
            ["purchaseItemDescription2"] = sd.PurchaseItem2 ?? sd.ServiceDescription ?? "",
            ["purchaseItemDescription3"] = sd.PurchaseItem3 ?? "",
            ["quantity"] = (int)(sd.Quantity ?? 1),
            ["unitOfMeasure"] = sd.Uom ?? "each",
            ["estimatedUnitPrice"] = new { amount = sd.EstimatedCost ?? 0m, currency = "ZAR" },
            ["estimatedUnitCost"] = new { amount = sd.EstimatedCost ?? 0m, currency = "ZAR" },
            ["estimatedTotal"] = new { amount = (sd.EstimatedCost ?? 0m) * (sd.Quantity ?? 1m), currency = "ZAR" },
            ["totalCost"] = new { amount = (sd.EstimatedCost ?? 0m) * (sd.Quantity ?? 1m), currency = "ZAR" }
        }).ToArray() ?? Array.Empty<object>();

        var totalValue = entity.ServiceDetails?.Sum(sd => (sd.EstimatedCost ?? 0) * (sd.Quantity ?? 1)) ?? 0m;

        return new Dictionary<string, object?>
        {
            ["id"] = entity.RequisitionId,
            ["requisitionNumber"] = entity.RequisitionNumber,
            ["referenceNumber"] = entity.RequisitionNumber,
            ["serviceDescription"] = entity.ServiceDescription,
            ["departmentId"] = entity.DepartmentId,
            ["department"] = GetDepartmentName(entity.DepartmentId),
            ["status"] = statusName,
            ["statusId"] = entity.SavedStatusId ?? 0,
            ["financialYear"] = entity.FinancialYear,
            ["totalEstimatedValue"] = new { amount = totalValue, currency = "ZAR" },
            ["captureDate"] = entity.DateCaptured?.ToString("yyyy-MM-dd"),
            ["finalApproved"] = entity.FinalApproved ?? false,
            ["enabled"] = entity.Enabled ?? true,
            ["lineItems"] = lineItems,
            ["auditTrail"] = Array.Empty<object>()
        };
    }

    private Requisition DictToEntity(Dictionary<string, object?> data)
    {
        var entity = new Requisition
        {
            RequisitionNumber = data.GetValueOrDefault("requisitionNumber")?.ToString() ?? $"REQ-{DateTime.UtcNow:yyyy}-{Interlocked.Increment(ref _nextId):D3}",
            ServiceDescription = data.GetValueOrDefault("serviceDescription")?.ToString(),
            FinancialYear = data.GetValueOrDefault("financialYear")?.ToString(),
            SavedStatusId = data.TryGetValue("statusId", out var sid) && sid is int s ? s : 0,
            FinalApproved = data.TryGetValue("finalApproved", out var fa) && fa is bool b && b,
            Enabled = true,
            DateCaptured = DateTime.UtcNow,
            CapturerId = 1
        };

        if (data.TryGetValue("departmentId", out var did) && did != null)
            entity.DepartmentId = Convert.ToInt32(did);

        if (data.TryGetValue("lineItems", out var liObj) && liObj is object[] items)
        {
            foreach (var item in items)
            {
                if (item is Dictionary<string, object?> li)
                {
                    var detail = new RequisitionServiceDetail
                    {
                        ServiceDescription = li.GetValueOrDefault("description")?.ToString(),
                        Quantity = li.TryGetValue("quantity", out var qty) && qty != null ? Convert.ToDecimal(qty) : 1,
                        Uom = li.GetValueOrDefault("unitOfMeasure")?.ToString() ?? "each",
                        Enabled = true,
                        DateCaptured = DateTime.UtcNow,
                        CapturerId = 1
                    };
                    if (li.TryGetValue("estimatedUnitCost", out var euc) && euc is Dictionary<string, object?> eucd && eucd.TryGetValue("amount", out var eca))
                        detail.EstimatedCost = Convert.ToDecimal(eca);
                    else if (li.TryGetValue("estimatedUnitCost", out var euc2) && euc2 != null)
                        detail.EstimatedCost = Convert.ToDecimal(euc2);
                    entity.ServiceDetails.Add(detail);
                }
            }
        }

        return entity;
    }

    private void ApplyDictToEntity(Requisition entity, Dictionary<string, object?> data)
    {
        if (data.TryGetValue("serviceDescription", out var sd) && sd != null)
            entity.ServiceDescription = sd.ToString();
        if (data.TryGetValue("financialYear", out var fy) && fy != null)
            entity.FinancialYear = fy.ToString();
        if (data.TryGetValue("statusId", out var sid) && sid != null)
            entity.SavedStatusId = Convert.ToInt32(sid);
        if (data.TryGetValue("departmentId", out var did) && did != null)
            entity.DepartmentId = Convert.ToInt32(did);
        if (data.TryGetValue("finalApproved", out var fa) && fa is bool b)
            entity.FinalApproved = b;
    }

    private int CreateRequisitionRecord(Dictionary<string, object?> data)
    {
        var id = Interlocked.Increment(ref _nextId);
        data["id"] = id;
        if (!data.ContainsKey("requisitionNumber"))
            data["requisitionNumber"] = $"REQ-{DateTime.UtcNow:yyyy}-{id:D3}";
        data["referenceNumber"] = data["requisitionNumber"];
        if (!data.ContainsKey("captureDate"))
            data["captureDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd");
        if (!data.ContainsKey("enabled"))
            data["enabled"] = true;
        _requisitions[id] = data;
        return id;
    }

    private void SeedData()
    {
        CreateRequisitionRecord(new Dictionary<string, object?>
        {
            ["requisitionNumber"] = "REQ-2025-001",
            ["department"] = "Infrastructure Development",
            ["departmentId"] = 5,
            ["serviceDescription"] = "Road rehabilitation materials and equipment",
            ["status"] = "final_approved",
            ["statusId"] = 6,
            ["financialYear"] = "2025/26",
            ["totalEstimatedValue"] = new { amount = 8500000m, currency = "ZAR" },
            ["captureDate"] = "2025-02-20",
            ["requestedBy"] = "J. Molefe",
            ["supervisor"] = "S. Nkosi",
            ["hod"] = "T. Dlamini",
            ["voteNumber"] = "Vote 8",
            ["costCentre"] = "CC-INF-001",
            ["demandPlanRef"] = "DP-2025-001",
            ["priority"] = "High",
            ["procurementRoute"] = "Open Tender",
            ["finalApproved"] = true,
            ["lineItems"] = new object[]
            {
                new { id = "LI-001", description = "Bitumen supply", quantity = 500, unitOfMeasure = "tonnes", estimatedUnitCost = new { amount = 8500m, currency = "ZAR" }, totalCost = new { amount = 4250000m, currency = "ZAR" } },
                new { id = "LI-002", description = "Gravel and aggregate", quantity = 1200, unitOfMeasure = "cubic metres", estimatedUnitCost = new { amount = 850m, currency = "ZAR" }, totalCost = new { amount = 1020000m, currency = "ZAR" } },
                new { id = "LI-003", description = "Road marking paint", quantity = 200, unitOfMeasure = "litres", estimatedUnitCost = new { amount = 350m, currency = "ZAR" }, totalCost = new { amount = 70000m, currency = "ZAR" } }
            },
            ["auditTrail"] = new object[]
            {
                new { action = "Created", by = "J. Molefe", date = "2025-02-20", notes = "Created from demand plan DP-2025-001" },
                new { action = "Submitted", by = "J. Molefe", date = "2025-02-21", notes = "Submitted for supervisor review" },
                new { action = "Supervisor Approved", by = "S. Nkosi", date = "2025-02-24", notes = "Approved - within budget" },
                new { action = "HOD Approved", by = "T. Dlamini", date = "2025-02-26", notes = "Final approval granted" }
            }
        });

        CreateRequisitionRecord(new Dictionary<string, object?>
        {
            ["requisitionNumber"] = "REQ-2025-002",
            ["department"] = "Infrastructure Development",
            ["departmentId"] = 5,
            ["serviceDescription"] = "Water pipeline replacement components",
            ["status"] = "submitted",
            ["statusId"] = 2,
            ["financialYear"] = "2025/26",
            ["totalEstimatedValue"] = new { amount = 12800000m, currency = "ZAR" },
            ["captureDate"] = "2025-02-22",
            ["requestedBy"] = "J. Molefe",
            ["supervisor"] = "S. Nkosi",
            ["hod"] = "T. Dlamini",
            ["voteNumber"] = "Vote 8",
            ["costCentre"] = "CC-INF-002",
            ["demandPlanRef"] = "DP-2025-001",
            ["priority"] = "High",
            ["procurementRoute"] = "Open Tender",
            ["finalApproved"] = false,
            ["lineItems"] = new object[]
            {
                new { id = "LI-004", description = "HDPE pipes 200mm", quantity = 2000, unitOfMeasure = "metres", estimatedUnitCost = new { amount = 3200m, currency = "ZAR" }, totalCost = new { amount = 6400000m, currency = "ZAR" } },
                new { id = "LI-005", description = "Pipe fittings and valves", quantity = 150, unitOfMeasure = "sets", estimatedUnitCost = new { amount = 4500m, currency = "ZAR" }, totalCost = new { amount = 675000m, currency = "ZAR" } }
            },
            ["auditTrail"] = new object[]
            {
                new { action = "Created", by = "J. Molefe", date = "2025-02-22", notes = "Created from demand plan DP-2025-001" },
                new { action = "Submitted", by = "J. Molefe", date = "2025-02-23", notes = "Submitted for supervisor review" }
            }
        });

        CreateRequisitionRecord(new Dictionary<string, object?>
        {
            ["requisitionNumber"] = "REQ-2025-003",
            ["department"] = "Community Services",
            ["departmentId"] = 3,
            ["serviceDescription"] = "Community hall renovation services",
            ["status"] = "draft",
            ["statusId"] = 0,
            ["financialYear"] = "2025/26",
            ["totalEstimatedValue"] = new { amount = 3200000m, currency = "ZAR" },
            ["captureDate"] = "2025-03-01",
            ["requestedBy"] = "N. Khumalo",
            ["supervisor"] = "B. Zulu",
            ["hod"] = "M. Pillay",
            ["voteNumber"] = "Vote 5",
            ["costCentre"] = "CC-COM-001",
            ["demandPlanRef"] = "DP-2025-002",
            ["priority"] = "Medium",
            ["procurementRoute"] = "RFQ",
            ["finalApproved"] = false,
            ["lineItems"] = new object[]
            {
                new { id = "LI-006", description = "Building renovation works", quantity = 1, unitOfMeasure = "service", estimatedUnitCost = new { amount = 2500000m, currency = "ZAR" }, totalCost = new { amount = 2500000m, currency = "ZAR" } },
                new { id = "LI-007", description = "Electrical rewiring", quantity = 1, unitOfMeasure = "service", estimatedUnitCost = new { amount = 700000m, currency = "ZAR" }, totalCost = new { amount = 700000m, currency = "ZAR" } }
            },
            ["auditTrail"] = new object[]
            {
                new { action = "Created", by = "N. Khumalo", date = "2025-03-01", notes = "Created from demand plan DP-2025-002" }
            }
        });

        CreateRequisitionRecord(new Dictionary<string, object?>
        {
            ["requisitionNumber"] = "REQ-2026-104",
            ["department"] = "Infrastructure and Engineering",
            ["departmentId"] = 5,
            ["serviceDescription"] = "Computer procurement for Infrastructure and Engineering",
            ["status"] = "routed",
            ["statusId"] = 7,
            ["financialYear"] = "2025/26",
            ["totalEstimatedValue"] = new { amount = 1000m, currency = "ZAR" },
            ["captureDate"] = "2026-03-17",
            ["requestedBy"] = "Admin",
            ["supervisor"] = "S. Nkosi",
            ["hod"] = "T. Dlamini",
            ["voteNumber"] = "Vote 8",
            ["costCentre"] = "CC-INF-003",
            ["demandPlanRef"] = "",
            ["priority"] = "Medium",
            ["procurementRoute"] = "RFQ",
            ["finalApproved"] = true,
            ["lineItems"] = new object[]
            {
                new { id = "LI-104-1", description = "Desktop Computer", quantity = 5, unitOfMeasure = "each", estimatedUnitCost = new { amount = 12000m, currency = "ZAR" }, estimatedUnitPrice = 12000m, totalCost = new { amount = 60000m, currency = "ZAR" } }
            },
            ["auditTrail"] = new object[]
            {
                new { action = "Created", by = "Admin", date = "2026-03-17", notes = "Computer procurement request" },
                new { action = "Approved", by = "S. Nkosi", date = "2026-03-17", notes = "Approved" },
                new { action = "Routed", by = "T. Dlamini", date = "2026-03-17", notes = "Routed for quotation" }
            }
        });

        CreateRequisitionRecord(new Dictionary<string, object?>
        {
            ["requisitionNumber"] = "REQ-2026-105",
            ["department"] = "Community Services",
            ["departmentId"] = 3,
            ["serviceDescription"] = "Office furniture for Community Services department",
            ["status"] = "final_approved",
            ["statusId"] = 6,
            ["financialYear"] = "2025/26",
            ["totalEstimatedValue"] = new { amount = 85000m, currency = "ZAR" },
            ["captureDate"] = "2026-03-15",
            ["requestedBy"] = "N. Khumalo",
            ["supervisor"] = "B. Zulu",
            ["hod"] = "M. Pillay",
            ["voteNumber"] = "Vote 5",
            ["costCentre"] = "CC-COM-002",
            ["demandPlanRef"] = "DP-2026-001",
            ["priority"] = "Medium",
            ["procurementRoute"] = "RFQ",
            ["finalApproved"] = true,
            ["lineItems"] = new object[]
            {
                new { id = "LI-105-1", description = "Office desks", quantity = 10, unitOfMeasure = "each", estimatedUnitCost = new { amount = 4500m, currency = "ZAR" }, estimatedUnitPrice = 4500m, totalCost = new { amount = 45000m, currency = "ZAR" } },
                new { id = "LI-105-2", description = "Office chairs", quantity = 10, unitOfMeasure = "each", estimatedUnitCost = new { amount = 3500m, currency = "ZAR" }, estimatedUnitPrice = 3500m, totalCost = new { amount = 35000m, currency = "ZAR" } }
            },
            ["auditTrail"] = new object[]
            {
                new { action = "Created", by = "N. Khumalo", date = "2026-03-15", notes = "Office furniture procurement" },
                new { action = "Approved", by = "B. Zulu", date = "2026-03-15", notes = "Approved" },
                new { action = "Final Approved", by = "M. Pillay", date = "2026-03-16", notes = "Final approval granted" }
            }
        });

        CreateRequisitionRecord(new Dictionary<string, object?>
        {
            ["requisitionNumber"] = "REQ-2026-106",
            ["department"] = "Corporate Services",
            ["departmentId"] = 2,
            ["serviceDescription"] = "IT Network equipment upgrade",
            ["status"] = "final_approved",
            ["statusId"] = 6,
            ["financialYear"] = "2025/26",
            ["totalEstimatedValue"] = new { amount = 250000m, currency = "ZAR" },
            ["captureDate"] = "2026-03-10",
            ["requestedBy"] = "P. Govender",
            ["supervisor"] = "A. van der Merwe",
            ["hod"] = "L. Botha",
            ["voteNumber"] = "Vote 3",
            ["costCentre"] = "CC-COR-001",
            ["demandPlanRef"] = "DP-2026-002",
            ["priority"] = "High",
            ["procurementRoute"] = "RFQ",
            ["finalApproved"] = true,
            ["lineItems"] = new object[]
            {
                new { id = "LI-106-1", description = "Network switches", quantity = 5, unitOfMeasure = "each", estimatedUnitCost = new { amount = 25000m, currency = "ZAR" }, estimatedUnitPrice = 25000m, totalCost = new { amount = 125000m, currency = "ZAR" } },
                new { id = "LI-106-2", description = "Fibre optic cables", quantity = 500, unitOfMeasure = "metres", estimatedUnitCost = new { amount = 150m, currency = "ZAR" }, estimatedUnitPrice = 150m, totalCost = new { amount = 75000m, currency = "ZAR" } },
                new { id = "LI-106-3", description = "Server rack", quantity = 2, unitOfMeasure = "each", estimatedUnitCost = new { amount = 25000m, currency = "ZAR" }, estimatedUnitPrice = 25000m, totalCost = new { amount = 50000m, currency = "ZAR" } }
            },
            ["auditTrail"] = new object[]
            {
                new { action = "Created", by = "P. Govender", date = "2026-03-10", notes = "IT network upgrade request" },
                new { action = "Approved", by = "A. van der Merwe", date = "2026-03-11", notes = "Approved" },
                new { action = "Final Approved", by = "L. Botha", date = "2026-03-12", notes = "Final approval granted" }
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
