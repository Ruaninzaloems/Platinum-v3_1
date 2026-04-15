// GenerateReconciliationManual.mjs — Full detail, Acquisitions-level
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
  new Paragraph({children:[new TextRun({text:'RECONCILIATION',bold:true,size:60,color:NOTE_BORD,allCaps:true,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:120}}),
  new Paragraph({children:[new TextRun({text:'User Manual',size:48,color:"475569",font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:600}}),
  new Paragraph({children:[new TextRun({text:'─'.repeat(60),color:"E2E8F0",size:22,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:200}}),
  ...([['System','MFMA/GRAP/mSCOA Asset Management'],['Module','Reconciliation — Asset Register vs General Ledger Reconciliation'],['Compliance','GRAP 17, mSCOA v6.4, MFMA Section 65, National Treasury'],['Version','1.0'],['Prepared for','Asset Management System'],['Classification','Internal Use']]).map(([k,v])=>ref2([[k,v]])).flat(),
  new Paragraph({children:[new TextRun({text:'',size:24})],spacing:{before:600}}),
  new Paragraph({children:[new PageBreak()]}),
];}
function toc(){return[h1("Table of Contents"),new TableOfContents("Table of Contents",{hyperlink:true,headingStyleRange:"1-3",stylesWithLevels:[new StyleLevel("Heading1",1),new StyleLevel("Heading2",2),new StyleLevel("Heading3",3)]}),new Paragraph({children:[new PageBreak()]})];}

function buildChildren(){
  const recImg=img("reconciliation.jpg",560,340);
  return[
    ...coverPage(),
    ...toc(),

    h1("1. Introduction"),
    p("The Reconciliation module provides the tools to compare the asset register balances in this system against the corresponding general ledger (GL) account balances in the municipal accounting system. Reconciliation is a mandatory internal control and is one of the most important activities the Finance team performs each period to ensure the accuracy and completeness of the Annual Financial Statements."),
    space(),
    h2("1.1  Why Reconciliation Matters"),
    p("Under GRAP 17 and MFMA Section 65, the CFO must ensure that the assets recorded in the Fixed Asset Register are accurately reflected in the general ledger. A reconciliation variance (difference between the asset register and the GL) means either:"),
    bl("Transactions have been posted in the asset register but not yet in the GL, or vice versa."),
    bl("Assets have been recorded at different values in the two systems."),
    bl("A transaction has been posted to the wrong account in one of the systems."),
    bl("An asset has been disposed of in one system but not the other."),
    p("Unresolved reconciliation variances at year-end are a primary cause of qualified audit opinions from the Auditor-General. The reconciliation must be performed at least monthly and must be zero at year-end."),
    space(),
    h2("1.2  What is Reconciled"),
    ref2([
      ["PPE Cost (Gross Asset Value)","The total original cost of all assets in the register vs the GL PPE cost/gross asset accounts."],
      ["Accumulated Depreciation","Total accumulated depreciation in the register vs the GL accumulated depreciation contra accounts."],
      ["Accumulated Impairment","Total accumulated impairment in the register vs the GL impairment accounts."],
      ["Net Carrying Value","Calculated as Cost minus Acc Dep minus Acc Impairment — the balance sheet value."],
      ["Depreciation Charge (Current Year)","Total depreciation expense for the period vs the GL depreciation expense accounts."],
      ["WIP Balance","Total WIP accumulated cost in the register vs the GL WIP control account."],
    ]),
    space(),
    h2("1.3  Who Performs Reconciliation"),
    ref2([
      ["Finance Officer (Asset Accounting)","Performs the monthly reconciliation, investigates variances, and proposes correcting entries."],
      ["Finance Manager","Reviews and signs off on the reconciliation working paper."],
      ["CFO","Reviews the reconciliation summary at quarter-end and year-end. Signs off on the year-end reconciliation file."],
      ["Internal Auditor","Independently reviews the reconciliation working papers to assess their completeness and accuracy."],
    ]),
    new Paragraph({children:[new PageBreak()]}),

    h1("2. Navigating to Reconciliation"),
    p("Click Reconciliation in the left-hand navigation sidebar. The module opens to the Reconciliation Dashboard, which shows the current period's reconciliation status at a glance."),
    space(),
    recImg ? recImg : space(),
    recImg ? caption("Figure 1 — The Reconciliation module showing the period status cards and the account-level reconciliation grid.") : space(),
    space(),
    h2("2.1  Reconciliation Status Cards"),
    p("The top of the Reconciliation module shows a row of status cards. Each card represents one reconciliation category:"),
    bl("A green tick (checkmark) card means the register and GL are in agreement for that category."),
    bl("An amber card means a variance exists but it is within the materiality threshold."),
    bl("A red card means a material variance exists that requires immediate investigation."),
    new Paragraph({children:[new PageBreak()]}),

    h1("3. Performing the Period Reconciliation"),
    p("The reconciliation process compares the asset register's calculated balances against the GL balances that you enter manually (or import) into the reconciliation screen. The system then calculates the variance and flags any differences."),
    space(),
    h2("3.1  Reconciliation Workflow"),
    stepBanner(1,6,"Ensure All Transactions Are Approved"),
    p("Before starting the reconciliation, confirm that all transactions for the period have been approved in the Workflow Inbox. Unapproved transactions are excluded from the register totals, which will create an artificial variance."),
    space(),
    stepBanner(2,6,"Select the Financial Year and Period"),
    p("In the Reconciliation module, select the financial year and period you want to reconcile. Click Load to calculate the register balances for that period."),
    space(),
    stepBanner(3,6,"Enter the GL Balances"),
    p("From your accounting system (e.g. SAMRAS, Pastel, Sage), extract the closing balances for each PPE account as at the end of the selected period. Enter these balances in the GL Balance column of the reconciliation grid."),
    space(),
    stepBanner(4,6,"Review the Calculated Variances"),
    p("The system automatically calculates the variance for each line: Variance = Register Balance minus GL Balance. Lines with a non-zero variance are highlighted. Green = in balance; Red = variance."),
    space(),
    stepBanner(5,6,"Investigate and Resolve Variances"),
    p("For each variance line, investigate the cause. Refer to the section below for common variance causes and resolution steps. After resolving each variance, update the reconciliation note for that line."),
    space(),
    stepBanner(6,6,"Sign Off and File"),
    p("Once all variances are resolved (or formally explained), the Finance Manager signs off on the reconciliation. Export the reconciliation as a PDF or Excel file and file it in the month-end working papers folder."),
    new Paragraph({children:[new PageBreak()]}),

    h1("4. Reconciliation Grid"),
    p("The reconciliation grid shows one row per GL account or reconciliation category. Each row shows:"),
    space(),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Column",25),hCell("Description",75)]}),
      ...[
        ["Category","The reconciliation category or GL account description (e.g. PPE Cost — Vehicles, Acc Dep — Buildings)."],
        ["Register Balance","The balance calculated from the Asset Management System's asset register as at the selected period. Read-only."],
        ["GL Balance","The balance extracted from the accounting system GL. Entered manually or imported. Editable."],
        ["Variance","Register Balance minus GL Balance. Calculated automatically. Zero variance = in balance."],
        ["Status","Green checkmark (in balance) or red X (variance). Based on the Variance field."],
        ["Notes","Free-text field for the Finance Officer to document the explanation for any variance, or to note that the variance has been resolved."],
        ["Resolved?","Checkbox to mark whether the variance has been investigated and a resolution is in progress."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    new Paragraph({children:[new PageBreak()]}),

    h1("5. Common Variance Causes and Resolutions"),
    p("The following are the most common causes of reconciliation variances between the asset register and the general ledger:"),
    space(),
    h2("5.1  Timing Differences"),
    p("Timing differences occur when a transaction is recorded in one system in a different period from the other."),
    bl("Example: A disposal was processed in the asset register in Period 9 but the GL journal was not posted until Period 10."),
    bl("Resolution: The variance will self-resolve in Period 10 when the GL entry is posted. Document the timing difference in the reconciliation notes with the expected resolution date."),
    space(),
    h2("5.2  Missing Transactions"),
    p("A transaction exists in one system but not the other."),
    bl("Example: A new asset acquisition was approved in the asset register but the finance officer forgot to post the capitalisation journal in the GL."),
    bl("Resolution: Post the missing GL journal. Contact the GL team with the details of the unposted transaction."),
    space(),
    h2("5.3  Value Differences"),
    p("The same transaction is recorded at different amounts in the two systems."),
    bl("Example: The asset register records a cost of R 125,000 but the GL shows R 152,000 (transposition error)."),
    bl("Resolution: Determine which system has the correct amount. Correct the error in the incorrect system. If the GL is wrong, raise a correcting journal. If the asset register is wrong, use Prior Year Adjustments."),
    space(),
    h2("5.4  Classification Differences"),
    p("An asset is posted to the wrong GL account."),
    bl("Example: A vehicle was posted to the Buildings PPE account in the GL instead of the Vehicles account."),
    bl("Resolution: Raise a correcting reclassification journal in the GL to move the amount to the correct account."),
    space(),
    h2("5.5  Unapproved Transactions"),
    p("Transactions captured in the asset register have not been approved in the Workflow Inbox and therefore are not reflected in the register balance."),
    bl("Resolution: Approve pending transactions in the Workflow Inbox. The register balance will update and the variance will reduce."),
    space(),
    tip("TIP:","Always check the Workflow Inbox for pending items BEFORE running the reconciliation. An empty Inbox is a prerequisite for a clean reconciliation."),
    new Paragraph({children:[new PageBreak()]}),

    h1("6. Reconciliation at Year-End"),
    p("The year-end reconciliation is the most critical reconciliation of the financial year. It forms part of the Annual Financial Statements (AFS) audit file and is examined by the AGSA."),
    space(),
    h2("6.1  Year-End Reconciliation Checklist"),
    num("Confirm all 12 monthly reconciliations for the financial year are complete and signed off."),
    num("Ensure all transactions for Period 12 (June) have been approved and posted in both the asset register and the GL."),
    num("Perform the Period 12 reconciliation. All variances must be resolved before the AFS can be signed off."),
    num("Export the year-end reconciliation report and include it in the AFS audit file as a working paper."),
    num("Prepare a summary note documenting any reconciling items that remain and their planned resolution."),
    num("Have the CFO sign the year-end reconciliation sign-off form."),
    space(),
    h2("6.2  Materiality Threshold"),
    p("The municipality's Asset Management Policy defines a materiality threshold for reconciliation purposes. Variances below this threshold (e.g. R 1,000) are considered immaterial and do not need to be individually resolved. The year-end reconciliation must achieve a zero or sub-materiality variance on the net carrying value line."),
    space(),
    warn("WARNING:","A net carrying value variance at year-end that exceeds the materiality threshold will result in a finding by the AGSA. This finding may lead to a qualified audit opinion if it relates to a misstatement in PPE. Do not close the financial year with an unresolved material variance."),
    new Paragraph({children:[new PageBreak()]}),

    h1("7. Reconciliation Reports"),
    p("The Reconciliation module provides the following reporting outputs:"),
    space(),
    ref2([
      ["Period Reconciliation Summary","A one-page summary for each period showing the total register balance, GL balance, and variance per category. Used as the monthly working paper."],
      ["Year-to-Date Reconciliation","Shows reconciliation status for all periods from Period 1 to the current period, identifying whether each period was in balance."],
      ["Reconciliation Variance Detail","A drill-down report showing the individual transactions that contribute to any remaining variance. Useful for investigation."],
      ["Audit File Reconciliation Package","A combined PDF/Excel export of all period reconciliations for the financial year, formatted for the AGSA audit file."],
    ]),
    new Paragraph({children:[new PageBreak()]}),

    h1("8. Common Questions and Troubleshooting"),
    ref2([
      ["The register balance is higher than the GL","Check for recently approved acquisitions in the asset register that have not yet been capitalised via a GL journal. Also check for WIP-to-FAR transfers that are pending in the GL."],
      ["The accumulated depreciation variance is large","Check whether all depreciation runs have been approved in the Workflow Inbox. Also verify the GL depreciation postings match the periods."],
      ["I cannot change the register balance column","The register balance is calculated directly from the approved transactions and cannot be manually edited. To correct it, capture the appropriate transaction (e.g. Prior Year Adjustment) in the relevant module."],
      ["The same variance appears every month and never resolves","This is a systematic issue — likely an item that was posted in one system but not the other at the beginning of the financial year. Trace it back to the opening balance. This may require a Prior Year Adjustment at the asset register level."],
      ["The reconciliation shows a credit variance (GL is higher than register)","An asset may have been capitalised in the GL without being registered in the asset system. Identify the GL asset entry and register the corresponding asset in the Asset Records module."],
    ]),
    space(),
    success("RECONCILIATION SUCCESS:","The reconciliation is complete when every category row shows a green checkmark, all variance cells show zero, and the Finance Manager has signed off. The reconciliation export is then ready to be filed in the working papers."),
  ];
}

(async()=>{
  const doc=new Document({
    numbering:{config:[{reference:"default-numbering",levels:[{level:0,format:"decimal",text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:360,hanging:260}}}}]}]},
    styles:{paragraphStyles:[{id:"Normal",name:"Normal",run:{font:"Calibri",size:22,color:BLACK}}]},
    sections:[{
      headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"Asset Management System — Reconciliation User Manual",size:18,color:"888888",font:"Calibri"})]})]})},
      footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Asset Management System — Confidential  |  Page ",size:18,color:"888888",font:"Calibri"}),new TextRun({children:[new PageNumberElement()],size:18,color:"888888",font:"Calibri"})]})]})},
      children:buildChildren()
    }]
  });
  const buf=await Packer.toBuffer(doc);
  writeFileSync(join(__dirname,"Reconciliation_UserManual.docx"),buf);
  console.log("✓ Reconciliation_UserManual.docx written");
})();
