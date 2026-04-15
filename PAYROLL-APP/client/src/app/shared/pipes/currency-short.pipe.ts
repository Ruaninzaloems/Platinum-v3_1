import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyShort', standalone: true })
export class CurrencyShortPipe implements PipeTransform {
  transform(value: any): string {
    const num = parseFloat(value) || 0;
    if (num >= 1e6) return `R ${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `R ${(num / 1e3).toFixed(0)}K`;
    return `R ${num.toFixed(0)}`;
  }
}
