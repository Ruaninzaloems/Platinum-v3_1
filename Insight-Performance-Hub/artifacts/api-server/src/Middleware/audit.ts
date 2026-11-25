import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db/schema";
import type { AuthenticatedRequest } from "./auth";

export async function logAudit(
  req: AuthenticatedRequest,
  action: string,
  entityType: string,
  entityId: number,
  oldValue?: Record<string, unknown> | null,
  newValue?: Record<string, unknown> | null,
  cycleId?: number | null
) {
  const user = req.user;
  await db.insert(auditLogsTable).values({
    userId: user?.id ?? 0,
    userName: user?.displayName ?? "System",
    action,
    entityType,
    entityId,
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
    cycleId: cycleId ?? null,
  });
}
