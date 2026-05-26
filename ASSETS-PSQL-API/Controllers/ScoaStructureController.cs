using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/scoa-structure")]
public class ScoaStructureController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public ScoaStructureController(DbConnectionFactory db) => _db = db;

    private const string SelectColumns = @"
        SELECT ""ScoaID""                    AS ""scoaId"",
               ""ScoaCode""                  AS ""scoaCode"",
               ""LevelID""                   AS ""levelId"",
               ""TableID""                   AS ""tableId"",
               ""TableName""                 AS ""tableName"",
               ""PostingLevel""              AS ""postingLevel"",
               ""BreakDownAllowed""          AS ""breakDownAllowed"",
               ""ScoaDesc""                  AS ""scoaDesc"",
               ""ScoaShortDesc""             AS ""scoaShortDesc"",
               ""ScoaParentID""              AS ""scoaParentId"",
               ""VoteTypeID""                AS ""voteTypeId"",
               ""DebitCreditID""             AS ""debitCreditId"",
               ""VatIndicatorID""            AS ""vatIndicatorId"",
               ""VatApportionment""          AS ""vatApportionment"",
               ""CapitalTimePeriodID""       AS ""capitalTimePeriodId"",
               ""IsCapexVote""               AS ""isCapexVote"",
               ""IsControlVote""             AS ""isControlVote"",
               ""ParentID""                  AS ""parentId"",
               ""Enabled""                   AS ""enabled"",
               ""Version""                   AS ""version"",
               ""NTVatStatus""               AS ""ntVatStatus"",
               ""NTSCOAFile""                AS ""ntScoaFile"",
               ""NTScoaLevel""               AS ""ntScoaLevel"",
               ""NTExcelRowNumber""          AS ""ntExcelRowNumber"",
               ""NTPrinciple""               AS ""ntPrinciple"",
               ""NTApplicableTo""            AS ""ntApplicableTo"",
               ""NTPostingLevelDescription"" AS ""ntPostingLevelDescription"",
               ""NTScoaID""                  AS ""ntScoaId"",
               ""NTParentScoaId""            AS ""ntParentScoaId"",
               ""DefinitionDescription""     AS ""definitionDescription"",
               ""NTGFSCode""                 AS ""ntGfsCode""
        FROM ""Const_SCOA_Structure""";

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? tableId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = SelectColumns + @" WHERE 1=1";
        var p = new DynamicParameters();
        if (!string.IsNullOrWhiteSpace(tableId) && int.TryParse(tableId, out var tableIdInt))
        {
            sql += @" AND ""TableID"" = @tableIdInt";
            p.Add("tableIdInt", tableIdInt);
        }
        sql += @" ORDER BY ""ScoaCode""";
        var items = await conn.QueryAsync<dynamic>(sql, p);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            SelectColumns + @" WHERE ""ScoaID"" = @id", new { id });
        return item is null ? NotFound() : Ok(item);
    }
}
