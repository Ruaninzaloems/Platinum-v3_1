using FMSWebApp.Common;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using Telerik.Web.UI;
//using Sebata.Business.Assets.Data;
namespace FMSWebApp.Assets.Configuration
{
    public partial class mscoa : System.Web.UI.Page
    {

        //page description variables
        string moduleName = "Assets - Configuration";
        string pageName = "mscoa.aspx";
        bool isexport = false;

        //Permissions
        public const int Perm_Page = 40807;


        //private Sebata.Business.Assets.Configuration.Type _configType;
        //private Sebata.Business.Assets.Configuration.Category _configCategory;
        //private Sebata.Business.Assets.Configuration.SubCategory _configSubCategory;
        //private Sebata.Business.Assets.Configuration.MeasurementType _configMeasurementType;
        //private Sebata.Business.Assets.Configuration.Status _configStatus;
        private Sebata.Business.Assets.Configuration.mSCOA _configmSCOA;
        private Sebata.Business.Assets.Configuration.mSCOaSegments _configmSCOASegments;

        protected void Page_Load(object sender, EventArgs e)
        {

            try
            {
                if (!IsPostBack)
                {
                    Common.CommonTasks.CheckPagePermission(Perm_Page, Page.ResolveUrl("~/noRights.aspx"));
                }

            }
            catch (Exception Ex)
            {
                Common.CommonTasks.ErrorMsgSettings(Ex, System.Reflection.MethodBase.GetCurrentMethod().Name.ToString(), moduleName, pageName, mySession.Current.User_ID, divMessage, lblMessage);
            }


            if (_configmSCOA == null)
                _configmSCOA = new Sebata.Business.Assets.Configuration.mSCOA(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);

            if (_configmSCOASegments == null)
                _configmSCOASegments = new Sebata.Business.Assets.Configuration.mSCOaSegments(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID, mySession.Current.UserFinYear);

            if (!IsPostBack)
            {
                //Page.ClientScript.RegisterStartupScript(this.GetType(), "AssetClass", "<script Class='text/javascript'>hideitems();</script>");
                divChoice.Visible = false;
                divGrid.Visible = false;

                LoadLists();

                LoadTransactionTypes();
            }
        }

        private void LoadLists(int? typeID = null, int? categoryId = null)
        {

            //Financial year
            if (lstFinYear.Items.Count == 0)
            {
                Sebata.Business.Assets.Configuration.Misc misc;
                misc = new Sebata.Business.Assets.Configuration.Misc(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);
                List<string> finyears = misc.GetFinYearList();
                misc = null;
                lstFinYear.DataSource = finyears;
                lstFinYear.DataBind();
                lstFinYear.Items.Insert(0, new ListItem("--Select--", "-1"));
            }

            if (typeID == null)
            {
                int? inull = null;
                //Load Asset Type list
                Sebata.Business.Assets.Configuration.Type configType = new Sebata.Business.Assets.Configuration.Type(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);

                lstSearchType.Items.Clear();
                lstSearchType.DataSource = configType.Get(inull); // lstEditAssetType.DataSource;
                lstSearchType.DataValueField = "AssetType_ID";
                lstSearchType.DataTextField = "AssetTypeDesc";
                lstSearchType.DataBind();
                lstSearchType.Items.Insert(0, new ListItem("", "0"));
                lstSearchType.Items.Insert(0, new ListItem("All", "-1"));
                lstSearchType.SelectedIndex = 0;

                configType = null;

                lstEditAssetType.Items.Clear();

                lstEditAssetType.DataSource = lstSearchType.DataSource;
                lstEditAssetType.DataValueField = "AssetType_ID";
                lstEditAssetType.DataTextField = "AssetTypeDesc";
                lstEditAssetType.DataBind();
                lstEditAssetType.Items.Insert(0, new ListItem("", "0"));
                lstEditAssetType.Items.Insert(0, new ListItem("--Select--", "-1"));
                lstEditAssetType.SelectedIndex = 0;

                //lstType.Items.Insert(0, new ListItem("", "0"));
            }

            //Load Category
            if (categoryId == null)
            {
                Sebata.Business.Assets.Configuration.Category configCategory = new Sebata.Business.Assets.Configuration.Category(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);
                lstEditCategory.Items.Clear();

                lstEditCategory.DataSource = configCategory.Get(null, typeID);
                lstEditCategory.DataValueField = "AssetCategoryID";
                lstEditCategory.DataTextField = "AssetCategoryDesc";
                lstEditCategory.DataBind();
                lstEditCategory.Enabled = false;
                if (lstEditCategory.Items.Count == 0)
                {
                    //lstEditCategory.Enabled = false;
                }
                else
                {
                    //lstEditCategory.Enabled = true;
                    lstEditCategory.Items.Insert(0, new ListItem("", "0"));
                }
                configCategory = null;

                lstSearchCategory.Items.Clear();
                lstSearchCategory.DataSource = lstEditCategory.DataSource;
                lstSearchCategory.DataValueField = "AssetCategoryID";
                lstSearchCategory.DataTextField = "AssetCategoryDesc";
                lstSearchCategory.DataBind();

                if (lstSearchCategory.Items.Count == 0)
                    lstSearchCategory.Enabled = false;
                else
                {
                    lstSearchCategory.Enabled = true;
                    lstSearchCategory.Items.Insert(0, new ListItem("", "0"));
                    lstSearchCategory.Items.Insert(0, new ListItem("All", "-1"));
                    lstSearchCategory.SelectedIndex = 0;
                }
            }

            //Load SubCategory
            if (lstSearchSubCategory.Items.Count == 0)
            {
                Sebata.Business.Assets.Configuration.SubCategory configSubCategory = new Sebata.Business.Assets.Configuration.SubCategory(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);
                lstEditSubCategory.Items.Clear();

                lstEditSubCategory.DataSource = configSubCategory.Get(typeID, categoryId);
                lstEditSubCategory.DataValueField = "Asset_SubCategory_ID";
                lstEditSubCategory.DataTextField = "Asset_SubCategoryDescription";
                lstEditSubCategory.DataBind();
                lstEditSubCategory.Enabled = false;
                lstEditSubCategory.Items.Insert(0, new ListItem("", "0"));

                configSubCategory = null;

                lstSearchSubCategory.Items.Clear();
                lstSearchSubCategory.DataSource = lstEditSubCategory.DataSource;
                lstSearchSubCategory.DataValueField = "Asset_SubCategory_ID";
                lstSearchSubCategory.DataTextField = "Asset_SubCategoryDescription";
                lstSearchSubCategory.DataBind();
                if (lstSearchSubCategory.Items.Count == 0)
                    lstSearchSubCategory.Enabled = false;
                else
                {
                    lstSearchSubCategory.Enabled = true;
                    lstSearchSubCategory.Items.Insert(0, new ListItem("", "0"));
                    lstSearchSubCategory.Items.Insert(0, new ListItem("All", "-1"));
                    lstSearchSubCategory.SelectedIndex = 0;
                }
            }

            //Measurement Type
            if (lstEditMeasurementType.Items.Count == 0)
            {
                LoadEditMeasurementTypes();
            }

            //Status
            if (lstEditStatus.Items.Count == 0)
            {
                Sebata.Business.Assets.Configuration.Status configStatus = new Sebata.Business.Assets.Configuration.Status(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);
                int? inull = null;
                lstEditStatus.DataSource = configStatus.Get(inull, inull);
                lstEditStatus.DataTextField = "AssetStatusDesc";
                lstEditStatus.DataValueField = "AssetStatus_ID";
                lstEditStatus.DataBind();
                lstEditStatus.Items.Insert(0, new ListItem("--Select--", "-1"));
            }
        }

        private void LoadEditMeasurementTypes(int? TypeID = null)
        {
            int? inull = null;
            Sebata.Business.Assets.Configuration.MeasurementType configMeasuremenType = new Sebata.Business.Assets.Configuration.MeasurementType(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);

            lstEditMeasurementType.Items.Clear();
            System.Data.DataView dvMeas;
            if (TypeID == null)
                lstEditMeasurementType.DataSource = configMeasuremenType.Get(inull);
            else
                lstEditMeasurementType.DataSource = configMeasuremenType.GetFromType(TypeID);

            lstEditMeasurementType.DataTextField = "Name";
            lstEditMeasurementType.DataValueField = "AssetConfig_MeasurementType_ID";
            lstEditMeasurementType.DataBind();
            if (lstEditMeasurementType.Items.Count == 0)
            {
                lstEditMeasurementType.Enabled = false;
            }
            else
            {
                lstEditMeasurementType.Enabled = true;
                lstEditMeasurementType.Items.Insert(0, new ListItem("--Select--", "-1"));
            }
        }

        private void RefineSelection(int AssetTypeID)
        {

            //Class

            //Category

            //Sub Category

        }

        protected void btnPDFExport_Click(object sender, EventArgs e)
        {
            try
            {
                //isexport = true;
                //gridSCOA.ExportSettings.FileName = "Asset-mSCOA-Settings";
                //gridSCOA.ExportSettings.IgnorePaging = true;
                //gridSCOA.ExportSettings.ExportOnlyData = true;
                //gridSCOA.ExportSettings.OpenInNewWindow = true;
                //gridSCOA.MasterTableView.ExportToPdf();
                int? typeID = null;
                int? categoryID = null;
                int? subCategoryID = null;

                if (lstSearchType.SelectedValue != "-1" && lstSearchType.SelectedValue != "")
                    typeID = Convert.ToInt32(lstSearchType.SelectedValue);
                if (lstSearchCategory.Items.Count > 0 && lstSearchCategory.SelectedValue != "-1")
                    categoryID = Convert.ToInt32(lstSearchCategory.SelectedValue);
                if (lstSearchSubCategory.Items.Count > 0 && lstSearchSubCategory.SelectedValue != "-1")
                    subCategoryID = Convert.ToInt32(lstSearchSubCategory.SelectedValue);

                DataTable dt = _configmSCOA.Get(null, lstFinYear.Text, typeID, categoryID, subCategoryID);

                dt.Columns.Remove("TypeID");
                dt.Columns.Remove("CategoryID");
                dt.Columns.Remove("SubCategoryID");
                dt.Columns.Remove("StatusID");
                dt.Columns.Remove("MeasurementTypeID");

                dt.Columns.Remove("Enabled");



                dt.Columns["Const_AssetType_Sys_AssetTypeDesc"].Caption = "Asset Type";
                dt.Columns["Const_AssetCategory_sys_AssetCategoryDesc"].Caption = "Asset Category";
                dt.Columns["Const_Asset_SubCategory_Asset_SubCategoryDescription"].Caption = "Asset Sub Category";
                dt.Columns["Const_AssetStatus_Sys_AssetStatusDesc"].Caption = "Asset Status";
                dt.Columns["AssetConfig_MeasurementType_Name"].Caption = "Measurement Type";

                Export.ToPDF(Response, "Asset-mSCOA-Settings", dt, true, Sebata.Fms.Common.CommonTasks.GetEmsConnectionString());


            }
            catch (Exception Ex)
            {
                Common.CommonTasks.ErrorMsgSettings(Ex, System.Reflection.MethodBase.GetCurrentMethod().Name.ToString(), moduleName, pageName, mySession.Current.User_ID, divMessage, lblMessage);
            }

        }

        protected void btnCSVExport_Click(object sender, EventArgs e)
        {
            try
            {
                isexport = true;
                gridSCOA.ExportSettings.Excel.Format = (GridExcelExportFormat)Enum.Parse(typeof(GridExcelExportFormat), "Xlsx");
                gridSCOA.ExportSettings.FileName = "Asset-mSCOA-Settings";
                gridSCOA.ExportSettings.IgnorePaging = true;
                gridSCOA.ExportSettings.ExportOnlyData = true;
                gridSCOA.ExportSettings.OpenInNewWindow = true;
                gridSCOA.MasterTableView.ExportToExcel();

            }
            catch (Exception Ex)
            {
                Common.CommonTasks.ErrorMsgSettings(Ex, System.Reflection.MethodBase.GetCurrentMethod().Name.ToString(), moduleName, pageName, mySession.Current.User_ID, divMessage, lblMessage);
            }
        }

        protected void lstFinYear_SelectedIndexChanged(object sender, EventArgs e)
        {
            projectList = null;
            divChoice.Visible = !(lstFinYear.SelectedValue == "-1");
            divGrid.Visible = !(lstFinYear.SelectedValue == "-1");
            //reset select lists
            lstSearchType.SelectedIndex = 0;
            lblFinYear.Text = lstFinYear.SelectedItem.Text;


            btnAddNew.Enabled = true;
            btnUpload.Enabled = true;

            btnNext.Text = "Add";
            // btnSave.Enabled = true;
            btnSavePage.Enabled = true;
            gridSCOA.DataSource = null;
            gridSCOA.DataBind();

        }

        protected void btnSearch_Click(object sender, EventArgs e)
        {
            PopulateGrid(true);
        }

        private void PopulateGrid(bool bind = false)
        {
            int? typeID = null;
            int? categoryID = null;
            int? subCategoryID = null;

            if (lstSearchType.SelectedValue != "-1" && lstSearchType.SelectedValue != "")
                typeID = Convert.ToInt32(lstSearchType.SelectedValue);
            if (lstSearchCategory.Items.Count > 0 && lstSearchCategory.SelectedValue != "-1")
                categoryID = Convert.ToInt32(lstSearchCategory.SelectedValue);
            if (lstSearchSubCategory.Items.Count > 0 && lstSearchSubCategory.SelectedValue != "-1")
                subCategoryID = Convert.ToInt32(lstSearchSubCategory.SelectedValue);

            DataTable dt = _configmSCOA.Get(null, lstFinYear.Text, typeID, categoryID, subCategoryID);
            gridSCOA.DataSource = dt;

            if (bind)
                gridSCOA.DataBind();

            divGrid.Visible = true;
            divExport.Visible = true;
        }

        protected void gridSCOA_NeedDataSource(object sender, Telerik.Web.UI.GridNeedDataSourceEventArgs e)
        {

            PopulateGrid();
            //divExport.Visible = false;
        }

        private void LoadTransactionTypes()
        {
            //int? inull = null;

            //tabStripTransactionType.Tabs.Clear();

            //Sebata.Business.Assets.Configuration.TransactionType transType = new Sebata.Business.Assets.Configuration.TransactionType(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);
            //DataTable dt = transType.Get(inull);
            //foreach (DataRow row in dt.Rows)
            //{
            //    string typeName = row["Name"].ToString();
            //    string typeID = row["AssetConfig_TransactionType_ID"].ToString();
            //    Telerik.Web.UI.RadTab newTab = new Telerik.Web.UI.RadTab(typeName, typeID);
            //    newTab.Enabled = false;


            //    switch (lblEditMeasurementType.Text)
            //    {
            //        case "Cost Module":
            //                    if (typeName == "Depreciation" || typeName == "Impairment" || typeName == "Impairment Reversal" || typeName == "Disposal")
            //                        {
            //                            newTab.Enabled = true;
            //                        }
            //                        break;
            //        case "Revaluation Module":
            //                        if (typeName == "Depreciation" || typeName == "Impairment" || typeName == "Impairment Reversal" || typeName == "Disposal" || typeName == "Revaluation")
            //                        {
            //                             newTab.Enabled = true;
            //                        }
            //                        break;
            //        case "Fair Value Module":
            //                        if  (typeName == "Fair Value")
            //                        {
            //                            newTab.Enabled = true; 
            //                        }
            //                        break;
            //        case "Leased Assets":
            //                        if (typeName == "Depreciation" || typeName == "Impairment" || typeName == "Impairment Reversal" || typeName == "Disposal")
            //                        {
            //                            newTab.Enabled = true;
            //                        }
            //                        break;

            //    }

            //    tabStripTransactionType.Tabs.Add(newTab);




            //}
            //dt.Dispose();
            //transType = null;

        }

        protected void lstEditAssetType_SelectedIndexChanged(object sender, EventArgs e)
        {
            lstEditStatus.Enabled = false;
            int typeID = Convert.ToInt32(lstEditAssetType.SelectedValue);

            lblEditAssetType.Text = lstEditAssetType.SelectedItem.Text;

            Sebata.Business.Assets.Configuration.Category configCategory = new Sebata.Business.Assets.Configuration.Category(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);
            lstEditCategory.Items.Clear();

            lstEditCategory.DataSource = configCategory.Get(null, typeID);
            lstEditCategory.DataValueField = "AssetCategoryID";
            lstEditCategory.DataTextField = "AssetCategoryDesc";
            lstEditCategory.DataBind();
            if (lstEditCategory.Items.Count <= 1)
            {
                lstEditCategory.Enabled = false;
                lstEditSubCategory.Items.Clear();
                lstEditSubCategory.Enabled = false;
                if (lstEditCategory.Items.Count > 0)
                    lblEditCategory.Text = lstEditCategory.SelectedItem.Text;
                else
                {
                    lblEditCategory.Text = "";
                    lblEditSubCategory.Text = "";
                }
                if (lstEditCategory.Items.Count == 1)
                    lstEditCategory_SelectedIndexChanged(sender, e);
            }
            else
            {
                lstEditCategory.Enabled = true;
                lstEditCategory.Items.Insert(0, new ListItem("--Select--", "-1"));
                lstEditCategory.SelectedIndex = 0;
                lstEditCategory_SelectedIndexChanged(sender, e);
            }
            LoadEditMeasurementTypes(lstEditAssetType.SelectedValue.intSafe());

        }

        protected void lstEditCategory_SelectedIndexChanged(object sender, EventArgs e)
        {
            int typeID = Convert.ToInt32(lstEditAssetType.SelectedValue);
            int categoryId = Convert.ToInt32(lstEditCategory.SelectedValue);
            lblEditCategory.Text = lstEditCategory.SelectedItem.Text;

            if (categoryId > 0)
            {
                Sebata.Business.Assets.Configuration.SubCategory configSubCategory = new Sebata.Business.Assets.Configuration.SubCategory(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);
                lstEditSubCategory.SelectedIndex = -1;
                lstEditSubCategory.Items.Clear();

                lstEditSubCategory.DataSource = configSubCategory.Get(typeID, categoryId);
                lstEditSubCategory.DataValueField = "Asset_SubCategory_ID";
                lstEditSubCategory.DataTextField = "Asset_SubCategoryDescription";
                lstEditSubCategory.DataBind();
                //lstSubCategory.Items.Insert(0, new ListItem("", "0"));

                configSubCategory = null;
            }

            if (lstEditSubCategory.Items.Count <= 1)
            {
                lstEditSubCategory.Enabled = false;
                if (lstEditSubCategory.Items.Count == 0)
                    lblEditSubCategory.Text = "";
                else
                    lblEditSubCategory.Text = lstEditSubCategory.SelectedItem.Text;
            }
            else
            {
                lstEditSubCategory.Enabled = true;
                lstEditSubCategory.Items.Insert(0, new ListItem("--Select--", "-1"));
                lstEditSubCategory.SelectedIndex = 0;
                lstEditSubCategory_SelectedIndexChanged(sender, e);
            }


            lstEditStatus.Enabled = CheckIfStatusRequired(typeID, categoryId);

        }

        protected void lstEditSubCategory_SelectedIndexChanged(object sender, EventArgs e)
        {
            // lblEditSubCategory.Text = lstEditSubCategory.SelectedItem.Text;
        }

