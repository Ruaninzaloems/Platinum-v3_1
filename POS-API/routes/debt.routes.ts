import type { Express } from "express";
import type { Server } from "http";
import { requireAuth, handlePlatinumResult, requireDebtPermission, injectAuditFields, DEBT_PERMISSIONS } from "./middleware";
import { platinumGet, platinumPost, getSiteConfig, getPlatinumApiUrl } from "../platinum-auth";

export function registerDebtRoutes(app: Express, httpServer: Server): void {
  // requiredPermission: PROCESS_SECTION129
  app.get("/api/platinum/billing-debt/section129-config", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const [data, emailTemplates, smsTemplates] = await Promise.all([
        platinumGet(session, "/api/BillingDebt/section129-config", req.query as Record<string, string>),
        platinumGet(session, "/api/BillingDebt/section129-templates", { sendingType: "Email" }).catch(() => []),
        platinumGet(session, "/api/BillingDebt/section129-templates", { sendingType: "SMS" }).catch(() => []),
      ]);
      if (!data || (typeof data === 'object' && data.message)) {
        return handlePlatinumResult(res, data);
      }
      const templateMap: Record<number, string> = {};
      for (const t of [...(Array.isArray(emailTemplates) ? emailTemplates : []), ...(Array.isArray(smsTemplates) ? smsTemplates : [])]) {
        if (t.id && t.templateTitle) templateMap[t.id] = t.templateTitle;
      }
      const costItems = Array.isArray(data.costItems) ? data.costItems : [];
      const adminFees = costItems.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);
      const mapped = {
        id: data.configId,
        finYear: data.financialYear,
        demandLetterTemplate: templateMap[data.section129TemplateId] || (data.section129TemplateId ? `Template #${data.section129TemplateId}` : null),
        smsTemplate: data.smsTemplateId ? (templateMap[data.smsTemplateId] || `Template #${data.smsTemplateId}`) : null,
        adminFees,
        lapseDays: data.lapseDays ?? 0,
        interestRate: data.interestRate ?? 0,
        minimumAmount: data.minimumAmount ?? 0,
        noticesPerFile: data.noticesPerFile,
        activateRotation: data.activateRotation ?? false,
        enabled: data.enabled ?? true,
        section129TemplateId: data.section129TemplateId,
        smsTemplateId: data.smsTemplateId,
        costItems,
        attorneyRotation: data.attorneyRotation || [],
        dateCaptured: data.dateCaptured,
        capturerId: data.capturerId,
      };
      res.json(mapped);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  // requiredPermission: PROCESS_SECTION129
  app.get("/api/platinum/billing-debt/section129-runs", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const data = await platinumGet(session, "/api/BillingDebt/section129-runs", req.query as Record<string, string>);
      if (data && data._error) { handlePlatinumResult(res, data); return; }

      let cyclesMap: Record<number, string> = {};
      try {
        const cyclesRes = await platinumGet(session, "/api/BillingDebt/billing-cycles", {});
        if (Array.isArray(cyclesRes)) {
          for (const c of cyclesRes) cyclesMap[c.id] = c.name;
        }
      } catch (_) {}

      const runTypeMap: Record<number, string> = { 1: 'Trial Run', 2: 'Trial Review', 3: 'Authorized', 4: 'Final Run' };

      const rows = Array.isArray(data) ? data : [];
      const currentUserId = session.userData?.user_ID;
      const currentUserName = session.userData?.firstName && session.userData?.lastName
        ? `${session.userData.firstName} ${session.userData.lastName}`
        : session.userData?.name || session.userData?.displayName || null;

      const mapped = rows.map((r: any) => {
        let dist = '—';
        if (r.printLetter !== null && r.printLetter !== undefined) dist = 'Print';
        else if (r.email !== null && r.email !== undefined) dist = 'Email';
        else if (r.sms !== null && r.sms !== undefined) dist = 'SMS';
        else if (r.whatsApp !== null && r.whatsApp !== undefined) dist = 'WhatsApp';
        else if (r.distributionType) dist = r.distributionType;

        let actionedBy = r.capturerName || r.actionedBy || '—';
        if (actionedBy === '—' && r.capturerId && r.capturerId === currentUserId && currentUserName) {
          actionedBy = currentUserName;
        }

        return {
          runId: r.runId,
          status: r.statusDescription || r.status || '—',
          statusId: r.statusId,
          runType: typeof r.runType === 'number' ? (runTypeMap[r.runType] || `Type ${r.runType}`) : (r.runType || '—'),
          distributionType: dist,
          handoverOption: r.handoverOption || '—',
          actionedBy,
          dateCreated: r.dateCaptured || r.dateCreated,
          billingCycle: cyclesMap[r.billingCycleId] || (r.billingCycleId ? `Cycle ${r.billingCycleId}` : '—'),
          totalAccounts: r.accountCount ?? r.totalAccounts ?? 0,
          totalAmount: r.totalAmount ?? 0,
          selectedCount: r.selectedCount ?? 0,
          selectedAmount: r.selectedAmount ?? 0,
          authorizedBy: r.authorizedBy || '—',
          financialYear: r.financialYear,
          townId: r.townId,
          billingCycleId: r.billingCycleId,
        };
      });

      if (rows.length > 0) console.log("[section129-runs] RAW first row:", JSON.stringify(rows[0]));
      console.log("[section129-runs] Mapped", mapped.length, "run(s)");
      res.json(mapped);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  app.post("/api/platinum/billing-debt/section129-trial-run", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      if (!requireDebtPermission(session, DEBT_PERMISSIONS.PROCESS_SECTION129, res)) return;
      const b = req.body;
      const mapped: Record<string, any> = {
        financialYear: b.finYear || b.financialYear,
        finMonth: b.finMonth ? Number(b.finMonth) : undefined,
        runType: b.runType,
        billingCycleId: Number(b.billingCycle || b.billingCycleId) || undefined,
        townId: b.town ? Number(b.town) : undefined,
        suburbId: b.suburb ? Number(b.suburb) : undefined,
        propertyCategoryId: b.propertyCategory ? Number(b.propertyCategory) : undefined,
        accountTypeId: b.accountType ? Number(b.accountType) : undefined,
        personTypeId: b.typeOfPerson ? Number(b.typeOfPerson) : undefined,
        serviceGroupCode: b.serviceGroupCode || undefined,
        ageingId: b.ageing ? Number(b.ageing) : undefined,
        amountGreaterThan: b.amountGreaterThan != null ? Number(b.amountGreaterThan) : undefined,
        includeIndigents: b.includeIndigents ?? false,
        includePensioners: b.includePensioners ?? false,
        excludeDepositBalances: b.excludeDepositBalances ?? false,
        contactPerson: b.contactPerson || undefined,
        phone: b.phone || undefined,
        email: b.email || undefined,
        distributionType: b.distributionType,
        mustEmailBePrinted: b.mustEmailBePrinted ?? false,
        handoverOption: b.handoverOption || undefined,
      };
      Object.keys(mapped).forEach(k => mapped[k] === undefined && delete mapped[k]);
      console.log("[section129-trial-run] Payload →", JSON.stringify(mapped, null, 2));
      const data = await platinumPost(session, "/api/BillingDebt/section129-trial-run", injectAuditFields(session, mapped));
      console.log("[section129-trial-run] Response →", JSON.stringify(data));
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  app.post("/api/platinum/billing-debt/section129-trial-review-submit", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      if (!requireDebtPermission(session, DEBT_PERMISSIONS.PROCESS_SECTION129, res)) return;
      const data = await platinumPost(session, "/api/BillingDebt/section129-trial-review-submit", injectAuditFields(session, req.body, { isReview: true }));
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  app.post("/api/platinum/billing-debt/section129-authorize", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      if (!requireDebtPermission(session, DEBT_PERMISSIONS.AUTHORISE_SECTION129, res)) return;
      const data = await platinumPost(session, "/api/BillingDebt/section129-authorize", injectAuditFields(session, req.body, { isReview: true }));
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  app.post("/api/platinum/billing-debt/section129-final-run", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      if (!requireDebtPermission(session, DEBT_PERMISSIONS.PROCESS_SECTION129, res)) return;
      const data = await platinumPost(session, "/api/BillingDebt/section129-final-run", injectAuditFields(session, req.body));
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  // requiredPermission: PROCESS_SECTION129
  app.get("/api/platinum/billing-debt/section129-run-accounts", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const data = await platinumGet(session, "/api/BillingDebt/section129-run-accounts", req.query as Record<string, string>);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  app.get("/api/platinum/billing-debt/section129-run-status", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const data = await platinumGet(session, "/api/BillingDebt/section129-run-status", req.query as Record<string, string>);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  app.post("/api/platinum/billing-debt/section129-delete-run", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      if (!requireDebtPermission(session, DEBT_PERMISSIONS.PROCESS_SECTION129, res)) return;
      const runId = Number(req.body.runId);
      if (!runId || isNaN(runId)) {
        res.status(400).json({ message: "runId is required" });
        return;
      }
      console.log("[section129-delete-run] Sending runId:", runId);
      const data = await platinumPost(session, "/api/BillingDebt/section129-delete-run", runId);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  // requiredPermission: HANDOVER_PROCESS
  app.get("/api/platinum/billing-debt/handover-list", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const data = await platinumGet(session, "/api/BillingDebt/handover-list", req.query as Record<string, string>);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  app.post("/api/platinum/billing-debt/handover-submit", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      if (!requireDebtPermission(session, DEBT_PERMISSIONS.HANDOVER_PROCESS, res)) return;
      const data = await platinumPost(session, "/api/BillingDebt/handover-submit", injectAuditFields(session, req.body));
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  app.post("/api/platinum/billing-debt/handover-terminate", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      if (!requireDebtPermission(session, DEBT_PERMISSIONS.HANDOVER_PROCESS, res)) return;
      const data = await platinumPost(session, "/api/BillingDebt/handover-terminate", injectAuditFields(session, req.body, { isTermination: true }));
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  app.get("/api/platinum/billing-debt/handover-account-detail", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      if (!requireDebtPermission(session, DEBT_PERMISSIONS.HANDOVER_PROCESS, res)) return;
      if (!req.query.handoverId && !req.query.accountNo) { res.status(400).json({ message: "handoverId or accountNo required" }); return; }
      const data = await platinumGet(session, "/api/BillingDebt/handover-account-detail", req.query as Record<string, string>);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  app.get("/api/platinum/billing-debt/handover-transactions", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      if (!requireDebtPermission(session, DEBT_PERMISSIONS.HANDOVER_PROCESS, res)) return;
      if (!req.query.handoverId) { res.status(400).json({ message: "handoverId required" }); return; }
      const data = await platinumGet(session, "/api/BillingDebt/handover-transactions", req.query as Record<string, string>);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  // requiredPermission: HANDOVER_PROCESS
  app.get("/api/platinum/billing-debt/attorney-list", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      let data = await platinumGet(session, "/api/BillingDebt/attorney-list", req.query as Record<string, string>);
      if (Array.isArray(data)) {
        data = data.map((a: any) => ({
          attorneyId: a.id ?? a.attorneyId,
          attorneyName: a.name ?? a.attorneyName ?? '',
          firmName: a.firmName ?? a.name ?? '',
          contactNumber: a.contactNo ?? a.contactNumber ?? '',
          email: a.email ?? '',
          commission: a.commission ?? 0,
          allocationPercentage: a.allocationPercentage ?? 0,
          isActive: a.isActive ?? (a.IsActive !== undefined ? a.IsActive : true),
        }));
      }
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  // requiredPermission: PROCESS_SECTION129
  app.get("/api/platinum/billing-debt/billing-cycles", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const data = await platinumGet(session, "/api/BillingDebt/billing-cycles", req.query as Record<string, string>);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  // requiredPermission: PROCESS_SECTION129
  app.get("/api/platinum/billing-debt/towns", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const data = await platinumGet(session, "/api/BillingDebt/towns", req.query as Record<string, string>);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  app.get("/api/platinum/billing-debt/suburbs", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const townId = req.query.townId as string;
      if (!townId) { res.json([]); return; }

      const data = await platinumGet(session, "/api/BillingDebt/suburbs", { townId } as Record<string, string>);
      if (data && (data as any)._error) {
        console.log(`[suburbs] Platinum API error for townId=${townId}:`, JSON.stringify(data).substring(0, 150));
        res.json([]);
        return;
      }
      const arr = Array.isArray(data) ? data : [];
      console.log(`[suburbs] Returned ${arr.length} suburb(s) for townId=${townId}`);
      res.json(arr);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  // requiredPermission: SECTION129_REPORT
  app.get("/api/platinum/billing-debt/section129-report", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const data = await platinumGet(session, "/api/BillingDebt/section129-report", req.query as Record<string, string>);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  // requiredPermission: HANDOVER_REPORT
  app.get("/api/platinum/billing-debt/handover-report", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const data = await platinumGet(session, "/api/BillingDebt/handover-report", req.query as Record<string, string>);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  app.get("/api/platinum/billing-debt/sms-log-report", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const data = await platinumGet(session, "/api/BillingDebt/sms-log-report", req.query as Record<string, string>);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  app.get("/api/platinum/billing-debt/section129-config-list", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const finYear = (req.query as Record<string, string>).finYear;
      const [listData, detailData, emailTemplates, smsTemplates] = await Promise.all([
        platinumGet(session, "/api/BillingDebt/section129-config-list", req.query as Record<string, string>),
        finYear ? platinumGet(session, "/api/BillingDebt/section129-config", { finYear }).catch(() => null) : Promise.resolve(null),
        platinumGet(session, "/api/BillingDebt/section129-templates", { sendingType: "Email" }).catch(() => []),
        platinumGet(session, "/api/BillingDebt/section129-templates", { sendingType: "SMS" }).catch(() => []),
      ]);
      const raw = Array.isArray(listData) ? listData : (listData ? [listData] : []);
      const templateMap: Record<number, string> = {};
      for (const t of [...(Array.isArray(emailTemplates) ? emailTemplates : []), ...(Array.isArray(smsTemplates) ? smsTemplates : [])]) {
        if (t.id && t.templateTitle) templateMap[t.id] = t.templateTitle;
      }
      const detail = detailData && !Array.isArray(detailData) ? detailData : null;
      const mapped = raw.map((entry: any) => {
        const smsTemplateId = entry.smsTemplateId ?? (detail && detail.configId === entry.configId ? detail.smsTemplateId : null);
        const costItems = entry.costItems ?? (detail && detail.configId === entry.configId ? detail.costItems : []);
        const additionalBillingType = costItems?.length
          ? costItems.map((c: any) => c.additionalBillingTypeName).filter(Boolean).join(", ")
          : null;
        const totalFees = costItems?.length
          ? costItems.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
          : null;
        return {
          id: entry.configId,
          finYear: entry.financialYear,
          section129Template: templateMap[entry.section129TemplateId] || (entry.section129TemplateId ? `Template #${entry.section129TemplateId}` : null),
          smsTemplate: smsTemplateId ? (templateMap[smsTemplateId] || `Template #${smsTemplateId}`) : null,
          additionalBillingType,
          totalFees,
          noticesPerFile: entry.noticesPerFile,
          lapseDays: entry.lapseDays,
          interestRate: entry.interestRate ?? (detail && detail.configId === entry.configId ? detail.interestRate : 0) ?? 0,
          minimumAmount: entry.minimumAmount ?? (detail && detail.configId === entry.configId ? detail.minimumAmount : 0) ?? 0,
          activateRotation: entry.activateRotation ?? false,
          enabled: entry.enabled ?? true,
          section129TemplateId: entry.section129TemplateId,
          smsTemplateId,
          costItems: costItems || [],
          attorneyRotation: entry.attorneyRotation ?? (detail && detail.configId === entry.configId ? detail.attorneyRotation : []),
          dateCaptured: entry.dateCaptured,
        };
      });
      res.json(mapped);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  app.post("/api/platinum/billing-debt/section129-config-save", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      if (!requireDebtPermission(session, DEBT_PERMISSIONS.PROCESS_SECTION129, res)) return;
      const b = req.body;
      const capturerId = (session as any).userData?.user_ID || (session as any).userId || 1;
      const platinumPayload: Record<string, any> = {
        configId: b.id != null ? Number(b.id) : null,
        financialYear: b.finYear || b.financialYear,
        section129TemplateId: Number(b.section129Template || b.section129TemplateId),
        smsTemplateId: Number(b.smsTemplate || b.smsTemplateId),
        lapseDays: Number(b.lapseDays ?? 14),
        noticesPerFile: Number(b.noticesPerFile ?? 500),
        interestRate: Number(b.interestRate ?? 0),
        minimumAmount: Number(b.minimumAmount ?? 0),
        activateRotation: b.activateRotation ?? false,
        enabled: b.enabled ?? true,
        capturerId: Number(capturerId),
        costItems: (b.costItems || []).map((c: any, i: number) => ({
          additionalBillingTypeId: Number(c.additionalBillingTypeId),
          amount: Number(c.amount),
          sortOrder: c.sortOrder ?? c.nr ?? (i + 1),
        })),
        attorneyRotation: (b.attorneyRotation || []).map((a: any, i: number) => ({
          attorneyId: Number(a.attorneyId),
          percentDebtorCount: Number(a.percentDebtorCount ?? 0),
          percentHandoverAmount: Number(a.percentHandoverAmount ?? 0),
          sortOrder: a.sortOrder ?? a.nr ?? (i + 1),
        })),
      };
      console.log("[section129-config-save] Final payload →", JSON.stringify(platinumPayload, null, 2));
      const data = await platinumPost(session, "/api/BillingDebt/section129-config-save", platinumPayload);
      console.log("[section129-config-save] Response →", JSON.stringify(data));
      if (data?._error && data.status === 500) {
        const detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        res.status(500).json({
          message: "Platinum API returned a server error while saving the configuration.",
          detail,
        });
        return;
      }
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  // requiredPermission: PROCESS_SECTION129
  app.get("/api/platinum/billing-debt/section129-templates", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const data = await platinumGet(session, "/api/BillingDebt/section129-templates", req.query as Record<string, string>);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  // requiredPermission: PROCESS_SECTION129
  app.get("/api/platinum/billing-debt/section129-sms-templates", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const data = await platinumGet(session, "/api/BillingDebt/section129-sms-templates", req.query as Record<string, string>);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  // requiredPermission: PROCESS_SECTION129
  app.get("/api/platinum/billing-debt/section129-run-files", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const data = await platinumGet(session, "/api/BillingDebt/section129-run-files", req.query as Record<string, string>);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  // requiredPermission: PROCESS_SECTION129
  app.get("/api/platinum/billing-debt/section129-download-file", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const siteConfig = getSiteConfig(session.siteId);
      const apiUrl = siteConfig?.apiUrl || getPlatinumApiUrl();
      const qs = new URLSearchParams(req.query as Record<string, string>).toString();
      const url = `${apiUrl}/api/BillingDebt/section129-download-file${qs ? '?' + qs : ''}`;
      const upstream = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
        },
      });
      if (!upstream.ok) {
        res.status(upstream.status).json({ message: `Platinum returned ${upstream.status}` });
        return;
      }
      const contentType = upstream.headers.get('content-type');
      const contentDisposition = upstream.headers.get('content-disposition');
      if (contentType) res.setHeader('Content-Type', contentType);
      if (contentDisposition) res.setHeader('Content-Disposition', contentDisposition);
      const buffer = Buffer.from(await upstream.arrayBuffer());
      res.send(buffer);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  // requiredPermission: PROCESS_SECTION129
  app.get("/api/platinum/billing-debt/additional-billing-types", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const data = await platinumGet(session, "/api/BillingDebt/additional-billing-types", req.query as Record<string, string>);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  app.get("/api/platinum/billing-debt/property-categories", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const data = await platinumGet(session, "/api/BillingDebt/property-categories", req.query as Record<string, string>);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  app.get("/api/platinum/billing-debt/account-types", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const data = await platinumGet(session, "/api/BillingDebt/account-types", req.query as Record<string, string>);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  app.get("/api/platinum/billing-debt/person-types", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const data = await platinumGet(session, "/api/BillingDebt/person-types", req.query as Record<string, string>);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

  app.get("/api/platinum/billing-debt/ageing-ranges", async (req, res) => {
    try {
      const session = requireAuth(req, res); if (!session) return;
      const data = await platinumGet(session, "/api/BillingDebt/ageing-ranges", req.query as Record<string, string>);
      handlePlatinumResult(res, data);
    } catch (e: any) {
      res.status(502).json({ message: "Platinum API unreachable", detail: e.message });
    }
  });

}
