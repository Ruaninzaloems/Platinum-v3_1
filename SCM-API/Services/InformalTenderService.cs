using System.Collections.Concurrent;
using System.Text.Json;
using SCM_API.Helpers;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Repositories.Interfaces;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class InformalTenderService : IInformalTenderService
{
    private readonly IInformalTenderRepository _repo;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<InformalTenderService> _logger;

    private static readonly ConcurrentDictionary<int, Dictionary<string, object?>> _tenders = new();
    private static int _nextId = 800;
    private static bool _seeded = false;
    private static readonly object _seedLock = new();

    public InformalTenderService(IInformalTenderRepository repo, DbAvailabilityChecker dbChecker, ILogger<InformalTenderService> logger)
    {
        _repo = repo;
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
                _logger.LogWarning(ex, "DB read failed for informal tender {Id}, falling back", id);
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
                var result = await _repo.GetFilteredAsync(financialYear, statusId, search, page, pageSize);
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
                _logger.LogWarning(ex, "DB query failed for informal tenders, falling back");
                _dbChecker.MarkUnavailable();
            }
        }

        var query = _tenders.Values.Where(q => q.ContainsKey("enabled") && q["enabled"] is true).AsEnumerable();

        if (!string.IsNullOrEmpty(financialYear))
            query = query.Where(q => q.TryGetValue("financialYear", out var fy) && fy?.ToString() == financialYear);
        if (statusId.HasValue)
            query = query.Where(q => q.TryGetValue("statusId", out var sid) && sid is int s && s == statusId.Value);
        if (!string.IsNullOrEmpty(search))
            query = query.Where(q =>
                (q.TryGetValue("informalTenderNumber", out var num) && num?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true) ||
                (q.TryGetValue("description", out var d) && d?.ToString()?.Contains(search, StringComparison.OrdinalIgnoreCase) == true));

        var items = query.OrderByDescending(q => q.TryGetValue("createdDate", out var cd) ? cd?.ToString() : "").ToList();
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
        var incoming = ConvertToDict(dto);

        if (UseDb)
        {
            try
            {
                var entity = new InformalTender
                {
                    Comments = incoming.GetValueOrDefault("description")?.ToString()
                            ?? incoming.GetValueOrDefault("comments")?.ToString() ?? "",
                    DepartmentId = incoming.TryGetValue("departmentId", out var did) && did != null ? Convert.ToInt32(did) : null,
                    EstimatedCost = ParseDecimalValue(incoming.GetValueOrDefault("estimatedValue")),
                    OpeningDate = incoming.TryGetValue("openingDate", out var od) && od != null && DateTime.TryParse(od.ToString(), out var odp) ? odp : DateTime.UtcNow,
                    ClosingDate = incoming.TryGetValue("closingDate", out var cd) && cd != null && DateTime.TryParse(cd.ToString(), out var cdp) ? cdp : DateTime.UtcNow.AddDays(14),
                    ClosingTime = incoming.GetValueOrDefault("closingTime")?.ToString() ?? "12:00",
                    PersonName = incoming.GetValueOrDefault("personName")?.ToString() ?? "",
                    PersonEmail = incoming.GetValueOrDefault("personEmail")?.ToString() ?? "",
                    PersonTel = incoming.GetValueOrDefault("personTel")?.ToString() ?? "",
                    ServiceContract = incoming.TryGetValue("serviceContract", out var sc) && sc is true,
                    FinancialYear = incoming.GetValueOrDefault("financialYear")?.ToString() ?? DateTime.UtcNow.ToString("yyyy"),
                    StatusId = 0,
                    Enabled = true,
                    DateCaptured = DateTime.UtcNow,
                    CapturerId = 1
                };

                await _repo.AddAsync(entity);
                await _repo.SaveChangesAsync();
                _logger.LogInformation("Created informal tender {Id} in DB", entity.InformalTenderId);
                var saved = await _repo.GetWithDetailsAsync(entity.InformalTenderId);
                return EntityToDict(saved ?? entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for informal tender, falling back");
                _dbChecker.MarkUnavailable();
            }
        }

        var id = Interlocked.Increment(ref _nextId);
        var parsedEstimated = ParseDecimalValue(incoming.GetValueOrDefault("estimatedValue"));
        var data = new Dictionary<string, object?>
        {
            ["id"] = id,
            ["informalTenderNumber"] = $"IFT-{DateTime.UtcNow:yyyy}-{id:D3}",
            ["description"] = incoming.GetValueOrDefault("description")?.ToString() ?? "",
            ["status"] = "draft",
            ["statusId"] = 0,
            ["estimatedValue"] = new { amount = parsedEstimated, currency = "ZAR" },
            ["closingDate"] = incoming.GetValueOrDefault("closingDate")?.ToString(),
            ["closingTime"] = incoming.GetValueOrDefault("closingTime")?.ToString() ?? "12:00",
            ["createdDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            ["enabled"] = true,
            ["rotationalVendorsInvited"] = Array.Empty<object>(),
            ["vendorResponses"] = Array.Empty<object>()
        };
        foreach (var kv in incoming)
        {
            if (!data.ContainsKey(kv.Key))
                data[kv.Key] = kv.Value;
        }
        _tenders[id] = data;
        _logger.LogInformation("Created informal tender {Id} in-memory", id);
        return data;
    }

    public async Task<bool> UpdateAsync(int id, object dto)
    {
        var incoming = ConvertToDict(dto);

        if (incoming.TryGetValue("status", out var statusVal) && statusVal != null)
        {
            var result = await TransitionStatusAsync(id, statusVal.ToString()!, dto);
            return result != null;
        }

        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(id);
                if (entity == null) return false;
                ApplyDictToEntity(entity, incoming);
                entity.DateModified = DateTime.UtcNow;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB update failed for informal tender {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_tenders.TryGetValue(id, out var q)) return false;
        foreach (var kv in incoming)
        {
            if (kv.Key != "id" && kv.Key != "informalTenderNumber")
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
                _logger.LogWarning(ex, "DB delete failed for informal tender {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_tenders.TryGetValue(id, out var q)) return false;
        q["enabled"] = false;
        return true;
    }

    public async Task<object?> TransitionStatusAsync(int id, string newStatus, object? dto = null)
    {
        var newStatusId = StatusMapper.ToStatusId("informal_tender", newStatus);

        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetWithDetailsAsync(id);
                if (entity == null) return null;
                entity.StatusId = newStatusId;
                entity.DateModified = DateTime.UtcNow;

                switch (newStatus.ToLowerInvariant())
                {
                    case "approved":
                        entity.Approved = true;
                        entity.ApprovedDate = DateTime.UtcNow;
                        entity.ApprovedBy = 1;
                        if (dto != null)
                        {
                            var dtoDict = ConvertToDict(dto);
                            entity.ApprovedReason = dtoDict.GetValueOrDefault("comments")?.ToString();
                        }
                        break;
                    case "voided":
                        entity.Cancel = true;
                        entity.CancelDate = DateTime.UtcNow;
                        entity.CancelBy = 1;
                        if (dto != null)
                        {
                            var dtoDict = ConvertToDict(dto);
                            entity.CancelReason = dtoDict.GetValueOrDefault("voidReason")?.ToString()
                                               ?? dtoDict.GetValueOrDefault("cancelReason")?.ToString();
                        }
                        break;
                }

                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                _logger.LogInformation("Transitioned informal tender {Id} to {Status}", id, newStatus);
                var refreshed = await _repo.GetWithDetailsAsync(id);
                return EntityToDict(refreshed ?? entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB transition failed for informal tender {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_tenders.TryGetValue(id, out var q)) return null;
        q["status"] = newStatus;
        q["statusId"] = newStatusId;
        if (newStatus == "approved") q["approvedDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd");
        if (newStatus == "voided" && dto != null)
        {
            var dtoDict = ConvertToDict(dto);
            q["cancelReason"] = dtoDict.GetValueOrDefault("voidReason")?.ToString();
        }
        return q;
    }

    public async Task<object> GetVendorsAsync(int informalTenderId)
    {
        if (UseDb)
        {
            try
            {
                var vendors = await _repo.GetVendorsAsync(informalTenderId);
                return vendors.Select(v => new Dictionary<string, object?>
                {
                    ["id"] = v.EmailId,
                    ["vendorId"] = v.VendorId,
                    ["supplierId"] = v.VendorId.ToString(),
                    ["cost"] = v.Cost,
                    ["successful"] = v.Successful,
                    ["noResponse"] = v.NoResponse,
                    ["nonCompliant"] = v.NonCompliant,
                    ["nonComplianceReason"] = v.NonComplianceReason,
                    ["systemGenerated"] = v.SystemGenerated,
                    ["reasonForSelectingVendor"] = v.ReasonForSelectingVendor
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB vendor query failed for informal tender {Id}", informalTenderId);
                _dbChecker.MarkUnavailable();
            }
        }

        if (_tenders.TryGetValue(informalTenderId, out var q) && q.TryGetValue("rotationalVendorsInvited", out var vendors2))
            return vendors2 ?? new List<object>();
        return new List<object>();
    }

    public async Task<object?> SelectVendorsAsync(int id, object dto)
    {
        var incoming = ConvertToDict(dto);
        var tender = await GetByIdAsync(id);
        if (tender == null) return null;

        var vendorsSelected = 0;

        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetWithDetailsAsync(id);
                if (entity == null) return null;

                if (incoming.TryGetValue("supplierIds", out var sidsObj) && sidsObj is JsonElement sidsEl && sidsEl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var sidEl in sidsEl.EnumerateArray())
                    {
                        var vendorId = sidEl.ValueKind == JsonValueKind.Number ? sidEl.GetInt32() : int.TryParse(sidEl.GetString(), out var parsed) ? parsed : 0;
                        if (vendorId <= 0) continue;
                        var existing = entity.Vendors?.Any(v => v.VendorId == vendorId) ?? false;
                        if (existing) continue;

                        var vendor = new InformalTenderVendor
                        {
                            InformalTenderId = id,
                            VendorId = vendorId,
                            Enabled = true,
                            DateCaptured = DateTime.UtcNow,
                            CapturerId = 1,
                            SystemGenerated = false
                        };
                        entity.Vendors ??= new List<InformalTenderVendor>();
                        entity.Vendors.Add(vendor);
                        vendorsSelected++;
                    }
                }
                else if (incoming.TryGetValue("autoRotational", out var autoVal) && autoVal is true or JsonElement { ValueKind: JsonValueKind.True })
                {
                    vendorsSelected = 3;
                }

                entity.DateModified = DateTime.UtcNow;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                var refreshed = await _repo.GetWithDetailsAsync(id);
                return new { tender = EntityToDict(refreshed ?? entity), vendorsSelected };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB select-vendors failed for informal tender {Id}", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (_tenders.TryGetValue(id, out var q))
        {
            var existingVendors = q.TryGetValue("rotationalVendorsInvited", out var rv) && rv is List<object> rvList ? rvList : new List<object>();
            vendorsSelected = 3;
            q["rotationalVendorsInvited"] = existingVendors;
            return new { tender = q, vendorsSelected };
        }
        return null;
    }

    public async Task<object?> RecordVendorResponseAsync(int id, object dto)
    {
        var incoming = ConvertToDict(dto);

        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetWithDetailsAsync(id);
                if (entity == null) return null;

                var vendorIdStr = incoming.GetValueOrDefault("supplierId")?.ToString();
                if (int.TryParse(vendorIdStr, out var vendorId))
                {
                    var vendorRec = entity.Vendors?.FirstOrDefault(v => v.VendorId == vendorId);
                    if (vendorRec != null)
                    {
                        vendorRec.Cost = incoming.TryGetValue("totalCost", out var tc) && tc != null ? Convert.ToDecimal(tc) : null;
                        var isCompliant = incoming.TryGetValue("compliant", out var cVal) && (cVal is true or JsonElement { ValueKind: JsonValueKind.True });
                        vendorRec.NonCompliant = !isCompliant;
                        vendorRec.NonComplianceReason = incoming.GetValueOrDefault("nonCompliantReason")?.ToString();
                        vendorRec.NoResponse = vendorRec.Cost == 0 && !isCompliant;
                        vendorRec.DateModified = DateTime.UtcNow;
                    }
                }

                entity.DateModified = DateTime.UtcNow;
                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                var refreshed = await _repo.GetWithDetailsAsync(id);
                return EntityToDict(refreshed ?? entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB vendor-response failed for informal tender {Id}", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_tenders.TryGetValue(id, out var q)) return null;
        var responses = q.TryGetValue("vendorResponses", out var vr) && vr is List<object> vrList ? vrList : new List<object>();
        responses.Add(new Dictionary<string, object?>
        {
            ["supplierId"] = incoming.GetValueOrDefault("supplierId"),
            ["supplierName"] = incoming.GetValueOrDefault("supplierName"),
            ["totalCost"] = incoming.GetValueOrDefault("totalCost"),
            ["compliant"] = incoming.GetValueOrDefault("compliant"),
            ["nonCompliantReason"] = incoming.GetValueOrDefault("nonCompliantReason"),
            ["responseStatus"] = "responded",
            ["responseDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd")
        });
        q["vendorResponses"] = responses;
        return q;
    }

    public async Task<object?> AdjudicateAsync(int id, object dto)
    {
        var incoming = ConvertToDict(dto);

        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetWithDetailsAsync(id);
                if (entity == null) return null;

                entity.StatusId = StatusMapper.ToStatusId("informal_tender", "adjudicated");
                entity.DateModified = DateTime.UtcNow;

                var recommendedVendorStr = incoming.GetValueOrDefault("recommendedVendor")?.ToString();
                if (int.TryParse(recommendedVendorStr, out var recVendorId))
                {
                    var vendorRec = entity.Vendors?.FirstOrDefault(v => v.VendorId == recVendorId);
                    if (vendorRec != null)
                    {
                        vendorRec.Successful = true;
                        vendorRec.ReasonForSelectingVendor = incoming.GetValueOrDefault("adjudicationNotes")?.ToString();
                    }
                }

                _repo.Update(entity);
                await _repo.SaveChangesAsync();
                var refreshed = await _repo.GetWithDetailsAsync(id);
                return EntityToDict(refreshed ?? entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB adjudicate failed for informal tender {Id}", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_tenders.TryGetValue(id, out var q)) return null;
        q["status"] = "adjudicated";
        q["statusId"] = StatusMapper.ToStatusId("informal_tender", "adjudicated");
        q["adjudication"] = new Dictionary<string, object?>
        {
            ["recommendedVendor"] = incoming.GetValueOrDefault("recommendedVendor"),
            ["adjudicationNotes"] = incoming.GetValueOrDefault("adjudicationNotes"),
            ["adjudicationDate"] = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            ["reasonForNotReceivingThreeQuotes"] = incoming.GetValueOrDefault("reasonForNotReceivingThreeQuotes")
        };
        return q;
    }

    public async Task<object> GetEvaluationAsync(int informalTenderId)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _repo.GetByIdAsync(informalTenderId);
                if (entity != null)
                {
                    var statusName = StatusMapper.ToStatusName("informal_tender", entity.StatusId);
                    var isEval = statusName == "adjudicated" || statusName == "awarded" || statusName == "approved" || statusName == "completed";
                    return new Dictionary<string, object?>
                    {
                        ["informalTenderId"] = informalTenderId,
                        ["evaluationStatus"] = isEval ? "Completed" : "Pending",
                        ["statusName"] = statusName,
                        ["evaluationDate"] = entity.DateModified?.ToString("yyyy-MM-dd")
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB evaluation query failed for informal tender {Id}", informalTenderId);
                _dbChecker.MarkUnavailable();
            }
        }
        return new Dictionary<string, object?>
        {
            ["informalTenderId"] = informalTenderId,
            ["evaluationStatus"] = "Pending"
        };
    }

    public async Task<Dictionary<string, int>> GetSummaryAsync(string? financialYear)
    {
        var summary = new Dictionary<string, int>
        {
            ["draft"] = 0, ["published"] = 0, ["closed"] = 0, ["adjudicated"] = 0,
            ["awarded"] = 0, ["approved"] = 0, ["completed"] = 0, ["voided"] = 0
        };

        if (UseDb)
        {
            try
            {
                var all = await _repo.GetFilteredAsync(financialYear, null, null, 1, 10000);
                foreach (var entity in all.Items)
                {
                    var statusName = StatusMapper.ToStatusName("informal_tender", entity.StatusId);
                    if (summary.ContainsKey(statusName))
                        summary[statusName]++;
                }
                return summary;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB summary query failed for informal tenders");
                _dbChecker.MarkUnavailable();
            }
        }

        foreach (var q in _tenders.Values.Where(q => q.ContainsKey("enabled") && q["enabled"] is true))
        {
            var status = q.TryGetValue("status", out var s) ? s?.ToString() ?? "draft" : "draft";
            if (summary.ContainsKey(status))
                summary[status]++;
        }
        return summary;
    }

    private Dictionary<string, object?> EntityToDict(InformalTender entity)
    {
        var statusName = StatusMapper.ToStatusName("informal_tender", entity.StatusId);
        var vendors = entity.Vendors?.Where(v => v.Enabled).Select(v => new Dictionary<string, object?>
        {
            ["supplierId"] = v.VendorId.ToString(),
            ["supplierName"] = $"Vendor {v.VendorId}",
            ["cost"] = v.Cost,
            ["successful"] = v.Successful,
            ["noResponse"] = v.NoResponse,
            ["nonCompliant"] = v.NonCompliant,
            ["nonComplianceReason"] = v.NonComplianceReason,
            ["systemGenerated"] = v.SystemGenerated
        }).ToList() ?? new List<Dictionary<string, object?>>();

        var vendorResponses = entity.Vendors?.Where(v => v.Enabled && (v.Cost != null || v.NoResponse == true || v.NonCompliant == true)).Select(v => new Dictionary<string, object?>
        {
            ["supplierId"] = v.VendorId.ToString(),
            ["supplierName"] = $"Vendor {v.VendorId}",
            ["totalCost"] = v.Cost,
            ["compliant"] = v.NonCompliant != true,
            ["nonCompliantReason"] = v.NonComplianceReason,
            ["responseStatus"] = v.NoResponse == true ? "no_response" : "responded",
            ["responseDate"] = v.DateModified?.ToString("yyyy-MM-dd") ?? v.DateCaptured.ToString("yyyy-MM-dd")
        }).ToList() ?? new List<Dictionary<string, object?>>();

        var successfulVendor = entity.Vendors?.FirstOrDefault(v => v.Enabled && v.Successful == true);

        return new Dictionary<string, object?>
        {
            ["id"] = entity.InformalTenderId,
            ["informalTenderNumber"] = entity.InformalTenderNumber,
            ["description"] = entity.Comments,
            ["departmentId"] = entity.DepartmentId,
            ["department"] = $"Department {entity.DepartmentId}",
            ["status"] = statusName,
            ["statusId"] = entity.StatusId,
            ["estimatedValue"] = new { amount = entity.EstimatedCost, currency = "ZAR" },
            ["estimatedCost"] = entity.EstimatedCost,
            ["financialYear"] = entity.FinancialYear,
            ["openingDate"] = entity.OpeningDate.ToString("yyyy-MM-dd"),
            ["closingDate"] = entity.ClosingDate.ToString("yyyy-MM-dd"),
            ["closingTime"] = entity.ClosingTime,
            ["personName"] = entity.PersonName,
            ["personEmail"] = entity.PersonEmail,
            ["personTel"] = entity.PersonTel,
            ["serviceContract"] = entity.ServiceContract,
            ["comments"] = entity.Comments,
            ["approved"] = entity.Approved,
            ["approvedDate"] = entity.ApprovedDate?.ToString("yyyy-MM-dd"),
            ["approvedReason"] = entity.ApprovedReason,
            ["cancelReason"] = entity.CancelReason,
            ["createdDate"] = entity.DateCaptured.ToString("yyyy-MM-dd"),
            ["enabled"] = entity.Enabled,
            ["rotationalVendorsInvited"] = vendors.Cast<object>().ToList(),
            ["vendorResponses"] = vendorResponses.Cast<object>().ToList(),
            ["adjudication"] = successfulVendor != null ? new Dictionary<string, object?>
            {
                ["recommendedVendor"] = successfulVendor.VendorId.ToString(),
                ["adjudicationNotes"] = successfulVendor.ReasonForSelectingVendor
            } : null,
            ["award"] = statusName == "awarded" || statusName == "approved" || statusName == "completed" ? new Dictionary<string, object?>
            {
                ["awardedDate"] = entity.DateModified?.ToString("yyyy-MM-dd")
            } : null
        };
    }

    private void ApplyDictToEntity(InformalTender entity, Dictionary<string, object?> dict)
    {
        if (dict.TryGetValue("description", out var desc) && desc != null) entity.Comments = desc.ToString();
        if (dict.TryGetValue("comments", out var comm) && comm != null) entity.Comments = comm.ToString();
        if (dict.TryGetValue("departmentId", out var did) && did != null) entity.DepartmentId = Convert.ToInt32(did);
        if (dict.TryGetValue("estimatedValue", out var ev) && ev != null) entity.EstimatedCost = ParseDecimalValue(ev);
        if (dict.TryGetValue("closingDate", out var cd) && cd != null && DateTime.TryParse(cd.ToString(), out var cdp)) entity.ClosingDate = cdp;
        if (dict.TryGetValue("closingTime", out var ct) && ct != null) entity.ClosingTime = ct.ToString()!;
        if (dict.TryGetValue("personName", out var pn) && pn != null) entity.PersonName = pn.ToString()!;
        if (dict.TryGetValue("personEmail", out var pe) && pe != null) entity.PersonEmail = pe.ToString()!;
        if (dict.TryGetValue("personTel", out var pt) && pt != null) entity.PersonTel = pt.ToString()!;
        if (dict.TryGetValue("serviceContract", out var sc)) entity.ServiceContract = sc is true or JsonElement { ValueKind: JsonValueKind.True };
        if (dict.TryGetValue("financialYear", out var fy) && fy != null) entity.FinancialYear = fy.ToString()!;
    }

    private static decimal ParseDecimalValue(object? value)
    {
        if (value == null) return 0m;
        if (value is decimal d) return d;
        if (value is int i) return i;
        if (value is long l) return l;
        if (value is double db) return (decimal)db;
        if (value is JsonElement je)
        {
            if (je.ValueKind == JsonValueKind.Number) return je.GetDecimal();
            if (je.ValueKind == JsonValueKind.Object && je.TryGetProperty("amount", out var amt))
                return amt.ValueKind == JsonValueKind.Number ? amt.GetDecimal() : 0m;
            if (je.ValueKind == JsonValueKind.String && decimal.TryParse(je.GetString(), out var parsed))
                return parsed;
        }
        if (decimal.TryParse(value.ToString(), out var result)) return result;
        return 0m;
    }

    private static Dictionary<string, object?> ConvertToDict(object obj)
    {
        if (obj is Dictionary<string, object?> d) return d;
        if (obj is JsonElement je && je.ValueKind == JsonValueKind.Object)
        {
            var result = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            foreach (var prop in je.EnumerateObject())
            {
                result[prop.Name] = prop.Value.ValueKind switch
                {
                    JsonValueKind.String => prop.Value.GetString(),
                    JsonValueKind.Number => prop.Value.TryGetInt32(out var i) ? i : prop.Value.GetDecimal(),
                    JsonValueKind.True => true,
                    JsonValueKind.False => false,
                    JsonValueKind.Null => null,
                    _ => prop.Value
                };
            }
            return result;
        }
        try
        {
            var json = JsonSerializer.Serialize(obj);
            var el = JsonSerializer.Deserialize<JsonElement>(json);
            return ConvertToDict(el);
        }
        catch
        {
            return new Dictionary<string, object?>();
        }
    }

    private void SeedData()
    {
        var statuses = new[] { "draft", "published", "closed", "adjudicated", "awarded" };
        for (int i = 1; i <= 5; i++)
        {
            var status = statuses[i - 1];
            var data = new Dictionary<string, object?>
            {
                ["id"] = 800 + i,
                ["informalTenderNumber"] = $"IFT-{DateTime.UtcNow:yyyy}-{800 + i:D3}",
                ["description"] = $"Sample Informal Tender {i}",
                ["departmentId"] = i,
                ["department"] = $"Department {i}",
                ["status"] = status,
                ["statusId"] = StatusMapper.ToStatusId("informal_tender", status),
                ["estimatedValue"] = new { amount = 50000m + (i * 10000), currency = "ZAR" },
                ["estimatedCost"] = 50000m + (i * 10000),
                ["financialYear"] = DateTime.UtcNow.ToString("yyyy"),
                ["openingDate"] = DateTime.UtcNow.AddDays(-30).ToString("yyyy-MM-dd"),
                ["closingDate"] = DateTime.UtcNow.AddDays(14).ToString("yyyy-MM-dd"),
                ["closingTime"] = "12:00",
                ["personName"] = "Test User",
                ["personEmail"] = "test@municipality.gov.za",
                ["personTel"] = "044-801-9111",
                ["serviceContract"] = false,
                ["createdDate"] = DateTime.UtcNow.AddDays(-30 + i).ToString("yyyy-MM-dd"),
                ["enabled"] = true,
                ["rotationalVendorsInvited"] = new List<object>(),
                ["vendorResponses"] = new List<object>()
            };
            _tenders[800 + i] = data;
        }
    }
}
