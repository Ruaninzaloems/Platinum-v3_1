import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="wrap"><mat-spinner diameter="32"></mat-spinner></div>`,
  styles: [`.wrap { display: flex; justify-content: center; padding: 32px; }`],
})
export class LoadingSpinnerComponent {}
