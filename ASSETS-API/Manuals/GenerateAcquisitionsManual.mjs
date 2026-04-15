// GenerateAcquisitionsManual.mjs
// Detailed Acquisitions User Manual — every screen, every field, every step
// Usage: node GenerateAcquisitionsManual.mjs
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle,
  ShadingType, PageBreak, Header, Footer, PageNumber, ImageRun,
  TableOfContents, StyleLevel
} from "docx";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Colours ──────────────────────────────────────────────────────────────────
const NAVY        = "1E3A5F";
const GOLD        = "D4A843";
const WHITE       = "FFFFFF";
const BLACK       = "000000";
const LIGHT_GREY  = "F2F2F2";
const LIGHT_BLUE  = "EEF3FB";
const WARN_BG     = "FFFBEB";
const WARN_BORD   = "D4A843";
const NOTE_BORD   = "2563EB";
const GREEN_BG    = "F0FDF4";
const GREEN_BORD  = "16A34A";
const RED_BG      = "FEF2F2";
const RED_BORD    = "DC2626";
const STEP_BG     = "F8FAFF";

// ── Text Helpers ──────────────────────────────────────────────────────────────
const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 480, after: 200 },
  children: [new TextRun({ text, bold: true, size: 34, color: NAVY, font: "Calibri" })]
});
const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 320, after: 160 },
  children: [new TextRun({ text, bold: true, size: 28, color: NAVY, font: "Calibri" })]
});
const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 240, after: 100 },
  children: [new TextRun({ text, bold: true, size: 24, color: "2C4A7C", font: "Calibri" })]
});
const h4 = (text) => new Paragraph({
  spacing: { before: 180, after: 80 },
  children: [new TextRun({ text, bold: true, size: 22, color: "444444", font: "Calibri" })]
});
const p = (text, opts = {}) => new Paragraph({
  spacing: { after: opts.after ?? 120 },
  children: [new TextRun({
    text, size: opts.size || 22, bold: opts.bold || false,
    italics: opts.italics || false, font: opts.font || "Calibri",
    color: opts.color || BLACK
  })]
});
const bl = (text, level = 0) => new Paragraph({
  bullet: { level },
  spacing: { after: 60 },
  children: [new TextRun({ text, size: 22, font: "Calibri" })]
});
const num = (text, level = 0) => new Paragraph({
  numbering: { reference: "default-numbering", level },
  spacing: { after: 80 },
  children: [new TextRun({ text, size: 22, font: "Calibri" })]
});
const space = () => new Paragraph({ spacing: { after: 140 }, children: [] });

// ── Callout Boxes ─────────────────────────────────────────────────────────────
const tip = (title, text) => new Paragraph({
  spacing: { after: 160, before: 80 },
  border: { left: { style: BorderStyle.SINGLE, size: 8, color: WARN_BORD } },
  indent: { left: 360 },
  shading: { type: ShadingType.SOLID, color: WARN_BG },
  children: [
    new TextRun({ text: `${title}  `, bold: true, size: 20, color: "92400E", font: "Calibri" }),
    new TextRun({ text, size: 20, font: "Calibri", color: "78350F" })
  ]
});
const note = (title, text) => new Paragraph({
  spacing: { after: 160, before: 80 },
  border: { left: { style: BorderStyle.SINGLE, size: 8, color: NOTE_BORD } },
  indent: { left: 360 },
  shading: { type: ShadingType.SOLID, color: LIGHT_BLUE },
  children: [
    new TextRun({ text: `${title}  `, bold: true, size: 20, color: "1D4ED8", font: "Calibri" }),
    new TextRun({ text, size: 20, font: "Calibri", color: "1E3A8A" })
  ]
});
const success = (title, text) => new Paragraph({
  spacing: { after: 160, before: 80 },
  border: { left: { style: BorderStyle.SINGLE, size: 8, color: GREEN_BORD } },
  indent: { left: 360 },
  shading: { type: ShadingType.SOLID, color: GREEN_BG },
  children: [
    new TextRun({ text: `${title}  `, bold: true, size: 20, color: "166534", font: "Calibri" }),
    new TextRun({ text, size: 20, font: "Calibri", color: "14532D" })
  ]
});
const warn = (title, text) => new Paragraph({
  spacing: { after: 160, before: 80 },
  border: { left: { style: BorderStyle.SINGLE, size: 8, color: RED_BORD } },
  indent: { left: 360 },
  shading: { type: ShadingType.SOLID, color: RED_BG },
  children: [
    new TextRun({ text: `${title}  `, bold: true, size: 20, color: "991B1B", font: "Calibri" }),
    new TextRun({ text, size: 20, font: "Calibri", color: "7F1D1D" })
  ]
});

// ── Step Banner ───────────────────────────────────────────────────────────────
const stepBanner = (stepNum, totalSteps, title) => new Paragraph({
  spacing: { before: 240, after: 120 },
  shading: { type: ShadingType.SOLID, color: NAVY },
  children: [
    new TextRun({ text: `  STEP ${stepNum} OF ${totalSteps} — `, bold: true, size: 24, color: GOLD, font: "Calibri" }),
    new TextRun({ text: title.toUpperCase(), bold: true, size: 24, color: WHITE, font: "Calibri" })
  ]
});

// ── Tables ────────────────────────────────────────────────────────────────────
const noBorder = { style: BorderStyle.NONE, size: 0, color: WHITE };
const thin = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const bords = { top: thin, bottom: thin, left: thin, right: thin };

const hCell = (text, width) => new TableCell({
  width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
  shading: { type: ShadingType.SOLID, color: NAVY },
  borders: bords,
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, bold: true, size: 20, color: WHITE, font: "Calibri" })]
  })]
});
const dc = (text, opts = {}) => new TableCell({
  width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
  shading: opts.shade ? { type: ShadingType.SOLID, color: opts.shade } : undefined,
  borders: bords,
  columnSpan: opts.span,
  children: [new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    children: [new TextRun({
      text: text || "",
      bold: opts.bold || false, italics: opts.italics || false,
      size: 20, font: "Calibri", color: opts.color || BLACK
    })]
  })]
});
const reqMark = () => new TextRun({ text: " *", bold: true, color: "DC2626", size: 20, font: "Calibri" });

