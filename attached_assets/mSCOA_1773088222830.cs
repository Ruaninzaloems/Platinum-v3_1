using Sebata.Business.Assets.Data;
using System;
using System.Collections.Generic;
using System.Data;
using System.Text;

namespace Sebata.Business.Assets.Configuration
{
    public class mSCOA
    {
        private DataBase _db;

        public DataObject _do { get; set; }

        /// <summary>
        /// Instantiate the data object for the mSCOA table
        /// </summary>
        private void CreateDataObject()
        {

            _do = new DataObject("AssetConfig_mSCOA", "AssetConfig_mSCOA_ID");

            //_do.Fields = new List<FieldItem>();
            _do.Fields.Add(new FieldItem("FinYear", true));
            _do.Fields.Add(new FieldItem("TypeID", true));
            _do.Fields.Add(new FieldItem("CategoryID", true));
            _do.Fields.Add(new FieldItem("SubCategoryID", true));
            _do.Fields.Add(new FieldItem("MeasurementTypeID", true));
            _do.Fields.Add(new FieldItem("StatusID", true));


            //change names of commpn fields
            _do.CommonFields.Find(a => a.Name == "CreatedByID_Field").Value = "CreatedByID";
            _do.CommonFields.Find(a => a.Name == "DateCreated_Field").Value = "CreatedDate";
            _do.CommonFields.Find(a => a.Name == "ModifiedByID_Field").Value = "ModifiedByID";
            _do.CommonFields.Find(a => a.Name == "DateModified_Field").Value = "ModiefiedDate";

            DataObject typeObject = new DataObject("Const_AssetType_Sys", "AssetType_ID");
            typeObject.Fields.Add(new FieldItem("AssetTypeDesc"));
            _do.ParentTables.Add(new KeyValuePair<DataObject, FieldItem>(typeObject, new FieldItem("TypeID")));

            typeObject = new DataObject("Const_AssetCategory_sys", "AssetCategoryID");
            typeObject.Fields.Add(new FieldItem("AssetCategoryDesc"));
            _do.ParentTables.Add(new KeyValuePair<DataObject, FieldItem>(typeObject, new FieldItem("CategoryID")));

            typeObject = new DataObject("Const_Asset_SubCategory", "Asset_SubCategory_ID");
            typeObject.Fields.Add(new FieldItem("Asset_SubCategoryDescription"));
            _do.ParentTables.Add(new KeyValuePair<DataObject, FieldItem>(typeObject, new FieldItem("SubCategoryID")));

            typeObject = new DataObject("AssetConfig_MeasurementType", "AssetConfig_MeasurementType_ID");
            typeObject.Fields.Add(new FieldItem("Name"));
            _do.ParentTables.Add(new KeyValuePair<DataObject, FieldItem>(typeObject, new FieldItem("MeasurementTypeID")));

            typeObject = new DataObject("Const_AssetStatus_Sys", "AssetStatus_ID");
            typeObject.Fields.Add(new FieldItem("AssetStatusDesc"));
            _do.ParentTables.Add(new KeyValuePair<DataObject, FieldItem>(typeObject, new FieldItem("StatusID")));

            //typeObject = new DataObject("AssetConfig_TransactionType", "AssetConfig_TransactionType_ID");
            //typeObject.Fields.Add(new FieldItem("Name"));
            //_do.ParentTables.Add(new KeyValuePair<DataObject, FieldItem>(typeObject, new FieldItem("TransactionTypeID")));

            //change names of common fields
            _do.CommonFields.Find(a => a.Name == "Default_Field").Value = "";
        }

        /// <summary>
        /// Rettrieves the database error if any
        /// Check the return value of any method for 0 value
        /// </summary>
        public Exception Error { get { return _db.Error; } }

        /// <summary>
        /// Instantiate this class
        /// </summary>
        /// <param name="connectionstring"></param>
        /// <param name="userid"></param>
        public mSCOA(string connectionstring, int userid)
        {
            CreateDataObject();
            _db = new DataBase(connectionstring, userid);
        }

        /// <summary>
        /// Dispose this class
        /// </summary>
        ~mSCOA()
        {
            _db = null;
        }

