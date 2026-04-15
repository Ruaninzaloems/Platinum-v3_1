<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"  EnableEventValidation="false"
    CodeBehind="mscoa.aspx.cs" Inherits="FMSWebApp.Assets.Configuration.mscoa" %>


<%@ Register Assembly="Telerik.Web.UI" Namespace="Telerik.Web.UI" TagPrefix="telerik" %>

<asp:Content ID="contentHeader" ContentPlaceHolderID="HeadContent" runat="server">
    <script type="text/javascript">

        document.onload=HidePopDiv();

        function HidePopDiv()
        {
            var theOtherDiv = document.getElementById('<%=divPopup.ClientID %>');
            theOtherDiv.style.display = 'none';
            theOtherDiv = document.getElementById('<%=divPopUpload.ClientID %>');
            theOtherDiv.style.display = 'none';
        }

        function ShowUpdated(saywhat) {

            ShowAlertDialogBox(saywhat);

        }

        function ShowGridDiv(showgrid){
            var theDiv = document.getElementById('<%=divMain.ClientID %>');
            var theOtherDiv = document.getElementById('<%=divPopup.ClientID %>');
            if (showgrid)
            {
                theDiv.style.display = 'block';
                theOtherDiv.style.display = 'none';
            }
            else
            {
                theDiv.style.display = 'none';
                theOtherDiv.style.display = 'block';
            }
        }

        function ShowUploadDiv(showgrid){
            var theDiv = document.getElementById('<%=divPopUpload.ClientID %>');
            var theOtherDiv = document.getElementById('<%=divMain.ClientID %>');
            if (showgrid)
            {
                theDiv.style.display = 'block';
                theOtherDiv.style.display = 'none';
            }
            else
            {
                theDiv.style.display = 'none';
                theOtherDiv.style.display = 'block';
            }
        }

        function DownloadTemplate() {
			//window.location = "../../Template/Assets/AssetMSCOAtemplate.csv";
            window.open('../../Template/Assets/AssetMSCOAtemplate.xls', '_blank');
			return false;
        }

        function DownloadTemplateGuide() {
            window.open('../../Template/Assets/AssetMSCOAguide.pdf','_blank');
			return false;
		}

        function hidecolumns() {
            var theGrid = $find('<%= gridSCOA.ClientID %>');
            var theView = theGrid.get_masterTableView();
            theView.hideColumn(5); //hide id column
            theView.hideColumn(4); //hide id column
            theView.hideColumn(3); //hide id column
            theView.hideColumn(2); //hide id column
            theView.hideColumn(1); //hide id column
            //theView.hideColumn(0); //hide id column

        }

       
        function ShowResult() {
            $('#modUploadResult').modal('show');
        }

        function ShowPopMsg() {
            $('popMessage').modal('show');
        }

    </script>
</asp:Content>