        protected void lstSearchType_SelectedIndexChanged(object sender, EventArgs e)
        {
            int typeID = Convert.ToInt32(lstSearchType.SelectedValue);

            Sebata.Business.Assets.Configuration.Category configCategory = new Sebata.Business.Assets.Configuration.Category(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);
            lstSearchCategory.Items.Clear();

            lstSearchCategory.DataSource = configCategory.Get(null, typeID);
            lstSearchCategory.DataValueField = "AssetCategoryID";
            lstSearchCategory.DataTextField = "AssetCategoryDesc";
            lstSearchCategory.DataBind();
            if (lstSearchCategory.Items.Count == 0)
            {
                lstSearchCategory.Enabled = false;
                lstSearchSubCategory.Items.Clear();
                lstSearchSubCategory.Enabled = false;
            }
            else
            {
                lstSearchCategory.Enabled = true;
                lstSearchCategory.Items.Insert(0, new ListItem("All", "-1"));
                lstSearchCategory.SelectedIndex = 0;
                lstSearchCategory_SelectedIndexChanged(sender, e);
            }
        }

        protected void lstSearchCategory_SelectedIndexChanged(object sender, EventArgs e)
        {
            int typeID = Convert.ToInt32(lstSearchType.SelectedValue);
            int categoryId = Convert.ToInt32(lstSearchCategory.SelectedValue);

            Sebata.Business.Assets.Configuration.SubCategory configSubCategory = new Sebata.Business.Assets.Configuration.SubCategory(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);
            lstSearchSubCategory.Items.Clear();

            lstSearchSubCategory.DataSource = configSubCategory.Get(typeID, categoryId);
            lstSearchSubCategory.DataValueField = "Asset_SubCategory_ID";
            lstSearchSubCategory.DataTextField = "Asset_SubCategoryDescription";
            lstSearchSubCategory.DataBind();
            //lstSubCategory.Items.Insert(0, new ListItem("", "0"));
            if (lstSearchSubCategory.Items.Count == 0)
                lstSearchSubCategory.Enabled = false;
            else
            {
                lstSearchSubCategory.Items.Insert(0, new ListItem("All", "-1"));
                lstSearchSubCategory.Enabled = true;
            }
            configSubCategory = null;
        }

        protected void lstEditMeasurementType_SelectedIndexChanged(object sender, EventArgs e)
        {
            lblEditMeasurementType.Text = lstEditMeasurementType.SelectedItem.Text;
            EnableTabs();
            CheckHerritageAndPPESpesificEnableTabs();
        }

        protected void lstEditStatus_SelectedIndexChanged(object sender, EventArgs e)
        {
            lblEditStatus.Text = lstEditStatus.SelectedItem.Text;
        }

        private void DisableFairValueControls(int TransType, string Measure)
        {
            if (TransType == 6 && Measure == "Fair Value Module")
            {
                //lstEditProject11.Enabled = false;
                //lstEditProject11.ClearSelection();
                //lstEditProject11.Items.Clear();
                //lstEditProject21.Enabled = false;
                //lstEditProject21.ClearSelection();
                //lstEditProject21.Items.Clear();

                lstEditProject11.Enabled = false;
                lstEditProject21.Enabled = false;
                lstEditProject15.Enabled = false;
                lstEditProject25.Enabled = false;
                lstEditDebitItem11_1.Enabled = false;
                lstEditDebitItem11_1.ClearSelection();
                lstEditDebitItem11_2.Enabled = false;
                lstEditDebitItem11_2.ClearSelection();
                lstEditCreditItem12_1.Enabled = false;
                lstEditCreditItem12_1.ClearSelection();
                lstEditDebitItem21_1.Enabled = false;
                lstEditDebitItem21_1.ClearSelection();
                lstEditDebitItem21_2.Enabled = false;
                lstEditDebitItem21_2.ClearSelection();

            }
            else
            {
                if (rwzTransactionList.WizardSteps[0].Enabled == false && TransType == 6)
                {
                    lstEditProject11.Enabled = false;
                    lstEditProject21.Enabled = false;
                    lstEditDebitItem11_1.Enabled = false;
                    lstEditDebitItem11_1.ClearSelection();
                    lstEditDebitItem21_1.Enabled = false;
                    lstEditDebitItem21_1.ClearSelection();
                }
                else
                {
                    lstEditProject11.Enabled = true;
                    lstEditProject21.Enabled = true;
                    lstEditDebitItem11_1.Enabled = true;
                    lstEditDebitItem11_2.Enabled = true;
                    lstEditCreditItem12_1.Enabled = true;
                    lstEditDebitItem21_1.Enabled = true;
                    lstEditDebitItem21_2.Enabled = true;
                }
            }

        }

            private void BuildEdit(string transType)
        {
            int transTypeId = 0;

            Sebata.Business.Assets.Configuration.TransactionType confTransType = new Sebata.Business.Assets.Configuration.TransactionType(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);
            DataTable transactionT = confTransType.Get(transType);

            DataRow transactionR = transactionT.Rows[0];

            transTypeId = Convert.ToInt32(transactionR["AssetConfig_TransactionType_ID"].ToString());

            transactionT = confTransType.GetAll(transTypeId);

            string ProjectType;
            string PositionStatementType;


            //clear all the lists
            lstEditCreditItem11_1.Items.Clear();
            lstEditCreditItem12_1.Items.Clear();
            lstEditCreditItem13_1.Items.Clear();
            //lstEditCreditItem21_1.Items.Clear();
            lstEditCreditItem23_1.Items.Clear();
            lstEditDebitItem11_1.Items.Clear();
            lstEditDebitItem11_2.Items.Clear();
            lstEditDebitItem12_1.Items.Clear();
            lstEditDebitItem21_1.Items.Clear();
            lstEditDebitItem21_2.Items.Clear();
            lstEditDebitItem22_1.Items.Clear();

            lstEditProject11.Items.Clear();
            lstEditProject12.Items.Clear();
            lstEditProject13.Items.Clear();
            lstEditProject14.Items.Clear();
            lstEditProject15.Items.Clear();

            lstEditProject21.Items.Clear();
            lstEditProject22.Items.Clear();
            lstEditProject23.Items.Clear();
            lstEditProject24.Items.Clear();
            lstEditProject25.Items.Clear();


            // Clear Labels
            lblEditSCOAItemCode11.Text = "";
            lblEditProjectSCOAFund11.Text = "";
            lblEditProjectSCOAFund11.Text = "";
            lblEditProjectSCOAFunction11.Text = "";
            lblEditProjectSCOACost11.Text = "";
            lblEditProjectSCOARegion11.Text = "";
            lblEditProjectSCOAProject11.Text = "";
            lblEditProjectMunicipalClasification11.Text = "";

            lblEditSCOAItemCode21.Text = "";
            lblEditProjectSCOAFund21.Text = "";
            lblEditProjectSCOAFunction21.Text = "";
            lblEditProjectSCOACost21.Text = "";
            lblEditProjectSCOARegion21.Text = "";
            lblEditProjectSCOAProject21.Text = "";
            lblEditProjectMunicipalClasification21.Text = "";

            lblEditSCOAItemCode12.Text = "";
            lblEditProjectSCOAFund12.Text = "";
            lblEditProjectSCOAFunction12.Text = "";
            lblEditProjectSCOACost12.Text = "";
            lblEditProjectSCOARegion12.Text = "";
            lblEditProjectSCOAProject12.Text = "";
            lblEditProjectMunicipalClasification12.Text = "";

            lblEditSCOAItemCode22.Text = "";
            lblEditProjectSCOAFund22.Text = "";
            lblEditProjectSCOAFunction22.Text = "";
            lblEditProjectSCOACost22.Text = "";
            lblEditProjectSCOARegion22.Text = "";
            lblEditProjectSCOAProject22.Text = "";
            lblEditProjectMunicipalClasification22.Text = "";

            lblEditSCOAItemCode13.Text = "";
            lblEditProjectSCOAFund13.Text = "";
            lblEditProjectSCOAFunction13.Text = "";
            lblEditProjectSCOACost13.Text = "";
            lblEditProjectSCOARegion13.Text = "";
            lblEditProjectSCOAProject13.Text = "";
            lblEditProjectMunicipalClasification13.Text = "";

            lblEditSCOAItemCode14.Text = "";
            lblEditProjectSCOAFund14.Text = "";
            lblEditProjectSCOAFunction14.Text = "";
            lblEditProjectSCOACost14.Text = "";
            lblEditProjectSCOARegion14.Text = "";
            lblEditProjectSCOAProject14.Text = "";
            lblEditProjectMunicipalClasification14.Text = "";

            lblEditSCOAItemCode23.Text = "";
            lblEditProjectSCOAFund23.Text = "";
            lblEditProjectSCOAFunction23.Text = "";
            lblEditProjectSCOACost23.Text = "";
            lblEditProjectSCOARegion23.Text = "";
            lblEditProjectSCOAProject23.Text = "";
            lblEditProjectMunicipalClasification23.Text = "";

            lblEditSCOAItemCode24.Text = "";
            lblEditProjectSCOAFund24.Text = "";
            lblEditProjectSCOAFunction24.Text = "";
            lblEditProjectSCOACost24.Text = "";
            lblEditProjectSCOARegion24.Text = "";
            lblEditProjectSCOAProject24.Text = "";
            lblEditProjectMunicipalClasification24.Text = "";




            transactionR = transactionT.Rows[0];

            txtSubtype1.Text = transactionR["SubType1"].ToString();
            txtSubtype1.Visible = (txtSubtype1.Text != "");
            txtSubtype2.Text = transactionR["SubType2"].ToString();
            txtSubtype2.Visible = (txtSubtype2.Text != "");

            //Left
            txtDebitDisplayName11.Text = transactionR["DRDisplayName11"].ToString();
            txtDebitDisplayName12.Text = transactionR["DRDisplayName12"].ToString();
            txtDebitDisplayName13.Text = transactionR["DRDisplayName13"].ToString();
            txtDebitDisplayName14.Text = transactionR["DRDisplayName14"].ToString();

            txtCreditDisplayName11.Text = transactionR["CRDisplayName11"].ToString();


            txtDebitDisplayName11.Visible = (txtDebitDisplayName11.Text != "");
            txtDebitDisplayName12.Visible = (txtDebitDisplayName12.Text != "");
            txtDebitDisplayName13.Visible = (txtDebitDisplayName13.Text != "");
            txtDebitDisplayName14.Visible = (txtDebitDisplayName14.Text != "");
            txtCreditDisplayName11.Visible = (txtCreditDisplayName11.Text != "");

            //first project
            divEditProjectLeft1.Visible = txtDebitDisplayName11.Visible;
            if (txtDebitDisplayName11.Visible)
            {
                ProjectType = transactionR["DRProjectType11"].ToString();
                PositionStatementType = transactionR["DRPositionStatementType11"].ToString();
                BuildProjectDropDown(lstEditProject11, ProjectType, PositionStatementType);
            }

            //item 1-1
            lstEditDebitItem11_1.Visible = txtDebitDisplayName11.Visible;
            lblEditDebitItem11_1.Visible = txtDebitDisplayName11.Visible;
            //item 1-2
            lblEditDebitItem11_2.Visible = txtDebitDisplayName12.Visible;
            lstEditDebitItem11_2.Visible = txtDebitDisplayName12.Visible;
            lstEditDebitItem11_1_SelectedIndexChanged(null, null);

            //second project
            divEditProjectLeft2.Visible = (txtDebitDisplayName13.Visible);

            if (txtDebitDisplayName13.Visible) //debit 
            {
                lblEditDebitItem12_1.Visible = true;
                lstEditDebitItem12_1.Visible = true;
                lblEditCreditItem12_1.Visible = false;
                lstEditCreditItem12_1.Visible = false;
                ProjectType = transactionR["DRProjectType12"].ToString();
                PositionStatementType = transactionR["DRPositionStatementType12"].ToString();
                BuildProjectDropDown(lstEditProject12, ProjectType, PositionStatementType);
            }
            //else //credit
            //{
            //    lblEditDebitItem12_1.Visible = false;
            //    lstEditDebitItem12_1.Visible = false;
            //    lblEditCreditItem12_1.Visible = true;
            //    lstEditCreditItem12_1.Visible = true;
            //    ProjectType = transactionR["CRProjectType11"].ToString();
            //    PositionStatementType = transactionR["CRPositionStatementType11"].ToString();
            //    BuildProjectDropDown(lstEditProject12, ProjectType, PositionStatementType);
            //}

            //3rd Project
            divEditProjectLeft3.Visible = txtDebitDisplayName14.Visible;

            if (txtDebitDisplayName14.Visible)
            {
                ProjectType = transactionR["DRProjectType14"].ToString();
                PositionStatementType = transactionR["DRPositionStatementType14"].ToString();
                BuildProjectDropDown(lstEditProject13, ProjectType, PositionStatementType);
            }

            //4th project

            divEditProjectLeft4.Visible = txtCreditDisplayName11.Visible;
            lblEditCreditItem11_1.Visible = txtCreditDisplayName11.Visible;

            if (txtCreditDisplayName11.Visible)
            {
                ProjectType = transactionR["CRProjectType11"].ToString();
                PositionStatementType = transactionR["CRPositionStatementType11"].ToString();
                BuildProjectDropDown(lstEditProject14, ProjectType, PositionStatementType);
            }


            //right leg
            txtDebitDisplayName21.Text = transactionR["DRDisplayName21"].ToString();
            txtDebitDisplayName22.Text = transactionR["DRDisplayName22"].ToString();
            txtDebitDisplayName23.Text = transactionR["DRDisplayName23"].ToString();
            txtCreditDisplayName21.Text = transactionR["CRDisplayName21"].ToString();
            txtCreditDisplayName22.Text = transactionR["CRDisplayName22"].ToString();

            txtDebitDisplayName21.Visible = (txtDebitDisplayName21.Text != "");
            txtDebitDisplayName22.Visible = (txtDebitDisplayName22.Text != "");
            txtDebitDisplayName23.Visible = (txtDebitDisplayName23.Text != "");
            txtCreditDisplayName21.Visible = (txtCreditDisplayName21.Text != "");
            txtCreditDisplayName22.Visible = (txtCreditDisplayName22.Text != "");

            //first project
            divEditProjectRight1.Visible = txtDebitDisplayName21.Visible;
            if (txtDebitDisplayName21.Visible)
            {
                ProjectType = transactionR["DRProjectType21"].ToString();
                PositionStatementType = transactionR["DRPositionStatementType21"].ToString();
                BuildProjectDropDown(lstEditProject21, ProjectType, PositionStatementType);
            }

            //item 1-1
            lstEditDebitItem21_1.Visible = txtDebitDisplayName21.Visible;
            lstEditDebitItem21_1.Visible = txtDebitDisplayName21.Visible;
            //item 1-2
            lblEditDebitItem21_2.Visible = txtDebitDisplayName22.Visible;
            lstEditDebitItem21_2.Visible = txtDebitDisplayName22.Visible;
            //item 1-3
            //lblEditCreditItem21_1.Visible = (txtCreditDisplayName21.Visible && txtDebitDisplayName22.Visible);
            //lstEditCreditItem21_1.Visible = (txtCreditDisplayName21.Visible && txtDebitDisplayName22.Visible);


            //2th project
            //divEditProjectRight1point5.Visible = txtDebitDisplayName25.Visible;
            //  lblEditDebitItem21_2.Visible = txtDebitDisplayName21.Visible;

            if (transType == "Disposal")
            {
                divEditProjectRight1point5.Visible = true;
                divEditProjectLeft1point5.Visible = true;
                ProjectType = "Capital";
                PositionStatementType = "IZ";
                BuildProjectDropDown(lstEditProject25, ProjectType, PositionStatementType);
                BuildProjectDropDown(lstEditProject15, ProjectType, PositionStatementType);
            }
            else
            {
                divEditProjectRight1point5.Visible = false;
                divEditProjectLeft1point5.Visible = false;
            }

            if (transType == "Revaluation")
            {
                divEditProjectRight1point5.Visible = true;
                divEditProjectLeft1point5.Visible = true;
                ProjectType = "Capital";
                PositionStatementType = "IZ";
                BuildProjectDropDown(lstEditProject25, ProjectType, PositionStatementType);
                BuildProjectDropDown(lstEditProject15, ProjectType, PositionStatementType);
            }

            if (transType == "Depreciation" && lblEditMeasurementType.Text != "Revaluation Module")
            {
                divEditProjectLeft2.Visible = false;
                divEditProjectLeft3.Visible = false;
                txtDebitDisplayName13.Visible = false;
                txtDebitDisplayName14.Visible = false;
            }

            if (transType == "Impairment" && lblEditMeasurementType.Text != "Revaluation Module")
            {
                divEditProjectLeft2.Visible = false;
                txtDebitDisplayName13.Visible = false;
            }

            if (transType == "Impairment Reversal" && lblEditMeasurementType.Text != "Revaluation Module")
            {
                divEditProjectLeft2.Visible = false;
                txtDebitDisplayName13.Visible = false;
            }

            //second project
            divEditProjectRight2.Visible = (txtDebitDisplayName23.Visible);// || txtCreditDisplayName21.Visible);

            if (txtDebitDisplayName13.Visible) //debit 
            {
                lblEditDebitItem22_1.Visible = txtDebitDisplayName23.Visible;
                lstEditDebitItem22_1.Visible = txtDebitDisplayName23.Visible;
                ProjectType = transactionR["DRProjectType22"].ToString();
                PositionStatementType = transactionR["DRPositionStatementType22"].ToString();
                BuildProjectDropDown(lstEditProject22, ProjectType, PositionStatementType);
            }

            //3rd Project
            divEditProjectRight3.Visible = txtCreditDisplayName22.Visible;

            if (txtCreditDisplayName22.Visible)
            {
                ProjectType = transactionR["CRProjectType22"].ToString();
                PositionStatementType = transactionR["CRPositionStatementType22"].ToString();
                BuildProjectDropDown(lstEditProject23, ProjectType, PositionStatementType);

            }
            //4th project
            divEditProjectRigh4.Visible = txtCreditDisplayName21.Visible;
            lblEditCreditItem21_1.Visible = txtCreditDisplayName21.Visible;

            if (txtCreditDisplayName21.Visible)
            {
                ProjectType = transactionR["CRProjectType21"].ToString();
                PositionStatementType = transactionR["CRPositionStatementType21"].ToString();
                BuildProjectDropDown(lstEditProject24, ProjectType, PositionStatementType);
            }

            transactionR = null;
            transactionT.Dispose();
            confTransType = null;
            //BuildProjectDropDowns();

            // For Fair Value we need to Enable and disable some control onlyon the Disposal Tab
            DisableFairValueControls(transTypeId, lblEditMeasurementType.Text);


        }

        static DataTable projectList = null;
        private void BuildProjectDropDown(DropDownList dropdown, string ProjectType, string PositionStatementType)
        {
            if (projectList == null)
                projectList = _configmSCOA.GetProjects(lblFinYear.Text, ProjectType, PositionStatementType);

            dropdown.Items.Clear();
            dropdown.DataSource = projectList;
            dropdown.DataTextField = "ProjectField";
            dropdown.DataValueField = "Project_ID";
            dropdown.DataBind();
            dropdown.Items.Insert(0, new ListItem("--Select--", "-1"));
        }


        protected void tabStripTransactionType_TabClick(object sender, Telerik.Web.UI.RadTabStripEventArgs e)
        {

            //save to memory current values

            SaveSession();

            int transType = Convert.ToInt32(e.Tab.Value);
            //string transType = e.Tab.tit
            BuildEdit(transType.ToString());

            Session["CurrentTab"] = e.Tab.Text;

            LoadSession();
        }

