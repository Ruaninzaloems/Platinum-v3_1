import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  kpiGroupsTable,
  unitsOfMeasureTable,
  kpiDataTypesTable,
  progressStatusesTable,
  scorecardTypesTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  CreateKpiGroupBody, UpdateKpiGroupBody, UpdateKpiGroupParams,
  CreateUnitOfMeasureBody, UpdateUnitOfMeasureBody, UpdateUnitOfMeasureParams,
  CreateDataTypeBody, UpdateDataTypeBody, UpdateDataTypeParams,
  CreateProgressStatusBody, UpdateProgressStatusBody, UpdateProgressStatusParams,
  CreateScorecardTypeBody, UpdateScorecardTypeBody, UpdateScorecardTypeParams,
  ListKpiGroupsQueryParams, ListUnitsOfMeasureQueryParams, ListProgressStatusesQueryParams,
} from "@workspace/api-zod";
import { requirePermission } from "../Middleware/auth";
import type { AuthenticatedRequest } from "../Middleware/auth";
import { logAudit } from "../Middleware/audit";

const router: IRouter = Router();

router.get("/kpi-groups", async (req, res, next) => {
  try {
    const query = ListKpiGroupsQueryParams.parse(req.query);
    let q = db.select().from(kpiGroupsTable);
    if (query.cycleId) q = q.where(eq(kpiGroupsTable.cycleId, query.cycleId)) as typeof q;
    const groups = await q;
    res.json(groups);
  } catch (err) { next(err); }
});

router.post("/kpi-groups", requirePermission("config.create", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = CreateKpiGroupBody.parse(req.body);
    const [group] = await db.insert(kpiGroupsTable).values(body).returning();
    await logAudit(req, "create", "kpi_group", group.id, null, group);
    res.status(201).json(group);
  } catch (err) { next(err); }
});

router.patch("/kpi-groups/:id", requirePermission("config.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = UpdateKpiGroupParams.parse(req.params);
    const body = UpdateKpiGroupBody.parse(req.body);
    const [existing] = await db.select().from(kpiGroupsTable).where(eq(kpiGroupsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const [group] = await db.update(kpiGroupsTable).set(body).where(eq(kpiGroupsTable.id, id)).returning();
    await logAudit(req, "update", "kpi_group", group.id, existing, group);
    res.json(group);
  } catch (err) { next(err); }
});

router.get("/units-of-measure", async (req, res, next) => {
  try {
    const query = ListUnitsOfMeasureQueryParams.parse(req.query);
    let q = db.select().from(unitsOfMeasureTable);
    if (query.cycleId) q = q.where(eq(unitsOfMeasureTable.cycleId, query.cycleId)) as typeof q;
    const units = await q;
    res.json(units);
  } catch (err) { next(err); }
});

router.post("/units-of-measure", requirePermission("config.create", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = CreateUnitOfMeasureBody.parse(req.body);
    const [unit] = await db.insert(unitsOfMeasureTable).values(body).returning();
    await logAudit(req, "create", "unit_of_measure", unit.id, null, unit);
    res.status(201).json(unit);
  } catch (err) { next(err); }
});

router.patch("/units-of-measure/:id", requirePermission("config.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = UpdateUnitOfMeasureParams.parse(req.params);
    const body = UpdateUnitOfMeasureBody.parse(req.body);
    const [existing] = await db.select().from(unitsOfMeasureTable).where(eq(unitsOfMeasureTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const [unit] = await db.update(unitsOfMeasureTable).set(body).where(eq(unitsOfMeasureTable.id, id)).returning();
    await logAudit(req, "update", "unit_of_measure", unit.id, existing, unit);
    res.json(unit);
  } catch (err) { next(err); }
});

router.get("/data-types", async (_req, res, next) => {
  try {
    const types = await db.select().from(kpiDataTypesTable);
    res.json(types);
  } catch (err) { next(err); }
});

router.post("/data-types", requirePermission("config.create", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = CreateDataTypeBody.parse(req.body);
    const [dt] = await db.insert(kpiDataTypesTable).values(body).returning();
    await logAudit(req, "create", "data_type", dt.id, null, dt);
    res.status(201).json(dt);
  } catch (err) { next(err); }
});

router.patch("/data-types/:id", requirePermission("config.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = UpdateDataTypeParams.parse(req.params);
    const body = UpdateDataTypeBody.parse(req.body);
    const [existing] = await db.select().from(kpiDataTypesTable).where(eq(kpiDataTypesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const [dt] = await db.update(kpiDataTypesTable).set(body).where(eq(kpiDataTypesTable.id, id)).returning();
    await logAudit(req, "update", "data_type", dt.id, existing, dt);
    res.json(dt);
  } catch (err) { next(err); }
});

router.get("/progress-statuses", async (req, res, next) => {
  try {
    const query = ListProgressStatusesQueryParams.parse(req.query);
    let q = db.select().from(progressStatusesTable);
    if (query.cycleId) q = q.where(eq(progressStatusesTable.cycleId, query.cycleId)) as typeof q;
    const statuses = await q;
    res.json(statuses);
  } catch (err) { next(err); }
});

router.post("/progress-statuses", requirePermission("config.create", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = CreateProgressStatusBody.parse(req.body);
    const [status] = await db.insert(progressStatusesTable).values(body).returning();
    await logAudit(req, "create", "progress_status", status.id, null, status);
    res.status(201).json(status);
  } catch (err) { next(err); }
});

router.patch("/progress-statuses/:id", requirePermission("config.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = UpdateProgressStatusParams.parse(req.params);
    const body = UpdateProgressStatusBody.parse(req.body);
    const [existing] = await db.select().from(progressStatusesTable).where(eq(progressStatusesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const [status] = await db.update(progressStatusesTable).set(body).where(eq(progressStatusesTable.id, id)).returning();
    await logAudit(req, "update", "progress_status", status.id, existing, status);
    res.json(status);
  } catch (err) { next(err); }
});

router.get("/scorecard-types", async (_req, res, next) => {
  try {
    const types = await db.select().from(scorecardTypesTable);
    res.json(types);
  } catch (err) { next(err); }
});

router.post("/scorecard-types", requirePermission("config.create", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = CreateScorecardTypeBody.parse(req.body);
    const [st] = await db.insert(scorecardTypesTable).values(body).returning();
    await logAudit(req, "create", "scorecard_type", st.id, null, st);
    res.status(201).json(st);
  } catch (err) { next(err); }
});

router.patch("/scorecard-types/:id", requirePermission("config.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = UpdateScorecardTypeParams.parse(req.params);
    const body = UpdateScorecardTypeBody.parse(req.body);
    const [existing] = await db.select().from(scorecardTypesTable).where(eq(scorecardTypesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const [st] = await db.update(scorecardTypesTable).set(body).where(eq(scorecardTypesTable.id, id)).returning();
    await logAudit(req, "update", "scorecard_type", st.id, existing, st);
    res.json(st);
  } catch (err) { next(err); }
});

export default router;
