using Dapper;
using AssetManagement.Data;
using AssetManagement.Models;

namespace AssetManagement.Repositories
{
    public class Const_AssetCategory_sysRepository : IConst_AssetCategory_sysRepository
    {
        private readonly DbConnectionFactory _db;

        public Const_AssetCategory_sysRepository(DbConnectionFactory db)
        {
            _db = db;
        }

        public async Task<int> CreateAsync(Const_AssetCategory_sys model)
        {
            const string sql = @"
        INSERT INTO Const_AssetCategory_sys (AssetCategoryDesc, Enabled, DateCaptured, CapturerID, DateModified, ModifierID, RevaluationByCostModel, RevaluationByRevalutionModel, [Default], TypeID, RequireStatus)
        OUTPUT INSERTED.AssetCategoryID
        VALUES (@AssetCategoryDesc, @Enabled, @DateCaptured, @CapturerID, @DateModified, @ModifierID, @RevaluationByCostModel, @RevaluationByRevalutionModel, @Default, @TypeID, @RequireStatus)";

            using var conn = _db.CreateConnection();
            return await conn.QuerySingleAsync<int>(sql, new { model.AssetCategoryDesc, model.Enabled, model.DateCaptured, model.CapturerID, model.DateModified, model.ModifierID, model.RevaluationByCostModel, model.RevaluationByRevalutionModel, model.Default, model.TypeID, model.RequireStatus });
        }

        public async Task<Const_AssetCategory_sys?> GetByIdAsync(int id)
        {
            const string sql = @"
        SELECT AssetCategoryID, AssetCategoryDesc, Enabled, DateCaptured, CapturerID, DateModified, ModifierID, RevaluationByCostModel, RevaluationByRevalutionModel, [Default], TypeID, RequireStatus
        FROM Const_AssetCategory_sys
        WHERE AssetCategoryID = @id";

            using var conn = _db.CreateConnection();
            return await conn.QuerySingleOrDefaultAsync<Const_AssetCategory_sys>(sql, new { id });
        }

        public async Task<IEnumerable<Const_AssetCategory_sys>> GetAllAsync()
        {
            const string sql = "SELECT AssetCategoryID, AssetCategoryDesc, Enabled, DateCaptured, CapturerID, DateModified, ModifierID, RevaluationByCostModel, RevaluationByRevalutionModel, [Default], TypeID, RequireStatus FROM Const_AssetCategory_sys";

            using var conn = _db.CreateConnection();
            return await conn.QueryAsync<Const_AssetCategory_sys>(sql);
        }

        public async Task<int> UpdateAsync(Const_AssetCategory_sys model)
        {
            const string sql = @"
        UPDATE Const_AssetCategory_sys
        SET AssetCategoryDesc = @AssetCategoryDesc, Enabled = @Enabled, DateCaptured = @DateCaptured, CapturerID = @CapturerID, DateModified = @DateModified, ModifierID = @ModifierID, RevaluationByCostModel = @RevaluationByCostModel, RevaluationByRevalutionModel = @RevaluationByRevalutionModel, [Default] = @Default, TypeID = @TypeID, RequireStatus = @RequireStatus
        WHERE AssetCategoryID = @AssetCategoryID";

            using var conn = _db.CreateConnection();
            return await conn.ExecuteAsync(sql, model);
        }

        public async Task<int> DeleteAsync(int id)
        {
            const string sql = "DELETE FROM Const_AssetCategory_sys WHERE AssetCategoryID = @id";

            using var conn = _db.CreateConnection();
            return await conn.ExecuteAsync(sql, new { id });
        }
    }
}
