using System;
using System.Collections.Generic;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using Telerik.Web.UI;
using FMSWebApp.Common;
using System.Globalization;
using Image = System.Drawing.Image;
using Sebata.Fms.Assets;
using Sebata.Business.Assets.Data;
using FMSWebApp.Assets.DAL;
using Ninject;

namespace FMSWebApp.Assets.MultiYear
{
    public partial class Acquisition : System.Web.UI.Page
    {
        [Inject]
        public IViewUploadDocuments iViewUploadDocuments { get; set; }

        private string _moduleName = "Assets";
        private string _pageName = "Acquisition.aspx";
        private string _ExportFileName = "";

        private static string imgYes = "~/img/KPITargetMet.png";
        private static string imgNo = "~/img/KPITargetMissed.png";

        private Sebata.Business.Assets.Items.Search _searcher = null;

        private Sebata.Business.Assets.Items.Item _configItem = null;
        private Sebata.Business.Assets.Configuration.Misc _configMisc = null;

        static bool forDonations = false;

        //Permissions
        public const int _perm_Page = 40828;

        protected void Page_Init(object sender, EventArgs e)
        {
            AssetProperties1.ItemChanged += new Assets.Controls.AssetProperties.ChangeEventHandler(AssetProperties1_ItemChanged);
            AssetPropertiesDonor1.ItemChanged += new Assets.Controls.AssetProperties.ChangeEventHandler(AssetPropertiesDonor1_ItemChanged);
            AssetPropertiesDonor1.EditAllClasses(true);
        }

        protected void Page_Load(object sender, EventArgs e)
        {
            try
            {
                if (_searcher == null)
                    _searcher = new Sebata.Business.Assets.Items.Search(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);

                if (_configItem == null)
                    _configItem = new Sebata.Business.Assets.Items.Item(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);

                if (_configMisc == null)
                    _configMisc = new Sebata.Business.Assets.Configuration.Misc(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);

                if (!IsPostBack)
                {
                    if (Session["aquisitionmsg"] != null)
                    {
                        string msg = Session["aquisitionmsg"].ToString();
                        Session["aquisitionmsg"] = null;
                        Page.ClientScript.RegisterStartupScript(GetType(), "classupdated", "ShowUpdated('" + msg + "');", true);

                    }
                    bool permProcurement = CommonTasks.CheckPermission(40819, false);
                    bool permInventory = CommonTasks.CheckPermission(40828, false);
                    bool permDonation = CommonTasks.CheckPermission(40829, false);

                    bool permPage = permInventory || permDonation || permProcurement;
                    if (!permPage)
                        Common.CommonTasks.CheckPagePermission(40819, Page.ResolveUrl("~/noRights.aspx"));
                    else
                    {
                        //select tab based on permission
                        int tabNo = 0;
                        if (!permProcurement)
                        {
                            tabNo++;
                            if (!permInventory)
                                tabNo++;
                        }

                        wizSubMenu.ActiveStepIndex = tabNo;
                        wizSubMenu_ActiveStepChanged(null, null);

                        stepProcurement.Enabled = permProcurement;
                        stepInventory.Enabled = permInventory;
                        stepDonations.Enabled = permDonation;
                    }
                }

            }
            catch (Exception Ex)
            {
                Common.CommonTasks.ErrorMsgSettings(Ex, System.Reflection.MethodBase.GetCurrentMethod().Name.ToString(), _moduleName, _pageName, mySession.Current.User_ID, divMessage, lblMessage);
            }

            //fileUploadDonorImage.Attributes["onchange"] = "UploadFile(this, 'DonorImage')";
            //fileDonor.Attributes["onchange"] = "UploadFile(this, 'DonorFile')";
            //fileUploadImage.Attributes["onchange"] = "UploadFile(this, 'Image')";


            //   AssetProperties1.HideItem("Asset Description");

            AssetProperties1.HideItem("CDM");
            AssetPropertiesDonor1.HideItem("CDM");

            if (!IsPostBack)
            {
                if (wizSubMenu.ActiveStepIndex != 2)
                {
                    forDonations = false;
                    divDonorAssetItem.Visible = false;
                    ResetSearch();
                }
                divAssetItem.Visible = false;
                stepManage.ImageUrl = imgNo;
                stepType.ImageUrl = imgNo;
                stepProcurement.ImageUrl = imgNo;
                stepInventory.ImageUrl = imgNo;
                stepDonations.ImageUrl = imgNo;
                stepDetail.ImageUrl = imgNo;
                stepOwnership.ImageUrl = imgNo;
                stepLocation.ImageUrl = imgNo;
                //stepDonor.ImageUrl = imgNo;


                txtGRNnumber.Visible = false;
                lblGRN.Visible = false;



                // Check to see if this is from the Dashboard
                if (Request["isSCMGRNAsset"] != null)
                {
                    if (Request["isSCMGRNAsset"].ToString() == "true")
                    {
                        gridSearch_SelectedIndexChanged(null, null);
                    }
                }
                if (Request["isInvenAsset"] != null)
                {
                    if (Request["isInvenAsset"].ToString() == "true")
                    {
                        wizMenu.ActiveStepIndex = 1;
                        gridSearch_SelectedIndexChanged(null, null);
                    }
                }
                // Session[""]
            }
            else
            {
                if (txtDonorUsefulLife.Text.Replace("0", "").TrimEnd() == "")
                {
                    txtDonorUsefulLife.Text = _configMisc.getUsefulLife(AssetPropertiesDonor1.AssetClass_ID).ToString();
                    upDonorUsefulLife.Update();
                }
            }
        }

        protected void AssetProperties1_ItemChanged(object sender, EventArgs e)
        {
            DropDownList ddl = (DropDownList)sender;
            switch (ddl.ID)
            {
                case "txtAssetClass":
                    txtUsefulLife.Text = _configMisc.getUsefulLife(ddl.SelectedValue.intSafe()).ToString();
                    upUsefulLife.Update();
                    break;
                default:
                    break;
            }
        }

        protected void AssetPropertiesDonor1_ItemChanged(object sender, EventArgs e)
        {
            DropDownList ddl = (DropDownList)sender;
            switch (ddl.ID)
            {
                case "lstAssetClass":

                    txtDonorUsefulLife.Enabled = true;
                    //txtDonorUsefulLife.Text = _configMisc.getUsefulLife(ddl.SelectedValue).ToString();

                    txtDonorUsefulLife.Enabled = !AssetPropertiesDonor1.IgnoreUsefullLife;
                    txtDonorUsefulLife.Text = (AssetPropertiesDonor1.IgnoreUsefullLife ? "" : _configMisc.getUsefulLife(AssetPropertiesDonor1.AssetClass_ID).ToString());
                    upDonorUsefulLife.Update();
                    //btnDonorNext.Text = txtDonorUsefulLife.Text;
                    break;
                case "lstType":
                    txtDonorUsefulLife.Enabled = !AssetPropertiesDonor1.IgnoreUsefullLife;
                    txtDonorUsefulLife.Text = (AssetPropertiesDonor1.IgnoreUsefullLife ? "" : _configMisc.getUsefulLife(AssetPropertiesDonor1.AssetClass_ID).ToString());
                    upDonorUsefulLife.Update();
                    break;
                default:
                    break;
            }

        }

        protected void wizMenu_ActiveStepChanged(object sender, EventArgs e)
        {
            if (wizMenu.ActiveStepIndex == 0)
                Response.Redirect(_pageName);
        }

        protected void wizSubMenu_ActiveStepChanged(object sender, EventArgs e)
        {
            MoveMainTab(true);
            stepProcurement.ImageUrl = imgNo;
            stepInventory.ImageUrl = imgNo;
            stepDonations.ImageUrl = imgNo;




            switch (wizSubMenu.ActiveStepIndex)
            {
                case 0:
                case 1:
                    forDonations = false;
                    _ExportFileName = wizSubMenu.ActiveStep.Title;
                    ResetSearch();
                    divSearch.Visible = true;
                    divAssetItem.Visible = false;
                    stepType.ImageUrl = imgNo;
                    break;
                case 2:
                    forDonations = true;

                    PrepareForDonation();
                    divSearch.Visible = false;
                    divDonorAssetItem.Visible = true;
                    stepDonations.ImageUrl = imgYes;
                    stepDonations.Visible = true;  //?
                    MoveMainTab();

                    stepProcurement.Enabled = false;
                    stepInventory.Enabled = false;
                    stepDonations.Enabled = true;
                    break;
                default:
                    break;
            }

        }

        private void MoveMainTab(bool reset = false)
        {
            if (!reset)
            {
                wizMenu.ActiveStep.ImageUrl = imgYes;
                wizMenu.ActiveStepIndex = 1;
            }
            else
            {
                wizMenu.ActiveStepIndex = 0;
                wizMenu.ActiveStep.ImageUrl = imgNo;
            }
        }

        private void PrepareForDonation()
        {
            ClearScreen();
            AssetPropertiesDonor1.EditAllClasses(true);
            AssetPropertiesDonor1.SearchType = Sebata.Business.Assets.Items.enSearchType.Donation;
            AssetProperties1.LoadData(0);
            //            AssetPropertiesDonor1.HideItem("Asset Description");
            txtDonorCapturer.Text = _configMisc.GetUserFullName(mySession.Current.User_ID);

            LoadDropDowns();
            BuildProjectDropDown(lstDonorPlanningProjectDt, "", "");
            BuildProjectDropDown(lstDonorPlanningProjectCt, "", "");
        }

        private void ResetSearch()
        {
            txtFromDate.Clear();
            txtToDate.Clear();

            AssetPropertiesDonor1.SearchType = null;
            divSearchParameters.Visible = true;
            divSearchGrid.Visible = false;
        }

