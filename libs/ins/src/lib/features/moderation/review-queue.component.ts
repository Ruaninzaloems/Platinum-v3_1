import { Component, signal, OnInit, inject } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { HttpClient } from '@angular/common/http';
  import { MatCardModule } from '@angular/material/card';
  import { MatIconModule } from '@angular/material/icon';
  import { MatButtonModule } from '@angular/material/button';
  import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
  import { environment } from '../../environment';

  @Component({
    selector: 'app-ins-review-queue',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
    template: `
      <div class="page">
        <div class="page-header">
          <mat-icon class="page-icon">queue</mat-icon>
          <div><h2>Review Queue</h2><p class="sub">Performance Management System</p></div>
        </div>
        @if (loading()) {
          <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
        } @else {
          <mat-card><mat-card-content>
            <div class="center-content">
              <mat-icon class="big-icon">queue</mat-icon>
              <h3>Review Queue</h3>
              <p>Connected to Insights API at {{ apiBase }}</p>
            </div>
          </mat-card-content></mat-card>
        }
      </div>
    `,
    styles: [`
      .page { padding: 1.5rem; }
      .page-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
      .page-icon { font-size: 32px; width: 32px; height: 32px; color: #311b92; }
      h2 { font-size: 1.3rem; font-weight: 700; margin: 0; }
      .sub { color: #64748b; font-size: 0.85rem; margin: 0; }
      .center { display: flex; justify-content: center; padding: 4rem; }
      .center-content { text-align: center; padding: 3rem; }
      .big-icon { font-size: 64px; width: 64px; height: 64px; color: #311b92; opacity: .25; margin-bottom: 1rem; }
      .center-content h3 { margin-bottom: .5rem; }
      .center-content p { color: #64748b; }
    `]
  })
  export class ReviewQueueComponent implements OnInit {
    private http = inject(HttpClient);
    loading = signal(false);
    apiBase = environment.apiPrefix + '/api';

    ngOnInit() {}
  }
  