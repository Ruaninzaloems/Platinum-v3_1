namespace PlatinumOvertime_API.Models.Common;

public class PaginatedResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }

    public static PaginatedResponse<T> Create(IEnumerable<T> source, int page, int pageSize)
    {
        var all = source as IList<T> ?? source.ToList();
        var skip = (page - 1) * pageSize;
        return new PaginatedResponse<T>
        {
            Items = all.Skip(skip).Take(pageSize).ToList(),
            Total = all.Count,
            Page = page,
            PageSize = pageSize
        };
    }
}
