import { Component, signal, computed, ElementRef, ViewChild, AfterViewChecked, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';

interface CopilotMessage {
  role: 'user' | 'assistant';
  content: string;
  references?: Array<{ label: string; type: string; id?: string }>;
  suggestedQuestions?: string[];
  timestamp: Date;
}

@Component({
  selector: 'app-copilot-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './copilot-panel.component.html',
  styleUrl: './copilot-panel.component.css'
})
export class CopilotPanelComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  isOpen = signal(false);
  isLoading = signal(false);
  messages = signal<CopilotMessage[]>([]);
  inputText = '';
  private shouldScroll = false;

  suggestedQuestions = [
    'What is the current financial position?',
    'Which areas have highest audit risk?',
    'Are there any overdue RFIs?',
    'What is the collection rate?',
    'Which disclosure notes are incomplete?',
  ];

  constructor(private api: ApiService, private router: Router) {}

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  togglePanel() {
    this.isOpen.update(v => !v);
  }

  askQuestion(question: string) {
    this.inputText = question;
    this.sendMessage();
  }

  sendMessage() {
    const text = this.inputText.trim();
    if (!text || this.isLoading()) return;

    const userMsg: CopilotMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    this.messages.update(msgs => [...msgs, userMsg]);
    this.inputText = '';
    this.isLoading.set(true);
    this.shouldScroll = true;

    this.api.post<{ answer: string; references: any[]; suggestedQuestions: string[] }>('/reports/copilot', { question: text })
      .subscribe({
        next: (res) => {
          const assistantMsg: CopilotMessage = {
            role: 'assistant',
            content: res.answer,
            references: res.references,
            suggestedQuestions: res.suggestedQuestions,
            timestamp: new Date(),
          };
          this.messages.update(msgs => [...msgs, assistantMsg]);
          this.isLoading.set(false);
          this.shouldScroll = true;
        },
        error: () => {
          const errorMsg: CopilotMessage = {
            role: 'assistant',
            content: 'Sorry, I encountered an error processing your request. Please try again.',
            timestamp: new Date(),
          };
          this.messages.update(msgs => [...msgs, errorMsg]);
          this.isLoading.set(false);
          this.shouldScroll = true;
        },
      });
  }

  formatContent(content: string): string {
    let html = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/\n- /g, '\n• ');
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  navigateToRef(ref: { label: string; type: string; id?: string }) {
    const routeMap: Record<string, string> = {
      compilation: '/compilations',
      finding: '/findings',
      rfi: '/rfis',
      'working-paper': '/working-papers',
      evidence: '/evidence',
      ratio: '/reports',
      dashboard: '/dashboard',
    };
    const basePath = routeMap[ref.type] || '/dashboard';
    if (ref.id) {
      this.router.navigate([basePath, ref.id]);
    } else {
      this.router.navigate([basePath]);
    }
    this.isOpen.set(false);
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch (_) {}
  }
}
