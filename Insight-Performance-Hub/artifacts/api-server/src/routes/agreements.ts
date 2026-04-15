import { Router } from "express";
import { db } from "@workspace/db";
import {
  individualAgreementsTable,
  employeeKpasTable,
  employeeKpisTable,
  performanceCyclesTable,
  usersTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../middleware/auth";
import { logAudit } from "../middleware/audit";
import {
  CreateAgreementBody,
  UpdateAgreementBody,
  TransitionAgreementBody,
  CreateEmployeeKpaBody,
  CreateEmployeeKpiBody,
} from "@workspace/api-zod";

const router = Router();

const EDITABLE_STATUSES = new Set(["Draft"]);

const AGREEMENT_TRANSITIONS: Record<string, Record<string, string>> = {
  Draft: { submit: "Submitted" },
  Submitted: { approve: "Supervisor Review", reject: "Draft", return_to_draft: "Draft" },
  "Supervisor Review": { approve: "Approved", reject: "Submitted" },
  Approved: { start_quarterly: "Quarterly Review", lock: "Locked" },
  "Quarterly Review": { complete_quarterly: "Mid-Year Review", reject: "Approved" },
  "Mid-Year Review": { complete_midyear: "Annual Assessment", reject: "Quarterly Review" },
  "Annual Assessment": { complete_annual: "Moderation", reject: "Mid-Year Review" },
  Moderation: { accept: "Final Score", adjust: "Final Score", refer: "Annual Assessment" },
  "Final Score": { lock: "Locked" },
  Locked: {},
};

async function assertEditable(agreementId: number) {
  const rows = await db.select().from(individualAgreementsTable).where(eq(individualAgreementsTable.id, agreementId));
  if (!rows[0]) return { ok: false as const, error: "Agreement not found" };
  if (!EDITABLE_STATUSES.has(rows[0].status)) return { ok: false as const, error: `Agreement is ${rows[0].status} and cannot be modified` };
  return { ok: true as const, agreement: rows[0] };
}

async function assertCycleOpen(cycleId: number) {
  const [cycle] = await db.select().from(performanceCyclesTable).where(eq(performanceCyclesTable.id, cycleId));
  if (!cycle) return { ok: false as const, error: "Cycle not found" };
  if (cycle.status === "Closed") return { ok: false as const, error: "Cycle is closed — no modifications allowed" };
  return { ok: true as const };
}

async function assertAgreementViewable(req: AuthenticatedRequest, agreementId: number) {
  const [agreement] = await db.select().from(individualAgreementsTable).where(eq(individualAgreementsTable.id, agreementId));
  if (!agreement) return { ok: false as const, error: "Agreement not found" };
  if (!canViewAgreement(req.user, agreement)) return { ok: false as const, error: "Access denied" };
  return { ok: true as const, agreement };
}

function canViewAgreement(user: AuthenticatedRequest["user"], agreement: { employeeId: number; departmentId: number | null }): boolean {
  if (!user) return false;
  if (user.role === "system_admin" || user.role === "perf_admin" || user.role === "muni_manager") return true;
  if ((user.role === "hod" || user.role === "dept_coordinator") && user.departmentId !== null && agreement.departmentId === user.departmentId) return true;
  return agreement.employeeId === user.id;
}

function canEditAgreement(user: AuthenticatedRequest["user"], agreement: { employeeId: number; departmentId: number | null; createdById: number | null }): boolean {
  if (!user) return false;
  if (user.role === "system_admin" || user.role === "perf_admin") return true;
  if (user.role === "muni_manager") return true;
  if ((user.role === "hod" || user.role === "dept_coordinator") && user.departmentId !== null && agreement.departmentId === user.departmentId) return true;
  if (user.role === "hr_admin") return true;
  return agreement.employeeId === user.id || agreement.createdById === user.id;
}

async function validateKpaWeights(agreementId: number) {
  const kpas = await db.select().from(employeeKpasTable).where(eq(employeeKpasTable.agreementId, agreementId));
  if (kpas.length === 0) return { valid: true as const, totalWeight: 0 };
  const totalWeight = kpas.reduce((sum, k) => sum + (k.weighting ?? 0), 0);
  if (totalWeight > 100) return { valid: false as const, error: `KPA weights total ${totalWeight}% — must not exceed 100%`, totalWeight };
  return { valid: true as const, totalWeight };
}

router.get("/agreements", async (req: AuthenticatedRequest, res) => {
  const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
  const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
  const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;
  let rows = await db.select().from(individualAgreementsTable);
  if (cycleId) rows = rows.filter(r => r.cycleId === cycleId);
  if (departmentId) rows = rows.filter(r => r.departmentId === departmentId);
  if (employeeId) rows = rows.filter(r => r.employeeId === employeeId);
  rows = rows.filter(r => canViewAgreement(req.user, r));
  res.json(rows);
});

router.get("/agreements/:id", async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [row] = await db.select().from(individualAgreementsTable).where(eq(individualAgreementsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  if (!canViewAgreement(req.user, row)) { res.status(403).json({ error: "Access denied" }); return; }
  res.json(row);
});

router.post("/agreements", requirePermission("agreement.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const parsed = CreateAgreementBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  if (!parsed.data.employeeId || parsed.data.employeeId <= 0) { res.status(400).json({ error: "Valid employeeId is required" }); return; }
  const cycleCheck = await assertCycleOpen(parsed.data.cycleId);
  if (!cycleCheck.ok) { res.status(409).json({ error: cycleCheck.error }); return; }
  const [employee] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.data.employeeId));
  if (!employee) { res.status(400).json({ error: "Employee not found" }); return; }
  if (!employee.isActive) { res.status(400).json({ error: "Cannot create agreement for inactive employee" }); return; }
  const departmentId = employee.departmentId !== null ? employee.departmentId : parsed.data.departmentId;
  const [row] = await db.insert(individualAgreementsTable).values({
    ...parsed.data,
    departmentId,
    createdById: req.user!.id,
  }).returning();
  await logAudit(req, "create", "individual_agreement", row.id, null, row as unknown as Record<string, unknown>, row.cycleId);
  res.status(201).json(row);
});