        private void LoadSession()
        {
            Control page = lstEditProject11.Parent.Parent;
            System.Type t = this.GetType();

            string transType = Session["CurrentTab"].ToString();
            setLabels(transType);
            if (Session[transType] != null)
            {
                //List<Control> items = (List<Control>)Session[transType];
                List<KeyValuePair<string, KeyValuePair<string, string>>> items = (List<KeyValuePair<string, KeyValuePair<string, string>>>)Session[transType];
                foreach (KeyValuePair<string, KeyValuePair<string, string>> c in items)
                {
                    if (c.Value.Value != "")
                    {
                        if (c.Key.Contains("Project"))
                        {
                            DropDownList pageControl = (DropDownList)page.FindControl(c.Key);
                            try
                            {
                                pageControl.SelectedValue = c.Value.Value;
                            }
                            catch { }
                            switch (c.Key)
                            {
                                case "lstEditProject14":
                                    lstEditProject14_SelectedIndexChanged(null, null);
                                    break;
                                case "lstEditProject24":
                                    lstEditProject24_SelectedIndexChanged(null, null);
                                    break;
                                case "lstEditProject25":
                                    lstEditProject25_SelectedIndexChanged(null, null);
                                    break;
                                case "lstEditProject15":
                                    lstEditProject15_SelectedIndexChanged(null, null);
                                    break;
                                case "lstEditProject11":
                                    lstEditProject11_SelectedIndexChanged(null, null);

                                    break;
                                case "lstEditProject21":
                                    lstEditProject21_SelectedIndexChanged(null, null);
                                    break;
                                case "lstEditProject12":
                                    lstEditProject12_SelectedIndexChanged(null, null);
                                    break;
                                case "lstEditProject22":
                                    lstEditProject22_SelectedIndexChanged(null, null);
                                    break;
                                case "lstEditProject13":
                                    lstEditProject13_SelectedIndexChanged(null, null);
                                    break;
                                case "lstEditProject23":
                                    lstEditProject23_SelectedIndexChanged(null, null);
                                    break;
                                default:
                                    MethodInfo method = t.GetMethod($"{c.Key}_SelectedIndexChanged");
                                    method.Invoke(this, new object[] { null, null });
                                    break;
                            }
                        }
                    }
                }
                foreach (KeyValuePair<string, KeyValuePair<string, string>> c in items)
                {
                    if (c.Value.Value != "")
                    {
                        if (!c.Key.Contains("Project"))
                        {
                            DropDownList pageControl = (DropDownList)page.FindControl(c.Key);
                            //if (pageControl.Items.Count == 0)
                            //    pageControl.DataSource = _configmSCOA.GetProjectItems(Convert.ToInt32(lstEditProject14.SelectedValue));
                            try
                            {
                                pageControl.SelectedValue = c.Value.Value;
                            }
                            catch { }
                        }
                    }
                }
                try
                {
                    lstEditDebitItem11_1_SelectedIndexChanged(null, null);
                    lstEditCreditItem11_1_SelectedIndexChanged(null, null);
                    lstEditDebitItem12_1_SelectedIndexChanged(null, null);
                    lstEditCreditItem13_1_SelectedIndexChanged(null, null);

                    lstEditDebitItem21_1_SelectedIndexChanged(null, null);
                    lstEditCreditItem21_1_SelectedIndexChanged(null, null);
                    lstEditDebitItem22_1_SelectedIndexChanged(null, null);
                    lstEditCreditItem23_1_SelectedIndexChanged(null, null);

                    lstEditDebitItem21_2_SelectedIndexChanged(null, null);
                    lstEditDebitItem11_2_SelectedIndexChanged(null, null);


                }
                catch { }

                // Set the Labels 

            }
        }


        void setLabels(string transType)
        {
            switch (transType)
            {           
                case "Depreciation":
                    if (lblEditMeasurementType.Text == "Revaluation Module")
                    {
                        lblEditProject11.Text = "Dt Project - Depreciation";
                        lblEditDebitItem11_1.Text = "Dt SCOA Item - Depreciation";

                        lblEditProject12.Text = "Ct Project - Depreciation Offset";
                        lblEditDebitItem12_1.Text = "Ct SCOA Item – Depreciation Offset";

                        lblEditProject13.Text = "Dt Project – Revaluation Reserve ";
                        lblEditCreditItem13_1.Text = "Dt SCOA Item – Revaluation Reserve ";

                        lblEditProject14.Text = "Ct Project - Accumulated Depreciation";
                        lblEditCreditItem11_1.Text = "Ct SCOA Item - Accumulated Depreciation";
                        break;
                    }
                    else
                    {
                        lblEditProject11.Text = "Dt Project - Depreciation";
                        lblEditDebitItem11_1.Text = "Dt SCOA Item - Depreciation";

                        lblEditProject14.Text = "Ct Project - Accumulated Depreciation";
                        lblEditCreditItem11_1.Text = "Ct SCOA Item - Accumulated Depreciation";
                        break;
                    }

                case "Impairment":
                    if(lblEditMeasurementType.Text == "Revaluation Module")
                    {
                        lblEditProject11.Text = "Dt Project - Impairment Loss";
                        lblEditDebitItem11_1.Text = "Dt SCOA Item - Impairment Loss";

                        lblEditProject12.Text = "Dt Project - Revaluation Reserve";
                        lblEditDebitItem12_1.Text = "Dt SCOA Item – Revaluation Reserve";

                        lblEditProject14.Text = "Ct Project - Accumulated Impairment";
                        lblEditCreditItem11_1.Text = "Ct SCOA Item - Accumulated Impairment";
                        break;
                    }
                    else
                    {
                        lblEditProject11.Text = "Dt Project - Impairment Loss";
                        lblEditDebitItem11_1.Text = "Dt SCOA Item - Impairment Loss";

                        lblEditProject14.Text = "Ct Project - Accumulated Impairment";
                        lblEditCreditItem11_1.Text = "Ct SCOA Item - Accumulated Impairment";
                        break;
                    }
                    
 

                case "Impairment Reversal":
                    if (lblEditMeasurementType.Text == "Revaluation Module")
                    {
                        lblEditProject11.Text = "Dt Project - Accumulated Impairment";
                        lblEditDebitItem11_1.Text = "Dt SCOA Item - Accumulated Impairment";

                        lblEditProject12.Text = "Ct Project - Revaluation Reserve";
                        lblEditDebitItem12_1.Text = "Ct SCOA Item – Revaluation Reserve";

                        lblEditProject14.Text = "Ct Project - Reversal of Impairment";
                        lblEditCreditItem11_1.Text = "Ct SCOA Item - Reversal of Impairment";
                        break;
                    }
                    else
                    {
                        lblEditProject11.Text = "Dt Project - Accumulated Impairment";
                        lblEditDebitItem11_1.Text = "Dt SCOA Item - Accumulated Impairment";

                        lblEditProject14.Text = "Ct Project - Reversal of Impairment";
                        lblEditCreditItem11_1.Text = "Ct SCOA Item - Reversal of Impairment";
                        break;
                    }

                case "Fair Value":
                    lblEditProject11.Text = "Dt Project - Asset Account";
                    lblEditDebitItem11_1.Text = "Dt SCOA Item - Asset Account";
                    lblEditProject21.Text = "Dt Project - Losses on Fair Value Adj.";
                    lblEditDebitItem21_1.Text = "Dt SCOA Item – Losses on Fair Value Adj.";

                    lblEditProject14.Text = "Ct Project - Gains on Fair Value Adjustments";
                    lblEditCreditItem11_1.Text = "Ct SCOA Item - Gains on Fair Value Adj.";
                    lblEditProject24.Text = "Ct Project – Asset Account";
                    lblEditCreditItem21_1.Text = "Ct SCOA Item – Asset Account";
                    break;

                case "Revaluation":
                    lblEditProject11.Text = "Dt Project - Asset Revaluation";
                    lblEditDebitItem11_1.Text = "Dt SCOA Item - Asset Revaluation";
                    lblEditProject21.Text = "Dt Project - Revaluation Reserve";
                    lblEditDebitItem21_1.Text = "Ct SCOA Item – Revaluation Reserve";

                    lblEditProject12.Text = "Ct Project - Accumulated Depreciation";
                    lblEditDebitItem12_1.Text = "Ct SCOA Item – Accumulated Depreciation";
                    lblEditProject22.Text = "Dt Project - Accumulated Depreciation";
                    lblEditDebitItem22_1.Text = "Dt SCOA Item – Accumulated Depreciation";

                    lblEditProject13.Text = "Ct Project – Accumulated Surplus on Disposal";
                    lblEditCreditItem13_1.Text = "Ct SCOA Item – Accumulated Surplus on Disposal";
                    lblEditProject23.Text = "Ct Project – Accumulated Surplus on Disposal";
                    lblEditCreditItem23_1.Text = "Ct SCOA Item – Accumulated Surplus on Disposal";

                    lblEditProject14.Text = "Ct Project - Revaluation Reserve";
                    lblEditCreditItem11_1.Text = "Ct SCOA Item - Revaluation Reserve";
                    lblEditProject24.Text = "Ct Project – Asset Revaluation";
                    lblEditCreditItem21_1.Text = "Dt SCOA Item – Asset Revaluation";

                    lblEditProject15.Text = "Dt Project - Revaluation Reserve Disposal";
                    lblEditDebitItem11_2.Text = "Dt SCOA Item – Revaluation Reserve Disposal";
                    lblEditProject25.Text = "Dt Project - Revaluation Reserve Disposal";
                    lblEditDebitItem21_2.Text = "Dt SCOA Item – Revaluation Reserve Disposal";

                    break;

                case "Disposal":
                    //txtDebitDisplayName22.Text = "Debit Accumulated Depreciation";
                    lblEditProject11.Text = "Dt Project - Accumulated Depreciation";
                    lblEditDebitItem11_1.Text = "Dt SCOA Item – Accumulated Depreciation";
                    lblEditProject21.Text = "Dt Project - Accumulated Depreciation";
                    lblEditDebitItem21_1.Text = "Dt SCOA Item – Accumulated Depreciation";

                    lblEditProject15.Text = "Dt Project - Accumulated Impairment";
                    lblEditDebitItem11_2.Text = "Dt SCOA Item – Accumulated Impairment";
                    lblEditProject25.Text = "Dt Project - Accumulated Impairment";
                    lblEditDebitItem21_2.Text = "Dt SCOA Item – Accumulated Impairment";

                    lblEditProject12.Text = "Dt Project – Loss on Disposal";
                    lblEditDebitItem12_1.Text = "Dt SCOA Item – Loss on Disposal";
                    lblEditProject22.Text = "Ct Project – Gain on Disposal";
                    lblEditDebitItem22_1.Text = "Ct SCOA Item – Gain on Disposal";

                    lblEditProject13.Text = "Dt Project – Disposal Clearing Account ";
                    lblEditCreditItem13_1.Text = "Dt SCOA Item – Disposal Clearing Account ";
                    lblEditProject23.Text = "Dt Project – Disposal Clearing Account ";
                    lblEditCreditItem23_1.Text = "Dt SCOA Item – Disposal Clearing Account ";

                    lblEditProject14.Text = "Ct Project – Asset Disposal Account";
                    lblEditCreditItem11_1.Text = "Ct SCOA Item – Asset Disposal Account";
                    lblEditProject24.Text = "Ct Project – Asset Disposal Account";
                    lblEditCreditItem21_1.Text = "Ct SCOA Item – Asset Disposal Account";

                    break;
                case "Asset Unbundling":
                    lblEditProject11.Text = "Dt Project - Asset Acquisition";
                    lblEditDebitItem11_1.Text = "Dt SCOA Item - Asset Acquisition";
                    lblEditProject14.Text = "Ct Project - Work-in-Progress Acquisition";
                    lblEditCreditItem11_1.Text = "Ct SCOA Item - Work-in-Progress Acquisition";
                    break;
            }
        }

        private void SaveSession()
        {
            if (Session["CurrentTab"] == null)
                Session["CurrentTab"] = rwzTransactionList.ActiveStep.Title;//.ActiveStepIndex.Titl tabStripTransactionType.SelectedTab.Text;
            string transType = Session["CurrentTab"].ToString();
            List<KeyValuePair<string, KeyValuePair<string, string>>> items = new List<KeyValuePair<string, KeyValuePair<string, string>>>();

            Control page = lstEditProject11.Parent.Parent;

            foreach (Control pc in page.Controls)
            {
                foreach (Control c in pc.Controls)
                {
                    if (c.ID != null)
                    {
                        if (c.ID.Length > 7 && c.ID.StartsWith("lstEdit") && c.Visible)
                        {
                            DropDownList l = (DropDownList)c;
                            string lbl = ((Label)pc.FindControl(c.ID.Replace("lst", "lbl"))).Text;
                            items.Add(new KeyValuePair<string, KeyValuePair<string, string>>(c.ID, new KeyValuePair<string, string>(lbl, l.SelectedValue)));
                        }
                    }
                }
            }
            Session[transType] = items;

        }


        public void lstEditProject11_SelectedIndexChanged(object sender, EventArgs e)
        {
            lstEditDebitItem11_1.Items.Clear();
            //lstEditDebitItem11_2.Items.Clear();
            //lstEditCreditItem11_1.Items.Clear();
            if (lstEditProject11.Items.Count > 0)
            {
                lstEditProject11.ToolTip = lstEditProject11.SelectedItem.ToString();


                DataTable items = _configmSCOA.GetProjectItems(Convert.ToInt32(lstEditProject11.SelectedValue));
                lstEditDebitItem11_1.DataSource = items;
                //lstEditDebitItem11_2.DataSource = items;
                //lstEditCreditItem11_1.DataSource = items;

                lstEditDebitItem11_1.DataTextField = "PlanProjectItemAndItemDesc";
                lstEditDebitItem11_1.DataValueField = "PlanProjectItem_ID";
                //lstEditDebitItem11_2.DataTextField = "ItemDescription";
                //lstEditDebitItem11_2.DataValueField = "PlanProjectItem_ID";
                //lstEditCreditItem11_1.DataTextField = "ItemDescription";
                //lstEditCreditItem11_1.DataValueField = "PlanProjectItem_ID";

                lstEditDebitItem11_1.DataBind();
                //lstEditDebitItem11_2.DataBind();
                //lstEditCreditItem11_1.DataBind();
                lstEditDebitItem11_1.Items.Insert(0, new ListItem("--Select--", "-1"));
                //lstEditDebitItem11_2.Items.Insert(0, new ListItem("--Select--", "-1"));
                //lstEditCreditItem11_1.Items.Insert(0, new ListItem("--Select--", "-1"));

                try
                {
                    lblEditSCOAItemCode11.Text = "";
                    lblEditSCOAItemCode11.ToolTip = "";
                    lblEditProjectSCOAFund11.Text = "";
                    lblEditProjectSCOAFund11.ToolTip = "";
                    lblEditProjectSCOAFunction11.Text = "";
                    lblEditProjectSCOAFunction11.ToolTip = "";
                    lblEditProjectSCOACost11.Text = "";
                    lblEditProjectSCOACost11.ToolTip = "";
                    lblEditProjectSCOARegion11.Text = "";
                    lblEditProjectSCOARegion11.ToolTip = "";
                    lblEditProjectSCOAProject11.Text = "";
                    lblEditProjectSCOAProject11.ToolTip = "";
                    lblEditProjectMunicipalClasification11.Text = "";
                    lblEditProjectMunicipalClasification11.ToolTip = "";


                }
                catch { }
            }
        }

        public void lstEditProject12_SelectedIndexChanged(object sender, EventArgs e)
        {
            DataTable items = null;

            if (lstEditProject12.SelectedValue != "")
                items = _configmSCOA.GetProjectItems(Convert.ToInt32(lstEditProject12.SelectedValue));

            lstEditCreditItem12_1.Items.Clear();
            lstEditDebitItem12_1.Items.Clear();

            lstEditProject12.ToolTip = lstEditProject12.SelectedItem.ToString();
            if (txtDebitDisplayName12.Visible || txtDebitDisplayName13.Visible) //debit 
            {
                lstEditDebitItem12_1.DataSource = items;

                lstEditDebitItem12_1.DataTextField = "PlanProjectItemAndItemDesc";
                lstEditDebitItem12_1.DataValueField = "PlanProjectItem_ID";

                lstEditDebitItem12_1.DataBind();
                lstEditDebitItem12_1.Items.Insert(0, new ListItem("--Select--", "-1"));




            }
            else
            {
                lstEditCreditItem12_1.DataSource = items;

                lstEditCreditItem12_1.DataTextField = "PlanProjectItemAndItemDesc";
                lstEditCreditItem12_1.DataValueField = "PlanProjectItem_ID";

                lstEditCreditItem12_1.DataBind();
                lstEditCreditItem12_1.Items.Insert(0, new ListItem("--Select--", "-1"));


            }
            lblEditSCOAItemCode12.Text = "";
            lblEditSCOAItemCode12.ToolTip = "";
            lblEditProjectSCOAFund12.Text = "";
            lblEditProjectSCOAFund12.ToolTip = "";
            lblEditProjectSCOAFunction12.Text = "";
            lblEditProjectSCOAFunction12.ToolTip = "";
            lblEditProjectSCOACost12.Text = "";
            lblEditProjectSCOACost12.ToolTip = "";
            lblEditProjectSCOARegion12.Text = "";
            lblEditProjectSCOARegion12.ToolTip = "";
            lblEditProjectSCOAProject12.Text = "";
            lblEditProjectSCOAProject12.ToolTip = "";
            lblEditProjectMunicipalClasification12.Text = "";
            lblEditProjectMunicipalClasification12.ToolTip = "";

        }

        public void lstEditProject13_SelectedIndexChanged(object sender, EventArgs e)
        {

            lstEditCreditItem13_1.Items.Clear();
            lstEditProject13.ToolTip = lstEditProject13.SelectedItem.ToString();

            DataTable items = _configmSCOA.GetProjectItems(Convert.ToInt32(lstEditProject13.SelectedValue));
            lstEditCreditItem13_1.DataSource = items;

            lstEditCreditItem13_1.DataTextField = "PlanProjectItemAndItemDesc";
            lstEditCreditItem13_1.DataValueField = "PlanProjectItem_ID";

            lstEditCreditItem13_1.DataBind();
            lstEditCreditItem13_1.Items.Insert(0, new ListItem("--Select--", "-1"));

            lblEditSCOAItemCode13.Text = "";
            lblEditSCOAItemCode13.ToolTip = "";
            lblEditProjectSCOAFund13.Text = "";
            lblEditProjectSCOAFund13.ToolTip = "";
            lblEditProjectSCOAFunction13.Text = "";
            lblEditProjectSCOAFunction13.ToolTip = "";
            lblEditProjectSCOACost13.Text = "";
            lblEditProjectSCOACost13.ToolTip = "";
            lblEditProjectSCOARegion13.Text = "";
            lblEditProjectSCOARegion13.ToolTip = "";
            lblEditProjectSCOAProject13.Text = "";
            lblEditProjectSCOAProject13.ToolTip = "";
            lblEditProjectMunicipalClasification13.Text = "";
            lblEditProjectMunicipalClasification13.ToolTip = "";
        }

