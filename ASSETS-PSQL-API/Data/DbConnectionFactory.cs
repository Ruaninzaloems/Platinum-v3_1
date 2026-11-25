using System.Data.Common;
using Microsoft.Data.SqlClient;
using Npgsql;

namespace AssetManagement.Data;

public class DbConnectionFactory
{
    private readonly string _connectionString;
    private readonly ILogger<DbConnectionFactory> _logger;
    private readonly bool _isSqlServer;

    public DbConnectionFactory(ILogger<DbConnectionFactory> logger, IConfiguration configuration)
    {
        _logger = logger;
        var sqlServerCs = configuration.GetConnectionString("SqlServer");
        if (!string.IsNullOrWhiteSpace(sqlServerCs))
        {
            _connectionString = sqlServerCs;
            _isSqlServer = true;
        }
        else
        {
            // POSTGRES_URL takes priority (Azure / external PostgreSQL)
            // Falls back to DATABASE_URL (Replit local PostgreSQL)
            var postgresUrl = Environment.GetEnvironmentVariable("POSTGRES_URL");
            if (!string.IsNullOrWhiteSpace(postgresUrl))
            {
                _connectionString = postgresUrl.StartsWith("postgresql://") || postgresUrl.StartsWith("postgres://")
                    ? ConvertToNpgsqlConnectionString(postgresUrl)
                    : postgresUrl;
            }
            else
            {
                var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL")
                    ?? throw new InvalidOperationException("Neither POSTGRES_URL nor DATABASE_URL environment variable is set");
                _connectionString = ConvertToNpgsqlConnectionString(databaseUrl);
            }
            _isSqlServer = false;
        }
    }

    public bool IsSqlServer => _isSqlServer;

    public DbConnection CreateConnection()
    {
        if (_isSqlServer)
            return new SqlConnection(_connectionString);
        return new NpgsqlConnection(_connectionString);
    }

