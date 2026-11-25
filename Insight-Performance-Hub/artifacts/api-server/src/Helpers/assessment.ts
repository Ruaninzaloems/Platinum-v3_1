import { db } from "@workspace/db";
import { kpiQuarterTargetsTable, scorecardKpisTable, scorecardsTable, kpiRatingThresholdsTable } from "@workspace/db/schema";
import { unitsOfMeasureTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { resolveEffectiveKpiSet } from "./effective-kpis";

export type Assessment =
  | "Achieved"
  | "Over Achieved"
  | "Partially Achieved"
  | "Not Achieved"
  | "On Hold"
  | "Not Applicable"
  | "Unable to Assess";

export interface AssessmentContext {
  uomName: string | null;
  quarterTarget: string | null;
  targetStatus: string | null;
  kpiDescription?: string | null;
}

function parseNumeric(value: string): number | null {
  const cleaned = value.replace(/[,%\s]/g, "");
  if (cleaned === "" || isNaN(Number(cleaned))) return null;
  return Number(cleaned);
}

function isPercentageUom(uomName: string | null): boolean {
  return !!uomName && /percent|%/i.test(uomName);
}

function isNumericUom(uomName: string | null): boolean {
  return !!uomName && /number|numeric|count|rand|amount|quantity|percent|%/i.test(uomName);
}

function isDateUom(uomName: string | null): boolean {
  return !!uomName && /date/i.test(uomName);
}

/** Validate the actual value format against the KPI's unit of measure. Returns error message or null. */
export function validateActualFormat(actualValue: string, uomName: string | null): string | null {
  const trimmed = actualValue.trim();
  if (!trimmed) return "Actual value is required";
  // "N/A" (Not Applicable) and "On hold" flag values are always accepted regardless of UoM.
  if (trimmed.toUpperCase() === "N/A" || trimmed.toUpperCase() === "ON HOLD") return null;
  if (isDateUom(uomName)) {
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return "Actual must be a valid date (unit of measure is Date)";
    return null;
  }
  if (isNumericUom(uomName)) {
    const n = parseNumeric(trimmed);
    if (n === null) return `Actual must be a numeric value (unit of measure is ${uomName})`;
    if (isPercentageUom(uomName) && (n < 0 || n > 100)) {
      return "Percentage actual must be between 0 and 100";
    }
  }
  return null;
}

/** Compute the assessment outcome from target vs actual per the capture spec. */
export function computeAssessment(
  actualValue: string,
  ctx: AssessmentContext,
  isOnHold: boolean,
): Assessment {
  if (isOnHold || ctx.targetStatus === "on_hold") return "On Hold";
  if (ctx.targetStatus === "na") return "Not Applicable";
  const target = ctx.quarterTarget?.trim();
  const actual = actualValue.trim();
  if (!target) return "Unable to Assess";

  if (isDateUom(ctx.uomName)) {
    const at = new Date(actual).getTime();
    const tt = new Date(target).getTime();
    if (isNaN(at) || isNaN(tt)) return "Unable to Assess";
    if (at < tt) return "Over Achieved";
    if (at === tt) return "Achieved";
    return "Not Achieved";
  }

  const an = parseNumeric(actual);
  const tn = parseNumeric(target);
  if (an !== null && tn !== null) {
    if (tn === 0) {
      if (an === 0) return "Achieved";
      return an > 0 ? "Over Achieved" : "Not Achieved";
    }
    if (an > tn) return "Over Achieved";
    if (an === tn) return "Achieved";
    if (an <= 0) return "Not Achieved";
    return "Partially Achieved";
  }

  // Non-numeric text comparison
  if (an === null && tn === null) {
    return actual.toLowerCase() === target.toLowerCase() ? "Achieved" : "Unable to Assess";
  }
  return "Unable to Assess";
}

export interface RatingThresholdRow {
  level: number;
  label: string;
  minPct: number | null;
  maxPct: number | null;
}

/** Load the configured OPMS rating thresholds (highest level first). */
export async function loadRatingThresholds(): Promise<RatingThresholdRow[]> {
  const rows = await db.select().from(kpiRatingThresholdsTable);
  return rows
    .map((r) => ({ level: r.level, label: r.label, minPct: r.minPct, maxPct: r.maxPct }))
    .sort((a, b) => b.level - a.level);
}

/**
 * Compute the KPI score % per the OPMS formula: (Actual ÷ Target) × 100.
 * - Quantitative (numeric actual & target): direct ratio.
 * - Date targets: on/before target date counts as 100%, late as 0%.
 * - Qualitative (non-numeric target): uses the capturer-provided
 *   qualitativeScorePct, or 100% when the actual text matches the target.
 * Returns null when a score cannot be determined.
 */
export function computeScorePct(
  actualValue: string,
  ctx: AssessmentContext,
  qualitativeScorePct?: number | null,
): number | null {
  const target = ctx.quarterTarget?.trim();
  const actual = actualValue.trim();
  if (!target || !actual) return null;

  if (isDateUom(ctx.uomName)) {
    const at = new Date(actual).getTime();
    const tt = new Date(target).getTime();
    if (isNaN(at) || isNaN(tt)) return null;
    return at <= tt ? 100 : 0;
  }

  const an = parseNumeric(actual);
  const tn = parseNumeric(target);
  if (an !== null && tn !== null) {
    if (tn === 0) return an === 0 ? 100 : an > 0 ? 100 : 0;
    return Math.round((an / tn) * 10000) / 100;
  }

  // Qualitative target
  if (tn === null) {
    if (qualitativeScorePct != null) return qualitativeScorePct;
    if (an === null && actual.toLowerCase() === target.toLowerCase()) return 100;
  }
  return null;
}

/** Map a score % to the configured rating band. */
export function ratingFromScore(
  scorePct: number,
  thresholds: RatingThresholdRow[],
): { level: number; label: string } | null {
  for (const t of thresholds) {
    const minOk = t.minPct == null || scorePct >= t.minPct;
    const maxOk = t.maxPct == null || scorePct <= t.maxPct;
    if (minOk && maxOk) return { level: t.level, label: t.label };
  }
  return null;
}

/**
 * Derive the achievement assessment from a score % using the configured
 * thresholds: at/above the on-target band = Achieved, above its max =
 * Over Achieved, below = Partially/Not Achieved per the bands.
 */
export function assessmentFromScore(
  scorePct: number,
  thresholds: RatingThresholdRow[],
): Assessment {
  const rating = ratingFromScore(scorePct, thresholds);
  if (!rating) return scorePct >= 100 ? "Achieved" : "Not Achieved";
  const midLevel = 3;
  if (rating.level > midLevel) return "Over Achieved";
  if (rating.level === midLevel) return "Achieved";
  const bottom = Math.min(...thresholds.map((t) => t.level));
  return rating.level <= bottom ? "Not Achieved" : "Partially Achieved";
}

export interface ScoredAssessment {
  assessment: Assessment;
  scorePct: number | null;
  ratingLevel: number | null;
  ratingLabel: string | null;
  aiRationale: string | null;
}

/**
 * Ask the AI to judge how far a qualitative target was achieved.
 * Returns a score % (0–200) plus a short rationale, or null when the
 * AI service is unavailable or returns an unusable answer.
 */
export async function aiScoreQualitative(
  actualValue: string,
  ctx: AssessmentContext,
  commentary?: string | null,
): Promise<{ scorePct: number; rationale: string } | null> {
  try {
    const { openai } = await import("@workspace/integrations-openai-ai-server");
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a municipal performance management assessor applying the South African " +
            "National Treasury OPMS methodology. Given a KPI, its qualitative quarterly target " +
            "and the reported actual, judge the degree of achievement as a percentage score " +
            "(Score% = achievement relative to target × 100). 100 means fully achieved exactly " +
            "as targeted; below 100 means partial or non-achievement; above 100 (max 200) means " +
            "the actual clearly exceeded the target's scope or quality. Be strict: vague or " +
            "unsubstantiated actuals score low. Respond with JSON only: " +
            '{"scorePct": number, "rationale": string} where rationale is 1-2 concise sentences.',
        },
        {
          role: "user",
          content: JSON.stringify({
            kpi: ctx.kpiDescription ?? null,
            unitOfMeasure: ctx.uomName ?? null,
            quarterTarget: ctx.quarterTarget,
            reportedActual: actualValue,
            supportingComment: commentary ?? null,
          }),
        },
      ],
    });
    const raw = response.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { scorePct?: unknown; rationale?: unknown };
    const score = Number(parsed.scorePct);
    if (!isFinite(score)) return null;
    return {
      scorePct: Math.max(0, Math.min(200, Math.round(score * 100) / 100)),
      rationale: typeof parsed.rationale === "string" ? parsed.rationale : "",
    };
  } catch (err) {
    console.error("AI qualitative assessment failed:", err);
    return null;
  }
}

