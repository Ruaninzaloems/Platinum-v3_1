<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Acquisition.aspx.cs" Inherits="FMSWebApp.Assets.MultiYear.Acquisition" %>

<%@ Register Assembly="Telerik.Web.UI" Namespace="Telerik.Web.UI" TagPrefix="telerik" %>
<%@ Register Src="~/Assets/Controls/AssetProperties.ascx" TagPrefix="uc1" TagName="AssetProperties" %>


<asp:Content ID="Content1" ContentPlaceHolderID="Script" runat="server">

    <script type="text/javascript">

        function UploadFile(fileUpload, fromwhere) {
            if (fileUpload.value != '') {
                if (fromwhere == "Imgage")
                    document.getElementById("<%=btnUploadImage.ClientID %>").click();
                if (fromwhere == "DonorImgage")
                    document.getElementById("<%=btnUploadDonorImage.ClientID %>").click();
                if (fromwhere == "DonorFile")
                    document.getElementById("<%=btnUploadDonor.ClientID %>").click();

            }
        }
       
        function AskClear() {
            mustclear = confirm("Do you want to clear this item?");
            return mustclear;
        }


         function ShowUpdated(saywhat) {
             debugger;
             //alert(saywhat);
            //ShowAlertDialogBox(saywhat);
             ShowAlertDialogBoxWithParam(saywhat, "Acquisition.aspx",'');
             //$("#modQuestion").modal("show");
        }

         function ShowError(saywhat) {
             debugger;
             //alert(saywhat);
            ShowAlertDialogBox(saywhat);
             
             //$("#modQuestion").modal("show");
        }

        function ShowQuestion() {
                 $("#modQuestion").modal("show");
        }

        function UploadDonorFile(fileUpload) {
            if (fileUpload.value != '') {
                document.getElementById("<%=btnUploadDonor.ClientID %>").click();
            }
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
    
<%--<ClientEvents OnRowSelected="rowselected" OnGridCreated="hidecolumns"/>--%>

    <div class="contentHolder">
        <div id="heading" class="row last">
			<h2>
				<asp:Label ID="lblHeading" runat="server" Text="Acquire Assets"></asp:Label>
			</h2>
			<hr />
		</div>

        <div class="twelvecol last" style="display: none" id="divMessage" runat="server">
			<label id="lblMessage" runat="server" class="note">
			</label>
		</div>

        <div runat="server" id="divMenu">
            <telerik:RadWizard runat="server" ID="wizMenu" 
                RenderMode="Lightweight" DisplayProgressBar="false" DisplayNavigationButtons="false" Width="100%"
                OnActiveStepChanged="wizMenu_ActiveStepChanged">
                <WizardSteps>
                    <telerik:RadWizardStep runat="server" ID="stepType" Title="Acquisition Type" >
                    </telerik:RadWizardStep>
                    <telerik:RadWizardStep runat="server" ID="stepManage" Title="Manage Assets" Enabled="false" >
                    </telerik:RadWizardStep>
                </WizardSteps>
            </telerik:RadWizard>

            <telerik:RadWizard runat="server" ID="wizSubMenu" 
                RenderMode="Lightweight" DisplayProgressBar="false" DisplayNavigationButtons="false" Width="100%" OnActiveStepChanged="wizSubMenu_ActiveStepChanged"
                >
                <WizardSteps>
                    <telerik:RadWizardStep runat="server" ID="stepProcurement" Title="Procurement" >
                        <%--<div class="threecol">
                            <h3><asp:Label ID="Label11" runat="server" Text="Procurement"></asp:Label></h3>
                        </div>
                        <br />--%>
                        
                    </telerik:RadWizardStep>
                    <telerik:RadWizardStep runat="server" ID="stepInventory" Title="Inventory Assets">
                        <%--<div class="threecol">
                            <h3><asp:Label ID="Label2" runat="server" Text="Inventory Assets"></asp:Label></h3>
                        </div>
                        <br />--%>
                        
                    </telerik:RadWizardStep>
                    <telerik:RadWizardStep runat="server" ID="stepDonations" Title ="Donations">
                        <%--<div class="row threecol">
                            <asp:Label ID="Label3" runat="server" Text="Donations"></asp:Label>
                        </div>--%>
                    </telerik:RadWizardStep>
                </WizardSteps>
            </telerik:RadWizard>

            <div runat="server" id="divSearch">
                
                <div runat="server" id="divSearchParameters">
                    <table style="width:99%">
                        <tr>
                            <td style="width:50%" colspan="2">
                                <div runat="server" id="divAssetID">
                                    <table style="border-collapse:collapse;width:100%">
                                        <tr>
                                        <td style="width:50%"><asp:Label runat="server" ID="Label1" Text="From Date"></asp:Label> <span style="color: red;">*<br />
                                            </span> &nbsp;<telerik:RadDatePicker ID="txtFromDate" runat="server" DateInput-DateFormat="dd/MM/yyyy" DateInput-AutoCompleteType="Disabled" 
                                                DateInput-DisplayDateFormat="dd/MM/yyyy" DatePopupButton-Visible="false" ShowPopupOnFocus="true">
                                            </telerik:RadDatePicker>
                                            </td>
                                        <td style="width:50%">
                                            &nbsp;</td>
                                        </tr>
                                    </table>
                                </div>
                            </td>
                            <td colspan="2"></td>
                        </tr>
                        <tr>
                            <td style="width:50%" colspan="2">
                                <div runat="server" id="div1">
                                    <table style="border-collapse:collapse;width:100%">
                                        <tr>
                                        <td style="width:50%"><asp:Label runat="server" ID="Label4" Text="To Date"></asp:Label> <span style="color: red;">*<br />
                                            </span> &nbsp;<telerik:RadDatePicker ID="txtToDate" runat="server" DateInput-DateFormat="dd/MM/yyyy" DateInput-AutoCompleteType="Disabled"
                                                DateInput-DisplayDateFormat="dd/MM/yyyy" DatePopupButton-Visible="false" ShowPopupOnFocus="true">
                                            </telerik:RadDatePicker>
                                            </td>
                                        <td style="width:50%">
                                            &nbsp;</td>
                                        </tr>
                                    </table>
                                </div>
                            </td>
                            <td colspan="2"></td>
                        </tr>
                        <tr>
                            <td style="width:25%">
                                <asp:Button runat="server" CssClass="" ID="btnSearch" Text="Search"  OnClick="btnSearch_Click" Width="45px"/>&nbsp;
                                <asp:Button runat="server" CssClass="" ID="btnClear" Text="Clear" OnClick="btnClear_Click" Width="45px" /></td>
                            <td style="width:25%">&nbsp;</td>
                            <td style="width:25%"></td>
                            <td style="width:25%"></td>
                        </tr>
                    </table>
                </div>

                <div runat="server" id="divSearchGrid">
                    <br />
			        <p style="text-align: right">
				        <asp:ImageButton ID="btnCSVExport" Width="20px" ToolTip="Excel" OnClick="btnCSVExport_Click"
					        title="Export as excel" ImageUrl="~/img/Icons/Excel.webp" runat="server" formnovalidate=""></asp:ImageButton>
				        <asp:ImageButton ID="btnPDFExport" Width="20px" ToolTip="PDF" OnClick="btnPDFExport_Click"
					        title="Export as pdf" ImageUrl="~/img/Icons/Pdf.webp" runat="server"></asp:ImageButton>
				        <br />

				        <br />
			        </p>

                    <telerik:RadGrid ID="gridSearch" runat="server" AutoGenerateColumns="False" Width="99%" AllowPaging="True"
				        CssClass="AddBorders" AllowFilteringByColumn="True" AllowSorting="True" PageSize="20"
                        ExportSettings-IgnorePaging="true" VirtualItemCount="100" EnableHierarchyExpandAll="false"
                            EnableViewState="true" MasterTableView-AllowFilteringByColumn="true"
				        GridLines="None" ToolTip="Select item to edit" 
                    OnSelectedIndexChanged="gridSearch_SelectedIndexChanged" OnItemCommand="gridSearch_ItemCommand"
                        OnNeedDataSource="gridSearch_NeedDataSource" >
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
				
                        <MasterTableView HierarchyLoadMode="Client" DataKeyNames="ID" ClientDataKeyNames="ID"
				            CommandItemDisplay="None" NoMasterRecordsText="No records found">
				            <Columns>
                                <%--<telerik:GridButtonColumn CommandName="btnClear" Text="Clear" HeaderText="Action" UniqueName="btnClear" HeaderStyle-Width="50px"></telerik:GridButtonColumn>--%>
                                <telerik:GridTemplateColumn  HeaderText="Action" UniqueName="Action" HeaderStyle-HorizontalAlign="Left" HeaderStyle-Width="50px" ShowFilterIcon="false" Visible="true" AllowFiltering="false">
                                <ItemTemplate>                                    
                                    <asp:LinkButton ID="lnkbtnApprove" runat="server" BorderStyle="None" Text="Clear" ForeColor="Blue" OnClientClick="return AskClear();" OnClick="lnkbtnApprove_Click"></asp:LinkButton>
                                </ItemTemplate>
                                </telerik:GridTemplateColumn>
                                

                                <telerik:GridBoundColumn DataField="ID" HeaderText="Register Item ID" UniqueName="ID" visible="true" HeaderStyle-Width="125px"></telerik:GridBoundColumn>
                                <%--<telerik:GridBoundColumn DataField="TransferID" HeaderText="Transfer ID" UniqueName="TransferID" visible="true" HeaderStyle-Width="50px"></telerik:GridBoundColumn>--%>
                                <telerik:GridBoundColumn DataField="TypeID" HeaderText="GRN ID" UniqueName="TypeID" visible="true" HeaderStyle-Width="125px"></telerik:GridBoundColumn>

                                <telerik:GridBoundColumn DataField="Description" HeaderText="Description" UniqueName="Description" visible="false" HeaderStyle-Width="250px"></telerik:GridBoundColumn>
                                <telerik:GridBoundColumn DataField="AssetCategoryDesc" HeaderText="Asset Category Description" UniqueName="AssetCategoryDesc" visible="true" HeaderStyle-Width="250px"></telerik:GridBoundColumn>
                                <telerik:GridBoundColumn DataField="AssetClassDesc" HeaderText="Asset Class Description" UniqueName="AssetClassDesc" visible="true"></telerik:GridBoundColumn>



				            </Columns>
			            </MasterTableView>
				
		            </telerik:RadGrid>


                </div>
            </div>

            <div runat="server" id="divAssetItem">
                <telerik:RadWizard runat="server" ID="wizDetail" 
                    RenderMode="Lightweight" DisplayProgressBar="false" DisplayNavigationButtons="false" Width="100%"
                    OnActiveStepChanged="wizDetail_ActiveStepChanged">
                    <WizardSteps>

                        <telerik:RadWizardStep runat="server" ID="stepDetail" Title="Asset Details" >
                            
                            <div runat="server" id="divPlanning">
                                <table style="width:99%">
                                    <tr>
                                       <td style="width:10%">
                                            <label>Planning Project</label>&nbsp;
                                        </td>
                                        <td style="width:16%">
                                            <asp:TextBox runat="server" ReadOnly="true" ID="txtProject"></asp:TextBox>
                                            <asp:TextBox ID="txtProjectHdn" runat="server" Visible="False"></asp:TextBox>
                                             <asp:TextBox ID="txtScoaHdn" runat="server" Visible="False"></asp:TextBox>
                                        </td>
                                        <td style="width:11%">
                                            <asp:Label runat="server" id="lblScoaItem">SCOA Item</asp:Label>&nbsp;
                                        </td>
                                        <td style="width:16%">
                                            <asp:TextBox runat="server" ReadOnly="true" ID="txtScoaItem"></asp:TextBox>
                                        </td>
                                        <td style="width:18%">&nbsp;
                                        </td>
                                        <td style="width:18%">&nbsp;
                                        </td>
                                    </tr>
                                           
                                
                            </div>

                            <uc1:AssetProperties runat="server" ID="AssetProperties1" />
                            <table style="width:99%">
                                <tr>
                                    <td style="width:25%">In Service Date<span style="color: red;">*</span></td>
                                    <td style="width:25%">
                                        <span style="color: red;">
                                        <telerik:RadDatePicker ID="datInService" runat="server" DateInput-DateFormat="dd/MM/yyyy" DateInput-DisplayDateFormat="dd/MM/yyyy" DatePopupButton-Visible="false" ShowPopupOnFocus="true">
                                        </telerik:RadDatePicker>
                                        </span></td>
                                    <td style="width:25%">Verification Done By</td>
                                    <td style="width:25%">
                                        <asp:DropDownList ID="lstVerifyID" runat="server" AutoPostBack="true" OnSelectedIndexChanged="lstCustodian_SelectedIndexChanged">
                                        </asp:DropDownList>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:25%">Verification Date<span style="color: red;">*</span></td>
                                    <td style="width:25%">
                                        <telerik:RadDatePicker ID="datVerificationDate" runat="server" DateInput-DateFormat="dd/MM/yyyy" 
                                                DateInput-DisplayDateFormat="dd/MM/yyyy" DatePopupButton-Visible="false" ShowPopupOnFocus="true">
                                        </telerik:RadDatePicker></td>

                                        
                                    <td style="width:25%">Usefull life (Months)<span style="color: red;">*</span></td>
                                    <td style="width:25%">
                                        <asp:UpdatePanel runat="server" ID="upUsefulLife" UpdateMode="Conditional">
                                            <ContentTemplate>
                                                <asp:TextBox runat="server" ID="txtUsefulLife"></asp:TextBox>
                                            </ContentTemplate>
                                        </asp:UpdatePanel>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:25%">Acquisition Date<span style="color: red;">*</span></td>
                                    <td style="width:25%">
                                        <telerik:RadDatePicker ID="datReadyForUse" runat="server" DateInput-DateFormat="dd/MM/yyyy" DateInput-DisplayDateFormat="dd/MM/yyyy" DatePopupButton-Visible="false" ShowPopupOnFocus="true">
                                        </telerik:RadDatePicker>
                                    </td>
                                    <td style="width:25%">Residual Value</td>
                                    <td style="width:25%">
                                        <asp:TextBox ID="txtResidualValue" runat="server"></asp:TextBox>
                                    </td> 
                                </tr>
                                <tr>
                                    <td style="width:25%">Purchase Amount<span style="color: red;">*</span></td>
                                    <td style="width:25%"><asp:TextBox runat="server" ID="txtPurchaseAmount"></asp:TextBox></td>
                                    <td style="width:25%"><div runat="server" id="lblGRN"> GRN Number/ Reference Number<span style="color: red;">*</span></div></td>
                                    <td style="width:25%">
                                        <asp:TextBox ID="txtGRNnumber" runat="server" ReadOnly="True"></asp:TextBox>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="width:25%">Replacement Value</td>
                                    <td style="width:25%"><asp:TextBox runat="server" ID="txtReplacementValue"></asp:TextBox></td>
                                    <td style="width:25%"><div runat="server" id="divInventoryNumber">Inventory Transfer Number<span style="color: red;">*</span></div></td>
                                    <td style="width:25%">
                                        <asp:TextBox ID="txtInventory" runat="server" ReadOnly="True"></asp:TextBox>
                                    </td>
                                    
                                </tr>
                                <tr>
                                    <td style="width:25%">Image</td>
                                    <td style="width:25%">
                                        <a href="" runat="server" id="aImageFile" onserverclick="aImageFile_ServerClick">
                                            <asp:Label runat="server" ID="lblfileuploadimage"></asp:Label>
                                        </a>
                                    </td>
                                     <td style="width:50%" colspan="2">
                                        <asp:FileUpload runat="server" ID="fileUploadImage" ClientIDMode="Static"/>
                                        <asp:Button ID="btnUploadImage" Text="Upload" runat="server" OnClick="btnUploadImage_Click" Style="display: none" />
                                     </td>
                                </tr>
                            </table>

                        </telerik:RadWizardStep>

                        <telerik:RadWizardStep runat="server" ID="stepOwnership" Title="Asset Ownership" Enabled="false" >
                            <table style="width:99%">
                                <tr>
                                    <td style="width:25%">Department<span style="color: red;">*</span></td>
                                    <td style="width:25%"><asp:DropDownList runat="server" ID="lstDepartment" AutoPostBack="true" OnSelectedIndexChanged="lstDepartment_SelectedIndexChanged"/></td>
                                    <td style="width:25%">Division<span style="color: red;">*</span></td>
                                    <td style="width:25%"><asp:DropDownList runat="server" ID="lstDivision"></asp:DropDownList></td>
                                </tr>
                   
                                <tr>
                                    <td style="width:25%">Custodian<span style="color: red;">*</span></td>
                                    <td style="width:25%"><asp:DropDownList runat="server" ID="lstCustodian" AutoPostBack="true" OnSelectedIndexChanged="lstCustodian_SelectedIndexChanged"></asp:DropDownList></td>
                                    <td style="width:25%">Custodian ID Number<span style="color: red;">*</span></td>
                                    <td style="width:25%"><asp:TextBox runat="server" ID="txtCustodianNumber" ReadOnly="true"></asp:TextBox>
                                         <asp:HiddenField runat ="server" ID="hdnCustodianIDNumber" />

                                    </td>
                                </tr>
                    
                                <tr>
                                    <td style="width:25%">Asset Ownership<span style="color: red;">*</span></td>
                                    <%--<td style="width:25%"><asp:DropDownList runat="server" ID="lstOwership"></asp:DropDownList></td>--%>
                                    <td style="width:25%"><asp:TextBox runat="server" ID="txtAssetOwner"></asp:TextBox></td>
                                    <td style="width:25%"></td>
                                    <td style="width:25%"></td>
                                </tr>
                                <tr>
                                    <td style="width:25%">Capturer<span style="color: red;">*</span></td>
                                    <td style="width:25%"><asp:TextBox runat="server" ID="txtCapturer" ReadOnly="true"/></td>
                                    <td style="width:25%"></td>
                                    <td style="width:25%"></td>
                                </tr>
                            </table>
                        </telerik:RadWizardStep>

                        <telerik:RadWizardStep runat="server" ID="stepLocation" Title="Asset Location" Enabled="false" >
                            <table style="width:99%">
                                <tr>
                                    <td style="width:16.5%">Latitude</td><%--<span style="color: red;">*</span></td>--%>
                                    <td style="width:16.5%"><asp:TextBox runat="server" ID="txtLatittude"/></td>
                                    <td style="width:16.5%">Longitude</td><%--<span style="color: red;">*</span></td>--%>
                                    <td style="width:16.5%"><asp:TextBox runat="server" ID="txtLogitude"/></td>
                                    <td style="width:16.5%"></td>
                                    <td style="width:16.5%"></td>
                                </tr>
                                <%--<tr>
                                    <td style="width:16.5%">GIS Feature</td>
                                    <td style="width:16.5%"><asp:TextBox runat="server" ID="txtGISFeature"/></td>
                                    <td style="width:16.5%">SG Number</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstSG"/></td>
                                    <td style="width:16.5%"></td>
                                    <td style="width:16.5%"></td>
                                </tr>--%>
                            <%--</table>
                            <table style="width:99%">--%>
                                <tr>
                                    <td style="width:16.5%">Town<span style="color: red;">*</span></td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstTown" OnSelectedIndexChanged="lstTown_SelectedIndexChanged" AutoPostBack="true"/></td>
                                    <td style="width:16.5%">Suburb</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstSuburb" OnSelectedIndexChanged="lstSuburb_SelectedIndexChanged" AutoPostBack="true"/></td>
                                    <%--<td style="width:16.5%">Site Number</td>
                                    <td style="width:16.5%"><asp:TextBox runat="server" ID="txtSite"/></td>--%>
                                    <td style="width:16.5%"></td>
                                    <td style="width:16.5%"></td>
                                </tr>
                                <tr>
                                    <%--<td style="width:16.5%">Zone</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstZone"/></td>--%>
                                    <td style="width:16.5%">Ward</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstWard"/></td>
                                    <td style="width:16.5%">Street Address</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstStreet" AutoPostBack="true" OnSelectedIndexChanged="lstStreet_SelectedIndexChanged"/></td>
                                    <td style="width:16.5%"></td>
                                    <td style="width:16.5%"></td>
                                </tr>
                                <tr>
                                    <td style="width:16.5%">Building</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstBuilding" AutoPostBack="true" OnSelectedIndexChanged="lstBuilding_SelectedIndexChanged"/></td>
                                    <td style="width:16.5%">Floor Description</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstFloor" AutoPostBack="true" OnSelectedIndexChanged="lstFloor_SelectedIndexChanged"/></td>
                                    <td style="width:16.5%">Room Number</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstRoom"/></td>
                                </tr>
                            </table>
                        </telerik:RadWizardStep>
                       
                    </WizardSteps>
                </telerik:RadWizard>

                <div  runat="server" id="divNavButtons">
                    <asp:Button runat="server" ID="btnPrev" Text="Previous" Visible="false" OnClick="btnPrev_Click" Width="64px" BorderColor="Gray" />
                    <asp:Button runat="server" ID="btnNext" Text="Next" Visible="true" OnClick="btnNext_Click" Width="64px" BackColor="#1484cf" ForeColor="White" BorderColor="DarkBlue" />
                    <asp:Button runat="server" ID="btnSubmit" Text="Submit" Visible="false" OnClick="btnSubmit_Click" Width="64px" BackColor="Black" ForeColor="White" BorderColor="Black" />
                </div>
            </div>

            <div runat="server" id="divDonorAssetItem">
			
				<telerik:RadWizard runat="server" ID="wizDetailDonor" 
                    RenderMode="Lightweight" DisplayProgressBar="false" DisplayNavigationButtons="false" Width="100%"
                    OnActiveStepChanged="wizDetail_ActiveStepChanged">
                    <WizardSteps>

                        <telerik:RadWizardStep runat="server" ID="stepDonorDetail" Title="Asset Details" ImageUrl="../../img/KPITargetMissed.png">
                            
                            <uc1:AssetProperties runat="server" ID="AssetPropertiesDonor1" />

                            <table style="width:99%">
                                <tr>
                                    <td style="width:25%">In Service Date<span style="color: red;">*</span></td>
                                    <td style="width:25%">
                                        <telerik:RadDatePicker ID="datDonorReadyForUse" runat="server" DateInput-DateFormat="dd/MM/yyyy" 
                                                DateInput-DisplayDateFormat="dd/MM/yyyy" DatePopupButton-Visible="false" ShowPopupOnFocus="true">
                                        </telerik:RadDatePicker></td>
                                    <td style="width:25%">&nbsp;</td>
                                    <td style="width:25%">
                                        &nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="width:25%">Verification Date<span style="color: red;">*</span></td>
                                    <td style="width:25%">
                                        <telerik:RadDatePicker ID="datDonorVerificationDate" runat="server" DateInput-DateFormat="dd/MM/yyyy" 
                                                DateInput-DisplayDateFormat="dd/MM/yyyy" DatePopupButton-Visible="false" ShowPopupOnFocus="true">
                                        </telerik:RadDatePicker></td>

                                    <td style="width:25%">Usefull life (Months)<span style="color: red;">*</span></td>
                                    <td style="width:25%">
                                        <asp:UpdatePanel runat="server" ID="upDonorUsefulLife" UpdateMode="Conditional">
                                            <ContentTemplate>
                                                <asp:TextBox runat="server" ID="txtDonorUsefulLife"></asp:TextBox>
<%--                                        <asp:RegularExpressionValidator ID="txtDonorUsefulLife" ControlToValidate="txtUsefulLife" runat="server"
                                                ErrorMessage="Only Numbers allowed" ValidationExpression="\d+"/>--%>
                                            </ContentTemplate>
                                        </asp:UpdatePanel>
                                    </td>
                                </tr>
                                
                                <tr>
                                    <td style="width:25%">Image</td>
                                    <td style="width:25%">
                                        <a href="" runat="server" id="aDnonorImageFile" onserverclick="aDnonorImageFile_ServerClick">
                                            <asp:Label runat="server" ID="lblFileUploadDonorImage" ></asp:Label>
                                        </a>
                                    </td>
                                    <td style="width:50%" colspan="2">
                                        <asp:FileUpload runat="server" ID="fileUploadDonorImage" ClientIDMode="Static"/>
                                        <asp:Button ID="btnUploadDonorImage" Text="Upload" runat="server" OnClick="btnUploadDonorImage_Click" Style="display: none" />
                                    </td>
                                </tr>
                            </table>

                        </telerik:RadWizardStep>

						<telerik:RadWizardStep ID="stepDonor" Title="Donor Information" Enabled="false" ImageUrl="../../img/KPITargetMissed.png">
                            <table style="width:99%">
                                <tr>
                                    <td style="width:25%">Donation Date<span style="color: red;">*</span></td>
                                    <td style="width:25%">
                                        <telerik:RadDatePicker ID="datDonorDonationDate" runat="server" DateInput-DateFormat="dd/MM/yyyy" 
                                                DateInput-DisplayDateFormat="dd/MM/yyyy" DatePopupButton-Visible="false" ShowPopupOnFocus="true">
                                        </telerik:RadDatePicker></td>
                                    <td style="width:25%"></td>
                                    <td style="width:25%"></td>
                                </tr>
                                <tr>
                                    <td style="width:25%">Donor Name/ Company Name/ Parastatal Name<span style="color: red;">*</span></td>
                                    <td style="width:25%"><asp:TextBox runat="server" ID="txtDonorName"></asp:TextBox></td>
                                    <td style="width:25%">Upload File<span style="color: red;">*</span></td>
                                    <td style="width:25%"></td>
                                </tr>
                                <tr>
                                    <td style="width:25%">Donor ID/ Company Registration Number/ Parastatal Code<span style="color: red;">*</span></td>
                                    <td style="width:25%"><asp:TextBox runat="server" ID="txtDonorID"></asp:TextBox></td>
                                    <td style="width:50%" colspan="2">
                                        <a href="" runat="server" id="aDonorFile" onserverclick="aDonorFile_ServerClick"><asp:Label runat="server" ID="lblDonorFileName"></asp:Label></a>
                                        <asp:FileUpload runat="server" ID="fileDonor" ClientIDMode="Static"/><%--width="90px" --%>
                                        <asp:Button ID="btnUploadDonor" Text="Upload" runat="server" OnClick="btnUploadDonor_Click" Style="display: none" />
                                    </td>
                                    <%--<td style="width:25%"></td>--%>
                                </tr>
                            </table>
                        </telerik:RadWizardStep>

                        <telerik:RadWizardStep runat="server" ID="stepDonorFinancial" Title="Financial Information" Enabled="false" ImageUrl="../../img/KPITargetMissed.png">
                                        
                          
                            <table style="width:99%">
                                <tr>
                                    <td style="width:25%">Asset Value<span style="color: red;">*</span></td>
                                    <td style="width:25%"><asp:TextBox runat="server" ID="txtDonorAssetValue"/></td>
                                    <td style="width:25%"></td>
                                    <td style="width:25%"></td>
                                </tr>
                                <tr>
                                    <td style="width:25%">Planning Project (Dt)<span style="color: red;">*</span></td>
                                    <td style="width:25%"><asp:DropDownList runat="server" ID="lstDonorPlanningProjectDt" OnSelectedIndexChanged="lstDonorPlanningProjectDt_SelectedIndexChanged" AutoPostBack="true"></asp:DropDownList></td>
                                    <td style="width:25%"></td>
                                    <td style="width:25%"></td>
                                </tr>
                               <tr>
                                    <td style="width:25%">SCOA Item (Dt)<span style="color: red;">*</span></td>
                                    <td style="width:25%"><asp:DropDownList runat="server" ID="lstDonorScoaITemDt"></asp:DropDownList></td>
                                    <td style="width:25%"></td>
                                    <td style="width:25%"></td>
                                </tr>
                                <tr>
                                    <td style="width:25%">Planning Project (Ct)<span style="color: red;">*</span></td>
                                    <td style="width:25%"><asp:DropDownList runat="server" ID="lstDonorPlanningProjectCt" OnSelectedIndexChanged="lstDonorPlanningProjectCt_SelectedIndexChanged" AutoPostBack="true"></asp:DropDownList></td>
                                    <td style="width:25%"></td>
                                    <td style="width:25%"></td>
                                </tr>
                                <tr>
                                    <td style="width:25%">SCOA Item (Ct)<span style="color: red;">*</span></td>
                                    <td style="width:25%"><asp:DropDownList runat="server" ID="lstDonorScoaITemCt"></asp:DropDownList></td>
                                    <td style="width:25%"></td>
                                    <td style="width:25%"></td>
                                </tr>
                            </table>
                        </telerik:RadWizardStep>
                        
                        <telerik:RadWizardStep runat="server" ID="stepDonorOwnership" Title="Asset Ownership" Enabled="false"  ImageUrl="../../img/KPITargetMissed.png">
                            <table style="width:99%">
                                <tr>
                                    <td style="width:25%">Department<span style="color: red;">*</span></td>
                                    <td style="width:25%"><asp:DropDownList runat="server" ID="lstDonorDepartment" AutoPostBack="true" OnSelectedIndexChanged="lstDepartment_SelectedIndexChanged"/></td>
                                    <td style="width:25%">Division<span style="color: red;">*</span></td>
                                    <td style="width:25%"><asp:DropDownList runat="server" ID="lstDonorDivision"></asp:DropDownList></td>
                                </tr>
                   
                                <tr>
                                    <td style="width:25%">Custodian<span style="color: red;">*</span></td>
                                    <td style="width:25%"><asp:DropDownList runat="server" ID="lstDonorCustodian" AutoPostBack="true" OnSelectedIndexChanged="lstCustodian_SelectedIndexChanged"></asp:DropDownList></td>
                                    <td style="width:25%">Custodian ID Number<span style="color: red;">*</span></td>
                                    <td style="width:25%"><asp:TextBox runat="server" ID="txtDonorCustodianNumber" ReadOnly="true"></asp:TextBox></td>
                                </tr>
                    
                                <tr>
                                    <td style="width:25%">Asset Ownership<span style="color: red;">*</span></td>
                                    <%--<td style="width:25%"><asp:DropDownList runat="server" ID="lstDonorOwership"></asp:DropDownList></td>--%>
                                    <td style="width:25%"><asp:TextBox runat="server" ID="txtDonorAssetOwner"></asp:TextBox></td>
                                    <td style="width:25%"></td>
                                    <td style="width:25%"></td>
                                </tr>
                                <tr>
                                    <td style="width:25%">Capturer<span style="color: red;">*</span></td>
                                    <td style="width:25%"><asp:TextBox runat="server" ID="txtDonorCapturer" ReadOnly="true"/></td>
                                </tr>
                            </table>
                        </telerik:RadWizardStep>

                        <telerik:RadWizardStep runat="server" ID="stepDonorLocation" Title="Asset Location" Enabled="false" ImageUrl="../../img/KPITargetMissed.png">
                            <table style="width:99%">
                                <tr>
                                    <td style="width:16.5%">Latitude</td><%--<span style="color: red;">*</span></td>--%>
                                    <td style="width:16.5%"><asp:TextBox runat="server" ID="txtDonorLatittude"/></td>
                                    <td style="width:16.5%">Longitude</td><%--<span style="color: red;">*</span></td>--%>
                                    <td style="width:16.5%"><asp:TextBox runat="server" ID="txtDonorLogitude"/></td>
                                    <td style="width:16.5%"></td>
                                    <td style="width:16.5%"></td>
                                </tr>
                                <%--<tr>
                                    <td style="width:16.5%">GIS Feature</td>
                                    <td style="width:16.5%"><asp:TextBox runat="server" ID="txtDonorGISFeature"/></td>
                                    <td style="width:16.5%">SG Number</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstDonorSG"/></td>
                                    <td style="width:16.5%"></td>
                                    <td style="width:16.5%"></td>
                                </tr>--%>
                            <%--</table>
                            <table style="width:99%">--%>
                                <tr>
                                    <td style="width:16.5%">Town<span style="color: red;">*</span></td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstDonorTown" OnSelectedIndexChanged="lstTown_SelectedIndexChanged" AutoPostBack="true"/></td>
                                    <td style="width:16.5%">Suburb</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstDonorSuburb" OnSelectedIndexChanged="lstSuburb_SelectedIndexChanged" AutoPostBack="true"/></td>
                                    <%--<td style="width:16.5%">Site Number</td>
                                    <td style="width:16.5%"><asp:TextBox runat="server" ID="txtDonorSite"/></td>--%>
                                    <td style="width:16.5%"></td>
                                    <td style="width:16.5%"></td>
                                </tr>
                                <tr>
                                    <%--<td style="width:16.5%">Zone</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstDonorZone"/></td>--%>
                                    <td style="width:16.5%">Ward</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstDonorWard"/></td>
                                    <td style="width:16.5%">Street Address</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstDonorStreet" AutoPostBack="true" OnSelectedIndexChanged="lstStreet_SelectedIndexChanged"/></td>
                                    <td style="width:16.5%"></td>
                                    <td style="width:16.5%"></td>
                                </tr>
                                <tr>
                                    <td style="width:16.5%">Building</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstDonorBuilding" AutoPostBack="true" OnSelectedIndexChanged="lstBuilding_SelectedIndexChanged"/></td>
                                    <td style="width:16.5%">Floor Description</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstDonorFloor" AutoPostBack="true" OnSelectedIndexChanged="lstFloor_SelectedIndexChanged"/></td>
                                    <td style="width:16.5%">Room Number</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstDonorRoom"/></td>
                                </tr>
                            </table>
                        </telerik:RadWizardStep>

                    </WizardSteps>
                </telerik:RadWizard>
				
				<div  runat="server" id="divDonorNavButtons">
                    <asp:Button runat="server" ID="btnDonorPrev" Text="Previous" Visible="false" OnClick="btnDonorPrev_Click" Width="64px" />
                    <asp:Button runat="server" ID="btnDonorNext" Text="Next" Visible="true" OnClick="btnDonorNext_Click" Width="64px" BackColor="#1484cf" ForeColor="White" BorderColor="DarkBlue" />
                    <asp:Button runat="server" ID="btnDonorSubmit" Text="Submit" Visible="false" OnClick="btnDonorSubmit_Click" Width="64px" BackColor="Black" ForeColor="White" BorderColor="Black" />
                </div>
			</div>

        </div>
      
    </div>
    <div id="modQuestion" class="modal" role="dialog">
		<div class="modal-dialog">
			<!-- Modal content-->
			<div class="modal-content">
				<div class="modal-header">
					<h4 class="modal-title">
					Asset Acquisitionsition<button type="button" class="close ml-auto" style="float:right" data-dismiss="modal">&times;</button>
					</h4>
				</div>
				<div class="modal-body">
					<asp:Label ID="lblQuestion" runat="server" Text="Are you sure?"></asp:Label>
                    <%--<td style="width:16.5%">Zone</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstDonorZone"/></td>--%>
				</div>
				<div class="modal-footer">
                    <%--<td style="width:16.5%">Zone</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstDonorZone"/></td>--%>
					<asp:Button CssClass="btn btn-default buttonEnd" OnClick="btnDialogOK_Click" ID="btnDialogOK" Text="Yes" runat="server" Width="50px"/>
                    <%--<td style="width:16.5%">Zone</td>
                                    <td style="width:16.5%"><asp:DropDownList runat="server" ID="lstDonorZone"/></td>--%>
					<asp:Button CssClass="btn btn-default buttonEnd" ID="btnDialogClose" Text="No" runat="server" OnClick="btnDialogClose_Click" Width="50px"/>
				</div>
			</div>

		</div>
	</div>
</asp:Content>