        private bool ValidateDetails()
        {
            bool retval = true;

            if (String.IsNullOrEmpty(_imageName) || !_imageName.Contains(fileUploadImage.FileName))
            {
                _imageName = UploadFile(fileUploadImage, true);
            }
            lblfileuploadimage.Text = _imageName;

            retval = AssetProperties1.Validate();

            if (datReadyForUse.SelectedDate == null)
            {
                retval = false;
                datReadyForUse.BorderColor = Color.Red;
                datReadyForUse.BorderWidth = 2;
            }
            else
                datReadyForUse.BorderColor = Color.White;

            if (datInService.SelectedDate == null)
            {
                retval = false;
                datInService.BorderColor = Color.Red;
                datInService.BorderWidth = 2;
            }
            else
                datInService.BorderColor = Color.White;
            

            if (datVerificationDate.SelectedDate == null)
            {
                retval = false;
                datVerificationDate.BorderColor = Color.Red;
                datVerificationDate.BorderWidth = 2;
            }
            else
                datVerificationDate.BorderColor = Color.White;

            if (txtGRNnumber.Visible && txtGRNnumber.Text == "")
            {
                retval = false;
                txtGRNnumber.BorderColor = Color.Red;
                txtGRNnumber.BorderWidth = 2;
            }
            else
                txtGRNnumber.BorderColor = Color.White;

            if (txtPurchaseAmount.Text.decSafe() <= 0)
            {
                retval = false;
                txtPurchaseAmount.BorderColor = Color.Red;
                txtPurchaseAmount.BorderWidth = 2;
            }
            else
                txtPurchaseAmount.BorderColor = Color.White;

            if (txtUsefulLife.Text.decSafe() == 0)
            {
                retval = false;
                txtUsefulLife.BorderColor = Color.Red;
                txtUsefulLife.BorderWidth = 2;
            }
            else
                txtUsefulLife.BorderColor = Color.White;
            upUsefulLife.Update();
            if (retval)
                stepDetail.ImageUrl = imgYes;
            else
                stepDetail.ImageUrl = imgNo;

            return retval;
        }

        private bool ValidateDonorDetails()
        {
            bool retval = true;
            if (String.IsNullOrEmpty(_imageName) || !_imageName.Contains(fileUploadDonorImage.FileName))
            {
                _imageName = UploadFile(fileUploadDonorImage, true);
                lblFileUploadDonorImage.Text = _imageName;
            }

            retval = AssetPropertiesDonor1.Validate();

            if (datDonorReadyForUse.SelectedDate == null)
            {
                retval = false;
                datDonorReadyForUse.BorderColor = Color.Red;
                datDonorReadyForUse.BorderWidth = 2;
            }
            else
                datDonorReadyForUse.BorderColor = Color.White;

            if (datDonorVerificationDate.SelectedDate == null)
            {
                retval = false;
                datDonorVerificationDate.BorderColor = Color.Red;
                datDonorVerificationDate.BorderWidth = 2;
            }
            else
                datDonorVerificationDate.BorderColor = Color.White;

            if (txtDonorUsefulLife.Text.decSafe() == 0)
            {
                retval = false;
                txtDonorUsefulLife.BorderColor = Color.Red;
                txtDonorUsefulLife.BorderWidth = 2;
            }
            else
                txtDonorUsefulLife.BorderColor = Color.White;
            upDonorUsefulLife.Update();
            if (retval)
                stepDonorDetail.ImageUrl = imgYes;
            else
                stepDonorDetail.ImageUrl = imgNo;

            return retval;
        }

        static DataTable _data = null;

        protected void btnSearch_Click(object sender, EventArgs e)
        {
            if (txtFromDate.SelectedDate == null || txtToDate.SelectedDate == null)
            {
                txtFromDate.BorderWidth = 2;
                txtToDate.BorderWidth = 2;
                txtFromDate.BorderColor = txtFromDate.SelectedDate == null ? Color.Red : Color.White;
                txtToDate.BorderColor = txtToDate.SelectedDate == null ? Color.Red : Color.White;

            }
            else
            {

                _data = _searcher.GetProcurements(wizSubMenu.ActiveStep.ID, (DateTime)txtFromDate.SelectedDate, (DateTime)txtToDate.SelectedDate);

                switch (wizSubMenu.ActiveStep.ID)
                {
                    case "stepInventory":
                        gridSearch.Columns[1].HeaderText = "Item ID";
                        gridSearch.Columns[2].HeaderText = "Inventory ID";
                        break;
                    default:
                        gridSearch.Columns[1].HeaderText = "Transfer ID";
                        gridSearch.Columns[2].HeaderText = "GRN ID";
                        break;
                }

                gridSearch.DataSource = _data;
                gridSearch.DataBind();

                divSearchParameters.Visible = false;
                divSearchGrid.Visible = true;

                wizSubMenu.Enabled = false;

                stepProcurement.Enabled = false;
                stepInventory.Enabled = false;
                stepDonations.Enabled = false;
                wizSubMenu.ActiveStep.Enabled = true;


            }
        }

        protected void btnClear_Click(object sender, EventArgs e)
        {
            txtFromDate.Clear();
            txtToDate.Clear();
        }

        protected void gridSearch_ItemCommand(object sender, Telerik.Web.UI.GridCommandEventArgs e)
        {
            if (e.CommandName == "btnClear")
            {
                GridDataItem item = (GridDataItem)e.Item;
                string strID = item.GetDataKeyValue("AssetRegisterItem_ID").ToString();


            }
        }

        protected void btnCSVExport_Click(object sender, ImageClickEventArgs e)
        {
            try
            {
                //isexport = true;
                gridSearch.ExportSettings.Excel.Format = (GridExcelExportFormat)Enum.Parse(typeof(GridExcelExportFormat), "Xlsx");
                gridSearch.ExportSettings.FileName = _ExportFileName + DateTime.Now.ToShortTimeString().Replace(":", "").Replace(" ", "");
                gridSearch.ExportSettings.IgnorePaging = true;
                gridSearch.ExportSettings.ExportOnlyData = true;
                gridSearch.ExportSettings.OpenInNewWindow = true;
                gridSearch.MasterTableView.ExportToExcel();
            }
            catch (Exception Ex)
            {
                //Common.CommonTasks.ErrorMsgSettings(Ex, System.Reflection.MethodBase.GetCurrentMethod().Name.ToString(), moduleName, pageName, mySession.Current.User_ID, divMessage, lblMessage);
            }
        }

        protected void btnPDFExport_Click(object sender, ImageClickEventArgs e)
        {
            try
            {
                DataTable datatable = null;
                DataTable dt = _searcher.GetProcurements(wizSubMenu.ActiveStep.ID, (DateTime)txtFromDate.SelectedDate, (DateTime)txtToDate.SelectedDate);
                // dt.Columns["Const_AssetType_Sys_AssetTypeDesc"].Caption = "Asset Type";
                dt.Columns.Remove("TypeID");//
                dt.Columns["AssetCategoryDesc"].Caption = "Asset Category";
                dt.Columns["AssetClassDesc"].Caption = "Asset Class";

                Configuration.Export.ToPDF(Response, "Asset-Acquisitions", dt, true, Sebata.Fms.Common.CommonTasks.GetEmsConnectionString());







            }
            catch (Exception Ex)
            {
                // Common.CommonTasks.ErrorMsgSettings(Ex, System.Reflection.MethodBase.GetCurrentMethod().Name.ToString(), moduleName, pageName, mySession.Current.User_ID, divMessage, lblMessage);
            }
        }

        protected void gridSearch_SelectedIndexChanged(object sender, EventArgs e)
        {

            LoadDropDowns();

            divSearchGrid.Visible = false;
            divAssetItem.Visible = true;

            int id = 0;

            // Check to see if this is from the DashboardSCM
            if (Request["isSCMGRNAsset"] != null || Request["isInvenAsset"] != null)
            {
                if (Request["isSCMGRNAsset"] != null)
                {
                    if (Request["isSCMGRNAsset"].ToString() == "true")
                    {
                        var SentItem = Session["SCMGRNAsset"];
                        //LoadItem()
                        divSearchParameters.Visible = false;
                        GridDataItem row = (GridDataItem)SentItem;
                        id = Convert.ToInt32(row["ID"].Text);

                        string sql = " select cast(PP.ProjectCode as varchar(10)) + ' | ' + PP.ProjectDesc ProjectDesc ,Scoa.ScoaDesc,  SCM.ProjectItem_ID , RI.Scoa_ID , SCM.AssetRegisterItem_ID,SCM.PurchaseAmount,SCM.CurrentAmount";
                        sql += " from Asset_SCMTransfer SCM inner join Asset_Register_Items RI on SCM.AssetRegisterItem_ID = RI.AssetRegisterItem_ID";
                        sql += " inner join Plan_ProjectItem PPI on SCM.ProjectItem_ID = PPI.PlanProjectItem_ID";
                        sql += " inner join Plan_Project PP on PPI.ProjectID = pp.Project_ID";
                        sql += " inner join Const_SCOA_Structure Scoa on RI.Scoa_ID = Scoa.ScoaID";
                        sql += $" where SCM.ID =  {id}";

                        var dtAssetDetails = _configMisc.GetTable(sql);
                        id = dtAssetDetails.Rows[0][4].ToString().intSafe();

                        wizSubMenu.WizardSteps[1].Enabled = false;
                        wizSubMenu.WizardSteps[2].Enabled = false;


                    }
                }
                else if (Request["isInvenAsset"] != null && Request["isInvenAsset"].ToString() == "true")
                {
                    var SentItem = Session["InventoryAsset"];
                    //LoadItem()
                    divSearchParameters.Visible = false;
                    GridDataItem row = (GridDataItem)SentItem;
                    if (row != null) id = Convert.ToInt32(row["AssetRegisterItem_ID"].Text);

                    wizSubMenu.WizardSteps[1].Active = true;

                    wizSubMenu.ActiveStep.ImageUrl = imgYes;

                    wizSubMenu.WizardSteps[0].Enabled = false;
                    wizSubMenu.WizardSteps[2].Enabled = false;


                    MoveMainTab();
                }                
            }
            else
            {
                GridDataItem row = (GridDataItem)gridSearch.SelectedItems[0];
                if (row != null)  id = Convert.ToInt32(row["ID"].Text);
            }
            //LoadItem()
            AssetProperties1.AllowEdit(true);
            AssetProperties1.SearchType = Sebata.Business.Assets.Items.enSearchType.Acquisition;
            AssetProperties1.LoadData(id);
            AssetProperties1.LockSelected();

            LoadItemData(id);

            if (wizSubMenu.ActiveStepIndex == 0)
            {
                txtGRNnumber.Visible = true;
                lblGRN.Visible = true;
            }

            wizSubMenu.ActiveStep.ImageUrl = imgYes;
            MoveMainTab();

        }

