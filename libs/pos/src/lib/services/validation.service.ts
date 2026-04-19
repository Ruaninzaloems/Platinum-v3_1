export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRequired(fields: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`${key} is required.`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateNumericRange(value: number, min: number, max: number, fieldName: string): ValidationResult {
  const errors: string[] = [];
  if (isNaN(value)) {
    errors.push(`${fieldName} must be a valid number.`);
  } else if (value < min || value > max) {
    errors.push(`${fieldName} must be between ${min} and ${max}.`);
  }
  return { valid: errors.length === 0, errors };
}

export function validatePercentageSum(values: number[], tolerance: number = 0.01): ValidationResult {
  const sum = values.reduce((acc, v) => acc + v, 0);
  const errors: string[] = [];
  if (Math.abs(sum - 100) > tolerance) {
    errors.push(`Percentages must total 100%. Current total: ${sum.toFixed(2)}%.`);
  }
  return { valid: errors.length === 0, errors };
}

export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address.');
  }
  return { valid: errors.length === 0, errors };
}

export function validateAccountNo(accountNo: string): ValidationResult {
  const errors: string[] = [];
  if (!accountNo || accountNo.trim().length === 0) {
    errors.push('Account number is required.');
  }
  return { valid: errors.length === 0, errors };
}

export function isCourtReady(row: Record<string, unknown>): boolean {
  return !!(
    row['actionType'] &&
    row['entityType'] &&
    row['entityId'] &&
    row['userId'] &&
    row['userName'] &&
    row['ipAddress'] &&
    row['apiCallId'] &&
    row['timestamp'] &&
    row['legislationRef']
  );
}

export function getRiskCategory(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score <= 30) return 'LOW';
  if (score <= 60) return 'MEDIUM';
  return 'HIGH';
}

export function getConfidenceLabel(score: number): string {
  if (score >= 70) return 'High Confidence';
  if (score >= 40) return 'Moderate Confidence';
  return 'Low Confidence';
}

export function sortByField<T>(items: T[], field: keyof T, dir: 'asc' | 'desc'): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    let cmp = 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      cmp = aVal.localeCompare(bVal);
    } else {
      cmp = (aVal as number) - (bVal as number);
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}

export function validateSaIdNumber(idNumber: string): ValidationResult {
  const errors: string[] = [];
  if (!idNumber || idNumber.trim().length === 0) {
    errors.push('ID number is required.');
    return { valid: false, errors };
  }
  const cleaned = idNumber.replace(/\s/g, '');
  if (!/^\d{13}$/.test(cleaned)) {
    errors.push('ID number must be exactly 13 digits.');
    return { valid: false, errors };
  }
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let digit = parseInt(cleaned[i], 10);
    if (i % 2 !== 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  if (sum % 10 !== 0) {
    errors.push('ID number failed Luhn check — invalid ID number.');
  }
  return { valid: errors.length === 0, errors };
}

export function toIsoDateString(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('T')) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString();
  }
  return new Date(dateStr).toISOString();
}

export function todayIso(): string {
  return new Date().toISOString();
}

export function todayDateInputValue(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('declined') || s.includes('rejected')) return 'bg-red-500/15 text-red-700 border-red-200';
  if (s.includes('failed') || s.includes('error')) return 'bg-red-500/15 text-red-700 border-red-200';
  if (s.includes('final')) return 'bg-emerald-500/15 text-emerald-700 border-emerald-200';
  if (s.includes('trial run review') || s.includes('review')) return 'bg-amber-500/15 text-amber-700 border-amber-200';
  if (s.includes('trial')) return 'bg-blue-500/15 text-blue-700 border-blue-200';
  if (s.includes('authorized') || s.includes('approved')) return 'bg-green-500/15 text-green-700 border-green-200';
  return 'bg-slate-500/15 text-slate-700 border-slate-200';
}
