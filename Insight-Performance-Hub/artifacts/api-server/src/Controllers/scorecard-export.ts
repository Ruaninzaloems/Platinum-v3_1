import { Router } from "express";
import { db } from "@workspace/db";
import {
  scorecardsTable, scorecardKpisTable, kpiQuarterTargetsTable,
  sdbipFieldConfigsTable, unitsOfMeasureTable, usersTable, performanceCyclesTable,
  sdbipRevisionLogsTable,
} from "@workspace/db/schema";
import { eq, asc, desc, inArray, and } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../Middleware/auth";
import XLSX from "xlsx-js-style";

const router = Router();

type Col = { key: string; label: string; wide?: boolean };

const PRIMARY_COL_LABELS: Record<string, string> = {
  kpiNumber: "KPI No",
  description: "KPI Indicator / Description",
  idpReference: "IDP Reference",
  strategicObjective: "Strategic Objective",
  programme: "Programme",
  baseline: "Baseline",
  annualTarget: "Annual Target",
  weighting: "Weighting (%)",
  unitOfMeasureId: "Unit of Measure",
  responsiblePostId: "Responsible Person",
  custodianPostId: "Custodian",
  evidenceSource: "POE Source",
  evidencePortfolio: "Portfolio of Evidence",
  fundingSource: "Funding Source",
  budgetDescription: "Budget Description",
  annualBudgetTarget: "Annual Budget (R)",
  isCumulative: "Cumulative",
};

async function buildExportData(scorecardId: number) {
  const [scorecard] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, scorecardId));
  if (!scorecard) return null;
  const [cycle] = await db.select().from(performanceCyclesTable).where(eq(performanceCyclesTable.id, scorecard.cycleId));
  const kpis = await db.select().from(scorecardKpisTable)
    .where(eq(scorecardKpisTable.scorecardId, scorecardId))
    .orderBy(asc(scorecardKpisTable.sortOrder), asc(scorecardKpisTable.id));
  const fieldConfig = await db.select().from(sdbipFieldConfigsTable)
    .where(eq(sdbipFieldConfigsTable.sdbipType, "original"))
    .orderBy(asc(sdbipFieldConfigsTable.sortOrder));
  const uoms = await db.select().from(unitsOfMeasureTable);
  const users = await db.select().from(usersTable);
  const uomMap = new Map(uoms.map(u => [u.id, u.name]));
  const userMap = new Map(users.map(u => [u.id, u.displayName]));

  const included = fieldConfig.filter(f => f.isIncluded);
  const primaryCols: Col[] = included
    .filter(f => f.fieldKind === "primary" && PRIMARY_COL_LABELS[f.fieldKey])
    .map(f => ({ key: f.fieldKey, label: f.fieldLabel || PRIMARY_COL_LABELS[f.fieldKey], wide: f.fieldKey === "description" }));
  const customCols: Col[] = included
    .filter(f => f.fieldKind === "custom")
    .map(f => ({ key: `custom:${f.fieldKey}`, label: f.fieldLabel }));

  const columns: Col[] = [
    ...primaryCols,
    ...customCols,
    { key: "status", label: "Status" },
  ];

  const kpiIds = kpis.map(k => k.id);
  const allTargets = kpiIds.length > 0
    ? await db.select().from(kpiQuarterTargetsTable).where(inArray(kpiQuarterTargetsTable.kpiId, kpiIds))
    : [];
  const targetsByKpi = new Map<number, Map<number, string | null>>();
  for (const t of allTargets) {
    let m = targetsByKpi.get(t.kpiId);
    if (!m) { m = new Map(); targetsByKpi.set(t.kpiId, m); }
    m.set(t.quarter, t.targetValue);
  }

  const rows: Record<string, string>[] = [];
  for (const kpi of kpis) {
    const tMap = targetsByKpi.get(kpi.id) ?? new Map<number, string | null>();
    const row: Record<string, string> = {};
    for (const col of columns) {
      let v: unknown;
      if (col.key.startsWith("custom:")) {
        v = kpi.customFields?.[col.key.slice(7)];
        if (typeof v === "boolean") v = v ? "Yes" : "No";
      } else if (col.key.startsWith("q") && col.key.length === 2) {
        v = tMap.get(Number(col.key[1]));
      } else if (col.key === "unitOfMeasureId") {
        v = kpi.unitOfMeasureId ? uomMap.get(kpi.unitOfMeasureId) : "";
      } else if (col.key === "responsiblePostId") {
        v = kpi.responsiblePostId ? userMap.get(kpi.responsiblePostId) : "";
      } else if (col.key === "custodianPostId") {
        v = kpi.custodianPostId ? userMap.get(kpi.custodianPostId) : "";
      } else if (col.key === "isCumulative") {
        v = kpi.isCumulative ? "Yes" : "No";
      } else {
        v = (kpi as unknown as Record<string, unknown>)[col.key];
      }
      row[col.key] = v === null || v === undefined ? "" : String(v);
    }
    rows.push(row);
  }
  return { scorecard, cycle, columns, rows };
}


