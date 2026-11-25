import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Minimal placeholder login page. Real authentication (JWT) will
 * replace this; today the guard only sends users here when the
 * backend rejects `/auth/me` and dev fallback is disabled.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login">
      <div class="login__card">
        <div class="login__brand">PLATINUM PERFORMANCE</div>
        <h1 class="login__title">Sign in required</h1>
        <p class="login__body">
          Your session has expired or you are not authenticated.
          A full sign-in flow ships with the auth module — for now,
          retry from the dashboard.
        </p>
        <a class="login__cta" routerLink="/dashboard">Retry</a>
      </div>
    </div>
  `,
  styles: [`
    .login { min-height: 100vh; display: grid; place-items: center; background: var(--plat-bg); }
    .login__card { background: var(--plat-surface); border: 1px solid var(--plat-border); border-radius: 16px; padding: 36px 40px; max-width: 420px; text-align: center; }
    .login__brand { font-size: 12px; font-weight: 700; letter-spacing: .12em; color: var(--plat-blue); margin-bottom: 12px; }
    .login__title { margin: 0 0 8px; }
    .login__body { color: var(--plat-muted); margin: 0 0 24px; line-height: 1.5; }
    .login__cta { display: inline-block; padding: 10px 18px; border-radius: 8px; background: var(--plat-blue); color: #fff; font-weight: 600; }
    .login__cta:hover { background: var(--plat-navy); text-decoration: none; }
  `],
})
export class LoginComponent {}
