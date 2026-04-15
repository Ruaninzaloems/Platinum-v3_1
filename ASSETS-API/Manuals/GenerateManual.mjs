// Usage: npm install docx@9 && node GenerateManual.mjs
// Output: PriorYearAdjustments_UserManual.docx in the same directory
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle,
  ShadingType, PageBreak, TableOfContents, StyleLevel,
  Header, Footer, PageNumber, NumberFormat
} from "docx";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const NAVY = "1E3A5F";
const GOLD = "D4A843";
const LIGHT_GREY = "F2F2F2";
const WHITE = "FFFFFF";
const BLACK = "000000";

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
      text,
      size: opts.size || 22,
      bold: opts.bold || false,
      italics: opts.italics || false,
      font: opts.font || "Calibri",
      color: opts.color || BLACK
    })]
  });
}

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22, font: "Calibri" })]
  });
}

function codePara(text) {
  return new Paragraph({
    spacing: { after: 80 },
    shading: { type: ShadingType.SOLID, color: LIGHT_GREY },
    indent: { left: 360 },
    children: [new TextRun({ text, size: 18, font: "Consolas", color: "333333" })]
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { after: 120 }, children: [] });
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
    children: [new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      children: [new TextRun({
        text: text || "",
        size: opts.size || 20,
        bold: opts.bold || false,
        font: opts.font || "Calibri",
        color: opts.color || BLACK
      })]
    })]
  });
}

function journalTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [
        headerCell("Period"), headerCell("Description"), headerCell("Account"),
        headerCell("Debit (R)"), headerCell("Credit (R)")
      ]}),
      ...rows.map((r, i) => new TableRow({ children: [
        cell(r[0], { shading: i % 2 === 1 ? LIGHT_GREY : undefined }),
        cell(r[1], { shading: i % 2 === 1 ? LIGHT_GREY : undefined }),
        cell(r[2], { shading: i % 2 === 1 ? LIGHT_GREY : undefined }),
        cell(r[3], { align: AlignmentType.RIGHT, shading: i % 2 === 1 ? LIGHT_GREY : undefined }),
        cell(r[4], { align: AlignmentType.RIGHT, shading: i % 2 === 1 ? LIGHT_GREY : undefined }),
      ]}))
    ]
  });
}

function infoTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((r, i) => new TableRow({ children: [
      cell(r[0], { bold: true, shading: i % 2 === 0 ? LIGHT_GREY : undefined }),
      cell(r[1], { shading: i % 2 === 0 ? LIGHT_GREY : undefined }),
    ]}))
  });
}

function adjustmentSection(num, title, code, description, whenToUse, whatYouEnter, formulas, sqlUpdate, journalRows, example) {
  const children = [];
  children.push(heading1(`${num}. ${title}`));
  children.push(para(`Code: ${code}`, { bold: true, color: NAVY }));
  children.push(emptyLine());

  children.push(heading2("Description"));
  children.push(para(description));

  children.push(heading2("When to Use"));
  children.push(para(whenToUse));

  children.push(heading2("What You Enter"));
  for (const item of whatYouEnter) children.push(bullet(item));

  children.push(heading2("Calculation Formulas"));
  for (const f of formulas) children.push(codePara(f));

  children.push(heading2("Database Update on Approval"));
  children.push(para("Table: Asset_Register_Items", { bold: true }));
  for (const s of sqlUpdate) children.push(codePara(s));

  children.push(heading2("GL Journal Entries"));
  children.push(para("Posted only when both Dr and Cr Plan Project Item IDs are supplied.", { italics: true }));
  children.push(emptyLine());
  children.push(journalTable(journalRows));

  children.push(heading2("Worked Example"));
  for (const e of example) children.push(para(e));

  return children;
}


const coverPage = [
  emptyLine(), emptyLine(), emptyLine(), emptyLine(), emptyLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: "PLATINUM ASSET MANAGEMENT", size: 44, bold: true, color: NAVY, font: "Calibri" })]
  }),
  emptyLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: "Prior Year Adjustments", size: 52, bold: true, color: GOLD, font: "Calibri" })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: "User Manual", size: 36, color: GOLD, font: "Calibri" })]
  }),
  emptyLine(), emptyLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: "GRAP / MFMA / mSCOA Compliant", size: 24, color: "666666", font: "Calibri" })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: `Date: ${new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}`, size: 24, color: "666666", font: "Calibri" })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: "Version 1.0", size: 24, color: "666666", font: "Calibri" })]
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

