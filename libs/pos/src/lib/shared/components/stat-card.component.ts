import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.css'
})
export class StatCardComponent {
  private router = inject(Router);

  @Input() label = '';
  @Input() value: string | number = '';
  @Input() icon = '';
  @Input() trend = '';
  @Input() trendDirection: 'up' | 'down' | 'neutral' = 'neutral';
  @Input() variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gold' = 'default';
  @Input() link = '';

  handleClick(): void {
    if (this.link) {
      const [path, qs] = this.link.split('?');
      if (qs) {
        const queryParams: Record<string, string> = {};
        for (const pair of qs.split('&')) {
          const [k, v] = pair.split('=');
          if (k) queryParams[decodeURIComponent(k)] = decodeURIComponent(v || '');
        }
        this.router.navigate([path], { queryParams });
      } else {
        this.router.navigate([path]);
      }
    }
  }
}
