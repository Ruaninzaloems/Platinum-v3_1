using AssetManagement.Models;

namespace AssetManagement.Repositories
{
    public interface IConst_AssetCategory_sysRepository
    {
        Task<int> CreateAsync(Const_AssetCategory_sys model);
        Task<Const_AssetCategory_sys?> GetByIdAsync(int id);
        Task<IEnumerable<Const_AssetCategory_sys>> GetAllAsync();
        Task<int> UpdateAsync(Const_AssetCategory_sys model);
        Task<int> DeleteAsync(int id);
    }
}
