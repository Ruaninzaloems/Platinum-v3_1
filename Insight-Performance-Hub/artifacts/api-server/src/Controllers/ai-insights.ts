import { Router } from "express";
import { db } from "@workspace/db";
import {
  aiInsightLogTable,
  deptScorecardKpisTable,
  deptScorecardsTable,
  employeeKpisTable,
  individualAgreementsTable,
  kpiQuarterActualsTable,
  kpiEvidenceDocumentsTable,
  scorecardKpisTable,
  scorecardsTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { type AuthenticatedRequest } from "../Middleware/auth";
import OpenAI from "openai";

const router = Router();

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

let openaiClient: OpenAI | null = null;
function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseURL || !apiKey) return null;
  openaiClient = new OpenAI({ baseURL, apiKey });
  return openaiClient;
}

async function enhanceWithAI(prompt: string, fallback: string): Promise<string> {
  const client = getOpenAIClient();
  if (!client) return fallback;
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a municipal performance management AI advisor for South African municipalities aligned to National Treasury mSCOA requirements. Provide concise, actionable insights." },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });
    return completion.choices[0]?.message?.content || fallback;
  } catch {
    return fallback;
  }
}

async function logInsight(insightType: string, cycleId: number, departmentId: number | null, summary: string, riskLevel: string | null, userId: number | null) {
  await db.insert(aiInsightLogTable).values({
    insightType,
    cycleId,
    departmentId,
    summary,
    riskLevel,
    isAdvisory: true,
    generatedById: userId,
  });
}

router.get("/ai-insights/at-risk-kpis", async (req: AuthenticatedRequest, res) => {
  try {
    const cycleId = Number(req.query.cycleId);
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;

    const allDeptKpis = await db.select().from(deptScorecardKpisTable);
    const allDeptScorecards = await db.select().from(deptScorecardsTable);
    const allActuals = await db.select().from(kpiQuarterActualsTable);

    const cycleScorecards = allDeptScorecards.filter(s => s.cycleId === cycleId);
    const cycleScIds = new Set(cycleScorecards.map(s => s.id));
    let kpis = allDeptKpis.filter(k => cycleScIds.has(k.deptScorecardId));
    if (departmentId) {
      const deptScIds = new Set(cycleScorecards.filter(s => s.departmentId === departmentId).map(s => s.id));
      kpis = kpis.filter(k => deptScIds.has(k.deptScorecardId));
    }

    const atRiskKpis = kpis.map(kpi => {
      const actuals = allActuals.filter(a => a.kpiId === kpi.id);
      const latestActual = actuals.sort((a, b) => b.quarter - a.quarter)[0];
      const sc = cycleScorecards.find(s => s.id === kpi.deptScorecardId);
      let riskLevel = "low";
      let reason = "On track";
      let currentScore: number | null = null;
      if (actuals.length === 0) {
        riskLevel = "medium";
        reason = "No actuals reported yet";
      } else if (latestActual && latestActual.isAchieved === false) {
        riskLevel = "high";
        reason = "Latest quarter not achieved — underperformance flagged";
        currentScore = 1;
      } else if (latestActual && latestActual.isAchieved === null) {
        riskLevel = "medium";
        reason = "Achievement status not yet confirmed";
        currentScore = 2;
      } else {
        currentScore = 4;
      }
      return {
        kpiId: kpi.id,
        kpiDescription: kpi.description,
        department: sc?.departmentName || "Unknown",
        currentScore,
        riskLevel,
        reason,
        recommendation: riskLevel === "high" ? "Immediate intervention required. Review targets and resources." :
          riskLevel === "medium" ? "Monitor closely and assess corrective action." : "Continue current approach.",
      };
    }).filter(k => k.riskLevel !== "low");

    const ruleSummary = `${atRiskKpis.length} KPIs flagged: ${atRiskKpis.filter(k => k.riskLevel === "high").length} high risk, ${atRiskKpis.filter(k => k.riskLevel === "medium").length} medium risk.`;

    const aiEnhanced = await enhanceWithAI(
      `Analyse these at-risk KPIs for a South African municipality:\n${JSON.stringify(atRiskKpis.slice(0, 10))}\nProvide a brief advisory summary with prioritised recommendations.`,
      ruleSummary
    );

    await logInsight("at-risk-kpis", cycleId, departmentId || null, aiEnhanced, atRiskKpis.some(k => k.riskLevel === "high") ? "high" : "medium", req.user?.id || null);

    res.json({ atRiskKpis, summary: aiEnhanced, generatedAt: new Date().toISOString() });
  } catch (e: unknown) {
    res.status(500).json({ error: getErrorMessage(e) });
  }
});

