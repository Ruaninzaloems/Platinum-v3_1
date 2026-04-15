namespace SCM_API.Models.Common;

public class ApiResponse
{
    public bool IsSuccess { get; set; }
    public string? Message { get; set; }
    public List<string> Errors { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public static ApiResponse Ok(string? message = null)
    {
        return new ApiResponse { IsSuccess = true, Message = message };
    }

    public static ApiResponse Fail(string message, List<string>? errors = null)
    {
        return new ApiResponse { IsSuccess = false, Message = message, Errors = errors ?? new List<string>() };
    }
}

public class ApiResponse<T> : ApiResponse
{
    public T? Data { get; set; }

    public static ApiResponse<T> Ok(T data, string? message = null)
    {
        return new ApiResponse<T> { IsSuccess = true, Data = data, Message = message };
    }

    public new static ApiResponse<T> Fail(string message, List<string>? errors = null)
    {
        return new ApiResponse<T> { IsSuccess = false, Message = message, Errors = errors ?? new List<string>() };
    }
}

public class PagedApiResponse<T> : ApiResponse<IEnumerable<T>>
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }

    public static PagedApiResponse<T> FromPagedResult(PagedResult<T> result, string? message = null)
    {
        return new PagedApiResponse<T>
        {
            IsSuccess = true,
            Data = result.Items,
            Page = result.Page,
            PageSize = result.PageSize,
            TotalCount = result.TotalCount,
            TotalPages = result.TotalPages,
            Message = message
        };
    }
}

public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}
