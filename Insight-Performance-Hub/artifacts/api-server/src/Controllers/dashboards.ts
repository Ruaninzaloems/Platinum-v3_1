import { Router } from "express";
import { db } from "@workspace/db";
import {
  scorecardKpisTable, scorecardsTable, kpiQuarterTargetsTable,
  kpiQuarterActualsTable, kpiEvidenceDocumentsTable, remedialActionPlansTable,
  individualAgreementsTable,
  constraintRegisterTable, deptScorecardsTable, deptScorecardKpisTable,
  submissionDeadlinesTable, nkpaWeightingsTable, kpiGroupsTable,
  kpiMonthActivitiesTable, performanceCyclesTable, unitsOfMeasureTable,
  usersTable, departmentsTable,
} from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { type AuthenticatedRequest } from "../Middleware/auth";
import { computeMfmaMilestones, MfmaMilestone, SDBIP_COMPLIANCE_REFERENCE } from "../Helpers/mfma-calendar";
import { resolveEffectiveKpiSet, remapByAlias } from "../Helpers/effective-kpis";

const router = Router();

/**
 * Quarters flagged N/A or On Hold must not affect graphs/statistics.
 * Returns a set of "kpiId:quarter" keys for flagged quarters.
 */
function flaggedQuarterKeys(targets: Array<{ kpiId: number; quarter: number; targetStatus?: string | null }>): Set<string> {
  const set = new Set<string>();
  for (const t of targets) {
    if ((t.targetStatus ?? "active") !== "active") set.add(`${t.kpiId}:${t.quarter}`);
  }
  return set;
}

router.get("/dashboards/executive", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }

  const { kpis, actuals, targets, kpiIds, aliasToEffective } = await getKpisAndActualsForCycle(cycleId, quarter, periodToQuarters(req.query.period));
  if (kpis.length === 0) {
    res.json({ totalKpis: 0, achieved: 0, notAchieved: 0, atRisk: 0, onHold: 0, weightedPerformance: 0, topUnderperforming: [], departmentScores: [], overdueSubmissions: 0, unresolvedCorrectiveActions: 0, evidenceOutstanding: 0, budgetRiskKpis: 0 });
    return;
  }

  let achieved = 0, notAchieved = 0, atRisk = 0, onHold = 0;
  const underperforming: Array<{ kpiId: number; kpiNumber: string; description: string; actualValue: string; targetValue: string; variance: number }> = [];

  const targetsByKpi = new Map<number, typeof kpiQuarterTargetsTable.$inferSelect[]>();
  for (const t of targets) {
    const arr = targetsByKpi.get(t.kpiId) || [];
    arr.push(t);
    targetsByKpi.set(t.kpiId, arr);
  }

  for (const kpi of kpis) {
    const kpiActuals = actuals.filter(a => a.kpiId === kpi.id);
    const latest = kpiActuals.sort((a, b) => b.quarter - a.quarter)[0];
    if (!latest) continue;
    if (latest.isOnHold) { onHold++; continue; }
    if (latest.isAchieved === true) { achieved++; }
    else if (latest.isAchieved === false) {
      notAchieved++;
      const targets = targetsByKpi.get(kpi.id) || [];
      const qt = targets.find(t => t.quarter === latest.quarter);
      // Prefer the stored score (covers AI-scored qualitative KPIs); fall
      // back to the numeric ratio for legacy rows without a score.
      let variance: number;
      if (latest.scorePct !== null && latest.scorePct !== undefined) {
        variance = latest.scorePct - 100;
      } else {
        const tVal = qt ? parseFloat(qt.targetValue) : 0;
        const aVal = parseFloat(latest.actualValue) || 0;
        variance = tVal !== 0 ? ((aVal - tVal) / tVal) * 100 : 0;
      }
      underperforming.push({ kpiId: kpi.id, kpiNumber: kpi.kpiNumber, description: kpi.description, actualValue: latest.actualValue, targetValue: qt?.targetValue || "0", variance });
    } else {
      atRisk++;
    }
  }

  underperforming.sort((a, b) => a.variance - b.variance);
  const top10 = underperforming.slice(0, 10);

  let weightedSum = 0, weightTotal = 0, scoreable = 0, achievedScoreable = 0;
  for (const kpi of kpis) {
    const kpiActuals = actuals.filter(a => a.kpiId === kpi.id);
    const latest = kpiActuals.sort((a, b) => b.quarter - a.quarter)[0];
    if (latest && latest.isAchieved !== null) {
      weightedSum += kpi.weighting * (latest.isAchieved ? 1 : 0);
      weightTotal += kpi.weighting;
      scoreable++;
      if (latest.isAchieved) achievedScoreable++;
    }
  }
  // Fall back to the unweighted rate when no weightings have been captured
  // yet (same basis as the trendline endpoint).
  const weightedPerformance = weightTotal > 0
    ? (weightedSum / weightTotal) * 100
    : scoreable > 0
      ? (achievedScoreable / scoreable) * 100
      : 0;

  const deptScs = await db.select().from(deptScorecardsTable).where(eq(deptScorecardsTable.cycleId, cycleId));
  const allDeptKpis = await db.select().from(deptScorecardKpisTable);
  const departmentScores = deptScs.map(d => {
    const dKpis = allDeptKpis.filter(k => k.deptScorecardId === d.id);
    // Map each inherited departmental KPI to the effective (revised-or-original)
    // parent KPI so its actuals are counted against the version in force.
    const parentKpiIds = new Set<number>();
    for (const k of dKpis) {
      if (!k.parentKpiId) continue;
      const effId = aliasToEffective.get(k.parentKpiId);
      if (effId !== undefined) parentKpiIds.add(effId);
    }
    const deptActuals = actuals.filter(a => parentKpiIds.has(a.kpiId));
    const achievedCount = deptActuals.filter(a => a.isAchieved === true).length;
    const totalCount = deptActuals.length;
    return {
      departmentId: d.departmentId,
      departmentName: d.departmentName,
      score: totalCount > 0 ? Math.round((achievedCount / totalCount) * 100) : 0,
      kpiCount: dKpis.length,
    };
  });

  const allEvidence = remapByAlias(await db.select().from(kpiEvidenceDocumentsTable), aliasToEffective);
  const evidenceOutstanding = allEvidence.filter(e => kpiIds.includes(e.kpiId) && e.verificationStatus === "Pending").length;

  const allRemedial = remapByAlias(await db.select().from(remedialActionPlansTable), aliasToEffective);
  const unresolvedCorrectiveActions = allRemedial.filter(r => kpiIds.includes(r.kpiId) && r.status === "Open").length;

  res.json({
    totalKpis: kpis.length,
    achieved,
    notAchieved,
    atRisk,
    onHold,
    weightedPerformance: Math.round(weightedPerformance * 100) / 100,
    topUnderperforming: top10,
    departmentScores,
    overdueSubmissions: await computeOverdueSubmissions(cycleId, kpiIds, actuals),
    unresolvedCorrectiveActions,
    evidenceOutstanding,
    budgetRiskKpis: kpis.filter(k => {
      if (!k.annualBudgetTarget || k.annualBudgetTarget <= 0) return false;
      const kpiActuals = actuals.filter(a => a.kpiId === k.id);
      const latest = kpiActuals.sort((a, b) => b.quarter - a.quarter)[0];
      return latest && latest.isAchieved === false;
    }).length,
  });
});

