import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { CardComponent } from '../../shared/components/card.component';

@Component({
  selector: 'app-indigent-placeholder',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, CardComponent],
  template: `
    <app-page-header [title]="pageName" subtitle="Indigent Management Module" />
    <app-card title="Coming Soon">
      <div class="placeholder-content" data-testid="placeholder-content">
        <span class="material-icons placeholder-icon">construction</span>
        <p>The <strong>{{ pageName }}</strong> page is under development and will be available in a future phase.</p>
      </div>
    </app-card>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; gap: 1.5rem; }
    .placeholder-content { display: flex; flex-direction: column; align-items: center; padding: 3rem; gap: 1rem; color: var(--text-secondary, #64748b); text-align: center; }
    .placeholder-icon { font-size: 3rem; opacity: 0.5; }
  `]
})
export class IndigentPlaceholderComponent {
  private route = inject(ActivatedRoute);
  pageName = (this.route.snapshot.data?.['page'] as string) || 'Indigent';
}
