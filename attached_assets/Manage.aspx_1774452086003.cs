using AutoMapper;
using CMS.EMS.Utils.Constant;
using FMSWebApp.Assets.DAL;
using FMSWebApp.Common;
using FMSWebApp.Common.Microservices.Asset;
using FMSWebApp.SCM;
using Newtonsoft.Json;
using Ninject;
using Sebata.Ems.Billing;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using static AutoMapper.Mappers.Internal.CollectionMapperExpressionFactory;
using static FMSWebApp.Assets.Core_Enumerations;
using static FMSWebApp.Common.Microservices.Asset.AssetsMicroservice;
using static FMSWebApp.Common.Microservices.Asset.AssetsMicroservice.AssetRegisterItemApprovals;
using static FMSWebApp.Common.Microservices.Asset.AssetsMicroservice.AssetRegisterItems;
using static FMSWebApp.Common.Microservices.Asset.AssetsMicroservice.Streets;
using static FMSWebApp.Common.Microservices.Asset.AssetsMicroservice.WIPRegisterFunding;
using Image = System.Drawing.Image;

namespace FMSWebApp.Assets.MultiYear
{
    public partial class Manage : System.Web.UI.Page
    {
        string _moduleName = "Assets";
        string _pageName = "Manage.aspx";

        static string selectedEvent = "";
        static int AssetRegisterItem_ID = 0;

        private const string UseCaseDescription = "Manage Assets";
        public const int Perm_Page = 40830;

        private static bool _forApproval = false;
        private AssetsMicroservice.AssetRegisterItems.AssetRegisterItemView Core_AssetRegisterItem;
        private AssetsMicroservice.AssetRegisterItemApprovals.AssetRegisterItemApprovalView Core_Approval_AssetRegisterItem;

        [Inject]
        public IViewUploadDocuments iViewUploadDocuments { get; set; }

        protected void Page_Init(object sender, EventArgs e)
        {
            AssetSearch1.RowSelected += AssetSearch1_RowSelected;
        }

        protected void Page_Load(object sender, EventArgs e)
        {
            string msg = "";

            RegisterAsyncTask(new PageAsyncTask(async () =>
            {
                try
                {
                    var (isOnline, exception) = await AssetsMicroservice.IsOnlineAsync().ConfigureAwait(false);

                    if (!isOnline)
                    {
                        CommonTasks.ErrorMsgSettings(exception,
                                  System.Reflection.MethodBase.GetCurrentMethod().Name,
                                  _moduleName, _pageName, mySession.Current.User_ID, divMessage, lblMessage);

                        lblMessage.InnerText = exception?.Message;
                        lblMessage.Style["display"] = "block";

                    }
                    else
                    {
                        lblMessage.InnerText = "";
                        lblMessage.Style["display"] = "None";
                    }
                }
                catch (Exception exception)
                {
                    if (exception is OperationCanceledException)
                    {
                        ClientScript.RegisterStartupScript(typeof(Page), "showstatus", "<script type='text/javascript'>MicroServicePageCancel();</script>");
                    }
                    else
                    {
                        Common.CommonTasks.ErrorMsgSettings(exception, System.Reflection.MethodBase.GetCurrentMethod().Name.ToString(), _moduleName, _pageName, mySession.Current.User_ID, divMessage, lblMessage);
                    }
                }
            }));

            try
            {
                if (!IsPostBack)
                {                    
                    Common.CommonTasks.CheckPagePermission(Perm_Page, Page.ResolveUrl("~/noRights.aspx"));
                }
            }
            catch (Exception Ex)
            {
                Common.CommonTasks.ErrorMsgSettings(Ex, System.Reflection.MethodBase.GetCurrentMethod().Name.ToString(), _moduleName, _pageName, mySession.Current.User_ID, divMessage, lblMessage);
            }

            _forApproval = false;
            AssetProperties1.ManageAssetApproval = "0";

            if (Request.QueryString.Keys.Count > 0 && Request.QueryString["ForApproval"] != null && Request.QueryString["ForApproval"].ToLower() == "true")
            {
                _forApproval = true;
                AssetProperties1.ManageAssetApproval = "1";
            }


            if (_forApproval)
            {
                stepApprove.Active = true;
                stepEdit.ImageUrl = imgYes;
            }

            if (!IsPostBack)
            {
                Session[$"AssetFileBytes21"] = null;
                Session[$"AssetUploadedFile21"] = null;
                Session[$"AssetFile21"] = null;

                Session[$"AssetFileBytes22"] = null;
                Session[$"AssetUploadedFile22"] = null;
                Session[$"AssetFile22"] = null;

                Session[$"AssetFileBytes30"] = null;
                Session[$"AssetUploadedFile30"] = null;
                Session[$"AssetFile30"] = null;

                divPage.Visible = false;
                updatePanelMain.Update();

                AssetSearch1.ExportFileName = "Manage Asset Items";
                AssetSearch1.moduleName = _moduleName;
                AssetSearch1.pageName = _pageName;
                AssetSearch1.SearchType = Sebata.Business.Assets.Items.enSearchType.None;

                if (_forApproval)
                    AssetSearch1.SearchType = Sebata.Business.Assets.Items.enSearchType.ManageAproval;

                AssetSearch1.HideControl("divcondition");
                AssetSearch1.HideControl("divMeasurementType");
                AssetSearch1.HideControl("divStatus");
                AssetSearch1.HideControl("divUsefullLife");
               // AssetSearch1.HideControl("divBarcode");

                AssetSearch1.AssetClassMandetory = false;
                AssetSearch1.AssetTypeMandetory = false;

                upProperties.Update();

                HideSearchGridColumns();

                upSearch.Update();

                setThumbs();

            }

            msg = "";
            if (Session["searchmessage"] != null)
            {
                msg = Session["searchmessage"].ToString();
                Session["searchmessage"] = null;
            }
            else if (Session["Saved"] != null)
            {
                
                if (Session["Saved"] == "true")
                    msg = "Asset item has been approved and updated the Asset Register.";
                else
                    msg = "Could not approve the Asset item.";
                Session["Saved"] = null;
                
            }
            else if (Session["Submit"] != null)
            {
                if (Session["Submit"] == "true")
                    msg = "Asset Item has been submitted for approval.";
                else
                    msg = "There was a problem submitting the Asset item for Approval. This Asset has allready been disposed." + Session["Submit"]; 
                Session["Submit"] = null;
            }
            else if (Session["Reject"] != null)
            {
                if (Session["Reject"] == "true")
                    msg = "Asset Item update has been rejected.";
                Session["Reject"] = null;
            }

            AssetProperties1.HideItem("Optional");
            AssetProperties2.HideItem("Optional");
            AssetProperties3.HideItem("Optional");
            AssetProperties4.HideItem("Optional");

            if (msg != "")
                Page.ClientScript.RegisterStartupScript(GetType(), "arupdated", "ShowUpdated('" + msg + "');", true);

        }
             
        private void AssetSearch1_RowSelected(object sender, Controls.RowEventArgs e)
        {
            AssetRegisterItem_ID = e.row["AssetRegisterItem_ID"].Text.intSafe();
            if (AssetRegisterItem_ID != 0)
            {
                divPage.Visible = true;
                updatePanelMain.Update();

                AssetProperties1.AllowEdit(false);
                AssetProperties1.SearchType = AssetSearch1.SearchType;
                AssetProperties1.LoadData(AssetRegisterItem_ID);
                AssetProperties1.LockSelected(true);
                AssetProperties1.HideItem("RequiredIndicator");

                AssetProperties2.AllowEdit(false);              
                AssetProperties2.HideItem("RequiredIndicator");

                AssetProperties3.AllowEdit(false);              
                AssetProperties3.HideItem("RequiredIndicator");

                AssetProperties4.AllowEdit(false);               
                AssetProperties4.HideItem("RequiredIndicator");

                LoadDropDowns();

                if (_forApproval)
                {
                    Core_Approval_AssetRegisterItem = AssetsMicroservice.AssetRegisterItemApprovals.GetAllByAssetRegisterItemIdAsync(AssetRegisterItem_ID).Result;
                    Core_AssetRegisterItem = AssetsMicroservice.AssetRegisterItems.GetByIdAsync(AssetRegisterItem_ID).Result;
                    LoadItemData();
                }
                else
                {
                    Core_Approval_AssetRegisterItem = null;
                    Core_AssetRegisterItem = AssetsMicroservice.AssetRegisterItems.GetByIdAsync(AssetRegisterItem_ID).Result;
                    LoadItemData();
                }
                                            

                divSearch.Visible = false;
                upSearch.Update();

                stepDetails.Active = true;
                
                SelectPrevNext();
                wizStripMain_ActiveStepChanged(null, null);               
            }

            if (_forApproval)
            {
                LockScreen();
            }
        }
               
        private void LockScreen()
        {
            switch(wizStripMain.ActiveStep.ID)
            {
                case "stepDetails":
                    AssetProperties1.LockAll();
                    datAcuisition.Enabled = false;
                    datVerificationDate.Enabled = false;
                    datCommDate.Enabled = false;
                    txtUsefulLife.ReadOnly = true;
                    lstUOM.Enabled = false;
                    txtDim1.ReadOnly = true;
                    txtDim2.ReadOnly = true;
                    txtDim3.ReadOnly = true;
                    txtDimQuantity.ReadOnly = true;
                    txtQuantity.ReadOnly = true;
                    framImgeFile.Visible = false;
                    lstMunicipalityServices.Enabled = false;
                    lstCriticalityGrade.Enabled = false;
                    lstPerformanceGrade.Enabled = false;
                    lstUtilisationGrade.Enabled = false;
                    lstInfrastructureHealthGrade.Enabled = false;
                    lstConsequenceOfFailure.Enabled = false;
                    lstRisk.Enabled = false;
                    lstCashGenerating.Enabled = false;
                    lstFinancialStatus.Enabled = false;
                    datInService.Enabled = false;
                    lstVerifyID.Enabled = false;                    
                    break;

                case "stepFinancial":
                    AssetProperties2.LockAll();
                    txtFundingSourceAmount.ReadOnly = true;
                    txtResidualValue.ReadOnly = true;
                    txtReplacementValue.ReadOnly = true;
                    txtInsuredAmount.ReadOnly = true;
                    txtInsureanceRefNo.ReadOnly = true;
                    framInsFile.Visible = false;
                    txtDepreciatedReplacement.Enabled = false;
                    txtForecastReplacementYear.Enabled = false;
                    lstInsuranceCover.Enabled = false;
                    lstWarranty.Enabled = false;

                    break;
                case "stepOwnership":
                    AssetProperties3.LockAll();
                    lstDepartment.Enabled = false;
                    lstCustodian.Enabled = false;
                    lstDivision.Enabled = false;
                    txtCustodianNumber.ReadOnly = true;
                    txtDeedNumber.ReadOnly = true;
                    txtErfNumber.ReadOnly = true;
                    txtRegNumber.ReadOnly = true;
                    txtErfSize.ReadOnly = true;
                    txtSerialNumber.ReadOnly = true;
                    txtPortionNumber.ReadOnly = true;
                    txtUnitNumber.ReadOnly = true;
                    txtAssetOwnerShip.ReadOnly = true;
                    txtMake.Enabled = false;
                    txtModel.Enabled = false;
                    framDonFile.Visible = false;
                    break;
                case "stepLocation":
                    AssetProperties4.LockAll();
                    txtLatittude.ReadOnly = true;
                    txtGISFeature.ReadOnly = true;
                    txtLogitude.ReadOnly = true;
                    txtSG.Enabled = false;
                    lstTown.Enabled = false;
                    lstSuburb.Enabled = false;
                    lstZone.Enabled = false;
                    lstWard.Enabled = false;
                    lstStreet.Enabled = false;
                    lstBuilding.Enabled = false;
                    lstFloor.Enabled = false;
                    lstRoom.Enabled = false;
                    txtReason.Enabled = false;
                    btnSubmit.Visible = false;
                    btnApp2.Visible = true;
                    txtWellKnownText.Enabled = false;
                    btnGIS.Enabled = false;
                    break;
            }

            upButtons.Update();
        }

        private void LoadDropDowns()
        {
            LoadBuildings();
            LoadDepartments();
            LoadCustodian();
            LoadDivisions();
            LoadFloors();
            LoadGIS();
            LoadRooms();
            LoadStreets();
            LoadSuburbs();
            LoadTowns();
            LoadWards();
            LoadZones();
            LoadUOMs();
            LoadConditionList();
            LoadCIDMSMunicipalityServiceList();
            LoadCriticalityGradeList();
            LoadPerformanceGradeList();
            LoadInfrastructureGradeList();
            LoadUtilisationGradeList();
            LoadFailureList();
            LoadRiskList();
            LoadFinicialStatusList();
            LoadCashGeneratingList();
            LoadWarranteed();
            LoadInsured();
            
        }

