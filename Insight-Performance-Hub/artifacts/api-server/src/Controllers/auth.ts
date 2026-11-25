import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, rolesTable, rolePermissionsTable, departmentsTable, divisionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import XLSX from "xlsx-js-style";
import { requirePermission } from "../Middleware/auth";
import type { AuthenticatedRequest } from "../Middleware/auth";
import { logAudit } from "../Middleware/audit";

const router: IRouter = Router();

const EMPLOYEE_LEVELS = ["Staff", "Manager", "Director", "MM"] as const;

function usernameFromEmail(email: string): string {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

router.get("/auth/me", (req: AuthenticatedRequest, res) => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
    isActive: user.isActive,
    permissions: user.permissions,
  });
});

router.get("/users/lookup", async (req, res, next) => {
  try {
    // includeInactive=1 returns terminated employees too (with isActive flags),
    // so callers can resolve names on records still assigned to former staff
    // while offering only active employees as new choices.
    const includeInactive = req.query.includeInactive === "1" || req.query.includeInactive === "true";
    const users = await db.select().from(usersTable);
    res.json(users.filter((u) => includeInactive || u.isActive).map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      jobTitle: u.jobTitle,
      isActive: u.isActive,
    })));
  } catch (err) { next(err); }
});

router.get("/auth/users", requirePermission("admin.users", "*"), async (req, res, next) => {
  try {
    const levelFilter = typeof req.query.level === "string" ? req.query.level.trim() : "";
    const users = await db.select().from(usersTable);
    const departments = await db.select().from(departmentsTable);
    const divisions = await db.select().from(divisionsTable);
    const deptMap = new Map(departments.map((d) => [d.id, d.name]));
    const divMap = new Map(divisions.map((d) => [d.id, d.name]));
    const nameMap = new Map(users.map((u) => [u.id, u.displayName]));
    const rows = users
      .filter((u) => !levelFilter || (u.level ?? "").toLowerCase() === levelFilter.toLowerCase())
      .map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        firstName: u.firstName,
        surname: u.surname,
        idNumber: u.idNumber,
        cellphone: u.cellphone,
        email: u.email,
        role: u.role,
        departmentId: u.departmentId,
        departmentName: u.departmentId ? (deptMap.get(u.departmentId) ?? null) : null,
        divisionId: u.divisionId,
        divisionName: u.divisionId ? (divMap.get(u.divisionId) ?? null) : null,
        employeeNumber: u.employeeNumber,
        jobTitle: u.jobTitle,
        level: u.level,
        supervisorId: u.supervisorId,
        supervisorName: u.supervisorId ? (nameMap.get(u.supervisorId) ?? null) : null,
        performanceCategory: u.performanceCategory,
        startDate: u.startDate,
        terminationDate: u.terminationDate,
        isActive: u.isActive,
      }));
    res.json(rows);
  } catch (err) { next(err); }
});

