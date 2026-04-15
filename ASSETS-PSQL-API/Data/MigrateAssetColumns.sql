-- =====================================================
-- Asset_Register_Items Column Migration
-- Migrates data from incorrect columns to correct ones,
-- renames columns, adds missing columns, drops extras.
-- =====================================================

-- STEP 1: Migrate data from wrong columns into correct _ID columns (safe: skips if source column already dropped)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='AssetType') THEN
    UPDATE "Asset_Register_Items" SET "AssetType_ID" = "AssetType" WHERE "AssetType_ID" IS NULL AND "AssetType" IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='AssetCategory') THEN
    UPDATE "Asset_Register_Items" SET "AssetCategory_ID" = "AssetCategory" WHERE "AssetCategory_ID" IS NULL AND "AssetCategory" IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='AssetSub_Category') THEN
    UPDATE "Asset_Register_Items" SET "Asset_SubCategory_ID" = "AssetSub_Category" WHERE "Asset_SubCategory_ID" IS NULL AND "AssetSub_Category" IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='AssetClass') THEN
    UPDATE "Asset_Register_Items" SET "AssetClass_ID" = "AssetClass" WHERE "AssetClass_ID" IS NULL AND "AssetClass" IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='MeasurementType') THEN
    UPDATE "Asset_Register_Items" SET "MeasurementType_ID" = "MeasurementType" WHERE "MeasurementType_ID" IS NULL AND "MeasurementType" IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='AssetStatus') THEN
    UPDATE "Asset_Register_Items" SET "AssetStatus_ID" = "AssetStatus" WHERE "AssetStatus_ID" IS NULL AND "AssetStatus" IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='RemainingUsefulLifeMonthComponent') THEN
    UPDATE "Asset_Register_Items" SET "RemainingUsefulLife" = "RemainingUsefulLifeMonthComponent" WHERE "RemainingUsefulLife" IS NULL AND "RemainingUsefulLifeMonthComponent" IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='AccumulatedDepreciation') THEN
    UPDATE "Asset_Register_Items" SET "AccumulatedDepreciationClosingBalance" = "AccumulatedDepreciation" WHERE "AccumulatedDepreciationClosingBalance" IS NULL AND "AccumulatedDepreciation" IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='AccumulatedImpairment') THEN
    UPDATE "Asset_Register_Items" SET "AccumulatedImpairmentClosingBalance" = "AccumulatedImpairment" WHERE "AccumulatedImpairmentClosingBalance" IS NULL AND "AccumulatedImpairment" IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='CarryingAmount') THEN
    UPDATE "Asset_Register_Items" SET "CarryingAmountClosingBalance" = "CarryingAmount" WHERE "CarryingAmountClosingBalance" IS NULL AND "CarryingAmount" IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='CurrentReplacemantCostCRC') THEN
    UPDATE "Asset_Register_Items" SET "CurrentReplacementCostCRC" = "CurrentReplacemantCostCRC" WHERE "CurrentReplacementCostCRC" IS NULL AND "CurrentReplacemantCostCRC" IS NOT NULL;
  END IF;
END $$;

-- Migrate ImpairmentDate → Impairment_Date
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='ImpairmentDate') THEN
    UPDATE "Asset_Register_Items" SET "Impairment_Date" = "ImpairmentDate" WHERE "Impairment_Date" IS NULL AND "ImpairmentDate" IS NOT NULL;
  END IF;
END $$;

