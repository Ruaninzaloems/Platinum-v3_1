using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SCM_API.Data;
using SCM_API.Helpers;
using SCM_API.Models.Domain;
using SCM_API.Services.Interfaces;
using System.Collections.Concurrent;

namespace SCM_API.Services;

public class ScmConfigService : IScmConfigService
{
    private readonly ApplicationDbContext _context;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<ScmConfigService> _logger;

    private static readonly ConcurrentDictionary<string, object> _inMemoryBoundaries = new();
    private static readonly ConcurrentDictionary<string, object> _inMemoryThresholds = new();
    private static readonly ConcurrentDictionary<string, object> _inMemoryMethods = new();
    private static object _inMemoryAntiSplit = GetDefaultAntiSplit();
    private static bool _seedInitialized = false;
    private static readonly object _seedLock = new();

    public ScmConfigService(ApplicationDbContext context, DbAvailabilityChecker dbChecker, ILogger<ScmConfigService> logger)
    {
        _context = context;
        _dbChecker = dbChecker;
        _logger = logger;
        EnsureSeedData();
    }

    private static void EnsureSeedData()
    {
        lock (_seedLock)
        {
            if (_seedInitialized) return;
            _seedInitialized = true;

            var defaultBoundaries = new List<object>
            {
                new { id = "PB001", method = "petty_cash", label = "Petty Cash", rangeFrom = 0m, rangeTo = (decimal?)2000m, minQuotes = 0, scoring = (string?)null, advertDays = 0, committees = false, enabled = true, description = "Low-value purchases up to R2,000", vatInclusive = true, categoryOverrides = new { } },
                new { id = "PB002", method = "informal_quotation", label = "Informal Written Quotation", rangeFrom = 2001m, rangeTo = (decimal?)30000m, minQuotes = 3, scoring = (string?)null, advertDays = 0, committees = false, enabled = true, description = "Informal quotation process R2,001 – R30,000", vatInclusive = true, categoryOverrides = new { } },
                new { id = "PB003", method = "formal_quotation", label = "Formal Written Quotation", rangeFrom = 30001m, rangeTo = (decimal?)200000m, minQuotes = 3, scoring = (string?)"80/20", advertDays = 7, committees = false, enabled = true, description = "Formal quotation process R30,001 – R200,000", vatInclusive = true, categoryOverrides = new { } },
                new { id = "PB004", method = "competitive_bid", label = "Competitive Bidding", rangeFrom = 200001m, rangeTo = (decimal?)null, minQuotes = 0, scoring = (string?)"90/10", advertDays = 21, committees = true, enabled = true, description = "Competitive bidding process above R200,000", vatInclusive = true, categoryOverrides = new { } }
            };
            foreach (var b in defaultBoundaries)
            {
                var prop = b.GetType().GetProperty("id");
                _inMemoryBoundaries[prop!.GetValue(b)!.ToString()!] = b;
            }

            var defaultThresholds = new List<object>
            {
                new { id = "PPT001", maxValue = (decimal?)50000000m, system = "80/20", priceWeight = 80, bbbeeWeight = 20, description = "80/20 preference point system for transactions up to R50 million" },
                new { id = "PPT002", maxValue = (decimal?)null, system = "90/10", priceWeight = 90, bbbeeWeight = 10, description = "90/10 preference point system for transactions above R50 million" }
            };
            foreach (var t in defaultThresholds)
            {
                var prop = t.GetType().GetProperty("id");
                _inMemoryThresholds[prop!.GetValue(t)!.ToString()!] = t;
            }

            var defaultMethods = new List<object>
            {
                new { id = "SM001", method = "deviation", label = "Deviation", enabled = true, requiresMotivation = true, requiresAOApproval = true, requiresCouncilReport = false, reasons = new List<string> { "impractical_to_follow", "sole_provider", "emergency", "price_advantage" }, description = "Procurement through deviation from normal SCM processes" },
                new { id = "SM002", method = "emergency", label = "Emergency Procurement", enabled = true, requiresMotivation = true, requiresAOApproval = true, requiresCouncilReport = true, reasons = new List<string> { "natural_disaster", "public_health", "infrastructure_failure", "service_delivery_crisis" }, description = "Emergency procurement under MFMA Section 36" },
                new { id = "SM003", method = "sole_supplier", label = "Sole Supplier", enabled = true, requiresMotivation = true, requiresAOApproval = true, requiresCouncilReport = false, reasons = new List<string> { "patent_rights", "sole_distributor", "specialized_service" }, description = "Sole supplier / single source procurement" },
                new { id = "SM004", method = "transversal_contract", label = "Transversal Contract", enabled = true, requiresMotivation = false, requiresAOApproval = false, requiresCouncilReport = false, reasons = new List<string>(), description = "Procurement through National/Provincial transversal contracts" }
            };
            foreach (var m in defaultMethods)
            {
                var prop = m.GetType().GetProperty("id");
                _inMemoryMethods[prop!.GetValue(m)!.ToString()!] = m;
            }
        }
    }

