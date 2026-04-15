using FMSWebApp.Assets.Configuration;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using FMSWebApp.Common;
using Telerik.Web.UI;
using System.IO;
using System.Net.Http;
using FMSWebApp.Common.Microservices.Asset;
using Newtonsoft.Json;
using Sebata.Fms.Assets;
using static Spire.Pdf.General.Render.Decode.Jpeg2000.j2k.codestream.HeaderInfo;
using log4net.Util;
using Telerik.Windows.Documents.Spreadsheet.Expressions;
using static FMSWebApp.Common.Microservices.Asset.AssetsMicroservice;

namespace FMSWebApp.Assets.Unbundling
{
    public partial class Unbundling : System.Web.UI.Page
    {
        private const string DefaultSelectText = "--Select--";
        private const int UnbundlingUploadType = 6;

        AssetsModelDataContext AssetsDB = new AssetsModelDataContext(Sebata.Fms.Common.CommonTasks.GetEmsConnectionString());
        private string filepath = "";
        private static string imgYes = "~/img/KPITargetMet.png";
        private static string imgNo = "~/img/KPITargetMissed.png";

        private string _moduleName = "Assets - Unbundling";
        private string _pageName = "Unbundling.aspx";
        private bool _isexport = false;
        
        //Permissions
        public const int Perm_Page = 13200;

        private static DataTable _data = null;
        private static DataTable _dataOrig = null;
        private static int _contractHeaderId = 0;
        private List<Core_Deserialiasation.Asset_Register_Items> Core_AssetRegisterItem;
        private List<AssetsMicroservice.AssetUnbundlingHeaders.AssetUnbundlingHeaderView> _assetUnbundlingHeaders;
        private List<Core_Deserialise_Unbundling_Detail.AssetContractDetail> Core_UnbundlingInvoiceDetail;
        private List<AssetsMicroservice.AssetUnbundlingDetails.AssetUnbundlingDetailView> _assetUnbundlingDetails;
        private List<AssetsMicroservice.AssetUnbundlingParents.AssetUnbundlingParentView> _assetUnbundlingParents;
        private List<AssetsMicroservice.AssetUnbundlingProgress.AssetUnbundlingProgressView> _assetUnbundlingProgress;
        private List<AssetsMicroservice.AssetUnbundlingDetails.ContractDebitCreditNoteView> _assetDebitsCreditNotes;

        static bool _listGenerated = false;

        protected void Page_Load(object sender, EventArgs e)
        {
            try
            {
                if (!IsPostBack)
                {
                    CommonTasks.CheckPagePermission(Perm_Page, Page.ResolveUrl("~/noRights.aspx"));
                    LoadContracts();
                    stepAssetClasification.ImageUrl = imgNo;
                    stepCapitalContract.ImageUrl = imgNo;
                    stepCommissioning.ImageUrl = imgNo;
                    stepCostDistribution.ImageUrl = imgNo;
                    stepManageAssets.ImageUrl = imgNo;
                }
                //  CheckCompletedAndSetForm();
            }
            catch (Exception Ex)
            {
                CommonTasks.ErrorMsgSettings(Ex, System.Reflection.MethodBase.GetCurrentMethod().Name.ToString(), _moduleName, _pageName, mySession.Current.User_ID, divMessage, lblMessage);
            }
            totalCost = 0;
        }
        private void CheckCompletedAndSetForm()
        {
            if (_dataOrig != null)
            {
                var res =
                          from completecheckRow in _dataOrig.AsEnumerable()
                          where completecheckRow.Field<Int32>("ContractId") == Convert.ToInt32(_contractHeaderId)
                          select completecheckRow;

                var resF = res.Select(a => a.Field<bool>("IsComplete")).FirstOrDefault();

                if (resF)
                {
                    btnACsave.Enabled = false;
                    btnACcalc.Enabled = false;
                    btnAddGoodService.Enabled = false;
                    gridClassification.Enabled = false;
                    txtMainAsset.Enabled = false;
                    lstGCDApprove.Enabled = false;
                    btnGenList.Enabled = false;
                    btnGCDCancel.Enabled = false;
                    gridCommission.Enabled = false;
                    lstCommApprove.Enabled = false;
                    btnComSubmit.Enabled = false;
                    btnComSCancel.Enabled = false;
                    gridDistribution.Enabled = false;

                }
                else
                {
                    btnACsave.Enabled = true;
                    btnACcalc.Enabled = true;
                    btnAddGoodService.Enabled = true;
                    gridClassification.Enabled = true;
                    txtMainAsset.Enabled = true;
                    lstGCDApprove.Enabled = true;
                    btnGenList.Enabled = true;
                    btnGCDCancel.Enabled = true;
                    gridCommission.Enabled = true;
                    lstCommApprove.Enabled = true;
                    btnComSubmit.Enabled = true;
                    btnComSCancel.Enabled = true;
                    gridDistribution.Enabled = true;
                }
            }
        }
        protected void wizMain_ActiveStepChanged(object sender, EventArgs e)
        {
            divCapitalContract.Visible = false;
            divAssetClasification.Visible = false;
            divCostDistribution.Visible = false;
            divCommissioning.Visible = false;
            divManageAssets.Visible = false;
            divFiles.Visible = false;

            string stepTitle = wizMain.ActiveStep.Title;
            _listGenerated = false;

            if (stepTitle == "Capital Contract")
            {
                lblCC.Text = "List of Capital Projects";
                divCapitalContract.Visible = true;
                divCCDetail.Visible = true;
                gridCaptial.Visible = false;
                divCClist.Visible = true;
                LoadContractDetails();
                divFiles.Visible = true;
                stepAssetClasification.Enabled = true;
                // stepCommissioning.Enabled = false;
                // stepCostDistribution.Enabled = false;

                GetProgress(_contractHeaderId);
                var data = _assetUnbundlingProgress;
                for (int i = 0; i < data.Select(a => a.LevelIndicator).FirstOrDefault(); i++)
                {
                    wizMain.WizardSteps[i].ImageUrl = imgYes;
                    wizMain.WizardSteps[i].Enabled = true;
                }
                CheckCompletedAndSetForm();


            }
            else if (stepTitle == "Asset Classification")
            {
                stepCapitalContract.ImageUrl = imgYes;
                lblCC.Text = "";
                divAssetClasification.Visible = true;
                LoadClassification();
                ValidateClasifications(false);
                LoadDropDowns();

                CheckCompletedAndSetForm();

                LoadFiles(true);
                gridClassification_SelectedIndexChanged(null, null);


            }
            else if (stepTitle == "Cost Distribution")
            {

                lblCC.Text = "General Cost Distribution";
                divCostDistribution.Visible = true;
                LoadDistribution();
                LoadFiles();

                txtGCDapprovedBy.Text = mySession.Current.UserFullName;
                txtGCDapprovedDate.Text = DateTime.Now.ToString();
                CheckCompletedAndSetForm();

            }
            else if (stepTitle == "Commissioning")
            {
                lblCC.Text = "";
                divCommissioning.Visible = true;
                LoadCommissioning();
                divFiles.Visible = false;
                txtComApprovedBy.Text = mySession.Current.UserFullName;
                txtComApproveDate.Text = DateTime.Now.ToString();
                CheckCompletedAndSetForm();

            }
            else if (stepTitle == "Manage Assets")
            {
                lblCC.Text = "";
                divManageAssets.Visible = true;
                divFiles.Visible = false;
            }
        }


        private void LoadDropDowns()
        {
            PopulateUnitOfMeasures();
            //PopulateIsAsset();
            PopulateCidmsSubComponentTypes();
            PopulateAssetTypes();
            PopulateAssetCategories();
            PopulateAssetSubCategories();
            PopulateMeasurementTypes();
            PopulateAssetStatuses();

        }

        private void LoadCommissioning()
        {
            try
            {
                var entities = AssetsMicroservice.AssetUnbundlingDistributions.GetUnbundlingCommissioningAsync(_contractHeaderId).Result.ToList();
            
                gridCommission.DataSource = entities;
                gridCommission.DataBind();
            }
            catch (Exception ex)
            {
                // ignored
            }
        }

        private bool ValidatePreCommissioning()
        {
            var entities = AssetsMicroservice.AssetUnbundlingDistributions.GetUnbundlingCommissioningAsync(_contractHeaderId).Result.ToList();

            if (entities.Count <= 0) return true;
            
            return !entities.Any(d =>
                string.IsNullOrEmpty(d.DebitProjectId.ToString()) ||
                string.IsNullOrEmpty(d.DebitItemId.ToString()) ||
                string.IsNullOrEmpty(d.CreditProjectId.ToString()) ||
                string.IsNullOrEmpty(d.CreditItemId));
        }

        private void LoadDistribution()
        {
            gridDistribution.Columns[0].Visible = true;
            gridDistribution.Columns[9].Visible = true;
            gridDistribution.Columns[10].Visible = true;
            gridDistribution.Columns[11].Visible = true;
            gridDistribution.Columns[12].Visible = true;
            gridDistribution.Columns[8].Visible = true;
            
            var entities = AssetsMicroservice.AssetUnbundlingDistributions.GetCostDistributionAsync(_contractHeaderId)
                .Result.ToList();
            gridDistribution.DataSource = entities;
            gridDistribution.DataBind();

            gridDistribution.Columns[0].Visible = false;
            gridDistribution.Columns[9].Visible = false;
            gridDistribution.Columns[10].Visible = false;
            gridDistribution.Columns[11].Visible = false;
            gridDistribution.Columns[12].Visible = false;
            gridDistribution.Columns[8].Visible = false;


            TotalTable.Attributes.Add("style", "background-color:#04072e");
            var totalGeneralCost = entities.FirstOrDefault()?.TotalGeneralCost ?? 0m;
            lblTotGenCost.Text = totalGeneralCost.ToString("0.00");

            var totalCostPerSubCompType = entities.Sum(x => x.TotalCostPerSubCompType ?? 0);
            lblTotCIDMSCost.Text = totalCostPerSubCompType.ToString("0.00");
            lblTotProjCost.Text = (totalCostPerSubCompType + totalGeneralCost).ToString("0.00");

            if (string.IsNullOrEmpty(lblExpenditure.Text))
            {
                lblExpenditure.Text = "0";
            }

            lblActExp.Text = lblExpenditure.Text;
            lblDiff.Text = (totalCostPerSubCompType + totalGeneralCost - Convert.ToDecimal(lblExpenditure.Text)).ToString("0.00");
        }