        private void LoadConditionList()
        {
            if (lstCondition.DataSource == null)
            {
                //  Sebata.Business.Assets.Configuration.Condition configCondition = new Sebata.Business.Assets.Configuration.Condition(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString(), mySession.Current.User_ID);

                var entities = AssetsMicroservice.AssetConditions.GetAllAsync().Result.ToList();

                int? inull = null;
                lstCondition.DataSource = entities;
                lstCondition.DataTextField = "Description";
                lstCondition.DataValueField = "Id";
                try
                {
                    lstCondition.DataBind();
                }
                catch { }

                if (lstCondition.Items.Count > 0)
                {
                    lstCondition.Items.Insert(0, new ListItem("", "0"));
                    lstCondition.Enabled = true;
                }
            }
        }

        private void LoadCIDMSMunicipalityServiceList()
        {
            try
            {
                lstMunicipalityServices.Items.Clear();

                var entities = AssetsMicroservice.CIDMSMunicipalServices.GetAllAsync().Result.ToList();
                
                lstMunicipalityServices.DataSource = entities;
                lstMunicipalityServices.DataValueField = "Id";
                lstMunicipalityServices.DataTextField = "Description";
                lstMunicipalityServices.DataBind();
                lstPerformanceGrade.Items.Insert(0, new ListItem("", "-1"));
            }
            catch (Exception ex)
            {
                // ignored
            }
        }
        
        private void LoadCriticalityGradeList()
        {
            try
            {
                var entities = AssetsMicroservice.CriticalityGrades.GetAllAsync().Result.ToList();
                lstCriticalityGrade.DataSource = entities;
                lstCriticalityGrade.DataValueField = "Id";
                lstCriticalityGrade.DataTextField = "Description";
                lstCriticalityGrade.DataBind();
                //lstCriticalityGrade.Items.Insert(0, new ListItem("", "-1"));
            }
            catch (Exception ex)
            {
                lstCriticalityGrade.SelectedValue = "-1";
            }
        }
        
        private void LoadPerformanceGradeList()
        {
            try
            {
                var entities = AssetsMicroservice.PerformanceGrades.GetAllAsync().Result.ToList();
                lstPerformanceGrade.DataSource = entities;
                lstPerformanceGrade.DataValueField = "Id";
                lstPerformanceGrade.DataTextField = "Description";
                lstPerformanceGrade.DataBind();
                //lstPerformanceGrade.Items.Insert(0, new ListItem("", "-1"));
            }
            catch (Exception ex)
            {
                lstPerformanceGrade.SelectedValue = "-1";
            }
        }
        
        private void LoadInfrastructureGradeList()
        {
            try
            {
                var entities = AssetsMicroservice.HealthGrades.GetAllAsync().Result.ToList();
                lstInfrastructureHealthGrade.DataSource = entities;
                lstInfrastructureHealthGrade.DataValueField = "Id";
                lstInfrastructureHealthGrade.DataTextField = "Description";
                lstInfrastructureHealthGrade.DataBind();
                lstInfrastructureHealthGrade.Items.Insert(0, new ListItem("", "-1"));
            }
            catch (Exception ex)
            {
                lstInfrastructureHealthGrade.SelectedValue= "-1";
            }
        }

        private void LoadUtilisationGradeList()
        {
            try
            {
                var entities = AssetsMicroservice.UtilisationGrades.GetAllAsync().Result.ToList();
                lstUtilisationGrade.DataSource = entities;
                lstUtilisationGrade.DataValueField = "Id";
                lstUtilisationGrade.DataTextField = "Description";
                lstUtilisationGrade.DataBind();
                lstUtilisationGrade.Items.Insert(0, new ListItem("", "-1"));
            }
            catch (Exception ex)
            {
                lstUtilisationGrade.SelectedValue = "-1";
            }
        }

        private void LoadFailureList()
        {
            try
            {
                var entities = AssetsMicroservice.CriticalityGrades.GetAllAsync().Result
                    .ToList()
                    .Select(x => x.ConsequenceOfFailure)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct()
                    .Select(x => new { ConsequenceOfFailure = x })
                    .ToList();

                lstConsequenceOfFailure.DataSource = entities;
                lstConsequenceOfFailure.DataValueField = "ConsequenceOfFailure";
                lstConsequenceOfFailure.DataTextField = "ConsequenceOfFailure";
                lstConsequenceOfFailure.DataBind();
                lstConsequenceOfFailure.Items.Insert(0, new ListItem("", "0"));

                return;
            }
            catch (Exception ex)
            {
                return;
            }
        }

        private void LoadRiskList()
        {
            try
            {
                var risk = from display in Static_Dictionaries.Risk
                              select new { display.Key, display.Value };

                lstRisk.DataSource = risk;
                lstRisk.DataTextField = "Key";
                lstRisk.DataValueField = "Value";
                lstRisk.DataBind();
                lstRisk.Items.Insert(0, new ListItem("", "-1"));

                return;

            }
            catch (Exception ex)
            {
                return;
            }
        }

        private void LoadFinicialStatusList()
        {
            try
            {

                Array itemNames = System.Enum.GetNames(typeof(Core_Enumerations.FinancialStatus));
                foreach (String name in itemNames)
                {
                    //get the enum item value
                    Int32 value = (Int32)Enum.Parse(typeof(Core_Enumerations.FinancialStatus), name);
                    ListItem listItem = new ListItem(name, value.ToString());
                    lstFinancialStatus.Items.Add(listItem);
                }

                return;

            }
            catch (Exception ex)
            {
                return;
            }
        }

        private void LoadCashGeneratingList()
        {
            try
            {               
               
                var cashGen = from display in Static_Dictionaries.CashGenerating
                              select new { display.Key , display.Value };

                lstCashGenerating.DataSource = cashGen;
                lstCashGenerating.DataTextField = "Key";
                lstCashGenerating.DataValueField = "Value";

                lstCashGenerating.DataBind();

                return;

            }
            catch (Exception ex)
            {
                return;
            }
        }

        private void LoadInsured()
        {
            try
            {
                Array itemNames = System.Enum.GetNames(typeof(Core_Enumerations.Insured));
                foreach (String name in itemNames)
                {
                    Int32 value = (Int32)Enum.Parse(typeof(Core_Enumerations.Insured), name);
                    ListItem listItem = new ListItem(name, value.ToString());
                    lstInsuranceCover.Items.Add(listItem);
                }

                return;

            }
            catch (Exception ex)
            {
                return;
            }
        }

        private void LoadWarranteed()
        {
            try
            {
                Array itemNames = System.Enum.GetNames(typeof(Core_Enumerations.Warranteed));
                foreach (String name in itemNames)
                {
                    Int32 value = (Int32)Enum.Parse(typeof(Core_Enumerations.Warranteed), name);
                    ListItem listItem = new ListItem(name, value.ToString());
                    lstWarranty.Items.Add(listItem);
                }

                return;

            }
            catch (Exception ex)
            {
                return;
            }
        }

        private void LoadUOMs()
        {
            if (lstUOM.Items.Count==0)
            {
                var entities = AssetsMicroservice.UnitOfIssues.GetAllAsync().Result
                    .Where(u => u.IsEnabled)
                    .ToList();
                lstUOM.DataSource = entities;
                lstUOM.DataValueField = "Id";
                lstUOM.DataTextField = "Description";
                lstUOM.DataBind();
                lstUOM.Items.Insert(0, new ListItem("", "0"));
                upProvince.Update();
            }

        }

        private void LoadZones()
        {
            if (lstZone.Items.Count == 0)
            {
                var entities = AssetsMicroservice.PropertyTypes.GetAllAsync().Result.ToList();
                lstZone.DataSource = entities;
                lstZone.DataValueField = "Id";
                lstZone.DataTextField = "Description";
                lstZone.DataBind();
                lstZone.Items.Insert(0, new ListItem("", "0"));

            }
            upProvince.Update();
        }

        private void LoadWards()
        {
            lstWard.Items.Clear();

            if (lstWard.Items.Count == 0)
            {
                var entities = AssetsMicroservice.Wards.GetAllAsync().Result.ToList();
                lstWard.DataSource = entities;
                lstWard.DataValueField = "Id";
                lstWard.DataTextField = "Description";
                lstWard.DataBind();
                lstWard.Items.Insert(0, new ListItem("", "0"));
            }
            upProvince.Update();

        }

        private void LoadTowns(int? ProviceId = null)
        {
            lstTown.Items.Clear();

            if (lstTown.Items.Count == 0)
            {
                var entities = ProviceId != null
                    ? AssetsMicroservice.Towns.GetAllByProvinceIdAsync(ProviceId.Value).Result.ToList()
                    : AssetsMicroservice.Towns.GetAllAsync().Result.ToList();
                lstTown.DataSource = entities;
                lstTown.DataValueField = "Id";
                lstTown.DataTextField = "Description";
                lstTown.DataBind();
                lstTown.Items.Insert(0, new ListItem("", "0"));
            }
            upProvince.Update();

        }

        private void LoadSuburbs(int? townId = null)
        {
            lstSuburb.Items.Clear();

            if (lstSuburb.Items.Count == 0)
            {
                var entities = townId != null
                    ? AssetsMicroservice.Suburbs.GetAllByTownIdAsync(townId.Value).Result.ToList()
                    : AssetsMicroservice.Suburbs.GetAllAsync().Result.ToList();
                lstSuburb.DataSource = entities;
                lstSuburb.DataValueField = "Id";
                lstSuburb.DataTextField = "Description";
                lstSuburb.DataBind();
                lstSuburb.Items.Insert(0, new ListItem("", "0"));
            }
            upProvince.Update();

        }

        private void LoadStreets(int? townId = null, int? suburbId = null)
        {
            lstStreet.Items.Clear();

            IEnumerable<StreetView> entities;

            if (suburbId.HasValue)
            {
                entities = AssetsMicroservice.Streets.GetAllBySuburbIdAsync(suburbId.Value).Result.ToList();
            }
            else if (townId.HasValue)
            {
                var suburbs = AssetsMicroservice.Suburbs.GetAllByTownIdAsync(townId.Value)
                                  .GetAwaiter().GetResult();
                var suburbIds = suburbs.Select(sb => sb.Id).ToHashSet();

                var allStreets = AssetsMicroservice.Streets.GetAllAsync().Result.ToList();
                entities = allStreets.Where(s => s.SuburbId.HasValue &&
                                                 suburbIds.Contains(s.SuburbId.Value));
            }
            else
            {
                entities = AssetsMicroservice.Streets.GetAllAsync().Result.ToList();
            }

            lstStreet.DataSource = entities;
            lstStreet.DataValueField = "Id";
            lstStreet.DataTextField = "Description";
            lstStreet.DataBind();

            // Insert empty "select one" option
            lstStreet.Items.Insert(0, new ListItem("-- Select Street --", "0"));

            upProvince.Update();
        }

        private void LoadRooms(int? TownId = null, int? SuburbId = null, int? streetId = null, int?buildingId = null, int ? floorId = null)
        {
            lstRoom.Items.Clear();

            if (lstRoom.Items.Count == 0)
            {
                var entities = AssetsMicroservice.Rooms.GetAllAsync().Result.ToList();
                
                if (TownId != null)
                    entities = entities.Where(r => r.TownId == TownId).ToList();
                if (SuburbId != null)
                    entities = entities.Where(r => r.SuburbId == SuburbId).ToList();
                if (streetId != null)
                    entities = entities.Where(r => r.StreetId == streetId).ToList();
                if (buildingId != null)
                    entities = entities.Where(r => r.BuildingId == buildingId).ToList();
                if (floorId != null)
                    entities = entities.Where(r => r.FloorId == floorId).ToList();
                
                lstRoom.DataSource = entities;
                lstRoom.DataValueField = "Id";
                lstRoom.DataTextField = "Description";
                lstRoom.DataBind();
                lstRoom.Items.Insert(0, new ListItem("", "0"));
            }

            upProvince.Update();

        }

        private void LoadGIS()
        {

            lstGIS.Items.Clear();

            if (lstGIS.Items.Count == 0)
            {
                var entities = AssetsMicroservice.AssetGIS.GetAllAsync().Result.ToList();
                lstGIS.DataSource = entities;
                lstGIS.DataValueField = "Id";
                lstGIS.DataTextField = "Description";
                lstGIS.DataBind();
                lstGIS.Items.Insert(0, new ListItem("", "0"));
            }
            upLocation.Update();
        }

        private void LoadFloors(int? TownId = null, int? SuburbId = null, int? streetId =null, int? buildingId = null)
        {
            lstFloor.Items.Clear();

            if (lstFloor.Items.Count == 0)
            {
                var entities = AssetsMicroservice.Floors.GetAllByFiltersAsync(TownId,SuburbId,streetId,buildingId).Result.ToList();
                                
                lstFloor.DataSource = entities;
                lstFloor.DataValueField = "Id";
                lstFloor.DataTextField = "Description";
                lstFloor.DataBind();
                lstFloor.Items.Insert(0, new ListItem("", "0"));
            }

            upProvince.Update();
        }

