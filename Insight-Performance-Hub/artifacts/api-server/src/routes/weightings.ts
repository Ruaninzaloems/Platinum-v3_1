import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { nkpaWeightingsTable, competencyRequirementsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import {
  CreateNkpaWeightingBody, UpdateNkpaWeightingBody, UpdateNkpaWeightingParams, DeleteNkpaWeightingParams,
  ListNkpaWeightingsQueryParams,
  CreateCompetencyRequirementBody, UpdateCompetencyRequirementBody, UpdateCompetencyRequirementParams,
  ListCompetencyRequirementsQueryParams,
} from "@workspace/api-zod";
import { requirePermission } from "../middleware/auth";
import type { AuthenticatedRequest } from "../middleware/auth";
import { logAudit } from "../middleware/audit";

const router: IRouter = Router();

async function validateWeightTotal(cycleId: number, scope: string, excludeId?: number, newWeight?: number): Promise<string | null> {
  const all = await db.select().from(nkpaWeightingsTable)
    .where(and(eq(nkpaWeightingsTable.cycleId, cycleId), eq(nkpaWeightingsTable.scope, scope)));
  let total = all.filter(w => w.id !== excludeId).reduce((s, w) => s + w.weight, 0);
  if (newWeight !== undefined) total += newWeight;
  if (total > 100.01) {
    return `Total weight (${total.toFixed(1)}%) would exceed 100% for ${scope} scope`;
  }
  return null;
}

async function validateCompetencyWeightTotal(cycleId: number, excludeId?: number, newWeight?: number): Promise<string | null> {
  const all = await db.select().from(competencyRequirementsTable).where(eq(competencyRequirementsTable.cycleId, cycleId));
  let total = all.filter(c => c.id !== excludeId).reduce((s, c) => s + c.weight, 0);
  if (newWeight !== undefined) total += newWeight;
  if (total > 100.01) {
    return `Total competency weight (${total.toFixed(1)}%) would exceed 100%`;
  }
  return null;
}

router.get("/nkpa-weightings", async (req, res, next) => {
  try {
    const query = ListNkpaWeightingsQueryParams.parse(req.query);
    let q = db.select().from(nkpaWeightingsTable);
    if (query.cycleId) q = q.where(eq(nkpaWeightingsTable.cycleId, query.cycleId)) as typeof q;
    let weightings = await q;
    if (query.scope) weightings = weightings.filter(w => w.scope === query.scope);
    res.json(weightings);
  } catch (err) { next(err); }
});

router.post("/nkpa-weightings", requirePermission("weightings.create", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = CreateNkpaWeightingBody.parse(req.body);
    const weightError = await validateWeightTotal(body.cycleId, body.scope, undefined, body.weight);
    if (weightError) { res.status(400).json({ error: weightError }); return; }
    const [w] = await db.insert(nkpaWeightingsTable).values(body).returning();
    await logAudit(req, "create", "nkpa_weighting", w.id, null, w, body.cycleId);
    res.status(201).json(w);
  } catch (err) { next(err); }
});

router.patch("/nkpa-weightings/:id", requirePermission("weightings.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = UpdateNkpaWeightingParams.parse(req.params);
    const body = UpdateNkpaWeightingBody.parse(req.body);
    const [existing] = await db.select().from(nkpaWeightingsTable).where(eq(nkpaWeightingsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (body.weight !== undefined) {
      const weightError = await validateWeightTotal(existing.cycleId, existing.scope, id, body.weight);
      if (weightError) { res.status(400).json({ error: weightError }); return; }
    }
    const [w] = await db.update(nkpaWeightingsTable).set(body).where(eq(nkpaWeightingsTable.id, id)).returning();
    await logAudit(req, "update", "nkpa_weighting", w.id, existing, w, existing.cycleId);
    res.json(w);
  } catch (err) { next(err); }
});

router.delete("/nkpa-weightings/:id", requirePermission("weightings.delete", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = DeleteNkpaWeightingParams.parse(req.params);
    const [existing] = await db.select().from(nkpaWeightingsTable).where(eq(nkpaWeightingsTable.id, id));
    if (existing) await logAudit(req, "delete", "nkpa_weighting", id, existing, null, existing.cycleId);
    await db.delete(nkpaWeightingsTable).where(eq(nkpaWeightingsTable.id, id));
    res.status(204).end();
  } catch (err) { next(err); }
});

router.get("/competency-requirements", async (req, res, next) => {
  try {
    const query = ListCompetencyRequirementsQueryParams.parse(req.query);
    let q = db.select().from(competencyRequirementsTable);
    if (query.cycleId) q = q.where(eq(competencyRequirementsTable.cycleId, query.cycleId)) as typeof q;
    const reqs = await q;
    res.json(reqs);
  } catch (err) { next(err); }
});

router.post("/competency-requirements", requirePermission("weightings.create", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = CreateCompetencyRequirementBody.parse(req.body);
    const weightError = await validateCompetencyWeightTotal(body.cycleId, undefined, body.weight);
    if (weightError) { res.status(400).json({ error: weightError }); return; }
    const [cr] = await db.insert(competencyRequirementsTable).values(body).returning();
    await logAudit(req, "create", "competency_requirement", cr.id, null, cr, body.cycleId);
    res.status(201).json(cr);
  } catch (err) { next(err); }
});

router.patch("/competency-requirements/:id", requirePermission("weightings.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = UpdateCompetencyRequirementParams.parse(req.params);
    const body = UpdateCompetencyRequirementBody.parse(req.body);
    const [existing] = await db.select().from(competencyRequirementsTable).where(eq(competencyRequirementsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (body.weight !== undefined) {
      const weightError = await validateCompetencyWeightTotal(existing.cycleId, id, body.weight);
      if (weightError) { res.status(400).json({ error: weightError }); return; }
    }
    const [cr] = await db.update(competencyRequirementsTable).set(body).where(eq(competencyRequirementsTable.id, id)).returning();
    await logAudit(req, "update", "competency_requirement", cr.id, existing, cr, existing.cycleId);
    res.json(cr);
  } catch (err) { next(err); }
});

export default router;
