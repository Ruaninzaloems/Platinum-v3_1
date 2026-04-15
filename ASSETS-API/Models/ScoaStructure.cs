namespace MssqlApi.Models;

public class ScoaStructure
{
    public int ScoaID { get; set; }
    public string? ScoaCode { get; set; }
    public string? Description { get; set; }
    public string? TableID { get; set; }
    public bool? Enabled { get; set; }
}
