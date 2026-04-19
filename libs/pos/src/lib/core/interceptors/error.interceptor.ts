import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';

const SILENT_URL_PATTERNS = [
  '/api/platinum/billing-enquiry/',
  '/api/platinum/billing/account-management/',
  '/api/platinum/billing-account-management/',
  '/api/platinum/supervisor/',
  '/api/platinum/receipt-prepaid/validate-cashier-day-end-recon',
  '/api/platinum/billing-payment/search-accounts',
  '/api/platinum/billing-payment/search-account-groups',
  '/api/platinum/billing-payment-miscellaneous/',
  '/api/platinum/billing-payment/save-multiple-account-payment',
  '/api/platinum/direct-deposit-allocation/get-account-autocomplete',
  '/api/platinum/direct-deposit-allocation/get-old-account-autocomplete',
  '/api/platinum/direct-deposit-allocation/get-clearance-autocomplete',
  '/api/platinum/direct-deposit-allocation/get-pos-item-details',
  '/api/platinum/direct-deposit-allocation/create-virtual-session',
  '/api/dd-allocation/active-job',
  '/api/dd-allocation/job/',
  // billing-attp READ endpoints only — UAT 500s; components handle empty results gracefully.
  // WRITE endpoints (save-*, upload-*, terminate-*, authorize-*, assign-*) are NEVER silent —
  // a failed save MUST surface to the user as a toast. Do not add writes to this list.
  '/api/platinum/billing-attp/indigent-register',
  '/api/platinum/billing-attp/indigent-types',
  '/api/platinum/billing-attp/indigent-type-sub-rules',
  '/api/platinum/billing-attp/employers',
  '/api/platinum/billing-attp/income-sources',
  '/api/platinum/billing-attp/decline-reasons',
  '/api/platinum/billing-attp/termination-reasons',
  '/api/platinum/billing-attp/home-visit-outcomes',
  '/api/platinum/billing-attp/verification-outcomes',
  '/api/platinum/billing-attp/qualification-check',
  '/api/platinum/billing-attp/application-stats',
  '/api/platinum/billing-attp/authorization-queue',
  '/api/platinum/billing-attp/verification-queue',
  '/api/platinum/billing-attp/termination-queue',
  '/api/platinum/billing-attp/reapplication-due',
  '/api/platinum/billing-attp/contractors',
  '/api/platinum/billing-attp/automated-letters',
  '/api/platinum/billing-attp/document-types',
  '/api/platinum/billing-attp/verification-providers',
  '/api/platinum/billing-attp/get-expiring-applications',
  '/api/platinum/billing-attp/auto-termination-log',
  '/api/platinum/billing-attp/dashboard-summary',
  '/api/platinum/billing-attp/smart-qualification',
  '/api/platinum/billing-attp/application-detail',
  '/api/platinum/billing-attp/doc-verification-queue',
  '/api/platinum/billing-attp/steercom-referrals',
  '/api/platinum/billing-attp/occupier-types',
  '/api/platinum/billing-attp/field-workers',
  // billing-dashboard — all routes fail in UAT; components handle empty results gracefully
  '/api/platinum/billing-dashboard/',
  '/api/platinum/billing-debt/section129-run-files',
  '/api/platinum/billing-debt/section129-account-names',
  '/api/platinum/billing-debt/section129-run-summary',
  // Day-end receipt lists — component handles empty results gracefully
  '/api/platinum/billing-payment-day-end/get-cashier-receipt-card-list',
  '/api/platinum/billing-payment-day-end/get-cashier-receipt-cheque-list',
  '/api/platinum/billing-payment-day-end/get-cashier-receipt-drop-box-list',
  '/api/platinum/billing-payment-day-end/get-cashier-receipt-reconcile-list',
  '/api/platinum/billing-payment-day-end/get-cashier-details',
  '/api/platinum/billing-payment-day-end/cashier-receipt-unreconciled-list',
  '/api/platinum/auth/active-cashier-by-userid',
  '/api/platinum/auth-day-end/',
  '/api/platinum/cons-accounts/',
  '/api/platinum/cons-names/',
  '/api/platinum/accounts-by-name-id',
  '/api/platinum/account-full-details/',
];

function shortPath(p: string): string {
  // Trim long Platinum paths to a readable token: "/api/BillingATTP/save-occupier" -> "save-occupier"
  if (!p) return '';
  const segs = p.split('/').filter(Boolean);
  return segs[segs.length - 1] || p;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isSilent = SILENT_URL_PATTERNS.some(p => req.url.includes(p));

      if (error.status === 401 && !req.url.includes('/api/auth/')) {
        router.navigate(['/login']);
      } else if (error.status === 0) {
        toast.error('Network error — unable to reach the server');
      } else if (!isSilent && (error.status >= 400 && error.status !== 404)) {
        const err = error.error || {};
        const endpoint: string | null = err.endpoint || err.path || null;
        const fieldErrors: Record<string, string[]> | undefined = err.fieldErrors;
        const traceId: string | undefined = err.traceId;
        const baseMsg = err.message || err.title || err.detail || `HTTP ${error.status} ${error.statusText || ''}`.trim();

        // Compose a multi-line toast: status + message + per-field errors + traceId
        const lines: string[] = [];
        lines.push(`Save failed (${error.status})${endpoint ? ' on ' + shortPath(endpoint) : ''}`);
        lines.push(baseMsg);
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          for (const [field, msgs] of Object.entries(fieldErrors)) {
            lines.push(`• ${field}: ${(msgs as string[]).join('; ')}`);
          }
        }
        if (traceId) lines.push(`trace: ${traceId}`);

        // Always log full envelope to the browser console for diagnosis
        console.error(`[API ERROR] ${req.method} ${req.url} → ${error.status}`, err);

        toast.error(lines.join('\n'));
      }
      return throwError(() => error);
    })
  );
};