        /// <summary>
        /// Retrieve a datatable containing a list ofSub Categories from Const_AssetmSCOA_sys
        /// </summary>
        /// <param name="mSCOAID">leave null to retrieve allSub Categories</param>
        /// <returns>databtable</returns>
        public DataTable Get(int? mSCOAID = null, string finYear = null, int? TypeID = null, int? CategoryID = null, int? SubCategoryID = null)
        {
            DataTable retval = null;
            _do.PrimaryKey.Value = mSCOAID.ToString();
            _db.ClearFields(_do);

            if (finYear != null)
                _do.Fields.Find(a => a.Name == "FinYear").Value = finYear;
            else
                _do.Fields.Find(a => a.Name == "FinYear").Value = null;

            if (TypeID != null)
                _do.Fields.Find(a => a.Name == "TypeID").Value = TypeID.ToString();
            else
                _do.Fields.Find(a => a.Name == "TypeID").Value = null;

            if (CategoryID != null)
                _do.Fields.Find(a => a.Name == "CategoryID").Value = CategoryID.ToString();
            else
                _do.Fields.Find(a => a.Name == "CategoryID").Value = null;

            if (SubCategoryID != null)
                _do.Fields.Find(a => a.Name == "SubCategoryID").Value = SubCategoryID.ToString();
            else
                _do.Fields.Find(a => a.Name == "SubCategoryID").Value = null;

            retval = _db.Retrieve(_do);

            return retval;
        }