// Field-definition table row helper: Label | Required | Description
function fieldRow(label, required, description, shade) {
  return new TableRow({
    children: [
      dc(label, { bold: true, shade, width: 25 }),
      dc(required ? "Required" : "Optional", {
        shade, align: AlignmentType.CENTER,
        color: required ? "166534" : "6B7280", bold: required,
        width: 15
      }),
      dc(description, { shade, width: 60 })
    ]
  });
}

// Standard 2-col reference table
function ref2(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([a, b], i) => new TableRow({
      children: [
        dc(a, { bold: true, shade: i % 2 === 0 ? LIGHT_GREY : undefined, width: 35 }),
        dc(b, { shade: i % 2 === 0 ? LIGHT_GREY : undefined, width: 65 })
      ]
    }))
  });
}

// ── Image Helper ──────────────────────────────────────────────────────────────
function img(filename, w = 560, h = 340) {
  const path = join(__dirname, "screenshots", filename);
  if (!existsSync(path)) return null;
  return new Paragraph({
    spacing: { before: 80, after: 120 },
    alignment: AlignmentType.CENTER,
    children: [new ImageRun({ data: readFileSync(path), transformation: { width: w, height: h }, type: "jpg" })]
  });
}
function caption(text) {
  return new Paragraph({
    spacing: { after: 280 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, size: 18, italics: true, color: "666666", font: "Calibri" })]
  });
}