        private void LoadClassification()
        {
            gridClassification.Columns[27].Visible = true;
            gridClassification.Columns[26].Visible = true;
            gridClassification.Columns[25].Visible = true;
            gridClassification.Columns[24].Visible = true;
            gridClassification.Columns[23].Visible = true;
            gridClassification.Columns[22].Visible = true;
            gridClassification.Columns[21].Visible = true;
            gridClassification.Columns[20].Visible = true;
            
            var entities = AssetsMicroservice.AssetUnbundlingDetails
                .GetClassificationsByContractIdAsync(_contractHeaderId).Result.ToList();

            gridClassification.DataSource = entities;
            gridClassification.DataBind();

            gridClassification.Columns[27].Visible = false;
            gridClassification.Columns[26].Visible = false;
            gridClassification.Columns[25].Visible = false;
            gridClassification.Columns[24].Visible = false;
            gridClassification.Columns[23].Visible = false;
            gridClassification.Columns[22].Visible = false;
            gridClassification.Columns[21].Visible = false;
            gridClassification.Columns[20].Visible = false;

            if (string.IsNullOrEmpty(_contractHeaderId.ToString())) return;
            
            Core_LoadAssetParent();
                
            if (_assetUnbundlingParents is { Count: > 0 })
            {
                txtMainAsset.Text = _assetUnbundlingParents.FirstOrDefault()?.ParentDescription;
            }
        }

        private static DataTable _fileData = null;

        private void LoadFiles(bool reload = false)
        {
            if (_fileData == null || _fileData.Rows.Count == 0 || reload)
            {
                var results = AssetsMicroservice.AssetUnbundlingContractDocuments.GetAllByContractIdAsync(_contractHeaderId).Result
                    .ToList();

                _fileData = results.LinqToDataTable();

                gridFiles.DataSource = _fileData;
                gridFiles.DataBind();
            }

            if (_fileData is { Rows: { Count: > 0 } })
            {
                divFiles.Visible = true;
                hdnUploadedDocs.Value = "Passed";
            }
            else
            {
                hdnUploadedDocs.Value = null;
            }
        }
        
        private void PopulateAssetUnbundlingHeaders()
        {
            try
            {
                _assetUnbundlingHeaders = AssetsMicroservice.AssetUnbundlingHeaders.GetAllAsync().Result.ToList();

                var result = _assetUnbundlingHeaders.Select(n => new
                {
                    n.ContractId,
                    n.Contract.PlannedEndDate,
                    n.Contract.PlannedStartDate,
                    n.Contract.Number,
                    n.Contract.Description,
                    n.Contract.ContractValue,
                    n.IsComplete
                });

                _data = result.Distinct().LinqToDataTable();
            }
            catch (Exception ex)
            {
                // ignored
            }
        }
        private void Core_Unbundling_Detail_Get(int ContractId)
        {
            try
            {
                _assetUnbundlingDetails = AssetsMicroservice.AssetUnbundlingDetails.GetAllByContractIdAsync(ContractId).Result
                    .ToList();
                
                var result = from p in _assetUnbundlingDetails
                             //where p.InvoiceDetailId != null
                             //group p by p.InvoiceDetailId into grp
                             //let MaxOrderInvoicePerInvoice = grp.Max(g => g.Id)
                             //from p in grp
                             //where p.Id == MaxOrderInvoicePerInvoice
                             select p;

                var resultFinal = result.Select(n => new
                {
                    InvoiceDetailId = n.InvoiceDetailId != null ? n.InvoiceDetailId : 0,
                    VendorName = n.AssetUnbundlingHeader.Vendor.Name ?? "",
                    VendorId = n.AssetUnbundlingHeader.VendorId,
                    InvoiceDate = n.InvoiceDetail != null ? n.InvoiceDetail.Invoice.InvoiceDate : DateTime.Now,
                    VendorInvoiceNumber = n.InvoiceDetail != null ? n.InvoiceDetail.Invoice.VendorInvoiceNumber : "",
                    InvoiceId = n.InvoiceDetail != null ? n.InvoiceDetail.InvoiceId : 0,
                    Amount = n.InvoiceDetail != null ? n.InvoiceDetail.Amount : 0,
                    PaymentReference = n.InvoiceDetail != null ? n.InvoiceDetail.Invoice.PaymentReference : "",
                    DtNumber = n.CreditDebtNoteDetail != null ? n.CreditDebtNoteDetail.InvoiceCredit.CreditDebitNumber : "",
                    DtAmount = n.CreditDebtNoteDetail != null ? n.CreditDebtNoteDetail.Amount : 0,
                    GoodsServiceDescription = n.GoodsServiceDescription ?? "",
                    Quantity = n.Quantity != null ? n.Quantity : 0,
                    Rate = n.Rate != null ? n.Rate : 0,
                    AssetDescription = n.AssetDescription ?? "",
                    Uom = n.Uom != null ? n.Uom : 0,
                    Id = n.Id != null ? n.Id : 0,
                    AssetContractHeaderId = n.AssetContractHeaderId != null ? n.AssetContractHeaderId : 0,
                    RegisterItemsId = n.RegisterItemsId != null ? n.RegisterItemsId : 0,
                    AssetType = n.AssetType != null ? n.AssetType : 0,
                    AssetStatus = n.AssetStatus != null ? n.AssetStatus : 0,
                    AssetCategory = n.AssetCategory != null ? n.AssetCategory : 0,
                    AssetSubCategory = n.AssetSubCategory != null ? n.AssetSubCategory : 0,
                    MeasurementType = n.MeasurementType != null ? n.MeasurementType : 0,
                    IsAsset = n.IsAsset != null ? n.IsAsset : true
                });//.Where(w => w.InvoiceId != 0).Distinct();

                _data = resultFinal.LinqToDataTable();
            }
            catch (Exception ex)
            {
                // ignored
            }
        }

        private void Core_Unbundling_DetailDC_Get(int contractId)
        {
            try
            {
                _assetDebitsCreditNotes = AssetsMicroservice.AssetUnbundlingDetails
                    .GetDebitCreditNotesByContractIdAsync(contractId).Result.ToList();
            }
            catch (Exception ex)
            {
                // ignored
            }
        }

        private void LoadContracts()
        {
            PopulateAssetUnbundlingHeaders();
            _contractHeaderId = 0;
            _data.Columns.Add("TotalExpenditureExVat", typeof(int));
            _dataOrig = _data.Copy();
            
            var totalExclusiveVatEntities =
                AssetsMicroservice.AssetUnbundlingHeaders.GetTotalExclusiveVatAsync().Result.ToList();
            _data = totalExclusiveVatEntities.LinqToDataTable();
            
            foreach (DataRow row in _data.Rows)
            {
                var foundRow = _dataOrig.Select("ContractId = " + row["ContractId"]).FirstOrDefault();
                if (foundRow != null) foundRow["ContractValue"] = row["TotalExclusiveVat"];
            }

            var totalExclusiveExpenditureEntities =
                AssetsMicroservice.AssetUnbundlingHeaders.GetTotalExclusiveExpenditureAsync().Result.ToList();
            _data = totalExclusiveExpenditureEntities.LinqToDataTable();

            foreach (DataRow row in _data.Rows)
            {
                var foundRow = _dataOrig.Select("ContractId = " + row["ContractId"]).FirstOrDefault();
                if (foundRow != null) foundRow["TotalExpenditureExVat"] = row["TotalExclusiveVat"];
            }
            gridCaptial.DataSource = _dataOrig;
            gridCaptial.DataBind();
        }

        private void LoadContractDetails()
        {
            try
            {
                Core_Unbundling_Detail_Get(_contractHeaderId);

                var groupedData = from b in _data.AsEnumerable()
                                  group b by b.Field<Int32>("InvoiceId") into g
                                  select new
                                  {
                                      InvoiceDetailID = g.Key,
                                      Count = g.Count(),
                                      Amount = g.Sum(x => Convert.ToSingle(x["Amount"])),
                                      DtNumber = g.Max(x => x.Field<string>("DtNumber")),
                                      DtAmount = g.Sum(x => Convert.ToSingle(x["DtAmount"])),
                                      PaymentReference = g.Max(x => x.Field<string>("PaymentReference")),
                                      Vendorname = g.Max(x => x.Field<string>("VendorName")),
                                      VendorId = g.Max(x => x.Field<Int32>("VendorId")),
                                      VendorInvoiceNumber = g.Max(x => x.Field<string>("VendorInvoiceNumber")),
                                      InvoiceDate = g.Max(x => x.Field<DateTime>("InvoiceDate")),
                                      InvoiceID = g.Max(x => x.Field<Int32>("InvoiceID"))
                                  };

                _data = groupedData.LinqToDataTable();
                
                // Get the Debits and credit summed for invoices
                Core_Unbundling_DetailDC_Get(_contractHeaderId);
                var datDtCt = _assetDebitsCreditNotes.LinqToDataTable();

                foreach (DataRow row in datDtCt.Rows)
                {
                    var foundRow = _data.Select("InvoiceDetailID = " + row["InvoiceId"]).FirstOrDefault();
                    
                    if (foundRow == null) continue;
                    
                    foundRow["DtAmount"] = row["NettAmount"];
                    foundRow["DtNumber"] = row["Notes"];
                }

                if (_data.Rows.Count > 0)
                {
                    _data.Columns.Add("PaymentReferenceHyper", typeof(System.Int32));
                    _data.Columns.Add("PaymentReferenceID", typeof(System.String));
                    _data.Columns.Add("OrderNumber", typeof(System.String));

                    var dataOrig = _data.Copy();

                    var results = AssetsMicroservice.AssetUnbundlingDetails.GetPaymentsForInvoiceAsync().Result
                        .ToList();
                    _data = results.LinqToDataTable();

                    foreach (DataRow row in _data.Rows)
                    {
                        var foundRow = dataOrig.Select("InvoiceID = " + row["InvoiceId"]).FirstOrDefault();

                        if (foundRow is null) continue;
                        
                        foundRow["PaymentReferenceHyper"] = row["PaymentId"];
                        foundRow["PaymentReferenceID"] = foundRow["PaymentReference"];
                    }

                    _data = dataOrig;
                }

                gridCaptialDetail.DataSource = _data;

                gridCaptialDetail.DataBind();

                lblComplete.Text = gridCaptial.SelectedItems[0].Cells[9].Text;
                lblDesc.Text = gridCaptial.SelectedItems[0].Cells[6].Text;
                lblExpenditure.Text = gridCaptial.SelectedItems[0].Cells[8].Text;
                lblRegNo.Text = gridCaptial.SelectedItems[0].Cells[5].Text;
                lblValue.Text = gridCaptial.SelectedItems[0].Cells[7].Text;

                if (!_data.Columns.Contains("RegisterItemsID"))
                {
                    hdnParentID.Value = null;
                }
                else
                {
                    hdnParentID.Value = _data.Rows[0]["RegisterItemsID"].ToString();
                }

                if (lblValue.Text == "&nbsp;")
                    lblValue.Text = "0";
                if (lblExpenditure.Text == "&nbsp;")
                    lblExpenditure.Text = "0";

                if (Convert.ToDecimal(lblValue.Text) == 0)
                    lblRate.Text = "0%";
                else
                    lblRate.Text = (Convert.ToDecimal(lblExpenditure.Text) / Convert.ToDecimal(lblValue.Text)).ToString("###%");
            }
            catch (Exception ex)
            {
                // ignored
            }
        }
        
