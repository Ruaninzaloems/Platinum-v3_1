// GenerateAssetRecordsManual.mjs — Full detail, Acquisitions-level
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
  new Paragraph({children:[new TextRun({text:'ASSET RECORDS',bold:true,size:60,color:NOTE_BORD,allCaps:true,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:120}}),
  new Paragraph({children:[new TextRun({text:'User Manual',size:48,color:"475569",font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:600}}),
  new Paragraph({children:[new TextRun({text:'─'.repeat(60),color:"E2E8F0",size:22,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:200}}),
  ...([['System','MFMA/GRAP/mSCOA Asset Management'],['Module','Asset Records — Asset Register List, Detail, and Verification'],['Compliance','GRAP 17, GRAP 21, GRAP 26, mSCOA v6.4, MFMA'],['Version','1.0'],['Prepared for','Asset Management System'],['Classification','Internal Use']]).map(([k,v])=>ref2([[k,v]])).flat(),
  new Paragraph({children:[new TextRun({text:'',size:24})],spacing:{before:600}}),
  new Paragraph({children:[new PageBreak()]}),
];}
function toc(){return[h1("Table of Contents"),new TableOfContents("Table of Contents",{hyperlink:true,headingStyleRange:"1-3",stylesWithLevels:[new StyleLevel("Heading1",1),new StyleLevel("Heading2",2),new StyleLevel("Heading3",3)]}),new Paragraph({children:[new PageBreak()]})];}

function buildChildren(){
  const listImg=img("asset-list.jpg",560,340);
  const detailImg=img("asset-detail.jpg",560,340);
  return[
    ...coverPage(),
    ...toc(),

    // 1. INTRODUCTION
    h1("1. Introduction"),
    p("The Asset Records module is the core of the Asset Management System. It contains the complete Fixed Asset Register (FAR) — the authoritative list of all property, plant and equipment, heritage assets, and investment property owned by the municipality. Every other module (Transactions, Reports, Reconciliation, Verification) draws its data from the Asset Records."),
    space(),
    h2("1.1  Purpose and Scope"),
    p("The Asset Records module allows authorised users to:"),
    bl("View the full list of all registered assets with summary information."),
    bl("Search and filter assets by type, category, sub-category, class, status, condition, and financial status."),
    bl("Open any individual asset to view its complete detail record."),
    bl("Update editable fields on an asset record (condition, description, location, etc.)."),
    bl("View the full transaction history for each asset (depreciation, impairment, disposal, revaluation)."),
    bl("See the asset's calculated financial balances: cost, accumulated depreciation, impairment, and carrying amount."),
    bl("Add and view asset photographs and supporting documentation."),
    space(),
    h2("1.2  Who Uses Asset Records"),
    ref2([
      ["Asset Manager","Primary user. Manages the daily upkeep of the asset register, updates conditions, and reviews financial balances."],
      ["Finance Officer","Captures and reviews transactions linked to assets. Verifies carrying amounts for financial reporting."],
      ["CFO / Finance Manager","Reviews asset register totals and individual high-value assets during audit preparation."],
      ["Internal Auditor","Views asset records, transaction histories, and document attachments to verify completeness and accuracy."],
      ["IT / System Administrator","Can view all records and has access to data correction tools."],
    ]),
    space(),
    h2("1.3  Compliance Framework"),
    ref2([
      ["GRAP 17","Property, Plant and Equipment — governs initial recognition, cost measurement, useful life, and depreciation of movable and immovable assets."],
      ["GRAP 21","Impairment of Non-Cash-Generating Assets — impairment indicators and recoverable service amount."],
      ["GRAP 26","Impairment of Cash-Generating Assets — for assets used in revenue-generating activities."],
      ["GRAP 103","Heritage Assets — recognition, measurement, and disclosure of heritage assets."],
      ["MFMA Section 63","Chief Financial Officer's responsibility for safeguarding of assets."],
      ["mSCOA v6.4","All asset classification must align with the mSCOA Chart of Accounts segments."],
    ]),
    new Paragraph({children:[new PageBreak()]}),

    // 2. NAVIGATING TO ASSET RECORDS
    h1("2. Navigating to Asset Records"),
    p("To access the Asset Records module, click Asset Records in the left-hand navigation sidebar. The module opens to the asset list view — a table showing all registered assets for the active municipality and financial year."),
    space(),
    listImg ? listImg : space(),
    listImg ? caption("Figure 1 — Asset Records list view showing KPI summary cards, filter controls, and the asset register table.") : space(),
    space(),
    h2("2.1  KPI Summary Cards"),
    p("At the top of the Asset Records screen is a row of four KPI cards summarising the portfolio at a glance:"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("KPI Card",40),hCell("Description",60)]}),
      ...[
        ["Total Assets","Count of all active asset register items for the current financial year and municipality."],
        ["Total Cost","Sum of the original purchase/acquisition cost of all registered assets (gross value before depreciation)."],
        ["Total Carrying Value","Sum of net book values (cost minus accumulated depreciation minus accumulated impairment) across all assets."],
        ["Avg Useful Life","Average original useful life (in years) across all assets in the current filter set."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    h2("2.2  Header Actions"),
    ref2([
      ["Add Asset button","Opens the New Asset Acquisition wizard. Refer to the Acquisitions User Manual for full instructions."],
      ["Export button","Downloads the current filtered list of assets to Excel (.xlsx). The export reflects any active filters."],
      ["Import button","Opens the bulk import dialog for uploading multiple assets via a formatted Excel template (Asset Records import, separate from WIP transfers)."],
    ]),
    new Paragraph({children:[new PageBreak()]}),

    // 3. FILTERING AND SEARCHING
    h1("3. Filtering and Searching the Asset Register"),
    p("The filter bar is located below the KPI cards and provides multiple dimensions for narrowing the asset list. Filters are applied cumulatively — each filter you set further narrows the result set."),
    space(),
    h2("3.1  Filter Fields"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Filter Field",30),hCell("Type",20),hCell("Description",50)]}),
      ...[
        ["Search (text box)","Free text","Searches across Asset ID, description, and asset code simultaneously. Partial matches are supported."],
        ["Asset Type","Dropdown","Filters to assets of a specific type (e.g. Movable, Immovable, Heritage, Infrastructure, Community)."],
        ["Asset Category","Dropdown","Filters by category within the selected type (e.g. Vehicles, Furniture, Buildings). Depends on the Type selection."],
        ["Sub-Category","Dropdown","Further narrows by sub-category (e.g. Light Motor Vehicles within Vehicles). Depends on Category selection."],
        ["Asset Class","Dropdown","Filters by the asset class (the fourth level of the classification hierarchy)."],
        ["Measurement Type","Dropdown","Filters by GRAP measurement model: Cost Model or Revaluation Model."],
        ["Asset Status","Dropdown","Filters by asset status: Active, Disposed, Written Off, Donated, etc."],
        ["Financial Status","Dropdown","Filters by financial status: Fully Depreciated, Under Depreciation, Impaired, etc."],
        ["Asset Condition","Dropdown","Filters by physical condition grade: Good, Fair, or Poor."],
      ].map(([a,b,c],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined,align:AlignmentType.CENTER}),dc(c,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    tip("TIP:","Set the Asset Type first before setting Category and Sub-Category. The Category dropdown is disabled until a Type is selected, and the Sub-Category dropdown is disabled until a Category is selected."),
    space(),
    h2("3.2  Applying and Clearing Filters"),
    num("Set one or more filter fields to your desired values."),
    num("Click the Search button (magnifying glass icon) or press Enter to apply the filters."),
    num("The KPI cards update to reflect the filtered result set, and the asset table refreshes."),
    num("To remove all filters and return to the full list, click the Clear button (X icon)."),
    space(),
    h2("3.3  Asset Register Table Columns"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Column",30),hCell("Description",70)]}),
      ...[
        ["ID","The system-generated asset register item ID. This is the unique identifier used throughout the system."],
        ["Description","The asset description as captured during acquisition. Click this row to open the asset detail."],
        ["Asset Type","The top-level asset classification (e.g. Movable, Infrastructure)."],
        ["Asset Category","The second-level classification (e.g. Vehicles, Furniture and Fittings)."],
        ["Measurement Type","Indicates whether the asset is measured at Cost Model or Revaluation Model."],
        ["In-Service Date","The date the asset was first placed into service (commissioning date)."],
        ["Useful Life","The total original useful life in months assigned at acquisition."],
        ["Remaining Useful Life","The remaining useful life in months as at the last depreciation run date."],
        ["Purchase Amount","The gross original cost of acquisition."],
        ["Carrying Value","The current net book value (cost minus accumulated depreciation and impairment)."],
        ["Status","The current asset status badge (Active, Disposed, etc.)."],
        ["Condition","The physical condition grade badge (Good, Fair, Poor)."],
        ["Actions","Edit (pencil), View Detail (eye icon), and Delete (trash — Admin only) buttons."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    new Paragraph({children:[new PageBreak()]}),

    // 4. ASSET DETAIL VIEW
    h1("4. Asset Detail Record"),
    p("Clicking on any row in the asset list opens the Asset Detail view for that asset. This view displays all the information recorded about that specific asset, organised into sections (tabs or accordion panels)."),
    space(),
    detailImg ? detailImg : space(),
    detailImg ? caption("Figure 2 — The Asset Detail view showing identification, financial summary, classification, and transaction history.") : space(),
    space(),
    h2("4.1  Asset Detail Sections"),
    ref2([
      ["Identification","Asset ID, description, barcode, asset code, serial number, and supplier reference."],
      ["Classification","Asset type, category, sub-category, class, measurement type, and depreciation method."],
      ["Financial Summary","Cost, accumulated depreciation (opening and closing), accumulated impairment, and carrying amount."],
      ["Dates and Useful Life","In-service date, purchase date, end-of-life date, useful life months/days, and remaining useful life."],
      ["Location","Physical ward, site, building, room, GPS coordinates."],
      ["Condition and Status","Asset status, financial status, physical condition grade, and condition notes."],
      ["mSCOA Mapping","The mSCOA journal debit and credit codes applied to this asset's depreciation entries."],
      ["Transaction History","A chronological list of all financial events posted against this asset."],
      ["Documents and Photos","Attached files including invoices, warranties, valuation reports, and photographs."],
    ]),
    space(),
    h2("4.2  Identification Fields"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Field",28),hCell("Required",15),hCell("Description",57)]}),
      fieldRow("Asset Register Item ID",true,"System-generated unique identifier. Read-only. Used to reference this asset in all transactions and reports.",LIGHT_GREY),
      fieldRow("Description",true,"Plain-language name and description of the asset. Should be specific enough to identify the physical item (e.g. 'Ford Ranger 2.2 Double Cab - Reg ABC123GP' rather than 'Vehicle').",undefined),
      fieldRow("Asset Code",false,"The municipality's internal asset code or tag number. Typically corresponds to the barcode label affixed to the physical item.",LIGHT_GREY),
      fieldRow("Barcode",false,"The barcode number printed on the asset tag. Used during physical verification scans.",undefined),
      fieldRow("Serial Number",false,"Manufacturer's serial number. Important for IT equipment, vehicles, and plant/machinery.",LIGHT_GREY),
      fieldRow("Supplier / Vendor",false,"The name of the supplier from whom the asset was purchased.",undefined),
      fieldRow("Invoice Number",false,"The supplier invoice number. Used for linking to the general ledger expenditure entry.",LIGHT_GREY),
    ]}),
    space(),
    h2("4.3  Classification Fields"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Field",28),hCell("Required",15),hCell("Description",57)]}),
      fieldRow("Asset Type",true,"The highest level of the asset classification hierarchy. Drives which categories, sub-categories, and classes are available.",LIGHT_GREY),
      fieldRow("Asset Category",true,"Second-level classification. Determines the default useful life and depreciation method.",undefined),
      fieldRow("Asset Sub-Category",false,"Third-level classification providing more specific grouping within the category.",LIGHT_GREY),
      fieldRow("Asset Class",false,"Fourth-level classification. Used for mSCOA segment mapping.",undefined),
      fieldRow("Measurement Type",true,"Either Cost Model (GRAP 17.29) or Revaluation Model (GRAP 17.31). Determines how the asset is measured after initial recognition.",LIGHT_GREY),
      fieldRow("Depreciation Method",true,"Straight-line (most common) or Diminishing Balance. Must align with the municipality's accounting policy.",undefined),
    ]}),
    space(),
    h2("4.4  Financial Summary Fields"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Field",28),hCell("Type",15),hCell("Description",57)]}),
      ...[
        ["Purchase Amount","Calculated","The original cost at acquisition. Set when the asset is first registered and cannot be changed without a Prior Year Adjustment."],
        ["Acc. Depreciation (Opening)","Calculated","Total accumulated depreciation at the start of the current financial year."],
        ["Acc. Depreciation (Closing)","Calculated","Total accumulated depreciation as at the last depreciation run date."],
        ["Acc. Depreciation (Current Year)","Calculated","Depreciation charged in the current financial year only."],
        ["Acc. Impairment (Opening)","Calculated","Total accumulated impairment at the start of the current financial year."],
        ["Acc. Impairment (Closing)","Calculated","Total accumulated impairment as at today."],
        ["Carrying Amount (Closing)","Calculated","Net book value: Purchase Amount minus Acc. Depreciation (Closing) minus Acc. Impairment (Closing)."],
        ["Revaluation Amount","Calculated","The cumulative net revaluation adjustment for Revaluation Model assets."],
      ].map(([a,b,c],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined,align:AlignmentType.CENTER}),dc(c,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    note("NOTE:","All financial fields in the Financial Summary section are calculated by the system from posted transactions. They cannot be manually edited on this screen. To correct a financial balance, use the Prior Year Adjustments module or post the appropriate transaction type in Transactions."),
    space(),
    h2("4.5  Dates and Useful Life Fields"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Field",28),hCell("Required",15),hCell("Description",57)]}),
      fieldRow("Purchase / Acquisition Date",true,"The date on which the asset was purchased or acquired. Used for warranty tracking and audit trail.",LIGHT_GREY),
      fieldRow("In-Service Date",true,"The date the asset was first placed into operational use (commissioning date). Depreciation starts from this date. GRAP 17 requires this date for proper recognition.",undefined),
      fieldRow("End of Life Date",false,"The projected date on which the asset reaches zero remaining useful life. Calculated automatically from In-Service Date + Useful Life.",LIGHT_GREY),
      fieldRow("Useful Life (Months)",true,"The total expected useful life at acquisition, in months. This is set at the time of registration and drives the straight-line depreciation rate.",undefined),
      fieldRow("Useful Life (Days)",false,"The useful life expressed in days. Calculated automatically from the months value.",LIGHT_GREY),
      fieldRow("Remaining Useful Life (Months)",false,"Calculated field showing months remaining until end-of-life based on the last depreciation run.",undefined),
      fieldRow("Remaining Useful Life (Days)",false,"Remaining useful life expressed in days.",LIGHT_GREY),
    ]}),
    space(),
    warn("WARNING:","The Useful Life field drives the annual depreciation charge. An incorrect useful life will result in under- or over-depreciation, which is a material misstatement risk. Verify the useful life against the municipality's Asset Management Policy before saving."),
    new Paragraph({children:[new PageBreak()]}),

    // 5. TRANSACTION HISTORY
    h1("5. Transaction History Tab"),
    p("The Transaction History tab on the asset detail record shows a chronological list of all financial events that have been posted against this asset. This is the complete audit trail for the asset's financial life."),
    space(),
    h2("5.1  Transaction History Columns"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Column",25),hCell("Description",75)]}),
      ...[
        ["Transaction Date","The date on which the transaction was recorded (posted)."],
        ["Transaction Type","The category of event: Depreciation, Impairment, Disposal, Revaluation, Impairment Reversal, Cost Adjustment."],
        ["Financial Year","The financial year to which this transaction belongs."],
        ["Period","The mSCOA period (1–12) to which the transaction was posted."],
        ["GL Processing Month","The calendar month in which the transaction was processed in the general ledger."],
        ["Amount","The Rand amount of the transaction. Depreciation and impairment values are shown as positive amounts representing reductions."],
        ["Document Number","The journal voucher reference number in the general ledger system."],
        ["Captured By","The username of the system user who captured or triggered this transaction."],
        ["Approve Status","The current approval status: Pending, Approved, or Rejected."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    tip("TIP:","Use the Transaction History to verify that depreciation is being posted every month. If a month is missing, raise a Transactions → Depreciation Run for that period."),
    new Paragraph({children:[new PageBreak()]}),

    // 6. EDITING AN ASSET RECORD
    h1("6. Editing an Asset Record"),
    p("Certain fields on an asset record can be edited after the asset has been registered. These are non-financial fields such as description, condition, location, and barcode. Financial values (cost, depreciation, useful life) can only be corrected through formal transactions or Prior Year Adjustments."),
    space(),
    h2("6.1  Fields That Can Be Edited"),
    ref2([
      ["Description","Can be updated to improve clarity. Keep the change reasonable — do not change the asset type in the description."],
      ["Asset Code / Barcode","Can be updated when an asset is re-tagged during a physical verification exercise."],
      ["Asset Condition","Updated after each physical verification. Select Good, Fair, or Poor based on the inspection findings."],
      ["Condition Notes","Free-text field for observations about the physical condition. Required when condition is Poor."],
      ["Location (Ward, Site, Room)","Updated when an asset is moved to a new physical location."],
      ["GPS Coordinates","Latitude and longitude. Used for field verification and mapping."],
      ["Responsible Officer","The name of the staff member responsible for the asset's safekeeping."],
    ]),
    space(),
    h2("6.2  Editing an Asset — Step by Step"),
    stepBanner(1,4,"Open the Asset Record"),
    p("In the asset list, click the Edit (pencil icon) button on the row of the asset you want to update. Alternatively, click the row to open the detail view and then click the Edit button at the top of the detail screen."),
    space(),
    stepBanner(2,4,"Make Your Changes"),
    p("The editable fields will become active input controls. Make the required updates. Non-editable (calculated) fields remain greyed out and cannot be typed into."),
    space(),
    stepBanner(3,4,"Save the Record"),
    p("Click the Save button. The system validates the changes and saves them to the database. A green success banner appears at the top of the screen confirming the save."),
    space(),
    stepBanner(4,4,"Verify the Change"),
    p("Review the updated values in the detail view. If the change affects the Transaction History or financial balances, navigate to the Transactions module to confirm the correct entries have been posted."),
    space(),
    warn("WARNING:","Do not edit the Asset Description to change the fundamental nature of the asset (e.g. changing 'Vehicle' to 'Building'). If the asset was incorrectly classified at registration, use Prior Year Adjustments or contact your system administrator."),
    new Paragraph({children:[new PageBreak()]}),

    // 7. VERIFICATION TAB
    h1("7. Asset Verification on the Detail Record"),
    p("The Asset Detail screen includes a Verification tab or section that shows the history of all physical verification events performed on that asset. Physical verification is the process of confirming that an asset physically exists at its recorded location, is in the stated condition, and has the correct asset tag."),
    space(),
    h2("7.1  Verification Record Columns"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Column",30),hCell("Description",70)]}),
      ...[
        ["Verification Date","The date on which the physical inspection was performed."],
        ["Verified By","The name of the officer who performed the verification."],
        ["Verification Method","How the verification was done: Barcode Scan, Manual Inspection, GPS Capture."],
        ["Condition Found","The physical condition observed: Good, Fair, or Poor."],
        ["Location Confirmed","Whether the asset was found at its recorded location: Yes or No."],
        ["Tag Confirmed","Whether the barcode or asset tag was intact and readable: Yes or No."],
        ["Notes","Any observations or discrepancies noted during the verification."],
        ["Status","The outcome of the verification: Confirmed, Not Found, Discrepancy."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    note("NOTE:","MFMA Section 63 requires the CFO to ensure an annual physical verification of all assets. The Verification tab on each asset detail record provides the evidence trail for the external auditor."),
    new Paragraph({children:[new PageBreak()]}),

    // 8. DOCUMENTS AND PHOTOS
    h1("8. Documents and Photographs"),
    p("The Documents tab on the asset detail record allows authorised users to attach supporting documents and photographs to any asset record. These attachments are stored against the asset and are available to auditors and reviewers at any time."),
    space(),
    h2("8.1  Supported Document Types"),
    bl("Supplier invoices and delivery notes (.pdf, .jpg, .png)"),
    bl("Valuation certificates for revaluation-model assets"),
    bl("Insurance certificates"),
    bl("Warranty documents"),
    bl("Condition assessment reports"),
    bl("Photographs of the physical asset (front, rear, identification plate)"),
    space(),
    h2("8.2  Uploading a Document"),
    num("Open the asset detail record."),
    num("Click the Documents tab."),
    num("Click the Upload Document or Add Photo button."),
    num("Select the file from your local computer. Maximum file size is 10 MB per file."),
    num("Enter a description for the document (e.g. 'Purchase Invoice — 14 March 2024')."),
    num("Click Upload. The file appears in the document list below."),
    space(),
    tip("TIP:","Always upload the original purchase invoice for each asset. This is the primary evidence document for cost recognition under GRAP 17.29 and is requested by auditors during every annual audit."),
    new Paragraph({children:[new PageBreak()]}),

    // 9. COMMON QUESTIONS
    h1("9. Common Questions and Troubleshooting"),
    ref2([
      ["I cannot find an asset in the list","Check that all filters are cleared (click the Clear button). The asset may have a status of Disposed — set the Asset Status filter to show Disposed assets."],
      ["The Carrying Value shows a negative number","The accumulated depreciation exceeds the cost, usually due to a data entry error at registration. Use Prior Year Adjustments to correct the opening balance."],
      ["The Edit button is greyed out","Your user role does not have edit permission on Asset Records, or the asset's status is Disposed (disposed assets are locked from editing)."],
      ["The In-Service Date cannot be edited","In-Service Date is locked after the first depreciation run has been posted against this asset. Contact your system administrator to correct it via Prior Year Adjustments."],
      ["I uploaded the wrong document","Contact your system administrator. Documents can be deleted by Admin-role users from the Documents tab. Standard users cannot delete uploaded documents."],
      ["The Transaction History shows a gap (missing month)","A depreciation run was not executed for that month. Navigate to Transactions and run depreciation for the missing period."],
      ["The Remaining Useful Life shows zero but the asset is still active","The asset has reached the end of its assigned useful life. The accounting policy should determine whether to extend the life (edit via Administration > Asset Policy), write off, or dispose."],
      ["I need to change the Asset Type after registration","Asset Type cannot be changed after the first transaction has been posted. Raise a Prior Year Adjustment or contact the system administrator."],
    ]),
    space(),
    success("SUCCESS:","A complete, audit-ready asset record has: a clear description, a correct in-service date, an accurate useful life, at least one document attachment (original invoice), a current condition grade, and a verified physical location."),
  ];
}

(async()=>{
  const doc=new Document({
    numbering:{config:[{reference:"default-numbering",levels:[{level:0,format:"decimal",text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:360,hanging:260}}}}]}]},
    styles:{paragraphStyles:[{id:"Normal",name:"Normal",run:{font:"Calibri",size:22,color:BLACK}}]},
    sections:[{
      headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"Asset Management System — Asset Records User Manual",size:18,color:"888888",font:"Calibri"})]})]})},
      footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Asset Management System — Confidential  |  Page ",size:18,color:"888888",font:"Calibri"}),new TextRun({children:[new PageNumberElement()],size:18,color:"888888",font:"Calibri"})]})]})},
      children:buildChildren()
    }]
  });
  const buf=await Packer.toBuffer(doc);
  writeFileSync(join(__dirname,"AssetRecords_UserManual.docx"),buf);
  console.log("✓ AssetRecords_UserManual.docx written");
})();