router.get("/ai-insights/narrative-summary", async (req: AuthenticatedRequest, res) => {
  try {
    const cycleId = Number(req.query.cycleId);
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;

    const allDeptScorecards = await db.select().from(deptScorecardsTable);
    const allDeptKpis = await db.select().from(deptScorecardKpisTable);
    const allActuals = await db.select().from(kpiQuarterActualsTable);

    const cycleScorecards = allDeptScorecards.filter(s => s.cycleId === cycleId);
    const cycleScIds = new Set(cycleScorecards.map(s => s.id));
    let kpis = allDeptKpis.filter(k => cycleScIds.has(k.deptScorecardId));
    if (departmentId) {
      const deptScIds = new Set(cycleScorecards.filter(s => s.departmentId === departmentId).map(s => s.id));
      kpis = kpis.filter(k => deptScIds.has(k.deptScorecardId));
    }

    const scores = kpis.map(kpi => {
      const actuals = allActuals.filter(a => a.kpiId === kpi.id);
      if (actuals.length === 0) return null;
      const achieved = actuals.filter(a => a.isAchieved === true).length;
      return (achieved / actuals.length) * 5;
    }).filter(s => s !== null) as number[];

    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const highPerformers = scores.filter(s => s >= 4).length;
    const underPerformers = scores.filter(s => s < 2).length;

    const highlights: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    if (avgScore >= 3.5) highlights.push(`Strong overall performance with average score of ${avgScore.toFixed(1)}`);
    if (highPerformers > 0) highlights.push(`${highPerformers} KPIs rated at 4 or above`);
    if (underPerformers > 0) concerns.push(`${underPerformers} KPIs scored below 2 — requiring intervention`);
    if (scores.length === 0) concerns.push("No KPI actuals have been captured yet for this cycle");
    if (underPerformers > 0) recommendations.push("Convene performance review committee for underperforming KPIs");
    recommendations.push("Continue quarterly reviews and evidence collection");

    const ruleNarrative = `Performance cycle analysis: ${kpis.length} KPIs tracked across ${cycleScorecards.length} department scorecards. Average score: ${avgScore.toFixed(1)}/5. ${highlights.join(". ")}. ${concerns.length > 0 ? concerns.join(". ") : "No critical concerns identified."}`;

    const narrative = await enhanceWithAI(
      `Write a professional performance narrative for a South African municipal council report based on this data:\n- ${kpis.length} KPIs tracked, average score ${avgScore.toFixed(1)}/5\n- High performers: ${highPerformers}, Under performers: ${underPerformers}\n- Highlights: ${highlights.join("; ")}\n- Concerns: ${concerns.join("; ")}\nWrite in the style of a National Treasury quarterly performance report.`,
      ruleNarrative
    );

    await logInsight("narrative-summary", cycleId, departmentId || null, narrative, null, req.user?.id || null);

    res.json({
      narrative,
      highlights,
      concerns,
      recommendations,
      generatedAt: new Date().toISOString(),
    });
  } catch (e: unknown) {
    res.status(500).json({ error: getErrorMessage(e) });
  }
});

