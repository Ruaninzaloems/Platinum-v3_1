// ────────────────────────────────────────────────────────────────────────────
// ART (Platinum source-system) API proxy.
//
// Faithful port of the source Platinum-AFS NestJS module
//   server/src/modules/platinum-art-api/{platinum-art-api.service,controller}.ts
// adapted to the monorepo's simplified Express API. The Angular frontend
// (libs/afs ArtApiService) calls `/api/art/*`; these handlers proxy to the
// external ART API at ART_API_URL using HTTP Basic auth (ART_API_USER /
// ART_API_PASS), with the same 30s in-memory GET cache as the source.
//
// Env (read lazily so dotenv — loaded in db.ts — has run first):
//   ART_API_URL   e.g. https://platinum-art-api-...azurewebsites.net
//   ART_API_USER  ART API username (HTTP Basic)
//   ART_API_PASS  ART API password (HTTP Basic)
// ────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class ArtApiClient {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_TTL = 30_000;

  private get baseUrl(): string {
    return process.env.ART_API_URL || '';
  }
  private get username(): string {
    return process.env.ART_API_USER || '';
  }
  private get password(): string {
    return process.env.ART_API_PASS || '';
  }

  isConfigured(): boolean {
    return !!this.username && !!this.password && !!this.baseUrl;
  }

  private getAuthHeader(): string {
    return 'Basic ' + Buffer.from(`${this.username}:${this.password}`).toString('base64');
  }

  private sanitizeSqlParam(value: string): string {
    return value.replace(/'/g, "''").replace(/[;\-\-\/\*\\]/g, '');
  }

  private sanitizeNumericParam(value: number | string): number {
    const n = Number(value);
    if (isNaN(n) || !isFinite(n)) throw new Error(`Invalid numeric parameter: ${value}`);
    return n;
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) return entry.data as T;
    if (entry) this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, expiresAt: Date.now() + this.CACHE_TTL });
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: any,
    params?: Record<string, any>,
    useCache = true,
  ): Promise<T> {
    if (!this.baseUrl || !this.username || !this.password) {
      throw new Error('ART API not configured. Set ART_API_URL, ART_API_USER, and ART_API_PASS environment variables.');
    }
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const cacheKey = `${method}:${url.toString()}:${body ? JSON.stringify(body) : ''}`;
    if (useCache && method === 'GET') {
      const cached = this.getCached<T>(cacheKey);
      if (cached) return cached;
    }

    const headers: Record<string, string> = {
      Authorization: this.getAuthHeader(),
      Accept: 'application/json',
    };
    if (body) headers['Content-Type'] = 'application/json';

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      if (response.status === 403 && text.toLowerCase().includes('stopped')) {
        throw new Error(`ART API is stopped/disabled on Azure. The web app at ${this.baseUrl} needs to be started from the Azure Portal. (HTTP 403 — Web App Stopped)`);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error(`ART API authentication failed (HTTP ${response.status}). Check ART_API_URL, ART_API_USER, and ART_API_PASS credentials. URL: ${this.baseUrl}`);
      }
      throw new Error(`ART API ${method} ${path} failed: ${response.status} ${response.statusText} — ${text.substring(0, 200)}`);
    }

    const data = (await response.json()) as T;
    if (useCache && method === 'GET') this.setCache(cacheKey, data);
    return data;
  }

  getStatus(): Promise<any> {
    return this.request('GET', '/api/platinum/status');
  }
  getGroups(): Promise<any> {
    return this.request('GET', '/api/platinum/groups');
  }
  getCatalog(): Promise<any> {
    return this.request('GET', '/api/platinum/catalog');
  }
  getTableSchema(table: string): Promise<any> {
    return this.request('GET', `/api/platinum/catalog/${encodeURIComponent(table)}`);
  }
  getFinYears(): Promise<any> {
    return this.request('GET', '/api/platinum/fin-years');
  }
  getSummary(finYear?: string): Promise<any> {
    return this.request('GET', '/api/platinum/summary', undefined, finYear ? { finYear } : undefined);
  }

  getTableData(group: string, table: string, options?: { top?: number; offset?: number; finYear?: string }): Promise<any> {
    return this.request('GET', `/api/platinum/data/${encodeURIComponent(group)}/${encodeURIComponent(table)}`, undefined, options);
  }

  query(options: {
    table: string;
    top?: number;
    offset?: number;
    columns?: string[];
    where?: Record<string, any>;
    orderBy?: string;
    finYear?: string;
  }): Promise<any> {
    const params: Record<string, any> = { table: options.table };
    if (options.top) params.top = options.top;
    if (options.offset) params.offset = options.offset;
    if (options.columns) params.columns = options.columns.join(',');
    if (options.orderBy) params.orderBy = options.orderBy;
    if (options.finYear) params.finYear = options.finYear;
    if (options.where) params.where = JSON.stringify(options.where);
    return this.request('GET', '/api/platinum/query', undefined, params);
  }

  async queryCount(table: string, where?: Record<string, any>): Promise<number> {
    const result = await this.query({ table, columns: ['COUNT(*) as cnt'], where, top: 1 });
    const rows = Array.isArray(result) ? result : result?.data || [];
    return rows.length > 0 ? Number(rows[0]?.cnt || 0) : 0;
  }

  executeSql(sql: string): Promise<any> {
    return this.request('POST', '/api/platinum/sql', { sql }, undefined, false);
  }

  async getVendor(vendorId: number | string): Promise<any> {
    const id = this.sanitizeNumericParam(vendorId);
    const [vendor, banking] = await Promise.all([
      this.executeSql(`SELECT TOP 1 * FROM Cons_Vendor WHERE Vendor_ID = ${id}`),
      this.executeSql(`SELECT * FROM Cons_VendorBankingDetails WHERE VendorID = ${id}`),
    ]);
    const vendorRows = Array.isArray(vendor) ? vendor : vendor?.data || [];
    const bankingRows = Array.isArray(banking) ? banking : banking?.data || [];
    return { vendor: vendorRows[0] || null, bankingDetails: bankingRows };
  }

  async getInvoice(invoiceId: number | string): Promise<any> {
    const id = this.sanitizeNumericParam(invoiceId);
    const [invoice, details, detailsFund] = await Promise.all([
      this.executeSql(`SELECT TOP 1 * FROM SCM_Invoice WHERE Invoice_ID = ${id}`),
      this.executeSql(`SELECT * FROM SCM_InvoiceDetail WHERE InvoiceID = ${id}`),
      this.executeSql(`SELECT * FROM SCM_InvoiceDetailsFund WHERE InvoiceID = ${id}`),
    ]);
    const invRows = Array.isArray(invoice) ? invoice : invoice?.data || [];
    const detRows = Array.isArray(details) ? details : details?.data || [];
    const fundRows = Array.isArray(detailsFund) ? detailsFund : detailsFund?.data || [];
    return { invoice: invRows[0] || null, details: detRows, fundAllocations: fundRows };
  }

  async getPaymentsByInvoice(invoiceId: number | string): Promise<any[]> {
    const id = this.sanitizeNumericParam(invoiceId);
    const result = await this.executeSql(
      `SELECT p.*, pa.AllocationAmount, pa.InvoiceID
       FROM SCM_Payment p
       INNER JOIN SCM_PaymentAllocation pa ON pa.PaymentID = p.Payment_ID
       WHERE pa.InvoiceID = ${id}
       ORDER BY p.DateCaptured DESC`,
    );
    return Array.isArray(result) ? result : result?.data || [];
  }

  async getDuplicatePaymentCandidates(finYear?: string): Promise<any[]> {
    const result = await this.executeSql(
      `SELECT pa.InvoiceID, COUNT(*) as PaymentCount,
              SUM(CAST(pa.AllocationAmount AS DECIMAL(18,2))) as TotalPaid,
              i.Calculated_Invoice_Amount as InvoiceAmount,
              i.VendorCreditorID as VendorID,
              i.DocNumber as DocumentNo
       FROM SCM_PaymentAllocation pa
       INNER JOIN SCM_Invoice i ON i.Invoice_ID = pa.InvoiceID
       ${finYear ? `WHERE i.FinancialYear = '${this.sanitizeSqlParam(finYear)}'` : ''}
       GROUP BY pa.InvoiceID, i.Calculated_Invoice_Amount, i.VendorCreditorID, i.DocNumber
       HAVING COUNT(*) > 1
       ORDER BY SUM(CAST(pa.AllocationAmount AS DECIMAL(18,2))) DESC`,
    );
    return Array.isArray(result) ? result : result?.data || [];
  }

  async getVendorBankingAnomalies(finYear?: string): Promise<any[]> {
    const result = await this.executeSql(
      `SELECT vb.BankAccountNumber as BankAccountNo,
              COUNT(DISTINCT vb.VendorID) as VendorCount,
              STRING_AGG(CAST(vb.VendorID AS NVARCHAR(20)), ',') as VendorIDs
       FROM Cons_VendorBankingDetails vb
       GROUP BY vb.BankAccountNumber
       HAVING COUNT(DISTINCT vb.VendorID) > 1
       ORDER BY COUNT(DISTINCT vb.VendorID) DESC`,
    );
    return Array.isArray(result) ? result : result?.data || [];
  }

  async getScmDocumentChain(documentNumber: string, finYear?: string): Promise<any> {
    const docEsc = this.sanitizeSqlParam(documentNumber);
    const fyFilter = finYear ? `AND FinYear = '${this.sanitizeSqlParam(finYear)}'` : '';

    const [invoices, payments, grns, requisitions, creditNotes, sundryPayments, cashbookEntries] =
      await Promise.all([
        this.executeSql(
          `SELECT i.*, id.Amount, id.VatAmount, id.ItemDescription as LineDescription
           FROM SCM_Invoice i
           LEFT JOIN SCM_InvoiceDetail id ON id.InvoiceID = i.Invoice_ID
           WHERE i.DocNumber = '${docEsc}' ${fyFilter.replace('FinYear', 'i.FinancialYear')}`,
        ),
        this.executeSql(
          `SELECT p.*, pa.AllocationAmount, pa.InvoiceID
           FROM SCM_Payment p
           LEFT JOIN SCM_PaymentAllocation pa ON pa.PaymentID = p.Payment_ID
           WHERE p.PaymentReferenceNumber = '${docEsc}'`,
        ),
        this.executeSql(
          `SELECT g.*, gd.Quantity, gd.Amount, gd.ServiceDescription as LineDescription
           FROM SCM_GRN g
           LEFT JOIN SCM_GRNDetails gd ON gd.GRNID = g.GRN_ID
           WHERE g.DeliveryNoteNumber = '${docEsc}' ${fyFilter.replace('FinYear', 'g.FinancialYear')}`,
        ),
        this.executeSql(
          `SELECT r.*, rd.ServiceDescription, rd.EstimatedCost as Amount, rd.Quantity
           FROM SCM_Requisition r
           LEFT JOIN SCM_RequisitionServiceDetails rd ON rd.RequisitionID = r.Requisition_ID
           WHERE r.RequisitionNumber = '${docEsc}' ${fyFilter.replace('FinYear', 'r.FinancialYear')}`,
        ),
        this.executeSql(
          `SELECT cn.*, cd.Amount, cd.ServiceDescription as LineDescription
           FROM SCM_InvoiceCreditDebtNote cn
           LEFT JOIN SCM_InvoiceCreditDetail cd ON cd.InvoiceCreditID = cn.ID
           WHERE cn.DocNumber = '${docEsc}' ${fyFilter.replace('FinYear', 'cn.FinancialYear')}`,
        ),
        this.executeSql(
          `SELECT sp.*, sd.ServiceDescription, sd.Amount
           FROM SCM_SundryPayment sp
           LEFT JOIN SCM_SundryPaymentServiceDetails sd ON sd.SundryPaymentID = sp.SundryPayment_ID
           WHERE sp.DocNumber = '${docEsc}'`,
        ),
        this.executeSql(
          `SELECT cb.*, cv.ItemDescription, cv.VoteAmount, cv.ReferenceNumber
           FROM Led_Cashbook cb
           LEFT JOIN Led_CashbookVote cv ON cv.CashbookTransactionID = cb.CashbookTransaction_ID
           WHERE cb.DocNumber = '${docEsc}' ${fyFilter.replace('FinYear', 'cb.FinYear')}`,
        ),
      ]);

    const extract = (r: any) => (Array.isArray(r) ? r : r?.data || []);
    const invoiceRows = extract(invoices);
    let vendorInfo = null;
    if (invoiceRows.length > 0 && invoiceRows[0].VendorCreditorID) {
      vendorInfo = await this.getVendor(invoiceRows[0].VendorCreditorID);
    }

    return {
      documentNumber,
      finYear: finYear || null,
      chain: {
        requisitions: extract(requisitions),
        grns: extract(grns),
        invoices: invoiceRows,
        creditNotes: extract(creditNotes),
        sundryPayments: extract(sundryPayments),
        payments: extract(payments),
        cashbookEntries: extract(cashbookEntries),
      },
      vendor: vendorInfo,
      summary: {
        hasRequisition: extract(requisitions).length > 0,
        hasGrn: extract(grns).length > 0,
        hasInvoice: invoiceRows.length > 0,
        hasPayment: extract(payments).length > 0,
        hasCreditNote: extract(creditNotes).length > 0,
        threeWayMatch:
          extract(requisitions).length > 0 && extract(grns).length > 0 && invoiceRows.length > 0,
      },
    };
  }

  async getAssetRegister(finYear?: string): Promise<any> {
    const [register, depreciation, acquisitions, disposals, annualValues, wipRegister] =
      await Promise.all([
        this.query({ table: 'Asset_Register', finYear, top: 5000 }),
        this.query({ table: 'Asset_Depreciation', finYear, top: 5000 }),
        this.query({ table: 'Asset_Acquisition', finYear, top: 5000 }),
        this.query({ table: 'Asset_Disposal', finYear, top: 5000 }),
        this.query({ table: 'Asset_AnnualValues', finYear, top: 5000 }),
        this.query({ table: 'Asset_WIP_Register', finYear, top: 5000 }),
      ]);
    const extract = (r: any) => (Array.isArray(r) ? r : r?.data || []);
    return {
      register: extract(register),
      depreciation: extract(depreciation),
      acquisitions: extract(acquisitions),
      disposals: extract(disposals),
      annualValues: extract(annualValues),
      wipRegister: extract(wipRegister),
    };
  }

  async getAssetSummary(_finYear?: string): Promise<any> {
    const result = await this.executeSql(
      `SELECT COUNT(*) as totalAssets,
              SUM(CAST(ar.Amount AS DECIMAL(18,2))) as totalAmount,
              COUNT(DISTINCT ar.AssetCategoryID) as categoryCount
       FROM Asset_Register ar WHERE ar.Enabled = 1`,
    );
    const rows = Array.isArray(result) ? result : result?.data || [];
    return rows[0] || { totalAssets: 0, totalAmount: 0, categoryCount: 0 };
  }

  async getPayrollTransactions(finYear?: string): Promise<any> {
    const [employees, transactions, salaryHeads] = await Promise.all([
      this.query({ table: 'Payroll_Employee', finYear, top: 5000 }),
      this.query({ table: 'Payroll_Transactions', finYear, top: 10000 }),
      this.query({ table: 'Payroll_SalaryHead', finYear, top: 500 }),
    ]);
    const extract = (r: any) => (Array.isArray(r) ? r : r?.data || []);
    return { employees: extract(employees), transactions: extract(transactions), salaryHeads: extract(salaryHeads) };
  }

  async getPayrollSummary(_finYear?: string): Promise<any> {
    const result = await this.executeSql(
      `SELECT COUNT(DISTINCT e.Employee_ID) as totalEmployees,
              SUM(CAST(t.DebitAmount AS DECIMAL(18,2))) as totalPayrollCost
       FROM Payroll_Employee e
       LEFT JOIN Payroll_Transactions t ON t.EmployeeId = e.Employee_ID
       WHERE e.Enabled = 1`,
    );
    const rows = Array.isArray(result) ? result : result?.data || [];
    return rows[0] || { totalEmployees: 0, totalPayrollCost: 0 };
  }

  async getBillingTransactions(finYear?: string): Promise<any> {
    const [accounts, transactions, ageing] = await Promise.all([
      this.query({ table: 'Billing_FinancialAccount', finYear, top: 5000 }),
      this.query({ table: 'Billing_AccountTransaction', finYear, top: 10000 }),
      this.query({ table: 'Billing_FinancialAccountAgeing', finYear, top: 5000 }),
    ]);
    const extract = (r: any) => (Array.isArray(r) ? r : r?.data || []);
    return { accounts: extract(accounts), transactions: extract(transactions), ageing: extract(ageing) };
  }

  async getBillingSummary(_finYear?: string): Promise<any> {
    const result = await this.executeSql(
      `SELECT COUNT(DISTINCT fa.FinancialAccount_ID) as totalAccounts,
              SUM(CAST(at2.Amount AS DECIMAL(18,2))) as totalBilled,
              SUM(CASE WHEN ag.Amount IS NOT NULL THEN CAST(ag.Amount AS DECIMAL(18,2)) ELSE 0 END) as totalOutstanding
       FROM Billing_FinancialAccount fa
       LEFT JOIN Billing_AccountTransaction at2 ON at2.FinancialAccountID = fa.FinancialAccount_ID
       LEFT JOIN Billing_FinancialAccountAgeing ag ON ag.FinancialAccountID = fa.FinancialAccount_ID`,
    );
    const rows = Array.isArray(result) ? result : result?.data || [];
    return rows[0] || { totalAccounts: 0, totalBilled: 0, totalOutstanding: 0 };
  }

  async getBillingAgeing(_finYear?: string): Promise<any> {
    try {
      const result = await this.executeSql(
        `SELECT TOP 5000 ag.FinancialAccountAgeing_ID, ag.FinancialAccountID,
                ag.PeriodID, ag.AgeingNumber, ag.Amount, ag.VatAmount, ag.InterestAmount
         FROM Billing_FinancialAccountAgeing ag ORDER BY ag.Amount DESC`,
      );
      const rows = Array.isArray(result) ? result : result?.data || [];
      const summary = {
        totalOutstanding: rows.reduce((s: number, r: any) => s + (parseFloat(r.Amount) || 0), 0),
        totalVat: rows.reduce((s: number, r: any) => s + (parseFloat(r.VatAmount) || 0), 0),
        totalInterest: rows.reduce((s: number, r: any) => s + (parseFloat(r.InterestAmount) || 0), 0),
        accountCount: new Set(rows.map((r: any) => r.FinancialAccountID)).size,
        records: rows.length,
      };
      return { ageing: rows, summary, status: 'ok' };
    } catch (err: any) {
      return {
        ageing: [],
        summary: { totalOutstanding: 0, totalVat: 0, totalInterest: 0, accountCount: 0, records: 0 },
        status: 'error',
        error: err?.message || 'Failed to query billing ageing',
      };
    }
  }

  async getBudgetSummary(finYear?: string): Promise<any> {
    const errors: string[] = [];
    const safeQuery = async (sql: string, label: string) => {
      try {
        const r = await this.executeSql(sql);
        const rows = Array.isArray(r) ? r : r?.data || [];
        return rows[0] || null;
      } catch (err: any) {
        errors.push(`${label}: ${err?.message || 'query failed'}`);
        return null;
      }
    };

    const [origResult, adjResult, projectResult] = await Promise.all([
      safeQuery(
        `SELECT COUNT(*) as lineItems FROM Led_VoteBudgetOriginal_Detail
         ${finYear ? `WHERE FinYear = '${this.sanitizeSqlParam(finYear)}'` : ''}`,
        'originalBudget',
      ),
      safeQuery(
        `SELECT COUNT(*) as lineItems FROM Led_VoteBudgetAdjustment_Detail
         ${finYear ? `WHERE FinYear = '${this.sanitizeSqlParam(finYear)}'` : ''}`,
        'adjustedBudget',
      ),
      safeQuery(
        `SELECT COUNT(*) as lineItems, SUM(CAST(ISNULL(BudgetAmount,0) AS DECIMAL(18,2))) as totalBudget
         FROM Plan_ProjectItem
         ${finYear ? `WHERE FinYear = '${this.sanitizeSqlParam(finYear)}'` : ''}`,
        'projectBudget',
      ),
    ]);
    return {
      originalBudget: origResult || { lineItems: 0 },
      adjustedBudget: adjResult || { lineItems: 0 },
      projectBudget: projectResult || { lineItems: 0, totalBudget: 0 },
      status: errors.length === 0 ? 'ok' : 'partial',
      ...(errors.length > 0 && { errors }),
    };
  }

  async getCashbookEntries(finYear?: string): Promise<any> {
    const [cashbook, cashbookVotes, bankRecon] = await Promise.all([
      this.query({ table: 'Led_Cashbook', finYear, top: 10000 }),
      this.query({ table: 'Led_CashbookVote', finYear, top: 10000 }),
      this.query({ table: 'Led_BankRecon', finYear, top: 1000 }),
    ]);
    const extract = (r: any) => (Array.isArray(r) ? r : r?.data || []);
    return { cashbook: extract(cashbook), cashbookVotes: extract(cashbookVotes), bankRecon: extract(bankRecon) };
  }

  async getCashbookSummary(finYear?: string): Promise<any> {
    const result = await this.executeSql(
      `SELECT COUNT(*) as totalEntries,
              SUM(CASE WHEN IsReversal = 1 THEN 1 ELSE 0 END) as reversals,
              SUM(CASE WHEN IsReversal = 1 AND (ReversalAuthorised IS NULL OR ReversalAuthorised = 0) THEN 1 ELSE 0 END) as unauthorisedReversals
       FROM Led_Cashbook
       ${finYear ? `WHERE FinYear = '${this.sanitizeSqlParam(finYear)}'` : ''}`,
    );
    const rows = Array.isArray(result) ? result : result?.data || [];
    return rows[0] || { totalEntries: 0, reversals: 0, unauthorisedReversals: 0 };
  }

  async getCashbookReversals(finYear?: string): Promise<any[]> {
    const result = await this.executeSql(
      `SELECT cb.CashbookTransaction_ID as Cashbook_ID, cb.DocNumber as DocumentNo,
              cb.DocTypeCode, cb.TransactionDate,
              cb.IsReversal, cb.ReversalAuthorised, cb.ReversalDate, cb.ReversalReason,
              cb.Vendor_CreditorID
       FROM Led_Cashbook cb
       WHERE cb.IsReversal = 1
       ${finYear ? `AND cb.FinYear = '${this.sanitizeSqlParam(finYear)}'` : ''}
       ORDER BY cb.TransactionDate DESC`,
    );
    return Array.isArray(result) ? result : result?.data || [];
  }

  async getBankReconData(finYear?: string): Promise<any> {
    const [recon, statements, reconciledItems] = await Promise.all([
      this.query({ table: 'Led_BankRecon', finYear, top: 1000 }),
      this.query({ table: 'Led_BankReconStatement', finYear, top: 5000 }),
      this.query({ table: 'Led_BankReconReconciledItems', finYear, top: 5000 }),
    ]);
    const extract = (r: any) => (Array.isArray(r) ? r : r?.data || []);
    return { reconciliations: extract(recon), statements: extract(statements), reconciledItems: extract(reconciledItems) };
  }

  async getInventoryData(finYear?: string): Promise<any> {
    const [inventory, commodities, stocktakes] = await Promise.all([
      this.query({ table: 'Inven_Inventory', finYear, top: 5000 }),
      this.query({ table: 'Inven_Commodity', finYear, top: 2000 }),
      this.query({ table: 'Inven_Stocktake', finYear, top: 1000 }),
    ]);
    const extract = (r: any) => (Array.isArray(r) ? r : r?.data || []);
    return { inventory: extract(inventory), commodities: extract(commodities), stocktakes: extract(stocktakes) };
  }

  async getBudgetDetail(finYear?: string): Promise<any> {
    const [originalBudget, adjustedBudget, projectItems, projectMonths] = await Promise.all([
      this.query({ table: 'Led_VoteBudgetOriginal_Detail', finYear, top: 10000 }),
      this.query({ table: 'Led_VoteBudgetAdjustment_Detail', finYear, top: 10000 }),
      this.query({ table: 'Plan_ProjectItem', finYear, top: 5000 }),
      this.query({ table: 'Plan_ProjectItemMonth', finYear, top: 10000 }),
    ]);
    const extract = (r: any) => (Array.isArray(r) ? r : r?.data || []);
    return {
      originalBudget: extract(originalBudget),
      adjustedBudget: extract(adjustedBudget),
      projectItems: extract(projectItems),
      projectMonthly: extract(projectMonths),
    };
  }

  async getVatReconData(finYear?: string): Promise<any> {
    const [vatRecon, vatReconControl, vatRates] = await Promise.all([
      this.query({ table: 'Led_VATRecon', finYear, top: 5000 }),
      this.query({ table: 'Led_VATReconControl', finYear, top: 1000 }),
      this.query({ table: 'Const_VatRate', top: 100 }),
    ]);
    const extract = (r: any) => (Array.isArray(r) ? r : r?.data || []);
    return { vatRecon: extract(vatRecon), vatReconControl: extract(vatReconControl), vatRates: extract(vatRates) };
  }

  async getVendorsByBankAccount(bankAccountNumber: string): Promise<any[]> {
    try {
      const result = await this.executeSql(
        `SELECT v.Vendor_ID, v.VendorName, v.EmailAddress, vb.BankAccountNumber, vb.VendorID
         FROM Cons_VendorBankingDetails vb
         INNER JOIN Cons_Vendor v ON v.Vendor_ID = vb.VendorID
         WHERE vb.BankAccountNumber = '${this.sanitizeSqlParam(bankAccountNumber)}'
         ORDER BY v.VendorName`,
      );
      return Array.isArray(result) ? result : result?.data || [];
    } catch {
      try {
        const fallback = await this.executeSql(
          `SELECT VendorID, BankAccountNumber FROM Cons_VendorBankingDetails
           WHERE BankAccountNumber = '${this.sanitizeSqlParam(bankAccountNumber)}'`,
        );
        return Array.isArray(fallback) ? fallback : fallback?.data || [];
      } catch {
        return [];
      }
    }
  }

  async getDuplicatePaymentDetails(invoiceId: number): Promise<any[]> {
    const id = this.sanitizeNumericParam(String(invoiceId));
    try {
      const baseResult = await this.executeSql(
        `SELECT pa.PaymentAllocation_ID, pa.InvoiceID, pa.AllocationAmount, pa.PaymentID,
                i.DocNumber, i.Calculated_Invoice_Amount, i.VendorCreditorID, v.VendorName
         FROM SCM_PaymentAllocation pa
         LEFT JOIN SCM_Invoice i ON i.Invoice_ID = pa.InvoiceID
         LEFT JOIN Cons_Vendor v ON v.Vendor_ID = i.VendorCreditorID
         WHERE pa.InvoiceID = ${id}
         ORDER BY pa.PaymentAllocation_ID`,
      );
      const rows = Array.isArray(baseResult) ? baseResult : baseResult?.data || [];
      if (rows.length > 0) return rows;
    } catch { /* fall through */ }

    try {
      const fallback = await this.executeSql(
        `SELECT PaymentAllocation_ID, InvoiceID, AllocationAmount, PaymentID
         FROM SCM_PaymentAllocation WHERE InvoiceID = ${id} ORDER BY PaymentAllocation_ID`,
      );
      return Array.isArray(fallback) ? fallback : fallback?.data || [];
    } catch {
      return [];
    }
  }

  async getScmVendorCount(_finYear?: string): Promise<number> {
    try {
      const result = await this.executeSql(`SELECT COUNT(DISTINCT Vendor_ID) as cnt FROM Cons_Vendor`);
      const rows = Array.isArray(result) ? result : result?.data || [];
      return Number(rows[0]?.cnt || 0);
    } catch { return 0; }
  }

  async getActiveEmployeeCount(_finYear?: string): Promise<number> {
    try {
      const result = await this.executeSql(
        `SELECT COUNT(DISTINCT Employee_ID) as cnt FROM Payroll_Employee WHERE Enabled = 1`,
      );
      const rows = Array.isArray(result) ? result : result?.data || [];
      return Number(rows[0]?.cnt || 0);
    } catch { return 0; }
  }

  async getAssetCount(_finYear?: string): Promise<number> {
    try {
      const result = await this.executeSql(
        `SELECT COUNT(*) as cnt FROM Asset_Register WHERE Enabled = 1`,
      );
      const rows = Array.isArray(result) ? result : result?.data || [];
      return Number(rows[0]?.cnt || 0);
    } catch { return 0; }
  }
}

