using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-transaction-summary")]
public class AssetTransactionSummaryController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public AssetTransactionSummaryController(DbConnectionFactory db) => _db = db;

    [HttpGet("GetAssetSummary")]
    public async Task<IActionResult> GetAssetSummary([FromQuery] int id, [FromQuery] string FinYear)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var items = await conn.QueryAsync<dynamic>(@"
            SELECT
                s.""ID"" AS ""id"",
                COALESCE(s.""AssetRegisterItemID"", s.""AssetRegisterItem_ID"") AS ""assetRegisterItemID"",
                COALESCE(s.""FinancialYear"", s.""FinYear"") AS ""financialYear"",
                s.""FinancialPeriod"" AS ""financialPeriod"",
                s.""RemainingUsefulLife"" AS ""remainingUsefulLife"",
                s.""CurrentValue"" AS ""currentValue"",
                s.""AccumulatedDepreciationOpeningBalance"" AS ""accumulatedDepreciationOpeningBalance"",
                s.""DepreciationValue"" AS ""depreciationValue"",
                s.""AccumulatedDepreciationClosingBalance"" AS ""accumulatedDepreciationClosingBalance"",
                s.""AccumulatedImpairmentOpeningBalance"" AS ""accumulatedImpairmentOpeningBalance"",
                s.""ImpairmentValue"" AS ""impairmentValue"",
                s.""AccumulatedImpairmentClosingBalance"" AS ""accumulatedImpairmentClosingBalance"",
                s.""AccumulatedFairValueOpeningBalance"" AS ""accumulatedFairValueOpeningBalance"",
                s.""FairValue"" AS ""fairValue"",
                s.""AccumulatedFairValueClosingBalance"" AS ""accumulatedFairValueClosingBalance"",
                s.""AccumulatedRevaluationOpeningBalance"" AS ""accumulatedRevaluationOpeningBalance"",
                s.""RevaluationValue"" AS ""revaluationValue"",
                s.""AccumulatedRevaluationClosingBalance"" AS ""accumulatedRevaluationClosingBalance"",
                s.""AccumulatedImpairmentReversalOpeningBalance"" AS ""accumulatedImpairmentReversalOpeningBalance"",
                s.""ImpairmentReversalValue"" AS ""impairmentReversalValue"",
                s.""AccumulatedImpairmentReversalClosingBalance"" AS ""accumulatedImpairmentReversalClosingBalance"",
                s.""DisposalOpeningBalance"" AS ""disposalOpeningBalance"",
                s.""DisposalValue"" AS ""disposalValue"",
                s.""DisposalLossValue"" AS ""disposalLossValue"",
                s.""DisposalTotalValue"" AS ""disposalTotalValue"",
                s.""DisposalClosingBalance"" AS ""disposalClosingBalance"",
                s.""AdditionOpeningBalance"" AS ""additionOpeningBalance"",
                s.""AdditionVaue"" AS ""additionVaue"",
                s.""AdditionClosingBalance"" AS ""additionClosingBalance"",
                s.""MovementInRevaluationReserve"" AS ""movementInRevaluationReserve"",
                s.""CostOpeningBalance"" AS ""costOpeningBalance"",
                s.""CostClosingBalance"" AS ""costClosingBalance"",
                s.""CarryingAmount"" AS ""carryingAmount""
            FROM ""Asset_Transaction_Summary"" s
            WHERE (s.""AssetRegisterItem_ID"" = @id OR s.""AssetRegisterItemID"" = @id)
              AND (s.""FinYear"" = @FinYear OR s.""FinancialYear"" = @FinYear)
            ORDER BY s.""FinancialPeriod"", s.""ID""",
            new { id, FinYear });

        return Ok(items);
    }
}
