import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  BrowserCacheLocation,
  IPublicClientApplication,
  LogLevel,
  PublicClientApplication,
} from '@azure/msal-browser';
import {
  MsalService,
  MsalGuard,
  MsalBroadcastService,
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG,
  MsalGuardConfiguration,
} from '@azure/msal-angular';
import { routes } from './app.routes';
import { authInterceptor } from '@platinumv3/shared/auth';
import { AZURE_AD, GRAPH_SCOPES } from './msal.config';

// ── MSAL singleton instance ────────────────────────────────────────────────
// Created once here so that main.ts can call initialize() on the SAME object
// that Angular DI will inject everywhere. Using useFactory would create a
// second instance and MSAL's internal state would be split across two objects,
// causing the popup loginPopup() promise to never resolve.
export const msalInstance: IPublicClientApplication = new PublicClientApplication({
  auth: {
    clientId   : AZURE_AD.CLIENT_ID,
    authority  : `https://login.microsoftonline.com/${AZURE_AD.TENANT_ID}`,
    // Main redirect URI (used for full-page redirect fallback).
    redirectUri: AZURE_AD.REDIRECT_URI,
    postLogoutRedirectUri: AZURE_AD.REDIRECT_URI,
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage,
  },
  system: {
    loggerOptions: {
      logLevel         : LogLevel.Warning,
      loggerCallback   : (level, msg) => console.warn('[MSAL]', msg),
      piiLoggingEnabled: false,
    },
  },
});

// ── MSAL Guard config (used by MsalGuard on protected routes) ─────────────
const msalGuardConfig: MsalGuardConfiguration = {
  interactionType: 'popup' as any,
  authRequest   : { scopes: GRAPH_SCOPES },
  loginFailedRoute: '/login',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),

    // ── MSAL providers ──────────────────────────────────────────────────
    { provide: MSAL_INSTANCE,        useValue: msalInstance },
    { provide: MSAL_GUARD_CONFIG,    useValue: msalGuardConfig },
    { provide: MSAL_INTERCEPTOR_CONFIG, useValue: { interactionType: 'popup', protectedResourceMap: new Map() } },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
  ],
};
