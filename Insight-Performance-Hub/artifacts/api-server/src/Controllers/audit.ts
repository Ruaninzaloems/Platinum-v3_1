import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { ListAuditLogsQueryParams } from "@workspace/api-zod";
import { requirePermission } from "../Middleware/auth";

const router: IRouter = Router();

router.get("/audit-logs", requirePermission("audit.view", "*"), async (req, res, next) => {
  try {
    const query = ListAuditLogsQueryParams.parse(req.query);
    const conditions = [];
    if (query.entityType) conditions.push(eq(auditLogsTable.entityType, query.entityType));
    if (query.entityId) conditions.push(eq(auditLogsTable.entityId, query.entityId));
    if (query.cycleId) conditions.push(eq(auditLogsTable.cycleId, query.cycleId));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = query.limit || 50;
    const offset = query.offset || 0;

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(auditLogsTable).where(where);
    const logs = await db.select().from(auditLogsTable).where(where).orderBy(desc(auditLogsTable.timestamp)).limit(limit).offset(offset);

    res.json({
      data: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        userName: l.userName,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        oldValue: l.oldValue,
        newValue: l.newValue,
        cycleId: l.cycleId,
        timestamp: l.timestamp.toISOString(),
      })),
      total: Number(countResult.count),
    });
  } catch (err) { next(err); }
});

export default router;
