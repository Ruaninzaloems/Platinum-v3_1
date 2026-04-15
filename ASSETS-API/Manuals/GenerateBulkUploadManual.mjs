// GenerateBulkUploadManual.mjs — Full detail, Acquisitions-level
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
  new Paragraph({children:[new TextRun({text:'BULK UPLOAD',bold:true,size:64,color:NOTE_BORD,allCaps:true,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:120}}),
  new Paragraph({children:[new TextRun({text:'WIP Transfer Uploads — User Manual',size:44,color:"475569",font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:600}}),
  new Paragraph({children:[new TextRun({text:'─'.repeat(60),color:"E2E8F0",size:22,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:200}}),
  ...([['System','MFMA/GRAP/mSCOA Asset Management'],['Module','Bulk Upload — WIP Transfer Excel Upload'],['Compliance','GRAP 11, GRAP 17, mSCOA v6.4, MFMA'],['Version','1.0'],['Prepared for','Asset Management System'],['Classification','Internal Use']]).map(([k,v])=>ref2([[k,v]])).flat(),
  new Paragraph({children:[new TextRun({text:'',size:24})],spacing:{before:600}}),
  new Paragraph({children:[new PageBreak()]}),
];}
function toc(){return[h1("Table of Contents"),new TableOfContents("Table of Contents",{hyperlink:true,headingStyleRange:"1-3",stylesWithLevels:[new StyleLevel("Heading1",1),new StyleLevel("Heading2",2),new StyleLevel("Heading3",3)]}),new Paragraph({children:[new PageBreak()]})];}

function buildChildren(){
  const bulkImg=img("bulk-upload.jpg",560,340);
  return[
    ...coverPage(),
    ...toc(),

    h1("1. Introduction"),
    p("The Bulk Upload module provides a mechanism to load multiple Work-In-Progress (WIP) asset transfers into the Asset Management System using a Microsoft Excel spreadsheet. This is used when migrating large numbers of completed projects from a legacy system, when a batch of capital projects all reach completion simultaneously, or during the initial system implementation when the existing WIP register needs to be loaded."),
    space(),
    h2("1.1  What is a WIP Transfer Upload?"),
    p("A WIP transfer upload is a batch operation that simultaneously processes multiple WIP-to-Fixed Asset Register transfers using data from an Excel file. Instead of creating each WIP project and transfer individually through the WIP module, the Bulk Upload allows hundreds of records to be processed in a single upload session."),
    space(),
    h2("1.2  When to Use Bulk Upload"),
    ref2([
      ["System Implementation","Loading the initial WIP register from a legacy system (e.g. Excel spreadsheets, prior system export) when implementing the Asset Management System for the first time."],
      ["Period-End Batch Processing","Processing a large batch of completed capital projects at the end of a financial year when many projects reach completion simultaneously."],
      ["Data Migration","Migrating WIP records from a discontinued system or when restructuring the project register."],
      ["Legacy Backfill","Capturing historical WIP transfers that predated the system implementation."],
    ]),
    space(),
    h2("1.3  Who Uses Bulk Upload"),
    ref2([
      ["Finance Officer (Capital)","Prepares and uploads the WIP transfer file. Reviews validation errors and corrects the source data."],
      ["Finance Manager","Reviews the upload results and ensures all records have processed correctly."],
      ["System Administrator","Manages upload jobs, investigates processing errors, and downloads error reports."],
    ]),
    space(),
    warn("WARNING:","Bulk Upload bypasses the individual WIP transfer approval workflow for each record. A Finance Manager must review the upload results report and the resulting asset records after each upload to ensure accuracy before approving the batch in the Workflow Inbox."),
    new Paragraph({children:[new PageBreak()]}),

    h1("2. Navigating to Bulk Upload"),
    p("From the left-hand navigation sidebar, click Bulk Upload → WIP Transfers. The module opens to the WIP Transfer Uploads list."),
    space(),
    bulkImg ? bulkImg : space(),
    bulkImg ? caption("Figure 1 — WIP Transfer Uploads screen showing previous upload jobs and action buttons.") : space(),
    new Paragraph({children:[new PageBreak()]}),

    h1("3. Downloading the Upload Template"),
    p("Before preparing your upload file, download the official template from the system. The template is pre-formatted with the required column headers and data validation rules. Do not use a custom Excel file — only the official template is accepted."),
    space(),
    h2("3.1  How to Download the Template"),
    num("In the WIP Transfer Uploads screen, click the Download Template button in the top header."),
    num("The file downloads as an Excel workbook (.xlsx) named 'WIP_Transfer_Template.xlsx'."),
    num("Open the file in Microsoft Excel 2013 or later."),
    num("The template contains one data sheet (WIP_Transfers) and one reference sheet (Valid Values)."),
    space(),
    h2("3.2  Template Structure"),
    p("The template contains the following sheets:"),
    bl("WIP_Transfers: The data sheet where you enter one row per asset transfer. All data must be on this sheet."),
    bl("Valid Values: Reference lookups showing valid values for dropdown fields (Asset Type, Status, Depreciation Method, etc.). Do not edit this sheet."),
    bl("Instructions: Step-by-step guidance for completing the template. Read this before filling in data."),
    new Paragraph({children:[new PageBreak()]}),

    h1("4. Completing the Upload Template"),
    p("Each row in the WIP_Transfers sheet represents one completed WIP project being transferred to the Fixed Asset Register. Complete one row per asset."),
    space(),
    h2("4.1  Template Column Reference"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Column Header",30),hCell("Required",15),hCell("Description and Valid Values",55)]}),
      ...[
        ["Project_Name","Required","The name of the WIP project. Will become the asset description. Max 250 characters."],
        ["Project_Number","Optional","The municipality's internal capital project reference number."],
        ["Asset_Type","Required","Must match a valid asset type. See Valid Values sheet. E.g. 'Infrastructure', 'Movable', 'Immovable', 'Community', 'Heritage'."],
        ["Asset_Category","Required","Must match a valid category for the selected Asset_Type. See Valid Values sheet."],
        ["Asset_Sub_Category","Optional","A valid sub-category for the selected category. Leave blank if no sub-category applies."],
        ["Measurement_Type","Required","Either 'Cost' or 'Revaluation'. For most new assets, use 'Cost'."],
        ["Depreciation_Method","Required","Either 'Straight-Line' or 'Diminishing-Balance'. Must match the municipality's accounting policy for the asset type."],
        ["In_Service_Date","Required","The date the asset was first placed into service. Format: YYYY-MM-DD (e.g. 2024-03-15). Depreciation starts from this date."],
        ["Useful_Life_Months","Required","The total useful life in months (integer). E.g. 240 for 20 years, 60 for 5 years."],
        ["Purchase_Amount","Required","The total accumulated cost (in Rand, numeric, no R symbol, no commas). E.g. 1250000.00. This is the sum of all WIP expenditure for the project."],
        ["Acc_Dep_Opening","Optional","Opening accumulated depreciation balance if the asset was partially depreciated in a prior system. Use 0 if new."],
        ["Department","Optional","The municipal department responsible for this asset."],
        ["Ward","Optional","The ward number where the asset is physically located."],
        ["Site","Optional","The site or building name."],
        ["GPS_Latitude","Optional","Decimal latitude coordinate. E.g. -31.9505."],
        ["GPS_Longitude","Optional","Decimal longitude coordinate. E.g. 26.3012."],
        ["Contractor","Optional","Name of the contractor who built/supplied the asset."],
        ["Contract_Number","Optional","Contract or purchase order reference number."],
        ["Completion_Certificate_Ref","Optional","Reference number of the project completion certificate."],
        ["Financial_Year","Required","The financial year of the transfer. Format: YYYY/YYYY (e.g. 2024/2025)."],
        ["Financial_Period","Required","The period number (1–12) in which the transfer is effective."],
      ].map(([a,b,c],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined,align:AlignmentType.CENTER,color:b==="Required"?"166534":"6B7280",bold:b==="Required"}),dc(c,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    h2("4.2  Data Quality Rules"),
    p("The following rules apply to all template data. Rows failing these rules will be flagged as validation errors:"),
    bl("Dates must be in YYYY-MM-DD format. Other formats will not be recognised."),
    bl("Asset_Type, Asset_Category, Measurement_Type, and Depreciation_Method must exactly match the valid values listed in the Valid Values sheet (case-sensitive)."),
    bl("Purchase_Amount must be a positive number with no more than 2 decimal places."),
    bl("Useful_Life_Months must be a positive integer between 1 and 1,200."),
    bl("Financial_Year must match a year configured in the system (e.g. 2024/2025)."),
    bl("Financial_Period must be a number between 1 and 12."),
    bl("In_Service_Date must be on or before the upload date."),
    bl("Do not leave any Required field blank — blank required fields will cause the row to fail validation."),
    space(),
    tip("TIP:","Prepare your data in Excel first, then use Excel's Data Validation feature to verify the Asset_Type and Asset_Category values before uploading. Use the VLOOKUP function to cross-reference your data against the Valid Values sheet. This will save time by catching errors before the upload."),
    new Paragraph({children:[new PageBreak()]}),

    h1("5. Uploading the File"),
    p("Once the template is complete and the data has been verified, proceed with the upload."),
    space(),
    h2("5.1  Upload Steps"),
    stepBanner(1,5,"Save the Template"),
    p("Save your completed template as an Excel workbook (.xlsx or .xls). Do not save as CSV — the system requires the Excel format. Do not change the sheet names."),
    space(),
    stepBanner(2,5,"Click Upload WIP File"),
    p("In the WIP Transfer Uploads screen, click the Upload WIP File button in the header. A file selection dialog opens."),
    space(),
    stepBanner(3,5,"Select Your File"),
    p("Browse to and select your completed Excel template file. Click Open. The upload begins immediately."),
    space(),
    stepBanner(4,5,"Monitor Upload Progress"),
    p("A progress bar appears below the header buttons showing the upload percentage and a status message. Do not close the browser window while the upload is in progress. The processing time depends on the number of rows — approximately 2–3 seconds per 100 rows."),
    space(),
    stepBanner(5,5,"Review Results"),
    p("When the upload completes, the new job appears at the top of the upload history table. Check the Status, Records, and Errors columns to assess the outcome."),
    new Paragraph({children:[new PageBreak()]}),

    h1("6. Upload Job History Table"),
    p("All previous and current upload jobs are listed in the history table. The table shows one row per upload job."),
    space(),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Column",20),hCell("Description",80)]}),
      ...[
        ["File Name","The original filename of the uploaded Excel file."],
        ["Status","Upload job status: Completed Successfully (green), Completed with Errors (amber), Failed (red), or Processing (blue spinner)."],
        ["Records","Total number of data rows processed from the upload file."],
        ["Errors","The number of rows that failed validation and were not imported."],
        ["Uploaded Date","The date and time the upload was submitted."],
        ["Run ID","A unique identifier for this upload job. Used for technical support queries."],
        ["Actions","View Errors (red icon — appears when Errors > 0), Download Error Report (amber icon), Download Original File (blue icon)."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    new Paragraph({children:[new PageBreak()]}),

    h1("7. Handling Upload Errors"),
    p("When an upload completes with errors, the Errors column shows a non-zero count. Not all rows fail — only rows with validation errors are rejected. Rows that passed validation are imported successfully."),
    space(),
    h2("7.1  Viewing Errors"),
    p("Click the View Errors button (red error icon) on the job row. A dialog opens showing a table of all failed rows with:"),
    bl("Row Number: The Excel row number of the failed record (row 2 = first data row)."),
    bl("Field: The column that caused the validation failure."),
    bl("Error Message: A plain-language description of why the row failed (e.g. 'Invalid Asset_Type: value must be one of the following: Infrastructure, Movable, Immovable, Community, Heritage')."),
    space(),
    h2("7.2  Downloading the Error Report"),
    p("Click the Download Error Report button (amber icon) to download an Excel file containing all error details. This report can be used to correct the original data file."),
    space(),
    h2("7.3  Correcting and Resubmitting"),
    p("After reviewing the errors:"),
    num("Open your original Excel template file."),
    num("Navigate to the rows identified in the error report using the Row Number references."),
    num("Correct each error based on the error message. Refer to the Valid Values sheet for correct values."),
    num("Save the corrected file."),
    num("Upload the corrected file as a new upload job. Only the failed rows need to be resubmitted — successfully imported rows are already in the system."),
    space(),
    warn("WARNING:","When resubmitting corrected rows, ensure you only include the previously failed rows in the new upload file. Resubmitting all rows (including already-imported rows) will create duplicate records in the asset register."),
    new Paragraph({children:[new PageBreak()]}),

    h1("8. Post-Upload Verification"),
    p("After a successful upload, the imported assets require verification and approval before they appear in the active Fixed Asset Register."),
    space(),
    h2("8.1  Post-Upload Steps"),
    stepBanner(1,4,"Review the Workflow Inbox"),
    p("The bulk upload creates a batch approval item in the Workflow Inbox. The Finance Manager must review this batch and approve it before the assets are fully active."),
    space(),
    stepBanner(2,4,"Verify Sample Records"),
    p("Navigate to Asset Records and search for a sample of the newly imported assets. Verify that the classification, in-service date, useful life, and cost are correct for each sampled record."),
    space(),
    stepBanner(3,4,"Download the Original File"),
    p("Download the original upload file from the upload history for your records. File it with the WIP transfer documentation as part of the project completion audit trail."),
    space(),
    stepBanner(4,4,"Run the First Depreciation Cycle"),
    p("Once the upload is approved, include the new assets in the next scheduled depreciation run to begin charging depreciation from the in-service date."),
    space(),
    success("UPLOAD SUCCESS:","A successful bulk upload job shows Status = Completed Successfully, Errors = 0, and the asset count matches the number of rows in your Excel file. All imported assets appear in Asset Records after the Workflow Inbox batch is approved."),
    new Paragraph({children:[new PageBreak()]}),

    h1("9. Common Questions and Troubleshooting"),
    ref2([
      ["The upload status shows 'Failed'","A system-level error occurred (e.g. file format not recognised, server timeout). Check that the file is an .xlsx or .xls format and not a CSV. Try downloading a fresh template and re-entering the data."],
      ["All rows have errors after upload","A common cause is incorrect date formatting. Ensure dates are in YYYY-MM-DD format, not DD/MM/YYYY or MM/DD/YYYY."],
      ["The upload is taking very long","Large files (>1,000 rows) may take several minutes. Do not close the browser. If the upload has not completed after 10 minutes, contact the system administrator."],
      ["I can see the upload job but no new assets appear in Asset Records","The Workflow Inbox batch approval has not yet been processed. Ask the Finance Manager to approve the batch."],
      ["I uploaded the same file twice by mistake","Check if duplicate records have been created in Asset Records. Contact the system administrator to delete the duplicate assets from the second upload."],
      ["The template has changed since I last used it","Always download a fresh template before each upload. Template structures are updated when the system is upgraded. Using an outdated template will result in all rows failing."],
    ]),
  ];
}

(async()=>{
  const doc=new Document({
    numbering:{config:[{reference:"default-numbering",levels:[{level:0,format:"decimal",text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:360,hanging:260}}}}]}]},
    styles:{paragraphStyles:[{id:"Normal",name:"Normal",run:{font:"Calibri",size:22,color:BLACK}}]},
    sections:[{
      headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"Asset Management System — Bulk Upload User Manual",size:18,color:"888888",font:"Calibri"})]})]})},
      footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Asset Management System — Confidential  |  Page ",size:18,color:"888888",font:"Calibri"}),new TextRun({children:[new PageNumberElement()],size:18,color:"888888",font:"Calibri"})]})]})},
      children:buildChildren()
    }]
  });
  const buf=await Packer.toBuffer(doc);
  writeFileSync(join(__dirname,"BulkUpload_UserManual.docx"),buf);
  console.log("✓ BulkUpload_UserManual.docx written");
})();
