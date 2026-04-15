import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface AiInsight {
  text: string;
  severity: 'info' | 'warning' | 'critical';
  action?: string;
  reference?: string;
}

@Component({
  selector: 'app-ai-insight-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ai-insight-card.component.html',
  styleUrl: './ai-insight-card.component.css'
})
export class AiInsightCardComponent {
  insight = input.required<AiInsight>();
  actionClicked = output<AiInsight>();

  severityLabel = computed(() => {
    switch (this.insight().severity) {
      case 'info': return 'Info';
      case 'warning': return 'Warning';
      case 'critical': return 'Critical';
      default: return 'Info';
    }
  });
}