// ── Shared tabular export writers (Excel / PDF / Word) ──────────────────────

function sendXlsxExport(res: import("express").Response, safeName: string, title: string,
  subtitle: string, columns: Col[], rows: Record<string, string>[], sheetName: string) {
  const wb = XLSX.utils.book_new();
  const wsData: (string | null)[][] = [
    [title],
    [subtitle],
    [],
    columns.map(c => c.label),
    ...rows.map(r => columns.map(c => r[c.key])),
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = columns.map(c => {
    if (c.wide) return { wch: 45 };
    if (c.label.length > 14) return { wch: 22 };
    return { wch: 14 };
  });
  const headerRowIdx = 3;
  for (let c = 0; c < columns.length; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: headerRowIdx, c })];
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "0F2B46" } },
        alignment: { horizontal: "center", wrapText: true },
      };
    }
  }
  for (let i = 0; i < rows.length; i++) {
    for (let c = 0; c < columns.length; c++) {
      const addr = XLSX.utils.encode_cell({ r: headerRowIdx + 1 + i, c });
      const cell = ws[addr] || (ws[addr] = { t: "s", v: "" });
      cell.s = {
        fill: i % 2 === 1 ? { fgColor: { rgb: "F8FAFC" } } : undefined,
        border: {
          top: { style: "thin", color: { rgb: "E2E8F0" } },
          bottom: { style: "thin", color: { rgb: "E2E8F0" } },
          left: { style: "thin", color: { rgb: "E2E8F0" } },
          right: { style: "thin", color: { rgb: "E2E8F0" } },
        },
        alignment: { wrapText: true, vertical: "top" },
      };
    }
  }
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}.xlsx"`);
  res.send(Buffer.from(buf));
}

async function sendPdfExport(res: import("express").Response, safeName: string, title: string,
  subtitle: string, columns: Col[], rows: Record<string, string>[]) {
  const PDFDocument = (await import("pdfkit")).default;
  const doc = new PDFDocument({ size: "A3", layout: "landscape", margin: 40 });
  const buffers: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => buffers.push(chunk));
  doc.on("end", () => {
    const pdf = Buffer.concat(buffers);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
    res.send(pdf);
  });

  doc.fontSize(16).font("Helvetica-Bold").text(title, { align: "center" });
  doc.moveDown(0.2);
  doc.fontSize(9).font("Helvetica").text(subtitle, { align: "center" });
  doc.moveDown(0.5);

  const pageWidth = doc.page.width - 80;
  const weights = columns.map(c => (c.wide ? 3 : c.label.length > 14 ? 1.4 : 1));
  const totalW = weights.reduce((a, b) => a + b, 0);
  const colWidths = weights.map(w => (w / totalW) * pageWidth);
  const startX = 40;
  const minRowHeight = 18;
  let y = doc.y;

  const measureRowHeight = (values: string[], fontName: string, fontSize: number) => {
    doc.font(fontName).fontSize(fontSize);
    let h = 0;
    values.forEach((v, i) => {
      const th = doc.heightOfString(v || " ", { width: colWidths[i] - 4 });
      if (th > h) h = th;
    });
    return Math.max(minRowHeight, h + 8);
  };

  const drawHeader = () => {
    const h = measureRowHeight(columns.map(c => c.label), "Helvetica-Bold", 6.5);
    doc.rect(startX, y, pageWidth, h).fill("#0f2b46");
    doc.font("Helvetica-Bold").fontSize(6.5);
    let x = startX;
    columns.forEach((c, i) => {
      doc.fillColor("#ffffff").text(c.label, x + 2, y + 4, { width: colWidths[i] - 4 });
      x += colWidths[i];
    });
    y += h;
    doc.font("Helvetica").fontSize(6);
  };
  drawHeader();

  rows.forEach((r, di) => {
    const rowHeight = measureRowHeight(columns.map(c => r[c.key] || ""), "Helvetica", 6);
    if (y + rowHeight > doc.page.height - 40) {
      doc.addPage();
      y = 40;
      drawHeader();
    }
    doc.rect(startX, y, pageWidth, rowHeight).fill(di % 2 === 0 ? "#ffffff" : "#f8fafc").stroke("#e2e8f0");
    doc.font("Helvetica").fontSize(6);
    let x = startX;
    columns.forEach((c, i) => {
      doc.fillColor("#1e293b").text(r[c.key] || "", x + 2, y + 4, { width: colWidths[i] - 4 });
      x += colWidths[i];
    });
    y += rowHeight;
  });
  doc.end();
}

