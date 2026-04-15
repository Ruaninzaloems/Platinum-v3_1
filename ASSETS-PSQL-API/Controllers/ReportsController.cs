using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly LookupService _lookup;
    private readonly LocationService _location;

    public ReportsController(DbConnectionFactory db, LookupService lookup, LocationService location)
    {
        _db = db;
        _lookup = lookup;
        _location = location;
    }

    [HttpGet("far")]
    public async Task<IActionResult> GetFar(
        [FromQuery] string? finYear = null,
        [FromQuery] int fromPeriod = 1,
        [FromQuery] int toPeriod = 12,
        [FromQuery] int? assetId = null,
        [FromQuery] int? assetStatus = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int? subCategoryId = null,
        [FromQuery] int? classId = null,
        [FromQuery] int? typeId = null,
        [FromQuery] string? description = null,
        [FromQuery] bool isSummary = false)
    {
        if (string.IsNullOrEmpty(finYear))
        {
            var now = DateTime.Now;
            finYear = now.Month >= 7 ? $"{now.Year}/{now.Year + 1}" : $"{now.Year - 1}/{now.Year}";
        }

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        string tmpTable = _db.IsSqlServer ? "#_tempsummary" : "_tempsummary";

        string tempTableSql = _db.IsSqlServer
            ? $@"IF OBJECT_ID('tempdb..#_tempsummary', 'U') IS NOT NULL DROP TABLE #_tempsummary;
CREATE TABLE #_tempsummary (
    AssetRegisterItemID INTEGER,
    FinancialYear VARCHAR(10),
    FinancialPeriod INTEGER,
    RemainingUsefulLife DECIMAL(18,8),
    OpeningBalance DECIMAL(18,2),
    CurrentValue DECIMAL(18,2),
    AccumulatedDepreciationOpeningBalance DECIMAL(18,2),
    DepreciationValue DECIMAL(18,2),
    AccumulatedDepreciationClosingBalance DECIMAL(18,2),
    AccumulatedImpairmentOpeningBalance DECIMAL(18,2),
    ImpairmentValue DECIMAL(18,2),
    AccumulatedImpairmentClosingBalance DECIMAL(18,2),
    AccumulatedFairValueOpeningBalance DECIMAL(18,2),
    FairValue DECIMAL(18,2),
    AccumulatedFairValueClosingBalance DECIMAL(18,2),
    AccumulatedRevaluationOpeningBalance DECIMAL(18,2),
    RevaluationValue DECIMAL(18,2),
    AccumulatedRevaluationClosingBalance DECIMAL(18,2),
    AccumulatedImpairmentReversalOpeningBalance DECIMAL(18,2),
    ImpairmentReversalValue DECIMAL(18,2),
    AccumulatedImpairmentReversalClosingBalance DECIMAL(18,2),
    AdditionOpeningBalance DECIMAL(18,2),
    AdditionVaue DECIMAL(18,2),
    AdditionClosingBalance DECIMAL(18,2),
    MovementInRevaluationReserve DECIMAL(18,2),
    DepreciationOffsetOpeningBalance DECIMAL(18,2),
    DepreciationOffset DECIMAL(18,2),
    DepreciationOffsetClosingBalance DECIMAL(18,2),
    RevaluationReserveImpairmentOpeningBalance DECIMAL(18,2),
    RevaluationReserveImpairment DECIMAL(18,2),
    RevaluationReserveImpairmentReversal DECIMAL(18,2),
    RevaluationReserveImpairmentClosingBalance DECIMAL(18,2),
    RevaluationReserveRevaluation DECIMAL(18,2),
    RevaluationReserveDisposal DECIMAL(18,2),
    DepreciationAdjustment DECIMAL(18,2),
    TransferFromAmount DECIMAL(18,2),
    TransferToAmount DECIMAL(18,2),
    RefurbDTValue DECIMAL(18,2),
    RefurbCTValue DECIMAL(18,2),
    RefurbDepreciationValue DECIMAL(18,2),
    RefurbRevaluationValue DECIMAL(18,2),
    CostOpening DECIMAL(18,2),
    CostClosing DECIMAL(18,2)
);"
            : @"
