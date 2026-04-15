namespace MssqlApi.Models;

public class Building
{
    public int Building_ID { get; set; }
    public string? BuildingDesc { get; set; }
    public int? WardId { get; set; }
    public bool? Enabled { get; set; }
}
