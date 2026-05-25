import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bar">
      <div class="bar__org">
        <span class="bar__org-name">Demo Municipality</span>
        <span class="pill pill--info">FY 2024/2025</span>
      </div>
      <div class="bar__search">
        <mat-icon>search</mat-icon>
        <input type="search" placeholder="Search..." />
      </div>
      <div class="bar__right">
        <a class="iconbtn" routerLink="/notifications" aria-label="Notifications">
          <mat-icon>notifications</mat-icon>
          <span class="iconbtn__dot"></span>
        </a>
        <div class="bar__user">
          <div class="bar__user-text">
            <div class="bar__user-name">{{ displayName() }}</div>
            <div class="bar__user-role">{{ role() }}</div>
          </div>
          <div class="avatar">{{ initials() }}</div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    :host { display: block; }
    .bar { display: grid; grid-template-columns: minmax(220px, auto) 1fr auto; align-items: center; gap: 24px; padding: 12px 28px; min-height: 60px; }
    .bar__org { display: flex; align-items: center; gap: 10px; }
    .bar__org-name { font-weight: 600; color: #0f172a; }
    .pill { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .pill--info { background: #dbeafe; color: #1e40af; }
    .bar__search { display: flex; align-items: center; gap: 8px; max-width: 460px; width: 100%; background: #f8fafc; border: 1px solid var(--plat-border); border-radius: 999px; padding: 6px 14px; color: #94a3b8; }
    .bar__search input { flex: 1; border: 0; background: transparent; outline: none; font: inherit; color: #0f172a; }
    .bar__search mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .bar__right { display: flex; align-items: center; gap: 16px; }
    .iconbtn { position: relative; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; color: #475569; cursor: pointer; }
    .iconbtn:hover { background: #f1f5f9; text-decoration: none; }
    .iconbtn__dot { position: absolute; top: 8px; right: 8px; width: 8px; height: 8px; border-radius: 50%; background: #dc2626; border: 2px solid #fff; }
    .bar__user { display: flex; align-items: center; gap: 10px; }
    .bar__user-text { text-align: right; line-height: 1.2; }
    .bar__user-name { font-weight: 600; font-size: 14px; color: #0f172a; }
    .bar__user-role { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: .04em; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #1f6feb, #0f2b46); color: #fff; font-weight: 700; font-size: 13px; display: grid; place-items: center; }
  `],
})
export class TopbarComponent {
  private readonly auth = inject(AuthService);
  readonly displayName = this.auth.displayName;
  readonly role = computed(() => this.auth.role().replace(/_/g, ' '));
  readonly initials = computed(() => {
    const name = this.auth.displayName();
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? '').join('') || 'U';
  });
}