        public void lstEditProject21_SelectedIndexChanged(object sender, EventArgs e)
        {

            lstEditDebitItem21_1.Items.Clear();
            //lstEditDebitItem21_2.Items.Clear();
            //lstEditCreditItem21_1.Items.Clear();

            if (lstEditProject21.Items.Count > 0)
            {
                lstEditProject21.ToolTip = lstEditProject21.SelectedItem.ToString();
                DataTable items = _configmSCOA.GetProjectItems(Convert.ToInt32(lstEditProject21.SelectedValue));
                lstEditDebitItem21_1.DataSource = items;
                // lstEditDebitItem21_2.DataSource = items;
                //lstEditCreditItem21_1.DataSource = items;

                lstEditDebitItem21_1.DataTextField = "PlanProjectItemAndItemDesc";
                lstEditDebitItem21_1.DataValueField = "PlanProjectItem_ID";
                // lstEditDebitItem21_2.DataTextField = "ItemDescription";
                // lstEditDebitItem21_2.DataValueField = "PlanProjectItem_ID";
                //lstEditCreditItem21_1.DataTextField = "ItemDescription";
                //lstEditCreditItem21_1.DataValueField = "PlanProjectItem_ID";

                lstEditDebitItem21_1.DataBind();
                //  lstEditDebitItem21_2.DataBind();
                //lstEditCreditItem21_1.DataBind();
                lstEditDebitItem21_1.Items.Insert(0, new ListItem("--Select--", "-1"));
                //   lstEditDebitItem21_2.Items.Insert(0, new ListItem("--Select--", "-1"));
                //lstEditCreditItem21_1.Items.Insert(0, new ListItem("--Select--", "-1"));

                lblEditSCOAItemCode21.Text = "";
                lblEditSCOAItemCode21.ToolTip = "";
                lblEditProjectSCOAFund21.Text = "";
                lblEditProjectSCOAFund21.ToolTip = "";
                lblEditProjectSCOAFunction21.Text = "";
                lblEditProjectSCOAFunction21.ToolTip = "";
                lblEditProjectSCOACost21.Text = "";
                lblEditProjectSCOACost21.ToolTip = "";
                lblEditProjectSCOARegion21.Text = "";
                lblEditProjectSCOARegion21.ToolTip = "";
                lblEditProjectSCOAProject21.Text = "";
                lblEditProjectSCOAProject21.ToolTip = "";
                lblEditProjectMunicipalClasification21.Text = "";
                lblEditProjectMunicipalClasification21.ToolTip = "";

            }
        }

        public void lstEditProject22_SelectedIndexChanged(object sender, EventArgs e)
        {
            //
            lstEditDebitItem22_1.Items.Clear();
            lstEditProject22.ToolTip = lstEditProject22.SelectedItem.ToString();

            DataTable items = _configmSCOA.GetProjectItems(Convert.ToInt32(lstEditProject22.SelectedValue));
            lstEditDebitItem22_1.DataSource = items;
            lstEditDebitItem22_1.DataTextField = "PlanProjectItemAndItemDesc";
            lstEditDebitItem22_1.DataValueField = "PlanProjectItem_ID";
            lstEditDebitItem22_1.DataBind();
            lstEditDebitItem22_1.Items.Insert(0, new ListItem("--Select--", "-1"));

            lblEditSCOAItemCode22.Text = "";
            lblEditSCOAItemCode22.ToolTip = "";
            lblEditProjectSCOAFund22.Text = "";
            lblEditProjectSCOAFund22.ToolTip = "";
            lblEditProjectSCOAFunction22.Text = "";
            lblEditProjectSCOAFunction22.ToolTip = "";
            lblEditProjectSCOACost22.Text = "";
            lblEditProjectSCOACost22.ToolTip = "";
            lblEditProjectSCOARegion22.Text = "";
            lblEditProjectSCOARegion22.ToolTip = "";
            lblEditProjectSCOAProject22.Text = "";
            lblEditProjectSCOAProject22.ToolTip = "";
            lblEditProjectMunicipalClasification22.Text = "";
            lblEditProjectMunicipalClasification22.ToolTip = "";

        }

        public void lstEditProject23_SelectedIndexChanged(object sender, EventArgs e)
        {
            //
            lstEditCreditItem23_1.Items.Clear();
            lstEditProject23.ToolTip = lstEditProject23.SelectedItem.ToString();

            DataTable items = _configmSCOA.GetProjectItems(Convert.ToInt32(lstEditProject23.SelectedValue));
            lstEditCreditItem23_1.DataSource = items;
            lstEditCreditItem23_1.DataTextField = "PlanProjectItemAndItemDesc";
            lstEditCreditItem23_1.DataValueField = "PlanProjectItem_ID";
            lstEditCreditItem23_1.DataBind();
            lstEditCreditItem23_1.Items.Insert(0, new ListItem("--Select--", "-1"));

            lblEditSCOAItemCode23.Text = "";
            lblEditSCOAItemCode23.ToolTip = "";
            lblEditProjectSCOAFund23.Text = "";
            lblEditProjectSCOAFund23.ToolTip = "";
            lblEditProjectSCOAFunction23.Text = "";
            lblEditProjectSCOAFunction23.ToolTip = "";
            lblEditProjectSCOACost23.Text = "";
            lblEditProjectSCOACost23.ToolTip = "";
            lblEditProjectSCOARegion23.Text = "";
            lblEditProjectSCOARegion23.ToolTip = "";
            lblEditProjectSCOAProject23.Text = "";
            lblEditProjectSCOAProject23.ToolTip = "";
            lblEditProjectMunicipalClasification23.Text = "";
            lblEditProjectMunicipalClasification23.ToolTip = "";

        }

        private void SwitchTab(string TabValue)
        {

            //switch (TabValue)
            //{
            //    case "Detail":
            //        SaveSession();
            //        break;
            //    case "Type":

            //        if (Session["CurrentTab"] == "Fair Value")
            //        {

            //            tabStripTransactionType.SelectedIndex = 3;
            //            int transType = Convert.ToInt32(tabStripTransactionType.Tabs[3].Value);
            //            BuildEdit(transType);
            //            Session["CurrentTab"] = tabStripTransactionType.Tabs[3].Text;
            //            LoadSession();

            //        }
            //        else
            //        {

            //            tabStripTransactionType.SelectedIndex = 0;
            //            int transType = Convert.ToInt32(tabStripTransactionType.Tabs[0].Value);
            //            BuildEdit(transType);
            //            Session["CurrentTab"] = tabStripTransactionType.Tabs[0].Text;
            //            LoadSession();

            //        }



            //        break;
            //    case "Submit":
            //        SaveSession();
            //        ValidatePage();
            //        break;

            //}
        }
        private void SwitchStep(string TabValue)
        {

            switch (TabValue)
            {
                case "Asset Details":
                    SaveSession();
                    Div_New.Visible = false;
                    break;
                case "Transaction Type":

                    // Load up the steps                   


                    if (lstEditMeasurementType.SelectedItem != null && lstEditMeasurementType.SelectedItem.Text == "Fair Value Module") //(Session["CurrentTab"] == "Fair Value")
                    {
                        Div_New.Visible = true;
                        //tabStripTransactionType.SelectedIndex = 3;
                        //int activeStepIndex = (sender as RadWizard).ActiveStep.Index;
                        rwzTransactionList.WizardSteps[3].Active = true;
                        string transType = "Fair Value";//int transType = 4;// rwzTransactionList.ActiveStepIndex + 1;// Convert.ToInt32(tabStripTransactionType.Tabs[3].Value);
                        BuildEdit(transType);
                        Session["CurrentTab"] = "Fair Value";// rwzTransactionList.ActiveStep.Title;// wzsTransactionType.Title;// tabStripTransactionType.Tabs[3].Text;
                        LoadSession();

                    }
                    else
                    {
                        string transType = "Depreciation";
                        Session["CurrentTab"] = "Depreciation";

                        if ((lstEditAssetType.SelectedItem.Text.Equals("Heritage Assets")) ||
                            (lstEditAssetType.SelectedItem.Text.Equals("Property, Plant and Equipment") &&
                            lstEditCategory.SelectedItem.Text.Equals("Land") &&
                            (lstEditSubCategory.SelectedItem.Text.Equals("General Plant") ||
                            lstEditSubCategory.SelectedItem.Text.Equals("Distribution Plant"))
                            ) || lstEditMeasurementType.SelectedItem == null)
                        {
                            rwzTransactionList.WizardSteps[1].Active = true;
                            transType = "Impairment";
                            Session["CurrentTab"] = "Impairment";
                            rwzTransactionList.WizardSteps[0].ImageUrl = "";
                        }
                        else
                        {
                            rwzTransactionList.WizardSteps[0].Active = true;
                        }

                        Div_New.Visible = true;
                        BuildEdit(transType);
                        LoadSession();

                    }

                    break;
                case "Submit":
                    SaveSession();
                    ValidatePage();
                    Div_New.Visible = false;
                    break;

            }
        }




        protected void RadTabStrip1_TabClick(object sender, Telerik.Web.UI.RadTabStripEventArgs e)
        {
            SwitchTab(e.Tab.Value);
        }

        private void ValidatePage()
        {
            string msg = "";

            string imgYes = "~/img/KPITargetMet.png";
            string imgNo = "~/img/KPITargetMissed.png";


            if (Convert.ToInt32(lstEditAssetType.SelectedValue) <= 0)
                msg += "<B>Asset Type</B> is a required field.<BR>";
            if (lstEditCategory.Items.Count != 0 && Convert.ToInt32(lstEditCategory.SelectedValue) <= 0)
                msg += "<B>Asset Category</B> is a required field.<BR>";
            if (lstEditSubCategory.Items.Count != 0 && Convert.ToInt32(lstEditSubCategory.SelectedValue) <= 0)
                msg += "<B>Asset Sub Category</B> is a required field.<BR>";
            if (Convert.ToInt32(lstEditMeasurementType.SelectedValue) <= 0)
                msg += "<B>Measurement Type</B> is a required field.<BR>";
            if (Convert.ToInt32(lstEditStatus.SelectedValue) <= 0 && (lstEditStatus.Enabled))
                msg += "<B>Asset Status</B> is a required field.<BR>";
            if (msg != "")
                msg += "<BR>";

            string missingTabs = "";
            string missingData = "";

            foreach (RadWizardStep tab in rwzTransactionList.WizardSteps)
            {
                if (tab.Enabled)
                {
                    tab.ImageUrl = imgYes;
                    if (Session[tab.Title] == null)
                    {
                        missingTabs += $"<B>{tab.Title}</B> has not been poplated with any information.<BR>";
                        tab.ImageUrl = imgNo;
                    }
                    else
                    {
                        //   missingTabs += $"<B>{tab.Title}</B> has not been poplated with all the required information.<BR>";
                        List<KeyValuePair<string, KeyValuePair<string, string>>> items = (List<KeyValuePair<string, KeyValuePair<string, string>>>)Session[tab.Title];
                        foreach (KeyValuePair<string, KeyValuePair<string, string>> i in items)
                        {

                            if (tab.Title == "Disposal" && lblEditMeasurementType.Text == "Fair Value Module")
                            {
                                if (i.Key == "lstEditDebitItem11_1" ||
                                    i.Key == "lstEditDebitItem11_2" ||
                                    i.Key == "lstEditCreditItem12_1" ||
                                    i.Key == "lstEditDebitItem21_1" ||
                                    i.Key == "lstEditDebitItem21_2")
                                {
                                    // Nothing to do
                                }
                                else
                                {
                                    if (i.Value.Value == "" || i.Value.Value == "-1")
                                    {
                                        missingData += $"<B>{tab.Title} - {i.Value.Key}</B> is a required field.<BR>";
                                        tab.ImageUrl = imgNo;
                                    }
                                }
                            }
                            else
                            {
                                if (i.Value.Value == "" || i.Value.Value == "-1")
                                {
                                    missingData += $"<B>{tab.Title} - {i.Value.Key}</B> is a required field.<BR>";
                                    tab.ImageUrl = imgNo;
                                }
                            }
                        }
                    }
                }
            }
            if (missingTabs != "")
                missingTabs += "<BR>";

            msg += missingTabs + missingData;

            if (msg != "")
            {
                //  btnSave.Visible = false;
            }
            else
            {
                msg = "<B>mSCOA Transaction</B> is ready to save.";
                //  btnSave.Visible = true;
            }
            //divPopMessage.InnerHtml = msg;

        }

        protected void btnAddNew_Click(object sender, EventArgs e)
        {
            lblAddEdit.Text = "mSCOA Settings - Add";
            try
            {
                foreach (RadWizardStep tab in rwzTransactionList.WizardSteps)
                {
                    tab.ImageUrl = "";
                }
                lstEditCategory.Enabled = false;
                lstEditSubCategory.Enabled = false;
                // lstEditMeasurementType.Enabled = false;

                lstEditAssetType.SelectedIndex = 0;// ''.SelectedValue = "-1";                
                lstEditMeasurementType.SelectedIndex = 0;//.SelectedValue = "-1";
                lstEditStatus.SelectedIndex = 0;//.SelectedValue = "-1";
                lstEditCategory.SelectedIndex = 0;//.SelectedValue = "-1";

                lstEditSubCategory.SelectedIndex = 0;//.SelectedValue = "-1";

                wzMscoa.WizardSteps[1].Enabled = false;
                wzMscoa.WizardSteps[2].Enabled = false;

            }
            catch { }

            LoadPopUp();
            //Page.ClientScript.RegisterStartupScript(this.GetType(), "showeditpopup", "additem()", true);
            //divMain.Visible = false;
            //divPopup.Visible = true;
            ScriptManager.RegisterStartupScript(this, GetType(), "ShowGridDiv", "ShowGridDiv(false);", true);

            //   RadTabStrip1.SelectedIndex = 0;
            //  PageViewAssetDetails.Selected = true;
            //  divPopMessage.InnerHtml = "";

            hdnEditID.Value = "";

            wzMscoa.WizardSteps[0].Active = true;
            Div_New.Visible = false;

        }

        private void LoadPopUp()
        {

            Sebata.Business.Assets.Configuration.TransactionType confTransType = new Sebata.Business.Assets.Configuration.TransactionType(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);

            DataTable transactionT = confTransType.GetAll(null);

            foreach (DataRow r in transactionT.Rows)
            {
                Session.Remove(r["Name"].ToString());
            }
            transactionT.Dispose();
            confTransType = null;
            btnEditLoad.Style.Add(HtmlTextWriterStyle.Display, "none");


        }

        protected void btnNext1_Click(object sender, EventArgs e)
        {
            //RadTab currentTab = RadTabStrip1.SelectedTab;
            //RadTabStrip1.SelectedIndex = currentTab.Index + 1;

            //Telerik.Web.UI.RadTabStripEventArgs ee = new RadTabStripEventArgs(RadTabStrip1.Tabs[RadTabStrip1.SelectedIndex]);
            //RadTabStrip1_TabClick(sender, ee);

            ////SwitchTab(RadTabStrip1.SelectedTab.Value);
        }

        protected void btnSave_Click(object sender, EventArgs e)
        {

            int? AssetConfig_mSCOA_ID = null;
            if (hdnEditID.Value != "")
                AssetConfig_mSCOA_ID = Convert.ToInt32(hdnEditID.Value);

            List<Sebata.Business.Assets.Data.DataObject> transactiontypes = new List<Sebata.Business.Assets.Data.DataObject>();
            // foreach (RadTab rt in tabStripTransactionType.Tabs)

            foreach (RadWizardStep rt in rwzTransactionList.WizardSteps)
            {

                if (rt.Enabled)
                {
                    List<KeyValuePair<string, KeyValuePair<string, string>>> transaction = (List<KeyValuePair<string, KeyValuePair<string, string>>>)Session[rt.Title];
                    int? TransactionTypeID = Convert.ToInt32(rt.Index + 1);

                    //    int? Project11 = null, int? DebitItem11_1 = null, int? DebitItem11_2 = null, int? CreditItem11_1 = null
                    //, int? Project21 = null, int? DebitItem21_1 = null, int? DebitItem21_2 = null, int? CreditItem21_1 = null
                    //, int? Project12 = null, int? DebitItem12_1 = null, int? Project22 = null, int? DebitItem22_1 = null
                    //, int? Project13 = null, int? CreditItem13_1 = null, int? Project23 = null, int? CreditItem23_1 = null

                    int? Project11 = (transaction.FirstOrDefault(a => a.Key == "lstEditProject11").Value.Value.intSafe());
                    int? DebitItem11_1 = (transaction.FirstOrDefault(a => a.Key == "lstEditDebitItem11_1").Value.Value.intSafe());
                    int? DebitItem11_2 = (transaction.FirstOrDefault(a => a.Key == "lstEditDebitItem11_2").Value.Value.intSafe());
                    int? CreditItem11_1 = (transaction.FirstOrDefault(a => a.Key == "lstEditCreditItem11_1").Value.Value.intSafe());

                    int? Project21 = (transaction.FirstOrDefault(a => a.Key == "lstEditProject21").Value.Value.intSafe());
                    int? DebitItem21_1 = (transaction.FirstOrDefault(a => a.Key == "lstEditDebitItem21_1").Value.Value.intSafe());
                    int? DebitItem21_2 = (transaction.FirstOrDefault(a => a.Key == "lstEditDebitItem21_2").Value.Value.intSafe());
                    int? CreditItem21_1 = (transaction.FirstOrDefault(a => a.Key == "lstEditCreditItem21_1").Value.Value.intSafe());

                    int? Project12 = (transaction.FirstOrDefault(a => a.Key == "lstEditProject12").Value.Value.intSafe());
                    int? DebitItem12_1 = (transaction.FirstOrDefault(a => a.Key == "lstEditDebitItem12_1").Value.Value.intSafe());
                    int? CreditItem12_1 = (transaction.FirstOrDefault(a => a.Key == "lstEditCreditItem12_1").Value.Value.intSafe());

                    int? Project22 = (transaction.FirstOrDefault(a => a.Key == "lstEditProject22").Value.Value.intSafe());
                    int? DebitItem22_1 = (transaction.FirstOrDefault(a => a.Key == "lstEditDebitItem22_1").Value.Value.intSafe());

                    int? Project13 = (transaction.FirstOrDefault(a => a.Key == "lstEditProject13").Value.Value.intSafe());
                    int? CreditItem13_1 = (transaction.FirstOrDefault(a => a.Key == "lstEditCreditItem13_1").Value.Value.intSafe());

                    int? Project23 = (transaction.FirstOrDefault(a => a.Key == "lstEditProject23").Value.Value.intSafe());
                    int? CreditItem23_1 = (transaction.FirstOrDefault(a => a.Key == "lstEditCreditItem23_1").Value.Value.intSafe());

                    TransactionTypeID = TransactionTypeID == 0 ? null : TransactionTypeID;

                    Project11 = Project11 == 0 ? null : Project11;
                    DebitItem11_1 = DebitItem11_1 == 0 ? null : DebitItem11_1;
                    DebitItem11_2 = DebitItem11_2 == 0 ? null : DebitItem11_2;
                    CreditItem11_1 = CreditItem11_1 == 0 ? null : CreditItem11_1;

                    Project21 = Project21 == 0 ? null : Project21;
                    DebitItem21_1 = DebitItem21_1 == 0 ? null : DebitItem21_1;
                    DebitItem21_2 = DebitItem21_2 == 0 ? null : DebitItem21_2;
                    CreditItem21_1 = CreditItem21_1 == 0 ? null : CreditItem21_1;

                    Project12 = Project12 == 0 ? null : Project12;
                    DebitItem12_1 = DebitItem12_1 == 0 ? null : DebitItem12_1;

                    Project22 = Project22 == 0 ? null : Project22;
                    DebitItem22_1 = DebitItem22_1 == 0 ? null : DebitItem22_1;

                    Project13 = Project13 == 0 ? null : Project13;
                    CreditItem13_1 = CreditItem13_1 == 0 ? null : CreditItem13_1;

                    Project23 = Project23 == 0 ? null : Project23;
                    CreditItem23_1 = CreditItem23_1 == 0 ? null : CreditItem23_1;

                    Sebata.Business.Assets.Data.DataObject dobj = _configmSCOA.CreateTransactionType(TransactionTypeID
                        , Project11, DebitItem11_1, DebitItem11_2, CreditItem11_1
                        , Project21, DebitItem21_1, DebitItem21_2, CreditItem21_1
                        , Project12, DebitItem12_1, CreditItem12_1, Project22, DebitItem22_1
                        , Project13, CreditItem13_1, Project23, CreditItem23_1
                        );

                    transactiontypes.Add(dobj);
                }
            }

            int? CategoryID = null;
            int? SubCategoryID = null;
            int? StatusID = null;

            if (lstEditCategory.SelectedValue == null || lstEditCategory.SelectedValue != "")
                CategoryID = Convert.ToInt32(lstEditCategory.SelectedValue);
            if (lstEditSubCategory.SelectedValue == null || lstEditSubCategory.SelectedValue != "")
                SubCategoryID = Convert.ToInt32(lstEditSubCategory.SelectedValue);
            if (lstEditStatus.SelectedValue != "-1" && lstEditStatus.SelectedValue != "")
                StatusID = Convert.ToInt32(lstEditStatus.SelectedValue);

            int SaveRsult = _configmSCOA.Save(ref AssetConfig_mSCOA_ID, lblFinYear.Text, Convert.ToInt32(lstEditAssetType.SelectedValue)
                , CategoryID, SubCategoryID, Convert.ToInt32(lstEditMeasurementType.SelectedValue)
                , StatusID, transactiontypes);

            string msg = "";

            switch (SaveRsult)
            {
                case 0:
                    //Save Failed
                    msg = "Could not save the mSCOA Setting due to an unforseen error: " + _configmSCOA.Error.Message;
                    break;
                case 1:
                    //Save Success

                    if (AssetConfig_mSCOA_ID == null)
                        msg = "mSCOA Setting Saved Successfully.";
                    else
                        msg = "mSCOA Setting Successfully Updated";
                    //divMain.Visible = true;
                    //divPopup.Visible = false;
                    ScriptManager.RegisterStartupScript(this, GetType(), "ShowGridDiv", "ShowGridDiv(true);", true);

                    if (gridSCOA.Visible)
                        PopulateGrid(true);
                    break;

                    break;
                case 2:
                    //Save Failed: Duplicate
                    msg = "The mSCOA Setting already exists.";
                    break;
                case 3:
                    //Save Failed: Default 
                    msg = "Could not save the mSCOA Setting: System mSCOA Setting cannot be changed.";
                    break;
            }

            //lblEditMessage.Text = msg;
            ////Page.ClientScript.RegisterStartupScript(this.GetType(), "showmessage", "<script Class='text/javascript'>showmessage();</script>");

            //ScriptManager.RegisterStartupScript(this.Page, typeof(Page), "showmsgpopup", $"showmessage('{msg}')", true);
            ////Page.ClientScript.RegisterStartupScript(this.GetType(), "showmsgpopup", "showmessage()", true);

            ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", "ShowUpdated('" + msg + "');", true);
        }

