using Microsoft.EntityFrameworkCore;
using SCM_API.Models.Common;

namespace SCM_API.Extensions;

public static class QueryableExtensions
{
    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> query, int page, int pageSize) where T : class
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<T>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public static async Task<PagedResult<TResult>> ToPagedResultAsync<T, TResult>(
        this IQueryable<T> query, int page, int pageSize, Func<T, TResult> selector) where T : class where TResult : class
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<TResult>
        {
            Items = items.Select(selector),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
}
