import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="'badge--' + tone()">{{ label() || status }}</span>`,
  styles: [`
    .badge {
      display: inline-flex; align-items: center; padding: 2px 10px;
      border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: .03em;
      text-transform: uppercase;
    }
    .badge--green   { background: #dcfce7; color: #166534; }
    .badge--blue    { background: #dbeafe; color: #1e40af; }
    .badge--amber   { background: #fef3c7; color: #92400e; }
    .badge--red     { background: #fee2e2; color: #991b1b; }
    .badge--slate   { background: #f1f5f9; color: #475569; }
    .badge--purple  { background: #f3e8ff; color: #6b21a8; }
  `],
})
export class StatusBadgeComponent {
  @Input() status: string = '';
  @Input() override?: 'green' | 'blue' | 'amber' | 'red' | 'slate' | 'purple';

  private readonly _status = signal<string>('');
  label = computed(() => this.status);
  tone = computed<'green'|'blue'|'amber'|'red'|'slate'|'purple'>(() => {
    if (this.override) return this.override;
    const s = (this.status || '').toLowerCase();
    if (['active', 'open', 'approved', 'achieved', 'verified', 'completed', 'success', 'on track', 'green'].some(k => s.includes(k))) return 'green';
    if (['draft', 'pending', 'submitted', 'in progress', 'review'].some(k => s.includes(k))) return 'blue';
    if (['at risk', 'warning', 'returned', 'overdue', 'amber', 'partial'].some(k => s.includes(k))) return 'amber';
    if (['rejected', 'failed', 'closed', 'inactive', 'archived', 'missed', 'red', 'destructive', 'error'].some(k => s.includes(k))) return s.includes('closed') || s.includes('archived') || s.includes('inactive') ? 'slate' : 'red';
    return 'slate';
  });
}
