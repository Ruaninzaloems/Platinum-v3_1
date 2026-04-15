// GenerateReportsManual.mjs — Full detail, Acquisitions-level
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
function img(filename,w=560,h=340){const path=join(__dirname,"screenshots",filename);if(!existsSync(path))return null;return new Paragraph({spacing:{before:80,after:120},alignment:AlignmentType.CENTER,children:[new ImageRun({data:readFileSync(path),transformation:{width:w,height:h},type:"jpg"})]});}
function caption(text){return new Paragraph({spacing:{after:280},alignment:AlignmentType.CENTER,children:[new TextRun({text,size:18,italics:true,color:"666666",font:"Calibri"})]});}
function coverPage(){return[
  new Paragraph({children:[new TextRun({text:'',size:48})],spacing:{before:1600}}),
  new Paragraph({children:[new TextRun({text:'Asset Management System',bold:true,size:52,color:NAVY,allCaps:true,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:400}}),
  new Paragraph({children:[new TextRun({text:'REPORTS',bold:true,size:72,color:NOTE_BORD,allCaps:true,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:120}}),
  new Paragraph({children:[new TextRun({text:'User Manual',size:48,color:"475569",font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:600}}),
  new Paragraph({children:[new TextRun({text:'─'.repeat(60),color:"E2E8F0",size:22,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:200}}),
  ...([['System','MFMA/GRAP/mSCOA Asset Management'],['Module','Reports — Excel-based Statutory and Management Reports'],['Compliance','GRAP 17, mSCOA v6.4, MFMA, National Treasury Reporting Requirements'],['Version','1.0'],['Prepared for','Asset Management System'],['Classification','Internal Use']]).map(([k,v])=>ref2([[k,v]])).flat(),
  new Paragraph({children:[new TextRun({text:'',size:24})],spacing:{before:600}}),
  new Paragraph({children:[new PageBreak()]}),
];}
function toc(){return[h1("Table of Contents"),new TableOfContents("Table of Contents",{hyperlink:true,headingStyleRange:"1-3",stylesWithLevels:[new StyleLevel("Heading1",1),new StyleLevel("Heading2",2),new StyleLevel("Heading3",3)]}),new Paragraph({children:[new PageBreak()]})];}

function buildChildren(){
  const repImg=img("reports.jpg",560,340);
  return[
    ...coverPage(),
    ...toc(),

    h1("1. Introduction"),
    p("The Reports module is the municipal asset management reporting centre. It provides a library of pre-built, standards-compliant Excel reports that cover all key aspects of the asset register: valuations, depreciation, disposals, financial movements, and mSCOA-coded journals. Every report is generated dynamically from the live database, ensuring the data is always current at the time of generation."),
    space(),
    h2("1.1  Report Delivery Format"),
    p("All reports in this module are delivered as Microsoft Excel workbooks (.xlsx). Each report is formatted with:"),
    bl("A cover sheet showing the municipality name, financial year, period, and report generation date."),
    bl("Data sheets with column headers, formatted cells, and frozen pane navigation."),
    bl("Totals and subtotals where applicable."),
    bl("mSCOA code references where mandated."),
    p("Reports open directly in your browser's download manager or Microsoft Excel. They can be saved, printed, or emailed as required."),
    space(),
    h2("1.2  Who Uses Reports"),
    ref2([
      ["Finance Officer","Generates monthly depreciation schedules and acquisition reports for the working paper file."],
      ["Finance Manager","Generates the Fixed Asset Register (FAR) and Summary reports for management review."],
      ["CFO","Generates year-end statutory reports for the Annual Financial Statements package."],
      ["Internal Auditor","Generates detail-level reports for transaction testing and asset register verification."],
      ["External Auditor (AGSA)","The AGSA will request specific reports — typically the FAR, Depreciation Schedule, and Disposal Report — as part of the audit file."],
    ]),
    new Paragraph({children:[new PageBreak()]}),

    h1("2. The Reports Screen"),
    p("Navigate to the Reports module by clicking Reports in the left-hand navigation sidebar. The screen displays a grid of report cards, each representing one available report type."),
    space(),
    repImg ? repImg : space(),
    repImg ? caption("Figure 1 — The Reports screen showing the grid of available report cards with icons, descriptions, and compliance tags.") : space(),
    space(),
    h2("2.1  Report Card Layout"),
    p("Each report card shows:"),
    bl("Icon and colour: A colour-coded icon identifying the report category (blue for registers, red for disposals, green for depreciation, amber for acquisitions)."),
    bl("Title: The full name of the report."),
    bl("Description: A one-line explanation of what the report contains."),
    bl("Compliance Tags: Coloured tags showing the standards the report satisfies (e.g. GRAP 17, mSCOA, MFMA)."),
    space(),
    p("Click any report card to generate that report. Some reports open filter panels first; others download immediately."),
    new Paragraph({children:[new PageBreak()]}),

    h1("3. Available Reports"),
    p("The following reports are available in this module:"),
    space(),
    h2("3.1  Fixed Asset Register (FAR)"),
    p("The FAR is the master report of the asset register. It lists every active asset with its full classification, financial balances, and lifecycle information. This is the primary statutory report required by National Treasury and the AGSA."),
    space(),
    p("FAR Filter Options:"),
    bl("Financial Year: Select the year to report on."),
    bl("From Period / To Period: Select the reporting period range."),
    bl("Asset Type: Filter to a specific type (or All Types)."),
    bl("Asset Category: Further narrow by category."),
    bl("Sub-Category: Further narrow by sub-category."),
    bl("Measurement Type: Filter by Cost or Revaluation Model."),
    bl("Asset Status: Typically set to Active for the standard FAR. Set to Disposed for the Disposal Register."),
    space(),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("FAR Column",30),hCell("Description",70)]}),
      ...[
        ["Asset ID","System-generated unique identifier."],
        ["Description","Asset name and description."],
        ["Asset Type / Category / Sub-Category","Full classification hierarchy."],
        ["Asset Class","Fourth-level classification."],
        ["Measurement Type","Cost or Revaluation Model."],
        ["Depreciation Method","Straight-line or Diminishing Balance."],
        ["In-Service Date","Date of first use (commissioning)."],
        ["Useful Life (Months)","Original total useful life."],
        ["Remaining Useful Life (Months)","Remaining life at the report date."],
        ["Purchase Amount","Original gross cost."],
        ["Acc Dep Opening Balance","Accumulated depreciation at start of financial year."],
        ["Depreciation Current Year","Total depreciation charged in the selected year."],
        ["Acc Dep Closing Balance","Total accumulated depreciation at end of period."],
        ["Acc Impairment Closing","Total accumulated impairment at end of period."],
        ["Carrying Amount (Closing)","Net book value: Cost minus Acc Dep minus Acc Impairment."],
        ["Asset Status","Active, Disposed, etc."],
        ["Asset Condition","Good, Fair, or Poor."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    tip("TIP:","Generate the FAR at year-end with Period 12 selected and All Types. This is the complete asset register extract required by the AGSA for their opening balance testing."),
    new Paragraph({children:[new PageBreak()]}),

    h2("3.2  Depreciation Schedule"),
    p("The Depreciation Schedule shows every depreciation transaction posted against every asset for the selected financial year and period range. It is the primary report for verifying the depreciation charge in the annual financial statements."),
    space(),
    p("This report contains 36 columns including all identification, classification, financial, and mSCOA coding columns. Key columns include:"),
    bl("Asset ID, Description, Asset Type/Category/Sub-Category/Class."),
    bl("Measurement Type, Asset Status, Asset Condition, Depreciation Method."),
    bl("Document Number (GL journal voucher reference)."),
    bl("In-Service Date, Scheduled Date, Transaction Date."),
    bl("AR Processing Month, GL Processing Month."),
    bl("Useful Life (Months and Days), Remaining Useful Life (Months and Days)."),
    bl("Days from Last Run."),
    bl("Purchase Amount, Acc Dep Opening, Acc Dep Current Year, Acc Dep Closing."),
    bl("Depreciation Value for the selected period."),
    bl("Dep Offset Opening, Dep Offset, Dep Offset Closing."),
    bl("Carrying Value."),
    bl("Plan/Project Debit Code, SCOA Item Code Debit."),
    bl("Plan/Project Credit Code, SCOA Item Code Credit."),
    bl("Approve Status."),
    space(),
    warn("WARNING:","The Depreciation Schedule must only be generated after all depreciation runs for the selected period have been executed AND approved in the Workflow Inbox. A pending depreciation batch will result in an incomplete schedule."),
    space(),
    h2("3.3  Disposal Report"),
    p("The Disposal Report lists all asset disposals (derecognitions) within the selected date range. It shows the disposal method, proceeds, carrying value at disposal, and the resulting profit or loss. This report is required for the AFS notes disclosure on asset disposals."),
    space(),
    p("Disposal Report Filter Options:"),
    bl("Financial Year: The year of the disposals."),
    bl("From Period / To Period: The period range."),
    space(),
    ref2([
      ["Disposal Type","Sale, Write-Off, Donation, Transfer, or Scrapping."],
      ["Asset ID and Description","The disposed asset."],
      ["Disposal Date","Date of derecognition."],
      ["Carrying Value at Disposal","Net book value on the disposal date."],
      ["Sale Proceeds","Amount received (where applicable)."],
      ["Profit / Loss on Disposal","Proceeds minus Carrying Value at Disposal."],
      ["Accumulated Depreciation Derecognised","The depreciation amount reversed on disposal."],
      ["Approval Status","The current approval status of the disposal."],
    ]),
    space(),
    h2("3.4  Acquisitions Report"),
    p("Lists all new assets registered in the selected period, with their classification, cost, and financial details. Used to verify capital expenditure recognised in the period and to support the AFS notes disclosure on additions to PPE."),
    space(),
    h2("3.5  Impairment Report"),
    p("Lists all impairment transactions posted in the selected period. Shows the impairment amount, the asset's carrying value before and after impairment, and the reason for impairment. Required for GRAP 21/26 disclosure in the AFS."),
    space(),
    h2("3.6  Revaluation Report"),
    p("Lists all revaluation transactions for Revaluation Model assets. Shows the old carrying amount, new fair value, revaluation surplus or deficit, and the revised useful life. Required for GRAP 17.39 disclosure."),
    space(),
    h2("3.7  Asset Summary by Type"),
    p("A high-level summary report grouping assets by type and showing total cost, total accumulated depreciation, total accumulated impairment, and total carrying value for each group. Useful for management reporting and budget planning."),
    space(),
    h2("3.8  WIP Ageing Report"),
    p("Shows all open WIP projects grouped by age: less than 6 months, 6–12 months, and over 12 months. Flags projects that are significantly overdue for completion. Required for the AFS WIP notes disclosure."),
    new Paragraph({children:[new PageBreak()]}),

    h1("4. Generating a Report — Step by Step"),
    stepBanner(1,4,"Select the Report"),
    p("Click the report card on the Reports screen for the report you want to generate. If a filter panel is required for that report (e.g. FAR, Depreciation Schedule, Disposal Report), the filter panel expands below the report cards."),
    space(),
    stepBanner(2,4,"Set the Filter Parameters"),
    p("Complete the filter fields in the filter panel. At minimum, set the Financial Year and Period range. Additional filters (Asset Type, Category, Status) are optional but will narrow the report to a specific subset."),
    space(),
    stepBanner(3,4,"Run the Report"),
    p("Click the Run Report button in the filter panel. The system queries the database and generates the Excel file. A download prompt appears in your browser. Click Save or Open to proceed."),
    space(),
    stepBanner(4,4,"Review and File"),
    p("Open the report in Excel. Review the data for completeness and reasonableness. Save the file with a descriptive name including the report name, financial year, and period (e.g. 'FAR_FY2024-25_Period12_30Jun2025.xlsx'). File the report in the designated working paper folder."),
    space(),
    tip("TIP:","For year-end reporting, generate reports in this order: (1) Depreciation Schedule, (2) FAR — Period 12, (3) Disposal Report for the full year, (4) Acquisitions Report for the full year, (5) Asset Summary by Type. This sequence supports the AFS notes drafting process."),
    new Paragraph({children:[new PageBreak()]}),

    h1("5. Reports and the Annual Financial Statements"),
    p("The following table maps each system report to the corresponding AFS disclosure section:"),
    space(),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("AFS Note",35),hCell("Required System Report",65)]}),
      ...[
        ["PPE Roll Forward (Note X)","Fixed Asset Register — Period 12 for closing balances; Period 1 opening = prior year closing."],
        ["Depreciation Charge","Depreciation Schedule — full year, all types."],
        ["Additions to PPE","Acquisitions Report — full financial year."],
        ["Disposals / Derecognitions","Disposal Report — full financial year."],
        ["Impairment Losses","Impairment Report — full financial year."],
        ["Revaluation Surplus Movements","Revaluation Report — full financial year."],
        ["WIP Disclosure","WIP Ageing Report — as at year-end."],
        ["Carrying Value per Asset Class","Asset Summary by Type — Period 12."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    note("NOTE:","All reports must be generated after the period has been fully closed (all transactions approved) and reconciled against the general ledger before being included in the AFS working paper file."),
    new Paragraph({children:[new PageBreak()]}),

    h1("6. Common Questions and Troubleshooting"),
    ref2([
      ["The report downloads but the file is empty","The filter criteria may have returned zero results. Broaden the filters (e.g. select All Types instead of a specific type)."],
      ["The report total does not match the GL","Ensure all transactions for the period have been approved in the Workflow Inbox. Unapproved transactions are not included in reports."],
      ["The Depreciation Schedule shows some assets with zero depreciation","These assets may have already been fully depreciated, or their in-service date falls after the report period. Check the relevant asset records."],
      ["The FAR shows a different carrying value than the Dashboard","The Dashboard and FAR may be using different period cut-offs. Ensure both are set to the same financial year and period."],
      ["I cannot see the filter panel for a report","Some reports do not require filters (e.g. Asset Summary by Type downloads immediately). Others open a filter panel — scroll down below the report cards if the panel is not immediately visible."],
      ["The Excel file is corrupted when I try to open it","This is usually a browser download issue. Try right-clicking the download link and selecting Save As, then opening the saved file."],
    ]),
    space(),
    success("REPORTING SUCCESS:","A complete set of year-end reports has been generated when: the FAR total carrying value matches the GL PPE account balance, the Depreciation Schedule total matches the GL depreciation expense account, and the Disposal Report shows all approved disposals for the year."),
  ];
}

(async()=>{
  const doc=new Document({
    numbering:{config:[{reference:"default-numbering",levels:[{level:0,format:"decimal",text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:360,hanging:260}}}}]}]},
    styles:{paragraphStyles:[{id:"Normal",name:"Normal",run:{font:"Calibri",size:22,color:BLACK}}]},
    sections:[{
      headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"Asset Management System — Reports User Manual",size:18,color:"888888",font:"Calibri"})]})]})},
      footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Asset Management System — Confidential  |  Page ",size:18,color:"888888",font:"Calibri"}),new TextRun({children:[new PageNumberElement()],size:18,color:"888888",font:"Calibri"})]})]})},
      children:buildChildren()
    }]
  });
  const buf=await Packer.toBuffer(doc);
  writeFileSync(join(__dirname,"Reports_UserManual.docx"),buf);
  console.log("✓ Reports_UserManual.docx written");
})();
