namespace MssqlApi.Models;

public class Street
{
    public int Street_ID { get; set; }
    public string? StreetName { get; set; }
    public int? SuburbID { get; set; }
    public bool? Enabled { get; set; }
}
