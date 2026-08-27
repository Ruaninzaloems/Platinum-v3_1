import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [NgClass, NgIf, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div class="page-header__left">
        <div class="page-header__icon" [ngClass]="'tone-' + tone">
          <mat-icon>{{ icon }}</mat-icon>
        </div>
        <div>
          <h1>{{ title }}</h1>
          <p *ngIf="subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="page-header__actions"><ng-content></ng-content></div>
    </header>
  `,
  styles: [`
    .page-header {
      display: flex; justify-content: space-between; align-items: center; gap: 16px;
      background: var(--plat-surface); border: 1px solid var(--plat-border);
      border-radius: 16px; box-shadow: var(--plat-shadow-sm); padding: 20px 24px;
    }
    .page-header__left { display: flex; align-items: center; gap: 14px; }
    .page-header__icon {
      width: 44px; height: 44px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .page-header__icon mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .tone-blue   { background: #eff6ff; color: #2563eb; }
    .tone-indigo { background: #eef2ff; color: #4f46e5; }
    .tone-purple { background: #faf5ff; color: #7e22ce; }
    .tone-green  { background: #f0fdf4; color: #16a34a; }
    .tone-orange { background: #fff7ed; color: #ea580c; }
    .tone-red    { background: #fef2f2; color: #dc2626; }
    .tone-slate  { background: #f1f5f9; color: #475569; }
    .tone-cyan   { background: #ecfeff; color: #0891b2; }
    h1 { margin: 0; font-size: 22px; font-weight: 700; color: #0f172a; }
    p  { margin: 4px 0 0 0; color: #64748b; font-size: 14px; }
    .page-header__actions { display: flex; gap: 8px; align-items: center; }
  `],
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = 'dashboard';
  @Input() tone: 'blue' | 'indigo' | 'purple' | 'green' | 'orange' | 'red' | 'slate' | 'cyan' = 'blue';
}
