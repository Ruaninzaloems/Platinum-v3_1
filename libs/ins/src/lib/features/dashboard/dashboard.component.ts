import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../environment';

@Component({
  selector: 'app-ins-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="page">
      <div class="page-header">
        <mat-icon class="page-icon">dashboard</mat-icon>
        <div>
          <h2>Performance Dashboard</h2>
          <p class="sub">Performance Management System (SDBIP)</p>
        </div>
      </div>

      @if (loading()) {
        <div class="state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading performance data…</p>
        </div>
      } @else if (error()) {
        <mat-card class="state-card error-card">
          <mat-card-content>
            <mat-icon class="big-icon error-icon">cloud_off</mat-icon>
            <h3>Performance service unavailable</h3>
            <p class="muted">{{ error() }}</p>
            <p class="muted small">API endpoint: {{ apiBase }}</p>
            <button mat-stroked-button (click)="load()">
              <mat-icon>refresh</mat-icon> Retry
            </button>
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-card class="state-card">
          <mat-card-content>
            <mat-icon class="big-icon ok-icon">check_circle</mat-icon>
            <h3>Performance Dashboard</h3>
            <p class="muted">Connected to Insights API at {{ apiBase }}</p>
            @if (info()) {
              <pre class="info">{{ info() | json }}</pre>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page { padding: 1.5rem; }
    .page-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .page-icon { font-size: 32px; width: 32px; height: 32px; color: #311b92; }
    h2 { font-size: 1.3rem; font-weight: 700; margin: 0; }
    .sub { color: #64748b; font-size: 0.85rem; margin: 0; }
    .state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: #64748b; }
    .state-card { max-width: 640px; margin: 0 auto; }
    .state-card mat-card-content { text-align: center; padding: 2.5rem 1.5rem; }
    .big-icon { font-size: 64px; width: 64px; height: 64px; opacity: .35; margin-bottom: 1rem; }
    .ok-icon { color: #10b981; }
    .error-icon { color: #ef4444; }
    .error-card { border-left: 4px solid #ef4444; }
    h3 { margin: 0 0 .5rem; }
    .muted { color: #64748b; margin-bottom: .5rem; }
    .small { font-size: .8rem; font-family: monospace; }
    .info { text-align: left; background: #f8fafc; padding: 1rem; border-radius: 6px; font-size: .8rem; margin-top: 1rem; max-height: 200px; overflow: auto; }
  `]
})
export class InsDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  loading = signal(false);
  error = signal<string | null>(null);
  info = signal<unknown>(null);
  apiBase = environment.apiPrefix + '/api';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get(`${this.apiBase}/dashboard`).subscribe({
      next: (data) => { this.info.set(data); this.loading.set(false); },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.status === 0
          ? 'Cannot reach the Performance API. The service may be offline.'
          : `${err.status} ${err.statusText || 'Request failed'}`);
        this.loading.set(false);
      }
    });
  }
}
