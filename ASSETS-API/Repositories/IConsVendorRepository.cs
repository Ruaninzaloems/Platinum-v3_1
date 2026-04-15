using MssqlApi.Models;

namespace MssqlApi.Repositories;

public interface IConsVendorRepository
{
    Task<IEnumerable<ConsVendor>> GetAllAsync();
    Task<ConsVendor?> GetByIdAsync(int id);
    Task<int> CreateAsync(ConsVendor entity);
    Task<bool> UpdateAsync(ConsVendor entity);
    Task<bool> DeleteAsync(int id);
}
