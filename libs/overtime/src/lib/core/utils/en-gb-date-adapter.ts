import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

@Injectable()
export class EnGbDateAdapter extends NativeDateAdapter {
  override parse(value: any): Date | null {
    if (typeof value === 'string' && value.trim()) {
      const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        const day   = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const year  = parseInt(match[3], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime()) && d.getDate() === day && d.getMonth() === month) {
          return d;
        }
        return null;
      }
    }
    return super.parse(value);
  }
}