async function sendDocxExport(res: import("express").Response, safeName: string, title: string,
  subtitle: string, columns: Col[], rows: Record<string, string>[]) {
  const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, HeadingLevel } = await import("docx");
  const headerRow = new TableRow({
    tableHeader: true,
    children: columns.map(c => new TableCell({
      shading: { fill: "0F2B46" },
      children: [new Paragraph({ children: [new TextRun({ text: c.label, bold: true, color: "FFFFFF", size: 14 })] })],
    })),
  });
  const bodyRows = rows.map((r, i) => new TableRow({
    children: columns.map(c => new TableCell({
      shading: i % 2 === 1 ? { fill: "F8FAFC" } : undefined,
      children: [new Paragraph({ children: [new TextRun({ text: r[c.key] || "", size: 14 })] })],
    })),
  }));
  const docx = new Document({
    sections: [{
      properties: { page: { size: { orientation: "landscape" as never } } },
      children: [
        new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, children: [new TextRun({ text: title })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: subtitle, size: 18, color: "64748B" })] }),
        new Paragraph({ text: "" }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...bodyRows] }),
      ],
    }],
  });
  const buf = await Packer.toBuffer(docx);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}.docx"`);
  res.send(Buffer.from(buf));
}

router.get("/scorecards/:id/export", requirePermission("scorecard.view", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const format = String(req.query.format || "xlsx").toLowerCase();
  if (!["xlsx", "pdf", "docx"].includes(format)) {
    res.status(400).json({ error: "format must be xlsx, pdf, or docx" });
    return;
  }
  const data = await buildExportData(id);
  if (!data) { res.status(404).json({ error: "Scorecard not found" }); return; }
  const { scorecard, cycle, columns, rows } = data;
  const safeName = scorecard.name.replace(/[^a-zA-Z0-9_ -]/g, "_");
  const subtitle = `${cycle?.financialYearLabel || ""}  |  Type: ${scorecard.scorecardType}  |  Status: ${scorecard.status}  |  ${rows.length} KPIs`;

  if (format === "xlsx") { sendXlsxExport(res, safeName, scorecard.name, subtitle, columns, rows, "SDBIP"); return; }
  if (format === "pdf") { await sendPdfExport(res, safeName, scorecard.name, subtitle, columns, rows); return; }
  await sendDocxExport(res, safeName, scorecard.name, subtitle, columns, rows);
});

// ── Revision audit trail export (14-column table shown on the capture page) ──

const KPI_CHANGE_TYPES = ["kpi_added", "kpi_deleted", "target_revised", "annual_target_revised", "kpi_updated"];

function fmtDateTime(d: Date): string {
  return d.toLocaleString("en-ZA", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC",
  });
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

