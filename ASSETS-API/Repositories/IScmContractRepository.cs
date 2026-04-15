namespace MssqlApi.Repositories;

public interface IScmContractRepository
{
    Task<IEnumerable<dynamic>> GetAllAsync();
    Task<dynamic?> GetByIdAsync(int id);
    Task<IEnumerable<dynamic>> GetUnbundlingItemsAsync(int contractId);
}
