import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environment';
import { ApiResponse } from '../models/api-response.model';
import { MeDto } from '../models/overtime-workflow.model';

const STORAGE_KEY = 'platinum.overtime.currentUserId';

/** Retry delays in ms for the startup race: 1 s, 2 s, 4 s, 8 s, 16 s. */
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000];

/**
 * Holds the active dev "user" identity used to populate `X-User-Id`. The dev
 * directory is materialised on the API side from the imported User_UserDetail
 * table (joined to Payroll_Employee + PositionApprovalConfig), so the switcher
 * widget shows real Platinum users with the role flags they hold today.
 *
 * The persisted user id may be either a User_id or an Employee_ID — both are
 * accepted by the API shim, so a stale value left over from the legacy
 * hardcoded directory still resolves cleanly to the new default user.
 */
@Injectable({ providedIn: 'root' })
export class UserContextService {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private base   = environment.apiBaseUrl;

  readonly currentUserId = signal<string>(this.readStored());
  readonly me = signal<MeDto | null>(null);
  readonly availableUsers = signal<MeDto[]>([]);

  readonly displayName = computed(() => this.me()?.displayName ?? 'Loading...');
  readonly roleLabel = computed(() => positionLabel(this.me()));

  constructor() { this.refreshWithRetry(); }

  /**
   * Switch the active dev persona. Awaits the /api/me refresh so `me()` has
   * the new user's permissions before we re-navigate to the current route.
   * Re-navigating causes Angular's route guards to re-run, so a page that was
   * "Access Denied" for the old user will open normally (or vice-versa) after
   * the switch without requiring a manual reload.
   */
  async setUser(userId: string): Promise<void> {
    this.currentUserId.set(userId);
    try { localStorage.setItem(STORAGE_KEY, userId); } catch { /* ignore */ }
    await this.refresh();
    // Re-navigate to the current URL so route guards re-evaluate with the
    // new user's canAccessConfig / canAccessCapture flags.
    await this.router.navigateByUrl(this.router.url);
  }

  /**
   * Attempts a single call to /api/me and updates signals on success.
   * Returns true if the call succeeded, false otherwise.
   */
  async refresh(): Promise<boolean> {
    try {
      const r = await firstValueFrom(
        this.http.get<ApiResponse<MeDto>>(`${this.base}/me`)
      );
      if (r?.isSuccess && r.data) {
        this.me.set(r.data);
        this.availableUsers.set(r.data.availableUsers ?? []);

        // Reconcile the local id with what the server actually resolved. The
        // API silently falls back to its default user when the X-User-Id
        // header doesn't match anyone (e.g. a stale legacy id like "1001"
        // left over from the hardcoded directory), in which case our stored
        // value would never light up an item in the dropdown. Detect that
        // mismatch and re-pin to the resolved identity.
        const stored = this.currentUserId();
        const resolved = r.data;
        const matchesStored = !!stored &&
          (stored === resolved.userId || stored === resolved.employeeId);
        if (!matchesStored) {
          this.currentUserId.set(resolved.userId);
          try { localStorage.setItem(STORAGE_KEY, resolved.userId); } catch { /* ignore */ }
        }
        return true;
      }
    } catch { /* swallow — dev shim */ }
    return false;
  }

  /**
   * Called on startup. If the first attempt fails (API not yet ready), retries
   * with exponential back-off so the chip never stays on "Loading..." due to
   * a startup race between the Angular dev server and the .NET API.
   */
  private async refreshWithRetry(): Promise<void> {
    if (await this.refresh()) return;
    for (const delay of RETRY_DELAYS) {
      await sleep(delay);
      if (await this.refresh()) return;
    }
  }

  private readStored(): string {
    try { return localStorage.getItem(STORAGE_KEY) || ''; }
    catch { return ''; }
  }
}

function positionLabel(u: MeDto | null): string {
  if (!u) return '';
  if (u.positionDescription && u.positionDescription.trim().length > 0) {
    return u.positionDescription;
  }
  return 'Employee';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