    public async Task<object> GetConfigAsync()
    {
        try
        {
            var boundaries = await _context.ProcessBoundaries
                .OrderBy(b => b.RangeFrom)
                .ToListAsync();

            var thresholds = await _context.ScmPreferencePointThresholds
                .OrderBy(t => t.Minimum)
                .ToListAsync();

            var deviationMotivations = await _context.ScmDeviationMotivations
                .Where(m => m.Enabled == true)
                .ToListAsync();

            var deviationApprovals = await _context.ScmDeviationApprovals
                .Where(a => a.Enabled == true)
                .ToListAsync();

            var serviceTypes = await _context.ScmServiceTypes
                .Where(s => s.Enabled)
                .ToListAsync();

            var processBoundaryDtos = boundaries.Select(b => new
            {
                id = $"PB{b.ProcessBoundaryId:D3}",
                method = b.Method ?? "",
                label = b.Label ?? "",
                rangeFrom = b.RangeFrom ?? 0m,
                rangeTo = b.RangeTo,
                minQuotes = b.MinQuotes ?? 0,
                scoring = b.Scoring,
                advertDays = b.AdvertDays ?? 0,
                committees = string.Equals(b.Committees, "true", StringComparison.OrdinalIgnoreCase) || string.Equals(b.Committees, "1", StringComparison.OrdinalIgnoreCase),
                enabled = b.Enabled ?? true,
                description = b.Description ?? "",
                vatInclusive = b.VatInclusive ?? true,
                categoryOverrides = new { }
            }).ToList();

            var preferencePointDtos = thresholds.Select(t => new
            {
                id = $"PPT{t.PreferenceId:D3}",
                maxValue = t.Maximum > 0 ? (decimal?)t.Maximum : null,
                system = $"{t.PricePercent}/{t.BeePercent}",
                priceWeight = t.PricePercent,
                bbbeeWeight = t.BeePercent,
                description = t.EvalMethodName
            }).ToList();

            var deviationReasons = deviationMotivations
                .Select(m => m.MotivationId ?? m.Motivation)
                .ToList();

            var specialMethodDtos = new List<object>
            {
                new { id = "SM001", method = "deviation", label = "Deviation", enabled = deviationMotivations.Any(), requiresMotivation = true, requiresAOApproval = deviationApprovals.Any(), requiresCouncilReport = false, reasons = deviationReasons, description = "Procurement through deviation from normal SCM processes" },
                new { id = "SM002", method = "emergency", label = "Emergency Procurement", enabled = true, requiresMotivation = true, requiresAOApproval = true, requiresCouncilReport = true, reasons = new List<string> { "natural_disaster", "public_health", "infrastructure_failure", "service_delivery_crisis" }, description = "Emergency procurement under MFMA Section 36" },
                new { id = "SM003", method = "sole_supplier", label = "Sole Supplier", enabled = true, requiresMotivation = true, requiresAOApproval = true, requiresCouncilReport = false, reasons = new List<string> { "patent_rights", "sole_distributor", "specialized_service" }, description = "Sole supplier / single source procurement" },
                new { id = "SM004", method = "transversal_contract", label = "Transversal Contract", enabled = true, requiresMotivation = false, requiresAOApproval = false, requiresCouncilReport = false, reasons = new List<string>(), description = "Procurement through National/Provincial transversal contracts" }
            };

            List<object> categoryDtos;
            if (serviceTypes.Any())
            {
                categoryDtos = serviceTypes.Select(st => (object)new
                {
                    id = st.ServiceType?.ToLower().Replace(" ", "_") ?? $"cat_{st.ServiceTypeId}",
                    label = st.ServiceType ?? "",
                    description = $"Procurement of {st.ServiceType?.ToLower() ?? "items"}"
                }).ToList();
            }
            else
            {
                categoryDtos = GetDefaultCategories();
            }

            return BuildConfigResponse(processBoundaryDtos, preferencePointDtos, specialMethodDtos, categoryDtos);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB unavailable for SCM config, using in-memory fallback");
            _dbChecker.MarkUnavailable();
            return BuildConfigResponse(
                _inMemoryBoundaries.Values.ToList(),
                _inMemoryThresholds.Values.ToList(),
                _inMemoryMethods.Values.ToList(),
                GetDefaultCategories()
            );
        }
    }

