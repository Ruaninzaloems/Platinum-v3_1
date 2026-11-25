import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { submissionDeadlinesTable, reportFieldsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import {
  CreateSubmissionDeadlineBody, UpdateSubmissionDeadlineBody, UpdateSubmissionDeadlineParams,
  ListSubmissionDeadlinesQueryParams,
  CreateReportFieldBody, UpdateReportFieldBody, UpdateReportFieldParams, DeleteReportFieldParams,
  ListReportFieldsQueryParams,
} from "@workspace/api-zod";
import { requirePermission } from "../Middleware/auth";
import type { AuthenticatedRequest } from "../Middleware/auth";
import { logAudit } from "../Middleware/audit";

const router: IRouter = Router();

async function checkDuplicateQuarter(cycleId: number, quarter: number, excludeId?: number): Promise<boolean> {
  const existing = await db.select().from(submissionDeadlinesTable)
    .where(and(eq(submissionDeadlinesTable.cycleId, cycleId), eq(submissionDeadlinesTable.quarter, quarter)));
  return existing.some(d => d.id !== excludeId);
}

router.get("/submission-deadlines", async (req, res, next) => {
  try {
    const query = ListSubmissionDeadlinesQueryParams.parse(req.query);
    let q = db.select().from(submissionDeadlinesTable);
    if (query.cycleId) q = q.where(eq(submissionDeadlinesTable.cycleId, query.cycleId)) as typeof q;
    const deadlines = await q;
    res.json(deadlines);
  } catch (err) { next(err); }
});

router.post("/submission-deadlines", requirePermission("deadlines.create", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = CreateSubmissionDeadlineBody.parse(req.body);
    if (body.quarter < 1 || body.quarter > 4) { res.status(400).json({ error: "Quarter must be 1-4" }); return; }
    const isDuplicate = await checkDuplicateQuarter(body.cycleId, body.quarter);
    if (isDuplicate) { res.status(400).json({ error: `Deadline for Q${body.quarter} already exists in this cycle` }); return; }
    const [dl] = await db.insert(submissionDeadlinesTable).values({
      cycleId: body.cycleId,
      quarter: body.quarter,
      deadlineDate: body.deadlineDate instanceof Date ? body.deadlineDate.toISOString().split("T")[0] : body.deadlineDate,
      reminderDaysBefore: body.reminderDaysBefore,
      isActive: body.isActive,
    }).returning();
    await logAudit(req, "create", "submission_deadline", dl.id, null, dl, body.cycleId);
    res.status(201).json(dl);
  } catch (err) { next(err); }
});

router.patch("/submission-deadlines/:id", requirePermission("deadlines.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = UpdateSubmissionDeadlineParams.parse(req.params);
    const body = UpdateSubmissionDeadlineBody.parse(req.body);
    const [existing] = await db.select().from(submissionDeadlinesTable).where(eq(submissionDeadlinesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const updateData: Record<string, unknown> = {};
    if (body.deadlineDate !== undefined) {
      updateData.deadlineDate = body.deadlineDate instanceof Date ? body.deadlineDate.toISOString().split("T")[0] : body.deadlineDate;
    }
    if (body.reminderDaysBefore !== undefined) updateData.reminderDaysBefore = body.reminderDaysBefore;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    const [dl] = await db.update(submissionDeadlinesTable).set(updateData).where(eq(submissionDeadlinesTable.id, id)).returning();
    await logAudit(req, "update", "submission_deadline", dl.id, existing, dl, existing.cycleId);
    res.json(dl);
  } catch (err) { next(err); }
});

router.get("/report-fields", async (req, res, next) => {
  try {
    const query = ListReportFieldsQueryParams.parse(req.query);
    let q = db.select().from(reportFieldsTable);
    if (query.cycleId) q = q.where(eq(reportFieldsTable.cycleId, query.cycleId)) as typeof q;
    let fields = await q;
    if (query.reportType) fields = fields.filter(f => f.reportType === query.reportType);
    res.json(fields);
  } catch (err) { next(err); }
});

router.post("/report-fields", requirePermission("config.create", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = CreateReportFieldBody.parse(req.body);
    const validTypes = ["quarterly", "midYear", "annual"];
    if (!validTypes.includes(body.reportType)) { res.status(400).json({ error: `reportType must be one of: ${validTypes.join(", ")}` }); return; }
    const [rf] = await db.insert(reportFieldsTable).values(body).returning();
    await logAudit(req, "create", "report_field", rf.id, null, rf, body.cycleId);
    res.status(201).json(rf);
  } catch (err) { next(err); }
});

router.patch("/report-fields/:id", requirePermission("config.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = UpdateReportFieldParams.parse(req.params);
    const body = UpdateReportFieldBody.parse(req.body);
    const [existing] = await db.select().from(reportFieldsTable).where(eq(reportFieldsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const [rf] = await db.update(reportFieldsTable).set(body).where(eq(reportFieldsTable.id, id)).returning();
    await logAudit(req, "update", "report_field", rf.id, existing, rf, existing.cycleId);
    res.json(rf);
  } catch (err) { next(err); }
});

router.delete("/report-fields/:id", requirePermission("config.delete", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = DeleteReportFieldParams.parse(req.params);
    const [existing] = await db.select().from(reportFieldsTable).where(eq(reportFieldsTable.id, id));
    if (existing) await logAudit(req, "delete", "report_field", id, existing, null, existing.cycleId);
    await db.delete(reportFieldsTable).where(eq(reportFieldsTable.id, id));
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
