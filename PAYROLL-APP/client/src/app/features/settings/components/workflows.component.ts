import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-workflows',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './workflows.component.html',
  styleUrl: './workflows.component.css'
})
export class WorkflowsComponent implements OnInit {
  workflows: any[] = [];
  filteredWorkflows: any[] = [];
  searchTerm = '';
  loading = true;
  showModal = false;
  editItem: any = {};
  stepsJson: string = '[]';

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.get<any[]>('/workflows/definitions').subscribe({
      next: (data) => { this.workflows = data || []; this.applyFilter(); this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilter(): void {
    const s = this.searchTerm.toLowerCase();
    this.filteredWorkflows = s
      ? this.workflows.filter(w =>
          (w.name || '').toLowerCase().includes(s) ||
          (w.module || '').toLowerCase().includes(s))
      : [...this.workflows];
    this.cdr.detectChanges();
  }

  get activeCount(): number {
    return this.workflows.filter(w => w.is_active !== false).length;
  }

  get inactiveCount(): number {
    return this.workflows.filter(w => w.is_active === false).length;
  }

  getSteps(wf: any): any[] {
    try {
      const steps = typeof wf.steps === 'string' ? JSON.parse(wf.steps) : wf.steps;
      return Array.isArray(steps) ? steps : [];
    } catch {
      return [];
    }
  }

  getStepLabel(step: any): string {
    return step.role || step.approver || step.name || 'Step';
  }

  isStepsCustom(wf: any): boolean {
    try {
      const steps = typeof wf.steps === 'string' ? JSON.parse(wf.steps) : wf.steps;
      return !Array.isArray(steps);
    } catch {
      return true;
    }
  }

  openEditModal(wf: any): void {
    this.editItem = { ...wf };
    try {
      const steps = typeof wf.steps === 'string' ? JSON.parse(wf.steps) : wf.steps;
      this.stepsJson = JSON.stringify(steps, null, 2);
    } catch {
      this.stepsJson = typeof wf.steps === 'string' ? wf.steps : JSON.stringify(wf.steps || []);
    }
    this.showModal = true;
  }

  save(): void {
    let parsedSteps: any;
    try {
      parsedSteps = JSON.parse(this.stepsJson);
    } catch {
      this.ui.toast('error', 'Invalid JSON', 'Steps must be valid JSON');
      return;
    }
    this.api.put(`/workflows/definitions/${this.editItem.id}`, { steps: parsedSteps }).subscribe({
      next: () => { this.ui.toast('success', 'Updated', 'Workflow updated successfully'); this.showModal = false; this.load(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to update')
    });
  }
}
