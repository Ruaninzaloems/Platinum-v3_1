import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyZar', standalone: true })
export class CurrencyZarPipe implements PipeTransform {
  transform(value: any): string {
    const n = parseFloat(value) || 0;
    return 'R' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
