import { Router } from "express";
import { db } from "@workspace/db";
import {
  reportRunsTable, scorecardsTable, scorecardKpisTable,
  kpiQuarterActualsTable, performanceCyclesTable,
  kpiQuarterTargetsTable, unitsOfMeasureTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../Middleware/auth";
import { logAudit } from "../Middleware/audit";
import { GenerateReportBody } from "@workspace/api-zod";
import XLSX from "xlsx-js-style";

const router = Router();

router.get("/reports/runs", async (req: AuthenticatedRequest, res) => {
  const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
  const reportType = req.query.reportType as string | undefined;
  let rows = await db.select().from(reportRunsTable);
  if (cycleId) rows = rows.filter(r => r.cycleId === cycleId);
  if (reportType) rows = rows.filter(r => r.reportType === reportType);
  res.json(rows);
});

router.post("/reports/generate", requirePermission("report.generate", "*"), async (req: AuthenticatedRequest, res) => {
  const parsed = GenerateReportBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  const [row] = await db.insert(reportRunsTable).values({
    cycleId: parsed.data.cycleId,
    reportType: parsed.data.reportType,
    quarter: parsed.data.quarter ?? null,
    departmentId: parsed.data.departmentId ?? null,
    scorecardType: parsed.data.scorecardType || null,
    title: parsed.data.title,
    status: "Generated",
    generatedById: req.user!.id,
    generatedAt: new Date(),
    fileFormat: "json",
    metadata: JSON.stringify({ generatedAt: new Date().toISOString() }),
  }).returning();

  await logAudit(req, "generate", "report_run", row.id, null, row as unknown as Record<string, unknown>, parsed.data.cycleId);
  res.status(201).json(row);
});

router.get("/reports/runs/:id", async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [row] = await db.select().from(reportRunsTable).where(eq(reportRunsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

type KpiRow = {
  kpi: typeof scorecardKpisTable.$inferSelect;
  targets: Map<number, string>;
  actuals: Map<number, { value: string; isAchieved: boolean | null; commentary: string | null; challengeNarrative: string | null; correctiveAction: string | null; analysisNotes: string | null; budgetImplication: string | null }>;
  uomName: string;
};

async function gatherReportData(run: typeof reportRunsTable.$inferSelect) {
  const [cycle] = await db.select().from(performanceCyclesTable).where(eq(performanceCyclesTable.id, run.cycleId));
  let scorecards = await db.select().from(scorecardsTable).where(eq(scorecardsTable.cycleId, run.cycleId));
  if (run.departmentId) {
    scorecards = scorecards.filter(s => (s as Record<string, unknown>).departmentId === run.departmentId);
  }
  if (run.scorecardType) {
    scorecards = scorecards.filter(s => (s as Record<string, unknown>).scorecardType === run.scorecardType);
  }
  const uoms = await db.select().from(unitsOfMeasureTable);
  const uomMap = new Map(uoms.map(u => [u.id, u.abbreviation || u.name]));

  const rows: KpiRow[] = [];
  for (const sc of scorecards) {
    const kpis = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.scorecardId, sc.id));
    for (const kpi of kpis) {
      const targets = await db.select().from(kpiQuarterTargetsTable).where(eq(kpiQuarterTargetsTable.kpiId, kpi.id));
      const actuals = await db.select().from(kpiQuarterActualsTable).where(eq(kpiQuarterActualsTable.kpiId, kpi.id));
      const tMap = new Map(targets.map(t => [t.quarter, t.targetValue]));
      const aMap = new Map(actuals.map(a => [a.quarter, {
        value: a.actualValue ?? "",
        isAchieved: a.isAchieved,
        commentary: a.commentary,
        challengeNarrative: a.challengeNarrative,
        correctiveAction: a.correctiveAction,
        analysisNotes: a.analysisNotes,
        budgetImplication: a.budgetImplication,
      }]));
      rows.push({ kpi, targets: tMap, actuals: aMap, uomName: uomMap.get(kpi.unitOfMeasureId ?? 0) || "" });
    }
  }
  return { cycle, rows };
}

function getAchievementStatus(target: string | undefined, actual: string | undefined, isAchieved: boolean | null | undefined): "met" | "partial" | "missed" | "none" {
  if (!actual || actual === "") return "none";
  if (isAchieved === true) return "met";
  if (!target) return "none";
  const tNum = parseFloat(target);
  const aNum = parseFloat(actual);
  if (isNaN(tNum) || isNaN(aNum)) return isAchieved === false ? "missed" : "none";
  if (aNum >= tNum) return "met";
  if (aNum >= tNum * 0.7) return "partial";
  return "missed";
}

const STATUS_COLORS = {
  met: { fill: { fgColor: { rgb: "C6EFCE" } }, font: { color: { rgb: "006100" } } },
  partial: { fill: { fgColor: { rgb: "FFEB9C" } }, font: { color: { rgb: "9C6500" } } },
  missed: { fill: { fgColor: { rgb: "FFC7CE" } }, font: { color: { rgb: "9C0006" } } },
  none: {},
};

function buildQuarterlyRows(data: KpiRow[], quarter: number) {
  return data.map(r => {
    const t = r.targets.get(quarter);
    const a = r.actuals.get(quarter);
    const status = getAchievementStatus(t, a?.value, a?.isAchieved);
    return {
      row: {
        "KPI Number": r.kpi.kpiNumber,
        "Key Performance Indicator (KPI)": r.kpi.description,
        "Baseline": r.kpi.baseline || "",
        "UOM": r.uomName,
        [`Q${quarter} Measurable Target`]: t || "",
        [`Q${quarter} Measurable Actual`]: a?.value || "",
        "Achievement": status === "met" ? "Target Met" : status === "partial" ? "Partially Met" : status === "missed" ? "Target Missed" : "",
        "Comment": a?.commentary || "",
        "Challenges": a?.challengeNarrative || "",
        "Corrective Action": a?.correctiveAction || "",
        "Annual Target": r.kpi.annualTarget,
        "Annual Budget": r.kpi.annualBudgetTarget ?? "",
        "Portfolio of Evidence": r.kpi.evidencePortfolio || r.kpi.evidenceSource || "",
      },
      status,
    };
  });
}

function buildMidYearRows(data: KpiRow[]) {
  return data.map(r => {
    const t1 = r.targets.get(1);
    const a1 = r.actuals.get(1);
    const t2 = r.targets.get(2);
    const a2 = r.actuals.get(2);
    const s1 = getAchievementStatus(t1, a1?.value, a1?.isAchieved);
    const s2 = getAchievementStatus(t2, a2?.value, a2?.isAchieved);
    const worst = s2 === "missed" || s1 === "missed" ? "missed" : s2 === "partial" || s1 === "partial" ? "partial" : s2 === "met" || s1 === "met" ? "met" : "none";
    return {
      row: {
        "KPI Number": r.kpi.kpiNumber,
        "Key Performance Indicator (KPI)": r.kpi.description,
        "Baseline": r.kpi.baseline || "",
        "UOM": r.uomName,
        "Q1 Measurable Target": t1 || "",
        "Q1 Measurable Actual": a1?.value || "",
        "Q2 Measurable Target": t2 || "",
        "Q2 Measurable Actual": a2?.value || "",
        "Achievement": worst === "met" ? "Target Met" : worst === "partial" ? "Partially Met" : worst === "missed" ? "Target Missed" : "",
        "Comment": a2?.commentary || a1?.commentary || "",
        "PMS Analysis": a2?.analysisNotes || a1?.analysisNotes || "",
        "Challenges": a2?.challengeNarrative || a1?.challengeNarrative || "",
        "Corrective Action": a2?.correctiveAction || a1?.correctiveAction || "",
        "Annual Target": r.kpi.annualTarget,
        "Annual Budget": r.kpi.annualBudgetTarget ?? "",
        "Portfolio of Evidence": r.kpi.evidencePortfolio || r.kpi.evidenceSource || "",
      },
      status: worst,
    };
  });
}

function buildAnnualRows(data: KpiRow[]) {
  return data.map(r => {
    const statuses = [1, 2, 3, 4].map(q => {
      const t = r.targets.get(q);
      const a = r.actuals.get(q);
      return getAchievementStatus(t, a?.value, a?.isAchieved);
    });
    const overall = statuses.includes("missed") ? "missed" : statuses.includes("partial") ? "partial" : statuses.some(s => s === "met") ? "met" : "none";
    const latestA = r.actuals.get(4) || r.actuals.get(3) || r.actuals.get(2) || r.actuals.get(1);
    return {
      row: {
        "KPI Number": r.kpi.kpiNumber,
        "Key Performance Indicator (KPI)": r.kpi.description,
        "Baseline": r.kpi.baseline || "",
        "UOM": r.uomName,
        "Annual Target": r.kpi.annualTarget,
        "Q1 Measurable Actual": r.actuals.get(1)?.value || "",
        "Q2 Measurable Actual": r.actuals.get(2)?.value || "",
        "Q3 Measurable Actual": r.actuals.get(3)?.value || "",
        "Q4 Measurable Actual": r.actuals.get(4)?.value || "",
        "Achievement": overall === "met" ? "Target Met" : overall === "partial" ? "Partially Met" : overall === "missed" ? "Target Missed" : "",
        "Comment": latestA?.commentary || "",
        "PMS Analysis": latestA?.analysisNotes || "",
        "Challenges": latestA?.challengeNarrative || "",
        "Corrective Action": latestA?.correctiveAction || "",
        "Annual Budget": r.kpi.annualBudgetTarget ?? "",
        "Portfolio of Evidence": r.kpi.evidencePortfolio || r.kpi.evidenceSource || "",
      },
      status: overall,
    };
  });
}

function applyExcelStyles(ws: XLSX.WorkSheet, dataRows: { status: string }[], headerRowIdx: number) {
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: headerRowIdx, c })];
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "0F2B46" } },
        alignment: { horizontal: "center", wrapText: true },
        border: {
          bottom: { style: "thin", color: { rgb: "0F2B46" } },
        },
      };
    }
  }

  const achievementCol = (() => {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: headerRowIdx, c })];
      if (cell && cell.v === "Achievement") return c;
    }
    return -1;
  })();

  const ZEBRA_FILL = { fgColor: { rgb: "F8FAFC" } };
  const thinBorder = {
    top: { style: "thin" as const, color: { rgb: "E2E8F0" } },
    bottom: { style: "thin" as const, color: { rgb: "E2E8F0" } },
    left: { style: "thin" as const, color: { rgb: "E2E8F0" } },
    right: { style: "thin" as const, color: { rgb: "E2E8F0" } },
  };

  for (let i = 0; i < dataRows.length; i++) {
    const rowIdx = headerRowIdx + 1 + i;
    const st = dataRows[i].status as keyof typeof STATUS_COLORS;
    const statusStyle = STATUS_COLORS[st];
    const hasColor = statusStyle && statusStyle.fill;

    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: rowIdx, c });
      let cell = ws[addr];
      if (!cell) {
        cell = { t: "s", v: "" };
        ws[addr] = cell;
      }

      if (hasColor) {
        cell.s = {
          fill: statusStyle.fill,
          font: statusStyle.font,
          border: thinBorder,
          alignment: { wrapText: true },
        };
      } else {
        cell.s = {
          fill: i % 2 === 1 ? ZEBRA_FILL : undefined,
          border: thinBorder,
          alignment: { wrapText: true },
        };
      }
    }

    if (achievementCol >= 0 && hasColor) {
      const achCell = ws[XLSX.utils.encode_cell({ r: rowIdx, c: achievementCol })];
      if (achCell) {
        achCell.s = {
          fill: statusStyle.fill,
          font: { ...statusStyle.font, bold: true },
          border: thinBorder,
          alignment: { horizontal: "center", wrapText: true },
        };
      }
    }
  }
}

