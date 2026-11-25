using System.Text.Json.Serialization;

namespace AssetManagement.Models;

public class AssetType
{
    public int AssetType_ID { get; set; }
    public string? AssetTypeDesc { get; set; }
    public int Enabled { get; set; } = 1;
    public DateTime? DateCaptured { get; set; }
    public int? CapturerID { get; set; }
    public DateTime? DateModified { get; set; }
    public int? ModifierID { get; set; }
    public int? Default { get; set; } = 1;
    public int? RequireStatus { get; set; }
    [JsonPropertyName("noUsefulLife")]
    public int? NoUsefuleLife { get; set; }
}
