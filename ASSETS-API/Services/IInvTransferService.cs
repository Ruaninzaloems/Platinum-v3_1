namespace MssqlApi.Services;

public interface IInvTransferService
{
    Task<IEnumerable<dynamic>> GetAllAsync(string? finYear);
    Task<dynamic?> GetByIdAsync(int id);
    Task<IEnumerable<dynamic>> GetPendingAsync();
}
