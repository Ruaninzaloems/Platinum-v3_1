using Dapper;
using MssqlApi.Data;

namespace MssqlApi.Services;

public class ScmInvoiceService : IScmInvoiceService
{
    private readonly DbConnectionFactory _db;
    public ScmInvoiceService(DbConnectionFactory db) => _db = db;

    public async Task<IEnumerable<dynamic>> GetAllAsync(int? contractId, string? finYear)
    {
        using var conn = _db.CreateConnection();
        var sql = @"SELECT
            [Invoice_ID]     AS transferId,
            [InvoiceNumber]  AS invoiceNo,
            [InvoiceNumber]  AS description,
            [InvoiceAmount]  AS currentAmount,
            NULL             AS grnId,
            ''               AS categoryDescription,
            ''               AS classDescription,
            [InvoiceDate]    AS invoiceDate,
            [ContractID]     AS contractId,
            [FinancialYear]  AS financialYear
            FROM [SCM_Invoice] WHERE 1=1";
        var p = new DynamicParameters();
        if (contractId.HasValue) { sql += " AND [ContractID] = @contractId"; p.Add("contractId", contractId.Value); }
        if (!string.IsNullOrWhiteSpace(finYear)) { sql += " AND [FinancialYear] = @finYear"; p.Add("finYear", finYear); }
        sql += " ORDER BY [Invoice_ID] DESC";
        return await conn.QueryAsync<dynamic>(sql, p);
    }

    public async Task<dynamic?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM [SCM_Invoice] WHERE [Invoice_ID] = @id", new { id });
    }
}