        private void LoadDivisions(int? departmentId = null)
        {
            lstDivision.Items.Clear();

            if (lstDivision.Items.Count == 0)
            {
                var entities = departmentId != null
                    ? AssetsMicroservice.Divisions.GetAllByDepartmentIdAsync(departmentId.Value).Result.ToList()
                    : AssetsMicroservice.Divisions.GetAllAsync().Result.ToList();
                lstDivision.DataSource = entities;
                lstDivision.DataValueField = "Id";
                lstDivision.DataTextField = "Description";
                lstDivision.DataBind();
                lstDivision.Items.Insert(0, new ListItem("", "0"));
            }

            upDepartment.Update();
        }

        private void LoadDepartments()
        {
            lstDepartment.Items.Clear();

            if (lstDepartment.Items.Count == 0)
            {
                var entities = AssetsMicroservice.Departments.GetAllAsync().Result
                    .Where(d => !string.IsNullOrWhiteSpace(d.Description))
                    .OrderBy(d => d.Description)
                    .ToList();
                lstDepartment.DataSource = entities;
                lstDepartment.DataValueField = "Id";
                lstDepartment.DataTextField = "Description";
                lstDepartment.Items.Insert(0, new ListItem("", "0"));
                lstDepartment.DataBind();
                lstDepartment.Items.Insert(0, new ListItem("", "0"));
                upDepartment.Update();
            }
        }

        private void LoadCustodian(int? DepartmentId = null)
        {
            if (lstCustodian.Items.Count == 0)
            {
                var entities = AssetsMicroservice.Employees.GetAllAsync().Result.ToList();
                lstCustodian.DataSource = entities;
                lstCustodian.DataValueField = "Id";
                lstCustodian.DataTextField = "Description";
                lstCustodian.DataBind();
                lstCustodian.Items.Insert(0, new ListItem("", "0"));
            }
            if (lstVerifyID.Items.Count == 0)
            {
                var entities = AssetsMicroservice.Employees.GetAllAsync().Result.ToList();
                lstVerifyID.DataSource = entities;
                lstVerifyID.DataValueField = "Id";
                lstVerifyID.DataTextField = "Description";
                lstVerifyID.DataBind();
                lstVerifyID.Items.Insert(0, new ListItem("", "0"));

            }

            upDepartment.Update();
        }

        private void LoadBuildings(int? TownId = null, int? SuburbId = null, int? streetId = null)
        {
            lstBuilding.Items.Clear();

            if (lstBuilding.Items.Count == 0)
            {
                var entities = AssetsMicroservice.Buildings.GetAllAsync().Result.ToList();
                
                if (TownId != null)
                    entities = entities.Where(b => b.TownId == TownId).ToList();
                if (SuburbId != null)
                    entities = entities.Where(b => b.SuburbId == SuburbId).ToList();
                if (streetId != null)
                    entities = entities.Where(b => b.StreetId == streetId).ToList();
                
                lstBuilding.DataSource = entities;
                lstBuilding.DataValueField = "Id";
                lstBuilding.DataTextField = "Description";
                lstBuilding.DataBind();
                lstBuilding.Items.Insert(0, new ListItem("", "0"));

            }

            upProvince.Update();
        }

        private KeyValuePair<decimal, string> GetRemainingUsefulLife(int assetId)
        {
            try
            {
                return AssetsMicroservice.AssetRegisterItems.GetRemainingUsefulLifeAsync(assetId).Result;
            }
            catch (Exception ex)
            {
                // ignored
            }

            return default;
        }

        static AssetsMicroservice.AssetRegisterItems.AssetRegisterItemView _detail;
        static List<AssetsMicroservice.AssetTransactionSummaries.AssetTransactionSummaryView> _summaries;

