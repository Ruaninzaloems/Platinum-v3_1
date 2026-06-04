import { Injectable, signal } from '@angular/core';

const SESSION_KEY = 'auth_user_id';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _userId = signal<number | null>(this._readFromStorage());
  private _resolved = signal<boolean>(false);

  readonly userId = this._userId.asReadonly();
  readonly resolved = this._resolved.asReadonly();

  private _readFromStorage(): number | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw !== null) {
        const parsed = parseInt(raw, 10);
        return isNaN(parsed) ? null : parsed;
      }
    } catch {
    }
    return null;
  }

  setUserId(id: number): void {
    try {
      sessionStorage.setItem(SESSION_KEY, String(id));
    } catch {
    }
    this._userId.set(id);
  }

  markResolved(): void {
    this._resolved.set(true);
  }

  clearUserId(): void {
    this.clearSession();
  }

  clearSession(): void {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
    }
    this._userId.set(null);
  }

  getCurrentUserId(): number | null {
    return this._userId();
  }
}