        private void PopulateCidmsSubComponentTypes()
        {
            PopulateDropdown("lstACcIDMSSubComponentType", 22, (shouldExecute, _) =>
            {
                if (!shouldExecute) return null;
                
                var entities = AssetsMicroservice.CIDMSSubComponentTypes.GetAllAsync().Result.ToList();

                return entities
                    .Select(x => new ListItem(x.Description, x.Id.ToString()))
                    .Union(new[]
                    {
                        new ListItem(DefaultSelectText, 0.ToString())
                    })
                    .OrderByDescending(x => x.Text.Equals(DefaultSelectText))
                    .ThenBy(x => x.Text)
                    .ToList();
            });
            lstACcIDMSSubComponentType_SelectedIndexChanged(null, null);
        }
        
        private void PopulateAssetTypes()
        {
            PopulateDropdown("lstAssetType", 23, (shouldExecute, _) =>
            {
                if (!shouldExecute) return null;
                
                var entities = AssetsMicroservice.AssetTypes.GetAllAsync().Result.ToList();

                return entities
                    .Select(x => new ListItem(x.Description, x.Id.ToString()))
                    .Union(new[]
                    {
                        new ListItem(DefaultSelectText, 0.ToString())
                    })
                    .OrderByDescending(x => x.Text.Equals(DefaultSelectText))
                    .ThenBy(x => x.Text)
                    .ToList();
            });
            lstAssetType_SelectedIndexChanged(null, null);
        }

        private void PopulateAssetCategories()
        {
            PopulateDropdown("lstAssetCategory", 24, (shouldExecute, parentId) =>
            {
                if (!shouldExecute) return null;
                
                var entities = AssetsMicroservice.AssetCategories.GetAllByAssetTypeIdAsync(parentId.intSafe()).Result.ToList();

                return entities
                    .Select(x => new ListItem(x.Description, x.Id.ToString()))
                    .Union(new[]
                    {
                        new ListItem(DefaultSelectText, 0.ToString())
                    })
                    .OrderByDescending(x => x.Text.Equals(DefaultSelectText))
                    .ThenBy(x => x.Text)
                    .ToList();
            }, "lstAssetType");
        }
        
        private void PopulateAssetSubCategories()
        {
            PopulateDropdown("lstAssetSubCategory", 25, (shouldExecute, parentId) =>
            {
                if (!shouldExecute) return null;
                
                var entities = AssetsMicroservice.AssetSubCategories.GetAllByAssetCategoryIdAsync(parentId.intSafe()).Result.ToList();

                return entities
                    .Select(x => new ListItem(x.Description, x.Id.ToString()))
                    .Union(new[]
                    {
                        new ListItem(DefaultSelectText, 0.ToString())
                    })
                    .OrderByDescending(x => x.Text.Equals(DefaultSelectText))
                    .ThenBy(x => x.Text)
                    .ToList();
            }, "lstAssetCategory");
        }

        private void PopulateMeasurementTypes()
        {
            PopulateDropdown("lstMeasurementType", 26, (shouldExecute, parentId) =>
            {
                if (!shouldExecute) return null;
                
                var entities = AssetsMicroservice.MeasurementTypes.GetAllByAssetTypeIdAsync(parentId.intSafe()).Result.ToList();

                return entities
                    .Select(x => new ListItem(x.Description, x.Id.ToString()))
                    .Union(new[]
                    {
                        new ListItem(DefaultSelectText, 0.ToString())
                    })
                    .OrderByDescending(x => x.Text.Equals(DefaultSelectText))
                    .ThenBy(x => x.Text)
                    .ToList();
            }, "lstAssetType");
        }
        
        private void PopulateUnitOfMeasures()
        {               
            PopulateDropdown("lstUOM", 29, (shouldExecute, _) =>
            {
                if (!shouldExecute) return null;
                
                var entities = AssetsMicroservice.UnitOfIssues.GetAllAsync().Result.ToList();

                return entities
                    .Select(x => new ListItem(x.Description, x.Id.ToString()))
                    .Union(new[]
                    {
                        new ListItem(DefaultSelectText, 0.ToString())
                    })
                    .OrderByDescending(x => x.Text.Equals(DefaultSelectText))
                    .ThenBy(x => x.Text)
                    .ToList();
            });
        }

        private void PopulateAssetStatuses()
        {
            PopulateDropdown("lstAssetStatus", 27, (shouldExecute, parentId) =>
            {
                if (!shouldExecute) return null;

                var result = AssetsMicroservice.AssetStatuses.GetAllByAssetCategoryIdAsync(parentId.intSafe()).Result;
                var entities = result != null ? result.ToList() : new List<AssetStatuses.AssetStatusView>(); // Ensure correct type

                return entities
                    .Select(x => new ListItem(x.Description, x.Id.ToString()))
                    .Union(new[]
                    {
                new ListItem(DefaultSelectText, "0")
                    })
                    .OrderByDescending(x => x.Text.Equals(DefaultSelectText))
                    .ThenBy(x => x.Text)
                    .ToList();
            }, "lstAssetCategory");
        }

        private void PopulateIsAsset()
        {
            PopulateDropdown("lstACassetItem", 28);
        }

        private void PopulateDropdown(string listBoxName, int selectColumn, Func<bool, string, IEnumerable<ListItem>> executeCall = null, string parentListBoxName = null)
        {
            const string assetItemName = "lstACassetItem";
            
            // If we don't need filtering by parent, we'll do this call
            var dataSource = executeCall?.Invoke(string.IsNullOrWhiteSpace(parentListBoxName), null) ?? Enumerable.Empty<ListItem>();
            
            foreach (GridDataItem item in gridClassification.MasterTableView.Items)
            {
                var parentListBoxId = string.Empty;
                if (!string.IsNullOrWhiteSpace(parentListBoxName))
                {
                    var parentListBox = item.FindControl(parentListBoxName) as DropDownList;
                    parentListBoxId = parentListBox?.SelectedValue ?? parentListBoxId;
                }
                
                var listBox = item.FindControl(listBoxName) as DropDownList;
                var listAssetItem = item.FindControl(assetItemName) as DropDownList;

                if (listBoxName == "lstUOM" || listBoxName == assetItemName || (listBoxName != assetItemName && listAssetItem?.SelectedValue == "true"))
                {
                    if (listBox == null) continue;
                    
                    listBox.Items.Clear();

                    // If we do need filtering by parent, we'll do this call
                    dataSource = executeCall?.Invoke(!string.IsNullOrWhiteSpace(parentListBoxName), parentListBoxId) ?? dataSource;

                    listBox.DataSource = dataSource;
                    listBox.DataValueField = "Value";
                    listBox.DataTextField = "Text";
                    listBox.DataBind();

                    listBox.Enabled = listBox.Items.Count != 0;
                    
                    if (selectColumn <= 0) continue;

                    var selectColumnText = item.Cells[selectColumn].Text;

                    if (bool.TryParse(selectColumnText, out var isBoolean))
                    {
                        selectColumnText = isBoolean ? "True" : "False";
                    }

                    if (!string.IsNullOrWhiteSpace(selectColumnText.Replace("&nbsp;", "")))
                    {
                        try
                        {
                            listBox.SelectedValue = selectColumnText;
                        }
                        catch
                        {
                            listBox.SelectedIndex = 0;
                        }
                    }
                    else if (listBox.Items.Count > 0)
                    {
                        listBox.SelectedIndex = 0;
                    }
                }
                else
                {
                    if (listBox == null) continue;
                    
                    listBox.DataSource = null;
                    listBox.SelectedIndex = -1;
                    listBox.Enabled = false;
                }
            }
        }
        
        private void Core_LoadAssetParent()
        {
            try
            {
                _assetUnbundlingParents = AssetsMicroservice.AssetUnbundlingParents
                    .GetAllByContractIdAsync(_contractHeaderId).Result.ToList();
            }
            catch (Exception ex)
            {
                // ignored
            }
        }

        protected void gridCaptial_NeedDataSource(object sender, GridNeedDataSourceEventArgs e)
        {
            try
            {
                if (_data != null)
                    gridCaptial.DataSource = _dataOrig;
            }
            catch (Exception ex)
            {
                // ignored
            }
        }

        protected void gridCaptial_SelectedIndexChanged(object sender, EventArgs e)
        {
            hdnParentID.Value = null;
            divCClist.Visible = false;
            divCCDetail.Visible = true;
            lblCC.Text = "Capital Project Details";
            _contractHeaderId = Convert.ToInt32(gridCaptial.SelectedItems[0].Cells[2].Text);
            btnCSVExportCaptial.Visible = false;
            btnPDFExportCapital.Visible = false;
            LoadContractDetails();
            LoadFiles(true);
            if (gridFiles.Items.Count > 0)
            {
                stepAssetClasification.Enabled = true;
            }
            ValidateTabs();
        }

        private void GetProgress(int contractId)
        {
            try
            {
                _assetUnbundlingProgress = AssetsMicroservice.AssetUnbundlingProgress.GetAllByHeaderIdAsync(contractId)
                    .Result.ToList();
            }
            catch (Exception ex)
            {
                // ignored
            }
        }

        private bool ValidateTabs()
        {
            // LoadClasification();
            // ValidateClasifications(false);

            GetProgress(_contractHeaderId);
            var data = _assetUnbundlingProgress;
            for (int i = 0; i < data.Select(a => a.LevelIndicator).FirstOrDefault(); i++)
            {
                wizMain.WizardSteps[i].ImageUrl = imgYes;
                wizMain.WizardSteps[i].Enabled = true;
            }


            if (ValidateCapitalContract())
            {

                wizMain.ActiveStepIndex = stepAssetClasification.Index;
                wizMain_ActiveStepChanged(null, null);
            }

            return true;
        }
        protected void btnSubmitUploads_Click(object sender, EventArgs e)
        {

            string filenames = "";

            string rootfile = CommonTasks.GetfullPath("FolderAssetDocuments");
            if (String.IsNullOrEmpty(rootfile))
                rootfile = "c:\\AssetDocuments\\";


            //save the certificate
            string ext = uploadCertificate.FileName.Substring(uploadCertificate.FileName.LastIndexOf('.'));
            int filenum = 0;
            string fname;
            string thePath;

            if (ext.ToUpper() == ".PDF")
            {
                ext = "." + ext.Split(".".ToCharArray())[1];

                fname = uploadCertificate.FileName;
                thePath = string.Format("{0}{1}", rootfile, fname);

                while (System.IO.File.Exists(thePath))
                {
                    filenum++;
                    fname = uploadCertificate.FileName.Replace(ext, filenum.ToString() + ext);
                    thePath = string.Format("{0}{1}", rootfile, fname);
                }
                filenames = fname;

                uploadCertificate.SaveAs(thePath);
                uploadCertificate.FileContent.Close();
            }
            //save the bill
            ext = uploadBill.FileName.Substring(uploadBill.FileName.LastIndexOf('.'));
            ext = "." + ext.Split(".".ToCharArray())[1];
            filenum = 0;
            fname = uploadBill.FileName;
            thePath = string.Format("{0}{1}", rootfile, fname);

            while (System.IO.File.Exists(thePath))
            {
                filenum++;
                fname = uploadBill.FileName.Replace(ext, filenum.ToString() + ext);
                thePath = string.Format("{0}{1}", rootfile, fname);
            }
            filenames += ";";
            filenames += fname;

            uploadBill.SaveAs(thePath);
            uploadBill.FileContent.Close();

            if (uploadAnother.HasFiles)
            {
                foreach (var afile in uploadAnother.PostedFiles)
                {
                    ext = afile.FileName.Substring(afile.FileName.LastIndexOf('.'));
                    ext = "." + ext.Split(".".ToCharArray())[1];
                    filenum = 0;
                    fname = afile.FileName;
                    thePath = string.Format("{0}{1}", rootfile, fname);

                    while (System.IO.File.Exists(thePath))
                    {
                        filenum++;
                        fname = afile.FileName.Replace(ext, filenum.ToString() + ext);
                        thePath = string.Format("{0}{1}", rootfile, fname);
                    }

                    filenames += ";";
                    filenames += fname;

                    afile.SaveAs(thePath);
                }
            }
            
            _ = AssetsMicroservice.AssetUnbundlingContractDocuments.CreateAsync(_contractHeaderId, filenames.Split(new[] { ";" }, StringSplitOptions.RemoveEmptyEntries).ToArray())
                .Result;
            
            hdnUploadedDocs.Value = "Passed";

            UpdateProgress(_contractHeaderId, 1);

            bool validated = ValidateCapitalContract();
            if (validated)
            {
                wizMain.ActiveStepIndex = stepAssetClasification.Index;
                wizMain_ActiveStepChanged(null, null);
            }
        }