-- STEP 2: Rename columns to match spec (safe: skips if source column already renamed)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='AssetDescription') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "AssetDescription" TO "Description";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='ParentAssetRegisterID') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "ParentAssetRegisterID" TO "ParentAssetRegisterItem_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='PurchaseAmount_Cost') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "PurchaseAmount_Cost" TO "PurchaseAmount";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='DisposalDate') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "DisposalDate" TO "DateOfDisposal";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='VerifiedDate') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "VerifiedDate" TO "VerificationDate";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='OldBarcode') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "OldBarcode" TO "OldBarCode";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='InServiceDate') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "InServiceDate" TO "InserviceDate";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='CapturerID') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "CapturerID" TO "Capturer_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='CustodianIDNumber') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "CustodianIDNumber" TO "CustodianIdNumber";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='Erf_FarmNumber') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "Erf_FarmNumber" TO "ErfNumber";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='ErfsizeM2') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "ErfsizeM2" TO "ErfSizeM2";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='Lattitude') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "Lattitude" TO "latitude";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='Longitude') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "Longitude" TO "longitude";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='CIDMSSubComponentType') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "CIDMSSubComponentType" TO "CIDMSSubComponentTypeID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='Run_Id') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "Run_Id" TO "Run_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='RemainingUsefulLifeYearComponent') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "RemainingUsefulLifeYearComponent" TO "Remaining_Useful_Life_Year";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='CustodianName') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "CustodianName" TO "Custodian_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='AssetCondition') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "AssetCondition" TO "AssetCondition_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='FinancialStatus') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "FinancialStatus" TO "Financial_Status_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items' AND column_name='MunicipalDepartment') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "MunicipalDepartment" TO "MunicipalDepartment_ID";
  END IF;
END $$;

