using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class AuditService
{
    private readonly BudgetDbContext _db;

    public AuditService(BudgetDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(string entityType, int entityId, string action, string userId, string? oldValues = null, string? newValues = null)
    {
        _db.AuditTrails.Add(new AuditTrail
        {
            EntityType = entityType,
            EntityId = entityId,
            Action = action,
            OldValues = oldValues,
            NewValues = newValues,
            UserId = userId,
            UserName = userId,
            Timestamp = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }

    public async Task<List<AuditTrail>> GetByEntityAsync(string entityType, int entityId)
    {
        return await Task.FromResult(
            _db.AuditTrails
                .Where(a => a.EntityType == entityType && a.EntityId == entityId)
                .OrderByDescending(a => a.Timestamp)
                .ToList()
        );
    }
}
