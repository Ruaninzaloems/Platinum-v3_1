import { Component, Input, Output, EventEmitter, signal, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { jsPDF } from 'jspdf';
import { IndigentService } from '../../../services/indigent.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatDate } from '../../../services/format.service';
import type { ATTPSignature, SaveSignatureRequest, UploadDocumentRequest } from '../../../models/indigent.models';

type SigMethod = 'draw' | 'type';

@Component({
  selector: 'app-signature-capture',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sig-container">
      <div class="sig-header">
        <h4 class="sig-title">Signatures</h4>
        <button class="btn btn-primary btn-sm" (click)="openCapture()" data-testid="button-add-sig">Add Signature</button>
      </div>

      @if (loading()) {
        <div class="sig-loading"><span class="spinner"></span></div>
      } @else if (signatures().length === 0) {
        <div class="sig-empty">No signatures recorded.</div>
      } @else {
        <div class="sig-list">
          @for (sig of signatures(); track sig.signatureId) {
            <div class="sig-item" [attr.data-testid]="'sig-item-' + sig.signatureId">
              <div class="sig-preview">
                @if (sig.signatureData) {
                  <img [src]="'data:image/png;base64,' + sig.signatureData" alt="Signature" class="sig-img" />
                } @else {
                  <div class="sig-placeholder">✍</div>
                }
              </div>
              <div class="sig-info">
                <span class="sig-name">{{ sig.signerName }}</span>
                <span class="sig-meta">{{ sig.signerRole || 'Signatory' }} · {{ fmtDate(sig.signedDate) }}</span>
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (captureOpen) {
      <div class="modal-overlay" (click)="closeCapture()">
        <div class="modal-content" style="max-width:36rem" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Capture Signature</h3>
            <button class="btn btn-ghost btn-icon" (click)="closeCapture()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="field-group">
                <span class="field-label">Signatory Name *</span>
                <input class="field-input" [(ngModel)]="captureForm.signatoryName" data-testid="input-sig-name" />
              </div>
              <div class="field-group">
                <span class="field-label">Role</span>
                <select class="field-select" [(ngModel)]="captureForm.signatoryRole">
                  <option value="">Select role</option>
                  <option value="Applicant">Applicant</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Witness">Witness</option>
                  <option value="Official">Official</option>
                </select>
              </div>
            </div>

            @if (allowedMethods().length > 1) {
              <div class="sig-tabs" role="tablist">
                @for (m of allowedMethods(); track m) {
                  <button role="tab" type="button"
                    class="sig-tab"
                    [class.active]="method() === m"
                    (click)="setMethod(m)"
                    [attr.data-testid]="'tab-sig-' + m">
                    <span class="material-icons" style="font-size:16px">{{ m === 'draw' ? 'gesture' : 'keyboard' }}</span>
                    {{ m === 'draw' ? 'Draw' : 'Type' }}
                  </button>
                }
              </div>
            }

            @if (method() === 'draw') {
              <div class="canvas-container mt-1">
                <span class="field-label">Sign Below</span>
                <canvas #sigCanvas class="sig-canvas" data-testid="canvas-signature"
                  (mousedown)="startDraw($event)" (mousemove)="draw($event)" (mouseup)="stopDraw()" (mouseleave)="stopDraw()"
                  (touchstart)="startDrawTouch($event)" (touchmove)="drawTouch($event)" (touchend)="stopDraw()">
                </canvas>
                <button class="btn btn-ghost btn-sm" (click)="clearCanvas()" data-testid="button-clear-sig">Clear</button>
              </div>
            } @else {
              <div class="canvas-container mt-1">
                <span class="field-label">Type Your Signature</span>
                <input class="field-input typed-input" [(ngModel)]="typedSignature" (input)="renderTypedPreview()"
                  placeholder="Type your full name" data-testid="input-typed-signature" />
                <div class="typed-preview" [attr.data-testid]="'preview-typed-signature'">
                  <span class="typed-cursive">{{ typedSignature || 'Preview' }}</span>
                </div>
              </div>
            }

            @if (requireConsent) {
              <div class="consent-block mt-1" data-testid="block-consent">
                <label class="consent-row">
                  <input type="checkbox" [(ngModel)]="consentAccepted" data-testid="checkbox-consent" />
                  <span class="consent-text">{{ consentText }}</span>
                </label>
              </div>
            }

            <div class="meta-row">
              <span class="meta-pill" data-testid="meta-ip">IP: {{ clientIp() || '—' }}</span>
              <span class="meta-pill">{{ now() }}</span>
              <span class="meta-pill">App #{{ applicationId }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeCapture()">Cancel</button>
            <button class="btn btn-primary" (click)="submitSignature()" [disabled]="saving() || !canSubmit()" data-testid="button-save-sig">
              @if (saving()) { <span class="spinner"></span> }
              Save
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .sig-container { border: 1px solid var(--platinum-border); border-radius: 12px; background: white; overflow: hidden; }
    .sig-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--platinum-border); background: #f8fafc; }
    .sig-title { font-size: 13px; font-weight: 600; color: var(--platinum-text); margin: 0; }
    .sig-loading { padding: 2rem; text-align: center; }
    .sig-empty { padding: 2rem; text-align: center; font-size: 12px; color: var(--platinum-text-muted); }
    .sig-item { display: flex; align-items: center; gap: 0.75rem; padding: 10px 16px; border-bottom: 1px solid #f1f5f9; }
    .sig-item:last-child { border-bottom: none; }
    .sig-preview { width: 80px; height: 40px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; border-radius: 6px; background: #fafafa; overflow: hidden; }
    .sig-img { max-width: 100%; max-height: 100%; }
    .sig-placeholder { font-size: 20px; }
    .sig-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .sig-name { font-size: 13px; font-weight: 500; color: var(--platinum-text); }
    .sig-meta { font-size: 11px; color: var(--platinum-text-muted); }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
    .modal-content { background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); width: 90%; max-width: 36rem; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
    .modal-header { padding: 16px 20px 12px; border-bottom: 1px solid var(--platinum-border); display: flex; align-items: center; justify-content: space-between; }
    .modal-title { font-size: 18px; font-weight: 600; color: var(--platinum-text); margin: 0; }
    .modal-body { padding: 16px 20px; overflow-y: auto; flex: 1; }
    .modal-footer { padding: 12px 20px 16px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 0.5rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 11px; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-select, .field-input { height: 44px; padding: 0 14px; border: 1px solid var(--pos-input-border); border-radius: 8px; background: var(--pos-input-bg); font-size: 14px; color: var(--platinum-text); width: 100%; font-family: inherit; }
    .canvas-container { display: flex; flex-direction: column; gap: 6px; }
    .sig-canvas { border: 2px dashed #cbd5e1; border-radius: 8px; cursor: crosshair; touch-action: none; width: 100%; height: auto; background: white; }
    .mt-1 { margin-top: 0.75rem; }

    .sig-tabs { display: flex; gap: 4px; margin-top: 14px; padding: 4px; background: #f1f5f9; border-radius: 8px; }
    .sig-tab { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; border: none; background: transparent; color: #64748b; font-weight: 500; font-size: 13px; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
    .sig-tab.active { background: white; color: var(--platinum-primary, #0f2b46); box-shadow: 0 1px 3px rgba(15,43,70,0.1); }
    .typed-input { font-size: 16px; }
    .typed-preview { min-height: 80px; padding: 16px; border: 2px dashed #cbd5e1; border-radius: 8px; background: white; display: flex; align-items: center; justify-content: center; }
    .typed-cursive { font-family: 'Brush Script MT', 'Lucida Handwriting', cursive; font-size: 38px; color: #0f2b46; line-height: 1; }

    .consent-block { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px; }
    .consent-row { display: flex; gap: 10px; align-items: flex-start; cursor: pointer; }
    .consent-row input { margin-top: 3px; flex-shrink: 0; }
    .consent-text { font-size: 12px; color: #78350f; line-height: 1.5; }

    .meta-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
    .meta-pill { font-size: 10px; padding: 3px 8px; background: #f1f5f9; color: #64748b; border-radius: 4px; font-family: 'Courier New', monospace; }

    @media (max-width: 480px) {
      .form-row { grid-template-columns: 1fr; }
      .modal-content { width: 100%; border-radius: 12px; }
    }
  `]
})
export class SignatureCaptureComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() applicationId!: number;
  @Input() accountNo: string = '';
  @Input() accountHolder: string = '';
  @Input() allowedSignatureMethods: ('draw' | 'type')[] = ['draw', 'type'];
  @Input() requireConsent: boolean = true;
  @Input() consentText: string = 'I confirm that the information provided in this application is true and correct to the best of my knowledge. I understand that providing false information is a criminal offence.';
  @Input() attachSignedDeclarationPdf: boolean = true;
  @Input() qrCodeDataUrl: string = '';
  @Output() signatureSaved = new EventEmitter<void>();
  @ViewChild('sigCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  signatures = signal<ATTPSignature[]>([]);
  loading = signal(true);
  saving = signal(false);
  method = signal<SigMethod>('draw');
  clientIp = signal<string>('');
  private clientUserAgent = '';
  now = signal<string>('');

  captureOpen = false;
  captureForm = { signatoryName: '', signatoryRole: '' };
  typedSignature = '';
  consentAccepted = false;
  private ctx: CanvasRenderingContext2D | null = null;
  private drawing = false;
  private hasInk = false;

  constructor(private svc: IndigentService, private auth: AuthService, private toast: ToastService) {}

  allowedMethods(): ('draw' | 'type')[] {
    const m = (this.allowedSignatureMethods || []).filter(x => x === 'draw' || x === 'type');
    return m.length ? m : ['draw'];
  }

  canSubmit(): boolean {
    if (!this.captureForm.signatoryName?.trim()) return false;
    if (this.requireConsent && !this.consentAccepted) return false;
    if (this.method() === 'type' && !this.typedSignature?.trim()) return false;
    if (this.method() === 'draw' && !this.hasInk) return false;
    return true;
  }

  ngOnInit(): void {
    this.loadSigs();
    this.loadClientIp();
  }
  ngOnChanges(): void { if (this.applicationId) this.loadSigs(); }
  ngAfterViewInit(): void { this.initCanvas(); }
  ngOnDestroy(): void { this.ctx = null; }

  async loadClientIp(): Promise<void> {
    try {
      const r = await firstValueFrom(this.svc.getClientIp());
      this.clientIp.set(r?.ip || '');
      this.clientUserAgent = r?.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    } catch {
      this.clientUserAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    }
  }

  async loadSigs(): Promise<void> {
    if (!this.applicationId) return;
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.svc.getSignatures(this.applicationId));
      this.signatures.set(Array.isArray(res) ? res : []);
    } catch { /* silent */ } finally { this.loading.set(false); }
  }

  fmtDate(val: string | null | undefined): string { return formatDate(val); }

  setMethod(m: SigMethod): void {
    this.method.set(m);
    this.hasInk = false;
    if (m === 'draw') setTimeout(() => this.initCanvas(), 50);
  }

  openCapture(): void {
    this.captureForm = { signatoryName: '', signatoryRole: '' };
    this.typedSignature = '';
    this.consentAccepted = false;
    this.hasInk = false;
    this.now.set(new Date().toLocaleString('en-ZA'));
    const allowed = this.allowedMethods();
    this.method.set(allowed[0]);
    this.captureOpen = true;
    setTimeout(() => this.initCanvas(), 50);
  }

  closeCapture(): void { this.captureOpen = false; }

  renderTypedPreview(): void { /* preview is reactive via [(ngModel)] */ }

  private initCanvas(): void {
    if (!this.canvasRef || this.method() !== 'draw') return;
    const canvas = this.canvasRef.nativeElement;
    const containerWidth = canvas.parentElement?.clientWidth || 440;
    const w = Math.min(containerWidth - 4, 480);
    const h = Math.round(w * 0.36);
    canvas.width = w;
    canvas.height = h;
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(0, 0, w, h);
      this.ctx.strokeStyle = '#0f2b46';
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
    }
  }

  clearCanvas(): void {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    if (this.ctx) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    this.hasInk = false;
  }

  startDraw(e: MouseEvent): void {
    if (!this.ctx) return;
    this.drawing = true;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    this.ctx.beginPath();
    this.ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }
  draw(e: MouseEvent): void {
    if (!this.drawing || !this.ctx) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    this.ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    this.ctx.stroke();
    this.hasInk = true;
  }
  stopDraw(): void { this.drawing = false; }
  startDrawTouch(e: TouchEvent): void {
    e.preventDefault();
    if (!this.ctx || !e.touches.length) return;
    this.drawing = true;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const t = e.touches[0];
    this.ctx.beginPath();
    this.ctx.moveTo(t.clientX - rect.left, t.clientY - rect.top);
  }
  drawTouch(e: TouchEvent): void {
    e.preventDefault();
    if (!this.drawing || !this.ctx || !e.touches.length) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const t = e.touches[0];
    this.ctx.lineTo(t.clientX - rect.left, t.clientY - rect.top);
    this.ctx.stroke();
    this.hasInk = true;
  }

  /** Renders the typed signature into a canvas the same size as the draw canvas. */
  private buildTypedCanvas(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = 480; c.height = 173;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#0f2b46';
    ctx.font = 'italic 64px "Brush Script MT", "Lucida Handwriting", cursive';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(this.typedSignature, c.width / 2, c.height / 2 - 8);
    return c;
  }

  /** Stamps a metadata footer into the bottom of the signature canvas. Returns base64 PNG (no prefix). */
  private stampMetadata(srcCanvas: HTMLCanvasElement, meta: { name: string; role: string; ts: string; ip: string; method: SigMethod; appId: number }): string {
    const stampHeight = 36;
    const out = document.createElement('canvas');
    out.width = srcCanvas.width;
    out.height = srcCanvas.height + stampHeight;
    const ctx = out.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(srcCanvas, 0, 0);
    // Footer
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, srcCanvas.height, out.width, stampHeight);
    ctx.fillStyle = '#475569';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const line1 = `${meta.name} (${meta.role || 'Signatory'}) · ${meta.method.toUpperCase()} · App #${meta.appId}`;
    const line2 = `${meta.ts} · IP ${meta.ip || 'unknown'}`;
    ctx.fillText(line1, 8, srcCanvas.height + 11);
    ctx.fillText(line2, 8, srcCanvas.height + 25);
    return out.toDataURL('image/png').split(',')[1];
  }

  private async buildSignedDeclarationPdf(stampedDataUrl: string, meta: { name: string; role: string; ts: string; ip: string; method: SigMethod }): Promise<string> {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = pdf.internal.pageSize.getWidth();
    let y = 48;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(15, 43, 70);
    pdf.text('George Municipality', 48, y);
    y += 18;
    pdf.setFontSize(13);
    pdf.text('Indigent Application — Signed Declaration', 48, y);
    y += 8;
    pdf.setDrawColor(201, 168, 76);
    pdf.setLineWidth(2);
    pdf.line(48, y, W - 48, y);
    y += 22;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(30, 41, 59);
    const metaLines = [
      `Application ID: #${this.applicationId}`,
      `Account: ${this.accountNo || '—'}   Holder: ${this.accountHolder || '—'}`,
      `Signatory: ${meta.name}   Role: ${meta.role || 'Applicant'}`,
      `Method: ${meta.method.toUpperCase()}   Signed: ${meta.ts}`,
      `Captured IP: ${meta.ip || 'unknown'}`,
    ];
    metaLines.forEach(ln => { pdf.text(ln, 48, y); y += 14; });
    y += 6;
    pdf.setDrawColor(226, 232, 240); pdf.setLineWidth(0.5); pdf.line(48, y, W - 48, y); y += 16;
    pdf.setFont('helvetica', 'bold'); pdf.text('Declaration', 48, y); y += 14;
    pdf.setFont('helvetica', 'normal');
    const consent = pdf.splitTextToSize(this.consentText || 'I confirm that the information provided in this application is true and correct to the best of my knowledge.', W - 96);
    pdf.text(consent, 48, y);
    y += consent.length * 14 + 16;
    pdf.setFont('helvetica', 'bold'); pdf.text('Signature', 48, y); y += 8;
    try { pdf.addImage(stampedDataUrl, 'PNG', 48, y, 320, 120); } catch { /* ignore */ }
    if (this.qrCodeDataUrl) {
      try { pdf.addImage(this.qrCodeDataUrl, 'PNG', W - 48 - 110, y, 110, 110); } catch { /* ignore */ }
      pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
      pdf.text('Scan to open application', W - 48 - 110, y + 122);
    }
    y += 140;
    pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
    pdf.text(`Generated ${new Date().toLocaleString('en-ZA')} · George Municipality POS System`, 48, pdf.internal.pageSize.getHeight() - 24);
    const dataUri = pdf.output('datauristring');
    return dataUri.split(',')[1];
  }

  async submitSignature(): Promise<void> {
    if (!this.canSubmit()) return;
    this.saving.set(true);
    try {
      const method = this.method();
      const sourceCanvas = method === 'draw' ? this.canvasRef?.nativeElement : this.buildTypedCanvas();
      if (!sourceCanvas) { this.toast.show('Could not build signature image', 'error'); return; }
      const signedTs = new Date().toLocaleString('en-ZA');
      const stamped = this.stampMetadata(sourceCanvas, {
        name: this.captureForm.signatoryName,
        role: this.captureForm.signatoryRole,
        ts: signedTs,
        ip: this.clientIp(),
        method,
        appId: this.applicationId,
      });
      const now = new Date().toISOString();
      const userId = this.auth.user()?.user_ID || 0;
      const request: SaveSignatureRequest = {
        signatureId: null,
        appId: this.applicationId,
        signerName: this.captureForm.signatoryName,
        signerRole: this.captureForm.signatoryRole,
        signatureData: stamped,
        signedDate: now,
        capturerID: userId,
        dateCaptured: now,
        signatureMethod: method,
        consentAccepted: this.requireConsent ? this.consentAccepted : true,
        consentText: this.requireConsent ? this.consentText : '',
        signerIp: this.clientIp(),
        signerUserAgent: this.clientUserAgent,
      };
      await firstValueFrom(this.svc.saveSignature(request));

      // Attach signed declaration PDF (best-effort)
      if (this.attachSignedDeclarationPdf) {
        try {
          const pdfBase64 = await this.buildSignedDeclarationPdf(`data:image/png;base64,${stamped}`, {
            name: this.captureForm.signatoryName,
            role: this.captureForm.signatoryRole,
            ts: signedTs,
            ip: this.clientIp(),
            method,
          });
          const fileName = `Signed-Declaration-App${this.applicationId}-${Date.now()}.pdf`;
          let docTypeId = 0;
          try {
            const types = await firstValueFrom(this.svc.getDocumentTypes());
            if (Array.isArray(types) && types.length) {
              const match = types.find((t: any) => /signed|declaration|signature/i.test(`${t.documentTypeName || ''} ${t.documentTypeDesc || t.documentTypeCode || ''}`));
              docTypeId = match?.documentTypeId ?? types[0].documentTypeId ?? 0;
            }
          } catch { /* fall back to 0 — Platinum will reject and we surface a warning */ }
          const upload: UploadDocumentRequest = {
            applicationId: this.applicationId,
            documentTypeId: docTypeId,
            documentName: 'Signed Declaration',
            fileName,
            fileData: pdfBase64,
            capturerId: userId,
            dateCaptured: now,
          };
          await firstValueFrom(this.svc.uploadDocument(upload));
          this.toast.show('Signature & declaration PDF saved', 'success');
        } catch (e: unknown) {
          const err = e as { error?: { message?: string } };
          this.toast.show(`Signature saved. Declaration PDF could not be attached: ${err?.error?.message || 'upload failed'}`, 'warning');
        }
      } else {
        this.toast.show('Signature saved', 'success');
      }

      this.signatureSaved.emit();
      this.closeCapture();
      await this.loadSigs();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to save signature', 'error');
    } finally { this.saving.set(false); }
  }
}
