import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell" [class.shell--embedded]="embedded()">
      @if (!embedded()) {
        <app-sidebar class="shell__side" />
      }
      <div class="shell__main">
        @if (!embedded()) {
          <app-topbar class="shell__top" />
        }
        <main class="shell__content" [class.shell__content--embedded]="embedded()">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: grid;
      grid-template-columns: 240px 1fr;
      min-height: 100vh;
    }
    .shell--embedded {
      grid-template-columns: 1fr;
    }
    .shell__side {
      background: var(--plat-surface);
      border-right: 1px solid var(--plat-border);
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
      padding: 24px 32px;
    }
    .shell__content--embedded {
      padding: 16px;
    }
  `],
})
export class AppLayoutComponent {
  protected readonly embedded = signal<boolean>(this.detectEmbedded());

  private detectEmbedded(): boolean {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('embedded') === '1' || window.self !== window.top;
  }
}