router.get("/dashboards/executive-insights", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }
  const periodQs = periodToQuarters(req.query.period);
  const qSet = periodQs ? new Set(periodQs) : null;
  const { kpis, actuals, kpiIds, aliasToEffective } = await getKpisAndActualsForCycle(cycleId, undefined, periodQs);

  const totalKpis = kpis.length;
  const capturedRecords = actuals.length;
  const capturedKpiIds = new Set(actuals.map(a => a.kpiId));
  const capturedKpis = capturedKpiIds.size;
  const notCaptured = Math.max(0, totalKpis - capturedKpis);

  // Latest actual per KPI decides its achievement bucket.
  let fullyAchieved = 0, partiallyAchieved = 0, notAchieved = 0;
  let scoreSum = 0, scoreCount = 0;
  for (const kpiId of Array.from(capturedKpiIds)) {
    const latest = actuals.filter(a => a.kpiId === kpiId).sort((a, b) => b.quarter - a.quarter)[0];
    if (!latest || latest.isOnHold) continue;
    const score = latest.scorePct !== null && latest.scorePct !== undefined
      ? latest.scorePct
      : latest.isAchieved === true ? 100 : latest.isAchieved === false ? 0 : null;
    if (score === null) continue;
    scoreSum += score; scoreCount++;
    if (score >= 100) fullyAchieved++;
    else if (score > 0) partiallyAchieved++;
    else notAchieved++;
  }
  const avgScore = scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 10) / 10 : 0;

  // Evidence coverage among captured KPIs (any quarterly evidence document).
  const allEvidence = remapByAlias(await db.select().from(kpiEvidenceDocumentsTable), aliasToEffective);
  const evidenceKpiIds = new Set(allEvidence.filter(e => e.periodType === "quarterly" && capturedKpiIds.has(e.kpiId) && (!qSet || qSet.has(e.quarter))).map(e => e.kpiId));
  const withEvidence = evidenceKpiIds.size;

  const allRemedial = remapByAlias(await db.select().from(remedialActionPlansTable), aliasToEffective);
  const openCorrectiveActions = allRemedial.filter(r => kpiIds.includes(r.kpiId) && r.status === "Open" && (!qSet || qSet.has(r.quarter))).length;

  const agreements = await db.select({ n: sql<number>`count(*)` }).from(individualAgreementsTable);
  const agreementCount = Number(agreements[0]?.n ?? 0);

  res.json({
    totalKpis, capturedRecords, capturedKpis, notCaptured,
    avgScore, fullyAchieved, partiallyAchieved, notAchieved,
    withEvidence, openCorrectiveActions, agreementCount,
  });
});

router.get("/dashboards/department/:departmentId", async (req: AuthenticatedRequest, res) => {
  const departmentId = Number(req.params.departmentId);
  const cycleId = Number(req.query.cycleId);
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }

  const deptScs = await db.select().from(deptScorecardsTable).where(
    and(eq(deptScorecardsTable.cycleId, cycleId), eq(deptScorecardsTable.departmentId, departmentId))
  );
  const deptSc = deptScs[0];

  const deptKpis = deptSc
    ? await db.select().from(deptScorecardKpisTable).where(eq(deptScorecardKpisTable.deptScorecardId, deptSc.id))
    : [];

  const { actuals, flagged, aliasToEffective } = await getKpisAndActualsForCycle(cycleId, undefined, periodToQuarters(req.query.period));
  // Map each inherited departmental KPI to the effective (revised-or-original)
  // parent KPI so its targets/actuals are counted against the version in force.
  const effParentOf = (k: typeof deptScorecardKpisTable.$inferSelect) =>
    k.parentKpiId ? aliasToEffective.get(k.parentKpiId) : undefined;
  const parentKpiIds = Array.from(new Set(deptKpis.map(effParentOf).filter((id): id is number => id !== undefined)));
  const allTargets = await db.select().from(kpiQuarterTargetsTable);
  const deptActuals = actuals.filter(a => parentKpiIds.includes(a.kpiId));

  const heatmap = deptKpis.map(k => {
    const effParent = effParentOf(k);
    const kpiActuals = effParent !== undefined ? deptActuals.filter(a => a.kpiId === effParent) : [];
    const statusForQ = (q: number) => {
      if (effParent !== undefined && flagged.has(`${effParent}:${q}`)) {
        const ft = allTargets.find(t => t.kpiId === effParent && t.quarter === q);
        return ft?.targetStatus === "on_hold" ? "On Hold" : "N/A";
      }
      const qa = kpiActuals.find(a => a.quarter === q);
      if (!qa) return "N/A";
      if (qa.isOnHold) return "On Hold";
      if (qa.isAchieved === true) return "Achieved";
      if (qa.isAchieved === false) return "Not Achieved";
      return "At Risk";
    };
    return {
      kpiId: k.id,
      kpiNumber: k.kpiNumber,
      description: k.description,
      q1Status: statusForQ(1),
      q2Status: statusForQ(2),
      q3Status: statusForQ(3),
      q4Status: statusForQ(4),
    };
  });

  const quarterTrend = [1, 2, 3, 4].map(q => {
    const qActuals = deptActuals.filter(a => a.quarter === q);
    const achievedCount = qActuals.filter(a => a.isAchieved === true).length;
    return { quarter: q, score: qActuals.length > 0 ? Math.round((achievedCount / qActuals.length) * 100) : 0 };
  });

  const achievedOverall = deptActuals.filter(a => a.isAchieved === true).length;
  const totalActuals = deptActuals.length;
  const overallScore = totalActuals > 0 ? Math.round((achievedOverall / totalActuals) * 100) : 0;

  const allEvidence = remapByAlias(await db.select().from(kpiEvidenceDocumentsTable), aliasToEffective);
  const deptEvidence = allEvidence.filter(e => parentKpiIds.includes(e.kpiId));
  const verifiedEvidence = deptEvidence.filter(e => e.verificationStatus === "Verified").length;
  const evidenceCompleteness = deptEvidence.length > 0 ? Math.round((verifiedEvidence / deptEvidence.length) * 100) : 0;

  const constraints = await db.select().from(constraintRegisterTable);
  const unresolvedConstraints = constraints.filter(c => c.departmentId === departmentId && c.status === "Open").length;

  res.json({
    departmentId,
    departmentName: deptSc?.departmentName || "Unknown",
    overallScore,
    kpiHeatmap: heatmap,
    quarterTrend,
    evidenceCompleteness,
    delayedActivities: 0,
    unresolvedConstraints,
  });
});

router.get("/dashboards/overview", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }

  const periodQs = periodToQuarters(req.query.period);
  const { kpis, actuals } = await getKpisAndActualsForCycle(cycleId, undefined, periodQs);

  const quarterComparison = (periodQs ?? [1, 2, 3, 4]).map(q => {
    const qActuals = actuals.filter(a => a.quarter === q);
    const ac = qActuals.filter(a => a.isAchieved === true).length;
    const na = qActuals.filter(a => a.isAchieved === false).length;
    return { quarter: q, achieved: ac, notAchieved: na, score: qActuals.length > 0 ? (ac / qActuals.length) * 100 : 0 };
  });

  const achievedTotal = actuals.filter(a => a.isAchieved === true).length;

  const exceptions = kpis
    .filter(k => {
      const la = actuals.filter(a => a.kpiId === k.id).sort((a, b) => b.quarter - a.quarter)[0];
      return la && la.isAchieved === false;
    })
    .slice(0, 10)
    .map(k => ({ kpiId: k.id, kpiNumber: k.kpiNumber, description: k.description, issue: "Not Achieved" }));

  res.json({
    orgSummary: {
      totalKpis: kpis.length,
      avgScore: actuals.length > 0 ? Math.round((achievedTotal / actuals.length) * 100 * 100) / 100 : 0,
      achievedPct: actuals.length > 0 ? Math.round((achievedTotal / actuals.length) * 100 * 100) / 100 : 0,
    },
    quarterComparison,
    annualTrend: [],
    exceptions,
  });
});

