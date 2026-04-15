using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Services;

public class DocumentTypeService : IDocumentTypeService
{
    private readonly DbConnectionFactory _db;
    public DocumentTypeService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<dynamic>("SELECT * FROM [Const_DocumentType] ORDER BY [DocumentTypeDesc]");
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM [Const_DocumentType] WHERE [DocumentType_ID] = @id", new { id });
    }
}
