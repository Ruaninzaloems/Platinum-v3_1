import { Component, Input, signal, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { IndigentService } from '../../../services/indigent.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatDate } from '../../../services/format.service';
import type { IDVerificationResult, VerificationProvider } from '../../../models/indigent.models';

@Component({
  selector: 'app-id-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="idv-container">
      <div class="idv-header">
        <h4 class="idv-title">ID Verification</h4>
        <button class="btn btn-primary btn-sm" (click)="openVerify()" [disabled]="verifying()" data-testid="button-run-idv">
          @if (verifying()) { <span class="spinner"></span> }
          Verify ID
        </button>
      </div>

      @if (loading()) {
        <div class="idv-loading"><span class="spinner"></span></div>
      } @else if (history().length === 0) {
        <div class="idv-empty">No ID verification checks performed.</div>
      } @else {
        <div class="idv-list">
          @for (h of history(); track h.verificationLogId) {
            <div class="idv-item" [attr.data-testid]="'idv-item-' + h.verificationLogId">
              <div class="idv-status" [class.passed]="h.status === 'Verified' || h.status === 'Passed'" [class.failed]="h.status !== 'Verified' && h.status !== 'Passed'">
                {{ h.status === 'Verified' || h.status === 'Passed' ? '✓' : '✗' }}
              </div>
              <div class="idv-info">
                <span class="idv-id">{{ h.idNumber }}</span>
                <span class="idv-meta">
                  {{ h.providerName || 'Provider' }} · {{ fmtDate(h.verificationDate) }}
                  @if (h.matchScore) { · Score: {{ h.matchScore }}% }
                </span>
                @if (h.responseData) {
                  <span class="idv-msg">{{ h.responseData }}</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (verifyOpen) {
      <div class="modal-overlay" (click)="closeVerify()">
        <div class="modal-content" style="max-width:28rem" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Run ID Verification</h3>
            <button class="btn btn-ghost btn-icon" (click)="closeVerify()">✕</button>
          </div>
          <div class="modal-body">
            <div class="field-group">
              <span class="field-label">ID Number *</span>
              <input class="field-input" [(ngModel)]="verifyForm.idNumber" placeholder="SA ID number" data-testid="input-idv-idnum" />
            </div>
            <div class="field-group mt-1">
              <span class="field-label">Verification Provider</span>
              <select class="field-select" [(ngModel)]="verifyForm.providerId" data-testid="select-idv-provider">
                <option [value]="0">Default Provider</option>
                @for (p of providers(); track p.providerId) {
                  <option [value]="p.providerId">{{ p.providerName }}</option>
                }
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeVerify()">Cancel</button>
            <button class="btn btn-primary" (click)="submitVerify()" [disabled]="verifying()" data-testid="button-submit-idv">
              @if (verifying()) { <span class="spinner"></span> }
              Verify
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .idv-container { border: 1px solid var(--platinum-border); border-radius: 12px; background: white; overflow: hidden; }
    .idv-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--platinum-border); background: #f8fafc; }
    .idv-title { font-size: 13px; font-weight: 600; color: var(--platinum-text); margin: 0; }
    .idv-loading { padding: 2rem; text-align: center; }
    .idv-empty { padding: 2rem; text-align: center; font-size: 12px; color: var(--platinum-text-muted); }
    .idv-list { }
    .idv-item { display: flex; align-items: flex-start; gap: 0.75rem; padding: 10px 16px; border-bottom: 1px solid #f1f5f9; }
    .idv-item:last-child { border-bottom: none; }
    .idv-status { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }
    .idv-status.passed { background: #dcfce7; color: #166534; }
    .idv-status.failed { background: #fef2f2; color: #991b1b; }
    .idv-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .idv-id { font-size: 13px; font-weight: 500; color: var(--platinum-text); font-family: 'JetBrains Mono', monospace; }
    .idv-meta { font-size: 11px; color: var(--platinum-text-muted); }
    .idv-msg { font-size: 11px; color: #64748b; font-style: italic; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); width: 90%; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column; }
    .modal-header { padding: 20px 24px 12px; border-bottom: 1px solid var(--platinum-border); display: flex; align-items: center; justify-content: space-between; }
    .modal-title { font-size: 18px; font-weight: 600; color: var(--platinum-text); margin: 0; }
    .modal-body { padding: 16px 24px; overflow-y: auto; flex: 1; }
    .modal-footer { padding: 12px 24px 20px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 0.5rem; }
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 11px; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-select, .field-input { height: 40px; padding: 0 14px; border: 1px solid var(--pos-input-border); border-radius: 8px; background: var(--pos-input-bg); font-size: 13px; color: var(--platinum-text); width: 100%; font-family: inherit; }
    .mt-1 { margin-top: 0.75rem; }
  `]
})
export class IDVerificationComponent implements OnInit, OnChanges {
  @Input() applicationId!: number;
  @Input() idNumber = '';

  history = signal<IDVerificationResult[]>([]);
  providers = signal<VerificationProvider[]>([]);
  loading = signal(true);
  verifying = signal(false);

  verifyOpen = false;
  verifyForm = { idNumber: '', providerId: 0 };

  constructor(private svc: IndigentService, private toast: ToastService) {}

  ngOnInit(): void { this.loadData(); }
  ngOnChanges(): void { if (this.applicationId) this.loadData(); }

  async loadData(): Promise<void> {
    if (!this.applicationId) return;
    this.loading.set(true);
    try {
      const [histRes, provRes] = await Promise.allSettled([
        firstValueFrom(this.svc.getIdVerificationHistory(this.applicationId)),
        firstValueFrom(this.svc.getVerificationProviders()),
      ]);
      if (histRes.status === 'fulfilled') this.history.set(Array.isArray(histRes.value) ? histRes.value : []);
      if (provRes.status === 'fulfilled') this.providers.set(Array.isArray(provRes.value) ? provRes.value : []);
    } catch { /* silent */ } finally { this.loading.set(false); }
  }

  fmtDate(val: string | null | undefined): string { return formatDate(val); }

  openVerify(): void {
    this.verifyForm = { idNumber: this.idNumber, providerId: 0 };
    this.verifyOpen = true;
  }

  closeVerify(): void { this.verifyOpen = false; }

  async submitVerify(): Promise<void> {
    if (!this.verifyForm.idNumber) { this.toast.show('ID number is required', 'error'); return; }
    this.verifying.set(true);
    try {
      const res = await firstValueFrom(this.svc.runIdVerification({
        appId: this.applicationId,
        idNumber: this.verifyForm.idNumber,
        providerId: this.verifyForm.providerId || 0,
      }));
      if (res?.status === 'Verified' || res?.status === 'Passed') {
        this.toast.show('ID verification passed', 'success');
      } else {
        this.toast.show(res?.status || 'ID verification failed', 'error');
      }
      this.closeVerify();
      await this.loadData();
    } catch (e: any) {
      this.toast.show(e?.error?.message || 'Verification failed', 'error');
    } finally { this.verifying.set(false); }
  }
}