        private void LoadItemData()
        {
            // AS MOVE TO MICROSERVICE
            // _detail = _configItem.GetRegisterDetails(_forApproval, AssetRegisterItem_ID);

            AssetRegisterItemApprovalView _approval = null;

            if (_forApproval)
                _approval = Core_Approval_AssetRegisterItem;

            _detail = Core_AssetRegisterItem;


            if (_detail == null && _approval == null)
                return;
            else if (_detail != null && _approval != null)
            {
                if (_approval.AssetRegisterItemId > 0)
                    _detail = AssetsMicroservice.AssetRegisterItems.GetByIdAsync((int)_approval.AssetRegisterItemId).Result;
                else
                    _detail = new AssetsMicroservice.AssetRegisterItems.AssetRegisterItemView() { Description = "" };

                //_detail.Id = (int)_approval.AssetRegisterItemId;
                _detail.ParentAssetRegisterItemId = _approval.ParentAssetRegisterItemId;
                _detail.MunicipalAssetId = _approval.MunicipalAssetId;
                _detail.Description = _approval.Description;
                _detail.MainAssetDescription = _approval.MainAssetDescription;
                _detail.Barcode = _approval.Barcode;
                _detail.OldBarCode = _approval.OldBarCode;
                _detail.AssetClassId = _approval.AssetClassId;
                _detail.AssetTypeId = _approval.AssetTypeId;
                _detail.AssetCategoryId = _approval.AssetCategoryId;
                _detail.AssetSubCategoryId = _approval.AssetSubCategoryId;
                _detail.MeasurementTypeId = _approval.MeasurementTypeId;
                _detail.AssetStatusId = _approval.AssetStatusId;
                _detail.AssetConditionId = _approval.AssetConditionId;
                _detail.ReadyForUse = _approval.ReadyForUse;
                _detail.VerificationDate = _approval.VerificationDate;
                _detail.VerifyId = _approval.VerifyId;
                _detail.UsefulLifeYearComponent = _approval.UsefulLifeMonthComponent / 12;
                _detail.UsefulLifeMonthComponent = _approval.UsefulLifeMonthComponent;
                _detail.RemainingUsefulLifeYear = _approval.RemainingUsefulLifeYear;
                _detail.RemainingUsefulLife = _approval.RemainingUsefulLife;
                _detail.UoM = _approval.UoM;
                _detail.DimensionQuantity = _approval.DimensionQuantity;
                _detail.Dim1 = _approval.Dim1;
                _detail.Dim2 = _approval.Dim2;
                _detail.Dim3 = _approval.Dim3;
                _detail.Quantity = _approval.Quantity;
                _detail.Image = _approval.Image;
                _detail.ImageRef = _approval.ImageRef;
                _detail.PurchaseAmount = _approval.PurchaseAmount;
                _detail.ResidualValue = _approval.ResidualValue;
                _detail.ReplacementValue = _approval.ReplacementValue;
                _detail.InsuredAmountInsuredBy = _approval.InsuredAmountInsuredBy;
                _detail.InsuranceNumberReference = _approval.InsuranceNumberReference;
                _detail.InsureanceDocument = _approval.InsureanceDocument;
                _detail.Department = _approval.Department;
                _detail.MunicipalDepartmentId = _approval.MunicipalDepartmentId;
                _detail.DivisionId = _approval.DivisionId;
                _detail.CustodianId = _approval.CustodianId;
                _detail.CustodianIdNumber = _approval.CustodianIdNumber;
                _detail.AssetOwnershipId = _approval.AssetOwnershipId;
                _detail.DeedNumber = _approval.DeedNumber;
                _detail.RegistrationNumber = _approval.RegistrationNumber;
                _detail.SerialNumber = _approval.SerialNumber;
                _detail.ErfNumber = _approval.ErfNumber;
                _detail.ErfSizeM2 = _approval.ErfSizeM2;
                _detail.UnitNumber = _approval.UnitNumber;
                _detail.PortionNumber = _approval.PortionNumber;
                _detail.GISId = _approval.GisId;
                _detail.GISFeature = _approval.GisFeature;
                _detail.GISURL = _approval.GisURL;
                _detail.Latitude = _approval.Latitude;
                _detail.Longitude = _approval.Longitude;
                _detail.SGNumberChangeId = _approval.SgnumberChangeId;
                _detail.TownId = _approval.TownId;
                _detail.SuburbId = _approval.SuburbId;
                _detail.SiteNumber = _approval.SiteNumber;
                _detail.ZoningId = _approval.ZoningId;
                _detail.WardId = _approval.WardId;
                _detail.StreetId = _approval.StreetId;
                _detail.BuildingId = _approval.BuildingId;
                _detail.FloorId = _approval.FloorId;
                _detail.RoomId = _approval.RoomId;
                _detail.ReasonForChange = _approval.ReasonForChange;
                _detail.ApprovalId = mySession.Current.User_ID;
                _detail.DateDonated = _approval.DateDonated;
                _detail.DonationDocument = _approval.DonationDocument;
                _detail.DonorName = _approval.DonorName;
                _detail.DonorRegNumber = _approval.DonorRegNumber;
                _detail.ConstructionMaterial = _approval.ConstructionMaterial;
                _detail.BasicMunicipalityService = _approval.BasicMunicipalityService;
                _detail.PerformanceGrade = _approval.PerformanceGrade;
                _detail.UtilisationGrade = _approval.UtilisationGrade;
                _detail.InfrastructureHealthGrade = _approval.InfrastructureHealthGrade;
                _detail.ConsequenceOfFailure = _approval.ConsequenceOfFailure;
                _detail.Risk = _approval.Risk.Value.ToString();
                _detail.CashOrNoncashgeneratingunit = _approval.CashOrNoncashgeneratingunit.Value.ToString();
                _detail.CriticalityGrade = _approval.CriticalityGrade;
                _detail.AcquisitionDate = _approval.AcquisitionDate;
                _detail.VerifyId = _approval.VerifyId;
                _detail.InServiceDate = _approval.InserviceDate;
                _detail.CurrentReplacementCostCRC = _approval.CurrentReplacementCostCrc;
                _detail.DepreciatedReplacementCostDRC = _approval.DepreciatedReplacementCostDrc;
                _detail.ForecastReplacementYear = _approval.ForecastReplacementYear;
                _detail.Insured = _approval.Insured;
                _detail.Warranty = _approval.Warranty.Value.ToString();
                _detail.Make = _approval.Make;
                _detail.Model = _approval.Model;
                _detail.CIDMSSubComponentTypeId = _approval.CidmssubComponentTypeId;
                _detail.WellKnownTextWKT = _approval.WellKnownTextWkt;
                _detail.ManagedFlag = true;
                _detail.FinancialStatusId = _approval.FinancialStatusId;
                _detail.InventoryId = _approval.InventoryId;
                _detail.CommisioningDate = _approval.CommisioningDate;
                _detail.Diameter = _approval.Diameter;
                _detail.Capacity = _approval.Capacity;

                _detail.Image = _approval.Image;
                _detail.ImageRef = _approval.ImageRef;
                _detail.InsureanceDocument = _approval.InsureanceDocument;
                _detail.DonationDocument = _approval.DonationDocument;

                _detail.Custom1 = _approval.Custom1;
                _detail.Custom2 = _approval.Custom2;
                _detail.Custom3 = _approval.Custom3;
                _detail.Custom4 = _approval.Custom4;
                _detail.Custom5 = _approval.Custom5;
                _detail.Custom6 = _approval.Custom6;
                _detail.Custom7 = _approval.Custom7;
                _detail.Custom8 = _approval.Custom8;
                _detail.Custom9 = _approval.Custom9;

            }


            _summaries = AssetsMicroservice.AssetTransactionSummaries.GetByAssetRegisterItemIdAsync(AssetRegisterItem_ID, mySession.Current.UserFinYear).Result.ToList();
            if (!String.IsNullOrEmpty(_detail.BasicMunicipalityService.ToString()))
                lstMunicipalityServices.SelectedValue = _detail.BasicMunicipalityService == 0 ? "1" : _detail.BasicMunicipalityService.ToString();
            if (!String.IsNullOrEmpty(_detail.CriticalityGrade.ToString()))
                lstCriticalityGrade.SelectedValue = _detail.CriticalityGrade == 0 ? "-1" : _detail.CriticalityGrade.ToString();
            if (!String.IsNullOrEmpty(_detail.PerformanceGrade.ToString()))
                lstPerformanceGrade.SelectedValue = _detail.PerformanceGrade == 0 ? "-1" : _detail.PerformanceGrade.ToString();
            if (!String.IsNullOrEmpty(_detail.UtilisationGrade.ToString()))
                lstUtilisationGrade.SelectedValue = _detail.UtilisationGrade == 0 ? "-1" : _detail.UtilisationGrade.ToString();
            if (!String.IsNullOrEmpty(_detail.InfrastructureHealthGrade.ToString()))
                lstInfrastructureHealthGrade.SelectedValue = _detail.InfrastructureHealthGrade == 0 ? "-1" : _detail.InfrastructureHealthGrade.ToString();
            if (!String.IsNullOrEmpty(_detail.ConsequenceOfFailure))
                lstConsequenceOfFailure.SelectedValue = _detail.ConsequenceOfFailure == "0" ? "0" : _detail.ConsequenceOfFailure.ToString();
            if (!String.IsNullOrEmpty(_detail.Risk.ToString()))
                lstRisk.SelectedValue = _detail.Risk.ToString();
            if (!String.IsNullOrEmpty(_detail.FinancialStatusId.ToString()))
                lstFinancialStatus.SelectedValue = _detail.FinancialStatusId.ToString();
            if (!String.IsNullOrEmpty(_detail.AssetConditionId.ToString()))
                lstCondition.SelectedValue = _detail.AssetConditionId.ToString();
            if (!String.IsNullOrEmpty(_detail.CashOrNoncashgeneratingunit))
            {
                if (_detail.CashOrNoncashgeneratingunit.ToString() == "0" || _detail.CashOrNoncashgeneratingunit.ToString() == "Cash")
                    lstCashGenerating.SelectedValue = "0";
                if (_detail.CashOrNoncashgeneratingunit.ToString() == "1" || _detail.CashOrNoncashgeneratingunit.ToString() == "Non")
                    lstCashGenerating.SelectedValue = "1";
            }
            else
                lstCashGenerating.SelectedValue = "0";

            if (_detail.AcquisitionDate.HasValue && _detail.AcquisitionDate.Value.Year > 1900)
            {
                datAcuisition.SelectedDate = _detail.AcquisitionDate;
                datAcuisition.Enabled = false;
            }
            else
                datAcuisition.Enabled = true;

            if (_detail.ReadyForUse.Value.Year > 1900)
            {
                datInService.SelectedDate = _detail.ReadyForUse;
                datCommDate.SelectedDate = _detail.ReadyForUse;
            }
            else
            {
                if (_detail.InServiceDate.HasValue)
                {
                    datInService.SelectedDate = _detail.InServiceDate;
                    datCommDate.SelectedDate = _detail.InServiceDate;
                }
            }
            if (_detail.CommisioningDate.Value.Year > 1900)
                datCommDate.SelectedDate = _detail.CommisioningDate;
            else
                datCommDate.Enabled = true;


            if (lblShowDepreciationMsg.Text == "Not Depreciated")
                datInService.Enabled = true;
            else
                datInService.Enabled = false;

            if (_detail.VerificationDate.Value.Year > 1900)
                datVerificationDate.SelectedDate = _detail.VerificationDate;

            if (!String.IsNullOrEmpty(_detail.VerifyId.ToString()))
                lstVerifyID.SelectedValue = _detail.VerifyId.ToString();

            if (!_forApproval)
            {
                var response = GetRemainingUsefulLife(AssetRegisterItem_ID);
                txtUsefulLifeRemain.Text = response.Key.ToString("#0.00");
                lblShowDepreciationMsg.Text = response.Value;

                if (lblShowDepreciationMsg.Text.Contains("Approved") || lblShowDepreciationMsg.Text == "Not Depreciated")
                {
                    txtUsefulLifeRemain.ReadOnly = false;
                }
                else
                {
                    txtUsefulLifeRemain.ReadOnly = true;
                }
            }
            else
            {
                var response = GetRemainingUsefulLife(AssetRegisterItem_ID);
                lblShowDepreciationMsg.Text = response.Value;

                txtUsefulLifeRemain.Text = _detail.RemainingUsefulLife.ToString();


                if (decimal.TryParse(txtUsefulLifeRemain.Text.Replace(",", "."), out var number))
                {
                    txtUsefulLifeRemain.Text = number.ToString("#0.00");
                }

                txtUsefulLifeRemain.ReadOnly = true;
            }

            try
            {
                txtUsefulLife.Text = _detail.UsefulLifeMonthComponent.Value.ToString("#0");
            }
            catch
            {
                txtUsefulLife.Text = "0";
            }



            //Dimmensions
            lstUOM.SelectedValue = _detail.UoM.ToString();
            txtDimQuantity.Text = _detail.DimensionQuantity == null ? "" : _detail.DimensionQuantity.Value.ToString("#0");
            txtQuantity.Text = _detail.Quantity == null ? "" : _detail.Quantity.Value.ToString("#0");
            txtDim1.Text = _detail.Dim1 == null ? "" : _detail.Dim1.Value.ToString("#0");
            txtDim2.Text = _detail.Dim2 == null ? "" : _detail.Dim2.Value.ToString("#0");
            txtDim3.Text = _detail.Dim3 == null ? "" : _detail.Dim3.Value.ToString("#0");
            txtConstMaterial.Text = _detail.ConstructionMaterial ?? "";
            txtDiameter.Text = _detail.Diameter == null ? "" : _detail.Diameter;
            txtCapacity.Text = _detail.Capacity == null ? "" : _detail.Capacity;

            imgBytes = null;
            lblShowImage.Text = _detail.ImageRef;

            if (!String.IsNullOrEmpty(_detail.ImageRef))
            {
                if (imgBytes == null)
                {
                    imgBytes = GetFileBytes(_detail.ImageRef, false);
                    _detail.Image = imgBytes;

                }
                if (imgBytes != null)
                    lblShowImage.Text = _detail.ImageRef;
                else
                    _detail.ImageRef = "";
            }

            //Financial
            txtFundingSourceAmount.Text = _detail.FundingSourceAmount.Value.ToString("#0.00");
            txtCostClosing.Text = ((_detail.CurrentReplacementCostCRC ?? 0) - (_detail.TransferFromAmount ?? 0) - (_summaries.Sum(s => s.TransferFromValue) ?? 0) + (_detail.RefurbDT ?? 0) - (_detail.RefurbCT ?? 0) -
                (_summaries.Sum(s => s.DisposalValue) > 0 ? _detail.PurchaseAmount + _summaries.Sum(s => s.RevaluationValue) ?? 0 : 0)).ToString("#0.00");

            txtDeprecClosing.Text = _summaries.OrderBy(x => x.ID).Last().AccumulatedDepreciationClosingBalance.Value.ToString("#0.00");
            txtDeprecYear.Text = _summaries.OrderBy(x => x.ID).Sum(x => x.DepreciationValue.Value).ToString("#0.00");
            txtDeprecOffsetClosing.Text = _summaries.OrderBy(x => x.ID).Last().DepreciationOffsetClosingBalance.Value.ToString("#0.00");
            txtDeemedCost.Text = _detail.DeemedCost;
            txtImpairmentClosing.Text = _summaries.OrderBy(x => x.ID).Last().AccumulatedImpairmentClosingBalance.Value.ToString("#0.00");
            txtImpairmentYear.Text = _summaries.OrderBy(x => x.ID).Sum(x => x.ImpairmentValue.Value).ToString("#0.00");
            txtImpairmentDate.Text = _detail.ImpairmentDate.Value.ToString("yyyy-MM-dd") == "1900-01-01" ? null : _detail.ImpairmentDate.Value.ToString("yyyy-MM-dd");
            txtReversalImpairmentLoss.Text = _summaries.OrderBy(x => x.ID).Last().AccumulatedImpairmentReversalClosingBalance.Value.ToString("#0.00");
            txtRevaluationDate.Text = _detail.RevaluationDate.Value.ToString("yyyy-MM-dd") == "1900-01-01" ? null : _detail.RevaluationDate.Value.ToString("yyyy-MM-dd"); //Add Asset_revaluation// ISNULL(arev.RevalutionDate, (select top(1) RevalutionDate from Asset_Revaluations where RevalutionDate < (SELECT CONCAT(RIGHT(@FinYear, 4), '/07/01')) and AssetRegisterID = i.AssetRegisterItem_ID order by Asset_RevaluationsID desc)) AS 'RevaluationDate'

            txtMovementInRevaluationReserve.Text = _detail.MovementInRevaluationReserve.Value.ToString("#0.00");
            txtRevaluationReserveClosing.Text = String.IsNullOrEmpty(_detail.RevaluationReserveClosingBalance.ToString()) ? "" : _detail.RevaluationReserveClosingBalance.Value.ToString("#0.00");
            txtRevaluationYear.Text = _summaries.OrderBy(x => x.ID).Sum(x => x.RevaluationValue.Value).ToString("#0.00");
            txtCarryingAmount.Text = _summaries.OrderBy(x => x.ID).Last().CurrentValue.Value < 0 ? "0" : (_summaries.OrderBy(x => x.ID).Last().CurrentValue.Value - (_detail.TransferFromAmount ?? 0) + (_detail.RefurbDepreciation ?? 0) + (_detail.RefurbDT ?? 0)).ToString("#0.00");  //case when ISNULL(adisp.DisposalValue, 0) <> 0  then 0 else CASE WHEN ISNULL(ats.CurrentValue, 0) < 0 THEN 0 ELSE ISNULL(ats.CurrentValue, 0) -ISNULL(i.TransferFromAmount, 0) + ISNULL(i.Refurb_Depreciation, 0) + (ISNULL(i.Refurb_DT, 0) - ISNULL(i.Refurb_CT, 0)) END END 'CarryingAmount'
            txtResidualValue.Text = _detail.ResidualValue.Value.ToString("#0.00");

            txtReplacementValue.Text = _detail.CurrentReplacementCostCRC.Value.ToString("#0.00");
            txtDepreciatedReplacement.Text = _detail.DepreciatedReplacementCostDRC.Value.ToString("#0.00");
            txtForecastReplacementYear.Text = _detail.ForecastReplacementYear.ToString();
            txtMaintenacePercentage.Text = _detail.AnnualisedMaintenanceCRC == null ? "" : _detail.AnnualisedMaintenanceCRC.Value.ToString("#0.00");
            txtMaintenaceBudget.Text = _detail.AnnualMaintenanceBudgetNeed == null ? "" : _detail.AnnualMaintenanceBudgetNeed.Value.ToString("#0.00");
            txtFundingSourceNo.Text = _detail.FundingSourceNumber;
            txtFundingSource.Text = _detail.FundingSource.ToString(); // Add FundingSource
            txtFundingType.Text = _detail.FundType;

            if (!String.IsNullOrEmpty(_detail.Insured.ToString()))
                lstInsuranceCover.SelectedValue = _detail.Insured.ToString();
            if (_detail.InsuredAmountInsuredBy != null)
                txtInsuredAmount.Text = ((decimal)_detail.InsuredAmountInsuredBy).ToString("#0.00");
            else
                txtInsuredAmount.Text = "";
            txtInsureanceRefNo.Text = String.IsNullOrEmpty(_detail.InsuranceNumberReference) ? "" : _detail.InsuranceNumberReference;
            if (!String.IsNullOrEmpty(_detail.Warranty.ToString()))
                lstWarranty.SelectedValue = _detail.Warranty.ToString();
            lblInsuranceDocView.Text = _detail.InsureanceDocument;

            imgInsBytes = null;
            lblInsuranceDocView.Text = _detail.InsureanceDocument;
            if (!String.IsNullOrEmpty(_detail.InsureanceDocument))
            {
                if (imgInsBytes == null)
                {
                    imgInsBytes = GetFileBytes(_detail.InsureanceDocument, false);
                }
                if (imgInsBytes != null)
                    lblInsuranceDocView.Text = _detail.InsureanceDocument;
                else
                    _detail.InsureanceDocument = "";
            }

            //Ownership

            lstDepartment.Enabled = false;

            if (!string.IsNullOrEmpty(_detail.MunicipalDepartmentId.ToString()))
                lstDepartment.SelectedValue = _detail.MunicipalDepartmentId.ToString();
            else if (!string.IsNullOrEmpty(_detail.Department.ToString()))
                lstDepartment.SelectedValue = _detail.Department.ToString();
            else
                lstDepartment.Enabled = true;
            try
            {
                if (!string.IsNullOrEmpty(_detail.CustodianId.ToString()))
                    lstCustodian.SelectedValue = _detail.CustodianId.ToString();
            }
            catch { }

            string num = _detail.CustodianIdNumber;
            if (string.IsNullOrEmpty(num))
                num = AssetsMicroservice.Employees.GetAllByIdAsync(lstCustodian.SelectedValue.intSafe()).Result.IdNumber;
            // num =  //_configMisc.GetCustodianNumber(lstCustodian.SelectedValue.intSafe());

            if (num == null)
                num = "";

            hdnCustodianNumber.Value = num;
            int rest = num.Length - 6;
            if (rest > 0)
                txtCustodianNumber.Text = num.Substring(0, 6).PadRight(num.Length, 'x');
            else
                txtCustodianNumber.Text = num;

            if (!String.IsNullOrEmpty(_detail.DivisionId.ToString()))
                lstDivision.SelectedValue = _detail.DivisionId.ToString();

            txtAssetOwnerShip.Text = _detail.AssetOwnershipName;
            txtDeedNumber.Text = _detail.DeedNumber;
            txtRegNumber.Text = _detail.RegistrationNumber;
            txtErfNumber.Text = _detail.ErfNumber;
            txtErfSize.Text = _detail.ErfSizeM2.Value.ToString("##0");
            txtSerialNumber.Text = _detail.SerialNumber;
            txtPortionNumber.Text = _detail.PortionNumber;
            txtUnitNumber.Text = _detail.UnitNumber;
            txtMake.Text = String.IsNullOrEmpty(_detail.Make) ? "" : _detail.Make;
            txtModel.Text = String.IsNullOrEmpty(_detail.Model) ? "" : _detail.Model;

            lbldonationDoc.Text = _detail.DonationDocument;
            txtDonorId.Text = _detail.DonorId ?? "";
            txtDonorName.Text = _detail.DonorName;
            txtDateDonated.Text = _detail.DateDonated == null || _detail.DateDonated.Value.ToString("yyyy-MM-dd") == "1900-01-01" ? null : _detail.DateDonated.Value.ToString("yyyy-MM-dd");

            imgDonBytes = null;
            lbldonationDoc.Text = _detail.DonationDocument;
            if (!String.IsNullOrEmpty(_detail.DonationDocument))
            {
                if (imgDonBytes == null)
                {
                    imgDonBytes = GetFileBytes(_detail.DonationDocument, false);
                }
                if (imgDonBytes != null)
                    lbldonationDoc.Text = _detail.DonationDocument;
                else
                    _detail.DonationDocument = "";
            }


            txtCapturer.Text = AssetsMicroservice.Employees.GetAllByIdAsync(_detail.CapturerId != null ? (int)_detail.CapturerId : mySession.Current.User_ID.ToString().intSafe()).Result.Description; //_configMisc.GetUserFullName(_detail.Capturer_ID);
            txtModifier.Text = mySession.Current.UserFullName;//AssetsMicroservice.Employees.GetAllByIdAsync(mySession.Current.UserFullName).Result.FullName; //_configMisc.GetUserFullName(mySession.Current.User_ID);

            txtWellKnownText.Text = String.IsNullOrEmpty(_detail.WellKnownTextWKT) ? "" : _detail.WellKnownTextWKT;

            try
            {
                if (!String.IsNullOrEmpty(_detail.GISId))
                {
                    lstGIS.SelectedValue = _detail.GISId.ToString();
                }
            }
            catch { }

            //AS
            txtGISFeature.Text = _detail.GISFeature;
            btnGIS.NavigateUrl = _detail.GISURL;
            txtLatittude.Text = _detail.Latitude;
            txtLogitude.Text = _detail.Longitude;

            if (!String.IsNullOrEmpty(_detail.SGNumberChangeId))
                txtSG.Text = _detail.SGNumberChangeId;


            if (!String.IsNullOrEmpty(_detail.TownId.ToString()))
                lstTown.SelectedValue = _detail.TownId.ToString();

            if (!String.IsNullOrEmpty(_detail.SuburbId.ToString()))
                lstSuburb.SelectedValue = _detail.SuburbId.ToString();



            if (!String.IsNullOrEmpty(_detail.ZoningId.ToString()))
                lstZone.SelectedValue = _detail.ZoningId.ToString();

            if (!String.IsNullOrEmpty(_detail.WardId.ToString()))
                lstWard.SelectedValue = _detail.WardId.ToString();

            if (!String.IsNullOrEmpty(_detail.StreetId.ToString()))
                lstStreet.SelectedValue = _detail.StreetId.ToString();

            if (!String.IsNullOrEmpty(_detail.BuildingId.ToString()))
                lstBuilding.SelectedValue = _detail.BuildingId.ToString();

            if (!String.IsNullOrEmpty(_detail.FloorId.ToString()))
                lstFloor.SelectedValue = _detail.FloorId.ToString();

            if (!String.IsNullOrEmpty(_detail.RoomId.ToString()))
                lstRoom.SelectedValue = _detail.RoomId.ToString();

            txtSite.Text = _detail.SiteNumber;

            var CustomList = AssetsMicroservice.AssetConfigCustomFields.GetAllAsync().Result.OrderBy(x => x.Id).ToList();

            lblCustom1.Text = CustomList.Count >= 1 ? CustomList[0].CustomFieldDesc : "Custom 1";
            lblCustom2.Text = CustomList.Count >= 2 ? CustomList[1].CustomFieldDesc : "Custom 2";
            lblCustom3.Text = CustomList.Count >= 3 ? CustomList[2].CustomFieldDesc : "Custom 3";
            lblCustom4.Text = CustomList.Count >= 4 ? CustomList[3].CustomFieldDesc : "Custom 4";
            lblCustom5.Text = CustomList.Count >= 5 ? CustomList[4].CustomFieldDesc : "Custom 5";
            lblCustom6.Text = CustomList.Count >= 6 ? CustomList[5].CustomFieldDesc : "Custom 6";
            lblCustom7.Text = CustomList.Count >= 7 ? CustomList[6].CustomFieldDesc : "Custom 7";
            lblCustom8.Text = CustomList.Count >= 8 ? CustomList[7].CustomFieldDesc : "Custom 8";
            lblCustom9.Text = CustomList.Count >= 9 ? CustomList[8].CustomFieldDesc : "Custom 9";


            txtCustom1.Text = _detail.Custom1;
            txtCustom2.Text = _detail.Custom2;
            txtCustom3.Text = _detail.Custom3;
            txtCustom4.Text = _detail.Custom4;
            txtCustom5.Text = _detail.Custom5;
            txtCustom6.Text = _detail.Custom6;
            txtCustom7.Text = _detail.Custom7;
            txtCustom8.Text = _detail.Custom8;
            txtCustom9.Text = _detail.Custom9;

            if (!_forApproval)
                txtReason.Text = "";
            else
                txtReason.Text = _detail.ReasonForChange;

            updatePanelMain.Update();
        }

