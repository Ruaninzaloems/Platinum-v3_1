using AssetManagement.Models;
using AssetManagement.Repositories;

namespace AssetManagement.Services
{
    public class Const_AssetCategory_sysService : IConst_AssetCategory_sysService
    {
        private readonly IConst_AssetCategory_sysRepository _repo;

        public Const_AssetCategory_sysService(IConst_AssetCategory_sysRepository repo)
        {
            _repo = repo;
        }

        public async Task<Const_AssetCategory_sys> CreateAsync(Const_AssetCategory_sys model)
        {
            model.AssetCategoryID = await _repo.CreateAsync(model);
            return model;
        }

        public Task<Const_AssetCategory_sys?> GetByIdAsync(int id)
            => _repo.GetByIdAsync(id);

        public Task<IEnumerable<Const_AssetCategory_sys>> GetAllAsync()
            => _repo.GetAllAsync();

        public async Task<bool> UpdateAsync(Const_AssetCategory_sys model)
        {
            var rows = await _repo.UpdateAsync(model);
            return rows > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var rows = await _repo.DeleteAsync(id);
            return rows > 0;
        }
    }
}
