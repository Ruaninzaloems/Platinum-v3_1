import { Router } from "express";
import { db } from "@workspace/db";
import { competencyTemplatesTable, competencyTemplateItemsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { type AuthenticatedRequest, requirePermission } from "../middleware/auth";
import { CreateCompetencyTemplateBody, CreateCompetencyItemBody } from "@workspace/api-zod";

const router = Router();

router.get("/competency-templates", async (_req: AuthenticatedRequest, res) => {
  const rows = await db.select().from(competencyTemplatesTable);
  res.json(rows);
});

router.post("/competency-templates", requirePermission("config.manage", "*"), async (req: AuthenticatedRequest, res) => {
  const parsed = CreateCompetencyTemplateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.insert(competencyTemplatesTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.put("/competency-templates/:id", requirePermission("config.manage", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const parsed = CreateCompetencyTemplateBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.update(competencyTemplatesTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(competencyTemplatesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.get("/competency-templates/:templateId/items", async (req: AuthenticatedRequest, res) => {
  const templateId = Number(req.params.templateId);
  const rows = await db.select().from(competencyTemplateItemsTable).where(eq(competencyTemplateItemsTable.templateId, templateId));
  res.json(rows);
});

router.post("/competency-templates/:templateId/items", requirePermission("config.manage", "*"), async (req: AuthenticatedRequest, res) => {
  const templateId = Number(req.params.templateId);
  const parsed = CreateCompetencyItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.insert(competencyTemplateItemsTable).values({ ...parsed.data, templateId }).returning();
  res.status(201).json(row);
});

router.put("/competency-items/:id", requirePermission("config.manage", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const parsed = CreateCompetencyItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues }); return; }
  const [row] = await db.update(competencyTemplateItemsTable).set(parsed.data).where(eq(competencyTemplateItemsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.delete("/competency-items/:id", requirePermission("config.manage", "*"), async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  await db.delete(competencyTemplateItemsTable).where(eq(competencyTemplateItemsTable.id, id));
  res.status(204).send();
});

export default router;
