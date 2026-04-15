namespace MssqlApi.Models;

public class Floor
{
    public int Floor_ID { get; set; }
    public string? FloorDesc { get; set; }
    public int? BuildingID { get; set; }
    public bool? Enabled { get; set; }
}
