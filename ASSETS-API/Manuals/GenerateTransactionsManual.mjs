// GenerateTransactionsManual.mjs — Full detail, Acquisitions-level
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle,
  ShadingType, PageBreak, Header, Footer, PageNumberElement, ImageRun,
  TableOfContents, StyleLevel
} from "docx";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const NAVY="1E3A5F",GOLD="D4A843",WHITE="FFFFFF",BLACK="000000",LIGHT_GREY="F2F2F2",
  LIGHT_BLUE="EEF3FB",WARN_BG="FFFBEB",WARN_BORD="D4A843",NOTE_BORD="2563EB",
  GREEN_BG="F0FDF4",GREEN_BORD="16A34A",RED_BG="FEF2F2",RED_BORD="DC2626";

const h1=t=>new Paragraph({heading:HeadingLevel.HEADING_1,spacing:{before:480,after:200},children:[new TextRun({text:t,bold:true,size:34,color:NAVY,font:"Calibri"})]});
const h2=t=>new Paragraph({heading:HeadingLevel.HEADING_2,spacing:{before:320,after:160},children:[new TextRun({text:t,bold:true,size:28,color:NAVY,font:"Calibri"})]});
const h3=t=>new Paragraph({heading:HeadingLevel.HEADING_3,spacing:{before:240,after:100},children:[new TextRun({text:t,bold:true,size:24,color:"2C4A7C",font:"Calibri"})]});
const p=(t,o={})=>new Paragraph({spacing:{after:o.after??120},children:[new TextRun({text:t,size:o.size||22,bold:o.bold||false,italics:o.italics||false,font:o.font||"Calibri",color:o.color||BLACK})]});
const bl=(t,l=0)=>new Paragraph({bullet:{level:l},spacing:{after:60},children:[new TextRun({text:t,size:22,font:"Calibri"})]});
const num=(t,l=0)=>new Paragraph({numbering:{reference:"default-numbering",level:l},spacing:{after:80},children:[new TextRun({text:t,size:22,font:"Calibri"})]});
const space=()=>new Paragraph({spacing:{after:140},children:[]});
const tip=(title,text)=>new Paragraph({spacing:{after:160,before:80},border:{left:{style:BorderStyle.SINGLE,size:8,color:WARN_BORD}},indent:{left:360},shading:{type:ShadingType.SOLID,color:WARN_BG},children:[new TextRun({text:`${title}  `,bold:true,size:20,color:"92400E",font:"Calibri"}),new TextRun({text,size:20,font:"Calibri",color:"78350F"})]});
const note=(title,text)=>new Paragraph({spacing:{after:160,before:80},border:{left:{style:BorderStyle.SINGLE,size:8,color:NOTE_BORD}},indent:{left:360},shading:{type:ShadingType.SOLID,color:LIGHT_BLUE},children:[new TextRun({text:`${title}  `,bold:true,size:20,color:"1D4ED8",font:"Calibri"}),new TextRun({text,size:20,font:"Calibri",color:"1E3A8A"})]});
const success=(title,text)=>new Paragraph({spacing:{after:160,before:80},border:{left:{style:BorderStyle.SINGLE,size:8,color:GREEN_BORD}},indent:{left:360},shading:{type:ShadingType.SOLID,color:GREEN_BG},children:[new TextRun({text:`${title}  `,bold:true,size:20,color:"166534",font:"Calibri"}),new TextRun({text,size:20,font:"Calibri",color:"14532D"})]});
const warn=(title,text)=>new Paragraph({spacing:{after:160,before:80},border:{left:{style:BorderStyle.SINGLE,size:8,color:RED_BORD}},indent:{left:360},shading:{type:ShadingType.SOLID,color:RED_BG},children:[new TextRun({text:`${title}  `,bold:true,size:20,color:"991B1B",font:"Calibri"}),new TextRun({text,size:20,font:"Calibri",color:"7F1D1D"})]});
const stepBanner=(n,tot,title)=>new Paragraph({spacing:{before:240,after:120},shading:{type:ShadingType.SOLID,color:NAVY},children:[new TextRun({text:`  STEP ${n} OF ${tot} — `,bold:true,size:24,color:GOLD,font:"Calibri"}),new TextRun({text:title.toUpperCase(),bold:true,size:24,color:WHITE,font:"Calibri"})]});
const thin={style:BorderStyle.SINGLE,size:1,color:"CCCCCC"};
const bords={top:thin,bottom:thin,left:thin,right:thin};
const hCell=(text,width)=>new TableCell({width:width?{size:width,type:WidthType.PERCENTAGE}:undefined,shading:{type:ShadingType.SOLID,color:NAVY},borders:bords,children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text,bold:true,size:20,color:WHITE,font:"Calibri"})]})]});
const dc=(text,opts={})=>new TableCell({width:opts.width?{size:opts.width,type:WidthType.PERCENTAGE}:undefined,shading:opts.shade?{type:ShadingType.SOLID,color:opts.shade}:undefined,borders:bords,columnSpan:opts.span,children:[new Paragraph({alignment:opts.align||AlignmentType.LEFT,children:[new TextRun({text:text||"",bold:opts.bold||false,italics:opts.italics||false,size:20,font:"Calibri",color:opts.color||BLACK})]})]});
function ref2(rows){return new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:rows.map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined,width:35}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined,width:65})]}))});}
function fieldRow(label,required,description,shade){return new TableRow({children:[dc(label,{bold:true,shade,width:28}),dc(required?"Required":"Optional",{shade,align:AlignmentType.CENTER,color:required?"166534":"6B7280",bold:required,width:15}),dc(description,{shade,width:57})]});}
function img(filename,w=560,h=340){const path=join(__dirname,"screenshots",filename);if(!existsSync(path))return null;return new Paragraph({spacing:{before:80,after:120},alignment:AlignmentType.CENTER,children:[new ImageRun({data:readFileSync(path),transformation:{width:w,height:h},type:"jpg"})]});}
function caption(text){return new Paragraph({spacing:{after:280},alignment:AlignmentType.CENTER,children:[new TextRun({text,size:18,italics:true,color:"666666",font:"Calibri"})]});}
function coverPage(){return[
  new Paragraph({children:[new TextRun({text:'',size:48})],spacing:{before:1600}}),
  new Paragraph({children:[new TextRun({text:'Asset Management System',bold:true,size:52,color:NAVY,allCaps:true,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:400}}),
  new Paragraph({children:[new TextRun({text:'TRANSACTIONS',bold:true,size:64,color:NOTE_BORD,allCaps:true,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:120}}),
  new Paragraph({children:[new TextRun({text:'User Manual',size:48,color:"475569",font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:600}}),
  new Paragraph({children:[new TextRun({text:'─'.repeat(60),color:"E2E8F0",size:22,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:200}}),
  ...([['System','MFMA/GRAP/mSCOA Asset Management'],['Module','Transactions — Depreciation, Disposal, Impairment, Revaluation'],['Compliance','GRAP 17, GRAP 21, GRAP 26, mSCOA v6.4, MFMA'],['Version','1.0'],['Prepared for','Asset Management System'],['Classification','Internal Use']]).map(([k,v])=>ref2([[k,v]])).flat(),
  new Paragraph({children:[new TextRun({text:'',size:24})],spacing:{before:600}}),
  new Paragraph({children:[new PageBreak()]}),
];}
function toc(){return[h1("Table of Contents"),new TableOfContents("Table of Contents",{hyperlink:true,headingStyleRange:"1-3",stylesWithLevels:[new StyleLevel("Heading1",1),new StyleLevel("Heading2",2),new StyleLevel("Heading3",3)]}),new Paragraph({children:[new PageBreak()]})];}

function buildChildren(){
  const txnImg=img("transactions.jpg",560,340);
  return[
    ...coverPage(),
    ...toc(),

    h1("1. Introduction"),
    p("The Transactions module is the financial processing engine of the Asset Management System. It allows authorised users to execute the six principal asset transaction types: Depreciation, Disposal, Impairment, Impairment Reversal, Revaluation, and Cost Adjustment. Every transaction creates an auditable financial record and must be approved through the Workflow Inbox before it updates the asset's financial balances."),
    space(),
    h2("1.1  Transaction Types Overview"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Transaction Type",28),hCell("GRAP Reference",18),hCell("Description",54)]}),
      ...[
        ["Depreciation Run","GRAP 17.56-66","Calculates and posts the periodic depreciation charge for all assets based on their useful life, method, and in-service date. Executed monthly or quarterly."],
        ["Disposal","GRAP 17.67-72","Records the removal of an asset from the register (sale, write-off, donation, destruction). Updates the asset status and reverses carrying amount."],
        ["Impairment","GRAP 21 / 26","Records a reduction in an asset's carrying amount when its recoverable service amount falls below its book value."],
        ["Impairment Reversal","GRAP 21.64-66","Reverses a previously recognised impairment when the asset's recoverable service amount recovers."],
        ["Revaluation","GRAP 17.39-47","Adjusts the gross cost and accumulated depreciation of a Revaluation Model asset to reflect fair value."],
        ["Cost Adjustment","GRAP 17.29","Adjusts the capitalised cost of an asset when a subsequent expenditure increases the asset's future economic benefits beyond original expectations."],
      ].map(([a,b,c],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined,align:AlignmentType.CENTER}),dc(c,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    h2("1.2  Who Uses Transactions"),
    ref2([
      ["Finance Officer / Asset Accountant","Initiates depreciation runs, captures disposal details, and enters impairment assessments."],
      ["Finance Manager","Reviews and approves all transactions in the Workflow Inbox before they update asset balances."],
      ["CFO","Approves high-value disposals, revaluations, and impairments. Reviews transaction reports."],
      ["Internal Auditor","Reviews the transaction audit log to verify completeness and accuracy of all financial events."],
    ]),
    space(),
    h2("1.3  Approval Requirement"),
    p("Every transaction created in this module enters a Pending state and must be approved in the Workflow Inbox before it takes effect. Approvals can be set to Manual (each transaction individually) or Automated (bulk approval at month-end) in Organisation Settings."),
    space(),
    warn("WARNING:","Transactions that remain in Pending state do NOT update the asset's carrying amount or the reports. Always ensure pending transactions are approved promptly to keep the asset register current."),
    new Paragraph({children:[new PageBreak()]}),

    h1("2. Navigating to Transactions"),
    p("Click Transactions in the left-hand navigation sidebar. The Transactions module opens to a tabbed interface with one tab per transaction type."),
    space(),
    txnImg ? txnImg : space(),
    txnImg ? caption("Figure 1 — Transactions module showing the tab navigation and depreciation run panel.") : space(),
    space(),
    h2("2.1  Transaction Module Layout"),
    p("The Transactions screen has the following structure:"),
    bl("Tab Bar: A row of tabs across the top — Depreciation, Disposals, Impairment, Impairment Reversal, Revaluation, Cost Adjustments. Click a tab to switch to that transaction type."),
    bl("Filter and Controls Area: Below the tab bar, filter controls specific to that transaction type appear."),
    bl("Transaction List: The main table showing all transactions of the selected type, with their status and key details."),
    bl("New Transaction Button: In the top-right of the relevant tab, an Add or Run button initiates a new transaction."),
    new Paragraph({children:[new PageBreak()]}),

    h1("3. Depreciation Runs"),
    p("Depreciation is the systematic allocation of an asset's cost over its useful life. The system calculates depreciation automatically using the Straight-Line Method (or Diminishing Balance for applicable assets) and posts the result for each asset."),
    space(),
    h2("3.1  When to Run Depreciation"),
    bl("At the end of each financial period (monthly close)."),
    bl("Depreciation should only be run once per period. Running it twice in the same period results in double-depreciation — a material error."),
    bl("If a period was missed, depreciation can be backdated by selecting the correct period in the run form."),
    space(),
    h2("3.2  Depreciation Run Fields"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Field",28),hCell("Required",15),hCell("Description",57)]}),
      fieldRow("Financial Year",true,"The financial year for which this depreciation run is being executed. Defaults to the active financial year.",LIGHT_GREY),
      fieldRow("Financial Period",true,"The period (1–12) for which depreciation is being calculated. Period 1 = July (first month of the South African municipal financial year).",undefined),
      fieldRow("Run Date",true,"The date on which the depreciation is being processed. Usually the last day of the financial period.",LIGHT_GREY),
      fieldRow("Asset Type Filter",false,"Optional. Run depreciation for all asset types (default) or for a specific asset type only.",undefined),
      fieldRow("Depreciation Method",false,"Filter by depreciation method: Straight-Line (default) or Diminishing Balance.",LIGHT_GREY),
      fieldRow("GL Processing Month",true,"The calendar month in which the depreciation will be posted to the general ledger (e.g. March 2025).",undefined),
    ]}),
    space(),
    h2("3.3  Running Depreciation — Step by Step"),
    stepBanner(1,5,"Select the Depreciation Tab"),
    p("In the Transactions module, click the Depreciation tab. The depreciation run form and the list of previous runs appear."),
    space(),
    stepBanner(2,5,"Configure the Run Parameters"),
    p("Set the Financial Year, Financial Period, and Run Date. Verify the GL Processing Month is correct. Leave the asset type filter empty to run for all assets."),
    space(),
    stepBanner(3,5,"Preview Before Running"),
    p("Click the Preview button to see a summary of how many assets will be included and the total estimated depreciation amount. Review this before committing. Check that the asset count matches expectations."),
    space(),
    stepBanner(4,5,"Execute the Run"),
    p("Click Run Depreciation. The system calculates depreciation for each eligible asset and creates individual depreciation transaction records with a status of Pending Approval."),
    space(),
    stepBanner(5,5,"Approve in Workflow Inbox"),
    p("Navigate to the Workflow Inbox. Find the depreciation batch for the period just run. Review the total and approve. Once approved, all individual asset balances update and the Dashboard depreciation chart reflects the new amount."),
    space(),
    warn("WARNING:","Never run depreciation for the same period twice. If you accidentally run it twice, navigate to the Workflow Inbox, reject the duplicate batch, and notify the system administrator to reverse the duplicate postings before approval."),
    space(),
    note("NOTE:","Assets that have reached zero remaining useful life (fully depreciated) are automatically excluded from future depreciation runs. They remain in the asset register with a carrying value of zero (or a defined residual value)."),
    space(),
    h2("3.4  Depreciation Calculation Method"),
    p("The Straight-Line Method (most common) calculates depreciation as:"),
    p("Annual Depreciation = (Cost − Residual Value) ÷ Useful Life in Years", {bold:true}),
    p("Monthly Depreciation = Annual Depreciation ÷ 12"),
    space(),
    p("Depreciation for a period is calculated based on the number of days the asset was in service during that period relative to the total days in the year. For assets placed in service mid-period, only the days from the in-service date to the period end are depreciated."),
    new Paragraph({children:[new PageBreak()]}),

    h1("4. Disposals"),
    p("A disposal transaction records the formal removal of an asset from the Fixed Asset Register. GRAP 17 requires that an asset be derecognised when it is sold, donated, exchanged, destroyed, or determined to be permanently unserviceable."),
    space(),
    h2("4.1  Disposal Types"),
    ref2([
      ["Sale","Asset is sold to a third party. The sale proceeds are recorded and a profit or loss on disposal is calculated."],
      ["Write-Off","Asset has been destroyed, lost, or is irreparably damaged. No sale proceeds. Full derecognition at book value."],
      ["Donation","Asset is donated to another institution (e.g. a charity or another government entity). Typically at zero proceeds."],
      ["Transfer","Asset is transferred to another municipal department or entity at carrying value."],
      ["Scrapping","Asset has reached end of physical life and is physically scrapped. May generate a small scrap value."],
    ]),
    space(),
    h2("4.2  Disposal Form Fields"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Field",28),hCell("Required",15),hCell("Description",57)]}),
      fieldRow("Asset",true,"Select the asset to be disposed. Search by ID or description.",LIGHT_GREY),
      fieldRow("Disposal Type",true,"Select the disposal method: Sale, Write-Off, Donation, Transfer, Scrapping.",undefined),
      fieldRow("Disposal Date",true,"The actual date on which the disposal occurred (date of sale/destruction/transfer).",LIGHT_GREY),
      fieldRow("Sale Proceeds",false,"The amount received from selling the asset. Required for Sale disposal type. Leave blank for Write-Off or Donation.",undefined),
      fieldRow("Financial Year",true,"The financial year to which this disposal belongs.",LIGHT_GREY),
      fieldRow("Financial Period",true,"The mSCOA period to which this disposal is allocated.",undefined),
      fieldRow("Disposal Reason",true,"A free-text reason for the disposal. Required for audit purposes.",LIGHT_GREY),
      fieldRow("Supporting Document",false,"Upload the disposal authority document (Council resolution, CFO approval letter, damaged asset report).",undefined),
      fieldRow("Buyer / Recipient",false,"For Sale or Donation disposals, the name of the buyer or receiving institution.",LIGHT_GREY),
    ]}),
    space(),
    h2("4.3  Disposal — Step by Step"),
    stepBanner(1,4,"Open the Disposal Form"),
    p("In the Transactions module, click the Disposals tab, then click the Add Disposal button."),
    space(),
    stepBanner(2,4,"Select the Asset and Complete the Form"),
    p("Search for and select the asset to be disposed. Select the disposal type and complete all required fields. Upload the supporting approval document."),
    space(),
    stepBanner(3,4,"Review the Disposal Summary"),
    p("Before submitting, review the disposal summary which shows the current carrying value, accumulated depreciation, and the calculated profit or loss on disposal based on the proceeds entered."),
    space(),
    stepBanner(4,4,"Submit and Approve"),
    p("Click Submit. The disposal enters Pending Approval status in the Workflow Inbox. After CFO approval, the asset status changes to Disposed and the asset is removed from active depreciation."),
    space(),
    warn("WARNING:","A disposal cannot be reversed after it has been approved. If a disposal is approved in error, a Prior Year Adjustment must be raised to re-instate the asset. This requires CFO sign-off."),
    new Paragraph({children:[new PageBreak()]}),

    h1("5. Impairment"),
    p("An impairment transaction records a reduction in an asset's carrying amount when an impairment indicator suggests the asset's recoverable service amount is less than its book value. Impairment is governed by GRAP 21 (non-cash-generating assets) and GRAP 26 (cash-generating assets)."),
    space(),
    h2("5.1  Impairment Indicators"),
    p("The following events typically trigger an impairment assessment:"),
    bl("Physical damage to the asset (e.g. flood damage to buildings, accident damage to vehicles)."),
    bl("Significant change in the way the asset is used or expected to be used."),
    bl("Evidence that the asset's performance is significantly worse than expected."),
    bl("Plans to discontinue or restructure operations using the asset."),
    bl("Legal proceedings or disputes affecting the asset's continued use."),
    bl("Significant decrease in the asset's market value."),
    space(),
    h2("5.2  Impairment Form Fields"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Field",28),hCell("Required",15),hCell("Description",57)]}),
      fieldRow("Asset",true,"The asset to be impaired. Search by ID or description.",LIGHT_GREY),
      fieldRow("Impairment Date",true,"The date on which the impairment is recognised.",undefined),
      fieldRow("Impairment Amount",true,"The Rand amount by which the carrying value is to be reduced. Must not exceed the current carrying value.",LIGHT_GREY),
      fieldRow("Recoverable Service Amount",true,"The estimated amount the municipality can recover from the asset through its continued use. Must be less than the current carrying amount to trigger impairment.",undefined),
      fieldRow("Impairment Reason",true,"Detailed explanation of why the impairment is being recognised. Reference the impairment indicator.",LIGHT_GREY),
      fieldRow("Valuation Reference",false,"Reference to the professional valuation report, engineer's assessment, or insurance assessment used to determine the recoverable service amount.",undefined),
      fieldRow("Financial Period",true,"The period to which the impairment is allocated.",LIGHT_GREY),
    ]}),
    space(),
    h2("5.3  Impairment Reversal"),
    p("If circumstances that caused an impairment have partially or fully reversed (e.g. the asset is repaired or the economic conditions improve), the impairment can be reversed up to the original carrying amount that would have applied had the impairment never been recognised. Use the Impairment Reversal tab to record this."),
    new Paragraph({children:[new PageBreak()]}),

    h1("6. Revaluation"),
    p("A revaluation transaction adjusts the carrying amount of a Revaluation Model asset to its current fair value. Revaluations must be performed regularly (as per the municipality's revaluation policy, typically every 3–5 years for Infrastructure assets)."),
    space(),
    h2("6.1  Revaluation Process Overview"),
    p("GRAP 17.39 requires that assets carried under the Revaluation Model be revalued with sufficient regularity that the carrying amount does not differ materially from fair value at the reporting date. The revaluation process:"),
    bl("Resets the gross carrying amount (cost) to the new fair value."),
    bl("Proportionally restates the accumulated depreciation."),
    bl("Recognises any surplus in a Revaluation Surplus (equity) account."),
    bl("Recognises any deficit (reversal of surplus) directly in equity, and any excess as an expense."),
    space(),
    h2("6.2  Revaluation Form Fields"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Field",28),hCell("Required",15),hCell("Description",57)]}),
      fieldRow("Asset",true,"The asset to be revalued. Only Revaluation Model assets are selectable in this form.",LIGHT_GREY),
      fieldRow("Revaluation Date",true,"The date of the revaluation. Must match the date of the valuation report.",undefined),
      fieldRow("New Fair Value",true,"The total fair value of the asset as determined by a professional valuer.",LIGHT_GREY),
      fieldRow("New Useful Life (Months)",false,"If the revaluation changes the remaining useful life estimate, enter the revised useful life here.",undefined),
      fieldRow("Valuer Name",true,"Name and registration number of the professional valuer who conducted the revaluation.",LIGHT_GREY),
      fieldRow("Valuation Method",true,"The valuation approach used: Depreciated Replacement Cost, Market Value, or Income Approach.",undefined),
      fieldRow("Valuation Report Reference",true,"Reference number of the formal valuation report. The report must be uploaded as a supporting document.",LIGHT_GREY),
    ]}),
    space(),
    note("NOTE:","Only assets with a Measurement Type of Revaluation Model can be processed through the Revaluation transaction type. Cost Model assets cannot be revalued — they must be measured at historical cost less accumulated depreciation."),
    new Paragraph({children:[new PageBreak()]}),

    h1("7. Cost Adjustments"),
    p("A cost adjustment (also called a subsequent expenditure transaction) records additional capital expenditure incurred on an existing asset that increases its future economic benefits beyond the originally assessed standard. Only expenditure that meets the capitalisation criteria under GRAP 17.29 should be captured here."),
    space(),
    h2("7.1  Capitalisation Criteria"),
    p("Subsequent expenditure should only be capitalised (added to the asset cost) if it:"),
    bl("Extends the asset's useful life beyond its original estimate, OR"),
    bl("Increases the asset's capacity or capability beyond its originally assessed standard, OR"),
    bl("Significantly improves the quality of the asset's output."),
    p("Routine maintenance and repairs that simply restore the asset to its original condition must be expensed to the Income Statement, not capitalised."),
    space(),
    h2("7.2  Cost Adjustment Fields"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Field",28),hCell("Required",15),hCell("Description",57)]}),
      fieldRow("Asset",true,"The asset whose cost is being adjusted.",LIGHT_GREY),
      fieldRow("Adjustment Date",true,"The date of the additional expenditure or completion of the improvement.",undefined),
      fieldRow("Adjustment Amount",true,"The Rand amount to be added to the asset cost.",LIGHT_GREY),
      fieldRow("Revised Useful Life (Months)",false,"If the improvement extends the useful life, enter the new total useful life here. Leave blank if useful life is unchanged.",undefined),
      fieldRow("Capitalisation Reason",true,"Explanation of why this expenditure qualifies for capitalisation under GRAP 17. Reference the specific improvement made.",LIGHT_GREY),
      fieldRow("Supporting Document",false,"Upload the invoice, engineer's report, or other evidence supporting the capitalisation decision.",undefined),
    ]}),
    space(),
    warn("WARNING:","Incorrectly capitalising routine repairs is a common audit finding. Before capturing a cost adjustment, obtain written confirmation from the Asset Manager or Finance Manager that the expenditure meets the GRAP 17.29 capitalisation criteria."),
    new Paragraph({children:[new PageBreak()]}),

    h1("8. Transaction List and Audit Trail"),
    p("Each tab in the Transactions module shows a list of all transactions of that type, including both pending and approved items. This list is the complete audit trail for each transaction type."),
    space(),
    h2("8.1  Transaction List Columns"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Column",25),hCell("Description",75)]}),
      ...[
        ["Transaction ID","System-generated unique identifier for this transaction."],
        ["Asset ID","The ID of the asset this transaction relates to."],
        ["Description","The asset description."],
        ["Amount","The Rand amount of the transaction."],
        ["Transaction Date","The date of the financial event."],
        ["Period","The mSCOA financial period."],
        ["Financial Year","The financial year of the transaction."],
        ["Captured By","The username of the person who created the transaction."],
        ["Capture Date","The date and time the transaction was saved in the system."],
        ["Status","Pending Approval, Approved, or Rejected."],
        ["Actions","View detail (eye icon) and, for Pending items, a Cancel button."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    h2("8.2  Cancelling a Pending Transaction"),
    p("A transaction in Pending Approval status can be cancelled by the original capturer before it is approved. Once a transaction is Approved, it cannot be cancelled — a correcting transaction or Prior Year Adjustment must be raised."),
    space(),
    num("Find the pending transaction in the transaction list."),
    num("Click the Cancel button on the transaction row."),
    num("Confirm the cancellation in the dialog that appears."),
    num("The transaction status changes to Cancelled and is excluded from all financial calculations."),
    new Paragraph({children:[new PageBreak()]}),

    h1("9. Month-End Close Checklist for Transactions"),
    p("The following transaction-related steps should be completed each month as part of the period-end close:"),
    space(),
    num("Run depreciation for the current period (Transactions → Depreciation → Run)."),
    num("Approve the depreciation batch in the Workflow Inbox."),
    num("Confirm all disposals for the period have been captured and approved."),
    num("Confirm all new impairments and reversals for the period have been processed and approved."),
    num("Reconcile the Transaction module totals against the general ledger control accounts."),
    num("Review the Dashboard to confirm the depreciation chart shows a bar for the just-closed period."),
    num("Print or export the Depreciation Schedule report for the period as a filing copy."),
    space(),
    success("MONTH-END SUCCESS:","All monthly transaction steps are complete when: the depreciation chart shows bars for every period through to the current month, no transactions remain in Pending Approval status in the Workflow Inbox, and the Reconciliation module shows a zero variance between the asset register and the general ledger."),
    new Paragraph({children:[new PageBreak()]}),

    h1("10. Common Questions and Troubleshooting"),
    ref2([
      ["Depreciation run produced zero results","Check that there are active assets in the register with an in-service date before the run date. Confirm the financial year and period are correct."],
      ["I ran depreciation for the wrong period","Cancel the pending batch in the Workflow Inbox before approving. If already approved, raise a Prior Year Adjustment to reverse the incorrect entry."],
      ["A disposal is showing a large profit on disposal","The asset may have been over-depreciated or the sale proceeds entered are much higher than expected. Verify the sale amount and the current carrying value before approving."],
      ["Impairment amount is being rejected","The impairment amount cannot exceed the asset's current carrying amount. Reduce the impairment to the carrying value if the asset is to be written down to zero."],
      ["Revaluation tab is disabled for my selected asset","The asset is classified as Cost Model. Only Revaluation Model assets can be revalued. Check the asset's Measurement Type in Asset Records."],
      ["The approved transaction is not updating the asset's carrying amount","Verify the Approve Status in the Asset Records transaction history. If still showing Pending, the batch may not have been fully approved in the Workflow Inbox."],
      ["I cannot find a transaction I captured yesterday","Check the financial period filter — the transaction may be filtered out. Also check that you are looking at the correct tab (Depreciation, Disposals, etc.)."],
    ]),
  ];
}

(async()=>{
  const doc=new Document({
    numbering:{config:[{reference:"default-numbering",levels:[{level:0,format:"decimal",text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:360,hanging:260}}}}]}]},
    styles:{paragraphStyles:[{id:"Normal",name:"Normal",run:{font:"Calibri",size:22,color:BLACK}}]},
    sections:[{
      headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"Asset Management System — Transactions User Manual",size:18,color:"888888",font:"Calibri"})]})]})},
      footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Asset Management System — Confidential  |  Page ",size:18,color:"888888",font:"Calibri"}),new TextRun({children:[new PageNumberElement()],size:18,color:"888888",font:"Calibri"})]})]})},
      children:buildChildren()
    }]
  });
  const buf=await Packer.toBuffer(doc);
  writeFileSync(join(__dirname,"Transactions_UserManual.docx"),buf);
  console.log("✓ Transactions_UserManual.docx written");
})();
