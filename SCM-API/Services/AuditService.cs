using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Helpers;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<AuditService> _logger;

    public AuditService(ApplicationDbContext context, DbAvailabilityChecker dbChecker, ILogger<AuditService> logger)
    {
        _context = context;
        _dbChecker = dbChecker;
        _logger = logger;
    }

    private bool UseDb => _dbChecker.IsDbAvailable;

    public async Task<PagedResult<object>> GetAuditLogsAsync(string? entityType, int? entityId, string? action,
        DateTime? fromDate, DateTime? toDate, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var query = _context.AuditLogs.AsQueryable();

                if (!string.IsNullOrEmpty(entityType))
                    query = query.Where(a => a.TableName.ToLower().Contains(entityType.ToLower()));

                if (entityId.HasValue)
                    query = query.Where(a => a.RecordId == entityId.Value);

                if (!string.IsNullOrEmpty(action))
                    query = query.Where(a => a.AuditDesc.ToLower().Contains(action.ToLower()));

                if (fromDate.HasValue)
                    query = query.Where(a => a.AuditDate >= fromDate.Value);

                if (toDate.HasValue)
                    query = query.Where(a => a.AuditDate <= toDate.Value);

                var totalCount = await query.CountAsync();

                var items = await query
                    .OrderByDescending(a => a.AuditDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var userIds = items.Select(a => a.UserId).Distinct().ToList();
                var users = await _context.Users
                    .Where(u => userIds.Contains(u.UserId))
                    .ToListAsync();
                var userMap = users.ToDictionary(u => u.UserId, u => $"{u.FirstName} {u.LastName}".Trim());

                var result = items.Select(a => (object)new
                {
                    id = a.AuditLogId,
                    userId = a.UserId,
                    userName = userMap.GetValueOrDefault(a.UserId, $"User #{a.UserId}"),
                    action = a.AuditDesc,
                    entityType = a.TableName,
                    entityId = a.RecordId,
                    details = a.AuditComment,
                    timestamp = a.AuditDate,
                    module = a.ModuleId,
                    financialYear = a.ActiveFinYearUserFinYear
                }).ToList();

                return new PagedResult<object>
                {
                    Items = result,
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load audit logs from DB, using fallback");
                _dbChecker.MarkUnavailable();
            }
        }

        return new PagedResult<object> { Items = new List<object>(), Page = page, PageSize = pageSize, TotalCount = 0 };
    }

    public async Task LogActionAsync(string entityType, int entityId, string action, string details, int userId)
    {
        _logger.LogInformation("Audit: {Action} on {EntityType} {EntityId} by user {UserId}", action, entityType, entityId, userId);

        if (UseDb)
        {
            try
            {
                var auditLog = new AuditLog
                {
                    UserId = userId,
                    AuditDesc = action,
                    AuditDate = DateTime.UtcNow,
                    AuditComment = details,
                    TableName = entityType,
                    ModuleId = GetModuleId(entityType),
                    RecordId = entityId,
                    AuditGuid = Guid.NewGuid()
                };

                await _context.AuditLogs.AddAsync(auditLog);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Audit log persisted to DB: {Action} on {EntityType}/{EntityId}", action, entityType, entityId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to persist audit log to DB for {EntityType}/{EntityId}", entityType, entityId);
                _dbChecker.MarkUnavailable();
            }
        }
    }

    public async Task<object> GetEntityHistoryAsync(string entityType, int entityId)
    {
        if (UseDb)
        {
            try
            {
                var logs = await _context.AuditLogs
                    .Where(a => a.TableName.ToLower().Contains(entityType.ToLower()) && a.RecordId == entityId)
                    .OrderByDescending(a => a.AuditDate)
                    .ToListAsync();

                var userIds = logs.Select(a => a.UserId).Distinct().ToList();
                var users = await _context.Users
                    .Where(u => userIds.Contains(u.UserId))
                    .ToListAsync();
                var userMap = users.ToDictionary(u => u.UserId, u => $"{u.FirstName} {u.LastName}".Trim());

                return logs.Select(a => new
                {
                    id = a.AuditLogId,
                    action = a.AuditDesc,
                    details = a.AuditComment,
                    performedBy = userMap.GetValueOrDefault(a.UserId, $"User #{a.UserId}"),
                    performedById = a.UserId,
                    timestamp = a.AuditDate,
                    module = a.ModuleId
                }).ToList<object>();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load entity history from DB for {EntityType}/{EntityId}", entityType, entityId);
                _dbChecker.MarkUnavailable();
            }
        }

        return new List<object>();
    }

    public async Task<object> GetAuditSummaryAsync()
    {
        if (UseDb)
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var totalEntries = await _context.AuditLogs.CountAsync();
                var todayEntries = await _context.AuditLogs.CountAsync(a => a.AuditDate >= today);
                var activeUsers = await _context.AuditLogs
                    .Where(a => a.AuditDate >= today.AddDays(-30))
                    .Select(a => a.UserId)
                    .Distinct()
                    .CountAsync();

                var topModules = await _context.AuditLogs
                    .GroupBy(a => a.TableName)
                    .Select(g => new { module = g.Key, count = g.Count() })
                    .OrderByDescending(x => x.count)
                    .Take(5)
                    .ToListAsync();

                var topActions = await _context.AuditLogs
                    .GroupBy(a => a.AuditDesc)
                    .Select(g => new { action = g.Key, count = g.Count() })
                    .OrderByDescending(x => x.count)
                    .Take(5)
                    .ToListAsync();

                var mostActiveModule = topModules.FirstOrDefault()?.module;

                return new
                {
                    totalEntries,
                    todayEntries,
                    activeUsers,
                    mostActiveModule,
                    exports = 0,
                    topModules = topModules.Select(m => (object)new { code = m.module, name = m.module, count = m.count }).ToList(),
                    topActions = topActions.Select(a => (object)new { code = a.action, name = a.action, count = a.count }).ToList()
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load audit summary from DB");
                _dbChecker.MarkUnavailable();
            }
        }

        return new { totalEntries = 0, todayEntries = 0, activeUsers = 0, mostActiveModule = (string?)null, exports = 0, topModules = Array.Empty<object>(), topActions = Array.Empty<object>() };
    }

    public async Task<object> GetUserAuditHistoryAsync(int userId, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var query = _context.AuditLogs.Where(a => a.UserId == userId);
                var total = await query.CountAsync();

                var items = await query
                    .OrderByDescending(a => a.AuditDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(a => (object)new
                    {
                        id = a.AuditLogId,
                        action = a.AuditDesc,
                        entityType = a.TableName,
                        entityId = a.RecordId,
                        details = a.AuditComment,
                        timestamp = a.AuditDate
                    })
                    .ToListAsync();

                return new { items, total, page, pageSize };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load user audit history from DB");
                _dbChecker.MarkUnavailable();
            }
        }

        return new { items = Array.Empty<object>(), total = 0, page, pageSize };
    }

    public async Task<object> ExportAuditLogsAsync(string? entityType, string? action, DateTime? fromDate, DateTime? toDate)
    {
        if (UseDb)
        {
            try
            {
                var query = _context.AuditLogs.AsQueryable();

                if (!string.IsNullOrEmpty(entityType))
                    query = query.Where(a => a.TableName.ToLower().Contains(entityType.ToLower()));
                if (!string.IsNullOrEmpty(action))
                    query = query.Where(a => a.AuditDesc.ToLower().Contains(action.ToLower()));
                if (fromDate.HasValue)
                    query = query.Where(a => a.AuditDate >= fromDate.Value);
                if (toDate.HasValue)
                    query = query.Where(a => a.AuditDate <= toDate.Value);

                var data = await query
                    .OrderByDescending(a => a.AuditDate)
                    .Take(5000)
                    .Select(a => (object)new
                    {
                        id = a.AuditLogId,
                        userId = a.UserId,
                        action = a.AuditDesc,
                        entityType = a.TableName,
                        entityId = a.RecordId,
                        details = a.AuditComment,
                        timestamp = a.AuditDate
                    })
                    .ToListAsync();

                return new { data, exportedAt = DateTime.UtcNow };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to export audit logs from DB");
                _dbChecker.MarkUnavailable();
            }
        }

        return new { data = Array.Empty<object>(), exportedAt = DateTime.UtcNow };
    }

    private static int GetModuleId(string entityType)
    {
        return entityType.ToLower() switch
        {
            var t when t.Contains("requisition") => 1,
            var t when t.Contains("order") => 2,
            var t when t.Contains("invoice") => 3,
            var t when t.Contains("payment") => 4,
            var t when t.Contains("tender") => 5,
            var t when t.Contains("contract") => 6,
            var t when t.Contains("inventory") || t.Contains("inven") => 7,
            var t when t.Contains("vendor") || t.Contains("supplier") => 8,
            var t when t.Contains("grn") || t.Contains("gra") => 9,
            _ => 0
        };
    }
}