router.get("/dashboards/directorate-heatmap", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }

  // The heatmap always shows the full year (Q1–Q4) regardless of the
  // dashboard period filter — it is a year-at-a-glance view.
  const { kpis, actuals, flagged, kpiIds, effectiveAliases } = await getKpisAndActualsForCycle(cycleId, undefined, undefined);
  const allTargets = (await db.select().from(kpiQuarterTargetsTable)).filter(t => kpiIds.includes(t.kpiId));

  // Directorate attribution comes from the TOP-LAYER SDBIP (original +
  // revised effective set): each KPI belongs to the department of its
  // responsible post (fallback: custodian post; a revised KPI without posts
  // inherits its superseded counterpart's). Departmental SDBIPs are not
  // required for the heatmap.
  const allUsers = await db.select().from(usersTable);
  const allDepartments = await db.select().from(departmentsTable);
  const userDeptById = new Map(allUsers.map(u => [u.id, u.departmentId]));
  const deptNameById = new Map(allDepartments.map(d => [d.id, d.name]));
  const cycleKpiById = new Map(
    (await db.select().from(scorecardKpisTable)).map(k => [k.id, k])
  );
  const deptIdForKpi = (eff: typeof kpis[number]): number | null => {
    const postIds = [eff.responsiblePostId, eff.custodianPostId];
    for (const aliasId of effectiveAliases.get(eff.id) ?? []) {
      if (aliasId === eff.id) continue;
      const alias = cycleKpiById.get(aliasId);
      if (alias) postIds.push(alias.responsiblePostId, alias.custodianPostId);
    }
    for (const postId of postIds) {
      if (!postId) continue;
      const deptId = userDeptById.get(postId);
      if (deptId) return deptId;
    }
    return null;
  };

  const kpisByDept = new Map<number, typeof kpis>();
  for (const k of kpis) {
    const deptId = deptIdForKpi(k);
    if (deptId === null) continue;
    const list = kpisByDept.get(deptId) ?? [];
    list.push(k);
    kpisByDept.set(deptId, list);
  }

  const directorates = Array.from(kpisByDept.entries()).map(([deptId, deptKpis]) => {
    const quarters = [1, 2, 3, 4].map(q => {
      let onHoldCount = 0;
      const entries: { weight: number; scoreFrac: number }[] = [];
      for (const pk of deptKpis) {
        if (flagged.has(`${pk.id}:${q}`)) {
          const ft = allTargets.find(t => t.kpiId === pk.id && t.quarter === q);
          if (ft?.targetStatus === "on_hold") onHoldCount++;
          continue;
        }
        const qa = actuals.find(a => a.kpiId === pk.id && a.quarter === q);
        if (!qa) continue;
        if (qa.isOnHold) { onHoldCount++; continue; }
        // Prefer the stored score (formula/manual/AI); fall back to the
        // binary achieved flag when no score is available.
        const scoreFrac = qa.scorePct !== null && qa.scorePct !== undefined
          ? Math.max(0, Math.min(qa.scorePct, 100)) / 100
          : qa.isAchieved !== null ? (qa.isAchieved ? 1 : 0) : null;
        if (scoreFrac === null) continue;
        entries.push({ weight: pk.weighting, scoreFrac });
      }
      if (entries.length === 0) {
        return { quarter: q, status: onHoldCount > 0 ? "on_hold" : "no_data", performance: null as number | null };
      }
      // Use configured KPI weights when present; if none of the KPIs with
      // data carry a weighting, fall back to a plain unweighted average
      // rather than mixing real and synthetic weights.
      const configuredTotal = entries.reduce((s, e) => s + (e.weight > 0 ? e.weight : 0), 0);
      const performance = configuredTotal > 0
        ? Math.round((entries.reduce((s, e) => s + (e.weight > 0 ? e.weight * e.scoreFrac : 0), 0) / configuredTotal) * 100 * 100) / 100
        : Math.round((entries.reduce((s, e) => s + e.scoreFrac, 0) / entries.length) * 100 * 100) / 100;
      return { quarter: q, status: "active", performance };
    });

    return {
      departmentId: deptId,
      directorateName: deptNameById.get(deptId) ?? `Department ${deptId}`,
      quarters,
    };
  });

  directorates.sort((a, b) => a.directorateName.localeCompare(b.directorateName));
  res.json({ directorates });
});

// Global dashboard period filter: Q1–Q4 restrict to a single quarter,
// mid_year covers the first half of the financial year (Q1+Q2), annual (or
// absent) covers the full year.
const PERIOD_QUARTERS: Record<string, number[]> = {
  q1: [1], q2: [2], q3: [3], q4: [4], mid_year: [1, 2], annual: [1, 2, 3, 4],
};
function periodToQuarters(period: unknown): number[] | undefined {
  if (typeof period !== "string" || period === "" || period === "annual") return undefined;
  return PERIOD_QUARTERS[period];
}

/**
 * Actual-level Not Applicable flag: stored assessment or an N/A actual value.
 * On-hold rows may also carry an N/A actual value but stay in their own
 * On Hold bucket, so they are never treated as Not Applicable here.
 */
function isNotApplicableActual(a: { assessment?: string | null; actualValue: string; isOnHold: boolean }): boolean {
  if (a.isOnHold) return false;
  return a.assessment === "Not Applicable" || (a.actualValue ?? "").trim().toUpperCase() === "N/A";
}

async function getKpisAndActualsForCycle(cycleId: number, quarter?: number, quarters?: number[]) {
  const { kpis: effectiveKpis, aliasToEffective, effectiveAliases } = await resolveEffectiveKpiSet(cycleId);
  let kpis = effectiveKpis;
  const effectiveIds = new Set(kpis.map(k => k.id));

  // Targets come from the effective KPI only (revised targets supersede).
  const allTargets = await db.select().from(kpiQuarterTargetsTable);
  const flagged = flaggedQuarterKeys(allTargets.filter(t => effectiveIds.has(t.kpiId)));
  // When a specific quarter is requested, KPIs flagged N/A / On Hold for that
  // quarter are excluded entirely so they don't skew denominators.
  if (quarter) kpis = kpis.filter(k => !flagged.has(`${k.id}:${quarter}`));
  const qSet = quarters ? new Set(quarters) : quarter ? new Set([quarter]) : null;
  const keptIds = new Set(kpis.map(k => k.id));
  const kpiIds = kpis.map(k => k.id);

  // Actuals captured against either version count for the effective KPI;
  // if both versions have an actual for the same quarter, the latest wins.
  const allActuals = await db.select().from(kpiQuarterActualsTable);
  const chosen = new Map<string, typeof kpiQuarterActualsTable.$inferSelect>();
  for (const a of allActuals) {
    const effId = aliasToEffective.get(a.kpiId);
    if (effId === undefined || !keptIds.has(effId)) continue;
    // Mid-year/annual assessment captures live in the same table under a
    // different periodType; quarterly dashboards must not mix them in.
    if (a.periodType !== "quarterly") continue;
    if (qSet && !qSet.has(a.quarter)) continue;
    if (flagged.has(`${effId}:${a.quarter}`)) continue;
    const key = `${effId}:${a.quarter}`;
    const existing = chosen.get(key);
    if (!existing || a.id > existing.id) chosen.set(key, a);
  }
  // Actual-level "Not Applicable" captures (assessment or N/A actual value)
  // must not affect any statistics — drop them like target-flagged quarters.
  for (const [key, a] of Array.from(chosen.entries())) {
    if (isNotApplicableActual(a)) chosen.delete(key);
  }
  const actuals = Array.from(chosen.entries()).map(([key, a]) => {
    const effId = Number(key.split(":")[0]);
    return a.kpiId === effId ? a : { ...a, kpiId: effId };
  });

  const targets = allTargets.filter(t =>
    keptIds.has(t.kpiId) && !flagged.has(`${t.kpiId}:${t.quarter}`) && (!qSet || qSet.has(t.quarter)));
  return { kpis, actuals, targets, kpiIds, flagged, aliasToEffective, effectiveAliases };
}

