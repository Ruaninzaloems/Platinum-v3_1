import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  departmentsTable,
  divisionsTable,
  performanceCyclesTable,
  scorecardKpisTable,
  deptScorecardKpisTable,
} from "@workspace/db/schema";
import { eq, asc, inArray, isNotNull } from "drizzle-orm";
import XLSX from "xlsx-js-style";
import { requirePermission } from "../Middleware/auth";
import type { AuthenticatedRequest } from "../Middleware/auth";
import { logAudit } from "../Middleware/audit";

const router: IRouter = Router();

router.get("/departments", async (req, res, next) => {
  try {
    const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
    const departments = cycleId
      ? await db.select().from(departmentsTable).where(eq(departmentsTable.cycleId, cycleId)).orderBy(asc(departmentsTable.name))
      : await db.select().from(departmentsTable).orderBy(asc(departmentsTable.name));
    const deptIds = departments.map((d) => d.id);
    const divisions = deptIds.length
      ? await db.select().from(divisionsTable).where(inArray(divisionsTable.departmentId, deptIds)).orderBy(asc(divisionsTable.name))
      : [];
    const cycles = await db.select().from(performanceCyclesTable);
    const cycleMap = new Map(cycles.map((c) => [c.id, c.financialYearLabel]));
    res.json(departments.map((d) => ({
      id: d.id,
      name: d.name,
      cycleId: d.cycleId,
      financialYearLabel: cycleMap.get(d.cycleId) ?? "",
      divisions: divisions.filter((v) => v.departmentId === d.id).map((v) => ({ id: v.id, name: v.name })),
    })));
  } catch (err) { next(err); }
});

router.get("/departments/take-on-sheet", async (_req, res, next) => {
  try {
    const cycles = await db.select().from(performanceCyclesTable).orderBy(asc(performanceCyclesTable.financialYearLabel));
    const label = cycles.length ? cycles[cycles.length - 1].financialYearLabel : "2025/2026";
    const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const rows: string[][] = [
      ["Department", "Division", "Financial year"],
      ["Budget & Treasury", "Budget Planning and Financial Reporting", label],
      ["Budget & Treasury", "Expenditure and Payroll", label],
    ];
    const csv = rows.map((r) => r.map(esc).join(",")).join("\r\n") + "\r\n";
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="department-take-on-sheet.csv"');
    res.send(csv);
  } catch (err) { next(err); }
});