        protected void btnMessageOK_Click(object sender, EventArgs e)
        {
            if (gridSCOA.Visible)
                btnSearch_Click(null, null);
            else
                ScriptManager.RegisterStartupScript(this.Page, this.GetType(), "hidemsgpopup", "hidepopup()", true);
        }

        protected void btnEditLoad_Click(object sender, EventArgs e)
        {
            //hdnEditID
            if (hdnEditID.Value != "")
            {
                LoadPopUp();
                // load the data
                DataTable msCoaT = _configmSCOA.Get(Convert.ToInt32(hdnEditID.Value));
                if (msCoaT != null && msCoaT.Rows.Count > 0)
                {
                    DataRow mscoaR = msCoaT.Rows[0];

                    lstEditAssetType.SelectedValue = mscoaR["TypeID"].ToString().TrimEnd();
                    lstEditAssetType_SelectedIndexChanged(null, null);
                    if (lstEditCategory.Items.Count > 0)
                    {
                        lstEditCategory.SelectedValue = mscoaR["CategoryID"].ToString().TrimEnd();
                        lstEditCategory_SelectedIndexChanged(null, null);
                    }
                    if (lstEditSubCategory.Items.Count > 0)
                    {
                        try
                        {
                            lstEditSubCategory.SelectedValue = mscoaR["SubCategoryID"].ToString().TrimEnd();
                        }
                        catch { }
                    }
                    if (lstEditStatus.Items.Count > 0)
                        if (mscoaR["StatusID"].ToString() != "")
                            try
                            {
                                lstEditStatus.SelectedValue = mscoaR["StatusID"].ToString().TrimEnd();
                            }
                            catch
                            {
                                lstEditStatus.SelectedIndex = 0;
                            }
                    try
                    {
                        lstEditMeasurementType.SelectedValue = mscoaR["MeasurementTypeID"].ToString().TrimEnd();
                    }
                    catch { }

                    // Load tabs first
                    if(lstEditMeasurementType.SelectedItem != null)
                    lblEditMeasurementType.Text = lstEditMeasurementType.SelectedItem.Text;
                    EnableTabs();
                    CheckHerritageAndPPESpesificEnableTabs();




                    //load the child items
                    DataTable transactiontypes = _configmSCOA.GetTransactionTypes(Convert.ToInt32(hdnEditID.Value));

                    //foreach (RadTab tab in tabStripTransactionType.Tabs)
                    //{
                    //    Session[tab.Text] = null;
                    //}

                    foreach (RadWizardStep tab in rwzTransactionList.WizardSteps)
                    {
                        Session[tab.Title] = null;
                    }

                    foreach (DataRow row in transactiontypes.Rows)
                    {
                        int TransactionTypeID = Convert.ToInt32(row["TransactionTypeID"].ToString().TrimEnd());
                        string TransactionTypeName = row["TransactionTypeName"].ToString().TrimEnd();

                        List<KeyValuePair<string, KeyValuePair<string, string>>> items = new List<KeyValuePair<string, KeyValuePair<string, string>>>();

                        KeyValuePair<string, KeyValuePair<string, string>> i;

                        foreach (DataColumn c in transactiontypes.Columns)
                        {
                            if ((c.ColumnName.Contains("1") || c.ColumnName.Contains("2")) && !c.ColumnName.Contains("DisplayName"))
                            {
                                if (row[c.ColumnName] != null)
                                {
                                    i = new KeyValuePair<string, KeyValuePair<string, string>>($"lstEdit{c.ColumnName}", new KeyValuePair<string, string>("", row[c.ColumnName].ToString().TrimEnd()));
                                    items.Add(i);
                                }
                            }
                        }

                        Session[TransactionTypeName] = items;
                    }

                }

                //  RadTabStrip1.SelectedIndex = 0;
                //  PageViewAssetDetails.Selected = true;
            }
        }

        static DateTime today;
        protected void btnUploadFile_Click(object sender, EventArgs e)
        {
            //string filepath = "";

            string filename = Session["AssetUploadedFile"].ToString();
            string filepath = CommonTasks.GetfullPath("FolderAssetDocuments");
            filepath = string.Format("{0}{1}", filepath, filename);

            int result = 0;
            today = DateTime.Now;

            if (filepath != "")//(FileUpload1.HasFile == true)
            {


                string[] FileExt = filename.Split('.');
                string FileEx = FileExt[FileExt.Length - 1];

                switch (FileEx.ToLower())
                {
                    case "csv":
                    case "xls":
                        //case "xlsx":
                        break;
                    default:

                        string msg = "File Is Not A CSV File. Please Upload A File With A CSV or XLS Extension.";
                        ScriptManager.RegisterStartupScript(this, GetType(), "btnNextselected", "ShowUpdated('" + msg + "');", true);
                        return;
                        break;
                }

                DataTable gridData = null;
                try
                {
                    switch (FileEx.ToLower())
                    {
                        case "xls":
                            //case "xlsx":
                            gridData = DAL.XLSDataReader.ReadExcelFile(filepath);
                            break;
                        default: //csv

                            break;
                    }
                    Sebata.Business.Assets.Configuration.mScoaUpload configUpload = new Sebata.Business.Assets.Configuration.mScoaUpload(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);
                    result = configUpload.Upload(filepath, lstFinYear.Text, today, gridData);

                    if (result != -1)
                    {
                        gridData = null;
                        gridData = _configmSCOA.GetUploadReport(filename, today);
                        gridUploadResult.DataSource = gridData;
                        gridUploadResult.DataBind();
                    }
                    if (result == -1)
                    {
                        lblResultMsg.Text = "Invalid file uploaded.";
                        gridUploadResult.Visible = false;
                    }
                    else if (result == 0)
                    {
                        //nothing / error.
                        lblResultMsg.Text = "Errors where encountered during the upload.";
                        gridUploadResult.Visible = true;
                    }
                    else
                    {
                        //success
                        lblResultMsg.Text = "Bulk Upload of Asset mSCOA Settings Saved Successfully";
                        gridUploadResult.Visible = false;
                        //

                    }
                    ScriptManager.RegisterStartupScript(this.Page, GetType(), "uploadfileselected", "ShowResult();", true);

                }
                catch (Exception ex)
                {
                    Common.CommonTasks.ErrorMsgSettings(ex, System.Reflection.MethodBase.GetCurrentMethod().Name.ToString(), moduleName, pageName, mySession.Current.User_ID, divMessage, lblMessage);
                    return;
                }

            }
        }

        protected void lstEditDebitItem11_1_SelectedIndexChanged(object sender, EventArgs e)
        {
            int Err = 0;
            lstEditDebitItem11_1.ToolTip = lstEditDebitItem11_1.SelectedItem == null ? "" : lstEditDebitItem11_1.SelectedItem.ToString();

            DataRow dr = _configmSCOA.GetSCOAdescriptions(lblFinYear.Text, lstEditProject11.SelectedValue.intSafe(), lstEditDebitItem11_1.SelectedValue.intSafe(), out Err);
            if (dr != null)
            {
                lblEditSCOAItemCode11.Text = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund11.Text = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction11.Text = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost11.Text = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion11.Text = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject11.Text = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification11.Text = dr["MunicipalClassification"].ToString();
                lblEditSCOAItemCode11.ToolTip = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund11.ToolTip = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction11.ToolTip = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost11.ToolTip = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion11.ToolTip = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject11.ToolTip = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification11.ToolTip = dr["MunicipalClassification"].ToString();
            }
            if (Err != 0)
            {
                ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", "ShowUpdated('System encountered a problem. Please contact support');", true);
            }
        }

        protected void lstEditCreditItem11_1_SelectedIndexChanged(object sender, EventArgs e)
        {

            lstEditCreditItem11_1.ToolTip = lstEditCreditItem11_1.SelectedItem == null ? "" : lstEditCreditItem11_1.SelectedItem.ToString();
            int Err = 0;
            DataRow dr = _configmSCOA.GetSCOAdescriptions(lblFinYear.Text, lstEditProject14.SelectedValue.intSafe(), lstEditCreditItem11_1.SelectedValue.intSafe(), out Err);
            if (dr != null)
            {
                lblEditSCOAItemCode14.Text = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund14.Text = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction14.Text = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost14.Text = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion14.Text = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject14.Text = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification14.Text = dr["MunicipalClassification"].ToString();
                lblEditSCOAItemCode14.ToolTip = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund14.ToolTip = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction14.ToolTip = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost14.ToolTip = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion14.ToolTip = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject14.ToolTip = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification14.ToolTip = dr["MunicipalClassification"].ToString();
            }
        }

        protected void lstEditDebitItem21_1_SelectedIndexChanged(object sender, EventArgs e)
        {

            lstEditDebitItem12_1.ToolTip = lstEditDebitItem21_1.SelectedItem == null ? "" : lstEditDebitItem21_1.SelectedItem.ToString();
            int Err = 0;
            DataRow dr = _configmSCOA.GetSCOAdescriptions(lblFinYear.Text, lstEditProject21.SelectedValue.intSafe(), lstEditDebitItem21_1.SelectedValue.intSafe(), out Err);
            if (dr != null)
            {
                lblEditSCOAItemCode21.Text = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund21.Text = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction21.Text = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost21.Text = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion21.Text = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject21.Text = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification21.Text = dr["MunicipalClassification"].ToString();
                lblEditSCOAItemCode21.ToolTip = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund21.ToolTip = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction21.ToolTip = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost21.ToolTip = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion21.ToolTip = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject21.ToolTip = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification21.ToolTip = dr["MunicipalClassification"].ToString();
            }
        }

        protected void lstEditCreditItem21_1_SelectedIndexChanged(object sender, EventArgs e)
        {

            lstEditCreditItem21_1.ToolTip = lstEditCreditItem21_1.SelectedItem == null ? "" : lstEditCreditItem21_1.SelectedItem.ToString();

            int Err = 0;
            DataRow dr = _configmSCOA.GetSCOAdescriptions(lblFinYear.Text, lstEditProject24.SelectedValue.intSafe(), lstEditCreditItem21_1.SelectedValue.intSafe(), out Err);

            if (dr != null)
            {
                lblEditSCOAItemCode24.Text = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund24.Text = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction24.Text = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost24.Text = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion24.Text = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject24.Text = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification24.Text = dr["MunicipalClassification"].ToString();
                lblEditSCOAItemCode24.ToolTip = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund24.ToolTip = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction24.ToolTip = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost24.ToolTip = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion24.ToolTip = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject24.ToolTip = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification24.ToolTip = dr["MunicipalClassification"].ToString();
            }

        }



        protected void lstEditCreditItem12_1_SelectedIndexChanged(object sender, EventArgs e)
        {

            lstEditCreditItem12_1.ToolTip = lstEditCreditItem12_1.SelectedItem == null ? "" : lstEditCreditItem12_1.SelectedItem.ToString();

            int Err = 0;
            DataRow dr = _configmSCOA.GetSCOAdescriptions(lblFinYear.Text, lstEditProject12.SelectedValue.intSafe(), lstEditCreditItem12_1.SelectedValue.intSafe(), out Err);
            if (dr != null)
            {
                lblEditSCOAItemCode12.Text = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund12.Text = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction12.Text = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost12.Text = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion12.Text = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject12.Text = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification12.Text = dr["MunicipalClassification"].ToString();
                lblEditSCOAItemCode12.ToolTip = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund12.ToolTip = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction12.ToolTip = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost12.ToolTip = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion12.ToolTip = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject12.ToolTip = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification12.ToolTip = dr["MunicipalClassification"].ToString();
            }
        }

        protected void lstEditDebitItem22_1_SelectedIndexChanged(object sender, EventArgs e)
        {

            lstEditDebitItem22_1.ToolTip = lstEditDebitItem22_1.SelectedItem == null ? "" : lstEditDebitItem22_1.SelectedItem.ToString();
            int Err = 0;
            DataRow dr = _configmSCOA.GetSCOAdescriptions(lblFinYear.Text, lstEditProject22.SelectedValue.intSafe(), lstEditDebitItem22_1.SelectedValue.intSafe(), out Err);
            if (dr != null)
            {
                lblEditSCOAItemCode22.Text = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund22.Text = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction22.Text = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost22.Text = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion22.Text = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject22.Text = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification22.Text = dr["MunicipalClassification"].ToString();
                lblEditSCOAItemCode22.ToolTip = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund22.ToolTip = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction22.ToolTip = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost22.ToolTip = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion22.ToolTip = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject22.ToolTip = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification22.ToolTip = dr["MunicipalClassification"].ToString();
            }
        }

        protected void lstEditCreditItem13_1_SelectedIndexChanged(object sender, EventArgs e)
        {

            lstEditCreditItem13_1.ToolTip = lstEditCreditItem13_1.SelectedItem == null ? "" : lstEditCreditItem13_1.SelectedItem.ToString();

            int Err = 0;
            DataRow dr = _configmSCOA.GetSCOAdescriptions(lblFinYear.Text, lstEditProject13.SelectedValue.intSafe(), lstEditCreditItem13_1.SelectedValue.intSafe(), out Err);
            if (dr != null)
            {
                lblEditSCOAItemCode13.Text = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund13.Text = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction13.Text = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost13.Text = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion13.Text = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject13.Text = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification13.Text = dr["MunicipalClassification"].ToString();
                lblEditSCOAItemCode13.ToolTip = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund13.ToolTip = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction13.ToolTip = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost13.ToolTip = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion13.ToolTip = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject13.ToolTip = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification13.ToolTip = dr["MunicipalClassification"].ToString();
            }
        }

        protected void lstEditCreditItem23_1_SelectedIndexChanged(object sender, EventArgs e)
        {

            lstEditCreditItem23_1.ToolTip = lstEditCreditItem23_1.SelectedItem == null ? "" : lstEditCreditItem23_1.SelectedItem.ToString();

            int Err = 0;
            DataRow dr = _configmSCOA.GetSCOAdescriptions(lblFinYear.Text, lstEditProject23.SelectedValue.intSafe(), lstEditCreditItem23_1.SelectedValue.intSafe(), out Err);
            if (dr != null)
            {
                lblEditSCOAItemCode23.Text = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund23.Text = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction23.Text = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost23.Text = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion23.Text = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject23.Text = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification23.Text = dr["MunicipalClassification"].ToString();
                lblEditSCOAItemCode23.ToolTip = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund23.ToolTip = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction23.ToolTip = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost23.ToolTip = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion23.ToolTip = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject23.ToolTip = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification23.ToolTip = dr["MunicipalClassification"].ToString();
            }
        }

        protected void lstEditDebitItem12_1_SelectedIndexChanged(object sender, EventArgs e)
        {
            lstEditDebitItem12_1.ToolTip = lstEditDebitItem12_1.SelectedItem == null ? "" : lstEditDebitItem12_1.SelectedItem.ToString();
            int Err = 0;
            DataRow dr = _configmSCOA.GetSCOAdescriptions(lblFinYear.Text, lstEditProject12.SelectedValue.intSafe(), lstEditDebitItem12_1.SelectedValue.intSafe(), out Err);
            if (dr != null)
            {
                lblEditSCOAItemCode12.Text = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund12.Text = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction12.Text = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost12.Text = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion12.Text = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject12.Text = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification12.Text = dr["MunicipalClassification"].ToString();
                lblEditSCOAItemCode12.ToolTip = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund12.ToolTip = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction12.ToolTip = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost12.ToolTip = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion12.ToolTip = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject12.ToolTip = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification12.ToolTip = dr["MunicipalClassification"].ToString();
            }
        }

        protected void gridSCOA_SelectedIndexChanged(object sender, EventArgs e)
        {
            try
            {
                lblEditSubCategory.Text = gridSCOA.SelectedItems[0].Cells[10].Text.ToString();
                lblAddEdit.Text = "mSCOA Settings - Edit";
                var selecteditem = gridSCOA.SelectedItems[0];
                var cell = selecteditem.Cells[2];// "ID");
                hdnEditID.Value = cell.Text;



                //divMain.Visible = false;
                //divPopup.Visible = true;
                ScriptManager.RegisterStartupScript(this, GetType(), "ShowGridDiv", "ShowGridDiv(false);", true);

                //lblEditAssetType.Visible = false;
                //lstEditAssetType.Visible = false;
                //lblEditCategory.Visible = false;
                //lstEditCategory.Visible = false;

                btnEditLoad_Click(null, null);
                btnEditLoad.Visible = false;

                // 
                wzMscoa.WizardSteps[0].Active = true;
                Div_New.Visible = false;

                foreach (RadWizardStep tab in rwzTransactionList.WizardSteps)
                {
                    tab.ImageUrl = "";
                }
                foreach (RadWizardStep tab in rwzTransactionList.WizardSteps)
                {
                    tab.ImageUrl = "";
                }
                wzMscoa.WizardSteps[1].Enabled = true;
                //       wzMscoa.WizardSteps[2].Enabled = false;
                //       wzMscoa.WizardSteps[2].Visible = false;
            }
            catch { }
        }

