import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-ins-perf-frame',
  standalone: true,
  imports: [CommonModule],
  template: `
    <iframe
      [src]="iframeUrl()"
      title="Performance Management"
      class="perf-frame"
      allow="clipboard-read; clipboard-write"></iframe>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: calc(100vh - 64px);
      background: #f8fafc;
    }
    .perf-frame {
      width: 100%;
      height: 100%;
      border: 0;
      display: block;
    }
  `]
})
export class InsDashboardComponent {
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  private currentUrl = signal<string>(this.router.url);

  iframeUrl = computed<SafeResourceUrl>(() => {
    const url = this.currentUrl();
    // Strip the /ins prefix from the Angular route to get the perf-app path.
    let path = url.replace(/^\/ins/, '');
    if (path === '' || path === '/') path = '/';
    if (path === '/dashboard') path = '/';
    // Strip any query string the Angular router added.
    const q = path.indexOf('?');
    if (q >= 0) path = path.slice(0, q);
    if (!path.startsWith('/')) path = '/' + path;
    const target = `/perf-app${path}?embedded=1`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(target);
  });

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.currentUrl.set(e.urlAfterRedirects || e.url));
  }
}