    public async Task<object> UpdateBoundariesAsync(List<dynamic> boundaries)
    {
        try
        {
            var existing = await _context.ProcessBoundaries.ToListAsync();

            foreach (var dto in boundaries)
            {
                string idStr = dto.id?.ToString() ?? "";
                string numPart = idStr.Replace("PB", "");
                if (int.TryParse(numPart, out int pbId))
                {
                    var entity = existing.FirstOrDefault(e => e.ProcessBoundaryId == pbId);
                    if (entity != null)
                    {
                        entity.Method = dto.method?.ToString();
                        entity.Label = dto.label?.ToString();
                        entity.RangeFrom = Convert.ToDecimal(dto.rangeFrom ?? 0);
                        entity.RangeTo = dto.rangeTo != null ? Convert.ToDecimal(dto.rangeTo) : null;
                        entity.MinQuotes = dto.minQuotes != null ? Convert.ToInt32(dto.minQuotes) : 0;
                        entity.Scoring = dto.scoring?.ToString();
                        entity.AdvertDays = dto.advertDays != null ? Convert.ToInt32(dto.advertDays) : 0;
                        bool committees = false;
                        if (dto.committees is bool cb) committees = cb;
                        entity.Committees = committees ? "true" : "false";
                        entity.Enabled = dto.enabled is bool eb ? eb : true;
                        entity.Description = dto.description?.ToString();
                        bool vatInclusive = true;
                        if (dto.vatInclusive is bool vb) vatInclusive = vb;
                        entity.VatInclusive = vatInclusive;
                    }
                }
                else
                {
                    var newEntity = new ProcessBoundary
                    {
                        Method = dto.method?.ToString(),
                        Label = dto.label?.ToString(),
                        RangeFrom = Convert.ToDecimal(dto.rangeFrom ?? 0),
                        RangeTo = dto.rangeTo != null ? Convert.ToDecimal(dto.rangeTo) : null,
                        MinQuotes = dto.minQuotes != null ? Convert.ToInt32(dto.minQuotes) : 0,
                        Scoring = dto.scoring?.ToString(),
                        AdvertDays = dto.advertDays != null ? Convert.ToInt32(dto.advertDays) : 0,
                        Committees = (dto.committees is bool cb2 && cb2) ? "true" : "false",
                        Enabled = dto.enabled is bool eb2 ? eb2 : true,
                        Description = dto.description?.ToString(),
                        VatInclusive = dto.vatInclusive is bool vb2 ? vb2 : true,
                        DateCaptured = DateTime.UtcNow,
                        CapturerId = 1
                    };
                    _context.ProcessBoundaries.Add(newEntity);
                }
            }

            await _context.SaveChangesAsync();

            var updatedBoundaries = await _context.ProcessBoundaries
                .OrderBy(b => b.RangeFrom)
                .ToListAsync();

            var result = updatedBoundaries.Select(b => new
            {
                id = $"PB{b.ProcessBoundaryId:D3}",
                method = b.Method ?? "",
                label = b.Label ?? "",
                rangeFrom = b.RangeFrom ?? 0m,
                rangeTo = b.RangeTo,
                minQuotes = b.MinQuotes ?? 0,
                scoring = b.Scoring,
                advertDays = b.AdvertDays ?? 0,
                committees = string.Equals(b.Committees, "true", StringComparison.OrdinalIgnoreCase),
                enabled = b.Enabled ?? true,
                description = b.Description ?? "",
                vatInclusive = b.VatInclusive ?? true,
                categoryOverrides = new { }
            }).ToList();

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB unavailable for boundary update, using in-memory fallback");
            _dbChecker.MarkUnavailable();

            _inMemoryBoundaries.Clear();
            int idx = 1;
            foreach (var dto in boundaries)
            {
                string id = dto.id?.ToString() ?? $"PB{idx:D3}";
                var entry = new
                {
                    id,
                    method = dto.method?.ToString() ?? "",
                    label = dto.label?.ToString() ?? "",
                    rangeFrom = dto.rangeFrom != null ? Convert.ToDecimal(dto.rangeFrom) : 0m,
                    rangeTo = dto.rangeTo != null ? (decimal?)Convert.ToDecimal(dto.rangeTo) : null,
                    minQuotes = dto.minQuotes != null ? Convert.ToInt32(dto.minQuotes) : 0,
                    scoring = dto.scoring?.ToString(),
                    advertDays = dto.advertDays != null ? Convert.ToInt32(dto.advertDays) : 0,
                    committees = dto.committees is bool cb && cb,
                    enabled = dto.enabled is bool eb ? eb : true,
                    description = dto.description?.ToString() ?? "",
                    vatInclusive = dto.vatInclusive is bool vb ? vb : true,
                    categoryOverrides = new { }
                };
                _inMemoryBoundaries[id] = entry;
                idx++;
            }

            return _inMemoryBoundaries.Values.ToList();
        }
    }

