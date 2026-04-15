using Dapper;
using AssetManagement.Data;
using System.Data.Common;
using System.Net.Http.Json;
using Npgsql;
using NpgsqlTypes;
using Microsoft.Extensions.Configuration;

namespace AssetManagement.Services;

public class TransactionService
{
    private readonly DbConnectionFactory _db;
    private readonly IHttpClientFactory _httpClientFactory;

    public TransactionService(DbConnectionFactory db, IHttpClientFactory httpClientFactory, IConfiguration config)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
    }

    private async Task<bool> IsGlOutboxToggedToSqlServerAsync()
    {
        try
        {
            await using var conn = _db.CreateConnection();
            await conn.OpenAsync();
            var backend = await conn.QueryFirstOrDefaultAsync<string>(@"
                SELECT backend FROM ""Sys_TableBackend"" WHERE table_key = 'gl-outbox' LIMIT 1");
            return string.Equals(backend, "sqlserver", StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    public async Task SyncGlOutboxToSqlServerIfNeededAsync(params Guid[] outboxIds)
    {
        if (!await IsGlOutboxToggedToSqlServerAsync() || outboxIds.Length == 0) return;
        var client = _httpClientFactory.CreateClient("mssql-api");
        foreach (var outboxId in outboxIds)
        {
            try
            {
                await using var conn = _db.CreateConnection();
                await conn.OpenAsync();

                var header = await conn.QueryFirstOrDefaultAsync<dynamic>(
                    @"SELECT * FROM ""GL_Outbox"" WHERE ""OutboxId"" = @id", new { id = outboxId });
                if (header == null) continue;

                var lines = (await conn.QueryAsync<dynamic>(
                    @"SELECT * FROM ""GL_Outbox_Lines"" WHERE ""OutboxId"" = @id ORDER BY ""LineId""",
                    new { id = outboxId })).ToList();

                var headerPayload = new
                {
                    OutboxId = (Guid)header.OutboxId,
                    SubmoduleId = (int)header.SubmoduleId,
                    EventType = (string)header.EventType,
                    DocumentNumber = (string)header.DocumentNumber,
                    IsCashflow = (bool)header.IsCashflow,
                    Status = (string)header.Status
                };

                var headerResp = await client.PostAsJsonAsync("/api/gl-outbox", headerPayload);
                if (!headerResp.IsSuccessStatusCode)
                {
                    Console.Error.WriteLine($"[GL_OUTBOX SYNC] Header POST failed for {outboxId}: {headerResp.StatusCode}");
                    continue;
                }

                foreach (var line in lines)
                {
                    var linePayload = new
                    {
                        OutboxId = outboxId,
                        ProcessingMonth = (int)line.ProcessingMonth,
                        FinYear = (string)line.FinYear,
                        TransactionDetails = (string?)line.TransactionDetails,
                        SourceModuleId = (int)line.SourceModuleId,
                        Debit = (decimal)line.Debit,
                        Credit = (decimal)line.Credit,
                        CapturerId = (int)line.CapturerId,
                        PlanProjectItemID = (int)line.PlanProjectItemID,
                        VATRate = (decimal?)line.VATRate,
                        VATRateID = (int)line.VATRateID
                    };
                    var lineResp = await client.PostAsJsonAsync("/api/gl-outbox-lines", linePayload);
                    if (!lineResp.IsSuccessStatusCode)
                    {
                        Console.Error.WriteLine($"[GL_OUTBOX SYNC] Line POST failed for outbox {outboxId}: {lineResp.StatusCode}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[GL_OUTBOX SYNC] Exception for outbox {outboxId}: {ex.Message}");
            }
        }
    }

    public (string year, int period) GetCurrentFinancialPeriod()
    {
        var now = DateTime.Now;
        int month = now.Month;
        int year = now.Year;
        int fyStart = month >= 7 ? year : year - 1;
        int period = month >= 7 ? month - 6 : month + 6;
        return ($"{fyStart}/{fyStart + 1}", period);
    }

    public (string year, int period) GetFinancialPeriodForDate(DateTime date)
    {
        int month = date.Month;
        int year = date.Year;
        int fyStart = month >= 7 ? year : year - 1;
        int period = month >= 7 ? month - 6 : month + 6;
        return ($"{fyStart}/{fyStart + 1}", period);
    }

    public async Task<int> GetProcessingMonth(int userId = 1)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        return await GetProcessingMonth(conn, userId, null);
    }

    public async Task<int> GetProcessingMonth(DbConnection conn, int userId = 1, DbTransaction? txn = null)
    {
        var userMonth = await conn.QueryFirstOrDefaultAsync<int?>(
            @"SELECT ""ProcessingMonth"" FROM ""User_UserProcessingMonth""
              WHERE ""UserID"" = @userId
              ORDER BY ""UserProcessingMonth_ID"" DESC OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY",
            new { userId }, txn);

        if (userMonth.HasValue)
            return userMonth.Value;

        var configMonth = await conn.QueryFirstOrDefaultAsync<int?>(
            @"SELECT ""current_period"" FROM ""Asset_OrganisationSettings"" ORDER BY ""id"" OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY",
            transaction: txn);

        return configMonth ?? 1;
    }

    public async Task<(DateTime cutoffDate, int nextPeriod, string nextFinancialYear)> GetNextRunCutoffDateAsync(DbConnection conn)
    {
        // Always derive from Asset_MonthlyApproval — never from Asset_OrganisationSettings.current_period
        var last = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""Financial_Year"" AS ""FinancialYear"", ""Financial_Period"" AS ""FinancialPeriod""
              FROM ""Asset_MonthlyApproval""
              WHERE ""IsApproved"" = TRUE
              ORDER BY ""Financial_Year"" DESC, ""Financial_Period"" DESC
              LIMIT 1");

        string nextFy;
        int nextPeriod;

        if (last != null)
        {
            int lastPeriod = (int)last.FinancialPeriod;
            string lastFy = (string)last.FinancialYear;
            nextPeriod = lastPeriod + 1;
            if (nextPeriod > 12)
            {
                nextPeriod = 1;
                // Increment FY string e.g. "2024/2025" → "2025/2026"
                var parts = lastFy.Split('/');
                int startYear = int.TryParse(parts[0], out var sy) ? sy : DateTime.Now.Year;
                nextFy = $"{startYear + 1}/{startYear + 2}";
            }
            else
            {
                nextFy = lastFy;
            }
        }
        else
        {
            // True first-time fallback: read financial_year from settings
            var settingsFy = await conn.QueryFirstOrDefaultAsync<string>(
                @"SELECT ""financial_year"" FROM ""Asset_OrganisationSettings"" LIMIT 1");
            nextFy = settingsFy ?? $"{DateTime.Now.Year - 1}/{DateTime.Now.Year}";
            nextPeriod = 1;
        }

        // Convert period to calendar month (FY starts July = month 7)
        int month = ((6 + nextPeriod - 1) % 12) + 1;

        // Parse FY start year (first part of "YYYY/YYYY+1")
        var fyParts = nextFy.Split('/');
        int fyStartYear = int.TryParse(fyParts[0], out var parsedStart) ? parsedStart : DateTime.Now.Year;

        int calYear = month >= 7 ? fyStartYear : fyStartYear + 1;
        int daysInMonth = DateTime.DaysInMonth(calYear, month);
        var cutoffDate = new DateTime(calYear, month, daysInMonth, 23, 59, 59);

        return (cutoffDate, nextPeriod, nextFy);
    }

    public async Task<string> GenerateDocumentNumber(DbConnection conn, int documentTypeId, DbTransaction? txn = null)
    {
        var maxDoc = await conn.QueryFirstOrDefaultAsync<int?>(
            @"SELECT MAX(""intDocNumber"") FROM ""Led_Journal_Asset"" WHERE ""AssetJournalTransactionTypeID"" = (
                SELECT ""AssetJournalTransactionType_ID"" FROM ""Const_AssetJournalTransactionType_Sys"" WHERE ""Const_DocumentTypeID"" = @documentTypeId OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY
            )", new { documentTypeId }, txn);
        int nextDoc = (maxDoc ?? 0) + 1;
        return $"{documentTypeId}/{nextDoc:D6}";
    }

    public async Task RecordTransaction(int assetRegisterItemId, int transactionTypeId, decimal amount, string? description, string? finYear = null)
    {
        var fy = GetCurrentFinancialPeriod();
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(@"
            INSERT INTO ""Asset_Register_Transactions""
                (""AssetRegisterItem_ID"", ""TransactionTypeID"", ""TransactionDate"",
                 ""PurchaseAmount"", ""FinancialYear"", ""DateModified"", ""Modifier"")
            VALUES (@assetRegisterItemId, @transactionTypeId, NOW(),
                    @amount, @finYear, NOW(), 0)",
            new { assetRegisterItemId, transactionTypeId, amount, finYear = finYear ?? fy.year });
    }

    public async Task<MscoaLookupResult?> LookupMscoaConfig(DbConnection conn, int assetRegisterItemId, string transactionTypeName, string finYear, DbTransaction? txn = null)
    {
        var result = await conn.QueryFirstOrDefaultAsync<MscoaLookupResult>(@"
            SELECT
                mst.""Project11"" AS ""DebitProjectId"",
                mst.""Project14"" AS ""CreditProjectId"",
                mst.""DebitItem11_1"" AS ""DebitItemId"",
                mst.""CreditItem11_1"" AS ""CreditItemId"",
                ppid.""SCOAFundId"" AS ""DebitScoaFundId"",
                ppid.""SCOARegionId"" AS ""DebitScoaRegionId"",
                ppid.""SCOACostingID"" AS ""DebitScoaCostingId"",
                ppid.""SCOAFunctionId"" AS ""DebitScoaFunctionId"",
                ppid.""SCOAItemID"" AS ""DebitScoaItemId"",
                ppid.""DivisionId"" AS ""DebitDivisionId"",
                ppid.""ProjectID"" AS ""DebitPlanProjectId"",
                ppid.""PlanProjectItem_ID"" AS ""DebitPlanProjectItemId"",
                ppic.""SCOAFundId"" AS ""CreditScoaFundId"",
                ppic.""SCOARegionId"" AS ""CreditScoaRegionId"",
                ppic.""SCOACostingID"" AS ""CreditScoaCostingId"",
                ppic.""SCOAFunctionId"" AS ""CreditScoaFunctionId"",
                ppic.""SCOAItemID"" AS ""CreditScoaItemId"",
                ppic.""DivisionId"" AS ""CreditDivisionId"",
                ppic.""ProjectID"" AS ""CreditPlanProjectId"",
                ppic.""PlanProjectItem_ID"" AS ""CreditPlanProjectItemId"",
                lvd.""Vote_ID"" AS ""DebitVoteId"",
                lvc.""Vote_ID"" AS ""CreditVoteId"",
                ppio.""SCOAFundId"" AS ""OffsetScoaFundId"",
                ppio.""SCOARegionId"" AS ""OffsetScoaRegionId"",
                ppio.""SCOACostingID"" AS ""OffsetScoaCostingId"",
                ppio.""SCOAFunctionId"" AS ""OffsetScoaFunctionId"",
                ppio.""SCOAItemID"" AS ""OffsetScoaItemId"",
                ppio.""DivisionId"" AS ""OffsetDivisionId"",
                ppio.""ProjectID"" AS ""OffsetPlanProjectId"",
                ppio.""PlanProjectItem_ID"" AS ""OffsetPlanProjectItemId"",
                lvo.""Vote_ID"" AS ""OffsetVoteId"",
                ppir.""SCOAFundId"" AS ""ReserveScoaFundId"",
                ppir.""SCOARegionId"" AS ""ReserveScoaRegionId"",
                ppir.""SCOACostingID"" AS ""ReserveScoaCostingId"",
                ppir.""SCOAFunctionId"" AS ""ReserveScoaFunctionId"",
                ppir.""SCOAItemID"" AS ""ReserveScoaItemId"",
                ppir.""DivisionId"" AS ""ReserveDivisionId"",
                ppir.""ProjectID"" AS ""ReservePlanProjectId"",
                ppir.""PlanProjectItem_ID"" AS ""ReservePlanProjectItemId"",
                lvr.""Vote_ID"" AS ""ReserveVoteId""
            FROM ""Asset_Register_Items"" i
            INNER JOIN ""AssetConfig_mSCOA"" msc
                ON COALESCE(i.""MeasurementType_ID"", 0) = COALESCE(msc.""MeasurementTypeID"", 0)
                AND COALESCE(i.""AssetType_ID"", 0) = COALESCE(msc.""TypeID"", 0)
                AND COALESCE(i.""AssetCategory_ID"", 0) = COALESCE(msc.""CategoryID"", 0)
                AND COALESCE(i.""Asset_SubCategory_ID"", 0) = COALESCE(msc.""SubCategoryID"", 0)
                AND msc.""DepartmentID"" IS NOT NULL AND COALESCE(CAST(NULLIF(i.""MunicipalDepartment_ID"", '') AS INTEGER), 0) = msc.""DepartmentID""
                AND msc.""DivisionID"" IS NOT NULL AND COALESCE(i.""DivisionID"", 0) = msc.""DivisionID""
                AND msc.""FinYear"" = @finYear
            INNER JOIN ""AssetConfig_mSCOA_TransactionType"" mst
                ON msc.""AssetConfig_mSCOA_ID"" = mst.""AssetConfig_mSCOA_ID""
                AND mst.""TransactionTypeID"" = (SELECT ""AssetConfig_TransactionType_ID"" FROM ""AssetConfig_TransactionType"" WHERE ""Name"" = @transactionTypeName OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY)
            LEFT JOIN ""Plan_ProjectItem"" ppid ON ppid.""PlanProjectItem_ID"" = mst.""DebitItem11_1""
            LEFT JOIN ""Led_Vote"" lvd ON lvd.""SCOAItemID"" = ppid.""SCOAItemID"" AND lvd.""FinYear"" = @finYear
            LEFT JOIN ""Plan_ProjectItem"" ppic ON ppic.""PlanProjectItem_ID"" = CAST(mst.""CreditItem11_1"" AS INTEGER)
            LEFT JOIN ""Led_Vote"" lvc ON lvc.""SCOAItemID"" = ppic.""SCOAItemID"" AND lvc.""FinYear"" = @finYear
            LEFT JOIN ""Plan_ProjectItem"" ppio ON ppio.""PlanProjectItem_ID"" = mst.""DebitItem12_1""
                AND ppio.""ProjectID"" = mst.""Project12"" AND ppio.""FinYear"" = @finYear
            LEFT JOIN ""Led_Vote"" lvo ON lvo.""SCOAItemID"" = ppio.""SCOAItemID"" AND lvo.""FinYear"" = @finYear
            LEFT JOIN ""Plan_ProjectItem"" ppir ON ppir.""PlanProjectItem_ID"" = mst.""CreditItem13_1""
                AND ppir.""ProjectID"" = mst.""Project13"" AND ppir.""FinYear"" = @finYear
            LEFT JOIN ""Led_Vote"" lvr ON lvr.""SCOAItemID"" = ppir.""SCOAItemID"" AND lvr.""FinYear"" = @finYear
            WHERE i.""AssetRegisterItem_ID"" = @assetRegisterItemId
            OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY",
            new { assetRegisterItemId, transactionTypeName, finYear }, txn);

        return result;
    }

    public async Task<MscoaLookupResult?> LookupMscoaConfigByClassification(DbConnection conn, int typeId, int categoryId, int subCategoryId, int measurementTypeId, string transactionTypeName, string finYear, DbTransaction? txn = null, int departmentId = 0, int divisionId = 0)
    {
        var result = await conn.QueryFirstOrDefaultAsync<MscoaLookupResult>(@"
            SELECT
                mst.""Project11"" AS ""DebitProjectId"",
                mst.""Project14"" AS ""CreditProjectId"",
                mst.""DebitItem11_1"" AS ""DebitItemId"",
                mst.""CreditItem11_1"" AS ""CreditItemId"",
                ppid.""SCOAFundId"" AS ""DebitScoaFundId"",
                ppid.""SCOARegionId"" AS ""DebitScoaRegionId"",
                ppid.""SCOACostingID"" AS ""DebitScoaCostingId"",
                ppid.""SCOAFunctionId"" AS ""DebitScoaFunctionId"",
                ppid.""SCOAItemID"" AS ""DebitScoaItemId"",
                ppid.""DivisionId"" AS ""DebitDivisionId"",
                ppid.""ProjectID"" AS ""DebitPlanProjectId"",
                ppid.""PlanProjectItem_ID"" AS ""DebitPlanProjectItemId"",
                ppic.""SCOAFundId"" AS ""CreditScoaFundId"",
                ppic.""SCOARegionId"" AS ""CreditScoaRegionId"",
                ppic.""SCOACostingID"" AS ""CreditScoaCostingId"",
                ppic.""SCOAFunctionId"" AS ""CreditScoaFunctionId"",
                ppic.""SCOAItemID"" AS ""CreditScoaItemId"",
                ppic.""DivisionId"" AS ""CreditDivisionId"",
                ppic.""ProjectID"" AS ""CreditPlanProjectId"",
                ppic.""PlanProjectItem_ID"" AS ""CreditPlanProjectItemId"",
                lvd.""Vote_ID"" AS ""DebitVoteId"",
                lvc.""Vote_ID"" AS ""CreditVoteId"",
                ppio.""SCOAFundId"" AS ""OffsetScoaFundId"",
                ppio.""SCOARegionId"" AS ""OffsetScoaRegionId"",
                ppio.""SCOACostingID"" AS ""OffsetScoaCostingId"",
                ppio.""SCOAFunctionId"" AS ""OffsetScoaFunctionId"",
                ppio.""SCOAItemID"" AS ""OffsetScoaItemId"",
                ppio.""DivisionId"" AS ""OffsetDivisionId"",
                ppio.""ProjectID"" AS ""OffsetPlanProjectId"",
                ppio.""PlanProjectItem_ID"" AS ""OffsetPlanProjectItemId"",
                lvo.""Vote_ID"" AS ""OffsetVoteId"",
                ppir.""SCOAFundId"" AS ""ReserveScoaFundId"",
                ppir.""SCOARegionId"" AS ""ReserveScoaRegionId"",
                ppir.""SCOACostingID"" AS ""ReserveScoaCostingId"",
                ppir.""SCOAFunctionId"" AS ""ReserveScoaFunctionId"",
                ppir.""SCOAItemID"" AS ""ReserveScoaItemId"",
                ppir.""DivisionId"" AS ""ReserveDivisionId"",
                ppir.""ProjectID"" AS ""ReservePlanProjectId"",
                ppir.""PlanProjectItem_ID"" AS ""ReservePlanProjectItemId"",
                lvr.""Vote_ID"" AS ""ReserveVoteId""
            FROM ""AssetConfig_mSCOA"" msc
            INNER JOIN ""AssetConfig_mSCOA_TransactionType"" mst
                ON msc.""AssetConfig_mSCOA_ID"" = mst.""AssetConfig_mSCOA_ID""
                AND mst.""TransactionTypeID"" = (SELECT ""AssetConfig_TransactionType_ID"" FROM ""AssetConfig_TransactionType"" WHERE ""Name"" = @transactionTypeName OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY)
            LEFT JOIN ""Plan_ProjectItem"" ppid ON ppid.""PlanProjectItem_ID"" = mst.""DebitItem11_1""
            LEFT JOIN ""Led_Vote"" lvd ON lvd.""SCOAItemID"" = ppid.""SCOAItemID"" AND lvd.""FinYear"" = @finYear
            LEFT JOIN ""Plan_ProjectItem"" ppic ON ppic.""PlanProjectItem_ID"" = CAST(mst.""CreditItem11_1"" AS INTEGER)
            LEFT JOIN ""Led_Vote"" lvc ON lvc.""SCOAItemID"" = ppic.""SCOAItemID"" AND lvc.""FinYear"" = @finYear
            LEFT JOIN ""Plan_ProjectItem"" ppio ON ppio.""PlanProjectItem_ID"" = mst.""DebitItem12_1""
                AND ppio.""ProjectID"" = mst.""Project12"" AND ppio.""FinYear"" = @finYear
            LEFT JOIN ""Led_Vote"" lvo ON lvo.""SCOAItemID"" = ppio.""SCOAItemID"" AND lvo.""FinYear"" = @finYear
            LEFT JOIN ""Plan_ProjectItem"" ppir ON ppir.""PlanProjectItem_ID"" = mst.""CreditItem13_1""
                AND ppir.""ProjectID"" = mst.""Project13"" AND ppir.""FinYear"" = @finYear
            LEFT JOIN ""Led_Vote"" lvr ON lvr.""SCOAItemID"" = ppir.""SCOAItemID"" AND lvr.""FinYear"" = @finYear
            WHERE COALESCE(msc.""MeasurementTypeID"", 0) = @measurementTypeId
                AND COALESCE(msc.""TypeID"", 0) = @typeId
                AND COALESCE(msc.""CategoryID"", 0) = @categoryId
                AND COALESCE(msc.""SubCategoryID"", 0) = @subCategoryId
                AND msc.""DepartmentID"" IS NOT NULL AND msc.""DepartmentID"" = @departmentId
                AND msc.""DivisionID"" IS NOT NULL AND msc.""DivisionID"" = @divisionId
                AND msc.""FinYear"" = @finYear
            OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY",
            new { typeId, categoryId, subCategoryId, measurementTypeId, transactionTypeName, finYear, departmentId, divisionId }, txn);

        return result;
    }

    public List<string> ValidateMscoaConfig(MscoaLookupResult? config, string transactionTypeName, int assetRegId)
    {
        var errors = new List<string>();
        if (config == null)
        {
            errors.Add($"No mSCOA configuration found for asset {assetRegId} and transaction type '{transactionTypeName}'. Please configure the mSCOA mapping under Administration > mSCOA Configuration.");
            return errors;
        }
        if (!config.DebitPlanProjectItemId.HasValue)
        {
            errors.Add($"Plan_ProjectItem record not found for debit item (DebitItem11_1 = {config.DebitItemId}). The Plan_ProjectItem table is missing the required row for this mSCOA mapping.");
        }
        if (!config.CreditPlanProjectItemId.HasValue)
        {
            errors.Add($"Plan_ProjectItem record not found for credit item (CreditItem11_1 = {config.CreditItemId}). The Plan_ProjectItem table is missing the required row for this mSCOA mapping.");
        }
        if (!config.DebitVoteId.HasValue)
        {
            errors.Add($"Led_Vote record not found for debit SCOAItemID = {config.DebitScoaItemId}. The Led_Vote table is missing the required vote for this financial year.");
        }
        if (!config.CreditVoteId.HasValue)
        {
            errors.Add($"Led_Vote record not found for credit SCOAItemID = {config.CreditScoaItemId}. The Led_Vote table is missing the required vote for this financial year.");
        }
        return errors;
    }

    public GlValidationResult ValidateGlPosting(MscoaLookupResult? config, string transactionTypeName, int assetRegId, bool checkOffsetReserve)
    {
        var result = new GlValidationResult { AssetRegisterItemId = assetRegId, TransactionType = transactionTypeName };

        if (config == null)
        {
            result.Legs.Add(new GlLegValidation
            {
                Leg = "Configuration",
                Valid = false,
                MissingFields = new List<string> { "No mSCOA configuration found for this asset and transaction type. Configure under Administration > mSCOA Configuration." }
            });
            return result;
        }

        ValidateLeg(result, "Debit", "DebitItem11_1 / Project11", config.DebitVoteId, config.DebitPlanProjectItemId,
            config.DebitScoaFundId, config.DebitScoaRegionId, config.DebitScoaCostingId,
            config.DebitScoaFunctionId, config.DebitScoaItemId, config.DebitDivisionId,
            config.DebitPlanProjectId, true);

        ValidateLeg(result, "Credit", "CreditItem11_1 / Project14", config.CreditVoteId, config.CreditPlanProjectItemId,
            config.CreditScoaFundId, config.CreditScoaRegionId, config.CreditScoaCostingId,
            config.CreditScoaFunctionId, config.CreditScoaItemId, config.CreditDivisionId,
            config.CreditPlanProjectId, true);

        if (checkOffsetReserve)
        {
            ValidateLeg(result, "Offset (Depreciation Reserve Transfer)", "DebitItem12_1 / Project12", config.OffsetVoteId, config.OffsetPlanProjectItemId,
                config.OffsetScoaFundId, config.OffsetScoaRegionId, config.OffsetScoaCostingId,
                config.OffsetScoaFunctionId, config.OffsetScoaItemId, config.OffsetDivisionId,
                config.OffsetPlanProjectId, true);

            ValidateLeg(result, "Reserve (Revaluation Reserve)", "CreditItem13_1 / Project13", config.ReserveVoteId, config.ReservePlanProjectItemId,
                config.ReserveScoaFundId, config.ReserveScoaRegionId, config.ReserveScoaCostingId,
                config.ReserveScoaFunctionId, config.ReserveScoaItemId, config.ReserveDivisionId,
                config.ReservePlanProjectId, true);
        }

        return result;
    }

    private void ValidateLeg(GlValidationResult result, string legName, string scoaField, int? voteId, int? planProjectItemId,
        int? scoaFundId, int? scoaRegionId, int? scoaCostingId, int? scoaFunctionId, int? scoaItemId,
        int? divisionId, int? projectId, bool required)
    {
        var leg = new GlLegValidation { Leg = legName, ScoaField = scoaField };
        var missing = new List<string>();

        if (!voteId.HasValue) missing.Add("Vote (Led_Vote)");
        if (!planProjectItemId.HasValue) missing.Add("Plan Project Item (Plan_ProjectItem)");
        if (!scoaItemId.HasValue) missing.Add("SCOA Item");
        if (!scoaFundId.HasValue) missing.Add("SCOA Fund");
        if (!scoaFunctionId.HasValue) missing.Add("SCOA Function");
        if (!scoaRegionId.HasValue) missing.Add("SCOA Region");
        if (!scoaCostingId.HasValue) missing.Add("SCOA Costing");
        if (!divisionId.HasValue) missing.Add("Division");
        if (!projectId.HasValue) missing.Add("Project");

        leg.MissingFields = missing;
        leg.Valid = missing.Count == 0;
        result.Legs.Add(leg);
    }

    public async Task<int> InsertJournalAsset(DbConnection conn, DbTransaction txn,
        string finYear, int processingMonth, Guid transactionId, int journalTransactionTypeId,
        DateTime transactionDate, int? debitVoteId, int? creditVoteId, decimal amount,
        string? documentNumber, int? intDocNumber, int? assetRegisterItemId,
        int? scoaFundsId = null, int? scoaRegionId = null, int? scoaCostingId = null,
        int? scoaProjectId = null, int? scoaFunctionId = null, int? scoaItemId = null,
        int? divisionId = null, string? itemDescription = null,
        int? depScheduleId = null, int? depScheduleItemId = null, DateTime? depScheduledDate = null,
        string? depRunType = null)
    {
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Led_Journal_Asset"" (
                ""FinYear"", ""ProcessingMonth"", ""TransactionID"", ""AssetJournalTransactionTypeID"",
                ""TransactionDate"", ""DebitVoteID"", ""CreditVoteID"", ""Amount"", ""DocumentNumber"",
                ""DateCaptured"", ""CapturerID"", ""intDocNumber"", ""Asset_RegisterItem_ID"",
                ""SCOAFundsID"", ""SCOARegionID"", ""SCOACostingID"", ""SCOAProjectID"", ""SCOAFunctionID"", ""SCOAItemID"",
                ""DivisionID"", ""ItemDescription"",
                ""Deprecation_ScheduleID"", ""Deprecation_ScheduleItemID"", ""Deprecation_ScheduledDate"",
                ""Depreciation_RunType""
            ) VALUES (
                @finYear, @processingMonth, @transactionId, @journalTransactionTypeId,
                @transactionDate, @debitVoteId, @creditVoteId, @amount, @documentNumber,
                NOW(), 1, @intDocNumber, @assetRegisterItemId,
                @scoaFundsId, @scoaRegionId, @scoaCostingId, @scoaProjectId, @scoaFunctionId, @scoaItemId,
                @divisionId, @itemDescription,
                @depScheduleId, @depScheduleItemId, @depScheduledDate,
                @depRunType
            ) RETURNING ""AssetJournal_ID""",
            new
            {
                finYear, processingMonth, transactionId, journalTransactionTypeId,
                transactionDate, debitVoteId, creditVoteId, amount, documentNumber,
                intDocNumber, assetRegisterItemId,
                scoaFundsId, scoaRegionId, scoaCostingId, scoaProjectId, scoaFunctionId, scoaItemId,
                divisionId, itemDescription,
                depScheduleId, depScheduleItemId, depScheduledDate,
                depRunType
            }, txn);
        return id;
    }

    public async Task<Guid> CreateGlOutboxHeaderAsync(DbConnection conn, DbTransaction txn,
        string eventType, string? documentNumber = null,
        bool isCashflow = false)
    {
        return await conn.QuerySingleAsync<Guid>(@"
            INSERT INTO ""GL_Outbox"" (
                ""SubmoduleId"", ""EventType"", ""DocumentNumber"", ""IsCashflow"", ""Status""
            ) VALUES (
                8, @eventType, @documentNumber, @isCashflow, 'PENDING'
            ) RETURNING ""OutboxId""",
            new { eventType, documentNumber = documentNumber ?? "", isCashflow },
            txn);
    }

    public async Task InsertGeneralLedgerEntry(DbConnection conn, DbTransaction txn,
        DateTime postingDate, int processingMonth, int? voteId, string finYear,
        int? transactionTypeId, string? transactionDetails, string? documentNumber,
        decimal? debit, decimal? credit, Guid? matchTranGuid, int? journalTransactionTypeId,
        int? assetLinkId, int? scoaFundsId, int? scoaRegionId, int? scoaCostingId,
        int? scoaProjectId, int? scoaFunctionId, int scoaItemId,
        int? divisionId, int? projectId, int? planProjectItemId,
        Guid? outboxId = null, int sourceModuleId = 8, int capturerId = 1)
    {
        await conn.ExecuteAsync(@"
            INSERT INTO ""Asset_GeneralLedger"" (
                ""PostingDate"", ""ProcessingMonth"", ""VoteID"", ""FinYear"",
                ""TransactionTypeID"", ""TransactionDetails"", ""DocumentNumber"",
                ""Debit"", ""Credit"", ""DateCaptured"", ""CapturerID"",
                ""MatchTranGuid"", ""JournalTransactionTypeID"", ""AssetLinkID"",
                ""SCOAFundsID"", ""SCOARegionID"", ""SCOACostingID"", ""SCOAProjectID"", ""SCOAFunctionID"", ""SCOAItemID"",
                ""DivisionID"", ""ProjectID"", ""PlanProjectItemID""
            ) VALUES (
                @postingDate, @processingMonth, @voteId, @finYear,
                @transactionTypeId, @transactionDetails, @documentNumber,
                @debit, @credit, NOW(), 1,
                @matchTranGuid, @journalTransactionTypeId, @assetLinkId,
                @scoaFundsId, @scoaRegionId, @scoaCostingId, @scoaProjectId, @scoaFunctionId, @scoaItemId,
                @divisionId, @projectId, @planProjectItemId
            )",
            new
            {
                postingDate, processingMonth, voteId, finYear,
                transactionTypeId, transactionDetails, documentNumber,
                debit, credit, matchTranGuid, journalTransactionTypeId, assetLinkId,
                scoaFundsId, scoaRegionId, scoaCostingId, scoaProjectId, scoaFunctionId, scoaItemId,
                divisionId, projectId, planProjectItemId
            }, txn);

        if (outboxId.HasValue)
        {
            await conn.ExecuteAsync(@"
                INSERT INTO ""GL_Outbox_Lines"" (
                    ""OutboxId"", ""ProcessingMonth"", ""FinYear"", ""TransactionDetails"",
                    ""Debit"", ""Credit"", ""VATRate"", ""VATRateID"",
                    ""PlanProjectItemID"", ""SourceModuleId"", ""CapturerId""
                ) VALUES (
                    @outboxId, @processingMonth, @finYear, @transactionDetails,
                    @debit, @credit, 0, 0,
                    @planProjectItemId, @sourceModuleId, @capturerId
                )",
                new
                {
                    outboxId = outboxId.Value,
                    processingMonth, finYear, transactionDetails,
                    debit = debit ?? 0m, credit = credit ?? 0m,
                    planProjectItemId = planProjectItemId ?? 0,
                    sourceModuleId, capturerId
                }, txn);
        }
    }

    public async Task UpsertAssetRegisterTransaction(DbConnection conn, DbTransaction txn,
        int assetRegisterItemId, int transactionTypeId, DateTime transactionDate,
        string financialYear, int financialPeriod, Guid glGuidId, int? documentTypeId,
        decimal? purchaseAmount = null, decimal? residualValue = null, decimal? currentValue = null,
        decimal? usefulLife = null, decimal? remainingUsefulLife = null,
        decimal? depreciationValue = null, decimal? impairmentValue = null,
        decimal? impairmentReversalValue = null, decimal? revaluationValue = null,
        decimal? fairValue = null, decimal? disposalValue = null,
        decimal? disposalLossValue = null, decimal? disposalTotalValue = null,
        decimal? accumulatedDepreciation = null, decimal? accumulatedImpairment = null,
        decimal? accumulatedImpairmentReversal = null, decimal? impairmentSurplus = null,
        decimal? accumulatedFairValue = null, decimal? accumulatedRevaluation = null,
        decimal? revaluationReserveDisposal = null,
        decimal? movementInRevaluationReserve = null, decimal? depreciationOffset = null,
        decimal? revaluationReserveImpairment = null, decimal? revaluationReserveImpairmentReversal = null,
        decimal? revaluationReserveRevaluation = null, decimal? depreciationAdjustment = null,
        decimal? transferFromValue = null, decimal? transferToValue = null,
        decimal? refurbDTValue = null, decimal? refurbCTValue = null,
        decimal? refurbDepreciationValue = null, decimal? refurbRevaluationValue = null,
        decimal? refurbImpairmentValue = null,
        int? transactionSourceId = null)
    {
        string glGuidStr = glGuidId.ToString();
        int usefulLifeInt = usefulLife.HasValue ? (int)usefulLife.Value : 0;

        var existing = await conn.QueryFirstOrDefaultAsync<int?>(
            @"SELECT ""ID"" FROM ""Asset_Register_Transactions""
              WHERE ""AssetRegisterItem_ID"" = @assetRegisterItemId AND ""TransactionDate"" = @transactionDate
              AND ""TransactionTypeID"" = @transactionTypeId OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY",
            new { assetRegisterItemId, transactionDate, transactionTypeId }, txn);

        if (existing.HasValue)
        {
            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Register_Transactions"" SET
                    ""PurchaseAmount"" = COALESCE(@purchaseAmount, ""PurchaseAmount""),
                    ""ResidualValue"" = COALESCE(@residualValue, ""ResidualValue""),
                    ""CurrentValue"" = COALESCE(@currentValue, ""CurrentValue""),
                    ""UsefulLife"" = COALESCE(@usefulLifeInt, ""UsefulLife""),
                    ""RemaingUsefulLife"" = COALESCE(@remainingUsefulLife, ""RemaingUsefulLife""),
                    ""DepreciationValue"" = @depreciationValue,
                    ""ImpairmentValue"" = @impairmentValue,
                    ""ImpairmentReversalValue"" = @impairmentReversalValue,
                    ""RevaluationValue"" = @revaluationValue,
                    ""FairValue"" = @fairValue,
                    ""DisposalValue"" = @disposalValue, ""DisposalLossValue"" = @disposalLossValue,
                    ""DisposalTotalValue"" = @disposalTotalValue,
                    ""AccumulatedDepreciation"" = COALESCE(@accumulatedDepreciation, ""AccumulatedDepreciation""),
                    ""AccumulatedImpairment"" = COALESCE(@accumulatedImpairment, ""AccumulatedImpairment""),
                    ""AccumulatedFairValue"" = COALESCE(@accumulatedFairValue, ""AccumulatedFairValue""),
                    ""AccumulatedRevaluation"" = COALESCE(@accumulatedRevaluation, ""AccumulatedRevaluation""),
                    ""AccumulatedImpairmentReversal"" = @accumulatedImpairmentReversal,
                    ""ImpairmentSurplus"" = @impairmentSurplus,
                    ""MovementInRevaluationReserve"" = @movementInRevaluationReserve,
                    ""DepreciationOffset"" = @depreciationOffset,
                    ""RevaluationReserveImpairment"" = @revaluationReserveImpairment,
                    ""RevaluationReserveImpairmentReversal"" = @revaluationReserveImpairmentReversal,
                    ""RevaluationReserveRevaluation"" = @revaluationReserveRevaluation,
                    ""RevaluationReserveDisposal"" = @revaluationReserveDisposal,
                    ""DepreciationAdjustment"" = @depreciationAdjustment,
                    ""TransferFromValue"" = @transferFromValue, ""TransferToValue"" = @transferToValue,
                    ""RefurbDTValue"" = @refurbDTValue, ""RefurbCTValue"" = @refurbCTValue,
                    ""RefurbDepreciationValue"" = @refurbDepreciationValue,
                    ""RefurbRevaluationValue"" = @refurbRevaluationValue,
                    ""RefurbImpairmentValue"" = @refurbImpairmentValue,
                    ""GLGUID_ID"" = @glGuidStr, ""TransactionSource_ID"" = COALESCE(@transactionSourceId, ""TransactionSource_ID""),
                    ""DateModified"" = NOW()
                WHERE ""ID"" = @existingId",
                new
                {
                    purchaseAmount, residualValue, currentValue, usefulLifeInt, remainingUsefulLife,
                    depreciationValue, impairmentValue, impairmentReversalValue,
                    revaluationValue, fairValue,
                    disposalValue, disposalLossValue, disposalTotalValue,
                    accumulatedDepreciation, accumulatedImpairment,
                    accumulatedFairValue, accumulatedRevaluation,
                    accumulatedImpairmentReversal, impairmentSurplus,
                    movementInRevaluationReserve, depreciationOffset,
                    revaluationReserveImpairment, revaluationReserveImpairmentReversal,
                    revaluationReserveRevaluation, revaluationReserveDisposal,
                    depreciationAdjustment,
                    transferFromValue, transferToValue,
                    refurbDTValue, refurbCTValue, refurbDepreciationValue, refurbRevaluationValue,
                    refurbImpairmentValue,
                    glGuidStr, transactionSourceId, existingId = existing.Value
                }, txn);
        }
        else
        {
            await conn.ExecuteAsync(@"
                INSERT INTO ""Asset_Register_Transactions"" (
                    ""AssetRegisterItem_ID"", ""TransactionTypeID"", ""TransactionDate"",
                    ""FinancialYear"", ""FinancialPeriod"",
                    ""PurchaseAmount"", ""ResidualValue"", ""CurrentValue"",
                    ""UsefulLife"", ""RemaingUsefulLife"",
                    ""DepreciationValue"", ""ImpairmentValue"", ""ImpairmentReversalValue"",
                    ""RevaluationValue"", ""FairValue"",
                    ""DisposalValue"", ""DisposalLossValue"", ""DisposalTotalValue"",
                    ""AccumulatedDepreciation"", ""AccumulatedImpairment"",
                    ""AccumulatedFairValue"", ""AccumulatedRevaluation"",
                    ""AccumulatedImpairmentReversal"", ""ImpairmentSurplus"",
                    ""MovementInRevaluationReserve"", ""DepreciationOffset"",
                    ""RevaluationReserveImpairment"", ""RevaluationReserveImpairmentReversal"",
                    ""RevaluationReserveRevaluation"", ""RevaluationReserveDisposal"",
                    ""DepreciationAdjustment"",
                    ""TransferFromValue"", ""TransferToValue"",
                    ""RefurbDTValue"", ""RefurbCTValue"",
                    ""RefurbDepreciationValue"", ""RefurbRevaluationValue"", ""RefurbImpairmentValue"",
                    ""DocumentType_ID"", ""GLGUID_ID"", ""TransactionSource_ID"", ""DateModified"", ""Modifier""
                ) VALUES (
                    @assetRegisterItemId, @transactionTypeId, @transactionDate,
                    @financialYear, @financialPeriod,
                    COALESCE(@purchaseAmount, 0), COALESCE(@residualValue, 0), COALESCE(@currentValue, 0),
                    @usefulLifeInt, COALESCE(@remainingUsefulLife, 0),
                    @depreciationValue, @impairmentValue, @impairmentReversalValue,
                    @revaluationValue, @fairValue,
                    @disposalValue, @disposalLossValue, @disposalTotalValue,
                    COALESCE(@accumulatedDepreciation, 0), COALESCE(@accumulatedImpairment, 0),
                    COALESCE(@accumulatedFairValue, 0), COALESCE(@accumulatedRevaluation, 0),
                    @accumulatedImpairmentReversal, @impairmentSurplus,
                    @movementInRevaluationReserve, @depreciationOffset,
                    @revaluationReserveImpairment, @revaluationReserveImpairmentReversal,
                    @revaluationReserveRevaluation, @revaluationReserveDisposal,
                    @depreciationAdjustment,
                    @transferFromValue, @transferToValue,
                    @refurbDTValue, @refurbCTValue,
                    @refurbDepreciationValue, @refurbRevaluationValue, @refurbImpairmentValue,
                    @documentTypeId, @glGuidStr, @transactionSourceId, NOW(), 0
                )",
                new
                {
                    assetRegisterItemId, transactionTypeId, transactionDate,
                    financialYear, financialPeriod,
                    purchaseAmount, residualValue, currentValue,
                    usefulLifeInt, remainingUsefulLife,
                    depreciationValue, impairmentValue, impairmentReversalValue,
                    revaluationValue, fairValue,
                    disposalValue, disposalLossValue, disposalTotalValue,
                    accumulatedDepreciation, accumulatedImpairment,
                    accumulatedFairValue, accumulatedRevaluation,
                    accumulatedImpairmentReversal, impairmentSurplus,
                    movementInRevaluationReserve, depreciationOffset,
                    revaluationReserveImpairment, revaluationReserveImpairmentReversal,
                    revaluationReserveRevaluation, revaluationReserveDisposal,
                    depreciationAdjustment,
                    transferFromValue, transferToValue,
                    refurbDTValue, refurbCTValue, refurbDepreciationValue, refurbRevaluationValue,
                    refurbImpairmentValue,
                    documentTypeId, glGuidStr, transactionSourceId
                }, txn);
        }
    }

    public async Task PopulateTransactionSummarySingle(int assetRegisterItemId, string finYear, int finPeriod)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();
        try
        {
            await PopulateTransactionSummarySingleInternal(conn, txn, assetRegisterItemId, finYear, finPeriod);
            await txn.CommitAsync();
        }
        catch
        {
            await txn.RollbackAsync();
            throw;
        }
    }

    public async Task PopulateTransactionSummarySingle(DbConnection conn, DbTransaction txn,
        int assetRegisterItemId, string finYear, int finPeriod)
    {
        await PopulateTransactionSummarySingleInternal(conn, txn, assetRegisterItemId, finYear, finPeriod);
    }


    private async Task PopulateTransactionSummarySingleInternal(DbConnection conn, DbTransaction txn,
        int assetRegisterItemId, string finYear, int finPeriod)
    {
        await conn.ExecuteAsync(@"
            DELETE FROM ""Asset_Transaction_Summary""
            WHERE (""AssetRegisterItemID"" = @assetRegisterItemId OR ""AssetRegisterItem_ID"" = @assetRegisterItemId)
            AND (
                ""FinancialYear"" IS NULL
                OR COALESCE(""FinancialYear"", ""FinYear"") > @finYear
                OR (COALESCE(""FinancialYear"", ""FinYear"") = @finYear AND COALESCE(""FinancialPeriod"", 0) >= @finPeriod)
            )",
            new { assetRegisterItemId, finYear, finPeriod }, txn);

        var asset = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""AssetRegisterItem_ID"",
                   COALESCE(""RemainingUsefulLife"", ""UsefulLifeMonthComponent"") AS ""RemainingUsefulLife"",
                   COALESCE(""CurrentReplacementCostCRC"", 0) AS ""CRC"",
                   COALESCE(ABS(""AccumulatedDepreciationOpeningBalance""), ABS(""AccumulatedDepreciationClosingBalance""), 0) AS ""DepOpenBal"",
                   COALESCE(ABS(""AccumulatedImpairmentOpeningBalance""), ABS(""AccumulatedImpairmentClosingBalance""), 0) AS ""ImpOpenBal"",
                   COALESCE(ABS(""RevaluationOpeningBalance""), 0) AS ""RevOpenBal"",
                   COALESCE(ABS(""MovementInRevaluationReserve""), 0) AS ""MovRevReserve"",
                   COALESCE(ABS(""DepreciationOffset""), 0) AS ""DepOffset"",
                   COALESCE(""RevaluationImpairmentOpeningBalance"", 0) AS ""RevImpOB"",
                   COALESCE(""TransferToAmount"", 0) AS ""TransferToAmt"",
                   COALESCE(""PurchaseAmount"", 0) AS ""PurchaseAmount"",
                   ""AcquisitionDate""
            FROM ""Asset_Register_Items""
            WHERE ""AssetRegisterItem_ID"" = @assetRegisterItemId",
            new { assetRegisterItemId }, txn);

        if (asset is null) return;

        decimal depOpenBal = (decimal)(asset.DepOpenBal ?? 0m);
        decimal impOpenBal = (decimal)(asset.ImpOpenBal ?? 0m);
        decimal revOpenBal = (decimal)(asset.RevOpenBal ?? 0m);
        decimal movRevReserve = (decimal)(asset.MovRevReserve ?? 0m);
        decimal depOffset = (decimal)(asset.DepOffset ?? 0m);
        decimal revImpOB = (decimal)(asset.RevImpOB ?? 0m);
        decimal crc = (decimal)(asset.CRC ?? 0m);
        decimal transferToAmt = (decimal)(asset.TransferToAmt ?? 0m);
        bool hasTransferIn = transferToAmt == 0m && await conn.ExecuteScalarAsync<int>(@"
            SELECT COUNT(*) FROM ""Asset_Register_Transactions""
            WHERE ""AssetRegisterItem_ID"" = @assetRegisterItemId AND ""TransferToValue"" > 0",
            new { assetRegisterItemId }, txn) > 0;
        decimal purchaseAmount = (decimal)(asset.PurchaseAmount ?? 0m);
        decimal currentAmount = crc;
        decimal costOpenBal = (transferToAmt > 0m || hasTransferIn) ? 0m : purchaseAmount;
        decimal revaluationClosingBalance = revOpenBal + movRevReserve - depOffset - revImpOB;
        decimal remainingUsefulLife = (decimal)(asset.RemainingUsefulLife ?? 0m);

        int calMonth = finPeriod <= 6 ? finPeriod + 6 : finPeriod - 6;
        int calYear = finPeriod >= 7 ? int.Parse(finYear.Substring(5, 4)) : int.Parse(finYear.Substring(0, 4));
        var startDate = new DateTime(calYear, calMonth, 1);
        int numberOfMonths = (int)((DateTime.Now.Year - startDate.Year) * 12 + DateTime.Now.Month - startDate.Month);
        if (numberOfMonths < 0) numberOfMonths = 0;

        string currentFinYear = finYear;
        int currentFinPeriod = finPeriod;
        int monthsRemaining = numberOfMonths;

        var pendingRefurbRows = await conn.QueryAsync<dynamic>(@"
            SELECT ar.""FinancialYear"", ar.""FinancialPeriod"",
                   COALESCE(SUM(COALESCE(ar.""Refurb_Revaluation"", 0)), 0) AS ""PendingReval""
            FROM ""Asset_Refurb"" ar
            WHERE ar.""AssetRegisterID"" = @assetRegisterItemId
              AND (ar.""isApproved"" IS NULL OR ar.""isApproved"" = FALSE)
              AND NOT EXISTS (
                  SELECT 1 FROM ""Asset_WorkflowInstances"" wi
                  WHERE wi.""entity_type"" = 'refurbishment'
                    AND wi.""mssql_reference_id"" = ar.""Asset_RefurbID""::TEXT
                    AND wi.""status"" = 'rejected'
              )
            GROUP BY ar.""FinancialYear"", ar.""FinancialPeriod""",
            new { assetRegisterItemId }, txn);
        var pendingRefurbRevByPeriod = new Dictionary<string, decimal>();
        foreach (var pr in pendingRefurbRows)
        {
            string k = $"{pr.FinancialYear}|{pr.FinancialPeriod}";
            pendingRefurbRevByPeriod[k] = (decimal)(pr.PendingReval ?? 0m);
        }

        bool isFirstPeriod = await conn.ExecuteScalarAsync<int>(@"
            SELECT 1 FROM ""Asset_Transaction_Summary""
            WHERE ""AssetRegisterItemID"" = @assetRegisterItemId LIMIT 1",
            new { assetRegisterItemId }, txn) == 0;

        // Pre-fetch ALL ART aggregates for this asset across all periods in one query
        var artRaw = await conn.QueryAsync<dynamic>(@"
            SELECT
                ""FinancialYear"", ""FinancialPeriod"",
                COALESCE(SUM(""DepreciationValue""), 0)                        AS ""DepreciationValue"",
                COALESCE(SUM(""DepreciationAdjustment""), 0)                   AS ""DepreciationAdjustment"",
                COALESCE(SUM(ABS(""ImpairmentValue"")), 0)                     AS ""ImpairmentValueAbs"",
                COALESCE(SUM(""ImpairmentReversalValue""), 0)                  AS ""ImpairmentReversalValue"",
                COALESCE(SUM(ABS(""ImpairmentReversalValue"")), 0)             AS ""ImpairmentReversalValueAbs"",
                COALESCE(SUM(ABS(""RefurbImpairmentValue"")), 0)               AS ""RefurbImpairmentValueAbs"",
                COALESCE(SUM(""FairValue""), 0)                                AS ""FairValue"",
                COALESCE(SUM(ABS(""DisposalLossValue"")), 0)                   AS ""DisposalLossValueAbs"",
                COALESCE(SUM(""DisposalLossValue""), 0)                        AS ""DisposalLossValue"",
                COALESCE(SUM(ABS(""DisposalTotalValue"")), 0)                  AS ""DisposalTotalValueAbs"",
                COALESCE(SUM(""DisposalTotalValue""), 0)                       AS ""DisposalTotalValue"",
                COALESCE(SUM(""DisposalValue""), 0)                            AS ""DisposalValue"",
                COALESCE(SUM(""RevaluationValue""), 0)                         AS ""RevaluationValue"",
                COALESCE(SUM(""TransferFromValue""), 0)                        AS ""TransferFromValue"",
                COALESCE(SUM(""TransferToValue""), 0)                          AS ""TransferToValue"",
                COALESCE(SUM(""RefurbDTValue""), 0)                            AS ""RefurbDTValue"",
                COALESCE(SUM(""RefurbCTValue""), 0)                            AS ""RefurbCTValue"",
                COALESCE(SUM(""RefurbDepreciationValue""), 0)                  AS ""RefurbDepreciationValue"",
                COALESCE(SUM(""RefurbRevaluationValue""), 0)                   AS ""RefurbRevaluationValue"",
                COALESCE(SUM(""DepreciationOffset""), 0)                       AS ""DepreciationOffset"",
                COALESCE(SUM(""MovementInRevaluationReserve""), 0)             AS ""MovementInRevaluationReserve"",
                COALESCE(SUM(""RevaluationReserveImpairment""), 0)             AS ""RevaluationReserveImpairment"",
                COALESCE(SUM(""RevaluationReserveImpairmentReversal""), 0)     AS ""RevaluationReserveImpairmentReversal"",
                COALESCE(SUM(""RevaluationReserveRevaluation""), 0)            AS ""RevaluationReserveRevaluation"",
                COALESCE(SUM(""RevaluationReserveDisposal""), 0)               AS ""RevaluationReserveDisposal"",
                COALESCE(SUM(""ImpairmentSurplus""), 0)                        AS ""ImpairmentSurplus""
            FROM ""Asset_Register_Transactions""
            WHERE ""AssetRegisterItem_ID"" = @assetRegisterItemId
            GROUP BY ""FinancialYear"", ""FinancialPeriod""",
            new { assetRegisterItemId }, txn);

        var artByPeriod = new Dictionary<string, dynamic>();
        foreach (var row in artRaw)
            artByPeriod[$"{row.FinancialYear}|{row.FinancialPeriod}"] = row;

        // Pre-fetch latest ART per period (excluding type 26) — replaces per-period lt sub-query
        var ltRaw = await conn.QueryAsync<dynamic>(@"
            SELECT DISTINCT ON (""FinancialYear"", ""FinancialPeriod"")
                ""FinancialYear"", ""FinancialPeriod"",
                ""RemaingUsefulLife"", ""CurrentValue""
            FROM ""Asset_Register_Transactions""
            WHERE ""AssetRegisterItem_ID"" = @assetRegisterItemId
              AND COALESCE(""TransactionTypeID"", 0) <> 26
            ORDER BY ""FinancialYear"", ""FinancialPeriod"", ""ID"" DESC",
            new { assetRegisterItemId }, txn);

        var ltByPeriod = new Dictionary<string, dynamic>();
        foreach (var row in ltRaw)
            ltByPeriod[$"{row.FinancialYear}|{row.FinancialPeriod}"] = row;

        // Fetch ob0 — the ATS row immediately before the rebuild start, used as initial rolling state
        string ob0FinYear;
        int ob0FinPeriod;
        if (finPeriod == 1)
        {
            int prevFyStart = int.Parse(finYear.Substring(0, 4)) - 1;
            ob0FinYear = $"{prevFyStart}/{prevFyStart + 1}";
            ob0FinPeriod = 12;
        }
        else
        {
            ob0FinYear = finYear;
            ob0FinPeriod = finPeriod - 1;
        }
        var ob0 = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT * FROM ""Asset_Transaction_Summary""
            WHERE ""AssetRegisterItemID"" = @assetRegisterItemId
              AND ""FinancialYear"" = @ob0FinYear
              AND ""FinancialPeriod"" = @ob0FinPeriod
            LIMIT 1",
            new { assetRegisterItemId, ob0FinYear, ob0FinPeriod }, txn);

        // Initialize rolling ob state from ob0 (or asset opening balances when ob0 is absent)
        bool ob0Exists = ob0 != null;
        decimal? obCurrentValue   = ob0Exists ? (decimal?)(ob0.CurrentValue) : null;
        decimal obAccDepCB        = ob0Exists ? (decimal)(ob0.AccumulatedDepreciationClosingBalance ?? depOpenBal) : depOpenBal;
        decimal obAccImpCB        = ob0Exists ? (decimal)(ob0.AccumulatedImpairmentClosingBalance ?? impOpenBal) : impOpenBal;
        decimal obAccFairValCB    = ob0Exists ? (decimal)(ob0.AccumulatedFairValueClosingBalance ?? 0m) : 0m;
        decimal obAccRevalCB      = ob0Exists ? (decimal)(ob0.AccumulatedRevaluationClosingBalance ?? revOpenBal) : revOpenBal;
        decimal obAccImpRevCB     = ob0Exists ? (decimal)(ob0.AccumulatedImpairmentReversalClosingBalance ?? 0m) : 0m;
        decimal obDisposalCB      = ob0Exists ? (decimal)(ob0.DisposalClosingBalance ?? 0m) : 0m;
        decimal obAdditionCB      = ob0Exists ? (decimal)(ob0.AdditionClosingBalance ?? 0m) : 0m;
        decimal obWipCB           = ob0Exists ? (decimal)(ob0.WorkInProgressClosingBalance ?? 0m) : 0m;
        decimal obAmortCB         = ob0Exists ? (decimal)(ob0.AmortisationClosingBalance ?? 0m) : 0m;
        decimal obCorrErrCB       = ob0Exists ? (decimal)(ob0.CorrectOfErrorClosingBalance ?? 0m) : 0m;
        decimal obAddCostCB       = ob0Exists ? (decimal)(ob0.AdditionalCostClosingBalance ?? 0m) : 0m;
        decimal? obMovRevReserve  = ob0Exists ? (decimal?)(ob0.MovementInRevaluationReserve) : null;
        decimal? obDepOffsetCB    = ob0Exists ? (decimal?)(ob0.DepreciationOffsetClosingBalance) : null;
        decimal obImpSurplus      = ob0Exists ? (decimal)(ob0.ImpairmentSurplus ?? 0m) : 0m;
        decimal? obRevImpCB       = ob0Exists ? (decimal?)(ob0.RevaluationReserveImpairmentClosingBalance) : null;
        decimal obCostCB          = ob0Exists ? (decimal)(ob0.CostClosingBalance ?? costOpenBal) : costOpenBal;
        decimal? obRulOB          = ob0Exists ? (decimal?)(ob0.RemainingUsefulLife) : null;

        // Compute all periods in C#, collect rows for batch COPY
        DateTime acqDate = (DateTime?)asset.AcquisitionDate ?? DateTime.MinValue;
        bool hasAcqDate = asset.AcquisitionDate != null;
        var now = DateTime.Now;

        // Each element: 65 values matching the INSERT column order
        var batchRows = new List<(
            decimal RemainingUsefulLife, decimal CurrentValue,
            decimal AccDepOB, decimal DepreciationValue, decimal AccDepCB,
            decimal AccImpOB, decimal ImpairmentValue, decimal AccImpCB,
            decimal AccFairValOB, decimal FairValue, decimal AccFairValCB,
            decimal AccRevalOB, decimal RevaluationValue, decimal AccRevalCB,
            decimal AccImpRevOB, decimal ImpRevValue, decimal AccImpRevCB,
            decimal DisposalOB, decimal DisposalValue, decimal DisposalLossValue, decimal DisposalTotalValue, decimal DisposalCB,
            decimal AdditionOB, decimal AdditionVaue, decimal AdditionCB,
            decimal WipOB, decimal WipValue, decimal WipCB,
            decimal AmortOB, decimal AmortCB,
            decimal CorrErrOB, decimal CorrErrCB,
            decimal AddCostOB, decimal AddCostCB,
            decimal MovRevReserve,
            decimal DepOffsetOB, decimal DepOffset, decimal DepOffsetCB,
            decimal ImpSurplus,
            decimal RevImpOB, decimal RevImpValue, decimal RevImpRevVal, decimal RevImpCB,
            decimal RevResReval, decimal RevResDisposal,
            decimal DepAdj, decimal TransferFrom, decimal TransferTo,
            decimal CostOB, decimal CostCB,
            decimal RefurbDT, decimal RefurbCT, decimal RefurbDep, decimal RefurbReval, decimal RefurbImp,
            decimal CarryingAmount,
            string FinancialYear, int FinancialPeriod
        )>();

        for (int m = 0; m <= numberOfMonths; m++)
        {
            string periodKey = $"{currentFinYear}|{currentFinPeriod}";

            // ART aggregates for this period
            dynamic? artRow = artByPeriod.TryGetValue(periodKey, out var ar) ? ar : null;
            decimal artDepValue        = artRow != null ? (decimal)(artRow.DepreciationValue ?? 0m)                    : 0m;
            decimal artDepAdj          = artRow != null ? (decimal)(artRow.DepreciationAdjustment ?? 0m)               : 0m;
            decimal artImpAbs          = artRow != null ? (decimal)(artRow.ImpairmentValueAbs ?? 0m)                   : 0m;
            decimal artImpRevValue     = artRow != null ? (decimal)(artRow.ImpairmentReversalValue ?? 0m)              : 0m;
            decimal artImpRevValueAbs  = artRow != null ? (decimal)(artRow.ImpairmentReversalValueAbs ?? 0m)           : 0m;
            decimal artRefurbImpAbs    = artRow != null ? (decimal)(artRow.RefurbImpairmentValueAbs ?? 0m)             : 0m;
            decimal artFairValue       = artRow != null ? (decimal)(artRow.FairValue ?? 0m)                            : 0m;
            decimal artDisposalLossAbs = artRow != null ? (decimal)(artRow.DisposalLossValueAbs ?? 0m)                 : 0m;
            decimal artDisposalLoss    = artRow != null ? (decimal)(artRow.DisposalLossValue ?? 0m)                    : 0m;
            decimal artDisposalTotAbs  = artRow != null ? (decimal)(artRow.DisposalTotalValueAbs ?? 0m)                : 0m;
            decimal artDisposalTot     = artRow != null ? (decimal)(artRow.DisposalTotalValue ?? 0m)                   : 0m;
            decimal artDisposalValue   = artRow != null ? (decimal)(artRow.DisposalValue ?? 0m)                        : 0m;
            decimal artRevalValue      = artRow != null ? (decimal)(artRow.RevaluationValue ?? 0m)                     : 0m;
            decimal artTransferFrom    = artRow != null ? (decimal)(artRow.TransferFromValue ?? 0m)                    : 0m;
            decimal artTransferTo      = artRow != null ? (decimal)(artRow.TransferToValue ?? 0m)                      : 0m;
            decimal artRefurbDT        = artRow != null ? (decimal)(artRow.RefurbDTValue ?? 0m)                        : 0m;
            decimal artRefurbCT        = artRow != null ? (decimal)(artRow.RefurbCTValue ?? 0m)                        : 0m;
            decimal artRefurbDep       = artRow != null ? (decimal)(artRow.RefurbDepreciationValue ?? 0m)              : 0m;
            decimal artRefurbReval     = artRow != null ? (decimal)(artRow.RefurbRevaluationValue ?? 0m)               : 0m;
            decimal artDepOffset       = artRow != null ? (decimal)(artRow.DepreciationOffset ?? 0m)                   : 0m;
            decimal artMovRevReserve   = artRow != null ? (decimal)(artRow.MovementInRevaluationReserve ?? 0m)         : 0m;
            decimal artRevImpairment   = artRow != null ? (decimal)(artRow.RevaluationReserveImpairment ?? 0m)         : 0m;
            decimal artRevImpReversal  = artRow != null ? (decimal)(artRow.RevaluationReserveImpairmentReversal ?? 0m) : 0m;
            decimal artRevResReval     = artRow != null ? (decimal)(artRow.RevaluationReserveRevaluation ?? 0m)        : 0m;
            decimal artRevResDisposal  = artRow != null ? (decimal)(artRow.RevaluationReserveDisposal ?? 0m)           : 0m;
            decimal artImpSurplus      = artRow != null ? (decimal)(artRow.ImpairmentSurplus ?? 0m)                    : 0m;

            // lt (latest ART row, type != 26) for this period
            dynamic? ltRow = ltByPeriod.TryGetValue(periodKey, out var lt) ? lt : null;
            decimal? ltRul   = ltRow != null ? (decimal?)(ltRow.RemaingUsefulLife) : null;
            decimal? ltCurVal = ltRow != null ? (decimal?)(ltRow.CurrentValue) : null;

            // Pending refurb revaluation for this period
            decimal pendingRefurbReval = pendingRefurbRevByPeriod.TryGetValue(periodKey, out var prv) ? prv : 0m;

            // Acquisition month match (replaces sqlMonthMatch)
            bool isAcqMonth = false;
            if (hasAcqDate)
            {
                var targetDate = now.AddMonths(-monthsRemaining);
                isAcqMonth = acqDate.Year == targetDate.Year && acqDate.Month == targetDate.Month;
            }
            bool noTransfer = transferToAmt == 0m && artTransferTo == 0m;

            // ── Compute column values ──────────────────────────────────────────────

            // RemainingUsefulLife
            decimal rowRul = ltRul ?? obRulOB ?? remainingUsefulLife;

            // CurrentValue (COALESCE of ob-based vs fallback)
            decimal rowCurVal;
            if (obCurrentValue.HasValue)
            {
                rowCurVal = obCurrentValue.Value
                    - artDepValue - artDepAdj - artImpAbs + artRefurbImpAbs + artFairValue
                    + artImpRevValue - artDisposalLossAbs - artDisposalTotAbs
                    + artRevalValue - artTransferFrom + artTransferTo
                    + artRefurbDT - artRefurbCT + artRefurbDep;
            }
            else
            {
                rowCurVal = currentAmount
                    - obAccDepCB - artDepValue
                    - Math.Abs(obAccImpCB) - artImpAbs + artRefurbImpAbs
                    + Math.Abs(obAccImpRevCB) + artImpRevValueAbs
                    + obAccFairValCB + artFairValue + artTransferTo;
            }

            // AccDepOB / AccDepCB
            decimal accDepOB = obAccDepCB;
            decimal accDepCB = obAccDepCB + artDepValue + artDepAdj - artRefurbDep;

            // AccImpOB (SQL: ABS of ob.AccImpCB) / AccImpCB (SQL: ob.AccImpCB without ABS)
            decimal accImpOB = Math.Abs(obAccImpCB);
            decimal accImpCB = obAccImpCB + artImpAbs - artImpRevValue - artRefurbImpAbs;

            // AccFairValOB / AccFairValCB
            decimal accFairValOB = obAccFairValCB;
            decimal accFairValCB = obAccFairValCB + artFairValue;

            // AccRevalOB / AccRevalCB (CASE: isFirstPeriod branch uses revaluationClosingBalance)
            decimal accRevalOB = obAccRevalCB;
            decimal revalBase  = (currentFinPeriod == 1 && isFirstPeriod) ? revaluationClosingBalance : obAccRevalCB;
            decimal accRevalCB = revalBase
                - artRevalValue - artRevImpairment + artRevImpReversal
                - artRevResDisposal - artRefurbReval - pendingRefurbReval
                - artDepOffset + artMovRevReserve;

            // AccImpRevOB / AccImpRevCB
            decimal accImpRevOB = obAccImpRevCB;
            decimal accImpRevCB = obAccImpRevCB + artImpRevValue;

            // Disposal
            decimal disposalOB  = obDisposalCB;
            decimal disposalCB  = obDisposalCB - artDisposalLoss + artDisposalTot;

            // Addition
            decimal additionOB = currentFinPeriod == 1 ? 0m : obAdditionCB;
            decimal additionVaue = (isAcqMonth && noTransfer) ? crc : 0m;
            decimal additionCB;
            if (currentFinPeriod == 1)
                additionCB = (isAcqMonth && noTransfer) ? crc : 0m;
            else
                additionCB = obAdditionCB + ((isAcqMonth && noTransfer) ? purchaseAmount : 0m);

            // WIP
            decimal wipOB = currentFinPeriod == 1 ? 0m : obWipCB;
            decimal wipCB = (currentFinPeriod == 1 ? 0m : obWipCB) + artTransferFrom;

            // Amortisation (value always 0)
            decimal amortCB = obAmortCB;

            // CorrectionOfError (value always 0)
            decimal corrErrCB = obCorrErrCB;

            // AdditionalCost (value always 0)
            decimal addCostCB = obAddCostCB;

            // MovementInRevaluationReserve
            decimal movRevReserve_out;
            if (currentFinPeriod == 1 && isFirstPeriod)
                movRevReserve_out = movRevReserve;
            else
                movRevReserve_out = (obMovRevReserve ?? movRevReserve) + artMovRevReserve;

            // DepreciationOffset OB / CB (CASE: isFirstPeriod vs period-1 reset vs normal)
            decimal depOffsetOB;
            if (currentFinPeriod == 1 && isFirstPeriod)
                depOffsetOB = depOffset;
            else if (currentFinPeriod == 1 && (obDepOffsetCB ?? 0m) > 0m)
                depOffsetOB = 0m;
            else
                depOffsetOB = obDepOffsetCB ?? depOffset;

            decimal depOffsetCB;
            if (currentFinPeriod == 1 && isFirstPeriod)
                depOffsetCB = depOffset + artDepOffset;
            else if (currentFinPeriod == 1)
                depOffsetCB = artDepOffset;
            else
                depOffsetCB = (obDepOffsetCB ?? depOffset) + artDepOffset;

            // ImpairmentSurplus
            decimal impSurplus = obImpSurplus + artImpSurplus;

            // RevaluationReserveImpairment OB / CB (CASE: isFirstPeriod / period-1 reset / normal)
            decimal revImpOB_out;
            if (currentFinPeriod == 1 && isFirstPeriod)
                revImpOB_out = revImpOB;
            else if (currentFinPeriod == 1)
                revImpOB_out = 0m;
            else
                revImpOB_out = obRevImpCB ?? revImpOB;

            decimal revImpCB;
            if (currentFinPeriod == 1 && isFirstPeriod)
                revImpCB = revImpOB + artRevImpairment - artRevImpReversal;
            else if (currentFinPeriod == 1)
                revImpCB = 0m;
            else
                revImpCB = (obRevImpCB ?? revImpOB) + artRevImpairment - artRevImpReversal;

            // Cost OB / CB
            decimal costOB = obCostCB;
            decimal costCB = obCostCB + artRevalValue + artFairValue + artTransferTo
                             - artTransferFrom + artRefurbDT - artRefurbCT - artDisposalValue;

            // CarryingAmount = CostCB - AccDepCB - AccImpCB
            decimal carryingAmount = Math.Max(0m, costCB - accDepCB - accImpCB);

            batchRows.Add((
                rowRul, rowCurVal,
                accDepOB, artDepValue, accDepCB,
                accImpOB, artImpAbs, accImpCB,
                accFairValOB, artFairValue, accFairValCB,
                accRevalOB, artRevalValue, accRevalCB,
                accImpRevOB, artImpRevValue, accImpRevCB,
                disposalOB, artDisposalValue, artDisposalLoss, artDisposalTot, disposalCB,
                additionOB, additionVaue, additionCB,
                wipOB, artTransferFrom, wipCB,
                obAmortCB, amortCB,
                obCorrErrCB, corrErrCB,
                obAddCostCB, addCostCB,
                movRevReserve_out,
                depOffsetOB, artDepOffset, depOffsetCB,
                impSurplus,
                revImpOB_out, artRevImpairment, artRevImpReversal, revImpCB,
                artRevResReval, artRevResDisposal,
                artDepAdj, artTransferFrom, artTransferTo,
                costOB, costCB,
                artRefurbDT, artRefurbCT, artRefurbDep, artRefurbReval, artRefurbImpAbs,
                carryingAmount,
                currentFinYear, currentFinPeriod
            ));

            // Advance rolling ob state for next period
            obCurrentValue  = rowCurVal;
            obAccDepCB      = accDepCB;
            obAccImpCB      = accImpCB;
            obAccFairValCB  = accFairValCB;
            obAccRevalCB    = accRevalCB;
            obAccImpRevCB   = accImpRevCB;
            obDisposalCB    = disposalCB;
            obAdditionCB    = additionCB;
            obWipCB         = wipCB;
            // obAmortCB, obCorrErrCB, obAddCostCB unchanged (value always 0)
            obMovRevReserve = movRevReserve_out;
            obDepOffsetCB   = depOffsetCB;
            obImpSurplus    = impSurplus;
            obRevImpCB      = revImpCB;
            obCostCB        = costCB;
            obRulOB         = rowRul;

            // isFirstPeriod only true for the very first iteration
            isFirstPeriod = false;

            currentFinPeriod = currentFinPeriod + 1;
            monthsRemaining  = monthsRemaining - 1;
            if (currentFinPeriod > 12)
            {
                currentFinPeriod = 1;
                int fyStart = int.Parse(currentFinYear.Substring(0, 4)) + 1;
                currentFinYear = $"{fyStart}/{fyStart + 1}";
            }
        }

        // Batch INSERT via PostgreSQL COPY (binary) — single round-trip for all periods
        // DateCaptured uses DateTime.UtcNow; DB timezone is GMT/UTC so this matches NOW() exactly.
        if (batchRows.Count > 0)
        {
            // DbConnectionFactory always returns NpgsqlConnection for this Postgres-only API.
            var pgConn = (NpgsqlConnection)conn;
            await using var writer = await pgConn.BeginBinaryImportAsync(@"
                COPY ""Asset_Transaction_Summary"" (
                    ""AssetRegisterItemID"", ""AssetRegisterItem_ID"", ""FinancialYear"", ""FinYear"", ""FinancialPeriod"",
                    ""RemainingUsefulLife"", ""CurrentValue"",
                    ""AccumulatedDepreciationOpeningBalance"", ""DepreciationValue"", ""AccumulatedDepreciationClosingBalance"",
                    ""AccumulatedImpairmentOpeningBalance"", ""ImpairmentValue"", ""AccumulatedImpairmentClosingBalance"",
                    ""AccumulatedFairValueOpeningBalance"", ""FairValue"", ""AccumulatedFairValueClosingBalance"",
                    ""AccumulatedRevaluationOpeningBalance"", ""RevaluationValue"", ""AccumulatedRevaluationClosingBalance"",
                    ""AccumulatedImpairmentReversalOpeningBalance"", ""ImpairmentReversalValue"", ""AccumulatedImpairmentReversalClosingBalance"",
                    ""DisposalOpeningBalance"", ""DisposalValue"", ""DisposalLossValue"", ""DisposalTotalValue"", ""DisposalClosingBalance"",
                    ""AdditionOpeningBalance"", ""AdditionVaue"", ""AdditionClosingBalance"",
                    ""WorkInProgressOpeningBalance"", ""WorkInProgressValue"", ""WorkInProgressClosingBalance"",
                    ""AmortisationOpeningBalance"", ""AmortisationValue"", ""AmortisationClosingBalance"",
                    ""CorrectionOfErrorOpeningBalance"", ""CorrectionOfErrorValue"", ""CorrectOfErrorClosingBalance"",
                    ""AdditionalCostOpeningBalance"", ""AdditionalCostValue"", ""AdditionalCostClosingBalance"",
                    ""MovementInRevaluationReserve"",
                    ""DepreciationOffsetOpeningBalance"", ""DepreciationOffset"", ""DepreciationOffsetClosingBalance"",
                    ""ImpairmentSurplus"",
                    ""RevaluationReserveImpairmentOpeningBalance"", ""RevaluationReserveImpairment"",
                    ""RevaluationReserveImpairmentReversal"", ""RevaluationReserveImpairmentClosingBalance"",
                    ""RevaluationReserveRevaluation"", ""RevaluationReserveDisposal"",
                    ""DepreciationAdjustment"",
                    ""TransferFromValue"", ""TransferToValue"",
                    ""CostOpeningBalance"", ""CostClosingBalance"",
                    ""RefurbDTValue"", ""RefurbCTValue"", ""RefurbDepreciationValue"", ""RefurbRevaluationValue"",
                    ""RefurbImpairmentValue"",
                    ""CarryingAmount"", ""DateCaptured""
                ) FROM STDIN (FORMAT BINARY)");

            // DateCaptured is TIMESTAMP WITHOUT TIME ZONE — strip Kind flag (DB is GMT=UTC so value is identical)
            var ts = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
            for (int i = 0; i < batchRows.Count; i++)
            {
                var r = batchRows[i];
                await writer.StartRowAsync();
                await writer.WriteAsync(assetRegisterItemId,  NpgsqlDbType.Integer);  // AssetRegisterItemID
                await writer.WriteAsync(assetRegisterItemId,  NpgsqlDbType.Integer);  // AssetRegisterItem_ID
                await writer.WriteAsync(r.FinancialYear,      NpgsqlDbType.Varchar);  // FinancialYear
                await writer.WriteAsync(r.FinancialYear,      NpgsqlDbType.Varchar);  // FinYear
                await writer.WriteAsync(r.FinancialPeriod,    NpgsqlDbType.Integer);  // FinancialPeriod
                await writer.WriteAsync(r.RemainingUsefulLife, NpgsqlDbType.Numeric); // RemainingUsefulLife
                await writer.WriteAsync(r.CurrentValue,        NpgsqlDbType.Numeric); // CurrentValue
                await writer.WriteAsync(r.AccDepOB,            NpgsqlDbType.Numeric); // AccumulatedDepreciationOpeningBalance
                await writer.WriteAsync(r.DepreciationValue,   NpgsqlDbType.Numeric); // DepreciationValue
                await writer.WriteAsync(r.AccDepCB,            NpgsqlDbType.Numeric); // AccumulatedDepreciationClosingBalance
                await writer.WriteAsync(r.AccImpOB,            NpgsqlDbType.Numeric); // AccumulatedImpairmentOpeningBalance
                await writer.WriteAsync(r.ImpairmentValue,     NpgsqlDbType.Numeric); // ImpairmentValue
                await writer.WriteAsync(r.AccImpCB,            NpgsqlDbType.Numeric); // AccumulatedImpairmentClosingBalance
                await writer.WriteAsync(r.AccFairValOB,        NpgsqlDbType.Numeric); // AccumulatedFairValueOpeningBalance
                await writer.WriteAsync(r.FairValue,           NpgsqlDbType.Numeric); // FairValue
                await writer.WriteAsync(r.AccFairValCB,        NpgsqlDbType.Numeric); // AccumulatedFairValueClosingBalance
                await writer.WriteAsync(r.AccRevalOB,          NpgsqlDbType.Numeric); // AccumulatedRevaluationOpeningBalance
                await writer.WriteAsync(r.RevaluationValue,    NpgsqlDbType.Numeric); // RevaluationValue
                await writer.WriteAsync(r.AccRevalCB,          NpgsqlDbType.Numeric); // AccumulatedRevaluationClosingBalance
                await writer.WriteAsync(r.AccImpRevOB,         NpgsqlDbType.Numeric); // AccumulatedImpairmentReversalOpeningBalance
                await writer.WriteAsync(r.ImpRevValue,         NpgsqlDbType.Numeric); // ImpairmentReversalValue
                await writer.WriteAsync(r.AccImpRevCB,         NpgsqlDbType.Numeric); // AccumulatedImpairmentReversalClosingBalance
                await writer.WriteAsync(r.DisposalOB,          NpgsqlDbType.Numeric); // DisposalOpeningBalance
                await writer.WriteAsync(r.DisposalValue,       NpgsqlDbType.Numeric); // DisposalValue
                await writer.WriteAsync(r.DisposalLossValue,   NpgsqlDbType.Numeric); // DisposalLossValue
                await writer.WriteAsync(r.DisposalTotalValue,  NpgsqlDbType.Numeric); // DisposalTotalValue
                await writer.WriteAsync(r.DisposalCB,          NpgsqlDbType.Numeric); // DisposalClosingBalance
                await writer.WriteAsync(r.AdditionOB,          NpgsqlDbType.Numeric); // AdditionOpeningBalance
                await writer.WriteAsync(r.AdditionVaue,        NpgsqlDbType.Numeric); // AdditionVaue
                await writer.WriteAsync(r.AdditionCB,          NpgsqlDbType.Numeric); // AdditionClosingBalance
                await writer.WriteAsync(r.WipOB,               NpgsqlDbType.Numeric); // WorkInProgressOpeningBalance
                await writer.WriteAsync(r.WipValue,            NpgsqlDbType.Numeric); // WorkInProgressValue
                await writer.WriteAsync(r.WipCB,               NpgsqlDbType.Numeric); // WorkInProgressClosingBalance
                await writer.WriteAsync(r.AmortOB,             NpgsqlDbType.Numeric); // AmortisationOpeningBalance
                await writer.WriteAsync(0m,                    NpgsqlDbType.Numeric); // AmortisationValue
                await writer.WriteAsync(r.AmortCB,             NpgsqlDbType.Numeric); // AmortisationClosingBalance
                await writer.WriteAsync(r.CorrErrOB,           NpgsqlDbType.Numeric); // CorrectionOfErrorOpeningBalance
                await writer.WriteAsync(0m,                    NpgsqlDbType.Numeric); // CorrectionOfErrorValue
                await writer.WriteAsync(r.CorrErrCB,           NpgsqlDbType.Numeric); // CorrectOfErrorClosingBalance
                await writer.WriteAsync(r.AddCostOB,           NpgsqlDbType.Numeric); // AdditionalCostOpeningBalance
                await writer.WriteAsync(0m,                    NpgsqlDbType.Numeric); // AdditionalCostValue
                await writer.WriteAsync(r.AddCostCB,           NpgsqlDbType.Numeric); // AdditionalCostClosingBalance
                await writer.WriteAsync(r.MovRevReserve,       NpgsqlDbType.Numeric); // MovementInRevaluationReserve
                await writer.WriteAsync(r.DepOffsetOB,         NpgsqlDbType.Numeric); // DepreciationOffsetOpeningBalance
                await writer.WriteAsync(r.DepOffset,           NpgsqlDbType.Numeric); // DepreciationOffset
                await writer.WriteAsync(r.DepOffsetCB,         NpgsqlDbType.Numeric); // DepreciationOffsetClosingBalance
                await writer.WriteAsync(r.ImpSurplus,          NpgsqlDbType.Numeric); // ImpairmentSurplus
                await writer.WriteAsync(r.RevImpOB,            NpgsqlDbType.Numeric); // RevaluationReserveImpairmentOpeningBalance
                await writer.WriteAsync(r.RevImpValue,         NpgsqlDbType.Numeric); // RevaluationReserveImpairment
                await writer.WriteAsync(r.RevImpRevVal,        NpgsqlDbType.Numeric); // RevaluationReserveImpairmentReversal
                await writer.WriteAsync(r.RevImpCB,            NpgsqlDbType.Numeric); // RevaluationReserveImpairmentClosingBalance
                await writer.WriteAsync(r.RevResReval,         NpgsqlDbType.Numeric); // RevaluationReserveRevaluation
                await writer.WriteAsync(r.RevResDisposal,      NpgsqlDbType.Numeric); // RevaluationReserveDisposal
                await writer.WriteAsync(r.DepAdj,              NpgsqlDbType.Numeric); // DepreciationAdjustment
                await writer.WriteAsync(r.TransferFrom,        NpgsqlDbType.Numeric); // TransferFromValue
                await writer.WriteAsync(r.TransferTo,          NpgsqlDbType.Numeric); // TransferToValue
                await writer.WriteAsync(r.CostOB,              NpgsqlDbType.Numeric); // CostOpeningBalance
                await writer.WriteAsync(r.CostCB,              NpgsqlDbType.Numeric); // CostClosingBalance
                await writer.WriteAsync(r.RefurbDT,            NpgsqlDbType.Numeric); // RefurbDTValue
                await writer.WriteAsync(r.RefurbCT,            NpgsqlDbType.Numeric); // RefurbCTValue
                await writer.WriteAsync(r.RefurbDep,           NpgsqlDbType.Numeric); // RefurbDepreciationValue
                await writer.WriteAsync(r.RefurbReval,         NpgsqlDbType.Numeric); // RefurbRevaluationValue
                await writer.WriteAsync(r.RefurbImp,           NpgsqlDbType.Numeric); // RefurbImpairmentValue
                await writer.WriteAsync(r.CarryingAmount,      NpgsqlDbType.Numeric); // CarryingAmount
                await writer.WriteAsync(ts,                    NpgsqlDbType.Timestamp); // DateCaptured
            }
            await writer.CompleteAsync();
        }

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_Register_Items""
            SET ""CurrentReplacementCostCRC"" = (
                SELECT s.""CostClosingBalance""
                FROM ""Asset_Transaction_Summary"" s
                WHERE COALESCE(s.""AssetRegisterItemID"", s.""AssetRegisterItem_ID"") = @assetRegisterItemId
                ORDER BY CAST(LEFT(COALESCE(s.""FinancialYear"", s.""FinYear""), 4) AS INTEGER) DESC,
                         s.""FinancialPeriod"" DESC
                LIMIT 1
            ),
            ""CarryingAmountClosingBalance"" = GREATEST((
                SELECT s.""CarryingAmount""
                FROM ""Asset_Transaction_Summary"" s
                WHERE COALESCE(s.""AssetRegisterItemID"", s.""AssetRegisterItem_ID"") = @assetRegisterItemId
                ORDER BY CAST(LEFT(COALESCE(s.""FinancialYear"", s.""FinYear""), 4) AS INTEGER) DESC,
                         s.""FinancialPeriod"" DESC
                LIMIT 1
            ), 0)
            WHERE ""AssetRegisterItem_ID"" = @assetRegisterItemId
              AND EXISTS (
                SELECT 1 FROM ""Asset_Transaction_Summary"" s2
                WHERE COALESCE(s2.""AssetRegisterItemID"", s2.""AssetRegisterItem_ID"") = @assetRegisterItemId
              )",
            new { assetRegisterItemId }, txn);
    }

    public async Task PopulateTransactionSummaryBulkRebuild(
        List<int> assetIds, string finYear, int fromPeriod)
    {
        if (assetIds == null || assetIds.Count == 0) return;

        // Compute numberOfMonths — same formula as PopulateTransactionSummarySingleInternal
        int calMonthStart = fromPeriod <= 6 ? fromPeriod + 6 : fromPeriod - 6;
        int calYearStart  = fromPeriod >= 7
            ? int.Parse(finYear.Substring(5, 4))
            : int.Parse(finYear.Substring(0, 4));
        var startDate = new DateTime(calYearStart, calMonthStart, 1);
        var now = DateTime.Now;
        int numberOfMonths = (int)((now.Year - startDate.Year) * 12 + now.Month - startDate.Month);
        if (numberOfMonths < 0) numberOfMonths = 0;

        // ob0 period (prior period before fromPeriod)
        string ob0FinYear;
        int ob0FinPeriod;
        if (fromPeriod == 1)
        {
            int prevFyStart = int.Parse(finYear.Substring(0, 4)) - 1;
            ob0FinYear   = $"{prevFyStart}/{prevFyStart + 1}";
            ob0FinPeriod = 12;
        }
        else
        {
            ob0FinYear   = finYear;
            ob0FinPeriod = fromPeriod - 1;
        }

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();
        try
        {
            var ids = assetIds.ToArray();

            // ── DELETE ATS rows for all assets from fromPeriod onwards ──────────────
            await conn.ExecuteAsync(@"
                DELETE FROM ""Asset_Transaction_Summary""
                WHERE (""AssetRegisterItemID"" = ANY(@ids) OR ""AssetRegisterItem_ID"" = ANY(@ids))
                  AND (
                    ""FinancialYear"" IS NULL
                    OR COALESCE(""FinancialYear"", ""FinYear"") > @finYear
                    OR (COALESCE(""FinancialYear"", ""FinYear"") = @finYear
                        AND COALESCE(""FinancialPeriod"", 0) >= @fromPeriod)
                  )",
                new { ids, finYear, fromPeriod }, txn);

            // ── Query A: ARI fields for all assets ───────────────────────────────────
            var ariRows = await conn.QueryAsync<dynamic>(@"
                SELECT ""AssetRegisterItem_ID"",
                       COALESCE(""RemainingUsefulLife"", ""UsefulLifeMonthComponent"") AS ""RemainingUsefulLife"",
                       COALESCE(""CurrentReplacementCostCRC"", 0) AS ""CRC"",
                       COALESCE(ABS(""AccumulatedDepreciationOpeningBalance""), ABS(""AccumulatedDepreciationClosingBalance""), 0) AS ""DepOpenBal"",
                       COALESCE(ABS(""AccumulatedImpairmentOpeningBalance""), ABS(""AccumulatedImpairmentClosingBalance""), 0) AS ""ImpOpenBal"",
                       COALESCE(ABS(""RevaluationOpeningBalance""), 0) AS ""RevOpenBal"",
                       COALESCE(ABS(""MovementInRevaluationReserve""), 0) AS ""MovRevReserve"",
                       COALESCE(ABS(""DepreciationOffset""), 0) AS ""DepOffset"",
                       COALESCE(""RevaluationImpairmentOpeningBalance"", 0) AS ""RevImpOB"",
                       COALESCE(""TransferToAmount"", 0) AS ""TransferToAmt"",
                       COALESCE(""PurchaseAmount"", 0) AS ""PurchaseAmount"",
                       ""AcquisitionDate""
                FROM ""Asset_Register_Items""
                WHERE ""AssetRegisterItem_ID"" = ANY(@ids)",
                new { ids }, txn);
            var ariByAsset = ariRows.ToDictionary(r => (int)r.AssetRegisterItem_ID);

            // ── Query B: ob0 ATS rows for all assets ────────────────────────────────
            var ob0Rows = await conn.QueryAsync<dynamic>(@"
                SELECT DISTINCT ON (COALESCE(""AssetRegisterItemID"", ""AssetRegisterItem_ID""))
                    COALESCE(""AssetRegisterItemID"", ""AssetRegisterItem_ID"") AS ""AssetID"",
                    ""CurrentValue"",
                    ""AccumulatedDepreciationClosingBalance"",
                    ""AccumulatedImpairmentClosingBalance"",
                    ""AccumulatedFairValueClosingBalance"",
                    ""AccumulatedRevaluationClosingBalance"",
                    ""AccumulatedImpairmentReversalClosingBalance"",
                    ""DisposalClosingBalance"",
                    ""AdditionClosingBalance"",
                    ""WorkInProgressClosingBalance"",
                    ""AmortisationClosingBalance"",
                    ""CorrectOfErrorClosingBalance"",
                    ""AdditionalCostClosingBalance"",
                    ""MovementInRevaluationReserve"",
                    ""DepreciationOffsetClosingBalance"",
                    ""ImpairmentSurplus"",
                    ""RevaluationReserveImpairmentClosingBalance"",
                    ""CostClosingBalance"",
                    ""RemainingUsefulLife""
                FROM ""Asset_Transaction_Summary""
                WHERE (""AssetRegisterItemID"" = ANY(@ids) OR ""AssetRegisterItem_ID"" = ANY(@ids))
                  AND COALESCE(""FinancialYear"", ""FinYear"") = @ob0FinYear
                  AND COALESCE(""FinancialPeriod"", 0) = @ob0FinPeriod
                ORDER BY COALESCE(""AssetRegisterItemID"", ""AssetRegisterItem_ID"")",
                new { ids, ob0FinYear, ob0FinPeriod }, txn);
            var ob0ByAsset = ob0Rows.ToDictionary(r => (int)r.AssetID);

            // ── Query C: ART aggregates for all assets across all periods ────────────
            var artRows = await conn.QueryAsync<dynamic>(@"
                SELECT
                    ""AssetRegisterItem_ID"",
                    ""FinancialYear"", ""FinancialPeriod"",
                    COALESCE(SUM(""DepreciationValue""), 0)                        AS ""DepreciationValue"",
                    COALESCE(SUM(""DepreciationAdjustment""), 0)                   AS ""DepreciationAdjustment"",
                    COALESCE(SUM(ABS(""ImpairmentValue"")), 0)                     AS ""ImpairmentValueAbs"",
                    COALESCE(SUM(""ImpairmentReversalValue""), 0)                  AS ""ImpairmentReversalValue"",
                    COALESCE(SUM(ABS(""ImpairmentReversalValue"")), 0)             AS ""ImpairmentReversalValueAbs"",
                    COALESCE(SUM(ABS(""RefurbImpairmentValue"")), 0)               AS ""RefurbImpairmentValueAbs"",
                    COALESCE(SUM(""FairValue""), 0)                                AS ""FairValue"",
                    COALESCE(SUM(ABS(""DisposalLossValue"")), 0)                   AS ""DisposalLossValueAbs"",
                    COALESCE(SUM(""DisposalLossValue""), 0)                        AS ""DisposalLossValue"",
                    COALESCE(SUM(ABS(""DisposalTotalValue"")), 0)                  AS ""DisposalTotalValueAbs"",
                    COALESCE(SUM(""DisposalTotalValue""), 0)                       AS ""DisposalTotalValue"",
                    COALESCE(SUM(""DisposalValue""), 0)                            AS ""DisposalValue"",
                    COALESCE(SUM(""RevaluationValue""), 0)                         AS ""RevaluationValue"",
                    COALESCE(SUM(""TransferFromValue""), 0)                        AS ""TransferFromValue"",
                    COALESCE(SUM(""TransferToValue""), 0)                          AS ""TransferToValue"",
                    COALESCE(SUM(""RefurbDTValue""), 0)                            AS ""RefurbDTValue"",
                    COALESCE(SUM(""RefurbCTValue""), 0)                            AS ""RefurbCTValue"",
                    COALESCE(SUM(""RefurbDepreciationValue""), 0)                  AS ""RefurbDepreciationValue"",
                    COALESCE(SUM(""RefurbRevaluationValue""), 0)                   AS ""RefurbRevaluationValue"",
                    COALESCE(SUM(""DepreciationOffset""), 0)                       AS ""DepreciationOffset"",
                    COALESCE(SUM(""MovementInRevaluationReserve""), 0)             AS ""MovementInRevaluationReserve"",
                    COALESCE(SUM(""RevaluationReserveImpairment""), 0)             AS ""RevaluationReserveImpairment"",
                    COALESCE(SUM(""RevaluationReserveImpairmentReversal""), 0)     AS ""RevaluationReserveImpairmentReversal"",
                    COALESCE(SUM(""RevaluationReserveRevaluation""), 0)            AS ""RevaluationReserveRevaluation"",
                    COALESCE(SUM(""RevaluationReserveDisposal""), 0)               AS ""RevaluationReserveDisposal"",
                    COALESCE(SUM(""ImpairmentSurplus""), 0)                        AS ""ImpairmentSurplus""
                FROM ""Asset_Register_Transactions""
                WHERE ""AssetRegisterItem_ID"" = ANY(@ids)
                GROUP BY ""AssetRegisterItem_ID"", ""FinancialYear"", ""FinancialPeriod""",
                new { ids }, txn);
            var artByKey = artRows.ToDictionary(r =>
                $"{(int)r.AssetRegisterItem_ID}|{(string)r.FinancialYear}|{(int)r.FinancialPeriod}");

            // ── Query D: Latest ART per period (type != 26) for all assets ───────────
            var ltRows = await conn.QueryAsync<dynamic>(@"
                SELECT DISTINCT ON (""AssetRegisterItem_ID"", ""FinancialYear"", ""FinancialPeriod"")
                    ""AssetRegisterItem_ID"",
                    ""FinancialYear"", ""FinancialPeriod"",
                    ""RemaingUsefulLife"", ""CurrentValue""
                FROM ""Asset_Register_Transactions""
                WHERE ""AssetRegisterItem_ID"" = ANY(@ids)
                  AND COALESCE(""TransactionTypeID"", 0) <> 26
                ORDER BY ""AssetRegisterItem_ID"", ""FinancialYear"", ""FinancialPeriod"", ""ID"" DESC",
                new { ids }, txn);
            var ltByKey = ltRows.ToDictionary(r =>
                $"{(int)r.AssetRegisterItem_ID}|{(string)r.FinancialYear}|{(int)r.FinancialPeriod}");

            // ── Query E: Pending refurb revaluations for all assets ─────────────────
            var refurbRows = await conn.QueryAsync<dynamic>(@"
                SELECT ar.""AssetRegisterID"", ar.""FinancialYear"", ar.""FinancialPeriod"",
                       COALESCE(SUM(COALESCE(ar.""Refurb_Revaluation"", 0)), 0) AS ""PendingReval""
                FROM ""Asset_Refurb"" ar
                WHERE ar.""AssetRegisterID"" = ANY(@ids)
                  AND (ar.""isApproved"" IS NULL OR ar.""isApproved"" = FALSE)
                  AND NOT EXISTS (
                      SELECT 1 FROM ""Asset_WorkflowInstances"" wi
                      WHERE wi.""entity_type"" = 'refurbishment'
                        AND wi.""mssql_reference_id"" = ar.""Asset_RefurbID""::TEXT
                        AND wi.""status"" = 'rejected'
                  )
                GROUP BY ar.""AssetRegisterID"", ar.""FinancialYear"", ar.""FinancialPeriod""",
                new { ids }, txn);
            var refurbByKey = refurbRows.ToDictionary(r =>
                $"{(int)r.AssetRegisterID}|{(string)r.FinancialYear}|{(int)r.FinancialPeriod}");

            // ── TransferIn flag for all assets ───────────────────────────────────────
            var transferInIds = (await conn.QueryAsync<int>(@"
                SELECT DISTINCT ""AssetRegisterItem_ID""
                FROM ""Asset_Register_Transactions""
                WHERE ""AssetRegisterItem_ID"" = ANY(@ids) AND ""TransferToValue"" > 0",
                new { ids }, txn)).ToHashSet();

            // ── isFirstPeriod check: assets that have NO ATS rows at all ─────────────
            var hasAtsIds = (await conn.QueryAsync<int>(@"
                SELECT DISTINCT COALESCE(""AssetRegisterItemID"", ""AssetRegisterItem_ID"")
                FROM ""Asset_Transaction_Summary""
                WHERE (""AssetRegisterItemID"" = ANY(@ids) OR ""AssetRegisterItem_ID"" = ANY(@ids))",
                new { ids }, txn)).ToHashSet();

            // ── C# rolling calculation for every asset, collecting all ATS rows ─────
            var ts = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

            // Each tuple: (assetId, 65 computed values, finYear, finPeriod)
            var allRows = new List<(
                int    AssetId,
                decimal RemainingUsefulLife, decimal CurrentValue,
                decimal AccDepOB, decimal DepreciationValue, decimal AccDepCB,
                decimal AccImpOB, decimal ImpairmentValue, decimal AccImpCB,
                decimal AccFairValOB, decimal FairValue, decimal AccFairValCB,
                decimal AccRevalOB, decimal RevaluationValue, decimal AccRevalCB,
                decimal AccImpRevOB, decimal ImpRevValue, decimal AccImpRevCB,
                decimal DisposalOB, decimal DisposalValue, decimal DisposalLossValue, decimal DisposalTotalValue, decimal DisposalCB,
                decimal AdditionOB, decimal AdditionVaue, decimal AdditionCB,
                decimal WipOB, decimal WipValue, decimal WipCB,
                decimal AmortOB, decimal AmortCB,
                decimal CorrErrOB, decimal CorrErrCB,
                decimal AddCostOB, decimal AddCostCB,
                decimal MovRevReserve,
                decimal DepOffsetOB, decimal DepOffset, decimal DepOffsetCB,
                decimal ImpSurplus,
                decimal RevImpOB, decimal RevImpValue, decimal RevImpRevVal, decimal RevImpCB,
                decimal RevResReval, decimal RevResDisposal,
                decimal DepAdj, decimal TransferFrom, decimal TransferTo,
                decimal CostOB, decimal CostCB,
                decimal RefurbDT, decimal RefurbCT, decimal RefurbDep, decimal RefurbReval, decimal RefurbImp,
                decimal CarryingAmount,
                string FinancialYear, int FinancialPeriod
            )>();

            for (int ai = 0; ai < assetIds.Count; ai++)
            {
                int assetId = assetIds[ai];
                if (!ariByAsset.TryGetValue(assetId, out var asset)) continue;

                decimal depOpenBal        = (decimal)(asset.DepOpenBal ?? 0m);
                decimal impOpenBal        = (decimal)(asset.ImpOpenBal ?? 0m);
                decimal revOpenBal        = (decimal)(asset.RevOpenBal ?? 0m);
                decimal movRevReserve     = (decimal)(asset.MovRevReserve ?? 0m);
                decimal depOffset         = (decimal)(asset.DepOffset ?? 0m);
                decimal revImpOB          = (decimal)(asset.RevImpOB ?? 0m);
                decimal crc               = (decimal)(asset.CRC ?? 0m);
                decimal transferToAmt     = (decimal)(asset.TransferToAmt ?? 0m);
                decimal purchaseAmount    = (decimal)(asset.PurchaseAmount ?? 0m);
                decimal remainingUsefulLife = (decimal)(asset.RemainingUsefulLife ?? 0m);
                decimal currentAmount     = crc;
                bool hasTransferIn        = transferToAmt == 0m && transferInIds.Contains(assetId);
                decimal costOpenBal       = (transferToAmt > 0m || hasTransferIn) ? 0m : (crc > 0m ? crc : purchaseAmount);
                decimal revaluationClosingBalance = revOpenBal + movRevReserve - depOffset - revImpOB;
                bool isFirstPeriod        = !hasAtsIds.Contains(assetId) && fromPeriod == 1;

                ob0ByAsset.TryGetValue(assetId, out var ob0);
                bool ob0Exists = ob0 != null;

                decimal? obCurrentValue  = ob0Exists ? (decimal?)(ob0.CurrentValue) : null;
                decimal obAccDepCB       = ob0Exists ? (decimal)(ob0.AccumulatedDepreciationClosingBalance ?? depOpenBal) : depOpenBal;
                decimal obAccImpCB       = ob0Exists ? (decimal)(ob0.AccumulatedImpairmentClosingBalance ?? impOpenBal)   : impOpenBal;
                decimal obAccFairValCB   = ob0Exists ? (decimal)(ob0.AccumulatedFairValueClosingBalance ?? 0m) : 0m;
                decimal obAccRevalCB     = ob0Exists ? (decimal)(ob0.AccumulatedRevaluationClosingBalance ?? revOpenBal) : revOpenBal;
                decimal obAccImpRevCB    = ob0Exists ? (decimal)(ob0.AccumulatedImpairmentReversalClosingBalance ?? 0m)   : 0m;
                decimal obDisposalCB     = ob0Exists ? (decimal)(ob0.DisposalClosingBalance ?? 0m)    : 0m;
                decimal obAdditionCB     = ob0Exists ? (decimal)(ob0.AdditionClosingBalance ?? 0m)    : 0m;
                decimal obWipCB          = ob0Exists ? (decimal)(ob0.WorkInProgressClosingBalance ?? 0m) : 0m;
                decimal obAmortCB        = ob0Exists ? (decimal)(ob0.AmortisationClosingBalance ?? 0m) : 0m;
                decimal obCorrErrCB      = ob0Exists ? (decimal)(ob0.CorrectOfErrorClosingBalance ?? 0m) : 0m;
                decimal obAddCostCB      = ob0Exists ? (decimal)(ob0.AdditionalCostClosingBalance ?? 0m) : 0m;
                decimal? obMovRevReserve = ob0Exists ? (decimal?)(ob0.MovementInRevaluationReserve) : null;
                decimal? obDepOffsetCB   = ob0Exists ? (decimal?)(ob0.DepreciationOffsetClosingBalance) : null;
                decimal obImpSurplus     = ob0Exists ? (decimal)(ob0.ImpairmentSurplus ?? 0m)      : 0m;
                decimal? obRevImpCB      = ob0Exists ? (decimal?)(ob0.RevaluationReserveImpairmentClosingBalance) : null;
                decimal obCostCB         = ob0Exists ? (decimal)(ob0.CostClosingBalance ?? costOpenBal) : costOpenBal;
                decimal? obRulOB         = ob0Exists ? (decimal?)(ob0.RemainingUsefulLife) : null;

                DateTime acqDate = (DateTime?)asset.AcquisitionDate ?? DateTime.MinValue;
                bool hasAcqDate  = asset.AcquisitionDate != null;

                string currentFinYear  = finYear;
                int    currentFinPeriod = fromPeriod;
                int    monthsRemaining  = numberOfMonths;

                for (int m = 0; m <= numberOfMonths; m++)
                {
                    string periodKey = $"{assetId}|{currentFinYear}|{currentFinPeriod}";
                    string artKey    = $"{assetId}|{currentFinYear}|{currentFinPeriod}";

                    dynamic? artRow = artByKey.TryGetValue(artKey, out var ar)   ? ar : null;
                    dynamic? ltRow  = ltByKey.TryGetValue(artKey,  out var lt)   ? lt : null;
                    decimal pendingRefurbReval = refurbByKey.TryGetValue($"{assetId}|{currentFinYear}|{currentFinPeriod}", out var prv) ? (decimal)(prv.PendingReval ?? 0m) : 0m;

                    decimal artDepValue        = artRow != null ? (decimal)(artRow.DepreciationValue ?? 0m)                    : 0m;
                    decimal artDepAdj          = artRow != null ? (decimal)(artRow.DepreciationAdjustment ?? 0m)               : 0m;
                    decimal artImpAbs          = artRow != null ? (decimal)(artRow.ImpairmentValueAbs ?? 0m)                   : 0m;
                    decimal artImpRevValue     = artRow != null ? (decimal)(artRow.ImpairmentReversalValue ?? 0m)              : 0m;
                    decimal artImpRevValueAbs  = artRow != null ? (decimal)(artRow.ImpairmentReversalValueAbs ?? 0m)           : 0m;
                    decimal artRefurbImpAbs    = artRow != null ? (decimal)(artRow.RefurbImpairmentValueAbs ?? 0m)             : 0m;
                    decimal artFairValue       = artRow != null ? (decimal)(artRow.FairValue ?? 0m)                            : 0m;
                    decimal artDisposalLossAbs = artRow != null ? (decimal)(artRow.DisposalLossValueAbs ?? 0m)                 : 0m;
                    decimal artDisposalLoss    = artRow != null ? (decimal)(artRow.DisposalLossValue ?? 0m)                    : 0m;
                    decimal artDisposalTotAbs  = artRow != null ? (decimal)(artRow.DisposalTotalValueAbs ?? 0m)                : 0m;
                    decimal artDisposalTot     = artRow != null ? (decimal)(artRow.DisposalTotalValue ?? 0m)                   : 0m;
                    decimal artDisposalValue   = artRow != null ? (decimal)(artRow.DisposalValue ?? 0m)                        : 0m;
                    decimal artRevalValue      = artRow != null ? (decimal)(artRow.RevaluationValue ?? 0m)                     : 0m;
                    decimal artTransferFrom    = artRow != null ? (decimal)(artRow.TransferFromValue ?? 0m)                    : 0m;
                    decimal artTransferTo      = artRow != null ? (decimal)(artRow.TransferToValue ?? 0m)                      : 0m;
                    decimal artRefurbDT        = artRow != null ? (decimal)(artRow.RefurbDTValue ?? 0m)                        : 0m;
                    decimal artRefurbCT        = artRow != null ? (decimal)(artRow.RefurbCTValue ?? 0m)                        : 0m;
                    decimal artRefurbDep       = artRow != null ? (decimal)(artRow.RefurbDepreciationValue ?? 0m)              : 0m;
                    decimal artRefurbReval     = artRow != null ? (decimal)(artRow.RefurbRevaluationValue ?? 0m)               : 0m;
                    decimal artDepOffset       = artRow != null ? (decimal)(artRow.DepreciationOffset ?? 0m)                   : 0m;
                    decimal artMovRevReserve   = artRow != null ? (decimal)(artRow.MovementInRevaluationReserve ?? 0m)         : 0m;
                    decimal artRevImpairment   = artRow != null ? (decimal)(artRow.RevaluationReserveImpairment ?? 0m)         : 0m;
                    decimal artRevImpReversal  = artRow != null ? (decimal)(artRow.RevaluationReserveImpairmentReversal ?? 0m) : 0m;
                    decimal artRevResReval     = artRow != null ? (decimal)(artRow.RevaluationReserveRevaluation ?? 0m)        : 0m;
                    decimal artRevResDisposal  = artRow != null ? (decimal)(artRow.RevaluationReserveDisposal ?? 0m)           : 0m;
                    decimal artImpSurplus      = artRow != null ? (decimal)(artRow.ImpairmentSurplus ?? 0m)                    : 0m;

                    decimal? ltRul = ltRow != null ? (decimal?)(ltRow.RemaingUsefulLife) : null;

                    bool isAcqMonth = false;
                    if (hasAcqDate)
                    {
                        var targetDate = now.AddMonths(-monthsRemaining);
                        isAcqMonth = acqDate.Year == targetDate.Year && acqDate.Month == targetDate.Month;
                    }
                    bool noTransfer = transferToAmt == 0m && artTransferTo == 0m;

                    // ── Same formulas as PopulateTransactionSummarySingleInternal ──

                    decimal rowRul = ltRul ?? obRulOB ?? remainingUsefulLife;

                    decimal rowCurVal;
                    if (obCurrentValue.HasValue)
                    {
                        rowCurVal = obCurrentValue.Value
                            - artDepValue - artDepAdj - artImpAbs + artRefurbImpAbs + artFairValue
                            + artImpRevValue - artDisposalLossAbs - artDisposalTotAbs
                            + artRevalValue - artTransferFrom + artTransferTo
                            + artRefurbDT - artRefurbCT + artRefurbDep;
                    }
                    else
                    {
                        rowCurVal = currentAmount
                            - obAccDepCB - artDepValue
                            - Math.Abs(obAccImpCB) - artImpAbs + artRefurbImpAbs
                            + Math.Abs(obAccImpRevCB) + artImpRevValueAbs
                            + obAccFairValCB + artFairValue + artTransferTo;
                    }

                    decimal accDepOB = obAccDepCB;
                    decimal accDepCB = obAccDepCB + artDepValue + artDepAdj - artRefurbDep;

                    decimal accImpOB = Math.Abs(obAccImpCB);
                    decimal accImpCB = obAccImpCB + artImpAbs - artImpRevValue - artRefurbImpAbs;

                    decimal accFairValOB = obAccFairValCB;
                    decimal accFairValCB = obAccFairValCB + artFairValue;

                    decimal accRevalOB = obAccRevalCB;
                    decimal revalBase  = (currentFinPeriod == 1 && isFirstPeriod) ? revaluationClosingBalance : obAccRevalCB;
                    decimal accRevalCB = revalBase
                        - artRevalValue - artRevImpairment + artRevImpReversal
                        - artRevResDisposal - artRefurbReval - pendingRefurbReval
                        - artDepOffset + artMovRevReserve;

                    decimal accImpRevOB = obAccImpRevCB;
                    decimal accImpRevCB = obAccImpRevCB + artImpRevValue;

                    decimal disposalOB = obDisposalCB;
                    decimal disposalCB = obDisposalCB - artDisposalLoss + artDisposalTot;

                    decimal additionOB   = currentFinPeriod == 1 ? 0m : obAdditionCB;
                    decimal additionVaue = (isAcqMonth && noTransfer) ? crc : 0m;
                    decimal additionCB;
                    if (currentFinPeriod == 1)
                        additionCB = (isAcqMonth && noTransfer) ? crc : 0m;
                    else
                        additionCB = obAdditionCB + ((isAcqMonth && noTransfer) ? purchaseAmount : 0m);

                    decimal wipOB = currentFinPeriod == 1 ? 0m : obWipCB;
                    decimal wipCB = (currentFinPeriod == 1 ? 0m : obWipCB) + artTransferFrom;

                    decimal amortCB   = obAmortCB;
                    decimal corrErrCB = obCorrErrCB;
                    decimal addCostCB = obAddCostCB;

                    decimal movRevReserve_out;
                    if (currentFinPeriod == 1 && isFirstPeriod)
                        movRevReserve_out = movRevReserve;
                    else
                        movRevReserve_out = (obMovRevReserve ?? movRevReserve) + artMovRevReserve;

                    decimal depOffsetOB;
                    if (currentFinPeriod == 1 && isFirstPeriod)
                        depOffsetOB = depOffset;
                    else if (currentFinPeriod == 1 && (obDepOffsetCB ?? 0m) > 0m)
                        depOffsetOB = 0m;
                    else
                        depOffsetOB = obDepOffsetCB ?? depOffset;

                    decimal depOffsetCB;
                    if (currentFinPeriod == 1 && isFirstPeriod)
                        depOffsetCB = depOffset + artDepOffset;
                    else if (currentFinPeriod == 1)
                        depOffsetCB = artDepOffset;
                    else
                        depOffsetCB = (obDepOffsetCB ?? depOffset) + artDepOffset;

                    decimal impSurplus = obImpSurplus + artImpSurplus;

                    decimal revImpOB_out;
                    if (currentFinPeriod == 1 && isFirstPeriod)
                        revImpOB_out = revImpOB;
                    else if (currentFinPeriod == 1)
                        revImpOB_out = 0m;
                    else
                        revImpOB_out = obRevImpCB ?? revImpOB;

                    decimal revImpCB;
                    if (currentFinPeriod == 1 && isFirstPeriod)
                        revImpCB = revImpOB + artRevImpairment - artRevImpReversal;
                    else if (currentFinPeriod == 1)
                        revImpCB = 0m;
                    else
                        revImpCB = (obRevImpCB ?? revImpOB) + artRevImpairment - artRevImpReversal;

                    decimal costOB = obCostCB;
                    decimal costCB = obCostCB + artRevalValue + artFairValue + artTransferTo
                                     - artTransferFrom + artRefurbDT - artRefurbCT - artDisposalValue;

                    decimal carryingAmount = Math.Max(0m, costCB - accDepCB - accImpCB);

                    allRows.Add((
                        assetId,
                        rowRul, rowCurVal,
                        accDepOB, artDepValue, accDepCB,
                        accImpOB, artImpAbs, accImpCB,
                        accFairValOB, artFairValue, accFairValCB,
                        accRevalOB, artRevalValue, accRevalCB,
                        accImpRevOB, artImpRevValue, accImpRevCB,
                        disposalOB, artDisposalValue, artDisposalLoss, artDisposalTot, disposalCB,
                        additionOB, additionVaue, additionCB,
                        wipOB, artTransferFrom, wipCB,
                        obAmortCB, amortCB,
                        obCorrErrCB, corrErrCB,
                        obAddCostCB, addCostCB,
                        movRevReserve_out,
                        depOffsetOB, artDepOffset, depOffsetCB,
                        impSurplus,
                        revImpOB_out, artRevImpairment, artRevImpReversal, revImpCB,
                        artRevResReval, artRevResDisposal,
                        artDepAdj, artTransferFrom, artTransferTo,
                        costOB, costCB,
                        artRefurbDT, artRefurbCT, artRefurbDep, artRefurbReval, artRefurbImpAbs,
                        carryingAmount,
                        currentFinYear, currentFinPeriod
                    ));

                    // Advance rolling ob state
                    obCurrentValue   = rowCurVal;
                    obAccDepCB       = accDepCB;
                    obAccImpCB       = accImpCB;
                    obAccFairValCB   = accFairValCB;
                    obAccRevalCB     = accRevalCB;
                    obAccImpRevCB    = accImpRevCB;
                    obDisposalCB     = disposalCB;
                    obAdditionCB     = additionCB;
                    obWipCB          = wipCB;
                    obMovRevReserve  = movRevReserve_out;
                    obDepOffsetCB    = depOffsetCB;
                    obImpSurplus     = impSurplus;
                    obRevImpCB       = revImpCB;
                    obCostCB         = costCB;
                    obRulOB          = rowRul;
                    isFirstPeriod    = false;

                    currentFinPeriod++;
                    monthsRemaining--;
                    if (currentFinPeriod > 12)
                    {
                        currentFinPeriod = 1;
                        int fyStart = int.Parse(currentFinYear.Substring(0, 4)) + 1;
                        currentFinYear = $"{fyStart}/{fyStart + 1}";
                    }
                }
            }

            // ── ONE binary COPY for all rows (all assets × all periods) ─────────────
            if (allRows.Count > 0)
            {
                var pgConn = (NpgsqlConnection)conn;
                await using var writer = await pgConn.BeginBinaryImportAsync(@"
                    COPY ""Asset_Transaction_Summary"" (
                        ""AssetRegisterItemID"", ""AssetRegisterItem_ID"", ""FinancialYear"", ""FinYear"", ""FinancialPeriod"",
                        ""RemainingUsefulLife"", ""CurrentValue"",
                        ""AccumulatedDepreciationOpeningBalance"", ""DepreciationValue"", ""AccumulatedDepreciationClosingBalance"",
                        ""AccumulatedImpairmentOpeningBalance"", ""ImpairmentValue"", ""AccumulatedImpairmentClosingBalance"",
                        ""AccumulatedFairValueOpeningBalance"", ""FairValue"", ""AccumulatedFairValueClosingBalance"",
                        ""AccumulatedRevaluationOpeningBalance"", ""RevaluationValue"", ""AccumulatedRevaluationClosingBalance"",
                        ""AccumulatedImpairmentReversalOpeningBalance"", ""ImpairmentReversalValue"", ""AccumulatedImpairmentReversalClosingBalance"",
                        ""DisposalOpeningBalance"", ""DisposalValue"", ""DisposalLossValue"", ""DisposalTotalValue"", ""DisposalClosingBalance"",
                        ""AdditionOpeningBalance"", ""AdditionVaue"", ""AdditionClosingBalance"",
                        ""WorkInProgressOpeningBalance"", ""WorkInProgressValue"", ""WorkInProgressClosingBalance"",
                        ""AmortisationOpeningBalance"", ""AmortisationValue"", ""AmortisationClosingBalance"",
                        ""CorrectionOfErrorOpeningBalance"", ""CorrectionOfErrorValue"", ""CorrectOfErrorClosingBalance"",
                        ""AdditionalCostOpeningBalance"", ""AdditionalCostValue"", ""AdditionalCostClosingBalance"",
                        ""MovementInRevaluationReserve"",
                        ""DepreciationOffsetOpeningBalance"", ""DepreciationOffset"", ""DepreciationOffsetClosingBalance"",
                        ""ImpairmentSurplus"",
                        ""RevaluationReserveImpairmentOpeningBalance"", ""RevaluationReserveImpairment"",
                        ""RevaluationReserveImpairmentReversal"", ""RevaluationReserveImpairmentClosingBalance"",
                        ""RevaluationReserveRevaluation"", ""RevaluationReserveDisposal"",
                        ""DepreciationAdjustment"",
                        ""TransferFromValue"", ""TransferToValue"",
                        ""CostOpeningBalance"", ""CostClosingBalance"",
                        ""RefurbDTValue"", ""RefurbCTValue"", ""RefurbDepreciationValue"", ""RefurbRevaluationValue"",
                        ""RefurbImpairmentValue"",
                        ""CarryingAmount"", ""DateCaptured""
                    ) FROM STDIN (FORMAT BINARY)");

                for (int i = 0; i < allRows.Count; i++)
                {
                    var r = allRows[i];
                    await writer.StartRowAsync();
                    await writer.WriteAsync(r.AssetId,            NpgsqlDbType.Integer);  // AssetRegisterItemID
                    await writer.WriteAsync(r.AssetId,            NpgsqlDbType.Integer);  // AssetRegisterItem_ID
                    await writer.WriteAsync(r.FinancialYear,      NpgsqlDbType.Varchar);  // FinancialYear
                    await writer.WriteAsync(r.FinancialYear,      NpgsqlDbType.Varchar);  // FinYear
                    await writer.WriteAsync(r.FinancialPeriod,    NpgsqlDbType.Integer);  // FinancialPeriod
                    await writer.WriteAsync(r.RemainingUsefulLife, NpgsqlDbType.Numeric); // RemainingUsefulLife
                    await writer.WriteAsync(r.CurrentValue,        NpgsqlDbType.Numeric); // CurrentValue
                    await writer.WriteAsync(r.AccDepOB,            NpgsqlDbType.Numeric); // AccumulatedDepreciationOpeningBalance
                    await writer.WriteAsync(r.DepreciationValue,   NpgsqlDbType.Numeric); // DepreciationValue
                    await writer.WriteAsync(r.AccDepCB,            NpgsqlDbType.Numeric); // AccumulatedDepreciationClosingBalance
                    await writer.WriteAsync(r.AccImpOB,            NpgsqlDbType.Numeric); // AccumulatedImpairmentOpeningBalance
                    await writer.WriteAsync(r.ImpairmentValue,     NpgsqlDbType.Numeric); // ImpairmentValue
                    await writer.WriteAsync(r.AccImpCB,            NpgsqlDbType.Numeric); // AccumulatedImpairmentClosingBalance
                    await writer.WriteAsync(r.AccFairValOB,        NpgsqlDbType.Numeric); // AccumulatedFairValueOpeningBalance
                    await writer.WriteAsync(r.FairValue,           NpgsqlDbType.Numeric); // FairValue
                    await writer.WriteAsync(r.AccFairValCB,        NpgsqlDbType.Numeric); // AccumulatedFairValueClosingBalance
                    await writer.WriteAsync(r.AccRevalOB,          NpgsqlDbType.Numeric); // AccumulatedRevaluationOpeningBalance
                    await writer.WriteAsync(r.RevaluationValue,    NpgsqlDbType.Numeric); // RevaluationValue
                    await writer.WriteAsync(r.AccRevalCB,          NpgsqlDbType.Numeric); // AccumulatedRevaluationClosingBalance
                    await writer.WriteAsync(r.AccImpRevOB,         NpgsqlDbType.Numeric); // AccumulatedImpairmentReversalOpeningBalance
                    await writer.WriteAsync(r.ImpRevValue,         NpgsqlDbType.Numeric); // ImpairmentReversalValue
                    await writer.WriteAsync(r.AccImpRevCB,         NpgsqlDbType.Numeric); // AccumulatedImpairmentReversalClosingBalance
                    await writer.WriteAsync(r.DisposalOB,          NpgsqlDbType.Numeric); // DisposalOpeningBalance
                    await writer.WriteAsync(r.DisposalValue,       NpgsqlDbType.Numeric); // DisposalValue
                    await writer.WriteAsync(r.DisposalLossValue,   NpgsqlDbType.Numeric); // DisposalLossValue
                    await writer.WriteAsync(r.DisposalTotalValue,  NpgsqlDbType.Numeric); // DisposalTotalValue
                    await writer.WriteAsync(r.DisposalCB,          NpgsqlDbType.Numeric); // DisposalClosingBalance
                    await writer.WriteAsync(r.AdditionOB,          NpgsqlDbType.Numeric); // AdditionOpeningBalance
                    await writer.WriteAsync(r.AdditionVaue,        NpgsqlDbType.Numeric); // AdditionVaue
                    await writer.WriteAsync(r.AdditionCB,          NpgsqlDbType.Numeric); // AdditionClosingBalance
                    await writer.WriteAsync(r.WipOB,               NpgsqlDbType.Numeric); // WorkInProgressOpeningBalance
                    await writer.WriteAsync(r.WipValue,            NpgsqlDbType.Numeric); // WorkInProgressValue
                    await writer.WriteAsync(r.WipCB,               NpgsqlDbType.Numeric); // WorkInProgressClosingBalance
                    await writer.WriteAsync(r.AmortOB,             NpgsqlDbType.Numeric); // AmortisationOpeningBalance
                    await writer.WriteAsync(0m,                    NpgsqlDbType.Numeric); // AmortisationValue
                    await writer.WriteAsync(r.AmortCB,             NpgsqlDbType.Numeric); // AmortisationClosingBalance
                    await writer.WriteAsync(r.CorrErrOB,           NpgsqlDbType.Numeric); // CorrectionOfErrorOpeningBalance
                    await writer.WriteAsync(0m,                    NpgsqlDbType.Numeric); // CorrectionOfErrorValue
                    await writer.WriteAsync(r.CorrErrCB,           NpgsqlDbType.Numeric); // CorrectOfErrorClosingBalance
                    await writer.WriteAsync(r.AddCostOB,           NpgsqlDbType.Numeric); // AdditionalCostOpeningBalance
                    await writer.WriteAsync(0m,                    NpgsqlDbType.Numeric); // AdditionalCostValue
                    await writer.WriteAsync(r.AddCostCB,           NpgsqlDbType.Numeric); // AdditionalCostClosingBalance
                    await writer.WriteAsync(r.MovRevReserve,       NpgsqlDbType.Numeric); // MovementInRevaluationReserve
                    await writer.WriteAsync(r.DepOffsetOB,         NpgsqlDbType.Numeric); // DepreciationOffsetOpeningBalance
                    await writer.WriteAsync(r.DepOffset,           NpgsqlDbType.Numeric); // DepreciationOffset
                    await writer.WriteAsync(r.DepOffsetCB,         NpgsqlDbType.Numeric); // DepreciationOffsetClosingBalance
                    await writer.WriteAsync(r.ImpSurplus,          NpgsqlDbType.Numeric); // ImpairmentSurplus
                    await writer.WriteAsync(r.RevImpOB,            NpgsqlDbType.Numeric); // RevaluationReserveImpairmentOpeningBalance
                    await writer.WriteAsync(r.RevImpValue,         NpgsqlDbType.Numeric); // RevaluationReserveImpairment
                    await writer.WriteAsync(r.RevImpRevVal,        NpgsqlDbType.Numeric); // RevaluationReserveImpairmentReversal
                    await writer.WriteAsync(r.RevImpCB,            NpgsqlDbType.Numeric); // RevaluationReserveImpairmentClosingBalance
                    await writer.WriteAsync(r.RevResReval,         NpgsqlDbType.Numeric); // RevaluationReserveRevaluation
                    await writer.WriteAsync(r.RevResDisposal,      NpgsqlDbType.Numeric); // RevaluationReserveDisposal
                    await writer.WriteAsync(r.DepAdj,              NpgsqlDbType.Numeric); // DepreciationAdjustment
                    await writer.WriteAsync(r.TransferFrom,        NpgsqlDbType.Numeric); // TransferFromValue
                    await writer.WriteAsync(r.TransferTo,          NpgsqlDbType.Numeric); // TransferToValue
                    await writer.WriteAsync(r.CostOB,              NpgsqlDbType.Numeric); // CostOpeningBalance
                    await writer.WriteAsync(r.CostCB,              NpgsqlDbType.Numeric); // CostClosingBalance
                    await writer.WriteAsync(r.RefurbDT,            NpgsqlDbType.Numeric); // RefurbDTValue
                    await writer.WriteAsync(r.RefurbCT,            NpgsqlDbType.Numeric); // RefurbCTValue
                    await writer.WriteAsync(r.RefurbDep,           NpgsqlDbType.Numeric); // RefurbDepreciationValue
                    await writer.WriteAsync(r.RefurbReval,         NpgsqlDbType.Numeric); // RefurbRevaluationValue
                    await writer.WriteAsync(r.RefurbImp,           NpgsqlDbType.Numeric); // RefurbImpairmentValue
                    await writer.WriteAsync(r.CarryingAmount,      NpgsqlDbType.Numeric); // CarryingAmount
                    await writer.WriteAsync(ts,                    NpgsqlDbType.Timestamp); // DateCaptured
                }
                await writer.CompleteAsync();
            }

            // ── ONE bulk ARI UPDATE for all assets ───────────────────────────────────
            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Register_Items"" ari
                SET
                    ""CurrentReplacementCostCRC"" = s.cost_cb,
                    ""CarryingAmountClosingBalance"" = GREATEST(s.carrying, 0)
                FROM (
                    SELECT DISTINCT ON (COALESCE(s2.""AssetRegisterItemID"", s2.""AssetRegisterItem_ID""))
                        COALESCE(s2.""AssetRegisterItemID"", s2.""AssetRegisterItem_ID"") AS asset_id,
                        s2.""CostClosingBalance"" AS cost_cb,
                        s2.""CarryingAmount"" AS carrying
                    FROM ""Asset_Transaction_Summary"" s2
                    WHERE (s2.""AssetRegisterItemID"" = ANY(@ids) OR s2.""AssetRegisterItem_ID"" = ANY(@ids))
                    ORDER BY COALESCE(s2.""AssetRegisterItemID"", s2.""AssetRegisterItem_ID""),
                             CAST(LEFT(COALESCE(s2.""FinancialYear"", s2.""FinYear""), 4) AS INTEGER) DESC,
                             s2.""FinancialPeriod"" DESC
                ) s
                WHERE ari.""AssetRegisterItem_ID"" = s.asset_id",
                new { ids }, txn);

            await txn.CommitAsync();
        }
        catch
        {
            await txn.RollbackAsync();
            throw;
        }
    }

    public async Task PopulateTransactionSummaryForUpload(DbConnection conn, DbTransaction txn,
        int assetRegisterItemId, string finYear, int startPeriod, int currentPeriod)
    {
        var asset = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""AssetRegisterItem_ID"",
                   COALESCE(""RemainingUsefulLife"", ""UsefulLifeMonthComponent"") AS ""RemainingUsefulLife"",
                   COALESCE(""CurrentReplacementCostCRC"", 0) AS ""CRC"",
                   COALESCE(ABS(""AccumulatedDepreciationOpeningBalance""), ABS(""AccumulatedDepreciationClosingBalance""), 0) AS ""DepOpenBal"",
                   COALESCE(ABS(""AccumulatedImpairmentOpeningBalance""), ABS(""AccumulatedImpairmentClosingBalance""), 0) AS ""ImpOpenBal"",
                   COALESCE(ABS(""RevaluationOpeningBalance""), 0) AS ""RevOpenBal"",
                   COALESCE(ABS(""MovementInRevaluationReserve""), 0) AS ""MovRevReserve"",
                   COALESCE(ABS(""DepreciationOffset""), 0) AS ""DepOffset"",
                   COALESCE(""RevaluationImpairmentOpeningBalance"", 0) AS ""RevImpOB"",
                   COALESCE(""TransferToAmount"", 0) AS ""TransferToAmt"",
                   COALESCE(""PurchaseAmount"", 0) AS ""PurchaseAmount"",
                   ""AcquisitionDate""
            FROM ""Asset_Register_Items""
            WHERE ""AssetRegisterItem_ID"" = @assetRegisterItemId",
            new { assetRegisterItemId }, txn);

        if (asset is null) return;

        decimal depOpenBal = (decimal)(asset.DepOpenBal ?? 0m);
        decimal impOpenBal = (decimal)(asset.ImpOpenBal ?? 0m);
        decimal revOpenBal = (decimal)(asset.RevOpenBal ?? 0m);
        decimal movRevReserve = (decimal)(asset.MovRevReserve ?? 0m);
        decimal depOffsetVal = (decimal)(asset.DepOffset ?? 0m);
        decimal revImpOB = (decimal)(asset.RevImpOB ?? 0m);
        decimal crc = (decimal)(asset.CRC ?? 0m);
        decimal transferToAmt = (decimal)(asset.TransferToAmt ?? 0m);
        decimal purchaseAmount = (decimal)(asset.PurchaseAmount ?? 0m);
        decimal costOpenBal = transferToAmt == 0m ? purchaseAmount : 0m;
        decimal revaluationClosingBalance = revOpenBal + movRevReserve - depOffsetVal - revImpOB;
        decimal remainingUsefulLife = (decimal)(asset.RemainingUsefulLife ?? 0m);
        decimal currentValue = crc - depOpenBal - impOpenBal;
        decimal carryingAmount = costOpenBal - depOpenBal - impOpenBal;

        DateTime? acqDate = (DateTime?)asset.AcquisitionDate;

        string iterFinYear = finYear;
        int iterPeriod = startPeriod;

        for (int p = startPeriod; p <= currentPeriod; p++)
        {
            int calMonth = iterPeriod <= 6 ? iterPeriod + 6 : iterPeriod - 6;
            int calYear = iterPeriod >= 7 ? int.Parse(iterFinYear.Substring(5, 4)) : int.Parse(iterFinYear.Substring(0, 4));
            var periodStart = new DateTime(calYear, calMonth, 1);

            decimal additionValue = 0m;
            if (acqDate.HasValue && transferToAmt == 0m)
            {
                var acqMonth = new DateTime(acqDate.Value.Year, acqDate.Value.Month, 1);
                if (acqMonth == periodStart)
                    additionValue = crc;
            }

            decimal additionOB = iterPeriod == 1 ? 0m : additionValue;
            decimal additionCB = iterPeriod == 1 ? additionValue : additionValue;

            await conn.ExecuteAsync(@"
                INSERT INTO ""Asset_Transaction_Summary"" (
                    ""AssetRegisterItemID"", ""AssetRegisterItem_ID"", ""FinancialYear"", ""FinYear"", ""FinancialPeriod"",
                    ""RemainingUsefulLife"", ""CurrentValue"",
                    ""AccumulatedDepreciationOpeningBalance"", ""DepreciationValue"", ""AccumulatedDepreciationClosingBalance"",
                    ""AccumulatedImpairmentOpeningBalance"", ""ImpairmentValue"", ""AccumulatedImpairmentClosingBalance"",
                    ""AccumulatedFairValueOpeningBalance"", ""FairValue"", ""AccumulatedFairValueClosingBalance"",
                    ""AccumulatedRevaluationOpeningBalance"", ""RevaluationValue"", ""AccumulatedRevaluationClosingBalance"",
                    ""AccumulatedImpairmentReversalOpeningBalance"", ""ImpairmentReversalValue"", ""AccumulatedImpairmentReversalClosingBalance"",
                    ""DisposalOpeningBalance"", ""DisposalValue"", ""DisposalLossValue"", ""DisposalTotalValue"", ""DisposalClosingBalance"",
                    ""AdditionOpeningBalance"", ""AdditionVaue"", ""AdditionClosingBalance"",
                    ""WorkInProgressOpeningBalance"", ""WorkInProgressValue"", ""WorkInProgressClosingBalance"",
                    ""AmortisationOpeningBalance"", ""AmortisationValue"", ""AmortisationClosingBalance"",
                    ""CorrectionOfErrorOpeningBalance"", ""CorrectionOfErrorValue"", ""CorrectOfErrorClosingBalance"",
                    ""AdditionalCostOpeningBalance"", ""AdditionalCostValue"", ""AdditionalCostClosingBalance"",
                    ""MovementInRevaluationReserve"",
                    ""DepreciationOffsetOpeningBalance"", ""DepreciationOffset"", ""DepreciationOffsetClosingBalance"",
                    ""ImpairmentSurplus"",
                    ""RevaluationReserveImpairmentOpeningBalance"", ""RevaluationReserveImpairment"",
                    ""RevaluationReserveImpairmentReversal"", ""RevaluationReserveImpairmentClosingBalance"",
                    ""RevaluationReserveRevaluation"", ""RevaluationReserveDisposal"",
                    ""DepreciationAdjustment"",
                    ""TransferFromValue"", ""TransferToValue"",
                    ""CostOpeningBalance"", ""CostClosingBalance"",
                    ""RefurbDTValue"", ""RefurbCTValue"", ""RefurbDepreciationValue"", ""RefurbRevaluationValue"",
                    ""RefurbImpairmentValue"",
                    ""CarryingAmount"", ""DateCaptured""
                ) VALUES (
                    @assetId, @assetId, @iterFinYear, @iterFinYear, @iterPeriod,
                    @rul, @currentValue,
                    @depOB, 0, @depOB,
                    @impOB, 0, @impOB,
                    0, 0, 0,
                    @revOB, 0, @revalClosing,
                    0, 0, 0,
                    0, 0, 0, 0, 0,
                    @additionOB, @additionValue, @additionCB,
                    0, 0, 0,
                    0, 0, 0,
                    0, 0, 0,
                    0, 0, 0,
                    @movRevReserve,
                    @depOffset, 0, @depOffset,
                    0,
                    @revImpOB, 0, 0, @revImpOB,
                    0, 0,
                    0,
                    0, 0,
                    @costOB, @costOB,
                    0, 0, 0, 0,
                    0,
                    @carrying, NOW()
                )",
                new
                {
                    assetId = assetRegisterItemId,
                    iterFinYear,
                    iterPeriod,
                    rul = remainingUsefulLife,
                    currentValue,
                    depOB = depOpenBal,
                    impOB = impOpenBal,
                    revOB = revOpenBal,
                    revalClosing = revaluationClosingBalance,
                    additionOB,
                    additionValue,
                    additionCB,
                    movRevReserve,
                    depOffset = depOffsetVal,
                    revImpOB,
                    costOB = costOpenBal,
                    carrying = carryingAmount
                }, txn);

            iterPeriod++;
            if (iterPeriod > 12)
            {
                iterPeriod = 1;
                int fyStart = int.Parse(iterFinYear.Substring(0, 4)) + 1;
                iterFinYear = $"{fyStart}/{fyStart + 1}";
            }
        }
    }

    public async Task UpdateTransactionSummary(int assetRegisterItemId, string? finYear = null)
    {
        var fy = GetCurrentFinancialPeriod();
        var year = finYear ?? fy.year;

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var asset = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""PurchaseAmount"", ""AccumulatedDepreciationClosingBalance"", ""AccumulatedImpairmentClosingBalance"",
                   ""CarryingAmountClosingBalance"", ""RevaluationOpeningBalance""
            FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetRegisterItemId", new { assetRegisterItemId });

        if (asset is null) return;

        var existing = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""ID"" FROM ""Asset_Transaction_Summary""
            WHERE ""AssetRegisterItem_ID"" = @assetRegisterItemId AND ""FinYear"" = @year",
            new { assetRegisterItemId, year });

        if (existing is null)
        {
            await conn.ExecuteAsync(@"
                INSERT INTO ""Asset_Transaction_Summary""
                    (""AssetRegisterItem_ID"", ""AssetRegisterItemID"", ""FinYear"", ""FinancialYear"",
                     ""CostOpeningBalance"", ""CostClosingBalance"",
                     ""AccumulatedDepreciationOpeningBalance"", ""AccumulatedDepreciationClosingBalance"",
                     ""CarryingAmount"")
                VALUES (@assetRegisterItemId, @assetRegisterItemId, @year, @year,
                        @cost, @cost, @dep, @dep, @carrying)",
                new
                {
                    assetRegisterItemId,
                    year,
                    cost = (decimal)(asset.PurchaseAmount ?? 0m),
                    dep = (decimal)(asset.AccumulatedDepreciationClosingBalance ?? 0m),
                    carrying = (decimal)(asset.CarryingAmountClosingBalance ?? 0m)
                });
        }
        else
        {
            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Transaction_Summary""
                SET ""CostClosingBalance"" = @cost, ""AccumulatedDepreciationClosingBalance"" = @dep, ""CarryingAmount"" = @carrying
                WHERE ""ID"" = @id",
                new
                {
                    id = (int)existing.ID,
                    cost = (decimal)(asset.PurchaseAmount ?? 0m),
                    dep = (decimal)(asset.AccumulatedDepreciationClosingBalance ?? 0m),
                    carrying = (decimal)(asset.CarryingAmountClosingBalance ?? 0m)
                });
        }
    }

    public async Task<string> GetApprovalMethod(DbConnection conn, DbTransaction? txn = null)
    {
        var method = await conn.QueryFirstOrDefaultAsync<string>(
            @"SELECT COALESCE(""approval_method"", 'Manual') FROM ""Asset_OrganisationSettings"" OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY",
            transaction: txn);
        return method ?? "Manual";
    }

    public async Task<EffectiveAssetValues> GetEffectiveAssetValues(
        DbConnection conn, int assetId, DateTime upToDate, DbTransaction? txn = null)
    {
        var asset = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT a.""PurchaseAmount"", a.""ResidualValue"",
                     COALESCE(s.""CarryingAmount"", a.""CarryingAmountClosingBalance"", a.""CurrentAmount"", 0) AS ""CarryingAmountClosingBalance"",
                     COALESCE(s.""AccumulatedDepreciationClosingBalance"", a.""AccumulatedDepreciationClosingBalance"", 0) AS ""AccumulatedDepreciationClosingBalance"",
                     COALESCE(s.""AccumulatedImpairmentClosingBalance"", a.""AccumulatedImpairmentClosingBalance"", 0) AS ""AccumulatedImpairmentClosingBalance"",
                     COALESCE(s.""AccumulatedRevaluationClosingBalance"", a.""RevaluationReserveClosingBalance"", 0) AS ""RevaluationReserveClosingBalance"",
                     COALESCE(s.""RemainingUsefulLife"", a.""RemainingUsefulLife"", 0) AS ""RemainingUsefulLife""
              FROM ""Asset_Register_Items"" a
              LEFT JOIN LATERAL (
                  SELECT ""CarryingAmount"", ""AccumulatedDepreciationClosingBalance"",
                         ""AccumulatedImpairmentClosingBalance"", ""AccumulatedRevaluationClosingBalance"",
                         ""RemainingUsefulLife""
                  FROM ""Asset_Transaction_Summary""
                  WHERE COALESCE(""AssetRegisterItemID"", ""AssetRegisterItem_ID"") = @assetId
                  ORDER BY CAST(LEFT(COALESCE(""FinancialYear"", '0000/0000'), 4) AS INTEGER) DESC,
                           ""FinancialPeriod"" DESC, ""ID"" DESC
                  LIMIT 1
              ) s ON true
              WHERE a.""AssetRegisterItem_ID"" = @assetId",
            new { assetId }, txn);

        if (asset == null)
            return new EffectiveAssetValues();

        decimal carrying = (decimal)(asset.CarryingAmountClosingBalance ?? 0m);
        decimal accDep = (decimal)(asset.AccumulatedDepreciationClosingBalance ?? 0m);
        decimal accImp = (decimal)(asset.AccumulatedImpairmentClosingBalance ?? 0m);
        decimal revalReserve = (decimal)(asset.RevaluationReserveClosingBalance ?? 0m);
        decimal rul = (decimal)(asset.RemainingUsefulLife ?? 0m);
        decimal purchaseAmount = (decimal)(asset.PurchaseAmount ?? 0m);
        decimal residualValue = (decimal)(asset.ResidualValue ?? 0m);

        var pendingRevals = await conn.QueryAsync<dynamic>(
            @"SELECT ""RevalautionAmt"", ""SurplusAmount"", ""RevalutionDate""
              FROM ""Asset_Revaluations""
              WHERE ""AssetRegisterID"" = @assetId
                AND COALESCE(""Approved"", FALSE) = FALSE
                AND ""PostDateTime"" IS NULL
                AND (""RejectedDate"" IS NULL)
                AND ""RevalutionDate"" <= @upToDate
              ORDER BY ""RevalutionDate"" ASC",
            new { assetId, upToDate }, txn);

        foreach (var r in pendingRevals)
        {
            decimal adj = (decimal)(r.RevalautionAmt ?? 0m);
            decimal reserveAdj = (decimal)(r.SurplusAmount ?? 0m);
            carrying += adj;
            revalReserve += reserveAdj;
        }

        var pendingImpairments = await conn.QueryAsync<dynamic>(
            @"SELECT ""ImpairmentAmount"", ""CatchUpDepreciation"", ""ImpairmentDate""
              FROM ""Asset_Impairment""
              WHERE ""Asset_ItemID"" = @assetId
                AND COALESCE(""Approved"", 0) = 0
                AND COALESCE(""IsRejected"", 0) = 0
                AND ""ImpairmentDate"" <= @upToDate
              ORDER BY ""ImpairmentDate"" ASC",
            new { assetId, upToDate }, txn);

        foreach (var imp in pendingImpairments)
        {
            decimal impAmt = (decimal)(imp.ImpairmentAmount ?? 0m);
            decimal catchUp = (decimal)(imp.CatchUpDepreciation ?? 0m);
            carrying -= (impAmt + catchUp);
            accDep += catchUp;
            accImp += impAmt;
        }

        if (carrying < 0) carrying = 0;

        return new EffectiveAssetValues
        {
            CarryingAmount = carrying,
            AccumulatedDepreciation = accDep,
            AccumulatedImpairment = accImp,
            RevaluationReserve = revalReserve,
            RemainingUsefulLifeMonths = rul,
            PurchaseAmount = purchaseAmount,
            ResidualValue = residualValue
        };
    }

    public async Task<(int impairmentsUpdated, int disposalsUpdated)> RecalculatePendingAfterDate(
        DbConnection conn, int assetId, DateTime afterDate, string? finYear = null)
    {
        int impairmentsUpdated = 0;
        int disposalsUpdated = 0;
        var fy = finYear ?? "";

        var pendingImpairments = await conn.QueryAsync<dynamic>(
            @"SELECT ""Impairment_ID"" AS ""AssetImpairment_ID"", ""ImpairmentDate"", ""ImpairmentAmount"", ""CatchUpDepreciation""
              FROM ""Asset_Impairment""
              WHERE ""Asset_ItemID"" = @assetId
                AND COALESCE(""Approved"", 0) = 0
                AND COALESCE(""IsRejected"", 0) = 0
                AND ""ImpairmentDate"" > @afterDate
                AND (@fy = '' OR ""FinYear"" = @fy)
              ORDER BY ""ImpairmentDate"" ASC",
            new { assetId, afterDate, fy });

        foreach (var imp in pendingImpairments)
        {
            DateTime impDate = (DateTime)imp.ImpairmentDate;
            var projected = await GetEffectiveAssetValues(conn, assetId, impDate);
            decimal catchUp = (decimal)(imp.CatchUpDepreciation ?? 0m);
            decimal impAmt = (decimal)(imp.ImpairmentAmount ?? 0m);
            decimal newCarrying = projected.CarryingAmount - catchUp - impAmt;
            if (newCarrying < 0) newCarrying = 0;

            await conn.ExecuteAsync(
                @"UPDATE ""Asset_Impairment""
                  SET ""PreviousCarryingAmount"" = @prev, ""NewCarryingAmount"" = @newCarry
                  WHERE ""Impairment_ID"" = @id",
                new { prev = projected.CarryingAmount, newCarry = newCarrying, id = (int)imp.AssetImpairment_ID });
            impairmentsUpdated++;
        }

        var pendingDisposals = await conn.QueryAsync<dynamic>(
            @"SELECT ""AssetDisposal_ID"", ""DisposalDate"", ""SalePrice""
              FROM ""Asset_Disposal""
              WHERE ""AssetItemID"" = @assetId
                AND ""Status"" = 'Pending'
                AND ""DisposalDate"" > @afterDate
                AND (@fy = '' OR ""FinYear"" = @fy)
              ORDER BY ""DisposalDate"" ASC",
            new { assetId, afterDate, fy });

        foreach (var d in pendingDisposals)
        {
            DateTime dispDate = (DateTime)d.DisposalDate;
            var projected = await GetEffectiveAssetValues(conn, assetId, dispDate);
            decimal salePrice = (decimal)(d.SalePrice ?? 0m);
            decimal profitLoss = salePrice - projected.CarryingAmount;

            await conn.ExecuteAsync(
                @"UPDATE ""Asset_Disposal""
                  SET ""CarryingAmount"" = @carrying, ""AmountProfitLoss"" = @pl
                  WHERE ""AssetDisposal_ID"" = @id",
                new { carrying = projected.CarryingAmount, pl = profitLoss, id = (int)d.AssetDisposal_ID });
            disposalsUpdated++;
        }

        return (impairmentsUpdated, disposalsUpdated);
    }

    public async Task<bool> HasPendingTransactionInMonth(
        DbConnection conn, string txnType, int assetId, DateTime txnDate)
    {
        int month = txnDate.Month;
        int year = txnDate.Year;

        if (txnType == "impairment")
        {
            var count = await conn.QuerySingleAsync<int>(
                @"SELECT COUNT(*) FROM ""Asset_Impairment""
                  WHERE ""Asset_ItemID"" = @assetId
                    AND COALESCE(""IsReversal"", 0) = 0
                    AND COALESCE(""IsRejected"", 0) = 0
                    AND MONTH(""ImpairmentDate"") = @month
                    AND YEAR(""ImpairmentDate"") = @year",
                new { assetId, month, year });
            return count > 0;
        }
        if (txnType == "reversal")
        {
            var count = await conn.QuerySingleAsync<int>(
                @"SELECT COUNT(*) FROM ""Asset_Impairment""
                  WHERE ""Asset_ItemID"" = @assetId
                    AND COALESCE(""IsReversal"", 0) = 1
                    AND COALESCE(""IsRejected"", 0) = 0
                    AND MONTH(""ImpairmentDate"") = @month
                    AND YEAR(""ImpairmentDate"") = @year",
                new { assetId, month, year });
            return count > 0;
        }
        if (txnType == "disposal")
        {
            var count = await conn.QuerySingleAsync<int>(
                @"SELECT COUNT(*) FROM ""Asset_Disposal""
                  WHERE ""AssetItemID"" = @assetId
                    AND ""Status"" != 'Rejected'
                    AND MONTH(""DisposalDate"") = @month
                    AND YEAR(""DisposalDate"") = @year",
                new { assetId, month, year });
            return count > 0;
        }
        if (txnType == "revaluation")
        {
            var count = await conn.QuerySingleAsync<int>(
                @"SELECT COUNT(*) FROM ""Asset_Revaluations""
                  WHERE ""AssetRegisterID"" = @assetId
                    AND COALESCE(""RejectedDate"", NULL) IS NULL
                    AND MONTH(""RevalutionDate"") = @month
                    AND YEAR(""RevalutionDate"") = @year",
                new { assetId, month, year });
            return count > 0;
        }
        return false;
    }

    public async Task<(int impairments, int disposals, int revaluations)> GetAllPendingTransactionCounts(
        DbConnection conn)
    {
        var impCount = await conn.QuerySingleAsync<int>(
            @"SELECT COUNT(*) FROM ""Asset_Impairment""
              WHERE COALESCE(""Approved"", 0) = 0
                AND COALESCE(""IsRejected"", 0) = 0");

        var dispCount = await conn.QuerySingleAsync<int>(
            @"SELECT COUNT(*) FROM ""Asset_Disposal""
              WHERE ""Status"" IN ('Pending', 'Submitted')");

        var revalCount = await conn.QuerySingleAsync<int>(
            @"SELECT COUNT(*) FROM ""Asset_Revaluations""
              WHERE (""Approved"" IS NULL OR ""Approved"" = FALSE)
                AND ""RejectedDate"" IS NULL");

        return (impCount, dispCount, revalCount);
    }

    public async Task<string?> GetPendingTransactionTypeForAsset(
        DbConnection conn, int assetId, DateTime txnDate)
    {
        int month = txnDate.Month;
        int year = txnDate.Year;

        var impCount = await conn.QuerySingleAsync<int>(
            @"SELECT COUNT(*) FROM ""Asset_Impairment""
              WHERE ""Asset_ItemID"" = @assetId
                AND COALESCE(""Approved"", 0) = 0
                AND COALESCE(""IsRejected"", 0) = 0
                AND MONTH(""ImpairmentDate"") = @month
                AND YEAR(""ImpairmentDate"") = @year",
            new { assetId, month, year });
        if (impCount > 0) return "Impairment";

        var dispCount = await conn.QuerySingleAsync<int>(
            @"SELECT COUNT(*) FROM ""Asset_Disposal""
              WHERE ""AssetItemID"" = @assetId
                AND ""Status"" IN ('Pending', 'Submitted')
                AND MONTH(""DisposalDate"") = @month
                AND YEAR(""DisposalDate"") = @year",
            new { assetId, month, year });
        if (dispCount > 0) return "Disposal";

        var revalCount = await conn.QuerySingleAsync<int>(
            @"SELECT COUNT(*) FROM ""Asset_Revaluations""
              WHERE ""AssetRegisterID"" = @assetId
                AND (""Approved"" IS NULL OR ""Approved"" = FALSE)
                AND ""RejectedDate"" IS NULL
                AND MONTH(""RevalutionDate"") = @month
                AND YEAR(""RevalutionDate"") = @year",
            new { assetId, month, year });
        if (revalCount > 0) return "Revaluation";

        return null;
    }
}

public class MscoaLookupResult
{
    public int? DebitProjectId { get; set; }
    public int? CreditProjectId { get; set; }
    public int? DebitItemId { get; set; }
    public int? CreditItemId { get; set; }
    public int? DebitScoaFundId { get; set; }
    public int? DebitScoaRegionId { get; set; }
    public int? DebitScoaCostingId { get; set; }
    public int? DebitScoaFunctionId { get; set; }
    public int? DebitScoaItemId { get; set; }
    public int? DebitDivisionId { get; set; }
    public int? DebitPlanProjectId { get; set; }
    public int? DebitPlanProjectItemId { get; set; }
    public int? CreditScoaFundId { get; set; }
    public int? CreditScoaRegionId { get; set; }
    public int? CreditScoaCostingId { get; set; }
    public int? CreditScoaFunctionId { get; set; }
    public int? CreditScoaItemId { get; set; }
    public int? CreditDivisionId { get; set; }
    public int? CreditPlanProjectId { get; set; }
    public int? CreditPlanProjectItemId { get; set; }
    public int? DebitVoteId { get; set; }
    public int? CreditVoteId { get; set; }
    public int? OffsetScoaFundId { get; set; }
    public int? OffsetScoaRegionId { get; set; }
    public int? OffsetScoaCostingId { get; set; }
    public int? OffsetScoaFunctionId { get; set; }
    public int? OffsetScoaItemId { get; set; }
    public int? OffsetDivisionId { get; set; }
    public int? OffsetPlanProjectId { get; set; }
    public int? OffsetPlanProjectItemId { get; set; }
    public int? OffsetVoteId { get; set; }
    public int? ReserveScoaFundId { get; set; }
    public int? ReserveScoaRegionId { get; set; }
    public int? ReserveScoaCostingId { get; set; }
    public int? ReserveScoaFunctionId { get; set; }
    public int? ReserveScoaItemId { get; set; }
    public int? ReserveDivisionId { get; set; }
    public int? ReservePlanProjectId { get; set; }
    public int? ReservePlanProjectItemId { get; set; }
    public int? ReserveVoteId { get; set; }
}

public class GlValidationResult
{
    public int AssetRegisterItemId { get; set; }
    public string AssetDescription { get; set; } = "";
    public string TransactionType { get; set; } = "";
    public List<GlLegValidation> Legs { get; set; } = new();
    public bool IsValid => Legs.All(l => l.Valid);
}

public class GlLegValidation
{
    public string Leg { get; set; } = "";
    public string ScoaField { get; set; } = "";
    public bool Valid { get; set; }
    public List<string> MissingFields { get; set; } = new();
}

public class EffectiveAssetValues
{
    public decimal CarryingAmount { get; set; }
    public decimal AccumulatedDepreciation { get; set; }
    public decimal AccumulatedImpairment { get; set; }
    public decimal RevaluationReserve { get; set; }
    public decimal RemainingUsefulLifeMonths { get; set; }
    public decimal PurchaseAmount { get; set; }
    public decimal ResidualValue { get; set; }
}