// Exported so the ratios endpoint (ratios.ts) can reuse the same configured
// client + cache for EMS enrichment via the ART API.
export const art = new ArtApiClient();

export const artRouter = Router();

// Mirrors server/src/modules/platinum-art-api/platinum-art-api.controller.ts (@Controller('art'))
artRouter.get('/status', async (_req, res) => {
  try {
    const status = await art.getStatus();
    res.json({ connected: true, configured: art.isConfigured(), ...status });
  } catch (err: any) {
    res.json({ connected: false, configured: art.isConfigured(), error: err.message });
  }
});

artRouter.get('/groups', (_req, res, next) => art.getGroups().then((d) => res.json(d)).catch(next));
artRouter.get('/catalog', (_req, res, next) => art.getCatalog().then((d) => res.json(d)).catch(next));
artRouter.get('/catalog/:table', (req, res, next) =>
  art.getTableSchema(req.params.table).then((d) => res.json(d)).catch(next));
artRouter.get('/fin-years', (_req, res, next) => art.getFinYears().then((d) => res.json(d)).catch(next));
artRouter.get('/summary', (req, res, next) =>
  art.getSummary(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));

artRouter.get('/query', (req, res, next) => {
  const { table, top, offset, columns, orderBy, finYear } = req.query as Record<string, string>;
  art
    .query({
      table,
      top: top ? parseInt(top) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      columns: columns ? columns.split(',') : undefined,
      orderBy,
      finYear,
    })
    .then((d) => res.json(d))
    .catch(next);
});

