import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService, ConfirmConfig } from '../../../core/services/ui.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent {
  visible = false;
  config: ConfirmConfig = { title: '', message: '' };
  private resolve?: (value: boolean) => void;

  constructor(private ui: UiService) {
    this.ui.confirm$.subscribe(({ config, resolve }) => {
      this.config = config;
      this.resolve = resolve;
      this.visible = true;
    });
  }

  confirm(): void {
    this.resolve?.(true);
    this.visible = false;
  }

  cancel(): void {
    this.resolve?.(false);
    this.visible = false;
  }
}