CREATE TEMPORARY TABLE _tempsummary (
    ""AssetRegisterItemID"" INTEGER,
    ""FinancialYear"" VARCHAR(10),
    ""FinancialPeriod"" INTEGER,
    ""RemainingUsefulLife"" DECIMAL(18,8),
    ""OpeningBalance"" DECIMAL(18,2),
    ""CurrentValue"" DECIMAL(18,2),
    ""AccumulatedDepreciationOpeningBalance"" DECIMAL(18,2),
    ""DepreciationValue"" DECIMAL(18,2),
    ""AccumulatedDepreciationClosingBalance"" DECIMAL(18,2),
    ""AccumulatedImpairmentOpeningBalance"" DECIMAL(18,2),
    ""ImpairmentValue"" DECIMAL(18,2),
    ""AccumulatedImpairmentClosingBalance"" DECIMAL(18,2),
    ""AccumulatedFairValueOpeningBalance"" DECIMAL(18,2),
    ""FairValue"" DECIMAL(18,2),
    ""AccumulatedFairValueClosingBalance"" DECIMAL(18,2),
    ""AccumulatedRevaluationOpeningBalance"" DECIMAL(18,2),
    ""RevaluationValue"" DECIMAL(18,2),
    ""AccumulatedRevaluationClosingBalance"" DECIMAL(18,2),
    ""AccumulatedImpairmentReversalOpeningBalance"" DECIMAL(18,2),
    ""ImpairmentReversalValue"" DECIMAL(18,2),
    ""AccumulatedImpairmentReversalClosingBalance"" DECIMAL(18,2),
    ""AdditionOpeningBalance"" DECIMAL(18,2),
    ""AdditionVaue"" DECIMAL(18,2),
    ""AdditionClosingBalance"" DECIMAL(18,2),
    ""MovementInRevaluationReserve"" DECIMAL(18,2),
    ""DepreciationOffsetOpeningBalance"" DECIMAL(18,2),
    ""DepreciationOffset"" DECIMAL(18,2),
    ""DepreciationOffsetClosingBalance"" DECIMAL(18,2),
    ""RevaluationReserveImpairmentOpeningBalance"" DECIMAL(18,2),
    ""RevaluationReserveImpairment"" DECIMAL(18,2),
    ""RevaluationReserveImpairmentReversal"" DECIMAL(18,2),
    ""RevaluationReserveImpairmentClosingBalance"" DECIMAL(18,2),
    ""RevaluationReserveRevaluation"" DECIMAL(18,2),
    ""RevaluationReserveDisposal"" DECIMAL(18,2),
    ""DepreciationAdjustment"" DECIMAL(18,2),
    ""TransferFromAmount"" DECIMAL(18,2),
    ""TransferToAmount"" DECIMAL(18,2),
    ""RefurbDTValue"" DECIMAL(18,2),
    ""RefurbCTValue"" DECIMAL(18,2),
    ""RefurbDepreciationValue"" DECIMAL(18,2),
    ""RefurbRevaluationValue"" DECIMAL(18,2),
    ""CostOpening"" DECIMAL(18,2),
    ""CostClosing"" DECIMAL(18,2)
);";

        if (!_db.IsSqlServer) await conn.ExecuteAsync("DROP TABLE IF EXISTS _tempsummary");
        await using var tempCmd = conn.CreateCommand();
        tempCmd.CommandText = tempTableSql;
        await tempCmd.ExecuteNonQueryAsync();

        string insertSql;
        var parameters = new DynamicParameters();
        parameters.Add("finYear", finYear);
        parameters.Add("fromPeriod", fromPeriod);
        parameters.Add("toPeriod", toPeriod);

        if (isSummary)
        {
            insertSql = $@"
INSERT INTO {tmpTable}
SELECT
    ""AssetRegisterItemID"",
    ""FinancialYear"",
    0,
    ts.""RemainingUsefulLife"",
    ts.""OpeningBalance"" - SUM(ts.""AdditionVaue""),
    ts.""CurrentValue"",
    ts.""AccumulatedDepreciationOpeningBalance"",
    SUM(ts.""DepreciationValue""),
    ts.""AccumulatedDepreciationClosingBalance"",
    ts.""AccumulatedImpairmentOpeningBalance"",
    SUM(ts.""ImpairmentValue""),
    ts.""AccumulatedImpairmentClosingBalance"",
    ts.""AccumulatedFairValueOpeningBalance"",
    SUM(ts.""FairValue""),
    ts.""AccumulatedFairValueClosingBalance"",
    ts.""AccumulatedRevaluationOpeningBalance"",
    SUM(ts.""RevaluationValue""),
    ts.""AccumulatedRevaluationClosingBalance"",
    ts.""AccumulatedImpairmentReversalOpeningBalance"",
    SUM(ts.""ImpairmentReversalValue""),
    ts.""AccumulatedImpairmentReversalClosingBalance"",
    ts.""AdditionOpeningBalance"",
    SUM(ts.""AdditionVaue""),
    ts.""AdditionClosingBalance"",
    ts.""MovementInRevaluationReserve"",
    ts.""DepreciationOffsetOpeningBalance"",
    SUM(ts.""DepreciationOffset""),
    ts.""DepreciationOffsetClosingBalance"",
    ts.""RevaluationReserveImpairmentOpeningBalance"",
    SUM(ts.""RevaluationReserveImpairment""),
    SUM(ts.""RevaluationReserveImpairmentReversal""),
    ts.""RevaluationReserveImpairmentClosingBalance"",
    SUM(ts.""RevaluationReserveRevaluation""),
    SUM(ts.""RevaluationReserveDisposal""),
    SUM(ts.""DepreciationAdjustment""),
    SUM(ts.""TransferFromValue""),
    SUM(ts.""TransferToValue""),
    SUM(ts.""RefurbDTValue""),
    SUM(ts.""RefurbCTValue""),
    SUM(ts.""RefurbDepreciationValue""),
    SUM(ts.""RefurbRevaluationValue""),
    ts.""CostOpeningBalance"",
    ts.""CostClosingBalance""
FROM (
    SELECT DISTINCT
        ""AssetRegisterItemID"",
        ""FinancialYear"",
        ""FinancialPeriod"",
        LAST_VALUE(""RemainingUsefulLife"") OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" ASC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""RemainingUsefulLife"",
        LAST_VALUE(""CurrentValue"") OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" DESC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""OpeningBalance"",
        LAST_VALUE(""CurrentValue"") OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" ASC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""CurrentValue"",
        LAST_VALUE(""AccumulatedDepreciationOpeningBalance"") OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" DESC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""AccumulatedDepreciationOpeningBalance"",
        ""DepreciationValue"",
        LAST_VALUE(""AccumulatedDepreciationClosingBalance"") OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" ASC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""AccumulatedDepreciationClosingBalance"",
        LAST_VALUE(""AccumulatedImpairmentOpeningBalance"") OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" DESC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""AccumulatedImpairmentOpeningBalance"",
        ""ImpairmentValue"",
        LAST_VALUE(""AccumulatedImpairmentClosingBalance"") OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" ASC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""AccumulatedImpairmentClosingBalance"",
        LAST_VALUE(""AccumulatedFairValueOpeningBalance"") OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" DESC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""AccumulatedFairValueOpeningBalance"",
        ""FairValue"",
        LAST_VALUE(""AccumulatedFairValueClosingBalance"") OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" ASC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""AccumulatedFairValueClosingBalance"",
        LAST_VALUE(""AccumulatedRevaluationOpeningBalance"") OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" DESC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""AccumulatedRevaluationOpeningBalance"",
        ""RevaluationValue"",
        LAST_VALUE(""AccumulatedRevaluationClosingBalance"") OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" ASC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""AccumulatedRevaluationClosingBalance"",
        LAST_VALUE(""AccumulatedImpairmentReversalOpeningBalance"") OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" DESC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""AccumulatedImpairmentReversalOpeningBalance"",
        ""ImpairmentReversalValue"",
        LAST_VALUE(""AccumulatedImpairmentReversalClosingBalance"") OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" ASC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""AccumulatedImpairmentReversalClosingBalance"",
        LAST_VALUE(""AdditionOpeningBalance"") OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" DESC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""AdditionOpeningBalance"",
        ""AdditionVaue"",
        LAST_VALUE(""AdditionClosingBalance"") OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" ASC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""AdditionClosingBalance"",
        LAST_VALUE(COALESCE(""MovementInRevaluationReserve"",0)) OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" ASC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""MovementInRevaluationReserve"",
        LAST_VALUE(COALESCE(""DepreciationOffsetOpeningBalance"",0)) OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" DESC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""DepreciationOffsetOpeningBalance"",
        COALESCE(""DepreciationOffset"",0) AS ""DepreciationOffset"",
        LAST_VALUE(COALESCE(""DepreciationOffsetClosingBalance"",0)) OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" ASC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""DepreciationOffsetClosingBalance"",
        LAST_VALUE(COALESCE(""RevaluationReserveImpairmentOpeningBalance"",0)) OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" DESC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""RevaluationReserveImpairmentOpeningBalance"",
        COALESCE(""RevaluationReserveImpairment"",0) AS ""RevaluationReserveImpairment"",
        COALESCE(""RevaluationReserveImpairmentReversal"",0) AS ""RevaluationReserveImpairmentReversal"",
        LAST_VALUE(COALESCE(""RevaluationReserveImpairmentClosingBalance"",0)) OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" ASC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""RevaluationReserveImpairmentClosingBalance"",
        COALESCE(""RevaluationReserveRevaluation"",0) AS ""RevaluationReserveRevaluation"",
        COALESCE(""RevaluationReserveDisposal"",0) AS ""RevaluationReserveDisposal"",
        COALESCE(""DepreciationAdjustment"",0) AS ""DepreciationAdjustment"",
        COALESCE(""TransferFromValue"",0) AS ""TransferFromValue"",
        COALESCE(""TransferToValue"",0) AS ""TransferToValue"",
        COALESCE(""RefurbDTValue"",0) AS ""RefurbDTValue"",
        COALESCE(""RefurbCTValue"",0) AS ""RefurbCTValue"",
        COALESCE(""RefurbDepreciationValue"",0) AS ""RefurbDepreciationValue"",
        COALESCE(""RefurbRevaluationValue"",0) AS ""RefurbRevaluationValue"",
        LAST_VALUE(COALESCE(""CostOpeningBalance"",0)) OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" DESC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""CostOpeningBalance"",
        LAST_VALUE(COALESCE(""CostClosingBalance"",0)) OVER (PARTITION BY ""AssetRegisterItemID"" ORDER BY ""ID"" ASC ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS ""CostClosingBalance""
    FROM ""Asset_Transaction_Summary""
    WHERE ""FinancialYear"" = @finYear
      AND ""FinancialPeriod"" >= @fromPeriod
      AND ""FinancialPeriod"" <= @toPeriod
      AND (@assetId IS NULL OR ""AssetRegisterItemID"" = @assetId)
) ts
GROUP BY
    ""AssetRegisterItemID"", ""FinancialYear"",
    ""CurrentValue"", ""OpeningBalance"",
    ""AccumulatedDepreciationOpeningBalance"", ""AccumulatedDepreciationClosingBalance"",
    ""AccumulatedImpairmentOpeningBalance"", ""AccumulatedImpairmentClosingBalance"",
    ""AccumulatedFairValueOpeningBalance"", ""AccumulatedFairValueClosingBalance"",
    ""AccumulatedRevaluationOpeningBalance"", ""AccumulatedRevaluationClosingBalance"",
    ""AccumulatedImpairmentReversalOpeningBalance"", ""AccumulatedImpairmentReversalClosingBalance"",
    ""AdditionOpeningBalance"", ""AdditionClosingBalance"", ""RemainingUsefulLife"",
    ""DepreciationOffsetOpeningBalance"", ""DepreciationOffsetClosingBalance"",
    ""RevaluationReserveImpairmentOpeningBalance"", ""RevaluationReserveImpairmentClosingBalance"",
    ""CostOpeningBalance"", ""CostClosingBalance"",
    ""MovementInRevaluationReserve""";
        }
        else
        {
            insertSql = $@"
INSERT INTO {tmpTable}
SELECT
    ""AssetRegisterItemID"",
    ""FinancialYear"",
    ""FinancialPeriod"",
    ""RemainingUsefulLife"",
    ""CurrentValue"" - ""AdditionVaue"",
    ""CurrentValue"",
    ""AccumulatedDepreciationOpeningBalance"",
    ""DepreciationValue"",
    ""AccumulatedDepreciationClosingBalance"",
    ""AccumulatedImpairmentOpeningBalance"",
    ""ImpairmentValue"",
    ""AccumulatedImpairmentClosingBalance"",
    ""AccumulatedFairValueOpeningBalance"",
    ""FairValue"",
    ""AccumulatedFairValueClosingBalance"",
    ""AccumulatedRevaluationOpeningBalance"",
    ""RevaluationValue"",
    ""AccumulatedRevaluationClosingBalance"",
    ""AccumulatedImpairmentReversalOpeningBalance"",
    ""ImpairmentReversalValue"",
    ""AccumulatedImpairmentReversalClosingBalance"",
    ""AdditionOpeningBalance"",
    ""AdditionVaue"",
    ""AdditionClosingBalance"",
    ""MovementInRevaluationReserve"",
    COALESCE(""DepreciationOffsetOpeningBalance"",0),
    COALESCE(""DepreciationOffset"",0),
    COALESCE(""DepreciationOffsetClosingBalance"",0),
    COALESCE(""RevaluationReserveImpairmentOpeningBalance"",0),
    COALESCE(""RevaluationReserveImpairment"",0),
    COALESCE(""RevaluationReserveImpairmentReversal"",0),
    COALESCE(""RevaluationReserveImpairmentClosingBalance"",0),
    COALESCE(""RevaluationReserveRevaluation"",0),
    COALESCE(""RevaluationReserveDisposal"",0),
    COALESCE(""DepreciationAdjustment"",0),
    COALESCE(""TransferFromValue"",0),
    COALESCE(""TransferToValue"",0),
    COALESCE(""RefurbDTValue"",0),
    COALESCE(""RefurbCTValue"",0),
    COALESCE(""RefurbDepreciationValue"",0),
    COALESCE(""RefurbRevaluationValue"",0),
    COALESCE(""CostOpeningBalance"",0),
    COALESCE(""CostClosingBalance"",0)
FROM ""Asset_Transaction_Summary""
WHERE ""FinancialYear"" = @finYear
  AND ""FinancialPeriod"" >= @fromPeriod
  AND ""FinancialPeriod"" <= @toPeriod
  AND (@assetId IS NULL OR ""AssetRegisterItemID"" = @assetId)";
        }

        if (assetId.HasValue)
            parameters.Add("assetId", assetId.Value);

        var insertSqlFinal = insertSql;
        if (!assetId.HasValue)
            insertSqlFinal = insertSqlFinal.Replace("AND (@assetId IS NULL OR \"AssetRegisterItemID\" = @assetId)", "");

        await conn.ExecuteAsync(insertSqlFinal, parameters, commandTimeout: 120);

        var filters = new List<string>();
        var mainParams = new DynamicParameters();
        mainParams.Add("finYear", finYear);

        if (assetId.HasValue)
        {
            filters.Add(@"i.""AssetRegisterItem_ID"" = @assetId");
            mainParams.Add("assetId", assetId.Value);
        }
        if (assetStatus.HasValue)
        {
            filters.Add(@"i.""AssetStatus_ID"" = @assetStatus");
            mainParams.Add("assetStatus", assetStatus.Value);
        }
        if (categoryId.HasValue)
        {
            filters.Add(@"i.""AssetCategory_ID"" = @categoryId");
            mainParams.Add("categoryId", categoryId.Value);
        }
        if (subCategoryId.HasValue)
        {
            filters.Add(@"i.""Asset_SubCategory_ID"" = @subCategoryId");
            mainParams.Add("subCategoryId", subCategoryId.Value);
        }
        if (classId.HasValue)
        {
            filters.Add(@"i.""AssetClass_ID"" = @classId");
            mainParams.Add("classId", classId.Value);
        }
        if (typeId.HasValue)
        {
            filters.Add(@"i.""AssetType_ID"" = @typeId");
            mainParams.Add("typeId", typeId.Value);
        }
        if (!string.IsNullOrWhiteSpace(description))
        {
            filters.Add(@"i.""Description"" LIKE @description");
            mainParams.Add("description", "%" + description + "%");
        }

        var whereClause = filters.Count > 0
            ? "AND " + string.Join(" AND ", filters)
            : "";

        string sqlDeptCheck = _db.IsSqlServer
            ? @"TRY_CAST(i.""MunicipalDepartment_ID"" AS INT) IS NOT NULL"
            : @"i.""MunicipalDepartment_ID"" ~ '^\d+$'";
        string sqlSuburbCheck = _db.IsSqlServer
            ? @"TRY_CAST(i.""Suburb"" AS INT) IS NOT NULL"
            : @"i.""Suburb"" ~ '^\d+$'";
        string sqlDispJoin = _db.IsSqlServer
            ? @"OUTER APPLY (
    SELECT SUM(ds.""DisposalValue"") AS ""DisposalValue"",
           SUM(ds.""DisposalLossValue"") AS ""DisposalLossValue""
    FROM ""Asset_Register_Transactions"" ds
    WHERE ds.""TransactionTypeID"" = 26
      AND ds.""AssetRegisterItem_ID"" = i.""AssetRegisterItem_ID""
      AND ds.""FinancialYear"" = @finYear
) adisp"
            : @"LEFT JOIN LATERAL (
    SELECT SUM(ds.""DisposalValue"") AS ""DisposalValue"",
           SUM(ds.""DisposalLossValue"") AS ""DisposalLossValue""
    FROM ""Asset_Register_Transactions"" ds
    WHERE ds.""TransactionTypeID"" = 26
      AND ds.""AssetRegisterItem_ID"" = i.""AssetRegisterItem_ID""
      AND ds.""FinancialYear"" = @finYear
) adisp ON TRUE";

        var mainSql = $@"
SELECT
  @finYear AS ""FinYear""
, ats.""FinancialPeriod""
, i.""AssetClass_ID""
, i.""Asset_SubCategory_ID""
, i.""AssetCategory_ID""
, i.""AssetType_ID""
, i.""AssetStatus_ID""
, i.""GIS_ID""
, i.""ErfNumber""
, i.""AssetRegisterItem_ID""
, i.""MunicipalAssetID""
, i.""ParentAssetRegisterItem_ID""
, i.""MainAssetDescription""
, i.""MainAssetID""
, i.""Description""
, i.""OldBarCode""
, i.""Barcode""
, i.""ImageRef""
, astp.""AssetTypeDesc""
, acc.""AssetCategoryDesc""
, sc.""Asset_SubCategoryDescription""
, cac.""AssetClassDesc""
, meas.""Name"" AS ""MeasurementType""
, cas.""AssetStatusDesc""
, sct.""AssetCIDMSSubComponentTypeDesc""
, ct.""AssetCIDMSComponentTypeDesc""
, acg.""AssetAccountGroupDesc""
, asg.""AssetAccountSubGroupDesc""
, cla.""AssetCIDMSClassDesc""
, gt.""AssetCIDMSGroupTypeDesc""
, cat.""AssetCIDMSAssetTypeDesc""
, CASE WHEN sct.""Nature"" = '1' THEN 'New'
       WHEN sct.""Nature"" = '2' THEN 'Existing- Renewal'
       WHEN sct.""Nature"" = '3' THEN 'Existing- Upgrade'
       ELSE '' END AS ""NatureOfAddition""
, CASE WHEN sct.""Infrastructure"" = '0' THEN 'Non Infrastructure'
       WHEN sct.""Infrastructure"" = '1' THEN 'Infrastructure'
       ELSE '' END AS ""InfrastructureNonInfrastructure""
, CASE WHEN COALESCE(i.""CashOrNoncashgeneratingunit"", '') IN ('Non','1') THEN 'Non Cash'
       WHEN COALESCE(i.""CashOrNoncashgeneratingunit"", '') = '' THEN ''
       ELSE 'Cash' END AS ""CashNonCashGeneratingUnit""
, afs.""FinancialStatusDesc""
, i.""DateOfTakeOnBalancesImported"" AS ""TakeOnDate""
, i.""AcquisitionDate""
, '' AS ""DateofRefurbishmentImprovement""
, i.""InserviceDate""
, CASE WHEN i.""DateOfDisposal"" IS NOT NULL AND i.""DateOfDisposal"" > '1900-01-02' THEN i.""DateOfDisposal"" ELSE NULL END AS ""DisposalDate""
, i.""DisposalReason""
, CASE WHEN i.""Impairment_Date"" IS NOT NULL AND i.""Impairment_Date"" > '1900-01-02' THEN i.""Impairment_Date"" ELSE NULL END AS ""ImpairmentDate""
, (SELECT art2.""TransactionDate"" FROM ""Asset_Register_Transactions"" art2 WHERE art2.""AssetRegisterItem_ID"" = i.""AssetRegisterItem_ID"" ORDER BY art2.""ID"" DESC OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY) AS ""DateModified""
, i.""VerificationDate""
, '' AS ""VerificationDoneBy""
, i.""YearConstructed""
, i.""CommisioningDate""
, i.""ConstructionMaterial""
, i.""ForecastReplacementYear""
, acr.""Description"" AS ""AssetCondition""
, i.""InsuranceCover""
, COALESCE(i.""InsuranceNumberReference"", '') AS ""InsurancePolicyNo""
, CASE WHEN i.""Warranty"" = '1' OR UPPER(CAST(i.""Warranty"" AS VARCHAR)) = 'YES' THEN 'Yes'
       WHEN i.""Warranty"" = '0' OR UPPER(CAST(i.""Warranty"" AS VARCHAR)) = 'NO' THEN 'No'
       ELSE COALESCE(CAST(i.""Warranty"" AS VARCHAR), '') END AS ""Warranty""
, i.""CurrentReplacementCostCRC""
, CASE WHEN COALESCE(adisp.""DisposalValue"", 0) <> 0 THEN 0 ELSE i.""DepreciatedReplacementCostDRC"" END AS ""DepreciatedReplacementCostDRC""
, i.""AnnualisedMaintenanceCRC""
, i.""AnnualMaintenanceBudgetNeed""
, dm.""AssetDepreciationMethodDesc""
, COALESCE(i.""UsefulLifeYearComponent"", COALESCE(i.""UsefulLifeMonthComponent"",0)/12) AS ""UsefulLifeYearComponent""
, i.""UsefulLifeMonthComponent""
, COALESCE(i.""UsefulLifeMonthComponent"",0)/12*365 AS ""UsefulLifeDaysComponent""
, 0 AS ""RevisedUsefulLifeYearComponent""
, 0 AS ""RevisedUsefulLifeMonthComponent""
, 0 AS ""RevisedUsefulLifeDaysComponent""
, COALESCE(i.""RemainingUsefulLife"",0)/12 AS ""RemainingUsefulLifeYearComponent""
, i.""RemainingUsefulLife"" AS ""RemainingUsefulLifeMonthComponent""
, COALESCE(i.""RemainingUsefulLife"",0)/12*365 AS ""RemainingUsefulLifeDaysComponent""
, i.""RemainingUsefulLifeAtTakeOn""
, 0 AS ""RevisedRemainingUsefulLifeYearComponent""
, 0 AS ""RevisedRemainingUsefulLifeMonthComponent""
, 0 AS ""RevisedRemainingUsefulLifeDaysComponent""
, COALESCE(i.""UoM""::TEXT, '') AS ""UoM""
, i.""Dim1""
, i.""Dim2""
, i.""Dim3""
, i.""DimensionQuantity""
, i.""Quantity""
, 0 AS ""Diameter""
, 0 AS ""Capacity""
, i.""SGNumberChange_ID"" AS ""SGKey""
, i.""DeedNumber""
, i.""ErfNumber"" AS ""ErfFarmNumber""
, i.""ErfSizeM2""
, i.""PortionNumber""
, i.""UnitNumber""
, i.""RegistrationNumber""
, i.""SerialNumber""
, '' AS ""CustodianName""
, '' AS ""CustodianIDNumber""
, cbms.""AssetMunicipalServicesDesc""
, crit.""AssetCriticalityGradeDesc"" AS ""AssetCriticalityGradeDesc""
, pergrd.""AssetPerformanceGradeDesc"" AS ""AssetPerformanceGradeDesc""
, util.""AssetUtilisationGradeDesc"" AS ""AssetUtilisationGradeDesc""
, hg.""AssetHealthGradeDesc"" AS ""AssetHealthGradeDesc""
, COALESCE(i.""ConsequenceOfFailure"", '') AS ""ConsequenceOfFailure""
, CASE WHEN i.""Risk"" = 0 THEN 'Very Low'
       WHEN i.""Risk"" = 1 THEN 'Low'
       WHEN i.""Risk"" = -1 THEN ''
       WHEN i.""Risk"" = 2 THEN 'Medium'
       WHEN i.""Risk"" = 3 THEN 'High'
       WHEN i.""Risk"" = 4 THEN 'Very High'
       ELSE COALESCE(CAST(i.""Risk"" AS VARCHAR), '') END AS ""Risk""
, i.""AssetOwnershipName""
, COALESCE(i.""MunicipalDepartment_ID"", '') AS ""Department""
, '' AS ""Division""
, COALESCE(i.""Town_ID""::TEXT, '') AS ""Town""
, COALESCE(i.""Street_ID""::TEXT, '') AS ""StreetAddress""
, COALESCE(i.""Building_ID""::TEXT, '') AS ""Building""
, COALESCE(i.""Ward_ID""::TEXT, '') AS ""Ward""
, COALESCE(i.""Zoning_ID""::TEXT, '') AS ""Zoning""
, COALESCE(i.""FloorID""::TEXT, '') AS ""Floor""
, COALESCE(i.""Room_ID""::TEXT, '') AS ""Room""
, COALESCE(i.""SuburbID""::TEXT, i.""Suburb"", '') AS ""Suburb""
, i.""WellKnownTextWKT""
, i.""latitude"" AS ""Latitude""
, i.""longitude"" AS ""Longitude""
, i.""FundingSourceAmount""
, i.""FundingSourceNumber""
, i.""FundType""
, i.""CostOfAddition""
, COALESCE(ats.""AccumulatedRevaluationOpeningBalance"", 0) AS ""AccumulatedRevalutionsOpeningBalance""
, COALESCE(ats.""RevaluationReserveImpairmentOpeningBalance"", 0) AS ""RevaluationReserveImpairmentOpeningBalance""
, COALESCE(ats.""RevaluationReserveImpairment"", 0) AS ""RevaluationReserveImpairments""
, COALESCE(ats.""RevaluationReserveImpairmentReversal"", 0) AS ""RevaluationReserveImpairmentReversals""
, COALESCE(ats.""RevaluationReserveImpairmentClosingBalance"", 0) AS ""RevaluationReserveImpairmentClosingBalance""
, COALESCE(ats.""RevaluationReserveRevaluation"", 0) AS ""RevaluationReserveRevaluations""
, COALESCE(ats.""RevaluationReserveDisposal"", 0) AS ""RevaluationReserveDisposals""
, COALESCE(ats.""RefurbRevaluationValue"", 0) AS ""RefurbRevaluation""
, CASE WHEN COALESCE(adisp.""DisposalValue"", 0) <> 0 THEN 0
       WHEN COALESCE(ats.""AccumulatedRevaluationClosingBalance"", 0) < 0 THEN 0
       ELSE COALESCE(ats.""AccumulatedRevaluationClosingBalance"", 0) END AS ""AccumulatedRevaluationClosingBalance""
, COALESCE(ats.""MovementInRevaluationReserve"", 0) AS ""MovementInRevaluationReserve""
, COALESCE(ats.""DepreciationOffsetOpeningBalance"", 0) AS ""DepreciationOffsetOpeningBalance""
, COALESCE(ats.""DepreciationOffset"", 0) AS ""DepreciationOffset""
, COALESCE(ats.""DepreciationOffsetClosingBalance"", 0) AS ""DepreciationOffsetClosingBalance""
, CASE WHEN COALESCE(adisp.""DisposalValue"", 0) <> 0 THEN 0
       ELSE COALESCE(ats.""AccumulatedRevaluationClosingBalance"", 0) END AS ""RevaluationSurplusDeficit""
, i.""DeemedCost""
, CASE WHEN COALESCE(ats.""AdditionVaue"", 0) > 0 THEN 0
       ELSE GREATEST(0, COALESCE(ats.""CostOpening"", 0)) END AS ""CostRestatedOpeningBalance""
, COALESCE(ats.""AdditionVaue"", 0) AS ""Acquisitions""
, COALESCE(i.""ResidualValue"", 0) AS ""ResidualValue""
, 0 AS ""RevisedResidualValue""
, 0 AS ""DecommisioningRestorationandSimilarLiabilities""
, 0 AS ""WorkInProgressAmount""
, COALESCE(ats.""TransferFromAmount"", 0) AS ""TransferFromAmount""
, COALESCE(ats.""TransferToAmount"", 0) AS ""TransferToAmount""
, COALESCE(ats.""RefurbDTValue"", 0) AS ""RefurbDebitAmount""
, COALESCE(ats.""RefurbCTValue"", 0) AS ""RefurbCreditAmount""
, 0 AS ""ChangeinAccountingEstimate""
, COALESCE(ats.""FairValue"", 0) AS ""FairValueAdjustment""
, COALESCE(ats.""RevaluationValue"", 0) AS ""Revaluation""
, CASE WHEN COALESCE(adisp.""DisposalValue"", 0) <> 0 THEN COALESCE(i.""PurchaseAmount"", 0) + COALESCE(ats.""RevaluationValue"", 0) ELSE 0 END AS ""DisposalValue""
, GREATEST(0, COALESCE(ats.""CostClosing"", 0)) AS ""CostClosingBalance""
, COALESCE(ats.""AccumulatedDepreciationOpeningBalance"", 0) AS ""AccumulatedDepreciationOpeningBalance""
, 0 AS ""DepreciationOtherChanges""
, COALESCE(ats.""AccumulatedDepreciationOpeningBalance"", 0) AS ""DepreciationRestatedOpeningBalance""
, COALESCE(ats.""DepreciationValue"", 0) AS ""Depreciation""
, COALESCE(ats.""DepreciationAdjustment"", 0) AS ""DepreciationAdjustments""
, CASE WHEN COALESCE(adisp.""DisposalValue"", 0) <> 0 THEN COALESCE(ats.""AccumulatedDepreciationClosingBalance"", 0) ELSE 0 END AS ""DisposalDepreciation""
, 0 AS ""DepreciationTransfer""
, COALESCE(ats.""RefurbDepreciationValue"", 0) AS ""RefurbDepreciation""
, CASE WHEN COALESCE(adisp.""DisposalValue"", 0) <> 0 THEN 0 ELSE COALESCE(ats.""AccumulatedDepreciationClosingBalance"", 0) END AS ""DepreciationClosingBalance""
, COALESCE(ats.""AccumulatedImpairmentOpeningBalance"", 0) AS ""AccumulatedImpairmentOpeningBalance""
, 0 AS ""ImpairmentOtherChanges""
, COALESCE(ats.""AccumulatedImpairmentOpeningBalance"", 0) AS ""ImpairmentRestatedOpeningBalance""
, COALESCE(ats.""ImpairmentValue"", 0) AS ""Impairment""
, COALESCE(ats.""ImpairmentReversalValue"", 0) AS ""ImpairmentReversal""
, CASE WHEN COALESCE(adisp.""DisposalValue"", 0) <> 0 THEN COALESCE(ats.""AccumulatedImpairmentClosingBalance"", 0) ELSE 0 END AS ""DisposalImpairment""
, 0 AS ""ImpairmentTransfers""
, CASE WHEN COALESCE(adisp.""DisposalValue"", 0) <> 0 THEN 0 ELSE COALESCE(ats.""AccumulatedImpairmentClosingBalance"", 0) END AS ""ImpairmentClosingBalance""
, GREATEST(0, COALESCE(ats.""CostClosing"", 0) - COALESCE(ats.""AccumulatedDepreciationClosingBalance"", 0) - COALESCE(ats.""AccumulatedImpairmentClosingBalance"", 0)) AS ""CarryingAmount""
, COALESCE(i.""DisposalProceeds"", 0) AS ""DisposalProceeds""
, COALESCE(adisp.""DisposalLossValue"", 0) AS ""DisposalProfitLoss""
, '' AS ""ReasonforAssetAdjustment""
, i.""Donor_ID"" AS ""DonorIDRegistrationNumberParastatalCode""
, i.""Donor_Name"" AS ""DonorNameCompanyNameParastatalName""
, i.""Date_Donated"" AS ""DateDonated""
, 0 AS ""RULPY""
, 0 AS ""RULCY""
, 0 AS ""RULRevisedPY""
, 0 AS ""RevisedULCY""
, '' AS ""LastDateRULRevised""
, '' AS ""RULChangeReason""
, i.""Make""
, i.""Model""
, i.""Custom_1""
, i.""Custom_2""
, i.""Custom_3""
, i.""Custom_4""
, i.""Custom_5""
, i.""Custom_6""
, i.""Custom_7""
, i.""Custom_8""
, i.""Custom_9""
FROM ""Asset_Register_Items"" i
LEFT JOIN {tmpTable} ats ON i.""AssetRegisterItem_ID"" = ats.""AssetRegisterItemID""
LEFT JOIN ""Const_AssetClass_sys"" cac ON i.""AssetClass_ID"" = cac.""AssetClass_ID""
LEFT JOIN ""Const_AssetDepreciationMethod_Sys"" dm ON cac.""AssetDepreciationMethod_ID"" = dm.""AssetDepreciationMethod_ID""
LEFT JOIN ""AssetConfig_MeasurementType"" meas ON i.""MeasurementType_ID"" = meas.""AssetConfig_MeasurementType_ID""
LEFT JOIN ""AssetConfig_FinancialStatus"" afs ON i.""Financial_Status_ID"" = afs.""FinStatusID""
LEFT JOIN ""Const_AssetType_Sys"" astp ON i.""AssetType_ID"" = astp.""AssetType_ID""
LEFT JOIN ""Const_AssetCategory_sys"" acc ON i.""AssetCategory_ID"" = acc.""AssetCategoryID""
LEFT JOIN ""Const_Asset_SubCategory"" sc ON i.""Asset_SubCategory_ID"" = sc.""Asset_SubCategory_ID""
LEFT JOIN ""Const_AssetStatus_Sys"" cas ON i.""AssetStatus_ID"" = cas.""AssetStatus_ID""
LEFT JOIN ""Const_Asset_Condition"" acr ON i.""AssetCondition_ID"" = acr.""Asset_Condition_ID""
LEFT JOIN ""Const_Asset_CIDMS_SubComponent_Type"" sct ON i.""CIDMSSubComponentTypeID"" = sct.""AssetCIDMSSubComponentTypeID""
LEFT JOIN ""Const_Asset_CIDMS_Component_Type"" ct ON sct.""AssetCIDMSComponentTypeID"" = ct.""AssetCIDMSComponentTypeID""
LEFT JOIN ""Const_Asset_CIDMS_Asset_Type"" cat ON ct.""AssetCIDMSAssetTypeID"" = cat.""AssetCIDMSAssetTypeID""
LEFT JOIN ""Const_Asset_CIDMS_Group_Type"" gt ON cat.""AssetCIDMSGroupTypeID"" = gt.""AssetCIDMSGroupTypeID""
LEFT JOIN ""Const_Asset_CIDMS_Class"" cla ON gt.""AssetCIDMSClassID"" = cla.""AssetCIDMSClassID""
LEFT JOIN ""Const_Asset_CIDMS_Accounting_Sub_Group"" asg ON cla.""AssetAccountSubGroupID"" = asg.""AssetAccountSubGroupID""
LEFT JOIN ""Const_Asset_CIDMS_Accounting_Group"" acg ON asg.""AssetAccountGroupID"" = acg.""AssetAccountGroupID""
LEFT JOIN ""Const_Asset_CIDMS_Municipal_Services"" cbms ON i.""BasicMunicipalityService"" = cbms.""AssetMunicipalServicesID""
LEFT JOIN ""Const_Asset_Criticality_Grade"" crit ON i.""CriticalityGrade"" = crit.""AssetCriticalityGradeID""
LEFT JOIN ""Const_Asset_Performance_Grade"" pergrd ON i.""PerformanceGrade"" = pergrd.""AssetPerformanceGradeID""
LEFT JOIN ""Const_Asset_Utilisation_Grade"" util ON i.""UtilisationGrade"" = util.""AssetUtilisationGradeID""
LEFT JOIN ""Const_Asset_Health_Grade"" hg ON i.""InfrastructureHealthGrade"" = hg.""AssetHealthGradeID""
{sqlDispJoin}
WHERE (i.""DateOfTakeOnBalancesImported"" IS NOT NULL OR i.""ManagedFlag"" = 1)
  AND (COALESCE(ats.""CostOpening"", 0) > 0 OR COALESCE(ats.""CostClosing"", 0) > 0 OR COALESCE(ats.""TransferFromAmount"", 0) > 0 OR COALESCE(ats.""TransferToAmount"", 0) > 0 OR COALESCE(ats.""AdditionVaue"", 0) > 0)
  {whereClause}
ORDER BY i.""AssetRegisterItem_ID"", ats.""FinancialPeriod""";

        var results = (await conn.QueryAsync(mainSql, mainParams, commandTimeout: 120)).AsList();

        return Ok(new
        {
            finYear,
            isSummary,
            fromPeriod,
            toPeriod,
            totalRecords = results.Count,
            data = results
        });
    }

    [HttpGet("far-drilldown")]
    public async Task<IActionResult> GetFarDrilldown(
        [FromQuery] int assetId,
        [FromQuery] string? finYear = null,
        [FromQuery] int fromPeriod = 1,
        [FromQuery] int toPeriod = 12)
    {
        if (string.IsNullOrEmpty(finYear))
        {
            var now = DateTime.Now;
            finYear = now.Month >= 7 ? $"{now.Year}/{now.Year + 1}" : $"{now.Year - 1}/{now.Year}";
        }

        if (fromPeriod < 1) fromPeriod = 1;
        if (toPeriod > 12) toPeriod = 12;
        if (fromPeriod > toPeriod) fromPeriod = toPeriod;

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var periodMonths = new Dictionary<int, string> {
            {1,"July"},{2,"August"},{3,"September"},{4,"October"},{5,"November"},{6,"December"},
            {7,"January"},{8,"February"},{9,"March"},{10,"April"},{11,"May"},{12,"June"}
        };

        var sql = @"
SELECT
    ats.""FinancialPeriod"",
    ats.""FinancialYear"",
    COALESCE(ats.""CostOpeningBalance"", 0) AS ""CostOpeningBalance"",
    COALESCE(ats.""AdditionVaue"", 0) AS ""AdditionVaue"",
    COALESCE(ats.""DisposalValue"", 0) AS ""DisposalValue"",
    COALESCE(ats.""TransferFromValue"", 0) AS ""TransferFromValue"",
    COALESCE(ats.""TransferToValue"", 0) AS ""TransferToValue"",
    COALESCE(ats.""FairValue"", 0) AS ""FairValue"",
    COALESCE(ats.""RevaluationValue"", 0) AS ""RevaluationValue"",
    COALESCE(ats.""RefurbDTValue"", 0) AS ""RefurbDTValue"",
    COALESCE(ats.""RefurbCTValue"", 0) AS ""RefurbCTValue"",
    COALESCE(ats.""RefurbRevaluationValue"", 0) AS ""RefurbRevaluationValue"",
    COALESCE(ats.""CostClosingBalance"", 0) AS ""CostClosingBalance"",
    COALESCE(ats.""AccumulatedDepreciationOpeningBalance"", 0) AS ""AccumulatedDepreciationOpeningBalance"",
    COALESCE(ats.""DepreciationValue"", 0) AS ""DepreciationValue"",
    COALESCE(ats.""DepreciationAdjustment"", 0) AS ""DepreciationAdjustment"",
    COALESCE(ats.""RefurbDepreciationValue"", 0) AS ""RefurbDepreciationValue"",
    COALESCE(ats.""AccumulatedDepreciationClosingBalance"", 0) AS ""AccumulatedDepreciationClosingBalance"",
    COALESCE(ats.""AccumulatedImpairmentOpeningBalance"", 0) AS ""AccumulatedImpairmentOpeningBalance"",
    COALESCE(ats.""ImpairmentValue"", 0) AS ""ImpairmentValue"",
    COALESCE(ats.""ImpairmentReversalValue"", 0) AS ""ImpairmentReversalValue"",
    COALESCE(ats.""AccumulatedImpairmentClosingBalance"", 0) AS ""AccumulatedImpairmentClosingBalance"",
    COALESCE(ats.""CarryingAmount"", 0) AS ""CarryingAmount"",
    COALESCE(ats.""DepreciationOffsetOpeningBalance"", 0) AS ""DepreciationOffsetOpeningBalance"",
    COALESCE(ats.""DepreciationOffset"", 0) AS ""DepreciationOffset"",
    COALESCE(ats.""DepreciationOffsetClosingBalance"", 0) AS ""DepreciationOffsetClosingBalance"",
    COALESCE(ats.""AccumulatedRevaluationOpeningBalance"", 0) AS ""AccumulatedRevaluationOpeningBalance"",
    COALESCE(ats.""MovementInRevaluationReserve"", 0) AS ""MovementInRevaluationReserve"",
    COALESCE(ats.""AccumulatedRevaluationClosingBalance"", 0) AS ""AccumulatedRevaluationClosingBalance"",
    COALESCE(ats.""RemainingUsefulLife"", 0) AS ""RemainingUsefulLife"",
    COALESCE(ats.""CurrentValue"", 0) AS ""CurrentValue"",
    COALESCE(ats.""AccumulatedFairValueOpeningBalance"", 0) AS ""AccumulatedFairValueOpeningBalance"",
    COALESCE(ats.""AccumulatedFairValueClosingBalance"", 0) AS ""AccumulatedFairValueClosingBalance"",
    COALESCE(ats.""RevaluationReserveImpairmentOpeningBalance"", 0) AS ""RevaluationReserveImpairmentOpeningBalance"",
    COALESCE(ats.""RevaluationReserveImpairment"", 0) AS ""RevaluationReserveImpairment"",
    COALESCE(ats.""RevaluationReserveImpairmentReversal"", 0) AS ""RevaluationReserveImpairmentReversal"",
    COALESCE(ats.""RevaluationReserveImpairmentClosingBalance"", 0) AS ""RevaluationReserveImpairmentClosingBalance"",
    COALESCE(ats.""RevaluationReserveRevaluation"", 0) AS ""RevaluationReserveRevaluation"",
    COALESCE(ats.""RevaluationReserveDisposal"", 0) AS ""RevaluationReserveDisposal""
FROM ""Asset_Transaction_Summary"" ats
WHERE ats.""AssetRegisterItemID"" = @assetId
  AND ats.""FinancialYear"" = @finYear
  AND ats.""FinancialPeriod"" >= @fromPeriod
  AND ats.""FinancialPeriod"" <= @toPeriod
ORDER BY ats.""FinancialPeriod"" ASC";

        var rows = (await conn.QueryAsync<dynamic>(sql, new { assetId, finYear, fromPeriod, toPeriod })).ToList();

        foreach (var row in rows)
        {
            var rowDict = (IDictionary<string, object>)row;
            int period = Convert.ToInt32(rowDict["FinancialPeriod"]);
            string monthName = periodMonths.ContainsKey(period) ? periodMonths[period] : "";
            rowDict["periodLabel"] = $"P{period} ({monthName})";
        }

        return Ok(rows);
    }

    [HttpGet("far-transaction-drilldown")]
    public async Task<IActionResult> GetFarTransactionDrilldown(
        [FromQuery] int assetId,
        [FromQuery] int period,
        [FromQuery] string? finYear = null)
    {
        if (string.IsNullOrEmpty(finYear))
        {
            int y = DateTime.Now.Month >= 7 ? DateTime.Now.Year : DateTime.Now.Year - 1;
            finYear = $"{y}/{y + 1}";
        }

        if (period < 1) period = 1;
        if (period > 12) period = 12;

        using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        string glGuidCast1 = _db.IsSqlServer ? @"t.""GLGUID_ID""" : @"t.""GLGUID_ID""::uuid";
        var sql = $@"SELECT t.""ID"" AS ""AssetRegisterTransaction_ID"",
                           t.""AssetRegisterItem_ID"",
                           t.""FinancialYear"",
                           t.""FinancialPeriod"",
                           COALESCE(rd.""Description"", CONCAT('Type ', t.""TransactionTypeID"")) AS ""TransactionType"",
                           t.""TransactionDate"",
                           t.""DateModified"" AS ""CaptureDate"",
                           t.""RemaingUsefulLife"",
                           (SELECT g.""DocumentNumber""
                            FROM ""Asset_GeneralLedger"" g
                            WHERE g.""MatchTranGuid"" = {glGuidCast1}
                            OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY) AS ""DocumentNumber"",
                           t.""PurchaseAmount"",
                           t.""ResidualValue"",
                           t.""CurrentValue"",
                           t.""UsefulLife"",
                           t.""DepreciationValue"",
                           t.""ImpairmentValue"",
                           t.""ImpairmentReversalValue"",
                           t.""ImpairmentSurplus"",
                           t.""RevaluationValue"",
                           t.""FairValue"",
                           t.""DisposalValue"",
                           t.""DisposalLossValue"",
                           t.""DisposalTotalValue"",
                           t.""AccumulatedDepreciation"",
                           t.""AccumulatedImpairment"",
                           t.""AccumulatedFairValue"",
                           t.""AccumulatedRevaluation"",
                           t.""DepreciationAdjustment"",
                           t.""DepreciationOffset"",
                           t.""MovementInRevaluationReserve"",
                           t.""RevaluationReserveImpairment"",
                           t.""RevaluationReserveImpairmentReversal"",
                           t.""RevaluationReserveRevaluation"",
                           t.""RevaluationReserveDisposal"",
                           t.""TransferFromValue"",
                           t.""TransferToValue"",
                           t.""RefurbDTValue"",
                           t.""RefurbCTValue"",
                           t.""RefurbDepreciationValue"",
                           t.""RefurbRevaluationValue""
                    FROM ""Asset_Register_Transactions"" t
                    LEFT JOIN ""Const_ReferenceData_sys"" rd
                        ON rd.""ReferenceData_ID"" = t.""TransactionTypeID""
                    WHERE t.""AssetRegisterItem_ID"" = @assetId
                      AND t.""FinancialYear"" = @finYear
                      AND t.""FinancialPeriod"" = @period
                    ORDER BY t.""TransactionDate"", t.""ID""";

        var rows = await conn.QueryAsync(sql, new { assetId, finYear, period });
        return Ok(rows);
    }

    private static readonly int[] DisposalDocTypes = { 306, 29 };
    private const int DisposalAssetTypeId = 26;

    private static async Task<(List<object> Lines, object Summary)> GetDisposalLines(
        System.Data.Common.DbConnection conn, bool isSqlServer, string finYear, int fromPeriod, int toPeriod)
    {
        var assetSql = @"
SELECT
    COALESCE(SUM(COALESCE(t.""AccumulatedDepreciation"", 0)), 0) AS ""AccDep"",
    COALESCE(SUM(COALESCE(t.""AccumulatedImpairment"", 0)), 0) AS ""AccImp"",
    COALESCE(SUM(COALESCE(t.""DisposalValue"", 0)), 0) AS ""Proceeds"",
    COALESCE(SUM(CASE WHEN COALESCE(t.""DisposalLossValue"", 0) < 0 THEN ABS(t.""DisposalLossValue"") ELSE 0 END), 0) AS ""Loss"",
    COALESCE(SUM(CASE WHEN COALESCE(t.""DisposalLossValue"", 0) > 0 THEN t.""DisposalLossValue"" ELSE 0 END), 0) AS ""Gain"",
    COALESCE(SUM(COALESCE(t.""DisposalTotalValue"", 0)), 0) AS ""Cost"",
    COALESCE(SUM(COALESCE(t.""RevaluationReserveDisposal"", 0)), 0) AS ""RevalReserve"",
    COUNT(*) AS ""TxnCount""
FROM ""Asset_Register_Transactions"" t
WHERE t.""TransactionTypeID"" IN (
    SELECT ""ReferenceData_ID"" FROM ""Const_ReferenceData_sys"" WHERE ""Description"" = 'Disposal'
)
AND t.""FinancialYear"" = @finYear
AND t.""FinancialPeriod"" >= @fromPeriod
AND t.""FinancialPeriod"" <= @toPeriod";

        string dispDocPart = isSqlServer
            ? @"LEFT(g.""DocumentNumber"", CHARINDEX('/', g.""DocumentNumber"" + '/') - 1)"
            : @"SPLIT_PART(g.""DocumentNumber"", '/', 1)";
        var glSql = $@"
SELECT
    COALESCE(SUM(CASE WHEN g.""TransactionDetails"" LIKE '%AccumulatedDepreciation%' THEN g.""Debit"" ELSE 0 END), 0) AS ""GL_AccDep"",
    COALESCE(SUM(CASE WHEN g.""TransactionDetails"" LIKE '%AccumulatedImpairment%'
                       AND g.""TransactionDetails"" NOT LIKE '%Accumulated Surplus%' THEN g.""Debit"" ELSE 0 END), 0) AS ""GL_AccImp"",
    COALESCE(SUM(CASE WHEN g.""TransactionDetails"" LIKE '%DisposalProceeds%' THEN g.""Debit"" ELSE 0 END), 0) AS ""GL_Proceeds"",
    COALESCE(SUM(CASE WHEN g.""TransactionDetails"" LIKE '%DisposalLoss%' THEN g.""Debit"" ELSE 0 END), 0) AS ""GL_Loss"",
    COALESCE(SUM(CASE WHEN g.""TransactionDetails"" LIKE '%DisposalGain%' THEN g.""Credit"" ELSE 0 END), 0) AS ""GL_Gain"",
    COALESCE(SUM(CASE WHEN g.""TransactionDetails"" LIKE '%- Cost%' THEN g.""Credit"" ELSE 0 END), 0) AS ""GL_Cost"",
    COALESCE(SUM(CASE WHEN g.""TransactionDetails"" LIKE '%RevaluationReserve%'
                       AND g.""TransactionDetails"" NOT LIKE '%Accumulated Surplus%' THEN g.""Debit"" ELSE 0 END), 0) AS ""GL_RevalReserve"",
    COALESCE(SUM(CASE WHEN g.""TransactionDetails"" LIKE '%Accumulated Surplus%' THEN g.""Credit"" ELSE 0 END), 0) AS ""GL_AccSurplus""
FROM ""Asset_GeneralLedger"" g
WHERE g.""FinYear"" = @finYear
  AND g.""ProcessingMonth"" >= @fromPeriod
  AND g.""ProcessingMonth"" <= @toPeriod
  AND g.""DocumentNumber"" IS NOT NULL
  AND g.""DocumentNumber"" LIKE '%/%'
  AND {dispDocPart} IN ('306', '29')";

        var a = await conn.QueryFirstOrDefaultAsync(assetSql, new { finYear, fromPeriod, toPeriod });
        var g = await conn.QueryFirstOrDefaultAsync(glSql, new { finYear, fromPeriod, toPeriod });

        decimal accDep     = (decimal)(a?.AccDep     ?? 0m);
        decimal accImp     = (decimal)(a?.AccImp     ?? 0m);
        decimal proceeds   = (decimal)(a?.Proceeds   ?? 0m);
        decimal loss       = (decimal)(a?.Loss       ?? 0m);
        decimal gain       = (decimal)(a?.Gain       ?? 0m);
        decimal cost       = (decimal)(a?.Cost       ?? 0m);
        decimal revalRes   = (decimal)(a?.RevalReserve ?? 0m);
        int txnCount       = a?.TxnCount != null ? (int)(long)a.TxnCount : 0;

        decimal glAccDep    = (decimal)(g?.GL_AccDep    ?? 0m);
        decimal glAccImp    = (decimal)(g?.GL_AccImp    ?? 0m);
        decimal glProceeds  = (decimal)(g?.GL_Proceeds  ?? 0m);
        decimal glLoss      = (decimal)(g?.GL_Loss      ?? 0m);
        decimal glGain      = (decimal)(g?.GL_Gain      ?? 0m);
        decimal glCost      = (decimal)(g?.GL_Cost      ?? 0m);
        decimal glRevalRes  = (decimal)(g?.GL_RevalReserve ?? 0m);
        decimal glAccSurp   = (decimal)(g?.GL_AccSurplus ?? 0m);

        object Line(string lineName, string lineKey, string glSide, decimal assetValue, decimal glValue) => new
        {
            lineName, lineKey, glSide, assetValue, glValue,
            variance = assetValue - glValue,
            balanced = Math.Abs(assetValue - glValue) < 0.01m
        };

        var lines = new List<object>
        {
            Line("Accum. Depreciation",      "accDep",     "DR", accDep,   glAccDep),
            Line("Accum. Impairment",         "accImp",     "DR", accImp,   glAccImp),
            Line("Disposal Proceeds",         "proceeds",   "DR", proceeds, glProceeds),
            Line("Loss on Disposal",          "loss",       "DR", loss,     glLoss),
            Line("Gain on Disposal",          "gain",       "CR", gain,     glGain),
            Line("Cost (incl. Revaluation)",  "cost",       "CR", cost,     glCost),
            Line("Reval. Reserve",            "revalRes",   "DR", revalRes, glRevalRes),
            Line("Accumulated Surplus",       "accSurplus", "CR", revalRes, glAccSurp),
        };

        decimal totalDebitsAsset  = accDep + accImp + proceeds + loss + revalRes;
        decimal totalCreditsAsset = cost + gain + revalRes;
        decimal totalDebitsGl     = glAccDep + glAccImp + glProceeds + glLoss + glRevalRes;
        decimal totalCreditsGl    = glCost + glGain + glAccSurp;

        var summary = new
        {
            totalDebitsAsset,
            totalCreditsAsset,
            totalDebitsGl,
            totalCreditsGl,
            assetBalanced = Math.Abs(totalDebitsAsset - totalCreditsAsset) < 0.01m,
            glBalanced    = Math.Abs(totalDebitsGl - totalCreditsGl) < 0.01m,
            disposalCount = txnCount
        };

        return (lines, summary);
    }

    // Synthetic virtual TypeID used only inside the reconciliation for impairment reversals.
    // No row in Asset_Register_Transactions actually has this TypeID.
    private const int ImpairmentReversalVirtualTypeId = 241;

    private static readonly Dictionary<int, int> DocTypeToAssetType = new()
    {
        { 666, 22 },   // Asset Depreciation → Depreciation
        { 786, 24 },   // Asset Impairment → Impairment
        { 787, ImpairmentReversalVirtualTypeId },  // Asset Reversal of Impairment → Impairment Reversal (separate row)
        { 1145, 23 },  // Asset Revaluation → Revaluation
        { 316, 25 },   // Asset FairValue → Fair Value Adjustment
        { 306, 26 },   // Asset Disposal → Disposal
        { 29, 26 },    // Disposal → Disposal
        { 420, 35 },   // Asset Transfer → Asset Transfer
        { 28, 35 },    // Transfer → Asset Transfer
        { 999, 0 },    // Asset Capitalisation (no asset txn type)
        { 23, 22 },    // Depreciation → Depreciation
        { 26, 24 },    // Impairment → Impairment
        { 27, 23 },    // Revaluation → Revaluation
        { 2316167, 37 },  // Asset Refurbishment → Asset Refurbishment
    };

    [HttpGet("disposal-methods")]
    public async Task<IActionResult> GetDisposalMethods()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync(@"SELECT ""AssetDisposalMethod_ID"" AS id, ""AssetDisposalMethodDesc"" AS name FROM ""Const_AssetDisposalMethod"" WHERE COALESCE(""Enabled"",1)=1 ORDER BY ""AssetDisposalMethodDesc""");
        return Ok(rows);
    }

    [HttpGet("disposal-report")]
    public async Task<IActionResult> GetDisposalReport(
        [FromQuery] string? finYear = null,
        [FromQuery] int fromPeriod = 1,
        [FromQuery] int toPeriod = 12,
        [FromQuery] int? typeId = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int? subCategoryId = null,
        [FromQuery] int? measurementTypeId = null,
        [FromQuery] int? statusId = null,
        [FromQuery] int? assetItemId = null,
        [FromQuery] int? disposalMethodId = null)
    {
        if (string.IsNullOrEmpty(finYear))
        {
            var now = DateTime.Now;
            finYear = now.Month >= 7 ? $"{now.Year}/{now.Year + 1}" : $"{now.Year - 1}/{now.Year}";
        }
        if (fromPeriod < 1) fromPeriod = 1;
        if (toPeriod > 12) toPeriod = 12;
        if (fromPeriod > toPeriod) fromPeriod = toPeriod;

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var conditions = new System.Collections.Generic.List<string>();
        conditions.Add(@"d.""Status"" = 'Approved'");
        conditions.Add(@"(@finYear = '' OR d.""FinYear"" = @finYear)");
        conditions.Add(@"(
    (EXTRACT(MONTH FROM d.""DisposalDate"") >= 7
     AND (EXTRACT(MONTH FROM d.""DisposalDate"") - 6) BETWEEN @fromPeriod AND @toPeriod)
    OR
    (EXTRACT(MONTH FROM d.""DisposalDate"") < 7
     AND (EXTRACT(MONTH FROM d.""DisposalDate"") + 6) BETWEEN @fromPeriod AND @toPeriod)
  )");

        if (typeId.HasValue)           conditions.Add(@"i.""AssetType_ID"" = @typeId");
        if (categoryId.HasValue)       conditions.Add(@"i.""AssetCategory_ID"" = @categoryId");
        if (subCategoryId.HasValue)    conditions.Add(@"i.""Asset_SubCategory_ID"" = @subCategoryId");
        if (measurementTypeId.HasValue) conditions.Add(@"i.""MeasurementType_ID"" = @measurementTypeId");
        if (statusId.HasValue)         conditions.Add(@"i.""AssetStatus_ID"" = @statusId");
        if (assetItemId.HasValue)      conditions.Add(@"i.""AssetRegisterItem_ID"" = @assetItemId");
        if (disposalMethodId.HasValue) conditions.Add(@"d.""AssetDisposalMethodID"" = @disposalMethodId");

        var whereClause = string.Join("\n  AND ", conditions);

        var sql = $@"
SELECT DISTINCT
    i.""AssetRegisterItem_ID""                                                                  AS ""assetId"",
    COALESCE(i.""Description"", '')                                                             AS ""description"",
    COALESCE(cls.""AssetClassDesc"", '')                                                        AS ""assetClass"",
    i.""AcquisitionDate""                                                                       AS ""acquisitionDate"",
    COALESCE(i.""InserviceDate"", i.""ReadyForUse"")                                             AS ""inServiceDate"",
    d.""DisposalDate""                                                                          AS ""disposalDate"",
    COALESCE(adm.""AssetDisposalMethodDesc"", '')                                               AS ""disposalMethod"",
    COALESCE(NULLIF(d.""DisposalReason"",''), da.""DisposalReason"", '')                          AS ""disposalReason"",
    COALESCE(i.""Barcode"", '')                                                                 AS ""barcode"",
    COALESCE(afs.""FinancialStatusDesc"", '')                                                   AS ""financialStatus"",
    COALESCE(cond.""Description"", '')                                                          AS ""assetCondition"",
    COALESCE(ROUND(COALESCE(i.""UsefulLifeMonthComponent"",0) / 12.0, 4), 0)                   AS ""usefulLifeYearComponent"",
    COALESCE(i.""UsefulLifeMonthComponent"", 0)                                                 AS ""usefulLifeMonthComponent"",
    COALESCE(ROUND(COALESCE(i.""RemainingUsefulLife"",0) / 12.0, 4), 0)                        AS ""remainingUsefulLifeYearComponent"",
    COALESCE(i.""RemainingUsefulLife"", 0)                                                      AS ""remainingUsefulLifeMonthComponent"",
    COALESCE(i.""Quantity"", 0)                                                                 AS ""quantity"",
    COALESCE(i.""MunicipalDepartment_ID"", '')                                                   AS ""department"",
    ''                                                                                           AS ""division"",
    COALESCE(CAST(i.""SGNumberChange_ID"" AS VARCHAR), '')                                      AS ""sgKey"",
    COALESCE(i.""DeedNumber"", '')                                                              AS ""deedNumber"",
    COALESCE(i.""ErfNumber"", '')                                                               AS ""erfNumber"",
    COALESCE(i.""ErfSizeM2"", 0)                                                               AS ""erfSize"",
    COALESCE(i.""PortionNumber"", '')                                                           AS ""portionNumber"",
    COALESCE(i.""UnitNumber"", '')                                                              AS ""unitNumber"",
    NULL::TEXT                                                                                   AS ""custodianName"",
    COALESCE(ao.""AssetOwnershipDesc"", i.""AssetOwnershipName"", '')                          AS ""assetOwnership"",
    COALESCE(i.""Town_ID""::TEXT, '')                                                           AS ""town"",
    COALESCE(i.""Street_ID""::TEXT, '')                                                         AS ""street"",
    COALESCE(i.""Building_ID""::TEXT, '')                                                       AS ""building"",
    COALESCE(i.""Ward_ID""::TEXT, '')                                                           AS ""ward"",
    COALESCE(i.""Zoning_ID""::TEXT, '')                                                         AS ""zoning"",
    COALESCE(i.""FloorID""::TEXT, '')                                                           AS ""floorDescription"",
    COALESCE(i.""SuburbID""::TEXT, i.""Suburb"", '')                                             AS ""suburb"",
    COALESCE(i.""WellKnownTextWKT"", '')                                                        AS ""wellKnownText"",
    COALESCE(i.""GIS_ID"", '')                                                                  AS ""gisId"",
    COALESCE(i.""latitude"", 0)                                                                 AS ""latitude"",
    COALESCE(i.""longitude"", 0)                                                                AS ""longitude"",
    COALESCE(i.""PurchaseAmount"", 0)                                                           AS ""purchaseAmount"",
    COALESCE(d.""CarryingAmount"", 0)                                                           AS ""carryingAmount"",
    COALESCE(i.""AccumulatedDepreciationClosingBalance"", 0)                                    AS ""accDepClosing"",
    COALESCE(i.""AccumulatedImpairmentClosingBalance"", 0)                                      AS ""accImpairmentClosing"",
    COALESCE(art.""RevaluationReserveDisposal"", 0)                                             AS ""revaluationReserveDisposal"",
    COALESCE(art.""DisposalTotalValue"", d.""SalePrice"", 0)                                    AS ""amountRealised"",
    COALESCE(d.""AmountProfitLoss"", 0)                                                         AS ""profitLossDisposal"",
    0                                                                                            AS ""vat"",
    COALESCE(REPLACE(jnl.""DocumentNumber"", '/', '_'), '')                                     AS ""documentNumber""
FROM ""Asset_Disposal"" d
JOIN ""Asset_Register_Items"" i ON i.""AssetRegisterItem_ID"" = d.""AssetItemID""
LEFT JOIN ""Const_AssetClass_sys"" cls ON i.""AssetClass_ID"" = cls.""AssetClass_ID""
LEFT JOIN ""Const_AssetType_Sys"" at2 ON i.""AssetType_ID"" = at2.""AssetType_ID""
LEFT JOIN ""Const_AssetCategory_sys"" cat ON i.""AssetCategory_ID"" = cat.""AssetCategoryID""
LEFT JOIN ""Const_Asset_SubCategory"" sc ON i.""Asset_SubCategory_ID"" = sc.""Asset_SubCategory_ID""
LEFT JOIN ""AssetConfig_MeasurementType"" mt ON i.""MeasurementType_ID"" = mt.""AssetConfig_MeasurementType_ID""
LEFT JOIN ""Const_AssetStatus_Sys"" asts ON i.""AssetStatus_ID"" = asts.""AssetStatus_ID""
LEFT JOIN ""AssetConfig_FinancialStatus"" afs ON i.""Financial_Status_ID"" = afs.""FinStatusID""
LEFT JOIN ""Const_Asset_Condition"" cond ON i.""AssetCondition_ID"" = cond.""Asset_Condition_ID""
LEFT JOIN ""Const_AssetDisposalMethod"" adm ON d.""AssetDisposalMethodID"" = adm.""AssetDisposalMethod_ID""
LEFT JOIN ""Const_AssetOwnership"" ao ON i.""AssetOwnership_ID"" = ao.""AssetOwnership_ID""


LEFT JOIN LATERAL (
    SELECT ""DisposalReason""
    FROM ""Asset_Disposal_Approval""
    WHERE ""AssetDisposal_ID"" = d.""AssetDisposal_ID""
      AND ""Status"" = 'Approved'
    ORDER BY ""DisposalApproval_ID"" DESC
    LIMIT 1
) da ON true
LEFT JOIN (
    SELECT ""AssetRegisterItem_ID"",
           SUM(COALESCE(""RevaluationReserveDisposal"",0)) AS ""RevaluationReserveDisposal"",
           SUM(COALESCE(""DisposalTotalValue"",0))          AS ""DisposalTotalValue""
    FROM ""Asset_Register_Transactions""
    WHERE ""TransactionTypeID"" = 26
    GROUP BY ""AssetRegisterItem_ID""
) art ON art.""AssetRegisterItem_ID"" = i.""AssetRegisterItem_ID""
LEFT JOIN LATERAL (
    SELECT ""DocumentNumber""
    FROM ""Led_Journal_Asset""
    WHERE ""Asset_RegisterItem_ID"" = i.""AssetRegisterItem_ID""
      AND ""AssetJournalTransactionTypeID"" = 26
    ORDER BY ""AssetJournal_ID"" DESC
    LIMIT 1
) jnl ON true
WHERE {whereClause}
ORDER BY d.""DisposalDate"" DESC";

        var parameters = new
        {
            finYear,
            fromPeriod,
            toPeriod,
            typeId,
            categoryId,
            subCategoryId,
            measurementTypeId,
            statusId,
            assetItemId,
            disposalMethodId
        };

        var rows = await conn.QueryAsync(sql, parameters, commandTimeout: 120);
        return Ok(rows);
    }

    [HttpGet("reconciliation")]
    public async Task<IActionResult> GetReconciliation(
        [FromQuery] string? finYear = null,
        [FromQuery] int fromPeriod = 1,
        [FromQuery] int toPeriod = 12)
    {
        if (string.IsNullOrEmpty(finYear))
        {
            var now = DateTime.Now;
            finYear = now.Month >= 7 ? $"{now.Year}/{now.Year + 1}" : $"{now.Year - 1}/{now.Year}";
        }
        if (fromPeriod < 1) fromPeriod = 1;
        if (toPeriod > 12) toPeriod = 12;
        if (fromPeriod > toPeriod) fromPeriod = toPeriod;

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        // Impairment reversals (TypeID=24 with ImpairmentReversalValue > 0) are separated into
        // a virtual TypeID=241 row so they reconcile against GL DocType 787 independently.
        var assetSql = @"
SELECT
    t.""TransactionTypeID"",
    COALESCE(rd.""Description"", CONCAT('Type ', t.""TransactionTypeID"")) AS ""TypeName"",
    COALESCE(SUM(COALESCE(t.""DepreciationValue"",0) + COALESCE(t.""ImpairmentValue"",0) + COALESCE(t.""RevaluationReserveImpairment"",0) + COALESCE(t.""RevaluationValue"",0) + COALESCE(t.""FairValue"",0) + COALESCE(t.""DisposalValue"",0) + COALESCE(t.""TransferToValue"",0) + COALESCE(t.""PurchaseAmount"",0) + COALESCE(t.""DepreciationAdjustment"",0) + COALESCE(t.""RefurbDTValue"",0) + COALESCE(t.""RefurbCTValue"",0) + COALESCE(t.""RefurbDepreciationValue"",0) + COALESCE(t.""RefurbRevaluationValue"",0)), 0) AS ""TotalAmount"",
    COALESCE(SUM(COALESCE(t.""DepreciationOffset"",0)), 0) AS ""TotalOffset"",
    COUNT(*) AS ""TransactionCount"",
    COUNT(*) FILTER (WHERE COALESCE(t.""DepreciationOffset"",0) <> 0) AS ""OffsetCount""
FROM ""Asset_Register_Transactions"" t
LEFT JOIN ""Const_ReferenceData_sys"" rd ON rd.""ReferenceData_ID"" = t.""TransactionTypeID""
WHERE t.""FinancialYear"" = @finYear
  AND t.""FinancialPeriod"" >= @fromPeriod
  AND t.""FinancialPeriod"" <= @toPeriod
  AND NOT (t.""TransactionTypeID"" = 24 AND COALESCE(t.""ImpairmentReversalValue"", 0) > 0)
GROUP BY t.""TransactionTypeID"", rd.""Description""
UNION ALL
SELECT
    241 AS ""TransactionTypeID"",
    'Impairment Reversal' AS ""TypeName"",
    COALESCE(SUM(COALESCE(t.""ImpairmentReversalValue"",0) + COALESCE(t.""RevaluationReserveImpairmentReversal"",0)), 0) AS ""TotalAmount"",
    0 AS ""TotalOffset"",
    COUNT(*) AS ""TransactionCount"",
    0 AS ""OffsetCount""
FROM ""Asset_Register_Transactions"" t
WHERE t.""FinancialYear"" = @finYear
  AND t.""FinancialPeriod"" >= @fromPeriod
  AND t.""FinancialPeriod"" <= @toPeriod
  AND t.""TransactionTypeID"" = 24
  AND COALESCE(t.""ImpairmentReversalValue"", 0) > 0
ORDER BY 1";

        var glSql = _db.IsSqlServer ? @"
SELECT
    CAST(LEFT(g.""DocumentNumber"", CHARINDEX('/', g.""DocumentNumber"" + '/') - 1) AS INT) AS ""DocTypeId"",
    CONCAT('DocType ', LEFT(g.""DocumentNumber"", CHARINDEX('/', g.""DocumentNumber"" + '/') - 1)) AS ""DocTypeName"",
    CASE WHEN g.""TransactionDetails"" LIKE '%Offset%' THEN 1 ELSE 0 END AS ""IsOffset"",
    COALESCE(SUM(g.""Debit""), 0) AS ""TotalDebit"",
    COUNT(DISTINCT g.""MatchTranGuid"") AS ""TransactionCount""
FROM ""Asset_GeneralLedger"" g
WHERE g.""FinYear"" = @finYear
  AND g.""ProcessingMonth"" >= @fromPeriod
  AND g.""ProcessingMonth"" <= @toPeriod
  AND g.""DocumentNumber"" IS NOT NULL
  AND g.""DocumentNumber"" LIKE '%/%'
  AND ISNUMERIC(LEFT(g.""DocumentNumber"", CHARINDEX('/', g.""DocumentNumber"" + '/') - 1)) = 1
GROUP BY LEFT(g.""DocumentNumber"", CHARINDEX('/', g.""DocumentNumber"" + '/') - 1),
         CASE WHEN g.""TransactionDetails"" LIKE '%Offset%' THEN 1 ELSE 0 END
ORDER BY CAST(LEFT(g.""DocumentNumber"", CHARINDEX('/', g.""DocumentNumber"" + '/') - 1) AS INT)" : @"
SELECT
    CAST(SPLIT_PART(g.""DocumentNumber"", '/', 1) AS INT) AS ""DocTypeId"",
    CONCAT('DocType ', SPLIT_PART(g.""DocumentNumber"", '/', 1)) AS ""DocTypeName"",
    CASE WHEN g.""TransactionDetails"" LIKE '%Offset%' THEN 1 ELSE 0 END AS ""IsOffset"",
    COALESCE(SUM(g.""Debit""), 0) AS ""TotalDebit"",
    COUNT(DISTINCT g.""MatchTranGuid"") AS ""TransactionCount""
FROM ""Asset_GeneralLedger"" g
WHERE g.""FinYear"" = @finYear
  AND g.""ProcessingMonth"" >= @fromPeriod
  AND g.""ProcessingMonth"" <= @toPeriod
  AND g.""DocumentNumber"" IS NOT NULL
  AND g.""DocumentNumber"" LIKE '%/%'
  AND SPLIT_PART(g.""DocumentNumber"", '/', 1) ~ '^\d+$'
GROUP BY SPLIT_PART(g.""DocumentNumber"", '/', 1),
         CASE WHEN g.""TransactionDetails"" LIKE '%Offset%' THEN 1 ELSE 0 END
ORDER BY CAST(SPLIT_PART(g.""DocumentNumber"", '/', 1) AS INT)";

        var assetResults = (await conn.QueryAsync(assetSql, new { finYear, fromPeriod, toPeriod })).AsList();
        var glResults = (await conn.QueryAsync(glSql, new { finYear, fromPeriod, toPeriod })).AsList();

        var assetRows = new List<(string Key, string TypeName, int TypeId, decimal Total, int Count)>();
        foreach (dynamic r in assetResults)
        {
            int typeId = (int)r.TransactionTypeID;
            if (typeId == DisposalAssetTypeId) continue;
            string typeName = (string)r.TypeName;
            decimal totalAmount = (decimal)r.TotalAmount;
            decimal totalOffset = (decimal)r.TotalOffset;
            int count = (int)(long)r.TransactionCount;
            int offsetCount = (int)(long)r.OffsetCount;

            if (typeId == 22 && totalOffset != 0)
            {
                assetRows.Add(($"A_{typeId}", typeName, typeId, totalAmount, count));
                assetRows.Add(($"A_{typeId}_offset", typeName + " Offset", typeId, totalOffset, offsetCount));
            }
            else
            {
                assetRows.Add(($"A_{typeId}", typeName, typeId, totalAmount, count));
            }
        }

        var glRows = new List<(string Key, string DocTypeName, int DocTypeId, bool IsOffset, decimal Total, int Count)>();
        foreach (dynamic r in glResults)
        {
            int docTypeId = (int)r.DocTypeId;
            if (DisposalDocTypes.Contains(docTypeId)) continue;
            string docTypeName = (string)r.DocTypeName;
            bool isOffset = (int)r.IsOffset != 0;
            decimal total = (decimal)r.TotalDebit;
            int count = (int)(long)r.TransactionCount;

            int assetTypeId = DocTypeToAssetType.GetValueOrDefault(docTypeId, 0);

            if (assetTypeId == 22 && isOffset)
            {
                glRows.Add(($"A_{assetTypeId}_offset", docTypeName, docTypeId, true, total, count));
            }
            else if (assetTypeId > 0)
            {
                glRows.Add(($"A_{assetTypeId}", docTypeName, docTypeId, false, total, count));
            }
            else
            {
                glRows.Add(($"GL_{docTypeId}", docTypeName, docTypeId, false, total, count));
            }
        }

        var glByKey = new Dictionary<string, (string DocTypeName, int DocTypeId, decimal Total, int Count)>();
        foreach (var gr in glRows)
        {
            if (glByKey.ContainsKey(gr.Key))
            {
                var existing = glByKey[gr.Key];
                glByKey[gr.Key] = (existing.DocTypeName, existing.DocTypeId, existing.Total + gr.Total, existing.Count + gr.Count);
            }
            else
            {
                glByKey[gr.Key] = (gr.DocTypeName, gr.DocTypeId, gr.Total, gr.Count);
            }
        }

        var allKeys = new List<string>();
        foreach (var ar in assetRows) { if (!allKeys.Contains(ar.Key)) allKeys.Add(ar.Key); }
        foreach (var k in glByKey.Keys) { if (!allKeys.Contains(k)) allKeys.Add(k); }

        var assetByKey = new Dictionary<string, (string TypeName, int TypeId, decimal Total, int Count)>();
        foreach (var ar in assetRows)
        {
            assetByKey[ar.Key] = (ar.TypeName, ar.TypeId, ar.Total, ar.Count);
        }

        var rows = new List<object>();
        foreach (var key in allKeys)
        {
            assetByKey.TryGetValue(key, out var assetData);
            glByKey.TryGetValue(key, out var glData);

            var typeName = assetData.TypeName ?? glData.DocTypeName ?? key;
            var isOffset = key.EndsWith("_offset");
            var transactionTypeId = assetData.TypeId;
            if (transactionTypeId == 0 && glData.DocTypeId > 0)
                transactionTypeId = DocTypeToAssetType.GetValueOrDefault(glData.DocTypeId, 0);
            var variance = assetData.Total - glData.Total;

            rows.Add(new
            {
                typeName,
                transactionTypeId,
                docTypeId = glData.DocTypeId,
                isOffset,
                assetTotal = assetData.Total,
                glTotal = glData.Total,
                variance,
                balanced = Math.Abs(variance) < 0.01m,
                assetCount = assetData.Count,
                glCount = glData.Count
            });
        }

        var (disposalLines, disposalSummary) = await GetDisposalLines(conn, _db.IsSqlServer, finYear, fromPeriod, toPeriod);

        return Ok(new
        {
            finYear,
            fromPeriod,
            toPeriod,
            rows,
            disposalLines,
            disposalSummary
        });
    }

    [HttpGet("reconciliation/asset-transactions")]
    public async Task<IActionResult> GetReconciliationAssetTransactions(
        [FromQuery] int transactionTypeId,
        [FromQuery] string? finYear = null,
        [FromQuery] int fromPeriod = 1,
        [FromQuery] int toPeriod = 12,
        [FromQuery] bool isOffset = false)
    {
        if (string.IsNullOrEmpty(finYear))
        {
            var now = DateTime.Now;
            finYear = now.Month >= 7 ? $"{now.Year}/{now.Year + 1}" : $"{now.Year - 1}/{now.Year}";
        }
        if (fromPeriod < 1) fromPeriod = 1;
        if (toPeriod > 12) toPeriod = 12;
        if (fromPeriod > toPeriod) fromPeriod = toPeriod;

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        // Impairment Reversal uses virtual TypeID=241; translate to actual TypeID=24 with reversal filter
        bool isReversalRow = transactionTypeId == ImpairmentReversalVirtualTypeId;
        int artTypeId = isReversalRow ? 24 : transactionTypeId;

        string valueColumn;
        if (isReversalRow)
            valueColumn = @"COALESCE(t.""ImpairmentReversalValue"",0) + COALESCE(t.""RevaluationReserveImpairmentReversal"",0)";
        else if (isOffset && transactionTypeId == 22)
            valueColumn = @"t.""DepreciationOffset""";
        else
            valueColumn = @"COALESCE(t.""DepreciationValue"",0) + COALESCE(t.""ImpairmentValue"",0) + COALESCE(t.""RevaluationReserveImpairment"",0) + COALESCE(t.""RevaluationValue"",0) + COALESCE(t.""FairValue"",0) + COALESCE(t.""DisposalValue"",0) - COALESCE(t.""TransferFromValue"",0) + COALESCE(t.""TransferToValue"",0) + COALESCE(t.""PurchaseAmount"",0) + COALESCE(t.""ImpairmentReversalValue"",0) + COALESCE(t.""DepreciationAdjustment"",0) + COALESCE(t.""RefurbDTValue"",0) + COALESCE(t.""RefurbCTValue"",0) + COALESCE(t.""RefurbDepreciationValue"",0) + COALESCE(t.""RefurbRevaluationValue"",0)";

        var offsetFilter = "";
        if (isReversalRow)
            offsetFilter = @" AND COALESCE(t.""ImpairmentReversalValue"", 0) > 0";
        else if (transactionTypeId == 24)
            offsetFilter = @" AND COALESCE(t.""ImpairmentReversalValue"", 0) = 0";
        else if (transactionTypeId == 22)
        {
            if (isOffset)
                offsetFilter = @" AND COALESCE(t.""DepreciationOffset"", 0) <> 0";
            else
                offsetFilter = "";
        }

        string sqlJLateral = _db.IsSqlServer
            ? @"OUTER APPLY (
    SELECT TOP 1 ""DocumentNumber"" FROM ""Asset_GeneralLedger""
    WHERE ""MatchTranGuid"" = t.""GLGUID_ID""
) j"
            : @"LEFT JOIN LATERAL (
    SELECT ""DocumentNumber"" FROM ""Asset_GeneralLedger""
    WHERE t.""GLGUID_ID"" IS NOT NULL AND t.""GLGUID_ID"" <> ''
      AND ""MatchTranGuid"" = NULLIF(t.""GLGUID_ID"", '')::uuid
    LIMIT 1
) j ON true";

        var sql = $@"
