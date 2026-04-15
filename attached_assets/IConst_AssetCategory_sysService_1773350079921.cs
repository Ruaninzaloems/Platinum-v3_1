using AssetManagement.Models;

namespace AssetManagement.Services
{
    public interface IConst_AssetCategory_sysService
    {
        Task<Const_AssetCategory_sys> CreateAsync(Const_AssetCategory_sys model);
        Task<Const_AssetCategory_sys?> GetByIdAsync(int id);
        Task<IEnumerable<Const_AssetCategory_sys>> GetAllAsync();
        Task<bool> UpdateAsync(Const_AssetCategory_sys model);
        Task<bool> DeleteAsync(int id);
    }
}
