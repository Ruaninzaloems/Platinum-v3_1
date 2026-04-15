namespace AssetManagement.Models;

public class MeasurementType
{
    public int AssetConfig_MeasurementType_ID { get; set; }
    public string? Name { get; set; }
    public int? Default { get; set; } = 1;
    public int Enabled { get; set; } = 1;
    public int? CreatedByID { get; set; }
    public DateTime? CreatedDate { get; set; }
    public int? ModifiedByID { get; set; }
    public DateTime? ModiefiedDate { get; set; }
    public int? NoDepreciation { get; set; }
}
