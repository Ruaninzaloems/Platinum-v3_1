import { Component, ChangeDetectionStrategy, Input, OnChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MsAuthService } from '@platinumv3/shared/auth';
import { AfsSharePointService, AfsSpVariant, SpAfsDoc } from '../../core/services/afs-sharepoint.service';

/**
 * Documents panel for one AFS SharePoint library (an Admin → AFS config card).
 * Lists the library's documents whose link column (AFSID by default) equals `linkValue`,
 * and optionally uploads new files tagged with that value — the Adjustments page pattern.
 */
@Component({
  selector: 'app-sp-documents-panel',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sp-panel">
      <div class="sp-head">
        <mat-icon class="sp-cloud">cloud</mat-icon>
        <div class="sp-title">
          <div class="sp-name">{{ title }} ({{ docs().length }})</div>
          <div class="sp-sub">
            {{ library() }} · linked by <strong>{{ linkColumn() }}</strong>
            @if (linkValue) { = <code>{{ linkLabel || linkValue }}</code> }
          </div>
        </div>
        @if (enabled() && linkValue) {
          <button mat-icon-button (click)="refresh()" [disabled]="busy()" matTooltip="Refresh"><mat-icon>refresh</mat-icon></button>
          @if (allowUpload) {
            <button mat-stroked-button (click)="fileInput.click()" [disabled]="busy()"><mat-icon>cloud_upload</mat-icon> Upload</button>
            <input #fileInput type="file" hidden (change)="onFile($event)">
          }
        }
      </div>

      @if (busy()) { <mat-progress-bar mode="indeterminate"></mat-progress-bar> }

      @if (!enabled()) {
        <div class="sp-note">SharePoint storage is off for this library. Turn on <strong>{{ configTitle }}</strong> in Admin → AFS to store and list documents here.</div>
      } @else if (!linkValue) {
        <div class="sp-note">{{ emptyLinkHint }}</div>
      } @else {
        @if (error()) {
          <div class="sp-error">
            <mat-icon>error_outline</mat-icon><span>{{ error() }}</span>
            @if (needsSignIn()) {
              <button mat-stroked-button (click)="signIn()"><mat-icon>login</mat-icon> Sign in with Microsoft</button>
            }
          </div>
        }
        @if (!docs().length && !busy() && !error()) {
          <div class="sp-note">No documents linked yet.</div>
        }
        @for (d of docs(); track d.id) {
          <div class="sp-row">
            <mat-icon class="sp-file">description</mat-icon>
            <div class="sp-meta">
              <div class="sp-file-name">{{ d.fileName }}</div>
              <div class="sp-file-sub">{{ size(d.fileSize) }} · {{ d.createdAt | date:'medium' }}@if (d.description) { · {{ d.description }} }</div>
            </div>
            <button mat-icon-button (click)="download(d)" matTooltip="Download"><mat-icon>download</mat-icon></button>
            @if (d.__item?.webUrl) {
              <a mat-icon-button [href]="d.__item.webUrl" target="_blank" rel="noopener" matTooltip="Open in SharePoint"><mat-icon>open_in_new</mat-icon></a>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .sp-panel { border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; padding: 16px 20px; margin: 16px 0; }
    .sp-head { display: flex; align-items: center; gap: 12px; }
    .sp-cloud { color: #0078d4; }
    .sp-title { flex: 1; min-width: 0; }
    .sp-name { font-weight: 600; font-size: 15px; color: #1e293b; }
    .sp-sub { font-size: 12px; color: #64748b; overflow-wrap: anywhere; }
    .sp-note { font-size: 13px; color: #64748b; padding-top: 12px; }
    .sp-error { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 8px 12px; margin-top: 12px; font-size: 13px; }
    .sp-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-top: 1px solid #f1f5f9; margin-top: 8px; }
    .sp-file { color: #64748b; }
    .sp-meta { flex: 1; min-width: 0; }
    .sp-file-name { font-size: 14px; color: #1e293b; overflow-wrap: anywhere; }
    .sp-file-sub { font-size: 12px; color: #94a3b8; }
  `],
})
export class SpDocumentsPanelComponent implements OnChanges {
  private afsSp = inject(AfsSharePointService);
  private msAuth = inject(MsAuthService);

  /** The Admin → AFS library this panel reads from / stores into. */
  @Input({ required: true }) variant!: AfsSpVariant;
  /** Value written to / matched against the library's link column (AFSID). */
  @Input() linkValue: string | null = '';
  /** Optional readable form of the link value, shown instead of the raw id. */
  @Input() linkLabel = '';
  @Input() title = 'Supporting Documents';
  /** Name of the Admin → AFS card, used in the "turned off" hint. */
  @Input() configTitle = 'its SharePoint configuration';
  /** Written to the library's DocumentType column on upload. */
  @Input() documentType = '';
  @Input() emptyLinkHint = 'Select an item above to see its documents.';
  @Input() allowUpload = true;
  /** Change this value to make the panel reload (e.g. after the page stored a file itself). */
  @Input() reloadToken = 0;

  docs = signal<SpAfsDoc[]>([]);
  busy = signal(false);
  error = signal('');
  needsSignIn = signal(false);
  enabled = signal(false);
  library = signal('');
  linkColumn = signal('AFSID');

  ngOnChanges(): void {
    const cfg = this.afsSp.configFor(this.variant);
    this.enabled.set(cfg.enabled);
    this.library.set(cfg.library);
    this.linkColumn.set(cfg.linkColumn || 'AFSID');
    this.refresh();
  }

  async refresh(): Promise<void> {
    this.docs.set([]);
    this.error.set('');
    this.needsSignIn.set(false);
    if (!this.enabled() || !this.linkValue) return;
    this.busy.set(true);
    try {
      this.docs.set(await this.afsSp.listAfsDocuments(this.linkValue, this.variant));
    } catch (e: any) {
      this.fail(e);
    } finally {
      this.busy.set(false);
    }
  }

  async onFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.linkValue) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.afsSp.uploadAfsDocument(this.linkValue, file, { documentType: this.documentType || undefined }, this.variant);
      this.busy.set(false);
      await this.refresh();
    } catch (e: any) {
      this.busy.set(false);
      this.fail(e);
    }
  }

  async download(d: SpAfsDoc): Promise<void> {
    try {
      await this.afsSp.downloadAfsDocument(d.__item, this.variant);
    } catch (e: any) {
      this.fail(e);
    }
  }

  async signIn(): Promise<void> {
    try {
      await this.msAuth.signIn();
      await this.refresh();
    } catch (e: any) {
      this.fail(e);
    }
  }

  size(bytes: number): string {
    if (!bytes) return '0 B';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  }

  private fail(e: any): void {
    const msg = e?.message || String(e);
    this.error.set(msg);
    this.needsSignIn.set(/signed-in Microsoft account|interaction_required|login_required/i.test(msg));
  }
}