router.get("/ai-insights/evidence-gaps", async (req: AuthenticatedRequest, res) => {
  try {
    const cycleId = Number(req.query.cycleId);
    const allDeptScorecards = await db.select().from(deptScorecardsTable);
    const allDeptKpis = await db.select().from(deptScorecardKpisTable);
    const allActuals = await db.select().from(kpiQuarterActualsTable);

    const cycleScorecards = allDeptScorecards.filter(s => s.cycleId === cycleId);
    const cycleScIds = new Set(cycleScorecards.map(s => s.id));
    const kpis = allDeptKpis.filter(k => cycleScIds.has(k.deptScorecardId));

    const gaps: Array<{ kpiId: number; kpiDescription: string; department: string; quarter: number; gapType: string; severity: string; suggestion: string }> = [];

    for (const kpi of kpis) {
      const sc = cycleScorecards.find(s => s.id === kpi.deptScorecardId);
      const actuals = allActuals.filter(a => a.kpiId === kpi.id);
      const reportedQuarters = new Set(actuals.map(a => a.quarter));
      for (let q = 1; q <= 4; q++) {
        if (!reportedQuarters.has(q)) {
          gaps.push({
            kpiId: kpi.id,
            kpiDescription: kpi.description,
            department: sc?.departmentName || "Unknown",
            quarter: q,
            gapType: "missing_actual",
            severity: "medium",
            suggestion: `Submit Q${q} actuals and evidence for "${kpi.description}"`,
          });
        }
      }
      const allEvidence = await db.select().from(kpiEvidenceDocumentsTable);
      for (const actual of actuals) {
        const hasEvidence = allEvidence.some(e => e.kpiId === kpi.id && e.quarter === actual.quarter);
        if (!hasEvidence && !actual.commentary) {
          gaps.push({
            kpiId: kpi.id,
            kpiDescription: kpi.description,
            department: sc?.departmentName || "Unknown",
            quarter: actual.quarter,
            gapType: "missing_evidence",
            severity: "low",
            suggestion: `Upload supporting evidence for Q${actual.quarter} "${kpi.description}"`,
          });
        }
      }
    }

    const ruleSummary = `${gaps.length} evidence gaps detected across ${kpis.length} KPIs`;

    const complianceScore = kpis.length > 0 ? Math.round(((kpis.length * 4 - gaps.filter(g => g.gapType === "missing_actual").length) / (kpis.length * 4)) * 100) : 100;

    const summary = await enhanceWithAI(
      `Analyse evidence compliance for a South African municipality:\n- ${gaps.length} evidence gaps across ${kpis.length} KPIs\n- Compliance score: ${complianceScore}%\n- Gap breakdown: ${gaps.filter(g => g.gapType === "missing_actual").length} missing actuals, ${gaps.filter(g => g.gapType === "missing_evidence").length} missing evidence documents\nProvide a brief compliance advisory.`,
      ruleSummary
    );

    await logInsight("evidence-gaps", cycleId, null, summary, gaps.length > 10 ? "high" : gaps.length > 0 ? "medium" : null, req.user?.id || null);

    res.json({
      gaps,
      summary,
      complianceScore,
      generatedAt: new Date().toISOString(),
    });
  } catch (e: unknown) {
    res.status(500).json({ error: getErrorMessage(e) });
  }
});

router.get("/ai-insights/alignment-check", async (req: AuthenticatedRequest, res) => {
  try {
    const cycleId = Number(req.query.cycleId);
    const orgScorecards = await db.select().from(scorecardsTable);
    const orgKpis = await db.select().from(scorecardKpisTable);
    const deptScorecards = await db.select().from(deptScorecardsTable);
    const deptKpis = await db.select().from(deptScorecardKpisTable);
    const agreements = await db.select().from(individualAgreementsTable);
    const empKpis = await db.select().from(employeeKpisTable);

    const cycleOrgSc = orgScorecards.filter(s => s.cycleId === cycleId);
    const cycleDeptSc = deptScorecards.filter(s => s.cycleId === cycleId);
    const cycleAgreements = agreements.filter(a => a.cycleId === cycleId);

    const issues: Array<{ sourceModule: string; targetModule: string; issue: string; severity: string; recommendation: string }> = [];

    for (const dsc of cycleDeptSc) {
      if (!dsc.parentScorecardId) {
        issues.push({
          sourceModule: "Department Scorecard",
          targetModule: "Organisational Scorecard",
          issue: `"${dsc.name}" has no parent organisational scorecard link`,
          severity: "medium",
          recommendation: "Link department scorecard to parent organisational scorecard for cascade alignment",
        });
      }
    }

    for (const ag of cycleAgreements) {
      if (!ag.deptScorecardId) {
        issues.push({
          sourceModule: "Individual Agreement",
          targetModule: "Department Scorecard",
          issue: `Agreement for ${ag.employeeName} not linked to department scorecard`,
          severity: "low",
          recommendation: "Link individual agreement to department scorecard for full cascade",
        });
      }
    }

    const unlinkedDeptKpis = deptKpis.filter(k => {
      const sc = cycleDeptSc.find(s => s.id === k.deptScorecardId);
      return sc && !k.parentKpiId;
    });
    if (unlinkedDeptKpis.length > 0) {
      issues.push({
        sourceModule: "Department KPIs",
        targetModule: "Organisational KPIs",
        issue: `${unlinkedDeptKpis.length} department KPIs not linked to organisational KPIs`,
        severity: "medium",
        recommendation: "Map department KPIs to parent organisational KPIs for cascade reporting",
      });
    }

    const cycleEmpKpis = empKpis.filter(k => {
      const ag = cycleAgreements.find(a => a.id === k.agreementId);
      return !!ag;
    });
    const unlinkedEmpKpis = cycleEmpKpis.filter(k => !k.deptKpiId);
    if (unlinkedEmpKpis.length > 0) {
      issues.push({
        sourceModule: "Individual KPIs",
        targetModule: "Department KPIs",
        issue: `${unlinkedEmpKpis.length} individual KPIs not linked to department KPIs`,
        severity: "low",
        recommendation: "Map individual employee KPIs to department KPIs for cascade traceability",
      });
    }

    const totalChecks = cycleDeptSc.length + cycleAgreements.length + deptKpis.length + cycleEmpKpis.length;
    const issueCount = issues.length;
    const overallScore = totalChecks > 0 ? Math.max(0, (1 - issueCount / totalChecks) * 100) : 100;

    const ruleSummary = `Alignment score: ${Math.round(overallScore)}%. ${issueCount} issues found across ${totalChecks} checks.`;

    const summary = await enhanceWithAI(
      `Provide an alignment assessment for a South African municipality's performance cascade:\n- Overall alignment score: ${Math.round(overallScore)}%\n- Issues found: ${JSON.stringify(issues.slice(0, 5))}\n- Total checks: ${totalChecks}\nBriefly explain the implications for mSCOA compliance.`,
      ruleSummary
    );

    await logInsight("alignment-check", cycleId, null, summary, issueCount > 3 ? "high" : issueCount > 0 ? "medium" : null, req.user?.id || null);

    res.json({
      alignmentIssues: issues,
      overallScore: Math.round(overallScore),
      summary,
      generatedAt: new Date().toISOString(),
    });
  } catch (e: unknown) {
    res.status(500).json({ error: getErrorMessage(e) });
  }
});