        private void UpdateProgress(int contractId, int progressId)
        {
            try
            {
                _ = AssetsMicroservice.AssetUnbundlingProgress.UpdateAsync(0,
                    new AssetsMicroservice.AssetUnbundlingProgress.AssetUnbundlingProgressView
                    {
                        Id = 0,
                        HeaderId = contractId,
                        LevelIndicator = progressId
                    }).Result;
            }
            catch (Exception ex)
            {
                // ignored
            }
        }
        
        private void UpdateComplete(int contractId)
        {
            try
            {
                _ = AssetsMicroservice.AssetUnbundlingHeaders.CompleteByContractIdAsync(contractId).Result;
            }
            catch (Exception ex)
            {
                // ignored
            }
        }

        protected void btnCSVExportCaptial_Click(object sender, ImageClickEventArgs e)
        {
            ExportGridToExcel(gridCaptial, "Unbundling Captital Project");
        }

        protected void btnPDFExportCapital_Click(object sender, ImageClickEventArgs e)
        {
            ExportGridToPDF(gridCaptial, "Unbundling Capital_Projects");
        }

        protected void btnCSVExportCapitalDetail_Click(object sender, ImageClickEventArgs e)
        {
            ExportGridToExcel(gridCaptialDetail, "Unbundling Captital Detail");
        }

        protected void btnPDFExportCaptialDetail_Click(object sender, ImageClickEventArgs e)
        {
            ExportGridToPDF(gridCaptialDetail, "Unbundling Captital Detail");
        }

        protected void btnCSVExportCalsification_Click(object sender, ImageClickEventArgs e)
        {
            ExportGridToExcel(gridClassification, "Unbundling Clasification");
        }

        protected void btnPDFExportClasification_Click(object sender, ImageClickEventArgs e)
        {
            ExportGridToPDF(gridClassification, "Unbundling Clasification");
        }

        protected void btnCSVExportDistibution_Click(object sender, ImageClickEventArgs e)
        {
            GridFooterItem footerItem = new GridFooterItem(gridDistribution.MasterTableView, 0, 0);
            for (int x = 0; x < gridDistribution.Columns.Count; x++)
            {
                TableCell tc = new TableCell();
                tc.ID = gridDistribution.Columns[x].UniqueName;
                footerItem.Cells.Add(tc);
            }

            ExportGridToExcel(gridDistribution, "Unbundling Distribution", footerItem);
        }

        protected void btnPDFExportDistribution_Click(object sender, ImageClickEventArgs e)
        {

            GridFooterItem footerItem = new GridFooterItem(gridDistribution.MasterTableView, -1, -1);

            for (int x = 0; x < gridDistribution.Columns.Count; x++)
            {
                TableCell tc = new TableCell();
                tc.ID = gridDistribution.Columns[x].UniqueName;
                footerItem.Cells.Add(tc);
            }

            ExportGridToPDF(gridDistribution, "Unbundling Distribution", footerItem);
        }

        protected void btnCSVExportCommission_Click(object sender, ImageClickEventArgs e)
        {
            ExportGridToExcel(gridCommission, "Unbundling Commission");
        }

        protected void btnPDFExportCommission_Click(object sender, ImageClickEventArgs e)
        {
            ExportGridToPDF(gridCommission, "Unbundling Commission");
        }

        private void ExportGridToExcel(RadGrid grid, string fileName, GridFooterItem footerItem = null)
        {
            try
            {
                DataTable dt = ConvertTableToData(grid, footerItem);// _data;
                if (dt.Rows.Count == 0)
                {
                    string msg = "Nothing To Export.";
                    Page.ClientScript.RegisterStartupScript(GetType(), "error", "ShowUpdated('" + msg + "');", true);
                }
                else

                {
                    Export.ToXLS(Response, fileName, dt);
                }

            }
            catch (Exception Ex)
            {
                CommonTasks.ErrorMsgSettings(Ex, System.Reflection.MethodBase.GetCurrentMethod().Name.ToString(), _moduleName, _pageName, mySession.Current.User_ID, divMessage, lblMessage);
            }
        }

        private void ExportGridToPDF(RadGrid grid, string fileName, GridFooterItem footerItem = null)
        {
            try
            {
                DataTable dt = ConvertTableToData(grid, footerItem);// _data;
                if (dt.Rows.Count == 0)
                {
                    string msg = "Nothing To Export.";
                    Page.ClientScript.RegisterStartupScript(GetType(), "error", "ShowUpdated('" + msg + "');", true);
                }
                else
                {
                    Export.ToPDF(Response, fileName, dt, true, "", true);
                }

            }
            catch (Exception Ex)
            {
                CommonTasks.ErrorMsgSettings(Ex, System.Reflection.MethodBase.GetCurrentMethod().Name.ToString(), _moduleName, _pageName, mySession.Current.User_ID, divMessage, lblMessage);
            }
        }

        protected void lstACcIDMSSubComponentType_SelectedIndexChanged(object sender, EventArgs e)
        {
            foreach (GridDataItem item in gridClassification.MasterTableView.Items)
            {
                var cidmsSubComponentTypeListBox = item.FindControl("lstACcIDMSSubComponentType") as DropDownList;
                var cidmsSubComponentTypeId = cidmsSubComponentTypeListBox?.SelectedValue.intSafe() ?? 0;

                if (cidmsSubComponentTypeId <= 0) continue;
                
                var entity = AssetsMicroservice.CIDMSSubComponentTypes.GetByIdAsync(cidmsSubComponentTypeId)
                    .Result;
                    
                item.Cells[11].Text = entity?.CIDMSComponentType?.CIDMSAssetType?.CIDMSGroupType?.CIDMSClass?.CIDMSAccountingSubGroup?.CIDMSAccountingGroup?.Description ?? item.Cells[11].Text;
                item.Cells[12].Text = entity?.CIDMSComponentType?.CIDMSAssetType?.CIDMSGroupType?.CIDMSClass?.CIDMSAccountingSubGroup?.Description ?? item.Cells[12].Text;
                item.Cells[13].Text = entity?.CIDMSComponentType?.CIDMSAssetType?.CIDMSGroupType?.CIDMSClass?.Description ?? item.Cells[13].Text;
                item.Cells[14].Text = entity?.CIDMSComponentType?.CIDMSAssetType?.CIDMSGroupType?.Description ?? item.Cells[14].Text;
                item.Cells[15].Text = entity?.CIDMSComponentType?.CIDMSAssetType?.Description ?? item.Cells[15].Text;
                item.Cells[16].Text = entity?.CIDMSComponentType?.Description ?? item.Cells[16].Text;
            }
        }

        protected void lstAssetType_SelectedIndexChanged(object sender, EventArgs e)
        {
            PopulateAssetCategories();
            PopulateMeasurementTypes();
        }

        protected void lstAssetCategory_SelectedIndexChanged(object sender, EventArgs e)
        {
            PopulateAssetSubCategories();
            PopulateAssetStatuses();
        }

        protected void btnAddGoodService_Click(object sender, EventArgs e)
        {

            if (ValidateClasifications())
            {
                SaveClassifications();
                LoadClassification();

                gridClassification.Columns[27].Visible = true;
                gridClassification.Columns[26].Visible = true;
                gridClassification.Columns[25].Visible = true;
                gridClassification.Columns[24].Visible = true;
                gridClassification.Columns[23].Visible = true;
                gridClassification.Columns[22].Visible = true;
                gridClassification.Columns[21].Visible = true;
                gridClassification.Columns[20].Visible = true;



                DataRow dr = _data.NewRow();
                dr["ContractId"] = "0";
                dr["AssetContractHeaderId"] = "0";
                dr["RegisterItemsId"] = "0";

                _data.Rows.Add(dr);
                gridClassification.DataSource = _data;
                gridClassification.Rebind();

                LoadDropDowns();
                gridClassification.Columns[27].Visible = false;
                gridClassification.Columns[26].Visible = false;
                gridClassification.Columns[25].Visible = false;
                gridClassification.Columns[24].Visible = false;
                gridClassification.Columns[23].Visible = false;
                gridClassification.Columns[22].Visible = false;
                gridClassification.Columns[21].Visible = false;
                gridClassification.Columns[20].Visible = false;
                gridClassification_SelectedIndexChanged(null, null);

            }
        }



        private bool ValidateCapitalContract()
        {
            bool success = false;
            if (!String.IsNullOrEmpty(hdnUploadedDocs.Value))
            {
                success = true;
            }
            else
            {
                success = false;
            }

            if (success)
            {
                stepCapitalContract.ImageUrl = imgYes;
            }
            else
            {
                stepCapitalContract.ImageUrl = imgNo;
            }

            return success;
        }

