import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateTimeSa', standalone: true })
export class DateTimeSaPipe implements PipeTransform {
  transform(value: any): string {
    if (!value) return '-';
    const dt = new Date(value);
    if (isNaN(dt.getTime())) return '-';
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const h = String(dt.getHours()).padStart(2, '0');
    const min = String(dt.getMinutes()).padStart(2, '0');
    return `${d}/${m}/${y} ${h}:${min}`;
  }
}
