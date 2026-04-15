// GenerateConfigurationManual.mjs — Full detail, Acquisitions-level
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
  new Paragraph({children:[new TextRun({text:'mSCOA CONFIGURATION',bold:true,size:56,color:NOTE_BORD,allCaps:true,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:120}}),
  new Paragraph({children:[new TextRun({text:'User Manual',size:48,color:"475569",font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:600}}),
  new Paragraph({children:[new TextRun({text:'─'.repeat(60),color:"E2E8F0",size:22,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:200}}),
  ...([['System','MFMA/GRAP/mSCOA Asset Management'],['Module','mSCOA Settings — Journal Code Configuration per Asset Classification'],['Compliance','mSCOA v6.4, National Treasury Circular 88, GRAP 17'],['Version','1.0'],['Prepared for','Asset Management System'],['Classification','Internal Use — Administrator Access Required']]).map(([k,v])=>ref2([[k,v]])).flat(),
  new Paragraph({children:[new TextRun({text:'',size:24})],spacing:{before:600}}),
  new Paragraph({children:[new PageBreak()]}),
];}
function toc(){return[h1("Table of Contents"),new TableOfContents("Table of Contents",{hyperlink:true,headingStyleRange:"1-3",stylesWithLevels:[new StyleLevel("Heading1",1),new StyleLevel("Heading2",2),new StyleLevel("Heading3",3)]}),new Paragraph({children:[new PageBreak()]})];}

function buildChildren(){
  const mscoaImg=img("mscoa-config.jpg",560,340);
  return[
    ...coverPage(),
    ...toc(),

    h1("1. Introduction"),
    p("The mSCOA Configuration module is the technical backbone of the Asset Management System's general ledger integration. It maps each combination of asset classification (type, category, sub-category, measurement model) to the specific mSCOA Chart of Accounts journal codes that must be used when posting depreciation, impairment, revaluation, and disposal transactions to the general ledger."),
    space(),
    p("Correct mSCOA configuration is essential for MFMA compliance. National Treasury Circular 88 mandates that all municipalities comply with the mSCOA financial framework, which requires that every financial transaction be coded to the specific mSCOA segment codes (Function, Project, Municipal Standard Classification, Cost String, Financial Position, Cash Flow, Funding)."),
    space(),
    h2("1.1  Who Uses This Module"),
    ref2([
      ["System Administrator","Primary user. Maintains the mSCOA mapping table at implementation and when the mSCOA Chart of Accounts changes."],
      ["Finance Manager / CFO","Reviews the configuration to ensure the correct accounts are being used for each asset class."],
      ["IT/Technical Staff","Assists with configuration during system implementation and annual mSCOA version updates."],
    ]),
    space(),
    warn("WARNING:","This module should only be accessed by users with the System Administrator role. Incorrect mSCOA code configuration will result in transactions being posted to the wrong general ledger accounts, creating errors in the financial statements that are difficult to correct. Do not make changes without written authorisation from the Finance Manager."),
    space(),
    h2("1.2  mSCOA Background"),
    p("The Municipal Standard Chart of Accounts (mSCOA) is a National Treasury-mandated accounting and reporting framework that standardises how municipalities classify, code, and report financial transactions. For asset management specifically, mSCOA requires:"),
    bl("All PPE to be classified according to the mSCOA Financial Position segment (FP codes for asset accounts)."),
    bl("Depreciation expense to be allocated to the mSCOA Cost String segment."),
    bl("Each asset journal to include a Plan/Project segment code and an Item (SCOA Item) segment code."),
    bl("Separate codes for the debit and credit legs of each journal entry."),
    new Paragraph({children:[new PageBreak()]}),

    h1("2. Navigating to mSCOA Settings"),
    p("From the left-hand navigation sidebar, click Configuration → mSCOA Settings (or navigate through Administration → Config → mSCOA). The module opens to the mSCOA settings list."),
    space(),
    mscoaImg ? mscoaImg : space(),
    mscoaImg ? caption("Figure 1 — mSCOA Settings list showing asset classification columns and mSCOA code assignments.") : space(),
    space(),
    h2("2.1  mSCOA Settings List Columns"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Column",25),hCell("Description",75)]}),
      ...[
        ["Financial Year","The financial year to which this mSCOA configuration applies. Each year may have different mSCOA codes as the Chart of Accounts evolves."],
        ["Asset Type","The asset type this configuration applies to (e.g. Movable, Infrastructure)."],
        ["Asset Category","The asset category within the type."],
        ["Asset Sub-Category","The sub-category, if applicable. Can be 'All Sub-Categories' for a catch-all rule."],
        ["Measurement Type","Whether this configuration applies to Cost Model or Revaluation Model assets."],
        ["Status","Whether this configuration is Active or Inactive."],
        ["Actions","Edit (pencil icon) and Delete (bin icon)."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    new Paragraph({children:[new PageBreak()]}),

    h1("3. Filtering the mSCOA Settings List"),
    p("Use the filter controls at the top of the list to search for specific configurations:"),
    space(),
    ref2([
      ["Financial Year","Filter to a specific financial year to see all configurations active in that year."],
      ["Asset Type","Filter by asset type to see all configurations for that type."],
      ["Category","Filter by asset category (enabled after selecting an Asset Type)."],
      ["Sub-Category","Filter by sub-category (enabled after selecting a Category)."],
    ]),
    space(),
    p("Click Search to apply the filters. Click Clear to remove all filters and show the full list."),
    new Paragraph({children:[new PageBreak()]}),

    h1("4. Adding a New mSCOA Configuration"),
    p("A new mSCOA configuration must be added when:"),
    bl("A new asset type, category, or sub-category is added to the system that has no existing mSCOA mapping."),
    bl("A new financial year begins and the mSCOA Chart of Accounts has been updated with new codes."),
    bl("The municipality changes the mSCOA account codes used for a particular asset class."),
    space(),
    h2("4.1  New Configuration Fields"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Section",20),hCell("Field",28),hCell("Required",15),hCell("Description",37)]}),
      ...[
        ["Classification","Financial Year",true,"The financial year this configuration applies to.",LIGHT_GREY],
        ["Classification","Asset Type",true,"The asset type (top level of classification hierarchy).",undefined],
        ["Classification","Asset Category",false,"The category. Leave blank to apply to all categories within the type.",LIGHT_GREY],
        ["Classification","Asset Sub-Category",false,"The sub-category. Leave blank to apply to all sub-categories.",undefined],
        ["Classification","Measurement Type",true,"Cost Model or Revaluation Model.",LIGHT_GREY],
        ["Depreciation Codes","Debit Account (Plan/Project)",true,"The mSCOA Plan/Project segment code for the depreciation expense debit entry.",undefined],
        ["Depreciation Codes","Debit Account (SCOA Item)",true,"The mSCOA Item segment code for the depreciation expense debit entry.",LIGHT_GREY],
        ["Depreciation Codes","Credit Account (Plan/Project)",true,"The mSCOA Plan/Project segment code for the accumulated depreciation credit entry.",undefined],
        ["Depreciation Codes","Credit Account (SCOA Item)",true,"The mSCOA Item segment code for the accumulated depreciation credit entry.",LIGHT_GREY],
        ["Acquisition Codes","Cost Account (Plan/Project)",true,"The mSCOA Plan/Project code for the asset cost debit entry on acquisition.",undefined],
        ["Acquisition Codes","Cost Account (SCOA Item)",true,"The mSCOA Item code for the asset cost debit on acquisition.",LIGHT_GREY],
        ["Disposal Codes","Disposal Account (Plan/Project)",false,"The mSCOA code for the disposal gain/loss account.",undefined],
        ["Disposal Codes","Disposal Account (SCOA Item)",false,"The mSCOA Item code for the disposal gain/loss entry.",LIGHT_GREY],
        ["Impairment Codes","Impairment Debit (SCOA Item)",false,"The mSCOA Item code for impairment expense.",undefined],
        ["Impairment Codes","Impairment Credit (SCOA Item)",false,"The mSCOA Item code for accumulated impairment.",LIGHT_GREY],
        ["Revaluation Codes","Surplus Account (SCOA Item)",false,"The mSCOA Item code for revaluation surplus (equity). Only required for Revaluation Model assets.",undefined],
        ["General","Status",true,"Active (in use) or Inactive (archived, not applied to new transactions).",LIGHT_GREY],
      ].map(([sec,label,req,desc,shade])=>new TableRow({children:[dc(sec,{shade,italics:true}),dc(label,{bold:true,shade}),dc(req?"Required":"Optional",{shade,align:AlignmentType.CENTER,color:req?"166534":"6B7280",bold:req}),dc(desc,{shade})]}))
    ]}),
    space(),
    note("NOTE:","The mSCOA segment codes must exactly match the codes in the municipality's approved mSCOA Chart of Accounts for the relevant financial year. Contact the National Treasury regional office or your mSCOA consultant to obtain the correct codes if you are unsure."),
    space(),
    h2("4.2  Adding a New Configuration — Step by Step"),
    stepBanner(1,4,"Click Add New"),
    p("In the mSCOA Settings list, click the Add New button in the top-right header. A form panel opens (or a new page navigates)."),
    space(),
    stepBanner(2,4,"Complete the Classification Section"),
    p("Select the Financial Year, Asset Type, Category, Sub-Category (if applicable), and Measurement Type. This combination defines which assets this configuration will apply to."),
    space(),
    stepBanner(3,4,"Enter the mSCOA Codes"),
    p("Enter the correct mSCOA Plan/Project and SCOA Item codes for each journal entry type (Depreciation, Acquisition, Disposal, Impairment, Revaluation). Obtain these codes from the approved mSCOA Chart of Accounts for the financial year."),
    space(),
    stepBanner(4,4,"Save and Verify"),
    p("Click Save. The new configuration appears in the list. Verify it by running a test depreciation transaction for an asset of that type and confirming the correct codes appear in the Depreciation Schedule report."),
    new Paragraph({children:[new PageBreak()]}),

    h1("5. Editing an Existing Configuration"),
    p("To update an existing mSCOA configuration (e.g. when the mSCOA codes change at the start of a new financial year):"),
    space(),
    num("Find the configuration to edit using the filter controls."),
    num("Click the Edit (pencil) button on the configuration row."),
    num("Update the relevant fields. Typically, only the mSCOA code fields change between years — the classification fields remain the same."),
    num("Save the changes."),
    space(),
    warn("WARNING:","Editing the mSCOA codes on an existing configuration affects only future transactions. Already-posted and approved transactions retain the codes that were in effect at the time of posting. If you need to correct the codes on historical transactions, contact your system administrator."),
    new Paragraph({children:[new PageBreak()]}),

    h1("6. Configuration Hierarchy and Precedence"),
    p("When the system determines which mSCOA codes to apply to a transaction, it searches the configuration table using a cascading specificity rule:"),
    space(),
    num("Most specific: Match on Financial Year + Asset Type + Category + Sub-Category + Measurement Type."),
    num("Less specific: Match on Financial Year + Asset Type + Category + Measurement Type (Sub-Category = Any)."),
    num("Least specific: Match on Financial Year + Asset Type + Measurement Type (Category and Sub-Category = Any)."),
    space(),
    p("The most specific matching configuration is used. This allows you to set a default configuration for all assets of a type, and then override it for specific sub-categories that use different GL codes."),
    space(),
    tip("TIP:","Start by creating catch-all configurations for each Asset Type + Measurement Type combination. Then add more specific configurations only where a particular sub-category requires different mSCOA codes. This minimises the number of configuration records to maintain."),
    new Paragraph({children:[new PageBreak()]}),

    h1("7. Annual mSCOA Update Procedure"),
    p("At the start of each new financial year, the mSCOA Chart of Accounts may be updated by National Treasury. Follow this procedure to update the system configurations:"),
    space(),
    num("Obtain the new mSCOA Chart of Accounts from National Treasury's website or your mSCOA consultant."),
    num("Compare the new codes to the existing configurations in the system. Identify any codes that have changed."),
    num("For each changed code, create a new configuration record for the new financial year with the updated codes. Do not edit the prior year configurations — keep them intact for historical accuracy."),
    num("Test the new configurations by generating a test depreciation run (in a test environment if available) and verifying the correct codes appear."),
    num("Mark any obsolete configurations as Inactive."),
    num("Document all configuration changes in the IT change log."),
    space(),
    note("NOTE:","It is best practice to create new year configurations rather than editing existing ones. This preserves the history of which codes were used in each prior year, which is important for historical report generation and audit purposes."),
    new Paragraph({children:[new PageBreak()]}),

    h1("8. Common Questions and Troubleshooting"),
    ref2([
      ["A depreciation run shows 'mSCOA code not found'","There is no mSCOA configuration for the asset's type/category/measurement type combination. Add the missing configuration in this module."],
      ["The Depreciation Schedule shows blank codes for some assets","Same cause — missing mSCOA configuration. Use the filter to find the asset's classification and add the required configuration."],
      ["I need different codes for Cost and Revaluation model assets","Create two separate configurations with the same classification but different Measurement Type values (one for Cost, one for Revaluation)."],
      ["The system is using the wrong codes for a specific sub-category","The system is falling back to a less-specific configuration. Add a more specific configuration for that sub-category to override the catch-all."],
      ["I deleted a configuration by mistake","Deleted configurations cannot be recovered. Recreate the configuration with the same settings. Contact the system administrator if transactions were affected."],
      ["My codes appear correct but the GL journals are posting to the wrong accounts","The mSCOA codes may be correct in the system but incorrect in the GL chart of accounts mapping. Check with the GL system administrator that the SCOA Item codes in this system match the GL account master data."],
    ]),
    space(),
    success("CONFIGURATION SUCCESS:","The mSCOA configuration is complete when every active asset type and measurement type combination has a corresponding configuration record, the Depreciation Schedule report shows populated mSCOA codes for all assets, and a test reconciliation confirms the journal postings land in the correct GL accounts."),
  ];
}

(async()=>{
  const doc=new Document({
    numbering:{config:[{reference:"default-numbering",levels:[{level:0,format:"decimal",text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:360,hanging:260}}}}]}]},
    styles:{paragraphStyles:[{id:"Normal",name:"Normal",run:{font:"Calibri",size:22,color:BLACK}}]},
    sections:[{
      headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"Asset Management System — mSCOA Configuration User Manual",size:18,color:"888888",font:"Calibri"})]})]})},
      footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Asset Management System — Confidential  |  Page ",size:18,color:"888888",font:"Calibri"}),new TextRun({children:[new PageNumberElement()],size:18,color:"888888",font:"Calibri"})]})]})},
      children:buildChildren()
    }]
  });
  const buf=await Packer.toBuffer(doc);
  writeFileSync(join(__dirname,"Configuration_UserManual.docx"),buf);
  console.log("✓ Configuration_UserManual.docx written");
})();
