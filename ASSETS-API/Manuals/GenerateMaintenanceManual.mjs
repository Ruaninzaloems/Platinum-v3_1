// GenerateMaintenanceManual.mjs — Full detail, Acquisitions-level
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
  new Paragraph({children:[new TextRun({text:'MAINTENANCE',bold:true,size:64,color:NOTE_BORD,allCaps:true,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:120}}),
  new Paragraph({children:[new TextRun({text:'User Manual',size:48,color:"475569",font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:600}}),
  new Paragraph({children:[new TextRun({text:'─'.repeat(60),color:"E2E8F0",size:22,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:200}}),
  ...([['System','MFMA/GRAP/mSCOA Asset Management'],['Module','Maintenance — Corrective Maintenance Request Management'],['Compliance','GRAP 17, MFMA Section 63, Municipal Asset Management Policy'],['Version','1.0'],['Prepared for','Asset Management System'],['Classification','Internal Use']]).map(([k,v])=>ref2([[k,v]])).flat(),
  new Paragraph({children:[new TextRun({text:'',size:24})],spacing:{before:600}}),
  new Paragraph({children:[new PageBreak()]}),
];}
function toc(){return[h1("Table of Contents"),new TableOfContents("Table of Contents",{hyperlink:true,headingStyleRange:"1-3",stylesWithLevels:[new StyleLevel("Heading1",1),new StyleLevel("Heading2",2),new StyleLevel("Heading3",3)]}),new Paragraph({children:[new PageBreak()]})];}

function buildChildren(){
  const mainImg=img("maintenance.jpg",560,340);
  return[
    ...coverPage(),
    ...toc(),

    h1("1. Introduction"),
    p("The Maintenance module manages corrective maintenance requests for municipal assets. When an asset is damaged, malfunctioning, or deteriorating, a maintenance request is logged in this module to track the problem, assign responsibility, and monitor resolution. This provides an audit trail of all maintenance activities, which is essential for compliance with MFMA Section 63 (asset safeguarding) and for supporting condition assessments in the asset register."),
    space(),
    h2("1.1  Purpose and Scope"),
    p("The Maintenance module covers:"),
    bl("Logging corrective maintenance requests when an asset requires repair or attention."),
    bl("Tracking the status of each request from submission through to approval and closure."),
    bl("Linking maintenance requests to specific asset types, categories, and service groups."),
    bl("Monitoring the maintenance workload through KPI summary cards."),
    bl("Filtering and searching the maintenance register for reporting and management purposes."),
    space(),
    note("NOTE:","The Maintenance module covers corrective (reactive) maintenance — repairs needed due to failures or damage. Planned preventive maintenance schedules are managed separately in the Asset Management Policy and are not yet tracked in this module."),
    space(),
    h2("1.2  Who Uses Maintenance"),
    ref2([
      ["Maintenance Officer / Technician","Logs new maintenance requests when a fault or damage is identified."],
      ["Asset Manager","Reviews the maintenance register, approves or rejects requests, and monitors the overall maintenance backlog."],
      ["Service Group Manager","Reviews requests filtered to their service group (e.g. Roads, Buildings, Fleet)."],
      ["CFO / Finance Manager","Reviews the total maintenance backlog on the Dashboard KPI. Uses data to motivate maintenance budget allocations."],
      ["Internal Auditor","Reviews the maintenance register to assess whether Poor-rated assets have active maintenance requests."],
    ]),
    space(),
    h2("1.3  Compliance Context"),
    ref2([
      ["MFMA Section 63","The CFO must ensure assets are safeguarded and maintained. The maintenance register is the primary evidence that the municipality is actively managing asset condition."],
      ["GRAP 17.12","Distinguishes between maintenance expenditure (expense) and improvements that qualify for capitalisation. The Maintenance module tracks maintenance; capitalisation is handled via Cost Adjustments in Transactions."],
      ["Municipal Asset Management Policy","The municipality's own policy defines response time standards for each priority level. The Lead Time field in the request form operationalises this policy."],
    ]),
    new Paragraph({children:[new PageBreak()]}),

    h1("2. Navigating to Maintenance"),
    p("Click Maintenance in the left-hand navigation sidebar. The module opens to the Maintenance Request List — a table showing all logged maintenance requests."),
    space(),
    mainImg ? mainImg : space(),
    mainImg ? caption("Figure 1 — Maintenance Request List showing KPI cards, filter controls, and the request register table.") : space(),
    space(),
    h2("2.1  KPI Summary Cards"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("KPI Card",35),hCell("Description",65)]}),
      ...[
        ["Total Requests","Total count of all maintenance requests in the register regardless of status or date."],
        ["Pending Approval","Count of requests that have been submitted but not yet approved or rejected by a manager."],
        ["In Progress","Count of requests that have been approved and are currently being worked on."],
        ["Approved","Count of requests that have been fully approved and resolved."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    new Paragraph({children:[new PageBreak()]}),

    h1("3. Creating a New Maintenance Request"),
    p("When a maintenance need is identified for a municipal asset, a new request must be logged immediately. Do not wait for the repair to start before creating the request — the request is the trigger that initiates the formal approval and tracking process."),
    space(),
    h2("3.1  Opening the New Request Form"),
    p("Click the New Request button in the top-right corner of the Maintenance module. The form expands below the button (or opens as a panel, depending on screen size)."),
    space(),
    h2("3.2  New Maintenance Request Fields"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Field",28),hCell("Required",15),hCell("Description",57)]}),
      fieldRow("Service Group",true,"The municipal service group responsible for this asset category (e.g. Roads and Stormwater, Buildings and Facilities, Fleet Management). Select from the dropdown — only configured service groups appear.",LIGHT_GREY),
      fieldRow("Asset Type",true,"The type of asset requiring maintenance (e.g. Movable, Infrastructure, Immovable). Selecting the type filters the Category dropdown.",undefined),
      fieldRow("Asset Category",true,"The category of the asset within the selected type (e.g. Vehicles, Buildings). Filters the Sub-Category dropdown.",LIGHT_GREY),
      fieldRow("Asset Sub-Category",false,"Optional further classification of the asset type (e.g. Light Motor Vehicles within Vehicles).",undefined),
      fieldRow("Request Date",true,"The date on which the maintenance need was identified. Usually today's date. Used to calculate the proposed closing date.",LIGHT_GREY),
      fieldRow("Lead Time",true,"The severity/priority classification from the configured Lead Time options (e.g. Emergency — 1 day, Urgent — 5 days, Routine — 30 days). Determines the Proposed Closing Date automatically.",undefined),
      fieldRow("Proposed Closing Date",false,"Calculated automatically from Request Date + Lead Time (days). Read-only. Editable by the approving manager if needed.",LIGHT_GREY),
      fieldRow("Description",true,"A detailed description of the maintenance problem. Be specific: describe the symptoms, the location of the fault, and any safety risks. This description is used by the technician to prioritise and execute the repair.",undefined),
    ]}),
    space(),
    h2("3.3  Submitting a New Request — Step by Step"),
    stepBanner(1,4,"Open the Form"),
    p("Click New Request. The form panel expands. Do not navigate away before saving — unsaved forms are not retained."),
    space(),
    stepBanner(2,4,"Select Service Group, Asset Type and Category"),
    p("Select the Service Group first, then the Asset Type. Once a type is selected, the Category dropdown is enabled. Select the category and, if applicable, the sub-category."),
    space(),
    stepBanner(3,4,"Set Request Date, Lead Time, and Description"),
    p("Set the Request Date (usually today). Select the Lead Time that best matches the urgency of the issue. The Proposed Closing Date is automatically calculated. Enter a detailed description of the maintenance required."),
    space(),
    stepBanner(4,4,"Submit the Request"),
    p("Click Submit Request. The request is saved with a status of Pending Approval and appears in the maintenance register. The system generates a unique Request ID."),
    space(),
    tip("TIP:","The Description field is the most important part of the request. A vague description such as 'vehicle broken' wastes time and delays the repair. Write: 'Fleet vehicle REG ABC123 GP — engine overheating, coolant leaking from radiator hose — located in Ward 5 Depot'."),
    space(),
    h2("3.4  Lead Time Configuration"),
    p("Lead times are pre-configured by the system administrator in the Maintenance Configuration section. Each lead time has a name, a number of days, and a description. Common examples:"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Lead Time Name",30),hCell("Days",15),hCell("When to Use",55)]}),
      ...[
        ["Emergency","1","Immediate safety risk or service delivery failure. Examples: sewage spill, electrical hazard, fire damage."],
        ["Urgent","5","Significant operational impact but not an immediate safety risk. Examples: main vehicle breakdown, critical pump failure."],
        ["High Priority","14","Asset degradation accelerating with moderate operational impact. Examples: roof leaking, generator fault."],
        ["Routine","30","Normal wear and maintenance. Examples: scheduled servicing, minor repairs."],
        ["Low Priority","60","Non-urgent improvements. Examples: cosmetic repairs, minor painting, landscaping."],
      ].map(([a,b,c],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined,align:AlignmentType.CENTER}),dc(c,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    new Paragraph({children:[new PageBreak()]}),

    h1("4. Filtering the Maintenance Register"),
    p("The filter bar at the top of the maintenance list allows you to narrow the register to specific subsets of requests for management and reporting purposes."),
    space(),
    h2("4.1  Filter Options"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Filter",30),hCell("Description",70)]}),
      ...[
        ["Service Group","Shows only requests belonging to the selected service group. Useful for department managers reviewing their own workload."],
        ["Status","Filters by approval status: All, Approved, or Pending. Use 'Pending' to see the current backlog requiring management action."],
        ["Date From / To","Filters by the request date within a specified date range. Use this to generate a period-specific maintenance report."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    p("After setting the filters, click the Filter button (magnifying glass icon) to apply them. Click Clear to remove all filters and return to the full list."),
    new Paragraph({children:[new PageBreak()]}),

    h1("5. Maintenance Request List"),
    p("The maintenance register table displays all requests matching the current filter settings. Each row is one maintenance request."),
    space(),
    h2("5.1  Table Columns"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Column",25),hCell("Description",75)]}),
      ...[
        ["ID","System-generated unique maintenance request identifier (e.g. MR-00045)."],
        ["Description","The maintenance description entered by the requester. Shows a truncated preview — click the row to see the full description."],
        ["Service Group","The service group responsible for this request."],
        ["Asset Type","The asset type classification of the affected asset."],
        ["Request Date","The date the request was logged."],
        ["Lead Time","The selected lead time category and number of days."],
        ["Proposed Closing Date","The target date for resolving the request (Request Date + Lead Time days)."],
        ["Status","Current status: Pending (amber), Approved (green), Rejected (red), In Progress (blue)."],
        ["Actions","View detail (eye icon), Approve (green tick — Manager role only), Reject (red X — Manager role only)."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    warn("WARNING:","Requests with a Proposed Closing Date that has already passed without resolution represent a maintenance backlog risk. These overdue requests will be highlighted in the system. Escalate overdue emergency and urgent requests to the relevant department manager immediately."),
    new Paragraph({children:[new PageBreak()]}),

    h1("6. Viewing and Approving a Request"),
    p("Clicking on any row in the maintenance register opens the full Request Detail view. This shows all fields, the description, and the action buttons available based on your user role."),
    space(),
    h2("6.1  Approving a Maintenance Request"),
    p("Only users with an Asset Manager, Finance Manager, or Department Manager role can approve requests. To approve:"),
    space(),
    num("Open the request detail by clicking the row."),
    num("Review the description, service group, asset type, and proposed closing date."),
    num("If the request is valid and resources are available, click the Approve button."),
    num("Optionally, add an approval note (e.g. 'Approved — assign to Fleet Workshop, priority scheduling')."),
    num("Click Confirm Approval. The request status changes to Approved and the requestor is notified."),
    space(),
    h2("6.2  Rejecting a Maintenance Request"),
    p("A request should be rejected if it is a duplicate, incorrectly categorised, or if the maintenance is not required. To reject:"),
    space(),
    num("Open the request detail."),
    num("Click the Reject button."),
    num("Enter a rejection reason in the notes field. This reason is visible to the requestor and is required."),
    num("Click Confirm Rejection. The request status changes to Rejected."),
    space(),
    note("NOTE:","A rejected request can be resubmitted by the original requestor with corrections. The previous rejection reason remains visible in the request history for audit purposes."),
    space(),
    h2("6.3  Closing a Completed Request"),
    p("Once the maintenance work has been completed, the request should be formally closed:"),
    space(),
    num("Open the approved request."),
    num("Click the Close Request button."),
    num("Enter the actual completion date and a summary of the work done."),
    num("If applicable, update the condition grade of the related asset in Asset Records."),
    num("Click Confirm Closure. The request status changes to Closed / Completed."),
    new Paragraph({children:[new PageBreak()]}),

    h1("7. Linking Maintenance to Asset Condition"),
    p("The Maintenance module works closely with the Asset Records module. When a maintenance request is approved and completed, the user should update the Asset Record to reflect the improved condition:"),
    space(),
    num("After closing the maintenance request, navigate to Asset Records."),
    num("Find the affected asset using the search or filter."),
    num("Open the asset detail record."),
    num("Update the Asset Condition field (from Poor to Fair, or Fair to Good) based on the outcome of the maintenance work."),
    num("Add a note in the Condition Notes field referencing the Maintenance Request ID."),
    num("Save the updated asset record."),
    space(),
    tip("TIP:","Always update the asset condition rating after completing a maintenance repair. The Dashboard condition distribution chart and AI Insights are based on the condition data in Asset Records. Outdated condition ratings lead to misleading reports and compliance alerts."),
    new Paragraph({children:[new PageBreak()]}),

    h1("8. Year-End Maintenance Review"),
    p("At financial year-end, the following maintenance-related procedures should be completed:"),
    space(),
    num("Filter the maintenance register by Status = Pending and review all outstanding requests. Escalate any that have been pending for more than 30 days."),
    num("Review all requests with a Proposed Closing Date in the current financial year that are not yet Closed. These represent outstanding maintenance obligations that may need to be accrued."),
    num("Ensure all Poor-rated assets in the asset register have a corresponding open or completed maintenance request. A Poor-rated asset with no maintenance history is an audit red flag."),
    num("Generate a Maintenance Activity Report from the Reports module for the full financial year for inclusion in the Asset Management Plan."),
    space(),
    success("AUDIT READINESS:","The maintenance register is audit-ready when every Poor-rated asset has at least one open or recently closed maintenance request, there are no overdue Emergency or Urgent requests, and the year-end maintenance report can be produced showing requests per service group and resolution rates."),
    new Paragraph({children:[new PageBreak()]}),

    h1("9. Common Questions and Troubleshooting"),
    ref2([
      ["I cannot see the Approve button","The Approve button is only visible to users with Manager-level role. Standard users can only submit requests. Contact your system administrator to request elevated access."],
      ["The Proposed Closing Date is wrong","The date is calculated from Request Date + Lead Time days. If the lead time is incorrect, change the Lead Time selection before submitting. After submission, a manager can adjust the closing date when approving."],
      ["I submitted a request with the wrong description","A pending request can be cancelled and resubmitted. If already approved, add a note in the approval comments section. You cannot edit a submitted request — cancel and resubmit."],
      ["The service group I need is not in the list","Service groups are configured by the system administrator in the Configuration module. Contact the administrator to add the missing service group."],
      ["A request is showing as overdue but the work was completed","The request has not been formally closed in the system. Open the approved request and click Close Request to record the completion."],
      ["The Dashboard shows a high Maintenance count but I cannot find the requests","The Dashboard count shows all open (Pending + Approved) requests. Filter by Status = Approved in the maintenance register to find requests that have been approved but not yet closed."],
    ]),
  ];
}

(async()=>{
  const doc=new Document({
    numbering:{config:[{reference:"default-numbering",levels:[{level:0,format:"decimal",text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:360,hanging:260}}}}]}]},
    styles:{paragraphStyles:[{id:"Normal",name:"Normal",run:{font:"Calibri",size:22,color:BLACK}}]},
    sections:[{
      headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"Asset Management System — Maintenance User Manual",size:18,color:"888888",font:"Calibri"})]})]})},
      footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Asset Management System — Confidential  |  Page ",size:18,color:"888888",font:"Calibri"}),new TextRun({children:[new PageNumberElement()],size:18,color:"888888",font:"Calibri"})]})]})},
      children:buildChildren()
    }]
  });
  const buf=await Packer.toBuffer(doc);
  writeFileSync(join(__dirname,"Maintenance_UserManual.docx"),buf);
  console.log("✓ Maintenance_UserManual.docx written");
})();
