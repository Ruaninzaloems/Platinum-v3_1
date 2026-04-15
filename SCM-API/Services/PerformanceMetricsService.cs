namespace SCM_API.Services;

public class PerformanceMetricsService
{
    private long _totalRequests;
    private long _totalErrors;
    private long _totalResponseTimeMs;
    private readonly DateTime _startTime = DateTime.UtcNow;

    public void RecordRequest(long responseTimeMs, bool isError)
    {
        Interlocked.Increment(ref _totalRequests);
        Interlocked.Add(ref _totalResponseTimeMs, responseTimeMs);
        if (isError) Interlocked.Increment(ref _totalErrors);
    }

    public object GetMetrics()
    {
        var requests = Interlocked.Read(ref _totalRequests);
        var errors = Interlocked.Read(ref _totalErrors);
        var totalTime = Interlocked.Read(ref _totalResponseTimeMs);

        return new
        {
            Uptime = (DateTime.UtcNow - _startTime).ToString(@"dd\.hh\:mm\:ss"),
            TotalRequests = requests,
            TotalErrors = errors,
            ErrorRate = requests > 0 ? Math.Round((double)errors / requests * 100, 2) : 0,
            AverageResponseTimeMs = requests > 0 ? Math.Round((double)totalTime / requests, 2) : 0,
            StartTime = _startTime
        };
    }
}