    public async Task<object> UpdatePreferencePointsAsync(List<dynamic> thresholds)
    {
        try
        {
            var existing = await _context.ScmPreferencePointThresholds.ToListAsync();

            foreach (var dto in thresholds)
            {
                string idStr = dto.id?.ToString() ?? "";
                string numPart = idStr.Replace("PPT", "");

                string system = dto.system?.ToString() ?? "80/20";
                var parts = system.Split('/');
                int pricePercent = parts.Length > 0 && int.TryParse(parts[0], out int pp) ? pp : 80;
                int beePercent = parts.Length > 1 && int.TryParse(parts[1], out int bp) ? bp : 20;

                if (int.TryParse(numPart, out int pptId))
                {
                    var entity = existing.FirstOrDefault(e => e.PreferenceId == pptId);
                    if (entity != null)
                    {
                        entity.Maximum = dto.maxValue != null ? Convert.ToDecimal(dto.maxValue) : 0;
                        entity.PricePercent = pricePercent;
                        entity.BeePercent = beePercent;
                        entity.EvalMethodName = dto.description?.ToString() ?? entity.EvalMethodName;
                        entity.DateModified = DateTime.UtcNow;
                    }
                }
                else
                {
                    int nextId = existing.Any() ? existing.Max(e => e.PreferenceId) + 1 : 1;
                    var newEntity = new ScmPreferencePointThreshold
                    {
                        PreferenceId = nextId,
                        EvalMethodName = dto.description?.ToString() ?? $"{pricePercent}/{beePercent} System",
                        Minimum = 0,
                        Maximum = dto.maxValue != null ? Convert.ToDecimal(dto.maxValue) : 0,
                        PricePercent = pricePercent,
                        BeePercent = beePercent,
                        Enabled = true,
                        DateCaptured = DateTime.UtcNow,
                        CaptureId = 1
                    };
                    _context.ScmPreferencePointThresholds.Add(newEntity);
                    existing.Add(newEntity);
                }
            }

            await _context.SaveChangesAsync();

            var updated = await _context.ScmPreferencePointThresholds
                .OrderBy(t => t.Minimum)
                .ToListAsync();

            return updated.Select(t => new
            {
                id = $"PPT{t.PreferenceId:D3}",
                maxValue = t.Maximum > 0 ? (decimal?)t.Maximum : null,
                system = $"{t.PricePercent}/{t.BeePercent}",
                priceWeight = t.PricePercent,
                bbbeeWeight = t.BeePercent,
                description = t.EvalMethodName
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB unavailable for preference point update, using in-memory fallback");
            _dbChecker.MarkUnavailable();

            _inMemoryThresholds.Clear();
            int idx = 1;
            foreach (var dto in thresholds)
            {
                string id = dto.id?.ToString() ?? $"PPT{idx:D3}";
                var entry = new
                {
                    id,
                    maxValue = dto.maxValue != null ? (decimal?)Convert.ToDecimal(dto.maxValue) : null,
                    system = dto.system?.ToString() ?? "80/20",
                    priceWeight = dto.priceWeight != null ? Convert.ToInt32(dto.priceWeight) : 80,
                    bbbeeWeight = dto.bbbeeWeight != null ? Convert.ToInt32(dto.bbbeeWeight) : 20,
                    description = dto.description?.ToString() ?? ""
                };
                _inMemoryThresholds[id] = entry;
                idx++;
            }

            return _inMemoryThresholds.Values.ToList();
        }
    }

    public async Task<object> UpdateSpecialMethodsAsync(List<dynamic> methods)
    {
        try
        {
            var motivations = await _context.ScmDeviationMotivations
                .Where(m => m.Enabled == true)
                .ToListAsync();

            var approvals = await _context.ScmDeviationApprovals
                .Where(a => a.Enabled == true)
                .ToListAsync();

            var result = new List<object>();
            foreach (var dto in methods)
            {
                string methodKey = dto.method?.ToString() ?? "";
                if (methodKey == "deviation")
                {
                    result.Add(new
                    {
                        id = dto.id?.ToString() ?? "SM001",
                        method = "deviation",
                        label = dto.label?.ToString() ?? "Deviation",
                        enabled = dto.enabled is bool e ? e : motivations.Any(),
                        requiresMotivation = dto.requiresMotivation is bool rm ? rm : true,
                        requiresAOApproval = dto.requiresAOApproval is bool ra ? ra : approvals.Any(),
                        requiresCouncilReport = dto.requiresCouncilReport is bool rc ? rc : false,
                        reasons = motivations.Select(m => m.MotivationId ?? m.Motivation).ToList(),
                        description = dto.description?.ToString() ?? "Procurement through deviation from normal SCM processes"
                    });
                }
                else
                {
                    result.Add(dto);
                }
            }
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB unavailable for special methods update, using in-memory fallback");
            _dbChecker.MarkUnavailable();

            _inMemoryMethods.Clear();
            foreach (var dto in methods)
            {
                string id = dto.id?.ToString() ?? $"SM{_inMemoryMethods.Count + 1:D3}";
                _inMemoryMethods[id] = dto;
            }
            return _inMemoryMethods.Values.ToList();
        }
    }

    public async Task<object?> GetProcurementRouteAsync(decimal value)
    {
        var boundaries = await GetBoundaryListAsync();
        foreach (var b in boundaries)
        {
            var from = GetDecProp(b, "rangeFrom");
            var to = GetNullableDecProp(b, "rangeTo");
            var enabled = GetBoolProp(b, "enabled", true);
            if (!enabled) continue;
            if (value >= from && (to == null || value <= to))
                return b;
        }
        return null;
    }

    public async Task<object> GetProcessBoundariesAsync()
    {
        return await GetBoundaryListAsync();
    }

    public async Task<object> ValidateRouteAsync(decimal value, string method)
    {
        var matchedBoundary = await GetProcurementRouteAsync(value);
        if (matchedBoundary == null)
        {
            return new
            {
                valid = false,
                warning = $"No process boundary found for value R{value:N2}",
                suggestedMethod = (string?)null,
                matchedBoundary = (object?)null
            };
        }

        var matchedMethod = GetStrProp(matchedBoundary, "method");
        var isValid = string.Equals(matchedMethod, method, StringComparison.OrdinalIgnoreCase);

        return new
        {
            valid = isValid,
            warning = isValid ? (string?)null : $"Value R{value:N2} requires '{GetStrProp(matchedBoundary, "label")}' but '{method}' was selected",
            suggestedMethod = matchedMethod,
            matchedBoundary
        };
    }

    private async Task<List<object>> GetBoundaryListAsync()
    {
        try
        {
            var boundaries = await _context.ProcessBoundaries
                .Where(b => b.Enabled == true)
                .OrderBy(b => b.RangeFrom)
                .ToListAsync();

            if (boundaries.Any())
            {
                return boundaries.Select(b => (object)new Dictionary<string, object?>
                {
                    ["id"] = $"PB{b.ProcessBoundaryId:D3}",
                    ["method"] = b.Method ?? "",
                    ["label"] = b.Label ?? "",
                    ["rangeFrom"] = b.RangeFrom ?? 0m,
                    ["rangeTo"] = b.RangeTo,
                    ["minQuotes"] = b.MinQuotes ?? 0,
                    ["scoring"] = b.Scoring,
                    ["advertDays"] = b.AdvertDays ?? 0,
                    ["committees"] = string.Equals(b.Committees, "true", StringComparison.OrdinalIgnoreCase),
                    ["enabled"] = b.Enabled ?? true,
                    ["description"] = b.Description ?? "",
                    ["vatInclusive"] = b.VatInclusive ?? true
                }).ToList();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB unavailable for boundary list, falling back");
            _dbChecker.MarkUnavailable();
        }

        return _inMemoryBoundaries.Values.Select(b =>
        {
            var t = b.GetType();
            return (object)new Dictionary<string, object?>
            {
                ["id"] = t.GetProperty("id")?.GetValue(b)?.ToString(),
                ["method"] = t.GetProperty("method")?.GetValue(b)?.ToString() ?? "",
                ["label"] = t.GetProperty("label")?.GetValue(b)?.ToString() ?? "",
                ["rangeFrom"] = t.GetProperty("rangeFrom")?.GetValue(b) is decimal rf ? rf : 0m,
                ["rangeTo"] = t.GetProperty("rangeTo")?.GetValue(b) as decimal?,
                ["minQuotes"] = t.GetProperty("minQuotes")?.GetValue(b) is int mq ? mq : 0,
                ["scoring"] = t.GetProperty("scoring")?.GetValue(b)?.ToString(),
                ["advertDays"] = t.GetProperty("advertDays")?.GetValue(b) is int ad ? ad : 0,
                ["committees"] = t.GetProperty("committees")?.GetValue(b) is bool c && c,
                ["enabled"] = t.GetProperty("enabled")?.GetValue(b) is bool e ? e : true,
                ["description"] = t.GetProperty("description")?.GetValue(b)?.ToString() ?? "",
                ["vatInclusive"] = t.GetProperty("vatInclusive")?.GetValue(b) is bool v ? v : true
            };
        }).Where(d => d is Dictionary<string, object?> dict && dict.TryGetValue("enabled", out var en) && en is bool eb && eb).ToList();
    }

    private static decimal GetDecProp(object obj, string name)
    {
        if (obj is Dictionary<string, object?> dict && dict.TryGetValue(name, out var v))
        {
            if (v is decimal d) return d;
            if (v != null) try { return Convert.ToDecimal(v); } catch { }
        }
        var prop = obj.GetType().GetProperty(name);
        if (prop != null)
        {
            var val = prop.GetValue(obj);
            if (val is decimal dec) return dec;
            if (val != null) try { return Convert.ToDecimal(val); } catch { }
        }
        return 0m;
    }

    private static decimal? GetNullableDecProp(object obj, string name)
    {
        if (obj is Dictionary<string, object?> dict && dict.TryGetValue(name, out var v))
        {
            if (v == null) return null;
            if (v is decimal d) return d;
            try { return Convert.ToDecimal(v); } catch { return null; }
        }
        var prop = obj.GetType().GetProperty(name);
        if (prop != null)
        {
            var val = prop.GetValue(obj);
            if (val == null) return null;
            if (val is decimal dec) return dec;
            try { return Convert.ToDecimal(val); } catch { return null; }
        }
        return null;
    }

    private static bool GetBoolProp(object obj, string name, bool fallback = false)
    {
        if (obj is Dictionary<string, object?> dict && dict.TryGetValue(name, out var v) && v is bool b)
            return b;
        var prop = obj.GetType().GetProperty(name);
        if (prop != null && prop.GetValue(obj) is bool bv) return bv;
        return fallback;
    }

    private static string GetStrProp(object obj, string name)
    {
        if (obj is Dictionary<string, object?> dict && dict.TryGetValue(name, out var v))
            return v?.ToString() ?? "";
        var prop = obj.GetType().GetProperty(name);
        return prop?.GetValue(obj)?.ToString() ?? "";
    }

    public async Task<object> GetAntiSplitSettingsAsync()
    {
        await Task.CompletedTask;
        return _inMemoryAntiSplit;
    }

    public async Task<object> UpdateAntiSplitAsync(dynamic settings)
    {
        await Task.CompletedTask;
        _inMemoryAntiSplit = settings;
        return settings;
    }

    private static object BuildConfigResponse(object processBoundaries, object preferencePoints, object specialMethods, object categories)
    {
        return new
        {
            version = "MFMA SCM 2024.1",
            lastModified = DateTime.UtcNow.ToString("o"),
            applicableTo = "All Municipal Entities",
            processBoundaries,
            preferencePointThresholds = preferencePoints,
            specialMethods,
            antiSplitDetection = GetDefaultAntiSplit(),
            categories,
            legislativeReference = new
            {
                act = "MFMA No. 56 of 2003",
                regulations = "SCM Regulations (GN 868 of 2005)",
                pppfa = "PPPFA No. 5 of 2000 (as amended 2022)",
                note = "All procurement thresholds and preference point systems are configured in accordance with the Municipal Finance Management Act and its regulations."
            }
        };
    }

    private static List<object> GetDefaultCategories()
    {
        return new List<object>
        {
            new { id = "goods", label = "Goods", description = "Procurement of physical goods and materials" },
            new { id = "services", label = "Services", description = "Procurement of professional and general services" },
            new { id = "construction", label = "Construction", description = "Procurement of construction and infrastructure works" },
            new { id = "consulting", label = "Consulting", description = "Procurement of consulting and advisory services" }
        };
    }

    private static object GetDefaultAntiSplit()
    {
        return new
        {
            enabled = true,
            lookbackDays = 30,
            maxTransactionsPerSupplier = 5,
            cumulativeThresholdMultiplier = 0.8m,
            flagSameCostCentre = true,
            flagSameSupplier = true,
            description = "Detects potential order splitting to circumvent procurement thresholds per MFMA SCM Regulations"
        };
    }
}