interface EmployeeBody {
  firstName?: unknown;
  surname?: unknown;
  idNumber?: unknown;
  cellphone?: unknown;
  employeeNumber?: unknown;
  jobTitle?: unknown;
  level?: unknown;
  departmentId?: unknown;
  divisionId?: unknown;
  supervisorId?: unknown;
  performanceCategory?: unknown;
  startDate?: unknown;
  terminationDate?: unknown;
  email?: unknown;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function validateEmployee(body: EmployeeBody, excludeId?: number): Promise<{ error?: string; data?: {
  firstName: string; surname: string; displayName: string;
  idNumber: string | null; cellphone: string | null;
  employeeNumber: string | null; jobTitle: string | null; level: string | null;
  departmentId: number | null; divisionId: number | null; supervisorId: number | null;
  performanceCategory: string | null; startDate: string | null; terminationDate: string | null;
  email: string;
} }> {
  const firstName = String(body.firstName ?? "").trim();
  const surname = String(body.surname ?? "").trim();
  const email = String(body.email ?? "").trim();
  const idNumber = String(body.idNumber ?? "").trim() || null;
  const cellphone = String(body.cellphone ?? "").trim() || null;
  const employeeNumber = String(body.employeeNumber ?? "").trim() || null;
  const jobTitle = String(body.jobTitle ?? "").trim() || null;
  const level = String(body.level ?? "").trim() || null;
  const performanceCategory = String(body.performanceCategory ?? "").trim() || null;
  const startDate = String(body.startDate ?? "").trim() || null;
  const terminationDate = String(body.terminationDate ?? "").trim() || null;
  const departmentId = body.departmentId == null || body.departmentId === "" ? null : Number(body.departmentId);
  const divisionId = body.divisionId == null || body.divisionId === "" ? null : Number(body.divisionId);
  const supervisorId = body.supervisorId == null || body.supervisorId === "" ? null : Number(body.supervisorId);

  if (!firstName) return { error: "First name is required" };
  if (!surname) return { error: "Surname is required" };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "A valid email address is required" };
  if (level && !EMPLOYEE_LEVELS.some((l) => l.toLowerCase() === level.toLowerCase())) {
    return { error: `Level must be one of: ${EMPLOYEE_LEVELS.join(", ")}` };
  }
  const normalizedLevel = level ? EMPLOYEE_LEVELS.find((l) => l.toLowerCase() === level.toLowerCase())! : null;
  if (startDate && !DATE_RE.test(startDate)) return { error: "Start date must be in YYYY-MM-DD format" };
  if (terminationDate && !DATE_RE.test(terminationDate)) return { error: "Termination date must be in YYYY-MM-DD format" };
  if (startDate && terminationDate && terminationDate < startDate) {
    return { error: "Termination date cannot be before the start date" };
  }
  if (departmentId != null) {
    if (!Number.isInteger(departmentId)) return { error: "Invalid department" };
    const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, departmentId));
    if (!dept) return { error: "Department not found" };
  }
  if (divisionId != null) {
    if (!Number.isInteger(divisionId)) return { error: "Invalid division" };
    const [division] = await db.select().from(divisionsTable).where(eq(divisionsTable.id, divisionId));
    if (!division) return { error: "Division not found" };
    if (departmentId != null && division.departmentId !== departmentId) {
      return { error: "The selected division does not belong to the selected department" };
    }
  }
  if (supervisorId != null) {
    if (!Number.isInteger(supervisorId)) return { error: "Invalid supervisor" };
    if (excludeId != null && supervisorId === excludeId) return { error: "An employee cannot be their own supervisor" };
    const [sup] = await db.select().from(usersTable).where(eq(usersTable.id, supervisorId));
    if (!sup) return { error: "Supervisor not found" };
  }
  const all = await db.select().from(usersTable);
  if (employeeNumber && all.some((u) => u.id !== excludeId && (u.employeeNumber ?? "").toLowerCase() === employeeNumber.toLowerCase())) {
    return { error: `Employee number "${employeeNumber}" is already in use` };
  }
  return { data: {
    firstName, surname, displayName: `${firstName} ${surname}`,
    idNumber, cellphone, employeeNumber, jobTitle, level: normalizedLevel,
    departmentId, divisionId, supervisorId, performanceCategory, startDate, terminationDate, email,
  } };
}

const TAKE_ON_HEADERS = [
  "Employee No", "First Name", "Surname", "ID Number", "EMail", "Cell",
  "Job title", "Level", "Department", "Division", "Performance category",
  "Start Date", "Termination date",
] as const;

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function parseSheetDate(raw: unknown): { value: string | null; error?: string } {
  if (raw == null || raw === "") return { value: null };
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(raw) * 86400000);
    return { value: d.toISOString().slice(0, 10) };
  }
  const s = String(raw).trim();
  if (!s) return { value: null };
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return { value: s };
  const m = s.match(/^(\d{1,2})[-/ ]([A-Za-z]{3,})[-/ ](\d{2}|\d{4})$/);
  if (m) {
    const month = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
    if (month >= 0) {
      const yr = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
      return { value: `${yr}-${String(month + 1).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}` };
    }
  }
  const m2 = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m2) return { value: `${m2[3]}-${m2[2].padStart(2, "0")}-${m2[1].padStart(2, "0")}` };
  return { value: null, error: `Unrecognised date "${s}" (use e.g. 01-Jul-25 or 2025-07-01)` };
}

