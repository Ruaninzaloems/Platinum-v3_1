import { Injectable, signal } from '@angular/core';

export interface PeriodRange {
  from: number;
  to: number;
}

@Injectable({ providedIn: 'root' })
export class PeriodFilterService {
  selectedFyId = signal<string>('');
  selectedFyLabel = signal<string>('');

  static readonly PERIOD_OPTIONS = [
    { value: 'full_year', label: 'Full Year (12 months)' },
    { value: 'month_1', label: 'Month 1 (Jul)' },
    { value: 'month_2', label: 'Month 2 (Aug)' },
    { value: 'month_3', label: 'Month 3 (Sep)' },
    { value: 'q1', label: 'Quarter 1 (Jul-Sep)' },
    { value: 'month_4', label: 'Month 4 (Oct)' },
    { value: 'month_5', label: 'Month 5 (Nov)' },
    { value: 'month_6', label: 'Month 6 (Dec)' },
    { value: 'q2', label: 'Quarter 2 (Oct-Dec)' },
    { value: 'half_year', label: 'Half Year (Jul-Dec)' },
    { value: 'month_7', label: 'Month 7 (Jan)' },
    { value: 'month_8', label: 'Month 8 (Feb)' },
    { value: 'month_9', label: 'Month 9 (Mar)' },
    { value: 'q3', label: 'Quarter 3 (Jan-Mar)' },
    { value: 'month_10', label: 'Month 10 (Apr)' },
    { value: 'month_11', label: 'Month 11 (May)' },
    { value: 'month_12', label: 'Month 12 (Jun)' },
    { value: 'q4', label: 'Quarter 4 (Apr-Jun)' },
    { value: '9_months', label: '9 Months (Jul-Mar)' },
    { value: '10_months', label: '10 Months (Jul-Apr)' },
    { value: '11_months', label: '11 Months (Jul-May)' },
  ];

  static periodToMonthRange(period: string): PeriodRange {
    const monthMatch = period.match(/^month_(\d+)$/);
    if (monthMatch) {
      const m = parseInt(monthMatch[1], 10);
      return { from: m, to: m };
    }

    switch (period) {
      case 'q1': return { from: 1, to: 3 };
      case 'q2': return { from: 4, to: 6 };
      case 'q3': return { from: 7, to: 9 };
      case 'q4': return { from: 10, to: 12 };
      case 'half_year': return { from: 1, to: 6 };
      case '9_months': return { from: 1, to: 9 };
      case '10_months': return { from: 1, to: 10 };
      case '11_months': return { from: 1, to: 11 };
      default: return { from: 1, to: 12 };
    }
  }

  static buildPeriodQueryString(period: string): string {
    if (period === 'full_year') return '';
    const range = PeriodFilterService.periodToMonthRange(period);
    return `periodFrom=${range.from}&periodTo=${range.to}`;
  }

  static appendPeriodToUrl(baseUrl: string, period: string): string {
    const qs = PeriodFilterService.buildPeriodQueryString(period);
    if (!qs) return baseUrl;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${qs}`;
  }
}
