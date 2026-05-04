import { Component, OnInit, inject, signal } from '@angular/core';
import { OvertimeSetupComponent } from './overtime-setup.component';
import { PositionApprovalSetupComponent } from '../position-approval-setup/position-approval-setup.component';
import { OvertimeConfigService } from '../../../../core/services/overtime-config.service';

type SetupTab = 'config' | 'position';

@Component({
  selector: 'app-overtime-setup-tabs',
  standalone: true,
  imports: [OvertimeSetupComponent, PositionApprovalSetupComponent],
  template: `
    <div class="page-content setup-shell">
      <header class="page-header">
        <div class="page-header-text">
          <h1 class="page-title">Overtime Setup</h1>
          <p class="page-subtitle">
            Configure module-level overtime rules and per-position approval routing
          </p>
        </div>
      </header>

      <nav class="tabs setup-tabs" role="tablist" aria-label="Overtime Setup tabs">
        <button type="button" role="tab"
                id="os-tab-config"
                class="tab" [class.active]="active() === 'config'"
                [attr.aria-selected]="active() === 'config'"
                aria-controls="os-tabpanel-config"
                [attr.tabindex]="active() === 'config' ? 0 : -1"
                (keydown)="onTabKeydown($event)"
                (click)="active.set('config')">
          Configuration
        </button>
        <button type="button" role="tab"
                id="os-tab-position"
                class="tab" [class.active]="active() === 'position'"
                [attr.aria-selected]="active() === 'position'"
                aria-controls="os-tabpanel-position"
                [attr.tabindex]="active() === 'position' ? 0 : -1"
                (keydown)="onTabKeydown($event)"
                (click)="active.set('position')">
          Position Approval Setup
        </button>
      </nav>

      <div class="tab-body">
        @if (active() === 'config') {
          <div role="tabpanel" id="os-tabpanel-config" aria-labelledby="os-tab-config">
            <app-overtime-setup />
          </div>
        }
        @if (active() === 'position') {
          <div role="tabpanel" id="os-tabpanel-position" aria-labelledby="os-tab-position">
            <app-position-approval-setup />
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .setup-shell { padding: 0; }
    .setup-tabs { margin-bottom: 16px; }
    .tab-body { display: block; }
  `]
})
export class OvertimeSetupTabsComponent implements OnInit {
  private svc = inject(OvertimeConfigService);

  active = signal<SetupTab>('config');

  ngOnInit(): void {
    this.svc.get().subscribe({
      next: cfg => {
        if (cfg?.allowOvertimeMultipleApproval) {
          this.active.set('position');
        }
      },
      error: () => { /* leave on Configuration tab */ }
    });
  }

  onTabKeydown(event: KeyboardEvent): void {
    const key = event.key;
    if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;
    event.preventDefault();
    const tabs: SetupTab[] = ['config', 'position'];
    const currentIndex = tabs.indexOf(this.active());
    const nextIndex = key === 'ArrowRight'
      ? (currentIndex + 1) % tabs.length
      : (currentIndex - 1 + tabs.length) % tabs.length;
    const next = tabs[nextIndex];
    this.active.set(next);
    queueMicrotask(() => {
      const el = document.getElementById('os-tab-' + next) as HTMLElement | null;
      el?.focus();
    });
  }
}
