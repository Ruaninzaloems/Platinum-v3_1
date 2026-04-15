// GenerateAdministrationManual.mjs — Full detail, Acquisitions-level
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
  new Paragraph({children:[new TextRun({text:'ADMINISTRATION',bold:true,size:60,color:NOTE_BORD,allCaps:true,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:120}}),
  new Paragraph({children:[new TextRun({text:'User Manual',size:48,color:"475569",font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:600}}),
  new Paragraph({children:[new TextRun({text:'─'.repeat(60),color:"E2E8F0",size:22,font:"Calibri"})],alignment:AlignmentType.CENTER,spacing:{before:0,after:200}}),
  ...([['System','MFMA/GRAP/mSCOA Asset Management'],['Module','Administration — Users, Roles, Organisation Settings, Policies'],['Compliance','MFMA Section 62, mSCOA v6.4, Municipal ICT Governance'],['Version','1.0'],['Prepared for','Asset Management System'],['Classification','Restricted — Administrator Use Only']]).map(([k,v])=>ref2([[k,v]])).flat(),
  new Paragraph({children:[new TextRun({text:'',size:24})],spacing:{before:600}}),
  new Paragraph({children:[new PageBreak()]}),
];}
function toc(){return[h1("Table of Contents"),new TableOfContents("Table of Contents",{hyperlink:true,headingStyleRange:"1-3",stylesWithLevels:[new StyleLevel("Heading1",1),new StyleLevel("Heading2",2),new StyleLevel("Heading3",3)]}),new Paragraph({children:[new PageBreak()]})];}

function buildChildren(){
  const adminImg=img("admin.jpg",560,340);
  return[
    ...coverPage(),
    ...toc(),

    h1("1. Introduction"),
    p("The Administration module is the system management centre of the Asset Management System. It is accessible only to users with the Administrator role. It controls the fundamental settings that govern how the system behaves: user accounts and roles, organisation and municipality settings, financial year and period configuration, measurement model policies, GRAP standards applied, and approval method settings."),
    space(),
    p("Changes made in the Administration module affect every user and every module in the system. Incorrect settings can cause widespread calculation errors, reporting failures, or access control issues. Only designated system administrators should access this module, and every change should be documented in the IT change log."),
    space(),
    h2("1.1  Administration Module Tabs"),
    ref2([
      ["Users & Roles","Manage user accounts, assign roles, and control system access."],
      ["Organisation Settings","Configure municipality details, active financial year, current period, measurement model, mSCOA enablement, and approval method."],
    ]),
    space(),
    h2("1.2  Who Has Access"),
    warn("ACCESS RESTRICTION:","The Administration module is only accessible to users with the Administrator role. If you need access and do not have it, contact the Accounting Officer (Municipal Manager) who is responsible for authorising system administrator access under the municipality's ICT governance framework."),
    new Paragraph({children:[new PageBreak()]}),

    h1("2. Users and Roles"),
    p("The Users & Roles tab provides a view of all registered system users, their assigned roles, current status (active or inactive), and last login date. From this tab, administrators can add new users, deactivate departing staff accounts, and manage role assignments."),
    space(),
    adminImg ? adminImg : space(),
    adminImg ? caption("Figure 1 — Administration screen showing the Users & Roles tab with system user list.") : space(),
    space(),
    h2("2.1  User List Columns"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Column",25),hCell("Description",75)]}),
      ...[
        ["Name","The user's full name as registered."],
        ["Username","The login username. Used for system login and audit trail references throughout the system."],
        ["Email","The user's email address. Used for system notifications and password reset."],
        ["Role","The user's assigned role badge. Role determines what modules and actions the user can access."],
        ["Status","Active (green) or Inactive (red). Inactive users cannot log in."],
        ["Last Login","The date and time of the user's most recent successful login. Used to identify inactive accounts."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    h2("2.2  System Roles"),
    p("The following roles are available in the Asset Management System. Each role has a predefined set of permissions that cannot be individually customised:"),
    space(),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Role",22),hCell("Access Level",78)]}),
      ...[
        ["Administrator","Full access to all modules including Administration. Can add/edit/delete users, change system settings, and access all data. Typically assigned to IT staff and the system owner."],
        ["CFO / Finance Manager","Full access to all financial modules. Can approve all transaction types in the Workflow Inbox. No access to Administration module."],
        ["Asset Manager","Full access to Asset Records, WIP, Maintenance, and Verification. Can approve maintenance requests. Cannot approve financial transactions."],
        ["Finance Officer","Can capture transactions (acquisitions, disposals, impairments) and view all records. Cannot approve transactions. Cannot access Administration."],
        ["Auditor / Read Only","Read-only access to all modules. Can view all records, transaction histories, and reports but cannot capture, edit, or approve anything."],
        ["Maintenance Officer","Access to Maintenance module only. Can create and view maintenance requests. Cannot access financial data."],
      ].map(([a,b],i)=>new TableRow({children:[dc(a,{bold:true,shade:i%2===0?LIGHT_GREY:undefined}),dc(b,{shade:i%2===0?LIGHT_GREY:undefined})]}))
    ]}),
    space(),
    note("NOTE:","Role assignments must comply with the municipality's segregation of duties policy. A user who captures transactions should not be assigned the CFO/Finance Manager role that allows them to approve their own transactions. Segregation of duties is a fundamental MFMA requirement."),
    space(),
    h2("2.3  Adding a New User"),
    stepBanner(1,4,"Obtain Written Authorisation"),
    p("Before adding any user, obtain written authorisation from the Department Head and CFO. The authorisation must specify the user's name, job title, and the role to be assigned. File the authorisation letter."),
    space(),
    stepBanner(2,4,"Click Add User"),
    p("In the Users & Roles tab, click the Add User button. The new user form opens."),
    space(),
    stepBanner(3,4,"Complete the User Form"),
    p("Enter the user's full name, username, email address, and select the appropriate role. Set the status to Active."),
    space(),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Field",28),hCell("Required",15),hCell("Description",57)]}),
      fieldRow("Full Name",true,"The user's legal full name as it appears in the HR system.",LIGHT_GREY),
      fieldRow("Username",true,"A unique login username. Use the municipal email prefix (e.g. jsmith). Cannot be changed after creation.",undefined),
      fieldRow("Email Address",true,"The user's municipal email address. Used for notifications and password reset.",LIGHT_GREY),
      fieldRow("Role",true,"Select from the available roles. Must match the authorisation obtained.",undefined),
      fieldRow("Status",true,"Set to Active for a new user. Inactive users cannot log in.",LIGHT_GREY),
      fieldRow("Temporary Password",true,"Set a temporary password. The user must change it on first login.",undefined),
    ]}),
    space(),
    stepBanner(4,4,"Notify the User"),
    p("Communicate the username and temporary password to the new user through a secure channel (not unencrypted email). Instruct them to change the password immediately on first login."),
    space(),
    h2("2.4  Deactivating a User"),
    p("When a user leaves the municipality or changes roles, their account must be deactivated immediately. Do not delete accounts — deactivation preserves the audit trail of that user's historical actions."),
    space(),
    num("Find the user in the User List."),
    num("Click the Edit button on their row (or click their name to open the user detail)."),
    num("Change the Status from Active to Inactive."),
    num("Save the change."),
    num("The user can no longer log in. Their historical records and audit trail remain intact."),
    space(),
    warn("WARNING:","Failure to deactivate a user account when an employee leaves is a serious ICT governance breach. Former employees with active credentials can log in and view or modify municipal financial data. Deactivation must happen on or before the employee's last working day."),
    new Paragraph({children:[new PageBreak()]}),

    h1("3. Organisation Settings"),
    p("The Organisation Settings tab is the most critical configuration area in the system. It controls the fundamental operational parameters: which municipality the system serves, what financial year is active, and how the system processes approvals and measurements."),
    space(),
    h2("3.1  Municipality Details"),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[
      new TableRow({children:[hCell("Field",28),hCell("Required",15),hCell("Description",57)]}),
      fieldRow("Municipality Name",true,"The official name of the municipality as it appears in the AFS and all official reports.",LIGHT_GREY),
      fieldRow("Financial Year",true,"The active financial year (e.g. 2024/2025). All asset data, transactions, and reports use this year as the base. Change this only at year-end rollover.",undefined),
      fieldRow("Current Period (Month)",true,"The current mSCOA financial period (1–12). Period 1 = July (start of municipal financial year). Update this at the start of each new period during the monthly close.",LIGHT_GREY),
      fieldRow("mSCOA Enabled",true,"Whether mSCOA coding is active in the system. Should always be Yes for compliance. If set to No, mSCOA codes are not applied to transactions.",undefined),
      fieldRow("Measurement Model",true,"The default measurement model: Cost, Revaluation, or Mixed. Cost = all assets measured at historical cost. Revaluation = all at fair value. Mixed = cost and revaluation applied to different asset classes (most common).",LIGHT_GREY),
      fieldRow("Approval Method",true,"Manual = each transaction individually approved in the Workflow Inbox. Automated = month-end bulk approval for depreciation batches. Manual provides better audit granularity.",undefined),
    ]}),
    space(),
    h2("3.2  Configuration (Read-Only) Details"),
    p("The Configuration card on the right side of the Organisation Settings tab displays additional settings that are configured at system implementation and are not editable through the UI. These include:"),
    bl("Province: The province the municipality is located in."),
    bl("Municipality Code: The official demarcation code (e.g. EC122)."),
    bl("Demarcation Code: The SALGA/demarcation board code."),
    bl("Audit Status: The most recent audit outcome (e.g. Unqualified, Qualified, Adverse, Disclaimer)."),
    bl("Depreciation Method: The municipality's policy depreciation method (Straight-Line)."),
    p("To change any configuration setting, contact the system implementation team or your service provider."),
    space(),
    h2("3.3  GRAP Standards Panel"),
    p("The GRAP Standards panel shows the list of GRAP standards that the municipality has confirmed are applicable to their asset accounting. These standards determine which transaction types are available and which disclosure requirements are enforced. Common standards displayed include:"),
    bl("GRAP 17: Property, Plant and Equipment."),
    bl("GRAP 21: Impairment of Non-Cash-Generating Assets."),
    bl("GRAP 26: Impairment of Cash-Generating Assets."),
    bl("GRAP 103: Heritage Assets."),
    bl("GRAP 11: Construction Contracts (WIP)."),
    space(),
    h2("3.4  Revaluation Policy Panel"),
    p("For municipalities using the Revaluation Model or Mixed Model, the Revaluation Policy panel shows the configured revaluation approach per asset class and the revaluation frequency. Key fields include:"),
    bl("Infrastructure Assets: Typically Depreciated Replacement Cost method."),
    bl("Movable Assets: Typically Market Value method."),
    bl("Revaluation Frequency: Every X years as per the accounting policy (typically 3–5 years)."),
    bl("Last Revaluation Date: The date of the most recent revaluation exercise."),
    new Paragraph({children:[new PageBreak()]}),

    h1("4. Editing Organisation Settings"),
    p("Organisation Settings can be edited by the Administrator. Click the Edit button (pencil icon) in the top right of the Municipality Details card to enter edit mode."),
    space(),
    h2("4.1  Settings That Change Regularly"),
    ref2([
      ["Current Period (Month)","Updated at the start of each new financial period (monthly close). Change this after completing the period-close procedures. If set incorrectly, depreciation runs will be posted to the wrong period."],
      ["Financial Year","Updated only at year-end rollover. Do not change this mid-year. Changing the financial year mid-year will cause all subsequent transactions to be recorded in the wrong year."],
      ["Approval Method","Can be changed at any time but should not be changed frequently. Discuss any change with the CFO before implementing."],
    ]),
    space(),
    h2("4.2  How to Update the Current Period"),
    stepBanner(1,3,"Complete Period-Close Procedures"),
    p("Before changing the period, ensure all month-end procedures are complete: depreciation run approved, all transactions approved in Workflow Inbox, and the reconciliation for the closing period is signed off."),
    space(),
    stepBanner(2,3,"Click Edit and Change the Period"),
    p("Click the Edit button in the Municipality Details card. Change the Current Period (Month) from the current period to the new period (e.g. from Period 9 to Period 10). Save the changes."),
    space(),
    stepBanner(3,3,"Verify the Dashboard"),
    p("Navigate to the Dashboard and confirm that the subtitle now shows the new period (e.g. Period 10 — April). Advise all users that the new period is open."),
    space(),
    warn("WARNING:","If you change the period before approving all transactions for the prior period, those pending transactions will appear in the Workflow Inbox with the old period date. They must still be approved — they will not automatically move to the new period."),
    new Paragraph({children:[new PageBreak()]}),

    h1("5. Year-End Rollover Procedure"),
    p("At the end of each financial year (after 30 June), the financial year must be rolled over in the Administration module. This is a critical procedure that must be performed in the correct sequence."),
    space(),
    h2("5.1  Year-End Rollover Checklist"),
    num("Confirm all Period 12 (June) transactions have been approved in the Workflow Inbox."),
    num("Generate and file the year-end reports: FAR, Depreciation Schedule, Disposal Report."),
    num("Complete and sign off the year-end reconciliation (asset register vs GL)."),
    num("Run the year-end depreciation close (final depreciation run for Period 12 if not already done)."),
    num("Obtain CFO sign-off on the year-end working paper pack."),
    num("In Administration → Organisation Settings → Edit, change the Financial Year from e.g. 2024/2025 to 2025/2026."),
    num("Change the Current Period to Period 1 (July)."),
    num("Save the settings. The system is now operating in the new financial year."),
    num("Verify the Dashboard shows the new financial year and Period 1."),
    num("Document the rollover in the IT change log with the date, performed by, and authorised by fields."),
    space(),
    note("NOTE:","The rollover does not erase prior year data. All historical asset records, transactions, and reports from prior years remain accessible. The system simply begins recording new transactions against the new financial year."),
    space(),
    h2("5.2  New Year Configuration"),
    p("After rolling over to the new financial year, the following additional setup steps are required:"),
    bl("Update the mSCOA configurations for the new year (if mSCOA codes have changed). See the mSCOA Configuration Manual."),
    bl("Review and update lead time configurations in the Maintenance module if the municipality's response time policy has changed."),
    bl("Create new user access reviews — confirm that all active users still require their current level of access."),
    bl("Check that the revaluation schedule for the new year is documented and assets due for revaluation are identified."),
    new Paragraph({children:[new PageBreak()]}),

    h1("6. Security and Access Controls"),
    p("As the system administrator, you are responsible for the security of the Asset Management System. The following practices must be maintained at all times:"),
    space(),
    h2("6.1  Password Policy"),
    bl("All users must use strong passwords (minimum 8 characters, mix of uppercase, lowercase, numbers, and special characters)."),
    bl("Temporary passwords must be changed on first login."),
    bl("Passwords should be changed at least every 90 days."),
    bl("Users must not share passwords. Each user must have their own account."),
    space(),
    h2("6.2  Account Management Rules"),
    bl("Create user accounts only when written authorisation has been obtained and filed."),
    bl("Deactivate accounts on or before the employee's last day of work."),
    bl("Review the full user list quarterly and deactivate any accounts that have not been used in 90 days."),
    bl("Never create generic or shared user accounts (e.g. 'finance_user1'). Each account must be personal."),
    bl("The Last Login date in the user list is your primary tool for identifying dormant accounts."),
    space(),
    h2("6.3  Administrator Access"),
    p("Administrator-level access should be restricted to the absolute minimum number of users necessary. Best practice is:"),
    bl("A maximum of 2 Administrator accounts (primary and backup)."),
    bl("Administrator accounts should not be used for daily data capture work. Use a regular Finance Officer account for day-to-day tasks."),
    bl("All Administrator actions are logged in the system audit trail."),
    space(),
    warn("WARNING:","The Administrator role has the ability to delete records and override system controls. Misuse of Administrator access is a disciplinary offence under MFMA Section 171. Administrator access should only be used for legitimate system administration tasks."),
    new Paragraph({children:[new PageBreak()]}),

    h1("7. Common Questions and Troubleshooting"),
    ref2([
      ["A user cannot log in","Check that their account is Active in the User List. If inactive, re-activate it. If active, reset their password. Also check that the username is correct (case-sensitive)."],
      ["A user says they cannot see a module","Check the user's assigned Role. The module they are trying to access may not be available to their role. Review the Role Permissions table in Section 2.2."],
      ["The financial year on the Dashboard is wrong","Check Organisation Settings → Financial Year. Update it to the correct year if it has not been rolled over."],
      ["The period on the Dashboard is wrong","Check Organisation Settings → Current Period. Update to the correct period after completing month-end close."],
      ["I need to change a user's role","Open the user detail, change the Role field, and save. The new role permissions take effect immediately on the user's next action."],
      ["A former employee's account is still showing as Active","Deactivate the account immediately. Change the Status to Inactive and save. Contact the IT security officer to report the lapsed deactivation."],
      ["The Approval Method was changed and is now causing issues","Change the Approval Method back to the previous setting in Organisation Settings. Document the issue and consult the CFO before making any further changes."],
    ]),
    space(),
    success("ADMINISTRATION SUCCESS:","The Administration module is correctly configured when: all user accounts belong to current employees with authorised roles, no dormant accounts exist (last login > 90 days), the correct financial year and period are set, and the mSCOA setting is Active. Run a quarterly user access review to maintain this state."),
  ];
}

(async()=>{
  const doc=new Document({
    numbering:{config:[{reference:"default-numbering",levels:[{level:0,format:"decimal",text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:360,hanging:260}}}}]}]},
    styles:{paragraphStyles:[{id:"Normal",name:"Normal",run:{font:"Calibri",size:22,color:BLACK}}]},
    sections:[{
      headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:"Asset Management System — Administration User Manual",size:18,color:"888888",font:"Calibri"})]})]})},
      footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Asset Management System — Confidential  |  Page ",size:18,color:"888888",font:"Calibri"}),new TextRun({children:[new PageNumberElement()],size:18,color:"888888",font:"Calibri"})]})]})},
      children:buildChildren()
    }]
  });
  const buf=await Packer.toBuffer(doc);
  writeFileSync(join(__dirname,"Administration_UserManual.docx"),buf);
  console.log("✓ Administration_UserManual.docx written");
})();
