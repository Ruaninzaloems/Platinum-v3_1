import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="status-badge" [ngClass]="'status-' + (status || '').toLowerCase()">{{ status }}</span>`,
  styles: [`
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .status-active, .status-approved, .status-completed { background: #e8f5e9; color: #2e7d32; }
    .status-inactive, .status-terminated, .status-rejected { background: #ffebee; color: #c62828; }
    .status-pending { background: #e3f2fd; color: #1565c0; }
    .status-draft { background: #fff3e0; color: #e65100; }
    .status-suspended, .status-warning { background: #fce4ec; color: #ad1457; }
    .status-trial, .status-probation { background: #e3f2fd; color: #1565c0; }
    .status-locked, .status-final { background: #f3e5f5; color: #6a1b9a; }
    .status-vacant { background: #e8eaf6; color: #283593; }
    .status-filled { background: #e0f2f1; color: #00695c; }
    .status-processed { background: #f5f5f5; color: #757575; }
    .status-current { background: #e8f5e9; color: #2e7d32; }
  `]
})
export class StatusBadgeComponent {
  @Input() status: string = '';
}
