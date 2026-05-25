import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="nf">
      <div class="nf__code">404</div>
      <h1 class="nf__title">Page not found</h1>
      <p class="nf__body">The page you’re looking for doesn’t exist or has been moved.</p>
      <a routerLink="/dashboard" class="nf__cta">Back to dashboard</a>
    </div>
  `,
  styles: [`
    .nf { max-width: 560px; margin: 64px auto; text-align: center; }
    .nf__code { font-size: 64px; font-weight: 800; color: var(--plat-blue); }
    .nf__title { margin: 0 0 8px; }
    .nf__body { color: var(--plat-muted); margin: 0 0 24px; }
    .nf__cta {
      display: inline-block; padding: 10px 18px; border-radius: 8px;
      background: var(--plat-blue); color: #fff; font-weight: 600;
    }
    .nf__cta:hover { text-decoration: none; background: var(--plat-navy); }
  `],
})
export class NotFoundComponent {}
