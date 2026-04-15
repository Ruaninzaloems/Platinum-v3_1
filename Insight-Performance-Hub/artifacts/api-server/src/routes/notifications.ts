import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notificationsTable, notificationConfigsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
  MarkNotificationReadParams,
  CreateNotificationConfigBody, UpdateNotificationConfigBody, UpdateNotificationConfigParams,
  ListNotificationConfigsQueryParams,
} from "@workspace/api-zod";
import { requirePermission } from "../middleware/auth";
import type { AuthenticatedRequest } from "../middleware/auth";
import { logAudit } from "../middleware/audit";

const router: IRouter = Router();

router.get("/notifications", async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const notifications = await db.select().from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(notificationsTable.id);
    res.json(notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })));
  } catch (err) { next(err); }
});

router.post("/notifications/:id/read", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = MarkNotificationReadParams.parse(req.params);
    const [existing] = await db.select().from(notificationsTable).where(eq(notificationsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.userId !== req.user!.id) { res.status(403).json({ error: "Cannot mark another user's notification" }); return; }
    const [n] = await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.id, id)).returning();
    res.json({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    });
  } catch (err) { next(err); }
});

router.get("/notification-configs", async (req, res, next) => {
  try {
    const query = ListNotificationConfigsQueryParams.parse(req.query);
    let q = db.select().from(notificationConfigsTable);
    if (query.cycleId) q = q.where(eq(notificationConfigsTable.cycleId, query.cycleId)) as typeof q;
    const configs = await q;
    res.json(configs);
  } catch (err) { next(err); }
});

router.post("/notification-configs", requirePermission("config.create", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = CreateNotificationConfigBody.parse(req.body);
    const [config] = await db.insert(notificationConfigsTable).values(body).returning();
    await logAudit(req, "create", "notification_config", config.id, null, config, body.cycleId);
    res.status(201).json(config);
  } catch (err) { next(err); }
});

router.patch("/notification-configs/:id", requirePermission("config.update", "*"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = UpdateNotificationConfigParams.parse(req.params);
    const body = UpdateNotificationConfigBody.parse(req.body);
    const [existing] = await db.select().from(notificationConfigsTable).where(eq(notificationConfigsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const [config] = await db.update(notificationConfigsTable).set(body).where(eq(notificationConfigsTable.id, id)).returning();
    await logAudit(req, "update", "notification_config", config.id, existing, config, existing.cycleId);
    res.json(config);
  } catch (err) { next(err); }
});

export default router;
