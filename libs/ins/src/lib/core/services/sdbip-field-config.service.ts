import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { SdbipConfigType, SdbipFieldConfig } from '@ins-core/models/domain.model';

@Injectable({ providedIn: 'root' })
export class SdbipFieldConfigService {
  private readonly api = inject(ApiService);

  load(sdbipType: SdbipConfigType): Observable<SdbipFieldConfig[]> {
    return this.api.get<SdbipFieldConfig[]>('/sdbip-field-configs', { sdbipType }).pipe(
      map((rows) => (Array.isArray(rows) ? [...rows].sort((a, b) => a.sortOrder - b.sortOrder) : [])),
    );
  }

  usage(sdbipType: SdbipConfigType): Observable<Record<string, number>> {
    return this.api.get<{ usage: Record<string, number> }>(`/sdbip-field-configs/${sdbipType}/usage`).pipe(
      map((r) => r?.usage ?? {}),
    );
  }

  save(sdbipType: SdbipConfigType, fields: Omit<SdbipFieldConfig, 'id' | 'sdbipType'>[]): Observable<SdbipFieldConfig[]> {
    return this.api.put<SdbipFieldConfig[]>(`/sdbip-field-configs/${sdbipType}`, { fields }).pipe(
      map((rows) => (Array.isArray(rows) ? [...rows].sort((a, b) => a.sortOrder - b.sortOrder) : [])),
    );
  }

  /** Helpers for capture screens */
  static visiblePrimary(cfg: SdbipFieldConfig[]): SdbipFieldConfig[] {
    return cfg.filter((f) => f.fieldKind === 'primary' && f.isIncluded);
  }

  static customFields(cfg: SdbipFieldConfig[]): SdbipFieldConfig[] {
    return cfg.filter((f) => f.fieldKind === 'custom' && f.isIncluded);
  }

  static isVisible(cfg: SdbipFieldConfig[], key: string): boolean {
    const f = cfg.find((c) => c.fieldKind === 'primary' && c.fieldKey === key);
    return f ? f.isIncluded : true;
  }

  static isRequired(cfg: SdbipFieldConfig[], key: string): boolean {
    const f = cfg.find((c) => c.fieldKind === 'primary' && c.fieldKey === key);
    return f ? f.isIncluded && f.isRequired : false;
  }

  /** Resolve saved custom field values into displayable label/value pairs, using labels from the field config. */
  static customDisplayEntries(
    cfg: SdbipFieldConfig[],
    values: Record<string, string | number | boolean | null> | null | undefined,
  ): { label: string; value: string }[] {
    if (!values) return [];
    const out: { label: string; value: string }[] = [];
    for (const f of SdbipFieldConfigService.customFields(cfg)) {
      const v = values[f.fieldKey];
      if (v === null || v === undefined || v === '') continue;
      let display: string;
      if (typeof v === 'boolean' || f.fieldType === 'boolean') display = v === true || v === 'true' ? 'Yes' : 'No';
      else display = String(v);
      out.push({ label: f.fieldLabel, value: display });
    }
    return out;
  }
}
