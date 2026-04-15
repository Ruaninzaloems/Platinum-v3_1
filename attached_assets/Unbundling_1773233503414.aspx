<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Unbundling.aspx.cs" Inherits="FMSWebApp.Assets.Unbundling.Unbundling" %>

<%@ Register Assembly="Telerik.Web.UI" Namespace="Telerik.Web.UI" TagPrefix="telerik" %>


<asp:Content ID="Content1" ContentPlaceHolderID="Script" runat="server">
    <script type="text/javascript">

        function ValidateUploads() {

            debugger;
            var retval = false;

            var uploadfile = document.getElementById('<%= uploadCertificate.ClientID %>');
            var msg = "";
            var myfile = uploadfile.value;
            if (myfile == "")
                msg = "Upload mandatory documents.";
            else if (myfile.indexOf(".pdf") <= 0) {
                msg = "Upload files are not in the correct file format.";
            }
            else {
                uploadfile = document.getElementById('<%= uploadBill.ClientID %>');
                myfile = uploadfile.value;
                if (myfile == "")
                    msg = "Upload mandatory documents.";
                else if (myfile.indexOf(".pdf") <= 0) {
                    msg = "Upload files are not in the correct file format.";
                }
                else {
                    retval = true;
                }
            }

            if (!retval) {
                $('#modUploadDocs').modal('hide');
                ShowAlertDialogBox(msg);
            }

            return retval;
        }

        function ShowUpdated(saywhat) {

            debugger;
            ShowAlertDialogBox(saywhat);

        }

        function validateAlpha(control) {

            debugger;

            var allcars = Array.from(control.val());
            var retval = "";

            foreach(a in allchars)
            {
                if (a.match(/[a-z]/i))
                    retval += a;
            }

            control.val(retval);
        }

        function validateNumeric(control) {

            debugger;

            foreach(a in allchars)
            {
                var n = /^\d+$/.test(a);
                var usedpoint = false;
                if (a == "." && !usedpoint) {
                    usedpoint = true;
                    retval += a;
                }
                else {
                    var allcars = Array.from(control.val());
                    var retval = "";
                    if (n)
                        retval += a;
                }
            }

            control.val(retval);
        }

        function ShowQuestion() {
            $("#modQuestion").modal("show");
        }

        function ShowDocuments() {
            $("#modShowDocs").modal("show");
            return false;
        }

        function openBase64InNewTab(data, mimeType, filename) {

            var byteCharacters = atob(data);
            var byteNumbers = new Array(byteCharacters.length);
            for (var i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            var file = new Blob([byteArray], { type: mimeType + ';base64' });
            var fileURL = URL.createObjectURL(file);

            //window.open(fileURL);

            var link = document.createElement("a");
            link.download = filename;
            link.href = fileURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            delete link;

        }

	</script>

</asp:Content>

<asp:Content ID="contentMain" ContentPlaceHolderID="MainContent" runat="server">
    <script type="text/javascript" src="../../Bootstrap/bootstrap-3.3.5-dist/js/bootstrap.min.js"></script>
	<link href="../../Bootstrap/bootstrap-3.3.5-dist/css/custom-bootstrap-modal.css" rel="stylesheet" />


	<div class="contentHolder">

		<div id="heading" class="row last">
			<h2>
				<asp:Label ID="lblHeading" runat="server" Text="Asset Unbundling" Font-Bold="true"></asp:Label>
			</h2>
			<hr />
		</div>

        <div class="twelvecol last" style="display: none" id="divMessage" runat="server">
			<label id="lblMessage" runat="server" class="note">
			</label>
		</div>

		<div runat="server" id="divMenu">
			 <telerik:RadWizard runat="server" ID="wizMain" 
                RenderMode="Lightweight" DisplayProgressBar="false" DisplayNavigationButtons="false" Width="100%"
                OnActiveStepChanged="wizMain_ActiveStepChanged">
                <WizardSteps>
                    <telerik:RadWizardStep runat="server" ID="stepCapitalContract" Title="Capital Contract">
                    </telerik:RadWizardStep>
                    <telerik:RadWizardStep runat="server" ID="stepAssetClasification" Title="Asset Classification" Enabled="false">
                    </telerik:RadWizardStep>
					<telerik:RadWizardStep runat="server" ID="stepCostDistribution" Title="Cost Distribution" Enabled="false">
                    </telerik:RadWizardStep>
					<telerik:RadWizardStep runat="server" ID="stepCommissioning" Title="Commissioning" Enabled="false">
                    </telerik:RadWizardStep>
					<telerik:RadWizardStep runat="server" ID="stepManageAssets" Title="Manage Assets" Enabled="true">
                    </telerik:RadWizardStep>
                </WizardSteps>
            </telerik:RadWizard>
		</div>


		<asp:Label runat="server" ID="lblCC" Text="List of Capital Projects" Font-Bold="true"></asp:Label>
		<p>&nbsp;</p>

		<div runat="server" id="divCapitalContract" visible="true">

			<div runat="server" id="divCClist">
				
				 <p style="text-align: right">
					<asp:ImageButton ID="btnCSVExportCaptial" Width="20px" ToolTip="Excel" OnClick="btnCSVExportCaptial_Click"
						title="Export as excel" ImageUrl="../../img/Icons/Excel.webp" runat="server" formnovalidate=""></asp:ImageButton>
					<asp:ImageButton ID="btnPDFExportCapital" Width="20px" ToolTip="PDF" OnClick="btnPDFExportCapital_Click" 
						title="Export as pdf" ImageUrl="../../img/Icons/Pdf.webp" runat="server"></asp:ImageButton>
					<br />

					<br />
				</p>

				<telerik:RadGrid ID="gridCaptial" runat="server" AutoGenerateColumns="False" Width="99%" AllowPaging="True"
				        CssClass="AddBorders" AllowFilteringByColumn="True" AllowSorting="True" PageSize="20"
                        ExportSettings-IgnorePaging="true" VirtualItemCount="100" EnableHierarchyExpandAll="false"
                            EnableViewState="true" MasterTableView-AllowFilteringByColumn="true"
				        GridLines="None" 
                    OnSelectedIndexChanged="gridCaptial_SelectedIndexChanged"
					 OnNeedDataSource="gridCaptial_NeedDataSource" 
					OnItemDataBound="gridCaptial_ItemCreated">
                         <PagerStyle Mode="NextPrevAndNumeric" AlwaysVisible="true" />
				
			            <ClientSettings EnablePostBackOnRowClick="true" EnableRowHoverStyle="true" AllowColumnsReorder="true">
				            <Resizing AllowColumnResize="true" />
				            <Selecting AllowRowSelect="True" />
				            <Scrolling AllowScroll="true" UseStaticHeaders="true" SaveScrollPosition="true" EnableVirtualScrollPaging="false"
					            ScrollHeight="315px" />
                            <%-- <ClientEvents OnRowSelected="rowselected" />--%>
                            <%--<ClientEvents OnRowSelected="rowselected" OnGridCreated="hidecolumns"/>--%>
			            </ClientSettings>

			            <GroupingSettings CaseSensitive="false" />
			            <ItemStyle Wrap="true" />
			            <ExportSettings ExportOnlyData="true" HideStructureColumns="false" OpenInNewWindow="true"
					            IgnorePaging="true" FileName="AssetStatuss">
					            <Pdf PageWidth="16in" PageHeight="8.27in" PageTopMargin="5.85mm" PageLeftMargin="5.85mm" />
			            <Csv ColumnDelimiter="VerticalBar" RowDelimiter="NewLine" FileExtension="csv" EncloseDataWithQuotes="false" />
			            </ExportSettings>
				
                        <MasterTableView HierarchyLoadMode="Client" DataKeyNames="ContractId" ClientDataKeyNames="ContractId"
				            CommandItemDisplay="None" NoMasterRecordsText="No records found">
				            <Columns>
                                <telerik:GridBoundColumn DataField="ContractId" HeaderText="ID" UniqueName="ContractId" HeaderStyle-Width="125px"></telerik:GridBoundColumn>
                                <telerik:GridDateTimeColumn DataField="PlannedStartDate"  FilterDateFormat="dd/MM/yyyy" HeaderText="Contract Period Start Date" UniqueName="PlannedStartDate" HeaderStyle-Width="125px" DataType="System.DateTime" DataFormatString="{0:dd-MMM-yyyy}" HtmlEncode="false" ></telerik:GridDateTimeColumn>
                                <telerik:GridDateTimeColumn DataField="PlannedEndDate"  FilterDateFormat="dd/MM/yyyy" HeaderText="Contract Period End Date" UniqueName="PlannedEndDate" HeaderStyle-Width="125px" DataType="System.DateTime" DataFormatString="{0:dd-MMM-yyyy}" HtmlEncode="false"></telerik:GridDateTimeColumn>
								<telerik:GridBoundColumn DataField="Number" HeaderText="Contract Registration No" UniqueName="Number" HeaderStyle-Width="250px"></telerik:GridBoundColumn>
                                <telerik:GridBoundColumn DataField="Description" HeaderText="Contract Description" UniqueName="Description" HeaderStyle-Width="250px"></telerik:GridBoundColumn>
                                <telerik:GridBoundColumn DataField="ContractValue" HeaderText="Awarded Contract Value" UniqueName="ContractValue"  DataType="System.Decimal" HeaderStyle-Width="125px" DataFormatString="{0:N2}" HtmlEncode="false"></telerik:GridBoundColumn>
                                <telerik:GridBoundColumn DataField="TotalExpenditureExVat" HeaderText="Actual Expenditure" UniqueName="ActualExpenditure" DataType="System.Decimal"  HeaderStyle-Width="125px" DataFormatString="{0:N2}" HtmlEncode="false"></telerik:GridBoundColumn>
								<telerik:GridCheckBoxColumn DataField="IsComplete" HeaderText="Complete Indicator" UniqueName="IsComplete" HeaderStyle-Width="125px"></telerik:GridCheckBoxColumn>
								
				            </Columns>
			            </MasterTableView>
				
		            </telerik:RadGrid>
				<p>&nbsp;</p>
			</div>

			<div runat="server" id="divCCDetail" visible="false">
				<table  style="width:99%">
					<tr>
						<td style="width:20%">Contract Registration Number</td>
						<td style="width:20%">Contract Description</td>
						<td style="width:15%">Awarded Contract Value</td>
						<td style="width:15%">Actual Expenditure</td>
						<td style="width:15%">% Completion Rate</td>
						<td style="width:15%">Project Complete</td>
					</tr>
					<tr>
						<td  style="width:20%"><asp:Label runat="server" ID="lblRegNo" Text="" /></td>
						<td  style="width:20%"><asp:Label runat="server" ID="lblDesc" Text="" /></td>
						<td  style="width:15%"><asp:Label runat="server" ID="lblValue" Text="" Font-Bold="true" /></td>
						<td  style="width:15%"><asp:Label runat="server" ID="lblExpenditure" Text="" Font-Bold="true" /></td>
						<td  style="width:15%"><asp:Label runat="server" ID="lblRate" Text="" Font-Bold="true" /></td>
						<td  style="width:15%"><asp:Label runat="server" ID="lblComplete" Text="" Font-Bold="true"/></td>
					</tr>
					
				</table>

				 <p style="text-align: right">
					<asp:ImageButton ID="btnCSVExportCapitalDetail" Width="20px" ToolTip="Excel" OnClick="btnCSVExportCapitalDetail_Click"
						title="Export as excel" ImageUrl="../../img/Icons/Excel.webp" runat="server" formnovalidate=""></asp:ImageButton>
					<asp:ImageButton ID="btnPDFExportCaptialDetail" Width="20px" ToolTip="PDF" OnClick="btnPDFExportCaptialDetail_Click" 
						title="Export as pdf" ImageUrl="../../img/Icons/Pdf.webp" runat="server"></asp:ImageButton>
					<br />

					<br />
				</p>

				<telerik:RadGrid ID="gridCaptialDetail" runat="server" AutoGenerateColumns="False" Width="99%" AllowPaging="True"
				        CssClass="AddBorders" AllowFilteringByColumn="false" AllowSorting="True" PageSize="20"
                        ExportSettings-IgnorePaging="true" VirtualItemCount="100" EnableHierarchyExpandAll="false"
                            EnableViewState="true" MasterTableView-AllowFilteringByColumn="true"
				        GridLines="None" OnItemDataBound="gridCaptialDetail_ItemDataBound" >
                        <PagerStyle Mode="NextPrevAndNumeric" AlwaysVisible="true" />
				
			            <ClientSettings EnablePostBackOnRowClick="false" EnableRowHoverStyle="true" AllowColumnsReorder="true">
				            <Resizing AllowColumnResize="true" />
				            <Selecting AllowRowSelect="True" />
				            <Scrolling AllowScroll="true" UseStaticHeaders="true" SaveScrollPosition="true" EnableVirtualScrollPaging="false"
					            ScrollHeight="400px"  />
			            </ClientSettings>

			            <GroupingSettings CaseSensitive="false" />
			            <ItemStyle Wrap="true" />
			            <ExportSettings ExportOnlyData="true" HideStructureColumns="false" OpenInNewWindow="true"
					            IgnorePaging="true" FileName="AssetStatuss">
					            <Pdf PageWidth="16in" PageHeight="8.27in" PageTopMargin="5.85mm" PageLeftMargin="5.85mm" />
			            <Csv ColumnDelimiter="VerticalBar" RowDelimiter="NewLine" FileExtension="csv" EncloseDataWithQuotes="false" />
			            </ExportSettings>
				
                        <MasterTableView HierarchyLoadMode="Client" DataKeyNames="InvoiceDetailID" ClientDataKeyNames="InvoiceDetailID"
				            CommandItemDisplay="None" NoMasterRecordsText="No records found">
				            <Columns>
                                <telerik:GridBoundColumn DataField="InvoiceDetailID" HeaderText="ID" UniqueName="InvoiceDetailID" HeaderStyle-Width="0px"></telerik:GridBoundColumn>
                                <telerik:GridBoundColumn DataField="VendorName" HeaderText="Supplier Details" UniqueName="VendorName" HeaderStyle-Width="250px"></telerik:GridBoundColumn>
								 <telerik:GridBoundColumn DataField="VendorID" HeaderText="Supplier ID" UniqueName="VendorID" HeaderStyle-Width="0px"></telerik:GridBoundColumn>
                                <telerik:GridBoundColumn DataField="InvoiceDate" HeaderText="Transaction Date" UniqueName="InvoiceDate" HeaderStyle-Width="125px" DataType="System.DateTime"  DataFormatString="{0:dd-MMM-yyyy}" HtmlEncode="false"></telerik:GridBoundColumn>
								<telerik:GridHyperLinkColumn  HeaderText="Invoice Number" UniqueName="VendorInvoiceNumberHyper" HeaderStyle-Width="125px"></telerik:GridHyperLinkColumn>
								<telerik:GridBoundColumn Visible="true" DataField="VendorInvoiceNumber" HeaderText="Invoice Number" UniqueName="VendorInvoiceNumber" HeaderStyle-Width="0px"></telerik:GridBoundColumn>
								<telerik:GridBoundColumn Visible="true" DataField="InvoiceID" HeaderText="Invoice ID" UniqueName="VendorInvoiceID" HeaderStyle-Width="0px"></telerik:GridBoundColumn>
                                <telerik:GridBoundColumn DataField="Amount" HeaderText="Invoice Amount" UniqueName="TotalAmount" HeaderStyle-Width="125px" DataType="System.Decimal" DataFormatString="{0:N2}" ></telerik:GridBoundColumn>
								<telerik:GridBoundColumn DataField="DtNumber" HeaderText="Debit/Credit Note Number" UniqueName="DebitNumber" HeaderStyle-Width="125px"></telerik:GridBoundColumn>
                                <telerik:GridBoundColumn DataField="DtAmount" HeaderText="Debit/Credit Note Amount" UniqueName="DebitAmount"  DataType="System.Decimal" HeaderStyle-Width="125px" DataFormatString="{0:N2}"></telerik:GridBoundColumn>
                                
								<telerik:GridHyperLinkColumn  HeaderText="Payment Certificate Number" UniqueName="PaymentReferenceHyper" HeaderStyle-Width="125px"></telerik:GridHyperLinkColumn>
								<telerik:GridBoundColumn DataField="PaymentReferenceID" HeaderText="Payment Certificate Number" UniqueName="PaymentReference" HeaderStyle-Width="0px"></telerik:GridBoundColumn>
				            </Columns>
			            </MasterTableView>				
		            </telerik:RadGrid>

				<p>&nbsp;</p>

				<asp:Button runat="server" ID="btnCCuploadDocuments" Text="Upload Documents" CssClass="buttonEnd" data-toggle="modal" data-target="#modUploadDocs" OnClientClick="return false;"/><span style="color: red;">*</span>

			</div>
		</div>

		<div runat="server" id="divAssetClasification" visible="false">

			<asp:Label runat="server" ID="Label1" Text="Main Asset"></asp:Label>&nbsp;<asp:TextBox runat="server" ID="txtMainAsset"></asp:TextBox><span style="color: red;">*</span>

			<asp:HiddenField ID="hdnParentID" runat="server" />

			<p>&nbsp;</p>

			 <p style="text-align: right">
				<asp:ImageButton ID="btnCSVExportCalsification" Width="20px" ToolTip="Excel" OnClick="btnCSVExportCalsification_Click"
					title="Export as excel" ImageUrl="../../img/Icons/Excel.webp" runat="server" formnovalidate=""></asp:ImageButton>
				<asp:ImageButton ID="btnPDFExportClasification" Width="20px" ToolTip="PDF" OnClick="btnPDFExportClasification_Click" 
					title="Export as pdf" ImageUrl="../../img/Icons/Pdf.webp" runat="server"></asp:ImageButton>
				<br />

				<br />
			</p>

			

			<telerik:RadGrid ID="gridClassification" runat="server" AutoGenerateColumns="False" Width="99%" AllowPaging="True"
				        CssClass="AddBorders" AllowFilteringByColumn="False" AllowSorting="True" PageSize="20"
                        ExportSettings-IgnorePaging="true" VirtualItemCount="100" MasterTableView-AllowFilteringByColumn="false"
						OnItemDataBound="gridClassification_ItemDataBound" 				
				GroupPanelPosition="Top" 
				OnSelectedIndexChanged="gridClassification_SelectedIndexChanged">
                <PagerStyle Mode="NextPrevAndNumeric" AlwaysVisible="true" />
				
			    <ClientSettings EnablePostBackOnRowClick="true" EnableRowHoverStyle="true" AllowColumnsReorder="true">
				    <Resizing AllowColumnResize="true" />
				    <Selecting AllowRowSelect="True" />
				    <Scrolling AllowScroll="true" UseStaticHeaders="true" SaveScrollPosition="true" EnableVirtualScrollPaging="false"
					    ScrollHeight="400px"  />
			    </ClientSettings>

			    <GroupingSettings CaseSensitive="false" />
			    <ItemStyle Wrap="true" />
			    <ExportSettings ExportOnlyData="true" HideStructureColumns="false" OpenInNewWindow="true"
					    IgnorePaging="true" FileName="AssetStatuss">
					    <Pdf PageWidth="16in" PageHeight="8.27in" PageTopMargin="5.85mm" PageLeftMargin="5.85mm" />
			    <Csv ColumnDelimiter="VerticalBar" RowDelimiter="NewLine" FileExtension="csv" EncloseDataWithQuotes="false" />
			    </ExportSettings>
				
                <MasterTableView HierarchyLoadMode="Client" DataKeyNames="InvoiceDetailId" ClientDataKeyNames="InvoiceDetailId"
				    CommandItemDisplay="None" NoMasterRecordsText="No records found">
				    <Columns>
                        <%--<telerik:GridBoundColumn DataField="0" HeaderText="Goods / Services Description" UniqueName="ItemDescription" HeaderStyle-Width="200px"></telerik:GridBoundColumn>--%>

						<%--<telerik:GridBoundColumn DataField="QuantityOrder" HeaderText="Quantity" UniqueName="QuantityOrder" HeaderStyle-Width="125px"></telerik:GridBoundColumn>--%>
                        <telerik:GridBoundColumn DataField="Id" HeaderText="ID" UniqueName="Id" HeaderStyle-Width="125px">
<HeaderStyle Width="125px"></HeaderStyle>
                        </telerik:GridBoundColumn>
						<telerik:GridTemplateColumn   UniqueName="ItemDescription" AllowFiltering="true" FilterControlWidth="70px" HeaderText="Goods / Services Description" HeaderStyle-Width="250px">
							<ItemTemplate>
									<asp:TextBox ID="txtItemDescription"  AutoPostBack="false" runat="server" Width="230px" Text='<%# Eval("GoodsServiceDescription") %>'></asp:TextBox>
							</ItemTemplate>

<HeaderStyle Width="250px"></HeaderStyle>
						</telerik:GridTemplateColumn>


						<telerik:GridTemplateColumn   UniqueName="UOM" AllowFiltering="true" FilterControlWidth="70px" HeaderText="UOM" HeaderStyle-Width="125px">
							<ItemTemplate>
									<asp:DropDownList ID="lstUOM" AutoPostBack="false" runat="server" Width="105px"></asp:DropDownList>
							</ItemTemplate>

<HeaderStyle Width="125px"></HeaderStyle>
						</telerik:GridTemplateColumn>

						<telerik:GridTemplateColumn   UniqueName="QuantityOrder" AllowFiltering="true" FilterControlWidth="70px" HeaderText="Quantity" HeaderStyle-Width="115px">
							<ItemTemplate>
									<asp:TextBox ID="txtQuantityOrder" AutoPostBack="false" runat="server" Width="75px" Text='<%# Eval("Quantity") %>'></asp:TextBox>
							</ItemTemplate>

<HeaderStyle Width="115px"></HeaderStyle>
						</telerik:GridTemplateColumn>

                        <telerik:GridTemplateColumn   UniqueName="Rate" AllowFiltering="true" FilterControlWidth="70px" HeaderText="Rate *" HeaderStyle-Width="125px">
							<ItemTemplate>
									<asp:TextBox ID="txtACrate"  AutoPostBack="true" runat="server" Width="105px" Text='<%# Eval("Rate") %>' OnTextChanged="txtACrate_TextChanged"></asp:TextBox>
							</ItemTemplate>

<HeaderStyle Width="125px"></HeaderStyle>
						</telerik:GridTemplateColumn>

						<telerik:GridTemplateColumn   UniqueName="TotalAmount"	AllowFiltering="true" FilterControlWidth="70px" HeaderText="Amount" HeaderStyle-Width="125px">
							<ItemTemplate>
									<asp:TextBox ID="txtTotalAmount1" AutoPostBack="false" runat="server" Width="105px" Text='<%# Eval("Amount") %>' ReadOnly="true"></asp:TextBox>
							</ItemTemplate>

<HeaderStyle Width="125px"></HeaderStyle>
						</telerik:GridTemplateColumn>
                                
						<telerik:GridTemplateColumn   UniqueName="AssetItem" AllowFiltering="true" FilterControlWidth="70px" HeaderText="Asset Item *" HeaderStyle-Width="115px">
							<ItemTemplate>
									<asp:DropDownList ID="lstACassetItem"  AutoPostBack="true" runat="server" Width="95px" OnSelectedIndexChanged="lstACassetItem_SelectedIndexChanged">
										<asp:ListItem Selected="True" Text="--Select--" Value=""/>
										<asp:ListItem Text="True" Value="true"/>
										<asp:ListItem Text="False" Value="false"/>
									</asp:DropDownList>
							</ItemTemplate>

<HeaderStyle Width="115px"></HeaderStyle>
						</telerik:GridTemplateColumn>
								
						<telerik:GridTemplateColumn   UniqueName="AssetDescription" AllowFiltering="true" FilterControlWidth="70px" HeaderText="Asset Description *" HeaderStyle-Width="200px">
							<ItemTemplate>
									<asp:TextBox ID="txtACassetDescription"  AutoPostBack="false" runat="server" Width="180px" Text='<%# Eval("AssetDescription") %>'></asp:TextBox>
							</ItemTemplate>

<HeaderStyle Width="200px"></HeaderStyle>
						</telerik:GridTemplateColumn>

						<telerik:GridTemplateColumn   UniqueName="CIDMSSubComponentType" AllowFiltering="true" FilterControlWidth="70px" HeaderText="CIDMS Sub Component Type *" HeaderStyle-Width="200px">
							<ItemTemplate>
									<asp:DropDownList ID="lstACcIDMSSubComponentType"  AutoPostBack="true" runat="server" Width="180px" OnSelectedIndexChanged="lstACcIDMSSubComponentType_SelectedIndexChanged"></asp:DropDownList>
							</ItemTemplate>

<HeaderStyle Width="200px"></HeaderStyle>
						</telerik:GridTemplateColumn>

						<telerik:GridBoundColumn DataField="CIDMSAccountingGroup" HeaderText="CIDMS Accounting Group" UniqueName="CIDMSAccountingGroup" HeaderStyle-Width="180px">
<HeaderStyle Width="180px"></HeaderStyle>
                        </telerik:GridBoundColumn>
						<telerik:GridBoundColumn DataField="CIDMSAccountingSubGroup" HeaderText="CIDMS Accounting Sub Group" UniqueName="CIDMSAccountingSubGroup" HeaderStyle-Width="180px">
<HeaderStyle Width="180px"></HeaderStyle>
                        </telerik:GridBoundColumn>
						<telerik:GridBoundColumn DataField="CIDMSAssetClass" HeaderText="CIDMS Asset Class" UniqueName="CIDMSAssetClass" HeaderStyle-Width="180px">
<HeaderStyle Width="180px"></HeaderStyle>
                        </telerik:GridBoundColumn>
						<telerik:GridBoundColumn DataField="CIDMSAssetGroupType" HeaderText="CIDMS Asset Group Type" UniqueName="CIDMSAssetGroupType" HeaderStyle-Width="180px">
<HeaderStyle Width="180px"></HeaderStyle>
                        </telerik:GridBoundColumn>
						<telerik:GridBoundColumn DataField="CIDMSAssetType" HeaderText="CIDMS Asset Type" UniqueName="CIDMSAssetType" HeaderStyle-Width="180px">
<HeaderStyle Width="180px"></HeaderStyle>
                        </telerik:GridBoundColumn>
						<telerik:GridBoundColumn DataField="CIDMSComponentType" HeaderText="CIDMS Component Type" UniqueName="CIDMSComponentType" HeaderStyle-Width="180px">
<HeaderStyle Width="180px"></HeaderStyle>
                        </telerik:GridBoundColumn>

						<telerik:GridTemplateColumn   UniqueName="AssetType" AllowFiltering="true" FilterControlWidth="70px" HeaderText="Asset Type *" HeaderStyle-Width="200px">
							<ItemTemplate>
								<asp:DropDownList ID="lstAssetType"  AutoPostBack="true" runat="server" Width="180px" OnSelectedIndexChanged="lstAssetType_SelectedIndexChanged" ></asp:DropDownList>
							</ItemTemplate>

<HeaderStyle Width="200px"></HeaderStyle>
						</telerik:GridTemplateColumn>

						<telerik:GridTemplateColumn   UniqueName="AssetCategory" AllowFiltering="true" FilterControlWidth="70px" HeaderText="Asset Category" HeaderStyle-Width="200px">
							<ItemTemplate>
								<asp:DropDownList ID="lstAssetCategory"  AutoPostBack="true" runat="server"  Width="180px" OnSelectedIndexChanged="lstAssetCategory_SelectedIndexChanged"></asp:DropDownList>
							</ItemTemplate>

<HeaderStyle Width="200px"></HeaderStyle>
						</telerik:GridTemplateColumn>

						<telerik:GridTemplateColumn   UniqueName="AssetSubCategory" AllowFiltering="true" FilterControlWidth="70px" HeaderText="Asset Sub Category" HeaderStyle-Width="200px">
							<ItemTemplate>
									<asp:DropDownList ID="lstAssetSubCategory"  AutoPostBack="false" runat="server" Width="180px"></asp:DropDownList>
							</ItemTemplate>

<HeaderStyle Width="200px"></HeaderStyle>
						</telerik:GridTemplateColumn>

						<telerik:GridTemplateColumn   UniqueName="MeasurementType" AllowFiltering="true" FilterControlWidth="70px" HeaderText="Measurement Type" HeaderStyle-Width="200px">
							<ItemTemplate>
									<asp:DropDownList ID="lstMeasurementType"  AutoPostBack="false" runat="server" Width="180px"></asp:DropDownList>
							</ItemTemplate>

<HeaderStyle Width="200px"></HeaderStyle>
						</telerik:GridTemplateColumn>

						<telerik:GridTemplateColumn   UniqueName="AssetStatus" AllowFiltering="true" FilterControlWidth="70px" HeaderText="Asset Status" HeaderStyle-Width="200px">
							<ItemTemplate>
									<asp:DropDownList ID="lstAssetStatus"  AutoPostBack="false" runat="server"  Width="180px"></asp:DropDownList>
							</ItemTemplate>

<HeaderStyle Width="200px"></HeaderStyle>
						</telerik:GridTemplateColumn>

						<telerik:GridBoundColumn DataField="CidmsSubComponentType" HeaderText="CIDMS_Sub_Component_Type" UniqueName="hdnCIDMS_Sub_Component_Type" Visible="true" HeaderStyle-Width="60px">
<HeaderStyle Width="60px"></HeaderStyle>
                        </telerik:GridBoundColumn>
						<telerik:GridBoundColumn DataField="AssetType" HeaderText="Asset_Type" UniqueName="hdnAsset_Type"											 Visible="true" HeaderStyle-Width="60px">
<HeaderStyle Width="60px"></HeaderStyle>
                        </telerik:GridBoundColumn>
						<telerik:GridBoundColumn DataField="AssetCategory" HeaderText="Asset_Category" UniqueName="hdnAsset_Category"								 Visible="true" HeaderStyle-Width="60px">
<HeaderStyle Width="60px"></HeaderStyle>
                        </telerik:GridBoundColumn>
						<telerik:GridBoundColumn DataField="AssetSubCategory" HeaderText="Asset_Sub_Category" UniqueName="hdnAsset_Sub_Category"					 Visible="true" HeaderStyle-Width="60px">
<HeaderStyle Width="60px"></HeaderStyle>
                        </telerik:GridBoundColumn>
						<telerik:GridBoundColumn DataField="MeasurementType" HeaderText="Measurement_Type" UniqueName="hdnMeasurement_Type"						 Visible="true" HeaderStyle-Width="60px">
<HeaderStyle Width="60px"></HeaderStyle>
                        </telerik:GridBoundColumn>
						<telerik:GridBoundColumn DataField="AssetStatus" HeaderText="Asset_Status" UniqueName="hdnAsset_Status"									 Visible="true" HeaderStyle-Width="60px">
<HeaderStyle Width="60px"></HeaderStyle>
                        </telerik:GridBoundColumn>
						<telerik:GridBoundColumn DataField="IsAsset" HeaderText="IsAsset" UniqueName="hdnAssetItem"													 Visible="true" HeaderStyle-Width="60px">
<HeaderStyle Width="60px"></HeaderStyle>
                        </telerik:GridBoundColumn>
						<telerik:GridBoundColumn DataField="Uom" HeaderText="UOM" UniqueName="hdnUOM"																 Visible="true" HeaderStyle-Width="60px">
<HeaderStyle Width="60px"></HeaderStyle>
                        </telerik:GridBoundColumn>



				    </Columns>

<PagerStyle AlwaysVisible="True"></PagerStyle>
			    </MasterTableView>
				
		    </telerik:RadGrid>

			<p>&nbsp;</p>

			<asp:Button runat="server" ID="btnAddGoodService" Text="Add Goods/ Services Description" OnClick="btnAddGoodService_Click" />
			
			<p>&nbsp;</p>
			<hr />
			<p>&nbsp;</p>

			<asp:Button runat="server" ID="btnACsave" CssClass="buttonEnd" Text="Save" OnClick="btnACsave_Click"/>
			&nbsp;&nbsp;
			<asp:Button runat="server" ID="btnACcalc" Text="Calculate Project Cost" OnClick="btnACcalc_Click" />
			&nbsp;&nbsp;
			<asp:Button runat="server" ID="btnACcancel" CssClass="buttonEnd" Text="Cancel" OnClick="btnACcancel_Click"/>

		</div>

		<div runat="server" id="divCostDistribution" visible="false">

			 <p style="text-align: right">
				<asp:ImageButton ID="btnCSVExportDistibution" Width="20px" ToolTip="Excel" OnClick="btnCSVExportDistibution_Click"
					title="Export as excel" ImageUrl="../../img/Icons/Excel.webp" runat="server" formnovalidate=""></asp:ImageButton>
				<asp:ImageButton ID="btnPDFExportDistribution" Width="20px" ToolTip="PDF" OnClick="btnPDFExportDistribution_Click" 
					title="Export as pdf" ImageUrl="../../img/Icons/Pdf.webp" runat="server"></asp:ImageButton>
				<br />

				<br />
			</p>
			
			<telerik:RadGrid ID="gridDistribution" runat="server" AutoGenerateColumns="False" Width="99%" AllowPaging="True"
				        CssClass="AddBorders" AllowFilteringByColumn="false" AllowSorting="True" PageSize="20"
                        ExportSettings-IgnorePaging="true" VirtualItemCount="100" EnableHierarchyExpandAll="false"
                            EnableViewState="true" MasterTableView-AllowFilteringByColumn="true"
				        GridLines="None" OnItemDataBound="gridDistribution_ItemDataBound" 
						ShowGroupPanel="true" EnableLinqExpressions="false" >
                <PagerStyle Mode="NextPrevAndNumeric" AlwaysVisible="true"/>
				
			    <ClientSettings EnablePostBackOnRowClick="false" EnableRowHoverStyle="true" AllowColumnsReorder="true">
				    <Resizing AllowColumnResize="true" />
				    <Selecting AllowRowSelect="True" />
				    <Scrolling AllowScroll="true" UseStaticHeaders="true" SaveScrollPosition="true" EnableVirtualScrollPaging="false"
					    ScrollHeight=""  />
			    </ClientSettings>

			    <GroupingSettings CaseSensitive="false" />
			    <ItemStyle Wrap="true" />
			    <ExportSettings ExportOnlyData="true" HideStructureColumns="false" OpenInNewWindow="true"
					    IgnorePaging="true" FileName="AssetStatuss">
					    <Pdf PageWidth="16in" PageHeight="8.27in" PageTopMargin="5.85mm" PageLeftMargin="5.85mm" />
			    <Csv ColumnDelimiter="VerticalBar" RowDelimiter="NewLine" FileExtension="csv" EncloseDataWithQuotes="false" />
			    </ExportSettings>
				
                <MasterTableView HierarchyLoadMode="Client" DataKeyNames="CidmsSubComponentTypeId" ClientDataKeyNames="CidmsSubComponentTypeId"
				    CommandItemDisplay="None" NoMasterRecordsText="No records found">
				    <Columns>
                        <telerik:GridBoundColumn DataField="CidmsSubComponentTypeId" HeaderText="CIDMS_Sub_Component_Type" UniqueName="CidmsSubComponentTypeId" HeaderStyle-Width="125px"></telerik:GridBoundColumn>
                        <telerik:GridBoundColumn DataField="ItemDescription" HeaderText="Item Description" UniqueName="ItemDescription" HeaderStyle-Width="250px"></telerik:GridBoundColumn>
                        <telerik:GridNumericColumn 
												DataField="TotalGeneralCost" HeaderText="Total General Cost" UniqueName="TotalGeneralCost" HeaderStyle-Width="125px" 
												NumericType="Number" DataType="System.Double" ItemStyle-HorizontalAlign="Right" >

                        </telerik:GridNumericColumn>
						<telerik:GridNumericColumn 
												DataField="TotalCostPerSubCompType" HeaderText="Total Cost per CIDMS Sub Component Type" UniqueName="TotalCostPerSubCompType" 
												HeaderStyle-Width="125px" DataType="System.Decimal"  ItemStyle-HorizontalAlign="Right">
						</telerik:GridNumericColumn>
                        <telerik:GridBoundColumn DataField="GeneralCostDistribution" HeaderText="General Cost Distribution" UniqueName="GeneralCostDistribution" HeaderStyle-Width="125px" DataType="System.Decimal" ItemStyle-HorizontalAlign="Right"></telerik:GridBoundColumn>
                        <telerik:GridBoundColumn DataField="TotalBillOfQuantities" HeaderText="Total Bill of Quantities Cost" UniqueName="TotalBillOfQuantities"  DataType="System.Decimal" HeaderStyle-Width="125px" ItemStyle-HorizontalAlign="Right"></telerik:GridBoundColumn>

						<telerik:GridTemplateColumn   UniqueName="ActualSurvey" AllowFiltering="true" FilterControlWidth="70px" HeaderText="Actual Survey" HeaderStyle-Width="90px">
							<ItemTemplate>
									<asp:TextBox ID="txtGCDactualSurvey"  AutoPostBack="true" runat="server"  Width="70px" Text='<%# Eval("ActualSurvey") %>' OnTextChanged="txtGCDactualSurvey_TextChanged"></asp:TextBox>
							</ItemTemplate>	
						</telerik:GridTemplateColumn>

                        <telerik:GridBoundColumn DataField="UnitCost" HeaderText="Unit Cost" UniqueName="UnitCost" DataType="System.Decimal"  HeaderStyle-Width="125px" ItemStyle-HorizontalAlign="Right"></telerik:GridBoundColumn>

						<telerik:GridBoundColumn DataField="AssetTypeId" HeaderText="Asset_Type" UniqueName="AssetTypeId" DataType="System.Decimal"  HeaderStyle-Width="125px"></telerik:GridBoundColumn>
						<telerik:GridBoundColumn DataField="AssetCategoryId" HeaderText="Asset_Category" UniqueName="AssetCategoryId" DataType="System.Decimal"  HeaderStyle-Width="125px"></telerik:GridBoundColumn>
						<telerik:GridBoundColumn DataField="AssetSubCategoryId" HeaderText="Asset_Sub_Category" UniqueName="AssetSubCategoryId" DataType="System.Decimal"  HeaderStyle-Width="125px"></telerik:GridBoundColumn>
						<telerik:GridBoundColumn DataField="MeasurementTypeId" HeaderText="Measurement_Type" UniqueName="MeasurementTypeId" DataType="System.Decimal"  HeaderStyle-Width="125px"></telerik:GridBoundColumn>
						<telerik:GridBoundColumn DataField="AssetStatusId" HeaderText="Asset_Status" UniqueName="AssetStatusId" DataType="System.Decimal"  HeaderStyle-Width="125px"></telerik:GridBoundColumn>

						<%-- 
							3 extra rows
							-Total Project Cost
							-Actual Expenditure 
							-Difference 
						--%>
				    </Columns>
			    </MasterTableView>
				
		    </telerik:RadGrid>
			<table runat="server" id="TotalTable">
		     <tr><td style="width:270px;color:white">Total Cost</td>
				 <td style="width:130px" align="right"><asp:Label ID="lblTotGenCost" runat="server" Text="" Width="100%" ForeColor="White" ></asp:Label></td>
				 <td style="width:130px" align="right"><asp:Label ID="lblTotCIDMSCost" runat="server" Text="" Width="100%" ForeColor="White"></asp:Label></td></tr>
			<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>

			<tr><td style="color:white">Total Project Cost</td><td align="right">
                <asp:Label ID="lblTotProjCost" runat="server" Text="" Width="100%" ForeColor="White" ></asp:Label></td><td>&nbsp;</td></tr>
			<tr><td style="color:white">Actual Expenditure</td><td align="right">
                <asp:Label ID="lblActExp" runat="server" Text="" Width="100%" ForeColor="White"></asp:Label></td><td>&nbsp;</td></tr>
			<tr><td style="color:white">Difference</td><td align="right">
                <asp:Label ID="lblDiff" runat="server" Text="" Width="100%" ForeColor="White" ></asp:Label></td><td>&nbsp;</td></tr></table>

			<p></p>
			<hr />
			<table  style="width:99%" border ="1">
				<tr>
					<td style="width:25%">Approved by </td>
					<td style="width:25%"><asp:TextBox runat="server" Enabled="false" ID="txtGCDapprovedBy"></asp:TextBox></td>
					<td style="width:25%" align="right">Approve</td>
					<td style="width:25%"><asp:DropDownList runat="server" ID="lstGCDApprove"><asp:ListItem Text="--Select--" Selected="True"/><asp:ListItem Text="Approved"/><asp:ListItem Text="Declined" /></asp:DropDownList></td>
				</tr>
				<tr>
					<td style="width:25%">Approved Date </td>
					<td style="width:25%"><asp:TextBox runat="server" Enabled="false" ID="txtGCDapprovedDate"></asp:TextBox></td>
					<td style="width:25%" align="right">Comment</td>
					<td style="width:25%"><asp:TextBox runat="server" ID="yxyGCDcomment"></asp:TextBox> </td>
				</tr>
			</table>

			<p>&nbsp;</p>

			<asp:Button runat="server" ID="btnGenList" Text="Generate Asset List" CssStyle="buttonEnd" OnClick="btnGenList_Click" />
			<p>&nbsp;</p>
			<asp:Button runat="server" ID="btnGCDSubmit" Text="Submit" CssStyle="buttonEnd" OnClick="btnGCDSubmit_Click" Enabled="False" />
			&nbsp;&nbsp;
			<asp:Button runat="server" ID="btnGCDCancel" Text="Cancel" CssStyle="buttonEnd" OnClick="btnGCDCancel_Click"/>



		</div>

		<div runat="server" id="divCommissioning" visible="false">

			 <p style="text-align: right">
				<asp:ImageButton ID="btnCSVExportCommission" Width="20px" ToolTip="Excel" OnClick="btnCSVExportCommission_Click"
					title="Export as excel" ImageUrl="../../img/Icons/Excel.webp" runat="server" formnovalidate=""></asp:ImageButton>
				<asp:ImageButton ID="btnPDFExportCommission" Width="20px" ToolTip="PDF" OnClick="btnPDFExportCommission_Click" 
					title="Export as pdf" ImageUrl="../../img/Icons/Pdf.webp" runat="server"></asp:ImageButton>
				<br />

				<br />
			</p>
			
			<telerik:RadGrid ID="gridCommission" runat="server" AutoGenerateColumns="False" Width="99%" AllowPaging="True"
				        CssClass="AddBorders" AllowFilteringByColumn="false" AllowSorting="True" PageSize="20"
                        ExportSettings-IgnorePaging="true" VirtualItemCount="100" EnableHierarchyExpandAll="false"
                            EnableViewState="true" MasterTableView-AllowFilteringByColumn="true"
				        GridLines="None" >
                <PagerStyle Mode="NextPrevAndNumeric" AlwaysVisible="true" />
				
			    <ClientSettings EnablePostBackOnRowClick="false" EnableRowHoverStyle="true" AllowColumnsReorder="true">
				    <Resizing AllowColumnResize="true" />
				    <Selecting AllowRowSelect="True" />
				    <Scrolling AllowScroll="true" UseStaticHeaders="false" SaveScrollPosition="true" EnableVirtualScrollPaging="false"
					    ScrollHeight="400px"  />
			    </ClientSettings>

			    <GroupingSettings CaseSensitive="false" />
			    <ItemStyle Wrap="true" />
			    <ExportSettings ExportOnlyData="true" HideStructureColumns="false" OpenInNewWindow="true"
					    IgnorePaging="true" FileName="AssetStatuss">
					    <Pdf PageWidth="16in" PageHeight="8.27in" PageTopMargin="5.85mm" PageLeftMargin="5.85mm" />
			    <Csv ColumnDelimiter="VerticalBar" RowDelimiter="NewLine" FileExtension="csv" EncloseDataWithQuotes="false" />
			    </ExportSettings>
				
                <MasterTableView HierarchyLoadMode="Client" DataKeyNames="AssetTypeId" ClientDataKeyNames="AssetTypeId"
				    CommandItemDisplay="None" NoMasterRecordsText="No records found" IsFilterItemExpanded="false">
				    <Columns>
						<telerik:GridTemplateColumn   UniqueName="Approve" AllowFiltering="true" HeaderText="Select for Approval" HeaderStyle-Width="60px">
							<ItemTemplate>
									<asp:CheckBox ID="chkComApprove"  AutoPostBack="false" runat="server"></asp:CheckBox>
							</ItemTemplate>
						</telerik:GridTemplateColumn>
						<telerik:GridBoundColumn DataField="AssetTypeId" HeaderText="Asset Type ID" UniqueName="AssetTypeId"></telerik:GridBoundColumn>
                       <telerik:GridBoundColumn DataField="CommissioningDate" HeaderText="Commissioning Date" UniqueName="CommissioningDate" HeaderStyle-Width="125px" DataType="System.DateTime"></telerik:GridBoundColumn>
                        <telerik:GridBoundColumn DataField="AssetTypeDescription" HeaderText="Asset Type" UniqueName="AssetTypeDescription" HeaderStyle-Width="200px"></telerik:GridBoundColumn>
						<telerik:GridBoundColumn DataField="AssetCategoryDescription" HeaderText="Asset Category" UniqueName="AssetCategoryDescription" HeaderStyle-Width="200px" ></telerik:GridBoundColumn>
                        <telerik:GridBoundColumn DataField="AssetSubCategoryDescription" HeaderText="Asset Sub Category" UniqueName="AssetSubCategoryDescription" HeaderStyle-Width="250px" ></telerik:GridBoundColumn>
                        <telerik:GridBoundColumn DataField="AssetCount" HeaderText="Asset Count" UniqueName="AssetCount"  DataType="System.Int32" HeaderStyle-Width="125px"></telerik:GridBoundColumn>
                        <telerik:GridBoundColumn DataField="TotalAssetCost" HeaderText="Total Asset Cost" UniqueName="TotalAssetCost" DataType="System.Decimal"  HeaderStyle-Width="125px"></telerik:GridBoundColumn>
                        <telerik:GridBoundColumn DataField="TotalProjectCost" HeaderText="Total Project Cost" UniqueName="TotalProjectCost" DataType="System.Decimal"  HeaderStyle-Width="125px"></telerik:GridBoundColumn>
                        <telerik:GridBoundColumn DataField="DebitProject" HeaderText="Planning Project (Dt)" UniqueName="PlanningProject_Dt" HeaderStyle-Width="250px"></telerik:GridBoundColumn>
                        <telerik:GridBoundColumn DataField="DebitItemDescription" HeaderText="SCOA Item (Dt)" UniqueName="SCOAItem_Dt" HeaderStyle-Width="250px"></telerik:GridBoundColumn>
                        <telerik:GridBoundColumn DataField="CreditProject" HeaderText="Planning Project (Ct)" UniqueName="PlanningProject_Ct" HeaderStyle-Width="250px"></telerik:GridBoundColumn>
                        <telerik:GridBoundColumn DataField="CreditItemDescription" HeaderText="SCOA Item (Ct)" UniqueName="SCOAItem_Ct" HeaderStyle-Width="250px"></telerik:GridBoundColumn>
						 <telerik:GridBoundColumn DataField="AssetDescription" HeaderText="Asset Description" UniqueName="AssetDescription" HeaderStyle-Width="250px"></telerik:GridBoundColumn>

						
				    </Columns>
			    </MasterTableView>
				
		    </telerik:RadGrid>

			<p>&nbsp;</p>

			<table style="width:99%">
				<tr>
					<td style="width:25%">Approved by</td>
					<td style="width:25%"><asp:TextBox runat="server" Enabled="false" ID="txtComApprovedBy"></asp:TextBox></td>
					<td style="width:25%" align="right">Approve</td>
					<td style="width:25%"><asp:DropDownList runat="server" ID="lstCommApprove"><asp:ListItem Text="--Select--" Selected="True"/><asp:ListItem Text="Approved"/><asp:ListItem Text="Declined" /></asp:DropDownList></td>
				</tr>
				<tr>
					<td style="width:25%">Approved Date</td>
					<td style="width:25%"><asp:TextBox runat="server" Enabled="false" ID="txtComApproveDate"></asp:TextBox></td>
					<td style="width:25%" align="right">Comment</td>
					<td style="width:25%"><asp:TextBox runat="server" ID="txtComComments"></asp:TextBox> </td>
				</tr>
			</table>

			<p>&nbsp;</p>

			<asp:Button runat="server" ID="btnComSubmit" Text="Submit" CssStyle="buttonEnd" OnClick="btnComSubmit_Click"/>
			&nbsp;&nbsp;
			<asp:Button runat="server" ID="btnComSCancel" Text="Cancel" CssStyle="buttonEnd" OnClick="btnComSCancel_Click" />

		</div>

		<div runat="server" id="divManageAssets" class="row" visible="false">

			<div class="sixcol">
					<h3>Download Files</h3>
			    	<table style="width:99%">
                        <tr>
                            <td style="width:100%" colspan="2">
                                &nbsp;</td>
                        </tr>
						<tr>
							<td style="width:50%">
                                <asp:HiddenField ID="txtFromId" runat="server" />
					<asp:Button runat="server" Text="Download Asset Register" ID="btnDownLoad" OnClick="btnDownLoad_Click"/>
                            </td>
							<td style="width:50%">&nbsp;</td>
						</tr>                      
						<tr>
							<td style="width:50%">
                                <asp:HiddenField ID="txtToId" runat="server" />
                            </td>
							<td style="width:50%">&nbsp;</td>
						</tr>                      
                        <tr>
                            <td style="width:50%"></td>
							<td style="width:50%"></td>
                        </tr>
			    	</table>
					<br />
            </div>
            <div class="sixcol last">
                <h3>Upload Files<asp:HiddenField ID="hdnUploadedDocs" runat="server" />
                </h3>
			    <table width="99%">
                    <tr>
                        <td>
                            <asp:FileUpload runat="server" ID="upFileUpload"/>

							<asp:Button runat="server" ID="btnUpload" CssClass="buttonEnd" Text="Upload" OnClick="btnUpload_Click"/>
                        </td>
                    </tr>
                </table>
            </div>
       

		</div>

		<div runat="server" id="divFiles" visible="false">

			<hr />

			 <asp:Button runat="server" ID="btnShowDocs" Text="View Documents" OnClientClick="return ShowDocuments()" />

		</div>

	</div>


	<div id="modQuestion" class="modal" role="dialog">
		<div class="modal-dialog">
			<!-- Modal content-->
			<div class="modal-content">
				<div class="modal-header">
					<h4 class="modal-title">
					Asset Acquisition<button type="button" class="close" style="float:right" data-dismiss="modal">&times;</button></h4>
				</div>
				<div class="modal-body">
					<asp:Label ID="lblQuestion" runat="server" Text="Are you sure?"></asp:Label>
				</div>
				<div class="modal-footer">
					<asp:Button CssClass="btn btn-default buttonEnd" ID="btnDialogOK"		Text="Yes" runat="server" Width="50px"  OnClick="btnDialogOK_Click"/>
					<asp:Button CssClass="btn btn-default buttonEnd" ID="btnDialogClose"	Text="No"  runat="server" Width="50px" OnClick="btnDialogClose_Click"/>
				</div>
			</div>

		</div>
	</div>

	<div id="modUploadDocs" class="modal" role="dialog">
		<div class="modal-dialog">
			<!-- Modal content-->
			<div class="modal-content">
				<div class="modal-header">
					<h4 class="modal-title">UPLOAD DOCUMENTS<button type="button" class="close ml-auto" style="float:right" data-dismiss="modal">&times;</button></h4> <%--<telerik:GridTemplateColumn   UniqueName="Action" AllowFiltering="true" FilterControlWidth="70px" HeaderText="Action">
									<ItemTemplate>
											<asp:HyperLink NavigateUrl="" runat="server" id="alnkDownloadDoc" Text="Download Document" Font-Underline="true"></asp:HyperLink>
									</ItemTemplate>
								</telerik:GridTemplateColumn>--%>
				</div>
				<div class="modal-body">
					<table style="width:99%">
						<tr>
							<td style="width:33%">COMPLETION CERTIFICATE <span style="color: red;">*</span></td>
							<td style="width:67%"><asp:FileUpload runat="server" ID="uploadCertificate" Width="99%" /></td>
						</tr>
						<tr>
							<td style="width:33%">BILL OF QUANTITIES<span style="color: red;">*</span></td>
							<td style="width:67%"><asp:FileUpload runat="server" ID="uploadBill" Width="99%"/></td>
						</tr>
						<tr>
							<td style="width:33%">Attach additional files</td>
							<td style="width:67%"><asp:FileUpload runat="server" ID="uploadAnother" AllowMultiple="true" Width="99%" /></td>
						</tr>
					</table>
				</div>
				<div class="modal-footer">
					<asp:Button CssClass="btn btn-default buttonEnd" ID="btnSubmitUploads" Text="Submit" runat="server" Width="50px" OnClick="btnSubmitUploads_Click" OnClientClick="return ValidateUploads();"/>
					<asp:Button CssClass="btn btn-default buttonEnd" ID="btnCancelUploads" Text="Cancel"  runat="server" Width="50px" OnClientClick="return false" data-dismiss="modal"/>
				</div>
			</div>

		</div>
	</div>

	<div id="modShowDocs" class="modal" role="dialog">
		<div class="modal-dialog">
			<!-- Modal content-->
			<div class="modal-content">
				<div class="modal-header">
					<h4 class="modal-title">DOCUMENTS<button type="button" class="close ml-auto" style="float:right" data-dismiss="modal">&times;</button></h4> <%--<telerik:GridHyperLinkColumn DataTextFormatString="Download" HeaderText="Action" UniqueName="Download" DataNavigateUrlFields="filename"></telerik:GridHyperLinkColumn>--%>
				</div>
				<div class="modal-body" runat="server" id="divDocs">
					
					<telerik:RadGrid ID="gridFiles" runat="server" AutoGenerateColumns="False" Width="99%" AllowPaging="True"
				        CssClass="AddBorders" AllowFilteringByColumn="false" AllowSorting="True" PageSize="20"
                        ExportSettings-IgnorePaging="true" VirtualItemCount="100" EnableHierarchyExpandAll="false"
                            EnableViewState="true" MasterTableView-AllowFilteringByColumn="true"
						OnItemDataBound="gridFiles_ItemDataBound"
				        GridLines="None">
                        <PagerStyle Mode="NextPrevAndNumeric" AlwaysVisible="true" />
				
			            <ClientSettings EnablePostBackOnRowClick="true" EnableRowHoverStyle="true" AllowColumnsReorder="true">
				            <Resizing AllowColumnResize="true" />
				            <Selecting AllowRowSelect="True" />
				            <Scrolling AllowScroll="true" UseStaticHeaders="true" SaveScrollPosition="true" EnableVirtualScrollPaging="false"
					            ScrollHeight="400px"  />
			            </ClientSettings>

			            <GroupingSettings CaseSensitive="false" />
			            <ItemStyle Wrap="true" />
			            <ExportSettings ExportOnlyData="true" HideStructureColumns="false" OpenInNewWindow="true"
					            IgnorePaging="true" FileName="AssetStatuss">
					            <Pdf PageWidth="16in" PageHeight="8.27in" PageTopMargin="5.85mm" PageLeftMargin="5.85mm" />
			            <Csv ColumnDelimiter="VerticalBar" RowDelimiter="NewLine" FileExtension="csv" EncloseDataWithQuotes="false" />
			            </ExportSettings>
				
                        <MasterTableView HierarchyLoadMode="Client" DataKeyNames="Id" ClientDataKeyNames="Id"
				            CommandItemDisplay="None" NoMasterRecordsText="No records found">
				            <Columns>
                                <telerik:GridBoundColumn DataField="Id" HeaderText="ID" UniqueName="Id" HeaderStyle-Width="125px"></telerik:GridBoundColumn>
                                <telerik:GridBoundColumn DataField="DocumentName" HeaderText="Document Name" UniqueName="DocumentName" HeaderStyle-Width="250px"></telerik:GridBoundColumn>

								<%--<telerik:GridTemplateColumn   UniqueName="Action" AllowFiltering="true" FilterControlWidth="70px" HeaderText="Action">
									<ItemTemplate>
											<asp:HyperLink NavigateUrl="" runat="server" id="alnkDownloadDoc" Text="Download Document" Font-Underline="true"></asp:HyperLink>
									</ItemTemplate>
								</telerik:GridTemplateColumn>--%>
								<%--<telerik:GridHyperLinkColumn DataTextFormatString="Download" HeaderText="Action" UniqueName="Download" DataNavigateUrlFields="filename"></telerik:GridHyperLinkColumn>--%>
								<telerik:GridTemplateColumn>
									<ItemTemplate>
										<asp:LinkButton ID="alnkDownloadDoc" runat="server" Text="Download Document" ToolTip='<%# Eval("DocumentName") %>' OnClick="alnkDownloadDoc_Click"
											></asp:LinkButton>
									</ItemTemplate>
								</telerik:GridTemplateColumn>
				            </Columns>
			            </MasterTableView>
				
		            </telerik:RadGrid>

				</div>
				<div class="modal-footer">
					<asp:Button CssClass="btn btn-default buttonEnd" ID="btncloseShowDocs" Text="Cancel"  runat="server" Width="50px" OnClientClick="return false" data-dismiss="modal"/>
				</div>
			</div>

		</div>
	</div>
</asp:Content>
