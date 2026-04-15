namespace MssqlApi.Services;

public interface IScmInvoiceService
{
    Task<IEnumerable<dynamic>> GetAllAsync(int? contractId, string? finYear);
    Task<dynamic?> GetByIdAsync(int id);
}