router.get("/auth/users/take-on-sheet", async (_req, res, next) => {
  try {
    const departments = await db.select().from(departmentsTable);
    const divisions = await db.select().from(divisionsTable);
    const sampleDept = departments[0]?.name ?? "Budget & Treasury";
    const sampleDiv = divisions.find((v) => v.departmentId === departments[0]?.id)?.name ?? "Supply Chain Management";
    const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const rows: string[][] = [
      [...TAKE_ON_HEADERS],
      ["1", "Simon", "Moloi", "", "smoloi@municipality.gov.za", "", "Municipal Manager", "MM", sampleDept, sampleDiv, "Section 56/57 Managers (Regulation 805)", "01-Jul-25", ""],
      ["2", "Lindiwe", "Dlamini", "", "ldlamini@municipality.gov.za", "", "Manager: Internal Audit", "Manager", sampleDept, sampleDiv, "Employees (Regulation 890)", "01-Jul-25", ""],
    ];
    const csv = rows.map((r) => r.map(esc).join(",")).join("\r\n") + "\r\n";
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="employee-take-on-sheet.csv"');
    res.send(csv);
  } catch (err) { next(err); }
});

router.post("/auth/users/upload", requirePermission("admin.users", "*"), async (req: AuthenticatedRequest, res, next) => {
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
      res.status(400).json({ error: "Could not read the file. Please upload the take-on sheet in .csv or .xlsx format." });
      return;
    }
    if (!rows.length) {
      res.status(400).json({ error: "The uploaded sheet contains no data rows." });
      return;
    }

    const norm = (v: unknown) => String(v ?? "").trim();
    const keyOf = (row: Record<string, unknown>, name: string) =>
      Object.keys(row).find((k) => k.trim().toLowerCase() === name.toLowerCase());
    const col = (row: Record<string, unknown>, name: string) => norm(row[keyOf(row, name) ?? ""]);
    const first = rows[0];
    if (!keyOf(first, "first name") || !keyOf(first, "surname") || !keyOf(first, "email")) {
      res.status(400).json({ error: 'The sheet must have at least "First Name", "Surname" and "EMail" columns. Download the take-on sheet for the correct format.' });
      return;
    }

    const departments = await db.select().from(departmentsTable);
    const divisions = await db.select().from(divisionsTable);
    const existing = await db.select().from(usersTable);
    const deptByName = new Map(departments.map((d) => [d.name.trim().toLowerCase(), d.id]));

    const errors: string[] = [];
    interface ParsedEmp {
      employeeNumber: string | null; firstName: string; surname: string; idNumber: string | null;
      email: string; cellphone: string | null; jobTitle: string | null; level: string | null;
      departmentId: number | null; divisionId: number | null; performanceCategory: string | null;
      startDate: string | null; terminationDate: string | null;
    }
    const parsed: ParsedEmp[] = [];
    const seenEmpNos = new Set<string>();

    rows.forEach((row, i) => {
      const rowNo = i + 2;
      const firstName = col(row, "first name");
      const surname = col(row, "surname");
      const email = col(row, "email");
      if (!firstName && !surname && !email) return;
      if (!firstName) { errors.push(`Row ${rowNo}: First Name is required`); return; }
      if (!surname) { errors.push(`Row ${rowNo}: Surname is required`); return; }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errors.push(`Row ${rowNo}: a valid EMail is required`); return; }

      const levelRaw = col(row, "level");
      const level = levelRaw ? EMPLOYEE_LEVELS.find((l) => l.toLowerCase() === levelRaw.toLowerCase()) ?? null : null;
      if (levelRaw && !level) { errors.push(`Row ${rowNo}: Level "${levelRaw}" must be one of ${EMPLOYEE_LEVELS.join(", ")}`); return; }

      const deptName = col(row, "department");
      let departmentId: number | null = null;
      let divisionId: number | null = null;
      if (deptName) {
        departmentId = deptByName.get(deptName.toLowerCase()) ?? null;
        if (!departmentId) { errors.push(`Row ${rowNo}: Department "${deptName}" not found — load it on the Departments page first`); return; }
      }
      const divName = col(row, "division");
      if (divName) {
        if (!departmentId) { errors.push(`Row ${rowNo}: Division given without a valid Department`); return; }
        const div = divisions.find((v) => v.departmentId === departmentId && v.name.trim().toLowerCase() === divName.toLowerCase());
        if (!div) { errors.push(`Row ${rowNo}: Division "${divName}" not found under department "${deptName}"`); return; }
        divisionId = div.id;
      }

      const startKey = keyOf(row, "start date");
      const termKey = keyOf(row, "termination date");
      const start = parseSheetDate(startKey ? row[startKey] : "");
      const term = parseSheetDate(termKey ? row[termKey] : "");
      if (start.error) { errors.push(`Row ${rowNo}: ${start.error}`); return; }
      if (term.error) { errors.push(`Row ${rowNo}: ${term.error}`); return; }
      if (start.value && term.value && term.value < start.value) {
        errors.push(`Row ${rowNo}: Termination date is before the start date`); return;
      }

      const employeeNumber = col(row, "employee no") || null;
      if (employeeNumber) {
        if (seenEmpNos.has(employeeNumber.toLowerCase())) { errors.push(`Row ${rowNo}: duplicate Employee No "${employeeNumber}" in the sheet`); return; }
        seenEmpNos.add(employeeNumber.toLowerCase());
      }

      parsed.push({
        employeeNumber, firstName, surname,
        idNumber: col(row, "id number") || null,
        email,
        cellphone: col(row, "cell") || null,
        jobTitle: col(row, "job title") || null,
        level,
        departmentId, divisionId,
        performanceCategory: col(row, "performance category") || null,
        startDate: start.value, terminationDate: term.value,
      });
    });

    if (errors.length) {
      res.status(400).json({ error: "The sheet has errors and nothing was imported.", details: errors.slice(0, 20) });
      return;
    }
    if (!parsed.length) {
      res.status(400).json({ error: "The uploaded sheet contains no data rows." });
      return;
    }

    let created = 0, updated = 0;
    const usedUsernames = new Set(existing.map((u) => u.username.toLowerCase()));
    const emailCounts = new Map<string, number>();
    for (const emp of parsed) {
      const k = emp.email.toLowerCase();
      emailCounts.set(k, (emailCounts.get(k) ?? 0) + 1);
    }
    const matchedIds = new Set<number>();
    await db.transaction(async (tx) => {
      for (const emp of parsed) {
        const byEmpNo = emp.employeeNumber
          ? existing.find((u) => (u.employeeNumber ?? "").toLowerCase() === emp.employeeNumber!.toLowerCase())
          : undefined;
        const emailUniqueInSheet = (emailCounts.get(emp.email.toLowerCase()) ?? 0) === 1;
        const byEmail = emailUniqueInSheet
          ? existing.find((u) => !matchedIds.has(u.id) && u.email.toLowerCase() === emp.email.toLowerCase())
          : undefined;
        const match = byEmpNo ?? byEmail;
        if (match) matchedIds.add(match.id);
        const values = {
          displayName: `${emp.firstName} ${emp.surname}`,
          firstName: emp.firstName,
          surname: emp.surname,
          idNumber: emp.idNumber,
          cellphone: emp.cellphone,
          email: emp.email,
          departmentId: emp.departmentId,
          divisionId: emp.divisionId,
          employeeNumber: emp.employeeNumber,
          jobTitle: emp.jobTitle,
          level: emp.level,
          performanceCategory: emp.performanceCategory,
          startDate: emp.startDate,
          terminationDate: emp.terminationDate,
        };
        if (match) {
          await tx.update(usersTable).set({ ...values, updatedAt: new Date() }).where(eq(usersTable.id, match.id));
          updated++;
        } else {
          let username = usernameFromEmail(emp.email) || `${emp.firstName}.${emp.surname}`.toLowerCase().replace(/\s+/g, ".");
          const base = username;
          let suffix = 1;
          while (usedUsernames.has(username.toLowerCase())) username = `${base}${suffix++}`;
          usedUsernames.add(username.toLowerCase());
          await tx.insert(usersTable).values({ username, role: "responsible_post", ...values });
          created++;
        }
      }
    });

    await logAudit(req, "upload", "users", 0, null, {
      fileName: fileName ?? null, rows: parsed.length, created, updated,
    });
    res.json({ rows: parsed.length, created, updated });
  } catch (err) { next(err); }
});