SELECT
    t.""ID"" AS ""AssetRegisterTransaction_ID"",
    t.""AssetRegisterItem_ID"",
    t.""TransactionTypeID"",
    COALESCE(rd.""Description"", CONCAT('Type ', t.""TransactionTypeID"")) AS ""TransactionType"",
    t.""TransactionDate"",
    t.""FinancialYear"",
    t.""FinancialPeriod"",
    {valueColumn} AS ""Amount"",
    t.""DepreciationValue"",
    t.""DepreciationOffset"",
    t.""ImpairmentValue"",
    COALESCE(t.""RevaluationReserveImpairment"", 0) AS ""RevaluationReserveImpairment"",
    COALESCE(t.""ImpairmentReversalValue"", 0) AS ""ImpairmentReversalValue"",
    COALESCE(t.""RevaluationReserveImpairmentReversal"", 0) AS ""RevaluationReserveImpairmentReversal"",
    t.""RevaluationValue"",
    COALESCE(j.""DocumentNumber"", '') AS ""DocumentNumber"",
    t.""DateModified""
FROM ""Asset_Register_Transactions"" t
LEFT JOIN ""Const_ReferenceData_sys"" rd ON rd.""ReferenceData_ID"" = t.""TransactionTypeID""
{sqlJLateral}
WHERE t.""TransactionTypeID"" = @artTypeId
  AND t.""FinancialYear"" = @finYear
  AND t.""FinancialPeriod"" >= @fromPeriod
  AND t.""FinancialPeriod"" <= @toPeriod
  {offsetFilter}