        public DataObject CreateTransactionType(int? TransactionTypeID = null , int? AssetConfig_mSCOA_ID = null
            , int? Project11 = null, int? DebitItem11_1 = null, int? DebitItem11_2 = null, int? CreditItem11_1 = null
            , int? Project21 = null, int? DebitItem21_1 = null, int? DebitItem21_2 = null, int? CreditItem21_1 = null
            , int? Project12 = null, int? DebitItem12_1 = null, int? CreditItem12_1 = null, int? Project22 = null, int? DebitItem22_1 = null
            , int? Project13 = null, int? DebitItem13_1 = null, int? Project23 = null, int? CreditItem23_1 = null, int? Project14 = null, int? Project24 = null, int? Project15 = null, int? Project25 = null)
        {

            Sebata.Business.Assets.Data.DataObject dobj = new Sebata.Business.Assets.Data.DataObject("AssetConfig_mSCOA_TransactionType", "AssetConfig_mSCOA_TransactionType_ID");
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("AssetConfig_mSCOA_ID", true));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("TransactionTypeID", true));

            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("Project11", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("DebitItem11_1", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("DebitItem11_1DisplayName", false));

            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("Project15", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("DebitItem11_2", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("DebitItem11_2DisplayName", false));

            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("Project14", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("CreditItem11_1", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("CreditItem11_1DisplayName", false));

            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("Project21", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("DebitItem21_1", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("DebitItem21_1DisplayName", false));

            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("Project25", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("DebitItem21_2", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("DebitItem21_2DisplayName", false));

            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("Project24", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("CreditItem21_1", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("CreditItem21_1DisplayName", false));

            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("Project12", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("DebitItem12_1", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("DebitItem12_1DisplayName", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("CreditItem12_1", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("CreditItem12_1DisplayName", false));

            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("Project22", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("DebitItem22_1", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("DebitItem22_1DisplayName", false));

            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("Project13", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("CreditItem13_1", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("CreditItem13_1DisplayName", false));

            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("Project23", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("CreditItem23_1", false));
            dobj.Fields.Add(new Sebata.Business.Assets.Data.FieldItem("CreditItem23_1DisplayName", false));

            // change names of commpn fields
            dobj.CommonFields.Find(a => a.Name == "CreatedByID_Field").Value = "CreatedByID";
            dobj.CommonFields.Find(a => a.Name == "DateCreated_Field").Value = "CreatedDate";
            dobj.CommonFields.Find(a => a.Name == "ModifiedByID_Field").Value = "ModifiedByID";
            dobj.CommonFields.Find(a => a.Name == "DateModified_Field").Value = "ModiefiedDate";

            string DebitItem11_1DisplayName = GetProjectItemDesc(DebitItem11_1);
            string DebitItem11_2DisplayName = GetProjectItemDesc(DebitItem11_2);
            string CreditItem11_1DisplayName = GetProjectItemDesc(CreditItem11_1);

            string DebitItem21_1DisplayName = GetProjectItemDesc(DebitItem21_1);
            string DebitItem21_2DisplayName = GetProjectItemDesc(DebitItem21_2);
            string CreditItem21_1DisplayName = GetProjectItemDesc(CreditItem21_1);

            string DebitItem12_1DisplayName = GetProjectItemDesc(DebitItem12_1);
            string CreditItem12_1DisplayName = GetProjectItemDesc(CreditItem12_1);
            string DebitItem22_1DisplayName = GetProjectItemDesc(DebitItem22_1);
            string DebitItem13_1DisplayName = GetProjectItemDesc(DebitItem13_1);
            string CreditItem23_1DisplayName = GetProjectItemDesc(CreditItem23_1);

            // Set the Primay key
            try
            {
                string sql = $"select AssetConfig_mSCOA_TransactionType_ID FROM AssetConfig_mSCOA_TransactionType st";
                sql += $" WHERE st.[AssetConfig_mSCOA_ID] = {AssetConfig_mSCOA_ID} and [TransactionTypeID] = {TransactionTypeID}";

                DataTable rows = _db.QuickRetrieve(sql);

                if (rows != null)
                {
                    if (rows.Rows.Count > 0)
                    {
                        // Add the primary key
                        dobj.PrimaryKey.Value = rows.Rows[0].ItemArray[0].ToString();
                    }
                }
            }
            catch { }

            dobj.Fields.Find(a => a.Name == "AssetConfig_mSCOA_ID").Value = AssetConfig_mSCOA_ID == null ? null : AssetConfig_mSCOA_ID.ToString();

            dobj.Fields.Find(a => a.Name == "TransactionTypeID").Value = TransactionTypeID == null ? null : TransactionTypeID.ToString();

            dobj.Fields.Find(a => a.Name == "Project11").Value = Project11 == null ? null : Project11.ToString();
            dobj.Fields.Find(a => a.Name == "DebitItem11_1").Value = DebitItem11_1 == null ? null : DebitItem11_1.ToString();
            dobj.Fields.Find(a => a.Name == "DebitItem11_1DisplayName").Value = DebitItem11_1DisplayName;

            dobj.Fields.Find(a => a.Name == "Project15").Value = Project15 == null ? null : Project15.ToString();
            dobj.Fields.Find(a => a.Name == "DebitItem11_2").Value = DebitItem11_2 == null ? null : DebitItem11_2.ToString();
            dobj.Fields.Find(a => a.Name == "DebitItem11_2DisplayName").Value = DebitItem11_2DisplayName;

            dobj.Fields.Find(a => a.Name == "Project14").Value = Project14 == null ? null : Project14.ToString();
            dobj.Fields.Find(a => a.Name == "CreditItem11_1").Value = CreditItem11_1 == null ? null : CreditItem11_1.ToString();
            dobj.Fields.Find(a => a.Name == "CreditItem11_1DisplayName").Value = CreditItem11_1DisplayName;

            dobj.Fields.Find(a => a.Name == "Project21").Value = Project21 == null ? null : Project21.ToString();
            dobj.Fields.Find(a => a.Name == "DebitItem21_1").Value = DebitItem21_1 == null ? null : DebitItem21_1.ToString();
            dobj.Fields.Find(a => a.Name == "DebitItem21_1DisplayName").Value = DebitItem21_1DisplayName;

            dobj.Fields.Find(a => a.Name == "Project25").Value = Project25 == null ? null : Project25.ToString();
            dobj.Fields.Find(a => a.Name == "DebitItem21_2").Value = DebitItem21_2 == null ? null : DebitItem21_2.ToString();
            dobj.Fields.Find(a => a.Name == "DebitItem21_2DisplayName").Value = DebitItem21_2DisplayName;

            dobj.Fields.Find(a => a.Name == "Project24").Value = Project24 == null ? null : Project24.ToString();
            dobj.Fields.Find(a => a.Name == "CreditItem21_1").Value = CreditItem21_1 == null ? null : CreditItem21_1.ToString();
            dobj.Fields.Find(a => a.Name == "CreditItem21_1DisplayName").Value = CreditItem21_1DisplayName;

            dobj.Fields.Find(a => a.Name == "Project12").Value = Project12 == null ? null : Project12.ToString();
            dobj.Fields.Find(a => a.Name == "DebitItem12_1").Value = DebitItem12_1 == null ? null : DebitItem12_1.ToString();
            dobj.Fields.Find(a => a.Name == "DebitItem12_1DisplayName").Value = DebitItem12_1DisplayName;
            dobj.Fields.Find(a => a.Name == "CreditItem12_1").Value = CreditItem12_1 == null ? null : CreditItem12_1.ToString();
            dobj.Fields.Find(a => a.Name == "CreditItem12_1DisplayName").Value = CreditItem12_1DisplayName;

            dobj.Fields.Find(a => a.Name == "Project22").Value = Project22 == null ? null : Project22.ToString();
            dobj.Fields.Find(a => a.Name == "DebitItem22_1").Value = DebitItem22_1 == null ? null : DebitItem22_1.ToString();
            dobj.Fields.Find(a => a.Name == "DebitItem22_1DisplayName").Value = DebitItem22_1DisplayName;

            dobj.Fields.Find(a => a.Name == "Project13").Value = Project13 == null ? null : Project13.ToString();
            dobj.Fields.Find(a => a.Name == "CreditItem13_1").Value = DebitItem13_1 == null ? null : DebitItem13_1.ToString();
            dobj.Fields.Find(a => a.Name == "CreditItem13_1DisplayName").Value = DebitItem13_1DisplayName;

            dobj.Fields.Find(a => a.Name == "Project23").Value = Project23 == null ? null : Project23.ToString();
            dobj.Fields.Find(a => a.Name == "CreditItem23_1").Value = CreditItem23_1 == null ? null : CreditItem23_1.ToString();
            dobj.Fields.Find(a => a.Name == "CreditItem23_1DisplayName").Value = CreditItem23_1DisplayName;


            return dobj;
        }

        public DataTable GetTransactionTypes(int mSCOAid)
        {
            string sql = $"SELECT tt.Name as TransactionTypeName, st.* FROM AssetConfig_mSCOA_TransactionType st";
            sql += " INNER JOIN AssetConfig_TransactionType tt on tt.AssetConfig_TransactionType_ID = st.TransactionTypeID";
            sql += $" WHERE st.AssetConfig_mSCOA_ID = {mSCOAid}";
            DataTable rows = _db.QuickRetrieve(sql);

            return rows;
        }

        /// <summary>
        /// Save a new item, will check for duplicates and bring out of retirement duplicate.
        /// </summary>
        /// <param name="mSCOAName"></param>
        /// <returns></returns>
        public int Save(ref int? AssetConfig_mSCOA_ID , string FinYear = null, int? TypeID = null, int? CategoryID = null
            , int? SubCateogyID = null, int? MeasurementTypeID = null, int? StatusID = null, List<DataObject> TransactionTypes = null, bool retire = false, string fileName = null)
        {

            _db.ClearFields(_do);
            _do.PrimaryKey.Value = AssetConfig_mSCOA_ID.ToString();
            if (_do.CommonFields.Find(a => a.Name == "Default_Field").Value.ToString() == "")
                _do.CommonFields.Find(a => a.Name == "Default_Field").Value = "Default";

            _do.Fields.Find(a => a.Name == "FinYear").Value = FinYear;
            _do.Fields.Find(a => a.Name == "TypeID").Value = TypeID == null ? null : TypeID.ToString();
            _do.Fields.Find(a => a.Name == "CategoryID").Value = CategoryID == null ? null : CategoryID.ToString();
            _do.Fields.Find(a => a.Name == "SubCategoryID").Value = SubCateogyID == null ? null : SubCateogyID.ToString();
            _do.Fields.Find(a => a.Name == "MeasurementTypeID").Value = MeasurementTypeID == null ? null : MeasurementTypeID.ToString();
            _do.Fields.Find(a => a.Name == "StatusID").Value = StatusID == null ? null : StatusID.ToString();
            if (fileName != null)
                _do.Fields.Find(a => a.Name == "UpLoadFile").Value = fileName;


            int retval = 0;

            //use transaction
            retval = _db.Save(_do, retire, TransactionTypes, "AssetConfig_mSCOA_ID", "TransactionTypeID");

            if (AssetConfig_mSCOA_ID == null)
                AssetConfig_mSCOA_ID = Convert.ToInt32(_do.PrimaryKey.Value);

            return retval;
        }

        public int SaveNew(string FinYear = null, int? TypeID = null, int? CategoryID = null
            , int? SubCateogyID = null, int? MeasurementTypeID = null, int? StatusID = null, List<DataObject> TransactionTypes = null, bool retire = false, string fileName = null)
        {

            _db.ClearFields(_do);
            _do.PrimaryKey.Value = "";
            if (_do.CommonFields.Find(a => a.Name == "Default_Field").Value.ToString() == "")
                _do.CommonFields.Find(a => a.Name == "Default_Field").Value = "Default";

            _do.Fields.Find(a => a.Name == "FinYear").Value = FinYear;
            _do.Fields.Find(a => a.Name == "TypeID").Value = TypeID == null ? null : TypeID.ToString();
            _do.Fields.Find(a => a.Name == "CategoryID").Value = CategoryID == null ? null : CategoryID.ToString();
            _do.Fields.Find(a => a.Name == "SubCategoryID").Value = SubCateogyID == null ? null : SubCateogyID.ToString();
            _do.Fields.Find(a => a.Name == "MeasurementTypeID").Value = MeasurementTypeID == null ? null : MeasurementTypeID.ToString();
            _do.Fields.Find(a => a.Name == "StatusID").Value = StatusID == null ? null : StatusID.ToString();
            if (fileName != null)
                _do.Fields.Find(a => a.Name == "UpLoadFile").Value = fileName;


            int retval = 0;

            //use transaction
            retval = _db.Save(_do, retire, TransactionTypes, "AssetConfig_mSCOA_ID", "TransactionTypeID", true);

            if (retval == 1)
                retval = Convert.ToInt32(_do.PrimaryKey.Value);

            return retval;
        }

        public DataTable GetProjects(string Finyear, string ProjectType, string PositionStatementType)
        {
            // string sql = $"Led_GetProjectsForCashbook_sp '{ProjectType}', '{Finyear}', true, '{PositionStatementType}'";
            //string sql = $"Asset_GetProjectsForSCOA_sp '{ProjectType}', '{Finyear}', true, '{PositionStatementType}'";
            string sql = $"Plan_GetAllProjectsWithScoaProject_sp '{Finyear}'";
            DataTable retTable = _db.QuickRetrieve(sql);
            return retTable;
        }

        public DataTable GetProjects_Import(string Finyear, string ProjectType, string PositionStatementType)
        {
            // string sql = $"Led_GetProjectsForCashbook_sp '{ProjectType}', '{Finyear}', true, '{PositionStatementType}'";
            string sql = $"Asset_GetProjectsForSCOA_sp_Import '{ProjectType}', '{Finyear}', true, '{PositionStatementType}'";
            DataTable retTable = _db.QuickRetrieve(sql);
            return retTable;
        }
        public DataTable GetProjectItems(int ProjectID)
        {
            string sql = $"Asset_GetProjectDetailsListForRequisition_sp {ProjectID}, 0";
            DataTable retTable = _db.QuickRetrieve(sql);
            return retTable;

        }

        public DataTable GetmSCOADetailForExport(string finYear, int? typeID, int? categoryID, int? subCategoryID)
        {
            if (typeID == null)
            { typeID = 0; }
            if (categoryID == null)
            { categoryID = 0; }
            if (subCategoryID == null)
            { subCategoryID = 0; }
            //string sql = $"Asset_GetmSCOADetailForExport_sp";
            string sql = $"Asset_GetmSCOADetailForExport_sp {finYear}, {typeID}, {categoryID}, {subCategoryID}";
            DataTable st = _db.QuickRetrieve(sql);
            return st;

        }

        private string GetProjectItemDesc(int? projectItemID)
        {
            string retval = null;
            if (projectItemID != null || projectItemID == 0)
            {
                string sql = "SELECT ISnull(ItemDescription,ITEM.ScoaShortDesc) AS ItemDescription" +
                             " FROM Plan_ProjectItem PPI            " +
                             " INNER JOIN Plan_Project PP ON PPI.ProjectID = PP.Project_ID                " +
                             " LEFT JOIN Const_ProjectItem CP ON PPI.ProjectItemID = CP.ProjectItem_ID    " +
                             " INNER JOIN dbo.Const_SCOA_Structure AS ITEM ON PPI.SCOAItemID = ITEM.ScoaID" +
                             $" where PPI.PlanProjectItem_ID = {projectItemID}";

                DataTable retTable = _db.QuickRetrieve(sql);
                if (retTable != null && retTable.Rows.Count > 0)
                {
                    retval = retTable.Rows[0]["ItemDescription"].ToString();
                }

                retTable.Dispose();
            }
            return retval;
        }

        public DataTable GetProjectItemByScoaCode(int ProjectID , string FinYear , string ScoaCode)
        {
            string sql = "[SCM_GetProjectDetailsListForRequisition_sp_ByScoaCode] " + ProjectID + " , '" + FinYear + "', '" + ScoaCode + "'" ;
            DataTable dt = _db.QuickRetrieve(sql);
            return dt;
        }


        public DataTable ComboProjectItems(int ProjectID ,int ProjectItemId)
        {
            string sql = "[SCM_GetProjectItems_ByProject] " + ProjectID + "," + ProjectItemId ;
            DataTable dt = _db.QuickRetrieve(sql);
            return dt;
        }


        public DataTable GetAllProjectItems(string FinYear)
        {
            string sql = $"Assets_GetProjectDetailsList_sp NULL , NULL, '{FinYear}'";
                DataTable dt = _db.QuickRetrieve(sql);
            return dt;
        }

        public int GetProjectItemIDfromDescription(string ProjectItemDescription)
        {
            int retval = 0;
            string sql = "SELECT PPI.PlanProjectItem_ID " +
                         " FROM Plan_ProjectItem PPI            " +
                         " INNER JOIN Plan_Project PP ON PPI.ProjectID = PP.Project_ID                " +
                         " LEFT JOIN Const_ProjectItem CP ON PPI.ProjectItemID = CP.ProjectItem_ID    " +
                         " INNER JOIN dbo.Const_SCOA_Structure AS ITEM ON PPI.SCOAItemID = ITEM.ScoaID" +
                         $" where ISnull(ItemDescription,ITEM.ScoaShortDesc)  = '{ProjectItemDescription}'";

            DataTable retTable = _db.QuickRetrieve(sql);

            if (retTable != null && retTable.Rows.Count > 0)
            {
                retval = Convert.ToInt32(retTable.Rows[0]["PlanProjectItem_ID"]);
            }

            retTable.Dispose();

            return retval;
        }
        public DataRow GetSCOAdescriptions(string finyear, int ProjectID, int ProjectItemID, out int Err)
        {
            try
            {
                DataRow dr = null;

                string sql = "";

                sql = "SELECT ppi.PlanProjectItem_ID, ppi.ProjectID,ppi.ProjectItemID,ppi.FinYear,ppi.SCOAItemID";
                sql += $" ,  ISNULL(ppi.ProjectFundYearID, 0) AS ProjectFundYearID, ";
                sql += $"   ppi.SCOAFundId as SCOAFundID, ppi.SCOAFunctionId,ppi.SCOARegionId, ppi.SCOACostingID, ppi.DivisionId, ppi.BudgetSplitID";
                sql += $" , s.ScoaShortDesc + ' ' + s.ScoaCode AS ScoaItem";
                sql += $"   , s.ScoaCode AS ScoaItemCode,";
                sql += $" sps.ScoaDesc AS ScoaProject,";
                sql += $" sfs.ScoaShortDesc AS SCOAFundShort,sfs.ScoaDesc AS SCOAFund, sfus.ScoaDesc AS SCOAFunction ,srs.ScoaDesc AS SCOARegion, scs.ScoaDesc AS SCOACosting,";
                sql += $" (cdep.DepartmentCode + '/' + cd.DivisionCode + ' ' + cdep.DepartmentDesc + ' / ' + cd.DivisionDesc) AS MunicipalClassification";
                sql += $" FROM Plan_ProjectItem ppi";
                sql += $" INNER JOIN Plan_Project pp ON ppi.ProjectID = pp.Project_ID";
                sql += $" INNER JOIN Const_SCOA_Structure_ByYear('{finyear}') s ON ppi.SCOAItemID = s.ScoaID";

                sql += $" LEFT JOIN Const_ProjectItem i ON ppi.ProjectItemID = i.ProjectItem_ID";
                sql += $" LEFT JOIN dbo.Const_SCOA_Funds_Structure_ByYear('{finyear}') sfs ON ppi.SCOAFundId = sfs.ScoaID";
                sql += $" LEFT JOIN dbo.Const_SCOA_Function_Structure_ByYear('{finyear}')  sfus ON ppi.SCOAFunctionID = sfus.ScoaID";
                sql += $" LEFT JOIN dbo.Const_SCOA_Regional_Structure_ByYear('{finyear}') srs ON ppi.SCOARegionID = srs.ScoaID";
                sql += $" LEFT JOIN dbo.Const_SCOA_Costing_Structure_ByYear('{finyear}') scs ON ppi.SCOACostingID = scs.ScoaID";
                sql += $" LEFT JOIN dbo.Const_SCOA_Project_Structure_ByYear('{finyear}') sps ON pp.SCOAProjectID = sps.ScoaID";
                sql += $" LEFT JOIN dbo.Const_Division cd ON cd.Division_ID = ppi.DivisionId";
                sql += $" LEFT JOIN dbo.Const_Department cdep ON cdep.Department_ID = cd.DepartmentID";
                sql += $" WHERE ppi.ProjectID = {ProjectID} ";
                sql += $" AND(ppi.FinYear = '{finyear}')";
                sql += $" AND(ppi.PlanProjectItem_ID = {ProjectItemID} )";

                dr = _db.QuickRetrieveRow(sql);                
                Err = 0;
                return dr;
            }
            catch (Exception Ex) 
            {
                Err = -1;
                return null;
            }

        }

        public DataTable GetUploadReport(string fileName, DateTime today)
        {
            string sql = "SELECT [Record] 'Record No' ,[Result] ,[Error] 'Error Description'";
            sql += " FROM Asset_mSCOA_UploadResult ";
            sql += $" WHERE [fileName] = '{fileName}' AND [upLoadDate] = CAST('{today.ToString("dd-MMM-yyyy hh:mm:ss.fff")}' AS DATETIME)";
            DataTable dt = _db.QuickRetrieve(sql);
            return dt;

        }

        public (int Depreciation, int Impairment, int ImpairmentReversal, int FairValue, int Revaluation, int Disposal, int AssetUnbundling) GetTransactionTypeIds()
        {
            string sql = "SELECT AssetConfig_TransactionType_ID, [Name] from AssetConfig_TransactionType where [Default] = 1";
            DataTable dt = _db.QuickRetrieve(sql);

            int depreciation = 0;
            int impairment = 0;
            int impairmentReversal = 0;
            int fairValue = 0;
            int revaluation = 0;
            int disposal = 0;
            int assetUnbundling = 0;

            foreach (DataRow row in dt.Rows)
            {
                switch(row[1].ToString())
                {
                    case "Depreciation":
                        depreciation = Convert.ToInt32(row[0]);
                        break;
                    case "Impairment":
                        impairment = Convert.ToInt32(row[0]);
                        break;
                    case "Impairment Reversal":
                        impairmentReversal = Convert.ToInt32(row[0]);
                        break;
                    case "Fair Value":
                        fairValue = Convert.ToInt32(row[0]);
                        break;
                    case "Revaluation":
                        revaluation = Convert.ToInt32(row[0]);
                        break;
                    case "Disposal":
                        disposal = Convert.ToInt32(row[0]);
                        break;
                    case "Asset Unbundling":
                        assetUnbundling = Convert.ToInt32(row[0]);
                        break;
                }
            }

            return (depreciation, impairment, impairmentReversal, fairValue, revaluation, disposal, assetUnbundling);
        }
    }
}
