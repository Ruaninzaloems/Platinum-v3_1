using Dapper;
using AssetManagement.Data;
using System.Globalization;

namespace AssetManagement.Services;

public class BulkUploadValidationService
{
    private readonly DbConnectionFactory _db;
    private Dictionary<string, int> _assetTypes = new(StringComparer.OrdinalIgnoreCase);
    private List<CategoryRecord> _assetCategories = new();
    private List<SubCategoryRecord> _assetSubCategories = new();
    private List<AssetClassRecord> _assetClassRecords = new();
    private Dictionary<string, int> _assetStatuses = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _assetConditions = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _measurementTypes = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _componentTypes = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _cidmsAccountingGroups = new(StringComparer.OrdinalIgnoreCase);
    private List<CidmsChildRecord> _cidmsAccountingSubGroups = new();
    private List<CidmsChildRecord> _cidmsClasses = new();
    private List<CidmsChildRecord> _cidmsGroupTypes = new();
    private List<CidmsChildRecord> _cidmsAssetTypes = new();
    private List<CidmsChildRecord> _cidmsComponentTypes = new();
    private List<CidmsChildRecord> _cidmsSubComponentTypes = new();
    private Dictionary<string, int> _cidmsMunicipalServices = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _criticalityGrades = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _healthGrades = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _performanceGrades = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _utilisationGrades = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _financialStatuses = new(StringComparer.OrdinalIgnoreCase);
    private HashSet<string> _existingBarcodes = new(StringComparer.OrdinalIgnoreCase);
    private HashSet<string> _existingMunicipalAssetIds = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<int, string> _criticalityConsequenceMap = new();
    private Dictionary<string, int> _uom = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _departments = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _divisions = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _towns = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _custodians = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _assetOwnerships = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _streets = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _buildings = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _wards = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _suburbs = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _floors = new(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, int> _rooms = new(StringComparer.OrdinalIgnoreCase);
    private HashSet<(int categoryId, int statusId)> _validCategoryStatusPairs = new();
    private HashSet<int> _categoryIdsWithStatusConstraint = new();
    private HashSet<int> _categoryIdsWithRequiredStatus = new();
    private HashSet<(int typeId, int measId)> _validTypeMeasPairs = new();
    private HashSet<int> _typeIdsWithMeasConstraint = new();
    private HashSet<int> _typeIdsWithRequiredMeas = new();

    private static readonly HashSet<string> _validRisk = new(StringComparer.OrdinalIgnoreCase)
        { "Very Low", "VeryLow", "Low", "Medium", "High", "VeryHigh", "Very High" };

    private static readonly HashSet<string> _validYesNo = new(StringComparer.OrdinalIgnoreCase)
        { "Yes", "No" };

    private static readonly HashSet<string> _validCashGenerating = new(StringComparer.OrdinalIgnoreCase)
        { "Cash", "Cash Generating", "CashGenerating",
          "Non", "Non-Cash Generating", "Non Cash Generating", "NonCashGenerating" };

    private static readonly HashSet<string> _validNatureOfAddition = new(StringComparer.OrdinalIgnoreCase)
        { "New", "Existing - Renewal", "ExistingReplacement", "Existing - Upgrade", "ExistingUpgrade",
          "New Asset", "Transferred In", "Donated", "Donated/Contributed", "Revaluation", "Revaluation Increase",
          "Prior Year Correction", "Adjustment", "Other", "Others" };

    private static readonly HashSet<string> _validConsequenceOfFailure = new(StringComparer.OrdinalIgnoreCase)
        { "Insignificant", "Minor", "Moderate", "Major", "Catastrophic" };

    private static readonly HashSet<string> _validInfrastructure = new(StringComparer.OrdinalIgnoreCase)
        { "Infrastructure", "Non-Infrastructure", "Non Infrastructure", "NonInfrastructure" };

    public BulkUploadValidationService(DbConnectionFactory db) => _db = db;

    private static Dictionary<string, int> ToSafeDictionary(IEnumerable<(string desc, int id)> items)
    {
        var dict = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var item in items)
        {
            var key = item.desc ?? "";
            if (!dict.ContainsKey(key))
                dict[key] = item.id;
        }
        return dict;
    }

