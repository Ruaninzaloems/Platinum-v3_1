import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <app-sidebar class="shell__side" />
      <div class="shell__main">
        <app-topbar class="shell__top" />
        <main class="shell__content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: grid;
      grid-template-columns: 220px 1fr;
      min-height: 100vh;
    }
    .shell__side {
      background: var(--plat-navy);
      border-right: 1px solid #1e293b;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }
    .shell__main {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .shell__top {
      background: var(--plat-surface);
      border-bottom: 1px solid var(--plat-border);
      position: sticky;
      top: 0;
      z-index: 5;
    }
    .shell__content {
      flex: 1;
      padding: 16px 20px;
    }
  `],
})
export class AppLayoutComponent {}
