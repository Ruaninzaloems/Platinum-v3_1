import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
  styles: [':host { display: block; height: 100vh; }']
})
export class AppComponent implements OnInit {
  private msal = inject(MsalService);

  ngOnInit(): void {
    // This only runs in the main window — the popup is handled in main.ts
    // via broadcastResponseToMainFrame() before Angular ever bootstraps.
    //
    // Call handleRedirectPromise() to process any pending full-page redirect
    // response (covers the popup-fallback redirect flow on browsers that
    // block popups, or when loginRedirect() is used explicitly).
    this.msal.instance.handleRedirectPromise().catch(() => {});
  }
}
