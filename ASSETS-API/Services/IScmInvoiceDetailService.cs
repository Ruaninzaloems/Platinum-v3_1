namespace MssqlApi.Services;

public interface IScmInvoiceDetailService
{
    Task<IEnumerable<dynamic>> GetAllAsync(int? invoiceId);
    Task<dynamic?> GetByIdAsync(int id);
}