router.post("/departments/upload", requirePermission("config.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { fileBase64, fileName } = req.body as { fileBase64?: string; fileName?: string };
    if (!fileBase64 || typeof fileBase64 !== "string") {
      res.status(400).json({ error: "fileBase64 is required" });
      return;
    }
    let rows: Record<string, unknown>[];
    try {
      const wb = XLSX.read(Buffer.from(fileBase64, "base64"), { type: "buffer" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
    } catch {
      res.status(400).json({ error: "Could not read the file. Please upload the take-on sheet in .csv format." });
      return;
    }
    if (!rows.length) {
      res.status(400).json({ error: "The uploaded sheet contains no data rows." });
      return;
    }

    const norm = (v: unknown) => String(v ?? "").trim();
    const keyOf = (row: Record<string, unknown>, name: string) =>
      Object.keys(row).find((k) => k.trim().toLowerCase() === name);
    const first = rows[0];
    if (!keyOf(first, "department") || !keyOf(first, "financial year")) {
      res.status(400).json({ error: 'The sheet must have "Department", "Division" and "Financial year" columns. Download the take-on sheet for the correct format.' });
      return;
    }

    const cycles = await db.select().from(performanceCyclesTable);
    const cycleByLabel = new Map(cycles.map((c) => [c.financialYearLabel.trim(), c.id]));

    const errors: string[] = [];
    const parsed: { department: string; division: string; cycleId: number }[] = [];
    rows.forEach((row, i) => {
      const dept = norm(row[keyOf(row, "department") ?? ""]);
      const division = norm(row[keyOf(row, "division") ?? ""]);
      const year = norm(row[keyOf(row, "financial year") ?? ""]);
      if (!dept && !division && !year) return;
      if (!dept) { errors.push(`Row ${i + 2}: Department is required`); return; }
      if (!year) { errors.push(`Row ${i + 2}: Financial year is required`); return; }
      const cycleId = cycleByLabel.get(year);
      if (!cycleId) { errors.push(`Row ${i + 2}: Financial year "${year}" does not match any configured financial year`); return; }
      parsed.push({ department: dept, division, cycleId });
    });
    if (errors.length) {
      res.status(400).json({ error: "The sheet has errors and nothing was imported.", details: errors.slice(0, 20) });
      return;
    }
    if (!parsed.length) {
      res.status(400).json({ error: "The uploaded sheet contains no data rows." });
      return;
    }

    let deptCreated = 0, divCreated = 0, skipped = 0;
    await db.transaction(async (tx) => {
      const existingDepts = await tx.select().from(departmentsTable);
      const deptKey = (name: string, cycleId: number) => `${cycleId}::${name.toLowerCase()}`;
      const deptMap = new Map(existingDepts.map((d) => [deptKey(d.name, d.cycleId), d.id]));

      for (const row of parsed) {
        let deptId = deptMap.get(deptKey(row.department, row.cycleId));
        if (!deptId) {
          const [ins] = await tx.insert(departmentsTable).values({ name: row.department, cycleId: row.cycleId }).returning();
          deptId = ins.id;
          deptMap.set(deptKey(row.department, row.cycleId), deptId);
          deptCreated++;
        }
        if (!row.division) continue;
        const existingDivs = await tx.select().from(divisionsTable).where(eq(divisionsTable.departmentId, deptId));
        if (existingDivs.some((v) => v.name.toLowerCase() === row.division.toLowerCase())) { skipped++; continue; }
        await tx.insert(divisionsTable).values({ departmentId: deptId, name: row.division });
        divCreated++;
      }
    });

    await logAudit(req, "upload", "departments", 0, null, {
      fileName: fileName ?? null, rows: parsed.length, departmentsCreated: deptCreated, divisionsCreated: divCreated, skipped,
    });
    res.json({ rows: parsed.length, departmentsCreated: deptCreated, divisionsCreated: divCreated, skipped });
  } catch (err) { next(err); }
});

router.post("/departments", requirePermission("config.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = req.body as { name?: unknown; cycleId?: unknown; divisions?: unknown };
    const name = String(body.name ?? "").trim();
    const cycleId = Number(body.cycleId);
    if (!name) { res.status(400).json({ error: "Name is required" }); return; }
    if (!Number.isInteger(cycleId) || cycleId <= 0) { res.status(400).json({ error: "cycleId is required" }); return; }
    const rawDivisions = Array.isArray(body.divisions) ? body.divisions : [];
    const divisionNames: string[] = [];
    for (const d of rawDivisions) {
      const v = String(d ?? "").trim();
      if (v && !divisionNames.some((x) => x.toLowerCase() === v.toLowerCase())) divisionNames.push(v);
    }
    const [cycle] = await db.select().from(performanceCyclesTable).where(eq(performanceCyclesTable.id, cycleId));
    if (!cycle) { res.status(400).json({ error: "Financial year not found" }); return; }
    const siblings = await db.select().from(departmentsTable).where(eq(departmentsTable.cycleId, cycleId));
    if (siblings.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      res.status(409).json({ error: `A department named "${name}" already exists for ${cycle.financialYearLabel}` });
      return;
    }
    const created = await db.transaction(async (tx) => {
      const [dept] = await tx.insert(departmentsTable).values({ name, cycleId }).returning();
      for (const divisionName of divisionNames) {
        await tx.insert(divisionsTable).values({ departmentId: dept.id, name: divisionName });
      }
      return dept;
    });
    await logAudit(req, "create", "department", created.id, null, { name, cycleId, divisions: divisionNames });
    res.status(201).json({ id: created.id, name: created.name, cycleId: created.cycleId, divisionsCreated: divisionNames.length });
  } catch (err) { next(err); }
});

router.post("/departments/:id/divisions", requirePermission("config.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const departmentId = Number(req.params.id);
    const name = String((req.body as { name?: unknown }).name ?? "").trim();
    if (!name) { res.status(400).json({ error: "Name is required" }); return; }
    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, departmentId));
    if (!dept) { res.status(404).json({ error: "Department not found" }); return; }
    const siblings = await db.select().from(divisionsTable).where(eq(divisionsTable.departmentId, departmentId));
    if (siblings.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      res.status(409).json({ error: `A division named "${name}" already exists in ${dept.name}` });
      return;
    }
    const [created] = await db.insert(divisionsTable).values({ departmentId, name }).returning();
    await logAudit(req, "create", "division", created.id, null, { name, departmentId });
    res.status(201).json({ id: created.id, name: created.name });
  } catch (err) { next(err); }
});

