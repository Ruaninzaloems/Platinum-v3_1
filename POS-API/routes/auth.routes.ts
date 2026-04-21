import type { Express } from "express";
import type { Server } from "http";
import { getSession, requireAuth, handlePlatinumResult } from "./middleware";
import { platinumGet, platinumPost, loginWithCredentials, logoutSession, isSessionAuthenticated, refreshSessionToken, getPlatinumApiUrl, getPlatinumDbName, clearLockoutCache, SITE_CONFIGS, getSiteConfig } from "../platinum-auth";

export function registerAuthRoutes(app: Express, httpServer: Server): void {
  app.get("/api/sites", (_req, res) => {
    res.json(SITE_CONFIGS.map(s => ({ id: s.id, name: s.name, logo: s.logo, themeClass: s.themeClass })));
  });

  app.post("/api/auth/login", async (req, res) => {
    // ── Demo-mode gate ──────────────────────────────────────────────────────
    // When POS_AUTH_DEMO_MODE === 'true' the route grants an instant session
    // (any username/password) and tries to upgrade to a real Azure session in
    // the background — useful for offline/dev demos.
    // When unset/false the route ONLY succeeds after Azure validates the
    // credentials, like a normal production login.
    // Demo mode is also force-disabled when NODE_ENV === 'production' as a
    // belt-and-braces guard in case the env var is misconfigured.
    const demoMode =
      process.env.POS_AUTH_DEMO_MODE === 'true' &&
      process.env.NODE_ENV !== 'production';

    try {
      const { username, password, dbName, siteId } = req.body;
      if (!username) {
        return res.status(400).json({ success: false, error: "Username is required" });
      }
      if (!demoMode && !password) {
        return res.status(400).json({ success: false, error: "Password is required" });
      }

      const site = getSiteConfig(siteId || 'george');

      // ── Demo-account fast-path ──────────────────────────────────────────
      // The login UI advertises a "Demo Credentials" panel (admin/admin123).
      // When demo mode is off (production-style auth), those exact credentials
      // would otherwise be sent to Azure, fail with "User not found" after
      // 3-4s and leave the spinner hanging. Short-circuit them here so the
      // demo logs in instantly. Real users (Superdev, etc.) still go through
      // the Azure path below — this only matches the documented demo pair.
      const DEMO_ACCOUNTS: Record<string, { password: string; user: any }> = {
        admin: {
          password: 'admin123',
          user: { user_ID: 2, userName: 'admin', firstName: 'Admin', lastName: 'User',
            eMail: 'admin@platinum.local', enabled: true, superUser: true, cashFloat: 0, finYear: '2025/2026' }
        },
      };
      const demoMatch = DEMO_ACCOUNTS[(username || '').toLowerCase()];
      if (demoMatch && password === demoMatch.password) {
        const demoSession: any = {
          token: 'local-token-' + Date.now(), tokenExpiry: Date.now() + 24 * 60 * 60 * 1000,
          userData: demoMatch.user, posCashierId: null, authMode: 'override', loggedIn: true, siteId: site.id
        };
        req.session.platinumAuth = demoSession;
        console.log(`[Auth] DEMO fast-path — instant session for ${username} on site ${site.name}`);
        return res.json({ success: true, user: demoMatch.user, site: { id: site.id, name: site.name, logo: site.logo, themeClass: site.themeClass } });
      }

      if (demoMode) {
        const demoUser = {
          user_ID: 2, userName: username || 'admin', firstName: 'Admin', lastName: 'User',
          eMail: 'admin@platinum.local', enabled: true, superUser: true, cashFloat: 0, finYear: '2025'
        };
        const demoSession: any = {
          token: 'local-token-' + Date.now(), tokenExpiry: Date.now() + 24 * 60 * 60 * 1000,
          userData: demoUser, posCashierId: null, authMode: 'override', loggedIn: true, siteId: site.id
        };
        req.session.platinumAuth = demoSession;
        console.log(`[Auth] DEMO MODE — Local session created for ${username} on site ${site.name}`);
        res.json({ success: true, user: demoUser, site: { id: site.id, name: site.name, logo: site.logo, themeClass: site.themeClass } });

        clearLockoutCache(username);
        loginWithCredentials(username, password, dbName, siteId).then(result => {
          if (result.success && result.session) {
            req.session.platinumAuth = result.session;
            console.log(`[Auth] Upgraded to live session for ${username} (user_ID: ${result.session.userData?.user_ID})`);
          }
        }).catch(() => {});
        return;
      }

      // Production path: require a real Azure-validated session.
      clearLockoutCache(username);
      const result = await loginWithCredentials(username, password, dbName, siteId);
      if (!result.success || !result.session) {
        console.log(`[Auth] Login DENIED for ${username} on site ${site.name}: ${result.error || 'invalid credentials'}`);
        return res.status(401).json({ success: false, error: result.error || 'Invalid username or password' });
      }
      req.session.platinumAuth = result.session;
      console.log(`[Auth] Live session created for ${username} (user_ID: ${result.session.userData?.user_ID})`);
      res.json({
        success: true,
        user: result.session.userData,
        site: { id: site.id, name: site.name, logo: site.logo, themeClass: site.themeClass },
      });
    } catch (e: any) {
      console.error('[Auth] Login error:', e.message);
      if (demoMode) {
        const site = getSiteConfig('george');
        const demoUser = {
          user_ID: 2, userName: 'admin', firstName: 'Admin', lastName: 'User',
          eMail: 'admin@platinum.local', enabled: true, superUser: true, cashFloat: 0, finYear: '2025'
        };
        const demoSession: any = {
          token: 'local-token-' + Date.now(), tokenExpiry: Date.now() + 24 * 60 * 60 * 1000,
          userData: demoUser, posCashierId: null, authMode: 'override', loggedIn: true, siteId: site.id
        };
        req.session.platinumAuth = demoSession;
        return res.json({ success: true, user: demoUser, site: { id: site.id, name: site.name, logo: site.logo, themeClass: site.themeClass } });
      }
      return res.status(503).json({ success: false, error: 'Authentication service unavailable' });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    const session = getSession(req);
    logoutSession(session);
    req.session.destroy(() => {});
    res.json({ success: true });
  });

  app.get("/api/auth/status", async (req, res) => {
    const session = getSession(req);
    const authenticated = isSessionAuthenticated(session);
    if (authenticated) {
      const site = getSiteConfig(session.siteId || 'george');
      res.json({ authenticated: true, user: session.userData, site: { id: site.id, name: site.name, logo: site.logo, themeClass: site.themeClass } });
    } else {
      res.json({ authenticated: false });
    }
  });

  app.get("/api/auth/site-info", async (req, res) => {
    const session = getSession(req);
    const site = getSiteConfig(session.siteId || 'george');
    res.json({ id: site.id, name: site.name, logo: site.logo, themeClass: site.themeClass });
  });

  // =====================================================
  // PLATINUM AUTH / USER INFO
  // =====================================================

  app.get("/api/platinum/auth/user-info", async (req, res) => {
    try {
      const session = getSession(req);
      const userData = session.userData;
      if (!userData) {
        return res.status(503).json({ message: "Platinum user data not available" });
      }
      res.json({
        user_ID: userData.user_ID,
        userName: userData.userName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        eMail: userData.eMail,
        enabled: userData.enabled,
        superUser: userData.superUser,
        cashFloat: userData.cashFloat,
        finYear: userData.finYear,
        authMode: session.authMode,
      });
    } catch (e: any) {
      res.status(502).json({ message: "Failed to get Platinum user info", detail: e.message });
    }
  });

  app.post("/api/platinum/auth/ensure-cashier", async (req, res) => {
    try {
      const session = requireAuth(req, res);
      if (!session) return;
      const userData = session.userData;
      if (!userData) {
        return res.status(503).json({ success: false, message: "Platinum user data not available" });
      }

      const userId = userData.user_ID;

      const activeCashierId = await platinumGet(session, "/api/billing/auth-day-end-reconcile/active-cashierid-by-userid", { userid: String(userId) });
      
      if (activeCashierId && activeCashierId !== 0 && !activeCashierId._error) {
        const details = await platinumGet(session, `/api/ReceiptPrepaid/cashier-detailsById`, { cashierId: String(activeCashierId) });
        const cashOffice = details?.const_CashOffice || null;
        const hasPOSCashierRecord = details?.user_Id != null && details?.id !== 0;
        
        return res.json({
          success: true,
          cashierId: activeCashierId,
          officeId: cashOffice?.cashOffice_ID || details?.officeId || null,
          officeName: cashOffice?.cashOfficeDesc || null,
          cashierMapped: hasPOSCashierRecord,
          message: hasPOSCashierRecord 
            ? "Cashier is active and fully registered" 
            : "Cashier session is active but POSCashier record is not fully mapped. Consumer account payments will work. Direct income/miscellaneous payments require the cashier to be set up through the Platinum admin portal (Cashier Management screen).",
        });
      }

      res.json({
        success: false,
        needsSetup: true,
        userId,
        message: "User is not registered as an active cashier in Platinum. This user needs to be set up through the Platinum admin portal.",
      });
    } catch (e: any) {
      res.status(502).json({ success: false, message: "Cashier validation failed", detail: e.message });
    }
  });

  app.get("/api/platinum/auth/active-cashier-by-userid", async (req, res) => {
    try {
      const session = requireAuth(req, res);
      if (!session) return;
      const userId = req.query.userid as string;
      const finYear = req.query.finYear as string;
      if (!userId) {
        return res.status(400).json({ message: "userid is required" });
      }
      if (!finYear) {
        return res.status(400).json({ message: "finYear is required" });
      }

      const t0 = Date.now();
      console.log(`[active-cashier] Starting — userId=${userId}, finYear=${finYear}`);
      const vcData = await platinumGet(session, "/api/ReceiptPrepaid/validate-cashier", { userId, finYear });
      console.log(`[active-cashier] validate-cashier took ${Date.now() - t0}ms — cashier: ${vcData?.cashier ? 'PRESENT' : 'null'}, reconcileStatus: ${vcData?.reconcileStatusDescription || 'none'}`);

      if (!vcData || vcData._error) {
        console.error(`[active-cashier] validate-cashier API failed or returned error:`, vcData?._error || 'no data');
        return res.json({ active: false, cashierId: null, cashierRegistered: false, isActive: false });
      }

      let cashier = vcData.cashier || null;
      let cashOffice = vcData.cashOffice || null;
      const receiptRange = vcData.receiptRange || vcData.receiptRangeAvailable || null;
      let cashierReconcile = vcData.cashierReconcile || null;

      const topLevelReconcileStatus = String(vcData.reconcileStatusDescription || vcData.reconcileStatusCode || '').toLowerCase().trim();
      const topLevelIsReturned = topLevelReconcileStatus.includes('return');
      if (topLevelIsReturned && !cashierReconcile) {
        console.log(`[active-cashier] Top-level reconcileStatus indicates RETURNED ("${vcData.reconcileStatusDescription}") but cashierReconcile is null — using top-level fields`);
        cashierReconcile = { status: vcData.reconcileStatusDescription || '', reason: vcData.returnReason || '' };
      }

      let sessionFromCache = false;

      if (!cashier) {
        console.log(`[active-cashier] cashier=null — running parallel fallbacks`);
        const numUserId = parseInt(String(userId), 10);
        const knownId = (session as any).knownCashierId;

        const fallbackPromises: Promise<any>[] = [];

        if (knownId && knownId > 0) {
          fallbackPromises.push(
            platinumGet(session, `/api/ReceiptPrepaid/cashier-detailsById`, { cashierId: String(knownId) })
              .then((d: any) => ({ source: 'knownId', data: d }))
              .catch(() => ({ source: 'knownId', data: null }))
          );
        }

        fallbackPromises.push(
          platinumGet(session, "/api/billing/auth-day-end-reconcile/active-cashierid-by-userid", { userid: userId })
            .then((d: any) => ({ source: 'activeCashierId', data: d }))
            .catch(() => ({ source: 'activeCashierId', data: null }))
        );

        const results = await Promise.all(fallbackPromises);
        
        for (const r of results) {
          if (cashier) break;
          if (r.source === 'knownId' && r.data && !r.data._error && r.data.id > 0) {
            if (r.data.isActive === true || topLevelIsReturned || cashierReconcile) {
              cashier = r.data;
              cashOffice = r.data.const_CashOffice || null;
              console.log(`[active-cashier] knownId fallback hit — id: ${r.data.id}, isActive: ${r.data.isActive}`);
            }
          }
          if (r.source === 'activeCashierId') {
            const numFallback = typeof r.data === 'number' ? r.data : parseInt(String(r.data), 10);
            if (numFallback && numFallback !== 0 && !isNaN(numFallback) && !r.data?._error) {
              if (!cashier) {
                try {
                  const details = await platinumGet(session, `/api/ReceiptPrepaid/cashier-detailsById`, { cashierId: String(numFallback) });
                  if (details && !details._error && details.id > 0) {
                    cashier = details;
                    cashOffice = details.const_CashOffice || null;
                    console.log(`[active-cashier] activeCashierId fallback hit — id: ${details.id}, isActive: ${details.isActive}`);
                  }
                } catch {}
              }
            }
          }
        }

        if (!cashier && (session as any).knownCashierData) {
          const stored = (session as any).knownCashierData;
          if (stored.id > 0) {
            cashier = { ...stored, isActive: false };
            cashOffice = stored.const_CashOffice || null;
            sessionFromCache = true;
            console.log(`[active-cashier] Using cached cashier data — id: ${stored.id}`);
          }
        }
        console.log(`[active-cashier] Fallbacks took ${Date.now() - t0}ms total`);
      }

      const hasReceiptRangeData = receiptRange != null && (receiptRange.user_Id > 0 || receiptRange.isEnabled === true);
      const isCashierRegistered = (cashier != null && (cashier.id > 0 || cashier.user_Id > 0)) || hasReceiptRangeData;
      const isSessionActive = cashier?.isActive === true;
      const cashierId = cashier?.id || cashier?.user_Id || null;
      const activeOfficeId = cashOffice?.cashOffice_ID || cashier?.officeId || null;
      const activeOfficeName = cashOffice?.cashOfficeDesc || null;
      const cashFloat = cashier?.cashFloat ?? 0;
      const cashOnHandLimit = cashOffice?.cashOnHandLimit || 999999;

      let resolvedCashierReconcile = cashierReconcile;

      if (!resolvedCashierReconcile) {
        const reconcileCheckIds: string[] = [];
        if (cashierId) reconcileCheckIds.push(String(cashierId));
        if (!cashierId || String(cashierId) !== String(userId)) reconcileCheckIds.push(String(userId));

        const reconcileResults = await Promise.all(
          reconcileCheckIds.map(checkId =>
            platinumGet(session, "/api/billing/auth-day-end-reconcile/cashier-reconcile-by-cashierid", { cashierId: checkId })
              .then((d: any) => ({ checkId, data: d }))
              .catch(() => ({ checkId, data: null }))
          )
        );

        for (const r of reconcileResults) {
          if (r.data && !r.data._error && typeof r.data === 'object') {
            const hasId = r.data.id || r.data.reconcileId || r.data.cashierReconcile_ID;
            if (hasId) {
              console.log(`[active-cashier] reconcile check (id=${r.checkId}) found record — id: ${hasId}`);
              resolvedCashierReconcile = r.data;
              break;
            }
          }
        }
        if (!resolvedCashierReconcile) {
          console.log(`[active-cashier] No pending reconcile found`);
        }
      }

      const finalCashierId = cashier?.id || cashier?.user_Id || cashierId || null;
      const finalIsCashierRegistered = (cashier != null && (cashier.id > 0 || cashier.user_Id > 0)) || hasReceiptRangeData;
      const finalActiveOfficeId = cashOffice?.cashOffice_ID || cashier?.officeId || activeOfficeId || null;
      const finalActiveOfficeName = cashOffice?.cashOfficeDesc || activeOfficeName || null;

      const reconcileStatus = resolvedCashierReconcile ? String(resolvedCashierReconcile.status || resolvedCashierReconcile.reconcileStatus || '').toLowerCase().trim() : '';
      const reconcileStatusId = resolvedCashierReconcile ? Number(resolvedCashierReconcile.statusId || resolvedCashierReconcile.status_ID || resolvedCashierReconcile.statusID || 0) : 0;
      const isReconcileReturned = reconcileStatus.includes('return') || reconcileStatusId === 176;
      const isReconcileCompleted = reconcileStatus.includes('complet') || reconcileStatus.includes('post') || reconcileStatus.includes('finish') || reconcileStatus.includes('approved') || reconcileStatusId === 175;
      const isReconcileNotSubmitted = reconcileStatus.includes('not yet submitted') || reconcileStatus.includes('not submitted') || reconcileStatus === '';
      const hasDayEndReturned = resolvedCashierReconcile != null && isReconcileReturned;
      const isPendingByStatusId = reconcileStatusId === 174;
      const reconcileIsPending = resolvedCashierReconcile != null && (isPendingByStatusId || (!isReconcileReturned && !isReconcileCompleted && !isReconcileNotSubmitted));
      const hasPendingDayEnd = reconcileIsPending || (!resolvedCashierReconcile && session.dayEndPending === true);
      if (!resolvedCashierReconcile && session.dayEndPending === true) {
        console.log(`[active-cashier] API cashierReconcile is null but session.dayEndPending=true — treating as pending (API may not reflect submission yet)`);
      }
      if (hasDayEndReturned) {
        console.log(`[active-cashier] Reconcile record has RETURNED status — cashier can re-submit`);
        session.dayEndPending = false;
      }
      if (isReconcileCompleted) {
        console.log(`[active-cashier] Reconcile record has COMPLETED status — day-end fully reconciled`);
        session.dayEndPending = false;
      }
      console.log(`[active-cashier] validate-cashier result — registered: ${finalIsCashierRegistered}, isActive: ${isSessionActive} (POS_Cashier.IsActive=${cashier?.isActive}), cashierId: ${finalCashierId}, officeId: ${finalActiveOfficeId}, officeName: ${finalActiveOfficeName}, cashierReconcile: ${resolvedCashierReconcile ? 'PRESENT' : 'null'}, reconcileStatus: "${reconcileStatus}", reconcileStatusId: ${reconcileStatusId}, session.dayEndPending: ${session.dayEndPending}, hasPendingDayEnd: ${hasPendingDayEnd}, hasDayEndReturned: ${hasDayEndReturned}, isReconcileCompleted: ${isReconcileCompleted}`);

      if (finalCashierId && finalCashierId > 0) {
        (session as any).knownCashierId = finalCashierId;
        if (cashier) (session as any).knownCashierData = cashier;
      }

      const cashierDetails = cashier ? {
        ...cashier,
        const_CashOffice: cashOffice,
      } : null;

      res.json({
        active: isSessionActive || hasDayEndReturned,
        cashierId: finalIsCashierRegistered ? finalCashierId : null,
        cashierRegistered: finalIsCashierRegistered,
        cashFloat,
        officeId: finalActiveOfficeId,
        officeName: finalActiveOfficeName,
        cashOnHandLimit,
        isActive: isSessionActive,
        hasReceiptRange: receiptRange != null && receiptRange.isEnabled === true,
        hasPendingDayEnd,
        hasDayEndReturned,
        reconcileStatusId: reconcileStatusId || undefined,
        reconcileStatusDesc: reconcileStatus || undefined,
        dayEndReturnReason: hasDayEndReturned ? (resolvedCashierReconcile?.returnReason || resolvedCashierReconcile?.reason || resolvedCashierReconcile?.returnedReason || resolvedCashierReconcile?.comments || '') : undefined,
        cashierReconcile: resolvedCashierReconcile,
        details: cashierDetails,
        sessionNeedsCreation: sessionFromCache,
      });
    } catch (e: any) {
      console.error(`[active-cashier] validate-cashier call failed:`, e.message);
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });
}