router.post("/auth/users", requirePermission("admin.users", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const check = await validateEmployee(req.body as EmployeeBody);
    if (check.error || !check.data) { res.status(check.error?.includes("in use") ? 409 : 400).json({ error: check.error ?? "Invalid data" }); return; }
    const d = check.data;
    const all = await db.select().from(usersTable);
    let username = usernameFromEmail(d.email) || d.displayName.toLowerCase().replace(/\s+/g, ".");
    const base = username;
    let suffix = 1;
    while (all.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      username = `${base}${suffix++}`;
    }
    const [created] = await db.insert(usersTable).values({
      username,
      displayName: d.displayName,
      firstName: d.firstName,
      surname: d.surname,
      idNumber: d.idNumber,
      cellphone: d.cellphone,
      email: d.email,
      role: "responsible_post",
      departmentId: d.departmentId,
      divisionId: d.divisionId,
      employeeNumber: d.employeeNumber,
      jobTitle: d.jobTitle,
      level: d.level,
      supervisorId: d.supervisorId,
      performanceCategory: d.performanceCategory,
      startDate: d.startDate,
      terminationDate: d.terminationDate,
    }).returning();
    await logAudit(req, "create", "user", created.id, null, {
      displayName: d.displayName, email: d.email, employeeNumber: d.employeeNumber, level: d.level,
    });
    res.status(201).json({ id: created.id, username: created.username });
  } catch (err) { next(err); }
});