artRouter.get('/scm/document-chain', (req, res, next) => {
  const documentNumber = req.query.documentNumber as string;
  if (!documentNumber) return res.status(400).json({ error: 'documentNumber query parameter is required' });
  art.getScmDocumentChain(documentNumber, req.query.finYear as string | undefined)
    .then((d) => res.json(d))
    .catch(next);
});

artRouter.get('/scm/vendor/:id', (req, res, next) =>
  art.getVendor(req.params.id).then((d) => res.json(d)).catch(next));
artRouter.get('/scm/invoice/:id', (req, res, next) =>
  art.getInvoice(req.params.id).then((d) => res.json(d)).catch(next));

artRouter.get('/scm/payments', (req, res, next) => {
  const invoiceId = req.query.invoiceId as string;
  if (!invoiceId) return res.status(400).json({ error: 'invoiceId query parameter is required' });
  art.getPaymentsByInvoice(invoiceId).then((d) => res.json(d)).catch(next);
});

artRouter.get('/scm/duplicate-payments', (req, res, next) =>
  art.getDuplicatePaymentCandidates(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));
artRouter.get('/scm/vendor-banking-anomalies', (req, res, next) =>
  art.getVendorBankingAnomalies(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));

artRouter.get('/scm/vendors-by-bank-account', (req, res, next) => {
  const bankAccount = req.query.bankAccount as string;
  if (!bankAccount) return res.status(400).json({ error: 'bankAccount query parameter is required' });
  art.getVendorsByBankAccount(bankAccount).then((d) => res.json(d)).catch(next);
});

