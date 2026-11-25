import { Router } from "express";
import { db } from "@workspace/db";
import { integrationSyncLogTable, individualAgreementsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../Middleware/auth";
import { TriggerBudgetPullBody } from "@workspace/api-zod";

const router = Router();

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

router.get("/integrations/sync-log", async (req: AuthenticatedRequest, res) => {
  const integrationType = req.query.integrationType as string | undefined;
  let rows = await db.select().from(integrationSyncLogTable);
  if (integrationType) rows = rows.filter(r => r.integrationType === integrationType);
  res.json(rows);
});

router.post("/integrations/hr-sync", requirePermission("integration.manage", "*"), async (req: AuthenticatedRequest, res) => {
  try {
    const [log] = await db.insert(integrationSyncLogTable).values({
      integrationType: "hr",
      direction: "pull",
      entityType: "employee",
      status: "Completed",
      recordCount: 0,
      syncedById: req.user!.id,
    }).returning();
    res.json({ success: true, recordCount: 0, message: "HR sync stub — no external HR system connected. Configure integration to enable." });
  } catch (e: unknown) {
    res.status(500).json({ error: getErrorMessage(e) });
  }
});

router.post("/integrations/budget-pull", requirePermission("integration.manage", "*"), async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = TriggerBudgetPullBody.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
    const [log] = await db.insert(integrationSyncLogTable).values({
      integrationType: "budget",
      direction: "pull",
      entityType: "budget_item",
      status: "Completed",
      recordCount: 0,
      syncedById: req.user!.id,
    }).returning();
    res.json({ success: true, recordCount: 0, message: "Budget pull stub — no external budget system connected. Configure mSCOA integration to enable." });
  } catch (e: unknown) {
    res.status(500).json({ error: getErrorMessage(e) });
  }
});

router.post("/integrations/project-sync", requirePermission("integration.manage", "*"), async (req: AuthenticatedRequest, res) => {
  try {
    const [log] = await db.insert(integrationSyncLogTable).values({
      integrationType: "project",
      direction: "pull",
      entityType: "project",
      status: "Completed",
      recordCount: 0,
      syncedById: req.user!.id,
    }).returning();
    res.json({ success: true, recordCount: 0, message: "Project module sync stub — no external project system connected. Configure integration to link project KPIs to performance agreements." });
  } catch (e: unknown) {
    res.status(500).json({ error: getErrorMessage(e) });
  }
});

router.get("/integrations/project-linkages", async (req: AuthenticatedRequest, res) => {
  const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
  let agreements = await db.select().from(individualAgreementsTable);
  if (cycleId) agreements = agreements.filter(a => a.cycleId === cycleId);
  const linkages = agreements.map(a => ({
    agreementId: a.id,
    employeeName: a.employeeName,
    deptScorecardId: a.deptScorecardId,
    isLinked: !!a.deptScorecardId,
  }));
  res.json({
    linkages,
    summary: `${linkages.filter(l => l.isLinked).length}/${linkages.length} agreements linked to department scorecards`,
  });
});

router.get("/integrations/idp-objectives", async (req: AuthenticatedRequest, res) => {
  const search = (req.query.search as string || "").toLowerCase();
  const sampleObjectives = [
    { id: 1, code: "IDP-01", description: "Basic Service Delivery", chapter: "Chapter 4" },
    { id: 2, code: "IDP-02", description: "Local Economic Development", chapter: "Chapter 5" },
    { id: 3, code: "IDP-03", description: "Municipal Institutional Development & Transformation", chapter: "Chapter 6" },
    { id: 4, code: "IDP-04", description: "Municipal Financial Viability & Management", chapter: "Chapter 7" },
    { id: 5, code: "IDP-05", description: "Good Governance & Public Participation", chapter: "Chapter 8" },
  ];
  const filtered = search ? sampleObjectives.filter(o => o.description.toLowerCase().includes(search) || o.code.toLowerCase().includes(search)) : sampleObjectives;
  res.json(filtered);
});

export default router;