/**
 * Full analysis: score via the OPMS formula, rating via the configured
 * thresholds, and the achievement assessment derived from that rating.
 * Falls back to the legacy comparison when no score can be computed.
 */
export async function scoreAndAssess(
  actualValue: string,
  ctx: AssessmentContext,
  isOnHold: boolean,
  qualitativeScorePct?: number | null,
  commentary?: string | null,
): Promise<ScoredAssessment> {
  const none = { scorePct: null, ratingLevel: null, ratingLabel: null, aiRationale: null };
  if (isOnHold || ctx.targetStatus === "on_hold") {
    return { assessment: "On Hold", ...none };
  }
  if (ctx.targetStatus === "na") {
    return { assessment: "Not Applicable", ...none };
  }
  if (actualValue.trim().toUpperCase() === "N/A") {
    return { assessment: "Not Applicable", ...none };
  }
  let scorePct = computeScorePct(actualValue, ctx, qualitativeScorePct);
  let aiRationale: string | null = null;
  if (scorePct === null && isQualitativeTargetCtx(ctx) && actualValue.trim()) {
    const ai = await aiScoreQualitative(actualValue, ctx, commentary);
    if (ai) {
      scorePct = ai.scorePct;
      aiRationale = ai.rationale || null;
    }
  }
  if (scorePct === null) {
    const legacy = computeAssessment(actualValue, ctx, isOnHold);
    return { assessment: legacy, ...none };
  }
  const thresholds = await loadRatingThresholds();
  const rating = ratingFromScore(scorePct, thresholds);
  return {
    assessment: assessmentFromScore(scorePct, thresholds),
    scorePct,
    ratingLevel: rating?.level ?? null,
    ratingLabel: rating?.label ?? null,
    aiRationale,
  };
}

