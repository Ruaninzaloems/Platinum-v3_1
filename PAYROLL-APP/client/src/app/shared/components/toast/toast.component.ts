import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService, ToastMessage } from '../../../core/services/ui.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent {
  toasts$;

  constructor(private ui: UiService) {
    this.toasts$ = this.ui.toasts$;
  }

  dismiss(id: number): void {
    this.ui.dismissToast(id);
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'checkCircle';
      case 'error': return 'alertCircle';
      case 'warning': return 'alertTriangle';
      default: return 'info';
    }
  }
}
