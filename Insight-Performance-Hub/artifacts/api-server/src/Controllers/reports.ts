import { Router } from "express";
import { db } from "@workspace/db";
import {
  reportRunsTable, kpiQuarterActualsTable, performanceCyclesTable,
  kpiQuarterTargetsTable, unitsOfMeasureTable, sdbipFieldConfigsTable, usersTable,
} from "@workspace/db/schema";
import { resolveEffectiveKpiSet, type Kpi } from "../Helpers/effective-kpis";
import { eq, inArray } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../Middleware/auth";
import { logAudit } from "../Middleware/audit";
import { GenerateReportBody } from "@workspace/api-zod";
import XLSX from "xlsx-js-style";

const router = Router();

// SDBIP plan reports (sdbip / revised-sdbip / departmental-sdbip) are also
// generated from this endpoint; widen the accepted report types accordingly.
const ALLOWED_REPORT_TYPES = new Set([
  "sdbip", "revised-sdbip", "departmental-sdbip",
  "quarterly", "mid-year", "annual", "institutional-evaluation",
]);
const GenerateReportBodyExtended = GenerateReportBody.omit({ reportType: true });

router.get("/reports/runs", async (req: AuthenticatedRequest, res) => {
  const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
  const reportType = req.query.reportType as string | undefined;
  let rows = await db.select().from(reportRunsTable);
  if (cycleId) rows = rows.filter(r => r.cycleId === cycleId);
  if (reportType) rows = rows.filter(r => r.reportType === reportType);
  res.json(rows);
});