ORDER BY t.""TransactionDate"", t.""ID""";

        var rows = await conn.QueryAsync(sql, new { artTypeId, finYear, fromPeriod, toPeriod });
        return Ok(rows);
    }

    [HttpGet("reconciliation/gl-transactions")]
    public async Task<IActionResult> GetReconciliationGlTransactions(
        [FromQuery] int transactionTypeId,
        [FromQuery] string? finYear = null,
        [FromQuery] int fromPeriod = 1,
        [FromQuery] int toPeriod = 12,
        [FromQuery] bool isOffset = false)
    {
        if (string.IsNullOrEmpty(finYear))
        {
            var now = DateTime.Now;
            finYear = now.Month >= 7 ? $"{now.Year}/{now.Year + 1}" : $"{now.Year - 1}/{now.Year}";
        }
        if (fromPeriod < 1) fromPeriod = 1;
        if (toPeriod > 12) toPeriod = 12;
        if (fromPeriod > toPeriod) fromPeriod = toPeriod;

        var docTypePrefixes = new List<string>();
        foreach (var kv in DocTypeToAssetType)
        {
            if (kv.Value == transactionTypeId) docTypePrefixes.Add(kv.Key.ToString());
        }

        if (docTypePrefixes.Count == 0) docTypePrefixes.Add(transactionTypeId.ToString());

        var offsetFilter = "";
        if (transactionTypeId == 22)
        {
            if (isOffset)
                offsetFilter = @" AND g.""TransactionDetails"" LIKE '%Offset%'";
            else
                offsetFilter = @" AND g.""TransactionDetails"" NOT LIKE '%Offset%'";
        }

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        string glDocPart = _db.IsSqlServer
            ? @"LEFT(g.""DocumentNumber"", CHARINDEX('/', g.""DocumentNumber"" + '/') - 1)"
            : @"SPLIT_PART(g.""DocumentNumber"", '/', 1)";

        var quotedPrefixes = string.Join(", ", docTypePrefixes.Select(p => $"'{p}'"));
        string glDocPrefixFilter = $@"{glDocPart} IN ({quotedPrefixes})";

        var sql = $@"
SELECT
    g.""GenLedger_ID"",
    CAST({glDocPart} AS INT) AS ""DocTypeId"",
    CAST({glDocPart} AS VARCHAR) AS ""DocTypeName"",
    g.""PostingDate"" AS ""TransactionDate"",
    g.""FinYear"",
    g.""ProcessingMonth"" AS ""FinancialPeriod"",
    g.""Debit"",
    g.""Credit"",
    g.""TransactionDetails"",
    g.""DocumentNumber"",
    g.""VoteID"",
    g.""DateCaptured"",
    g.""AssetLinkID""
FROM ""Asset_GeneralLedger"" g
WHERE g.""FinYear"" = @finYear
  AND g.""ProcessingMonth"" >= @fromPeriod
  AND g.""ProcessingMonth"" <= @toPeriod
  AND g.""DocumentNumber"" IS NOT NULL
  AND g.""DocumentNumber"" LIKE '%/%'
  AND {glDocPrefixFilter}
  {offsetFilter}
ORDER BY g.""PostingDate"", g.""GenLedger_ID""";

        var rows = await conn.QueryAsync(sql, new { finYear, fromPeriod, toPeriod });
        return Ok(rows);
    }

    [HttpGet("rooms-with-assets")]
    public async Task<IActionResult> GetRoomsWithAssets()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var result = await _location.GetRoomsWithAssetsAsync(conn);
        return Ok(result);
    }

    [HttpGet("depreciation-schedule")]
    public async Task<IActionResult> GetDepreciationSchedule(
        [FromQuery] string? finYear = null,
        [FromQuery] int fromPeriod = 1,
        [FromQuery] int toPeriod = 12,
        [FromQuery] int? assetId = null,
        [FromQuery] int? typeId = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int? subCategoryId = null,
        [FromQuery] int? measurementTypeId = null,
        [FromQuery] int? statusId = null)
    {
        if (string.IsNullOrEmpty(finYear))
        {
            var now = DateTime.Now;
            finYear = now.Month >= 7 ? $"{now.Year}/{now.Year + 1}" : $"{now.Year - 1}/{now.Year}";
        }

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var filters = new List<string>();
        var parameters = new DynamicParameters();
        parameters.Add("finYear", finYear);
        parameters.Add("fromPeriod", fromPeriod);
        parameters.Add("toPeriod", toPeriod);

        if (assetId.HasValue)
        {
            filters.Add(@"i.""AssetRegisterItem_ID"" = @assetId");
            parameters.Add("assetId", assetId.Value);
        }
        if (typeId.HasValue)
        {
            filters.Add(@"i.""AssetType_ID"" = @typeId");
            parameters.Add("typeId", typeId.Value);
        }
        if (categoryId.HasValue)
        {
            filters.Add(@"i.""AssetCategory_ID"" = @categoryId");
            parameters.Add("categoryId", categoryId.Value);
        }
        if (subCategoryId.HasValue)
        {
            filters.Add(@"i.""Asset_SubCategory_ID"" = @subCategoryId");
            parameters.Add("subCategoryId", subCategoryId.Value);
        }
        if (measurementTypeId.HasValue)
        {
            filters.Add(@"i.""MeasurementType_ID"" = @measurementTypeId");
            parameters.Add("measurementTypeId", measurementTypeId.Value);
        }
        if (statusId.HasValue)
        {
            filters.Add(@"i.""AssetStatus_ID"" = @statusId");
            parameters.Add("statusId", statusId.Value);
        }

        var whereClause = filters.Count > 0 ? "AND " + string.Join(" AND ", filters) : "";

        var sql = $@"
WITH dep_txn_type AS (
    SELECT ""AssetConfig_TransactionType_ID"" AS id
    FROM ""AssetConfig_TransactionType""
    WHERE ""Name"" = 'Depreciation'
    LIMIT 1
),
ats_agg AS (
    SELECT
        ""AssetRegisterItemID"",
        SUM(COALESCE(""DepreciationValue"", 0))                                                                  AS ""totalDepCurrentYear""
    FROM ""Asset_Transaction_Summary""
    WHERE ""FinancialYear"" = @finYear
      AND ""FinancialPeriod"" >= @fromPeriod
      AND ""FinancialPeriod"" <= @toPeriod
    GROUP BY ""AssetRegisterItemID""
)
SELECT
    i.""AssetRegisterItem_ID""                                                                                    AS ""assetId""
  , COALESCE(i.""Description"", '')                                                                              AS ""description""
  , COALESCE(astp.""AssetTypeDesc"", '')                                                                         AS ""assetType""
  , COALESCE(acc.""AssetCategoryDesc"", '')                                                                      AS ""assetCategory""
  , COALESCE(sc.""Asset_SubCategoryDescription"", '')                                                            AS ""assetSubCategory""
  , COALESCE(cac.""AssetClassDesc"", '')                                                                         AS ""assetClass""
  , COALESCE(meas.""Name"", 'Cost')                                                                              AS ""measurementType""
  , COALESCE(cas.""AssetStatusDesc"", '')                                                                        AS ""assetStatus""
  , COALESCE(afs.""FinancialStatusDesc"", '')                                                                    AS ""financialStatus""
  , COALESCE(acr.""Description"", '')                                                                            AS ""assetCondition""
  , COALESCE(dm.""AssetDepreciationMethodDesc"", 'Straight-line')                                               AS ""depreciationMethod""
  , COALESCE(gl_dep.""DocumentNumber"", '')                                                                      AS ""documentNumber""
  , i.""CommisioningDate""                                                                                       AS ""inServiceDate""
  , dsi.""ScheduledDate""                                                                                        AS ""scheduledDate""
  , dep.""DepreciationDate""                                                                                     AS ""transactionDate""
  , dep.""MonthID""                                                                                              AS ""arProcessingMonth""
  , COALESCE(gl_dep.""ProcessingMonth"", dep.""MonthID"")                                                        AS ""glProcessingMonth""
  , COALESCE(i.""UsefulLifeMonthComponent"", 0)                                                                  AS ""usefulLifeMonths""
  , CAST(ROUND(COALESCE(i.""UsefulLifeMonthComponent"", 0) / 12.0 * 365, 0) AS INTEGER)                        AS ""usefulLifeDays""
  , COALESCE(i.""RemainingUsefulLife"", 0)                                                                      AS ""remainingUsefulLifeMonths""
  , CAST(ROUND(COALESCE(i.""RemainingUsefulLife"", 0) / 12.0 * 365, 0) AS INTEGER)                             AS ""remainingUsefulLifeDays""
  , COALESCE(dep.""DaysFromLastRun"", 0)                                                                        AS ""daysFromLastRun""
  , COALESCE(i.""PurchaseAmount"", 0)                                                                           AS ""purchaseAmount""
  , COALESCE(
        dep.""AccumulatedDepreciation"" - dep.""DepreciationAmount"",
        i.""AccumulatedDepreciationOpeningBalance"",
        0)                                                                                                       AS ""accDepOpening""
  , COALESCE(dep.""AccumulatedDepreciation"", i.""AccumulatedDepreciationClosingBalance"", 0)                    AS ""accDepClosing""
  , COALESCE(ats.""totalDepCurrentYear"", 0)                                                                     AS ""accDepCurrentYear""
  , COALESCE(dep.""DepreciationAmount"", 0)                                                                      AS ""depreciationValue""
  , COALESCE(ats_period.""DepreciationOffsetOpeningBalance"", 0)                                                AS ""depOffsetOpening""
  , COALESCE(ats_period.""DepreciationOffset"", 0)                                                             AS ""depOffset""
  , COALESCE(ats_period.""DepreciationOffsetClosingBalance"", 0)                                               AS ""depOffsetClosing""
  , COALESCE(dep.""CarryingAmount"", i.""CarryingAmountClosingBalance"", 0)                                     AS ""carryingValue""
  , '' AS ""planProjectDebit""
  , '' AS ""scoaItemCodeDebit""
  , '' AS ""planProjectCredit""
  , '' AS ""scoaItemCodeCredit""
  , CASE WHEN dep.""IsApproved"" = 1 THEN 'Approved' WHEN dep.""IsApproved"" = 0 THEN 'Pending' ELSE '' END    AS ""approveStatus""
FROM ""Asset_Register_Items"" i
LEFT JOIN ""Asset_Depreciation"" dep
       ON dep.""AssetRegisterItem_ID"" = i.""AssetRegisterItem_ID""
      AND dep.""FinYear"" = @finYear
      AND dep.""MonthID"" >= @fromPeriod
      AND dep.""MonthID"" <= @toPeriod
LEFT JOIN ""Asset_DepreciationSchedule_Item"" dsi
       ON dsi.""Asset_DepreciationSchedule_Item_ID"" = dep.""Depreciation_ScheduledItemID""
LEFT JOIN ""Const_AssetType_Sys"" astp ON i.""AssetType_ID"" = astp.""AssetType_ID""
LEFT JOIN ""Const_AssetCategory_sys"" acc ON i.""AssetCategory_ID"" = acc.""AssetCategoryID""
LEFT JOIN ""Const_Asset_SubCategory"" sc ON i.""Asset_SubCategory_ID"" = sc.""Asset_SubCategory_ID""
LEFT JOIN ""Const_AssetClass_sys"" cac ON i.""AssetClass_ID"" = cac.""AssetClass_ID""
LEFT JOIN ""Const_AssetDepreciationMethod_Sys"" dm ON cac.""AssetDepreciationMethod_ID"" = dm.""AssetDepreciationMethod_ID""
LEFT JOIN ""AssetConfig_MeasurementType"" meas ON i.""MeasurementType_ID"" = meas.""AssetConfig_MeasurementType_ID""
LEFT JOIN ""Const_AssetStatus_Sys"" cas ON i.""AssetStatus_ID"" = cas.""AssetStatus_ID""
LEFT JOIN ""AssetConfig_FinancialStatus"" afs ON i.""Financial_Status_ID"" = afs.""FinStatusID""
LEFT JOIN ""Const_Asset_Condition"" acr ON i.""AssetCondition_ID"" = acr.""Asset_Condition_ID""
LEFT JOIN ats_agg ats ON ats.""AssetRegisterItemID"" = i.""AssetRegisterItem_ID""
LEFT JOIN ""Asset_Transaction_Summary"" ats_period
       ON ats_period.""AssetRegisterItemID"" = i.""AssetRegisterItem_ID""
      AND ats_period.""FinancialYear""        = @finYear
      AND ats_period.""FinancialPeriod""      = dep.""MonthID""
LEFT JOIN LATERAL (
    SELECT g.""DocumentNumber"", g.""ProcessingMonth""
    FROM ""Asset_Register_Transactions"" t
    JOIN ""Asset_GeneralLedger"" g ON g.""MatchTranGuid"" = t.""GLGUID_ID""::uuid
    WHERE t.""AssetRegisterItem_ID"" = i.""AssetRegisterItem_ID""
      AND t.""FinancialYear""        = dep.""FinYear""
      AND t.""FinancialPeriod""      = dep.""MonthID""
      AND t.""TransactionTypeID""    = 22
      AND t.""GLGUID_ID"" IS NOT NULL
      AND t.""GLGUID_ID"" <> ''
    LIMIT 1
) gl_dep ON true
LEFT JOIN ""AssetConfig_mSCOA"" msc
       ON COALESCE(i.""MeasurementType_ID"", 0) = COALESCE(msc.""MeasurementTypeID"", 0)
      AND COALESCE(i.""AssetType_ID"", 0)       = COALESCE(msc.""TypeID"", 0)
      AND COALESCE(i.""AssetCategory_ID"", 0)   = COALESCE(msc.""CategoryID"", 0)
      AND COALESCE(i.""Asset_SubCategory_ID"", 0) = COALESCE(msc.""SubCategoryID"", 0)
      AND msc.""FinYear"" = @finYear
LEFT JOIN ""AssetConfig_mSCOA_TransactionType"" mst
       ON mst.""AssetConfig_mSCOA_ID"" = msc.""AssetConfig_mSCOA_ID""
      AND mst.""TransactionTypeID"" = (SELECT id FROM dep_txn_type)
WHERE 1=1
  {whereClause}
ORDER BY i.""AssetRegisterItem_ID"", dep.""MonthID"" NULLS LAST";

        var results = await conn.QueryAsync(sql, parameters, commandTimeout: 120);

        return Ok(results);
    }

    [HttpGet("location-content")]
    public async Task<IActionResult> GetLocationContent(
        [FromQuery] string? fromRoom = null,
        [FromQuery] string? toRoom = null,
        [FromQuery] int? custodianId = null,
        [FromQuery] int? departmentId = null,
        [FromQuery] int? divisionId = null)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var result = await _location.GetRoomAssetDetailsAsync(conn,
            fromRoom, toRoom, custodianId, departmentId, divisionId);
        return Ok(result);
    }

    [HttpGet("revaluation-report")]
    public async Task<IActionResult> GetRevaluationReport(
        [FromQuery] string? finYear = null,
        [FromQuery] int fromPeriod = 1,
        [FromQuery] int toPeriod = 12,
        [FromQuery] int? typeId = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int? subCategoryId = null,
        [FromQuery] int? measurementTypeId = null,
        [FromQuery] int? statusId = null,
        [FromQuery] int? assetItemId = null)
    {
        if (string.IsNullOrEmpty(finYear))
        {
            var now = DateTime.Now;
            finYear = now.Month >= 7 ? $"{now.Year}/{now.Year + 1}" : $"{now.Year - 1}/{now.Year}";
        }
        if (fromPeriod < 1) fromPeriod = 1;
        if (toPeriod > 12) toPeriod = 12;
        if (fromPeriod > toPeriod) fromPeriod = toPeriod;

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var conditions = new System.Collections.Generic.List<string>();
        conditions.Add(@"rv.""Approved"" = TRUE");
        conditions.Add(@"(
            CASE WHEN EXTRACT(MONTH FROM rv.""RevalutionDate"") >= 7
                 THEN EXTRACT(YEAR FROM rv.""RevalutionDate"")::TEXT || '/' || (EXTRACT(YEAR FROM rv.""RevalutionDate"")::INTEGER + 1)::TEXT
                 ELSE (EXTRACT(YEAR FROM rv.""RevalutionDate"")::INTEGER - 1)::TEXT || '/' || EXTRACT(YEAR FROM rv.""RevalutionDate"")::TEXT
            END) = @finYear");
        conditions.Add(@"(
            (EXTRACT(MONTH FROM rv.""RevalutionDate"") >= 7
             AND (EXTRACT(MONTH FROM rv.""RevalutionDate"") - 6) BETWEEN @fromPeriod AND @toPeriod)
            OR
            (EXTRACT(MONTH FROM rv.""RevalutionDate"") < 7
             AND (EXTRACT(MONTH FROM rv.""RevalutionDate"") + 6) BETWEEN @fromPeriod AND @toPeriod))");

        if (typeId.HasValue)            conditions.Add(@"i.""AssetType_ID"" = @typeId");
        if (categoryId.HasValue)        conditions.Add(@"i.""AssetCategory_ID"" = @categoryId");
        if (subCategoryId.HasValue)     conditions.Add(@"i.""Asset_SubCategory_ID"" = @subCategoryId");
        if (measurementTypeId.HasValue) conditions.Add(@"i.""MeasurementType_ID"" = @measurementTypeId");
        if (statusId.HasValue)          conditions.Add(@"i.""AssetStatus_ID"" = @statusId");
        if (assetItemId.HasValue)       conditions.Add(@"i.""AssetRegisterItem_ID"" = @assetItemId");

        var whereClause = string.Join("\n  AND ", conditions);

        var sql = $@"
SELECT
    i.""AssetRegisterItem_ID""                                    AS ""assetId"",
    COALESCE(i.""Barcode"", '')                                   AS ""barcode"",
    COALESCE(i.""Description"", '')                               AS ""description"",
    COALESCE(astp.""AssetTypeDesc"", '')                          AS ""assetType"",
    COALESCE(acc.""AssetCategoryDesc"", '')                       AS ""assetCategory"",
    COALESCE(sc.""Asset_SubCategoryDescription"", '')             AS ""assetSubCategory"",
    COALESCE(meas.""Name"", '')                                   AS ""measurementType"",
    COALESCE(cas.""AssetStatusDesc"", '')                         AS ""assetStatus"",
    '' AS ""department"",
    '' AS ""division"",
    COALESCE(i.""latitude""::text, '')                            AS ""latitude"",
    COALESCE(i.""longitude""::text, '')                           AS ""longitude"",
    CASE WHEN COALESCE(i.""CashOrNoncashgeneratingunit"", '') IN ('Non','1') THEN 'Non Cash'
         WHEN COALESCE(i.""CashOrNoncashgeneratingunit"", '') = '' THEN ''
         ELSE 'Cash' END                                          AS ""cashNonCash"",
    COALESCE(i.""InfrastructurOrNonInfrastructure"", '')          AS ""infraNonInfra"",
    @finYear                                                      AS ""financialYear"",
    rv.""RevalutionDate""                                         AS ""revaluationDate"",
    COALESCE(rv.""RevalautionAmt"", 0)                            AS ""revaluationAmount"",
    COALESCE(rv.""SurplusAmount"", 0)                             AS ""surplusAmount"",
    COALESCE(rv.""DepreciationAdjustment"", 0)                    AS ""depreciationAdjustment"",
    COALESCE(rv.""DiffDepAcc"", 0)                                AS ""diffDepAccumulated"",
    COALESCE(rv.""DiffBook"", 0)                                  AS ""diffBookValue"",
    COALESCE(ats.""CarryingAmountOpening"", 0)                    AS ""openingCarryingAmount"",
    COALESCE(ats.""CarryingAmountClosing"", 0)                    AS ""closingCarryingAmount"",
    COALESCE(ats.""CostOpening"", 0)                              AS ""costOpening"",
    COALESCE(ats.""CostClosing"", 0)                              AS ""costClosing"",
    COALESCE(ats.""AccDepOpening"", 0)                            AS ""accDepOpening"",
    COALESCE(ats.""AccDepClosing"", 0)                            AS ""accDepClosing"",
    COALESCE(ats.""RevalReserveOpening"", 0)                      AS ""revalReserveOpening"",
    COALESCE(ats.""RevalReserveClosing"", 0)                      AS ""revalReserveClosing"",
    COALESCE(ats.""MovementInRevaluationReserve"", 0)             AS ""movementInRevalReserve""
FROM ""Asset_Revaluations"" rv
JOIN ""Asset_Register_Items"" i ON i.""AssetRegisterItem_ID"" = rv.""AssetRegisterID""
LEFT JOIN ""Const_AssetType_Sys"" astp ON i.""AssetType_ID"" = astp.""AssetType_ID""
LEFT JOIN ""Const_AssetCategory_sys"" acc ON i.""AssetCategory_ID"" = acc.""AssetCategoryID""
LEFT JOIN ""Const_Asset_SubCategory"" sc ON i.""Asset_SubCategory_ID"" = sc.""Asset_SubCategory_ID""
LEFT JOIN ""AssetConfig_MeasurementType"" meas ON i.""MeasurementType_ID"" = meas.""AssetConfig_MeasurementType_ID""
LEFT JOIN ""Const_AssetStatus_Sys"" cas ON i.""AssetStatus_ID"" = cas.""AssetStatus_ID""


LEFT JOIN (
    SELECT
        ""AssetRegisterItemID"",
        MIN(COALESCE(NULLIF(""CostOpeningBalance""::text,'')::numeric, 0))                    AS ""CostOpening"",
        MAX(COALESCE(NULLIF(""CostClosingBalance""::text,'')::numeric, 0))                    AS ""CostClosing"",
        MIN(COALESCE(NULLIF(""AccumulatedDepreciationOpeningBalance""::text,'')::numeric, 0)) AS ""AccDepOpening"",
        MAX(COALESCE(NULLIF(""AccumulatedDepreciationClosingBalance""::text,'')::numeric, 0)) AS ""AccDepClosing"",
        MIN(COALESCE(NULLIF(""AccumulatedRevaluationOpeningBalance""::text,'')::numeric, 0))  AS ""RevalReserveOpening"",
        MAX(COALESCE(NULLIF(""AccumulatedRevaluationClosingBalance""::text,'')::numeric, 0))  AS ""RevalReserveClosing"",
        MIN(COALESCE(NULLIF(""CurrentValue""::text,'')::numeric, 0)
          - COALESCE(NULLIF(""AccumulatedDepreciationOpeningBalance""::text,'')::numeric, 0)
          - COALESCE(NULLIF(""AccumulatedImpairmentOpeningBalance""::text,'')::numeric, 0))   AS ""CarryingAmountOpening"",
        MAX(COALESCE(NULLIF(""CarryingAmount""::text,'')::numeric, 0))                        AS ""CarryingAmountClosing"",
        SUM(COALESCE(NULLIF(""MovementInRevaluationReserve""::text,'')::numeric, 0))          AS ""MovementInRevaluationReserve""
    FROM ""Asset_Transaction_Summary""
    WHERE ""FinancialYear"" = @finYear
      AND ""FinancialPeriod"" BETWEEN @fromPeriod AND @toPeriod
    GROUP BY ""AssetRegisterItemID""
) ats ON ats.""AssetRegisterItemID"" = i.""AssetRegisterItem_ID""
WHERE {whereClause}
ORDER BY rv.""RevalutionDate"" DESC, i.""AssetRegisterItem_ID""";

        var parameters = new Dapper.DynamicParameters();
        parameters.Add("finYear", finYear);
        parameters.Add("fromPeriod", fromPeriod);
        parameters.Add("toPeriod", toPeriod);
        if (typeId.HasValue)            parameters.Add("typeId", typeId.Value);
        if (categoryId.HasValue)        parameters.Add("categoryId", categoryId.Value);
        if (subCategoryId.HasValue)     parameters.Add("subCategoryId", subCategoryId.Value);
        if (measurementTypeId.HasValue) parameters.Add("measurementTypeId", measurementTypeId.Value);
        if (statusId.HasValue)          parameters.Add("statusId", statusId.Value);
        if (assetItemId.HasValue)       parameters.Add("assetItemId", assetItemId.Value);

        var results = await conn.QueryAsync(sql, parameters, commandTimeout: 120);
        return Ok(results);
    }

    [HttpGet("impairment-report")]
    public async Task<IActionResult> GetImpairmentReport(
        [FromQuery] string? finYear = null,
        [FromQuery] int fromPeriod = 1,
        [FromQuery] int toPeriod = 12,
        [FromQuery] int? typeId = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int? subCategoryId = null,
        [FromQuery] int? measurementTypeId = null,
        [FromQuery] int? statusId = null,
        [FromQuery] int? assetItemId = null)
    {
        if (string.IsNullOrEmpty(finYear))
        {
            var now = DateTime.Now;
            finYear = now.Month >= 7 ? $"{now.Year}/{now.Year + 1}" : $"{now.Year - 1}/{now.Year}";
        }
        if (fromPeriod < 1) fromPeriod = 1;
        if (toPeriod > 12) toPeriod = 12;
        if (fromPeriod > toPeriod) fromPeriod = toPeriod;

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var conditions = new System.Collections.Generic.List<string>();
        conditions.Add(@"imp.""Approved"" = 1");
        conditions.Add(@"COALESCE(imp.""IsReversal"", 0) = 0");
        conditions.Add(@"(@finYear = '' OR COALESCE(imp.""FinYear"", '') = @finYear)");
        conditions.Add(@"(
            (EXTRACT(MONTH FROM imp.""ImpairmentDate"") >= 7
             AND (EXTRACT(MONTH FROM imp.""ImpairmentDate"") - 6) BETWEEN @fromPeriod AND @toPeriod)
            OR
            (EXTRACT(MONTH FROM imp.""ImpairmentDate"") < 7
             AND (EXTRACT(MONTH FROM imp.""ImpairmentDate"") + 6) BETWEEN @fromPeriod AND @toPeriod))");

        if (typeId.HasValue)            conditions.Add(@"i.""AssetType_ID"" = @typeId");
        if (categoryId.HasValue)        conditions.Add(@"i.""AssetCategory_ID"" = @categoryId");
        if (subCategoryId.HasValue)     conditions.Add(@"i.""Asset_SubCategory_ID"" = @subCategoryId");
        if (measurementTypeId.HasValue) conditions.Add(@"i.""MeasurementType_ID"" = @measurementTypeId");
        if (statusId.HasValue)          conditions.Add(@"i.""AssetStatus_ID"" = @statusId");
        if (assetItemId.HasValue)       conditions.Add(@"i.""AssetRegisterItem_ID"" = @assetItemId");

        var whereClause = string.Join("\n  AND ", conditions);
        var results = await conn.QueryAsync(BuildImpairmentSql(whereClause, false), BuildImpairmentParams(finYear, fromPeriod, toPeriod, typeId, categoryId, subCategoryId, measurementTypeId, statusId, assetItemId), commandTimeout: 120);
        return Ok(results);
    }

    [HttpGet("impairment-reversal-report")]
    public async Task<IActionResult> GetImpairmentReversalReport(
        [FromQuery] string? finYear = null,
        [FromQuery] int fromPeriod = 1,
        [FromQuery] int toPeriod = 12,
        [FromQuery] int? typeId = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int? subCategoryId = null,
        [FromQuery] int? measurementTypeId = null,
        [FromQuery] int? statusId = null,
        [FromQuery] int? assetItemId = null)
    {
        if (string.IsNullOrEmpty(finYear))
        {
            var now = DateTime.Now;
            finYear = now.Month >= 7 ? $"{now.Year}/{now.Year + 1}" : $"{now.Year - 1}/{now.Year}";
        }
        if (fromPeriod < 1) fromPeriod = 1;
        if (toPeriod > 12) toPeriod = 12;
        if (fromPeriod > toPeriod) fromPeriod = toPeriod;

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var conditions = new System.Collections.Generic.List<string>();
        conditions.Add(@"imp.""Approved"" = 1");
        conditions.Add(@"imp.""IsReversal"" = 1");
        conditions.Add(@"(@finYear = '' OR COALESCE(imp.""FinYear"", '') = @finYear)");
        conditions.Add(@"(
            (EXTRACT(MONTH FROM imp.""ImpairmentDate"") >= 7
             AND (EXTRACT(MONTH FROM imp.""ImpairmentDate"") - 6) BETWEEN @fromPeriod AND @toPeriod)
            OR
            (EXTRACT(MONTH FROM imp.""ImpairmentDate"") < 7
             AND (EXTRACT(MONTH FROM imp.""ImpairmentDate"") + 6) BETWEEN @fromPeriod AND @toPeriod))");

        if (typeId.HasValue)            conditions.Add(@"i.""AssetType_ID"" = @typeId");
        if (categoryId.HasValue)        conditions.Add(@"i.""AssetCategory_ID"" = @categoryId");
        if (subCategoryId.HasValue)     conditions.Add(@"i.""Asset_SubCategory_ID"" = @subCategoryId");
        if (measurementTypeId.HasValue) conditions.Add(@"i.""MeasurementType_ID"" = @measurementTypeId");
        if (statusId.HasValue)          conditions.Add(@"i.""AssetStatus_ID"" = @statusId");
        if (assetItemId.HasValue)       conditions.Add(@"i.""AssetRegisterItem_ID"" = @assetItemId");

        var whereClause = string.Join("\n  AND ", conditions);
        var results = await conn.QueryAsync(BuildImpairmentSql(whereClause, true), BuildImpairmentParams(finYear, fromPeriod, toPeriod, typeId, categoryId, subCategoryId, measurementTypeId, statusId, assetItemId), commandTimeout: 120);
        return Ok(results);
    }

    private static string BuildImpairmentSql(string whereClause, bool isReversal) => $@"
SELECT
    i.""AssetRegisterItem_ID""                                    AS ""assetId"",
    COALESCE(i.""Barcode"", '')                                   AS ""barcode"",
    COALESCE(i.""Description"", '')                               AS ""description"",
    COALESCE(astp.""AssetTypeDesc"", '')                          AS ""assetType"",
    COALESCE(acc.""AssetCategoryDesc"", '')                       AS ""assetCategory"",
    COALESCE(sc.""Asset_SubCategoryDescription"", '')             AS ""assetSubCategory"",
    COALESCE(meas.""Name"", '')                                   AS ""measurementType"",
    COALESCE(cas.""AssetStatusDesc"", '')                         AS ""assetStatus"",
    '' AS ""department"",
    '' AS ""division"",
    COALESCE(i.""latitude""::text, '')                            AS ""latitude"",
    COALESCE(i.""longitude""::text, '')                           AS ""longitude"",
    CASE WHEN COALESCE(i.""CashOrNoncashgeneratingunit"", '') IN ('Non','1') THEN 'Non Cash'
         WHEN COALESCE(i.""CashOrNoncashgeneratingunit"", '') = '' THEN ''
         ELSE 'Cash' END                                          AS ""cashNonCash"",
    COALESCE(i.""InfrastructurOrNonInfrastructure"", '')          AS ""infraNonInfra"",
    imp.""ImpairmentDate""                                        AS ""impairmentDate"",
    COALESCE(imp.""FinYear"", '')                                 AS ""financialYear"",
    COALESCE(imp.""PreviousCarryingAmount"", 0)                   AS ""previousCarryingAmount"",
    COALESCE(imp.""ImpairmentAmount"", 0)                         AS ""impairmentAmount"",
    COALESCE(imp.""NewCarryingAmount"", 0)                        AS ""newCarryingAmount"",
    COALESCE(ats.""RemainingUsefulLife"", 0)                       AS ""remainingUsefulLife"",
    COALESCE(imp.""Reason"", '')                                  AS ""reason"",
    CASE WHEN imp.""Approved"" = 1 THEN 'Approved' ELSE COALESCE(imp.""Status"", '') END AS ""approvalStatus"",
    COALESCE(ats.""AccImpOpening"", 0)                            AS ""accImpOpeningBalance"",
    COALESCE(ats.""AccImpClosing"", 0)                            AS ""accImpClosingBalance"",
    COALESCE(ats.""RevalReserveImpOpening"", 0)                   AS ""revalReserveImpOpening"",
    COALESCE(ats.""RevalReserveImpClosing"", 0)                   AS ""revalReserveImpClosing"",
    COALESCE(ats.""ImpairmentSurplus"", 0)                        AS ""impairmentSurplus"",
    COALESCE(ats.""CostOpening"", 0)                              AS ""costOpening"",
    COALESCE(ats.""CostClosing"", 0)                              AS ""costClosing"",
    COALESCE(ats.""AccDepOpening"", 0)                            AS ""accDepOpening"",
    COALESCE(ats.""AccDepClosing"", 0)                            AS ""accDepClosing"",
    {(isReversal
        ? @"COALESCE(ats.""AccImpReversalOpening"", 0)            AS ""accImpReversalOpening"",
    COALESCE(ats.""ImpReversalMovement"", 0)                      AS ""impReversalMovement"",
    COALESCE(ats.""AccImpReversalClosing"", 0)                    AS ""accImpReversalClosing"""
        : @"COALESCE(ats.""AccImpMovement"", 0)                   AS ""accImpMovement""")}