const tocPage = [
  heading1("Table of Contents"),
  emptyLine(),
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

const overviewSection = [
  heading1("Overview & Workflow"),
  para("The Prior Year Adjustments (PYA) module corrects asset register balances for prior financial periods in compliance with GRAP 3 (Accounting Policies, Changes in Estimates and Errors) and mSCOA."),
  emptyLine(),

  heading2("Financial Year Structure"),
  para("The South African municipal financial year runs from 1 July to 30 June. All calculations split depreciation adjustments across three periods:"),
  emptyLine(),
  infoTable([
    ["Prior Periods", "All financial years before the comparative year"],
    ["Comparative Period", "The immediately preceding financial year (Jul\u2013Jun)"],
    ["Current Period", "The current financial year to date"],
  ]),
  emptyLine(),

  heading2("Workflow Steps"),
  bullet("Step 1 \u2014 Select Asset: Search and select the asset requiring correction"),
  bullet("Step 2 \u2014 Adjustment Type: Choose from 11 correction types based on what needs fixing"),
  bullet("Step 3 \u2014 Input Values: Enter the corrected values and optional GL vote codes"),
  bullet("Step 4 \u2014 Preview & Submit: Review calculated journal lines and deltas, then submit"),
  bullet("Step 5 \u2014 Review Queue: Supervisor reviews Pending records, approves or rejects"),
  bullet("Step 6 \u2014 On Approval: Asset register is updated, GL entries posted (if votes supplied), transaction summary recalculated"),
  emptyLine(),

  heading2("Database Tables"),
  infoTable([
    ["Asset_PriorYearAdjustment", "Stores every adjustment record with full snapshot, inputs, deltas, status"],
    ["Asset_PriorYearAdjustment_Documents", "Supporting documents uploaded per adjustment"],
    ["Asset_Register_Items", "Live asset register \u2014 updated on approval"],
    ["Asset_Transaction_Summary", "Recalculated after approval for dashboard/reports"],
  ]),
  new Paragraph({ children: [new PageBreak()] }),
];


const sec1 = adjustmentSection(
  1, "Historical Cost Correction", "COST",
  "Correct the historical cost of an asset carried at actual cost. This is a retrospective restatement under GRAP 3 \u2014 the asset register is corrected as if the error had never occurred.",
  "The original capitalised cost recorded on the asset register was incorrect (e.g. purchase price captured wrong, VAT included/excluded in error, additional costs not capitalised).",
  ["Corrected historical cost (R)", "Effective date", "Financial year"],
  [
    "Delta Cost = New Cost \u2212 Old Cost (PurchaseAmount)",
    "Daily Dep Delta = Delta Cost / (EUL \u00d7 365)",
    "Prior Periods Acc Dep = Daily Dep Delta \u00d7 days from InserviceDate to start of comp year",
    "Comp Period Dep Charge = Daily Dep Delta \u00d7 days in comparative year",
    "Current Period Dep Charge = Daily Dep Delta \u00d7 days in current year to date",
  ],
  [
    'UPDATE "Asset_Register_Items"',
    'SET "PurchaseAmount" = <NewCostAmount>',
    'WHERE "AssetRegisterItem_ID" = <id>',
  ],
  [
    ["Prior Periods", "Asset at Cost \u2014 Correction", "Asset at Cost", "Delta Cost (+)", ""],
    ["Prior Periods", "Prior Year Surplus/Deficit", "Accumulated Surplus/Deficit", "", "Delta Cost (+)"],
    ["Prior Periods", "Accumulated Depreciation \u2014 Correction", "Accumulated Depreciation", "", "Acc Dep Delta"],
    ["Comparative", "Depreciation Charge \u2014 Correction", "Depreciation", "Comp Dep Delta", ""],
    ["Current", "Depreciation Charge \u2014 Correction", "Depreciation", "Curr Dep Delta", ""],
  ],
  [
    "Asset: Unpaved Road (ID 90737) | Current cost: R148,847.28 | EUL: 10 yrs | In-service: 2023-07-01",
    "Correction: Cost should have been R140,000.00",
    "Delta Cost = R140,000.00 \u2212 R148,847.28 = \u2212R8,847.28",
    "Daily dep delta = \u22128,847.28 / (10 \u00d7 365) = \u2212R2.42/day",
    "Prior periods (731 days to 1 Jul 2024): \u2212R1,770.58 accumulated depreciation correction",
    "Comp period (365 days 2024/2025): \u2212R883.30/yr depreciation charge correction",
    "Current period (257 days to 14 Mar 2026): \u2212R622.01 depreciation charge correction",
  ]
);

const sec2 = adjustmentSection(
  2, "Revaluation Restatement", "VALUATION",
  "Restate the valuation of an asset carried under the revaluation model. The system uses the restatement method: it grosses up the new carrying value to a new cost figure using the EUL/RUL ratio, then calculates the proportionate change to accumulated depreciation and revaluation reserve.",
  "An independent valuation has determined the asset's fair value differs from the current register value, or a prior revaluation was captured incorrectly.",
  ["New carrying value (R)", "New remaining useful life (years)", "Effective date"],
  [
    "New Cost = (New Carrying Value / New RUL) \u00d7 EUL",
    "New Acc Dep = New Cost \u2212 New Carrying Value",
    "Delta Cost = New Cost \u2212 Old CRC (or PurchaseAmount)",
    "Delta Acc Dep = New Acc Dep \u2212 Old Acc Dep",
    "Delta RR = Delta Cost \u2212 Delta Acc Dep",
    "Dep Charge Delta = New Annual Dep \u2212 Old Annual Dep (applied to comp + current)",
  ],
  [
    'UPDATE "Asset_Register_Items"',
    'SET "CurrentReplacementCostCRC" = <newCost>,',
    '    "AccumulatedDepreciationClosingBalance" = <newAccDep>,',
    '    "RevaluationReserveClosingBalance" = <newRR>,',
    '    "RemainingUsefulLife" = <NewRUL>',
    'WHERE "AssetRegisterItem_ID" = <id>',
  ],
  [
    ["Prior Periods", "Asset at Revalued Amount", "Asset at Cost/Revalued Amount", "Delta Cost (+)", "Delta Cost (\u2212)"],
    ["Prior Periods", "Accumulated Depreciation \u2014 Restatement", "Accumulated Depreciation", "Delta Acc Dep (\u2212)", "Delta Acc Dep (+)"],
    ["Prior Periods", "Revaluation Reserve", "Revaluation Reserve", "Delta RR (\u2212)", "Delta RR (+)"],
  ],
  [
    "Asset: Unpaved Road (ID 90737) | CRC: R148,847.28 | Acc Dep: R103,449.37 | RUL: 2 yrs | EUL: 10 yrs",
    "New carrying value: R50,000 | New RUL: 3 yrs",
    "New Cost = (50,000 / 3) \u00d7 10 = R166,667",
    "New Acc Dep = 166,667 \u2212 50,000 = R116,667",
    "Delta Cost = 166,667 \u2212 148,847 = +R17,820",
    "Delta Acc Dep = 116,667 \u2212 103,449 = +R13,218",
    "Delta RR = 17,820 \u2212 13,218 = +R4,602",
  ]
);

const sec3 = adjustmentSection(
  3, "Acquisition Date Correction", "DATE",
  "Correct the acquisition or in-service date when it was captured incorrectly. This recalculates accumulated depreciation from the corrected start date, distributing the depreciation difference across periods.",
  "The in-service or acquisition date was captured incorrectly, causing all depreciation to be miscalculated from the wrong start date.",
  ["Corrected acquisition/in-service date", "Effective date"],
  [
    "Day Difference = New Date \u2212 Old Date",
    "Daily Dep = Annual Dep / 365",
    "Total Dep Delta = Daily Dep \u00d7 |Day Difference| (negative if date moved later)",
    "Split proportionally across Prior / Comp / Current periods based on day ratios",
  ],
  [
    'UPDATE "Asset_Register_Items"',
    'SET "AcquisitionDate" = <NewAcquisitionDate>,',
    '    "InserviceDate" = <NewAcquisitionDate>,',
    '    "AccumulatedDepreciationClosingBalance" = <recalculated>',
    'WHERE "AssetRegisterItem_ID" = <id>',
  ],
  [
    ["Adjustment", "Acq Date Correction \u2014 Dep Correction", "Acc Dep / Dep Expense", "Dep Delta (+)", "Dep Delta (\u2212)"],
  ],
  [
    "Asset: Vehicle | Cost: R200,000 | EUL: 5 yrs | Annual Dep: R40,000",
    "Old in-service date: 2020-07-01 | Corrected date: 2022-07-01 (2 years later)",
    "Day difference: 730 days (later means less depreciation)",
    "Total dep delta: \u2212R80,000 (asset was over-depreciated for 2 years)",
    "Correction: Accumulated depreciation reduced by R80,000, split across periods",
  ]
);

const sec4 = adjustmentSection(
  4, "Residual Value Correction", "RESIDUAL",
  "Change the residual value used in the depreciation calculation. This is a change in accounting estimate under GRAP 3 \u2014 it affects future depreciation prospectively but the system retrospectively recalculates to correct the register.",
  "The residual value assigned to the asset was set incorrectly (too high or too low), causing annual depreciation charges to be miscalculated.",
  ["New residual value (R)", "Residual value effective date", "Effective date"],
  [
    "Old Annual Dep = (Cost \u2212 Old Residual) / EUL",
    "New Annual Dep = (Cost \u2212 New Residual) / EUL",
    "Delta Annual Dep = New \u2212 Old",
    "Daily Dep Delta = Delta Annual Dep / 365",
    "Split across Prior / Comp / Current using days from InserviceDate",
  ],
  [
    'UPDATE "Asset_Register_Items"',
    'SET "ResidualValue" = <NewResidualValue>,',
    '    "AccumulatedDepreciationClosingBalance" = <recalculated>',
    'WHERE "AssetRegisterItem_ID" = <id>',
  ],
  [
    ["Adjustment", "Residual Value Adj \u2014 Dep Correction", "Acc Dep / Dep Expense", "Dep Delta (+)", "Dep Delta (\u2212)"],
  ],
  [
    "Asset: Building | Cost: R148,847 | EUL: 10 yrs",
    "Old residual: R0 | New residual: R14,885 (10% of cost)",
    "Old annual dep = R148,847 / 10 = R14,885",
    "New annual dep = (R148,847 \u2212 R14,885) / 10 = R13,396",
    "Delta annual dep = R13,396 \u2212 R14,885 = \u2212R1,489/yr",
    "Correction applied over asset's life to date, split across all three periods",
  ]
);

const sec5 = adjustmentSection(
  5, "Impairment Loss (Cost Model)", "IMP_COST",
  "Recognise or adjust an impairment loss on an asset measured under the cost model. The entire impairment charge goes to the Income Statement (surplus or deficit). Future depreciation is recalculated on the reduced carrying amount.",
  "A cost-model asset has suffered an impairment event (physical damage, obsolescence, economic decline) that was not recognised or was recognised at an incorrect amount.",
  ["Impairment loss amount (R)", "Impairment effective date"],
  [
    "Delta Impairment = New Amount \u2212 Existing Acc Impairment",
    "All delta goes to Prior Periods Acc Impairment",
    "New CA = max(0, Old CA \u2212 Delta Impairment)",
    "Dep Charge Delta = (New CA / EUL) \u2212 (Old CA / EUL)  [comp + current]",
  ],
  [
    'UPDATE "Asset_Register_Items"',
    'SET "AccumulatedImpairmentClosingBalance" = <new total>',
    'WHERE "AssetRegisterItem_ID" = <id>',
  ],
  [
    ["Adjustment", "Impairment Loss \u2014 Income Statement", "Impairment Loss (IS)", "Imp Delta", ""],
    ["Adjustment", "Accumulated Impairment", "Accumulated Impairment", "", "Imp Delta"],
  ],
  [
    "Asset: Machinery | Cost: R500,000 | CA: R350,000 | EUL: 10 yrs | Existing Imp: R0",
    "New impairment recognised: R100,000",
    "Delta impairment = R100,000",
    "New CA = R350,000 \u2212 R100,000 = R250,000",
    "Old annual dep = R350,000 / 10 = R35,000",
    "New annual dep = R250,000 / 10 = R25,000",
    "Dep charge delta = \u2212R10,000/yr (applied to comp + current periods)",
  ]
);

const sec6 = adjustmentSection(
  6, "Impairment Loss (Revaluation Model)", "IMP_REVAL",
  "Recognise or adjust an impairment loss on a revalued asset. Per GRAP 21, the impairment first absorbs any existing Revaluation Reserve before the remainder is charged to the Income Statement.",
  "A revalued asset has suffered impairment. The revaluation surplus (Revaluation Reserve) must be consumed first before any charge hits the surplus or deficit.",
  ["Impairment loss amount (R)", "Effective date"],
  [
    "Delta Impairment = New Amount \u2212 Existing Acc Impairment",
    "From RR = min(Delta Impairment, Existing Revaluation Reserve)",
    "From IS = max(0, Delta Impairment \u2212 From RR)",
    "RR reduced by From RR; IS charged with From IS",
  ],
  [
    'UPDATE "Asset_Register_Items"',
    'SET "AccumulatedImpairmentClosingBalance" = <new total>,',
    '    "RevaluationReserveClosingBalance" = <old RR \u2212 From RR>',
    'WHERE "AssetRegisterItem_ID" = <id>',
  ],
  [
    ["Adjustment", "Impairment Loss \u2014 Income Statement", "Impairment Loss (IS)", "From IS", ""],
    ["Adjustment", "Impairment Loss \u2014 Revaluation Reserve", "Revaluation Reserve", "From RR", ""],
    ["Adjustment", "Accumulated Impairment", "Accumulated Impairment", "", "Total Imp"],
  ],
  [
    "Asset: Unpaved Road (ID 90737) | CA: R45,398 | RR: R40,004 | Existing Imp: R0",
    "New impairment recognised: R50,000",
    "From RR = min(R50,000, R40,004) = R40,004 (absorbed from revaluation reserve)",
    "From IS = max(0, R50,000 \u2212 R40,004) = R9,996 (charged to income statement)",
    "Journal: Dr Impairment Loss (IS) R9,996 | Dr Revaluation Reserve R40,004 | Cr Acc Impairment R50,000",
  ]
);

const sec7 = adjustmentSection(
  7, "Impairment Reversal (Cost Model)", "IMPREV_COST",
  "Reverse a previously recognised impairment loss on a cost-model asset. GRAP caps the reversal at the lower of: (a) the original impairment amount, or (b) the carrying amount the asset would have had without impairment.",
  "The conditions causing a previous impairment no longer exist, or the impairment was over-recognised. The carrying amount needs to be restored up to the GRAP-permitted ceiling.",
  ["Reversal amount requested (R) \u2014 system caps automatically"],
  [
    "CA as if no impairment = Cost \u2212 (Daily Dep \u00d7 Days since acquisition) \u2212 Residual",
    "GRAP Cap = CA as if no impairment \u2212 Current CA",
    "Actual Reversal = min(Requested, GRAP Cap, Existing Acc Impairment)",
    "Dep Charge Delta = Actual Reversal / EUL (negative, applied to comp + current)",
  ],
  [
    'UPDATE "Asset_Register_Items"',
    'SET "AccumulatedImpairmentClosingBalance" = <old \u2212 actual reversal>',
    'WHERE "AssetRegisterItem_ID" = <id>',
  ],
  [
    ["Adjustment", "Accumulated Impairment", "Accumulated Impairment", "Actual Reversal", ""],
    ["Adjustment", "Impairment Reversal \u2014 Income Statement", "Impairment Loss (IS)", "", "Actual Reversal"],
  ],
  [
    "Asset: Equipment | Cost: R300,000 | CA: R100,000 | Acc Imp: R80,000 | EUL: 10 yrs",
    "Requested reversal: R80,000",
    "CA as if no impairment (calculated): R150,000",
    "GRAP cap = R150,000 \u2212 R100,000 = R50,000",
    "Actual reversal = min(R80,000, R50,000, R80,000) = R50,000 (capped by GRAP)",
    "New Acc Impairment = R80,000 \u2212 R50,000 = R30,000",
    "Journal: Dr Acc Impairment R50,000 | Cr Impairment Reversal (IS) R50,000",
  ]
);

const sec8 = adjustmentSection(
  8, "Impairment Reversal (Revaluation Model)", "IMPREV_REVAL",
  "Reverse a previously recognised impairment on a revalued asset. Per GRAP, the reversal credit is routed back to the Revaluation Reserve (up to the original impairment that reduced it) rather than the Income Statement.",
  "Same as IMPREV_COST, but for revalued assets. The reversal credit goes to Revaluation Reserve first.",
  ["Reversal amount requested (R) \u2014 system caps automatically"],
  [
    "Same GRAP cap calculation as IMPREV_COST",
    "To RR = min(Actual Reversal, Original Impairment from RR)",
    "To IS = Actual Reversal \u2212 To RR",
  ],
  [
    'UPDATE "Asset_Register_Items"',
    'SET "AccumulatedImpairmentClosingBalance" = <old \u2212 actual reversal>,',
    '    "RevaluationReserveClosingBalance" = <old RR + To RR>',
    'WHERE "AssetRegisterItem_ID" = <id>',
  ],
  [
    ["Adjustment", "Accumulated Impairment", "Accumulated Impairment", "Actual Reversal", ""],
    ["Adjustment", "Reversal \u2014 Revaluation Reserve", "Revaluation Reserve", "", "To RR"],
    ["Adjustment", "Reversal \u2014 Income Statement", "Impairment Loss (IS)", "", "To IS"],
  ],
  [
    "Asset: Building | CA: R200,000 | Acc Imp: R60,000 | RR: R10,000 | EUL: 20 yrs",
    "Requested reversal: R60,000 | GRAP cap calculated: R45,000",
    "Actual reversal = R45,000",
    "To RR = min(R45,000, R60,000) = R45,000 (fully to Revaluation Reserve)",
    "To IS = R0",
    "Journal: Dr Acc Impairment R45,000 | Cr Revaluation Reserve R45,000",
  ]
);

const sec9 = adjustmentSection(
  9, "Disposal (Cost Model)", "DISP_COST",
  "Record the prior-period disposal of an asset measured at cost that was not removed from the asset register at the time of disposal. All asset balances (cost, accumulated depreciation, accumulated impairment) are derecognised and any gain or loss on disposal is calculated.",
  "An asset was sold, scrapped, or transferred in a prior period but was never removed from the register.",
  ["Disposal date", "Disposal proceeds (R)", "Disposal reason"],
  [
    "Gain/Loss = Proceeds \u2212 Carrying Amount",
    "All balances zeroed: Cost, Acc Dep, Acc Imp",
  ],
  [
    'UPDATE "Asset_Register_Items"',
    'SET "PurchaseAmount" = 0,',
    '    "AccumulatedDepreciationClosingBalance" = 0,',
    '    "AccumulatedImpairmentClosingBalance" = 0,',
    '    "IsDisposed" = true',
    'WHERE "AssetRegisterItem_ID" = <id>',
  ],
  [
    ["Disposal", "Proceeds Received", "Bank / Receivable", "Proceeds", ""],
    ["Disposal", "Remove Accumulated Depreciation", "Accumulated Depreciation", "Acc Dep", ""],
    ["Disposal", "Remove Accumulated Impairment", "Accumulated Impairment", "Acc Imp", ""],
    ["Disposal", "Remove Asset Cost", "Asset at Cost", "", "Cost"],
    ["Disposal", "Gain on Disposal (if proceeds > CA)", "Gain on Disposal", "", "Gain"],
    ["Disposal", "Loss on Disposal (if proceeds < CA)", "Loss on Disposal", "Loss", ""],
  ],
  [
    "Asset: Laptop | Cost: R15,000 | Acc Dep: R12,000 | Acc Imp: R0 | CA: R3,000",
    "Sold for R2,000 in prior year but never removed from register",
    "Gain/Loss = R2,000 \u2212 R3,000 = \u2212R1,000 (Loss)",
    "Journal: Dr Bank R2,000 | Dr Acc Dep R12,000 | Cr Asset Cost R15,000 | Dr Loss R1,000",
  ]
);

const sec10 = adjustmentSection(
  10, "Disposal (Revaluation Model)", "DISP_REVAL",
  "Record the prior-period disposal of a revalued asset. Same as DISP_COST but additionally derecognises the Revaluation Reserve balance, transferring it to Accumulated Surplus/Deficit on disposal.",
  "A revalued asset was disposed of in a prior period but remained on the register.",
  ["Disposal date", "Disposal proceeds (R)", "Disposal reason"],
  [
    "Same as DISP_COST plus:",
    "RR balance is also zeroed and transferred",
    "Cost uses CRC (Current Replacement Cost) if available, otherwise PurchaseAmount",
  ],
  [
    'UPDATE "Asset_Register_Items"',
    'SET "CurrentReplacementCostCRC" = 0,',
    '    "AccumulatedDepreciationClosingBalance" = 0,',
    '    "AccumulatedImpairmentClosingBalance" = 0,',
    '    "RevaluationReserveClosingBalance" = 0,',
    '    "IsDisposed" = true',
    'WHERE "AssetRegisterItem_ID" = <id>',
  ],
  [
    ["Disposal", "Proceeds Received", "Bank / Receivable", "Proceeds", ""],
    ["Disposal", "Remove Accumulated Depreciation", "Accumulated Depreciation", "Acc Dep", ""],
    ["Disposal", "Remove Accumulated Impairment", "Accumulated Impairment", "Acc Imp", ""],
    ["Disposal", "Remove Asset Cost", "Asset at Cost/Revalued", "", "Cost (CRC)"],
    ["Disposal", "Transfer Revaluation Reserve", "Revaluation Reserve", "RR Balance", ""],
    ["Disposal", "Gain/Loss on Disposal", "Gain or Loss", "Loss", "Gain"],
  ],
  [
    "Asset: Infrastructure | CRC: R500,000 | Acc Dep: R300,000 | RR: R80,000 | CA: R200,000",
    "Disposed for R220,000 in prior year",
    "Gain = R220,000 \u2212 R200,000 = R20,000",
    "Journal: Dr Bank R220,000 | Dr Acc Dep R300,000 | Dr RR R80,000 | Cr Asset Cost R500,000 | Cr Gain R20,000",
  ]
);

const sec11 = adjustmentSection(
  11, "Deemed Cost \u2014 New Asset Recognition", "DEEMED_COST",
  "Recognise a previously unrecognised asset using a deemed cost as permitted by GRAP 17 transitional provisions. This is used when an asset was omitted from the register entirely and needs to be capitalised for the first time.",
  "An asset exists physically but was never captured on the asset register. It needs initial recognition using a deemed cost (fair value or depreciated replacement cost at date of recognition).",
  ["Deemed cost (R)", "Estimated useful life (years)", "In-service/acquisition date", "Residual value", "Dr/Cr GL vote codes"],
  [
    "No complex calculation \u2014 the deemed cost is recorded directly as the opening balance",
    "System creates a single opening balance journal entry",
  ],
  [
    'INSERT or UPDATE "Asset_Register_Items"',
    'SET "PurchaseAmount" = <DeemedCost>',
    '-- Asset is created/updated with initial values',
  ],
  [
    ["Opening Balance", "Deemed Cost \u2014 new asset recognition", "Asset Account", "Deemed Cost", ""],
  ],
  [
    "New asset discovered: Borehole Pump | Not on register",
    "Deemed cost established by valuer: R85,000 | EUL: 15 yrs | Residual: R5,000",
    "Journal: Dr Asset Account R85,000",
    "Future depreciation: (R85,000 \u2212 R5,000) / 15 = R5,333/yr from recognition date",
  ]
);


const rulesSection = [
  new Paragraph({ children: [new PageBreak()] }),
  heading1("Key Rules & Warnings"),
  emptyLine(),

  heading2("GL Vote Codes"),
  para("General Ledger journal entries are only posted when BOTH a Debit Plan Project Item ID and a Credit Plan Project Item ID are supplied during capture (Step 3). If either field is blank, the asset register is still updated on approval but no GL journal is created."),
  para("The system looks up mSCOA vote codes from the PlanProjectItems table and creates debit/credit lines in the transaction ledger at the financial period determined by the effective date."),
  emptyLine(),

  heading2("System Warnings"),
  infoTable([
    ["Residual Value Warning", "Asset has a residual value > R1 \u2014 verify depreciation calculation assumptions"],
    ["Impairment Warning", "Existing accumulated impairment exists \u2014 check interaction with reversal cap (GRAP ceiling)"],
    ["GRAP Cap (IMPREV types)", "System automatically limits impairment reversal; preview shows the actual capped amount"],
  ]),
  emptyLine(),

  heading2("Status Transitions"),
  bullet("Pending \u2192 Approved: Asset register updated, GL posted (if votes), transaction summary recalculated"),
  bullet("Pending \u2192 Rejected: No changes to asset register; rejection reason recorded"),
  bullet("Only Pending records can be approved or rejected"),
  bullet("Approved/Rejected records are read-only and cannot be changed"),
  emptyLine(),

  heading2("Period Split Logic"),
  para("The system automatically splits depreciation adjustments across three periods based on the asset's in-service date:"),
  bullet("Prior Periods: Days from in-service date to start of comparative financial year (1 July)"),
  bullet("Comparative Period: Days within the immediately preceding financial year"),
  bullet("Current Period: Days from 1 July of the current year to today (or effective date)"),
  para("This ensures GRAP 3 retrospective restatement is correctly reflected in all affected financial years."),
  emptyLine(),

  heading2("Document Upload"),
  para("Supporting documents (valuations, board resolutions, evidence of disposal) can be uploaded to each adjustment record. Documents are stored on the server and linked to the adjustment for audit trail purposes."),
  emptyLine(),

  heading2("Export"),
  para("Each adjustment's journal lines and period split summary can be exported to an Excel spreadsheet (.xlsx) for external review or inclusion in working papers."),
];


const doc = new Document({
  creator: "Platinum Asset Management",
  title: "Prior Year Adjustments User Manual",
  description: "GRAP/MFMA/mSCOA compliant PYA user manual",
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22 }
      }
    }
  },
  features: { updateFields: true },
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "Platinum Asset Management \u2014 PYA User Manual", size: 16, color: "999999", font: "Calibri", italics: true })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Platinum Asset Management \u2014 Page ", size: 16, color: "999999" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "999999" }),
          ]
        })]
      })
    },
    children: [
      ...coverPage,
      ...tocPage,
      ...overviewSection,
      ...sec1, new Paragraph({ children: [new PageBreak()] }),
      ...sec2, new Paragraph({ children: [new PageBreak()] }),
      ...sec3, new Paragraph({ children: [new PageBreak()] }),
      ...sec4, new Paragraph({ children: [new PageBreak()] }),
      ...sec5, new Paragraph({ children: [new PageBreak()] }),
      ...sec6, new Paragraph({ children: [new PageBreak()] }),
      ...sec7, new Paragraph({ children: [new PageBreak()] }),
      ...sec8, new Paragraph({ children: [new PageBreak()] }),
      ...sec9, new Paragraph({ children: [new PageBreak()] }),
      ...sec10, new Paragraph({ children: [new PageBreak()] }),
      ...sec11,
      ...rulesSection,
    ]
  }]
});

const buffer = await Packer.toBuffer(doc);
const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "PriorYearAdjustments_UserManual.docx");
writeFileSync(outPath, buffer);
console.log(`Written ${buffer.length} bytes to ${outPath}`);
