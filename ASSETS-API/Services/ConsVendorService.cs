using MssqlApi.Models;
using MssqlApi.Repositories;

namespace MssqlApi.Services;

public class ConsVendorService : IConsVendorService
{
    private readonly IConsVendorRepository _repo;

    public ConsVendorService(IConsVendorRepository repo)
    {
        _repo = repo;
    }

    public Task<IEnumerable<ConsVendor>> GetAllAsync() => _repo.GetAllAsync();
    public Task<ConsVendor?> GetByIdAsync(int id) => _repo.GetByIdAsync(id);
    public Task<int> CreateAsync(ConsVendor entity) => _repo.CreateAsync(entity);
    public Task<bool> UpdateAsync(ConsVendor entity) => _repo.UpdateAsync(entity);
    public Task<bool> DeleteAsync(int id) => _repo.DeleteAsync(id);
}