FROM ""Asset_Impairment"" imp
JOIN ""Asset_Register_Items"" i ON i.""AssetRegisterItem_ID"" = imp.""Asset_ItemID""
LEFT JOIN ""Const_AssetType_Sys"" astp ON i.""AssetType_ID"" = astp.""AssetType_ID""
LEFT JOIN ""Const_AssetCategory_sys"" acc ON i.""AssetCategory_ID"" = acc.""AssetCategoryID""
LEFT JOIN ""Const_Asset_SubCategory"" sc ON i.""Asset_SubCategory_ID"" = sc.""Asset_SubCategory_ID""
LEFT JOIN ""AssetConfig_MeasurementType"" meas ON i.""MeasurementType_ID"" = meas.""AssetConfig_MeasurementType_ID""
LEFT JOIN ""Const_AssetStatus_Sys"" cas ON i.""AssetStatus_ID"" = cas.""AssetStatus_ID""


LEFT JOIN (
    SELECT
        ""AssetRegisterItemID"",
        MAX(COALESCE(NULLIF(""RemainingUsefulLife""::text,'')::numeric, 0))                   AS ""RemainingUsefulLife"",
        MIN(COALESCE(NULLIF(""AccumulatedImpairmentOpeningBalance""::text,'')::numeric, 0))  AS ""AccImpOpening"",
        MAX(COALESCE(NULLIF(""AccumulatedImpairmentClosingBalance""::text,'')::numeric, 0))  AS ""AccImpClosing"",
        SUM(COALESCE(NULLIF(""AccumulatedImpairmentClosingBalance""::text,'')::numeric, 0)
          - COALESCE(NULLIF(""AccumulatedImpairmentOpeningBalance""::text,'')::numeric, 0))  AS ""AccImpMovement"",
        MIN(COALESCE(NULLIF(""RevaluationReserveImpairmentOpeningBalance""::text,'')::numeric, 0)) AS ""RevalReserveImpOpening"",
        MAX(COALESCE(NULLIF(""RevaluationReserveImpairmentClosingBalance""::text,'')::numeric, 0)) AS ""RevalReserveImpClosing"",
        SUM(COALESCE(NULLIF(""ImpairmentSurplus""::text,'')::numeric, 0))                    AS ""ImpairmentSurplus"",
        MIN(COALESCE(NULLIF(""CostOpeningBalance""::text,'')::numeric, 0))                   AS ""CostOpening"",
        MAX(COALESCE(NULLIF(""CostClosingBalance""::text,'')::numeric, 0))                   AS ""CostClosing"",
        MIN(COALESCE(NULLIF(""AccumulatedDepreciationOpeningBalance""::text,'')::numeric, 0)) AS ""AccDepOpening"",
        MAX(COALESCE(NULLIF(""AccumulatedDepreciationClosingBalance""::text,'')::numeric, 0)) AS ""AccDepClosing"",
        MIN(COALESCE(NULLIF(""AccumulatedImpairmentReversalOpeningBalance""::text,'')::numeric, 0)) AS ""AccImpReversalOpening"",
        SUM(COALESCE(NULLIF(""ImpairmentReversalValue""::text,'')::numeric, 0))               AS ""ImpReversalMovement"",
        MAX(COALESCE(NULLIF(""AccumulatedImpairmentReversalClosingBalance""::text,'')::numeric, 0)) AS ""AccImpReversalClosing"",
        MIN(COALESCE(NULLIF(""CurrentValue""::text,'')::numeric, 0)
          - COALESCE(NULLIF(""AccumulatedDepreciationOpeningBalance""::text,'')::numeric, 0)
          - COALESCE(NULLIF(""AccumulatedImpairmentOpeningBalance""::text,'')::numeric, 0))   AS ""CarryingAmountOpening"",
        MAX(COALESCE(NULLIF(""CarryingAmount""::text,'')::numeric, 0))                        AS ""CarryingAmountClosing""
    FROM ""Asset_Transaction_Summary""
    WHERE ""FinancialYear"" = @finYear
      AND ""FinancialPeriod"" BETWEEN @fromPeriod AND @toPeriod
    GROUP BY ""AssetRegisterItemID""
) ats ON ats.""AssetRegisterItemID"" = i.""AssetRegisterItem_ID""
WHERE {whereClause}
ORDER BY imp.""ImpairmentDate"" DESC, i.""AssetRegisterItem_ID""";

    private static Dapper.DynamicParameters BuildImpairmentParams(string finYear, int fromPeriod, int toPeriod, int? typeId, int? categoryId, int? subCategoryId, int? measurementTypeId, int? statusId, int? assetItemId)
    {
        var p = new Dapper.DynamicParameters();
        p.Add("finYear", finYear ?? "");
        p.Add("fromPeriod", fromPeriod);
        p.Add("toPeriod", toPeriod);
        if (typeId.HasValue)            p.Add("typeId", typeId.Value);
        if (categoryId.HasValue)        p.Add("categoryId", categoryId.Value);
        if (subCategoryId.HasValue)     p.Add("subCategoryId", subCategoryId.Value);
        if (measurementTypeId.HasValue) p.Add("measurementTypeId", measurementTypeId.Value);
        if (statusId.HasValue)          p.Add("statusId", statusId.Value);
        if (assetItemId.HasValue)       p.Add("assetItemId", assetItemId.Value);
        return p;
    }

    [HttpGet("refurbishment-report")]
    public async Task<IActionResult> GetRefurbishmentReport(
        [FromQuery] string? finYear = null,
        [FromQuery] int fromPeriod = 1,
        [FromQuery] int toPeriod = 12,
        [FromQuery] int? typeId = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int? subCategoryId = null,
        [FromQuery] int? measurementTypeId = null,
        [FromQuery] int? statusId = null,
        [FromQuery] int? assetItemId = null)
    {
        if (string.IsNullOrEmpty(finYear))
        {
            var now = DateTime.Now;
            finYear = now.Month >= 7 ? $"{now.Year}/{now.Year + 1}" : $"{now.Year - 1}/{now.Year}";
        }
        if (fromPeriod < 1) fromPeriod = 1;
        if (toPeriod > 12) toPeriod = 12;
        if (fromPeriod > toPeriod) fromPeriod = toPeriod;

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var conditions = new System.Collections.Generic.List<string>();
        conditions.Add(@"rf.""isApproved"" = TRUE");
        conditions.Add(@"(@finYear = '' OR rf.""FinancialYear"" = @finYear)");
        conditions.Add(@"rf.""FinancialPeriod"" BETWEEN @fromPeriod AND @toPeriod");

        if (typeId.HasValue)            conditions.Add(@"i.""AssetType_ID"" = @typeId");
        if (categoryId.HasValue)        conditions.Add(@"i.""AssetCategory_ID"" = @categoryId");
        if (subCategoryId.HasValue)     conditions.Add(@"i.""Asset_SubCategory_ID"" = @subCategoryId");
        if (measurementTypeId.HasValue) conditions.Add(@"i.""MeasurementType_ID"" = @measurementTypeId");
        if (statusId.HasValue)          conditions.Add(@"i.""AssetStatus_ID"" = @statusId");
        if (assetItemId.HasValue)       conditions.Add(@"i.""AssetRegisterItem_ID"" = @assetItemId");

        var whereClause = string.Join("\n  AND ", conditions);

        var sql = $@"
SELECT
    i.""AssetRegisterItem_ID""                                    AS ""assetId"",
    COALESCE(i.""Barcode"", '')                                   AS ""barcode"",
    COALESCE(i.""Description"", '')                               AS ""description"",
    COALESCE(astp.""AssetTypeDesc"", '')                          AS ""assetType"",
    COALESCE(acc.""AssetCategoryDesc"", '')                       AS ""assetCategory"",
    COALESCE(sc.""Asset_SubCategoryDescription"", '')             AS ""assetSubCategory"",
    COALESCE(meas.""Name"", '')                                   AS ""measurementType"",
    COALESCE(cas.""AssetStatusDesc"", '')                         AS ""assetStatus"",
    '' AS ""department"",
    '' AS ""division"",
    COALESCE(i.""latitude""::text, '')                            AS ""latitude"",
    COALESCE(i.""longitude""::text, '')                           AS ""longitude"",
    CASE WHEN COALESCE(i.""CashOrNoncashgeneratingunit"", '') IN ('Non','1') THEN 'Non Cash'
         WHEN COALESCE(i.""CashOrNoncashgeneratingunit"", '') = '' THEN ''
         ELSE 'Cash' END                                          AS ""cashNonCash"",
    COALESCE(i.""InfrastructurOrNonInfrastructure"", '')          AS ""infraNonInfra"",
    rf.""RefurbDate""                                             AS ""refurbDate"",
    COALESCE(rf.""FinancialYear"", '')                            AS ""financialYear"",
    rf.""FinancialPeriod""                                        AS ""financialPeriod"",
    COALESCE(rf.""Refurb_DT"", 0)                                AS ""debitAmount"",
    COALESCE(rf.""Refurb_CT"", 0)                                AS ""creditAmount"",
    COALESCE(rf.""Refurb_Depreciation"", 0)                      AS ""depreciationCharge"",
    COALESCE(rf.""Refurb_Revaluation"", 0)                       AS ""revaluationAmount"",
    COALESCE(rf.""Refurb_Impairment"", 0)                        AS ""impairmentAmount"",
    COALESCE(ats.""CarryingAmountOpening"", 0)                    AS ""openingCarryingAmount"",
    COALESCE(ats.""CarryingAmountClosing"", 0)                    AS ""closingCarryingAmount"",
    COALESCE(ats.""CostOpening"", 0)                              AS ""costOpening"",
    COALESCE(ats.""CostClosing"", 0)                              AS ""costClosing"",
    COALESCE(ats.""AccDepOpening"", 0)                            AS ""accDepOpening"",
    COALESCE(ats.""AccDepClosing"", 0)                            AS ""accDepClosing"",
    COALESCE(ats.""RefurbDT"", 0)                                 AS ""atsRefurbDebit"",
    COALESCE(ats.""RefurbCT"", 0)                                 AS ""atsRefurbCredit""
FROM ""Asset_Refurb"" rf
JOIN ""Asset_Register_Items"" i ON i.""AssetRegisterItem_ID"" = rf.""AssetRegisterID""
LEFT JOIN ""Const_AssetType_Sys"" astp ON i.""AssetType_ID"" = astp.""AssetType_ID""
LEFT JOIN ""Const_AssetCategory_sys"" acc ON i.""AssetCategory_ID"" = acc.""AssetCategoryID""
LEFT JOIN ""Const_Asset_SubCategory"" sc ON i.""Asset_SubCategory_ID"" = sc.""Asset_SubCategory_ID""
LEFT JOIN ""AssetConfig_MeasurementType"" meas ON i.""MeasurementType_ID"" = meas.""AssetConfig_MeasurementType_ID""
LEFT JOIN ""Const_AssetStatus_Sys"" cas ON i.""AssetStatus_ID"" = cas.""AssetStatus_ID""


LEFT JOIN (
    SELECT
        ""AssetRegisterItemID"",
        ""FinancialYear"",
        ""FinancialPeriod"",
        MIN(COALESCE(NULLIF(""CostOpeningBalance""::text,'')::numeric, 0))                    AS ""CostOpening"",
        MAX(COALESCE(NULLIF(""CostClosingBalance""::text,'')::numeric, 0))                    AS ""CostClosing"",
        MIN(COALESCE(NULLIF(""AccumulatedDepreciationOpeningBalance""::text,'')::numeric, 0)) AS ""AccDepOpening"",
        MAX(COALESCE(NULLIF(""AccumulatedDepreciationClosingBalance""::text,'')::numeric, 0)) AS ""AccDepClosing"",
        MIN(COALESCE(NULLIF(""CurrentValue""::text,'')::numeric, 0)
          - COALESCE(NULLIF(""AccumulatedDepreciationOpeningBalance""::text,'')::numeric, 0)
          - COALESCE(NULLIF(""AccumulatedImpairmentOpeningBalance""::text,'')::numeric, 0))   AS ""CarryingAmountOpening"",
        MAX(COALESCE(NULLIF(""CarryingAmount""::text,'')::numeric, 0))                        AS ""CarryingAmountClosing"",
        SUM(COALESCE(NULLIF(""RefurbDTValue""::text,'')::numeric, 0))                         AS ""RefurbDT"",
        SUM(COALESCE(NULLIF(""RefurbCTValue""::text,'')::numeric, 0))                         AS ""RefurbCT""
    FROM ""Asset_Transaction_Summary""
    WHERE ""FinancialYear"" = @finYear
      AND ""FinancialPeriod"" BETWEEN @fromPeriod AND @toPeriod
    GROUP BY ""AssetRegisterItemID"", ""FinancialYear"", ""FinancialPeriod""
) ats ON ats.""AssetRegisterItemID"" = i.""AssetRegisterItem_ID""
       AND ats.""FinancialYear"" = rf.""FinancialYear""
       AND ats.""FinancialPeriod"" = rf.""FinancialPeriod""
WHERE {whereClause}
ORDER BY rf.""RefurbDate"" DESC, i.""AssetRegisterItem_ID""";

        var parameters = new Dapper.DynamicParameters();
        parameters.Add("finYear", finYear ?? "");
        parameters.Add("fromPeriod", fromPeriod);
        parameters.Add("toPeriod", toPeriod);
        if (typeId.HasValue)            parameters.Add("typeId", typeId.Value);
        if (categoryId.HasValue)        parameters.Add("categoryId", categoryId.Value);
        if (subCategoryId.HasValue)     parameters.Add("subCategoryId", subCategoryId.Value);
        if (measurementTypeId.HasValue) parameters.Add("measurementTypeId", measurementTypeId.Value);
        if (statusId.HasValue)          parameters.Add("statusId", statusId.Value);
        if (assetItemId.HasValue)       parameters.Add("assetItemId", assetItemId.Value);

        var results = await conn.QueryAsync(sql, parameters, commandTimeout: 120);
        return Ok(results);
    }

    [HttpGet("prior-year-adjustments-report")]
    public async Task<IActionResult> GetPriorYearAdjustmentsReport(
        [FromQuery] string? finYear = null,
        [FromQuery] int fromPeriod = 1,
        [FromQuery] int toPeriod = 12,
        [FromQuery] int? typeId = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int? subCategoryId = null,
        [FromQuery] int? measurementTypeId = null,
        [FromQuery] int? statusId = null,
        [FromQuery] int? assetItemId = null)
    {
        if (string.IsNullOrEmpty(finYear))
        {
            var now = DateTime.Now;
            finYear = now.Month >= 7 ? $"{now.Year}/{now.Year + 1}" : $"{now.Year - 1}/{now.Year}";
        }
        if (fromPeriod < 1) fromPeriod = 1;
        if (toPeriod > 12) toPeriod = 12;
        if (fromPeriod > toPeriod) fromPeriod = toPeriod;

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var conditions = new System.Collections.Generic.List<string>();
        conditions.Add(@"pya.""Status"" = 'Approved'");
        conditions.Add(@"(@finYear = '' OR COALESCE(pya.""FinYear"", '') = @finYear)");
        conditions.Add(@"(pya.""EffectiveDate"" IS NULL OR (
            (EXTRACT(MONTH FROM pya.""EffectiveDate"") >= 7
             AND (EXTRACT(MONTH FROM pya.""EffectiveDate"") - 6) BETWEEN @fromPeriod AND @toPeriod)
            OR
            (EXTRACT(MONTH FROM pya.""EffectiveDate"") < 7
             AND (EXTRACT(MONTH FROM pya.""EffectiveDate"") + 6) BETWEEN @fromPeriod AND @toPeriod)))");

        if (typeId.HasValue)            conditions.Add(@"i.""AssetType_ID"" = @typeId");
        if (categoryId.HasValue)        conditions.Add(@"i.""AssetCategory_ID"" = @categoryId");
        if (subCategoryId.HasValue)     conditions.Add(@"i.""Asset_SubCategory_ID"" = @subCategoryId");
        if (measurementTypeId.HasValue) conditions.Add(@"i.""MeasurementType_ID"" = @measurementTypeId");
        if (statusId.HasValue)          conditions.Add(@"i.""AssetStatus_ID"" = @statusId");
        if (assetItemId.HasValue)       conditions.Add(@"i.""AssetRegisterItem_ID"" = @assetItemId");

        var whereClause = string.Join("\n  AND ", conditions);

        var sql = $@"