router.post("/reports/generate", requirePermission("report.generate", "*"), async (req: AuthenticatedRequest, res) => {
  const parsed = GenerateReportBodyExtended.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const reportType = String((req.body as Record<string, unknown>)?.reportType ?? "");
  if (!ALLOWED_REPORT_TYPES.has(reportType)) { res.status(400).json({ error: "Invalid reportType" }); return; }

  const [row] = await db.insert(reportRunsTable).values({
    cycleId: parsed.data.cycleId,
    reportType,
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

/** Wizard field configs drive report column headings + order. */
const REPORT_TO_SDBIP_TYPE: Record<string, string> = {
  "sdbip": "original",
  "revised-sdbip": "revised",
  "departmental-sdbip": "departmental",
  "quarterly": "quarterly",
  "mid-year": "midyear",
  "annual": "annual",
};

async function getReportFieldConfig(reportType: string) {
  const sdbipType = REPORT_TO_SDBIP_TYPE[reportType] ?? "original";
  const fields = await db.select().from(sdbipFieldConfigsTable)
    .where(eq(sdbipFieldConfigsTable.sdbipType, sdbipType));
  return fields
    .filter(f => f.isIncluded)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map(f => ({ fieldKind: f.fieldKind, fieldKey: f.fieldKey, fieldLabel: f.fieldLabel, fieldType: f.fieldType }));
}

/** displayName + jobTitle for every post (user) referenced by the given KPIs. */
async function getReferencedUsers(kpis: Kpi[]) {
  const ids = new Set<number>();
  for (const k of kpis) {
    if (k.responsiblePostId) ids.add(k.responsiblePostId);
    if (k.custodianPostId) ids.add(k.custodianPostId);
  }
  if (ids.size === 0) return {} as Record<number, { displayName: string; jobTitle: string | null }>;
  const users = await db.select().from(usersTable).where(inArray(usersTable.id, Array.from(ids)));
  return Object.fromEntries(users.map(u => [u.id, { displayName: u.displayName || u.username, jobTitle: u.jobTitle ?? null }]));
}

function formatPerson(u: { displayName: string; jobTitle: string | null } | undefined): string {
  if (!u) return "";
  return u.jobTitle ? `${u.displayName} (${u.jobTitle})` : u.displayName;
}

/**
 * Distinct department values captured on the cycle's effective SDBIP KPIs
 * (the Scorecard Wizard "Department" custom field) — feeds the report filter.
 */
router.get("/reports/departments", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  if (!cycleId) { res.status(400).json({ error: "cycleId is required" }); return; }
  const { kpis } = await resolveEffectiveKpiSet(cycleId);
  const values = new Set<string>();
  for (const k of kpis) {
    const cf = (k.customFields ?? {}) as Record<string, unknown>;
    const dept = cf["cf_department"];
    if (typeof dept === "string" && dept.trim() !== "") values.add(dept.trim());
  }
  res.json(Array.from(values).sort((a, b) => a.localeCompare(b)));
});

/** JSON data for a report run, for on-screen display in the Report Centre. */
router.get("/reports/runs/:id/data", async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [run] = await db.select().from(reportRunsTable).where(eq(reportRunsTable.id, id));
  if (!run) { res.status(404).json({ error: "Not found" }); return; }
  const { cycle, rows } = await gatherReportData(run);
  const fields = await getReportFieldConfig(run.reportType);
  const users = await getReferencedUsers(rows.map(r => r.kpi));
  res.json({
    run,
    cycle: cycle ?? null,
    fields,
    users,
    rows: rows.map(r => ({
      kpi: r.kpi,
      uomName: r.uomName,
      targets: Object.fromEntries(r.targets),
      actuals: Object.fromEntries(
        Array.from(r.actuals.entries()).map(([q, a]) => [q, { value: a.value, isAchieved: a.isAchieved, assessment: a.assessment, scorePct: a.scorePct, commentary: a.commentary }]),
      ),
    })),
  });
});

type KpiRow = {
  kpi: Kpi;
  targets: Map<number, string>;
  actuals: Map<number, { value: string; isAchieved: boolean | null; assessment: string | null; scorePct: number | null; commentary: string | null; challengeNarrative: string | null; correctiveAction: string | null; analysisNotes: string | null; budgetImplication: string | null }>;
  uomName: string;
};

async function gatherReportData(run: typeof reportRunsTable.$inferSelect) {
  const [cycle] = await db.select().from(performanceCyclesTable).where(eq(performanceCyclesTable.id, run.cycleId));
  const uoms = await db.select().from(unitsOfMeasureTable);
  const uomMap = new Map(uoms.map(u => [u.id, u.name]));

  // Resolve the effective KPI set so a cycle with a Revised SDBIP is never
  // double-counted: revised KPIs supersede top-layer ones by KPI number, and
  // actuals captured against either version resolve to the effective KPI.
  const { scorecards: allScorecards, cycleKpis, kpis: effectiveKpis, effectiveAliases } =
    await resolveEffectiveKpiSet(run.cycleId);

  let kpis = effectiveKpis;
  if (run.scorecardType) {
    // An explicit scorecard-type filter means the user asked for that exact
    // version's KPIs — report them as-is, without supersession.
    const wantedScIds = new Set(
      allScorecards.filter(s => (s as Record<string, unknown>).scorecardType === run.scorecardType).map(s => s.id)
    );
    kpis = cycleKpis.filter(k => wantedScIds.has(k.scorecardId));
  }
  if (run.departmentId) {
    const deptScIds = new Set(
      allScorecards.filter(s => (s as Record<string, unknown>).departmentId === run.departmentId).map(s => s.id)
    );
    kpis = kpis.filter(k => deptScIds.has(k.scorecardId));
  }

  // Respect the capture-screen ordering: drag & drop renumbers KPIs, so sort
  // by KPI number (natural/numeric-aware so "10" sorts after "2").
  kpis = [...kpis].sort((a, b) =>
    String(a.kpiNumber ?? "").localeCompare(String(b.kpiNumber ?? ""), undefined, { numeric: true, sensitivity: "base" })
  );

  const rows: KpiRow[] = [];
  for (const kpi of kpis) {
      const targets = await db.select().from(kpiQuarterTargetsTable).where(eq(kpiQuarterTargetsTable.kpiId, kpi.id));
      // Quarters flagged N/A / On Hold: show label in target column, exclude from achievement stats.
      const flaggedQuarters = new Set(targets.filter(t => (t.targetStatus ?? "active") !== "active").map(t => t.quarter));
      // Actuals captured against either KPI version (original or revised)
      // count for the effective KPI; the latest wins per quarter.
      const aliasIds = run.scorecardType ? [kpi.id] : (effectiveAliases.get(kpi.id) || [kpi.id]);
      const allActuals = aliasIds.length > 0
        ? await db.select().from(kpiQuarterActualsTable).where(inArray(kpiQuarterActualsTable.kpiId, aliasIds))
        : [];
      const latestByQuarter = new Map<number, typeof kpiQuarterActualsTable.$inferSelect>();
      for (const a of allActuals) {
        const existing = latestByQuarter.get(a.quarter);
        if (!existing || a.id > existing.id) latestByQuarter.set(a.quarter, a);
      }
      const actuals = Array.from(latestByQuarter.values()).filter(a => !flaggedQuarters.has(a.quarter));
      const tMap = new Map(targets.map(t => [
        t.quarter,
        (t.targetStatus ?? "active") === "active" ? t.targetValue : (t.targetStatus === "on_hold" ? "On Hold" : "N/A"),
      ]));
      const aMap = new Map(actuals.map(a => [a.quarter, {
        value: a.actualValue ?? "",
        isAchieved: a.isAchieved,
        assessment: a.assessment ?? null,
        scorePct: a.scorePct ?? null,
        commentary: a.commentary,
        challengeNarrative: a.challengeNarrative,
        correctiveAction: a.correctiveAction,
        analysisNotes: a.analysisNotes,
        budgetImplication: a.budgetImplication,
      }]));
      rows.push({ kpi, targets: tMap, actuals: aMap, uomName: uomMap.get(kpi.unitOfMeasureId ?? 0) || "" });
  }
  return { cycle, rows };
}

function getAchievementStatus(
  target: string | undefined,
  actual: string | undefined,
  isAchieved: boolean | null | undefined,
  assessment?: string | null,
): "met" | "partial" | "missed" | "none" {
  if (!actual || actual === "") return "none";
  // Actual captured as N/A (Not Applicable) or On hold: excluded from stats.
  const flagged = actual.trim().toUpperCase();
  if (flagged === "N/A" || flagged === "ON HOLD") return "none";
  // Prefer the stored assessment (covers score-based and AI-scored
  // qualitative actuals) over any ad-hoc numeric recomputation.
  switch (assessment) {
    case "Achieved":
    case "Over Achieved": return "met";
    case "Partially Achieved": return "partial";
    case "Not Achieved": return "missed";
    case "On Hold":
    case "Not Applicable": return "none";
  }
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

/**
 * SDBIP plan report: the captured plan (targets), no actuals/achievement.
 * Columns and their sequence follow the Scorecard Wizard field config for the
 * corresponding SDBIP type; POE custom fields are folded in after the quarter
 * target they belong to.
 */
function buildSdbipRows(
  data: KpiRow[],
  fields: Array<{ fieldKind: string; fieldKey: string; fieldLabel: string }>,
  users: Record<number, { displayName: string; jobTitle: string | null }>,
) {
  return data.map(r => {
    const row: Record<string, string | number> = {};
    for (const f of fields) {
      const qt = /^cf_quarter_(\d)_target$/.exec(f.fieldKey);
      if (qt) { row[f.fieldLabel] = r.targets.get(Number(qt[1])) || ""; continue; }
      if (f.fieldKind === "custom") {
        const cf = (r.kpi.customFields ?? {}) as Record<string, unknown>;
        row[f.fieldLabel] = cf[f.fieldKey] == null ? "" : String(cf[f.fieldKey]);
        continue;
      }
      switch (f.fieldKey) {
        case "unitOfMeasureId": row[f.fieldLabel] = r.uomName; break;
        case "responsiblePostId": row[f.fieldLabel] = formatPerson(r.kpi.responsiblePostId ? users[r.kpi.responsiblePostId] : undefined); break;
        case "custodianPostId": row[f.fieldLabel] = formatPerson(r.kpi.custodianPostId ? users[r.kpi.custodianPostId] : undefined); break;
        default: {
          const v = (r.kpi as unknown as Record<string, unknown>)[f.fieldKey];
          row[f.fieldLabel] = v == null ? "" : String(v);
        }
      }
    }
    row["Status"] = r.kpi.status;
    return { row, status: "none" };
  });
}

function buildQuarterlyRows(data: KpiRow[], quarter: number) {
  return data.map(r => {
    const t = r.targets.get(quarter);
    const a = r.actuals.get(quarter);
    const status = getAchievementStatus(t, a?.value, a?.isAchieved, a?.assessment);
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
    const s1 = getAchievementStatus(t1, a1?.value, a1?.isAchieved, a1?.assessment);
    const s2 = getAchievementStatus(t2, a2?.value, a2?.isAchieved, a2?.assessment);
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
      return getAchievementStatus(t, a?.value, a?.isAchieved, a?.assessment);
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
  if (!["xlsx", "pdf", "csv", "docx"].includes(format)) {
    res.status(400).json({ error: "format must be xlsx, pdf, csv, or docx" });
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
  if (rType === "sdbip" || rType === "revisedsdbip" || rType === "departmentalsdbip") {
    const fields = await getReportFieldConfig(run.reportType);
    const users = await getReferencedUsers(kpiData.map(r => r.kpi));
    dataRows = buildSdbipRows(kpiData, fields, users);
    sheetName = rType === "revisedsdbip" ? "Revised SDBIP" : rType === "departmentalsdbip" ? "Departmental SDBIP" : "SDBIP Report";
  } else if (rType === "annual" || rType === "institutionalevaluation") {
    dataRows = buildAnnualRows(kpiData);
    sheetName = "Annual Performance Report";
  } else if (rType === "midyear") {
    dataRows = buildMidYearRows(kpiData);
    sheetName = "Mid-Year Performance Report";
  } else {
    dataRows = buildQuarterlyRows(kpiData, run.quarter || 1);
    sheetName = `Q${run.quarter || 1} Performance Report`;
  }

  // Friendly report-type label for headers (sheetName already reads well, e.g. "SDBIP Report").
  const reportTypeLabel = sheetName;

  // Strip the financial year from the title — it is shown separately below the title.
  const fyLabel = cycle?.financialYearLabel || "";
  let displayTitle = run.title;
  if (fyLabel) {
    displayTitle = displayTitle.split(fyLabel).join("").replace(/\s{2,}/g, " ").replace(/[\s\-–—:]+$/g, "").trim();
  }
  if (!displayTitle) displayTitle = reportTypeLabel;

  const headerInfo = [
    [displayTitle],
    ["Report Type:", reportTypeLabel],
    ["Financial Year:", cycle?.financialYearLabel || String(run.cycleId)],
  ];
  if (run.quarter) headerInfo.push(["Quarter:", `Q${run.quarter}`]);
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

  if (format === "docx") {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, HeadingLevel } = await import("docx");
    const headers = Object.keys(dataRows[0]?.row || {});
    const headerRow = new TableRow({
      tableHeader: true,
      children: headers.map(h => new TableCell({
        shading: { fill: "0F2B46" },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 14 })] })],
      })),
    });
    const bodyRows = dataRows.map((d, i) => new TableRow({
      children: headers.map(h => new TableCell({
        shading: i % 2 === 1 ? { fill: "F8FAFC" } : undefined,
        children: [new Paragraph({ children: [new TextRun({ text: String(d.row[h] ?? ""), size: 14 })] })],
      })),
    }));
    const subtitle = `${reportTypeLabel}  |  Financial Year: ${cycle?.financialYearLabel || run.cycleId}${run.quarter ? `  |  Quarter: Q${run.quarter}` : ""}`;
    const docx = new Document({
      sections: [{
        properties: { page: { size: { orientation: "landscape" as never } } },
        children: [
          new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, children: [new TextRun({ text: displayTitle })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: subtitle, size: 18, color: "64748B" })] }),
          new Paragraph({ text: "" }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...bodyRows] }),
        ],
      }],
    });
    const buf = await Packer.toBuffer(docx);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.docx"`);
    res.send(Buffer.from(buf));
    return;
  }

  if (format === "pdf") {
    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({ size: "A3", layout: "landscape", margin: 40, bufferPages: true });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    doc.on("end", () => {
      const pdf = Buffer.concat(buffers);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.pdf"`);
      res.send(pdf);
    });

    const startX = 40;
    const pageWidth = doc.page.width;
    const usableWidth = pageWidth - startX * 2;

    // --- Title block (centered banner) ---
    doc.rect(0, 0, pageWidth, 70).fill("#0f2b46");
    doc.fillColor("#ffffff").fontSize(18).font("Helvetica-Bold")
      .text(displayTitle, startX, 18, { width: usableWidth, align: "center" });
    doc.fillColor("#cbd5e1").fontSize(10).font("Helvetica")
      .text(`${reportTypeLabel}  |  Financial Year: ${cycle?.financialYearLabel || run.cycleId}${run.quarter ? `  |  Quarter: Q${run.quarter}` : ""}`,
        startX, 44, { width: usableWidth, align: "center" });

    // --- Column widths, scaled to fill the page ---
    const headers = Object.keys(dataRows[0]?.row || {});
    const baseWidths = headers.map(h => {
      if (h.includes("KPI Number") || h === "UOM" || h === "Number") return 45;
      if (h === "Unit of Measure" || h === "Baseline") return 60;
      if (h.includes("Achievement")) return 60;
      if (h.includes("Target") || h.includes("Actual") || h.includes("Budget")) return 65;
      if (h.includes("Key Performance") || h.includes("Indicator") || h.includes("Objective")) return 110;
      if (h.includes("Comment") || h.includes("Challenges") || h.includes("Corrective") || h.includes("POE") || h.includes("Portfolio")) return 90;
      return 70;
    });
    const CELL_PAD = 4;
    const HEADER_FONT = 7.5;
    const BODY_FONT = 7;

    // Minimum width per column: the widest single word of the header must fit
    // without breaking mid-word (e.g. "Number" must not wrap to "Numbe/r").
    doc.font("Helvetica-Bold").fontSize(HEADER_FONT);
    const minWidths = headers.map(h =>
      Math.ceil(Math.max(...h.split(/\s+/).map(w => doc.widthOfString(w)), 10)) + CELL_PAD * 2 + 2
    );

    const baseTotal = baseWidths.reduce((a, b) => a + b, 0);
    const scale = usableWidth / baseTotal;
    let colWidths = baseWidths.map((w, i) => Math.max(Math.floor(w * scale), minWidths[i]));
    // If enforcing minimums overflowed the page, shrink the flexible columns proportionally.
    const overflow = colWidths.reduce((a, b) => a + b, 0) - usableWidth;
    if (overflow > 0) {
      const flexIdx = colWidths.map((w, i) => i).filter(i => colWidths[i] > minWidths[i]);
      const flexTotal = flexIdx.reduce((a, i) => a + (colWidths[i] - minWidths[i]), 0);
      if (flexTotal > 0) {
        const shrink = Math.min(1, overflow / flexTotal);
        colWidths = colWidths.map((w, i) =>
          flexIdx.includes(i) ? Math.max(minWidths[i], Math.floor(w - (w - minWidths[i]) * shrink)) : w
        );
      }
    }
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const bottomLimit = doc.page.height - 50;

    const cellHeight = (text: string, width: number, fontSize: number, font: string) => {
      doc.font(font).fontSize(fontSize);
      return doc.heightOfString(text, { width: width - CELL_PAD * 2 }) + CELL_PAD * 2;
    };

    const drawHeaderRow = (y: number): number => {
      const h = Math.max(...headers.map((hd, i) => cellHeight(hd, colWidths[i], HEADER_FONT, "Helvetica-Bold")), 20);
      doc.rect(startX, y, tableWidth, h).fill("#0f2b46");
      let x = startX;
      doc.font("Helvetica-Bold").fontSize(HEADER_FONT).fillColor("#ffffff");
      headers.forEach((hd, i) => {
        doc.text(hd, x + CELL_PAD, y + CELL_PAD, { width: colWidths[i] - CELL_PAD * 2, align: "left" });
        x += colWidths[i];
      });
      return y + h;
    };

    let y = drawHeaderRow(86);

    const statusFills: Record<string, string> = { met: "#c6efce", partial: "#ffeb9c", missed: "#ffc7ce" };
    const statusTextColors: Record<string, string> = { met: "#006100", partial: "#9c6500", missed: "#9c0006" };

    for (let di = 0; di < dataRows.length; di++) {
      const { row, status } = dataRows[di];
      const cellTexts = headers.map(h => String(row[h] ?? ""));
      const rowH = Math.max(...cellTexts.map((t, i) => cellHeight(t, colWidths[i], BODY_FONT, "Helvetica")), 18);

      if (y + rowH > bottomLimit) {
        doc.addPage();
        y = drawHeaderRow(40);
      }

      const bgColor = statusFills[status] || (di % 2 === 0 ? "#ffffff" : "#f8fafc");
      doc.rect(startX, y, tableWidth, rowH).fill(bgColor);

      let x = startX;
      doc.font("Helvetica").fontSize(BODY_FONT);
      headers.forEach((h, i) => {
        if (h === "Achievement" && status !== "none") {
          doc.fillColor(statusTextColors[status] || "#1e293b").font("Helvetica-Bold");
        } else {
          doc.fillColor("#1e293b").font("Helvetica");
        }
        doc.text(cellTexts[i], x + CELL_PAD, y + CELL_PAD, { width: colWidths[i] - CELL_PAD * 2, align: "left" });
        x += colWidths[i];
      });

      // cell borders
      doc.lineWidth(0.5).strokeColor("#cbd5e1");
      doc.rect(startX, y, tableWidth, rowH).stroke();
      let bx = startX;
      for (let i = 0; i < colWidths.length - 1; i++) {
        bx += colWidths[i];
        doc.moveTo(bx, y).lineTo(bx, y + rowH).stroke();
      }
      y += rowH;
    }

    // --- Page footers ---
    const range = doc.bufferedPageRange();
    for (let p = range.start; p < range.start + range.count; p++) {
      doc.switchToPage(p);
      doc.page.margins.bottom = 0;
      doc.font("Helvetica").fontSize(7).fillColor("#94a3b8")
        .text(`Platinum Performance — Performance Management System`, startX, doc.page.height - 30, { width: usableWidth / 2, align: "left", lineBreak: false })
        .text(`Page ${p - range.start + 1} of ${range.count}`, startX + usableWidth / 2, doc.page.height - 30, { width: usableWidth / 2, align: "right", lineBreak: false });
    }

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

  // Style the title block: large bold title, bold meta labels.
  const titleCell = ws[XLSX.utils.encode_cell({ r: 0, c: 0 })];
  if (titleCell) titleCell.s = { font: { bold: true, sz: 16, color: { rgb: "0F2B46" } } };
  for (let r = 1; r < headerRowIdx; r++) {
    const labelCell = ws[XLSX.utils.encode_cell({ r, c: 0 })];
    if (labelCell) labelCell.s = { font: { bold: true, color: { rgb: "475569" } } };
    const valueCell = ws[XLSX.utils.encode_cell({ r, c: 1 })];
    if (valueCell) valueCell.s = { font: { color: { rgb: "334155" } } };
  }

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
