<%@ Page Title="" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Manage.aspx.cs" Async="true"
    Inherits="FMSWebApp.Assets.MultiYear.Manage" EnableEventValidation="false" %>

<%@ Register Src="~/Assets/Controls/Search.ascx" TagPrefix="AssetControl" TagName="Search" %>
<%@ Register Src="~/Assets/Controls/AssetProperties.ascx" TagPrefix="AssetControl" TagName="AssetProperties" %>
<%@ Register Assembly="FMSWebApp" Namespace="FMSControls" TagPrefix="FMS" %>

<asp:Content ID="Content1" ContentPlaceHolderID="HeadContent" runat="server">

    <script type="text/javascript">

        function showhidePage(show) {
            debugger;
            if (show)
                document.getElementById('<%=divPage.ClientID%>').style.visibility = "visible";
            else
                document.getElementById('<%=divPage.ClientID%>').style.visibility = "hidden";
        }

        function ShowUpdated(saywhat) {
            debugger;

            CloseModalPopup();
            ShowAlertDialogBox(saywhat);

        }

        function CloseModalPopup() {
            $('#modQuestion').modal('hide');
            return false;
        }

        function openModal() {
            $('#modQuestion').modal('show');
        }

        function openBase64InNewTab(data, mimeType, filename) {

            debugger;

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
            <h3>
                <asp:Label ID="lblHeader1" runat="server" Text="Manage Assets"></asp:Label>
            </h3>
            <hr />
        </div>

        <div class="sixcol last">
        </div>
        <div style="width: 100%"></div>

        <telerik:RadWizard runat="server" ID="wizTop"
            RenderMode="Lightweight" DisplayProgressBar="false" DisplayNavigationButtons="false" Width="100%"
            OnActiveStepChanged="wizTop_ActiveStepChanged">
            <WizardSteps>
                <telerik:RadWizardStep runat="server" ID="stepEdit" Title="Edit Asset Items" ImageUrl="../../img/KPITargetMissed.png">
                </telerik:RadWizardStep>
                <telerik:RadWizardStep runat="server" ID="stepApprove" Title="Approval of Asset Items" ImageUrl="../../img/KPITargetMissed.png">
                </telerik:RadWizardStep>

            </WizardSteps>
        </telerik:RadWizard>

        <div class="twelvecol last" style="display: none" id="divMessage" runat="server">
            <label id="lblMessage" runat="server" class="note">
            </label>
        </div>

        <asp:UpdatePanel runat="server" ID="upSearch" UpdateMode="Conditional" ChildrenAsTriggers="True">
            <ContentTemplate>
                <div runat="server" id="divSearch">
                    <AssetControl:Search runat="server" ID="AssetSearch1" />
                </div>
            </ContentTemplate>
        </asp:UpdatePanel>

        <asp:UpdatePanel runat="server" ID="updatePanelMain" UpdateMode="Conditional" ChildrenAsTriggers="True">
            <ContentTemplate>

                <div id="divPage" runat="server">
                    <%--                    <asp:UpdatePanel runat="server" ID="upTabs" UpdateMode="Conditional" ChildrenAsTriggers="True">
                        <ContentTemplate>--%>


                    <telerik:RadWizard runat="server" ID="wizStripMain"
                        RenderMode="Lightweight" DisplayProgressBar="false" DisplayNavigationButtons="false" Width="100%"
                        OnActiveStepChanged="wizStripMain_ActiveStepChanged">
                        <%--OnClientButtonClicked="onClientStepClicked"--%>
                        <%--runat="server" OnTabClick="tabStripMain_TabClick" AutoPostBack="true"--%>
                        <%--MultiPageID="RadMultiPage1" SelectedIndex="0" Skin="Silk" Width="100%">--%>

                        <WizardSteps>

                            <telerik:RadWizardStep runat="server" ID="stepDetails" Title="Asset Details" Enabled="true" ImageUrl="../../img/KPITargetMissed.png">

                                <asp:UpdatePanel runat="server" ID="upProperties" UpdateMode="Conditional" ChildrenAsTriggers="True">
                                    <ContentTemplate>
                                        <AssetControl:AssetProperties runat="server" ID="AssetProperties1" />
                                    </ContentTemplate>
                                </asp:UpdatePanel>

                                <table style="width: 99%">

                                    <tr>
                                        <td style="width: 16%">
                                            <label>Basic Municipal Services</label></td>
                                        <td style="width: 16%">
                                            <asp:DropDownList runat="server" ReadOnly="true" ID="lstMunicipalityServices" AutoPostBack="true"></asp:DropDownList>

                                        </td>
                                        <td style="width: 16%">
                                            <label>Criticality Grade</label>
                                        </td>
                                        <td style="width: 16%">
                                            <asp:DropDownList runat="server" ReadOnly="true" ID="lstCriticalityGrade" AutoPostBack="true"></asp:DropDownList>
                                        </td>
                                        <td style="width: 16%">
                                            <label>Performance Grade</label>
                                        </td>
                                        <td style="width: 16%">
                                            <asp:DropDownList runat="server" ReadOnly="true" ID="lstPerformanceGrade" AutoPostBack="true"></asp:DropDownList>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="width: 16%">
                                            <label>Utilisation Grade</label>
                                        </td>
                                        <td style="width: 16%">
                                            <asp:DropDownList runat="server" ReadOnly="true" ID="lstUtilisationGrade" AutoPostBack="true"></asp:DropDownList>
                                        </td>
                                        <td style="width: 16%">
                                            <label>Infrastructure Health Care</label>
                                            <%--<span runat="server" id="spanMeasure" visible="false" style="color: red;">*</span>--%>
                                        </td>
                                        <td style="width: 16%">
                                            <asp:DropDownList runat="server" ReadOnly="true" ID="lstInfrastructureHealthGrade" AutoPostBack="true"></asp:DropDownList>
                                        </td>
                                        <td style="width: 16%">
                                            <label>Consequence of Failure</label>
                                        </td>
                                        <td style="width: 16%">
                                            <asp:DropDownList runat="server" ReadOnly="true" ID="lstConsequenceOfFailure" AutoPostBack="true"></asp:DropDownList>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="width: 16%">
                                            <label>Risk</label></td>
                                        <td style="width: 16%">
                                            <asp:DropDownList runat="server" ReadOnly="true" ID="lstRisk" AutoPostBack="true"></asp:DropDownList>
                                        </td>
                                        <td colspan="4"></td>
                                    </tr>
                                    <tr>
                                        <td colspan="6">
                                            <hr />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="width: 16%">
                                            <label>Cash/Non Cash Generating</label><span runat="server" visible="false" id="span13" style="color: red;">*</span>
                                        </td>
                                        <td style="width: 16%">
                                            <asp:DropDownList runat="server" ReadOnly="true" ID="lstCashGenerating" AutoPostBack="true"></asp:DropDownList>
                                        </td>
                                        <td style="width: 16%">
                                            <label>Financial Status</label>
                                            <%--<span runat="server" id="spanMeasure" visible="false" style="color: red;">*</span>--%>
                                        </td>
                                        <td>
                                            <asp:DropDownList runat="server" ReadOnly="true" ID="lstFinancialStatus" AutoPostBack="true"></asp:DropDownList>
                                        </td>
                                        <td>
                                            <label>Asset Condition</label><span style="color: red;">*</span></td>
                                        <td>
                                            <asp:DropDownList ID="lstCondition" runat="server" AutoPostBack="true"></asp:DropDownList></td>
                                    </tr>
                                </table>
                                <hr />
                                <table style="width: 99%">
                                    <tr>
                                        <td style="width: 16.5%">Acquisition Date<span style="color: red;">*</span></td>
                                        <td style="width: 16.5%">
                                            <telerik:RadDatePicker ID="datAcuisition" runat="server" DateInput-DateFormat="dd/MM/yyyy"></telerik:RadDatePicker>
                                        </td>
                                        <td style="width: 16.5%">Verification Date<span style="color: red;">*</span></td>
                                        <td style="width: 16.5%">
                                            <telerik:RadDatePicker ID="datVerificationDate" runat="server" DateInput-DateFormat="dd/MM/yyyy">
                                            </telerik:RadDatePicker>
                                        </td>
                                        <td style="width: 16.5%">Usefull life (Months)<span style="color: red;">*</span></td>
                                        <td style="width: 16.5%">
                                            <asp:TextBox runat="server" ID="txtUsefulLife" AutoPostBack="True" OnTextChanged="txtUsefulLife_TextChanged" ReadOnly="True"></asp:TextBox>
                                            <asp:RegularExpressionValidator ID="retxtUsefulLife" ControlToValidate="txtUsefulLife" runat="server"
                                                ErrorMessage="Only Numbers allowed" ValidationExpression="\d+" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="width: 16.5%">In Service Date<span style="color: red;">*</span></td>
                                        <td style="width: 16.5%">
                                            <telerik:RadDatePicker ID="datInService" runat="server" DateInput-DateFormat="dd/MM/yyyy">
                                            </telerik:RadDatePicker>
                                        </td>
                                        <td style="width: 16.5%">Verification by<span style="color: red;">*</span></td>
                                        <td style="width: 16.5%">
                                            <asp:DropDownList ID="lstVerifyID" runat="server" AutoPostBack="true" OnSelectedIndexChanged="lstCustodian_SelectedIndexChanged">
                                            </asp:DropDownList>
                                        </td>
                                        <td>Remaining Usefull life</td>
                                        <td>
                                            <asp:TextBox ID="txtUsefulLifeRemain" TextMode="Number" runat="server" Enabled="True"></asp:TextBox>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="width: 16.5%">Commissioning Date</td>
                                        <td style="width: 16.5%">
                                            <telerik:RadDatePicker ID="datCommDate" runat="server" Enabled="False" DateInput-DateFormat="dd/MM/yyyy">
                                            </telerik:RadDatePicker>
                                        </td>
                                        <td style="width: 16.5%"></td>
                                        <td style="width: 16.5%"></td>
                                        <td style="width: 16.5%">
                                            <asp:Label ID="lblDepreciation" runat="server">Last Depreciated</asp:Label>
                                        </td>
                                        <td style="width: 16.5%">
                                            <span style="color: red;">
                                                <asp:Label ID="lblShowDepreciationMsg" runat="server"></asp:Label>
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                                <hr />
                                <table style="width: 99%">
                                    <tr>
                                        <td style="width: 16.5%">Unit of Measure</td>
                                        <td style="width: 16.5%">
                                            <asp:DropDownList runat="server" ID="lstUOM"></asp:DropDownList></td>
                                        <%--<asp:TextBox runat="server" id="txtUOM"></asp:TextBox>--%>
                                        <td style="width: 16.5%">Dimension Quantity</td>
                                        <td style="width: 16.5%">
                                            <asp:TextBox runat="server" TextMode="Number" ID="txtDimQuantity" />
                                        </td>
                                        <td style="width: 16.5%">Quantity</td>
                                        <td style="width: 16.5%">
                                            <asp:TextBox ID="txtQuantity" TextMode="Number" runat="server" />
                                        </td>

                                    </tr>
                                    <tr>
                                        <td style="width: 16.5%">Dimension 1</td>
                                        <td style="width: 16.5%">
                                            <asp:TextBox ID="txtDim1" TextMode="Number" runat="server" />
                                        </td>
                                        <td style="width: 16.5%">Dimension 2</td>
                                        <td style="width: 16.5%">
                                            <asp:TextBox ID="txtDim2" TextMode="Number" runat="server" />
                                        </td>
                                        <td style="width: 16.5%">Dimension 3</td>
                                        <td style="width: 16.5%">
                                            <asp:TextBox ID="txtDim3" TextMode="Number" runat="server" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="width: 16.5%">Construction Material</td>
                                        <td style="width: 16.5%">
                                            <asp:TextBox ID="txtConstMaterial" runat="server" />
                                        </td>
                                        <td style="width: 16.5%">Diameter</td>
                                        <td style="width: 16.5%">
                                            <asp:TextBox ID="txtDiameter" runat="server" />

                                        </td>
                                        <td style="width: 16.5%">Capacity</td>
                                        <td style="width: 16.5%">
                                            <asp:TextBox ID="txtCapacity" runat="server" />

                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="width: 16.5%">&nbsp;</td>
                                        <td style="width: 16.5%">&nbsp;</td>
                                        <td style="width: 16.5%"></td>
                                        <td style="width: 16.5%"></td>
                                        <td style="width: 16.5%"></td>
                                        <td style="width: 16.5%"></td>
                                    </tr>
                                    <tr>
                                        <td style="width: 16.5%">Image</td>
                                        <td style="width: 16.5%">
                                            <a href="" runat="server" id="aImage" onserverclick="btnShowImage_Click">
                                                <asp:Label runat="server" ID="lblShowImage"></asp:Label>
                                            </a>
                                        </td>
                                        <td style="width: 50%" colspan="2">
                                            <iframe runat="server" id="framImgeFile" src="fileupload.aspx?fn=21" style="width: 100%; height: 38px;" scrolling="no"></iframe>
                                        </td>
                                    </tr>
                                </table>
                            </telerik:RadWizardStep>

                            <telerik:RadWizardStep runat="server" ID="stepFinancial" Title="Financial Information" Enabled="true" ImageUrl="../../img/KPITargetMissed.png">

                                <asp:UpdatePanel runat="server" ID="UpdatePanel1" UpdateMode="Conditional" ChildrenAsTriggers="True">
                                    <ContentTemplate>
                                        <AssetControl:AssetProperties runat="server" ID="AssetProperties2" />
                                    </ContentTemplate>
                                </asp:UpdatePanel>


                                <table style="width: 99%">

                                    <tr>
                                        <td style="width: 25%">Funding Source Amount</td>
                                        <td style="width: 25%">
                                            <asp:TextBox runat="server" ID="txtFundingSourceAmount" ReadOnly="true" /></td>
                                        <td style="width: 25%">Cost Closing Amount</td>
                                        <td style="width: 25%">
                                            <asp:TextBox runat="server" ID="txtCostClosing" ReadOnly="true" /></td>
                                    </tr>
                                    <tr>
                                        <td style="width: 25%">Accumulated Depreciation Closing Balance</td>
                                        <td style="width: 25%">
                                            <asp:TextBox runat="server" ID="txtDeprecClosing" ReadOnly="true" /></td>
                                        <td style="width: 25%">Depreciation - Current Year</td>
                                        <td style="width: 25%">
                                            <asp:TextBox runat="server" ID="txtDeprecYear" ReadOnly="true" /></td>
                                    </tr>
                                    <tr>
                                        <td style="width: 25%">Depreciation Offset Closing Balance</td>
                                        <td style="width: 25%">
                                            <asp:TextBox runat="server" ID="txtDeprecOffsetClosing" ReadOnly="true" /></td>
                                        <td style="width: 25%">Deemed Cost</td>
                                        <td style="width: 25%">
                                            <asp:TextBox runat="server" ID="txtDeemedCost" ReadOnly="true" /></td>
                                    </tr>
                                    <tr>
                                        <td style="width: 25%">Accumulated Impairment Closing Balance</td>
                                        <td style="width: 25%">
                                            <asp:TextBox runat="server" ID="txtImpairmentClosing" ReadOnly="true" /></td>
                                        <td style="width: 25%">Impairment - Current Year</td>
                                        <td style="width: 25%">
                                            <asp:TextBox runat="server" ID="txtImpairmentYear" ReadOnly="true" /></td>
                                    </tr>
                                    <tr>
                                        <td style="width: 25%">Impairment Date</td>
                                        <td style="width: 25%">
                                            <asp:TextBox runat="server" ID="txtImpairmentDate" ReadOnly="true" /></td>
                                        <td style="width: 25%">Reversal of Impairment Loss</td>
                                        <td style="width: 25%">
                                            <asp:TextBox runat="server" ID="txtReversalImpairmentLoss" ReadOnly="true" /></td>
                                    </tr>
                                    <tr>
                                        <td style="width: 25%">RevaluationDate</td>
                                        <td style="width: 25%">
                                            <asp:TextBox runat="server" ID="txtRevaluationDate" ReadOnly="true" /></td>
                                        <td style="width: 25%">MovementInRevaluationReserve</td>
                                        <td style="width: 25%">
                                            <asp:TextBox runat="server" ID="txtMovementInRevaluationReserve" ReadOnly="true" /></td>
                                    </tr>
                                    <tr>
                                        <td style="width: 25%">Revaluation Reserve Closing Balance</td>
                                        <td style="width: 25%">
                                            <asp:TextBox runat="server" ID="txtRevaluationReserveClosing" ReadOnly="true" /></td>
                                        <td style="width: 25%">Revaluation - Current Year</td>
                                        <td style="width: 25%">
                                            <asp:TextBox runat="server" ID="txtRevaluationYear" ReadOnly="true" /></td>
                                    </tr>
                                    <tr>
                                        <td style="width: 25%">Asset Value - Carrying Amount</td>
                                        <td style="width: 25%">
                                            <asp:TextBox runat="server" ID="txtCarryingAmount" ReadOnly="true" /></td>
                                        <td style="width: 25%">Residual Value</td>
                                        <td style="width: 25%">
                                            <asp:TextBox runat="server" ID="txtResidualValue" ReadOnly="true"/></td>
                                    </tr>
                                    <tr>
                                        <td style="width: 25%">Current Replacement Cost (CRC)</td>
                                        <td style="width: 25%">
                                            <asp:TextBox runat="server" ID="txtReplacementValue" ReadOnly="true" /></td>
                                        <td style="width: 25%">Depreciated Replacement Cost (DRC)</td>
                                        <td style="width: 25%">
                                            <asp:TextBox ID="txtDepreciatedReplacement" runat="server" ReadOnly="true" />
                                    </tr>
                                    <tr>
                                        <td style="width: 25%">Forecast Replacement Year</td>
                                        <td style="width: 25%">
                                            <asp:TextBox ID="txtForecastReplacementYear" runat="server" />
                                        </td>
                                        <td style="width: 25%">Annualised Maintenance Percentage CRC</td>
                                        <td style="width: 25%">
                                            <asp:TextBox ID="txtMaintenacePercentage" runat="server" ReadOnly="true" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="width: 25%">Annualised Maintenance Budget Forecast Amount</td>
                                        <td style="width: 25%">
                                            <asp:TextBox ID="txtMaintenaceBudget" runat="server" />
                                        </td>
                                        <td style="width: 25%">Funding Source Number</td>
                                        <td style="width: 25%">
                                            <asp:TextBox ID="txtFundingSourceNo" runat="server" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="width: 25%">Funding Source</td>
                                        <td style="width: 25%">
                                            <asp:TextBox ID="txtFundingSource" runat="server" />
                                        </td>
                                        <td style="width: 25%">Funding Type</td>
                                        <td style="width: 25%">
                                            <asp:TextBox ID="txtFundingType" runat="server" />
                                        </td>
                                    </tr>
                                </table>
                                <hr />
                                <table style="width: 99%">
                                    <tr>

                                        <td style="width: 25%">Insurance Cover</td>
                                        <td style="width: 25%">
                                            <asp:DropDownList ID="lstInsuranceCover" runat="server">
                                            </asp:DropDownList>
                                        </td>
                                        <td style="width: 25%">Insured Amount</td>
                                        <td style="width: 25%">
                                            <asp:TextBox ID="txtInsuredAmount" runat="server" />
                                        </td>
                                    </tr>

                                    <tr>
                                        </td>
                                        <td style="width: 25%">Insurance Policy No</td>
                                        <td style="width: 25%">
                                            <asp:TextBox ID="txtInsureanceRefNo" runat="server" />
                                        </td>
                                        <td style="width: 25%">Warranty</td>
                                        <td style="width: 25%">
                                            <asp:DropDownList ID="lstWarranty" runat="server">
                                            </asp:DropDownList>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="width: 100%" colspan="4">&nbsp;</td>
                                    </tr>
                                    <tr>
                                        <td style="width: 25%">Document</td>
                                        <td style="width: 25%">
                                            <a id="aInsureanceDoc" runat="server" href="" onserverclick="btnInsuranceDocView_Click">
                                                <asp:Label ID="lblInsuranceDocView" runat="server" />
                                            </a>
                                        </td>
                                        <td style="width: 25%" colspan="2">
                                            <iframe id="framInsFile" runat="server" scrolling="no" src="fileupload.aspx?fn=22" style="width: 100%; height: 38px;"></iframe>
                                        </td>

                                    </tr>
                                </table>
                            </telerik:RadWizardStep>

                            <telerik:RadWizardStep runat="server" ID="stepOwnership" Title="Asset Ownership" Enabled="true" ImageUrl="../../img/KPITargetMissed.png">

                                <asp:UpdatePanel runat="server" ID="UpdatePanel2" UpdateMode="Conditional" ChildrenAsTriggers="True">
                                    <ContentTemplate>
                                        <AssetControl:AssetProperties runat="server" ID="AssetProperties3" />
                                    </ContentTemplate>
                                </asp:UpdatePanel>


                                <asp:UpdatePanel runat="server" ID="upDepartment" UpdateMode="Conditional" ChildrenAsTriggers="True">
                                    <ContentTemplate>
                                        <table style="width: 99%">
                                            <tr>
                                                <td style="width: 25%">Department<span style="color: red;">*</span></td>
                                                <td style="width: 25%">
                                                    <asp:DropDownList runat="server" ID="lstDepartment" AutoPostBack="true" OnSelectedIndexChanged="lstDepartment_SelectedIndexChanged" Enabled="false" /></td>
                                                <td style="width: 25%">Division<span style="color: red;">*</span></td>
                                                <td style="width: 25%">
                                                    <asp:DropDownList runat="server" ID="lstDivision" Enabled="false"></asp:DropDownList></td>
                                            </tr>

                                            <tr>
                                                <td style="width: 25%">Custodian<span style="color: red;">*</span></td>
                                                <td style="width: 25%">
                                                    <asp:DropDownList runat="server" ID="lstCustodian" AutoPostBack="true" OnSelectedIndexChanged="lstCustodian_SelectedIndexChanged"></asp:DropDownList></td>
                                                <td style="width: 25%">Custodian ID Number<span style="color: red;">*</span></td>
                                                <td style="width: 25%">
                                                    <asp:TextBox runat="server" ID="txtCustodianNumber" ReadOnly="true"></asp:TextBox>
                                                    <asp:HiddenField runat="server" ID="hdnCustodianNumber" />
                                                </td>
                                            </tr>

                                            <tr>
                                                <td style="width: 25%">Asset Ownership<span style="color: red;">*</span></td>
                                                <td style="width: 25%">
                                                    <asp:TextBox ID="txtAssetOwnerShip" runat="server"></asp:TextBox>
                                                </td>
                                                <td style="width: 25%"></td>
                                                <td style="width: 25%"></td>
                                            </tr>
                                        </table>
                                    </ContentTemplate>
                                </asp:UpdatePanel>
                                <hr />
                                <asp:UpdatePanel runat="server" ID="upReg" UpdateMode="Conditional">
                                    <ContentTemplate>
                                        <table style="width: 99%">
                                            <tr>
                                                <td style="width: 25%">Deed Number</td>
                                                <td style="width: 25%">
                                                    <asp:TextBox runat="server" ID="txtDeedNumber" /></td>
                                                <td style="width: 25%">Make</td>
                                                <td style="width: 25%">
                                                    <asp:TextBox ID="txtMake" runat="server" />
                                                </td>
                                            </tr>

                                            <tr>
                                                <td style="width: 25%">Erf Number / Farm Number</td>
                                                <td style="width: 25%">
                                                    <asp:TextBox ID="txtErfNumber" runat="server"></asp:TextBox>
                                                </td>
                                                <td style="width: 25%">Model</td>
                                                <td style="width: 25%">
                                                    <asp:TextBox ID="txtModel" runat="server" />
                                                </td>
                                            </tr>

                                            <tr>
                                                <td style="width: 25%">Erf Size m<sub>2</sub></td>
                                                <td style="width: 25%">
                                                    <asp:TextBox ID="txtErfSize" runat="server"></asp:TextBox>
                                                </td>
                                                <td style="width: 25%">Registration Number</td>
                                                <td style="width: 25%">
                                                    <asp:TextBox ID="txtRegNumber" runat="server" />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 25%">Portion Number</td>
                                                <td style="width: 25%">
                                                    <asp:TextBox ID="txtPortionNumber" runat="server" />
                                                </td>
                                                <td style="width: 25%">Serial Number</td>
                                                <td style="width: 25%">
                                                    <asp:TextBox ID="txtSerialNumber" runat="server" />
                                                </td>
                                            </tr>

                                            <tr>
                                                <td style="width: 25%">Unit Number</td>
                                                <td style="width: 25%">
                                                    <asp:TextBox ID="txtUnitNumber" runat="server" />
                                                </td>
                                                <td style="width: 25%">&nbsp;</td>
                                                <td style="width: 25%">&nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td colspan="4">
                                                    <hr />
                                                </td>

                                            </tr>

                                            <tr>
                                                <td style="width: 25%">Donor ID/Registration Number/Parastatal Code</td>
                                                <td style="width: 25%">
                                                    <asp:TextBox ID="txtDonorId" runat="server" />
                                                </td>
                                                <td style="width: 25%">Donor Name / Company Name / Parastatal Name </td>
                                                <td style="width: 25%">
                                                    <asp:TextBox ID="txtDonorName" runat="server" />
                                                </td>

                                            </tr>
                                            <tr>
                                                <td style="width: 25%">Date Donated</td>
                                                <td style="width: 25%">
                                                    <asp:TextBox ID="txtDateDonated" runat="server" />
                                                </td>
                                                <td style="width: 25%">&nbsp;</td>
                                                <td style="width: 25%">&nbsp;</td>
                                            </tr>
                                            <tr>
                                                <td style="width: 25%">Document</td>
                                                <td style="width: 25%">
                                                    <a href="" runat="server" id="a1" onserverclick="adonationDoc_ServerClick">
                                                        <asp:Label runat="server" ID="lbldonationDoc" />
                                                    </a>
                                                </td>
                                                <td style="width: 50%" colspan="2">
                                                    <iframe runat="server" id="framDonFile" src="fileupload.aspx?fn=30" style="width: 100%; height: 38px;" scrolling="no"></iframe>
                                                </td>
                                            </tr>

                                            <tr>
                                                <td style="width: 25%">Capturer<span style="color: red;">*</span></td>
                                                <td style="width: 25%">
                                                    <asp:TextBox runat="server" ID="txtCapturer" ReadOnly="true" /></td>
                                                <td style="width: 25%">Modifier</td>
                                                <td style="width: 25%">
                                                    <asp:TextBox runat="server" ID="txtModifier" ReadOnly="true"></asp:TextBox></td>
                                            </tr>

                                        </table>
                                    </ContentTemplate>
                                </asp:UpdatePanel>
                            </telerik:RadWizardStep>

                            <telerik:RadWizardStep runat="server" ID="stepLocation" Title="Asset Location" Enabled="true" ImageUrl="../../img/KPITargetMissed.png">

                                <asp:UpdatePanel runat="server" ID="UpdatePanel3" UpdateMode="Conditional" ChildrenAsTriggers="True">
                                    <ContentTemplate>
                                        <AssetControl:AssetProperties runat="server" ID="AssetProperties4" />
                                    </ContentTemplate>
                                </asp:UpdatePanel>


                                <asp:UpdatePanel runat="server" ID="upLocation" UpdateMode="Conditional">
                                    <ContentTemplate>
                                        <table style="width: 99%">
                                            <tr>
                                                <td style="width: 25%">&nbsp;</td>
                                                <td style="width: 25%">
                                                    <asp:DropDownList runat="server" ID="lstGIS" Visible="False" /></td>
                                                <td style="width: 25%"></td>
                                                <td style="width: 25%"></td>
                                            </tr>
                                            <tr>
                                                <td style="width: 25%">Latitude</td>
                                                <td style="width: 25%">
                                                    <asp:TextBox runat="server" ID="txtLatittude" /></td>
                                                <td style="width: 25%">Longitude</td>
                                                <%--<span style="color: red;">*</span>--%>
                                                <td style="width: 25%">
                                                    <asp:TextBox runat="server" ID="txtLogitude" /></td>
                                            </tr>
                                            <tr>
                                                <td style="width: 25%">GIS Feature</td>
                                                <td style="width: 25%">
                                                    <asp:TextBox runat="server" ID="txtGISFeature" /></td>
                                                <td style="width: 25%">SG Key</td>
                                                <td style="width: 25%">
                                                    <asp:TextBox runat="server" ID="txtSG" /></td>
                                            </tr>
                                            <tr>
                                                <td style="width: 25%">Well Known Text</td>
                                                <td style="width: 25%">
                                                    <asp:TextBox ID="txtWellKnownText" runat="server" />
                                                </td>
                                                <td style="width: 25%">Map location</td>
                                                <td style="width: 25%">
                                                    <asp:HyperLink ID="btnGIS" runat="server" 
                                                        ImageUrl="../../img/GISGlobe.png"
                                                        NavigateUrl="https://rsa360.co.za/municipalities/Greater%20Tzaneen/indexa.html#20/-23.8325906/30.1543298/-18.4"
                                                        Target="_blank" Width="40px" />
                                                </td>
                                            </tr>
                                        </table>
                                    </ContentTemplate>
                                </asp:UpdatePanel>

                                <hr />
                                <asp:UpdatePanel runat="server" ID="upProvince" UpdateMode="Conditional" ChildrenAsTriggers="True">
                                    <ContentTemplate>

                                        <table style="width: 99%">
                                            <tr>
                                                <td style="width: 25%">Town<span style="color: red;">*</span></td>
                                                <td style="width: 25%">
                                                    <asp:DropDownList runat="server" ID="lstTown" OnSelectedIndexChanged="lstTown_SelectedIndexChanged" AutoPostBack="true" /></td>
                                                <td style="width: 25%">Suburb</td>
                                                <td style="width: 25%">
                                                    <asp:DropDownList runat="server" ID="lstSuburb" OnSelectedIndexChanged="lstSuburb_SelectedIndexChanged" AutoPostBack="true" /></td>
                                            </tr>
                                            <tr>
                                                <td style="width: 25%">Zone</td>
                                                <td style="width: 25%">
                                                    <asp:DropDownList runat="server" ID="lstZone" /></td>
                                                <td style="width: 25%">Ward</td>
                                                <td style="width: 25%">
                                                    <asp:DropDownList runat="server" ID="lstWard" /></td>
                                            </tr>
                                            <tr>
                                                <td style="width: 25%">Street Address</td>
                                                <td style="width: 25%">
                                                    <asp:DropDownList runat="server" ID="lstStreet" AutoPostBack="true" OnSelectedIndexChanged="lstStreet_SelectedIndexChanged" /></td>
                                                <td style="width: 25%">Building</td>
                                                <td style="width: 25%">
                                                    <asp:DropDownList runat="server" ID="lstBuilding" AutoPostBack="true" OnSelectedIndexChanged="lstBuilding_SelectedIndexChanged" /></td>
                                            </tr>
                                            <tr>
                                                <td style="width: 25%">Floor Area</td>
                                                <td style="width: 25%">
                                                    <asp:DropDownList runat="server" ID="lstFloor" AutoPostBack="true" OnSelectedIndexChanged="lstFloor_SelectedIndexChanged" /></td>
                                                <td style="width: 25%">Room Number</td>
                                                <td style="width: 25%">
                                                    <asp:DropDownList runat="server" ID="lstRoom" /></td>
                                            </tr>
                                            <tr>
                                                <td style="width: 25%"></td>
                                                <%--Site Number</td>--%>
                                                <td style="width: 25%">
                                                    <asp:TextBox runat="server" ID="txtSite" Visible="false" /></td>
                                                <td style="width: 25%"></td>
                                                <td style="width: 25%"></td>
                                            </tr>
                                        </table>
                                        <hr />
                                        <table style="width: 99%">
                                            <tr>
                                                <td style="width: 16%">
                                                <asp:Label runat="server" ID="lblCustom1" Text="Custom 1"></asp:Label>
                                                    </td>
                                                <td style="width: 16%">
                                                    <asp:TextBox runat="server" ID="txtCustom1" />
                                                </td>
                                                <td style="width: 16%">
                                                <asp:Label runat="server" ID="lblCustom4" Text="Custom 4"></asp:Label>
                                                    </td>
                                                <td style="width: 16%">
                                                    <asp:TextBox runat="server" ID="txtCustom4" />
                                                </td>
                                                <td style="width: 16%">
                                                <asp:Label runat="server" ID="lblCustom7" Text="Custom 7"></asp:Label>
                                                    </td>
                                                <td style="width: 16%">
                                                    <asp:TextBox runat="server" ID="txtCustom7"  />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 16%">
                                                <asp:Label runat="server" ID="lblCustom2" Text="Custom 2"></asp:Label>
                                                    </td>
                                                <td style="width: 16%">
                                                    <asp:TextBox runat="server" ID="txtCustom2"  />
                                                </td>
                                                <td style="width: 16%">
                                                <asp:Label runat="server" ID="lblCustom5" Text="Custom 5"></asp:Label>
                                                    </td>
                                                <td style="width: 16%">
                                                    <asp:TextBox runat="server" ID="txtCustom5"  />
                                                </td>
                                                <td style="width: 16%">
                                                <asp:Label runat="server" ID="lblCustom8" Text="Custom 8"></asp:Label>
                                                    </td>
                                                <td style="width: 16%">
                                                    <asp:TextBox runat="server" ID="txtCustom8"  />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="width: 16%">
                                                <asp:Label runat="server" ID="lblCustom3" Text="Custom 3"></asp:Label>
                                                    </td>
                                                <td style="width: 16%">
                                                    <asp:TextBox runat="server" ID="txtCustom3" />
                                                </td>
                                                <td style="width: 16%">
                                                <asp:Label runat="server" ID="lblCustom6" Text="Custom 6"></asp:Label>
                                                    </td>
                                                <td style="width: 16%">
                                                    <asp:TextBox runat="server" ID="txtCustom6"  />
                                                </td>
                                                <td style="width: 16%">
                                                <asp:Label runat="server" ID="lblCustom9" Text="Custom 9"></asp:Label>
                                                    </td>
                                                <td style="width: 16%">
                                                    <asp:TextBox runat="server" ID="txtCustom9" />
                                                </td>
                                            </tr>

                                        </table>
                                        <hr />
                                        <table style="width: 99%">
                                            <tr>
                                                <td style="width: 25%">Reason for Change<span style="color: red;">*</span></td>
                                                <td style="width: 25%">
                                                    <asp:TextBox runat="server" ID="txtReason" /></td>
                                                <td style="width: 25%"></td>
                                                <td style="width: 25%"></td>
                                                <td style="width: 25%"></td>
                                                <td style="width: 25%"></td>
                                            </tr>
                                        </table>

                                    </ContentTemplate>
                                </asp:UpdatePanel>

                            </telerik:RadWizardStep>
                        </WizardSteps>
                    </telerik:RadWizard>
                    <%--  </ContentTemplate>
                    </asp:UpdatePanel>--%>

                    <asp:UpdatePanel runat="server" ID="upButtons" UpdateMode="Conditional" ChildrenAsTriggers="True">
                        <ContentTemplate>
                            <div runat="server" id="divButtons">
                                <table>
                                    <tr>
                                        <td>
                                            <asp:Button runat="server" ID="btnBack" Text="Back" OnClick="btnBack_Click" CausesValidation="false" Width="62px" /></td>
                                        <td>
                                            <asp:Button runat="server" ID="btnNext" Text="Next" OnClick="btnNext_Click" CausesValidation="false" BackColor="#1484cf" ForeColor="White" Width="62px" /></td>
                                        <td>
                                            <asp:Button runat="server" ID="btnReject" Text="Reject" OnClick="btnReject_Click" CausesValidation="false" BackColor="Black" ForeColor="White" Width="62px" /></td>
                                        <td>
                                            <asp:Button runat="server" ID="btnSubmit" Text="Submit" OnClick="btnSubmit_Click" CausesValidation="false" BackColor="Black" ForeColor="White" Width="62px" /></td>
                                        <td>
                                            <asp:Button runat="server" ID="btnApp2" Text="Approve" OnClick="btnApprove_Click" CausesValidation="false" BackColor="Black" ForeColor="White" Width="62px" /></td>
                                    </tr>

                                </table>
                            </div>
                        </ContentTemplate>
                        <Triggers>
                            <asp:AsyncPostBackTrigger ControlID="btnNext" />
                            <asp:AsyncPostBackTrigger ControlID="btnBack" />
                            <asp:AsyncPostBackTrigger ControlID="btnReject" />
                            <asp:AsyncPostBackTrigger ControlID="btnApp2" />
                        </Triggers>
                    </asp:UpdatePanel>
                </div>

            </ContentTemplate>
            <Triggers>
            </Triggers>
        </asp:UpdatePanel>

    </div>
    <asp:UpdatePanel runat="server" ID="upDialog" UpdateMode="Conditional">
        <ContentTemplate>

            <div id="modQuestion" class="modal" role="dialog">
                <div class="modal-dialog">
                    <!-- Modal content-->
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title">Information
                                <button type="button" class="close ml-auto" style="float: right" data-dismiss="modal">&times;</button></h4>
                        </div>
                        <div class="modal-body" style="align-content: center">

                            <asp:Label ID="lblQuestion" runat="server" Text="Are you sure you want to Approve the changes made the the Asset Record?"></asp:Label>
                            <%--<FMS:FMSTextbox ID="datQuestion" runat="server" TextType="Date" DateFormat="dd/mm/yy" Text="30/12/2017"></FMS:FMSTextbox>--%>
                        </div>
                        <div class="modal-footer">
                            <%--<button type="button" class="btn btn-default " data-dismiss="modal" onclick="ExecuteMethod();return false;">Yes</button>--%>
                            <asp:Button CssClass="btn btn-default " OnClick="Unnamed_Click" ID="btnExecutePopup" Text="Yes" runat="server" Width="50px" CausesValidation="false" />
                            <%--<button type="button" class="btn btn-default " data-dismiss="modal">Cancel</button>--%>
                            <asp:Button CssClass="btn btn-default " ID="BtnClose" Text="No" runat="server" OnClick="BtnClose_Click" Width="50px" />
                        </div>
                    </div>

                </div>
            </div>

        </ContentTemplate>
        <Triggers>
            <asp:AsyncPostBackTrigger ControlID="btnExecutePopup" EventName="Click" />
        </Triggers>
    </asp:UpdatePanel>

</asp:Content>
