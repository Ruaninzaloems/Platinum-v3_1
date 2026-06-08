import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environment';
import { ApiResponse } from '../models/api-response.model';
import { MeDto } from '../models/overtime-workflow.model';

/** Retry delays in ms for the startup race: 1 s, 2 s, 4 s. */
const RETRY_DELAYS = [1000, 2000, 4000];

/**
 * Holds the currently authenticated user's identity, resolved from the
 * server-side session via GET /api/auth/me.
 *
 * Populated on startup (with retry for API warm-up), after login (via
 * setFromDto), and after navigation guard checks.
 * Cleared on logout via clear().
 */
@Injectable({ providedIn: 'root' })
export class UserContextService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  readonly me = signal<MeDto | null>(null);

  readonly displayName = computed(() => this.me()?.displayName ?? 'Loading...');
  readonly roleLabel   = computed(() => positionLabel(this.me()));

  constructor() { this.refreshWithRetry(); }

  /** Set the user directly from a DTO (called after login or by auth guard). */
  setFromDto(dto: MeDto): void {
    this.me.set(dto);
  }

  /** Clear the user on logout. */
  clear(): void {
    this.me.set(null);
  }

  /**
   * Fetch the current user from /api/auth/me and update signals.
   * Returns true on success, false on any error (including 401).
   */
  async refresh(): Promise<boolean> {
    try {
      const r = await firstValueFrom(
        this.http.get<ApiResponse<MeDto>>(`${this.base}/auth/me`, { withCredentials: true })
      );
      if (r?.isSuccess && r.data) {
        this.me.set(r.data);
        return true;
      }
    } catch { /* 401 or network error — leave me() as null */ }
    return false;
  }

  /**
   * Called on startup. Retries on failure to handle the API warm-up race.
   * Silently gives up after all retries; the auth guard will redirect to /login.
   */
  private async refreshWithRetry(): Promise<void> {
    if (await this.refresh()) return;
    for (const delay of RETRY_DELAYS) {
      await sleep(delay);
      if (await this.refresh()) return;
    }
  }
}

function positionLabel(u: MeDto | null): string {
  if (!u) return '';
  return u.positionDescription?.trim() || 'Employee';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
