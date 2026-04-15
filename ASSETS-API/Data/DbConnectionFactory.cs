using System.Data;
using Microsoft.Data.SqlClient;

namespace MssqlApi.Data;

public class DbConnectionFactory
{
    private readonly string? _connectionString;
    private readonly ILogger<DbConnectionFactory> _logger;

    public DbConnectionFactory(ILogger<DbConnectionFactory> logger, IConfiguration configuration)
    {
        _logger = logger;
        var connStr = configuration.GetConnectionString("SqlServer");
        if (string.IsNullOrEmpty(connStr))
            connStr = Environment.GetEnvironmentVariable("ConnectionStrings__SqlServer");

        if (string.IsNullOrEmpty(connStr))
        {
            _logger.LogWarning("SQL Server connection string is not configured. Set ConnectionStrings:SqlServer or ConnectionStrings__SqlServer. API will start but database calls will fail.");
            _connectionString = null;
        }
        else
        {
            _logger.LogInformation("SQL Server connection string resolved ({Length} chars)", connStr.Length);
            _connectionString = connStr;
        }
    }

    public IDbConnection CreateConnection()
    {
        if (string.IsNullOrEmpty(_connectionString))
            throw new InvalidOperationException("SQL Server connection string is not configured. Set ConnectionStrings:SqlServer or ConnectionStrings__SqlServer.");

        return new SqlConnection(_connectionString);
    }
}
