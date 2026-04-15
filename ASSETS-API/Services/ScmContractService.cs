using MssqlApi.Repositories;

namespace MssqlApi.Services;

public class ScmContractService : IScmContractService
{
    private readonly IScmContractRepository _repo;
    public ScmContractService(IScmContractRepository repo) => _repo = repo;

    public Task<IEnumerable<dynamic>> GetAllAsync() => _repo.GetAllAsync();
    public Task<dynamic?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<IEnumerable<dynamic>> GetUnbundlingItemsAsync(int contractId) => _repo.GetUnbundlingItemsAsync(contractId);
}
