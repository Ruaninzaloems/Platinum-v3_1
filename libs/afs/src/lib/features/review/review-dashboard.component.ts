import { Component, Input, OnInit, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ReviewRequest, ReviewComment } from '../../core/models/interfaces';

@Component({
  selector: 'app-review-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-dashboard.component.html',
  styleUrl: './review-dashboard.component.css',
})
export class ReviewDashboardComponent implements OnInit, OnChanges {
  @Input() compilationId = '';
  @Input() compilationName = '';

  private api = inject(ApiService);

  requests: ReviewRequest[] = [];
  loading = false;
  showWizard = false;
  selectedRequest: ReviewRequest | null = null;
  selectedComments: ReviewComment[] = [];
  loadingComments = false;

  wizardStep = 1;
  wizardData = {
    requestType: 'comment',
    scope: 'full_compilation',
    scopeDetails: {} as Record<string, any>,
    message: '',
    dueDate: '',
    recipients: [] as Array<{ recipientType: string; email: string; displayName: string; userId: string }>,
  };
  newRecipientType = 'external';
  newRecipientEmail = '';
  newRecipientName = '';
  submitting = false;
  submitError = '';
  sendResult: any = null;
  noteNumbersInput = '';

  availableStatementTypes = [
    { value: 'SFP', label: 'Statement of Financial Position' },
    { value: 'SFPe', label: 'Statement of Financial Performance' },
    { value: 'CFS', label: 'Cash Flow Statement' },
    { value: 'SCNA', label: 'Statement of Changes in Net Assets' },
    { value: 'COMPARISON', label: 'Budget Comparison' },
    { value: 'NOTES', label: 'Disclosure Notes' },
    { value: 'POLICIES', label: 'Accounting Policies' },
  ];

  ngOnInit() {
    if (this.compilationId) this.loadRequests();
  }

  ngOnChanges() {
    if (this.compilationId) this.loadRequests();
  }

  loadRequests() {
    this.loading = true;
    this.api.get<ReviewRequest[]>(`/review-requests/compilation/${this.compilationId}`).subscribe({
      next: (data) => { this.requests = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openWizard() {
    this.showWizard = true;
    this.wizardStep = 1;
    this.wizardData = {
      requestType: 'comment',
      scope: 'full_compilation',
      scopeDetails: {},
      message: '',
      dueDate: '',
      recipients: [],
    };
    this.submitError = '';
    this.sendResult = null;
  }

  closeWizard() { this.showWizard = false; }

  nextStep() { if (this.wizardStep < 4) this.wizardStep++; }
  prevStep() { if (this.wizardStep > 1) this.wizardStep--; }

  onScopeChange() {
    this.wizardData.scopeDetails = {};
    this.noteNumbersInput = '';
  }

  isStatementTypeSelected(value: string): boolean {
    return (this.wizardData.scopeDetails['statementTypes'] || []).includes(value);
  }

  toggleStatementType(value: string) {
    if (!this.wizardData.scopeDetails['statementTypes']) {
      this.wizardData.scopeDetails['statementTypes'] = [];
    }
    const arr = this.wizardData.scopeDetails['statementTypes'] as string[];
    const idx = arr.indexOf(value);
    if (idx >= 0) {
      arr.splice(idx, 1);
    } else {
      arr.push(value);
    }
  }

  updateNoteNumbers() {
    const notes = this.noteNumbersInput.split(',').map(n => n.trim()).filter(n => n);
    this.wizardData.scopeDetails = { noteNumbers: notes };
  }

  addRecipient() {
    if (!this.newRecipientEmail.trim()) return;
    this.wizardData.recipients.push({
      recipientType: 'external',
      email: this.newRecipientEmail.trim(),
      displayName: this.newRecipientName.trim(),
      userId: '',
    });
    this.newRecipientEmail = '';
    this.newRecipientName = '';
  }

  removeRecipient(index: number) {
    this.wizardData.recipients.splice(index, 1);
  }

  createAndSend() {
    if (this.wizardData.recipients.length === 0) {
      this.submitError = 'At least one recipient is required.';
      return;
    }
    this.submitting = true;
    this.submitError = '';

    this.api.post<any>('/review-requests', {
      compilationId: this.compilationId,
      requestType: this.wizardData.requestType,
      scope: this.wizardData.scope,
      scopeDetails: this.wizardData.scopeDetails,
      message: this.wizardData.message || null,
      dueDate: this.wizardData.dueDate || null,
      recipients: this.wizardData.recipients.map(r => ({
        recipientType: r.recipientType,
        email: r.email || undefined,
        displayName: r.displayName || undefined,
        userId: r.userId || undefined,
      })),
    }).subscribe({
      next: (created) => {
        this.api.post<any>(`/review-requests/${created.id}/send`).subscribe({
          next: (result) => {
            this.sendResult = result;
            this.submitting = false;
            this.wizardStep = 5;
            this.loadRequests();
          },
          error: (err) => {
            this.submitError = err.error?.message || 'Failed to send review request.';
            this.submitting = false;
            this.loadRequests();
          },
        });
      },
      error: (err) => {
        this.submitError = err.error?.message || 'Failed to create review request.';
        this.submitting = false;
      },
    });
  }

  viewComments(request: ReviewRequest) {
    this.selectedRequest = request;
    this.loadingComments = true;
    this.api.get<ReviewComment[]>(`/review-requests/${request.id}/comments`).subscribe({
      next: (comments) => { this.selectedComments = comments; this.loadingComments = false; },
      error: () => { this.loadingComments = false; },
    });
  }

  closeComments() { this.selectedRequest = null; this.selectedComments = []; }

  closeRequest(requestId: string) {
    this.api.post(`/review-requests/${requestId}/close`).subscribe({
      next: () => this.loadRequests(),
      error: () => {},
    });
  }

  revokeRequest(requestId: string) {
    this.api.post(`/review-requests/${requestId}/revoke`).subscribe({
      next: () => this.loadRequests(),
      error: () => {},
    });
  }

  revokeRecipient(requestId: string, recipientId: string) {
    this.api.post(`/review-requests/${requestId}/recipients/${recipientId}/revoke`).subscribe({
      next: () => this.loadRequests(),
      error: () => {},
    });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: '#6b7280', sent: '#3b82f6', closed: '#10b981', expired: '#f59e0b', revoked: '#ef4444',
      pending: '#6b7280', viewed: '#3b82f6', responded: '#10b981',
    };
    return colors[status] || '#6b7280';
  }

  getRequestTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      comment: 'Comment', input_requested: 'Input Requested', factual_verification: 'Factual Verification', review_only: 'Review Only',
    };
    return labels[type] || type;
  }

  getScopeLabel(scope: string): string {
    const labels: Record<string, string> = {
      full_compilation: 'Full Compilation', selected_statements: 'Selected Statements', selected_sections: 'Selected Sections',
      selected_policies: 'Selected Policies', selected_disclosures: 'Selected Disclosures',
    };
    return labels[scope] || scope;
  }
}
