import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ins-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="perf-frame-wrap">
      <iframe
        src="/perf-app/"
        title="Performance Management"
        class="perf-frame"
        allow="clipboard-read; clipboard-write"></iframe>
    </div>
  `,
  styles: [`
    :host { display:block; height: 100%; }
    .perf-frame-wrap { position: absolute; inset: 0; background: #f8fafc; }
    .perf-frame { width: 100%; height: 100%; border: 0; display: block; }
  `]
})
export class InsDashboardComponent {}
