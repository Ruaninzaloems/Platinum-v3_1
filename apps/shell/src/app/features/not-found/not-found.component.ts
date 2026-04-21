import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule],
  template: `
    <div class="nf">
      <mat-icon class="nf-icon">error_outline</mat-icon>
      <h1>Page not found</h1>
      <p class="path">{{ attemptedUrl }}</p>
      <p class="hint">
        The page you tried to open could not be loaded. This usually means the
        module's lazy bundle failed to load (build still compiling, network issue,
        or runtime error in the module).
      </p>
      <div class="actions">
        <a mat-flat-button color="primary" routerLink="/dashboard">
          <mat-icon>home</mat-icon> Go to dashboard
        </a>
        <button mat-stroked-button (click)="reload()">
          <mat-icon>refresh</mat-icon> Reload
        </button>
      </div>
    </div>
  `,
  styles: [`
    .nf { max-width: 640px; margin: 6rem auto; text-align: center; padding: 2rem; }
    .nf-icon { font-size: 72px; width: 72px; height: 72px; color: #ef4444; opacity: .7; }
    h1 { margin: 1rem 0 .25rem; font-size: 1.6rem; }
    .path { font-family: monospace; color: #475569; background: #f1f5f9; padding: .5rem .75rem; border-radius: 6px; display: inline-block; margin-bottom: 1rem; word-break: break-all; }
    .hint { color: #64748b; font-size: .95rem; line-height: 1.6; margin-bottom: 1.5rem; }
    .actions { display: flex; gap: .75rem; justify-content: center; }
  `]
})
export class NotFoundComponent {
  private router = inject(Router);
  attemptedUrl = this.router.url;
  reload() { window.location.reload(); }
}