router.get("/reports/runs/:id/export", async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const format = (req.query.format as string || "xlsx").toLowerCase();
  if (!["xlsx", "pdf", "csv"].includes(format)) {
    res.status(400).json({ error: "format must be xlsx, pdf, or csv" });
    return;
  }
  const [run] = await db.select().from(reportRunsTable).where(eq(reportRunsTable.id, id));
  if (!run) { res.status(404).json({ error: "Report not found" }); return; }
  if (run.status !== "Generated") { res.status(400).json({ error: "Report has not been generated yet" }); return; }

  const { cycle, rows: kpiData } = await gatherReportData(run);
  const safeTitle = run.title.replace(/[^a-zA-Z0-9_ -]/g, "_");

  let dataRows: { row: Record<string, unknown>; status: string }[];
  let sheetName: string;

  const rType = run.reportType.toLowerCase().replace(/[-_]/g, "");
  if (rType === "annual" || rType === "institutionalevaluation") {
    dataRows = buildAnnualRows(kpiData);
    sheetName = "Annual Performance Report";
  } else if (rType === "midyear") {
    dataRows = buildMidYearRows(kpiData);
    sheetName = "Mid-Year Performance Report";
  } else {
    dataRows = buildQuarterlyRows(kpiData, run.quarter || 1);
    sheetName = `Q${run.quarter || 1} Performance Report`;
  }

  const headerInfo = [
    [run.title],
    ["Report Type:", run.reportType],
    ["Financial Year:", cycle?.financialYearLabel || String(run.cycleId)],
  ];
  if (run.quarter) headerInfo.push(["Quarter:", `Q${run.quarter}`]);
  headerInfo.push(["Generated:", run.generatedAt ? new Date(run.generatedAt).toLocaleString() : ""]);
  headerInfo.push([]);

  if (format === "csv") {
    const csvRows = dataRows.map(d => d.row);
    const headers = Object.keys(csvRows[0] || {});
    const lines: string[] = [];
    for (const info of headerInfo) {
      lines.push(info.map(v => escapeCsvField(String(v ?? ""))).join(","));
    }
    lines.push(headers.map(escapeCsvField).join(","));
    for (const row of csvRows) {
      lines.push(headers.map(h => escapeCsvField(String(row[h] ?? ""))).join(","));
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.csv"`);
    res.send(lines.join("\n"));
    return;
  }

  if (format === "pdf") {
    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({ size: "A3", layout: "landscape", margin: 40 });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    doc.on("end", () => {
      const pdf = Buffer.concat(buffers);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.pdf"`);
      res.send(pdf);
    });

    doc.fontSize(16).font("Helvetica-Bold").text(run.title, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica").text(`Report Type: ${run.reportType}  |  Financial Year: ${cycle?.financialYearLabel || run.cycleId}${run.quarter ? `  |  Quarter: Q${run.quarter}` : ""}`, { align: "center" });
    doc.moveDown(0.5);

    const headers = Object.keys(dataRows[0]?.row || {});
    const colWidths = headers.map(h => {
      if (h.includes("KPI Number") || h === "UOM" || h === "Baseline") return 55;
      if (h.includes("Achievement")) return 65;
      if (h.includes("Target") || h.includes("Actual") || h.includes("Budget")) return 60;
      if (h.includes("Key Performance")) return 120;
      if (h.includes("Portfolio")) return 80;
      return 70;
    });
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const startX = 40;
    let y = doc.y;
    const rowHeight = 22;

    doc.fontSize(7).font("Helvetica-Bold");
    doc.rect(startX, y, tableWidth, rowHeight).fill("#0f2b46");
    let x = startX;
    headers.forEach((h, i) => {
      doc.fillColor("#ffffff").text(h, x + 2, y + 5, { width: colWidths[i] - 4, align: "left" });
      x += colWidths[i];
    });
    y += rowHeight;

    doc.font("Helvetica").fontSize(6);
    const statusFills: Record<string, string> = { met: "#c6efce", partial: "#ffeb9c", missed: "#ffc7ce" };
    const statusTextColors: Record<string, string> = { met: "#006100", partial: "#9c6500", missed: "#9c0006" };

    for (let di = 0; di < dataRows.length; di++) {
      const { row, status } = dataRows[di];
      if (y + rowHeight > doc.page.height - 40) {
        doc.addPage();
        y = 40;
        doc.fontSize(7).font("Helvetica-Bold");
        doc.rect(startX, y, tableWidth, rowHeight).fill("#0f2b46");
        let hx = startX;
        headers.forEach((h, i) => {
          doc.fillColor("#ffffff").text(h, hx + 2, y + 5, { width: colWidths[i] - 4, align: "left" });
          hx += colWidths[i];
        });
        y += rowHeight;
        doc.font("Helvetica").fontSize(6);
      }

      const bgColor = statusFills[status] || (di % 2 === 0 ? "#ffffff" : "#f8fafc");
      doc.rect(startX, y, tableWidth, rowHeight).fill(bgColor).stroke("#e2e8f0");

      x = startX;
      headers.forEach((h, i) => {
        const val = String(row[h] ?? "");
        if (h === "Achievement" && status !== "none") {
          doc.fillColor(statusTextColors[status] || "#000000");
        } else {
          doc.fillColor("#1e293b");
        }
        doc.text(val, x + 2, y + 5, { width: colWidths[i] - 4, align: "left" });
        x += colWidths[i];
      });
      y += rowHeight;
    }

    doc.moveDown(1);
    doc.fontSize(7).fillColor("#94a3b8").text("Legend:  ", startX, y + 5, { continued: true });
    doc.fillColor("#006100").text("■ Target Met  ", { continued: true });
    doc.fillColor("#9c6500").text("■ Partially Met  ", { continued: true });
    doc.fillColor("#9c0006").text("■ Target Missed");

    doc.end();
    return;
  }

  const wb = XLSX.utils.book_new();
  const wsData: (string | number | null | undefined)[][] = [];
  for (const info of headerInfo) {
    wsData.push(info as (string | number | null | undefined)[]);
  }
  const headers = Object.keys(dataRows[0]?.row || {});
  wsData.push(headers);
  for (const { row } of dataRows) {
    wsData.push(headers.map(h => row[h] as string | number | null));
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const colW = headers.map(h => {
    if (h.includes("Key Performance")) return { wch: 40 };
    if (h.includes("Comment") || h.includes("Challenges") || h.includes("Corrective") || h.includes("PMS Analysis") || h.includes("Portfolio")) return { wch: 30 };
    if (h.includes("Achievement")) return { wch: 16 };
    return { wch: 15 };
  });
  ws["!cols"] = colW;

  const headerRowIdx = headerInfo.length;
  applyExcelStyles(ws, dataRows, headerRowIdx);

  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.xlsx"`);
  res.send(Buffer.from(buf));
});

function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default router;
