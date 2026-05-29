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
    // If we're inside an MSAL popup window, do NOT call handleRedirectPromise().
    // The auth code must stay in the URL so the main window's MSAL can read
    // it and close the popup. Calling handleRedirectPromise() here would
    // consume the code first and break the popup flow.
    if (window.opener && window.opener !== window) {
      return;
    }

    // Main window: process any pending redirect response (covers the
    // popup-fallback redirect flow on browsers that block popups).
    this.msal.instance.initialize().then(() =>
      this.msal.instance.handleRedirectPromise()
    ).catch(() => {});
  }
}