router.get("/scorecards/:id/revision-logs/export", requirePermission("scorecard.view", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const format = String(req.query.format || "xlsx").toLowerCase();
  if (!["xlsx", "pdf", "docx"].includes(format)) {
    res.status(400).json({ error: "format must be xlsx, pdf, or docx" });
    return;
  }
  const [scorecard] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, id));
  if (!scorecard) { res.status(404).json({ error: "Scorecard not found" }); return; }

  const [cycle] = await db.select().from(performanceCyclesTable).where(eq(performanceCyclesTable.id, scorecard.cycleId));
  const logs = await db.select().from(sdbipRevisionLogsTable)
    .where(eq(sdbipRevisionLogsTable.scorecardId, id))
    .orderBy(desc(sdbipRevisionLogsTable.createdAt), desc(sdbipRevisionLogsTable.id));
  const kpis = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.scorecardId, id));
  const kpiById = new Map(kpis.map(k => [k.id, k]));

  // Sequential revision number among revised siblings of the same parent SDBIP.
  let revisionNo = 1;
  if (scorecard.scorecardType === "revised" && scorecard.parentScorecardId) {
    const siblings = await db.select({ id: scorecardsTable.id }).from(scorecardsTable)
      .where(and(
        eq(scorecardsTable.scorecardType, "revised"),
        eq(scorecardsTable.parentScorecardId, scorecard.parentScorecardId),
      ))
      .orderBy(asc(scorecardsTable.id));
    const idx = siblings.findIndex(s => s.id === id);
    if (idx >= 0) revisionNo = idx + 1;
  }

  const submittedBy = logs.find(l => l.revisionType === "revision_submitted")?.userName ?? "";
  let approvedBy = "";
  if (scorecard.approvedById) {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, scorecard.approvedById));
    approvedBy = u?.displayName ?? "";
  }
  if (!approvedBy) approvedBy = logs.find(l => l.revisionType === "revision_approved")?.userName ?? "";
  const approvalDate = scorecard.approvedAt ? fmtDate(scorecard.approvedAt) : "—";
  const status = scorecard.status === "Submitted" || scorecard.status === "Reviewed"
    ? "Pending Approval"
    : scorecard.status === "Returned" ? "Rejected" : scorecard.status;

  const columns: Col[] = [
    { key: "revisionNo", label: "Revision No." },
    { key: "kpiRef", label: "KPI Ref No." },
    { key: "kpiDesc", label: "KPI Description", wide: true },
    { key: "field", label: "Field Changed" },
    { key: "oldValue", label: "Previous Value" },
    { key: "newValue", label: "New Value" },
    { key: "changeType", label: "Change Type" },
    { key: "reason", label: "Reason for Change" },
    { key: "changedBy", label: "Changed By" },
    { key: "changedAt", label: "Changed Date & Time" },
    { key: "submittedBy", label: "Submitted By" },
    { key: "approvedBy", label: "Approved By" },
    { key: "approvalDate", label: "Approval Date" },
    { key: "status", label: "Status" },
  ];

  const rows = logs
    .filter(l => KPI_CHANGE_TYPES.includes(l.revisionType))
    .map(l => {
      const kpi = l.kpiId != null ? kpiById.get(l.kpiId) : undefined;
      const added = l.revisionType === "kpi_added";
      const deleted = l.revisionType === "kpi_deleted";
      return {
        revisionNo: `Rev ${revisionNo}`,
        kpiRef: kpi ? String(kpi.kpiNumber ?? kpi.id) : "—",
        kpiDesc: kpi?.description ?? (added || deleted ? (l.newValue ?? l.oldValue ?? "—") : "—"),
        field: l.fieldName ?? (added ? "New KPI" : deleted ? "KPI removed" : "—"),
        oldValue: added ? "—" : (l.oldValue ?? "—"),
        newValue: deleted ? "—" : (l.newValue ?? "—"),
        changeType: added ? "Added" : deleted ? "Deleted" : "Modified",
        reason: l.revisionReason ?? "—",
        changedBy: l.userName,
        changedAt: fmtDateTime(l.createdAt),
        submittedBy: submittedBy || "—",
        approvedBy: approvedBy || "—",
        approvalDate,
        status,
      } as Record<string, string>;
    });

  const title = `${scorecard.name} — Revision Audit Trail`;
  const safeName = `${scorecard.name} Revision Audit Trail`.replace(/[^a-zA-Z0-9_ -]/g, "_");
  const subtitle = `${cycle?.financialYearLabel || ""}  |  Rev ${revisionNo}  |  Status: ${status}  |  ${rows.length} change(s)`;

  if (format === "xlsx") { sendXlsxExport(res, safeName, title, subtitle, columns, rows, "Revision Audit Trail"); return; }
  if (format === "pdf") { await sendPdfExport(res, safeName, title, subtitle, columns, rows); return; }
  await sendDocxExport(res, safeName, title, subtitle, columns, rows);
});

export default router;