-- STEP 3: Add missing columns from spec
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Department" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ScoaVote" VARCHAR(50);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Donated_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "MarketValue" DECIMAL(18,2);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ReadyForUse" TIMESTAMP;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Modifier_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "GRN_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "AssetOwnership_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "GIS_ID" VARCHAR(50);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "GisFeature" VARCHAR(50);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "GIS_URL" VARCHAR(500);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "GPSCoordinates" VARCHAR(50);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Town_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "SiteNumber" VARCHAR(50);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Street_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "StreetAddress" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Building_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Ward_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Room_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "SGNumberChange_ID" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Zoning_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Prod_Key_ID" BIGINT;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Year" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "RoomNumber" VARCHAR(50);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "QuantityCaption" VARCHAR(50);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ScoaFunction_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ScoaProject_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ScoaFunds_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ScoaRegion_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Image" BYTEA;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "OriginalCostClosingBalance" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "IsAwaitingApproval" SMALLINT;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "CommodityType_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "CostFormula_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "TakeOnType_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "SubIdentification" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "DateOfTakeOnBalancesImported" TIMESTAMP;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "SCOARepairsAndMaintenance" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Decommissioning" SMALLINT;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "RestorationAndSimilarLiabilitiesAmount" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "AccumulatedDepreciationOtherChanges" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "AccumulatedDepreciationCurrentYear" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "AccumulatedDepreciationDisposal" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "AccumulatedDepreciationTransfer" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "OrderNumber" TEXT;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "InvoiceDate" TIMESTAMP;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "SupplierName" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "SupplierCode" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "InvoiceNumber" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "EFTReferenceNumber" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ContributedAssets" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ReplacementOrNew" VARCHAR(50);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ConditionCheckDate" TIMESTAMP;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ConditionAssessmentDoneBy" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "CorrectionOfErrorAmount" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ChangeInAccountingPolicyAmount" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ResidualValueAmountChangeInAccountingEstimate" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ReversalImpairmentInFull" SMALLINT;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ReversalImpairmentIfNotInFullAmountToBeReversed" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ReasonForImpairment" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ReversalOfImpairmentAmount" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ImpairmentsReferenceToCouncilResolution" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "RevaluationDoneBy" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "LastRevaluationDate" TIMESTAMP;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "RevaluationValue" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "NetGainsLossesFromFairAmountAdjustments" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "PerformedBy" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "MultiOrSingleYear" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "WorkInProgressAmount" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "CrossReferenceOfUnbundledProject" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ProjectUnbundledAmount" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "MethodOfTransferTo" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "TransferToAssetType" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "TransferToGRAPAndAFSCLASS" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "TransferToCostCentre" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "DateOfTransfer" TIMESTAMP;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ReplacedAssetsReferenceNumber" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "TransferTo" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "TransferFrom" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "MethodOfDisposal" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "DisposalProceeds" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "DisposalAmountCost" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "DisposalImpairmentAmount" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ProfitOrLossOnDisposal" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "InsuredAmountInsuredBy" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "InsuranceNumberReference" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "WarrenteesReference" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Verified" SMALLINT;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "NERSA_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "PurchaseAmount" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Suburb" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "MeasurementModel_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "AssetCalculationType_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Scoa_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "RevaluationModel_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Asset_SubCategory_Group_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Asset_SubCategory_Group_Type_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Asset_Component_Type_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "WIP_Opening_Balance" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "WIP_Closing_Balance" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "WIP_Current_Year" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Cash_Generating_Asset_Indicator" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Recoverable_Amount" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Replacement_Value" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Donor_ID" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Donor_Name" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Date_Donated" TIMESTAMP;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Scoa_Cost_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Comments" VARCHAR(500);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Scoa_Acquistion_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Scoa_Contributing_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "AssetFlags_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "RevisedResidualValue" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "AdditionalCost" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "RevisedUsefulLife" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ExpectedDepreciationRate" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "AmortisationValue" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ExpectedAmortisationRate" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "EvidenceDocument" BYTEA;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ActualUnitProducedThisYear" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ExpectedUnitsOfProduction" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Supplier_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "DisposalReason" VARCHAR(250);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "RemainingPeriod" SMALLINT;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Leased" SMALLINT;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Cost_Centre" TEXT;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Cost_Centre_Code" TEXT;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Upload_Type" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Approval_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "AssetLevel" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "RejectReason" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "InventoryID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "TempStatusID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "PreviousCondition" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ConditionChangeLevel" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "OldScoaProject_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "OldScoa_Cost_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "OldScoaFunction_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "OldScoaFunds_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "OldScoaRegion_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "OldScoa_Acquistion_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "OldScoa_Contributing_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Takon_ItemID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "TransactionProjectDR" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "TransactionProjectItemDR" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "TransactionProjectCR" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "TransactionProjectItemCR" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "InsuredBy" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Validated" SMALLINT;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "AccumulatedDepreciationVoteAcc" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "AccumulatedImpairmentVoteAcc" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "FairvalueVoteAcc" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "RevaluationVoteAcc" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "DecommissioningVoteAcc" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "FloorID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "InsureanceDocument" VARCHAR(255);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "SuburbID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ReasonForChange" VARCHAR(500);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "TypeID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Sub_Component_Type_ID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Floor_Area" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_1" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_2" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_3" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_4" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_5" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_6" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_7" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_8" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_9" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_10" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_11" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_12" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_13" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_14" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_15" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_16" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_17" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_18" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_19" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_20" VARCHAR(50);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_21" VARCHAR(50);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_22" VARCHAR(50);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_23" VARCHAR(50);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_24" VARCHAR(50);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_25" VARCHAR(50);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Custom_26" VARCHAR(50);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Component_ID" VARCHAR(255);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "DonorRegNumber" VARCHAR(50);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "DonationDocument" VARCHAR(255);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "PreviousForecastReplacementYear" DATE;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "WellKnownTextWKT" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "VerifyID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Insured" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "InsuranceAmount" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ContractHeader_Id" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "SundryPaymentId" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ManagedFlag" SMALLINT NOT NULL DEFAULT 1;
UPDATE "Asset_Register_Items" SET "ManagedFlag" = 1 WHERE "ManagedFlag" = 0;
UPDATE "Asset_Register_Items" SET "DateOfTakeOnBalancesImported" = NOW() WHERE "DateOfTakeOnBalancesImported" IS NULL;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "IssueID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "HighValueID" INTEGER;
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "RevaluationImpairmentOpeningBalance" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "TransferFromAmount" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "TransferToAmount" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Refurb_DT" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Refurb_CT" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Refurb_Depreciation" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "Refurb_Revaluation" DECIMAL(18,8);

-- Migrate PurchaseAmount data (column was renamed, but spec also has PurchaseAmount)
-- If PurchaseAmount is NULL after rename, the old PurchaseAmount_Cost data is now in PurchaseAmount via rename
-- But spec has both: the renamed column IS PurchaseAmount now

