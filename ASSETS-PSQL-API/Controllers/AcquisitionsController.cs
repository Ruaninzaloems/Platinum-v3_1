using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/acquisitions")]
public class AcquisitionsController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public AcquisitionsController(DbConnectionFactory db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAcquisitionsList()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var rows = await conn.QueryAsync(@"
            SELECT
                a.""AssetRegisterItem_ID""  AS ""assetId"",
                a.""Description""           AS ""description"",
                a.""Barcode""               AS ""barcode"",
                a.""AcquisitionDate""       AS ""acquisitionDate"",
                a.""PurchaseAmount""        AS ""purchaseAmount"",
                a.""GRN_ID""               AS ""grnId"",
                a.""InventoryID""           AS ""inventoryId"",
                a.""DonorRegNumber""        AS ""donorRegNumber"",
                a.""Donor_Name""           AS ""donorName"",
                a.""Date_Donated""         AS ""dateDonated"",
                a.""SupplierName""          AS ""supplierName"",
                COALESCE(cat.""AssetCategoryDesc"", '') AS ""categoryName"",
                COALESCE(cls.""AssetClassDesc"", '') AS ""className"",
                a.""DateCaptured""          AS ""dateCaptured"",
                CASE
                    WHEN a.""GRN_ID"" IS NOT NULL THEN 'SCM/GRN'
                    WHEN a.""InventoryID"" IS NOT NULL THEN 'Inventory'
                    WHEN a.""DonorRegNumber"" IS NOT NULL OR a.""Donor_Name"" IS NOT NULL THEN 'Donation'
                    ELSE 'Other'
                END AS ""acquisitionType""
            FROM ""Asset_Register_Items"" a
            LEFT JOIN ""Const_AssetCategory_sys"" cat ON a.""AssetCategory_ID"" = cat.""AssetCategoryID""
            LEFT JOIN ""Const_AssetClass_sys"" cls ON a.""AssetClass_ID"" = cls.""AssetClass_ID""
            WHERE a.""GRN_ID"" IS NOT NULL
               OR a.""InventoryID"" IS NOT NULL
               OR a.""DonorRegNumber"" IS NOT NULL
               OR a.""Donor_Name"" IS NOT NULL
            ORDER BY a.""DateCaptured"" DESC, a.""AssetRegisterItem_ID"" DESC
            LIMIT 500");

        return Ok(rows);
    }

    [HttpPost("scm")]
    public async Task<IActionResult> CreateScmAcquisition([FromBody] Dictionary<string, object?> model)
    {
        var grnId = model.ContainsKey("GRN_ID") ? UnwrapJsonElement(model["GRN_ID"]) : null;
        if (grnId == null || string.IsNullOrWhiteSpace(grnId.ToString()))
            return BadRequest(new { error = "GRN_ID is required for SCM acquisitions." });
        return await SaveAcquisition(model, "SCM");
    }

    [HttpPost("inventory")]
    public async Task<IActionResult> CreateInventoryAcquisition([FromBody] Dictionary<string, object?> model)
    {
        var inventoryId = model.ContainsKey("InventoryID") ? UnwrapJsonElement(model["InventoryID"]) : null;
        if (inventoryId == null || string.IsNullOrWhiteSpace(inventoryId.ToString()))
            return BadRequest(new { error = "InventoryID is required for Inventory acquisitions." });
        return await SaveAcquisition(model, "Inventory");
    }

    [HttpPost("donation")]
    public async Task<IActionResult> CreateDonationAcquisition([FromBody] Dictionary<string, object?> model)
    {
        var donorName = model.ContainsKey("Donor_Name") ? UnwrapJsonElement(model["Donor_Name"]) : null;
        var dateDonated = model.ContainsKey("Date_Donated") ? UnwrapJsonElement(model["Date_Donated"]) : null;
        if (donorName == null || string.IsNullOrWhiteSpace(donorName.ToString()))
            return BadRequest(new { error = "Donor_Name is required for Donation acquisitions." });
        if (dateDonated == null || string.IsNullOrWhiteSpace(dateDonated.ToString()))
            return BadRequest(new { error = "Date_Donated is required for Donation acquisitions." });
        return await SaveAcquisition(model, "Donation");
    }

    private static readonly HashSet<string> DateColumns = new(StringComparer.OrdinalIgnoreCase)
    {
        "AcquisitionDate", "CommisioningDate", "InserviceDate", "DateOfDisposal",
        "Impairment_Date", "VerificationDate", "Date_Donated", "RevaluationDate",
        "DateCaptured", "ConditionCheckDate", "DateOfTransfer", "InvoiceDate",
        "LastRevaluationDate", "ReadyForUse"
    };

    private async Task<IActionResult> SaveAcquisition(Dictionary<string, object?> model, string acquisitionType)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var validColumns = GetValidAssetColumns();

        int? scmTransferId = null;
        int? invTransferId = null;

        if (acquisitionType == "SCM" && model.ContainsKey("SCMTransfer_ID"))
        {
            var raw = UnwrapJsonElement(model["SCMTransfer_ID"]);
            if (raw != null && int.TryParse(raw.ToString(), out var sid))
                scmTransferId = sid;
        }
        else if (acquisitionType == "Inventory" && model.ContainsKey("InvTransfer_ID"))
        {
            var raw = UnwrapJsonElement(model["InvTransfer_ID"]);
            if (raw != null && int.TryParse(raw.ToString(), out var iid))
                invTransferId = iid;
        }

        var assetPayload = new Dictionary<string, object?>();
        foreach (var kvp in model)
        {
            var col = validColumns.FirstOrDefault(c => string.Equals(c, kvp.Key, StringComparison.OrdinalIgnoreCase));
            if (col != null && !string.Equals(col, "AssetRegisterItem_ID", StringComparison.OrdinalIgnoreCase))
            {
                assetPayload[col] = UnwrapJsonElement(kvp.Value);
            }
        }

        if (!assetPayload.ContainsKey("DateCaptured"))
            assetPayload["DateCaptured"] = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
        if (!assetPayload.ContainsKey("Capturer_ID"))
            assetPayload["Capturer_ID"] = 1;

        var assetDataJson = System.Text.Json.JsonSerializer.Serialize(assetPayload);

        var insertParams = new DynamicParameters();
        insertParams.Add("approvalType", "Acquisition");
        insertParams.Add("acqSubType", acquisitionType);
        insertParams.Add("assetData", assetDataJson);
        insertParams.Add("scmTransferId", scmTransferId, System.Data.DbType.Int32);
        insertParams.Add("invTransferId", invTransferId, System.Data.DbType.Int32);

        var approvalId = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_Register_Item_Approval""
                (""ApprovalType"", ""AcquisitionSubType"", ""AssetData"",
                 ""SCMTransfer_ID"", ""InvTransfer_ID"", ""SubmittedBy"", ""SubmittedDate"")
            VALUES (@approvalType, @acqSubType, @assetData::jsonb,
                    @scmTransferId, @invTransferId, 1, NOW())
            RETURNING ""Approval_ID""", insertParams);

        return Ok(new
        {
            approvalId,
            pendingApproval = true,
            acquisitionType,
            message = "Asset submitted for approval. It will appear in the Asset Register once approved."
        });
    }

    private static object? UnwrapJsonElement(object? value)
    {
        if (value is System.Text.Json.JsonElement je)
        {
            return je.ValueKind switch
            {
                System.Text.Json.JsonValueKind.String => je.GetString(),
                System.Text.Json.JsonValueKind.Number => je.TryGetInt64(out var l) ? (object)l : je.GetDecimal(),
                System.Text.Json.JsonValueKind.True => true,
                System.Text.Json.JsonValueKind.False => false,
                System.Text.Json.JsonValueKind.Null => null,
                _ => je.ToString()
            };
        }
        return value;
    }

    private static HashSet<string> GetValidAssetColumns() => new(StringComparer.OrdinalIgnoreCase)
    {
        "AssetRegisterItem_ID", "Run_ID", "Description", "ParentAssetRegisterItem_ID",
        "MunicipalAssetID", "MainAssetID", "MainAssetDescription", "OldBarCode", "Barcode",
        "AssetType_ID", "AssetCategory_ID", "Asset_SubCategory_ID", "AssetClass_ID",
        "MeasurementType_ID", "AssetStatus_ID", "Financial_Status_ID", "AcquisitionDate",
        "CommisioningDate", "InfrastructurOrNonInfrastructure", "NatureOfAddition",
        "CostOfAddition", "InserviceDate", "DateOfDisposal", "Impairment_Date",
        "VerificationDate", "VerificationDoneBy", "YearConstructed", "ForecastReplacementYear",
        "AssetCondition_ID", "InsuranceCover", "InsurancePolicyNo", "Warranty",
        "CurrentReplacementCostCRC", "DepreciatedReplacementCostDRC",
        "AnnualisedMaintenanceCRC", "AnnualMaintenanceBudgetNeed",
        "UsefulLifeYearComponent", "UsefulLifeMonthComponent",
        "Remaining_Useful_Life_Year", "RemainingUsefulLife", "RemainingUsefulLifeAtTakeOn",
        "ConstructionMaterial", "UoM", "Dim1", "Dim2", "Dim3", "DimensionQuantity",
        "Quantity", "Diameter", "Capacity", "DeedNumber", "ErfNumber", "PortionNumber",
        "ErfSizeM2", "Make", "Model", "UnitNumber", "RegistrationNumber", "SerialNumber",
        "Custodian_ID", "CustodianIdNumber", "BasicMunicipalityService", "CriticalityGrade",
        "PerformanceGrade", "UtilisationGrade", "InfrastructureHealthGrade",
        "ConsequenceOfFailure", "Risk", "AssetOwnershipName", "MunicipalDepartment_ID",
        "Suburb", "latitude", "longitude", "FundingSourceNumber", "FundingSourceAmount",
        "FundType", "PurchaseAmount", "AccumulatedDepreciationClosingBalance",
        "AccumulatedImpairmentClosingBalance", "ResidualValue", "CarryingAmountClosingBalance",
        "RevaluationOpeningBalance", "RevaluationDate", "MovementInRevaluationReserve",
        "DepreciationOffset", "DeemedCost", "CIDMSSubComponentTypeID", "CIDMSComponentType",
        "CIDMSAccountingGroup", "CIDMSSubAccountingGroup", "CIDMSAssetClass",
        "CIDMSAssetGroupType", "CIDMSAssetType", "CashOrNoncashgeneratingunit",
        "DateCaptured", "Capturer_ID", "WellKnownTextWKT", "RevaluationValue",
        "RevaluationImpairmentOpeningBalance", "RevaluationReserveClosingBalance",
        "TransferFromAmount", "TransferToAmount", "Town_ID", "Ward_ID", "Street_ID",
        "Building_ID", "FloorID", "Room_ID", "SuburbID", "GisFeature",
        "SupplierName", "SupplierCode", "InsuredAmountInsuredBy", "ReasonForChange",
        "InvoiceNo", "DisposalDocNo", "PaymentNo", "FundingDescription", "LocationDescription",
        "RoomResponsiblePerson", "ITHardwareResponsiblePerson", "DivisionID",
        "DonorRegNumber", "Donor_Name", "Date_Donated", "SGNumberChange_ID",
        "AccumulatedDepreciationCurrentYear", "ImpairmentAmountCurrentYear",
        "ReversalOfImpairmentAmount", "Modifier_ID",
        "GRN_ID", "InventoryID"
    };
}
