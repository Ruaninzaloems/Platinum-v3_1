import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IndigentService } from '../../services/indigent.service';
import { ToastService } from '../../core/services/toast.service';
import { SpinnerComponent } from '../../shared/components/spinner.component';

@Component({
  selector: 'app-indigent-scan',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  template: `
    <div class="scan-container" data-testid="indigent-scan-container">
      @if (loading()) {
        <div class="scan-state">
          <app-spinner />
          <h3>Opening application…</h3>
          <p class="scan-meta">Account {{ account() }} · App #{{ appId() }}</p>
        </div>
      } @else if (error()) {
        <div class="scan-state scan-error">
          <span class="material-icons" style="font-size:48px;color:#dc2626">error_outline</span>
          <h3>Unable to open application</h3>
          <p class="scan-meta">{{ error() }}</p>
          <button class="btn btn-outline" (click)="goDashboard()">Go to Indigent Dashboard</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .scan-container { display:flex; align-items:center; justify-content:center; min-height:60vh; padding:24px; }
    .scan-state { text-align:center; max-width:480px; }
    .scan-state h3 { margin:16px 0 8px; color:#0f2b46; font-weight:600; }
    .scan-meta { color:#64748b; font-size:13px; margin-bottom:16px; }
  `],
})
export class IndigentScanComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);
  account = signal<string>('');
  appId = signal<number | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private indigentService: IndigentService,
    private toast: ToastService,
  ) {}

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    const acct = params.get('account') || params.get('accountNo') || '';
    const appIdRaw = params.get('app') || params.get('applicationId') || '';
    const appIdNum = Number(appIdRaw);
    this.account.set(acct);
    this.appId.set(Number.isFinite(appIdNum) && appIdNum > 0 ? appIdNum : null);

    if (!appIdNum || !Number.isFinite(appIdNum)) {
      this.error.set('Invalid QR code — missing application ID.');
      this.loading.set(false);
      return;
    }

    try {
      const detail = await firstValueFrom(this.indigentService.getApplicationDetail(appIdNum));
      const status = (detail?.application?.appStatusName || '').toLowerCase();
      let target = '/indigent/application';
      let source = 'scan';
      if (status.includes('site')) { target = '/indigent/verification'; source = 'verification'; }
      else if (status.includes('document')) { target = '/indigent/doc-verification'; source = 'verification'; }
      else if (status.includes('authoris') || status.includes('authoriz')) { target = '/indigent/authorization'; source = 'authorization'; }
      this.router.navigate([target], { queryParams: { applicationId: appIdNum, source } });
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Application not found.');
      this.loading.set(false);
    }
  }

  goDashboard(): void { this.router.navigate(['/indigent/dashboard']); }
}
