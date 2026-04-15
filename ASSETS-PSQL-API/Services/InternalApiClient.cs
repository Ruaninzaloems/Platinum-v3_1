using System.Net.Http.Json;
using System.Text.Json;

namespace AssetManagement.Services;

public class PlanProjectVoteDto
{
    public int PlanProjectItem_ID { get; set; }
    public int? SCOAItemID { get; set; }
    public int? ProjectID { get; set; }
    public int? SCOAFundId { get; set; }
    public int? SCOARegionId { get; set; }
    public int? SCOACostingID { get; set; }
    public int? SCOAFunctionId { get; set; }
    public int? DivisionId { get; set; }
    public int? ScoaProjectID { get; set; }
    public int? VoteId { get; set; }
    public string? PpiFinYear { get; set; }
    public int? PlanProjectId { get; set; }
}

public class ScmInvoiceWipRow
{
    public int InvoiceId { get; set; }
    public string? Description { get; set; }
    public string? InvoiceNumber { get; set; }
    public DateTime? InvoiceDate { get; set; }
    public int? VendorId { get; set; }
    public decimal Amount { get; set; }
    public decimal VatAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? DocNumber { get; set; }
    public string? PaymentReference { get; set; }
}

public class InternalApiClient
{
    private readonly HttpClient _http;
    private static readonly JsonSerializerOptions _opts = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public InternalApiClient(IHttpClientFactory factory)
    {
        _http = factory.CreateClient("internal");
    }

    public async Task<T?> GetAsync<T>(string path) where T : class
    {
        var response = await _http.GetAsync(path);
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound) return null;
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<T>(_opts);
    }

    public async Task<decimal> GetDecimalAsync(string path)
    {
        var response = await _http.GetAsync(path);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<decimal>(_opts);
    }

    public async Task<int?> GetNullableIntAsync(string path)
    {
        var response = await _http.GetAsync(path);
        if (response.StatusCode == System.Net.HttpStatusCode.NotFound) return null;
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<int?>(_opts);
    }

    public async Task<T?> PostAsync<T>(string path, object body) where T : class
    {
        var response = await _http.PostAsJsonAsync(path, body);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<T>(_opts);
    }

    public async Task PatchAsync(string path, object? body = null)
    {
        HttpContent content = body is null
            ? new StringContent("{}", System.Text.Encoding.UTF8, "application/json")
            : JsonContent.Create(body);
        var response = await _http.PatchAsync(path, content);
        response.EnsureSuccessStatusCode();
    }

    public async Task<PlanProjectVoteDto?> GetPpiVoteDataAsync(int ppiId, string finYear)
    {
        var ppi = await GetAsync<PlanProjectVoteDto>($"api/plan-project-items/{ppiId}/vote-data");
        if (ppi == null) return null;
        if (ppi.SCOAItemID.HasValue && !string.IsNullOrWhiteSpace(finYear))
        {
            ppi.VoteId = await GetNullableIntAsync(
                $"api/led-votes/vote-id?scoaItemId={ppi.SCOAItemID.Value}&finYear={Uri.EscapeDataString(finYear)}");
        }
        return ppi;
    }

    public async Task<Dictionary<int, PlanProjectVoteDto>> GetPpiVoteDataBatchAsync(IEnumerable<int> ids)
    {
        var arr = ids.Distinct().ToArray();
        if (arr.Length == 0) return new Dictionary<int, PlanProjectVoteDto>();
        var list = await PostAsync<List<PlanProjectVoteDto>>("api/plan-project-items/vote-data-batch", arr);
        var dict = (list ?? Enumerable.Empty<PlanProjectVoteDto>())
            .ToDictionary(r => r.PlanProjectItem_ID);

        var pairs = dict.Values
            .Where(p => p.SCOAItemID.HasValue && !string.IsNullOrWhiteSpace(p.PpiFinYear))
            .GroupBy(p => (p.SCOAItemID!.Value, p.PpiFinYear!))
            .Select(g => g.Key)
            .ToList();

        foreach (var (scoaItemId, ppiFinYear) in pairs)
        {
            var voteId = await GetNullableIntAsync(
                $"api/led-votes/vote-id?scoaItemId={scoaItemId}&finYear={Uri.EscapeDataString(ppiFinYear)}");
            foreach (var ppi in dict.Values.Where(p => p.SCOAItemID == scoaItemId && p.PpiFinYear == ppiFinYear))
                ppi.VoteId = voteId;
        }

        return dict;
    }
}