        private bool ValidateClasifications(bool PopMsg = true)
        {
            bool success = true;

            foreach (var i in gridClassification.Items)
            {
                if (i is GridDataItem)
                {
                    GridDataItem item = (GridDataItem)i;

                    DropDownList lstUOM = (DropDownList)(item.FindControl("lstUOM") as DropDownList);
                    if (lstUOM.SelectedValue == "0")
                    {
                        success = false;
                        lstUOM.BorderColor = System.Drawing.Color.Red;
                        lstUOM.BorderWidth = 2;
                    }
                    else
                    {
                        lstUOM.BorderColor = System.Drawing.Color.White;
                    }

                    TextBox txtItemDescription = (TextBox)(item.FindControl("txtItemDescription") as TextBox);
                    if (txtItemDescription.Text == "")
                    {
                        success = false;
                        txtItemDescription.BorderColor = System.Drawing.Color.Red;
                        txtItemDescription.BorderWidth = 2;
                    }
                    else
                    {
                        txtItemDescription.BorderColor = System.Drawing.Color.White;
                    }

                    TextBox txtQuantityOrder = (TextBox)(item.FindControl("txtQuantityOrder") as TextBox);
                    if (txtQuantityOrder.Text == "" || txtQuantityOrder.Text == "0")
                    {
                        success = false;
                        txtQuantityOrder.BorderColor = System.Drawing.Color.Red;
                        txtQuantityOrder.BorderWidth = 2;
                    }
                    else
                    {
                        txtQuantityOrder.BorderColor = System.Drawing.Color.White;
                    }

                    TextBox txtACrate = (TextBox)(item.FindControl("txtACrate") as TextBox);
                    if (txtACrate.Text == "" || txtACrate.Text == "0")
                    {
                        success = false;
                        txtACrate.BorderColor = System.Drawing.Color.Red;
                        txtACrate.BorderWidth = 2;
                    }
                    else
                    {
                        txtACrate.BorderColor = System.Drawing.Color.White;
                    }

                    TextBox txtTotalAmount = (TextBox)(item.FindControl("txtTotalAmount1") as TextBox);
                    if (txtTotalAmount.Text == "")
                    {
                        success = false;
                        txtTotalAmount.BorderColor = System.Drawing.Color.Red;
                        txtTotalAmount.BorderWidth = 2;
                    }
                    else
                    {
                        txtTotalAmount.BorderColor = System.Drawing.Color.White;
                    }


                    TextBox txtACassetDescription = (TextBox)(item.FindControl("txtACassetDescription") as TextBox);
                    if (txtACassetDescription.Text == "")
                    {
                        success = false;
                        txtACassetDescription.BorderColor = System.Drawing.Color.Red;
                        txtACassetDescription.BorderWidth = 2;
                    }
                    else
                    {
                        txtACassetDescription.BorderColor = System.Drawing.Color.White;
                    }

                    DropDownList lstACcIDMSSubComponentType = (DropDownList)(item.FindControl("lstACcIDMSSubComponentType") as DropDownList);
                    if (lstACcIDMSSubComponentType.SelectedValue == "0")
                    {
                        success = false;
                        lstACcIDMSSubComponentType.BorderColor = System.Drawing.Color.Red;
                        lstACcIDMSSubComponentType.BorderWidth = 2;
                    }
                    else
                    {
                        lstACcIDMSSubComponentType.BorderColor = System.Drawing.Color.White;
                    }

                    DropDownList lstAssetType = (DropDownList)(item.FindControl("lstAssetType") as DropDownList);
                    if (lstAssetType.SelectedValue == "0")
                    {
                        success = false;
                        lstAssetType.BorderColor = System.Drawing.Color.Red;
                        lstAssetType.BorderWidth = 2;
                    }
                    else
                    {
                        lstAssetType.BorderColor = System.Drawing.Color.White;
                    }

                    DropDownList lstAssetCategory = (DropDownList)(item.FindControl("lstAssetCategory") as DropDownList);
                    if (lstAssetCategory.Items.Count == 0)
                    {
                        lstAssetCategory.BorderColor = System.Drawing.Color.White;
                    }
                    else
                    {
                        if (lstAssetCategory.SelectedValue == "0")
                        {
                            success = false;
                            lstAssetCategory.BorderColor = System.Drawing.Color.Red;
                            lstAssetCategory.BorderWidth = 2;
                        }
                        else
                        {
                            lstAssetCategory.BorderColor = System.Drawing.Color.White;
                        }
                    }

                    DropDownList lstAssetSubCategory = (DropDownList)(item.FindControl("lstAssetSubCategory") as DropDownList);
                    if (lstAssetSubCategory.Items.Count < 2)
                    {
                        lstAssetSubCategory.BorderColor = System.Drawing.Color.White;
                    }
                    else
                    {
                        if (lstAssetSubCategory.SelectedValue == "0")
                        {
                            success = false;
                            lstAssetSubCategory.BorderColor = System.Drawing.Color.Red;
                            lstAssetSubCategory.BorderWidth = 2;
                        }
                        else
                        {
                            lstAssetSubCategory.BorderColor = System.Drawing.Color.White;
                        }
                    }

                    DropDownList lstMeasurementType = (DropDownList)(item.FindControl("lstMeasurementType") as DropDownList);
                    if (lstMeasurementType.Items.Count == 0)
                    {
                        lstMeasurementType.BorderColor = System.Drawing.Color.White;
                    }
                    else
                    {
                        if (lstMeasurementType.SelectedValue == "0")
                        {
                            success = false;
                            lstMeasurementType.BorderColor = System.Drawing.Color.Red;
                            lstMeasurementType.BorderWidth = 2;
                        }
                        else
                        {
                            lstMeasurementType.BorderColor = System.Drawing.Color.White;
                        }
                    }

                    DropDownList lstAssetStatus = (DropDownList)(item.FindControl("lstAssetStatus") as DropDownList);
                    if (lstAssetStatus.Items.Count == 0)
                    {
                        lstAssetStatus.BorderColor = System.Drawing.Color.White;
                    }
                    else
                    {
                        if (lstAssetStatus.SelectedValue == "0")
                        {
                            success = false;
                            lstAssetStatus.BorderColor = System.Drawing.Color.Red;
                            lstAssetStatus.BorderWidth = 2;
                        }
                        else
                        {
                            lstAssetStatus.BorderColor = System.Drawing.Color.White;
                        }
                    }
                }
            }

            if (String.IsNullOrEmpty(txtMainAsset.Text))
            {
                success = false;
                txtMainAsset.BorderColor = System.Drawing.Color.Red;
                txtMainAsset.BorderWidth = 2;
            }
            else
            {
                txtMainAsset.BorderColor = System.Drawing.Color.White;
            }

            // Also check the Documents

            if (String.IsNullOrEmpty(hdnUploadedDocs.Value))
            {
                success = false;
            }

            if (!success)
            {
                stepAssetClasification.ImageUrl = imgNo;
                if (PopMsg)
                {
                    string msg = "Not all required fields are filled in.";
                    Page.ClientScript.RegisterStartupScript(GetType(), "error", "ShowUpdated('" + msg + "');", true);
                }
            }
            else
            {
                stepAssetClasification.ImageUrl = imgYes;
            }
            return success;
        }


        private void Core_Save_Parent(int contractId, string parentDescription)
        {
            try
            {
                _ = AssetsMicroservice.AssetUnbundlingParents.UpdateAsync(0,
                    new AssetsMicroservice.AssetUnbundlingParents.AssetUnbundlingParentView
                    {
                        Id = 0,
                        ContractId = contractId,
                        ParentDescription = parentDescription
                    }).Result;
            }
            catch (Exception ex)
            {
                // ignored
            }
        }


        protected void gridClassification_ItemDataBound(object sender, GridItemEventArgs e)
        {
            if (e.Item is GridDataItem)
            {
                GridDataItem item = (GridDataItem)e.Item;

                TextBox txtItemDescription = (TextBox)(item.FindControl("txtItemDescription") as TextBox);
                if (txtItemDescription.Text == "")
                {
                    txtItemDescription.ReadOnly = false;
                }
                else
                {
                    txtItemDescription.ReadOnly = true;
                    txtItemDescription.BorderStyle = BorderStyle.None;
                }
                TextBox txtQuantityOrder = (TextBox)(item.FindControl("txtQuantityOrder") as TextBox);
                TextBox txtACrate = (TextBox)(item.FindControl("txtACrate") as TextBox);

                TextBox txtTotalAmount = (TextBox)(item.FindControl("txtTotalAmount1") as TextBox);

                txtTotalAmount.Text = (Convert.ToDecimal("0" + txtQuantityOrder.Text) * Convert.ToDecimal("0" + txtACrate.Text)).ToString("0.00");
            }
        }

        protected void btnACsave_Click(object sender, EventArgs e)
        {
            if (ValidateClasifications(true))
            {
                SaveClassifications();
                UpdateProgress(_contractHeaderId, 2);
            }
        }

        protected void txtACrate_TextChanged(object sender, EventArgs e)
        {
            foreach (GridDataItem item in gridClassification.MasterTableView.Items)
            {
                TextBox txtQuantityOrder = (TextBox)(item.FindControl("txtQuantityOrder") as TextBox);

                TextBox txtACrate = (TextBox)(item.FindControl("txtACrate") as TextBox);

                TextBox txtTotalAmount = (TextBox)(item.FindControl("txtTotalAmount1") as TextBox);

                txtTotalAmount.Text = (Convert.ToDecimal("0" + txtQuantityOrder.Text) * Convert.ToDecimal("0" + txtACrate.Text)).ToString("0.00");

            }
        }

        protected void lstACassetItem_SelectedIndexChanged(object sender, EventArgs e)
        {
            PopulateCidmsSubComponentTypes();
            PopulateAssetTypes();

            foreach (GridDataItem item in gridClassification.MasterTableView.Items)
            {
                DropDownList lstACassetItem = (DropDownList)(item.FindControl("lstACassetItem") as DropDownList);
                DropDownList lstACcIDMSSubComponentType = (DropDownList)(item.FindControl("lstACcIDMSSubComponentType") as DropDownList);
                DropDownList lstAssetType = (DropDownList)(item.FindControl("lstAssetType") as DropDownList);

                if (lstACassetItem.SelectedValue == "true")
                {
                    lstACcIDMSSubComponentType.Enabled = true;
                    lstAssetType.Enabled = true;
                }
                else
                {
                    lstACcIDMSSubComponentType.Items.Clear();
                    lstACcIDMSSubComponentType.DataSource = null;
                    lstACcIDMSSubComponentType.Enabled = false;

                    lstAssetType.Items.Clear();
                    lstAssetType.DataSource = null;
                    lstAssetType.Enabled = false;

                    DropDownList lstAssetCategory = (DropDownList)(item.FindControl("lstAssetCategory") as DropDownList);
                    lstAssetCategory.Items.Clear();
                    lstAssetCategory.DataSource = null;
                    lstAssetCategory.Enabled = false;

                    DropDownList lstAssetSubCategory = (DropDownList)(item.FindControl("lstAssetSubCategory") as DropDownList);
                    lstAssetSubCategory.Items.Clear();
                    lstAssetSubCategory.DataSource = null;
                    lstAssetSubCategory.Enabled = false;

                    DropDownList lstMeasurementType = (DropDownList)(item.FindControl("lstMeasurementType") as DropDownList);
                    lstMeasurementType.Items.Clear();
                    lstMeasurementType.DataSource = null;
                    lstMeasurementType.Enabled = false;

                    DropDownList lstAssetStatus = (DropDownList)(item.FindControl("lstAssetStatus") as DropDownList);
                    lstAssetStatus.Items.Clear();
                    lstAssetStatus.DataSource = null;
                    lstAssetStatus.Enabled = false;
                }
            }
        }