/**
 * True when the quarter target is qualitative (non-numeric). Date-UoM KPIs
 * are included: when their values fail to parse as dates the formula cannot
 * score them, so AI judgement is the fallback.
 */
export function isQualitativeTargetCtx(ctx: AssessmentContext): boolean {
  const target = ctx.quarterTarget?.trim();
  if (!target) return false;
  return parseNumeric(target) === null;
}

export function isNonAchievement(a: Assessment): boolean {
  return a === "Partially Achieved" || a === "Not Achieved";
}

export function assessmentToIsAchieved(a: Assessment): boolean | null {
  if (a === "Achieved" || a === "Over Achieved") return true;
  if (a === "Partially Achieved" || a === "Not Achieved") return false;
  return null;
}

/**
 * Resolve the KPI id whose targets are in force for new captures.
 * If an approved Revised SDBIP supersedes the KPI (matched by KPI number),
 * the revised KPI's targets apply. Historical assessments are never
 * recomputed — they were stored at capture time and stay unchanged.
 * Departmental scorecard KPIs are used as-is (their own targets apply).
 */
export async function resolveEffectiveKpiId(kpiId: number): Promise<number> {
  const [kpi] = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.id, kpiId));
  if (!kpi) return kpiId;
  const [scorecard] = await db.select().from(scorecardsTable).where(eq(scorecardsTable.id, kpi.scorecardId));
  if (!scorecard || scorecard.scorecardType === "departmental") return kpiId;
  const { aliasToEffective } = await resolveEffectiveKpiSet(scorecard.cycleId);
  return aliasToEffective.get(kpiId) ?? kpiId;
}

/** Load UoM name + effective quarter target for a KPI/quarter. */
export async function loadAssessmentContext(kpiId: number, quarter: number): Promise<AssessmentContext & { effectiveKpiId: number }> {
  const effectiveKpiId = await resolveEffectiveKpiId(kpiId);
  const [kpi] = await db.select().from(scorecardKpisTable).where(eq(scorecardKpisTable.id, effectiveKpiId));
  let uomName: string | null = null;
  if (kpi?.unitOfMeasureId) {
    const [uom] = await db.select().from(unitsOfMeasureTable).where(eq(unitsOfMeasureTable.id, kpi.unitOfMeasureId));
    uomName = uom?.name ?? null;
  }
  const [target] = await db.select().from(kpiQuarterTargetsTable).where(
    and(eq(kpiQuarterTargetsTable.kpiId, effectiveKpiId), eq(kpiQuarterTargetsTable.quarter, quarter))
  );
  return {
    uomName,
    quarterTarget: target?.targetValue ?? null,
    targetStatus: target?.targetStatus ?? null,
    kpiDescription: kpi?.description ?? null,
    effectiveKpiId,
  };
}
