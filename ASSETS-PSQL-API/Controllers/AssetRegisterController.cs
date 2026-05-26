using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Services;
using System.Text.Json;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-register-items")]
public class AssetRegisterController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly LookupService _lookup;

    public AssetRegisterController(DbConnectionFactory db, LookupService lookup)
    {
        _db = db;
        _lookup = lookup;
    }

    private static object? UnwrapJsonElement(object? value)
    {
        if (value is JsonElement je)
        {
            return je.ValueKind switch
            {
                JsonValueKind.String  => ConvertString(je.GetString()),
                JsonValueKind.True    => (object?)true,
                JsonValueKind.False   => (object?)false,
                JsonValueKind.Null    => null,
                JsonValueKind.Number  => je.TryGetInt64(out var l) ? (object?)l : je.GetDouble(),
                _                    => null
            };
        }
        return value;
    }

    private static object? ConvertString(string? s)
    {
        if (s == null) return null;
        if (DateTime.TryParse(s, System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.RoundtripKind, out var dt))
            return dt;
        return s;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? category = null,
        [FromQuery] string? status = null,
        [FromQuery] string? condition = null,
        [FromQuery] string? department = null,
        [FromQuery] string? type = null,
        [FromQuery] string? subCategory = null)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var filters = new List<string>();
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(search))
        {
            filters.Add(@"(CAST(a.""AssetRegisterItem_ID"" AS TEXT) ILIKE @search OR a.""Description"" ILIKE @search OR a.""Barcode"" ILIKE @search OR a.""SerialNumber"" ILIKE @search OR a.""RegistrationNumber"" ILIKE @search)");
            parameters.Add("search", "%" + search.Trim() + "%");
        }
        if (!string.IsNullOrWhiteSpace(category))
        {
            filters.Add(@"a.""AssetCategory_ID"" = @category");
            parameters.Add("category", int.TryParse(category, out var catId) ? (object)catId : category);
        }
        if (!string.IsNullOrWhiteSpace(status))
        {
            filters.Add(@"a.""AssetStatus_ID"" = @status");
            parameters.Add("status", int.TryParse(status, out var statId) ? (object)statId : status);
        }
        if (!string.IsNullOrWhiteSpace(condition))
        {
            filters.Add(@"a.""AssetCondition_ID"" = @condition");
            parameters.Add("condition", int.TryParse(condition, out var condId) ? (object)condId : condition);
        }
        if (!string.IsNullOrWhiteSpace(department))
        {
            filters.Add(@"a.""MunicipalDepartment_ID"" = @department");
            parameters.Add("department", int.TryParse(department, out var deptId) ? (object)deptId : department);
        }
        if (!string.IsNullOrWhiteSpace(type))
        {
            filters.Add(@"a.""AssetType_ID"" = @type");
            parameters.Add("type", int.TryParse(type, out var typeId) ? (object)typeId : type);
        }
        if (!string.IsNullOrWhiteSpace(subCategory))
        {
            filters.Add(@"a.""Asset_SubCategory_ID"" = @subCategory");
            parameters.Add("subCategory", int.TryParse(subCategory, out var subCatId) ? (object)subCatId : subCategory);
        }

        var whereClause = filters.Count > 0 ? "WHERE " + string.Join(" AND ", filters) : "";

        var countSql = $@"SELECT COUNT(*) FROM ""Asset_Register_Items"" a {whereClause}";
        var total = await conn.ExecuteScalarAsync<int>(countSql, parameters);

        var offset = (page - 1) * pageSize;
        parameters.Add("limit", pageSize);
        parameters.Add("offset", offset);

        // Deferred-join pattern: first resolve the page's IDs cheaply (index-only scan +
        // OFFSET on the PK), then JOIN full data only for those rows. This keeps page
        // jumps fast regardless of page number (avoids scanning 20 000+ rows for
        // expensive LATERAL/JOIN operations before returning the 20 we need).
        // Shared entity tables (Const_Department, Payroll_Employee) are resolved via
        // LookupService batch calls to honour the shared-table access architecture.
        var dataSql = $@"
            WITH page_ids AS (
                SELECT a.""AssetRegisterItem_ID""
                FROM ""Asset_Register_Items"" a
                {whereClause}
                ORDER BY a.""AssetRegisterItem_ID""
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            )
            SELECT
                a.""AssetRegisterItem_ID"" as ""assetId"",
                a.""Description"" as ""description"",
                COALESCE(cat.""AssetCategoryDesc"", '') as ""categoryName"",
                COALESCE(sub.""Asset_SubCategoryDescription"", '') as ""subCategoryName"",
                COALESCE(at.""AssetTypeDesc"", '') as ""assetTypeName"",
                COALESCE(cond.""Description"", '') as ""condition"",
                COALESCE(mt.""Name"", '') as ""measurementType"",
                COALESCE(mt.""NoDepreciation"", 0) as ""noDepreciation"",
                COALESCE(st.""AssetStatusDesc"", '') as ""status"",
                COALESCE(latest.""CostClosingBalance"", a.""PurchaseAmount"") as ""costClosingBalance"",
                COALESCE(latest.""AccumulatedDepreciationClosingBalance"", a.""AccumulatedDepreciationClosingBalance"") as ""depreciationClosingBalance"",
                COALESCE(latest.""CarryingAmount"", a.""CurrentAmount"", a.""CarryingAmountClosingBalance"") as ""carryingAmount"",
                COALESCE(latest.""AccumulatedImpairmentClosingBalance"", a.""AccumulatedImpairmentClosingBalance"") as ""accumulatedImpairment"",
                COALESCE(latest.""AccumulatedRevaluationClosingBalance"", a.""RevaluationOpeningBalance"") as ""accumulatedRevaluationsClosing"",
                COALESCE(latest.""AccumulatedRevaluationClosingBalance"", a.""RevaluationReserveClosingBalance"", 0) as ""revaluationReserveClosingBalance"",
                a.""MunicipalDepartment_ID"" as ""municipalDepartmentId"",
                a.""Custodian_ID"" as ""custodianId"",
                a.""Make"" as ""make"",
                a.""Model"" as ""model"",
                a.""SerialNumber"" as ""serialNumber"",
                a.""RegistrationNumber"" as ""registrationNumber"",
                a.""Barcode"" as ""barcode"",
                a.""AcquisitionDate"" as ""acquisitionDate"",
                a.""InserviceDate"" as ""inServiceDate"",
                a.""latitude"" as ""latitude"",
                a.""longitude"" as ""longitude""
            FROM page_ids
            JOIN ""Asset_Register_Items"" a ON a.""AssetRegisterItem_ID"" = page_ids.""AssetRegisterItem_ID""
            LEFT JOIN LATERAL (
                SELECT s.""CostClosingBalance"", s.""AccumulatedDepreciationClosingBalance"",
                       s.""CarryingAmount"", s.""AccumulatedImpairmentClosingBalance"",
                       s.""AccumulatedRevaluationClosingBalance"", s.""RemainingUsefulLife""
                FROM ""Asset_Transaction_Summary"" s
                WHERE COALESCE(s.""AssetRegisterItemID"", s.""AssetRegisterItem_ID"") = a.""AssetRegisterItem_ID""
                ORDER BY CAST(LEFT(COALESCE(s.""FinancialYear"", '0000/0000'), 4) AS INTEGER) DESC,
                         s.""FinancialPeriod"" DESC, s.""ID"" DESC
                LIMIT 1
            ) latest ON true
            LEFT JOIN ""Const_AssetCategory_sys"" cat ON a.""AssetCategory_ID"" = cat.""AssetCategoryID""
            LEFT JOIN ""Const_Asset_SubCategory"" sub ON a.""Asset_SubCategory_ID"" = sub.""Asset_SubCategory_ID""
            LEFT JOIN ""Const_AssetType_Sys"" at ON a.""AssetType_ID"" = at.""AssetType_ID""
            LEFT JOIN ""Const_Asset_Condition"" cond ON a.""AssetCondition_ID"" = cond.""Asset_Condition_ID""
            LEFT JOIN ""AssetConfig_MeasurementType"" mt ON a.""MeasurementType_ID"" = mt.""AssetConfig_MeasurementType_ID""
            LEFT JOIN ""Const_AssetStatus_Sys"" st ON a.""AssetStatus_ID"" = st.""AssetStatus_ID""
            ORDER BY a.""AssetRegisterItem_ID"";";
        var rawItems = (await conn.QueryAsync<dynamic>(dataSql, parameters)).ToList();

        // Batch-resolve Const_Department and Payroll_Employee through LookupService
        var deptIds = rawItems
            .Select(r => { var v = ((IDictionary<string, object>)r)["municipalDepartmentId"]; return v?.ToString(); })
            .Where(v => !string.IsNullOrEmpty(v) && int.TryParse(v, out _))
            .Select(v => int.Parse(v!))
            .Distinct().ToArray();
        var custodianIds = rawItems
            .Select(r => { var v = ((IDictionary<string, object>)r)["custodianId"]; return v; })
            .Where(v => v != null)
            .Select(v => Convert.ToInt32(v))
            .Distinct().ToArray();

        var depts = (await _lookup.GetDepartmentsByIdsAsync(conn, deptIds))
            .ToDictionary(d => (int)d.id, d => (string)d.description);
        var employees = (await _lookup.GetEmployeesByIdsAsync(conn, custodianIds))
            .ToDictionary(e => (int)e.id, e => (string)e.name);

        var items = rawItems.Select(r =>
        {
            var row = (IDictionary<string, object>)r;
            var deptIdStr = row["municipalDepartmentId"]?.ToString();
            int.TryParse(deptIdStr, out var deptId);
            var custId = row["custodianId"] != null ? Convert.ToInt32(row["custodianId"]) : 0;

            row["departmentName"] = deptId > 0 && depts.TryGetValue(deptId, out var dn) ? dn : "";
            row["custodian"]      = custId > 0 && employees.TryGetValue(custId, out var cn) ? cn : "";
            return r;
        }).ToList();

        var totalPages = (int)Math.Ceiling((double)total / pageSize);

        return Ok(new { data = items, total, totalPages, page });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        // Shared-entity tables (Const_Department, Const_Division, Payroll_Employee,
        // Const_Ward, Const_Building, Const_Floor, Const_Room) are resolved via
        // LookupService to honour the single-owner architecture rule.
        var sql = @"SELECT
                a.""AssetRegisterItem_ID"" as ""assetId"",
                a.""Description"" as ""description"",
                a.""Barcode"" as ""barcode"",
                a.""OldBarCode"" as ""oldBarcode"",
                a.""ParentAssetRegisterItem_ID"" as ""parentAssetId"",
                a.""MunicipalAssetID"" as ""municipalAssetId"",
                a.""MainAssetID"" as ""mainAssetId"",
                a.""MainAssetDescription"" as ""mainAssetDescription"",
                a.""ImageRef"" as ""imageRef"",

                COALESCE(cat.""AssetCategoryDesc"", '') as ""categoryName"",
                COALESCE(sub.""Asset_SubCategoryDescription"", '') as ""subCategoryName"",
                COALESCE(at.""AssetTypeDesc"", '') as ""assetTypeName"",
                COALESCE(cls.""AssetClassDesc"", '') as ""assetClassName"",
                COALESCE(cond.""Description"", '') as ""condition"",
                COALESCE(mt.""Name"", '') as ""measurementType"",
                COALESCE(mt.""NoDepreciation"", 0) as ""noDepreciation"",
                COALESCE(st.""AssetStatusDesc"", '') as ""status"",
                COALESCE(fs.""FinancialStatusDesc"", '') as ""financialStatus"",
                a.""AssetType_ID"" as ""assetTypeId"",
                a.""AssetCategory_ID"" as ""assetCategoryId"",
                a.""Asset_SubCategory_ID"" as ""assetSubCategoryId"",
                a.""AssetClass_ID"" as ""assetClassId"",
                a.""AssetStatus_ID"" as ""assetStatusId"",
                a.""MeasurementType_ID"" as ""measurementTypeId"",
                a.""AssetCondition_ID"" as ""assetConditionId"",
                a.""Financial_Status_ID"" as ""financialStatusId"",
                a.""AssetDepreciationMethod_ID"" as ""assetDepreciationMethodId"",
                COALESCE(dm.""AssetDepreciationMethodDesc"", '') as ""depreciationMethod"",
                a.""RevaluationMethod"" as ""revaluationMethod"",

                a.""InfrastructurOrNonInfrastructure"" as ""infrastructureType"",
                a.""NatureOfAddition"" as ""natureOfAddition"",

                a.""AcquisitionDate"" as ""acquisitionDate"",
                a.""CommisioningDate"" as ""commissioningDate"",
                a.""InserviceDate"" as ""inServiceDate"",
                a.""DateOfDisposal"" as ""disposalDate"",
                a.""Impairment_Date"" as ""impairmentDate"",
                a.""DateModified"" as ""dateModified"",
                a.""VerificationDate"" as ""verificationDate"",
                a.""VerificationDoneBy"" as ""verificationDoneBy"",
                a.""YearConstructed"" as ""yearConstructed"",
                a.""ForecastReplacementYear"" as ""forecastReplacementYear"",
                a.""DateCaptured"" as ""takeOnDate"",

                a.""InsuranceCover"" as ""insuranceCover"",
                a.""InsurancePolicyNo"" as ""insurancePolicyNo"",
                a.""Warranty"" as ""warranty"",

                a.""CurrentReplacementCostCRC"" as ""currentReplacementCost"",
                a.""DepreciatedReplacementCostDRC"" as ""depreciatedReplacementCost"",
                a.""AnnualisedMaintenanceCRC"" as ""annualisedMaintenanceCrc"",
                a.""AnnualMaintenanceBudgetNeed"" as ""annualMaintenanceBudgetNeed"",

                a.""UsefulLifeYearComponent"" as ""usefulLife"",
                a.""UsefulLifeMonthComponent"" as ""usefulLifeMonths"",
                a.""Remaining_Useful_Life_Year"" as ""remainingUsefulLife"",
                a.""RemainingUsefulLife"" as ""remainingUsefulLifeMonths"",
                a.""RemainingUsefulLifeAtTakeOn"" as ""remainingUsefulLifeAtTakeOn"",
                a.""ConstructionMaterial"" as ""constructionMaterial"",
                a.""UoM"" as ""uom"",
                a.""Dim1"" as ""dim1"",
                a.""Dim2"" as ""dim2"",
                a.""Dim3"" as ""dim3"",
                a.""DimensionQuantity"" as ""dimensionQuantity"",
                a.""Quantity"" as ""quantity"",
                a.""Diameter"" as ""diameter"",
                a.""Capacity"" as ""capacity"",

                a.""DeedNumber"" as ""deedNumber"",
                a.""ErfNumber"" as ""erfNumber"",
                a.""PortionNumber"" as ""portionNumber"",
                a.""ErfSizeM2"" as ""erfSize"",

                a.""Make"" as ""make"",
                a.""Model"" as ""model"",
                a.""UnitNumber"" as ""unitNumber"",
                a.""RegistrationNumber"" as ""registrationNumber"",
                a.""SerialNumber"" as ""serialNumber"",

                a.""Custodian_ID"" as ""custodianId"",
                a.""CustodianIdNumber"" as ""custodianIdNumber"",
                a.""BasicMunicipalityService"" as ""basicMunicipalityService"",

                a.""CriticalityGrade"" as ""criticalityGrade"",
                COALESCE(cg.""AssetCriticalityGradeDesc"", '') as ""criticalityGradeDesc"",
                COALESCE(cg.""ConsequenceOfFailure"", '') as ""consequenceOfFailureDesc"",
                a.""PerformanceGrade"" as ""performanceGrade"",
                COALESCE(pg.""AssetPerformanceGradeDesc"", '') as ""performanceGradeDesc"",
                a.""UtilisationGrade"" as ""utilisationGrade"",
                COALESCE(ug.""AssetUtilisationGradeDesc"", '') as ""utilisationGradeDesc"",
                a.""InfrastructureHealthGrade"" as ""infrastructureHealthGrade"",
                COALESCE(hg.""AssetHealthGradeDesc"", '') as ""healthGradeDesc"",
                a.""ConsequenceOfFailure"" as ""consequenceOfFailure"",
                a.""Risk"" as ""risk"",

                a.""AssetOwnershipName"" as ""assetOwnership"",
                CAST(NULLIF(a.""MunicipalDepartment_ID"", '') AS INTEGER) as ""municipalDepartmentId"",
                COALESCE(a.""LocationDescription"", '') as ""locationName"",
                COALESCE(a.""Suburb"", '') as ""suburb"",
                a.""latitude"" as ""latitude"",
                a.""longitude"" as ""longitude"",
                a.""Ward_ID"" as ""wardId"",
                a.""Building_ID"" as ""buildingId"",
                a.""FloorID"" as ""floorId"",
                a.""Room_ID"" as ""roomId"",
                a.""DivisionID"" as ""divisionId"",
                a.""Capturer_ID"" as ""capturerId"",
                a.""Modifier_ID"" as ""modifierId"",

                a.""FundingSourceNumber"" as ""fundingSourceNumber"",
                a.""FundingSourceAmount"" as ""fundingSourceAmount"",
                a.""FundType"" as ""fundType"",

                a.""PurchaseAmount"" as ""costOpeningBalance"",
                COALESCE(latest.""CostClosingBalance"", a.""PurchaseAmount"") as ""costClosingBalance"",
                a.""PurchaseAmount"" as ""acquisitionCost"",
                COALESCE(latest.""AccumulatedDepreciationClosingBalance"", a.""AccumulatedDepreciationClosingBalance"") as ""depreciationClosingBalance"",
                COALESCE(a.""AccumulatedDepreciationOpeningBalance"", 0) as ""depreciationOpeningBalance"",
                COALESCE(a.""AccumulatedDepreciationOtherChanges"", 0) as ""depreciationOtherChanges"",
                COALESCE(a.""AccumulatedDepreciationOpeningBalance"", 0) + COALESCE(a.""AccumulatedDepreciationOtherChanges"", 0) as ""depreciationRestatedOpening"",
                COALESCE(a.""AccumulatedDepreciationCurrentYear"", 0) as ""depreciation"",
                COALESCE(a.""CorrectionOfErrorAmount"", 0) as ""depreciationAdjustments"",
                COALESCE(a.""AccumulatedDepreciationDisposal"", 0) as ""disposalDepreciation"",
                COALESCE(a.""AccumulatedDepreciationTransfer"", 0) as ""depreciationTransfer"",
                COALESCE(a.""AccumulatedImpairmentOpeningBalance"", 0) as ""accImpairmentOpening"",
                COALESCE(a.""ImpairmentAmountCurrentYear"", 0) as ""impairment"",
                COALESCE(a.""ReversalOfImpairmentAmount"", 0) as ""impairmentReversal"",
                COALESCE(a.""DisposalImpairmentAmount"", 0) as ""disposalImpairment"",
                0 as ""impairmentOtherChanges"",
                COALESCE(a.""AccumulatedImpairmentOpeningBalance"", 0) as ""impairmentRestatedOpening"",
                0 as ""impairmentTransfers"",
                COALESCE(latest.""AccumulatedImpairmentClosingBalance"", a.""AccumulatedImpairmentClosingBalance"") as ""accImpairmentClosing"",
                a.""ResidualValue"" as ""residualValue"",
                COALESCE(latest.""CarryingAmount"", a.""CurrentAmount"", a.""CarryingAmountClosingBalance"") as ""carryingAmount"",

                a.""RevaluationOpeningBalance"" as ""accumulatedRevaluationsOpening"",
                COALESCE(latest.""AccumulatedRevaluationClosingBalance"", a.""RevaluationOpeningBalance"") as ""accumulatedRevaluationsClosing"",
                a.""RevaluationDate"" as ""revaluationDate"",
                a.""MovementInRevaluationReserve"" as ""movementInRevaluationReserve"",
                a.""DepreciationOffset"" as ""depreciationOffset"",
                COALESCE(latest.""AccumulatedRevaluationClosingBalance"", a.""RevaluationReserveClosingBalance"", 0) as ""revaluationReserveClosingBalance"",
                a.""DeemedCost"" as ""deemedCost"",

                a.""CIDMSSubComponentTypeID"" as ""cidmsSubComponentTypeId"",
                a.""CIDMSComponentType"" as ""cidmsComponentType"",
                a.""CIDMSAccountingGroup"" as ""cidmsAccountingGroup"",
                a.""CIDMSSubAccountingGroup"" as ""cidmsSubAccountingGroup"",
                a.""CIDMSAssetClass"" as ""cidmsAssetClass"",
                a.""CIDMSAssetGroupType"" as ""cidmsAssetGroupType"",
                a.""CIDMSAssetType"" as ""cidmsAssetType"",
                a.""CashOrNoncashgeneratingunit"" as ""cashGenerating"",
                a.""GisFeature"" as ""gisFeature"",
                a.""WellKnownTextWKT"" as ""wellKnownText"",
                a.""Town_ID"" as ""townId"",
                a.""Street_ID"" as ""streetId"",
                a.""SuburbID"" as ""suburbId"",
                a.""SupplierName"" as ""supplierName"",
                a.""SupplierCode"" as ""supplierCode"",
                a.""InsuredAmountInsuredBy"" as ""insuredAmount"",
                a.""ReasonForChange"" as ""reasonForChange"",
                a.""InvoiceNo"" as ""invoiceNo"",
                a.""DisposalDocNo"" as ""disposalDocNo"",
                a.""PaymentNo"" as ""paymentNo"",
                a.""FundingDescription"" as ""fundingDescription"",
                a.""LocationDescription"" as ""locationDescription"",
                a.""RoomResponsiblePerson"" as ""roomResponsiblePerson"",
                a.""ITHardwareResponsiblePerson"" as ""itHardwareResponsiblePerson"",

                a.""DonorRegNumber"" as ""donorRegNumber"",
                a.""Donor_Name"" as ""donorName"",
                a.""Date_Donated"" as ""dateDonated"",
                a.""SGNumberChange_ID"" as ""sgKey"",
                COALESCE(a.""AccumulatedDepreciationCurrentYear"", 0) as ""depreciationCurrentYear"",
                COALESCE(a.""ImpairmentAmountCurrentYear"", 0) as ""impairmentCurrentYear"",
                COALESCE(a.""ReversalOfImpairmentAmount"", 0) as ""impairmentReversalAmount"",

                d.""SalePrice"" as ""disposalProceeds"",
                d.""CarryingAmount"" as ""disposalValue"",
                d.""AmountProfitLoss"" as ""disposalProfitLoss"",
                d.""DisposalReason"" as ""disposalReason"",
                d.""Status"" as ""disposalStatus""

            FROM ""Asset_Register_Items"" a
            LEFT JOIN LATERAL (
                SELECT s.""CostClosingBalance"", s.""AccumulatedDepreciationClosingBalance"",
                       s.""CarryingAmount"", s.""AccumulatedImpairmentClosingBalance"",
                       s.""AccumulatedRevaluationClosingBalance"", s.""RemainingUsefulLife""
                FROM ""Asset_Transaction_Summary"" s
                WHERE COALESCE(s.""AssetRegisterItemID"", s.""AssetRegisterItem_ID"") = a.""AssetRegisterItem_ID""
                ORDER BY CAST(LEFT(COALESCE(s.""FinancialYear"", '0000/0000'), 4) AS INTEGER) DESC,
                         s.""FinancialPeriod"" DESC, s.""ID"" DESC
                LIMIT 1
            ) latest ON true
            LEFT JOIN ""Const_AssetCategory_sys"" cat ON a.""AssetCategory_ID"" = cat.""AssetCategoryID""
            LEFT JOIN ""Const_Asset_SubCategory"" sub ON a.""Asset_SubCategory_ID"" = sub.""Asset_SubCategory_ID""
            LEFT JOIN ""Const_AssetType_Sys"" at ON a.""AssetType_ID"" = at.""AssetType_ID""
            LEFT JOIN ""Const_Asset_Condition"" cond ON a.""AssetCondition_ID"" = cond.""Asset_Condition_ID""
            LEFT JOIN ""AssetConfig_MeasurementType"" mt ON a.""MeasurementType_ID"" = mt.""AssetConfig_MeasurementType_ID""
            LEFT JOIN ""Const_AssetStatus_Sys"" st ON a.""AssetStatus_ID"" = st.""AssetStatus_ID""
            LEFT JOIN ""AssetConfig_FinancialStatus"" fs ON a.""Financial_Status_ID"" = fs.""FinStatusID""
            LEFT JOIN ""Const_AssetClass_sys"" cls ON a.""AssetClass_ID"" = cls.""AssetClass_ID""
            LEFT JOIN ""Const_AssetDepreciationMethod_Sys"" dm ON a.""AssetDepreciationMethod_ID"" = dm.""AssetDepreciationMethod_ID""
            LEFT JOIN ""Const_Asset_Criticality_Grade"" cg ON a.""CriticalityGrade"" = cg.""AssetCriticalityGradeID""
            LEFT JOIN ""Const_Asset_Performance_Grade"" pg ON a.""PerformanceGrade"" = pg.""AssetPerformanceGradeID""
            LEFT JOIN ""Const_Asset_Utilisation_Grade"" ug ON a.""UtilisationGrade"" = ug.""AssetUtilisationGradeID""
            LEFT JOIN ""Const_Asset_Health_Grade"" hg ON a.""InfrastructureHealthGrade"" = hg.""AssetHealthGradeID""
            LEFT JOIN (
                SELECT DISTINCT ON (""AssetItemID"")
                    ""AssetItemID"", ""SalePrice"", ""CarryingAmount"", ""AmountProfitLoss"", ""DisposalReason"", ""Status""
                FROM ""Asset_Disposal""
                WHERE ""Status"" = 'Approved'
                ORDER BY ""AssetItemID"", ""AssetDisposal_ID"" DESC
            ) d ON d.""AssetItemID"" = a.""AssetRegisterItem_ID""
            WHERE a.""AssetRegisterItem_ID"" = @id";
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(sql, new { id });
        if (item is null) return NotFound(new { error = "Asset register item not found" });

        // Enrich shared-entity lookup fields via LookupService
        var row = (IDictionary<string, object>)item;

        int deptId = row["municipalDepartmentId"] != null ? Convert.ToInt32(row["municipalDepartmentId"]) : 0;
        int custId  = row["custodianId"]  != null ? Convert.ToInt32(row["custodianId"])  : 0;
        int captId  = row["capturerId"]   != null ? Convert.ToInt32(row["capturerId"])   : 0;
        int modId   = row["modifierId"]   != null ? Convert.ToInt32(row["modifierId"])   : 0;
        int divId   = row["divisionId"]   != null ? Convert.ToInt32(row["divisionId"])   : 0;
        int wardId  = row["wardId"]       != null ? Convert.ToInt32(row["wardId"])       : 0;
        int bldId   = row["buildingId"]   != null ? Convert.ToInt32(row["buildingId"])   : 0;
        int flrId   = row["floorId"]      != null ? Convert.ToInt32(row["floorId"])      : 0;
        int rmId    = row["roomId"]       != null ? Convert.ToInt32(row["roomId"])       : 0;

        // Sequential lookups required — Npgsql does not permit concurrent commands on
        // the same connection object.
        row["departmentName"] = deptId > 0  ? (await _lookup.GetDepartmentDescAsync(conn, deptId)   ?? "")  : "";
        row["custodian"]      = custId > 0  ? (await _lookup.GetEmployeeFullNameAsync(conn, custId)  ?? "")  : "";
        row["capturerName"]   = captId > 0  ? (await _lookup.GetEmployeeFullNameAsync(conn, captId)  ?? "")  : "";
        row["modifierName"]   = modId > 0   ? (await _lookup.GetEmployeeFullNameAsync(conn, modId)   ?? "")  : "";
        row["divisionName"]   = divId > 0   ? (await _lookup.GetDivisionDescAsync(conn, divId)       ?? "")  : "";
        row["ward"]           = wardId > 0  ? (await _lookup.GetWardDescAsync(conn, wardId)          ?? "")  : "";
        row["building"]       = bldId > 0   ? (await _lookup.GetBuildingDescAsync(conn, bldId)       ?? "")  : "";
        row["floor"]          = flrId > 0   ? (await _lookup.GetFloorDescAsync(conn, flrId)          ?? "")  : "";
        row["room"]           = rmId > 0    ? (await _lookup.GetRoomDescAsync(conn, rmId)            ?? "")  : "";

        return Ok(item);
    }

    [HttpGet("{id:int}/schedule-summary")]
    public async Task<IActionResult> GetScheduleSummary(int id, [FromQuery] string? finYear)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        if (string.IsNullOrEmpty(finYear))
        {
            var settings = await conn.QueryFirstOrDefaultAsync<dynamic>(
                @"SELECT financial_year FROM ""Asset_OrganisationSettings"" OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY");
            finYear = settings?.financial_year;
            if (string.IsNullOrEmpty(finYear))
            {
                var now = DateTime.Now;
                finYear = now.Month >= 7 ? $"{now.Year}/{now.Year + 1}" : $"{now.Year - 1}/{now.Year}";
            }
        }

        var maxPeriod = await conn.QueryFirstOrDefaultAsync<int?>(
            @"SELECT MAX(""FinancialPeriod"") FROM ""Asset_Transaction_Summary""
              WHERE ""AssetRegisterItemID"" = @id AND ""FinancialYear"" = @finYear",
            new { id, finYear });

        if (maxPeriod == null || maxPeriod == 0)
            return Ok(new { finYear, hasData = 0 });

        var p1 = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT
                COALESCE(""CostOpeningBalance"", 0) AS ""costOpeningBalance"",
                COALESCE(""AccumulatedDepreciationOpeningBalance"", 0) AS ""depOpeningBalance"",
                COALESCE(""AccumulatedImpairmentOpeningBalance"", 0) AS ""impOpeningBalance"",
                COALESCE(""AccumulatedRevaluationOpeningBalance"", 0) AS ""revalOpeningBalance"",
                COALESCE(""DepreciationOffsetOpeningBalance"", 0) AS ""depOffsetOpeningBalance"",
                COALESCE(""RevaluationReserveImpairmentOpeningBalance"", 0) AS ""revalReserveImpOpeningBalance""
              FROM ""Asset_Transaction_Summary""
              WHERE ""AssetRegisterItemID"" = @id AND ""FinancialYear"" = @finYear AND ""FinancialPeriod"" = 1",
            new { id, finYear });

        var lastP = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT
                COALESCE(""CostClosingBalance"", 0) AS ""costClosingBalance"",
                COALESCE(""AccumulatedDepreciationClosingBalance"", 0) AS ""depClosingBalance"",
                COALESCE(""AccumulatedImpairmentClosingBalance"", 0) AS ""impClosingBalance"",
                COALESCE(""AccumulatedImpairmentReversalClosingBalance"", 0) AS ""impReversalClosingBalance"",
                COALESCE(""AccumulatedRevaluationClosingBalance"", 0) AS ""revalClosingBalance"",
                COALESCE(""DepreciationOffsetClosingBalance"", 0) AS ""depOffsetClosingBalance"",
                COALESCE(""DepreciationOffsetClosingBalance"", 0) AS ""depreciationOffset"",
                COALESCE(""RevaluationReserveImpairmentClosingBalance"", 0) AS ""revalReserveImpClosingBalance"",
                COALESCE(""MovementInRevaluationReserve"", 0) AS ""movementInRevaluationReserve"",
                COALESCE(""CarryingAmount"", 0) AS ""carryingAmount"",
                COALESCE(""RemainingUsefulLife"", 0) AS ""remainingUsefulLife""
              FROM ""Asset_Transaction_Summary""
              WHERE ""AssetRegisterItemID"" = @id AND ""FinancialYear"" = @finYear AND ""FinancialPeriod"" = @maxPeriod",
            new { id, finYear, maxPeriod });

        var movements = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT
                COALESCE(SUM(""AdditionVaue""), 0) AS ""acquisitions"",
                COALESCE(SUM(""DisposalValue""), 0) AS ""disposalsCost"",
                COALESCE(SUM(""TransferToValue""), 0) AS ""transfersIn"",
                COALESCE(SUM(""TransferFromValue""), 0) AS ""transfersOut"",
                COALESCE(SUM(""FairValue""), 0) AS ""fairValueAdjustments"",
                COALESCE(SUM(""RevaluationValue""), 0) AS ""revaluations"",
                COALESCE(SUM(""RefurbDTValue""), 0) AS ""refurbDebit"",
                COALESCE(SUM(""RefurbCTValue""), 0) AS ""refurbCredit"",
                COALESCE(SUM(""RefurbRevaluationValue""), 0) AS ""refurbRevaluationValue"",
                COALESCE(SUM(""DepreciationValue""), 0) AS ""depreciation"",
                COALESCE(SUM(""DepreciationAdjustment""), 0) AS ""depreciationAdjustments"",
                COALESCE(SUM(""RefurbDepreciationValue""), 0) AS ""refurbDepreciation"",
                COALESCE(SUM(""ImpairmentValue""), 0) AS ""impairment"",
                COALESCE(SUM(""ImpairmentReversalValue""), 0) AS ""impairmentReversal"",
                COALESCE(SUM(""DepreciationOffset""), 0) AS ""depreciationOffset"",
                COALESCE(SUM(""RevaluationReserveImpairment""), 0) AS ""revalReserveImpairment"",
                COALESCE(SUM(""RevaluationReserveImpairmentReversal""), 0) AS ""revalReserveImpairmentReversal"",
                COALESCE(SUM(""RevaluationReserveRevaluation""), 0) AS ""revalReserveRevaluation"",
                COALESCE(SUM(""RevaluationReserveDisposal""), 0) AS ""revalReserveDisposal"",
                COALESCE(SUM(""ImpairmentSurplus""), 0) AS ""impairmentSurplus"",
                COALESCE(SUM(""CorrectionOfErrorValue""), 0) AS ""correctionOfError"",
                COALESCE(SUM(""AdditionalCostValue""), 0) AS ""additionalCost""
              FROM ""Asset_Transaction_Summary""
              WHERE ""AssetRegisterItemID"" = @id AND ""FinancialYear"" = @finYear",
            new { id, finYear });

        return Ok(new
        {
            finYear,
            hasData = 1,
            maxPeriod,
            openingBalances = p1,
            closingBalances = lastP,
            movements
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var columns = new List<string>();
        var paramNames = new List<string>();
        var parameters = new DynamicParameters();

        var validColumns = GetValidColumns();

        foreach (var kvp in model)
        {
            var col = validColumns.FirstOrDefault(c => string.Equals(c, kvp.Key, StringComparison.OrdinalIgnoreCase));
            if (col != null && !string.Equals(col, "AssetRegisterItem_ID", StringComparison.OrdinalIgnoreCase))
            {
                columns.Add($@"""{col}""");
                paramNames.Add($"@{col}");
                parameters.Add(col, UnwrapJsonElement(kvp.Value));
            }
        }

        if (!columns.Any(c => c.Contains("DateCaptured")))
        {
            columns.Add(@"""DateCaptured""");
            paramNames.Add("NOW()");
        }

        var sql = $@"INSERT INTO ""Asset_Register_Items"" ({string.Join(", ", columns)})
            VALUES ({string.Join(", ", paramNames)})
            RETURNING ""AssetRegisterItem_ID""";

        var id = await conn.QuerySingleAsync<int>(sql, parameters);
        return CreatedAtAction(nameof(GetById), new { id }, new { AssetRegisterItem_ID = id });
    }

    // Lookup table metadata for change summary resolution
    private static readonly Dictionary<string, (string Table, string IdCol, string DescCol)> LookupFields
        = new(StringComparer.OrdinalIgnoreCase)
    {
        { "AssetType_ID",           ("Const_AssetType_Sys",                   "AssetType_ID",                  "AssetTypeDesc") },
        { "AssetCategory_ID",       ("Const_AssetCategory_sys",               "AssetCategoryID",               "AssetCategoryDesc") },
        { "Asset_SubCategory_ID",   ("Const_Asset_SubCategory",               "Asset_SubCategory_ID",          "Asset_SubCategoryDescription") },
        { "AssetClass_ID",          ("Const_AssetClass_sys",                  "AssetClass_ID",                 "AssetClassDesc") },
        { "AssetStatus_ID",         ("Const_AssetStatus_Sys",                 "AssetStatus_ID",                "AssetStatusDesc") },
        { "MeasurementType_ID",     ("AssetConfig_MeasurementType",           "AssetConfig_MeasurementType_ID","Name") },
        { "AssetCondition_ID",      ("Const_Asset_Condition",                 "Asset_Condition_ID",            "Description") },
        { "Financial_Status_ID",    ("AssetConfig_FinancialStatus",           "FinStatusID",                   "FinancialStatusDesc") },
        { "AssetDepreciationMethod_ID", ("Const_AssetDepreciationMethod_Sys", "AssetDepreciationMethod_ID",    "AssetDepreciationMethodDesc") },
        { "CIDMSSubComponentTypeID",("Const_Asset_CIDMS_SubComponent_Type",   "AssetCIDMSSubComponentTypeID",  "AssetCIDMSSubComponentTypeDesc") },
        { "CIDMSComponentType",     ("Const_Asset_CIDMS_Component_Type",      "AssetCIDMSComponentTypeID",     "AssetCIDMSComponentTypeDesc") },
        { "CIDMSAssetType",         ("Const_Asset_CIDMS_Asset_Type",          "AssetCIDMSAssetTypeID",         "AssetCIDMSAssetTypeDesc") },
        { "CIDMSAssetGroupType",    ("Const_Asset_CIDMS_Group_Type",          "AssetCIDMSGroupTypeID",         "AssetCIDMSGroupTypeDesc") },
        { "CIDMSAssetClass",        ("Const_Asset_CIDMS_Class",               "AssetCIDMSClassID",             "AssetCIDMSClassDesc") },
        { "CIDMSSubAccountingGroup",("Const_Asset_CIDMS_Accounting_Sub_Group","AssetAccountSubGroupID",        "AssetAccountSubGroupDesc") },
        { "CIDMSAccountingGroup",   ("Const_Asset_CIDMS_Accounting_Group",    "AssetAccountGroupID",           "AssetAccountGroupDesc") },
    };

    private static readonly Dictionary<string, string> FieldLabels = new(StringComparer.OrdinalIgnoreCase)
    {
        { "Description", "Description" }, { "Barcode", "Barcode" }, { "OldBarCode", "Old Barcode" },
        { "ParentAssetRegisterItem_ID", "Parent Asset ID" }, { "MunicipalAssetID", "Municipal Asset ID" },
        { "MainAssetID", "Main Asset ID" }, { "MainAssetDescription", "Main Asset Description" },
        { "RegistrationNumber", "Registration Number" }, { "SerialNumber", "Serial Number" },
        { "UnitNumber", "Unit Number" }, { "Make", "Make" }, { "Model", "Model" },
        { "AssetType_ID", "Asset Type" }, { "AssetCategory_ID", "Asset Category" },
        { "Asset_SubCategory_ID", "Asset Sub-Category" }, { "AssetClass_ID", "Asset Class" },
        { "MeasurementType_ID", "Measurement Type" }, { "AssetStatus_ID", "Asset Status" },
        { "Financial_Status_ID", "Financial Status" }, { "AssetCondition_ID", "Asset Condition" },
        { "AssetDepreciationMethod_ID", "Depreciation Method" }, { "RevaluationMethod", "Revaluation Method" },
        { "InfrastructurOrNonInfrastructure", "Infrastructure Type" }, { "NatureOfAddition", "Nature of Addition" },
        { "AssetOwnershipName", "Asset Ownership" }, { "CriticalityGrade", "Criticality Grade" },
        { "PerformanceGrade", "Performance Grade" }, { "UtilisationGrade", "Utilisation Grade" },
        { "InfrastructureHealthGrade", "Infrastructure Health Grade" },
        { "ConsequenceOfFailure", "Consequence of Failure" }, { "Risk", "Risk" },
        { "AcquisitionDate", "Acquisition Date" }, { "CommisioningDate", "Commissioning Date" },
        { "InserviceDate", "In-Service Date" }, { "VerificationDate", "Verification Date" },
        { "YearConstructed", "Year Constructed" }, { "ForecastReplacementYear", "Forecast Replacement Year" },
        { "Impairment_Date", "Impairment Date" }, { "RevaluationDate", "Revaluation Date" },
        { "Date_Donated", "Date Donated" },
        { "PurchaseAmount", "Purchase Amount" }, { "ResidualValue", "Residual Value" },
        { "CurrentReplacementCostCRC", "CRC" }, { "AnnualisedMaintenanceCRC", "Annualised Maintenance CRC" },
        { "AnnualMaintenanceBudgetNeed", "Annual Maintenance Budget Need" },
        { "InsuranceCover", "Insurance Cover" }, { "InsurancePolicyNo", "Insurance Policy No" },
        { "InsuredAmountInsuredBy", "Insured Amount/Insured By" }, { "Warranty", "Warranty" },
        { "UsefulLifeYearComponent", "Useful Life (Years)" }, { "UsefulLifeMonthComponent", "Useful Life (Months)" },
        { "RemainingUsefulLife", "Remaining Useful Life (Months)" },
        { "Remaining_Useful_Life_Year", "Remaining Useful Life (Years)" },
        { "UoM", "Unit of Measure" }, { "Quantity", "Quantity" }, { "Diameter", "Diameter" },
        { "Capacity", "Capacity" }, { "Dim1", "Dimension 1" }, { "Dim2", "Dimension 2" }, { "Dim3", "Dimension 3" },
        { "DimensionQuantity", "Dimension Quantity" }, { "ConstructionMaterial", "Construction Material" },
        { "MunicipalDepartment_ID", "Department" }, { "Custodian_ID", "Custodian" },
        { "CustodianIdNumber", "Custodian ID Number" }, { "BasicMunicipalityService", "Basic Municipality Service" },
        { "Town_ID", "Town" }, { "Ward_ID", "Ward" }, { "Building_ID", "Building" },
        { "FloorID", "Floor" }, { "Room_ID", "Room" }, { "SuburbID", "Suburb" }, { "Street_ID", "Street" },
        { "Suburb", "Suburb (text)" }, { "LocationDescription", "Location Description" },
        { "latitude", "Latitude" }, { "longitude", "Longitude" }, { "GisFeature", "GIS Feature" },
        { "WellKnownTextWKT", "WKT Geometry" }, { "DivisionID", "Division" },
        { "SupplierName", "Supplier Name" }, { "SupplierCode", "Supplier Code" },
        { "InvoiceNo", "Invoice No" }, { "PaymentNo", "Payment No" }, { "DisposalDocNo", "Disposal Doc No" },
        { "FundingDescription", "Funding Description" }, { "DonorRegNumber", "Donor Reg Number" },
        { "Donor_Name", "Donor Name" }, { "SGNumberChange_ID", "SG Number Change ID" },
        { "RoomResponsiblePerson", "Room Responsible Person" },
        { "ITHardwareResponsiblePerson", "IT Hardware Responsible Person" },
        { "ReasonForChange", "Reason for Change" },
        { "CIDMSSubComponentTypeID", "CIDMS Sub-Component Type" }, { "CIDMSComponentType", "CIDMS Component Type" },
        { "CIDMSAccountingGroup", "CIDMS Accounting Group" }, { "CIDMSSubAccountingGroup", "CIDMS Sub Accounting Group" },
        { "CIDMSAssetClass", "CIDMS Asset Class" }, { "CIDMSAssetGroupType", "CIDMS Asset Group Type" },
        { "CIDMSAssetType", "CIDMS Asset Type" }, { "CashOrNoncashgeneratingunit", "Cash/Non-Cash Generating Unit" },
        { "MovementInRevaluationReserve", "Movement in Revaluation Reserve" },
        { "DepreciationOffset", "Depreciation Offset" }, { "DeemedCost", "Deemed Cost" },
        { "RevaluationValue", "Revaluation Value" },
        { "AccumulatedDepreciationCurrentYear", "Acc. Depreciation Current Year" },
        { "ImpairmentAmountCurrentYear", "Impairment Amount Current Year" },
        { "ReversalOfImpairmentAmount", "Reversal of Impairment Amount" },
    };

    private static string NormalizeValue(object? value)
    {
        if (value is null || value is DBNull) return "";
        var raw = value.ToString() ?? "";
        if (string.IsNullOrWhiteSpace(raw)) return "";

        // Normalize numeric: parse as decimal, strip trailing zeros → "120.00000000" and "120" both become "120"
        if (decimal.TryParse(raw, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var dec))
            return dec.ToString("G29", System.Globalization.CultureInfo.InvariantCulture);

        // Normalize date: keep only date portion when time is midnight
        if (DateTime.TryParse(raw, System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None, out var dt))
        {
            return dt.TimeOfDay == TimeSpan.Zero
                ? dt.ToString("yyyy-MM-dd")
                : dt.ToString("yyyy-MM-dd HH:mm:ss");
        }

        return raw.Trim();
    }

    private async Task<List<object>> BuildChangeSummary(
        System.Data.Common.DbConnection conn,
        Dictionary<string, object?> currentAsset,
        Dictionary<string, object?> payload)
    {
        var changes = new List<object>();

        foreach (var kvp in payload)
        {
            var field = kvp.Key;
            var newValue = kvp.Value;

            currentAsset.TryGetValue(field, out var prevValue);

            var prevStr = NormalizeValue(prevValue);
            var newStr  = NormalizeValue(newValue);

            if (string.Equals(prevStr, newStr, StringComparison.OrdinalIgnoreCase)) continue;

            var label = FieldLabels.TryGetValue(field, out var lbl) ? lbl : field;

            if (LookupFields.TryGetValue(field, out var lookup))
            {
                string? prevDesc = null, newDesc = null;

                if (!string.IsNullOrWhiteSpace(prevStr) && int.TryParse(prevStr, out var prevId))
                {
                    prevDesc = await conn.QueryFirstOrDefaultAsync<string>(
                        $@"SELECT ""{lookup.DescCol}"" FROM ""{lookup.Table}"" WHERE ""{lookup.IdCol}"" = @id",
                        new { id = prevId });
                }
                if (!string.IsNullOrWhiteSpace(newStr) && int.TryParse(newStr, out var newId))
                {
                    newDesc = await conn.QueryFirstOrDefaultAsync<string>(
                        $@"SELECT ""{lookup.DescCol}"" FROM ""{lookup.Table}"" WHERE ""{lookup.IdCol}"" = @id",
                        new { id = newId });
                }

                changes.Add(new
                {
                    field,
                    label,
                    previousValue = prevStr,
                    previousDescription = prevDesc,
                    newValue = newStr,
                    newDescription = newDesc
                });
            }
            else
            {
                changes.Add(new
                {
                    field,
                    label,
                    previousValue = prevStr,
                    previousDescription = (string?)null,
                    newValue = newStr,
                    newDescription = (string?)null
                });
            }
        }

        return changes;
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var validColumns = GetValidColumns();
        var payloadDict = new Dictionary<string, object?>();

        foreach (var kvp in model)
        {
            var col = validColumns.FirstOrDefault(c => string.Equals(c, kvp.Key, StringComparison.OrdinalIgnoreCase));
            if (col != null && !string.Equals(col, "AssetRegisterItem_ID", StringComparison.OrdinalIgnoreCase))
            {
                payloadDict[col] = UnwrapJsonElement(kvp.Value);
            }
        }

        if (payloadDict.Count == 0)
            return BadRequest(new { error = "No valid fields to update" });

        // Load current asset
        var currentRow = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT * FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @id", new { id });
        if (currentRow is null)
            return NotFound(new { error = "Asset register item not found" });

        // Block duplicate pending edits
        var existingPending = await conn.QueryFirstOrDefaultAsync<int?>(
            @"SELECT ""Approval_ID"" FROM ""Asset_Register_Item_Approval""
              WHERE ""AssetRegisterItem_ID"" = @id AND ""Status"" = 'Pending' AND ""ApprovalType"" = 'Edit'
              LIMIT 1", new { id });
        if (existingPending.HasValue)
            return Conflict(new
            {
                error = "This asset already has an edit pending approval. Please wait for it to be approved or rejected before making further changes."
            });

        // Build case-insensitive dictionary from current asset row
        var currentAsset = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
        foreach (var kv in (IDictionary<string, object>)currentRow)
            currentAsset[kv.Key] = kv.Value;

        // Compute change summary with lookup description resolution
        var changeSummary = await BuildChangeSummary(conn, currentAsset, payloadDict);

        // If nothing actually changed, skip approval entirely
        if (changeSummary.Count == 0)
            return Ok(new { success = true, noChanges = true, message = "No changes detected — the asset was not modified." });

        var assetDataJson    = System.Text.Json.JsonSerializer.Serialize(payloadDict);
        var changeSummaryJson = System.Text.Json.JsonSerializer.Serialize(changeSummary);

        var insertParams = new DynamicParameters();
        insertParams.Add("assetId", id);
        insertParams.Add("assetData", assetDataJson);
        insertParams.Add("changeSummary", changeSummaryJson);

        var approvalId = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_Register_Item_Approval""
                (""ApprovalType"", ""AssetRegisterItem_ID"", ""AssetData"", ""ChangeSummary"", ""SubmittedBy"", ""SubmittedDate"")
            VALUES ('Edit', @assetId, @assetData::jsonb, @changeSummary::jsonb, 1, NOW())
            RETURNING ""Approval_ID""", insertParams);

        return Ok(new
        {
            approvalId,
            pendingApproval = true,
            message = "Asset edit submitted for approval. The register will reflect the changes once approved."
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Asset register item not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("filter/{filterValue}")]
    public async Task<IActionResult> GetByFilter(string filterValue)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var filterParam = new DynamicParameters();
        filterParam.Add("filter", $"%{filterValue}%");
        var idClause = "";
        if (int.TryParse(filterValue.Trim(), out var filterId))
        {
            idClause = @"""AssetRegisterItem_ID"" = @filterId OR ";
            filterParam.Add("filterId", filterId);
        }
        var items = await conn.QueryAsync<dynamic>($@"
            SELECT * FROM ""Asset_Register_Items""
            WHERE {idClause}""Description"" LIKE @filter
               OR ""Barcode"" LIKE @filter
               OR ""MainAssetDescription"" LIKE @filter
            ORDER BY ""AssetRegisterItem_ID""",
            filterParam);
        return Ok(items);
    }

    [HttpGet("GetbyCriteria")]
    public async Task<IActionResult> GetByCriteria(
        [FromQuery] int? assetRegisterItemId,
        [FromQuery] int? measurementTypeId,
        [FromQuery] int? typeId,
        [FromQuery] int? assetClassId,
        [FromQuery] int? categoryId,
        [FromQuery] int? subCategoryId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var conditions = new List<string>();
        var parameters = new DynamicParameters();

        if (assetRegisterItemId.HasValue)
        {
            conditions.Add(@"""AssetRegisterItem_ID"" = @assetRegisterItemId");
            parameters.Add("assetRegisterItemId", assetRegisterItemId.Value);
        }
        if (measurementTypeId.HasValue)
        {
            conditions.Add(@"""MeasurementType_ID"" = @measurementTypeId");
            parameters.Add("measurementTypeId", measurementTypeId.Value);
        }
        if (typeId.HasValue)
        {
            conditions.Add(@"""AssetType_ID"" = @typeId");
            parameters.Add("typeId", typeId.Value);
        }
        if (assetClassId.HasValue)
        {
            conditions.Add(@"""AssetClass_ID"" = @assetClassId");
            parameters.Add("assetClassId", assetClassId.Value);
        }
        if (categoryId.HasValue)
        {
            conditions.Add(@"""AssetCategory_ID"" = @categoryId");
            parameters.Add("categoryId", categoryId.Value);
        }
        if (subCategoryId.HasValue)
        {
            conditions.Add(@"""Asset_SubCategory_ID"" = @subCategoryId");
            parameters.Add("subCategoryId", subCategoryId.Value);
        }

        var whereClause = conditions.Count > 0 ? "WHERE " + string.Join(" AND ", conditions) : "";
        var sql = $@"SELECT * FROM ""Asset_Register_Items"" {whereClause} ORDER BY ""AssetRegisterItem_ID""";

        var items = await conn.QueryAsync<dynamic>(sql, parameters);
        return Ok(items);
    }

    [HttpGet("{id:int}/remaining-useful-life")]
    public async Task<IActionResult> GetRemainingUsefulLife(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""UsefulLifeYearComponent"", ""UsefulLifeMonthComponent"",
                   ""Remaining_Useful_Life_Year"", ""RemainingUsefulLife"",
                   ""InserviceDate""
            FROM ""Asset_Register_Items""
            WHERE ""AssetRegisterItem_ID"" = @id", new { id });

        if (item is null)
            return NotFound(new { error = "Asset register item not found" });

        int totalMonths = (int)(decimal)(item.UsefulLifeMonthComponent ?? (item.UsefulLifeYearComponent ?? 0m) * 12m);
        int remainingMonths = (int)(decimal)(item.RemainingUsefulLife ?? (item.Remaining_Useful_Life_Year ?? 0m) * 12m);

        if (totalMonths > 0 && item.InserviceDate != null)
        {
            var inService = (DateTime)item.InserviceDate;
            var monthsElapsed = ((DateTime.UtcNow.Year - inService.Year) * 12) + (DateTime.UtcNow.Month - inService.Month);
            remainingMonths = Math.Max(0, totalMonths - monthsElapsed);
        }

        return Ok(new { key = "remainingUsefulLife", value = (decimal)remainingMonths });
    }

    [HttpGet("{id:int}/remaining-useful-life-changed")]
    public async Task<IActionResult> GetRemainingUsefulLifeChanged(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""RemainingUsefulLifeAtTakeOn"", ""RemainingUsefulLife""
            FROM ""Asset_Register_Items""
            WHERE ""AssetRegisterItem_ID"" = @id", new { id });

        if (item is null)
            return NotFound(new { error = "Asset register item not found" });

        bool changed = item.RemainingUsefulLifeAtTakeOn != null
            && item.RemainingUsefulLife != null
            && item.RemainingUsefulLifeAtTakeOn != item.RemainingUsefulLife;

        return Ok(changed);
    }

    [HttpPost("{id:int}/remaining-useful-life/{remainingUsefulLife}")]
    public async Task<IActionResult> UpdateRemainingUsefulLife(int id, decimal remainingUsefulLife)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var remainingYears = (int)(remainingUsefulLife / 12);
        var remainingMonthsVal = (int)remainingUsefulLife;

        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_Register_Items""
            SET ""RemainingUsefulLife"" = @remainingMonths,
                ""Remaining_Useful_Life_Year"" = @remainingYears,
                ""DateModified"" = NOW()
            WHERE ""AssetRegisterItem_ID"" = @id",
            new { id, remainingMonths = remainingMonthsVal, remainingYears });

        return rows == 0 ? NotFound(new { error = "Asset register item not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("SaveToGL/{id:int}")]
    public async Task<IActionResult> SaveToGL(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT * FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @id", new { id });

        if (item is null)
            return NotFound(new { error = "Asset register item not found" });

        var existingSummary = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""ID"" AS ""AssetTransactionSummary_ID"" FROM ""Asset_Transaction_Summary""
            WHERE ""AssetRegisterItem_ID"" = @id AND ""FinYear"" = @finYear",
            new { id, finYear = DateTime.UtcNow.Year.ToString() });

        if (existingSummary != null)
        {
            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Transaction_Summary""
                SET ""CostClosingBalance"" = @purchaseCost,
                    ""AccumulatedDepreciationClosingBalance"" = @accDepreciation,
                    ""CarryingAmount"" = @carryingAmount
                WHERE ""ID"" = @summaryId",
                new
                {
                    purchaseCost = (decimal?)(item.PurchaseAmount),
                    accDepreciation = (decimal?)(item.AccumulatedDepreciationClosingBalance),
                    carryingAmount = (decimal?)(item.CarryingAmountClosingBalance),
                    summaryId = (int)existingSummary.AssetTransactionSummary_ID
                });
        }
        else
        {
            var fy = DateTime.UtcNow.Year.ToString();
            await conn.ExecuteAsync(@"
                INSERT INTO ""Asset_Transaction_Summary""
                (""AssetRegisterItem_ID"", ""AssetRegisterItemID"", ""FinYear"", ""FinancialYear"",
                 ""CostOpeningBalance"", ""CostClosingBalance"",
                 ""AccumulatedDepreciationOpeningBalance"", ""AccumulatedDepreciationClosingBalance"",
                 ""CarryingAmount"", ""DateCaptured"")
                VALUES (@id, @id, @finYear, @finYear, @purchaseCost, @purchaseCost,
                        @accDepreciation, @accDepreciation, @carryingAmount, NOW())",
                new
                {
                    id,
                    finYear = fy,
                    purchaseCost = (decimal?)(item.PurchaseAmount),
                    accDepreciation = (decimal?)(item.AccumulatedDepreciationClosingBalance),
                    carryingAmount = (decimal?)(item.CarryingAmountClosingBalance)
                });
        }

        return Ok(new { success = 1 });
    }

    [HttpGet("lookups/financial-statuses")]
    public async Task<IActionResult> GetFinancialStatuses()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"SELECT ""FinStatusID"" AS ""id"", ""FinancialStatusDesc"" AS ""description"" FROM ""AssetConfig_FinancialStatus"" ORDER BY ""FinancialStatusDesc""");
        return Ok(items);
    }

    private static HashSet<string> GetValidColumns() => new(StringComparer.OrdinalIgnoreCase)
    {
        "AssetRegisterItem_ID", "Run_ID", "Description",
        "ParentAssetRegisterItem_ID", "MunicipalAssetID", "MainAssetID", "MainAssetDescription",
        "OldBarCode", "Barcode", "ImageRef", "AssetType_ID", "AssetCategory_ID", "Asset_SubCategory_ID",
        "AssetClass_ID", "MeasurementType_ID", "AssetStatus_ID",
        "Financial_Status_ID", "AcquisitionDate", "CommisioningDate", "InfrastructurOrNonInfrastructure",
        "NatureOfAddition", "CostOfAddition", "InserviceDate", "DateOfDisposal",
        "Impairment_Date", "DateModified", "VerificationDate", "VerificationDoneBy", "YearConstructed",
        "ForecastReplacementYear", "AssetCondition_ID", "InsuranceCover", "InsurancePolicyNo",
        "Warranty", "CurrentReplacementCostCRC", "DepreciatedReplacementCostDRC",
        "AnnualisedMaintenanceCRC", "AnnualMaintenanceBudgetNeed", "UsefulLifeYearComponent",
        "UsefulLifeMonthComponent", "Remaining_Useful_Life_Year", "RemainingUsefulLife",
        "RemainingUsefulLifeAtTakeOn", "ConstructionMaterial", "UoM", "Dim1", "Dim2", "Dim3",
        "DimensionQuantity", "Quantity", "Diameter", "Capacity", "DeedNumber",
        "ErfNumber", "PortionNumber", "ErfSizeM2", "Make", "Model", "UnitNumber",
        "RegistrationNumber", "SerialNumber", "Custodian_ID", "CustodianIdNumber",
        "BasicMunicipalityService", "CriticalityGrade", "PerformanceGrade", "UtilisationGrade",
        "InfrastructureHealthGrade", "ConsequenceOfFailure", "Risk", "AssetOwnershipName",
        "MunicipalDepartment_ID", "Suburb",
        "latitude", "longitude", "FundingSourceNumber", "FundingSourceAmount",
        "FundType", "PurchaseAmount",
        "AccumulatedDepreciationClosingBalance", "AccumulatedImpairmentClosingBalance",
        "ResidualValue",
        "CarryingAmountClosingBalance",
        "RevaluationOpeningBalance", "RevaluationDate", "MovementInRevaluationReserve",
        "DepreciationOffset", "DeemedCost",
        "CIDMSSubComponentTypeID", "CIDMSComponentType", "CIDMSAccountingGroup",
        "CIDMSSubAccountingGroup", "CIDMSAssetClass", "CIDMSAssetGroupType", "CIDMSAssetType",
        "CashOrNoncashgeneratingunit", "DateCaptured", "Capturer_ID",
        "WellKnownTextWKT", "RevaluationValue",
        "RevaluationImpairmentOpeningBalance", "RevaluationReserveClosingBalance",
        "TransferFromAmount", "TransferToAmount",
        "Town_ID", "Ward_ID", "Street_ID", "Building_ID", "FloorID", "Room_ID", "SuburbID",
        "GisFeature",
        "SupplierName", "SupplierCode",
        "InsuredAmountInsuredBy",
        "ReasonForChange",
        "InvoiceNo", "DisposalDocNo", "PaymentNo",
        "FundingDescription", "LocationDescription",
        "RoomResponsiblePerson", "ITHardwareResponsiblePerson",
        "DivisionID", "DonorRegNumber", "Donor_Name", "Date_Donated", "SGNumberChange_ID",
        "AccumulatedDepreciationCurrentYear", "ImpairmentAmountCurrentYear", "ReversalOfImpairmentAmount",
        "AssetDepreciationMethod_ID", "RevaluationMethod",
        "Modifier_ID"
    };
}