        private void HideSearchGridColumns()
        {            
                AssetSearch1.ColumnsToHide = new List<int>();
                AssetSearch1.ColumnsToHide.Add(1);
                AssetSearch1.ColumnsToHide.Add(3);
                AssetSearch1.ColumnsToHide.Add(5);
                AssetSearch1.ColumnsToHide.Add(7);
                AssetSearch1.ColumnsToHide.Add(9);
                AssetSearch1.ColumnsToHide.Add(11);
                AssetSearch1.ColumnsToHide.Add(13);
                AssetSearch1.ColumnsToHide.Add(15);
                AssetSearch1.ColumnsToHide.Add(16);
                        
        }

        protected void tabStripMain_TabClick(object sender, Telerik.Web.UI.RadTabStripEventArgs e)
        {
            SelectPrevNext();
        }

        private void SelectPrevNext()
        {
            updatePanelMain.Update();

            btnBack.Visible = true;
            btnNext.Visible = true;
            btnReject.Visible = false;
            btnApp2.Visible = false;
            btnSubmit.Visible = false;

            switch (wizStripMain.ActiveStep.ID)
            {
                case "stepDetails":
                    btnBack.Visible = false;
                    break;
                case "stepFinancial":
                    break;
                case "stepOwnership":
                    break;
                case "stepLocation":
                    btnNext.Visible = false;
                    if (_forApproval)
                    {
                        btnReject.Visible = true;
                        btnApp2.Visible = true;
                    }
                    else
                    {
                        btnReject.Visible = false;
                        btnSubmit.Visible = true;
                    }
                    break;
            }
        }

        private void ValidateSinglePage()
        {
            switch (wizStripMain.ActiveStep.ID)
            {
                case "stepDetails":
                    ValidatePage1();
                    break;
                case "stepFinancial":
                    ValidatePage2();
                    break;

                case "stepOwnership":
                    ValidatePage3();
                    break;
                case "stepLocation":
                    ValidatePage4();
                    break;
            }

        }
       
        protected void btnBack_Click(object sender, EventArgs e)
        {
            wizStripMain.ActiveStepIndex--;
            SelectPrevNext();
        }

        protected void btnNext_Click(object sender, EventArgs e)
        {
            ValidateSinglePage();
            wizStripMain.ActiveStepIndex++;
            wizStripMain_ActiveStepChanged(null, null);
            SelectPrevNext();
        }

        private static byte[] imgBytes;
        private static byte[] imgInsBytes;
        private static byte[] imgDonBytes;

        protected void btnApprove_Click(object sender, EventArgs e)
        {
            ValidateAllPages();
            if (!validated)
            {
                string SayWhat = "";
                SayWhat = "Validation Failed. Details are Missing";
                ScriptManager.RegisterStartupScript(this, this.GetType(), "classupdated", "ShowUpdated('" + SayWhat + "');", true);
            }
            else
            {
                selectedEvent = "Approve";
                lblQuestion.Text = "Are you sure you want to Approve the changes made the the Asset Record?";
                btnExecutePopup.Visible = true;
                upDialog.Update();
                ScriptManager.RegisterStartupScript(this, this.GetType(), "Pop", "openModal();", true);
            }
        }

        
        private byte[] GetFileBytes(string fileName, bool useWildCard = false)
        {
            string rootfile = CommonTasks.GetfullPath("FolderAssetDocuments");
            if (String.IsNullOrEmpty(rootfile))
                rootfile = "c:\\AssetDocuments\\";

            string fullPath = rootfile + fileName;
            if (useWildCard)
            {
                string[] afiles = System.IO.Directory.GetFiles(rootfile, "*" + fileName);
                if (afiles.Length > 0)
                {
                    fullPath = afiles[0];
                }
            }

            byte[] ImageData = null;
            try
            {
                FileStream fs = new FileStream(fullPath, FileMode.Open, FileAccess.Read);

                // Create a byte array of file stream length
                ImageData = new byte[fs.Length];

                //Read block of bytes from stream into the byte array
                fs.Read(ImageData, 0, System.Convert.ToInt32(fs.Length));
                //Close the File Stream
                fs.Close();
            }
            catch
            { }
            
            return ImageData;
        }

        private void GetImg(string imageFile)
        {
            imgBytes = null;
            string rootfile = CommonTasks.GetfullPath("FolderAssetDocuments");
            if (String.IsNullOrEmpty(rootfile))
                rootfile = "c:\\AssetDocuments\\";

            MemoryStream ms = new MemoryStream();
            Image img = Image.FromFile(rootfile + imageFile);
            img.Save(ms, System.Drawing.Imaging.ImageFormat.Jpeg);

            imgBytes = ms.ToArray();
        }

        protected void Unnamed_Click(object sender, EventArgs e)
        {
            switch (selectedEvent)
            {
                case "Submit":
                    SubmitForApproval();
                    break;
                case "Approve":
                    SaveData();
                    break;
                case "Reject":
                    Reject();
                    break;
                default:
                    break;
            }
        }

        private void Reject()
        {
            bool isRejected = AssetsMicroservice.AssetRegisterItemApprovals.RejectByAssetRegisterItemIdAsync(AssetRegisterItem_ID).Result;
            if (isRejected)
            {
                if (_forApproval)
                    Session["Reject"] = "true";
                _forApproval = false;

                Response.Redirect(this._pageName);
            }           

        }
               
        protected void btnReject_Click(object sender, EventArgs e)
        {

            selectedEvent = "Reject";
            lblQuestion.Text = "Are you sure you want to reject the changes made the the Asset Record?";
            btnExecutePopup.Visible = true;
            upDialog.Update();
            ScriptManager.RegisterStartupScript(this, this.GetType(), "Pop", "openModal();", true);

            
        }

        protected void lstTown_SelectedIndexChanged(object sender, EventArgs e)
        {
            LoadSuburbs(lstTown.SelectedValue.intSafe());
            LoadStreets(lstTown.SelectedValue.intSafe());
            LoadBuildings(lstTown.SelectedValue.intSafe());
            LoadFloors(lstTown.SelectedValue.intSafe());
            LoadRooms(lstTown.SelectedValue.intSafe());
            upProvince.Update();
        }

        protected void lstSuburb_SelectedIndexChanged(object sender, EventArgs e)
        {
            LoadStreets(lstTown.SelectedValue.intSafe(),lstSuburb.SelectedValue.intSafe());
            LoadBuildings(lstTown.SelectedValue.intSafe(), lstSuburb.SelectedValue.intSafe());
            LoadFloors(lstTown.SelectedValue.intSafe(), lstSuburb.SelectedValue.intSafe());
            LoadRooms(lstTown.SelectedValue.intSafe(), lstSuburb.SelectedValue.intSafe());
            upProvince.Update();
        }

        protected void lstStreet_SelectedIndexChanged(object sender, EventArgs e)
        {
            LoadBuildings(lstTown.SelectedValue.intSafe(), lstSuburb.SelectedValue.intSafe(),lstStreet.SelectedValue.intSafe());
            LoadFloors(lstTown.SelectedValue.intSafe(), lstSuburb.SelectedValue.intSafe(), lstStreet.SelectedValue.intSafe());
            LoadRooms(lstTown.SelectedValue.intSafe(), lstSuburb.SelectedValue.intSafe(), lstStreet.SelectedValue.intSafe());
            upProvince.Update();
        }

        protected void lstBuilding_SelectedIndexChanged(object sender, EventArgs e)
        {
            LoadFloors(lstTown.SelectedValue.intSafe(), lstSuburb.SelectedValue.intSafe(), lstStreet.SelectedValue.intSafe(),lstBuilding.SelectedValue.intSafe());
            try
            {
                if (!String.IsNullOrEmpty(_detail.FloorId.ToString()))
                    lstFloor.SelectedValue = _detail.FloorId.ToString();
            }
            catch { }
            //LoadRooms(lstTown.SelectedValue.intSafe(), lstSuburb.SelectedValue.intSafe(), lstStreet.SelectedValue.intSafe(), lstBuilding.SelectedValue.intSafe());
            upProvince.Update();
        }