-- STEP 4: Drop columns not in spec
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "AssetType";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "AssetCategory";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "AssetSub_Category";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "AssetClass";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "ComponentType";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Sub_ComponentType";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "MeasurementType";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "AssetStatus";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "ComponentID_AssetRegisterID";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "RemainingUsefulLifeMonthComponent";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "AccumulatedDepreciation";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "AccumulatedImpairment";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "CarryingAmount";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "CurrentReplacemantCostCRC";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "ImpairmentDate";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "ReasonforDisposal";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "PurchaseAmountFinanceCharges";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "PurchaseAmountMovement";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "AccumulatedDepreciationMovement";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "AccumulatedImpairmentMovement";
ALTER TABLE "Asset_Register_Items_Upload" DROP COLUMN IF EXISTS "AccumulatedDepreciationMovement";
ALTER TABLE "Asset_Register_Items_Upload" DROP COLUMN IF EXISTS "AccumulatedImpairmentMovement";
ALTER TABLE "Asset_Register_Transactions" DROP COLUMN IF EXISTS "AccumulatedDepreciationMovement";
ALTER TABLE "Asset_Register_Transactions" DROP COLUMN IF EXISTS "AccumulatedImpairmentMovement";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "DepreciationPerMonth";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "FairValue";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "DisposalCarryingAmount";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "DisposalSalePrice";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "DisposalProfitLoss";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "DonorName";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "DonorDate";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "DonorConditions";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom1";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom2";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom3";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom4";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom5";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom6";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom7";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom8";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom9";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Division";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Town";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Street";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "StandNumber";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Building";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Floor";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Room";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Zone";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Ward";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Region";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "GISFeatureID";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "SGKey";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "TransferDate";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "TransferFromMunicipality";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "TransferToMunicipality";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "TransferNatureOfTransfer";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "TransferReasonOfTransfer";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "Enabled";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "FinYear";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "RevaluationOpeningBalance2";
ALTER TABLE "Asset_Register_Items" DROP COLUMN IF EXISTS "FundingSource";

-- STEP 5: Fix indexes to use new column names
DROP INDEX IF EXISTS idx_asset_register_type;
DROP INDEX IF EXISTS idx_asset_register_category;
DROP INDEX IF EXISTS idx_asset_register_runid;
DROP INDEX IF EXISTS idx_asset_register_finyear;
CREATE INDEX IF NOT EXISTS idx_asset_register_type ON "Asset_Register_Items"("AssetType_ID");
CREATE INDEX IF NOT EXISTS idx_asset_register_category ON "Asset_Register_Items"("AssetCategory_ID");
CREATE INDEX IF NOT EXISTS idx_asset_register_runid ON "Asset_Register_Items"("Run_ID");
CREATE INDEX IF NOT EXISTS idx_asset_register_barcode ON "Asset_Register_Items"("Barcode");

-- STEP 6: Ensure numeric precision matches spec
ALTER TABLE "Asset_Register_Items" ALTER COLUMN "UsefulLifeYearComponent" TYPE NUMERIC(18,8);
ALTER TABLE "Asset_Register_Items" ALTER COLUMN "UsefulLifeMonthComponent" TYPE NUMERIC(18,8);
ALTER TABLE "Asset_Register_Items" ALTER COLUMN "RemainingUsefulLife" TYPE NUMERIC(18,8);
ALTER TABLE "Asset_Register_Items" ALTER COLUMN "Remaining_Useful_Life_Year" TYPE NUMERIC(18,8);
ALTER TABLE "Asset_Register_Items" ALTER COLUMN "RemainingUsefulLifeAtTakeOn" TYPE NUMERIC(18,8);
ALTER TABLE "Asset_Register_Items" ALTER COLUMN "CurrentAmount" TYPE NUMERIC(18,8);
ALTER TABLE "Asset_Register_Items" ALTER COLUMN "ResidualValue" TYPE NUMERIC(18,8);

