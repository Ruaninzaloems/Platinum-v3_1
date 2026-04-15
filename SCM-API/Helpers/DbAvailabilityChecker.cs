using SCM_API.Data;
using Microsoft.EntityFrameworkCore;

namespace SCM_API.Helpers;

public class DbAvailabilityChecker
{
    private bool _checked = false;
    private bool _available = false;
    private bool _forceMock = false;
    private readonly object _lock = new();
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DbAvailabilityChecker> _logger;

    public DbAvailabilityChecker(IServiceProvider serviceProvider, ILogger<DbAvailabilityChecker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;

        var useMock = Environment.GetEnvironmentVariable("USE_MOCK_DATA");
        if (!string.IsNullOrEmpty(useMock) &&
            (useMock.Equals("true", StringComparison.OrdinalIgnoreCase) || useMock == "1"))
        {
            _forceMock = true;
            _checked = true;
            _available = false;
            _logger.LogInformation("USE_MOCK_DATA is set — forcing in-memory fallback mode");
        }
    }

    public bool IsDbAvailable
    {
        get
        {
            if (_forceMock) return false;
            if (!_checked)
            {
                lock (_lock)
                {
                    if (!_checked)
                    {
                        CheckAvailability();
                        _checked = true;
                    }
                }
            }
            return _available;
        }
    }

    public bool IsForcedMock => _forceMock;

    private void CheckAvailability()
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            _available = context.Database.CanConnect();
            if (_available)
                _logger.LogInformation("Database connection available — using DB-backed services");
            else
                _logger.LogWarning("Database connection unavailable — using in-memory fallback");
        }
        catch (Exception ex)
        {
            _available = false;
            _logger.LogWarning(ex, "Database connectivity check failed — using in-memory fallback");
        }
    }

    public void MarkUnavailable()
    {
        _available = false;
        _logger.LogWarning("Database marked unavailable after runtime error — switching to in-memory fallback");
    }
}
