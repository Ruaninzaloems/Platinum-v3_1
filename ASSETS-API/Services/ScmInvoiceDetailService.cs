using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Services;

public class ScmInvoiceDetailService : IScmInvoiceDetailService
{
    private readonly DbConnectionFactory _db;
    public ScmInvoiceDetailService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync(int? invoiceId)
    {
        using var conn = _db.CreateConnection();
        var sql = "SELECT * FROM [SCM_InvoiceDetail] WHERE 1=1";
        var p = new DynamicParameters();
        if (invoiceId.HasValue) { sql += " AND [InvoiceID] = @invoiceId"; p.Add("invoiceId", invoiceId.Value); }
        sql += " ORDER BY [InvoiceDetail_ID]";
        return await conn.QueryAsync<dynamic>(sql, p);
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM [SCM_InvoiceDetail] WHERE [InvoiceDetail_ID] = @id", new { id });
    }
}