        static Sebata.Business.Assets.Configuration.RegisterDetail _detail;

        private void LoadItemData(int Assetid)
        {
            DataTable dtAssetDetails = null;
            string sql = "";
            if (wizSubMenu.ActiveStepIndex == 0)
            {
                sql = " select cast(PP.ProjectCode as varchar(10)) + ' | ' + PP.ProjectName ProjectDesc ,Scoa.ScoaDesc,  SCM.ProjectItem_ID , RI.Scoa_ID , SCM.AssetRegisterItem_ID , PP.Project_ID";
                sql += " from Asset_SCMTransfer SCM inner join Asset_Register_Items RI on SCM.AssetRegisterItem_ID = RI.AssetRegisterItem_ID";
                sql += " inner join Plan_ProjectItem PPI on SCM.ProjectItem_ID = PPI.PlanProjectItem_ID";
                sql += " inner join Plan_Project PP on PPI.ProjectID = pp.Project_ID";
                sql += " inner join Const_SCOA_Structure Scoa on RI.Scoa_ID = Scoa.ScoaID";
                sql += $" where RI.AssetRegisterItem_ID = {Assetid}";
            }
            else
            {
                dtAssetDetails = _configMisc.GetTable($"select ISNULL(IssueID, 0) AS IssueID from Asset_Register_Items WHERE AssetRegisterItem_ID = {Assetid}");

                if (dtAssetDetails != null && dtAssetDetails.Rows[0][0].ToString() != "0")
                {
                    sql = $"select top 1 cast(PP.ProjectCode as varchar(10)) + ' | ' + PP.ProjectName as ProjectDesc ,Scoa.ScoaDesc,  PPI.ProjectItemID , PPI.SCOAItemID , iirli.InventoryID, {Assetid} AssetRegisterItem_ID ";
                    sql += " FROM Inven_InventoryIssue iii ";
                    sql += " INNER JOIN Inven_InventoryRequisition iir ON iii.InvRequisitionID = iir.InvRequisition_ID ";
                    sql += " INNER JOIN Inven_InventoryRequisitionLineItem iirli ON iir.InvRequisition_ID = iirli.InvRequisitionID ";
                    sql += " left outer join Plan_Project PP on iirli.PlanProjectID = pp.Project_ID ";
                    sql += " left outer join Plan_ProjectItem PPI on iirli.PlanProjectItemID = PPI.PlanProjectItem_ID ";
                    sql += " left outer join Const_SCOA_Structure Scoa on PPI.ScoaItemID = Scoa.ScoaID ";
                    sql += $" where iii.Issue_ID = {dtAssetDetails.Rows[0][0].ToString()}";
                    sql += " ORDER BY iirli.InvRequisitionLineItem_ID DESC ";
                }
                else
                {
                    sql = "select top 1 cast(PP.ProjectCode as varchar(10)) + ' | ' + PP.ProjectName as ProjectDesc ,Scoa.ScoaDesc,  SCM.ProjectItemId , PPI.SCOAItemID , SCM.InventoryID,ri.AssetRegisterItem_ID ";
                    sql += " from Inven_HighValueLineItem SCM inner ";
                    sql += " join Asset_Register_Items RI on SCM.InventoryID = RI.InventoryID ";
                    sql += " left outer join Plan_Project PP on SCM.ProjectID = pp.Project_ID ";
                    sql += " left outer join Plan_ProjectItem PPI on SCM.ProjectItemId = PPI.PlanProjectItem_ID ";
                    sql += " left outer join Const_SCOA_Structure Scoa on PPI.ScoaItemID = Scoa.ScoaID ";
                    sql += $" where ri.AssetRegisterItem_ID = {Assetid}";
                    sql += " order by scm.Inven_HighValueItemId desc ";
                }
            }

            dtAssetDetails = _configMisc.GetTable(sql);
            try
            {
                txtScoaItem.Text = dtAssetDetails.Rows[0][1].ToString();
                txtScoaItem.ToolTip = dtAssetDetails.Rows[0][1].ToString();

                txtProject.Text = dtAssetDetails.Rows[0][0].ToString();
                txtProject.ToolTip = dtAssetDetails.Rows[0][0].ToString();
                txtProjectHdn.Text = dtAssetDetails.Rows[0][5].ToString();
                txtScoaHdn.Text = dtAssetDetails.Rows[0][2].ToString();


            }
            catch { }

            _detail = _configItem.GetRegisterDetails(false, Assetid);


            // _detail = _configItem.GetRegisterDetails(Assetid);
            //  _detail = _configItem.GetRegisterDetails(dtAssetDetails.Rows[0][4].ToString().intSafe());


            if (_detail == null)
                return;

            if (_detail.ReadyForUse.Year > 1900)
                datReadyForUse.SelectedDate = _detail.ReadyForUse;
            if (_detail.VerificationDate.Year > 1900)
                datVerificationDate.SelectedDate = _detail.VerificationDate;

            decimal ul = _detail.UsefulLifeMonthComponent.ToString().decSafe();
            if (ul > 0)
            {
                txtUsefulLife.Text = ul.ToString("##0");
            }
            else
            {
                txtUsefulLife.Text = _configMisc.getUsefulLife(AssetProperties1.AssetClass_ID).ToString();
            }
            upUsefulLife.Update();


            if (String.IsNullOrEmpty(_detail.PurchaseAmount.ToString()))
            {
                txtPurchaseAmount.Text = Math.Round(Convert.ToDecimal("0" + _detail.CurrentAmount.ToString()), 2).ToString();
            }
            else
            {
                if (Convert.ToDecimal("0" + _detail.PurchaseAmount.ToString()).Equals(0))
                {
                    txtPurchaseAmount.Text = Math.Round(Convert.ToDecimal("0" + _detail.CurrentAmount.ToString()), 2).ToString();
                }
                else
                {
                    txtPurchaseAmount.Text = Math.Round(Convert.ToDecimal("0" + _detail.PurchaseAmount.ToString()), 2).ToString();
                }
            }

            if (txtPurchaseAmount.Text.decSafe() != 0)
                txtPurchaseAmount.ReadOnly = true;
            else
                txtPurchaseAmount.ReadOnly = false;

            // if (!string.IsNullOrEmpty())
            // { txtPurchaseAmount.Text = _detail.PurchaseAmount.ToString().decSafe().ToString("##0.00"); }

            txtInventory.Visible = false;
            divInventoryNumber.Visible = false;

            int HighValue_ID = 0;
            AssetsModelDataContext assdb = new AssetsModelDataContext(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString());
            System.Data.Common.DbCommand cmd = assdb.Connection.CreateCommand();

            cmd.CommandText = "select HighValueID FROM Asset_Register_Items ARI WHERE ARI.AssetRegisterItem_ID=" + _detail.AssetRegisterItem_ID;
            if (cmd.Connection.State == ConnectionState.Closed)
                cmd.Connection.Open();

            System.Data.Common.DbDataReader dr = cmd.ExecuteReader();
            if (dr.Read())
            {
                if (dr != null)
                    HighValue_ID = dr["HighValueID"].ToString().intSafe();
            }

            DateTime? GRNDate,SundryDate,InvenIssueDate;
            if (!string.IsNullOrEmpty(_detail.GRN_ID))
            {
                txtGRNnumber.Text = _configMisc.GetGRNnumber(_detail.GRN_ID, out GRNDate);
                datReadyForUse.SelectedDate = GRNDate;
            }
            else
            {
                if (_detail.SundryPaymentId > 0)
                {
                    txtGRNnumber.Text = _configMisc.GetSundryInvoiceNumber(_detail.SundryPaymentId.Value,out SundryDate);
                    datReadyForUse.SelectedDate = SundryDate;
                }
                else if (_detail.InventoryID > 0 && _detail.AssetClass_ID > 0 && HighValue_ID == null)
                {
                    txtInventory.Visible = true;
                    divInventoryNumber.Visible = true;
                    txtInventory.Text = _configMisc.GetInvIssueRefNumber(_detail.InventoryID, _detail.AssetClass_ID, out InvenIssueDate);
                    datReadyForUse.SelectedDate = InvenIssueDate;

                }
                else if (_detail.InventoryID > 0 && HighValue_ID > 0)
                {
                    txtInventory.Visible = true;
                    divInventoryNumber.Visible = true;
                    txtInventory.Text = _configMisc.GetHighValueRefNumber(_detail.InventoryID, HighValue_ID, out InvenIssueDate);
                    datReadyForUse.SelectedDate = InvenIssueDate;

                }
            }

            txtReplacementValue.Text = _detail.Replacement_Value.ToString().decSafe().ToString("##0.00");
            txtResidualValue.Text = _detail.ResidualValue.ToString().decSafe().ToString("##0.00");
            if (txtResidualValue.Text.decSafe() == 0)
                txtResidualValue.Text = "";
            else
                txtResidualValue.Text = txtResidualValue.Text.decSafe().ToString("##0.00");

            //txtDimQuantity.Text = _detail.DimensionQuantity.ToString();
            //txtDim1.Text = _detail.Dim1.ToString();
            //txtDim2.Text = _detail.Dim2.ToString();
            //txtDim3.Text = _detail.Dim3.ToString();
            //txtQuantity.Text = _detail.Quantity.ToString();

            //txtResidualValue.Text = _detail.ResidualValue.ToString();
            //txtReplacementValue.Text = _detail.Replacement_Value.ToString();
            //txtInsuredAmount.Text = _detail.InsuredAmountInsuredBy.ToString();
            //txtInsureanceRefNo.Text = _detail.InsuranceNumberReference;
            //lblInsuranceDoc.Text = _detail.InsureanceDocument;

            try
            {
                if (!string.IsNullOrEmpty(_detail.MunicipalDepartment_ID.ToString()))
                {
                    lstDepartment.SelectedValue = _detail.MunicipalDepartment_ID.ToString();
                }
                else if (!String.IsNullOrEmpty(_detail.Department.ToString()))
                { lstDepartment.SelectedValue = _detail.Department.ToString(); }

                if (!String.IsNullOrEmpty(_detail.DivisionID.ToString()))
                    lstDivision.SelectedValue = _detail.DivisionID.ToString();
                if (!String.IsNullOrEmpty(_detail.Custodian_ID.ToString()))
                    lstCustodian.SelectedValue = _detail.Custodian_ID.ToString();
            }
            catch { }
            string num = _detail.CustodianIdNumber;
            hdnCustodianIDNumber.Value = _detail.CustodianIdNumber;
            // txtCustodianNumber.Text = Mask(_detail.CustodianIdNumber);
            if (num == null)
                num = "";
            int rest = num.Length - 6;
            if (rest > 0)
                txtCustodianNumber.Text = num.Substring(0, 6).PadRight(num.Length, 'x');
            else
                txtCustodianNumber.Text = num;
            //if (!String.IsNullOrEmpty(_detail.AssetOwnership_ID.ToString()))
            //    lstOwership.SelectedValue = _detail.AssetOwnership_ID.ToString();
            txtAssetOwner.Text = _detail.AssetOwnershipName;

            //txtDeedNumber.Text = _detail.DeedNumber;
            //txtRegNumber.Text = _detail.RegistrationNumber;
            //txtErfNumber.Text = _detail.ErfNumber;
            //txtErfSize.Text = _detail.ErfSizeM2.ToString();
            //txtSerialNumber.Text = _detail.SerialNumber;

            //if (_detail.Capturer_ID == null)
            //{
            //    txtCapturer.Text = mySession.Current.UserFullName;
            //}
            //else
            //{
            txtCapturer.Text = _configMisc.GetUserFullName(_detail.Capturer_ID);
            //}

            //if (!String.IsNullOrEmpty(_detail.GIS_ID.ToString()))
            //    lstGIS.SelectedValue = _detail.GIS_ID.ToString();
            //txtGISFeature.Text = _detail.GisFeature;
            txtLatittude.Text = _detail.latitude;
            txtLogitude.Text = _detail.longitude;
            //if (!String.IsNullOrEmpty(_detail.SGNumberChange_ID.ToString()))
            //    lstSG.SelectedValue = _detail.SGNumberChange_ID.ToString();
            if (!String.IsNullOrEmpty(_detail.Town_ID.ToString()))
                lstTown.SelectedValue = _detail.Town_ID.ToString();

            if (!String.IsNullOrEmpty(_detail.SuburbID.ToString()))
                lstSuburb.SelectedValue = _detail.SuburbID.ToString();
            //txtSite.Text = _detail.SiteNumber;
            //if (!String.IsNullOrEmpty(_detail.Zoning_ID.ToString()))
            //    lstZone.SelectedValue = _detail.Zoning_ID.ToString();

            if (!String.IsNullOrEmpty(_detail.Ward_ID.ToString()))
                lstWard.SelectedValue = _detail.Ward_ID.ToString();
            if (!String.IsNullOrEmpty(_detail.Street_ID.ToString()))
                lstStreet.SelectedValue = _detail.Street_ID.ToString();

            if (!String.IsNullOrEmpty(_detail.Building_ID.ToString()))
                lstBuilding.SelectedValue = _detail.Building_ID.ToString();
            if (!String.IsNullOrEmpty(_detail.FloorID.ToString()))
                lstFloor.SelectedValue = _detail.FloorID.ToString();

            if (!String.IsNullOrEmpty(_detail.Room_ID.ToString()))
                lstRoom.SelectedValue = _detail.Room_ID.ToString();


            //if (String.IsNullOrEmpty(_detail.InsureanceDocument))
            //    aInsurranceDoc.HRef = "";
            //else
            //{
            //    string docFolder = ""; //get the document folder
            //    aInsurranceDoc.HRef = docFolder + _detail.InsureanceDocument;
            //    lblInsuranceDoc.Text = _detail.InsureanceDocument;
            //}


            //imgImage.ImageUrl = "data:image;base64," + Convert.ToBase64String(_detail.Image);
            if (_detail.Image != null)
            {
                string imageUrl = "data:image/jpg;base64," + Convert.ToBase64String(_detail.Image);
            }
            
            
        }


