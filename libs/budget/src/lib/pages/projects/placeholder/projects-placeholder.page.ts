import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-projects-placeholder',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="placeholder-wrap">
      <mat-icon class="placeholder-icon">construction</mat-icon>
      <h2>{{ title }}</h2>
      <p>This feature is coming soon.</p>
    </div>
  `,
  styles: [`
    .placeholder-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      gap: 12px;
      color: #94a3b8;
    }
    .placeholder-icon { font-size: 48px; width: 48px; height: 48px; }
    h2 { font-size: 20px; font-weight: 600; color: #334155; margin: 0; }
    p { font-size: 14px; margin: 0; }
  `]
})
export class ProjectsPlaceholderPage implements OnInit {
  title = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.title = this.route.snapshot.data['title'] ?? 'Coming Soon';
  }
}
