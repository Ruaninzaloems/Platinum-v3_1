using System.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using PlatinumBudget.Api.Data;

namespace PlatinumBudget.Api.Services;

public class PlanningSpService
{
    private readonly BudgetDbContext _db;

    public PlanningSpService(BudgetDbContext db)
    {
        _db = db;
    }

    private async Task<NpgsqlConnection> GetOpenConnectionAsync()
    {
        var conn = _db.Database.GetDbConnection() as NpgsqlConnection;
        if (conn == null) throw new InvalidOperationException("Connection is not a Npgsql connection.");
        if (conn.State != ConnectionState.Open)
            await conn.OpenAsync();
        return conn;
    }

    private static List<Dictionary<string, object?>> ReadResults(Npgsql.NpgsqlDataReader reader)
    {
        var results = new List<Dictionary<string, object?>>();
        while (reader.Read())
        {
            var row = new Dictionary<string, object?>();
            for (int i = 0; i < reader.FieldCount; i++)
                row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            results.Add(row);
        }
        return results;
    }

    public async Task<List<Dictionary<string, object?>>> ExecuteSpAsync(string spName, Dictionary<string, object?> parameters)
    {
        var conn = await GetOpenConnectionAsync();
        using var cmd = new NpgsqlCommand(spName, conn);
        cmd.CommandType = CommandType.StoredProcedure;
        foreach (var kv in parameters)
            cmd.Parameters.AddWithValue(kv.Key, kv.Value ?? DBNull.Value);

        try
        {
            using var reader = await cmd.ExecuteReaderAsync();
            return ReadResults(reader);
        }
        catch { return new List<Dictionary<string, object?>>(); }
    }

    public async Task<int> ExecuteSpNonQueryAsync(string spName, Dictionary<string, object?> parameters)
    {
        var conn = await GetOpenConnectionAsync();
        using var cmd = new NpgsqlCommand(spName, conn);
        cmd.CommandType = CommandType.StoredProcedure;
        foreach (var kv in parameters)
            cmd.Parameters.AddWithValue(kv.Key, kv.Value ?? DBNull.Value);

        try { return await cmd.ExecuteNonQueryAsync(); }
        catch { return -1; }
    }

    public async Task<List<Dictionary<string, object?>>> ExecuteFunctionAsync(string functionName, Dictionary<string, object?> parameters)
    {
        var conn = await GetOpenConnectionAsync();

        var paramPlaceholders = new List<string>();
        var i = 0;
        foreach (var kv in parameters)
            paramPlaceholders.Add($"@p{i++}");

        var sql = $"SELECT * FROM \"{functionName}\"({string.Join(", ", paramPlaceholders)})";
        using var cmd = new NpgsqlCommand(sql, conn);

        i = 0;
        foreach (var kv in parameters)
            cmd.Parameters.AddWithValue($"p{i++}", kv.Value ?? DBNull.Value);

        try
        {
            using var reader = await cmd.ExecuteReaderAsync();
            return ReadResults(reader);
        }
        catch { return new List<Dictionary<string, object?>>(); }
    }

    public async Task<List<Dictionary<string, object?>>> ExecuteViewAsync(string viewName, int? top = null)
    {
        var conn = await GetOpenConnectionAsync();
        var limit = top.HasValue ? $" LIMIT {top.Value}" : "";
        var sql = $"SELECT * FROM \"{viewName}\"{limit}";
        using var cmd = new NpgsqlCommand(sql, conn);

        try
        {
            using var reader = await cmd.ExecuteReaderAsync();
            return ReadResults(reader);
        }
        catch { return new List<Dictionary<string, object?>>(); }
    }
}
