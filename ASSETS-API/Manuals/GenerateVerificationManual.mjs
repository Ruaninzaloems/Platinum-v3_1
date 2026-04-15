// GenerateVerificationManual.mjs — Full detail, Acquisitions-level
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
  new Paragraph({children:[new TextRun({text:'ASSET VERIFICATION',bold:true,size:56,color:NOTE_BORD,allCaps:true,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:120}}),
  new Paragraph({children:[new TextRun({text:'User Manual',size:48,color:"475569",font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:600}}),
  new Paragraph({children:[new TextRun({text:'─'.repeat(60),color:"E2E8F0",size:22,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:200}}),
  ...([['System','MFMA/GRAP/mSCOA Asset Management'],['Module','Asset Verification — Physical Verification Register'],['Compliance','MFMA Section 63, Municipal Asset Management Policy, AG Requirements'],['Version','1.0'],['Prepared for','Asset Management System'],['Classification','Internal Use']]).map(([k,v])=>ref2([[k,v]])).flat(),
  new Paragraph({children:[new TextRun({text:'',size:24})],spacing:{before:600}}),
  new Paragraph({children:[new PageBreak()]}),
];}
function toc(){return[h1("Table of Contents"),new TableOfContents("Table of Contents",{hyperlink:true,headingStyleRange:"1-3",stylesWithLevels:[new StyleLevel("Heading1",1),new StyleLevel("Heading2",2),new StyleLevel("Heading3",3)]}),new Paragraph({children:[new PageBreak()]})];}

function buildChildren(){
  const verImg=img("verification.jpg",560,340);
  return[
    ...coverPage(),
    ...toc(),

    h1("1. Introduction"),
    p("The Asset Verification module provides a structured register for recording and managing physical asset verification exercises. Physical verification is the process of physically inspecting and confirming the existence, location, condition, and identification of every asset recorded in the Fixed Asset Register. It is an annual legal requirement under MFMA Section 63 and is one of the most scrutinised areas during the annual external audit by the Auditor-General of South Africa (AGSA)."),
    space(),
    h2("1.1  What is Physical Asset Verification?"),
    p("Physical asset verification involves a team of officers visiting every physical location where municipal assets are held and confirming that:"),
    bl("Each asset listed in the register physically exists."),
    bl("The asset is at the location recorded in the system."),
    bl("The asset tag (barcode) is intact and readable."),
    bl("The asset's physical condition matches the condition grade recorded in the system."),
    bl("No unregistered assets (phantoms) are being used without appearing in the register."),
    space(),
    note("NOTE:","The AGSA routinely tests a sample of assets from the register against the physical inventory and vice versa. Assets that cannot be found during the audit are flagged as 'Not Found' findings and contribute to qualified audit opinions. A complete, current verification register is your primary defence against these findings."),
    space(),
    h2("1.2  Who Performs Verification"),
    ref2([
      ["Verification Team Leader","Plans the verification exercise, assigns wards and locations to team members, and signs off on the final verification report."],
      ["Verification Officer","Performs the physical inspection at each location, records findings in the system, and captures photographic evidence."],
      ["Asset Manager","Reviews the verification results, investigates discrepancies, and updates the asset register where needed."],
      ["CFO","Approves the final verification report and submits it to the Accounting Officer and AGSA."],
      ["Internal Auditor","Independently samples the verification records to validate their completeness and accuracy."],
    ]),
    space(),
    h2("1.3  Compliance Requirements"),
    ref2([
      ["MFMA Section 63(2)(a)","The CFO must take all reasonable steps to ensure assets are safeguarded against loss, theft, or damage — annual physical verification is the primary mechanism for this."],
      ["National Treasury Circular 21","Provides guidance on the conduct of physical asset verification including timing, sampling methodology, and reporting requirements."],
      ["Municipal Asset Management Policy","The municipality's policy specifies the verification cycle (annual minimum), the responsible officers, and the process for resolving discrepancies."],
      ["AGSA Requirements","The Auditor-General will request the signed verification report and a sample of individual verification records as part of the annual audit file."],
    ]),
    new Paragraph({children:[new PageBreak()]}),

    h1("2. Navigating to Asset Verification"),
    p("The Asset Verification module is accessible from the left-hand navigation sidebar. Click Asset Verification to open the verification register."),
    space(),
    verImg ? verImg : space(),
    verImg ? caption("Figure 1 — Asset Verification Register showing verification sessions and status summary.") : space(),
    space(),
    h2("2.1  Verification Module Overview"),
    p("The module is structured in two layers:"),
    bl("Verification Sessions: A verification exercise is grouped into a Session. Each session covers a specific financial year and may cover all assets or a specific ward, site, or asset type."),
    bl("Verification Items: Within each session, individual asset verification records are captured — one record per asset inspected."),
    new Paragraph({children:[new PageBreak()]}),

    h1("3. Planning a Verification Session"),
    p("Before commencing a physical verification, a Verification Session must be created in the system. This session acts as the container for all individual asset verification records captured during the exercise."),
    space(),
    h2("3.1  Creating a New Session"),
    p("Click the New Verification Session button. Complete the session details:"),
    space(),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Field",28),hCell("Required",15),hCell("Description",57)]}),
      fieldRow("Session Name",true,"A descriptive name for the session (e.g. 'FY2024/25 Annual Verification — All Assets' or 'Ward 3-6 Movable Asset Check').",LIGHT_GREY),
      fieldRow("Financial Year",true,"The financial year to which this verification belongs.",undefined),
      fieldRow("Verification Method",true,"How assets will be verified: Full Physical Count (all assets), Sample Count (AGSA minimum sample), or Targeted (specific ward or asset type).",LIGHT_GREY),
      fieldRow("Start Date",true,"The date on which the physical counting exercise begins.",undefined),
      fieldRow("Expected End Date",true,"The planned completion date for the exercise.",LIGHT_GREY),
      fieldRow("Team Leader",true,"The officer responsible for leading and signing off on this verification session.",undefined),
      fieldRow("Scope",false,"Description of what the session covers: ward numbers, asset types, specific locations.",LIGHT_GREY),
      fieldRow("Notes",false,"Any general notes about the session (e.g. 'Excludes heritage assets — separate session to follow').",undefined),
    ]}),
    space(),
    tip("TIP:","Start the verification session in the system before the physical counting begins. This allows team members to log findings directly into the system as they complete each location, rather than capturing from paper forms afterward."),
    new Paragraph({children:[new PageBreak()]}),

    h1("4. Capturing Verification Records"),
    p("Within an open verification session, individual asset verification records are captured as the physical inspection of each asset is completed. Each record documents the findings for one asset."),
    space(),
    h2("4.1  Adding a Verification Record"),
    p("Open the verification session and click Add Verification Item. Search for the asset being verified using the Asset ID or description, then complete the verification findings."),
    space(),
    h2("4.2  Verification Item Fields"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Field",28),hCell("Required",15),hCell("Description",57)]}),
      fieldRow("Asset",true,"Select the asset being verified by searching for the Asset ID or description.",LIGHT_GREY),
      fieldRow("Verification Date",true,"The date on which this specific asset was physically inspected.",undefined),
      fieldRow("Verified By",true,"The name of the officer who performed the physical inspection.",LIGHT_GREY),
      fieldRow("Asset Found?",true,"Yes or No. If No, the verification status is set to Not Found and an investigation is triggered.",undefined),
      fieldRow("Location Confirmed?",true,"Is the asset at the location recorded in the system? Yes or No. If No, capture the actual location found.",LIGHT_GREY),
      fieldRow("Actual Location (if different)",false,"If the asset is in a different location, record the actual ward, site, building, and room where it was found.",undefined),
      fieldRow("Tag Readable?",true,"Is the barcode or asset tag intact and machine-readable? Yes or No.",LIGHT_GREY),
      fieldRow("Condition Found",true,"The physical condition observed by the verification officer: Good, Fair, or Poor. This should match or update the asset register condition.",undefined),
      fieldRow("Verification Method",true,"How the verification was performed: Barcode Scan, Manual Inspection, or GPS Capture.",LIGHT_GREY),
      fieldRow("GPS Coordinates",false,"If using GPS capture, the latitude and longitude at the time of verification.",undefined),
      fieldRow("Notes / Discrepancies",false,"Free text for any observations, discrepancies, or concerns noted during the inspection.",LIGHT_GREY),
      fieldRow("Photograph",false,"Upload a photograph of the asset taken during the verification. Strongly recommended for high-value assets and assets with discrepancies.",undefined),
    ]}),
    space(),
    h2("4.3  Verification Outcomes"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Outcome",28),hCell("Meaning",72)]}),
      ...[
        ["Confirmed","Asset found at correct location, tag readable, condition matches. No action required."],
        ["Confirmed — Condition Updated","Asset found and confirmed, but the physical condition differs from the recorded condition. The system automatically updates the asset condition in the register."],
        ["Confirmed — Location Updated","Asset found but at a different location. The new location is recorded and the asset register is updated."],
        ["Not Found","The asset could not be located at any known location. An investigation is required. The Asset Manager must be notified."],
        ["Discrepancy","The asset is found but significant discrepancies exist (e.g. description does not match, tag missing, apparent theft). Escalation required."],
        ["Unregistered Asset Found","A physical asset was found that does not appear in the register. It must be registered as a new asset acquisition."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    new Paragraph({children:[new PageBreak()]}),

    h1("5. Investigating Not Found Assets"),
    p("When an asset is recorded as Not Found during a verification, a formal investigation process must be followed. Do not simply remove the asset from the register without completing the investigation."),
    space(),
    h2("5.1  Investigation Steps"),
    stepBanner(1,5,"Immediate Search"),
    p("Confirm with the department head and facility manager that the asset has not been temporarily moved. Check stores, workshop areas, and adjacent wards. Allow 48 hours for the initial search."),
    space(),
    stepBanner(2,5,"Formal Notification"),
    p("If the asset is still not found after 48 hours, formally notify the Asset Manager and the CFO in writing. Log the notification in the system as a note against the Not Found verification record."),
    space(),
    stepBanner(3,5,"Police Report (if theft suspected)"),
    p("If theft is suspected, open a case with the South African Police Service (SAPS) within 72 hours of confirming the asset is missing. Attach the case number to the verification record."),
    space(),
    stepBanner(4,5,"Write-Off Resolution"),
    p("After the investigation is complete and the asset is confirmed lost or stolen, initiate a Disposal transaction in the Transactions module with Disposal Type = Write-Off. This formally removes the asset from the register."),
    space(),
    stepBanner(5,5,"CFO and Council Approval"),
    p("Assets with a carrying value above the municipality's write-off approval threshold require CFO or Council resolution to write off. Attach the resolution to the disposal transaction before approving."),
    space(),
    warn("WARNING:","Never remove an asset from the register simply because it could not be found during verification. Every derecognition must follow the formal Disposal process. Removing assets without a Disposal transaction creates an audit trail gap."),
    new Paragraph({children:[new PageBreak()]}),

    h1("6. Completing a Verification Session"),
    p("Once all assets in scope have been verified (or the deadline has been reached), the session must be formally closed."),
    space(),
    h2("6.1  Closing a Session — Step by Step"),
    stepBanner(1,4,"Review the Verification Statistics"),
    p("Before closing, review the session summary: total assets in scope, verified count, not found count, and discrepancy count. Confirm these numbers are complete."),
    space(),
    stepBanner(2,4,"Resolve Outstanding Discrepancies"),
    p("Address any Not Found or Discrepancy records. Either complete the investigation and record the outcome, or formally note that the investigation is ongoing (for long-running investigations)."),
    space(),
    stepBanner(3,4,"Generate the Verification Report"),
    p("From the session detail screen, click Generate Verification Report. The system produces a summary report showing the verification coverage percentage, outcome distribution, and a list of all Not Found and Discrepancy items. This report is signed by the Team Leader and CFO."),
    space(),
    stepBanner(4,4,"Close the Session"),
    p("Click Close Session and confirm. The session status changes to Completed. All individual verification records are locked from further editing."),
    space(),
    note("NOTE:","A verification session that achieves less than 95% coverage (i.e. more than 5% of assets not verified) is typically considered incomplete by the AGSA. Ensure sufficient resources are allocated to complete the exercise before the financial year-end audit file is submitted."),
    space(),
    h2("6.2  Verification Coverage Target"),
    p("The National Treasury recommends the following verification coverage by asset type:"),
    ref2([
      ["Movable Assets (Vehicles, Equipment, Furniture)","100% annual count recommended. Sample acceptable at minimum 75% of high-value items."],
      ["Immovable Assets (Buildings, Land)","Annual desk-based confirmation plus physical inspection of high-risk locations."],
      ["Infrastructure Assets (Roads, Networks)","Annual verification using engineering condition assessments and GPS surveys."],
      ["Heritage Assets","Annual confirmation of existence, location, and security measures in place."],
      ["IT Equipment","100% annual barcode scan recommended. High theft risk."],
    ]),
    new Paragraph({children:[new PageBreak()]}),

    h1("7. Common Questions and Troubleshooting"),
    ref2([
      ["I cannot add a verification item to a closed session","Once a session is closed, it is locked. If you need to add additional records, contact the system administrator to reopen the session with CFO approval."],
      ["An asset does not appear in the search when adding a verification item","The asset may be inactive (Disposed status). Verification is only for active assets. If the asset should be active, check its status in Asset Records."],
      ["The session says 0% complete but I have captured records","Refresh the session detail page. If still showing 0%, check that the records were saved correctly — look for them in the verification items list."],
      ["I found an asset with no tag (tag missing)","Record the verification outcome as Discrepancy and note 'Asset tag missing — re-tagging required'. Arrange for the IT or maintenance team to affix a new barcode tag and update the asset register."],
      ["An asset found is not in the register at all","Record it as an Unregistered Asset Found. Capture the details (description, location, apparent condition, estimated value) and initiate a new acquisition transaction to register it properly."],
      ["The Verification Report shows fewer assets than I expected","Check whether the session scope was set to cover All Assets or a subset. If it was scoped to a specific ward, only assets in that ward will appear in the report."],
    ]),
    space(),
    success("VERIFICATION SUCCESS:","A successful verification exercise has 100% of in-scope assets accounted for, all discrepancies formally documented and resolved, a signed verification report attached to the session, and the asset register updated to reflect any condition or location changes found."),
  ];
}

(async()=>{
  const doc=new Document({
    numbering:{config:[{reference:"default-numbering",levels:[{level:0,format:"decimal",text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:360,hanging:260}}}}]}]},
    styles:{paragraphStyles:[{id:"Normal",name:"Normal",run:{font:"Calibri",size:22,color:BLACK}}]},
    sections:[{
      headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"Asset Management System — Asset Verification User Manual",size:18,color:"888888",font:"Calibri"})]})]})},
      footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Asset Management System — Confidential  |  Page ",size:18,color:"888888",font:"Calibri"}),new TextRun({children:[new PageNumberElement()],size:18,color:"888888",font:"Calibri"})]})]})},
      children:buildChildren()
    }]
  });
  const buf=await Packer.toBuffer(doc);
  writeFileSync(join(__dirname,"Verification_UserManual.docx"),buf);
  console.log("✓ Verification_UserManual.docx written");
})();
