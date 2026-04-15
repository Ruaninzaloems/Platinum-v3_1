-- SQL Server compatibility shims for PostgreSQL
CREATE OR REPLACE FUNCTION GETDATE() RETURNS TIMESTAMP AS $$ SELECT NOW()::TIMESTAMP; $$ LANGUAGE SQL STABLE;
CREATE OR REPLACE FUNCTION YEAR(d TIMESTAMP) RETURNS INT AS $$ SELECT EXTRACT(YEAR FROM d)::INT; $$ LANGUAGE SQL IMMUTABLE;
CREATE OR REPLACE FUNCTION MONTH(d TIMESTAMP) RETURNS INT AS $$ SELECT EXTRACT(MONTH FROM d)::INT; $$ LANGUAGE SQL IMMUTABLE;
CREATE OR REPLACE FUNCTION DAY(d TIMESTAMP) RETURNS INT AS $$ SELECT EXTRACT(DAY FROM d)::INT; $$ LANGUAGE SQL IMMUTABLE;
CREATE OR REPLACE FUNCTION YEAR(d TIMESTAMPTZ) RETURNS INT AS $$ SELECT EXTRACT(YEAR FROM d)::INT; $$ LANGUAGE SQL IMMUTABLE;
CREATE OR REPLACE FUNCTION MONTH(d TIMESTAMPTZ) RETURNS INT AS $$ SELECT EXTRACT(MONTH FROM d)::INT; $$ LANGUAGE SQL IMMUTABLE;
CREATE OR REPLACE FUNCTION DAY(d TIMESTAMPTZ) RETURNS INT AS $$ SELECT EXTRACT(DAY FROM d)::INT; $$ LANGUAGE SQL IMMUTABLE;
CREATE OR REPLACE FUNCTION YEAR(d DATE) RETURNS INT AS $$ SELECT EXTRACT(YEAR FROM d)::INT; $$ LANGUAGE SQL IMMUTABLE;
CREATE OR REPLACE FUNCTION MONTH(d DATE) RETURNS INT AS $$ SELECT EXTRACT(MONTH FROM d)::INT; $$ LANGUAGE SQL IMMUTABLE;
CREATE OR REPLACE FUNCTION DAY(d DATE) RETURNS INT AS $$ SELECT EXTRACT(DAY FROM d)::INT; $$ LANGUAGE SQL IMMUTABLE;

CREATE TABLE IF NOT EXISTS "Const_AssetType_Sys" (
    "AssetType_ID" SERIAL PRIMARY KEY,
    "AssetTypeDesc" VARCHAR(200),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "Default" SMALLINT DEFAULT 1,
    "RequireStatus" SMALLINT DEFAULT 0,
    "NoUsefuleLife" SMALLINT
);

