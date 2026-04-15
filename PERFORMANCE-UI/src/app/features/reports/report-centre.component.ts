import { Component, signal, OnInit } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';
  import { MatCardModule } from '@angular/material/card';
  import { MatIconModule } from '@angular/material/icon';
  import { MatButtonModule } from '@angular/material/button';
  import { MatTableModule } from '@angular/material/table';
  import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
  import { MatChipsModule } from '@angular/material/chips';
  import { MatTabsModule } from '@angular/material/tabs';
  import { ApiService } from '../../core/services/api.service';

  @Component({
    selector: 'app-report-centre',
    standalone: true,
    imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatTableModule, MatProgressSpinnerModule, MatChipsModule, MatTabsModule],
    template: `
      <div class="page-container">
        <div class="page-header">
          <div class="header-left">
            <mat-icon class="page-icon">assessment</mat-icon>
            <div>
              <h2>Report Centre</h2>
              <p class="page-subtitle">Performance Management System</p>
            </div>
          </div>
        </div>
        <div class="page-content">
          @if (loading()) {
            <div class="loading-state">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading...</p>
            </div>
          } @else {
            <mat-card class="content-card">
              <mat-card-content>
                <div class="placeholder-content">
                  <mat-icon class="placeholder-icon">assessment</mat-icon>
                  <h3>Report Centre</h3>
                  <p>This module is connected to the Performance API and ready for data.</p>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      </div>
    `,
    styles: [`
      .page-container { padding: 1.5rem; }
      .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
      .header-left { display: flex; align-items: center; gap: 1rem; }
      .page-icon { font-size: 32px; width: 32px; height: 32px; color: #311b92; }
      h2 { font-size: 1.35rem; font-weight: 700; }
      .page-subtitle { color: #64748b; font-size: 0.85rem; }
      .content-card { border-radius: 12px; }
      .placeholder-content { text-align: center; padding: 3rem; }
      .placeholder-icon { font-size: 64px; width: 64px; height: 64px; color: #311b92; opacity: 0.3; margin-bottom: 1rem; }
      .placeholder-content h3 { font-size: 1.2rem; margin-bottom: 0.5rem; }
      .placeholder-content p { color: #64748b; }
      .loading-state { display: flex; flex-direction: column; align-items: center; padding: 4rem; gap: 1rem; }
      .loading-state p { color: #64748b; }
    `]
  })
  export class ReportCentreComponent implements OnInit {
    loading = signal(false);

    constructor(private api: ApiService) {}

    ngOnInit() {}
  }
  