import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateSa', standalone: true })
export class DateSaPipe implements PipeTransform {
  transform(value: any): string {
    if (!value) return '-';
    const dt = new Date(value);
    if (isNaN(dt.getTime())) return '-';
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${d}/${m}/${y}`;
  }
}
