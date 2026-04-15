using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

public class AssetConfigMscoaTxnTypeDto
{
    public int AssetConfigMscoaId { get; set; }
    public int? TransactionTypeId { get; set; }
    public int? Enabled { get; set; }
    public int? CreatedById { get; set; }
}

[ApiController]
[Route("api/asset-config-mscoa-transaction-types")]
public class AssetConfigMscoaTransactionTypeController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public AssetConfigMscoaTransactionTypeController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? mscoaId = null)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT mt.""AssetConfig_mSCOA_TransactionType_ID"" as ""id"",
                           mt.""AssetConfig_mSCOA_ID"" as ""assetConfigMscoaId"",
                           mt.""TransactionTypeID"" as ""transactionTypeId"",
                           mt.""Project11"" as ""project11"",
                           mt.""DebitItem11_1"" as ""debitItem11_1"",
                           mt.""DebitItem11_1DisplayName"" as ""debitItem11_1DisplayName"",
                           mt.""DebitItem11_2"" as ""debitItem11_2"",
                           mt.""DebitItem11_2DisplayName"" as ""debitItem11_2DisplayName"",
                           mt.""CreditItem11_1"" as ""creditItem11_1"",
                           mt.""CreditItem11_1DisplayName"" as ""creditItem11_1DisplayName"",
                           mt.""Project21"" as ""project21"",
                           mt.""DebitItem21_1"" as ""debitItem21_1"",
                           mt.""DebitItem21_1DisplayName"" as ""debitItem21_1DisplayName"",
                           mt.""CreditItem21_1"" as ""creditItem21_1"",
                           mt.""CreditItem21_1DisplayName"" as ""creditItem21_1DisplayName"",
                           mt.""Default"" as ""default"",
                           mt.""Enabled"" as ""enabled"",
                           mt.""CreatedDate"" as ""createdDate"",
                           tt.""Name"" as ""transactionTypeName""
                    FROM ""AssetConfig_mSCOA_TransactionType"" mt
                    LEFT JOIN ""AssetConfig_TransactionType"" tt ON mt.""TransactionTypeID"" = tt.""AssetConfig_TransactionType_ID""";
        if (mscoaId.HasValue)
            sql += @" WHERE mt.""AssetConfig_mSCOA_ID"" = @mscoaId";
        sql += @" ORDER BY mt.""AssetConfig_mSCOA_TransactionType_ID""";
        var items = await conn.QueryAsync(sql, new { mscoaId });
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync(@"SELECT * FROM ""AssetConfig_mSCOA_TransactionType"" WHERE ""AssetConfig_mSCOA_TransactionType_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "mSCOA transaction type config not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssetConfigMscoaTxnTypeDto model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""AssetConfig_mSCOA_TransactionType"" (""AssetConfig_mSCOA_ID"", ""TransactionTypeID"", ""Enabled"", ""CreatedByID"", ""CreatedDate"")
            VALUES (@AssetConfigMscoaId, @TransactionTypeID, @Enabled, @CreatedByID, GETDATE())
            RETURNING ""AssetConfig_mSCOA_TransactionType_ID""",
            new { model.AssetConfigMscoaId, TransactionTypeID = model.TransactionTypeId, model.Enabled, CreatedByID = model.CreatedById });
        return Ok(new { id });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""AssetConfig_mSCOA_TransactionType"" WHERE ""AssetConfig_mSCOA_TransactionType_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "mSCOA transaction type config not found" }) : Ok(new { success = 1 });
    }
}