-- STEP 7: Migrate Asset_Register_Items_Upload columns to match new naming
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='Run_Id') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "Run_Id" TO "Run_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='AssetDescription') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "AssetDescription" TO "Description";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='ParentAssetRegisterID') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "ParentAssetRegisterID" TO "ParentAssetRegisterItem_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='FinancialStatus') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "FinancialStatus" TO "Financial_Status_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='AssetType') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "AssetType" TO "AssetType_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='AssetCategory') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "AssetCategory" TO "AssetCategory_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='AssetSub_Category') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "AssetSub_Category" TO "Asset_SubCategory_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='AssetClass') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "AssetClass" TO "AssetClass_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='MeasurementType') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "MeasurementType" TO "MeasurementType_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='AssetStatus') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "AssetStatus" TO "AssetStatus_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='InServiceDate') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "InServiceDate" TO "InserviceDate";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='RemainingUsefulLifeYearComponent') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "RemainingUsefulLifeYearComponent" TO "Remaining_Useful_Life_Year";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='RemainingUsefulLifeMonthComponent') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "RemainingUsefulLifeMonthComponent" TO "RemainingUsefulLife";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='AssetCondition') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "AssetCondition" TO "AssetCondition_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='Erf_FarmNumber') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "Erf_FarmNumber" TO "ErfNumber";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='ErfsizeM2') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "ErfsizeM2" TO "ErfSizeM2";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='CustodianName') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "CustodianName" TO "Custodian_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='CustodianIDNumber') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "CustodianIDNumber" TO "CustodianIdNumber";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='MunicipalDepartment') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "MunicipalDepartment" TO "MunicipalDepartment_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='Lattitude') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "Lattitude" TO "latitude";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='PurchaseAmount_Cost') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "PurchaseAmount_Cost" TO "PurchaseAmount";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='AccumulatedDepreciation') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "AccumulatedDepreciation" TO "AccumulatedDepreciationClosingBalance";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='AccumulatedImpairment') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "AccumulatedImpairment" TO "AccumulatedImpairmentClosingBalance";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='CarryingAmount') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "CarryingAmount" TO "CarryingAmountClosingBalance";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='OldBarcode') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "OldBarcode" TO "OldBarCode";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='CIDMSSubComponentType') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "CIDMSSubComponentType" TO "CIDMSSubComponentTypeID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='VerifiedDate') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "VerifiedDate" TO "VerificationDate";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='DisposalDate') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "DisposalDate" TO "DateOfDisposal";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='ImpairmentDate') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "ImpairmentDate" TO "Impairment_Date";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='CapturerID') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "CapturerID" TO "Capturer_ID";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_Register_Items_Upload' AND column_name='Longitude') THEN
    ALTER TABLE "Asset_Register_Items_Upload" RENAME COLUMN "Longitude" TO "longitude";
  END IF;
END $$;

ALTER TABLE "Asset_Register_Items_Upload" ADD COLUMN IF NOT EXISTS "RevaluationValue" DECIMAL(18,2);
ALTER TABLE "Asset_Register_Items_Upload" ADD COLUMN IF NOT EXISTS "TransferFromAmount" DECIMAL(18,2);
ALTER TABLE "Asset_Register_Items_Upload" ADD COLUMN IF NOT EXISTS "TransferToAmount" DECIMAL(18,2);
ALTER TABLE "Asset_Register_Items_Upload" ADD COLUMN IF NOT EXISTS "RevaluationImpairmentOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Register_Items_Upload" ADD COLUMN IF NOT EXISTS "RevaluationClosingBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Register_Items_Upload" ADD COLUMN IF NOT EXISTS "DebitPlanProjectItemID" INTEGER;

DROP INDEX IF EXISTS idx_upload_items_runid;
CREATE INDEX IF NOT EXISTS idx_upload_items_runid ON "Asset_Register_Items_Upload"("Run_ID");

-- Fix WIP transfer ART records: PurchaseAmount should be 0 (TransferToValue/TransferFromValue captures the value)
UPDATE "Asset_Register_Transactions"
SET "PurchaseAmount" = 0
WHERE "TransactionTypeID" IN (
    SELECT "ReferenceData_ID" FROM "Const_ReferenceData_sys"
    WHERE "Description" IN ('Asset Transfer', 'Transfer')
)
AND "PurchaseAmount" <> 0
AND (COALESCE("TransferFromValue", 0) <> 0 OR COALESCE("TransferToValue", 0) <> 0);

-- Asset edit form new fields (2026-03)
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "InvoiceNo" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "DisposalDocNo" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "PaymentNo" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "FundingDescription" VARCHAR(200);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "LocationDescription" VARCHAR(500);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "RoomResponsiblePerson" VARCHAR(100);
ALTER TABLE "Asset_Register_Items" ADD COLUMN IF NOT EXISTS "ITHardwareResponsiblePerson" VARCHAR(100);
