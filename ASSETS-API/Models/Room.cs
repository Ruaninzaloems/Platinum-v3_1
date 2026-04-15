namespace MssqlApi.Models;

public class Room
{
    public int Room_ID { get; set; }
    public string? RoomDesc { get; set; }
    public int? FloorID { get; set; }
    public bool? Enabled { get; set; }
}