        protected void btnCancel_Click(object sender, EventArgs e)
        {
            PopulateGrid(true);

            //divMain.Visible = true;
            //divPopup.Visible = false;
            ScriptManager.RegisterStartupScript(this, GetType(), "ShowGridDiv", "ShowGridDiv(true);", true);


        }

        protected void btnUpload_Click(object sender, EventArgs e)
        {
            //divMain.Visible = false;
            //divPopUpload.Visible = true;
            ScriptManager.RegisterStartupScript(this, GetType(), "ShowUploadDiv", "ShowUploadDiv(true);", true);
        }

        protected void btnUploadCancel_Click(object sender, EventArgs e)
        {
            //divMain.Visible = true;
            //divPopUpload.Visible = false;
            ScriptManager.RegisterStartupScript(this, GetType(), "ShowUploadDiv", "ShowUploadDiv(false);", true);
        }

        protected void btnSavePage_Click(object sender, EventArgs e)
        {
            string imgYes = "~/img/KPITargetMet.png";
            string imgNo = "~/img/KPITargetMissed.png";

            SaveSession();
            string ValMsg = ValidateSingleTabPage();

            if (ValMsg == "ok")
            {

                // Set thumbs Up
                rwzTransactionList.ActiveStep.ImageUrl = imgYes;

                int? AssetConfig_mSCOA_ID = null;
                if (hdnEditID.Value != "")
                    AssetConfig_mSCOA_ID = Convert.ToInt32(hdnEditID.Value);

                List<Sebata.Business.Assets.Data.DataObject> transactiontypes = new List<Sebata.Business.Assets.Data.DataObject>();
                //RadTab rt = tabStripTransactionType.SelectedTab;


                string rTitle = rwzTransactionList.ActiveStep.Title;

                Sebata.Business.Assets.Configuration.TransactionType confTransType = new Sebata.Business.Assets.Configuration.TransactionType(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);
                DataTable transactionT = confTransType.Get(rTitle);
                DataRow transactionR = transactionT.Rows[0];

                int rValue = Convert.ToInt32(transactionR["AssetConfig_TransactionType_ID"].ToString());
                transactionR = null;
                transactionT = null;

                List<KeyValuePair<string, KeyValuePair<string, string>>> transaction = (List<KeyValuePair<string, KeyValuePair<string, string>>>)Session[rTitle];//Session[rt.Text];
                int? TransactionTypeID = Convert.ToInt32(rValue);// Convert.ToInt32(rt.Value);

                int? Project11 = (transaction.FirstOrDefault(a => a.Key == "lstEditProject11").Value.Value.intSafe());
                int? DebitItem11_1 = (transaction.FirstOrDefault(a => a.Key == "lstEditDebitItem11_1").Value.Value.intSafe());
                // int? DebitItem11_2 = (transaction.FirstOrDefault(a => a.Key == "lstEditDebitItem11_2").Value.Value.intSafe());

                int? Project14 = (transaction.FirstOrDefault(a => a.Key == "lstEditProject14").Value.Value.intSafe());
                int? CreditItem11_1 = (transaction.FirstOrDefault(a => a.Key == "lstEditCreditItem11_1").Value.Value.intSafe());

                int? Project21 = (transaction.FirstOrDefault(a => a.Key == "lstEditProject21").Value.Value.intSafe());
                int? DebitItem21_1 = (transaction.FirstOrDefault(a => a.Key == "lstEditDebitItem21_1").Value.Value.intSafe());
                // int? DebitItem21_2 = (transaction.FirstOrDefault(a => a.Key == "lstEditDebitItem21_2").Value.Value.intSafe());

                int? Project24 = (transaction.FirstOrDefault(a => a.Key == "lstEditProject24").Value.Value.intSafe());
                int? CreditItem21_1 = (transaction.FirstOrDefault(a => a.Key == "lstEditCreditItem21_1").Value.Value.intSafe());

                int? Project12 = (transaction.FirstOrDefault(a => a.Key == "lstEditProject12").Value.Value.intSafe());
                int? DebitItem12_1 = (transaction.FirstOrDefault(a => a.Key == "lstEditDebitItem12_1").Value.Value.intSafe());
                int? CreditItem12_1 = (transaction.FirstOrDefault(a => a.Key == "lstEditCreditItem12_1").Value.Value.intSafe());

                int? Project22 = (transaction.FirstOrDefault(a => a.Key == "lstEditProject22").Value.Value.intSafe());
                int? DebitItem22_1 = (transaction.FirstOrDefault(a => a.Key == "lstEditDebitItem22_1").Value.Value.intSafe());

                int? Project13 = (transaction.FirstOrDefault(a => a.Key == "lstEditProject13").Value.Value.intSafe());
                int? CreditItem13_1 = (transaction.FirstOrDefault(a => a.Key == "lstEditCreditItem13_1").Value.Value.intSafe());

                int? Project23 = (transaction.FirstOrDefault(a => a.Key == "lstEditProject23").Value.Value.intSafe());
                int? CreditItem23_1 = (transaction.FirstOrDefault(a => a.Key == "lstEditCreditItem23_1").Value.Value.intSafe());

                int? Project15 = (transaction.FirstOrDefault(a => a.Key == "lstEditProject15").Value.Value.intSafe());
                int? DebitItem11_2 = (transaction.FirstOrDefault(a => a.Key == "lstEditDebitItem11_2").Value.Value.intSafe());

                int? Project25 = (transaction.FirstOrDefault(a => a.Key == "lstEditProject25").Value.Value.intSafe());
                int? DebitItem21_2 = (transaction.FirstOrDefault(a => a.Key == "lstEditDebitItem21_2").Value.Value.intSafe());



                TransactionTypeID = TransactionTypeID == 0 ? null : TransactionTypeID;

                Project11 = Project11 == 0 ? null : Project11;
                DebitItem11_1 = DebitItem11_1 == 0 ? null : DebitItem11_1;
                DebitItem11_2 = DebitItem11_2 == 0 ? null : DebitItem11_2;

                Project14 = Project14 == 0 ? null : Project14;
                CreditItem11_1 = CreditItem11_1 == 0 ? null : CreditItem11_1;

                Project21 = Project21 == 0 ? null : Project21;
                DebitItem21_1 = DebitItem21_1 == 0 ? null : DebitItem21_1;
                DebitItem21_2 = DebitItem21_2 == 0 ? null : DebitItem21_2;

                Project24 = Project24 == 0 ? null : Project24;
                CreditItem21_1 = CreditItem21_1 == 0 ? null : CreditItem21_1;

                Project12 = Project12 == 0 ? null : Project12;
                DebitItem12_1 = DebitItem12_1 == 0 ? null : DebitItem12_1;

                Project22 = Project22 == 0 ? null : Project22;
                DebitItem22_1 = DebitItem22_1 == 0 ? null : DebitItem22_1;

                Project13 = Project13 == 0 ? null : Project13;
                CreditItem13_1 = CreditItem13_1 == 0 ? null : CreditItem13_1;

                Project23 = Project23 == 0 ? null : Project23;
                CreditItem23_1 = CreditItem23_1 == 0 ? null : CreditItem23_1;

                Sebata.Business.Assets.Data.DataObject dobj = _configmSCOA.CreateTransactionType(TransactionTypeID, AssetConfig_mSCOA_ID
                    , Project11, DebitItem11_1, DebitItem11_2, CreditItem11_1
                    , Project21, DebitItem21_1, DebitItem21_2, CreditItem21_1
                    , Project12, DebitItem12_1, CreditItem12_1, Project22, DebitItem22_1
                    , Project13, CreditItem13_1, Project23, CreditItem23_1
                    , Project14, Project24, Project15, Project25);

                transactiontypes.Add(dobj);

                int? CategoryID = null;
                int? SubCategoryID = null;
                int? StatusID = null;
                int? MeasurementTypeID = null;
                if (lstEditCategory.SelectedValue == null || lstEditCategory.SelectedValue != "")
                    CategoryID = Convert.ToInt32(lstEditCategory.SelectedValue);
                if (lstEditSubCategory.SelectedValue == null || lstEditSubCategory.SelectedValue != "")
                    SubCategoryID = Convert.ToInt32(lstEditSubCategory.SelectedValue);
                if (lstEditStatus.SelectedValue != "-1" && lstEditStatus.SelectedValue != "")
                    StatusID = Convert.ToInt32(lstEditStatus.SelectedValue);
                if (lstEditMeasurementType.SelectedValue != "-1" && lstEditMeasurementType.SelectedValue != "")
                    MeasurementTypeID = Convert.ToInt32(lstEditMeasurementType.SelectedValue);

                int SaveRsult = _configmSCOA.Save(ref AssetConfig_mSCOA_ID, lblFinYear.Text, Convert.ToInt32(lstEditAssetType.SelectedValue)
                    , CategoryID, SubCategoryID, MeasurementTypeID
                    , StatusID, transactiontypes);

                if (SaveRsult != 0)
                {
                    //_configmSCOASegments.Save(null,lblFinYear.Text, Project11, DebitItem11_1, )
                }

                string msg = "";

                switch (SaveRsult)
                {
                    case 0:
                        //Save Failed
                        msg = "Could not save the mSCOA Setting due to an unforseen error: " + _configmSCOA.Error.Message;
                        break;
                    case 1:
                        //Save Success

                        if (AssetConfig_mSCOA_ID == null)
                            msg = "mSCOA Setting Saved Successfully.";
                        else
                            msg = "mSCOA Setting Successfully Updated";
                        //     divMain.Visible = true;
                        //     divPopup.Visible = false;
                        //     if (gridSCOA.Visible)
                        //         PopulateGrid(true);
                        break;

                        break;
                    case 2:
                        //Save Failed: Duplicate
                        //   msg = "The mSCOA Setting already exists.";
                        msg = "";
                        break;
                    case 3:
                        //Save Failed: Default 
                        msg = "Could not save the mSCOA Setting: System mSCOA Setting cannot be changed.";
                        break;
                }
                //Page.ClientScript.RegisterStartupScript(GetType(), "classupdated", "ShowUpdated('" + msg + "');", true);
                ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", "ShowUpdated('" + msg + "');", true);
            }
            else
            {
                rwzTransactionList.ActiveStep.ImageUrl = imgNo;
                ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", "ShowUpdated('" + ValMsg + "');", true);
            }
        }


        private string ValidateSingleTabPage()
        {
            string msg = "";

            if (Convert.ToInt32(lstEditAssetType.SelectedValue) <= 0)
                msg += "<B>Asset Type</B> is a required field.<BR>";
            if (lstEditCategory.Items.Count != 0 && Convert.ToInt32(lstEditCategory.SelectedValue) <= 0)
                msg += "<B>Asset Category</B> is a required field.<BR>";
            if (lstEditSubCategory.Items.Count != 0 && Convert.ToInt32(lstEditSubCategory.SelectedValue) <= 0)
                msg += "<B>Asset Sub Category</B> is a required field.<BR>";
            //if (Convert.ToInt32(lstEditMeasurementType.SelectedValue) <= 0)
            //    msg += "<B>Measurement Type</B> is a required field.<BR>";
            if (Convert.ToInt32(lstEditStatus.SelectedValue) <= 0 && (lstEditStatus.Enabled))
                msg += "<B>Asset Status</B> is a required field.<BR>";
            if (msg != "")
                msg += "<BR>";

            string missingTabs = "";
            string missingData = "";

            //Telerik.Web.UI.RadTab tab = tabStripTransactionType.SelectedTab;

            string rTitle = rwzTransactionList.ActiveStep.Title;
            int rValue = rwzTransactionList.ActiveStepIndex + 1;

            //if (Session[tab.Text] == null)
            if (Session[rTitle] == null)
                missingTabs += $"<B>{rTitle}</B> has not been poplated with any information.<BR>";
            else
            {
                List<KeyValuePair<string, KeyValuePair<string, string>>> items = (List<KeyValuePair<string, KeyValuePair<string, string>>>)Session[rTitle];
                foreach (KeyValuePair<string, KeyValuePair<string, string>> i in items)
                {
                    if (rTitle == "Disposal" && lblEditMeasurementType.Text == "Fair Value Module")
                    {
                        if (i.Key == "lstEditDebitItem11_1" ||
                            i.Key == "lstEditDebitItem11_2" ||
                            i.Key == "lstEditProject11" ||
                            i.Key == "lstEditProject21" ||
                             i.Key == "lstEditProject15" ||
                            i.Key == "lstEditProject25" ||
                            i.Key == "lstEditCreditItem12_1" ||
                            i.Key == "lstEditDebitItem21_1" ||
                            i.Key == "lstEditDebitItem21_2")
                        {
                            // Nothing to do
                        }
                        else
                        {
                            if (i.Value.Value == "" || i.Value.Value == "-1")
                                missingData += $"<B>{rTitle} - {i.Value.Key}</B> is a required field.<BR>";
                        }
                    }
                    else
                    {
                        if (rTitle == "Disposal" && rwzTransactionList.WizardSteps[0].Active == false)
                        {
                            if (i.Key == "lstEditDebitItem11_1" ||
                                i.Key == "lstEditDebitItem21_1" ||
                                i.Key == "lstEditProject11" ||
                                i.Key == "lstEditProject21")
                            {
                                // Do Nothing
                            }
                            else
                            {

                                if (i.Value.Value == "" || i.Value.Value == "-1")
                                    missingData += $"<B>{rTitle} - {i.Value.Key}</B> is a required field.<BR>";
                            }
                        }
                        else
                        {
                            if (i.Value.Value == "" || i.Value.Value == "-1")
                                missingData += $"<B>{rTitle} - {i.Value.Key}</B> is a required field.<BR>";
                        }
                    }
                }
            }

            if (missingTabs != "")
                missingTabs += "<BR>";

            msg += missingTabs + missingData;

            if (msg == "") msg = "ok";
            //{
            //    btnSave.Visible = false;
            //}
            //else
            //{
            //    msg = "ok";
            //    btnSave.Visible = true;
            //}
            return msg;
        }





        private string ValidateSingleTabPageOnChange()
        {
            string msg = "";

            if (Convert.ToInt32(lstEditAssetType.SelectedValue) <= 0)
                msg += "<B>Asset Type</B> is a required field.<BR>";
            if (lstEditCategory.Items.Count != 0 && Convert.ToInt32(lstEditCategory.SelectedValue) <= 0)
                msg += "<B>Asset Category</B> is a required field.<BR>";
            if (lstEditSubCategory.Items.Count != 0 && Convert.ToInt32(lstEditSubCategory.SelectedValue) <= 0)
                msg += "<B>Asset Sub Category</B> is a required field.<BR>";
            //if (Convert.ToInt32(lstEditMeasurementType.SelectedValue) <= 0)
            //    msg += "<B>Measurement Type</B> is a required field.<BR>";
            if (Convert.ToInt32(lstEditStatus.SelectedValue) <= 0 && (lstEditStatus.Enabled))
                msg += "<B>Asset Status</B> is a required field.<BR>";
            if (msg != "")
                msg += "<BR>";

            string missingTabs = "";
            string missingData = "";

            //Telerik.Web.UI.RadTab tab = tabStripTransactionType.SelectedTab;

            rwzTransactionList.WizardSteps[0].Active = true;


            string rTitle = rwzTransactionList.ActiveStep.Title;
            int rValue = rwzTransactionList.ActiveStepIndex + 1;

            //if (Session[tab.Text] == null)
            if (Session[rTitle] == null)
                missingTabs += $"<B>{rTitle}</B> has not been poplated with any information.<BR>";
            else
            {
                List<KeyValuePair<string, KeyValuePair<string, string>>> items = (List<KeyValuePair<string, KeyValuePair<string, string>>>)Session[rTitle];
                foreach (KeyValuePair<string, KeyValuePair<string, string>> i in items)
                {
                    if (rTitle == "Disposal" && lblEditMeasurementType.Text == "Fair Value Module")
                    {
                        if (i.Key == "lstEditDebitItem11_1" ||
                            i.Key == "lstEditDebitItem11_2" ||
                            i.Key == "lstEditProject11" ||
                            i.Key == "lstEditProject21" ||
                             i.Key == "lstEditProject15" ||
                            i.Key == "lstEditProject25" ||
                            i.Key == "lstEditCreditItem12_1" ||
                            i.Key == "lstEditDebitItem21_1" ||
                            i.Key == "lstEditDebitItem21_2")
                        {
                            // Nothing to do
                        }
                        else
                        {
                            if (i.Value.Value == "" || i.Value.Value == "-1")
                                missingData += $"<B>{rTitle} - {i.Value.Key}</B> is a required field.<BR>";
                        }

                    }
                    else
                    {
                        if (i.Value.Value == "" || i.Value.Value == "-1")
                            missingData += $"<B>{rTitle} - {i.Value.Key}</B> is a required field.<BR>";
                    }
                }

            }

            if (missingTabs != "")
                missingTabs += "<BR>";

            msg += missingTabs + missingData;

            if (msg == "") msg = "ok";
            //{
            //    btnSave.Visible = false;
            //}
            //else
            //{
            //    msg = "ok";
            //    btnSave.Visible = true;
            //}
            rwzTransactionList.WizardSteps[1].Active = true;
            return msg;
        }





        protected void btnCancelPage_Click(object sender, EventArgs e)
        {

            //divMain.Visible = true;
            //divPopup.Visible = true;// to make it accessable by java false;
            ScriptManager.RegisterStartupScript(this, GetType(), "ShowGridDiv", "ShowGridDiv(true);", true);

        }


        public void EnableTabs()
        {
            foreach (RadWizardStep tab in rwzTransactionList.WizardSteps)
            {
                tab.Enabled = false;
            }

            foreach (RadWizardStep tab in rwzTransactionList.WizardSteps)
            {
                switch (lblEditMeasurementType.Text)
                {
                    case "Cost Module":
                        if (tab.Title == "Depreciation" || tab.Title == "Impairment" || tab.Title == "Impairment Reversal" || tab.Title == "Disposal" || tab.Title == "Asset Unbundling")
                        {
                            tab.Enabled = true;
                        }
                        break;
                    case "Revaluation Module":
                        if (tab.Title == "Depreciation" || tab.Title == "Impairment" || tab.Title == "Impairment Reversal" || tab.Title == "Disposal" || tab.Title == "Revaluation" || tab.Title == "Asset Unbundling")
                        {
                            tab.Enabled = true;
                        }
                        break;
                    case "Fair Value Module":
                        if (tab.Title == "Fair Value" || tab.Title == "Disposal" || tab.Title == "Asset Unbundling")
                        {
                            tab.Enabled = true;
                            Session["CurrentTab"] = "Fair Value";
                        }
                        break;
                    case "Leased Assets":
                        if (tab.Title == "Depreciation" || tab.Title == "Impairment" || tab.Title == "Impairment Reversal" || tab.Title == "Disposal" || tab.Title == "Asset Unbundling")
                        {
                            tab.Enabled = true;
                        }
                        break;
                    case "":
                        if (tab.Title == "Impairment" || tab.Title == "Impairment Reversal" || tab.Title == "Disposal")
                        {
                            tab.Enabled = true;
                        }
                        break;
                    default:
                        tab.Enabled = false;
                        break;
                }
            }

            //  var tabSel = tabStripTransactionType.Tabs[3];
            //  tabStripTransactionType_TabClick(null, new RadTabStripEventArgs(tabSel));
        }