SELECT
    i.""AssetRegisterItem_ID""                                    AS ""assetId"",
    COALESCE(i.""Barcode"", '')                                   AS ""barcode"",
    COALESCE(i.""Description"", '')                               AS ""description"",
    COALESCE(astp.""AssetTypeDesc"", '')                          AS ""assetType"",
    COALESCE(acc.""AssetCategoryDesc"", '')                       AS ""assetCategory"",
    COALESCE(sc.""Asset_SubCategoryDescription"", '')             AS ""assetSubCategory"",
    COALESCE(meas.""Name"", '')                                   AS ""measurementType"",
    COALESCE(cas.""AssetStatusDesc"", '')                         AS ""assetStatus"",
    '' AS ""department"",
    '' AS ""division"",
    COALESCE(i.""latitude""::text, '')                            AS ""latitude"",
    COALESCE(i.""longitude""::text, '')                           AS ""longitude"",
    CASE WHEN COALESCE(i.""CashOrNoncashgeneratingunit"", '') IN ('Non','1') THEN 'Non Cash'
         WHEN COALESCE(i.""CashOrNoncashgeneratingunit"", '') = '' THEN ''
         ELSE 'Cash' END                                          AS ""cashNonCash"",
    COALESCE(i.""InfrastructurOrNonInfrastructure"", '')          AS ""infraNonInfra"",
    COALESCE(pya.""AdjustmentTypeCode"", '')                      AS ""adjustmentType"",
    pya.""EffectiveDate""                                         AS ""effectiveDate"",
    COALESCE(pya.""FinYear"", '')                                 AS ""financialYear"",
    COALESCE(pya.""Status"", '')                                  AS ""approvalStatus"",
    COALESCE(pya.""SnapshotCost"", 0)                             AS ""openingCost"",
    COALESCE(pya.""SnapshotAccDep"", 0)                          AS ""openingAccDep"",
    COALESCE(pya.""SnapshotAccImp"", 0)                          AS ""openingAccImp"",
    COALESCE(pya.""SnapshotCarryingAmount"", 0)                   AS ""openingCarryingAmount"",
    COALESCE(pya.""SnapshotRR"", 0)                               AS ""openingRevalReserve"",
    COALESCE(pya.""SnapshotRUL"", 0)                              AS ""snapshotRemainingUsefulLife"",
    COALESCE(pya.""NewCostAmount"", 0)                            AS ""newCostAmount"",
    COALESCE(pya.""NewValuationAmount"", 0)                       AS ""newValuationAmount"",
    COALESCE(pya.""NewImpairmentAmount"", 0)                      AS ""newImpairmentAmount"",
    COALESCE(pya.""NewRUL"", 0)                                   AS ""newRemainingUsefulLife"",
    COALESCE(pya.""CurrentPeriod_CostDelta"", 0)                  AS ""costDeltaCurrentPeriod"",
    COALESCE(pya.""CurrentPeriod_AccDepDelta"", 0)                AS ""accDepDeltaCurrentPeriod"",
    COALESCE(pya.""CurrentPeriod_AccImpDelta"", 0)                AS ""accImpDeltaCurrentPeriod"",
    COALESCE(pya.""CurrentPeriod_RRDelta"", 0)                    AS ""rrDeltaCurrentPeriod"",
    COALESCE(pya.""CurrentPeriod_DepChargeDelta"", 0)             AS ""depChargeDeltaCurrentPeriod"",
    COALESCE(pya.""ComparativePeriod_CostDelta"", 0)              AS ""costDeltaComparativePeriod"",
    COALESCE(pya.""ComparativePeriod_AccDepDelta"", 0)            AS ""accDepDeltaComparativePeriod"",
    COALESCE(pya.""ComparativePeriod_AccImpDelta"", 0)            AS ""accImpDeltaComparativePeriod"",
    COALESCE(pya.""ComparativePeriod_RRDelta"", 0)                AS ""rrDeltaComparativePeriod"",
    COALESCE(pya.""ComparativePeriod_DepChargeDelta"", 0)         AS ""depChargeDeltaComparativePeriod"",
    COALESCE(pya.""PriorPeriods_CostDelta"", 0)                   AS ""costDeltaPriorPeriods"",
    COALESCE(pya.""PriorPeriods_AccDepDelta"", 0)                 AS ""accDepDeltaPriorPeriods"",
    COALESCE(pya.""PriorPeriods_AccImpDelta"", 0)                 AS ""accImpDeltaPriorPeriods"",
    COALESCE(pya.""PriorPeriods_RRDelta"", 0)                     AS ""rrDeltaPriorPeriods"",
    COALESCE(pya.""PriorPeriods_DepChargeDelta"", 0)              AS ""depChargeDeltaPriorPeriods""
