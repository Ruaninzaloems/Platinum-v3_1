using PlatinumOvertime_API.Models.Domain;

namespace PlatinumOvertime_API.Repositories.Interfaces;

public interface IPositionApprovalRepository
{
    Task<PositionApprovalConfig?> GetByPositionIdAsync(string positionId, CancellationToken ct = default);
    Task<PositionApprovalConfig> UpsertAsync(PositionApprovalConfig config, CancellationToken ct = default);
    Task<List<PositionApprovalConfig>> GetAllAsync(CancellationToken ct = default);

    /// <summary>
    /// Returns the set of PositionId values that already have a saved
    /// approval configuration. Used to enrich the position list with a
    /// "Configured" / "Not Configured" status flag without loading the
    /// full configs.
    /// </summary>
    Task<HashSet<string>> GetConfiguredPositionIdsAsync(CancellationToken ct = default);

    /// <summary>
    /// Upserts a batch of PositionApprovalConfig rows inside a single
    /// database transaction. All rows are written together or none are
    /// (on failure the transaction is rolled back and the exception
    /// is re-thrown). Returns the number of configs applied.
    /// </summary>
    Task<int> BatchUpsertInTransactionAsync(IEnumerable<PositionApprovalConfig> configs, CancellationToken ct = default);
}