router.get("/dashboards/nkpa-performance", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }

  const { kpis, actuals, aliasToEffective } = await getKpisAndActualsForCycle(cycleId, quarter);
  const nkpaWeightings = await db.select().from(nkpaWeightingsTable).where(eq(nkpaWeightingsTable.cycleId, cycleId));
  const kpiGroups = await db.select().from(kpiGroupsTable).where(eq(kpiGroupsTable.cycleId, cycleId));

  const groupMap = new Map(kpiGroups.map(g => [g.id, g.name]));

  const nkpaMap = new Map<string, { total: number; achieved: number; weighted: number; weightTotal: number }>();

  for (const kpi of kpis) {
    const nkpaName = kpi.kpiGroupId ? (groupMap.get(kpi.kpiGroupId) || "Ungrouped") : "Ungrouped";
    if (!nkpaMap.has(nkpaName)) nkpaMap.set(nkpaName, { total: 0, achieved: 0, weighted: 0, weightTotal: 0 });
    const entry = nkpaMap.get(nkpaName)!;
    entry.total++;
    const kpiActuals = actuals.filter(a => a.kpiId === kpi.id);
    const latest = kpiActuals.sort((a, b) => b.quarter - a.quarter)[0];
    if (latest && latest.isAchieved !== null) {
      entry.weightTotal += kpi.weighting;
      if (latest.isAchieved) {
        entry.achieved++;
        entry.weighted += kpi.weighting;
      }
    }
  }

  const byNkpa = Array.from(nkpaMap.entries()).map(([name, data]) => {
    const nkpaWeight = nkpaWeightings.find(w => w.nkpaName === name);
    return {
      nkpaName: name,
      totalKpis: data.total,
      achievedKpis: data.achieved,
      achievementRate: data.total > 0 ? Math.round((data.achieved / data.total) * 100 * 100) / 100 : 0,
      weightedScore: data.weightTotal > 0 ? Math.round((data.weighted / data.weightTotal) * 100 * 100) / 100 : 0,
      nkpaWeight: nkpaWeight?.weight || 0,
    };
  });

  const deptScs = await db.select().from(deptScorecardsTable).where(eq(deptScorecardsTable.cycleId, cycleId));
  const allDeptKpis = await db.select().from(deptScorecardKpisTable);

  const byDepartment = deptScs.map(d => {
    const dKpis = allDeptKpis.filter(k => k.deptScorecardId === d.id);
    const parentKpiIds = new Set(
      dKpis
        .filter(k => k.parentKpiId)
        .map(k => aliasToEffective.get(k.parentKpiId!))
        .filter((id): id is number => id !== undefined)
    );
    const deptActuals = actuals.filter(a => parentKpiIds.has(a.kpiId));
    const achievedCount = deptActuals.filter(a => a.isAchieved === true).length;
    return {
      departmentId: d.departmentId,
      departmentName: d.departmentName,
      totalKpis: dKpis.length,
      achievedKpis: achievedCount,
      achievementRate: deptActuals.length > 0 ? Math.round((achievedCount / deptActuals.length) * 100 * 100) / 100 : 0,
    };
  });

  res.json({ byNkpa, byDepartment });
});

router.get("/dashboards/kpi-status-summary", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }

  const { kpis, actuals } = await getKpisAndActualsForCycle(cycleId, quarter);

  let achieved = 0, notAchieved = 0, atRisk = 0, onHold = 0, noData = 0;
  for (const kpi of kpis) {
    const kpiActuals = actuals.filter(a => a.kpiId === kpi.id);
    const latest = kpiActuals.sort((a, b) => b.quarter - a.quarter)[0];
    if (!latest) { noData++; continue; }
    if (latest.isOnHold) { onHold++; }
    else if (latest.isAchieved === true) { achieved++; }
    else if (latest.isAchieved === false) { notAchieved++; }
    else { atRisk++; }
  }

  res.json({
    totalKpis: kpis.length,
    distribution: [
      { status: "Achieved", count: achieved, color: "#4caf50" },
      { status: "Not Achieved", count: notAchieved, color: "#ef5350" },
      { status: "At Risk", count: atRisk, color: "#f59e0b" },
      { status: "On Hold", count: onHold, color: "#94a3b8" },
      { status: "No Data", count: noData, color: "#cbd5e1" },
    ],
  });
});

router.get("/dashboards/financial-snapshot", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }

  const { kpis, actuals, targets, aliasToEffective } = await getKpisAndActualsForCycle(cycleId, quarter);
  const deptScs = await db.select().from(deptScorecardsTable).where(eq(deptScorecardsTable.cycleId, cycleId));
  const allDeptKpis = await db.select().from(deptScorecardKpisTable);

  const kpiRows = kpis
    .filter(k => k.annualBudgetTarget && k.annualBudgetTarget > 0)
    .map(k => {
      const kpiTargets = targets.filter(t => t.kpiId === k.id && (!quarter || t.quarter === quarter));
      const budgetAllocated = kpiTargets.reduce((s, t) => s + (t.budgetValue || 0), 0) || k.annualBudgetTarget || 0;
      const kpiActuals = actuals.filter(a => a.kpiId === k.id);
      const actualSpend = kpiActuals.reduce((s, a) => {
        const val = parseFloat(a.actualValue) || 0;
        return s + val;
      }, 0);
      const variance = budgetAllocated > 0 ? Math.round(((actualSpend - budgetAllocated) / budgetAllocated) * 100 * 100) / 100 : 0;
      return {
        kpiId: k.id,
        kpiNumber: k.kpiNumber,
        description: k.description,
        budgetAllocated: Math.round(budgetAllocated * 100) / 100,
        actualSpend: Math.round(actualSpend * 100) / 100,
        variance,
      };
    });

  const byDepartment = deptScs.map(d => {
    const dKpis = allDeptKpis.filter(k => k.deptScorecardId === d.id);
    const parentKpiIds = new Set(
      dKpis
        .filter(k => k.parentKpiId)
        .map(k => aliasToEffective.get(k.parentKpiId!))
        .filter((id): id is number => id !== undefined)
    );
    const deptKpis = kpis.filter(k => parentKpiIds.has(k.id));
    const budget = deptKpis.reduce((s, k) => s + (k.annualBudgetTarget || 0), 0);
    const deptActuals = actuals.filter(a => parentKpiIds.has(a.kpiId));
    const spend = deptActuals.reduce((s, a) => s + (parseFloat(a.actualValue) || 0), 0);
    return {
      departmentId: d.departmentId,
      departmentName: d.departmentName,
      budgetAllocated: Math.round(budget * 100) / 100,
      actualSpend: Math.round(spend * 100) / 100,
      variance: budget > 0 ? Math.round(((spend - budget) / budget) * 100 * 100) / 100 : 0,
    };
  });

  const totalBudget = kpiRows.reduce((s, r) => s + r.budgetAllocated, 0);
  const totalSpend = kpiRows.reduce((s, r) => s + r.actualSpend, 0);

  res.json({
    totalBudget: Math.round(totalBudget * 100) / 100,
    totalSpend: Math.round(totalSpend * 100) / 100,
    overallVariance: totalBudget > 0 ? Math.round(((totalSpend - totalBudget) / totalBudget) * 100 * 100) / 100 : 0,
    byKpi: kpiRows,
    byDepartment,
  });
});