FROM ""Asset_PriorYearAdjustment"" pya
JOIN ""Asset_Register_Items"" i ON i.""AssetRegisterItem_ID"" = pya.""AssetRegisterItem_ID""
LEFT JOIN ""Const_AssetType_Sys"" astp ON i.""AssetType_ID"" = astp.""AssetType_ID""
LEFT JOIN ""Const_AssetCategory_sys"" acc ON i.""AssetCategory_ID"" = acc.""AssetCategoryID""
LEFT JOIN ""Const_Asset_SubCategory"" sc ON i.""Asset_SubCategory_ID"" = sc.""Asset_SubCategory_ID""
LEFT JOIN ""AssetConfig_MeasurementType"" meas ON i.""MeasurementType_ID"" = meas.""AssetConfig_MeasurementType_ID""
LEFT JOIN ""Const_AssetStatus_Sys"" cas ON i.""AssetStatus_ID"" = cas.""AssetStatus_ID""


WHERE {whereClause}
ORDER BY pya.""EffectiveDate"" DESC NULLS LAST, i.""AssetRegisterItem_ID""";

        var parameters = new Dapper.DynamicParameters();
        parameters.Add("finYear", finYear ?? "");
        parameters.Add("fromPeriod", fromPeriod);
        parameters.Add("toPeriod", toPeriod);
        if (typeId.HasValue)            parameters.Add("typeId", typeId.Value);
        if (categoryId.HasValue)        parameters.Add("categoryId", categoryId.Value);
        if (subCategoryId.HasValue)     parameters.Add("subCategoryId", subCategoryId.Value);
        if (measurementTypeId.HasValue) parameters.Add("measurementTypeId", measurementTypeId.Value);
        if (statusId.HasValue)          parameters.Add("statusId", statusId.Value);
        if (assetItemId.HasValue)       parameters.Add("assetItemId", assetItemId.Value);

        var results = await conn.QueryAsync(sql, parameters, commandTimeout: 120);
        return Ok(results);
    }

    [HttpGet("prior-period-adjustments-report")]
    public async Task<IActionResult> GetPriorPeriodAdjustmentsReport(
        [FromQuery] string? finYear = null,
        [FromQuery] int fromPeriod = 1,
        [FromQuery] int toPeriod = 12,
        [FromQuery] int? typeId = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] int? subCategoryId = null,
        [FromQuery] int? measurementTypeId = null,
        [FromQuery] int? statusId = null,
        [FromQuery] int? assetItemId = null)
    {
        if (string.IsNullOrEmpty(finYear))
        {
            var now = DateTime.Now;
            finYear = now.Month >= 7 ? $"{now.Year}/{now.Year + 1}" : $"{now.Year - 1}/{now.Year}";
        }
        if (fromPeriod < 1) fromPeriod = 1;
        if (toPeriod > 12) toPeriod = 12;
        if (fromPeriod > toPeriod) fromPeriod = toPeriod;

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var conditions = new System.Collections.Generic.List<string>();
        conditions.Add(@"ppa.""Status"" = 'Approved'");
        conditions.Add(@"(@finYear = '' OR COALESCE(ppa.""TargetFinYear"", '') = @finYear)");
        conditions.Add(@"ppa.""TargetFinPeriod"" BETWEEN @fromPeriod AND @toPeriod");

        if (typeId.HasValue)            conditions.Add(@"i.""AssetType_ID"" = @typeId");
        if (categoryId.HasValue)        conditions.Add(@"i.""AssetCategory_ID"" = @categoryId");
        if (subCategoryId.HasValue)     conditions.Add(@"i.""Asset_SubCategory_ID"" = @subCategoryId");
        if (measurementTypeId.HasValue) conditions.Add(@"i.""MeasurementType_ID"" = @measurementTypeId");
        if (statusId.HasValue)          conditions.Add(@"i.""AssetStatus_ID"" = @statusId");
        if (assetItemId.HasValue)       conditions.Add(@"i.""AssetRegisterItem_ID"" = @assetItemId");

        var whereClause = string.Join("\n  AND ", conditions);

        var sql = $@"
SELECT
    i.""AssetRegisterItem_ID""                                    AS ""assetId"",
    COALESCE(i.""Barcode"", '')                                   AS ""barcode"",
    COALESCE(i.""Description"", '')                               AS ""description"",
    COALESCE(astp.""AssetTypeDesc"", '')                          AS ""assetType"",
    COALESCE(acc.""AssetCategoryDesc"", '')                       AS ""assetCategory"",
    COALESCE(sc.""Asset_SubCategoryDescription"", '')             AS ""assetSubCategory"",
    COALESCE(meas.""Name"", '')                                   AS ""measurementType"",
    COALESCE(cas.""AssetStatusDesc"", '')                         AS ""assetStatus"",
    '' AS ""department"",
    '' AS ""division"",
    COALESCE(i.""latitude""::text, '')                            AS ""latitude"",
    COALESCE(i.""longitude""::text, '')                           AS ""longitude"",
    CASE WHEN COALESCE(i.""CashOrNoncashgeneratingunit"", '') IN ('Non','1') THEN 'Non Cash'
         WHEN COALESCE(i.""CashOrNoncashgeneratingunit"", '') = '' THEN ''
         ELSE 'Cash' END                                          AS ""cashNonCash"",
    COALESCE(i.""InfrastructurOrNonInfrastructure"", '')          AS ""infraNonInfra"",
    COALESCE(ppa.""AdjustmentTypeCode"", '')                      AS ""adjustmentType"",
    COALESCE(ppa.""TargetFinYear"", '')                           AS ""targetFinancialYear"",
    ppa.""TargetFinPeriod""                                       AS ""targetPeriod"",
    COALESCE(ppa.""Status"", '')                                  AS ""approvalStatus"",
    COALESCE(ppa.""DebitAmount"", 0)                              AS ""debitAmount"",
    COALESCE(ppa.""CreditAmount"", 0)                             AS ""creditAmount"",
    COALESCE(ppa.""AdjustmentAmount"", 0)                         AS ""adjustmentAmount"",
    COALESCE(ppa.""NewDepreciationAmount"", 0)                    AS ""newDepreciationAmount"",
    COALESCE(ppa.""NewCostAmount"", 0)                            AS ""newCostAmount"",
    COALESCE(ppa.""NewImpairmentAmount"", 0)                      AS ""newImpairmentAmount"",
    COALESCE(ppa.""NewImpairmentReversalAmount"", 0)              AS ""newImpairmentReversalAmount"",
    COALESCE(ppa.""NewRevaluationAmount"", 0)                     AS ""newRevaluationAmount"",
    COALESCE(ppa.""SnapshotCost"", 0)                             AS ""snapshotCost"",
    COALESCE(ppa.""SnapshotAccDep"", 0)                          AS ""openingAccDep"",
    COALESCE(ppa.""SnapshotAccImp"", 0)                          AS ""snapshotAccImp"",
    COALESCE(ppa.""SnapshotCarryingAmount"", 0)                   AS ""openingCarryingAmount"",
    COALESCE(ppa.""SnapshotRR"", 0)                               AS ""snapshotRevalReserve"",
    ppa.""TransactionDate""                                       AS ""transactionDate"",
    COALESCE(ppa.""Narration"", '')                               AS ""narration""
FROM ""Asset_PriorPeriodAdjustment"" ppa
JOIN ""Asset_Register_Items"" i ON i.""AssetRegisterItem_ID"" = ppa.""AssetRegisterItem_ID""
LEFT JOIN ""Const_AssetType_Sys"" astp ON i.""AssetType_ID"" = astp.""AssetType_ID""
LEFT JOIN ""Const_AssetCategory_sys"" acc ON i.""AssetCategory_ID"" = acc.""AssetCategoryID""
LEFT JOIN ""Const_Asset_SubCategory"" sc ON i.""Asset_SubCategory_ID"" = sc.""Asset_SubCategory_ID""
LEFT JOIN ""AssetConfig_MeasurementType"" meas ON i.""MeasurementType_ID"" = meas.""AssetConfig_MeasurementType_ID""
LEFT JOIN ""Const_AssetStatus_Sys"" cas ON i.""AssetStatus_ID"" = cas.""AssetStatus_ID""


WHERE {whereClause}
ORDER BY ppa.""TargetFinYear"" DESC, ppa.""TargetFinPeriod"" DESC, i.""AssetRegisterItem_ID""";

        var parameters = new Dapper.DynamicParameters();
        parameters.Add("finYear", finYear ?? "");
        parameters.Add("fromPeriod", fromPeriod);
        parameters.Add("toPeriod", toPeriod);
        if (typeId.HasValue)            parameters.Add("typeId", typeId.Value);
        if (categoryId.HasValue)        parameters.Add("categoryId", categoryId.Value);
        if (subCategoryId.HasValue)     parameters.Add("subCategoryId", subCategoryId.Value);
        if (measurementTypeId.HasValue) parameters.Add("measurementTypeId", measurementTypeId.Value);
        if (statusId.HasValue)          parameters.Add("statusId", statusId.Value);
        if (assetItemId.HasValue)       parameters.Add("assetItemId", assetItemId.Value);

        var results = await conn.QueryAsync(sql, parameters, commandTimeout: 120);
        return Ok(results);
    }

    [HttpGet("afs-reconciliation")]
    public async Task<IActionResult> GetAfsReconciliation([FromQuery] string? finYear)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var sql = @"
