import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DatabaseToggleService } from './database-toggle.service';
import { AuthService } from './auth.service';

export interface OrgSettings {
  municipality_name: string;
  financial_year: string;
  current_period: number;
  current_period_month: number;
  mscoa_enabled: boolean;
  measurement_model: string;
  approval_method: string;
  gl_use_inbox: boolean;
  gl_led_target: string;
  mscoa_use_dept_division: boolean;
}

@Injectable({ providedIn: 'root' })
export class OrgSettingsService {
  settings = signal<OrgSettings | null>(null);

  constructor(private http: HttpClient, private dbToggle: DatabaseToggleService, private auth: AuthService) {
    this.load();
  }

  load() {
    var self = this;
    this.http.get<OrgSettings>(`${this.dbToggle.apiPrefix}/settings`).subscribe({
      next: function(s) {
        if (!s) return;
        var base = s;
        var userId = self.auth.getCurrentUserId();
        if (userId !== null) {
          self.http.get<any>(`${self.dbToggle.apiPrefix}/user-processing-months/current?userId=${userId}`).subscribe({
            next: function(upm) {
              var pm = upm && (upm.processingMonth ?? upm.ProcessingMonth);
              if (pm !== null && pm !== undefined && !isNaN(Number(pm))) {
                self.settings.set(Object.assign({}, base, { current_period_month: Number(pm) }));
              } else {
                self.settings.set(base);
              }
            },
            error: function() {
              self.settings.set(base);
            }
          });
        } else {
          self.settings.set(base);
        }
      },
      error: function() {}
    });
  }

  save(data: any) {
    return this.http.put<OrgSettings>(`${this.dbToggle.apiPrefix}/settings`, data);
  }

  whenLoaded(): Observable<OrgSettings> {
    const current = this.settings();
    if (current) return of(current);
    return this.http.get<OrgSettings>(`${this.dbToggle.apiPrefix}/settings`).pipe(
      tap((s: OrgSettings) => { if (s) this.settings.set(s); })
    );
  }
}
