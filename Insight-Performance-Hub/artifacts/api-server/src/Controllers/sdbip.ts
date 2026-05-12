import { Router } from "express";
import { db } from "@workspace/db";
import { sdbipItemsTable, sdbipRevisionsTable, scorecardsTable, scorecardKpisTable } from "@workspace/db/schema";
import { eq, and, max } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../Middleware/auth";
import { logAudit } from "../Middleware/audit";
import {
  CreateSdbipItemBody,
  UpdateSdbipItemBody,
  TransitionSdbipItemBody,
  ReviseSdbipItemBody,
} from "@workspace/api-zod";

const router = Router();

const SDBIP_TRANSITIONS: Record<string, string[]> = {
  Draft: ["submit"],
  Submitted: ["review", "return"],
  "Internal Review": ["approve_baseline", "return"],
  "Approved Baseline": ["monitor"],
  "In-Year Monitoring": ["adjust"],
  Adjustment: ["approve_revision", "return"],
  "Final Approved Revision": [],
};

const SDBIP_ACTION_TO_STATUS: Record<string, string> = {
  submit: "Submitted",
  review: "Internal Review",
  return: "Draft",
  approve_baseline: "Approved Baseline",
  monitor: "In-Year Monitoring",
  adjust: "Adjustment",
  approve_revision: "Final Approved Revision",
};

router.get("/sdbip-items", async (req: AuthenticatedRequest, res) => {
  const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
  const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
  let condition;
  if (cycleId && departmentId) {
    condition = and(eq(sdbipItemsTable.cycleId, cycleId), eq(sdbipItemsTable.departmentId, departmentId));
  } else if (cycleId) {
    condition = eq(sdbipItemsTable.cycleId, cycleId);
  } else if (departmentId) {
    condition = eq(sdbipItemsTable.departmentId, departmentId);
  }
  const rows = condition
    ? await db.select().from(sdbipItemsTable).where(condition)
    : await db.select().from(sdbipItemsTable);
  res.json(rows);
});

