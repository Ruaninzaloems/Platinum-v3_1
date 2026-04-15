import { Router } from "express";
import { db } from "@workspace/db";
import { workflowStepConfigsTable, individualAgreementsTable, deptScorecardsTable, performanceCyclesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../middleware/auth";
import { CreateWorkflowConfigBody } from "@workspace/api-zod";
import { logAudit } from "../middleware/audit";

const router = Router();

router.get("/workflow-configs", async (req: AuthenticatedRequest, res) => {
  const scorecardTypeId = req.query.scorecardTypeId ? Number(req.query.scorecardTypeId) : undefined;
  const activeOnly = req.query.activeOnly === "true";
  let rows = await db.select().from(workflowStepConfigsTable);
  if (scorecardTypeId) rows = rows.filter(r => r.scorecardTypeId === scorecardTypeId);
  if (activeOnly) rows = rows.filter(r => r.isActive !== false);
  res.json(rows);
});

router.post("/workflow-configs", requirePermission("config.manage", "*"), async (req: AuthenticatedRequest, res) => {
  const parsed = CreateWorkflowConfigBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const existing = await db.select().from(workflowStepConfigsTable);
  const sameTypeSteps = existing.filter(r =>
    r.scorecardTypeId === parsed.data.scorecardTypeId &&
    r.stepName === parsed.data.stepName &&
    r.isActive !== false
  );
  for (const old of sameTypeSteps) {
    await db.update(workflowStepConfigsTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(workflowStepConfigsTable.id, old.id));
  }
  const maxVersion = sameTypeSteps.reduce((max, r) => Math.max(max, r.version ?? 0), 0);
  const [row] = await db.insert(workflowStepConfigsTable).values({
    ...parsed.data,
    version: maxVersion + 1,
    isActive: true,
  }).returning();
  await logAudit(req, "create", "workflow_config", row.id, null, row as unknown as Record<string, unknown>, null);
  res.status(201).json(row);
});

router.put("/workflow-configs/:id", requirePermission("config.manage", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(workflowStepConfigsTable).where(eq(workflowStepConfigsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.isActive === false) {
    res.status(409).json({ error: "Cannot modify a superseded workflow config version. Create a new version instead." });
    return;
  }
  const parsed = CreateWorkflowConfigBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  await db.update(workflowStepConfigsTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(workflowStepConfigsTable.id, id));
  const [row] = await db.insert(workflowStepConfigsTable).values({
    ...parsed.data,
    version: (existing.version ?? 0) + 1,
    isActive: true,
  }).returning();
  await logAudit(req, "update", "workflow_config", row.id, existing as unknown as Record<string, unknown>, row as unknown as Record<string, unknown>, null);
  res.json(row);
});

router.delete("/workflow-configs/:id", requirePermission("config.manage", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(workflowStepConfigsTable).where(eq(workflowStepConfigsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.isActive === false) {
    res.status(409).json({ error: "Cannot delete a historical workflow config version" });
    return;
  }
  await db.update(workflowStepConfigsTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(workflowStepConfigsTable.id, id));
  await logAudit(req, "deactivate", "workflow_config", id, existing as unknown as Record<string, unknown>, null, null);
  res.status(204).send();
});

router.get("/individual-dashboard", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;

  let agreements = await db.select().from(individualAgreementsTable);
  agreements = agreements.filter(a => a.cycleId === cycleId);
  if (departmentId) agreements = agreements.filter(a => a.departmentId === departmentId);

  const statusBreakdown: Record<string, number> = {
    Draft: 0, Submitted: 0, "Supervisor Review": 0, Approved: 0,
    "Quarterly Review": 0, "Mid-Year Review": 0, "Annual Assessment": 0,
    Moderation: 0, "Final Score": 0, Locked: 0,
  };
  for (const a of agreements) {
    if (a.status in statusBreakdown) statusBreakdown[a.status]++;
    else statusBreakdown[a.status] = 1;
  }

  const scores = agreements.filter(a => a.finalScore !== null).map(a => a.finalScore as number);
  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const assessmentsPending = agreements.filter(a =>
    a.status === "Submitted" || a.status === "Supervisor Review" ||
    a.status === "Quarterly Review" || a.status === "Mid-Year Review" ||
    a.status === "Annual Assessment" || a.status === "Moderation"
  ).length;

  const deptMap = new Map<string, { total: number; scoreSum: number; count: number }>();
  for (const a of agreements) {
    const entry = deptMap.get(a.departmentName) || { total: 0, scoreSum: 0, count: 0 };
    entry.total++;
    if (a.finalScore !== null) {
      entry.scoreSum += a.finalScore;
      entry.count++;
    }
    deptMap.set(a.departmentName, entry);
  }
  const departmentScores = Array.from(deptMap.entries()).map(([departmentName, d]) => ({
    departmentName,
    avgScore: d.count > 0 ? d.scoreSum / d.count : null,
    count: d.total,
  }));

  res.json({
    totalAgreements: agreements.length,
    statusBreakdown,
    averageScore,
    assessmentsPending,
    departmentScores,
  });
});

export default router;