        private string GetFinDetails(int assetRegisterItem_ID)
        {
            DataRow record = _configItem.GetFinDetail(assetRegisterItem_ID);

            string retVal = "0.00";
            if (record != null)
                retVal = record["CurrentValue"].ToString().decSafe().ToString("##0.00");

            decimal carryingValue;
            decimal residualValue;
            DateTime readyforUse;
            decimal usefulLife;
            int daysfromLastRun;
            decimal accumulatedDepreciation;

            //decimal DepreciationAmount = _depreciation.CalculateDepreciation(assetRegisterItem_ID, out carryingValue, out residualValue, out readyforUse, out usefulLife, out daysfromLastRun, out accumulatedDepreciation);

            //hdnDepreciationValue.Value = DepreciationAmount.ToString();
            //hdnCurrentAmount.Value = carryingValue.ToString();

            return retVal;

        }

        protected void wizDetail_ActiveStepChanged(object sender, EventArgs e)
        {
            switch (wizDetail.ActiveStep.ID)
            {
                case "stepDetail":
                    break;
                default:
                    break;
            }
        }

        protected void btnPrev_Click(object sender, EventArgs e)
        {
            ValidateStep();
            wizDetail.ActiveStep.Enabled = false;
            wizDetail.ActiveStepIndex--;
            //if (!wizDetail.ActiveStep.Visible)
            //if (wizDetail.ActiveStep.ID == null)
            //    wizDetail.ActiveStepIndex--;

            wizDetail.ActiveStep.Enabled = true;

            if (wizDetail.ActiveStepIndex == 0)
                btnPrev.Visible = false;

            btnNext.Visible = true;
            btnSubmit.Visible = false;
        }

        protected void btnDonorPrev_Click(object sender, EventArgs e)
        {
            ValidateStep();
            wizDetailDonor.ActiveStep.Enabled = false;
            wizDetailDonor.ActiveStepIndex--;
            //if (!wizDetail.ActiveStep.Visible)
            //if (wizDetail.ActiveStep.ID == null)
            //    wizDetail.ActiveStepIndex--;

            wizDetailDonor.ActiveStep.Enabled = true;

            if (wizDetailDonor.ActiveStepIndex == 0)
                btnDonorPrev.Visible = false;

            btnDonorNext.Visible = true;
            btnDonorSubmit.Visible = false;
        }

        private bool ValidateStep()
        {
            bool validated = true;

            string aStepID;
            if (forDonations)
                aStepID = wizDetailDonor.ActiveStep.ID;
            else
                aStepID = wizDetail.ActiveStep.ID;

            switch (aStepID)
            {
                case "stepDetail":
                    validated = ValidateDetails();
                    break;
                case "stepOwnership":
                    validated = ValidateOwership();
                    break;
                case "stepLocation":
                    validated = ValidateLocation();
                    break;

                case "stepDonorDetail":
                    validated = ValidateDonorDetails();
                    break;
                case "stepDonorOwnership":
                    validated = ValidateDonorOwership();
                    break;
                case "stepDonorLocation":
                    validated = ValidateDonorLocation();
                    break;
                case "stepDonor":
                    validated = ValidateDonor();
                    break;
                case "stepDonorFinancial":
                    validated = ValidateDonorFinancial();
                    break;
            }
            return validated;
        }

        private bool ValidateDonor()
        {
            bool retval = true;

            if (datDonorDonationDate.SelectedDate == null)
            {
                retval = false;
                datDonorDonationDate.BorderColor = Color.Red;
                datDonorDonationDate.BorderWidth = 2;
            }
            else
                datDonorDonationDate.BorderColor = Color.White;

            if (txtDonorID.Text == "")
            {
                retval = false;
                txtDonorID.BorderColor = Color.Red;
                txtDonorID.BorderWidth = 2;
            }
            else
                txtDonorID.BorderColor = Color.White;

            if (txtDonorName.Text == "")
            {
                retval = false;
                txtDonorName.BorderColor = Color.Red;
                txtDonorName.BorderWidth = 2;
            }
            else
                txtDonorName.BorderColor = Color.White;

            if (fileDonor.HasFile)
            {
                //UploadDonorFile();
                lblDonorFileName.Text = UploadFile(fileDonor);

                fileDonor.BorderColor = Color.White;
            }
            else if (lblDonorFileName.Text == "")
            {
                retval = false;
                fileDonor.BorderColor = Color.Red;
                fileDonor.BorderWidth = 2;
            }
            else
            {
                fileDonor.BorderColor = Color.White;
                fileDonor.Width = 90;
            }
            if (retval)
                stepDonor.ImageUrl = imgYes;
            else
                stepDonor.ImageUrl = imgNo;

            return retval;
        }

