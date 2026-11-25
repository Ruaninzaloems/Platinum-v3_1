import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { inject } from '@angular/core';

/**
 * Generic page used for every feature route that has not yet been
 * migrated from React. Renders the page title and a clear "in
 * migration" notice so the user knows what is wired but not yet
 * implemented.
 */
@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="crumb">{{ section() }} / {{ title() }}</div>
      <h1 class="page__title">{{ title() }}</h1>

      <div class="plat-card placeholder">
        <div class="placeholder__icon">
          <span class="material-symbols-rounded">construction</span>
        </div>
        <div>
          <h2 class="placeholder__heading">Migration in progress</h2>
          <p class="placeholder__body">
            This page exists in the new Angular shell, but the implementation
            is being ported from the previous React build. The route, sidebar
            entry, layout and auth context are already live — only the page
            body still needs porting.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; }
    .crumb { font-size: 12px; color: var(--plat-muted); text-transform: uppercase; letter-spacing: .08em; }
    .page__title { font-size: 28px; font-weight: 700; margin: 6px 0 24px; }

    .placeholder {
      display: flex; align-items: flex-start; gap: 20px;
    }
    .placeholder__icon {
      width: 56px; height: 56px; border-radius: 12px;
      background: var(--plat-blue-100); color: var(--plat-blue);
      display: grid; place-items: center;
    }
    .placeholder__icon .material-symbols-rounded { font-size: 32px; }
    .placeholder__heading { margin: 0 0 6px; font-size: 18px; font-weight: 600; }
    .placeholder__body { margin: 0; color: var(--plat-muted); line-height: 1.5; }
  `],
})
export class PlaceholderComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title = toSignal(
    this.route.data.pipe(map((d) => (d['title'] as string | undefined) ?? 'Page')),
    { initialValue: 'Page' },
  );
  readonly section = toSignal(
    this.route.data.pipe(map((d) => (d['section'] as string | undefined) ?? 'Platinum')),
    { initialValue: 'Platinum' },
  );
}