        private static string _parentAssetId = "0";

        private void SaveClassifications()
        {
            Core_Save_Parent(_contractHeaderId, txtMainAsset.Text);

            foreach (var gridItem in gridClassification.Items)
            {
                if (gridItem is GridDataItem item)
                {
                    int.TryParse(item["Id"].Text, out var assetContractDetailId);

                    var uomListBox = item.FindControl("lstUOM") as DropDownList;
                    var txtItemDescription = item.FindControl("txtItemDescription") as TextBox;
                    var txtQuantityOrder = item.FindControl("txtQuantityOrder") as TextBox;
                    var txtACrate = item.FindControl("txtACrate") as TextBox;
                    var txtTotalAmount = item.FindControl("txtTotalAmount1") as TextBox;
                    var lstACassetItem = item.FindControl("lstACassetItem") as DropDownList;
                    var txtACassetDescription = item.FindControl("txtACassetDescription") as TextBox;
                    var lstAcCidmsSubComponentType = item.FindControl("lstACcIDMSSubComponentType") as DropDownList;
                    var lstAssetType = item.FindControl("lstAssetType") as DropDownList;
                    var lstAssetCategory = item.FindControl("lstAssetCategory") as DropDownList;
                    var lstAssetSubCategory = item.FindControl("lstAssetSubCategory") as DropDownList;
                    var lstMeasurementType = item.FindControl("lstMeasurementType") as DropDownList;
                    var lstAssetStatus = item.FindControl("lstAssetStatus") as DropDownList;
                    
                    var view = new AssetsMicroservice.AssetUnbundlingDetails.AssetUnbundlingDetailSaveView
                    {
                        ContractId = _contractHeaderId,
                        AssetContractDetailId = assetContractDetailId,
                        GoodsServiceDescription = txtItemDescription.Text,
                        UoM = uomListBox is { Items: { Count: 0 } } ? null : uomListBox?.SelectedValue.intNullSafe(),
                        Quantity = txtQuantityOrder?.Text.decNullSafe(),
                        Rate = txtACrate?.Text.decNullSafe(),
                        Amount = txtTotalAmount?.Text.decNullSafe(),
                        IsAsset = lstACassetItem?.SelectedValue == "true",
                        AssetDescription = txtACassetDescription.Text,
                        CidmsSubComponentTypeId = lstAcCidmsSubComponentType?.SelectedValue.intNullSafe(),
                        AssetTypeId = lstAssetType?.SelectedValue.intNullSafe(),
                        AssetCategoryId = lstAssetCategory is { Items: { Count: 0 } } ? null : lstAssetCategory?.SelectedValue.intNullSafe(),
                        AssetSubCategoryId = lstAssetSubCategory is { Items: { Count: 0 } } ? null : lstAssetSubCategory?.SelectedValue.intNullSafe(),
                        MeasurementTypeId = lstMeasurementType is { Items: { Count: 0 } } ? null : lstMeasurementType?.SelectedValue.intNullSafe(),
                        AssetStatusId = lstAssetStatus is { Items: { Count: 0 } } ? null : lstAssetStatus?.SelectedValue.intNullSafe()
                    };

                    _ = assetContractDetailId == 0 ?
                        AssetsMicroservice.AssetUnbundlingDetails.CreateAsync(view).Result :
                        AssetsMicroservice.AssetUnbundlingDetails.UpdateAsync(assetContractDetailId, view).Result;
                }
            }
        }

        protected void btnACcalc_Click(object sender, EventArgs e)
        {
            if (ValidateClasifications(true))
            {
                SaveClassifications();
                UpdateProgress(_contractHeaderId, 2);
                stepCostDistribution.Enabled = true;
                wizMain.ActiveStepIndex = stepCostDistribution.Index;
                wizMain_ActiveStepChanged(null, null);
            }
        }

        protected void btnACcancel_Click(object sender, EventArgs e)
        {
            Response.Redirect(_pageName);
        }

        private static decimal totalCost = 0;
        private static decimal totalCIDMScost = 0;
        private static decimal totalBillcost = 0;

        protected void gridDistribution_ItemDataBound(object sender, GridItemEventArgs e)
        {

            if (e.Item is GridDataItem)
            {

                GridDataItem item = (GridDataItem)e.Item;
                TextBox txtGCDactualSurvey = (TextBox)(item.FindControl("txtGCDactualSurvey") as TextBox);
                decimal TotalGeneralCost = 0;
                if (item["TotalGeneralCost"].Text.Replace("&nbsp;", "") != "")
                    TotalGeneralCost = Convert.ToDecimal(item["TotalGeneralCost"].Text.Replace("&nbsp;", "0"));
                if (TotalGeneralCost != 0)
                {
                    txtGCDactualSurvey.Visible = false;
                    item["TotalGeneralCost"].Text = TotalGeneralCost.ToString("0.00");
                    totalCost += TotalGeneralCost;
                }
                else
                {
                    decimal ic = Convert.ToDecimal((item.FindControl("txtGCDactualSurvey") as TextBox).Text.Replace("&nbsp;", "0"));
                    ic = ic == 0 ? 1 : ic;
                    totalCIDMScost += Convert.ToDecimal(item["TotalCostPerSubCompType"].Text.Replace("&nbsp;", "0"));
                    totalBillcost += Convert.ToDecimal(item["TotalBillOfQuantities"].Text.Replace("&nbsp;", "0"));

                    item["TotalCostPerSubCompType"].Text = Convert.ToDecimal(item["TotalCostPerSubCompType"].Text.Replace("&nbsp;", "0")).ToString("0.00");
                    item["GeneralCostDistribution"].Text = Convert.ToDecimal(item["GeneralCostDistribution"].Text.Replace("&nbsp;", "0")).ToString("0.00");
                    item["TotalBillOfQuantities"].Text = Convert.ToDecimal(item["TotalBillOfQuantities"].Text.Replace("&nbsp;", "0")).ToString("0.00");
                    item["UnitCost"].Text = (Convert.ToDecimal("0" + item["TotalBillOfQuantities"].Text.Replace("&nbsp;", "0")) / ic).ToString("0.00");

                    if (txtGCDactualSurvey.Text == "")
                    {
                        txtGCDactualSurvey.Text = "1";
                    }
                }
                for (int c = 2; c < item.Cells.Count; c++)
                {
                    if (item.Cells[c].Text == "0")
                        item.Cells[c].Text = "";
                }
            }
        }

        protected void btnGCDCancel_Click(object sender, EventArgs e)
        {
            Response.Redirect(_pageName);
        }
        private bool ValidateDistribution(bool forExport = false)
        {
            bool retval = true;
            string msg = "";

            if (Convert.ToDecimal(lblDiff.Text) != 0 && String.IsNullOrEmpty(yxyGCDcomment.Text))
            {
                retval = false;
                lblDiff.BorderColor = System.Drawing.Color.Red;
                lblDiff.BorderWidth = 2;
                yxyGCDcomment.BorderColor = System.Drawing.Color.Red;
                yxyGCDcomment.BorderWidth = 2;
                msg = "Total Project Cost and Actual Expenditure does not reconcile. Provide a reason for the difference.";
            }

            if (lstGCDApprove.Text == "--Select--")
            {
                retval = false;
                lstGCDApprove.BorderColor = System.Drawing.Color.Red;
                lstGCDApprove.BorderWidth = 2;
                yxyGCDcomment.BorderColor = System.Drawing.Color.White;

            }
            else if (lstGCDApprove.Text == "Declined" && yxyGCDcomment.Text.Trim() == "")
            {
                retval = false;
                yxyGCDcomment.BorderColor = System.Drawing.Color.Red;
                yxyGCDcomment.BorderWidth = 2;
            }
            else
            {
                lstGCDApprove.BorderColor = System.Drawing.Color.White;
                yxyGCDcomment.BorderColor = System.Drawing.Color.White;
            }

            _ = AssetsMicroservice.AssetUnbundlingHeaders.CheckClassExistsContractIdAsync(_contractHeaderId).Result;

            if (retval)
            {
                stepCostDistribution.ImageUrl = imgYes;
                btnGCDSubmit.Enabled = true;
            }
            else
            {
                stepCostDistribution.ImageUrl = imgNo;
                btnGCDSubmit.Enabled = false;
            }

            if (msg != "")
                ScriptManager.RegisterStartupScript(this, this.GetType(), "popup3", "ShowUpdated('" + msg + "');", true);

            return retval;
        }


        protected void btnGCDSubmit_Click(object sender, EventArgs e)
        {
            selectedEvent = "saveDistribution";

            if (ValidateDistribution())
            {
                if (_listGenerated)
                {

                    UpdateProgress(_contractHeaderId, 3);

                    stepCostDistribution.ImageUrl = imgYes;

                    // Before we carry on we need to validate if all Scoa are setup

                    if (!ValidatePreCommissioning())
                    {
                        ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", "ShowUpdated('Please configure mSCOA settings')", true);
                    }
                    else
                    {
                        stepCommissioning.Enabled = true;
                        wizMain.ActiveStepIndex = stepCommissioning.Index;
                        wizMain_ActiveStepChanged(null, null);
                    }
                }
                else
                {
                    ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", "ShowUpdated('Asset List has not been Generated yet')", true);
                }
            }
        }


        protected void btnGenList_Click(object sender, EventArgs e)
        {
            if (ValidateDistribution(true))
            {
                GenerateDistributionAssetList();
                _listGenerated = true;
                ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", "ShowUpdated('Asset List Successfully Generated')", true);
            }
        }