artRouter.get('/scm/duplicate-payment-details', (req, res, next) => {
  const invoiceId = req.query.invoiceId as string;
  if (!invoiceId) return res.status(400).json({ error: 'invoiceId query parameter is required' });
  const id = parseInt(invoiceId);
  if (isNaN(id)) return res.status(400).json({ error: 'invoiceId must be a number' });
  art.getDuplicatePaymentDetails(id).then((d) => res.json(d)).catch(next);
});

artRouter.get('/assets/register', (req, res, next) =>
  art.getAssetRegister(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));
artRouter.get('/assets/summary', (req, res, next) =>
  art.getAssetSummary(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));

artRouter.get('/payroll/transactions', (req, res, next) =>
  art.getPayrollTransactions(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));
artRouter.get('/payroll/summary', (req, res, next) =>
  art.getPayrollSummary(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));

artRouter.get('/billing/transactions', (req, res, next) =>
  art.getBillingTransactions(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));
artRouter.get('/billing/summary', (req, res, next) =>
  art.getBillingSummary(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));
artRouter.get('/billing/ageing', (req, res, next) =>
  art.getBillingAgeing(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));

artRouter.get('/cashbook/entries', (req, res, next) =>
  art.getCashbookEntries(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));
artRouter.get('/cashbook/summary', (req, res, next) =>
  art.getCashbookSummary(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));
artRouter.get('/cashbook/reversals', (req, res, next) =>
  art.getCashbookReversals(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));

artRouter.get('/bank-recon', (req, res, next) =>
  art.getBankReconData(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));
artRouter.get('/budget/summary', (req, res, next) =>
  art.getBudgetSummary(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));
artRouter.get('/budget/detail', (req, res, next) =>
  art.getBudgetDetail(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));
artRouter.get('/inventory', (req, res, next) =>
  art.getInventoryData(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));
artRouter.get('/vat/recon', (req, res, next) =>
  art.getVatReconData(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));
