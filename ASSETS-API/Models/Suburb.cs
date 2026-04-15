namespace MssqlApi.Models;

public class Suburb
{
    public int Suburb_ID { get; set; }
    public string? SuburbName { get; set; }
    public int? TownID { get; set; }
    public bool? Enabled { get; set; }
}
