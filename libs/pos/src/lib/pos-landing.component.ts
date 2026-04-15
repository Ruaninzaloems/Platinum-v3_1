import { Component } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { MatIconModule } from '@angular/material/icon';

  @Component({
    selector: 'lib-pos-landing',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    template: `
      <div class="module-landing">
        <div class="module-header">
          <mat-icon class="module-icon">point_of_sale</mat-icon>
          <h2>Point of Sale</h2>
          <p>Module loaded successfully. Components are being migrated.</p>
        </div>
      </div>
    `,
    styles: [`
      .module-landing { padding: 2rem; }
      .module-header { text-align: center; padding: 4rem 2rem; }
      .module-icon { font-size: 64px; width: 64px; height: 64px; color: #1a237e; margin-bottom: 1rem; }
      h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
      p { color: #64748b; }
    `]
  })
  export class PosLandingComponent {}
  