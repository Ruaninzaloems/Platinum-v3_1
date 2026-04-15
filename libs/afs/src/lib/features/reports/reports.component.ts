import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { DashboardData, Compilation } from '../../core/models/interfaces';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent implements OnInit {
  private api = inject(ApiService);

  dashboard = signal<DashboardData | null>(null);
  compilations = signal<Compilation[]>([]);
  analytics = signal<any>(null);
  selectedCompilationId = '';

  ngOnInit() {
    this.loadDashboard();
    this.loadCompilations();
  }

  loadDashboard() {
    this.api.get<DashboardData>('/reports/dashboard').subscribe({
      next: (data) => this.dashboard.set(data),
    });
  }

  loadCompilations() {
    this.api.get<Compilation[]>('/compilations').subscribe({
      next: (data) => this.compilations.set(data),
    });
  }

  loadAnalytics() {
    if (!this.selectedCompilationId) return;
    this.analytics.set(null);
    this.api.get<any>(`/reports/analytics/${this.selectedCompilationId}`).subscribe({
      next: (data) => this.analytics.set(data),
    });
  }

  severityEntries(): [string, number][] {
    const d = this.dashboard();
    if (!d?.findingsBySeverity) return [];
    return Object.entries(d.findingsBySeverity);
  }

  statusEntries(): [string, number][] {
    const d = this.dashboard();
    if (!d?.compilationsByStatus) return [];
    return Object.entries(d.compilationsByStatus);
  }
}
