// GenerateWorkflowInboxManual.mjs — Full detail, Acquisitions-level
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
  new Paragraph({children:[new TextRun({text:'WORKFLOW INBOX',bold:true,size:60,color:NOTE_BORD,allCaps:true,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:120}}),
  new Paragraph({children:[new TextRun({text:'User Manual',size:48,color:"475569",font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:600}}),
  new Paragraph({children:[new TextRun({text:'─'.repeat(60),color:"E2E8F0",size:22,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:200}}),
  ...([['System','MFMA/GRAP/mSCOA Asset Management'],['Module','Workflow Inbox — Approval and Rejection of Pending Transactions'],['Compliance','MFMA Section 62, GRAP 17, mSCOA v6.4, Internal Controls Framework'],['Version','1.0'],['Prepared for','Asset Management System'],['Classification','Internal Use']]).map(([k,v])=>ref2([[k,v]])).flat(),
  new Paragraph({children:[new TextRun({text:'',size:24})],spacing:{before:600}}),
  new Paragraph({children:[new PageBreak()]}),
];}
function toc(){return[h1("Table of Contents"),new TableOfContents("Table of Contents",{hyperlink:true,headingStyleRange:"1-3",stylesWithLevels:[new StyleLevel("Heading1",1),new StyleLevel("Heading2",2),new StyleLevel("Heading3",3)]}),new Paragraph({children:[new PageBreak()]})];}

function buildChildren(){
  const inboxImg=img("workflow-inbox.jpg",560,340);
  return[
    ...coverPage(),
    ...toc(),

    h1("1. Introduction"),
    p("The Workflow Inbox is the internal controls centre of the Asset Management System. Every financial transaction — whether it is a depreciation run, a disposal, an impairment, a revaluation, a new asset acquisition, or a WIP transfer — must pass through the Workflow Inbox for approval before it updates the asset register and the financial reports. The Inbox enforces the segregation of duties required by the MFMA and the municipality's internal controls framework."),
    space(),
    h2("1.1  Why the Approval Workflow Matters"),
    p("MFMA Section 62 requires the Accounting Officer to ensure that effective, efficient, and transparent systems of financial and risk management are maintained. The Workflow Inbox is the system mechanism for enforcing this requirement. Specifically, the Inbox ensures:"),
    bl("No single user can both capture and approve a transaction (segregation of duties)."),
    bl("Every material financial event is reviewed by a senior officer before taking effect."),
    bl("An auditable approval record is maintained for every transaction."),
    bl("Rejected transactions are documented with a reason, creating an accountability trail."),
    space(),
    h2("1.2  Who Uses the Workflow Inbox"),
    ref2([
      ["Finance Manager","Primary approver for depreciation batches, impairments, and cost adjustments. Reviews the daily inbox as part of the morning financial routine."],
      ["CFO","Approves high-value disposals, revaluations, and WIP transfers exceeding the set threshold. Reviews the inbox for critical items."],
      ["Asset Manager","Reviews asset acquisition approvals and WIP transfer records."],
      ["Finance Officer","Views the status of their own captured transactions. Cannot approve their own work."],
      ["System Administrator","Has visibility of all inbox items. Can escalate or reassign items if an approver is absent."],
    ]),
    space(),
    h2("1.3  Approval Method Setting"),
    p("The Workflow Inbox behaviour depends on the Approval Method configured in Administration → Organisation Settings:"),
    ref2([
      ["Manual","Each transaction is individually listed in the Inbox and must be individually approved or rejected. This provides maximum granularity and audit trail."],
      ["Automated","Transactions are batched and can be approved in bulk. Depreciation runs are typically approved in one click rather than line by line. Still requires a human review before approval."],
    ]),
    new Paragraph({children:[new PageBreak()]}),

    h1("2. Navigating to the Workflow Inbox"),
    p("Click Workflow Inbox in the left-hand navigation sidebar. The Inbox opens showing all pending items awaiting your action. A red badge on the sidebar menu item shows the count of pending approvals."),
    space(),
    inboxImg ? inboxImg : space(),
    inboxImg ? caption("Figure 1 — Workflow Inbox showing the pending items list with transaction type badges and approval action buttons.") : space(),
    space(),
    h2("2.1  Inbox Layout"),
    p("The Workflow Inbox is divided into two sections:"),
    bl("My Pending Actions: Items that require your specific approval based on your user role. This is your primary working area."),
    bl("All Items (Admin only): A view showing all inbox items across all users and roles. Only accessible by Admin role users."),
    new Paragraph({children:[new PageBreak()]}),

    h1("3. Inbox Item Overview"),
    p("Each row in the Workflow Inbox represents one pending approval item. Items are sorted by submission date, oldest first, to ensure no item is overlooked."),
    space(),
    h2("3.1  Inbox Columns"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Column",25),hCell("Description",75)]}),
      ...[
        ["Type Badge","Colour-coded badge indicating the transaction type: Depreciation (blue), Disposal (red), Impairment (amber), Acquisition (green), Revaluation (purple), WIP Transfer (teal), Prior Year Adjustment (orange)."],
        ["Reference","The transaction reference number or batch ID. Click this to open the full transaction detail."],
        ["Description","A brief description of the transaction (e.g. 'Depreciation Run — Period 9, FY2024/25 — 1,243 assets')."],
        ["Amount","The total Rand amount of the transaction or batch."],
        ["Submitted By","The username of the person who created the transaction."],
        ["Submission Date","The date and time the transaction was submitted for approval."],
        ["Days Pending","Number of calendar days the item has been waiting for approval. Items pending more than 7 days are highlighted in amber."],
        ["Actions","Approve (green tick), Reject (red X), and View Detail (eye icon) buttons."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    warn("WARNING:","Items pending for more than 14 days at month-end represent an internal control weakness. The external auditor will note that transactions are not being reviewed and approved in a timely manner. Establish a daily or weekly inbox review routine."),
    new Paragraph({children:[new PageBreak()]}),

    h1("4. Approving a Transaction"),
    p("Before approving any inbox item, the approver must review the transaction details and confirm they are accurate and authorised. Never approve without reviewing."),
    space(),
    h2("4.1  Review Checklist Before Approving"),
    p("For each inbox item, verify the following before clicking Approve:"),
    bl("Is the transaction amount reasonable? Does it match the expected value for this period?"),
    bl("Is the transaction date correct? Does it fall in the correct financial period?"),
    bl("Is the submitter authorised to capture this type of transaction?"),
    bl("For depreciation runs: does the asset count match the expected number of active assets?"),
    bl("For disposals: is the supporting approval document (CFO letter, Council resolution) attached?"),
    bl("For acquisitions: is the purchase invoice attached and the useful life assignment reasonable?"),
    bl("For WIP transfers: is the completion certificate attached?"),
    space(),
    h2("4.2  Approving a Single Item — Step by Step"),
    stepBanner(1,4,"Review the Item"),
    p("Click the View Detail button (eye icon) on the inbox row to open the full transaction detail. Read all fields carefully. If the transaction is a depreciation batch, review the total asset count and total amount."),
    space(),
    stepBanner(2,4,"Verify Supporting Documents"),
    p("Where required, check that supporting documents are attached. Click the Documents tab in the transaction detail to view attachments."),
    space(),
    stepBanner(3,4,"Approve or Reject"),
    p("Return to the inbox row and click the green Approve button. A confirmation dialog appears showing the transaction summary. Click Confirm Approval. Alternatively, if there is an issue, click the red Reject button and proceed to the rejection steps."),
    space(),
    stepBanner(4,4,"Confirm the Effect"),
    p("After approval, the item disappears from the pending list. Navigate to the relevant module (e.g. Asset Records → Transaction History) to confirm that the approved transaction has updated the asset's financial balances."),
    space(),
    h2("4.3  Bulk Approval of Depreciation Batches"),
    p("When the Approval Method is set to Automated, depreciation runs create a single batch item in the Inbox rather than individual lines. The batch shows the total asset count and total depreciation amount. To approve the batch:"),
    space(),
    num("Open the batch item by clicking View Detail."),
    num("Review the batch summary: total assets, total depreciation, financial period."),
    num("Scroll through the preview list to spot any anomalies (unusually high or low individual amounts)."),
    num("If satisfied, click Approve Batch. All depreciation entries in the batch are approved simultaneously."),
    num("The Dashboard depreciation chart updates to include the newly approved period."),
    space(),
    tip("TIP:","If you notice one or two suspicious entries in a depreciation batch, you do not need to reject the entire batch. Contact the system administrator to split the batch and approve the correct items individually while the suspicious entries are investigated."),
    new Paragraph({children:[new PageBreak()]}),

    h1("5. Rejecting a Transaction"),
    p("Reject an inbox item when the transaction is incorrect, unauthorised, or requires additional information before it can be approved. Rejection does not delete the transaction — it returns it to the submitter for correction."),
    space(),
    h2("5.1  When to Reject"),
    bl("The transaction amount is incorrect (e.g. wrong depreciation base, incorrect sale price)."),
    bl("The transaction date falls in a period that has already been closed or reconciled."),
    bl("The supporting documentation is missing (no invoice, no disposal authority, no completion certificate)."),
    bl("The asset has been incorrectly selected (wrong asset, duplicate entry)."),
    bl("A calculation error has been identified (e.g. useful life entered in years instead of months)."),
    space(),
    h2("5.2  Rejecting an Item — Step by Step"),
    stepBanner(1,3,"Click the Reject Button"),
    p("In the inbox, click the red X (Reject) button on the item row. A rejection dialog opens."),
    space(),
    stepBanner(2,3,"Enter the Rejection Reason"),
    p("Type a clear, specific rejection reason in the text field. The reason is recorded in the system and is visible to the submitter. Be precise: state exactly what needs to be corrected. Example: 'Invoice not attached — please upload the signed purchase invoice before resubmitting.'"),
    space(),
    stepBanner(3,3,"Confirm the Rejection"),
    p("Click Confirm Rejection. The item is returned to the submitter with a Rejected status. The submitter receives a notification and can correct the transaction and resubmit."),
    space(),
    note("NOTE:","Rejected transactions are permanently recorded in the audit trail. They cannot be deleted. This creates accountability — both the rejection and the reason are visible in the transaction history."),
    new Paragraph({children:[new PageBreak()]}),

    h1("6. Transaction Types in the Inbox"),
    p("The following transaction types appear in the Workflow Inbox. Each has specific review requirements:"),
    space(),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Type",25),hCell("Badge Colour",20),hCell("Key Review Points",55)]}),
      ...[
        ["Depreciation Run","Blue","Verify period and financial year. Check asset count matches active assets. Confirm no double run for same period."],
        ["Asset Acquisition","Green","Confirm purchase invoice attached, correct classification, reasonable useful life, valid mSCOA codes."],
        ["Disposal","Red","Confirm disposal authority document attached. Verify disposal type (Sale/Write-Off/Donation). Check sale proceeds are reasonable."],
        ["Impairment","Amber","Confirm valuation/assessment report attached. Verify impairment amount does not exceed carrying value."],
        ["Impairment Reversal","Amber","Confirm that circumstances have genuinely reversed. Reversal must not exceed original impairment."],
        ["Revaluation","Purple","Confirm independent valuation report attached. Verify valuer registration. Check revaluation date."],
        ["Cost Adjustment","Navy","Confirm that expenditure meets capitalisation criteria (GRAP 17.29). Supporting invoice must be attached."],
        ["WIP Transfer","Teal","Confirm completion certificate attached. Verify that the in-service date, useful life and classification are correctly set on the new asset."],
        ["Prior Year Adjustment","Orange","High-risk item — requires CFO approval. Review the reason and supporting calculations carefully."],
      ].map(([a,b,c],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined,align:AlignmentType.CENTER}),dc(c,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    new Paragraph({children:[new PageBreak()]}),

    h1("7. Inbox Management Best Practices"),
    p("A well-managed Workflow Inbox keeps the asset register current and audit-ready. The following practices are recommended:"),
    space(),
    h2("7.1  Daily Routine"),
    num("Check the Workflow Inbox every morning as part of the opening financial routine."),
    num("Approve all straightforward items (depreciation runs, standard acquisitions) the same day they are submitted."),
    num("Investigate and resolve any pending items that have been waiting more than 3 business days."),
    num("For items requiring additional documentation, reject with a clear reason rather than leaving them pending."),
    space(),
    h2("7.2  Month-End Inbox Clearance"),
    p("Before closing a financial period, the Inbox must be empty of pending items for that period. Specifically:"),
    bl("All depreciation runs for the closing period must be approved."),
    bl("All acquisitions captured in the period must be approved."),
    bl("All disposals in the period must be approved."),
    bl("Any impairments, reversals, or revaluations in the period must be approved."),
    p("A non-empty Inbox at month-end means the financial reports for that period are incomplete."),
    space(),
    h2("7.3  Delegation of Approval Authority"),
    p("If the designated approver is absent (leave, illness), the system administrator can reassign pending inbox items to an alternate approver with the same or higher authority level. This must be done via Administration → User Management. Do not share login credentials to enable another person to approve on your behalf — this is a segregation of duties breach."),
    space(),
    warn("WARNING:","Sharing login credentials to allow another user to approve transactions in your name is a material internal controls breach and may result in disciplinary action under MFMA Section 171. Always use the proper delegation mechanism via the system administrator."),
    new Paragraph({children:[new PageBreak()]}),

    h1("8. Viewing Transaction History"),
    p("The Workflow Inbox also functions as a historical log. Approved and rejected items remain visible in the Inbox history even after they leave the pending list."),
    space(),
    h2("8.1  Filtering Historical Items"),
    p("Use the filter controls above the inbox list to view historical items:"),
    bl("Status Filter: Change from 'Pending' to 'Approved', 'Rejected', or 'All' to see historical items."),
    bl("Date Range Filter: Set From and To dates to view items submitted within a specific period."),
    bl("Transaction Type Filter: Filter by type (e.g. show only Depreciation Run approvals)."),
    bl("Submitted By Filter: View all items submitted by a specific user (useful for user accountability reviews)."),
    space(),
    h2("8.2  Exporting Inbox History"),
    p("Click the Export button above the inbox list to download the filtered history as an Excel file. This is useful for the monthly approval register that should be filed as part of the month-end working papers."),
    new Paragraph({children:[new PageBreak()]}),

    h1("9. Common Questions and Troubleshooting"),
    ref2([
      ["I cannot see any items in my inbox","You may not have any pending items assigned to your role. If you expect items, check with the Finance Officer who submitted the transactions to confirm they were submitted correctly."],
      ["I approved an item by mistake","If the approved item has not yet updated the GL (i.e. it is in an intermediate state), contact the system administrator immediately to reverse the approval. If fully posted, a correcting transaction or Prior Year Adjustment must be raised."],
      ["The inbox badge shows 5 pending but I only see 2 items","You see only items assigned to your role. The remaining items may be pending for a different role (e.g. CFO-level approvals that require higher authority)."],
      ["An item has been pending for weeks — I don't know who should approve it","Check the transaction detail screen which shows the Required Approver Role. If the designated approver is absent, contact the system administrator to reassign the item."],
      ["Rejected items keep reappearing","The submitter is correcting and resubmitting the same transaction. Review the rejection reason carefully — if the submitter is not addressing the issue, contact them directly."],
      ["I cannot find an item that was previously in my inbox","Change the status filter from Pending to Approved or Rejected. All historically processed items remain in the inbox history."],
    ]),
    space(),
    success("COMPLIANCE SUCCESS:","The Workflow Inbox is fully compliant when: no item has been pending for more than 7 days, the month-end inbox is empty before the period is closed, all approvers are using their own credentials, and approved/rejected items are being exported monthly as part of the working papers."),
  ];
}

(async()=>{
  const doc=new Document({
    numbering:{config:[{reference:"default-numbering",levels:[{level:0,format:"decimal",text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:360,hanging:260}}}}]}]},
    styles:{paragraphStyles:[{id:"Normal",name:"Normal",run:{font:"Calibri",size:22,color:BLACK}}]},
    sections:[{
      headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"Asset Management System — Workflow Inbox User Manual",size:18,color:"888888",font:"Calibri"})]})]})},
      footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Asset Management System — Confidential  |  Page ",size:18,color:"888888",font:"Calibri"}),new TextRun({children:[new PageNumberElement()],size:18,color:"888888",font:"Calibri"})]})]})},
      children:buildChildren()
    }]
  });
  const buf=await Packer.toBuffer(doc);
  writeFileSync(join(__dirname,"WorkflowInbox_UserManual.docx"),buf);
  console.log("✓ WorkflowInbox_UserManual.docx written");
})();