router.patch("/departments/:id", requirePermission("config.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const name = String((req.body as { name?: unknown }).name ?? "").trim();
    if (!name) { res.status(400).json({ error: "Name is required" }); return; }
    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, id));
    if (!dept) { res.status(404).json({ error: "Department not found" }); return; }
    const siblings = await db.select().from(departmentsTable).where(eq(departmentsTable.cycleId, dept.cycleId));
    if (siblings.some((s) => s.id !== id && s.name.toLowerCase() === name.toLowerCase())) {
      res.status(409).json({ error: `A department named "${name}" already exists for this financial year` });
      return;
    }
    const [updated] = await db.update(departmentsTable)
      .set({ name, updatedAt: new Date() })
      .where(eq(departmentsTable.id, id))
      .returning();
    await logAudit(req, "update", "department", id, { name: dept.name }, { name: updated.name });
    res.json({ id: updated.id, name: updated.name });
  } catch (err) { next(err); }
});

router.patch("/divisions/:id", requirePermission("config.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const name = String((req.body as { name?: unknown }).name ?? "").trim();
    if (!name) { res.status(400).json({ error: "Name is required" }); return; }
    const [division] = await db.select().from(divisionsTable).where(eq(divisionsTable.id, id));
    if (!division) { res.status(404).json({ error: "Division not found" }); return; }
    const siblings = await db.select().from(divisionsTable).where(eq(divisionsTable.departmentId, division.departmentId));
    if (siblings.some((s) => s.id !== id && s.name.toLowerCase() === name.toLowerCase())) {
      res.status(409).json({ error: `A division named "${name}" already exists in this department` });
      return;
    }
    const [updated] = await db.update(divisionsTable)
      .set({ name, updatedAt: new Date() })
      .where(eq(divisionsTable.id, id))
      .returning();
    await logAudit(req, "update", "division", id, { name: division.name }, { name: updated.name });
    res.json({ id: updated.id, name: updated.name });
  } catch (err) { next(err); }
});

async function countDivisionReferences(names: string[]): Promise<number> {
  if (!names.length) return 0;
  const wanted = new Set(names.map((n) => n.trim().toLowerCase()));
  const matches = (customFields: Record<string, string | number | boolean | null> | null) => {
    if (!customFields) return false;
    return Object.values(customFields).some(
      (v) => typeof v === "string" && wanted.has(v.trim().toLowerCase()),
    );
  };
  const orgKpis = await db.select({ customFields: scorecardKpisTable.customFields })
    .from(scorecardKpisTable).where(isNotNull(scorecardKpisTable.customFields));
  const deptKpis = await db.select({ customFields: deptScorecardKpisTable.customFields })
    .from(deptScorecardKpisTable).where(isNotNull(deptScorecardKpisTable.customFields));
  return orgKpis.filter((r) => matches(r.customFields)).length
    + deptKpis.filter((r) => matches(r.customFields)).length;
}

router.delete("/divisions/:id", requirePermission("config.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const [division] = await db.select().from(divisionsTable).where(eq(divisionsTable.id, id));
    if (!division) { res.status(404).json({ error: "Division not found" }); return; }
    const refs = await countDivisionReferences([division.name]);
    if (refs > 0) {
      res.status(409).json({
        error: `Division "${division.name}" cannot be deleted because ${refs} KPI(s) have information captured against it. Remove or reassign those KPIs first.`,
      });
      return;
    }
    await db.delete(divisionsTable).where(eq(divisionsTable.id, id));
    await logAudit(req, "delete", "division", id, { name: division.name }, null);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete("/departments/:id", requirePermission("config.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, id));
    if (!dept) { res.status(404).json({ error: "Department not found" }); return; }
    const divs = await db.select().from(divisionsTable).where(eq(divisionsTable.departmentId, id));
    const refs = await countDivisionReferences([dept.name, ...divs.map((v) => v.name)]);
    if (refs > 0) {
      res.status(409).json({
        error: `Department "${dept.name}" cannot be deleted because ${refs} KPI(s) have information captured against it or its divisions. Remove or reassign those KPIs first.`,
      });
      return;
    }
    await db.transaction(async (tx) => {
      await tx.delete(divisionsTable).where(eq(divisionsTable.departmentId, id));
      await tx.delete(departmentsTable).where(eq(departmentsTable.id, id));
    });
    await logAudit(req, "delete", "department", id, { name: dept.name }, null);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
