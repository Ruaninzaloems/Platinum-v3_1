export type Assessment =
  | 'Achieved'
  | 'Over Achieved'
  | 'Partially Achieved'
  | 'Not Achieved'
  | 'On Hold'
  | 'Not Applicable'
  | 'Unable to Assess';

export function parseNumeric(value: string): number | null {
  const cleaned = value.replace(/[,%\s]/g, '');
  if (cleaned === '' || isNaN(Number(cleaned))) return null;
  return Number(cleaned);
}

export function isPercentageUom(uomName: string | null): boolean {
  return !!uomName && /percent|%/i.test(uomName);
}

export function isNumericUom(uomName: string | null): boolean {
  return !!uomName && /number|numeric|count|rand|amount|quantity|percent|%/i.test(uomName);
}

export function isDateUom(uomName: string | null): boolean {
  return !!uomName && /date/i.test(uomName);
}

export function validateActualFormat(actualValue: string, uomName: string | null): string | null {
  const trimmed = actualValue.trim();
  if (!trimmed) return 'Actual value is required';
  if (isDateUom(uomName)) {
    if (isNaN(new Date(trimmed).getTime())) return 'Actual must be a valid date (unit of measure is Date)';
    return null;
  }
  if (isNumericUom(uomName)) {
    const n = parseNumeric(trimmed);
    if (n === null) return `Actual must be a numeric value (unit of measure is ${uomName})`;
    if (isPercentageUom(uomName) && (n < 0 || n > 100)) return 'Percentage actual must be between 0 and 100';
  }
  return null;
}

export function computeAssessment(
  actualValue: string,
  quarterTarget: string | null,
  targetStatus: string | null,
  uomName: string | null,
  isOnHold: boolean,
): Assessment {
  if (isOnHold || targetStatus === 'on_hold') return 'On Hold';
  if (targetStatus === 'na') return 'Not Applicable';
  const target = quarterTarget?.trim();
  const actual = actualValue.trim();
  if (!target || !actual) return 'Unable to Assess';

  if (isDateUom(uomName)) {
    const at = new Date(actual).getTime();
    const tt = new Date(target).getTime();
    if (isNaN(at) || isNaN(tt)) return 'Unable to Assess';
    if (at < tt) return 'Over Achieved';
    if (at === tt) return 'Achieved';
    return 'Not Achieved';
  }

  const an = parseNumeric(actual);
  const tn = parseNumeric(target);
  if (an !== null && tn !== null) {
    if (tn === 0) {
      if (an === 0) return 'Achieved';
      return an > 0 ? 'Over Achieved' : 'Not Achieved';
    }
    if (an > tn) return 'Over Achieved';
    if (an === tn) return 'Achieved';
    if (an <= 0) return 'Not Achieved';
    return 'Partially Achieved';
  }
  if (an === null && tn === null) {
    return actual.toLowerCase() === target.toLowerCase() ? 'Achieved' : 'Unable to Assess';
  }
  return 'Unable to Assess';
}

export interface RatingThreshold {
  level: number;
  label: string;
  descriptor?: string;
  minPct: number | null;
  maxPct: number | null;
}

/** True when the quarter target is qualitative (non-numeric, non-date). */
export function isQualitativeTarget(target: string | null, uomName: string | null): boolean {
  if (!target?.trim()) return false;
  if (isDateUom(uomName)) return false;
  return parseNumeric(target) === null;
}

/**
 * KPI score % per the OPMS formula: (Actual ÷ Target) × 100.
 * Quantitative: numeric ratio. Date: on/before target = 100, late = 0.
 * Qualitative: capturer-provided qualitative score, or 100 on exact text match.
 */
export function computeScorePct(
  actualValue: string,
  target: string | null,
  uomName: string | null,
  qualitativeScorePct?: number | null,
): number | null {
  const t = target?.trim();
  const actual = actualValue.trim();
  if (!t || !actual) return null;

  if (isDateUom(uomName)) {
    const at = new Date(actual).getTime();
    const tt = new Date(t).getTime();
    if (isNaN(at) || isNaN(tt)) return null;
    return at <= tt ? 100 : 0;
  }

  const an = parseNumeric(actual);
  const tn = parseNumeric(t);
  if (an !== null && tn !== null) {
    if (tn === 0) return an >= 0 ? 100 : 0;
    return Math.round((an / tn) * 10000) / 100;
  }
  if (tn === null) {
    if (qualitativeScorePct != null) return qualitativeScorePct;
    if (an === null && actual.toLowerCase() === t.toLowerCase()) return 100;
  }
  return null;
}

/** Map a score % onto the configured rating bands. */
export function ratingFromScore(
  scorePct: number,
  thresholds: RatingThreshold[],
): RatingThreshold | null {
  const sorted = [...thresholds].sort((a, b) => b.level - a.level);
  for (const t of sorted) {
    const minOk = t.minPct == null || scorePct >= t.minPct;
    const maxOk = t.maxPct == null || scorePct <= t.maxPct;
    if (minOk && maxOk) return t;
  }
  return null;
}

/** Achievement assessment derived from the score via the configured bands. */
export function assessmentFromScore(
  scorePct: number,
  thresholds: RatingThreshold[],
): Assessment {
  const rating = ratingFromScore(scorePct, thresholds);
  if (!rating) return scorePct >= 100 ? 'Achieved' : 'Not Achieved';
  if (rating.level > 3) return 'Over Achieved';
  if (rating.level === 3) return 'Achieved';
  const bottom = Math.min(...thresholds.map((t) => t.level));
  return rating.level <= bottom ? 'Not Achieved' : 'Partially Achieved';
}

export function isNonAchievement(a: Assessment): boolean {
  return a === 'Partially Achieved' || a === 'Not Achieved';
}

export function computeVariance(actualValue: string | null, quarterTarget: string | null): string | null {
  if (!actualValue || !quarterTarget) return null;
  const an = parseNumeric(actualValue);
  const tn = parseNumeric(quarterTarget);
  if (an === null || tn === null) return null;
  const diff = an - tn;
  const rounded = Math.round(diff * 100) / 100;
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

export function assessmentBadgeClass(a: string | null | undefined): string {
  switch (a) {
    case 'Achieved': return 'green';
    case 'Over Achieved': return 'blue';
    case 'Partially Achieved': return 'amber';
    case 'Not Achieved': return 'red';
    case 'On Hold': return 'purple';
    case 'Not Applicable': return 'gray';
    default: return 'gray';
  }
}
