using System;
using System.ComponentModel;
using System.Data;
using System.Globalization;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using Serilog;

namespace Sebata.AssetBulkUploadService
{
    public class Validations
    {
        private Asset_DB asset_DB;
        private string missingColumnMessage = "Column Heading Missing";

        private int _JobID;

        private bool LogEvents;

        DataColumnCollection Columns = null;
        private readonly FlyweightFactory _cache;
        private readonly ILogger _logger;

        public Validations(string connection, FlyweightFactory cache, ILogger logger)
        {
            asset_DB = new Asset_DB(connection);
            _cache = cache;
            _logger = logger;
        }

        public int CheckDescriptionForID<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
            AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber,
            bool mustExist = false)
            where TField : class, IFileFields
        {
            try
            {
                var value = importData.GetPropertyValue(memberLambda)?.ToString()?.Trim() ?? string.Empty;
                int.TryParse(value.Replace(" ", string.Empty).Replace(",", string.Empty), out var convertedValue);
                var propertyName = importData.GetPropertyName(memberLambda);

                _logger.Information($"Method : {nameof(CheckDescriptionForID)} | Row Number : {rowNumber} | Property : {propertyName} | Must Exist : {mustExist} | Value : {value}");
                
                if (mustExist && string.IsNullOrWhiteSpace(value))
                {
                    error.RowNumber = rowNumber.ToString();
                    error.SetPropertyValue(memberLambda, $"{propertyName} field is blank (Mandatory Field).");
                    return 1;
                }

                if (string.IsNullOrWhiteSpace(value)) return 0;

                //first find the table
                var tableName = propertyName switch
                {
                    "CriticalityGrade" => "Const_Asset_Criticality_Grade",
                    "PerformanceGrade" => "Const_Asset_Performance_Grade",
                    "UtilisationGrade" => "Const_Asset_Utilisation_Grade",
                    "InfrastructureHealthGrade" => "Const_Asset_Health_Grade",
                    "BasicMunicipalityService" => "Const_Asset_CIDMS_Municipal_Services",
                    "CIDMSAssetType" => "Const_Asset_CIDMS_Asset_Type",
                    "CIDMSAssetGroupType" => "Const_Asset_CIDMS_Group_Type",
                    "CIDMSAssetClass" => "Const_Asset_CIDMS_Class",
                    "CIDMSAccountingGroup" => "Const_Asset_CIDMS_Accounting_Group",
                    "CIDMSSubAccountingGroup" => "Const_Asset_CIDMS_Accounting_Sub_Group",
                    "CIDMSComponentType" => "Const_Asset_CIDMS_Component_Type",
                    "CIDMSSubComponentType" => "Const_Asset_CIDMS_SubComponent_Type",
                    "AssetCondition" => "Const_Asset_Condition",
                    "FinancialStatus" => "AssetConfig_FinancialStatus",
                    "AssetType" => "Const_AssetType_Sys",
                    "AssetCategory" => "Const_AssetCategory_sys",
                    "AssetSub_Category" => "Const_Asset_SubCategory",
                    "AssetClass" => "Const_AssetClass_sys",
                    "MeasurementType" => "AssetConfig_MeasurementType",
                    "AssetStatus" => "Const_AssetStatus_Sys",
                    "UOM" => "Const_UnitOfIssue",
                    "CustodianName" => "Payroll_Employee",
                    "VerificationDoneBy" => "Payroll_Employee",
                    "AssetOwnershipName" => "Const_AssetOwnership",
                    "MunicipalDepartment" => "Const_Department",
                    "Division" => "Const_Division",
                    "Town" => "Const_Town",
                    "StreetAddress" => "Const_Street",
                    "Building" => "Const_Building",
                    "Ward" => "Const_Ward",
                    "Zoning" => "Const_PropertyTypeOfUse",
                    "RoomNumber" => "Const_Room",
                    "Suburb" => "Const_Suburb",
                    "FloorArea" => "Const_Floor",
                    "GISFeautureID" => "Const_Asset_GIS",
                    _ => string.Empty
                };

                var primaryKey = _cache.GetRecord(tableName, value, convertedValue)?.PrimaryKeyId ?? 0;

                if (primaryKey == 0)
                {
                    error.RowNumber = rowNumber.ToString();
                    error.SetPropertyValue(memberLambda, $"Invalid data in column: {value}");
                    return 1;
                }

                importData.SetPropertyValue(memberLambda, primaryKey.ToString());
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public int CheckString<TField>(AssetUploadWorker.AssetTakeOnImportData importData, AssetTakeOnErrorClass error,
            Expression<Func<TField, string>> memberLambda, int rowNumber, bool mustExist = false,
            bool numbersOnly = false)
            where TField : class, IFileFields
        {
            try
            {
                var value = importData.GetPropertyValue(memberLambda)?.ToString()?.Trim() ?? string.Empty;
                var propertyName = importData.GetPropertyName(memberLambda);

                _logger.Information($"Method : {nameof(CheckString)} | Row Number : {rowNumber} | Property : {propertyName} | Must Exist : {mustExist} | Numbers Only : {numbersOnly} | Value : {value}");
                
                if (!string.IsNullOrWhiteSpace(value) && numbersOnly)
                {
                    if (!long.TryParse(value.Replace(".", string.Empty).Replace(",", string.Empty), out _))
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda, $"Invalid format in column: {value}");
                        return 1;
                    }
                }

                if (mustExist)
                {
                    if (string.IsNullOrWhiteSpace(value) || value == "NULL")
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda, $"{propertyName} field is blank (Mandatory Field).");
                        return 1;
                    }
                }
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public int CheckNumber<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
            AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber,
            bool mustExist = false, bool checkInteger = false)
            where TField : class, IFileFields
        {
            try
            {
                var value = importData.GetPropertyValue(memberLambda)?.ToString()?.Trim().Replace(" ", string.Empty)
                    .Replace(",", string.Empty) ?? string.Empty;
                var propertyName = importData.GetPropertyName(memberLambda);

                _logger.Information($"Method : {nameof(CheckNumber)} | Row Number : {rowNumber} | Property : {propertyName} | Must Exist : {mustExist} | Check Integer : {checkInteger} | Value : {value}");
                
                if (!string.IsNullOrWhiteSpace(value) && value != "NULL")
                {
                    if (!decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture,
                            out var decimalValue))
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda, $"Invalid format in column: {value}");
                        return 1;
                    }

                    if (decimalValue < 0)
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda, $"Value can not be negative in column: {value}");
                        return 1;
                    }

                    if (checkInteger && !int.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture,
                            out _))
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda,
                            $"Invalid format in column: {value}, it must be an integer");
                        return 1;
                    }
                }
                else if (mustExist)
                {
                    error.RowNumber = rowNumber.ToString();
                    error.SetPropertyValue(memberLambda, $"{propertyName} field is blank (Mandatory Field).");
                    return 1;
                }
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public int CheckNumberNotZero<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
            AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber,
            bool mustExist = false, bool checkInteger = false)
            where TField : class, IFileFields
        {
            try
            {
                var value = importData.GetPropertyValue(memberLambda)?.ToString()?.Trim().Replace(" ", string.Empty)
                    .Replace(",", string.Empty) ?? string.Empty;
                var propertyName = importData.GetPropertyName(memberLambda);
                
                _logger.Information($"Method : {nameof(CheckNumberNotZero)} | Row Number : {rowNumber} | Property : {propertyName} | Must Exist : {mustExist} | Check Integer : {checkInteger} | Value : {value}");

                if (!string.IsNullOrWhiteSpace(value) && value != "NULL")
                {
                    if (!decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture,
                            out var decimalValue))
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda, $"Invalid format in column: {value}");
                        return 1;
                    }

                    if (decimalValue <= 0)
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda, $"Value can not be negative or 0 in column: {value}");
                        return 1;
                    }

                    if (checkInteger && !int.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture,
                            out _))
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda,
                            $"Invalid format in column: {value}, it must be an integer");
                        return 1;
                    }
                }
                else if (mustExist)
                {
                    error.RowNumber = rowNumber.ToString();
                    error.SetPropertyValue(memberLambda, $"{propertyName} field is blank (Mandatory Field).");
                    return 1;
                }
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public int CheckDate<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
            AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber,
            bool mustExist = false)
            where TField : class, IFileFields
        {
            try
            {
                var value = importData.GetPropertyValue(memberLambda)?.ToString()?.Trim() ?? string.Empty;
                var propertyName = importData.GetPropertyName(memberLambda);
                
                _logger.Information($"Method : {nameof(CheckDate)} | Row Number : {rowNumber} | Property : {propertyName} | Must Exist : {mustExist} | Value : {value}");

                if (!string.IsNullOrWhiteSpace(value) && value != "NULL")
                {
                    if (!DateTime.TryParseExact(value, "dd-MMM-yyyy", CultureInfo.InvariantCulture,
                            DateTimeStyles.None, out _))
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda,
                            $"Invalid format in column: {value}, please use the following format: dd-MMM-yyyy");
                        return 1;
                    }
                }
                else if (mustExist)
                {
                    error.RowNumber = rowNumber.ToString();
                    error.SetPropertyValue(memberLambda, $"{propertyName} field is blank (Mandatory Field).");
                    return 1;
                }
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public int CheckDateFromYear<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
            AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber,
            bool mustExist = false)
            where TField : class, IFileFields
        {
            try
            {
                var value = importData.GetPropertyValue(memberLambda)?.ToString()?.Trim() ?? string.Empty;
                var propertyName = importData.GetPropertyName(memberLambda);
                
                _logger.Information($"Method : {nameof(CheckDateFromYear)} | Row Number : {rowNumber} | Property : {propertyName} | Must Exist : {mustExist} | Value : {value}");

                if (!string.IsNullOrWhiteSpace(value) && value != "NULL")
                {
                    if (!DateTime.TryParseExact($"01-Jan-{value}", "dd-MMM-yyyy", CultureInfo.InvariantCulture,
                            DateTimeStyles.None, out _))
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda,
                            $"Invalid format in column: {value}, please use the following format: yyyy");
                        return 1;
                    }
                }
                else if (mustExist)
                {
                    error.RowNumber = rowNumber.ToString();
                    error.SetPropertyValue(memberLambda, $"{propertyName} field is blank (Mandatory Field).");
                    return 1;
                }
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public int CheckSCOA<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
            AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber,
            bool mustExist = false)
            where TField : class, IFileFields
        {
            try
            {
                var value = importData.GetPropertyValue(memberLambda)?.ToString()?.Trim() ?? string.Empty;

                if (!string.IsNullOrWhiteSpace(value) && value != "NULL")
                {
                    if (!decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out _))
                    {
                        if (value.Length > 30)
                        {
                            var scoaId = asset_DB.Asset_GetScoaID("Const_SCOA_Structure", value);

                            if (scoaId == 0)
                            {
                                error.RowNumber = rowNumber.ToString();
                                error.SetPropertyValue(memberLambda, $"No Scoa Id for SCOA Code: {value}");
                                return 1;
                            }

                            importData.SetPropertyValue(memberLambda, scoaId.ToString());
                        }
                        else
                        {
                            var result = CheckNumber(importData, error, memberLambda, rowNumber, mustExist, true);
                            if (result > 0)
                            {
                                error.RowNumber = rowNumber.ToString();
                                error.SetPropertyValue(memberLambda,
                                    $"Invalid format in column: {value}, please use the following format: AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA");
                                return 1;
                            }
                        }
                    }
                    else
                    {
                        var result = CheckNumber(importData, error, memberLambda, rowNumber, mustExist, true);
                        if (result > 0)
                        {
                            error.RowNumber = rowNumber.ToString();
                            error.SetPropertyValue(memberLambda,
                                $"Invalid format in column: {value}, please use the following format: AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA");
                            return 1;
                        }
                    }
                }
                else if (mustExist)
                {
                    error.RowNumber = rowNumber.ToString();
                    error.SetPropertyValue(memberLambda, $"{importData.GetPropertyName(memberLambda)} field is blank (Mandatory Field).");
                    return 1;
                }
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public int CheckTypeMeasurementTypeLink<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
            AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber)
            where TField : class, IFileFields
        {
            try
            {
                if (int.TryParse(importData.AssetType, out var typeId) &&
                    int.TryParse(importData.MeasurementType, out var measurementTypeId))
                {
                    var passed = asset_DB.CheckTypeMeasurementTypeLink(typeId, measurementTypeId);

                    if (!passed)
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda, $"Invalid Measurement Type selected for the Asset Type, Asset Type {importData.AssetType} | Measurement Type {importData.MeasurementType}");
                        return 1;
                    }
                }
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public int CheckCombinationTypeCategorySubCategory<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
            AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber)
            where TField : class, IFileFields
        {
            try
            {
                if (int.TryParse(importData.AssetType, out var typeId) &&
                    int.TryParse(importData.AssetCategory, out var categoryId))
                {
                    var passed = asset_DB.CombinationCheckTypeCategorySubCategory(typeId, categoryId);

                    if (!passed)
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda,
                            $"Invalid Type/Category combination selected for the Asset Type, Asset Type {importData.AssetType} | Asset Category {importData.AssetCategory}");
                        return 1;
                    }
                }
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public int GetClassComboIDs<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
            AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber,
            string assetClass, string assetCategory, string assetSubCategory, string assetStatus, string measurementType, string assetType)
            where TField : class, IFileFields
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(assetClass))
                {
                    var record = _cache.GetAssetCombinationRecord("Const_AssetClass_sys", assetClass, assetCategory,
                        assetSubCategory, assetStatus, assetType, measurementType);

                    if (record == null || record.Value.AssetClassId == 0)
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda, $"Invalid Class combination, Asset Class: {assetClass} | Asset Category : {assetCategory} | Asset SubCategory : {assetSubCategory} | Asset Status : {assetStatus} | Asset Type : {assetType} | Measurement Type : {measurementType}");
                        return 1;
                    }

                    importData.AssetClass = record.Value.AssetClassId.ToString();
                    importData.AssetType = record.Value.AssetTypeId?.ToString();
                    importData.AssetCategory = record.Value.AssetCategoryId?.ToString();
                    importData.AssetSub_Category = record.Value.AssetSubCategoryId?.ToString();
                    importData.AssetStatus = record.Value.AssetStatusId?.ToString();
                    importData.MeasurementType = record.Value.AssetMeasurementTypeId?.ToString();
                }
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public int CheckTypeStatusLink<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
            AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber)
            where TField : class, IFileFields
        {
            try
            {
                if (int.TryParse(importData.AssetStatus, out var statusId) &&
                    int.TryParse(importData.AssetCategory, out var categoryId))
                {
                    var requiredStatus = asset_DB.CheckTypeStatus(categoryId, statusId);

                    switch (requiredStatus)
                    {
                        case enRequiresStatus.NotAllowed:
                        case enRequiresStatus.Required:
                            error.SetPropertyValue(memberLambda,
                                requiredStatus == enRequiresStatus.NotAllowed
                                    ? $"Asset Status is not allowed for Asset Type/Category, Asset Status {importData.AssetStatus} | Asset Category {importData.AssetCategory}"
                                    : $"Asset Status is required for Asset Type/Category, Asset Status {importData.AssetStatus} | Asset Category {importData.AssetCategory}");
                            error.RowNumber = rowNumber.ToString();
                            return 1;
                    }
                }
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public int ValidateRisk<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
            AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber, bool mustExist = false)
            where TField : class, IFileFields
        {
            try
            {
                var value = importData.GetPropertyValue(memberLambda)?.ToString()?.Replace(" ", string.Empty).Trim() ??
                            string.Empty;

                if (!string.IsNullOrWhiteSpace(value))
                {
                    if (!Enum.IsDefined(typeof(Constant_Dictionaries.Risk), value))
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda, $"Invalid or missing entries in column for Risk");
                        return 1;
                    }

                    Enum.TryParse(value, out Constant_Dictionaries.Risk risk);
                    importData.SetPropertyValue(memberLambda, ((int)risk).ToString());
                }
                else if (mustExist)
                {
                    error.RowNumber = rowNumber.ToString();
                    error.SetPropertyValue(memberLambda, $"Invalid or missing entries in column for Risk");
                    return 1;
                }
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public int ValidateConsequenceOfFailure<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
            AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber, bool mustExist = false)
            where TField : class, IFileFields
        {
            try
            {
                var value = importData.GetPropertyValue(memberLambda)?.ToString()?.Trim() ?? string.Empty;

                if (!string.IsNullOrEmpty(value))
                {
                    int.TryParse(importData.CriticalityGrade?.Trim() ?? string.Empty, out var criticalityGrade);

                    var passed = asset_DB.CombinationCheckConsequence(value, criticalityGrade);

                    if (!passed)
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda, $"Invalid or missing entries in column for Consequence of Failure");
                        return 1;
                    }
                }
                else if (mustExist)
                {
                    error.RowNumber = rowNumber.ToString();
                    error.SetPropertyValue(memberLambda, $"Invalid or missing entries in column for Consequence of Failure");
                    return 1;
                }
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public int ValidateWarranty<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
            AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber, bool mustExist = false)
            where TField : class, IFileFields
        {
            try
            {
                var value = importData.GetPropertyValue(memberLambda)?.ToString()?.Trim() ?? string.Empty;

                if (!string.IsNullOrWhiteSpace(value))
                {
                    if (!Enum.IsDefined(typeof(Constant_Dictionaries.Warranteed), value))
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda,
                            $"Invalid or missing entries in column for Warranty, it must be Yes or No");
                        return 1;
                    }
                }
                else if (mustExist)
                {
                    error.RowNumber = rowNumber.ToString();
                    error.SetPropertyValue(memberLambda,
                        $"Invalid or missing entries in column for Warranty, it must be Yes or No");
                    return 1;
                }
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public int ValidateInsuranceCover<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
            AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber, bool mustExist = false)
            where TField : class, IFileFields
        {
            try
            {
                var value = importData.GetPropertyValue(memberLambda)?.ToString()?.Trim() ?? string.Empty;

                if (!string.IsNullOrWhiteSpace(value))
                {
                    if (!Enum.IsDefined(typeof(Constant_Dictionaries.Insured), value))
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda,
                            $"Invalid or missing entries in column for Insurance Cover, it must be Yes or No");
                        return 1;
                    }
                }
                else if (mustExist)
                {
                    error.RowNumber = rowNumber.ToString();
                    error.SetPropertyValue(memberLambda,
                        $"Invalid or missing entries in column for Insurance Cover, it must be Yes or No");
                    return 1;
                }
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public int ValidateCashNonCashGenerating<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
            AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber, bool mustExist = false)
            where TField : class, IFileFields
        {
            try
            {
                var value = importData.GetPropertyValue(memberLambda)?.ToString()?.Trim() ?? string.Empty;

                if (!string.IsNullOrWhiteSpace(value))
                {
                    if (!Enum.IsDefined(typeof(Constant_Dictionaries.CashGenerating), value))
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda, $"Invalid or missing entries in column for Cash Generating");
                        return 1;
                    }
                }
                else if (mustExist)
                {
                    error.RowNumber = rowNumber.ToString();
                    error.SetPropertyValue(memberLambda, $"Invalid or missing entries in column for Cash Generating");
                    return 1;
                }
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public int ValidateNatureOfAddition<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
    AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber, bool mustExist = false)
    where TField : class, IFileFields
        {
            try
            {
                var value = importData.GetPropertyValue(memberLambda)?.ToString()?.Trim() ?? string.Empty;

                if (!string.IsNullOrWhiteSpace(value))
                {
                    // Get all descriptions of the enum
                    var validValues = Enum.GetValues(typeof(Constant_Dictionaries.NatureOfAddition))
                                          .Cast<Enum>()
                                          .Select(v => v.GetDescription());

                    if (!validValues.Contains(value))
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda, $"Invalid or missing entries in column for Nature of Addition");
                        return 1;
                    }
                }
                else if (mustExist)
                {
                    error.RowNumber = rowNumber.ToString();
                    error.SetPropertyValue(memberLambda, $"Invalid or missing entries in column for Nature of Addition");
                    return 1;
                }
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        


        public int ValidateInfrastructureNonInfrastructure<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
            AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber, bool mustExist = false)
            where TField : class, IFileFields
        {
            try
            {
                var value = importData.GetPropertyValue(memberLambda)?.ToString()?.Trim() ?? string.Empty;

                if (!string.IsNullOrWhiteSpace(value))
                {
                    if (!Enum.IsDefined(typeof(Constant_Dictionaries.InfrastructureNonInfrastructure), value))
                    {
                        error.RowNumber = rowNumber.ToString();
                        error.SetPropertyValue(memberLambda,
                            $"Invalid or missing entries, please indicate if the Asset is an Infrastructure/Non-Infrastructure");
                        return 1;
                    }
                }
                else if (mustExist)
                {
                    error.RowNumber = rowNumber.ToString();
                    error.SetPropertyValue(memberLambda,
                        $"Invalid or missing entries, please indicate if the Asset is an Infrastructure/Non-Infrastructure");
                    return 1;
                }
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public int ValidateBarcodeUnique<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
            AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber)
            where TField : class, IFileFields
        {
            try
            {
                var value = importData.GetPropertyValue(memberLambda)?.ToString()?.Trim() ?? string.Empty;

                if (string.IsNullOrWhiteSpace(value)) return 0;

                var barcodeExist = asset_DB.CheckBarcodeExist(value);

                if (barcodeExist)
                {
                    error.RowNumber = rowNumber.ToString();
                    error.SetPropertyValue(memberLambda, $"Barcode already exists: {value}");
                    return 1;
                }
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public int ValidateMunicipalAssetRegisterUnique(string municipalAssetRegister, int rowNumber,
            AssetTakeOnErrorClass error)
        {
            if (string.IsNullOrEmpty(municipalAssetRegister)) return 0;

            var record = _cache.GetRecord("Asset_Register_Items", municipalAssetRegister, null);

            var municipalAssetRegisterExist = record.HasValue
                ? record.Value.PrimaryKeyId > 0
                : asset_DB.CheckMuniregsiterExist(municipalAssetRegister);

            if (!municipalAssetRegisterExist) return 0;

            try
            {
                error.RowNumber = rowNumber.ToString();
                error.MunicipalAssetID = "Municipal Register ID Already Exist";
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field: MunicipalRegisterID");
            }

            return municipalAssetRegisterExist ? 1 : 0;
        }

        public int CombinationCheckCIDMSStructure<TField>(AssetUploadWorker.AssetTakeOnImportData importData,
            AssetTakeOnErrorClass error, Expression<Func<TField, string>> memberLambda, int rowNumber)
            where TField : class, IFileFields
        {
            try
            {
                var passed = asset_DB.CombinationCheckCIDMSStructure(importData, out var recordId);

                if (!passed)
                {
                    error.RowNumber = rowNumber.ToString();
                    error.SetPropertyValue(memberLambda, $"Invalid CIDMS Structure combination detected");
                    return 1;
                }

                importData.SetPropertyValue(memberLambda, recordId.ToString());
            }
            catch (Exception)
            {
                throw new Exception("Unknown Database field");
            }

            return 0;
        }

        public class AssetTakeOnErrorClass :
            IFileFields
        {
            public string UploadJobId { get; set; }
            public string FileName { get; set; }
            public string RowNumber { get; set; }
            public string Description { get; set; }
            public string ComponentID_AssetRegisterID { get; set; }
            public string AssetDescription { get; set; }
            public string ParentAssetRegisterID { get; set; }
            public string Barcode { get; set; }
            public string OldBarcode { get; set; }
            public string ImageRef { get; set; }
            public string FinancialStatus { get; set; }
            public string AssetType { get; set; }
            public string AssetCategory { get; set; }
            public string AssetSub_Category { get; set; }
            public string AssetClass { get; set; }
            public string ComponentType { get; set; }
            public string Sub_ComponentType { get; set; }
            public string MeasurementType { get; set; }
            public string AssetStatus { get; set; }
            public string AcquisitionDate { get; set; }
            public string DisposalDate { get; set; }
            public string ReasonforDisposal { get; set; }
            public string ImpairmentDate { get; set; }
            public string InServiceDate { get; set; }
            public string UsefulLifeYearComponent { get; set; }
            public string UsefulLifeMonthComponent { get; set; }
            public string RemainingUsefulLifeYearComponent { get; set; }
            public string RemainingUsefulLifeMonthComponent { get; set; }
            public string AssetCondition { get; set; }
            public string DateModified { get; set; }
            public string VerifiedDate { get; set; }
            public string VerificationDoneBy { get; set; }
            public string UOM { get; set; }
            public string Dim1 { get; set; }
            public string Dim2 { get; set; }
            public string Dim3 { get; set; }
            public string DimensionQuantity { get; set; }
            public string Quantity { get; set; }
            public string SGKey { get; set; }
            public string DeedNumber { get; set; }
            public string Erf_FarmNumber { get; set; }
            public string ErfsizeM2 { get; set; }
            public string PortionNumber { get; set; }
            public string UnitNumber { get; set; }
            public string RegistrationNumber { get; set; }
            public string CustodianName { get; set; }
            public string CustodianIDNumber { get; set; }
            public string AssetOwnershipName { get; set; }
            public string MunicipalDepartment { get; set; }
            public string Division { get; set; }
            public string Town { get; set; }
            public string StreetAddress { get; set; }
            public string Building { get; set; }
            public string Ward { get; set; }
            public string Zoning { get; set; }
            public string FloorArea { get; set; }
            public string RoomNumber { get; set; }
            public string Suburb { get; set; }
            public string GISFeautureID { get; set; }
            public string Latitude { get; set; }
            public string Longitude { get; set; }
            public string FundingSourceNumber { get; set; }
            public string FundingSourceAmount { get; set; }
            public string PurchaseAmount_Cost { get; set; }
            public string SCOAItem_PurchaseAmount_Cost { get; set; }
            public string ResidualValue { get; set; }
            public string AccumulatedDepreciation { get; set; }
            public string SCOAItem_AccumulatedDepreciation { get; set; }
            public string AccumulatedImpairment { get; set; }
            public string SCOAItem_AccumulatedImpairment { get; set; }
            public string DisposalAmountCost { get; set; }
            public string SCOAItem_DisposalAmountCost { get; set; }
            public string DisposalProceeds { get; set; }
            public string ProfitorLossonDisposal { get; set; }
            public string CarryingAmount { get; set; }
            public string DonorID_RegistrationNumber_ParastatalCode { get; set; }
            public string DonorName_CompanyName_ParastatalName { get; set; }
            public string DateDonated { get; set; }
            public string Custom1 { get; set; }
            public string Custom2 { get; set; }
            public string Custom3 { get; set; }
            public string Custom4 { get; set; }
            public string Custom5 { get; set; }
            public string Custom6 { get; set; }
            public string Custom7 { get; set; }
            public string Custom8 { get; set; }
            public string Custom9 { get; set; }
            public string Custom10 { get; set; }
            public string Custom11 { get; set; }
            public string Custom12 { get; set; }
            public string Custom13 { get; set; }
            public string Custom14 { get; set; }
            public string Custom15 { get; set; }
            public string Custom16 { get; set; }
            public string Custom17 { get; set; }
            public string Custom18 { get; set; }
            public string Custom19 { get; set; }
            public string Custom20 { get; set; }
            public string Custom21 { get; set; }
            public string Custom22 { get; set; }
            public string Custom23 { get; set; }
            public string Custom24 { get; set; }
            public string Custom25 { get; set; }
            public string Custom26 { get; set; }
            public string CIDMSSubComponentType { get; set; }
            public string CIDMSComponentType { get; set; }
            public string MunicipalAssetID { get; set; }
            public string MainAssetID { get; set; }
            public string CIDMSAccountingGroup { get; set; }
            public string CIDMSSubAccountingGroup { get; set; }
            public string CIDMSAssetClass { get; set; }
            public string CIDMSAssetGroupType { get; set; }
            public string CIDMSAssetType { get; set; }
            public string YearConstructed { get; set; }
            public string CostOfAddition { get; set; }
            public string CurrentReplacemantCostCRC { get; set; }
            public string DepreciatedReplacementCostDRC { get; set; }
            public string ForecastReplacementYear { get; set; }
            public string AnnualisedMaintenanceCRC { get; set; }
            public string AnnualMaintenanceBudgetNeed { get; set; }

            public string BasicMunicipalityService { get; set; }
            public string CriticalityGrade { get; set; }
            public string PerformanceGrade { get; set; }
            public string UtilisationGrade { get; set; }
            public string InfrastructureHealthGrade { get; set; }
            public string ConsequenceOfFailure { get; set; }
            public string Risk { get; set; }
            public string Warranty { get; set; }
            public string InsuranceCover { get; set; }
            public string CashOrNoncashgeneratingunit { get; set; }
            public string NatureOfAddition { get; set; }
            public string InfrastructurOrNonInfrastructure { get; set; }
            public string WellKnownTextWKT { get; set; }
            public string RemainingUsefulLifeAtTakeOn { get; set; }
            public string ConstructionMaterial { get; set; }
            public string Make { get; set; }
            public string Model { get; set; }
            public string SerialNumber { get; set; }
            public string InsurancePolicyNo { get; set; }
            public string CommisioningDate { get; set; }
            public string MainAssetDescription { get; set; }
            public string RevaluationDate { get; set; }
        }
    }
}