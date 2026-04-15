using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Diagnostics;
using Serilog;

namespace Sebata.AssetBulkUploadService
{
    class ValidationFactory
    {
        private Asset_DB asset_DB;
        private string connection;

        private string missingColumnMessage = "Column Heading Missing";


        private bool LogEvents;
        private ILogger _logger;

        DataColumnCollection Columns = null;

        public ValidationFactory(string _connection)
        {
            asset_DB = new Asset_DB(_connection);
            connection = _connection;
        }

        private List<Validations.AssetTakeOnErrorClass> CheckData(List<AssetUploadWorker.AssetTakeOnImportData> records,
            int jobId, int validateType)
        {
            if (LogEvents)
                _logger.Information($"Checking Data For File Started...");
            
            var sw = new Stopwatch();
            sw.Start();
            
            var errors = new List<Validations.AssetTakeOnErrorClass>();
            var rowCount = records.Count;

            try
            {
                var cache = new FlyweightFactory(connection);
                var validations = new Validations(connection, cache, _logger);
                var customFieldList = asset_DB.GetCustomFieldList();
                
                foreach (var importData in records.OrderBy(x => x.RowNumber))
                {
                    var rowNumber = importData.RowNumber;
                    
                    var errorCount = 0;
                    var error = new Validations.AssetTakeOnErrorClass();

                    var percentageDone = Convert.ToInt32(Convert.ToDecimal((rowNumber - 1)) / rowCount * 100);
                    if (percentageDone % 10 == 0)
                        asset_DB.Update_JobStatus_Core(jobId, $"Validating : {percentageDone} %",null);
                    
                    errorCount += validations.ValidateMunicipalAssetRegisterUnique(importData.MunicipalAssetID, rowNumber, error);
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.MainAssetID, rowNumber);
                    errorCount += validations.CombinationCheckCIDMSStructure<IFileFields>(importData, error, x => x.CIDMSSubComponentType, rowNumber);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.CIDMSAccountingGroup, rowNumber, true);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.CIDMSSubAccountingGroup, rowNumber, true);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.CIDMSAssetClass, rowNumber, true);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.CIDMSAssetGroupType, rowNumber, true);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.CIDMSAssetType, rowNumber, true);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.CIDMSComponentType, rowNumber);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.BasicMunicipalityService, rowNumber);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.CriticalityGrade, rowNumber);
                    errorCount += validations.ValidateConsequenceOfFailure<IFileFields>(importData, error, x => x.ConsequenceOfFailure, rowNumber);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.PerformanceGrade, rowNumber);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.UtilisationGrade, rowNumber);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.InfrastructureHealthGrade, rowNumber);
                    errorCount += validations.CheckDateFromYear<IFileFields>(importData, error, x => x.YearConstructed, rowNumber);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.CostOfAddition, rowNumber);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.CurrentReplacemantCostCRC, rowNumber);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.DepreciatedReplacementCostDRC, rowNumber);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.ForecastReplacementYear, rowNumber);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.AnnualisedMaintenanceCRC, rowNumber);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.AnnualMaintenanceBudgetNeed, rowNumber);
                    errorCount += validations.ValidateRisk<IFileFields>(importData, error, x => x.Risk, rowNumber);
                    errorCount += validations.ValidateWarranty<IFileFields>(importData, error, x => x.Warranty, rowNumber, true);
                    errorCount += validations.ValidateInsuranceCover<IFileFields>(importData, error, x => x.InsuranceCover, rowNumber, true);
                    var isInsuranceCoverRequired = importData.InsuranceCover == "Yes";
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.InsurancePolicyNo, rowNumber, isInsuranceCoverRequired);
                    errorCount += validations.ValidateCashNonCashGenerating<IFileFields>(importData, error, x => x.CashOrNoncashgeneratingunit, rowNumber, true);
                    errorCount += validations.ValidateNatureOfAddition<IFileFields>(importData, error, x => x.NatureOfAddition, rowNumber, true);
                    errorCount += validations.ValidateInfrastructureNonInfrastructure<IFileFields>(importData, error, x => x.InfrastructurOrNonInfrastructure, rowNumber, true);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.ComponentID_AssetRegisterID, rowNumber, true, true);
                    var mustExist = validateType == 1 || validateType == 3 || validateType == 5;
                    var mustExistFull = mustExist || validateType == 2;
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.AssetDescription, rowNumber, mustExistFull);
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.ParentAssetRegisterID, rowNumber);
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.Barcode, rowNumber);
                    errorCount += validations.ValidateBarcodeUnique<IFileFields>(importData, error, x => x.Barcode, rowNumber);
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.OldBarcode, rowNumber);
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.ImageRef, rowNumber);
                    var isDisposalDateRequired = importData.FinancialStatus?.Trim() == "Disposed Asset" ||
                                                 importData.FinancialStatus?.Trim() == "Write Off";
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.FinancialStatus, rowNumber, true);
                    var assetType = importData.AssetType;
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.AssetType, rowNumber, true);
                    var assetCategory = importData.AssetCategory;
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.AssetCategory, rowNumber);
                    var assetSubCategory = importData.AssetSub_Category;
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.AssetSub_Category, rowNumber);
                    var assetClass = importData.AssetClass;
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.AssetClass, rowNumber, true);
                    var measurementType = importData.MeasurementType;
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.MeasurementType, rowNumber);
                    var assetStatus = importData.AssetStatus;
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.AssetStatus, rowNumber);
                    errorCount += validations.GetClassComboIDs<IFileFields>(importData, error, x => x.AssetClass, rowNumber, assetClass, assetCategory, assetSubCategory, assetStatus, measurementType, assetType);
                    errorCount += validations.CheckTypeStatusLink<IFileFields>(importData, error, x => x.AssetStatus, rowNumber);
                    errorCount += validations.CheckTypeMeasurementTypeLink<IFileFields>(importData, error, x => x.MeasurementType, rowNumber);
                    errorCount += validations.CheckCombinationTypeCategorySubCategory<IFileFields>(importData, error, x => x.AssetCategory, rowNumber);
                    
                    errorCount += validations.CheckDate<IFileFields>(importData, error, x => x.AcquisitionDate, rowNumber);
                    errorCount += validations.CheckDate<IFileFields>(importData, error, x => x.DisposalDate, rowNumber, isDisposalDateRequired);
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.ReasonforDisposal, rowNumber);
                    errorCount += validations.CheckDate<IFileFields>(importData, error, x => x.ImpairmentDate, rowNumber);
                    errorCount += validations.CheckDate<IFileFields>(importData, error, x => x.InServiceDate, rowNumber, true);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.UsefulLifeYearComponent, rowNumber, mustExist);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.UsefulLifeMonthComponent, rowNumber, mustExist);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.RemainingUsefulLifeYearComponent, rowNumber, mustExist);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.RemainingUsefulLifeMonthComponent, rowNumber, mustExist);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.AssetCondition, rowNumber, true);
                    errorCount += validations.CheckDate<IFileFields>(importData, error, x => x.DateModified, rowNumber);
                    errorCount += validations.CheckDate<IFileFields>(importData, error, x => x.VerifiedDate, rowNumber);
                    var isVerifiedRequired = !string.IsNullOrWhiteSpace(importData.VerifiedDate) &&
                                             importData.VerifiedDate != "NULL";
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.VerificationDoneBy, rowNumber, isVerifiedRequired);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.UOM, rowNumber, true);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.Dim1, rowNumber);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.Dim2, rowNumber);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.Dim3, rowNumber);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.DimensionQuantity, rowNumber);
                    errorCount += validations.CheckNumberNotZero<IFileFields>(importData, error, x => x.Quantity, rowNumber, true);
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.SGKey, rowNumber);
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.DeedNumber, rowNumber);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.Erf_FarmNumber, rowNumber, checkInteger: true);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.ErfsizeM2, rowNumber);
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.PortionNumber, rowNumber);
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.UnitNumber, rowNumber);
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.RegistrationNumber, rowNumber);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.CustodianName, rowNumber, mustExist);
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.CustodianIDNumber, rowNumber, true);
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.AssetOwnershipName, rowNumber);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.MunicipalDepartment, rowNumber, mustExistFull);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.Division, rowNumber, true);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.Town, rowNumber, true);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.StreetAddress, rowNumber);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.Building, rowNumber);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.Ward, rowNumber);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.Zoning, rowNumber);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.FloorArea, rowNumber);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.RoomNumber, rowNumber);
                    errorCount += validations.CheckDescriptionForID<IFileFields>(importData, error, x => x.Suburb, rowNumber);
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.GISFeautureID, rowNumber);
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.Latitude, rowNumber, false, true);
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.Longitude, rowNumber, false, true);
                    
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.FundingSourceNumber, rowNumber, true, true);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.FundingSourceAmount, rowNumber, true);

                    errorCount += validations.CheckNumberNotZero<IFileFields>(importData, error, x => x.PurchaseAmount_Cost, rowNumber, mustExist);
                    errorCount += validations.CheckSCOA<IFileFields>(importData, error, x => x.SCOAItem_PurchaseAmount_Cost, rowNumber);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.ResidualValue, rowNumber);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.AccumulatedDepreciation, rowNumber);
                    errorCount += validations.CheckSCOA<IFileFields>(importData, error, x => x.SCOAItem_AccumulatedDepreciation, rowNumber);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.AccumulatedImpairment, rowNumber);
                    errorCount += validations.CheckSCOA<IFileFields>(importData, error, x => x.SCOAItem_AccumulatedImpairment, rowNumber);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.DisposalAmountCost, rowNumber);
                    errorCount += validations.CheckSCOA<IFileFields>(importData, error, x => x.SCOAItem_DisposalAmountCost, rowNumber);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.DisposalProceeds, rowNumber);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.ProfitorLossonDisposal, rowNumber);
                    errorCount += validations.CheckNumber<IFileFields>(importData, error, x => x.CarryingAmount, rowNumber, mustExist);
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.DonorID_RegistrationNumber_ParastatalCode, rowNumber);
                    errorCount += validations.CheckString<IFileFields>(importData, error, x => x.DonorName_CompanyName_ParastatalName, rowNumber, validateType == 3);
                    errorCount += validations.CheckDate<IFileFields>(importData, error, x => x.DateDonated, rowNumber, validateType == 3);
                    errorCount += validations.CheckDate<IFileFields>(importData, error, x => x.RevaluationDate, rowNumber);

                    #region Custom Fields
                    foreach (var customField in customFieldList)
                    {
                        errorCount += customField switch
                        {
                            1 => validations.CheckString<IFileFields>(importData, error, x => x.Custom1, rowNumber),
                            2 => validations.CheckString<IFileFields>(importData, error, x => x.Custom2, rowNumber),
                            3 => validations.CheckString<IFileFields>(importData, error, x => x.Custom3, rowNumber),
                            4 => validations.CheckString<IFileFields>(importData, error, x => x.Custom4, rowNumber),
                            5 => validations.CheckString<IFileFields>(importData, error, x => x.Custom5, rowNumber),
                            6 => validations.CheckString<IFileFields>(importData, error, x => x.Custom6, rowNumber),
                            7 => validations.CheckString<IFileFields>(importData, error, x => x.Custom7, rowNumber),
                            8 => validations.CheckString<IFileFields>(importData, error, x => x.Custom8, rowNumber),
                            9 => validations.CheckString<IFileFields>(importData, error, x => x.Custom9, rowNumber),
                            _ => 0
                        };
                    }
                    #endregion Custom Fields
                    
                    if (errorCount > 0)
                        errors.Add(error);
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                throw;
            }

            sw.Stop();
            Debug.WriteLine($"Method: {nameof(CheckData)} Time taken: {sw.Elapsed:m\\:ss\\.fff}");
            
            if (LogEvents)
                _logger.Information($"Checking Data For File Done... Time Taken: {sw.Elapsed:m\\:ss\\.fff}");
            
            return errors;
        }

        public List<Validations.AssetTakeOnErrorClass> CompareDataRules(List<AssetUploadWorker.AssetTakeOnImportData> records,
            int isDonated, int jobId, Components.ISettings settings, bool logging, ILogger logger)
        {
            LogEvents = logging;
            _logger = logger;
            var errors = new List<Validations.AssetTakeOnErrorClass>();
            
            try
            {
                errors = CheckData(records, jobId, isDonated);
            }
            catch (Exception ex)
            {
                if (LogEvents)
                {
                    _logger.Information($"Exception : Method - CompareDataRules() [{ex}]", jobId, settings);
                }
            }

            return errors;
        }
    }
}