router.get("/dashboards/trendline", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }

  const periodQs = periodToQuarters(req.query.period);
  const { kpis, actuals } = await getKpisAndActualsForCycle(cycleId, undefined, periodQs);
  const weightByKpi = new Map(kpis.map(k => [k.id, k.weighting]));

  const quartersToShow = quarter ? [quarter] : periodQs ?? [1, 2, 3, 4];
  const quarters = quartersToShow.map(q => {
    const qActuals = actuals.filter(a => a.quarter === q);
    const achieved = qActuals.filter(a => a.isAchieved === true).length;
    const notAchieved = qActuals.filter(a => a.isAchieved === false).length;
    const total = qActuals.length;

    // Weighted organisational score for the quarter (same weighting basis as the executive gauge)
    let weightedSum = 0, weightTotal = 0, scoreable = 0, achievedScoreable = 0;
    for (const a of qActuals) {
      if (a.isAchieved === null || a.isOnHold) continue;
      const w = weightByKpi.get(a.kpiId) ?? 0;
      weightedSum += w * (a.isAchieved ? 1 : 0);
      weightTotal += w;
      scoreable++;
      if (a.isAchieved) achievedScoreable++;
    }
    // Fall back to the unweighted rate when no weightings have been captured yet.
    const score = weightTotal > 0
      ? Math.round((weightedSum / weightTotal) * 100 * 100) / 100
      : scoreable > 0
        ? Math.round((achievedScoreable / scoreable) * 100 * 100) / 100
        : null;

    return {
      quarter: q,
      achievementRate: total > 0 ? Math.round((achieved / total) * 100 * 100) / 100 : 0,
      achieved,
      notAchieved,
      total,
      score,
      target: 100,
    };
  });

  let prevRate = 0;
  const withComparison = quarters.map((q, i) => {
    const change = i > 0 ? Math.round((q.achievementRate - prevRate) * 100) / 100 : 0;
    prevRate = q.achievementRate;
    return { ...q, periodChange: change };
  });

  res.json({ quarters: withComparison, totalKpis: kpis.length });
});

router.get("/dashboards/org-scorecard", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }

  const periodQs = periodToQuarters(req.query.period);
  const qSet = quarter ? new Set([quarter]) : periodQs ? new Set(periodQs) : null;

  const { cycleKpis, kpis, aliasToEffective, effectiveAliases } = await resolveEffectiveKpiSet(cycleId);

  const effectiveIds = new Set(kpis.map(k => k.id));
  const allAliasIds = new Set(aliasToEffective.keys());

  // Targets come from the effective KPI only (revised targets supersede).
  const allTargets = (await db.select().from(kpiQuarterTargetsTable))
    .filter(t => effectiveIds.has(t.kpiId) && (!qSet || qSet.has(t.quarter)));
  // Actuals captured against either version count for the effective KPI.
  const allActuals = (await db.select().from(kpiQuarterActualsTable))
    .filter(a => allAliasIds.has(a.kpiId) && a.periodType === "quarterly" && (!qSet || qSet.has(a.quarter)));

  const actualByKey = new Map<string, typeof kpiQuarterActualsTable.$inferSelect>();
  for (const a of allActuals) {
    const effId = aliasToEffective.get(a.kpiId)!;
    const key = `${effId}:${a.quarter}`;
    const existing = actualByKey.get(key);
    if (!existing || a.id > existing.id) actualByKey.set(key, a);
  }

  type StatusKey = "achieved" | "partiallyAchieved" | "notAchieved" | "overAchieved" | "onHold" | "notApplicable" | "unableToAssess";

  const classify = (t: typeof kpiQuarterTargetsTable.$inferSelect): StatusKey | null => {
    const ts = t.targetStatus ?? "active";
    if (ts === "on_hold") return "onHold";
    if (ts !== "active") return "notApplicable";
    const a = actualByKey.get(`${t.kpiId}:${t.quarter}`);
    if (!a) return null; // no actual captured yet — counted in targets set only
    if (a.isOnHold) return "onHold";
    // Prefer the stored assessment (score/threshold-based, incl. AI-scored
    // qualitative KPIs); fall back to numeric heuristics for legacy rows.
    switch (a.assessment) {
      case "Over Achieved": return "overAchieved";
      case "Achieved": return "achieved";
      case "Partially Achieved": return "partiallyAchieved";
      case "Not Achieved": return "notAchieved";
      case "On Hold": return "onHold";
      case "Not Applicable": return "notApplicable";
      case "Unable to Assess": return "unableToAssess";
    }
    if (a.isAchieved === null) return "unableToAssess";
    const tVal = parseFloat(t.targetValue);
    const aVal = parseFloat(a.actualValue);
    const numeric = Number.isFinite(tVal) && Number.isFinite(aVal);
    if (a.isAchieved) {
      if (numeric && aVal > tVal) return "overAchieved";
      return "achieved";
    }
    if (numeric && tVal > 0 && aVal > 0 && aVal < tVal) return "partiallyAchieved";
    return "notAchieved";
  };

  const emptyCounts = () => ({
    targetsSet: 0, achieved: 0, partiallyAchieved: 0, notAchieved: 0,
    overAchieved: 0, onHold: 0, notApplicable: 0, unableToAssess: 0,
  });
  type Counts = ReturnType<typeof emptyCounts>;

  const tally = (counts: Counts, t: typeof kpiQuarterTargetsTable.$inferSelect) => {
    counts.targetsSet++;
    const s = classify(t);
    if (s) counts[s]++;
  };

  const kpiGroups = await db.select().from(kpiGroupsTable).where(eq(kpiGroupsTable.cycleId, cycleId));
  const groupMap = new Map(kpiGroups.map(g => [g.id, g.name]));
  const kpiById = new Map(kpis.map(k => [k.id, k]));

  // Carry the National KPA through from any version of the KPI: a revised
  // KPI without an explicit group inherits its superseded counterpart's group.
  const kpiByIdAll = new Map(cycleKpis.map(k => [k.id, k]));
  const groupNameFor = (kpi: typeof scorecardKpisTable.$inferSelect): string => {
    if (kpi.kpiGroupId) return groupMap.get(kpi.kpiGroupId) || "Ungrouped";
    for (const aliasId of effectiveAliases.get(kpi.id) || []) {
      const alias = kpiByIdAll.get(aliasId);
      if (alias?.kpiGroupId) return groupMap.get(alias.kpiGroupId) || "Ungrouped";
    }
    return "Ungrouped";
  };

  const nkpaMap = new Map<string, Counts>();
  for (const t of allTargets) {
    const kpi = kpiById.get(t.kpiId);
    if (!kpi) continue;
    const name = groupNameFor(kpi);
    if (!nkpaMap.has(name)) nkpaMap.set(name, emptyCounts());
    tally(nkpaMap.get(name)!, t);
  }
  const byNkpa = Array.from(nkpaMap.entries())
    .map(([name, counts]) => ({ name, ...counts }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Department attribution comes from the TOP-LAYER SDBIP only: each KPI's
  // responsible post (user) belongs to a department. A revised KPI without a
  // responsible post inherits its superseded counterpart's. Departmental
  // SDBIPs are deliberately NOT consulted here.
  const allUsers = await db.select().from(usersTable);
  const allDepartments = await db.select().from(departmentsTable);
  const userDeptById = new Map(allUsers.map(u => [u.id, u.departmentId]));
  const deptNameById = new Map(allDepartments.map(d => [d.id, d.name]));
  const deptNameFor = (kpi: typeof scorecardKpisTable.$inferSelect): string | null => {
    const postIds = [kpi.responsiblePostId, kpi.custodianPostId];
    for (const aliasId of effectiveAliases.get(kpi.id) || []) {
      const alias = kpiByIdAll.get(aliasId);
      if (alias) postIds.push(alias.responsiblePostId, alias.custodianPostId);
    }
    for (const postId of postIds) {
      if (!postId) continue;
      const deptId = userDeptById.get(postId);
      if (deptId) return deptNameById.get(deptId) ?? null;
    }
    return null;
  };

  const deptMap = new Map<string, Counts>();
  for (const t of allTargets) {
    const kpi = kpiById.get(t.kpiId);
    if (!kpi) continue;
    const name = deptNameFor(kpi) ?? "Unassigned";
    if (!deptMap.has(name)) deptMap.set(name, emptyCounts());
    tally(deptMap.get(name)!, t);
  }
  const byDepartment = Array.from(deptMap.entries())
    .map(([name, counts]) => ({ name, ...counts }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalOf = (rows: Array<Counts & { name: string }>): Counts => {
    const total = emptyCounts();
    for (const r of rows) {
      total.targetsSet += r.targetsSet;
      total.achieved += r.achieved;
      total.partiallyAchieved += r.partiallyAchieved;
      total.notAchieved += r.notAchieved;
      total.overAchieved += r.overAchieved;
      total.onHold += r.onHold;
      total.notApplicable += r.notApplicable;
      total.unableToAssess += r.unableToAssess;
    }
    return total;
  };

  res.json({
    byNkpa,
    nkpaTotal: totalOf(byNkpa),
    byDepartment,
    departmentTotal: totalOf(byDepartment),
  });
});

router.get("/dashboards/top-underperforming", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }

  const { kpis, actuals, targets } = await getKpisAndActualsForCycle(cycleId, quarter);

  const targetsByKpi = new Map<number, typeof kpiQuarterTargetsTable.$inferSelect[]>();
  for (const t of targets) {
    const arr = targetsByKpi.get(t.kpiId) || [];
    arr.push(t);
    targetsByKpi.set(t.kpiId, arr);
  }

  const underperforming: Array<{
    kpiId: number; kpiNumber: string; description: string;
    targetValue: string; actualValue: string; variance: number;
    quarter: number;
  }> = [];

  for (const kpi of kpis) {
    const kpiActuals = actuals.filter(a => a.kpiId === kpi.id);
    const latest = kpiActuals.sort((a, b) => b.quarter - a.quarter)[0];
    if (!latest || latest.isAchieved !== false) continue;
    const kpiTargets = targetsByKpi.get(kpi.id) || [];
    const qt = kpiTargets.find(t => t.quarter === latest.quarter);
    // Prefer the stored score (covers AI-scored qualitative KPIs).
    let variance: number;
    if (latest.scorePct !== null && latest.scorePct !== undefined) {
      variance = Math.round((latest.scorePct - 100) * 100) / 100;
    } else {
      const tVal = qt ? parseFloat(qt.targetValue) : 0;
      const aVal = parseFloat(latest.actualValue) || 0;
      variance = tVal !== 0 ? Math.round(((aVal - tVal) / tVal) * 100 * 100) / 100 : 0;
    }
    underperforming.push({
      kpiId: kpi.id, kpiNumber: kpi.kpiNumber, description: kpi.description,
      targetValue: qt?.targetValue || "0", actualValue: latest.actualValue,
      variance, quarter: latest.quarter,
    });
  }

  underperforming.sort((a, b) => a.variance - b.variance);

  res.json({ items: underperforming.slice(0, 5) });
});

