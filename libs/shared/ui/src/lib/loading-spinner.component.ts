import { Component } from '@angular/core';

@Component({
  selector: 'plat-loading-spinner',
  standalone: true,
  template: `
    <div class="spinner-container">
      <div class="spinner"></div>
    </div>
  `,
  styles: [`
    .spinner-container { display: flex; justify-content: center; align-items: center; padding: 2rem; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top: 3px solid #1a237e; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoadingSpinnerComponent {}
