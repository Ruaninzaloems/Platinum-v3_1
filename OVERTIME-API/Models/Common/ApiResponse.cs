namespace PlatinumOvertime_API.Models.Common;

public class ApiResponse<T>
{
    public bool IsSuccess { get; set; }
    public T? Data { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string> Errors { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public static ApiResponse<T> Success(T data, string message = "Success") =>
        new() { IsSuccess = true, Data = data, Message = message };

    public static ApiResponse<T> Failure(string message, List<string>? errors = null) =>
        new() { IsSuccess = false, Message = message, Errors = errors ?? new List<string>() };
}
