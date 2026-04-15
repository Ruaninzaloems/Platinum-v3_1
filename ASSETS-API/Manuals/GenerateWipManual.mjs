// GenerateWipManual.mjs — Full detail, Acquisitions-level
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
  new Paragraph({children:[new TextRun({text:'WORK IN PROGRESS',bold:true,size:60,color:NOTE_BORD,allCaps:true,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:120}}),
  new Paragraph({children:[new TextRun({text:'User Manual',size:48,color:"475569",font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:600}}),
  new Paragraph({children:[new TextRun({text:'─'.repeat(60),color:"E2E8F0",size:22,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:200}}),
  ...([['System','MFMA/GRAP/mSCOA Asset Management'],['Module','Work In Progress (WIP) — Capital Projects Register'],['Compliance','GRAP 11, GRAP 17, mSCOA v6.4, MFMA'],['Version','1.0'],['Prepared for','Asset Management System'],['Classification','Internal Use']]).map(([k,v])=>ref2([[k,v]])).flat(),
  new Paragraph({children:[new TextRun({text:'',size:24})],spacing:{before:600}}),
  new Paragraph({children:[new PageBreak()]}),
];}
function toc(){return[h1("Table of Contents"),new TableOfContents("Table of Contents",{hyperlink:true,headingStyleRange:"1-3",stylesWithLevels:[new StyleLevel("Heading1",1),new StyleLevel("Heading2",2),new StyleLevel("Heading3",3)]}),new Paragraph({children:[new PageBreak()]})];}

function buildChildren(){
  const wipImg=img("wip.jpg",560,340);
  const wipDetailImg=img("wip-detail.jpg",560,340);
  return[
    ...coverPage(),
    ...toc(),

    h1("1. Introduction"),
    p("The Work In Progress (WIP) module tracks capital expenditure on construction projects, infrastructure upgrades, and multi-period asset development activities before those projects are complete and transferred to the Fixed Asset Register. GRAP 11 requires that such costs be accumulated and disclosed separately from completed assets until the asset is ready for its intended use."),
    space(),
    h2("1.1  What is Work In Progress?"),
    p("Work In Progress (also called Capital Work In Progress or CWIP) represents the accumulated cost of an asset that has not yet been completed. Examples include:"),
    bl("A road construction project that spans multiple financial years."),
    bl("A water reservoir under construction."),
    bl("A municipal building extension that is partially complete."),
    bl("IT infrastructure being configured and installed across multiple periods."),
    p("Until the asset is complete and placed into service, it is classified as WIP and is not depreciated. Once the project is complete, it is transferred from WIP to the Fixed Asset Register and depreciation begins from the in-service date."),
    space(),
    h2("1.2  Who Uses the WIP Module"),
    ref2([
      ["Finance Officer / Capital Accountant","Captures WIP projects, posts expenditure, and initiates transfers to the asset register when projects are complete."],
      ["Asset Manager","Monitors project progress and validates the completeness of project details before transfer."],
      ["CFO / Finance Manager","Reviews WIP balances at period-end and year-end for financial statement disclosures."],
      ["Internal and External Auditors","Reviews WIP project completeness, supporting documents, and transfer justification."],
    ]),
    space(),
    h2("1.3  Compliance Framework"),
    ref2([
      ["GRAP 11","Construction Contracts — governs cost accumulation during construction and the recognition trigger for transferring WIP to PPE."],
      ["GRAP 17","Property, Plant and Equipment — applies once the WIP project is transferred and the asset is placed in service."],
      ["MFMA Section 19","Requires that capital expenditure be correctly classified and that WIP balances are regularly reviewed."],
      ["mSCOA v6.4","WIP must be coded to the correct mSCOA segment codes, separately from operational expenditure."],
    ]),
    new Paragraph({children:[new PageBreak()]}),

    h1("2. Navigating to WIP"),
    p("To access the WIP module, click Work In Progress in the left-hand navigation sidebar. The module opens to the WIP Register — a list of all active and completed capital projects."),
    space(),
    wipImg ? wipImg : space(),
    wipImg ? caption("Figure 1 — The WIP Register showing KPI summary cards, filter controls, and the project list table.") : space(),
    space(),
    h2("2.1  WIP Module KPI Cards"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("KPI Card",35),hCell("Description",65)]}),
      ...[
        ["Total WIP Projects","Total count of all WIP project records regardless of status."],
        ["Total WIP Value","Sum of all expenditure accumulated across all active WIP projects."],
        ["Projects In Progress","Count of projects with a status of In Progress (not yet transferred)."],
        ["Completed / Transferred","Count of projects that have been transferred to the Fixed Asset Register."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    h2("2.2  Filter Controls"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Filter Field",30),hCell("Description",70)]}),
      ...[
        ["Search","Free text search on project name, project number, and description."],
        ["Project Status","Filter by status: In Progress, Completed, Transferred, On Hold, Cancelled."],
        ["Financial Year","Filter projects by the financial year in which they were opened."],
        ["Asset Type","Filter projects by the type of asset being constructed (e.g. Infrastructure, Immovable)."],
        ["Department","Filter by the municipal department responsible for the capital project."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    new Paragraph({children:[new PageBreak()]}),

    h1("3. WIP Project List"),
    p("The WIP Register table lists all capital projects. Each row represents one WIP project record."),
    space(),
    h2("3.1  WIP Register Table Columns"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Column",25),hCell("Description",75)]}),
      ...[
        ["Project ID","System-generated unique identifier for the WIP project."],
        ["Project Name","The name of the capital project (e.g. 'Ward 5 Road Surfacing')."],
        ["Project Number","The municipality's internal project number, often matching the budget vote."],
        ["Description","Detailed description of the scope of work."],
        ["Asset Type","The type of asset expected on completion (e.g. Infrastructure — Roads)."],
        ["Status","Current project status badge: In Progress (blue), Completed (green), Transferred (purple), On Hold (amber), Cancelled (red)."],
        ["Start Date","The date the project commenced."],
        ["Expected Completion","Planned completion date. Highlighted in amber if the date has passed without transfer."],
        ["Accumulated Cost","Total expenditure posted to this project to date."],
        ["Actions","View detail (eye icon), Edit (pencil), and Transfer to Asset Register (arrow icon — only enabled for Completed projects)."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    warn("WARNING:","WIP projects whose Expected Completion date has passed but whose status is still In Progress represent a GRAP 11 disclosure risk. Review these projects at every quarter-end and either update the completion date or initiate the transfer."),
    new Paragraph({children:[new PageBreak()]}),

    h1("4. Creating a New WIP Project"),
    p("A new WIP project record must be created when the municipality begins spending on a capital project that will ultimately produce a new fixed asset. The record is opened at the start of the project and accumulates all related expenditure until completion."),
    space(),
    h2("4.1  New WIP Project Fields"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Field",28),hCell("Required",15),hCell("Description",57)]}),
      fieldRow("Project Name",true,"A clear, descriptive name for the capital project. Include the ward or location where relevant.",LIGHT_GREY),
      fieldRow("Project Number",false,"The municipality's internal capital project number as it appears in the Integrated Development Plan (IDP) or budget.",undefined),
      fieldRow("Description",true,"Detailed description of what is being constructed or developed. Include the scope of work.",LIGHT_GREY),
      fieldRow("Asset Type",true,"The type of asset the project will produce when complete (e.g. Infrastructure, Immovable, Community).",undefined),
      fieldRow("Asset Category",false,"The category of the expected resulting asset. Helps classify the project correctly from the start.",LIGHT_GREY),
      fieldRow("Department",true,"The municipal department responsible for managing this capital project.",undefined),
      fieldRow("Start Date",true,"The date on which project expenditure commenced.",LIGHT_GREY),
      fieldRow("Expected Completion Date",true,"The planned date on which the project will be complete and ready for transfer to the Fixed Asset Register.",undefined),
      fieldRow("Budget Amount",false,"The approved capital budget amount for this project from the capital budget vote.",LIGHT_GREY),
      fieldRow("Contractor / Supplier",false,"The name of the contractor or supplier engaged for the project.",undefined),
      fieldRow("Contract Number",false,"The contract or purchase order number.",LIGHT_GREY),
      fieldRow("Ward / Location",false,"The physical ward and site where the project is located.",undefined),
      fieldRow("GPS Coordinates",false,"Latitude and longitude of the project site for mapping and verification.",LIGHT_GREY),
    ]}),
    space(),
    h2("4.2  Creating a New WIP Project — Step by Step"),
    stepBanner(1,5,"Open the New Project Form"),
    p("In the WIP module, click the Add WIP Project button in the top-right header area. The new project form opens as a panel or modal."),
    space(),
    stepBanner(2,5,"Complete the Project Details"),
    p("Fill in all required fields (marked with an asterisk). At minimum, you need the Project Name, Asset Type, Department, Start Date, and Expected Completion Date. Add optional fields such as Project Number and Budget Amount where known."),
    space(),
    stepBanner(3,5,"Save the Project Record"),
    p("Click Save. The project is assigned a system Project ID and appears in the WIP Register list with a status of In Progress."),
    space(),
    stepBanner(4,5,"Post Expenditure"),
    p("As invoices are received and approved, navigate to the project detail and click Add Expenditure to post each cost line to the project. Each expenditure entry records the date, amount, description, supplier invoice number, and mSCOA project code."),
    space(),
    stepBanner(5,5,"Attach Supporting Documents"),
    p("Upload all project-related documents to the Documents tab: approved capital budget extract, contractor agreement, progress payment certificates, engineer's reports, and completion certificate."),
    space(),
    tip("TIP:","Create the WIP project record as soon as the first expenditure invoice is approved, even before physical construction begins. Do not leave WIP expenditure coded directly to the general ledger without a corresponding WIP project record."),
    new Paragraph({children:[new PageBreak()]}),

    h1("5. Posting Expenditure to a WIP Project"),
    p("Each payment made to a contractor or supplier for a capital project must be posted to the relevant WIP project as an expenditure line. This builds the total accumulated cost of the project."),
    space(),
    h2("5.1  Expenditure Entry Fields"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Field",28),hCell("Required",15),hCell("Description",57)]}),
      fieldRow("Expenditure Date",true,"The date of the payment or journal entry.",LIGHT_GREY),
      fieldRow("Amount",true,"The Rand amount of this specific expenditure line (excluding VAT if applicable).",undefined),
      fieldRow("Description",true,"Brief description of what this payment was for (e.g. 'Progress Payment 3 — Earthworks').",LIGHT_GREY),
      fieldRow("Supplier Invoice Number",false,"The supplier invoice number for this payment. Used for cross-referencing with the Accounts Payable module.",undefined),
      fieldRow("GL Document Number",false,"The general ledger journal voucher number for this expenditure entry.",LIGHT_GREY),
      fieldRow("mSCOA Project Code",false,"The mSCOA Projects segment code linked to this capital expenditure line.",undefined),
      fieldRow("Financial Period",true,"The mSCOA period (1–12) to which this expenditure belongs.",LIGHT_GREY),
      fieldRow("Financial Year",true,"The financial year to which this expenditure belongs.",undefined),
    ]}),
    space(),
    note("NOTE:","All WIP expenditure must be coded to the capital expenditure budget vote and not to the operational expenditure votes. Using the wrong vote code is a material budget deviation that must be disclosed in the annual financial statements."),
    new Paragraph({children:[new PageBreak()]}),

    h1("6. Transferring WIP to the Fixed Asset Register"),
    p("When a capital project is complete and the asset is ready for its intended use, the project must be transferred from WIP to the Fixed Asset Register. This is the most important step in the WIP lifecycle — it converts the accumulated construction cost into a formal asset record that will be depreciated going forward."),
    space(),
    h2("6.1  Prerequisites for Transfer"),
    p("Before initiating a WIP-to-FAR transfer, confirm the following:"),
    bl("The project status is set to Completed."),
    bl("All project expenditure has been posted (the accumulated cost is final)."),
    bl("A completion certificate or engineer's sign-off document is attached to the project."),
    bl("The in-service date (the date the asset was first used) has been determined."),
    bl("The asset classification (type, category, useful life) has been agreed with the Asset Manager."),
    space(),
    h2("6.2  Transfer Process — Step by Step"),
    stepBanner(1,6,"Mark Project as Completed"),
    p("Open the WIP project detail and change the status from In Progress to Completed. Save the change. The Transfer button on the project list becomes active."),
    space(),
    stepBanner(2,6,"Click the Transfer Button"),
    p("Click the Transfer to Asset Register button (arrow icon) on the project row in the WIP list, or the Transfer button in the project detail header."),
    space(),
    stepBanner(3,6,"Complete the Transfer Form"),
    p("The transfer form pre-populates from the WIP project data. Review and complete all asset registration fields: description, classification, in-service date, useful life, depreciation method, and location."),
    space(),
    stepBanner(4,6,"Confirm the Transfer"),
    p("Click Confirm Transfer. The system creates a new Fixed Asset Register item with the WIP accumulated cost as the asset cost, and marks the WIP project as Transferred."),
    space(),
    stepBanner(5,6,"Approve in Workflow Inbox"),
    p("The transfer generates an approval task in the Workflow Inbox. The Finance Manager or CFO must approve the transfer before the new asset appears in the active Fixed Asset Register."),
    space(),
    stepBanner(6,6,"Verify the New Asset"),
    p("Navigate to Asset Records and confirm the new asset appears with the correct details. Navigate back to WIP and confirm the project is marked as Transferred."),
    space(),
    warn("WARNING:","Do not transfer a WIP project before the completion certificate has been issued and the asset has been placed in service. Transferring before the in-service date causes depreciation to start prematurely, resulting in an overstatement of expenses."),
    new Paragraph({children:[new PageBreak()]}),

    h1("7. WIP Project Detail View"),
    p("Clicking on any WIP project in the register opens the Project Detail view. This view shows all project information, expenditure lines, documents, and status history."),
    space(),
    wipDetailImg ? wipDetailImg : space(),
    wipDetailImg ? caption("Figure 2 — WIP Project Detail view showing project information, accumulated expenditure, and action buttons.") : space(),
    space(),
    h2("7.1  Project Detail Sections"),
    ref2([
      ["Project Information","All the identification and classification fields captured when the project was created."],
      ["Financial Summary","Budget amount, accumulated cost to date, and variance (budget vs actual)."],
      ["Expenditure Lines","Itemised list of all cost entries posted to this project, with dates, amounts, and references."],
      ["Project Timeline","Visual timeline showing start date, milestone dates, expected completion, and actual completion."],
      ["Status History","Log of all status changes (e.g. when the project was moved from In Progress to Completed)."],
      ["Documents","Attached project documents including the completion certificate and payment certificates."],
      ["Linked Asset","Once transferred, a link to the Fixed Asset Register item created from this WIP project."],
    ]),
    new Paragraph({children:[new PageBreak()]}),

    h1("8. Bulk WIP Transfer Upload"),
    p("The Bulk Upload module (accessible from the sidebar under Bulk Upload → WIP Transfers) allows Finance to upload multiple WIP-to-FAR transfers at once using an Excel spreadsheet template. This is typically used when migrating from a previous asset management system or when a large batch of projects are completed simultaneously."),
    space(),
    p("For full instructions on the bulk upload process, refer to the Bulk Upload User Manual."),
    space(),
    h2("8.1  When to Use Bulk Upload vs Manual Transfer"),
    ref2([
      ["Use Manual Transfer","For individual projects being completed in the normal course of operations. Manual transfer gives you full control over each asset's classification and details."],
      ["Use Bulk Upload","For migrating large numbers of completed projects from a legacy system, or when multiple projects are completed in the same period and need to be processed simultaneously."],
    ]),
    new Paragraph({children:[new PageBreak()]}),

    h1("9. Year-End Procedures for WIP"),
    p("At financial year-end, the Finance team must perform the following WIP-related procedures as part of the annual financial statements preparation:"),
    space(),
    h2("9.1  Year-End WIP Checklist"),
    num("Run the WIP Ageing Report (Reports module → WIP Ageing) to identify all projects that have been in progress for more than one financial year."),
    num("Review all long-running projects with the relevant department heads. Obtain written confirmation of the completion status."),
    num("Transfer all completed projects to the Fixed Asset Register before the year-end cut-off date."),
    num("Update the status of cancelled or abandoned projects to Cancelled and write off the accumulated cost through a formal journal (approved by CFO)."),
    num("Ensure all expenditure for the year has been posted to the correct WIP projects before the period is closed."),
    num("Reconcile the total WIP balance in the system against the general ledger WIP control account."),
    space(),
    note("NOTE:","GRAP 11 requires that the notes to the annual financial statements disclose the total amount of WIP at year-end and the nature of significant projects. Ensure the WIP module totals match the AFS disclosure."),
    space(),
    success("YEAR-END SUCCESS:","When all completed projects have been transferred, all cancelled projects have been written off, and the WIP module total matches the GL control account balance, your year-end WIP reconciliation is complete and the register is audit-ready."),
    new Paragraph({children:[new PageBreak()]}),

    h1("10. Common Questions and Troubleshooting"),
    ref2([
      ["I cannot find a WIP project","Check that the status filter is set to All or the correct status. Cancelled projects are hidden by default — change the filter to show Cancelled."],
      ["The Transfer button is greyed out","The project status must be set to Completed before the transfer button is enabled. Open the project detail and update the status."],
      ["The accumulated cost is wrong","Check the expenditure lines for duplicate or incorrect entries. Contact the system administrator to reverse a posting if needed."],
      ["The new asset is not appearing after transfer","The transfer is awaiting approval in the Workflow Inbox. Ask the Finance Manager to approve the transfer."],
      ["The budget variance shows a very large negative number","Expenditure has exceeded the approved budget. This is a budget overspend and must be reported to Council under MFMA Section 32. Update the budget figure if an approved budget adjustment has been processed."],
      ["I need to split one WIP project into two assets","Multiple assets can be created from one WIP project through partial transfers. Contact your system administrator to perform a split transfer."],
      ["A project was incorrectly transferred to the wrong asset type","Reverse the transfer using Prior Year Adjustments and re-transfer to the correct classification. This requires CFO approval."],
    ]),
  ];
}

(async()=>{
  const doc=new Document({
    numbering:{config:[{reference:"default-numbering",levels:[{level:0,format:"decimal",text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:360,hanging:260}}}}]}]},
    styles:{paragraphStyles:[{id:"Normal",name:"Normal",run:{font:"Calibri",size:22,color:BLACK}}]},
    sections:[{
      headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"Asset Management System — WIP User Manual",size:18,color:"888888",font:"Calibri"})]})]})},
      footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Asset Management System — Confidential  |  Page ",size:18,color:"888888",font:"Calibri"}),new TextRun({children:[new PageNumberElement()],size:18,color:"888888",font:"Calibri"})]})]})},
      children:buildChildren()
    }]
  });
  const buf=await Packer.toBuffer(doc);
  writeFileSync(join(__dirname,"WIP_UserManual.docx"),buf);
  console.log("✓ WIP_UserManual.docx written");
})();