<asp:Content ID="contentMain" ContentPlaceHolderID="MainContent" runat="server">

    <script type="text/javascript" src="../../Bootstrap/bootstrap-3.3.5-dist/js/bootstrap.min.js"></script>
	<link href="../../Bootstrap/bootstrap-3.3.5-dist/css/custom-bootstrap-modal.css" rel="stylesheet" />
   
    <div runat="server" id="divMain" class="contentHolder">
        

        <div id="heading" class="row last">
			<h5>
				<asp:Label ID="lblHeader1" runat="server" Text="Asset SCOA Settings"></asp:Label>
				<label id="lblHeader" runat="server">
				</label>
			</h5>
			<hr />
            <br />
		</div>

        <div class="twelvecol last" style="display: none" id="divMessage" runat="server">
			<label id="lblMessage" runat="server" class="note">
			</label>
		</div>
        <div class="twelvecol last">
            <asp:Label runat="server" Text="Select Financial Year"></asp:Label>
            <p><br /></p>
            <asp:DropDownList style="margin:0px" runat="server" ID="lstFinYear" OnSelectedIndexChanged="lstFinYear_SelectedIndexChanged" AutoPostBack="true"></asp:DropDownList>
            <p><br /></p>
        </div>

        <div class="row" id="divChoice" runat="server">
            <div class="sixcol">
				<article>
					<h3>View/Edit</h3>
			    	<section>
                        <fieldset>
							<p>
                                <div class="row" id="divSearch" runat="server">
								    <label></label>
                                    <br />
                                    
					                <asp:Label runat="server" Text="Asset Type"></asp:Label>
                                    <p><br /></p>
                                    <asp:DropDownList style="margin:0px" runat="server" ID="lstSearchType" width="380px" OnSelectedIndexChanged="lstSearchType_SelectedIndexChanged" AutoPostBack="true"></asp:DropDownList>
                                        <p><br /></p>
					                <asp:Label runat="server" Text="Asset Category"></asp:Label>
                                    <p><br /></p>
                                    <asp:DropDownList style="margin:0px" runat="server" ID="lstSearchCategory" width="380px" OnSelectedIndexChanged="lstSearchCategory_SelectedIndexChanged" AutoPostBack="true"></asp:DropDownList>
                                        <p><br /></p>
                                    <asp:Label runat="server" Text="Asset Sub Category"></asp:Label>
                                    <p><br /></p>
                                    <asp:DropDownList style="margin:0px" runat="server" ID="lstSearchSubCategory" width="380px"></asp:DropDownList>
                                    <p><br /></p>
                                    <asp:Button runat="server" ID="btnSearch" Text="Search" CssClass="" OnClick="btnSearch_Click" />
                            <asp:Button runat="server" Text="Clear" ID="btnSearchClear" OnClick="btnSearchClear_Click" />
                                </div>
							</p>
                        </fieldset>
                    </section>
                    </article>
            </div>
            <div class="sixcol last">
                <article>
                    <h3>Add</h3>
                    <section>
                        <fieldset>
							<p>
                                <asp:Button runat="server" ID="btnAddNew" 
                                    CssClass="" Text="Add New" OnClick="btnAddNew_Click" />
                                    <asp:Button runat="server" ID="btnUpload"  OnClick="btnUpload_Click"
                                    CssClass="" Text="Upload SCOA Settings File" /> 
							</p>
						</fieldset>
                    </section>
                </article>
            </div>
        </div>


            <div id="divExport" runat="server" visible="false">
                <br />
			<p style="text-align: right">
				<asp:ImageButton ID="btnCSVExport" Width="20px" ToolTip="Excel" OnClick="btnCSVExport_Click"
					title="Export as excel" ImageUrl="../../img/Icons/Excel.webp" runat="server" formnovalidate=""></asp:ImageButton>
				<asp:ImageButton ID="btnPDFExport" Width="20px" ToolTip="PDF" OnClick="btnPDFExport_Click"
					title="Export as pdf" ImageUrl="../../img/Icons/Pdf.webp" runat="server"></asp:ImageButton>
				<br />

				<br />
			</p>
        </div>
    
        <div class="row" id="divGrid" runat="server">
			

            <telerik:RadGrid ID="gridSCOA" runat="server" AutoGenerateColumns="false" Width="99%" AllowPaging="True"
				CssClass="AddBorders" AllowFilteringByColumn="True" AllowSorting="True" PageSize="20"
                ExportSettings-IgnorePaging="true" VirtualItemCount="100" EnableHierarchyExpandAll="false"
                    EnableViewState="true" MasterTableView-AllowFilteringByColumn="true"
				GridLines="None" ToolTip="Select item to edit"  
                OnNeedDataSource="gridSCOA_NeedDataSource" 
                OnItemCommand="gridSCOA_ItemCommand">
                <%--OnSelectedIndexChanged="gridSCOA_SelectedIndexChanged"--%>
                <PagerStyle Mode="NextPrevAndNumeric" AlwaysVisible="true" />

                <ClientSettings EnablePostBackOnRowClick="true" EnableRowHoverStyle="true" AllowColumnsReorder="true">
                    <Resizing AllowColumnResize="true" />
                    <Selecting AllowRowSelect="true" />
                    <Scrolling AllowScroll="true" UseStaticHeaders="true" SaveScrollPosition="true" EnableVirtualScrollPaging="false"
                        ScrollHeight="315px" />
                    <ClientEvents OnGridCreated="hidecolumns" />
                </ClientSettings>

                <GroupingSettings CaseSensitive="false" />
                <ItemStyle Wrap="true" />
                <MasterTableView HierarchyLoadMode="Client" DataKeyNames="AssetConfig_mSCOA_ID" ClientDataKeyNames="AssetConfig_mSCOA_ID"
                    CommandItemDisplay="None" NoMasterRecordsText="No records found">

                    <Columns>
                        <telerik:GridBoundColumn DataField="AssetConfig_mSCOA_ID" HeaderText="mSCOA ID" UniqueName="AssetConfig_mSCOA_ID" visible="true"   HeaderStyle-Width="160px">
						</telerik:GridBoundColumn>

					    <telerik:GridBoundColumn DataField="TypeID" HeaderText="TypeID" UniqueName="TypeID"  HeaderStyle-Width="20px">
					    </telerik:GridBoundColumn>
						
						<telerik:GridBoundColumn  DataField="CategoryID" HeaderText="CategoryID" UniqueName="CategoryID"  HeaderStyle-Width="20px">
						</telerik:GridBoundColumn>

						<telerik:GridBoundColumn  DataField="SubCategoryID" HeaderText="SubCategoryID" UniqueName="SubCategoryID"  HeaderStyle-Width="20px">
						</telerik:GridBoundColumn>

                        <telerik:GridBoundColumn DataField="MeasurementTypeID" HeaderText="MeasurementTypeID" UniqueName="MeasurementTypeID" visible="true"  HeaderStyle-Width="20px">
						</telerik:GridBoundColumn>

                        <telerik:GridBoundColumn DataField="StatusID" HeaderText="StatusID" UniqueName="StatusID" visible="true"  HeaderStyle-Width="20px">
						</telerik:GridBoundColumn>

                            <telerik:GridBoundColumn DataField="Const_AssetType_Sys_AssetTypeDesc" HeaderText="Type" UniqueName="AssetTypeDesc"  HeaderStyle-Width="150px">
					    </telerik:GridBoundColumn>
						
						<telerik:GridBoundColumn  DataField="Const_AssetCategory_sys_AssetCategoryDesc" HeaderText="Category" UniqueName="AssetCategoryDesc"  HeaderStyle-Width="150px">
						</telerik:GridBoundColumn>

                        <telerik:GridBoundColumn  DataField="Const_Asset_SubCategory_Asset_SubCategoryDescription" HeaderText="Sub Category" UniqueName="Const_Asset_SubCategory_Asset_SubCategoryDescription"  HeaderStyle-Width="150px">
						</telerik:GridBoundColumn>

                        <telerik:GridBoundColumn DataField="AssetConfig_MeasurementType_Name" HeaderText="Measurement Type" UniqueName="MeasurementTypeName" visible="true"  HeaderStyle-Width="150px">
						</telerik:GridBoundColumn>

					    <telerik:GridBoundColumn DataField="Const_AssetStatus_Sys_AssetStatusDesc" HeaderText="Status" UniqueName="AssetStatusDesc" >
					    </telerik:GridBoundColumn>

                    </Columns>
                </MasterTableView>
            </telerik:RadGrid>

		</div>

    </div>
    
    <div runat="server" id="divPopup">
        <div class="row last">
			<h5>
				<asp:Label ID="lblAddEdit" runat="server" Text="mSCOA Settings - Edit"></asp:Label>
				<label id="Label2" runat="server">
				</label>
			</h5>
		</div>
        <hr/>
        <p><br /></p>
        <div>
            <div class="twelvecol last">
            <asp:Label runat="server" Text="Financial Year"></asp:Label>
            <asp:Label runat="server" ID="lblFinYear"></asp:Label>
            </div>
            <p><br /></p>

            <telerik:RadAjaxManager ID="RadAjaxManager1" runat="server">
                <AjaxSettings>
                    <telerik:AjaxSetting AjaxControlID="radpanel1">
                        <UpdatedControls>
                            <telerik:AjaxUpdatedControl ControlID="radpanel1" LoadingPanelID="RadAjaxLoadingPanel1"></telerik:AjaxUpdatedControl>
                        </UpdatedControls>
                    </telerik:AjaxSetting>
                    <%--<telerik:AjaxSetting AjaxControlID="btnCancelPage">
                        <UpdatedControls>
                            <telerik:AjaxUpdatedControl ControlID="divMain" />
                            <telerik:AjaxUpdatedControl ControlID="divPopup" />
                        </UpdatedControls>
                    </telerik:AjaxSetting>--%>
                </AjaxSettings>
            </telerik:RadAjaxManager>

                <telerik:RadAjaxLoadingPanel ID="RadAjaxLoadingPanel1" runat="server" Transparency="0" Skin="Default" Modal="true">
                </telerik:RadAjaxLoadingPanel>             
                <telerik:RadAjaxPanel runat="server" ID="radpanel1">
                <%--<asp:UpdatePanel runat="server" ID="popupUpdatePanel1" UpdateMode="Conditional">--%>
                <%--<ContentTemplate>--%>

                    <telerik:RadWizard ID="wzMscoa" runat="server" RenderMode="Lightweight" DisplayProgressBar="false" Width="100%"
                                    OnActiveStepChanged="wzMscoa_ActiveStepChanged" DisplayNavigationButtons="False">

                                    <WizardSteps>

                                        <telerik:RadWizardStep ID="wzsAssetDetails" runat="server" StepType="Start" Title="Asset Details">

                                                <table width="100%" style="padding: 10px; border-collapse:collapse;">
                                                            <tr>
                                                                <td style="height: 42px;"><asp:Label runat="server" Text="Asset Type"></asp:Label></td>
                                                                <td style="height: 42px;"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditAssetType" OnSelectedIndexChanged="lstEditAssetType_SelectedIndexChanged" AutoPostBack="true"></asp:DropDownList></td>
                                                                <td style="height: 42px;"><asp:Label runat="server" Text="Asset Category"></asp:Label></td>
                                                                <td style="height: 42px;"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditCategory" OnSelectedIndexChanged="lstEditCategory_SelectedIndexChanged" AutoPostBack="true"></asp:DropDownList></td>
                                                                <td style="height: 42px;"><asp:Label runat="server" Text="Asset Sub Category"></asp:Label></td>
                                                                <td style="height: 42px;"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditSubCategory" OnSelectedIndexChanged="lstEditSubCategory_SelectedIndexChanged" AutoPostBack="true"></asp:DropDownList></td>
                                                            </tr>
                                                            <caption>
                                                                <p>
                                                                    <br />
                                                                </p>
                                                            </caption>
                                                            </tr>
                                                            <tr>
                                                                <td style="height: 42px;"><asp:Label runat="server" Text="Measurement Type"></asp:Label></td>
                                                                <td style="height: 42px;"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditMeasurementType" OnSelectedIndexChanged="lstEditMeasurementType_SelectedIndexChanged" AutoPostBack="true"></asp:DropDownList></td>
                                                                <td style="height: 42px;" colspan="4"></td>

                                                            </tr>
                                                            <tr>
                                                                <td style="height: 42px;"><asp:Label runat="server" Text="Asset Status"></asp:Label></td>
                                                                <td style="height: 42px;"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditStatus" OnSelectedIndexChanged="lstEditStatus_SelectedIndexChanged" AutoPostBack="true"></asp:DropDownList></td>
                                                                <td style="height: 42px;" colspan="4"></td>
                                                            </tr>
                                                            <tr>
                                                                    <td colspan="3">
                                                        
                                                                        <asp:Button ID="btnNext" runat="server" OnClick="btnNext_Click" Text="Add" />
                                                        
                                                                    </td>
                                                                <td colspan="3"> &nbsp;</td>
                                                            </tr>
                                                        </table>

                                        </telerik:RadWizardStep>

                                        <telerik:RadWizardStep ID="wzsTransactionType" runat="server" StepType="Step" Title="Transaction Type">
                                            <table width="100%" style="border-collapse:collapse;">
                                                    <tr>
                                                        <td style="height: 50px"><asp:Label runat="server" Text="Asset Type" Font-Bold="True"></asp:Label></td>
                                                        <td><asp:TextBox ID="lblEditAssetType" runat="server" Width="92%" Enabled="false"></asp:TextBox></td>
                                                        <td><asp:Label runat="server" Text="Asset Category" Font-Bold="True"></asp:Label></td>
                                                        <td><asp:TextBox runat="server" ID="lblEditCategory" Width="92%" Enabled="false"></asp:TextBox></td>
                                                        <td><asp:Label runat="server" Text="Asset Sub Category" Font-Bold="True"></asp:Label></td>
                                                        <td><asp:TextBox runat="server" ID="lblEditSubCategory" Width="92%" Enabled="false"></asp:TextBox></td>
                                                    </tr>
                                                    <tr>
                                                        <td style="height: 50px"><asp:Label runat="server" Text="Measurement Type" Font-Bold="True"></asp:Label></td>
                                                        <td><asp:TextBox runat="server" ID="lblEditMeasurementType" Width="92%" Enabled="false"></asp:TextBox></td>
                                    
                                                        <td><asp:Label runat="server" Text="Asset Status" Font-Bold="True"></asp:Label></td>
                                                        <td><asp:TextBox runat="server" ID="lblEditStatus" Width="92%" Enabled="false"></asp:TextBox></td>
                                                        <td colspan="2"></td>
                                                    </tr>
                                                </table>
                            
                                        </telerik:RadWizardStep>

                                    </WizardSteps>
                            </telerik:RadWizard>

                    <div id="Div_New" runat="server" visible="false" > 
                 
                        <telerik:RadWizard ID="rwzTransactionList" runat="server"  DisplayProgressBar="false" Width="100%"
                                        RenderMode="Lightweight" OnActiveStepChanged="rwzTransactionList_ActiveStepChanged" DisplayNavigationButtons="False">

                            <WizardSteps>

                                <telerik:RadWizardStep ID="rwzDepreciation" runat="server" StepType="Step" Title="Depreciation">
                                </telerik:RadWizardStep>
                                <telerik:RadWizardStep ID="rwzImpairment" runat="server" StepType="Step" Title="Impairment">
                                </telerik:RadWizardStep>
                                <telerik:RadWizardStep ID="rwzReversal" runat="server" StepType="Step" Title="Impairment Reversal">
                                </telerik:RadWizardStep>
                                <telerik:RadWizardStep ID="rwzFair" runat="server" StepType="Step" Title="Fair Value">
                                </telerik:RadWizardStep>
                                <telerik:RadWizardStep ID="rwzRevaluation" runat="server" StepType="Step" Title="Revaluation">
                                </telerik:RadWizardStep>
                                <telerik:RadWizardStep ID="rwzDisposal" runat="server" StepType="Step" Title="Disposal">
                                </telerik:RadWizardStep>
                                <telerik:RadWizardStep ID="rwzUnbundling" runat="server" StepType="Step" Title="Asset Unbundling">
                                </telerik:RadWizardStep>

                            </WizardSteps>
                        </telerik:RadWizard> 
                
                        <div id="Div0" runat="server" visible="true" >
                            <telerik:RadMultiPage runat="server" ID="pageTransactions"  SelectedIndex="0" CssClass="outerMultiPage">
                               
                                <telerik:RadPageView runat="server" ID="innerpageViewTransactionType">
                                               
                                    <table width="100%" >
                                        <tr>
                                            <td colspan="2"><asp:Label runat="server" ID="txtSubtype1" Text="Loss on Disposal" Font-Bold="true"></asp:Label></td>
                                            <td><asp:Label runat="server" ID="txtSubtype2" Text="Gain on Disposal" Font-Bold="true"></asp:Label></td>
                                        </tr>
                                        <tr>
                                            <td colspan="2"><asp:Label runat="server" ID="txtDebitDisplayName11" Text="Debit Cash" style="text-align:left"></asp:Label></td>
                                            <td><asp:Label runat="server" ID="txtDebitDisplayName21" Text="Debit Cash (Bank)" ></asp:Label></td>
                                        </tr>
                                        <tr>
                                            <td colspan="2"><asp:Label runat="server" ID="txtDebitDisplayName12" Text="Debit Loss on Disposal" ></asp:Label></td>
                                            <td><asp:Label runat="server" ID="txtDebitDisplayName22" Text="Debit Depreciation"></asp:Label></td>
                                        </tr>
                                        <tr>
                                            <td colspan="2"><asp:Label runat="server" ID="txtDebitDisplayName13" Text="Debit Depreciation"></asp:Label></td>
                                            <td><asp:Label runat="server" ID="txtDebitDisplayName23" Text="Debit Impairment"></asp:Label></td>
                                        </tr>
                                        <tr>
                                            <td colspan="2"><asp:Label runat="server" ID="txtDebitDisplayName14" Text="Debit Impairment"></asp:Label></td>
                                            <td><asp:Label runat="server" ID="txtCreditDisplayName21" Text="Credit Gain Disposal"></asp:Label></td>
                                        </tr>
                                        <tr>
                                            <td colspan="2"><asp:Label runat="server" ID="txtCreditDisplayName11" Text="Credit Asset Account" style="text-align:left"></asp:Label></td>
                                            <td><asp:Label runat="server" ID="txtCreditDisplayName22" Text="Credit Asset Disposal"></asp:Label></td>
                                        </tr>
                                        <tr>
                                            <td colspan="2" style="width:50%">
                                                <div runat="server" id="divEditProjectLeft1">
                                                    <table width="100%">
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" Text="PROJECT" id="lblEditProject11"></asp:Label></td>
                                                                    
                                                            <td style=" width:75%"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditProject11" OnSelectedIndexChanged="lstEditProject11_SelectedIndexChanged" AutoPostBack="true" Width="80%"></asp:DropDownList></td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width:25%"><asp:Label runat="server" ID="lEditSCOAItemCode11" Text="SCOA Item Code"></asp:Label></td>

                                                            <td style="width:75%"><asp:TextBox Enabled="false"   runat="server" ID="lblEditSCOAItemCode11"  Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" Text="Debit SCOA Item" ID="lblEditDebitItem11_1"></asp:Label></td>
                                                                    
                                                            <td style=" width:75%"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditDebitItem11_1" AutoPostBack="true" OnSelectedIndexChanged="lstEditDebitItem11_1_SelectedIndexChanged" Width="80%"></asp:DropDownList></td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width:25%"><asp:Label runat="server" ID="lEditProjectSCOAFund11" Text="SCOA Fund"></asp:Label></td>
                                                                   
                                                            <td style="width:75%"><asp:TextBox Enabled="false"  runat="server" ID="lblEditProjectSCOAFund11" Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width:25%"><asp:Label runat="server" ID="lEditProjectSCOAFunction11" Text="SCOA Function"></asp:Label></td>
                                                                   
                                                            <td style="width:75%"><asp:TextBox Enabled="false"   runat="server" ID="lblEditProjectSCOAFunction11"  Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width:25%"><asp:Label runat="server" ID="lEditProjectSCOACost11" Text="SCOA Cost"></asp:Label></td>
                                                                   
                                                            <td style="width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOACost11"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width:25%"><asp:Label runat="server" ID="lEditProjectSCOARegion11" Text="SCOA Region"></asp:Label></td>
                                                                   
                                                            <td style="width:75%"><asp:TextBox Enabled="false"  runat="server" ID="lblEditProjectSCOARegion11"  Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOAProject11" Text="SCOA Project"></asp:Label></td>
                                                                   
                                                            <td style="width:75%"><asp:TextBox Enabled="false" runat="server" ID="lblEditProjectSCOAProject11"  Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectMunicipalClasification11" Text="Municipal Classification" Font-Bold="False"></asp:Label></td>
                                                                   
                                                            <td style="width:75%"><asp:TextBox Enabled="false" runat="server" ID="lblEditProjectMunicipalClasification11"  Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="2"><hr /></td>
                                                        </tr>
                                                    </table>
                                                </div>
                                            </td>
                                                <td colspan="2" style="width:50%">
                                                <div runat="server" id="divEditProjectRight1">
                                                    <table width="100%">
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" Text="PROJECT" ID="lblEditProject21"></asp:Label></td>                                                                    
                                                            <td style=" width:75%"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditProject21" OnSelectedIndexChanged="lstEditProject21_SelectedIndexChanged" AutoPostBack="true" Width="80%"></asp:DropDownList></td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width:25%"><asp:Label runat="server" ID="lEditSCOAItemCode21" Text="SCOA Item Code"></asp:Label></td>

                                                            <td style="width:75%"><asp:TextBox Enabled="false"   runat="server" ID="lblEditSCOAItemCode21"  Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                            <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" Text="Debit SCOA Item" ID="lblEditDebitItem21_1"></asp:Label></td>                                                                    
                                                                <td style=" width:75%"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditDebitItem21_1" AutoPostBack="true" OnSelectedIndexChanged="lstEditDebitItem21_1_SelectedIndexChanged" Width="80%"></asp:DropDownList></td>
                                                        </tr>
                                                            <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOAFund21" Text="SCOA Fund"></asp:Label></td>
                                                                    
                                                                <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOAFund21"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOAFunction21" Text="SCOA Function"></asp:Label></td>
                                                                   
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOAFunction21"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOACost21" Text="SCOA Cost"></asp:Label></td>
                                                                   
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOACost21"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOARegion21" Text="SCOA Region"></asp:Label></td>
                                                                   
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOARegion21"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOAProject21" Text="SCOA Project"></asp:Label></td>
                                                                    
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOAProject21"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectMunicipalClasification21" Text="Municipal Classification"></asp:Label></td>
                                                                   
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectMunicipalClasification21"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="2"><hr /></td>
                                                        </tr>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                              










                                        <tr>
                                            <td colspan="2">
                                                <div runat="server" id="divEditProjectLeft1point5">
                                                    <table width="100%">
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" Text="PROJECT" ID="lblEditProject15"></asp:Label></td>
                                                            <td style=" width:75%"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditProject15" OnSelectedIndexChanged="lstEditProject15_SelectedIndexChanged" AutoPostBack="true" Width="80%"></asp:DropDownList></td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width:25%"><asp:Label runat="server" ID="lEditSCOAItemCode15" Text="SCOA Item Code"></asp:Label></td>

                                                            <td style="width:75%"><asp:TextBox Enabled="false"   runat="server" ID="lblEditSCOAItemCode15"  Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%">
                                                                <asp:Label ID="lblEditDebitItem11_2" runat="server" Text="Debit SCOA Item"></asp:Label>
                                                            </td>
                                                            <td style=" width:75%">
                                                                <asp:DropDownList ID="lstEditDebitItem11_2" runat="server" style="margin:0px" Width="80%" OnSelectedIndexChanged="lstEditDebitItem11_2_SelectedIndexChanged" AutoPostBack="True">
                                                                </asp:DropDownList>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label9" Text="SCOA Fund"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false"  runat="server" ID="lblEditProjectSCOAFund15" Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label11" Text="SCOA Function"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false"  runat="server" ID="lblEditProjectSCOAFunction15" Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label13" Text="SCOA Cost"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false"  runat="server" ID="lblEditProjectSCOACost15" Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label15" Text="SCOA Region"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false"  runat="server" ID="lblEditProjectSCOARegion15" Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label17" Text="SCOA Project"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false"  runat="server" ID="lblEditProjectSCOAProject15" Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label18" Text="Municipal Classification"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false"  runat="server" ID="lblEditProjectMunicipalClasification15" Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="2"><hr /></td>
                                                        </tr>
                                                    </table>
                                                </div>
                                            </td>
                                            <td>
                                                <div runat="server" id="divEditProjectRight1point5">
                                                    <table width="100%">
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" Text="PROJECT" ID="lblEditProject25"></asp:Label></td>
                                                            <td style=" width:75%"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditProject25" OnSelectedIndexChanged="lstEditProject25_SelectedIndexChanged" AutoPostBack="true" Width="80%"></asp:DropDownList></td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width:25%"><asp:Label runat="server" ID="lEditSCOAItemCode25" Text="SCOA Item Code"></asp:Label></td>

                                                            <td style="width:75%"><asp:TextBox Enabled="false"   runat="server" ID="lblEditSCOAItemCode25"  Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%">
                                                                <asp:Label ID="lblEditDebitItem21_2" runat="server" Text="Debit SCOA Item"></asp:Label>
                                                            </td>
                                                            <td style=" width:75%">
                                                                <asp:DropDownList ID="lstEditDebitItem21_2" runat="server" style="margin:0px" Width="80%" OnSelectedIndexChanged="lstEditDebitItem21_2_SelectedIndexChanged" AutoPostBack="True">
                                                                </asp:DropDownList>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label23" Text="SCOA Fund"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOAFund25"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label25" Text="SCOA Function"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOAFunction25"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label27" Text = "SCOA Cost"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOACost25"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label29" Text="SCOA Region"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOARegion25"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label31" Text="SCOA Project"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOAProject25"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label32" Text="Municipal Classification"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectMunicipalClasification25"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="2"><hr /></td>
                                                        </tr>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>












                                        <tr>

                                            <td colspan="2">
                                                <div runat="server" id="divEditProjectLeft2">
                                                    <table width="100%">
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" Text="PROJECT" ID="lblEditProject12"></asp:Label></td>
                                                            <td style=" width:75%"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditProject12" OnSelectedIndexChanged="lstEditProject12_SelectedIndexChanged" AutoPostBack="true" Width="80%"></asp:DropDownList></td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width:25%"><asp:Label runat="server" ID="lEditSCOAItemCode12" Text="SCOA Item Code"></asp:Label></td>

                                                            <td style="width:75%"><asp:TextBox Enabled="false"   runat="server" ID="lblEditSCOAItemCode12"  Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" Text="Debit SCOA Item" ID="lblEditDebitItem12_1"></asp:Label><asp:Label runat="server" Text="Credit SCOA Item" ID="lblEditCreditItem12_1"></asp:Label></td>
                                                            <td style=" width:75%"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditDebitItem12_1" AutoPostBack="true" OnSelectedIndexChanged="lstEditDebitItem12_1_SelectedIndexChanged" Width="80%"></asp:DropDownList>
                                                                <asp:DropDownList style="margin:0px" runat="server" ID="lstEditCreditItem12_1" AutoPostBack="true" OnSelectedIndexChanged="lstEditCreditItem12_1_SelectedIndexChanged" Width="80%"></asp:DropDownList></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOAFund12" Text="SCOA Fund"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false"  runat="server" ID="lblEditProjectSCOAFund12" Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOAFunction12" Text="SCOA Function"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false"  runat="server" ID="lblEditProjectSCOAFunction12" Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOACost12" Text="SCOA Cost"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false"  runat="server" ID="lblEditProjectSCOACost12" Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOARegion12" Text="SCOA Region"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false"  runat="server" ID="lblEditProjectSCOARegion12" Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOAProject12" Text="SCOA Project"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false"  runat="server" ID="lblEditProjectSCOAProject12" Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectMunicipalClasification12" Text="Municipal Classification"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false"  runat="server" ID="lblEditProjectMunicipalClasification12" Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="2"><hr /></td>
                                                        </tr>
                                                    </table>
                                                </div>
                                            </td>
                                            <td>
                                                <div runat="server" id="divEditProjectRight2">
                                                    <table width="100%">
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" Text="PROJECT" ID="lblEditProject22"></asp:Label></td>
                                                            <td style=" width:75%"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditProject22" OnSelectedIndexChanged="lstEditProject22_SelectedIndexChanged" AutoPostBack="true" Width="80%"></asp:DropDownList></td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width:25%"><asp:Label runat="server" ID="lEditSCOAItemCode22" Text="SCOA Item Code"></asp:Label></td>

                                                            <td style="width:75%"><asp:TextBox Enabled="false"   runat="server" ID="lblEditSCOAItemCode22"  Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" Text="Debit SCOA Item" ID="lblEditDebitItem22_1"></asp:Label></td>
                                                            <td style=" width:75%"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditDebitItem22_1" AutoPostBack="true" OnSelectedIndexChanged="lstEditDebitItem22_1_SelectedIndexChanged" Width="80%"></asp:DropDownList></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOAFund22" Text="SCOA Fund"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOAFund22"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOAFunction22" Text="SCOA Function"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOAFunction22"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOACost22" Text = "SCOA Cost"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOACost22"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOARegion22" Text="SCOA Region"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOARegion22"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOAProject22" Text="SCOA Project"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOAProject22"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectMunicipalClasification22" Text="Municipal Classification"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectMunicipalClasification22"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="2"><hr /></td>
                                                        </tr>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                                
                                        <tr>
                                            <td colspan="2">
                                                <div runat="server" id="divEditProjectLeft3">
                                                    <table width="100%">
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" Text="PROJECT" ID="lblEditProject13"></asp:Label></td>
                                                            <td style=" width:75%"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditProject13" OnSelectedIndexChanged="lstEditProject13_SelectedIndexChanged" AutoPostBack="true" Width="80%"></asp:DropDownList></td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width:25%"><asp:Label runat="server" ID="lEditSCOAItemCode13" Text="SCOA Item Code"></asp:Label></td>

                                                            <td style="width:75%"><asp:TextBox Enabled="false"   runat="server" ID="lblEditSCOAItemCode13"  Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" Text="Debit SCOA Item" ID="lblEditCreditItem13_1"></asp:Label></td>
                                                            <td style=" width:75%"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditCreditItem13_1" AutoPostBack="true" OnSelectedIndexChanged="lstEditCreditItem13_1_SelectedIndexChanged" Width="80%"></asp:DropDownList></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOAFund13" Text="SCOA Fund"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" runat="server" ID="lblEditProjectSCOAFund13" Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOAFunction13" Text="SCOA Function"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" runat="server" ID="lblEditProjectSCOAFunction13" Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOACost13" Text="SCOA Cost"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" runat="server" ID="lblEditProjectSCOACost13" Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOARegion13" Text="SCOA Region"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" runat="server" ID="lblEditProjectSCOARegion13" Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOAProject13" Text="SCOA Project"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" runat="server" ID="lblEditProjectSCOAProject13" Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectMunicipalClasification13" Text="Municipal Classification"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectMunicipalClasification13" ></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="2"><hr /></td>
                                                        </tr>
                                                    </table>
                                                </div>
                                            </td>
                                            <td>
                                                <div runat="server" id="divEditProjectRight3">
                                                    <table width="100%">
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" Text="PROJECT" ID="lblEditProject23"></asp:Label></td>
                                                            <td style=" width:75%"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditProject23" OnSelectedIndexChanged="lstEditProject23_SelectedIndexChanged" AutoPostBack="true" Width="80%"></asp:DropDownList></td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width:25%"><asp:Label runat="server" ID="lEditSCOAItemCode23" Text="SCOA Item Code"></asp:Label></td>

                                                            <td style="width:75%"><asp:TextBox Enabled="false"   runat="server" ID="lblEditSCOAItemCode23"  Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" Text="Credit SCOA Item" ID="lblEditCreditItem23_1"></asp:Label></td>
                                                            <td style=" width:75%"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditCreditItem23_1" AutoPostBack="true" OnSelectedIndexChanged="lstEditCreditItem23_1_SelectedIndexChanged" Width="80%"></asp:DropDownList></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOAFund23" Text="SCOA Fund"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOAFund23"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOAFunction23" Text="SCOA Function"></asp:Label></td>
                                                            <td style=" width:25%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOAFunction23"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOACost23" Text="SCOA Cost"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOACost23"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOARegion23" Text="SCOA Region"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOARegion23"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectSCOAProject23" Text="SCOA Project"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOAProject23"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="lEditProjectMunicipalClasification23" Text="Municipal Classification"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectMunicipalClasification23"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="2"><hr /></td>
                                                        </tr>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr> 
                                               
                                        <tr>
                                            <td colspan="2">
                                                <div runat="server" id="divEditProjectLeft4">
                                                    <table width="100%">
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" Text="PROJECT" ID="lblEditProject14"></asp:Label></td>
                                                            <td style=" width:75%"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditProject14" OnSelectedIndexChanged="lstEditProject14_SelectedIndexChanged" AutoPostBack="true" Width="80%"></asp:DropDownList></td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width:25%"><asp:Label runat="server" ID="lEditSCOAItemCode14" Text="SCOA Item Code"></asp:Label></td>

                                                            <td style="width:75%"><asp:TextBox Enabled="false"   runat="server" ID="lblEditSCOAItemCode14"  Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" Text="Credit SCOA Item" ID="lblEditCreditItem11_1"></asp:Label></td>
                                                            <td style=" width:75%">
                                                                <asp:DropDownList style="margin:0px" runat="server" ID="lstEditCreditItem11_1" AutoPostBack="true" OnSelectedIndexChanged="lstEditCreditItem11_1_SelectedIndexChanged" Width="80%">
                                                                    </asp:DropDownList>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label6" Text="SCOA Fund"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOAFund14"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label8" Text="SCOA Function"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOAFunction14"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label10" Text="SCOA Cost"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOACost14"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label12" Text="SCOA Region"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOARegion14"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label14" Text="SCOA Project"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOAProject14"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label16" Text="Municipal Classification"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectMunicipalClasification14"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="2"><hr /></td>
                                                        </tr>
                                                    </table>
                                                </div>
                                            </td>
                                            <td>
                                                <div runat="server" id="divEditProjectRigh4">
                                                    <table width="100%">
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" Text="PROJECT" ID="lblEditProject24"></asp:Label></td>
                                                            <td style=" width:75%"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditProject24" OnSelectedIndexChanged="lstEditProject24_SelectedIndexChanged" AutoPostBack="true" Width="80%"></asp:DropDownList></td>
                                                        </tr>
                                                        <tr>
                                                            <td style="width:25%"><asp:Label runat="server" ID="lEditSCOAItemCode24" Text="SCOA Item Code"></asp:Label></td>

                                                            <td style="width:75%"><asp:TextBox Enabled="false"   runat="server" ID="lblEditSCOAItemCode24"  Width="80%"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" Text="Credit SCOA Item" ID="lblEditCreditItem21_1"></asp:Label></td>
                                                            <td style=" width:75%"><asp:DropDownList style="margin:0px" runat="server" ID="lstEditCreditItem21_1" AutoPostBack="true" OnSelectedIndexChanged="lstEditCreditItem21_1_SelectedIndexChanged" Width="80%"></asp:DropDownList></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label20" Text="SCOA Fund"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOAFund24"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label22" Text="SCOA Function"></asp:Label></td>
                                                            <td style=" width:25%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOAFunction24"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label24" Text="SCOA Cost"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOACost24"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label26" Text="SCOA Region"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOARegion24"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label28" Text="SCOA Project"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectSCOAProject24"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td style=" width:25%"><asp:Label runat="server" ID="Label30" Text="Municipal Classification"></asp:Label></td>
                                                            <td style=" width:75%"><asp:TextBox Enabled="false" Width="80%" runat="server" ID="lblEditProjectMunicipalClasification24"></asp:TextBox></td>
                                                        </tr>
                                                        <tr>
                                                            <td colspan="2"><hr /></td>
                                                        </tr>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr> 
                                <tr>
                                    <td style="text-align:center" >
                                            <asp:Button ID="btnSavePage"   runat ="server" Text="Submit"  CssClass="btn btn-default " Width="50px" OnClick="btnSavePage_Click"></asp:Button>
                                    <td style="text-align:center" >
                                            <asp:Button ID="btnCancelPage" runat="server" Text="Cancel" class="btn btn-default " width="50px" OnClick="btnCancelPage_Click"></asp:Button>
				                    </td>
                                    </td>
                                    <td></td>
                                </tr>

                                    </table>

                                </telerik:RadPageView>
                            </telerik:RadMultiPage> 
                        </div>                 
                                 
                    </div>

                <%--</ContentTemplate>
                <Triggers>
                           
                    <asp:PostBackTrigger ControlID="btnSavePage" />
                    <asp:PostBackTrigger ControlID="btnCancelPage" />


                </Triggers>--%>

            </telerik:RadAjaxPanel>

            <asp:Button runat="server" ID="btnEditLoad" OnClick="btnEditLoad_Click"/>
            <hr />
            <br />
            <asp:HiddenField runat="server" ID="hdnEditID" />

        </div>
    </div>

        
        <!-- Modal -->
	<!-- Popup for downloading file  -->
    <div runat="server" id="divPopUpload">
        <div class="row last">
			<h5>
				<asp:Label ID="Label3" runat="server" Text="Bulk File Management"></asp:Label>
				<label id="Label4" runat="server">
				</label>
			</h5>
		</div>
        <hr/>
            <div class="sixcol">
            <h3>Download an empty excel file to populate mSCOA settings.</h3>
                <table width="99%" style="text-align:center">
                    <tr>
                        <td>
                            <asp:Button runat="server" id="btnGuidLine" OnClick="btnGuidLine_Click" class="" Text="Download Guidline"></asp:Button>
                             
                        </td>
                        <td>
                        <asp:button runat="server" id="btntemplate" OnClick="btntemplate_Click" class="" text="Download Template"></asp:button> 
                        </td>
                    </tr>
                </table>
        </div>
        <asp:UpdatePanel runat="server" ID="pnlUpload" UpdateMode="Conditional">
        <ContentTemplate>
        <div class="sixcol last">
            <h3>Upload Files</h3>
            Select file to Upload<br />
            <asp:RadioButton runat="server" ID="btnShowUpload" OnCheckedChanged="btnShowUpload_CheckedChanged" Text="mSCOA Setttings CSV/Excel File" AutoPostBack="true" />
            <div runat="server" id="divuploadbuttons" visible="false">
                <table width="99%" style="text-align:center">
                    <tr>
                       <%-- <td style="width:25%"><asp:FileUpload ID="FileUpload1"  runat="server" Width="85px"></asp:FileUpload></td>--%>
                        <iframe src="../Multiyear/fileupload.aspx" style="width:100%;height:54px" runat="server" id="iframeupload"></iframe>
                        <%--<td style="width:25%"><asp:Label ID="lblFileUpload" runat="server" Text="No File Chosen" Visible="true"></asp:Label></td>--%>
                    </tr>
                </table>
                <hr />
                <table width="99%" style="text-align:center">
                    <tr>
                        <td style="width:25%"></td>
                        <td style="width:50%; text-align:center" >
				            <asp:Button ID="btnUploadFile"  runat="server" Text="Upload" OnClick="btnUploadFile_Click" CssClass="btn btn-default"></asp:Button>
					        <asp:Button ID="btnUploadCancel" runat="server" Text="Cancel" CssClass="btn btn-default " OnClick="btnUploadCancel_Click"  Style="display: none"></asp:Button>
                        </td>
                        <td style="width:25%"></td>
                    </tr>
                </table>

            </div>

        </div>
        </ContentTemplate>
            <Triggers>
                <asp:PostBackTrigger ControlID="btnUploadFile" />
                <asp:PostBackTrigger ControlID="btnUploadCancel" />
            </Triggers>
        </asp:UpdatePanel>
    </div>

    <!-- Modal -->
	<!-- Popups for showing save result  -->
	<div id="modUploadResult" class="modal" role="dialog">
		<div class=" modal-dialog modal-lg">
			<div class="modal-content">
				<div class="modal-header">
					
					<h4 class ="modal-title"><button type="button" class ="close" data-dismiss="modal">&times;</button>Bulk Upload Result</h4>
				</div>
				<div class="modal-body">
					<div id="div1" runat="server" visible="true">
                        <asp:Label runat="server" ID="lblResultMsg" Text="mSCOA Settings Bulk Upload Saved Successfully."></asp:Label>
                            <br />
                        <br />
			            <p style="text-align: right">
				            <asp:ImageButton ID="btnResultCSV" Width="20px" ToolTip="Excel" OnClick="btnResultCSV_Click"
					            title="Export as excel" ImageUrl="../../img/Icons/Excel.webp" runat="server" formnovalidate=""></asp:ImageButton>
				            <asp:ImageButton ID="btnResultPDF" Width="20px" ToolTip="PDF" OnClick="btnResultPDF_Click"
					            title="Export as pdf" ImageUrl="../../img/Icons/Pdf.webp" runat="server"></asp:ImageButton>
				            <br />

				            <br />
			            </p>
                    </div>
                    
					<telerik:RadGrid ID="gridUploadResult"  runat="server" AutoGenerateColumns="true" Width="99%" AllowPaging="false"
                        CssClass="AddBorders" AllowFilteringByColumn="True" AllowSorting="True" PageSize="20"
                        ExportSettings-IgnorePaging="true" VirtualItemCount="100" EnableHierarchyExpandAll="false"
                        EnableViewState="true" MasterTableView-AllowFilteringByColumn="true"
				        GridLines="None">

					</telerik:RadGrid>

				</div>
				<div class="modal-footer">
					<asp:Button ID="btnClosePopup" runat="server" Text="OK" CssClass="btn btn-default " data-dismiss="modal"></asp:Button>
				</div>
			</div>
		</div>
	</div>

    <div id="popMessage" class="modal" role="dialog">
        <div class=" modal-dialog modal-small">
            <div class="modal-content">
				<div class="modal-header">
					
					<h4 class ="modal-title"><button type="button" class ="close" data-dismiss="modal">&times;</button>mSCOA Settings</h4>
				</div>
				<div class="modal-body">
                    <asp:Label runat="server" ID="lblpopMsg" Text=""></asp:Label>
                </div>
            </div>
            <div class="modal-footer">
				<asp:Button ID="btnpopMsgClose" runat="server" Text="OK" CssClass="btn btn-default " data-dismiss="modal" OnClientClick="return false;"></asp:Button>
			</div>
        </div>
    </div>


</asp:Content>