CREATE TABLE IF NOT EXISTS "Const_AssetStatus_Sys" (
    "AssetStatus_ID" SERIAL PRIMARY KEY,
    "AssetStatusDesc" VARCHAR(200),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "Default" SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "Const_AssetDepreciationMethod_Sys" (
    "AssetDepreciationMethod_ID" SERIAL PRIMARY KEY,
    "AssetDepreciationMethodDesc" VARCHAR(200),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "AssetConfig_MeasurementType" (
    "AssetConfig_MeasurementType_ID" SERIAL PRIMARY KEY,
    "Name" VARCHAR(200),
    "Default" SMALLINT DEFAULT 1,
    "Enabled" SMALLINT DEFAULT 1,
    "CreatedByID" INTEGER DEFAULT 1,
    "CreatedDate" TIMESTAMP DEFAULT NOW(),
    "ModifiedByID" INTEGER,
    "ModiefiedDate" TIMESTAMP,
    "NoDepreciation" SMALLINT
);

CREATE TABLE IF NOT EXISTS "Const_AssetCategory_sys" (
    "AssetCategoryID" SERIAL PRIMARY KEY,
    "AssetCategoryDesc" VARCHAR(200),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "RevaluationByCostModel" SMALLINT DEFAULT 0,
    "RevaluationByRevalutionModel" SMALLINT DEFAULT 0,
    "Default" SMALLINT DEFAULT 1,
    "TypeID" INTEGER REFERENCES "Const_AssetType_Sys"("AssetType_ID"),
    "RequireStatus" SMALLINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "Const_Asset_SubCategory" (
    "Asset_SubCategory_ID" SERIAL PRIMARY KEY,
    "Asset_SubCategoryDescription" VARCHAR(500),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "Capturer_ID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "Modifier_ID" INTEGER,
    "AssetCategoryID" INTEGER REFERENCES "Const_AssetCategory_sys"("AssetCategoryID"),
    "TypeID" INTEGER REFERENCES "Const_AssetType_Sys"("AssetType_ID"),
    "Default" SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "Const_AssetClass_sys" (
    "AssetClass_ID" SERIAL PRIMARY KEY,
    "AssetClassDesc" VARCHAR(500),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "Asset_SubCategory_ID" INTEGER,
    "UsefulLifeInMonths" INTEGER DEFAULT 0,
    "AssetDepreciationMethod_ID" INTEGER,
    "RevaluationByCostModel" SMALLINT,
    "RevaluationByRevalutionModel" SMALLINT,
    "TypeID" INTEGER,
    "Default" SMALLINT,
    "AssetCategoryID" INTEGER,
    "AssetStatus_ID" INTEGER,
    "AssetMeasurement_ID" INTEGER
);

CREATE TABLE IF NOT EXISTS "AssetConfig_FinancialStatus" (
    "FinStatusID" SERIAL PRIMARY KEY,
    "FinancialStatusDesc" VARCHAR(50) NOT NULL,
    "Default" SMALLINT,
    "Enabled" SMALLINT DEFAULT 1,
    "CreatedByID" INTEGER,
    "CreatedDate" TIMESTAMP,
    "ModifiedByID" INTEGER,
    "ModiefiedDate" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AssetConfig_TransactionType" (
    "AssetConfig_TransactionType_ID" SERIAL PRIMARY KEY,
    "Name" VARCHAR(50) NOT NULL,
    "Default" SMALLINT,
    "Enabled" SMALLINT,
    "SubType1" VARCHAR(50),
    "DRDisplayName11" VARCHAR(100),
    "DRDisplayName12" VARCHAR(100),
    "DRDisplayName13" VARCHAR(100),
    "DRDisplayName14" VARCHAR(100),
    "CRDisplayName11" VARCHAR(100),
    "SubType2" VARCHAR(50),
    "DRDisplayName21" VARCHAR(100),
    "DRDisplayName22" VARCHAR(100),
    "DRDisplayName23" VARCHAR(100),
    "CRDisplayName21" VARCHAR(100),
    "CRDisplayName22" VARCHAR(100),
    "CreatedByID" INTEGER,
    "CreatedDate" TIMESTAMP DEFAULT NOW(),
    "ModifiedByID" INTEGER,
    "ModiefiedDate" TIMESTAMP,
    "DRProjectType11" VARCHAR(50),
    "DRProjectType12" VARCHAR(50),
    "DRProjectType13" VARCHAR(50),
    "DRProjectType14" VARCHAR(50),
    "DRProjectType21" VARCHAR(50),
    "DRProjectType22" VARCHAR(50),
    "CRProjectType11" VARCHAR(50),
    "CRProjectType21" VARCHAR(50),
    "CRProjectType22" VARCHAR(50)
);

ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "SubType1" VARCHAR(50);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "DRDisplayName11" VARCHAR(100);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "DRDisplayName12" VARCHAR(100);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "DRDisplayName13" VARCHAR(100);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "DRDisplayName14" VARCHAR(100);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "CRDisplayName11" VARCHAR(100);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "SubType2" VARCHAR(50);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "DRDisplayName21" VARCHAR(100);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "DRDisplayName22" VARCHAR(100);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "DRDisplayName23" VARCHAR(100);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "CRDisplayName21" VARCHAR(100);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "CRDisplayName22" VARCHAR(100);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "DRProjectType11" VARCHAR(50);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "DRProjectType12" VARCHAR(50);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "DRProjectType13" VARCHAR(50);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "DRProjectType14" VARCHAR(50);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "DRProjectType21" VARCHAR(50);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "DRProjectType22" VARCHAR(50);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "CRProjectType11" VARCHAR(50);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "CRProjectType21" VARCHAR(50);
ALTER TABLE "AssetConfig_TransactionType" ADD COLUMN IF NOT EXISTS "CRProjectType22" VARCHAR(50);

CREATE TABLE IF NOT EXISTS "AssetConfig_mSCOA" (
    "AssetConfig_mSCOA_ID" SERIAL PRIMARY KEY,
    "FinYear" VARCHAR(9) NOT NULL,
    "TypeID" INTEGER,
    "CategoryID" INTEGER,
    "SubCategoryID" INTEGER,
    "MeasurementTypeID" INTEGER,
    "StatusID" INTEGER,
    "Default" SMALLINT,
    "Enabled" SMALLINT,
    "UpLoadFile" VARCHAR(255),
    "CreatedByID" INTEGER,
    "CreatedDate" TIMESTAMP DEFAULT NOW(),
    "ModifiedByID" INTEGER,
    "ModiefiedDate" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AssetConfig_mSCOA_TransactionType" (
    "AssetConfig_mSCOA_TransactionType_ID" SERIAL PRIMARY KEY,
    "AssetConfig_mSCOA_ID" INTEGER NOT NULL,
    "TransactionTypeID" INTEGER,
    "Project11" INTEGER,
    "DebitItem11_1" INTEGER,
    "DebitItem11_1DisplayName" VARCHAR(200),
    "DebitItem11_2" INTEGER,
    "DebitItem11_2DisplayName" VARCHAR(200),
    "CreditItem11_1" VARCHAR(10),
    "CreditItem11_1DisplayName" VARCHAR(200),
    "Project21" INTEGER,
    "DebitItem21_1" INTEGER,
    "DebitItem21_1DisplayName" VARCHAR(200),
    "DebitItem21_2" INTEGER,
    "CreditItem21_1" VARCHAR(10),
    "CreditItem21_1DisplayName" VARCHAR(200),
    "Project12" INTEGER,
    "DebitItem12_1" INTEGER,
    "CreditItem12_1" INTEGER,
    "Project22" INTEGER,
    "DebitItem22_1" INTEGER,
    "Project13" INTEGER,
    "CreditItem13_1" INTEGER,
    "Project23" INTEGER,
    "CreditItem23_1" INTEGER,
    "Default" SMALLINT,
    "Enabled" SMALLINT,
    "CreatedByID" INTEGER,
    "CreatedDate" TIMESTAMP DEFAULT NOW(),
    "ModifiedByID" INTEGER,
    "ModiefiedDate" TIMESTAMP,
    "Project14" INTEGER,
    "Project24" INTEGER,
    "Project15" INTEGER,
    "Project25" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_Asset_Condition" (
    "Asset_Condition_ID" SERIAL PRIMARY KEY,
    "Description" VARCHAR(300),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_Asset_ComponentType" (
    "Asset_ComponentType_ID" SERIAL PRIMARY KEY,
    "Asset_Component_Description" VARCHAR(200),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "Capturer_ID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "Modifier_ID" INTEGER,
    "Default" SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "Const_Asset_Calculation_Type" (
    "Asset_Calculation_Type_ID" SERIAL PRIMARY KEY,
    "TypeDescription" VARCHAR(200),
    "CalculationTypeFormula" VARCHAR(500),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_AssetConditionRating_Sys" (
    "ConditionRating_ID" SERIAL PRIMARY KEY,
    "ConditionRatingDesc" VARCHAR(200),
    "DetailedDescription" VARCHAR(500),
    "EstimatedRemainingLife" INTEGER,
    "Grade" VARCHAR(50),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_AssetDisposalMethod" (
    "AssetDisposalMethod_ID" SERIAL PRIMARY KEY,
    "AssetDisposalMethodDesc" VARCHAR(200),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_AssetInspectionConditions" (
    "InspectionCondition_ID" SERIAL PRIMARY KEY,
    "InspectionConditionDesc" VARCHAR(200),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_Asset_Depreciation_Approval_Type" (
    "Asset_Depreciation_Approval_Type_ID" SERIAL PRIMARY KEY,
    "ApprovalTypeDesc" VARCHAR(200),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_Asset_Run_Type" (
    "RunType_ID" SERIAL PRIMARY KEY,
    "RunTypeDesc" VARCHAR(200),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_Asset_RunStatus" (
    "RunStatus_ID" SERIAL PRIMARY KEY,
    "RunStatusDesc" VARCHAR(200),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_Month_sys" (
    "Month_ID" SERIAL PRIMARY KEY,
    "Month" VARCHAR(50),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_Asset_CIDMS_Accounting_Group" (
    "AssetAccountGroupID" SERIAL PRIMARY KEY,
    "AssetAccountGroupDesc" VARCHAR(250) NOT NULL,
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "Default" SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "Const_Asset_CIDMS_Accounting_Sub_Group" (
    "AssetAccountSubGroupID" SERIAL PRIMARY KEY,
    "AssetAccountSubGroupDesc" VARCHAR(250) NOT NULL,
    "AssetAccountGroupID" INTEGER REFERENCES "Const_Asset_CIDMS_Accounting_Group"("AssetAccountGroupID"),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "Default" SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "Const_Asset_CIDMS_Class" (
    "AssetCIDMSClassID" SERIAL PRIMARY KEY,
    "AssetCIDMSClassDesc" VARCHAR(250) NOT NULL,
    "AssetAccountSubGroupID" INTEGER REFERENCES "Const_Asset_CIDMS_Accounting_Sub_Group"("AssetAccountSubGroupID"),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "Default" SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "Const_Asset_CIDMS_Group_Type" (
    "AssetCIDMSGroupTypeID" SERIAL PRIMARY KEY,
    "AssetCIDMSGroupTypeDesc" VARCHAR(250) NOT NULL,
    "AssetCIDMSClassID" INTEGER REFERENCES "Const_Asset_CIDMS_Class"("AssetCIDMSClassID"),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "Default" SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "Const_Asset_CIDMS_Asset_Type" (
    "AssetCIDMSAssetTypeID" SERIAL PRIMARY KEY,
    "AssetCIDMSAssetTypeDesc" VARCHAR(250) NOT NULL,
    "AssetCIDMSGroupTypeID" INTEGER REFERENCES "Const_Asset_CIDMS_Group_Type"("AssetCIDMSGroupTypeID"),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "Default" SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "Const_Asset_CIDMS_Component_Type" (
    "AssetCIDMSComponentTypeID" SERIAL PRIMARY KEY,
    "AssetCIDMSComponentTypeDesc" VARCHAR(250) NOT NULL,
    "AssetCIDMSAssetTypeID" INTEGER REFERENCES "Const_Asset_CIDMS_Asset_Type"("AssetCIDMSAssetTypeID"),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "Default" SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "Const_Asset_CIDMS_SubComponent_Type" (
    "AssetCIDMSSubComponentTypeID" SERIAL PRIMARY KEY,
    "AssetCIDMSSubComponentTypeDesc" VARCHAR(250) NOT NULL,
    "AssetCIDMSComponentTypeID" INTEGER REFERENCES "Const_Asset_CIDMS_Component_Type"("AssetCIDMSComponentTypeID"),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "Default" SMALLINT DEFAULT 1,
    "Infrastructure" SMALLINT DEFAULT 0,
    "Nature" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "Const_Asset_CIDMS_Municipal_Services" (
    "AssetMunicipalServicesID" SERIAL PRIMARY KEY,
    "AssetMunicipalServicesDesc" VARCHAR(250) NOT NULL,
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "Default" SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "Const_Asset_Criticality_Grade" (
    "AssetCriticalityGradeID" SERIAL PRIMARY KEY,
    "AssetCriticalityGradeDesc" VARCHAR(250),
    "ConsequenceOfFailure" VARCHAR(250),
    "QualitiveDesc" VARCHAR(250),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "Default" SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "Const_Asset_Health_Grade" (
    "AssetHealthGradeID" SERIAL PRIMARY KEY,
    "AssetHealthGradeDesc" VARCHAR(250),
    "DRC" VARCHAR(250),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "Default" SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "Const_Asset_Performance_Grade" (
    "AssetPerformanceGradeID" SERIAL PRIMARY KEY,
    "AssetPerformanceGradeDesc" VARCHAR(200),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "Default" SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "Const_Asset_Utilisation_Grade" (
    "AssetUtilisationGradeID" SERIAL PRIMARY KEY,
    "AssetUtilisationGradeDesc" VARCHAR(200),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "Default" SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "Const_Department" (
    "Department_ID" SERIAL PRIMARY KEY,
    "DepartmentDesc" VARCHAR(200),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "DepartmentCode" VARCHAR(50),
    "StartDate" TIMESTAMP,
    "EndDate" TIMESTAMP,
    "VatApportionment" INTEGER,
    "ManagerPositionID" INTEGER,
    "ManagerStartDate" TIMESTAMP,
    "ManagerEndDate" TIMESTAMP,
    "FinYear" VARCHAR(9)
);

CREATE TABLE IF NOT EXISTS "Const_Division" (
    "Division_ID" SERIAL PRIMARY KEY,
    "DivisionDesc" VARCHAR(200),
    "DivisionCode" VARCHAR(50),
    "DepartmentID" INTEGER REFERENCES "Const_Department"("Department_ID"),
    "DivisionParentID" INTEGER,
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "SCOAFunctionID" INTEGER,
    "HRPayrollSCOAFundID" INTEGER,
    "StartDate" TIMESTAMP,
    "EndDate" TIMESTAMP,
    "RegionID" INTEGER,
    "ProjectID" INTEGER,
    "ManagerPositionID" INTEGER,
    "ManagerStartDate" TIMESTAMP,
    "ManagerEndDate" TIMESTAMP,
    "ConditionOfServiceID" INTEGER,
    "DirectorateLevel" SMALLINT,
    "FinYear" VARCHAR(9)
);

CREATE TABLE IF NOT EXISTS "Const_Town" (
    "Town_ID" SERIAL PRIMARY KEY,
    "Town" VARCHAR(200) NOT NULL,
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "FallswithinMunicipality" SMALLINT,
    "TownCode" VARCHAR(6),
    "ProvinceID" INTEGER DEFAULT 1,
    "Code" VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS "Const_UnitOfIssue" (
    "UnitOfIssue_ID" SERIAL PRIMARY KEY,
    "UnitOfIssueDesc" VARCHAR(200) NOT NULL,
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "UOMCode" VARCHAR(50),
    "MeasureCategoryCode" VARCHAR(50),
    "base" INTEGER,
    "GroupDefaultUom" SMALLINT,
    "IsDeleted" SMALLINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "Payroll_Employee" (
    "Employee_ID" SERIAL PRIMARY KEY,
    "EmpCode" VARCHAR(50),
    "IdNo" VARCHAR(50) NOT NULL,
    "TitleID" INTEGER,
    "Initials" VARCHAR(50),
    "FirstName" VARCHAR(50) NOT NULL,
    "SecondName" VARCHAR(50),
    "Surname" VARCHAR(50) NOT NULL,
    "KnownAsName" VARCHAR(50),
    "DateOfBirth" TIMESTAMP,
    "GenderID" INTEGER,
    "LanguageID" INTEGER,
    "MarriedID" INTEGER,
    "Dependants" INTEGER,
    "PassportNumber" VARCHAR(50),
    "PassportCountryID" INTEGER,
    "EmailAddress" VARCHAR(100),
    "HomeNumber" VARCHAR(100),
    "WorkNumber" VARCHAR(100),
    "CellNumber" VARCHAR(100),
    "FaxNumber" VARCHAR(100),
    "JoiningDate" TIMESTAMP,
    "EndDate" TIMESTAMP,
    "WorkOutside" SMALLINT,
    "IncomeTaxNumber" VARCHAR(100),
    "Enabled" SMALLINT DEFAULT 1,
    "CapturerID" INTEGER DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "ModifierID" INTEGER,
    "DateModified" TIMESTAMP,
    "IsDummy" SMALLINT DEFAULT 0,
    "PositionID" INTEGER,
    "EmployeeTypeID" INTEGER,
    "EmployeeSubtypeID" INTEGER,
    "MunicipalityID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_Asset_WIPFundingSource" (
    "FundingSourceID" SERIAL PRIMARY KEY,
    "SourceDesc" VARCHAR(200),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_Asset_WIPFundingType" (
    "FundingTypeID" SERIAL PRIMARY KEY,
    "TypeDesc" VARCHAR(200),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_Asset_WIPProjectStatus" (
    "ProjectStatusID" SERIAL PRIMARY KEY,
    "StatusDesc" VARCHAR(200),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_FundingSource" (
    "AssetFundingSource_ID" SERIAL PRIMARY KEY,
    "AssetRegisterItem_ID" INTEGER,
    "FundingSource_ID" INTEGER,
    "FinYear" VARCHAR(9),
    "Amount" NUMERIC(18,2),
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_Register_Items" (
    "AssetRegisterItem_ID" SERIAL PRIMARY KEY,
    "AssetClass_ID" INTEGER,
    "AssetCategory_ID" INTEGER,
    "Custodian_ID" INTEGER,
    "CustodianIdNumber" VARCHAR(50),
    "Department" INTEGER,
    "Description" VARCHAR(4000),
    "ParentAssetRegisterItem_ID" VARCHAR(100),
    "Quantity" NUMERIC(18,8),
    "MarketValue" DECIMAL(18,2),
    "ReadyForUse" TIMESTAMP,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "Capturer_ID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP DEFAULT NOW(),
    "Modifier_ID" INTEGER,
    "CurrentAmount" NUMERIC(18,8),
    "AssetStatus_ID" INTEGER,
    "AssetCondition_ID" INTEGER,
    "AssetType_ID" INTEGER,
    "CarryingAmountClosingBalance" NUMERIC(18,8),
    "Barcode" VARCHAR(100),
    "AssetOwnership_ID" INTEGER,
    "GIS_ID" VARCHAR(50),
    "GisFeature" VARCHAR(50),
    "GPSCoordinates" VARCHAR(50),
    "Town_ID" INTEGER,
    "Street_ID" INTEGER,
    "StreetAddress" VARCHAR(100),
    "Building_ID" INTEGER,
    "Ward_ID" INTEGER,
    "Room_ID" INTEGER,
    "SGNumberChange_ID" VARCHAR(200),
    "Zoning_ID" INTEGER,
    "ErfNumber" VARCHAR(50),
    "Make" VARCHAR(100),
    "Model" VARCHAR(100),
    "ErfSizeM2" NUMERIC(18,8),
    "DeedNumber" VARCHAR(100),
    "RegistrationNumber" VARCHAR(100),
    "SerialNumber" VARCHAR(100),
    "QuantityCaption" VARCHAR(50),
    "MunicipalDepartment_ID" VARCHAR(250),
    "DateOfTakeOnBalancesImported" TIMESTAMP,
    "Decommissioning" SMALLINT,
    "AccumulatedDepreciationClosingBalance" NUMERIC(18,8),
    "AccumulatedDepreciationOtherChanges" NUMERIC(18,8),
    "AccumulatedDepreciationCurrentYear" NUMERIC(18,8),
    "AccumulatedDepreciationDisposal" NUMERIC(18,8),
    "AccumulatedDepreciationTransfer" NUMERIC(18,8),
    "AccumulatedImpairmentClosingBalance" NUMERIC(18,8),
    "InvoiceDate" TIMESTAMP,
    "SupplierName" VARCHAR(100),
    "SupplierCode" VARCHAR(100),
    "InvoiceNumber" VARCHAR(100),
    "UsefulLifeYearComponent" NUMERIC(18,8),
    "UsefulLifeMonthComponent" NUMERIC(18,8),
    "CorrectionOfErrorAmount" NUMERIC(18,8),
    "ImpairmentAmountCurrentYear" NUMERIC(18,8),
    "ReversalOfImpairmentAmount" NUMERIC(18,8),
    "RevaluationDoneBy" INTEGER,
    "LastRevaluationDate" TIMESTAMP,
    "RevaluationValue" NUMERIC(18,8),
    "RevaluationReserveClosingBalance" NUMERIC(18,8),
    "WorkInProgressAmount" NUMERIC(18,8),
    "CrossReferenceOfUnbundledProject" VARCHAR(100),
    "DateOfDisposal" TIMESTAMP,
    "DisposalProceeds" NUMERIC(18,8),
    "DisposalAmountCost" NUMERIC(18,8),
    "DisposalImpairmentAmount" NUMERIC(18,8),
    "ProfitOrLossOnDisposal" NUMERIC(18,8),
    "InsuredAmountInsuredBy" NUMERIC(18,8),
    "InsuranceNumberReference" VARCHAR(100),
    "Verified" SMALLINT,
    "VerificationDate" TIMESTAMP,
    "VerificationDoneBy" VARCHAR(100),
    "PurchaseAmount" NUMERIC(18,8),
    "Suburb" VARCHAR(100),
    "MeasurementModel_ID" INTEGER,
    "RevaluationDate" TIMESTAMP,
    "RevaluationModel_ID" INTEGER,
    "Asset_SubCategory_ID" INTEGER,
    "UoM" INTEGER,
    "Dim1" NUMERIC(18,8),
    "Dim2" NUMERIC(18,8),
    "Dim3" NUMERIC(18,8),
    "Donor_ID" VARCHAR(100),
    "Donor_Name" VARCHAR(100),
    "Date_Donated" TIMESTAMP,
    "DimensionQuantity" NUMERIC(18,8),
    "Comments" VARCHAR(500),
    "ResidualValue" NUMERIC(18,8),
    "RevisedResidualValue" NUMERIC(18,8),
    "RemainingUsefulLife" NUMERIC(18,8),
    "AccumulatedDepreciationOpeningBalance" NUMERIC(18,8),
    "AccumulatedImpairmentOpeningBalance" NUMERIC(18,8),
    "AmortisationValue" NUMERIC(18,8),
    "DisposalReason" VARCHAR(250),
    "OldBarCode" VARCHAR(50),
    "Run_ID" INTEGER,
    "Approval_ID" INTEGER,
    "longitude" VARCHAR(75),
    "latitude" VARCHAR(75),
    "MunicipalDepartment" TEXT,
    "FundingSource" INTEGER,
    "MeasurementType_ID" INTEGER,
    "DivisionID" INTEGER,
    "FloorID" INTEGER,
    "SuburbID" INTEGER,
    "ReasonForChange" VARCHAR(500),
    "TypeID" INTEGER,
    "Financial_Status_ID" INTEGER,
    "Impairment_Date" TIMESTAMP,
    "Remaining_Useful_Life_Year" NUMERIC(18,8),
    "Floor_Area" NUMERIC(18,8),
    "Custom_1" VARCHAR(200),
    "Custom_2" VARCHAR(200),
    "Custom_3" VARCHAR(200),
    "Custom_4" VARCHAR(200),
    "Custom_5" VARCHAR(200),
    "Custom_6" VARCHAR(200),
    "Custom_7" VARCHAR(200),
    "Custom_8" VARCHAR(200),
    "Custom_9" VARCHAR(200),
    "ImageRef" VARCHAR(255),
    "Component_ID" VARCHAR(255),
    "AssetOwnershipName" VARCHAR(100),
    "DonorRegNumber" VARCHAR(50),
    "UnitNumber" VARCHAR(20),
    "PortionNumber" VARCHAR(20),
    "MainAssetID" VARCHAR(100),
    "MainAssetDescription" VARCHAR(100),
    "CIDMSSubComponentTypeID" INTEGER,
    "CIDMSComponentType" INTEGER,
    "CIDMSAccountingGroup" INTEGER,
    "CIDMSSubAccountingGroup" INTEGER,
    "CIDMSAssetClass" INTEGER,
    "CIDMSAssetGroupType" INTEGER,
    "CIDMSAssetType" INTEGER,
    "CashOrNoncashgeneratingunit" VARCHAR(100),
    "CommisioningDate" DATE,
    "InfrastructurOrNonInfrastructure" VARCHAR(100),
    "NatureOfAddition" VARCHAR(100),
    "CostOfAddition" NUMERIC(18,8),
    "YearConstructed" DATE,
    "ForecastReplacementYear" INTEGER,
    "InsuranceCover" VARCHAR(100),
    "InsurancePolicyNo" VARCHAR(100),
    "Warranty" VARCHAR(100),
    "CurrentReplacementCostCRC" NUMERIC(18,8),
    "DepreciatedReplacementCostDRC" NUMERIC(18,8),
    "AnnualisedMaintenanceCRC" NUMERIC(18,8),
    "AnnualMaintenanceBudgetNeed" NUMERIC(18,8),
    "RemainingUsefulLifeAtTakeOn" VARCHAR(100),
    "ConstructionMaterial" VARCHAR(100),
    "BasicMunicipalityService" INTEGER,
    "CriticalityGrade" INTEGER,
    "PerformanceGrade" INTEGER,
    "UtilisationGrade" INTEGER,
    "InfrastructureHealthGrade" INTEGER,
    "ConsequenceOfFailure" VARCHAR(100),
    "Risk" VARCHAR(100),
    "WellKnownTextWKT" VARCHAR(100),
    "MunicipalAssetID" VARCHAR(100),
    "AcquisitionDate" TIMESTAMP,
    "InserviceDate" TIMESTAMP,
    "ManagedFlag" SMALLINT NOT NULL DEFAULT 1,
    "FundType" VARCHAR(100),
    "FundingSourceNumber" VARCHAR(100),
    "FundingSourceAmount" NUMERIC(18,8),
    "RevaluationOpeningBalance" NUMERIC(18,8),
    "MovementInRevaluationReserve" NUMERIC(18,8),
    "DepreciationOffset" NUMERIC(18,8),
    "DeemedCost" VARCHAR(100),
    "RevaluationImpairmentOpeningBalance" NUMERIC(18,8),
    "TransferFromAmount" NUMERIC(18,8),
    "TransferToAmount" NUMERIC(18,8),
    "Diameter" VARCHAR(100),
    "Capacity" VARCHAR(100),
    "Refurb_DT" NUMERIC(18,8),
    "Refurb_CT" NUMERIC(18,8),
    "Refurb_Depreciation" NUMERIC(18,8),
    "Refurb_Revaluation" NUMERIC(18,8)
);

CREATE TABLE IF NOT EXISTS "Asset_Register_Transactions" (
    "ID" SERIAL PRIMARY KEY,
    "AssetRegisterItem_ID" INTEGER REFERENCES "Asset_Register_Items"("AssetRegisterItem_ID"),
    "TransactionTypeID" INTEGER NOT NULL,
    "TransactionDate" TIMESTAMP NOT NULL,
    "PurchaseAmount" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "ResidualValue" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "CurrentValue" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "UsefulLife" INTEGER NOT NULL DEFAULT 0,
    "RemaingUsefulLife" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "DepreciationValue" DECIMAL(18,8),
    "ImpairmentValue" DECIMAL(18,8),
    "RevaluationValue" DECIMAL(18,8),
    "FairValue" DECIMAL(18,8),
    "DisposalValue" DECIMAL(18,8),
    "DisposalLossValue" DECIMAL(18,8),
    "DisposalTotalValue" DECIMAL(18,8),
    "AccumulatedDepreciation" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "AccumulatedImpairment" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "AccumulatedFairValue" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "AccumulatedRevaluation" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "FinancialPeriod" INTEGER NOT NULL DEFAULT 0,
    "FinancialYear" VARCHAR(10) NOT NULL DEFAULT '',
    "DocumentType_ID" INTEGER,
    "GLGUID_ID" VARCHAR(50),
    "TransactionSource_ID" INTEGER,
    "DateModified" TIMESTAMP NOT NULL DEFAULT NOW(),
    "Modifier" INTEGER NOT NULL DEFAULT 0,
    "ImpairmentReversalValue" DECIMAL(18,8),
    "AccumulatedImpairmentReversal" DECIMAL(18,8),
    "ImpairmentSurplus" DECIMAL(18,8),
    "MovementInRevaluationReserve" DECIMAL(18,8),
    "DepreciationOffset" DECIMAL(18,8),
    "RevaluationReserveImpairment" DECIMAL(18,8),
    "RevaluationReserveImpairmentReversal" DECIMAL(18,8),
    "RevaluationReserveRevaluation" DECIMAL(18,8),
    "RevaluationReserveDisposal" DECIMAL(18,8),
    "DepreciationAdjustment" DECIMAL(18,8),
    "TransferFromValue" DECIMAL(18,8),
    "TransferToValue" DECIMAL(18,8),
    "RefurbDTValue" DECIMAL(18,8),
    "RefurbCTValue" DECIMAL(18,8),
    "RefurbDepreciationValue" DECIMAL(18,8),
    "RefurbRevaluationValue" DECIMAL(18,8)
);

CREATE TABLE IF NOT EXISTS "Asset_Transaction_Summary" (
    "ID" SERIAL PRIMARY KEY,
    "AssetRegisterItem_ID" INTEGER REFERENCES "Asset_Register_Items"("AssetRegisterItem_ID"),
    "AssetRegisterItemID" INTEGER,
    "FinYear" VARCHAR(9),
    "FinancialYear" VARCHAR(9),
    "FinancialPeriod" INTEGER,
    "RemainingUsefulLife" DECIMAL(18,8),
    "CurrentValue" DECIMAL(18,2),
    "AccumulatedDepreciationOpeningBalance" DECIMAL(18,2),
    "DepreciationValue" DECIMAL(18,2),
    "AccumulatedDepreciationClosingBalance" DECIMAL(18,2),
    "AccumulatedImpairmentOpeningBalance" DECIMAL(18,2),
    "ImpairmentValue" DECIMAL(18,2),
    "AccumulatedImpairmentClosingBalance" DECIMAL(18,2),
    "AccumulatedFairValueOpeningBalance" DECIMAL(18,2),
    "FairValue" DECIMAL(18,2),
    "AccumulatedFairValueClosingBalance" DECIMAL(18,2),
    "AccumulatedRevaluationOpeningBalance" DECIMAL(18,2),
    "RevaluationValue" DECIMAL(18,2),
    "AccumulatedRevaluationClosingBalance" DECIMAL(18,2),
    "AccumulatedImpairmentReversalOpeningBalance" DECIMAL(18,2),
    "ImpairmentReversalValue" DECIMAL(18,2),
    "AccumulatedImpairmentReversalClosingBalance" DECIMAL(18,2),
    "DisposalOpeningBalance" DECIMAL(18,2),
    "DisposalValue" DECIMAL(18,2),
    "DisposalLossValue" DECIMAL(18,2),
    "DisposalTotalValue" DECIMAL(18,2),
    "DisposalClosingBalance" DECIMAL(18,2),
    "AdditionOpeningBalance" DECIMAL(18,2),
    "AdditionVaue" DECIMAL(18,2),
    "AdditionClosingBalance" DECIMAL(18,2),
    "MovementInRevaluationReserve" DECIMAL(18,2),
    "CostOpeningBalance" DECIMAL(18,2),
    "CostClosingBalance" DECIMAL(18,2),
    "CarryingAmount" DECIMAL(18,2),
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DepreciationOffsetOpeningBalance" DECIMAL(18,2),
    "DepreciationOffset" DECIMAL(18,2),
    "DepreciationOffsetClosingBalance" DECIMAL(18,2),
    "RevaluationReserveImpairmentOpeningBalance" DECIMAL(18,2),
    "RevaluationReserveImpairment" DECIMAL(18,2),
    "RevaluationReserveImpairmentReversal" DECIMAL(18,2),
    "RevaluationReserveImpairmentClosingBalance" DECIMAL(18,2),
    "RevaluationReserveRevaluation" DECIMAL(18,2),
    "RevaluationReserveDisposal" DECIMAL(18,2),
    "DepreciationAdjustment" DECIMAL(18,2),
    "TransferFromValue" DECIMAL(18,2),
    "TransferToValue" DECIMAL(18,2),
    "RefurbDTValue" DECIMAL(18,2),
    "RefurbCTValue" DECIMAL(18,2),
    "RefurbDepreciationValue" DECIMAL(18,2),
    "RefurbRevaluationValue" DECIMAL(18,2),
    "RefurbImpairmentValue" DECIMAL(18,2),
    "ImpairmentSurplus" DECIMAL(18,2),
    "WorkInProgressOpeningBalance" DECIMAL(18,2),
    "WorkInProgressValue" DECIMAL(18,2),
    "WorkInProgressClosingBalance" DECIMAL(18,2),
    "AmortisationOpeningBalance" DECIMAL(18,2),
    "AmortisationValue" DECIMAL(18,2),
    "AmortisationClosingBalance" DECIMAL(18,2),
    "CorrectionOfErrorOpeningBalance" DECIMAL(18,2),
    "CorrectionOfErrorValue" DECIMAL(18,2),
    "CorrectOfErrorClosingBalance" DECIMAL(18,2),
    "AdditionalCostOpeningBalance" DECIMAL(18,2),
    "AdditionalCostValue" DECIMAL(18,2),
    "AdditionalCostClosingBalance" DECIMAL(18,2)
);

CREATE TABLE IF NOT EXISTS "Asset_Depreciation" (
    "Asset_Depreciation_ID" SERIAL PRIMARY KEY,
    "AssetRegisterItem_ID" INTEGER REFERENCES "Asset_Register_Items"("AssetRegisterItem_ID"),
    "DepreciationDate" TIMESTAMP,
    "DepreciationAmount" DECIMAL(18,2),
    "AccumulatedDepreciation" DECIMAL(18,2),
    "CarryingAmount" DECIMAL(18,2),
    "RunType_ID" INTEGER,
    "RunStatus_ID" INTEGER,
    "FinYear" VARCHAR(9),
    "MonthID" INTEGER,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_DepreciationApproval" (
    "DepreciationApproval_ID" SERIAL PRIMARY KEY,
    "FinYear" VARCHAR(9),
    "MonthID" INTEGER,
    "ApprovalTypeID" INTEGER,
    "ApprovalDate" TIMESTAMP,
    "ApprovedByID" INTEGER,
    "Status" VARCHAR(50),
    "Comments" TEXT,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_DepreciationSchedule" (
    "Asset_DepreciationSchedule_ID" SERIAL PRIMARY KEY,
    "FinYear" VARCHAR(9),
    "RunDate" TIMESTAMP,
    "RunType_ID" INTEGER,
    "RunStatus_ID" INTEGER,
    "TotalAssets" INTEGER,
    "TotalDepreciation" DECIMAL(18,2),
    "CapturerID" INTEGER DEFAULT 1,
    "PendingApproval" SMALLINT DEFAULT 0,
    "IsApproved" SMALLINT DEFAULT 0,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_DepreciationSchedule_Item" (
    "Asset_DepreciationSchedule_Item_ID" SERIAL PRIMARY KEY,
    "Asset_DepreciationSchedule_ID" INTEGER REFERENCES "Asset_DepreciationSchedule"("Asset_DepreciationSchedule_ID"),
    "AssetRegisterItem_ID" INTEGER REFERENCES "Asset_Register_Items"("AssetRegisterItem_ID"),
    "DepreciationAmount" DECIMAL(18,2),
    "AccumulatedDepreciation" DECIMAL(18,2),
    "CarryingAmount" DECIMAL(18,2),
    "Date_Captured" TIMESTAMP DEFAULT NOW(),
    "Captured_By" INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "Asset_Disposal" (
    "AssetDisposal_ID" SERIAL PRIMARY KEY,
    "AssetItemID" INTEGER REFERENCES "Asset_Register_Items"("AssetRegisterItem_ID"),
    "AssetDisposalMethodID" INTEGER,
    "DisposalDate" TIMESTAMP,
    "AmountProfitLoss" DECIMAL(18,2),
    "DisposalReason" VARCHAR(500),
    "SalePrice" DECIMAL(18,2),
    "CarryingAmount" DECIMAL(18,2),
    "Status" VARCHAR(50) DEFAULT 'Pending',
    "FinYear" VARCHAR(9),
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_Disposal_Approval" (
    "DisposalApproval_ID" SERIAL PRIMARY KEY,
    "AssetDisposal_ID" INTEGER REFERENCES "Asset_Disposal"("AssetDisposal_ID"),
    "ApprovalDate" TIMESTAMP,
    "ApprovedByID" INTEGER,
    "Status" VARCHAR(50),
    "Comments" TEXT,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "Asset_FairValue" (
    "RegistrationItemFairValue_Id" SERIAL PRIMARY KEY,
    "AssetRegisterItem_ID" INTEGER REFERENCES "Asset_Register_Items"("AssetRegisterItem_ID"),
    "AssetDescription" VARCHAR(500),
    "AssetClass" VARCHAR(200),
    "AssetCategory" VARCHAR(200),
    "FairValue" DECIMAL(18,2),
    "FairValueDate" TIMESTAMP,
    "PreviousCarryingAmount" DECIMAL(18,2),
    "GainLoss" DECIMAL(18,2),
    "Status" VARCHAR(50) DEFAULT 'Pending',
    "FinYear" VARCHAR(9),
    "DebitVoteID" INTEGER,
    "CreditVoteID" INTEGER,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_FairValueApproval" (
    "Asset_FairValueApproval_ID" SERIAL PRIMARY KEY,
    "AssetRegisterItem_ID" INTEGER REFERENCES "Asset_Register_Items"("AssetRegisterItem_ID"),
    "RegistrationItemFairValue_Id" INTEGER,
    "ApprovalDate" TIMESTAMP,
    "ApprovedByID" INTEGER,
    "Status" VARCHAR(50),
    "Comments" TEXT,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "Asset_Impairment" (
    "Impairment_ID" SERIAL PRIMARY KEY,
    "Asset_ItemID" INTEGER REFERENCES "Asset_Register_Items"("AssetRegisterItem_ID"),
    "ImpairmentDate" TIMESTAMP,
    "ImpairmentAmount" DECIMAL(18,2),
    "PreviousCarryingAmount" DECIMAL(18,2),
    "NewCarryingAmount" DECIMAL(18,2),
    "RemainingUsefulLife" DECIMAL(18,2),
    "Reason" VARCHAR(500),
    "Status" VARCHAR(50) DEFAULT 'Pending',
    "FinYear" VARCHAR(9),
    "CatchUpDepreciation" DECIMAL(18,2),
    "CatchUpDays" INTEGER,
    "Approved" SMALLINT DEFAULT 0,
    "ApprovedDate" TIMESTAMP,
    "ApprovedBy" INTEGER,
    "IsRejected" SMALLINT DEFAULT 0,
    "IsReversal" SMALLINT DEFAULT 0,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_ImpairmentPostings" (
    "Id" SERIAL PRIMARY KEY,
    "Impairment_ID" INTEGER REFERENCES "Asset_Impairment"("Impairment_ID"),
    "FairValueAmt" DECIMAL(18,2),
    "CostToSell" DECIMAL(18,2),
    "PresentValue" DECIMAL(18,2),
    "ImpairmentLostAmt" DECIMAL(18,2),
    "Approved" SMALLINT DEFAULT 0,
    "IsReversal" SMALLINT DEFAULT 0,
    "CarryingValue" DECIMAL(18,2),
    "AmountFromRevaluationReserve" DECIMAL(18,2),
    "PostingDate" TIMESTAMP,
    "PostedByID" INTEGER,
    "Status" VARCHAR(50),
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "Asset_WIP_Register" (
    "WIPRegister_ID" SERIAL PRIMARY KEY,
    "AssetRegisterItem_ID" INTEGER,
    "ProjectNo" VARCHAR(100),
    "ProjectName" VARCHAR(500),
    "ProjectNumber" VARCHAR(100),
    "ProjectStatusID" INTEGER,
    "ContractID" INTEGER,
    "ContractStartDate" TIMESTAMP,
    "ContractEndDate" TIMESTAMP,
    "ContractNumber" VARCHAR(100),
    "FundingTypeID" INTEGER,
    "DepartmentID" INTEGER,
    "DivisionID" INTEGER,
    "CustodianID" INTEGER,
    "Latitude" DECIMAL(18,8),
    "Longitude" DECIMAL(18,8),
    "ContractValue" DECIMAL(18,2),
    "WIPOpeningBalance" DECIMAL(18,2),
    "RestatedOpeningBalance" DECIMAL(18,2),
    "Additions" DECIMAL(18,2),
    "TransferOfAssets" DECIMAL(18,2),
    "WriteOff" DECIMAL(18,2),
    "Impairment" DECIMAL(18,2),
    "PriorYearAdjustment" DECIMAL(18,2),
    "WIPClosingBalance" DECIMAL(18,2),
    "FinancialProgress" DECIMAL(18,2),
    "BudgetProjectID" INTEGER,
    "BudgetProjectItemID" INTEGER,
    "CompletionDate" TIMESTAMP,
    "IsApproved" SMALLINT DEFAULT 0,
    "StartDate" TIMESTAMP,
    "ExpectedEndDate" TIMESTAMP,
    "ActualEndDate" TIMESTAMP,
    "TotalBudget" DECIMAL(18,2),
    "TotalExpenditure" DECIMAL(18,2),
    "AssetType_ID" INTEGER,
    "AssetCategory_ID" INTEGER,
    "FinYear" VARCHAR(9),
    "Status" VARCHAR(50) DEFAULT 'Active',
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_WIP_Register_Details" (
    "WIPRegisterDetails_ID" SERIAL PRIMARY KEY,
    "WIPRegister_ID" INTEGER REFERENCES "Asset_WIP_Register"("WIPRegister_ID"),
    "InvoiceId" INTEGER,
    "InvoiceNumber" VARCHAR(100),
    "InvoiceDate" TIMESTAMP,
    "VendorID" INTEGER,
    "VatAmount" DECIMAL(18,2),
    "Amount" DECIMAL(18,2),
    "TotalAmount" DECIMAL(18,2),
    "DocumentNumber" VARCHAR(100),
    "PaymentReference" VARCHAR(100),
    "Description" VARCHAR(500),
    "TransactionDate" TIMESTAMP,
    "ReferenceNumber" VARCHAR(100),
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_WIP_Register_Funding" (
    "WIPRegisterFunding_ID" SERIAL PRIMARY KEY,
    "WIPRegister_ID" INTEGER REFERENCES "Asset_WIP_Register"("WIPRegister_ID"),
    "FundingSource_ID" INTEGER,
    "FundingType_ID" INTEGER,
    "Amount" DECIMAL(18,2),
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_WIP_Register_Items" (
    "WIPRegistrationItem_Id" SERIAL PRIMARY KEY,
    "WIPRegister_ID" INTEGER REFERENCES "Asset_WIP_Register"("WIPRegister_ID"),
    "AssetRegisterItem_ID" INTEGER,
    "ProjectId" INTEGER,
    "AssetId" INTEGER,
    "OrderValue" DECIMAL(18,2),
    "CompletionAmount" DECIMAL(18,2),
    "RetentionAmount" DECIMAL(18,2),
    "CompletionDate" TIMESTAMP,
    "SubCategory" VARCHAR(200),
    "AssetType" VARCHAR(200),
    "UsefulLife" INTEGER,
    "ResidualValue" DECIMAL(18,2),
    "UoM" INTEGER,
    "CreditAccount" VARCHAR(100),
    "DebitAmount" DECIMAL(18,2),
    "CreditAmount" DECIMAL(18,2),
    "DebitAccount" VARCHAR(100),
    "SendToBilling" SMALLINT DEFAULT 0,
    "Description" VARCHAR(500),
    "Amount" DECIMAL(18,2),
    "TransferDate" TIMESTAMP,
    "Status" VARCHAR(50) DEFAULT 'Pending',
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_WIPApprovalItems" (
    "Id" SERIAL PRIMARY KEY,
    "WIPRegister_ID" INTEGER REFERENCES "Asset_WIP_Register"("WIPRegister_ID"),
    "TransactionID" INTEGER,
    "IsApproved" SMALLINT DEFAULT 0,
    "ApproverID" INTEGER,
    "ApprovedDate" TIMESTAMP,
    "ProjectDR" INTEGER,
    "ProjectItemDR" INTEGER,
    "ProjectCR" INTEGER,
    "ProjectItemCR" INTEGER,
    "ApprovalDate" TIMESTAMP,
    "ApprovedByID" INTEGER,
    "Status" VARCHAR(50),
    "Comments" TEXT,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_BulkUploadJobs" (
    "ID" SERIAL PRIMARY KEY,
    "Filename" TEXT NOT NULL,
    "UserId" INTEGER NOT NULL DEFAULT 1,
    "IsDonated" INTEGER,
    "Activate_Validation" SMALLINT NOT NULL DEFAULT 1,
    "Processed" SMALLINT NOT NULL DEFAULT 0,
    "Date_Created" TIMESTAMP NOT NULL DEFAULT NOW(),
    "Job_Status" TEXT,
    "Date_Ran" TIMESTAMP,
    "No_RecordsInserted" INTEGER,
    "No_RecodsNotValidating" INTEGER,
    "Total_Records" INTEGER,
    "ValidationError_Path" TEXT,
    "ProcessDate" TIMESTAMP,
    "RunID" INTEGER,
    "ContractNumber" TEXT,
    "ApprovedByID" INTEGER,
    "ApprovedDate" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Asset_BulkValidation" (
    "Asset_BulkValidation_ID" SERIAL PRIMARY KEY,
    "Upload_JobID" INTEGER REFERENCES "Asset_BulkUploadJobs"("ID"),
    "RowNumber" INTEGER,
    "ComponentID_AssetRegisterID" VARCHAR(100),
    "AssetDescription" VARCHAR(100),
    "ParentAssetRegisterID" VARCHAR(100),
    "MunicipalAssetID" VARCHAR(100),
    "MainAssetID" VARCHAR(100),
    "MainAssetDescription" VARCHAR(100),
    "Barcode" VARCHAR(100),
    "ImageRef" VARCHAR(100),
    "AssetType" VARCHAR(100),
    "AssetCategory" VARCHAR(100),
    "AssetSub_Category" VARCHAR(100),
    "AssetClass" VARCHAR(100),
    "ComponentType" VARCHAR(100),
    "MeasurementType" VARCHAR(100),
    "AssetStatus" VARCHAR(100),
    "FinancialStatus" VARCHAR(100),
    "AcquisitionDate" VARCHAR(100),
    "CommisioningDate" VARCHAR(100),
    "InfrastructurOrNonInfrastructure" VARCHAR(100),
    "NatureOfAddition" VARCHAR(100),
    "CostOfAddition" VARCHAR(100),
    "InServiceDate" VARCHAR(100),
    "DisposalDate" VARCHAR(100),
    "ReasonforDisposal" VARCHAR(100),
    "ImpairmentDate" VARCHAR(100),
    "DateModified" VARCHAR(100),
    "VerifiedDate" VARCHAR(100),
    "VerificationDoneBy" VARCHAR(100),
    "YearConstructed" VARCHAR(100),
    "ForecastReplacementYear" VARCHAR(100),
    "AssetCondition" VARCHAR(100),
    "InsuranceCover" VARCHAR(100),
    "InsurancePolicyNo" VARCHAR(100),
    "Warranty" VARCHAR(100),
    "CurrentReplacementCostCRC" VARCHAR(100),
    "DepreciatedReplacementCostDRC" VARCHAR(100),
    "AnnualisedMaintenanceCRC" VARCHAR(100),
    "AnnualMaintenanceBudgetNeed" VARCHAR(100),
    "UsefulLifeMonthComponent" VARCHAR(100),
    "UsefulLifeYearComponent" VARCHAR(100),
    "RemainingUsefulLifeYearComponent" VARCHAR(100),
    "RemainingUsefulLifeMonthComponent" VARCHAR(100),
    "RemainingUsefulLifeAtTakeOn" VARCHAR(100),
    "ConstructionMaterial" VARCHAR(100),
    "UOM" VARCHAR(100),
    "Dim1" VARCHAR(100),
    "Dim2" VARCHAR(100),
    "Dim3" VARCHAR(100),
    "DimensionQuantity" VARCHAR(100),
    "Quantity" VARCHAR(100),
    "Diameter" VARCHAR(100),
    "Capacity" VARCHAR(100),
    "SGKey" VARCHAR(100),
    "DeedNumber" VARCHAR(100),
    "PortionNumber" VARCHAR(100),
    "ErfsizeM2" VARCHAR(100),
    "Make" VARCHAR(100),
    "Model" VARCHAR(100),
    "UnitNumber" VARCHAR(100),
    "RegistrationNumber" VARCHAR(100),
    "SerialNumber" VARCHAR(100),
    "CustodianName" VARCHAR(100),
    "CustodianIDNumber" VARCHAR(100),
    "BasicMunicipalityService" VARCHAR(100),
    "CriticalityGrade" VARCHAR(100),
    "PerformanceGrade" VARCHAR(100),
    "UtilisationGrade" VARCHAR(100),
    "InfrastructureHealthGrade" VARCHAR(100),
    "ConsequenceOfFailure" VARCHAR(100),
    "Risk" VARCHAR(100),
    "AssetOwnershipName" VARCHAR(100),
    "MunicipalDepartment" VARCHAR(100),
    "Division" VARCHAR(100),
    "Town" VARCHAR(100),
    "Suburb" VARCHAR(100),
    "Street" VARCHAR(100),
    "Building" VARCHAR(100),
    "Floor" VARCHAR(100),
    "Room" VARCHAR(100),
    "Zone" VARCHAR(100),
    "Ward" VARCHAR(100),
    "GISFeatureID" VARCHAR(100),
    "Lattitude" VARCHAR(100),
    "Longitude" VARCHAR(100),
    "FundingSourceNumber" VARCHAR(100),
    "FundingSourceAmount" VARCHAR(100),
    "FundingSource" VARCHAR(100),
    "FundType" VARCHAR(100),
    "PurchaseAmount_Cost" VARCHAR(100),
    "PurchaseAmountMovement" VARCHAR(100),
    "AccumulatedDepreciation" VARCHAR(100),
    "AccumulatedImpairment" VARCHAR(100),
    "DepreciationPerMonth" VARCHAR(100),
    "ResidualValue" VARCHAR(100),
    "FairValue" VARCHAR(100),
    "CarryingAmount" VARCHAR(100),
    "DonorName" VARCHAR(100),
    "DonorDate" VARCHAR(100),
    "DonorConditions" VARCHAR(100),
    "Custom1" VARCHAR(100),
    "Custom2" VARCHAR(100),
    "Custom3" VARCHAR(100),
    "Custom4" VARCHAR(100),
    "Custom5" VARCHAR(100),
    "Custom6" VARCHAR(100),
    "Custom7" VARCHAR(100),
    "Custom8" VARCHAR(100),
    "Custom9" VARCHAR(100),
    "RevaluationOpeningBalance" VARCHAR(100),
    "RevaluationDate" VARCHAR(100),
    "MovementInRevaluationReserve" VARCHAR(100),
    "TransferDate" VARCHAR(100),
    "DepreciationOffset" VARCHAR(100),
    "DeemedCost" VARCHAR(100),
    "CIDMSSubComponentType" VARCHAR(100),
    "CIDMSComponentType" VARCHAR(100),
    "CIDMSAccountingGroup" VARCHAR(100),
    "CIDMSSubAccountingGroup" VARCHAR(100),
    "CIDMSAssetClass" VARCHAR(100),
    "CIDMSAssetGroupType" VARCHAR(100),
    "CIDMSAssetType" VARCHAR(100),
    "CashOrNoncashgeneratingunit" VARCHAR(100),
    "FileName" VARCHAR(255),
    "AssetSetting_ID" INTEGER,
    "Description" VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS "Asset_Register_Items_Upload" (
    "AssetRegisterItemUpload_ID" SERIAL PRIMARY KEY,
    "Run_ID" INTEGER,
    "ComponentID_AssetRegisterID" VARCHAR(100),
    "Description" VARCHAR(500),
    "ParentAssetRegisterItem_ID" VARCHAR(100),
    "MunicipalAssetID" VARCHAR(100),
    "MainAssetID" VARCHAR(100),
    "MainAssetDescription" VARCHAR(500),
    "OldBarCode" VARCHAR(100),
    "Barcode" VARCHAR(100),
    "ImageRef" VARCHAR(255),
    "Financial_Status_ID" INTEGER,
    "AssetType_ID" INTEGER,
    "AssetCategory_ID" INTEGER,
    "Asset_SubCategory_ID" INTEGER,
    "AssetClass_ID" INTEGER,
    "ComponentType" INTEGER,
    "MeasurementType_ID" INTEGER,
    "AssetStatus_ID" INTEGER,
    "AcquisitionDate" TIMESTAMP,
    "CommisioningDate" TIMESTAMP,
    "InserviceDate" TIMESTAMP,
    "UsefulLifeYearComponent" NUMERIC(18,8),
    "UsefulLifeMonthComponent" NUMERIC(18,8),
    "Remaining_Useful_Life_Year" NUMERIC(18,8),
    "RemainingUsefulLife" NUMERIC(18,8),
    "RemainingUsefulLifeAtTakeOn" NUMERIC(18,8),
    "AssetCondition_ID" INTEGER,
    "InsuranceCover" VARCHAR(10),
    "InsurancePolicyNo" VARCHAR(100),
    "UOM" INTEGER,
    "Dim1" DECIMAL(18,4),
    "Dim2" DECIMAL(18,4),
    "Dim3" DECIMAL(18,4),
    "DimensionQuantity" DECIMAL(18,4),
    "Quantity" DECIMAL(18,4),
    "Diameter" DECIMAL(18,4),
    "Capacity" DECIMAL(18,4),
    "SGKey" VARCHAR(100),
    "DeedNumber" VARCHAR(100),
    "ErfNumber" VARCHAR(100),
    "PortionNumber" VARCHAR(100),
    "ErfSizeM2" DECIMAL(18,4),
    "Custodian_ID" INTEGER,
    "CustodianIdNumber" VARCHAR(50),
    "AssetOwnershipName" VARCHAR(200),
    "MunicipalDepartment_ID" INTEGER,
    "Division" INTEGER,
    "Town" INTEGER,
    "Suburb" INTEGER,
    "Street" INTEGER,
    "Building" INTEGER,
    "Floor" INTEGER,
    "Room" INTEGER,
    "Zone" INTEGER,
    "Ward" INTEGER,
    "GISFeatureID" VARCHAR(100),
    "latitude" DECIMAL(18,8),
    "longitude" DECIMAL(18,8),
    "FundingSourceNumber" VARCHAR(100),
    "FundingSourceAmount" DECIMAL(18,2),
    "FundingSource" VARCHAR(200),
    "FundType" VARCHAR(100),
    "PurchaseAmount" DECIMAL(18,2),
    "PurchaseAmountMovement" DECIMAL(18,2),
    "ResidualValue" DECIMAL(18,2),
    "AccumulatedDepreciationClosingBalance" DECIMAL(18,2),
    "AccumulatedImpairmentClosingBalance" DECIMAL(18,2),
    "DepreciationPerMonth" DECIMAL(18,2),
    "FairValue" DECIMAL(18,2),
    "CarryingAmountClosingBalance" DECIMAL(18,2),
    "PurchaseAmount_Cost2" DECIMAL(18,2),
    "DonorName" VARCHAR(200),
    "DonorDate" TIMESTAMP,
    "DonorConditions" TEXT,
    "Custom1" VARCHAR(200),
    "Custom2" VARCHAR(200),
    "Custom3" VARCHAR(200),
    "Custom4" VARCHAR(200),
    "Custom5" VARCHAR(200),
    "Custom6" VARCHAR(200),
    "Custom7" VARCHAR(200),
    "Custom8" VARCHAR(200),
    "Custom9" VARCHAR(200),
    "Make" VARCHAR(100),
    "Model" VARCHAR(100),
    "UnitNumber" VARCHAR(100),
    "RegistrationNumber" VARCHAR(100),
    "SerialNumber" VARCHAR(100),
    "Warranty" VARCHAR(10),
    "CurrentReplacementCostCRC" DECIMAL(18,2),
    "DepreciatedReplacementCostDRC" DECIMAL(18,2),
    "AnnualisedMaintenanceCRC" DECIMAL(18,2),
    "AnnualMaintenanceBudgetNeed" DECIMAL(18,2),
    "CIDMSSubComponentTypeID" INTEGER,
    "CIDMSComponentType" INTEGER,
    "CIDMSAccountingGroup" INTEGER,
    "CIDMSSubAccountingGroup" INTEGER,
    "CIDMSAssetClass" INTEGER,
    "CIDMSAssetGroupType" INTEGER,
    "CIDMSAssetType" INTEGER,
    "CashOrNoncashgeneratingunit" VARCHAR(50),
    "InfrastructurOrNonInfrastructure" VARCHAR(50),
    "NatureOfAddition" VARCHAR(50),
    "ConstructionMaterial" VARCHAR(100),
    "VerificationDate" TIMESTAMP,
    "VerificationDoneBy" VARCHAR(100),
    "YearConstructed" VARCHAR(50),
    "ForecastReplacementYear" VARCHAR(50),
    "DateOfDisposal" TIMESTAMP,
    "ReasonforDisposal" VARCHAR(200),
    "Impairment_Date" TIMESTAMP,
    "CostOfAddition" DECIMAL(18,2),
    "BasicMunicipalityService" INTEGER,
    "CriticalityGrade" INTEGER,
    "PerformanceGrade" INTEGER,
    "UtilisationGrade" INTEGER,
    "InfrastructureHealthGrade" INTEGER,
    "ConsequenceOfFailure" VARCHAR(50),
    "Risk" INTEGER,
    "RevaluationOpeningBalance" DECIMAL(18,2),
    "RevaluationDate" TIMESTAMP,
    "MovementInRevaluationReserve" DECIMAL(18,2),
    "RevaluationValue" DECIMAL(18,2),
    "TransferDate" TIMESTAMP,
    "TransferFromAmount" DECIMAL(18,2),
    "TransferToAmount" DECIMAL(18,2),
    "DepreciationOffset" DECIMAL(18,2),
    "DeemedCost" VARCHAR(10),
    "RevaluationImpairmentOpeningBalance" DECIMAL(18,2),
    "FinYear" VARCHAR(9),
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "Capturer_ID" INTEGER DEFAULT 1,
    "DebitPlanProjectItemID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_RequestType_sys" (
    "RequestType_ID" SERIAL PRIMARY KEY,
    "RequestDesc" VARCHAR(50) NOT NULL,
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_AuditTrail" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER,
    "entity_type" VARCHAR(100),
    "entity_id" VARCHAR(100),
    "action" VARCHAR(50),
    "timestamp" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "User_UserProcessingMonth" (
    "UserProcessingMonth_ID" SERIAL PRIMARY KEY,
    "UserID" INTEGER NOT NULL,
    "ProcessingMonth" INTEGER NOT NULL,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "DateModified" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Asset_OrganisationSettings" (
    "id" SERIAL PRIMARY KEY,
    "municipality_name" VARCHAR(200) DEFAULT 'Mnquma Local Municipality',
    "financial_year" VARCHAR(20) DEFAULT '2025/2026',
    "financial_year_start_month" INTEGER DEFAULT 7,
    "current_period" INTEGER DEFAULT 9,
    "current_period_month" INTEGER DEFAULT 9,
    "mscoa_enabled" BOOLEAN DEFAULT FALSE,
    "measurement_model" VARCHAR(50) DEFAULT 'Cost',
    "settings" JSONB,
    "updated_at" TIMESTAMP DEFAULT NOW()
);
ALTER TABLE "Asset_OrganisationSettings" ADD COLUMN IF NOT EXISTS "financial_year" VARCHAR(20) DEFAULT '2025/2026';

CREATE TABLE IF NOT EXISTS "Asset_WorkflowDefinitions" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(200) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "steps" JSONB,
    "is_active" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Asset_WorkflowInstances" (
    "id" SERIAL PRIMARY KEY,
    "definition_id" INTEGER REFERENCES "Asset_WorkflowDefinitions"("id"),
    "entity_type" VARCHAR(100),
    "entity_id" VARCHAR(100),
    "current_step" INTEGER DEFAULT 1,
    "status" VARCHAR(50) DEFAULT 'pending',
    "initiated_by" INTEGER,
    "data" JSONB,
    "mssql_reference_id" VARCHAR(100),
    "initiated_at" TIMESTAMP DEFAULT NOW(),
    "completed_at" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Asset_WorkflowApprovals" (
    "id" SERIAL PRIMARY KEY,
    "instance_id" INTEGER REFERENCES "Asset_WorkflowInstances"("id"),
    "step_number" INTEGER,
    "approver_id" INTEGER,
    "action" VARCHAR(50),
    "comments" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Asset_Documents" (
    "id" SERIAL PRIMARY KEY,
    "entity_type" VARCHAR(100),
    "entity_id" VARCHAR(100),
    "file_name" VARCHAR(500),
    "file_path" VARCHAR(500),
    "file_size" BIGINT,
    "mime_type" VARCHAR(200),
    "uploaded_by" INTEGER,
    "description" TEXT,
    "uploaded_at" TIMESTAMP DEFAULT NOW()
);

-- Legacy maintenance_requests table removed — superseded by Asset_MaintenanceRequest
-- (see Maintenance Module Tables section below)
DROP TABLE IF EXISTS "maintenance_requests";

CREATE TABLE IF NOT EXISTS "Asset_TripRequests" (
    "id" SERIAL PRIMARY KEY,
    "vehicle_asset_id" INTEGER,
    "requestor_id" INTEGER,
    "driver_id" INTEGER,
    "purpose" TEXT,
    "destination" VARCHAR(500),
    "departure_date" TIMESTAMP,
    "return_date" TIMESTAMP,
    "passengers" INTEGER,
    "mscoa_string" VARCHAR(200),
    "status" VARCHAR(50) DEFAULT 'pending',
    "approved_by" INTEGER,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Asset_FleetInspections" (
    "id" SERIAL PRIMARY KEY,
    "vehicle_asset_id" INTEGER,
    "inspection_type" VARCHAR(100),
    "trip_request_id" INTEGER,
    "inspector_id" INTEGER,
    "checklist_results" JSONB,
    "overall_status" VARCHAR(50),
    "comments" TEXT,
    "inspected_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Asset_FleetBookingSchedule" (
    "id" SERIAL PRIMARY KEY,
    "vehicle_asset_id" INTEGER,
    "booked_by" INTEGER,
    "booked_for_date" TIMESTAMP,
    "purpose" TEXT,
    "status" VARCHAR(50) DEFAULT 'booked',
    "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Asset_TrackingZones" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(200) NOT NULL,
    "boundary_polygon" JSONB,
    "zone_type" VARCHAR(100),
    "is_active" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Asset_TrackingAlerts" (
    "id" SERIAL PRIMARY KEY,
    "acknowledged_by" INTEGER,
    "acknowledged_at" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Asset_ImportBatches" (
    "id" SERIAL PRIMARY KEY,
    "file_name" VARCHAR(500),
    "total_rows" INTEGER,
    "valid_rows" INTEGER,
    "error_rows" INTEGER,
    "committed_rows" INTEGER,
    "status" VARCHAR(50) DEFAULT 'pending',
    "errors" JSONB,
    "data" JSONB,
    "imported_by" INTEGER,
    "imported_at" TIMESTAMP DEFAULT NOW(),
    "committed_at" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Asset_AiInsights" (
    "id" SERIAL PRIMARY KEY,
    "insight_type" VARCHAR(100),
    "severity" VARCHAR(50),
    "description" TEXT,
    "entity_type" VARCHAR(100),
    "entity_id" VARCHAR(100),
    "is_dismissed" BOOLEAN DEFAULT FALSE,
    "dismissed_by" INTEGER,
    "dismissed_at" TIMESTAMP,
    "generated_at" TIMESTAMP DEFAULT NOW()
);


INSERT INTO "Asset_AiInsights" ("insight_type", "severity", "title", "message", "recommendation", "confidence_score", "legislation_ref", "entity_type", "is_dismissed")
SELECT * FROM (VALUES
  ('Depreciation', 'warning', 'Assets Approaching End of Useful Life',
   'Several infrastructure assets have a remaining useful life of less than 12 months. These assets may require replacement or refurbishment planning in the upcoming budget cycle.',
   'Initiate a condition assessment for assets with RUL < 12 months and include replacement costs in the Medium-Term Revenue and Expenditure Framework (MTREF).',
   88, 'GRAP 17.56 / MFMA §19', 'Asset', FALSE),
  ('Impairment', 'critical', 'Unreviewed Impairment Indicators Detected',
   'A number of assets have condition ratings of Poor or Very Poor but have not had an impairment review conducted in the current financial year. This may result in carrying amounts that exceed recoverable service amounts.',
   'Conduct formal impairment assessments for all assets rated Poor or Very Poor in accordance with GRAP 26. Document findings in the asset register before year-end.',
   92, 'GRAP 26.10 / MFMA §63', 'Asset', FALSE),
  ('Revaluation', 'info', 'Revaluation Cycle Due for Infrastructure Assets',
   'Infrastructure assets under the revaluation model are approaching the 3-year revaluation cycle. The next revaluation date is within 6 months. Carrying amounts may materially differ from fair value if not updated.',
   'Engage a registered valuer to perform a desktop or full revaluation before the end of the financial year to ensure GRAP 17.39–42 compliance.',
   80, 'GRAP 17.39–42', 'Asset', FALSE),
  ('Disposal', 'warning', 'Disposed Assets Still Reflected in Register',
   'Assets with a recorded disposal date have non-zero carrying amounts still appearing in the active asset register. This inflates total asset values reported to Council.',
   'Review all disposal records to confirm the derecognition journal has been processed. Ensure profit or loss on disposal is correctly disclosed per GRAP 17.67.',
   90, 'GRAP 17.67 / mSCOA Seg 6', 'Disposal', FALSE),
  ('Compliance', 'info', 'Annual Asset Verification Not Yet Completed',
   'The annual physical verification of assets has not been recorded for the current financial year. MFMA requires municipalities to verify the existence and condition of all assets annually.',
   'Schedule a physical asset count and update condition ratings in the asset register. Retain sign-off documentation for the external audit.',
   85, 'MFMA §63 / AG Audit Finding', 'Asset', FALSE)
) AS v("insight_type","severity","title","message","recommendation","confidence_score","legislation_ref","entity_type","is_dismissed")
WHERE NOT EXISTS (SELECT 1 FROM "Asset_AiInsights" WHERE "is_dismissed" = FALSE LIMIT 1);

INSERT INTO "Asset_OrganisationSettings" ("municipality_name", "financial_year", "financial_year_start_month", "current_period", "current_period_month", "mscoa_enabled", "measurement_model")
SELECT 'Mnquma Local Municipality', '2025/2026', 7, 9, 9, FALSE, 'Cost'
WHERE NOT EXISTS (SELECT 1 FROM "Asset_OrganisationSettings" LIMIT 1);

-- ===== Ledger / Planning / Reference Tables =====

CREATE TABLE IF NOT EXISTS "Const_Asset_DepreciationStatus" (
    "Asset_DepreciationStatus_ID" SERIAL PRIMARY KEY,
    "StatusDescription" VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Const_AssetJournalTransactionType_Sys" (
    "AssetJournalTransactionType_ID" INTEGER PRIMARY KEY,
    "AssetJournalTransactionDesc" VARCHAR(200) NOT NULL,
    "Const_DocumentTypeID" INTEGER,
    "Enabled" SMALLINT NOT NULL DEFAULT 1,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CapturerID" INTEGER NOT NULL DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_DocumentType" (
    "DocumentType_ID" INTEGER PRIMARY KEY,
    "DocumentTypeDesc" VARCHAR(200) NOT NULL DEFAULT '',
    "Enabled" SMALLINT NOT NULL DEFAULT 1,
    "CapturerID" INTEGER NOT NULL DEFAULT 1,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ModifierID" INTEGER,
    "DateModified" TIMESTAMP,
    "DocumentOrder" INTEGER,
    "ModuleID" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "Const_ReferenceType_sys" (
    "ReferenceType_ID" INTEGER PRIMARY KEY,
    "Name" VARCHAR(250) NOT NULL,
    "Enabled" SMALLINT NOT NULL DEFAULT 1,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CapturerID" INTEGER NOT NULL DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_ReferenceData_sys" (
    "ReferenceData_ID" INTEGER PRIMARY KEY,
    "ReferenceTypeID" INTEGER NOT NULL,
    "Description" VARCHAR(250) NOT NULL,
    "Enabled" SMALLINT NOT NULL DEFAULT 1,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CapturerID" INTEGER NOT NULL DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Led_Vote" (
    "Vote_ID" SERIAL PRIMARY KEY,
    "Vote" VARCHAR(50) NOT NULL,
    "VoteDesc" TEXT,
    "VoteStatusID" INTEGER,
    "FinYear" VARCHAR(9) NOT NULL,
    "CapturerID" INTEGER NOT NULL DEFAULT 1,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ModifierID" INTEGER,
    "DateModified" TIMESTAMP,
    "VatIndicatorID" INTEGER,
    "VoteTypeID" INTEGER,
    "ControlVote" SMALLINT NOT NULL DEFAULT 0,
    "SCOAItemID" INTEGER,
    "SCOAItemCode" VARCHAR(50),
    "IsBrokenDown" SMALLINT,
    "OldVoteNumber" VARCHAR(100),
    "Vote1" VARCHAR(50),
    "OldFms56VoteNumber" VARCHAR(50),
    "CapitalTimePeriodID" INTEGER,
    "Parent_Vote_ID" INTEGER,
    "TakeOnID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Plan_Project" (
    "Project_ID" INTEGER PRIMARY KEY,
    "ProjectName" VARCHAR(500) NOT NULL,
    "ProjectDesc" VARCHAR(500) NOT NULL DEFAULT '',
    "ProjectManagerID" INTEGER,
    "SupplyChainOfficialID" INTEGER,
    "CapitalOperation" INTEGER,
    "CostEstimate" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "ScoaProjectID" INTEGER NOT NULL DEFAULT 0,
    "EstimatedStartDate" TIMESTAMP,
    "EstimatedEndDate" TIMESTAMP,
    "ProjectStatus" INTEGER NOT NULL DEFAULT 0,
    "CommencementDate" TIMESTAMP,
    "CapturerID" INTEGER NOT NULL DEFAULT 1,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ModifierID" INTEGER,
    "DateModified" TIMESTAMP,
    "FinYear" VARCHAR(9),
    "ProjectDetailDesc" VARCHAR(500),
    "ProjectCategoryID" INTEGER,
    "ProjectImplementAgentID" INTEGER,
    "Longitude" VARCHAR(200),
    "Latitude" VARCHAR(200),
    "ProgrammeManagerID" INTEGER,
    "FinancialControllerID" INTEGER,
    "ProjectTypeID" INTEGER,
    "EstimatedDuration" INTEGER,
    "ProjectDistinctionID" INTEGER,
    "IsDeleted" SMALLINT,
    "HistoricalProjectCode" VARCHAR(100),
    "ProjectParentID" INTEGER,
    "SingleMultiYear" VARCHAR(5),
    "PreviousReferenceId" INTEGER,
    "ProjectCode" INTEGER,
    "CostingProject" SMALLINT
);

CREATE TABLE IF NOT EXISTS "Plan_ProjectItem" (
    "PlanProjectItem_ID" INTEGER PRIMARY KEY,
    "ProjectID" INTEGER NOT NULL,
    "ProjectItemID" INTEGER,
    "ProjectItemCode" INTEGER,
    "SCOAItemID" INTEGER NOT NULL,
    "FinYear" VARCHAR(9) NOT NULL,
    "CapturerID" INTEGER NOT NULL DEFAULT 1,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "ModifierID" INTEGER,
    "DateModified" TIMESTAMP,
    "ProjectFundYearID" INTEGER,
    "SCOAFundId" INTEGER,
    "BudgetAmount" DECIMAL(16,2),
    "BudgetAmountCurP1" DECIMAL(16,2),
    "BudgetAmountCurP2" DECIMAL(16,2),
    "SCOAFunctionId" INTEGER,
    "SCOARegionId" INTEGER,
    "DivisionId" INTEGER,
    "BudgetSplitID" INTEGER,
    "VirementId" INTEGER,
    "HistoricalProjectCode" VARCHAR(100),
    "AdjustmentId" INTEGER,
    "ModificationNumber" INTEGER,
    "SCOACostingID" INTEGER,
    "IsItemLocked" SMALLINT,
    "CreditDebit" VARCHAR(6),
    "PreviousReferenceId" INTEGER,
    "GRAPClassification" TEXT,
    "GRAPClassificationNote" TEXT,
    "MainSegmentReporting" TEXT,
    "SubSegmentReporting" TEXT,
    "IsActiveForSCM" SMALLINT,
    "ZeroBudgetItem" SMALLINT,
    "ZeroBudgetItemReason" TEXT
);

CREATE TABLE IF NOT EXISTS "Led_Journal_Asset" (
    "AssetJournal_ID" SERIAL PRIMARY KEY,
    "FinYear" VARCHAR(9) NOT NULL,
    "ProcessingMonth" INTEGER NOT NULL,
    "TransactionID" UUID NOT NULL,
    "AssetJournalTransactionTypeID" INTEGER NOT NULL,
    "TransactionDate" TIMESTAMP NOT NULL,
    "DebitVoteID" INTEGER,
    "CreditVoteID" INTEGER,
    "Amount" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "DocumentNumber" VARCHAR(50),
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CapturerID" INTEGER NOT NULL DEFAULT 1,
    "IsAuthorised" SMALLINT,
    "FinAuthorisedByID" INTEGER,
    "FinAuthorisedDate" TIMESTAMP,
    "ReferenceNumber" VARCHAR(50),
    "ItemDescription" VARCHAR(200),
    "intDocNumber" INTEGER,
    "AssetAcquisitionID" INTEGER,
    "AssetImprovementID" INTEGER,
    "AssetTransferID" INTEGER,
    "Asset_RegisterItem_ID" INTEGER,
    "Deprecation_ScheduledDate" TIMESTAMP,
    "Deprecation_ScheduleID" INTEGER,
    "Deprecation_ScheduleItemID" INTEGER,
    "SCOAFundsID" INTEGER,
    "SCOARegionID" INTEGER,
    "SCOACostingID" INTEGER,
    "SCOAProjectID" INTEGER,
    "SCOAFunctionID" INTEGER,
    "SCOAItemID" INTEGER,
    "DivisionID" INTEGER,
    "Asset_Led_Header_ID" INTEGER,
    "Depreciation_RunType" VARCHAR(200),
    "AssetMisclassificationID" INTEGER,
    "Reversal_AssetJournal_ID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_GeneralLedger" (
    "GenLedger_ID" SERIAL PRIMARY KEY,
    "PostingDate" TIMESTAMP NOT NULL,
    "ProcessingMonth" INTEGER NOT NULL,
    "VoteID" INTEGER,
    "FinYear" VARCHAR(12) NOT NULL,
    "TransactionTypeID" INTEGER,
    "TransactionDetails" VARCHAR(235),
    "DocumentNumber" VARCHAR(50),
    "Debit" DECIMAL(16,2),
    "Credit" DECIMAL(16,2),
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER,
    "MatchTranGuid" UUID,
    "JournalTransactionTypeID" INTEGER,
    "AssetLinkID" INTEGER,
    "SCOAFundsID" INTEGER,
    "SCOARegionID" INTEGER,
    "SCOACostingID" INTEGER,
    "SCOAProjectID" INTEGER,
    "SCOAFunctionID" INTEGER,
    "SCOAItemID" INTEGER NOT NULL,
    "DivisionID" INTEGER,
    "ProjectID" INTEGER,
    "PlanProjectItemID" INTEGER
);

CREATE INDEX IF NOT EXISTS idx_category_type ON "Const_AssetCategory_sys"("TypeID");
CREATE INDEX IF NOT EXISTS idx_subcategory_type ON "Const_Asset_SubCategory"("TypeID");
CREATE INDEX IF NOT EXISTS idx_subcategory_category ON "Const_Asset_SubCategory"("AssetCategoryID");
CREATE INDEX IF NOT EXISTS idx_class_type ON "Const_AssetClass_sys"("TypeID");
CREATE INDEX IF NOT EXISTS idx_class_category ON "Const_AssetClass_sys"("AssetCategoryID");
CREATE INDEX IF NOT EXISTS idx_class_subcategory ON "Const_AssetClass_sys"("Asset_SubCategory_ID");
CREATE INDEX IF NOT EXISTS idx_class_status ON "Const_AssetClass_sys"("AssetStatus_ID");
CREATE INDEX IF NOT EXISTS idx_cidms_subgroup_group ON "Const_Asset_CIDMS_Accounting_Sub_Group"("AssetAccountGroupID");
CREATE INDEX IF NOT EXISTS idx_cidms_class_subgroup ON "Const_Asset_CIDMS_Class"("AssetAccountSubGroupID");
CREATE INDEX IF NOT EXISTS idx_cidms_grouptype_class ON "Const_Asset_CIDMS_Group_Type"("AssetCIDMSClassID");
CREATE INDEX IF NOT EXISTS idx_cidms_assettype_grouptype ON "Const_Asset_CIDMS_Asset_Type"("AssetCIDMSGroupTypeID");
CREATE INDEX IF NOT EXISTS idx_cidms_comptype_assettype ON "Const_Asset_CIDMS_Component_Type"("AssetCIDMSAssetTypeID");
CREATE INDEX IF NOT EXISTS idx_cidms_subcomptype_comptype ON "Const_Asset_CIDMS_SubComponent_Type"("AssetCIDMSComponentTypeID");
CREATE INDEX IF NOT EXISTS idx_division_department ON "Const_Division"("DepartmentID");
CREATE INDEX IF NOT EXISTS idx_asset_register_type ON "Asset_Register_Items"("AssetType_ID");
CREATE INDEX IF NOT EXISTS idx_asset_register_category ON "Asset_Register_Items"("AssetCategory_ID");
CREATE INDEX IF NOT EXISTS idx_asset_register_runid ON "Asset_Register_Items"("Run_ID");
CREATE INDEX IF NOT EXISTS idx_asset_register_barcode ON "Asset_Register_Items"("Barcode");
CREATE INDEX IF NOT EXISTS idx_upload_items_runid ON "Asset_Register_Items_Upload"("Run_ID");
CREATE INDEX IF NOT EXISTS idx_bulk_validation_jobid ON "Asset_BulkValidation"("Upload_JobID");
CREATE INDEX IF NOT EXISTS idx_bulk_jobs_runid ON "Asset_BulkUploadJobs"("RunID");
CREATE INDEX IF NOT EXISTS idx_depreciation_asset ON "Asset_Depreciation"("AssetRegisterItem_ID");
CREATE INDEX IF NOT EXISTS idx_transactions_asset ON "Asset_Register_Transactions"("AssetRegisterItem_ID");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='Asset_Disposal' AND indexname='idx_disposal_asset') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Disposal' AND column_name='AssetItemID') THEN
      EXECUTE 'CREATE INDEX idx_disposal_asset ON "Asset_Disposal"("AssetItemID")';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Disposal' AND column_name='AssetRegisterItem_ID') THEN
      EXECUTE 'CREATE INDEX idx_disposal_asset ON "Asset_Disposal"("AssetRegisterItem_ID")';
    END IF;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_employee_idno ON "Payroll_Employee"("IdNo");

-- Ensure grade table columns exist for existing databases
ALTER TABLE "Const_Asset_Criticality_Grade" ADD COLUMN IF NOT EXISTS "ConsequenceOfFailure" VARCHAR(250);
ALTER TABLE "Const_Asset_Criticality_Grade" ADD COLUMN IF NOT EXISTS "QualitiveDesc" VARCHAR(250);
ALTER TABLE "Const_Asset_Health_Grade" ADD COLUMN IF NOT EXISTS "DRC" VARCHAR(250);

-- Ensure upload table has all financial columns for existing databases
ALTER TABLE "Asset_Register_Items_Upload" ADD COLUMN IF NOT EXISTS "PurchaseAmount_Cost2" DECIMAL(18,2);
ALTER TABLE "Asset_Register_Items_Upload" ALTER COLUMN "UsefulLifeYearComponent" TYPE NUMERIC(18,8);
ALTER TABLE "Asset_Register_Items_Upload" ALTER COLUMN "UsefulLifeMonthComponent" TYPE NUMERIC(18,8);
ALTER TABLE "Asset_Register_Items_Upload" ALTER COLUMN "Remaining_Useful_Life_Year" TYPE NUMERIC(18,8);
ALTER TABLE "Asset_Register_Items_Upload" ALTER COLUMN "RemainingUsefulLife" TYPE NUMERIC(18,8);
ALTER TABLE "Asset_Register_Items_Upload" ALTER COLUMN "RemainingUsefulLifeAtTakeOn" TYPE NUMERIC(18,8);
ALTER TABLE "Asset_Register_Items_Upload" ALTER COLUMN "MunicipalDepartment_ID" TYPE VARCHAR(250) USING "MunicipalDepartment_ID"::VARCHAR;
ALTER TABLE "Asset_Register_Items_Upload" ALTER COLUMN "Division" TYPE VARCHAR(250) USING "Division"::VARCHAR;
ALTER TABLE "Asset_Register_Items_Upload" ALTER COLUMN "Town" TYPE VARCHAR(250) USING "Town"::VARCHAR;
ALTER TABLE "Asset_Register_Items_Upload" ALTER COLUMN "Suburb" TYPE VARCHAR(250) USING "Suburb"::VARCHAR;
ALTER TABLE "Asset_Register_Items_Upload" ALTER COLUMN "Street" TYPE VARCHAR(250) USING "Street"::VARCHAR;
ALTER TABLE "Asset_Register_Items_Upload" ALTER COLUMN "Building" TYPE VARCHAR(250) USING "Building"::VARCHAR;
ALTER TABLE "Asset_Register_Items_Upload" ALTER COLUMN "Floor" TYPE VARCHAR(250) USING "Floor"::VARCHAR;
ALTER TABLE "Asset_Register_Items_Upload" ALTER COLUMN "Room" TYPE VARCHAR(250) USING "Room"::VARCHAR;
ALTER TABLE "Asset_Register_Items_Upload" ALTER COLUMN "Zone" TYPE VARCHAR(250) USING "Zone"::VARCHAR;
ALTER TABLE "Asset_Register_Items_Upload" ALTER COLUMN "Ward" TYPE VARCHAR(250) USING "Ward"::VARCHAR;
ALTER TABLE "Asset_Register_Items_Upload" ADD COLUMN IF NOT EXISTS "WellKnownTextWKT" TEXT;
ALTER TABLE "Asset_Register_Items_Upload" ADD COLUMN IF NOT EXISTS "RevaluationReserve" DECIMAL(18,2);
ALTER TABLE "Asset_Register_Items_Upload" ADD COLUMN IF NOT EXISTS "RevaluationValue" DECIMAL(18,2);
ALTER TABLE "Asset_Register_Items_Upload" ADD COLUMN IF NOT EXISTS "RevaluationImpairmentOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Register_Items_Upload" ADD COLUMN IF NOT EXISTS "TransferFromAmount" DECIMAL(18,2);
ALTER TABLE "Asset_Register_Items_Upload" ADD COLUMN IF NOT EXISTS "TransferToAmount" DECIMAL(18,2);
ALTER TABLE "Asset_Register_Items_Upload" ADD COLUMN IF NOT EXISTS "DebitPlanProjectItemID" VARCHAR(100);

-- ===== Ensure Asset_Register_Transactions matches spec for existing databases =====
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "PurchaseAmount" DECIMAL(18,8) DEFAULT 0;
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "ResidualValue" DECIMAL(18,8) DEFAULT 0;
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "CurrentValue" DECIMAL(18,8) DEFAULT 0;
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "UsefulLife" INTEGER DEFAULT 0;
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "RemaingUsefulLife" DECIMAL(18,8) DEFAULT 0;
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "DepreciationValue" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "ImpairmentValue" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "RevaluationValue" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "FairValue" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "DisposalValue" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "DisposalLossValue" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "DisposalTotalValue" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "AccumulatedDepreciation" DECIMAL(18,8) DEFAULT 0;
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "AccumulatedImpairment" DECIMAL(18,8) DEFAULT 0;
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "AccumulatedFairValue" DECIMAL(18,8) DEFAULT 0;
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "AccumulatedRevaluation" DECIMAL(18,8) DEFAULT 0;
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "FinancialPeriod" INTEGER DEFAULT 0;
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "FinancialYear" VARCHAR(10) DEFAULT '';
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "DocumentType_ID" INTEGER;
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "GLGUID_ID" VARCHAR(50);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "TransactionSource_ID" INTEGER;
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "Modifier" INTEGER DEFAULT 0;
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "ImpairmentReversalValue" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "AccumulatedImpairmentReversal" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "ImpairmentSurplus" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "RefurbImpairmentValue" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "MovementInRevaluationReserve" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "DepreciationOffset" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "RevaluationReserveImpairment" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "RevaluationReserveImpairmentReversal" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "RevaluationReserveRevaluation" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "RevaluationReserveDisposal" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "DepreciationAdjustment" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "TransferFromValue" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "TransferToValue" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "RefurbDTValue" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "RefurbCTValue" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "RefurbDepreciationValue" DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ADD COLUMN IF NOT EXISTS "RefurbRevaluationValue" DECIMAL(18,8);
-- Drop legacy columns not in the spec
ALTER TABLE "Asset_Register_Transactions" DROP COLUMN IF EXISTS "TransactionAmount";
ALTER TABLE "Asset_Register_Transactions" DROP COLUMN IF EXISTS "Description";
ALTER TABLE "Asset_Register_Transactions" DROP COLUMN IF EXISTS "FinYear";
ALTER TABLE "Asset_Register_Transactions" DROP COLUMN IF EXISTS "DateCaptured";
ALTER TABLE "Asset_Register_Transactions" DROP COLUMN IF EXISTS "CapturerID";
ALTER TABLE "Asset_Register_Transactions" DROP COLUMN IF EXISTS "ModifierID";
-- Fix column types to match spec
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "GLGUID_ID" TYPE VARCHAR(50) USING "GLGUID_ID"::VARCHAR;
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "UsefulLife" TYPE INTEGER USING COALESCE("UsefulLife"::INTEGER, 0);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "PurchaseAmount" TYPE DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "ResidualValue" TYPE DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "CurrentValue" TYPE DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "RemaingUsefulLife" TYPE DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "DepreciationValue" TYPE DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "ImpairmentValue" TYPE DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "RevaluationValue" TYPE DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "FairValue" TYPE DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "DisposalValue" TYPE DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "DisposalLossValue" TYPE DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "DisposalTotalValue" TYPE DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "AccumulatedDepreciation" TYPE DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "AccumulatedImpairment" TYPE DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "AccumulatedFairValue" TYPE DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "AccumulatedRevaluation" TYPE DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "ImpairmentReversalValue" TYPE DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "AccumulatedImpairmentReversal" TYPE DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "ImpairmentSurplus" TYPE DECIMAL(18,8);
ALTER TABLE "Asset_Register_Transactions" ALTER COLUMN "RevaluationReserveDisposal" TYPE DECIMAL(18,8);

-- ===== Expand Asset_Transaction_Summary for full SP support =====
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AssetRegisterItemID" INTEGER;
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "FinancialYear" VARCHAR(9);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "FinancialPeriod" INTEGER;
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RemainingUsefulLife" DECIMAL(18,8);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "CurrentValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AccumulatedDepreciationOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "DepreciationValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AccumulatedDepreciationClosingBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AccumulatedImpairmentOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "ImpairmentValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AccumulatedImpairmentClosingBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AccumulatedFairValueOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "FairValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AccumulatedFairValueClosingBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AccumulatedRevaluationOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RevaluationValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AccumulatedRevaluationClosingBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AccumulatedImpairmentReversalOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "ImpairmentReversalValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AccumulatedImpairmentReversalClosingBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "DisposalOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "DisposalValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "DisposalLossValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "DisposalTotalValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "DisposalClosingBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AdditionOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AdditionVaue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AdditionClosingBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "MovementInRevaluationReserve" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "CostOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "CostClosingBalance" DECIMAL(18,2);
-- Drop legacy columns that are no longer in the standard structure
ALTER TABLE "Asset_Transaction_Summary" DROP COLUMN IF EXISTS "OpeningCost";
ALTER TABLE "Asset_Transaction_Summary" DROP COLUMN IF EXISTS "Additions";
ALTER TABLE "Asset_Transaction_Summary" DROP COLUMN IF EXISTS "Disposals";
ALTER TABLE "Asset_Transaction_Summary" DROP COLUMN IF EXISTS "Transfers";
ALTER TABLE "Asset_Transaction_Summary" DROP COLUMN IF EXISTS "Impairments";
ALTER TABLE "Asset_Transaction_Summary" DROP COLUMN IF EXISTS "Revaluations";
ALTER TABLE "Asset_Transaction_Summary" DROP COLUMN IF EXISTS "ClosingCost";
ALTER TABLE "Asset_Transaction_Summary" DROP COLUMN IF EXISTS "OpeningAccDepreciation";
ALTER TABLE "Asset_Transaction_Summary" DROP COLUMN IF EXISTS "DepreciationCharge";
ALTER TABLE "Asset_Transaction_Summary" DROP COLUMN IF EXISTS "ClosingAccDepreciation";


-- ===== Expand Asset_Impairment for SP columns =====
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "Asset_ItemID" INTEGER;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "RemainingUsefulLife" DECIMAL(18,8);
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "CatchUpDepreciation" DECIMAL(18,2);
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "CatchUpDays" INTEGER DEFAULT 0;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "Approved" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "ApprovedDate" TIMESTAMP;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "ApprovedBy" INTEGER;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "IsRejected" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "IsReversal" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "ImpairmentDate2" TIMESTAMP;

-- ===== Expand Asset_ImpairmentPostings for SP columns =====
ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "Impairment_ID" INTEGER;
ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "FairValueAmt" DECIMAL(18,2);
ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "CostToSell" DECIMAL(18,2);
ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "PresentValue" DECIMAL(18,2);
ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "ImpairmentLostAmt" DECIMAL(18,2);
ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "AmountFromRevaluationReserve" DECIMAL(18,2);
ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "Approved" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "IsReversal" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "ID" SERIAL;

-- ===== Expand Asset_Depreciation for SP columns =====
ALTER TABLE "Asset_Depreciation" ADD COLUMN IF NOT EXISTS "Depreciation_ScheduledItemID" INTEGER;
ALTER TABLE "Asset_Depreciation" ADD COLUMN IF NOT EXISTS "IsApproved" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_Depreciation" ADD COLUMN IF NOT EXISTS "DaysFromLastRun" INTEGER;
ALTER TABLE "Asset_Depreciation" ADD COLUMN IF NOT EXISTS "ResidualValue" DECIMAL(18,2);
ALTER TABLE "Asset_Depreciation" ADD COLUMN IF NOT EXISTS "ReadyForUse" TIMESTAMP;
ALTER TABLE "Asset_Depreciation" ADD COLUMN IF NOT EXISTS "UsefullLife" DECIMAL(18,4);
ALTER TABLE "Asset_Depreciation" ADD COLUMN IF NOT EXISTS "DepreciationValue" DECIMAL(18,2);
ALTER TABLE "Asset_Depreciation" ADD COLUMN IF NOT EXISTS "Depreciation_ScheduleID" INTEGER;
ALTER TABLE "Asset_Depreciation" ADD COLUMN IF NOT EXISTS "Depreciation_MonthID" INTEGER;
ALTER TABLE "Asset_Depreciation" ADD COLUMN IF NOT EXISTS "Depreciation_RunType" VARCHAR(50);
ALTER TABLE "Asset_Depreciation" ADD COLUMN IF NOT EXISTS "CarryingAmountClosingBalance" DECIMAL(18,2);

-- ===== Expand Asset_DepreciationSchedule for SP columns =====
ALTER TABLE "Asset_DepreciationSchedule" ADD COLUMN IF NOT EXISTS "ScheduledDate" TIMESTAMP;
ALTER TABLE "Asset_DepreciationSchedule" ADD COLUMN IF NOT EXISTS "StatusID" INTEGER;

-- ===== Expand Asset_DepreciationSchedule_Item for SP columns =====
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "Asset_DepreciationSchedule_Item_ID" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "Asset_DepreciationSchedule_ID" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "ScheduledDate" TIMESTAMP;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "AssetType_ID" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "AssetCategory_ID" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "Asset_SubCategory_ID" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "MeasurementType_ID" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "AssetStatus_ID" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "StatusID" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "FinancialPeriod" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "RunDate" TIMESTAMP;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "ProcessedDate" TIMESTAMP;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "ResumeStatusID" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "FinYear" VARCHAR(9);
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "TypeID" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "CategoryID" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "SubCategoryID" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "MeasurementTypeID" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "AssetStatusID" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "Month_ID" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "RunType_ID" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "Date_Captured" TIMESTAMP;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "Captured_By" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "TotalAssets" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "TotalDepreciation" DECIMAL(18,2);

ALTER TABLE "Asset_DepreciationSchedule" ADD COLUMN IF NOT EXISTS "PendingApproval" SMALLINT DEFAULT 0;

-- ===== Expand Asset_Disposal_Approval for SP columns =====
ALTER TABLE "Asset_Disposal_Approval" ADD COLUMN IF NOT EXISTS "AssetItemID" INTEGER;
ALTER TABLE "Asset_Disposal_Approval" ADD COLUMN IF NOT EXISTS "AssetDisposalMethodID" INTEGER;
ALTER TABLE "Asset_Disposal_Approval" ADD COLUMN IF NOT EXISTS "DisposalProceedsAmount" DECIMAL(18,2);
ALTER TABLE "Asset_Disposal_Approval" ADD COLUMN IF NOT EXISTS "DisposalDate" TIMESTAMP;
ALTER TABLE "Asset_Disposal_Approval" ADD COLUMN IF NOT EXISTS "DisposalReason" VARCHAR(500);
ALTER TABLE "Asset_Disposal_Approval" ADD COLUMN IF NOT EXISTS "AmountProfitLoss" DECIMAL(18,2);
ALTER TABLE "Asset_Disposal_Approval" ADD COLUMN IF NOT EXISTS "IsApprove" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_Disposal_Approval" ADD COLUMN IF NOT EXISTS "ApprovedBy" INTEGER;
ALTER TABLE "Asset_Disposal_Approval" ADD COLUMN IF NOT EXISTS "ApprovedDate" TIMESTAMP;

ALTER TABLE "Asset_Disposal" ADD COLUMN IF NOT EXISTS "Approved" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_Disposal" ADD COLUMN IF NOT EXISTS "ApprovedDate" TIMESTAMP;
ALTER TABLE "Asset_Disposal" ADD COLUMN IF NOT EXISTS "ApprovedBy" INTEGER;

-- ===== Asset_Revaluations cleanup: remove non-original columns =====
ALTER TABLE IF EXISTS "Asset_Revaluations" DROP COLUMN IF EXISTS "CatchUpDepreciation";
ALTER TABLE IF EXISTS "Asset_Revaluations" DROP COLUMN IF EXISTS "CatchUpDays";
ALTER TABLE IF EXISTS "Asset_Revaluations" DROP COLUMN IF EXISTS "FinYear";
ALTER TABLE IF EXISTS "Asset_Revaluations" DROP COLUMN IF EXISTS "RemainingUsefulLife";
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Asset_Revaluations' AND column_name = 'Approved'
    AND data_type NOT IN ('boolean')
  ) THEN
    ALTER TABLE "Asset_Revaluations" ALTER COLUMN "Approved" TYPE BOOLEAN USING CASE WHEN "Approved" = 1 THEN TRUE WHEN "Approved" = -1 THEN FALSE ELSE NULL END;
  END IF;
END $$;

-- ===== Asset_Revaluations table =====
CREATE TABLE IF NOT EXISTS "Asset_Revaluations" (
    "Asset_RevaluationsID" SERIAL PRIMARY KEY,
    "AssetRegisterID" INTEGER NOT NULL,
    "Revaluation" INTEGER NOT NULL DEFAULT 0,
    "Asset" INTEGER NOT NULL DEFAULT 0,
    "Profit" INTEGER NOT NULL DEFAULT 0,
    "RevalModel" INTEGER NOT NULL DEFAULT 0,
    "RevalautionAmt" NUMERIC(18,8) NOT NULL DEFAULT 0,
    "RevalutionDate" TIMESTAMP NOT NULL DEFAULT NOW(),
    "UserID" INTEGER NOT NULL DEFAULT 1,
    "DiffDepAcc" NUMERIC(18,8) NOT NULL DEFAULT 0,
    "DiffBook" NUMERIC(18,8) NOT NULL DEFAULT 0,
    "ProjectDR" INTEGER NOT NULL DEFAULT 0,
    "ProjectItemDR" INTEGER NOT NULL DEFAULT 0,
    "ProjectCR" INTEGER NOT NULL DEFAULT 0,
    "ProjectItemCR" INTEGER NOT NULL DEFAULT 0,
    "PostDateTime" TIMESTAMP,
    "FileName" VARCHAR(255),
    "SurplusAmount" NUMERIC(18,8),
    "DepreciationAdjustment" NUMERIC(18,8),
    "Approved" BOOLEAN,
    "ApprovedBy" INTEGER,
    "ApprovedDate" TIMESTAMP
);

-- ===== Rejection tracking columns for approval workflows =====
ALTER TABLE "Asset_Disposal" ADD COLUMN IF NOT EXISTS "Approved" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_Disposal" ADD COLUMN IF NOT EXISTS "ApprovedBy" INTEGER;
ALTER TABLE "Asset_Disposal" ADD COLUMN IF NOT EXISTS "ApprovedDate" TIMESTAMP;
ALTER TABLE "Asset_Disposal" ADD COLUMN IF NOT EXISTS "RejectedBy" INTEGER;
ALTER TABLE "Asset_Disposal" ADD COLUMN IF NOT EXISTS "RejectedDate" TIMESTAMP;
ALTER TABLE "Asset_Disposal" ADD COLUMN IF NOT EXISTS "RejectionReason" TEXT;

ALTER TABLE "Asset_Disposal_Approval" ADD COLUMN IF NOT EXISTS "IsApprove" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_Disposal_Approval" ADD COLUMN IF NOT EXISTS "ApprovedBy" INTEGER;
ALTER TABLE "Asset_Disposal_Approval" ADD COLUMN IF NOT EXISTS "ApprovedDate" TIMESTAMP;
ALTER TABLE "Asset_Disposal_Approval" ADD COLUMN IF NOT EXISTS "AssetItemID" INTEGER;

ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "Approved" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "ApprovedBy" INTEGER;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "ApprovedDate" TIMESTAMP;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "IsRejected" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "RejectedBy" INTEGER;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "RejectedDate" TIMESTAMP;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "RejectionReason" TEXT;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "Asset_ItemID" INTEGER;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "RemainingUsefulLife" DECIMAL(18,4);
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "CatchUpDepreciation" DECIMAL(18,2);
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "CatchUpDays" INTEGER;

ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "Impairment_ID" INTEGER;
ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "ID" SERIAL;
ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "FairValueAmt" DECIMAL(18,2);
ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "CostToSell" DECIMAL(18,2);
ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "PresentValue" DECIMAL(18,2);
ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "ImpairmentLostAmt" DECIMAL(18,2);
ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "AmountFromRevaluationReserve" DECIMAL(18,2);
ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "IsReversal" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "Approved" SMALLINT DEFAULT 0;

ALTER TABLE "Asset_Revaluations" ADD COLUMN IF NOT EXISTS "RejectedBy" INTEGER;
ALTER TABLE "Asset_Revaluations" ADD COLUMN IF NOT EXISTS "RejectedDate" TIMESTAMP;
ALTER TABLE "Asset_Revaluations" ADD COLUMN IF NOT EXISTS "RejectionReason" TEXT;

-- ===== Location / Ownership / Insurance lookup tables =====
CREATE TABLE IF NOT EXISTS "Const_Ward" (
    "Ward_Id" SERIAL PRIMARY KEY,
    "WardDescription" VARCHAR(1000) NOT NULL,
    "Enabled" SMALLINT NOT NULL DEFAULT 1,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CapturedID" INTEGER NOT NULL DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "WardNumber" VARCHAR(10),
    "Councillor" VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS "Const_Suburb" (
    "Suburb_ID" SERIAL PRIMARY KEY,
    "SuburbName" VARCHAR(200) NOT NULL,
    "Enabled" SMALLINT NOT NULL DEFAULT 1,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CapturerID" INTEGER NOT NULL DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "TownID" INTEGER,
    "SuburbCode" VARCHAR(4),
    "PostalCode" VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS "Const_Street" (
    "Street_ID" SERIAL PRIMARY KEY,
    "StreetName" VARCHAR(200) NOT NULL,
    "Enabled" SMALLINT NOT NULL DEFAULT 1,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CapturerID" INTEGER NOT NULL DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "SuburbID" INTEGER,
    "StreetSuffixID" INTEGER,
    "SubSuburbID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_Building" (
    "Building_ID" SERIAL PRIMARY KEY,
    "BuildingDesc" VARCHAR(100) NOT NULL,
    "StreetID" INTEGER NOT NULL DEFAULT 0,
    "Longitude" VARCHAR(50),
    "Latitude" VARCHAR(50),
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CapturerID" INTEGER NOT NULL DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "Enabled" SMALLINT,
    "StreetNumber" VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS "Const_Floor" (
    "Floor_ID" SERIAL PRIMARY KEY,
    "FloorDesc" VARCHAR(50) NOT NULL,
    "BuildingID" INTEGER NOT NULL DEFAULT 0,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CapturerID" INTEGER NOT NULL DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "Enabled" SMALLINT
);

CREATE TABLE IF NOT EXISTS "Const_Room" (
    "Room_ID" SERIAL PRIMARY KEY,
    "RoomDesc" VARCHAR(50) NOT NULL,
    "FloorID" INTEGER NOT NULL DEFAULT 0,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CapturerID" INTEGER NOT NULL DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "Enabled" SMALLINT
);

CREATE TABLE IF NOT EXISTS "Const_AssetOwnership" (
    "AssetOwnership_ID" SERIAL PRIMARY KEY,
    "AssetOwnershipDesc" VARCHAR(50) NOT NULL,
    "Enabled" SMALLINT NOT NULL DEFAULT 1,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CapturerID" INTEGER NOT NULL DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_PropertyTypeOfUse" (
    "PropertyTypeOfUse_ID" SERIAL PRIMARY KEY,
    "Description" VARCHAR(200) NOT NULL,
    "Enabled" SMALLINT NOT NULL DEFAULT 1,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CapturerID" INTEGER NOT NULL DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "ZoneCode" VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS "Asset_Insurance" (
    "AssetInsurance_ID" SERIAL PRIMARY KEY,
    "Asset_ItemID" INTEGER NOT NULL,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CapturerID" INTEGER NOT NULL DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "ContentType" VARCHAR(50)
);

-- ===== Missing ATS columns for FAR report =====
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "DepreciationOffset" DECIMAL(18,8);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "DepreciationOffsetOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "DepreciationOffsetClosingBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "DepreciationAdjustment" DECIMAL(18,8);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "TransferFromValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "TransferToValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RefurbDTValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RefurbCTValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RefurbDepreciationValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RefurbRevaluationValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RefurbImpairmentValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RevaluationReserveImpairment" DECIMAL(18,8);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RevaluationReserveImpairmentReversal" DECIMAL(18,8);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RevaluationReserveImpairmentOpeningBalance" DECIMAL(18,8);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RevaluationReserveImpairmentClosingBalance" DECIMAL(18,8);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RevaluationReserveRevaluation" DECIMAL(18,8);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RevaluationReserveDisposal" DECIMAL(18,8);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "ImpairmentSurplus" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "WorkInProgressOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "WorkInProgressValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "WorkInProgressClosingBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AmortisationOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AmortisationValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AmortisationClosingBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "CorrectionOfErrorOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "CorrectionOfErrorValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "CorrectOfErrorClosingBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AdditionalCostOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AdditionalCostValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AdditionalCostClosingBalance" DECIMAL(18,2);

-- ===== Additional indexes for ledger tables =====
CREATE INDEX IF NOT EXISTS idx_led_vote_scoa_finyear ON "Led_Vote"("SCOAItemID", "FinYear");
CREATE INDEX IF NOT EXISTS idx_plan_project_item_project ON "Plan_ProjectItem"("ProjectID");
CREATE INDEX IF NOT EXISTS idx_plan_project_item_scoa ON "Plan_ProjectItem"("SCOAItemID", "FinYear");
CREATE INDEX IF NOT EXISTS idx_led_journal_asset_item ON "Led_Journal_Asset"("Asset_RegisterItem_ID");
CREATE INDEX IF NOT EXISTS idx_asset_gl_vote ON "Asset_GeneralLedger"("VoteID");
CREATE INDEX IF NOT EXISTS idx_asset_gl_finyear ON "Asset_GeneralLedger"("FinYear");
CREATE INDEX IF NOT EXISTS idx_ref_data_type ON "Const_ReferenceData_sys"("ReferenceTypeID");
CREATE INDEX IF NOT EXISTS idx_art_finyear_period ON "Asset_Register_Transactions"("FinancialYear", "FinancialPeriod");
CREATE INDEX IF NOT EXISTS idx_ats_item_year_cover ON "Asset_Transaction_Summary"("AssetRegisterItemID", "FinancialYear", "FinancialPeriod")
    INCLUDE ("CurrentValue","RemainingUsefulLife","AccumulatedDepreciationClosingBalance","AccumulatedImpairmentClosingBalance","AccumulatedFairValueClosingBalance","AccumulatedRevaluationClosingBalance","AccumulatedImpairmentReversalClosingBalance","DisposalClosingBalance","WorkInProgressClosingBalance","AmortisationClosingBalance","CorrectOfErrorClosingBalance","AdditionalCostClosingBalance","AdditionClosingBalance","MovementInRevaluationReserve","DepreciationOffsetClosingBalance","ImpairmentSurplus");
CREATE INDEX IF NOT EXISTS idx_ats_item_id_cover ON "Asset_Transaction_Summary"("AssetRegisterItemID")
    INCLUDE ("FinancialYear","FinancialPeriod");
CREATE INDEX IF NOT EXISTS idx_insurance_asset ON "Asset_Insurance"("Asset_ItemID");
CREATE INDEX IF NOT EXISTS idx_const_ward_enabled ON "Const_Ward"("Enabled");
CREATE INDEX IF NOT EXISTS idx_const_suburb_town ON "Const_Suburb"("TownID");
CREATE INDEX IF NOT EXISTS idx_const_street_suburb ON "Const_Street"("SuburbID");
CREATE INDEX IF NOT EXISTS idx_const_building_street ON "Const_Building"("StreetID");
CREATE INDEX IF NOT EXISTS idx_const_floor_building ON "Const_Floor"("BuildingID");
CREATE INDEX IF NOT EXISTS idx_const_room_floor ON "Const_Room"("FloorID");

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_BulkValidation' AND column_name='CurrentReplacemantCostCRC') THEN
    ALTER TABLE "Asset_BulkValidation" RENAME COLUMN "CurrentReplacemantCostCRC" TO "CurrentReplacementCostCRC";
  END IF;
END $$;

DROP INDEX IF EXISTS idx_ats_item_year;
ALTER TABLE "Asset_OrganisationSettings" ADD COLUMN IF NOT EXISTS "approval_method" VARCHAR(20) DEFAULT 'Manual';

CREATE TABLE IF NOT EXISTS "Asset_MonthlyApproval" (
    "MonthlyApproval_ID" SERIAL PRIMARY KEY,
    "Financial_Year" VARCHAR(20),
    "Financial_Period" INTEGER,
    "User_Id" INTEGER,
    "IsApproved" BOOLEAN DEFAULT TRUE,
    "DateCreated" TIMESTAMP DEFAULT NOW(),
    "VerifiedRevaluation" BOOLEAN DEFAULT FALSE,
    "VerifiedImpairment" BOOLEAN DEFAULT FALSE,
    "VerifiedImpairmentReversal" BOOLEAN DEFAULT FALSE,
    "VerifiedDisposal" BOOLEAN DEFAULT FALSE
);

-- ===== SS Column Name Alignment Migrations =====

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Criticality_Grade' AND column_name='CriticalityGrade_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Criticality_Grade' AND column_name='AssetCriticalityGradeID') THEN
    ALTER TABLE "Const_Asset_Criticality_Grade" RENAME COLUMN "CriticalityGrade_ID" TO "AssetCriticalityGradeID";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Criticality_Grade' AND column_name='CriticalityGradeDesc')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Criticality_Grade' AND column_name='AssetCriticalityGradeDesc') THEN
    ALTER TABLE "Const_Asset_Criticality_Grade" RENAME COLUMN "CriticalityGradeDesc" TO "AssetCriticalityGradeDesc";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Health_Grade' AND column_name='HealthGrade_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Health_Grade' AND column_name='AssetHealthGradeID') THEN
    ALTER TABLE "Const_Asset_Health_Grade" RENAME COLUMN "HealthGrade_ID" TO "AssetHealthGradeID";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Health_Grade' AND column_name='HealthGradeDesc')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Health_Grade' AND column_name='AssetHealthGradeDesc') THEN
    ALTER TABLE "Const_Asset_Health_Grade" RENAME COLUMN "HealthGradeDesc" TO "AssetHealthGradeDesc";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Performance_Grade' AND column_name='PerformanceGrade_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Performance_Grade' AND column_name='AssetPerformanceGradeID') THEN
    ALTER TABLE "Const_Asset_Performance_Grade" RENAME COLUMN "PerformanceGrade_ID" TO "AssetPerformanceGradeID";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Performance_Grade' AND column_name='PerformanceGradeDesc')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Performance_Grade' AND column_name='AssetPerformanceGradeDesc') THEN
    ALTER TABLE "Const_Asset_Performance_Grade" RENAME COLUMN "PerformanceGradeDesc" TO "AssetPerformanceGradeDesc";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Utilisation_Grade' AND column_name='UtilisationGrade_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Utilisation_Grade' AND column_name='AssetUtilisationGradeID') THEN
    ALTER TABLE "Const_Asset_Utilisation_Grade" RENAME COLUMN "UtilisationGrade_ID" TO "AssetUtilisationGradeID";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Utilisation_Grade' AND column_name='UtilisationGradeDesc')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Utilisation_Grade' AND column_name='AssetUtilisationGradeDesc') THEN
    ALTER TABLE "Const_Asset_Utilisation_Grade" RENAME COLUMN "UtilisationGradeDesc" TO "AssetUtilisationGradeDesc";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Condition' AND column_name='AssetCondition_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Condition' AND column_name='Asset_Condition_ID') THEN
    ALTER TABLE "Const_Asset_Condition" RENAME COLUMN "AssetCondition_ID" TO "Asset_Condition_ID";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Condition' AND column_name='AssetConditionDesc')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Condition' AND column_name='Description') THEN
    ALTER TABLE "Const_Asset_Condition" RENAME COLUMN "AssetConditionDesc" TO "Description";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_ComponentType' AND column_name='Asset_Component_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_ComponentType' AND column_name='Asset_ComponentType_ID') THEN
    ALTER TABLE "Const_Asset_ComponentType" RENAME COLUMN "Asset_Component_ID" TO "Asset_ComponentType_ID";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_ComponentType' AND column_name='CapturerID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_ComponentType' AND column_name='Capturer_ID') THEN
    ALTER TABLE "Const_Asset_ComponentType" RENAME COLUMN "CapturerID" TO "Capturer_ID";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_ComponentType' AND column_name='ModifierID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_ComponentType' AND column_name='Modifier_ID') THEN
    ALTER TABLE "Const_Asset_ComponentType" RENAME COLUMN "ModifierID" TO "Modifier_ID";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Month_sys' AND column_name='MonthDesc')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Month_sys' AND column_name='Month') THEN
    ALTER TABLE "Const_Month_sys" RENAME COLUMN "MonthDesc" TO "Month";
  END IF;
END $$;
ALTER TABLE "Const_Month_sys" ADD COLUMN IF NOT EXISTS "DateCaptured" TIMESTAMP DEFAULT NOW();
ALTER TABLE "Const_Month_sys" ADD COLUMN IF NOT EXISTS "CapturerID" INTEGER DEFAULT 1;
ALTER TABLE "Const_Month_sys" ADD COLUMN IF NOT EXISTS "DateModified" TIMESTAMP;
ALTER TABLE "Const_Month_sys" ADD COLUMN IF NOT EXISTS "ModifierID" INTEGER;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Depreciation_Approval_Type' AND column_name='DepreciationApprovalType_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Depreciation_Approval_Type' AND column_name='Asset_Depreciation_Approval_Type_ID') THEN
    ALTER TABLE "Const_Asset_Depreciation_Approval_Type" RENAME COLUMN "DepreciationApprovalType_ID" TO "Asset_Depreciation_Approval_Type_ID";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Depreciation_Approval_Type' AND column_name='DepreciationApprovalTypeDesc')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Depreciation_Approval_Type' AND column_name='ApprovalTypeDesc') THEN
    ALTER TABLE "Const_Asset_Depreciation_Approval_Type" RENAME COLUMN "DepreciationApprovalTypeDesc" TO "ApprovalTypeDesc";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_AssetConditionRating_Sys' AND column_name='AssetConditionRating_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_AssetConditionRating_Sys' AND column_name='ConditionRating_ID') THEN
    ALTER TABLE "Const_AssetConditionRating_Sys" RENAME COLUMN "AssetConditionRating_ID" TO "ConditionRating_ID";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_AssetConditionRating_Sys' AND column_name='AssetConditionRatingDesc')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_AssetConditionRating_Sys' AND column_name='ConditionRatingDesc') THEN
    ALTER TABLE "Const_AssetConditionRating_Sys" RENAME COLUMN "AssetConditionRatingDesc" TO "ConditionRatingDesc";
  END IF;
END $$;
ALTER TABLE "Const_AssetConditionRating_Sys" ADD COLUMN IF NOT EXISTS "DetailedDescription" VARCHAR(500);
ALTER TABLE "Const_AssetConditionRating_Sys" ADD COLUMN IF NOT EXISTS "EstimatedRemainingLife" INTEGER;
ALTER TABLE "Const_AssetConditionRating_Sys" ADD COLUMN IF NOT EXISTS "Grade" VARCHAR(50);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_WIPFundingSource' AND column_name='WIPFundingSource_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_WIPFundingSource' AND column_name='FundingSourceID') THEN
    ALTER TABLE "Const_Asset_WIPFundingSource" RENAME COLUMN "WIPFundingSource_ID" TO "FundingSourceID";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_WIPFundingSource' AND column_name='WIPFundingSourceDesc')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_WIPFundingSource' AND column_name='SourceDesc') THEN
    ALTER TABLE "Const_Asset_WIPFundingSource" RENAME COLUMN "WIPFundingSourceDesc" TO "SourceDesc";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_WIPFundingType' AND column_name='WIPFundingType_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_WIPFundingType' AND column_name='FundingTypeID') THEN
    ALTER TABLE "Const_Asset_WIPFundingType" RENAME COLUMN "WIPFundingType_ID" TO "FundingTypeID";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_WIPFundingType' AND column_name='WIPFundingTypeDesc')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_WIPFundingType' AND column_name='TypeDesc') THEN
    ALTER TABLE "Const_Asset_WIPFundingType" RENAME COLUMN "WIPFundingTypeDesc" TO "TypeDesc";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_WIPProjectStatus' AND column_name='WIPProjectStatus_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_WIPProjectStatus' AND column_name='ProjectStatusID') THEN
    ALTER TABLE "Const_Asset_WIPProjectStatus" RENAME COLUMN "WIPProjectStatus_ID" TO "ProjectStatusID";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_WIPProjectStatus' AND column_name='WIPProjectStatusDesc')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_WIPProjectStatus' AND column_name='StatusDesc') THEN
    ALTER TABLE "Const_Asset_WIPProjectStatus" RENAME COLUMN "WIPProjectStatusDesc" TO "StatusDesc";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Calculation_Type' AND column_name='CalculationType_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Calculation_Type' AND column_name='Asset_Calculation_Type_ID') THEN
    ALTER TABLE "Const_Asset_Calculation_Type" RENAME COLUMN "CalculationType_ID" TO "Asset_Calculation_Type_ID";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Calculation_Type' AND column_name='CalculationTypeDesc')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Const_Asset_Calculation_Type' AND column_name='TypeDescription') THEN
    ALTER TABLE "Const_Asset_Calculation_Type" RENAME COLUMN "CalculationTypeDesc" TO "TypeDescription";
  END IF;
END $$;
ALTER TABLE "Const_Asset_Calculation_Type" ADD COLUMN IF NOT EXISTS "CalculationTypeFormula" VARCHAR(500);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Register_Items' AND column_name='UOM')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Register_Items' AND column_name='UoM') THEN
    ALTER TABLE "Asset_Register_Items" RENAME COLUMN "UOM" TO "UoM";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Register_Transactions' AND column_name='AssetRegisterTransaction_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Register_Transactions' AND column_name='ID') THEN
    ALTER TABLE "Asset_Register_Transactions" RENAME COLUMN "AssetRegisterTransaction_ID" TO "ID";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Transaction_Summary' AND column_name='AssetTransactionSummary_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Transaction_Summary' AND column_name='ID') THEN
    ALTER TABLE "Asset_Transaction_Summary" RENAME COLUMN "AssetTransactionSummary_ID" TO "ID";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Depreciation' AND column_name='AssetDepreciation_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Depreciation' AND column_name='Asset_Depreciation_ID') THEN
    ALTER TABLE "Asset_Depreciation" RENAME COLUMN "AssetDepreciation_ID" TO "Asset_Depreciation_ID";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_DepreciationSchedule' AND column_name='DepreciationSchedule_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_DepreciationSchedule' AND column_name='Asset_DepreciationSchedule_ID') THEN
    ALTER TABLE "Asset_DepreciationSchedule" RENAME COLUMN "DepreciationSchedule_ID" TO "Asset_DepreciationSchedule_ID";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_DepreciationSchedule_Item' AND column_name='DepreciationScheduleItem_ID') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_DepreciationSchedule_Item' AND column_name='Asset_DepreciationSchedule_Item_ID') THEN
      ALTER TABLE "Asset_DepreciationSchedule_Item" DROP COLUMN "Asset_DepreciationSchedule_Item_ID";
    END IF;
    ALTER TABLE "Asset_DepreciationSchedule_Item" RENAME COLUMN "DepreciationScheduleItem_ID" TO "Asset_DepreciationSchedule_Item_ID";
  END IF;
END $$;

ALTER TABLE "Asset_DepreciationSchedule" ADD COLUMN IF NOT EXISTS "PendingApproval" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_DepreciationSchedule" ADD COLUMN IF NOT EXISTS "IsApproved" SMALLINT DEFAULT 0;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_DepreciationSchedule_Item' AND column_name='DepreciationScheduleItem_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_DepreciationSchedule_Item' AND column_name='Asset_DepreciationSchedule_Item_ID') THEN
    ALTER TABLE "Asset_DepreciationSchedule_Item" RENAME COLUMN "DepreciationScheduleItem_ID" TO "Asset_DepreciationSchedule_Item_ID";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_DepreciationSchedule_Item' AND column_name='DepreciationSchedule_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_DepreciationSchedule_Item' AND column_name='Asset_DepreciationSchedule_ID') THEN
    ALTER TABLE "Asset_DepreciationSchedule_Item" RENAME COLUMN "DepreciationSchedule_ID" TO "Asset_DepreciationSchedule_ID";
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_DepreciationSchedule_Item' AND column_name='DepreciationSchedule_ID')
  AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_DepreciationSchedule_Item' AND column_name='Asset_DepreciationSchedule_ID') THEN
    UPDATE "Asset_DepreciationSchedule_Item" SET "Asset_DepreciationSchedule_ID" = "DepreciationSchedule_ID" WHERE "Asset_DepreciationSchedule_ID" IS NULL;
    ALTER TABLE "Asset_DepreciationSchedule_Item" DROP COLUMN "DepreciationSchedule_ID";
  END IF;
END $$;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "Date_Captured" TIMESTAMP DEFAULT NOW();
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "Captured_By" INTEGER DEFAULT 1;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Disposal' AND column_name='AssetRegisterItem_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Disposal' AND column_name='AssetItemID') THEN
    ALTER TABLE "Asset_Disposal" RENAME COLUMN "AssetRegisterItem_ID" TO "AssetItemID";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Disposal' AND column_name='DisposalMethod_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Disposal' AND column_name='AssetDisposalMethodID') THEN
    ALTER TABLE "Asset_Disposal" RENAME COLUMN "DisposalMethod_ID" TO "AssetDisposalMethodID";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Disposal' AND column_name='ProfitLoss')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Disposal' AND column_name='AmountProfitLoss') THEN
    ALTER TABLE "Asset_Disposal" RENAME COLUMN "ProfitLoss" TO "AmountProfitLoss";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Disposal' AND column_name='Reason')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Disposal' AND column_name='DisposalReason') THEN
    ALTER TABLE "Asset_Disposal" RENAME COLUMN "Reason" TO "DisposalReason";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_FairValue' AND column_name='AssetFairValue_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_FairValue' AND column_name='RegistrationItemFairValue_Id') THEN
    ALTER TABLE "Asset_FairValue" RENAME COLUMN "AssetFairValue_ID" TO "RegistrationItemFairValue_Id";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_FairValue' AND column_name='FairValueAmount')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_FairValue' AND column_name='FairValue') THEN
    ALTER TABLE "Asset_FairValue" RENAME COLUMN "FairValueAmount" TO "FairValue";
  END IF;
END $$;
ALTER TABLE "Asset_FairValue" ADD COLUMN IF NOT EXISTS "AssetDescription" VARCHAR(500);
ALTER TABLE "Asset_FairValue" ADD COLUMN IF NOT EXISTS "AssetClass" VARCHAR(200);
ALTER TABLE "Asset_FairValue" ADD COLUMN IF NOT EXISTS "AssetCategory" VARCHAR(200);
ALTER TABLE "Asset_FairValue" ADD COLUMN IF NOT EXISTS "DebitVoteID" INTEGER;
ALTER TABLE "Asset_FairValue" ADD COLUMN IF NOT EXISTS "CreditVoteID" INTEGER;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_FairValueApproval' AND column_name='FairValueApproval_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_FairValueApproval' AND column_name='Asset_FairValueApproval_ID') THEN
    ALTER TABLE "Asset_FairValueApproval" RENAME COLUMN "FairValueApproval_ID" TO "Asset_FairValueApproval_ID";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_FairValueApproval' AND column_name='AssetFairValue_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_FairValueApproval' AND column_name='RegistrationItemFairValue_Id') THEN
    ALTER TABLE "Asset_FairValueApproval" RENAME COLUMN "AssetFairValue_ID" TO "RegistrationItemFairValue_Id";
  END IF;
END $$;
ALTER TABLE "Asset_FairValueApproval" ADD COLUMN IF NOT EXISTS "AssetRegisterItem_ID" INTEGER;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Impairment' AND column_name='AssetImpairment_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Impairment' AND column_name='Impairment_ID') THEN
    ALTER TABLE "Asset_Impairment" RENAME COLUMN "AssetImpairment_ID" TO "Impairment_ID";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Impairment' AND column_name='AssetRegisterItem_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_Impairment' AND column_name='Asset_ItemID') THEN
    ALTER TABLE "Asset_Impairment" RENAME COLUMN "AssetRegisterItem_ID" TO "Asset_ItemID";
  END IF;
END $$;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "RemainingUsefulLife" DECIMAL(18,2);
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "CatchUpDepreciation" DECIMAL(18,2);
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "CatchUpDays" INTEGER;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "Approved" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "ApprovedDate" TIMESTAMP;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "ApprovedBy" INTEGER;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "IsRejected" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_Impairment" ADD COLUMN IF NOT EXISTS "IsReversal" SMALLINT DEFAULT 0;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_ImpairmentPostings' AND column_name='ImpairmentPosting_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_ImpairmentPostings' AND column_name='Id') THEN
    ALTER TABLE "Asset_ImpairmentPostings" RENAME COLUMN "ImpairmentPosting_ID" TO "Id";
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_ImpairmentPostings' AND column_name='AssetImpairment_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_ImpairmentPostings' AND column_name='Impairment_ID') THEN
    ALTER TABLE "Asset_ImpairmentPostings" RENAME COLUMN "AssetImpairment_ID" TO "Impairment_ID";
  END IF;
END $$;
ALTER TABLE "Asset_ImpairmentPostings" ADD COLUMN IF NOT EXISTS "CarryingValue" DECIMAL(18,2);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_WIP_Register' AND column_name='WIPProjectStatus_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_WIP_Register' AND column_name='ProjectStatusID') THEN
    ALTER TABLE "Asset_WIP_Register" RENAME COLUMN "WIPProjectStatus_ID" TO "ProjectStatusID";
  END IF;
END $$;
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "ProjectNo" VARCHAR(100);
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "ContractID" INTEGER;
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "ContractStartDate" TIMESTAMP;
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "ContractEndDate" TIMESTAMP;
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "ContractNumber" VARCHAR(100);
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "FundingTypeID" INTEGER;
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "DepartmentID" INTEGER;
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "DivisionID" INTEGER;
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "CustodianID" INTEGER;
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "Latitude" DECIMAL(18,8);
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "Longitude" DECIMAL(18,8);
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "ContractValue" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "WIPOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "RestatedOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "Additions" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "TransferOfAssets" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "WriteOff" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "Impairment" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "PriorYearAdjustment" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "WIPClosingBalance" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "FinancialProgress" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "BudgetProjectID" INTEGER;
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "BudgetProjectItemID" INTEGER;
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "CompletionDate" TIMESTAMP;
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "IsApproved" SMALLINT DEFAULT 0;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_WIP_Register_Details' AND column_name='WIPRegisterDetail_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_WIP_Register_Details' AND column_name='WIPRegisterDetails_ID') THEN
    ALTER TABLE "Asset_WIP_Register_Details" RENAME COLUMN "WIPRegisterDetail_ID" TO "WIPRegisterDetails_ID";
  END IF;
END $$;
ALTER TABLE "Asset_WIP_Register_Details" ADD COLUMN IF NOT EXISTS "InvoiceId" INTEGER;
ALTER TABLE "Asset_WIP_Register_Details" ADD COLUMN IF NOT EXISTS "InvoiceNumber" VARCHAR(100);
ALTER TABLE "Asset_WIP_Register_Details" ADD COLUMN IF NOT EXISTS "InvoiceDate" TIMESTAMP;
ALTER TABLE "Asset_WIP_Register_Details" ADD COLUMN IF NOT EXISTS "VendorID" INTEGER;
ALTER TABLE "Asset_WIP_Register_Details" ADD COLUMN IF NOT EXISTS "VatAmount" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register_Details" ADD COLUMN IF NOT EXISTS "TotalAmount" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register_Details" ADD COLUMN IF NOT EXISTS "DocumentNumber" VARCHAR(100);
ALTER TABLE "Asset_WIP_Register_Details" ADD COLUMN IF NOT EXISTS "PaymentReference" VARCHAR(100);
ALTER TABLE "Asset_WIP_Register_Details" ADD COLUMN IF NOT EXISTS "ScmInvoiceDetailId" INTEGER;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_WIP_Register_Items' AND column_name='WIPRegisterItem_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_WIP_Register_Items' AND column_name='WIPRegistrationItem_Id') THEN
    ALTER TABLE "Asset_WIP_Register_Items" RENAME COLUMN "WIPRegisterItem_ID" TO "WIPRegistrationItem_Id";
  END IF;
END $$;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "ProjectId" INTEGER;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "AssetId" INTEGER;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "OrderValue" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "CompletionAmount" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "RetentionAmount" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "CompletionDate" TIMESTAMP;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "SubCategory" VARCHAR(200);
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "AssetType" VARCHAR(200);
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "UsefulLife" INTEGER;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "ResidualValue" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "UoM" INTEGER;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "CreditAccount" VARCHAR(100);
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "DebitAmount" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "CreditAmount" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "DebitAccount" VARCHAR(100);
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "SendToBilling" SMALLINT DEFAULT 0;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_WIPApprovalItems' AND column_name='WIPApprovalItem_ID')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Asset_WIPApprovalItems' AND column_name='Id') THEN
    ALTER TABLE "Asset_WIPApprovalItems" RENAME COLUMN "WIPApprovalItem_ID" TO "Id";
  END IF;
END $$;
ALTER TABLE "Asset_WIPApprovalItems" ADD COLUMN IF NOT EXISTS "TransactionID" INTEGER;
ALTER TABLE "Asset_WIPApprovalItems" ADD COLUMN IF NOT EXISTS "IsApproved" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_WIPApprovalItems" ADD COLUMN IF NOT EXISTS "ApproverID" INTEGER;
ALTER TABLE "Asset_WIPApprovalItems" ADD COLUMN IF NOT EXISTS "ApprovedDate" TIMESTAMP;
ALTER TABLE "Asset_WIPApprovalItems" ADD COLUMN IF NOT EXISTS "ProjectDR" INTEGER;
ALTER TABLE "Asset_WIPApprovalItems" ADD COLUMN IF NOT EXISTS "ProjectItemDR" INTEGER;
ALTER TABLE "Asset_WIPApprovalItems" ADD COLUMN IF NOT EXISTS "ProjectCR" INTEGER;
ALTER TABLE "Asset_WIPApprovalItems" ADD COLUMN IF NOT EXISTS "ProjectItemCR" INTEGER;
ALTER TABLE "Asset_WIPApprovalItems" ADD COLUMN IF NOT EXISTS "DateModified" TIMESTAMP;
ALTER TABLE "Asset_WIPApprovalItems" ADD COLUMN IF NOT EXISTS "ModifierID" INTEGER;

-- ===== Unique index for Asset_DepreciationSchedule FinYear (required for ON CONFLICT) =====
-- Safely deduplicate: remove FinYear duplicates that have no schedule items (keep max ID)
DO $$
BEGIN
    DELETE FROM "Asset_DepreciationSchedule" a
    WHERE NOT EXISTS (
        SELECT 1 FROM "Asset_DepreciationSchedule_Item" si
        WHERE si."Asset_DepreciationSchedule_ID" = a."Asset_DepreciationSchedule_ID"
    )
    AND EXISTS (
        SELECT 1 FROM "Asset_DepreciationSchedule" b
        WHERE b."FinYear" = a."FinYear"
          AND b."Asset_DepreciationSchedule_ID" > a."Asset_DepreciationSchedule_ID"
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "idx_depr_schedule_finyear" ON "Asset_DepreciationSchedule" ("FinYear");

-- ===== Remove non-canonical columns from Const_Asset_Condition =====
ALTER TABLE "Const_Asset_Condition" DROP COLUMN IF EXISTS "Default";
ALTER TABLE "Const_Asset_Condition" DROP COLUMN IF EXISTS "Rating";

-- ===== Asset_Transaction_Summary: add missing columns for existing production databases =====
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "DepreciationOffsetOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "DepreciationOffset" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "DepreciationOffsetClosingBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RevaluationReserveImpairmentOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RevaluationReserveImpairment" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RevaluationReserveImpairmentReversal" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RevaluationReserveImpairmentClosingBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RevaluationReserveRevaluation" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RevaluationReserveDisposal" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "DepreciationAdjustment" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "TransferFromValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "TransferToValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RefurbDTValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RefurbCTValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RefurbDepreciationValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RefurbRevaluationValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "RefurbImpairmentValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "ImpairmentSurplus" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "WorkInProgressOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "WorkInProgressValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "WorkInProgressClosingBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AmortisationOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AmortisationValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AmortisationClosingBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "CorrectionOfErrorOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "CorrectionOfErrorValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "CorrectOfErrorClosingBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AdditionalCostOpeningBalance" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AdditionalCostValue" DECIMAL(18,2);
ALTER TABLE "Asset_Transaction_Summary" ADD COLUMN IF NOT EXISTS "AdditionalCostClosingBalance" DECIMAL(18,2);

CREATE TABLE IF NOT EXISTS "Const_FinYearWithIndex_sys" (
    "ID" SERIAL PRIMARY KEY,
    "ActiveFinYear" VARCHAR(10) NOT NULL,
    "CurrentIndex" INTEGER NOT NULL,
    "FinYear" VARCHAR(10) NOT NULL
);

-- ===== Asset Unbundling Enhancements (Part 2) =====

-- New columns on Asset_WIP_Register_Items
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "IsAssetItem" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "AssetDescription" VARCHAR(500);
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "Rate" DECIMAL(18,2);
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "Quantity" DECIMAL(18,8);
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "CIDMSAccountingGroupID" INTEGER;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "CIDMSAccountingSubGroupID" INTEGER;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "CIDMSClassID" INTEGER;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "CIDMSGroupTypeID" INTEGER;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "CIDMSAssetTypeID" INTEGER;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "CIDMSComponentTypeID" INTEGER;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "CIDMSSubComponentTypeID" INTEGER;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "AssetTypeID" INTEGER;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "AssetCategoryID" INTEGER;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "AssetSubCategoryID" INTEGER;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "MeasurementTypeID" INTEGER;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "AssetStatusID" INTEGER;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "BudgetProjectID" INTEGER;
ALTER TABLE "Asset_WIP_Register_Items" ADD COLUMN IF NOT EXISTS "BudgetProjectItemID" INTEGER;

-- New columns on Asset_WIP_Register
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "ProjectComplete" SMALLINT DEFAULT 0;
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "UnbundlingStatus" VARCHAR(50) DEFAULT 'Draft';
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "UnbundlingComment" TEXT;
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "ApproverID" INTEGER;
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "UnbundlingApprovedDate" TIMESTAMP;
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "ActualSurvey" TEXT;
ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "MainAssetDescription" VARCHAR(500);

-- WIP Documents table
CREATE TABLE IF NOT EXISTS "Asset_WIP_Documents" (
    "WIPDocument_ID" SERIAL PRIMARY KEY,
    "WIPRegister_ID" INTEGER NOT NULL,
    "DocumentType" VARCHAR(50) NOT NULL,
    "DocumentName" VARCHAR(500) NOT NULL,
    "FileData" TEXT NOT NULL,
    "MimeType" VARCHAR(100),
    "FileSizeKB" INTEGER,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1
);

-- ===== SCM Tables =====

CREATE TABLE IF NOT EXISTS "Cons_Vendor" (
    "Vendor_ID" INTEGER PRIMARY KEY,
    "VendorName" VARCHAR(500),
    "CompanyDirector" VARCHAR(200),
    "RegistrationNumber" VARCHAR(100),
    "VendorCategoryID" INTEGER,
    "VendorTypeID" INTEGER,
    "MyReferenceNumber" VARCHAR(100),
    "VatRegistered" SMALLINT DEFAULT 0,
    "VatRegistrationNumber" VARCHAR(100),
    "TaxCertificateNumber" VARCHAR(100),
    "TaxCertificateDate" TIMESTAMP,
    "PostalAddress1" VARCHAR(200),
    "PostalAddress2" VARCHAR(200),
    "Postal_TownID" INTEGER,
    "PostalCode" VARCHAR(20),
    "PhysicalAddress1" VARCHAR(200),
    "PhysicalAddress2" VARCHAR(200),
    "Physical_TownID" INTEGER,
    "Country" VARCHAR(100),
    "Tel_Home" VARCHAR(50),
    "Tel_Work" VARCHAR(50),
    "Tel_Mobile" VARCHAR(50),
    "Fax" VARCHAR(50),
    "email" VARCHAR(200),
    "Website" VARCHAR(200),
    "BankID" INTEGER,
    "BankAccountTypeID" INTEGER,
    "BankAccountNumber" VARCHAR(50),
    "StatusID" INTEGER DEFAULT 1,
    "SupplyChainVendor" SMALLINT DEFAULT 0,
    "CreditorListDate" TIMESTAMP,
    "ListingExpiryDate" TIMESTAMP,
    "CreditLimit" DECIMAL(18,2),
    "PercentageDiscount" DECIMAL(18,4),
    "TermsDays" INTEGER,
    "LastPurchaseDate" TIMESTAMP,
    "BalanceAtMonthEnd" DECIMAL(18,2),
    "YearEndBalance" DECIMAL(18,2),
    "TotalOrdersAwardedForYear" DECIMAL(18,2),
    "VendorLocationID" INTEGER,
    "BEEPercentage" DECIMAL(18,4),
    "PreviouslyDisadvantaged" SMALLINT DEFAULT 0,
    "PDIExpiryDate" TIMESTAMP,
    "Certificate" VARCHAR(200),
    "PDIPercentage" DECIMAL(18,4),
    "Woman" SMALLINT DEFAULT 0,
    "Disabled" SMALLINT DEFAULT 0,
    "HDI" SMALLINT DEFAULT 0,
    "UnitID" INTEGER,
    "AccountID" INTEGER,
    "Notes" TEXT,
    "ConstructionIndustryRegistration" VARCHAR(100),
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "BankBranchCodeID" INTEGER,
    "VendorCreditor" SMALLINT DEFAULT 0,
    "TradingName" VARCHAR(500),
    "VendorRegistrationTypeID" INTEGER,
    "CompensationCommRegNumber" VARCHAR(100),
    "PAYENumber" VARCHAR(100),
    "PreviousBusiness" SMALLINT DEFAULT 0,
    "PreviousBusinessName" VARCHAR(500),
    "VendorBBBEEContributorLevelID" INTEGER,
    "RegionalOfficesPhysicalLocation" VARCHAR(200),
    "NationalOfficesPhysicalLocation" VARCHAR(200),
    "CommunicationMethodID" INTEGER,
    "TaxClearanceCertVerified" SMALLINT DEFAULT 0,
    "VATCertVerified" SMALLINT DEFAULT 0,
    "IncomeTaxCertVerified" SMALLINT DEFAULT 0,
    "TaxClearanceCertVerifiedDate" TIMESTAMP,
    "AwaitingApproval" SMALLINT DEFAULT 0,
    "VendorBBBEEContributorExemptionLevelID" INTEGER,
    "NameofBusinessforTradingPurpose" VARCHAR(500),
    "CIPROCompanyNo" VARCHAR(100),
    "EasternCapeOffice" SMALLINT DEFAULT 0,
    "IsNTBackList" SMALLINT DEFAULT 0,
    "FirstName" VARCHAR(200),
    "LastName" VARCHAR(200),
    "UserName" VARCHAR(200),
    "Password" VARCHAR(200),
    "Reason" TEXT,
    "PhysicalPostalCode" VARCHAR(20),
    "VendorRegistrationID" INTEGER,
    "CompanyTypeID" INTEGER,
    "EmailAddress" VARCHAR(200),
    "ContactName" VARCHAR(200),
    "VendorNumber" VARCHAR(100),
    "CompanyName" VARCHAR(500),
    "Approved" SMALLINT DEFAULT 0,
    "Status" VARCHAR(50),
    "ServiceProviderNumber" VARCHAR(100),
    "IncomeTaxRefNumber" VARCHAR(100),
    "BBBEEContributorID" INTEGER,
    "ProvinceID" INTEGER,
    "NationalOffices" VARCHAR(200),
    "PrefferedMethodID" INTEGER,
    "NTBackList" SMALLINT DEFAULT 0,
    "RegistrationTypeID" INTEGER,
    "FinancialYear" VARCHAR(20),
    "RegisterDate" TIMESTAMP,
    "ApprovalDate" TIMESTAMP,
    "StatusUpdateDate" TIMESTAMP,
    "Declaration" SMALLINT DEFAULT 0,
    "VoteID" INTEGER,
    "PaymentMethodID" INTEGER,
    "BlackListedFromDate" TIMESTAMP,
    "BlackListedToDate" TIMESTAMP,
    "BlackListedBy" INTEGER,
    "BlackListReason" TEXT,
    "PreviousBusinessRegistration" VARCHAR(200),
    "StatusChangeReason" TEXT,
    "PaymentName" VARCHAR(200),
    "bActivatedForPayroll" SMALLINT DEFAULT 0,
    "bActivatedForBilling" SMALLINT DEFAULT 0,
    "bActivatedForLedger" SMALLINT DEFAULT 0,
    "bActivatedForAssets" SMALLINT DEFAULT 0,
    "bActivatedForSCM" SMALLINT DEFAULT 0,
    "bActivatedForPlanning" SMALLINT DEFAULT 0,
    "bPayrollCommission" SMALLINT DEFAULT 0,
    "CommissionPercentage" DECIMAL(18,4),
    "Directive_ID" INTEGER,
    "Contract_ID" INTEGER,
    "Order_ID" INTEGER,
    "UniqueRegistrationReferenceNumber" VARCHAR(200),
    "LastCsdSupplierIdentificationUpdateDate" TIMESTAMP,
    "CSDSupplierNumber" VARCHAR(100),
    "LastCsdSupplierTaxDetailsUpdateDate" TIMESTAMP,
    "TaxCertificateExpiryDate" TIMESTAMP,
    "LastVerificationDate" TIMESTAMP,
    "DiscountRate" DECIMAL(18,4),
    "QualifyingDays" INTEGER,
    "VendorRef_seb" VARCHAR(100),
    "IsCSDImport" SMALLINT DEFAULT 0,
    "TotalAnnualTurnover" DECIMAL(18,2),
    "TotalAnnualTurnoverName" VARCHAR(200),
    "Enabled" SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "SCM_ContractDetails" (
    "Contract_ID" INTEGER PRIMARY KEY,
    "ContractNumber" VARCHAR(100),
    "ContractDescription" VARCHAR(500),
    "TenderQuotation" SMALLINT,
    "TenderQuotationID" INTEGER,
    "ContractManagerID" INTEGER,
    "ServiceTypeID" INTEGER,
    "VoteID" INTEGER,
    "OrderNumber" VARCHAR(100),
    "Contractvalue" DECIMAL(18,2),
    "PlannedStartDate" TIMESTAMP,
    "PlannedEndDate" TIMESTAMP,
    "RevisedStartDate" TIMESTAMP,
    "RevisedEndDate" TIMESTAMP,
    "ActualStartDate" TIMESTAMP,
    "ActualEndDate" TIMESTAMP,
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "FinancialYear" VARCHAR(20),
    "ContractStatusId" INTEGER,
    "Comments" TEXT,
    "QuantityDriven" SMALLINT DEFAULT 0,
    "VendorID" INTEGER,
    "RetentionIndicator" SMALLINT DEFAULT 0,
    "RetentionRate" DECIMAL(18,4),
    "ContractTypeID" INTEGER,
    "CurrentPeriodCommitment" DECIMAL(18,2),
    "InvoicedAmount" DECIMAL(18,2),
    "RevisedContractValue" DECIMAL(18,2),
    "ContractType_ID" INTEGER,
    "Status_ID" INTEGER,
    "Milestone_ID" INTEGER,
    "VariationLimitID" INTEGER,
    "DebitOrderRef" VARCHAR(100),
    "DebitOrderExpiryDate" TIMESTAMP,
    "IsVoid" SMALLINT DEFAULT 0,
    "VoidedDate" TIMESTAMP,
    "VoidedReason" TEXT,
    "VoidedBy" INTEGER,
    "ReferenceToID" INTEGER,
    "RetentionStartDate" TIMESTAMP,
    "RetentionEndDate" TIMESTAMP,
    "PayCertificateRequired" SMALLINT DEFAULT 0,
    "LoanRegisterID" INTEGER,
    "LoanContract" SMALLINT DEFAULT 0,
    "GuaranteeRate" DECIMAL(18,4),
    "GuaranteeRateStartDate" TIMESTAMP,
    "GuaranteeRateEndDate" TIMESTAMP,
    "GuaranteeQuantityDriven" SMALLINT DEFAULT 0,
    "GuaranteeIndicator" SMALLINT DEFAULT 0,
    "SocialResponsibilityIndicator" SMALLINT DEFAULT 0,
    "SocialResponsibilityRate" DECIMAL(18,4),
    "TotalRetentionReleased" DECIMAL(18,2),
    "TotalRetentionRetained" DECIMAL(18,2),
    "TotalGuaranteeReleased" DECIMAL(18,2),
    "TotalGuaranteeRetained" DECIMAL(18,2),
    "PreviousContractID" INTEGER,
    "FinalApprovedBy" INTEGER,
    "FinalApprovedDate" TIMESTAMP,
    "PanelOfVendors" SMALLINT DEFAULT 0,
    "TotalRetentionWithholding" DECIMAL(18,2),
    "TotalGuaranteeWithholding" DECIMAL(18,2),
    "isContractTakeOn" SMALLINT DEFAULT 0,
    "ProcurementID" INTEGER
);

CREATE TABLE IF NOT EXISTS "SCM_ContractDetailItems" (
    "ContractDetailItems_ID" INTEGER PRIMARY KEY,
    "ContractID" INTEGER,
    "RequisitionDetailID" INTEGER,
    "Cost" DECIMAL(18,2),
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "VatAmount" DECIMAL(18,2),
    "TotalAmount" DECIMAL(18,2),
    "VatExempt" SMALLINT DEFAULT 0,
    "ServiceItem" SMALLINT DEFAULT 0,
    "GoodsItem" SMALLINT DEFAULT 0,
    "PreviousContractDetailItemsID" INTEGER,
    "BillOfQuantityID" INTEGER,
    "VariationAmount" DECIMAL(18,2),
    "OriginalTotalAmount" DECIMAL(18,2),
    "VoidAmount" DECIMAL(18,2),
    "OriginalVATAmount" DECIMAL(18,2),
    "VoidVATAmount" DECIMAL(18,2),
    "PlanProjectItemId" INTEGER,
    "IsScopedExtensionVariation" SMALLINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "SCM_AssetUnbundling_Header" (
    "AssetContractHeader_ID" INTEGER PRIMARY KEY,
    "ContractID" INTEGER,
    "AssetParentID" INTEGER,
    "VendorID" INTEGER,
    "Enabled" SMALLINT DEFAULT 1,
    "Complete" SMALLINT,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "SCM_AssetUnbundling_Detail" (
    "AssetContractDetail_ID" INTEGER PRIMARY KEY,
    "AssetContractHeaderId" INTEGER,
    "ContractDetailItemId" INTEGER,
    "RegisterItemsId" INTEGER,
    "RequisitionBillOfQuantityId" INTEGER,
    "ProjectItemId" INTEGER,
    "SCOAItem" INTEGER,
    "GoodsServiceDescription" VARCHAR(500),
    "UOM" INTEGER,
    "Quantity" DECIMAL(18,8),
    "Rate" DECIMAL(18,2),
    "Amount" DECIMAL(18,2),
    "IsAsset" SMALLINT DEFAULT 0,
    "AssetDescription" VARCHAR(500),
    "CIDMS_Sub_Component_Type" INTEGER,
    "Asset_Type" INTEGER,
    "Asset_Category" INTEGER,
    "Asset_Sub_Category" INTEGER,
    "Measurement_Type" INTEGER,
    "Asset_Status" INTEGER,
    "Enabled" SMALLINT DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "ScmContractID" INTEGER;

-- Ensure expanded columns exist on SCM tables (idempotent for existing DBs)
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "CompanyDirector" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "VendorCategoryID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "VendorTypeID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "MyReferenceNumber" VARCHAR(100);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "VatRegistered" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "TaxCertificateNumber" VARCHAR(100);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "TaxCertificateDate" TIMESTAMP;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "PostalAddress1" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "PostalAddress2" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Postal_TownID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "PostalCode" VARCHAR(20);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "PhysicalAddress1" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "PhysicalAddress2" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Physical_TownID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Country" VARCHAR(100);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Tel_Home" VARCHAR(50);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Tel_Work" VARCHAR(50);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Tel_Mobile" VARCHAR(50);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Fax" VARCHAR(50);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "email" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Website" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "BankID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "BankAccountTypeID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "BankAccountNumber" VARCHAR(50);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "SupplyChainVendor" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "CreditorListDate" TIMESTAMP;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "ListingExpiryDate" TIMESTAMP;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "CreditLimit" DECIMAL(18,2);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "PercentageDiscount" DECIMAL(18,4);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "TermsDays" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "LastPurchaseDate" TIMESTAMP;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "BalanceAtMonthEnd" DECIMAL(18,2);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "YearEndBalance" DECIMAL(18,2);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "TotalOrdersAwardedForYear" DECIMAL(18,2);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "VendorLocationID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "BEEPercentage" DECIMAL(18,4);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "PreviouslyDisadvantaged" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "PDIExpiryDate" TIMESTAMP;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Certificate" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "PDIPercentage" DECIMAL(18,4);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Woman" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Disabled" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "HDI" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "UnitID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "AccountID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Notes" TEXT;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "ConstructionIndustryRegistration" VARCHAR(100);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "DateModified" TIMESTAMP;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "ModifierID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "BankBranchCodeID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "VendorCreditor" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "TradingName" VARCHAR(500);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "VendorRegistrationTypeID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "CompensationCommRegNumber" VARCHAR(100);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "PAYENumber" VARCHAR(100);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "PreviousBusiness" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "PreviousBusinessName" VARCHAR(500);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "VendorBBBEEContributorLevelID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "RegionalOfficesPhysicalLocation" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "NationalOfficesPhysicalLocation" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "CommunicationMethodID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "TaxClearanceCertVerified" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "VATCertVerified" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "IncomeTaxCertVerified" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "TaxClearanceCertVerifiedDate" TIMESTAMP;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "AwaitingApproval" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "VendorBBBEEContributorExemptionLevelID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "NameofBusinessforTradingPurpose" VARCHAR(500);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "CIPROCompanyNo" VARCHAR(100);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "EasternCapeOffice" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "IsNTBackList" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "FirstName" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "LastName" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "UserName" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Password" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Reason" TEXT;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "PhysicalPostalCode" VARCHAR(20);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "VendorRegistrationID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "CompanyTypeID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "EmailAddress" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "ContactName" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "VendorNumber" VARCHAR(100);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "CompanyName" VARCHAR(500);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Approved" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Status" VARCHAR(50);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "ServiceProviderNumber" VARCHAR(100);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "IncomeTaxRefNumber" VARCHAR(100);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "BBBEEContributorID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "ProvinceID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "NationalOffices" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "PrefferedMethodID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "NTBackList" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "RegistrationTypeID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "FinancialYear" VARCHAR(20);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "RegisterDate" TIMESTAMP;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "ApprovalDate" TIMESTAMP;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "StatusUpdateDate" TIMESTAMP;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Declaration" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "VoteID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "PaymentMethodID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "BlackListedFromDate" TIMESTAMP;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "BlackListedToDate" TIMESTAMP;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "BlackListedBy" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "BlackListReason" TEXT;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "PreviousBusinessRegistration" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "StatusChangeReason" TEXT;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "PaymentName" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "bActivatedForPayroll" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "bActivatedForBilling" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "bActivatedForLedger" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "bActivatedForAssets" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "bActivatedForSCM" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "bActivatedForPlanning" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "bPayrollCommission" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "CommissionPercentage" DECIMAL(18,4);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Directive_ID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Contract_ID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "Order_ID" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "UniqueRegistrationReferenceNumber" VARCHAR(200);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "LastCsdSupplierIdentificationUpdateDate" TIMESTAMP;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "CSDSupplierNumber" VARCHAR(100);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "LastCsdSupplierTaxDetailsUpdateDate" TIMESTAMP;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "TaxCertificateExpiryDate" TIMESTAMP;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "LastVerificationDate" TIMESTAMP;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "DiscountRate" DECIMAL(18,4);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "QualifyingDays" INTEGER;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "VendorRef_seb" VARCHAR(100);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "IsCSDImport" SMALLINT DEFAULT 0;
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "TotalAnnualTurnover" DECIMAL(18,2);
ALTER TABLE "Cons_Vendor" ADD COLUMN IF NOT EXISTS "TotalAnnualTurnoverName" VARCHAR(200);

ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "TenderQuotation" SMALLINT;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "TenderQuotationID" INTEGER;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "ContractManagerID" INTEGER;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "ServiceTypeID" INTEGER;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "VoteID" INTEGER;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "OrderNumber" VARCHAR(100);
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "RevisedStartDate" TIMESTAMP;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "RevisedEndDate" TIMESTAMP;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "ActualStartDate" TIMESTAMP;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "ActualEndDate" TIMESTAMP;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "DateModified" TIMESTAMP;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "ModifierID" INTEGER;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "ContractStatusId" INTEGER;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "Comments" TEXT;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "QuantityDriven" SMALLINT DEFAULT 0;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "RetentionIndicator" SMALLINT DEFAULT 0;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "RetentionRate" DECIMAL(18,4);
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "ContractTypeID" INTEGER;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "CurrentPeriodCommitment" DECIMAL(18,2);
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "InvoicedAmount" DECIMAL(18,2);
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "RevisedContractValue" DECIMAL(18,2);
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "IsVoid" SMALLINT DEFAULT 0;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "RetentionStartDate" TIMESTAMP;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "RetentionEndDate" TIMESTAMP;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "PayCertificateRequired" SMALLINT DEFAULT 0;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "GuaranteeRate" DECIMAL(18,4);
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "GuaranteeIndicator" SMALLINT DEFAULT 0;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "TotalRetentionReleased" DECIMAL(18,2);
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "TotalRetentionRetained" DECIMAL(18,2);
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "TotalGuaranteeReleased" DECIMAL(18,2);
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "TotalGuaranteeRetained" DECIMAL(18,2);
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "TotalRetentionWithholding" DECIMAL(18,2);
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "TotalGuaranteeWithholding" DECIMAL(18,2);
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "ContractType_ID" INTEGER;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "Status_ID" INTEGER;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "Milestone_ID" INTEGER;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "VariationLimitID" INTEGER;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "DebitOrderRef" VARCHAR(100);
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "DebitOrderExpiryDate" TIMESTAMP;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "VoidedDate" TIMESTAMP;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "VoidedReason" TEXT;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "VoidedBy" INTEGER;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "ReferenceToID" INTEGER;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "LoanRegisterID" INTEGER;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "LoanContract" SMALLINT DEFAULT 0;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "GuaranteeRateStartDate" TIMESTAMP;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "GuaranteeRateEndDate" TIMESTAMP;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "GuaranteeQuantityDriven" SMALLINT DEFAULT 0;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "SocialResponsibilityIndicator" SMALLINT DEFAULT 0;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "SocialResponsibilityRate" DECIMAL(18,4);
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "PreviousContractID" INTEGER;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "FinalApprovedBy" INTEGER;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "FinalApprovedDate" TIMESTAMP;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "PanelOfVendors" SMALLINT DEFAULT 0;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "isContractTakeOn" SMALLINT DEFAULT 0;
ALTER TABLE "SCM_ContractDetails" ADD COLUMN IF NOT EXISTS "ProcurementID" INTEGER;

ALTER TABLE "SCM_ContractDetailItems" ADD COLUMN IF NOT EXISTS "RequisitionDetailID" INTEGER;
ALTER TABLE "SCM_ContractDetailItems" ADD COLUMN IF NOT EXISTS "DateModified" TIMESTAMP;
ALTER TABLE "SCM_ContractDetailItems" ADD COLUMN IF NOT EXISTS "ModifierID" INTEGER;
ALTER TABLE "SCM_ContractDetailItems" ADD COLUMN IF NOT EXISTS "VatExempt" SMALLINT DEFAULT 0;
ALTER TABLE "SCM_ContractDetailItems" ADD COLUMN IF NOT EXISTS "ServiceItem" SMALLINT DEFAULT 0;
ALTER TABLE "SCM_ContractDetailItems" ADD COLUMN IF NOT EXISTS "GoodsItem" SMALLINT DEFAULT 0;
ALTER TABLE "SCM_ContractDetailItems" ADD COLUMN IF NOT EXISTS "PreviousContractDetailItemsID" INTEGER;
ALTER TABLE "SCM_ContractDetailItems" ADD COLUMN IF NOT EXISTS "VariationAmount" DECIMAL(18,2);
ALTER TABLE "SCM_ContractDetailItems" ADD COLUMN IF NOT EXISTS "OriginalTotalAmount" DECIMAL(18,2);
ALTER TABLE "SCM_ContractDetailItems" ADD COLUMN IF NOT EXISTS "VoidAmount" DECIMAL(18,2);
ALTER TABLE "SCM_ContractDetailItems" ADD COLUMN IF NOT EXISTS "OriginalVATAmount" DECIMAL(18,2);
ALTER TABLE "SCM_ContractDetailItems" ADD COLUMN IF NOT EXISTS "VoidVATAmount" DECIMAL(18,2);
ALTER TABLE "SCM_ContractDetailItems" ADD COLUMN IF NOT EXISTS "PlanProjectItemId" INTEGER;
ALTER TABLE "SCM_ContractDetailItems" ADD COLUMN IF NOT EXISTS "IsScopedExtensionVariation" SMALLINT DEFAULT 0;

ALTER TABLE "SCM_AssetUnbundling_Detail" ADD COLUMN IF NOT EXISTS "RegisterItemsId" INTEGER;
ALTER TABLE "SCM_AssetUnbundling_Detail" ADD COLUMN IF NOT EXISTS "RequisitionBillOfQuantityId" INTEGER;
ALTER TABLE "SCM_AssetUnbundling_Detail" ADD COLUMN IF NOT EXISTS "ProjectItemId" INTEGER;
ALTER TABLE "SCM_AssetUnbundling_Detail" ADD COLUMN IF NOT EXISTS "SCOAItem" INTEGER;
ALTER TABLE "SCM_AssetUnbundling_Detail" ADD COLUMN IF NOT EXISTS "CIDMS_Sub_Component_Type" INTEGER;
ALTER TABLE "SCM_AssetUnbundling_Detail" ADD COLUMN IF NOT EXISTS "Asset_Type" INTEGER;
ALTER TABLE "SCM_AssetUnbundling_Detail" ADD COLUMN IF NOT EXISTS "Asset_Category" INTEGER;
ALTER TABLE "SCM_AssetUnbundling_Detail" ADD COLUMN IF NOT EXISTS "Asset_Sub_Category" INTEGER;
ALTER TABLE "SCM_AssetUnbundling_Detail" ADD COLUMN IF NOT EXISTS "Measurement_Type" INTEGER;
ALTER TABLE "SCM_AssetUnbundling_Detail" ADD COLUMN IF NOT EXISTS "Asset_Status" INTEGER;

-- SCM FK constraints (idempotent — DO NOTHING on conflict)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_scm_contract_vendor') THEN
    ALTER TABLE "SCM_ContractDetails" ADD CONSTRAINT fk_scm_contract_vendor
      FOREIGN KEY ("VendorID") REFERENCES "Cons_Vendor"("Vendor_ID");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_scm_contractitems_contract') THEN
    ALTER TABLE "SCM_ContractDetailItems" ADD CONSTRAINT fk_scm_contractitems_contract
      FOREIGN KEY ("ContractID") REFERENCES "SCM_ContractDetails"("Contract_ID");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_scm_unbundlingheader_contract') THEN
    ALTER TABLE "SCM_AssetUnbundling_Header" ADD CONSTRAINT fk_scm_unbundlingheader_contract
      FOREIGN KEY ("ContractID") REFERENCES "SCM_ContractDetails"("Contract_ID");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_scm_unbundlingdetail_header') THEN
    ALTER TABLE "SCM_AssetUnbundling_Detail" ADD CONSTRAINT fk_scm_unbundlingdetail_header
      FOREIGN KEY ("AssetContractHeaderId") REFERENCES "SCM_AssetUnbundling_Header"("AssetContractHeader_ID");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_scm_unbundlingdetail_item') THEN
    ALTER TABLE "SCM_AssetUnbundling_Detail" ADD CONSTRAINT fk_scm_unbundlingdetail_item
      FOREIGN KEY ("ContractDetailItemId") REFERENCES "SCM_ContractDetailItems"("ContractDetailItems_ID");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_wip_scmcontract') THEN
    ALTER TABLE "Asset_WIP_Register" ADD CONSTRAINT fk_wip_scmcontract
      FOREIGN KEY ("ScmContractID") REFERENCES "SCM_ContractDetails"("Contract_ID");
  END IF;
END $$;

-- ============================================================================
-- Maintenance Module Tables
-- ============================================================================

-- Rename Const_MaintenanceLeadTime -> Const_AssetMaintenanceLeadTime (idempotent)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='Const_MaintenanceLeadTime')
  AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='Const_AssetMaintenanceLeadTime') THEN
    ALTER TABLE "Const_MaintenanceLeadTime" RENAME TO "Const_AssetMaintenanceLeadTime";
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Const_AssetMaintenanceLeadTime" (
    "LeadTimeID" SERIAL PRIMARY KEY,
    "MaintenanceDesc" VARCHAR(200),
    "LeadTimeDays" INTEGER DEFAULT 14,
    "Enabled" BOOLEAN DEFAULT true,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Const_Asset_ServiceGroup" (
    "AssetServiceGroupID" SERIAL PRIMARY KEY,
    "AssetServiceGroupDesc" VARCHAR(200),
    "Enabled" BOOLEAN DEFAULT true,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_MaintenanceRequest" (
    "RequestID" SERIAL PRIMARY KEY,
    "AssetServiceGroupID" INTEGER,
    "AssetType_ID" INTEGER,
    "AssetCategoryID" INTEGER,
    "Asset_SubCategory_ID" INTEGER,
    "RequestDate" TIMESTAMP,
    "LeadTimeID" INTEGER,
    "ProposedClosingTime" TIMESTAMP,
    "MaintenanceDescription" TEXT,
    "PlanProjectItem_ID" INTEGER DEFAULT 0,
    "IsApproved" BOOLEAN DEFAULT false,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_MaintenanceWorkOrder" (
    "MaintenanceWorksOrderID" SERIAL PRIMARY KEY,
    "RequestID" INTEGER,
    "WorkOrderDesc" VARCHAR(500),
    "AssetRegisterItemID" INTEGER,
    "WorkOrderDate" TIMESTAMP,
    "RequisitionNumber" INTEGER,
    "DebitAccount" INTEGER,
    "DebitAmount" DECIMAL(18,2),
    "CreditAccount" INTEGER,
    "CreditAmount" DECIMAL(18,2),
    "MaintainerID" INTEGER,
    "WorkOrderTypeID" INTEGER,
    "WorkOrderStatusID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_MaintenanceWorkOrderDetails" (
    "MaintenanceWorksOrderDetailsID" SERIAL PRIMARY KEY,
    "MaintenanceWorksOrderID" INTEGER,
    "TechnicianNumber" VARCHAR(100),
    "LineItemNumber" VARCHAR(100),
    "ItemType" VARCHAR(100),
    "CommodityID" INTEGER,
    "QuantityOrdered" INTEGER,
    "QuantityReceived" INTEGER,
    "Value" DECIMAL(18,2)
);

-- Maintenance FK constraints
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_maintenance_request_servicegroup') THEN
    ALTER TABLE "Asset_MaintenanceRequest" ADD CONSTRAINT fk_maintenance_request_servicegroup
      FOREIGN KEY ("AssetServiceGroupID") REFERENCES "Const_Asset_ServiceGroup"("AssetServiceGroupID");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_maintenance_request_leadtime') THEN
    ALTER TABLE "Asset_MaintenanceRequest" ADD CONSTRAINT fk_maintenance_request_leadtime
      FOREIGN KEY ("LeadTimeID") REFERENCES "Const_AssetMaintenanceLeadTime"("LeadTimeID");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_maintenance_workorder_request') THEN
    ALTER TABLE "Asset_MaintenanceWorkOrder" ADD CONSTRAINT fk_maintenance_workorder_request
      FOREIGN KEY ("RequestID") REFERENCES "Asset_MaintenanceRequest"("RequestID");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_maintenance_wodetail_workorder') THEN
    ALTER TABLE "Asset_MaintenanceWorkOrderDetails" ADD CONSTRAINT fk_maintenance_wodetail_workorder
      FOREIGN KEY ("MaintenanceWorksOrderID") REFERENCES "Asset_MaintenanceWorkOrder"("MaintenanceWorksOrderID");
  END IF;
END $$;

-- Work Order mSCOA account migration (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='Amount') THEN
    ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "Amount" DECIMAL(18,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='DebitProjectId') THEN
    ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "DebitProjectId" INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='DebitPlanProjectItemId') THEN
    ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "DebitPlanProjectItemId" INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='CreditProjectId') THEN
    ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "CreditProjectId" INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='CreditPlanProjectItemId') THEN
    ALTER TABLE "Asset_MaintenanceWorkOrder" ADD COLUMN "CreditPlanProjectItemId" INTEGER;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='DebitAccount') THEN
    ALTER TABLE "Asset_MaintenanceWorkOrder" DROP COLUMN "DebitAccount";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='DebitAmount') THEN
    ALTER TABLE "Asset_MaintenanceWorkOrder" DROP COLUMN "DebitAmount";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='CreditAccount') THEN
    ALTER TABLE "Asset_MaintenanceWorkOrder" DROP COLUMN "CreditAccount";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Asset_MaintenanceWorkOrder' AND column_name='CreditAmount') THEN
    ALTER TABLE "Asset_MaintenanceWorkOrder" DROP COLUMN "CreditAmount";
  END IF;
END $$;

-- Maintenance seed data: Lead Times
INSERT INTO "Const_AssetMaintenanceLeadTime" ("LeadTimeID", "MaintenanceDesc", "LeadTimeDays", "Enabled") VALUES
  (1, 'Emergency - Immediate', 1, true),
  (2, 'Urgent - Within 3 Days', 3, true),
  (3, 'Priority - Within 7 Days', 7, true),
  (4, 'Standard - Within 14 Days', 14, true),
  (5, 'Planned - Within 30 Days', 30, true),
  (6, 'Scheduled - Within 60 Days', 60, true),
  (7, 'Long Term - Within 90 Days', 90, true)
ON CONFLICT ("LeadTimeID") DO NOTHING;
SELECT setval(pg_get_serial_sequence('"Const_AssetMaintenanceLeadTime"', 'LeadTimeID'), (SELECT GREATEST(COALESCE(MAX("LeadTimeID"),0), 1) FROM "Const_AssetMaintenanceLeadTime"));

-- Maintenance seed data: Service Groups
INSERT INTO "Const_Asset_ServiceGroup" ("AssetServiceGroupID", "AssetServiceGroupDesc", "Enabled") VALUES
  (1, 'Electrical', true),
  (2, 'Plumbing', true),
  (3, 'Roads & Stormwater', true),
  (4, 'Building & Structures', true),
  (5, 'Mechanical', true),
  (6, 'IT & Communications', true),
  (7, 'Parks & Recreation', true),
  (8, 'Fleet & Transport', true),
  (9, 'Water & Sanitation', true)
ON CONFLICT ("AssetServiceGroupID") DO NOTHING;
SELECT setval(pg_get_serial_sequence('"Const_Asset_ServiceGroup"', 'AssetServiceGroupID'), (SELECT GREATEST(COALESCE(MAX("AssetServiceGroupID"),0), 1) FROM "Const_Asset_ServiceGroup"));

-- =============================================
-- Asset Verification Register tables
-- =============================================

CREATE TABLE IF NOT EXISTS "Asset_VerificationRegister" (
    "VerificationRegister_ID" SERIAL PRIMARY KEY,
    "RegisterName" VARCHAR(300) NOT NULL,
    "RegisterType" VARCHAR(50) NOT NULL,
    "Description" VARCHAR(150),
    "StartDate" TIMESTAMP,
    "EndDate" TIMESTAMP,
    "DashboardURL" VARCHAR(500),
    "TeamMembers" TEXT,
    "IsHistory" SMALLINT DEFAULT 0,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_VerificationRegisterTeamMember" (
    "RegisterTeamMember_ID" SERIAL PRIMARY KEY,
    "VerificationRegister_ID" INTEGER NOT NULL REFERENCES "Asset_VerificationRegister"("VerificationRegister_ID") ON DELETE CASCADE,
    "Employee_ID" INTEGER,
    "EmployeeName" VARCHAR(200),
    "IsExternal" SMALLINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "Asset_VerificationRegisterItem" (
    "VerificationItem_ID" SERIAL PRIMARY KEY,
    "VerificationRegister_ID" INTEGER NOT NULL REFERENCES "Asset_VerificationRegister"("VerificationRegister_ID"),
    "AssetRegisterItem_ID" INTEGER REFERENCES "Asset_Register_Items"("AssetRegisterItem_ID"),
    "MunicipalAssetID" VARCHAR(100),
    "Description" VARCHAR(500),
    "Barcode" VARCHAR(100),
    "SerialNumber" VARCHAR(100),
    "AssetType_ID" INTEGER,
    "AssetCategory_ID" INTEGER,
    "Asset_SubCategory_ID" INTEGER,
    "AssetClass_ID" INTEGER,
    "Town_ID" INTEGER,
    "MunicipalDepartment_ID" VARCHAR(250),
    "Building_ID" INTEGER,
    "FloorID" INTEGER,
    "Room_ID" INTEGER,
    "PurchaseAmount" NUMERIC(18,2),
    "CarryingAmountClosingBalance" NUMERIC(18,2),
    "Custodian_ID" INTEGER,
    "AssetCondition_ID" INTEGER,
    "AssetStatus_ID" INTEGER,
    "latitude" VARCHAR(50),
    "longitude" VARCHAR(50),
    "GPSCoordinates" VARCHAR(200),
    "VerificationDate" TIMESTAMP,
    "Temp_VerificationDate" TIMESTAMP,
    "Verification_Flag" VARCHAR(50),
    "Verification_Comments" VARCHAR(500),
    "Asset_Found" SMALLINT,
    "Keep_on_Register_Dispose" VARCHAR(50),
    "Revisit" SMALLINT DEFAULT 0,
    "Reason_for_Revisit" VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS "Asset_VerificationAuditTrail" (
    "AuditTrail_ID" SERIAL PRIMARY KEY,
    "VerificationItem_ID" INTEGER NOT NULL REFERENCES "Asset_VerificationRegisterItem"("VerificationItem_ID"),
    "FieldName" VARCHAR(100) NOT NULL,
    "OldValue" TEXT,
    "NewValue" TEXT,
    "ChangedByID" INTEGER DEFAULT 1,
    "ChangedByName" VARCHAR(200),
    "ChangedAt" TIMESTAMP DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "ParentAssetRegisterItem_ID" VARCHAR(100);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "MainAssetDescription" VARCHAR(500);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "MainAssetID" VARCHAR(100);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "OldBarCode" VARCHAR(100);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "ImageRef" VARCHAR(255);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "MeasurementType_ID" INTEGER;
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "InfrastructurOrNonInfrastructure" VARCHAR(50);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "VerificationDoneBy" INTEGER;
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "UoM" INTEGER;
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "Dim1" NUMERIC(18,4);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "Dim2" NUMERIC(18,4);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "Dim3" NUMERIC(18,4);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "Quantity" NUMERIC(18,4);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "Diameter" NUMERIC(18,4);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "Capacity" NUMERIC(18,4);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "ErfNumber" VARCHAR(100);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "ErfSizeM2" NUMERIC(18,4);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "PortionNumber" VARCHAR(100);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "UnitNumber" VARCHAR(100);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "RegistrationNumber" VARCHAR(100);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "CustodianIdNumber" VARCHAR(50);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "BasicMunicipalityService" INTEGER;
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "AssetOwnership_ID" INTEGER;
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "DivisionID" INTEGER;
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "Street_ID" INTEGER;
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "Ward_ID" INTEGER;
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "Zoning_ID" INTEGER;
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "Floor_Area" NUMERIC(18,8);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "SuburbID" INTEGER;
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "Make" VARCHAR(100);
    ALTER TABLE "Asset_VerificationRegisterItem" ADD COLUMN IF NOT EXISTS "Model" VARCHAR(100);
END $$;

DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Asset_Register_Items' AND column_name = 'VerificationDoneBy'
        AND data_type = 'character varying'
    ) THEN
        ALTER TABLE "Asset_Register_Items"
            ALTER COLUMN "VerificationDoneBy" TYPE INTEGER
            USING NULLIF(TRIM("VerificationDoneBy"), '')::INTEGER;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Asset_VerificationRegisterItem' AND column_name = 'VerificationDoneBy'
        AND data_type = 'character varying'
    ) THEN
        ALTER TABLE "Asset_VerificationRegisterItem"
            ALTER COLUMN "VerificationDoneBy" TYPE INTEGER
            USING NULLIF(TRIM("VerificationDoneBy"), '')::INTEGER;
    END IF;
END $$;

-- VerificationDoneBy now stores RegisterTeamMember_ID (not Employee_ID), so FK to Payroll_Employee is removed
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_verification_item_done_by'
        AND table_name = 'Asset_VerificationRegisterItem'
    ) THEN
        ALTER TABLE "Asset_VerificationRegisterItem"
            DROP CONSTRAINT fk_verification_item_done_by;
    END IF;
END $$;

-- ===== Verification Planning tables =====
CREATE TABLE IF NOT EXISTS "Asset_VerificationPlan" (
    "VerificationPlan_ID" SERIAL PRIMARY KEY,
    "PlanName" VARCHAR(300) NOT NULL,
    "PlannedStartDate" TIMESTAMP,
    "PlannedEndDate" TIMESTAMP,
    "AssetTypes" JSONB,
    "AssetCategories" JSONB,
    "Town_ID" INTEGER,
    "Suburb_ID" INTEGER,
    "Building_ID" INTEGER,
    "ScopeOfWork" VARCHAR(250),
    "LinkedRegisterId" INTEGER,
    "DashboardURL" VARCHAR(500),
    "Status" VARCHAR(50) DEFAULT 'Draft',
    "Version" INTEGER DEFAULT 1,
    "DateCaptured" TIMESTAMP DEFAULT NOW(),
    "CapturerID" INTEGER DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER
);

CREATE TABLE IF NOT EXISTS "Asset_VerificationPlanTeamMember" (
    "TeamMember_ID" SERIAL PRIMARY KEY,
    "VerificationPlan_ID" INTEGER NOT NULL REFERENCES "Asset_VerificationPlan"("VerificationPlan_ID") ON DELETE CASCADE,
    "Role" VARCHAR(50) NOT NULL,
    "Employee_ID" INTEGER,
    "EmployeeName" VARCHAR(200),
    "IsExternal" SMALLINT DEFAULT 0,
    "ContactNumber" VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS "Asset_VerificationPlanApproval" (
    "Approval_ID" SERIAL PRIMARY KEY,
    "VerificationPlan_ID" INTEGER NOT NULL REFERENCES "Asset_VerificationPlan"("VerificationPlan_ID") ON DELETE CASCADE,
    "Version" INTEGER DEFAULT 1,
    "ApprovedBy" INTEGER,
    "ApprovedByName" VARCHAR(200),
    "IsExternal" SMALLINT DEFAULT 0,
    "ApprovalDate" TIMESTAMP,
    "DocumentId" INTEGER,
    "CreatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Asset_VerificationPlanAuditTrail" (
    "AuditTrail_ID" SERIAL PRIMARY KEY,
    "VerificationPlan_ID" INTEGER NOT NULL REFERENCES "Asset_VerificationPlan"("VerificationPlan_ID") ON DELETE CASCADE,
    "Version" INTEGER DEFAULT 1,
    "ChangedByID" INTEGER DEFAULT 1,
    "ChangedByName" VARCHAR(200),
    "ChangedAt" TIMESTAMP DEFAULT NOW(),
    "ChangesSummary" JSONB
);

CREATE TABLE IF NOT EXISTS "Const_SCOA_Structure" (
    "ScoaID" INTEGER PRIMARY KEY,
    "ScoaCode" VARCHAR(100),
    "LevelID" INTEGER,
    "TableID" INTEGER,
    "TableName" VARCHAR(50),
    "PostingLevel" VARCHAR(6),
    "BreakDownAllowed" VARCHAR(6),
    "ScoaDesc" VARCHAR(2000),
    "ScoaShortDesc" VARCHAR(400),
    "ScoaParentID" INTEGER,
    "VoteTypeID" INTEGER,
    "DebitCreditID" INTEGER,
    "VatIndicatorID" INTEGER,
    "VatApportionment" INTEGER,
    "CapitalTimePeriodID" INTEGER,
    "IsCapexVote" SMALLINT,
    "IsControlVote" SMALLINT,
    "ParentID" INTEGER,
    "NTVatStatus" VARCHAR(100),
    "NTSCOAFile" VARCHAR(200),
    "NTScoaLevel" VARCHAR(200),
    "NTExcelRowNumber" VARCHAR(100),
    "NTPrinciple" VARCHAR(1000),
    "NTApplicableTo" VARCHAR(1000),
    "NTPostingLevelDescription" VARCHAR(1000),
    "NTScoaID" UUID,
    "NTParentScoaId" UUID,
    "DefinitionDescription" VARCHAR(3000),
    "Enabled" SMALLINT NOT NULL DEFAULT 1,
    "Version" VARCHAR(20) NOT NULL DEFAULT '',
    "NTGFSCode" VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS "Asset_UploadType" (
    "ID" SERIAL PRIMARY KEY,
    "Enabled" SMALLINT NOT NULL DEFAULT 1
);
INSERT INTO "Asset_UploadType" ("ID", "Type", "Enabled")
VALUES (1, 'Normal', 1), (2, 'WIP', 1), (3, 'Donated', 1), (4, 'Initial', 1), (5, 'Unbundling', 1)
ON CONFLICT ("ID") DO NOTHING;
SELECT setval(pg_get_serial_sequence('"Asset_UploadType"', 'ID'), GREATEST((SELECT MAX("ID") FROM "Asset_UploadType"), 5));

CREATE TABLE IF NOT EXISTS "Asset_Transfer_Transactions" (
    "AssetTransfer_ID" SERIAL PRIMARY KEY,
    "AssetItemID" INTEGER NOT NULL,
    "TransferDate" TIMESTAMP NOT NULL,
    "TransferValue" DECIMAL(18,2),
    "Run_ID" INTEGER,
    "Component_ID" INTEGER,
    "DebitPlanProjectItemID" INTEGER,
    "CreditPlanProjectItemID" INTEGER,
    "MainAssetID" INTEGER,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CapturerID" INTEGER NOT NULL DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "IsApproved" SMALLINT DEFAULT 0
);

ALTER TABLE "Asset_BulkUploadJobs" ADD COLUMN IF NOT EXISTS "UploadType" INTEGER DEFAULT 1;

CREATE TABLE IF NOT EXISTS "Asset_Refurb" (
    "Asset_RefurbID" SERIAL PRIMARY KEY,
    "AssetRegisterID" INT NOT NULL,
    "FinancialPeriod" INT NOT NULL,
    "FinancialYear" VARCHAR(10) NOT NULL,
    "RefurbDate" TIMESTAMP NOT NULL,
    "Refurb_DT" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "Refurb_CT" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "Refurb_Depreciation" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "Refurb_Revaluation" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "Refurb_Impairment" DECIMAL(16,2) NOT NULL DEFAULT 0,
    "isApproved" BOOLEAN NULL,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CapturerID" INT NOT NULL DEFAULT 1,
    "DateModified" TIMESTAMP NULL,
    "ModifierID" INT NULL,
    "DebitPlanProjectItemId" INT NULL,
    "CreditPlanProjectItemId" INT NULL
);

CREATE TABLE IF NOT EXISTS "Const_AssetProjectStatus" (
    "AssetProjectStatus_ID" SERIAL PRIMARY KEY,
    "StatusDesc" VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Const_FundingSource" (
    "FundingSource_ID" SERIAL PRIMARY KEY,
    "FundingSourceDesc" VARCHAR(200) NOT NULL,
    "Enabled" SMALLINT NOT NULL DEFAULT 1,
    "DateCaptured" TIMESTAMP NOT NULL DEFAULT NOW(),
    "CapturerID" INTEGER NOT NULL DEFAULT 1,
    "DateModified" TIMESTAMP,
    "ModifierID" INTEGER,
    "FinYear" VARCHAR(9),
    "PreviousReferenceId" INTEGER
);

ALTER TABLE "Asset_WIP_Register" ADD COLUMN IF NOT EXISTS "AssetRegisterItem_ID" INTEGER;

CREATE TABLE IF NOT EXISTS "SCM_Invoice" (
    "Invoice_ID"                         INTEGER PRIMARY KEY,
    "OrderID"                            INTEGER NULL,
    "GRNID"                              INTEGER NULL,
    "VendorInvoiceNumber"                VARCHAR(50) NULL,
    "InvoiceDate"                        TIMESTAMP NULL,
    "Enabled"                            SMALLINT NOT NULL DEFAULT 1,
    "DateCaptured"                       TIMESTAMP NOT NULL DEFAULT NOW(),
    "CapturerID"                         INTEGER NOT NULL DEFAULT 1,
    "DateModified"                       TIMESTAMP NULL,
    "ModifierID"                         INTEGER NULL,
    "StatusID"                           INTEGER NULL,
    "FinancialYear"                      VARCHAR(50) NULL,
    "ApprovedBy"                         INTEGER NULL,
    "ApprovedDate"                       TIMESTAMP NULL,
    "CancelReason"                       VARCHAR(500) NULL,
    "Comments"                           VARCHAR(500) NULL,
    "VoteSectionID"                      INTEGER NULL,
    "VendorCreditorID"                   INTEGER NULL,
    "PayrollPeriodID"                    INTEGER NULL,
    "AccountID"                          INTEGER NULL,
    "VendorInvoiceNumberCustom"          VARCHAR(50) NULL,
    "ServiceInvoiceID"                   INTEGER NULL,
    "DocNumber"                          VARCHAR(20) NULL,
    "Calculated_Invoice_Amount"          DECIMAL(16,2) NULL,
    "Retention_Amount"                   DECIMAL(16,2) NULL,
    "DocumentStatus"                     VARCHAR(5) NULL,
    "RemittanceAdviceID"                 INTEGER NULL,
    "ContractID"                         INTEGER NULL,
    "InvoicingVendorID"                  INTEGER NULL,
    "EFTGeneratedDate"                   TIMESTAMP NULL,
    "IsEFTApproved"                      INTEGER NULL,
    "IsEFTGenerated"                     INTEGER NULL,
    "EFTApprovedDate"                    TIMESTAMP NULL,
    "EFTApprovedBy"                      INTEGER NULL,
    "EFTDeclineReason"                   VARCHAR(50) NULL,
    "OldInvoiceNumber"                   VARCHAR(500) NULL,
    "PaymentReference"                   VARCHAR(500) NULL,
    "GRNDetailID"                        INTEGER NULL,
    "Discount"                           SMALLINT NULL,
    "VolumeDiscount"                     SMALLINT NULL,
    "DiscountToAll"                      SMALLINT NULL,
    "DiscountRate"                       DECIMAL(18,2) NULL,
    "DiscountAmount"                     DECIMAL(18,2) NULL,
    "InvoiceReceivedDate"                TIMESTAMP NULL,
    "FinalApprovedBy"                    INTEGER NULL,
    "FinalApprovedDate"                  TIMESTAMP NULL,
    "PaymentCertificateId"               INTEGER NULL,
    "CashbookId"                         INTEGER NULL,
    "Guarantee_Amount"                   DECIMAL(10,2) NULL,
    "SocialResp_Amount"                  DECIMAL(10,2) NULL,
    "RetentionReleased"                  DECIMAL(18,2) NULL,
    "GuaranteeReleased"                  DECIMAL(18,2) NULL,
    "ContractServiceRequestId"           INTEGER NULL,
    "TakeOnContractId"                   INTEGER NULL,
    "ProcessingMonth"                    INTEGER NULL,
    "IsTransferredToLongTermLiability"   SMALLINT NULL,
    "LongTermAgreementDate"              TIMESTAMP NULL,
    "TransferredDate"                    TIMESTAMP NULL,
    "TransferredSCOAItemId"              INTEGER NULL,
    "VoidProcessingMonth"                INTEGER NULL,
    "RetentionWithholding"               DECIMAL(18,2) NULL,
    "GuaranteeWithholding"               DECIMAL(18,2) NULL,
    "WithholdingDate"                    TIMESTAMP NULL,
    "WithholdingComments"                VARCHAR(500) NULL
);

CREATE TABLE IF NOT EXISTS "SCM_InvoiceDetail" (
    "InvoiceDetail_ID"                   INTEGER PRIMARY KEY,
    "InvoiceID"                          INTEGER NULL,
    "ItemDescription"                    TEXT NULL,
    "UnitPrice"                          DECIMAL(18,2) NULL,
    "QuantityOrder"                      DECIMAL(16,4) NULL,
    "QuantityReceived"                   DECIMAL(16,4) NULL,
    "VatInclude"                         SMALLINT NULL,
    "Amount"                             DECIMAL(30,2) NULL,
    "ReceivedUnitPrice"                  DECIMAL(18,2) NULL,
    "VatAmount"                          DECIMAL(18,2) NULL,
    "TotalAmount"                        DECIMAL(18,2) NULL,
    "StatusID"                           INTEGER NULL,
    "ApprovedBy"                         INTEGER NULL,
    "ApprovedDate"                       TIMESTAMP NULL,
    "CancelReason"                       VARCHAR(500) NULL,
    "EmployeeID"                         INTEGER NULL,
    "SCOAFunctionID"                     INTEGER NOT NULL DEFAULT 0,
    "SCOAItemID"                         INTEGER NOT NULL DEFAULT 0,
    "SCOARegionID"                       INTEGER NOT NULL DEFAULT 0,
    "SCOACostingID"                      INTEGER NOT NULL DEFAULT 0,
    "SCOAProjectID"                      INTEGER NOT NULL DEFAULT 0,
    "Enabled"                            SMALLINT NOT NULL DEFAULT 1,
    "DateCaptured"                       TIMESTAMP NOT NULL DEFAULT NOW(),
    "CapturerID"                         INTEGER NOT NULL DEFAULT 1,
    "DateModified"                       TIMESTAMP NULL,
    "ModifierID"                         INTEGER NULL,
    "VoteId"                             INTEGER NULL,
    "OrderDetailID"                      INTEGER NULL,
    "IsVoid"                             SMALLINT NULL,
    "VoidedDate"                         TIMESTAMP NULL,
    "VoidedReason"                       VARCHAR(1000) NULL,
    "VoidedBy"                           INTEGER NULL,
    "GRRDetailID"                        INTEGER NULL,
    "ServiceInvoiceDetailID"             INTEGER NULL,
    "isDiscounted"                       SMALLINT NULL,
    "DiscountRate"                       DECIMAL(18,4) NULL,
    "DiscountAmount"                     DECIMAL(18,2) NULL,
    "DiscountedAmount"                   DECIMAL(18,2) NULL,
    "IsVatExemption"                     SMALLINT NULL,
    "ContractDetailItemsID"              INTEGER NULL,
    "DivisionId"                         INTEGER NULL,
    "VATApportionmentPercentage"         DECIMAL(12,2) NULL,
    "VATApportionmentAmount"             DECIMAL(18,2) NULL,
    "PlanProjectItemID"                  INTEGER NULL,
    "ContractServiceRequestDetailsId"    INTEGER NULL,
    "TakeOnContractDetailId"             INTEGER NULL,
    "LinkedInvoiceDetailId"              INTEGER NULL
);

-- ============================================================
-- Migration: Led_GeneralLedger → Asset_GeneralLedger
-- Drop 24 columns not used by the asset side, then rename.
-- All steps are idempotent (safe to re-run).
-- ============================================================

DO $$
BEGIN
    -- Drop unused columns (IF EXISTS so re-running is safe)
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "CashbookTransactionID";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "Balance";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "DateModified";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "ModifierID";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "NormalJournalID";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "MultipleJournalID";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "PayrollLinkID";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "BillingLinkID";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "ExtraLinkID_1";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "ExtraLinkID_2";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "ExtraLinkID_3";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "ExtraLinkDesc";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "BillingNormalJournalID";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "BillingTransferJournalID";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "InvenLinkID";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "SundryDebtorsJournalID";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "VATRate";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "VATRateID";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "VATReconControlID";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "IsVATReconciled";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "VATReconciledByID";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "VATReconciledDate";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "VATComment";
    ALTER TABLE IF EXISTS "Led_GeneralLedger" DROP COLUMN IF EXISTS "PettyCashRegisterLineItemID";

    -- Rename table (guard: only rename if old name still exists)
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'Led_GeneralLedger' AND n.nspname = 'public'
    ) THEN
        ALTER TABLE "Led_GeneralLedger" RENAME TO "Asset_GeneralLedger";
    END IF;
END $$;

-- Drop old indexes (if they were created before the table was renamed)
DROP INDEX IF EXISTS idx_led_gl_vote;
DROP INDEX IF EXISTS idx_led_gl_finyear;

-- Re-create indexes under new names (IF NOT EXISTS is safe)
CREATE INDEX IF NOT EXISTS idx_asset_gl_vote ON "Asset_GeneralLedger"("VoteID");
CREATE INDEX IF NOT EXISTS idx_asset_gl_finyear ON "Asset_GeneralLedger"("FinYear");

-- =============================================================================
-- Migration: Remove unused columns from asset tables (Task #64)
-- Applied: 2026-03-24
-- Safe to re-run: all statements use IF EXISTS guard
-- Scope: Asset_* and AssetConfig_* tables only
--        External integration tables (Cons_Vendor, SCM_*, Plan_*, Payroll_*,
--        Led_Vote, Led_Journal_Asset) and Const_* lookup tables are untouched.
-- =============================================================================

-- Asset_Register_Items
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ProjectItem_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ScoaVote";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Donated_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "GRN_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "GIS_URL";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "SiteNumber";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Prod_Key_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Year";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "RoomNumber";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ScoaFunction_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ScoaProject_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ScoaFunds_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ScoaRegion_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Image";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "OriginalCostClosingBalance";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "IsAwaitingApproval";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "CommodityType_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "CostFormula_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "TakeOnType_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "SubIdentification";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "SCOARepairsAndMaintenance";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "RestorationAndSimilarLiabilitiesAmount";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "OrderNumber";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "EFTReferenceNumber";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ContributedAssets";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ReplacementOrNew";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ConditionCheckDate";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ConditionAssessmentDoneBy";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ChangeInAccountingPolicyAmount";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ResidualValueAmountChangeInAccountingEstimate";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ReversalImpairmentInFull";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ReversalImpairmentIfNotInFullAmountToBeReversed";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ReasonForImpairment";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ImpairmentsReferenceToCouncilResolution";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "NetGainsLossesFromFairAmountAdjustments";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "PerformedBy";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "MultiOrSingleYear";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ProjectUnbundledAmount";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "MethodOfTransferTo";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "TransferToAssetType";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "TransferToGRAPAndAFSCLASS";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "TransferToCostCentre";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "DateOfTransfer";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ReplacedAssetsReferenceNumber";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "TransferTo";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "TransferFrom";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "MethodOfDisposal";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "WarrenteesReference";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "NERSA_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "AssetCalculationType_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Scoa_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Asset_SubCategory_Group_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Asset_SubCategory_Group_Type_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Asset_Component_Type_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "WIP_Opening_Balance";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "WIP_Closing_Balance";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "WIP_Current_Year";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Cash_Generating_Asset_Indicator";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Recoverable_Amount";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Replacement_Value";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Scoa_Cost_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Scoa_Acquistion_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Scoa_Contributing_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "AssetFlags_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "AdditionalCost";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "RevisedUsefulLife";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ExpectedDepreciationRate";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ExpectedAmortisationRate";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "EvidenceDocument";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ActualUnitProducedThisYear";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ExpectedUnitsOfProduction";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Supplier_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "RemainingPeriod";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Leased";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Cost_Centre";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Cost_Centre_Code";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Upload_Type";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "AssetLevel";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "RejectReason";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "InventoryID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "TempStatusID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "PreviousCondition";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ConditionChangeLevel";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "OldScoaProject_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "OldScoa_Cost_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "OldScoaFunction_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "OldScoaFunds_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "OldScoaRegion_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "OldScoa_Acquistion_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "OldScoa_Contributing_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Takon_ItemID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "TransactionProjectDR";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "TransactionProjectItemDR";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "TransactionProjectCR";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "TransactionProjectItemCR";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "InsuredBy";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Validated";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "AccumulatedDepreciationVoteAcc";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "AccumulatedImpairmentVoteAcc";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "FairvalueVoteAcc";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "RevaluationVoteAcc";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "DecommissioningVoteAcc";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "InsureanceDocument";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Sub_Component_Type_ID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom_10";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom_11";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom_12";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom_13";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom_14";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom_15";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom_16";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom_17";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom_18";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom_19";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom_20";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom_21";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom_22";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom_23";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom_24";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom_25";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Custom_26";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "DonationDocument";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "PreviousForecastReplacementYear";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "VerifyID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "Insured";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "InsuranceAmount";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "ContractHeader_Id";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "SundryPaymentId";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "IssueID";
ALTER TABLE IF EXISTS "Asset_Register_Items" DROP COLUMN IF EXISTS "HighValueID";

-- Asset_Disposal
ALTER TABLE IF EXISTS "Asset_Disposal" DROP COLUMN IF EXISTS "TotalDisposalValue";
ALTER TABLE IF EXISTS "Asset_Disposal" DROP COLUMN IF EXISTS "DisposalValueYear";
ALTER TABLE IF EXISTS "Asset_Disposal" DROP COLUMN IF EXISTS "CapacityDateDisposal";
ALTER TABLE IF EXISTS "Asset_Disposal" DROP COLUMN IF EXISTS "DisposalResidualValue";
ALTER TABLE IF EXISTS "Asset_Disposal" DROP COLUMN IF EXISTS "CouncilResolution";
ALTER TABLE IF EXISTS "Asset_Disposal" DROP COLUMN IF EXISTS "Reference";
ALTER TABLE IF EXISTS "Asset_Disposal" DROP COLUMN IF EXISTS "AssetJournalMethodID";
ALTER TABLE IF EXISTS "Asset_Disposal" DROP COLUMN IF EXISTS "DateDisposed";

-- Asset_Impairment
ALTER TABLE IF EXISTS "Asset_Impairment" DROP COLUMN IF EXISTS "FairValueMethodID";
ALTER TABLE IF EXISTS "Asset_Impairment" DROP COLUMN IF EXISTS "ValuationType";
ALTER TABLE IF EXISTS "Asset_Impairment" DROP COLUMN IF EXISTS "ScenarioMethod";

-- Asset_ImpairmentPostings
ALTER TABLE IF EXISTS "Asset_ImpairmentPostings" DROP COLUMN IF EXISTS "DRAcc";
ALTER TABLE IF EXISTS "Asset_ImpairmentPostings" DROP COLUMN IF EXISTS "CRAcc";
ALTER TABLE IF EXISTS "Asset_ImpairmentPostings" DROP COLUMN IF EXISTS "DRAccText";
ALTER TABLE IF EXISTS "Asset_ImpairmentPostings" DROP COLUMN IF EXISTS "CRAccText";
ALTER TABLE IF EXISTS "Asset_ImpairmentPostings" DROP COLUMN IF EXISTS "PortionedLoss";
ALTER TABLE IF EXISTS "Asset_ImpairmentPostings" DROP COLUMN IF EXISTS "NewCarryingValue";

-- Asset_DepreciationSchedule
ALTER TABLE IF EXISTS "Asset_DepreciationSchedule" DROP COLUMN IF EXISTS "AssignedApproverID";
ALTER TABLE IF EXISTS "Asset_DepreciationSchedule" DROP COLUMN IF EXISTS "IsDeclined";
ALTER TABLE IF EXISTS "Asset_DepreciationSchedule" DROP COLUMN IF EXISTS "DeclinedReason";

-- Asset_FairValue
ALTER TABLE IF EXISTS "Asset_FairValue" DROP COLUMN IF EXISTS "Location";
ALTER TABLE IF EXISTS "Asset_FairValue" DROP COLUMN IF EXISTS "ValueDeterminant";

-- Asset_WIP_Register_Items
ALTER TABLE IF EXISTS "Asset_WIP_Register_Items" DROP COLUMN IF EXISTS "UnbundledAmount";
ALTER TABLE IF EXISTS "Asset_WIP_Register_Items" DROP COLUMN IF EXISTS "CompletedPercentage";
ALTER TABLE IF EXISTS "Asset_WIP_Register_Items" DROP COLUMN IF EXISTS "AssetGroupType";
ALTER TABLE IF EXISTS "Asset_WIP_Register_Items" DROP COLUMN IF EXISTS "Component";
ALTER TABLE IF EXISTS "Asset_WIP_Register_Items" DROP COLUMN IF EXISTS "Nersa";
ALTER TABLE IF EXISTS "Asset_WIP_Register_Items" DROP COLUMN IF EXISTS "DIM1";
ALTER TABLE IF EXISTS "Asset_WIP_Register_Items" DROP COLUMN IF EXISTS "DIM2";
ALTER TABLE IF EXISTS "Asset_WIP_Register_Items" DROP COLUMN IF EXISTS "DIM3";
ALTER TABLE IF EXISTS "Asset_WIP_Register_Items" DROP COLUMN IF EXISTS "DimensionQty";

-- Asset_WIPApprovalItems
ALTER TABLE IF EXISTS "Asset_WIPApprovalItems" DROP COLUMN IF EXISTS "AssetID";
ALTER TABLE IF EXISTS "Asset_WIPApprovalItems" DROP COLUMN IF EXISTS "TransactionAmountDR";
ALTER TABLE IF EXISTS "Asset_WIPApprovalItems" DROP COLUMN IF EXISTS "TransactionAmountCR";
ALTER TABLE IF EXISTS "Asset_WIPApprovalItems" DROP COLUMN IF EXISTS "DR_SCOAID";
ALTER TABLE IF EXISTS "Asset_WIPApprovalItems" DROP COLUMN IF EXISTS "CR_SCOAID";
ALTER TABLE IF EXISTS "Asset_WIPApprovalItems" DROP COLUMN IF EXISTS "TransactionDescription";
ALTER TABLE IF EXISTS "Asset_WIPApprovalItems" DROP COLUMN IF EXISTS "IsDeclined";
ALTER TABLE IF EXISTS "Asset_WIPApprovalItems" DROP COLUMN IF EXISTS "CapturerDate";
ALTER TABLE IF EXISTS "Asset_WIPApprovalItems" DROP COLUMN IF EXISTS "DeclinedDate";

-- Asset_BulkValidation
ALTER TABLE IF EXISTS "Asset_BulkValidation" DROP COLUMN IF EXISTS "OldBarcode";
ALTER TABLE IF EXISTS "Asset_BulkValidation" DROP COLUMN IF EXISTS "Sub_ComponentType";
ALTER TABLE IF EXISTS "Asset_BulkValidation" DROP COLUMN IF EXISTS "Erf_FarmNumber";
ALTER TABLE IF EXISTS "Asset_BulkValidation" DROP COLUMN IF EXISTS "StandNumber";
ALTER TABLE IF EXISTS "Asset_BulkValidation" DROP COLUMN IF EXISTS "Region";
ALTER TABLE IF EXISTS "Asset_BulkValidation" DROP COLUMN IF EXISTS "PurchaseAmountFinanceCharges";
ALTER TABLE IF EXISTS "Asset_BulkValidation" DROP COLUMN IF EXISTS "TransferFromMunicipality";
ALTER TABLE IF EXISTS "Asset_BulkValidation" DROP COLUMN IF EXISTS "TransferToMunicipality";
ALTER TABLE IF EXISTS "Asset_BulkValidation" DROP COLUMN IF EXISTS "TransferNatureOfTransfer";
ALTER TABLE IF EXISTS "Asset_BulkValidation" DROP COLUMN IF EXISTS "TransferReasonOfTransfer";

-- Asset_Register_Items_Upload
ALTER TABLE IF EXISTS "Asset_Register_Items_Upload" DROP COLUMN IF EXISTS "Sub_ComponentType";
ALTER TABLE IF EXISTS "Asset_Register_Items_Upload" DROP COLUMN IF EXISTS "StandNumber";
ALTER TABLE IF EXISTS "Asset_Register_Items_Upload" DROP COLUMN IF EXISTS "Region";
ALTER TABLE IF EXISTS "Asset_Register_Items_Upload" DROP COLUMN IF EXISTS "PurchaseAmountFinanceCharges";
ALTER TABLE IF EXISTS "Asset_Register_Items_Upload" DROP COLUMN IF EXISTS "AccumulatedImpairmentMovement2";
ALTER TABLE IF EXISTS "Asset_Register_Items_Upload" DROP COLUMN IF EXISTS "RevaluationClosingBalance";

-- AssetConfig_TransactionType
ALTER TABLE IF EXISTS "AssetConfig_TransactionType" DROP COLUMN IF EXISTS "DRProjectType23";
ALTER TABLE IF EXISTS "AssetConfig_TransactionType" DROP COLUMN IF EXISTS "DRPositionStatementType11";
ALTER TABLE IF EXISTS "AssetConfig_TransactionType" DROP COLUMN IF EXISTS "DRPositionStatementType12";
ALTER TABLE IF EXISTS "AssetConfig_TransactionType" DROP COLUMN IF EXISTS "DRPositionStatementType13";
ALTER TABLE IF EXISTS "AssetConfig_TransactionType" DROP COLUMN IF EXISTS "DRPositionStatementType14";
ALTER TABLE IF EXISTS "AssetConfig_TransactionType" DROP COLUMN IF EXISTS "DRPositionStatementType21";
ALTER TABLE IF EXISTS "AssetConfig_TransactionType" DROP COLUMN IF EXISTS "DRPositionStatementType22";
ALTER TABLE IF EXISTS "AssetConfig_TransactionType" DROP COLUMN IF EXISTS "DRPositionStatementType23";
ALTER TABLE IF EXISTS "AssetConfig_TransactionType" DROP COLUMN IF EXISTS "CRPositionStatementType11";
ALTER TABLE IF EXISTS "AssetConfig_TransactionType" DROP COLUMN IF EXISTS "CRPositionStatementType21";
ALTER TABLE IF EXISTS "AssetConfig_TransactionType" DROP COLUMN IF EXISTS "CRPositionStatementType22";

-- AssetConfig_mSCOA_TransactionType
ALTER TABLE IF EXISTS "AssetConfig_mSCOA_TransactionType" DROP COLUMN IF EXISTS "DebitItem21_2DisplayName";
ALTER TABLE IF EXISTS "AssetConfig_mSCOA_TransactionType" DROP COLUMN IF EXISTS "DebitItem12_1DisplayName";
ALTER TABLE IF EXISTS "AssetConfig_mSCOA_TransactionType" DROP COLUMN IF EXISTS "CreditItem12_1DisplayName";
ALTER TABLE IF EXISTS "AssetConfig_mSCOA_TransactionType" DROP COLUMN IF EXISTS "DebitItem22_1DisplayName";
ALTER TABLE IF EXISTS "AssetConfig_mSCOA_TransactionType" DROP COLUMN IF EXISTS "CreditItem13_1DisplayName";
ALTER TABLE IF EXISTS "AssetConfig_mSCOA_TransactionType" DROP COLUMN IF EXISTS "CreditItem23_1DisplayName";

-- Asset_Revaluations
ALTER TABLE IF EXISTS "Asset_Revaluations" DROP COLUMN IF EXISTS "SCOAItemDR";
ALTER TABLE IF EXISTS "Asset_Revaluations" DROP COLUMN IF EXISTS "SCOAItemCR";
ALTER TABLE IF EXISTS "Asset_Revaluations" DROP COLUMN IF EXISTS "FilePath";

-- Asset_AiInsights
ALTER TABLE IF EXISTS "Asset_AiInsights" DROP COLUMN IF EXISTS "title";
ALTER TABLE IF EXISTS "Asset_AiInsights" DROP COLUMN IF EXISTS "message";
ALTER TABLE IF EXISTS "Asset_AiInsights" DROP COLUMN IF EXISTS "recommendation";
ALTER TABLE IF EXISTS "Asset_AiInsights" DROP COLUMN IF EXISTS "confidence_score";
ALTER TABLE IF EXISTS "Asset_AiInsights" DROP COLUMN IF EXISTS "legislation_ref";

-- Asset_TrackingAlerts
ALTER TABLE IF EXISTS "Asset_TrackingAlerts" DROP COLUMN IF EXISTS "asset_id";
ALTER TABLE IF EXISTS "Asset_TrackingAlerts" DROP COLUMN IF EXISTS "zone_id";
ALTER TABLE IF EXISTS "Asset_TrackingAlerts" DROP COLUMN IF EXISTS "alert_type";
ALTER TABLE IF EXISTS "Asset_TrackingAlerts" DROP COLUMN IF EXISTS "message";

-- Asset_AuditTrail
ALTER TABLE IF EXISTS "Asset_AuditTrail" DROP COLUMN IF EXISTS "user_name";
ALTER TABLE IF EXISTS "Asset_AuditTrail" DROP COLUMN IF EXISTS "changes";
ALTER TABLE IF EXISTS "Asset_AuditTrail" DROP COLUMN IF EXISTS "ip_address";

-- Asset_TripRequests
ALTER TABLE IF EXISTS "Asset_TripRequests" DROP COLUMN IF EXISTS "requestor_name";
ALTER TABLE IF EXISTS "Asset_TripRequests" DROP COLUMN IF EXISTS "driver_name";

-- Asset_Insurance
ALTER TABLE IF EXISTS "Asset_Insurance" DROP COLUMN IF EXISTS "PolicyNumber";
ALTER TABLE IF EXISTS "Asset_Insurance" DROP COLUMN IF EXISTS "PolicyDescription";
ALTER TABLE IF EXISTS "Asset_Insurance" DROP COLUMN IF EXISTS "AssuredDate";
ALTER TABLE IF EXISTS "Asset_Insurance" DROP COLUMN IF EXISTS "InsuredValue";
ALTER TABLE IF EXISTS "Asset_Insurance" DROP COLUMN IF EXISTS "Insurer";
ALTER TABLE IF EXISTS "Asset_Insurance" DROP COLUMN IF EXISTS "InsuranceCompany";
ALTER TABLE IF EXISTS "Asset_Insurance" DROP COLUMN IF EXISTS "TelNo";
ALTER TABLE IF EXISTS "Asset_Insurance" DROP COLUMN IF EXISTS "FaxNo";
ALTER TABLE IF EXISTS "Asset_Insurance" DROP COLUMN IF EXISTS "InsuranceDocument";
ALTER TABLE IF EXISTS "Asset_Insurance" DROP COLUMN IF EXISTS "DocumentDescription";
ALTER TABLE IF EXISTS "Asset_Insurance" DROP COLUMN IF EXISTS "PremiumMonthly";
ALTER TABLE IF EXISTS "Asset_Insurance" DROP COLUMN IF EXISTS "InsuredPeriod";
ALTER TABLE IF EXISTS "Asset_Insurance" DROP COLUMN IF EXISTS "Notes";

-- Asset_BulkUploadJobs
ALTER TABLE IF EXISTS "Asset_BulkUploadJobs" DROP COLUMN IF EXISTS "ServiceID";

-- Asset_WorkflowInstances
ALTER TABLE IF EXISTS "Asset_WorkflowInstances" DROP COLUMN IF EXISTS "initiated_by_name";

-- Asset_WorkflowApprovals
ALTER TABLE IF EXISTS "Asset_WorkflowApprovals" DROP COLUMN IF EXISTS "approver_name";

-- Asset_Documents
ALTER TABLE IF EXISTS "Asset_Documents" DROP COLUMN IF EXISTS "uploaded_by_name";

-- Asset_FleetInspections
ALTER TABLE IF EXISTS "Asset_FleetInspections" DROP COLUMN IF EXISTS "inspector_name";

-- Asset_FleetBookingSchedule
ALTER TABLE IF EXISTS "Asset_FleetBookingSchedule" DROP COLUMN IF EXISTS "booked_by_name";

-- Asset_ImportBatches
ALTER TABLE IF EXISTS "Asset_ImportBatches" DROP COLUMN IF EXISTS "imported_by_name";

-- Asset_UploadType
ALTER TABLE IF EXISTS "Asset_UploadType" DROP COLUMN IF EXISTS "Type";

-- End of Task #64 migration

-- Asset_FundingSource: restructure from lookup table to asset-register link table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='Asset_FundingSource' AND column_name='FundingSourceDesc') THEN
        -- Old structure detected — truncate stale lookup data and restructure
        TRUNCATE TABLE "Asset_FundingSource";
        -- Drop old lookup columns
        ALTER TABLE "Asset_FundingSource" DROP COLUMN IF EXISTS "FundingSourceDesc";
        ALTER TABLE "Asset_FundingSource" DROP COLUMN IF EXISTS "FundingSourceCode";
        ALTER TABLE "Asset_FundingSource" DROP COLUMN IF EXISTS "Enabled";
        -- Drop old PK on FundingSource_ID so we can repurpose it as a FK column
        ALTER TABLE "Asset_FundingSource" DROP CONSTRAINT IF EXISTS "Asset_FundingSource_pkey";
        -- Change FundingSource_ID from SERIAL PK to plain integer
        ALTER TABLE "Asset_FundingSource" ALTER COLUMN "FundingSource_ID" DROP DEFAULT;
        DROP SEQUENCE IF EXISTS "Asset_FundingSource_FundingSource_ID_seq";
        -- Add new PK column
        ALTER TABLE "Asset_FundingSource" ADD COLUMN IF NOT EXISTS "AssetFundingSource_ID" SERIAL;
        ALTER TABLE "Asset_FundingSource" ADD CONSTRAINT "Asset_FundingSource_pkey" PRIMARY KEY ("AssetFundingSource_ID");
        -- Add new link columns
        ALTER TABLE "Asset_FundingSource" ADD COLUMN IF NOT EXISTS "AssetRegisterItem_ID" INTEGER;
        ALTER TABLE "Asset_FundingSource" ADD COLUMN IF NOT EXISTS "Amount" NUMERIC(18,2);
    END IF;
    -- Ensure new columns exist even if table was already partially migrated
    ALTER TABLE "Asset_FundingSource" ADD COLUMN IF NOT EXISTS "AssetRegisterItem_ID" INTEGER;
    ALTER TABLE "Asset_FundingSource" ADD COLUMN IF NOT EXISTS "Amount" NUMERIC(18,2);
    ALTER TABLE "Asset_FundingSource" ADD COLUMN IF NOT EXISTS "FinYear" VARCHAR(9);
END $$;

-- ===== ATS rebuild performance optimization =====
-- Drop legacy index names
DROP INDEX IF EXISTS idx_ats_item_year_cover;

-- Covering index on ATS: key columns (AssetRegisterItemID, FinancialYear, FinancialPeriod) +
-- INCLUDE all closing-balance / rolling-state columns needed by ob0 reads and report queries.
-- With NpgsqlBinaryImporter COPY the index is updated once per batch (not per-row),
-- making the covering INCLUDE columns essentially free in terms of write overhead.
DROP INDEX IF EXISTS idx_ats_item_id_cover;
CREATE INDEX IF NOT EXISTS idx_ats_item_id_cover ON "Asset_Transaction_Summary"
    ("AssetRegisterItemID", "FinancialYear", "FinancialPeriod")
    INCLUDE (
        "CurrentValue", "RemainingUsefulLife",
        "AccumulatedDepreciationClosingBalance",
        "AccumulatedImpairmentClosingBalance",
        "AccumulatedFairValueClosingBalance",
        "AccumulatedRevaluationClosingBalance",
        "AccumulatedImpairmentReversalClosingBalance",
        "DisposalClosingBalance", "AdditionClosingBalance",
        "WorkInProgressClosingBalance", "AmortisationClosingBalance",
        "CorrectOfErrorClosingBalance", "AdditionalCostClosingBalance",
        "MovementInRevaluationReserve", "DepreciationOffsetClosingBalance",
        "ImpairmentSurplus", "RevaluationReserveImpairmentClosingBalance",
        "CostClosingBalance"
    );

-- Add composite index on the secondary ID column used in DELETE + OR fallbacks
CREATE INDEX IF NOT EXISTS idx_ats_alt_item_id ON "Asset_Transaction_Summary"
    ("AssetRegisterItem_ID", "FinancialYear", "FinancialPeriod");

-- Add composite index on ART to cover the (asset, year, period) JOIN in the INSERT loop
CREATE INDEX IF NOT EXISTS idx_art_asset_year_period ON "Asset_Register_Transactions"
    ("AssetRegisterItem_ID", "FinancialYear", "FinancialPeriod");

-- Migrate Asset_Found from SMALLINT to VARCHAR(50) with new allowed values
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Asset_VerificationRegisterItem'
          AND column_name = 'Asset_Found'
          AND data_type IN ('smallint','integer','bigint')
    ) THEN
        ALTER TABLE "Asset_VerificationRegisterItem"
            ALTER COLUMN "Asset_Found" TYPE VARCHAR(50)
            USING CASE
                WHEN "Asset_Found" = 0 THEN 'Asset Not Found'
                ELSE NULL
            END;
    END IF;
END $$;
-- Task #98: Add TypeDesc column to Asset_UploadType for upload type labels
ALTER TABLE "Asset_UploadType" ADD COLUMN IF NOT EXISTS "TypeDesc" VARCHAR(100);
UPDATE "Asset_UploadType" SET "TypeDesc" = CASE "ID"
  WHEN 1 THEN 'Normal'
  WHEN 2 THEN 'WIP'
  WHEN 3 THEN 'Donated'
  WHEN 4 THEN 'Initial/Take-On'
  WHEN 5 THEN 'Unbundling'
  ELSE "ID"::VARCHAR
END WHERE "TypeDesc" IS NULL;

-- Task #98: Add DebitPlanProjectItemID to Asset_BulkValidation for WIP upload validation errors
ALTER TABLE "Asset_BulkValidation" ADD COLUMN IF NOT EXISTS "DebitPlanProjectItemID" VARCHAR(100);

-- Task #103: Add DepartmentID and DivisionID to AssetConfig_mSCOA for dept/division-specific GL mapping
ALTER TABLE "AssetConfig_mSCOA" ADD COLUMN IF NOT EXISTS "DepartmentID" INTEGER;
ALTER TABLE "AssetConfig_mSCOA" ADD COLUMN IF NOT EXISTS "DivisionID" INTEGER;

-- Task #103: Add DepartmentID and DivisionID to Asset_DepreciationSchedule_Item for grouped schedule rows
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "DepartmentID" INTEGER;
ALTER TABLE "Asset_DepreciationSchedule_Item" ADD COLUMN IF NOT EXISTS "DivisionID" INTEGER;

-- Task #120 / #124: GL Outbox tables — aligned to SQL Server supplied structure
CREATE TABLE IF NOT EXISTS "GL_Outbox" (
    "OutboxId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "SubmoduleId" INTEGER NOT NULL DEFAULT 8,
    "EventType" VARCHAR(100) NOT NULL,
    "DocumentNumber" VARCHAR(100) NOT NULL DEFAULT '',
    "IsCashflow" BOOLEAN NOT NULL DEFAULT FALSE,
    "Status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "RetryCount" INTEGER NOT NULL DEFAULT 0,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "LastError" VARCHAR(500),
    "DispatchedAt" TIMESTAMPTZ,
    "GLBatchId" UUID,
    "AcknowledgedAt" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "GL_Outbox_Lines" (
    "LineId" BIGSERIAL PRIMARY KEY,
    "OutboxId" UUID NOT NULL REFERENCES "GL_Outbox"("OutboxId"),
    "ProcessingMonth" INTEGER NOT NULL,
    "FinYear" VARCHAR(10) NOT NULL,
    "TransactionDetails" VARCHAR(500),
    "SourceModuleId" INTEGER NOT NULL DEFAULT 8,
    "Debit" NUMERIC(18,2) NOT NULL DEFAULT 0,
    "Credit" NUMERIC(18,2) NOT NULL DEFAULT 0,
    "CapturerId" INTEGER NOT NULL DEFAULT 1,
    "PlanProjectItemID" INTEGER NOT NULL DEFAULT 0,
    "VATRate" NUMERIC(5,2),
    "VATRateID" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "AssetConfig_EventType" (
    "EventType_ID" SERIAL PRIMARY KEY,
    "SourceDocType" INTEGER NOT NULL,
    "EventType" VARCHAR(50) NOT NULL,
    "Description" VARCHAR(200),
    CONSTRAINT "uq_assetconfig_eventtype_sourcedoctype" UNIQUE ("SourceDocType")
);

INSERT INTO "AssetConfig_EventType" ("SourceDocType", "EventType", "Description")
VALUES
    (23, 'ASSET_DEPRECIATION',  'Asset Depreciation'),
    (24, 'ASSET_FINANCE',       'Asset Finance'),
    (999,'ASSET_CAPITALISATION','Asset Capitalisation'),
    (26, 'ASSET_IMPAIRMENT',    'Asset Impairment'),
    (27, 'ASSET_REVALUATION',   'Asset Revaluation'),
    (28, 'ASSET_TRANSFER',      'Asset Transfer'),
    (29, 'ASSET_DISPOSAL',      'Asset Disposal')
ON CONFLICT ("SourceDocType") DO NOTHING;

CREATE TABLE IF NOT EXISTS "Sys_TableBackend" (
    table_key   VARCHAR(100) PRIMARY KEY,
    backend     VARCHAR(20)  NOT NULL DEFAULT 'postgresql',
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
INSERT INTO "Sys_TableBackend" (table_key, backend) VALUES
    ('gl-outbox', 'sqlserver'),
    ('gl-outbox-lines', 'sqlserver')
ON CONFLICT (table_key) DO NOTHING;
