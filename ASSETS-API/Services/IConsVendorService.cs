using MssqlApi.Models;

namespace MssqlApi.Services;

public interface IConsVendorService
{
    Task<IEnumerable<ConsVendor>> GetAllAsync();
    Task<ConsVendor?> GetByIdAsync(int id);
    Task<int> CreateAsync(ConsVendor entity);
    Task<bool> UpdateAsync(ConsVendor entity);
    Task<bool> DeleteAsync(int id);
}