        protected void lstFloor_SelectedIndexChanged(object sender, EventArgs e)
        {
            LoadRooms(lstTown.SelectedValue.intSafe(), lstSuburb.SelectedValue.intSafe(), lstStreet.SelectedValue.intSafe(), lstBuilding.SelectedValue.intSafe(),lstFloor.SelectedValue.intSafe());
            try
            {
                if (!String.IsNullOrEmpty(_detail.RoomId.ToString()))
                    lstRoom.SelectedValue = _detail.RoomId.ToString();
            }
            catch { }
            upProvince.Update();
        }

        protected void lstDepartment_SelectedIndexChanged(object sender, EventArgs e)
        {
            LoadDivisions(lstDepartment.SelectedValue.intSafe());
            LoadCustodian(lstDepartment.SelectedValue.intSafe());
            upDepartment.Update();
        }

        protected void lstCustodian_SelectedIndexChanged(object sender, EventArgs e)
        {
            var custodian = AssetsMicroservice.Employees.GetAllByIdAsync(lstCustodian.SelectedValue.intSafe()).Result;
                        
            hdnCustodianNumber.Value = custodian != null ? custodian.IdNumber : string.Empty;
            int numlen = custodian != null ? custodian.IdNumber.Length : 0;  // Updated to check custodian before usage
            int rest = numlen - 6;
            if (rest > 0)
                txtCustodianNumber.Text = custodian.IdNumber.Substring(0,6).PadRight(numlen, 'x');
            else
                txtCustodianNumber.Text = custodian.IdNumber;

            upDepartment.Update();
        }

        private static string imgYes = "~/img/KPITargetMet.png";
        private static string imgNo = "~/img/KPITargetMissed.png";

        private bool validated = false;

        private void setThumbs()
        {
            stepDetails.ImageUrl = imgNo;
            stepFinancial.ImageUrl = imgNo;
            stepOwnership.ImageUrl = imgNo;
            stepLocation.ImageUrl = imgNo;
        }

        private void ValidateAllPages()
        {
            ValidatePage4();
            validated = false;
            int val = 0;


            //main properties
            if (AssetProperties1.AssetType_ID == 0)
            {
                stepDetails.ImageUrl = imgNo;
                stepFinancial.ImageUrl = imgNo;
                stepOwnership.ImageUrl = imgNo;
                stepLocation.ImageUrl = imgNo;
                val = 0;
            }
            else


            //first tab
            if (datAcuisition.SelectedDate == null)
            {
                stepDetails.ImageUrl = imgNo;
            }
            else
            {
                if (datVerificationDate.SelectedDate == null)
                {
                    stepDetails.ImageUrl = imgNo;
                }
                else
                {
                    var response = AssetsMicroservice.AssetRegisterItems.GetRemainingUsefulLifeChangedAsync(AssetProperties1.AssetRegister_ID).Result;
                    if (response)
                    {
                        if (lblShowDepreciationMsg.Text.Contains("Waiting for Approval"))
                        {
                            stepDetails.ImageUrl = imgNo;
                        }
                        else
                        {
                            stepDetails.ImageUrl = imgYes;
                            val = 1;
                        }
                    }
                    else
                    {
                        stepDetails.ImageUrl = imgYes;
                        val = 1;
                    }
                }
            }

            //second tab
            stepFinancial.ImageUrl = imgNo;
            val++;

            //third tab
            if (lstDepartment.SelectedValue.intSafe() <= 0)
                stepOwnership.ImageUrl = imgNo;
            else if (lstDivision.SelectedValue.intSafe() <= 0)
                stepOwnership.ImageUrl = imgNo;
            else if (lstCustodian.SelectedValue.intSafe() <= 0)
                stepOwnership.ImageUrl = imgNo;
            else if (txtAssetOwnerShip.Text == "")//(lstOwership.SelectedValue.intSafe() <= 0)
                stepOwnership.ImageUrl = imgNo;
            else
            {
                stepOwnership.ImageUrl = imgYes;
                val++;
            }
            //if (txtLatittude.Text.decSafe() == 0)
            //    stepLocation.ImageUrl = imgNo;
            //else if (txtLogitude.Text.decSafe() == 0)
            //    stepLocation.ImageUrl = imgNo;
            //else 
            if (lstTown.SelectedValue.intSafe() <= 0)
                stepLocation.ImageUrl = imgNo;
            else if (txtReason.Text == "")
                stepLocation.ImageUrl = imgNo;
            else
            {
                stepLocation.ImageUrl = imgYes;
                val++;
            }



            if (val == 4)
            {
                validated = true;
                // btnApp2.Enabled = true;
            }
            else
            {
                if (lblShowDepreciationMsg.Text.Contains("Waiting for Approval"))
                {
                    validated = true;
                }
                else
                {
                    validated = false;
                }
                    // btnApp2.Enabled = false;
            }


        }

        private void ValidatePage1()
        {
            validated = false;
            if (Session[$"AssetFile21"] != null)
            {
                imgBytes = (byte[])Session[$"AssetFileBytes21"];
                lblShowImage.Text = Session[$"AssetFile21"].ToString();
            }

            bool val = true;
            val = AssetProperties1.Validate();

            if (datAcuisition.SelectedDate == null)
            {
                val = false;
                datAcuisition.BorderColor = Color.Red;
                datAcuisition.BorderWidth = 2;
            }
            else
                datAcuisition.BorderColor = Color.White;

            if (datVerificationDate.SelectedDate == null)
            {
                val = false;
                datVerificationDate.BorderColor = Color.Red;
                datVerificationDate.BorderWidth = 2;
            }
            else
            {
                datVerificationDate.BorderColor = Color.White;
            }

            if (txtUsefulLife.Text.decSafe() <= 0)
            {
                val = false;
                txtUsefulLife.BorderColor = Color.Red;
                txtUsefulLife.BorderWidth = 2;
            }
            else
            {
                txtUsefulLife.BorderColor = Color.White;
            }

            if (lstCondition.SelectedValue.intSafe() <= 0)
            {
                val = false;
                lstCondition.BorderColor = Color.Red;
                lstCondition.BorderWidth = 2;
            }
            else
                lstCondition.BorderColor = Color.White;



            if (txtUsefulLife.Text.decSafe() < txtUsefulLifeRemain.Text.decSafe())
            {
                val = false;
                txtUsefulLifeRemain.BorderColor = Color.Red;
                txtUsefulLifeRemain.BorderWidth = 2;
            }
            else
            {
                txtUsefulLifeRemain.BorderColor = Color.White;
            }

            if ( String.IsNullOrEmpty(txtUsefulLifeRemain.Text))
            {
                val = false;
                txtUsefulLifeRemain.BorderColor = Color.Red;
                txtUsefulLifeRemain.BorderWidth = 2;
            }
            else
            {
                txtUsefulLifeRemain.BorderColor = Color.White;
            }

            if (val)
            {
                stepDetails.ImageUrl = imgYes;
            }
            else
            {
                stepDetails.ImageUrl = imgNo;
            }

        }

        private void ValidatePage2()
        {
            if (Session[$"AssetUploadedFile22"] != null)
            {
                lblInsuranceDocView.Text = Session[$"AssetUploadedFile22"].ToString();
            }

            validated = false;
            bool val = true;
            //second tab
            
            if (val)
            {
                stepFinancial.ImageUrl = imgYes;
            }
            else
            {
                stepFinancial.ImageUrl = imgNo;
            }
        }

        private void ValidatePage3()
        {
            if (Session[$"AssetUploadedFile30"] != null)
            {
                lbldonationDoc.Text = Session[$"AssetUploadedFile30"].ToString();
            }


            validated = false;
            bool val = true;

            //third tab
            if (lstDepartment.SelectedValue.intSafe() <= 0)
            {
                val = false;
                lstDepartment.BorderColor = Color.Red;
                lstDepartment.BorderWidth = 2;
            }
            else
                lstDepartment.BorderColor = Color.White;

            if (lstDivision.SelectedValue.intSafe() <= 0)
            {
                val = false;
                lstDivision.BorderColor = Color.Red;
                lstDivision.BorderWidth = 2;
            }
            else
                lstDivision.BorderColor = Color.White;

            if (lstCustodian.SelectedValue.intSafe() <= 0)
            {
                val = false;
                lstCustodian.BorderColor = Color.Red;
                lstCustodian.BorderWidth = 2;
            }
            else
                lstCustodian.BorderColor = Color.White;

            if (txtAssetOwnerShip.Text == "")//(lstOwership.SelectedValue.intSafe() <= 0)
            {
                val = false;
                txtAssetOwnerShip.BorderColor = Color.Red;
                txtAssetOwnerShip.BorderWidth = 2;
            }
            else
                txtAssetOwnerShip.BorderColor = Color.White;

            if (val)
                stepOwnership.ImageUrl = imgYes;
            else
                stepOwnership.ImageUrl = imgNo;
            if (val)
            {
                stepOwnership.ImageUrl = imgYes;
            }
            else
            {
                stepOwnership.ImageUrl = imgNo;
            }
        }

        private void ValidatePage4()
        {
            validated = false;
            bool val = true;
            // Page 4
            //if (txtLatittude.Text.decSafe() == 0)
            //{
            //    val = false;
            //    txtLatittude.BorderColor = Color.Red;
            //    txtLatittude.BorderWidth = 2;
            //}
            //else
            //    txtLatittude.BorderColor = Color.White;

            //if (txtLogitude.Text.decSafe() == 0)
            //{
            //    val = false;
            //    txtLogitude.BorderColor = Color.Red;
            //    txtLogitude.BorderWidth = 2;
            //}
            //else
            //    txtLogitude.BorderColor = Color.White;

            if (lstTown.SelectedValue.intSafe() <= 0)
            {
                val = false;
                lstTown.BorderColor = Color.Red;
                lstTown.BorderWidth = 2;
            }
            else
                lstTown.BorderColor = Color.White;

            if (txtReason.Text == "")
            {
                val = false;
                txtReason.BorderColor = Color.Red;
                txtReason.BorderWidth = 2;
            }
            else
                txtReason.BorderColor = Color.White;

            if (val)
                stepLocation.ImageUrl = imgYes;
            else
            {
                stepLocation.ImageUrl = imgNo;
            }
            upProvince.Update();
        }

        protected void txtReason_TextChanged(object sender, EventArgs e)
        {

        }

        protected void wizStripMain_ActiveStepChanged(object sender, EventArgs e)
        {

            switch (wizStripMain.ActiveStep.ID)
            {
                case "stepFinancial":
                    AssetProperties2.AllowEdit(false);

                    AssetProperties2.ParentAssetID = AssetProperties1.ParentAssetID;
                    AssetProperties2.MainAssetID = AssetProperties1.MainAssetID;
                    AssetProperties2.MainAssetDescription = AssetProperties1.MainAssetDescription;
                   
                    AssetProperties2.pCIDMSSubComponentTypeID = AssetProperties1.pCIDMSSubComponentTypeID;
                    AssetProperties2.CIDMSSubComponentTypeID = AssetProperties1.pCIDMSSubComponentTypeID;
                    AssetProperties2.PopulateItems(AssetProperties1.AssetRegister_ID, AssetProperties1.AssetDescription, AssetProperties1.AssetType_ID, AssetProperties1.AssetCategoryID
                                                   , AssetProperties1.SubCategory_ID, AssetProperties1.AssetClass_ID, AssetProperties1.MeasurementType_ID, AssetProperties1.AssetStatus_ID
                                                   , AssetProperties1.Barcode, AssetProperties1.Condition_ID,AssetProperties1.OldBarcode);
                    AssetProperties2.LockAll();
                    UpdatePanel1.Update();
                    break;
                case "stepOwnership":
                    AssetProperties3.AllowEdit(false);

                    AssetProperties3.ParentAssetID = AssetProperties1.ParentAssetID;
                    AssetProperties3.MainAssetID = AssetProperties1.MainAssetID;
                    AssetProperties3.MainAssetDescription = AssetProperties1.MainAssetDescription;

                    AssetProperties3.pCIDMSSubComponentTypeID = AssetProperties1.pCIDMSSubComponentTypeID;
                    AssetProperties3.CIDMSSubComponentTypeID = AssetProperties1.pCIDMSSubComponentTypeID;
                    AssetProperties3.PopulateItems(AssetProperties1.AssetRegister_ID, AssetProperties1.AssetDescription, AssetProperties1.AssetType_ID, AssetProperties1.AssetCategoryID
                                                   , AssetProperties1.SubCategory_ID, AssetProperties1.AssetClass_ID, AssetProperties1.MeasurementType_ID, AssetProperties1.AssetStatus_ID
                                                   , AssetProperties1.Barcode, AssetProperties1.Condition_ID, AssetProperties1.OldBarcode);
                    AssetProperties3.LockAll();
                    break;
                case "stepLocation":
                    AssetProperties4.AllowEdit(false);

                    AssetProperties4.ParentAssetID = AssetProperties1.ParentAssetID;
                    AssetProperties4.MainAssetID = AssetProperties1.MainAssetID;
                    AssetProperties4.MainAssetDescription = AssetProperties1.MainAssetDescription;

                    AssetProperties4.pCIDMSSubComponentTypeID = AssetProperties1.pCIDMSSubComponentTypeID;
                    AssetProperties4.CIDMSSubComponentTypeID = AssetProperties1.pCIDMSSubComponentTypeID;
                    AssetProperties4.PopulateItems(AssetProperties1.AssetRegister_ID, AssetProperties1.AssetDescription, AssetProperties1.AssetType_ID, AssetProperties1.AssetCategoryID
                                                   , AssetProperties1.SubCategory_ID, AssetProperties1.AssetClass_ID, AssetProperties1.MeasurementType_ID, AssetProperties1.AssetStatus_ID
                                                   , AssetProperties1.Barcode, AssetProperties1.Condition_ID, AssetProperties1.OldBarcode);
                    AssetProperties4.LockAll();
                    break;
                default:
                    break;
            }



            btnBack.Visible = true;
            btnNext.Visible = true;

            SelectPrevNext();

            btnApp2.Visible = false;
            btnSubmit.Visible = false;
            btnReject.Visible = false;

            switch (wizStripMain.ActiveStep.ID)
            {
                case "stepDetails":
                    btnBack.Visible = false;
               //     btnApprove.Visible = false;
                    btnReject.Visible = false;

                    //stepDetails.Active = true;
                    break;
                case "stepFinancial":
                 //   btnApprove.Visible = false;
                    btnReject.Visible = false;

                    //stepFinancial.Active = true;
                    break;
                case "stepOwnership":
              //      btnApprove.Visible = false;
                    btnReject.Visible = false;

                    //stepOwnership.Active = true;
                    break;
                case "stepLocation":
                    btnNext.Visible = false;
                    btnSubmit.Visible = true;
                    btnReject.Visible = true;
                    //stepLocation.Active = true;

                    break;

            }

            if (_forApproval)
            {
                LockScreen();
            }
        }