router.get("/ai-insights/dashboard", async (req: AuthenticatedRequest, res) => {
  try {
    const cycleId = Number(req.query.cycleId);
    const allDeptKpis = await db.select().from(deptScorecardKpisTable);
    const allDeptScorecards = await db.select().from(deptScorecardsTable);
    const allActuals = await db.select().from(kpiQuarterActualsTable);
    const recentLogs = await db.select().from(aiInsightLogTable);

    const cycleScorecards = allDeptScorecards.filter(s => s.cycleId === cycleId);
    const cycleScIds = new Set(cycleScorecards.map(s => s.id));
    const kpis = allDeptKpis.filter(k => cycleScIds.has(k.deptScorecardId));

    let high = 0, medium = 0, low = 0;
    for (const kpi of kpis) {
      const actuals = allActuals.filter(a => a.kpiId === kpi.id);
      const latestActual = actuals.sort((a, b) => b.quarter - a.quarter)[0];
      if (actuals.length === 0) { medium++; }
      else if (latestActual && latestActual.isAchieved === false) { high++; }
      else if (latestActual && latestActual.isAchieved === null) { medium++; }
      else { low++; }
    }

    const cycleLogs = recentLogs
      .filter(l => l.cycleId === cycleId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const summary = `Cycle has ${kpis.length} KPIs: ${high} high risk, ${medium} medium risk, ${low} on track.`;

    await logInsight("dashboard", cycleId, null, summary, high > 0 ? "high" : medium > 0 ? "medium" : null, req.user?.id || null);

    res.json({
      riskSummary: { high, medium, low },
      recentInsights: cycleLogs,
      topRecommendations: [
        high > 0 ? "Address high-risk KPIs immediately — convene performance review" : null,
        medium > 0 ? "Review medium-risk KPIs and capture outstanding evidence" : null,
        "Ensure all quarterly actuals are submitted before deadline",
      ].filter(Boolean),
      narrativeExcerpt: summary,
      generatedAt: new Date().toISOString(),
    });
  } catch (e: unknown) {
    res.status(500).json({ error: getErrorMessage(e) });
  }
});

router.get("/ai-insights/log", async (req: AuthenticatedRequest, res) => {
  const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
  const insightType = req.query.insightType as string | undefined;
  let rows = await db.select().from(aiInsightLogTable);
  if (cycleId) rows = rows.filter(r => r.cycleId === cycleId);
  if (insightType) rows = rows.filter(r => r.insightType === insightType);
  res.json(rows);
});

export default router;
