import { Router } from "express";
import { db } from "@workspace/db";
import {
  scorecardKpisTable, scorecardsTable, kpiQuarterTargetsTable,
  kpiQuarterActualsTable, kpiEvidenceDocumentsTable, remedialActionPlansTable,
  constraintRegisterTable, deptScorecardsTable, deptScorecardKpisTable,
  submissionDeadlinesTable, nkpaWeightingsTable, kpiGroupsTable,
} from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { type AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.get("/dashboards/executive", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }

  const scorecards = await db.select().from(scorecardsTable).where(eq(scorecardsTable.cycleId, cycleId));
  const scIds = scorecards.map(s => s.id);
  if (scIds.length === 0) {
    res.json({ totalKpis: 0, achieved: 0, notAchieved: 0, atRisk: 0, onHold: 0, weightedPerformance: 0, topUnderperforming: [], departmentScores: [], overdueSubmissions: 0, unresolvedCorrectiveActions: 0, evidenceOutstanding: 0, budgetRiskKpis: 0 });
    return;
  }

  const allKpis = await db.select().from(scorecardKpisTable);
  const kpis = allKpis.filter(k => scIds.includes(k.scorecardId));
  const kpiIds = kpis.map(k => k.id);

  const allActuals = await db.select().from(kpiQuarterActualsTable);
  const actuals = allActuals.filter(a => kpiIds.includes(a.kpiId) && (!quarter || a.quarter === quarter));

  let achieved = 0, notAchieved = 0, atRisk = 0, onHold = 0;
  const underperforming: Array<{ kpiId: number; kpiNumber: string; description: string; actualValue: string; targetValue: string; variance: number }> = [];

  const targetsByKpi = new Map<number, typeof kpiQuarterTargetsTable.$inferSelect[]>();
  const allTargets = await db.select().from(kpiQuarterTargetsTable);
  for (const t of allTargets) {
    if (!kpiIds.includes(t.kpiId)) continue;
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
      const tVal = qt ? parseFloat(qt.targetValue) : 0;
      const aVal = parseFloat(latest.actualValue) || 0;
      const variance = tVal !== 0 ? ((aVal - tVal) / tVal) * 100 : 0;
      underperforming.push({ kpiId: kpi.id, kpiNumber: kpi.kpiNumber, description: kpi.description, actualValue: latest.actualValue, targetValue: qt?.targetValue || "0", variance });
    } else {
      atRisk++;
    }
  }

  underperforming.sort((a, b) => a.variance - b.variance);
  const top10 = underperforming.slice(0, 10);

  let weightedSum = 0, weightTotal = 0;
  for (const kpi of kpis) {
    const kpiActuals = actuals.filter(a => a.kpiId === kpi.id);
    const latest = kpiActuals.sort((a, b) => b.quarter - a.quarter)[0];
    if (latest && latest.isAchieved !== null) {
      weightedSum += kpi.weighting * (latest.isAchieved ? 1 : 0);
      weightTotal += kpi.weighting;
    }
  }
  const weightedPerformance = weightTotal > 0 ? (weightedSum / weightTotal) * 100 : 0;

  const deptScs = await db.select().from(deptScorecardsTable).where(eq(deptScorecardsTable.cycleId, cycleId));
  const allDeptKpis = await db.select().from(deptScorecardKpisTable);
  const departmentScores = deptScs.map(d => {
    const dKpis = allDeptKpis.filter(k => k.deptScorecardId === d.id);
    const parentKpiIds = dKpis.filter(k => k.parentKpiId).map(k => k.parentKpiId!);
    const deptActuals = actuals.filter(a => parentKpiIds.includes(a.kpiId));
    const achievedCount = deptActuals.filter(a => a.isAchieved === true).length;
    const totalCount = deptActuals.length;
    return {
      departmentId: d.departmentId,
      departmentName: d.departmentName,
      score: totalCount > 0 ? Math.round((achievedCount / totalCount) * 100) : 0,
      kpiCount: dKpis.length,
    };
  });

  const allEvidence = await db.select().from(kpiEvidenceDocumentsTable);
  const evidenceOutstanding = allEvidence.filter(e => kpiIds.includes(e.kpiId) && e.verificationStatus === "Pending").length;

  const allRemedial = await db.select().from(remedialActionPlansTable);
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

  const parentKpiIds = deptKpis.filter(k => k.parentKpiId).map(k => k.parentKpiId!);
  const allActuals = await db.select().from(kpiQuarterActualsTable);
  const deptActuals = allActuals.filter(a => parentKpiIds.includes(a.kpiId));

  const heatmap = deptKpis.map(k => {
    const kpiActuals = k.parentKpiId ? deptActuals.filter(a => a.kpiId === k.parentKpiId) : [];
    const statusForQ = (q: number) => {
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

  const allEvidence = await db.select().from(kpiEvidenceDocumentsTable);
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

  const scorecards = await db.select().from(scorecardsTable).where(eq(scorecardsTable.cycleId, cycleId));
  const scIds = scorecards.map(s => s.id);
  const allKpis = await db.select().from(scorecardKpisTable);
  const kpis = allKpis.filter(k => scIds.includes(k.scorecardId));

  const allActuals = await db.select().from(kpiQuarterActualsTable);
  const kpiIds = kpis.map(k => k.id);
  const actuals = allActuals.filter(a => kpiIds.includes(a.kpiId));

  const quarterComparison = [1, 2, 3, 4].map(q => {
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

async function getKpisAndActualsForCycle(cycleId: number, quarter?: number) {
  const scorecards = await db.select().from(scorecardsTable).where(eq(scorecardsTable.cycleId, cycleId));
  const scIds = scorecards.map(s => s.id);
  if (scIds.length === 0) return { kpis: [], actuals: [], targets: [], kpiIds: [] };
  const allKpis = await db.select().from(scorecardKpisTable);
  const kpis = allKpis.filter(k => scIds.includes(k.scorecardId));
  const kpiIds = kpis.map(k => k.id);
  const allActuals = await db.select().from(kpiQuarterActualsTable);
  const actuals = allActuals.filter(a => kpiIds.includes(a.kpiId) && (!quarter || a.quarter === quarter));
  const allTargets = await db.select().from(kpiQuarterTargetsTable);
  const targets = allTargets.filter(t => kpiIds.includes(t.kpiId));
  return { kpis, actuals, targets, kpiIds };
}

router.get("/dashboards/nkpa-performance", async (req: AuthenticatedRequest, res) => {
  const cycleId = Number(req.query.cycleId);
  const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
  if (!cycleId) { res.status(400).json({ error: "cycleId required" }); return; }

  const { kpis, actuals } = await getKpisAndActualsForCycle(cycleId, quarter);
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
    const parentKpiIds = dKpis.filter(k => k.parentKpiId).map(k => k.parentKpiId!);
    const deptActuals = actuals.filter(a => parentKpiIds.includes(a.kpiId));
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

  const { kpis, actuals, targets } = await getKpisAndActualsForCycle(cycleId, quarter);
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
    const parentKpiIds = dKpis.filter(k => k.parentKpiId).map(k => k.parentKpiId!);
    const deptKpis = kpis.filter(k => parentKpiIds.includes(k.id));
    const budget = deptKpis.reduce((s, k) => s + (k.annualBudgetTarget || 0), 0);
    const deptActuals = actuals.filter(a => parentKpiIds.includes(a.kpiId));
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

  const { kpis, actuals } = await getKpisAndActualsForCycle(cycleId);

  const quartersToShow = quarter ? [quarter] : [1, 2, 3, 4];
  const quarters = quartersToShow.map(q => {
    const qActuals = actuals.filter(a => a.quarter === q);
    const achieved = qActuals.filter(a => a.isAchieved === true).length;
    const notAchieved = qActuals.filter(a => a.isAchieved === false).length;
    const total = qActuals.length;
    return {
      quarter: q,
      achievementRate: total > 0 ? Math.round((achieved / total) * 100 * 100) / 100 : 0,
      achieved,
      notAchieved,
      total,
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
    const tVal = qt ? parseFloat(qt.targetValue) : 0;
    const aVal = parseFloat(latest.actualValue) || 0;
    const variance = tVal !== 0 ? Math.round(((aVal - tVal) / tVal) * 100 * 100) / 100 : 0;
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

  const { kpis, actuals } = await getKpisAndActualsForCycle(cycleId, quarter);
  const deptScs = await db.select().from(deptScorecardsTable).where(eq(deptScorecardsTable.cycleId, cycleId));
  const allDeptKpis = await db.select().from(deptScorecardKpisTable);

  const rankings = deptScs.map(d => {
    const dKpis = allDeptKpis.filter(k => k.deptScorecardId === d.id);
    const parentKpiIds = dKpis.filter(k => k.parentKpiId).map(k => k.parentKpiId!);
    const deptActuals = actuals.filter(a => parentKpiIds.includes(a.kpiId));
    const parentKpis = kpis.filter(k => parentKpiIds.includes(k.id));

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

  const { kpis, kpiIds } = await getKpisAndActualsForCycle(cycleId, quarter);
  const allEvidence = await db.select().from(kpiEvidenceDocumentsTable);
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
    const parentKpiIds = dKpis.filter(k => k.parentKpiId).map(k => k.parentKpiId!);
    const deptEvidence = evidence.filter(e => parentKpiIds.includes(e.kpiId));
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
