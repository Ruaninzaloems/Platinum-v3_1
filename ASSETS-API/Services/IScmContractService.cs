namespace MssqlApi.Services;

public interface IScmContractService
{
    Task<IEnumerable<dynamic>> GetAllAsync();
    Task<dynamic?> GetByIdAsync(int id);
    Task<IEnumerable<dynamic>> GetUnbundlingItemsAsync(int contractId);
}