router.get("/dashboards/dept-ranking", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }

  const { kpis, actuals, aliasToEffective } = await getKpisAndActualsForCycle(cycleId, quarter);
  const deptScs = await db.select().from(deptScorecardsTable).where(eq(deptScorecardsTable.cycleId, cycleId));
  const allDeptKpis = await db.select().from(deptScorecardKpisTable);

  const rankings = deptScs.map(d => {
    const dKpis = allDeptKpis.filter(k => k.deptScorecardId === d.id);
    const parentKpiIds = new Set(
      dKpis
        .filter(k => k.parentKpiId)
        .map(k => aliasToEffective.get(k.parentKpiId!))
        .filter((id): id is number => id !== undefined)
    );
    const deptActuals = actuals.filter(a => parentKpiIds.has(a.kpiId));
    const parentKpis = kpis.filter(k => parentKpiIds.has(k.id));

    let weightedSum = 0, weightTotal = 0;
    for (const pk of parentKpis) {
      const la = deptActuals.filter(a => a.kpiId === pk.id).sort((a, b) => b.quarter - a.quarter)[0];
      if (la && la.isAchieved !== null) {
        weightedSum += pk.weighting * (la.isAchieved ? 1 : 0);
        weightTotal += pk.weighting;
      }
    }

    const achievedCount = deptActuals.filter(a => a.isAchieved === true).length;
    return {
      departmentId: d.departmentId,
      departmentName: d.departmentName,
      weightedScore: weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 100 * 100) / 100 : 0,
      totalKpis: dKpis.length,
      achievedKpis: achievedCount,
      achievementRate: deptActuals.length > 0 ? Math.round((achievedCount / deptActuals.length) * 100 * 100) / 100 : 0,
    };
  });

  rankings.sort((a, b) => b.weightedScore - a.weightedScore);
  const ranked = rankings.map((r, i) => ({ ...r, rank: i + 1 }));

  res.json({ rankings: ranked });
});

router.get("/dashboards/evidence-compliance", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }

  const { kpis, kpiIds, aliasToEffective } = await getKpisAndActualsForCycle(cycleId, quarter);
  const allEvidence = remapByAlias(await db.select().from(kpiEvidenceDocumentsTable), aliasToEffective);
  const evidence = allEvidence.filter(e => kpiIds.includes(e.kpiId) && (!quarter || e.quarter === quarter));

  const totalDocs = evidence.length;
  const submitted = evidence.length;
  const verified = evidence.filter(e => e.verificationStatus === "Verified").length;
  const pending = evidence.filter(e => e.verificationStatus === "Pending").length;
  const rejected = evidence.filter(e => e.verificationStatus === "Rejected").length;

  const deptScs = await db.select().from(deptScorecardsTable).where(eq(deptScorecardsTable.cycleId, cycleId));
  const allDeptKpis = await db.select().from(deptScorecardKpisTable);

  const byDepartment = deptScs.map(d => {
    const dKpis = allDeptKpis.filter(k => k.deptScorecardId === d.id);
    const parentKpiIds = new Set(
      dKpis
        .filter(k => k.parentKpiId)
        .map(k => aliasToEffective.get(k.parentKpiId!))
        .filter((id): id is number => id !== undefined)
    );
    const deptEvidence = evidence.filter(e => parentKpiIds.has(e.kpiId));
    const deptVerified = deptEvidence.filter(e => e.verificationStatus === "Verified").length;
    const deptPending = deptEvidence.filter(e => e.verificationStatus === "Pending").length;
    const deptRejected = deptEvidence.filter(e => e.verificationStatus === "Rejected").length;
    return {
      departmentId: d.departmentId,
      departmentName: d.departmentName,
      totalDocuments: deptEvidence.length,
      verified: deptVerified,
      pending: deptPending,
      rejected: deptRejected,
      completenessRate: deptEvidence.length > 0 ? Math.round((deptVerified / deptEvidence.length) * 100 * 100) / 100 : 0,
    };
  });

  const byKpi = kpis.map(k => {
    const kpiEvidence = evidence.filter(e => e.kpiId === k.id);
    const kpiVerified = kpiEvidence.filter(e => e.verificationStatus === "Verified").length;
    return {
      kpiId: k.id,
      kpiNumber: k.kpiNumber,
      description: k.description,
      totalDocuments: kpiEvidence.length,
      verified: kpiVerified,
      completenessRate: kpiEvidence.length > 0 ? Math.round((kpiVerified / kpiEvidence.length) * 100 * 100) / 100 : 0,
    };
  });

  res.json({
    summary: { totalDocuments: totalDocs, submitted, verified, pending, rejected,
      verificationRate: totalDocs > 0 ? Math.round((verified / totalDocs) * 100 * 100) / 100 : 0 },
    byDepartment,
    byKpi,
  });
});

