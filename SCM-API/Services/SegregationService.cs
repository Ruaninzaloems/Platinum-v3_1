using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Helpers;
using SCM_API.Models.Domain;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class SegregationService : ISegregationService
{
    private readonly ApplicationDbContext _context;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<SegregationService> _logger;

    private static readonly List<object> _fallbackRules = new()
    {
        new { id = 1, entityType = "Requisition", restrictedAction1 = "Create", restrictedAction2 = "Approve", description = "Same person cannot create and approve a requisition", enabled = true },
        new { id = 2, entityType = "Order", restrictedAction1 = "Create", restrictedAction2 = "Approve", description = "Same person cannot create and approve a purchase order", enabled = true },
        new { id = 3, entityType = "Invoice", restrictedAction1 = "Capture", restrictedAction2 = "Approve", description = "Same person cannot capture and approve an invoice", enabled = true },
        new { id = 4, entityType = "Payment", restrictedAction1 = "Create", restrictedAction2 = "Approve", description = "Same person cannot create and approve a payment batch", enabled = true },
        new { id = 5, entityType = "Tender", restrictedAction1 = "Create", restrictedAction2 = "Adjudicate", description = "Same person cannot create a tender and sit on the adjudication committee", enabled = true },
        new { id = 6, entityType = "GRN", restrictedAction1 = "Create", restrictedAction2 = "Approve", description = "Same person cannot capture and approve a goods received note", enabled = true },
        new { id = 7, entityType = "Vendor", restrictedAction1 = "Register", restrictedAction2 = "Approve", description = "Same person cannot register and approve a vendor", enabled = true },
        new { id = 8, entityType = "Contract", restrictedAction1 = "Create", restrictedAction2 = "Approve", description = "Same person cannot create and approve a contract", enabled = true }
    };

    public SegregationService(ApplicationDbContext context, DbAvailabilityChecker dbChecker, ILogger<SegregationService> logger)
    {
        _context = context;
        _dbChecker = dbChecker;
        _logger = logger;
    }

    private bool UseDb => _dbChecker.IsDbAvailable;

    public async Task<object> GetAllRulesAsync()
    {
        if (UseDb)
        {
            try
            {
                var rules = await _context.SegregationRules
                    .Where(r => r.Enabled)
                    .OrderBy(r => r.EntityType)
                    .ToListAsync();

                if (rules.Any())
                {
                    return rules.Select(r => new
                    {
                        id = r.RuleId,
                        entityType = r.EntityType,
                        restrictedAction1 = r.RestrictedAction1,
                        restrictedAction2 = r.RestrictedAction2,
                        description = r.Description,
                        enabled = r.Enabled
                    }).ToList<object>();
                }

                _logger.LogInformation("No segregation rules in DB, using fallback");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load segregation rules from DB");
                _dbChecker.MarkUnavailable();
            }
        }

        return _fallbackRules;
    }

    public async Task<bool> ValidateSegregationAsync(int userId, string entityType, string action, int entityId)
    {
        if (UseDb)
        {
            try
            {
                var rules = await _context.SegregationRules
                    .Where(r => r.Enabled && r.EntityType.ToLower() == entityType.ToLower())
                    .ToListAsync();

                if (!rules.Any()) return true;

                var entityAudits = await _context.AuditLogs
                    .Where(a => a.RecordId == entityId &&
                                a.TableName.ToLower().Contains(entityType.ToLower()))
                    .ToListAsync();

                foreach (var rule in rules)
                {
                    var conflictAction = action.ToLower() == rule.RestrictedAction2.ToLower()
                        ? rule.RestrictedAction1
                        : action.ToLower() == rule.RestrictedAction1.ToLower()
                            ? rule.RestrictedAction2
                            : null;

                    if (conflictAction == null) continue;

                    var conflictExists = entityAudits.Any(a =>
                        a.UserId == userId &&
                        a.AuditDesc.ToLower().Contains(conflictAction.ToLower()));

                    if (conflictExists)
                    {
                        _logger.LogWarning("Segregation of duties violation: User {UserId} attempted '{Action}' on {EntityType}/{EntityId} but already performed '{ConflictAction}'",
                            userId, action, entityType, entityId, conflictAction);
                        return false;
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to validate segregation for user {UserId} on {EntityType}/{EntityId}", userId, entityType, entityId);
                _dbChecker.MarkUnavailable();
            }
        }

        return true;
    }
}
