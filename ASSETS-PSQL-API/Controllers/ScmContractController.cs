using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/scm-contracts")]
public class ScmContractController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly ScmUnbundlingService _scmUnbundling;

    public ScmContractController(DbConnectionFactory db, ScmUnbundlingService scmUnbundling)
    {
        _db = db;
        _scmUnbundling = scmUnbundling;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync(@"
            SELECT cd.""Contract_ID""        AS ""contractId"",
                   cd.""ContractNumber""     AS ""contractNumber"",
                   cd.""ContractDescription"" AS ""contractDescription"",
                   cd.""Contractvalue""      AS ""contractValue"",
                   cd.""VendorID""           AS ""vendorId"",
                   cd.""FinancialYear""      AS ""financialYear"",
                   cd.""PlannedStartDate""   AS ""plannedStartDate"",
                   cd.""PlannedEndDate""     AS ""plannedEndDate"",
                   cd.""ContractManagerID""  AS ""contractManagerId""
            FROM ""SCM_ContractDetails"" cd
            WHERE cd.""Enabled"" = 1
              AND NOT EXISTS (
                  SELECT 1 FROM ""Asset_WIP_Register"" w
                  WHERE w.""ContractNumber"" = cd.""ContractNumber""
              )
            ORDER BY cd.""ContractNumber""");
        return Ok(rows);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var row = await conn.QueryFirstOrDefaultAsync(@"
            SELECT cd.""Contract_ID""         AS ""contractId"",
                   cd.""ContractNumber""      AS ""contractNumber"",
                   cd.""ContractDescription"" AS ""contractDescription"",
                   cd.""Contractvalue""       AS ""contractValue"",
                   cd.""VendorID""            AS ""vendorId"",
                   cd.""FinancialYear""       AS ""financialYear"",
                   cd.""PlannedStartDate""    AS ""plannedStartDate"",
                   cd.""PlannedEndDate""      AS ""plannedEndDate"",
                   cd.""ContractManagerID""   AS ""contractManagerId""
            FROM ""SCM_ContractDetails"" cd
            WHERE cd.""Contract_ID"" = @Id",
            new { Id = id });
        if (row == null) return NotFound();
        return Ok(row);
    }

    [HttpGet("{id}/unbundling-items")]
    public async Task<IActionResult> GetUnbundlingItems(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await _scmUnbundling.GetDetailsByContractViaItemsAsync(id);
        return Ok(rows);
    }
}
