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

        var migrateGrnDocsPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "MigrateGRNDocuments.sql");
        if (File.Exists(migrateGrnDocsPath))
        {
            var migrateGrnDocsSql = await File.ReadAllTextAsync(migrateGrnDocsPath);
            try
            {
                await using var migrateGrnDocsCmd = new NpgsqlCommand(migrateGrnDocsSql, conn);
                migrateGrnDocsCmd.CommandTimeout = 60;
                await migrateGrnDocsCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("SCM_GRNDocuments table migration applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("SCM_GRNDocuments migration had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var seedGrnDocsPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "SeedSCMGRNDocuments.sql");
        if (File.Exists(seedGrnDocsPath))
        {
            var seedGrnDocsSql = await File.ReadAllTextAsync(seedGrnDocsPath);
            try
            {
                await using var seedGrnDocsCmd = new NpgsqlCommand(seedGrnDocsSql, conn);
                seedGrnDocsCmd.CommandTimeout = 60;
                await seedGrnDocsCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("SCM_GRNDocuments seed data loaded successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("SCM_GRNDocuments seed data had errors (non-fatal): {Message}", ex.Message);
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

        var migrateBulkTxnCatchUpPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "MigrateBulkTransactionCatchUp.sql");
        if (File.Exists(migrateBulkTxnCatchUpPath))
        {
            var migrateBulkTxnCatchUpSql = await File.ReadAllTextAsync(migrateBulkTxnCatchUpPath);
            try
            {
                await using var migrateBulkTxnCatchUpCmd = new NpgsqlCommand(migrateBulkTxnCatchUpSql, conn);
                migrateBulkTxnCatchUpCmd.CommandTimeout = 60;
                await migrateBulkTxnCatchUpCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("Bulk transaction catch-up depreciation columns migration applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Bulk transaction catch-up depreciation columns migration had errors (non-fatal): {Message}", ex.Message);
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

        // Post-schema re-run of WO spec migration (Task #133).
        // On first boot the patch runs BEFORE Schema.sql so the IF EXISTS guards skip column adds.
        // Re-running here guarantees columns exist once Asset_MaintenanceWorkOrder is created.
        var woSpecPostPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "MigrateWorkOrderSpec.sql");
        if (File.Exists(woSpecPostPath))
        {
            var woSpecSql = await File.ReadAllTextAsync(woSpecPostPath);
            try
            {
                await using var woSpecCmd = new NpgsqlCommand(woSpecSql, conn);
                woSpecCmd.CommandTimeout = 60;
                await woSpecCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("Work Order Spec post-schema migration applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Work Order Spec post-schema migration had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var migrateConfigSettingsPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "MigrateConfigSettings.sql");
        if (File.Exists(migrateConfigSettingsPath))
        {
            var migrateConfigSettingsSql = await File.ReadAllTextAsync(migrateConfigSettingsPath);
            try
            {
                await using var migrateConfigSettingsCmd = new NpgsqlCommand(migrateConfigSettingsSql, conn);
                migrateConfigSettingsCmd.CommandTimeout = 60;
                await migrateConfigSettingsCmd.ExecuteNonQueryAsync();
                _logger.LogInformation("AAAA_ConfigSettings table migration applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("AAAA_ConfigSettings migration had errors (non-fatal): {Message}", ex.Message);
            }
        }

        var seedConfigSettingsPath = Path.Combine(Path.GetDirectoryName(schemaPath)!, "SeedConfigSettings.sql");
        if (File.Exists(seedConfigSettingsPath))
        {
            var seedConfigSettingsSql = await File.ReadAllTextAsync(seedConfigSettingsPath);
            try
            {
                var statements = seedConfigSettingsSql.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                foreach (var stmt in statements)
                {
                    var trimmed = stmt.Trim();
                    if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith("--")) continue;
                    try
                    {
                        await using var stmtCmd = new NpgsqlCommand(trimmed, conn);
                        stmtCmd.CommandTimeout = 30;
                        await stmtCmd.ExecuteNonQueryAsync();
                    }
                    catch { /* ON CONFLICT DO NOTHING handles duplicates; skip any bad row */ }
                }
                _logger.LogInformation("AAAA_ConfigSettings seed data loaded successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("AAAA_ConfigSettings seed had errors (non-fatal): {Message}", ex.Message);
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

        // Patch 6: Planned Maintenance tables (Task #127)
        var migratePlannedMaintPath = Path.Combine(dataDir, "MigratePlannedMaintenance.sql");
        if (File.Exists(migratePlannedMaintPath))
        {
            var sql = await File.ReadAllTextAsync(migratePlannedMaintPath);
            try
            {
                await using var cmd = new NpgsqlCommand(sql, conn);
                cmd.CommandTimeout = 60;
                await cmd.ExecuteNonQueryAsync();
                _logger.LogInformation("Planned Maintenance tables migration applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Planned Maintenance migration had errors (non-fatal): {Message}", ex.Message);
            }
        }

        // Patch 7: Work Order Spec — new columns, lookup tables, and 3 sub-resource tables (Task #133)
        var migrateWoSpecPath = Path.Combine(dataDir, "MigrateWorkOrderSpec.sql");
        if (File.Exists(migrateWoSpecPath))
        {
            var sql = await File.ReadAllTextAsync(migrateWoSpecPath);
            try
            {
                await using var cmd = new NpgsqlCommand(sql, conn);
                cmd.CommandTimeout = 60;
                await cmd.ExecuteNonQueryAsync();
                _logger.LogInformation("Work Order Spec migration (Task #133) applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Work Order Spec migration had errors (non-fatal): {Message}", ex.Message);
            }
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

        try
        {
            await using var glUseInboxCmd = new NpgsqlCommand(@"
                ALTER TABLE ""Asset_OrganisationSettings""
                    ADD COLUMN IF NOT EXISTS ""gl_use_inbox"" BOOLEAN NOT NULL DEFAULT TRUE;", conn);
            glUseInboxCmd.CommandTimeout = 15;
            await glUseInboxCmd.ExecuteNonQueryAsync();
            _logger.LogInformation("gl_use_inbox column patch applied successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning("gl_use_inbox column patch had errors (non-fatal): {Message}", ex.Message);
        }

        try
        {
            await using var ledGlTableCmd = new NpgsqlCommand(@"
                CREATE TABLE IF NOT EXISTS ""Led_GeneralLedger"" (
                    ""GenLedger_ID""             SERIAL PRIMARY KEY,
                    ""PostingDate""              TIMESTAMP NOT NULL,
                    ""ProcessingMonth""          INTEGER NOT NULL,
                    ""VoteID""                   INTEGER,
                    ""FinYear""                  VARCHAR(12) NOT NULL,
                    ""TransactionTypeID""        INTEGER,
                    ""TransactionDetails""       VARCHAR(235),
                    ""DocumentNumber""           VARCHAR(50),
                    ""Debit""                    DECIMAL(16,2),
                    ""Credit""                   DECIMAL(16,2),
                    ""DateCaptured""             TIMESTAMP DEFAULT NOW(),
                    ""CapturerID""               INTEGER,
                    ""MatchTranGuid""            UUID,
                    ""JournalTransactionTypeID"" INTEGER,
                    ""AssetLinkID""              INTEGER,
                    ""SCOAFundsID""              INTEGER,
                    ""SCOARegionID""             INTEGER,
                    ""SCOACostingID""            INTEGER,
                    ""SCOAProjectID""            INTEGER,
                    ""SCOAFunctionID""           INTEGER,
                    ""SCOAItemID""               INTEGER NOT NULL DEFAULT 0,
                    ""DivisionID""              INTEGER,
                    ""ProjectID""               INTEGER,
                    ""PlanProjectItemID""        INTEGER
                );
                CREATE INDEX IF NOT EXISTS ""idx_led_gl_voteid""  ON ""Led_GeneralLedger""(""VoteID"");
                CREATE INDEX IF NOT EXISTS ""idx_led_gl_finyear"" ON ""Led_GeneralLedger""(""FinYear"");", conn);
            ledGlTableCmd.CommandTimeout = 30;
            await ledGlTableCmd.ExecuteNonQueryAsync();
            _logger.LogInformation("Led_GeneralLedger table created/verified successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Led_GeneralLedger table migration had errors (non-fatal): {Message}", ex.Message);
        }

        try
        {
            await using var glLedTargetCmd = new NpgsqlCommand(@"
                ALTER TABLE ""Asset_OrganisationSettings""
                    ADD COLUMN IF NOT EXISTS ""gl_led_target"" VARCHAR(20) NOT NULL DEFAULT 'postgresql';", conn);
            glLedTargetCmd.CommandTimeout = 15;
            await glLedTargetCmd.ExecuteNonQueryAsync();
            _logger.LogInformation("gl_led_target column patch applied successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning("gl_led_target column patch had errors (non-fatal): {Message}", ex.Message);
        }

        // Patch: Add RevaluationMethod column to Const_AssetClass_sys (Task #440)
        try
        {
            await using var revalMethodCmd = new NpgsqlCommand(@"
                ALTER TABLE ""Const_AssetClass_sys""
                    ADD COLUMN IF NOT EXISTS ""RevaluationMethod"" VARCHAR(20) DEFAULT 'restatement';", conn);
            revalMethodCmd.CommandTimeout = 15;
            await revalMethodCmd.ExecuteNonQueryAsync();
            _logger.LogInformation("RevaluationMethod column patch applied successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning("RevaluationMethod column patch had errors (non-fatal): {Message}", ex.Message);
        }

        // Patch: Add AssetDepreciationMethod_ID and RevaluationMethod to Asset_Register_Items (Task #442)
        try
        {
            await using var assetDepRevalCmd = new NpgsqlCommand(@"
                ALTER TABLE ""Asset_Register_Items""
                    ADD COLUMN IF NOT EXISTS ""AssetDepreciationMethod_ID"" INTEGER;
                ALTER TABLE ""Asset_Register_Items""
                    ADD COLUMN IF NOT EXISTS ""RevaluationMethod"" VARCHAR(50);", conn);
            assetDepRevalCmd.CommandTimeout = 15;
            await assetDepRevalCmd.ExecuteNonQueryAsync();
            _logger.LogInformation("Asset_Register_Items depreciation/revaluation method columns patch applied successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Asset_Register_Items depreciation/revaluation method columns patch had errors (non-fatal): {Message}", ex.Message);
        }

        // Patch: AssetConfig_AssetType_MeasurementType_Link table + default seed data.
        // This is the authoritative table that controls which measurement types are valid
        // per asset type — replaces the incorrect AssetConfig_mSCOA join used previously.
        var migrateLinkTablePath = Path.Combine(dataDir, "MigrateAssetTypeMeasurementLink.sql");
        if (File.Exists(migrateLinkTablePath))
        {
            var sql = await File.ReadAllTextAsync(migrateLinkTablePath);
            try
            {
                await using var cmd = new NpgsqlCommand(sql, conn);
                cmd.CommandTimeout = 60;
                await cmd.ExecuteNonQueryAsync();
                _logger.LogInformation("AssetConfig_AssetType_MeasurementType_Link migration applied successfully");
            }
            catch (Exception ex)
            {
                _logger.LogWarning("AssetConfig_AssetType_MeasurementType_Link migration had errors (non-fatal): {Message}", ex.Message);
            }
        }

        // Patch (Task #478): Correct DRPositionStatementType / CRPositionStatementType data
        // in AssetConfig_TransactionType.  These columns are the authoritative source of
        // required SCOA account-code prefixes for each vote field.
        // All five UPDATE statements are fully idempotent (updating to a known-good value).
        try
        {
            await using var prefixDataCmd = new NpgsqlCommand(@"
                UPDATE ""AssetConfig_TransactionType""
                SET ""DRPositionStatementType13"" = 'LN',
                    ""DRPositionStatementType14"" = 'LN'
                WHERE ""AssetConfig_TransactionType_ID"" = 1;

                UPDATE ""AssetConfig_TransactionType""
                SET ""DRPositionStatementType13"" = 'LN'
                WHERE ""AssetConfig_TransactionType_ID"" = 2;

                UPDATE ""AssetConfig_TransactionType""
                SET ""DRPositionStatementType13"" = 'LN'
                WHERE ""AssetConfig_TransactionType_ID"" = 3;

                UPDATE ""AssetConfig_TransactionType""
                SET ""DRPositionStatementType12"" = 'LN',
                    ""DRPositionStatementType13"" = 'IA',
                    ""DRPositionStatementType14"" = 'LN',
                    ""CRPositionStatementType11"" = 'LN',
                    ""DRPositionStatementType21"" = 'IA',
                    ""DRPositionStatementType22"" = 'LN',
                    ""DRPositionStatementType23"" = 'IA',
                    ""CRPositionStatementType21"" = 'LN',
                    ""CRPositionStatementType22"" = 'LN'
                WHERE ""AssetConfig_TransactionType_ID"" = 5;

                UPDATE ""AssetConfig_TransactionType""
                SET ""DRPositionStatementType13"" = 'IZ',
                    ""DRPositionStatementType14"" = 'IL',
                    ""DRPositionStatementType21"" = 'IA',
                    ""DRPositionStatementType23"" = 'IZ',
                    ""CRPositionStatementType21"" = 'IL'
                WHERE ""AssetConfig_TransactionType_ID"" = 6;", conn);
            prefixDataCmd.CommandTimeout = 30;
            await prefixDataCmd.ExecuteNonQueryAsync();
            _logger.LogInformation("mSCOA SCOA prefix data corrections applied successfully (Task #478)");
        }
        catch (Exception ex)
        {
            _logger.LogWarning("mSCOA SCOA prefix data corrections had errors (non-fatal): {Message}", ex.Message);
        }

        // Patch: Add missing Asset_BulkValidation columns for newly-validated fields.
        // These fields now generate validation errors but previously had no dedicated column,
        // causing the whole-row INSERT to fail and no errors to be stored.
        try
        {
            await using var bulkValColumnsCmd = new NpgsqlCommand(@"
                ALTER TABLE ""Asset_BulkValidation""
                    ADD COLUMN IF NOT EXISTS ""ErfNumber""                       VARCHAR(100);
                ALTER TABLE ""Asset_BulkValidation""
                    ADD COLUMN IF NOT EXISTS ""DisposalValue""                   VARCHAR(100);
                ALTER TABLE ""Asset_BulkValidation""
                    ADD COLUMN IF NOT EXISTS ""DisposalProceeds""                VARCHAR(100);
                ALTER TABLE ""Asset_BulkValidation""
                    ADD COLUMN IF NOT EXISTS ""ProfitorLossonDisposal""          VARCHAR(100);
                ALTER TABLE ""Asset_BulkValidation""
                    ADD COLUMN IF NOT EXISTS ""SCOAItem_PurchaseAmountOrCost""   VARCHAR(100);
                ALTER TABLE ""Asset_BulkValidation""
                    ADD COLUMN IF NOT EXISTS ""SCOAItem_AccumulatedDepreciation"" VARCHAR(100);
                ALTER TABLE ""Asset_BulkValidation""
                    ADD COLUMN IF NOT EXISTS ""SCOAItem_AccumulatedImpairment""  VARCHAR(100);", conn);
            bulkValColumnsCmd.CommandTimeout = 15;
            await bulkValColumnsCmd.ExecuteNonQueryAsync();
            _logger.LogInformation("Asset_BulkValidation missing columns patch applied successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Asset_BulkValidation missing columns patch had errors (non-fatal): {Message}", ex.Message);
        }

        // Patch (Task #494): Add mscoa_use_dept_division toggle column to Asset_OrganisationSettings.
        // DEFAULT TRUE preserves existing behaviour for all existing deployments.
        try
        {
            await using var mscoaDeptDivCmd = new NpgsqlCommand(@"
                ALTER TABLE ""Asset_OrganisationSettings""
                    ADD COLUMN IF NOT EXISTS ""mscoa_use_dept_division"" BOOLEAN NOT NULL DEFAULT TRUE;", conn);
            mscoaDeptDivCmd.CommandTimeout = 15;
            await mscoaDeptDivCmd.ExecuteNonQueryAsync();
            _logger.LogInformation("mscoa_use_dept_division column patch applied successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning("mscoa_use_dept_division column patch had errors (non-fatal): {Message}", ex.Message);
        }

        // Patch: Seed Const_Asset_Run_Type with default depreciation run types if the table is empty.
        // The depreciation run endpoint returns 400 when no run types exist.
        // "Distinctive" is the primary daily-rate run type used throughout the system.
        try
        {
            await using var runTypeCmd = new NpgsqlCommand(@"
                INSERT INTO ""Const_Asset_Run_Type"" (""RunType_ID"", ""RunTypeDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"")
                SELECT 1, 'Distinctive', 1, NOW(), 1
                WHERE NOT EXISTS (SELECT 1 FROM ""Const_Asset_Run_Type"" WHERE ""RunType_ID"" = 1);

                INSERT INTO ""Const_Asset_Run_Type"" (""RunType_ID"", ""RunTypeDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"")
                SELECT 2, 'Monthly', 1, NOW(), 1
                WHERE NOT EXISTS (SELECT 1 FROM ""Const_Asset_Run_Type"" WHERE ""RunType_ID"" = 2);

                INSERT INTO ""Const_Asset_Run_Type"" (""RunType_ID"", ""RunTypeDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"")
                SELECT 3, 'Annual', 1, NOW(), 1
                WHERE NOT EXISTS (SELECT 1 FROM ""Const_Asset_Run_Type"" WHERE ""RunType_ID"" = 3);", conn);
            runTypeCmd.CommandTimeout = 15;
            await runTypeCmd.ExecuteNonQueryAsync();
            _logger.LogInformation("Const_Asset_Run_Type seed patch applied successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Const_Asset_Run_Type seed patch had errors (non-fatal): {Message}", ex.Message);
        }

        // Data fix: mark Heritage asset types as NoUsefuleLife and clear RUL for non-depreciable assets
        try
        {
            await using var cmd = new NpgsqlCommand(@"
                UPDATE ""Const_AssetType_Sys""
                SET    ""NoUsefuleLife"" = 1
                WHERE  LOWER(""AssetTypeDesc"") LIKE '%heritage%'
                  AND  COALESCE(""NoUsefuleLife"", 0) = 0;

                UPDATE ""Asset_Register_Items""
                SET    ""RemainingUsefulLife""    = NULL,
                       ""UsefulLifeMonthComponent"" = NULL
                WHERE  ""AssetType_ID"" IN (
                           SELECT ""AssetType_ID"" FROM ""Const_AssetType_Sys""
                           WHERE  COALESCE(""NoUsefuleLife"", 0) = 1)
                  AND  COALESCE(""RemainingUsefulLife"", ""UsefulLifeMonthComponent"", 0) > 0;

                UPDATE ""Asset_Register_Items""
                SET    ""RemainingUsefulLife""    = NULL,
                       ""UsefulLifeMonthComponent"" = NULL
                WHERE  ""AssetCategory_ID"" IN (
                           SELECT ""AssetCategoryID"" FROM ""Const_AssetCategory_sys""
                           WHERE  LOWER(""AssetCategoryDesc"") LIKE '%land%')
                  AND  COALESCE(""RemainingUsefulLife"", ""UsefulLifeMonthComponent"", 0) > 0;", conn);
            cmd.CommandTimeout = 30;
            await cmd.ExecuteNonQueryAsync();
            _logger.LogInformation("Non-depreciable asset RUL data fix applied successfully");
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Non-depreciable asset RUL data fix had errors (non-fatal): {Message}", ex.Message);
        }
    }

    private static string ConvertToNpgsqlConnectionString(string databaseUrl)
    {
        if (databaseUrl.StartsWith("postgresql://") || databaseUrl.StartsWith("postgres://"))
        {
            var uri = new Uri(databaseUrl);
            var userInfo = uri.UserInfo.Split(':');
            var builder = new NpgsqlConnectionStringBuilder
            {
                Host = uri.Host,
                Port = uri.Port > 0 ? uri.Port : 5432,
                Database = uri.AbsolutePath.TrimStart('/'),
                Username = userInfo[0],
                Password = userInfo.Length > 1 ? userInfo[1] : "",
                SslMode = SslMode.Prefer,
                CommandTimeout = 600
            };
            return builder.ConnectionString;
        }
        return databaseUrl;
    }
}