    public async Task InitializeAsync()
    {
        if (_isSqlServer)
        {
            _logger.LogInformation("SQL Server mode — skipping PostgreSQL schema init");
            return;
        }

        await using var patchConn = new NpgsqlConnection(_connectionString);
        await patchConn.OpenAsync();
        await ApplyPatchMigrationsAsync(patchConn);

        if (Environment.GetEnvironmentVariable("SKIP_DB_INIT") == "true")
        {
            _logger.LogInformation("SKIP_DB_INIT=true — skipping schema/seed initialization (using pre-seeded database)");
            return;
        }

        _logger.LogInformation("Initializing database schema...");
        var schemaPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "Data", "Schema.sql");
        if (!File.Exists(schemaPath))
            schemaPath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "Schema.sql");

        if (!File.Exists(schemaPath))
        {
            _logger.LogWarning("Schema.sql not found at {Path}, skipping schema init", schemaPath);
            return;
        }

        var sql = await File.ReadAllTextAsync(schemaPath);
        await using var conn = (NpgsqlConnection)CreateConnection();
        await conn.OpenAsync();

        var migrationPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "Migration.sql");
        if (File.Exists(migrationPath))
        {
            var migSql = await File.ReadAllTextAsync(migrationPath);
            await using var migCmd = new NpgsqlCommand(migSql, conn);
            await migCmd.ExecuteNonQueryAsync();
            _logger.LogInformation("Migration applied successfully");
        }

        await using var cmd = new NpgsqlCommand(sql, conn);
        await cmd.ExecuteNonQueryAsync();
        _logger.LogInformation("Database schema initialized successfully");

        var migrateAssetPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "MigrateAssetColumns.sql");
        if (File.Exists(migrateAssetPath))
        {
            var migrateAssetSql = await File.ReadAllTextAsync(migrateAssetPath);
            await using var macCmd = new NpgsqlCommand(migrateAssetSql, conn);
            macCmd.CommandTimeout = 120;
            await macCmd.ExecuteNonQueryAsync();
            _logger.LogInformation("Asset column migration applied successfully");
        }

        var seedPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "Seed.sql");
        if (File.Exists(seedPath))
        {
            var seedSql = await File.ReadAllTextAsync(seedPath);
            try
            {
                await using var seedCmd = new NpgsqlCommand(seedSql, conn);
                seedCmd.CommandTimeout = 120;
                await seedCmd.ExecuteNonQueryAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Seed data had errors (non-fatal): {Message}", ex.Message);
            }
            _logger.LogInformation("Seed data loaded successfully");
        }

        var seedMscoaPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "SeedMSCOA.sql");
        if (File.Exists(seedMscoaPath))
        {
            var seedMscoaSql = await File.ReadAllTextAsync(seedMscoaPath);
            try
            {
                await using var seedMscoaCmd = new NpgsqlCommand(seedMscoaSql, conn);
                seedMscoaCmd.CommandTimeout = 180;
                await seedMscoaCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("mSCOA seed data loaded successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("mSCOA seed data had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var seedLedgerPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "SeedLedger.sql");
        if (File.Exists(seedLedgerPath))
        {
            var seedLedgerSql = await File.ReadAllTextAsync(seedLedgerPath);
            try
            {
                await using var seedLedgerCmd = new NpgsqlCommand(seedLedgerSql, conn);
                seedLedgerCmd.CommandTimeout = 180;
                await seedLedgerCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("Ledger seed data loaded successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Ledger seed data had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var seedLedgerVotesPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "SeedLedgerVotes.sql");
        if (File.Exists(seedLedgerVotesPath))
        {
            var seedLedgerVotesSql = await File.ReadAllTextAsync(seedLedgerVotesPath);
            try
            {
                await using var seedLedgerVotesCmd = new NpgsqlCommand(seedLedgerVotesSql, conn);
                seedLedgerVotesCmd.CommandTimeout = 300;
                await seedLedgerVotesCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("Ledger votes/project seed data loaded successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Ledger votes/project seed data had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var seedExtraPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "SeedExtra.sql");
        if (File.Exists(seedExtraPath))
        {
            var seedExtraSql = await File.ReadAllTextAsync(seedExtraPath);
            try
            {
                await using var seedExtraCmd = new NpgsqlCommand(seedExtraSql, conn);
                seedExtraCmd.CommandTimeout = 120;
                await seedExtraCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("Extra seed data loaded successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Extra seed data had errors (non-fatal): {Message}", ex.Message);
                try
                {
                    await using var reEnableCmd = new NpgsqlCommand(
                        @"ALTER TABLE ""Const_Asset_CIDMS_Component_Type"" ENABLE TRIGGER ALL;
                          ALTER TABLE ""Const_Asset_CIDMS_SubComponent_Type"" ENABLE TRIGGER ALL;", conn);
                    await reEnableCmd.ExecuteNonQueryAsync();
                }
                catch { }
            }
        }

        var seedLocationPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "SeedLocation.sql");
        if (File.Exists(seedLocationPath))
        {
            var seedLocationSql = await File.ReadAllTextAsync(seedLocationPath);
            try
            {
                await using var seedLocationCmd = new NpgsqlCommand(seedLocationSql, conn);
                seedLocationCmd.CommandTimeout = 300;
                await seedLocationCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("Location/ownership seed data loaded successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Location seed data had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var seedScmPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "SeedSCM.sql");
        if (File.Exists(seedScmPath))
        {
            var seedScmSql = await File.ReadAllTextAsync(seedScmPath);
            try
            {
                // Split into individual statements for reliable multi-statement execution
                var statements = seedScmSql.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                int executed = 0;
                foreach (var stmt in statements)
                {
                    var trimmed = stmt.Trim();
                    if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith("--")) continue;
                    try
                    {
                        await using var stmtCmd = new NpgsqlCommand(trimmed, conn);
                        stmtCmd.CommandTimeout = 60;
                        await stmtCmd.ExecuteNonQueryAsync();
                        executed++;
                    }
                    catch { /* non-fatal: skip bad statement */ }
                }
                var scmCount = await new NpgsqlCommand(@"SELECT COUNT(*) FROM ""SCM_ContractDetails""", conn).ExecuteScalarAsync();
                _logger.LogInformation("SCM seed data loaded successfully ({Count} contracts, {Executed} statements executed)", scmCount, executed);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("SCM seed data had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var seedScoaStructurePath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "SeedScoaStructure.sql");
        if (File.Exists(seedScoaStructurePath))
        {
            var seedScoaStructureSql = await File.ReadAllTextAsync(seedScoaStructurePath);
            try
            {
                await using var seedScoaStructureCmd = new NpgsqlCommand(seedScoaStructureSql, conn);
                seedScoaStructureCmd.CommandTimeout = 300;
                await seedScoaStructureCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("SCOA structure seed data loaded successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("SCOA structure seed data had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var seedSCMInvoicePath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "SeedSCMInvoice.sql");
        if (File.Exists(seedSCMInvoicePath))
        {
            var seedSCMInvoiceSql = await File.ReadAllTextAsync(seedSCMInvoicePath);
            try
            {
                await using var seedSCMInvoiceCmd = new NpgsqlCommand(seedSCMInvoiceSql, conn);
                seedSCMInvoiceCmd.CommandTimeout = 600;
                await seedSCMInvoiceCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("SCM Invoice seed data loaded successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("SCM Invoice seed data had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var migrateBulkTxnPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "MigrateBulkTransactions.sql");
        if (File.Exists(migrateBulkTxnPath))
        {
            var migrateBulkTxnSql = await File.ReadAllTextAsync(migrateBulkTxnPath);
            try
            {
                await using var migrateBulkTxnCmd = new NpgsqlCommand(migrateBulkTxnSql, conn);
                migrateBulkTxnCmd.CommandTimeout = 120;
                await migrateBulkTxnCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("Bulk transactions migration applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Bulk transactions migration had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var migratePriorPeriodPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "MigratePriorPeriod.sql");
        if (File.Exists(migratePriorPeriodPath))
        {
            var migratePriorPeriodSql = await File.ReadAllTextAsync(migratePriorPeriodPath);
            try
            {
                await using var migratePriorPeriodCmd = new NpgsqlCommand(migratePriorPeriodSql, conn);
                migratePriorPeriodCmd.CommandTimeout = 120;
                await migratePriorPeriodCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("Prior period adjustments migration applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Prior period adjustments migration had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var migratePriorYearPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "MigratePriorYear.sql");
        if (File.Exists(migratePriorYearPath))
        {
            var migratePriorYearSql = await File.ReadAllTextAsync(migratePriorYearPath);
            try
            {
                await using var migratePriorYearCmd = new NpgsqlCommand(migratePriorYearSql, conn);
                migratePriorYearCmd.CommandTimeout = 120;
                await migratePriorYearCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("Prior year adjustments migration applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Prior year adjustments migration had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var migrateBulkRefurbPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "MigrateBulkRefurbishments.sql");
        if (File.Exists(migrateBulkRefurbPath))
        {
            var migrateBulkRefurbSql = await File.ReadAllTextAsync(migrateBulkRefurbPath);
            try
            {
                await using var migrateBulkRefurbCmd = new NpgsqlCommand(migrateBulkRefurbSql, conn);
                migrateBulkRefurbCmd.CommandTimeout = 120;
                await migrateBulkRefurbCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("Bulk refurbishments migration applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Bulk refurbishments migration had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var migrateWipUomPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "MigrateWipUom.sql");
        if (File.Exists(migrateWipUomPath))
        {
            var migrateWipUomSql = await File.ReadAllTextAsync(migrateWipUomPath);
            try
            {
                await using var migrateWipUomCmd = new NpgsqlCommand(migrateWipUomSql, conn);
                migrateWipUomCmd.CommandTimeout = 60;
                await migrateWipUomCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("WIP UoM column migration applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("WIP UoM column migration had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var migrateWipBoqGroupPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "MigrateWipBoqGroup.sql");
        if (File.Exists(migrateWipBoqGroupPath))
        {
            var migrateWipBoqGroupSql = await File.ReadAllTextAsync(migrateWipBoqGroupPath);
            try
            {
                await using var migrateWipBoqGroupCmd = new NpgsqlCommand(migrateWipBoqGroupSql, conn);
                migrateWipBoqGroupCmd.CommandTimeout = 60;
                await migrateWipBoqGroupCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("WIP BOQ Group column migration applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("WIP BOQ Group column migration had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var migrateInventoryPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "MigrateInventoryTables.sql");
        if (File.Exists(migrateInventoryPath))
        {
            var migrateInventorySql = await File.ReadAllTextAsync(migrateInventoryPath);
            try
            {
                await using var migrateInventoryCmd = new NpgsqlCommand(migrateInventorySql, conn);
                migrateInventoryCmd.CommandTimeout = 120;
                await migrateInventoryCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("Inventory tables migration applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Inventory tables migration had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var migrateAcqWritebackPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "MigrateAcquisitionWriteback.sql");
        if (File.Exists(migrateAcqWritebackPath))
        {
            var migrateAcqWritebackSql = await File.ReadAllTextAsync(migrateAcqWritebackPath);
            try
            {
                await using var migrateAcqWritebackCmd = new NpgsqlCommand(migrateAcqWritebackSql, conn);
                migrateAcqWritebackCmd.CommandTimeout = 60;
                await migrateAcqWritebackCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("Acquisition write-back migration applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Acquisition write-back migration had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var migrateAssetApprovalPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "MigrateAssetApproval.sql");
        if (File.Exists(migrateAssetApprovalPath))
        {
            var migrateAssetApprovalSql = await File.ReadAllTextAsync(migrateAssetApprovalPath);
            try
            {
                await using var migrateAssetApprovalCmd = new NpgsqlCommand(migrateAssetApprovalSql, conn);
                migrateAssetApprovalCmd.CommandTimeout = 60;
                await migrateAssetApprovalCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("Asset approval staging migration applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Asset approval staging migration had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var migrateDisposalCorrectionPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "MigrateDisposalJournalCorrection.sql");
        if (File.Exists(migrateDisposalCorrectionPath))
        {
            var migrateDisposalCorrectionSql = await File.ReadAllTextAsync(migrateDisposalCorrectionPath);
            try
            {
                await using var migrateDisposalCorrectionCmd = new NpgsqlCommand(migrateDisposalCorrectionSql, conn);
                migrateDisposalCorrectionCmd.CommandTimeout = 60;
                await migrateDisposalCorrectionCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("Disposal journal correction migration applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Disposal journal correction migration had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var migrateMscoaDeptDivPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "MigrateMscoaDeptDivision.sql");
        if (File.Exists(migrateMscoaDeptDivPath))
        {
            var migrateMscoaDeptDivSql = await File.ReadAllTextAsync(migrateMscoaDeptDivPath);
            try
            {
                await using var migrateMscoaDeptDivCmd = new NpgsqlCommand(migrateMscoaDeptDivSql, conn);
                migrateMscoaDeptDivCmd.CommandTimeout = 60;
                await migrateMscoaDeptDivCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("mSCOA dept/division column migration applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("mSCOA dept/division column migration had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var migrateDropDeptPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "MigrateDropDepartmentColumn.sql");
        if (File.Exists(migrateDropDeptPath))
        {
            var migrateDropDeptSql = await File.ReadAllTextAsync(migrateDropDeptPath);
            try
            {
                await using var migrateDropDeptCmd = new NpgsqlCommand(migrateDropDeptSql, conn);
                migrateDropDeptCmd.CommandTimeout = 60;
                await migrateDropDeptCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("Drop legacy Department column migration applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Drop legacy Department column migration had errors (non-fatal): {Message}", ex.Message);
            }
        }
    }

    private async Task ApplyPatchMigrationsAsync(NpgsqlConnection conn)
    {
        var dataDir = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "Data");
        if (!Directory.Exists(dataDir))
            dataDir = Path.Combine(Directory.GetCurrentDirectory(), "Data");

        // Patch 1: mSCOA dept/division columns (requires AssetConfig_mSCOA table)
        var migrateMscoaDeptDivPath = Path.Combine(dataDir, "MigrateMscoaDeptDivision.sql");
        if (File.Exists(migrateMscoaDeptDivPath))
        {
            await using var checkCmd = new NpgsqlCommand(
                "SELECT COUNT(1) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AssetConfig_mSCOA'", conn);
            var tableExists = (long)(await checkCmd.ExecuteScalarAsync() ?? 0L);
            if (tableExists > 0)
            {
                var sql = await File.ReadAllTextAsync(migrateMscoaDeptDivPath);
                try
                {
                    await using var cmd = new NpgsqlCommand(sql, conn);
                    cmd.CommandTimeout = 60;
                    await cmd.ExecuteNonQueryAsync();
                    _logger.LogInformation("mSCOA dept/division column patch applied successfully");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("mSCOA dept/division column patch had errors (non-fatal): {Message}", ex.Message);
                }
            }
        }

        // Patch 2: Drop legacy Department column from Asset_Register_Items (requires that table)
        var migrateDropDeptPath = Path.Combine(dataDir, "MigrateDropDepartmentColumn.sql");
        if (File.Exists(migrateDropDeptPath))
        {
            await using var checkCmd2 = new NpgsqlCommand(
                "SELECT COUNT(1) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Asset_Register_Items'", conn);
            var tableExists2 = (long)(await checkCmd2.ExecuteScalarAsync() ?? 0L);
            if (tableExists2 > 0)
            {
                var sql = await File.ReadAllTextAsync(migrateDropDeptPath);
                try
                {
                    await using var cmd = new NpgsqlCommand(sql, conn);
                    cmd.CommandTimeout = 60;
                    await cmd.ExecuteNonQueryAsync();
                    _logger.LogInformation("Drop legacy Department column patch applied successfully");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Drop legacy Department column patch had errors (non-fatal): {Message}", ex.Message);
                }
            }
        }

        // Patch 3: Resync sequences that may have drifted below the actual max ID
        // (can happen when rows are imported with explicit IDs bypassing the sequence)
        try
        {
            await using var seqCmd = new NpgsqlCommand(@"
                SELECT setval(
                    '""AssetConfig_mSCOA_AssetConfig_mSCOA_ID_seq""',
                    GREATEST((SELECT COALESCE(MAX(""AssetConfig_mSCOA_ID""), 1) FROM ""AssetConfig_mSCOA""), 1),
                    true
                );
                SELECT setval(
                    '""AssetConfig_mSCOA_Transaction_AssetConfig_mSCOA_Transaction_seq""',
                    GREATEST((SELECT COALESCE(MAX(""AssetConfig_mSCOA_TransactionType_ID""), 1) FROM ""AssetConfig_mSCOA_TransactionType""), 1),
                    true
                );", conn);
            seqCmd.CommandTimeout = 30;
            await seqCmd.ExecuteNonQueryAsync();
            _logger.LogInformation("mSCOA sequences resynced successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning("mSCOA sequence resync skipped (tables may not exist yet): {Message}", ex.Message);
        }

        // Patch 4: Drop unused tables that are no longer referenced by any controller or service.
        // Drop in FK-safe order: child tables first, then parents.
        try
        {
            await using var dropCmd = new NpgsqlCommand(@"
                DROP TABLE IF EXISTS ""Inven_HighValueLineItem"";
                DROP TABLE IF EXISTS ""Inven_HighValue"";
                DROP TABLE IF EXISTS ""Inven_Inventory"";
                DROP TABLE IF EXISTS ""SCM_RequisitionBillOfQuantity"";
                DROP SEQUENCE IF EXISTS ""Inven_HighValueLineItem_Inven_HighValueItemId_seq"";
                DROP SEQUENCE IF EXISTS ""Inven_HighValue_InventoryHighValueId_seq"";
                DROP SEQUENCE IF EXISTS ""Inven_Inventory_Inventory_ID_seq"";", conn);
            dropCmd.CommandTimeout = 30;
            await dropCmd.ExecuteNonQueryAsync();
            _logger.LogInformation("Unused tables dropped successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Unused table drop had errors (non-fatal): {Message}", ex.Message);
        }

        // Patch 5: GL Outbox tables for GL integration (Task #120 / #124 — aligned to SQL Server)
        try
        {
            await using var glOutboxCmd = new NpgsqlCommand(@"
                CREATE TABLE IF NOT EXISTS ""GL_Outbox"" (
                    ""OutboxId"" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    ""SubmoduleId"" INTEGER NOT NULL DEFAULT 8,
                    ""EventType"" VARCHAR(100) NOT NULL,
                    ""DocumentNumber"" VARCHAR(100) NOT NULL DEFAULT '',
                    ""IsCashflow"" BOOLEAN NOT NULL DEFAULT FALSE,
                    ""Status"" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                    ""RetryCount"" INTEGER NOT NULL DEFAULT 0,
                    ""CreatedAt"" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    ""LastError"" VARCHAR(500),
                    ""DispatchedAt"" TIMESTAMPTZ,
                    ""GLBatchId"" UUID,
                    ""AcknowledgedAt"" TIMESTAMPTZ
                );

                CREATE TABLE IF NOT EXISTS ""GL_Outbox_Lines"" (
                    ""LineId"" BIGSERIAL PRIMARY KEY,
                    ""OutboxId"" UUID NOT NULL REFERENCES ""GL_Outbox""(""OutboxId""),
                    ""ProcessingMonth"" INTEGER NOT NULL,
                    ""FinYear"" VARCHAR(10) NOT NULL,
                    ""TransactionDetails"" VARCHAR(500),
                    ""SourceModuleId"" INTEGER NOT NULL DEFAULT 8,
                    ""Debit"" NUMERIC(18,2) NOT NULL DEFAULT 0,
                    ""Credit"" NUMERIC(18,2) NOT NULL DEFAULT 0,
                    ""CapturerId"" INTEGER NOT NULL DEFAULT 1,
                    ""PlanProjectItemID"" INTEGER NOT NULL DEFAULT 0,
                    ""VATRate"" NUMERIC(5,2),
                    ""VATRateID"" INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS ""AssetConfig_EventType"" (
                    ""EventType_ID"" SERIAL PRIMARY KEY,
                    ""SourceDocType"" INTEGER NOT NULL,
                    ""EventType"" VARCHAR(50) NOT NULL,
                    ""Description"" VARCHAR(200),
                    CONSTRAINT ""uq_assetconfig_eventtype_sourcedoctype"" UNIQUE (""SourceDocType"")
                );

                INSERT INTO ""AssetConfig_EventType"" (""SourceDocType"", ""EventType"", ""Description"")
                VALUES
                    (23, 'ASSET_DEPRECIATION',  'Asset Depreciation'),
                    (24, 'ASSET_FINANCE',       'Asset Finance'),
                    (999,'ASSET_CAPITALISATION','Asset Capitalisation'),
                    (26, 'ASSET_IMPAIRMENT',    'Asset Impairment'),
                    (27, 'ASSET_REVALUATION',   'Asset Revaluation'),
                    (28, 'ASSET_TRANSFER',      'Asset Transfer'),
                    (29, 'ASSET_DISPOSAL',      'Asset Disposal')
                ON CONFLICT (""SourceDocType"") DO NOTHING;", conn);
            glOutboxCmd.CommandTimeout = 30;
            await glOutboxCmd.ExecuteNonQueryAsync();
            _logger.LogInformation("GL Outbox tables created/verified successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning("GL Outbox table migration had errors (non-fatal): {Message}", ex.Message);
        }
    }

    private static string ConvertToNpgsqlConnectionString(string databaseUrl)
    {
        if (databaseUrl.StartsWith("postgresql://") || databaseUrl.StartsWith("postgres://"))
        {
            var uri = new Uri(databaseUrl);
            var userInfo = uri.UserInfo.Split(':', 2);
            var qs = System.Web.HttpUtility.ParseQueryString(uri.Query);
            // Azure PostgreSQL Flexible Server: VerifyFull requires the DigiCert root CA
            // to be explicitly trusted by Npgsql. Use Require (encrypted, no cert chain
            // validation) which is sufficient for Azure managed services.
            var sslMode = (qs["sslmode"] ?? "prefer") switch
            {
                "disable"     => SslMode.Disable,
                "require"     => SslMode.Require,
                "prefer"      => SslMode.Prefer,
                "verify-full" => SslMode.Require,   // Azure: use Require, not VerifyFull
                "verify-ca"   => SslMode.Require,
                _             => SslMode.Prefer
            };
            var builder = new NpgsqlConnectionStringBuilder
            {
                Host = uri.Host,
                Port = uri.Port > 0 ? uri.Port : 5432,
                Database = uri.AbsolutePath.TrimStart('/'),
                Username = Uri.UnescapeDataString(userInfo[0]),
                Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "",
                SslMode = sslMode,
                CommandTimeout = 600
            };
            return builder.ConnectionString;
        }
        return databaseUrl;
    }
}
