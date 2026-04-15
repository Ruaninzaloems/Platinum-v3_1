using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Helpers;
using SCM_API.Models.Domain;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class DelegationService : IDelegationService
{
    private readonly ApplicationDbContext _context;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<DelegationService> _logger;

    private static readonly System.Collections.Concurrent.ConcurrentDictionary<int, Delegation> _fallbackDelegations = new();
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<int, DelegationThreshold> _fallbackThresholds = new();
    private static int _nextDelegationId = 1;
    private static int _nextThresholdId = 1;

    public DelegationService(ApplicationDbContext context, DbAvailabilityChecker dbChecker, ILogger<DelegationService> logger)
    {
        _context = context;
        _dbChecker = dbChecker;
        _logger = logger;
    }

    private bool UseDb => _dbChecker.IsDbAvailable;

    public async Task<object> GetAllDelegationsAsync(string? type, string? status, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var query = _context.Delegations.AsQueryable();

                if (!string.IsNullOrEmpty(type))
                    query = query.Where(d => d.DelegationType == type);
                if (!string.IsNullOrEmpty(status))
                    query = query.Where(d => d.Status == status);

                var total = await query.CountAsync();
                var delegations = await query
                    .OrderByDescending(d => d.DateCaptured)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var userIds = delegations
                    .SelectMany(d => new[] { d.DelegatorUserId, d.DelegateeUserId })
                    .Distinct().ToList();
                var users = await _context.Users
                    .Where(u => userIds.Contains(u.UserId))
                    .ToListAsync();
                var userMap = users.ToDictionary(u => u.UserId, u => $"{u.FirstName} {u.LastName}".Trim());

                var data = delegations.Select(d => (object)new
                {
                    id = d.DelegationId,
                    delegator = userMap.GetValueOrDefault(d.DelegatorUserId, $"User #{d.DelegatorUserId}"),
                    delegatorId = d.DelegatorUserId,
                    delegatee = userMap.GetValueOrDefault(d.DelegateeUserId, $"User #{d.DelegateeUserId}"),
                    delegateeId = d.DelegateeUserId,
                    type = d.DelegationType,
                    status = d.Status,
                    fromDate = d.FromDate,
                    toDate = d.ToDate,
                    limit = d.ApprovalLimit,
                    reason = d.Reason
                }).ToList();

                return new { data, totalPages = (int)Math.Ceiling((double)total / pageSize), total, page, pageSize };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load delegations from DB");
                _dbChecker.MarkUnavailable();
            }
        }

        var fallback = _fallbackDelegations.Values.AsEnumerable();
        if (!string.IsNullOrEmpty(type))
            fallback = fallback.Where(d => d.DelegationType == type);
        if (!string.IsNullOrEmpty(status))
            fallback = fallback.Where(d => d.Status == status);

        var list = fallback.OrderByDescending(d => d.DateCaptured).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(d => (object)new
            {
                id = d.DelegationId, delegator = $"User #{d.DelegatorUserId}", delegatorId = d.DelegatorUserId,
                delegatee = $"User #{d.DelegateeUserId}", delegateeId = d.DelegateeUserId,
                type = d.DelegationType, status = d.Status, fromDate = d.FromDate, toDate = d.ToDate,
                limit = d.ApprovalLimit, reason = d.Reason
            }).ToList();
        return new { data = list, totalPages = 1, total = list.Count, page, pageSize };
    }

    public async Task<object> GetDelegationByIdAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var d = await _context.Delegations.FindAsync(id);
                if (d != null)
                {
                    var users = await _context.Users
                        .Where(u => u.UserId == d.DelegatorUserId || u.UserId == d.DelegateeUserId)
                        .ToListAsync();
                    var userMap = users.ToDictionary(u => u.UserId, u => $"{u.FirstName} {u.LastName}".Trim());

                    return new
                    {
                        id = d.DelegationId, delegator = userMap.GetValueOrDefault(d.DelegatorUserId, ""),
                        delegatorId = d.DelegatorUserId, delegatee = userMap.GetValueOrDefault(d.DelegateeUserId, ""),
                        delegateeId = d.DelegateeUserId, type = d.DelegationType, status = d.Status,
                        fromDate = d.FromDate, toDate = d.ToDate, limit = d.ApprovalLimit,
                        reason = d.Reason, revokedReason = d.RevokedReason, revokedDate = d.RevokedDate
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load delegation {Id} from DB", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (_fallbackDelegations.TryGetValue(id, out var fb))
            return new { id = fb.DelegationId, delegator = "", delegatee = "", type = fb.DelegationType, status = fb.Status, fromDate = fb.FromDate, toDate = fb.ToDate, limit = fb.ApprovalLimit, reason = fb.Reason };

        return new { id, delegator = "", delegatee = "", type = "Financial", status = "Active", fromDate = DateTime.UtcNow, toDate = DateTime.UtcNow.AddDays(30), limit = 0m };
    }

    public async Task<object> CreateDelegationAsync(object dto)
    {
        var json = JsonSerializer.Serialize(dto);
        var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var delegation = new Delegation
        {
            DelegatorUserId = root.TryGetProperty("delegatorUserId", out var dor) ? dor.GetInt32() : 1,
            DelegateeUserId = root.TryGetProperty("delegateeUserId", out var dee) ? dee.GetInt32() : 1,
            DelegationType = root.TryGetProperty("type", out var tp) ? tp.GetString() ?? "Financial" : "Financial",
            Status = "Active",
            FromDate = root.TryGetProperty("fromDate", out var fd) && fd.TryGetDateTime(out var fdt) ? fdt : DateTime.UtcNow,
            ToDate = root.TryGetProperty("toDate", out var td) && td.TryGetDateTime(out var tdt) ? tdt : DateTime.UtcNow.AddDays(30),
            ApprovalLimit = root.TryGetProperty("limit", out var lm) ? lm.GetDecimal() : 0m,
            Reason = root.TryGetProperty("reason", out var rs) ? rs.GetString() : null,
            DateCaptured = DateTime.UtcNow,
            CapturerId = 1
        };

        if (UseDb)
        {
            try
            {
                await _context.Delegations.AddAsync(delegation);
                await _context.SaveChangesAsync();
                return new { id = delegation.DelegationId };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to create delegation in DB");
                _dbChecker.MarkUnavailable();
            }
        }

        delegation.DelegationId = Interlocked.Increment(ref _nextDelegationId);
        _fallbackDelegations[delegation.DelegationId] = delegation;
        return new { id = delegation.DelegationId };
    }

    public async Task<bool> UpdateDelegationAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var d = await _context.Delegations.FindAsync(id);
                if (d == null) return false;

                var json = JsonSerializer.Serialize(dto);
                var root = JsonDocument.Parse(json).RootElement;

                if (root.TryGetProperty("type", out var tp)) d.DelegationType = tp.GetString() ?? d.DelegationType;
                if (root.TryGetProperty("fromDate", out var fd) && fd.TryGetDateTime(out var fdt)) d.FromDate = fdt;
                if (root.TryGetProperty("toDate", out var td) && td.TryGetDateTime(out var tdt)) d.ToDate = tdt;
                if (root.TryGetProperty("limit", out var lm)) d.ApprovalLimit = lm.GetDecimal();
                if (root.TryGetProperty("reason", out var rs)) d.Reason = rs.GetString();
                d.DateModified = DateTime.UtcNow;

                _context.Delegations.Update(d);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to update delegation {Id}", id);
                _dbChecker.MarkUnavailable();
                return false;
            }
        }

        if (_fallbackDelegations.TryGetValue(id, out var fb))
        {
            var json = JsonSerializer.Serialize(dto);
            var root = JsonDocument.Parse(json).RootElement;
            if (root.TryGetProperty("type", out var tp)) fb.DelegationType = tp.GetString() ?? fb.DelegationType;
            if (root.TryGetProperty("limit", out var lm)) fb.ApprovalLimit = lm.GetDecimal();
            fb.DateModified = DateTime.UtcNow;
            return true;
        }
        return false;
    }

    public async Task<bool> RevokeDelegationAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var d = await _context.Delegations.FindAsync(id);
                if (d == null) return false;

                var json = JsonSerializer.Serialize(dto);
                var root = JsonDocument.Parse(json).RootElement;

                d.Status = "Revoked";
                d.RevokedDate = DateTime.UtcNow;
                d.RevokedReason = root.TryGetProperty("reason", out var rs) ? rs.GetString() : "Revoked";
                d.DateModified = DateTime.UtcNow;

                _context.Delegations.Update(d);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to revoke delegation {Id}", id);
                _dbChecker.MarkUnavailable();
                return false;
            }
        }

        if (_fallbackDelegations.TryGetValue(id, out var fb))
        {
            fb.Status = "Revoked";
            fb.RevokedDate = DateTime.UtcNow;
            return true;
        }
        return false;
    }

    public async Task<object> GetThresholdsAsync()
    {
        if (UseDb)
        {
            try
            {
                var thresholds = await _context.DelegationThresholds
                    .Where(t => t.Enabled)
                    .OrderBy(t => t.MinAmount)
                    .ToListAsync();

                var roleIds = thresholds.Select(t => t.RoleId).Distinct().ToList();
                var roles = await _context.SysRoleNames
                    .Where(r => roleIds.Contains(r.RoleId))
                    .ToListAsync();
                var roleMap = roles.ToDictionary(r => r.RoleId, r => r.RoleDesc);

                return thresholds.Select(t => new
                {
                    id = t.ThresholdId,
                    roleId = t.RoleId,
                    roleName = roleMap.GetValueOrDefault(t.RoleId, $"Role #{t.RoleId}"),
                    thresholdType = t.ThresholdType,
                    minAmount = t.MinAmount,
                    maxAmount = t.MaxAmount,
                    requiresAdditionalApproval = t.RequiresAdditionalApproval
                }).ToList<object>();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load delegation thresholds from DB");
                _dbChecker.MarkUnavailable();
            }
        }

        return _fallbackThresholds.Values.Select(t => (object)new
        {
            id = t.ThresholdId, roleId = t.RoleId, roleName = $"Role #{t.RoleId}",
            thresholdType = t.ThresholdType, minAmount = t.MinAmount, maxAmount = t.MaxAmount,
            requiresAdditionalApproval = t.RequiresAdditionalApproval
        }).ToList();
    }

    public async Task<bool> UpdateThresholdAsync(int id, object dto)
    {
        if (UseDb)
        {
            try
            {
                var t = await _context.DelegationThresholds.FindAsync(id);
                if (t == null) return false;

                var json = JsonSerializer.Serialize(dto);
                var root = JsonDocument.Parse(json).RootElement;

                if (root.TryGetProperty("minAmount", out var min)) t.MinAmount = min.GetDecimal();
                if (root.TryGetProperty("maxAmount", out var max)) t.MaxAmount = max.GetDecimal();
                if (root.TryGetProperty("requiresAdditionalApproval", out var req)) t.RequiresAdditionalApproval = req.GetBoolean();

                _context.DelegationThresholds.Update(t);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to update threshold {Id}", id);
                _dbChecker.MarkUnavailable();
                return false;
            }
        }

        if (_fallbackThresholds.TryGetValue(id, out var fb))
        {
            var json = JsonSerializer.Serialize(dto);
            var root = JsonDocument.Parse(json).RootElement;
            if (root.TryGetProperty("minAmount", out var min)) fb.MinAmount = min.GetDecimal();
            if (root.TryGetProperty("maxAmount", out var max)) fb.MaxAmount = max.GetDecimal();
            return true;
        }
        return false;
    }

    public async Task<bool> ValidateDelegationAuthorityAsync(int userId, decimal amount, string entityType)
    {
        if (UseDb)
        {
            try
            {
                var activeDelegations = await _context.Delegations
                    .Where(d => d.DelegateeUserId == userId &&
                                d.Status == "Active" &&
                                d.FromDate <= DateTime.UtcNow &&
                                d.ToDate >= DateTime.UtcNow)
                    .ToListAsync();

                if (activeDelegations.Any())
                {
                    var maxLimit = activeDelegations.Max(d => d.ApprovalLimit);
                    if (amount > maxLimit)
                    {
                        _logger.LogWarning("User {UserId} delegation limit ({Limit}) exceeded for amount {Amount} on {EntityType}",
                            userId, maxLimit, amount, entityType);
                        return false;
                    }
                    return true;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to validate delegation authority for user {UserId}", userId);
                _dbChecker.MarkUnavailable();
            }
        }

        return true;
    }
}