router.put("/agreements/:id", requirePermission("agreement.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const check = await assertEditable(id);
  if (!check.ok) { res.status(check.error.includes("not found") ? 404 : 409).json({ error: check.error }); return; }
  const existing = check.agreement;
  if (!canEditAgreement(req.user, existing)) { res.status(403).json({ error: "Access denied" }); return; }
  const cycleCheck = await assertCycleOpen(existing.cycleId);
  if (!cycleCheck.ok) { res.status(409).json({ error: cycleCheck.error }); return; }
  const parsed = UpdateAgreementBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.update(individualAgreementsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(individualAgreementsTable.id, id)).returning();
  await logAudit(req, "update", "individual_agreement", id, existing as unknown as Record<string, unknown>, row as unknown as Record<string, unknown>, existing.cycleId);
  res.json(row);
});

router.post("/agreements/:id/transition", requirePermission("agreement.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(individualAgreementsTable).where(eq(individualAgreementsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (!canEditAgreement(req.user, existing)) { res.status(403).json({ error: "Access denied" }); return; }
  const parsed = TransitionAgreementBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const transitions = AGREEMENT_TRANSITIONS[existing.status];
  if (!transitions || !transitions[parsed.data.action]) {
    res.status(400).json({ error: `Cannot ${parsed.data.action} from status ${existing.status}` });
    return;
  }
  if (parsed.data.action === "submit") {
    const weightCheck = await validateKpaWeights(id);
    if (!weightCheck.valid) { res.status(400).json({ error: weightCheck.error }); return; }
    if (weightCheck.totalWeight === 0) { res.status(400).json({ error: "Agreement must have at least one KPA before submission" }); return; }
    if (weightCheck.totalWeight !== 100) { res.status(400).json({ error: `KPA weights must total 100% (currently ${weightCheck.totalWeight}%)` }); return; }
  }
  const newStatus = transitions[parsed.data.action];
  const updates: Record<string, unknown> = { status: newStatus, updatedAt: new Date() };
  if (parsed.data.action === "approve" && existing.status === "Supervisor Review") {
    updates.approvedById = req.user!.id;
    updates.approvedAt = new Date();
    updates.approvalComments = parsed.data.comments || null;
  }
  if (parsed.data.action === "lock") {
    updates.lockedAt = new Date();
  }
  const [row] = await db.update(individualAgreementsTable).set(updates).where(eq(individualAgreementsTable.id, id)).returning();
  await logAudit(req, "transition", "individual_agreement", id, existing as unknown as Record<string, unknown>, row as unknown as Record<string, unknown>, existing.cycleId);
  res.json(row);
});

router.get("/agreements/:agreementId/kpas", async (req: AuthenticatedRequest, res) => {
  const agreementId = Number(req.params.agreementId);
  const viewCheck = await assertAgreementViewable(req, agreementId);
  if (!viewCheck.ok) { res.status(viewCheck.error === "Access denied" ? 403 : 404).json({ error: viewCheck.error }); return; }
  const rows = await db.select().from(employeeKpasTable).where(eq(employeeKpasTable.agreementId, agreementId));
  res.json(rows);
});