router.get("/dashboards/municipal-health", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }

  // Health score is a full-year (Q1–Q4) view over the effective top-layer
  // SDBIP set (Original + Revised: revised KPIs supersede originals, and
  // actuals captured against either version count via aliasing).
  const { kpis, actuals, kpiIds, aliasToEffective } = await getKpisAndActualsForCycle(cycleId, undefined, undefined);

  const kpiById = new Map(kpis.map(k => [k.id, k]));
  const captured = actuals.filter(a => !a.isOnHold);

  // Performance: weighted score across all captured Q1–Q4 actuals.
  // Prefer the stored score (formula/manual/AI); fall back to the binary
  // achieved flag. Uses configured KPI weights when present, otherwise a
  // plain unweighted average (same logic as the directorate heatmap).
  const perfEntries: { weight: number; scoreFrac: number }[] = [];
  for (const a of captured) {
    const kpi = kpiById.get(a.kpiId);
    if (!kpi) continue;
    const scoreFrac = a.scorePct !== null && a.scorePct !== undefined
      ? Math.max(0, Math.min(a.scorePct, 100)) / 100
      : a.isAchieved !== null ? (a.isAchieved ? 1 : 0) : null;
    if (scoreFrac === null) continue;
    perfEntries.push({ weight: kpi.weighting, scoreFrac });
  }
  const perfWeightTotal = perfEntries.reduce((s, e) => s + (e.weight > 0 ? e.weight : 0), 0);
  const performance = perfEntries.length === 0 ? null
    : perfWeightTotal > 0
      ? (perfEntries.reduce((s, e) => s + (e.weight > 0 ? e.weight * e.scoreFrac : 0), 0) / perfWeightTotal) * 100
      : (perfEntries.reduce((s, e) => s + e.scoreFrac, 0) / perfEntries.length) * 100;

  // Evidence (POE) compliance: share of captured actuals that have at
  // least one portfolio-of-evidence document attached for that KPI+quarter.
  const allEvidence = remapByAlias(await db.select().from(kpiEvidenceDocumentsTable), aliasToEffective);
  const evidenceKeys = new Set(
    allEvidence
      .filter(e => kpiIds.includes(e.kpiId))
      .map(e => `${e.periodType}:${e.kpiId}:${e.quarter}`)
  );
  const evidenceCompliance = captured.length > 0
    ? (captured.filter(a => evidenceKeys.has(`${a.periodType}:${a.kpiId}:${a.quarter}`)).length / captured.length) * 100
    : null;

  // Workflow efficiency: how far each captured actual has progressed
  // through the review workflow (submit → manager → PMS → internal audit).
  // Each actual earns credit for the steps completed out of 4.
  const workflowSteps = (a: typeof captured[number]): number => {
    if (a.status === "Approved") return 4;
    if (a.status === "In Review") {
      if (a.reviewLevel === "internal_audit") return 3; // PMS approved
      if (PMS_LEVELS.has(a.reviewLevel ?? "")) return 2; // manager approved
      return 1; // submitted
    }
    if (a.status === "Returned") {
      if (a.reviewLevel === "internal_audit") return 3;
      if (PMS_LEVELS.has(a.reviewLevel ?? "")) return 2;
      return 1;
    }
    return 0; // Draft / saved only
  };
  const workflowEfficiency = captured.length > 0
    ? (captured.reduce((s, a) => s + workflowSteps(a), 0) / (captured.length * 4)) * 100
    : null;

  const dims = [performance, evidenceCompliance, workflowEfficiency].filter((v): v is number => v !== null);
  const hasData = dims.length > 0;
  const composite = dims.length > 0 ? dims.reduce((s, v) => s + v, 0) / dims.length : 0;

  const band =
    composite >= 90 ? "EXCELLENT" :
    composite >= 75 ? "GOOD STANDING" :
    composite >= 50 ? "NEEDS ATTENTION" : "CRITICAL";

  const r1 = (v: number | null) => v === null ? 0 : Math.round(v * 10) / 10;
  res.json({
    performance: r1(performance),
    evidenceCompliance: r1(evidenceCompliance),
    workflowEfficiency: r1(workflowEfficiency),
    composite: Math.round(composite * 10) / 10,
    band: hasData ? band : "NO DATA",
    hasData,
  });
});

const MANAGER_LEVELS = new Set(["line_manager", "director"]);
const PMS_LEVELS = new Set(["pms_manager", "pms_director"]);

/**
 * Indicator status vocabulary for the org indicator status dashboard:
 * Not Captured | Saved | Pending Manager Review | Returned by Manager |
 * Pending PMS Review | Returned by PMS Office | PMS Approved (Finalised) |
 * Approved by Internal Audit | Returned by Internal Audit | Cascaded
 */
function actualStatusLabel(a: { status: string; reviewLevel: string | null }): string {
  const lvl = a.reviewLevel ?? "";
  switch (a.status) {
    case "Approved": return "Approved by Internal Audit";
    case "In Review":
      if (MANAGER_LEVELS.has(lvl)) return "Pending Manager Review";
      if (PMS_LEVELS.has(lvl)) return "Pending PMS Review";
      if (lvl === "internal_audit") return "PMS Approved (Finalised)";
      return "Pending Manager Review";
    case "Returned":
      if (PMS_LEVELS.has(lvl)) return "Returned by PMS Office";
      if (lvl === "internal_audit") return "Returned by Internal Audit";
      return "Returned by Manager";
    default: return "Saved";
  }
}