    public async Task LoadLookups()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        _assetTypes = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(@"SELECT ""AssetTypeDesc"", ""AssetType_ID"" FROM ""Const_AssetType_Sys"" WHERE ""Enabled"" = 1"));
        _assetCategories = (await conn.QueryAsync<CategoryRecord>(@"SELECT ""AssetCategoryID"" AS ""Id"", ""AssetCategoryDesc"" AS ""Desc"", ""TypeID"" AS ""TypeId"" FROM ""Const_AssetCategory_sys"" WHERE ""Enabled"" = 1")).ToList();
        _assetSubCategories = (await conn.QueryAsync<SubCategoryRecord>(@"SELECT ""Asset_SubCategory_ID"" AS ""Id"", ""Asset_SubCategoryDescription"" AS ""Desc"", ""TypeID"" AS ""TypeId"", ""AssetCategoryID"" AS ""CategoryId"" FROM ""Const_Asset_SubCategory"" WHERE ""Enabled"" = 1")).ToList();
        _assetClassRecords = (await conn.QueryAsync<AssetClassRecord>(@"SELECT ""AssetClass_ID"" AS ""Id"", ""AssetClassDesc"" AS ""Desc"", ""TypeID"" AS ""TypeId"", ""AssetCategoryID"" AS ""CategoryId"", ""Asset_SubCategory_ID"" AS ""SubCategoryId"", ""AssetMeasurement_ID"" AS ""MeasurementId"", ""AssetStatus_ID"" AS ""StatusId"" FROM ""Const_AssetClass_sys"" WHERE ""Enabled"" = 1")).ToList();
        _assetStatuses = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(@"SELECT ""AssetStatusDesc"", ""AssetStatus_ID"" FROM ""Const_AssetStatus_Sys"" WHERE ""Enabled"" = 1"));
        _assetConditions = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(@"SELECT ""Description"" AS ""AssetConditionDesc"", ""Asset_Condition_ID"" AS ""AssetCondition_ID"" FROM ""Const_Asset_Condition"" WHERE ""Enabled"" = 1"));
        _measurementTypes = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(@"SELECT ""Name"", ""AssetConfig_MeasurementType_ID"" FROM ""AssetConfig_MeasurementType"" WHERE ""Enabled"" = 1"));
        _componentTypes = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(@"SELECT ""Asset_Component_Description"", ""Asset_ComponentType_ID"" AS ""Asset_Component_ID"" FROM ""Const_Asset_ComponentType"" WHERE ""Enabled"" = 1"));
        _cidmsAccountingGroups = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(@"SELECT ""AssetAccountGroupDesc"", ""AssetAccountGroupID"" FROM ""Const_Asset_CIDMS_Accounting_Group"" WHERE ""Enabled"" = 1"));
        _cidmsAccountingSubGroups = (await conn.QueryAsync<CidmsChildRecord>(@"SELECT ""AssetAccountSubGroupID"" AS ""Id"", ""AssetAccountSubGroupDesc"" AS ""Desc"", ""AssetAccountGroupID"" AS ""ParentId"" FROM ""Const_Asset_CIDMS_Accounting_Sub_Group"" WHERE ""Enabled"" = 1")).ToList();
        _cidmsClasses = (await conn.QueryAsync<CidmsChildRecord>(@"SELECT ""AssetCIDMSClassID"" AS ""Id"", ""AssetCIDMSClassDesc"" AS ""Desc"", ""AssetAccountSubGroupID"" AS ""ParentId"" FROM ""Const_Asset_CIDMS_Class"" WHERE ""Enabled"" = 1")).ToList();
        _cidmsGroupTypes = (await conn.QueryAsync<CidmsChildRecord>(@"SELECT ""AssetCIDMSGroupTypeID"" AS ""Id"", ""AssetCIDMSGroupTypeDesc"" AS ""Desc"", ""AssetCIDMSClassID"" AS ""ParentId"" FROM ""Const_Asset_CIDMS_Group_Type"" WHERE ""Enabled"" = 1")).ToList();
        _cidmsAssetTypes = (await conn.QueryAsync<CidmsChildRecord>(@"SELECT ""AssetCIDMSAssetTypeID"" AS ""Id"", ""AssetCIDMSAssetTypeDesc"" AS ""Desc"", ""AssetCIDMSGroupTypeID"" AS ""ParentId"" FROM ""Const_Asset_CIDMS_Asset_Type"" WHERE ""Enabled"" = 1")).ToList();
        _cidmsComponentTypes = (await conn.QueryAsync<CidmsChildRecord>(@"SELECT ""AssetCIDMSComponentTypeID"" AS ""Id"", ""AssetCIDMSComponentTypeDesc"" AS ""Desc"", ""AssetCIDMSAssetTypeID"" AS ""ParentId"" FROM ""Const_Asset_CIDMS_Component_Type"" WHERE ""Enabled"" = 1")).ToList();
        _cidmsSubComponentTypes = (await conn.QueryAsync<CidmsChildRecord>(@"SELECT ""AssetCIDMSSubComponentTypeID"" AS ""Id"", ""AssetCIDMSSubComponentTypeDesc"" AS ""Desc"", ""AssetCIDMSComponentTypeID"" AS ""ParentId"" FROM ""Const_Asset_CIDMS_SubComponent_Type"" WHERE ""Enabled"" = 1")).ToList();
        _cidmsMunicipalServices = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(@"SELECT ""AssetMunicipalServicesDesc"", ""AssetMunicipalServicesID"" FROM ""Const_Asset_CIDMS_Municipal_Services"" WHERE ""Enabled"" = 1"));
        _criticalityGrades = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(@"SELECT ""AssetCriticalityGradeDesc"" AS ""CriticalityGradeDesc"", ""AssetCriticalityGradeID"" AS ""CriticalityGrade_ID"" FROM ""Const_Asset_Criticality_Grade"" WHERE ""Enabled"" = 1"));
        _healthGrades = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(@"SELECT ""AssetHealthGradeDesc"" AS ""HealthGradeDesc"", ""AssetHealthGradeID"" AS ""HealthGrade_ID"" FROM ""Const_Asset_Health_Grade"" WHERE ""Enabled"" = 1"));
        _performanceGrades = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(@"SELECT ""AssetPerformanceGradeDesc"" AS ""PerformanceGradeDesc"", ""AssetPerformanceGradeID"" AS ""PerformanceGrade_ID"" FROM ""Const_Asset_Performance_Grade"" WHERE ""Enabled"" = 1"));
        _utilisationGrades = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(@"SELECT ""AssetUtilisationGradeDesc"" AS ""UtilisationGradeDesc"", ""AssetUtilisationGradeID"" AS ""UtilisationGrade_ID"" FROM ""Const_Asset_Utilisation_Grade"" WHERE ""Enabled"" = 1"));
        _financialStatuses = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(@"SELECT ""FinancialStatusDesc"", ""FinStatusID"" FROM ""AssetConfig_FinancialStatus"" WHERE ""Enabled"" = 1"));
        _existingBarcodes = new HashSet<string>(
            await conn.QueryAsync<string>(@"SELECT ""Barcode"" FROM ""Asset_Register_Items"" WHERE ""Barcode"" IS NOT NULL AND ""Barcode"" != ''"),
            StringComparer.OrdinalIgnoreCase);
        _existingMunicipalAssetIds = new HashSet<string>(
            await conn.QueryAsync<string>(@"SELECT ""MunicipalAssetID"" FROM ""Asset_Register_Items"" WHERE ""MunicipalAssetID"" IS NOT NULL AND ""MunicipalAssetID"" != ''"),
            StringComparer.OrdinalIgnoreCase);

        var critRows = await conn.QueryAsync<(int id, string consequence)>(
            @"SELECT ""AssetCriticalityGradeID"", COALESCE(""ConsequenceOfFailure"", '') FROM ""Const_Asset_Criticality_Grade"" WHERE ""Enabled"" = 1");
        _criticalityConsequenceMap = critRows.ToDictionary(x => x.id, x => x.consequence ?? "");

        _uom = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(
            @"SELECT ""UnitOfIssueDesc"", ""UnitOfIssue_ID"" FROM ""Const_UnitOfIssue"" WHERE ""Enabled"" = 1 AND COALESCE(""IsDeleted"", 0) = 0"));
        _departments = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(
            @"SELECT ""DepartmentDesc"", ""Department_ID"" FROM ""Const_Department"" WHERE ""Enabled"" = 1"));
        var divisionRows = (await conn.QueryAsync<(string desc, int id, string deptDesc, int? deptId)>(
            @"SELECT d.""DivisionDesc"", d.""Division_ID"", COALESCE(dep.""DepartmentDesc"", '') AS ""DepartmentDesc"", d.""DepartmentID""
              FROM ""Const_Division"" d
              LEFT JOIN ""Const_Department"" dep ON dep.""Department_ID"" = d.""DepartmentID""
              WHERE d.""Enabled"" = 1")).ToList();
        _divisions = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var div in divisionRows)
        {
            var divKey = div.desc ?? "";
            if (!string.IsNullOrWhiteSpace(divKey))
            {
                var descKey = $"{div.deptDesc}|{divKey}";
                if (!_divisions.ContainsKey(descKey))
                    _divisions[descKey] = div.id;
                if (div.deptId.HasValue)
                {
                    var idKey = $"{div.deptId}|{divKey}";
                    if (!_divisions.ContainsKey(idKey))
                        _divisions[idKey] = div.id;
                }
            }
        }
        _towns = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(
            @"SELECT ""Town"", ""Town_ID"" FROM ""Const_Town"" WHERE ""Enabled"" = 1"));
        var empRows = await conn.QueryAsync<(string firstName, string surname, int id)>(
            @"SELECT ""FirstName"", ""Surname"", ""Employee_ID"" FROM ""Payroll_Employee"" WHERE ""Enabled"" = 1");
        _custodians = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var emp in empRows)
        {
            var fullName = (emp.firstName ?? "").Trim() + " " + (emp.surname ?? "").Trim();
            if (!string.IsNullOrWhiteSpace(fullName) && !_custodians.ContainsKey(fullName))
                _custodians[fullName] = emp.id;
        }
        _assetOwnerships = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(
            @"SELECT ""AssetOwnershipDesc"", ""AssetOwnership_ID"" FROM ""Const_AssetOwnership"" WHERE ""Enabled"" = 1"));
        _streets = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(
            @"SELECT ""StreetName"", ""Street_ID"" FROM ""Const_Street"" WHERE ""Enabled"" = 1"));
        _buildings = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(
            @"SELECT ""BuildingDesc"", ""Building_ID"" FROM ""Const_Building"" WHERE ""Enabled"" = 1"));
        _wards = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(
            @"SELECT ""WardDescription"", ""Ward_Id"" FROM ""Const_Ward"" WHERE ""Enabled"" = 1"));
        _suburbs = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(
            @"SELECT ""SuburbName"", ""Suburb_ID"" FROM ""Const_Suburb"" WHERE ""Enabled"" = 1"));
        _floors = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(
            @"SELECT ""FloorDesc"", ""Floor_ID"" FROM ""Const_Floor"" WHERE ""Enabled"" = 1"));
        _rooms = ToSafeDictionary(await conn.QueryAsync<(string desc, int id)>(
            @"SELECT ""RoomDesc"", ""Room_ID"" FROM ""Const_Room"" WHERE ""Enabled"" = 1"));

        var catStatusRows = await conn.QueryAsync<(int categoryId, int statusId)>(
            @"SELECT DISTINCT ""AssetCategoryID"", ""AssetStatus_ID"" FROM ""Const_AssetClass_sys""
              WHERE ""Enabled"" = 1 AND ""AssetCategoryID"" IS NOT NULL AND ""AssetStatus_ID"" IS NOT NULL AND ""AssetStatus_ID"" > 0");
        _validCategoryStatusPairs = new HashSet<(int, int)>(catStatusRows);
        _categoryIdsWithStatusConstraint = new HashSet<int>(catStatusRows.Select(x => x.categoryId));

        var categoryIdsRequiringStatus = await conn.QueryAsync<int>(
            @"SELECT DISTINCT ""AssetCategoryID"" FROM ""Const_AssetClass_sys""
              WHERE ""Enabled"" = 1 AND ""AssetCategoryID"" IS NOT NULL
              AND ""AssetCategoryID"" NOT IN (
                SELECT DISTINCT ""AssetCategoryID"" FROM ""Const_AssetClass_sys""
                WHERE ""Enabled"" = 1 AND (""AssetStatus_ID"" IS NULL OR ""AssetStatus_ID"" = 0)
              )");
        _categoryIdsWithRequiredStatus = new HashSet<int>(categoryIdsRequiringStatus);

        var typeMeasRows = await conn.QueryAsync<(int typeId, int measId)>(
            @"SELECT DISTINCT ""TypeID"", ""AssetMeasurement_ID"" FROM ""Const_AssetClass_sys""
              WHERE ""Enabled"" = 1 AND ""TypeID"" IS NOT NULL AND ""AssetMeasurement_ID"" IS NOT NULL AND ""AssetMeasurement_ID"" > 0");
        _validTypeMeasPairs = new HashSet<(int, int)>(typeMeasRows);
        _typeIdsWithMeasConstraint = new HashSet<int>(typeMeasRows.Select(x => x.typeId));

        var typeIdsRequiringMeas = await conn.QueryAsync<int>(
            @"SELECT DISTINCT ""TypeID"" FROM ""Const_AssetClass_sys""
              WHERE ""Enabled"" = 1 AND ""TypeID"" IS NOT NULL
              AND ""TypeID"" NOT IN (
                SELECT DISTINCT ""TypeID"" FROM ""Const_AssetClass_sys""
                WHERE ""Enabled"" = 1 AND (""AssetMeasurement_ID"" IS NULL OR ""AssetMeasurement_ID"" = 0)
              )");
        _typeIdsWithRequiredMeas = new HashSet<int>(typeIdsRequiringMeas);
    }

    public (Dictionary<string, string?> errors, Dictionary<string, string> resolvedIds) ValidateRow(
        Dictionary<string, string> row, int rowNum, HashSet<string> batchBarcodes, int uploadType = 1)
    {
        var errors = new Dictionary<string, string?>();
        var resolved = new Dictionary<string, string>();

        bool mustExist = uploadType == 1 || uploadType == 3 || uploadType == 5;
        bool isDonated = uploadType == 3;

        if (uploadType == 2)
        {
            var debitVal = GetVal(row, "DebitPlanProjectItemID");
            if (string.IsNullOrWhiteSpace(debitVal))
                errors["DebitPlanProjectItemID"] = "Required field 'DebitPlanProjectItemID' is empty for WIP upload";
        }

        var desc = GetVal(row, "Description");
        if (string.IsNullOrWhiteSpace(desc))
            errors["Description"] = "Required field 'Description' is empty";

        var municipalAssetId = GetVal(row, "MunicipalAssetID");
        if (!string.IsNullOrWhiteSpace(municipalAssetId))
        {
            if (_existingMunicipalAssetIds.Contains(municipalAssetId))
                errors["MunicipalAssetID"] = "Municipal Register ID Already Exist";
        }

        int resolvedTypeId = 0;
        int resolvedCatId = 0;
        int resolvedSubCatId = 0;
        int resolvedStatusId = 0;
        int resolvedMeasurementId = 0;

        var typeVal = GetVal(row, "AssetType_ID");
        if (string.IsNullOrWhiteSpace(typeVal))
            errors["AssetType_ID"] = "Required field 'AssetType' is empty";
        else if (!_assetTypes.TryGetValue(typeVal, out resolvedTypeId))
            errors["AssetType_ID"] = "Invalid data in column: AssetType - '" + typeVal + "' not found";
        else
            resolved["AssetType_ID"] = resolvedTypeId.ToString();

        var statusVal = GetVal(row, "AssetStatus_ID");
        if (!string.IsNullOrWhiteSpace(statusVal))
        {
            if (_assetStatuses.TryGetValue(statusVal, out resolvedStatusId))
                resolved["AssetStatus_ID"] = resolvedStatusId.ToString();
            else
                errors["AssetStatus_ID"] = "Invalid data in column: AssetStatus - '" + statusVal + "' not found";
        }

        var measVal = GetVal(row, "MeasurementType_ID");
        if (!string.IsNullOrWhiteSpace(measVal))
        {
            if (_measurementTypes.TryGetValue(measVal, out resolvedMeasurementId))
                resolved["MeasurementType_ID"] = resolvedMeasurementId.ToString();
            else
                errors["MeasurementType_ID"] = "Invalid data in column: MeasurementType - '" + measVal + "' not found";
        }

        if (resolvedTypeId > 0)
        {
            if (resolvedMeasurementId > 0)
            {
                if (_typeIdsWithMeasConstraint.Contains(resolvedTypeId)
                    && !_validTypeMeasPairs.Contains((resolvedTypeId, resolvedMeasurementId)))
                    errors["MeasurementType_ID"] = "Invalid Measurement Type selected for the Asset Type, Asset Type '" + typeVal + "' | Measurement Type '" + measVal + "'";
            }
            else if (string.IsNullOrWhiteSpace(measVal) && _typeIdsWithRequiredMeas.Contains(resolvedTypeId))
            {
                errors["MeasurementType_ID"] = "Measurement Type is required for Asset Type '" + typeVal + "'";
            }
        }

        var catVal = GetVal(row, "AssetCategory_ID");
        if (string.IsNullOrWhiteSpace(catVal))
            errors["AssetCategory_ID"] = "Required field 'AssetCategory' is empty";
        else if (resolvedTypeId == 0)
            errors["AssetCategory_ID"] = "Cannot resolve AssetCategory - AssetType is invalid";
        else
        {
            int foundCatId = 0;
            for (int i = 0; i < _assetCategories.Count; i++)
            {
                var c = _assetCategories[i];
                if (string.Equals(c.Desc, catVal, StringComparison.OrdinalIgnoreCase) && c.TypeId == resolvedTypeId)
                { foundCatId = c.Id; break; }
            }
            if (foundCatId == 0)
                errors["AssetCategory_ID"] = "Invalid data: AssetCategory '" + catVal + "' not found for AssetType '" + typeVal + "'";
            else
            {
                resolvedCatId = foundCatId;
                resolved["AssetCategory_ID"] = foundCatId.ToString();
            }
        }

        if (resolvedCatId > 0 && !errors.ContainsKey("AssetStatus_ID"))
        {
            if (resolvedStatusId > 0)
            {
                if (_categoryIdsWithStatusConstraint.Contains(resolvedCatId)
                    && !_validCategoryStatusPairs.Contains((resolvedCatId, resolvedStatusId)))
                    errors["AssetStatus_ID"] = "Asset Status is not allowed for Asset Type/Category, Asset Status '" + statusVal + "' | Asset Category '" + catVal + "'";
            }
            else if (string.IsNullOrWhiteSpace(statusVal) && _categoryIdsWithRequiredStatus.Contains(resolvedCatId))
            {
                errors["AssetStatus_ID"] = "Asset Status is required for Asset Type/Category, Asset Category '" + catVal + "'";
            }
        }

        var subCatVal = GetVal(row, "Asset_SubCategory_ID");
        if (!string.IsNullOrWhiteSpace(subCatVal))
        {
            if (resolvedTypeId == 0 || resolvedCatId == 0)
                errors["Asset_SubCategory_ID"] = "Cannot resolve AssetSubCategory - AssetType or AssetCategory is invalid";
            else
            {
                int foundSubId = 0;
                for (int i = 0; i < _assetSubCategories.Count; i++)
                {
                    var s = _assetSubCategories[i];
                    if (string.Equals(s.Desc, subCatVal, StringComparison.OrdinalIgnoreCase) && s.TypeId == resolvedTypeId && s.CategoryId == resolvedCatId)
                    { foundSubId = s.Id; break; }
                }
                if (foundSubId == 0)
                    errors["Asset_SubCategory_ID"] = "Invalid data: AssetSubCategory '" + subCatVal + "' not found for Type '" + typeVal + "' / Category '" + catVal + "'";
                else
                {
                    resolvedSubCatId = foundSubId;
                    resolved["Asset_SubCategory_ID"] = foundSubId.ToString();
                }
            }
        }

        var classVal = GetVal(row, "AssetClass_ID");
        if (string.IsNullOrWhiteSpace(classVal))
            errors["AssetClass_ID"] = "Required field 'AssetClass' is empty";
        else if (resolvedTypeId == 0 || resolvedCatId == 0)
            errors["AssetClass_ID"] = "Cannot resolve AssetClass - AssetType or AssetCategory is invalid";
        else
        {
            int foundClassId = 0;
            for (int i = 0; i < _assetClassRecords.Count; i++)
            {
                var cl = _assetClassRecords[i];
                if (!string.Equals(cl.Desc, classVal, StringComparison.OrdinalIgnoreCase)) continue;
                if (cl.TypeId != resolvedTypeId) continue;
                if (cl.CategoryId != resolvedCatId) continue;
                if (resolvedSubCatId > 0)
                {
                    if ((cl.SubCategoryId ?? 0) != resolvedSubCatId) continue;
                }
                if (resolvedMeasurementId > 0)
                {
                    if ((cl.MeasurementId ?? 0) != resolvedMeasurementId) continue;
                }
                if (resolvedStatusId > 0)
                {
                    if ((cl.StatusId ?? 0) != resolvedStatusId) continue;
                }
                foundClassId = cl.Id;
                break;
            }
            if (foundClassId == 0)
            {
                var errMsg = "Invalid data: AssetClass '" + classVal + "' not found for Type '" + typeVal + "' / Category '" + catVal + "'";
                if (!string.IsNullOrWhiteSpace(subCatVal)) errMsg = errMsg + " / SubCategory '" + subCatVal + "'";
                if (resolvedMeasurementId > 0) errMsg = errMsg + " / MeasurementType '" + measVal + "'";
                if (resolvedStatusId > 0) errMsg = errMsg + " / Status '" + statusVal + "'";
                errors["AssetClass_ID"] = errMsg;
            }
            else
                resolved["AssetClass_ID"] = foundClassId.ToString();
        }

        ResolveFk(row, errors, resolved, "AssetCondition_ID", _assetConditions, true);

        var finStatusVal = GetVal(row, "Financial_Status_ID");
        ResolveFk(row, errors, resolved, "Financial_Status_ID", _financialStatuses, true);

        bool disposalRequired = string.Equals(finStatusVal, "Disposed Asset", StringComparison.OrdinalIgnoreCase)
                             || string.Equals(finStatusVal, "Write Off", StringComparison.OrdinalIgnoreCase);

        int cidmsAccGroupId = 0;
        var cidmsAccGroupVal = GetVal(row, "CIDMSAccountingGroup");
        if (!string.IsNullOrWhiteSpace(cidmsAccGroupVal))
        {
            if (_cidmsAccountingGroups.TryGetValue(cidmsAccGroupVal, out cidmsAccGroupId))
                resolved["CIDMSAccountingGroup"] = cidmsAccGroupId.ToString();
            else
                errors["CIDMSAccountingGroup"] = "Invalid data: CIDMSAccountingGroup - '" + cidmsAccGroupVal + "' not found";
        }

        int cidmsSubGroupId = 0;
        var cidmsSubGroupVal = GetVal(row, "CIDMSSubAccountingGroup");
        if (!string.IsNullOrWhiteSpace(cidmsSubGroupVal))
        {
            if (cidmsAccGroupId == 0)
                errors["CIDMSSubAccountingGroup"] = "Cannot resolve CIDMSSubAccountingGroup - CIDMSAccountingGroup is invalid";
            else
            {
                cidmsSubGroupId = ResolveCidmsChild(_cidmsAccountingSubGroups, cidmsSubGroupVal, cidmsAccGroupId);
                if (cidmsSubGroupId == 0)
                    errors["CIDMSSubAccountingGroup"] = "Invalid data: CIDMSSubAccountingGroup '" + cidmsSubGroupVal + "' not found under AccountingGroup '" + cidmsAccGroupVal + "'";
                else
                    resolved["CIDMSSubAccountingGroup"] = cidmsSubGroupId.ToString();
            }
        }

        int cidmsClassId = 0;
        var cidmsClassVal = GetVal(row, "CIDMSAssetClass");
        if (!string.IsNullOrWhiteSpace(cidmsClassVal))
        {
            if (cidmsSubGroupId == 0)
                errors["CIDMSAssetClass"] = "Cannot resolve CIDMSAssetClass - CIDMSSubAccountingGroup is invalid";
            else
            {
                cidmsClassId = ResolveCidmsChild(_cidmsClasses, cidmsClassVal, cidmsSubGroupId);
                if (cidmsClassId == 0)
                    errors["CIDMSAssetClass"] = "Invalid data: CIDMSAssetClass '" + cidmsClassVal + "' not found under SubAccountingGroup '" + cidmsSubGroupVal + "'";
                else
                    resolved["CIDMSAssetClass"] = cidmsClassId.ToString();
            }
        }

        int cidmsGroupTypeId = 0;
        var cidmsGroupTypeVal = GetVal(row, "CIDMSAssetGroupType");
        if (!string.IsNullOrWhiteSpace(cidmsGroupTypeVal))
        {
            if (cidmsClassId == 0)
                errors["CIDMSAssetGroupType"] = "Cannot resolve CIDMSAssetGroupType - CIDMSAssetClass is invalid";
            else
            {
                cidmsGroupTypeId = ResolveCidmsChild(_cidmsGroupTypes, cidmsGroupTypeVal, cidmsClassId);
                if (cidmsGroupTypeId == 0)
                    errors["CIDMSAssetGroupType"] = "Invalid data: CIDMSAssetGroupType '" + cidmsGroupTypeVal + "' not found under CIDMSAssetClass '" + cidmsClassVal + "'";
                else
                    resolved["CIDMSAssetGroupType"] = cidmsGroupTypeId.ToString();
            }
        }

        int cidmsAssetTypeId = 0;
        var cidmsAssetTypeVal = GetVal(row, "CIDMSAssetType");
        if (!string.IsNullOrWhiteSpace(cidmsAssetTypeVal))
        {
            if (cidmsGroupTypeId == 0)
                errors["CIDMSAssetType"] = "Cannot resolve CIDMSAssetType - CIDMSAssetGroupType is invalid";
            else
            {
                cidmsAssetTypeId = ResolveCidmsChild(_cidmsAssetTypes, cidmsAssetTypeVal, cidmsGroupTypeId);
                if (cidmsAssetTypeId == 0)
                    errors["CIDMSAssetType"] = "Invalid data: CIDMSAssetType '" + cidmsAssetTypeVal + "' not found under GroupType '" + cidmsGroupTypeVal + "'";
                else
                    resolved["CIDMSAssetType"] = cidmsAssetTypeId.ToString();
            }
        }

        int cidmsCompTypeId = 0;
        var cidmsCompTypeVal = GetVal(row, "CIDMSComponentType");
        if (!string.IsNullOrWhiteSpace(cidmsCompTypeVal))
        {
            if (cidmsAssetTypeId == 0)
                errors["CIDMSComponentType"] = "Cannot resolve CIDMSComponentType - CIDMSAssetType is invalid";
            else
            {
                cidmsCompTypeId = ResolveCidmsChild(_cidmsComponentTypes, cidmsCompTypeVal, cidmsAssetTypeId);
                if (cidmsCompTypeId == 0)
                    errors["CIDMSComponentType"] = "Invalid data: CIDMSComponentType '" + cidmsCompTypeVal + "' not found under CIDMSAssetType '" + cidmsAssetTypeVal + "'";
                else
                    resolved["CIDMSComponentType"] = cidmsCompTypeId.ToString();
            }
        }

        var cidmsSubCompVal = GetVal(row, "CIDMSSubComponentTypeID");
        if (!string.IsNullOrWhiteSpace(cidmsSubCompVal))
        {
            if (cidmsCompTypeId == 0)
                errors["CIDMSSubComponentTypeID"] = "Cannot resolve CIDMSSubComponentType - CIDMSComponentType is invalid";
            else
            {
                int cidmsSubCompId = ResolveCidmsChild(_cidmsSubComponentTypes, cidmsSubCompVal, cidmsCompTypeId);
                if (cidmsSubCompId == 0)
                    errors["CIDMSSubComponentTypeID"] = "Invalid data: CIDMSSubComponentType '" + cidmsSubCompVal + "' not found under ComponentType '" + cidmsCompTypeVal + "'";
                else
                    resolved["CIDMSSubComponentTypeID"] = cidmsSubCompId.ToString();
            }
        }

        ResolveFk(row, errors, resolved, "BasicMunicipalityService", _cidmsMunicipalServices, false);

        ResolveFk(row, errors, resolved, "UOM", _uom, true);

        ResolveFk(row, errors, resolved, "MunicipalDepartment_ID", _departments, true);

        var divisionVal = GetVal(row, "Division");
        if (string.IsNullOrWhiteSpace(divisionVal))
        {
            errors["Division"] = "Required field 'Division' is empty";
        }
        else
        {
            var deptDescForValidation = GetVal(row, "MunicipalDepartment_ID");
            var divCompositeKey = $"{deptDescForValidation ?? ""}|{divisionVal}";
            if (!_divisions.ContainsKey(divCompositeKey))
            {
                if (!string.IsNullOrEmpty(deptDescForValidation))
                    errors["Division"] = $"Division '{divisionVal}' does not belong to the specified Municipal Department";
                else
                {
                    var divSuffix = $"|{divisionVal}";
                    var anyMatch = _divisions.Keys.Any(k => k.EndsWith(divSuffix, StringComparison.OrdinalIgnoreCase));
                    if (!anyMatch)
                        errors["Division"] = $"Invalid data in column: Division - '{divisionVal}' not found";
                }
            }
        }
        ValidateExistsInLookup(row, errors, "Town", _towns, true);

        var custodianNameVal = GetVal(row, "Custodian_ID");
        if (!string.IsNullOrWhiteSpace(custodianNameVal))
        {
            if (_custodians.TryGetValue(custodianNameVal, out var custId))
                resolved["Custodian_ID"] = custId.ToString();
            else
                errors["Custodian_ID"] = "Invalid data in column: Custodian Name - '" + custodianNameVal + "' not found";
        }
        else if (mustExist)
        {
            errors["Custodian_ID"] = "Required field 'Custodian Name' is empty";
        }

        ValidateExistsInLookup(row, errors, "AssetOwnershipName", _assetOwnerships, false);
        ValidateExistsInLookup(row, errors, "Street", _streets, false);
        ValidateExistsInLookup(row, errors, "Building", _buildings, false);
        ValidateExistsInLookup(row, errors, "Ward", _wards, false);
        ValidateExistsInLookup(row, errors, "Suburb", _suburbs, false);
        ValidateExistsInLookup(row, errors, "Floor", _floors, false);
        ValidateExistsInLookup(row, errors, "Room", _rooms, false);

        int resolvedCritGradeId = 0;
        var critGradeVal = GetVal(row, "CriticalityGrade");
        if (!string.IsNullOrWhiteSpace(critGradeVal))
        {
            if (_criticalityGrades.TryGetValue(critGradeVal, out resolvedCritGradeId))
                resolved["CriticalityGrade"] = resolvedCritGradeId.ToString();
            else
                errors["CriticalityGrade"] = "Invalid data in column: CriticalityGrade - '" + critGradeVal + "' not found";
        }

        ResolveFk(row, errors, resolved, "PerformanceGrade", _performanceGrades, false);
        ResolveFk(row, errors, resolved, "UtilisationGrade", _utilisationGrades, false);
        ResolveFk(row, errors, resolved, "InfrastructureHealthGrade", _healthGrades, false);

        var consequenceVal = GetVal(row, "ConsequenceOfFailure");
        if (!string.IsNullOrWhiteSpace(consequenceVal))
        {
            if (resolvedCritGradeId > 0 && _criticalityConsequenceMap.TryGetValue(resolvedCritGradeId, out var expectedConsequence))
            {
                if (!string.Equals(consequenceVal, expectedConsequence, StringComparison.OrdinalIgnoreCase))
                    errors["ConsequenceOfFailure"] = "Invalid or missing entries in column for Consequence of Failure";
            }
            else
            {
                if (!_validConsequenceOfFailure.Contains(consequenceVal))
                    errors["ConsequenceOfFailure"] = "Invalid or missing entries in column for Consequence of Failure";
            }
        }

        ValidateDate(row, errors, "AcquisitionDate", true);
        ValidateDate(row, errors, "InserviceDate", true);
        ValidateDate(row, errors, "CommisioningDate", false);
        ValidateDate(row, errors, "DateOfDisposal", disposalRequired);
        ValidateDate(row, errors, "Impairment_Date", false);
        ValidateDate(row, errors, "DateModified", false);
        ValidateDate(row, errors, "VerificationDate", false);

        if (isDonated)
        {
            ValidateDate(row, errors, "DonorDate", true);
            var donorName = GetVal(row, "DonorName");
            if (string.IsNullOrWhiteSpace(donorName))
                errors["DonorName"] = "Required field 'DonorName' is empty for donated asset upload";
        }

        var ulYear = GetVal(row, "UsefulLifeYearComponent");
        var ulMonth = GetVal(row, "UsefulLifeMonthComponent");
        if (string.IsNullOrWhiteSpace(ulYear) && string.IsNullOrWhiteSpace(ulMonth))
            errors["UsefulLifeYearComponent"] = "Either UsefulLifeYearComponent or UsefulLifeMonthComponent is required";

        string[] numericFields = { "PurchaseAmount", "ResidualValue", "AccumulatedDepreciationClosingBalance",
            "AccumulatedImpairmentClosingBalance", "CarryingAmountClosingBalance", "CurrentReplacementCostCRC",
            "DepreciatedReplacementCostDRC", "AnnualisedMaintenanceCRC", "AnnualMaintenanceBudgetNeed",
            "UsefulLifeMonthComponent", "UsefulLifeYearComponent", "Remaining_Useful_Life_Year",
            "RemainingUsefulLife", "RemainingUsefulLifeAtTakeOn",
            "Dim1", "Dim2", "Dim3", "DimensionQuantity",
            "ErfSizeM2", "latitude", "longitude",
            "FundingSourceAmount", "CostOfAddition", "ForecastReplacementYear",
            "RevaluationOpeningBalance", "RevaluationReserveMovement" };
        for (int i = 0; i < numericFields.Length; i++)
        {
            ValidateNumeric(row, errors, numericFields[i]);
        }

        var yearConstructedVal = GetVal(row, "YearConstructed");
        if (!string.IsNullOrWhiteSpace(yearConstructedVal))
        {
            if (!DateTime.TryParseExact("01-Jan-" + yearConstructedVal, "dd-MMM-yyyy",
                    CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
                errors["YearConstructed"] = "Invalid format in column: " + yearConstructedVal + ", please use the following format: yyyy";
        }

        var quantityStr = GetVal(row, "Quantity");
        if (!string.IsNullOrWhiteSpace(quantityStr))
        {
            if (!decimal.TryParse(quantityStr, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal quantityVal))
                errors["Quantity"] = "Invalid numeric value in column: Quantity - '" + quantityStr + "'";
            else if (quantityVal <= 0)
                errors["Quantity"] = "Quantity must be greater than 0";
        }
        else
        {
            errors["Quantity"] = "Required field 'Quantity' is empty";
        }

        var purchaseAmountStr = GetVal(row, "PurchaseAmount");
        var crcStr = GetVal(row, "CurrentReplacementCostCRC");
        if (mustExist)
        {
            if (string.IsNullOrWhiteSpace(purchaseAmountStr))
                errors["PurchaseAmount"] = "Required field 'PurchaseAmount' is empty";
            else if (!decimal.TryParse(purchaseAmountStr, NumberStyles.Any, CultureInfo.InvariantCulture, out decimal paVal2) || paVal2 <= 0)
                errors["PurchaseAmount"] = "PurchaseAmount must be greater than 0";
        }

        {
            decimal crcVal = 0m;
            if (!string.IsNullOrWhiteSpace(crcStr))
                decimal.TryParse(crcStr, NumberStyles.Any, CultureInfo.InvariantCulture, out crcVal);
            if (crcVal <= 0)
                errors["CurrentReplacementCostCRC"] = "Current Replacement Cost CRC is required and must be greater than 0";
        }

        var caStr = GetVal(row, "CarryingAmountClosingBalance");
        var accDepStr = GetVal(row, "AccumulatedDepreciationClosingBalance");
        var accImpStr = GetVal(row, "AccumulatedImpairmentClosingBalance");
        if (!string.IsNullOrWhiteSpace(caStr) && !string.IsNullOrWhiteSpace(crcStr))
        {
            decimal caVal = 0m, accDepVal = 0m, accImpVal = 0m, crcValForCheck = 0m;
            decimal.TryParse(crcStr, NumberStyles.Any, CultureInfo.InvariantCulture, out crcValForCheck);
            decimal.TryParse(accDepStr, NumberStyles.Any, CultureInfo.InvariantCulture, out accDepVal);
            decimal.TryParse(accImpStr, NumberStyles.Any, CultureInfo.InvariantCulture, out accImpVal);
            if (decimal.TryParse(caStr, NumberStyles.Any, CultureInfo.InvariantCulture, out caVal))
            {
                var expectedCA = crcValForCheck - accDepVal - accImpVal;
                if (Math.Abs(expectedCA - caVal) > 0.01m)
                    errors["CarryingAmountClosingBalance"] = "Carrying Amount (" + caVal.ToString("F2") + ") must equal CRC - Accumulated Depreciation - Accumulated Impairment (" + expectedCA.ToString("F2") + ")";
            }
        }

        var riskVal = GetVal(row, "Risk");
        if (!string.IsNullOrWhiteSpace(riskVal))
        {
            var riskNorm = riskVal.Replace(" ", "");
            if (!_validRisk.Contains(riskNorm) && !_validRisk.Contains(riskVal))
                errors["Risk"] = "Invalid or missing entries in column for Risk";
        }

        var warrantyVal = GetVal(row, "Warranty");
        if (string.IsNullOrWhiteSpace(warrantyVal))
            errors["Warranty"] = "Invalid or missing entries in column for Warranty, it must be Yes or No";
        else if (!_validYesNo.Contains(warrantyVal))
            errors["Warranty"] = "Invalid or missing entries in column for Warranty, it must be Yes or No";

        var insuranceCoverVal = GetVal(row, "InsuranceCover");
        if (string.IsNullOrWhiteSpace(insuranceCoverVal))
            errors["InsuranceCover"] = "Invalid or missing entries in column for Insurance Cover, it must be Yes or No";
        else if (!_validYesNo.Contains(insuranceCoverVal))
            errors["InsuranceCover"] = "Invalid or missing entries in column for Insurance Cover, it must be Yes or No";
        else if (string.Equals(insuranceCoverVal, "Yes", StringComparison.OrdinalIgnoreCase))
        {
            var policyNo = GetVal(row, "InsurancePolicyNo");
            if (string.IsNullOrWhiteSpace(policyNo))
                errors["InsurancePolicyNo"] = "Insurance Policy No is required when Insurance Cover is Yes";
        }

        var cashGeneratingVal = GetVal(row, "CashOrNoncashgeneratingunit");
        if (string.IsNullOrWhiteSpace(cashGeneratingVal))
            errors["CashOrNoncashgeneratingunit"] = "Invalid or missing entries in column for Cash Generating";
        else if (!_validCashGenerating.Contains(cashGeneratingVal))
            errors["CashOrNoncashgeneratingunit"] = "Invalid or missing entries in column for Cash Generating";

        var natureOfAdditionVal = GetVal(row, "NatureOfAddition");
        if (string.IsNullOrWhiteSpace(natureOfAdditionVal))
            errors["NatureOfAddition"] = "Invalid or missing entries in column for Nature of Addition";
        else if (!_validNatureOfAddition.Contains(natureOfAdditionVal))
            errors["NatureOfAddition"] = "Invalid or missing entries in column for Nature of Addition";

        var infraVal = GetVal(row, "InfrastructurOrNonInfrastructure");
        if (string.IsNullOrWhiteSpace(infraVal))
            errors["InfrastructurOrNonInfrastructure"] = "Invalid or missing entries, please indicate if the Asset is an Infrastructure/Non-Infrastructure";
        else if (!_validInfrastructure.Contains(infraVal))
            errors["InfrastructurOrNonInfrastructure"] = "Invalid or missing entries, please indicate if the Asset is an Infrastructure/Non-Infrastructure";

        var barcode = GetVal(row, "Barcode");
        if (!string.IsNullOrWhiteSpace(barcode))
        {
            if (_existingBarcodes.Contains(barcode))
                errors["Barcode"] = "Barcode already exists: " + barcode;
            else if (batchBarcodes.Contains(barcode))
                errors["Barcode"] = "Duplicate barcode in upload: " + barcode;
            else
                batchBarcodes.Add(barcode);
        }

        return (errors, resolved);
    }

    private static string GetVal(Dictionary<string, string> row, string key)
    {
        if (row.TryGetValue(key, out var val))
            return val?.Trim() ?? "";
        return "";
    }

    private static int ResolveCidmsChild(List<CidmsChildRecord> records, string description, int parentId)
    {
        for (int i = 0; i < records.Count; i++)
        {
            var r = records[i];
            if (string.Equals(r.Desc, description, StringComparison.OrdinalIgnoreCase) && r.ParentId == parentId)
                return r.Id;
        }
        return 0;
    }

    private void ResolveFk(Dictionary<string, string> row, Dictionary<string, string?> errors, Dictionary<string, string> resolved, string field, Dictionary<string, int> lookup, bool required)
    {
        var val = GetVal(row, field);
        if (string.IsNullOrWhiteSpace(val))
        {
            if (required)
                errors[field] = "Required field '" + field + "' is empty";
            return;
        }
        if (lookup.TryGetValue(val, out var id))
            resolved[field] = id.ToString();
        else
            errors[field] = "Invalid data in column: " + field + " - '" + val + "' not found";
    }

    private static void ValidateExistsInLookup(Dictionary<string, string> row, Dictionary<string, string?> errors, string field, Dictionary<string, int> lookup, bool required)
    {
        var val = GetVal(row, field);
        if (string.IsNullOrWhiteSpace(val))
        {
            if (required)
                errors[field] = "Required field '" + field + "' is empty";
            return;
        }
        if (!lookup.ContainsKey(val))
            errors[field] = "Invalid data in column: " + field + " - '" + val + "' not found";
    }

    private static void ValidateDate(Dictionary<string, string> row, Dictionary<string, string?> errors, string field, bool required)
    {
        var val = GetVal(row, field);
        if (string.IsNullOrWhiteSpace(val))
        {
            if (required) errors[field] = "Required field '" + field + "' is empty";
            return;
        }
        if (!DateTime.TryParse(val, out _))
            errors[field] = "Invalid date format in column: " + field + " - '" + val + "'";
    }

    private static void ValidateNumeric(Dictionary<string, string> row, Dictionary<string, string?> errors, string field)
    {
        var val = GetVal(row, field);
        if (string.IsNullOrWhiteSpace(val)) return;
        if (!decimal.TryParse(val, NumberStyles.Any, CultureInfo.InvariantCulture, out _))
            errors[field] = "Invalid numeric value in column: " + field + " - '" + val + "'";
    }

    public static readonly string[] ExcelHeaders = {
        "Component ID/Asset Register ID", "ParentAssetRegisterID", "AssetDescription",
        "Municipal Asset ID", "Main Asset ID", "Main Asset Description",
        "Old Barcode", "Barcode", "Image Ref",
        "Asset Type", "Asset Category", "Asset Sub-Category", "Asset Class",
        "CIDMS Sub Component Type", "CIDMS Component Type", "CIDMS Accounting Group",
        "CIDMS Sub Accounting Group", "CIDMS Asset Class", "CIDMS Asset Group Type",
        "CIDMS Asset Type", "Cash Or Non-Cash generating unit", "Measurement Type",
        "Asset Status", "Financial Status", "Acquisition Date", "Commisioning Date",
        "Infrastructur or Non-Infrastructure", "Nature of addition", "Cost of Addition",
        "In Service Date", "Disposal Date", "Reason for Disposal",
        "Impairment Date", "Date Modified", "Verified Date", "Verification Done By",
        "Year Constructed", "Forecast Replacement Year", "Asset Condition",
        "Insurance Cover", "Insurance Policy No", "Warranty",
        "Current Replacement Cost CRC", "Depreciated Replacement Cost DRC",
        "Annualised Maintenance Percentage CRC", "Annual Maintenance Budget Forecast Amount",
        "Useful Life Month Component", "Useful Life Year Component",
        "Remaining Useful Life Year Component", "Remaining Useful Life Month Component",
        "Remaining Useful Life At Take On", "Construction Material", "UoM",
        "Dim1", "Dim2", "Dim3", "Dimension Quantity", "Quantity",
        "Diameter", "Capacity",
        "SG Key", "Deed Number", "Erf/ Farm Number", "Portion Number", "Erf size M2",
        "Make", "Model", "Unit Number", "Registration Number", "Serial Number",
        "Custodian Name", "Custodian ID Number",
        "Basic Municipality Service",
        "Criticality Grade", "Performance Grade", "Utilisation Grade",
        "Infrastructure Health Grade", "Consequence Of Failure", "Risk",
        "Asset Ownership",
        "Municipal Department", "Division", "Town", "Street Address", "Building",
        "Ward", "Zoning", "Floor Description", "Room Number",
        "Well Known Text WKT", "Suburb", "GIS Feauture ID",
        "Latitude", "Longitude",
        "Funding Source Number", "Funding Source Amount", "Funding Source", "Funding type",
        "Purchase Amount Or Cost", "SCOA Item - Purchase Amount Or Cost",
        "Residual Value",
        "Accumulated Depreciation", "SCOA Item -Accumulated Depreciation",
        "Accumulated Impairment", "SCOA Item - Accumulated Impairment",
        "Reversal of Impairment Loss", "Fair Value Adjustment", "Revaluation Reserve",
        "Disposal Value", "SCOA Item - Disposal Amount Cost",
        "Disposal Proceeds", "Profit or Loss on Disposal",
        "Carrying Amount",
        "Donor ID / Registration Number / Parastatal Code",
        "Donor Name / Company Name / Parastatal Name", "Date Donated",
        "Custom 1", "Custom 2", "Custom 3", "Custom 4", "Custom 5",
        "Custom 6", "Custom 7", "Custom 8", "Custom 9",
        "RevaluationOpeningBalance", "RevaluationDate",
        "MovementInRevaluationReserve", "RevaluationValue",
        "DepreciationOffset", "DeemedCost", "RevaluationImpairmentOpeningBalance",
        "TransferFromAmount", "TransferToAmount", "DebitPlanProjectItemID"
    };

    public static readonly string[] DbColumns = {
        "ComponentID_AssetRegisterID", "ParentAssetRegisterItem_ID", "Description",
        "MunicipalAssetID", "MainAssetID", "MainAssetDescription",
        "OldBarCode", "Barcode", "ImageRef",
        "AssetType_ID", "AssetCategory_ID", "Asset_SubCategory_ID", "AssetClass_ID",
        "CIDMSSubComponentTypeID", "CIDMSComponentType", "CIDMSAccountingGroup",
        "CIDMSSubAccountingGroup", "CIDMSAssetClass", "CIDMSAssetGroupType",
        "CIDMSAssetType", "CashOrNoncashgeneratingunit", "MeasurementType_ID",
        "AssetStatus_ID", "Financial_Status_ID", "AcquisitionDate", "CommisioningDate",
        "InfrastructurOrNonInfrastructure", "NatureOfAddition", "CostOfAddition",
        "InserviceDate", "DateOfDisposal", "ReasonforDisposal",
        "Impairment_Date", "DateModified", "VerificationDate", "VerificationDoneBy",
        "YearConstructed", "ForecastReplacementYear", "AssetCondition_ID",
        "InsuranceCover", "InsurancePolicyNo", "Warranty",
        "CurrentReplacementCostCRC", "DepreciatedReplacementCostDRC",
        "AnnualisedMaintenanceCRC", "AnnualMaintenanceBudgetNeed",
        "UsefulLifeMonthComponent", "UsefulLifeYearComponent",
        "Remaining_Useful_Life_Year", "RemainingUsefulLife",
        "RemainingUsefulLifeAtTakeOn", "ConstructionMaterial", "UOM",
        "Dim1", "Dim2", "Dim3", "DimensionQuantity", "Quantity",
        "Diameter", "Capacity",
        "SGKey", "DeedNumber", "ErfNumber", "PortionNumber", "ErfSizeM2",
        "Make", "Model", "UnitNumber", "RegistrationNumber", "SerialNumber",
        "Custodian_ID", "CustodianIdNumber",
        "BasicMunicipalityService",
        "CriticalityGrade", "PerformanceGrade", "UtilisationGrade",
        "InfrastructureHealthGrade", "ConsequenceOfFailure", "Risk",
        "AssetOwnershipName",
        "MunicipalDepartment_ID", "Division", "Town", "Street", "Building",
        "Ward", "Zone", "Floor", "Room",
        "WellKnownTextWKT", "Suburb", "GISFeatureID",
        "latitude", "longitude",
        "FundingSourceNumber", "FundingSourceAmount", "FundingSource", "FundType",
        "PurchaseAmount", "PurchaseAmount_Cost2",
        "ResidualValue",
        "AccumulatedDepreciationClosingBalance", "AccumulatedDepreciationScoaItem",
        "AccumulatedImpairmentClosingBalance", "AccumulatedImpairmentScoaItem",
        "ReversalOfImpairmentLoss",
        "FairValue", "RevaluationReserve",
        "DisposalAmountCost", "PurchaseAmountMovement",
        "DisposalProceeds", "ProfitOrLossOnDisposal",
        "CarryingAmountClosingBalance",
        "DonorConditions",
        "DonorName", "DonorDate",
        "Custom1", "Custom2", "Custom3", "Custom4", "Custom5",
        "Custom6", "Custom7", "Custom8", "Custom9",
        "RevaluationOpeningBalance", "RevaluationDate",
        "MovementInRevaluationReserve", "RevaluationValue",
        "DepreciationOffset", "DeemedCost", "RevaluationImpairmentOpeningBalance",
        "TransferFromAmount", "TransferToAmount", "DebitPlanProjectItemID"
    };

    public static readonly HashSet<string> SkipColumns = new() {
        "DateModified",
        "ComponentID_AssetRegisterID", "ReasonforDisposal", "SGKey",
        "GISFeatureID", "FundingSource", "PurchaseAmount_Cost2",
        "AccumulatedDepreciationScoaItem", "AccumulatedImpairmentScoaItem",
        "ReversalOfImpairmentLoss", "FairValue",
        "DisposalAmountCost", "PurchaseAmountMovement",
        "DisposalProceeds", "ProfitOrLossOnDisposal",
        "DonorConditions", "DonorName", "DonorDate",
        "Custom1", "Custom2", "Custom3", "Custom4", "Custom5",
        "Custom6", "Custom7", "Custom8", "Custom9"
    };

    public static readonly HashSet<string> IntegerColumns = new() {
        "AssetType_ID", "AssetCategory_ID", "Asset_SubCategory_ID", "AssetClass_ID",
        "MeasurementType_ID", "AssetStatus_ID",
        "AssetCondition_ID", "Financial_Status_ID",
        "UOM",
        "CIDMSSubComponentTypeID", "CIDMSComponentType", "CIDMSAccountingGroup",
        "CIDMSSubAccountingGroup", "CIDMSAssetClass", "CIDMSAssetGroupType",
        "CIDMSAssetType", "BasicMunicipalityService",
        "CriticalityGrade", "PerformanceGrade", "UtilisationGrade",
        "InfrastructureHealthGrade", "Risk", "Custodian_ID"
    };

    public static readonly HashSet<string> DecimalColumns = new() {
        "CostOfAddition", "CurrentReplacementCostCRC", "DepreciatedReplacementCostDRC",
        "AnnualisedMaintenanceCRC", "AnnualMaintenanceBudgetNeed",
        "Dim1", "Dim2", "Dim3", "DimensionQuantity", "Quantity", "Diameter", "Capacity",
        "ErfSizeM2", "FundingSourceAmount",
        "PurchaseAmount", "ResidualValue",
        "AccumulatedDepreciationClosingBalance",
        "AccumulatedImpairmentClosingBalance",
        "RevaluationReserve",
        "CarryingAmountClosingBalance", "RevaluationOpeningBalance", "MovementInRevaluationReserve",
        "RevaluationValue", "RevaluationImpairmentOpeningBalance",
        "DepreciationOffset", "DeemedCost", "TransferFromAmount", "TransferToAmount",
        "latitude", "longitude",
        "UsefulLifeYearComponent", "UsefulLifeMonthComponent",
        "Remaining_Useful_Life_Year", "RemainingUsefulLife",
        "RemainingUsefulLifeAtTakeOn"
    };

    public static readonly HashSet<string> DateColumns = new() {
        "AcquisitionDate", "CommisioningDate", "InserviceDate", "DateOfDisposal",
        "Impairment_Date", "DateModified", "VerificationDate", "RevaluationDate",
        "DonorDate"
    };

    public static readonly HashSet<string> FkFields = new() {
        "AssetType_ID", "AssetCategory_ID", "Asset_SubCategory_ID", "AssetClass_ID",
        "AssetStatus_ID", "AssetCondition_ID", "MeasurementType_ID", "Financial_Status_ID",
        "CIDMSAccountingGroup", "CIDMSSubAccountingGroup", "CIDMSAssetClass",
        "CIDMSAssetGroupType", "CIDMSAssetType", "CIDMSComponentType",
        "CIDMSSubComponentTypeID", "BasicMunicipalityService",
        "CriticalityGrade", "PerformanceGrade", "UtilisationGrade",
        "InfrastructureHealthGrade",
        "UOM", "MunicipalDepartment_ID", "Custodian_ID"
    };
}

public class CategoryRecord
{
    public int Id { get; set; }
    public string Desc { get; set; } = "";
    public int? TypeId { get; set; }
}

public class SubCategoryRecord
{
    public int Id { get; set; }
    public string Desc { get; set; } = "";
    public int? TypeId { get; set; }
    public int? CategoryId { get; set; }
}

public class AssetClassRecord
{
    public int Id { get; set; }
    public string Desc { get; set; } = "";
    public int? TypeId { get; set; }
    public int? CategoryId { get; set; }
    public int? SubCategoryId { get; set; }
    public int? MeasurementId { get; set; }
    public int? StatusId { get; set; }
}

public class CidmsChildRecord
{
    public int Id { get; set; }
    public string Desc { get; set; } = "";
    public int? ParentId { get; set; }
}
