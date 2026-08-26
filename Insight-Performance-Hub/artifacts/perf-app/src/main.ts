import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

/**
 * The browser fires "ResizeObserver loop ..." as a window error event with no
 * Error object attached. It is a benign layout notification (common with
 * Material dialogs, selects and dense tables), but crash overlays report it as
 * a fatal runtime error. Swallow only these two well-known messages.
 */
const RESIZE_OBSERVER_ERRORS = [
  'ResizeObserver loop completed with undelivered notifications',
  'ResizeObserver loop limit exceeded',
];
window.addEventListener(
  'error',
  (event) => {
    if (RESIZE_OBSERVER_ERRORS.some((m) => event.message?.includes(m))) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  },
  { capture: true },
);

// Make non-Error promise rejections diagnosable (e.g. HttpErrorResponse).
window.addEventListener('unhandledrejection', (event) => {
  if (!(event.reason instanceof Error)) {
    // eslint-disable-next-line no-console
    console.error('[Unhandled rejection]', event.reason);
  }
});

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  // eslint-disable-next-line no-console
  console.error(err),
);
