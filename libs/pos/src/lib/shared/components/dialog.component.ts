import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-dialog',
  standalone: true,
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.css'
})
export class DialogComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Output() close = new EventEmitter<void>();

  private mouseDownOnOverlay = false;

  onOverlayMouseDown(event: MouseEvent): void {
    this.mouseDownOnOverlay = (event.target as HTMLElement).classList.contains('dialog-overlay');
  }

  onOverlayClick(event: MouseEvent): void {
    const targetIsOverlay = (event.target as HTMLElement).classList.contains('dialog-overlay');
    if (targetIsOverlay && this.mouseDownOnOverlay) {
      this.close.emit();
    }
    this.mouseDownOnOverlay = false;
  }
}
