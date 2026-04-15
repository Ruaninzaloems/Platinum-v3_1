using System.Data.Common;

namespace AssetManagement.Services;

public class ScmUnbundlingService
{
    private readonly InternalApiClient _api;

    public ScmUnbundlingService(InternalApiClient api) => _api = api;

    public async Task<IEnumerable<object>> GetDetailsByContractAsync(int contractId)
    {
        var rows = await _api.GetAsync<List<object>>(
            $"api/scm-unbundling-details/by-contract?contractId={contractId}");
        return rows ?? Enumerable.Empty<object>();
    }

    public async Task<IEnumerable<object>> GetDetailsByContractViaItemsAsync(int contractId)
    {
        var rows = await _api.GetAsync<List<object>>(
            $"api/scm-unbundling-details/by-contract-via-items?contractId={contractId}");
        return rows ?? Enumerable.Empty<object>();
    }
}
