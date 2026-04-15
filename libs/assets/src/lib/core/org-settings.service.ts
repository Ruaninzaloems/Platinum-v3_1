import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface OrgSettings {
  municipality_name: string;
  financial_year: string;
  current_period: number;
  current_period_month: number;
  mscoa_enabled: boolean;
  measurement_model: string;
  approval_method: string;
}

@Injectable({ providedIn: 'root' })
export class OrgSettingsService {
  private readonly PG_API = '/api';

  settings = signal<OrgSettings | null>(null);

  constructor(private http: HttpClient) {
    this.load();
  }

  load() {
    this.http.get<OrgSettings>(`${this.PG_API}/settings`).subscribe({
      next: (s) => {
        if (s) {
          this.settings.set(s);
        }
      },
      error: () => {}
    });
  }

  save(data: any) {
    return this.http.put<OrgSettings>(`${this.PG_API}/settings`, data);
  }
}
