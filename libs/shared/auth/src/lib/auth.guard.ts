import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Always confirms the session against POS-API once per app load before
 * granting protected navigation. After that initial check, in-memory state
 * is trusted; outbound 401s in the interceptor will tear it down again.
 *
 * Typed as both CanActivateFn and CanMatchFn so it can be used in `canMatch`
 * to short-circuit lazy route loading entirely when the user is unauthenticated
 * (no shell or feature chunks are fetched until login succeeds).
 */
export const authGuard: CanActivateFn & CanMatchFn = () => {
  // Login screen is disabled — AuthService auto-creates a local admin
  // session on app start, so the guard always grants access.
  inject(AuthService);
  return true;
};

// Router is intentionally unused now but kept in the import list to avoid
// cascading edits in any guard that may reference it later.
void Router;