        protected void BtnClose_Click(object sender, EventArgs e)
        {
            Response.Redirect("~/AssetsLanding.aspx");
        }

       protected void wizTop_ActiveStepChanged(object sender, EventArgs e)
        {
            string msg = "";
            if (wizTop.ActiveStep.ID == "stepEdit")
            {
                Response.Redirect(_pageName);
            }
            else
            {
                Response.Redirect(this._pageName + "?ForApproval=true");
            }

        }

        protected void btnSubmit_Click(object sender, EventArgs e)
        {
            ValidateAllPages();
            if (!validated)
            {
                string SayWhat = "";
                SayWhat = "Validation Failed. Details are Missing";
                ScriptManager.RegisterStartupScript(this, this.GetType(), "classupdated", "ShowUpdated('" + SayWhat + "');", true);

            }
            else
            {
                selectedEvent = "Submit";
                lblQuestion.Text = "Are you sure you want to submit the transaction for Approval?";
                btnExecutePopup.Visible = true;
                upDialog.Update();
                ScriptManager.RegisterStartupScript(this, this.GetType(), "Pop", "openModal();", true);
            }
        }
              
        private void SaveData()
        {
            ScriptManager.RegisterStartupScript(this, this.GetType(), "Pop", "CloseModalPopup();", true);

            ValidateAllPages();
            if (validated)
            {
                _detail.Id = AssetProperties1.AssetRegister_ID;
                _detail.ParentAssetRegisterItemId = AssetProperties1.ParentAssetID;
                _detail.MainAssetId = AssetProperties1.MainAssetID;
                _detail.MainAssetDescription = AssetProperties1.MainAssetDescription;
                _detail.Description = AssetProperties1.AssetDescription;
                _detail.MunicipalAssetId = AssetProperties1.MunicipalAssetID;

                _detail.AssetTypeId = AssetProperties1.AssetType_ID == 0 ? null : AssetProperties1.AssetType_ID;
                _detail.AssetCategoryId = AssetProperties1.AssetCategoryID == 0 ? null : AssetProperties1.AssetCategoryID;
                _detail.AssetSubCategoryId = AssetProperties1.SubCategory_ID == 0 ? null : AssetProperties1.SubCategory_ID;
                _detail.AssetClassId = AssetProperties1.AssetClass_ID == 0 ? null : AssetProperties1.AssetClass_ID;
                _detail.AssetStatusId = AssetProperties1.AssetStatus_ID == 0 ? null : AssetProperties1.AssetStatus_ID;
                _detail.MeasurementTypeId = AssetProperties1.MeasurementType_ID == 0 ? null : AssetProperties1.MeasurementType_ID;

                _detail.Barcode = AssetProperties1.Barcode;
                _detail.OldBarCode = AssetProperties1.OldBarcode;
                _detail.UsefulLifeMonthComponent = txtUsefulLife.Text.intSafe();

                // CIDMS
                _detail.CIDMSSubComponentTypeId = AssetProperties1.pCIDMSSubComponentTypeID;

                _detail.BasicMunicipalityService = lstMunicipalityServices.SelectedValue.intSafe();
                _detail.CriticalityGrade = lstCriticalityGrade.SelectedValue.intSafe();
                _detail.PerformanceGrade = lstPerformanceGrade.SelectedValue.intSafe();

                _detail.UtilisationGrade = lstUtilisationGrade.SelectedValue.intSafe();
                _detail.InfrastructureHealthGrade = lstInfrastructureHealthGrade.SelectedValue.intSafe();
                _detail.ConsequenceOfFailure = lstConsequenceOfFailure.SelectedValue;
                _detail.Risk = lstRisk.SelectedValue.intSafe().ToString();

                _detail.CashOrNoncashgeneratingunit = lstCashGenerating.SelectedValue.ToString();
                _detail.FinancialStatusId = lstFinancialStatus.SelectedValue.intSafe();
                _detail.AssetConditionId = lstCondition.SelectedValue.intSafe(); //AssetProperties1.Condition_Id;

                _detail.AcquisitionDate = Convert.ToDateTime(((DateTime)datAcuisition.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());
                _detail.VerificationDate = Convert.ToDateTime(((DateTime)datVerificationDate.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());
                _detail.RemainingUsefulLife = Convert.ToDecimal(txtUsefulLifeRemain.Text);
                _detail.InServiceDate = Convert.ToDateTime(((DateTime)datInService.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());
                _detail.VerifyId = lstVerifyID.SelectedValue.intSafe();
                _detail.CommisioningDate = Convert.ToDateTime(((DateTime)datInService.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());

                _detail.RemainingUsefulLifeYear = Convert.ToDecimal(txtUsefulLifeRemain.Text) / 12;
                _detail.ReadyForUse = Convert.ToDateTime(((DateTime)datInService.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());  //(datAcuisition.SelectedDate.Value);

                _detail.UoM = lstUOM.SelectedValue.intSafe();//txtUOM.Text;
                _detail.DimensionQuantity = txtDimQuantity.Text.intSafe();
                _detail.Dim1 = txtDim1.Text.decSafe();
                _detail.Dim2 = txtDim2.Text.decSafe();
                _detail.Dim3 = txtDim3.Text.decSafe();
                 
                _detail.Quantity = txtQuantity.Text.decSafe() <= 0 ? 1 : txtQuantity.Text.decSafe();
                _detail.ConstructionMaterial = txtConstMaterial.Text;
                _detail.Diameter = txtDiameter.Text;
                _detail.Capacity = txtCapacity.Text;

                _detail.Image = imgBytes;
                _detail.ImageRef = lblShowImage.Text;

                _detail.PurchaseAmount = txtFundingSourceAmount.Text.decSafe();

                _detail.ResidualValue = txtResidualValue.Text.decSafe();
                _detail.ReplacementValue = txtReplacementValue.Text.decSafe();
                _detail.InsuredAmountInsuredBy = txtInsuredAmount.Text.decSafe();
                _detail.InsuranceNumberReference = txtInsureanceRefNo.Text;
                _detail.InsureanceDocument = lblInsuranceDocView.Text;
                //upload file

                _detail.Department = lstDepartment.SelectedValue.intSafe();
                _detail.MunicipalDepartmentId = lstDepartment.SelectedValue.intSafe();

                _detail.DivisionId = lstDivision.SelectedValue.intSafe();
                _detail.CustodianId = lstCustodian.SelectedValue.intSafe();
                _detail.CustodianIdNumber = hdnCustodianNumber.Value;
                _detail.AssetOwnershipName = txtAssetOwnerShip.Text;// lstOwership.SelectedValue.intSafe();

                _detail.GISId = lstGIS.SelectedValue.ToString();
                _detail.Latitude = txtLatittude.Text;
                _detail.Longitude = txtLogitude.Text;
                _detail.GISFeature = txtGISFeature.Text;
                _detail.SGNumberChangeId = txtSG.Text;

                _detail.TownId = lstTown.SelectedValue.intSafe();
                _detail.SuburbId = lstSuburb.SelectedValue.intSafe();
                _detail.SiteNumber = txtSite.Text;
                _detail.ZoningId = lstZone.SelectedValue.intSafe();
                _detail.WardId = lstWard.SelectedValue.intSafe();
                _detail.StreetId = lstStreet.SelectedValue.intSafe();
                _detail.BuildingId = lstBuilding.SelectedValue.intSafe();
                _detail.FloorId = lstFloor.SelectedValue.intSafe();
                _detail.RoomId = lstRoom.SelectedValue.intSafe();
                _detail.ReasonForChange = txtReason.Text;

                _detail.PortionNumber = txtPortionNumber.Text;
                _detail.UnitNumber = txtUnitNumber.Text;
                _detail.RegistrationNumber = txtRegNumber.Text;
                _detail.DeedNumber = txtDeedNumber.Text;
                _detail.ErfNumber = txtErfNumber.Text;
                _detail.ErfSizeM2 = txtErfSize.Text.decSafe();
                _detail.SerialNumber = txtSerialNumber.Text;

                _detail.DonationDocument = lbldonationDoc.Text;

                _detail.DonorRegNumber = txtDonorId.Text == "" ? null : txtDonorId.Text;
                _detail.DonorName = txtDonorName.Text;

                _detail.ForecastReplacementYear = txtForecastReplacementYear.Text.intSafe();

                _detail.Make = txtMake.Text;
                _detail.Model = txtModel.Text;
                _detail.InsuranceNumberReference = txtInsureanceRefNo.Text;
                _detail.WellKnownTextWKT = txtWellKnownText.Text;

                _detail.Insured = lstInsuranceCover.SelectedValue.intSafe();
                _detail.Warranty = lstWarranty.SelectedValue.intSafe().ToString();

                _detail.Custom1 = txtCustom1.Text;
                _detail.Custom2 = txtCustom2.Text;
                _detail.Custom3 = txtCustom3.Text;
                _detail.Custom4 = txtCustom4.Text;
                _detail.Custom5 = txtCustom5.Text;
                _detail.Custom6 = txtCustom6.Text;
                _detail.Custom7 = txtCustom7.Text;
                _detail.Custom8 = txtCustom8.Text;
                _detail.Custom9 = txtCustom9.Text;

                _detail.ManagedFlag = true;
                _detail.ApprovalId = mySession.Current.User_ID;
                _detail.IsAwaitingApproval = false;

                _forApproval = false;

                //AS UPDATETO MICROSERVICE

                // int result = _configItem.SaveRegisterDetails(_forApproval, _detail);

                var responseMessage = string.Empty;
                var result = AssetRegisterItem_ID == 0
                    ? AssetsMicroservice.AssetRegisterItems.CreateAsync(_detail).Result
                    : AssetsMicroservice.AssetRegisterItems.UpdateAsync(AssetRegisterItem_ID, _detail).Result;

                if (result is not null)
                {
                    if (result.IsSuccessStatusCode)
                    {
                        int AssetId = result.Entity.Id;
                        responseMessage = result.StatusCode switch
                        {
                            HttpStatusCode.Created => $"{UseCaseDescription} has been Added successfully.",
                            _ => $"{UseCaseDescription} has been Updated successfully."
                        };

                        Session["Saved"] = "true";
                        if (!_forApproval && _detail.Id > 0)
                        {
                            AssetsMicroservice.AssetRegisterItems
                                .UpdateRemainingUsefulLifeAsync(_detail.Id,
                                    Convert.ToDecimal(txtUsefulLifeRemain.Text)).ConfigureAwait(false);
                        }
                        
                    }
                    else
                    {
                        Session["Saved"] = "false";
                        var duplicateFound = result.Problem.Errors.SelectMany(x => x.Value)
                            .Any(x => x.Contains("already exist"));

                        if (duplicateFound)
                            responseMessage = $"{UseCaseDescription} already exist.";

                    }
                }

                Response.Redirect(this._pageName);

            }

        }

        private void SubmitForApproval()
        {
            ScriptManager.RegisterStartupScript(this, this.GetType(), "Pop", "CloseModalPopup();", true);

            ValidateAllPages();
            if (validated)
            {
                AssetRegisterItemApprovalView _appr = new AssetRegisterItemApprovalView();
                if (Core_Approval_AssetRegisterItem != null)
                    _appr = Core_Approval_AssetRegisterItem;

                _appr.AssetRegisterItemId = AssetRegisterItem_ID;

                _appr.ParentAssetRegisterItemId = AssetProperties1.ParentAssetID;
                _appr.MainAssetId = AssetProperties1.MainAssetID;
                _appr.MainAssetDescription = AssetProperties1.MainAssetDescription;
                _appr.Description = AssetProperties1.AssetDescription;
                _appr.MunicipalAssetId = AssetProperties1.MunicipalAssetID;

                _appr.AssetTypeId = AssetProperties1.AssetType_ID == 0 ? null : AssetProperties1.AssetType_ID;
                _appr.AssetCategoryId = AssetProperties1.AssetCategoryID == 0 ? null : AssetProperties1.AssetCategoryID;
                _appr.AssetSubCategoryId = AssetProperties1.SubCategory_ID == 0 ? null : AssetProperties1.SubCategory_ID;
                _appr.AssetClassId = AssetProperties1.AssetClass_ID == 0 ? null : AssetProperties1.AssetClass_ID;
                _appr.AssetStatusId = AssetProperties1.AssetStatus_ID == 0 ? null : AssetProperties1.AssetStatus_ID;
                _appr.MeasurementTypeId = AssetProperties1.MeasurementType_ID == 0 ? null : AssetProperties1.MeasurementType_ID;

                _appr.Barcode = AssetProperties1.Barcode;
                _appr.OldBarCode = AssetProperties1.OldBarcode;
                _appr.UsefulLifeMonthComponent = txtUsefulLife.Text.intSafe();

                // CIDMS
                _appr.CidmssubComponentTypeId = AssetProperties1.pCIDMSSubComponentTypeID;

                _appr.BasicMunicipalityService = lstMunicipalityServices.SelectedValue.intSafe();
                _appr.CriticalityGrade = lstCriticalityGrade.SelectedValue.intSafe();
                _appr.PerformanceGrade = lstPerformanceGrade.SelectedValue.intSafe();

                _appr.UtilisationGrade = lstUtilisationGrade.SelectedValue.intSafe();
                _appr.InfrastructureHealthGrade = lstInfrastructureHealthGrade.SelectedValue.intSafe();
                _appr.ConsequenceOfFailure = lstConsequenceOfFailure.SelectedValue;
                _appr.Risk = lstRisk.SelectedValue.intNullSafe();

                _appr.CashOrNoncashgeneratingunit = lstCashGenerating.SelectedValue.intNullSafe();
                _appr.FinancialStatusId = lstFinancialStatus.SelectedValue.intSafe();
                _appr.AssetConditionId = lstCondition.SelectedValue.intSafe(); //AssetProperties1.Condition_Id;

                _appr.AcquisitionDate = Convert.ToDateTime(((DateTime)datAcuisition.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());
                _appr.VerificationDate = Convert.ToDateTime(((DateTime)datVerificationDate.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());
                _appr.RemainingUsefulLife = Convert.ToDecimal(txtUsefulLifeRemain.Text);
                _appr.InserviceDate = Convert.ToDateTime(((DateTime)datInService.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());
                _appr.VerifyId = lstVerifyID.SelectedValue.intSafe();
                _appr.CommisioningDate = Convert.ToDateTime(((DateTime)datInService.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());

                _appr.RemainingUsefulLifeYear = Convert.ToDecimal(txtUsefulLifeRemain.Text) / 12;
                _appr.ReadyForUse = Convert.ToDateTime(((DateTime)datInService.SelectedDate).ToShortDateString() + " " + DateTime.Now.ToShortTimeString());  //(datAcuisition.SelectedDate.Value);

                _appr.UoM = lstUOM.SelectedValue.intSafe();//txtUOM.Text;
                _appr.DimensionQuantity = txtDimQuantity.Text.intSafe();
                _appr.Dim1 = txtDim1.Text.decSafe();
                _appr.Dim2 = txtDim2.Text.decSafe();
                _appr.Dim3 = txtDim3.Text.decSafe();

                _appr.Quantity = txtQuantity.Text.decSafe() <= 0 ? 1 : txtQuantity.Text.decSafe();
                _appr.ConstructionMaterial = txtConstMaterial.Text;
                _appr.Diameter = txtDiameter.Text;
                _appr.Capacity = txtCapacity.Text;

                _appr.Image = imgBytes;

                                            
                _appr.PurchaseAmount = txtFundingSourceAmount.Text.decSafe();                              
                _appr.ResidualValue = txtResidualValue.Text.decSafe();
                _appr.ReplacementValue = txtReplacementValue.Text.decSafe();
                _appr.InsuredAmountInsuredBy = txtInsuredAmount.Text.decSafe();
                _appr.InsuranceNumberReference = txtInsureanceRefNo.Text;
               
                _appr.Department = lstDepartment.SelectedValue.intSafe();
                _appr.MunicipalDepartmentId = lstDepartment.SelectedValue.intSafe();

                _appr.DivisionId = lstDivision.SelectedValue.intSafe();
                _appr.CustodianId = lstCustodian.SelectedValue.intSafe();
                _appr.CustodianIdNumber = hdnCustodianNumber.Value;
                _appr.AssetOwnershipName = txtAssetOwnerShip.Text;// lstOwership.SelectedValue.intSafe();

                _appr.GisId = lstGIS.SelectedValue.ToString();
                _appr.Latitude = txtLatittude.Text;
                _appr.Longitude = txtLogitude.Text;
                _appr.GisFeature = txtGISFeature.Text;
                _appr.GisURL = _detail.GISURL;
                _appr.SgnumberChangeId = txtSG.Text;

                _appr.TownId = lstTown.SelectedValue.intSafe();
                _appr.SuburbId = lstSuburb.SelectedValue.intSafe();
                _appr.SiteNumber = txtSite.Text;
                _appr.ZoningId = lstZone.SelectedValue.intSafe();
                _appr.WardId = lstWard.SelectedValue.intSafe();
                _appr.StreetId = lstStreet.SelectedValue.intSafe();
                _appr.BuildingId = lstBuilding.SelectedValue.intSafe();
                _appr.FloorId = lstFloor.SelectedValue.intSafe();
                _appr.RoomId = lstRoom.SelectedValue.intSafe();
                _appr.ReasonForChange = txtReason.Text;

                _appr.PortionNumber = txtPortionNumber.Text;
                _appr.UnitNumber = txtUnitNumber.Text;
                _appr.RegistrationNumber = txtRegNumber.Text;
                _appr.DeedNumber = txtDeedNumber.Text;
                _appr.ErfNumber = txtErfNumber.Text;
                _appr.ErfSizeM2 = txtErfSize.Text.decSafe();
                _appr.SerialNumber = txtSerialNumber.Text;

                _appr.ForecastReplacementYear = txtForecastReplacementYear.Text.intSafe();
                _appr.CurrentReplacementCostCrc = Convert.ToDecimal(String.IsNullOrEmpty(txtReplacementValue.Text) ? "0" : txtReplacementValue.Text);
                _appr.DepreciatedReplacementCostDrc = Convert.ToDecimal(String.IsNullOrEmpty(txtDepreciatedReplacement.Text) ? "0" : txtDepreciatedReplacement.Text);

                _appr.Make = txtMake.Text;
                _appr.Model = txtModel.Text;
                _appr.InsuranceNumberReference = txtInsureanceRefNo.Text;
                _appr.WellKnownTextWkt = txtWellKnownText.Text;

                _appr.DonationDocument = lbldonationDoc.Text;
                _appr.DonorRegNumber = txtDonorId.Text == "" ? null : txtDonorId.Text;
                _appr.DonorName = txtDonorName.Text;
                _appr.DateDonated = _detail.DateDonated;

                _appr.Insured = lstInsuranceCover.SelectedValue.intSafe();
                _appr.Warranty = lstWarranty.SelectedValue.intNullSafe();
                _appr.ManagedFlag = true;
                _appr.Approved = null;

                _appr.ImageRef = lblShowImage.Text;
                _appr.InsureanceDocument = lblInsuranceDocView.Text;
                _appr.DonationDocument = lbldonationDoc.Text;

                //Additional fields
                _appr.AssetOwnershipId = _detail.AssetOwnershipId;
                _appr.CurrentAmount = _detail.CurrentAmount;
                _appr.GrnId = _detail.GRNId;
                _appr.ProjectItemId = _detail.ProjectItemId;
                _appr.TransactionProjectDr = _detail.TransactionProjectDR;
                _appr.TransactionProjectItemDr = _detail.TransactionProjectItemDR;
                _appr.TransactionProjectCr = _detail.TransactionProjectCR;
                _appr.TransactionProjectItemCr = _detail.TransactionProjectItemCR;
                _appr.SundryPaymentId = _detail.SundryPaymentId;
                _appr.TypeId = _detail.TypeId;

                _appr.Custom1 = txtCustom1.Text;
                _appr.Custom2 = txtCustom2.Text;
                _appr.Custom3 = txtCustom3.Text;
                _appr.Custom4 = txtCustom4.Text;
                _appr.Custom5 = txtCustom5.Text;
                _appr.Custom6 = txtCustom6.Text;
                _appr.Custom7 = txtCustom7.Text;
                _appr.Custom8 = txtCustom8.Text;
                _appr.Custom9 = txtCustom9.Text;

                _forApproval = true;

                if (_detail.Id == AssetRegisterItem_ID)
                {
                    _detail.ManagedFlag = true;
                    _detail.IsAwaitingApproval = true;

                    
                   var itemsresults = AssetsMicroservice.AssetRegisterItems.UpdateAsync(_detail.Id, _detail).Result;

                }

                //int result = _configItem.SaveRegisterDetails(true, _detail);
                string responseMessage = string.Empty;
                var result = _appr.Id == 0
                    ? AssetsMicroservice.AssetRegisterItemApprovals.CreateAsync(_appr).Result
                    : AssetsMicroservice.AssetRegisterItemApprovals.UpdateAsync(_appr.Id, _appr).Result;

                if (result is not null)
                {
                    if (result.IsSuccessStatusCode)
                    {
                        Session["Submit"] = "true";
                        responseMessage = result.StatusCode switch
                        {
                            HttpStatusCode.Created => $"{UseCaseDescription} has been Added successfully.",
                            _ => $"{UseCaseDescription} has been Updated successfully."
                        };

                        Session["Saved"] = "true";
                        if (!_forApproval && _detail.Id > 0)
                        {
                            AssetsMicroservice.AssetRegisterItems
                                .UpdateRemainingUsefulLifeAsync(_detail.Id,
                                    Convert.ToDecimal(txtUsefulLifeRemain.Text)).ConfigureAwait(false);
                        }
                    }
                    else
                    {
                        Session["Saved"] = "false";
                        var duplicateFound = result.Problem.Errors.SelectMany(x => x.Value)
                            .Any(x => x.Contains("already exist"));

                        if (duplicateFound)
                            responseMessage = $"{UseCaseDescription} already exist.";

                    }
                }

                

                Response.Redirect(this._pageName);

            }
        }

        protected void btnShowImage_Click(object sender, EventArgs e)
        {
            if (lblShowImage.Text!="")
            {
                byte[] filebytes = GetFileBytes(lblShowImage.Text, true);
                string jscript = $"openBase64InNewTab('{Convert.ToBase64String(filebytes)}', 'image/jpeg','{lblShowImage.Text}');";
                ScriptManager.RegisterStartupScript(this, this.GetType(), "popup2", jscript, true);
            }
        }

        protected void btnInsuranceDocView_Click(object sender, EventArgs e)
        {
            if (lblInsuranceDocView.Text != "")
            {
                byte[] filebytes = GetFileBytes(lblInsuranceDocView.Text);
                string jscript = $"openBase64InNewTab('{Convert.ToBase64String(filebytes)}', 'application/octet-stream','{lblInsuranceDocView.Text}');";
                ScriptManager.RegisterStartupScript(this, this.GetType(), "popup2", jscript, true);
            }
        }

        protected void adonationDoc_ServerClick(object sender, EventArgs e)
        {
            if (lbldonationDoc.Text != "")
            {
                byte[] filebytes = GetFileBytes(lbldonationDoc.Text);
                string jscript = $"openBase64InNewTab('{Convert.ToBase64String(filebytes)}', 'application/octet-stream','{lbldonationDoc.Text}');";
                ScriptManager.RegisterStartupScript(this, this.GetType(), "popup2", jscript, true);
            }
        }

        protected void lstCondition_SelectedIndexChanged(object sender, EventArgs e)
        {
            updatePanelMain.Update();
        }

        protected void txtUsefulLife_TextChanged(object sender, EventArgs e)
        {
            txtUsefulLifeRemain.Text =(Convert.ToSingle(txtUsefulLife.Text.intSafe()) / 12).ToString("#0.00"); 
        }
    }
}