        private void GenerateDistributionAssetList()
        {
            string folder = CommonTasks.GetfullPath("FolderAssetDocuments");
            if (String.IsNullOrEmpty(folder))
                folder = "c:\\AssetDocuments\\";

            gridDistribution.Columns[0].Visible = true;
            gridDistribution.Columns[8].Visible = true;
            gridDistribution.Columns[9].Visible = true;
            gridDistribution.Columns[10].Visible = true;
            gridDistribution.Columns[11].Visible = true;
            gridDistribution.Columns[12].Visible = true;

            AssetsMicroservice.AssetUnbundlingDistributions.ResetDistributionsAsync(_contractHeaderId).ConfigureAwait(false);

            decimal projectCost = 0;
            foreach (var item in gridDistribution.Items)
            {
                if (item is not GridDataItem dataItem) continue;
                
                var quantityTextBox = dataItem.FindControl("txtGCDactualSurvey") as TextBox;
                var quantity = quantityTextBox?.Text.intSafe() ?? 0;

                if (quantity <= 0) continue;
                
                var assetDescription = dataItem["ItemDescription"].Text;
                var assetCategoryId = dataItem["AssetCategoryId"].Text.intNullSafe();
                var assetStatusId = dataItem["AssetStatusId"].Text.intNullSafe();
                var assetSubCategoryId = dataItem["AssetSubCategoryId"].Text.intNullSafe();
                var assetTypeId = dataItem["AssetTypeId"].Text.intNullSafe();
                var cidmsSubComponentTypeId = dataItem["CidmsSubComponentTypeId"].Text?.intNullSafe();
                var measurementTypeId = dataItem["MeasurementTypeId"].Text.intNullSafe();

                projectCost += Convert.ToDecimal("0" + dataItem.Cells[9].Text);
                    
                var view = new AssetsMicroservice.AssetUnbundlingDistributions.AssetUnbundlingDistributionView
                {
                    ContractHeaderId = _contractHeaderId,
                    ParentRegisterItemId = _parentAssetId.intNullSafe(),
                    AssetDescription = assetDescription,
                    AssetCategoryId = assetCategoryId,
                    AssetStatusId = assetStatusId,
                    AssetSubCategoryId = assetSubCategoryId,
                    AssetTypeId = assetTypeId,
                    CidmsSubComponentTypeId = cidmsSubComponentTypeId,
                    MeasurementTypeId = measurementTypeId,
                    AssetValue = dataItem["UnitCost"].Text.decNullSafe(),
                    TotalProjectCost = projectCost,
                    Quantity = quantity
                };

                _ = AssetsMicroservice.AssetUnbundlingDistributions.CreateAsync(view).Result;
            }

            gridDistribution.Columns[0].Visible = false;
            gridDistribution.Columns[8].Visible = false;
            gridDistribution.Columns[9].Visible = false;
            gridDistribution.Columns[10].Visible = false;
            gridDistribution.Columns[11].Visible = false;
            gridDistribution.Columns[12].Visible = false;
            
            var results = AssetsMicroservice.AssetUnbundlingDistributions
                .GenerateDistributionsAsync(_contractHeaderId, folder).Result;

            if (results is not null && results.IsSuccessStatusCode)
            {
                var fileName = results.Entity.Replace("\"", string.Empty);

                //download the file
                var fileBytes = GetFileBytes(fileName);
                var jscript =
                    $"openBase64InNewTab('{Convert.ToBase64String(fileBytes)}', 'application/octet-stream','{fileName}');";
                ScriptManager.RegisterStartupScript(this, GetType(), "popup2", jscript, true);
            }
        }

        private byte[] GetFileBytes(string fileName)
        {
            byte[] _fileBytes;

            string folder = CommonTasks.GetfullPath("FolderAssetDocuments");
            if (String.IsNullOrEmpty(folder))
                folder = "c:\\AssetDocuments\\";

            FileStream fs = new FileStream(folder + fileName, FileMode.Open, FileAccess.Read);

            byte[] ImageData = new byte[fs.Length];

            fs.Read(ImageData, 0, System.Convert.ToInt32(fs.Length));

            fs.Close();
            _fileBytes = ImageData;

            return _fileBytes;

        }

        protected void btnDialogOK_Click(object sender, EventArgs e)
        {

        }


        protected void btnDialogClose_Click(object sender, EventArgs e)
        {
            _uploadedFile = null;
            Response.Redirect("~/AssetsLanding.aspx");
        }

        protected void gridFiles_ItemDataBound(object sender, GridItemEventArgs e)
        {

        }

        public void alnkDownloadDoc_Click(object sender, EventArgs e)
        {
            LinkButton alnkDownloadDoc = sender as LinkButton;

            string filename = alnkDownloadDoc.ToolTip;

            byte[] _fileBytes = GetFileBytes(filename);
            string jscript = $"openBase64InNewTab('{Convert.ToBase64String(_fileBytes)}', 'application/octet-stream','{filename}');";

            ScriptManager.RegisterStartupScript(this, this.GetType(), "popup2", jscript, true);
        }

        protected void txtGCDactualSurvey_TextChanged(object sender, EventArgs e)
        {
            int x = 0;

            foreach (var item in gridDistribution.Items)
            {

                if (item is GridDataItem)
                {
                    GridDataItem dataItem = item as GridDataItem;

                    TextBox txtGCDactualSurvey = (TextBox)(dataItem.FindControl("txtGCDactualSurvey") as TextBox);

                    _data.Rows[x]["ActualSurvey"] = Convert.ToInt32(txtGCDactualSurvey.Text);
                    x++;
                }
                else if (item is GridFooterItem)
                {
                    GridFooterItem footerItem = item as GridFooterItem;

                }

            }
            gridDistribution.DataSource = _data;
            gridDistribution.DataBind();
        }


        protected void btnComSubmit_Click(object sender, EventArgs e)
        {
            var success = 0;
            if (!ValidateCommissioning()) return;
            
            foreach (GridItem item in gridCommission.Items)
            {
                if (item is not GridDataItem dataItem) continue;
                    
                var isApproveCheckBox = dataItem["chkComApprove"].Controls.FindControlsOfType<CheckBox>().FirstOrDefault();
                        
                if (isApproveCheckBox is null || !isApproveCheckBox.Checked) continue;

                if (lstCommApprove.SelectedValue != "Approved") continue;
                        
                var results = AssetsMicroservice.AssetUnbundlingDistributions
                    .GenerateAssetsAsync(_contractHeaderId, dataItem["AssetTypeId"].Text.intSafe(),
                        dataItem["AssetDescription"].Text).Result;
                                
                if (results is not null && results.IsSuccessStatusCode)
                    success = results.Entity ? 1 : 2;
            }

            UpdateProgress(_contractHeaderId, 4);

            UpdateComplete(_contractHeaderId);

            var msg = success switch
            {
                1 => "Successfully updated and posted to the General Ledger. Assets ready to be managed",
                2 => "Asset Register was not be updated. Ledger Posting already done",
                3 => "Asset unbundling declined successfully",
                4 => "Asset unbundling could not be declined",
                _ => string.Empty
            };
            
            ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", $"ShowUpdated('{msg}')", true);
        }


        private bool ValidateCommissioning()
        {
            bool retval = true;
            txtComComments.BorderColor = System.Drawing.Color.White;

            if (lstCommApprove.SelectedIndex > 0)
            {
                lstCommApprove.BorderColor = System.Drawing.Color.White;
                if (lstCommApprove.SelectedValue == "Declined")
                {
                    if (txtComComments.Text.Trim() == "")
                    {
                        txtComComments.BorderColor = System.Drawing.Color.Red;
                        txtComComments.BorderWidth = 2;
                        retval = false;
                    }

                }
            }
            else
            {
                lstCommApprove.BorderColor = System.Drawing.Color.Red;
                lstCommApprove.BorderWidth = 2;
                retval = false;
            }

            if (retval)
                stepCommissioning.ImageUrl = imgYes;
            else
                stepCommissioning.ImageUrl = imgNo;

            return retval;
        }

        protected void btnComSCancel_Click(object sender, EventArgs e)
        {
            bool success = true;
            if (success)
            {
                stepCostDistribution.Enabled = true;
                wizMain.ActiveStepIndex = stepCostDistribution.Index;

                wizMain_ActiveStepChanged(null, null);
            }
        }


        private static string selectedEvent = "";
        private static string _uploadedFile = null;

        protected void btnUpload_Click(object sender, EventArgs e)
        {
            try
            {
                bool Rules = false;
                string msg = "";

                string strcsvpath = "", FilePath = "";
                string strFileName = "";
                if (upFileUpload.HasFile == true)
                {
                    strcsvpath = CommonTasks.GetfullPath("FolderAssetDocuments");
                    strcsvpath = strcsvpath.ToString();

                    if (strcsvpath != string.Empty)
                    {
                        if (!Directory.Exists((strcsvpath)))
                        {
                            Directory.CreateDirectory((strcsvpath));
                        }

                        filepath = strcsvpath.ToString();
                    }
                    else
                    {
                        //strFileName = hidPhotoPath.Value;
                    }
                }
                else
                {
                    msg = "• No File selected.";
                    ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", $"ShowUpdated('{msg}')", true);
                    return;
                }

                if (upFileUpload.PostedFile.FileName == string.Empty)
                {
                    msg = "• File Name Cannot Be Blank.";
                    ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", $"ShowUpdated('{msg}')", true);
                    return;
                }

                //restrict user to upload other file extenstion
                string[] FileExt = upFileUpload.FileName.Split('.');
                string FileEx = FileExt[FileExt.Length - 1];

                switch (FileEx.ToLower())
                {
                    case "csv":
                    case "txt":
                        break;
                    default:
                        msg = "• File Is Not A CSV File. Please Upload A File With A CSV Extension.";
                        lblMessage.Attributes["class"] = "note";
                        divMessage.Style["display"] = "block";
                        return;
                        break;
                }
                //For uploading file
                try
                {
                    int prevUpload = CheckPreviousUpload(upFileUpload.FileName);

                    if (prevUpload == 1)
                        throw new Exception("The file you are trying to upload has already been uploaded successfully.");
                    else if (prevUpload == 2)
                        throw new Exception("The file you are trying to upload has already been uploaded and is still being processed.");
                    if (File.Exists(filepath + upFileUpload.FileName))
                        File.Delete(filepath + upFileUpload.FileName);

                    upFileUpload.SaveAs(filepath + upFileUpload.FileName);

                }
                catch (Exception ex)
                {
                    ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", $"ShowUpdated('{ex.Message}')", true);
                    return;
                }

                string ContractNo = string.Empty;

                if (String.IsNullOrEmpty(msg))
                {
                    AssetsDB.Asset_InsertBulkUploadJob(upFileUpload.FileName.ToString(), mySession.Current.User_ID, UnbundlingUploadType, Rules, ContractNo);//ANANTH:TP-78900

                    msg = "• A New Take On Added Successfully";
                    lblMessage.Attributes["class"] = "note";
                    divMessage.Style["display"] = "block";
                }
                UpdateProgress(_contractHeaderId, 5);
                ScriptManager.RegisterStartupScript(this.Page, GetType(), "classupdated", $"ShowUpdated('{msg}')", true);
            }
            catch (Exception ex)
            {
                Common.CommonTasks.ErrorMsgSettings(ex, System.Reflection.MethodBase.GetCurrentMethod().Name.ToString(), "Assets", this.Page.Title, mySession.Current.User_ID, divMessage, lblMessage);
            }
        }

        private int CheckPreviousUpload(string fileName)
        {
            int retval = 0;
            //check the db for the file name and status
            var rec = AssetsDB.Asset_BulkUploadJobs.OrderByDescending(a => a.ID).FirstOrDefault(a => a.Filename == fileName);

            if (rec != null)
                switch (rec.Job_Status.Substring(0, 10))
                {
                    case "Completed ":// Succesfully!":
                        if (rec.Job_Status == "Completed Succesfully!")
                        {
                            retval = 1;
                        }
                        break;
                    case "Reading Jo":// Reading Job File":
                    case "Processing":// Processing Job - Checking for Errors":
                    case "Not Starte":// Not Started":
                    case "Validating":
                    case "Reading Ta":// Reading Take On File":
                        retval = 2;
                        break;
                    default:
                        break;
                }

            return retval;

        }