router.patch("/auth/users/:id", requirePermission("admin.users", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (!existing) { res.status(404).json({ error: "Employee not found" }); return; }
    const check = await validateEmployee(req.body as EmployeeBody, id);
    if (check.error || !check.data) { res.status(check.error?.includes("in use") ? 409 : 400).json({ error: check.error ?? "Invalid data" }); return; }
    const d = check.data;
    const [updated] = await db.update(usersTable).set({
      displayName: d.displayName,
      firstName: d.firstName,
      surname: d.surname,
      idNumber: d.idNumber,
      cellphone: d.cellphone,
      email: d.email,
      departmentId: d.departmentId,
      divisionId: d.divisionId,
      employeeNumber: d.employeeNumber,
      jobTitle: d.jobTitle,
      level: d.level,
      supervisorId: d.supervisorId,
      performanceCategory: d.performanceCategory,
      startDate: d.startDate,
      terminationDate: d.terminationDate,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, id)).returning();
    await logAudit(req, "update", "user", id,
      { displayName: existing.displayName, email: existing.email, employeeNumber: existing.employeeNumber, jobTitle: existing.jobTitle, level: existing.level, departmentId: existing.departmentId, divisionId: existing.divisionId, supervisorId: existing.supervisorId, performanceCategory: existing.performanceCategory, startDate: existing.startDate, terminationDate: existing.terminationDate },
      { displayName: updated.displayName, email: updated.email, employeeNumber: updated.employeeNumber, jobTitle: updated.jobTitle, level: updated.level, departmentId: updated.departmentId, divisionId: updated.divisionId, supervisorId: updated.supervisorId, performanceCategory: updated.performanceCategory, startDate: updated.startDate, terminationDate: updated.terminationDate });
    res.json({ id: updated.id });
  } catch (err) { next(err); }
});

router.delete("/auth/users/:id", requirePermission("admin.users", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid employee id" }); return; }
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (!existing) { res.status(404).json({ error: "Employee not found" }); return; }
    if (req.user && req.user.id === id) {
      res.status(400).json({ error: "You cannot delete your own account" });
      return;
    }
    try {
      await db.transaction(async (tx) => {
        await tx.update(usersTable).set({ supervisorId: null, updatedAt: new Date() }).where(eq(usersTable.supervisorId, id));
        await tx.delete(usersTable).where(eq(usersTable.id, id));
      });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "23503") {
        res.status(409).json({ error: `${existing.displayName} is linked to performance records (scorecards, KPIs or reviews) and cannot be deleted. Consider capturing a termination date instead.` });
        return;
      }
      throw err;
    }
    await logAudit(req, "delete", "user", id, {
      displayName: existing.displayName, email: existing.email, employeeNumber: existing.employeeNumber,
    }, null);
    res.json({ id });
  } catch (err) { next(err); }
});

router.get("/auth/roles", requirePermission("admin.roles", "*"), async (_req, res, next) => {
  try {
    const roles = await db.select().from(rolesTable);
    const perms = await db.select().from(rolePermissionsTable);
    res.json(roles.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      description: r.description,
      permissions: perms.filter(p => p.roleCode === r.code).map(p => p.permission),
    })));
  } catch (err) { next(err); }
});

export default router;