        private bool ValidateDonorFinancial()
        {
            bool retval = true;

            if (txtDonorAssetValue.Text.decSafe() <= 0)
            {
                retval = false;
                txtDonorAssetValue.BorderColor = Color.Red;
                txtDonorAssetValue.BorderWidth = 2;
            }
            else
                txtDonorAssetValue.BorderColor = Color.White;

            if (lstDonorPlanningProjectDt.SelectedValue.intSafe() <= 0)
            {
                retval = false;
                lstDonorPlanningProjectDt.BorderColor = Color.Red;
                lstDonorPlanningProjectDt.BorderWidth = 2;
            }
            else
                lstDonorPlanningProjectDt.BorderColor = Color.White;

            if (lstDonorPlanningProjectCt.SelectedValue.intSafe() <= 0)
            {
                retval = false;
                lstDonorPlanningProjectCt.BorderColor = Color.Red;
                lstDonorPlanningProjectCt.BorderWidth = 2;
            }
            else
                lstDonorPlanningProjectCt.BorderColor = Color.White;

            if (lstDonorScoaITemDt.SelectedValue.intSafe() <= 0)
            {
                retval = false;
                lstDonorScoaITemDt.BorderColor = Color.Red;
                lstDonorScoaITemDt.BorderWidth = 2;
            }
            else
                lstDonorScoaITemDt.BorderColor = Color.White;

            if (lstDonorScoaITemCt.SelectedValue.intSafe() <= 0)
            {
                retval = false;
                lstDonorScoaITemCt.BorderColor = Color.Red;
                lstDonorScoaITemCt.BorderWidth = 2;
            }
            else
                lstDonorScoaITemCt.BorderColor = Color.White;

            if (retval)
                stepDonorFinancial.ImageUrl = imgYes;
            else
                stepDonorFinancial.ImageUrl = imgNo;

            return retval;
        }

        private bool ValidateOwership()
        {
            bool retval = true;

            if (lstDepartment.SelectedValue.intSafe() <= 0)
            {
                retval = false;
                lstDepartment.BorderColor = Color.Red;
                lstDepartment.BorderWidth = 2;
            }
            else
                lstDepartment.BorderColor = Color.White;

            if (lstDivision.SelectedValue.intSafe() <= 0)
            {
                retval = false;
                lstDivision.BorderColor = Color.Red;
                lstDivision.BorderWidth = 2;
            }
            else
                lstDivision.BorderColor = Color.White;

            if (lstCustodian.SelectedValue.intSafe() <= 0)
            {
                retval = false;
                lstCustodian.BorderColor = Color.Red;
                lstCustodian.BorderWidth = 2;
            }
            else
                lstCustodian.BorderColor = Color.White;

            //if (lstOwership.SelectedValue.intSafe() <= 0)
            //{
            //    retval = false;
            //    lstOwership.BorderColor = Color.Red;
            //    lstOwership.BorderWidth = 2;
            //}
            //else
            //    lstOwership.BorderColor = Color.White;
            if (txtAssetOwner.Text == "")
            {
                retval = false;
                txtAssetOwner.BorderColor = Color.Red;
                txtAssetOwner.BorderWidth = 2;
            }
            else
                txtAssetOwner.BorderColor = Color.White;

            if (retval)
                stepOwnership.ImageUrl = imgYes;
            else
                stepOwnership.ImageUrl = imgNo;

            return retval;
        }

        private bool ValidateDonorOwership()
        {
            bool retval = true;

            if (lstDonorDepartment.SelectedValue.intSafe() <= 0)
            {
                retval = false;
                lstDonorDepartment.BorderColor = Color.Red;
                lstDonorDepartment.BorderWidth = 2;
            }
            else
                lstDonorDepartment.BorderColor = Color.White;

            if (lstDonorDivision.SelectedValue.intSafe() <= 0)
            {
                retval = false;
                lstDonorDivision.BorderColor = Color.Red;
                lstDonorDivision.BorderWidth = 2;
            }
            else
                lstDonorDivision.BorderColor = Color.White;

            if (lstDonorCustodian.SelectedValue.intSafe() <= 0)
            {
                retval = false;
                lstDonorCustodian.BorderColor = Color.Red;
                lstDonorCustodian.BorderWidth = 2;
            }
            else
                lstDonorCustodian.BorderColor = Color.White;

            //if (lstOwership.SelectedValue.intSafe() <= 0)
            //{
            //    retval = false;
            //    lstOwership.BorderColor = Color.Red;
            //    lstOwership.BorderWidth = 2;
            //}
            //else
            //    lstOwership.BorderColor = Color.White;
            if (txtDonorAssetOwner.Text == "")
            {
                retval = false;
                txtDonorAssetOwner.BorderColor = Color.Red;
                txtDonorAssetOwner.BorderWidth = 2;
            }
            else
                txtDonorAssetOwner.BorderColor = Color.White;

            if (retval)
                stepDonorOwnership.ImageUrl = imgYes;
            else
                stepDonorOwnership.ImageUrl = imgNo;

            return retval;
        }


        private bool ValidateLocation()
        {
            bool retval = true;

            //if (txtLatittude.Text == "")
            //{
            //    retval = false;
            //    txtLatittude.BorderColor = Color.Red;
            //    txtLatittude.BorderWidth = 2;
            //}
            //else
            //    txtLatittude.BorderColor = Color.White;

            //if (txtLogitude.Text == "")
            //{
            //    retval = false;
            //    txtLogitude.BorderColor = Color.Red;
            //    txtLogitude.BorderWidth = 2;
            //}
            //else
            //    txtLogitude.BorderColor = Color.White;

            if (lstTown.SelectedValue.intSafe() <= 0)
            {
                retval = false;
                lstTown.BorderColor = Color.Red;
                lstTown.BorderWidth = 2;
            }
            else
                lstTown.BorderColor = Color.White;

            if (retval)
                stepLocation.ImageUrl = imgYes;
            else
                stepLocation.ImageUrl = imgNo;

            return retval;
        }

        private bool ValidateDonorLocation()
        {
            bool retval = true;

            //if (txtDonorLatittude.Text == "")
            //{
            //    retval = false;
            //    txtDonorLatittude.BorderColor = Color.Red;
            //    txtDonorLatittude.BorderWidth = 2;
            //}
            //else
            //    txtDonorLatittude.BorderColor = Color.White;

            //if (txtDonorLogitude.Text == "")
            //{
            //    retval = false;
            //    txtDonorLogitude.BorderColor = Color.Red;
            //    txtDonorLogitude.BorderWidth = 2;
            //}
            //else
            //    txtDonorLogitude.BorderColor = Color.White;

            if (lstDonorTown.SelectedValue.intSafe() <= 0)
            {
                retval = false;
                lstDonorTown.BorderColor = Color.Red;
                lstDonorTown.BorderWidth = 2;
            }
            else
                lstDonorTown.BorderColor = Color.White;

            if (retval)
                stepDonorLocation.ImageUrl = imgYes;
            else
                stepDonorLocation.ImageUrl = imgNo;

            return retval;
        }

        protected void btnNext_Click(object sender, EventArgs e)
        {
            ValidateStep();
            wizDetail.ActiveStep.Enabled = false;

            wizDetail.ActiveStepIndex++;

            wizDetail.ActiveStep.Enabled = true;

            if (wizDetail.ActiveStepIndex == 2)
            {
                btnNext.Visible = false;
                btnSubmit.Visible = true;
            }
            btnPrev.Visible = true;

        }

        protected void btnDonorNext_Click(object sender, EventArgs e)
        {
            ValidateStep();
            wizDetailDonor.ActiveStep.Enabled = false;

            wizDetailDonor.ActiveStepIndex++;

            wizDetailDonor.ActiveStep.Enabled = true;


            if (wizDetailDonor.ActiveStepIndex == 4)
            {
                btnDonorNext.Visible = false;
                btnDonorSubmit.Visible = true;
            }


            btnDonorPrev.Visible = true;

        }


        protected void btnSubmit_Click(object sender, EventArgs e)
        {
            bool validated = true;
            validated = ValidateDetails();
            if (validated)
                validated = ValidateOwership();
            if (validated)
                validated = ValidateLocation();

            if (validated)
            {
                //btnDialogClose.Visible = true;
                lblQuestion.Text = "Are you sure you want to Update Asset Record?";
                ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", "ShowQuestion();", true);
                //SaveAsset();
            }
            else
            {
                string msg = "Please ensure all required fields are filled in.";
                ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", "ShowError('" + msg + "');", true);

            }
        }

        protected void btnDonorSubmit_Click(object sender, EventArgs e)
        {
            bool validated = true;
            validated = ValidateDonorDetails();
            if (validated)
                validated = ValidateDonorOwership();
            if (validated)
                validated = ValidateDonorLocation();
            if (validated)
                validated = ValidateDonor();
            if (validated)
                validated = ValidateDonorFinancial();

            if (validated)
            {
                lblQuestion.Text = "Are you sure you want to submit the Donated Asset to the General Ledger?";
                ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", "ShowQuestion();", true);
                //SaveDonorAsset();
            }
            else
            {
                string msg = "Please ensure all required fields are filled in.";
                ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", "ShowError('" + msg + "');", true);
            }
        }