        protected void btnDownLoad_Click(object sender, EventArgs e)
        {
            var folderName = CommonTasks.GetfullPath("FolderAssetDocuments");
            if (string.IsNullOrEmpty(folderName))
                folderName = @"C:\AssetDocuments\";

            var results = AssetsMicroservice.AssetUnbundlingDistributions
                .ExportUnbundlingAssetsAsync(_contractHeaderId, folderName).Result;
            
            if (results is not null && results.IsSuccessStatusCode)
            {
                var fileName = results.Entity.Replace("\"", "");
                var fileBytes = GetFileBytes(fileName);
                var jscript = $"openBase64InNewTab('{Convert.ToBase64String(fileBytes)}', 'application/octet-stream','{fileName}');";
                ScriptManager.RegisterStartupScript(this, GetType(), "popup2", jscript, true);
            }
            else
            {
                Page.ClientScript.RegisterStartupScript(GetType(), "error", "ShowUpdated('There was a problem generating the export file.');", true);
            }
        }

        private DataTable ConvertTableToData(RadGrid grid, GridFooterItem footerItem)
        {
            DataTable repData = new DataTable();
            //List<string> colNames = new List<string>();

            foreach (GridHeaderItem itm in grid.MasterTableView.GetItems(GridItemType.Header))
            {
                foreach (GridColumn col in grid.MasterTableView.Columns)
                {
                    if (col.HeaderStyle.Width.Value == 0 || !col.Visible)
                    { }
                    else
                    {
                        if (col.DataType.Name == "Boolean")
                        {
                            DataColumn newcol = new DataColumn(col.UniqueName,typeof(System.String));
                            newcol.Caption = col.HeaderText;
                            repData.Columns.Add(newcol);
                        }
                        else
                        {
                            DataColumn newcol = new DataColumn(col.UniqueName, col.DataType);
                            newcol.Caption = col.HeaderText;
                            repData.Columns.Add(newcol);
                        }                        

                    }
                }

            }
           
                foreach (var i in grid.MasterTableView.Items)
                {
                    GridDataItem item = (GridDataItem)i;
                    DataRow row = repData.NewRow();

                    if (i is GridDataItem)
                    {
                        for (int c = 0; c < repData.Columns.Count; c++)
                        {
                            string nam = repData.Columns[c].ColumnName;
                            row[nam] = DBNull.Value;

                            if (item[nam].Controls.Count > 0)
                            {
                                int x = 0;
                                for (x = 0; x < item[nam].Controls.Count; x++)
                                {
                                    if (item[nam].Controls[x].ID != null)
                                        break;
                                }

                                try
                                {

                                if (item[nam].Controls.Count > 1)
                                {
                                    if (item[nam].Controls[x].GetType() == typeof(TextBox))
                                    {
                                        TextBox tb = (TextBox)(item[nam].Controls[x] as TextBox);
                                        row[nam] = tb.Text;
                                    }
                                    else if (item[nam].Controls[x].GetType() == typeof(DropDownList))
                                    {
                                        DropDownList lst = (DropDownList)(item[nam].Controls[x] as DropDownList);
                                        if (lst.SelectedIndex > 0)
                                            row[nam] = lst.SelectedItem.Text;
                                    }
                                    else if (item[nam].Controls[x].GetType() == typeof(CheckBox))
                                    {
                                        CheckBox chk = (CheckBox)(item[nam].Controls[x] as CheckBox);
                                        if (chk.Checked)
                                            row[nam] = "Yes";
                                        else
                                            row[nam] = "No";
                                    }
                                }
                                else
                                    {
                                        CheckBox chk = (CheckBox)(item[nam].Controls[0] as CheckBox);
                                        if (chk.Checked)
                                            row[nam] = "Yes";
                                        else
                                            row[nam] = "No";
                                    }
                                }
                                catch {
                                    HyperLink tb = (HyperLink)(item[nam].Controls[0] as HyperLink);
                                    row[nam] = tb.Text;
                                }
                            }
                            else
                            {
                                if (item[nam].Text.Replace("&nbsp;", "") != "")
                                    row[nam] = item[nam].Text.Replace("&nbsp;", "");
                            }

                            if (row[nam] != DBNull.Value && (Decimal.TryParse(row[nam].ToString(), out decimal trydec)))
                            {
                                if (trydec == 0)
                                    row[nam] = DBNull.Value;
                            }
                        }

                        repData.Rows.Add(row);
                    }
                }
           


            if (footerItem != null)
            {

                int rowCount = 0;
                for (int c = 0; c < repData.Columns.Count; c++)
                {
                    string nam = repData.Columns[c].ColumnName;
                    rowCount = footerItem[nam].Controls.Count > rowCount ? footerItem[nam].Controls.Count : rowCount;
                }
                for (int x = 0; x < rowCount; x++)
                {
                    DataRow row = repData.NewRow();
                    for (int c = 0; c < repData.Columns.Count; c++)
                    {
                        string nam = repData.Columns[c].ColumnName;
                        row[nam] = DBNull.Value;

                        if (x < footerItem[nam].Controls.Count)
                        {
                            var con = footerItem[nam].Controls[x];
                            string txt = ((LiteralControl)con).Text;
                            txt = txt.Replace("<br/>", "");
                            if (txt.Replace("&nbsp;", "").Trim() != "")
                                row[nam] = txt;

                            if (row[nam] != DBNull.Value && (Decimal.TryParse(row[nam].ToString(), out decimal trydec)))
                            {
                                if (trydec == 0)
                                    row[nam] = DBNull.Value;
                            }
                        }
                    }
                    repData.Rows.Add(row);

                }

            }
            return repData;
        }

        protected void gridCaptial_ItemCreated(object sender, GridItemEventArgs e)
        {
            if (e.Item is GridDataItem)
            {
                GridDataItem i = (GridDataItem)e.Item;
                if (((CheckBox)i.Controls[9].Controls[0]).Checked)
                    i["IsComplete"].Text = "Yes";
                else
                    i["IsComplete"].Text = "No";
            }
        }

        protected void gridCaptialDetail_ItemDataBound(object sender, GridItemEventArgs e)
        {

            if (e.Item is GridDataItem)
            {
                GridDataItem dataItem = (GridDataItem)e.Item;
                HyperLink hyperLink = (HyperLink)dataItem["VendorInvoiceNumberHyper"].Controls[0];
                hyperLink.Text = dataItem["VendorInvoiceNumber"].Text;
                hyperLink.NavigateUrl = "../../Reports/ReportPage.aspx?rptInvoiceDetail=1&InvoiceID=" + dataItem["VendorInvoiceID"].Text + "&VendorID=" + dataItem["VendorID"].Text;
                hyperLink.Target = "new";
                if (dataItem["PaymentReference"].Text != "&nbsp;")
                {
                    HyperLink hyperLinkPay = (HyperLink)dataItem["PaymentReferenceHyper"].Controls[0];
                    hyperLinkPay.Text = dataItem["PaymentReference"].Text;
                    var mainType = "Edit";
                }
            }
        }

        protected void gridClassification_SelectedIndexChanged(object sender, EventArgs e)
        {
            foreach (GridDataItem item in gridClassification.MasterTableView.Items)
            {
                DropDownList lstACassetItem = (DropDownList)(item.FindControl("lstACassetItem") as DropDownList);
                DropDownList lstACcIDMSSubComponentType = (DropDownList)(item.FindControl("lstACcIDMSSubComponentType") as DropDownList);
                DropDownList lstAssetType = (DropDownList)(item.FindControl("lstAssetType") as DropDownList);

                DropDownList lstUOMItem = (DropDownList)(item.FindControl("lstUOM") as DropDownList);
                TextBox txtQtyItem = (TextBox)(item.FindControl("txtQuantityOrder") as TextBox);
                TextBox txtRateItem = (TextBox)(item.FindControl("txtACrate") as TextBox);
                TextBox txtACassetDescriptionItem = (TextBox)(item.FindControl("txtACassetDescription") as TextBox);
                TextBox txtItemDescription = (TextBox)(item.FindControl("txtItemDescription") as TextBox);

                DropDownList lstAssetCategoryItem = (DropDownList)(item.FindControl("lstAssetCategory") as DropDownList);
                DropDownList lstAssetSubCategoryItem = (DropDownList)(item.FindControl("lstAssetSubCategory") as DropDownList);
                DropDownList lstMeasurementTypeItem = (DropDownList)(item.FindControl("lstMeasurementType") as DropDownList);
                DropDownList lstAssetStatusItem = (DropDownList)(item.FindControl("lstAssetStatus") as DropDownList);

                txtItemDescription.Enabled = false;
                lstACassetItem.Enabled = false;
                lstACcIDMSSubComponentType.Enabled = false;
                lstAssetType.Enabled = false;
                lstUOMItem.Enabled = false;
                txtQtyItem.Enabled = false;
                txtRateItem.Enabled = false;
                txtACassetDescriptionItem.Enabled = false;
                lstAssetSubCategoryItem.Enabled = false;
                lstAssetCategoryItem.Enabled = false;
                lstMeasurementTypeItem.Enabled = false;
                lstAssetStatusItem.Enabled = false;
            }

            foreach (GridDataItem item in gridClassification.SelectedItems)
            {
                DropDownList lstACassetItem = (DropDownList)(item.FindControl("lstACassetItem") as DropDownList);
                DropDownList lstACcIDMSSubComponentType = (DropDownList)(item.FindControl("lstACcIDMSSubComponentType") as DropDownList);
                DropDownList lstAssetType = (DropDownList)(item.FindControl("lstAssetType") as DropDownList);

                DropDownList lstUOMItem = (DropDownList)(item.FindControl("lstUOM") as DropDownList);
                TextBox txtQtyItem = (TextBox)(item.FindControl("txtQuantityOrder") as TextBox);
                TextBox txtRateItem = (TextBox)(item.FindControl("txtACrate") as TextBox);
                TextBox txtACassetDescriptionItem = (TextBox)(item.FindControl("txtACassetDescription") as TextBox);
                TextBox txtItemDescription = (TextBox)(item.FindControl("txtItemDescription") as TextBox);

                DropDownList lstAssetCategoryItem = (DropDownList)(item.FindControl("lstAssetCategory") as DropDownList);
                DropDownList lstAssetSubCategoryItem = (DropDownList)(item.FindControl("lstAssetSubCategory") as DropDownList);
                DropDownList lstMeasurementTypeItem = (DropDownList)(item.FindControl("lstMeasurementType") as DropDownList);
                DropDownList lstAssetStatusItem = (DropDownList)(item.FindControl("lstAssetStatus") as DropDownList);

                txtItemDescription.Enabled = true;
                lstACassetItem.Enabled = true;
                lstACcIDMSSubComponentType.Enabled = true;
                lstAssetType.Enabled = true;
                lstUOMItem.Enabled = true;
                txtQtyItem.Enabled = true;
                txtRateItem.Enabled = true;
                txtACassetDescriptionItem.Enabled = true;
                lstAssetSubCategoryItem.Enabled = true;
                lstAssetSubCategoryItem.Enabled = true;
                lstMeasurementTypeItem.Enabled = true;
                lstAssetStatusItem.Enabled = true;
            }
        }
    }
}