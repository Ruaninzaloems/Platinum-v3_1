// GenerateDashboardManual.mjs — Full detail, Acquisitions-level
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
  new Paragraph({children:[new TextRun({text:'DASHBOARD',bold:true,size:72,color:NOTE_BORD,allCaps:true,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:120}}),
  new Paragraph({children:[new TextRun({text:'User Manual',size:48,color:"475569",font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:600}}),
  new Paragraph({children:[new TextRun({text:'─'.repeat(60),color:"E2E8F0",size:22,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:200}}),
  ...([['System','MFMA/GRAP/mSCOA Asset Management'],['Module','Dashboard — Executive KPIs, Charts and AI Insights'],['Compliance','GRAP 17, GRAP 103, mSCOA v6.4, MFMA'],['Version','1.0'],['Prepared for','Asset Management System'],['Classification','Internal Use']]).map(([k,v])=>ref2([[k,v]])).flat(),
  new Paragraph({children:[new TextRun({text:'',size:24})],spacing:{before:600}}),
  new Paragraph({children:[new PageBreak()]}),
];}
function toc(){return[h1("Table of Contents"),new TableOfContents("Table of Contents",{hyperlink:true,headingStyleRange:"1-3",stylesWithLevels:[new StyleLevel("Heading1",1),new StyleLevel("Heading2",2),new StyleLevel("Heading3",3)]}),new Paragraph({children:[new PageBreak()]})];}

function buildChildren(){
  const dashImg=img("dashboard.jpg",560,340);
  return[
    ...coverPage(),
    ...toc(),

    h1("1. Introduction"),
    p("This manual covers the Dashboard module of the Asset Management System. The Dashboard is the home screen that every user sees immediately after logging in. It provides a real-time executive summary of the municipal asset register, giving finance officers, asset managers, and administrators an instant view of portfolio health, depreciation trends, acquisition activity, and AI-generated compliance insights."),
    space(),
    h2("1.1  Purpose and Scope"),
    p("The Dashboard consolidates information from across all modules into a single, always-current screen. It is designed to answer the most common questions that senior staff ask at a glance:"),
    bl("How many assets does the municipality own, and what are they worth?"),
    bl("How much depreciation has been charged in the current financial year?"),
    bl("What is the overall condition of the asset portfolio?"),
    bl("Are there compliance risks or anomalies that need urgent attention?"),
    bl("How do acquisitions and disposals compare month by month?"),
    space(),
    h2("1.2  Who Uses the Dashboard"),
    ref2([
      ["All Users","The Dashboard is the landing page for all roles immediately after login."],
      ["Finance Manager / CFO","Uses KPI cards and AI insights to monitor compliance and portfolio risk."],
      ["Asset Manager","Monitors depreciation trends, condition distribution, and monthly acquisition rates."],
      ["System Administrator","Can clear test data from the red button in the top right corner (never in production)."],
    ]),
    space(),
    h2("1.3  Compliance Context"),
    ref2([
      ["GRAP 17","Property, Plant and Equipment — asset values and depreciation figures displayed reflect GRAP 17 fair-value and cost-model calculations."],
      ["GRAP 103","Heritage Assets — heritage asset values are included in the total portfolio KPIs."],
      ["MFMA Section 63","The CFO must ensure the safeguarding of municipal assets. The Dashboard provides monitoring data to support this obligation."],
      ["mSCOA v6.4","All classification data visible in charts reflects mSCOA segment codes and complies with the Chart of Accounts structure."],
    ]),
    new Paragraph({children:[new PageBreak()]}),

    h1("2. Navigating to the Dashboard"),
    p("The Dashboard is always accessible from the left-hand navigation sidebar. It is the first item in the menu and is represented by a dashboard or grid icon. You can return to the Dashboard from any other screen by clicking its menu entry."),
    space(),
    dashImg ? dashImg : space(),
    dashImg ? caption("Figure 1 — The Asset Management System Dashboard showing KPI cards, visualisation charts and AI Insights panel.") : space(),
    space(),
    h2("2.1  Header Area"),
    p("The header row at the very top shows:"),
    bl("Left: The title \"Dashboard\" with a subtitle showing the municipality name, active financial year (e.g. 2024/2025), and current financial period (e.g. Period 9 — March)."),
    bl("Right: A \"Clear Test Data\" button bordered in red. This is an administrative tool exclusively for removing sample/test records. It must never be used in a live production environment."),
    space(),
    warn("WARNING:","Never click \"Clear Test Data\" in a live production environment. This permanently deletes test records and cannot be undone without a full database restore. The action immediately takes effect — there is no secondary confirmation dialog after the button is pressed."),
    space(),
    h2("2.2  Loading the Dashboard"),
    p("When you first navigate to the Dashboard, a loading spinner appears in the centre of the screen while the server calculates the KPI totals and chart data. Once loaded, all cards and charts appear together. If the spinner persists for more than 30 seconds:"),
    bl("Check that the Backend API workflow is running (visible in the system status)."),
    bl("Verify that the database server is online and accessible."),
    bl("Try navigating away and back to the Dashboard to trigger a fresh load."),
    new Paragraph({children:[new PageBreak()]}),

    h1("3. KPI Summary Cards"),
    p("The first section below the header is a row of Key Performance Indicator (KPI) cards. Each card shows a single critical metric in large, bold text with a coloured icon. Cards update in real time each time you load or refresh the Dashboard — there is no manual refresh button."),
    space(),
    h2("3.1  Anatomy of a KPI Card"),
    p("Each KPI card contains:"),
    bl("Coloured Icon: A square icon badge in the top-left corner. The colour codes the metric type (blue = quantity, green = monetary value, amber = risk/pending items, purple = depreciation)."),
    bl("Label: A text label below the icon describing what the number represents."),
    bl("Value: The large number or formatted amount shown prominently below the label. Currency amounts appear as R X.XM (Rand millions) or full R X,XXX,XXX for smaller amounts."),
    bl("Sub-label (optional): A secondary line in smaller grey text below the main value, providing additional context such as a comparison period or data qualifier."),
    space(),
    h2("3.2  KPI Card Descriptions"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("KPI Label",35),hCell("Description",65)]}),
      ...[
        ["Total Assets","Count of all active assets in the register for the current municipality and financial year. Disposed or written-off assets are excluded."],
        ["Total Asset Value (Cost)","Gross original cost (purchase amount) of all registered assets before deducting any depreciation or impairment."],
        ["Total Carrying Value","Net book value of all assets after deducting accumulated depreciation and accumulated impairment. This is the GRAP 17-compliant value shown on the Statement of Financial Position."],
        ["Total Depreciation (YTD)","Sum of all depreciation charged from Period 1 through to the current period in the active financial year across all asset classes."],
        ["Pending Approvals","Number of transactions (depreciation runs, disposals, impairments, revaluations) awaiting approval in the Workflow Inbox."],
        ["Open Maintenance Requests","Total number of corrective maintenance requests that have not yet been closed across all service groups."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    tip("TIP:","If a KPI shows zero when you expect a value, verify that the active financial year in Administration → Organisation Settings is correctly set. The Dashboard always reads data from the system's configured active financial year."),
    space(),
    h2("3.3  Interpreting the KPI Cards Together"),
    p("Read the KPI cards as a group to understand the overall health of the asset portfolio:"),
    bl("A large gap between Total Asset Value (Cost) and Total Carrying Value indicates a mature, heavily depreciated portfolio. Consider a revaluation exercise."),
    bl("A high Pending Approvals count at month-end means the Workflow Inbox needs urgent attention to keep the month-end close on schedule."),
    bl("A rising Open Maintenance Requests count may signal a maintenance backlog that could trigger an adverse audit finding under MFMA Section 63."),
    new Paragraph({children:[new PageBreak()]}),

    h1("4. Charts and Visual Analytics"),
    p("Below the KPI row are four chart panels arranged in two rows of two. All charts are calculated server-side and reflect the data state at the time the Dashboard loaded. Charts are display-only — they are not interactive and cannot be filtered."),
    space(),
    h2("4.1  Asset Value by Category"),
    p("This horizontal bar chart on the upper-left shows the total carrying value (net book value) of assets broken down by asset category. Each category occupies its own row. The length of the bar represents the relative value of that category compared to the highest-value category."),
    space(),
    p("How to read each row:"),
    bl("Category name (left) — truncated with ellipsis if the name is very long. Hover over it to see the full name in some browsers."),
    bl("Blue gradient bar — length is proportional to the carrying value relative to the maximum category value."),
    bl("Rand amount (right) — exact carrying value formatted as R X.XM."),
    space(),
    note("NOTE:","Infrastructure assets (roads, electricity networks, water reticulation) typically dominate this chart for most municipalities, often representing 80–95% of total asset value."),
    space(),
    h2("4.2  Asset Condition Distribution"),
    p("This stacked progress chart on the upper-right shows the percentage of assets in each condition grade: Good, Fair, and Poor."),
    space(),
    ref2([
      ["Good (Green)","Asset is in excellent working condition. No maintenance urgency."],
      ["Fair (Amber)","Asset shows signs of wear or ageing. Plan maintenance within the current or next budget cycle."],
      ["Poor (Red)","Asset is deteriorating or has failed. Requires immediate maintenance or end-of-life replacement planning."],
    ]),
    space(),
    p("Each row in the chart shows the condition name, the count and percentage in brackets, and a progress bar filled to the corresponding percentage."),
    space(),
    warn("WARNING:","A high percentage of assets rated Poor is a significant audit risk. External auditors typically request a written maintenance plan for all Poor-rated assets. Ensure the Maintenance module has active requests linked to these assets before year-end."),
    space(),
    h2("4.3  Monthly Depreciation"),
    p("The lower-left chart is a vertical bar chart showing total depreciation charged per month across all assets for the active financial year. Each bar represents one month (July through June). The bar height reflects the depreciation amount in Rand millions."),
    space(),
    p("What to watch for:"),
    bl("Consistent bar heights indicate that depreciation runs are being executed on schedule every period."),
    bl("A missing bar (zero height) for a month means no depreciation run was completed. This must be corrected before year-end — contact the system administrator."),
    bl("An unusually tall bar may indicate a double-run error. Check the Transactions module audit log."),
    bl("Bars that taper gradually at year-end are normal as assets become fully depreciated mid-year."),
    space(),
    tip("TIP:","Compare the Monthly Depreciation chart against the period of the pending Workflow Inbox approvals. If depreciation was run but not yet approved, the KPI total may not yet reflect the full year-to-date amount."),
    space(),
    h2("4.4  Acquisitions vs Disposals"),
    p("The lower-right chart is a grouped bar chart comparing, for each month, the number of new assets registered (acquisitions, green bars) versus the number of assets disposed of (disposals, red bars). Each month shows two side-by-side bars."),
    space(),
    p("Patterns to watch for:"),
    bl("Consistent small green bars with occasional red bars = normal portfolio management (steady capital investment, occasional end-of-life disposals)."),
    bl("A spike in red bars mid-year = a write-off or disposal exercise. Ensure all disposals are documented and approved."),
    bl("No green bars for several months = no new assets registered. Check whether capital projects are being transferred from WIP to the asset register."),
    new Paragraph({children:[new PageBreak()]}),

    h1("5. AI Insights Panel"),
    p("At the bottom of the Dashboard, when there are active insights, is the AI Insights panel. This panel displays automatically generated compliance alerts and recommendations based on real-time analysis of the asset register data. The panel header shows the number of active insights."),
    space(),
    h2("5.1  What Triggers an Insight"),
    p("The AI engine continuously monitors the asset register for the following conditions:"),
    bl("Assets with no depreciation charged for two or more consecutive periods (missed run)."),
    bl("Assets whose remaining useful life is zero but whose carrying amount is still positive (under-depreciated)."),
    bl("Assets rated Poor condition with no open maintenance request in the Maintenance module."),
    bl("Assets classified as Infrastructure without a CIDMS classification code assigned."),
    bl("Large variances between asset register totals and general ledger balances (reconciliation failure)."),
    bl("Year-end approaching with pending transaction approvals still in the Workflow Inbox."),
    bl("Assets with no in-service date or commissioning date recorded (incomplete data)."),
    bl("Revaluation overdue based on the municipality's configured revaluation frequency."),
    space(),
    h2("5.2  Anatomy of an Insight Card"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Element",30),hCell("Description",70)]}),
      ...[
        ["Severity Icon","Colour-coded circle: Red circle = Critical, Amber circle = Warning, Blue circle = Information. The icon type conveys urgency."],
        ["Title","A short bold headline summarising the compliance issue."],
        ["Message","Plain-language explanation of the finding and its significance."],
        ["Recommendation","Green highlighted block (when present) with specific corrective action to take."],
        ["Legislation Reference","Purple badge (when present) citing the GRAP standard, MFMA section, or mSCOA rule that applies."],
        ["Insight Type","Amber badge classifying the category: Compliance Risk, Financial Accuracy, Operational Risk, Data Quality."],
        ["Confidence Score","Percentage in the top-right corner. Higher percentage = more certain the insight is valid."],
        ["Dismiss Button","Removes the insight from the panel view. Does not fix the underlying issue."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    h2("5.3  Severity Levels and Required Actions"),
    ref2([
      ["Critical (Red)","Requires immediate action. May represent a material misstatement or regulatory breach. Escalate to the Finance Manager and CFO immediately. Do not dismiss without resolving the root cause."],
      ["Warning (Amber)","Should be addressed within the current or next financial period. Document a remediation plan and assign a responsible officer."],
      ["Information (Blue)","Informational only. No immediate action required, but the finance team should be aware. Review at the next management meeting."],
    ]),
    space(),
    h2("5.4  Acting on an Insight — Step by Step"),
    stepBanner(1,4,"Read the Insight"),
    p("Open the insight card and read the title, message, and legislation reference carefully. Understand what the system is flagging before taking action."),
    space(),
    stepBanner(2,4,"Follow the Recommendation"),
    p("If a green recommendation box is present, follow it exactly. Navigate to the relevant module (Transactions, Workflow Inbox, Asset Records, Maintenance, etc.) to perform the corrective action."),
    space(),
    stepBanner(3,4,"Resolve the Root Cause"),
    p("Complete the action in the relevant module. For example: run the missed depreciation period in Transactions, approve the pending item in the Workflow Inbox, or update the condition rating in Asset Records."),
    space(),
    stepBanner(4,4,"Dismiss the Insight"),
    p("Return to the Dashboard. If the issue is resolved, click the Dismiss button on the insight card. If the insight reappears on the next Dashboard load, the root cause has not been fully resolved."),
    space(),
    warn("WARNING:","Dismissing an insight only hides it from the panel. It does not mark the compliance issue as resolved. The underlying finding will reappear on the next Dashboard load if the root cause is not addressed."),
    space(),
    note("NOTE:","Insights with confidence scores below 50% are less certain. Investigate before acting. Insights above 85% confidence represent well-confirmed patterns based on multiple data points."),
    new Paragraph({children:[new PageBreak()]}),

    h1("6. Common Questions and Troubleshooting"),
    ref2([
      ["All KPIs show zero","The active financial year has no asset data, or the system is still loading. Verify the financial year in Administration → Organisation Settings and that assets have been imported."],
      ["AI Insights panel is absent","No active insights exist. This is normal when the asset register is fully compliant. No action needed."],
      ["Condition chart shows 0% for all grades","Assets are registered but no condition grades have been assigned. Update the Condition field for each asset in Asset Records."],
      ["A month is missing from the depreciation chart","A depreciation run was not executed for that period. Use the Transactions module to run depreciation for the missing month."],
      ["Clear Test Data button not visible","This button is only shown to users with Administrator role. Contact your system administrator if you need to clear test data."],
      ["A KPI card shows a negative carrying value","One or more assets have accumulated depreciation exceeding their cost, usually a data entry error. Use Prior Year Adjustments to correct the affected asset."],
      ["Dashboard loads very slowly","Large asset registers (>10,000 records) take longer to aggregate. This is normal. If load time exceeds 2 minutes, contact the system administrator to review database performance."],
    ]),
    space(),
    success("HEALTHY DASHBOARD:","When all KPI cards show realistic values, the condition chart shows a spread across Good/Fair/Poor, there are no Critical AI insights, and the depreciation chart shows consistent monthly bars, your Dashboard indicates a well-maintained, audit-ready asset register."),
  ];
}

(async()=>{
  const doc=new Document({
    numbering:{config:[{reference:"default-numbering",levels:[{level:0,format:"decimal",text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:360,hanging:260}}}}]}]},
    styles:{paragraphStyles:[{id:"Normal",name:"Normal",run:{font:"Calibri",size:22,color:BLACK}}]},
    sections:[{
      headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"Asset Management System — Dashboard User Manual",size:18,color:"888888",font:"Calibri"})]})]})},
      footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Asset Management System — Confidential  |  Page ",size:18,color:"888888",font:"Calibri"}),new TextRun({children:[new PageNumberElement()],size:18,color:"888888",font:"Calibri"})]})]})},
      children:buildChildren()
    }]
  });
  const buf=await Packer.toBuffer(doc);
  writeFileSync(join(__dirname,"Dashboard_UserManual.docx"),buf);
  console.log("✓ Dashboard_UserManual.docx written");
})();