function parseNumeric(v: string | null | undefined): number | null {
  if (!v) return null;
  const m = String(v).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

router.get("/dashboards/org-indicator-status", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }

  const { kpis, actuals, targets, effectiveAliases } = await getKpisAndActualsForCycle(cycleId, undefined, periodToQuarters(req.query.period));

  const groups = await db.select().from(kpiGroupsTable).where(eq(kpiGroupsTable.cycleId, cycleId));
  const groupById = new Map(groups.map(g => [g.id, g.name]));

  const uoms = await db.select().from(unitsOfMeasureTable).where(eq(unitsOfMeasureTable.cycleId, cycleId));
  const uomById = new Map(uoms.map(u => [u.id, u.name]));

  // Department attribution comes from the TOP-LAYER SDBIP only: the KPI's
  // responsible post (fallback: custodian post) belongs to a department. A
  // revised KPI without posts inherits its superseded counterpart's.
  // Departmental SDBIPs are deliberately NOT consulted for this.
  const allUsers = await db.select().from(usersTable);
  const allDepartments = await db.select().from(departmentsTable);
  const userDeptById = new Map(allUsers.map(u => [u.id, u.departmentId]));
  const deptNameById = new Map(allDepartments.map(d => [d.id, d.name]));
  const kpiByIdForDept = new Map(kpis.map(k => [k.id, k]));
  const cycleKpiById = new Map(
    (await db.select().from(scorecardKpisTable)).map(k => [k.id, k])
  );
  const deptForKpi = (effId: number): string | null => {
    const eff = kpiByIdForDept.get(effId);
    if (!eff) return null;
    const postIds = [eff.responsiblePostId, eff.custodianPostId];
    for (const aliasId of effectiveAliases.get(effId) ?? []) {
      if (aliasId === effId) continue;
      const alias = cycleKpiById.get(aliasId);
      if (alias) postIds.push(alias.responsiblePostId, alias.custodianPostId);
    }
    for (const postId of postIds) {
      if (!postId) continue;
      const deptId = userDeptById.get(postId);
      if (deptId) return deptNameById.get(deptId) ?? null;
    }
    return null;
  };

  // "Cascaded" status detection still checks whether any department scorecard
  // KPI inherits from any version of the effective KPI.
  const deptScorecards = await db.select().from(deptScorecardsTable).where(eq(deptScorecardsTable.cycleId, cycleId));
  const deptScIds = new Set(deptScorecards.map(d => d.id));
  const deptKpis = await db.select().from(deptScorecardKpisTable);
  const cascadedParents = new Set<number>();
  for (const dk of deptKpis) {
    if (dk.parentKpiId !== null && deptScIds.has(dk.deptScorecardId)) cascadedParents.add(dk.parentKpiId);
  }
  const isCascaded = (effId: number): boolean =>
    (effectiveAliases.get(effId) ?? [effId]).some(alias => cascadedParents.has(alias));

  const targetFor = (kpiId: number, quarter: number) =>
    targets.find(t => t.kpiId === kpiId && t.quarter === quarter);

  const kpiById = new Map(kpis.map(k => [k.id, k]));

  const rows = actuals
    .map(a => {
      const k = kpiById.get(a.kpiId);
      if (!k) return null;
      const unit = k.unitOfMeasureId ? uomById.get(k.unitOfMeasureId) ?? null : null;
      const t = targetFor(a.kpiId, a.quarter);
      const tNum = parseNumeric(t?.targetValue);
      const aNum = parseNumeric(a.actualValue);
      let score: number | null = null;
      if (a.scorePct !== null && a.scorePct !== undefined) {
        // Stored score covers formula-, manual- and AI-scored actuals.
        score = a.scorePct;
      } else if (tNum !== null && aNum !== null && tNum !== 0) {
        score = Math.round((aNum / tNum) * 1000) / 10;
      } else if (a.isAchieved !== null) {
        score = a.isAchieved ? 100 : 0;
      }
      return {
        kpiId: k.id,
        kpiNumber: k.kpiNumber,
        department: deptForKpi(k.id),
        nationalKpa: k.kpiGroupId ? groupById.get(k.kpiGroupId) ?? null : null,
        indicator: k.description,
        quarter: a.quarter,
        target: t?.targetValue ?? null,
        actual: a.actualValue,
        unit,
        score,
        status: actualStatusLabel(a),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  // KPI quarters with an active target but no captured actual appear as
  // "Cascaded" (indicator has been cascaded to a department) or "Not Captured".
  const capturedKeys = new Set(actuals.map(a => `${a.kpiId}:${a.quarter}`));
  for (const t of targets) {
    if (capturedKeys.has(`${t.kpiId}:${t.quarter}`)) continue;
    const k = kpiById.get(t.kpiId);
    if (!k) continue;
    rows.push({
      kpiId: k.id,
      kpiNumber: k.kpiNumber,
      department: deptForKpi(k.id),
      nationalKpa: k.kpiGroupId ? groupById.get(k.kpiGroupId) ?? null : null,
      indicator: k.description,
      quarter: t.quarter,
      target: t.targetValue,
      actual: "",
      unit: k.unitOfMeasureId ? uomById.get(k.unitOfMeasureId) ?? null : null,
      score: null,
      status: isCascaded(k.id) ? "Cascaded" : "Not Captured",
    });
  }

  rows.sort((a, b) => a.quarter - b.quarter || a.kpiNumber.localeCompare(b.kpiNumber, undefined, { numeric: true }));

  const summary = new Map<string, number>();
  for (const r of rows) summary.set(r.status, (summary.get(r.status) ?? 0) + 1);

  res.json({
    rows,
    summary: Array.from(summary.entries()).map(([status, count]) => ({ status, count })),
    total: rows.length,
  });
});

router.get("/dashboards/milestones", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }

  const { kpis, kpiIds, aliasToEffective } = await getKpisAndActualsForCycle(cycleId);
  const kpiById = new Map(kpis.map(k => [k.id, k]));

  const allActivities = remapByAlias(await db.select().from(kpiMonthActivitiesTable), aliasToEffective);
  const activities = allActivities
    .filter(a => kpiIds.includes(a.kpiId) && (!quarter || a.quarter === quarter))
    .sort((a, b) => a.quarter - b.quarter || a.month - b.month || a.id - b.id);

  const now = new Date();
  const items = activities.map(a => {
    const k = kpiById.get(a.kpiId);
    const overdue = a.status !== "Completed" && new Date(a.dueDate) < now;
    return {
      id: a.id,
      kpiId: a.kpiId,
      kpiNumber: k?.kpiNumber ?? "",
      kpiDescription: k?.description ?? "",
      quarter: a.quarter,
      month: a.month,
      description: a.description,
      dueDate: a.dueDate,
      status: overdue ? "Overdue" : a.status,
    };
  });

  const completed = items.filter(i => i.status === "Completed").length;
  const overdue = items.filter(i => i.status === "Overdue").length;
  const inProgress = items.filter(i => i.status === "In Progress").length;
  const pending = items.length - completed - overdue - inProgress;

  res.json({
    summary: { total: items.length, completed, inProgress, pending, overdue },
    items,
  });
});

/**
 * Statutory MFMA/OPMS compliance calendar derived from the cycle's financial
 * year dates. Dates are computed, not manually captured.
 */
router.get("/dashboards/mfma-calendar", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }

  const cycles = await db.select().from(performanceCyclesTable).where(eq(performanceCyclesTable.id, cycleId));
  const cycle = cycles[0];
  if (!cycle) { res.status(404).json({ error: "Cycle not found" }); return; }

  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const items = computeMfmaMilestones(cycle.startDate, cycle.endDate).map(m => {
    const daysRemaining = Math.round((new Date(`${m.dueDate}T00:00:00Z`).getTime() - todayUtc) / 86400000);
    return {
      ...m,
      daysRemaining,
      status: daysRemaining < 0 ? "Elapsed" : daysRemaining <= 30 ? "Due Soon" : "Upcoming",
    };
  });

  res.json({ financialYearLabel: cycle.financialYearLabel, items });
});

/**
 * Read-only SDBIP compliance reference for the OPMS config area. When a
 * cycleId is supplied, each statutory row also carries the live due dates
 * from the same computeMfmaMilestones source the dashboard calendar uses.
 */
router.get("/dashboards/sdbip-compliance-reference", async (req: AuthenticatedRequest, res) => {
  const cycleId = req.query.cycleId ? Number(req.query.cycleId) : null;
  let financialYearLabel: string | null = null;
  let milestoneByKey = new Map<string, MfmaMilestone>();
  if (cycleId) {
    const [cycle] = await db.select().from(performanceCyclesTable).where(eq(performanceCyclesTable.id, cycleId));
    if (cycle) {
      financialYearLabel = cycle.financialYearLabel;
      milestoneByKey = new Map(computeMfmaMilestones(cycle.startDate, cycle.endDate).map(m => [m.key, m]));
    }
  }
  const rows = SDBIP_COMPLIANCE_REFERENCE.map(r => ({
    label: r.label,
    value: r.value,
    milestones: (r.milestoneKeys ?? [])
      .map(k => milestoneByKey.get(k))
      .filter((m): m is MfmaMilestone => !!m)
      .map(m => ({ key: m.key, title: m.title, dueDate: m.dueDate })),
  }));
  res.json({ financialYearLabel, rows });
});

async function computeOverdueSubmissions(cycleId: number, kpiIds: number[], actuals: (typeof kpiQuarterActualsTable.$inferSelect)[]) {
  const deadlines = await db.select().from(submissionDeadlinesTable).where(eq(submissionDeadlinesTable.cycleId, cycleId));
  const now = new Date();
  let overdue = 0;
  for (const dl of deadlines) {
    if (new Date(dl.deadlineDate) >= now) continue;
    const qActuals = actuals.filter(a => a.quarter === dl.quarter);
    const submittedKpiIds = new Set(qActuals.map(a => a.kpiId));
    const missingCount = kpiIds.filter(id => !submittedKpiIds.has(id)).length;
    overdue += missingCount;
  }
  return overdue;
}

export default router;
