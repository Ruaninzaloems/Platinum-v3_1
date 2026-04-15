// GenerateAllManuals.mjs
// Generates all 13 Platinum Asset Management User Manuals as .docx files
// Usage: node GenerateAllManuals.mjs
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle,
  ShadingType, PageBreak, Header, Footer, PageNumber, PageNumberElement, NumberFormat, ImageRun
} from "docx";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const NAVY = "1E3A5F";
const GOLD = "D4A843";
const LIGHT_GREY = "F2F2F2";
const LIGHT_BLUE = "EEF3FB";
const WHITE = "FFFFFF";
const BLACK = "000000";
const GREEN = "166534";
const LIGHT_GREEN = "F0FDF4";
const RED = "991B1B";

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, color: NAVY, font: "Calibri" })]
  });
}
function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 26, color: NAVY, font: "Calibri" })]
  });
}
function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, color: "333333", font: "Calibri" })]
  });
}
function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({
      text, size: opts.size || 22,
      bold: opts.bold || false, italics: opts.italics || false,
      font: opts.font || "Calibri", color: opts.color || BLACK
    })]
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22, font: "Calibri" })]
  });
}
function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "default-numbering", level },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22, font: "Calibri" })]
  });
}
function emptyLine() {
  return new Paragraph({ spacing: { after: 120 }, children: [] });
}
function tip(text) {
  return new Paragraph({
    spacing: { after: 120, before: 60 },
    border: { left: { style: BorderStyle.SINGLE, size: 6, color: GOLD } },
    indent: { left: 360 },
    shading: { type: ShadingType.SOLID, color: "FFFBEB" },
    children: [
      new TextRun({ text: "TIP  ", bold: true, size: 20, color: GOLD, font: "Calibri" }),
      new TextRun({ text, size: 20, font: "Calibri", color: "78350F" })
    ]
  });
}
function note(text) {
  return new Paragraph({
    spacing: { after: 120, before: 60 },
    border: { left: { style: BorderStyle.SINGLE, size: 6, color: "2563EB" } },
    indent: { left: 360 },
    shading: { type: ShadingType.SOLID, color: LIGHT_BLUE },
    children: [
      new TextRun({ text: "NOTE  ", bold: true, size: 20, color: "1D4ED8", font: "Calibri" }),
      new TextRun({ text, size: 20, font: "Calibri", color: "1E3A8A" })
    ]
  });
}
const noBorder = { style: BorderStyle.NONE, size: 0, color: WHITE };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function headerCell(text) {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: NAVY },
    borders,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, size: 20, color: WHITE, font: "Calibri" })]
    })]
  });
}
function cell(text, opts = {}) {
  return new TableCell({
    shading: opts.shading ? { type: ShadingType.SOLID, color: opts.shading } : undefined,
    borders,
    columnSpan: opts.span,
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({
        text: text || "", size: opts.size || 20,
        bold: opts.bold || false, font: opts.font || "Calibri", color: opts.color || BLACK
      })]
    })]
  });
}
function twoColTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((r, i) => new TableRow({ children: [
      cell(r[0], { bold: true, shading: i % 2 === 0 ? LIGHT_GREY : undefined }),
      cell(r[1], { shading: i % 2 === 0 ? LIGHT_GREY : undefined }),
    ]}))
  });
}
function threeColTable(header, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: header.map(h => headerCell(h)) }),
      ...rows.map((r, i) => new TableRow({ children: r.map(c => cell(c, { shading: i % 2 === 1 ? LIGHT_GREY : undefined })) }))
    ]
  });
}

function imgRun(filename, widthPx = 580, heightPx = 360) {
  const p = join(__dirname, "screenshots", filename);
  if (!existsSync(p)) return null;
  const data = readFileSync(p);
  return new Paragraph({
    spacing: { after: 160, before: 80 },
    alignment: AlignmentType.CENTER,
    children: [new ImageRun({ data, transformation: { width: widthPx, height: heightPx }, type: "jpg" })]
  });
}
function imgCaption(text) {
  return new Paragraph({
    spacing: { after: 200 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, size: 18, italics: true, color: "666666", font: "Calibri" })]
  });
}

function coverPage(sectionTitle) {
  return [
    emptyLine(), emptyLine(), emptyLine(), emptyLine(), emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: [new TextRun({ text: "PLATINUM ASSET MANAGEMENT", size: 44, bold: true, color: NAVY, font: "Calibri" })]
    }),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: [new TextRun({ text: sectionTitle, size: 52, bold: true, color: GOLD, font: "Calibri" })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: "User Manual", size: 36, color: GOLD, font: "Calibri" })]
    }),
    emptyLine(), emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: "Mnquma Local Municipality (EC122)", size: 24, color: "666666", font: "Calibri" })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: "GRAP / MFMA / mSCOA Compliant", size: 24, color: "666666", font: "Calibri" })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: `Date: ${new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}`, size: 24, color: "666666", font: "Calibri" })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 100 },
      children: [new TextRun({ text: "Version 1.0", size: 24, color: "666666", font: "Calibri" })]
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function buildDoc(title, children) {
  const headerPara = new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: `Platinum Asset Management — ${title}`, size: 18, color: "888888", font: "Calibri" })]
  });
  const footerPara = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: "Mnquma Local Municipality (EC122)   |   Page ", size: 18, color: "888888", font: "Calibri" }),
      new TextRun({ children: [new PageNumberElement()], size: 18, color: "888888", font: "Calibri" })
    ]
  });
  return new Document({
    numbering: {
      config: [{
        reference: "default-numbering",
        levels: [{
          level: 0, format: "decimal", text: "%1.",
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }]
    },
    sections: [{
      properties: {
        page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } }
      },
      headers: { default: new Header({ children: [headerPara] }) },
      footers: { default: new Footer({ children: [footerPara] }) },
      children
    }]
  });
}

