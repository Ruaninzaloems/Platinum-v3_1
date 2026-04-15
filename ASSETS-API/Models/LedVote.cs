namespace MssqlApi.Models;

public class LedVote
{
    public int Vote_ID { get; set; }
    public string? Vote { get; set; }
    public string? VoteDescription { get; set; }
    public string? FinYear { get; set; }
    public bool? Enabled { get; set; }
}