// ── Cover Page ────────────────────────────────────────────────────────────────
function coverPage() {
  return [
    new Paragraph({ children: [new TextRun({ text: '', size: 48 })], spacing: { before: 1600 } }),
    new Paragraph({
      children: [new TextRun({ text: 'Asset Management System', bold: true, size: 52, color: NAVY, allCaps: true, font: "Calibri" })],
      alignment: AlignmentType.CENTER, spacing: { before: 0, after: 400 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'ACQUISITIONS', bold: true, size: 72, color: NOTE_BORD, allCaps: true, font: "Calibri" })],
      alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 }
    }),
    new Paragraph({
      children: [new TextRun({ text: 'User Manual', size: 48, color: "475569", font: "Calibri" })],
      alignment: AlignmentType.CENTER, spacing: { before: 0, after: 600 }
    }),
    new Paragraph({
      children: [new TextRun({ text: '─'.repeat(60), color: "E2E8F0", size: 22, font: "Calibri" })],
      alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 }
    }),
    ...([
      ['System', 'MFMA/GRAP/mSCOA Asset Management'],
      ['Module', 'Acquisitions — SCM/GRN, Inventory Issue, Donation'],
      ['Compliance', 'GRAP 17, GRAP 23, mSCOA v6.4, MFMA'],
      ['Version', '1.0'],
      ['Prepared for', 'Asset Management System'],
      ['Classification', 'Internal Use'],
    ]).map(([k, v]) => ref2([[k, v]])).flat(),
    new Paragraph({ children: [new TextRun({ text: '', size: 24 })], spacing: { before: 600 } }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ── Table of Contents ────────────────────────────────────────────────────────
function toc() {
  return [
    h1("Table of Contents"),
    new TableOfContents("Table of Contents", {
      hyperlink: true,
      headingStyleRange: "1-3",
      stylesWithLevels: [
        new StyleLevel("Heading1", 1),
        new StyleLevel("Heading2", 2),
        new StyleLevel("Heading3", 3),
      ]
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DOCUMENT CONTENT
// ─────────────────────────────────────────────────────────────────────────────
function buildChildren() {
  const acqImg     = img("acq_scm_tab.jpg", 560, 345);
  const acqInvImg  = img("acq_inventory_tab.jpg", 560, 345);

  return [
    // ─── COVER ─────────────────────────────────────────────────────────────
    ...coverPage(),

    // ─── TOC ───────────────────────────────────────────────────────────────
    ...toc(),

    // ═══════════════════════════════════════════════════════════════════════
    // 1. INTRODUCTION
    // ═══════════════════════════════════════════════════════════════════════
    h1("1. Introduction"),
    p("This manual covers the Asset Acquisitions module of Platinum Asset Management in full detail. It is intended for all staff involved in registering new assets into the municipal asset register — from Supply Chain clerks who process GRNs, to stores staff who issue inventory items, to those who receive donated assets on behalf of the municipality."),
    space(),
    h2("1.1  Purpose"),
    p("Every piece of physical infrastructure, equipment, vehicle, furniture, or other capital item that the municipality owns must be recorded in the asset register. The Acquisitions module is the gateway through which new assets enter the register. There are three ways an asset can be acquired by the municipality:"),
    bl("Purchased through Supply Chain Management (SCM) — captured on a Goods Received Note (GRN) in the financial system."),
    bl("Issued from internal stores inventory — where a consumable item is later confirmed to meet the capitalisation threshold and must be treated as an asset."),
    bl("Received as a donation — where an external party gives the municipality an asset at no charge."),
    space(),
    h2("1.2  Compliance Context"),
    p("The Acquisitions module supports compliance with the following standards:"),
    ref2([
      ["GRAP 17", "Property, Plant and Equipment — recognition criteria: the municipality must capitalise items that meet the cost threshold and provide future economic benefits or service potential."],
      ["GRAP 23", "Revenue from Non-Exchange Transactions — donated assets must be recognised at fair value on the date of receipt."],
      ["MFMA Section 63(1)(c)", "The CFO is responsible for the management and safeguarding of assets. Proper registration supports this obligation."],
      ["mSCOA", "Asset registrations must be classified against the correct mSCOA segment codes."],
    ]),
    space(),
    h2("1.3  Who Uses This Module"),
    ref2([
      ["SCM / Finance Clerk", "Registers assets from approved GRNs and purchase orders"],
      ["Stores / Inventory Clerk", "Registers assets identified from inventory issues"],
      ["Asset Custodian / Officer", "Confirms location, condition, and department for each registered asset"],
      ["Finance Manager / CFO", "Reviews and approves asset registrations in the Workflow Inbox"],
    ]),
    new Paragraph({ children: [new PageBreak()] }),

    // ═══════════════════════════════════════════════════════════════════════
    // 2. NAVIGATING TO ACQUISITIONS
    // ═══════════════════════════════════════════════════════════════════════
    h1("2. Navigating to Acquisitions"),
    p("From any screen in Platinum Asset Management, look at the left-hand navigation sidebar and click on Acquisitions (it appears below Asset Records). The system will load the Asset Acquisitions screen."),
    space(),
    h2("2.1  What You See When the Screen Opens"),
    p("When the Acquisitions module loads, you will see the following elements:"),
    space(),
    acqImg ? acqImg : space(),
    acqImg ? caption("Figure 1 — The Asset Acquisitions screen as it appears on load. The SCM / GRN tab is active by default, showing available transfers from the financial system.") : space(),
    space(),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [hCell("Element", 30), hCell("Location on Screen", 70)] }),
        new TableRow({ children: [dc("Page title", { shade: LIGHT_GREY, width: 30 }), dc("\"Asset Acquisitions\" heading at the top of the content area", { shade: LIGHT_GREY, width: 70 })] }),
        new TableRow({ children: [dc("Page subtitle"), dc("\"Register new assets into the Asset Register via SCM/GRN, Inventory issue, or Donation\"")] }),
        new TableRow({ children: [dc("Tab bar", { shade: LIGHT_GREY }), dc("Four tabs across the top: SCM / GRN, Inventory Issue, Donation, and Acquisitions List. The active tab is underlined in blue.", { shade: LIGHT_GREY })] }),
        new TableRow({ children: [dc("Content card"), dc("The main data area below the tabs — changes depending on which tab is selected.")] }),
      ]
    }),
    space(),
    note("NOTE:", "The SCM / GRN tab is always the default active tab when you first open the Acquisitions screen. If you need a different tab, click it from the tab bar."),
    new Paragraph({ children: [new PageBreak()] }),

    // ═══════════════════════════════════════════════════════════════════════
    // 3. MODULE OVERVIEW
    // ═══════════════════════════════════════════════════════════════════════
    h1("3. Module Overview — Understanding the Four Tabs"),
    p("The Acquisitions module has four tabs. Each tab serves a distinct purpose:"),
    space(),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [hCell("Tab", 20), hCell("When to Use", 40), hCell("Key Difference", 40)] }),
        new TableRow({ children: [
          dc("SCM / GRN", { bold: true, shade: LIGHT_GREY }),
          dc("Use when you have purchased something through the municipality's Supply Chain process and have a Goods Received Note.", { shade: LIGHT_GREY }),
          dc("The system pre-fills supplier, description, and amount from the SCM transfer record. You only need to add the classification, dates, and location.", { shade: LIGHT_GREY }),
        ]}),
        new TableRow({ children: [
          dc("Inventory Issue", { bold: true }),
          dc("Use when an item was previously received into the stores inventory and is now being issued to a department as a capital asset."),
          dc("Pre-fills description and purchase amount from the inventory record."),
        ]}),
        new TableRow({ children: [
          dc("Donation", { bold: true, shade: LIGHT_GREY }),
          dc("Use when the municipality has received a capital asset as a gift, grant, or free transfer from another entity.", { shade: LIGHT_GREY }),
          dc("Requires you to capture donor details and fair value. No pre-filled data from other systems.", { shade: LIGHT_GREY }),
        ]}),
        new TableRow({ children: [
          dc("Acquisitions List", { bold: true }),
          dc("Use to review and track all assets that have already been registered through any of the three acquisition methods."),
          dc("Read-only list. Click any row to open the full asset detail view."),
        ]}),
      ]
    }),
    space(),
    tip("TIP:", "All three acquisition methods use the same 5-step registration wizard to capture the asset's classification, dates, ownership, and location. The only differences are the pre-filled data and the donor fields on the Donation tab."),
    new Paragraph({ children: [new PageBreak()] }),

    // ═══════════════════════════════════════════════════════════════════════
    // 4. TAB 1 — SCM / GRN
    // ═══════════════════════════════════════════════════════════════════════
    h1("4. Tab 1 — SCM / GRN"),
    p("This tab connects directly to the municipality's Supply Chain Management system. When a purchase order is approved and the goods are received, the financial system creates a transfer record. These transfer records appear in this list and are ready to be registered as assets."),
    space(),

    h2("4.1  The SCM / GRN Transfer List"),
    p("The transfer list shows all SCM GRN records that are available to be registered as assets. These have already been approved by SCM and the goods have been physically received. Your job is to formally register each item as an asset in the asset register."),
    space(),
    p("The list has the following columns:", { bold: false }),
    space(),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [hCell("Column Header", 25), hCell("What It Shows", 75)] }),
        ...[
          ["Transfer ID", "A unique identifier for this SCM transfer record. This links the asset register entry back to the specific SCM transaction."],
          ["GRN ID", "The Goods Received Note number from the financial system. Use this to locate the physical paperwork (delivery note, GRN) when auditing."],
          ["Asset Category", "The pre-classified asset category as determined by the SCM system (e.g. Furniture and Office Equipment, Plant and Equipment)."],
          ["Asset Class", "The specific asset class within the category (e.g. Chair High Back, Air Conditioner). This is the item description from the purchase order."],
          ["Description", "The full description of the goods as captured on the purchase order or GRN."],
          ["Supplier", "The name of the supplier or vendor who delivered the goods."],
          ["Amount", "The purchase price (Rand value) of this specific line item from the purchase order / GRN."],
          ["Date Captured", "The date on which the GRN was captured in the financial system."],
        ].map(([a, b], i) => new TableRow({ children: [
          dc(a, { bold: true, shade: i % 2 === 0 ? LIGHT_GREY : undefined }),
          dc(b, { shade: i % 2 === 0 ? LIGHT_GREY : undefined })
        ]}))
      ]
    }),
    space(),

    h2("4.2  Filtering the Transfer List"),
    p("If there are many records in the list, use the column filter inputs to narrow down to the specific transfer you are looking for. Each filter input is located directly below the column heading:"),
    space(),
    bl("Transfer ID filter — type the Transfer ID number to jump directly to a specific record."),
    bl("GRN ID filter — type the GRN number to find all line items from a specific GRN."),
    bl("Asset Category filter — type part of the category name to filter by category."),
    bl("Asset Class filter — type part of the asset class description to filter by item type."),
    space(),
    p("The list updates instantly as you type — you do not need to press Enter or click a Search button. To clear a filter, delete the text from the filter input."),
    space(),
    tip("TIP:", "If a single GRN has multiple line items (e.g. GRN 2493 has 10 chairs), each line item appears as a separate row with its own Transfer ID. You must register each line item individually as a separate asset."),
    space(),

    h2("4.3  Collapsing and Expanding the List"),
    p("At the top of the content card is a collapse bar. This bar shows the count of records in the current filtered view (e.g. \"114 of 114 SCM/GRN transfer(s)\"). You can:"),
    bl("Click the collapse bar to hide the list — this gives you more screen space when the registration wizard is open."),
    bl("Click \"Hide list\" (top right of the bar) to collapse, or \"Show list\" to expand again."),
    bl("When the list is collapsed and you have selected a transfer, a blue selection chip appears in the bar showing the selected Transfer ID, description, and amount, confirming which record you are working with."),
    space(),

    h2("4.4  Selecting a Transfer to Register"),
    p("To begin registering an asset from an SCM/GRN transfer:"),
    space(),
    num("Scroll through the list or use the filters to find the transfer you want to register."),
    num("Click anywhere on the row for that transfer. The row highlights in blue to show it is selected."),
    num("The list automatically collapses and the Registration Wizard panel opens below."),
    num("An information banner appears at the top of the wizard showing: \"Pre-filled from SCM Transfer #[ID] — GRN: [number] — [Supplier] — [Amount]\". This confirms which transfer you are registering."),
    num("The Description and Acquisition Cost fields in Step 1 are automatically pre-filled from the SCM transfer data."),
    num("Complete all five wizard steps (see Section 5) and save the asset."),
    space(),
    note("NOTE:", "Each transfer row can only be registered once. Once you save the asset, that Transfer ID is removed from the list and will no longer appear. This prevents duplicate registrations."),
    new Paragraph({ children: [new PageBreak()] }),

    // ═══════════════════════════════════════════════════════════════════════
    // 5. THE ASSET REGISTRATION WIZARD
    // ═══════════════════════════════════════════════════════════════════════
    h1("5. The Asset Registration Wizard"),
    p("When you select a transfer from the SCM/GRN or Inventory tab, or when you open the Donation tab, the Asset Registration Wizard appears. This wizard guides you through five steps to capture all the information needed to add the asset to the register."),
    space(),
    p("The wizard panel has:"),
    bl("A title bar — shows which type of registration you are doing (e.g. \"Register Asset from Invoice\", \"Register Donated Asset\")."),
    bl("A step bar — five step buttons at the top (Classification, Dates & Source, Ownership, Location, Review). Completed steps are shown in green with a tick. The current step is highlighted in blue."),
    bl("A step body — the data entry area for the current step."),
    bl("Navigation buttons — Back and Next buttons at the bottom. On the final step, a Save Asset button appears instead of Next."),
    bl("A close button (X) — cancels the wizard and returns you to the list without saving."),
    space(),
    tip("TIP:", "You can click on any step button at the top of the wizard to jump directly to that step, even after you have moved forward. This is useful for going back to correct a field you noticed was wrong."),
    space(),

    // ── STEP 1 ──────────────────────────────────────────────────────────────
    stepBanner(1, 5, "Classification"),
    p("Step 1 captures how the asset is classified in the register — its type, category, class, condition, barcode, useful life, and cost. These fields drive depreciation calculations and financial reporting."),
    space(),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [hCell("Field Label", 25), hCell("Required?", 15), hCell("What to Enter and Why", 60)] }),
        fieldRow("Description", true,
          "The full, plain-English description of the asset. This appears on all reports, the asset register, and the Annual Financial Statements. Be specific — instead of \"Chair\", write \"High Back Bonded Leather Office Chair\". Avoid abbreviations. Pre-filled from the SCM/GRN description if registering from an SCM transfer.",
          LIGHT_GREY),
        fieldRow("Asset Type", false,
          "Select the top-level asset type from the drop-down (e.g. Furniture and Office Equipment, Transport Assets, Roads Infrastructure). This determines which categories are available in the next field. Select the type that best describes the physical nature of the asset."),
        fieldRow("Category", false,
          "Select the asset category. The list is filtered based on the Asset Type you selected above. For example, if you selected \"Transport Assets\", you will see categories like Motor Vehicles, Construction Machinery. If no Asset Type is selected, all categories are shown.",
          LIGHT_GREY),
        fieldRow("Sub-Category", false,
          "Select the sub-category within the category. For example, if the Category is Motor Vehicles, sub-categories might be Sedan, SUV, Bakkie. The list is filtered based on the Category selected above."),
        fieldRow("Asset Class", false,
          "Select the mSCOA-aligned asset class. The list is filtered based on the Sub-Category. This links the asset to the correct mSCOA vote and GL account. If the correct class does not appear, contact the Finance Manager to check the Configuration settings.",
          LIGHT_GREY),
        fieldRow("Measurement Type", false,
          "Select the unit of measurement applicable to this asset type (e.g. Each, Square Metres, Kilometres, Litres). Used for infrastructure assets to record the quantity measure."),
        fieldRow("Asset Status", false,
          "Select the current status of the asset. For a brand new asset being registered for the first time, select \"Active\" or \"In Service\" (as configured by your system administrator).",
          LIGHT_GREY),
        fieldRow("Condition", false,
          "Select the physical condition of the asset at the time of registration: Good, Fair, Poor, or Very Poor. For brand new assets from SCM, this is typically \"Good\"."),
        fieldRow("Barcode", false,
          "Enter the asset barcode or tag number if a barcode label has already been affixed to the asset. If the asset has not yet been barcoded, leave this blank and update it once the label is applied. The barcode must be unique across all assets.",
          LIGHT_GREY),
        fieldRow("Serial Number", false,
          "Enter the manufacturer's serial number from the asset itself, the box, or the delivery note. Useful for identifying assets in the event of theft or insurance claims."),
        fieldRow("Useful Life (months)", false,
          "Enter the total expected useful life of the asset in months. For example: 5 years = 60 months, 10 years = 120 months. This drives the straight-line depreciation calculation. Use your municipality's asset management policy or GRAP 17 guidelines to determine the appropriate useful life per asset type.",
          LIGHT_GREY),
        fieldRow("Acquisition Cost (R)", true,
          "Enter the purchase price in Rands (inclusive of VAT if the municipality is not VAT registered, or exclusive of VAT if the municipality recovers VAT). For SCM assets, this is pre-filled from the GRN amount. For donated assets, enter the fair value as determined by an independent valuation or the donor's stated value."),
      ]
    }),
    space(),
    warn("WARNING:", "Description and Acquisition Cost are mandatory fields (marked with a red asterisk *). The system will not allow you to proceed to Step 2 if either of these fields is blank."),
    space(),
    note("NOTE:", "The Asset Type, Category, Sub-Category, and Asset Class fields use cascading (linked) drop-downs. Selecting a value in one field filters the options in the next field. Always start with Asset Type before selecting Category."),
    space(),
    p("When you have filled in all applicable fields in Step 1, click the Next button at the bottom-right of the wizard panel to proceed to Step 2."),
    space(),

    // ── STEP 2 ──────────────────────────────────────────────────────────────
    stepBanner(2, 5, "Dates & Source"),
    p("Step 2 captures the key dates for the asset and the source/supplier information. Dates are critical for depreciation calculations — particularly the In-Service Date, which is the date from which depreciation begins."),
    space(),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [hCell("Field Label", 25), hCell("Required?", 15), hCell("What to Enter and Why", 60)] }),
        fieldRow("Acquisition Date", false,
          "The date on which the asset was purchased or acquired. For SCM assets, this is typically the invoice date or the GRN date. Enter in the format shown in the date picker (click the calendar icon to select). This date is recorded for audit purposes but is not used directly in depreciation.",
          LIGHT_GREY),
        fieldRow("Ready For Use / Commissioning Date", false,
          "The date on which the asset was commissioned, installed, or first made ready for use. For simple assets (chairs, computers), this may be the same as the Acquisition Date. For infrastructure assets, this is the date the construction was completed and handed over."),
        fieldRow("In-Service Date", false,
          "IMPORTANT — This is the date from which depreciation is calculated. It should be the date the asset was actually placed into active service (i.e. first used). For new assets, this is often the same as the commissioning date. If you are not sure of the exact date, use the beginning of the month in which the asset was received.",
          LIGHT_GREY),
        fieldRow("Verification Date", false,
          "The date on which the asset was physically verified (seen and confirmed to exist in the stated location). This is updated during physical verification exercises but can be set to the acquisition date initially to indicate it was verified on receipt."),
        fieldRow("Supplier Name", false,
          "The name of the company or person who supplied the asset. For SCM assets, this is pre-filled from the transfer record. Verify it is correct and complete the full business name.",
          LIGHT_GREY),
        fieldRow("Supplier Code", false,
          "The supplier's code or vendor number as used in the financial system. This helps link the asset record back to the creditor/vendor master in the GL."),
        fieldRow("Invoice Number", false,
          "The supplier's invoice number from the delivery documentation. This is essential for the audit trail — auditors will request this to verify the asset's cost.",
          LIGHT_GREY),
        fieldRow("Payment Number", false,
          "The payment reference or voucher number from the financial system. This links the asset registration to the specific payment made to the supplier."),
      ]
    }),
    space(),
    warn("IMPORTANT — In-Service Date:",
      "The In-Service Date is the most important date for financial reporting. It determines when depreciation starts and which financial year's accounts are affected. Always set this date carefully and in consultation with the Finance Manager if there is any uncertainty."),
    space(),
    note("NOTE:", "If the asset is a SCM purchase, the Supplier Name is pre-filled from the transfer record. Always verify it is the correct supplier name as it will appear on the asset register and all MFMA reports."),
    space(),
    p("When all date and source fields are completed, click Next to proceed to Step 3."),
    space(),

    // ── STEP 3 ──────────────────────────────────────────────────────────────
    stepBanner(3, 5, "Ownership"),
    p("Step 3 records who is responsible for the asset within the municipality. Custody information is critical for accountability — each asset must be assigned to a specific department and a named individual custodian."),
    space(),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [hCell("Field Label", 25), hCell("Required?", 15), hCell("What to Enter and Why", 60)] }),
        fieldRow("Department", false,
          "Select the municipal department that is responsible for this asset (e.g. Roads and Transport, Water and Sanitation, Corporate Services). The department is accountable for the asset's safeguarding and maintenance. The list is filtered based on your organisation's departmental structure.",
          LIGHT_GREY),
        fieldRow("Division", false,
          "Select the division within the selected department (e.g. within Roads and Transport, you might have Gravel Roads, Stormwater, Traffic). The division list is filtered based on the Department you selected. If your department has no sub-divisions, leave this blank."),
        fieldRow("Custodian", false,
          "Select the employee who is the designated physical custodian of the asset. The custodian is the person who has day-to-day responsibility for the asset — they sign the asset handover certificate and are accountable for its safeguarding. The list shows all employees in the system. If the custodian is not listed, contact the HR or System Administrator to add the employee.",
          LIGHT_GREY),
        fieldRow("Asset Ownership", false,
          "Enter any additional ownership description if the asset is jointly owned or held on behalf of another entity. For standard municipal assets, this field can be left blank or entered as the municipality's full name."),
      ]
    }),
    space(),
    tip("TIP:", "Always select a Custodian. While this field is not enforced as mandatory by the system, the Auditor-General expects every asset to have a named custodian. Assets without a custodian are a finding in asset management audits."),
    space(),
    note("NOTE:", "When you select a Department, the Division drop-down automatically updates to show only divisions belonging to that department. If no divisions are configured for the selected department, the Division drop-down will remain empty."),
    space(),
    p("When you have selected the Department and Custodian, click Next to proceed to Step 4."),
    space(),

    // ── STEP 4 ──────────────────────────────────────────────────────────────
    stepBanner(4, 5, "Location"),
    p("Step 4 records the physical location of the asset. Accurate location data is essential for physical verification exercises and for the Auditor-General's confirmation of asset existence."),
    space(),
    p("The location fields work in a cascading hierarchy: selecting a Town filters the Suburb list; selecting a Suburb filters the Street list; selecting a Building filters the Floor list; selecting a Floor filters the Room list. Always work from top to bottom."),
    space(),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [hCell("Field Label", 25), hCell("Required?", 15), hCell("What to Enter and Why", 60)] }),
        fieldRow("Town", false,
          "Select the town or settlement where the asset is physically located. The list shows all towns configured in the system. This is the starting point for the location hierarchy.",
          LIGHT_GREY),
        fieldRow("Ward", false,
          "Select the municipal ward in which the asset is located. Wards are important for MFMA reporting — management and council need to know which wards capital assets are deployed in."),
        fieldRow("Suburb", false,
          "Select the suburb or area within the selected town. The list is filtered based on the selected town.",
          LIGHT_GREY),
        fieldRow("Street", false,
          "Select the street address or road name where the asset is located. The list is filtered based on the selected suburb. For moveable assets (vehicles, equipment), this refers to the home base or depot address."),
        fieldRow("Building", false,
          "Select the building in which the asset is located. The list is filtered based on the selected street. For infrastructure assets (roads, pipelines), leave this blank.",
          LIGHT_GREY),
        fieldRow("Floor", false,
          "Select the floor level within the building. The list is filtered based on the selected building. For single-storey buildings, this will typically only have one option (e.g. \"Ground Floor\")."),
        fieldRow("Room", false,
          "Select the specific room or office within the building and floor. The list is filtered based on the selected floor. For infrastructure assets, leave blank.",
          LIGHT_GREY),
        fieldRow("Location Description", false,
          "Enter any additional free-text description to precisely locate the asset if the drop-down fields are not specific enough. Examples: \"Server Room at back of Finance Block\", \"Junction of N2 and R63\", \"Municipal Workshop Bay 3\". This field is searchable and helps verifiers find assets quickly."),
      ]
    }),
    space(),
    tip("TIP:", "For moveable assets (vehicles, computers, printers), record their home base or the department they are deployed to. During verification, the system will look for these assets at the recorded location."),
    space(),
    note("NOTE:", "Location reference data (Towns, Wards, Suburbs, Buildings, Rooms etc.) is managed in the Configuration module. If the location you need does not appear in any drop-down, contact your System Administrator to add it."),
    space(),
    p("When you have captured the location details, click Next to proceed to Step 5."),
    space(),

    // ── STEP 5 ──────────────────────────────────────────────────────────────
    stepBanner(5, 5, "Review & Save"),
    p("Step 5 is the final review before the asset is saved. No data entry is required here. This screen shows a summary of everything you captured in Steps 1–4 so you can check for errors before submitting."),
    space(),
    h3("5.1  Review Grid"),
    p("The Review screen is divided into two summary panels:"),
    space(),
    ref2([
      ["Classification panel", "Shows: Description, Acquisition Cost, Barcode, Serial Number, and Useful Life."],
      ["Dates & Source panel", "Shows: Acquisition Date, In-Service Date, Supplier Name, Invoice Number. For donations, also shows Donor Name, Donor Registration Number, and Date Donated. For SCM assets, also shows the GRN ID. For inventory, shows the Inventory ID."],
    ]),
    space(),
    h3("5.2  Review Checklist"),
    p("Before saving, verify the following:"),
    bl("Description is specific and meaningful — it will appear on all reports and the AFS."),
    bl("Acquisition Cost is correct — this is the cost that will be used for all depreciation calculations."),
    bl("In-Service Date is correct — this determines when depreciation starts."),
    bl("The Supplier / Donor information matches your physical documentation."),
    bl("If a Barcode was entered, confirm it matches the label physically on the asset."),
    space(),
    warn("WARNING:", "Once you click Save Asset, the asset is created in the system and submitted for approval. You can edit details afterwards through the Asset Records module, but corrections require another approval cycle. Double-check everything before saving."),
    space(),
    h3("5.3  Saving the Asset"),
    p("When you are satisfied that all information is correct:"),
    space(),
    num("Click the Save Asset button (green button at the bottom-right of the wizard panel). The button shows a spinning indicator while saving — do not click it again."),
    num("The system creates the asset record and submits it to the Workflow Inbox for approval."),
    num("A success message appears confirming the asset has been created."),
    num("The wizard closes and the selected transfer is removed from the SCM/GRN list."),
    num("You can find the newly created asset in the Acquisitions List tab, or in the Asset Records module."),
    space(),
    success("SUCCESS:", "The asset has been saved and submitted for approval. It will appear in the live asset register once an authorised approver reviews and approves it in the Workflow Inbox."),
    space(),
    h3("5.4  Cancelling the Wizard"),
    p("If you want to cancel the registration without saving, click the X (close) button in the top-right of the wizard panel. The system will discard all the information you entered and return you to the transfer list. No data is saved."),
    space(),
    h3("5.5  Going Back to a Previous Step"),
    p("If you are on Step 5 (Review) and notice an error in Step 1 (Classification), you have two options:"),
    bl("Click the Back button repeatedly to return to the previous steps."),
    bl("Click directly on the step label (e.g. \"Classification\") in the step bar at the top of the wizard."),
    p("After making your correction, click Next to advance through the steps again. You do not need to re-enter data in the steps you pass through — the system remembers what you entered."),
    new Paragraph({ children: [new PageBreak()] }),

    // ═══════════════════════════════════════════════════════════════════════
    // 6. TAB 2 — INVENTORY ISSUE
    // ═══════════════════════════════════════════════════════════════════════
    h1("6. Tab 2 — Inventory Issue"),
    p("The Inventory Issue tab is used when an item that was received into the municipality's stores inventory is later identified as a capital asset. This happens when an item that was expected to be consumed (and therefore expensed) turns out to have a useful life greater than one year and a cost above the capitalisation threshold."),
    space(),
    acqInvImg ? acqInvImg : space(),
    acqInvImg ? caption("Figure 2 — Inventory Issue tab showing items available for capitalisation.") : space(),
    space(),

    h2("6.1  The Inventory Transfer List"),
    p("The list shows inventory issue records that have been flagged for capitalisation. The columns are:"),
    space(),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [hCell("Column Header", 25), hCell("What It Shows", 75)] }),
        ...[
          ["Item ID", "Unique identifier for this inventory issue line item."],
          ["Inventory ID", "The inventory system's reference number for the stock issue."],
          ["Asset Category", "Pre-classified category from the inventory system."],
          ["Asset Class", "The specific asset class/description from inventory records."],
          ["Description", "The full description of the item as captured in the inventory system."],
          ["Qty", "Quantity of items on this issue. If Qty is greater than 1, a separate asset record must be created for each individual item."],
          ["Purchase Amount", "The unit purchase price from the inventory system."],
          ["Invoice Date", "The date on the original purchase invoice."],
        ].map(([a, b], i) => new TableRow({ children: [
          dc(a, { bold: true, shade: i % 2 === 0 ? LIGHT_GREY : undefined }),
          dc(b, { shade: i % 2 === 0 ? LIGHT_GREY : undefined })
        ]}))
      ]
    }),
    space(),
    h2("6.2  Registering an Asset from Inventory"),
    num("Click the Inventory Issue tab."),
    num("Use the filter inputs to find the inventory item you want to capitalise."),
    num("Click the row. The list collapses and the Registration Wizard opens with an information banner showing: \"Pre-filled from Inventory Transfer #[ID] — Inventory ID: [number] — [Amount]\"."),
    num("The Description and Acquisition Cost in Step 1 are pre-filled from the inventory record."),
    num("Complete all five wizard steps as described in Section 5."),
    num("Click Save Asset."),
    space(),
    warn("IMPORTANT:", "If the Qty column shows a quantity greater than 1 (e.g. Qty = 5), this means five identical items were issued. You must register each item as a separate asset record (because each item has its own barcode, location, and custodian). Repeat the registration process for each individual item."),
    new Paragraph({ children: [new PageBreak()] }),

    // ═══════════════════════════════════════════════════════════════════════
    // 7. TAB 3 — DONATION
    // ═══════════════════════════════════════════════════════════════════════
    h1("7. Tab 3 — Donation"),
    p("The Donation tab is used to register assets that the municipality receives as donations, grants-in-kind, or free transfers from government entities (e.g. provincial department, Eskom, Rand Water) or private donors. These assets are recognised at fair value on the date of receipt, in compliance with GRAP 23."),
    space(),

    h2("7.1  Screen Layout — Donation Tab"),
    p("Unlike the SCM and Inventory tabs (which show a list first), the Donation tab opens directly with a \"Donation Details\" form at the top followed immediately by the Registration Wizard. This is because there is no pre-existing transfer list to select from — every donation is a fresh capture."),
    space(),

    h2("7.2  Donation Details Form"),
    p("Complete the Donation Details form before proceeding through the wizard steps:"),
    space(),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [hCell("Field Label", 25), hCell("Required?", 15), hCell("What to Enter", 60)] }),
        fieldRow("Donor Name", true,
          "Enter the full legal name of the donor — the organisation or individual who donated the asset. For government entities, use the official entity name (e.g. \"Eastern Cape Department of Public Works\"). For private donors, use the full name or company name.",
          LIGHT_GREY),
        fieldRow("Donor Registration Number", false,
          "Enter the donor's company registration number (for businesses) or ID number (for individuals). This field is optional but should be completed when the information is available for audit purposes."),
        fieldRow("Date Donated", true,
          "The date on which the municipality physically received the asset from the donor. This is the date used for accounting purposes — the asset is recognised in the period in which this date falls.",
          LIGHT_GREY),
        fieldRow("Donation Value (R)", true,
          "Enter the fair value of the donated asset in Rands. This becomes the asset's \"Acquisition Cost\" in the register and is used for all depreciation calculations. Fair value should be supported by: (a) an independent valuation, (b) a written statement from the donor, or (c) market evidence of a similar asset's price."),
      ]
    }),
    space(),
    note("GRAP 23 NOTE:", "Donated assets must be recognised at fair value on the date of receipt. Fair value must be supportable by objective evidence. Maintain the valuation document or donor's statement on file as audit evidence."),
    space(),
    h2("7.3  Completing the Wizard for a Donated Asset"),
    p("After completing the Donation Details form, proceed through the same 5-step wizard as described in Section 5. The wizard title will show \"Register Donated Asset\". On Step 5 (Review), the review panel will display the Donor Name, Donor Reg Number, and Date Donated in addition to the standard fields."),
    space(),
    p("Key points specific to donated assets:"),
    bl("Step 1 — Classification: The Acquisition Cost is pre-filled from the Donation Value you entered in the Donation Details form. Do not change this unless you have a corrected valuation."),
    bl("Step 2 — Dates & Source: The Supplier Name field should be left blank or may contain the donor's name for reference. The Invoice Number and Payment Number do not apply to donations — leave them blank."),
    bl("Step 3 — Ownership: Record the department that will be using and safeguarding the donated asset."),
    bl("Step 4 — Location: Record where the donated asset will be physically deployed."),
    new Paragraph({ children: [new PageBreak()] }),

    // ═══════════════════════════════════════════════════════════════════════
    // 8. TAB 4 — ACQUISITIONS LIST
    // ═══════════════════════════════════════════════════════════════════════
    h1("8. Tab 4 — Acquisitions List"),
    p("The Acquisitions List tab shows all assets that have been registered through the Acquisitions module — from any of the three sources (SCM/GRN, Inventory, or Donation). This is a read-only view used for tracking and reference."),
    space(),

    h2("8.1  How the List is Organised"),
    p("The acquisitions list is divided into three separate tables, one for each acquisition type:"),
    space(),

    h3("SCM / GRN Acquisitions"),
    p("Shows all assets registered from SCM/GRN transfers. Columns:"),
    ref2([
      ["Asset ID", "The system-assigned Asset ID. Click the row to open the full asset detail page."],
      ["Description", "The asset description as captured in Step 1 of the wizard."],
      ["Barcode", "The barcode number if captured during registration."],
      ["Acquisition Date", "The acquisition date captured in Step 2."],
      ["Cost", "The purchase amount from the GRN/SCM transfer."],
      ["Supplier", "The supplier name from Step 2."],
    ]),
    space(),

    h3("Inventory Acquisitions"),
    p("Shows all assets registered from inventory issue records. Columns:"),
    ref2([
      ["Asset ID", "System-assigned Asset ID."],
      ["Description", "Asset description."],
      ["Barcode", "Barcode if captured."],
      ["Acquisition Date", "Date captured in Step 2."],
      ["Cost", "Purchase amount from the inventory record."],
      ["Inventory ID", "The inventory system reference number that was used to create this asset."],
    ]),
    space(),

    h3("Donation Acquisitions"),
    p("Shows all assets registered as donations. Columns:"),
    ref2([
      ["Asset ID", "System-assigned Asset ID."],
      ["Description", "Asset description."],
      ["Donor", "Donor name from the Donation Details form."],
      ["Date Donated", "Date donated from the Donation Details form."],
      ["Donation Value", "The fair value captured as the acquisition cost."],
      ["Donor Reg No", "Donor registration number if captured."],
    ]),
    space(),
    h2("8.2  Opening an Asset from the List"),
    p("Click on any row in any of the three tables to navigate directly to the full Asset Detail page for that asset. From the Asset Detail page you can view all fields, edit information, view the transaction history, and see the approval status."),
    space(),
    tip("TIP:", "Use the Acquisitions List to check the status of assets you recently registered. If an asset is not yet visible here after saving, it may still be pending approval. Check the Workflow Inbox."),
    new Paragraph({ children: [new PageBreak()] }),

    // ═══════════════════════════════════════════════════════════════════════
    // 9. AFTER SAVING — WHAT HAPPENS NEXT
    // ═══════════════════════════════════════════════════════════════════════
    h1("9. After Saving — What Happens Next"),
    p("When you click Save Asset at the end of Step 5, the asset enters the approval workflow. Here is what happens at each stage:"),
    space(),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [hCell("Stage", 5), hCell("What Happens", 35), hCell("Who Is Responsible", 25), hCell("What You Should Do", 35)] }),
        ...[
          ["1", "Asset record created with status \"Pending Approval\".", "System (automatic)", "Nothing — the asset has been submitted. You can see it in the Acquisitions List tab."],
          ["2", "A notification appears in the Workflow Inbox under \"Asset Register Approvals\".", "System (automatic)", "Inform your supervisor or the designated approver that a new asset is pending their review."],
          ["3", "Approver opens the Workflow Inbox, clicks on the pending submission, and reviews the before/after details.", "Finance Manager or designated Approver", "Be available to answer any questions the approver may have about the asset details."],
          ["4a", "Approver clicks \"Approve Submission\". The asset status changes to \"Active\". The asset is now live in the Asset Register and will be included in all reports and depreciation calculations.", "Approver", "Confirm the asset appears in Asset Records after approval."],
          ["4b", "Approver clicks \"Reject Submission\" and enters a rejection reason. The asset is not added to the register.", "Approver", "You will be notified of the rejection reason. Correct the issue and re-submit through the Acquisitions module."],
        ].map(([stage, what, who, action], i) => new TableRow({ children: [
          dc(stage, { bold: true, shade: i % 2 === 0 ? LIGHT_GREY : undefined, align: AlignmentType.CENTER }),
          dc(what, { shade: i % 2 === 0 ? LIGHT_GREY : undefined }),
          dc(who, { shade: i % 2 === 0 ? LIGHT_GREY : undefined }),
          dc(action, { shade: i % 2 === 0 ? LIGHT_GREY : undefined }),
        ]}))
      ]
    }),
    space(),
    note("SEGREGATION OF DUTIES:", "The person who registers (saves) an asset cannot be the same person who approves it. This is an internal control requirement under the MFMA. If you are both the capturer and the approver, contact your Internal Auditor."),
    new Paragraph({ children: [new PageBreak()] }),

    // ═══════════════════════════════════════════════════════════════════════
    // 10. COMMON ERRORS AND SOLUTIONS
    // ═══════════════════════════════════════════════════════════════════════
    h1("10. Common Errors and Solutions"),
    space(),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [hCell("Problem", 35), hCell("Likely Cause", 30), hCell("What to Do", 35)] }),
        ...[
          [
            "The transfer I am looking for does not appear in the SCM/GRN list.",
            "The transfer may not have been approved in the SCM system yet, or the GRN has already been registered as an asset.",
            "Check with the SCM office that the GRN is finalised. Check the Acquisitions List to see if it was already registered by a colleague."
          ],
          [
            "The Asset Category / Sub-Category drop-down is empty after selecting a Type.",
            "No categories have been configured for that asset type in the Configuration module.",
            "Contact the System Administrator to add the missing categories in the Configuration module."
          ],
          [
            "The Division drop-down is empty after selecting a Department.",
            "No divisions are configured for that department, or the department has not been linked to divisions.",
            "Either leave Division blank or contact the System Administrator to configure divisions for that department."
          ],
          [
            "The system shows a validation error: 'Description is required'.",
            "You attempted to click Next without entering a description in Step 1.",
            "Scroll up to the Description field and enter the asset description, then click Next again."
          ],
          [
            "I saved the asset but it does not appear in Asset Records.",
            "The asset is still pending approval in the Workflow Inbox.",
            "Ask the Finance Manager or designated approver to review and approve the submission in the Workflow Inbox."
          ],
          [
            "The asset was rejected by the approver.",
            "The approver found an error or missing information in the submission.",
            "Open the Workflow Inbox, find the rejected item, and read the rejection reason. Then re-register the asset through the Acquisitions module with the corrected information."
          ],
          [
            "I accidentally saved the asset with the wrong cost / date.",
            "The asset was saved before the data was verified.",
            "After approval, go to Asset Records, find the asset, and edit it. Note that financial corrections (cost, dates) require prior year adjustment transactions — contact the Finance Manager."
          ],
          [
            "The location fields are blank / no data in Town drop-down.",
            "Location reference data has not been configured in the Configuration module.",
            "Contact the System Administrator to add the required location data in Configuration > Asset Classification."
          ],
        ].map(([problem, cause, fix], i) => new TableRow({ children: [
          dc(problem, { shade: i % 2 === 0 ? LIGHT_GREY : undefined }),
          dc(cause, { shade: i % 2 === 0 ? LIGHT_GREY : undefined }),
          dc(fix, { shade: i % 2 === 0 ? LIGHT_GREY : undefined }),
        ]}))
      ]
    }),
    space(),
    h2("Contact for Assistance"),
    ref2([
      ["System / Configuration issues", "Contact your Platinum Asset Management System Administrator"],
      ["SCM / GRN data not appearing", "Contact the SCM office or Finance Department"],
      ["Approval delays", "Contact the Finance Manager or CFO"],
      ["Policy guidance (capitalisation threshold, useful life)", "Refer to the Municipality's Asset Management Policy or contact the CFO"],
    ]),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD & SAVE
// ─────────────────────────────────────────────────────────────────────────────
function buildDoc(children) {
  const hdr = new Paragraph({
    alignment: AlignmentType.LEFT,
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } },
    children: [new TextRun({ text: "Asset Management System — Acquisitions User Manual", size: 18, color: "888888", font: "Calibri" })]
  });
  const ftr = new Paragraph({
    alignment: AlignmentType.RIGHT,
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } },
    children: [
      new TextRun({ text: "Confidential — Internal Use Only     Page ", size: 18, color: "888888", font: "Calibri" }),
      new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888", font: "Calibri" })
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
      headers: { default: new Header({ children: [hdr] }) },
      footers: { default: new Footer({ children: [ftr] }) },
      children: buildChildren()
    }]
  });
}

console.log("Generating detailed Acquisitions User Manual…");
const doc = buildDoc();
const buf = await Packer.toBuffer(doc);
writeFileSync(join(__dirname, "Acquisitions_UserManual.docx"), buf);
console.log("✓  Acquisitions_UserManual.docx generated successfully.");