WITH ats AS (
    SELECT DISTINCT ON (t.""AssetRegisterItemID"")
        t.""AssetRegisterItemID"",
        t.""CostOpeningBalance"",
        t.""CorrectionOfErrorValue"",
        t.""AdditionVaue"",
        t.""AdditionalCostValue"",
        t.""WorkInProgressValue"",
        t.""RefurbDTValue"",
        t.""DepreciationAdjustment"",
        t.""FairValue"",
        t.""RevaluationValue"",
        t.""TransferFromValue"",
        t.""TransferToValue"",
        t.""DisposalValue"",
        t.""CostClosingBalance"",
        t.""AccumulatedDepreciationOpeningBalance"",
        t.""DepreciationValue"",
        t.""DisposalTotalValue"",
        t.""DepreciationOffset"",
        t.""AccumulatedDepreciationClosingBalance"",
        t.""AccumulatedImpairmentOpeningBalance"",
        t.""ImpairmentValue"",
        t.""ImpairmentReversalValue"",
        t.""DisposalLossValue"",
        t.""RevaluationReserveImpairment"",
        t.""AccumulatedImpairmentClosingBalance"",
        t.""CarryingAmount""
    FROM ""Asset_Transaction_Summary"" t
    WHERE t.""FinYear"" = @finYear
    ORDER BY t.""AssetRegisterItemID"", t.""FinancialPeriod"" DESC
)
SELECT
    COALESCE(astp.""AssetType_ID"", 0)               AS ""assetTypeId"",
    COALESCE(astp.""AssetTypeDesc"", 'Unknown')       AS ""assetTypeDesc"",
    COALESCE(acc.""AssetCategoryID"", 0)              AS ""assetCategoryId"",
    COALESCE(acc.""AssetCategoryDesc"", 'Unknown')    AS ""assetCategoryDesc"",
    SUM(COALESCE(t.""CostOpeningBalance"", 0))                    AS ""costOpeningBalance"",
    SUM(COALESCE(t.""CorrectionOfErrorValue"", 0))                AS ""correctionOfError"",
    SUM(COALESCE(t.""AdditionVaue"", 0))                          AS ""acquisitions"",
    SUM(COALESCE(t.""AdditionalCostValue"", 0))                   AS ""decommissioning"",
    SUM(COALESCE(t.""WorkInProgressValue"", 0))                   AS ""workInProgress"",
    SUM(COALESCE(t.""RefurbDTValue"", 0))                         AS ""refurbishment"",
    SUM(COALESCE(t.""DepreciationAdjustment"", 0))                AS ""changeInEstimate"",
    SUM(COALESCE(t.""FairValue"", 0))                             AS ""fairValueAdjustment"",
    SUM(COALESCE(t.""RevaluationValue"", 0))                      AS ""revaluation"",
    SUM(COALESCE(t.""TransferFromValue"", 0))                     AS ""transferReceived"",
    SUM(COALESCE(t.""TransferToValue"", 0))                       AS ""transferMade"",
    SUM(COALESCE(t.""DisposalValue"", 0))                         AS ""costDisposal"",
    SUM(COALESCE(t.""CostClosingBalance"", 0))                    AS ""costClosingBalance"",
    SUM(COALESCE(t.""AccumulatedDepreciationOpeningBalance"", 0)) AS ""depOpeningBalance"",
    SUM(COALESCE(t.""DepreciationValue"", 0))                     AS ""depreciation"",
    SUM(COALESCE(t.""DepreciationAdjustment"", 0))                AS ""depAdjustments"",
    SUM(COALESCE(t.""DisposalTotalValue"", 0))                    AS ""depDisposal"",
    SUM(COALESCE(t.""DepreciationOffset"", 0))                    AS ""depTransfer"",
    SUM(COALESCE(t.""AccumulatedDepreciationClosingBalance"", 0)) AS ""depClosingBalance"",
    SUM(COALESCE(t.""AccumulatedImpairmentOpeningBalance"", 0))   AS ""impOpeningBalance"",
    SUM(COALESCE(t.""ImpairmentValue"", 0))                       AS ""impairment"",
    SUM(COALESCE(t.""ImpairmentReversalValue"", 0))               AS ""impairmentReversal"",
    SUM(COALESCE(t.""DisposalLossValue"", 0))                     AS ""impDisposal"",
    SUM(COALESCE(t.""RevaluationReserveImpairment"", 0))          AS ""impTransfers"",
    SUM(COALESCE(t.""AccumulatedImpairmentClosingBalance"", 0))   AS ""impClosingBalance"",
    SUM(COALESCE(t.""CarryingAmount"", 0))                        AS ""carryingAmount""
FROM ats t
JOIN ""Asset_Register_Items"" i ON i.""AssetRegisterItem_ID"" = t.""AssetRegisterItemID""
LEFT JOIN ""Const_AssetType_Sys"" astp ON i.""AssetType_ID"" = astp.""AssetType_ID""
LEFT JOIN ""Const_AssetCategory_sys"" acc ON i.""AssetCategory_ID"" = acc.""AssetCategoryID""
GROUP BY astp.""AssetType_ID"", astp.""AssetTypeDesc"", acc.""AssetCategoryID"", acc.""AssetCategoryDesc""
ORDER BY COALESCE(astp.""AssetTypeDesc"", ''), COALESCE(acc.""AssetCategoryDesc"", '')";

        var parameters = new Dapper.DynamicParameters();
        parameters.Add("finYear", finYear ?? "");

        var results = await conn.QueryAsync(sql, parameters, commandTimeout: 120);
        return Ok(results);
    }

    [HttpGet("afs-reconciliation/drilldown")]
    public async Task<IActionResult> GetAfsReconciliationDrilldown([FromQuery] string? finYear, [FromQuery] int? categoryId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var sql = @"
WITH ats AS (
    SELECT DISTINCT ON (t.""AssetRegisterItemID"")
        t.""AssetRegisterItemID"",
        t.""CostOpeningBalance"",
        t.""CorrectionOfErrorValue"",
        t.""AdditionVaue"",
        t.""AdditionalCostValue"",
        t.""WorkInProgressValue"",
        t.""RefurbDTValue"",
        t.""DepreciationAdjustment"",
        t.""FairValue"",
        t.""RevaluationValue"",
        t.""TransferFromValue"",
        t.""TransferToValue"",
        t.""DisposalValue"",
        t.""CostClosingBalance"",
        t.""AccumulatedDepreciationOpeningBalance"",
        t.""DepreciationValue"",
        t.""DisposalTotalValue"",
        t.""DepreciationOffset"",
        t.""AccumulatedDepreciationClosingBalance"",
        t.""AccumulatedImpairmentOpeningBalance"",
        t.""ImpairmentValue"",
        t.""ImpairmentReversalValue"",
        t.""DisposalLossValue"",
        t.""RevaluationReserveImpairment"",
        t.""AccumulatedImpairmentClosingBalance"",
        t.""CarryingAmount""
    FROM ""Asset_Transaction_Summary"" t
    WHERE t.""FinYear"" = @finYear
    ORDER BY t.""AssetRegisterItemID"", t.""FinancialPeriod"" DESC
)
SELECT
    i.""AssetRegisterItem_ID""                              AS ""assetId"",
    COALESCE(i.""Description"", '')                         AS ""description"",
    COALESCE(astp.""AssetTypeDesc"", '')                    AS ""assetTypeDesc"",
    COALESCE(acc.""AssetCategoryDesc"", '')                 AS ""assetCategoryDesc"",
    COALESCE(sc.""Asset_SubCategoryDescription"", '')       AS ""subCategory"",
    COALESCE(meas.""Name"", '')                             AS ""measurementType"",
    COALESCE(cas.""AssetStatusDesc"", '')                   AS ""assetStatus"",
    COALESCE(t.""CostOpeningBalance"", 0)                   AS ""costOpeningBalance"",
    COALESCE(t.""CorrectionOfErrorValue"", 0)               AS ""correctionOfError"",
    COALESCE(t.""AdditionVaue"", 0)                         AS ""acquisitions"",
    COALESCE(t.""AdditionalCostValue"", 0)                  AS ""decommissioning"",
    COALESCE(t.""WorkInProgressValue"", 0)                  AS ""workInProgress"",
    COALESCE(t.""RefurbDTValue"", 0)                        AS ""refurbishment"",
    COALESCE(t.""DepreciationAdjustment"", 0)               AS ""changeInEstimate"",
    COALESCE(t.""FairValue"", 0)                            AS ""fairValueAdjustment"",
    COALESCE(t.""RevaluationValue"", 0)                     AS ""revaluation"",
    COALESCE(t.""TransferFromValue"", 0)                    AS ""transferReceived"",
    COALESCE(t.""TransferToValue"", 0)                      AS ""transferMade"",
    COALESCE(t.""DisposalValue"", 0)                        AS ""costDisposal"",
    COALESCE(t.""CostClosingBalance"", 0)                   AS ""costClosingBalance"",
    COALESCE(t.""AccumulatedDepreciationOpeningBalance"", 0) AS ""depOpeningBalance"",
    COALESCE(t.""DepreciationValue"", 0)                    AS ""depreciation"",
    COALESCE(t.""DepreciationAdjustment"", 0)               AS ""depAdjustments"",
    COALESCE(t.""DisposalTotalValue"", 0)                   AS ""depDisposal"",
    COALESCE(t.""DepreciationOffset"", 0)                   AS ""depTransfer"",
    COALESCE(t.""AccumulatedDepreciationClosingBalance"", 0) AS ""depClosingBalance"",
    COALESCE(t.""AccumulatedImpairmentOpeningBalance"", 0)  AS ""impOpeningBalance"",
    COALESCE(t.""ImpairmentValue"", 0)                      AS ""impairment"",
    COALESCE(t.""ImpairmentReversalValue"", 0)              AS ""impairmentReversal"",
    COALESCE(t.""DisposalLossValue"", 0)                    AS ""impDisposal"",
    COALESCE(t.""RevaluationReserveImpairment"", 0)         AS ""impTransfers"",
    COALESCE(t.""AccumulatedImpairmentClosingBalance"", 0)  AS ""impClosingBalance"",
    COALESCE(t.""CarryingAmount"", 0)                       AS ""carryingAmount""
FROM ats t
JOIN ""Asset_Register_Items"" i ON i.""AssetRegisterItem_ID"" = t.""AssetRegisterItemID""
LEFT JOIN ""Const_AssetType_Sys"" astp ON i.""AssetType_ID"" = astp.""AssetType_ID""
LEFT JOIN ""Const_AssetCategory_sys"" acc ON i.""AssetCategory_ID"" = acc.""AssetCategoryID""
LEFT JOIN ""Const_Asset_SubCategory"" sc ON i.""Asset_SubCategory_ID"" = sc.""Asset_SubCategory_ID""
LEFT JOIN ""AssetConfig_MeasurementType"" meas ON i.""MeasurementType_ID"" = meas.""AssetConfig_MeasurementType_ID""
LEFT JOIN ""Const_AssetStatus_Sys"" cas ON i.""AssetStatus_ID"" = cas.""AssetStatus_ID""
WHERE acc.""AssetCategoryID"" = @categoryId
ORDER BY i.""AssetRegisterItem_ID""";

        var parameters = new Dapper.DynamicParameters();
        parameters.Add("finYear", finYear ?? "");
        parameters.Add("categoryId", categoryId ?? 0);

        var results = await conn.QueryAsync(sql, parameters, commandTimeout: 120);
        return Ok(results);
    }

    [HttpGet("location-content-filters")]
    public async Task<IActionResult> GetLocationContentFilters()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var rooms = await _location.GetRoomsWithAssetsAsync(conn);

        var idsSql = @"
            SELECT
                COALESCE(""Custodian_ID"", 0)                                             AS ""custodianId"",
                CAST(NULLIF(""MunicipalDepartment_ID"", '') AS INTEGER)                   AS ""departmentId"",
                COALESCE(""DivisionID"", 0)                                               AS ""divisionId""
            FROM ""Asset_Register_Items""
            WHERE ""Room_ID"" IS NOT NULL
              AND COALESCE(""Decommissioning"", 0) = 0";

        var idRows = (await conn.QueryAsync(idsSql)).AsList();
        var custodianIds = idRows.Select(r => (int)(r.custodianId ?? 0)).Where(x => x > 0).Distinct().ToArray();
        var departmentIds = idRows.Select(r => r.departmentId == null ? 0 : (int)r.departmentId).Where(x => x > 0).Distinct().ToArray();
        var divisionIds   = idRows.Select(r => (int)(r.divisionId ?? 0)).Where(x => x > 0).Distinct().ToArray();

        var custodians = await _lookup.GetEmployeesByIdsAsync(conn, custodianIds);
        var departments = await _lookup.GetDepartmentsByIdsAsync(conn, departmentIds);
        var divisions   = await _lookup.GetDivisionsByIdsAsync(conn, divisionIds);

        return Ok(new {
            rooms = rooms,
            custodians = custodians,
            departments = departments,
            divisions = divisions
        });
    }
}