        private void SaveAsset()
        {
            if (_detail == null)
            {
                _detail = new Sebata.Business.Assets.Configuration.RegisterDetail();
                _detail.AssetRegisterItem_ID = (int)gridSearch.SelectedValue;
            }

            _detail.Description = AssetProperties1.AssetDescription;
            _detail.ProjectItem_ID = txtProjectHdn.Text.intSafe();
            _detail.AssetCategory_ID = AssetProperties1.AssetCategoryID;
            _detail.AssetClass_ID = AssetProperties1.AssetClass_ID;
            _detail.AssetCondition_ID = AssetProperties1.Condition_ID;
            //_detail.AssetOwnership_ID = lstOwership.SelectedValue.intSafe();
            _detail.AssetOwnershipName = txtAssetOwner.Text;
            _detail.AssetStatus_ID = AssetProperties1.AssetStatus_ID;
            _detail.AssetType_ID = AssetProperties1.AssetType_ID;
            _detail.Asset_SubCategory_ID = AssetProperties1.SubCategory_ID;
            _detail.Barcode = AssetProperties1.Barcode;
            _detail.Building_ID = lstBuilding.SelectedValue.intSafe();
            //_detail.Capturer_ID=
            _detail.CustodianIdNumber = hdnCustodianIDNumber.Value;
            _detail.Custodian_ID = lstCustodian.SelectedValue.intSafe();
            //_detail.DeedNumber=
            _detail.Department = lstDepartment.SelectedValue.intSafe();
            _detail.MunicipalDepartment_ID = lstDepartment.SelectedValue.intSafe();
            //_detail.Description
            //_detail.Dim1
            _detail.DivisionID = lstDivision.SelectedValue.intSafe();
            _detail.FloorID = lstFloor.SelectedValue.intSafe();
            //_detail.GisFeature
            //_detail.GIS_ID
            //_detail.GRN_ID=
            //_detail.Image
            //_detail.InsuranceNumberReference
            _detail.latitude = txtLatittude.Text;
            _detail.longitude = txtLogitude.Text;
            _detail.MeasurementType_ID = AssetProperties1.MeasurementType_ID;
            //_detail.Modifier_ID=
            _detail.PurchaseAmount = txtPurchaseAmount.Text.decSafe();
            _detail.CurrentAmount = txtPurchaseAmount.Text.decSafe();
            _detail.Quantity = 1;
            _detail.ReadyForUse = Convert.ToDateTime(((DateTime)datReadyForUse.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());

            //_detail.RegistrationNumber

            _detail.CurrentReplacementCostCRC = txtReplacementValue.Text.decSafe();
            _detail.DepreciatedReplacementCostDRC = txtPurchaseAmount.Text.decSafe();
            _detail.ResidualValue = txtResidualValue.Text.decSafe();
            _detail.Room_ID = lstRoom.SelectedValue.intSafe();
            //_detail.SerialNumber
            //_detail.SGNumberChange_ID
            //_detail.SiteNumber
            _detail.Street_ID = lstStreet.SelectedValue.intSafe();
            _detail.SuburbID = lstSuburb.SelectedValue.intSafe();
            _detail.Town_ID = lstTown.SelectedValue.intSafe();
            _detail.TypeID = AssetProperties1.AssetType_ID;
            //_detail.UoM
            _detail.UsefulLifeMonthComponent = txtUsefulLife.Text.decSafe();
            _detail.RemainingUsefulLife = txtUsefulLife.Text.decSafe();
            _detail.VerificationDate = Convert.ToDateTime(((DateTime)datVerificationDate.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());
            _detail.Ward_ID = lstWard.SelectedValue.intSafe();

            _detail.Approval_ID = mySession.Current.User_ID;

            _detail.ImageRef = _imageName;
            _detail.Image = _imgBytes;
            _detail.ManagedFlag = true;
            _detail.TransactionProjectDR = Convert.ToInt32(txtProjectHdn.Text);
            _detail.TransactionProjectItemDR = Convert.ToInt32(txtScoaHdn.Text);

            _detail.AcquisitionDate = Convert.ToDateTime(((DateTime)datReadyForUse.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());
            _detail.Risk = -1;
            _detail.VerifyID = lstVerifyID.SelectedValue.intSafe();          
            _detail.AcquisitionDate = Convert.ToDateTime(((DateTime)datReadyForUse.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());
            _detail.InServiceDate = Convert.ToDateTime(((DateTime)datInService.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());
            //_detail.InventoryID = txtInventory.Text.intSafe();

            //_detail.Zoning_ID
            try
            {
                int saved = _configItem.SaveRegisterDetails(false, _detail);
                int retVal = 0;
                string conn = Sebata.Fms.Common.CommonTasks.GetEmsConnectionString();
                int usr = mySession.Current.User_ID;
                string finyear = FMSWebApp.Ledger.CommonLedger.GetFinYear();
                DataBase _db = new DataBase(conn, usr);
                string sql = $"EXEC Asset_Transaction_Summary_Populate_single {saved}, '{finyear}', 1";
                retVal = _db.Execute(sql, null);

                string msg = $"Asset with  Asset Register ID {saved} has been added successfully.";

                //                string msg = "Asset Record and Asset Register successfully updated.";


                if (saved == 0)
                {
                    msg = "Could not Approve the Asset Register Item.";
                    ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", "ShowError('" + msg + "');", true);
                }
                else
                {
                    Session["aquisitionmsg"] = msg;
                    Response.Redirect(_pageName);
                    //Page.ClientScript.RegisterStartupScript(GetType(), "classupdated", "ShowUpdated('" + msg + "');", true);
                }

            }
            catch { }

            //ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", "ShowUpdated('" + msg + "');", true);

        }

        private static byte[] _imgBytes;
        private static byte[] _fileBytes;

        private void GetFileBytes(string fileName)
        {
            FileStream fs = new FileStream(fileName, FileMode.Open, FileAccess.Read);

            // Create a byte array of file stream length
            byte[] ImageData = new byte[fs.Length];

            //Read block of bytes from stream into the byte array
            fs.Read(ImageData, 0, System.Convert.ToInt32(fs.Length));

            //Close the File Stream
            fs.Close();
            _fileBytes = ImageData; //return the byte data
        }

        private void GetImg(string imageFile)
        {
            FileStream fs = new FileStream(imageFile, FileMode.Open, FileAccess.Read);

            // Create a byte array of file stream length
            byte[] ImageData = new byte[fs.Length];

            //Read block of bytes from stream into the byte array
            fs.Read(ImageData, 0, System.Convert.ToInt32(fs.Length));

            //Close the File Stream
            fs.Close();

            _imgBytes = ImageData;
        }

        private void SaveDonorAsset()
        {
            
            _detail = new Sebata.Business.Assets.Configuration.RegisterDetail();

            _detail.AssetRegisterItem_ID = null;
            _detail.Description = AssetPropertiesDonor1.AssetDescription;
            _detail.AssetCategory_ID = AssetPropertiesDonor1.AssetCategoryID;
            _detail.AssetClass_ID = AssetPropertiesDonor1.AssetClass_ID;
            _detail.AssetCondition_ID = AssetPropertiesDonor1.Condition_ID;
            //_detail.AssetOwnership_ID = lstOwership.SelectedValue.intSafe();
            _detail.AssetOwnershipName = txtDonorAssetOwner.Text;
            _detail.AssetStatus_ID = AssetPropertiesDonor1.AssetStatus_ID;
            _detail.AssetType_ID = AssetPropertiesDonor1.AssetType_ID;
            _detail.Asset_SubCategory_ID = AssetPropertiesDonor1.SubCategory_ID;
            _detail.Barcode = AssetPropertiesDonor1.Barcode;
            _detail.Building_ID = lstDonorBuilding.SelectedValue.intSafe();
            //_detail.Capturer_ID=
            _detail.CustodianIdNumber = txtDonorCustodianNumber.Text;
            _detail.Custodian_ID = lstDonorCustodian.SelectedValue.intSafe();
            //_detail.DeedNumber=
            _detail.Department = lstDonorDepartment.SelectedValue.intSafe();
            //_detail.Description
            //_detail.Dim1
            _detail.DivisionID = lstDonorDivision.SelectedValue.intSafe();
            _detail.FloorID = lstDonorFloor.SelectedValue.intSafe();
            //_detail.GisFeature
            //_detail.GIS_ID
            //_detail.GRN_ID=
            //_detail.Image
            //_detail.InsuranceNumberReference
            _detail.latitude = txtDonorLatittude.Text;
            _detail.longitude = txtDonorLogitude.Text;
            _detail.MeasurementType_ID = AssetPropertiesDonor1.MeasurementType_ID;
            //_detail.Modifier_ID=
            _detail.PurchaseAmount = txtDonorAssetValue.Text.decSafe();
            _detail.CurrentAmount = txtDonorAssetValue.Text.decSafe();
            _detail.CurrentReplacementCostCRC = txtDonorAssetValue.Text.decSafe();
            _detail.DepreciatedReplacementCostDRC = txtDonorAssetValue.Text.decSafe();
            _detail.Quantity = 1;
            _detail.ReadyForUse = Convert.ToDateTime(((DateTime)datDonorReadyForUse.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());
            //_detail.RegistrationNumber
            //_detail.Replacement_Value = txtDonorReplacementValue.Text.decSafe();
            //_detail.ResidualValue = txtDonorResidualValue.Text.decSafe();
            _detail.Room_ID = lstDonorRoom.SelectedValue.intSafe();
            //_detail.SerialNumber
            //_detail.SGNumberChange_ID
            //_detail.SiteNumber
            _detail.Street_ID = lstDonorStreet.SelectedValue.intSafe();
            _detail.SuburbID = lstDonorSuburb.SelectedValue.intSafe();
            _detail.Town_ID = lstDonorTown.SelectedValue.intSafe();
            _detail.TypeID = AssetPropertiesDonor1.AssetType_ID;
            //_detail.UoM
            _detail.UsefulLifeMonthComponent = txtDonorUsefulLife.Text.decSafe();
            _detail.RemainingUsefulLife = txtDonorUsefulLife.Text.decSafe();
            _detail.VerificationDate = Convert.ToDateTime(((DateTime)datDonorVerificationDate.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());
            _detail.Ward_ID = lstDonorWard.SelectedValue.intSafe();

            _detail.Approval_ID = mySession.Current.User_ID;

            _detail.Date_Donated = Convert.ToDateTime(((DateTime)datDonorDonationDate.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());


            _detail.DonorRegNumber = txtDonorID.Text;
            _detail.Donor_Name = txtDonorName.Text;

            _detail.TransactionProjectDR = lstDonorPlanningProjectDt.SelectedValue.intSafe();
            _detail.TransactionProjectItemDR = lstDonorScoaITemDt.SelectedValue.intSafe();
            _detail.TransactionProjectCR = lstDonorPlanningProjectCt.SelectedValue.intSafe();
            _detail.TransactionProjectItemCR = lstDonorScoaITemCt.SelectedValue.intSafe();

            _detail.ImageRef = _imageName;
            _detail.Image = _imgBytes;
            _detail.DonationDocument = lblDonorFileName.Text;
            _detail.ManagedFlag = true;
            _detail.AcquisitionDate = Convert.ToDateTime(((DateTime)datDonorDonationDate.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());

            _detail.Risk = -1;

            //_detail.Zoning_ID
            
            int saved = _configItem.SaveRegisterDetails(false, _detail);
            int retVal = 0;
            string conn = Sebata.Fms.Common.CommonTasks.GetEmsConnectionString();
            int usr = mySession.Current.User_ID;
            string finyear = FMSWebApp.Ledger.CommonLedger.GetFinYear();
            DataBase _db = new DataBase(conn, usr);
            string sql = $"EXEC Asset_Transaction_Summary_Populate_single {saved}, '{finyear}', 1";
            retVal = _db.Execute(sql, null);

            //save the donor file
            //fileDonor.SaveAs(Server.MapPath("~/Uploads/" + Path.GetFileName(fileDonor.FileName)));

            string msg = $"Asset with  Asset Register ID {saved} has been added successfully. Journal entries posted.";

            if (saved == 0)
            {
                msg = "Could not Approve the Asset Register Item.";
                //btnDialogClose.Visible = true;
                //btnDialogOK.Visible = false;
                ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", "ShowError('" + msg + "');", true);
            }
            else
            {
                //btnDialogClose.Visible = false;
                //btnDialogClose.Visible = false;
                //ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", "ShowUpdated('" + msg + "');", true);
                Session["aquisitionmsg"] = msg;
                Response.Redirect(_pageName);

            }


        }


        private string UploadFile(FileUpload fileuploader, bool isImage = false)
        {
            string rootfile = CommonTasks.GetfullPath("FolderAssetDocuments");
            if (fileuploader.FileName == "")
                return "";

            if (String.IsNullOrEmpty(rootfile))
                rootfile = "c:\\AssetDocuments\\";
            string datetimestr = string.Format(CultureInfo.InvariantCulture, "{0:ddMMyyyyHHmmss}", DateTime.Now);

            string ext = fileuploader.FileName.Substring(fileuploader.FileName.LastIndexOf('.'));
            ext = "." + ext.Split(".".ToCharArray())[1];
            int filenum = 0;
            string fname = fileuploader.FileName;
            string thePath = string.Format("{0}{1}{2}", rootfile, datetimestr, fname);
            string group = "Assets";
            string fileDesc = "Asset Donation from " + txtDonorName.Text.ToString();
            string uploadFilename = string.Format("{0}{1}", datetimestr, fname);

            //if the file already exists it gives an error
            while (System.IO.File.Exists(thePath))
            {
                filenum++;
                fname = fileuploader.FileName.Replace(ext, filenum.ToString() + ext);
                thePath = string.Format("{0}{1}{2}", rootfile, datetimestr, fname);
            }
            iViewUploadDocuments.AddDocuments(uploadFilename, string.Format(CultureInfo.InvariantCulture, "{0:ddMMyyyyHHmmss}", DateTime.Now), group, fileDesc);
            fileuploader.SaveAs(thePath);
            fileuploader.FileContent.Close();

            string FileNumber = "";
            if (Request.QueryString["fn"] != null)
                FileNumber = Request.QueryString["fn"].ToString();

            Session[$"AssetUploadedFile{FileNumber}"] = fname;
            Session[$"AssetFile{FileNumber}"] = fileuploader.FileName;

            if (isImage)
            {
                GetImg(thePath);
                return fileuploader.FileName;
            }
            else
            {
                GetFileBytes(thePath);
                return datetimestr + fileuploader.FileName;
            }

        }

        private void ClearScreen()
        {
            AssetPropertiesDonor1.Clear();

            datDonorReadyForUse.Clear();
            datDonorVerificationDate.Clear();
            //txtDonorPurchaseAmount.Text = "";

            txtDonorUsefulLife.Text = "";
            upDonorUsefulLife.Update();
            //txtDonorGRNnumber.Text = "";

        }

        protected void lstDepartment_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (forDonations)
            {
                LoadDivisions(lstDonorDepartment.SelectedValue.intSafe());
                LoadCustodian(lstDonorDepartment.SelectedValue.intSafe());
            }
            else
            {
                LoadDivisions(lstDepartment.SelectedValue.intSafe());
                LoadCustodian(lstDepartment.SelectedValue.intSafe());
            }
        }

        private void LoadDivisions(int? departmentId = null)
        {
            if (departmentId == 0)
                departmentId = null;

            string sql = "SELECT Division_ID, DivisionDesc + '('+ DivisionCode +')' DivisionDesc FROM Const_Division";
            if (departmentId != null)
                sql += $" WHERE  DepartmentID = {departmentId}";

            DropDownList lst;
            if (forDonations)
                lst = lstDonorDivision;
            else

                lst = lstDivision;

            lst.Items.Clear();

            if (lst.Items.Count == 0)
            {
                lst.DataSource = _configMisc.GetTable(sql);

                lst.DataValueField = "Division_ID";
                lst.DataTextField = "DivisionDesc";
                lst.DataBind();
                lst.Items.Insert(0, new ListItem("", "0"));

            }
        }

        private void LoadCustodian(int? DepartmentID = null)
        {
            if (DepartmentID == 0)
                DepartmentID = null;

            //maybe the manager ???

            string sql = "EXEC Asset_GetCustodianDepartment";
            if (DepartmentID == null)
                DepartmentID = 0;

            sql += $" {DepartmentID}";

            DropDownList lst;
            if (forDonations)
                lst = lstDonorCustodian;
            else
                lst = lstCustodian;

            if (lst.Items.Count == 0)
            {
                lst.DataSource = _configMisc.GetTable(sql);

                lst.DataValueField = "Employee_ID";
                lst.DataTextField = "Emp_Name";
                lst.DataBind();
                lst.Items.Insert(0, new ListItem("", "0"));

            }

            if (lstVerifyID.Items.Count == 0)
            {
                lstVerifyID.DataSource = _configMisc.GetTable(sql);

                lstVerifyID.DataValueField = "Employee_ID";
                lstVerifyID.DataTextField = "Emp_Name";
                lstVerifyID.DataBind();
                lstVerifyID.Items.Insert(0, new ListItem("", "0"));

            }
        }

        protected void lstCustodian_SelectedIndexChanged(object sender, EventArgs e)
        {
            string num = "";
            int rest = 0;
            if (forDonations)
            {
                num = _configMisc.GetCustodianNumber(lstDonorCustodian.SelectedValue.intSafe());
                rest = num.Length - 6;
                if (rest > 0)
                    txtDonorCustodianNumber.Text = num.Substring(0, 6).PadRight(num.Length, 'x');
                else
                    txtDonorCustodianNumber.Text = num;

            }
            else
            {
                num = _configMisc.GetCustodianNumber(lstCustodian.SelectedValue.intSafe());
                rest = num.Length - 6;
                if (rest > 0)
                    txtCustodianNumber.Text = num.Substring(0, 6).PadRight(num.Length, 'x');
                else
                    txtCustodianNumber.Text = num;
            }




        }

        protected void lstTown_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (forDonations)
            {
                LoadSuburbs(lstDonorTown.SelectedValue.intSafe());
            }
            else
            {
                LoadSuburbs(lstTown.SelectedValue.intSafe());
            }
            LoadStreets();
            LoadBuildings();
            LoadFloors();
            LoadRooms();
        }

        private void LoadSuburbs(int? townID = null)
        {
            if (townID == 0)
                townID = null;

            string sql = "SELECT Suburb_ID, SuburbName FROM Const_Suburb";
            if (townID != null)
                sql += $" WHERE  townID = {townID}";

            DropDownList lst;
            if (forDonations)
                lst = lstDonorSuburb;
            else
                lst = lstSuburb;

            lst.Items.Clear();

            if (lst.Items.Count == 0)
            {
                lst.DataSource = _configMisc.GetTable(sql);

                lst.DataValueField = "Suburb_ID";
                lst.DataTextField = "SuburbName";
                lst.DataBind();
                lst.Items.Insert(0, new ListItem("", "0"));

            }
        }

        private void LoadStreets(int? suburbID = null)
        {
            if (suburbID == 0)
                suburbID = null;

            string sql = "SELECT Street_ID, StreetName FROM Const_Street";
            if (suburbID != null)
                sql += $" WHERE  suburbID = {suburbID}";

            DropDownList lst;
            if (forDonations)
                lst = lstDonorStreet;
            else
                lst = lstStreet;

            lst.Items.Clear();

            if (lst.Items.Count == 0)
            {
                lst.DataSource = _configMisc.GetTable(sql);

                lst.DataValueField = "Street_ID";
                lst.DataTextField = "StreetName";
                lst.DataBind();
                lst.Items.Insert(0, new ListItem("", "0"));

            }
        }

        //private void LoadBuildings(int? streetID = null)
        //{
        //    LoadBuildings(false, streetID);
        //}
        private void LoadBuildings(int? streetID = null)
        {
            if (streetID == 0)
                streetID = null;

            string sql = "SELECT Building_ID, BuildingDesc FROM Const_Building";
            if (streetID != null)
                sql += $" WHERE StreetID = {streetID}";

            DropDownList lst;
            if (forDonations)
                lst = lstDonorBuilding;
            else
                lst = lstBuilding;

            lst.Items.Clear();

            if (lst.Items.Count == 0)
            {
                lst.DataSource = _configMisc.GetTable(sql);

                lst.DataValueField = "Building_ID";
                lst.DataTextField = "BuildingDesc";
                lst.DataBind();
                lst.Items.Insert(0, new ListItem("", "0"));

            }

        }

        //private void LoadFloors(int? buildingId = null)
        //{
        //    LoadFloors(false, buildingId);
        //}
        private void LoadFloors(int? buildingId = null)
        {
            if (buildingId == 0)
                buildingId = null;

            string sql = "SELECT Floor_ID, FloorDesc FROM Const_Floor";
            if (buildingId != null)
                sql += $" WHERE  BuildingID = {buildingId}";

            DropDownList lst;
            if (forDonations)
                lst = lstDonorFloor;
            else
                lst = lstFloor;

            lst.Items.Clear();

            if (lst.Items.Count == 0)
            {
                lst.DataSource = _configMisc.GetTable(sql);

                lst.DataValueField = "Floor_ID";
                lst.DataTextField = "FloorDesc";
                lst.DataBind();
                lst.Items.Insert(0, new ListItem("", "0"));

            }
        }

        //private void LoadRooms(int? floorID = null)
        //{
        //    LoadRooms(false, floorID);
        //}
        private void LoadRooms(int? floorID = null)
        {
            if (floorID == 0)
                floorID = null;

            string sql = "SELECT Room_ID, RoomDesc FROM Const_Room";
            if (floorID != null)
                sql += $" WHERE  FloorID = {floorID}";

            DropDownList lst;
            if (forDonations)
                lst = lstDonorRoom;
            else
                lst = lstRoom;

            lst.Items.Clear();

            if (lst.Items.Count == 0)
            {
                lst.DataSource = _configMisc.GetTable(sql);

                lst.DataValueField = "Room_ID";
                lst.DataTextField = "RoomDesc";
                lst.DataBind();
                lst.Items.Insert(0, new ListItem("", "0"));

            }
        }

        protected void lstSuburb_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (forDonations)
            {
                LoadStreets(lstDonorSuburb.SelectedValue.intSafe());
            }
            else
            {
                LoadStreets(lstSuburb.SelectedValue.intSafe());
            }
            LoadBuildings();
            LoadFloors();
            LoadRooms();
        }

        protected void lstStreet_SelectedIndexChanged(object sender, EventArgs e)
        {
            int? streetID = null;
            if (forDonations)
            {
                if (lstDonorStreet.SelectedValue.intSafe() >= 0)
                    streetID = lstDonorStreet.SelectedValue.intSafe();
            }
            else
            {
                if (lstStreet.SelectedValue.intSafe() != 0)
                    streetID = lstStreet.SelectedValue.intSafe();

            }
            LoadBuildings(streetID);
            LoadFloors();
            LoadRooms();
        }

        protected void lstBuilding_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (forDonations)
            {
                LoadFloors(lstDonorBuilding.SelectedValue.intSafe());
            }
            else
            {
                LoadFloors(lstBuilding.SelectedValue.intSafe());
            }
            LoadRooms();
        }

        protected void lstFloor_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (forDonations)
            {
                LoadRooms(lstDonorFloor.SelectedValue.intSafe());
            }
            else
            {
                LoadRooms(lstFloor.SelectedValue.intSafe());
            }
        }

        private void LoadDepartments()
        {
            string sql = "SELECT Department_ID, DepartmentDesc FROM Const_Department";

            DropDownList lst;
            if (forDonations)
                lst = lstDonorDepartment;
            else
                lst = lstDepartment;

            lst.Items.Clear();

            if (lst.Items.Count == 0)
            {
                lst.DataSource = _configMisc.GetTable(sql);

                lst.DataValueField = "Department_ID";
                lst.DataTextField = "DepartmentDesc";
                lst.DataBind();
                lst.Items.Insert(0, new ListItem("", "0"));
            }
        }

        //private void LoadOwership()
        //{
        //    string sql = "SELECT AssetOwnership_ID, AssetOwnershipDesc FROM Const_AssetOwnership";
        //    //if (buildingId != null)
        //    //    sql += $" WHERE  BuildingntID = {buildingId}";

        //    lstOwership.Items.Clear();

        //    if (lstOwership.Items.Count == 0)
        //    {
        //        lstOwership.DataSource = _configMisc.GetTable(sql);

        //        lstOwership.DataValueField = "AssetOwnership_ID";
        //        lstOwership.DataTextField = "AssetOwnershipDesc";
        //        lstOwership.DataBind();
        //        lstOwership.Items.Insert(0, new ListItem("", "0"));

        //    }
        //}

        private void LoadTowns(int? ProviceID = null)
        {
            if (ProviceID == 0)
                ProviceID = null;

            string sql = "SELECT Town_ID, Town FROM Const_Town";
            if (ProviceID != null)
                sql += $" WHERE  ProviceID = {ProviceID}";

            DropDownList lst;
            if (forDonations)
                lst = lstDonorTown;
            else
                lst = lstTown;

            lst.Items.Clear();

            if (lst.Items.Count == 0)
            {
                lst.DataSource = _configMisc.GetTable(sql);

                lst.DataValueField = "Town_ID";
                lst.DataTextField = "Town";
                lst.DataBind();
                lst.Items.Insert(0, new ListItem("", "0"));

            }
        }

        private void LoadWards()
        {
            string sql = "SELECT Ward_ID, WardDescription FROM Const_Ward";

            DropDownList lst;
            if (forDonations)
                lst = lstDonorWard;
            else
                lst = lstWard;

            lst.Items.Clear();

            if (lst.Items.Count == 0)
            {
                lst.DataSource = _configMisc.GetTable(sql);

                lst.DataValueField = "Ward_ID";
                lst.DataTextField = "WardDescription";
                lst.DataBind();
                lst.Items.Insert(0, new ListItem("", "0"));

            }
        }


        private void LoadDropDowns()
        {
            LoadBuildings();
            LoadDepartments();
            LoadCustodian();
            LoadDivisions();
            LoadFloors();
            //LoadGIS();
            //LoadOwership();
            LoadRooms();
            //LoadSG();
            LoadStreets();
            LoadSuburbs();
            LoadTowns();
            //LoadUOMs();
            LoadWards();
            //LoadZones();
        }


        protected void btnDialogOK_Click(object sender, EventArgs e)
        {
            //Response.Redirect(this._pageName);
            if (forDonations)
                SaveDonorAsset();
            else
                SaveAsset();
        }

        static DataTable projectList = null;

        private void BuildProjectDropDown(DropDownList dropdown, string ProjectType, string PositionStatementType)
        {
            Sebata.Business.Assets.Configuration.mSCOA _configmSCOA = new Sebata.Business.Assets.Configuration.mSCOA(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);

            if (projectList == null)
                projectList = _configmSCOA.GetProjects(mySession.Current.UserFinYear, ProjectType, PositionStatementType);

            dropdown.Items.Clear();
            dropdown.DataSource = projectList;
            dropdown.DataTextField = "ProjectField";
            dropdown.DataValueField = "Project_ID";
            dropdown.DataBind();
            dropdown.Items.Insert(0, new ListItem("--Select--", "-1"));
        }

        protected void lstDonorPlanningProjectDt_SelectedIndexChanged(object sender, EventArgs e)
        {
            Sebata.Business.Assets.Configuration.mSCOA _configmSCOA = new Sebata.Business.Assets.Configuration.mSCOA(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);

            DataTable items = _configmSCOA.GetProjectItems(Convert.ToInt32(lstDonorPlanningProjectDt.SelectedValue));

            lstDonorScoaITemDt.DataSource = items;

            lstDonorScoaITemDt.DataTextField = "ItemDescription";
            lstDonorScoaITemDt.DataValueField = "PlanProjectItem_ID";

            lstDonorScoaITemDt.DataBind();
            lstDonorScoaITemDt.Items.Insert(0, new ListItem("--Select--", "-1"));

            _configmSCOA = null;

        }

        protected void lstDonorPlanningProjectCt_SelectedIndexChanged(object sender, EventArgs e)
        {
            Sebata.Business.Assets.Configuration.mSCOA _configmSCOA = new Sebata.Business.Assets.Configuration.mSCOA(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);

            DataTable items = _configmSCOA.GetProjectItems(Convert.ToInt32(lstDonorPlanningProjectCt.SelectedValue));

            lstDonorScoaITemCt.DataSource = items;
            lstDonorScoaITemCt.DataTextField = "ItemDescription";
            lstDonorScoaITemCt.DataValueField = "PlanProjectItem_ID";

            lstDonorScoaITemCt.DataBind();
            lstDonorScoaITemCt.Items.Insert(0, new ListItem("--Select--", "-1"));


            _configmSCOA = null;
        }

        protected void btnUploadDonor_Click(object sender, EventArgs e)
        {
            lblDonorFileName.Text = UploadFile(fileDonor);
        }

        protected void btnUploadImage_Click(object sender, EventArgs e)
        {
            _imageName = UploadFile(fileUploadImage, true);
            lblfileuploadimage.Text = _imageName;
        }

        private static string _imageName;

        protected void btnUploadDonorImage_Click(object sender, EventArgs e)
        {
            _imageName = UploadFile(fileUploadDonorImage, true);
            lblFileUploadDonorImage.Text = _imageName;
        }

        protected void lnkbtnApprove_Click(object sender, EventArgs e)
        {
            int ID = 0;

            LinkButton btn1 = (LinkButton)sender;
            GridDataItem item = (GridDataItem)btn1.NamingContainer;
            try
            {
                ID = Convert.ToInt32(item.GetDataKeyValue("ID").ToString());

                _configItem.ClearAcquisition(ID);

                btnSearch_Click(null, null);

            }
            catch (Exception Ex)
            {
                Common.CommonTasks.ErrorMsgSettings(Ex, System.Reflection.MethodBase.GetCurrentMethod().Name.ToString(), _moduleName, _pageName, mySession.Current.User_ID, divMessage, lblMessage);
            }
        }

        protected void btnDialogClose_Click(object sender, EventArgs e)
        {
            Response.Redirect(_pageName);
        }

        protected void gridSearch_NeedDataSource(object sender, GridNeedDataSourceEventArgs e)
        {
            gridSearch.DataSource = _data;
        }

        protected void aDonorFile_ServerClick(object sender, EventArgs e)
        {
            if (lblDonorFileName.Text != "")
            {
                string jscript = $"openBase64InNewTab('{Convert.ToBase64String(_fileBytes)}', 'application/octet-stream','{lblDonorFileName.Text}');";
                ScriptManager.RegisterStartupScript(this, this.GetType(), "popup2", jscript, true);
            }
        }

        protected void aImageFile_ServerClick(object sender, EventArgs e)
        {
            if (_imageName != "")
            {
                string jscript = $"openBase64InNewTab('{Convert.ToBase64String(_imgBytes)}', 'image/jpeg','{_imageName}');";
                ScriptManager.RegisterStartupScript(this, this.GetType(), "popup2", jscript, true);
            }
        }

        protected void aDnonorImageFile_ServerClick(object sender, EventArgs e)
        {
            if (_imageName != "")
            {
                string jscript = $"openBase64InNewTab('{Convert.ToBase64String(_imgBytes)}', 'image/jpeg','{_imageName}');";
                ScriptManager.RegisterStartupScript(this, this.GetType(), "popup2", jscript, true);
            }
        }
    }
}