router.post("/agreements/:agreementId/kpas", requirePermission("agreement.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const agreementId = Number(req.params.agreementId);
  const check = await assertEditable(agreementId);
  if (!check.ok) { res.status(409).json({ error: check.error }); return; }
  if (!canEditAgreement(req.user, check.agreement)) { res.status(403).json({ error: "Access denied" }); return; }
  const parsed = CreateEmployeeKpaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const existingKpas = await db.select().from(employeeKpasTable).where(eq(employeeKpasTable.agreementId, agreementId));
  const currentTotal = existingKpas.reduce((sum, k) => sum + (k.weighting ?? 0), 0);
  const newWeighting = parsed.data.weighting ?? 0;
  if (currentTotal + newWeighting > 100) {
    res.status(400).json({ error: `Adding weight ${newWeighting}% would exceed 100% (current total: ${currentTotal}%)` });
    return;
  }
  const [row] = await db.insert(employeeKpasTable).values({ ...parsed.data, agreementId }).returning();
  res.status(201).json(row);
});

router.put("/employee-kpas/:id", requirePermission("agreement.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existingKpa] = await db.select().from(employeeKpasTable).where(eq(employeeKpasTable.id, id));
  if (!existingKpa) { res.status(404).json({ error: "Not found" }); return; }
  const check = await assertEditable(existingKpa.agreementId);
  if (!check.ok) { res.status(409).json({ error: check.error }); return; }
  if (!canEditAgreement(req.user, check.agreement)) { res.status(403).json({ error: "Access denied" }); return; }
  const parsed = CreateEmployeeKpaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const allKpas = await db.select().from(employeeKpasTable).where(eq(employeeKpasTable.agreementId, existingKpa.agreementId));
  const otherTotal = allKpas.filter(k => k.id !== id).reduce((sum, k) => sum + (k.weighting ?? 0), 0);
  const newWeighting = parsed.data.weighting ?? 0;
  if (otherTotal + newWeighting > 100) {
    res.status(400).json({ error: `Weight ${newWeighting}% would exceed 100% (other KPAs total: ${otherTotal}%)` });
    return;
  }
  const [row] = await db.update(employeeKpasTable).set(parsed.data).where(eq(employeeKpasTable.id, id)).returning();
  res.json(row);
});

router.delete("/employee-kpas/:id", requirePermission("agreement.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existingKpa] = await db.select().from(employeeKpasTable).where(eq(employeeKpasTable.id, id));
  if (!existingKpa) { res.status(404).json({ error: "Not found" }); return; }
  const check = await assertEditable(existingKpa.agreementId);
  if (!check.ok) { res.status(409).json({ error: check.error }); return; }
  if (!canEditAgreement(req.user, check.agreement)) { res.status(403).json({ error: "Access denied" }); return; }
  await db.delete(employeeKpasTable).where(eq(employeeKpasTable.id, id));
  res.status(204).send();
});

router.get("/agreements/:agreementId/kpis", async (req: AuthenticatedRequest, res) => {
  const agreementId = Number(req.params.agreementId);
  const viewCheck = await assertAgreementViewable(req, agreementId);
  if (!viewCheck.ok) { res.status(viewCheck.error === "Access denied" ? 403 : 404).json({ error: viewCheck.error }); return; }
  const rows = await db.select().from(employeeKpisTable).where(eq(employeeKpisTable.agreementId, agreementId));
  res.json(rows);
});

router.post("/agreements/:agreementId/kpis", requirePermission("agreement.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const agreementId = Number(req.params.agreementId);
  const check = await assertEditable(agreementId);
  if (!check.ok) { res.status(409).json({ error: check.error }); return; }
  if (!canEditAgreement(req.user, check.agreement)) { res.status(403).json({ error: "Access denied" }); return; }
  const parsed = CreateEmployeeKpiBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.insert(employeeKpisTable).values({ ...parsed.data, agreementId }).returning();
  res.status(201).json(row);
});

router.put("/employee-kpis/:id", requirePermission("agreement.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existingKpi] = await db.select().from(employeeKpisTable).where(eq(employeeKpisTable.id, id));
  if (!existingKpi) { res.status(404).json({ error: "Not found" }); return; }
  const check = await assertEditable(existingKpi.agreementId);
  if (!check.ok) { res.status(409).json({ error: check.error }); return; }
  if (!canEditAgreement(req.user, check.agreement)) { res.status(403).json({ error: "Access denied" }); return; }
  const parsed = CreateEmployeeKpiBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.update(employeeKpisTable).set(parsed.data).where(eq(employeeKpisTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/employee-kpis/:id", requirePermission("agreement.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existingKpi] = await db.select().from(employeeKpisTable).where(eq(employeeKpisTable.id, id));
  if (!existingKpi) { res.status(404).json({ error: "Not found" }); return; }
  const check = await assertEditable(existingKpi.agreementId);
  if (!check.ok) { res.status(409).json({ error: check.error }); return; }
  if (!canEditAgreement(req.user, check.agreement)) { res.status(403).json({ error: "Access denied" }); return; }
  await db.delete(employeeKpisTable).where(eq(employeeKpisTable.id, id));
  res.status(204).send();
});

export default router;