        public void CheckHerritageAndPPESpesificEnableTabs()
        {

            foreach (RadWizardStep tab in rwzTransactionList.WizardSteps)
            {
                if ((lstEditAssetType.SelectedItem.Text.Equals("Heritage Assets")) ||
                            (lstEditAssetType.SelectedItem.Text.Equals("Property, Plant and Equipment") &&
                            lstEditCategory.SelectedItem.Text.Equals("Land") &&
                            (lstEditSubCategory.SelectedItem.Text.Equals("General Plant") ||
                            lstEditSubCategory.SelectedItem.Text.Equals("Distribution Plant"))
                            ))
                {
                    if (tab.Title == "Depreciation")
                    {
                        tab.Enabled = false;
                        tab.ImageUrl = "";
                    }
                }
            }
            //rwzTransactionList.WizardSteps[1].Active = true;
            //wzMscoa.WizardSteps[2].Active = true;
            //SwitchStep("Transaction Type");

        }



        private bool CheckIfStatusRequired(int AssetType, int CategoryId)
        {
            // Check The type StatusRequired

            Sebata.Business.Assets.Configuration.Category configCategory = new Sebata.Business.Assets.Configuration.Category(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);
            var dtblStatusRequiredForType = configCategory.Get(CategoryId, AssetType);

            if (dtblStatusRequiredForType.Rows.Count > 0)
            {

                if (String.IsNullOrEmpty(dtblStatusRequiredForType.Rows[0].ItemArray[3].ToString()))
                {
                    lstEditStatus.SelectedValue = "-1";
                    return false;
                }
                else
                {
                    bool Req = Convert.ToBoolean(dtblStatusRequiredForType.Rows[0].ItemArray[3]);
                    if (Req)
                    {
                        return true;
                    }
                    else
                    {
                        lstEditStatus.SelectedValue = "-1";
                        return false;
                    }
                }
            }
            else
            {
                lstEditStatus.SelectedValue = "-1";
                return false;
            }
        }

        protected void btnSearchClear_Click(object sender, EventArgs e)
        {
            lstSearchType.SelectedIndex = 1;
            lstSearchCategory.SelectedIndex = 0;
            lstSearchSubCategory.SelectedIndex = 0;
            PopulateGrid(true);
            divExport.Visible = false;
            divGrid.Visible = false;
        }