async function save(doc, filename) {
  const buf = await Packer.toBuffer(doc);
  const out = join(__dirname, filename);
  writeFileSync(out, buf);
  console.log(`  ✓  ${filename}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
async function genDashboard() {
  const img = imgRun("dashboard.jpg");
  const children = [
    ...coverPage("Dashboard"),
    heading1("Overview"),
    para("The Dashboard is the home screen of Platinum Asset Management. It provides a real-time summary of the municipality's asset portfolio at a glance, covering financial values, asset counts, condition ratings, and financial trends for the current financial year and period."),
    emptyLine(),
    ...(img ? [img, imgCaption("Figure 1 — Dashboard overview showing KPI cards and charts")] : []),
    note("The Dashboard automatically reflects the active Financial Year and Period shown in the top bar (e.g. FY 2025/2026 · P8). All values update in real time when transactions are posted."),
    emptyLine(),

    heading1("KPI Summary Cards"),
    para("Five summary cards appear across the top of the Dashboard:"),
    emptyLine(),
    twoColTable([
      ["Carrying Amount", "The net book value of all assets (cost less accumulated depreciation and impairment). The sub-label shows the total historical cost."],
      ["Total Assets", "The total number of asset records in the register. The sub-label shows what percentage are in good condition."],
      ["Reval Reserve", "The total revaluation reserve balance across all revalued assets. The sub-label shows how many assets have been revalued."],
      ["Nearing End of Life", "Assets whose Remaining Useful Life (RUL) is 12 months or less. These require attention for replacement planning."],
      ["Depreciation", "Depreciation posted in Period 1 of the current financial year — used as a reference baseline for the annual depreciation charge."],
    ]),
    emptyLine(),
    tip("Click any KPI card to navigate directly to the related section of the system (e.g. clicking Total Assets opens the Asset Register)."),
    emptyLine(),

    heading1("Asset Value by Category Chart"),
    para("A horizontal bar chart shows the carrying amount broken down by asset category (e.g. Roads Infrastructure, Transport Assets, Electrical Infrastructure). This helps identify which categories hold the highest value and where depreciation pressure is greatest."),
    emptyLine(),

    heading1("Asset Condition Distribution"),
    para("A donut chart shows the percentage of assets in each condition band: Good, Fair, Poor, and Very Poor. These values come from condition assessments captured during physical verification. The breakdown supports maintenance prioritisation and budget planning."),
    emptyLine(),

    heading1("Monthly Depreciation Chart"),
    para("A line chart plots total depreciation posted per month across the 12 periods of the financial year (July to June). This allows management to monitor whether depreciation is being run consistently each period and to detect anomalies."),
    emptyLine(),

    heading1("Acquisitions vs Disposals Chart"),
    para("A bar chart compares the value of assets acquired against assets disposed of per month. This is important for monitoring capital expenditure against asset disposal activity throughout the year."),
    emptyLine(),

    heading1("Navigation Bar"),
    para("The left-hand sidebar provides access to all modules:"),
    emptyLine(),
    twoColTable([
      ["Dashboard", "Home screen with KPI summary (this screen)"],
      ["Asset Records", "Full asset register — browse, search, register, edit assets"],
      ["Acquisitions", "Capture new assets from SCM/GRN, Inventory, or Donations"],
      ["Capital Projects (WIP)", "Work-in-Progress capital project register and unbundling"],
      ["Transactions", "Depreciation runs, revaluations, impairments, disposals, refurbishments"],
      ["Maintenance", "Corrective maintenance request management"],
      ["Asset Verification", "Physical verification registers, planning, and reports"],
      ["Workflow Inbox", "Approval queues for transactions and asset changes"],
      ["Reports", "GRAP/mSCOA/MFMA statutory reports"],
      ["Reconciliation", "Asset register vs General Ledger balance check"],
      ["Configuration", "Reference data — asset types, categories, CIDMS, grading scales"],
      ["Bulk Upload", "Import large sets of assets or transactions from Excel"],
      ["Administration", "User management and organisation settings"],
    ]),
    emptyLine(),

    heading1("Top Bar Indicators"),
    twoColTable([
      ["Municipality Name", "Shows the active organisation (e.g. Demo Local Municipality)"],
      ["Financial Year & Period", "Shows the active FY and period for all transactions (e.g. FY 2025/2026 · P8)"],
      ["Database Indicator", "Shows whether the system is connected to PostgreSQL or SQL Server"],
      ["Audit Status", "A green 'Clean Audit' badge indicates no outstanding compliance issues"],
      ["Notification Bell", "Alerts for pending approvals and system events"],
    ]),
  ];
  const doc = buildDoc("Dashboard", children);
  await save(doc, "Dashboard_UserManual.docx");
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ASSET RECORDS
// ─────────────────────────────────────────────────────────────────────────────
async function genAssetRecords() {
  const imgList = imgRun("assets_list.jpg");
  const children = [
    ...coverPage("Asset Records"),
    heading1("Overview"),
    para("The Asset Records module (Asset Register) is the central repository of all municipal assets. It provides a complete list of every asset owned by the municipality, with full financial, physical, and location details. From here you can search and filter assets, register new assets, view full asset details, and submit changes for approval."),
    emptyLine(),
    ...(imgList ? [imgList, imgCaption("Figure 1 — Asset Register list view")] : []),
    emptyLine(),

    heading1("Browsing the Asset Register"),
    heading2("The Asset List"),
    para("The main table displays all assets with the following columns:"),
    emptyLine(),
    twoColTable([
      ["Asset ID", "Unique system-assigned identifier for the asset"],
      ["Description", "Full description of the asset"],
      ["Type", "Asset type (e.g. Roads, Vehicles, Buildings)"],
      ["Category", "Asset category (e.g. Roads Infrastructure, Transport Assets)"],
      ["Sub Category", "More specific classification within the category"],
      ["Condition", "Physical condition rating (Good / Fair / Poor / Very Poor)"],
      ["Cost Closing (R)", "Historical cost / closing balance at year-end"],
      ["Carrying Amount (R)", "Net book value (cost less accumulated depreciation and impairment)"],
      ["Model", "Asset model or specification where applicable"],
    ]),
    emptyLine(),

    heading2("Searching and Filtering"),
    para("Use the controls above the table to narrow down the list:"),
    bullet("Search Box — Type any text to search by description, barcode, asset ID, or serial number. Results update as you type."),
    bullet("All Types — Filter by asset type (e.g. show only Roads assets)"),
    bullet("All Categories — Filter by asset category"),
    bullet("All Sub-Categories — Filter by sub-category"),
    emptyLine(),
    tip("Combine filters to find specific assets quickly. For example, select 'Transport Assets' and then search for a registration number."),
    emptyLine(),

    heading2("Pagination"),
    para("Results are paginated. Use the navigation arrows at the bottom of the table to move between pages, or type a page number directly into the page input field. The label 'Showing X – Y of Z' indicates your current position."),
    emptyLine(),

    heading2("Export to Excel"),
    para("Click the Export Excel button in the top-right to download the full asset register as an Excel spreadsheet. The export includes all visible columns and respects the current search/filter settings."),
    emptyLine(),

    heading1("Viewing Asset Details"),
    para("Click on any row in the asset list to open the full Asset Detail view. The detail screen is organised into several tabs:"),
    emptyLine(),
    twoColTable([
      ["General", "Core asset information — description, barcode, serial number, type, category, class, CIDMS classification, status, condition, and infrastructure details"],
      ["Financial", "Cost, residual value, depreciation method, useful life, carrying amount, revaluation values, and funding source"],
      ["Location", "Building, floor, room, town, ward, street, GPS coordinates, and GIS data"],
      ["Ownership", "Department, custodian, supplier, invoice details, and donation information"],
      ["Transactions", "History of all financial transactions posted against this asset (depreciation, revaluation, impairment, disposal)"],
      ["Documents", "Uploaded supporting documents such as invoices, photos, or certificates"],
    ]),
    emptyLine(),

    heading1("Registering a New Asset"),
    para("Click the + New Asset button in the top-right of the Asset Register. A panel opens at the bottom of the screen where you capture all required details."),
    emptyLine(),
    heading2("Required Fields"),
    twoColTable([
      ["Description", "Full descriptive name of the asset"],
      ["Asset Type", "Select from the configured asset types"],
      ["Asset Category", "Select the appropriate category"],
      ["Asset Sub-Category", "Select the sub-category"],
      ["Asset Class", "Select the asset class"],
      ["Acquisition Date", "Date the asset was acquired"],
      ["In-Service Date", "Date the asset was placed into service (used as the depreciation start date)"],
      ["Purchase Amount (R)", "Historical cost of the asset"],
      ["Useful Life (Years + Months)", "Total economic useful life for depreciation calculation"],
      ["Department", "The municipal department responsible for the asset"],
      ["Custodian", "The employee responsible for the physical asset"],
    ]),
    emptyLine(),
    heading2("CIDMS Classification"),
    para("CIDMS (Capital Investment Decision-Making System) provides a standardised classification hierarchy for infrastructure assets. Click the Select CIDMS button to open the CIDMS picker. Navigate the tree from Accounting Group down to Sub-Component Type and click Confirm Selection. All seven CIDMS levels are automatically populated."),
    emptyLine(),
    tip("CIDMS classification is mandatory for all infrastructure assets (roads, electrical, water, sanitation). For non-infrastructure assets (furniture, equipment, vehicles), CIDMS is optional."),
    emptyLine(),
    heading2("Submitting for Approval"),
    para("Once all required fields are completed, click Register Asset. The asset is submitted to the Workflow Inbox for approval. It will only appear in the live register after an authorised approver approves the submission."),
    emptyLine(),

    heading1("Editing an Asset"),
    para("Open the asset detail view and click the Edit button. All editable fields become active. Make your changes and click Save Changes. The system compares the new values against the current record and generates a Change Summary listing only the fields that were modified. The change is submitted to the Workflow Inbox for approval before it takes effect on the live register."),
    emptyLine(),
    note("You cannot directly update cost, depreciation, or financial values through the Edit function. Financial corrections must be done through the Transactions module (e.g. revaluation, impairment, prior year adjustment)."),
    emptyLine(),

    heading1("Asset Transfers and Disposals"),
    para("From the asset detail view you can initiate:"),
    bullet("Department Transfer — Move the asset to a different department. A reason must be provided."),
    bullet("Disposal — Initiate the formal disposal process. A disposal method (sale, scrap, donation) and date must be provided."),
    para("Both actions are routed through the Workflow Inbox for approval before they are applied."),
  ];
  const doc = buildDoc("Asset Records", children);
  await save(doc, "AssetRecords_UserManual.docx");
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ACQUISITIONS
// ─────────────────────────────────────────────────────────────────────────────
async function genAcquisitions() {
  const imgAcq = imgRun("acquisitions.jpg");
  const children = [
    ...coverPage("Acquisitions"),
    heading1("Overview"),
    para("The Acquisitions module provides three pathways to register new assets into the Asset Register: SCM/GRN (Supply Chain Management Goods Received Notes), Inventory Issue (assets issued from the stores inventory), and Donation (assets received as gifts or grants). An Acquisitions List tab shows all submitted acquisition records."),
    emptyLine(),
    ...(imgAcq ? [imgAcq, imgCaption("Figure 1 — Acquisitions screen showing SCM/GRN transfers")] : []),
    emptyLine(),

    heading1("Tab 1 — SCM / GRN"),
    para("The SCM/GRN tab lists all approved Supply Chain Management transfer records received from the financial system. These are items that have been procured and goods-received, making them eligible for capitalisation as assets."),
    emptyLine(),
    heading2("How to Register an Asset from an SCM/GRN"),
    numbered("The list shows all available GRN transfers with Transfer ID, GRN ID, Asset Category, Asset Class, Description, Supplier, Amount, and Date Captured."),
    numbered("Click on a row to expand the registration form below the list."),
    numbered("Review the pre-filled fields (description, amount, supplier) and complete the asset details — Acquisition Date, In-Service Date, Department, Custodian, Useful Life, and any additional classification fields."),
    numbered("Add CIDMS classification if applicable by clicking Select CIDMS."),
    numbered("Click Register Asset to submit for approval."),
    numbered("The entry is removed from the SCM/GRN list once successfully registered."),
    emptyLine(),
    note("Each GRN line item must be registered individually. If a GRN contains multiple items, each will appear as a separate row."),
    emptyLine(),

    heading1("Tab 2 — Inventory Issue"),
    para("The Inventory Issue tab lists items that have been issued from the municipality's stores inventory to a department. When a consumable item turns out to be a capital asset (i.e. it meets the capitalisation threshold), it is registered here."),
    emptyLine(),
    heading2("How to Register an Asset from Inventory"),
    numbered("Select the inventory issue record from the list."),
    numbered("Complete the asset registration form that appears — pay particular attention to the In-Service Date and Department."),
    numbered("Submit for approval via the Workflow Inbox."),
    emptyLine(),

    heading1("Tab 3 — Donation"),
    para("The Donation tab is used to register assets received as donations, grants-in-kind, or free transfers from other government entities or private donors."),
    emptyLine(),
    heading2("How to Register a Donated Asset"),
    numbered("Click + New Donation to open a blank registration form."),
    numbered("Capture the asset details as normal plus the following donation-specific fields:"),
    emptyLine(),
    twoColTable([
      ["Donor Name", "Name of the organisation or individual who donated the asset"],
      ["Donor Reg Number", "Registration number of the donor entity (if applicable)"],
      ["Date Donated", "The date the asset was received by the municipality"],
      ["Funding Description", "Description of the grant or donation agreement"],
    ]),
    emptyLine(),
    numbered("Submit for approval. Once approved, the asset is added to the register with the acquisition type recorded as Donation."),
    emptyLine(),
    note("Donated assets are typically recorded at fair value on the date of receipt, in compliance with GRAP 23 (Revenue from Non-Exchange Transactions)."),
    emptyLine(),

    heading1("Tab 4 — Acquisitions List"),
    para("The Acquisitions List tab shows all asset acquisitions that have been submitted (regardless of their source — SCM, Inventory, or Donation). This is useful for tracking the status of recent registrations."),
    emptyLine(),
    twoColTable([
      ["Pending", "Submitted and awaiting approval in the Workflow Inbox"],
      ["Approved", "Approved and live in the Asset Register"],
      ["Rejected", "Rejected by the approver — the submission must be corrected and resubmitted"],
    ]),
    emptyLine(),
    tip("Use the Acquisitions List to follow up on assets you have submitted that have not yet been approved. If a submission is rejected, the rejection reason is shown — correct the issue and resubmit."),
  ];
  const doc = buildDoc("Acquisitions", children);
  await save(doc, "Acquisitions_UserManual.docx");
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CAPITAL PROJECTS (WIP)
// ─────────────────────────────────────────────────────────────────────────────
async function genWip() {
  const imgWip = imgRun("wip_list.jpg");
  const children = [
    ...coverPage("Capital Projects (WIP)"),
    heading1("Overview"),
    para("The Capital Projects module manages Work-in-Progress (WIP) assets — capital projects that have been budgeted and are under construction or procurement but have not yet been completed and transferred to the asset register. This module is GRAP 17 compliant. When a project is complete, the WIP balance is unbundled into individual assets and transferred to the live Asset Register."),
    emptyLine(),
    ...(imgWip ? [imgWip, imgCaption("Figure 1 — WIP Register showing capital projects")] : []),
    emptyLine(),

    heading1("Tab 1 — WIP Register"),
    heading2("Understanding the WIP Register"),
    para("The WIP Register shows all active and historical capital projects. Each project card shows:"),
    twoColTable([
      ["Project Name", "Descriptive name of the capital project"],
      ["Project Status", "Current status — Active, Completed, or Cancelled"],
      ["Contract Value (R)", "Total approved contract or budget value of the project"],
      ["WIP Closing Balance (R)", "Total expenditure capitalised to WIP to date"],
      ["Financial Year", "The financial year filter applied to the list"],
    ]),
    emptyLine(),

    heading2("Creating a New WIP Project"),
    heading3("Option 1 — Create from SCM"),
    numbered("Click Create from SCM to link the WIP project to an existing SCM contract."),
    numbered("Select the relevant SCM contract from the list. The contract value and supplier details are pre-populated."),
    numbered("Add the project name, department, and any additional details."),
    numbered("Submit for approval."),
    emptyLine(),
    heading3("Option 2 — Create WIP Project manually"),
    numbered("Click + Create WIP Project."),
    numbered("Complete all required fields: Project Name, Financial Year, Department, Custodian, Contract Value, and Project Status."),
    numbered("Attach supporting documents (e.g. council resolution, engineer's certificate)."),
    numbered("Submit for approval."),
    emptyLine(),

    heading2("Viewing a WIP Project"),
    para("Click on a project row to open the detail view. The WIP detail screen contains:"),
    twoColTable([
      ["General Tab", "Project name, description, department, custodian, status, dates, and CIDMS classification"],
      ["Financial Tab", "Contract value, expenditure per period, and WIP closing balance"],
      ["Costs Tab", "Itemised cost lines posted to this project"],
      ["Documents Tab", "Uploaded project documents"],
      ["Assets Tab", "Any assets already unbundled from this project"],
    ]),
    emptyLine(),

    heading2("Posting Costs to a WIP Project"),
    para("Use the Costs tab within a WIP project to capture expenditure as it is incurred. Each cost line records:"),
    twoColTable([
      ["Financial Year", "The year the cost relates to"],
      ["Period", "The month/period within the financial year"],
      ["Amount (R)", "The cost amount to be capitalised"],
      ["Description", "Description of the cost (e.g. progress payment 1)"],
      ["Reference", "Payment reference or invoice number"],
    ]),
    emptyLine(),
    note("WIP costs are not depreciated. Depreciation only begins once the asset is unbundled from WIP and transferred to the Asset Register with an In-Service Date."),
    emptyLine(),

    heading1("Tab 2 — Asset Unbundling"),
    para("Asset Unbundling is the process of converting a completed WIP project into individual asset records in the Asset Register. This is done once a capital project is physically complete and the asset is ready for use."),
    emptyLine(),
    heading2("Unbundling Process"),
    numbered("Navigate to Capital Projects (WIP) → Asset Unbundling."),
    numbered("Select the completed WIP project to unbundle."),
    numbered("The total WIP closing balance is displayed. You must allocate this balance across one or more individual assets."),
    numbered("For each asset, capture: Description, Asset Category, Asset Type, In-Service Date, Useful Life, Department, Custodian, and CIDMS Classification."),
    numbered("The sum of all asset values must equal the total WIP balance. A running total is shown to help balance the allocation."),
    numbered("Once all assets are captured and the balance is fully allocated, click Submit Unbundling."),
    numbered("The unbundling is routed to the Workflow Inbox for approval."),
    numbered("On approval, the WIP project is marked as Completed and the new assets are added to the Asset Register."),
    emptyLine(),
    tip("If a single WIP project produces multiple assets (e.g. a road project that creates road segments, drainage structures, and signage), add a separate row for each asset component in the unbundling form."),
    emptyLine(),
    note("Depreciation on newly unbundled assets begins from the In-Service Date captured during unbundling, not from the date the WIP project was created."),
  ];
  const doc = buildDoc("Capital Projects (WIP)", children);
  await save(doc, "CapitalProjects_WIP_UserManual.docx");
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. TRANSACTIONS
// ─────────────────────────────────────────────────────────────────────────────
async function genTransactions() {
  const imgTx = imgRun("transactions.jpg");
  const children = [
    ...coverPage("Transactions"),
    heading1("Overview"),
    para("The Transactions module manages all financial movements against assets. It covers the full lifecycle of asset-related accounting events: depreciation runs, revaluations, impairments, disposals, refurbishments, prior year adjustments, and prior period adjustments. All transactions are GRAP-compliant and require approval before they are posted to the asset register."),
    emptyLine(),
    ...(imgTx ? [imgTx, imgCaption("Figure 1 — Transactions module with transaction type tabs")] : []),
    emptyLine(),
    heading2("Transaction Summary Cards"),
    twoColTable([
      ["Total Transactions", "Total number of transaction records in the current financial year"],
      ["Pending Approval", "Transactions submitted but not yet approved"],
      ["Approved", "Transactions that have been approved and posted"],
      ["Rejected", "Transactions rejected by an approver"],
      ["Depreciation Runs", "Number of depreciation runs executed this financial year"],
    ]),
    emptyLine(),

    heading1("Depreciation Run"),
    para("A Depreciation Run calculates and posts depreciation for all active assets in the register. The system uses the straight-line method with a daily rate calculation, meaning depreciation is calculated based on the actual number of days elapsed since the last transaction date. This is GRAP 17.72 compliant."),
    emptyLine(),
    heading2("How to Run Depreciation"),
    numbered("Select the Financial Year and Period for which you want to run depreciation."),
    numbered("Review the Scheduled Date shown — this is the period-end date that will be used as the depreciation date."),
    numbered("Click Run Depreciation. The system calculates the depreciation charge for each eligible asset."),
    numbered("A preview of the depreciation batch is shown. Review the totals before submitting."),
    numbered("Click Submit for Approval. The depreciation batch is sent to the Workflow Inbox for authorisation."),
    numbered("Once approved, all asset carrying amounts and accumulated depreciation balances are updated."),
    emptyLine(),
    note("Assets that have already been depreciated for the selected period are automatically excluded. Partially-depreciated assets receive a pro-rata calculation for the remaining days in the period."),
    emptyLine(),

    heading1("Revaluation"),
    para("Revaluation updates the carrying amount of an asset to its fair value as determined by an independent valuation. The system applies the restatement method: the new cost is calculated from the new carrying value and new RUL using the EUL ratio, and accumulated depreciation is restated proportionally."),
    emptyLine(),
    heading2("How to Submit a Revaluation"),
    numbered("Click the Revaluation tab."),
    numbered("Search for and select the asset to be revalued."),
    numbered("Enter the New Carrying Value (R) from the independent valuation report."),
    numbered("Enter the New Remaining Useful Life (years) as assessed by the valuator."),
    numbered("Enter the Effective Date of the revaluation."),
    numbered("The system calculates and displays the new cost, new accumulated depreciation, and the movement in the Revaluation Reserve."),
    numbered("Attach the valuation certificate document."),
    numbered("Click Submit for Approval."),
    emptyLine(),

    heading1("Impairment"),
    para("Impairment recognises a reduction in an asset's carrying amount below its recoverable amount or recoverable service amount. The system handles both cost-model and revaluation-model assets. For revalued assets, the impairment first absorbs the existing Revaluation Reserve before being charged to the Income Statement."),
    emptyLine(),
    heading2("How to Submit an Impairment"),
    numbered("Click the Impairment tab and select the affected asset."),
    numbered("Enter the Impairment Loss Amount (R)."),
    numbered("Enter the Effective Date."),
    numbered("The system shows the split: how much reduces the Revaluation Reserve vs how much is charged to the Income Statement (only relevant for revalued assets)."),
    numbered("Submit for approval."),
    emptyLine(),

    heading1("Impairment Reversal"),
    para("When the conditions that caused an impairment no longer exist, the impairment can be reversed. The reversal is capped at the lower of: (a) the original impairment amount, or (b) the carrying amount the asset would have had if no impairment had been recognised."),
    emptyLine(),
    heading2("How to Submit an Impairment Reversal"),
    numbered("Click the Impairment Reversal tab and select the asset."),
    numbered("Enter the Reversal Amount (R). The system will automatically cap this at the GRAP-permitted maximum."),
    numbered("Enter the Effective Date and submit for approval."),
    emptyLine(),

    heading1("Disposal"),
    para("Asset Disposal records the de-recognition of an asset from the register. This may occur through sale, scrapping, trade-in, donation, or loss. A disposal calculates any profit or loss on disposal and removes the asset from the active register."),
    emptyLine(),
    heading2("How to Submit a Disposal"),
    numbered("Click the Disposal tab and search for the asset."),
    numbered("Select the Disposal Method: Sale, Scrap, Trade-In, Donation, or Loss/Write-Off."),
    numbered("Enter the Disposal Date."),
    numbered("For sales, enter the Sale Proceeds (R)."),
    numbered("The system calculates the profit or loss on disposal (proceeds minus carrying amount)."),
    numbered("Attach the disposal authorisation document (council resolution or SCM disposal certificate)."),
    numbered("Submit for approval. Once approved, the asset is marked as disposed and removed from the active carrying amount calculations."),
    emptyLine(),

    heading1("Refurbishment"),
    para("A Refurbishment records significant expenditure that extends the useful life or restores the service potential of an existing asset. Unlike routine maintenance (which is expensed), a refurbishment is capitalised and may result in an extended useful life or reduced residual value."),
    emptyLine(),
    heading2("How to Submit a Refurbishment"),
    numbered("Click the Refurbishment tab and select the asset."),
    numbered("Enter the Refurbishment Amount (R) — the capitalised cost of the refurbishment work."),
    numbered("Enter the New Remaining Useful Life (if the refurbishment extends the asset's life)."),
    numbered("Enter the Effective Date."),
    numbered("Attach the contractor invoice or engineer's certificate."),
    numbered("Submit for approval."),
    emptyLine(),

    heading1("Prior Year Adjustments"),
    para("Prior Year Adjustments (PYA) correct errors or omissions in prior financial periods in compliance with GRAP 3. These are retrospective corrections that affect the comparative period and prior periods. Types include cost corrections, revaluation restatements, date corrections, residual value corrections, useful life corrections, and impairment adjustments."),
    emptyLine(),
    note("A detailed Prior Year Adjustments User Manual is available as a separate document covering all 11 adjustment types with full worked examples."),
    emptyLine(),

    heading1("Prior Period Adjustments"),
    para("Prior Period Adjustments correct transactions posted in a prior period within the same financial year. For example, if depreciation was incorrectly calculated in Period 3 and you are now in Period 8, a prior period adjustment corrects the Period 3 figures. These use the same submission and approval workflow as other transactions."),
  ];
  const doc = buildDoc("Transactions", children);
  await save(doc, "Transactions_UserManual.docx");
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. MAINTENANCE
// ─────────────────────────────────────────────────────────────────────────────
async function genMaintenance() {
  const imgM = imgRun("maintenance.jpg");
  const children = [
    ...coverPage("Maintenance"),
    heading1("Overview"),
    para("The Maintenance module manages corrective maintenance requests for municipal assets. When an asset requires repair or maintenance, a request is captured here, assigned to a service provider or internal team, tracked through to completion, and linked to the asset's maintenance cost history."),
    emptyLine(),
    ...(imgM ? [imgM, imgCaption("Figure 1 — Maintenance Requests list view")] : []),
    emptyLine(),

    heading1("Maintenance Request Summary Cards"),
    twoColTable([
      ["Total Requests", "All maintenance requests captured in the system"],
      ["Pending Approval", "Requests submitted but awaiting approval before work can commence"],
      ["In Progress", "Requests that have been approved and work is underway"],
      ["Approved", "Requests that have been completed and approved"],
    ]),
    emptyLine(),

    heading1("Filtering Maintenance Requests"),
    para("Use the filter bar to narrow down the list:"),
    twoColTable([
      ["All Service Groups", "Filter by service group (e.g. Electrical, Roads, Fleet)"],
      ["All Statuses", "Filter by status — Draft, Pending Approval, In Progress, Completed, Rejected"],
      ["From Date / To Date", "Filter by request date range"],
    ]),
    emptyLine(),
    tip("After setting your filter criteria, click the Filter button to apply. Click Clear to reset all filters and show all requests."),
    emptyLine(),

    heading1("Creating a New Maintenance Request"),
    numbered("Click + New Request in the top-right corner."),
    numbered("The New Maintenance Request form opens. Complete the following fields:"),
    emptyLine(),
    twoColTable([
      ["Asset", "Search for and select the asset that requires maintenance"],
      ["Service Group", "Select the maintenance service group (e.g. Electrical, Civil, Fleet)"],
      ["Priority", "Set the urgency level — Low, Medium, High, or Critical"],
      ["Description of Fault", "Describe the problem or defect requiring attention"],
      ["Requested Date", "The date the maintenance is required by"],
      ["Department", "The department requesting the maintenance"],
      ["Reported By", "Name of the person reporting the fault"],
    ]),
    emptyLine(),
    numbered("Upload any supporting photos or documents using the Attachments section."),
    numbered("Click Submit Request. The request enters a Pending Approval status."),
    emptyLine(),

    heading1("Viewing a Maintenance Request"),
    para("Click on any request row to open the detail view. The detail screen shows:"),
    twoColTable([
      ["Request Details", "All captured information — asset, fault description, priority, dates, department"],
      ["Status History", "A timeline of status changes with timestamps and user names"],
      ["Cost Information", "Labour and materials cost recorded against this request"],
      ["Documents", "Uploaded photos, reports, and completion certificates"],
      ["Actions", "Available actions based on your role — Approve, Reject, Mark In Progress, Mark Complete"],
    ]),
    emptyLine(),

    heading1("Approval Workflow"),
    para("Maintenance requests follow a structured approval workflow:"),
    emptyLine(),
    threeColTable(
      ["Step", "Action", "Who"],
      [
        ["1", "Request submitted", "Capturer"],
        ["2", "Supervisor reviews and approves to proceed", "Maintenance Supervisor"],
        ["3", "Work is carried out — status updated to In Progress", "Artisan / Service Provider"],
        ["4", "Work completed — completion certificate uploaded", "Artisan / Service Provider"],
        ["5", "Final approval and cost captured", "Maintenance Supervisor"],
      ]
    ),
    emptyLine(),

    heading1("Maintenance Costs"),
    para("Once a maintenance request is approved and work is underway, costs can be recorded against the request:"),
    twoColTable([
      ["Labour Cost (R)", "Cost of labour to complete the repair"],
      ["Materials Cost (R)", "Cost of parts and materials used"],
      ["Total Cost (R)", "Automatically calculated as Labour + Materials"],
      ["Contractor/Supplier", "Service provider or contractor who performed the work"],
      ["Invoice Number", "Reference to the invoice for audit purposes"],
    ]),
    emptyLine(),
    note("Maintenance costs are expensed to the Income Statement. They are not capitalised to the asset unless the maintenance meets the threshold for a Refurbishment (captured in the Transactions module instead)."),
  ];
  const doc = buildDoc("Maintenance", children);
  await save(doc, "Maintenance_UserManual.docx");
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ASSET VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────
async function genVerification() {
  const imgV = imgRun("verification.jpg");
  const children = [
    ...coverPage("Asset Verification"),
    heading1("Overview"),
    para("The Asset Verification module supports the physical verification of all municipal assets in compliance with GRAP 17 and MFMA requirements. Physical verification involves physically locating each asset, confirming its existence and condition, and updating the register accordingly. The module provides three sub-sections: Verification Register, Verification Planning, and Verification Reports."),
    emptyLine(),
    ...(imgV ? [imgV, imgCaption("Figure 1 — Asset Verification landing page")] : []),
    emptyLine(),

    heading1("Verification Register"),
    para("The Verification Register records the results of physical asset verification exercises. Each register is linked to a specific financial year and can be filtered by department, location, or asset category."),
    emptyLine(),
    heading2("Creating a New Verification Register"),
    numbered("Navigate to Asset Verification → Verification Register."),
    numbered("Click + New Register."),
    numbered("Complete the register header: Financial Year, Department, Location (Building/Floor/Room), and Verification Date."),
    numbered("Assign a Verification Team Leader."),
    numbered("Click Create Register to save the header."),
    emptyLine(),
    heading2("Capturing Verification Results"),
    para("Once a register is created, assets expected to be in the selected location are listed automatically (based on the asset register). For each asset:"),
    emptyLine(),
    twoColTable([
      ["Found", "Tick if the asset was physically located at the specified address"],
      ["Barcode Scanned", "Indicate whether the barcode/tag was scanned or manually confirmed"],
      ["Condition", "Update the physical condition (Good / Fair / Poor / Very Poor / Not Assessed)"],
      ["Location Verified", "Confirm the physical location matches the register"],
      ["Comments", "Notes on any discrepancies or issues observed"],
    ]),
    emptyLine(),
    tip("Assets listed in the register that are not found are flagged as Missing. Assets found but not in the register are captured as New/Unregistered and must be registered through the Asset Records module."),
    emptyLine(),
    heading2("Submitting the Register"),
    para("Once all assets in the scope have been checked, click Submit Register. The register is locked for editing and a summary is generated showing found, missing, and new/unregistered counts. The completed register is available in Verification Reports."),
    emptyLine(),

    heading1("Verification Planning"),
    para("Verification Planning allows supervisors to schedule and plan the annual asset verification exercise across all departments and locations."),
    emptyLine(),
    heading2("Creating a Verification Plan"),
    numbered("Navigate to Asset Verification → Verification Planning."),
    numbered("Click + New Plan."),
    numbered("Set the Financial Year and the planned verification period (start and end dates)."),
    numbered("Add plan items — each item assigns a department or location to a specific team and scheduled date."),
    emptyLine(),
    twoColTable([
      ["Department", "The department whose assets will be verified"],
      ["Location", "Specific building, floor, or room scope (optional)"],
      ["Planned Date", "The scheduled date for that verification session"],
      ["Assigned Team", "The verification team or individual responsible"],
      ["Status", "Not Started / In Progress / Completed"],
    ]),
    emptyLine(),
    numbered("Save the plan. As verification registers are completed, the plan items are automatically marked as completed."),
    emptyLine(),

    heading1("Verification Reports"),
    para("Verification Reports generate compliance and variance reports from completed verification exercises."),
    emptyLine(),
    twoColTable([
      ["Verification Summary", "Overall count of assets found, missing, and new per department or location"],
      ["Missing Assets Report", "Full list of assets that could not be physically located during verification"],
      ["Condition Report", "Distribution of asset conditions as captured during verification vs prior assessment"],
      ["Variance Report", "Differences between the asset register and physical verification findings (location, condition, existence)"],
      ["Completion Status", "Progress of the verification exercise against the verification plan"],
    ]),
    emptyLine(),
    note("Verification reports can be exported to Excel for submission to the Auditor-General as part of the annual financial statements support pack."),
  ];
  const doc = buildDoc("Asset Verification", children);
  await save(doc, "AssetVerification_UserManual.docx");
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. WORKFLOW INBOX
// ─────────────────────────────────────────────────────────────────────────────
async function genWorkflows() {
  const imgW = imgRun("workflows.jpg");
  const children = [
    ...coverPage("Workflow Inbox"),
    heading1("Overview"),
    para("The Workflow Inbox is the central approval hub for Platinum Asset Management. All actions that affect the asset register — new registrations, edits, transactions, transfers, and disposals — require authorisation before they are applied. The Workflow Inbox ensures proper segregation of duties and provides a full audit trail of all approvals and rejections."),
    emptyLine(),
    ...(imgW ? [imgW, imgCaption("Figure 1 — Workflow Inbox showing approval queues")] : []),
    emptyLine(),

    heading1("Inbox Summary Cards"),
    twoColTable([
      ["Pending Workflows", "Total number of items waiting for your approval"],
      ["In Progress", "Workflows that have been opened/reviewed but not yet actioned"],
      ["Transaction Approvals", "Pending financial transaction approvals (depreciation, revaluation, etc.)"],
      ["Approved Today", "Items you have approved in the current day"],
      ["Rejected Today", "Items you have rejected in the current day"],
    ]),
    emptyLine(),

    heading1("Tab 1 — Transaction Approvals"),
    para("This tab shows all pending financial transaction approvals grouped by transaction type. Each group is expandable to show individual records. Transaction types include:"),
    emptyLine(),
    twoColTable([
      ["Depreciation Schedule Approvals", "Depreciation run batches submitted for authorisation"],
      ["Revaluation Approvals", "Individual or batch revaluation submissions"],
      ["Impairment Approvals", "Impairment loss recognition submissions"],
      ["Impairment Reversal Approvals", "Reversal of previously recognised impairment"],
      ["Disposal Approvals", "Asset disposal submissions"],
      ["Refurbishment Approvals", "Capitalised refurbishment submissions"],
      ["Prior Year Adjustment Approvals", "GRAP 3 retrospective correction submissions"],
      ["Asset Register Approvals", "New asset registrations, edits, transfers, and disposals"],
    ]),
    emptyLine(),
    heading2("Reviewing and Approving a Transaction"),
    numbered("Click on the approval group (e.g. Asset Register Approvals) to expand it."),
    numbered("Click on a row to open the approval detail panel below."),
    numbered("Review the approval detail tabs:"),
    emptyLine(),
    twoColTable([
      ["Changes Tab", "Shows a before/after comparison of every field that was changed. Current value is shown in red, proposed value in green."],
      ["Asset Details Tab", "Shows the full proposed asset data snapshot"],
      ["Financial Tab", "Financial values — cost, depreciation, carrying amount"],
      ["Ownership Tab", "Department, custodian, and supplier information"],
      ["Location Tab", "Physical location details"],
    ]),
    emptyLine(),
    numbered("If satisfied with the changes, click Approve Submission. The asset register is immediately updated."),
    numbered("If the submission has errors, click Reject Submission. You will be prompted to enter a rejection reason, which is returned to the originator."),
    emptyLine(),
    tip("Always review the Changes tab first. It highlights only the fields that were modified, making it easy to verify exactly what has changed."),
    emptyLine(),

    heading1("Tab 2 — Pending Workflows"),
    para("Pending Workflows shows non-transaction workflow items — such as maintenance approvals, verification plan approvals, and other process workflows. Each item shows the workflow type, submitted by, and submission date."),
    emptyLine(),

    heading1("Tab 3 — All Workflows"),
    para("The All Workflows tab provides a complete history of all workflow items — Pending, Approved, and Rejected. Use this tab to search for a specific workflow item or to review the history of decisions made."),
    emptyLine(),

    heading1("Tab 4 — Approved"),
    para("Filters the workflow list to show only items that have been approved. Useful for confirming that a specific submission has been processed."),
    emptyLine(),

    heading1("Tab 5 — Rejected"),
    para("Filters the workflow list to show only rejected items. Each rejected item shows the rejection reason. Originators should review rejected items, correct the issues identified, and resubmit."),
    emptyLine(),

    heading1("Approval Authority and Segregation of Duties"),
    note("The system enforces segregation of duties. The person who submitted a transaction cannot approve it. Only users with the Approver role can action items in the Workflow Inbox."),
    emptyLine(),
    twoColTable([
      ["Capturer", "Can submit new assets, edits, transactions, and maintenance requests"],
      ["Approver / Supervisor", "Can approve or reject submissions in the Workflow Inbox"],
      ["Administrator", "Full access including user management and system configuration"],
    ]),
  ];
  const doc = buildDoc("Workflow Inbox", children);
  await save(doc, "WorkflowInbox_UserManual.docx");
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. REPORTS
// ─────────────────────────────────────────────────────────────────────────────
async function genReports() {
  const imgR = imgRun("reports.jpg");
  const children = [
    ...coverPage("Reports"),
    heading1("Overview"),
    para("The Reports module provides statutory and management reports that are fully compliant with GRAP 17, MFMA Section 63, and mSCOA requirements. Reports can be generated for any financial year and exported to Excel for inclusion in the Annual Financial Statements (AFS) and submission to the Auditor-General."),
    emptyLine(),
    ...(imgR ? [imgR, imgCaption("Figure 1 — Reports module showing available report types")] : []),
    emptyLine(),

    heading1("Report 1 — Financial Asset Register (FAR)"),
    para("The Financial Asset Register is the primary statutory report required for the Annual Financial Statements. It is a full 194-column export in GRAP 17, mSCOA, and MFMA format."),
    emptyLine(),
    heading2("What It Contains"),
    bullet("Asset identification — ID, barcode, description, serial number"),
    bullet("Classification — asset type, category, sub-category, class, CIDMS hierarchy"),
    bullet("Financial data — historical cost, accumulated depreciation, carrying amount, revaluation reserve, impairment"),
    bullet("Transaction movements — additions, disposals, depreciation charges for the financial year"),
    bullet("Useful life — estimated useful life, remaining useful life"),
    bullet("Location and ownership — department, custodian, building"),
    emptyLine(),
    heading2("How to Generate"),
    numbered("Click Financial Asset Register."),
    numbered("Select the Financial Year."),
    numbered("Click Generate Report / Export to Excel."),
    numbered("The Excel file downloads automatically with all 194 columns formatted per the mSCOA template."),
    emptyLine(),
    note("This is the report submitted to National Treasury and the Auditor-General as supporting evidence for the AFS note on Property, Plant and Equipment (PPE)."),
    emptyLine(),

    heading1("Report 2 — Depreciation Schedule"),
    para("The Depreciation Schedule provides a full analysis of depreciation movements for the financial year, broken down by asset category and individual asset."),
    emptyLine(),
    twoColTable([
      ["Opening Carrying Amount", "Carrying amount at the start of the financial year"],
      ["Additions", "Assets added during the year"],
      ["Disposals", "Assets disposed of during the year"],
      ["Depreciation Charge", "Total depreciation posted in the year"],
      ["Impairment", "Impairment charges applied in the year"],
      ["Closing Carrying Amount", "Net book value at year-end"],
    ]),
    emptyLine(),
    heading2("Compliance Reference"),
    para("This report is required for AFS Note disclosure per GRAP 17.67 and is used to reconcile the depreciation expense in the Income Statement."),
    emptyLine(),

    heading1("Report 3 — AFS Reconciliation"),
    para("The AFS Reconciliation report reconciles the asset register balances against the General Ledger (GL) control accounts. It is structured to support the AFS Note on PPE per GRAP 17.88."),
    emptyLine(),
    twoColTable([
      ["Cost Reconciliation", "Reconciles the gross cost per the asset register to the cost control account in the GL"],
      ["Accumulated Depreciation", "Reconciles accumulated depreciation to the GL accumulated depreciation control account"],
      ["Carrying Amount", "Reconciles the net carrying amount to the balance sheet"],
    ]),
    emptyLine(),

    heading1("Report 4 — Revaluation Reserve"),
    para("The Revaluation Reserve report shows movements in the revaluation reserve by asset category for the financial year. It supports the OCI (Other Comprehensive Income) note in the AFS."),
    emptyLine(),
    twoColTable([
      ["Opening Reserve Balance", "Revaluation reserve at the start of the year"],
      ["Additions to Reserve", "New revaluations processed during the year"],
      ["Transfers on Disposal", "Reserve transferred to retained earnings on disposal of revalued assets"],
      ["Closing Reserve Balance", "Reserve balance at year-end"],
    ]),
    emptyLine(),
    para("Compliance reference: GRAP 17.39–42 and OCI disclosure requirements."),
    emptyLine(),

    heading1("Report 5 — Condition Assessment"),
    para("The Condition Assessment report summarises the physical condition of all assets as captured during verification. It shows the distribution of assets across condition bands (Good, Fair, Poor, Very Poor) by category and department. Compliance reference: GRAP 17.41."),
    emptyLine(),

    heading1("Report 6 — Disposal Report"),
    para("The Disposal Report lists all assets disposed of during the selected financial year, including disposal method, disposal date, sale proceeds, carrying amount at disposal, and the profit or loss on disposal. Compliance reference: MFMA Section 14 and GRAP 17 de-recognition requirements."),
    emptyLine(),
    tip("All six reports can be exported to Excel. Save the exports in a designated AFS folder for easy retrieval during the audit."),
  ];
  const doc = buildDoc("Reports", children);
  await save(doc, "Reports_UserManual.docx");
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. RECONCILIATION
// ─────────────────────────────────────────────────────────────────────────────
async function genReconciliation() {
  const imgRec = imgRun("reconciliation.jpg");
  const children = [
    ...coverPage("Reconciliation"),
    heading1("Overview"),
    para("The Reconciliation module compares asset register transaction totals against General Ledger (GL) control account balances to verify that the two systems are in agreement. This is a critical internal control required for MFMA compliance and provides assurance that the asset register is complete and accurate before financial statements are prepared."),
    emptyLine(),
    ...(imgRec ? [imgRec, imgCaption("Figure 1 — Reconciliation Summary showing all transaction types balanced")] : []),
    emptyLine(),

    heading1("Using the Reconciliation Screen"),
    heading2("Setting the Filter"),
    numbered("Select the Financial Year (e.g. 2025/2026)."),
    numbered("Select the From Period (e.g. P1 — July)."),
    numbered("Select the To Period (e.g. P8 — February)."),
    numbered("Click Apply Filters to generate the reconciliation summary for the selected period range."),
    emptyLine(),

    heading2("Reading the Reconciliation Summary"),
    para("The summary table shows each transaction type in a separate row:"),
    emptyLine(),
    threeColTable(
      ["Column", "Description", "What to Check"],
      [
        ["Transaction Type", "The type of asset transaction (e.g. Depreciation, Impairment, Disposal)", "Ensure all expected transaction types are listed"],
        ["Asset Register (R)", "Total value posted in the asset register for this transaction type in the selected period", "This must equal the GL balance"],
        ["General Ledger (R)", "Total value posted to the corresponding GL control account", "Obtained from the financial system"],
        ["Variance (R)", "Difference between Asset Register and GL", "Must be R 0.00 for a clean reconciliation"],
        ["Status", "Green tick = Balanced | Red = Variance exists", "Investigate any red status immediately"],
      ]
    ),
    emptyLine(),

    heading2("Balance Check — Debits must equal Credits"),
    para("At the bottom of the reconciliation, a Balance Check row confirms that total debits equal total credits across all transaction types. This is the double-entry control check:"),
    twoColTable([
      ["Asset Register DR = Asset Register CR", "Verifies internal consistency of the asset register journals"],
      ["GL DR = GL CR", "Verifies the GL entries are balanced"],
      ["Variance = R 0.00", "Confirms the asset register and GL agree"],
    ]),
    emptyLine(),
    note("If a variance is identified, do not post any further transactions until the variance is investigated and resolved. Common causes include a GL journal that was reversed without a corresponding asset register reversal, or a transaction approval that failed to update the GL."),
    emptyLine(),

    heading1("Disposal Transactions"),
    para("Disposal transactions are shown in an expandable sub-section. Each disposal record shows the Asset Register entry (carrying amount removed) vs the GL entry (proceeds received and profit/loss recognised). The balance check for disposals confirms that the de-recognition journals are complete."),
    emptyLine(),

    heading1("Reconciliation Status"),
    twoColTable([
      ["All Balanced (green badge)", "All transaction types reconcile — the asset register and GL are in agreement for the selected period"],
      ["Variance detected (red alert)", "One or more transaction types have a difference — investigation is required"],
    ]),
    emptyLine(),
    tip("Run the reconciliation at the end of every period before closing. Export the reconciliation result to Excel and retain it as audit evidence. An 'All Balanced' reconciliation signed off by the CFO is a key control for a clean audit."),
  ];
  const doc = buildDoc("Reconciliation", children);
  await save(doc, "Reconciliation_UserManual.docx");
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
async function genConfiguration() {
  const imgC = imgRun("configuration.jpg");
  const children = [
    ...coverPage("Configuration"),
    heading1("Overview"),
    para("The Configuration module manages all reference data and lookup tables used throughout Platinum Asset Management. Changes made here affect the options available in drop-down lists, classification pickers, and grading assessments across the entire system. Configuration changes should be made carefully by authorised administrators."),
    emptyLine(),
    ...(imgC ? [imgC, imgCaption("Figure 1 — Configuration module showing reference data categories")] : []),
    emptyLine(),

    heading1("Asset Classification"),
    para("Asset Classification reference tables control how assets are categorised in the register:"),
    emptyLine(),
    twoColTable([
      ["Asset Types", "Top-level asset type groupings (e.g. Roads Infrastructure, Transport Assets, Buildings)"],
      ["Asset Categories", "Sub-groupings within each type (e.g. Unpaved Roads, Motor Vehicles, Administrative Buildings)"],
      ["Asset Sub-Categories", "Further classification within categories (e.g. Gravel Roads, SUVs, Municipal Offices)"],
      ["Asset Classes", "Linked to mSCOA asset classes for financial reporting alignment"],
      ["Asset Statuses", "Status codes that can be assigned to assets (e.g. Active, Inactive, Disposed, Under Repair)"],
      ["Asset Project Statuses", "Statuses for WIP capital projects (e.g. Active, Completed, Cancelled)"],
      ["Asset Conditions", "Condition rating descriptions and scores (Good, Fair, Poor, Very Poor, Not Assessed)"],
      ["Component Types", "Sub-categories of asset components used in unbundling"],
      ["Measurement Types", "Units of measurement for assets (e.g. metres, square metres, litres)"],
      ["Municipal Services", "The municipal service area the asset supports (e.g. Water, Sanitation, Roads)"],
    ]),
    emptyLine(),
    heading2("How to Add a New Reference Item"),
    numbered("Click the relevant reference table (e.g. Asset Types)."),
    numbered("Click + New or + Add Row."),
    numbered("Enter the required details (code, description, and any parent link)."),
    numbered("Click Save. The new item is immediately available in the relevant drop-down lists."),
    emptyLine(),
    tip("Before adding a new asset type or category, check with the CFO and the mSCOA consultant to ensure alignment with the municipality's mSCOA chart of accounts."),
    emptyLine(),

    heading1("CIDMS Configuration"),
    para("The CIDMS (Capital Investment Decision-Making System) section manages the seven-level infrastructure asset classification hierarchy. This hierarchy is mandated by National Treasury for all infrastructure assets."),
    emptyLine(),
    twoColTable([
      ["CIDMS Hierarchy View", "Visual tree showing all CIDMS levels and their parent-child relationships"],
      ["CIDMS Accounting Groups", "Level 1 — Top-level infrastructure groupings (e.g. Social, Economic, Administrative)"],
      ["CIDMS Accounting Sub-Groups", "Level 2 — Sub-groups within each accounting group"],
      ["CIDMS Asset Classes", "Level 3 — Infrastructure asset classes (e.g. Roads, Electrical Networks, Water Supply)"],
      ["CIDMS Group Types", "Level 4 — Asset group types within each class"],
      ["CIDMS Asset Types", "Level 5 — Specific asset types"],
      ["CIDMS Component Types", "Level 6 — Component types within each asset type"],
      ["CIDMS Sub-Component Types", "Level 7 — Lowest level — specific sub-components (e.g. Unpaved Road Surface)"],
    ]),
    emptyLine(),
    note("CIDMS data is prescribed by National Treasury. Do not delete or modify existing CIDMS entries without written authorisation from National Treasury. New entries may be added if approved."),
    emptyLine(),
    heading2("Importing CIDMS Data"),
    para("Each CIDMS level supports bulk import via Excel template. Click Download Import Template to get the formatted Excel file, populate it with the new entries, and use Upload File to import."),
    emptyLine(),

    heading1("Transaction Config"),
    twoColTable([
      ["Transaction Types", "Define the types of financial transactions that can be processed (system-managed — do not delete)"],
      ["mSCOA Settings", "Map asset transaction types to mSCOA vote codes for GL integration. This is critical for the GL reconciliation to work correctly."],
    ]),
    emptyLine(),

    heading1("Grading Scales"),
    twoColTable([
      ["Health Grades", "Assessment grades for infrastructure asset health (e.g. 1 = Very Poor, 5 = Very Good)"],
      ["Performance Grades", "Grades for operational performance assessment"],
      ["Utilisation Grades", "Grades for asset utilisation assessment"],
    ]),
    emptyLine(),

    heading1("Maintenance Config"),
    twoColTable([
      ["Service Groups", "Maintenance service group categories (e.g. Electrical, Civil Works, Fleet)"],
      ["Maintenance Types", "Types of maintenance activities (e.g. Corrective, Preventive, Emergency)"],
    ]),
    emptyLine(),
    tip("After making configuration changes, clear your browser cache and refresh the page so that updated drop-down lists reflect immediately across all screens."),
  ];
  const doc = buildDoc("Configuration", children);
  await save(doc, "Configuration_UserManual.docx");
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. BULK UPLOAD
// ─────────────────────────────────────────────────────────────────────────────
async function genBulkUpload() {
  const imgB = imgRun("bulk_upload.jpg");
  const children = [
    ...coverPage("Bulk Upload"),
    heading1("Overview"),
    para("The Bulk Upload module allows authorised users to import large sets of assets or transactions using Excel files. This is particularly useful for the initial loading of the asset register, bulk SCM/WIP transfers, and bulk transaction posting. All uploaded data goes through a validation and approval workflow before it is applied to the live asset register."),
    emptyLine(),
    ...(imgB ? [imgB, imgCaption("Figure 1 — Bulk Upload Jobs tab")] : []),
    emptyLine(),

    heading1("Tab 1 — Upload Jobs"),
    para("Upload Jobs manages the bulk import of asset records into the asset register."),
    emptyLine(),
    heading2("How to Perform a Bulk Asset Upload"),
    numbered("Click Download Template to download the official Excel import template."),
    numbered("Populate the template with your asset data. Each row represents one asset. Mandatory columns are highlighted in the template."),
    numbered("Save the completed Excel file."),
    numbered("Click Upload File and select your file."),
    numbered("The system validates the file and shows a validation summary — Records count and any Errors detected."),
    numbered("Review any errors listed. Common errors include missing mandatory fields, invalid codes (e.g. unrecognised asset type), or formatting issues."),
    numbered("Once the file passes validation (Errors = 0), the upload status changes to Ready for Approval."),
    emptyLine(),
    threeColTable(
      ["Status", "Meaning", "Action Required"],
      [
        ["New", "File uploaded but not yet validated", "Wait for validation to complete"],
        ["Validated", "Passed validation — ready to submit", "Review and submit for approval"],
        ["Errors", "Validation failed — errors found", "Download error report, correct file, re-upload"],
        ["Pending Approval", "Submitted to Upload Approvals tab", "Approver must action in Upload Approvals tab"],
        ["Approved", "Applied to the asset register", "Records are now live"],
        ["Rejected", "Upload rejected by approver", "Correct issues and re-upload"],
      ]
    ),
    emptyLine(),
    tip("Always use the latest version of the downloaded template. Template columns change when the system is updated and older templates may cause validation errors."),
    emptyLine(),

    heading1("Tab 2 — Upload Approvals"),
    para("Upload Approvals shows bulk upload jobs that have been submitted and are awaiting authorisation. An approver reviews the uploaded data before it is applied to the live register."),
    emptyLine(),
    heading2("How to Approve a Bulk Upload"),
    numbered("Click on the upload job to review the records it contains."),
    numbered("Scroll through the data and verify a sample of records for accuracy."),
    numbered("Click Approve to apply all records, or Reject to return the upload to the originator with a reason."),
    emptyLine(),
    note("Approving a bulk upload applies all records at once. Ensure the data is thoroughly reviewed before approving, as bulk reversals are time-consuming."),
    emptyLine(),

    heading1("Tab 3 — WIP Transfers"),
    para("WIP Transfers handles bulk transfers of Work-in-Progress project costs. This is used when expenditure is captured in a financial system and needs to be posted in bulk to WIP projects in Platinum Asset Management."),
    emptyLine(),
    numbered("Download the WIP Transfer Template."),
    numbered("Populate with the WIP project IDs and cost amounts per period."),
    numbered("Upload the file. Validation checks that all WIP project IDs exist and amounts are positive."),
    numbered("Submit for approval via the WIP Transfer Approvals tab."),
    emptyLine(),

    heading1("Tab 4 — WIP Transfer Approvals"),
    para("Shows bulk WIP transfer jobs pending approval. The approval process is identical to Upload Approvals — review the data and click Approve or Reject."),
    emptyLine(),

    heading1("Tab 5 — Bulk Transactions"),
    para("Bulk Transactions enables large-scale financial transaction imports — for example, posting depreciation corrections, revaluations, or prior year adjustments for hundreds of assets at once."),
    emptyLine(),
    numbered("Download the Bulk Transactions Template for the relevant transaction type."),
    numbered("Populate the template — each row represents one transaction on one asset."),
    numbered("Upload and validate."),
    numbered("Submit to Bulk Transaction Approvals."),
    emptyLine(),

    heading1("Tab 6 — Bulk Transaction Approvals"),
    para("Shows bulk transaction jobs pending approval. Approving a bulk transaction posts all transactions simultaneously to the asset register and updates carrying amounts, accumulated depreciation, and revaluation reserves as applicable."),
    emptyLine(),
    note("Bulk Transaction Approvals require higher authority than standard transaction approvals. Only CFO-level users should approve bulk transaction imports."),
  ];
  const doc = buildDoc("Bulk Upload", children);
  await save(doc, "BulkUpload_UserManual.docx");
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. ADMINISTRATION
// ─────────────────────────────────────────────────────────────────────────────
async function genAdministration() {
  const imgA = imgRun("administration.jpg");
  const children = [
    ...coverPage("Administration"),
    heading1("Overview"),
    para("The Administration module provides system-level management functions for authorised administrators. It covers user account management, role assignment, and organisation settings. Only the System Administrator should have access to this module."),
    emptyLine(),
    ...(imgA ? [imgA, imgCaption("Figure 1 — Administration screen showing System Users")] : []),
    emptyLine(),

    heading1("Users & Roles"),
    heading2("System Users List"),
    para("The Users & Roles tab shows all registered system users with the following columns:"),
    emptyLine(),
    twoColTable([
      ["Name", "Full name of the user"],
      ["Username", "Login username used to access the system"],
      ["Email", "User's email address (used for notifications)"],
      ["Role", "The user's role — controls what they can access and do"],
      ["Status", "Active or Inactive — only Active users can log in"],
      ["Last Login", "Date and time of the user's most recent login"],
    ]),
    emptyLine(),

    heading2("User Roles"),
    para("Each user is assigned one of the following roles:"),
    emptyLine(),
    threeColTable(
      ["Role", "Description", "Key Permissions"],
      [
        ["Admin", "System administrator with full access", "User management, configuration, all modules"],
        ["Approver", "Can approve or reject workflow submissions", "Workflow Inbox — approve/reject all transaction types"],
        ["Capturer", "Can capture and submit data for approval", "Asset register, transactions, acquisitions, maintenance — submit only"],
        ["Viewer", "Read-only access across all modules", "View all screens but cannot submit or approve"],
      ]
    ),
    emptyLine(),
    note("The system enforces segregation of duties. A Capturer cannot approve their own submissions. An Approver cannot capture data. These controls cannot be bypassed."),
    emptyLine(),

    heading2("Adding a New User"),
    numbered("Click + Add User."),
    numbered("Complete the user details form:"),
    emptyLine(),
    twoColTable([
      ["Full Name", "User's legal full name"],
      ["Username", "Unique login name (no spaces, typically firstname.surname)"],
      ["Email Address", "Must be a valid municipal email address"],
      ["Role", "Select the appropriate role (Admin / Approver / Capturer / Viewer)"],
      ["Status", "Set to Active to allow immediate login"],
      ["Password", "Set a temporary password — the user should be instructed to change it on first login"],
    ]),
    emptyLine(),
    numbered("Click Save User. The account is created immediately."),
    emptyLine(),
    tip("Follow the municipality's IT security policy when setting passwords. Minimum requirements are typically 8 characters with at least one number and one special character."),
    emptyLine(),

    heading2("Editing a User"),
    para("Click on a user row to open their profile. You can update the name, email, role, and status. To deactivate a user who has left the municipality, set their Status to Inactive. This prevents login without deleting their audit history."),
    emptyLine(),
    note("Do not delete user accounts, even for departed staff. Their submission and approval history is part of the audit trail and must be retained."),
    emptyLine(),

    heading1("Organisation Settings"),
    para("The Organisation Settings tab manages the municipality's profile information used across all reports and documents:"),
    emptyLine(),
    twoColTable([
      ["Municipality Name", "Official municipal name (e.g. Mnquma Local Municipality)"],
      ["Municipality Code", "Government code (e.g. EC122)"],
      ["Financial Year", "The active financial year for all transactions"],
      ["Active Period", "The current accounting period (1–12, corresponding to July–June)"],
      ["Approval Method", "Manual (inbox-based) or Automated approval workflow"],
      ["Logo", "Municipal logo used on report headers"],
      ["Contact Details", "Physical address and contact information for report footers"],
    ]),
    emptyLine(),
    heading2("Changing the Active Financial Year"),
    numbered("Navigate to Administration → Organisation Settings."),
    numbered("Update the Financial Year field."),
    numbered("Update the Active Period to Period 1 (July) for the new year."),
    numbered("Click Save Settings."),
    emptyLine(),
    note("Changing the Active Financial Year affects all modules immediately. Ensure the previous year's depreciation, reconciliation, and reporting is fully complete before rolling over to the new financial year. This action cannot be undone without system administrator assistance."),
  ];
  const doc = buildDoc("Administration", children);
  await save(doc, "Administration_UserManual.docx");
}

// ─────────────────────────────────────────────────────────────────────────────
// RUN ALL
// ─────────────────────────────────────────────────────────────────────────────
console.log("Generating Platinum Asset Management User Manuals...\n");
await genDashboard();
await genAssetRecords();
await genAcquisitions();
await genWip();
await genTransactions();
await genMaintenance();
await genVerification();
await genWorkflows();
await genReports();
await genReconciliation();
await genConfiguration();
await genBulkUpload();
await genAdministration();
console.log("\nAll 13 manuals generated successfully.");
