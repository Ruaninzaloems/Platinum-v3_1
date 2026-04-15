export const PERIOD_LABELS: Record<number, string> = {
  1: 'July', 2: 'August', 3: 'September', 4: 'October', 5: 'November', 6: 'December',
  7: 'January', 8: 'February', 9: 'March', 10: 'April', 11: 'May', 12: 'June',
  13: 'Period 13', 14: 'Period 14', 15: 'Period 15',
};

export const PERIOD_SHORT_LABELS: Record<number, string> = {
  1: 'Jul', 2: 'Aug', 3: 'Sep', 4: 'Oct', 5: 'Nov', 6: 'Dec',
  7: 'Jan', 8: 'Feb', 9: 'Mar', 10: 'Apr', 11: 'May', 12: 'Jun',
  13: 'P13', 14: 'P14', 15: 'P15',
};

export function periodToCalendarMonth(period: number): number {
  if (period < 1 || period > 12) return period;
  return period <= 6 ? period + 6 : period - 6;
}

export function calendarMonthToPeriod(calendarMonth: number): number {
  if (calendarMonth < 1 || calendarMonth > 12) return calendarMonth;
  return calendarMonth >= 7 ? calendarMonth - 6 : calendarMonth + 6;
}

export interface MunicipalFinYear {
  raw: string;
  label: string;
  shortLabel: string;
  startYear: number;
  endYear: number;
  startDate: string;
  endDate: string;
}

export function parseMunicipalFinYear(finYear: string): MunicipalFinYear {
  const normalized = finYear.replace(/\s/g, '');
  const parts = normalized.split('/');

  if (parts.length !== 2) {
    throw new Error(`Invalid financial year format "${finYear}". Expected "YYYY/YYYY" or "YYYY/YY".`);
  }

  const startYear = parseInt(parts[0], 10);
  let endYear: number;

  if (parts[1].length === 2) {
    endYear = Math.floor(startYear / 100) * 100 + parseInt(parts[1], 10);
  } else if (parts[1].length === 4) {
    endYear = parseInt(parts[1], 10);
  } else {
    throw new Error(`Invalid financial year format "${finYear}". Second part must be 2 or 4 digits.`);
  }

  if (isNaN(startYear) || isNaN(endYear)) {
    throw new Error(`Invalid financial year format "${finYear}". Could not parse years.`);
  }

  if (endYear !== startYear + 1) {
    throw new Error(`Invalid financial year "${finYear}". End year must be start year + 1.`);
  }

  return {
    raw: finYear,
    label: `${startYear}/${endYear}`,
    shortLabel: `${startYear}/${String(endYear).substring(2)}`,
    startYear,
    endYear,
    startDate: `${startYear}-07-01`,
    endDate: `${endYear}-06-30`,
  };
}

export function getMunicipalQuarter(period: number): number {
  if (period >= 1 && period <= 3) return 1;
  if (period >= 4 && period <= 6) return 2;
  if (period >= 7 && period <= 9) return 3;
  if (period >= 10 && period <= 12) return 4;
  return 0;
}
