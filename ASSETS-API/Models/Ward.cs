namespace MssqlApi.Models;

public class Ward
{
    public int Ward_Id { get; set; }
    public string? WardDescription { get; set; }
    public int? WardNumber { get; set; }
    public bool? Enabled { get; set; }
}