router.get("/sdbip-items/:id", async (req: AuthenticatedRequest, res) => {
  const [row] = await db.select().from(sdbipItemsTable).where(eq(sdbipItemsTable.id, Number(req.params.id)));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.post("/sdbip-items", requirePermission("sdbip.create", "*"), async (req: AuthenticatedRequest, res) => {
  const parsed = CreateSdbipItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.insert(sdbipItemsTable).values(parsed.data).returning();
  await logAudit(req, "create", "sdbip_item", row.id, null, row as unknown as Record<string, unknown>, parsed.data.cycleId);
  res.status(201).json(row);
});

router.patch("/sdbip-items/:id", requirePermission("sdbip.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(sdbipItemsTable).where(eq(sdbipItemsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (["Approved Baseline", "Final Approved Revision"].includes(existing.status)) {
    res.status(400).json({ error: "Cannot directly edit approved SDBIP items. Use revision workflow." });
    return;
  }
  const parsed = UpdateSdbipItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.update(sdbipItemsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(sdbipItemsTable.id, id)).returning();
  await logAudit(req, "update", "sdbip_item", id, existing as unknown as Record<string, unknown>, row as unknown as Record<string, unknown>, existing.cycleId);
  res.json(row);
});

router.post("/sdbip-items/:id/transition", requirePermission("sdbip.approve", "sdbip.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(sdbipItemsTable).where(eq(sdbipItemsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const parsed = TransitionSdbipItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const allowed = SDBIP_TRANSITIONS[existing.status] || [];
  if (!allowed.includes(parsed.data.action)) {
    res.status(400).json({ error: `Cannot '${parsed.data.action}' from status '${existing.status}'. Allowed: ${allowed.join(", ")}` });
    return;
  }
  const newStatus = SDBIP_ACTION_TO_STATUS[parsed.data.action];
  const [row] = await db.update(sdbipItemsTable).set({ status: newStatus, updatedAt: new Date() }).where(eq(sdbipItemsTable.id, id)).returning();
  await logAudit(req, `transition:${parsed.data.action}`, "sdbip_item", id, { status: existing.status }, { status: newStatus }, existing.cycleId);
  res.json(row);
});

router.post("/sdbip-items/:id/revise", requirePermission("sdbip.edit", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(sdbipItemsTable).where(eq(sdbipItemsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (!["Approved Baseline", "In-Year Monitoring"].includes(existing.status)) {
    res.status(400).json({ error: "Only approved baseline or in-year monitoring items can be revised" });
    return;
  }
  const parsed = ReviseSdbipItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }

  const existingRevisions = await db.select({ maxNum: max(sdbipRevisionsTable.revisionNumber) })
    .from(sdbipRevisionsTable).where(eq(sdbipRevisionsTable.sdbipItemId, id));
  const nextRevisionNumber = ((existingRevisions[0]?.maxNum) ?? 0) + 1;

  await db.insert(sdbipRevisionsTable).values({
    sdbipItemId: id,
    revisionNumber: nextRevisionNumber,
    reason: parsed.data.reason,
    previousQ1Target: existing.q1Target,
    previousQ2Target: existing.q2Target,
    previousQ3Target: existing.q3Target,
    previousQ4Target: existing.q4Target,
    previousQ1Budget: existing.q1Budget,
    previousQ2Budget: existing.q2Budget,
    previousQ3Budget: existing.q3Budget,
    previousQ4Budget: existing.q4Budget,
    newQ1Target: parsed.data.q1Target ?? existing.q1Target,
    newQ2Target: parsed.data.q2Target ?? existing.q2Target,
    newQ3Target: parsed.data.q3Target ?? existing.q3Target,
    newQ4Target: parsed.data.q4Target ?? existing.q4Target,
    newQ1Budget: parsed.data.q1Budget ?? existing.q1Budget,
    newQ2Budget: parsed.data.q2Budget ?? existing.q2Budget,
    newQ3Budget: parsed.data.q3Budget ?? existing.q3Budget,
    newQ4Budget: parsed.data.q4Budget ?? existing.q4Budget,
    revisedById: req.user!.id,
  });

  const [row] = await db.update(sdbipItemsTable).set({
    q1Target: parsed.data.q1Target ?? existing.q1Target,
    q2Target: parsed.data.q2Target ?? existing.q2Target,
    q3Target: parsed.data.q3Target ?? existing.q3Target,
    q4Target: parsed.data.q4Target ?? existing.q4Target,
    q1Budget: parsed.data.q1Budget ?? existing.q1Budget,
    q2Budget: parsed.data.q2Budget ?? existing.q2Budget,
    q3Budget: parsed.data.q3Budget ?? existing.q3Budget,
    q4Budget: parsed.data.q4Budget ?? existing.q4Budget,
    status: "Adjustment",
    updatedAt: new Date(),
  }).where(eq(sdbipItemsTable.id, id)).returning();

  await logAudit(req, "revise", "sdbip_item", id, existing as unknown as Record<string, unknown>, row as unknown as Record<string, unknown>, existing.cycleId);
  res.json(row);
});

router.get("/sdbip-items/:id/revisions", async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const rows = await db.select().from(sdbipRevisionsTable).where(eq(sdbipRevisionsTable.sdbipItemId, id));
  res.json(rows);
});

router.post("/sdbip/generate", requirePermission("sdbip.create", "*"), async (req: AuthenticatedRequest, res) => {
  const scorecardId = req.body.scorecardId;
  if (!scorecardId) { res.status(400).json({ error: "scorecardId is required" }); return; }
  const [scorecard] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, scorecardId));
  if (!scorecard) { res.status(404).json({ error: "Scorecard not found" }); return; }

  const kpis = await db.select().from(scorecardKpisTable)
    .where(and(eq(scorecardKpisTable.scorecardId, scorecardId), eq(scorecardKpisTable.status, "Approved")));
  if (kpis.length === 0) { res.status(400).json({ error: "No approved KPIs found in scorecard" }); return; }

  const items = [];
  for (const kpi of kpis) {
    const [row] = await db.insert(sdbipItemsTable).values({
      cycleId: scorecard.cycleId,
      kpiId: kpi.id,
      description: kpi.description,
      responsiblePostId: kpi.responsiblePostId,
      annualBudget: kpi.annualBudgetTarget,
    }).returning();
    items.push(row);
  }
  await logAudit(req, "generate", "sdbip_items", scorecardId, null, { count: items.length } as unknown as Record<string, unknown>, scorecard.cycleId);
  res.status(201).json(items);
});

export default router;
