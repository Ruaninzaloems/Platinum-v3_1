import { db } from "@workspace/db";
import { scorecardKpisTable, scorecardsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export type Kpi = typeof scorecardKpisTable.$inferSelect;

/**
 * Effective KPI set resolution.
 * When a Revised SDBIP exists alongside the top-layer SDBIP, its KPIs
 * (matched by trimmed KPI number) supersede the top-layer ones so the same
 * KPI is never counted twice. KPIs added during revision are included as-is,
 * and top-layer KPIs without a revised counterpart remain in force.
 *
 * Returns:
 * - kpis: the effective KPI set for the cycle
 * - aliasToEffective: any KPI id (original or revised) → the effective KPI id
 *   that represents it, so actuals/evidence/links captured against either
 *   version resolve to the same effective KPI
 * - effectiveAliases: effective KPI id → all KPI ids whose records count for it
 */
export async function resolveEffectiveKpiSet(cycleId: number) {
  const scorecards = await db.select().from(scorecardsTable).where(eq(scorecardsTable.cycleId, cycleId));
  const scIds = scorecards.map(s => s.id);
  const allKpis = await db.select().from(scorecardKpisTable);
  const cycleKpis = allKpis.filter(k => scIds.includes(k.scorecardId));

  const scById = new Map(scorecards.map(s => [s.id, s]));
  // Only the top-layer (organisational) SDBIP is in force by default;
  // departmental-type scorecards never feed the organisational effective set.
  // A Revised SDBIP only supersedes the Original once it is Approved —
  // draft/submitted revisions must not leak into dashboards or reports.
  const revisedKpis = cycleKpis.filter(k => {
    const sc = scById.get(k.scorecardId);
    return sc?.scorecardType === "revised" && sc.status === "Approved";
  });
  const topKpis = cycleKpis.filter(k => scById.get(k.scorecardId)?.scorecardType === "organisational");

  // Latest revised KPI per KPI number wins if a revision was somehow duplicated.
  const revisedByNumber = new Map<string, Kpi>();
  for (const k of revisedKpis) {
    const key = k.kpiNumber.trim();
    const existing = revisedByNumber.get(key);
    if (!existing || k.id > existing.id) revisedByNumber.set(key, k);
  }

  const aliasToEffective = new Map<number, number>();
  const effectiveAliases = new Map<number, number[]>();
  const kpis: Kpi[] = [];

  if (revisedByNumber.size > 0) {
    const supersededByNumber = new Map<string, Kpi[]>();
    for (const k of topKpis) {
      const key = k.kpiNumber.trim();
      if (revisedByNumber.has(key)) {
        const arr = supersededByNumber.get(key) || [];
        arr.push(k);
        supersededByNumber.set(key, arr);
      } else {
        kpis.push(k);
        aliasToEffective.set(k.id, k.id);
        effectiveAliases.set(k.id, [k.id]);
      }
    }
    for (const [key, rk] of revisedByNumber) {
      kpis.push(rk);
      const aliases = [rk.id, ...(supersededByNumber.get(key) || []).map(k => k.id)];
      for (const id of aliases) aliasToEffective.set(id, rk.id);
      // Superseded revised duplicates (same number on the revised scorecard)
      // also alias to the winning revised KPI.
      for (const dup of revisedKpis) {
        if (dup.kpiNumber.trim() === key && dup.id !== rk.id) {
          aliasToEffective.set(dup.id, rk.id);
          aliases.push(dup.id);
        }
      }
      effectiveAliases.set(rk.id, aliases);
    }
  } else {
    for (const k of topKpis) {
      kpis.push(k);
      aliasToEffective.set(k.id, k.id);
      effectiveAliases.set(k.id, [k.id]);
    }
  }

  return { scorecards, cycleKpis, kpis, aliasToEffective, effectiveAliases };
}

/**
 * Remaps rows captured against any KPI version (original or revised) to the
 * effective KPI id, dropping rows whose KPI is not part of the cycle.
 */
export function remapByAlias<T extends { kpiId: number }>(rows: T[], aliasToEffective: Map<number, number>): T[] {
  const out: T[] = [];
  for (const r of rows) {
    const effId = aliasToEffective.get(r.kpiId);
    if (effId === undefined) continue;
    out.push(r.kpiId === effId ? r : { ...r, kpiId: effId });
  }
  return out;
}