        protected void wzMscoa_ActiveStepChanged(object sender, EventArgs e)
        {
            int activeStepIndex = (sender as RadWizard).ActiveStep.Index;
            wzMscoa.WizardSteps[activeStepIndex].Active = true;

            string imgYes = "~/img/KPITargetMet.png";
            string imgNo = "~/img/KPITargetMissed.png";

            bool valDep = true;
            bool valImp = true;
            bool valRev = true;
            bool valFair = true;
            bool valDisp = true;
            bool valUnb = true;

            var transactionTypeIds = _configmSCOA.GetTransactionTypeIds();

            foreach (RadWizardStep tab in rwzTransactionList.WizardSteps)
            {
                tab.ImageUrl = "";
            }

            string msg = "";
            if (IsMainItemsSelected())
            {
                if (DoesGroupExists())
                {
                    msg = "Configuration already exist.";
                }
                else
                {
                    //if (hdnEditID.Value != "")
                    //{
                    foreach (RadWizardStep tab in rwzTransactionList.WizardSteps)
                    {
                        switch (lblEditMeasurementType.Text)
                        {
                            case "Cost Module":
                                if (tab.Title == "Depreciation" || tab.Title == "Impairment" || tab.Title == "Impairment Reversal" || tab.Title == "Disposal" || tab.Title == "Asset Unbundling")
                                {
                                    tab.ImageUrl = imgNo;
                                }
                                break;
                            case "Revaluation Module":
                                if (tab.Title == "Depreciation" || tab.Title == "Impairment" || tab.Title == "Impairment Reversal" || tab.Title == "Disposal" || tab.Title == "Revaluation" || tab.Title == "Asset Unbundling")
                                {
                                    tab.ImageUrl = imgNo;
                                }
                                break;
                            case "Fair Value Module":
                                if (tab.Title == "Fair Value" || tab.Title == "Disposal" || tab.Title == "Asset Unbundling")
                                {
                                    tab.ImageUrl = imgNo;
                                }
                                break;
                            case "Leased Assets":
                                if (tab.Title == "Depreciation" || tab.Title == "Impairment" || tab.Title == "Impairment Reversal" || tab.Title == "Disposal" || tab.Title == "Asset Unbundling")
                                {
                                    tab.ImageUrl = imgNo;
                                }
                                break;
                            case "":
                                if (tab.Title == "Impairment" || tab.Title == "Impairment Reversal" || tab.Title == "Disposal")
                                {
                                    tab.ImageUrl = imgNo;
                                }
                                break;
                            default:
                                tab.ImageUrl = imgNo;
                                break;
                        }
                    }

                    DataTable msCoaT = _configmSCOA.GetTransactionTypes(Convert.ToInt32(hdnEditID.Value.intSafe()));
                    foreach (DataRow row in msCoaT.Rows)
                    {
                        if (Convert.ToInt32(row["TransactionTypeId"]) == transactionTypeIds.Depreciation && (lblEditMeasurementType.Text == "Cost Module" || lblEditMeasurementType.Text == "Revaluation Module" || lblEditMeasurementType.Text == "Leased Assets")) // Depreciation
                        {
                            if (lblEditMeasurementType.Text == "Revaluation Module")
                            {
                                if (string.IsNullOrEmpty(row["Project11"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["Project12"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["DebitItem12_1"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["Project13"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["CreditItem13_1"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["Project14"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valDep = false; }
                            }
                            else
                            {
                                if (string.IsNullOrEmpty(row["Project11"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["Project14"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valDep = false; }
                            }
                            if (valDep) { rwzTransactionList.WizardSteps[0].ImageUrl = imgYes; } else { rwzTransactionList.WizardSteps[0].ImageUrl = imgNo; }
                            
                            
                        }
                        else if (Convert.ToInt32(row["TransactionTypeId"]) == transactionTypeIds.Impairment && (lblEditMeasurementType.Text == "Cost Module" || lblEditMeasurementType.Text == "Revaluation Module" || lblEditMeasurementType.Text == "Leased Assets" || lblEditMeasurementType.Text == "")) // Impairment
                        {
                            if (lblEditMeasurementType.Text == "Revaluation Module")
                            {
                                if (string.IsNullOrEmpty(row["Project11"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["Project12"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["DebitItem12_1"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["Project14"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valImp = false; }
                            }
                            else
                            {
                                if (string.IsNullOrEmpty(row["Project11"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["Project14"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valImp = false; }
                            }
                            if (valImp) { rwzTransactionList.WizardSteps[1].ImageUrl = imgYes; } else { rwzTransactionList.WizardSteps[1].ImageUrl = imgNo; }
                        }
                        else if (Convert.ToInt32(row["TransactionTypeId"]) == transactionTypeIds.ImpairmentReversal && (lblEditMeasurementType.Text == "Cost Module" || lblEditMeasurementType.Text == "Revaluation Module" || lblEditMeasurementType.Text == "Leased Assets" || lblEditMeasurementType.Text == "")) // Imp Reversal
                        {
                            if (lblEditMeasurementType.Text == "Revaluation Module")
                            {
                                if (string.IsNullOrEmpty(row["Project11"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["Project12"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["DebitItem12_1"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["Project14"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valImp = false; }
                            }
                            else
                            {
                                if (string.IsNullOrEmpty(row["Project11"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["Project14"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valImp = false; }
                            }
                            if (valRev) { rwzTransactionList.WizardSteps[2].ImageUrl = imgYes; } else { rwzTransactionList.WizardSteps[2].ImageUrl = imgNo; }
                        }
                        else if (Convert.ToInt32(row["TransactionTypeId"]) == transactionTypeIds.FairValue && (lblEditMeasurementType.Text == "Fair Value Module")) // Imp Reversal
                        {
                            if (string.IsNullOrEmpty(row["Project11"].ToString())) { valFair = false; }
                            if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valFair = false; }
                            if (string.IsNullOrEmpty(row["Project14"].ToString())) { valFair = false; }
                            if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valFair = false; }
                            if (string.IsNullOrEmpty(row["Project21"].ToString())) { valFair = false; }
                            if (string.IsNullOrEmpty(row["DebitItem21_1"].ToString())) { valFair = false; }
                            if (string.IsNullOrEmpty(row["Project24"].ToString())) { valFair = false; }
                            if (string.IsNullOrEmpty(row["CreditItem21_1"].ToString())) { valFair = false; }
                            if (valFair) { rwzTransactionList.WizardSteps[3].ImageUrl = imgYes; } else { rwzTransactionList.WizardSteps[3].ImageUrl = imgNo; }
                        }
                        else if (Convert.ToInt32(row["TransactionTypeId"]) == transactionTypeIds.Revaluation && (lblEditMeasurementType.Text == "Revaluation Module")) // Revaluation Module
                        {
                            if (string.IsNullOrEmpty(row["Project11"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["Project14"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["Project21"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["DebitItem21_1"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["Project24"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["CreditItem21_1"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["Project12"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["DebitItem12_1"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["Project22"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["DebitItem22_1"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["Project13"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["CreditItem13_1"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["Project23"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["CreditItem23_1"].ToString())) { valRev = false; }

                            if (string.IsNullOrEmpty(row["Project15"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["DebitItem11_2"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["Project25"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["DebitItem21_2"].ToString())) { valRev = false; }

                            if (valRev) { rwzTransactionList.WizardSteps[4].ImageUrl = imgYes; } else { rwzTransactionList.WizardSteps[4].ImageUrl = imgNo; }
                        }

                        else if (Convert.ToInt32(row["TransactionTypeId"]) == transactionTypeIds.Disposal && (lblEditMeasurementType.Text == "Cost Module" || lblEditMeasurementType.Text == "Revaluation Module" || lblEditMeasurementType.Text == "Leased Assets" || lblEditMeasurementType.Text == "Fair Value Module" || lblEditMeasurementType.Text == "")) // Disposal
                        {
                            if (string.IsNullOrEmpty(row["Project11"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["Project14"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valDisp = false; }

                            if (string.IsNullOrEmpty(row["DebitItem11_2"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["Project21"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["DebitItem21_1"].ToString())) { valDisp = false; }

                            if (string.IsNullOrEmpty(row["DebitItem21_2"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["CreditItem21_1"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["Project12"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["DebitItem12_1"].ToString())) { valDisp = false; }

                            if (string.IsNullOrEmpty(row["Project22"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["DebitItem22_1"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["Project13"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["CreditItem13_1"].ToString())) { valDisp = false; }

                            if (string.IsNullOrEmpty(row["Project23"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["CreditItem23_1"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["Project14"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["Project24"].ToString())) { valDisp = false; }

                            if (valDisp) { rwzTransactionList.WizardSteps[5].ImageUrl = imgYes; } else { rwzTransactionList.WizardSteps[5].ImageUrl = imgNo; }
                        }

                        else if (Convert.ToInt32(row["TransactionTypeId"]) == transactionTypeIds.AssetUnbundling && (lblEditMeasurementType.Text == "Cost Module" || lblEditMeasurementType.Text == "Revaluation Module" || lblEditMeasurementType.Text == "Leased Assets"))
                        {
                            if (string.IsNullOrEmpty(row["Project11"].ToString())) { valUnb = false; }
                            if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valUnb = false; }
                            if (string.IsNullOrEmpty(row["Project14"].ToString())) { valUnb = false; }
                            if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valUnb = false; }
                            if (valUnb) { rwzTransactionList.WizardSteps[6].ImageUrl = imgYes; } else { rwzTransactionList.WizardSteps[4].ImageUrl = imgNo; }
                        }
                    }

                    wzMscoa.WizardSteps[1].Active = true;
                    SwitchStep((sender as RadWizard).ActiveStep.Title);

                }
            }
            else
            {
                msg = "Please select all available items before continuing.";

                //lblResultMsg.Text = "Please select all available items before continuing.";
                //gridUploadResult.Visible = false;
                ////this is not working
                //Page.ClientScript.RegisterStartupScript(GetType(), "btnNextselected", "ShowResult();", true);
            }
            if (msg != "")
            {
                //lblpopMsg.Text = msg;
                //Page.ClientScript.RegisterStartupScript(GetType(), "ShowPopMsg", "ShowPopMsg();", true);
                ScriptManager.RegisterStartupScript(this, GetType(), "btnNextselected", "ShowUpdated('" + msg + "');", true);
            }

            try
            {
                if (lstEditSubCategory.SelectedItem != null) lblEditSubCategory.Text = lstEditSubCategory.SelectedItem.ToString();
                if (lstEditStatus.SelectedItem != null) lblEditStatus.Text = lstEditStatus.SelectedItem.ToString();
            }
            catch { }






        }

        protected void rwzTransactionList_ActiveStepChanged(object sender, EventArgs e)
        {

            // Before we change

            //string imgYes = "~/img/KPITargetMet.png";
            //string imgNo = "~/img/KPITargetMissed.png";


            //string ValMsg = ValidateSingleTabPageOnChange();

            //if (ValMsg == "ok")
            //{              // Set thumbs Up
            //    rwzTransactionList.ActiveStep.ImageUrl = imgYes;
            //}
            //else
            //{
            //    rwzTransactionList.ActiveStep.ImageUrl = imgNo;
            //}






            //int activeStepIndex = (sender as RadWizard).ActiveStep.Index;

            //save to memory current values

            SaveSession();

            //int transType = Convert.ToInt32(activeStepIndex+1);
            string transType = (sender as RadWizard).ActiveStep.Title;
            BuildEdit(transType);

            Session["CurrentTab"] = (sender as RadWizard).ActiveStep.Title;

            LoadSession();

            // if (activeStepIndex == 0) Div0.Visible = true;
            // if (activeStepIndex == 1) Div1.Visible = true;
            // if (activeStepIndex == 2) Div2.Visible = true;
        }

        protected void btnNext_Click(object sender, EventArgs e)
        {
            string imgYes = "~/img/KPITargetMet.png";
            string imgNo = "~/img/KPITargetMissed.png";
            bool valDep = true;
            bool valImp = true;
            bool valRev = true;
            bool valFair = true;
            bool valDisp = true;
            bool valUnb = true;
            EnableTabs();

            var transactionTypeIds = _configmSCOA.GetTransactionTypeIds();


            foreach (RadWizardStep tab in rwzTransactionList.WizardSteps)
            {
                tab.ImageUrl = "";
            }

            string msg = "";
            if (IsMainItemsSelected())
            {
                if (DoesGroupExists())
                {
                    msg = "Configuration already exist.";
                }
                else
                {
                    //if (hdnEditID.Value != "")
                    //{
                    foreach (RadWizardStep tab in rwzTransactionList.WizardSteps)
                    {
                        switch (lblEditMeasurementType.Text)
                        {
                            case "Cost Module":
                                if (tab.Title == "Depreciation" || tab.Title == "Impairment" || tab.Title == "Impairment Reversal" || tab.Title == "Disposal" || tab.Title == "Asset Unbundling")
                                {
                                    tab.ImageUrl = imgNo;
                                }
                                break;
                            case "Revaluation Module":
                                if (tab.Title == "Depreciation" || tab.Title == "Impairment" || tab.Title == "Impairment Reversal" || tab.Title == "Disposal" || tab.Title == "Revaluation" || tab.Title == "Asset Unbundling")
                                {
                                    tab.ImageUrl = imgNo;
                                }
                                break;
                            case "Fair Value Module":
                                if (tab.Title == "Fair Value" || tab.Title == "Disposal" || tab.Title == "Asset Unbundling")
                                {
                                    tab.ImageUrl = imgNo;
                                }
                                break;
                            case "Leased Assets":
                                if (tab.Title == "Depreciation" || tab.Title == "Impairment" || tab.Title == "Impairment Reversal" || tab.Title == "Disposal" || tab.Title == "Asset Unbundling")
                                {
                                    tab.ImageUrl = imgNo;
                                }
                                break;
                            case "":
                                if (tab.Title == "Impairment" || tab.Title == "Impairment Reversal" || tab.Title == "Disposal")
                                {
                                    tab.ImageUrl = imgNo;
                                }
                                break;
                            default:
                                tab.ImageUrl = imgNo;
                                break;
                        }
                    }

                    DataTable msCoaT = _configmSCOA.GetTransactionTypes(Convert.ToInt32(hdnEditID.Value.intSafe()));
                    foreach (DataRow row in msCoaT.Rows)
                    {
                        if (Convert.ToInt32(row["TransactionTypeId"]) == transactionTypeIds.Depreciation && (lblEditMeasurementType.Text == "Cost Module" || lblEditMeasurementType.Text == "Revaluation Module" || lblEditMeasurementType.Text == "Leased Assets")) // Depreciation
                        {
                            if (lblEditMeasurementType.Text == "Revaluation Module")
                            {
                                if (string.IsNullOrEmpty(row["Project11"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["Project12"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["DebitItem12_1"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["Project13"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["CreditItem13_1"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["Project14"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valDep = false; }
                            }
                            else
                            {
                                if (string.IsNullOrEmpty(row["Project11"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["Project14"].ToString())) { valDep = false; }
                                if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valDep = false; }
                            }
                            if (valDep) { rwzTransactionList.WizardSteps[0].ImageUrl = imgYes; } else { rwzTransactionList.WizardSteps[0].ImageUrl = imgNo; }
                        }
                        else if (Convert.ToInt32(row["TransactionTypeId"]) == transactionTypeIds.Impairment && (lblEditMeasurementType.Text == "Cost Module" || lblEditMeasurementType.Text == "Revaluation Module" || lblEditMeasurementType.Text == "Leased Assets" || lblEditMeasurementType.Text == "")) // Impairment
                        {
                            if (lblEditMeasurementType.Text == "Revaluation Module")
                            {
                                if (string.IsNullOrEmpty(row["Project11"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["Project12"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["DebitItem12_1"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["Project14"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valImp = false; }
                            }
                            else
                            {
                                if (string.IsNullOrEmpty(row["Project11"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["Project14"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valImp = false; }
                            }
                            if (valImp) { rwzTransactionList.WizardSteps[1].ImageUrl = imgYes; } else { rwzTransactionList.WizardSteps[1].ImageUrl = imgNo; }
                        }
                        if (Convert.ToInt32(row["TransactionTypeId"]) == transactionTypeIds.ImpairmentReversal && (lblEditMeasurementType.Text == "Cost Module" || lblEditMeasurementType.Text == "Revaluation Module" || lblEditMeasurementType.Text == "Leased Assets" || lblEditMeasurementType.Text == "")) // Imp Reversal
                        {
                            if (lblEditMeasurementType.Text == "Revaluation Module")
                            {
                                if (string.IsNullOrEmpty(row["Project11"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["Project12"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["DebitItem12_1"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["Project14"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valImp = false; }
                            }
                            else
                            {
                                if (string.IsNullOrEmpty(row["Project11"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["Project14"].ToString())) { valImp = false; }
                                if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valImp = false; }
                            }
                            if (valRev) { rwzTransactionList.WizardSteps[2].ImageUrl = imgYes; } else { rwzTransactionList.WizardSteps[2].ImageUrl = imgNo; }
                        }
                        else if (Convert.ToInt32(row["TransactionTypeId"]) == transactionTypeIds.FairValue && (lblEditMeasurementType.Text == "Fair Value Module")) // Imp Reversal
                        {
                            if (string.IsNullOrEmpty(row["Project11"].ToString())) { valFair = false; }
                            if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valFair = false; }
                            if (string.IsNullOrEmpty(row["Project14"].ToString())) { valFair = false; }
                            if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valFair = false; }
                            if (string.IsNullOrEmpty(row["Project21"].ToString())) { valFair = false; }
                            if (string.IsNullOrEmpty(row["DebitItem21_1"].ToString())) { valFair = false; }
                            if (string.IsNullOrEmpty(row["Project24"].ToString())) { valFair = false; }
                            if (string.IsNullOrEmpty(row["CreditItem21_1"].ToString())) { valFair = false; }
                            if (valFair) { rwzTransactionList.WizardSteps[3].ImageUrl = imgYes; } else { rwzTransactionList.WizardSteps[3].ImageUrl = imgNo; }
                        }
                        else if (Convert.ToInt32(row["TransactionTypeId"]) == transactionTypeIds.Revaluation && (lblEditMeasurementType.Text == "Revaluation Module")) // Revaluation Module
                        {
                            if (string.IsNullOrEmpty(row["Project11"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["Project14"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["Project21"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["DebitItem21_1"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["Project24"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["CreditItem21_1"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["Project12"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["DebitItem12_1"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["Project22"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["DebitItem22_1"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["Project13"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["CreditItem13_1"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["Project23"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["CreditItem23_1"].ToString())) { valRev = false; }

                            if (string.IsNullOrEmpty(row["Project15"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["DebitItem11_2"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["Project25"].ToString())) { valRev = false; }
                            if (string.IsNullOrEmpty(row["DebitItem21_2"].ToString())) { valRev = false; }

                            if (valFair) { rwzTransactionList.WizardSteps[4].ImageUrl = imgYes; } else { rwzTransactionList.WizardSteps[4].ImageUrl = imgNo; }
                        }

                        else if (Convert.ToInt32(row["TransactionTypeId"]) == transactionTypeIds.Disposal && (lblEditMeasurementType.Text == "Cost Module" || lblEditMeasurementType.Text == "Revaluation Module" || lblEditMeasurementType.Text == "Leased Assets" || lblEditMeasurementType.Text == "Fair Value Module" || lblEditMeasurementType.Text == "")) // Disposal
                        {
                            if (string.IsNullOrEmpty(row["Project11"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["Project14"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valDisp = false; }

                            if (string.IsNullOrEmpty(row["DebitItem11_2"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["Project21"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["DebitItem21_1"].ToString())) { valDisp = false; }

                            if (string.IsNullOrEmpty(row["DebitItem21_2"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["CreditItem21_1"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["Project12"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["DebitItem12_1"].ToString())) { valDisp = false; }

                            if (string.IsNullOrEmpty(row["Project22"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["DebitItem22_1"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["Project13"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["CreditItem13_1"].ToString())) { valDisp = false; }

                            if (string.IsNullOrEmpty(row["Project23"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["CreditItem23_1"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["Project14"].ToString())) { valDisp = false; }
                            if (string.IsNullOrEmpty(row["Project24"].ToString())) { valDisp = false; }


                            if (valDisp) { rwzTransactionList.WizardSteps[5].ImageUrl = imgYes; } else { rwzTransactionList.WizardSteps[5].ImageUrl = imgNo; }
                        }

                        else if (Convert.ToInt32(row["TransactionTypeId"]) == transactionTypeIds.AssetUnbundling && (lblEditMeasurementType.Text == "Cost Module" || lblEditMeasurementType.Text == "Revaluation Module" || lblEditMeasurementType.Text == "Leased Assets"))
                        {
                            if (string.IsNullOrEmpty(row["Project11"].ToString())) { valUnb = false; }
                            if (string.IsNullOrEmpty(row["DebitItem11_1"].ToString())) { valUnb = false; }
                            if (string.IsNullOrEmpty(row["Project14"].ToString())) { valUnb = false; }
                            if (string.IsNullOrEmpty(row["CreditItem11_1"].ToString())) { valUnb = false; }
                            if (valUnb) { rwzTransactionList.WizardSteps[6].ImageUrl = imgYes; } else { rwzTransactionList.WizardSteps[4].ImageUrl = imgNo; }
                        }

                    }

                    wzMscoa.WizardSteps[1].Active = true;
                    SwitchStep("Transaction Type");
                }
            }
            else
            {
                msg = "Please select all available items before continuing.";

                //lblResultMsg.Text = "Please select all available items before continuing.";
                //gridUploadResult.Visible = false;
                ////this is not working
                //Page.ClientScript.RegisterStartupScript(GetType(), "btnNextselected", "ShowResult();", true);
            }

            if (msg != "")
            {
                //lblpopMsg.Text = msg;
                //Page.ClientScript.RegisterStartupScript(GetType(), "ShowPopMsg", "ShowPopMsg();", true);
                ScriptManager.RegisterStartupScript(this, GetType(), "btnNextselected", "ShowUpdated('" + msg + "');", true);
            }

            try
            {
                if (lstEditSubCategory.SelectedItem != null) lblEditSubCategory.Text = lstEditSubCategory.SelectedItem.ToString();
                if (lstEditStatus.SelectedItem != null) lblEditStatus.Text = lstEditStatus.SelectedItem.ToString();
            }

            catch { }
        }

        private bool DoesGroupExists()
        {
            bool retval = false;
            if (string.IsNullOrEmpty(hdnEditID.Value))
            {
                int? typeid = null;
                int? categoryid = null;
                int? subcategoryid = null;

                if (lstEditAssetType.SelectedValue.intSafe() > 0)
                    typeid = lstEditAssetType.SelectedValue.intSafe();

                if (lstEditCategory.SelectedValue.intSafe() > 0)
                    categoryid = lstEditCategory.SelectedValue.intSafe();

                if (lstEditSubCategory.SelectedValue.intSafe() > 0)
                    subcategoryid = lstEditSubCategory.SelectedValue.intSafe();

                DataTable dt = _configmSCOA.Get(null, lstFinYear.Text, typeid, categoryid, subcategoryid);
                if (dt != null && dt.Rows.Count > 0)
                {
                    foreach (DataRow dr in dt.Rows)
                    {
                        if (dr["MeasurementTypeID"].ToString() == lstEditMeasurementType.SelectedValue
                            && dr["StatusID"].ToString() == lstEditStatus.SelectedValue)
                        {
                            retval = true;
                            break;
                        }
                    }
                }
                return retval;
            }
            else
            {
                return false;
            }
        }

        private bool IsMainItemsSelected()
        {
            bool retval = true;

            if (lstEditAssetType.SelectedValue.intSafe() <= 0)
                retval = false;
            else if (lstEditCategory.Enabled)
            {
                if (lstEditCategory.Items.Count > 0 && lstEditCategory.SelectedValue.intSafe() <= 0)
                    retval = false;
            }
            if (lstEditSubCategory.Enabled)
            {
                if (lstEditSubCategory.Items.Count > 0 && lstEditSubCategory.SelectedValue.intSafe() <= 0)
                    retval = false;
            }
            if (lstEditStatus.Enabled)
            {
                if (lstEditStatus.Items.Count > 0 && lstEditStatus.SelectedValue.intSafe() <= 0)
                    retval = false;
            }
            if (lstEditMeasurementType.Enabled)
            {
                if (lstEditMeasurementType.Items.Count > 0 && lstEditMeasurementType.SelectedValue.intSafe() <= 0)
                    retval = false;
            }
            return retval;
        }

        protected void lstEditProject14_SelectedIndexChanged(object sender, EventArgs e)
        {
            lstEditCreditItem11_1.Items.Clear();
            if (lstEditProject14.SelectedItem != null)
            {
                lstEditProject14.ToolTip = lstEditProject14.SelectedItem.ToString();

                DataTable items = _configmSCOA.GetProjectItems(Convert.ToInt32(lstEditProject14.SelectedValue));
                lstEditCreditItem11_1.DataSource = items;

                lstEditCreditItem11_1.DataTextField = "PlanProjectItemAndItemDesc";
                lstEditCreditItem11_1.DataValueField = "PlanProjectItem_ID";

                lstEditCreditItem11_1.DataBind();

                lstEditCreditItem11_1.Items.Insert(0, new ListItem("--Select--", "-1"));
            }
            else
            {
                lstEditCreditItem11_1.DataSource = null;
            }
            lblEditSCOAItemCode14.Text = "";
            lblEditSCOAItemCode14.ToolTip = "";
            lblEditProjectSCOAFund14.Text = "";
            lblEditProjectSCOAFund14.ToolTip = "";
            lblEditProjectSCOAFunction14.Text = "";
            lblEditProjectSCOAFunction14.ToolTip = "";
            lblEditProjectSCOACost14.Text = "";
            lblEditProjectSCOACost14.ToolTip = "";
            lblEditProjectSCOARegion14.Text = "";
            lblEditProjectSCOARegion14.ToolTip = "";
            lblEditProjectSCOAProject14.Text = "";
            lblEditProjectSCOAProject14.ToolTip = "";
            lblEditProjectMunicipalClasification14.Text = "";
            lblEditProjectMunicipalClasification14.ToolTip = "";

        }

        protected void lstEditProject24_SelectedIndexChanged(object sender, EventArgs e)
        {
            lstEditCreditItem21_1.Items.Clear();
            if (lstEditProject24.SelectedItem != null)
            {
                lstEditProject24.ToolTip = lstEditProject24.SelectedItem.ToString();

                DataTable items = _configmSCOA.GetProjectItems(Convert.ToInt32(lstEditProject24.SelectedValue));
                lstEditCreditItem21_1.DataSource = items;

                lstEditCreditItem21_1.DataTextField = "PlanProjectItemAndItemDesc";
                lstEditCreditItem21_1.DataValueField = "PlanProjectItem_ID";

                lstEditCreditItem21_1.DataBind();

                lstEditCreditItem21_1.Items.Insert(0, new ListItem("--Select--", "-1"));
            }
            {
                lstEditCreditItem21_1.DataSource = null;
            }

            lblEditSCOAItemCode24.Text = "";
            lblEditSCOAItemCode24.ToolTip = "";
            lblEditProjectSCOAFund24.Text = "";
            lblEditProjectSCOAFund24.ToolTip = "";
            lblEditProjectSCOAFunction24.Text = "";
            lblEditProjectSCOAFunction24.ToolTip = "";
            lblEditProjectSCOACost24.Text = "";
            lblEditProjectSCOACost24.ToolTip = "";
            lblEditProjectSCOARegion24.Text = "";
            lblEditProjectSCOARegion24.ToolTip = "";
            lblEditProjectSCOAProject24.Text = "";
            lblEditProjectSCOAProject24.ToolTip = "";
            lblEditProjectMunicipalClasification24.Text = "";
            lblEditProjectMunicipalClasification24.ToolTip = "";

        }

        protected void lstEditProject25_SelectedIndexChanged(object sender, EventArgs e)
        {
            lstEditDebitItem21_2.Items.Clear();
            if (lstEditProject25.Items.Count > 0)
            {
                lstEditProject25.ToolTip = lstEditProject25.SelectedItem.ToString();

                DataTable items = _configmSCOA.GetProjectItems(Convert.ToInt32(lstEditProject25.SelectedValue));
                lstEditDebitItem21_2.DataSource = items;

                lstEditDebitItem21_2.DataTextField = "PlanProjectItemAndItemDesc";
                lstEditDebitItem21_2.DataValueField = "PlanProjectItem_ID";

                lstEditDebitItem21_2.DataBind();

                lstEditDebitItem21_2.Items.Insert(0, new ListItem("--Select--", "-1"));

                lblEditSCOAItemCode25.Text = "";
                lblEditSCOAItemCode25.ToolTip = "";
                lblEditProjectSCOAFund25.Text = "";
                lblEditProjectSCOAFund25.ToolTip = "";
                lblEditProjectSCOAFunction25.Text = "";
                lblEditProjectSCOAFunction25.ToolTip = "";
                lblEditProjectSCOACost25.Text = "";
                lblEditProjectSCOACost25.ToolTip = "";
                lblEditProjectSCOARegion25.Text = "";
                lblEditProjectSCOARegion25.ToolTip = "";
                lblEditProjectSCOAProject25.Text = "";
                lblEditProjectSCOAProject25.ToolTip = "";
                lblEditProjectMunicipalClasification25.Text = "";
                lblEditProjectMunicipalClasification25.ToolTip = "";
            }

        }

        protected void lstEditProject15_SelectedIndexChanged(object sender, EventArgs e)
        {
            lstEditDebitItem11_2.Items.Clear();
            // lstEditProject15.ToolTip = lstEditProject15.SelectedItem.ToString();
            if (lstEditProject15.Items.Count > 0)
            {
                lstEditProject15.ToolTip = lstEditProject15.SelectedItem == null ? "" : lstEditProject15.SelectedItem.ToString();


                DataTable items = _configmSCOA.GetProjectItems(Convert.ToInt32(lstEditProject15.SelectedValue));
                lstEditDebitItem11_2.DataSource = items;

                lstEditDebitItem11_2.DataTextField = "PlanProjectItemAndItemDesc";
                lstEditDebitItem11_2.DataValueField = "PlanProjectItem_ID";

                lstEditDebitItem11_2.DataBind();

                lstEditDebitItem11_2.Items.Insert(0, new ListItem("--Select--", "-1"));

                lblEditSCOAItemCode15.Text = "";
                lblEditSCOAItemCode15.ToolTip = "";
                lblEditProjectSCOAFund15.Text = "";
                lblEditProjectSCOAFund15.ToolTip = "";
                lblEditProjectSCOAFunction15.Text = "";
                lblEditProjectSCOAFunction15.ToolTip = "";
                lblEditProjectSCOACost15.Text = "";
                lblEditProjectSCOACost15.ToolTip = "";
                lblEditProjectSCOARegion15.Text = "";
                lblEditProjectSCOARegion15.ToolTip = "";
                lblEditProjectSCOAProject15.Text = "";
                lblEditProjectSCOAProject15.ToolTip = "";
                lblEditProjectMunicipalClasification15.Text = "";
                lblEditProjectMunicipalClasification15.ToolTip = "";
            }

        }


        protected void btnShowUpload_CheckedChanged(object sender, EventArgs e)
        {
            divuploadbuttons.Visible = btnShowUpload.Checked;
            Session["AssetUploadedFile"] = null;
            Session["AssetFile"] = null;

        }

        protected void btnResultCSV_Click(object sender, ImageClickEventArgs e)
        {
            //gridUploadResult
            try
            {
                isexport = true;
                gridUploadResult.ExportSettings.Excel.Format = (GridExcelExportFormat)Enum.Parse(typeof(GridExcelExportFormat), "Xlsx");
                gridUploadResult.ExportSettings.FileName = "Asset-mSCOA-BulkUpload-Result";
                gridUploadResult.ExportSettings.IgnorePaging = true;
                gridUploadResult.ExportSettings.ExportOnlyData = true;
                gridUploadResult.ExportSettings.OpenInNewWindow = true;
                gridUploadResult.MasterTableView.ExportToExcel();
            }
            catch (Exception Ex)
            {
                Common.CommonTasks.ErrorMsgSettings(Ex, System.Reflection.MethodBase.GetCurrentMethod().Name.ToString(), moduleName, pageName, mySession.Current.User_ID, divMessage, lblMessage);
            }
        }

        protected void btnResultPDF_Click(object sender, ImageClickEventArgs e)
        {
            //gridUploadResult
            DataTable gridData = _configmSCOA.GetUploadReport(Session["AssetUploadedFile"].ToString(), today);
            Export.ToPDF(Response, "Asset-mSCOA-BulkUpload-Result", gridData);

        }

        protected void btnGuidLine_Click(object sender, EventArgs e)
        {
            //DownloadTemplateGuide
            ScriptManager.RegisterStartupScript(this, GetType(), "DownloadTemplateGuide", "DownloadTemplateGuide();", true);
            //string filePath = Server.MapPath("");
            //string file = "";
            //Response.AddHeader("Content-disposition", "attachment; filename=" + file);
            //Response.ContentType = "application/octet-stream";
            //Response.WriteFile(filePath);

            //Response.End();

        }

        protected void btntemplate_Click(object sender, EventArgs e)
        {
            //DownloadTemplate
            ScriptManager.RegisterStartupScript(this, GetType(), "DownloadTemplate", "DownloadTemplate();", true);
        }

        protected void lstEditDebitItem11_2_SelectedIndexChanged(object sender, EventArgs e)
        {
            lstEditDebitItem11_2.ToolTip = lstEditDebitItem11_2.SelectedItem == null ? "" : lstEditDebitItem11_2.SelectedItem.ToString(); //.SelectedItem.ToString();
            int Err = 0;
            DataRow dr = _configmSCOA.GetSCOAdescriptions(lblFinYear.Text, lstEditProject15.SelectedValue.intSafe(), lstEditDebitItem11_2.SelectedValue.intSafe(), out Err);
            if (dr != null)
            {
                lblEditSCOAItemCode15.Text = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund15.Text = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction15.Text = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost15.Text = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion15.Text = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject15.Text = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification15.Text = dr["MunicipalClassification"].ToString();
                lblEditSCOAItemCode15.ToolTip = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund15.ToolTip = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction15.ToolTip = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost15.ToolTip = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion15.ToolTip = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject15.ToolTip = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification15.ToolTip = dr["MunicipalClassification"].ToString();
            }
        }

        protected void lstEditDebitItem21_2_SelectedIndexChanged(object sender, EventArgs e)
        {


            lstEditDebitItem21_2.ToolTip = lstEditDebitItem21_2.SelectedItem == null ? "" : lstEditDebitItem21_2.SelectedItem.ToString();
            int Err = 0;
            DataRow dr = _configmSCOA.GetSCOAdescriptions(lblFinYear.Text, lstEditProject25.SelectedValue.intSafe(), lstEditDebitItem21_2.SelectedValue.intSafe(), out Err);
            if (dr != null)
            {
                lblEditSCOAItemCode25.Text = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund25.Text = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction25.Text = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost25.Text = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion25.Text = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject25.Text = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification25.Text = dr["MunicipalClassification"].ToString();
                lblEditSCOAItemCode25.ToolTip = dr["ScoaItemCode"].ToString();
                lblEditProjectSCOAFund25.ToolTip = dr["SCOAFund"].ToString();
                lblEditProjectSCOAFunction25.ToolTip = dr["SCOAFunction"].ToString();
                lblEditProjectSCOACost25.ToolTip = dr["SCOACosting"].ToString();
                lblEditProjectSCOARegion25.ToolTip = dr["SCOARegion"].ToString();
                lblEditProjectSCOAProject25.ToolTip = dr["ScoaProject"].ToString();
                lblEditProjectMunicipalClasification25.ToolTip = dr["MunicipalClassification"].ToString();
            }
        }

        protected void gridSCOA_ItemCommand(object sender, GridCommandEventArgs e)
        {
            if (e.CommandName != "Page")
            {
                gridSCOA_SelectedIndexChanged(sender, null);
            }
        }





        //protected void btnGotoTrans_Click(object sender, EventArgs e)
        //{

        //    //RadTabStrip1.SelectedIndex = 1;
        //    //SwitchTab("Type");
        //    //PageViewAssetDetails.Selected = true;
        //    //popupUpdatePanel1.Update();
        //    //// Update panels must be updated.

        //}
    }



}
