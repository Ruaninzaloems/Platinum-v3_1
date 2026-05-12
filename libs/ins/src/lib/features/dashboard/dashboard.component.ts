import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ins-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <iframe
      src="/perf-app/"
      title="Performance Management"
      class="perf-frame"
      allow="clipboard-read; clipboard-write"></iframe>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: calc(100vh - 64px);
      background: #f8fafc;
    }
    .perf-frame {
      width: 100%;
      height: 100%;
      border: 0;
      display: block;
    }
  `]
})
export class InsDashboardComponent {}
